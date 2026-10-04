import {completedMonths} from './calendar.mjs';
export function chainTelemetry(adapter,state,config){
 const s=adapter.latestSnapshot,c=s?.config,p=s?.policy;
 return {snapshotTime:adapter.snapshotTime??null,chainTime:s?.now??null,
 lastSettledMonth:c?Number(c.last_settled_epoch):null,
 overdueMonths:c?Math.max(0,completedMonths(Number(c.start),s.now)-Number(c.last_settled_epoch)):null,
 paused:c?.paused??null,closed:c?.closed??null,manifestBound:c?.manifest_bound??null,
 observationCount:p?Number(p.count):null,lastObservation:p&&Number(p.count)>0?Number(p.times[(Number(p.next)+23)%24]):null,
 balanceLamports:adapter.measuredBalance??null,balanceTime:adapter.balanceTime??null,
 reserveLamports:config.reserveLamports,dailyCapLamports:config.dailyCapLamports,
 reservedTodayLamports:state.budgets[Math.floor(Date.now()/86400000).toString()]??0};
}
export async function sampleBalance(adapter){
 if(!adapter.payer||adapter.balanceTime&&Date.now()-Date.parse(adapter.balanceTime)<60000)return;
 try{const b=await adapter.balance();if(!Number.isSafeInteger(b)||b<0)throw Error('Invalid balance');adapter.measuredBalance=b;adapter.balanceTime=new Date().toISOString();}catch{/* Monitoring cannot change a transaction result; the old reading becomes stale. */}
}
