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
 return f'<g {extra}>'+poly([q[1],p(x+w,y,z),p(x+w,y+d,z),q[2]],'#b4c5d0')+poly([q[3],q[2],p(x+w,y+d,z),p(x,y+d,z)],'#d8e2e9')+poly(q,fill,'#d8e3e9',.65)+'</g>'
def label(n,x,y,title,sub):
 return f'<g class="sw-label">{txt(x,y,f"0{n}",10,"#ee6b70",600)}{txt(x+25,y,title,15,"#e4ebf0",500)}{txt(x+25,y+17,sub,10,"#91a5b3")}</g>'
def node(n,body):
 shape,label=body.split('<g class="sw-label">',1)
 return f'<g class="sw-component" data-discipline-node="{n}" data-sw-focus="{n}"><g class="sw-machine">{shape}</g><g class="sw-label">{label}</g>' 
def port(x,y,z):return plane(x,y,z,rect(0,0,6,12,'#5a7488','#8fa5b6',1)+rect(1.5,2,3,8,'#a9cbd6','none',.5))
# A miniature product, with a real selected task and an accessible detail panel.
ui=box(0,210,74,332,206,6)
c=rect(0,0,332,206,'url(#sw-porcelain)','#e4ecf1',5)
c+=rect(0,0,332,25,'#edf2f6','none',5)+txt(13,17,'UM',10,RED,600)+txt(40,17,'Operaciones',8.5,INK,600)+txt(130,17,'/ Nueva sede',8,MUTED)
c+=rect(247,7,53,11,'#fff','none',3)+txt(253,15,'Buscar…',6,MUTED)+circle(316,12,5,'#c5d6e1')
c+=rect(0,25,56,180,'#eef3f6','none',0)+txt(9,43,'EQUIPO',5.5,MUTED,600)
for i,s in enumerate(['Resumen','Solicitudes','Proyectos','Actividad']):
 y=61+i*22
 if i==1:c+=rect(5,y-10,46,17,'#f4e2e5','none',3)
 c+=rect(10,y-6,5,5,'none',RED if i==1 else MUTED,1)+txt(20,y,s,5.7,RED if i==1 else MUTED,500)
c+=line([(8,158),(48,158)],'#d5e0e8',.45)+circle(15,175,5,'#d4e1e9')+txt(25,174,'Tu equipo',6,INK,500)+txt(25,183,'5 miembros',5,MUTED)
c+=txt(69,46,'Solicitudes',16,INK,500)+txt(69,59,'Organizá el trabajo. Conservá el contexto.',7,MUTED)
c+=rect(254,35,64,20,'#203e52','none',4)+txt(286,48,'+ Nueva solicitud',6.4,'#fff',500,'text-anchor="middle"')
for i,(s,v) in enumerate([('Pendientes','12'),('En curso','08'),('Resueltas','24')]):
 x=69+i*85;c+=txt(x,82,s,6.6,MUTED)+txt(x,103,v,21,INK,500)+line([(x,111),(x+73,111)],'#dbe4eb',.55)
c+=txt(69,130,'SOLICITUD',5.8,MUTED,600)+txt(201,130,'EQUIPO',5.8,MUTED,600)+txt(275,130,'ESTADO',5.8,MUTED,600)
for i,(title,team,state) in enumerate([('0248 · Nueva sede','Redes','Por asignar'),('0247 · Portal interno','Producto','En curso'),('0246 · Conector ERP','Datos','Resuelta')]):
 y=148+i*20
 if i==0:c+=rect(65,y-11,255,18,'#e5eef5','none',2)+rect(65,y-11,2,18,RED,'none',0)
 c+=txt(72,y,title,7.4,INK,500)+txt(201,y,team,6.5,MUTED)+txt(275,y,state,6.1,GREEN if i==2 else MUTED,400,'data-sw-ui-state="true"' if i==0 else '')
ui+=plane(0,210,80,c)
# A task detail rises just 12px from its own selected row; the underlying app stays visible.
d=rect(0,0,143,118,'#fff','#bed0db',4)+txt(10,17,'0248 / Nueva sede',10,INK,600)+line([(10,25),(133,25)],EDGE,.4)+txt(10,39,'RESPONSABLE',5.8,MUTED,600)+circle(18,53,6,'#e0ebf1')+txt(30,56,'Equipo de Redes',8,INK,500)+txt(10,75,'Proyecto',7,MUTED)+txt(133,75,'P-104',7,INK,500,'text-anchor="end"')+txt(10,90,'Permiso',7,MUTED)+txt(133,90,'Responsable',7,INK,500,'text-anchor="end"')+rect(10,99,123,13,'#dc2626','none',3,'data-sw-submit-bg="true"')+txt(71,108,'Asignar solicitud',6.8,'#fff',500,'text-anchor="middle" data-sw-submit="true"')
ui+=f'<g data-sw-drawer="true">{box(170,305,92,143,118,2)}{plane(170,305,94,d)}</g>'
ui+=label(1,92,444,'Una acción clara','Solicitud 0248 · asignar responsable')
# Authorization: three fine membranes with channels, each validating one condition.
gate=box(355,175,14,120,122,8,fill='#cbd9e2')
for j,(name,value) in enumerate([('Identidad','MS / equipo'),('Permiso','Responsable'),('Alcance','P-104')]):
 x=361+j*35
 gate+=box(x,182,22,4,108,78,fill='#eaf3f7')
 # Fine aperture outlines on each face, plus a panel that physically withdraws.
 panel=poly([p(x+4,196,34),p(x+4,268,34),p(x+4,268,87),p(x+4,196,87)],'#e9f1f5','#93acbc',.55)
 for k in range(7):panel+=route([(x+4,204+k*8,39),(x+4,204+k*8,82)],'#bbceda',.45)
 gate+=f'<g data-sw-gate="{j}">{panel}</g>'
 gate+=plane(x-1,178,103,txt(0,0,name,6.1,'#dce7ee',500))
 q=p(x+5,282,44);gate+=circle(*q,2.3,'#b0c5cf',f'data-sw-check="{j}"')
 gate+=route([(x,180,105),(x,290,105)],'#ecf4f8',.7)
 # Mounting shoes anchor the membranes to the same carriage.
 for yy in [179,282]:gate+=box(x-3,yy,22,10,10,5,'#adc1ce')
gate+=label(2,473,503,'Acceso verificado','Identidad → rol → alcance')
# API bridge: three contracts are distinct traces between two pin headers.
api=box(507,69,22,141,106,9)
api+=plane(507,69,31,rect(8,8,125,90,'#edf4f8','#a8becd',2))
for yy in [80,146]:
 api+=box(516,yy,31,117,12,9,'#d9e6ee')
 for k in range(13):api+=box(520+k*8,yy+2,40,2.5,7,3,'#8ba3b5')
for j,(a,b) in enumerate([('project.code','proyecto.id'),('owner.email','responsable'),('site.address','sede')]):
 yy=98+j*13
 body=txt(3,8,a,5.9,INK,500)+txt(110,8,b,5.9,INK,500,'text-anchor="end"')+line([(46,5),(62,5)],'#a7becd',.75)
 api+=plane(520,yy,38,body)
 api+=route([(568,yy+5,39),(582,yy+5,39)],RED,1.5,f'data-sw-mapping="{j}" opacity=".15"')
api+=box(548,99,42,34,28,7,'#fafcfd')+plane(548,99,49,txt(17,12,'API',8,INK,600,'text-anchor="middle"')+txt(17,22,'v3',5.8,MUTED,500,'text-anchor="middle"'))
api+=label(3,700,530,'Un contrato compartido','Tres campos · un mismo significado')
# Storage: a precise indexed archive with narrow volumes and a written event drawer.
data=box(690,-36,12,100,97,8,fill='#d3e1e9')
for j in range(7):
 y=-30+j*12
 data+=box(697,y,20,85,5,75,fill='#f7fafc')
 data+=route([(700,y+5,31),(776,y+5,31),(776,y+5,88)],'#a8becb',.5)
 data+=wall(700,y+5,82,txt(2,0,f'0{j+1}',6.5,MUTED,500))
 for k in range(9):data+=route([(713+k*6,y+5,38),(713+k*6,y+5,69)],'#c5d6e0',.45)
write=box(700,51,26,80,50,4,'#fff')+plane(700,51,30,txt(7,12,'0248 / P-104',7,INK,600)+line([(7,18),(73,18)],EDGE,.45)+txt(7,29,'Asignada',7,GREEN,600)+txt(7,41,'MS · versión 3',6,MUTED))
data+=f'<g data-sw-record="true">{write}</g>'
data+=label(4,928,561,'Una historia preservada','Registro · relación · evento')
# Delivery is a separate control path. The release does not process a request.
delivery=box(55,-18,10,195,74,6,fill='#d2dfe7')
for j,(title,sub) in enumerate([('Pruebas','12 / 12'),('Artefacto','1.8.3'),('Publicación','Gradual')]):
 x=61+j*64
 delivery+=box(x,-12,16,55,58,8,'#e7eff4')
 delivery+=plane(x,-12,24,txt(5,12,title,7,INK,500)+txt(5,24,sub,6,MUTED))
 for k in range(4):delivery+=box(x+6+k*11,18,24,7,18,2,'#8ca8bb' if j==1 else '#c1d5df')
 delivery+=plane(x,-12,24,circle(47,10,1.8,GREEN))
release=box(128,-8,33,34,29,10,'#fff')+plane(128,-8,43,txt(17,13,'1.8.3',7,INK,600,'text-anchor="middle"')+txt(17,22,'release',5.3,MUTED,500,'text-anchor="middle"'))
delivery+=f'<g data-sw-release="true">{release}</g>'+label(5,361,70,'Publicar con control','Pruebas → versión → despliegue')
# Infrastructure: two independently observable app replicas, the storage below them.
infra=box(305,-48,10,146,103,8,'#c4d6e1')
for j in range(2):
 x=313+j*69
 infra+=box(x,-40,18,60,74,42,'#eef5f9')
 infra+=plane(x,-40,60,txt(7,13,f'app-0{j+1}',8,INK,600)+txt(7,24,'1.8.3',6,MUTED))
 for k in range(10):infra+=route([(x+8,-4+k*2.8,61),(x+51,-4+k*2.8,61)],'#b5cad7',.6)
 for k in range(4):infra+=wall(x+7,34,43,rect(k*11,0,7,10,'#a9c1cf','#a9c1cf',1))
 q=p(x+48,34,25);infra+=circle(*q,2,GREEN,f'data-sw-health="{j}"')
infra+=plane(305,44,20,txt(9,0,'OBSERVABILIDAD',5.8,MUTED,600))
monitor=rect(0,0,146,51,'#eef5f8','#adc5d2',2)+txt(8,12,'RESPUESTA DE LA APLICACIÓN',5.7,MUTED,600)+txt(138,12,'42 ms',6.2,GREEN,500,'text-anchor="end"')+line([(8,40),(138,40)],EDGE,.4)+line([(8+i*6.5,32+v) for i,v in enumerate([2,1,2,-2,-1,0,-4,-2,1,2,-3,-1,-5,-3,-2,1,-4,-2,0,-1,1])],GREEN,.8)+txt(8,48,'Ejemplo de observación · salud y latencia',4.8,MUTED)
infra+=box(305,67,9,146,51,3,'#d8e5ec')+plane(305,67,12,monitor)
infra+=label(6,674,92,'Sostener la operación','Dos réplicas · respaldo · monitoreo')
# Routes in the same coordinate system as the mechanisms, with distinct semantics.
paths={
 0:[(303,380,81),(336,380,81),(350,315,28),(359,277,28)],
 1:[(359,277,28),(455,277,28),(478,234,28),(505,172,31)],
 2:[(636,164,31),(665,164,31),(685,115,20),(707,58,25)],
 3:[(737,67,26),(749,198,12),(652,309,12),(380,430,12),(275,418,81)],
 4:[(218,10,25),(270,10,25),(301,4,31),(339,-5,60)],
 5:[(422,37,25),(463,47,12),(486,89,12),(543,150,23)],
}
links=''
for n,v in paths.items():
 links+=route(v,'#6c8494' if n!=4 else '#557484',1,'stroke-dasharray="4 5"' if n==4 else '')
 links+=route(v,'#ed7178' if n<4 else '#9cc6dd',1.7,f'data-sw-trace="{n}" pathLength="100" stroke-dasharray="0 100"')
 coords=';'.join(f'{x:.3f},{y:.3f}' for x,y in [p(*q) for q in v])
 links+=f'<g data-sw-token="{n}" data-points="{coords}" opacity="0">{circle(0,0,8,"#dc2626" if n<4 else "#456c88")}{circle(0,0,3,"#fff")}</g>'
# Quiet construction guides disclose a single space without another large card.
floor=''
for x in [0,250,500,790]:floor+=route([(x,-55,0),(x,450,0)],'#34434e',.45,'stroke-dasharray="2 6"')
for y in [-55,155,450]:floor+=route([(0,y,0),(800,y,0)],'#34434e',.45,'stroke-dasharray="2 6"')
body=floor+links+node(4,delivery)+node(5,infra)+node(3,data)+node(2,api)+node(1,gate)+node(0,ui)
# Horizontal caption is never responsible for explaining the tiny glyphs inside a product.
body+=txt(1105,628,'Sistema ilustrativo · datos de ejemplo',10,'#788e9d',400,'text-anchor="end"')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" class="ds-svg" viewBox="0 0 1000 650" role="presentation" aria-hidden="true">
<g class="ds-drawing sw-system" data-discipline-drawing="104">
<defs><linearGradient id="sw-porcelain" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#e8f0f6"/></linearGradient></defs>
<style>.sw-system text{{font-family:var(--um-font-body,'UM Sans',Arial,sans-serif);stroke:none;letter-spacing:0}}.sw-system .sw-component{{opacity:1}}.sw-system[data-enhanced=true] [data-sw-drawer]{{opacity:0}}.sw-system .sw-label{{pointer-events:none}}</style>
<svg class="sw-viewport" x="0" y="0" width="1000" height="650" viewBox="0 0 1200 650" overflow="hidden">{body}</svg>
</g></svg>'''
(ROOT/'src/assets/cine/isometric/discipline-104-v4.svg').write_text(svg)
print(f'Authored {len(svg):,} bytes; six distinct components, separate request/release paths.')
