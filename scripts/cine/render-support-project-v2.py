"""A support case connects an observed symptom, its equipment and verification.
The interface is an illustrative case, not a customer record or a performance claim.
All animation is native and rendered exclusively on disposable remote runners.
"""
import argparse,importlib.util,json,math,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('network_equipment',Path(__file__).with_name('render-network-project-v2.py'))
network=importlib.util.module_from_spec(spec);spec.loader.exec_module(network)
studio=network.studio;smooth=studio.smooth

class Support(network.Network):
 def __init__(self):super().__init__();self.code='105'
 def ui(self,x,y,z,w=.78,h=.46):
  self.parts.append('case-evidence-and-verification-interface')
  self.box(x,y,z,w,.026,h,'graphite');self.box(x,y-.014,z+.014,w-.026,.002,h-.028,'screen')
  self.box(x,y+.002,z-.13,.026,.025,.13,'edge');self.box(x,y-.01,z-.142,.23,.15,.009,'edge')
  left=x-w/2+.030;front=y-.018
  self.text('UM / MESA DE AYUDA',left,front,z+h-.044,.017,'paper',True)
  self.text('CASO ILUSTRATIVO / RED LOCAL',left,front,z+h-.068,.009,'muted',True)
  self.line([(left,front,z+h-.087),(x+w/2-.03,front,z+h-.087)],'trace',.0005)
  self.text('EQUIPO Y CONTEXTO',left,front,z+h-.116,.009,'muted',True)
  self.text('Switch / puerto 12',left,front,z+h-.145,.014,'paper',True)
  self.text('Sala tecnica / puestos de trabajo',left,front,z+h-.166,.008,'muted',True)
  # The dependency trace stays in place as the case state progresses.
  for j,(label,detail) in enumerate([('EQUIPO','Puerto 12'),('RED','Enlace local'),('SERVICIO','Operacion')]):
   xx=left+.060+j*.127
   self.box(xx,front,z+.167,.100,.002,.047,'graphite')
   self.text(label,xx-.042,front-.002,z+.196,.008,'paper',True)
   self.text(detail,xx-.042,front-.002,z+.180,.0064,'muted',True)
   if j<2:self.line([(xx+.05,front,z+.190),(xx+.077,front,z+.190)],'muted',.0006)
  self.text('EVIDENCIA RELACIONADA',left,front,z+.139,.008,'muted',True)
  for k,label in enumerate(['Sintoma reproducido','Puerto y latiguillo identificados','Prueba posterior registrada']):
   self.box(left+.004,front,z+.113-k*.024,.005,.001,.005,'muted')
   self.text(label,left+.016,front,z+.112-k*.024,.008,'paper',True)
  for j,heading in enumerate(['SEÑAL','DIAGNOSTICO','VERIFICACION']):
   group='ui-case-'+str(j);self.doors.append(dict(name=group,pivot=(0,0,0),kind='interface'))
   xx=x+.083;zz=z+.235;mat='red' if j==0 else 'signal' if j==2 else 'paper'
   self.box(x+.218,front-.001,z+.063,.246,.001,.275,'black',group)
   self.text(heading,xx+.025,front-.003,z+.314,.012,mat,True,group=group)
   title=['Enlace intermitente','Acotar la causa','Servicio recuperado'][j]
   self.text(title,xx+.025,front-.003,z+.285,.010,'paper',True,group=group)
   for k,label in enumerate([['Impacto en un puesto','Registrar el contexto','Asignar responsable'],['Comprobar enlace','Revisar terminacion','Validar la intervencion'],['Prueba posterior','Confirmacion de uso','Historial actualizado']][j]):
    self.box(xx+.028,front-.003,zz-k*.034,.004,.001,.004,mat,group)
    self.text(label,xx+.042,front-.003,zz-k*.034,.008,'muted',True,group=group)
   # Small measured trace: the break is present only in the observed symptom.
   for k in range(24):
    a=xx+.025+k*.0072;b=a+.0055
    if j==0 and 9<k<14:continue
    self.line([(a,front-.003,z+.105),(b,front-.003,z+.105)],mat,.0007,group=group)
   self.text(['REVISAR','INTERVENIR','CONFIRMADO'][j],xx+.025,front-.003,z+.081,.007,mat,True,group=group)
  self.text('CONTEXTO  /  ACCION  /  RESULTADO',left,front,z+.025,.009,'muted',True)
 def tester(self,x,y,z):
  self.parts.append('cable-diagnosis-instrument-and-identified-link')
  # Shaped protective shell, recessed screen, socket, membrane keys and fasteners.
  outline=[];w,d,r=.10,.19,.013
  for cx,cy,a in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
   for j in range(17):
    q=math.radians(a+j*90/16);outline.append((x+cx+r*math.cos(q),y+cy+r*math.sin(q)))
  vv=[(xx,yy,zz) for zz in [z,z+.036] for xx,yy in outline];n=len(outline)
  self.mesh(vv,[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)],'graphite');self.meshes[-1]['smooth_side']=True
  self.box(x,y+.023,z+.036,.083,.10,.002,'black');self.box(x,y+.023,z+.039,.073,.089,.001,'screen')
  self.text('ENLACE / 12',x-.032,y+.055,z+.041,.0065,'paper')
  for k,label in enumerate(['ORIGEN  >  EXTREMO','PARES / CONTINUIDAD','PRUEBA REGISTRADA']):self.text(label,x-.032,y+.029-k*.017,z+.041,.0038,'signal' if k==2 else 'muted')
  for j in range(8):
   xx=x-.029+j*.0082
   self.line([(xx,y-.008,z+.042),(xx,y-.016,z+.042)],'signal',.0004)
  for j in range(3):
   self.box(x-.022+j*.022,y-.050,z+.038,.016,.015,.002,'red' if j==1 else 'edge')
  for dx in [-.037,.037]:
   for dy in [-.078,.078]:self.screw(x+dx,y+dy,z+.039,False)
  for j in range(9):
   for side in [-1,1]:self.box(x+side*.049,y-.051+j*.012,z+.011,.003,.004,.013,'black')
  self.box(x,y+d/2,z+.010,.020,.010,.016,'edge')
  self.box(x,y+d/2+.006,z+.012,.013,.001,.010,'black')
  for k in range(8):self.box(x-.0042+k*.0012,y+d/2+.0068,z+.014,.00045,.0005,.005,'copper')
  self.text('DIAGNOSTICO',x-.034,y-.077,z+.038,.0048,'muted')
 def notebook(self,x,y,z):
  self.parts.append('intervention-and-history-notebook')
  self.box(x,y,z,.31,.22,.010,'edge');self.box(x,y-.034,z+.011,.115,.066,.001,'muted')
  for row in range(4):
   for col in range(14):self.box(x-.139+col*.021,y+.007+row*.020,z+.012,.017,.015,.002,'graphite')
  self.box(x,y+.101,z+.014,.31,.009,.197,'graphite');self.box(x,y+.095,z+.027,.290,.001,.170,'screen')
  self.text('INTERVENCION',x-.134,y+.093,z+.171,.012,'paper',True)
  for j,label in enumerate(['Caso vinculado','Puerto identificado','Cambio documentado','Verificacion pendiente']):self.text(label,x-.131,y+.093,z+.139-j*.022,.007,'muted',True)
  self.box(x+.096,y+.092,z+.042,.026,.001,.007,'red')

def build():
 s=Support();s.box(0,.10,0,3.7,2.5,.065,'concrete');s.box(0,.10,.065,3.68,2.48,.010,'flooring')
 # One workbench: remote evidence and field diagnosis belong to the same case.
 s.box(0,.30,.744,2.60,1.12,.028,'wood')
 for x in [-1.17,1.17]:
  for y in [-.18,.78]:s.box(x,y,.078,.035,.035,.666,'edge')
 s.box(0,.72,.65,2.31,.06,.028,'edge')
 s.ui(-.55,.52,.99)
 s.box(-.55,.08,.776,.39,.13,.007,'graphite')
 for row in range(4):
  for col in range(16):s.box(-.733+col*.024,.032+row*.029,.784,.019,.021,.0015,'edge')
 s.cylinder(-.26,.09,.779,.022,.013,'graphite')
 s.notebook(.64,.13,.777)
 s.device(.68,.64,.788,'SWITCH')
 s.tester(.14,.03,.780)
 # Dedicated strain relief and a fine patch lead joining the diagnostic instrument.
 pts=s.rounded_path([(.14,.129,.804),(.14,.220,.804),(.205,.280,.804),(.528,.280,.804),(.660,.282,.807),(.660,.475,.807)],.035)
 s.line(pts,'muted',.0027);s.routes.append(dict(pts=pts,start=.36,end=.72))
 s.box(.660,.474,.800,.010,.017,.011,'edge')
 for j in range(7):s.box(.660,.452+j*.003,.799,.012,.001,.013,'muted')
 # A service record is physically present as an annotated asset card on the bench.
 s.box(-.06,-.108,.774,.092,.056,.0006,'paper')
 s.text('SW / PUERTO 12',-.098,-.101,.775,.006,'ink')
 for j in range(13):s.box(-.096+j*.0055,-.125,.775,.0015,.010,.0003,'ink')
 s.seat(-.61,-.66,front=-1)
 s.cylinder(-.61,-.66,.16,.021,.30,'edge')
 for j in range(5):
  a=j*math.tau/5;xx=-.61+.27*math.cos(a);yy=-.66+.27*math.sin(a)
  s.line([(-.61,-.66,.17),(xx,yy,.12)],'edge',.012);s.cylinder(xx,yy,.078,.025,.04,'graphite')
 return s

def camera(t):
 keys=[(0,5.75,-64,(0,.14,.81),12,8),(.13,5.50,-61,(0,.19,.83),12,8),
       (.31,1.29,-87,(-.55,.51,1.23),4,1.1),(.40,1.25,-87,(-.55,.51,1.23),4,1.1),
       (.60,.51,-72,(.145,.065,.81),2,2.6),(.70,1.25,-68,(.42,.38,.865),4,3.1),
       (.84,1.29,-87,(-.55,.51,1.23),4,1.1),(1,5.75,-64,(0,.14,.81),12,8)]
 if t<=0 or t>=1:k=keys[0];return k[1],math.radians(k[2]),k[3],k[4],k[5]
 a,b=next((a,b) for a,b in zip(keys,keys[1:]) if a[0]<=t<=b[0]);q=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
 return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3])),mix(a[4],b[4]),mix(a[5],b[5])

def animate(t,parents):
 state=0 if t<.33 or t>.94 else 1 if t<.74 else 2
 for j in range(3):
  for child in parents['ui-case-'+str(j)].children:child.hide_render=j!=state
 parents['switch-cover'].location.z=.10*smooth((t-.46)/.08)*(1-smooth((t-.73)/.075))

def describe(s):
 assert camera(0)==camera(1) and len(s.doors)==4
 assert len(set(s.parts))==3
 assert all(min(b[k] for k in ['w','d','h'])>0 for b in s.boxes)
 return dict(service='105',scene='support-project-v2',boxes=len(s.boxes),meshes=len(s.meshes),parts=s.parts,frames=1440,fps=60,duration=24)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
 p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','workbench','baked'],default='baked')
 p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);args.proof_frames=None
 assert 0<=args.start<=args.end<1440 and args.width in [1920,3840] and 16<=args.samples<=128
 s=build();info=describe(s)
 if args.validate_only:print(json.dumps(info))
 else:studio.render(args,s,dict(source=__file__,sources=[str(Path(__file__).with_name('render-network-project-v2.py')),__file__],describe=describe,camera=camera,animate=animate,bake_frame=910,
  brand_font=True,text_depth=0,smooth_bake=True,packet_radius=.006,description='one illustrative support case: observed symptom, equipment diagnosis and recorded verification; continuous 24 second loop',
  lights=[('Bench inspection',(.2,-.8,2.5),45,1.8,(1,1,1),(.3,.3,.8))]))
