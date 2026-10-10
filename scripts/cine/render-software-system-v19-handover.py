"""Preserve readable context while the permission mechanism enters.

Only native chunks 120..299 differ from the immutable v19 author. The main
list remains readable to the left; the inspector behind permissions clears
before incoming labels become legible. No change to camera or other shots.
"""
import argparse,hashlib,importlib.util,json,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('film',Path(__file__).with_name('render-software-system-v19.py'))
film=importlib.util.module_from_spec(spec);spec.loader.exec_module(film)
original=film.prominence

def prominence(group,t):
 if not 120<=t*1199<300:return original(group,t)
 family=film.family(group)
 if family=='access':
  f=film.E((t-.125)/.080)*(1-film.E((t-.355)/.075))
  if group.startswith('access-check-'):f*=film.E((t-(.17+.028*int(group[-1])))/.026)
  return .0003+.9997*f
 if family not in ('contract','data'):
  start,duration=(.10,.03) if family in ('inspector','summary','history','action') else (.12,.085)
  return .0003+.9997*(1-film.E((t-start)/duration))
 return original(group,t)

def validate():
 film.prominence=original;film.validate();film.prominence=prominence
 for frame in range(1200):
  t=frame/1199
  if frame<120 or frame>=300:
   assert all(prominence(g,t)==original(g,t) for g in ['base','list','inspector','summary','history','action','access','access-check-2','contract','data'])
  if .11<t<.20:
   assert max(prominence('list',t),prominence('access',t))>.4, 'Readable context must survive the handover'
  if prominence('inspector',t)>.025 and t<.3:assert prominence('access',t)<.025, 'Inspector must clear before permission text'
 assert prominence('access-check-2',.20)<.001
 assert prominence('access-check-2',.29)>.99
 print(json.dumps({'patch':'v19-handover','scope':[120,299],'continuous_readable_context':True}))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);validate()
 if not args.validate_only:
  film.render(args)
  info=Path(args.output)/'render-info.json';data=json.loads(info.read_text());data.update(handover_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),handover_scope=[120,299]);info.write_text(json.dumps(data))
