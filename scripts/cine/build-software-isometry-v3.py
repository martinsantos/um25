"""A continuous request through six designed software surfaces, true 30° isometry.
Vector-only: fine edges, physical substrate, readable controls and causal states.
"""
from pathlib import Path
from html import escape
from math import sqrt
ROOT=Path(__file__).resolve().parents[2]
A=sqrt(3)/2
INK='#233647';MUTED='#687c8c';EDGE='#c6d1d9';RED='#c52a36';BLUE='#35698c';GREEN='#237c69'
def rect(x,y,w,h,fill='#fff',stroke=EDGE,sw=.55,r=3,extra=''):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'
def text(x,y,s,size=9,fill=INK,weight=400,extra=''):
 return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" {extra}>{escape(s)}</text>'
def line(d,color=EDGE,width=.65,extra=''):
 return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def dot(x,y,r=1.6,fill=GREEN):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>'
def pill(x,y,s,w=58,color=GREEN,bg='#e8f3ed'):
 return rect(x,y,w,16,bg,'none',0,8)+dot(x+8,y+8,1.5,color)+text(x+14,y+11,s,7.5,color,500)
def check(x,y,extra=''):return line(f'M{x} {y}l3 3 6-7',GREEN,1.1,extra)
def header(n,title,sub):
 return text(20,25,f'0{n}',9,RED,600)+text(42,26,title,14,INK,600)+text(20,42,sub,8.5,MUTED)+line('M20 51H364')
def footer(label,right):return line('M20 210H364')+text(20,225,label,7.2,MUTED)+text(364,225,right,7.2,MUTED,extra='text-anchor="end"')
def icon(x,y,kind,color=BLUE):
 d={'grid':'M0 0h10v10H0ZM5 0v10M0 5h10','folder':'M0 2V0h4l2 2h5v8H0Z','list':'M3 0h9M3 5h9M3 10h9M0 0h.1M0 5h.1M0 10h.1','api':'M3 0L0 5l3 5M9 0l3 5-3 5M7-1L5 11','shield':'M0 0l5-2 5 2v5c0 4-5 6-5 6S0 9 0 5ZM3 4l2 2 3-4','db':'M0 1C0-2 12-2 12 1S0 4 0 1V9c0 3 12 3 12 0V1M0 5c0 3 12 3 12 0','pulse':'M0 5h3l2-5 3 10 2-5h3'}[kind]
 return f'<g transform="translate({x} {y})">{line(d,color,.8)}</g>'
def cardshell(x,y,w,h,title,sub,kind='api'):
 return rect(x,y,w,h)+rect(x+9,y+9,25,25,'#edf3f7','none',0,6)+icon(x+16,y+16,kind)+text(x+43,y+20,title,10,INK,600)+text(x+43,y+33,sub,7.3,MUTED)
def interface():
 c=rect(0,0,384,236,'#fbfcfd',EDGE,.55,8)+rect(1,1,382,27,'#edf2f5','none',0,7)+line('M0 28H384')
 c+=text(14,19,'UM',11,RED,600)+text(42,18,'Workspace',9,INK,600)+text(111,18,'/  Operaciones',8,MUTED)
 c+=rect(258,7,82,14,'#fff','none',0,5)+icon(263,10,'list',MUTED)+text(280,17,'Buscar',7,MUTED)+dot(362,14,7,'#dce6ed')+text(358,17,'MS',6.2,BLUE,600)
 c+=rect(1,29,68,206,'#edf2f5','none',0,0)+text(12,44,'ESPACIO',6.8,MUTED,600)
 for i,(name,glyph) in enumerate([('Resumen','grid'),('Solicitudes','list'),('Proyectos','folder'),('Actividad','pulse')]):
  y=62+24*i
  if i==1:c+=rect(6,y-12,58,21,'#f5e6e8','none',0,4)
  c+=f'<g transform="translate(12 {y-7}) scale(.65)">{icon(0,0,glyph,RED if i==1 else MUTED)}</g>'+text(25,y,name,7.5,RED if i==1 else MUTED,500)
 c+=text(82,52,'Solicitudes del equipo',16,INK,600)+text(83,66,'Cada tarea tiene un contexto y un responsable.',8,MUTED)
 for i,(v,label) in enumerate([('24','Activas'),('08','En curso'),('16','Resueltas')]):
  x=83+i*96;c+=rect(x,78,88,42,'#fff')+text(x+9,101,v,19,INK,500)+text(x+38,99,label,7.8,MUTED)+line(f'M{x+38} 109h31','#dbe6ee',1.5)
 c+=text(83,138,'RECIENTES',7.5,MUTED,600)+text(365,138,'Ver todas →',7.5,BLUE,extra='text-anchor="end"')
 for i,(title,team,status) in enumerate([('0248 · Nueva sede','Redes','Asignada'),('0247 · Portal interno','Producto','En curso'),('0246 · Integración ERP','Datos','Resuelta')]):
  y=157+i*22
  if i==0:c+=rect(81,y-12,290,21,'#edf4fa','none',0,3)+rect(81,y-12,2,21,BLUE,'none',0,0)
  c+=text(90,y,title,8.5,INK,500)+text(225,y,team,7.8,MUTED)+pill(300,y-10,status,63,GREEN if i!=1 else BLUE)
 c+=f'<g class="ps-outcome">{rect(226,205,144,23,"#e8f3ed","#b9d6c8",.5,5)}{check(235,216)}{text(249,220,"Solicitud 0248 · guardada",8,GREEN,500)}</g>'
 return c

def rules():
 c=header(2,'Reglas y permisos','Quién puede hacer qué. Y qué ocurre después.')
 c+=cardshell(20,63,215,45,'Solicitud 0248','Proyecto · Nueva sede','folder')+pill(154,77,'Validada',69)
 c+=text(21,125,'CONDICIONES DEL PROCESO',7.5,MUTED,600)
 for i,(label,detail) in enumerate([('Identidad verificada','Equipo de Redes'),('Permiso de aprobación','Responsable de proyecto'),('Datos consistentes','Alcance + fecha + sede')]):
  y=143+i*20;c+=rect(20,y-11,215,18,'#f2f6f8','none',0,3)+text(29,y,label,8.6,INK,500)+check(216,y-4,'class="ps-check"')
 c+=rect(254,64,110,130,'#eef3f7')+icon(267,77,'shield')+text(287,85,'Transición',10,INK,600)
 for y,title,fill in [(109,'Recibida','#fff'),(142,'Validada','#fff'),(175,'Asignada','#e8f3ed')]:
  c+=rect(264,y-13,90,24,fill)+text(309,y+2,title,10,GREEN if y==175 else INK,500,'text-anchor="middle"')
  if y<175:c+=line(f'M309 {y+12}v9m-3-3 3 3 3-3',MUTED,.75)
 c+=line('M235 154h10v21h19',BLUE,.85,'class="ps-flow" pathLength="100"')
 return c+footer('Reglas explícitas · permisos por rol','01 solicitud / 03 controles')

def integrations():
 c=header(3,'Integraciones','El mismo dato conserva su significado entre sistemas.')
 c+=cardshell(20,63,142,42,'ERP / Proyectos','Contrato de entrada','api')+cardshell(222,63,142,42,'Plataforma UM','Contrato de destino','grid')
 c+=text(28,121,'ORIGEN',7.5,MUTED,600)+text(230,121,'DESTINO',7.5,MUTED,600)
 for i,(source,target) in enumerate([('project.code','proyecto.id'),('site.address','sede.domicilio'),('owner.email','responsable.email')]):
  y=129+22*i;c+=rect(20,y,142,19,'#f1f5f8','none',0,3)+rect(222,y,142,19,'#f1f5f8','none',0,3)+text(29,y+13,source,9)+text(231,y+13,target,9)
  c+=line(f'M162 {y+9.5}h60',BLUE,.7)+dot(162,y+9.5,1.8,BLUE)+line(f'M217 {y+6.5}l5 3-5 3',BLUE,.8)
  c+=line(f'M162 {y+9.5}h60',RED,1.6,'class="ps-flow" pathLength="100" stroke-dasharray="8 92"')
 c+=pill(20,193,'TLS / autenticado',107)+text(231,204,'200 OK · recibido',8.5,GREEN,500,'class="ps-outcome"')
 return c+footer('Contratos versionados · validación · reintentos','POST /proyectos · v3')

def data():
 c=header(4,'Datos y trazabilidad','Relaciones claras. Cada cambio deja una historia.')
 for x,title,rows in [(20,'solicitudes',[('PK','id','0248'),('FK','proyecto','P-104'),('FK','responsable','MS'),('','estado','Asignada')]),(218,'personas',[('PK','id','MS'),('','equipo','Redes'),('','rol','Responsable'),('','activo','Sí')])]:
  w=146;c+=rect(x,62,w,113)+rect(x,62,w,24,'#edf3f7',EDGE,.55,3)+icon(x+9,68,'db')+text(x+29,78,title,10,INK,600)
  for i,(key,label,value) in enumerate(rows):
   y=101+i*19;c+=line(f'M{x} {y+7}h{w}',EDGE,.4)+text(x+8,y,key,6.8,BLUE,600)+text(x+27,y,label,8.4,MUTED)+text(x+w-9,y,value,8.4,INK,500,'text-anchor="end"')
 c+=line('M166 139h25V101h27',BLUE,.9)+dot(166,139,2,BLUE)+line('M211 96v10M214 96v10',BLUE,.7)
 c+=rect(20,187,344,19,'#e8f3ed','none',0,4)+dot(29,196,2)+text(39,200,'10:42:08  ·  MS asignó la solicitud 0248 al equipo de Redes',8,GREEN,500,'class="ps-outcome"')
 return c+footer('Integridad referencial · auditoría · historial','Evento #00248')

def delivery():
 c=header(5,'Despliegue controlado','Cada versión se prueba, se publica y se puede recuperar.')
 c+=pill(20,63,'release / 1.8.3',100,BLUE,'#eaf1f7')+text(364,75,'main · a7c3f2',8,MUTED,extra='text-anchor="end"')
 c+=line('M49 115H335','#d6e0e6',1.5)+line('M49 115H335',GREEN,1.5,'class="ps-draw" pathLength="100"')
 for i,(title,detail) in enumerate([('Verificar','Pruebas'),('Construir','Artefacto'),('Publicar','Versión'),('Observar','Salud')]):
  x=20+i*91;c+=rect(x,94,71,61)+dot(x+35,115,8,'#e8f3ed')+check(x+31,115,'class="ps-check"')+text(x+35,140,title,9.5,INK,600,'text-anchor="middle"')+text(x+35,168,detail,8,MUTED,extra='text-anchor="middle"')
 c+=rect(20,181,344,24,'#edf3f7','none',0,4)+text(30,197,'✓',11,GREEN,600)+text(46,197,'Versión saludable',9,GREEN,500)+text(355,197,'Volver a 1.8.2 ↶',8,BLUE,extra='text-anchor="end"')
 return c+footer('Desarrollo → validación → producción','Sin perder el camino de vuelta')

def infrastructure():
 c=header(6,'Operación y continuidad','La experiencia depende de todo lo que la sostiene.')
 for i,(title,meta) in enumerate([('Aplicación','2 réplicas'),('API','42 ms'),('Datos','Copia verificada')]):
  x=20+i*119;c+=rect(x,64,106,79)+icon(x+10,75,'grid' if i==0 else 'api' if i==1 else 'db')+text(x+29,85,title,10,INK,600)+text(x+10,107,meta,9,MUTED)
  for j in range(9):c+=rect(x+10+j*9,120,5,11,'#bed5ca' if j<7 else '#e1e9e5','none',0,1)
  c+=dot(x+91,77,2.2)
  if i<2:c+=line(f'M{x+106} 103h13',BLUE,.7)
 c+=rect(20,154,220,50,'#f2f6f8','none',0,4)+text(29,168,'RESPUESTA / ÚLTIMOS MINUTOS',6.7,MUTED,600)
 c+=line('M29 194H229M29 180H229',EDGE,.45)
 c+=line('M30 190l12-2 11 1 9-6 11 3 9-2 12 4 10-9 12 4 10-1 12-6 12 7 9-2 12 5 11-9 13 4 11-1 13 2',GREEN,1,'class="ps-draw" pathLength="100"')
 c+=rect(250,154,114,50,'#e8f3ed','none',0,4)+text(261,171,'RESPALDO',7,GREEN,600)+text(261,190,'Verificado',12,GREEN,600,'class="ps-outcome"')
 return c+footer('Métricas · alertas · respaldo · recuperación','La operación sigue')

# A thin laminated substrate, with a folded edge and a softer lower return.
# The content is on a true 30-degree plane; there is no arbitrary perspective skew.
def plane(z,body):return f'<g transform="translate(0 {-z}) matrix({A} .5 {-A} .5 0 0)">{body}</g>'
def surface(z,body,n):
 c=plane(z-4,rect(2,2,380,232,'#748896','#748896',.55,8))
 c+=plane(z-1.5,rect(0,0,384,236,'#d3dee5','#8297a6',.6,8))
 c+=plane(z,rect(0,0,384,236,'#fbfcfd','#d9e3e9',.55,8)+body)
 # Engraved datum ticks are confined to the physical edge, not every text field.
 c+=plane(z, line('M5 25V9q0-4 4-4h16M359 5h16q4 0 4 4v16M5 211v16q0 4 4 4h16','#a2b4c0',.65))
 return c
surfaces=[interface(),rules(),integrations(),data(),delivery(),infrastructure()]
body=''
for i in reversed(range(6)):
 z=[228,187,146,105,64,23][i]
 body+=f'<g class="ps-layer" data-discipline-node="{i}">{surface(z,surfaces[i],i)}</g>'
labels=''
for i,title in enumerate(['Experiencia','Reglas','Integración','Datos','Despliegue','Operación']):
 labels+=f'<g class="pn-tag" data-discipline-tag="{i}">{text(837,170+i*42,f"0{i+1}",11,"#738491",500)}{text(862,170+i*42,title,12,"#c1cbd2")}</g>'
style='''
.ps-drawing text{font-family:var(--um-font-body,'UM Sans',Arial,sans-serif);stroke:none;letter-spacing:0}
.ps-layer{opacity:1}
.ps-layer .ps-outcome{opacity:.12}
.ps-layer .ps-check{stroke-dasharray:16;stroke-dashoffset:16}
.ps-layer .ps-draw{stroke-dasharray:100;stroke-dashoffset:100}
.ps-layer[data-current=true] .ps-outcome{animation:ps-reveal 900ms ease 2600ms both}
.ps-layer[data-current=true] .ps-check{animation:ps-line 1000ms ease 2200ms both}
.ps-layer[data-current=true] .ps-draw{animation:ps-line 2400ms ease 2200ms both}
.ps-layer[data-current=true] .ps-flow{animation:ps-flow 2300ms linear 2400ms infinite}
[data-story-state]:not([data-story-state=playing]) .ps-drawing *,[data-visible=false] .ps-drawing *{animation-play-state:paused!important}
@keyframes ps-reveal{from{opacity:.12}to{opacity:1}}
@keyframes ps-line{to{stroke-dashoffset:0}}
@keyframes ps-flow{to{stroke-dashoffset:-100}}
@media(prefers-reduced-motion:reduce){.ps-drawing *{animation:none!important}.ps-layer .ps-outcome{opacity:1}.ps-layer .ps-check,.ps-layer .ps-draw{stroke-dashoffset:0}}
'''
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" class="ds-svg ps-svg" aria-hidden="true"><style>{style}</style><g class="ds-drawing ps-drawing" data-discipline-drawing="104" data-software-detail="3"><g transform="translate(446 263)">{body}</g>{labels}</g></svg>'
(ROOT/'src/assets/cine/isometric/discipline-104-v3.svg').write_text(svg)
print('Software v3:',len(svg),'bytes; six designed layers')
