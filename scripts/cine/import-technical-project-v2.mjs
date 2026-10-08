import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const folder=path.resolve(process.argv[2]||''),run=process.argv[3];assert(process.argv[2]);assert.match(run||'',/^\d+$/);
const read=file=>JSON.parse(fs.readFileSync(path.join(folder,file),'utf8'));
const info=read('render-info.json');
assert(['fire-project-v2','network-project-v2','security-project-v2','telecom-project-v2','power-project-v2','support-project-v2','consulting-project-v2'].includes(info.scene));assert.equal(info.service,{'fire-project-v2':'107','network-project-v2':'101','security-project-v2':'102','telecom-project-v2':'103','power-project-v2':'108','support-project-v2':'105','consulting-project-v2':'106'}[info.scene]);assert.equal(info.fps,60);assert.equal(info.frames,1440);
assert.equal(info.engine,'BLENDER_WORKBENCH');assert.equal(info.baked_lighting.source,'Cycles diffuse direct and indirect light');assert.deepEqual(info.resolution,[3840,2160]);
assert.deepEqual(info.timings.map(t=>t.frame),Array.from({length:1440},(_,i)=>i));
assert.deepEqual([...new Set(info.bounds.map(t=>t.frame))],[0,1439]);
for(const {bounds:b} of info.bounds)assert(b.length===4&&b.every(Number.isFinite)&&Math.min(...b.slice(0,2))>.015&&Math.max(...b.slice(2))<.985);
for(const [file,w,h] of [['validation.json',3840,2160],['validation-square.json',1920,1920]]){
 const v=read(file).streams.find(s=>s.codec_type==='video');
 assert.deepEqual([v.codec_name,v.width,v.height,v.pix_fmt,v.nb_read_frames,v.avg_frame_rate],['h264',w,h,'yuv420p','1440','60/1']);assert(Math.abs(Number(v.duration)-24)<.01);
 assert.deepEqual([v.color_space,v.color_primaries,v.color_transfer,v.color_range],['bt709','bt709','iec61966-2-1','tv']);
}
const summary=read('frame-summary.json');assert.equal(summary.frames,1440);assert(summary.unique>1296&&summary.max_identical_run<=30);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),checksums=new Map();
for(const line of fs.readFileSync(path.join(folder,'SHA256SUMS'),'utf8').trim().split('\n')){
 const [digest,...name]=line.trim().split(/\s+/),file=path.basename(name.join(' '));assert.equal(sha(path.join(folder,file)),digest);checksums.set(file,digest);
}
const pending=['.mp4','-sq.mp4','-poster.jpg','-poster.avif','-poster-sq.jpg','-poster-sq.avif'].map(suffix=>{
 const file='cine-'+info.scene+suffix,input=path.join(folder,file),output=path.join(root,'public/cine/media',file);assert(checksums.has(file));
 if(fs.existsSync(output))assert.equal(sha(output),checksums.get(file),'Existing public assets are immutable');
 return {file,input,output,bytes:fs.statSync(input).size,sha256:checksums.get(file)};
});assert(pending.reduce((sum,a)=>sum+a.bytes,0)<100_000_000);
// Verify the entire delivery before writing any public file or registry entry.
for(const {input,output} of pending){if(!fs.existsSync(output))fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);fs.chmodSync(output,0o644);}
const registryPath=path.join(root,'src/data/cine/site-movies-v1.json'),registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
registry.services[info.service]={scene:info.scene,status:'ready',engine:`Blender ${info.blender} / Cycles baked diffuse`,samples:128,duration:24,fps:60,frames:1440,resolution:[3840,2160],camera:info.camera,run:`https://github.com/martinsantos/um25/actions/runs/${run}`,assets:pending.map(({file,bytes,sha256})=>({file,bytes,sha256}))};
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');console.log(JSON.stringify({imported:info.scene,bytes:pending.reduce((sum,a)=>sum+a.bytes,0)}));
