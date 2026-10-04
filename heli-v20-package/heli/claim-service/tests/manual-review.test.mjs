// Owner decision: applications held in review (e.g. old document photo) may be approved manually, with a recorded
// reason; duplicate signals need an explicit flag; duplicate documents/person numbers are never overridden.
import test from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,randomUUID,createHash} from 'node:crypto';
import {web3} from '../../mobile/deps.mjs';
import {ClaimAdmission} from '../admission.mjs';import {evaluateDecision} from '../didit.mjs';import {storage} from '../storage.mjs';
const secret='manual-review-secret-'.repeat(2),workflowId='workflow-test';
const lowSimilarity={status:'Approved',warnings:[{risk:'LOW_FACE_MATCH_SIMILARITY'}]};
const duplicateFace={status:'Approved',warnings:[{risk:'POSSIBLE_DUPLICATED_FACE'}],matches:[{session_id:'older'}]};
function decision(s,{doc='DOC-1',status='Approved',face=lowSimilarity,liveness=[{status:'Approved',warnings:[],matches:[]}]}={}){
 return {session_id:s.providerId,vendor_data:s.id,workflow_id:workflowId,status,id_verifications:[{status:'Approved',age:30,document_number:doc,document_type:'Identity Card',issuing_state:'TEST',warnings:[],matches:[]}],liveness_checks:liveness,face_matches:[face]};
}
function fixture(){
 const data=storage(),results=new Map(),a=new ClaimAdmission({program:'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',workflowId,applicationId:'app',provider:{async create(){return {id:randomUUID(),url:'https://verify.didit.me/session/x'};},async decision(id){return results.get(id);}},personSecret:secret,verifierKey:generateKeyPairSync('ed25519').privateKey,data,now:()=>2000});
 const session=async()=>{const k=generateKeyPairSync('ed25519'),w=new web3.PublicKey(k.publicKey.export({format:'der',type:'spki'}).subarray(-32)).toBase58(),r=a.session(w),s=a.get(r.id,r.token);await a.authenticate(s,sign(null,Buffer.from(r.message),k.privateKey).toString('base64'));return s;};
 const set=(s,opts)=>{const d=decision(s,opts);results.set(s.providerId,d);a.apply(s,d);return d;};
 return {a,data,session,set};
}
const REASON='Old ID photo; selfie checked against document by operator on 4 Oct';

test('old-photo application stays in review until a recorded manual approval, which then persists',async()=>{
 const f=fixture(),s=await f.session();f.set(s);
 assert.equal(s.status,'review');
 const record=await f.a.manualApprove(s,REASON);
 assert.equal(s.status,'verified');assert.equal(record.reason,createHash('sha256').update(REASON).digest('hex'));
 assert.equal(f.data.manualReviews.length,1);assert(!JSON.stringify(f.data).includes(REASON),'only the reason hash is stored');
 await f.a.refresh(s);assert.equal(s.status,'verified','a later provider refresh keeps the manual decision');
 f.data.close();
});

test('manual approval needs the Didit console approval, a written reason and a liveness check',async()=>{
 const f=fixture(),s=await f.session();f.set(s,{status:'In Review'});
 await assert.rejects(f.a.manualApprove(s,REASON),/Didit console/);
 f.set(s);await assert.rejects(f.a.manualApprove(s,'ok'),/written reason/);
 const n=await f.session();f.set(n,{liveness:[]});
 await assert.rejects(f.a.manualApprove(n,REASON),/refused/);assert.equal(n.status,'review');
 f.data.close();
});

test('a duplicate-face signal is refused unless explicitly allowed',async()=>{
 const f=fixture(),s=await f.session();f.set(s,{face:duplicateFace});
 await assert.rejects(f.a.manualApprove(s,REASON),/refused: application is review/);
 assert.equal(s.status,'review');assert.equal(s.manual,undefined);
 await f.a.manualApprove(s,'Confirmed twin sibling, different person, documents checked',{allowDuplicateFace:true});
 assert.equal(s.status,'verified');
 f.data.close();
});

test('the same document on another application is never overridden',async()=>{
 const f=fixture(),first=await f.session();f.set(first);await f.a.manualApprove(first,REASON);
 const second=await f.session();f.set(second,{face:duplicateFace});
 await assert.rejects(f.a.manualApprove(second,REASON,{allowDuplicateFace:true}),/refused: application is duplicate/);
 assert.notEqual(second.status,'verified');
 f.data.close();
});

test('automatic evaluation is unchanged: any warning still means review',()=>{
 const s={id:'s',providerId:'p'};
 assert.equal(evaluateDecision(decision(s),{sessionId:'p',vendorData:'s',workflowId,personSecret:secret}).status,'review');
});
