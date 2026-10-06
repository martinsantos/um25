import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const folder=path.resolve(process.argv[2]||'');
assert.ok(process.argv[2],'Pass the completed GitHub Actions delivery directory');
const run=process.argv[3];assert.match(run||'',/^\d+$/);
const validation=JSON.parse(fs.readFileSync(path.join(folder,'validation.json'),'utf8'));
const video=validation.streams.find(s=>s.codec_type==='video');
assert.deepEqual([video.codec_name,video.width,video.height,video.pix_fmt,video.nb_read_frames,video.avg_frame_rate],['h264',1920,1080,'yuv420p','432','24/1']);
assert.ok(Math.abs(Number(video.duration)-18)<.01);
const pairs=[['cine-construction-project-v1.mp4','cine-fachada-proyecto-v1.mp4'],['cine-construction-project-v1-sq.mp4','cine-fachada-proyecto-v1-sq.mp4'],['cine-construction-project-v1.poster.jpg','cine-fachada-proyecto-v1-poster.jpg'],['cine-construction-project-v1.poster.avif','cine-fachada-proyecto-v1-poster.avif']];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const total=pairs.reduce((sum,[name])=>sum+fs.statSync(path.join(folder,name)).size,0);assert.ok(total<40_000_000);
for(const name of pairs.slice(2).map(p=>p[0])){const m=await sharp(path.join(folder,name)).metadata();assert.equal(m.width,1920);assert.equal(m.height,1080);}
const inventory=[];
for(const [source,target] of pairs){
 const input=path.join(folder,source),output=path.join(root,'public/cine/media',target),digest=sha(input);
 if(fs.existsSync(output))assert.equal(sha(output),digest,`Existing cinema asset differs: ${target}; use a new version`);
 else fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);
 inventory.push({file:target,bytes:fs.statSync(input).size,sha256:digest});
}
const report={version:1,constructoras:{scene:'fachada-proyecto-v1',engine:'Blender 4.5.3 / Cycles',camera:'continuous quintic dolly; building, riser, technical room',duration:18,fps:24,frames:432,resolution:[1920,1080],run:`https://github.com/martinsantos/um25/actions/runs/${run}`,assets:inventory}};
fs.writeFileSync(path.join(root,'src/data/cine/site-movies-v1.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({imported:true,totalBytes:total,report},null,2));
