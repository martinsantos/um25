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
collect('rk-switch-full')
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
app='<g transform="translate(938 251)">'
for layer,y in enumerate([64,32,0]):
 app+=f'<g data-request-layer="{layer}" transform="translate(0 {y})"><g transform="matrix({C} .5 {-C} .5 0 0)"><rect x="-160" y="-104" width="320" height="208" rx="6" fill="#101419" stroke="#969faa" stroke-width="1.5"/>'
 if layer==2:
  app+='<path d="M-160-58H160M-94-58V104" stroke="#65707e"/><path d="M-143-79H-60M-142-31H-111M-142-11H-111M-142 9H-111" stroke="#c4c7cc" stroke-width="3"/>'
  for i,label in enumerate(['Recibida','Validada','Resuelta']):
   app+=f'<g data-request-row="{i}"><rect x="-78" y="{-43+i*46}" width="222" height="35" rx="3" fill="#181e25" stroke="#5f6875"/><circle cx="-63" cy="{-25+i*46}" r="4" fill="#dc2626"/><text x="-49" y="{-19+i*46}" fill="#e5e7eb" font-size="18" font-family="Arial,sans-serif">{label}</text></g>'
 else:app+='<path d="M-125-60H110M-125-26H42M-125 8H110M-125 42H68" stroke="#53606f" stroke-width="2"/>'
 app+='</g></g>'
app+='</g>'
markup=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 510" role="img" aria-label="Una solicitud viaja del puesto al switch y a una aplicación, donde se valida y se resuelve.">
<defs>{defs}</defs>
<g data-request-camera="">
<path class="rq-wire" fill="none" stroke="#dc2626" stroke-width="2" d="M195 310L333 390L521 281L720 396L938 270"/>
<path class="rq-return" fill="none" stroke="#c4c7cc" stroke-opacity=".25" stroke-width="1" stroke-dasharray="4 6" d="M909 301L720 417L521 302L333 411L195 310"/>
<g data-request-station="" transform="translate(195 335)">{desk}</g>
<g data-request-switch="" transform="translate(532 280) scale(.57)"><use href="#rq-switch-full"/></g>
{app}
<g class="rq-object-labels" fill="#c4c7cc" font-size="24" font-family="Arial,sans-serif"><text x="105" y="464">Puesto de trabajo</text><text x="481" y="464">Switch</text><text x="861" y="464">Aplicación</text></g>
<g data-request-packet="" transform="translate(195 310)"><rect x="-23" y="-13" width="46" height="26" rx="4" fill="#dc2626" stroke="#fff"/><text y="6" fill="white" font-size="17" text-anchor="middle" font-family="Arial,sans-serif">024</text></g>
</g></svg>'''
(R/'src/assets/cine/isometric/request-operation-v1.svg').write_text(markup)
