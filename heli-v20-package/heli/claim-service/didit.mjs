import {createHmac,timingSafeEqual} from 'node:crypto';
import {hash} from '../mobile/identity.mjs';
const BASE='https://verification.didit.me';
export function verifyWebhook(raw,headers,secret,now=Math.floor(Date.now()/1000),{allowTransportTest=false}={}) {
 const timestamp=headers['x-timestamp'],signature=headers['x-signature'];
 if(!/^\d+$/.test(timestamp??'')||Math.abs(now-Number(timestamp))>300||!/^([a-fA-F0-9]{64})$/.test(signature??''))throw Error('Invalid webhook signature');
 const expected=createHmac('sha256',secret).update(raw).digest();
 if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))throw Error('Invalid webhook signature');
 const e=JSON.parse(raw);
 if(e.timestamp!==Number(timestamp)||(headers['x-didit-test-webhook']==='true'&&!allowTransportTest))throw Error('Invalid webhook envelope');
 return e;
}
export class Didit {
 constructor({apiKey,workflowId,callback,fetcher=fetch}){Object.assign(this,{apiKey,workflowId,callback,fetcher});}
 async request(path,body){const r=await this.fetcher(BASE+path,{method:body?'POST':'GET',headers:{'x-api-key':this.apiKey,'Content-Type':'application/json',Accept:'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok){const e=Error('Identity provider unavailable');e.httpStatus=r.status;throw e;}return r.json();}
 async create(id){const r=await this.request('/v3/session/',{workflow_id:this.workflowId,vendor_data:id,callback:this.callback,language:'en'});const u=new URL(r.url);if(u.origin!=='https://verify.didit.me'||u.username||u.password||r.vendor_data!==id||r.workflow_id!==this.workflowId||typeof r.session_id!=='string')throw Error('Invalid provider session');return {id:r.session_id,url:u.href};}
 decision(id){if(!/^[a-f0-9-]{36}$/i.test(id))throw Error('Invalid provider ID');return this.request('/v3/session/'+id+'/decision/');}
}
// Any cross-session match, or a warning that names a duplicate, is a possible second application by the same person.
export function hasDuplicateSignal(d){
 const all=['id_verifications','liveness_checks','face_matches'].flatMap(k=>Array.isArray(d[k])?d[k]:[]);
 return all.some(x=>Array.isArray(x.matches)&&x.matches.length)||/duplicat/i.test(JSON.stringify([d.warnings??[],all.map(x=>x.warnings??[])]));
}
// `manual`: the operator approved the session in the Didit console after review and recorded a written reason
// (manual-review.mjs). Warnings such as low face similarity are then accepted; a duplicate signal still holds the
// application in review unless `allowDuplicateFace` is set. Age, document fields and HELI's own document/person
// keys are always enforced.
export function evaluateDecision(d,{sessionId,vendorData,workflowId,personSecret,manual=false,allowDuplicateFace=false}) {
 if(d.session_id!==sessionId||d.vendor_data!==vendorData||d.workflow_id!==workflowId)throw Error('Decision does not match application');
 const states={'Not Started':'verifying','In Progress':'verifying','Awaiting User':'verifying','Resubmitted':'verifying','In Review':'review','Declined':'declined','Abandoned':'expired','Expired':'expired','Kyc Expired':'expired'};
 if(d.status!=='Approved')return {status:states[d.status]??'review'};
 const groups=['id_verifications','liveness_checks','face_matches'];
 if(manual){
  // Liveness stays mandatory on the manual path: every check must be Approved. The only exception is a check the
  // provider declined solely for duplicate-face warnings, and only when the operator explicitly allowed that signal.
  const duplicateOnly=x=>Array.isArray(x.warnings)&&x.warnings.length>0&&x.warnings.every(w=>/duplicat/i.test(JSON.stringify(w)));
  const live=x=>x?.status==='Approved'||(allowDuplicateFace&&x?.status==='Declined'&&duplicateOnly(x));
  if(!Array.isArray(d.id_verifications)||!d.id_verifications.length||!Array.isArray(d.liveness_checks)||!d.liveness_checks.length||!d.liveness_checks.every(live)||(hasDuplicateSignal(d)&&!allowDuplicateFace))return {status:'review'};
 }
 else {
 if(groups.some(k=>!Array.isArray(d[k])||!d[k].length||d[k].some(x=>x.status!=='Approved'||!Array.isArray(x.warnings)||!Array.isArray(x.matches??[]))))return {status:'review'};
 if([...d.id_verifications,...d.liveness_checks].some(x=>!Array.isArray(x.matches)))return {status:'review'};
 const checks=groups.flatMap(k=>d[k]);
 // Conservative duplicate handling: review ANY cross-session match or warning.
 // No guessed similarity threshold and no invented provider-wide person ID.
 if(checks.some(x=>x.warnings.length||(x.matches??[]).length)|| (Array.isArray(d.warnings)&&d.warnings.length))return {status:'review'};
 }
 const keys=[];
 for(const id of d.id_verifications){
  if(!Number.isInteger(id.age)||id.age<18||typeof id.issuing_state!=='string'||!id.issuing_state.trim()||typeof id.document_number!=='string'||!id.document_number.trim()||typeof id.document_type!=='string')return {status:'review'};
  const norm=x=>x.normalize('NFKC').trim().toUpperCase();
  const make=(kind,value)=>createHmac('sha256',personSecret).update(JSON.stringify(['HELI:DIDIT:V20',kind,norm(id.issuing_state),norm(value)])).digest('hex');
  keys.push(make('document:'+norm(id.document_type),id.document_number));
  if(typeof id.personal_number==='string'&&id.personal_number.trim())keys.push(make('national-person',id.personal_number));
 }
 return {status:'verified',keys:[...new Set(keys)],nullifier:hash(Buffer.from('HELI:DIDIT:NULLIFIER:V20\0'+keys[0])),digest:hash(Buffer.from(JSON.stringify(d)))};
}
