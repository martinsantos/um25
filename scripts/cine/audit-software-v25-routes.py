import importlib.util,math,json
from pathlib import Path
from collections import defaultdict
r=Path(__file__).resolve().parents[2]
s=importlib.util.spec_from_file_location('a',r/'scripts/cine/audit-software-v25-framing.py');a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
f=a.film;hits=defaultdict(list)
def cross(p,q):return p[0]*q[1]-p[1]*q[0]
def intersect(p,q,A):
 d=(q[0]-p[0],q[1]-p[1]);lo,hi=0.,1.
 for x,y in zip(A,A[1:]+A[:1]):
  edge=(y[0]-x[0],y[1]-x[1]);rel=(p[0]-x[0],p[1]-x[1]);num=cross(edge,rel);den=cross(edge,d)
  if abs(den)<1e-12:
   if num<0:return False
  elif den>0:lo=max(lo,-num/den)
  else:hi=min(hi,-num/den)
 return lo<=hi
for frame in range(1200):
 t=frame/1199
 if not ((.295<t<.435) or (.615<=t<.695)):continue
 d,target,angles=f.camera(t);ax,ay,roll=map(math.radians,angles);n=a.unit((math.tan(ax),math.tan(ay),1));r=a.unit((n[2],0,-n[0]));u=a.cross(n,r);rr=tuple(math.cos(roll)*r[i]+math.sin(roll)*u[i] for i in range(3));uu=tuple(-math.sin(roll)*r[i]+math.cos(roll)*u[i] for i in range(3))
 def project(point):
  v=tuple(x-y for x,y in zip(point,target));depth=d-a.dot(v,n);return (.5+a.dot(v,rr)/(depth*.75),.5+a.dot(v,uu)/(depth*.75/(16/9)))
 ax,ay,az=f.placement('access',t);cx,cy,cz=f.placement('contract',t);dx,dy,dz=f.placement('data',t)
 route=[project(p) for p in [(6.96+ax,-2.88+ay,az+.06),(7.65,-3.85,-.7),(-4.75+cx,-3.85,cz+.03),(-4.75+cx,-3.45,cz+.03),(6.12+dx,-3.45,dz+.03)]]
 for g,txt,x,y,z,sz,m,bold in a.p.texts:
  if f.prominence(g,t)<.10:continue
  shift=f.placement(g,t);A=[]
  for ox,oy in [(0,-.12*sz),(a.width[bold](txt)*sz,-.12*sz),(a.width[bold](txt)*sz,.72*sz),(0,.72*sz)]:A.append(project(tuple(v+b for v,b in zip((x+ox,y+oy,z),shift))))
  if any(intersect(p,q,A) for p,q in zip(route,route[1:])):hits[(g,txt)].append(frame)
result=[dict(group=k[0],text=k[1],first=min(v),last=max(v),count=len(v)) for k,v in hits.items()]
print(json.dumps(result,ensure_ascii=False))
assert not result, 'The visible travelling route crosses text bounds'
