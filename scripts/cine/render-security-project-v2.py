"""Electronic security: an entrance, identifiable capture, recording and supervision.
Measured illustrative equipment, not a product replica or installation design.
Render on disposable CI only. All moving parts share the continuous story clock.
"""
import argparse,importlib.util,json,math,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('network_equipment',Path(__file__).with_name('render-network-project-v2.py'))
network=importlib.util.module_from_spec(spec);spec.loader.exec_module(network)
studio=network.studio;smooth=studio.smooth

class Security(network.Network):
 def __init__(self):super().__init__();self.code='102'
 def bullet_camera(self,x,y,z):
  self.parts.append('camera-optics-sensor-and-mount')
  self.box(x,y+.155,z-.040,.095,.010,.12,'paper')
  for dx in [-.036,.036]:
   for dz in [-.028,.068]:self.screw(x+dx,y+.148,z+dz)
  self.cylinder(x,y+.145,z+.015,.028,.013,'edge','y')
  self.line([(x,y+.13,z+.015),(x,y+.10,z+.015),(x,y+.055,z+.045)],'edge',.012)
  # Lens axis points into the occupied entrance. Nested shells show a real lens.
  self.cylinder(x,y+.045,z+.045,.043,.158,'paper','y')
  self.cylinder(x,y-.111,z+.045,.038,.010,'graphite','y')
  self.box(x,y-.022,z+.089,.090,.182,.002,'paper')
  for dx in [-.041,.041]:self.box(x+dx,y-.022,z+.072,.002,.182,.017,'paper')
  self.cylinder(x,y-.123,z+.045,.028,.0016,'pcb','y')
  self.box(x,y-.125,z+.037,.019,.002,.016,'edge')
  self.box(x,y-.127,z+.039,.013,.001,.012,'lens')
  for j in range(16):
   a=j*math.tau/16;xx=x+.023*math.cos(a);zz=z+.045+.023*math.sin(a)
   self.box(xx,y-.126,zz,.003,.001,.002,'ink')
   for dx in [-.002,.002]:self.box(xx+dx,y-.126,zz,.0006,.001,.002,'copper')
  group='optical-head';self.doors.append(dict(name=group,pivot=(0,0,0),kind='slide'))
  for dy,r,h,mat in [(-.130,.036,.009,'graphite'),(-.139,.034,.012,'paper'),(-.151,.029,.006,'black'),(-.158,.022,.009,'graphite'),(-.168,.016,.004,'lens')]:
   self.cylinder(x,y+dy,z+.045,r,h,mat,'y',group=group)
  self.cylinder(x,y-.1725,z+.045,.014,.0008,'black','y',group=group)
  self.cylinder(x-.005,y-.1735,z+.050,.003,.0004,'muted','y',group=group)
  for j in range(12):
   a=j*math.tau/12
   self.cylinder(x+.027*math.cos(a),y-.157,z+.045+.027*math.sin(a),.0021,.002,'black','y',group=group)
  for dx in [-.029,.029]:
   self.cylinder(x+dx,y-.146,z+.045,.002,.002,'edge','y',group=group)
  self.cylinder(x+.10,y+.163,z-.10,.005,.020,'graphite','y')
  self.line(self.rounded_path([(x,y+.19,z+.01),(x,y+.20,z-.06),(x+.08,y+.2,z-.10),(x+.10,y+.155,z-.10)]),'muted',.003)
 def recorder(self,x,y,z):
  self.parts.append('recorder-storage-and-controller')
  w,d,h=.4826,.38,.0889
  self.box(x,y,z,w,d,.0015,'graphite')
  for dx in [-w/2,w/2]:self.box(x+dx,y,z,.0015,d,h,'graphite')
  for yy in [y-d/2,y+d/2]:self.box(x,yy,z,w,.0015,h,'graphite')
  for j in range(4):
   xx=x-.181+j*.120
   self.box(xx,y-d/2-.002,z+.015,.110,.005,.054,'black')
   self.box(xx,y-d/2-.006,z+.023,.076,.002,.008,'edge')
   self.box(xx+.037,y-d/2-.007,z+.060,.002,.002,.003,'signal')
   for k in range(11):self.box(xx-.047+k*.009,y-d/2-.006,z+.040,.004,.001,.017,'graphite')
   self.text(str(j+1).zfill(2),xx-.044,y-d/2-.008,z+.064,.005,'muted',True)
   # Four measured disk cartridges with screws, labels and a SATA connection.
   self.box(xx,y-.08,z+.013,.1016,.147,.023,'edge')
   self.box(xx,y-.08,z+.036,.094,.137,.001,'paper')
   self.box(xx,y-.058,z+.0375,.065,.052,.0005,'paper')
   for k in range(11):self.box(xx-.026+k*.0047,y-.055,z+.038,.0017,.020,.0003,'ink')
   self.text('VIDEO / '+str(j+1),xx-.03,y-.095,z+.038,.005,'ink')
   for dx in [-.043,.043]:
    for yy in [y-.137,y-.024]:self.screw(xx+dx,yy,z+.040,False)
   self.box(xx,y+.007,z+.015,.035,.009,.009,'black')
   for k in range(7):self.box(xx-.012+k*.004,y+.013,z+.016,.001,.008,.001,'copper')
   self.line(self.rounded_path([(xx,y+.010,z+.024),(xx,y+.040,z+.045),(xx,y+.07,z+.045),(x+.11,y+.1,z+.022)],.02),'muted',.0012)
  # Controller behind the drive bank, heat sink, PoE network and status connection.
  self.box(x,y+.10,z+.014,.406,.132,.0016,'pcb')
  for j in range(3):
   xx=x-.135+j*.125
   self.box(xx,y+.11,z+.016,.031,.031,.003,'ink')
   for k in range(12):
    for side in [-1,1]:self.box(xx-.014+k*.0025,y+.11+side*.017,z+.016,.0007,.003,.001,'edge')
  for j in range(10):self.box(x-.03+j*.006,y+.11,z+.019,.002,.040,.017,'edge')
  for row in range(3):
   for col in range(16):
    xx=x-.187+col*.024;yy=y+.056+row*.042
    self.box(xx,yy,z+.017,.004,.002,.002,'ink')
    self.box(xx-.003,yy,z+.017,.001,.002,.002,'copper');self.box(xx+.003,yy,z+.017,.001,.002,.002,'copper')
  group='recorder-cover';self.doors.append(dict(name=group,pivot=(0,0,0),kind='lift'))
  self.box(x,y,z+h,w,d,.0015,'graphite',group)
  for j in range(36):self.box(x-.214+j*.012,y+.11,z+h+.0017,.003,.10,.0006,'black',group)
  self.text('REGISTRO / NVR',x-.16,y-.10,z+h+.002,.010,'muted',group=group)
 def console(self,x,y,z):
  self.parts.append('contextual-event-console')
  w,h=.64,.36
  self.box(x,y,z,w,.027,h,'graphite');self.box(x,y-.014,z+.012,w-.022,.002,h-.024,'screen')
  self.box(x,y+.006,z-.15,.028,.025,.15,'edge');self.box(x,y-.01,z-.164,.22,.16,.010,'edge')
  self.text('OPERACION / ACCESOS',x-w/2+.026,y-.017,z+h-.041,.016,'paper',True)
  self.text('A01  /  VESTIBULO',x-w/2+.026,y-.017,z+h-.068,.010,'muted',True)
  # An actual floor plan and event log replace the generic doorway thumbnail.
  # Its fine partition, open leaf, sensor and field of view retain the site context.
  left=x-.284;bottom=z+.100;yy=y-.019
  self.text('PLANO / VESTIBULO',left,yy,z+.270,.008,'muted',True)
  self.box(x-.120,yy,z+.101,.320,.001,.160,'black')
  for a,b in [((left+.017,bottom+.019),(left+.277,bottom+.019)),((left+.017,bottom+.019),(left+.017,bottom+.129)),((left+.017,bottom+.129),(left+.061,bottom+.129)),((left+.123,bottom+.129),(left+.277,bottom+.129)),((left+.277,bottom+.129),(left+.277,bottom+.019))]:
   self.line([(a[0],yy-.001,a[1]),(b[0],yy-.001,b[1])],'edge',.0006)
  self.line([(left+.061,yy-.002,bottom+.129),(left+.089,yy-.002,bottom+.083)],'paper',.0007)
  self.line([(left+.061+.054*math.sin(j*math.pi/24),yy-.002,bottom+.129-.054*math.cos(j*math.pi/24)) for j in range(13)],'muted',.00035)
  # Camera and reader are distinct, with the observed approach visible on the plan.
  self.box(left+.124,yy-.003,bottom+.121,.005,.001,.004,'red')
  for a in [-.048,.018]:self.line([(left+.124,yy-.003,bottom+.121),(left+.124+a,yy-.003,bottom+.056)],'muted',.00035)
  self.box(left+.131,yy-.003,bottom+.127,.003,.001,.005,'signal')
  self.text('A01',left+.056,yy-.003,bottom+.138,.007,'paper',True)
  self.text('C01',left+.134,yy-.003,bottom+.105,.006,'muted',True)
  self.box(left+.218,yy-.003,bottom+.062,.042,.001,.023,'muted')
  for j in range(4):self.line([(left+.197+j*.013,yy-.004,bottom+.049),(left+.202+j*.013,yy-.004,bottom+.049)],'edge',.00035)
  self.text('Recepcion',left+.188,yy-.003,bottom+.035,.006,'muted',True)
  self.text('EVENTOS RELACIONADOS',x+.07,yy,z+.270,.007,'muted',True)
  for k,(label,detail,time) in enumerate([('C01 / Imagen','Captura disponible','10:42:06'),('NVR / Registro','Secuencia conservada','10:42:07'),('A01 / Acceso','Permiso verificado','10:42:08')]):
   zz=z+.239-k*.057
   self.box(x+.073,yy-.001,zz,.003,.001,.003,'signal')
   self.text(label,x+.084,yy-.001,zz-.001,.008,'paper',True)
   self.text(detail,x+.084,yy-.001,zz-.015,.006,'muted',True)
   self.text(time,x+.084,yy-.001,zz-.027,.0055,'muted',True)
   self.line([(x+.07,yy-.001,zz-.036),(x+.274,yy-.001,zz-.036)],'trace',.00035)
  self.box(x,y-.018,z+.061,.57,.001,.001,'trace')
  for j in range(60):self.box(x-.282+j*.0095,y-.019,z+.042,.001,.001,.009 if j%5 else .015,'muted')
  self.box(x-.061,y-.020,z+.041,.003,.001,.022,'red')
  self.text('IMAGEN  /  EVENTO  /  RESPUESTA',x-.282,y-.020,z+.020,.0085,'muted',True)

def build():
 s=Security();s.box(0,.35,0,6.6,3.9,.09,'concrete');s.box(0,.35,.09,6.58,3.88,.014,'flooring')
 for x in range(-6,7):s.line([(x*.5,-1.59,.105),(x*.5,2.29,.105)],'joint',.001)
 for y in range(-3,5):s.line([(-3.29,y*.5,.105),(3.29,y*.5,.105)],'joint',.001)
 # Front-open architectural section, with a real entrance and a separate control desk.
 s.box(-2.92,2.235,.105,.74,.12,2.40,'paper')
 s.box(.875,2.235,.105,4.79,.12,.71,'paper');s.box(.875,2.235,2.36,4.79,.12,.145,'paper')
 for left,right in [(-1.51,.055),(.075,1.64),(1.66,3.25)]:
  mid=(left+right)/2;w=right-left
  for xx in [left,right]:s.box(xx,2.20,.815,.024,.064,1.545,'edge')
  for zz in [.815,2.335]:s.box(mid,2.20,zz,w,.064,.024,'edge')
  s.box(mid,2.231,.844,w-.029,.009,1.490,'glass')
  s.box(mid,2.14,.805,w+.028,.19,.024,'paper')
 for x in [-2.535,-1.455]:s.box(x,2.16,.105,.045,.15,2.14,'edge')
 s.box(-1.995,2.16,2.20,1.13,.15,.045,'edge')
 group='entrance-leaf';s.doors.append(dict(name=group,pivot=(-2.50,2.16,.115),kind='door'))
 for dx in [.02,1.00]:s.box(dx,0,0,.038,.045,2.08,'graphite',group)
 for zz in [.018,2.047]:s.box(.51,0,zz,1.02,.045,.034,'graphite',group)
 s.box(.51,0,.051,.936,.008,1.995,'glass',group)
 s.line([(.912,-.048,.78),(.912,-.048,1.14)],'edge',.010,group=group)
 s.box(-1.28,2.161,1.30,.072,.026,.14,'graphite')
 s.box(-1.28,2.146,1.391,.050,.002,.027,'screen');s.box(-1.28,2.144,1.334,.032,.001,.003,'signal')
 for row in range(3):
  for col in range(3):s.box(-1.298+col*.018,2.144,1.351+row*.012,.006,.001,.006,'muted')
 s.text('A01',-1.304,2.144,1.420,.008,'paper',True)
 s.parts.append('controlled-entrance-reader-and-leaf')
 s.bullet_camera(-1.40,1.93,2.49)
 # Worktable, storage and operator display are related spatially, not floating cards.
 s.box(1.80,.60,.738,1.80,.82,.025,'wood')
 for xx in [1.02,2.58]:
  for yy in [.28,.92]:s.box(xx,yy,.105,.034,.034,.633,'edge')
 s.recorder(1.27,.67,.763);s.console(2.26,.82,1.065)
 s.box(2.25,.35,.767,.30,.105,.005,'graphite')
 for row in range(4):
  for col in range(16):s.box(2.109+col*.018,.311+row*.024,.773,.014,.016,.001,'edge')
 s.cylinder(2.49,.34,.771,.018,.014,'graphite')
 s.seat(2.2,-.08,front=-1)
 for dx in [-.17,.17]:
  for dy in [-.16,.16]:s.box(2.2+dx,-.08+dy,.105,.025,.025,.35,'edge')
 s.route([(-1.30,2.085,2.39),(-1.30,2.16,2.39),(-1.4,2.16,2.62),(1.27,2.16,2.62),(1.27,2.16,.83),(1.27,.87,.83)],.16,.72)
 s.route([(-1.28,2.18,1.39),(-1.28,2.18,2.59),(1.31,2.18,2.59),(1.31,2.18,.83),(1.31,.86,.83)],.06,.61)
 s.route([(1.30,.87,.81),(1.30,1.04,.81),(2.26,1.04,.81),(2.26,1.04,1.19),(2.26,.85,1.19)],.58,.9)
 for x in [-1.0,-.15,.7,1.55]:s.box(x,2.14,2.58,.028,.038,.11,'edge')
 s.parts.extend(['separate-access-and-video-signals','connected-recording-and-supervision'])
 return s

def camera(t):
 keys=[(0,12.8,-68,(0,.25,1.12),24,20),(.14,11.8,-64,(-.15,.45,1.18),24,20),
       (.31,.92,-62,(-1.4,1.87,2.53),4,.85),(.45,.76,-58,(-1.4,1.84,2.52),4,.75),
       (.62,1.25,-71,(1.27,.67,.87),5,3.4),(.72,1.21,-70,(1.29,.65,.89),5,3.3),
       (.84,1.18,-87,(2.24,.79,1.22),4,1.0),(1,12.8,-68,(0,.25,1.12),24,20)]
 if t<=0 or t>=1:k=keys[0];return k[1],math.radians(k[2]),k[3],k[4],k[5]
 a,b=next((a,b) for a,b in zip(keys,keys[1:]) if a[0]<=t<=b[0]);q=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
 return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3])),mix(a[4],b[4]),mix(a[5],b[5])

def animate(t,parents):
 parents['entrance-leaf'].rotation_euler[2]=-math.radians(55)*smooth((t-.08)/.12)*(1-smooth((t-.70)/.16))
 parents['optical-head'].location.y=-.09*smooth((t-.27)/.07)*(1-smooth((t-.46)/.075))
 opening=smooth((t-.53)/.075)*(1-smooth((t-.73)/.075))
 parents['recorder-cover'].location.z=.18*opening;parents['recorder-cover'].location.y=.08*opening

def describe(s):
 assert camera(0)==camera(1)
 assert {'controlled-entrance-reader-and-leaf','camera-optics-sensor-and-mount','recorder-storage-and-controller','contextual-event-console'}<=set(s.parts)
 assert len({d['name'] for d in s.doors})==len(s.doors)==3
 assert all(min(b[k] for k in ['w','d','h'])>0 for b in s.boxes)
 assert all(math.dist(a,b)>0 for r in s.routes for a,b in zip(r['pts'],r['pts'][1:]))
 return dict(service='102',scene='security-project-v2',boxes=len(s.boxes),meshes=len(s.meshes),parts=s.parts,frames=1440,fps=60,duration=24)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
 p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','workbench','baked'],default='baked')
 p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);args.proof_frames=None
 assert 0<=args.start<=args.end<1440 and args.width in [1920,3840] and 16<=args.samples<=128
 s=build();info=describe(s)
 if args.validate_only:print(json.dumps(info))
 else:studio.render(args,s,dict(source=__file__,sources=[str(Path(__file__).with_name('render-network-project-v2.py')),__file__],describe=describe,camera=camera,animate=animate,bake_frame=930,
  brand_font=True,smooth_bake=True,packet_radius=.009,description='entrance, camera optics, recording hardware and contextual supervision; continuous 24 second loop',
  lights=[('Lens inspection',(-1.6,.6,3.0),15,.8,(1,1,1),(-1.4,1.8,2.53)),('Recorder inspection',(1.0,-.2,2.4),28,1.3,(1,1,1),(1.27,.67,.84))]))
