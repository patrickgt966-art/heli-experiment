import test from 'node:test';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {createInterface} from 'node:readline';import {readFileSync,writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {createPrivateKey,generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import {web3,spl} from '../../mobile/deps.mjs';import {V20Chain} from '../chain.mjs';import {ClaimAdmission} from '../admission.mjs';import {storage} from '../storage.mjs';
test('no free allocation: a service-signed registration is refused by the real program in LiteSVM',async()=>{
 const child=spawn(process.env.HELI_TEST_PYTHON??'python3',[fileURLToPath(new URL('svm_bridge.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});
 let pending=[],lines=[],errors='';child.stderr.on('data',b=>errors+=b.toString());const reader=createInterface({input:child.stdout});reader.on('line',line=>{const value=JSON.parse(line);if(pending.length)pending.shift()(value);else lines.push(value);});const next=()=>lines.length?Promise.resolve(lines.shift()):new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Local SVM timeout: '+errors)),15000);pending.push(v=>{clearTimeout(timeout);resolve(v);});});
 const rpc=async(method,params={})=>{child.stdin.write(JSON.stringify({method,params})+'\n');const r=await next();if(r.error)throw Error(r.error);return r.result;};
 const data=storage();
 try{
  const ready=await next();assert(ready.ready);let now=ready.start;
  const sponsor=web3.Keypair.fromSecretKey(Uint8Array.from(ready.sponsor));const verifierKey=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(ready.verifier.slice(0,32))]),format:'der',type:'pkcs8'});
  const program='DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG',idl=JSON.parse(readFileSync(new URL('../archived-idl.json',import.meta.url)));let lastResult;
  const connection={async getAccountInfo(k){const r=await rpc('account',{address:k.toBase58()});return r?{...r,owner:new web3.PublicKey(r.owner),data:Buffer.from(r.data,'base64')}:null;},getMinimumBalanceForRentExemption:size=>rpc('rent',{size}),getBalance:k=>rpc('balance',{address:k.toBase58()}),getLatestBlockhash:()=>rpc('block'),async getFeeForMessage(){return {value:15000};},async sendRawTransaction(bytes){lastResult=await rpc('send',{transaction:Buffer.from(bytes).toString('base64')});if(lastResult.failed)throw Error(JSON.stringify(lastResult.logs));return lastResult.signature;},async confirmTransaction(){return {value:{err:null}};}};
  const provider={async create(){return {id:randomUUID(),url:'https://verify.didit.me/session/local-fixture'};},async decision(id){return {session_id:id,vendor_data:session.id,workflow_id:'local-fixture',status:'Approved',id_verifications:[{status:'Approved',age:30,document_number:'FICTIONAL-SVM-PERSON',document_type:'Test',issuing_state:'TEST',warnings:[],matches:[]}],liveness_checks:[{status:'Approved',warnings:[],matches:[]}],face_matches:[{status:'Approved',warnings:[]}]};}};
  const admission=new ClaimAdmission({program,workflowId:'local-fixture',applicationId:'local-fixture',provider,personSecret:'ephemeral-local-fixture-secret-only',verifierKey,data,now:()=>now});
  const person=web3.Keypair.generate(),personKey=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(person.secretKey.slice(0,32))]),format:'der',type:'pkcs8'});
  const output=admission.session(person.publicKey.toBase58()),session=admission.get(output.id,output.token);await admission.authenticate(session,sign(null,Buffer.from(output.message),personKey).toString('base64'));
  const chain=new V20Chain({program,idl,sponsor,connection,store:data,now:()=>now});assert.equal(await connection.getBalance(person.publicKey),0);
  // Owner decision (V22): no free initial allocation. A service-signed credential and registration are refused on chain.
  const proof=await admission.attestation(session);
  await assert.rejects((async()=>{const plan=await chain.prepare(session,'enroll',proof),tx=web3.Transaction.from(Buffer.from(plan.transaction,'base64'));tx.partialSign(person);await chain.submit(session,plan.ticket,tx.serialize().toString('base64'));})(),/Fallback functions are not supported|Invalid HELI account/);
  // The archived service's frozen IDL no longer matches the slimmed program accounts: it cannot even read the config.
  await assert.rejects(chain.account(chain.pda('config'),'Config'),/Invalid HELI account/);
  const destination=spl.getAssociatedTokenAddressSync(chain.pda('mint'),person.publicKey);assert.equal(await connection.getAccountInfo(destination),null,'no free HELI delivered');
  assert.equal(await connection.getBalance(person.publicKey),0,'applicant SOL remains zero');
  writeFileSync(new URL('../v20-claim-svm-verification.json',import.meta.url),JSON.stringify({checkedDate:'2026-10-04',scope:'Actual ELF in local LiteSVM; synthetic provider decision, ephemeral keys, no public network',passed:true,checks:['wallet-bound provider approval still produces an attestation off chain','on-chain registration refused: there is no free initial allocation','no free HELI delivered','applicant SOL remains zero'],programSourceHash:JSON.parse(readFileSync(new URL('../../solana-v20/compiled-source.json',import.meta.url))).source_sha256},null,2)+'\n');
 }finally{child.stdin.end(JSON.stringify({method:'stop'})+'\n');reader.close();child.kill();data.close();}
});
