// End-to-end launch rehearsal on scripts/svm_rpc.py, a local LiteSVM chain with the compiled Charta ELF whose clock
// can be moved forward. One run covers the whole launch with the unchanged setup runner, the keeper engine and the
// website's own encoders and decoders:
//   setup (pre) → 40 funded bids, replacements and refused bids → freeze window → keeper finalizes → setup (post)
//   → every winner claims → transfers between holders → upgrade key moved to the recovery key → three months of
//   keeper maintenance → a fixed technical expense after its seven-day wait.
// Every amount is recomputed independently from the program rules (auction.rs) and compared; supply and vault
// invariants are checked after each phase. Synthetic keys and a synthetic quote mint only; refuses any RPC that is
// not the local rehearsal chain.
//   python scripts/svm_rpc.py --upgrade-authority <ADMIN_PUBKEY> --pretend-devnet &
//   node scripts/rehearsal.mjs <workdir>      (workdir contains admin.json; keys and rehearsal-report.json go there)
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {web3,spl} from '../../mobile/deps.mjs';
import {heliInstruction,decodeAccount} from '../../mobile/solana.mjs';
import * as core from '../../website/auction-core.js';
import * as H from '../../website/holders-core.js';
import * as V from '../../website/verify-core.js';
import {KeeperEngine} from '../../keeper/engine.mjs';
import {SolanaAdapter} from '../../keeper/adapter.mjs';
import {boundary} from '../../keeper/calendar.mjs';

const RPC='http://127.0.0.1:8899',work=process.argv[2];
if(!work||!existsSync(`${work}/admin.json`))throw Error('usage: node scripts/rehearsal.mjs <workdir with admin.json>');
const here=fileURLToPath(new URL('.',import.meta.url));
const conn=new web3.Connection(RPC,'confirmed');
const rpc=async(method,params=[])=>{const r=await (await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})})).json();if(r.error)throw Error(r.error.message);return r.result;};
if(!(await rpc('getVersion'))['solana-core'].includes('charta-rehearsal'))throw Error('Refusing: not the local rehearsal chain');
const chainNow=async()=>(await rpc('charta_clock')).unixTimestamp, warp=t=>rpc('charta_warp',[t]);

const PROGRAM=new web3.PublicKey('HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv'),UNIT=1_000_000n,OFFER=5_000_000n,CAP=250_000n;
const idl=JSON.parse(readFileSync(new URL('../idl.json',import.meta.url)));
const compiled=JSON.parse(readFileSync(new URL('../compiled-source.json',import.meta.url)));
const elfLength=readFileSync(new URL('../heli_core_v20.so',import.meta.url)).length;
const pda=(...s)=>web3.PublicKey.findProgramAddressSync(s.map(x=>typeof x==='string'?Buffer.from(x):x),PROGRAM)[0];
const load=f=>web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(f))));
const save=(f,k)=>{writeFileSync(f,JSON.stringify([...k.secretKey]),{mode:0o600});return k;};
const key=n=>existsSync(`${work}/${n}.json`)?load(`${work}/${n}.json`):save(`${work}/${n}.json`,web3.Keypair.generate());
let seed=20261006;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);

const checks=[],failures=[],phases=[];
const check=(name,ok,detail='')=>{checks.push(name);if(!ok){failures.push(`${name} ${detail}`);console.log(`  ✕ ${name} ${detail}`);}};
const phase=name=>{phases.push(name);console.log(`\n== ${name}`);};
const sendTx=(ixs,signers)=>web3.sendAndConfirmTransaction(conn,new web3.Transaction().add(web3.ComputeBudgetProgram.setComputeUnitLimit({units:1_400_000}),...ixs),signers,{commitment:'confirmed'});
const refused=async(label,ixs,signers,pattern)=>{try{await sendTx(ixs,signers);check(`refused: ${label}`,false,'(it succeeded)');}catch(e){const logs=(e.logs??[]).join('\n')+String(e.message);check(`refused: ${label}`,!pattern||pattern.test(logs),logs.slice(-160));}};
const read=async(k,type)=>{const a=await conn.getAccountInfo(k,'confirmed');return a?decodeAccount(idl,type,a.data):null;};
const tokenAmount=async k=>{const a=await conn.getAccountInfo(k,'confirmed');return a?a.data.readBigUInt64LE(64):0n;};

// --- keys and funding
const admin=load(`${work}/admin.json`),recovery=key('recovery'),keeperKey=key('keeper'),mallory=key('mallory');
const bidders=Array.from({length:40},(_,i)=>key(`bidder-${i}`));
phase('Funding synthetic accounts');
for(const k of [admin,keeperKey,mallory,...bidders])await conn.confirmTransaction(await conn.requestAirdrop(k.publicKey,k===admin?100e9:5e9),'confirmed');
const quote=await spl.createMint(conn,admin,admin.publicKey,null,6);
const quoteAta=async owner=>(await spl.getOrCreateAssociatedTokenAccount(conn,admin,quote,owner)).address;
const startUsdc=2_000n*UNIT;
for(const k of [...bidders,mallory])await spl.mintTo(conn,admin,quote,await quoteAta(k.publicKey),admin,startUsdc);
console.log(`  quote mint ${quote.toBase58()}, ${bidders.length} bidders with 2,000 USDC each`);

// --- setup runner, phase pre (unchanged script)
const start=(await chainNow())+8*86400+1800,marketFile=`${work}/market.json`;key('market');
const setup={rpcUrl:RPC,localValidator:true,program:PROGRAM.toBase58(),adminKeyFile:`${work}/admin.json`,recovery:recovery.publicKey.toBase58(),quoteMint:quote.toBase58(),start,
 minimumQuoteDepth:25_000_000,metadata:{name:'Charta',symbol:'CHTA',uri:'https://heli-experiment.pages.dev/token.json'},auction:{floor:200,tick:10},marketKeyFile:marketFile,
 marketRentLamports:10_000_000,feeVaults:{monthlyCap:1_000_000_000,reserve:0,projectFloor:120_000_000},releaseSeatRentLamports:10_000_000,managementRentLamports:10_000_000,keeperConfigOut:`${work}/keeper.json`};
writeFileSync(`${work}/setup.json`,JSON.stringify(setup,null,1));
const runner=ph=>execFileSync(process.execPath,[`${here}devnet_setup.mjs`,`${work}/setup.json`,ph,'--send'],{encoding:'utf8'});
phase('Setup runner, phase pre');
const pre=runner('pre');console.log(pre.split('\n').filter(l=>/✔|✓/.test(l)).map(l=>'  '+l.trim().split(' ').slice(0,3).join(' ')).join('\n'));
const config=pda('config'),mint=pda('mint'),inventory=pda('market-inventory'),escrow=pda('auction-quote'),proceeds=pda('auction-proceeds'),auctionKey=pda('opening-auction');
const invariants=async label=>{
 const c=await read(config,'Config'),m=await conn.getAccountInfo(mint);const supply=m.data.readBigUInt64LE(36);
 const all=await conn.getProgramAccounts(spl.TOKEN_PROGRAM_ID,{filters:[{dataSize:165},{memcmp:{offset:0,bytes:mint.toBase58()}}]});
 const sum=all.reduce((s,a)=>s+a.account.data.readBigUInt64LE(64),0n);
 check(`${label}: supply is 90,000,000 CHTA`,supply===90_000_000n*UNIT,String(supply));
 check(`${label}: all CHTA token accounts add up to the supply`,sum===supply,`${sum} vs ${supply}`);
 check(`${label}: minting is switched off`,m.data.readUInt32LE(0)===0);
 check(`${label}: reserve vault equals the reserve stock`,(await tokenAmount(pda('vault',Buffer.from([0]))))===BigInt(c.stocks[0]));
 check(`${label}: treasury vault equals the treasury stock`,(await tokenAmount(pda('vault',Buffer.from([3]))))===BigInt(c.stocks[3]));
 check(`${label}: reserve ≤ 70M and treasury ≤ 15M`,BigInt(c.stocks[0])<=70_000_000n*UNIT&&BigInt(c.stocks[3])<=15_000_000n*UNIT);
 return {config:c,accounts:all};
};
await invariants('after setup');

// --- bidding, with the website's encoders
phase('Opening auction: 40 bidders');
await core.ready();
const quoteKey=quote.toBase58(),mintKey=mint.toBase58();
const A=k=>core.addresses(web3,PROGRAM.toBase58(),mintKey,quoteKey,k.publicKey);
const ledger=new Map();
const priceAt=t=>200n+10n*BigInt(t);
for(const [i,b] of bidders.entries()){
 const qty=BigInt(Math.min(250_000,60_000+Math.floor(rand()**1.4*190_000))),tick=Math.floor(rand()*40);
 await sendTx([core.createBidIx(web3,A(b)),core.placeBidIx(web3,A(b),qty,tick)],[b]);ledger.set(i,{qty,tick,active:true});
}
for(const i of [3,7,11,19,23,31]){  // replacements, as the page does: cancel then place in one transaction
 const b=bidders[i],qty=BigInt(30_000+Math.floor(rand()*200_000)),tick=Math.floor(rand()*40);
 await sendTx([core.cancelBidIx(web3,A(b)),core.placeBidIx(web3,A(b),qty,tick)],[b]);ledger.set(i,{qty,tick,active:true});
}
await sendTx([core.cancelBidIx(web3,A(bidders[39]))],[bidders[39]]);ledger.get(39).active=false;
const mA=A(mallory),raw=(name,args)=>heliInstruction(idl,PROGRAM,name,args,{config,auction:auctionKey,bid:mA.bid,quote_escrow:escrow,bidder_quote:mA.bidderQuote,bidder:mallory.publicKey,account_payer:mallory.publicKey,token_program:spl.TOKEN_PROGRAM_ID,system_program:web3.SystemProgram.programId});
await sendTx([core.createBidIx(web3,mA)],[mallory]);
await refused('a bid above 250,000 CHTA',[raw('place_auction_bid',{quantity_heli:250_001,tick:0})],[mallory],/Quota/);
await refused('a price level beyond the 256 levels',[raw('place_auction_bid',{quantity_heli:10,tick:256})],[mallory],/Quota/);
await sendTx([core.placeBidIx(web3,mA,1_000n,0)],[mallory]);ledger.set('mallory',{qty:1_000n,tick:0,active:true,key:mallory});
await refused('a second bid on top without cancelling',[raw('place_auction_bid',{quantity_heli:1_000,tick:1})],[mallory],/State/);
await refused("cancelling someone else's bid",[core.cancelBidIx(web3,{...A(bidders[0]),bidder:mallory.publicKey})],[mallory]);
const auction0=core.decodeAuction((await conn.getAccountInfo(auctionKey)).data);
const demand=Array(256).fill(0n);for(const l of ledger.values())if(l.active)demand[l.tick]+=l.qty;
check('auction demand per level equals the bids placed',auction0.demand.every((d,i)=>d===demand[i]));
const locked=[...ledger.values()].filter(l=>l.active).reduce((s,l)=>s+l.qty*priceAt(l.tick),0n);
check('escrow holds exactly the collateral of active bids',(await tokenAmount(escrow))===locked,`${await tokenAmount(escrow)} vs ${locked}`);
console.log(`  ${[...ledger.values()].filter(l=>l.active).length} active bids, total ${demand.reduce((a,b)=>a+b,0n)} CHTA, ${Number(locked)/1e6} USDC locked`);

phase('Final five minutes');
await warp(start-200);
await refused('a new bid in the final five minutes',[core.placeBidIx(web3,A(bidders[39]),10_000n,5)],[bidders[39]]);
await refused('a cancellation in the final five minutes',[core.cancelBidIx(web3,A(bidders[0]))],[bidders[0]]);

// --- keeper (engine and adapter as in run.mjs, journal kept in memory)
const manifestData=(await conn.getAccountInfo(new web3.PublicKey((await conn.getAccountInfo(new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms'))).data.subarray(4,36)))).data;
const manifestElf=readFileSync(new URL('../../manifest-integration/vendor-manifest/manifest-release-v3.0.24.so',import.meta.url));
const trust=heliAuthority=>({admin:admin.publicKey.toBase58(),heliUpgradeAuthority:heliAuthority,manifestUpgradeAuthority:manifestData[12]===1?new web3.PublicKey(manifestData.subarray(13,45)).toBase58():null,
 manifestHash:createHash('sha256').update(manifestElf).digest('hex'),manifestLength:manifestElf.length});
const journal={pending:null,budgets:{},save(){}};
let engine=new KeeperEngine({adapter:new SolanaAdapter({connection:conn,program:PROGRAM.toBase58(),payer:keeperKey,trust:trust(admin.publicKey.toBase58())}),state:journal,dryRun:false});
const keeperLog=[];
const runKeeper=async(limit=12)=>{let r;for(let i=0;i<limit;i++){try{r=await engine.step();}catch(e){keeperLog.push('error '+e.message);console.log('  keeper error: '+e.message);return {status:'error'};}
 if(r.status!=='idle'){const line=`${r.status}${r.job?' '+r.job.name+(r.job.number?' '+r.job.number:''):''}${r.reason?' ('+r.reason+')':''}`;keeperLog.push(line);console.log('  keeper: '+line);}
 if(['idle','blocked','backoff','budget-exhausted','insufficient-balance','essential-reserve'].includes(r.status)&&!journal.pending)return r;}return r;};

phase('Auction end: the keeper finalizes');
await warp(start+30);await runKeeper();
const fin=core.decodeAuction((await conn.getAccountInfo(auctionKey)).data);
check('keeper finalized the auction',fin.finalized);
// Independent clearing computation (auction.rs finalize).
const total=demand.reduce((a,b)=>a+b,0n);let tick=0,above=0n,marginalAtoms=demand[0]*UNIT,marginalDemand=demand[0];
if(total>=OFFER)for(let i=255;i>=0;i--){if(above+demand[i]>=OFFER){tick=i;marginalAtoms=(OFFER-above)*UNIT;marginalDemand=demand[i];break;}above+=demand[i];}
const clearing=total>0n?priceAt(tick):0n;
check('clearing level matches an independent computation',fin.clearingTick===tick,`${fin.clearingTick} vs ${tick}`);
check('clearing price matches',fin.clearingPrice===clearing,`${fin.clearingPrice} vs ${clearing}`);
check('sold amount matches',fin.sold===(total<OFFER?total:OFFER));
console.log(`  clearing price ${Number(clearing)/1e6} USDC at level ${tick}; ${total>=OFFER?'oversubscribed':'undersubscribed'} (${total} CHTA bid)`);

phase('Setup runner, phase post');
const post=runner('post');console.log(post.split('\n').filter(l=>/✔|✓/.test(l)).map(l=>'  '+l.trim().split(' ').slice(0,3).join(' ')).join('\n'));

// --- claims
phase('Every bidder claims');
const final=core.decodeAuction((await conn.getAccountInfo(auctionKey)).data);check('the auction is finalized before claims',final.finalized);Object.assign(fin,final);
const est=core.estimate({...fin,demand:fin.demand});let gotTotal=0n,paidTotal=0n,labels={};
for(const [id,l] of ledger){
 if(!l.active)continue;const b=id==='mallory'?mallory:bidders[id],W=A(b);
 const expected=l.tick<tick?0n:l.tick>tick?l.qty*UNIT:(marginalAtoms*l.qty)/marginalDemand;
 const label=core.bidStatus(fin,est,{active:true,tick:l.tick,quantity:l.qty});labels[label]=(labels[label]??0)+1;
 check(`page label agrees with the allocation (${label})`,label==='filled'?expected===l.qty*UNIT:label==='partly filled'?expected>0n&&expected<l.qty*UNIT:label==='outbid'?expected===0n:false);
 const usdc0=await tokenAmount(W.bidderQuote);
 await sendTx([core.createAtaIdempotentIx(web3,b.publicKey,W.bidderToken,b.publicKey,W.mint),core.claimIx(web3,W)],[b]);
 const got=await tokenAmount(W.bidderToken),paid=(expected*clearing+UNIT-1n)/UNIT,refund=l.qty*priceAt(l.tick)-paid;
 check('claimed CHTA equals the program rule',got===expected,`${got} vs ${expected}`);
 check('USDC refund equals collateral minus the clearing price',(await tokenAmount(W.bidderQuote))-usdc0===refund);
 gotTotal+=got;paidTotal+=paid;l.got=got;
}
await refused('claiming twice',[core.claimIx(web3,A(bidders[0]))],[bidders[0]]);
check('escrow is empty after all claims',(await tokenAmount(escrow))===0n);
check('auction proceeds equal what winners paid',(await tokenAmount(proceeds))===paidTotal,`${await tokenAmount(proceeds)} vs ${paidTotal}`);
check('inventory equals 5M minus what was claimed',(await tokenAmount(inventory))===OFFER*UNIT-gotTotal);
check('claimed total does not exceed the sold amount',gotTotal<=fin.sold*UNIT);
console.log(`  ${Number(gotTotal)/1e6} CHTA claimed, ${Number(paidTotal)/1e6} USDC paid; labels ${JSON.stringify(labels)}`);

// --- transfers between holders, then the website's holder map logic on the chain's own data
phase('Transfers between holders');
const winners=[...ledger].filter(([id,l])=>id!=='mallory'&&l.got>0n).map(([id])=>bidders[id]);
const transfers=[[0,1],[0,2],[5,6]].filter(([x,y])=>winners[x]&&winners[y]);
for(const [x,y] of transfers){
 const from=winners[x],to=winners[y],src=A(from).bidderToken,dst=A(to).bidderToken;
 await sendTx([spl.createTransferInstruction(src,dst,from.publicKey,1_000n*UNIT)],[from]);
}
const snap=await invariants('after claims and transfers');
const holders=H.groupHolders(snap.accounts.map(a=>({address:a.pubkey.toBase58(),owner:new web3.PublicKey(a.account.data.subarray(32,64)).toBase58(),amount:a.account.data.readBigUInt64LE(64)})),
 {byAddress:{[pda('vault',Buffer.from([0])).toBase58()]:{kind:'reserve'},[pda('vault',Buffer.from([3])).toBase58()]:{kind:'treasury'},[inventory.toBase58()]:{kind:'inventory'}},byOwner:{[config.toBase58()]:{kind:'project'}},
  isProgramOwned:o=>!web3.PublicKey.isOnCurve(new web3.PublicKey(o).toBytes())});
const holderWallets=new Set([...ledger].filter(([,l])=>l.got>0n).map(([id])=>(id==='mallory'?mallory:bidders[id]).publicKey.toBase58()));
check('holder map: one wallet bubble per holder',H.stats(holders).wallets===holderWallets.size,`${H.stats(holders).wallets} vs ${holderWallets.size}`);
check('holder map: CHTA in wallets equals what was claimed',H.stats(holders).inWallets===gotTotal);
const txs=[];for(const w of winners.slice(0,8))for(const s of await conn.getSignaturesForAddress(A(w).bidderToken,{limit:15}))txs.push(await conn.getParsedTransaction(s.signature,{maxSupportedTransactionVersion:0}));
const links=H.linksFromTransactions(txs,mint.toBase58(),holderWallets);
check('holder map: each wallet-to-wallet transfer becomes a line (claims do not)',links.length===transfers.length,`${links.length} vs ${transfers.length}`);

// --- step 15 of the deployment: the upgrade key moves to the offline recovery key
phase('Upgrade key to the recovery key');
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),programData=web3.PublicKey.findProgramAddressSync([PROGRAM.toBuffer()],LOADER)[0];
await sendTx([new web3.TransactionInstruction({programId:LOADER,data:Buffer.from([4,0,0,0]),keys:[{pubkey:programData,isSigner:false,isWritable:true},{pubkey:admin.publicKey,isSigner:true,isWritable:false},{pubkey:recovery.publicKey,isSigner:false,isWritable:false}]})],[admin]);
const pdInfo=await conn.getAccountInfo(programData),progInfo=await conn.getAccountInfo(PROGRAM);
const P=V.readProgram({...progInfo,ownerBase58:progInfo.owner.toBase58()}),PD=V.readProgramData({...pdInfo,ownerBase58:pdInfo.owner.toBase58()});
const code=await V.checkCode(PD.code,{sha256:compiled.binary_sha256,length:elfLength},async b=>createHash('sha256').update(b).digest('hex'));
check('verify page logic: program account accepted',P.ok);check('verify page logic: code matches the published build',code.state==='ok');
check('verify page logic: upgrade key is now the recovery key',PD.ok&&new web3.PublicKey(PD.authority).equals(recovery.publicKey));
engine=new KeeperEngine({adapter:new SolanaAdapter({connection:conn,program:PROGRAM.toBase58(),payer:keeperKey,trust:trust(recovery.publicKey.toBase58())}),state:journal,dryRun:false});

// --- monthly maintenance by the keeper
phase('Three months of keeper maintenance');
for(let m=0;m<=3;m++){
 await warp(Math.max(await chainNow(),boundary(start,m)+120));const r=await runKeeper(20);
 const c=await read(config,'Config');console.log(`  month boundary ${m}: settled month ${c.last_settled_epoch}, keeper ${r?.status}`);
}
const after=await invariants('after three months');
check('the keeper settled three months',Number(after.config.last_settled_epoch)>=3,String(after.config.last_settled_epoch));

// --- a fixed technical expense after its seven-day wait
phase('Fixed technical expense (12 USDC)');
const fee={config,operations:pda('operations'),quote_mint:quote,fee_quote:pda('fee-quote'),sale_proceeds:proceeds,token_program:spl.TOKEN_PROGRAM_ID,system_program:web3.SystemProgram.programId};
const dest=await quoteAta(admin.publicKey),nonce=BigInt((await read(pda('operations'),'Operations')).next_nonce),expense=pda('expense',Buffer.from(new BigUint64Array([nonce]).buffer));
await sendTx([heliInstruction(idl,PROGRAM,'propose_expense',{nonce,amount:12_000_000n,purpose:Array(32).fill(7),fixed:true},{...fee,expense,destination:dest,proposer:admin.publicKey})],[admin]);
await refused('paying an expense before its seven-day wait',[heliInstruction(idl,PROGRAM,'execute_expense',{},{...fee,expense,destination:dest})],[keeperKey]);
await warp((await chainNow())+7*86400+60);
const before=await tokenAmount(dest);
await sendTx([heliInstruction(idl,PROGRAM,'execute_expense',{},{...fee,expense,destination:dest})],[keeperKey]);
check('the fixed expense paid exactly 12 USDC',(await tokenAmount(dest))-before===12_000_000n);
await invariants('at the end');

const report={date:new Date().toISOString(),chain:'local LiteSVM rehearsal chain (scripts/svm_rpc.py), synthetic keys and quote mint',elf:compiled.binary_sha256,phases,
 bidders:bidders.length,clearing:{level:tick,priceUsdc:Number(clearing)/1e6,demand:String(total),claimedChta:Number(gotTotal)/1e6,paidUsdc:Number(paidTotal)/1e6,labels},
 keeper:keeperLog,checks:checks.length,failures};
writeFileSync(`${work}/rehearsal-report.json`,JSON.stringify(report,null,1));
console.log(`\n${checks.length} checks, ${failures.length} failures`);
if(failures.length){console.log(failures.join('\n'));process.exit(1);}
