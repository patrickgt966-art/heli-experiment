// Application credentials stay in a URL fragment, never a query or server log.
function handoffPayload(value) {
 if(!value || typeof value.id!=='string' || !/^[a-f0-9-]{36}$/i.test(value.id) || typeof value.token!=='string' || !/^[a-f0-9]{64}$/.test(value.token))throw Error('Invalid application link. Return to the wallet browser.');
 return {id:value.id,token:value.token};
}
function applicationLink(origin,session) {return origin+'/#application='+encodeURIComponent(JSON.stringify(handoffPayload(session)));}
function applicationFromFragment(fragment) {
 if(!fragment.startsWith('#application='))return null;
 return handoffPayload(JSON.parse(decodeURIComponent(fragment.slice(13))));
}
if(typeof module!=='undefined')module.exports={applicationLink,applicationFromFragment};
