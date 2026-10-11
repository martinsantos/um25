"""Assemble the complete director cut with the identical native mobile composition."""
import argparse,hashlib,importlib.util,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
checks=module('delivery_checks',Path(__file__).with_name('assemble-software-v26.py'))
run,sha,verify=checks.run,checks.sha,checks.verify

def mobile_parity(out):
 a=module('mobile26',ROOT/'scripts/cine/render-software-system-v26.py');b=module('mobile27',ROOT/'scripts/cine/render-software-system-v27.py');a.MOBILE=b.MOBILE=True;pa,pb=a.build(),b.build()
 for prop in ('texts','lines','boxes','meshes','points'):assert getattr(pa,prop)==getattr(pb,prop),prop
 for i in range(1200):
  t=i/1199;assert a.camera(t)==b.camera(t);assert a.mobile_scale(t)==b.mobile_scale(t)
  for g in pa.points:assert (a.focus(g,t),a.prominence(g,t),a.placement(g,t))==(b.focus(g,t),b.prominence(g,t),b.placement(g,t)),(i,g)
 data={'identical':True,'frames':1200,'groups':len(pa.points),'v26_authoring_sha256':sha(ROOT/'scripts/cine/render-software-system-v26.py'),'v27_authoring_sha256':sha(ROOT/'scripts/cine/render-software-system-v27.py')}
 (out/'mobile-parity.json').write_text(json.dumps(data))

def assemble(wide,mobile,out):
 out.mkdir(parents=True,exist_ok=True);mobile_parity(out)
 common={'base_authoring_sha256':sha(ROOT/'scripts/cine/render-software-system-v23.py'),'v25_authoring_sha256':sha(ROOT/'scripts/cine/render-software-system-v25.py'),'renderer_sha256':sha(ROOT/'scripts/cine/render-software-scene-v26.py'),'ui_sha256':sha(ROOT/'scripts/cine/render-software-system-v11.py'),'geometry_sha256':sha(ROOT/'scripts/cine/render-software-system-v8.py')}
 for comp,w,h,suffix,source,version,step in [('wide',3840,2160,'',wide,'v27',60),('mobile',2160,2160,'-sq',mobile,'v26',30)]:
  infos=[];movies=[]
  for start in range(0,1200,step):
   folder=source/f'{version}-spatial-{comp}-{start}';info=json.loads((folder/'info.json').read_text())
   assert [info['version'],info['publishable'],info['composition'],info['resolution'],info['frames'],info['fps'],info['samples']]==[version,False,comp,[w,h],1200,60,8]
   assert [r['frame'] for r in info['timings']]==list(range(start,start+step))
   for key,value in common.items():assert info[key]==value,('Mixed source',key)
   assert info['authoring_sha256']==sha(ROOT/f'scripts/cine/render-software-system-{version}.py')
   if version=='v27':assert info['v26_authoring_sha256']==sha(ROOT/'scripts/cine/render-software-system-v26.py')
   for name in ['public/images/logo-dark.svg','public/cine/media/empresa-mendoza.jpg']:assert info['asset_sha256'][name]==sha(ROOT/name)
   movie=folder/'movie.mp4';verify(movie,w,h,step,decode=False);movies.append(movie.resolve());infos.append(info)
  listing=out/f'concat{suffix}.txt';listing.write_text(''.join(f"file '{p}'\n" for p in movies))
  movie=out/f'cine-software-system-v27{suffix}.mp4';run('ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',movie)
  (out/f'validation{suffix}.json').write_text(json.dumps(verify(movie,w,h,1200)))
  (out/f'render-info{suffix}.json').write_text(json.dumps(dict(infos[0],delivery_version='v27',source_provenance=[dict(version=i['version'],start=i['timings'][0]['frame'],end=i['timings'][-1]['frame'],source_run=i['source_run'],authoring_sha256=i['authoring_sha256']) for i in infos],timings=[r for info in infos for r in info['timings']])))
  poster=out/f'cine-software-system-v27-poster{suffix}.jpg';run('ffmpeg','-y','-v','error','-threads','2','-i',movie,'-frames:v','1','-q:v','2',poster)
  run('node','--input-type=module','-e',"import sharp from 'sharp';sharp.cache(false);sharp.concurrency(2);await sharp(process.argv[1]).avif({quality:74,effort:3,chromaSubsampling:'4:4:4'}).toFile(process.argv[2]);",poster,poster.with_suffix('.avif'))
  for sec in [0,4,6.4,7.6,9,11.3,12.6,14.5,15.8,16.8,18.2,19.98]:run('ffmpeg','-y','-v','error','-threads','2','-ss',sec,'-i',movie,'-frames:v','1',out/f'review{suffix}-{sec}.png')
 assets=list(out.glob('cine-*'));assert sum(p.stat().st_size for p in assets)<120_000_000
 (out/'SHA256SUMS').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.name!='SHA256SUMS'))
 print(json.dumps({'version':'v27','frames':1200,'fps':60,'compositions':2,'publishable':False,'bytes':sum(p.stat().st_size for p in assets)}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--wide-source',type=Path,required=True);p.add_argument('--mobile-source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();assemble(a.wide_source,a.mobile_source,a.output)
