import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const folder=path.resolve(process.argv[2]||''),run=process.argv[3],project=process.argv[4];
// Pilot only: approve the rendered sequence before extending this direction.
const keys={winery:'bodega-proyecto-v4'};
assert.ok(process.argv[2]);assert.match(run||'',/^\d+$/);assert.ok(keys[project]);
const info=JSON.parse(fs.readFileSync(path.join(folder,'render-info.json'),'utf8'));
assert.equal(info.scene,project);assert.equal(info.samples,16);
const validation=JSON.parse(fs.readFileSync(path.join(folder,'validation.json'),'utf8'));
const video=validation.streams.find(s=>s.codec_type==='video');
assert.deepEqual([video.codec_name,video.width,video.height,video.pix_fmt,video.nb_read_frames,video.avg_frame_rate],['h264',1920,1080,'yuv420p','432','24/1']);
assert.ok(Math.abs(Number(video.duration)-18)<.01);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const line of fs.readFileSync(path.join(folder,'SHA256SUMS'),'utf8').trim().split('\n')){
 const [digest,...name]=line.trim().split(/\s+/);assert.equal(sha(path.join(folder,path.basename(name.join(' ')))),digest,'Delivery checksum mismatch');
}
sharp.cache(false);sharp.concurrency(1);
for(const ext of ['jpg','avif']){
 const output=path.join(folder,`cine-project-v3.poster-sq.${ext}`);
 if(!fs.existsSync(output)){
  const crop=sharp(path.join(folder,'cine-project-v3.poster.jpg')).extract({left:730,top:0,width:1080,height:1080});
  if(ext==='jpg')await crop.jpeg({quality:94}).toFile(output);else await crop.avif({quality:74,effort:2}).toFile(output);
 }
}
const names=['.mp4','-sq.mp4','.poster.jpg','.poster.avif','.poster-sq.jpg','.poster-sq.avif'];
const targets=['.mp4','-sq.mp4','-poster.jpg','-poster.avif','-poster-sq.jpg','-poster-sq.avif'];
const assets=[];
for(const [i,suffix] of names.entries()){
 const input=path.join(folder,'cine-project-v3'+suffix),file='cine-'+keys[project]+targets[i],output=path.join(root,'public/cine/media',file);
 if(fs.existsSync(output))assert.equal(sha(output),sha(input),'Existing asset differs; use a new version');else fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);
 assets.push({file,bytes:fs.statSync(output).size,sha256:sha(output)});
}
const total=assets.reduce((sum,a)=>sum+a.bytes,0);assert.ok(total<40_000_000);
const registryPath=path.join(root,'src/data/cine/site-movies-v1.json'),registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
registry.projects||={};registry.projects[project]={scene:keys[project],status:'ready',engine:'Blender 4.5.3 / Cycles',samples:16,duration:18,fps:24,frames:432,resolution:[1920,1080],run:`https://github.com/martinsantos/um25/actions/runs/${run}`,assets};
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({imported:project,totalBytes:total,scene:keys[project]}));
