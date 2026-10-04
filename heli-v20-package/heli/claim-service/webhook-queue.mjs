// Persist only routing metadata. Never store the incoming decision/documents.
export class WebhookQueue {
 constructor({admission,data,now=()=>Math.floor(Date.now()/1000)}){Object.assign(this,{admission,data,now});data.webhookJobs??={};this.busy=false;}
 enqueue(event){
  this.admission.validateWebhook(event);
  if(this.data.events[event.event_id]||this.data.webhookJobs[event.event_id])return;
  const e=Object.fromEntries(['event_id','webhook_type','environment','application_id','session_id','vendor_data','workflow_id'].map(k=>[k,event[k]]));
  this.data.webhookJobs[e.event_id]={event:e,attempts:0,nextAt:this.now()};this.data.save();
 }
 async step(){
  if(this.busy)return;this.busy=true;
  try{
   const entry=Object.entries(this.data.webhookJobs).find(([,j])=>j.nextAt<=this.now());if(!entry)return;
   const [id,j]=entry;
   try{await this.admission.webhook(j.event);delete this.data.webhookJobs[id];}
   catch{j.attempts++;j.nextAt=this.now()+Math.min(3600,5*2**Math.min(j.attempts,10));}
   this.data.save();
  }finally{this.busy=false;}
 }
}
