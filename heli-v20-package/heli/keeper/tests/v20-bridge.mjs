import {createInterface} from 'node:readline';
import {SolanaAdapter} from '../adapter.mjs';
import {web3} from '../../mobile/deps.mjs';
for await(const line of createInterface({input:process.stdin})){
 try{
  const s=JSON.parse(line),pk=s.config.admin;
  const a=new SolanaAdapter({connection:{},program:s.program,payer:{publicKey:new web3.PublicKey(pk)},trust:{admin:pk,verifier:pk,heliUpgradeAuthority:null,manifestUpgradeAuthority:null}});
  const job=a.plan(s),ix=job?a.instruction(job,s):null;
  console.log(JSON.stringify({job,instruction:ix?{program:ix.programId.toBase58(),data:ix.data.toString('base64'),keys:ix.keys.map(k=>({key:k.pubkey.toBase58(),signer:k.isSigner,writable:k.isWritable}))}:null}));
 }catch(e){console.log(JSON.stringify({error:e.message}));}
}
