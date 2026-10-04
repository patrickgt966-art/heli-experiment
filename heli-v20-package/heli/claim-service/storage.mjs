import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {dirname} from 'node:path';
export function storage(path=':memory:') {
 let lock;
 if(path!==':memory:'){mkdirSync(dirname(path),{recursive:true});lock=openSync(path+'.lock','wx',0o600);}
 const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL)');
 const row=db.prepare('SELECT json FROM state WHERE id=1').get();
 const state=row?JSON.parse(row.json):{sessions:{},people:{},events:{},budgets:{},pending:{}};
 return Object.assign(state,{save(){db.prepare('INSERT INTO state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(JSON.stringify(state));},close(){db.close();if(lock!==undefined){closeSync(lock);unlinkSync(path+'.lock');lock=undefined;}}});
}
