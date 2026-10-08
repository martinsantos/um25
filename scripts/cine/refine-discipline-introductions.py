"""Give each technical discipline a distinct first object on the same 30° axes.
Keeps layer identifiers, routes and camera contracts; changes no published asset.
"""
from pathlib import Path
from html import escape
import math,xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[2]/'src/assets/cine/isometric'
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS);C=math.sqrt(3)/2

def point(x,y,z=0):return ((x-y)*C,(x+y)*.5-z)
def pts(values):return ' '.join(f'{a:.3f},{b:.3f}' for a,b in [point(*p) for p in values])
def face(values,fill='#171b20',sw=.5):return f'<polygon points="{pts(values)}" fill="{fill}" stroke="#81878e" stroke-width="{sw}" stroke-linejoin="round"/>'
def box(x,y,z,w,d,h,fill='#1b2025'):
 return face([(x,y+d,z),(x+w,y+d,z),(x+w,y+d,z+h),(x,y+d,z+h)],'#0d1014')+face([(x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h)],'#12161b')+face([(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],fill)
def xy(x,y,z,body):
 a,b=point(x,y,z);return f'<g transform="matrix({C} .5 {-C} .5 {a:.3f} {b:.3f})">{body}</g>'
def vertical(x,y,z,body):
 a,b=point(x,y,z);return f'<g transform="matrix({C} .5 0 1 {a:.3f} {b:.3f})">{body}</g>'
def text(x,y,value,size=5.8,fill='#c4c7cc',weight=400):return f'<text x="{x}" y="{y}" font-family="UM Sans,Arial,sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}">{escape(value)}</text>'
def rect(x,y,w,h,fill='none',stroke='#646b73',rx=1,sw=.45):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def line(d,color='#81878e',width=.5):return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'
def screw(x,y):return f'<circle cx="{x}" cy="{y}" r="1.2" fill="#0c0f12" stroke="#8c959e" stroke-width=".35"/>'+line(f'M{x-.7} {y}h1.4',width=.35)

def laptop():
 s=box(-4,1,0,165,108,5)
 # Individual keys, trackpad, port openings and two separate hinge barrels.
 keyboard=rect(0,0,153,103,'#171c22','#7e8790',3)
 for row,count in enumerate([13,13,12,11]):
  for col in range(count):keyboard+=rect(8+col*10.5+(row//2)*3,10+row*10,8,7,'#242b32','#81878e',.65,.35)
 keyboard+=rect(41,50,63,7,'#242b32','#81878e',.7,.35)+rect(49,65,58,30,'#13181d','#747e88',2)
 keyboard+=line('M8 60h137','#404a55',.4)
 for x in [8,137]:
  for j in range(9):keyboard+=line(f'M{x} {68+j*2.5}h8','#4f5b67',.35)
 s+=xy(1,3,5.2,keyboard)
 for x in [7,143]:s+=box(x,1,5,15,6,5,'#343c45')
 for y in [33,50]:s+=face([(-4,y,1),(-4,y+10,1),(-4,y+10,3.5),(-4,y,3.5)],'#050709',.3)
 s+=box(0,0,7,157,4,106,'#292f37')
 ui=rect(0,0,147,96,'#0e1319','#9ba4ae',2,.55)+text(8,13,'INCIDENTE / 0248',8,'#d0d5dc',600)
 ui+=text(8,25,'Sede norte · acceso a ERP',5.3,'#98a3ae')+line('M7 32H140','#46515d')
 ui+=rect(7,39,89,33,'#151c25','#5b6774')+text(12,49,'SEÑAL RECIBIDA',5.4,'#dc676a',600)+text(12,60,'Aplicación inaccesible',5.6)+text(12,68,'Equipo y usuario identificados',3.8,'#96a2ae')
 ui+=rect(102,39,38,33,'#151a21','#46515d')+text(107,49,'EN CURSO',4.2)+line('M108 57l3 3 5-6','#c4c7cc',.8)+text(107,68,'Mesa técnica',3.8)
 for i,(label,tone) in enumerate([('Recibir','#c65e65'),('Diagnosticar','#687685'),('Verificar','#687685')]):
  x=8+i*45;ui+=f'<circle cx="{x+2}" cy="83" r="2" fill="{tone}"/>'+text(x+7,85,label,4.4)
  if i<2:ui+=line(f'M{x+38} 83h8','#46515d')
 s+=vertical(5,4.3,107,ui)
 s+=box(160,43,1,6,18,2,'#363f49')
 s+=xy(164,40,1,rect(0,0,11,24,'#222a33','#81878e',2)+line('M5.5 3v8','#a2a8af',.6))
 return s

def survey():
 s=box(-8,-5,0,182,130,3,'#141b22')
 for z,offset in [(4,3),(5.5,1.5),(7,0)]:s+=box(offset,offset,z,166,117,.7,'#151b22')
 body=rect(0,0,165,116,'#131921','#7d8791',.8,.5)+text(9,14,'RELEVAMIENTO',9,'#d0d5dc',600)+text(9,24,'Activos · uso · dependencias',4.8,'#96a3af')+line('M9 30H155','#46525e')
 # A measured plan: wall thickness, door swings, outlets and cable route.
 body+=rect(9,38,97,63,'#10171e','#9da7b1',0,.65)+line('M57 38v27m0 13v23M9 69h23m12 0h62','#a6afb8',.8)
 body+=line('M57 65h12a13 13 0 0 1-12 13M32 69v12a12 12 0 0 0 12-12','#687786',.5)
 for x,y,w in [(18,45,19),(67,47,22),(74,80,17)]:
  body+=rect(x,y,w,8,'#242e38','#7b8996',.4)+rect(x+3,y+1,w-6,3,'#151c24','#657789',.3,.3)
 for x,y,label in [(21,88,'P01'),(78,58,'P02'),(85,92,'R01')]:body+=f'<circle cx="{x}" cy="{y}" r="1.6" fill="#dc2626"/>'+text(x+3,y+1.6,label,3.7)
 body+=line('M21 86V63H86V91M78 58v5','#bb626a',.7)+line('M12 105h90M12 103v4M102 103v4','#657787',.35)+text(45,110,'SITIO / A',3.6)
 for i,(label,sub) in enumerate([('01 / ACTIVOS','Equipos y ubicación'),('02 / USO','Personas y tareas'),('03 / ENLACES','Red e información')]):
  y=44+i*22;body+=text(113,y,label,3.9,'#c4c7cc',600)+text(113,y+7,sub,2.8,'#98a5b1')+line(f'M113 {y+12}h42','#455563',.4)
 body+=text(114,112,'UM / CAMPO',3.7,'#a8b1bc')
 s+=xy(0,0,8,body)
 # Folded metal clip, fixing screws and a ruled engineer's scale.
 s+=box(54,-5,8.5,53,9,2,'#3e4853')+xy(57,-3,10.6,screw(0,0)+screw(46,0)+line('M5 0h35','#b1b8c0',.55))
 ruler=rect(0,0,169,9,'#212a33','#6c7b88',.5,.4)
 for i in range(43):ruler+=line(f'M{3+i*3.8} 0v{5 if i%5==0 else 2.5}', '#929da8',.35)
 s+=xy(-5,126,2,ruler)
 s+=box(177,10,3,3,104,3,'#2f3944')+box(177,10,6,3,17,1,'#7f8994')
 s+=face([(177,114,3),(180,114,3),(178.5,122,3)],'#a2a8af',.35)
 return s

def loadmeter():
 s=box(12,-6,0,116,176,19,'#242c35')
 panel=rect(0,0,111,170,'#151c24','#929da8',7,.55)+rect(4,4,103,162,'none','#4e5f70',5,.45)
 for x,y in [(9,10),(102,10),(9,159),(102,159)]:panel+=screw(x,y)
 panel+=text(13,22,'ANALIZADOR',8,'#c4c7cc',600)+text(13,31,'CARGAS IT / CANAL A',4.6,'#8c9cae')
 panel+=rect(12,40,88,75,'#0c131b','#8796a6',3,.55)+text(18,51,'POTENCIA ACTIVA',5.1,'#98a9b9')+text(18,68,'0,84',16,'#d4dce5',600)+text(74,68,'kW',6,'#98a9b9')
 panel+=line('M18 104V80M18 104h75','#435568',.4)+line('M18 99l6-3 6 2 6-8 6 3 6-9 6 4 6-6 6 3 6-7 6 5 9-1','#bc6f77',.8)
 for i,label in enumerate(['W','VA','PF']):panel+=rect(13+i*30,121,25,13,'#242e3a','#8593a3',2,.45)+text(20+i*30,130,label,5.3)
 panel+=f'<circle cx="56" cy="151" r="9" fill="#202c38" stroke="#8b9bac" stroke-width=".6"/>'+line('M56 144v5','#cad2db',.8)
 s+=xy(14,-3,19.2,panel)
 # Keyed measurement sockets and two attached leads to a split-core clamp.
 for x,color in [(45,'#bf626b'),(92,'#9ca8b4')]:
  s+=xy(x,2,20,'<circle r="4" fill="#080c11" stroke="'+color+'" stroke-width="1"/><circle r="1.4" fill="#505c68"/>')
 # The probes leave through the top edge and follow the outside of the
 # enclosure; they never cross the screen or the equipment identification.
 for points,color in [([(45,2,21),(45,-32,28),(180,-32,28),(190,18,15),(174,33,12)],'#cb6b72'),([(92,2,21),(92,-24,27),(193,-24,27),(201,23,14),(180,35,12)],'#8493a2')]:
  coords=[point(*p) for p in points];d=f'M{coords[0][0]},{coords[0][1]}'
  for previous,at,after in zip(coords,coords[1:],coords[2:]):
   a=math.dist(previous,at);b=math.dist(at,after);radius=min(8,a*.3,b*.3)
   before=[at[i]+(previous[i]-at[i])*radius/a for i in (0,1)];next=[at[i]+(after[i]-at[i])*radius/b for i in (0,1)]
   d+=f'L{before[0]},{before[1]}Q{at[0]},{at[1]} {next[0]},{next[1]}'
  d+=f'L{coords[-1][0]},{coords[-1][1]}';s+=line(d,color,1.1)
 clamp=rect(0,29,26,66,'#1b2631','#8191a2',4,.6)+rect(7,45,12,21,'#263849','#7e93a8',2,.4)
 clamp+='<path d="M0 39V17C0-6 38-6 38 17V39H28V18C28 8 10 8 10 18V39Z" fill="#273544" stroke="#99a6b4" stroke-width=".6"/>'+line('M19 1v10','#0b1016',1.2)+text(5,85,'A',8,'#c4c7cc',600)
 s+=xy(161,18,9,clamp)
 return s

makers={'105':laptop,'106':survey,'108':loadmeter}
for stem,version in [('discipline-105',2),('discipline-106',2),('discipline-108',3),('discipline-systems',3)]:
 source=ROOT/f'{stem}-v{version}.svg';root=E.fromstring(source.read_text())
 for drawing in root.iter():
  code=drawing.get('data-discipline-drawing')
  if code not in makers:continue
  node=next(n for n in drawing.iter() if n.get('data-discipline-node')=='0')
  for child in list(node):node.remove(child)
  node.set('data-authored-introduction',{'105':'incident-workstation','106':'field-survey','108':'load-analyzer'}[code])
  node.extend(list(E.fromstring(f'<svg xmlns="{NS}">{makers[code]()}</svg>')))
 destination=ROOT/f'{stem}-v{version+1}.svg';destination.write_text(E.tostring(root,encoding='unicode'));print(destination.name,destination.stat().st_size)
