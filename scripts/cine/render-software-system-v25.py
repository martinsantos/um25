"""V25: a product workspace with detached connector, team and receipt planes.
Authoring and projection validation are local; Blender rendering is remote only.
"""
import argparse,hashlib,importlib.util,json,math,os,sys
from pathlib import Path
BASE_SHA='2eb91be6378c4d5ff45f6b423e9782ae96aa83ca10e1db2a72ca0047c4caf4d5'
path=Path(__file__).with_name('render-software-system-v23.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()==BASE_SHA
spec=importlib.util.spec_from_file_location('base25',path);base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
E=base.E;ROOT=base.ROOT;family=base.family
old_build,old_focus,old_place,old_prominence=base.build,base.focus,base.placement,base.prominence
base.COLORS.update(cobalt='#477FFF',coral='#FA927A',lilac='#CBB1FF',gold='#E9C17A',teal='#62CCB7',tileblue='#253F6B',tilegold='#5C4631',tileviolet='#493E65',tilemint='#254F4E')
EXTRA={'access-team':(.235,.032),'contract-adapters':(.435,.035),'contract-response':(.505,.035),'data-index':(.695,.035),'data-receipt':(.745,.035)}
def gate(g,t):
 if g not in EXTRA:return 1
 start,duration=EXTRA[g]
 return E((t-start)/duration)*(1-E((t-{'access':.325,'contract':.575,'data':.792}[family(g)])/.035))
def focus(g,t):
 value=E((t-.605)/.075)*(1-E((t-.850)/.030)) if t>=.8 and family(g)=='data' else old_focus(g,t)
 return value*gate(g,t)
base.focus=focus
def prominence(g,t):
 value=old_prominence(g,t)
 if g in EXTRA and family(g)=='access':value=.0003+(value-.0003)*gate(g,t)
 return value
base.prominence=prominence
def placement(g,t):
 x,y,z=old_place(g,t)
 if g in EXTRA:
  start,duration=EXTRA[g];q=E((t-start)/duration)
  y+=({'access-team':.18,'contract-adapters':.20,'data-index':.16}.get(g,0))-.14*(1-q);z+=.32*(1-q)
 return x,y,z
base.placement=placement
# Widen only the mechanism shots: their detached planes remain contextual,
# while the camera's continuous crossed trajectory and quiet handovers survive.
base.CAMERA_KEYS=[(t,d+({.22:3.2,.345:3.2,.44:4.8,.585:4.8,.69:3.9,.815:3.9}.get(t,0)),
 (target[0]+({.44:.47,.585:.47,.69:.38,.815:.38}.get(t,0)),target[1]-({.22:.62,.345:.62,.44:.82,.585:.82,.69:.87,.815:.87}.get(t,0)),target[2]),angles) for t,d,target,angles in base.CAMERA_KEYS]
def tile(p,g,kind,x,y,z,size,col,bg):
 """Distinct, original interface symbols; no third-party endorsement implied."""
 p.rounded(g,x,y,z,size,size,.016,bg,size*.22)
 p.line(g,[(x-size*.33,y+size*.40,z+.020),(x+size*.33,y+size*.40,z+.020)],col,.0024)
 def line(pts,r=.005):p.line(g,[(x+a*size,y+b*size,z+.023) for a,b in pts],col,r)
 if kind=='ledger':
  line([(-.24,-.27),(-.24,.27),(.24,.27),(.24,-.27),(-.24,-.27)],.004)
  for yy in [-.15,0,.15]:line([(-.12,yy),(.14,yy)],.006)
 elif kind=='webhook':
  for dx,dy in [(-.20,-.12),(.20,-.12),(0,.22)]:
   p.line(g,[(x+(dx+.105*math.cos(i*math.tau/24))*size,y+(dy+.105*math.sin(i*math.tau/24))*size,z+.023) for i in range(25)],col,.005)
  line([(-.19,-.01),(0,.14),(.19,-.01)],.008);line([(-.08,-.12),(.08,-.12)],.008)
 elif kind=='database':
  for yy in [-.20,0,.20]:p.line(g,[(x+.26*size*math.cos(i*math.tau/24),y+(yy+.09*math.sin(i*math.tau/24))*size,z+.023) for i in range(25)],col,.004)
  line([(-.26,-.20),(-.26,.20)],.004);line([(.26,-.20),(.26,.20)],.004)
 elif kind=='cloud':
  line([(-.31,-.12),(-.31,.01),(-.20,.11),(-.11,.11),(-.10,.23),(.04,.29),(.17,.24),(.20,.10),(.29,.04),(.29,-.12),(-.31,-.12)],.009)
 elif kind=='mail':
  line([(-.29,-.19),(-.29,.20),(.29,.20),(.29,-.19),(-.29,-.19)],.006)
  line([(-.29,.17),(0,-.02),(.29,.17)],.006)
 elif kind=='people':
  for dx,dy in [(-.15,-.07),(.15,-.07),(0,.17)]:
   p.disc(g,x+dx*size,y+dy*size,.065*size,col,z=z+.024)
   p.rounded(g,x+dx*size,y+(dy-.14)*size,z+.024,.16*size,.10*size,.002,col,.04*size)
def plate(p,g,x,y,w,h,z,m='fieldnav'):
 p.rounded(g,x+.015,y-.025,z-.024,w+.025,h+.025,.004,'shadow',.06)
 p.rounded(g,x,y,z,w,h,.018,m,.06)
 p.line(g,[(x-w/2+.07,y+h/2-.018,z+.024),(x+w/2-.07,y+h/2-.018,z+.024)],'bevel',.003)
def build():
 p=old_build()
 # Quiet the enclosing selection, so colored product objects own the hierarchy.
 p.lines=[(g,pts,'registration' if family(g) in ('contract','data') and len(pts)==5 and pts[0]==pts[-1] else m,min(r,.003) if family(g) in ('contract','data') and len(pts)==5 else r) for g,pts,m,r in p.lines]
 # Coloured glyph plates: each integration has a distinct object and surface.
 for x,kind,col,bg in [(-4.20,'ledger','gold','tilegold'),(-2.53,'webhook','teal','tilemint'),(-.85,'people','lilac','tileviolet')]:
  tile(p,'contract',kind,x+.20,-2.48,.105,.37,col,bg)
 # Team directory floats below the actual access mechanism; multiple roles
 # remain visible while the effective role above is being evaluated.
 g='access-team';z=-.48
 p.label(g,'EQUIPO DEL PROYECTO',1.61,-3.62,.103,'quiet',True,z=z+.03)
 p.label(g,'3 miembros / P-104',5.43,-3.62,.092,'quiet',z=z+.03)
 for i,(name,role,col,bg) in enumerate([('MS','Responsable','teal','tilemint'),('AR','Operaciones','lilac','tileviolet'),('LC','Administración','gold','tilegold')]):
  x=1.61+i*1.79;yy=-4.08
  plate(p,g,x+.815,yy,1.63,.61,z+i*.045)
  p.disc(g,x+.23,yy+.014,.146,bg,z=z+.075+i*.045)
  p.disc(g,x+.23,yy+.061,.042,col,z=z+.079+i*.045)
  p.rounded(g,x+.23,yy-.035,z+.08+i*.045,.154,.082,.003,col,.035)
  p.label(g,name,x+.46,yy+.035,.136,'ink',True,z=z+.08+i*.045)
  p.label(g,role,x+.46,yy-.146,.088,'muted',z=z+.08+i*.045)
  p.disc(g,x+1.45,yy+.07,.021,'green',z=z+.085+i*.045)
 # Two staggered connector rails are separate from the schema, much like the
 # actual adapters behind a working application. No fabricated KPI is shown.
 g='contract-adapters';z=-.42
 p.label(g,'CONECTORES / MISMA OPERACIÓN',-4.28,-3.64,.099,'quiet',True,z=z+.03)
 adapters=[('ERP','Órdenes de trabajo','ledger','gold','tilegold'),('CRM','Equipo y alcance','people','lilac','tileviolet'),('API','Contrato REST v3','webhook','teal','tilemint'),('Datos','Registro persistente','database','cobalt','tileblue'),('Eventos','approval.accepted','mail','coral','tilegold'),('Cloud','Entrega del resultado','cloud','lilac','tileviolet')]
 for i,(name,sub,kind,col,bg) in enumerate(adapters):
  row=i//3;column=i%3;x=-4.28+column*2.02;yy=-4.05-row*.55;zz=z+.14*(column==1)
  plate(p,g,x+.945,yy,1.89,.45,zz)
  tile(p,g,kind,x+.21,yy,zz+.026,.31,col,bg)
  p.label(g,name,x+.45,yy+.027,.119,'ink',True,z=zz+.06)
  p.label(g,sub,x+.45,yy-.137,.077,'quiet',z=zz+.06)
  p.disc(g,x+1.73,yy+.055,.018,'green',z=zz+.06)
 # The returned payload is a floating, typed receipt, not a fourth schema box.
 g='contract-response';z=.43;x=1.80
 plate(p,g,x+.67,-1.18,1.34,2.27,z)
 tile(p,g,'webhook',x+.25,-.36,z+.028,.32,'teal','tilemint')
 p.label(g,'202',x+.50,-.35,.155,'green',True,z=z+.06)
 p.label(g,'ACEPTADA',x+.14,-.69,.090,'quiet',True,z=z+.06)
 for j,(label,value) in enumerate([('request','0248-A'),('schema','approval.v3'),('delivery','event')]):
  yy=-1.01-j*.40
  p.label(g,label,x+.14,yy,.083,'quiet',z=z+.06)
  p.label(g,value,x+.14,yy-.168,.111,'ink',True,z=z+.06)
  if j<2:p.rule(g,x+.14,x+1.16,yy-.25,'line',z=z+.03)
 p.line(g,[(1.30,-1.14,-.15),(1.55,-1.14,-.15),(1.55,-1.14,z+.035),(1.80,-1.14,z+.035)],'signal',.004)
 # An indexed lower plane makes persistence visible as a working product.
 g='data-index';z=-.40
 plate(p,g,3.65,-4.09,4.62,1.18,z)
 p.label(g,'ÍNDICE / ÓRDENES',1.51,-3.69,.101,'quiet',True,z=z+.04)
 for x,word in [(1.53,'ID'),(2.25,'PROYECTO'),(3.65,'VERSIÓN'),(4.58,'ESTADO')]:p.label(g,word,x,-3.94,.071,'quiet',True,z=z+.04)
 for i,(id,version,state,col) in enumerate([('0248','v3','Aprobada','teal'),('0247','v2','En curso','gold')]):
  yy=-4.20-i*.26
  if i==0:p.rounded(g,3.65,yy+.038,z+.023,4.36,.24,.003,'tilemint',.035)
  for x,word in [(1.53,id),(2.25,'P-104 / Nueva sede'),(3.65,version),(4.78,state)]:p.label(g,word,x,yy,.095,'ink' if i==0 else 'quiet',i==0,z=z+.048)
  p.disc(g,4.64,yy+.032,.020,col,z=z+.050)
 # Receipt floats in front of the database plane, with document corners,
 # identity, a machine-readable motif and a result that resolves on commit.
 g='data-receipt';z=.48;x=6.62;yy=-1.02
 plate(p,g,x+.68,yy,1.36,2.36,z,'fieldpaper')
 tile(p,g,'ledger',x+.27,yy+.86,z+.028,.34,'lilac','tileviolet')
 p.label(g,'v3',x+.77,yy+.84,.140,'lilac',True,z=z+.06)
 p.label(g,'ORDEN',x+.14,yy+.48,.082,'quiet',True,z=z+.06)
 p.label(g,'0248',x+.14,yy+.21,.215,'ink',True,z=z+.06)
 p.label(g,'P-104 / Nueva sede',x+.14,yy-.035,.089,'muted',z=z+.06)
 p.rule(g,x+.14,x+1.22,yy-.18,z=z+.04)
 p.icon(g,'check',x+.14,yy-.44,'green',.12,z=z+.06)
 p.label(g,'Registrada',x+.35,yy-.415,.114,'green',True,z=z+.06)
 # Barcode is a visual record identifier, not a claim of a scannable format.
 for j,w in enumerate([1,2,1,1,3,1,2,1,1,2,3,1,2,1,1,2]):p.box(g,x+.17+j*.057,yy-.72,z+.043,.013*w,.21,.003,'muted')
 p.label(g,'0248-A / 7c4f',x+.14,yy-.97,.080,'quiet',z=z+.06)
 p.line(g,[(6.03,yy,.07),(6.30,yy,.07),(6.30,yy,z+.03),(6.62,yy,z+.03)],'violet',.003)
 return p
base.build=build
camera=base.camera;mobile_scale=base.mobile_scale
def validate():
 base.validate()
 p=build()
 assert all(g in p.points for g in EXTRA)
 assert all(base.family(g) in ('access','contract','data') for g in EXTRA)
def render(args):
 import bpy
 from bpy.app.handlers import persistent
 @persistent
 def route_visibility(scene):
  # The long inter-layer route is relevant only while the operation travels.
  # Keeping it drawn at rest crossed the connector and index headings.
  t=scene.frame_current/1199
  travelling=(.295<t<.435) or (.585<t<.710)
  for name in ['Approval / contract / commit','0248-A / request']:
   ob=bpy.data.objects.get(name)
   if ob:
    ob.hide_render=not travelling
    if name=='Approval / contract / commit':ob.data.bevel_depth=.0028
 bpy.app.handlers.render_pre.append(route_visibility)
 try:base.render(args)
 finally:
  if route_visibility in bpy.app.handlers.render_pre:bpy.app.handlers.render_pre.remove(route_visibility)
 info=Path(args.output)/'render-info.json';data=json.loads(info.read_text())
 data.update(version='v25',base_authoring_sha256=BASE_SHA,authoring_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),source_run=os.environ.get('GITHUB_RUN_ID'))
 info.write_text(json.dumps(data))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0);p.add_argument('--samples',type=int,default=8);p.add_argument('--width',type=int,default=3840);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--font-dir');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<1200
 validate()
 if not args.validate_only:render(args)
