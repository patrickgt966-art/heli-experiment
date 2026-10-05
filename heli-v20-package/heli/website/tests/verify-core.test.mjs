// Verify page checks (review of 6 Oct 2026): wrong owners and malformed loader accounts are rejected, code shorter
// than the published build never passes, and a check that could not run keeps the summary from saying "passed".
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as V from '../verify-core.js';

const sha=async b=>createHash('sha256').update(b).digest('hex');
const prog=(tag=2)=>{const d=Buffer.alloc(36);d.writeUInt32LE(tag,0);d.fill(5,4);return d;};
const pdata=(code,{tag=3,auth=1}={})=>{const d=Buffer.alloc(45+code.length);d.writeUInt32LE(tag,0);d[12]=auth;if(auth===1)d.fill(9,13,45);code.copy(d,45);return d;};

test('program account: loader-owned, executable, tag 2',()=>{
 assert.equal(V.readProgram({ownerBase58:V.LOADER,executable:true,data:prog()}).ok,true);
 assert.equal(V.readProgram({ownerBase58:'11111111111111111111111111111111',executable:true,data:prog()}).ok,false);
 assert.equal(V.readProgram({ownerBase58:V.LOADER,executable:false,data:prog()}).ok,false);
 assert.equal(V.readProgram({ownerBase58:V.LOADER,executable:true,data:prog(3)}).ok,false);
 assert.equal(V.readProgram(null).ok,false);
});
test('program data: a wrong owner, wrong tag or malformed authority is rejected (Codex: wrong owner was accepted)',()=>{
 const code=Buffer.from([1,2,3,4]);
 assert.equal(V.readProgramData({ownerBase58:'11111111111111111111111111111111',data:pdata(code,{auth:0})}).ok,false);
 assert.equal(V.readProgramData({ownerBase58:V.LOADER,data:pdata(code,{tag:2})}).ok,false);
 assert.equal(V.readProgramData({ownerBase58:V.LOADER,data:pdata(code,{auth:7})}).ok,false);
 const ok=V.readProgramData({ownerBase58:V.LOADER,data:pdata(code)});assert.equal(ok.ok,true);assert.equal(ok.authority[0],9);assert.deepEqual([...ok.code],[1,2,3,4]);
 assert.equal(V.readProgramData({ownerBase58:V.LOADER,data:pdata(code,{auth:0})}).authority,null);
});
test('code check: exact hash plus zero padding; shorter code never passes (Codex: 4 bytes passed as 1000)',async()=>{
 const elf=Buffer.from([7,7,7,0,7]),h=await sha(elf);
 assert.equal((await V.checkCode(Buffer.concat([elf,Buffer.alloc(16)]),{sha256:h,length:5},sha)).state,'ok');
 assert.equal((await V.checkCode(Buffer.concat([elf,Buffer.from([0,1])]),{sha256:h,length:5},sha)).state,'bad');
 const four=Buffer.from([1,2,3,4]);
 const short=await V.checkCode(four,{sha256:await sha(four),length:1000},sha);assert.equal(short.state,'bad');assert.match(short.why,/Only 4 bytes/);
 assert.equal((await V.checkCode(four,null,sha)).state,'warn');
});
test('summary: unchecked items make it "Incomplete", never "passed" (Codex: missing accounts gave All passed)',()=>{
 assert.equal(V.summarize(['ok','ok','none','ok']).text,'Incomplete · 1 not checked');
 assert.equal(V.summarize(['ok','warn','none']).text,'Incomplete · 1 not checked');
 assert.equal(V.summarize(['ok','bad','none']).text,'1 mismatch');
 assert.equal(V.summarize(['ok','warn']).text,'Passed · 1 to note');
 assert.equal(V.summarize(['ok','ok']).text,'All passed');
});
