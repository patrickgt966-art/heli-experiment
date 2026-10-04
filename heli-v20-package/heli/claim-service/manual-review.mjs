// Operator tool: record a manual approval for an application held in review (for example an old document photo).
// 1. Review the session in the Didit console and approve it there.
// 2. Stop the identity service (the state file has a single writer), then run:
//      node manual-review.mjs <application-id> "<written reason>" [--allow-duplicate-face]
//    Use --allow-duplicate-face only after confirming a different person (e.g. twins); the same document or
//    personal number on another application is always refused.
// Keep the written reason in your own records; only its SHA-256 is stored and printed. No personal data is printed.
import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {generateKeyPairSync} from 'node:crypto';
import {storage} from './storage.mjs';import {ClaimAdmission} from './admission.mjs';import {Didit} from './didit.mjs';
const [id,reason,...flags]=process.argv.slice(2);
if(!id||!reason)throw Error('Usage: node manual-review.mjs <application-id> "<written reason>" [--allow-duplicate-face]');
const root=new URL('./.private/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8').trim();
const policy=JSON.parse(read('workflow-confirmed.json'));
const data=storage(fileURLToPath(new URL('./.state/claim.sqlite',import.meta.url)));
try{
 const provider=new Didit({apiKey:read('didit-api-key.txt'),workflowId:policy.workflowId,callback:'unused'});
 // The verifier key is not used here (no on-chain attestation is signed).
 const admission=new ClaimAdmission({program:'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',workflowId:policy.workflowId,applicationId:'manual-review',provider,personSecret:read('person-hmac.txt'),verifierKey:generateKeyPairSync('ed25519').privateKey,data});
 const s=data.sessions[id];if(!s)throw Error('Unknown application');
 const record=await admission.manualApprove(s,reason,{allowDuplicateFace:flags.includes('--allow-duplicate-face')});
 console.log(JSON.stringify({application:id,status:s.status,reasonSha256:record.reason,allowDuplicateFace:record.allowDuplicateFace,at:new Date(record.at*1000).toISOString()}));
}finally{data.close();}
