import assert from 'node:assert/strict';
const base=new URL(process.argv[2] || 'http://127.0.0.1:8874/ofertas/dge/');
if(!['127.0.0.1','localhost','www.ultimamilla.com.ar'].includes(base.hostname) || base.pathname!=='/ofertas/dge/') throw new Error('Unapproved smoke target');
if(base.hostname==='www.ultimamilla.com.ar' && base.protocol!=='https:') throw new Error('Public smoke requires HTTPS');
const username=process.env.DGE_SMOKE_USERNAME || 'dge_demo';
const password=process.env.DGE_SMOKE_PASSWORD || '';
if(!password) throw new Error('DGE_SMOKE_PASSWORD required; never put it in source');
const origin=process.env.DGE_SMOKE_ORIGIN || base.origin;
if(origin!==base.origin && origin!=='https://www.ultimamilla.com.ar') throw new Error('Unapproved Origin');
const proxy=origin!==base.origin ? {Host:'www.ultimamilla.com.ar','X-Forwarded-Proto':'https'} : {};
const get=(path='',cookie='')=>fetch(new URL(path,base),{redirect:'manual',headers:{...proxy,Cookie:cookie}});
const post=(path,body='',cookie='',source=origin)=>fetch(new URL(path,base),{method:'POST',redirect:'manual',headers:{...proxy,Origin:source,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body});
for(const path of ['', 'index.html','assets/um-logo.svg','assets/documentos/curso-demo-v2.pdf','assets/documentos/curso-demo-v2-1.png','assets/documentos/curso-demo-v2-thumb.png']) {
  const r=await get(path); assert.equal(r.status,303); assert.equal(r.headers.get('location'),'/ofertas/dge/login');
}
assert.equal((await get('/dge-private/client/index.html')).status,404);
assert.equal((await post('login','username=demo_invalid&password=demo_invalid')).status,401);
assert.equal((await post('login','x=y','','https://untrusted.invalid')).status,403);
const login=await post('login',new URLSearchParams({username,password})); assert.equal(login.status,303);
const setCookie=login.headers.get('set-cookie'); assert.match(setCookie,/HttpOnly/); assert.match(setCookie,/SameSite=Strict/);
if(base.protocol==='https:' || origin==='https://www.ultimamilla.com.ar') assert.match(setCookie,/; Secure/);
const cookie=setCookie.split(';')[0];
const app=await get('',cookie); assert.equal(app.status,200); const html=await app.text();assert.match(html,/id="root"/);
const js=html.match(/src="\.\/(assets\/[^" ]+\.js)"/)?.[1];assert.ok(js,'Compiled demo module missing');
assert.equal((await get(js)).status,303); assert.equal((await get(js,cookie)).status,200);
assert.equal((await get('/'+js)).status,404);
for(const [path,type] of [['assets/documentos/curso-demo-v2.pdf','application/pdf'],['assets/documentos/curso-demo-v2-1.png','image/png'],['assets/documentos/curso-demo-v2-thumb.png','image/png']]) {
  const document=await get(path,cookie); assert.equal(document.status,200); assert.equal(document.headers.get('content-type'),type); assert.match(document.headers.get('cache-control'),/no-store/);
  assert.equal((await get('/'+path)).status,404);
}
assert.equal((await get('',cookie.split('=')[0]+'=expired-or-forged')).status,303);
assert.equal((await post('logout','',cookie)).status,303);
assert.equal((await get('',cookie)).status,303);
console.log(JSON.stringify({target:base.href,checks:'anonymous HTML/JS/PDF/page/thumbnail blocked; no public bypass; bad key and CSRF denied; login and private module/documents pass; forged/revoked sessions denied',result:'passed'}));
