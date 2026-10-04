import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,openSync,closeSync,unlinkSync,writeSync,readFileSync} from 'node:fs';
// Single-writer lock holding the owner's process ID. A lock left by a process that no longer exists (window closed,
// forced stop) is removed; a lock held by a running process still blocks a second writer.
function alive(pid){try{process.kill(pid,0);return true;}catch(e){return e.code==='EPERM';}}
function acquire(file){
 try{const fd=openSync(file,'wx',0o600);writeSync(fd,String(process.pid));return fd;}
 catch(e){
  if(e.code!=='EEXIST')throw e;
  const pid=Number.parseInt(readFileSync(file,'utf8'),10);
  if(Number.isSafeInteger(pid)&&pid>0&&(pid===process.pid||alive(pid)))throw e;
  if(!Number.isSafeInteger(pid)||pid<=0){throw Object.assign(Error('Lock file without a process ID: stop all HELI services, then delete '+file),{code:'EEXIST'});}
  unlinkSync(file);const fd=openSync(file,'wx',0o600);writeSync(fd,String(process.pid));return fd;
 }
}
import {dirname} from 'node:path';
export function storage(path=':memory:') {
 let lock;
 if(path!==':memory:'){mkdirSync(dirname(path),{recursive:true});lock=acquire(path+'.lock');}
 const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL)');
 const row=db.prepare('SELECT json FROM state WHERE id=1').get();
 const state=row?JSON.parse(row.json):{sessions:{},people:{},events:{},budgets:{},pending:{}};
 return Object.assign(state,{save(){db.prepare('INSERT INTO state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(JSON.stringify(state));},close(){db.close();if(lock!==undefined){closeSync(lock);unlinkSync(path+'.lock');lock=undefined;}}});
}
