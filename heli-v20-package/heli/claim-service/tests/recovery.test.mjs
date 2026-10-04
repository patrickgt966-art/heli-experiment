// Regression tests for review finding M5: losing the application link must not lock a verified person out.
import test from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import {web3} from '../../mobile/deps.mjs';
import {ClaimAdmission} from '../admission.mjs';import {storage} from '../storage.mjs';
const secret='recovery-secret-'.repeat(3),workflowId='workflow-test';
function decision(s,doc='DOC-1',status='Approved'){return {session_id:s.providerId,vendor_data:s.id,workflow_id:workflowId,status,id_verifications:[{status:'Approved',age:30,document_number:doc,document_type:'Passport',issuing_state:'TEST',warnings:[],matches:[]}],liveness_checks:[{status:'Approved',warnings:[],matches:[]}],face_matches:[{status:'Approved',warnings:[]}]};}
function fixture(){
 const data=storage(),created=[],a=new ClaimAdmission({program:'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',workflowId,applicationId:'app',provider:{async create(id){created.push(id);return {id:randomUUID(),url:'https://verify.didit.me/session/'+id};}},personSecret:secret,verifierKey:generateKeyPairSync('ed25519').privateKey,data,now:()=>2000});
 const keyOf=()=>{const k=generateKeyPairSync('ed25519');return {k,wallet:new web3.PublicKey(k.publicKey.export({format:'der',type:'spki'}).subarray(-32)).toBase58()};};
 // One browser visit: new application challenge, signed by the wallet.
 const visit=async(w)=>{const r=a.session(w.wallet),s=a.get(r.id,r.token),result=await a.authenticate(s,sign(null,Buffer.from(r.message),w.k.privateKey).toString('base64'));return {r,result,s:a.get(result.resumed?result.id:r.id,r.token)};};
 return {a,data,created,keyOf,visit};
}

test('a verified applicant who lost the link reopens the same application with a wallet signature',async()=>{
 const f=fixture(),w=f.keyOf(),first=await f.visit(w);
 f.a.apply(first.s,decision(first.s));assert.equal(first.s.status,'verified');
 const again=await f.visit(w);
 assert.equal(again.result.resumed,true);assert.equal(again.result.id,first.r.id);
 assert.equal(again.s.status,'verified','not flagged as a duplicate of themselves');
 assert.equal(f.created.length,1,'no second paid identity session');
 assert.equal(f.a.get(first.r.id,first.r.token).id,first.r.id,'the original link keeps working');
 f.data.close();
});

test('without the wallet key nobody can reopen the application',async()=>{
 const f=fixture(),w=f.keyOf(),first=await f.visit(w);f.a.apply(first.s,decision(first.s));
 const r=f.a.session(w.wallet),s=f.a.get(r.id,r.token);
 await assert.rejects(f.a.authenticate(s,sign(null,Buffer.from(r.message),generateKeyPairSync('ed25519').privateKey).toString('base64')));
 assert.throws(()=>f.a.get(first.r.id,r.token),/Application access denied/);
 f.data.close();
});

test('a declined applicant can start a fresh attempt with the same wallet',async()=>{
 const f=fixture(),w=f.keyOf(),first=await f.visit(w);
 f.a.apply(first.s,decision(first.s,'DOC-1','Declined'));assert.equal(first.s.status,'declined');
 const again=await f.visit(w);
 assert.equal(again.result.resumed,undefined);assert.equal(f.created.length,2);
 f.a.apply(again.s,decision(again.s));assert.equal(again.s.status,'verified');
 f.data.close();
});

test('the same person on a different wallet is still a duplicate',async()=>{
 const f=fixture(),one=await f.visit(f.keyOf()),two=await f.visit(f.keyOf());
 f.a.apply(one.s,decision(one.s));f.a.apply(two.s,decision(two.s));
 assert.equal(one.s.status,'verified');assert.equal(two.s.status,'duplicate');
 f.data.close();
});
