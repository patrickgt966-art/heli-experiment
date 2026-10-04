// The identity pilot runs behind a temporary tunnel. Its address is set once, in apply.html (#pilot-link);
// this check tells visitors whether it is reachable instead of sending them to a dead page.
const link=document.getElementById('pilot-link'),state=document.getElementById('pilot-state');
function offline(){
  state.textContent='The identity pilot is offline right now. Please try again later.';state.className='pilot-state offline';
  link.setAttribute('aria-disabled','true');link.classList.add('disabled');link.addEventListener('click',e=>e.preventDefault());
}
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
fetch(new URL('api/config',link.href),{cache:'no-store',signal:controller.signal})
  .then(r=>r.ok?r.json():Promise.reject(new Error('unavailable')))
  .then(c=>{state.textContent=c.mode==='identity'?'Identity pilot online. Token delivery is not enabled.':'Pilot online.';state.className='pilot-state online';})
  .catch(offline).finally(()=>clearTimeout(timer));
