import {createServer} from 'node:http';import {readFileSync} from 'node:fs';import {pathToFileURL} from 'node:url';
import {assess,publicHealth} from './health.mjs';
export function operationsServer({readHealth=()=>{try{return JSON.parse(readFileSync(new URL('../keeper/.state/health.json',import.meta.url),'utf8'));}catch{return null;}}}={}){
 return createServer((req,res)=>{
  const send=(code,type,body)=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'"});res.end(body);};
  if(req.method!=='GET')return send(405,'application/json','{"error":"read-only"}');
  const hostname=req.headers.host??'';if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(hostname))return send(403,'application/json','{"error":"local-only"}');
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(['/api/status','/healthz'].includes(path)){let raw;try{raw=readHealth();}catch{raw=null;}const health=publicHealth(raw),status=assess(health);return send(path==='/healthz'&&!status.ready?503:200,'application/json; charset=utf-8',JSON.stringify({health,...status}));}
  const files={'/':['index.html','text/html'],'/app.mjs':['app.mjs','text/javascript'],'/finance.mjs':['finance.mjs','text/javascript'],'/style.css':['style.css','text/css']};
  if(!files[path])return send(404,'text/plain','Not found');
  const [file,type]=files[path];return send(200,type+'; charset=utf-8',readFileSync(new URL(file,import.meta.url)));
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const port=Number(process.env.HELI_OPERATIONS_PORT??8771);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');operationsServer().listen(port,'127.0.0.1',()=>console.log('HELI operations: http://127.0.0.1:'+port));}
