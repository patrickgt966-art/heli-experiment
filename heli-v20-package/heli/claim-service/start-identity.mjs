// Run only after HTTPS destination and workflow policy have been confirmed.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('./.private/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8').trim();
const origin=process.argv[2];if(!origin||new URL(origin).protocol!=='https:'||new URL(origin).origin!==origin)throw Error('Supply the verified HTTPS origin');
const secretFile=new URL('person-hmac.txt',root);if(!existsSync(secretFile))writeFileSync(secretFile,randomBytes(32).toString('hex'),{mode:0o600,flag:'wx'});
const policy=JSON.parse(read('workflow-confirmed.json'));if(!policy.confirmed||policy.editorWorkflowId!=='2856c2d4-eac4-45a9-b13d-09ebe05481f7'||policy.workflowId!=='a8a9365f-3306-4f9f-849a-4a565580f35d')throw Error('Check the live workflow policy and published API ID first');
const env={...process.env,HELI_MODE:'identity',PORT:'8782',HELI_CLAIM_PUBLIC_URL:origin,DIDIT_API_KEY:read('didit-api-key.txt'),DIDIT_WEBHOOK_SECRET:read('didit-webhook-secret.txt'),HELI_PERSON_HMAC_SECRET:read('person-hmac.txt'),DIDIT_WORKFLOW_ID:policy.workflowId,DIDIT_APPLICATION_ID:'ec9dac23-369c-4bba-8b13-82e3b8935f03',HELI_DUPLICATE_POLICY_CONFIRMED:'true'};
for(const key of ['DIDIT_API_KEY','DIDIT_WEBHOOK_SECRET','HELI_PERSON_HMAC_SECRET'])if(env[key].length<32)throw Error('Private credential is empty or incomplete: '+key);
const child=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{env,stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));
