// The identity pilot runs behind a temporary tunnel. Its address is set once, in apply.html (#pilot-link);
// this check tells visitors whether it is reachable instead of sending them to a dead page.
const link=document.getElementById('pilot-link'),state=document.getElementById('pilot-state'),url=new URL('api/config',link.href);
function online(text){state.textContent=text;state.className='pilot-state online';}
function offline(){
  state.textContent='The identity pilot is offline right now. Please try again later.';state.className='pilot-state offline';
  link.setAttribute('aria-disabled','true');link.classList.add('disabled');link.addEventListener('click',e=>e.preventDefault());
}
const get=mode=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),20000);return fetch(url,{mode,cache:'no-store',signal:c.signal}).finally(()=>clearTimeout(t));};
get('cors')
  .then(r=>r.ok?r.json():Promise.reject(new Error('unavailable')))
  .then(c=>online(c.mode==='identity'?'Identity pilot online. Token delivery is not enabled.':'Pilot online.'))
  // A pilot without the site's CORS header (older server) still counts as reachable if the request completes.
  .catch(()=>get('no-cors').then(()=>online('Identity pilot online.'),offline));
