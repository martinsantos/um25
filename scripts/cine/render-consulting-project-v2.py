"""Consulting reveals the relationships in one project and turns them into a plan.
A measured study model and its evidence dossier share the same drafting table.
Illustrative project, not a client installation or an engineering specification.
"""
import argparse,importlib.util,json,math,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('network_equipment',Path(__file__).with_name('render-network-project-v2.py'))
network=importlib.util.module_from_spec(spec);spec.loader.exec_module(network)
studio=network.studio;smooth=studio.smooth

class Consulting(network.Network):
 def __init__(self):super().__init__();self.code='106'
 def maquette(self,x,y,z):
  self.parts.append('one-survey-model-with-related-infrastructure-layers')
  w,d=1.44,.92
  self.box(x,y,z,w,d,.012,'paper');self.box(x,y,z-.008,w+.016,d+.016,.007,'edge')
  for j in range(13):self.line([(x-.70+j*.116,y-.44,z+.013),(x-.70+j*.116,y+.44,z+.013)],'joint',.00035)
  for j in range(9):self.line([(x-.70,y-.44+j*.11,z+.013),(x+.70,y-.44+j*.11,z+.013)],'joint',.00035)
  for name in ['survey-shell','survey-network','survey-power','survey-services']:
   self.doors.append(dict(name=name,pivot=(0,0,0),kind='layer'))
  shell='survey-shell'
  # Six spaces, corridor, entrances and windows retain recognisable use at scale.
  self.box(x,y+.45,z+.013,w,.007,.145,'paper',shell)
  for xx in [-.715,.715]:self.box(x+xx,y,z+.013,.007,d,.145,'paper',shell)
  for xx in [-.238,.238]:
   for yy in [-.275,.275]:self.box(x+xx,y+yy,z+.013,.007,.35,.145,'paper',shell)
  for col in range(3):
   xx=x-.477+col*.477
   for side in [-1,1]:
    yy=y+side*.105
    self.box(xx-.105,yy,z+.013,.254,.007,.145,'paper',shell)
    self.box(xx+.199,yy,z+.013,.087,.007,.145,'paper',shell)
    self.box(xx+.08,yy,z+.143,.112,.007,.015,'paper',shell)
    # A thin leaf and its sweep are information about access, not repeated popups.
    self.line([(xx+.024,yy,z+.014),(xx+.024,yy+side*.079,z+.014)],'edge',.001)
    self.line([(xx+.024+.079*math.sin(j*math.pi/24),yy+side*.079*math.cos(j*math.pi/24),z+.014) for j in range(13)],'muted',.0004)
    for k in range(2):
     dx=xx-.125+k*.23;dy=y+side*.30
     self.box(dx,dy,z+.046,.125,.062,.003,'wood')
     for a in [-.052,.052]:
      for b in [-.020,.020]:self.box(dx+a,dy+b,z+.014,.003,.003,.032,'edge')
     self.box(dx,dy+side*.017,z+.061,.050,.002,.029,'graphite')
     self.box(dx,dy+side*.015,z+.063,.045,.001,.024,'screen')
     self.box(dx,dy-side*.012,z+.050,.029,.010,.001,'edge')
     self.box(dx,dy-side*.054,z+.038,.041,.037,.004,'fabric')
     self.box(dx,dy-side*.071,z+.042,.041,.003,.033,'fabric')
     self.cylinder(dx,dy-side*.054,z+.014,.002,.024,'edge')
    label=['OPERACION','ADMINISTRACION','COORDINACION'][col] if side<0 else ['ATENCION','SISTEMAS','PROYECTOS'][col]
    self.text(label,xx-.18,y+side*.39,z+.014,.013,'ink')
  # Fixed network core, protected power and identifiable endpoint positions.
  self.box(x+.585,y+.29,z+.014,.074,.067,.12,'graphite')
  for j in range(8):
   self.box(x+.585,y+.255,z+.027+j*.011,.066,.001,.007,'edge')
   for k in range(8):self.box(x+.559+k*.0075,y+.254,z+.029+j*.011,.003,.001,.002,'black')
  self.box(x+.680,y+.29,z+.014,.028,.059,.050,'graphite')
  for j in range(9):self.box(x+.680,y+.258,z+.020+j*.004,.021,.001,.001,'edge')
  # Each separated layer uses exactly the same plan coordinates and endpoints.
  core=(x+.585,y+.29,z+.192)
  for col in range(3):
   for side in [-1,1]:
    xx=x-.477+col*.477;yy=y+side*.30
    for k in range(2):
     dx=xx-.125+k*.23
     pts=self.rounded_path([core,(x+.585,y,z+.192),(dx,y,z+.192),(dx,yy,z+.192)],.014)
     self.line(pts,'red',.0012,group='survey-network')
     self.box(dx,yy,z+.190,.012,.009,.004,'red','survey-network')
    pts=self.rounded_path([(x+.680,y+.29,z+.214),(x+.680,y+.050,z+.214),(xx,y+.050,z+.214),(xx,yy,z+.214)],.012)
    self.line(pts,'blue',.0011,group='survey-power');self.box(xx,yy,z+.211,.016,.010,.004,'blue','survey-power')
  self.box(core[0],core[1],z+.187,.060,.051,.010,'graphite','survey-network')
  for j in range(8):self.box(core[0]-.025+j*.007,core[1]-.027,z+.190,.004,.002,.003,'red','survey-network')
  # Application dependencies are diagram nodes, distinct from physical cabling.
  group='survey-services'
  for j,(dx,label) in enumerate([(-.48,'USUARIOS'),(0,'APLICACION'),(.48,'DATOS')]):
   self.box(x+dx,y,z+.245,.245,.15,.012,'screen',group)
   self.text(label,x+dx-.098,y+.028,z+.259,.022,'paper',group=group)
   self.text(['Puestos y roles','Reglas e integracion','Conservacion y acceso'][j],x+dx-.098,y-.025,z+.259,.008,'muted',group=group)
   if j<2:
    for k in range(6):self.line([(x+dx+.131+k*.016,y,z+.252),(x+dx+.137+k*.016,y,z+.252)],'signal',.0008,group=group)
  for name,height,label,mat in [('survey-network',.192,'RED / CONECTIVIDAD','red'),('survey-power',.214,'ENERGIA / CONTINUIDAD','blue'),('survey-services',.252,'SERVICIOS / DEPENDENCIAS','signal')]:
   self.text(label,x-.70,y-.435,z+height,.018,mat,group=name)
  # Architectural scale and corner fiducials give the study a precise physical base.
  for j in range(37):self.line([(x-.70+j*.039,y-.480,z+.008),(x-.70+j*.039,y-.489-(.010 if j%6==0 else 0),z+.008)],'ink',.00035)
  self.text('RELEVAMIENTO / MODELO DE ESTUDIO',x-.67,y-.542,z+.009,.019,'ink')
  self.text('PROYECTO ILUSTRATIVO',x-.67,y-.568,z+.009,.010,'muted')
 def dossier(self,x,y,z):
  self.parts.append('evidence-linked-alternatives-and-execution-plan')
  w,d=1.17,1.00
  for k in range(3):self.box(x+k*.005,y-k*.005,z+k*.0012,w,d,.001,'paper')
  left=x-w/2+.050;top=y+d/2-.078;zz=z+.009
  self.text('DE LA EVIDENCIA AL PLAN',left,top,zz,.035,'ink')
  self.text('ESTUDIO ILUSTRATIVO / ARQUITECTURA IT',left,top-.032,zz,.012,'trace')
  self.line([(left,top-.051,zz),(x+w/2-.045,top-.051,zz)],'ink',.0007)
  # A specific finding links evidence, affected operation and a proposed decision.
  self.text('01 / DEPENDENCIA IDENTIFICADA',left,top-.086,zz,.015,'red')
  self.text('Un enlace sostiene varias actividades.',left,top-.124,zz,.025,'ink')
  for j,line in enumerate(['Evidencia: trazado y equipos relevados.','Impacto: puestos y aplicaciones relacionados.','Decision: evaluar una alternativa de continuidad.']):self.text(line,left,top-.153-j*.028,zz,.014,'ink')
  self.text('02 / CRITERIOS DE COMPARACION',left,top-.266,zz,.015,'red')
  columns=[left,left+.42,left+.67,left+.87]
  for xx,label in zip(columns,['Criterio','Alternativa A','Alternativa B','Verificacion']):self.text(label,xx,top-.302,zz,.012,'trace')
  for j,(label,a,b,c) in enumerate([('Dependencias','Reutiliza','Separa','Mapa'),('Implementacion','En etapas','Con migracion','Secuencia'),('Continuidad','Acordada','Acordada','Prueba')]):
   yy=top-.338-j*.041
   self.line([(left,yy-.012,zz),(x+w/2-.045,yy-.012,zz)],'joint',.00035)
   for xx,value in zip(columns,[label,a,b,c]):self.text(value,xx,yy,zz,.013,'ink')
  self.text('03 / ETAPAS Y ACEPTACION',left,top-.492,zz,.015,'red')
  for j,(label,detail) in enumerate([('RELEVAR','Activos y contexto'),('PRIORIZAR','Dependencias y riesgos'),('IMPLEMENTAR','Alcance y responsables'),('VERIFICAR','Evidencia de entrega')]):
   xx=left+j*.264
   self.box(xx+.113,top-.585,zz,.232,.086,.002,'graphite')
   self.text('0'+str(j+1)+' / '+label,xx+.012,top-.568,zz+.0035,.012,'paper')
   self.text(detail,xx+.012,top-.604,zz+.0035,.008,'muted')
   if j<3:self.line([(xx+.231,top-.585,zz+.003),(xx+.260,top-.585,zz+.003)],'red',.001)
  self.text('ENTREGABLES / ALCANCE / RESPONSABLES',left,top-.690,zz,.015,'ink')
  self.text('Cada etapa deja un resultado que se puede comprobar.',left,top-.724,zz,.014,'trace')
  self.line([(left,top-.770,zz),(x+w/2-.045,top-.770,zz)],'ink',.0006)
  self.text('ULTIMA MILLA / CONSULTORIA IT',left,top-.802,zz,.016,'ink')
  self.text('01 / 01',x+w/2-.125,top-.802,zz,.011,'trace')

def build():
 s=Consulting();s.box(0,.15,0,4.1,2.7,.063,'concrete')
 s.box(0,.21,.746,3.40,1.50,.031,'wood')
 for x in [-1.51,1.51]:
  for y in [-.40,.81]:s.box(x,y,.063,.035,.035,.683,'edge')
 s.box(0,.75,.62,3.04,.05,.035,'edge')
 s.maquette(-.78,.29,.790);s.dossier(1.00,.29,.786)
 # A scale rule and a fine annotation pen belong to the drafting task.
 s.box(-.77,-.440,.779,1.47,.028,.002,'edge')
 for j in range(101):s.line([(-1.47+j*.014,-.450,.782),(-1.47+j*.014,-.445+(.007 if j%10==0 else 0),.782)],'ink',.00025)
 s.cylinder(1.600,-.20,.785,.004,.26,'graphite','y')
 s.cylinder(1.600,-.454,.785,.003,.020,'edge','y')
 s.parts.append('drafting-table-and-measured-study-context')
 return s

def camera(t):
 keys=[(0,6.4,-68,(0,.22,.25),12,9),(.12,6.12,-64,(-.05,.22,.26),12,9),
       (.32,3.25,-66,(-.79,.29,1.38),5,3.6),(.49,3.35,-60,(-.77,.29,1.39),5,3.8),
       (.65,1.80,-88,(.98,.39,.793),1,5.2),(.83,1.76,-86,(1.0,.14,.793),1,5.2),
       (1,6.4,-68,(0,.22,.25),12,9)]
 if t<=0 or t>=1:k=keys[0];return k[1],math.radians(k[2]),k[3],k[4],k[5]
 a,b=next((a,b) for a,b in zip(keys,keys[1:]) if a[0]<=t<=b[0]);q=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
 return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3])),mix(a[4],b[4]),mix(a[5],b[5])

def animate(t,parents):
 open=smooth((t-.19)/.13)*(1-smooth((t-.80)/.12))
 for name,dz in [('survey-shell',.87),('survey-network',.15),('survey-power',.29),('survey-services',.45)]:parents[name].location.z=dz*open

def describe(s):
 assert camera(0)==camera(1) and len(s.doors)==4
 assert len(set(s.parts))==3
 assert all(min(b[k] for k in ['w','d','h'])>0 for b in s.boxes)
 return dict(service='106',scene='consulting-project-v2',boxes=len(s.boxes),meshes=len(s.meshes),parts=s.parts,frames=1440,fps=60,duration=24)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
 p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','workbench','baked'],default='baked')
 p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);args.proof_frames=None
 assert 0<=args.start<=args.end<1440 and args.width in [1920,3840] and 16<=args.samples<=128
 s=build();info=describe(s)
 if args.validate_only:print(json.dumps(info))
 else:studio.render(args,s,dict(source=__file__,sources=[str(Path(__file__).with_name('render-network-project-v2.py')),str(Path(__file__).with_name('prepare-render-font.py')),__file__],describe=describe,camera=camera,animate=animate,bake_frame=620,
  brand_font=True,normalized_font=True,text_depth=0,smooth_bake=True,packet_radius=.005,description='one measured study model reveals infrastructure dependencies, then links evidence to a verifiable implementation plan; continuous 24 second loop',
  lights=[('Drafting inspection',(0,-.4,3.0),70,2.4,(1,1,1),(0,.3,.85))]))
