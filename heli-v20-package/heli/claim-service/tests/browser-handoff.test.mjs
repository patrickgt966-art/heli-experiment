import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context={module:{exports:{}}};
runInNewContext(readFileSync(new URL('../browser-handoff.js',import.meta.url),'utf8'),context);
const {applicationLink,applicationFromFragment}=context.module.exports;
test('browser transfer preserves the existing application without exposing credentials in a request URL',()=>{
 const s={id:'4258fa7b-d285-4862-aec1-c372f08dda5f',token:'a'.repeat(64),wallet:'not-needed',verificationUrl:'not-transferred'};
 const u=new URL(applicationLink('https://pilot.example',s));
 assert.equal(u.search,'');assert.equal(u.pathname,'/');assert(!u.origin.includes(s.token));
 const restored=applicationFromFragment(u.hash);
 assert.equal(restored.id,s.id);assert.equal(restored.token,s.token);assert.equal(restored.wallet,undefined);
 assert(!u.href.includes('not-transferred'));
});
test('malformed browser transfer does not substitute application credentials',()=>{
 assert.equal(applicationFromFragment('#home'),null);
 for(const value of ['#application=bad','#application='+encodeURIComponent(JSON.stringify({id:'wrong',token:'a'.repeat(64)})),'#application='+encodeURIComponent(JSON.stringify({id:'4258fa7b-d285-4862-aec1-c372f08dda5f',token:'wrong'}))])assert.throws(()=>applicationFromFragment(value));
});
test('landing in a new browser restores the same authenticated application, clears the fragment and never creates another session',async()=>{
 const id='4258fa7b-d285-4862-aec1-c372f08dda5f',token='a'.repeat(64),stored=new Map(),nodes=new Map(),requests=[];
 let cleaned=false;
 const ctx={console,URL,Date,TextEncoder,AbortController,setTimeout,clearTimeout,navigator:{userAgent:'iPhone Safari'},window:{addEventListener(){}},location:{origin:'https://pilot.example',pathname:'/',hash:new URL(applicationLink('https://pilot.example',{id,token})).hash},history:{replaceState(){cleaned=true;}},localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},document:{getElementById(k){if(!nodes.has(k))nodes.set(k,{hidden:false,textContent:'',classList:{toggle(){},add(){}}});return nodes.get(k);}},fetch:async(path,options)=>{
  requests.push(path);
  if(path==='/api/config')return {json:async()=>({mode:'identity'})};
  assert(cleaned,'fragment removed before application request');assert.equal(path,'/api/status');
  const body=JSON.parse(options.body);assert.equal(body.id,id);assert.equal(body.token,token);
  return {ok:true,json:async()=>({status:'verifying',wallet:'test-wallet',verificationUrl:'https://verify.didit.me/session/existing'})};
 }};
 runInNewContext(readFileSync(new URL('../browser-handoff.js',import.meta.url),'utf8'),ctx);
 await runInNewContext(readFileSync(new URL('../app.js',import.meta.url),'utf8'),ctx);
 assert.deepEqual(requests,['/api/config','/api/status']);
 assert.equal(JSON.parse(stored.get('heli-v20-claim-session')).verificationUrl,'https://verify.didit.me/session/existing');
 assert.equal(nodes.get('verify').hidden,false);assert.equal(nodes.get('connect').hidden,true);
});
test('Refresh displays a declined result and a failed check visibly, then recovers without creating a new application',async()=>{
 const nodes=new Map(),id='4258fa7b-d285-4862-aec1-c372f08dda5f',token='a'.repeat(64),stored=new Map([['heli-v20-claim-session',JSON.stringify({id,token})]]),requests=[];
 let fail=false;
 const ctx={console,URL,Date,TextEncoder,AbortController,setTimeout,clearTimeout,navigator:{userAgent:'Safari'},window:{addEventListener(){}},location:{origin:'https://pilot.example',pathname:'/',hash:''},history:{replaceState(){}},localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},document:{getElementById(k){if(!nodes.has(k))nodes.set(k,{hidden:false,textContent:'',classList:{toggle(){},add(){}}});return nodes.get(k);}},fetch:async(path)=>{
  requests.push(path);if(path==='/api/config')return {json:async()=>({mode:'identity'})};
  assert.equal(path,'/api/status');if(fail)throw Error('Network unavailable');
  return {ok:true,json:async()=>({status:'declined',wallet:'test-wallet'})};
 }};
 runInNewContext(readFileSync(new URL('../browser-handoff.js',import.meta.url),'utf8'),ctx);
 await runInNewContext(readFileSync(new URL('../app.js',import.meta.url),'utf8'),ctx);
 assert.equal(nodes.get('resultTitle').textContent,'Application declined');assert.equal(nodes.get('applicationResult').hidden,false);
 assert.match(nodes.get('applicationResult').className,/rejected/);assert.match(nodes.get('resultChecked').textContent,/Last check:/);
 fail=true;await nodes.get('refresh').onclick();
 assert.equal(nodes.get('resultTitle').textContent,'Could not refresh status');assert.equal(nodes.get('resultDetail').textContent,'Network unavailable');assert.equal(nodes.get('refresh').disabled,false);
 fail=false;await nodes.get('refresh').onclick();assert.equal(nodes.get('resultTitle').textContent,'Application declined');
 assert(!requests.includes('/api/session'));assert(!requests.includes('/api/authenticate'));
});
