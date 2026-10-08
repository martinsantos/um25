"""Power continuity: protection, stored energy and identified critical loads.
Metric illustrative equipment, not a wiring or construction specification.
The native animation is rendered only on disposable remote runners.
"""
import argparse,importlib.util,json,math,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('network_equipment',Path(__file__).with_name('render-network-project-v2.py'))
network=importlib.util.module_from_spec(spec);spec.loader.exec_module(network)
studio=network.studio;smooth=studio.smooth

class Power(network.Network):
 def __init__(self):super().__init__();self.code='108'
 def breaker(self,x,y,z,poles,label):
  pitch=.018;w=poles*pitch
  self.box(x,y,z,w,.071,.082,'paper')
  for k in range(poles):
   xx=x-w/2+pitch*(k+.5)
   self.box(xx,y-.037,z+.022,.016,.005,.038,'edge')
   self.box(xx,y-.041,z+.040,.012,.004,.017,'graphite')
   self.box(xx,y-.044,z+.047,.010,.009,.011,'black')
   self.box(xx,y-.041,z+.029,.007,.001,.003,'signal')
   for zz in [z+.005,z+.073]:
    self.cylinder(xx,y-.037,zz,.003,.002,'graphite','y')
    self.line([(xx-.0018,y-.040,zz),(xx+.0018,y-.040,zz)],'edge',.00035)
   if k:self.box(xx-pitch/2,y,z,.0007,.073,.082,'muted')
  self.text(label,x-w/2+.004,y-.046,z+.064,.0043,'ink',True)
 def panel(self,x,y,z):
  w,h,d=.60,.86,.20;self.parts.append('din-protection-and-labelled-distribution')
  self.box(x,y+d/2,z,w,.003,h,'paper');self.box(x,y+.07,z+.016,w-.030,.003,h-.032,'edge')
  for dx in [-w/2,w/2]:self.box(x+dx,y,z,.002,d,h,'paper')
  for zz in [z,z+h-.002]:self.box(x,y,zz,w,d,.002,'paper')
  self.line([(x-w/2+.008,y-.104,z+.01),(x-w/2+.008,y-.104,z+h-.01),(x+w/2-.008,y-.104,z+h-.01),(x+w/2-.008,y-.104,z+.01)],'black',.0025)
  for zz in [z+.21,z+.48]:
   self.box(x,y+.028,zz,.49,.003,.035,'edge')
   for xx in [-.215,-.11,0,.11,.215]:self.box(x+xx,y+.025,zz+.010,.017,.001,.004,'black')
  self.breaker(x-.175,y-.008,z+.457,4,'Q1 / ENTRADA')
  for j in range(4):self.breaker(x-.063+j*.061,y-.008,z+.457,2,'Q'+str(j+2))
  self.breaker(x-.155,y-.008,z+.185,4,'Q6 / RESPALDO')
  for j in range(4):self.breaker(x-.04+j*.058,y-.008,z+.185,1,'L'+str(j+1))
  # Slotted vertical wiring ducts, neutral and protective-earth bars.
  for dx in [-.265,.265]:
   self.box(x+dx,y+.015,z+.09,.028,.022,.64,'paper')
   for j in range(43):self.box(x+dx,y-.0005,z+.09+j*.015,.021,.001,.004,'graphite')
  for row,mat in [(.365,'blue'),(.098,'terminal')]:
   self.box(x,y+.025,z+row,.44,.018,.016,mat)
   for j in range(24):
    xx=x-.207+j*.018
    self.cylinder(xx,y+.014,z+row+.008,.0024,.002,'edge','y')
    self.line([(xx-.0015,y+.011,z+row+.008),(xx+.0015,y+.011,z+row+.008)],'ink',.0003)
  # Every conductor starts on a modelled terminal and enters a wiring duct.
  rows=[(.457,[(-.175,4)]+[(-.063+j*.061,2) for j in range(4)]),(.185,[(-.155,4)]+[(-.04+j*.058,1) for j in range(4)])]
  for row,breakers in rows:
   for j,(offset,poles) in enumerate(breakers):
    for k in range(poles):
     xx=x+offset-poles*.018/2+.018*(k+.5);side=-1 if xx<x else 1;end=x+side*.265
     for top in [True,False]:
      zz=z+row+(.078 if top else .006);rise=.020+k*.003 if top else -.020-k*.003
      pts=[(xx,y-.008,zz),(xx,y+.008,zz+rise),(end,y+.008,zz+rise),(end,y+.025,zz+rise)]
      self.line(self.rounded_path(pts,.006),'blue' if k==poles-1 else 'copper',.00085)
  self.box(x,y-.008,z+.670,.175,.037,.077,'graphite')
  self.box(x,y-.028,z+.687,.126,.002,.045,'screen')
  self.text('ENTRADA / RED',x-.055,y-.030,z+.716,.007,'muted',True)
  self.text('ALIMENTACION',x-.055,y-.030,z+.699,.006,'signal',True)
  for j in range(3):self.box(x-.019+j*.019,y-.030,z+.677,.011,.003,.004,'edge')
  self.text('PROTECCION / DISTRIBUCION',x-.214,y+.066,z+.779,.012,'ink',True)
  group='distribution-door';self.doors.append(dict(name=group,pivot=(x-w/2,y-.104,z),kind='door'))
  self.box(w/2,0,0,w,.002,h,'paper',group)
  for dx in [.009,w-.009]:self.box(dx,.008,.010,.013,.015,h-.020,'paper',group)
  self.box(.18,-.003,.69,.27,.002,.060,'graphite',group)
  self.text('UM / ENERGIA',.075,-.006,.719,.014,'paper',True,group=group)
  self.text('CARGAS CRITICAS',.075,-.006,.699,.008,'muted',True,group=group)
  self.cylinder(w-.036,-.004,.37,.009,.005,'edge','y',group=group)
  for dz in [.15,.67]:self.cylinder(x-w/2,y-.104,z+dz,.004,.040,'edge')
 def cell(self,x,y,z,label):
  self.box(x,y,z,.151,.098,.095,'graphite');self.box(x,y,z+.095,.150,.097,.004,'black')
  for dx in [-.050,.050]:
   self.box(x+dx,y-.018,z+.100,.010,.010,.007,'red' if dx<0 else 'black')
   self.box(x+dx,y-.018,z+.106,.005,.001,.008,'edge')
  self.box(x,y-.050,z+.027,.108,.001,.049,'paper')
  self.text('12 V / '+label,x-.045,y-.052,z+.059,.007,'ink',True)
  self.text('RESPALDO',x-.045,y-.052,z+.043,.006,'ink',True)
  for j in range(15):self.box(x-.043+j*.0057,y-.052,z+.031,.0017,.001,.008,'ink')
 def ups(self,x,y,z):
  self.parts.append('ups-controller-and-contained-battery-strings')
  w,d,h=.54,.62,.89
  self.box(x,y,z,w,d,.014,'graphite');self.box(x,y+d/2,z,w,.003,h,'graphite')
  for dx in [-w/2,w/2]:self.box(x+dx,y,z,.003,d,h,'graphite')
  self.doors.append(dict(name='ups-roof',pivot=(0,0,0),kind='lift'))
  self.box(x,y,z+h,w,d,.003,'graphite','ups-roof')
  for dx in [-w/2+.006,w/2-.006]:self.box(x+dx,y,z+h-.013,.012,d,.013,'graphite','ups-roof')
  for dx in [-.22,.22]:
   for dy in [-.26,.26]:self.cylinder(x+dx,y+dy,z-.040,.022,.040,'edge')
  for row in range(3):
   zz=z+.09+row*.18
   self.box(x,y,zz-.01,.50,.56,.010,'edge')
   for col in range(2):
    xx=x-.100+col*.200
    for depth in range(2):
     yy=y-.15+depth*.27
     self.cell(xx,yy,zz,str(1+row*4+depth*2+col).zfill(2))
    # Short insulated series links remain attached to fixed battery spades.
    self.line(self.rounded_path([(xx-.05,y-.168,zz+.114),(xx-.05,y-.168,zz+.139),(xx-.05,y+.102,zz+.139),(xx-.05,y+.102,zz+.114)],.012),'red',.002)
   self.line(self.rounded_path([(x-.05,y-.168,zz+.114),(x-.05,y-.19,zz+.135),(x+.05,y-.19,zz+.135),(x+.05,y-.168,zz+.114)],.010),'black',.002)
  # Power electronics above the cells; visible ventilation and serviceable layout.
  self.box(x,y,z+.67,.47,.54,.002,'pcb')
  for j in range(18):self.box(x-.18+j*.020,y+.05,z+.68,.002,.21,.076,'edge')
  for xx in [-.18,-.12,.12,.18]:
   self.cylinder(x+xx,y-.13,z+.677,.016,.061,'graphite')
   self.cylinder(x+xx,y-.13,z+.738,.015,.001,'edge')
  self.box(x,y-.13,z+.676,.076,.087,.052,'copper')
  self.box(x,y-.13,z+.725,.067,.066,.010,'graphite')
  for dx in [-.038,.038]:self.box(x+dx,y-.13,z+.675,.003,.085,.057,'edge')
  # Display belongs to the fixed header; the perforated door carries no wires.
  self.box(x,y-d/2-.002,z+.765,w,.023,.125,'graphite')
  self.box(x-.040,y-d/2-.015,z+.802,.160,.002,.059,'screen')
  self.text('UPS / RESPALDO',x-.108,y-d/2-.018,z+.841,.010,'paper',True)
  self.text('CARGAS PROTEGIDAS',x-.108,y-d/2-.018,z+.821,.006,'signal',True)
  self.cylinder(x+.177,y-d/2-.015,z+.830,.009,.003,'signal','y')
  group='ups-door';self.doors.append(dict(name=group,pivot=(x-w/2,y-d/2-.016,z+.017),kind='door'))
  self.box(w/2,0,0,w,.003,.740,'graphite',group)
  for row in range(34):
   for col in range(12):self.box(.040+col*.041,-.002,.04+row*.020,.025,.001,.003,'black',group)
  self.box(w-.030,-.009,.27,.010,.014,.080,'edge',group)
  for dz in [.14,.60]:self.cylinder(x-w/2,y-d/2-.015,z+dz,.004,.025,'edge')
 def loadrack(self,x,y,z):
  self.parts.append('identified-pdu-and-compute-loads')
  w,d,h=.60,.72,1.32
  self.box(x,y,z,w,d,.015,'graphite');self.box(x,y,z+h,w,d,.015,'graphite')
  self.box(x,y+d/2,z,w,.003,h,'graphite');self.box(x+w/2,y,z,.003,d,h,'graphite')
  for dx in [-.274,.274]:
   self.box(x+dx,y-d/2+.020,z,.024,.017,h,'edge')
   for j in range(84):self.box(x+dx,y-d/2+.011,z+.024+j*.015,.007,.001,.006,'black')
  # Rear service view: power leads terminate in PSU inlets, never fan grilles.
  for dz in [.60,.81]:
   self.box(x,y-.08,z+dz,.4826,.49,.0889,'graphite')
   self.box(x,y-.326,z+dz,.4826,.003,.0889,'edge')
   for k in range(2):
    xx=x-.187+k*.058
    self.box(xx,y-.329,z+dz+.012,.052,.004,.063,'graphite')
    self.box(xx,y-.332,z+dz+.025,.032,.002,.025,'edge')
    face=[(-.012,0),(.012,0),(.012,.014),(.007,.020),(-.007,.020),(-.012,.014)]
    self.mesh([(xx+dx,y-.334,z+dz+.028+zz) for dx,zz in face],[(0,1,2,3,4,5)],'black')
    for dx,zz in [(-.006,.034),(.006,.034),(0,.042)]:self.box(xx+dx,y-.335,z+dz+zz,.002,.001,.006,'copper')
    self.text('PSU '+str(k+1),xx-.018,y-.334,z+dz+.063,.005,'paper',True)
   for j in range(5):
    xx=x-.059+j*.058
    self.box(xx,y-.329,z+dz+.014,.047,.003,.050,'graphite')
    for k in range(5):self.box(xx-.018+k*.009,y-.331,z+dz+.023,.003,.001,.025,'black')
    self.box(xx+.016,y-.332,z+dz+.059,.0017,.001,.002,'signal')
   self.text('CARGA '+('01' if dz==.60 else '02'),x-.060,y-.332,z+dz+.074,.006,'paper',True)
   for dx in [-.234,.234]:
    for zz in [.017,.070]:self.screw(x+dx,y-.333,z+dz+zz)
  self.box(x-.20,y-.25,z+.105,.054,.045,.38,'graphite')
  for j in range(6):
   zz=z+.133+j*.054
   self.box(x-.20,y-.274,zz,.038,.002,.028,'edge')
   self.box(x-.20,y-.276,zz+.004,.026,.001,.019,'black')
   for dx in [-.008,0,.008]:self.box(x-.20+dx,y-.278,zz+.010,.002,.001,.006,'muted')
  for j,dz in enumerate([.60,.81]):
   self.box(x-.187,y-.347,z+dz+.029,.023,.026,.019,'graphite')
   self.box(x-.20,y-.288,z+.135+j*.054,.024,.025,.019,'graphite')
   self.line(self.rounded_path([(x-.20,y-.302,z+.143+j*.054),(x-.248,y-.36,z+.143+j*.054),(x-.248,y-.39,z+dz+.038),(x-.187,y-.39,z+dz+.038),(x-.187,y-.359,z+dz+.038)],.018),'muted',.0025)
  self.text('DISTRIBUCION / IT',x-.22,y-.34,z+1.22,.014,'paper',True)

def build():
 s=Power();s.box(0,.35,0,7.0,4.0,.09,'concrete');s.box(0,.35,.09,6.98,3.98,.012,'flooring')
 for x in range(-6,7):s.line([(x*.5,-1.64,.103),(x*.5,2.34,.103)],'joint',.001)
 for y in range(-3,5):s.line([(-3.49,y*.5,.103),(3.49,y*.5,.103)],'joint',.001)
 s.box(-2.10,1.365,.102,1.24,.09,2.13,'paper');s.box(-2.1,1.18,.46,.88,.22,.10,'edge')
 s.panel(-2.1,1.21,.56);s.ups(-.25,.78,.15);s.loadrack(2.1,.87,.13)
 # Separate input, protected output and distribution; cable labels remain nearby.
 for x in [-2.24,-2.1,-1.96]:
  s.line(s.rounded_path([(x,1.22,1.42),(x,1.22,1.68),(x,1.30,2.14)],.030),'muted',.006)
 s.route([(-2.10,1.21,.56),(-2.10,1.21,.28),(-.25,1.21,.28),(-.25,1.09,.46)],.10,.45)
 s.route([(-.12,1.09,.45),(-.12,1.20,.22),(1.9,1.20,.22),(1.9,.62,.25)],.45,.86)
 s.text('01 / PROTECCION',-2.48,.78,.111,.055,'ink')
 s.text('02 / RESPALDO',-.70,.11,.111,.055,'ink')
 s.text('03 / CARGAS CRITICAS',1.55,.23,.111,.055,'ink')
 return s

def camera(t):
 keys=[(0,13.1,-65,(0,.55,1.03),24,18),(.12,12.4,-62,(-.1,.65,1.03),24,18),
       (.29,2.08,-73,(-2.18,1.13,.99),5,2.2),(.40,1.95,-69,(-2.17,1.14,1.00),5,2.1),
       (.58,2.52,-66,(-.31,.74,.79),5,4.5),(.70,2.42,-61,(-.31,.73,.80),5,4.7),
       (.84,2.10,-68,(2.05,.79,.77),5,2.7),(1,13.1,-65,(0,.55,1.03),24,18)]
 if t<=0 or t>=1:k=keys[0];return k[1],math.radians(k[2]),k[3],k[4],k[5]
 a,b=next((a,b) for a,b in zip(keys,keys[1:]) if a[0]<=t<=b[0]);q=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
 return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3])),mix(a[4],b[4]),mix(a[5],b[5])

def animate(t,parents):
 parents['distribution-door'].rotation_euler[2]=-math.radians(102)*smooth((t-.18)/.085)*(1-smooth((t-.42)/.08))
 parents['ups-door'].rotation_euler[2]=-math.radians(104)*smooth((t-.47)/.09)*(1-smooth((t-.73)/.10))
 parents['ups-roof'].location.z=.30*smooth((t-.50)/.075)*(1-smooth((t-.73)/.075))

def describe(s):
 assert camera(0)==camera(1) and len(s.doors)==3
 assert len(set(s.parts))==3 and len(s.routes)==2
 assert all(min(b[k] for k in ['w','d','h'])>0 for b in s.boxes)
 return dict(service='108',scene='power-project-v2',boxes=len(s.boxes),meshes=len(s.meshes),parts=s.parts,frames=1440,fps=60,duration=24)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
 p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','eevee','workbench','baked'],default='baked')
 p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);args.proof_frames=None
 assert 0<=args.start<=args.end<1440 and args.width in [1920,3840] and 16<=args.samples<=128
 s=build();info=describe(s)
 if args.validate_only:print(json.dumps(info))
 else:studio.render(args,s,dict(source=__file__,sources=[str(Path(__file__).with_name('render-network-project-v2.py')),str(Path(__file__).with_name('prepare-render-font.py')),__file__],describe=describe,camera=camera,animate=animate,bake_frame=900,
  brand_font=True,normalized_font=True,text_depth=0,smooth_bake=True,packet_radius=.010,description='protection, contained energy storage, identified distribution and critical loads; continuous 24 second loop',
  lights=[('Distribution inspection',(-2.4,-.2,2.1),35,1.4,(1,1,1),(-2.1,1.15,.99)),('Battery inspection',(-.8,-.2,1.9),28,1.3,(1,1,1),(-.25,.7,.65))]))
