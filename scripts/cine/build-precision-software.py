"""Six inspectable software layers: authored interfaces, schemas and dependencies."""
from pathlib import Path
import importlib.util
from html import escape
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('precision',ROOT/'scripts/cine/build-precision-network.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def rect(x,y,w,h,fill='none',stroke='#41464d',sw=.6,r=0):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def txt(x,y,s,size=8,fill='#aeb3b9',weight=400):return f'<text x="{x}" y="{y}" class="ps-text" font-size="{size}" fill="{fill}" font-weight="{weight}">{escape(s)}</text>'
def path(d,color='#646b73',width=.65,cls=''):return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" class="{cls}"/>'
def dot(x,y,r=1.5,fill='#dc2626'):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>'
def head(n,title,meta):return txt(15,20,f'{n:02}   {title}',10,'#c4c7cc',600)+txt(15,34,meta,6.5,'#81878e')+path('M14 43H316','#41464d',.5)

def interface():
 c=rect(7,7,316,192,'#111316','#81878e',.65,2)+path('M7 31H323M61 31V199')
 c+=txt(17,22,'UM',11,'#c4c7cc',600)+txt(80,22,'Operación / Solicitudes',8,'#c4c7cc')+txt(268,22,'Equipo UM',6.5)
 for i,t in enumerate(['Resumen','Solicitudes','Proyectos','Personas','Actividad']):
  y=51+i*18
  if i==1:c+=rect(11,y-10,46,16,'#251719','none')
  c+=rect(16,y-5,5,5,'none','#b13c40' if i==1 else '#646b73',.5)+txt(25,y,t,5.5,'#c4c7cc' if i==1 else '#81878e')
 c+=txt(74,54,'Solicitudes del equipo',12,'#dfe1e3',600)+txt(75,68,'Cada tarea, con su contexto y su responsable.',6.3)
 for i,(v,t) in enumerate([('24','Activas'),('08','En ejecución'),('16','Resueltas')]):
  x=75+i*79;c+=rect(x,79,73,34,'#15171a','#41464d',.45,1)+txt(x+7,100,v,16,'#c4c7cc',500)+txt(x+31,96,t,5.6)
  c+=path(f'M{x+33} 104h27','#646b73',.5)
 c+=path('M75 130H307M75 146H307M75 162H307M75 178H307M75 194H307','#41464d',.45)
 for x,t in [(76,'SOLICITUD'),(187,'RESPONSABLE'),(257,'ESTADO')]:c+=txt(x,126,t,5.6,'#81878e')
 for i,(task,who,state) in enumerate([('0248 · Nueva sede','Redes','En revisión'),('0247 · Portal interno','Producto','En ejecución'),('0246 · Integración ERP','Datos','Resuelta'),('0245 · Alta de activos','Operaciones','Resuelta')]):
  y=140+i*16
  if i==0:c+=rect(74,y-9,234,14,'#21171a','none')+path(f'M75 {y-8}v12','#dc2626',1.3)
  c+=txt(81,y,task,6.2)+txt(187,y,who,6.1)+dot(258,y-2,1,'#dc2626' if i<2 else '#81878e')+txt(263,y,state,5.8)
 return c

def rules():
 c=head(2,'REGLAS Y PERMISOS','Una solicitud conserva su estado y su responsable.')
 for x,title,content in [(16,'Validación',['Campos obligatorios','Consistencia del dato','Alcance del proyecto']),(123,'Autorización',['Rol de la persona','Permiso de la acción','Contexto del equipo']),(230,'Transición',['Estado anterior','Acción permitida','Próximo responsable'])]:
  c+=rect(x,57,84,89,'#121417','#646b73',.65,1)+txt(x+8,75,title,8,'#c4c7cc',600)
  for i,t in enumerate(content):c+=rect(x+8,85+i*17,4,4,'none','#81878e',.5)+txt(x+17,89+i*17,t,5.4)
 c+=path('M58 146v18h107v-18m0 18h107v-18','#81878e',.8)+dot(165,164,2)
 c+=txt(17,186,'SOLICITUD 0248',6.4,'#c4c7cc')+txt(127,186,'Validada → asignada',7,'#c4c7cc')
 return c

def integrations():
 c=head(3,'INTEGRACIONES','Contratos claros para intercambiar información.')
 c+=rect(15,55,133,125,'#121417','#81878e',.6,1)+txt(24,69,'POST /solicitudes',8,'#c4c7cc',600)
 c+=path('M24 78H139','#41464d',.5)
 for i,t in enumerate(['{','  id: "0248",','  estado: "asignada",','  equipo: "redes",','  version: 3','}']):c+=txt(26,94+i*12,t,7,'#aeb3b9')
 for i,(title,sub) in enumerate([('ERP','Proyecto y presupuesto'),('Identidad','Usuario y permisos'),('Notificación','Responsable y evento')]):
  y=56+i*45;c+=rect(205,y,108,36,'#121417','#646b73',.6,1)+txt(213,y+14,title,7,'#c4c7cc',600)+txt(213,y+26,sub,5.6)
  c+=path(f'M148 {91+i*22}h25V{y+18}h32','#81878e',.65)+dot(173,91+i*22,1.4)
 c+=txt(17,196,'Autenticación · errores · reintentos · trazabilidad',6.5)
 return c

def data():
 c=head(4,'DATOS Y TRAZABILIDAD','Registros relacionados. Historia preservada.')
 tables=[(15,'solicitudes',['PK  id','FK  proyecto_id','FK  responsable_id','    estado','    version']),(124,'personas',['PK  id','    nombre','FK  equipo_id','    rol','    activo']),(233,'eventos',['PK  id','FK  solicitud_id','FK  actor_id','    acción','    fecha'])]
 for x,name,fields in tables:
  c+=rect(x,55,85,131,'#111316','#646b73',.65,1)+rect(x,55,85,23,'#1a1c20','#646b73',.65,1)+txt(x+7,70,name,8,'#c4c7cc',600)
  for j,f in enumerate(fields):c+=txt(x+7,93+j*19,f,6.4)+path(f'M{x} {99+j*19}h85','#41464d',.4)
 c+=path('M100 112h12V104h12M209 131h12V112h12','#b13c40',.9)
 return c

def delivery():
 c=head(5,'DESPLIEGUE CONTROLADO','Cada cambio tiene una versión y un camino de vuelta.')
 for i,(name,state) in enumerate([('Verificar','Pruebas'),('Construir','Artefacto'),('Publicar','Versión'),('Observar','Salud')]):
  x=16+i*79;c+=rect(x,63,64,62,'#111316','#646b73',.6,1)+txt(x+7,81,name,7.5,'#c4c7cc',600)+txt(x+7,111,state,6)+path(f'M{x+9} 93l4 4 8-9','#c4c7cc',.8)
  if i<3:c+=path(f'M{x+64} 94h15','#81878e',.75)
 c+=path('M48 125v23h235v-23','#41464d',.6)
 for x,t in [(17,'Desarrollo'),(122,'Validación'),(227,'Producción')]:
  c+=rect(x,163,88,24,'#121417','#646b73',.5,1)+txt(x+8,178,t,7)
 c+=txt(141,149,'v 1.8.3',6,'#c4c7cc')
 return c

def infrastructure():
 c=head(6,'INFRAESTRUCTURA','Cómputo, red, almacenamiento y continuidad.')
 for i,(label,code) in enumerate([('Aplicación','app / 01'),('Servicios','api / 02'),('Base de datos','db / 03')]):
  x=17+i*105;c+=rect(x,62,86,89,'#111316','#81878e',.6,1)+txt(x+7,79,label,7,'#c4c7cc',600)
  for j in range(3):
   c+=rect(x+7,89+j*17,72,12,'#16181b','#646b73',.45,1)
   for k in range(7):c+=path(f'M{x+11+k*4} {93+j*17}v4','#81878e',.5)
   c+=dot(x+72,95+j*17,1,'#dc2626' if j==0 else '#81878e')
  c+=txt(x+7,143,code,5.7)
 c+=path('M60 151v13h210v-13m-105 0v13','#81878e',.7)+dot(165,164,2)
 c+=path('M17 192h297M17 175v17','#41464d',.6)
 c+=path('M18 186l19-1 12-4 16 4 13-7 18 4 21-1 17-5 14 6 17-2 18 4 22-7 18 4 25-2 16 4 19-3 12 2','#81878e',.75)
 return c

surfaces=[interface(),rules(),integrations(),data(),delivery(),infrastructure()]
body=''
for i in reversed(range(6)):
 z=[235,192,145,100,54,8][i]
 plate=m.box(0,0,z,330,206,2,'fine')+m.top_plane(0,0,z+2.1,surfaces[i])
 # Four datum holes and an engraved part number locate each plane in the stack.
 for x,y in [(3,3),(327,3),(3,203),(327,203)]:plate+=m.circle3(x,y,z+2.2,1,'top','fine',.4)
 body+=m.group(plate,'ps-layer',i,extra=f'style="--ps-depth:{i}"')
body=f'<g transform="translate(472 255)">{body}</g>'
labels=''.join(m.tag(i,817,190+i*45,label,'right') for i,label in enumerate(['Experiencia','Reglas','Integración','Datos','Despliegue','Operación']))
style=m.STYLE+'''
.ps-layer{transition:transform 2400ms cubic-bezier(.45,0,.2,1),opacity 1100ms ease;opacity:1}
.ps-layer[data-current=true]{transform:translate(-183px,106px);opacity:1}
.ps-text{font-family:Arial,sans-serif;stroke:none;letter-spacing:.08px}
'''
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" class="ds-svg ps-svg" aria-hidden="true"><style>{style}</style><g class="ds-drawing ps-drawing" data-discipline-drawing="104">{body}{labels}</g></svg>'
(ROOT/'src/assets/cine/isometric/discipline-104-v2.svg').write_text(svg)
print(f'104 precision: {len(svg):,} bytes; six distinct inspectable software layers')
