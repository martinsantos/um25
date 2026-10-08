"""Telecommunications: two sites, radio transport and a distinct optical alternative.
Physical hardware shares one metric scene; native camera shows installation and detail.
"""
import argparse,importlib.util,json,math,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('network_equipment',Path(__file__).with_name('render-network-project-v2.py'))
network=importlib.util.module_from_spec(spec);spec.loader.exec_module(network)
studio=network.studio;smooth=studio.smooth

class Telecom(network.Network):
 def __init__(self):super().__init__();self.code='103'
 def radio(self,x,y,z,direction):
  self.parts.append('aligned-parabolic-radio-'+str(direction))
  # Two skins of an actual paraboloid, rolled lip and three feed supports.
  n,rings=128,18;vv=[]
  for back in [False,True]:
   for k in range(rings):
    r=.003+(.297*k/(rings-1));depth=.108*(r/.30)**2-(.003 if back else 0)
    for j in range(n):
     a=j*math.tau/n;vv.append((x+direction*depth,y+r*math.cos(a),z+r*math.sin(a)))
  ff=[]
  for side in range(2):
   for k in range(rings-1):
    for j in range(n):
     a=side*rings*n+k*n+j;b=side*rings*n+k*n+(j+1)%n;c=side*rings*n+(k+1)*n+(j+1)%n;d=side*rings*n+(k+1)*n+j
     face=(a,d,c,b);ff.append(tuple(reversed(face)) if (side==1)==(direction==1) else face)
  for j in range(n):
   a=(rings-1)*n+j;b=(rings-1)*n+(j+1)%n;c=(2*rings-1)*n+(j+1)%n;d=(2*rings-1)*n+j
   ff.append((a,b,c,d) if direction==1 else (d,c,b,a))
  self.mesh(vv,ff,'paper');self.meshes[-1]['smooth_all']=True
  self.line([(x+direction*.109,y+.301*math.cos(j*math.tau/n),z+.301*math.sin(j*math.tau/n)) for j in range(n+1)],'edge',.003)
  for j in range(3):
   a=j*math.tau/3
   self.line([(x+direction*.084,y+.265*math.cos(a),z+.265*math.sin(a)),(x+direction*.278,y+.018*math.cos(a),z+.018*math.sin(a))],'edge',.0045)
  for depth,radius,length,mat in [(.26,.026,.034,'graphite'),(.292,.033,.005,'edge'),(.299,.024,.002,'paper')]:
   self.cylinder(x+direction*depth-(length if direction<0 else 0),y,z,radius,length,mat,'x')
  # Azimuth/elevation bracket, clamping bands and weatherproof radio enclosure.
  for dz in [-.072,.072]:
   self.box(x-direction*.07,y,z+dz,.012,.10,.025,'edge')
   for dy in [-.039,.039]:self.cylinder(x-direction*.074,y+dy,z+dz+.012,.004,.013,'graphite','x')
  self.box(x-direction*.086,y,z-.075,.039,.084,.15,'graphite')
  for j in range(12):self.box(x-direction*.110,y-.038+j*.007,z-.069,.010,.002,.136,'edge')
  self.line(self.rounded_path([(x-direction*.09,y,z-.071),(x-direction*.12,y,z-.16),(x-direction*.17,y,z-.17),(x-direction*.18,y,z-.11)]),'muted',.003)
 def site(self,x,label,direction):
  self.parts.append('site-'+label)
  self.box(x,1.0,0,2.6,2.2,.10,'concrete');self.box(x,1.0,.10,2.50,2.10,1.10,'paper')
  self.box(x,1.0,1.20,2.66,2.26,.065,'concrete')
  for dx in [-.78,0,.78]:
   self.box(x+dx,-.057,.39,.59,.014,.53,'graphite');self.box(x+dx,-.065,.414,.55,.010,.483,'glass')
   self.box(x+dx,-.072,.414,.011,.007,.483,'edge')
  # Compact tapered lattice mast on anchored shoes, with real diagonals.
  for dx in [-.17,.17]:
   for dy in [-.17,.17]:
    self.box(x+dx,1.45+dy,1.266,.085,.085,.008,'edge')
    for xx in [-.027,.027]:
     for yy in [-.027,.027]:self.screw(x+dx+xx,1.45+dy+yy,1.278,False)
    self.line([(x+dx,1.45+dy,1.28),(x+dx*.65,1.45+dy*.65,3.55)],'edge',.009)
  for level in range(7):
   zz=1.30+level*.305;f=1-(zz-1.30)/2.25*.35
   for side in [-1,1]:
    self.line([(x-.17*f,1.45+side*.17*f,zz),(x+.17*f,1.45+side*.17*f,zz+.28)],'edge',.0045)
    self.line([(x+side*.17*f,1.45-.17*f,zz),(x+side*.17*f,1.45+.17*f,zz+.28)],'edge',.0045)
  self.radio(x+direction*.16,1.45,3.12,direction)
  # Rooftop termination; a local enclosure protects the measured 19-inch optics.
  cx=x;cy=.50;cz=1.28
  self.box(cx,cy,cz,.56,.42,.014,'graphite');self.box(cx,cy+.204,cz,.56,.012,.32,'graphite')
  for dx in [-.273,.273]:self.box(cx+dx,cy,cz,.014,.42,.32,'graphite')
  self.device(cx,cy,cz+.072,'FIBRA');self.device(cx,cy,cz+.164,'PATCH')
  name='optical-cover-'+label;self.doors.append(dict(name=name,pivot=(0,0,0),kind='lift'))
  self.box(cx,cy,cz+.32,.56,.42,.009,'graphite',name)
  self.text('SITIO '+label+' / TRANSPORTE',cx-.20,cy,cz+.330,.014,'muted',group=name)
  # Splice reserve loops and two trays live inside the enclosure.
  for tray in range(2):
   xx=cx-.122+tray*.244;zz=cz+.233
   self.box(xx,cy,zz,.216,.144,.008,'pcb')
   for j in range(5):
    radius=.046+j*.004
    self.line([(xx+radius*math.cos(k*math.tau/96),cy+.048*math.sin(k*math.tau/96),zz+.009+j*.0003) for k in range(97)],'blue' if j%2 else 'copper',.00055)
   for j in range(6):self.box(xx-.057+j*.023,cy-.055,zz+.009,.015,.025,.004,'edge')
  self.line(self.rounded_path([(x+direction*.06,1.45,3.04),(x,1.45,2.95),(x,1.45,1.44),(cx,cy+.20,1.44)]),'muted',.003)
  self.text('SITIO '+label,x-.55,-.072,.22,.08,'ink',True)

def build():
 s=Telecom();s.site(-3.05,'A',1);s.site(3.05,'B',-1)
 # The connection across air and the fiber option have different, legible paths.
 s.line([(-2.59,1.45,3.12),(2.59,1.45,3.12)],'trace',.0016)
 s.routes.append(dict(pts=[(-2.59,1.45,3.12),(2.59,1.45,3.12)],start=.18,end=.48))
 pts=s.rounded_path([(-3.05,.30,1.48),(-3.05,-.22,1.48),(-3.05,-.22,.05),(-3.05,-1.0,.05),(3.05,-1.0,.05),(3.05,-.22,.05),(3.05,-.22,1.48),(3.05,.30,1.48)],.12)
 s.line(pts,'blue',.004);s.routes.append(dict(pts=pts,start=.49,end=.90))
 for x in [-2,-1,0,1,2]:s.box(x,-1.0,.018,.08,.07,.016,'edge')
 s.text('RADIO / LINEA DE VISTA',-.98,1.48,3.13,.052,'muted')
 s.text('FIBRA / TRAZADO FISICO',-.96,-1.24,.055,.065,'muted')
 s.parts.extend(['distinct-radio-and-fiber-options','optical-adapters-and-splice-reserve'])
 return s

def camera(t):
 keys=[(0,15.8,-67,(0,.55,1.60),24,18),(.14,14.9,-64,(0,.65,1.68),24,18),
       (.32,1.75,-37,(-2.83,1.45,3.12),5,1.65),(.46,1.62,-31,(-2.81,1.45,3.12),5,1.5),
       (.64,1.75,-71,(-3.05,.51,1.53),5,3.2),(.78,1.58,-69,(-3.05,.51,1.56),5,3.1),
       (1,15.8,-67,(0,.55,1.60),24,18)]
 if t<=0 or t>=1:k=keys[0];return k[1],math.radians(k[2]),k[3],k[4],k[5]
 a,b=next((a,b) for a,b in zip(keys,keys[1:]) if a[0]<=t<=b[0]);q=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
 return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3])),mix(a[4],b[4]),mix(a[5],b[5])

def animate(t,parents):
 q=.15*smooth((t-.54)/.08)*(1-smooth((t-.80)/.10))
 for name in ['optical-cover-A','optical-cover-B']:parents[name].location.z=q

def describe(s):
 assert camera(0)==camera(1) and len(s.doors)==2
 assert all(min(b[k] for k in ['w','d','h'])>0 for b in s.boxes)
 assert len(s.routes)==2 and s.routes[0]['end']<s.routes[1]['start']
 assert all(math.dist(a,b)>0 for r in s.routes for a,b in zip(r['pts'],r['pts'][1:]))
 return dict(service='103',scene='telecom-project-v2',boxes=len(s.boxes),meshes=len(s.meshes),parts=s.parts,frames=1440,fps=60,duration=24)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
 p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','workbench','baked'],default='baked')
 p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
 args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);args.proof_frames=None
 assert 0<=args.start<=args.end<1440 and args.width in [1920,3840] and 16<=args.samples<=128
 s=build();info=describe(s)
 if args.validate_only:print(json.dumps(info))
 else:studio.render(args,s,dict(source=__file__,sources=[str(Path(__file__).with_name('render-network-project-v2.py')),__file__],describe=describe,camera=camera,animate=animate,bake_frame=1000,
  packet_radius=.012,description='two sites, aligned radio transport, a distinct optical alternative and measured terminations; continuous 24 second loop',
  lights=[('Optical termination inspection',(-3.0,-.3,2.8),24,1.2,(1,1,1),(-3.05,.5,1.55))]))
