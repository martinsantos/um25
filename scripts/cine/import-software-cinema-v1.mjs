import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const folder=path.resolve(process.argv[2]||''),run=process.argv[3];
assert.ok(process.argv[2]);assert.match(run||'',/^\d+$/);
const info=JSON.parse(fs.readFileSync(path.join(folder,'render-info.json'),'utf8'));
assert.equal(info.scene,'software-system-v1');assert.equal(info.samples,24);
const validation=JSON.parse(fs.readFileSync(path.join(folder,'validation.json'),'utf8'));
const video=validation.streams.find(s=>s.codec_type==='video');
assert.deepEqual([video.codec_name,video.width,video.height,video.pix_fmt,video.nb_read_frames,video.avg_frame_rate],['h264',1920,1080,'yuv420p','576','24/1']);
assert.ok(Math.abs(Number(video.duration)-24)<.01);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const line of fs.readFileSync(path.join(folder,'SHA256SUMS'),'utf8').trim().split('\n')){
 const [digest,...name]=line.trim().split(/\s+/);assert.equal(sha(path.join(folder,path.basename(name.join(' ')))),digest,'Delivery checksum mismatch');
}
// The square edition preserves the entire architecture; derive its poster from
// that delivered framing, not a crop of the desktop poster.
const square=path.join(folder,'cine-project-v3.poster-sq.jpg');
if(!fs.existsSync(square)){
 const result=spawnSync('ffmpeg',['-v','error','-threads','2','-i',path.join(folder,'cine-project-v3-sq.mp4'),'-frames:v','1','-q:v','2',square],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
}
sharp.cache(false);sharp.concurrency(1);
const avif=path.join(folder,'cine-project-v3.poster-sq.avif');
if(!fs.existsSync(avif))await sharp(square).avif({quality:74,effort:2}).toFile(avif);
const names=['.mp4','-sq.mp4','.poster.jpg','.poster.avif','.poster-sq.jpg','.poster-sq.avif'];
const suffixes=['.mp4','-sq.mp4','-poster.jpg','-poster.avif','-poster-sq.jpg','-poster-sq.avif'];
const assets=[];
for(const [i,suffix] of names.entries()){
 const input=path.join(folder,'cine-project-v3'+suffix),file='cine-software-system-v1'+suffixes[i],output=path.join(root,'public/cine/media',file);
 if(fs.existsSync(output))assert.equal(sha(output),sha(input),'Existing asset differs; use a new version');else fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);
 assets.push({file,bytes:fs.statSync(output).size,sha256:sha(output)});
}
const total=assets.reduce((sum,a)=>sum+a.bytes,0);assert.ok(total<40_000_000);
const registryPath=path.join(root,'src/data/cine/site-movies-v1.json'),registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
registry.services||={};registry.services['104']={scene:'software-system-v1',status:'ready',engine:'Blender 4.5.3 / Cycles',samples:24,duration:24,fps:24,frames:576,resolution:[1920,1080],run:`https://github.com/martinsantos/um25/actions/runs/${run}`,assets};
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({imported:'104',totalBytes:total,scene:'software-system-v1'}));
