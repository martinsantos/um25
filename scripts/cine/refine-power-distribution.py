"""Replace the schematic distribution cabinet with the movie's measured equipment.
The existing 30-degree SVG camera and automatic hinged-door mechanism are retained.
"""
from pathlib import Path
from math import sqrt,cos,sin,tau
from html import escape
import importlib.util,xml.etree.ElementTree as E,gzip,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'src/assets/cine/isometric'
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
spec=importlib.util.spec_from_file_location('power',Path(__file__).with_name('render-power-project-v2.py'))
power=importlib.util.module_from_spec(spec);spec.loader.exec_module(power)
model=power.Power();model.panel(0,0,0)
S=300;C=sqrt(3)/2
palette={'paper':'#262d34','edge':'#414b55','graphite':'#1b2229','black':'#090e14','ink':'#b6c0c9','muted':'#8b98a4','screen':'#121e28','signal':'#c84549','blue':'#3f6179','terminal':'#374e48','copper':'#9b8780'}
def pt(x,y,z):return (S*C*(x+y),S*((x-y)*.5-z))
def depth(v):return v[0]-v[1]+v[2]
def color(m):return palette.get(m,'#20262d')
def points(vv):return ' '.join(f'{x:.3f},{y:.3f}' for x,y in [pt(*v) for v in vv])
shapes=[];symbols={}
def add(vv,body,bias=0):shapes.append((sum(depth(v) for v in vv)/len(vv)+bias,body))
def face(vv,fill,stroke='#74818c',width=.24):
 projected=[pt(*v) for v in vv];x,y=projected[0]
 local=' '.join(f'{xx-x:.2f},{yy-y:.2f}' for xx,yy in projected)
 key=(local,fill,stroke,width)
 if key not in symbols:
  name='ppd-face-'+str(len(symbols))
  symbols[key]=(name,f'<polygon points="{local}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"/>')
 name=symbols[key][0]
 add(vv,f'<use href="#{name}" transform="translate({x:.2f} {y:.2f})"/>')

for box_index,b in enumerate(model.boxes):
 if b.get('group'):continue
 x,y,z,w,d,h=[b[k] for k in ['x','y','z','w','d','h']];a=x-w/2;c=x+w/2;f=y-d/2;r=y+d/2
 start=len(shapes)
 face([(a,f,z),(c,f,z),(c,f,z+h),(a,f,z+h)],color(b['mat']))
 face([(c,f,z),(c,r,z),(c,r,z+h),(c,f,z+h)],'#171e25',width=.20)
 face([(a,f,z+h),(c,f,z+h),(c,r,z+h),(a,r,z+h)],color(b['mat']),stroke='#939fa8',width=.20)
 # Enclosure planes span the complete circuit depth. Draw that shell first;
 # centroid sorting alone would paint its backing over the lower breakers.
 if box_index<6:
  for i in range(start,len(shapes)):shapes[i]=(shapes[i][0]+(-10 if box_index in (0,1,2) else 10),shapes[i][1])
for item in model.cylinders:
 if item.get('group'):continue
 x,y,z,r,h=[item[k] for k in ['x','y','z','r','h']]
 if item['axis']=='y':vv=[(x+r*cos(i*tau/24),y-h,z+r*sin(i*tau/24)) for i in range(24)]
 else:vv=[(x+r*cos(i*tau/24),y+r*sin(i*tau/24),z+h) for i in range(24)]
 face(vv,color(item['mat']),width=.19)
for item in model.lines:
 if item.get('group'):continue
 vv=item['pts'];body='<path d="M'+'L'.join(f'{x:.3f},{y:.3f}' for x,y in [pt(*v) for v in vv])+f'" fill="none" stroke="{color(item["mat"])}" stroke-width="{max(.18,item["radius"]*S*1.4):.3f}" stroke-linecap="round" stroke-linejoin="round"/>'
 add(vv,body,.006)
for t in model.texts:
 if t.get('group'):continue
 x,y=pt(*t['at']);a=f'{C} .5 0 1' if t['front'] else f'{C} .5 {-C} .5'
 body=f'<g transform="matrix({a} {x:.3f} {y:.3f})"><text font-family="UM Sans,Arial,sans-serif" font-size="{t["size"]*S:.3f}" fill="{color(t["mat"])}">{escape(t["value"])}</text></g>'
 add([t['at']],body,3)
body=''.join(body for _,body in sorted(shapes,key=lambda row:row[0]))
# A folded, labelled door swings from the actual left-front hinge. Fine rails,
# gasket and latch remain recognizable while open, without a floating lid.
x,y=pt(-.30,-.104,0);w=.60*S;h=.86*S
leaf=f'<rect x="0" y="-{h}" width="{w}" height="{h}" rx="1.2" fill="#20272e" stroke="#a4afb8" stroke-width=".42"/><rect x="3.8" y="-{h-3.8}" width="{w-7.6}" height="{h-7.6}" rx=".8" fill="none" stroke="#57636f" stroke-width=".25"/>'
leaf+='<g class="ppd-door-label"><rect x="23" y="-221" width="111" height="30" rx=".7" fill="#131d25" stroke="#657682" stroke-width=".25"/><text x="29" y="-209" font-family="UM Sans,Arial,sans-serif" font-size="5.1" fill="#c6cdd4">UM / ENERGÍA</text><text x="29" y="-198" font-family="UM Sans,Arial,sans-serif" font-size="3.0" fill="#98a7b3">PROTECCIÓN · CARGAS CRÍTICAS</text></g>'
leaf+='<circle cx="169" cy="-112" r="3.3" fill="#101820" stroke="#a6b1ba" stroke-width=".35"/><path d="M169-114v4" stroke="#b8c2ca" stroke-width=".45"/>'
leaf+='<path d="M7-240v14M7-41v14" stroke="#8e9da8" stroke-width="2"/><path d="M12-241v224h155" fill="none" stroke="#485560" stroke-width=".3"/>'
body+=f'<g transform="translate({x:.3f} {y:.3f})"><g class="ds-door" transform="matrix({C} .5 0 1 0 0)">{leaf}</g></g>'
markup=f'<g xmlns="{NS}" transform="translate(0 105)" data-authored-equipment="din-distribution-panel">{body}</g>'
for stem,version in [('discipline-108',4),('discipline-systems',5)]:
 root=E.fromstring((OUT/f'{stem}-v{version}.svg').read_text())
 drawing=next(n for n in root.iter() if n.get('data-discipline-drawing')=='108')
 node=next(n for n in drawing.iter() if n.get('data-discipline-node')=='1')
 for child in list(node):node.remove(child)
 node.append(E.fromstring(markup))
 style=E.SubElement(root,'{'+NS+'}style');style.text='.ppd-door-label{{transition:opacity 500ms}}.ds-node[data-current=true] .ppd-door-label{{opacity:0}}@media(prefers-reduced-motion:reduce){{.ppd-door-label{{opacity:0}}}}'.replace('{{','{').replace('}}','}')
 defs=root.find('{'+NS+'}defs')
 for name,shape in symbols.values():defs.append(E.fromstring(f'<g xmlns="{NS}" id="{name}">{shape}</g>'))
 destination=OUT/f'{stem}-v{version+1}.svg';text=E.tostring(root,encoding='unicode');destination.write_text(text)
 print(json.dumps({'file':destination.name,'bytes':len(text.encode()),'gzip':len(gzip.compress(text.encode())),'measured_parts':len(model.boxes),'faces':len(shapes)}))
