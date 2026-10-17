"""Refine the existing battery cassette without changing its isometric axes or motion.
The new version preserves the enclosure and replaces its coarse six-cell insert.
"""
from html import escape
from math import sqrt
import math
from pathlib import Path
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]/'src/assets/cine/isometric'
NS='http://www.w3.org/2000/svg';ET.register_namespace('',NS)
C=sqrt(3)/2

def p(x,y,z):return ((x-y)*C,(x+y)/2-z)
def pair(v):return ','.join(f'{n:.3f}' for n in p(*v))
def face(points,fill='#171b20',stroke='#777f88',width=.48):
 return '<polygon points="'+' '.join(pair(v) for v in points)+f'" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"/>'
def box(x,y,z,w,d,h,top='#171b20'):
 a,b=x-w/2,x+w/2;c,e=y-d/2,y+d/2
 return face([(a,e,z),(b,e,z),(b,e,z+h),(a,e,z+h)],'#0d1013')+face([(b,c,z),(b,e,z),(b,e,z+h),(b,c,z+h)],'#111519')+face([(a,c,z+h),(b,c,z+h),(b,e,z+h),(a,e,z+h)],top)
def surface(x,y,z,content):
 xx,yy=p(x,y,z);return f'<g transform="matrix({C} .5 {-C} .5 {xx:.3f} {yy:.3f})">{content}</g>'
def text(x,y,label,size=5.3,fill='#a5adb6'):
 return f'<text x="{x}" y="{y}" fill="{fill}" font-family="UM Sans,Arial,sans-serif" font-size="{size}">{escape(label)}</text>'
def trace(points,color='#979fa8',width=1.5):
 pts=[p(*v) for v in points];d=f'M{pts[0][0]:.3f},{pts[0][1]:.3f}'
 for previous,at,after in zip(pts,pts[1:],pts[2:]):
  before_length=math.hypot(at[0]-previous[0],at[1]-previous[1]);after_length=math.hypot(after[0]-at[0],after[1]-at[1]);radius=min(6,before_length*.3,after_length*.3)
  before=tuple(at[i]+(previous[i]-at[i])*radius/before_length for i in [0,1]);next=tuple(at[i]+(after[i]-at[i])*radius/after_length for i in [0,1])
  d+=f'L{before[0]:.3f},{before[1]:.3f}Q{at[0]:.3f},{at[1]:.3f} {next[0]:.3f},{next[1]:.3f}'
 d+=f'L{pts[-1][0]:.3f},{pts[-1][1]:.3f}'
 return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>'
def wire(a,b,offset=0,color='#969ea8'):
 # The return between rows follows the edge, clear of the battery labels.
 points=[a,(a[0],a[1]-9-offset,a[2]+2),(b[0],b[1]-9-offset,b[2]+2),b]
 if abs(a[1]-b[1])>100:points=[a,(180,a[1]-7,a[2]+2),(180,b[1]-9,b[2]+2),(b[0],b[1]-9,b[2]+2),b]
 return trace(points,'#111316',3.5)+trace(points,color,1.4)

cells=[(-119,-99),(0,-99),(119,-99),(-119,62),(0,62),(119,62)]
body=box(0,-28,3,378,333,3,'#191d22')
for y in [-191,135]:body+=box(0,y,6,374,3,9,'#23292e')
for x in [-185,185]:
 body+=box(x,-28,6,3,329,8,'#23292e')
 for y in [-173,118]:body+=surface(x,y,14.1,'<circle r="1.6" fill="#101316" stroke="#a2a8af" stroke-width=".45"/><path d="M-1 0H1M0-1V1" stroke="#777f88" stroke-width=".35"/>')
for i,(x,y) in enumerate(cells):
 body+=box(x,y,6,105,145,47,'#16191d')
 body+=box(x,y,53,104,144,4,'#20252a')
 # Recessed lid seam, pressure-valve caps and manufacturing label.
 content='<rect x="-49" y="-69" width="98" height="138" rx="3" fill="none" stroke="#59616a" stroke-width=".5"/>'
 content+='<rect x="-37" y="-29" width="74" height="71" rx="1.5" fill="#1b2026" stroke="#6d7680" stroke-width=".4"/>'
 content+=text(-29,-15,f'B{i+1:02} / 12 V',7)+text(-29,-2,'RESPALDO',5.1)+text(-29,9,'MÓDULO SELLADO',4.1)+text(-29,20,'DC / SERIE',4.3)
 for j in range(21):content+=f'<path d="M{-29+j*2.65} 26v8" stroke="#949da7" stroke-width="{.5+(j%3)*.22}"/>'
 for yy in [-30,0,30]:content+=f'<circle cx="43" cy="{yy}" r="3" fill="#111418" stroke="#747d87" stroke-width=".45"/><path d="M41 {yy}h4" stroke="#59616a" stroke-width=".4"/>'
 content+=text(-40,-55,'+',7,'#dc2626')+text(33,-55,'−',7)
 body+=surface(x,y,57.15,content)
 for dx in [-32,32]:
  body+=box(x+dx,y-51,57,12,15,3,'#626b74')
  body+=surface(x+dx,y-51,60.2,'<circle r="3.1" fill="#2a3037" stroke="#a2a8af" stroke-width=".45"/><circle r="1.7" fill="#12161a" stroke="#747d87" stroke-width=".35"/><path d="M-1.2 0H1.2M0-1.2V1.2" stroke="#a2a8af" stroke-width=".4"/>')
 # Front seam and restrained retention clips, attached to the cassette rails.
 for dx in [-46,46]:body+=box(x+dx,y+71,14,7,5,29,'#252b31')
# Continuous series route snakes through both rows; no loose illustrative bars.
order=[0,1,2,5,4,3]
for a,b in zip(order,order[1:]):
 ax,ay=cells[a];bx,by=cells[b]
 body+=wire((ax+32,ay-51,61),(bx-32,by-51,61),4 if abs(ay-by)>100 else 0)
# Two outgoing leads return along the tray edges and end at a keyed DC connector.
body+=trace([(-151,-150,62),(-173,-166,60),(-173,108,60),(-65,114,60)],'#dc2626',1.9)
body+=trace([(-87,11,62),(-87,102,62),(-53,114,60)],'#a0a7af',1.6)
body+=box(-59,119,55,28,16,12,'#282d33')
body+=surface(-59,119,67.1,'<rect x="-12" y="-6" width="24" height="12" fill="none" stroke="#929aa3" stroke-width=".45"/><path d="M-6-4V4M6-4V4" stroke="#c4c7cc" stroke-width="1.1"/>')
body+=surface(85,121,15,text(-20,0,'DC / MANTENIMIENTO',4.8))
for stem in ['discipline-108','discipline-systems']:
 source=ROOT/f'{stem}-v2.svg';root=ET.fromstring(source.read_text());defs=root.find('{'+NS+'}defs')
 previous=next(e for e in defs if e.get('id')=='ds-ups-cover')
 replacement=ET.fromstring(f'<g xmlns="{NS}" id="ds-ups-cover" data-precision-cells="6">{body}</g>')
 at=list(defs).index(previous);defs.remove(previous);defs.insert(at,replacement)
 for node in root.iter():
  if node.get('class')=='ds-cover' and any(e.get('href')=='#ds-ups-cover' for e in node):node.set('data-precision-cassette','true')
 destination=ROOT/f'{stem}-v3.svg';destination.write_text(ET.tostring(root,encoding='unicode'));print(destination.name,destination.stat().st_size)
