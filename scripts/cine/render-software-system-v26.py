"""V26: dense, varied product mechanisms in a single crossed camera trajectory.
Run Blender remotely. The model, framing and semantic checks run without Blender.
"""
import argparse, hashlib, importlib.util, json, math, os, sys
from pathlib import Path
path=Path(__file__).with_name('render-software-system-v25.py')
spec=importlib.util.spec_from_file_location('v25',path);v25=importlib.util.module_from_spec(spec);spec.loader.exec_module(v25)
base=v25.base;E=v25.E;ROOT=base.ROOT;family=base.family
MOBILE=False
original_build,original_focus,original_prominence=base.build,base.focus,base.prominence
original_placement,original_mobile_scale=base.placement,base.mobile_scale
EXTRA={'access-context':(.214,.315),'contract-code':(.437,.548),'contract-toolbar':(.433,.567),'data-history':(.698,.767)}
REPLACED={'access-team','contract-adapters','data-index','data-receipt'}
base.COLORS.update(copper='#EDA67D',sky='#80BDED',softshadow='#05080A',deepglass='#5B7683')
base.ALPHA.update(softshadow=.10,deepglass=.095)
# Preserve camera velocity and the loop. Main mechanisms gain area; supporting
# components fill the existing lateral space instead of pushing the camera back.
base.CAMERA_KEYS=[(t,d-({.22:.35,.345:.35,.44:.25,.585:.25,.69:-.65,.815:-.65}.get(t,0)),target,angles) for t,d,target,angles in base.CAMERA_KEYS]
def gate(g,t):
 if g not in EXTRA:return 1
 a,b=EXTRA[g];return E((t-a)/.035)*(1-E((t-b)/.040))
def focus(g,t):return original_focus(g,t)*gate(g,t)
def prominence(g,t):
 value=original_prominence(g,t)
 # Retire the workspace chrome before the inspector lifts through its header.
 if g=='base' and .09<t<.25:value=min(value,.0003+.9997*(1-E((t-.09)/.020)))
 if g in EXTRA and family(g)=='access':value=.0003+(value-.0003)*gate(g,t)
 return value
base.focus=focus;base.prominence=prominence
focus=base.focus;prominence=base.prominence

def placement(g,t):
 x,y,z=original_placement(g,t)
 if g in EXTRA:
  q=E((t-EXTRA[g][0])/.035);z+=.26*(1-q);y-=.06*(1-q)
 return x,y,z
base.placement=placement
def route_points(t):
 ax,ay,az=placement('access',t);cx,cy,cz=placement('contract',t);dx,dy,dz=placement('data',t)
 points=[(6.96+ax,-2.88+ay,az+.06),(8.60,-5.50,-.7),(-4.95+cx,-5.50,cz+.03),(-4.95+cx,-3.45,cz+.03),(6.12+dx,-3.45,dz+.03)]
 # The contract-to-record segment exists only after contract validation.
 # Drawing future traffic during access review crossed the team directory.
 if t<.58:points[-1]=points[-2]
 return points
base.route_points=route_points

def mobile_scale(t):
 close=.11*E((t-.463)/.032)*(1-E((t-.543)/.032))+.045*E((t-.712)/.027)*(1-E((t-.767)/.027))
 return original_mobile_scale(t)-close-.035*(1-E((t-.105)/.035)+E((t-.92)/.04))
base.mobile_scale=mobile_scale;camera=base.camera

def plate(p,g,x,y,w,h,z,m='fieldnav',radius=.055):
 # The soft double underlay belongs to this surface and follows its reveal.
 for spread,depth in [(.10,.07),(.05,.04)]:p.rounded(g,x+.035,y-.045,z-depth,w+spread,h+spread,.003,'softshadow',radius+.025)
 p.rounded(g,x,y,z,w,h,.018,m,radius)
 p.line(g,[(x-w/2+.05,y+h/2-.012,z+.022),(x+w/2-.05,y+h/2-.012,z+.022)],'bevel',.003)

def toggle(p,g,x,y,z,on=True):
 p.rounded(g,x,y,z,.24,.115,.012,'tilemint' if on else 'fieldpaper',.05)
 p.disc(g,x+(.056 if on else -.056),y,.037,'green' if on else 'quiet',z=z+.015)
def chevron(p,g,x,y,z):p.line(g,[(x-.026,y+.012,z),(x,y-.012,z),(x+.026,y+.012,z)],'quiet',.003)
def search(p,g,x,y,z):
 p.line(g,[(x+.044*math.cos(i*math.tau/24),y+.044*math.sin(i*math.tau/24),z) for i in range(25)],'quiet',.004)
 p.line(g,[(x+.034,y-.034,z),(x+.074,y-.074,z)],'quiet',.004)
def chip(p,g,text,x,y,w,z,col='quiet',bg='fieldnav'):
 p.rounded(g,x+w/2,y,z,w,.19,.004,bg,.08);p.label(g,text,x+.075,y-.030,.083,col,True,z=z+.014)

def build():
 p=original_build()
 for attr in ('meshes','texts','lines','boxes'):setattr(p,attr,[v for v in getattr(p,attr) if v[0] not in REPLACED])
 # The directory is a real, dense list with identity, scope, roles and states.
 # Its silhouette is deliberately different from the permission matrix above.
 g='access-team';z=-.50
 plate(p,g,4.29,-4.04,5.36,1.16,z)
 p.label(g,'EQUIPO DEL PROYECTO',1.78,-3.64,.103,'quiet',True,z=z+.04)
 p.label(g,'ALCANCE',3.28,-3.64,.073,'quiet',True,z=z+.04)
 p.label(g,'ROL',4.66,-3.64,.073,'quiet',True,z=z+.04)
 chip(p,g,'3 miembros',5.81,-3.607,.92,z+.04)
 for i,(initial,role,scope,col,bg) in enumerate([('MS','Responsable','P-104 / proyecto','teal','tilemint'),('AR','Operaciones','P-104 / órdenes','lilac','tileviolet'),('LC','Administración','P-104 / registros','gold','tilegold')]):
  y=-3.86-i*.26;zz=z+.04
  if i==0:p.rounded(g,4.29,y-.028,zz-.01,5.07,.242,.003,'tilemint',.028)
  p.disc(g,1.88,y-.026,.082,bg,z=zz+.01);p.label(g,initial,1.816,y-.055,.071,col,True,z=zz+.025)
  p.label(g,{'MS':'Responsable de obra','AR':'Equipo operativo','LC':'Administración'}[initial],2.05,y-.055,.105,'ink',i==0,z=zz+.025)
  p.label(g,scope,3.29,y-.055,.087,'quiet',z=zz+.025)
  chip(p,g,role,4.64,y-.025,1.20,zz+.01,col,'fieldpaper' if i==0 else 'fieldnav')
  p.disc(g,6.16,y-.022,.018,'green',z=zz+.025);p.label(g,'Activo',6.25,y-.052,.080,'quiet',z=zz+.025);chevron(p,g,6.67,y-.024,zz+.027)
 # Project command palette sits behind and to the side of the identity card.
 if not MOBILE:
  g='access-context';z=-.72;x=-1.24
  plate(p,g,x+1.17,-1.48,2.34,2.74,z,'fieldpaper')
  p.label(g,'CONTEXTO',x+.16,-.31,.087,'quiet',True,z=z+.04)
  chip(p,g,'P-104',x+1.45,-.275,.71,z+.035,'teal','tilemint')
  p.rounded(g,x+1.17,-.63,z+.036,2.04,.32,.006,'fieldnav',.05);search(p,g,x+.32,-.62,z+.06)
  p.label(g,'Buscar en el proyecto',x+.47,-.659,.092,'muted',z=z+.061)
  for i,(name,sub,kind,col,bg) in enumerate([('Nueva sede','Ubicación y alcance','cloud','teal','tilemint'),('Órdenes de trabajo','0248 / aprobación','ledger','gold','tilegold'),('Equipo asignado','Identidad y permisos','people','lilac','tileviolet')]):
   y=-1.08-i*.51
   v25.tile(p,g,kind,x+.32,y,z+.04,.30,col,bg)
   p.label(g,name,x+.58,y+.026,.121,'ink',True,z=z+.074)
   p.label(g,sub,x+.58,y-.14,.083,'quiet',z=z+.074)
   if i<2:p.rule(g,x+.16,x+2.18,y-.255,'line',z=z+.03)
  chip(p,g,'Proyecto seleccionado',x+.15,-2.59,2.04,z+.04,'teal','tilemint')
 # Expanded connector browser: tactile glyphs, state switches and metadata.
 # Two rows retain a clear hierarchy; the lower capability pills add another
 # kind of object rather than a third identical row.
 g='contract-adapters';z=-.54
 p.label(g,'CONECTORES DEL PROYECTO',-4.30,-3.60,.104,'quiet',True,z=z+.04)
 p.label(g,'6 vinculados',.35,-3.60,.083,'teal',True,z=z+.04)
 adapters=[('ERP','Órdenes / REST','ledger','gold','tilegold'),('CRM','Equipo / permisos','people','lilac','tileviolet'),('API','Esquema / JSON','webhook','teal','tilemint'),('Datos','Relaciones / SQL','database','cobalt','tileblue'),('Eventos','Cola / webhook','mail','coral','tilegold'),('Cloud','Entrega / runtime','cloud','lilac','tileviolet')]
 for i,(name,sub,kind,col,bg) in enumerate(adapters):
  row=i//3;column=i%3;x=-4.30+column*2.02;y=-3.96-row*.54;zz=z+.15*(column==1)
  plate(p,g,x+.945,y,1.89,.46,zz)
  v25.tile(p,g,kind,x+.20,y+.005,zz+.027,.31,col,bg)
  p.label(g,name,x+.45,y+.045,.126,'ink',True,z=zz+.073)
  p.label(g,sub,x+.45,y-.118,.081,'quiet',z=zz+.073)
  toggle(p,g,x+1.67,y+.03,zz+.051)
 for x,t,w in [(-4.27,'REST',.68),(-3.42,'Webhooks',1.06),(-2.20,'JSON Schema',1.27),(-.77,'OAuth / roles',1.33)]:chip(p,g,t,x,-4.92,w,z+.06,'quiet')
 # A proper search/command strip, lifted above the schema's own tabs.
 g='contract-toolbar';z=-.37
 plate(p,g,-1.65,1.47,5.78,.47,z,'fieldpaper')
 p.label(g,'P-104',-4.29,1.425,.103,'ink',True,z=z+.034)
 p.label(g,'/ Integraciones',-3.68,1.425,.103,'quiet',z=z+.034)
 p.rounded(g,-.71,1.465,z+.026,2.10,.27,.005,'fieldnav',.08);search(p,g,-1.57,1.477,z+.048)
 p.label(g,'Buscar conexión…',-1.42,1.425,.100,'quiet',z=z+.052)
 p.rounded(g,.69,1.465,z+.036,.81,.275,.005,'tilemint',.055)
 p.label(g,'+ Vincular',.38,1.421,.100,'green',True,z=z+.059)
 if not MOBILE:
  g='contract-code';z=-.80;x=-6.47
  plate(p,g,x+1.06,-1.15,2.12,2.85,z,'fieldnav')
  p.label(g,'PAYLOAD',x+.16,.08,.101,'quiet',True,z=z+.04)
  chip(p,g,'JSON',x+1.43,.116,.51,z+.035,'sky','tileblue')
  p.rule(g,x+.15,x+1.99,-.14,'line',z=z+.03)
  for i,(token,value,color) in enumerate([('request','0248-A','teal'),('project','P-104','gold'),('actor','MS / responsable','lilac'),('operation','approval','sky'),('version','3','coral')]):
   yy=-.39-i*.36
   p.label(g,str(i+1).rjust(2,'0'),x+.15,yy,.073,'quiet',z=z+.045)
   p.label(g,token,x+.45,yy,.088,'quiet',z=z+.045)
   p.label(g,value,x+.45,yy-.145,.111,color,True,z=z+.045)
  p.icon(g,'check',x+.17,-2.37,'green',.10,z=z+.05)
  p.label(g,'Contrato validado',x+.36,-2.365,.102,'green',z=z+.05)
 # Keep the typed response from v25: its identifier matches the visible payload.
 # Rebuild the indexed lower plane with real columns and varied row affordances.
 g='data-index';z=-.46
 plate(p,g,3.66,-4.09,4.84,1.36,z)
 p.label(g,'REGISTROS RELACIONADOS',1.42,-3.62,.100,'quiet',True,z=z+.04)
 chip(p,g,'Orden / 0248',4.57,-3.587,1.31,z+.04,'teal','tilemint')
 for x,t in [(1.46,'ID'),(2.23,'PROYECTO'),(3.85,'VERSIÓN'),(4.73,'ESTADO')]:p.label(g,t,x,-3.84,.068,'quiet',True,z=z+.04)
 for i,(id,version,state,col) in enumerate([('0248','v3','Aprobada','teal'),('0247','v2','En curso','gold'),('0246','v1','Cerrada','quiet')]):
  y=-4.085-i*.243
  if i==0:p.rounded(g,3.66,y+.03,z+.026,4.58,.225,.003,'tilemint',.026)
  p.rounded(g,1.52,y+.033,z+.046,.071,.071,.003,'fieldpaper',.012)
  if i==0:p.icon(g,'check',1.49,y+.006,'green',.045,z=z+.056)
  for x,word in [(1.70,id),(2.23,'P-104 / Nueva sede'),(3.85,version),(4.93,state)]:p.label(g,word,x,y,.094,'ink' if i==0 else 'quiet',i==0,z=z+.054)
  p.disc(g,4.77,y+.035,.018,col,z=z+.06)
 # A physically separated receipt uses a document silhouette, not another box.
 g='data-receipt';z=.83;x=6.57;y=-1.06
 plate(p,g,x+.73,y,1.46,2.55,z,'fieldpaper')
 v25.tile(p,g,'ledger',x+.29,y+.95,z+.032,.37,'lilac','tileviolet')
 p.label(g,'v3',x+.86,y+.91,.155,'lilac',True,z=z+.07)
 p.label(g,'COMPROBANTE',x+.14,y+.58,.079,'quiet',True,z=z+.07)
 p.label(g,'0248',x+.14,y+.275,.247,'ink',True,z=z+.07)
 p.label(g,'P-104 / Nueva sede',x+.14,y+.040,.092,'muted',z=z+.07)
 for j in range(12):p.line(g,[(x+.14+j*.10,y-.18,z+.06),(x+.19+j*.10,y-.18,z+.06)],'line',.003)
 p.icon(g,'check',x+.16,y-.42,'green',.12,z=z+.07)
 p.label(g,'Registrada',x+.38,y-.395,.122,'green',True,z=z+.07)
 for j,w in enumerate([1,2,1,1,3,1,2,1,1,2,3,1,2,1,1,2]):p.box(g,x+.18+j*.063,y-.77,z+.050,.014*w,.24,.004,'muted')
 p.label(g,'0248-A / 7c4f',x+.15,y-1.055,.086,'quiet',z=z+.07)
 p.line(g,[(6.03,y,.07),(6.30,y,.07),(6.30,y,z+.05),(x,y,z+.05)],'violet',.003)
 if not MOBILE:
  g='data-history';z=-.82;x=-1.17
  plate(p,g,x+1.19,-1.19,2.38,2.96,z,'fieldnav')
  p.label(g,'VERSIONES',x+.17,.095,.099,'quiet',True,z=z+.04)
  p.label(g,'Orden 0248',x+.17,-.15,.164,'ink',True,z=z+.04)
  p.line(g,[(x+.27,-.43,z+.04),(x+.27,-2.13,z+.04)],'registration',.003)
  for i,(version,title,detail,col) in enumerate([('v3','Aprobación','MS / responsable','teal'),('v2','Revisión','Equipo / alcance','gold'),('v1','Creación','P-104 / proyecto','quiet')]):
   yy=-.49-i*.60
   p.disc(g,x+.27,yy+.018,.042,'tilemint' if i==0 else 'fieldpaper',z=z+.06)
   p.disc(g,x+.27,yy+.018,.017,col,z=z+.07)
   p.label(g,title,x+.48,yy+.013,.127,'ink',i==0,z=z+.05)
   p.label(g,detail,x+.48,yy-.158,.090,'quiet',z=z+.05)
   chip(p,g,version,x+1.77,yy+.05,.43,z+.055,col)
  chip(p,g,'Trazabilidad completa',x+.15,-2.42,2.08,z+.05,'teal','tilemint')
 return p
base.build=build

def validate():
 base.validate()
 p=build()
 for g in ['access-team','contract-adapters','data-index','data-receipt']:assert any(v[0]==g for v in p.texts)
 assert all(v[7] not in base.ALPHA for v in p.texts)
 print(json.dumps({'version':'v26','labels':len(p.texts),'surfaces':len(p.meshes),'mobile':MOBILE}))
def render(args):
 global MOBILE
 MOBILE=args.composition=='mobile'
 import bpy
 from bpy.app.handlers import persistent
 @persistent
 def route_visibility(scene,depsgraph=None):
  t=scene.frame_current/1199;travelling=(.295<t<.435) or (.615<=t<.695)
  for name in ['Approval / contract / commit','0248-A / request']:
   ob=bpy.data.objects.get(name)
   if ob:
    ob.hide_render=not travelling
    if name=='Approval / contract / commit':ob.data.bevel_depth=.0028
 bpy.app.handlers.frame_change_post.append(route_visibility)
 renderer_path=Path(__file__).with_name('render-software-scene-v26.py')
 spec=importlib.util.spec_from_file_location('studio26',renderer_path);studio=importlib.util.module_from_spec(spec);spec.loader.exec_module(studio)
 try:studio.render(args,base)
 finally:bpy.app.handlers.frame_change_post.remove(route_visibility)
 info=Path(args.output)/'render-info.json';data=json.loads(info.read_text())
 data.update(version='v26',renderer_sha256=hashlib.sha256(renderer_path.read_bytes()).hexdigest(),base_authoring_sha256=v25.BASE_SHA,v25_authoring_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),authoring_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),source_run=os.environ.get('GITHUB_RUN_ID'))
 info.write_text(json.dumps(data))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<1200;MOBILE=args.composition=='mobile'
 validate()
 if not args.validate_only:render(args)
