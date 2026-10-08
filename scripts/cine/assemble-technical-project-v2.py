"""Assemble a single reviewed technical installation from twelve native 4K/60 parts."""
import argparse, hashlib, json, os, subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--source',default='.');parser.add_argument('--output',default='delivery');parser.add_argument('--scene',choices=['fire-project-v2','network-project-v2'],required=True);args=parser.parse_args()
SCENE=args.scene;SERVICE={'fire-project-v2':'107','network-project-v2':'101'}[SCENE]
source=Path(args.source).resolve();out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
def call(*args):subprocess.run([str(a) for a in args],check=True)
def probe(file):return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(file)]))
def validate_video(v,width,height,frames):
    assert (v['codec_name'],v['width'],v['height'],v['nb_read_frames'],v['avg_frame_rate'],v['pix_fmt'])==('h264',width,height,str(frames),'60/1','yuv420p'),v
    assert (v['color_space'],v['color_primaries'],v['color_transfer'],v['color_range'])==('bt709','bt709','iec61966-2-1','tv'),v
    assert abs(float(v['duration'])-frames/60)<.01
infos=[];movies=[]
for i in range(1,13):
    folder=source/f'{SCENE}-part-{i}';movie=folder/f'part-{i}.mp4';info=json.loads((folder/f'part-{i}-info.json').read_text())
    assert (info['scene'],info['service'],info['frames'],info['fps'],info['resolution'])==(SCENE,SERVICE,1440,60,[3840,2160]),info
    assert info['engine']=='BLENDER_WORKBENCH' and info['baked_lighting']['source']=='Cycles diffuse direct and indirect light'
    assert len(info['authoring_sha256'])==64
    assert [t['frame'] for t in info['timings']]==list(range((i-1)*120,i*120)),(i,'Missing native frames')
    validate_video(probe(movie)['streams'][0],3840,2160,120)
    infos.append(info);movies.append(movie)
assert len({p['authoring_sha256'] for p in infos})==1,'Do not mix differently authored revisions'
info=dict(infos[0],timings=[t for p in infos for t in p['timings']],bounds=[b for p in infos for b in p['bounds']])
assert [t['frame'] for t in info['timings']]==list(range(1440))
assert {b['frame'] for b in info['bounds']}=={0,1439},'Establishing and returning shots must retain the installation'
for b in info['bounds']:
    assert min(b['bounds'][:2])>.015 and max(b['bounds'][2:])<.985,b
info['sourceRuns']=[os.environ.get('SOURCE_RUN','')]+[r for r in os.environ.get('REPAIR_RUNS','').split(',') if r]
info['colorProfile']={'matrix':'bt709','primaries':'bt709','transfer':'iec61966-2-1','range':'tv','conversion':'RGB PNG converted explicitly to BT.709 YUV'}
(out/'render-info.json').write_text(json.dumps(info))
listing=out/'concat.txt';listing.write_text(''.join(f"file '{p}'\n" for p in movies))
wide=out/f'cine-{SCENE}.mp4';square=out/f'cine-{SCENE}-sq.mp4'
call('ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',wide)
# All equipment remains in the mobile frame. The website removes only letterbox padding.
call('ffmpeg','-y','-v','error','-i',wide,'-vf','scale=1920:1080:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,pad=1920:1920:0:420:color=0x090A0C','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-an','-movflags','+faststart',square)
for movie,label,size in [(wide,'',(3840,2160)),(square,'-square',(1920,1920))]:
    call('ffmpeg','-v','error','-i',movie,'-f','null','-')
    val=probe(movie);validate_video(val['streams'][0],*size,1440)
    (out/f'validation{label}.json').write_text(json.dumps(val))
    stem=f'cine-{SCENE}-poster'+('-sq' if label else '')
    call('ffmpeg','-y','-v','error','-i',movie,'-frames:v','1','-q:v','2',out/(stem+'.jpg'))
    call('ffmpeg','-y','-v','error','-i',out/(stem+'.jpg'),'-c:v','libaom-av1','-still-picture','1','-crf','24',out/(stem+'.avif'))
call('ffmpeg','-y','-v','error','-i',wide,'-f','framemd5',out/'frame-integrity.txt')
frames=[line.split(',')[-1].strip() for line in (out/'frame-integrity.txt').read_text().splitlines() if line and not line.startswith('#')]
assert len(frames)==1440 and len(set(frames))>1296,('Unexpected frozen footage',len(set(frames)))
longest=run=1
for a,b in zip(frames,frames[1:]):
    run=run+1 if a==b else 1;longest=max(longest,run)
assert longest<=30,('Unplanned freeze longer than half a second',longest)
(out/'frame-summary.json').write_text(json.dumps({'frames':len(frames),'unique':len(set(frames)),'max_identical_run':longest}))
assets=sorted(p for p in out.iterdir() if p.name.startswith('cine-'))
assert len(assets)==6 and sum(p.stat().st_size for p in assets)<100_000_000
(out/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.name!='SHA256SUMS'))
print(json.dumps({'assembled':1440,'fps':60,'resolution':[3840,2160],'assets_bytes':sum(p.stat().st_size for p in assets)}))
