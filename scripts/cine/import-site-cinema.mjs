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
sharp.cache(false);sharp.concurrency(1);
for(const ext of ['jpg','avif']){
 const output=path.join(folder,`cine-construction-project-v2.poster-sq.${ext}`);
 if(!fs.existsSync(output)){const crop=sharp(path.join(folder,'cine-construction-project-v2.poster.jpg')).extract({left:730,top:0,width:1080,height:1080});if(ext==='jpg')await crop.jpeg({quality:94}).toFile(output);else await crop.avif({quality:74,effort:2}).toFile(output);}
}
const pairs=[['cine-construction-project-v2.mp4','cine-fachada-proyecto-v2.mp4'],['cine-construction-project-v2-sq.mp4','cine-fachada-proyecto-v2-sq.mp4'],['cine-construction-project-v2.poster.jpg','cine-fachada-proyecto-v2-poster.jpg'],['cine-construction-project-v2.poster.avif','cine-fachada-proyecto-v2-poster.avif'],['cine-construction-project-v2.poster-sq.jpg','cine-fachada-proyecto-v2-poster-sq.jpg'],['cine-construction-project-v2.poster-sq.avif','cine-fachada-proyecto-v2-poster-sq.avif']];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const total=pairs.reduce((sum,[name])=>sum+fs.statSync(path.join(folder,name)).size,0);assert.ok(total<40_000_000);
for(const name of pairs.slice(2).map(p=>p[0])){const m=await sharp(path.join(folder,name)).metadata();assert.equal(m.width,name.includes('-sq.')?1080:1920);assert.equal(m.height,1080);}
const previous=JSON.parse(fs.readFileSync(path.join(root,'src/data/cine/site-movies-v1.json'),'utf8'));
const inventory=[];
for(const [source,target] of pairs){
 const input=path.join(folder,source),output=path.join(root,'public/cine/media',target),digest=sha(input);
 if(fs.existsSync(output)){
  if(target.includes('-poster.')&&previous.constructoras.status==='poster'){
   assert.equal(previous.constructoras.assets.find(a=>a.file===target)?.sha256,sha(output),'Poster changed since verified preview');
   const existing=await sharp(output).metadata();assert.equal(existing.width,target.includes('-sq.')?1080:1920);assert.equal(existing.height,1080);
   const a=await sharp(output).resize(96,54).removeAlpha().raw().toBuffer(),b=await sharp(input).resize(96,54).removeAlpha().raw().toBuffer();
   assert.equal(a.length,b.length);assert.ok(a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length<2,'Poster differs from the completed movie');
  }else assert.equal(sha(output),digest,`Existing cinema asset differs: ${target}; use a new version`);
 }
 else fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);
 inventory.push({file:target,bytes:fs.statSync(output).size,sha256:sha(output)});
}
const report={version:1,constructoras:{scene:'fachada-proyecto-v2',status:'ready',engine:'Blender 4.5.3 / Cycles',camera:'continuous quintic dolly; building, riser, technical room',duration:18,fps:24,frames:432,resolution:[1920,1080],run:`https://github.com/martinsantos/um25/actions/runs/${run}`,assets:inventory}};
fs.writeFileSync(path.join(root,'src/data/cine/site-movies-v1.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({imported:true,totalBytes:total,report},null,2));
