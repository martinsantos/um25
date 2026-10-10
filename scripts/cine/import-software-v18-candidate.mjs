/** Import a verified review candidate without changing the production registry. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
assert(process.argv[2],'Candidate delivery directory is required');
const folder=path.resolve(process.argv[2]);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const info=JSON.parse(fs.readFileSync(path.join(folder,'render-info.json')));
assert.equal(info.version,'v18');
assert.equal(info.return_patch_sha256,sha(path.join(root,'scripts/cine/render-software-system-v18-return.py')));
assert.deepEqual(info.return_patch_scope,[930,1139]);
assert.equal(info.publishable,false);assert.equal(info.engine,'eevee');assert.equal(info.samples,8);
assert.deepEqual([info.frames,info.fps,info.resolution],[1200,60,[3840,2160]]);

assert.deepEqual(info.timings.map(t=>t.frame),Array.from({length:1200},(_,i)=>i));
assert.equal(info.authoring_sha256,sha(path.join(root,'scripts/cine/render-software-system-v18.py')));
assert.equal(info.ui_sha256,sha(path.join(root,'scripts/cine/render-software-system-v11.py')));
assert.equal(info.geometry_sha256,sha(path.join(root,'scripts/cine/render-software-system-v8.py')));
for(const name of ['public/images/logo-dark.svg','public/cine/media/empresa-mendoza.jpg'])assert.equal(info.asset_sha256[name],sha(path.join(root,name)));
for(const [suffix,width,height] of [['',3840,2160],['-sq',2160,2160]]){
 const v=JSON.parse(fs.readFileSync(path.join(folder,`validation${suffix}.json`))).streams.find(s=>s.codec_type==='video');
 assert.deepEqual([v.codec_name,v.width,v.height,v.nb_read_frames,v.avg_frame_rate,v.pix_fmt],['h264',width,height,'1200','60/1','yuv420p']);
 assert(Math.abs(Number(v.duration)-20)<.01);
}
const hashes=new Map();
for(const line of fs.readFileSync(path.join(folder,'SHA256SUMS'),'utf8').trim().split('\n')){
 const match=line.match(/^([a-f0-9]{64})  (.+)$/);assert(match);const [,hash,name]=match;
 assert.equal(name,path.basename(name));assert.equal(sha(path.join(folder,name)),hash);hashes.set(name,hash);
}
const assets=['.mp4','-sq.mp4','-poster.jpg','-poster.avif','-poster-sq.jpg','-poster-sq.avif'].map(suffix=>{
 const name='cine-software-system-v18'+suffix,input=path.join(folder,name),output=path.join(root,'public/cine/media',name);
 assert(hashes.has(name));if(fs.existsSync(output))assert.equal(sha(output),hashes.get(name),'Public assets are immutable');
 return {name,input,output,bytes:fs.statSync(input).size};
});
assert(assets.reduce((sum,a)=>sum+a.bytes,0)<120_000_000);
for(const {input,output} of assets)if(!fs.existsSync(output)){fs.copyFileSync(input,output,fs.constants.COPYFILE_EXCL);fs.chmodSync(output,0o644);}
console.log(JSON.stringify({imported:assets.map(a=>a.name),previewFlag:'UM_SOFTWARE_REVIEW=v18',productionRegistryChanged:false}));
