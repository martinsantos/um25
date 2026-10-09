"""Verify every native frame before assembling a review candidate, never a release."""
import argparse, hashlib, json, subprocess
from pathlib import Path

def run(*args):
 subprocess.run([str(a) for a in args], check=True)

def probe(path):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-of','json',str(path)]))

def video(path, dimensions, frames):
 data=probe(path);v=next(s for s in data['streams'] if s['codec_type']=='video')
 assert (v['codec_name'],v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate'],v['pix_fmt'])==('h264',*dimensions,str(frames),'60/1','yuv420p'),v
 assert (v['color_space'],v['color_primaries'],v['color_transfer'],v['color_range'])==('bt709','bt709','iec61966-2-1','tv')
 assert abs(float(v['duration'])-frames/60)<.01
 return data

def assemble(source,out):
 out.mkdir(parents=True,exist_ok=True);infos=[];movies=[]
 for i in range(1,13):
  folder=source/f'software-part-{i}';movie=folder/f'part-{i}.mp4'
  info=json.loads((folder/f'part-{i}-info.json').read_text())
  assert info['scene']=='software-system-v9-art-direction-proof'
  assert (info['frames'],info['fps'],info['resolution'],info['engine'])==(720,60,[3840,2160],'workbench')
  assert info['publishable'] is False and not info['handler_errors']
  assert [row['frame'] for row in info['timings']]==list(range((i-1)*60,i*60))
  video(movie,(3840,2160),60);infos.append(info);movies.append(movie.resolve())
 for key in ['authoring_sha256','geometry_sha256','font_sha256']:
  assert len({json.dumps(info[key],sort_keys=True) for info in infos})==1,('Mixed render source',key)
 info=dict(infos[0],timings=[row for item in infos for row in item['timings']])
 assert [row['frame'] for row in info['timings']]==list(range(720))
 (out/'render-info.json').write_text(json.dumps(info))
 listing=out/'concat.txt';listing.write_text(''.join(f"file '{p}'\n" for p in movies))
 stem='cine-software-system-v9';wide=out/(stem+'.mp4');square=out/(stem+'-sq.mp4')
 run('ffmpeg','-v','error','-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',wide)
 # Preserve the original composition on phones. The banner displays the middle
 # 16:9 strip of this square transport; no interface is stretched or cropped.
 run('ffmpeg','-v','error','-i',wide,'-vf','scale=1920:1080:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,pad=1920:1920:0:420:color=0x181D22','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-an','-movflags','+faststart',square)
 for movie,suffix,dimensions in [(wide,'',(3840,2160)),(square,'-sq',(1920,1920))]:
  run('ffmpeg','-v','error','-i',movie,'-f','null','-')
  (out/f'validation{suffix}.json').write_text(json.dumps(video(movie,dimensions,720)))
  poster=out/(stem+'-poster'+suffix+'.jpg')
  run('ffmpeg','-v','error','-i',movie,'-frames:v','1','-q:v','2',poster)
  run('ffmpeg','-v','error','-i',poster,'-c:v','libaom-av1','-cpu-used','6','-still-picture','1','-crf','24',poster.with_suffix('.avif'))
 for second in [0,4,6,8,10,11.9]:
  run('ffmpeg','-v','error','-ss',second,'-i',wide,'-frames:v','1',out/f'review-{second}.png')
 assets=list(out.glob('cine-*'));assert sum(p.stat().st_size for p in assets)<100_000_000
 (out/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.name!='SHA256SUMS'))
 print(json.dumps({'candidate':stem,'frames':720,'seconds':12,'assets_bytes':sum(p.stat().st_size for p in assets),'publishable':False}))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();assemble(args.source,args.output)
