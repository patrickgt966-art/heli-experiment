// Durable transaction identity: signature saved BEFORE submission. Uncertain
// outcomes stay pending while valid. After expiry only explicitly safe,
// allowlisted maintenance can be rebuilt following a fresh code/state check.
export class KeeperEngine {
 constructor({adapter,state,dryRun=true,dailyCap=50_000_000,now=()=>Date.now()}){Object.assign(this,{adapter,state,dryRun,dailyCap,now});}
 async step(){
  if(this.busy)throw Error('Keeper already running');this.busy=true;
  try{
   if(this.state.pending)return this.dryRun?{status:'dry-run-pending',signature:this.state.pending.signature}:await this.reconcile();
   const snapshot=await this.adapter.snapshot(),job=this.adapter.plan(snapshot);
   if(!job)return {status:'idle'};
   if(this.state.deferred?.key===job.key&&this.state.deferred.until>this.now())return {status:'backoff',job};
   if(this.dryRun)return {status:'dry-run',job};
   const prepared=await this.adapter.prepare(job,snapshot);
   if(prepared.blocked){this.state.deferred={key:job.key,until:this.now()+300000};this.state.save();return {status:'blocked',job,reason:prepared.blocked};}
   if(!Number.isSafeInteger(prepared.cost)||prepared.cost<0)throw Error('Invalid expense estimate');
   const day=Math.floor(this.now()/86400000).toString(),spent=this.state.budgets[day]??0;
   if(spent+prepared.cost>this.dailyCap)return {status:'budget-exhausted',job};
   const reserve=this.adapter.reserveFor?await this.adapter.reserveFor(job,snapshot,prepared):this.adapter.reserve;
   if(!Number.isSafeInteger(reserve)||reserve<0)throw Error('Invalid reserve');
   if(await this.adapter.balance()<prepared.cost+reserve)return {status:job.name==='observe_release_market'&&reserve>this.adapter.reserve?'essential-reserve':'insufficient-balance',job};
   this.state.budgets[day]=spent+prepared.cost;
   this.state.pending={...prepared,job,lastAttempt:this.now()};this.state.save();
   try{await this.adapter.send(prepared.raw);}catch{this.state.save();return {status:'uncertain',signature:prepared.signature};}
   return {status:'submitted',signature:prepared.signature,job};
  }finally{this.busy=false;}
 }
 async reconcile(){
  const p=this.state.pending,check=await this.adapter.status(p.signature);
  if(check){
   if(!['confirmed','finalized'].includes(check.confirmationStatus))return {status:'pending',signature:p.signature};
   this.state.last={job:p.job,signature:p.signature,failed:Boolean(check.err)};this.state.pending=null;
   if(check.err)this.state.deferred={key:p.job.key,until:this.now()+300000};
   this.state.save();return {status:check.err?'failed':'confirmed',...this.state.last};
  }
  const height=await this.adapter.height();
  if(height>p.lastValidBlockHeight){
   if(await this.adapter.completed(p.job)){this.state.last={job:p.job,signature:p.signature,observedOnChain:true};this.state.pending=null;this.state.save();return {status:'reconciled',...this.state.last};}
   if(this.adapter.safeToRetryExpired&&await this.adapter.safeToRetryExpired(p.job)){
    this.state.last={job:p.job,signature:p.signature,expiredMaintenanceRetry:true};this.state.pending=null;this.state.save();return {status:'expired-retry-safe',...this.state.last};
   }
   // RPC can omit historical signatures. Persist uncertainty for operator review.
   return {status:'expired-unknown',signature:p.signature,job:p.job};
  }
  if(this.now()-p.lastAttempt>=30000){p.lastAttempt=this.now();this.state.save();try{await this.adapter.send(p.raw);}catch{}}
  return {status:'pending',signature:p.signature};
 }
}
