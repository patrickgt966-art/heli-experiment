// Devnet opening-auction test with synthetic wallets: before the end (open/paused/after) bid, change, cancel, limits,
// unauthorised accounts, and cancel/bid while the administrator has paused the program; after the end (final)
// finalize, claims with refunds at the clearing price, and the refused late, double and foreign actions.
// The operator key pays every fee and mints the worthless TEST-USDC; the synthetic bidder keys are created in
// <keydir> and hold no SOL. Rejected cases are sent with preflight off on purpose, so each refusal is a real
// failed transaction on Devnet that an explorer (and the Live/Verify pages) must show as failed.
// Key files stay outside the repository. Refuses any cluster other than Devnet.
//   node scripts/devnet_auction_day0.mjs open|paused|after|final --operator <op.json> --keydir <dir> --out <results.json>
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {web3,spl} from '../../mobile/deps.mjs';
import {heliInstruction,decodeAccount} from '../../mobile/solana.mjs';

const argv=process.argv.slice(2),flag=n=>{const i=argv.indexOf(n);return i>=0?argv[i+1]:undefined;};
const phase=argv[0],opFile=flag('--operator'),dir=flag('--keydir'),out=flag('--out');
if(!['open','paused','after','final'].includes(phase)||!opFile||!dir||!out)throw Error('usage: node scripts/devnet_auction_day0.mjs open|paused|after|final --operator <op.json> --keydir <dir> --out <results.json>');
const DEVNET='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const conn=new web3.Connection(flag('--rpc')??'https://api.devnet.solana.com','confirmed');
if(await conn.getGenesisHash()!==DEVNET)throw Error('Refusing: not Devnet');
const idl=JSON.parse(readFileSync(new URL('../idl.json',import.meta.url)));
const program=new web3.PublicKey(flag('--program')??'DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG');
const pda=(...s)=>web3.PublicKey.findProgramAddressSync(s.map(x=>typeof x==='string'?Buffer.from(x):x),program)[0];
const load=f=>web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(f,'utf8'))));
const op=load(opFile);mkdirSync(dir,{recursive:true});
const W=Object.fromEntries(['A','B','C','D','E','F'].map(n=>{const f=join(dir,`${n}.json`);
 if(!existsSync(f))writeFileSync(f,JSON.stringify(Array.from(web3.Keypair.generate().secretKey)),{mode:0o600});return [n,load(f)];}));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function retry(f){for(let i=0;;i++){try{return await f();}catch(e){if(i>=6)throw e;await sleep(1500*2**i);}}}
const read=async(k,t)=>{const a=await retry(()=>conn.getAccountInfo(k,'confirmed'));return a?decodeAccount(idl,t,a.data):null;};
const bal=async k=>{try{return (await retry(()=>spl.getAccount(conn,k,'confirmed'))).amount;}catch(e){if(e.name==='TokenAccountNotFoundError')return 0n;throw e;}};

const config=await read(pda('config'),'Config');const quoteMint=new web3.PublicKey(config.quote_mint);
const escrow=pda('auction-quote'),auctionKey=pda('opening-auction');
const ata=w=>spl.getAssociatedTokenAddressSync(quoteMint,w.publicKey);
const bidKey=w=>pda('auction-bid',w.publicKey.toBuffer());
const ix=(name,args,acc)=>heliInstruction(idl,program,name,args,{config:pda('config'),auction:auctionKey,quote_escrow:escrow,token_program:spl.TOKEN_PROGRAM_ID,system_program:web3.SystemProgram.programId,...acc});
const place=(w,q,t,o={})=>ix('place_auction_bid',{quantity_heli:q,tick:t},{bid:bidKey(w),bidder_quote:ata(w),bidder:w.publicKey,...o});
const cancel=(w,o={})=>ix('cancel_auction_bid',{},{bid:bidKey(w),bidder_quote:ata(w),bidder:w.publicKey,...o});
const create=w=>ix('create_auction_bid',{},{bid:bidKey(w),bidder:w.publicKey,account_payer:op.publicKey});

const results=existsSync(out)?JSON.parse(readFileSync(out,'utf8')):{program:program.toBase58(),quoteMint:quoteMint.toBase58(),operator:op.publicKey.toBase58(),
 wallets:Object.fromEntries(Object.entries(W).map(([n,w])=>[n,w.publicKey.toBase58()])),cases:[]};
let transactions=0,stateChecks=0;
// Sends without preflight, so a refused transaction is recorded on chain, then reads back its result.
async function send(ixs,signers){
 const tx=new web3.Transaction().add(...ixs);tx.feePayer=op.publicKey;
 tx.recentBlockhash=(await retry(()=>conn.getLatestBlockhash('confirmed'))).blockhash;tx.sign(op,...signers);
 const sig=await retry(()=>conn.sendRawTransaction(tx.serialize(),{skipPreflight:true,maxRetries:5}));transactions++;
 for(let i=0;i<60;i++){const t=await conn.getTransaction(sig,{commitment:'confirmed',maxSupportedTransactionVersion:0}).catch(()=>null);
  if(t){const logs=t.meta.logMessages??[];return {sig,ok:t.meta.err===null,error:t.meta.err?(logs.find(l=>/Error (Code|Message)|insufficient|failed:/.test(l))??JSON.stringify(t.meta.err)):null};}await sleep(2000);}
 return {sig,ok:false,error:'not confirmed within 120 s'};
}
async function run(id,what,expectOk,ixs,signers,checks=async()=>[]){
 if(results.cases.some(c=>c.id===id&&c.pass)){console.log(`  = ${id} already passed`);return;}
 const r=await send(ixs,signers);await sleep(800);
 const state=r.ok===expectOk?await checks():[];stateChecks+=state.length;
 const pass=r.ok===expectOk&&state.every(s=>s.ok);
 results.cases=results.cases.filter(c=>c.id!==id);results.cases.push({id,phase,what,expect:expectOk?'accepted':'refused',...r,state,pass});
 writeFileSync(out,JSON.stringify(results,(k,v)=>typeof v==='bigint'?v.toString():v,1)+'\n');
 console.log(`  ${pass?'PASS':'FAIL'} ${id} ${what}: ${r.ok?'accepted':'refused'}${r.error?` (${r.error})`:''} ${r.sig}`);
 for(const s of state)if(!s.ok)console.log(`       state ${s.what}: got ${s.got}, want ${s.want}`);
}
const eq=(what,got,want)=>({what,got:String(got),want:String(want),ok:String(got)===String(want)});
const price=async t=>{const a=await read(auctionKey,'OpeningAuction');return a.floor+a.tick_size*BigInt(t);};
// Snapshot helper: escrow, bidder quote, the bid and the demand at its tick.
async function snap(w,tick){const [e,b,bid,a]=await Promise.all([bal(escrow),bal(ata(w)),read(bidKey(w),'OpeningBid'),read(auctionKey,'OpeningAuction')]);return {e,b,bid,d:a.demand[tick]};}

console.log(`phase ${phase}; operator ${op.publicKey.toBase58()}; paused ${config.paused}`);
if(phase==='open'){
 if(config.paused)throw Error('Program is paused; run phase "paused" or unpause first');
 // TEST-USDC for the synthetic wallets (6 decimals): A,B 100; C,D 10; E 0.1.
 const fund={A:100_000_000n,B:100_000_000n,C:10_000_000n,D:10_000_000n,E:100_000n};
 for(const [n,amt] of Object.entries(fund)){const w=W[n],acc=ata(w);
  if(await bal(acc)>0n||(await read(bidKey(w),'OpeningBid')))continue;
  const r=await send([spl.createAssociatedTokenAccountIdempotentInstruction(op.publicKey,acc,w.publicKey,quoteMint),spl.createMintToInstruction(quoteMint,acc,op.publicKey,amt)],[]);
  console.log(`  funded ${n} ${Number(amt)/1e6} TEST-USDC ${r.ok?'':'FAILED '+r.error} ${r.sig}`);}
 const {A,B,C,D,E}=W;
 let s0=await snap(A,5);const p5=await price(5);
 await run('O1','A creates a bid account and bids 100,000 at tick 5',true,[create(A),place(A,100_000n,5)],[A],async()=>{const s=await snap(A,5);
  return [eq('escrow +collateral',s.e-s0.e,100_000n*p5),eq('A quote -collateral',s0.b-s.b,100_000n*p5),eq('bid active',s.bid.active,true),eq('bid qty',s.bid.quantity_heli,100_000n),eq('demand[5] +qty',s.d-s0.d,100_000n)];});
 await run('O2','A bids again while its bid is active',false,[place(A,1_000n,5)],[A]);
 s0=await snap(A,5);
 await run('O3','A cancels its bid (full refund)',true,[cancel(A)],[A],async()=>{const s=await snap(A,5);
  return [eq('escrow -collateral',s0.e-s.e,100_000n*p5),eq('A quote refunded',s.b-s0.b,100_000n*p5),eq('bid inactive',s.bid.active,false),eq('demand[5] -qty',s0.d-s.d,100_000n)];});
 s0=await snap(A,8);const p8=await price(8);
 await run('O4','A changes its bid: 120,000 at tick 8',true,[place(A,120_000n,8)],[A],async()=>{const s=await snap(A,8);
  return [eq('escrow +collateral',s.e-s0.e,120_000n*p8),eq('bid tick',s.bid.tick,8),eq('demand[8] +qty',s.d-s0.d,120_000n)];});
 s0=await snap(B,0);const p0=await price(0);
 await run('O5','B bids exactly the wallet cap (250,000) at tick 0',true,[create(B),place(B,250_000n,0)],[B],async()=>{const s=await snap(B,0);
  return [eq('escrow +collateral',s.e-s0.e,250_000n*p0),eq('demand[0] +qty',s.d-s0.d,250_000n)];});
 await run('O6','C creates its bid account',true,[create(C)],[C],async()=>[eq('C bid owner',(await read(bidKey(C),'OpeningBid')).owner,C.publicKey.toBase58())]);
 const cE=await bal(escrow);
 await run('O7','C bids 250,001 (over the 5% wallet cap)',false,[place(C,250_001n,0)],[C]);
 await run('O8','C bids at tick 256 (outside the 256 price levels)',false,[place(C,1_000n,256)],[C]);
 await run('O9','C bids quantity 0',false,[place(C,0n,0)],[C]);
 await run('O10','E bids 1,000 at tick 0 holding only 0.1 TEST-USDC (needs 0.2)',false,[create(E),place(E,1_000n,0)],[E],async()=>[eq('E has no bid account (whole tx reverted)',await read(bidKey(E),'OpeningBid'),null)]);
 await run('O11','D creates its bid account',true,[create(D)],[D]);
 await run('O12','D tries to cancel A\'s bid (passes A\'s bid account)',false,[cancel(D,{bid:bidKey(A)})],[D]);
 await run('O13','D bids paying from A\'s TEST-USDC account',false,[place(D,1_000n,0,{bidder_quote:ata(A)})],[D]);
 await run('O14','D bids into a fake escrow (its own token account)',false,[place(D,1_000n,0,{quote_escrow:ata(D)})],[D]);
 await run('O15','The operator (not the administrator) tries to pause the program',false,[heliInstruction(idl,program,'pause',{paused:true},{config:pda('config'),governance:pda('governance'),admin:op.publicKey})],[]);
 results.cases.push({id:'O7-O15 escrow',phase,what:'escrow unchanged by the refused bids',state:[eq('escrow',await bal(escrow),cE)],pass:(await bal(escrow))===cE});stateChecks++;
 s0=await snap(D,3);const p3=await price(3);
 await run('O16','D bids 10,000 at tick 3',true,[place(D,10_000n,3)],[D],async()=>{const s=await snap(D,3);return [eq('escrow +collateral',s.e-s0.e,10_000n*p3)];});
 await run('O17','C bids 1,000 at tick 0',true,[place(C,1_000n,0)],[C]);
}
if(phase==='paused'){
 if(!config.paused)throw Error('Program is not paused: the administrator runs "emergency.mjs pause --send" first');
 const {B,C}=W;
 await run('P1','C cancels while paused (allowed: money can always leave)',true,[cancel(C)],[C]);
 await run('P2','C bids again while paused',false,[place(C,1_000n,0)],[C]);
 const s0=await snap(B,0),p0=await price(0);
 await run('P3','B cancels its 250,000 bid while paused (full refund)',true,[cancel(B)],[B],async()=>{const s=await snap(B,0);
  return [eq('B quote refunded',s.b-s0.b,250_000n*p0),eq('escrow -collateral',s0.e-s.e,250_000n*p0),eq('bid inactive',s.bid.active,false)];});
}
if(phase==='after'){
 if(config.paused)throw Error('Still paused');
 const {B,C}=W;
 await run('U1','B bids again after the pause: 200,000 at tick 10',true,[place(B,200_000n,10)],[B]);
 await run('U2','C bids again after the pause: 1,000 at tick 0',true,[place(C,1_000n,0)],[C]);
}
if(phase==='final'){
 const now=Math.floor(Date.now()/1000);let a0=await read(auctionKey,'OpeningAuction');
 if(now<Number(a0.end))throw Error(`The auction ends at ${new Date(Number(a0.end)*1000).toISOString()}`);
 const {A,B,C,D,F}=W,mint=new web3.PublicKey(config.mint),inventory=pda('market-inventory'),proceeds=pda('auction-proceeds');
 const heliAta=w=>spl.getAssociatedTokenAddressSync(mint,w.publicKey);
 const finalize=()=>heliInstruction(idl,program,'finalize_auction',{},{config:pda('config'),auction:auctionKey,market_inventory:inventory});
 const claim=(w,o={})=>[spl.createAssociatedTokenAccountIdempotentInstruction(op.publicKey,heliAta(w),w.publicKey,mint),
  ix('claim_auction_bid',{},{market_inventory:inventory,sale_proceeds:proceeds,bid:bidKey(w),bidder_heli:heliAta(w),bidder_quote:ata(w),bidder:w.publicKey,...o})];
 const demand=a0.demand.reduce((x,y)=>x+y,0n);
 await run('F1','Anyone finalizes the auction after the end (operator signs, not the administrator)',true,[finalize()],[],async()=>{const a=await read(auctionKey,'OpeningAuction');
  return [eq('finalized',a.finalized,true),eq('clearing price = floor (demand below the offer)',a.clearing_price,a.floor),eq('sold = total demand',a.sold_heli,demand),eq('pending claims = active bids',a.pending_claims,a0.active_bids)];});
 await run('F2','Finalize a second time',false,[finalize()],[]);
 await run('F3','B cancels after the end',false,[cancel(B)],[B]);
 await run('F4','C bids after the end',false,[place(C,1_000n,0)],[C]);
 const a=await read(auctionKey,'OpeningAuction'),p=a.clearing_price;let paidTotal=0n;
 for(const [id,n,w] of [['F5','A',A],['F7','B',B],['F8','C',C],['F9','D',D]]){
  const bid=await read(bidKey(w),'OpeningBid'),coll=bid.quantity_heli*(a.floor+a.tick_size*BigInt(bid.tick)),pay=bid.quantity_heli*p;
  const q0=await bal(ata(w)),h0=await bal(heliAta(w)),e0=await bal(escrow),r0=await bal(proceeds);
  await run(id,`${n} claims ${bid.quantity_heli} tCHTA (bid at level ${bid.tick})`,true,claim(w),[w],async()=>{const b2=await read(bidKey(w),'OpeningBid');
   return [eq(`${n} receives tCHTA`,(await bal(heliAta(w)))-h0,bid.quantity_heli*1_000_000n),eq(`${n} refund = collateral - paid`,(await bal(ata(w)))-q0,coll-pay),
    eq('escrow -collateral',e0-(await bal(escrow)),coll),eq('proceeds +paid',(await bal(proceeds))-r0,pay),eq('bid claimed',b2.claimed,true)];});
  paidTotal+=pay;
  if(id==='F5')await run('F6','A claims a second time',false,claim(A),[A]);
 }
 await run('F10','F claims with its cancelled bid',false,claim(F),[F]);
 await run('F11','D claims into its own account using A\'s bid',false,claim(D,{bid:bidKey(A)}),[D]);
 const aEnd=await read(auctionKey,'OpeningAuction');
 const end=[eq('escrow empty',await bal(escrow),0n),eq('proceeds = sold x clearing price',await bal(proceeds),demand*p),eq('pending claims 0',aEnd.pending_claims,0n),
  eq('inventory = 5,000,000 offered - sold',await bal(inventory),(5_000_000n-demand)*1_000_000n)];stateChecks+=end.length;
 results.cases=results.cases.filter(c=>c.id!=='F-end');results.cases.push({id:'F-end',phase,what:'after all claims: escrow empty, proceeds and inventory match',state:end,pass:end.every(x=>x.ok)});
 console.log(`  ${end.every(x=>x.ok)?'PASS':'FAIL'} F-end ${end.map(x=>`${x.what}: ${x.got}`).join('; ')}`);
}
const a=await read(auctionKey,'OpeningAuction');
results.auction={active_bids:a.active_bids.toString(),escrow:(await bal(escrow)).toString(),demand:Object.fromEntries(a.demand.map((d,i)=>[i,d.toString()]).filter(([,d])=>d!=='0'))};
results.counts={...(results.counts??{}),[phase]:{transactions,stateChecks}};
writeFileSync(out,JSON.stringify(results,(k,v)=>typeof v==='bigint'?v.toString():v,1)+'\n');
const mine=results.cases.filter(c=>c.phase===phase);
console.log(`${mine.filter(c=>c.pass).length}/${mine.length} cases passed; ${transactions} transactions; ${stateChecks} state checks; written ${out}`);
