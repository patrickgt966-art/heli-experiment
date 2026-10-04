import {readFileSync} from 'node:fs';import {cashPlan} from './finance.mjs';
const file=process.argv[2];if(!file)throw Error('Usage: node heli/operations/cash-plan.mjs budget-input.json');
console.log(JSON.stringify(cashPlan(JSON.parse(readFileSync(file,'utf8'))),null,2));
