import {boundary,completedMonths} from './calendar.mjs';
// Decisions derive from confirmed chain state, never a remembered wall-clock schedule.
export function plan(s){
 const c=s.config,now=s.now,start=Number(c.start),last=Number(c.last_settled_epoch);
 // Pause does not stop the monthly rule (program H2-B); it only suppresses price observations below.
 if(!c.live&&!c.closed)return null;
 // After the 60-year close only price observations continue (owner decision V22), so unsold inventory keeps a current floor.
 if(!c.closed){
 if(s.auction&&!s.auction.finalized&&now>=start)return {name:'finalize_auction',key:'auction'};
 const next=last+1,due=completedMonths(start,now),e=s.epoch;
 if(next<=720&&now>=boundary(start,next-1)){
  if(!e)return {name:'open_epoch',number:next,key:'open:'+next};
  if(Number(e.number)!==next||e.settled)throw Error('Inconsistent epoch state');
  if(next<=due){
   return {name:'settle',number:next,key:'settle:'+next};
  }
 }
 if(last===720&&now>=boundary(start,720))return {name:'close_constitution',key:'constitution'};
 }
 if(c.manifest_bound&&!c.paused&&s.policy){
  // The program arms on the first call and samples hourly after its mark (only bids that rested since then count).
  const mark=Number(s.policy.mark_time);
  if(mark===0||now-mark>=3600)return {name:'observe_release_market',key:'observe:'+Math.floor(now/3600)};
 }
 return null;
}
