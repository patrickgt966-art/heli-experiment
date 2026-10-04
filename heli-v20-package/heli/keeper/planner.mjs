import {boundary,completedMonths} from './calendar.mjs';
// Decisions derive from confirmed chain state, never a remembered wall-clock schedule.
export function plan(s){
 const c=s.config,now=s.now,start=Number(c.start),last=Number(c.last_settled_epoch);
 if(!c.live||c.closed||c.paused)return null;
 if(s.auction&&!s.auction.finalized&&now>=start)return {name:'finalize_auction',key:'auction'};
 if(!c.launch_finalized&&now>=boundary(start,6))return {name:'finalize_launch',key:'launch'};
 const next=last+1,due=completedMonths(start,now),e=s.epoch;
 if(next<=720&&now>=boundary(start,next-1)){
  if(!e)return {name:'open_epoch',number:next,key:'open:'+next};
  if(Number(e.number)!==next||e.settled)throw Error('Inconsistent epoch state');
  if(next<=due){
   return {name:'settle',number:next,key:'settle:'+next};
  }
 }
 if(last===720&&now>=boundary(start,720))return {name:'close_constitution',key:'constitution'};
 if(c.manifest_bound&&!c.paused&&s.policy){
  const p=s.policy,lastIndex=(Number(p.next)+23)%24;
  if(Number(p.count)===0||now-Number(p.times[lastIndex])>=3600)return {name:'observe_release_market',key:'observe:'+Math.floor(now/3600)};
 }
 return null;
}
