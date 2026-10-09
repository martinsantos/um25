"""Check native camera framing with real font advances, without running Blender."""
import struct,math,importlib.util,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('film',root/'scripts/cine/render-software-system-v18.py');film=importlib.util.module_from_spec(spec);spec.loader.exec_module(film)
def font_metrics(name):
 b=(root/'public/fonts/um-sans'/name).read_bytes();u=lambda p:struct.unpack_from('>H',b,p)[0];n=u(4);tabs={}
 for i in range(n):
  k,_,o,l=struct.unpack_from('>4sIII',b,12+16*i);tabs[k.decode()]=o
 units=u(tabs['head']+18);cnt=u(tabs['hhea']+34);widths=[u(tabs['hmtx']+4*i) for i in range(cnt)]
 co=tabs['cmap'];maps=[]
 for i in range(u(co+2)):
  platform,encoding,off=struct.unpack_from('>HHI',b,co+4+i*8)
  if u(co+off)==4:maps.append(co+off)
 cm=maps[-1];seg=u(cm+6)//2;ends=cm+14;starts=ends+2*seg+2;deltas=starts+2*seg;ranges=deltas+2*seg
 def glyph(c):
  for i in range(seg):
   if u(starts+2*i)<=c<=u(ends+2*i):
    delta=u(deltas+2*i);r=u(ranges+2*i)
    if not r:return (c+delta)%65536
    g=u(ranges+2*i+r+2*(c-u(starts+2*i)));return (g+delta)%65536 if g else 0
  return 0
 return lambda s:sum(widths[min(glyph(ord(c)),cnt-1)] for c in s)/units
width={False:font_metrics('UMSans-Regular.ttf'),True:font_metrics('UMSans-SemiBold.ttf')}
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def unit(a):l=math.sqrt(dot(a,a));return tuple(x/l for x in a)
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
p=film.build();fail=[];mins={}
for mobile in [False,True]:
 for frame in range(1200):
  t=frame/1199;d,target,angles=film.camera(t)
  if mobile:d*=1.08-.14*film.E((t-.14)/.08)*(1-film.E((t-.84)/.08))
  ax,ay,roll=map(math.radians,angles);n=unit((math.tan(ax),math.tan(ay),1));r=unit((n[2],0,-n[0]));up=cross(n,r);rr=tuple(math.cos(roll)*r[i]+math.sin(roll)*up[i] for i in range(3));uu=tuple(-math.sin(roll)*r[i]+math.cos(roll)*up[i] for i in range(3))
  for g,s,x,y,z,size,m,bold in p.texts:
   if film.family(g) not in ('access','contract','data') or film.prominence(g,t)<.65:continue
   shift=film.placement(g,t);points=[]
   for dx,dy in [(0,-.2*size),(width[bold](s)*size,-.2*size),(0,.8*size),(width[bold](s)*size,.8*size)]:
    v=tuple(a+b-c for a,b,c in zip((x+dx,y+dy,z),shift,target));depth=d-dot(v,n);px=.5+dot(v,rr)/(depth*.75);py=.5-dot(v,uu)/(depth*.75/(1 if mobile else 16/9));points.append((px,py))
   margin=min(min(a,b,1-a,1-b) for a,b in points)
   key=('mobile' if mobile else 'wide',s)
   if key not in mins or margin<mins[key][0]:mins[key]=(margin,frame)
for (comp,s),(margin,frame) in mins.items():
 if margin<0:fail.append(dict(composition=comp,text=s,frame=frame,margin=round(margin,4)))
print(json.dumps({'checked':len(mins),'outside':fail},ensure_ascii=False))

assert not fail, "Active software labels leave the native frame"
