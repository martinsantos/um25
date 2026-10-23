import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const folder=path.resolve(process.argv[2]||''),run=process.argv[3];
assert.ok(process.argv[2]);assert.match(run||'',/^\d+$/);
const info=JSON.parse(fs.readFileSync(path.join(folder,'render-info.json'),'utf8'));
const names={'101':'network','102':'security','103':'telecom','105':'support','106':'consulting','107':'fire','108':'power'};
assert.ok(names[info.service]);assert.equal(info.scene,`${names[info.service]}-system-v1`);
assert.ok(['CYCLES','BLENDER_EEVEE_NEXT'].includes(info.engine));assert.ok(info.samples>=24);
assert.deepEqual(info.timings.map(t=>t.frame),Array.from({length:576},(_,i)=>i));
assert.equal(info.bounds.length,576);
for(const {bounds:b} of info.bounds)assert.ok(b[0]>.215&&b[1]>.07&&b[2]<.98&&b[3]<.93,'Equipment leaves the mobile-safe composition');
for(const [file,width,height] of [['validation.json',1920,1080],['validation-square.json',1080,1080]]){
 const v=JSON.parse(fs.readFileSync(path.join(folder,file),'utf8')).streams.find(s=>s.codec_type==='video');
 assert.deepEqual([v.codec_name,v.width,v.height,v.pix_fmt,v.nb_read_frames,v.avg_frame_rate],['h264',width,height,'yuv420p','576','24/1']);
 assert.ok(Math.abs(Number(v.duration)-24)<.01);
}
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const checksums=new Map();
for(const line of fs.readFileSync(path.join(folder,'SHA256SUMS'),'utf8').trim().split('\n')){
 const [digest,...name]=line.trim().split(/\s+/),file=path.basename(name.join(' '));
 assert.equal(sha(path.join(folder,file)),digest,'Delivery checksum mismatch');checksums.set(file,digest);
}
const suffixes=['.mp4','-sq.mp4','-poster.jpg','-poster.avif','-poster-sq.jpg','-poster-sq.avif'];
const pending=suffixes.map(suffix=>{
 const file=`cine-${info.scene}${suffix}`,input=path.join(folder,file),output=path.join(root,'public/cine/media',file);
 assert.ok(checksums.has(file));const bytes=fs.statSync(input).size;
 if(fs.existsSync(output))assert.equal(sha(output),checksums.get(file),'Immutable asset differs; use a new version');
 return {file,input,output,bytes,sha256:checksums.get(file)};
});
const total=pending.reduce((sum,a)=>sum+a.bytes,0);assert.ok(total<40_000_000);
// Validate the complete delivery before writing any registry or public file.
for(const {input,output} of pending){if(!fs.existsSync(output))fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);fs.chmodSync(output,0o644);}
const registryPath=path.join(root,'src/data/cine/site-movies-v1.json');
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));registry.services||={};
registry.services[info.service]={scene:info.scene,status:'ready',engine:`Blender ${info.blender} / ${info.engine==='CYCLES'?'Cycles':'EEVEE'}`,samples:info.samples,
 duration:24,fps:24,frames:576,resolution:[1920,1080],camera:info.camera,run:`https://github.com/martinsantos/um25/actions/runs/${run}`,
 assets:pending.map(({file,bytes,sha256})=>({file,bytes,sha256}))};
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({imported:info.service,scene:info.scene,bytes:total}));
