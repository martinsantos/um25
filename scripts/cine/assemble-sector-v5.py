"""Assemble verified remote parts; never render Blender on the local machine."""
import argparse, hashlib, json, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SCENES={'building':'fachada','clinic':'hospital','terminal':'aeropuerto','plant':'planta','winery':'bodega','mine':'mineria'}
def run(*args):subprocess.run(args,check=True)
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-of','json',str(path)],text=True))['streams'][0]
def main():
 p=argparse.ArgumentParser();p.add_argument('parts',type=Path);p.add_argument('--output',type=Path,required=True);p.add_argument('--run',required=True);p.add_argument('--import-assets',action='store_true');p.add_argument('--scenes',nargs='+',choices=list(SCENES),default=list(SCENES));a=p.parse_args()
 a.output.mkdir(parents=True,exist_ok=True);manifest=a.output/'sector-movies-v5.json';registry=json.loads(manifest.read_text()) if manifest.exists() else {};hashes={r['source_sha256'] for r in registry.values()}
 for scene in a.scenes:
  stem=SCENES[scene]
  name=stem+'-proyecto-v5';record=dict(scene=name,status='ready',duration=18,fps=60,frames=1080,resolution=[3840,2160],mobileResolution=[2160,2160],engine='Blender 4.5.3 / Cycles CPU',run=a.run,assets=[],parts=[])
  for composition,suffix,size in [('wide','',[3840,2160]),('mobile','-sq',[2160,2160])]:
   paths=[]
   for start in range(0,1080,120):
    folder=a.parts/f'sector-v5-{scene}-{composition}-{start}';info=json.loads((folder/'info.json').read_text());movie=folder/'movie.mp4'
    assert (info['scene'],info['composition'],info['start'],info['end'],info['fps'],info['resolution'])==(scene,composition,start,start+119,60,size),folder
    assert [t['frame'] for t in info['timings']]==list(range(start,start+120)),folder
    hashes.add(info['source_sha256']);assert len(hashes)==1,'Mixed renderer revisions'
    assert info['engine']=='CYCLES' and info['samples']==8 and info['shading']=='directional-normal-light', 'Unexpected rendering configuration'
    record['source_sha256']=info['source_sha256'];record['geometry_sha256']=info['geometry_sha256'];record['samples']=info['samples'];record['shading']=info['shading']
    v=probe(movie);assert [v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate']]==[*size,'120','60/1'],v
    paths.append(movie.resolve());record['parts'].append(dict(composition=composition,start=start,sha256=digest(movie),source_sha256=info['source_sha256']))
   listing=a.output/f'{scene}-{composition}.concat';listing.write_text(''.join("file '"+str(path).replace("'","'\\''")+"'\n" for path in paths))
   movie=a.output/f'cine-{name}{suffix}.mp4'
   run('ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(movie))
   run('ffmpeg','-v','error','-xerror','-i',str(movie),'-f','null','-')
   v=probe(movie);assert [v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate']]==[*size,'1080','60/1'],v
   assert abs(float(v['duration'])-18)<.002
   poster=a.output/f'cine-{name}-poster{suffix}.jpg';avif=poster.with_suffix('.avif')
   run('ffmpeg','-v','error','-y','-i',str(movie),'-frames:v','1','-q:v','2',str(poster))
   run('node','--max-old-space-size=256','-e',"const sharp=require('sharp');sharp.cache(false);sharp.concurrency(1);sharp(process.argv[1]).avif({quality:85,effort:5}).toFile(process.argv[2]).catch(e=>{console.error(e);process.exit(1)})",str(poster),str(avif))
   for asset in [movie,poster,avif]:record['assets'].append(dict(file=asset.name,bytes=asset.stat().st_size,sha256=digest(asset)))
   listing.unlink()
  registry[scene]=record
 (a.output/'sector-movies-v5.json').write_text(json.dumps(registry,indent=2)+'\n')
 if a.import_assets:
  for record in registry.values():
   for asset in record['assets']:
    target=ROOT/'public/cine/media'/asset['file'];assert not target.exists() or digest(target)==asset['sha256'],'Immutable asset conflict: '+str(target)
    if not target.exists():shutil.copy2(a.output/asset['file'],target)
  shutil.copy2(a.output/'sector-movies-v5.json',ROOT/'src/data/cine/sector-movies-v5.json')
 print(json.dumps({'scenes':len(registry),'movies':len(registry)*2,'frames':len(registry)*2160,'bytes':sum(x['bytes'] for r in registry.values() for x in r['assets']),'source':list(hashes)}))
if __name__=='__main__':main()
