"""V27 director study: move from a close mechanism to its surrounding context."""
import argparse,hashlib,importlib.util,json,os,sys
from pathlib import Path
path=Path(__file__).with_name('render-software-system-v26.py')
spec=importlib.util.spec_from_file_location('v26',path);film=importlib.util.module_from_spec(spec);spec.loader.exec_module(film)
base=film.base;E=film.E;family=film.family;ROOT=film.ROOT;MOBILE=False
original_camera,original_build,original_focus,original_prominence=base.camera,base.build,base.focus,base.prominence
placement=film.placement;mobile_scale=film.mobile_scale;route_points=film.route_points
GATES={'access-team':(.280,.342),'access-context':(.275,.337),'contract-code':(.518,.558),'contract-toolbar':(.465,.567),'contract-adapters':(.518,.575),'contract-response':(.535,.575),'data-history':(.749,.789),'data-index':(.751,.792),'data-receipt':(.767,.800)}
def gate(g,t):
 a,b=GATES[g];return E((t-a)/.030)*(1-E((t-b)/.035))
def focus(g,t):
 if MOBILE or g not in GATES:return original_focus(g,t)
 return original_focus(family(g),t)*gate(g,t)
def prominence(g,t):
 if MOBILE or g not in GATES:return original_prominence(g,t)
 return .0003+(original_prominence(family(g),t)-.0003)*gate(g,t)
def camera(t):
 d,target,angles=original_camera(t)
 if MOBILE:return d,target,angles
 shifts=[(3.05,.13,.205,.235,.315,0,.62),(3.75,.36,.445,.485,.545,-.47,.82),(3.25,.625,.700,.728,.775,-.38,.87)]
 x,y,z=target
 for amount,a,b,c,end,dx,dy in shifts:
  q=E((t-a)/(b-a))*(1-E((t-c)/(end-c)));d-=amount*q;x+=dx*q;y+=dy*q
 return d,(x,y,z),angles
base.camera=camera;base.focus=focus;base.prominence=prominence

def build():
 film.MOBILE=MOBILE;p=original_build()
 p.texts=[(g,'Esquema tipado' if g=='contract-code' and s=='Contrato validado' else s,x,y,z,size,m,bold) for g,s,x,y,z,size,m,bold in p.texts]
 return p
base.build=build

def validate():
 base.validate();print(json.dumps({'version':'v27','mobile':MOBILE,'director_study':True}))
def render(args):
 global MOBILE
 MOBILE=args.composition=='mobile';film.render(args)
 p=Path(args.output)/'render-info.json';d=json.loads(p.read_text());d.update(version='v27',v26_authoring_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),authoring_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest());p.write_text(json.dumps(d))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<1200;MOBILE=args.composition=='mobile';validate()
 if not args.validate_only:render(args)
