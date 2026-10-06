// Emergency drills (ACIL_DURUM.md) on the rehearsal chain: launches a small Charta, then runs every procedure of
// the runbook through scripts/emergency.mjs itself and checks the result on chain. Synthetic keys only.
//   python scripts/svm_rpc.py --upgrade-authority <ADMIN_PUBKEY> --pretend-devnet &
//   node scripts/emergency_drill.mjs <workdir with admin.json>
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {web3,spl} from '../../mobile/deps.mjs';
import {heliInstruction,decodeAccount} from '../../mobile/solana.mjs';
import * as core from '../../website/auction-core.js';

const RPC='http://127.0.0.1:8899',work=process.argv[2];
if(!work||!existsSync(`${work}/admin.json`))throw Error('usage: node scripts/emergency_drill.mjs <workdir with admin.json>');
const here=fileURLToPath(new URL('.',import.meta.url));
const rpc=async(method,params=[])=>{const r=await (await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})})).json();if(r.error)throw Error(r.error.message);return r.result;};
if(!(await rpc('getVersion'))['solana-core'].includes('charta-rehearsal'))throw Error('Refusing: not the local rehearsal chain');
const now=async()=>(await rpc('charta_clock')).unixTimestamp,warp=t=>rpc('charta_warp',[t]);
const conn=new web3.Connection(RPC,'confirmed');conn._disableBlockhashCaching=true;
const PROGRAM=new web3.PublicKey('HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv');
const idl=JSON.parse(readFileSync(new URL('../idl.json',import.meta.url)));
const pda=(...s)=>web3.PublicKey.findProgramAddressSync(s.map(x=>typeof x==='string'?Buffer.from(x):x),PROGRAM)[0];
const read=async(k,type)=>{const a=await conn.getAccountInfo(k,'confirmed');return a?decodeAccount(idl,type,a.data):null;};
const load=f=>web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(f))));
const key=n=>{const f=`${work}/${n}.json`;if(!existsSync(f))writeFileSync(f,JSON.stringify([...web3.Keypair.generate().secretKey]),{mode:0o600});return load(f);};
const sendTx=(ixs,signers)=>web3.sendAndConfirmTransaction(conn,new web3.Transaction().add(...ixs),signers,{commitment:'confirmed'});
const checks=[],failures=[],drills=[];
const check=(name,ok,detail='')=>{checks.push(name);if(!ok){failures.push(`${name} ${detail}`);console.log(`  ✕ ${name} ${detail}`);}};
const drill=name=>{drills.push(name);console.log(`\n== ${name}`);};
// The runbook's own tool, exactly as an operator would run it.
const em=(args,k)=>{try{return {ok:true,out:execFileSync(process.execPath,[`${here}emergency.mjs`,...args,'--rpc',RPC,...(k?['--key',`${work}/${k}.json`]:[])],{encoding:'utf8'})};}
 catch(e){return {ok:false,out:(e.stdout??'')+(e.stderr??'')};}};
const cfg=()=>read(pda('config'),'Config'),gov=()=>read(pda('governance'),'Governance');

// --- a small launch
const admin=load(`${work}/admin.json`),recovery=key('recovery'),upgradeKey=key('upgrade'),bidder=key('bidder');
for(const k of [admin,recovery,bidder])await conn.confirmTransaction(await conn.requestAirdrop(k.publicKey,k===admin?100e9:5e9),'confirmed');
const quote=await spl.createMint(conn,admin,admin.publicKey,null,6);
await spl.mintTo(conn,admin,quote,(await spl.getOrCreateAssociatedTokenAccount(conn,admin,quote,bidder.publicKey)).address,admin,1_000_000_000n);
const start=(await now())+8*86400+1800;key('market');
writeFileSync(`${work}/setup.json`,JSON.stringify({rpcUrl:RPC,localValidator:true,program:PROGRAM.toBase58(),adminKeyFile:`${work}/admin.json`,recovery:recovery.publicKey.toBase58(),upgradeAuthority:upgradeKey.publicKey.toBase58(),quoteMint:quote.toBase58(),start,minimumQuoteDepth:25_000_000,
 metadata:{name:'Charta',symbol:'CHTA',uri:'https://heli-experiment.pages.dev/token.json'},auction:{floor:200,tick:10},marketKeyFile:`${work}/market.json`,marketRentLamports:10_000_000,
 feeVaults:{monthlyCap:1_000_000_000,reserve:0,projectFloor:120_000_000},releaseSeatRentLamports:10_000_000,managementRentLamports:10_000_000}));
const runner=ph=>execFileSync(process.execPath,[`${here}devnet_setup.mjs`,`${work}/setup.json`,ph,'--send'],{encoding:'utf8'});
runner('pre');await core.ready();
const A=core.addresses(web3,PROGRAM.toBase58(),pda('mint').toBase58(),quote.toBase58(),bidder.publicKey);
await sendTx([core.createBidIx(web3,A),core.placeBidIx(web3,A,250_000n,0)],[bidder]);
await warp(start+60);runner('post');
// Synthetic reserve so that expenses are payable.
await spl.mintTo(conn,admin,quote,pda('auction-proceeds'),admin,1_000_000_000n);
const fee={config:pda('config'),operations:pda('operations'),quote_mint:quote,fee_quote:pda('fee-quote'),sale_proceeds:pda('auction-proceeds'),token_program:spl.TOKEN_PROGRAM_ID,system_program:web3.SystemProgram.programId};
const payee=(await spl.getOrCreateAssociatedTokenAccount(conn,admin,quote,key('payee').publicKey)).address;
async function propose(by,amount){const o=await read(pda('operations'),'Operations');const n=BigInt(o.next_nonce),e=pda('expense',Buffer.from(new BigUint64Array([n]).buffer));
 await sendTx([heliInstruction(idl,PROGRAM,'propose_expense',{nonce:n,amount,purpose:Array(32).fill(9),fixed:false},{...fee,expense:e,destination:payee,proposer:by.publicKey})],[by]);return {n,e};}
const execute=async e=>{try{await sendTx([heliInstruction(idl,PROGRAM,'execute_expense',{},{...fee,expense:e,destination:payee})],[bidder]);return true;}catch{return false;}};

drill('1. Read-only status');
let r=em(['status']);check('status shows the administrator',r.ok&&r.out.includes(admin.publicKey.toBase58()),r.out);
check('status shows the recovery key and the upgrade key',r.out.includes(recovery.publicKey.toBase58())&&/upgrade key/.test(r.out));

drill('2. Pause and resume');
r=em(['pause'],'admin');check('without --send nothing is sent',r.ok&&/nothing sent/.test(r.out)&&!(await cfg()).paused);
r=em(['pause','--send'],'admin');check('pause takes effect',r.ok&&(await cfg()).paused,r.out);
check('status reports the pause',/paused\s+YES/.test(em(['status']).out));
let x=await propose(admin,5_000_000n);await warp((await now())+7*86400+60);
check('no expense is paid while paused',!(await execute(x.e)));
r=em(['pause','--send'],'bidder');check('someone else cannot pause',!r.ok&&/REJECTED/.test(r.out),r.out);
r=em(['unpause','--send'],'admin');check('resume takes effect',r.ok&&!(await cfg()).paused);
check('the expense is payable again after resuming',await execute(x.e));

drill('3. A malicious or mistaken expense');
x=await propose(admin,50_000_000n);
r=em(['recovery-cancel-expense',String(x.n),'--send'],'recovery');check('the recovery key cancels a pending expense',r.ok,r.out);
await warp((await now())+7*86400+60);check('a cancelled expense can never be paid',!(await execute(x.e)));
x=await propose(admin,1_000_000n);r=em(['cancel-expense',String(x.n),'--send'],'admin');check('the administrator can cancel its own proposal',r.ok);
check('status lists no pending expense afterwards',/pending expenses\s+none/.test(em(['status']).out));

drill('4. Admin key suspected: move the administrator at once');
const admin2=key('admin-2');await conn.confirmTransaction(await conn.requestAirdrop(admin2.publicKey,2e9),'confirmed');
r=em(['propose-admin',admin2.publicKey.toBase58(),'--send'],'admin');check('the administrator proposes a fresh key',r.ok,r.out);
r=em(['accept-admin','--send'],'admin-2');check('the fresh key accepts at once',r.ok&&(await cfg()).admin===admin2.publicKey.toBase58(),r.out);
r=em(['pause','--send'],'admin');check('the old administrator key has no power any more',!r.ok);

drill('5. Admin key lost: the recovery key appoints a new administrator after 7 days');
const admin3=key('admin-3');await conn.confirmTransaction(await conn.requestAirdrop(admin3.publicKey,2e9),'confirmed');
r=em(['propose-admin',admin3.publicKey.toBase58(),'--send'],'recovery');check('the recovery key proposes a new administrator',r.ok,r.out);
check('status shows the pending change and that the recovery key proposed it',/proposed by the RECOVERY key/.test(em(['status']).out));
r=em(['accept-admin','--send'],'admin-3');check('accepting before the 7 days is refused',!r.ok);
await warp((await now())+7*86400+60);
r=em(['accept-admin','--send'],'admin-3');check('after 7 days the new administrator takes over',r.ok&&(await cfg()).admin===admin3.publicKey.toBase58(),r.out);

drill('6. Known limit: a thief holding the admin key can veto the recovery key');
const admin4=key('admin-4');r=em(['propose-admin',admin4.publicKey.toBase58(),'--send'],'recovery');
r=em(['cancel-admin-proposal','--send'],'admin-3');check('the current administrator can cancel the recovery proposal (documented limit)',r.ok&&(await gov()).pending_admin==='11111111111111111111111111111111');
x=await propose(admin3,80_000_000n);r=em(['recovery-cancel-expense',String(x.n),'--send'],'recovery');
check('…but the recovery key still stops every expense the thief proposes',r.ok);

drill('7. Recovery key rotation');
const rec2=key('recovery-2');await conn.confirmTransaction(await conn.requestAirdrop(rec2.publicKey,2e9),'confirmed');
r=em(['propose-recovery',rec2.publicKey.toBase58(),'--send'],'recovery');r=em(['accept-recovery','--send'],'recovery-2');
check('the recovery key moves itself to a new key at once',r.ok&&(await gov()).recovery===rec2.publicKey.toBase58(),r.out);
const rec3=key('recovery-3');r=em(['propose-recovery',rec3.publicKey.toBase58(),'--send'],'admin-3');check('the administrator can only propose a recovery change with a 7-day wait',r.ok);
r=em(['cancel-recovery-proposal','--send'],'recovery-2');check('…which the recovery key can cancel',r.ok&&(await gov()).pending_recovery==='11111111111111111111111111111111');

drill('8. Upgrade authority on its own offline key (owner decision, 6 Oct)');
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),programData=web3.PublicKey.findProgramAddressSync([PROGRAM.toBuffer()],LOADER)[0];
// SetAuthorityChecked: the current and the new authority both sign, as `solana program set-upgrade-authority` does.
// The offline keys hold no SOL; an ordinary wallet pays the fee (--fee-payer in the CLI).
const setAuthority=(from,to)=>{const tx=new web3.Transaction().add(new web3.TransactionInstruction({programId:LOADER,data:Buffer.from([7,0,0,0]),keys:[{pubkey:programData,isSigner:false,isWritable:true},{pubkey:from.publicKey,isSigner:true,isWritable:false},{pubkey:to.publicKey,isSigner:true,isWritable:false}]}));
 tx.feePayer=bidder.publicKey;return web3.sendAndConfirmTransaction(conn,tx,[bidder,from,to],{commitment:'confirmed'}).then(()=>true,()=>false);};
const upgradeAuthority=async()=>{const d=(await conn.getAccountInfo(programData)).data;return d[12]===1?new web3.PublicKey(d.subarray(13,45)).toBase58():null;};
check('setup: the administrator hands the upgrade authority to the offline upgrade key',await setAuthority(admin,upgradeKey)&&(await upgradeAuthority())===upgradeKey.publicKey.toBase58());
check('status shows the offline upgrade key',em(['status']).out.includes(upgradeKey.publicKey.toBase58()));
const thief=key('thief');await conn.confirmTransaction(await conn.requestAirdrop(thief.publicKey,1e9),'confirmed');
check('the recovery key cannot change the program or its upgrade key',!(await setAuthority(rec2,thief))&&(await upgradeAuthority())===upgradeKey.publicKey.toBase58());
check('the administrator cannot either',!(await setAuthority(admin3,thief))&&(await upgradeAuthority())===upgradeKey.publicKey.toBase58());
const upgrade2=key('upgrade-2');
check('upgrade key suspected: it moves itself to a fresh offline key at once',await setAuthority(upgradeKey,upgrade2)&&(await upgradeAuthority())===upgrade2.publicKey.toBase58());
check('the old upgrade key has no power any more',!(await setAuthority(upgradeKey,thief)));

const report={date:new Date().toISOString(),chain:'local LiteSVM rehearsal chain, synthetic keys',drills,checks:checks.length,failures};
writeFileSync(`${work}/emergency-drill-report.json`,JSON.stringify(report,null,1));
console.log(`\n${drills.length} drills, ${checks.length} checks, ${failures.length} failures`);if(failures.length){console.log(failures.join('\n'));process.exit(1);}
