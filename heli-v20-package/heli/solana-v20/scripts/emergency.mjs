// Emergency commands for Charta (ACIL_DURUM.md). Every command is simulated and printed; nothing is sent unless
// --send is given. A mainnet RPC additionally requires --mainnet. The key file is read locally and never printed.
//   node scripts/emergency.mjs status                      --rpc <URL> [--program <ID>]
//   node scripts/emergency.mjs <command> [argument]        --rpc <URL> --key <KEYPAIR.json> [--program <ID>] [--send]
// Commands (who signs):
//   pause | unpause                       administrator (pausing is refused for 7 days after a recovery unpause)
//   recovery-unpause                      recovery key: lifts a pause; the administrator cannot pause again for 7 days
//   cancel-expense <nonce>                administrator
//   recovery-cancel-expense <nonce>       recovery key
//   propose-admin <pubkey>                administrator (takes effect at once) or recovery key (after 7 days)
//   accept-admin                          the proposed new administrator
//   cancel-admin-proposal                 administrator or recovery key
//   propose-recovery <pubkey>             recovery key (at once) or administrator (after 7 days)
//   accept-recovery                       the proposed new recovery key
//   cancel-recovery-proposal              recovery key
import {readFileSync} from 'node:fs';
import {web3} from '../../mobile/deps.mjs';
import {heliInstruction,decodeAccount} from '../../mobile/solana.mjs';

const argv=process.argv.slice(2),flag=n=>{const i=argv.indexOf(n);return i>=0?argv[i+1]:undefined;},has=n=>argv.includes(n);
const [command,arg]=argv.filter((x,i)=>!x.startsWith('--')&&!['--rpc','--key','--program'].includes(argv[i-1]));
const rpc=flag('--rpc'),program=new web3.PublicKey(flag('--program')??'DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG');
if(!command||!rpc)throw Error('usage: node scripts/emergency.mjs <command> [argument] --rpc <URL> [--key <KEYPAIR.json>] [--program <ID>] [--send]');
const MAINNET='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',DEVNET='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const idl=JSON.parse(readFileSync(new URL('../idl.json',import.meta.url)));
const conn=new web3.Connection(rpc,'confirmed');
const pda=(...s)=>web3.PublicKey.findProgramAddressSync(s.map(x=>typeof x==='string'?Buffer.from(x):x),program)[0];
const read=async(k,type)=>{const a=await conn.getAccountInfo(k,'confirmed');return a?decodeAccount(idl,type,a.data):null;};
const genesis=await conn.getGenesisHash();
const cluster=genesis===MAINNET?'MAINNET':genesis===DEVNET?'devnet':`other (${genesis.slice(0,8)}…)`;
const time=t=>Number(t)?new Date(Number(t)*1000).toISOString().replace('.000',''):'–';
const none='11111111111111111111111111111111';

if(command==='status'){
 const c=await read(pda('config'),'Config'),g=await read(pda('governance'),'Governance');
 if(!c)throw Error(`Charta is not set up at ${program.toBase58()} on ${cluster}`);
 const pd=await conn.getAccountInfo(web3.PublicKey.findProgramAddressSync([program.toBuffer()],LOADER)[0]);
 const expenses=(await conn.getProgramAccounts(program,{filters:[{dataSize:131}]})).map(e=>{try{return decodeAccount(idl,'Expense',e.account.data);}catch{return null;}}).filter(e=>e&&!e.paid&&!e.cancelled);
 const clock=await conn.getAccountInfo(web3.SYSVAR_CLOCK_PUBKEY);const now=clock?Number(clock.data.readBigInt64LE(32)):Math.floor(Date.now()/1000);  // chain time
 console.log(`Charta ${program.toBase58()} on ${cluster}
 administrator        ${c.admin}
 recovery key         ${g?.recovery??'not set'}
 upgrade key          ${pd?.data[12]===1?new web3.PublicKey(pd.data.subarray(13,45)).toBase58():'REMOVED (code can no longer change)'}
 paused               ${c.paused?'YES: sales, treasury orders and expense payments are stopped':'no'}
 pause lock           ${g&&Number(g.pause_locked_until)>now?`the administrator cannot pause until ${time(g.pause_locked_until)} (lifted by the recovery key)`:'none'}
 months settled       ${c.last_settled_epoch} of 720
 pending admin change ${g&&g.pending_admin!==none?`${g.pending_admin} (${g.by_recovery?'proposed by the RECOVERY key':'by the administrator'}, can be accepted from ${time(g.ready_at)})`:'none'}
 pending recovery     ${g&&g.pending_recovery!==none?`${g.pending_recovery} (from ${time(g.recovery_ready_at)})`:'none'}
 pending expenses     ${expenses.length?'':'none'}`);
 for(const e of expenses)console.log(`   #${e.nonce} ${Number(e.amount)/1e6} quote units to ${e.destination}${e.fixed?' (fixed cost)':''}, payable from ${time(e.ready_at)}${Number(e.ready_at)<=now?'  ← PAYABLE NOW':''}`);
 process.exit(0);
}

const keyFile=flag('--key');if(!keyFile)throw Error('--key <KEYPAIR.json> is required for this command');
const signer=web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(keyFile))));
const gov={config:pda('config'),governance:pda('governance'),signer:signer.publicKey};
const expense=n=>pda('expense',Buffer.from(new BigUint64Array([BigInt(n)]).buffer));
const need=(x,what)=>{if(x===undefined)throw Error(`${command} needs ${what}`);return x;};
const plans={
 pause:()=>['pause',{paused:true},{config:pda('config'),governance:pda('governance'),admin:signer.publicKey}],
 unpause:()=>['pause',{paused:false},{config:pda('config'),governance:pda('governance'),admin:signer.publicKey}],
 'recovery-unpause':()=>['recovery_unpause',{},{config:pda('config'),governance:pda('governance'),recovery:signer.publicKey}],
 'cancel-expense':()=>['cancel_expense',{},{config:pda('config'),expense:expense(need(arg,'an expense number')),admin:signer.publicKey}],
 'recovery-cancel-expense':()=>['recovery_cancel_expense',{},{governance:pda('governance'),expense:expense(need(arg,'an expense number')),recovery:signer.publicKey}],
 'propose-admin':()=>['propose_admin',{new_admin:new web3.PublicKey(need(arg,'the new administrator public key'))},gov],
 'accept-admin':()=>['accept_admin',{},gov],
 'cancel-admin-proposal':()=>['cancel_admin_proposal',{},gov],
 'propose-recovery':()=>['propose_recovery',{new_recovery:new web3.PublicKey(need(arg,'the new recovery public key'))},gov],
 'accept-recovery':()=>['accept_recovery',{},gov],
 'cancel-recovery-proposal':()=>['cancel_recovery_proposal',{},gov],
};
if(!plans[command])throw Error(`unknown command ${command}`);
if(cluster==='MAINNET'&&!has('--mainnet'))throw Error('This RPC is MAINNET: add --mainnet to confirm');
const [name,args,accounts]=plans[command]();
const tx=new web3.Transaction().add(heliInstruction(idl,program,name,args,accounts));
tx.feePayer=signer.publicKey;tx.recentBlockhash=(await conn.getLatestBlockhash('confirmed')).blockhash;tx.sign(signer);
const sim=await conn.simulateTransaction(tx);
console.log(`${command} on ${cluster}, signed by ${signer.publicKey.toBase58()}`);
if(sim.value.err){console.log(`SIMULATION REJECTED: ${JSON.stringify(sim.value.err)}\n${(sim.value.logs??[]).filter(l=>/Error Message|failed/.test(l)).join('\n')}`);process.exit(2);}
if(!has('--send')){console.log('simulation OK; nothing sent (add --send to submit)');process.exit(0);}
const sig=await web3.sendAndConfirmTransaction(conn,tx,[signer],{commitment:'confirmed'});
console.log(`SENT and confirmed: ${sig}`);
