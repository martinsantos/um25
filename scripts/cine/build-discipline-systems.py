"""Build service-system drawings from the shared 30 degree equipment geometry.
Only referenced definitions are retained; the visible SVG needs no browser library.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import re
ROOT=Path(__file__).resolve().parents[2]
ET.register_namespace('', 'http://www.w3.org/2000/svg')
rack=ET.fromstring((ROOT/'src/assets/cine/isometric/network-rack-v10.svg').read_text())
source={e.attrib['id']:ET.tostring(e,encoding='unicode') for e in rack.find('{http://www.w3.org/2000/svg}defs') if 'id' in e.attrib}
needed=set()
def include(key):
    if key in needed:return
    needed.add(key)
    for child in re.findall(r'href="#([^"]+)"',source[key]):include(child)
def use(part,x,y,scale=.3,layer=0,opened=False):
    for suffix in ('base','cover'):include(f'rk-{part}-{suffix}')
    return f'<g data-discipline-node="{layer}" class="ds-node"><g transform="translate({x} {y}) scale({scale})"><use href="#ds-{part}-base"/><g class="ds-cover" style="--ds-lift:-55px"><use href="#ds-{part}-cover"/></g></g></g>'
def tag(index,x,y):
    return f'<g class="ds-tag" data-discipline-tag="{index}"><circle cx="{x}" cy="{y}" r="19" fill="#0c1117" stroke="#83939e" stroke-width="1"/><text x="{x}" y="{y+1}" dominant-baseline="middle" text-anchor="middle" fill="#e8edf0" font-family="Arial,sans-serif" font-size="22">{index+1:02}</text></g>'
def route(path,layers='all',dashed=False):
    return f'<g data-discipline-route="{layers}"><path d="{path}" class="ds-route" fill="none" stroke="#71818e" stroke-width="1.3" {"stroke-dasharray=\"5 7\"" if dashed else ""}/><path d="{path}" pathLength="100" class="ds-packet" fill="none" stroke="#ec4141" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 97"/></g>'
def plane(content,x,y,layer,w=240,h=160):
    # UI surfaces share the exact orthographic basis with the equipment.
    return f'<g class="ds-node" data-discipline-node="{layer}"><g transform="translate({x} {y})"><path d="M0 0L{w*.866} {w*.5}L{(w-h)*.866} {(w+h)*.5}L{-h*.866} {h*.5}Z" fill="#303b45" stroke="#99a9b4"/><g class="ds-cover" style="--ds-lift:-12px" transform="translate(0 -8)"><g transform="matrix(.8660254 .5 -.8660254 .5 0 0)" fill="none"><rect width="{w}" height="{h}" fill="#111923" stroke="#d2dbe2" stroke-width="1.3"/>{content}</g></g></g></g>'
def app(x,y,layer):
    content='<path d="M0 27H240M43 27V160" stroke="#71818e"/>'
    content+=''.join(f'<circle cx="{12+i*10}" cy="13" r="2.2" fill="#b5c3cb"/>' for i in range(3))
    content+='<rect x="192" y="9" width="32" height="9" fill="#dc2626"/>'
    content+=''.join(f'<path d="M10 {45+i*18}H32" stroke="#8c9da8" stroke-width="2"/>' for i in range(5))
    content+='<rect x="56" y="41" width="169" height="31" fill="#24313f"/><path d="M65 57H101M117 57H144M163 57H211" stroke="#dee4e9" stroke-width="3"/>'
    content+=''.join(f'<path d="M56 {87+i*17}H225" stroke="#5d6c78"/><rect x="60" y="{80+i*17}" width="4" height="4" fill="#bbc8d0"/><path d="M77 {82+i*17}H145M163 {82+i*17}H208" stroke="#a4b3bd" stroke-width="2"/>' for i in range(4))
    return plane(content,x,y,layer)
def logic(x,y,layer):
    content='<path d="M35 77H90M116 77H193M104 77V32H175M104 77V126H175" stroke="#b1c1cc" stroke-width="2"/>'
    for cx,cy in [(16,60),(90,60),(175,15),(175,60),(175,110)]:
        content+=f'<rect x="{cx}" y="{cy}" width="32" height="30" fill="#263440" stroke="#afc0cb"/><path d="M{cx+7} {cy+10}H{cx+24}M{cx+7} {cy+18}H{cx+20}" stroke="#dc2626"/>'
    return plane(content,x,y,layer)
def api(x,y,layer):
    content='<path d="M52 50H191V117H52Z" fill="none" stroke="#99aebc" stroke-width="2"/>'
    for cx,cy in [(15,25),(153,25),(15,99),(153,99)]:
        content+=f'<rect x="{cx}" y="{cy}" width="71" height="38" fill="#1e2b36" stroke="#a8bcc9"/><path d="M{cx+10} {cy+12}H{cx+47}M{cx+10} {cy+22}H{cx+61}" stroke="#bdc9d1"/>'
        content+=''.join(f'<rect x="{cx+10+j*8}" y="{cy+33}" width="4" height="9" fill="#dc2626"/>' for j in range(5))
    return plane(content,x,y,layer)
def data(x,y,layer):
    content=''
    for cx,cy in [(53,64),(169,88),(108,39)]:
        content+=f'<path d="M{cx-26} {cy}v47a26 12 0 0 0 52 0v-47" fill="#2b3d4b" stroke="#adbfcb"/>'
        for dy in [15,31,47]:content+=f'<path d="M{cx-26} {cy+dy}a26 12 0 0 0 52 0" fill="none" stroke="#829cae"/>'
        content+=f'<ellipse cx="{cx}" cy="{cy}" rx="26" ry="12" fill="#18232d" stroke="#cfdae2"/><circle cx="{cx+12}" cy="{cy+34}" r="2.5" fill="#dc2626"/>'
    # Cylinders are drawn in screen space on an isometric tray, not skewed twice.
    return plane(content,x,y,layer)
def deploy(x,y,layer):
    content='<path d="M15 79H226" stroke="#dc2626" stroke-width="2"/>'
    for i in range(3):
        xx=16+i*75
        content+=f'<rect x="{xx}" y="36" width="57" height="64" fill="#263643" stroke="#c0cdd6"/><path d="M{xx} 53H{xx+57}" stroke="#7b94a4"/>'
        for j in range(4):content+=f'<path d="M{xx+10} {65+j*7}H{xx+45}" stroke="#8c9faa"/>'
        content+=f'<circle cx="{xx+45}" cy="44" r="3" fill="#dc2626"/>'
    content+='<path d="M22 131H215" stroke="#95a8b5" stroke-width="2"/><path d="M49 105V131M123 105V131M197 105V131" stroke="#95a8b5"/>'
    return plane(content,x,y,layer)
def point(x,y,z):return f'{(x-y)*.8660254:.2f},{(x+y)*.5-z:.2f}'
def box(x,y,z,w,d,h,front='#7c262b',side='#451a21',top='#ad484b'):
    faces=[([(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],top),([(x,y+d,z),(x+w,y+d,z),(x+w,y+d,z+h),(x,y+d,z+h)],front),([(x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h)],side)]
    return ''.join('<polygon points="'+' '.join(point(*v) for v in points)+f'" fill="{color}" stroke="#a6b6c0" stroke-width=".8"/>' for points,color in faces)
def field_panel(x,y,layer,kind):
    c=box(0,0,0,104,32,125)
    face='<rect x="10" y="10" width="84" height="105" rx="3" fill="none" stroke="#daa6aa"/>'
    if kind=='manual':face+='<rect x="19" y="32" width="66" height="57" fill="#d9e0e4" stroke="#eee"/><path d="M23 74H80M52 38V82M41 52L52 63L63 52" fill="none" stroke="#943139" stroke-width="2"/>'
    else:
        face+='<rect x="18" y="15" width="68" height="20" rx="5" fill="#e8edf2" stroke="#fff"/>'
        face+=''.join(f'<path d="M21 {47+i*7}H83" stroke="#301820" stroke-width="3"/>' for i in range(8))
    for xx,yy in [(8,8),(96,8),(8,117),(96,117)]:face+=f'<circle cx="{xx}" cy="{yy}" r="2" fill="#c9d0d5"/>'
    c+=f'<g transform="translate(-27.7128 -109) matrix(.8660254 .5 0 1 0 0)">{face}</g>'
    return f'<g class="ds-node" data-discipline-node="{layer}" transform="translate({x} {y})">{c}</g>'
def batteries(x,y,layer):
    c=''
    for xx in [0,94]:
        c+=box(xx,0,0,77,48,88,'#202b34','#111a21','#394953')
        for tx,fill in [(xx+12,'#cc343c'),(xx+60,'#b9c5cf')]:
            c+=box(tx,9,88,8,8,7,fill,fill,fill)
        c+=f'<g transform="translate({(xx-48)*.8660254:.3f} {(xx+48)*.5-60:.3f}) matrix(.8660254 .5 0 1 0 0)"><rect x="10" width="56" height="25" fill="#b8c4ce"/><path d="M17 8H57M17 15H40" stroke="#324550" stroke-width="2"/></g>'
    c+=f'<path d="M{point(16,13,95)}Q70,-140 {point(154,13,95)}" fill="none" stroke="#cb343b" stroke-width="3"/>'
    return f'<g class="ds-node" data-discipline-node="{layer}" transform="translate({x} {y})">{c}</g>'

def drawing(code,body):
    return f'<g data-discipline-drawing="{code}" class="ds-drawing"><g transform="translate(60 30) scale(.88)">{body}</g></g>'
# Telecom: alternatives converge at the network edge, then support actual uses.
tele=''.join([route('M160 238L160 270L470 270','0 1'),route('M470 270L580 206','1 2'),route('M470 270L775 270L850 225','1 2',True),route('M470 270L315 360L315 435','2 3'),route('M315 435L535 562L750 438','3 4 5')])
tele+=app(160,100,0)+use('fiber',490,190,.33,1)+use('radio',810,215,.62,1)+use('optic',570,320,1.0,2)+use('router',260,440,.4,3)+app(540,450,4)+logic(825,385,5)
tele+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(85,94),(465,82),(625,300),(125,411),(473,419),(848,350)]))
# Fire: a supervised return path; signaling and backup are separate branches.
fire=route('M260 166L80 270L320 408L535 284L690 195L450 57L260 166','1 2')
fire+=route('M535 284L715 388L854 308','3 4')+route('M338 500L520 395L535 284','5')
fire+=use('detector',240,145,.85,0)+use('detector',460,55,.65,1)+field_panel(100,345,1,'manual')+use('central',535,324,.53,3)+field_panel(843,350,4,'siren')+batteries(300,536,5)
fire+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(153,102),(48,280),(121,210),(548,179),(882,216),(258,447)]))
# Software is an application architecture. There is deliberately no building.
soft=route('M180 242L335 331L500 236','0 1')+route('M500 236L635 314L818 208','1 2')+route('M818 208L929 272L929 433L840 484','2 3')+route('M840 484L710 559L523 451','3 4')+route('M523 451L385 531L209 429','4 5')
soft+=app(170,106,0)+logic(500,96,1)+api(825,99,2)+data(825,407,3)+deploy(505,397,4)+use('server',200,437,.40,5)
soft+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(90,76),(420,67),(749,72),(910,392),(588,382),(73,388)]))
all_drawings=drawing('103',tele)+drawing('107',fire)+drawing('104',soft)
definitions=''.join(source[key].replace('rk-','ds-') for key in source if key in needed)
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" class="ds-svg" aria-hidden="true"><defs>{definitions}</defs>{all_drawings}</svg>'
(ROOT/'src/assets/cine/isometric/discipline-systems-v1.svg').write_text(svg)
print(f'Wrote {len(svg):,} bytes; {len(needed)} shared definitions, 3 connected discipline drawings.')
