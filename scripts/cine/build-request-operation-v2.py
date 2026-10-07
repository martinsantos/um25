from pathlib import Path
import math, runpy
R=Path(__file__).resolve().parents[2]
# Reuse the authored cabinet and workstation, not a raster or external asset.
a=runpy.run_path(str(R/'scripts/cine/build-request-operation-v1.py'))
rack,defs,desk=a['rack'],a['defs'],a['desk']
C=math.sqrt(3)/2
P=lambda x,y,z=0:(round(550+(x-y)*C,2),round(150+(x+y)*.5-z,2))
def pts(v):return ' '.join(f'{x},{y}' for x,y in v)
def line(v,stroke='#63707c',width=1,extra=''):return f'<polyline points="{pts([P(*p) for p in v])}" fill="none" stroke="{stroke}" stroke-width="{width}" {extra}/>'
def face(v,fill,stroke='#55616d'):return f'<polygon points="{pts([P(*p) for p in v])}" fill="{fill}" stroke="{stroke}" stroke-width=".8" stroke-linejoin="round"/>'
def box(x,y,z,w,d,h,top='#424e5b'):
 return face([(x,y+d,z),(x+w,y+d,z),(x+w,y+d,z+h),(x,y+d,z+h)],'#19232d')+face([(x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h)],'#25313d')+face([(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],top)
def group(body,key):return f'<g data-operation-part="{key}">{body}</g>'
def front(x,y,z,body):
 px,py=P(x,y,z);return f'<g transform="matrix({C} .5 0 1 {px} {py})">{body}</g>'
def tag(x,y,z,label):
 px,py=P(x,y,z);return f'<text x="{px}" y="{py}" fill="#a8b5c2" font-size="15" font-family="Arial,sans-serif">{label}</text>'
# One shared 30° orthographic coordinate system: all fixtures remain installed.
floor=box(0,0,-12,600,410,12,'#161f29')
for x in range(0,601,40):floor+=line([(x,0,0),(x,410,0)],'#8293a2',.5,'opacity=".13"')
for y in range(0,411,40):floor+=line([(0,y,0),(600,y,0)],'#8293a2',.5,'opacity=".13"')
# Cutaway walls, glazing mullions, service room and doorway.
walls=box(0,0,0,600,6,100,'#65727f')+box(0,0,0,6,410,100,'#65727f')
for x in range(20,290,45):
 walls+=face([(x,7,24),(x+37,7,24),(x+37,7,82),(x,7,82)],'#263442','#697887')
 walls+=line([(x+18,7,24),(x+18,7,82)],'#8b9baa',.7)
walls+=box(335,0,0,5,112,72)+box(335,165,0,5,60,72)
walls+=box(337,116,0,3,44,66,'#637588')
# Cable tray: same coordinate routes as the signal paths, with cross-braces.
tray=line([(30,145,5),(570,145,5),(570,370,5)],'#5d6b78',9)+line([(30,145,5),(570,145,5),(570,370,5)],'#121a24',6)
for x in range(30,571,15):tray+=line([(x,139,6),(x,151,6)],'#85939f',.6)
for y in range(160,371,15):tray+=line([(564,y,6),(576,y,6)],'#85939f',.6)
# Rack base at (445, 80) and client workstation at (150, 285).
rx,ry=P(445,80);dx,dy=P(150,285)
fixtures=group(f'<g transform="translate({rx} {ry}) scale(.23)">{rack}</g>','network')
fixtures+=group(f'<g transform="translate({dx} {dy}) scale(.63)">{desk}</g>','workplace')
# Desk chair: recognizable frame, seat, back and wheelbase.
fixtures+=box(148,325,18,32,29,5)+box(148,350,22,32,4,36)+box(163,338,0,3,3,18)
for off in [-14,14]:fixtures+=line([(164,339,6),(164+off,339+off,0)],'#9aa7b4',2)
# Wall bracket camera overlooking the entrance.
cx,cy=P(65,50,116)
cam=line([(65,6,111),(65,50,111)],'#9daab6',3)+f'<ellipse cx="{cx}" cy="{cy}" rx="13" ry="7" fill="#b2bcc6"/><path d="M{cx-11} {cy}a11 11 0 0 0 22 0" fill="#26313e" stroke="#c3cbd4"/><circle cx="{cx+2}" cy="{cy+4}" r="3" fill="#dc2626"/>'
cam+='<g class="op-coverage">'+face([(65,50,105),(10,255,1),(155,235,1)],'#dc262614','#dc262655')+'</g>'
fixtures+=group(cam,'security')
# Fire detector and independently wired central (not a data-network substitute).
fx,fy=P(240,75,104)
fire=line([(240,6,110),(240,75,110)],'#9daab6',3)+f'<ellipse cx="{fx}" cy="{fy}" rx="13" ry="7" fill="#d0d6dd" stroke="#8192a1"/><ellipse cx="{fx}" cy="{fy+3}" rx="10" ry="4" fill="#667887"/><circle cx="{fx}" cy="{fy+3}" r="2" fill="#dc2626"/>'
fire+=box(12,160,30,27,9,39)
fire+=front(14,170,64,'<rect width="23" height="33" fill="#9e252c" stroke="#d7dce1"/><rect x="4" y="5" width="15" height="8" fill="#14212b"/><path d="M5 20h13M5 25h8" stroke="#fff"/>')
fire+=f'<circle class="op-alarm" cx="{fx}" cy="{fy}" r="20" fill="none" stroke="#dc2626" stroke-width="2"/>'
fixtures+=group(fire,'fire')
# Electrical input, tower UPS with vents, four battery modules, output circuit.
energy=box(485,195,0,42,32,78)
energy+=front(488,228,70,'<rect width="35" height="59" fill="#151f29" stroke="#9ba9b8"/><rect x="7" y="7" width="21" height="12" fill="#dc2626"/><path d="M9 13h16" stroke="#fff"/>')
for z in range(12,46,4):energy+=line([(490,228,z),(518,228,z)],'#7c8b99',1)
energy+=box(548,12,0,26,15,87)
for z in [18,35,52]:energy+=box(552,28,z,17,4,10,'#b2bdc8')
ex,ey=P(505,228,62)
energy+=f'<g class="op-battery" transform="translate({ex} {ey})"><path d="M-7 -4h14v8H-7zM7 -2h2v4H7" fill="none" stroke="white" stroke-width="1.3"/><path d="M-4 -2v4M0 -2v4M4 -2v4" stroke="white"/></g>'
fixtures+=group(energy,'energy')
# Operator console: live camera view and software register in an installed screen.
sx,sy=P(470,345)
console=f'<g transform="translate({sx} {sy}) scale(.60)">{desk}</g>'
# Overlay UI precisely on this second desk's monitor front.
mx,my=a['P'](-71,-35.8,214)
console+=f'<g transform="translate({sx} {sy}) scale(.60)"><g transform="matrix({C} .5 0 1 {mx} {my})"><rect width="142" height="78" fill="#101a23" stroke="#c4c7cc"/><g class="op-video-feed"><path d="M8 60L64 26L126 61M64 26V9M8 60V24L64 9L126 24V61" fill="none" stroke="#a6b5c4"/><rect x="74" y="37" width="19" height="23" fill="none" stroke="#dc2626"/><circle cx="126" cy="10" r="3" fill="#dc2626"/></g><g class="op-software-feed"><path d="M10 12H90" stroke="#fff" stroke-width="3"/>'
for i in range(3):console+=f'<g data-request-row="{i}"><rect x="10" y="{22+i*16}" width="122" height="12" fill="#253544"/><path d="M15 {28+i*16}H{80+i*12}" stroke="#c4c7cc"/></g>'
console+='</g></g></g>'
fixtures+=group(console,'software')
# Remote endpoint beyond the building: distinct physical site reached by fiber.
remote=box(615,50,-10,92,90,10,'#19242f')+box(634,67,0,44,39,57)
for z in [10,22,34,46]:remote+=line([(640,107,z),(674,107,z)],'#95a6b6',2)
fixtures+=group(remote,'remote')
# Floor zones and installation identifiers remain quiet context, not floating cards.
labels='' 
routes=[[(150,245,2),(150,145,5),(445,145,5),(445,80,84)],[(65,50,110),(65,145,5),(445,145,5),(445,80,84),(570,145,5),(570,345,5),(470,345,92)],[(240,75,104),(240,6,100),(12,6,100),(12,160,65)],[(560,25,40),(560,215,5),(505,215,35),(445,215,5),(445,80,38)],[(445,80,65),(570,145,5),(570,345,5),(470,345,92)],[(470,345,92),(570,345,5),(570,145,5),(445,80,84)],[(445,80,84),(570,80,5),(650,80,45)]]
paths=''
for i,route in enumerate(routes):
 paths+=line(route,'#8195a9',1.1,f'opacity=".3"')
 paths+=line(route,'#ef4444',2.6,f'data-operation-route="{i}" pathLength="1" class="op-route"')
# Coordinates are exported for the timeline; drawings and animation cannot drift apart.
import json
geometry={'routes':[[P(*p) for p in route] for route in routes],'targets':[[600,400],list(P(445,80,45)),list(P(65,50,60)),list(P(140,75,65)),list(P(505,215,40)),list(P(470,345,110)),list(P(470,345,110)),[800,350]]}
(R/'src/data/cine/operationGeometry.json').write_text(json.dumps(geometry,indent=2)+'\n')
(R/'public/cine/operation-geometry-v1.js').write_text('export default '+json.dumps(geometry,separators=(',',':'))+';\n')

svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 740" role="img" aria-label="Instalación isométrica abierta: puestos, gabinete de red, cámara, detección de incendios, UPS y consola de supervisión conectados en su ubicación real."><defs>{defs}</defs><g data-request-camera="">{floor}{walls}{tray}{labels}{fixtures}{paths}<g data-request-packet="" transform="translate(600 400)"><circle r="5" fill="#fff" stroke="#dc2626" stroke-width="3"/><circle r="12" fill="none" stroke="#dc2626" opacity=".4"/></g><g data-operation-focus="" transform="translate(600 400)"><circle r="20" fill="none" stroke="#fff" stroke-width="1" opacity=".65"/></g></g></svg>'''
(R/'src/assets/cine/isometric/request-operation-v2.svg').write_text(svg)
