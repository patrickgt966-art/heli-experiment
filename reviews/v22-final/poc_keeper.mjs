// Planner-only synthetic snapshot. No RPC, server, private key or transaction.
import {plan} from '../../heli-v20-package/heli/keeper/planner.mjs';
import {pollDelay} from '../../heli-v20-package/heli/keeper/poll.mjs';
import assert from 'node:assert/strict';
const now=1800000000;
const state={now,config:{live:true,closed:false,paused:false,start:now-86400,last_settled_epoch:0,manifest_bound:true},epoch:{number:1,settled:false},auction:{finalized:true},policy:{mark_time:now-7200,shallow_seen:now,shallow_since:now-7200}};
const first=plan(state),second=plan({...state,now:now+240,policy:{...state.policy,shallow_seen:now+240}});
assert.equal(first.name,'observe_release_market');assert.equal(second.name,'observe_release_market');
console.log(JSON.stringify({first,second,afterConfirmedDelayMs:pollDelay({status:'confirmed'},state),note:'Successful shallow observations update shallow_seen, not mark_time. Planner continues scheduling before one hour has elapsed; confirmed transactions trigger another poll after two seconds.'},null,2));
