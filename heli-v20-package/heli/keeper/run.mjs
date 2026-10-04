import {readFileSync,mkdirSync,openSync,closeSync,writeFileSync,renameSync,unlinkSync,existsSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {web3} from '../mobile/deps.mjs';
import {KeeperEngine} from './engine.mjs';import {SolanaAdapter} from './adapter.mjs';
import {atomicJson} from './storage.mjs';import {chainTelemetry,sampleBalance} from './telemetry.mjs';
import {pollDelay} from './poll.mjs';
const args=process.argv.slice(2),execute=args.includes('--execute'),once=args.includes('--once');const path=args.find(x=>x.endsWith('.json'));if(!path)throw Error('Usage: node heli/keeper/run.mjs config.json [--once] [--execute]');
const config=JSON.parse(readFileSync(path)),program='HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv';
if(config.program!==program||!config.rpcUrl?.startsWith('https://'))throw Error('V20 and HTTPS RPC required');
if(!Number.isSafeInteger(config.dailyCapLamports)||config.dailyCapLamports<=0||!Number.isSafeInteger(config.reserveLamports)||config.reserveLamports<0)throw Error('Explicit expense caps required');
const root=fileURLToPath(new URL('./.state/',import.meta.url));mkdirSync(root,{recursive:true});const lock=root+'keeper.lock';
if(existsSync(lock)){const owner=JSON.parse(readFileSync(lock));try{process.kill(owner.pid,0);throw Error('Another keeper or reused PID holds lock');}catch(e){if(e.code!=='ESRCH')throw e;}unlinkSync(lock);}
const fd=openSync(lock,'wx',0o600);writeFileSync(fd,JSON.stringify({pid:process.pid}));closeSync(fd);
let stopped=false;const clean=()=>{if(!stopped){stopped=true;unlinkSync(lock);}};process.on('exit',clean);for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>process.exit(0));
const legacy=root+'journal.json';if(existsSync(legacy)&&JSON.parse(readFileSync(legacy)).pending)throw Error('Reconcile the pending legacy transaction before switching to V20');
const statePath=root+'journal-v20.json',state=existsSync(statePath)?JSON.parse(readFileSync(statePath)): {pending:null,budgets:{}};
state.save=()=>atomicJson(statePath,state);
const payer=execute?web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(config.keeperKeyFile)))):null;
const adapter=new SolanaAdapter({connection:new web3.Connection(config.rpcUrl,{commitment:'confirmed',confirmTransactionInitialTimeout:15000}),program,payer,trust:config.trust,reserve:config.reserveLamports});
const engine=new KeeperEngine({adapter,state,dryRun:!execute,dailyCap:config.dailyCapLamports});
let failures=0,waitMs=60000;
do{
 try{const result=await engine.step();await sampleBalance(adapter);failures=0;waitMs=pollDelay(result,adapter.latestSnapshot);const health={time:new Date().toISOString(),programVersion:'v20',mode:execute?'devnet-execute':'dry-run',...result,telemetry:chainTelemetry(adapter,state,config)};atomicJson(root+'health.json',health);console.log(JSON.stringify(health));if(once||!execute)break;}
 catch(e){failures++;const health={time:new Date().toISOString(),programVersion:'v20',mode:execute?'devnet-execute':'dry-run',status:'rpc-or-safety-stop',failures,telemetry:chainTelemetry(adapter,state,config)};atomicJson(root+'health.json',health);console.error(JSON.stringify(health));if(once||!execute)throw Error('Keeper stopped; inspect trusted configuration, RPC and chain state');}
 await new Promise(resolve=>setTimeout(resolve,failures?Math.min(60000,5000*2**Math.min(failures,4)):waitMs));
}while(!stopped);
