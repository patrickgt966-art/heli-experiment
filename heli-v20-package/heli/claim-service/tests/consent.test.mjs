// Biometric processing needs explicit consent: the provider link is withheld until consent is recorded.
// Synthetic wallets, provider and in-memory state only.
import test from 'node:test';import assert from 'node:assert/strict';
import {request} from 'node:http';import {generateKeyPairSync,randomUUID,sign} from 'node:crypto';
import {web3} from '../../mobile/deps.mjs';
import {createClaimServer,CONSENT_VERSION} from '../server.mjs';import {ClaimAdmission} from '../admission.mjs';import {storage} from '../storage.mjs';
const origin='https://pilot.example';
function send(server,path,body){
 return new Promise((resolve,reject)=>{const req=request('http://127.0.0.1:'+server.address().port+path,{method:'POST',headers:{Host:'pilot.example',Origin:origin,'Content-Type':'application/json'}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(text)}));});req.on('error',reject);req.end(JSON.stringify(body));});
}
async function fixture(){
 const data=storage(),a=new ClaimAdmission({program:'DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG',workflowId:'w',applicationId:'app',provider:{vendor:new Map(),async create(app){const id=randomUUID();this.vendor.set(id,app);return {id,url:'https://verify.didit.me/session/'+randomUUID()};},async decision(id){return {session_id:id,vendor_data:this.vendor.get(id),workflow_id:'w',status:'In Progress'};}},personSecret:'consent-secret-'.repeat(3),verifierKey:generateKeyPairSync('ed25519').privateKey,data,now:()=>2000});
 const server=createClaimServer({origin,mode:'identity',admission:a,data,webhookSecret:'x'.repeat(40),now:()=>2000});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const k=generateKeyPairSync('ed25519'),wallet=new web3.PublicKey(k.publicKey.export({format:'der',type:'spki'}).subarray(-32)).toBase58();
 const connect=async()=>{const s=(await send(server,'/api/session',{wallet})).body;const auth=await send(server,'/api/authenticate',{id:s.id,token:s.token,signature:sign(null,Buffer.from(s.message),k.privateKey).toString('base64')});return {s,auth:auth.body};};
 return {data,server,connect,close:async()=>{await new Promise(r=>server.close(r));data.close();}};
}

test('the identity provider link is withheld until explicit consent is recorded',async()=>{
 const f=await fixture();
 try{
  const {s,auth}=await f.connect();
  assert.equal(auth.verificationUrl,null,'no provider link at wallet connection');assert.equal(auth.consented,false);
  const before=(await send(f.server,'/api/status',{id:s.id,token:s.token})).body;
  assert.equal(before.status,'verifying');assert.equal(before.verificationUrl,null,'status does not leak the link before consent');assert.equal(before.consented,false);
  assert.equal((await send(f.server,'/api/consent',{id:s.id,token:s.token,version:'old-version'})).status,400,'unknown consent text version rejected');
  assert.equal((await send(f.server,'/api/consent',{id:s.id,token:'b'.repeat(64),version:CONSENT_VERSION})).status,400,'consent needs the application token');
  const c=await send(f.server,'/api/consent',{id:s.id,token:s.token,version:CONSENT_VERSION});
  assert.equal(c.status,200);assert.match(c.body.verificationUrl,/^https:\/\/verify\.didit\.me\//);
  const record=f.data.sessions[s.id].consent;assert.equal(record.version,CONSENT_VERSION);assert.equal(record.at,2000);
  const after=(await send(f.server,'/api/status',{id:s.id,token:s.token})).body;
  assert.equal(after.consented,true);assert.equal(after.verificationUrl,c.body.verificationUrl,'other browsers of the same application get the link after consent');
 }finally{await f.close();}
});

test('a reopened application keeps its consent; consent is not needed again',async()=>{
 const f=await fixture();
 try{
  const first=await f.connect();
  await send(f.server,'/api/consent',{id:first.s.id,token:first.s.token,version:CONSENT_VERSION});
  const again=await f.connect();
  assert.equal(again.auth.resumed,true);assert.equal(again.auth.consented,true);assert.match(again.auth.verificationUrl,/^https:\/\/verify\.didit\.me\//);
 }finally{await f.close();}
});
