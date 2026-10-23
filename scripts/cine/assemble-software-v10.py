"""Assemble two native authored compositions; reject missing or mixed frames."""
import argparse,hashlib,json,subprocess
from pathlib import Path

def run(*args):subprocess.run([str(a) for a in args],check=True)
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-of','json',str(path)]))
def verify(path,width,height,frames):
 data=probe(path);v=next(s for s in data['streams'] if s['codec_type']=='video')
 assert (v['codec_name'],v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate'])==('h264',width,height,str(frames),'60/1')
 assert abs(float(v['duration'])-frames/60)<.01
 assert (v['color_space'],v['color_primaries'],v['color_transfer'],v['color_range'])==('bt709','bt709','iec61966-2-1','tv')
 return data

def assemble(source,out):
 out.mkdir(parents=True,exist_ok=True);all_infos=[]
 for composition,suffix,w,h in [('wide','',3840,2160),('mobile','-sq',2160,2160)]:
  infos=[];movies=[]
  for part in range(1,25):
   folder=source/f'v10-{composition}-{part}';info=json.loads((folder/'info.json').read_text());movie=folder/'movie.mp4'
   assert (info['scene'],info['frames'],info['fps'],info['resolution'],info['composition'])==('software-system-v10-art-direction-proof',720,60,[w,h],composition)
   assert info['publishable'] is False and not info['handler_errors']
   assert [x['frame'] for x in info['timings']]==list(range((part-1)*30,part*30))
   verify(movie,w,h,30);infos.append(info);movies.append(movie.resolve())
  all_infos.extend(infos)
  info=dict(infos[0],timings=[x for item in infos for x in item['timings']])
  (out/f'render-info{suffix}.json').write_text(json.dumps(info))
  listing=out/f'concat{suffix}.txt';listing.write_text(''.join(f"file '{p}'\n" for p in movies))
  stem='cine-software-system-v10';movie=out/(stem+suffix+'.mp4')
  run('ffmpeg','-v','error','-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',movie)
  (out/f'validation{suffix}.json').write_text(json.dumps(verify(movie,w,h,720)))
  run('ffmpeg','-v','error','-threads','2','-i',movie,'-f','null','-')
  poster=out/(stem+'-poster'+suffix+'.jpg')
  run('ffmpeg','-v','error','-threads','2','-i',movie,'-frames:v','1','-q:v','2',poster)
  run('ffmpeg','-v','error','-i',poster,'-c:v','libaom-av1','-cpu-used','6','-still-picture','1','-crf','24',poster.with_suffix('.avif'))
  for second in [0,3,4,5.5,7,8.5,10,11.9]:run('ffmpeg','-v','error','-threads','2','-ss',second,'-i',movie,'-frames:v','1',out/f'review{suffix}-{second}.png')
 for key in ['authoring_sha256','geometry_sha256','compositor_sha256','font_sha256','engine']:
  assert len({json.dumps(i[key],sort_keys=True) for i in all_infos})==1,('Mixed source',key)
 assets=list(out.glob('cine-*'));assert sum(p.stat().st_size for p in assets)<120_000_000
 (out/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.name!='SHA256SUMS'))
 print(json.dumps({'frames_per_composition':720,'seconds':12,'assets_bytes':sum(p.stat().st_size for p in assets),'publishable':False}))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args();assemble(args.source,args.output)
