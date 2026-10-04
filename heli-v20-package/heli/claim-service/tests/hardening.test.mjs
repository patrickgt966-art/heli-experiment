// Regression tests for the independent review findings H4 (availability/cost) and N3 (webhook starvation).
import test from 'node:test';import assert from 'node:assert/strict';
import {request} from 'node:http';import {createHmac,generateKeyPairSync,randomUUID} from 'node:crypto';
import {web3} from '../../mobile/deps.mjs';
import {createClaimServer} from '../server.mjs';import {ClaimAdmission} from '../admission.mjs';import {storage} from '../storage.mjs';
const origin='https://pilot.example',secret='hardening-secret-'.repeat(3);
const wallet=()=>web3.Keypair.generate().publicKey.toBase58();
function send(server,path,{method='POST',body={},headers={}}={}){
 const raw=typeof body==='string'?body:JSON.stringify(body);
 return new Promise((resolve,reject)=>{const req=request('http://127.0.0.1:'+server.address().port+path,{method,headers:{Host:'pilot.example',Origin:origin,'Content-Type':'application/json',...headers}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,text}));});req.on('error',reject);req.end(method==='GET'?undefined:raw);});
}
async function serve(options){const server=createClaimServer({origin,mode:'identity',webhookSecret:secret,now:()=>2000,trustProxy:true,...options});await new Promise(r=>server.listen(0,'127.0.0.1',r));return server;}
const admission=()=>{const data=storage();return {data,a:new ClaimAdmission({program:'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',workflowId:'w',applicationId:'app',provider:{async create(){return {id:randomUUID(),url:'https://verify.didit.me/session/x'};}},personSecret:secret,verifierKey:generateKeyPairSync('ed25519').privateKey,data,now:()=>2000,dailyProviderSessions:2})};};

test('one client exhausting its quota does not lock out other applicants',async()=>{
 const {a,data}=admission(),server=await serve({admission:a,data});
 try{
  const codes=[];for(let i=0;i<130;i++)codes.push((await send(server,'/api/status',{body:{id:'x',token:'y'},headers:{'cf-connecting-ip':'198.51.100.1'}})).status);
  assert(codes.includes(429),'attacker is limited');
  const other=await send(server,'/api/session',{body:{wallet:wallet()},headers:{'cf-connecting-ip':'203.0.113.7'}});
  assert.equal(other.status,200,'another applicant still gets a session');
 }finally{await new Promise(r=>server.close(r));data.close();}
});

test('application creation is rate limited more strictly per client',async()=>{
 const {a,data}=admission(),server=await serve({admission:a,data});
 try{
  const codes=[];for(let i=0;i<7;i++)codes.push((await send(server,'/api/session',{body:{wallet:wallet()},headers:{'cf-connecting-ip':'198.51.100.2'}})).status);
  assert.deepEqual(codes,[200,200,200,200,200,429,429]);
 }finally{await new Promise(r=>server.close(r));data.close();}
});

test('client spam cannot starve signed provider webhooks',async()=>{
 let admitted=0;const server=await serve({admission:{program:'test'},queue:{enqueue(){admitted++;}}});
 try{
  for(let i=0;i<130;i++)await send(server,'/api/status',{body:{},headers:{'cf-connecting-ip':'198.51.100.'+(i%65)}});
  const body=JSON.stringify({timestamp:2000,status:'Approved'});
  const hook=await send(server,'/webhooks/didit',{body,headers:{'x-timestamp':'2000','x-signature':createHmac('sha256',secret).update(body).digest('hex'),'x-didit-test-webhook':'true'}});
  assert.equal(hook.status,200);
 }finally{await new Promise(r=>server.close(r));}
});

test('the client IP header is ignored unless the tunnel deployment opts in',async()=>{
 const {a,data}=admission(),server=await serve({admission:a,data,trustProxy:false});
 try{
  const codes=[];for(let i=0;i<7;i++)codes.push((await send(server,'/api/session',{body:{wallet:wallet()},headers:{'cf-connecting-ip':'203.0.113.'+i}})).status);
  assert.deepEqual(codes.slice(5),[429,429],'rotating a spoofed header does not reset the limit');
 }finally{await new Promise(r=>server.close(r));data.close();}
});

test('a missing static asset returns 404 and the service keeps running',async()=>{
 const {a,data}=admission(),server=await serve({admission:a,data});
 try{
  const missing=await send(server,'/web3.js',{method:'GET'});
  assert.equal(missing.status,404);
  const config=await send(server,'/api/config',{method:'GET'});
  assert.equal(config.status,200);
 }finally{await new Promise(r=>server.close(r));data.close();}
});

test('provider sessions stop at the daily cost ceiling',async()=>{
 const {a,data}=admission(),{sign}=await import('node:crypto');
 const start=async()=>{const k=generateKeyPairSync('ed25519'),w=new web3.PublicKey(k.publicKey.export({format:'der',type:'spki'}).subarray(-32)).toBase58(),r=a.session(w),s=a.get(r.id,r.token);return a.authenticate(s,sign(null,Buffer.from(r.message),k.privateKey).toString('base64'));};
 await start();await start();
 await assert.rejects(start(),/paused for today/);
 data.close();
});

test('expired unauthenticated challenges are pruned; verified applications are kept',()=>{
 const {a,data}=admission();
 data.sessions.old={id:'old',status:'challenge',expiresAt:2000-7200};
 data.sessions.kept={id:'kept',status:'verified',expiresAt:2000-7200,providerId:'p'};
 a.session(wallet());
 assert.equal(data.sessions.old,undefined);assert(data.sessions.kept);
 data.close();
});
