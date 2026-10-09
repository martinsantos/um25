"""Verify complete native spatial compositions before making review assets."""
import argparse,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(*args):subprocess.run([str(a) for a in args],check=True)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def verify(path,w,h,count):
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-threads','2','-count_frames','-show_streams','-of','json',str(path)]));v=next(s for s in data['streams'] if s['codec_type']=='video')
 assert [v['codec_name'],v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate'],v['pix_fmt']]==['h264',w,h,str(count),'60/1','yuv420p']
 assert abs(float(v['duration'])-count/60)<.01
 assert [v['color_space'],v['color_primaries'],v['color_transfer'],v['color_range']]==['bt709','bt709','iec61966-2-1','tv']
 return data

def assemble(source,out):
 out.mkdir(parents=True,exist_ok=True)
 sources={'authoring_sha256':sha(ROOT/'scripts/cine/render-software-system-v12.py'),'ui_sha256':sha(ROOT/'scripts/cine/render-software-system-v11.py'),'geometry_sha256':sha(ROOT/'scripts/cine/render-software-system-v8.py')}
 for comp,w,h,suffix in [('wide',3840,2160,''),('mobile',2160,2160,'-sq')]:
  infos=[];movies=[]
  for start in range(0,960,30):
   folder=source/f'v12-spatial-{comp}-{start}';info=json.loads((folder/'info.json').read_text())
   assert [info['version'],info['publishable'],info['composition'],info['resolution'],info['frames'],info['fps'],info['samples']]==['v12',False,comp,[w,h],960,60,8]
   assert [r['frame'] for r in info['timings']]==list(range(start,start+30))
   for key,value in sources.items():assert info[key]==value,('Mixed or stale source',key)
   movie=folder/'movie.mp4';verify(movie,w,h,30);movies.append(movie.resolve());infos.append(info)
  listing=out/f'concat{suffix}.txt';listing.write_text(''.join(f"file '{p}'\n" for p in movies))
  movie=out/f'cine-software-system-v12{suffix}.mp4';run('ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',movie)
  run('ffmpeg','-y','-v','error','-threads','2','-i',movie,'-f','null','-')
  (out/f'validation{suffix}.json').write_text(json.dumps(verify(movie,w,h,960)))
  (out/f'render-info{suffix}.json').write_text(json.dumps(dict(infos[0],timings=[r for info in infos for r in info['timings']])))
  poster=out/f'cine-software-system-v12-poster{suffix}.jpg';run('ffmpeg','-y','-v','error','-threads','2','-i',movie,'-frames:v','1','-q:v','2',poster)
  run('node','--input-type=module','-e',"import sharp from 'sharp';sharp.cache(false);sharp.concurrency(2);await sharp(process.argv[1]).avif({quality:74,effort:3,chromaSubsampling:'4:4:4'}).toFile(process.argv[2]);",poster,poster.with_suffix('.avif'))
  for sec in [0,3.5,7.15,10.4,13.5,15.98]:run('ffmpeg','-y','-v','error','-threads','2','-ss',sec,'-i',movie,'-frames:v','1',out/f'review{suffix}-{sec}.png')
 assets=list(out.glob('cine-*'));assert sum(p.stat().st_size for p in assets)<120_000_000
 (out/'SHA256SUMS').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.name!='SHA256SUMS'))
 print(json.dumps({'frames':960,'fps':60,'compositions':2,'publishable':False,'bytes':sum(p.stat().st_size for p in assets)}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args();assemble(args.source,args.output)
