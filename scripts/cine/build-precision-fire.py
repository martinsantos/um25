"""Precise 30 degree fire-system drawing, using the movie's measured panel parts.
Dark opaque faces retain depth. Hinged inspection shares the existing story clock.
"""
from pathlib import Path
from math import sqrt,cos,sin,pi
from html import escape
import importlib.util,json,gzip,xml.etree.ElementTree as ET
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'src/assets/cine/isometric'
spec=importlib.util.spec_from_file_location('fire',Path(__file__).with_name('render-fire-project-v2.py'));fire=importlib.util.module_from_spec(spec);spec.loader.exec_module(fire)
S=450;A=sqrt(3)/2
palette={'paper':'#14171b','edge':'#191d22','graphite':'#15191d','black':'#090b0d','ink':'#0b0d10','pcb':'#101815','copper':'#ad9390','red':'#65232a','muted':'#7d858e','terminal':'#202926','screen':'#0d1419','signal':'#dc2626'}
fmt=lambda x:f'{x:.2f}'.rstrip('0').rstrip('.')
def p(x,y,z):return (S*A*(x+y),S*((x-y)/2-z))
def pts(vv):return ' '.join(','.join(fmt(v) for v in p(*v)) for v in vv)
def path(vv,color='#697078',sw=.45):return '<path d="M'+'L'.join(' '.join(fmt(x) for x in p(*v)) for v in vv)+f'" fill="none" stroke="{color}" stroke-width="{sw}"/>'
def poly(vv,color,sw=.45,stroke='#838990'):return f'<polygon points="{pts(vv)}" fill="{color}" stroke="{stroke}" stroke-width="{sw}"/>'
def transform(at):return f'translate({fmt(at[0])} {fmt(at[1])})'
shapes={}
def box(b):
 w,d,h=b['w'],b['d'],b['h'];key=(w,d,h,b['mat'])
 if key not in shapes:
  name='pf-box-'+str(len(shapes));x,y=-w/2,-d/2;color=palette.get(b['mat'],'#15191d')
  shape=poly([(x,y+d,0),(x+w,y+d,0),(x+w,y+d,h),(x,y+d,h)],color,stroke='#555d65')
  shape+=poly([(x+w,y,0),(x+w,y+d,0),(x+w,y+d,h),(x+w,y,h)],'#0d1013',stroke='#686f77')
  shape+=poly([(x,y,h),(x+w,y,h),(x+w,y+d,h),(x,y+d,h)],color,stroke='#838990')
  shape+=poly([(x,y,0),(x+w,y,0),(x+w,y,h),(x,y,h)],color,stroke='#899098')
  shapes[key]=(name,shape)
 return f'<use href="#{shapes[key][0]}" transform="{transform(p(b["x"],b["y"],b["z"]))}"/>'
def cylinder(c):
 axis=c['axis'];at=p(c['x'],c['y']-c['h'] if axis=='y' else c['y'],c['z']+c['h'] if axis=='z' else c['z'])
 r=c['r']*S;fill=palette.get(c['mat'],'#15191d')
 if axis=='y':return f'<g transform="{transform(at)} matrix({A} .5 0 1 0 0)"><circle r="{fmt(r)}" fill="{fill}" stroke="#899098" stroke-width=".42"/><circle r="{fmt(r*.69)}" fill="none" stroke="#555d65" stroke-width=".35"/></g>'
 return f'<ellipse cx="{fmt(at[0])}" cy="{fmt(at[1])}" rx="{fmt(r*sqrt(1.5))}" ry="{fmt(r/sqrt(2))}" fill="{fill}" stroke="#899098" stroke-width=".42"/>'
def lettering(t):
 x,y=p(*t['at']);size=t['size']*S
 matrix=f'matrix({A} .5 0 1 0 0)' if t['front'] else f'matrix({A} .5 {-A} .5 0 0)'
 return f'<g transform="translate({fmt(x)} {fmt(y)}) {matrix}"><text class="pf-engraving" font-size="{fmt(size)}">{escape(t["value"])}</text></g>'
panel=fire.Installation();panel.central(0,0,0)
body=''
for b in panel.boxes:
 if b['group'] is None:body+=box(b)
for c in panel.cylinders:
 if c.get('group') is None:body+=cylinder(c)
for line in panel.lines:
 if line.get('group') is None:body+=path(line['pts'],'#bb454c' if line['mat']=='red' else '#899098',max(.35,line['radius']*S*1.1))
for t in panel.texts:
 if t.get('group') is None:body+=lettering(t)
# Door has a physically defined hinge. Its back-side PCB replaces the front
# controls after the leaf turns away, rather than showing text through metal.
w,h=.52*S,.66*S
front=f'<rect x="0" y="-{h}" width="{w}" height="{h}" rx="1" fill="#111418" stroke="#a2a8af" stroke-width=".7"/><rect x="5" y="-{h-5}" width="{w-10}" height="{h-10}" fill="none" stroke="#555d65" stroke-width=".45"/>'
front+='<rect x="40" y="-237" width="154" height="102" fill="#101215" stroke="#81878e" stroke-width=".5"/><rect x="53" y="-224" width="128" height="57" fill="#0b1217" stroke="#555d65" stroke-width=".45"/>'
front+='<text x="65" y="-208" font-size="6.3" class="pf-label">SISTEMA NORMAL</text><text x="65" y="-194" font-size="4.7" class="pf-label">02 zonas / supervisadas</text><text x="65" y="-180" font-size="4.7" class="pf-label">Sin alarmas ni fallas</text>'
for i,label in enumerate(['Estado','Eventos','Prueba','Silenciar']):
 x=52+i*35;front+=f'<rect x="{x}" y="-155" width="23" height="9" rx="1" fill="#0a0c0e" stroke="#81878e" stroke-width=".4"/><text x="{x+1}" y="-141" font-size="4" class="pf-label">{label}</text><circle cx="{x+10}" cy="-125" r="1.5" fill="{ "#dc2626" if i==0 else "#697078"}"/>'
front+='<circle cx="216" cy="-110" r="4" fill="#15191d" stroke="#a2a8af" stroke-width=".55"/><path d="M216-113v6" stroke="#c4c7cc" stroke-width=".55"/>'
back=f'<rect x="0" y="-{h}" width="{w}" height="{h}" rx="1" fill="#111418" stroke="#a2a8af" stroke-width=".7"/><rect x="41" y="-235" width="146" height="90" fill="#101815" stroke="#81878e" stroke-width=".5"/>'
back+='<rect x="99" y="-201" width="28" height="28" fill="#0b0d10" stroke="#81878e" stroke-width=".45"/>'
for i in range(12):
 x=49+i*11;back+=f'<rect x="{x}" y="-229" width="4" height="5" fill="#646b73"/><rect x="{x}" y="-158" width="6" height="3" fill="#555d65"/><path d="M{x+2}-224v13h{113-x}v10" fill="none" stroke="#646b73" stroke-width=".3"/>'
for x in [46,182]:
 for y in [-230,-150]:back+=f'<circle cx="{x}" cy="{y}" r="1.7" fill="#111418" stroke="#a2a8af" stroke-width=".4"/>'
hinge=p(-.26,-.064,0)
body+=f'<g transform="{transform(hinge)}"><g class="pf-door" transform="matrix({A} .5 0 1 0 0)"><g class="pf-door-front">{front}</g><g class="pf-door-back" opacity="0">{back}</g></g></g>'
# Flexible conductors are updated with the door, in this same panel coordinate system.
for i in range(6):body+=f'<path class="pf-ribbon" data-conductor="{i}" fill="none" stroke="{ "#bb454c" if i==0 else "#7d858e"}" stroke-width=".5"/>'
body=f'<g class="pf-panel" data-discipline-node="3" data-pf-focus="3" transform="translate(643 435)">{body}</g>'
# Familiar detectors and notification hardware keep the same precise 30° axes.
old=ET.fromstring((OUT/'discipline-107-v1.svg').read_text());defs=old.find('{http://www.w3.org/2000/svg}defs')
needed={'ds-detector-base','ds-detector-cover'}
for _ in range(4):
 for el in defs:
  if el.get('id') in needed:
   for child in el.iter():
    href=child.get('href');
    if href and href.startswith('#'):needed.add(href[1:])
olddefs=''.join(ET.tostring(el,encoding='unicode') for el in defs if el.get('id') in needed)
# Prefix retained definitions to avoid collisions on home and sector pages.
olddefs=olddefs.replace('ds-','pf-detail-')
fragment=ET.fromstring('<svg xmlns="http://www.w3.org/2000/svg">'+olddefs+'</svg>')
for el in fragment.iter():
 for key in ['fill','stroke']:
  color=el.get(key,'')
  if not color.startswith('#'):continue
  if len(color)==4:color='#'+''.join(c*2 for c in color[1:])
  if len(color)!=7:continue
  r,g,b=[int(color[i:i+2],16) for i in (1,3,5)]
  red=r>g*1.25 and r>b*1.2 and r>95
  el.set(key,('#b83a3e' if red else '#111418') if key=='fill' else ('#bb454c' if red else '#81878e'))
olddefs=''.join(ET.tostring(el,encoding='unicode') for el in fragment)

for color in ['#aaa','#bbb','#a6b6c0','#a6b8c3']:olddefs=olddefs.replace(color,'#81878e')
# A source-built context plan, aligned to the equipment rather than another detector.
coverage='<g class="pf-context" data-discipline-node="0" data-pf-focus="0" transform="translate(150 76) matrix(.8660254 .5 -.8660254 .5 0 0)"><rect width="200" height="134" fill="#111316" stroke="#81878e" stroke-width=".75"/><path d="M118 0v53m0 30v51M0 63H118" fill="none" stroke="#a2a8af" stroke-width="1.3"/>'
for x,y in [(12,10),(63,10)]:coverage+=f'<rect x="{x}" y="{y}" width="40" height="20" fill="#191d22" stroke="#646b73" stroke-width=".65"/><rect x="{x+12}" y="{y+2}" width="17" height="5" fill="#111316" stroke="#899098" stroke-width=".45"/><circle cx="{x+20}" cy="{y+32}" r="7" fill="none" stroke="#646b73" stroke-width=".6"/>'
coverage+='<rect x="135" y="43" width="42" height="27" fill="#191d22" stroke="#646b73" stroke-width=".65"/><path d="M52 18H185V111H52Z" fill="none" stroke="#b13b44" stroke-width=".8"/>'
for x,y in [(52,46),(155,90)]:coverage+=f'<circle cx="{x}" cy="{y}" r="3" fill="#981b24" stroke="#c4c7cc" stroke-width=".5"/>'
coverage+='<text x="12" y="119" class="pf-label" font-size="8">02 ambientes / un sistema</text></g>'
detector='<g data-discipline-node="1" data-pf-focus="1"><g transform="translate(408 145) scale(.82)"><use href="#pf-detail-detector-base"/><g class="pf-detector-cover"><use href="#pf-detail-detector-cover"/></g></g>'
def field(x,y,kind):
 mat={'x':0,'y':0,'z':0,'w':.10,'d':.038,'h':.12,'mat':'red'}
 c=box(mat);px,py=p(-.041,-.020,.103)
 face='<rect width="36" height="39" fill="#121619" stroke="#899098" stroke-width=".6"/>'
 if kind=='manual':face+='<path d="M4 6l28 25M32 6L4 31M18 1v37M0 20h36" fill="none" stroke="#b6464e" stroke-width=".8"/>'
 else:
  face+='<rect x="1" y="1" width="34" height="9" fill="#bcc4cc" stroke="#a2a8af" stroke-width=".4"/>'
  for j in range(8):face+=f'<path d="M4 {14+j*3}h28" stroke="#a2a8af" stroke-width=".6"/>'
 c+=f'<g transform="translate({px} {py}) matrix({A} .5 0 1 0 0)">{face}</g>'
 return f'<g transform="translate({x} {y}) scale(1.8)">{c}</g>'
detector+=field(216,353,'manual')+'</g>'
sounder=f'<g data-discipline-node="4" data-pf-focus="4">{field(882,382,"siren")}</g>'
def connection(d,layers):return f'<g data-discipline-route="{layers}"><path class="ds-route" d="{d}" fill="none" stroke="#656d75" stroke-width=".65"/><path class="ds-packet" d="{d}" pathLength="100" fill="none" stroke="#dc2626" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="4 96"/></g>'
routes=connection('M609 178L537 137L455 184L357 240L250 302L182 263L181 235L363 130L462 73L570 136L618 164','1 2')+connection('M734 384L777 409L851 366','3 4')
# Backup is inside this panel, so its focus region identifies the actual cells.
backup='<rect x="567" y="379" width="124" height="105" fill="none" stroke="none" data-discipline-node="5" data-pf-focus="5"/>'
labels=''
for i,x,y,label in [(0,87,61,'Ambientes'),(1,315,50,'Detección'),(2,186,399,'Circuito supervisado'),(3,774,142,'Central'),(4,854,443,'Aviso'),(5,597,510,'Respaldo')]:
 labels+=f'<g class="pf-tag" data-discipline-tag="{i}"><text x="{x}" y="{y}"><tspan fill="#737d87">{i+1:02}</tspan><tspan dx="9">{label}</tspan></text></g>'
style='''
.pf-drawing{stroke-linecap:round;stroke-linejoin:round}
.pf-tag{font:16px Arial,sans-serif;fill:#bfc4ca}.pf-tag[data-current=true]{fill:#fff}
.pf-engraving,.pf-label{font-family:Arial,sans-serif;fill:#a2a8af;stroke:none}
.pf-door-front,.pf-door-back{transition:none}
'''
markup=f'<g data-discipline-drawing="107" class="ds-drawing pf-drawing"><svg class="pf-viewport" viewBox="0 0 1000 650" width="1000" height="650">{routes}{coverage}{detector}{body}{sounder}{backup}{labels}</svg></g>'
svg='<svg xmlns="http://www.w3.org/2000/svg" class="ds-svg" viewBox="0 0 1000 650" aria-hidden="true"><defs>'+olddefs+''.join(f'<g id="{name}">{shape}</g>' for name,shape in shapes.values())+'</defs><style>'+style+'</style>'+markup+'</svg>'
ET.fromstring(svg)
(OUT/'discipline-107-v2.svg').write_text(svg)
print(json.dumps({'bytes':len(svg),'gzip':len(gzip.compress(svg.encode())),'reused_shapes':len(shapes),'measured_panel_boxes':len(panel.boxes)}))
