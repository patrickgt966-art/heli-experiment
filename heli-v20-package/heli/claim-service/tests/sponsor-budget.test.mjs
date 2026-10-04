// Regression tests for review finding M6: repeatedly preparing (and abandoning) sponsored transactions
// must not exhaust the daily sponsor budget for everyone else.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {randomBytes} from 'node:crypto';
import {web3} from '../../mobile/deps.mjs';
import {SponsoredChain} from '../../mobile/solana.mjs';
const idl=JSON.parse(readFileSync(new URL('../../solana-v20/idl.json',import.meta.url)));
const program='HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',RENT=1_000_000,FEE=10_000,COST=3*RENT+FEE;
function chain(options={}){
 let now=100_000;const verifier=web3.Keypair.generate().publicKey.toBase58(),mint=web3.Keypair.generate().publicKey.toBase58();
 const connection={getLatestBlockhash:async()=>({blockhash:web3.Keypair.generate().publicKey.toBase58(),lastValidBlockHeight:1}),getFeeForMessage:async()=>({value:FEE}),getMinimumBalanceForRentExemption:async()=>RENT,getBalance:async()=>10e9};
 const store={pending:{},budgets:{},save(){}};
 const c=new SponsoredChain({program,idl,sponsor:web3.Keypair.generate(),connection,store,dailyCap:10_000_000,now:()=>now,...options});
 c.account=async(_,type)=>type==='Config'?{live:true,closed:false,paused:false,mint}:type==='IdentityPolicy'?{verifier}:null;
 const proof=()=>({publicKey:verifier,nullifier:randomBytes(32).toString('hex'),proofDigest:randomBytes(32).toString('hex'),issuedAt:now,expiresAt:now+600,signature:randomBytes(64).toString('base64')});
 const session=()=>({id:randomBytes(16).toString('hex'),wallet:web3.Keypair.generate().publicKey.toBase58()});
 return {c,store,proof,session,advance:s=>now+=s,day:()=>Math.floor(now/86400).toString()};
}

test('abandoned plans return their reservation once their blockhash can no longer land',async()=>{
 const f=chain(),s=f.session();
 for(let i=0;i<5;i++){await f.c.prepare(s,'enroll',f.proof());f.advance(300);}
 await f.c.prepare(f.session(),'enroll',f.proof());
 assert.equal(f.store.budgets[f.day()],COST,'only the one live plan stays reserved');
});

test('a plan that could still land keeps its reservation',async()=>{
 const f=chain();
 await f.c.prepare(f.session(),'enroll',f.proof());f.advance(100);
 await f.c.prepare(f.session(),'enroll',f.proof());
 assert.equal(f.store.budgets[f.day()],2*COST);
});

test('one application cannot keep re-preparing transactions all day',async()=>{
 const f=chain({maxPreparesPerSession:2}),s=f.session();
 for(let i=0;i<2;i++){await f.c.prepare(s,'enroll',f.proof());f.advance(300);}
 await assert.rejects(f.c.prepare(s,'enroll',f.proof()),/hazırlama sınırına/);
 await f.c.prepare(f.session(),'enroll',f.proof());
});

test('the daily cap still bounds concurrent live plans',async()=>{
 const f=chain();
 for(let i=0;i<3;i++)await f.c.prepare(f.session(),'enroll',f.proof());
 await assert.rejects(f.c.prepare(f.session(),'enroll',f.proof()),/Günlük masraf/);
});
