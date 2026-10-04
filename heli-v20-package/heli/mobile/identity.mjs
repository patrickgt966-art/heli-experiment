import { createHash, createPublicKey, randomBytes, randomUUID, sign, verify } from 'node:crypto';
import { web3 } from './deps.mjs';
const SPKI = Buffer.from('302a300506032b6570032100','hex');
const PREFIX = Buffer.from('HELI_IDENTITY_V15\0');
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function walletMessage(s) { return Buffer.from(`HELI telefon başvurusu\n${s.id}\n${s.wallet}\n${s.challenge}\n${s.flowId}\n${s.expiresAt}\n`); }
export function verifyWallet(wallet,message,signature) {
 const raw = new web3.PublicKey(wallet).toBuffer();
 const sig = Buffer.from(signature,'base64');
 if (sig.length !== 64 || !verify(null,message,{key:Buffer.concat([SPKI,raw]),format:'der',type:'spki'},sig)) throw Error('Cüzdan imzası geçersiz');
}
export function proofMessage(program,config,wallet,nullifier,digest,issuedAt,expiresAt) {
 const time=Buffer.alloc(16);time.writeBigInt64LE(BigInt(issuedAt));time.writeBigInt64LE(BigInt(expiresAt),8);
 return Buffer.concat([PREFIX,...[program,config,wallet].map(x=>new web3.PublicKey(x).toBuffer()),Buffer.from(nullifier,'hex'),Buffer.from(digest,'hex'),time]);
}
export function normalizeNullifier(n) {
 if(typeof n!=='string')throw Error('Kalıcı kişi kanıtı yok');
 let value;
 if(/^0x[0-9a-fA-F]{1,64}$/.test(n))value=BigInt(n);
 else if(/^[1-9][0-9]{0,77}$/.test(n))value=BigInt(n);
 else if(/^[0-9a-fA-F]{64}$/.test(n)&&/[a-fA-F]/.test(n))value=BigInt('0x'+n);
 else throw Error('Kalıcı kişi kanıtı yok');
 if(value<=0n||value>=(1n<<256n))throw Error('Kalıcı kişi kanıtı yok');
 return value.toString(16).padStart(64,'0');
}
export class Admission {
 constructor({program,flowId,environment='live',verifierKey,store,now=()=>Math.floor(Date.now()/1000)}) {
  this.program=program;this.config=web3.PublicKey.findProgramAddressSync([Buffer.from('config')],new web3.PublicKey(program))[0].toBase58();
  this.flowId=flowId;this.environment=environment;this.verifierKey=verifierKey;this.store=store;this.now=now;
 }
 session(wallet) {
  new web3.PublicKey(wallet);const now=this.now();const token=randomBytes(32).toString('hex');
  const s={id:randomUUID(),wallet,flowId:this.flowId,challenge:randomBytes(24).toString('hex'),createdAt:now,expiresAt:now+900,tokenHash:hash(token),status:'challenge'};
  this.store.sessions[s.id]=s;this.store.save();return {...s,token,message:walletMessage(s).toString(),tokenHash:undefined};
 }
 get(id,token) {const s=this.store.sessions[id];if (!s||typeof token!=='string'||hash(token)!==s.tokenHash) throw Error('Başvuru bulunamadı');return s;}
 authenticate(s,signature) {if(s.status!=='challenge'||this.now()>s.expiresAt) throw Error('Başvuru süresi doldu');verifyWallet(s.wallet,walletMessage(s),signature);s.walletSignature=signature;s.status='verifying';this.store.save();}
 // Live service calls only after Svix verifies untouched Self webhook bytes.
 verified(event,raw) {
  const s=this.store.sessions[event.external_uuid];if(!s||s.status==='challenge')throw Error('Bilinmeyen başvuru');
  if(event.type!=='verification.completed'||event.verification_id!==s.providerId||event.flow_id!==this.flowId||event.flow_version_id!==s.flowVersionId||event.environment!==this.environment||event.product!=='proof_of_human')throw Error('Sağlayıcı sonucu başvuruya ait değil');
  const digest=hash(raw);const prior=this.store.events[event.verification_id];
  if(prior){if(prior!==digest)throw Error('Çelişkili sağlayıcı sonucu');return s;}
  const at=Math.floor(Date.parse(event.verified_at)/1000);
  if(!Number.isFinite(at)||at<s.createdAt||at>s.expiresAt||at>this.now()+30)throw Error('Doğrulama zamanı geçersiz');
  if(event.status!=='valid'){s.status=event.status;this.store.events[event.verification_id]=digest;this.store.save();return s;}
  const nullifier=hash(Buffer.concat([Buffer.from('HELI:SELF:PERSON:V15\0'),Buffer.from(normalizeNullifier(event.nullifier),'hex')]));
  const existing=this.store.people[nullifier];if(existing&&existing!==s.wallet) {s.status='duplicate';this.store.events[event.verification_id]=digest;this.store.save();return s;}
  this.store.people[nullifier]=s.wallet;s.nullifier=nullifier;s.digest=digest;s.status='verified';
  this.store.events[event.verification_id]=digest;this.store.save();return s;
 }
 attestation(s) {
  if(s.status!=='verified'&&s.status!=='enrolled'&&s.status!=='claimed')throw Error('Kimlik doğrulaması bekleniyor');
  const issuedAt=this.now(),expiresAt=issuedAt+600;
  const message=proofMessage(this.program,this.config,s.wallet,s.nullifier,s.digest,issuedAt,expiresAt);
  const signature=sign(null,message,this.verifierKey);
  const publicKey=createPublicKey(this.verifierKey).export({format:'der',type:'spki'}).subarray(-32);
  return {nullifier:s.nullifier,proofDigest:s.digest,issuedAt,expiresAt,signature:signature.toString('base64'),publicKey:new web3.PublicKey(publicKey).toBase58()};
 }
}
