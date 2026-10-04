import {randomBytes,randomUUID,sign,createPublicKey} from 'node:crypto';
import {hash,verifyWallet,proofMessage} from '../mobile/identity.mjs';
import {web3} from '../mobile/deps.mjs';
import {evaluateDecision} from './didit.mjs';
export class ClaimAdmission {
 constructor({program,workflowId,applicationId,provider,personSecret,verifierKey,data,environment='live',now=()=>Math.floor(Date.now()/1000)}){Object.assign(this,{program,workflowId,applicationId,provider,personSecret,verifierKey,data,environment,now});this.config=web3.PublicKey.findProgramAddressSync([Buffer.from('config')],new web3.PublicKey(program))[0].toBase58();}
 session(wallet){new web3.PublicKey(wallet);const token=randomBytes(32).toString('hex'),id=randomUUID(),expiresAt=this.now()+900;const message=`HELI initial free allocation\nWallet: ${wallet}\nApplication: ${id}\nNonce: ${randomBytes(24).toString('hex')}\nExpires: ${expiresAt}\nThis signature proves wallet ownership. It does not authorize a payment.`;const s={id,wallet,tokenHash:hash(token),message,expiresAt,status:'challenge'};this.data.sessions[id]=s;this.data.save();return {id,wallet,token,message};}
 get(id,token){const s=this.data.sessions[id];if(!s||typeof token!=='string'||hash(token)!==s.tokenHash)throw Error('Application access denied');return s;}
 async authenticate(s,signature){
  if(s.providerId)return {verificationUrl:s.verificationUrl};
  if(s.status!=='challenge'||this.now()>s.expiresAt)throw Error('Wallet challenge expired');verifyWallet(s.wallet,Buffer.from(s.message),signature);
  if(s.creating)throw Error('Verification session is being created');s.creating=true;
  try{const r=await this.provider.create(s.id);s.providerId=r.id;s.verificationUrl=r.url;s.status='verifying';this.data.save();return {verificationUrl:r.url};}finally{delete s.creating;}
 }
 apply(s,d){const r=evaluateDecision(d,{sessionId:s.providerId,vendorData:s.id,workflowId:this.workflowId,personSecret:this.personSecret});
  if(r.status==='verified'){
   if(r.keys.some(k=>this.data.people[k]&&this.data.people[k]!==s.id)){s.status='duplicate';}
   else {for(const k of r.keys)this.data.people[k]=s.id;Object.assign(s,{status:'verified',nullifier:r.nullifier,digest:r.digest});}
  }else s.status=r.status;
  this.data.save();return s;
 }
 async refresh(s){if(!s.providerId)return s;return this.apply(s,await this.provider.decision(s.providerId));}
 validateWebhook(e){if(!['status.updated','data.updated'].includes(e.webhook_type)||e.environment!==this.environment||e.application_id!==this.applicationId||e.sandbox_scenario||e.session_kind==='business')throw Error('Unexpected webhook');const s=this.data.sessions[e.vendor_data];if(!s||s.providerId!==e.session_id||e.workflow_id!==this.workflowId)throw Error('Webhook application mismatch');if(typeof e.event_id!=='string'||!e.event_id||e.event_id.length>128)throw Error('Missing event ID');return s;}
 async webhook(e){const s=this.validateWebhook(e);if(this.data.events[e.event_id])return;await this.refresh(s);this.data.events[e.event_id]=true;this.data.save();}
 async attestation(s){await this.refresh(s);if(s.status!=='verified')throw Error('Identity approval is required');const issuedAt=this.now(),expiresAt=issuedAt+600;const message=proofMessage(this.program,this.config,s.wallet,s.nullifier,s.digest,issuedAt,expiresAt);return {nullifier:s.nullifier,proofDigest:s.digest,issuedAt,expiresAt,signature:sign(null,message,this.verifierKey).toString('base64'),publicKey:new web3.PublicKey(createPublicKey(this.verifierKey).export({format:'der',type:'spki'}).subarray(-32)).toBase58()};}
}
