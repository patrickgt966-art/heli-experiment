import {randomBytes,randomUUID,sign,createPublicKey} from 'node:crypto';
import {hash,verifyWallet,proofMessage} from '../mobile/identity.mjs';
import {web3} from '../mobile/deps.mjs';
import {evaluateDecision} from './didit.mjs';
function revision(s){const r=s.decisionRevision??0;if(!Number.isSafeInteger(r)||r<0||r===Number.MAX_SAFE_INTEGER)throw Error('Invalid identity decision revision');return r;}
function decisionTime(d){
 const value=d.updated_at??d.updatedAt;if(value===undefined||value===null)return null;
 let time;if(typeof value==='number')time=value<1e12?value*1000:value;
 else if(typeof value==='string')time=Date.parse(value);else throw Error('Invalid decision timestamp');
 if(!Number.isFinite(time)||time<0)throw Error('Invalid decision timestamp');return time;
}
export class ClaimAdmission {
 constructor({program,workflowId,applicationId,provider,personSecret,verifierKey,data,environment='live',dailyProviderSessions=200,now=()=>Math.floor(Date.now()/1000)}){Object.assign(this,{program,workflowId,applicationId,provider,personSecret,verifierKey,data,environment,dailyProviderSessions,now});this.config=web3.PublicKey.findProgramAddressSync([Buffer.from('config')],new web3.PublicKey(program))[0].toBase58();}
 session(wallet){new web3.PublicKey(wallet);for(const [k,x] of Object.entries(this.data.sessions))if(x.status==='challenge'&&!x.providerId&&x.expiresAt<this.now()-3600)delete this.data.sessions[k];const token=randomBytes(32).toString('hex'),id=randomUUID(),expiresAt=this.now()+900;const message=`HELI initial free allocation\nWallet: ${wallet}\nApplication: ${id}\nNonce: ${randomBytes(24).toString('hex')}\nExpires: ${expiresAt}\nThis signature proves wallet ownership. It does not authorize a payment.`;const s={id,wallet,tokenHash:hash(token),message,expiresAt,status:'challenge'};this.data.sessions[id]=s;this.data.save();return {id,wallet,token,message};}
 get(id,token){const s=this.data.sessions[id],h=typeof token==='string'?hash(token):null;if(!s||!h||(h!==s.tokenHash&&!(s.tokenHashes??[]).includes(h)))throw Error('Application access denied');return s;}
 async authenticate(s,signature){
  if(s.providerId)return {verificationUrl:s.verificationUrl};
  if(s.status!=='challenge'||this.now()>s.expiresAt)throw Error('Wallet challenge expired');verifyWallet(s.wallet,Buffer.from(s.message),signature);
  // Lost link or cleared browser storage: the same wallet signature reopens its existing application instead of
  // starting a new identity check (which would otherwise be flagged as a duplicate of the applicant's own record).
  const existing=Object.values(this.data.sessions).filter(x=>x.wallet===s.wallet&&x.providerId&&x.id!==s.id&&['verifying','review','verified','duplicate'].includes(x.status)).sort((a,b)=>b.expiresAt-a.expiresAt)[0];
  if(existing){existing.tokenHashes=[...(existing.tokenHashes??[]),s.tokenHash].slice(-5);delete this.data.sessions[s.id];this.data.save();return {resumed:true,id:existing.id,verificationUrl:existing.verificationUrl};}
  if(s.creating)throw Error('Verification session is being created');const day=Math.floor(this.now()/86400).toString(),created=(this.data.providerSessions??={})[day]??0;if(created>=this.dailyProviderSessions)throw Error('Identity checks are paused for today. Please try again tomorrow.');this.data.providerSessions[day]=created+1;s.creating=true;
  try{const r=await this.provider.create(s.id);s.providerId=r.id;s.verificationUrl=r.url;s.status='verifying';this.data.save();return {verificationUrl:r.url};}finally{delete s.creating;}
 }
 apply(s,d,{manual=s.manual,recordManual=false,expectedRevision=null,expectedProviderId=s.providerId}={}){
  // Check again at the synchronous state-write boundary, not just inside the
  // async fetch helper: another microtask can apply a decision between awaits.
  if(expectedRevision!==null&&(revision(s)!==expectedRevision||s.providerId!==expectedProviderId))throw Error('Identity decision changed; refresh again');
  // Validate before changing state. Persisted revisions also survive a restart.
  const next=revision(s)+1,time=decisionTime(d);
  if(time!==null&&s.providerDecisionTime!==undefined&&time<s.providerDecisionTime)throw Error('Stale identity decision');
  const r=evaluateDecision(d,{sessionId:s.providerId,vendorData:s.id,workflowId:this.workflowId,personSecret:this.personSecret,manual:!!manual,allowDuplicateFace:!!manual?.allowDuplicateFace});
  // Equal timestamps cannot establish that an automatic approval is newer than
  // a rejection/review. Explicit, freshly fetched operator approval is separate.
  if(time!==null&&time===s.providerDecisionTime&&r.status==='verified'&&s.status!=='verified'&&!recordManual)throw Error('Ambiguous identity decision timestamp');
  if(r.status==='verified'){
   if(r.keys.some(k=>this.data.people[k]&&this.data.people[k]!==s.id&&this.data.sessions[this.data.people[k]]?.wallet!==s.wallet)){s.status='duplicate';}
   else {for(const k of r.keys)this.data.people[k]=s.id;Object.assign(s,{status:'verified',nullifier:r.nullifier,digest:r.digest});}
  }else s.status=r.status;
  if(recordManual&&s.status==='verified')s.manual=manual;
  s.decisionRevision=next;if(time!==null)s.providerDecisionTime=time;
  this.data.save();return s;
 }
 // Operator decision for an application held in review (e.g. an old document photo). Requires the Didit session to be
 // approved in the Didit console and a written reason; only its hash is stored. Duplicate document/person keys always win.
 async manualApprove(s,reason,{allowDuplicateFace=false}={}){
  if(typeof reason!=='string'||reason.trim().length<10)throw Error('A written reason of at least 10 characters is required');
  if(!s.providerId)throw Error('Application has no identity session');
  const fetched=await this.freshDecision(s),d=fetched.decision;if(d.status!=='Approved')throw Error('Approve the session in the Didit console first');
  const record={session:s.id,at:this.now(),reason:hash(Buffer.from(reason.trim())),allowDuplicateFace:!!allowDuplicateFace};
  this.apply(s,d,{manual:record,recordManual:true,expectedRevision:fetched.expectedRevision,expectedProviderId:fetched.expectedProviderId});
  if(s.status!=='verified')throw Error('Manual approval refused: application is '+s.status);
  (this.data.manualReviews??=[]).push(record);this.data.save();return record;
 }
 async freshDecision(s){
  const before=revision(s),providerId=s.providerId;
  const d=await this.provider.decision(providerId);
  if(s.providerId!==providerId||revision(s)!==before)throw Error('Identity decision changed; refresh again');
  return {decision:d,expectedRevision:before,expectedProviderId:providerId};
 }
 async refresh(s){if(!s.providerId)return s;const fetched=await this.freshDecision(s);return this.apply(s,fetched.decision,fetched);}
 validateWebhook(e){if(!['status.updated','data.updated'].includes(e.webhook_type)||e.environment!==this.environment||e.application_id!==this.applicationId||e.sandbox_scenario||e.session_kind==='business')throw Error('Unexpected webhook');const s=this.data.sessions[e.vendor_data];if(!s||s.providerId!==e.session_id||e.workflow_id!==this.workflowId)throw Error('Webhook application mismatch');if(typeof e.event_id!=='string'||!e.event_id||e.event_id.length>128)throw Error('Missing event ID');return s;}
 async webhook(e){const s=this.validateWebhook(e);if(this.data.events[e.event_id])return;await this.refresh(s);this.data.events[e.event_id]=true;this.data.save();}
 async attestation(s){await this.refresh(s);if(s.status!=='verified')throw Error('Identity approval is required');const issuedAt=this.now(),expiresAt=issuedAt+600;const message=proofMessage(this.program,this.config,s.wallet,s.nullifier,s.digest,issuedAt,expiresAt);return {nullifier:s.nullifier,proofDigest:s.digest,issuedAt,expiresAt,signature:sign(null,message,this.verifierKey).toString('base64'),publicKey:new web3.PublicKey(createPublicKey(this.verifierKey).export({format:'der',type:'spki'}).subarray(-32)).toBase58()};}
}
