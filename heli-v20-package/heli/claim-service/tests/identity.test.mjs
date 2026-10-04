import test from 'node:test';import assert from 'node:assert/strict';
import {WebhookQueue} from '../webhook-queue.mjs';import {createClaimServer} from '../server.mjs';import {storage} from '../storage.mjs';
import {createHmac} from 'node:crypto';
import {request} from 'node:http';
test('webhook queue durably acknowledges before provider lookup, excludes identity data and retries',async()=>{
 const data=storage(),event={event_id:'one',webhook_type:'status.updated',environment:'live',application_id:'app',session_id:'session',vendor_data:'application',workflow_id:'workflow',decision:{document_number:'PRIVATE-DOCUMENT'}};
 let now=100,calls=0,fail=true;
 const admission={validateWebhook(e){assert.equal(e.application_id,'app');},async webhook(e){calls++;if(fail)throw Error('provider down');data.events[e.event_id]=true;}};
 const q=new WebhookQueue({admission,data,now:()=>now});q.enqueue(event);q.enqueue(event);
 assert.equal(calls,0);assert.equal(Object.keys(data.webhookJobs).length,1);assert(!JSON.stringify(data).includes('PRIVATE-DOCUMENT'));
 await q.step();assert.equal(calls,1);assert(data.webhookJobs.one);await q.step();assert.equal(calls,1);
 now=111;fail=false;const restarted=new WebhookQueue({admission,data,now:()=>now});await restarted.step();assert.equal(calls,2);assert(!data.webhookJobs.one);
 restarted.enqueue(event);assert.equal(Object.keys(data.webhookJobs).length,0);data.close();
});
test('signed provider transport tests acknowledge without touching admission; forged tests fail',async()=>{
 const secret='transport-secret-'.repeat(3),origin='https://pilot.example';let admitted=0;
 const server=createClaimServer({origin,mode:'identity',admission:{program:'test'},webhookSecret:secret,queue:{enqueue(){admitted++;}},now:()=>2000});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const url='http://127.0.0.1:'+server.address().port+'/webhooks/didit',body=JSON.stringify({timestamp:2000,status:'Approved'});
  const headers={Host:'pilot.example','Content-Type':'application/json','x-timestamp':'2000','x-signature':createHmac('sha256',secret).update(body).digest('hex'),'x-didit-test-webhook':'true'};
  const post=h=>new Promise((resolve,reject)=>{const req=request(url,{method:'POST',headers:h},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,json:JSON.parse(text)}));});req.on('error',reject);req.end(body);});
  const ok=await post(headers);assert.equal(ok.status,200);assert.deepEqual(ok.json,{ok:true,test:true,admissionApplied:false});assert.equal(admitted,0);
  const forged=await post({...headers,'x-signature':'0'.repeat(64)});assert.equal(forged.status,400);assert.equal(admitted,0);
 }finally{await new Promise(r=>server.close(r));}
});
test('identity-only mode requires HTTPS and cannot attach a token delivery backend',()=>{
 const admission={program:'test'};
 assert.throws(()=>createClaimServer({origin:'http://example.com',admission,mode:'identity'}));
 assert.throws(()=>createClaimServer({origin:'https://example.com',admission,mode:'identity',chain:{}}));
 const server=createClaimServer({origin:'https://example.com',admission,mode:'identity'});assert(server);server.close();
});
