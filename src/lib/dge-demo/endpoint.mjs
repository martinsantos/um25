import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDemoResponseHandler } from '../../../work/dge-demo/server/astro-adapter.mjs';

let pending;
let unavailableUntil=0;
const unavailable=()=>new Response('Acceso de demostración temporalmente no disponible.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'}});
async function privateRoot() {
  let dir=dirname(fileURLToPath(import.meta.url));
  for(let i=0;i<8;i++) {
    const candidate=resolve(dir,'dge-private');
    try {
      if((await stat(resolve(candidate,'client/index.html'))).isFile() && (await stat(resolve(candidate,'auth/login.html'))).isFile()) return candidate;
    } catch { /* Continue only within the built server's parent hierarchy. */ }
    const parent=dirname(dir); if(parent===dir) break; dir=parent;
  }
  throw new Error('Private DGE package missing');
}
async function load() {
  const root=await privateRoot();
  const credentialFile=process.env.DGE_CREDENTIALS_FILE || '/root/fumbling-field/private-config/dge-demo.credentials.json';
  const credentials=JSON.parse(await readFile(credentialFile,'utf8'));
  const origin=process.env.DGE_PUBLIC_ORIGIN || 'https://www.ultimamilla.com.ar';
  const local=process.env.DGE_LOCAL_TEST==='1' && process.env.NODE_ENV!=='production' && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
  return createDemoResponseHandler({credentials,origin,clientDir:resolve(root,'client'),loginDir:resolve(root,'auth'),secure:!local});
}
export async function dgeDemoResponse(request,clientAddress) {
  if(Date.now()<unavailableUntil) return unavailable();
  try {
    pending ||= load();
    return await (await pending)(request,{clientAddress});
  } catch {
    pending=undefined;
    unavailableUntil=Date.now()+5000;
    return unavailable();
  }
}
