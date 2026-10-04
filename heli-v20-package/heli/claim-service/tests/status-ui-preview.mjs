// Local visual fixture only: no provider calls, wallet signatures or token delivery.
import {createClaimServer} from '../server.mjs';
const origin='http://127.0.0.1:8783',id='00000000-0000-4000-8000-000000000001',token='0'.repeat(64);
const session={id,wallet:'Fictional preview wallet',status:'declined'};
const admission={program:'local-ui-fixture',get(i,t){if(i!==id||t!==token)throw Error('Application access denied');return session;},session(){throw Error('Preview only');}};
const server=createClaimServer({origin,admission,mode:'demo'});
server.listen(8783,'127.0.0.1',()=>console.log('Local status UI fixture ready'));
