// Every page shares the same navigation and footer, links only to files that exist (and that the preview server
// serves), and keeps to the CSP: no inline scripts, inline styles or event handlers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const dir=new URL('../',import.meta.url);
const read=f=>readFileSync(new URL(f,dir),'utf8');
const pages=['check.html','index.html','guide.html','auction.html','live.html','risks.html','verify.html','updates.html','404.html'];
const server=read('server.mjs');
const navOf=html=>[...html.match(/<nav aria-label="Main navigation">(.*?)<\/nav>/s)[1].matchAll(/href="([^"]+)"/g)].map(m=>m[1].replace(/^\//,'').replace(/^index\.html/,''));

test('all pages share one navigation and one set of footer links',()=>{
 const footerOf=html=>[...html.match(/<div class="footer-links">(.*?)<\/div>/s)[1].matchAll(/href="([^"]+)"/g)].map(m=>m[1].replace(/^\//,'').replace(/^index\.html/,''));
 const nav=navOf(read('index.html')),foot=footerOf(read('index.html'));
 assert.deepEqual(nav,['check.html','#home','#transparency','live.html','guide.html','auction.html']);
 for(const p of pages){const h=read(p);assert.deepEqual(navOf(h),nav,p);assert.deepEqual(footerOf(h),foot,p);}
});
test('each page marks itself as the current page and has social preview tags',()=>{
 for(const p of ['check.html','guide.html','auction.html','live.html']){assert.match(read(p),new RegExp(`<a href="${p}" aria-current="page">`),p);}
 for(const p of pages){const h=read(p);for(const k of ['og:title','og:description','og:image'])assert.match(h,new RegExp(`property="${k}" content="[^"]+"`),`${p} ${k}`);}
});
test('local links and assets exist and are served by the preview server',()=>{
 for(const p of pages){
  for(const [,url] of read(p).matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){
   if(/^(https?:|mailto:)/.test(url))continue;
   const file=url.replace(/^\//,'')||'index.html';
   assert.ok(existsSync(new URL(file,dir)),`${p} links to missing ${url}`);
   assert.ok(server.includes(`'/${file}'`),`${p}: preview server does not serve ${file}`);
  }
 }
});
test('no inline scripts, styles or handlers (CSP script-src/style-src self)',()=>{
 for(const p of pages){const h=read(p);
  assert.doesNotMatch(h,/<script(?![^>]*\bsrc=)[^>]*>/,`${p} inline script`);assert.doesNotMatch(h,/<style\b/,`${p} style element`);
  assert.doesNotMatch(h,/\sstyle="/,`${p} style attribute`);assert.doesNotMatch(h,/\son[a-z]+="/,`${p} event handler`);}
});
