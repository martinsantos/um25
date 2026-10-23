"""Keep the return continuously visible, with a bounded contour crossfade.

The preceding depth correction is immutable. Only chunks 1020..1139 change;
the record remains in front while the product structure returns progressively.
"""
import argparse,hashlib,importlib.util,json,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('depth_patch',Path(__file__).with_name('render-software-system-v18-return.py'))
patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)
film=patch.film

def focus(group,t):
 value=patch.original_focus(group,t)
 if .78<t<.94 and film.family(group) not in ('access','contract','data'):
  return min(value,film.E((t-.85)/.05))
 return value

def validate():
 patch.validate()
 for frame in range(1200):
  t=frame/1199
  if frame<1020 or frame>=1140:
   assert all(focus(g,t)==patch.focus(g,t) for g in ['base','history','access','contract','data'])
  if .825<t<.94:
   # No interval with both active structures invisible.
   assert max(focus('base',t),focus('data',t))>.19
 assert focus('history',.84)==0
film.focus=focus

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);validate();film.focus=focus
 if not args.validate_only:
  film.render(args)
  info=Path(args.output)/'render-info.json';data=json.loads(info.read_text());data.update(patch_sha256=hashlib.sha256(Path(patch.__file__).read_bytes()).hexdigest(),patch_scope=[930,1139],return_balance_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),return_balance_scope=[1020,1139]);info.write_text(json.dumps(data))
