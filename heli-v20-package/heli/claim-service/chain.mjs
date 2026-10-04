import {createHash} from 'node:crypto';
import {SponsoredChain,decodeAccount} from '../mobile/solana.mjs';
const size=t=>t==='publicKey'?32:t==='bool'?1:typeof t==='string'?Number(t.slice(1))/8:t.array?size(t.array[0])*t.array[1]:NaN;
export class V20Chain extends SponsoredChain {
 async account(address,type){const a=await this.connection.getAccountInfo(address,'confirmed');if(!a)return null;
  const fields=this.idl.accounts.find(x=>x.name===type)?.type.fields;
  const expected=createHash('sha256').update('account:'+type).digest().subarray(0,8);
  const minimum=8+(fields??[]).reduce((n,f)=>n+size(f.type),0);
  if(!fields||!Number.isFinite(minimum)||!a.owner.equals(this.program)||a.data.length<minimum||!a.data.subarray(0,8).equals(expected))throw Error('Invalid HELI account');
  return decodeAccount(this.idl,type,a.data);
 }
 async status(wallet,nullifier){const credential=this.pda('human',Buffer.from(nullifier,'hex'));const c=await this.account(credential,'Credential');if(c&&(!c.active||c.owner!==wallet))throw Error('Identity credential is not active for this wallet');const r=await this.account(this.pda('launch-receipt',credential.toBuffer()),'LaunchReceipt');if(r&&(!c||!r.valid||r.owner!==wallet))throw Error('Application entitlement is unavailable');return r?{status:r.claimed?'claimed':'enrolled',eligibleAt:Number(r.eligible_at)}:{status:'verified'};}
}
