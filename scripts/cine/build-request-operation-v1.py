from pathlib import Path
import xml.etree.ElementTree as E,re,math
R=Path(__file__).resolve().parents[2];ns='{http://www.w3.org/2000/svg}';E.register_namespace('',ns[1:-1])
svg=E.parse(R/'src/assets/cine/isometric/network-rack-v10.svg').getroot();ids={n.get('id'):n for n in svg.iter() if n.get('id')};needed=set()
def collect(id):
 if id in needed:return
 needed.add(id)
 for n in ids[id].iter():
  href=n.get('href','')
  if href.startswith('#'):collect(href[1:])
cabinet=next(n for n in svg.iter() if n.get('class')=='rk-cabinet')
for n in cabinet.iter():
 href=n.get('href','')
 if href.startswith('#'):collect(href[1:])
rack=E.tostring(cabinet,encoding='unicode').replace('rk-','rq-')
rack=rack.replace('transform="translate(-490.17 -10)"','transform="translate(-490.17 -10) matrix(.866025404 .5 0 1 0 0)"')
defs=''.join(E.tostring(ids[id],encoding='unicode') for id in sorted(needed)).replace('rk-','rq-')
C=math.sqrt(3)/2
P=lambda x,y,z:(round((x-y)*C,2),round((x+y)*.5-z,2))
def poly(points,fill):return '<polygon points="'+' '.join(f'{a},{b}' for a,b in [P(*p) for p in points])+f'" fill="{fill}" stroke="#929ba6" stroke-width=".75" stroke-linejoin="round"/>'
def box(x,y,z,w,d,h):
 a,b=x-w/2,x+w/2;c,e=y-d/2,y+d/2
 return poly([(a,e,z),(b,e,z),(b,e,z+h),(a,e,z+h)],'#171b21')+poly([(b,c,z),(b,e,z),(b,e,z+h),(b,c,z+h)],'#252c34')+poly([(a,c,z+h),(b,c,z+h),(b,e,z+h),(a,e,z+h)],'#46505c')
desk=''
for x in [-82,82]:
 for y in [-50,50]:desk+=box(x,y,0,5,5,90)
desk+=box(0,0,90,205,135,5)
desk+=box(0,-28,96,65,35,3)+box(0,-32,100,8,8,32)+box(0,-40,127,158,7,96)
a,b=P(-71,-35.8,214)
desk+=f'<g transform="matrix({C} .5 0 1 {a} {b})"><rect width="142" height="78" rx="2" fill="#080b0e" stroke="#c4c7cc"/><path d="M10 16H86M10 27H128M10 39H105" stroke="#65707e"/><rect x="10" y="52" width="82" height="17" fill="#dc2626"/><path d="M19 60H81" stroke="white"/></g>'
desk+=box(-16,28,96,105,40,3)
for row in range(4):
 for col in range(13):desk+=box(-62+col*7.5,14+row*8,99,5.5,5.5,1.2)
desk+=box(69,27,96,19,30,7)
# A real application screen, on the same 30-degree projection as the hardware.
app=f'<g class="rq-application" transform="translate(830 60) scale(.9)"><g transform="matrix({C} .5 0 1 0 0)">'
app+='<rect x="0" y="0" width="350" height="264" rx="5" fill="#13171c" stroke="#a6adb7" stroke-width="1.5"/><path d="M0 34H350M64 34V264" stroke="#59616c"/>'
app+='<circle cx="15" cy="17" r="3" fill="#dc2626"/><text x="28" y="22" fill="#e9ecef" font-family="Arial,sans-serif" font-size="12">OPERACIONES / MANTENIMIENTO</text>'
for y,w in [(54,33),(75,27),(96,36),(117,25)]:app+=f'<path d="M14 {y}h{w}" stroke="#969eaa" stroke-width="3"/>'
app+='<rect x="9" y="139" width="44" height="25" rx="3" fill="#dc2626"/><text x="16" y="156" fill="white" font-family="Arial,sans-serif" font-size="12">024</text>'
app+='<text x="82" y="60" fill="#fff" font-family="Arial,sans-serif" font-size="18" font-weight="600">Orden de mantenimiento</text><text x="82" y="82" fill="#c4c7cc" font-family="Arial,sans-serif" font-size="12">024 · Planta / Tablero eléctrico</text>'
for i,(title,detail) in enumerate([('01  Solicitud registrada','Inspeccionar alimentación del tablero'),('02  Responsable asignado','Mantenimiento · Permiso verificado'),('03  Intervención documentada','Verificación y evidencia adjuntas')]):
 y=97+i*48
 app+=f'<g data-request-row="{i}"><rect x="80" y="{y}" width="254" height="43" rx="3" fill="#1d232b" stroke="#535c69"/><text x="91" y="{y+17}" fill="#fff" font-family="Arial,sans-serif" font-size="13">{title}</text><text x="91" y="{y+33}" fill="#c4c7cc" font-family="Arial,sans-serif" font-size="11">{detail}</text></g>'
app+='<path d="M83 250H198" stroke="#c4c7cc"/><circle cx="322" cy="250" r="4" fill="#dc2626"/></g></g>'
markup=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 510" role="img" aria-label="Una solicitud viaja del puesto al switch y a una aplicación, donde se valida y se resuelve.">
<defs>{defs}</defs>
<g data-request-camera="">
<path d="M55 357L260 475M760 471L1133 256" fill="none" stroke="#ffffff" stroke-opacity=".08"/>
<ellipse cx="566" cy="421" rx="159" ry="35" fill="#000" opacity=".55"/>

<path class="rq-wire" fill="none" stroke="#dc2626" stroke-width="2" d="M195 340L333 420L577 217L720 327L900 202"/>
<path class="rq-return" fill="none" stroke="#c4c7cc" stroke-opacity=".25" stroke-width="1" stroke-dasharray="4 6" d="M1080 361L720 447L577 242L333 442L195 340"/>
<g data-request-station="" transform="translate(195 365)">{desk}</g>
<g data-request-switch="" transform="translate(600 355) scale(.26)">{rack}</g>
{app}
<g class="rq-object-labels" fill="#c4c7cc" font-size="20" font-family="Arial,sans-serif"><text x="105" y="488">Puesto de trabajo</text><text x="493" y="488">Red y procesamiento</text><text x="908" y="488">Operación</text></g>
<g data-request-packet="" transform="translate(195 340)"><rect x="-23" y="-13" width="46" height="26" rx="4" fill="#dc2626" stroke="#fff"/><text y="6" fill="white" font-size="17" text-anchor="middle" font-family="Arial,sans-serif">024</text></g>
</g></svg>'''
(R/'src/assets/cine/isometric/request-operation-v1.svg').write_text(markup)
