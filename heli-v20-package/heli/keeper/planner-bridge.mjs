import {createInterface} from 'node:readline';import {plan} from './planner.mjs';
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){try{console.log(JSON.stringify({job:plan(JSON.parse(line))}));}catch(e){console.log(JSON.stringify({error:e.message}));}}
