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
 sources={'authoring_sha256':sha(ROOT/'scripts/cine/render-software-system-v19.py'),'ui_sha256':sha(ROOT/'scripts/cine/render-software-system-v11.py'),'geometry_sha256':sha(ROOT/'scripts/cine/render-software-system-v8.py')}
 for comp,w,h,suffix in [('wide',3840,2160,''),('mobile',2160,2160,'-sq')]:
  infos=[];movies=[];handover_sha=sha(ROOT/'scripts/cine/render-software-system-v19-handover.py')
  repair_starts=(120,180,240,900,960,1020,1080)
  legend_sha=sha(ROOT/'scripts/cine/render-software-system-v19-legend.py')
  segments=[(start+offset,30 if start in repair_starts else 60) for start in range(0,1200,60) for offset in ((0,30) if start in repair_starts else (0,))]
  for start,count in segments:
   folder=source/f'v19-spatial-{comp}-{start}';info=json.loads((folder/'info.json').read_text())
   assert [info['version'],info['publishable'],info['composition'],info['resolution'],info['frames'],info['fps'],info['samples']]==['v19',False,comp,[w,h],1200,60,8]
   assert [r['frame'] for r in info['timings']]==list(range(start,start+count))
   for key,value in sources.items():assert info[key]==value,('Mixed or stale source',key)
   if start//60*60 in repair_starts:assert [info.get('handover_sha256'),info.get('handover_ranges')]==[handover_sha,[[120,299],[1020,1139]]], 'Missing handover repair'
   else:assert 'handover_sha256' not in info, 'Unexpected repair scope'
   if 900<=start<1080:assert [info.get('legend_sha256'),info.get('legend_scope')]==[legend_sha,[900,1079]], 'Missing legend correction'
   else:assert 'legend_sha256' not in info, 'Unexpected legend scope'
   for name in ['public/images/logo-dark.svg','public/cine/media/empresa-mendoza.jpg']:assert info['asset_sha256'][name]==sha(ROOT/name),('Stale visual asset',name)
   movie=folder/'movie.mp4';verify(movie,w,h,count);movies.append(movie.resolve());infos.append(info)
  listing=out/f'concat{suffix}.txt';listing.write_text(''.join(f"file '{p}'\n" for p in movies))
  movie=out/f'cine-software-system-v19{suffix}.mp4';run('ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',movie)
  run('ffmpeg','-y','-v','error','-threads','2','-i',movie,'-f','null','-')
  (out/f'validation{suffix}.json').write_text(json.dumps(verify(movie,w,h,1200)))
  (out/f'render-info{suffix}.json').write_text(json.dumps(dict(infos[0],legend_sha256=legend_sha,legend_scope=[900,1079],handover_sha256=handover_sha,handover_ranges=[[120,299],[1020,1139]],timings=[r for info in infos for r in info['timings']])))
  poster=out/f'cine-software-system-v19-poster{suffix}.jpg';run('ffmpeg','-y','-v','error','-threads','2','-i',movie,'-frames:v','1','-q:v','2',poster)
  run('node','--input-type=module','-e',"import sharp from 'sharp';sharp.cache(false);sharp.concurrency(2);await sharp(process.argv[1]).avif({quality:74,effort:3,chromaSubsampling:'4:4:4'}).toFile(process.argv[2]);",poster,poster.with_suffix('.avif'))
  for sec in [0,4.5,7.6,9.4,12.6,14.5,15.5,16.8,18.2,19.98]:run('ffmpeg','-y','-v','error','-threads','2','-ss',sec,'-i',movie,'-frames:v','1',out/f'review{suffix}-{sec}.png')
 assets=list(out.glob('cine-*'));assert sum(p.stat().st_size for p in assets)<120_000_000
 (out/'SHA256SUMS').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.name!='SHA256SUMS'))
 print(json.dumps({'frames':1200,'fps':60,'compositions':2,'publishable':False,'bytes':sum(p.stat().st_size for p in assets)}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args();assemble(args.source,args.output)
