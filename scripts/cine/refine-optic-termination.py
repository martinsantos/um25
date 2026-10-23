"""Authored SFP+ cutaway: folded cage, duplex LC ports, PCB and edge contacts.
Uses the existing 30-degree projection and autonomous lift contract.
"""
from pathlib import Path
from html import escape
import math, xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[2]/'src/assets/cine/isometric'
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS);C=math.sqrt(3)/2

def point(x,y,z=0):return ((x-y)*C,(x+y)*.5-z)
def face(ps,fill,stroke='#79818a',sw=.35):
 return '<polygon points="'+' '.join(f'{x:.3f},{y:.3f}' for x,y in [point(*p) for p in ps])+f'" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
def box(x,y,z,w,d,h,fill='#242b32'):
 return face([(x,y+d,z),(x+w,y+d,z),(x+w,y+d,z+h),(x,y+d,z+h)],'#12181e')+face([(x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h)],'#1a222b')+face([(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],fill)
def plane(x,y,z,body,vertical=False):
 a,b=point(x,y,z);axes=f'{C} .5 0 1' if vertical else f'{C} .5 {-C} .5'
 return f'<g transform="matrix({axes} {a:.3f} {b:.3f})">{body}</g>'
def rect(x,y,w,h,fill,stroke='#7c8792',sw=.25,rx=.25):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def line(d,stroke='#6c8b91',sw=.3):return f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
def text(x,y,t,size=2.5,fill='#c0c8d1'):return f'<text x="{x}" y="{y}" font-family="UM Sans,Arial,sans-serif" font-size="{size}" fill="{fill}">{escape(t)}</text>'

def optic():
 base=box(-15,-58,0,30,116,2,'#262f38')
 base+=box(-13,-51,2.1,26,89,1.15,'#203739')
 pcb=rect(0,0,25,88,'#203739','#647d7f',.3)
 # Routed differential pairs from the rear connector to driver and receiver.
 for i in range(5):
  x=2+i*4.8
  for j in [0,.65]:pcb+=line(f'M{x+j} 0v{9+i*2}h{2.4-i*.3}v{12-i}h{-1.1}v{15+i*.7}', '#82999a',.25)
 for y in [7,16,27,39,49,60,72,83]:
  for x in [1.7,23.3]:pcb+=f'<circle cx="{x}" cy="{y}" r=".65" fill="#18272c" stroke="#b0b8ad" stroke-width=".25"/>'
 for i in range(5):pcb+=line(f'M{3+i*4.5} 85v-8h{-1.3+i*.15}v-7','#849b9d',.25)
 pcb+=text(2,46,'TX',2,'#aabbbb')+text(17,46,'RX',2,'#aabbbb')+text(6,82,'UM / OPTIC',2,'#bdc8c5')
 base+=plane(-12.5,-50.5,3.3,pcb)
 # 20 gold fingers and keyed edge connector, individually separated.
 for i in range(20):base+=plane(-12.25+i*1.27,-57.7,2.3,rect(0,0,.80,7.8,'#aea17d','#d0c6aa',.16,.12))
 # Controller and driver ICs with actual lead pitch and orientation marker.
 for x,y,w,d,label in [(-7,-25,14,13,'PHY'),(-10,-4,8,11,'TX'),(3,-4,8,11,'RX')]:
  base+=box(x,y,3.4,w,d,2.2,'#131d26')
  for i in range(6):
   for side in [-.9,w]:base+=box(x+side,y+1.0+i*(d-2)/6,3.45,.9,.45,.6,'#98a4aa')
  base+=plane(x,y,5.7,text(1.5,d*.62,label,2.3)+'<circle cx="1.2" cy="1.2" r=".48" fill="#96a4b2"/>')
 # Paired capacitors, bias resistors and decoupling around both optical paths.
 for y in [-37,-31,-17,13,20,27]:
  for x in [-10.2,8.4]:
   base+=box(x,y,3.35,2.2,3.3,1.1,'#707f88')
   base+=plane(x,y,4.47,rect(0,1.1,2.2,1.1,'#c1c2b6','#c1c2b6',.1))
 # Two optical subassemblies feed the separate transmit and receive ferrules.
 for x,label in [(-10.5,'TOSA'),(2.5,'ROSA')]:
  base+=box(x,31,3.2,8,21,6,'#657480')
  base+=plane(x,31,9.3,rect(.8,1,6.4,19,'#394a57','#a2adb6',.3)+text(1.6,11,label,1.9))
 base+=box(-15,52,2,30,10,12,'#374652')
 ports=''
 for x,label in [(1.5,'TX'),(16,'RX')]:
  ports+=rect(x,1,12,9,'#111a22','#a0abb6',.5,.5)+rect(x+2,3,8,5,'#060a10','#697c8d',.35)
  ports+=f'<circle cx="{x+6}" cy="5.5" r="1.45" fill="#d0d8dc" stroke="#566878" stroke-width=".35"/><circle cx="{x+6}" cy="5.5" r=".58" fill="#3a4d5e"/>'
  ports+=line(f'M{x+3} 1V-.6h6V1','#a0abb6',.4)+text(x+4,13,label,2)
 base+=plane(-15,62.1,13,ports,True)
 # Bail latch wraps around the front, separately from the sockets.
 for x in [-16.5,15.5]:base+=box(x,51,2,1,17,1.4,'#8e9ba6')
 base+=box(-16.5,66.5,2,33,1,1.4,'#8998a5')
 cover=box(-15.4,-52,14.8,30.8,103,.75,'#38434e')
 cover+=face([(-15.4,-52,4),(-15.4,51,4),(-15.4,51,15.55),(-15.4,-52,15.55)],'#202b35')
 cover+=face([(15.4,-52,4),(15.4,51,4),(15.4,51,15.55),(15.4,-52,15.55)],'#283542')
 panel=rect(0,0,23,61,'#29333e','#93a0ae',.35,.9)
 panel+=text(2,7,'SFP+',4.5,'#dde1e4')+text(2,12,'10G / 1310 nm',2.2)+line('M2 16h19','#7b8b9b',.3)+text(2,23,'DUPLEX LC',2.8)+text(2,28,'TX / RX',2.2)
 for i in range(22):panel+=line(f'M{2+i*.86} 34v{13 if i%3 else 11}','#afb9c3',.24 if i%3 else .45)
 panel+=text(2,53,'UM · TRANSCEIVER',1.7)+text(2,57,'REVISIÓN / 01',1.7)
 cover+=plane(-11.5,-34,15.7,panel)
 for y in [-47,35,43]:
  for x in [-15.4,12.9]:cover+=plane(x,y,15.65,rect(0,0,2.5,3.5,'#151d27','#8694a2',.3,.2))
 cover+=plane(-12,-47,15.7,line('M0 0h24M0 2h24','#7f8d99',.3))
 return base+f'<g class="ds-cover" style="--ds-lift:-46px;--ds-lift-x:0px">{cover}</g>'

for stem,version in [('discipline-103',2),('discipline-systems',4)]:
 root=E.fromstring((ROOT/f'{stem}-v{version}.svg').read_text())
 drawing=next(n for n in root.iter() if n.get('data-discipline-drawing')=='103')
 node=next(n for n in drawing.iter() if n.get('data-discipline-node')=='2')
 for child in list(node):node.remove(child)
 node.set('data-authored-equipment','duplex-optical-transceiver')
 node.extend(list(E.fromstring(f'<svg xmlns="{NS}"><g transform="translate(570 320)">{optic()}</g></svg>')))
 dest=ROOT/f'{stem}-v{version+1}.svg';dest.write_text(E.tostring(root,encoding='unicode'));print(dest.name,dest.stat().st_size)
