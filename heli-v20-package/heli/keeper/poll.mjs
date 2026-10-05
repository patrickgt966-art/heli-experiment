import {boundary} from './calendar.mjs';
// Fewer idle reads; wake at known deadlines instead of waiting another full interval.
export function pollDelay(result,s){
 if(['confirmed','reconciled','submitted','pending','uncertain','expired-retry-safe'].includes(result.status))return 2000;
 let delay=240000;
 if(!s?.config||s.config.closed)return delay;
 const c=s.config,start=Number(c.start),next=Number(c.last_settled_epoch)+1,deadlines=[];
 if(s.auction&&!s.auction.finalized)deadlines.push(start);
 if(next<=720){deadlines.push(boundary(start,next));if(!s.epoch)deadlines.push(boundary(start,next-1));}
 if(c.manifest_bound&&!c.paused&&s.policy&&Number(s.policy.mark_time)>0)deadlines.push(Math.max(Number(s.policy.mark_time),Number(s.policy.shallow_seen||0))+3600);
 for(const t of deadlines)if(t>s.now)delay=Math.min(delay,(t-s.now)*1000);
 return Math.max(2000,delay);
}
