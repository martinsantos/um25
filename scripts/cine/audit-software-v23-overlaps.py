"""Project native glyph bounds throughout the journey; investigate any collisions visually."""
import importlib.util,math,json
from collections import defaultdict
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('audit',root/'scripts/cine/audit-software-v23-framing.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
f=a.film;hits=defaultdict(list)
def inside(A,B):
 for poly in (A,B):
  for q,r in zip(poly,poly[1:]+poly[:1]):
   axis=(q[1]-r[1],r[0]-q[0]);pa=[a.dot(v,axis) for v in A];pb=[a.dot(v,axis) for v in B]
   if max(pa)<=min(pb) or max(pb)<=min(pa):return False
 return True
for mobile in [False,True]:
 for frame in range(1200):
  t=frame/1199;d,target,angles=f.camera(t)
  if mobile:d*=1.08-.14*f.E((t-.14)/.08)*(1-f.E((t-.84)/.08))
  ax,ay,roll=map(math.radians,angles);n=a.unit((math.tan(ax),math.tan(ay),1));r=a.unit((n[2],0,-n[0]));u=a.cross(n,r);rr=tuple(math.cos(roll)*r[i]+math.sin(roll)*u[i] for i in range(3));uu=tuple(-math.sin(roll)*r[i]+math.cos(roll)*u[i] for i in range(3));active=[]
  for g,s,x,y,z,sz,m,bold in a.p.texts:
   if f.prominence(g,t)<.65:continue
   if f.family(g) not in ('data','access','contract') and t<.82:
    s={'Aprobada':'En revisión','Orden aprobada':'Aprobar orden','Aprobación registrada':'Revisión solicitada','MS aprobó la orden 0248':'MS solicitó revisión de la orden 0248'}.get(s,s)
   shift=f.placement(g,t);poly=[]
   for dx,dy in [(0,-.12*sz),(a.width[bold](s)*sz,-.12*sz),(a.width[bold](s)*sz,.72*sz),(0,.72*sz)]:
    v=tuple(c+b-tg for c,b,tg in zip((x+dx,y+dy,z),shift,target));depth=d-a.dot(v,n);poly.append((.5+a.dot(v,rr)/(depth*.75),.5-a.dot(v,uu)/(depth*.75/(1 if mobile else 16/9))))
   if all(0<=v<=1 for q in poly for v in q):active.append((s,g,poly))
  for i,(sa,ga,A) in enumerate(active):
   for sb,gb,B in active[i+1:]:
    if inside(A,B):hits[(sa,sb,ga,gb)].append(frame)
print(json.dumps([dict(texts=k[:2],groups=k[2:],first=min(v),last=max(v),samples=len(v)) for k,v in hits.items()],ensure_ascii=False))

assert not hits, "Visible software text bounds intersect during the authored journey"
