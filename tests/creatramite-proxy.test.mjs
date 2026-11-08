import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoGateway } from '../src/lib/creatramite-proxy.mjs';

const BASE = 'https://www.ultimamilla.com.ar/demo/creatramite';
const oldFetch = globalThis.fetch;
const restore = () => { globalThis.fetch = oldFetch; };

test('mounts only the demo, forwards session and protects origin headers', async () => {
  let received;
  globalThis.fetch = async (url, opts) => {
    received = { url: url.toString(), opts };
    return new Response('ok', { status: 200, headers: { 'Content-Type': 'text/html',
      'Set-Cookie': 'creatramite_demo=abc; Secure; HttpOnly; Path=/demo/creatramite',
      'Content-Security-Policy': "frame-ancestors 'self'" } });
  };
  try {
    const handle = createDemoGateway();
    const response = await handle(new Request(BASE+'/formularios?x=1', { headers: {
      Cookie: 'creatramite_demo=abc', 'X-Forwarded-Proto':'http', 'X-Real-IP':'192.0.2.1' } }));
    assert.equal(response.status, 200);
    assert.equal(received.url, 'http://127.0.0.1:18891/demo/creatramite/formularios?x=1');
    assert.equal(received.opts.headers.get('Host'), 'www.ultimamilla.com.ar');
    assert.equal(received.opts.headers.get('X-Forwarded-Proto'), 'https');
    assert.equal(received.opts.headers.get('X-Forwarded-Host'), 'www.ultimamilla.com.ar');
    assert.equal(received.opts.headers.get('Cookie'), 'creatramite_demo=abc');
    assert.match(response.headers.get('set-cookie'), /Secure; HttpOnly; Path=\/demo\/creatramite/);
    assert.equal(response.headers.get('content-security-policy'), "frame-ancestors 'self'");
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('referrer-policy'), 'same-origin');
    assert.equal(await response.text(), 'ok');
  } finally { restore(); }
});

test('redirects the bare route and denies internal callback, methods and unsafe target', async () => {
  const handle = createDemoGateway();
  const bare = await handle(new Request(BASE+'?a=1'));
  assert.equal(bare.status, 308);
  assert.equal(bare.headers.get('location'), '/demo/creatramite/?a=1');
  assert.equal((await handle(new Request(BASE+'/api/simulacion/notificaciones/pago'))).status, 404);
  assert.equal((await handle(new Request(BASE+'/api/simulacion/notificaciones/%70ago'))).status, 404);
  assert.equal((await handle(new Request(BASE+'/otra', {method:'DELETE'}))).status, 405);
  assert.equal((await handle(new Request('https://www.ultimamilla.com.ar/otra'))).status, 400);
  assert.throws(() => createDemoGateway({upstream:'http://169.254.169.254:80/'}));
  assert.throws(() => createDemoGateway({upstream:'https://127.0.0.1:18891/'}));
});

test('accepts bounded requests and rejects missing, incorrect and oversized lengths', async () => {
  globalThis.fetch = async (_url, opts) => new Response(String(opts.body.byteLength));
  try {
    const handle = createDemoGateway();
    const opts = {method:'POST',headers:{'Content-Length':'3','X-CSRF-Token':'x'},body:'abc'};
    const response = await handle(new Request(BASE+'/api/demo',opts));
    assert.equal(response.status,200);
    assert.equal(await response.text(),'3');
    assert.equal((await handle(new Request(BASE+'/login',{method:'POST',body:'x'}))).status,411);
    assert.equal((await handle(new Request(BASE+'/login',{method:'POST',body:'xx',headers:{'Content-Length':'1'}}))).status,400);
    assert.equal((await handle(new Request(BASE+'/login',{method:'POST',body:'x',headers:{'Content-Length':'5242881'}}))).status,413);
  } finally { restore(); }
});

test('limits login attempts per IP and resets after one minute', async () => {
  globalThis.fetch = async () => new Response('bad',{status:401});
  try {
    let time = 1000;
    const handle = createDemoGateway({now:()=>time});
    const request = ip => new Request(BASE+'/login',{method:'POST',body:'x',
      headers:{'Content-Length':'1','X-Real-IP':ip}});
    for(let i=0;i<12;i++) assert.equal((await handle(request('192.0.2.1'))).status,401);
    assert.equal((await handle(request('192.0.2.1'))).status,429);
    assert.equal((await handle(request('192.0.2.2'))).status,401);
    time += 60000;
    assert.equal((await handle(request('192.0.2.1'))).status,401);
  } finally { restore(); }
});

test('limits concurrent uploads and permits another request after completion', async () => {
  let done;
  globalThis.fetch = () => new Promise(resolve => { done = resolve; });
  try {
    const handle = createDemoGateway();
    const request = ip => new Request(BASE+'/data',{method:'POST',body:'x',
      headers:{'Content-Length':'1','X-Real-IP':ip}});
    let resolveOne, resolveTwo;
    globalThis.fetch = () => new Promise(resolve => { if (!resolveOne) resolveOne=resolve; else resolveTwo=resolve; });
    const a=handle(request('192.0.2.1')), b=handle(request('192.0.2.2'));
    await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal((await handle(request('192.0.2.3'))).status,503);
    resolveOne(new Response('a')); resolveTwo(new Response('b'));
    assert.equal((await a).status,200); assert.equal((await b).status,200);
    globalThis.fetch = async () => new Response('ok');
    assert.equal((await handle(request('192.0.2.3'))).status,200);
  } finally { void done; restore(); }
});

test('does not forward unexpected redirects or an oversized response', async () => {
  const handle = createDemoGateway();
  try {
    globalThis.fetch = async () => new Response(null,{status:302,headers:{Location:'https://untrusted.example/'}});
    assert.equal((await handle(new Request(BASE+'/login'))).status,502);
    globalThis.fetch = async () => new Response(new Uint8Array(5*1024*1024+1));
    assert.equal((await handle(new Request(BASE+'/login'))).status,502);
    globalThis.fetch = async () => {throw new Error('offline');};
    assert.equal((await handle(new Request(BASE+'/login'))).status,503);
  } finally { restore(); }
});
