// Derive color-managed stills from the delivered movie without changing it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const registryFile=path.join(root,'src/data/cine/site-movies-v1.json');
const registry=JSON.parse(fs.readFileSync(registryFile,'utf8')),movie=registry.services['104'];
if(!['software-system-v7','software-system-v8'].includes(movie.scene))throw Error('Review a new poster revision before using another film');
const revision='srgb-v1',folder=path.join(root,'public/cine/media'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'um-software-poster-'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const assets=[],sources=[];
for(const square of [false,true]){
 const suffix=square?'-sq':'',file=`cine-${movie.scene}${suffix}.mp4`,input=path.join(folder,file),rgb=path.join(temp,`frame${suffix}.png`);
 const registered=movie.assets.find(asset=>asset.file===file);
 if(!registered||hash(input)!==registered.sha256)throw Error('Source movie differs from its verified delivery');
 sources.push({file,sha256:registered.sha256});
 execFileSync(process.env.FFMPEG||'ffmpeg',['-v','error','-i',input,'-frames:v','1','-vf','scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24',rgb]);
 for(const format of ['jpg','avif']){
  const name=`cine-${movie.scene}-poster${suffix}-${revision}.${format}`,candidate=path.join(temp,name),output=path.join(folder,name);
  const image=sharp(rgb).withIccProfile('srgb');
  if(format==='jpg')await image.jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(candidate);
  else await image.avif({quality:65,effort:6,chromaSubsampling:'4:4:4'}).toFile(candidate);
  const sha256=hash(candidate);
  if(fs.existsSync(output)&&hash(output)!==sha256)throw Error('Existing public assets are immutable');
  if(!fs.existsSync(output))fs.copyFileSync(candidate,output,fs.constants.COPYFILE_EXCL);
  fs.chmodSync(output,0o644);assets.push({file:name,bytes:fs.statSync(output).size,sha256});
 }
}
movie.assets=[...movie.assets.filter(asset=>asset.file.endsWith('.mp4')),...assets];
movie.posterRevision=revision;
movie.posterPreparation={script:'scripts/cine/prepare-software-posters.mjs',sourceMovies:sources,color:'BT.709 limited-range video decoded to sRGB; stills contain an sRGB ICC profile'};
fs.writeFileSync(registryFile,JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({posterRevision:revision,assets,evidence:temp}));
