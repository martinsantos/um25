"""Native square director cut: closer mechanisms, then their surrounding context."""
import argparse,hashlib,importlib.util,json,sys
from pathlib import Path
path=Path(__file__).with_name('render-software-system-v27.py')
spec=importlib.util.spec_from_file_location('director27',path);film=importlib.util.module_from_spec(spec);spec.loader.exec_module(film)
base=film.base;E=film.E;family=film.family;MOBILE=False;ROOT=film.ROOT
placement=film.placement;mobile_scale=film.mobile_scale;route_points=film.route_points

def camera(t):
 if not MOBILE:return film.camera(t)
 d,target,angles=film.original_camera(t);x,y,z=target
 # Wait until the outgoing access plate has cleared before approaching the
 # contract. This preserves its right edge throughout the square transition.
 for amount,a,b,c,end,dx,dy in [(3.05,.13,.205,.235,.315,0,.62),(3.0,.398,.450,.485,.545,-.47,.82),(3.25,.625,.700,.728,.775,-.38,.87)]:
  q=E((t-a)/(b-a))*(1-E((t-c)/(end-c)));d-=amount*q;x+=dx*q;y+=dy*q
 return d,(x,y,z),angles

def focus(g,t):
 if g not in film.GATES:return film.original_focus(g,t)
 return film.original_focus(family(g),t)*film.gate(g,t)

def prominence(g,t):
 if g not in film.GATES:return film.original_prominence(g,t)
 return .0003+(film.original_prominence(family(g),t)-.0003)*film.gate(g,t)

def build():
 film.MOBILE=MOBILE
 return film.build()
base.camera=camera;base.focus=focus;base.prominence=prominence;base.build=build

def validate():
 base.validate();print(json.dumps({'version':'v27-mobile','composition':'mobile','native_reframe':True}))
def render(args):
 global MOBILE
 MOBILE=args.composition=='mobile';film.MOBILE=MOBILE;film.render(args)
 p=Path(args.output)/'render-info.json';d=json.loads(p.read_text());d.update(version='v27-mobile',v27_authoring_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),authoring_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest());p.write_text(json.dumps(d))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=2160);p.add_argument('--composition',choices=['mobile'],default='mobile');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<1200;MOBILE=True;validate()
 if not args.validate_only:render(args)
