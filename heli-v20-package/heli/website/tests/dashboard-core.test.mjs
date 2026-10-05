// The live dashboard reads accounts through the program IDL and recomputes the calendar, the rolling 30-day windows
// and the reference price like the program does.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as D from '../dashboard-core.js';
import {boundary as keeperBoundary} from '../../keeper/calendar.mjs';

const idl=JSON.parse(readFileSync(new URL('../idl.json',import.meta.url)));
test('the website IDL copy is identical to the program IDL',()=>{
 assert.deepEqual(idl,JSON.parse(readFileSync(new URL('../../solana-v20/idl.json',import.meta.url))));
});
test('monthly boundaries match the keeper calendar (month ends, leap years, 720 months)',()=>{
 for(const start of [Date.UTC(2026,9,12,10,18,56)/1000,Date.UTC(2027,0,31,23,59,59)/1000,Date.UTC(2028,1,29,0,0,1)/1000,Date.UTC(2026,7,31,12,0,0)/1000])
  for(const n of [0,1,2,3,11,12,13,25,48,359,719,720])assert.equal(D.boundary(start,n),keeperBoundary(start,n),`start ${start} month ${n}`);
});
test('rolling window: only today and the 30 days before count, like the program roll',()=>{
 const slots=Array(31).fill(0n);const day=20_000;slots[day%31]=5n;slots[(day-30)%31]=7n;slots[(day-10)%31]=1n;
 assert.equal(D.windowSum(slots,day,day*86400+100),13n);
 assert.equal(D.windowSum(slots,day,(day+1)*86400),6n,'the day 30 days back drops out the next day');
 assert.equal(D.windowSum(slots,day,(day+31)*86400),0n);
});
test('treasury room: 25%/12 of the reserve excluding unspent revenue, separate 12-unit fixed allowance',()=>{
 const t=D.treasury({reserve:1_200_000_000n,revenueTotal:300_000_000n,revenueSpent:100_000_000n,outDays:Array(31).fill(0n),fixDays:Array(31).fill(0n),outDay:0n,decimals:6,now:86400*5});
 assert.equal(t.unspent,200_000_000n);assert.equal(t.shareLimit,(1_200_000_000n-200_000_000n)*25n/1200n);assert.equal(t.fixedLimit,12_000_000n);
});
test('reference: time-weighted mean of 24 hourly samples, none when stale',()=>{
 const times=Array.from({length:24},(_,i)=>BigInt(1_000_000+i*3600)),prices=Array(24).fill(1_000_000n);prices[10]=10_000_000n;
 const p={count:24,next:0,times,prices};const now=1_000_000+23*3600+10;
 assert.equal(D.reference(p,now),(22n*1_000_000n+10_000_000n)/23n);assert.equal(D.reference(p,now+3600),null);assert.equal(D.reference({...p,count:23},now),null);
});
test('IDL decoding: Governance and Epoch read field by field and reject foreign accounts',async()=>{
 const g=Buffer.alloc(8+32+32+8+1+32+8+1);(await D.accountDiscriminator('Governance')).forEach((x,i)=>g[i]=x);g.fill(7,8,40);g.writeBigInt64LE(123n,72);g[g.length-1]=254;
 const gov=await D.decode(idl,'Governance',g);assert.equal(gov.recovery[0],7);assert.equal(gov.readyAt,123n);assert.equal(gov.bump,254);
 const e=Buffer.alloc(8+44);(await D.accountDiscriminator('Epoch')).forEach((x,i)=>e[i]=x);e.writeUInt16LE(3,8);e.writeBigUInt64LE(20_112_368_685n,10);
 const ep=await D.decode(idl,'Epoch',e);assert.equal(ep.number,3);assert.equal(ep.capacity,20_112_368_685n);
 await assert.rejects(D.decode(idl,'Epoch',g));
});
