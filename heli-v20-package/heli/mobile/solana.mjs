import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { web3, spl } from './deps.mjs';
import { proofMessage } from './identity.mjs';
const snake=s=>s.replace(/[A-Z]/g,x=>'_'+x.toLowerCase());
const disc=name=>createHash('sha256').update('global:'+name).digest().subarray(0,8);
const key=x=>new web3.PublicKey(x);
function encode(type,value) {
 if(type==='publicKey')return key(value).toBuffer();
 if(type==='bool')return Buffer.from([Number(value)]);
 if(typeof type==='string'){const b=Buffer.alloc(Number(type.slice(1))/8);let n=BigInt(value);if(n<0)n=(1n<<BigInt(b.length*8))+n;for(let i=0;i<b.length;i++){b[i]=Number(n&255n);n>>=8n;}if(n!==0n)throw Error('Sayı taşması');return b;}
 if(type.array)return Buffer.concat(value.map(v=>encode(type.array[0],v)));
 throw Error('Desteklenmeyen kodlama');
}
export function decodeAccount(idl,name,buffer) {
 const type=[...(idl.accounts??[]),...(idl.types??[])].find(x=>x.name===name)?.type;if(!type)throw Error('IDL hesabı yok');
 let offset=8;const out={};
 function decode(t){if(t==='publicKey'){const x=key(buffer.subarray(offset,offset+32)).toBase58();offset+=32;return x;}if(t==='bool')return Boolean(buffer[offset++]);if(typeof t==='string'){const size=Number(t.slice(1))/8;let n=0n;for(let i=0;i<size;i++)n|=BigInt(buffer[offset+i])<<BigInt(8*i);offset+=size;if(t[0]==='i'&&(n&(1n<<BigInt(size*8-1))))n-=1n<<BigInt(size*8);return n;}if(t.array)return Array.from({length:t.array[1]},()=>decode(t.array[0]));if(t.vec){const count=Number(decode('u32'));if(count>4096)throw Error('Hesap dizisi çok büyük');return Array.from({length:count},()=>decode(t.vec));}throw Error('Desteklenmeyen hesap türü');}
 for(const f of type.fields)out[snake(f.name)]=decode(f.type);return out;
}
export function heliInstruction(idl,program,name,args,accounts) {
 const i=idl.instructions.find(x=>snake(x.name)===name);if(!i)throw Error('Talimat IDL içinde yok');
 return new web3.TransactionInstruction({programId:key(program),data:Buffer.concat([disc(name),...i.args.map(f=>encode(f.type,args[snake(f.name)]))]),keys:i.accounts.map(a=>({pubkey:key(accounts[snake(a.name)]),isWritable:a.isMut,isSigner:a.isSigner}))});
}
export class SponsoredChain {
 constructor({program,idl,sponsor,connection,store,dailyCap=50_000_000,maxPreparesPerSession=6,now=()=>Math.floor(Date.now()/1000)}){Object.assign(this,{program:key(program),idl,sponsor,connection,store,dailyCap,maxPreparesPerSession,now});}
 // Budget is reserved when a plan is signed and returned only once its blockhash can no longer land
 // (well past the 90 s plan expiry), so abandoned plans do not exhaust the daily sponsor budget.
 releaseExpired(){for(const [ticket,x] of Object.entries(this.store.pending))if(!x.used&&this.now()>x.expiresAt+120){const day=x.day??Math.floor((x.expiresAt-90)/86400).toString();this.store.budgets[day]=Math.max(0,(this.store.budgets[day]??0)-x.cost);delete this.store.pending[ticket];}}
 pda(...parts){return web3.PublicKey.findProgramAddressSync(parts.map(x=>typeof x==='string'?Buffer.from(x):x),this.program)[0];}
 async account(address,type){const a=await this.connection.getAccountInfo(address,'confirmed');if(!a)return null;if(!a.owner.equals(this.program))throw Error('Yanlış hesap sahibi');return decodeAccount(this.idl,type,a.data);}
 async status(wallet,nullifier){const credential=this.pda('human',Buffer.from(nullifier,'hex'));const receipt=this.pda('launch-receipt',credential.toBuffer());const r=await this.account(receipt,'LaunchReceipt');return r?{status:r.claimed?'claimed':'enrolled',eligibleAt:Number(r.eligible_at)}:{status:'verified'};}
 async prepare(session,action,proof) {
  const previous=this.preparing??Promise.resolve();let release;
  this.preparing=new Promise(resolve=>{release=resolve;});
  await previous;
  try{return await this.prepareLocked(session,action,proof);}finally{release();}
 }
 async prepareLocked(session,action,proof) {
  if(!['enroll','claim'].includes(action))throw Error('Talimat izinli değil');
  const existing=Object.entries(this.store.pending).find(([,x])=>x.sessionId===session.id&&x.action===action&&!x.used&&x.expiresAt>this.now());
  if(existing)return {ticket:existing[0],transaction:existing[1].transaction};
  this.releaseExpired();const today=Math.floor(this.now()/86400).toString(),attempts=(this.store.prepares??={})[session.id+':'+today]??0;
  if(attempts>=this.maxPreparesPerSession)throw Error('Bu başvuru için bugünkü işlem hazırlama sınırına ulaşıldı');
  const person=key(session.wallet),config=this.pda('config');const cfg=await this.account(config,'Config');if(!cfg||!cfg.live||cfg.closed||cfg.paused)throw Error('Dağıtım şu anda açık değil');
  const policy=await this.account(this.pda('identity-policy'),'IdentityPolicy');if(!policy||policy.verifier!==proof.publicKey||policy.verifier===this.sponsor.publicKey.toBase58())throw Error('Kimlik doğrulayıcısı zincirdeki ayarla uyuşmuyor');
  const mint=key(cfg.mint),credential=this.pda('human',Buffer.from(proof.nullifier,'hex')),receipt=this.pda('launch-receipt',credential.toBuffer());
  const identity=await this.account(credential,'Credential'),r=await this.account(receipt,'LaunchReceipt');
  if(identity&&(identity.owner!==session.wallet||!identity.active||Buffer.from(identity.nullifier.map(Number)).toString('hex')!==proof.nullifier))throw Error('Bu kişi hakkı başka cüzdanda veya kapalı');
  const accounts={config,mint,credential,receipt,person,owner:person,wallet_identity:this.pda('id-wallet',person.toBuffer()),identity_policy:this.pda('identity-policy'),instructions:web3.SYSVAR_INSTRUCTIONS_PUBKEY,account_payer:this.sponsor.publicKey,system_program:web3.SystemProgram.programId,token_program:spl.TOKEN_PROGRAM_ID,launch:this.pda('launch-claims')};
  const instructions=[web3.ComputeBudgetProgram.setComputeUnitLimit({units:400_000})];let rent=0;
  if(action==='enroll') {
   if(r)throw Error('Başvuru zaten kayıtlı');
   if(!identity){const message=proofMessage(this.program,config,person,proof.nullifier,proof.proofDigest,proof.issuedAt,proof.expiresAt);instructions.push(web3.Ed25519Program.createInstructionWithPublicKey({publicKey:key(proof.publicKey).toBytes(),message,signature:Buffer.from(proof.signature,'base64')}));instructions.push(heliInstruction(this.idl,this.program,'issue_credential',{nullifier:Array.from(Buffer.from(proof.nullifier,'hex')),proof_digest:Array.from(Buffer.from(proof.proofDigest,'hex')),issued_at:proof.issuedAt,expires_at:proof.expiresAt},accounts));rent+=await this.connection.getMinimumBalanceForRentExemption(137);rent+=await this.connection.getMinimumBalanceForRentExemption(40);}
   instructions.push(heliInstruction(this.idl,this.program,'enroll_launch',{},accounts));rent+=await this.connection.getMinimumBalanceForRentExemption(82);
  } else {
   if(!identity||!r||!r.valid||r.claimed||r.owner!==session.wallet)throw Error('Teslimat hakkı yok');
   if(this.now()<Number(r.eligible_at))throw Error('Yedi günlük bekleme devam ediyor');
   const destination=spl.getAssociatedTokenAddressSync(mint,person);accounts.destination=destination;
   if(!await this.connection.getAccountInfo(destination)){instructions.push(spl.createAssociatedTokenAccountIdempotentInstruction(this.sponsor.publicKey,destination,person,mint));rent+=await this.connection.getMinimumBalanceForRentExemption(165);}
   instructions.push(heliInstruction(this.idl,this.program,'claim_launch',{},accounts));
  }
  const block=await this.connection.getLatestBlockhash('confirmed');const tx=new web3.Transaction({feePayer:this.sponsor.publicKey,recentBlockhash:block.blockhash}).add(...instructions);
  const fee=(await this.connection.getFeeForMessage(tx.compileMessage(),'confirmed')).value;if(fee===null)throw Error('İşlem ücreti hesaplanamadı');
  const cost=rent+fee,day=Math.floor(this.now()/86400).toString(),spent=this.store.budgets[day]??0;
  if(spent+cost>this.dailyCap)throw Error('Günlük masraf sınırına ulaşıldı');
  const balance=await this.connection.getBalance(this.sponsor.publicKey,'confirmed');if(balance<cost)throw Error('Dağıtımın işlem bütçesi yetersiz');
  tx.partialSign(this.sponsor);const transaction=tx.serialize({requireAllSignatures:false}).toString('base64');
  const ticket=createHash('sha256').update(tx.serializeMessage()).digest('hex');
  this.store.budgets[day]=spent+cost;this.store.prepares[session.id+':'+today]=attempts+1;this.store.pending[ticket]={sessionId:session.id,action,day,message:tx.serializeMessage().toString('base64'),transaction,block,cost,expiresAt:this.now()+90,used:false};this.store.save();
  return {ticket,transaction};
 }
 async submit(session,ticket,raw){
  const plan=this.store.pending[ticket];if(!plan||plan.sessionId!==session.id||plan.expiresAt<this.now())throw Error('İşlem planının süresi doldu');
  if(plan.used){if(plan.failed)throw Error('Zincir işlemi başarısız; yeni işlem hazırlayın');if(plan.signature)return {signature:plan.signature,pending:!plan.confirmed};throw Error('İşlem zaten gönderiliyor');}
  const bytes=Buffer.from(raw,'base64');if(bytes.length>1232)throw Error('İşlem boyutu geçersiz');const tx=web3.Transaction.from(bytes);
  if(tx.serializeMessage().toString('base64')!==plan.message||!tx.verifySignatures())throw Error('Değiştirilmiş veya imzasız işlem');
  // Persist submitted signature before confirmation; a timeout never resubmits a new payment.
  plan.used=true;this.store.save();
  try {plan.signature=await this.connection.sendRawTransaction(bytes,{skipPreflight:false,maxRetries:2});this.store.save();}
  catch(e){plan.used=false;this.store.save();throw e;}
  let result;
  try {result=await this.connection.confirmTransaction({signature:plan.signature,...plan.block},'confirmed');}
  catch(e){this.store.save();return {signature:plan.signature,pending:true};}
  if(result.value.err){plan.failed=true;this.store.save();throw Error('Zincir işlemi başarısız; yeni işlem hazırlayın');}
  plan.confirmed=true;session.status=plan.action==='claim'?'claimed':'enrolled';this.store.save();return {signature:plan.signature,pending:false};
 }
}
