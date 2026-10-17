"""Replace a premature validation claim with an accurate schema label.
Only the wide payload panel changes; geometry, camera and motion stay frozen.
"""
import argparse,hashlib,importlib.util,json,sys
from pathlib import Path
BASE_SHA='ab2108e79c2cb10c02e8ac3123f066eec03394ca4aaf0ec7c0f7c29f183e556c'
path=Path(__file__).with_name('render-software-system-v26.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()==BASE_SHA
spec=importlib.util.spec_from_file_location('v26',path);film=importlib.util.module_from_spec(spec);spec.loader.exec_module(film)
original_build=film.base.build
def build():
 p=original_build()
 p.texts=[(g,'Esquema tipado' if g=='contract-code' and s=='Contrato validado' else s,x,y,z,size,m,bold) for g,s,x,y,z,size,m,bold in p.texts]
 return p
film.base.build=build
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,required=True);p.add_argument('--end',type=int,required=True);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
 assert args.composition=='wide' and 510<=args.start<=args.end<720
 film.validate()
 if not args.validate_only:
  film.render(args)
  p=Path(args.output)/'render-info.json';d=json.loads(p.read_text());d.update(version='v26-payload-repair',v26_authoring_sha256=BASE_SHA,authoring_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest());p.write_text(json.dumps(d))
