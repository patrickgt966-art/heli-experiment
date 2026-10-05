import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {web3,spl} from '../mobile/deps.mjs';import {decodeAccount,heliInstruction} from '../mobile/solana.mjs';import {plan} from './planner.mjs';
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const MANIFEST=new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms');
const CLOCK=new web3.PublicKey('SysvarC1ock11111111111111111111111111111111');
export const DEVNET='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const sha=b=>createHash('sha256').update(b).digest('hex');
const allowed=new Set(['finalize_auction','open_epoch','settle','close_constitution','observe_release_market']);
export function base58(bytes){let n=0n;for(const b of bytes)n=n*256n+BigInt(b);let out='';const a='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';while(n){out=a[Number(n%58n)]+out;n/=58n;}for(const b of bytes){if(b!==0)break;out='1'+out;}return out;}
export function verifyProgramBytes(account,{hash,length,authority}){
 if(!/^[0-9a-f]{64}$/.test(hash)||!Number.isSafeInteger(length)||length<=0||!(authority===null||typeof authority==='string'))throw Error('Invalid program pin');
 if(!account||!account.owner.equals(LOADER)||account.data.length<45+length||account.data.readUInt32LE(0)!==3||![0,1].includes(account.data[12]))throw Error('Untrusted program data');
 const actual=account.data[12]===1?new web3.PublicKey(account.data.subarray(13,45)).toBase58():null;
 if(actual!==authority||sha(account.data.subarray(45,45+length))!==hash||account.data.subarray(45+length).some(x=>x!==0))throw Error('Program hash or upgrade authority changed');
 return {slot:Number(account.data.readBigUInt64LE(4)),authority:actual};
}
export class SolanaAdapter{
 constructor({connection,program,payer=null,trust,reserve=5_000_000}){
  Object.assign(this,{connection,program:new web3.PublicKey(program),payer,trust,reserve});this.idl=JSON.parse(readFileSync(new URL('../solana-v20/idl.json',import.meta.url)));
  const compiled=JSON.parse(readFileSync(new URL('../solana-v20/compiled-source.json',import.meta.url)));const elf=readFileSync(new URL('../solana-v20/heli_core_v20.so',import.meta.url));
  if(sha(elf)!==compiled.binary_sha256)throw Error('Local ELF hash mismatch');this.heliPin={hash:compiled.binary_sha256,length:elf.length,authority:trust.heliUpgradeAuthority};
  if(!Object.hasOwn(trust,'heliUpgradeAuthority')||!Object.hasOwn(trust,'manifestUpgradeAuthority')||!trust.admin)throw Error('Explicit trust pins required');
  this.slot=0;this.programCache=new Map();
 }
 pda(...parts){return web3.PublicKey.findProgramAddressSync(parts.map(x=>typeof x==='string'?Buffer.from(x):x),this.program)[0];}
 async info(k,extra={}){const x=await this.connection.getAccountInfoAndContext(k,{commitment:'confirmed',minContextSlot:this.slot,...extra});this.slot=Math.max(this.slot,x.context.slot);return x.value;}
 async account(k,type){const x=await this.info(k);if(!x)return null;const discriminator=createHash('sha256').update('account:'+type).digest().subarray(0,8);if(!x.owner.equals(this.program)||x.data.length<8||!x.data.subarray(0,8).equals(discriminator))throw Error('Account owner or type mismatch');return decodeAccount(this.idl,type,x.data);}
 async checkProgram(program,pin,force=false){const p=await this.info(program);if(!p?.executable||!p.owner.equals(LOADER)||p.data.length!==36||p.data.readUInt32LE(0)!==2)throw Error('Program unavailable or unsupported loader');const address=new web3.PublicKey(p.data.subarray(4,36));if(!address.equals(web3.PublicKey.findProgramAddressSync([program.toBuffer()],LOADER)[0]))throw Error('Noncanonical ProgramData');const header=await this.info(address,{dataSlice:{offset:0,length:45}});if(!header?.owner.equals(LOADER)||header.data.length!==45)throw Error('ProgramData unavailable');const stamp=header.data.toString('hex'),cached=this.programCache.get(program.toBase58());if(!force&&cached?.stamp===stamp&&Date.now()-cached.at<3600000)return cached.result;const result=verifyProgramBytes(await this.info(address),pin);this.programCache.set(program.toBase58(),{stamp,at:Date.now(),result});return result;}
 async snapshot({forcePins=false}={}){
  if(await this.connection.getGenesisHash()!==DEVNET)throw Error('Keeper pilot permits Devnet only');
  await this.checkProgram(this.program,this.heliPin,forcePins);
  const config=await this.account(this.pda('config'),'Config');if(!config)throw Error('HELI is not initialized');
  if(config.admin!==this.trust.admin)throw Error('Administrator pin changed');
  if(this.payer&&(config.admin===this.payer.publicKey.toBase58()||this.trust.heliUpgradeAuthority===this.payer.publicKey.toBase58()||this.trust.manifestUpgradeAuthority===this.payer.publicKey.toBase58()))throw Error('Keeper must use a wallet without administrative authority');
  if(config.manifest_bound){if(!this.trust.manifestHash||!Number.isSafeInteger(this.trust.manifestLength))throw Error('Manifest binary pin required');await this.checkProgram(MANIFEST,{hash:this.trust.manifestHash,length:this.trust.manifestLength,authority:this.trust.manifestUpgradeAuthority},forcePins);}
  const clock=await this.info(CLOCK);if(!clock||!clock.owner.equals(new web3.PublicKey('Sysvar1111111111111111111111111111111111111'))||clock.data.length!==40)throw Error('Invalid chain clock');
  const now=Number(clock.data.readBigInt64LE(32));const next=Number(config.last_settled_epoch)+1;
  const epoch=next<=720?await this.account(this.epoch(next).epoch,'Epoch'):null;
  const snapshot={config,now,epoch,auction:await this.account(this.pda('opening-auction'),'OpeningAuction'),policy:config.manifest_bound?await this.account(this.pda('release-policy'),'ReleasePolicy'):null};this.latestSnapshot=snapshot;this.snapshotTime=new Date().toISOString();return snapshot;
 }
 plan(s){return plan(s);}
 epoch(n){const seed=Buffer.alloc(2);seed.writeUInt16LE(n);return {epoch:this.pda('epoch',seed)};}
 instruction(job,s){
  if(!allowed.has(job.name))throw Error('Instruction outside keeper allowlist');
  const c=s.config,a={config:this.pda('config'),mint:c.mint,market_inventory:this.pda('market-inventory'),auction:this.pda('opening-auction'),policy:this.pda('release-policy'),manifest_market:c.manifest_market,manifest_program:MANIFEST,instructions:web3.SYSVAR_INSTRUCTIONS_PUBKEY,token_program:spl.TOKEN_PROGRAM_ID,system_program:web3.SystemProgram.programId,rent:web3.SYSVAR_RENT_PUBKEY,payer:this.payer?.publicKey};
  a.human=this.pda('vault',Buffer.from([0]));a.founder=this.pda('vault',Buffer.from([3]));
  a.release_reserve=a.human;a.management_stock=a.founder;
  if(job.number)Object.assign(a,this.epoch(job.number));
  const ix=heliInstruction(this.idl,this.program,job.name,job.name==='open_epoch'?{number:job.number}:{},a);
  if(ix.keys.some(k=>k.isSigner&&!k.pubkey.equals(this.payer.publicKey)))throw Error('Unexpected privileged signer');return ix;
 }
 async prepare(job,s){
  if(!this.payer)throw Error('Execution requires dedicated keeper key');
  const block=await this.connection.getLatestBlockhash({commitment:'confirmed',minContextSlot:this.slot});
  const tx=new web3.Transaction({feePayer:this.payer.publicKey,recentBlockhash:block.blockhash}).add(web3.ComputeBudgetProgram.setComputeUnitLimit({units:1_400_000}),this.instruction(job,s));
  tx.sign(this.payer);const raw=tx.serialize();if(raw.length>1232)throw Error('Keeper transaction too large');
  const simulation=await this.connection.simulateTransaction(tx);if(simulation.value.err)return {blocked:'Preflight rejected; no transaction sent'};
  const fee=(await this.connection.getFeeForMessage(tx.compileMessage(),'confirmed')).value;if(fee===null)throw Error('Fee estimate unavailable');
  let rent=0;if(job.name==='open_epoch')for(const size of [52])rent+=await this.connection.getMinimumBalanceForRentExemption(size);
  return {raw:raw.toString('base64'),signature:base58(tx.signature),lastValidBlockHeight:block.lastValidBlockHeight,cost:rent+fee,fee,rent};
 }
 async reserveFor(job,s,prepared){
  if(job.name!=='observe_release_market'||Number(s.config.last_settled_epoch)>=720)return this.reserve;
  // Preserve the next month's one epoch account + two one-signer maintenance fees.
  // No balance/treasury transfer occurs. Use current RPC rent, not an old V10 estimate.
  if(!this.nextEpochRent||Date.now()-this.nextEpochRent.at>=3600000){let rent=0;for(const size of [52])rent+=await this.connection.getMinimumBalanceForRentExemption(size);this.nextEpochRent={at:Date.now(),rent};}
  return this.reserve+this.nextEpochRent.rent+2*prepared.fee;
 }
 async send(raw){const tx=web3.Transaction.from(Buffer.from(raw,'base64'));if(!tx.verifySignatures()||!tx.feePayer.equals(this.payer.publicKey)||tx.instructions.length!==2||!tx.instructions[0].programId.equals(web3.ComputeBudgetProgram.programId)||!tx.instructions[1].programId.equals(this.program))throw Error('Journal transaction is invalid');const name=[...allowed].find(n=>tx.instructions[1].data.subarray(0,8).equals(createHash('sha256').update('global:'+n).digest().subarray(0,8)));if(!name)throw Error('Journal instruction not allowed');await this.snapshot({forcePins:true});const signature=await this.connection.sendRawTransaction(Buffer.from(raw,'base64'),{skipPreflight:false,maxRetries:0,minContextSlot:this.slot});if(signature!==base58(tx.signature))throw Error('RPC signature mismatch');return signature;}
 async status(signature){return (await this.connection.getSignatureStatuses([signature],{searchTransactionHistory:true})).value[0];}
 async height(){return this.connection.getBlockHeight('confirmed');}
 async balance(){return this.connection.getBalance(this.payer.publicKey,'confirmed');}
 async completed(job){const s=await this.snapshot();if(job.name==='open_epoch')return Boolean(await this.account(this.epoch(job.number).epoch,'Epoch'));if(job.name==='settle')return Number(s.config.last_settled_epoch)>=job.number;if(job.name==='finalize_auction')return Boolean(s.auction?.finalized);if(job.name==='close_constitution')return s.config.closed;if(job.name==='observe_release_market'&&s.policy)return Math.max(Number(s.policy.mark_time),Number(s.policy.shallow_seen||0))>=Number(job.key.split(':')[1])*3600;return false;}
 // Only maintenance operations may be replaced after blockhash expiry. All
 // financial/user/admin instructions are excluded. Init/settle/finalize guards
 // prevent duplicate allocations; cursor/observations advance monotonically.
 async safeToRetryExpired(job){if(!allowed.has(job.name))return false;await this.snapshot({forcePins:true});return true;}
}
