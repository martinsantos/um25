"""Build service-system drawings from the shared 30 degree equipment geometry.
Only referenced definitions are retained; the visible SVG needs no browser library.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import re, json, math
ROOT=Path(__file__).resolve().parents[2]
ET.register_namespace('', 'http://www.w3.org/2000/svg')
rack=ET.fromstring((ROOT/'src/assets/cine/isometric/network-rack-v10.svg').read_text())
source={e.attrib['id']:ET.tostring(e,encoding='unicode') for e in rack.find('{http://www.w3.org/2000/svg}defs') if 'id' in e.attrib}
needed=set()
models={m['id']:m for m in json.loads((ROOT/'src/assets/cine/isometric/network-rack-v10.json').read_text())['models']}
def include(key):
    if key in needed:return
    needed.add(key)
    for child in re.findall(r'href="#([^"]+)"',source[key]):include(child)
def use(part,x,y,scale=.3,layer=0,opened=False):
    for suffix in ('base','cover'):include(f'rk-{part}-{suffix}')
    lift=models[part]['lift']
    return f'<g data-discipline-node="{layer}" class="ds-node"><g transform="translate({x} {y}) scale({scale})"><use href="#ds-{part}-base"/><g class="ds-cover" style="--ds-lift:{lift[1]}px;--ds-lift-x:{lift[0]}px"><use href="#ds-{part}-cover"/></g></g></g>'
def tag(index,x,y):
    return f'<g class="ds-tag" data-discipline-tag="{index}"><circle cx="{x}" cy="{y}" r="19" fill="#0c1117" stroke="#83939e" stroke-width="1"/><text x="{x}" y="{y+1}" dominant-baseline="middle" text-anchor="middle" fill="#e8edf0" font-family="Arial,sans-serif" font-size="22">{index+1:02}</text></g>'
def route(path,layers='all',dashed=False):
    dash='stroke-dasharray="5 7"' if dashed else ''
    return f'<g data-discipline-route="{layers}"><path d="{path}" class="ds-route" fill="none" stroke="#71818e" stroke-width="1.3" {dash}/><path d="{path}" pathLength="100" class="ds-packet" fill="none" stroke="#ec4141" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 97"/></g>'

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
    # Storage volumes stand vertically on the tray. Applying the UI-plane matrix
    # to a cylinder would incorrectly shear its vertical axis.
    c='<path d="M0 0L208 120L69 200L-139 80Z" fill="#152330" stroke="#8ea5b5"/>'
    for px,py in [(70,43),(169,55),(118,118)]:
        cx=(px-py)*.8660254;cy=(px+py)*.5;rx=33;ry=rx/math.sqrt(3);height=73
        c+=f'<path d="M{cx-rx} {cy-height}v{height}a{rx} {ry} 0 0 0 {rx*2} 0v{-height}" fill="#273d4d" stroke="#a5b9c7"/>'
        for dz in [18,36,54]:c+=f'<path d="M{cx-rx} {cy-dz}a{rx} {ry} 0 0 0 {rx*2} 0" fill="none" stroke="#839bab"/>'
        c+=f'<g class="ds-cover" style="--ds-lift:-12px"><ellipse cx="{cx}" cy="{cy-height}" rx="{rx}" ry="{ry}" fill="#445f73" stroke="#c4d0d9"/><ellipse cx="{cx}" cy="{cy-height}" rx="{rx*.67}" ry="{ry*.67}" fill="#1b2c3a" stroke="#6e8a9e"/></g><circle cx="{cx+10}" cy="{cy-10}" r="2" fill="#dc2626"/>'
    return f'<g class="ds-node" data-discipline-node="{layer}"><g transform="translate({x} {y})">{c}</g></g>'

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

# Small supporting objects use the same axes, materials and precision as hardware.
def workstation(x,y,layer):
    c=box(0,0,0,160,95,7,'#516371','#263744','#91a2ad')
    c+=box(67,25,7,26,18,60,'#415563','#243541','#8297a7')
    c+=box(9,16,58,143,10,93,'#253644','#101b26','#8d9eaa')
    face='<rect width="130" height="77" fill="#101a24" stroke="#7f96a7"/><path d="M0 16H130M24 16V77" stroke="#4a6376"/><rect x="33" y="25" width="87" height="13" fill="#40596b"/>'
    face+=''.join(f'<path d="M35 {49+j*9}H116" stroke="#93a7b5"/>' for j in range(3))
    c+=f'<g transform="translate(-9 -130) matrix(.8660254 .5 0 1 0 0)">{face}</g>'
    # A keyboard with individual key rows, in the horizontal plane.
    keyboard='<rect width="108" height="30" fill="#364b5b" stroke="#b0bdc6"/>'
    keyboard+=''.join(f'<rect x="{4+i*9}" y="{3+j*8}" width="6" height="5" fill="#9faeba"/>' for j in range(3) for i in range(11))
    c+=f'<g transform="translate(-39 46) matrix(.8660254 .5 -.8660254 .5 0 0)">{keyboard}</g>'
    return f'<g class="ds-node" data-discipline-node="{layer}" transform="translate({x} {y})">{c}</g>'
def cabinet(x,y,layer):
    c=box(0,0,0,250,170,12,'#1d2c38','#101a24','#536877')
    c+=box(0,0,330,250,170,9,'#425664','#263b4a','#8a9ca8')
    for xx,yy in [(0,0),(242,0),(0,162),(242,162)]:
        c+=box(xx,yy,12,8,8,318,'#627785','#354a5a','#adc0cb')
        # Equal-pitch mounting holes on the front two rails.
        if yy==162:
            for z in range(28,326,12):
                c+=f'<circle cx="{(xx-yy+4)*.866:.2f}" cy="{(xx+yy+4)*.5-z:.2f}" r="1.4" fill="#0c1721"/>'
    # Door is articulated as one frame, not an opaque face obscuring the equipment.
    door='<path d="M0 0H244V313H0Z M12 13H232V300H12Z" fill="#526777" fill-rule="evenodd" stroke="#a6b8c3"/>'
    for yy in range(23,296,9):door+=f'<path d="M16 {yy}H228" stroke="#8296a5" stroke-opacity=".16"/>'
    door+='<rect x="221" y="135" width="6" height="39" rx="2" fill="#a4b6c2"/>'
    c+=f'<g class="ds-cover" style="--ds-lift:52px;--ds-lift-x:-90px"><g transform="translate(-147.22 -229) matrix(.8660254 .5 0 1 0 0)">{door}</g></g>'
    return f'<g class="ds-node" data-discipline-node="{layer}"><g transform="translate({x} {y}) scale(.72)">{c}</g></g>'
def tray(x,y,layer):
    c=''
    for yy in [0,50]:c+=box(0,yy,0,265,5,14,'#708593','#3a4e60','#aec0ce')
    for xx in range(0,266,19):c+=box(xx,0,0,5,55,4,'#8296a4','#526b7a','#b0c1cd')
    for i in range(4):
        c+=f'<path d="M{point(0,13+i*7,7)}L{point(260,13+i*7,7)}" fill="none" stroke="{["#ca3c43","#879eac","#687f95","#c3ccd2"][i]}" stroke-width="2"/>'
    return f'<g class="ds-node" data-discipline-node="{layer}" transform="translate({x} {y})">{c}</g>'
def report(x,y,layer,kind='records'):
    content='<path d="M16 24H132M16 36H81" stroke="#c5d1da" stroke-width="3"/>'
    if kind=='scope':
        for i in range(4):
            yy=58+i*23
            content+=f'<path d="M17 {yy}H212" stroke="#466072"/><rect x="{50+i*31}" y="{yy-6}" width="54" height="12" fill="#617f94" stroke="#b2c3ce"/>'
    elif kind=='signal':
        content+='<path d="M15 126H225M15 52V126" stroke="#819baa"/><path d="M15 105L36 103L53 97L66 104L79 72L94 95L109 91L128 49L143 88L156 77L174 90L190 82L209 90L225 69" fill="none" stroke="#dc2626" stroke-width="2"/>'
    elif kind=='risk':
        for i in range(4):
            for j in range(5):content+=f'<rect x="{19+j*39}" y="{52+i*23}" width="33" height="18" fill="{["#3e5668","#627a8a","#98434a"][min(2,(i+j)//3)]}" stroke="#889eae" stroke-width=".5"/>'
    elif kind=='compare':
        for i in range(3):
            xx=18+i*73
            content+=f'<rect x="{xx}" y="52" width="61" height="90" fill="#263e50" stroke="#9fb4c2"/>'
            for j in range(4):content+=f'<path d="M{xx+10} {65+j*18}H{xx+48}" stroke="#acbeca" stroke-width="2"/>'
            content+=f'<path d="M{xx+10} 133H{xx+31+i*6}" stroke="#dc2626" stroke-width="3"/>'
    else:
        for i in range(5):
            yy=55+i*19
            content+=f'<rect x="17" y="{yy-4}" width="7" height="7" fill="none" stroke="#c4d0d9"/><path d="M36 {yy}H{182-i*7}M190 {yy}H221" stroke="#98afbf" stroke-width="2"/>'
    return plane(content,x,y,layer)
def distribution(x,y,layer):
    c=box(0,0,0,140,65,175,'#617987','#2c4050','#a2b3bf')
    face='<rect x="9" y="9" width="122" height="157" fill="#122331" stroke="#95aaba"/>'
    for i in range(4):
        xx=18+i*27
        face+=f'<rect x="{xx}" y="34" width="21" height="55" fill="#c4ced6" stroke="#edf1f4"/><rect x="{xx+5}" y="48" width="11" height="17" fill="#233b4d"/><path d="M{xx+4} 77H{xx+17}" stroke="#ac3e47" stroke-width="2"/>'
    face+='<path d="M16 108H124M16 138H124" stroke="#c28155" stroke-width="3"/>'
    face+=''.join(f'<circle cx="{23+i*18}" cy="138" r="3" fill="#bdcad4"/>' for i in range(6))
    c+=f'<g transform="translate(-56.29 -142.5) matrix(.8660254 .5 0 1 0 0)">{face}</g>'
    return f'<g class="ds-node" data-discipline-node="{layer}" transform="translate({x} {y})">{c}</g>'
# Networks: an actual distribution cabinet anchors the whole topology.
net=route('M160 195L160 274L352 274L477 346','0 1 2')+route('M477 346L477 396L730 396L851 326','2 3 4')+route('M730 396L730 466L797 505','3 5')
net+=cabinet(482,337,2)+workstation(125,188,0)+tray(250,216,1)+use('panel',475,252,.26,2)+use('switch',479,322,.27,3)+use('router',479,372,.26,3)+use('access',820,299,.92,4)+report(788,452,5)
net+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(54,109),(248,176),(388,136),(392,353),(831,202),(850,437)]))
# Security: two inputs converge on transport; recording and supervision are downstream.
security=route('M137 190L330 302L513 197','0 1 2')+route('M330 302L440 365L650 365L805 276','2 3 4')+route('M650 365L650 447L477 547','3 5')
security+=use('camera',161,171,.76,0)+use('dome',385,121,.76,1)+use('reader',137,375,.85,1)+use('switch',508,213,.39,2)+use('server',556,380,.43,3)+workstation(844,304,4)+report(470,441,5)
security+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(107,65),(50,296),(563,92),(617,352),(866,174),(387,430)]))
# Power: the normal supply, protected path and load remain distinct branches.
energy=route('M190 190L340 277L505 182','0 1')+route('M505 182L722 307L857 229','1 2')+route('M857 229L940 277L940 410L813 483','2 3')+route('M813 483L650 577L506 494L506 177','3 4')+route('M506 494L340 494L220 424','4 5',True)
energy+=workstation(160,202,0)+distribution(504,235,1)+use('ups',794,245,.50,2)+use('pdu',814,455,.44,3)+use('server',500,453,.41,4)+report(182,368,5,'signal')
energy+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(62,114),(520,101),(833,120),(914,423),(535,349),(100,340)]))
# Support: evidence enters a case; diagnosis tests separate equipment dependencies.
support=route('M175 212L320 296L495 195','0 1')+route('M495 195L653 286L813 194','1 2')+route('M813 194L914 252L914 348L785 422','2 3')+route('M785 422L680 483L510 385','3 4')+route('M510 385L510 490L345 585L175 487','4 5')
support+=workstation(144,194,0)+report(485,80,1)+report(817,80,2,'risk')+use('router',794,422,.38,3)+use('optic',883,359,.75,3)+workstation(487,414,4)+report(175,384,5)
support+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(66,105),(398,60),(749,58),(861,310),(416,309),(88,361)]))
# Consulting: the surveyed equipment becomes a dependency map and a staged plan.
consult=route('M190 221L335 305L503 208','0 1')+route('M503 208L651 293L815 198','1 2')+route('M815 198L935 267L935 431L817 499','2 3')+route('M817 499L655 592L510 508','3 4')+route('M510 508L346 603L181 508','4 5')
consult+=workstation(145,184,0)+use('server',512,226,.30,1)+use('router',500,145,.27,1)+use('optic',371,197,.65,1)+report(817,83,2,'risk')+report(817,398,3,'compare')+report(510,402,4,'scope')+report(183,396,5)
consult+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(71,96),(546,78),(745,54),(901,383),(598,388),(96,372)]))
# Software control dependencies are not a serial part of the application request.
soft=route('M180 242L335 331L500 236','0 1')+route('M500 236L635 314L818 208','1 2')+route('M818 208L929 272L929 433L840 484','2 3')+route('M523 451L523 340L500 236','4',True)+route('M209 429L209 350L180 242','5',True)+route('M523 451L385 531L209 429','4 5',True)
soft+=app(170,106,0)+logic(500,96,1)+api(825,99,2)+data(825,407,3)+deploy(505,397,4)+use('server',200,437,.40,5)
soft+=''.join(tag(i,x,y) for i,(x,y) in enumerate([(90,76),(420,67),(749,72),(910,392),(588,382),(73,388)]))
all_drawings=''.join(drawing(code,body) for code,body in [('101',net),('102',security),('103',tele),('104',soft),('105',support),('106',consult),('107',fire),('108',energy)])

definitions=''.join(source[key].replace('rk-','ds-') for key in source if key in needed)
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" class="ds-svg" aria-hidden="true"><defs>{definitions}</defs>{all_drawings}</svg>'
(ROOT/'src/assets/cine/isometric/discipline-systems-v1.svg').write_text(svg)
print(f'Wrote {len(svg):,} bytes; {len(needed)} shared definitions, 8 connected discipline drawings.')
# Service pages carry only their own diagram and its recursively referenced geometry.
# Multi-service stories share the combined symbol table once.
parsed=ET.fromstring(svg)
ns='{http://www.w3.org/2000/svg}'
shared={e.attrib['id']:e for e in parsed.find(ns+'defs')}
for item in parsed.findall(ns+'g'):
    code=item.attrib['data-discipline-drawing']
    body=ET.tostring(item,encoding='unicode')
    keep=set()
    def retain(key):
        if key in keep:return
        keep.add(key)
        for ref in re.findall(r'href="#([^"]+)"',ET.tostring(shared[key],encoding='unicode')):retain(ref)
    for ref in re.findall(r'href="#([^"]+)"',body):retain(ref)
    definitions=''.join(ET.tostring(node,encoding='unicode') for key,node in shared.items() if key in keep)
    result=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" class="ds-svg" aria-hidden="true"><defs>{definitions}</defs>{body}</svg>'
    (ROOT/f'src/assets/cine/isometric/discipline-{code}-v1.svg').write_text(result)
    print(f'{code}: {len(result):,} bytes; {len(keep)} definitions')
