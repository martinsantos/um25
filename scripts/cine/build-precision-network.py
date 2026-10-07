"""Author a 30-degree technical cabinet, its connections and inspection details.
Pure vector geometry: deterministic, no raster textures or browser dependency.
Units are drawing units. Detail explains construction; it is not a vendor CAD file.
"""
from pathlib import Path
from math import cos, sin, pi, sqrt
from html import escape
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/assets/cine/isometric'
A = sqrt(3) / 2
PALETTE = {'face':'#111316','top':'#181b1f','side':'#0d0f11','edge':'#81878e','seam':'#41464d','fine':'#646b73','light':'#c4c7cc','red':'#dc2626'}

def fmt(v): return f'{v:.2f}'.rstrip('0').rstrip('.')
def pt(x,y,z=0): return (A*(x-y), (x+y)/2-z)
def xy(p): return ' '.join(fmt(v) for v in p)
def points(ps): return ' '.join(','.join(fmt(v) for v in pt(*p)) for p in ps)
def line(ps, stroke='seam', width=.65, close=False, fill='none', cls='', extra=''):
    coords=[pt(*p) for p in ps]
    d='M'+xy(coords[0])+''.join('L'+xy(p) for p in coords[1:])+('Z' if close else '')
    return f'<path d="{d}" stroke="{PALETTE.get(stroke,stroke)}" stroke-width="{width}" fill="{PALETTE.get(fill,fill)}" class="{cls}" {extra}/>'
def face(ps,fill='face',stroke='edge',width=.7):return line(ps,stroke,width,True,fill)
def box(x,y,z,w,d,h,edge='edge'):
    return face([(x,y+d,z),(x+w,y+d,z),(x+w,y+d,z+h),(x,y+d,z+h)],'face',edge)+face([(x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h)],'side',edge)+face([(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],'top',edge)
def circle3(x,y,z,r,plane='top',stroke='fine',width=.6,fill='none'):
    ps=[]
    for i in range(33):
        a=2*pi*i/32
        ps.append((x+r*cos(a),y+r*sin(a),z) if plane=='top' else (x+r*cos(a),y,z+r*sin(a)))
    return line(ps,stroke,width,True,fill)
def rect_front(x,y,z,w,h,stroke='fine',fill='none',width=.6):
    return face([(x,y,z),(x+w,y,z),(x+w,y,z+h),(x,y,z+h)],fill,stroke,width)
def screw(x,y,z,r=1.4,plane='front'):
    c=circle3(x,y,z,r,plane,'fine',.55,'side')
    if plane=='front':c+=line([(x-r*.48,y,z),(x+r*.48,y,z)],'light',.45)
    else:c+=line([(x-r*.5,y,z),(x+r*.5,y,z)],'light',.45)
    return c

def top_grid(x,y,z,w,d,spacing=12):
    return ''.join(line([(x+i,y,z),(x+i,y+d,z)],'seam',.4) for i in range(0,int(w)+1,spacing))+''.join(line([(x,y+j,z),(x+w,y+j,z)],'seam',.4) for j in range(0,int(d)+1,spacing))
def front_plane(x,y,z,body):
    p=pt(x,y,z)
    return f'<g transform="translate({xy(p)}) matrix({A} .5 0 1 0 0)">{body}</g>'
def top_plane(x,y,z,body):
    p=pt(x,y,z)
    return f'<g transform="translate({xy(p)}) matrix({A} .5 {-A} .5 0 0)">{body}</g>'
def group(content,cls='',layer=None,extra=''):
    attrs=f'data-discipline-node="{layer}"' if layer is not None else ''
    return f'<g class="{cls}" {attrs} {extra}>{content}</g>'
def tag(i,x,y,label,side='left'):
    # Number and brief label are readable annotations; part engraving is geometry.
    anchor='end' if side=='left' else 'start'
    dx=-12 if side=='left' else 12
    return f'<g class="pn-tag" data-discipline-tag="{i}"><path d="M{x} {y-4}v8" stroke="currentColor"/><text x="{x+dx}" y="{y}" dominant-baseline="middle" text-anchor="{anchor}"><tspan class="pn-tag__number">{i+1:02}</tspan><tspan dx="8">{label}</tspan></text></g>'
def route(ps,layers,kind='data'):
    base=line(ps,'seam',1.0,cls='pn-route')
    active=line(ps,'red',1.3,cls='pn-signal',extra='pathLength="100" stroke-dasharray="8 92"')
    return f'<g data-discipline-route="{layers}" class="pn-link pn-link--{kind}">{base}{active}</g>'

def rj45(x,y,z):
    c=rect_front(x,y,z,7.5,6.0,'fine','side',.6)
    c+=rect_front(x+.9,y+.06,z+.8,5.7,4.1,'seam','side',.4)
    c+=rect_front(x+2.6,y+.1,z+4.8,2.2,1.3,'seam','side',.35)
    for n in range(8):c+=line([(x+1.35+n*.63,y+.12,z+1.1),(x+1.35+n*.63,y+.12,z+2.6)],'fine',.28)
    return c

def rack_device(z,kind):
    # 19-inch ears, recessed connector bank and return folds.
    h=13 if kind!='ups' else 37
    c=box(10,28,z,140,99,h)
    c+=rect_front(6,128,z,148,h,'edge','face',.8)
    c+=rect_front(15,128.08,z+1.5,130,h-3,'seam','none',.5)
    for x in (9,151):
        for dz in (3,h-3):c+=screw(x,128.2,z+dz,1)
    if kind in ('patch','switch'):
        for n in range(12):
            x=18+n*9.1
            c+=rj45(x,128.3,z+3)
            c+=front_plane(x+.4,128.35,z+11,f'<text class="pn-engraving" font-size="2.9">{n+1:02}</text>')
            if kind=='switch':c+=rect_front(x+5.8,128.4,z+10,1.1,1.0,'red','red',.2)
        if kind=='switch':
            for n in range(2):c+=rect_front(131+n*6,128.3,z+3,4.2,6.5,'fine','side',.5)
        else:
            c+=front_plane(132,128.35,z+8,'<text class="pn-engraving" font-size="3.1">CAT6A</text>')
    elif kind=='fiber':
        for n in range(6):
            x=21+n*17
            c+=rect_front(x,128.3,z+3,11,6,'fine','side',.65)
            for k in range(2):c+=rect_front(x+1.6+k*4.9,128.4,z+4.0,3.1,4,'light','side',.5)
            c+=front_plane(x,128.35,z+11,f'<text class="pn-engraving" font-size="2.8">{n*2+1:02} / {n*2+2:02}</text>')
        c+=rect_front(133,128.35,z+4,7,4,'seam','none',.5)
    elif kind=='router':
        for n in range(4):c+=rj45(21+n*13,128.3,z+3)
        c+=front_plane(90,128.35,z+8,'<text class="pn-engraving" font-size="3.1">CORE / GATEWAY</text>')
        for n in range(9):c+=line([(94+n*4,129,z+2.5),(94+n*4,129,z+4.5)],'seam',.6)
    elif kind=='ups':
        for n in range(23):c+=line([(19+n*3.3,128.2,z+8),(19+n*3.3,128.2,z+29)],'fine',.48)
        c+=rect_front(105,128.3,z+11,25,15,'edge','side',.6)
        c+=front_plane(109,128.4,z+20,'<text class="pn-engraving" font-size="5.1" fill="#c4c7cc">230 V</text>')
        c+=circle3(139,128.3,z+19,2.1,'front','fine',.6)
    return c

def circuit_board(z):
    c=box(18,37,z,122,81,1,'seam')
    # Routes meet pads; buses stay parallel and turn on a 45-degree chamfer.
    for i in range(16):
        x=23+i*6.8
        c+=line([(x,114,z+1.2),(x,103,z+1.2),(74+(i-8)*1.25,80+(i%3),z+1.2)],'fine',.42)
        c+=circle3(x,114,z+1.3,.65,'top','light',.35)
    c+=box(62,58,z+1,27,23,4,'edge')
    for i in range(9):c+=box(63+i*2.8,59,z+5,1,21,4,'fine')
    for i in range(4):
        c+=box(100,43+i*16,z+1,25,10,2,'fine')
        for n in range(9):
            c+=line([(101+n*2.5,41+i*16,z+1),(101+n*2.5,43+i*16,z+1)],'fine',.45)
            c+=line([(101+n*2.5,53+i*16,z+1),(101+n*2.5,55+i*16,z+1)],'fine',.45)
    for x,y in [(25,44),(25,66),(46,46),(46,64),(29,94)]:c+=circle3(x,y,z+3,2.6,'top','fine',.5,'face')
    for x in (22,134):
        for y in (41,111):c+=screw(x,y,z+2,1.2,'top')
    return c

def cabinet():
    c=''
    # Rear panel, seams and fasteners retain depth without pale slabs.
    c+=box(0,0,10,160,3,264,'seam')
    c+=box(157,0,10,3,124,264,'seam')
    c+=face([(160,8,22),(160,116,22),(160,116,261),(160,8,261)],'side','seam',.65)
    c+=line([(160,12,26),(160,112,26),(160,112,256),(160,12,256),(160,12,26)],'fine',.55)
    for z in range(42,85,4):c+=line([(160,25,z),(160,95,z)],'seam',.5)
    for y in (14,109):
        for z in (29,252):c+=screw(160,y,z,1,'top')
    c+=box(0,0,7,160,130,5)
    roof=box(0,0,273,160,130,5)
    roof+=top_grid(9,10,278.1,142,108,18)
    for x in (51,109):
        for r in (5,13,21):roof+=circle3(x,61,278.3,r,'top','fine',.45)
        for a in range(0,360,45):
            t=a*pi/180;roof+=line([(x+5*cos(t),61+5*sin(t),278.4),(x+21*cos(t),61+21*sin(t),278.4)],'seam',.4)
    # Four rails and feet; square EIA mounting holes are deliberately visible.
    for x,y in [(2,9),(151,9),(2,122),(151,122)]:
        c+=box(x,y,13,7,5,255)
        if y==122:
            for i in range(39):
                z=20+i*6.1;c+=rect_front(x+2.1,y+5.1,z,2.8,2.7,'seam','side',.45)
                if i%3==0:c+=front_plane(x-4,y+5.2,z+1,f'<text class="pn-engraving" font-size="2.8">{13-i//3}</text>')
    for x in (9,142):
        for y in (13,111):
            c+=box(x,y,1,9,9,6,'seam')
            c+=line([(x,y+9,3),(x+9,y+9,3)],'fine',.5)
    return group(c+roof,'pn-node pn-cabinet',2)

def cord(start,end,offset=0,cls=''):
    # Front service loop. Runtime recomputes endpoints when the switch slides.
    x0,y0=pt(*start);x1,y1=pt(*end)
    a,b=pt(start[0],start[1]+16+offset,start[2]-9);d,e=pt(end[0],end[1]+20+offset,end[2]-10)
    return f'<path d="M{fmt(x0)} {fmt(y0)} C{fmt(a)} {fmt(b)} {fmt(d)} {fmt(e)} {fmt(x1)} {fmt(y1)}" class="pn-cord {cls}" fill="none" stroke-width="1.25" data-start="{xy(start)}" data-end="{xy(end)}" data-sag="{offset}"/>'

def rack():
    c=cabinet()
    c+=group(rack_device(238,'fiber')+rack_device(216,'patch'),'pn-node',2)
    c+=group(rack_device(144,'router')+rack_device(45,'ups'),'pn-node',3)
    # Return-folded blanking plate, ventilation slots and rack rail telescopes.
    blank=rect_front(6,128,96,148,31,'fine','face',.65)
    for z in (104,110,116):
        for i in range(15):blank+=rect_front(18+i*8.2,128.1,z,5.8,1.4,'seam','side',.35)
    for x in (9,151):
        for z in (99,124):blank+=screw(x,128.3,z,1)
    c+=group(blank,'pn-node',2)
    rails=''
    for x in (13,147):
        for z in (180,184):rails+=line([(x,40,z),(x,128,z)],'fine',.7,cls='pn-drawer-rail',extra=f'data-x="{x}" data-z="{z}"')
    c+=group(rails,'pn-node',3)
    switch=rack_device(178,'switch')
    switch+=circuit_board(180)
    lid=box(10,28,191.5,140,98,1.5,'fine')
    for n in range(24):lid+=line([(26+n*4.5,47,193.1),(26+n*4.5,90,193.1)],'seam',.45)
    switch+=group(lid,'pn-lid')
    c+=group(switch,'pn-switch-drawer pn-node',3)
    # Cable combs occupy separate units, with visible retaining fingers.
    organizer=box(14,125,202,132,10,7)
    for i in range(19):organizer+=line([(17+i*6.8,135,203),(17+i*6.8,135,209)],'fine',.6)
    c+=group(organizer,'pn-node',2)
    cords=''
    for i,n in enumerate((0,1,3,4,6,7,9,10)):
        cords+=cord((21.8+n*9.1,129,220),(21.8+n*9.1,129,182),i%3*2, 'pn-cord--accent' if i in (0,4) else '')
    c+=group(cords,'pn-patch-cords pn-node',3)
    # The transparent door rotates around its physical left hinge.
    door='<rect x="0" y="-263" width="158" height="263" rx="2" fill="#111316" fill-opacity=".14" stroke="#8c9298" stroke-width=".8"/><rect x="5" y="-258" width="148" height="253" rx="1" fill="none" stroke="#41464d" stroke-width=".5"/>'
    door+='<rect x="10" y="-247" width="136" height="231" rx="2" fill="none" stroke="#646b73" stroke-width=".55"/>'
    for y in range(-236,-22,8):door+=f'<path d="M15 {y}H141" stroke="#41464d" stroke-width=".28" opacity=".5"/>'
    door+='<rect x="143" y="-149" width="5" height="31" rx="2" fill="#111316" stroke="#81878e" stroke-width=".65"/><circle cx="145.5" cy="-142" r="1" fill="none" stroke="#c4c7cc" stroke-width=".5"/>'
    for y in (-232,-52):door+=f'<rect x="-1.5" y="{y}" width="4" height="16" fill="#111316" stroke="#646b73" stroke-width=".6"/>'
    hinge=pt(0,133,12)
    c+=f'<g transform="translate({xy(hinge)})"><g class="pn-door" transform="matrix({A} .5 0 1 0 0)">{door}</g></g>'
    return c

def workstation():
    c=box(0,0,0,103,83,2)
    c+=box(0,0,2,103,2,73)
    content='<rect x="4" y="-69" width="95" height="61" fill="#101215" stroke="#646b73" stroke-width=".55"/><path d="M4 -58H99M21 -58V-8" fill="none" stroke="#41464d" stroke-width=".5"/>'
    for y in range(-48,-15,8):content+=f'<path d="M9 {y}h7" stroke="#81878e" stroke-width=".7"/>'
    content+='<text x="27" y="-44" class="pn-engraving" font-size="4.4">OPERACIÓN</text><rect x="27" y="-36" width="65" height="19" fill="none" stroke="#41464d" stroke-width=".5"/>'
    for j in range(2):
        for i in range(4):content+=f'<path d="M{31+i*15} {-31+j*8}h8" stroke="#646b73" stroke-width=".6"/>'
    content+='<rect x="82" y="-50" width="10" height="3" fill="#dc2626"/>'
    c+=front_plane(0,2.1,2,content)
    for row in range(5):
        for col in range(13):c+=face([(9+col*6.5,17+row*5.8,2.3),(14+col*6.5,17+row*5.8,2.3),(14+col*6.5,21+row*5.8,2.3),(9+col*6.5,21+row*5.8,2.3)],'face','fine',.35)
    c+=face([(37,54,2.3),(71,54,2.3),(71,75,2.3),(37,75,2.3)],'face','fine',.4)
    # Separate data outlet, with termination and an attached cord.
    c+=box(118,37,0,20,13,25)
    c+=rj45(124,50.1,10)
    c+=line([(125,51,12),(124,61,8),(116,68,3),(90,68,2),(87,62,2)],'fine',.9)
    return c

def access_point():
    c=''
    # Circular enclosure with concentric return edge, LED ring, fixing plate.
    for z,r,stroke in [(0,35,'seam'),(3,35,'edge'),(6,34,'fine'),(8,29,'seam')]:c+=circle3(0,0,z,r,'top',stroke,.7,'face')
    c+=circle3(0,0,8.1,8,'top','light',.65)
    c+=circle3(0,0,8.2,6.6,'top','red',.7)
    for n in range(28):
        a=2*pi*n/28;c+=line([(30*cos(a),30*sin(a),5.6),(32*cos(a),32*sin(a),5.6)],'fine',.4)
    return c

def tester():
    c=box(0,0,0,53,90,12)
    panel='<rect x="5" y="7" width="43" height="49" rx="2" fill="#0c0d0f" stroke="#81878e" stroke-width=".6"/><text x="10" y="16" class="pn-engraving" font-size="4.1">ENLACE 024</text><path d="M10 20h33" stroke="#41464d" stroke-width=".6"/>'
    for n in range(4):panel+=f'<path d="M10 {27+n*6}h16m5 0h10" stroke="#646b73" stroke-width=".55"/>'
    panel+='<path d="M12 49l3 3 5-6" stroke="#c4c7cc" fill="none" stroke-width=".8"/><text x="23" y="51" class="pn-engraving" font-size="4.5">PASS</text>'
    for x,y in [(15,69),(26,64),(37,69),(26,75)]:panel+=f'<circle cx="{x}" cy="{y}" r="3.6" fill="#15171a" stroke="#646b73" stroke-width=".5"/>'
    c+=top_plane(0,0,12.1,panel)
    return c

def network():
    # Draw coordinates are global world units, with a single consistent projection.
    body=''
    floor=face([(-155,-40,-1),(365,-40,-1),(365,265,-1),(-155,265,-1)],'none','seam',.45)
    floor+=top_grid(-145,-30,-1,500,280,40)
    body+=group(floor,'pn-floor')
    # Overhead ladder tray ends at the cabinet. Bundles enter the roof gland.
    tray=''
    for y in (65,84):tray+=box(-169,y,258,168,2.5,6,'fine')
    for x in range(-162,0,13):tray+=box(x,66,259,2.5,18,2,'seam')
    for n in range(5):
        tray+=line([(-169,68+n*3,263),(-24,68+n*3,263),(-9,68+n*3,266),(12,68+n*3,278)],'red' if n==2 else 'fine',.7)
    for x in (-150,-75):
        tray+=line([(x,64,264),(x,64,289),(x,87,289),(x,87,264)],'seam',.65)
    body+=group(tray,'pn-node',1)
    # Physical routes remain in one coordinate system, with no arbitrary screen links.
    body+=route([(-123,133,12),(-123,190,12),(-22,190,12),(-22,139,12),(-22,139,160),(12,139,160)],'0 1 2 3')
    body+=route([(144,129,184),(174,129,184),(174,-4,184),(275,-4,184),(275,-4,86)],'3 4')
    body+=route([(13,129,239),(-23,129,239),(-23,129,8),(-23,205,8),(-132,205,8),(-132,211,12)],'2 5')
    body+=group(f'<g transform="translate({xy(pt(-248,82,0))})">{workstation()}</g>','pn-node',0)
    body+=rack()
    # Wi-Fi belongs to the same installation; the ceiling plane provides context.
    ceiling=face([(222,-52,64),(346,-52,64),(346,76,64),(222,76,64)],'none','seam',.55)
    ceiling+=top_grid(222,-52,64,124,128,32)
    ceiling+=f'<g transform="translate({xy(pt(279,12,77))})">{access_point()}</g>'
    for r in (48,64):ceiling+=circle3(279,12,80,r,'top','seam',.45)
    body+=group(ceiling,'pn-node pn-wireless',4)
    body+=group(f'<g transform="translate({xy(pt(-158,211,0))})">{tester()}</g>','pn-node',5)
    # World to screen, leaving annotation space without reducing the cabinet.
    body=f'<g class="pn-world" transform="translate(430 396) scale(1.05)">{body}</g>'
    labels=tag(0,115,279,'Puestos')+tag(1,250,121,'Tendidos')+tag(2,594,175,'Distribución','right')+tag(3,715,300,'Red activa','right')+tag(4,772,470,'Wi-Fi','right')+tag(5,127,548,'Medición')
    return f'<g class="ds-drawing pn-drawing" data-discipline-drawing="101">{body}{labels}</g>'

STYLE='''
.pn-drawing{--pn-ink:#c4c7cc;stroke-linejoin:round;stroke-linecap:round}
.pn-node{opacity:.92;transition:opacity 900ms ease}
.pn-node[data-current=true]{opacity:1}
.pn-floor{opacity:.32}
.pn-engraving{font-family:Arial,sans-serif;fill:#81878e;stroke:none;letter-spacing:.15px}
.pn-tag{fill:#c4c7cc;color:#41464d;font:16px Arial,sans-serif;transition:fill 600ms}
.pn-tag__number{fill:#646b73;font-variant-numeric:tabular-nums}
.pn-tag[data-current=true],.pn-tag[data-current=true] .pn-tag__number{fill:#fff;color:#dc2626}
.pn-cord{stroke:#848a90}.pn-cord--accent{stroke:#b7393c}
.pn-signal{opacity:0}
.pn-link[data-current=true] .pn-signal{opacity:.9}
'''
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" class="ds-svg pn-svg" aria-hidden="true"><style>{STYLE}</style>{network()}</svg>'
(OUT/'discipline-101-v2.svg').write_text(svg)
print(f'101 precision: {len(svg):,} bytes; {svg.count("<path")} authored paths')
