"""Keep the confirmed ledger legend readable over its rear binding edges."""
import argparse,hashlib,importlib.util,json,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('handover',Path(__file__).with_name('render-software-system-v19-handover.py'))
patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)
film=patch.film;original_build=film.build

def build():
 p=original_build()
 # The carrier belongs to the confirmation event and lies in front of rear
 # page edges, but behind the glyphs and check. It is absent before commit.
 p.rounded('data-event-2',3.62,-2.878,.036,4.35,.23,.003,'fieldnav',.025)
 return p

def validate():
 patch.validate();film.build=build
 for frame in range(1200):
  if not 900<=frame<1080:assert film.prominence('data-event-2',frame/1199)<.025
 assert .036+.003<.049<.051
 print(json.dumps({'patch':'v19-legend','scope':[900,1079],'opaque_legend_carrier':True}))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);validate()
 if not args.validate_only:
  film.render(args)
  info=Path(args.output)/'render-info.json';data=json.loads(info.read_text());data.update(handover_sha256=hashlib.sha256(Path(patch.__file__).read_bytes()).hexdigest(),handover_ranges=[[120,299],[1020,1139]],legend_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),legend_scope=[900,1079]);info.write_text(json.dumps(data))
