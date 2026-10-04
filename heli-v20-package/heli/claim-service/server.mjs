import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createPrivateKey,createPublicKey,generateKeyPairSync,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {web3} from '../mobile/deps.mjs';
import {storage} from './storage.mjs';
import {ClaimAdmission} from './admission.mjs';
import {Didit,verifyWebhook} from './didit.mjs';
import {V20Chain} from './chain.mjs';
import {WebhookQueue} from './webhook-queue.mjs';
const PROGRAM=readFileSync(new URL('../solana-v20/src/lib.rs',import.meta.url),'utf8').match(/declare_id!\("([^"]+)"\)/)[1];
// Rate limits: [max requests, window seconds]. Per-client buckets stop one client exhausting everyone's quota;
// session creation is the expensive path (provider sessions); signed webhooks get their own bucket.
export const CONSENT_VERSION='heli-biometric-consent-v1';
export const LIMITS=Object.freeze({global:[600,60],client:[30,60],create:[5,600],webhook:[300,60]});
export function createClaimServer({origin,admission,chain,data,mode='demo',webhookSecret,queue,trustProxy=false,limits=LIMITS,siteOrigin=null,now=()=>Math.floor(Date.now()/1000)}){
 const publicOrigin=new URL(origin);if(publicOrigin.origin!==origin||publicOrigin.username||publicOrigin.password|| (mode!=='demo'&&publicOrigin.protocol!=='https:')||(mode==='identity'&&chain))throw Error('Invalid public origin or identity-only chain');
 const counts=new Map(),statusTimes=new Map();
 const limited=(name,key)=>{const [max,window]=limits[name],k=name+':'+key,bucket=Math.floor(now()/window),c=counts.get(k);if(counts.size>20000)for(const [x,v] of counts)if(v.bucket!==Math.floor(now()/limits[x.split(':')[0]][1]))counts.delete(x);if(!c||c.bucket!==bucket)counts.set(k,{bucket,n:0});return ++counts.get(k).n>max;};
 const files={'/':['index.html','text/html; charset=utf-8'],'/browser-handoff.js':['browser-handoff.js','text/javascript; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/web3.js':['../solana/node_modules/@solana/web3.js/lib/index.iife.min.js','text/javascript']};
 return createServer(async(req,res)=>{
  const send=(code,value,extra={})=>{if(res.headersSent)return res.end();res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',...extra});res.end(JSON.stringify(value));};
  try{
   if(req.headers.host!==publicOrigin.host)return send(403,{error:'Unexpected host'});
   const path=new URL(req.url,origin).pathname;
   if(req.method==='GET'){
    if(path==='/api/config')return send(200,{mode,provider:'Didit',program:admission.program,amount:1000,waitDays:7,chainEnabled:!!chain},siteOrigin?{'Access-Control-Allow-Origin':siteOrigin,'Vary':'Origin'}:{});
    const file=files[path];if(!file)return send(404,{error:'Not found'});
    let body;try{body=readFileSync(new URL(file[0],import.meta.url));}catch{return send(404,{error:'Not found'});}
    res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});return res.end(body);
   }
   if(req.method!=='POST'||req.headers['content-type']?.split(';')[0]!=='application/json')return send(403,{error:'Request rejected'});
   if(path!=='/webhooks/didit'&&req.headers.origin!==origin)return send(403,{error:'Request origin rejected'});
   const client=(trustProxy&&typeof req.headers['cf-connecting-ip']==='string'?req.headers['cf-connecting-ip']:req.socket.remoteAddress)??'unknown',busy={error:'Too many requests. Please wait.'};
   if(path==='/webhooks/didit'){if(limited('webhook','all'))return send(429,busy);}
   else if(limited('client',client)||limited('global','all')||(['/api/session','/api/authenticate'].includes(path)&&limited('create',client)))return send(429,busy);
   let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>(path==='/webhooks/didit'?1_000_000:16000))return send(413,{error:'Request too large'});chunks.push(c);}const raw=Buffer.concat(chunks);
   if(path==='/webhooks/didit'){if(mode==='demo')return send(403,{error:'Live webhooks disabled'});const event=verifyWebhook(raw,req.headers,webhookSecret,now(),{allowTransportTest:true});if(req.headers['x-didit-test-webhook']==='true')return send(200,{ok:true,test:true,admissionApplied:false});if(queue)queue.enqueue(event);else await admission.webhook(event);return send(200,{ok:true});}
   const b=JSON.parse(raw);
   if(path==='/api/session')return send(200,admission.session(b.wallet));
   const s=admission.get(b.id,b.token);
   // Biometric processing needs explicit consent first: the provider link is withheld until it is recorded.
   const linkFor=x=>mode==='demo'||x?.consent?x.verificationUrl??null:null;
   if(path==='/api/authenticate'){const r=await admission.authenticate(s,b.signature),x=r.resumed?data.sessions[r.id]:s;return send(200,{...r,verificationUrl:linkFor(x),consented:mode==='demo'||!!x?.consent});}
   if(path==='/api/consent'){if(b.version!==CONSENT_VERSION||!s.providerId||s.status!=='verifying')throw Error('Consent could not be recorded');s.consent??={version:CONSENT_VERSION,at:now()};data.save();return send(200,{verificationUrl:s.verificationUrl,consented:true});}
   if(path==='/api/status'){
    if(s.providerId&&now()-(statusTimes.get(s.id)??0)>=15){await admission.refresh(s);statusTimes.set(s.id,now());}
    let result={status:s.status,wallet:s.wallet,verificationUrl:linkFor(s),consented:mode==='demo'||!!s.consent,eligibleAt:s.eligibleAt??null};
    if(chain&&s.status==='verified')Object.assign(result,await chain.status(s.wallet,s.nullifier));
    if(!chain&&s.demoClaimed)result.status='claimed';else if(!chain&&s.eligibleAt)result.status='enrolled';
    return send(200,result);
   }
   if(path==='/api/transaction'){if(!chain)throw Error('On-chain delivery is disabled in this demo');const proof=await admission.attestation(s);return send(200,await chain.prepare(s,b.action,proof));}
   if(path==='/api/submit'){if(!chain)throw Error('On-chain delivery is disabled in this demo');await admission.attestation(s);return send(200,await chain.submit({id:s.id,wallet:s.wallet},b.ticket,b.transaction));}
   if(mode==='demo'){
    if(path==='/api/demo/verify'){if(s.status!=='verifying')throw Error('Authenticate your wallet first');if(typeof b.person!=='string'||!b.person.trim()||b.person.length>80)throw Error('Enter a fictional test person code');const d={session_id:s.providerId,vendor_data:s.id,workflow_id:admission.workflowId,status:'Approved',id_verifications:[{status:'Approved',document_number:b.person.trim(),document_type:'Test',issuing_state:'TEST',age:30,warnings:[],matches:[]}],liveness_checks:[{status:'Approved',warnings:[],matches:[]}],face_matches:[{status:'Approved',warnings:[]}]};admission.provider.decisions.set(s.providerId,d);admission.apply(s,d);return send(200,{status:s.status});}
    if(path==='/api/demo/enroll'){if(s.status!=='verified'||s.eligibleAt)throw Error('No new entitlement');s.eligibleAt=now()+7*86400;data.save();return send(200,{ok:true});}
    if(path==='/api/demo/advance'){if(!s.eligibleAt||s.demoClaimed)throw Error('No waiting application');s.eligibleAt=now()-1;data.save();return send(200,{ok:true});}
    if(path==='/api/demo/claim'){if(!s.eligibleAt||s.eligibleAt>now()||s.demoClaimed)throw Error('Claim unavailable');s.demoClaimed=true;data.save();return send(200,{simulated:true,amount:1000});}
   }
   return send(404,{error:'Not found'});
  }catch(e){if(mode!=='demo')console.error(JSON.stringify({event:'request_rejected',providerHttpStatus:e.httpStatus??null,reason:['Invalid provider session','Identity provider unavailable','Wallet challenge expired','Decision does not match application'].includes(e.message)?e.message:'Request validation rejected'}));const allowed=['Consent could not be recorded','Application access denied','Wallet challenge expired','Identity approval is required','Claim unavailable','No new entitlement','Authenticate your wallet first','Identity checks are paused for today. Please try again tomorrow.'];send(400,{error:allowed.includes(e.message)?e.message:'Request could not be completed. Check your application status and try again.'});}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const env=process.env,mode=env.HELI_MODE??'demo',port=Number(env.PORT??8781);if(!['demo','identity','devnet'].includes(mode))throw Error('Only demo, identity or devnet is supported');
 const origin=env.HELI_CLAIM_PUBLIC_URL??'http://127.0.0.1:'+port;
 let provider,chain,verifierKey,personSecret,data;
 if(mode!=='demo'){
  for(const key of ['HELI_CLAIM_PUBLIC_URL','DIDIT_API_KEY','DIDIT_WEBHOOK_SECRET','DIDIT_WORKFLOW_ID','DIDIT_APPLICATION_ID','HELI_PERSON_HMAC_SECRET'])if(!env[key])throw Error('Missing '+key);
  if(env.HELI_DUPLICATE_POLICY_CONFIRMED!=='true')throw Error('Confirm published workflow duplicate review and 18+ policy');
  if(env.HELI_PERSON_HMAC_SECRET.length<32||env.DIDIT_WEBHOOK_SECRET.length<32)throw Error('Identity secrets must be at least 32 characters');
  provider=new Didit({apiKey:env.DIDIT_API_KEY,workflowId:env.DIDIT_WORKFLOW_ID,callback:origin+'/'});personSecret=env.HELI_PERSON_HMAC_SECRET;
 }
 if(mode==='identity')verifierKey=generateKeyPairSync('ed25519').privateKey;
 else if(mode==='devnet'){
  for(const key of ['HELI_CLAIM_PUBLIC_URL','DIDIT_API_KEY','DIDIT_WEBHOOK_SECRET','DIDIT_WORKFLOW_ID','DIDIT_APPLICATION_ID','HELI_PERSON_HMAC_SECRET','HELI_VERIFIER_KEY_FILE','HELI_SPONSOR_KEY_FILE','HELI_RPC_URL','HELI_PROGRAM_ID'])if(!env[key])throw Error('Missing '+key);
  if(env.HELI_DUPLICATE_POLICY_CONFIRMED!=='true')throw Error('Confirm published workflow duplicate face/document review and 18+ policy before enabling');
  if(env.HELI_PERSON_HMAC_SECRET.length<32||env.DIDIT_WEBHOOK_SECRET.length<32)throw Error('Identity secrets must be at least 32 characters');
  provider=new Didit({apiKey:env.DIDIT_API_KEY,workflowId:env.DIDIT_WORKFLOW_ID,callback:origin+'/'});verifierKey=createPrivateKey(readFileSync(env.HELI_VERIFIER_KEY_FILE));personSecret=env.HELI_PERSON_HMAC_SECRET;
  const connection=new web3.Connection(env.HELI_RPC_URL,'confirmed');if(await connection.getGenesisHash()!=='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG')throw Error('Only Solana Devnet is allowed');
  const idl=JSON.parse(readFileSync(new URL('../solana-v20/idl.json',import.meta.url)));const p=await connection.getAccountInfo(new web3.PublicKey(env.HELI_PROGRAM_ID));if(!p?.executable)throw Error('HELI program is not deployed');
  const sponsor=web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(env.HELI_SPONSOR_KEY_FILE,'utf8'))));data=storage(fileURLToPath(new URL('./.state/claim.sqlite',import.meta.url)));chain=new V20Chain({program:env.HELI_PROGRAM_ID,idl,sponsor,connection,store:data,dailyCap:Number(env.HELI_DAILY_CAP_LAMPORTS??50_000_000)});
  if(!Number.isSafeInteger(chain.dailyCap)||chain.dailyCap<=0)throw Error('Invalid sponsor budget');
  if(verifierKey.asymmetricKeyType!=='ed25519')throw Error('Verifier must use Ed25519');const policy=await chain.account(chain.pda('identity-policy'),'IdentityPolicy');const verifier=new web3.PublicKey(createPublicKey(verifierKey).export({format:'der',type:'spki'}).subarray(-32));if(policy?.verifier!==verifier.toBase58()||sponsor.publicKey.equals(verifier))throw Error('Verifier policy is not configured correctly');
 }else if(mode==='demo'){
  verifierKey=generateKeyPairSync('ed25519').privateKey;personSecret='local-test-only-secret-not-for-production';provider={decisions:new Map(),async create(id){const pid=randomUUID();this.decisions.set(pid,{session_id:pid,vendor_data:id,workflow_id:env.DIDIT_WORKFLOW_ID??'local-demo',status:'Not Started'});return {id:pid,url:'https://verify.didit.me/session/local-demo-not-live'};},async decision(id){const d=this.decisions.get(id);if(!d)throw Error('Demo identity not completed');return d;}};
 }
 data??=storage(mode==='demo'?':memory:':fileURLToPath(new URL('./.state/claim.sqlite',import.meta.url)));
 const admission=new ClaimAdmission({program:env.HELI_PROGRAM_ID??PROGRAM,workflowId:env.DIDIT_WORKFLOW_ID??'local-demo',applicationId:env.DIDIT_APPLICATION_ID??'local-demo',provider,personSecret,verifierKey,data,dailyProviderSessions:Number(env.HELI_DAILY_PROVIDER_SESSIONS??200)});
 const queue=mode==='demo'?null:new WebhookQueue({admission,data});
 const timer=queue?setInterval(()=>queue.step().catch(()=>{}),1000):null;
 // Only trust Cloudflare's client IP header when the service is reachable solely through the tunnel (loopback bind).
 const server=createClaimServer({origin,admission,chain,data,mode,queue,webhookSecret:env.DIDIT_WEBHOOK_SECRET,trustProxy:env.HELI_TRUST_CF_CONNECTING_IP==='true',siteOrigin:env.HELI_SITE_ORIGIN??'https://heli-experiment.pages.dev'});server.listen(port,'127.0.0.1',()=>console.log('HELI V20 claim service '+mode+' '+origin));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(timer)clearInterval(timer);server.close(()=>{data.close();process.exit(0);});server.closeAllConnections?.();});
}
