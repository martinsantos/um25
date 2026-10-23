"""Native repair of the 690–749 handover; unchanged geometry and camera."""
import argparse,hashlib,importlib.util,json,os,sys
from pathlib import Path
BASE_SHA='15f2bbf32211890f70102ca81aca68893d069d957fca82aa7b8e6721ef2e4b3e'
path=Path(__file__).with_name('render-software-system-v25.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()==BASE_SHA
spec=importlib.util.spec_from_file_location('v25',path);film=importlib.util.module_from_spec(spec);spec.loader.exec_module(film)
def render(args):
 import bpy
 from bpy.app.handlers import persistent
 @persistent
 def mask_handover(scene,depsgraph=None):
  # Registered after v25's own frame update. The departing connector labels
  # clear the channel before the inter-layer route becomes visible.
  t=scene.frame_current/1199
  if .585<t<.615:
   for name in ['Approval / contract / commit','0248-A / request']:
    ob=bpy.data.objects.get(name)
    if ob:ob.hide_render=True
 @persistent
 def install(scene):
  if mask_handover not in bpy.app.handlers.frame_change_post:bpy.app.handlers.frame_change_post.append(mask_handover)
 bpy.app.handlers.render_init.append(install)
 try:film.render(args)
 finally:
  for handlers,fn in [(bpy.app.handlers.render_init,install),(bpy.app.handlers.frame_change_post,mask_handover)]:
   if fn in handlers:handlers.remove(fn)
 p=Path(args.output)/'render-info.json';d=json.loads(p.read_text());d.update(version='v25-repair',v25_authoring_sha256=BASE_SHA,authoring_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest());p.write_text(json.dumps(d))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,required=True);p.add_argument('--end',type=int,required=True);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 690<=a.start<=a.end<750;film.validate()
 if not a.validate_only:render(a)
