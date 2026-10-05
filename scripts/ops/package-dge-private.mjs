import { cp, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(process.argv[2] || resolve(dirname(fileURLToPath(import.meta.url)),'../..'));
const source=resolve(root,'work/dge-demo/reviewed-client'), server=resolve(root,'dist/server');
async function walk(dir) {
  const files=[];
  for(const item of await readdir(dir,{withFileTypes:true})) {
    if(item.isSymbolicLink()) throw new Error('Unexpected symlink in DGE build');
    const path=resolve(dir,item.name);
    if(item.isDirectory()) files.push(...await walk(path)); else if(item.isFile()) files.push(path);
  }
  return files;
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const privateFiles=await walk(source);
const fingerprints=new Map();
for(const path of privateFiles) if(/\.(html|js|json)$/.test(path)) fingerprints.set(basename(path),hash(await readFile(path)));
const publicFiles=await walk(resolve(root,'dist/client'));
for(const path of publicFiles) {
  if(path.includes('/ofertas/dge/')) throw new Error('DGE payload may not be emitted to dist/client');
  const fingerprint=fingerprints.get(basename(path));
  if(fingerprint && hash(await readFile(path))===fingerprint) throw new Error('Private DGE payload leaked into dist/client');
}
if(!(await stat(resolve(server,'entry.mjs'))).isFile()) throw new Error('Astro SSR build missing');
await mkdir(resolve(server,'dge-private/auth'),{recursive:true});
await cp(source,resolve(server,'dge-private/client'),{recursive:true,force:false,errorOnExist:true});
for(const name of ['login.html','login.css']) await cp(resolve(root,'work/dge-demo/server',name),resolve(server,'dge-private/auth',name),{force:false,errorOnExist:true});
console.log('DGE packaged in dist/server/dge-private; no demo payload in dist/client');
