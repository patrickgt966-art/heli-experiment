// For an external supervisor, run on the keeper host. Non-zero exit means attention needed.
import {readFileSync} from 'node:fs';import {assess,publicHealth} from './health.mjs';
let health=null;try{health=publicHealth(JSON.parse(readFileSync(new URL('../keeper/.state/health.json',import.meta.url),'utf8')));}catch{}
const result=assess(health);console.log(JSON.stringify(result,null,2));process.exitCode=result.ready?0:2;
