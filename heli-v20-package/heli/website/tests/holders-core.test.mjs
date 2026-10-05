// Holder map: token accounts become one bubble per owner with areas proportional to balances, project accounts
// are labelled, and the packed layout leaves no overlapping bubbles.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../holders-core.js';

test('token account bytes: owner at 32, amount at 64 (full account and 40-byte slice)',()=>{
 const full=new Uint8Array(165);full.fill(9,32,64);new DataView(full.buffer).setBigUint64(64,123_456n,true);
 const t=H.readTokenAccount(full);assert.equal(t.owner[0],9);assert.equal(t.amount,123_456n);
 const s=H.readTokenAccount(full.slice(32,72),true);assert.equal(s.amount,123_456n);assert.equal(s.owner[31],9);
});
test('one bubble per owner, empty accounts dropped, project accounts labelled, wallets ranked',()=>{
 const b=H.groupHolders([
  {address:'A1',owner:'alice',amount:100n},{address:'A2',owner:'alice',amount:50n},{address:'B1',owner:'bob',amount:200n},
  {address:'E1',owner:'eve',amount:0n},{address:'V0',owner:'config',amount:7000n},{address:'X',owner:'config',amount:5n},{address:'M',owner:'pda',amount:30n}],
  {byAddress:{V0:{kind:'reserve',label:'Market release reserve'}},byOwner:{config:{kind:'project',label:'Project account'}},isProgramOwned:o=>o==='pda'});
 assert.deepEqual(b.map(x=>[x.kind,x.amount,x.rank??null]),[['reserve',7000n,null],['wallet',200n,1],['wallet',150n,2],['program',30n,null],['project',5n,null]]);
 assert.deepEqual(H.stats(b),{wallets:2,inWallets:350n,largest:200n});
});
test('areas are proportional to balances',()=>{
 const r=H.radii([{amount:400n},{amount:100n}],900,600,0.5,0);assert.ok(Math.abs(r[0]/r[1]-2)<1e-9);
});
test('the example is labelled, stays within the 5M launch base and the layout has no overlaps',()=>{
 const b=H.groupHolders(H.exampleAccounts(),H.EXAMPLE_KNOWN);const s=H.stats(b);
 assert.ok(s.wallets>=40);assert.ok(s.inWallets<=4_900_000n*1_000_000n);assert.ok(s.largest<=250_000n*1_000_000n);
 assert.equal(b.reduce((t,x)=>t+x.amount,0n),H.TOTAL);
 for(const set of [b,b.filter(x=>x.kind==='wallet')]){const n=H.settle(H.initialNodes(set,900,600),900,600);assert.equal(H.overlaps(n),0);
  for(const x of n){assert.ok(x.x>-200&&x.x<1100&&x.y>-200&&x.y<800);}}
});
