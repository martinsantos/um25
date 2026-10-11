"""Spatial software study: registered translucent planes, crossed perspective.
Native Blender proof on remote workers only. No automatic publication.
"""
import argparse, hashlib, importlib.util, json, math, re, sys, time, xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('ui',Path(__file__).with_name('render-software-system-v11.py'))
ui=importlib.util.module_from_spec(spec);spec.loader.exec_module(ui)
E=ui.E
FPS=60;FRAMES=1200
COLORS={
 'floor':'#11171D','ink':'#F0F6F7','muted':'#D1DCDC','quiet':'#ACBFC2',
 'line':'#44585C','edge':'#729EAA','slate':'#9EBDD0','red':'#FF796A',
 'green':'#6FE4CB','signal':'#63DCCB','rose':'#512F39','mint':'#214A4C',
 'paper':'#77828C','canvas':'#424C58','nav':'#38434E','bluewash':'#526071',
 'glass':'#657D80','trace':'#60DDC8','registration':'#648D9E','white':'#F4F8F9',
 'amber':'#F5CA83','violet':'#B2AFF6','fieldpaper':'#303A40','fieldnav':'#1D252B','shadow':'#05080A','bevel':'#56626A','brand':'#DC2626','mapland':'#293F45','mapblock':'#42565D','mappark':'#2C665C','maproad':'#A2B7BD','annotation':'#089F92','typewash':'#67445E','typeline':'#E9A3D2','mapwater':'#426779'}
# The background is absent from most of the layout: small translucent regions
# give the communication paths room to be seen, rather than tinting a white slab.
ALPHA={'paper':.12,'canvas':.10,'nav':.14,'bluewash':.18,'glass':.055,'shadow':.24,'edge':.0}
REGIONS={
 'list':(-5.43,-4.44,.91,3.88,'signal'),
 'inspector':(1.26,-4.37,7.30,4.03,'signal'),
 'access':(1.60,-2.88,6.96,.64,'amber'),
 'history':(1.61,-3.49,6.95,-1.95,'violet'),
 'action':(1.61,-4.30,6.95,-3.62,'red')}

def family(group):
 return group.split('-')[0] if group.startswith(('access-','contract-','data-')) else group

def annotation_progress(group,t):
 start={'access':.174,'contract':.412,'data':.670}.get(family(group),.025)
 return E((t-start)/.040)

def exposure(t):return .30+.70*E((t-.025)/.15)*(1-E((t-.84)/.16))
def return_lift(t):return 6*E((t-.78)/.03)*(1-E((t-.855)/.045))
def placement(group,t):
 q=exposure(t);group=family(group)
 result={'list':(-.22*q,.18*q,.64*q), 'selection':(-.22*q,.18*q,.68*q),
 'inspector':(.50*q,.08*q,1.56*q), 'access':(.20*q,-.55*q,3.26*q),
 'summary':(.50*q,.08*q,1.56*q),
 'history':(.55*q,-.27*q,2.20*q),'action':(.55*q,-.27*q,2.20*q),
 'contract':(.65*q,0,-1.10), 'data':(.70*q,0,-1.70+return_lift(t))}.get(group,(0,0,0))
 # The outgoing list clears the identity silhouette laterally rather than
 # printing its right border through the incoming identity plane.
 if group in ('list','selection'):
  shift=1.55*E((t-.115)/.045)*(1-E((t-.72)/.06))
  return (result[0]-shift,result[1],result[2])
 return result

def focus(group,t):
 group=family(group)
 if group=='base' and .855<=t<.95:return E((t-.935)/.015)
 if 120<=t*1199<300 and group in ('base','inspector','summary','history','action'):return 1-E((t-.10)/.03)
 if 972<=t*1199<1140 and group not in ('access','contract','data'):
  return E((t-.82)/.045) if group in ('list','selection') else E((t-.855)/.045)
 if group=='access':return E((t-.115)/.075)*(1-E((t-.355)/.075))
 if group=='contract':return E((t-.355)/.075)*(1-E((t-.605)/.075))
 if group=='data':return E((t-.605)/.075)*(1-E((t-.805)/.050))
 return (1-E((t-.115)/.075))+E((t-.85)/.05)

def prominence(group,t):
 f=focus(group,t)
 # Glass returns before typography: the returning product must never print
 # its labels through the still-readable transaction plane.
 if family(group) not in ('access','contract','data'):f=(1-E((t-.105)/.045))+E((t-.855)/.045)
 if family(group)=='access':f=E((t-.125)/.065)*(1-E((t-.355)/.075))
 if 120<=t*1199<300 and family(group) not in ('access','contract','data'):
  start,duration=(.10,.03) if family(group) in ('base','inspector','summary','history','action') else (.12,.085)
  f=1-E((t-start)/duration)
 if 972<=t*1199<1140 and family(group) in ('list','selection'):f=E((t-.82)/.045)
 if family(group)=='base' and .855<=t<.95:f=E((t-.935)/.015)
 if group=='data-pending':f*=1-E((t-.718)/.010)
 if group.endswith('-annotation'):f*=annotation_progress(group,t)
 if group.startswith('access-check-'):f*=E((t-(.17+.028*int(group[-1])))/.026)
 if group.startswith('contract-check-'):f*=E((t-(.455+.038*int(group[-1])))/.027)
 if group=='data-commit':f*=E((t-.725)/.03)
 if group.startswith('data-event-'):f*=E((t-(.70+.04*int(group[-1])))/.025)
 return .0003+.9997*f

# A shape-preserving cubic trajectory maintains velocity across shot beats.
# Separate smoothstep interpolation made every previous beat brake to a stop.
CAMERA_KEYS=[(0,27,(.5,0,1),(18,-25,-5)),
 (.11,19.0,(3.75,-1.05,2.3),(20,-23,-4)),
 (.22,10.9,(4.45,-1.72,3.0),(15,-20,-3)),
 (.345,10.7,(4.50,-1.72,3.0),(11,-18,-2)),
 (.392,15.7,(1.55,-1.4,1.2),(2,-22,1)),
 (.44,10.8,(-.9,-1.12,-.6),(-10,-22,3)),
 (.585,10.6,(-.9,-1.12,-.6),(-13,-20,4)),
 (.637,17.8,(1.75,-1.1,-.7),(-15,-22,4)),
 (.69,11.6,(4.35,-1.10,-1.1),(-17,-20,4)),
 (.815,11.4,(4.35,-1.10,-1.1),(-18,-18,3)),
 (.94,27,(.5,0,1),(18,-25,-5)),
 (1,27,(.5,0,1),(18,-25,-5))]
def cubic_track(t,values):
 ts=[k[0] for k in CAMERA_KEYS]
 slopes=[(values[i+1]-values[i])/(ts[i+1]-ts[i]) for i in range(len(ts)-1)]
 def tangent(i):
  if i in (0,len(ts)-1):return 0
  a,b=slopes[i-1],slopes[i]
  if a*b<=0:return 0
  h0,h1=ts[i]-ts[i-1],ts[i+1]-ts[i]
  w1,w2=2*h1+h0,h1+2*h0
  return (w1+w2)/(w1/a+w2/b)
 i=next((i for i in range(len(ts)-1) if ts[i]<=t<=ts[i+1]),len(ts)-2)
 h=ts[i+1]-ts[i];u=(t-ts[i])/h
 return (2*u**3-3*u*u+1)*values[i]+(u**3-2*u*u+u)*h*tangent(i)+(-2*u**3+3*u*u)*values[i+1]+(u**3-u*u)*h*tangent(i+1)
def camera(t):
 d=cubic_track(t,[k[1] for k in CAMERA_KEYS])
 target=tuple(cubic_track(t,[k[2][axis] for k in CAMERA_KEYS])+(return_lift(t) if axis==2 else 0) for axis in range(3))
 angles=tuple(cubic_track(t,[k[3][axis] for k in CAMERA_KEYS]) for axis in range(3))
 return d,target,angles

def rect(p,g,bounds,z,m='signal',r=.0045):
 x1,y1,x2,y2=bounds
 p.line(g,[(x1,y1,z),(x2,y1,z),(x2,y2,z),(x1,y2,z),(x1,y1,z)],m,r)
 for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:
  p.rounded(g,x,y,z,.043,.043,.001,m,.004)
  p.rounded(g,x,y,z+.001,.018,.018,.001,'white',.002)

def build_base():
 source=ui.build();p=ui.UI()
 for attr in ['meshes','boxes','texts','lines']:
  setattr(source,attr,[('summary',*item[1:]) if item[0]=='access' else item for item in getattr(source,attr)])
 keep={'base','list','selection','inspector','summary','history','action'}
 for g,m,verts,faces in source.meshes:
  if g not in keep or m=='edge':continue
  xs,ys,zs=zip(*verts);w=max(xs)-min(xs);h=max(ys)-min(ys)
  # Remove the enclosing board completely; the UI is suspended on its own
  # component planes. Borders and attachment lines describe the parent volume.
  if g=='base' and w>15 and h>9:continue
  p.meshes.append((g,m,verts,faces));p.points.setdefault(g,[]).extend(verts)
 for item in source.boxes:
  if item[0] in keep:p.box(*item)
 for g,s,x,y,z,size,m,bold in source.texts:
  if g not in keep:continue
  if g=='base' and (s in ['UM','Operaciones','/  Mendoza']):continue
  if g=='inspector' and -.32<y<2.30:continue
  s={'En revisión':'Aprobada','Aprobar orden':'Orden aprobada','Revisión solicitada':'Aprobación registrada','MS solicitó revisión de la orden 0248':'MS aprobó la orden 0248'}.get(s,s)
  p.text(g,s,x,y,z,size,'floor' if m=='paper' else m,bold)
 for g,points,m,r in source.lines:
  if g in keep:
   if g=='inspector' and all(-.32<q[1]<2.30 for q in points):continue
   # Replace thick highlighted rectangles with consistently fine geometry.
   p.line(g,points,'signal' if m=='red' else m,min(r,.004))
 p.rounded('list',-2.26,-.27,-.018,6.34,8.31,.002,'canvas',.035)
 for g,(*bounds,m) in REGIONS.items():
  if g!='access':rect(p,g,bounds,.061,m)
 rect(p,'summary',(1.60,-1.86,6.96,-.49),.061,'amber')
 rect(p,'base',(-8.03,-4.86,8.03,4.89),-.012,'registration',.003)
 # The glass envelope is almost empty. Its rear edge is visible *through*
 # the lifted inspector, registering the software's layers in real depth.
 p.label('base','ÚLTIMA MILLA / INGENIERÍA DE SOFTWARE',-7.95,5.25,.13,'quiet',True)
 p.label('base','Tu operación, conectada.',-7.95,5.70,.48,'ink',True)
 p.label('base','OPERACIONES',-4.44,4.40,.13,'quiet',True)
 p.label('base','VISTA DEMOSTRATIVA',4.95,5.29,.115,'quiet')
 # A product includes recognizable visual information, not only table rows.
 p.label('inspector','VISTA DEL PROYECTO',1.66,2.03,.110,'quiet',True)
 p.label('inspector','CONTEXTO TERRITORIAL',4.53,2.03,.110,'quiet',True)
 site_map(p,'inspector',4.51,.13,2.37,1.67,.073)
 p.label('inspector','Nueva sede · modelo de proyecto',1.66,-.11,.111,'muted')
 p.label('inspector','P-104 / Ubicación de ejemplo',4.53,-.11,.105,'quiet')
 # The permission is an exploded mechanism, not a flat status panel.
 # Each condition has its own glass carrier and depth. Its connector joins
 # the next condition behind the readable surface.
 p.label('access','IDENTIDAD / ROL / ALCANCE',1.56,.49,.118,'quiet',True,z=.49)
 p.label('access','Una acción autorizada.',1.56,.13,.250,'ink',True,z=.49)
 # Identity, permission matrix and scope are different mechanisms. Their
 # forms and depth follow their function rather than repeating three cards.
 g='access-node-0';z=.48
 p.rounded(g,2.39,-1.49,z-.018,1.66,2.57,.010,'glass',.035)
 rect(p,g,(1.56,-2.78,3.22,-.205),z,'registration',.0023)
 p.disc(g,1.92,-.62,.19,'fieldpaper',z=z+.02)
 p.label(g,'MS',1.80,-.68,.17,'ink',True,z=z+.03)
 p.label(g,'IDENTIDAD',2.22,-.48,.092,'quiet',True,z=z+.03)
 p.label(g,'Sesión activa',2.22,-.68,.105,'green',z=z+.03)
 p.rule(g,1.75,3.02,-.98,'line',z=z+.02)
 p.label(g,'ESPACIO CORPORATIVO',1.75,-1.08,.082,'quiet',True,z=z+.03)
 for yy,label,value in [(-1.70,'Directorio','Equipo de operaciones'),(-2.08,'Verificación','Sesión + MFA'),(-2.43,'Contexto','Proyecto P-104')]:
  p.label(g,label,1.75,yy,.09,'quiet',z=z+.03)
  p.label(g,value,1.75,yy-.18,.119,'muted',z=z+.03)
 p.icon('access-check-0','check',2.90,-.82,'green',.16,z=z+.03)
 g='access-node-1';z=.13
 p.rounded(g,5.14,-.82,z-.018,3.30,1.23,.010,'glass',.035)
 rect(p,g,(3.49,-1.435,6.79,-.205),z,'registration',.0023)
 p.label(g,'RESPONSABLE DEL PROYECTO',3.68,-.44,.104,'ink',True,z=z+.03)
 p.label(g,'Acción',3.68,-.69,.092,'quiet',z=z+.03)
 p.label(g,'Permiso efectivo',5.35,-.69,.092,'quiet',z=z+.03)
 p.rule(g,3.67,6.60,-.80,'line',z=z+.02)
 for i,(label,result,m) in enumerate([('Consultar orden','Permitido','muted'),('Aprobar orden','Autorizado','green')]):
  yy=-1.005-i*.26
  p.icon(g,'check',3.71,yy-.005,m,.09,z=z+.03)
  p.label(g,label,3.90,yy,.112,'ink',i==1,z=z+.03)
  p.label('access-check-1' if i==1 else g,result,5.37,yy,.112,m,i==1,z=z+.03)
 g='access-node-2';z=-.23
 p.rounded(g,5.14,-2.18,z-.018,3.30,1.20,.010,'glass',.035)
 rect(p,g,(3.49,-2.78,6.79,-1.58),z,'registration',.0023)
 site_map(p,g,3.54,-2.72,1.42,1.06,z+.035)
 p.label(g,'PROYECTO / P-104',5.12,-1.86,.090,'quiet',True,z=z+.03)
 p.label(g,'Nueva sede',5.12,-2.12,.157,'ink',True,z=z+.03)
 p.label(g,'Ubicación de ejemplo',5.12,-2.33,.077,'quiet',z=z+.03)
 p.tag('access-check-2','Alcance verificado',5.12,-2.56,1.45,'mint','green',z=z+.03)
 # A reserved inter-column channel links identity to role, then the role
 # descends into scope. Every endpoint belongs to the visible mechanism.
 p.line('access',[(3.22,-1.16,.48),(3.35,-1.16,.48),(3.35,-.90,.13),(3.49,-.90,.13)],'signal',.003)
 p.line('access',[(6.79,-1.12,.13),(7.04,-1.12,.13),(7.04,-2.20,-.23),(6.79,-2.20,-.23)],'signal',.003)
 p.line('access',[(6.79,-2.57,-.23),(7.04,-2.57,-.23),(7.04,-3.04,-.23),(6.74,-3.04,-.23)],'registration',.002)
 for g,x,y,z in [('access-node-0',3.22,-1.16,.48),('access-node-1',3.49,-.90,.13),('access-node-1',6.79,-1.12,.13),('access-node-2',6.79,-2.20,-.23)]:p.disc(g,x,y,.02,'signal',z=z+.01)
 p.tag('access-check-2','Puede aprobar',5.24,-3.05,1.50,'mint','green',z=-.23)
 p.label('access','0248-A / autorización verificada',1.56,-3.06,.11,'muted',z=-.23)
 # A contract and a persistence trace live behind the UI, not beside it as
 # unrelated diagrams. They carry the same request / user / order values.
 g='contract'
 p.rounded(g,-1.65,-1.12,0,5.78,3.80,.006,'glass',.055)
 rect(p,g,(-4.54,-3.02,1.24,.78),.017,'signal',.007)
 p.label(g,'CONTRATO DE INTEGRACIÓN',-4.27,.43,.125,'quiet',True)
 p.tag(g,'v3',.40,.44,.50,'mint','green')
 p.tag(g,'POST',-4.27,-.01,.73,'mint','green')
 p.label(g,'/orders/0248/approval',-3.36,-.005,.178,'ink',True)
 p.rule(g,-4.27,.97,-.22)
 # A field mapping is visible, not a generic key/value card. Fine lines link
 # source to destination exclusively through the central gutter.
 p.label(g,'SOLICITUD',-4.24,-.51,.100,'quiet',True)
 p.label(g,'MODELO DE DOMINIO',-1.69,-.51,.100,'quiet',True)
 for i,(key,value,dest) in enumerate([('project.code','P-104','proyecto.id'),('actor.role','Responsable','permiso.rol'),('order.id','0248','orden.id')]):
  y=-.86-i*.48
  p.rounded(g,-3.24,y-.04,.024,2.02,.40,.003,'fieldpaper',.035)
  p.label(g,key,-4.13,y+.01,.110,'muted');p.label(g,value,-4.13,y-.16,.130,'ink',True)
  p.label(g,'string' if i!=1 else 'enum',-2.72,y+.01,.075,'quiet')
  p.rounded(g,-.37,y-.04,.024,2.30,.40,.003,'fieldnav',.035)
  p.icon(f'contract-check-{i}','check',-1.43,y-.10,'green',.11);p.label(g,dest,-1.20,y-.09,.133,'ink')
  p.label(g,'FK' if i!=1 else 'ACL',.43,y-.075,.084,'quiet',True)
  p.line(g,[(-2.21,y-.06,.040),(-1.63,y-.06,.040)],'signal',.003)
  p.disc(g,-2.20,y-.06,.018,'signal');p.disc(g,-1.63,y-.06,.018,'signal')
 p.rule(g,-4.27,.97,-2.20)
 p.tag('contract-check-2','202 Aceptada',-4.27,-2.61,1.43,'mint','green')
 p.label(g,'0248-A',-2.56,-2.61,.135,'ink',True)
 p.label(g,'request-id',-2.56,-2.83,.072,'quiet')
 p.label('contract-check-2','3 campos validados',-1.22,-2.61,.119,'muted')
 g='data'
 p.rounded(g,3.64,-1.10,0,4.75,3.80,.006,'glass',.055)
 rect(p,g,(1.265,-3.00,6.015,.80),.017,'signal',.007)
 p.label(g,'REGISTRO / TRANSACCIÓN',1.50,.43,.116,'quiet',True)
 p.tag('data-commit','COMMIT',4.75,.43,1.02,'mint','green')
 p.label(g,'Orden 0248',1.50,-.01,.235,'ink',True)
 p.label(g,'Proyecto P-104 · Nueva sede',1.50,-.30,.130,'muted')
 p.rounded(g,3.64,-.87,.024,4.26,.66,.003,'paper',.045)
 p.label(g,'ESTADO ANTERIOR',1.67,-.74,.093,'quiet',True)
 p.label(g,'En revisión',1.67,-1.01,.144,'muted')
 p.icon('data-commit','arrow',3.43,-1.0,'signal',.25)
 p.label('data-commit','CONFIRMADO',4.09,-.74,.093,'green',True)
 p.label('data-commit','Aprobada',4.09,-1.01,.163,'ink',True)
 p.label(g,'HISTORIAL INMUTABLE',1.50,-1.50,.099,'quiet',True)
 p.label(g,'EVENTO / ORDEN / VERSIÓN',4.32,-1.50,.071,'quiet',True)
 p.vline(g,1.62,-1.74,-2.43,'registration')
 for i,(title,sub) in enumerate([('Permiso verificado','MS · Responsable · P-104'),('approval.accepted','Orden 0248 · versión 3')]):
  y=-1.86-i*.52;gg=f'data-event-{i}'
  p.disc(gg,1.62,y+.07,.027,'green' if i else 'signal')
  p.label(gg,title,1.83,y,.135,'ink',True)
  p.label(gg,sub,1.83,y-.19,.110,'muted')
  p.label(gg,'10:42:16' if i==0 else '10:42:17',5.00,y,.090,'quiet')
  p.rule(gg,1.83,5.70,y-.29,'line')
 p.label(g,'MISMA SOLICITUD',1.50,-2.76,.092,'quiet',True)
 p.label(g,'0248-A',4.85,-2.76,.130,'green',True)
 for g,b in [('contract',(-4.54,-3.02,1.24,.78)),('data',(1.265,-3.00,6.015,.80))]:
  x1,y1,x2,y2=b
  rect(p,g+'-depth',b,-.36,'registration',.0025)
  for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:
   p.line(g+'-depth',[(x,y,-.36),(x,y,.018)],'registration',.002)
 # Lift the request fields above the domain fields. The bridge travels
 # through the reserved gutter in three dimensions, never across labels.
 def field_z(g,x,y):
  if family(g)=='contract' and -2.16<y<-.60:
   return .53 if x< -2.10 else -.24 if x> -1.70 else 0
  return 0
 lifted=[]
 for g,m,vv,ff in p.meshes:
  xs,ys,_=zip(*vv);cx=(min(xs)+max(xs))/2;cy=(min(ys)+max(ys))/2
  dz=field_z(g,cx,cy) if max(xs)-min(xs)<3 else 0
  lifted.append((g,m,[(x,y,z+dz) for x,y,z in vv],ff))
 p.meshes=lifted
 p.texts=[(g,txt,x,y,z+field_z(g,x,y),size,m,bold) for g,txt,x,y,z,size,m,bold in p.texts]
 p.lines=[(g,[(x,y,z+field_z(g,x,y)) for x,y,z in pts],m,r) for g,pts,m,r in p.lines]
 for i in range(3):
  y=-.86-i*.48
  for x,z in [(-4.25,.53)]:
   p.line('contract',[(x,y-.26,z),(x,y-.26,z-.15),(x+.12,y-.26,z-.15)],'registration',.002)
 # The durable record has an indexed rear stack. Only the active face carries
 # readable copy; the rear pages reveal exact edges and registration holes.
 for layer in range(1,4):
  z=-.23*layer;dx=.13*layer;dy=.08*layer
  bounds=(1.265+dx,-3.00+dy,6.015+dx,.80+dy)
  x1,y1,x2,y2=bounds
  # Open binding keeps rear edges out of the active face's text column.
  p.line('data-depth',[(x1,y2,z),(x2,y2,z),(x2,y1,z),(x1,y1,z)],'registration',.002)
 # Sparse registration ticks, tied to actual boundaries. No decorative grid.
 for x in [-5.43,.91,1.26,7.30]:
  p.line('base',[(x,-5.02,-.012),(x,-5.24,-.012)],'registration',.002)
 # Typography inspection connects its label to the actual title baseline.
 p.line('access',[(1.56,.09,.54),(4.27,.09,.54)],'typeline',.0037)
 p.line('access',[(4.27,.09,.54),(4.74,.16,.54),(5.01,.16,.54)],'typeline',.0037)
 p.rounded('access-annotation',5.88,.195,.54,1.75,.26,.004,'typewash',.035)
 p.label('access','UM Sans · 25 / 600',5.11,.15,.125,'white',z=.55)
 # Measurement overlays share the exact geometry of the inspected surface.
 for g,bounds,z,caption in [
  ('access',(1.56,-2.78,3.22,-.205),.54,'<identity>'),
  ('access',(3.49,-1.435,6.79,-.205),.19,'<permissions>'),
  ('contract',(-4.54,-3.02,1.24,.78),.075,'<request>'),
  ('data',(1.265,-3.00,6.015,.80),.075,'<transaction>')]:
  x1,y1,x2,y2=bounds
  # Dimension line stops short of the label, leaving typography its own space.
  yy=y2+.115
  for xx in [x1,x2]:p.line(g,[(xx,yy-.055,z),(xx,yy+.055,z)],'signal',.0045)
  p.line(g,[(x1,yy,z),(x2,yy,z)],'signal',.0037)
  # Solid label carriers are deliberately stronger than the technical rails.
  width=min(x2-x1,len(caption)*.085+.22)
  p.rounded(g+'-annotation',x1+width/2,y1-.16,z,width,.29,.005,'annotation',.043)
  p.label(g,caption,x1+.075,y1-.20,.148,'white',True,z=z+.015)
 return p

def build():
 p=build_base()
 p.texts=[item for item in p.texts if not(family(item[0])=='contract' and item[1] in ('202 Aceptada','request-id','0248-A','3 campos validados'))]
 p.texts=[(g,'202' if g=='contract' and txt=='v3' else txt,x,y,z,size,m,bold) for g,txt,x,y,z,size,m,bold in p.texts]
 p.meshes=[item for item in p.meshes if not(item[0]=='contract-check-2' and max(v[1] for v in item[2])< -2.2)]
 # The integration has a concrete destination, recognizable by its distinct
 # connector glyph. A status strip and trace make it read as product UI.
 g='contract'
 for x,word,ink in [(-4.20,'ERP','amber'),(-2.53,'API','signal'),(-.85,'CRM','violet')]:
  p.rounded(g,x+.20,-2.50,.04,.40,.40,.02,'fieldpaper',.055)
  p.label(g,word,x+.046,-2.54,.11,ink,True,z=.075)
  p.label(g,{'ERP':'Gestión','API':'Contrato v3','CRM':'Equipo'}[word],x+.48,-2.49,.115,'muted',z=.065)
 p.line(g,[(-3.72,-2.74,.04),(-3.72,-2.82,.04),(-.42,-2.82,.04),(-.42,-2.74,.04)],'registration',.003)
 p.label(g,'INTEGRACIÓN DEL PROYECTO',-4.24,-2.96,.092,'quiet',True)
 # Policy context is visible behind the permission matrix, registered in depth.
 g='access-node-1'
 for x,letter,col in [(5.53,'O','amber'),(5.75,'T','violet'),(5.97,'R','signal')]:
  p.disc(g,x,-.43,.10,'fieldpaper',z=.22)
  p.label(g,letter,x-.036,-.464,.095,col,True,z=.23)
 # A transaction is a compact audit ledger with event identity and integrity.
 for attr in ['meshes','texts','lines','boxes']:
  setattr(p,attr,[item for item in getattr(p,attr) if not item[0].startswith('data-event-')])
 p.texts=[item for item in p.texts if not(item[0]=='data' and item[1] in ['MISMA SOLICITUD','0248-A'])]
 for i,(title,sub,time) in enumerate([('Permiso verificado','MS · Responsable · P-104','10:42:16'),('Contrato validado','v3 · 3 campos relacionados','10:42:17'),('approval.accepted','Orden 0248 · versión 3','10:42:18')]):
  y=-1.81-i*.37;gg=f'data-event-{i}'
  p.disc(gg,1.62,y+.06,.031,'signal' if i<2 else 'amber')
  p.label(gg,title,1.83,y,.132,'ink',True)
  p.label(gg,sub,1.83,y-.16,.097,'muted')
  p.label(gg,time,5.00,y,.088,'quiet')
  p.rule(gg,1.83,5.70,y-.23,'line')
 p.tag('data','SHA',4.76,-.02,.49,'fieldpaper','violet')
 p.label('data','7c4f…a218',5.28,-.024,.095,'quiet')
 # An operational legend supplies visual texture without random measurements.
 p.icon('data-event-2','check',1.50,-2.92,'green',.10)
 p.label('data-event-2','Integridad del registro',1.66,-2.92,.104,'green')
 p.label('data','0248-A',5.00,-2.92,.107,'quiet',True)

 # Status is a real mechanism: a pending state resolves into the confirmed one.
 p.label('data-pending','VALIDANDO',4.09,-.74,.093,'amber',True)
 p.label('data-pending','3 condiciones',4.09,-1.01,.143,'muted')
 p.rounded('data-event-2',3.62,-2.878,.036,4.35,.23,.003,'fieldnav',.025)
 # Individual field wells have registered corners and type chips. Their
 # boundaries communicate the same mapping as the travelling request.
 for i in range(3):
  y=-.86-i*.48
  for x1,x2,z in [(-4.25,-2.23,.565),(-1.52,.78,-.205)]:
   for x,direction in [(x1,1),(x2,-1)]:
    p.line('contract',[(x,y+.10,z),(x,y+.16,z),(x+direction*.09,y+.16,z)],'registration',.002)
  p.rounded('contract',-2.56,y+.034,.567,.38,.145,.002,'mint',.028)
 # Hand-built connector symbols are functional (records, exchange, people),
 # rather than the same monogram inside three squares.
 for x,kind,m in [(-4.20,'records','amber'),(-2.53,'exchange','signal'),(-.85,'people','violet')]:
  g='contract';cx=x+.20;cy=-2.48;z=.080
  if kind=='records':
   for j in range(3):
    yy=cy+.09-j*.08
    p.line(g,[(cx-.10,yy,z),(cx+.10,yy,z)],m,.006)
    p.disc(g,cx-.075,yy,.009,'white',z=z+.008)
   p.line(g,[(cx-.12,cy-.12,z),(cx-.12,cy+.13,z),(cx+.12,cy+.13,z),(cx+.12,cy-.12,z)],m,.003)
  elif kind=='exchange':
   p.icon(g,'arrow',cx-.12,cy+.012,m,.20,z=z)
   p.line(g,[(cx+.10,cy-.08,z),(cx-.10,cy-.08,z),(cx-.05,cy-.03,z)],m,.004)
  else:
   for dx,dy in [(-.065,0),(.065,0),(0,.08)]:
    p.disc(g,cx+dx,cy+dy+.025,.028,m,z=z)
    p.line(g,[(cx+dx-.035,cy+dy-.055,z),(cx+dx-.035,cy+dy-.02,z),(cx+dx+.035,cy+dy-.02,z),(cx+dx+.035,cy+dy-.055,z)],m,.004)
  p.label(g,{'records':'ERP','exchange':'API','people':'CRM'}[kind],x+.48,-2.36,.094,m,True,z=.07)
 # Permission switches have a track, a moving thumb and a check linked to
 # the authorization beat, adding both recognizable UI and causal motion.
 for yy in [-1.005,-1.265]:
  p.rounded('access-node-1',6.39,yy+.04,.19,.30,.135,.004,'mint',.067)
 p.disc('access-node-1',6.465,-.965,.047,'green',z=.20)
 p.disc('access-toggle',6.315,-1.225,.047,'green',z=.20)
 # Compact dimension chips sit outside content; their numbers count as the
 # corresponding rail draws, in the same spatial plane.
 for g,x,y,z,w in [('access',3.49,-.08,.23,.85),('contract',-4.54,.93,.09,.85),('data',1.265,.95,.09,.85)]:
  p.rounded(g+'-annotation',x+w/2-.025,y+.048,z-.013,w,.245,.004,'annotation',.043)
 p.texts=[item for item in p.texts if not(item[0]=='contract' and item[1] in ('ERP','API','CRM') and item[3]<-2.5)]
 enrich_controls(p)
 refine_product(p)
 refine_architecture(p)
 return p

def enrich_controls(p):
 # Different controls have different silhouettes. Icons identify field meaning;
 # values, type selectors and relational destinations retain their own baselines.
 for attr in ('meshes','texts','lines','boxes'):
  items=getattr(p,attr)
  if attr=='texts':
   items=[(g,txt,x+.22 if g=='contract' and txt in ('project.code','actor.role','order.id','P-104','Responsable','0248') else x,y,z,size,m,bold) for g,txt,x,y,z,size,m,bold in items]
   items=[(g,txt,1.88 if g=='data' and txt=='Orden 0248' else x,y,z,size,m,bold) for g,txt,x,y,z,size,m,bold in items]
   items=[item for item in items if not(item[0]=='access-node-1' and item[1] in ('O','T','R'))]
  if attr=='meshes':
   # Replace the state slab with two distinct state wells and a transfer gutter.
   items=[item for item in items if not(item[0]=='data' and item[1]=='paper' and abs((max(v[1] for v in item[2])+min(v[1] for v in item[2]))/2+.87)<.01)]
  setattr(p,attr,items)
 for i,(kind,m) in enumerate([('folder','amber'),('person','violet'),('ticket','signal')]):
  y=-.86-i*.48;g='contract';x=-4.10;z=.60
  p.rounded(g,x,y-.08,z-.012,.22,.23,.005,'fieldnav',.035)
  if kind=='folder':
   p.line(g,[(x-.074,y-.14,z),(x-.074,y-.01,z),(x-.022,y-.01,z),(x+.002,y-.035,z),(x+.075,y-.035,z),(x+.075,y-.14,z),(x-.074,y-.14,z)],m,.006)
  elif kind=='person':
   p.disc(g,x,y-.041,.033,m,z=z)
   p.line(g,[(x-.061,y-.14,z),(x-.061,y-.095,z),(x+.061,y-.095,z),(x+.061,y-.14,z)],m,.006)
  else:
   p.line(g,[(x-.066,y-.012,z),(x+.066,y-.012,z),(x+.066,y-.15,z),(x-.066,y-.15,z),(x-.066,y-.012,z)],m,.005)
   for yy in [y-.055,y-.096]:p.line(g,[(x-.035,yy,z+.003),(x+.035,yy,z+.003)],m,.005)
  # A small dropdown glyph belongs to the enum selector, not every field.
  if i==1:p.line(g,[(-2.48,y+.055,.595),(-2.46,y+.032,.595),(-2.44,y+.055,.595)],'muted',.003)
 # Headings belong to the same raised planes as their fields.
 p.texts=[(g,txt,x,y,.60 if g=='contract' and txt=='SOLICITUD' else z,size,m,bold) for g,txt,x,y,z,size,m,bold in p.texts]
 # A role's small team is represented by overlapping profile discs, with depth.
 g='access-node-1'
 for i,(x,m) in enumerate([(5.53,'amber'),(5.75,'violet'),(5.97,'signal')]):
  z=.24+i*.017
  p.disc(g,x,-.43,.102,'fieldnav',z=z)
  p.disc(g,x,-.409,.030,m,z=z+.005)
  p.rounded(g,x,-.466,z+.005,.092,.051,.002,m,.024)
 p.line(g,[(6.16,-.415,.25),(6.19,-.445,.25),(6.22,-.415,.25)],'muted',.004)
 # Identity verification has six exact code cells; the associated check resolves
 # on the same authorization clock. These replace the loose MFA text value.
 p.texts=[item for item in p.texts if not(item[0]=='access-node-0' and item[1]=='Sesión + MFA')]
 for i in range(6):
  x=1.82+i*.174;g='access-node-0';z=.535
  p.rounded(g,x,-2.235,z,.142,.182,.003,'fieldnav',.025)
  p.disc('access-check-0',x,-2.235,.015,'green',z=z+.006)
 # State transfer: separate neutral source and confirmed destination.
 g='data'
 for x,w,m in [(2.43,1.85,'fieldnav'),(4.85,1.84,'fieldpaper')]:
  p.rounded(g,x,-.87,.024,w,.66,.003,m,.045)
  p.line(g,[(x-w/2+.06,-.54,.030),(x+w/2-.06,-.54,.030)],'registration',.002)
 # A folded document icon and registration rings make the durable object clear.
 p.line(g,[(1.51,.09,.07),(1.69,.09,.07),(1.78,0,.07),(1.78,-.16,.07),(1.51,-.16,.07),(1.51,.09,.07)],'amber',.007)
 p.line(g,[(1.69,.09,.07),(1.69,0,.07),(1.78,0,.07)],'amber',.004)
 for yy in [-.055,-.105]:p.line(g,[(1.56,yy,.073),(1.71,yy,.073)],'amber',.004)
 for i in range(3):
  y=-1.81-i*.37;gg=f'data-event-{i}'
  p.rounded(gg,5.285,y+.017,.034,.72,.215,.003,'fieldnav',.035)
  # Time text is kept in front of the new capsule.
  p.texts=[(g,t,x,yy,max(z,.048) if g==gg and t.startswith('10:42:') else z,sz,m,b) for g,t,x,yy,z,sz,m,b in p.texts]
  p.line(gg,[(1.62,y+.06,.05),(1.62,y-.29,.05)],'signal',.004)
 # An opaque ID capsule keeps rear registration edges out of its glyphs.
 p.rounded('data',5.27,-2.875,.039,.66,.235,.003,'fieldnav',.03)
 p.texts=[(g,txt,x,y,.052 if g=='data' and txt=='0248-A' else z,size,m,bold) for g,txt,x,y,z,size,m,bold in p.texts]
 # Quiet illuminated lips define depth without a glow washing over the type.
 for g,b,z in [('contract',(-4.54,-3.02,1.24,.78),.023),('data',(1.265,-3.,6.015,.8),.023)]:
  x1,y1,x2,y2=b
  p.line(g,[(x1+.06,y2-.027,z),(x2-.06,y2-.027,z)],'muted',.002)


def refine_product(p):
 # The raised request heading projects over the old header divider. Keeping
 # that line would cut through its baseline at the crossed camera angle.
 p.lines=[(g,pts,m,r) for g,pts,m,r in p.lines if not(g=='contract' and len(pts)==2 and all(abs(v[1]+.22)<.001 for v in pts))]
 # Treat every control as a product object: a raised face, a quiet contact
 # shadow and an exact edge. Do not increase transparency over typography.
 # This is deliberately bounded to content wells, not an all-over bevel.
 original=list(p.meshes)
 for g,m,vv,ff in original:
  if m not in ('fieldpaper','fieldnav'):continue
  xs,ys,zs=zip(*vv);w=max(xs)-min(xs);h=max(ys)-min(ys)
  if w<.35 or h<.30 or w/h<1.35:continue
  x=(min(xs)+max(xs))/2;y=(min(ys)+max(ys))/2;z=min(zs)
  p.rounded(g,x+.009,y-.012,z-.006,w+.010,h+.012,.002,'shadow',.035)
  p.line(g,[(min(xs)+.05,max(ys)-.012,max(zs)+.003),(max(xs)-.05,max(ys)-.012,max(zs)+.003)],'bevel',.0025)
 # Recognizable avatars and status pills make the working list a product,
 # not eight identical lines. Team, identifier and task remain independently
 # aligned so the first reading is the actual work.
 for i in range(8):
  y=1.41-i*.48;g='selection' if i==0 else 'list'
  color=['signal','violet','amber','slate'][i%4]
  p.disc(g,-2.18,y+.045,.105,'fieldpaper',z=.070)
  p.disc(g,-2.18,y+.073,.030,color,z=.074)
  p.rounded(g,-2.18,y+.003,.074,.10,.050,.002,color,.024)
  p.rounded(g,.08,y+.043,.030,1.22,.275,.002,'mint' if i==0 else 'fieldnav',.070)
  p.line(g,[(-5.18,y-.15,.052),(-5.18,y+.14,.052)],color,.008)
 p.texts=[(g,t,-1.99 if g in ('list','selection') and x==-2.18 else x,y,z,sz,m,b) for g,t,x,y,z,sz,m,b in p.texts]
 # Segmented controls have an active tab, count and compact filter affordance.
 for x,t,w in [(-5.20,'Todas',.69),(-4.34,'En curso',.99),(-3.20,'Por revisar',1.15),(-1.83,'Resueltas',1.11)]:
  if t=='Todas':p.rounded('list',x+.29,2.383,.030,.76,.29,.002,'fieldpaper',.045)
 p.rounded('list',.24,2.38,.031,.92,.30,.002,'fieldnav',.045)
 p.label('list','Filtrar',.055,2.338,.108,'muted',z=.061)
 for yy,length in [(2.43,.11),(2.39,.075),(2.35,.034)]:p.line('list',[(-.08,yy,.066),(-.08+length,yy,.066)],'quiet',.004)
 # A precise project progress dial differentiates summary from table and map.
 p.label('inspector','ALCANCE',6.14,2.84,.076,'quiet',True,z=.072)
 p.label('inspector','8 / 8',6.14,2.61,.165,'ink',True,z=.073)
 cx,cy=5.91,2.75
 p.line('inspector',[(cx+.125*math.cos(i*math.tau/48),cy+.125*math.sin(i*math.tau/48),.081) for i in range(49)],'signal',.016)
 p.icon('inspector','check',cx-.055,cy-.055,'green',.12,z=.089)
 # Layer-specific navigation gives the permission view a real task context.
 p.texts=[(g,'Permisos del rol' if g=='access-node-1' and t=='RESPONSABLE DEL PROYECTO' else t,x,y,z,.135 if g=='access-node-1' and t=='RESPONSABLE DEL PROYECTO' else sz,m,b) for g,t,x,y,z,sz,m,b in p.texts]
 p.rounded('access-node-0',2.64,-.676,.507,.79,.22,.002,'mint',.07)
 p.texts=[(g,t,x,y,.551 if g=='access-node-0' and t=='Sesión activa' else z,sz,m,b) for g,t,x,y,z,sz,m,b in p.texts]
 # The scope selection has search, zoom, position and a version badge, each
 # with its own silhouette. These sit in the map, not on top of its labels.
 g='access-node-2';z=-.17
 p.rounded(g,3.755,-1.75,z,.33,.19,.005,'fieldnav',.03)
 p.line(g,[(3.66,-1.75,z+.007),(3.74,-1.75,z+.007)],'ink',.004)
 p.line(g,[(3.70,-1.79,z+.007),(3.70,-1.71,z+.007)],'ink',.004)
 p.line(g,[(3.79,-1.75,z+.007),(3.86,-1.75,z+.007)],'ink',.004)
 p.rounded(g,4.61,-2.59,z,.52,.16,.004,'fieldnav',.035)
 p.label(g,'P-104',4.40,-2.625,.082,'ink',True,z=z+.007)
 p.label(g,'SEDE VINCULADA',5.12,-2.34,.077,'quiet',True,z=z+.005)
 p.texts=[item for item in p.texts if not(item[0]==g and item[1]=='Ubicación de ejemplo')]
 # A contract now carries concrete values as well as schema. The destination
 # is smaller, nested and lower: field -> typed value -> relation is visible.
 g='contract'
 for i,(value,color) in enumerate([('P-104','amber'),('resp.','violet'),('0248','signal')]):
  y=-.86-i*.48;z=-.166
  p.rounded(g,.31,y-.065,z,.66,.225,.004,'mint' if i==2 else 'fieldpaper',.035)
  p.label(g,value,.055,y-.104,.106,color,True,z=z+.007)
 p.texts=[item for item in p.texts if not(item[0]=='contract' and item[1] in ('FK','ACL'))]
 # Integration destinations have availability and bidirectional identity.
 for x,color in [(-4.20,'amber'),(-2.53,'signal'),(-.85,'violet')]:
  p.disc(g,x+.19,-2.69,.015,'green',z=.084)
  p.label(g,'Conectado',x+.48,-2.70,.075,'green',z=.075)
 # Deliberate row backing + a small square token distinguish immutable events
 # from ordinary text. Each appears with its causal event, not all at once.
 for i in range(3):
  g=f'data-event-{i}';y=-1.81-i*.37
  p.rounded(g,3.715,y-.054,.017,4.01,.322,.002,'fieldnav' if i%2==0 else 'fieldpaper',.033)
  p.rounded(g,4.635,y+.024,.047,.24,.18,.003,'fieldpaper',.028)
  p.label(g,['01','02','03'][i],4.556,y-.005,.082,'quiet',True,z=.056)
 # A three-slot transaction receipt binds the same project, order and version
 # to the confirmed state. It occupies the reserved band above the history.
 for x,caption,value,m in [(1.54,'PROYECTO','P-104','amber'),(3.08,'ORDEN','0248','signal'),(4.62,'VERSIÓN','v3','violet')]:
  p.label('data',caption,x,-1.275,.068,'quiet',True,z=.064)
  p.label('data',value,x+.59,-1.275,.098,m,True,z=.065)
 # Keep the original text above new inset surfaces.
 p.texts=[(g,t,x,y,max(z,.050) if g.startswith('data-event-') else z,sz,m,b) for g,t,x,y,z,sz,m,b in p.texts]


def refine_architecture(p):
 # A product-level runtime view, deliberately illustrative. Stable IDs bind
 # policy, contract and audit; no client topology is asserted by this model.
 # Permission matrix: named roles share a compact table, with the effective
 # role lifted on its own opaque column. Different cells mean different rights.
 replace={'access-node-1','access-toggle','access-check-1'}
 for attr in ('meshes','texts','lines','boxes'):
  setattr(p,attr,[v for v in getattr(p,attr) if v[0] not in replace])
 g='access-node-1';z=.16
 p.rounded(g,5.14,-.82,z-.025,3.30,1.23,.014,'fieldnav',.035)
 rect(p,g,(3.49,-1.435,6.79,-.205),z-.006,'registration',.002)
 p.label(g,'Permisos del proyecto',3.64,-.405,.135,'ink',True,z=z+.015)
 p.label(g,'3 ROLES',6.22,-.398,.076,'quiet',True,z=z+.015)
 # A lifted column rather than a repeated floating card.
 p.rounded(g,5.60,-.955,z+.055,.61,.845,.016,'fieldpaper',.038)
 p.line(g,[(5.335,-.551,z+.076),(5.865,-.551,z+.076)],'signal',.004)
 for x,role in [(4.90,'Lector'),(5.60,'Responsable'),(6.32,'Admin')]:
  p.label(g,role,x-(.252 if role=='Responsable' else .125),-.642,.076,'green' if role=='Responsable' else 'quiet',role=='Responsable',z=z+.085)
 for row,(label,cells) in enumerate([('Consultar orden',(1,1,1)),('Aprobar orden',(0,1,1)),('Exportar historial',(0,0,1))]):
  yy=-.838-row*.224
  p.label(g,label,3.65,yy-.029,.106,'ink',row==1,z=z+.026)
  if row<2:p.line(g,[(3.65,yy-.11,z+.025),(6.61,yy-.11,z+.025)],'line',.0015)
  for col,(x,enabled) in enumerate(zip([4.90,5.60,6.32],cells)):
   gg='access-check-1' if row==1 and col==1 else g;zz=z+(.092 if col==1 else .033)
   p.rounded(gg,x,yy,zz,.106,.106,.003,'mint' if enabled else 'fieldnav',.022)
   if enabled:p.icon(gg,'check',x-.035,yy-.035,'green' if col==1 else 'muted',.071,z=zz+.005)
   else:p.line(gg,[(x-.022,yy,zz+.006),(x+.022,yy,zz+.006)],'quiet',.004)
 # The context remains on glass but content keeps enough contrast to read.
 for gg,b,z in [('access-node-0',(1.56,-2.78,3.22,-.205),.48),('access-node-2',(3.49,-2.78,6.79,-1.58),-.23)]:
  x1,y1,x2,y2=b
  p.line(gg,[(x1+.03,y2-.016,z+.024),(x2-.03,y2-.016,z+.024)],'bevel',.004)
  p.line(gg,[(x2,y2,z),(x2,y1,z),(x1,y1,z)],'edge',.0022)
 # A role directory uses exact cells and IDs, not a generic wall of labels.
 # Integration header: semantic tabs and a compact protocol inspector preserve
 # the existing field ports/gutter and their causal travelling pulses.
 g='contract'
 p.texts=[v for v in p.texts if not(v[0]==g and v[1] in ('CONTRATO DE INTEGRACIÓN','202'))]
 p.rounded(g,-1.65,.495,.032,5.26,.30,.004,'fieldnav',.035)
 for x,t,ink in [(-4.18,'Contrato','ink'),(-3.27,'Campos','quiet'),(-2.50,'Validación','quiet')]:p.label(g,t,x,.45,.108,ink,t=='Contrato',z=.055)
 p.line(g,[(-4.18,.333,.057),(-3.55,.333,.057)],'signal',.004)
 p.label(g,'REST',-.72,.46,.082,'quiet',True,z=.055)
 p.label(g,'JSON',-.25,.46,.082,'quiet',True,z=.055)
 p.label(g,'v3',.43,.46,.09,'green',True,z=.055)
 # Schema chips + named ports make routing inspectable without crossing copy.
 for i,(value,label) in enumerate([('P-104','1 proyecto'),('resp.','1 rol'),('0248','1 orden')]):
  y=-.86-i*.48
  p.rounded(g,-2.205,y-.065,.58,.070,.070,.004,'signal',.012)
  p.rounded(g,-1.605,y-.065,-.185,.070,.070,.004,'signal',.012)
  p.label(g,label,-.10,y+.13,.065,'quiet',z=-.16)
 # A footer carries the same request identity and the outcome, with a trace
 # split into authored stages, not fabricated performance measurements.
 p.texts=[v for v in p.texts if not(v[0]==g and v[1]=='INTEGRACIÓN DEL PROYECTO')]
 p.label(g,'0248-A',-4.24,-2.975,.092,'quiet',True,z=.065)
 p.label(g,'SOLICITUD',-3.51,-2.975,.069,'quiet',True,z=.065)
 p.label('contract-check-2','VALIDADA',-.13,-2.975,.080,'green',True,z=.065)
 for i in range(3):
  x=-2.29+i*.48
  p.rounded(f'contract-check-{i}',x,-2.944,.062,.36,.045,.004,'signal',.02)
 # Rebuild the record as a dense audit inspector. Its relations are routed in
 # their own band. Only the selected state is raised; event rows use varied
 # glyphs, actor/source, identity, timestamp and integrity without overlapping.
 for attr in ('meshes','texts','lines','boxes'):
  setattr(p,attr,[v for v in getattr(p,attr) if family(v[0])!='data' or v[0] in ('data-depth','data-annotation')])
 g='data'
 p.rounded(g,3.64,-1.10,-.015,4.75,3.80,.014,'glass',.045)
 rect(p,g,(1.265,-3.00,6.015,.80),.017,'signal',.005)
 p.label(g,'REGISTRO DE LA OPERACIÓN',1.50,.46,.108,'quiet',True,z=.045)
 p.tag('data-commit','COMMIT',4.75,.46,1.02,'mint','green',z=.045)
 p.label(g,'Orden 0248',1.86,.04,.226,'ink',True,z=.058)
 p.label(g,'Nueva sede / aprobación de trabajo',1.50,-.215,.115,'muted',z=.058)
 # A folded record glyph, two precise ruled lines and its hash at the header.
 p.line(g,[(1.51,.205,.065),(1.68,.205,.065),(1.77,.115,.065),(1.77,-.042,.065),(1.51,-.042,.065),(1.51,.205,.065)],'amber',.005)
 p.line(g,[(1.68,.205,.065),(1.68,.115,.065),(1.77,.115,.065)],'amber',.003)
 for yy in [.056,.008]:p.line(g,[(1.555,yy,.069),(1.715,yy,.069)],'amber',.003)
 p.label(g,'SHA',4.75,.062,.076,'violet',True,z=.059)
 p.label(g,'7c4f…a218',5.12,.062,.085,'quiet',z=.059)
 # This three-node relation has stable IDs, explicit direction and a separate
 # routing channel. It is UML-like object provenance, not a claimed schema.
 for i,(x,title,value,col) in enumerate([(1.50,'PROYECTO','P-104','amber'),(3.02,'ORDEN','0248','signal'),(4.54,'VERSIÓN','v3','violet')]):
  p.rounded(g,x+.57,-.488,.047,1.14,.30,.005,'fieldnav',.035)
  p.disc(g,x+.11,-.493,.024,col,z=.061)
  p.label(g,title,x+.185,-.452,.062,'quiet',True,z=.063)
  p.label(g,value,x+.185,-.566,.095,col,True,z=.063)
  if i<2:
   p.line(g,[(x+1.14,-.49,.058),(x+1.43,-.49,.058)],'registration',.003)
   p.line(g,[(x+1.38,-.46,.058),(x+1.43,-.49,.058),(x+1.38,-.52,.058)],'registration',.003)
 # State transition separates neutral source from a physically lifted result.
 for x,w,m,z in [(2.42,1.83,'fieldnav',.04),(4.84,1.86,'fieldpaper',.18)]:
  p.rounded(g,x,-.985,z,w,.50,.014,m,.045)
  p.line(g,[(x-w/2+.05,-.745,z+.02),(x+w/2-.05,-.745,z+.02)],'bevel',.003)
 p.label(g,'ESTADO ANTERIOR',1.67,-.86,.079,'quiet',True,z=.065)
 p.label(g,'En revisión',1.67,-1.076,.145,'muted',z=.067)
 p.icon('data-commit','arrow',3.43,-1.03,'signal',.25,z=.12)
 p.label('data-pending','VALIDANDO',4.09,-.86,.079,'amber',True,z=.204)
 p.label('data-pending','3 condiciones',4.09,-1.076,.139,'muted',z=.204)
 p.label('data-commit','CONFIRMADO',4.09,-.86,.079,'green',True,z=.204)
 p.label('data-commit','Aprobada',4.09,-1.076,.155,'ink',True,z=.204)
 # The selected Events tab has a count. Other tabs remain recognizable but
 # quiet, as in an actual inspector rather than four equally weighted cards.
 p.rounded(g,4.79,-1.434,.054,1.36,.24,.004,'fieldpaper',.037)
 for x,t in [(1.50,'Resumen'),(2.70,'Relaciones'),(4.24,'Eventos')]:p.label(g,t,x,-1.477,.102,'ink' if t=='Eventos' else 'quiet',t=='Eventos',z=.074)
 p.rounded(g,5.24,-1.430,.075,.20,.145,.003,'mint',.035)
 p.label(g,'3',5.211,-1.468,.077,'green',True,z=.082)
 p.rule(g,1.50,5.78,-1.612,'line',z=.052)
 entries=[('Permiso verificado','MS / Responsable / P-104','ACL','10:42:16','signal'),('Contrato validado','REST / v3 / 3 campos','API','10:42:17','violet'),('Aprobación registrada','0248 / versión 3 / persistida','DB','10:42:18','amber')]
 for i,(title,sub,token,clock,col) in enumerate(entries):
  gg=f'data-event-{i}';y=-1.84-i*.345
  p.rounded(gg,3.64,y-.047,.035,4.28,.30,.003,'fieldnav' if i%2==0 else 'fieldpaper',.035)
  p.rounded(gg,1.76,y-.038,.071,.31,.225,.006,'mint' if i==0 else 'fieldnav',.035)
  p.label(gg,token,1.646,y-.067,.072,col,True,z=.086)
  p.label(gg,title,2.04,y,.115,'ink',True,z=.066)
  p.label(gg,sub,2.04,y-.143,.078,'quiet',z=.068)
  p.label(gg,clock,5.075,y,.081,'quiet',z=.068)
  p.disc(gg,4.872,y+.025,.020,col,z=.075)
  p.label(gg,['01','02','03'][i],5.42,y-.143,.074,col,True,z=.068)
  if i<2:p.line(gg,[(1.58,y-.205,.08),(1.58,y-.31,.08)],'registration',.0025)
 p.icon('data-event-2','check',1.52,-2.885,'green',.10,z=.065)
 p.label('data-event-2','Integridad verificada',1.70,-2.892,.094,'green',z=.064)
 p.label(g,'0248-A',5.03,-2.892,.103,'quiet',True,z=.065)
 p.label(g,'<transaction>',1.340,-3.20,.148,'white',True,z=.09)
 # Layer seams are sparse and exact. They establish depth without a chunky
 # bevel or a full-sheet tint across the readable typography.
 for x in (1.30,5.98):p.line(g,[(x,.73,.046),(x,.73,-.18),(x,-2.91,-.18)],'registration',.002)


def site_map(p,g,x,y,w,h,z):
 # A deliberately illustrative site locator. It never claims customer geography.
 p.rounded(g,x+w/2,y+h/2,z-.009,w,h,.003,'mapland',.025)
 # Mixed parcels, curved watercourse, a park and a junction read as a city,
 # without claiming that this demonstration is surveyed geographic data.
 for col in range(9):
  for row in range(6):
   u=.055+col*.105;v=.065+row*.15
   if .25<u<.49 and .24<v<.70:continue
   if abs(u-(.81-.19*math.sin(v*3.4)))<.06:continue
   bw=w*(.060+.012*((row+col)%3));bh=h*(.088+.017*((col*3+row)%2))
   p.rounded(g,x+w*u,y+h*v,z,bw,bh,.003,'mapblock',.005)
 p.rounded(g,x+w*.37,y+h*.47,z+.001,w*.23,h*.44,.002,'mappark',.035)
 # Park walkways make the green region legible, even in the smaller viewport.
 for k in [-1,0,1]:
  p.line(g,[(x+w*.28,y+h*(.30+k*.012),z+.006),(x+w*.46,y+h*(.65+k*.012),z+.006)],'quiet',.0014)
 water=[(x+w*(.81-.19*math.sin(v*3.4)),y+h*v,z+.006) for v in [.045+.9*i/40 for i in range(41)]]
 # A flat map feature must stay on its plane; a bevelled curve turns a river
 # into a raised cable and protrudes beyond the viewport.
 for i,(a,b) in enumerate(zip(water,water[1:])):
  dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy);nx,ny=-dy/length*w*.014,dx/length*w*.014
  verts=[(a[0]+nx,a[1]+ny,a[2]),(a[0]-nx,a[1]-ny,a[2]),(b[0]-nx,b[1]-ny,b[2]),(b[0]+nx,b[1]+ny,b[2])]
  p.meshes.append((g,'mapwater',verts,[(0,1,2,3)]));p.points.setdefault(g,[]).extend(verts)
 for i in range(8):
  xx=x+w*(.103+i*.105)
  p.line(g,[(xx,y+.025*h,z+.005),(xx,y+.94*h,z+.005)],'maproad',.0018)
 for i in range(6):
  yy=y+h*(.14+i*.15)
  p.line(g,[(x+.025*w,yy,z+.005),(x+.96*w,yy,z+.005)],'maproad',.0018)
 for cx,cy in [(.16,.46),(.55,.77)]:
  p.line(g,[(x+w*(cx+.035*math.cos(i*math.tau/32)),y+h*(cy+.052*math.sin(i*math.tau/32)),z+.013) for i in range(33)],'maproad',.004)
 # An arterial road cuts across the grid; a route connects the selected site.
 points=[(x+w*u,y+h*v,z+.014) for u,v in [(0,.23),(.19,.23),(.47,.42),(.69,.68),(1,.78)]]
 p.line(g,points,'quiet',.011)
 route=[(x+w*u,y+h*v,z+.021) for u,v in [(.15,.83),(.52,.83),(.52,.61),(.65,.61)]]
 p.line(g,route,'signal',.008)
 px,py=x+w*.65,y+h*.61
 p.disc(g,px,py,.065*w,'mint',z=z+.029)
 p.disc(g,px,py,.027*w,'green',z=z+.038)
 p.line(g,[(px,py+.02,z+.04),(px,py+.14*h,z+.15)],'signal',.007)
 p.disc(g,px,py+.14*h,.035*w,'white',z=z+.155)
 # North marker and distance ruler give the map a recognizable visual grammar.
 p.label(g,'N',x+w*.89,y+h*.84,.066,'muted',True,z=z+.022)
 p.line(g,[(x+.70*w,y+.08*h,z+.020),(x+.91*w,y+.08*h,z+.020)],'white',.003)

def logo_contours():
 # Preserve the official SVG outlines, including counters, without approximating
 # the brand with a different typeface. Q curves are sampled for Blender fills.
 result=[]
 for el in ET.parse(ROOT/'public/images/logo-dark.svg').getroot():
  if not el.tag.endswith('path'):continue
  tr=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',el.attrib['transform'])]
  tx,ty,sx,sy=tr;tokens=re.findall(r'[A-Z]|-?\d+(?:\.\d+)?',el.attrib['d']);i=0;cur=(0,0);paths=[];pts=[];cmd=None
  while i<len(tokens):
   if tokens[i].isalpha():cmd=tokens[i];i+=1
   if cmd=='Z':
    if pts:paths.append(pts);pts=[]
    cmd=None;continue
   n={'M':2,'L':2,'H':1,'V':1,'Q':4}[cmd];v=list(map(float,tokens[i:i+n]));i+=n
   if cmd in ('M','L'):cur=tuple(v);pts.append(cur);cmd='L'
   elif cmd=='H':cur=(v[0],cur[1]);pts.append(cur)
   elif cmd=='V':cur=(cur[0],v[0]);pts.append(cur)
   elif cmd=='Q':
    a=cur;b=v[:2];c=v[2:]
    for k in range(1,13):
     t=k/12;pts.append(tuple((1-t)**2*a[j]+2*(1-t)*t*b[j]+t*t*c[j] for j in range(2)))
    cur=tuple(c)
  if pts:paths.append(pts)
  result.append((el.attrib['fill'],[[(tx+sx*x,100-(ty+sy*y)) for x,y in path] for path in paths]))
 return result

def validate():
 p=build();assert 'integration' not in p.points and 'runtime' not in p.points
 assert all(m in COLORS for _,m,_,_ in p.meshes)
 for t in [i/(FRAMES-1) for i in range(FRAMES)]:
  d,target,angles=camera(t);assert d>10 and all(math.isfinite(x) for x in (*target,*angles))
 assert camera(0)==camera(1)
 # At every handover at least one mechanism stays visible. Empty fades fail.
 for i in range(FRAMES):
  t=i/(FRAMES-1)
  assert max(focus(g,t) for g in ['base','list','access','contract','data'])>.19
  assert sum(focus(g,t) for g in ['access','contract','data'])<=1.001
 for i in range(FRAMES):
  t=i/(FRAMES-1)
  if prominence('base',t)>.025:assert max(prominence(g,t) for g in ['access','contract','data'])<.025
 assert prominence('access-check-2',.20)<.001
 assert prominence('access-check-2',.29)>.99
 assert prominence('contract-check-2',.50)<.001
 assert prominence('contract-check-2',.58)>.99
 assert prominence('data-commit',.70)<.001
 assert prominence('data-commit',.78)>.99
 for frame in range(FRAMES):
  t=frame/(FRAMES-1)
  if prominence('data-pending',t)>.025:assert prominence('data-commit',t)<.025, 'Pending and confirmed words cannot overlap'
 assert prominence('access-annotation',.15)<.001
 assert prominence('access-annotation',.23)>.99

 assert all(m not in ALPHA for g,s,x,y,z,size,m,bold in p.texts), 'Glyphs must remain opaque'
 # Continuous camera velocity; the loop join settles to zero.
 for t in [.22,.345,.44,.585,.69,.815,.94]:
  a=camera(t-1e-6);b=camera(t+1e-6)
  assert abs(a[0]-b[0])<.001 and max(abs(x-y) for x,y in zip(a[2],b[2]))<.002
  before=camera(t-1e-5);after=camera(t+1e-5);middle=camera(t)
  assert max(abs((middle[2][i]-before[2][i])-(after[2][i]-middle[2][i]))/1e-5 for i in range(3))<.5
 assert not any(g=='base' and max(v[0] for v in vv)-min(v[0] for v in vv)>15 and max(v[1] for v in vv)-min(v[1] for v in vv)>9 for g,m,vv,ff in p.meshes), 'No continuous enclosing board'
 assert placement('access',.4)[2]-placement('inspector',.4)[2]>1.5
 assert camera(.22)[2][0]*camera(.66)[2][0]<0
 print(json.dumps({'version':'v23','publishable':False,'labels':len(p.texts),'surfaces':len(p.meshes),'perspective':True,'crosses_axis':True}))

def render(args):
 import bpy
 from mathutils import Matrix,Vector
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
 scene.render.engine='BLENDER_EEVEE_NEXT';scene.eevee.taa_render_samples=args.samples
 scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.use_persistent_data=True
 scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width/(1 if args.composition=='mobile' else 16/9));scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.fps=FPS
 scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
 world=bpy.data.worlds.new('Deep blue negative space');world.use_nodes=True;scene.world=world
 def linear(h):
  vals=[int(h[i:i+2],16)/255 for i in (1,3,5)]
  return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)
 world.node_tree.nodes['Background'].inputs[0].default_value=(*linear(COLORS['floor']),1)
 world.node_tree.nodes['Background'].inputs[1].default_value=1
 mats={}
 for name,color in COLORS.items():
  mat=bpy.data.materials.new(name);mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear()
  output=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(*linear(color),1);em.inputs[1].default_value=1
  if name in ALPHA:
   mat.surface_render_method='BLENDED';mat.use_transparency_overlap=False
   tr=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=ALPHA[name]
   mat.node_tree.links.new(tr.outputs[0],mix.inputs[1]);mat.node_tree.links.new(em.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],output.inputs['Surface'])
  else:mat.node_tree.links.new(em.outputs[0],output.inputs['Surface'])
  mats[name]=mat
 surface_mats={}
 def surface_material(group,name):
  key=(group,name)
  if key in surface_mats:return surface_mats[key][0]
  mat=bpy.data.materials.new('surface/'+group+'/'+name);mat.use_nodes=True;mat.surface_render_method='BLENDED';mat.use_transparency_overlap=False
  nodes=mat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(*linear(COLORS[name]),1)
  if name in ALPHA:
   tr=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=ALPHA[name]
   mat.node_tree.links.new(tr.outputs[0],mix.inputs[1]);mat.node_tree.links.new(em.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],out.inputs['Surface'])
   tex=nodes.new('ShaderNodeTexCoord');sep=nodes.new('ShaderNodeSeparateXYZ');shade=nodes.new('ShaderNodeMath');shade.operation='MULTIPLY_ADD';shade.inputs[1].default_value=.32;shade.inputs[2].default_value=.84
   mat.node_tree.links.new(tex.outputs['Generated'],sep.inputs[0]);mat.node_tree.links.new(sep.outputs['Y'],shade.inputs[0]);mat.node_tree.links.new(shade.outputs[0],em.inputs[1])
   surface_mats[key]=(mat,mix)
  else:
   mat.surface_render_method='DITHERED'
   mat.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
   if name in ('fieldpaper','fieldnav'):
    tex=nodes.new('ShaderNodeTexCoord');sep=nodes.new('ShaderNodeSeparateXYZ');shade=nodes.new('ShaderNodeMath');shade.operation='MULTIPLY_ADD';shade.inputs[1].default_value=.27;shade.inputs[2].default_value=.88
    mat.node_tree.links.new(tex.outputs['Generated'],sep.inputs[0]);mat.node_tree.links.new(sep.outputs['Y'],shade.inputs[0]);mat.node_tree.links.new(shade.outputs[0],em.inputs[1])
   surface_mats[key]=(mat,em)
  return mat
 glyph_mats={}
 def glyph_material(group,name,region='content'):
  key=(group,name,region)
  if key in glyph_mats:return glyph_mats[key][0]
  # Opaque fine geometry with continuous intensity avoids stochastic alpha
  # coverage on text/strokes. Hidden groups are removed from rendering entirely.
  mat=bpy.data.materials.new('/'.join(key));mat.use_nodes=True
  nodes=mat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(*linear(COLORS[name]),1)
  mat.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
  glyph_mats[key]=(mat,em);return mat
 fonts={b:bpy.data.fonts.load(str(Path(args.font_dir)/f'UMSans-{w}.ttf')) for b,w in [(False,'Regular'),(True,'SemiBold')]}
 p=build();parents={};visibility=[];glass_visibility=[];stroke_visibility=[];dimension_lines=[];reveal_text=[];image_visibility=[];operation_labels=[]
 for g in p.points:
  ob=bpy.data.objects.new(g,None);scene.collection.objects.link(ob);parents[g]=ob
 # Batch coplanar opaque details by parent/material; retain independent glass
 # objects for depth sorting. This preserves geometry, resolution and shading.
 opaque={};render_meshes=[]
 for g,m,verts,faces in p.meshes:
  if m in ALPHA:render_meshes.append((g,m,verts,faces));continue
  vv,ff=opaque.setdefault((g,m),([],[]));offset=len(vv);vv.extend(verts);ff.extend(tuple(i+offset for i in f) for f in faces)
 render_meshes.extend((g,m,vv,ff) for (g,m),(vv,ff) in opaque.items())
 for index,(g,m,verts,faces) in enumerate(render_meshes):
  center=Vector(tuple((min(v[i] for v in verts)+max(v[i] for v in verts))/2 for i in range(3)))
  local=[tuple(Vector(v)-center) for v in verts]
  mesh=bpy.data.meshes.new(f'{g}/{m}/{index}');mesh.from_pydata(local,[],faces);mesh.update();ob=bpy.data.objects.new(mesh.name,mesh);scene.collection.objects.link(ob);mesh.materials.append(surface_material(g,m));ob.parent=parents[g];ob.location=center
  if m not in ALPHA:visibility.append((ob,g))
  else:glass_visibility.append((ob,g))
 for g,x,y,z,w,d,h,m in p.boxes:
  bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z+h/2));ob=bpy.context.object;ob.scale=(w,d,h);ob.data.materials.append(surface_material(g,m));ob.parent=parents[g]
  if m not in ALPHA:visibility.append((ob,g))
  else:glass_visibility.append((ob,g))
 for g,s,x,y,z,size,m,bold in p.texts:
  c=bpy.data.curves.new(s,'FONT');c.body=s;c.size=size;c.font=fonts[bold];c.extrude=0;c.materials.append(glyph_material(g,m,'properties' if g=='inspector' and -.3<y<2.3 else 'content'));ob=bpy.data.objects.new(s,c);scene.collection.objects.link(ob);ob.location=(x,y,z);ob.parent=parents[g];visibility.append((ob,g))
  if s.startswith('<') or s.startswith('UM Sans ·'):reveal_text.append((c,s,g))
  initial={'Aprobada':'En revisión','Orden aprobada':'Aprobar orden','Aprobación registrada':'Revisión solicitada','MS aprobó la orden 0248':'MS solicitó revisión de la orden 0248'}
  if family(g) not in ('data','access','contract') and s in initial:operation_labels.append((c,initial[s],s))
 def line(name,pts,m,r,parent=None):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2
  sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
  center=Vector(tuple((min(p[i] for p in pts)+max(p[i] for p in pts))/2 for i in range(3))) if name=='Fine geometry' else Vector((0,0,0))
  for point,co in zip(sp.points,pts):point.co=(*tuple(Vector(co)-center),1)
  c.materials.append(glyph_material(parent.name if parent else 'connections',m,'edge'));ob=bpy.data.objects.new(name,c);scene.collection.objects.link(ob);ob.parent=parent;ob.location=center;stroke_visibility.append((ob,parent.name if parent else 'connections'));return ob,sp
 for g,pts,m,r in p.lines:
  ob,sp=line('Fine geometry',pts,m,r,parents[g])
  if '-check-' in g or g=='data-commit':visibility.append((ob,g))
  if family(g) in ('access','contract','data') and m in ('signal','typeline') and (r in (.0037,.0045) or (len(pts)==5 and pts[0]==pts[-1])):dimension_lines.append((ob.data,g))
 # Original vector logo, with actual white contours and brand-red punctuation.
 for g,x,y,w,z in [('base',-7.66,4.16,2.94,.07),('access-node-0',1.75,-1.41,1.28,.54)]:
  for color,paths in logo_contours():
   c=bpy.data.curves.new('Official ULTIMA MILLA wordmark','CURVE');c.dimensions='2D';c.fill_mode='BOTH';c.resolution_u=12
   for points in paths:
    sp=c.splines.new('POLY');sp.points.add(len(points)-1);sp.use_cyclic_u=True
    for point,(xx,yy) in zip(sp.points,points):point.co=(xx*w/620,yy*w/620,0,1)
   c.materials.append(glyph_material(g,'brand' if color=='#DC2626' else 'white'))
   ob=bpy.data.objects.new(c.name,c);scene.collection.objects.link(ob);ob.parent=parents[g];ob.location=(x,y,z);visibility.append((ob,g))
 # Existing architectural image is product context, explicitly labelled as a
 # demonstration. It is not presented as photographic evidence of a customer.
 g='inspector';x,y,w,h,z=1.66,.13,2.64,1.67,.075
 mesh=bpy.data.meshes.new('Project image');mesh.from_pydata([(x,y,z),(x+w,y,z),(x+w,y+h,z),(x,y+h,z)],[],[(0,1,2,3)]);mesh.update()
 uv=mesh.uv_layers.new(name='Image UV');coords=[(0,0),(1,0),(1,1),(0,1)]
 # Centre-crop to the content well; the original raster is preserved.
 ratio=(1200/864)/(w/h);uspan=min(1,1/ratio);vspan=min(1,ratio)
 for poly in mesh.polygons:
  for li in poly.loop_indices:
   u,v=coords[mesh.loops[li].vertex_index];uv.data[li].uv=(.5+(u-.5)*uspan,.5+(v-.5)*vspan)
 mat=bpy.data.materials.new('Architectural project image');mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear()
 outnode=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'public/cine/media/empresa-mendoza.jpg'))
 mat.node_tree.links.new(tex.outputs['Color'],em.inputs[0]);mat.node_tree.links.new(em.outputs[0],outnode.inputs['Surface']);mesh.materials.append(mat)
 ob=bpy.data.objects.new('Project image',mesh);scene.collection.objects.link(ob);ob.parent=parents[g];visibility.append((ob,g));image_visibility.append((em,g))
 # Inspection labels display the measured width/height in the product's 100px
 # coordinate system. Their values settle with the drawing of each bound.
 dimension_text=[]
 for g,x,y,z,w,h in [('access',3.49,-.08,.23,3.30,1.23),('contract',-4.54,.93,.09,5.78,3.80),('data',1.265,.95,.09,4.75,3.80)]:
  c=bpy.data.curves.new('Measured layout','FONT');c.size=.15;c.font=fonts[True];c.materials.append(glyph_material(g,'white'));ob=bpy.data.objects.new(c.name,c);scene.collection.objects.link(ob);ob.location=(x,y,z);ob.parent=parents[g];visibility.append((ob,g));dimension_text.append((c,g,w,h))
 links=[]
 for g,(*b,m) in REGIONS.items():
  x1,y1,x2,y2=b
  for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:
   ob,sp=line('Layer registration',[(x,y,-.025),(x,y,.061)],'registration',.0018,parents['base'])
   links.append((g,sp,(x,y)))
 # An actual path from approval to contract to commit. These segments use
 # geometry behind the glass, so occlusion and parallax survive camera moves.
 route,route_sp=line('Approval / contract / commit',[(0,0,0)]*5,'red',.0055)
 packet,packet_sp=line('0248-A / request',[(0,0,0)]*2,'amber',.016)
 packet.data.materials[0]=glyph_material('packet','amber')
 mapping_signals=[]
 for i in range(3):
  ob,sp=line('Field correspondence '+str(i),[(0,0,0)]*2,'signal',.009,parents['contract'])
  ob.data.materials[0]=glyph_material('contract-pulse-'+str(i),'signal')
  mapping_signals.append(sp)
 camera_data=bpy.data.cameras.new('Crossed POV');camera_data.type='PERSP';camera_data.lens=48;camera_data.sensor_width=36;camera_data.sensor_fit='HORIZONTAL';camera_data.clip_start=.1;camera_data.clip_end=200
 cam=bpy.data.objects.new('Crossed POV',camera_data);scene.collection.objects.link(cam);scene.camera=cam
 out=Path(args.output);out.mkdir(parents=True,exist_ok=True);times=[]
 def update(scene):
  frame=scene.frame_current
  t=frame/(FRAMES-1);d,target,angles=camera(t)
  if args.composition=='mobile':d*=1.08-.14*E((t-.14)/.08)*(1-E((t-.84)/.08))
  ax,ay,roll=map(math.radians,angles);n=Vector((math.tan(ax),math.tan(ay),1)).normalized();r=Vector((n.z,0,-n.x)).normalized();u=n.cross(r);rr=math.cos(roll)*r+math.sin(roll)*u;uu=-math.sin(roll)*r+math.cos(roll)*u
  cam.location=Vector(target)+n*d;cam.rotation_euler=Matrix((rr,uu,n)).transposed().to_euler()
  for g,ob in parents.items():
   ob.location=placement(g,t)
   if g=='access-toggle':ob.location.x+=.15*E((t-.198)/.026)
  for curve,before,after in operation_labels:curve.body=after if t>=.82 else before
  for curve,g in dimension_lines:curve.bevel_factor_end=annotation_progress(g,t)
  for curve,text,g in reveal_text:curve.body=text[:round(len(text)*annotation_progress(g,t))]
  for curve,g,w,h in dimension_text:
   q=annotation_progress(g,t);curve.body=f'{round(w*100*q)} × {round(h*100*q)}' if q>.02 else ''
  for em,g in image_visibility:em.inputs[1].default_value=prominence(g,t)
  for ob,g in visibility:ob.hide_render=prominence(g,t)<.025
  # Fully dormant transparent planes add fill cost and a barely visible wash.
  # Keep every entering/exiting surface; cull only settled inactive families.
  for ob,g in glass_visibility:ob.hide_render=prominence(g,t)<.00031 and focus(g,t)<.00001
  for (group,name),(mat,mix) in surface_mats.items():
   # Structural glass stays transparent; content islands gain quiet contrast.
   opacity=ALPHA[name]*(.008+.992*focus(group,t)) if name in ALPHA and '-' not in group else ALPHA.get(name,1)*prominence(group,t)
   if family(group)=='access':opacity*=E((t-.10)/.07)
   if name in ALPHA:mix.inputs[0].default_value=opacity
   else:
    floor=linear(COLORS['floor']);ink=linear(COLORS[name]);q=max(0,min(1,opacity))
    mix.inputs[0].default_value=(*(a+(b-a)*q for a,b in zip(floor,ink)),1)
  for (group,name,region),(mat,em) in glyph_mats.items():
   opacity=prominence(group,t)
   if group.startswith('contract-pulse-'):
    progress=(t-(.428+.038*int(group[-1])))/.027
    opacity=E(progress/.15)*(1-E((progress-.8)/.2))
   elif group=='packet':opacity=E((t-.27)/.06)*(1-E((t-.78)/.05))
   elif group=='connections':opacity=.08+.55*E((t-.28)/.08)*(1-E((t-.80)/.08))
   elif region=='edge':
    opacity=prominence(group,t) if '-check-' in group or group=='data-commit' or group.startswith('data-event-') else focus(group,t)
   if family(group)=='access':opacity*=E((t-.10)/.07)
   floor=linear(COLORS['floor']);ink=linear(COLORS[name]);q=max(0,min(1,opacity))
   em.inputs[0].default_value=(*(a+(b-a)*q for a,b in zip(floor,ink)),1)
   mat['visible_intensity']=q
  for ob,group in stroke_visibility:
   # Pulses override their curve material after construction. Their actual
   # material, not the parent panel's focus, determines whether they exist.
   ob.hide_render=ob.data.materials[0].get('visible_intensity',1)<.025
  for i,sp in enumerate(mapping_signals):
   q=E((t-(.428+.038*i))/.027);x=-2.21+.58*q;y=-.92-i*.48
   z=.595-.77*q
   sp.points[0].co=(x-.035,y,z,1);sp.points[1].co=(x+.035,y,z,1)
  for g,sp,(x,y) in links:
   dx,dy,dz=placement(g,t);sp.points[1].co=(x+dx,y+dy,.061+dz,1)
  ax,ay,az=placement('access',t);cx,cy,cz=placement('contract',t);dx,dy,dz=placement('data',t)
  pts=[(6.96+ax,-2.88+ay,az+.06),(7.65,-3.85,-.7),(-4.75+cx,-3.85,cz+.03),(-4.75+cx,-3.45,cz+.03),(6.12+dx,-3.45,dz+.03)]
  for point,co in zip(route_sp.points,pts):point.co=(*co,1)
  # A calm, single request. No random activity or reverse transaction.
  lengths=[(Vector(b)-Vector(a)).length for a,b in zip(pts,pts[1:])]
  arrival=sum(lengths[:3]);travel=arrival*E((t-.28)/.15)+lengths[3]*E((t-.58)/.12)
  travel=min(travel,sum(lengths)-.0001)
  for index,length in enumerate(lengths):
   if travel<=length:
    a,b=Vector(pts[index]),Vector(pts[index+1]);v=(b-a).normalized();point=a+v*travel
    packet_sp.points[0].co=(*point,1);packet_sp.points[1].co=(*(point+v*.22),1);break
   travel-=length
 started=[0]
 def begin(scene):started[0]=time.time()
 def finish(scene):
  times.append({'frame':scene.frame_current,'seconds':round(time.time()-started[0],2)})
  (out/'render-info.json').write_text(json.dumps({'version':'v23','publishable':False,'projection':'perspective','composition':args.composition,'engine':'eevee','samples':args.samples,'geometry_sha256':hashlib.sha256(Path(ui.geometry.__file__).read_bytes()).hexdigest(),'ui_sha256':hashlib.sha256(Path(ui.__file__).read_bytes()).hexdigest(),'fps':FPS,'frames':FRAMES,'resolution':[args.width,scene.render.resolution_y],'asset_sha256':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['public/images/logo-dark.svg','public/cine/media/empresa-mendoza.jpg']},'authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'timings':times}))

 scene.frame_start=args.start;scene.frame_end=args.end;scene.render.filepath=str(out)+'/'
 bpy.app.handlers.frame_change_pre.append(update);bpy.app.handlers.render_pre.append(begin);bpy.app.handlers.render_post.append(finish)
 try:
  bpy.ops.render.render(animation=True)
  assert [x['frame'] for x in times]==list(range(args.start,args.end+1))
 finally:
  bpy.app.handlers.frame_change_pre.remove(update);bpy.app.handlers.render_pre.remove(begin);bpy.app.handlers.render_post.remove(finish)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int,default=0);parser.add_argument('--samples',type=int,default=32);parser.add_argument('--width',type=int,default=3840);parser.add_argument('--composition',choices=['wide','mobile'],default='wide');parser.add_argument('--font-dir');parser.add_argument('--output',default='frames');parser.add_argument('--validate-only',action='store_true')
 args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<FRAMES
 validate()
 if not args.validate_only:render(args)
