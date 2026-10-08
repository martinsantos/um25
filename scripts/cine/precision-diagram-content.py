"""Small authored interfaces for the evidence and decisions in each discipline.
These are actual drawing content, not interchangeable bars used as fake text.
"""
from html import escape

def text(x,y,value,size=6.5,weight=400,fill='#bfc4ca'):
 return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" font-family="UM Sans,Arial,sans-serif">{escape(value)}</text>'
def rect(x,y,w,h,fill='none',stroke='#59616b',sw=.5):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx=".6" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def line(d,stroke='#59616b',sw=.55):return f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{sw}"/>'
def header(title,sub):
 return rect(0,0,240,160,'#111316','#929aa3',.65)+text(13,20,title,11,600)+text(13,33,sub,5.5,fill='#818a96')+line('M12 42H228')
def rows(title,sub,headings,values,widths=(113,71)):
 c=header(title,sub)
 xs=[14,14+widths[0],14+sum(widths)]
 for x,label in zip(xs,headings):c+=text(x,55,label,5.1,600,fill='#9099a3')
 for i,row in enumerate(values):
  y=72+i*18
  if i==0:c+=rect(11,y-10,218,15,'#251719','none')+line(f'M11 {y-9}v13','#dc2626',1)
  for x,value in zip(xs,row):c+=text(x,y,value,5.8)
  c+=line(f'M12 {y+6}H228','#343b44',.4)
 return c

def ticket():
 c=header('INCIDENTE / 0248','Un caso conserva el contexto y la evidencia.')
 c+=text(14,60,'Sede norte · acceso a ERP',8,600)
 for i,(k,v) in enumerate([('Estado','En diagnóstico'),('Impacto','Operación de la sede'),('Responsable','Mesa técnica'),('Evidencia','Equipo / red / aplicación')]):
  y=77+i*17;c+=text(14,y,k,6,fill='#818a96')+text(81,y,v,6.3)+line(f'M14 {y+6}H225','#343b44',.4)
 c+=rect(159,138,68,14,'#291b1e','#814349')+text(169,148,'Seguir el caso',5.8)
 return c

def risk(title='RIESGO E IMPACTO'):
 c=header(title,'La prioridad tiene una razón y un responsable.')
 c+=text(14,58,'Impacto',6,600)+text(131,58,'Dependencias',6,600)
 for i in range(4):
  for j in range(5):c+=rect(14+j*18,68+i*16,15,13,['#161b20','#242b32','#49252c'][min(2,(i+j)//3)],'#5b626b',.35)
 c+=line('M14 138H104M14 65V138','#818a96',.6)+text(32,149,'Exposición',5.5)
 for j,label in enumerate(['Personas','Servicios','Equipos','Continuidad']):
  y=75+j*19;c+=text(132,y,label,6.3)+line(f'M132 {y+7}H222','#343b44',.4)
  c+=rect(207,y-6,12,7,'#44232a' if j==3 else '#20272e','#818a96',.35)
 return c

def alternatives():
 c=header('ALTERNATIVAS CON CRITERIO','Capacidad, continuidad y operación se comparan juntas.')
 for j,(title,sub) in enumerate([('Conservar','Mejora puntual'),('Evolucionar','Migración gradual'),('Renovar','Cambio de base')]):
  x=13+j*74;c+=rect(x,54,67,87,'#15191e','#646c76',.55)+text(x+6,67,title,6.5,600)+text(x+6,80,sub,4.5,fill='#9099a3')
  for i,t in enumerate(['Capacidad','Riesgo','Operación']):
   y=96+i*15;c+=text(x+6,y,t,5.3)+line(f'M{x+47} {y-2}h{8+(i+j)%3*3}', '#b94951' if i==1 else '#a2a8af',1)
 c+=text(14,153,'La elección depende del alcance relevado.',6)
 return c

def plan():
 c=header('ETAPAS Y DEPENDENCIAS','Cada entrega habilita la siguiente intervención.')
 for j,t in enumerate(['01','02','03','04']):c+=text(114+j*27,56,t,5.5)
 for i,(name,start,length) in enumerate([('Relevar',0,1),('Diseñar',.6,1.3),('Implementar',1.7,1.5),('Verificar',3,1)]):
  y=74+i*20;c+=text(14,y,name,6.6)+line(f'M103 {y+5}H226','#343b44',.4)
  c+=rect(107+start*27,y-8,length*27,10,'#332129' if i==2 else '#20262d','#949ca5',.4)
  if i<3:c+=line(f'M{107+(start+length)*27} {y+2}v10h9','#a94a54',.55)
 c+=text(14,153,'Alcance · responsables · aceptación',6)
 return c

def transfer():
 c=header('ENSAYO DE TRANSFERENCIA','La entrada, el respaldo y las cargas se leen juntos.')
 for i,label in enumerate(['Entrada','Respaldo','Cargas IT']):
  y=68+i*30;c+=text(13,y,label,7,600)+line(f'M77 {y+5}H225','#343b44',.45)
 c+=line('M77 61h47v13h62V61h39','#939ca6',.8)
 c+=line('M77 104h47V91h62v13h39','#dc2626',.9)
 c+=line('M77 121h148','#c4c7cc',.8)
 for x in [124,186]:c+=line(f'M{x} 51v85','#59616b',.4)
 c+=text(109,150,'Falla')+text(169,150,'Retorno')
 return c

CONTENT={
 ('102',5):rows('EVENTOS Y RESPUESTA','Ubicación, registro y responsables del mismo evento.',('ORIGEN','EVENTO','ESTADO'),[('Acceso / A01','Credencial','Permitida'),('Cámara / C04','Registro','Disponible'),('Control / P02','Horario','Aplicado'),('Supervisión','Consulta','Revisada')]),
 ('103',0):rows('DOS SITIOS. UNA OPERACIÓN.','La demanda define el enlace, no sólo la distancia.',('EXTREMO','NECESIDAD','ROL'),[('Sede central','Aplicaciones','Origen'),('Sitio remoto','Personas','Destino'),('Tráfico','Datos y voz','Compartido'),('Crecimiento','Capacidad','Previsto')],(98,78)),
 ('103',4):rows('SERVICIOS SOBRE EL ENLACE','Cada aplicación requiere un comportamiento distinto.',('SERVICIO','CRITERIO','CONTROL'),[('Aplicaciones','Disponibilidad','Acceso'),('Voz','Continuidad','Prioridad'),('Video','Capacidad','Reserva'),('Gestión','Visibilidad','Registro')],(95,81)),
 ('103',5):rows('PUESTA EN MARCHA','La red se entrega identificada y verificable.',('VERIFICACIÓN','EVIDENCIA','ESTADO'),[('Extremos','Identificación','Revisar'),('Óptica / radio','Medición','Registrar'),('Red y servicios','Prueba','Verificar'),('Operación','Documentación','Entregar')],(95,81)),
 ('105',1):ticket(),('105',2):risk('PRIORIDAD DEL INCIDENTE'),
 ('105',5):rows('RECUPERACIÓN Y SEGUIMIENTO','El registro conserva qué cambió y cómo se comprobó.',('PASO','RESPONSABLE','REGISTRO'),[('Diagnóstico','Mesa técnica','Evidencia'),('Intervención','Especialista','Cambio'),('Comprobación','Usuario','Resultado'),('Prevención','Operaciones','Seguimiento')],(90,80)),
 ('106',2):risk(),('106',3):alternatives(),('106',4):plan(),
 ('106',5):rows('ALCANCE DEL PROYECTO','Decisiones que se pueden ejecutar y verificar.',('ENTREGA','CONTENIDO','CRITERIO'),[('Arquitectura','Dependencias','Coherencia'),('Plan','Etapas','Secuencia'),('Alcance','Inclusiones','Acuerdo'),('Aceptación','Pruebas','Evidencia')],(91,80)),
 ('108',5):transfer(),
}
