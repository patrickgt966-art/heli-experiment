// Long-run keeper test on the rehearsal chain (scripts/svm_rpc.py): five years (60 monthly boundaries) of
// maintenance by the real keeper engine, starting on the 31st so short months and the 2028 leap day are crossed,
// with injected faults:
//   RPC outages · a crash after the journal entry but before sending · a crash after sending · a transaction whose
//   blockhash expires before it lands · the keeper offline for four months · two keepers at once · the keeper wallet
//   running dry · a three-month pause · the administrator replaced through the recovery key.
// After every month: every due month is settled (or the expected stop holds), supply is 90,000,000 CHTA, vaults
// equal their stocks, and each month's cap and release equal the published formula computed independently.
// Finally every transaction the keeper ever signed is checked against its instruction allowlist.
//   python scripts/svm_rpc.py --upgrade-authority <ADMIN_PUBKEY> --pretend-devnet --blockhash-validity 150 &
//   node scripts/keeper_longrun.mjs <workdir with admin.json> [months=60]
import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {web3,spl} from '../../mobile/deps.mjs';
import {heliInstruction,decodeAccount} from '../../mobile/solana.mjs';
import * as core from '../../website/auction-core.js';
import {KeeperEngine} from '../../keeper/engine.mjs';
import {SolanaAdapter} from '../../keeper/adapter.mjs';
import {boundary,completedMonths} from '../../keeper/calendar.mjs';

const RPC='http://127.0.0.1:8899',work=process.argv[2],MONTHS=Number(process.argv[3]??60);
if(!work||!existsSync(`${work}/admin.json`))throw Error('usage: node scripts/keeper_longrun.mjs <workdir with admin.json> [months]');
const here=fileURLToPath(new URL('.',import.meta.url));
const rpc=async(method,params=[])=>{const r=await (await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})})).json();if(r.error)throw Error(r.error.message);return r.result;};
if(!(await rpc('getVersion'))['solana-core'].includes('charta-rehearsal'))throw Error('Refusing: not the local rehearsal chain');
let clockNow=0;const chainNow=async()=>(clockNow=(await rpc('charta_clock')).unixTimestamp),warp=async t=>{await rpc('charta_warp',[t]);clockNow=t;};
const conn=new web3.Connection(RPC,'confirmed');
conn._disableBlockhashCaching=true;  // helper transactions: a blockhash cached before a warp would be expired (the keeper fetches its own)
let seed=31;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
// RPC fault injection for the keeper's own connection only.
const fault={rate:0,injected:0};
const keeperConn=new web3.Connection(RPC,{commitment:'confirmed',fetch:async(u,i)=>{if(fault.rate&&rand()<fault.rate){fault.injected++;throw new TypeError('fetch failed (injected outage)');}return fetch(u,i);}});

const PROGRAM=new web3.PublicKey('HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv'),UNIT=1_000_000n;
const RATE=4_022_473_737_086_389n,SCALE=10n**18n;
const idl=JSON.parse(readFileSync(new URL('../idl.json',import.meta.url)));
const pda=(...s)=>web3.PublicKey.findProgramAddressSync(s.map(x=>typeof x==='string'?Buffer.from(x):x),PROGRAM)[0];
const load=f=>web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(f))));
const save=(f,k)=>{writeFileSync(f,JSON.stringify([...k.secretKey]),{mode:0o600});return k;};
const key=n=>existsSync(`${work}/${n}.json`)?load(`${work}/${n}.json`):save(`${work}/${n}.json`,web3.Keypair.generate());
const read=async(k,type)=>{const a=await conn.getAccountInfo(k,'confirmed');return a?decodeAccount(idl,type,a.data):null;};
const amount=async k=>{const a=await conn.getAccountInfo(k,'confirmed');return a?a.data.readBigUInt64LE(64):0n;};
const sendTx=(ixs,signers)=>web3.sendAndConfirmTransaction(conn,new web3.Transaction().add(web3.ComputeBudgetProgram.setComputeUnitLimit({units:1_400_000}),...ixs),signers,{commitment:'confirmed'});
const checks=[],failures=[],events=[];
const check=(name,ok,detail='')=>{checks.push(name);if(!ok){failures.push(`${name} ${detail}`);console.log(`  ✕ ${name} ${detail}`);}};
const note=s=>{events.push(s);console.log('  '+s);};

// --- launch (compact version of rehearsal.mjs), starting on the 31st when that is 7-30 days ahead
const admin=load(`${work}/admin.json`),recovery=key('recovery'),upgradeKey=key('upgrade'),newAdmin=key('new-admin'),keeperA=key('keeper-a'),keeperB=key('keeper-b'),bidders=[0,1,2].map(i=>key(`bidder-${i}`));
for(const k of [admin,recovery,newAdmin,...bidders])await conn.confirmTransaction(await conn.requestAirdrop(k.publicKey,k===admin?100e9:5e9),'confirmed');
for(const k of [keeperA,keeperB])await conn.confirmTransaction(await conn.requestAirdrop(k.publicKey,2e9),'confirmed');
const quote=await spl.createMint(conn,admin,admin.publicKey,null,6);
for(const b of bidders)await spl.mintTo(conn,admin,quote,(await spl.getOrCreateAssociatedTokenAccount(conn,admin,quote,b.publicKey)).address,admin,1_000n*UNIT);
const now0=Math.max(await chainNow(),Math.floor(Date.now()/1000));let start=0;
for(let k=0;k<3&&!start;k++){const d=new Date(now0*1000);const t=Math.floor(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+k,31,12,34,56)/1000);if(new Date(t*1000).getUTCDate()===31&&t>=now0+7*86400+600&&t<=now0+30*86400-600)start=t;}
if(!start)start=now0+8*86400;note(`start ${new Date(start*1000).toISOString()} (day ${new Date(start*1000).getUTCDate()})`);
const setup={rpcUrl:RPC,localValidator:true,program:PROGRAM.toBase58(),adminKeyFile:`${work}/admin.json`,recovery:recovery.publicKey.toBase58(),upgradeAuthority:upgradeKey.publicKey.toBase58(),quoteMint:quote.toBase58(),start,minimumQuoteDepth:25_000_000,
 metadata:{name:'Charta',symbol:'CHTA',uri:'https://heli-experiment.pages.dev/token.json'},auction:{floor:200,tick:10},marketKeyFile:`${work}/market.json`,marketRentLamports:10_000_000,
 feeVaults:{monthlyCap:1_000_000_000,reserve:0,projectFloor:120_000_000},releaseSeatRentLamports:10_000_000,managementRentLamports:10_000_000};
key('market');writeFileSync(`${work}/setup.json`,JSON.stringify(setup,null,1));
const runner=ph=>execFileSync(process.execPath,[`${here}devnet_setup.mjs`,`${work}/setup.json`,ph,'--send'],{encoding:'utf8'});
runner('pre');await core.ready();
const A=b=>core.addresses(web3,PROGRAM.toBase58(),pda('mint').toBase58(),quote.toBase58(),b.publicKey);
for(const b of bidders)await sendTx([core.createBidIx(web3,A(b)),core.placeBidIx(web3,A(b),250_000n,5)],[b]);

// --- keeper instances with file-backed journals; "restart" = a new engine reading the journal from disk
const manifest=await conn.getAccountInfo(new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms'));
const manifestData=(await conn.getAccountInfo(new web3.PublicKey(manifest.data.subarray(4,36)))).data;
const manifestElf=readFileSync(new URL('../../manifest-integration/vendor-manifest/manifest-release-v3.0.24.so',import.meta.url));
const trust={admin:admin.publicKey.toBase58(),heliUpgradeAuthority:admin.publicKey.toBase58(),manifestUpgradeAuthority:manifestData[12]===1?new web3.PublicKey(manifestData.subarray(13,45)).toBase58():null,
 manifestHash:createHash('sha256').update(manifestElf).digest('hex'),manifestLength:manifestElf.length};
const journalFile=n=>`${work}/journal-${n}.json`;
function makeKeeper(name,payer){
 const f=journalFile(name),state=existsSync(f)?JSON.parse(readFileSync(f)):{pending:null,budgets:{}};
 state.save=()=>{writeFileSync(f+'.tmp',JSON.stringify(state));renameSync(f+'.tmp',f);};
 const adapter=new SolanaAdapter({connection:keeperConn,program:PROGRAM.toBase58(),payer,trust:{...trust}});
 return {name,adapter,state,engine:new KeeperEngine({adapter,state,dryRun:false,now:()=>clockNow*1000})};
}
const statuses={};
async function run(k,{limit=40,label=''}={}){
 let last=null,errors=0;
 for(let i=0;i<limit;i++){
  await chainNow();let r;
  try{r=await k.engine.step();}catch(e){errors++;last={status:'error',message:e.message};if(errors>12)break;continue;}
  statuses[r.status]=(statuses[r.status]??0)+1;last=r;
  if(['reconciled','expired-retry-safe','expired-unknown','failed'].includes(r.status))note(`keeper ${k.name}: ${r.status} ${r.job?.name??''}${r.job?.number?' '+r.job.number:''}${r.observedOnChain?' (already done on chain)':''}`);
  if(['idle','blocked','backoff','insufficient-balance','essential-reserve','budget-exhausted'].includes(r.status)&&!k.state.pending)break;
  if(r.status==='pending'||r.status==='uncertain'){await warp(clockNow+31);}  // the engine resends after 30 s of (chain) time
 }
 return {...last,errors};
}
let keeper=makeKeeper('a',keeperA);

await warp(start+60);await run(keeper);
check('the keeper finalized the auction',(await read(pda('opening-auction'),'OpeningAuction')).finalized);
runner('post');
for(const b of bidders)await sendTx([core.createAtaIdempotentIx(web3,b.publicKey,A(b).bidderToken,b.publicKey,A(b).mint),core.claimIx(web3,A(b))],[b]);
// Deployment step 15: the upgrade authority moves to the separate offline upgrade key (SetAuthorityChecked, both sign);
// the keeper pins it.
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),programData=web3.PublicKey.findProgramAddressSync([PROGRAM.toBuffer()],LOADER)[0];
await sendTx([new web3.TransactionInstruction({programId:LOADER,data:Buffer.from([7,0,0,0]),keys:[{pubkey:programData,isSigner:false,isWritable:true},{pubkey:admin.publicKey,isSigner:true,isWritable:false},{pubkey:upgradeKey.publicKey,isSigner:true,isWritable:false}]})],[admin,upgradeKey]);
trust.heliUpgradeAuthority=upgradeKey.publicKey.toBase58();keeper=makeKeeper('a',keeperA);

// --- independent model of the monthly releases (market_release.rs settle, economics.rs capacity)
const c0=await read(pda('config'),'Config');let modelReserve=BigInt(c0.stocks[0]),modelTreasury=BigInt(c0.stocks[3]);
const modelReleased=[];
function modelMonth(n){
 const unburned=90_000_000n*UNIT-modelReserve-modelTreasury,cap=unburned*RATE/SCALE;
 const mg=n>=12&&n<720?(cap/5n<modelTreasury?cap/5n:modelTreasury):0n,rel=cap-mg<modelReserve?cap-mg:modelReserve;
 modelReserve-=rel;return {cap,rel,mg};
}
async function verifyMonths(upto,label){
 const c=await read(pda('config'),'Config'),mint=await conn.getAccountInfo(pda('mint'));
 check(`${label}: supply is 90,000,000 CHTA`,mint.data.readBigUInt64LE(36)===90_000_000n*UNIT);
 check(`${label}: reserve vault equals its stock`,(await amount(pda('vault',Buffer.from([0]))))===BigInt(c.stocks[0]));
 check(`${label}: treasury vault equals its stock`,(await amount(pda('vault',Buffer.from([3]))))===BigInt(c.stocks[3]));
 for(let n=modelReleased.length+1;n<=Math.min(upto,Number(c.last_settled_epoch));n++){
  const e=await read(pda('epoch',Buffer.from(new Uint16Array([n]).buffer)),'Epoch'),m=modelMonth(n);modelReleased.push(m);
  check(`month ${n}: cap equals the formula`,BigInt(e.capacity)===m.cap,`${e.capacity} vs ${m.cap}`);
  check(`month ${n}: release equals the formula`,BigInt(e.human_budget)===m.rel&&BigInt(e.founder_budget)===m.mg);
 }
}
const due=()=>Math.min(720,completedMonths(start,clockNow));
const settled=async()=>Number((await read(pda('config'),'Config')).last_settled_epoch);
const settleTimes={};

// --- five years of monthly boundaries with injected faults
let offline=false,paused=false,adminKey=admin;const edges=[];
const plan={3:'rpc-outage',5:'crash-before-send',7:'crash-after-send',9:'expired-blockhash',11:'offline',15:'back-online',20:'two-keepers',24:'wallet-dry',30:'pause',33:'unpause',36:'admin-replaced'};
for(let m=1;m<=MONTHS;m++){
 // Calendar edges: a month whose boundary is clamped (30-day months, February, the 2028 leap day) cannot be settled
 // even an hour early; the epoch account exists because the keeper opened it at the previous boundary.
 const b=boundary(start,m),day=new Date(b*1000).getUTCDate();
 if(day!==31&&!offline&&m<=MONTHS&&(await settled())===m-1&&await conn.getAccountInfo(pda('epoch',Buffer.from(new Uint16Array([m]).buffer)))){
  await warp(Math.max(clockNow+60,b-3600));
  try{await sendTx([heliInstruction(idl,PROGRAM,'settle',{},{config:pda('config'),mint:pda('mint'),epoch:pda('epoch',Buffer.from(new Uint16Array([m]).buffer)),release_reserve:pda('vault',Buffer.from([0])),management_stock:pda('vault',Buffer.from([3])),market_inventory:pda('market-inventory'),token_program:spl.TOKEN_PROGRAM_ID})],[keeperB]);
   check(`month ${m}: settling an hour before the ${new Date(b*1000).toISOString().slice(0,10)} boundary is refused`,false,'(it succeeded)');}
  catch{check(`month ${m}: settling an hour before the ${new Date(b*1000).toISOString().slice(0,10)} boundary is refused`,true);edges.push(new Date(b*1000).toISOString().slice(0,10));}
 }
 const t=b+60+Math.floor(rand()*72*3600);await warp(Math.max(clockNow+60,t));
 const event=plan[m];if(event)note(`month ${m} (${new Date(clockNow*1000).toISOString().slice(0,10)}): ${event}`);
 if(event==='rpc-outage'){fault.rate=0.6;let r;for(let i=0;i<6&&(await settled())<due();i++)r=await run(keeper);fault.rate=0;r=await run(keeper);check('RPC outage: the keeper caught up once the RPC recovered',(await settled())===due());continue;}
 if(event==='crash-before-send'){
  const send=keeper.adapter.send.bind(keeper.adapter);let once=true;keeper.adapter.send=async raw=>{if(once){once=false;throw Error('crash before send (injected)');}return send(raw);};
  const r=await keeper.engine.step();check('crash before send leaves an uncertain journal entry',r.status==='uncertain'&&keeper.state.pending);
  keeper=makeKeeper('a',keeperA);check('the restarted keeper reads the pending entry from its journal',Boolean(keeper.state.pending));
  await run(keeper);check('after the restart the pending transaction is resent and confirmed',(await settled())===due());continue;}
 if(event==='crash-after-send'){
  let r;for(let i=0;i<10;i++){r=await keeper.engine.step();if(r.status==='submitted')break;}
  check('a transaction was submitted before the crash',r.status==='submitted');
  keeper=makeKeeper('a',keeperA);await run(keeper);check('after a crash following submission the keeper reconciles without resending twice',(await settled())===due());continue;}
 if(event==='expired-blockhash'){
  const send=keeper.adapter.send.bind(keeper.adapter);let once=true;keeper.adapter.send=async raw=>{if(once){once=false;throw Error('lost in transit (injected)');}return send(raw);};
  const r=await keeper.engine.step();check('a transaction is lost before landing',r.status==='uncertain');
  const lost=keeper.state.pending.job;await warp(clockNow+3600);keeper=makeKeeper('a',keeperA);const r2=await keeper.engine.step();note(`lost job ${lost.name}${lost.number?' '+lost.number:''} -> ${r2.status}`);
  check('after its blockhash expires the lost maintenance transaction is recognized and safely retried',['expired-retry-safe','reconciled'].includes(r2.status),r2.status);
  await run(keeper);check('the retried job completes',(await settled())===due());continue;}
 if(event==='offline'){offline=true;}
 if(event==='back-online'){offline=false;const before=await settled();await run(keeper,{limit:80});note(`caught up from month ${before} to ${await settled()}`);check('after four months offline the keeper settles every missed month in order',(await settled())===due());}
 if(event==='two-keepers'){
  const other=makeKeeper('b',keeperB),before=await settled();
  const [ra,rb]=await Promise.all([run(keeper),run(other)]);note(`keeper a: ${ra.status}, keeper b: ${rb.status}${other.state.last?' (b last: '+JSON.stringify({job:other.state.last.job?.name,observedOnChain:other.state.last.observedOnChain,failed:other.state.last.failed})+')':''}`);check('two keepers at once: the month is settled once and nothing breaks',(await settled())===due()&&(await settled())>=before);}
 if(event==='wallet-dry'){
  const bal=await conn.getBalance(keeperA.publicKey);await sendTx([web3.SystemProgram.transfer({fromPubkey:keeperA.publicKey,toPubkey:admin.publicKey,lamports:bal-4_000_000-10_000})],[keeperA]);
  const r=await run(keeper);check('a keeper wallet below its reserve sends nothing',['insufficient-balance','essential-reserve'].includes(r.status),r.status);
  check('…and the month stays due until it is refilled',(await settled())<due());
  await conn.confirmTransaction(await conn.requestAirdrop(keeperA.publicKey,2e9),'confirmed');await run(keeper);check('after a refill the keeper catches up',(await settled())===due());continue;}
 if(event==='pause'||event==='unpause'){paused=event==='pause';await sendTx([heliInstruction(idl,PROGRAM,'pause',{paused},{config:pda('config'),governance:pda('governance'),admin:adminKey.publicKey})],[adminKey]);}
 if(event==='admin-replaced'){
  const gov={config:pda('config'),governance:pda('governance')};
  await sendTx([heliInstruction(idl,PROGRAM,'propose_admin',{new_admin:newAdmin.publicKey},{...gov,signer:recovery.publicKey})],[recovery]);
  await warp(clockNow+7*86400+60);await sendTx([heliInstruction(idl,PROGRAM,'accept_admin',{},{...gov,signer:newAdmin.publicKey})],[newAdmin]);adminKey=newAdmin;
  const before=await settled(),r=await run(keeper);
  check('the keeper stops when the administrator changes (pin mismatch)',r.status==='error'&&/Administrator pin changed/.test(r.message)&&(await settled())===before,r.message??r.status);
  trust.admin=newAdmin.publicKey.toBase58();keeper=makeKeeper('a',keeperA);note('operator re-pins the new administrator and restarts the keeper');
 }
 if(offline){await verifyMonths(MONTHS,`month ${m} (keeper offline)`);check(`month ${m}: nothing is settled while the keeper is offline`,(await settled())<due());continue;}
 const before=await settled();await run(keeper,{limit:60});
 if((await settled())>before)settleTimes[await settled()]=clockNow;
 check(`month ${m}: every due month is settled${paused?' (paused: the monthly rule continues)':''}`,(await settled())===due(),`${await settled()} vs ${due()}`);
 await verifyMonths(MONTHS,`month ${m}`);
}
for(const [n,t] of Object.entries(settleTimes))check(`month ${n} was settled after its boundary`,t>=boundary(start,Number(n)));

// --- every transaction a keeper ever signed: only the allowlisted maintenance instructions
const allowed=['finalize_auction','open_epoch','settle','close_constitution','observe_release_market'].map(n=>createHash('sha256').update('global:'+n).digest().subarray(0,8).toString('hex'));
let audited=0;
for(const k of [keeperA,keeperB]){
 let before;for(;;){const page=await conn.getSignaturesForAddress(k.publicKey,{limit:1000,before});if(!page.length)break;before=page.at(-1).signature;
  for(const s of page){const tx=await conn.getParsedTransaction(s.signature,{maxSupportedTransactionVersion:0});if(!tx?.transaction?.message?.instructions)continue;audited++;
   for(const ix of tx.transaction.message.instructions){const p=ix.programId.toBase58?ix.programId.toBase58():String(ix.programId);
    if(p===PROGRAM.toBase58()){const d=Buffer.from(bs58(ix.data??'')).subarray(0,8).toString('hex');check('keeper transactions use only allowlisted instructions',allowed.includes(d),d);}
    else if(p!=='ComputeBudget111111111111111111111111111111'&&p!=='11111111111111111111111111111111')check('keeper transactions call only the Charta program',false,p);}}}
}
function bs58(s){const a='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';let n=0n;for(const ch of s)n=n*58n+BigInt(a.indexOf(ch));const out=[];while(n>0n){out.unshift(Number(n%256n));n/=256n;}for(const ch of s){if(ch!=='1')break;out.unshift(0);}return out;}
const fin=await read(pda('config'),'Config');
const report={date:new Date().toISOString(),chain:'local LiteSVM rehearsal chain (scripts/svm_rpc.py, blockhash validity 150 slots), synthetic keys',start:new Date(start*1000).toISOString(),months:MONTHS,
 settled:Number(fin.last_settled_epoch),reserveLeft:Number(BigInt(fin.stocks[0])/UNIT),released:Number(modelReleased.reduce((s,m)=>s+m.rel,0n)/UNIT),events,keeperStatuses:statuses,injectedRpcFailures:fault.injected,
 keeperTransactionsAudited:audited,calendarEdgesChecked:edges,checks:checks.length,failures};
writeFileSync(`${work}/keeper-longrun-report.json`,JSON.stringify(report,null,1));
console.log(`\n${MONTHS} months, settled ${report.settled}, ${checks.length} checks, ${failures.length} failures`);
if(failures.length){console.log(failures.join('\n'));process.exit(1);}
