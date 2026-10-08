"""A continuous journey from the workplace to its network and radio hardware.
Dimensions are in metres. Representative equipment, not a vendor construction plan.
The native 4K/60 renderer runs on disposable CI only.
"""
import argparse,importlib.util,json,math,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('technical_studio',Path(__file__).with_name('render-fire-project-v2.py'))
studio=importlib.util.module_from_spec(spec);spec.loader.exec_module(studio)
smooth=studio.smooth

class Network(studio.Installation):
 def __init__(self):super().__init__();self.code='101'
 def cylinder(self,*args,**kwargs):
  super().cylinder(*args,**kwargs);self.cylinders[-1]['segments']=128 if self.cylinders[-1]['r']>=.025 else 32
 def route(self,pts,start=0,end=1):
  pts=self.rounded_path(pts);self.line(pts,'red',.0028);self.routes.append(dict(pts=pts,start=start,end=end))
 def port(self,x,y,z,label):
  self.box(x,y,z,.0148,.006,.0132,'edge')
  self.box(x,y-.0035,z+.002,.012,.001,.009,'black')
  self.box(x,y-.004,z+.009,.004,.001,.003,'black')
  for k in range(8):self.box(x-.0042+k*.0012,y-.0041,z+.003,.00045,.0005,.004,'copper')
  self.text(str(label).zfill(2),x-.005,y-.0048,z+.019,.0045,'paper',True)
 def pcb(self,x,y,z):
  self.box(x,y,z,.406,.213,.0016,'pcb')
  for xx,yy,w,d in [(x-.045,y,.031,.031),(x+.08,y+.027,.026,.039),(x-.145,y+.026,.022,.022)]:
   self.box(xx,yy,z+.002,w,d,.003,'ink')
   for j in range(12):
    for side in [-1,1]:
     self.box(xx-w*.44+j*w*.88/11,yy+side*(d/2+.001),z+.002,.0007,.0025,.001,'edge')
     self.box(xx+side*(w/2+.001),yy-d*.44+j*d*.88/11,z+.002,.0025,.0007,.001,'edge')
   self.cylinder(xx-w*.3,yy-d*.3,z+.005,.001,.0004,'muted')
  for row in range(5):
   for col in range(18):
    xx=x-.188+col*.021;yy=y-.089+row*.041
    if abs(xx-(x-.045))<.035 and abs(yy-y)<.033:continue
    self.box(xx,yy,z+.002,.006,.003,.0015,'ink')
    for dx in [-.0035,.0035]:self.box(xx+dx,yy,z+.002,.001,.003,.0015,'edge')
  for j in range(20):
   xx=x-.185+j*.018
   self.line([(xx,y-.093,z+.0019),(xx,y-.053+j*.001,z+.0019),(x-.062+j*.0016,y-.053+j*.001,z+.0019),(x-.062+j*.0016,y-.02,z+.0019)],'copper',.00020)
  for xx in [x-.184,x+.184]:
   for yy in [y-.088,y+.088]:self.screw(xx,yy,z+.006,False)
 def device(self,x,y,z,kind):
  w=.4826;h=.04445;d=.30;front=y-d/2-.003
  self.box(x,y,z,w-.03,d,.0015,'graphite')
  for side in [-1,1]:self.box(x+side*(w/2-.016),y,z,.0015,d,h,'graphite')
  self.box(x,y+d/2,z,w-.03,.0015,h,'graphite')
  self.box(x,front,z,w,.002,h,'graphite')
  for dx in [-.234,.234]:
   for zz in [z+.009,z+.035]:self.screw(x+dx,front-.002,zz)
  if kind in ['PATCH','SWITCH']:
   for j in range(24):
    xx=x-.204+j*.0168;self.port(xx,front-.003,z+.009,j+1)
    if kind=='SWITCH':self.box(xx+.005,front-.008,z+.033,.0018,.001,.0012,'signal')
  else:
   for j in range(12):
    xx=x-.193+j*.032
    self.box(xx,front-.003,z+.010,.022,.005,.012,'edge')
    for side in [-1,1]:self.box(xx+side*.0058,front-.006,z+.012,.006,.002,.008,'blue')
    self.text(str(j+1).zfill(2),xx-.005,front-.007,z+.027,.0046,'paper',True)
  self.text(kind+' / 01',x-.195,y+.122,z+h+.002,.008,'muted',group='switch-cover' if kind=='SWITCH' else None)
  if kind=='SWITCH':
   self.pcb(x,y,z+.014)
   for j in range(24):self.box(x-.20+j*.017,y-.118,z+.004,.014,.022,.019,'black')
   name='switch-cover';self.doors.append(dict(name=name,pivot=(0,0,0),kind='lift'))
   self.box(x,y,z+h,w-.03,d,.0015,'graphite',name)
   for j in range(30):self.box(x-.177+j*.012,y+.055,z+h+.0016,.003,.091,.0007,'black',name)
  else:self.box(x,y,z+h,w-.03,d,.0015,'graphite')
 def rack(self,x,y,z):
  self.parts.append('19-inch-cabinet')
  w,d,h=.60,.72,1.40;front=y-d/2
  for zz in [z+.045,z+h-.025]:self.box(x,y,zz,w,d,.018,'graphite')
  self.box(x,y+d/2,z+.062,w,.0018,h-.087,'graphite')
  self.box(x+w/2,y,z+.062,.002,d,h-.087,'graphite')
  for dx in [-.272,.272]:
   for yy in [y-.322,y+.322]:self.box(x+dx,yy,z+.062,.015,.015,h-.087,'edge')
  for dx in [-.229,.229]:
   self.box(x+dx,front+.036,z+.089,.015,.004,1.245,'edge')
   for u in range(27):
    for offset in [.006,.022,.037]:self.box(x+dx,front+.033,z+.089+u*.04445+offset,.007,.001,.007,'black')
  for dx in [-.265,.265]:
   for yy in [y-.3,y+.3]:self.cylinder(x+dx,yy,z,.018,.045,'edge')
  # Protected power, distribution, active switching and labelled terminations.
  self.box(x,y-.01,z+.17,.445,.49,.131,'graphite')
  for k in range(27):self.box(x-.198+k*.015,front+.099,z+.193,.003,.001,.058,'black')
  self.box(x+.120,front+.096,z+.263,.055,.002,.018,'screen')
  self.text('UPS',x+.103,front+.094,z+.268,.009,'muted',True)
  self.device(x,y-.16,z+.88,'SWITCH');self.device(x,y-.16,z+1.06,'PATCH');self.device(x,y-.16,z+1.19,'FIBRA')
  for j in range(12):
   xx=x-.20+j*.0336
   pts=[(xx,y-.318,z+1.075),(xx,y-.358,z+1.075),(xx+.011,y-.378,z+.948),(xx+.011,y-.354,z+.895),(xx,y-.318,z+.895)]
   self.line(self.rounded_path(pts,.015),'red' if j in [1,7] else 'muted',.0028)
  for zz in [z+.995,z+.355]:
   self.box(x,front+.08,zz,.42,.041,.013,'graphite')
   for j in range(14):self.box(x-.197+j*.030,front+.055,zz,.004,.028,.025,'edge')
  # Door is an actual framed, perforated leaf, with visible rails behind it.
  name='rack-door';self.doors.append(dict(name=name,pivot=(x-w/2,front-.016,z+.055),kind='door'))
  for dx in [.012,w-.012]:self.box(dx,0,0,.018,.016,h-.075,'graphite',name)
  for zz in [.009,h-.093]:self.box(w/2,0,zz,w,.016,.018,'graphite',name)
  for j in range(76):self.box(.026+j*(w-.052)/75,0,.024,.0009,.001,h-.120,'edge',name)
  for k in range(110):self.box(w/2,0,.03+k*(h-.125)/109,w-.04,.001,.0007,'edge',name)
  self.box(w-.036,-.013,.60,.011,.019,.076,'edge',name)
  self.box(w/2,-.012,h-.116,.28,.002,.031,'graphite',name)
  self.text('UM / DISTRIBUCION',.19,-.014,h-.106,.011,'paper',True,group=name)
 def access_point(self,x,y,z):
  self.parts.append('mounted-radio-access-point')
  # Circular radio board and stamped mounting bracket, inspected from below.
  self.box(x,y,z+.022,.25,.25,.003,'paper')
  self.cylinder(x,y,z+.009,.085,.007,'edge')
  for j in range(3):
   a=j*math.tau/3;xx=x+.066*math.cos(a);yy=y+.066*math.sin(a)
   self.box(xx,yy,z+.015,.018,.022,.006,'edge');self.screw(xx,yy,z+.024,False)
  self.cylinder(x,y,z-.014,.081,.0016,'pcb')
  # Two RF shields with return folds, soldered perimeter and service markings.
  for xx,yy,w,d in [(x-.039,y+.019,.033,.031),(x+.038,y+.027,.031,.025)]:
   self.box(xx,yy,z-.026,w,d,.001,'edge')
   for dx in [-w/2,w/2]:self.box(xx+dx,yy,z-.025,.001,d,.010,'edge')
   for dy in [-d/2,d/2]:self.box(xx,yy+dy,z-.025,w,.001,.010,'edge')
   for j in range(9):
    self.line([(xx-w*.38+j*w*.095,yy-d*.28,z-.027),(xx-w*.38+j*w*.095,yy+d*.28,z-.027)],'muted',.00024)
  for xx,yy,w in [(x-.006,y-.013,.024),(x+.033,y-.022,.016),(x-.035,y-.027,.012)]:
   self.box(xx,yy,z-.024,w,w,.004,'ink')
   for j in range(12):
    for side in [-1,1]:
     self.box(xx-w*.43+j*w*.86/11,yy+side*(w/2+.001),z-.022,.00065,.0028,.001,'edge')
     self.box(xx+side*(w/2+.001),yy-w*.43+j*w*.86/11,z-.022,.0028,.00065,.001,'edge')
   self.cylinder(xx-w*.30,yy-w*.30,z-.0243,.0008,.0002,'muted')
  # Matching networks, decoupling components and controlled radio traces.
  for row in range(7):
   for col in range(13):
    dx=-.060+col*.010;dy=-.061+row*.018
    if dx*dx+dy*dy>.075**2 or (abs(dx)<.023 and abs(dy+.013)<.027):continue
    if (abs(dx+.039)<.022 and abs(dy-.019)<.020) or (abs(dx-.038)<.02 and abs(dy-.027)<.019):continue
    self.box(x+dx,y+dy,z-.017,.003,.0015,.0015,'ink')
    for side in [-1,1]:self.box(x+dx+side*.0018,y+dy,z-.017,.00065,.0015,.0015,'copper')
  for j in range(16):
   dx=-.051+j*.0068
   self.line([(x+dx,y-.055,z-.0148),(x+dx,y-.037+j*.0005,z-.0148),(x-.015+j*.0017,y-.037+j*.0005,z-.0148),(x-.015+j*.0017,y-.027,z-.0148)],'copper',.00022)
  # Four printed antenna meanders follow the board perimeter.
  for j in range(4):
   a=j*math.pi/2+.25;pts=[]
   for k in range(12):
    q=a+k*.042;r=.072 if k%4<2 else .066
    pts.append((x+r*math.cos(q),y+r*math.sin(q),z-.0149))
   self.line(pts,'copper',.0008)
  for j in range(28):
   a=j*math.tau/28
   self.cylinder(x+.078*math.cos(a),y+.078*math.sin(a),z-.015,.00085,.0003,'copper')
  self.box(x,y+.054,z-.033,.017,.022,.018,'edge')
  self.box(x,y+.066,z-.031,.012,.001,.009,'black')
  for k in range(8):self.box(x-.0042+k*.0012,y+.067,z-.029,.00045,.001,.004,'copper')
  self.parts.append('radio-board-and-antenna-traces')
  name='ap-radome';self.doors.append(dict(name=name,pivot=(0,0,0),kind='lift'))
  self.cylinder(x,y,z-.067,.091,.029,'paper',top=.095,group=name)
  self.cylinder(x,y,z-.038,.095,.012,'paper',group=name)
  for j in range(48):
   a=j*math.tau/48
   self.line([(x+.094*math.cos(a),y+.094*math.sin(a),z-.048),(x+.094*math.cos(a),y+.094*math.sin(a),z-.036)],'ink',.00065,group=name)
  self.box(x,y-.045,z-.068,.030,.001,.001,'signal',name)

def build():
    s=Network()
    # 8.0 x 5.4 m representative workplace, on a thin architectural section.
    s.box(0,0,0,8,5.4,.09,'concrete')
    s.box(0,0,.09,7.98,5.38,.016,'flooring')
    for x in range(-7,8):s.line([(x*.5,-2.69,.107),(x*.5,2.69,.107)],'joint',.001)
    for y in range(-5,6):s.line([(-3.99,y*.5,.107),(3.99,y*.5,.107)],'joint',.001)
    # Rear facade: real window reveals, slender frames, sill and wall thickness.
    s.box(0,2.64,.107,8,.12,.82,'paper');s.box(0,2.64,2.56,8,.12,.24,'paper')
    for x in [-3.95,-.6,1.76,3.95]:s.box(x,2.64,.927,.10,.12,1.633,'paper')
    for a,b in [(-3.90,-.65),(-.55,1.71),(1.81,3.90)]:
        mid=(a+b)/2
        for x in [a,b,mid]:s.box(x,2.615,.95,.023,.03,1.59,'edge')
        for z in [.947,1.72,2.54]:s.box(mid,2.615,z,b-a,.03,.022,'edge')
        s.box(mid,2.62,.905,b-a+.05,.23,.022,'paper')
        s.box(mid,2.665,.97,b-a-.025,.008,1.55,'glass')
    # Partition has a doorway. Low cut edge exposes the occupation of the room.
    for y,d in [(-1.6,1.9),(1.74,1.78)]:s.box(.75,y,.107,.12,d,1.14,'paper')
    for y in [-.64,.82]:s.box(.75,y,.107,.13,.035,2.16,'edge')
    s.box(.75,.09,2.267,.13,1.5,.035,'edge')
    for x in [-3.95,3.95]:s.box(x,0,.107,.10,5.3,.32,'paper')
    # Workstations and a meeting area; each object uses metre-scale dimensions.
    s.desk(-2.65,1.65);s.desk(-1.05,1.65)
    s.box(2.33,-.60,.74,1.65,.86,.026,'wood')
    for x in [1.64,3.02]:
        for y in [-.90,-.31]:s.box(x,y,.107,.034,.034,.633,'edge')
    for x in [1.91,2.76]:
        for y in [-1.22,.04]:
            s.seat(x,y,front=-1 if y>-.6 else 1)
            for dx in [-.17,.17]:
                for dy in [-.16,.16]:s.box(x+dx,y+dy,.107,.022,.022,.363,'edge')
    s.rack(2.65,1.85,.107)
    s.access_point(-2.05,.35,2.8)
    # Slender cable tray, hangers, workstation outlets and a continuous backbone.
    for x in [-2.9,-1.4,.1,1.6,2.7]:
        s.box(x,2.43,2.755,.02,.24,.018,'edge')
        for y in [2.33,2.53]:s.line([(x,y,2.77),(x,y,3.03)],'edge',.002)
    for y in [2.32,2.54]:s.box(-.1,y,2.745,5.8,.009,.029,'edge')
    for x in [-2.65,-1.05]:
        s.box(x,2.571,.39,.082,.006,.082,'paper')
        for dx in [-.021,.021]:s.port(x+dx,2.566,.415,1 if dx<0 else 2)
        s.route([(2.65,1.7,1.25),(2.65,2.43,1.25),(2.65,2.43,2.77),(x,2.43,2.77),(x,2.56,2.77),(x,2.56,.45)],.1,.9)
        s.line(s.rounded_path([(x,2.56,.415),(x,2.32,.30),(x,2.05,.40),(x,1.86,.92)],.08),'muted',.0028)
    s.route([(2.66,1.7,1.01),(2.66,2.43,1.01),(2.66,2.43,2.78),(-2.05,2.43,2.78),(-2.05,.52,2.78),(-2.05,.417,2.78)],.30,.88)
    s.parts.extend(['24-port-patch-panel','24-port-managed-switch','optical-distribution','structured-cabling','labelled-outlets','protected-power'])
    return s

def camera(t):
    keys=[(0,14.7,-66,(0,.15,1.1),24,22),(.14,13.8,-63,(.1,.4,1.2),24,22),
          (.31,2.4,-73,(2.6,1.8,.87),8,5),(.45,1.12,-72,(2.61,1.65,1.10),5,3.6),
          (.57,5.2,-72,(.3,1.55,2.30),12,7),(.71,.78,-73,(-2.05,.35,2.725),4,-1.7),
          (.79,.84,-68,(-2.05,.35,2.725),4,-1.4),(1,14.7,-66,(0,.15,1.1),24,22)]
    if t<=0 or t>=1:k=keys[0];return k[1],math.radians(k[2]),k[3],k[4],k[5]
    a,b=next((a,b) for a,b in zip(keys,keys[1:]) if a[0]<=t<=b[0])
    q=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
    return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3])),mix(a[4],b[4]),mix(a[5],b[5])

def animate(t,parents):
    parents['rack-door'].rotation_euler[2]=-math.radians(100)*smooth((t-.17)/.13)*(1-smooth((t-.83)/.14))
    parents['switch-cover'].location.z=.105*smooth((t-.32)/.075)*(1-smooth((t-.46)/.08))
    parents['ap-radome'].location.z=-.095*smooth((t-.61)/.06)*(1-smooth((t-.79)/.085))

def describe(s):
    assert camera(0)==camera(1)
    assert len(s.boxes)>1000 and len(s.parts)>=9
    assert len({d['name'] for d in s.doors})==len(s.doors)==3
    assert all(min(b[k] for k in ['w','d','h'])>0 for b in s.boxes)
    assert all(math.dist(a,b)>0 for r in s.routes for a,b in zip(r['pts'],r['pts'][1:]))
    return dict(service='101',scene='network-project-v2',boxes=len(s.boxes),meshes=len(s.meshes),parts=s.parts,frames=1440,fps=60,duration=24)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
    p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','workbench','baked'],default='baked')
    p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);args.proof_frames=None
    assert 0<=args.start<=args.end<1440 and args.width in [1920,3840] and 16<=args.samples<=128
    s=build();info=describe(s)
    if args.validate_only:print(json.dumps(info))
    else:studio.render(args,s,dict(source=__file__,describe=describe,camera=camera,animate=animate,bake_frame=610,
        packet_radius=.010,description='workplace, distribution cabinet, patching and switching, radio access; continuous 24 second loop',
        lights=[('Cabinet inspection',(2.3,.4,1.8),28,1.1,(1,1,1),(2.65,1.7,.9)),('Radio inspection',(-2.05,-.5,2.1),16,.8,(1,1,1),(-2.05,.35,2.75))]))
