import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { createDemoResponseHandler } from '../server/astro-adapter.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const clientDir=resolve(dirname(fileURLToPath(import.meta.url)),'../reviewed-client');
const origin='https://www.ultimamilla.com.ar',root=origin+'/ofertas/dge/';
const username='adapter_test',password='Synthetic-adapter-72',salt='b'.repeat(32);
const credentials={username,salt,hash:scryptSync(password,salt,64).toString('hex')};
test('Astro Request/Response conserva login, recursos privados y revocación',async()=>{
  const handle=await createDemoResponseHandler({credentials,origin,clientDir});
  const anonymous=await handle(new Request(root+'index.html'));
  assert.equal(anonymous.status,303); assert.equal(anonymous.headers.get('location'),'/ofertas/dge/login');
  const asset=await handle(new Request(root+'assets/um-logo.svg'));assert.equal(asset.status,303);
  const login=await handle(new Request(root+'login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username,password})}));
  assert.equal(login.status,303);const cookie=login.headers.get('set-cookie').split(';')[0];
  const app=await handle(new Request(root,{headers:{Cookie:cookie}}));assert.equal(app.status,200);assert.match(await app.text(),/id="root"/);
  const head=await handle(new Request(root+'login-assets/login.css',{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');
  const logout=await handle(new Request(root+'logout',{method:'POST',headers:{Origin:origin,Cookie:cookie}}));assert.equal(logout.status,303);
  assert.equal((await handle(new Request(root,{headers:{Cookie:cookie}}))).status,303);
});
test('Astro rechaza CSRF, ruta transversal y cuerpo excesivo sin abrir sockets',async()=>{
  const handle=await createDemoResponseHandler({credentials,origin,clientDir});
  const bad=await handle(new Request(root+'login',{method:'POST',headers:{Origin:'https://bad.invalid','Content-Type':'application/x-www-form-urlencoded'},body:'x=y'}));assert.equal(bad.status,403);
  const path=await handle(new Request(root+'assets/%2e%2e%2fserver/app.mjs'));assert.equal(path.status,400);
  const oversized=await handle(new Request(root+'login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:'x='.padEnd(5000,'a')}));assert.equal(oversized.status,413);
});
test('caducidad real del handler compartido con reloj controlado',async()=>{
  let now=0;
  const handle=await createDemoResponseHandler({credentials,origin,clientDir,clock:()=>now});
  const login=await handle(new Request(root+'login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username,password})}));
  const cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await handle(new Request(root,{headers:{Cookie:cookie}}))).status,200);
  now=8*60*60*1000+1;
  assert.equal((await handle(new Request(root,{headers:{Cookie:cookie}}))).status,303);
});
