"""Assemble verified native 4K/60 Blender segments without re-rendering them."""
import argparse,hashlib,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--source',default='.');parser.add_argument('--output',default='delivery');args=parser.parse_args()
source=Path(args.source).resolve();out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
def call(*args):subprocess.run([str(a) for a in args],check=True)
def probe(file):return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(file)]))
infos=[];movies=[]
for i in range(1,13):
 folder=source/f'software-part-{i}';movie=folder/f'part-{i}.mp4';info=json.loads((folder/f'part-{i}-info.json').read_text());expected=list(range((i-1)*120,i*120))
 assert info['scene'] in ('software-system-v5','software-system-v6') and info['frames']==1440 and info['fps']==60 and info['resolution']==[3840,2160],info
 assert len(info['authoring_sha256'])==64 and set(info['font_sha256'])=={'Regular','SemiBold'}
 assert info['engine']=='BLENDER_WORKBENCH' and info.get('lighting')=='flat product surfaces'
 assert [t['frame'] for t in info['timings']]==expected and [b['frame'] for b in info['bounds']]==expected,(i,'Missing native frames')
 v=probe(movie)['streams'][0]
 assert (v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate'],v['pix_fmt'])==(3840,2160,'120','60/1','yuv420p'),v
 assert (v['color_space'],v['color_primaries'],v['color_transfer'],v['color_range'])==('bt709','bt709','iec61966-2-1','tv')
 assert abs(float(v['duration'])-2)<.01
 infos.append(info);movies.append(movie)
assert len({i['scene'] for i in infos})==1,'Do not mix authored movie versions'
assert len({i['authoring_sha256'] for i in infos})==1,'Do not mix authored revisions'
assert len({json.dumps(i['font_sha256'],sort_keys=True) for i in infos})==1,'Do not mix font revisions'
info=dict(infos[0],timings=[t for p in infos for t in p['timings']],bounds=[b for p in infos for b in p['bounds']])
assert [t['frame'] for t in info['timings']]==list(range(1440))
if info['scene']=='software-system-v6':
 assert all(not p.get('handler_errors') for p in infos)
 info['focus_bounds']=[b for p in infos for b in p['focus_bounds']]
 assert set(b['group'] for b in info['focus_bounds'])=={'detail','logic','data','runtime'}
 for b in info['focus_bounds']:assert min(b['bounds'][:2])>.03 and max(b['bounds'][2:])<.97
(out/'render-info.json').write_text(json.dumps(info))
stem='cine-'+info['scene']
listing=out/'concat.txt';listing.write_text(''.join(f"file '{p}'\n" for p in movies))
wide=out/(stem+'.mp4');square=out/(stem+'-sq.mp4')
call('ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',wide)
# The mobile delivery preserves the complete frame. CSS removes the encoded
# padding; it never crops away the application's navigation or action panel.
call('ffmpeg','-y','-v','error','-i',wide,'-vf','scale=1920:1080:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,pad=1920:1920:0:420:color=0x090A0C','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-an','-movflags','+faststart',square)
for movie,label,size in [(wide,'',(3840,2160)),(square,'-square',(1920,1920))]:
 call('ffmpeg','-v','error','-i',movie,'-f','null','-')
 val=probe(movie);v=val['streams'][0]
 assert (v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate'],v['pix_fmt'])==(*size,'1440','60/1','yuv420p'),v
 assert (v['color_space'],v['color_primaries'],v['color_transfer'],v['color_range'])==('bt709','bt709','iec61966-2-1','tv')
 assert abs(float(v['duration'])-24)<.01
 (out/f'validation{label}.json').write_text(json.dumps(val))
 poster='cine-'+info['scene']+'-poster'+('-sq' if label else '')
 call('ffmpeg','-y','-v','error','-i',movie,'-frames:v','1','-q:v','2',out/(poster+'.jpg'))
 call('ffmpeg','-y','-v','error','-i',out/(poster+'.jpg'),'-c:v','libaom-av1','-still-picture','1','-crf','24',out/(poster+'.avif'))
call('ffmpeg','-y','-v','error','-i',wide,'-f','framemd5',out/'frame-integrity.txt')
frames=[line.split(',')[-1].strip() for line in (out/'frame-integrity.txt').read_text().splitlines() if line and not line.startswith('#')]
assert len(frames)==1440 and len(set(frames))>1296,('Unexpected frozen footage',len(set(frames)))
longest=run=1
for a,b in zip(frames,frames[1:]):
 run=run+1 if a==b else 1;longest=max(longest,run)
assert longest<=30,('Unplanned freeze longer than half a second',longest)
(out/'frame-summary.json').write_text(json.dumps({'frames':len(frames),'unique':len(set(frames)),'max_identical_run':longest}))
listing.unlink()
assets=sorted(p for p in out.iterdir() if p.name.startswith('cine-'))
assert sum(p.stat().st_size for p in assets)<100_000_000
(out/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.name!='SHA256SUMS'))
print(json.dumps({'assembled':1440,'fps':60,'resolution':[3840,2160],'assets_bytes':sum(p.stat().st_size for p in assets)}))
