"""Software as one authored mechanism. Every component shares a 30° projection.
Runtime requests and release artifacts have separate, explicit paths.
"""
from pathlib import Path
from math import sqrt
from html import escape
ROOT=Path(__file__).resolve().parents[2]
A=sqrt(3)/2
INK='#26394a'; MUTED='#738795'; EDGE='#bbcbd5'; RED='#dc2626'; GREEN='#247d69'
def p(x,y,z=0):return (410+A*(x-y),100+(x+y)/2-z)
def pts(v):return ' '.join(f'{x:.2f},{y:.2f}' for x,y in v)
def poly(v,fill,stroke=EDGE,w=.65,extra=''):return f'<polygon points="{pts(v)}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" {extra}/>'
def line(v,color=EDGE,w=.7,extra=''):return f'<polyline points="{pts(v)}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def route(v,color='#637784',w=1,extra=''):return line([p(*q) for q in v],color,w,extra)
def txt(x,y,s,size=10,color=INK,weight=400,extra=''):return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" {extra}>{escape(s)}</text>'
def rect(x,y,w,h,fill='#fff',stroke=EDGE,r=2,extra=''):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width=".55" {extra}/>'
def circle(x,y,r,fill,extra=''):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" {extra}/>'
def plane(x,y,z,body):
 q=p(x,y,z);return f'<g transform="matrix({A} .5 {-A} .5 {q[0]} {q[1]})">{body}</g>'
def wall(x,y,z,body):
 q=p(x,y,z);return f'<g transform="matrix({A} .5 0 1 {q[0]} {q[1]})">{body}</g>'
def box(x,y,z,w,d,h,fill='url(#sw-porcelain)',extra=''):
 q=[p(x,y,z+h),p(x+w,y,z+h),p(x+w,y+d,z+h),p(x,y+d,z+h)]
 return f'<g {extra}>'+poly([q[1],p(x+w,y,z),p(x+w,y+d,z),q[2]],'#b4c5d0',w=.3)+poly([q[3],q[2],p(x+w,y+d,z),p(x,y+d,z)],'#d8e2e9',w=.3)+poly(q,fill,'#79cbbb',.95)+'</g>'
def label(n,x,y,title,sub):
 return f'<g class="sw-label">{txt(x,y,f"0{n}",10,"#ee6b70",600)}{txt(x+25,y,title,15,"#e4ebf0",500)}{txt(x+25,y+17,sub,10,"#91a5b3")}</g>'
def node(n,body):
 shape,label=body.split('<g class="sw-label">',1)
 return f'<g class="sw-component" data-discipline-node="{n}" data-sw-focus="{n}"><g class="sw-machine">{shape}</g><g class="sw-label">{label}</g>' 
def port(x,y,z):return plane(x,y,z,rect(0,0,6,12,'#5a7488','#8fa5b6',1)+rect(1.5,2,3,8,'#a9cbd6','none',.5))
# A miniature product, with a real selected task and an accessible detail panel.
ui=''
# Registered rear perimeter makes the interface's thickness and separation
# visible from every automatic close-up, in the same 30-degree projection.
ui+=route([(0,210,54),(332,210,54),(332,416,54),(0,416,54),(0,210,54)],'#617f92',.5,'stroke-dasharray="3 4"')
for xx,yy in [(0,210),(332,210),(332,416),(0,416)]:
 ui+=route([(xx,yy,54),(xx,yy,80)],'#8bb8c6',.5)
ui+=box(0,210,74,332,206,6)
c=rect(0,0,332,206,'url(#sw-porcelain)','#e4ecf1',5)
c+=rect(0,0,332,25,'#edf2f6','none',5)+txt(13,17,'UM',10,RED,600)+txt(40,17,'Operaciones',8.5,INK,600)+txt(130,17,'/ Nueva sede',8,MUTED)
c+=rect(247,7,53,11,'#fff','none',3)+txt(253,15,'Buscar…',6,MUTED)+circle(316,12,5,'#c5d6e1')
c+=rect(0,25,56,180,'#eef3f6','none',0)+txt(9,43,'EQUIPO',5.5,MUTED,600)
for i,s in enumerate(['Resumen','Órdenes','Proyectos','Actividad']):
 y=61+i*22
 if i==1:c+=rect(5,y-10,46,17,'#f4e2e5','none',3)
 c+=rect(10,y-6,5,5,'none',RED if i==1 else MUTED,1)+txt(20,y,s,5.7,RED if i==1 else MUTED,500)
c+=line([(8,158),(48,158)],'#d5e0e8',.45)+circle(15,175,5,'#d4e1e9')+txt(25,174,'Tu equipo',6,INK,500)+txt(25,183,'5 miembros',5,MUTED)
c+=txt(69,46,'Órdenes',16,INK,500)+txt(69,59,'Organizá el trabajo. Conservá el contexto.',7,MUTED)
c+=rect(254,35,64,20,'#203e52','none',4)+txt(286,48,'+ Nueva orden',6.4,'#fff',500,'text-anchor="middle"')
for i,(s,v) in enumerate([('Pendientes','12'),('En curso','08'),('Resueltas','24')]):
 x=69+i*85;c+=txt(x,82,s,6.6,MUTED)+txt(x,103,v,21,INK,500)+line([(x,111),(x+73,111)],'#dbe4eb',.55)
c+=txt(69,130,'ORDEN',5.8,MUTED,600)+txt(201,130,'EQUIPO',5.8,MUTED,600)+txt(275,130,'ESTADO',5.8,MUTED,600)
for i,(title,team,state) in enumerate([('0248 · Nueva sede','Redes','En revisión'),('0247 · Portal interno','Producto','En curso'),('0246 · Conector ERP','Datos','Resuelta')]):
 y=148+i*20
 if i==0:c+=rect(65,y-11,255,18,'#e5eef5','none',2)+rect(65,y-11,2,18,RED,'none',0)
 c+=txt(72,y,title,7.4,INK,500)+txt(201,y,team,6.5,MUTED)+txt(275,y,state,6.1,GREEN if i==2 else MUTED,400,'data-sw-ui-state="true"' if i==0 else '')
ui+=plane(0,210,80,'<g data-sw-app-surface="true">'+c+'</g>')
# A task detail rises just 12px from its own selected row; the underlying app stays visible.
d=rect(0,0,143,118,'#152d32','#80cdbd',4,extra='fill-opacity=".93"')+rect(6,4,131,19,'#193441','none',2,'fill-opacity=".92"')+rect(6,29,131,34,'#193441','none',2,'fill-opacity=".82"')+rect(6,66,131,28,'#193441','none',2,'fill-opacity=".82"')+txt(10,17,'0248 / Nueva sede',10,INK,600)+line([(10,25),(133,25)],EDGE,.4)+txt(10,39,'RESPONSABLE',5.8,MUTED,600)+circle(18,53,6,'#e0ebf1')+txt(30,56,'Equipo de Redes',8,INK,500)+txt(10,75,'Proyecto',7,MUTED)+txt(133,75,'P-104',7,INK,500,'text-anchor="end"')+txt(10,90,'Permiso',7,MUTED)+txt(133,90,'Responsable',7,INK,500,'text-anchor="end"')+rect(10,99,123,13,'#dc2626','none',3,'data-sw-submit-bg="true"')+txt(71,108,'Aprobar orden',6.8,'#fff',500,'text-anchor="middle" data-sw-submit="true"')
ui+=f'<g data-sw-drawer="true">{box(170,305,112,143,118,2)}{plane(170,305,114,d)}</g>'
for xx,yy in [(170,305),(313,423)]:
 base=p(xx,yy,80);tip=p(xx,yy,114)
 ui+=line([base,tip],'#a7cdd7',.55,f'data-sw-drawer-tie="true" data-base="{base[0]},{base[1]}" data-tip="{tip[0]},{tip[1]}"')
ui+=label(1,92,444,'Una acción clara','Orden 0248 · aprobar la orden')
# Authorization is software: three optically thin, registered policy sheets.
# Translucent surfaces reveal the same request bus beneath them.
gate=plane(355,175,17,rect(0,0,120,122,'#39657b','#749aaf',2,'fill-opacity=".22"'))
gate+=route([(355,175,17),(475,175,17),(475,297,17),(355,297,17),(355,175,17)],'#78bfb7',.55)
# One request remains visible below every membrane, including the content area.
gate+=route([(364,287,18),(384,257,18),(423,229,18),(466,187,18)],'#df7975',1.0)
for xx,yy in [(384,257),(423,229)]:gate+=plane(xx,yy,18,circle(0,0,2,'#f1b6a7'))
for k in range(4):
 gate+=route([(362+k*29,182,18),(362+k*29,286,18)],'#6c96ad',.5)
for yy in [193,232,278]:gate+=route([(361,yy,18),(469,yy,18)],'#9ab9ca',.5)
for j,(name,keys) in enumerate([
 ('Identidad',[('sesión','MS / activa'),('origen','Equipo'),('resultado','Validada')]),
 ('Permiso',[('acción','Aprobar'),('rol','Responsable'),('política','Permitir')]),
 ('Alcance',[('proyecto','P-104'),('recurso','Orden 0248'),('resultado','Coincide')])]):
 x=359+j*3;y=180+j*5;z=30+j*26
 face=rect(0,0,112,103,'#24413f','#80cdbd',1.5,'fill-opacity=".18"')
 face+=f'<g data-sw-gate-content="{j}">'
 face+=rect(4,4,104,77,'#345d73','none',1,'fill-opacity=".12"')
 face+=rect(4,4,104,18,'#284858','#80b5c8',1,'fill-opacity=".78"')
 face+=txt(10,16,f'0{j+1}',6.3,'#f0a697',600)+txt(24,16,name,9.4,'#edf5f8',600)
 for k,(key,value) in enumerate(keys):
  yy=34+k*18
  face+=rect(5,yy-9,102,15,'#14292c','none',1,'fill-opacity=".9"')
  face+=txt(10,yy,key,6.6,'#a9c4d1')+txt(103,yy,value,8.0,'#edf5f8',500,'text-anchor="end"')
  face+=line([(10,yy+5),(103,yy+5)],'#a9c1cf',.32)
 face+=line([(12,89),(99,89)],'#86aabc',.55)+circle(12,89,1.8,RED)+circle(99,89,1.8,GREEN)
 face+=txt(55,98,'CONTEXTO / 0248',4.5,'#9bbdca',500,'text-anchor="middle"')
 face+='</g>'
 panel=plane(x,y,z,face)
 panel+=route([(x,y,z),(x+112,y,z),(x+112,y+103,z)],'#dceef8',.7)
 q=p(x+107,y+8,z+1);panel+=circle(*q,1.7,'#b0c5cf',f'data-sw-check="{j}"')
 gate+=f'<g data-sw-gate="{j}">{panel}</g>'
 # Fine registration ties identify the common substrate without thick posts.
 for xx,yy in [(x,y),(x+112,y+103)]:
  base=p(xx,yy,18);tip=p(xx,yy,z)
  gate+=line([base,tip],'#718fa2',.4,f'stroke-dasharray="1.5 3" data-sw-registration="{j}" data-base="{base[0]},{base[1]}" data-tip="{tip[0]},{tip[1]}"')
gate+=label(2,473,503,'Acceso verificado','Identidad → rol → alcance')
# An actual integration contract, rather than an ornamental chip.
api=box(503,62,20,159,125,2,fill='#dceaf3')
c=rect(0,0,159,125,'url(#sw-porcelain)','#a8bdcd',2)
c+=txt(9,14,'API / v3',9,INK,600)+txt(151,14,'0248-A',6.5,MUTED,500,'text-anchor="end"')
c+=line([(8,22),(151,22)],'#8faabd',.5)
c+=rect(8,29,23,12,'#d8ece5','none',2)+txt(11,37,'POST',6,GREEN,600)
c+=txt(37,37,'Aprobar / 0248',8,INK,500)
c+=txt(9,54,'SOLICITUD',6.2,MUTED,600)+txt(93,54,'PRODUCTO',6.2,MUTED,600)
for j,(a,b) in enumerate([('Proyecto','P-104'),('Responsable','Redes'),('Sede','Mendoza')]):
 yy=65+j*15
 c+=rect(7,yy-7,65,12,'#e6eff5','none',1)+rect(89,yy-7,63,12,'#e6eff5','none',1)
 c+=txt(11,yy,a,8,INK,500)+txt(93,yy,b,8,INK,500)
 c+=line([(73,yy-2),(87,yy-2)],'#a4bbc9',.6)
 c+=line([(73,yy-2),(87,yy-2)],RED,1.1,f'data-sw-mapping="{j}" opacity=".15"')
 c+=poly([(84,yy-4),(88,yy-2),(84,yy)],'#819ead','none',0)
c+=line([(8,105),(151,105)],EDGE,.4)+circle(12,114,1.6,GREEN)+txt(18,116,'202 / Aceptada',6.4,GREEN,600)+txt(150,116,'schema / v3',5.8,MUTED,400,'text-anchor="end"')
api+=plane(503,62,22,c)
# Optical membrane registers the contract above the underlying request bus.
under=rect(0,0,159,125,'#accfe4','#a0c2d4',2,'fill-opacity=".09"')
api+=plane(503,62,49,under)
for xx,yy in [(503,62),(662,62),(662,187),(503,187)]:api+=route([(xx,yy,22),(xx,yy,49)],'#8ba7bb',.4)
api+=label(3,700,530,'Un contrato compartido','Tres campos · un mismo significado')
# Persistence is a relation between records, never a stack of generic books.
data=box(680,-52,10,151,140,2,fill='#d4e5f0')
def table_face(title,rows,w=66):
 c=rect(0,0,w,58,'#f4f8fb','#afc4d2',1.5)+rect(0,0,w,16,'#d9e8f2','none',1.5)+txt(5,11,title,7,INK,600)
 for i,(key,val) in enumerate(rows):
  y=25+i*12;c+=txt(5,y,key,5,MUTED,500)+txt(w-5,y,val,5.3,INK,500,'text-anchor="end"')
  if i<2:c+=line([(5,y+4),(w-5,y+4)],'#d7e1e9',.3)
 return c
for x,y,z,title,rows in [
 (686,-45,20,'proyectos',[('PK / id','P-104'),('nombre','Nueva sede'),('sede','Mendoza')]),
 (760,-45,32,'órdenes',[('PK / id','0248'),('FK / proyecto','P-104'),('versión','3')]),
 (760,23,20,'eventos',[('PK / seq','000187'),('FK / orden','0248'),('acción','approval')])]:
 data+=f'<g data-sw-table="{title}">'+box(x,y,z-2,66,58,2,'#edf5fa')+plane(x,y,z,table_face(title,rows))+'</g>'
 for xx,yy in [(x,y),(x+66,y+58)]:data+=route([(xx,yy,12),(xx,yy,z)],'#8eaabd',.4,'stroke-dasharray="1 2"')
data+=route([(752,-20,20),(756,-20,20),(756,-20,32),(760,-20,32)],'#68899d',.75)
data+=route([(793,13,32),(793,19,32),(793,19,20),(793,23,20)],'#68899d',.75)
for x,y,z in [(752,-20,20),(760,-20,32),(793,13,32),(793,23,20)]:data+=plane(x,y,z,circle(0,0,1.2,RED))
log=rect(0,0,66,58,'#edf5fa','#afc4d2',1.5)+txt(5,11,'TRANSACCIÓN',6,INK,600)
for i,t in enumerate(['validar versión','actualizar orden','anexar evento']):log+=txt(5,24+i*10,f'{i+1:02}  {t}',4.7,MUTED)
data+=plane(686,23,20,log)
write=box(686,89,19,140,43,2,'#f8fbfd')+plane(686,89,21,txt(6,10,'COMMIT / 0248',6.7,INK,600)+line([(6,15),(134,15)],EDGE,.4)+txt(6,27,'En revisión',7,MUTED,600,'data-sw-record-state="true"')+txt(134,27,'MS · versión 3',5.8,MUTED,400,'text-anchor="end"')+txt(6,37,'La respuesta sale después del registro.',5.0,MUTED))
data+=f'<g data-sw-record="true">{write}</g>'+label(4,928,596,'Una historia preservada','Relaciones · transacción · evento')
# Release: three optically thin sheets, each with its own verifiable content.
delivery=box(40,-27,10,227,98,2,fill='#d2dfe7')
for j,(title,sub) in enumerate([('Pruebas','12 / 12'),('Artefacto','1.8.3'),('Publicación','Gradual')]):
 x=47+j*74
 card=rect(0,0,69,83,'#f2f7fa','#b4cad8',2)+txt(6,13,title,7.8,INK,600)+txt(6,26,sub,7,GREEN if j==0 else MUTED,500)+line([(6,33),(63,33)],EDGE,.45)
 if j==0:
  for i,t in enumerate(['contratos','regresión','seguridad']):card+=circle(8,43+i*11,1.6,GREEN)+txt(14,45+i*11,t,5.4,MUTED)
 elif j==1:
  card+=txt(6,45,'sha256 / 9c42…',5.6,INK,500)+txt(6,56,'imagen / firmada',5.2,MUTED)+txt(6,67,'versión / trazable',5.2,MUTED)
 else:
  for i,(n,fill) in enumerate([('canary','#c6dce9'),('10 %','#a6c9dc'),('100 %','#8cbbd1')]):card+=rect(6,39+i*11,57,8,fill,'none',1)+txt(9,45+i*11,n,5.2,INK)
 delivery+=box(x,-20,18+j*3,69,83,1.5,'#e5eff5')+plane(x,-20,19.5+j*3,card)
 if j<2:delivery+=route([(x+69,21,20+j*3),(x+74,21,23+j*3)],'#93b4c8',.8)
release=box(270,14,33,34,29,1.5,'#fff')+plane(270,14,34.5,txt(17,13,'1.8.3',7,INK,600,'text-anchor="middle"')+txt(17,22,'release',5.3,MUTED,500,'text-anchor="middle"'))
delivery+=f'<g data-sw-release="true">{release}</g>'+label(5,361,70,'Publicar con control','Pruebas → versión → despliegue')
# Runtime: processes, request queues, trace registers, an explicit inlet.
infra=box(300,-55,9,156,126,2,'#c4d6e1')
for j in range(2):
 x=306+j*75
 card=rect(0,0,69,109,'#e9f2f8','#9fbacd',2)+txt(6,13,f'app-0{j+1}',8.7,INK,600)+txt(6,25,'1.8.3 / disponible',5.5,MUTED)
 card+=line([(6,31),(63,31)],'#abc3d2',.4)+txt(6,42,'SOLICITUDES',4.8,MUTED,600)
 for k in range(5):
  xx=7+k*11;card+=rect(xx,49,8,13,'#fafdff','#a1bccd',1)+line([(xx+2,53),(xx+6,53),(xx+6,58)],'#96b6c9',.35)
 card+=txt(6,75,'traza / 0248-A',6,INK,500)+txt(6,86,'sesión → permiso',5.3,MUTED)+txt(6,97,'respuesta → registro',5.3,MUTED)
 infra+=box(x,-49,16+j*6,69,109,2,'#dae8f1')+plane(x,-49,18+j*6,card)
 infra+=plane(x,-49,18+j*6,circle(61,13,1.7,GREEN,f'data-sw-health="{j}"'))
 for xx,yy in [(x,-49),(x+69,60)]:infra+=route([(xx,yy,11),(xx,yy,18+j*6)],'#8ca9bb',.4)
infra+=route([(376,93,15),(376,67,15),(337,67,15),(337,60,18)],'#87a8ba',.8)
infra+=route([(376,67,15),(412,67,15),(412,60,24)],'#87a8ba',.8)
monitor=rect(0,0,156,51,'#edf5fa','#adc5d2',2)+txt(8,12,'OBSERVACIÓN',6.3,INK,600)+txt(148,12,'Ejemplo',5.3,MUTED,400,'text-anchor="end"')+line([(8,37),(148,37)],EDGE,.35)
for j,(col,offset) in enumerate([(GREEN,0),('#678ba5',6)]):
 monitor+=line([(8+i*7,27+offset+v) for i,v in enumerate([2,1,2,-2,-1,0,-4,-2,1,2,-3,-1,-5,-3,-2,1,-4,-2,0,-1,1])],col,.7)
monitor+=txt(8,47,'trazas · métricas · alertas · recuperación',5.2,MUTED)
infra+=box(300,101,9,156,51,1.5,'#d8e5ec')+plane(300,101,10.5,monitor)
infra+=label(6,674,92,'Sostener la operación','Dos réplicas · respaldo · monitoreo')
# Routes in the same coordinate system as the mechanisms, with distinct semantics.
paths={
 0:[(313,402,114),(344,402,114),(344,311,28),(359,277,28)],
 1:[(475,277,28),(489,277,28),(489,202,22),(503,172,22)],
 2:[(662,175,22),(671,175,22),(671,-65,20),(780,-65,32),(780,-45,32)],
 3:[(756,132,21),(756,198,12),(652,438,12),(313,438,12),(313,423,114)],
 4:[(218,10,25),(270,10,25),(301,4,18),(337,-5,18)],
 5:[(412,60,24),(475,60,14),(475,125,14),(503,125,22)],
}
links=''
for n,v in paths.items():
 links+=route(v,'#638377',.7,f'data-sw-route-base="{n}" opacity=".2" '+('stroke-dasharray="4 5"' if n==4 else ''))
 links+=route(v,'#ed9587' if n<4 else '#84c9b7',1.3,f'data-sw-trace="{n}" pathLength="100" stroke-dasharray="0 100"')
 coords=';'.join(f'{x:.3f},{y:.3f}' for x,y in [p(*q) for q in v])
 links+=f'<g data-sw-token="{n}" data-points="{coords}" opacity="0">{circle(0,0,4,"#dc2626" if n<4 else "#456c88")}{circle(0,0,1.5,"#fff")}</g>'
# Quiet construction guides disclose a single space without another large card.
floor=''
for x in [0,250,500,790]:floor+=route([(x,-55,0),(x,450,0)],'#34434e',.45,'stroke-dasharray="2 6"')
for y in [-55,155,450]:floor+=route([(0,y,0),(800,y,0)],'#34434e',.45,'stroke-dasharray="2 6"')
body='<g opacity=".18">'+floor+'</g>'+links+node(4,delivery)+node(5,infra)+node(3,data)+node(2,api)+node(1,gate)+node(0,ui)
# Horizontal caption is never responsible for explaining the tiny glyphs inside a product.
body+=txt(1105,644,'Sistema ilustrativo · datos de ejemplo',10,'#788e9d',400,'text-anchor="end"')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" class="ds-svg" viewBox="0 0 1000 650" role="presentation" aria-hidden="true">
<g class="ds-drawing sw-system" data-discipline-drawing="104">
<defs><linearGradient id="sw-porcelain" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#e8f0f6"/></linearGradient></defs>
<style>.sw-system text{{font-family:var(--um-font-body,'UM Sans',Arial,sans-serif);stroke:none;letter-spacing:0}}.sw-system .sw-component{{opacity:1}}.sw-system[data-enhanced=true] [data-sw-drawer]{{opacity:0}}.sw-system .sw-label{{pointer-events:none}}</style>
<svg class="sw-viewport" x="0" y="0" width="1000" height="650" viewBox="0 0 1200 650" overflow="hidden">{body}</svg>
</g></svg>'''
import xml.etree.ElementTree as ET
ET.register_namespace('', 'http://www.w3.org/2000/svg')
xml=ET.fromstring(svg)
for el in xml.iter():
 tag=el.tag.rsplit('}',1)[-1];fill=el.get('fill','').lower();stroke=el.get('stroke','').lower()
 if fill.startswith('#') and len(fill)==4:fill='#'+''.join(c*2 for c in fill[1:])
 if tag=='text':
  if fill==INK:el.set('fill','#e7f0f5')
  elif fill==MUTED:el.set('fill','#a8bfcd')
  elif fill==GREEN:el.set('fill','#70cdb8')
  elif fill==RED:el.set('fill','#ef867d')
 elif fill==GREEN and tag=='circle':el.set('fill','#70cdb8')
 elif fill.startswith('#') and len(fill)==7:
  r,g,b=(int(fill[i:i+2],16) for i in (1,3,5))
  if min(r,g,b)>=155 and max(r,g,b)-min(r,g,b)<90:
   el.set('fill','#1f3338' if min(r,g,b)<220 else '#162a30')
   el.set('fill-opacity',str(min(.80 if tag=='rect' else .22,float(el.get('fill-opacity','1')))))
 if stroke.startswith('#') and len(stroke)==7:
  r,g,b=(int(stroke[i:i+2],16) for i in (1,3,5))
  if min(r,g,b)>135 and max(r,g,b)-min(r,g,b)<85:el.set('stroke','#637f83')
 if tag=='stop':
  el.set('stop-color','#1a373b' if el.get('offset')=='1' else '#284b4b');el.set('stop-opacity','.24')
svg=ET.tostring(xml,encoding='unicode')
(ROOT/'src/assets/cine/isometric/discipline-104-v7.svg').write_text(svg)
print(f'Authored {len(svg):,} bytes; six distinct components, separate request/release paths.')
