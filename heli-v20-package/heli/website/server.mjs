import http from 'node:http';
import { readFile } from 'node:fs/promises';
const allowed = new Map([['/','index.html'],['/index.html','index.html'],['/apply.html','apply.html'],['/style.css','style.css'],['/app.js','app.js'],['/apply.js','apply.js'],['/favicon.svg','favicon.svg'],['/charta-rules.txt','charta-rules.txt']]);
const types = { html:'text/html; charset=utf-8', css:'text/css; charset=utf-8', js:'text/javascript; charset=utf-8', svg:'image/svg+xml', txt:'text/plain; charset=utf-8' };
const server = http.createServer(async (req,res) => {
  const file = allowed.get(new URL(req.url,'http://127.0.0.1').pathname);
  if (!file || !['GET','HEAD'].includes(req.method)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const bytes = await readFile(new URL(file,import.meta.url));
    res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src https://*.trycloudflare.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});
    res.end(req.method==='HEAD'?undefined:bytes);
  } catch { res.writeHead(500); res.end('Unavailable'); }
});
server.listen(8780,'127.0.0.1',()=>console.log('Charta site preview: http://127.0.0.1:8780/'));
