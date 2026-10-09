"""Sixteen-second architectural journey through one product. Never publish automatically.
Actual UI hierarchy, shallow registered depth, restrained camera and studio shadows.
Blender runs only on a disposable remote worker; --validate-only is pure Python.
"""
import argparse,hashlib,importlib.util,json,math,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('geometry',Path(__file__).with_name('render-software-system-v8.py'))
geometry=importlib.util.module_from_spec(spec);spec.loader.exec_module(geometry)
FPS=60;FRAMES=960
ASPECT=16/9
PALETTE={'canvas':'#E6EBEF','nav':'#D9E2E9','paper':'#FFFFFF','edge':'#C9D0D4','ink':'#17242E','muted':'#465E70','quiet':'#677D8D','line':'#B7C7D2','red':'#DC2626','rose':'#FAEBEA','green':'#267B65','mint':'#EAF4EF','slate':'#526C82','bluewash':'#E2EEF5','floor':'#181D22','glass':'#CCE8F4','signal':'#18897D'}
E=geometry.ease
class UI(geometry.Product):
 def surface(self,g,x,y,w,h,m='paper',z=0,depth=.012,r=.065):
  self.rounded(g,x,y,z,w,h,depth,'edge',r)
  self.rounded(g,x,y,z+depth,w-.012,h-.012,.002,m,max(.01,r-.006))
 def label(self,g,s,x,y,size=.15,m='ink',bold=False,z=.051):self.text(g,s,x,y,z,size,m,bold)
 def rule(self,g,x1,x2,y,m='line',z=.024):self.line(g,[(x1,y,z),(x2,y,z)],m,.002)
 def vline(self,g,x,y1,y2,m='line',z=.024):self.line(g,[(x,y1,z),(x,y2,z)],m,.002)
 def disc(self,g,x,y,r=.022,m='green',z=.041):self.rounded(g,x,y,z,2*r,2*r,.001,m,r)
 def tag(self,g,s,x,y,w,m='mint',ink='green',z=.060):
  self.rounded(g,x+w/2,y+.035,z,w,.245,.002,m,.045)
  self.label(g,s,x+.075,y-.006,.112,ink,z=z+.005)
 def icon(self,g,kind,x,y,m='muted',size=.15,z=.049):
  shapes={'check':[(0,.4),(.3,.1),(.9,.8)],'chevron':[(0,.6),(.4,.2),(.8,.6)],'plus':[(0,.4),(.8,.4),(.4,.4),(.4,0),(.4,.8)],'grid':[(0,0),(.8,0),(.8,.8),(0,.8),(0,0)],'pulse':[(0,.3),(.2,.3),(.4,.8),(.6,0),(.75,.3),(1,.3)],'arrow':[(0,.4),(1,.4),(.65,.8),(1,.4),(.65,0)]}
  self.line(g,[(x+a*size,y+b*size,z) for a,b in shapes[kind]],m,.003)
 def avatar(self,g,name,x,y,ink='slate'):
  self.disc(g,x,y,.13,'bluewash');self.label(g,name,x-.077,y-.045,.105,ink)
 def boundary(self,g,x1,y1,x2,y2):
  self.line(g,[(x1,y1,.045),(x2,y1,.045),(x2,y2,.045),(x1,y2,.045),(x1,y1,.045)],'red',.0045)
  for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:self.disc(g,x,y,.015,'red',.046)

def build():
 p=UI();g='base';p.surface(g,0,0,16,9.7,'canvas',-.05,.018,.14)
 p.surface(g,0,4.43,15.96,.80,'paper',-.025,.01,.13)
 p.label(g,'UM',-7.64,4.40,.205,'red',True);p.label(g,'Operaciones',-7.07,4.40,.176,'ink',True)
 p.label(g,'/  Mendoza',-5.55,4.41,.139,'muted');p.icon(g,'chevron',-4.52,4.43,size=.11)
 p.surface(g,.8,4.44,4.5,.36,'canvas',.004,.003,.035);p.label(g,'Buscar proyectos, órdenes o personas',-1.26,4.39,.12,'quiet')
 p.label(g,'⌘ K',2.56,4.39,.115,'quiet');p.disc(g,5.94,4.46,.024,'green');p.label(g,'Todos los sistemas operativos',6.06,4.41,.111,'muted')
 p.rule(g,-7.98,7.98,4.02)
 # A quiet navigation rail; dense information belongs to the work, not decoration.
 p.surface(g,-6.80,-.37,2.32,8.73,'nav',-.024,.005,.01)
 p.label(g,'ESPACIO DE TRABAJO',-7.62,3.62,.105,'quiet',True)
 for i,(s,n) in enumerate([('Resumen',''),('Proyectos','12'),('Órdenes de trabajo','24'),('Equipo','8'),('Integraciones','4')]):
  y=3.12-i*.43
  if i==2:p.rounded(g,-6.81,y+.05,.014,2.02,.355,.002,'paper',.04)
  p.icon(g,'grid' if i!=4 else 'pulse',-7.57,y+.01,'red' if i==2 else 'muted',.13)
  p.label(g,s,-7.32,y,.132,'ink' if i==2 else 'muted',i==2)
  p.label(g,n,-6.09,y,.12,'quiet')
 p.rule(g,-7.62,-5.98,.86)
 p.label(g,'PROYECTOS RECIENTES',-7.62,.56,.105,'quiet',True)
 for i,(s,sub) in enumerate([('Nueva sede','MZA / implementación'),('Portal interno','Producto / evolución'),('Integración ERP','Datos / sincronización')]):
  y=.12-i*.68;p.disc(g,-7.55,y+.06,.025,'slate');p.label(g,s,-7.38,y,.131);p.label(g,sub,-7.38,y-.22,.109,'quiet')
 p.avatar(g,'MS',-7.49,-4.14);p.label(g,'Martín Santos',-7.22,-4.09,.133);p.label(g,'Equipo de operaciones',-7.22,-4.30,.102,'muted')
 # Working context stays connected to the selected detail at the right.
 g='list';p.label(g,'PROYECTOS  /  NUEVA SEDE',-5.22,3.62,.111,'quiet',True)
 p.label(g,'Órdenes de trabajo',-5.22,3.13,.31,'ink',True)
 p.label(g,'Un equipo, cada responsabilidad visible.',-5.21,2.82,.142,'muted')
 p.tag(g,'+ Nueva orden',-.60,3.19,1.31,'ink','paper')
 for x,s in [(-5.20,'Todas'),(-4.34,'En curso'),(-3.20,'Por revisar'),(-1.83,'Resueltas')]:p.label(g,s,x,2.34,.134,'ink' if s=='Todas' else 'muted',s=='Todas')
 p.rule(g,-5.22,.70,2.14);p.rule(g,-5.20,-4.74,2.14,'red')
 p.label(g,'ORDEN / ALCANCE',-5.20,1.83,.101,'quiet',True);p.label(g,'RESPONSABLE',-2.24,1.83,.101,'quiet',True);p.label(g,'ESTADO',-.59,1.83,.101,'quiet',True)
 rows=[('0248','Puesta en marcha','Redes','En revisión'),('0247','Acceso del equipo','Software','En curso'),('0246','Contrato de integración','Datos','Verificada'),('0245','Validación de respaldo','Soporte','Programada'),('0244','Inventario de servicios','Operación','Resuelta'),('0243','Pruebas de conectividad','Redes','Resuelta'),('0242','Alta de responsables','Software','Resuelta'),('0241','Revisión de permisos','Seguridad','Resuelta')]
 for i,(id,title,team,state) in enumerate(rows):
  yy=1.41-i*.48;gg='selection' if i==0 else g
  if i==0:p.rounded(gg,-2.24,yy+.043,.024,6.06,.425,.004,'paper',.025);p.box(gg,-5.25,yy+.043,.027,.022,.425,.002,'red')
  p.label(gg,id,-5.08,yy,.121,'red' if i==0 else 'quiet');p.label(gg,title,-4.54,yy,.138,'ink',i==0)
  p.label(gg,team,-2.18,yy,.125,'muted');p.disc(gg,-.56,yy+.045,.022,'green' if i>1 else 'red' if i==0 else 'slate');p.label(gg,state,-.45,yy,.117,'muted')
  if i!=0:p.rule(gg,-5.20,.71,yy-.205)
 p.label(g,'8 de 24 órdenes',-5.20,-2.66,.115,'quiet');p.label(g,'←   1   2   3   →',-.70,-2.66,.125,'muted')
 # Activity is a different editorial form: timeline, not another card.
 p.label(g,'ACTIVIDAD DEL PROYECTO',-5.20,-3.21,.104,'quiet',True)
 for i,(t,s) in enumerate([('10:42','MS solicitó revisión de la orden 0248'),('10:38','Contrato v3 validado · 3 campos relacionados'),('10:31','Nueva sede vinculada al proyecto P-104')]):
  yy=-3.58-i*.32;p.label(g,t,-5.20,yy,.113,'quiet');p.disc(g,-4.57,yy+.038,.020,'red' if i==0 else 'quiet');p.label(g,s,-4.40,yy,.120,'muted')
 # The actual inspector has its own hierarchy: summary, properties, permission,
 # change history, action. Every lifted region is registered to this one order.
 g='inspector';p.surface(g,4.28,-.15,6.0,8.30,'paper',0,.016,.055)
 p.label(g,'ORDEN 0248',1.64,3.50,.106,'quiet',True);p.tag(g,'En revisión',5.77,3.49,1.13,'rose','red')
 p.label(g,'Puesta en marcha',1.64,2.98,.335,'ink',True)
 p.label(g,'Nueva sede · Guaymallén',1.65,2.63,.148,'muted')
 p.rule(g,1.64,6.90,2.33)
 for y,label,value in [(1.99,'Proyecto','P-104 / Nueva sede'),(1.56,'Responsable','Equipo de Redes'),(1.13,'Prioridad','Normal'),(.70,'Fecha prevista','12 oct 2026')]:
  p.label(g,label,1.65,y,.133,'muted')
  if label=='Responsable':p.avatar(g,'MS',3.98,y+.046);p.label(g,value,4.22,y,.143)
  else:p.label(g,value,3.84,y,.143)
 p.rule(g,1.64,6.90,.41)
 p.label(g,'Una aprobación, con contexto.',1.65,.04,.168,'ink',True)
 p.label(g,'Revisamos el alcance y registramos quién autoriza el cambio.',1.65,-.22,.128,'muted')
 g='access';p.surface(g,4.28,-1.18,5.28,1.34,'paper',.024,.010,.035)
 p.rounded(g,4.28,-.76,.044,5.0,.34,.002,'paper',.02)
 p.icon(g,'check',1.83,-.80,'green',.19);p.label(g,'Permiso efectivo',2.16,-.74,.15,'ink',True)
 p.tag(g,'Verificado',5.75,-.78,.90,'mint','green')
 p.rule(g,1.82,6.74,-1.05,'edge',.044)
 for x,n,title,value in [(1.83,'01','Identidad','MS · sesión validada'),(3.57,'02','Rol','Responsable'),(5.22,'03','Alcance','Proyecto P-104')]:
  p.rounded(g,x+.73,-1.43,.044,1.57,.59,.002,'paper',.02)
  p.label(g,n,x,-1.31,.105,'green',True);p.label(g,title,x+.26,-1.31,.112,'muted')
  p.label(g,value,x,-1.60,.128,'ink',True)
 p.vline(g,3.34,-1.22,-1.67,'edge',.044);p.vline(g,5.00,-1.22,-1.67,'edge',.044)
 # Under the same control: the actual rule which authorizes this action.
 # This is revealed by lifting its interface, not a separate decorative object.
 g='policy';p.surface(g,4.28,-1.13,5.28,1.90,'bluewash',.06,.010,.035)
 p.label(g,'AUTORIZACIÓN / ORDEN 0248',1.83,-.45,.105,'slate',True,z=.10)
 p.tag(g,'3 condiciones',5.49,-.45,1.13,'paper','slate',z=.105)
 for i,(name,key,value) in enumerate([('Identidad','sesión / MS','Autenticada'),('Rol','operaciones','Responsable'),('Alcance','proyecto / P-104','Coincide')]):
  y=-.84-i*.34;p.rule(g,1.83,6.70,y+.19,'edge',z=.096)
  p.label(g,name,1.83,y,.127,'ink',True,z=.105);p.label(g,key,3.16,y,.118,'muted',z=.105)
  p.icon(g,'check',5.32,y,'green',.12,z=.108);p.label(g,value,5.55,y,.12,'green',z=.105)
 p.rule(g,1.83,6.70,-1.73,'edge',z=.096)
 p.label(g,'Resultado',1.83,-1.96,.115,'muted',z=.105)
 p.label(g,'Puede aprobar esta orden',3.16,-1.96,.134,'ink',True,z=.105)
 p.boundary(g,1.60,-2.10,6.96,-.14)
 g='history';p.rule(g,1.65,6.91,-1.93);p.label(g,'TRAZABILIDAD',1.65,-2.25,.103,'quiet',True)
 p.vline(g,1.85,-2.54,-3.40)
 for i,(title,sub) in enumerate([('Revisión solicitada','MS · hoy, 10:42'),('Alcance actualizado','Equipo de Redes · hoy, 10:31')]):
  yy=-2.65-i*.54;p.disc(g,1.85,yy+.052,.041,'red' if i==0 else 'quiet');p.label(g,title,2.10,yy,.137,'ink',i==0);p.label(g,sub,2.10,yy-.215,.114,'muted')
 g='action';p.rule(g,1.65,6.91,-3.64);p.label(g,'Todo cambio queda registrado.',1.66,-4.06,.118,'muted')
 p.rounded(g,6.00,-4.02,.028,1.82,.44,.005,'red',.035);p.label(g,'Aprobar orden',5.37,-4.065,.148,'paper',True)
 # Fine engineering annotations correspond to actual nested regions.
 for group,bounds in [('selection',(-5.27,1.17,.80,1.68)),('access',(1.60,-1.86,6.96,-.49)),('history',(1.61,-3.49,6.95,-1.95))]:
  p.boundary(group,*bounds)
 # Contract inspection: a real payload, its mapping and an explicit response.
 g='integration';cx=18
 p.surface(g,cx,0,12,7.7,'paper',-.055,.035,.08)
 p.label(g,'INTEGRACIONES  /  CONTRATOS  /  APROBACIÓN',cx-5.5,3.24,.17,'slate',True)
 p.label(g,'Contratos de integración',cx-5.5,2.68,.36,'ink',True)
 p.label(g,'ORDEN 0248  /  PROYECTO P-104',cx-5.5,2.24,.15,'quiet')
 p.rule(g,cx-5.5,cx+5.5,1.96)
 p.tag(g,'POST',cx-5.5,1.50,.84,'mint','green');p.label(g,'/v3/orders/0248/approval',cx-4.42,1.50,.21,'ink',True)
 p.surface(g,cx-3.10,-.58,4.75,3.23,'bluewash',.12,.009,.035)
 p.label(g,'BODY / JSON',cx-5.20,.83,.125,'slate',True,z=.19)
 p.label(g,'{',cx-5.22,.58,.16,'slate',z=.19);p.label(g,'}',cx-5.22,-2.03,.16,'slate',z=.19)
 fields=[('project.code','P-104','proyecto.id','P-104'),('owner.email','redes@umsa.example','responsable.email','redes@umsa.example'),('site.address','Guaymallén','sede.domicilio','Guaymallén')]
 for i,(key,value,target,result) in enumerate(fields):
  y=.42-i*.98
  p.label(g,str(i+2),cx-5.22,y-.02,.11,'quiet',z=.19)
  p.label(g,'"'+key+'":',cx-4.86,y+.08,.15,'slate',True,z=.19)
  p.label(g,'"'+value+'"'+(',' if i<2 else ''),cx-4.66,y-.20,.16,'ink',z=.19)
  gg=f'mapping-{i}'
  p.surface(gg,cx+3.05,y,4.88,.77,'canvas',.14,.008,.035)
  p.label(gg,target,cx+.83,y+.11,.16,'slate',True,z=.19);p.label(gg,result,cx+.83,y-.20,.20,'ink',z=.19)
  p.line(g,[(cx-.7,y,.18),(cx+.60,y,.18)],'line',.006)
  p.icon(gg,'arrow',cx+.35,y-.065,'signal',.15,z=.20)
  for xx,yy in [(cx+.61,y-.395),(cx+5.49,y+.395)]:p.line(gg,[(xx,yy,.17),(xx,yy,.19)],'signal',.005)
  p.disc(g,cx-.68,y,.025,'signal',.20)
 p.rule(g,cx-5.45,cx+5.45,-2.22)
 p.tag(g,'202 / Aceptada',cx-5.45,-2.68,1.92,'mint','green',z=.18)
 p.label(g,'Un identificador acompaña toda la operación.',cx-3.25,-2.65,.17,'muted',z=.20)
 p.label(g,'request / 0248-A   ·   schema / v3   ·   validación / 3 campos',cx-5.45,-3.24,.16,'slate',z=.20)
 # Relational storage: keys, relationships, transaction and append-only history.
 g='storage';cx=18;cy=-10
 p.surface(g,cx,cy,12,7.7,'paper',-.055,.035,.08)
 p.label(g,'PERSISTENCIA  /  NUEVA SEDE  /  ORDEN 0248',cx-5.5,cy+3.24,.17,'slate',True)
 p.label(g,'Modelo de datos',cx-5.5,cy+2.68,.32,'ink',True)
 p.label(g,'La orden conserva su proyecto, responsable y registro de cambios.',cx-5.5,cy+2.20,.17,'muted')
 tables=[(-3.4,1.0,'proyectos',[('PK  id','P-104'),('nombre','Nueva sede'),('sede','Guaymallén')]),(2.6,1.0,'órdenes',[('PK  id','0248'),('FK  proyecto_id','P-104'),('estado','Aprobada')]),(2.6,-1.65,'eventos',[('PK  secuencia','000187'),('FK  orden_id','0248'),('acción','approval.accepted')])]
 for tx,ty,title,rows in tables:
  x=cx+tx;y=cy+ty;gg='table-'+title
  p.surface(gg,x,y,4.7,2.06,'bluewash',.16,.016,.04)
  p.label(gg,title,x-2.1,y+.68,.23,'ink',True,z=.22)
  p.rule(gg,x-2.1,x+2.1,y+.45,'edge',.22)
  for i,(key,value) in enumerate(rows):
   yy=y+.11-i*.36
   p.label(gg,key,x-2.1,yy,.135,'slate',z=.22);p.label(gg,value,x+.23,yy,.15,'ink',i==0,z=.22)
 p.line(g,[(cx-1.05,cy+1.10,.24),(cx-.48,cy+1.10,.24),(cx-.48,cy+.80,.24),(cx+.25,cy+.80,.24)],'signal',.012)
 p.line(g,[(cx+2.6,cy-.03,.24),(cx+2.6,cy-.58,.24)],'signal',.012)
 p.surface(g,cx-3.4,cy-1.65,4.7,2.06,'canvas',.16,.016,.04)
 p.label(g,'Una transacción',cx-5.5,cy-.97,.23,'ink',True,z=.22)
 for i,label in enumerate(['01  Validar la versión de la orden','02  Actualizar el estado','03  Anexar el evento']):p.label(g,label,cx-5.5,cy-1.42-i*.36,.145,'muted',z=.22)
 p.rule(g,cx-5.5,cx+5.5,cy-2.93)
 p.label(g,'COMMIT',cx-5.5,cy-3.32,.16,'green',True,z=.22)
 p.label(g,'La respuesta vuelve después de confirmar el registro.',cx-4.23,cy-3.32,.16,'muted',z=.22)
 # Runtime is an actual topology, with release path distinct from requests.
 g='runtime';cx=0;cy=-10
 p.surface(g,cx,cy,12,7.7,'paper',-.055,.035,.08)
 p.label(g,'OPERACIÓN  /  PRODUCCIÓN  /  NUEVA SEDE',cx-5.5,cy+3.24,.17,'slate',True)
 p.label(g,'Entorno de producción',cx-5.5,cy+2.68,.34,'ink',True)
 p.label(g,'Ejemplo de arquitectura · la capacidad se define con cada proyecto.',cx-5.5,cy+2.20,.16,'muted')
 # Two independently labelled processes receive traffic through one router.
 def service(x,y,w,title,sub):
  gg='process-'+title
  p.surface(gg,x,y,w,1.10,'bluewash',.20,.025,.045)
  p.label(gg,title,x-w/2+.18,y+.16,.20,'ink',True,z=.27)
  p.label(gg,sub,x-w/2+.18,y-.19,.137,'slate',z=.27)
  p.disc(gg,x+w/2-.20,y+.25,.035,'green',.27)
  for i in range(7):p.rounded(gg,x-w/2+.18+i*.14,y-.37,.272,.10,.065,.001,'line',.006)
  p.label(gg,'0248-A',x+w/2-.85,y-.41,.10,'slate',z=.28)
 service(cx-4.14,cy+.65,2.45,'Entrada','HTTPS / sesión')
 service(cx-.62,cy+1.18,2.85,'app-01','v1.8.3 / disponible')
 service(cx-.62,cy-.50,2.85,'app-02','v1.8.3 / disponible')
 service(cx+3.63,cy+.35,2.85,'Persistencia','Transacciones / respaldo')
 for yy in [cy+1.18,cy-.50]:
  p.line(g,[(cx-2.92,cy+.65,.29),(cx-2.5,cy+.65,.29),(cx-2.5,yy,.29),(cx-2.05,yy,.29)],'signal',.01)
  p.line(g,[(cx+.82,yy,.29),(cx+1.48,yy,.29),(cx+1.48,cy+.35,.29),(cx+2.2,cy+.35,.29)],'signal',.01)
 p.rule(g,cx-5.5,cx+5.5,cy-1.48)
 for i,(title,sub) in enumerate([('Pruebas','Contratos / regresión'),('Artefacto','Versión identificada'),('Publicación','Gradual / reversible')]):
  x=cx-5.48+i*3.78;p.label(g,title,x,cy-1.97,.20,'ink',True,z=.22);p.label(g,sub,x,cy-2.31,.145,'slate',z=.22)
  if i<2:p.icon(g,'arrow',x+3.07,cy-2.03,'slate',.24,z=.22)
 p.label(g,'OBSERVACIÓN',cx-5.48,cy-3.14,.14,'slate',True,z=.22)
 p.label(g,'Registros · métricas · alertas · recuperación',cx-3.55,cy-3.14,.17,'ink',z=.22)
 # Consistent product chrome, denser than a presentation slide and outside
 # the lifted inspection regions. These are application views of one project.
 for group,cx,cy,active in [('integration',18,0,2),('storage',18,-10,3),('runtime',0,-10,4)]:
  p.surface(group,cx-.88,cy,14.0,9.02,'nav',-.12,.016,.085)
  p.surface(group,cx-.88,cy+4.18,13.94,.57,'paper',-.09,.008,.055)
  p.label(group,'UM',cx-7.53,cy+4.12,.19,'red',True)
  p.label(group,'Operaciones',cx-6.93,cy+4.12,.16,'ink',True)
  p.label(group,'/ Nueva sede',cx-5.43,cy+4.12,.145,'slate')
  p.surface(group,cx+1.03,cy+4.19,3.88,.31,'canvas',-.04,.002,.025)
  p.label(group,'Buscar en el proyecto',cx-.73,cy+4.13,.11,'quiet')
  p.disc(group,cx+4.59,cy+4.20,.026,'green');p.label(group,'Producción',cx+4.73,cy+4.15,.11,'muted')
  for i,name in enumerate(['Resumen','Órdenes','Contratos','Datos','Operación']):
   yy=cy+3.30-i*.57
   if i==active:p.rounded(group,cx-6.9,yy+.04,-.055,1.49,.42,.002,'paper',.025)
   p.icon(group,'grid' if i!=4 else 'pulse',cx-7.47,yy+.015,'red' if i==active else 'slate',.12,z=.012)
   p.label(group,name,cx-7.18,yy,.13,'ink' if i==active else 'slate',i==active)
  p.rule(group,cx-7.5,cx-6.3,cy-.02)
  p.label(group,'PROYECTO',cx-7.48,cy-.36,.095,'quiet',True)
  p.label(group,'P-104',cx-7.48,cy-.70,.15,'ink',True)
  p.label(group,'Nueva sede',cx-7.48,cy-.96,.12,'slate')
  p.avatar(group,'MS',cx-7.29,cy-3.77);p.label(group,'Equipo UM',cx-7.02,cy-3.76,.12,'ink')
  p.label(group,'CONTEXTO / 0248-A',cx-5.5,cy-4.17,.11,'slate')
  p.label(group,'v3  ·  cambios registrados  ·  acceso verificado',cx-.40,cy-4.17,.12,'muted')
 # Registered routes join the same four sheets. No unrelated ornamental mesh.
 for points in [[(7.9,0,.02),(11.9,0,.12)],[(18,-3.85,.12),(18,-6.15,.12)],[(12,-10,.12),(6,-10,.12)],[(0,-6.15,.12),(0,-4.86,.02)]]:
  p.line('architecture',points,'signal',.012)
 return p

def narrative(t):
 # Inspect an already completed operation, so the loop never undoes approval.
 checks=3 if t<.035 or t>.22 else sum(t>=threshold for threshold in (.11,.15,.19))
 return checks,checks==3,True

def reveal(t):return E((t-.035)/.065)*(1-E((t-.22)/.05))

def pose(group,t):
 q=reveal(t)
 if group.startswith('mapping-'):
  i=int(group[-1]);lift=E((t-(.31+i*.025))/.035)*(1-E((t-.455)/.025))
  return (0,0,.72*lift)
 if group.startswith('table-'):
  i=['proyectos','órdenes','eventos'].index(group[6:]);lift=E((t-(.53+i*.025))/.035)*(1-E((t-.665)/.025))
  return (0,0,(.35+i*.17)*lift)
 if group.startswith('process-'):
  return (0,0,.40*E((t-.74)/.045)*(1-E((t-.85)/.025)))
 return {'selection':(-.16*q,0,.13*q),'inspector':(0,0,.05*q),
  'access':(1.34*q,1.53*q,1.15*q),'policy':(0,0,.22*q-.50*(1-E((q-.08)/.40))),
  'history':(.18*q,-.68*q,.40*q),'action':(.18*q,-.68*q,.40*q)}.get(group,(0,0,0))

def camera_pose(t):
 # Deliberate editorial cuts avoid racing across empty space. Each shot makes
 # one inspection, with a slow local camera move and a legible dwell.
 if t<.24:
  q=E(t/.15);size=17.8+(12.2-17.8)*q;target=(.7+3.8*q,-.6*q,.2+.5*q);angles=(7+7*q,-12-13*q,-1-q)
 elif t<.46:
  q=E((t-.24)/.22);size=16.2-.3*q;target=(17.25,-.10*q,.2+.12*q);angles=(14+3*q,-24-4*q,1-q)
 elif t<.68:
  q=E((t-.46)/.22);size=16.4-.3*q;target=(17.25,-10-.10*q,.2+.12*q);angles=(15+2*q,-25-3*q,-1)
 elif t<.88:
  q=E((t-.68)/.20);size=16.1-.3*q;target=(-.75,-10,.3);angles=(14+3*q,-24-3*q,1-q)
 else:
  q=E((t-.88)/.10);size=12.2+5.6*q;target=(4.5-3.8*q,-.6+.6*q,.7-.5*q);angles=(14-7*q,-25+13*q,-2+q)
 if ASPECT==1:
  size=10.8 if t<.24 or t>=.88 else 14.9
  if t<.24 or t>=.88:target=(4.5,target[1],target[2])
 return size,target,angles

def basis(t):
 size,target,angles=camera_pose(t);ax,ay,roll=map(math.radians,angles)
 n=(math.tan(ax),math.tan(ay),1);m=math.sqrt(sum(v*v for v in n));n=tuple(v/m for v in n)
 r=(n[2],0,-n[0]);m=math.sqrt(sum(v*v for v in r));r=tuple(v/m for v in r)
 u=(n[1]*r[2]-n[2]*r[1],n[2]*r[0]-n[0]*r[2],n[0]*r[1]-n[1]*r[0]);c,s=math.cos(roll),math.sin(roll)
 return size,target,tuple(c*x+s*y for x,y in zip(r,u)),tuple(-s*x+c*y for x,y in zip(r,u)),n

def validate():
 p=build();assert all(m in PALETTE for _,m,_,_ in p.meshes)
 assert {'integration','storage','runtime','policy','access'}<=p.points.keys()
 for g,label,x,y,z,size,material,bold in p.texts:
  for group,mat,verts,faces in p.meshes:
   if group!=g:continue
   xs,ys,zs=zip(*verts)
   if min(xs)<=x<=max(xs) and min(ys)<=y<=max(ys):assert z>max(zs),(label,'covered by',mat,z,max(zs))
 assert all(math.isfinite(v) for points in p.points.values() for point in points for v in point)
 for frame in range(FRAMES):
  size,target,r,u,n=basis(frame/(FRAMES-1));assert size>0 and all(math.isfinite(v) for v in target)
 print(json.dumps({'proof':'v11','frames':FRAMES,'labels':len(p.texts),'surfaces':len(p.meshes),'publishable':False}))

def render(args):
 import bpy
 from mathutils import Matrix,Vector
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
 scene.render.engine={'cycles':'CYCLES','eevee':'BLENDER_EEVEE_NEXT','workbench':'BLENDER_WORKBENCH'}[args.engine]
 if args.engine=='eevee':scene.eevee.taa_render_samples=args.samples
 scene.cycles.samples=args.samples;scene.cycles.use_denoising=True;scene.cycles.max_bounces=4
 scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.use_persistent_data=True
 scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width/ASPECT);scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.fps=FPS
 scene.view_settings.view_transform='Standard';scene.world=bpy.data.worlds.new('Soft product studio');scene.world.use_nodes=True
 scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.5,.5,.5,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
 mats={}
 for name,h in PALETTE.items():
  rgb=[int(h[i:i+2],16)/255 for i in [1,3,5]];rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
  mat=bpy.data.materials.new(name);mat.diffuse_color=(*rgb,1);mat.use_nodes=True;n=mat.node_tree.nodes['Principled BSDF']
  graphic=name in ['ink','muted','quiet','red','green','slate','line','rose','mint','bluewash']
  n.inputs['Base Color'].default_value=(*rgb,1);n.inputs['Roughness'].default_value=.76;n.inputs['Specular IOR Level'].default_value=.12
  if graphic:
   # Screen graphics are ink, not little illuminated sculptures.
   emission=mat.node_tree.nodes.new('ShaderNodeEmission');emission.inputs[0].default_value=(*rgb,1)
   mat.node_tree.links.new(emission.outputs[0],mat.node_tree.nodes['Material Output'].inputs['Surface'])
  elif name!='floor':
   # Keep studio contact shadows subtle without turning white UI gray.
   emission=mat.node_tree.nodes.new('ShaderNodeEmission');emission.inputs[0].default_value=(*rgb,1)
   mix=mat.node_tree.nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=.65
   mat.node_tree.links.new(n.outputs[0],mix.inputs[1]);mat.node_tree.links.new(emission.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],mat.node_tree.nodes['Material Output'].inputs['Surface'])
  if name=='glass':
   # A genuinely transparent inspection membrane; graphics stay opaque.
   mat.surface_render_method='BLENDED';mat.use_transparency_overlap=False
   transparent=mat.node_tree.nodes.new('ShaderNodeBsdfTransparent')
   emission=mat.node_tree.nodes.new('ShaderNodeEmission');emission.inputs[0].default_value=(*rgb,1)
   mix=mat.node_tree.nodes.new('ShaderNodeMixShader');mix.name='Inspection opacity';mix.inputs[0].default_value=.14
   mat.node_tree.links.new(transparent.outputs[0],mix.inputs[1]);mat.node_tree.links.new(emission.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],mat.node_tree.nodes['Material Output'].inputs['Surface'])
  mats[name]=mat
 if args.engine=='workbench':
  scene.display.shading.light='FLAT';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=False;scene.display.render_aa='8';scene.display.shading.shadow_intensity=.12;scene.display.light_direction=(.2,-.25,1)
 font_dir=Path(args.font_dir) if args.font_dir else ROOT/'public/fonts/um-sans';fonts={bold:bpy.data.fonts.load(str(font_dir/f'UMSans-{weight}.ttf')) for bold,weight in [(False,'Regular'),(True,'SemiBold')]}
 product=build();parents={};combined={};native_texts=[];native_marks=[]
 for g in product.points:
  ob=bpy.data.objects.new(g,None);scene.collection.objects.link(ob);parents[g]=ob
 for g,m,verts,faces in product.meshes:
  if g=='access' and m in ('paper','edge') and max(v[2] for v in verts)<.04:m='glass'
  vv,ff=combined.setdefault((g,m),([],[]));offset=len(vv);vv.extend(verts);ff.extend(tuple(offset+i for i in f) for f in faces)
 for g,x,y,z,w,d,h,m in product.boxes:
  vv,ff=combined.setdefault((g,m),([],[]));offset=len(vv);vv.extend([(x+a*w/2,y+b*d/2,z+c*h) for c in [0,1] for b in [-1,1] for a in [-1,1]])
  ff.extend(tuple(offset+i for i in f) for f in [(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)])
 for (g,m),(vv,ff) in combined.items():
  mesh=bpy.data.meshes.new(g+' / '+m);mesh.from_pydata(vv,[],ff);mesh.update();ob=bpy.data.objects.new(mesh.name,mesh);scene.collection.objects.link(ob);ob.parent=parents[g];mesh.materials.append(mats[m]);ob.display.show_shadows=m in ('edge','paper','canvas','nav');native_marks.append((g,m,ob))
  bevel=ob.modifiers.new('Fine edge','BEVEL');bevel.width=.001;bevel.segments=2
 for g,s,x,y,z,size,m,bold in product.texts:
  c=bpy.data.curves.new(s,'FONT');c.body=s;c.size=size;c.font=fonts[bold];c.extrude=0;ob=bpy.data.objects.new(s,c);scene.collection.objects.link(ob);ob.parent=parents[g];ob.location=(x,y,z);ob.visible_shadow=False;ob.display.show_shadows=False;c.materials.append(mats[m]);native_texts.append((g,s,ob))
 def curve(name,pts,material,radius,parent=None):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=2;s=c.splines.new('POLY');s.points.add(len(pts)-1)
  for point,xyz in zip(s.points,pts):point.co=(*xyz,1)
  ob=bpy.data.objects.new(name,c);scene.collection.objects.link(ob);c.materials.append(mats[material]);ob.parent=parent;ob.visible_shadow=False;ob.display.show_shadows=False;return ob,s
 for g,pts,m,r in product.lines:
  ob,_=curve('Authored detail',pts,m,r,parents[g]);native_marks.append((g,m,ob))
 # A communication path behind the transparent inspection surface. The same
 # request advances in order; no particle fireworks or unrelated network mesh.
 bpy.ops.mesh.primitive_plane_add(size=1,location=(4.28,-1.01,-.20))
 carrier=bpy.context.object;carrier.name='Service bus behind inspection';carrier.scale=(5.08,.34,1);carrier.parent=parents['access'];carrier.data.materials.append(mats['bluewash']);carrier.display.show_shadows=False
 transmission=[];service_labels=[]
 for i,(x,label) in enumerate([(2.00,'Identidad'),(3.23,'Permisos'),(4.46,'Datos'),(5.69,'Auditoría')]):
  xx=x+.06
  node,sp=curve(label+' service',[(xx,-1.02,-.15),(xx+.28,-1.02,-.15)],'slate',.013,parents['access'])
  transmission.append((i,node,sp))
  if i<3:
   ob,sp=curve(label+' communication',[(xx+.28,-1.02,-.15),(xx+1.20,-1.02,-.15)],'slate',.0045,parents['access']);transmission.append((i,ob,sp))
  c=bpy.data.curves.new(label+' / underneath','FONT');c.body=label;c.size=.105;c.font=fonts[False];c.materials.append(mats['slate'])
  ob=bpy.data.objects.new(c.name,c);scene.collection.objects.link(ob);ob.parent=parents['access'];ob.location=(xx,-.94,-.15);ob.visible_shadow=False
  service_labels.append(ob)
 signal,signal_spline=curve('Order 0248 in transit',[(2.06,-1.02,-.148),(2.25,-1.02,-.148)],'signal',.019,parents['access'])
 registration=[]
 for g,corners in [('selection',[(-5.27,1.17),(.80,1.17),(.80,1.68),(-5.27,1.68)]),('access',[(1.60,-1.86),(6.96,-1.86),(6.96,-.49),(1.60,-.49)])]:
  for x,y in corners:
   ob,s=curve('Registered control',[(x,y,.022),(x,y,.023)],'red',.002);registration.append((g,ob,s))
 connectors=[]
 for i in range(3):
  y=.42-i*.98;g=f'mapping-{i}'
  ob,sp=curve('Mapped field '+str(i),[(17.30,y,.19),(18.60,y,.19)],'signal',.008)
  connectors.append((g,ob,sp,[(17.30,y,.19),(18.60,y,.19)]))
  for x in [18.62,23.49]:
   ob,sp=curve('Field registration',[(x,y-.39,.16),(x,y-.39,.17)],'slate',.003)
   connectors.append((g,ob,sp,[(x,y-.39,.16),(x,y-.39,.17)]))
 for g,x,y,z in [('table-proyectos',14.6,-9,.24),('table-órdenes',20.6,-9,.24),('table-eventos',20.6,-11.65,.24)]:
  for xx in [x-2.35,x+2.35]:
   ob,sp=curve('Data registration',[(xx,y+1.03,.14),(xx,y+1.03,z)],'slate',.003)
   connectors.append((g,ob,sp,[(xx,y+1.03,.14),(xx,y+1.03,z)]))
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.25));bpy.context.object.data.materials.append(mats['floor'])
 for name,pos,power,size in [('Key',(-5,3,14),1000,11),('Fill',(7,-5,10),350,9)]:
  data=bpy.data.lights.new(name,'AREA');data.use_shadow=name=='Key';data.energy=power;data.size=size;ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
 camdata=bpy.data.cameras.new('One deliberate inspection');camdata.type='ORTHO';camdata.sensor_fit='HORIZONTAL';cam=bpy.data.objects.new('One deliberate inspection',camdata);scene.collection.objects.link(cam);scene.camera=cam
 out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[];errors=[];started=[0]
 def update(scene):
  try:
   t=scene.frame_current/(FRAMES-1);size,target,r,u,n=basis(t);camdata.ortho_scale=size;cam.location=Vector(target)+Vector(n)*50;cam.rotation_euler=Matrix((r,u,n)).transposed().to_euler()
   for g,ob in parents.items():ob.location=pose(g,t)
   for g,ob,sp,points in connectors:
    x,y,z=pose(g,t);sp.points[1].co=(*[a+b for a,b in zip(points[1],(x,y,z))],1)
    ob.hide_render=z<.01
   for g,ob,s in registration:s.points[1].co.x=s.points[0].co.x+pose(g,t)[0];s.points[1].co.y=s.points[0].co.y+pose(g,t)[1];s.points[1].co.z=.024+pose(g,t)[2];ob.hide_render=pose(g,t)[2]<.01
   parents['policy'].hide_render=False
   for ob in parents['policy'].children:ob.hide_render=reveal(t)<.12
   q=reveal(t)
   mats['glass'].node_tree.nodes['Inspection opacity'].inputs[0].default_value=1-.86*q
   travel=max(0,min(1,(t-.30)/.40));x=2.06+3.69*travel
   signal_spline.points[0].co.x=x;signal_spline.points[1].co.x=x+.18
   signal.hide_render=q<.15 or travel>=1
   for i,ob,sp in transmission:ob.hide_render=q<.15
   carrier.hide_render=q<.15
   for ob in service_labels:ob.hide_render=q<.15
   checks,permitted,approved=narrative(t)
   replacements={
    'Puede aprobar esta orden':'Puede aprobar esta orden' if permitted else 'Evaluando las tres condiciones',
    'Permiso efectivo':'Permiso efectivo' if permitted else 'Verificando acceso',
    'Verificado':'Verificado' if permitted else 'Verificando',
    'MS puede aprobar esta orden porque cumple las tres condiciones.':'MS puede aprobar esta orden porque cumple las tres condiciones.' if permitted else 'Comprobamos identidad, rol y alcance del proyecto.',
    'En revisión':'Aprobada' if approved else 'En revisión',
    'Aprobar orden':'Orden aprobada' if approved else 'Aprobar orden',
    'Revisión solicitada':'Aprobación registrada' if approved else 'Revisión solicitada',
    'MS · hoy, 10:42':'MS · hoy, 10:43 · orden 0248' if approved else 'MS · hoy, 10:42',
    'MS solicitó revisión de la orden 0248':'MS aprobó la orden 0248' if approved else 'MS solicitó revisión de la orden 0248'}
   def color(ob,name):
    if ob.data.materials[0]!=mats[name]:ob.data.materials[0]=mats[name]
   # Keep unchanged font geometry intact; replace labels only when their state
   # changes. A reduced preview is not sufficient evidence of glyph loss.
   for group,original,ob in native_texts:
    desired=replacements.get(original,original)
    if ob.data.body!=desired:ob.data.body=desired
    if group=='access' and original in ('01','02','03'):color(ob,'green' if int(original)<=checks else 'quiet')
    if original=='En revisión':color(ob,'green' if approved else 'red')
    if original=='Verificado':color(ob,'green' if permitted else 'muted')
    if group=='policy' and original in ('Autenticada','Responsable','Coincide'):color(ob,'green' if ('Autenticada','Responsable','Coincide').index(original)<checks else 'muted')
   policy_checks=[ob for group,material,ob in native_marks if group=='policy' and material=='green' and ob.type=='CURVE']
   for i,ob in enumerate(policy_checks):color(ob,'green' if i<checks else 'quiet')
   for group,material,ob in native_marks:
    if material=='red' and group in ('selection','history','action'):color(ob,'green' if approved else 'red')
    if group=='inspector' and material=='rose':color(ob,'mint' if approved else 'rose')
    if group=='access' and material=='green':color(ob,'green' if permitted else 'quiet')
  except Exception as e:errors.append(repr(e));raise
 def begin(scene):started[0]=time.time()
 def finish(scene):
  timings.append({'frame':scene.frame_current,'seconds':round(time.time()-started[0],2)})
  (out/'render-info.json').write_text(json.dumps({'scene':'software-system-v11-art-direction-proof','frames':FRAMES,'fps':FPS,'resolution':[args.width,round(args.width/ASPECT)],'composition':'mobile' if ASPECT==1 else 'wide','engine':args.engine,'publishable':False,'authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'compositor_sha256':hashlib.sha256((ROOT/'scripts/cine/composite-software-layers.py').read_bytes()).hexdigest(),'geometry_sha256':hashlib.sha256(Path(geometry.__file__).read_bytes()).hexdigest(),'font_sha256':{str(k):hashlib.sha256(Path(v.filepath).read_bytes()).hexdigest() for k,v in fonts.items()},'timings':timings,'handler_errors':errors}))
 scene.frame_start=args.start;scene.frame_end=args.end;scene.render.filepath=str(out)+'/'
 if args.engine=='workbench':
  # Native Blender passes keep precise translucent surfaces without the
  # excessive transparent framebuffer cost of software EEVEE at 5K.
  # Base / inspection membrane / opaque glyphs are authored in one scene.
  scene.render.image_settings.color_mode='RGBA'
  renderables=[ob for ob in scene.objects if ob.type in ('MESH','CURVE','FONT')]
  glass=[ob for ob in renderables if ob.data.materials and ob.data.materials[0]==mats['glass']]
  def depth(ob):
   if ob.type=='MESH':return min(v.co.z for v in ob.data.vertices)
   if ob.type=='FONT':return ob.location.z
   return min(v.co.z for sp in ob.data.splines for v in sp.points)
  foreground=[ob for ob in renderables if ob.parent==parents['access'] and ob!=carrier and ob not in glass and depth(ob)>=0]
  for frame in range(args.start,args.end+1):
   scene.frame_set(frame);update(scene);start=time.time();visibility={ob:ob.hide_render for ob in renderables}
   for layer in ('base','glass','front'):
    scene.render.film_transparent=layer!='base';scene.display.shading.show_shadows=layer=='base'
    for ob in renderables:
     selected=ob not in glass+foreground if layer=='base' else ob in glass if layer=='glass' else ob in foreground
     ob.hide_render=visibility[ob] or not selected
    scene.render.filepath=str(out/f'layer-{layer}.png');bpy.ops.render.render(write_still=True)
   opacity=1-.86*reveal(frame/(FRAMES-1))
   subprocess.run(['python3',str(ROOT/'scripts/cine/composite-software-layers.py'),str(out),str(frame),str(opacity)],check=True)
   for ob in renderables:ob.hide_render=visibility[ob]
   started[0]=start;finish(scene)
  assert len(timings)==args.end-args.start+1
 else:
  bpy.app.handlers.frame_change_pre.append(update);bpy.app.handlers.render_pre.append(begin);bpy.app.handlers.render_post.append(finish)
  try:bpy.ops.render.render(animation=True);assert not errors;assert len(timings)==args.end-args.start+1
  finally:bpy.app.handlers.frame_change_pre.remove(update);bpy.app.handlers.render_pre.remove(begin);bpy.app.handlers.render_post.remove(finish)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int,default=FRAMES-1);parser.add_argument('--samples',type=int,default=48);parser.add_argument('--width',type=int,default=3840);parser.add_argument('--engine',choices=['cycles','eevee','workbench'],default='cycles');parser.add_argument('--composition',choices=['wide','mobile'],default='wide');parser.add_argument('--font-dir');parser.add_argument('--output',default='frames');parser.add_argument('--validate-only',action='store_true')
 args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<FRAMES
 ASPECT=1 if args.composition=='mobile' else 16/9
 validate()
 if not args.validate_only:render(args)
