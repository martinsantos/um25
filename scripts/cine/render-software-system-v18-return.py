"""Native, bounded depth correction for v18's return to the product.

The original author stays immutable. Only frames 936..1127 differ; complete
30-frame chunks 930..1139 carry explicit patch provenance for assembly.
"""
import argparse,hashlib,importlib.util,json,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('film',Path(__file__).with_name('render-software-system-v18.py'))
film=importlib.util.module_from_spec(spec);spec.loader.exec_module(film)
original_camera=film.camera;original_placement=film.placement;original_focus=film.focus

def lift(t):
 return 6*film.E((t-.78)/.03)*(1-film.E((t-.89)/.05))

def camera(t):
 d,target,angles=original_camera(t)
 return d,(target[0],target[1],target[2]+lift(t)),angles

def placement(group,t):
 x,y,z=original_placement(group,t)
 return x,y,z+(lift(t) if film.family(group)=='data' else 0)

def focus(group,t):
 value=original_focus(group,t)
 # Transparent layers may reveal context, but cannot print the returning
 # product's measurement rails across the readable transaction history.
 if .78<t<.94 and film.family(group) not in ('access','contract','data'):
  return min(value,film.E((t-.885)/.055))
 return value

film.camera=camera;film.placement=placement;film.focus=focus

def validate():
 film.focus=original_focus
 try:film.validate()
 finally:film.focus=focus
 for frame in range(1200):
  t=frame/1199
  if frame<930 or frame>=1140:
   assert camera(t)==original_camera(t)
   assert all(focus(g,t)==original_focus(g,t) for g in ['base','history','access','contract','data'])
   assert all(placement(g,t)==original_placement(g,t) for g in ['base','access','contract','data'])
  # The record's camera-relative geometry does not change: only its relation
  # to the returning, parallel UI planes changes. No scale or text warp.
  a=placement('data',t);b=original_placement('data',t)
  _,ca,_=camera(t);_,cb,_=original_camera(t)
  assert max(abs((a[i]-ca[i])-(b[i]-cb[i])) for i in range(3))<1e-12
 assert focus('history',.84)==0 and film.prominence('data',.84)>.8
 assert placement('data',.84)[2]>placement('history',.84)[2]+1.5

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);validate()
 if not args.validate_only:
  film.render(args)
  info=Path(args.output)/'render-info.json';data=json.loads(info.read_text());data['patch_sha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();data['patch_scope']=[930,1139];info.write_text(json.dumps(data))
