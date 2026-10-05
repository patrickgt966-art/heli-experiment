import http from 'node:http';
import { readFile } from 'node:fs/promises';
const allowed = new Map([['/','index.html'],['/index.html','index.html'],['/apply.html','apply.html'],['/style.css','style.css'],['/app.js','app.js'],['/apply.js','apply.js'],['/favicon.svg','favicon.svg'],['/logo.svg','logo.svg'],['/logo-512.png','logo-512.png'],['/token.json','token.json'],['/auction.html','auction.html'],['/auction.js','auction.js'],['/auction-core.js','auction-core.js'],['/site-config.js','site-config.js'],['/live.html','live.html'],['/live.js','live.js'],['/dashboard-core.js','dashboard-core.js'],['/idl.json','idl.json'],['/vendor/solana-web3.iife.min.js','vendor/solana-web3.iife.min.js'],['/charta-rules.txt','charta-rules.txt'],['/guide.html','guide.html'],['/risks.html','risks.html'],['/404.html','404.html'],['/robots.txt','robots.txt'],['/sitemap.xml','sitemap.xml']]);
const types = { html:'text/html; charset=utf-8', css:'text/css; charset=utf-8', js:'text/javascript; charset=utf-8', svg:'image/svg+xml', png:'image/png', json:'application/json; charset=utf-8', txt:'text/plain; charset=utf-8', xml:'application/xml; charset=utf-8' };
const server = http.createServer(async (req,res) => {
  const file = allowed.get(new URL(req.url,'http://127.0.0.1').pathname);
  if (!file || !['GET','HEAD'].includes(req.method)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const bytes = await readFile(new URL(file,import.meta.url));
    res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self' https://api.devnet.solana.com wss://api.devnet.solana.com http://127.0.0.1:8899 ws://127.0.0.1:8900; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});
    res.end(req.method==='HEAD'?undefined:bytes);
  } catch { res.writeHead(500); res.end('Unavailable'); }
});
server.listen(8780,'127.0.0.1',()=>console.log('Charta site preview: http://127.0.0.1:8780/'));
