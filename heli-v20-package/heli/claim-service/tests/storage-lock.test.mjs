// The state file has a single writer. Synthetic temporary directory only.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {storage} from '../storage.mjs';
const dir=()=>mkdtempSync(join(tmpdir(),'heli-lock-'));

test('a second writer is refused while the first is running',()=>{
 const d=dir(),file=join(d,'claim.sqlite');
 try{const a=storage(file);assert.equal(readFileSync(file+'.lock','utf8'),String(process.pid));
  assert.throws(()=>storage(file),/EEXIST/);a.close();assert.equal(existsSync(file+'.lock'),false);
  const b=storage(file);b.close();}finally{rmSync(d,{recursive:true,force:true});}
});

test('a lock left by a process that no longer exists is recovered, and data survives',async()=>{
 const d=dir(),file=join(d,'claim.sqlite');
 try{
  const a=storage(file);a.sessions.x={id:'x',status:'verifying'};a.save();a.close();
  const child=spawn(process.execPath,['-e','0']);const pid=await new Promise(r=>child.on('exit',()=>r(child.pid)));
  writeFileSync(file+'.lock',String(pid));
  const b=storage(file);assert.equal(b.sessions.x.status,'verifying');assert.equal(readFileSync(file+'.lock','utf8'),String(process.pid));b.close();
 }finally{rmSync(d,{recursive:true,force:true});}
});

test('a lock without a process ID is not removed automatically',()=>{
 const d=dir(),file=join(d,'claim.sqlite');
 try{writeFileSync(file+'.lock','');assert.throws(()=>storage(file),/delete/);assert.equal(existsSync(file+'.lock'),true);}finally{rmSync(d,{recursive:true,force:true});}
});
