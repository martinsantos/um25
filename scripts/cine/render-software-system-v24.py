"""V23 geometry with a continuous record-to-product handover after frame 959.
The immutable prefix delegates exactly to v23; only the final four seconds
are rendered again. Provenance for reused frames remains explicit.
"""
import argparse,hashlib,importlib.util,json,os,sys
from pathlib import Path
BASE_SHA='2eb91be6378c4d5ff45f6b423e9782ae96aa83ca10e1db2a72ca0047c4caf4d5'
path=Path(__file__).with_name('render-software-system-v23.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()==BASE_SHA
spec=importlib.util.spec_from_file_location('base',path);base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
original_focus=base.focus
def focus(group,t):
 if t<.8 or base.family(group)!='data':return original_focus(group,t)
 # Keep the record visible while the incoming product is still distant.
 # It fades only when the product's content has begun to re-enter the frame.
 return base.E((t-.605)/.075)*(1-base.E((t-.855)/.035))
base.focus=focus
for name in ['camera','mobile_scale','placement','prominence','family','build','validate','E','ROOT']:
 globals()[name]=getattr(base,name)
def render(args):
 assert args.start>=960,'The unchanged prefix must retain its v23 provenance'
 base.render(args)
 info=Path(args.output)/'render-info.json';data=json.loads(info.read_text())
 data.update(version='v24',base_authoring_sha256=BASE_SHA,authoring_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),unchanged_prefix_frames=960,source_run=os.environ.get('GITHUB_RUN_ID'))
 info.write_text(json.dumps(data))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=960);p.add_argument('--end',type=int,default=960);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 960<=args.start<=args.end<1200
 validate()
 if not args.validate_only:render(args)
