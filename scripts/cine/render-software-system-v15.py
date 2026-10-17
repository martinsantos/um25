"""Spatial software study: registered translucent planes, crossed perspective.
Native Blender proof on remote workers only. No automatic publication.
"""
import argparse, hashlib, importlib.util, json, math, sys, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('ui',Path(__file__).with_name('render-software-system-v11.py'))
ui=importlib.util.module_from_spec(spec);spec.loader.exec_module(ui)
E=ui.E
FPS=60;FRAMES=1200
COLORS={
 'floor':'#101B20','ink':'#F0F6F7','muted':'#C0D5DE','quiet':'#85AAB9',
 'line':'#35494E','edge':'#517785','slate':'#9EBDD0','red':'#FF796A',
 'green':'#6FE4CB','signal':'#63DCCB','rose':'#512F39','mint':'#214A4C',
 'paper':'#426F83','canvas':'#375D70','nav':'#2D4C5D','bluewash':'#42677E',
 'glass':'#5D94A5','trace':'#60DDC8','registration':'#648D9E','white':'#F4F8F9',
 'amber':'#F5CA83','violet':'#B2AFF6'}
# The background is absent from most of the layout: small translucent regions
# give the communication paths room to be seen, rather than tinting a white slab.
ALPHA={'paper':.20,'canvas':.08,'nav':.10,'bluewash':.13,'glass':.065,'edge':.0}
REGIONS={
 'list':(-5.43,-4.44,.91,3.88,'signal'),
 'inspector':(1.26,-4.37,7.30,4.03,'signal'),
 'access':(1.60,-2.88,6.96,.64,'amber'),
 'history':(1.61,-3.49,6.95,-1.95,'violet'),
 'action':(1.61,-4.30,6.95,-3.62,'red')}

def family(group):
 return group.split('-')[0] if group.startswith(('access-','contract-','data-')) else group

def exposure(t):return .30+.70*E((t-.025)/.15)*(1-E((t-.84)/.16))
def placement(group,t):
 q=exposure(t);group=family(group)
 return {'list':(-.22*q,.18*q,.64*q), 'selection':(-.22*q,.18*q,.68*q),
 'inspector':(.50*q,.08*q,1.56*q), 'access':(.20*q,-.55*q,3.26*q),
 'summary':(.50*q,.08*q,1.56*q),
 'history':(.55*q,-.27*q,2.20*q),'action':(.55*q,-.27*q,2.20*q),
 'contract':(-1.45*q,0,-1.10), 'data':(.70*q,0,-1.70)}.get(group,(0,0,0))

def focus(group,t):
 group=family(group)
 if group=='access':return E((t-.115)/.075)*(1-E((t-.355)/.075))
 if group=='contract':return E((t-.355)/.075)*(1-E((t-.605)/.075))
 if group=='data':return E((t-.605)/.075)*(1-E((t-.825)/.065))
 return (1-E((t-.115)/.075))+E((t-.825)/.065)

def prominence(group,t):
 f=focus(group,t)
 # Glass returns before typography: the returning product must never print
 # its labels through the still-readable transaction plane.
 if family(group) not in ('access','contract','data'):f=(1-E((t-.105)/.045))+E((t-.89)/.05)
 if family(group)=='access':f=E((t-.155)/.05)*(1-E((t-.355)/.075))
 if group.startswith('access-check-'):f*=E((t-(.17+.028*int(group[-1])))/.026)
 if group.startswith('contract-check-'):f*=E((t-(.455+.038*int(group[-1])))/.027)
 if group=='data-commit':f*=E((t-.725)/.03)
 if group.startswith('data-event-'):f*=E((t-(.70+.04*int(group[-1])))/.025)
 return .0003+.9997*f

def camera(t):
 # Longer reading intervals and a continuous spatial handover: no black cut.
 keys=[(0,31,(.5,0,1),(18,-25,-5)),
       (.11,22,(3.3,-.8,1.8),(20,-23,-4)),
       (.22,12.5,(4.45,-1.72,3.0),(15,-20,-3)),
       (.345,12.3,(4.50,-1.72,3.0),(11,-18,-2)),
       (.44,12.4,(-3.0,-1.12,-.6),(-10,-22,3)),
       (.585,12.2,(-3.0,-1.12,-.6),(-13,-20,4)),
       (.69,11.6,(4.35,-1.10,-1.1),(-17,-20,4)),
       (.815,11.4,(4.35,-1.10,-1.1),(-18,-18,3)),
       (.94,31,(.5,0,1),(18,-25,-5)),
       (1,31,(.5,0,1),(18,-25,-5))]
 for a,b in zip(keys,keys[1:]):
  if a[0]<=t<=b[0]:
   q=E((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
   return mix(a[1],b[1]),tuple(mix(x,y) for x,y in zip(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3]))
 raise ValueError(t)

def rect(p,g,bounds,z,m='signal',r=.008):
 x1,y1,x2,y2=bounds
 p.line(g,[(x1,y1,z),(x2,y1,z),(x2,y2,z),(x1,y2,z),(x1,y1,z)],m,r)
 for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:
  p.rounded(g,x,y,z,.045,.045,.001,m,.008)

def build():
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
  s={'En revisión':'Aprobada','Aprobar orden':'Orden aprobada','Revisión solicitada':'Aprobación registrada','MS solicitó revisión de la orden 0248':'MS aprobó la orden 0248'}.get(s,s)
  p.text(g,s,x,y,z,size,'floor' if m=='paper' else m,bold)
 for g,points,m,r in source.lines:
  if g in keep:
   # Replace thick highlighted rectangles with consistently fine geometry.
   p.line(g,points,'signal' if m=='red' else m,min(r,.004))
 p.rounded('list',-2.26,-.27,-.018,6.34,8.31,.002,'canvas',.035)
 for g,(*bounds,m) in REGIONS.items():rect(p,g,bounds,.061,m)
 rect(p,'summary',(1.60,-1.86,6.96,-.49),.061,'amber')
 rect(p,'base',(-8.03,-4.86,8.03,4.89),-.012,'registration',.003)
 # The glass envelope is almost empty. Its rear edge is visible *through*
 # the lifted inspector, registering the software's layers in real depth.
 p.label('base','ÚLTIMA MILLA / INGENIERÍA DE SOFTWARE',-7.95,5.25,.13,'quiet',True)
 p.label('base','Una acción. Todas las capas conectadas.',-7.95,5.60,.23,'ink')
 # The permission is a mechanism: identity, membership and scope converge.
 g='access'
 p.rounded(g,4.28,-1.12,.015,5.36,3.52,.005,'glass',.055)
 p.label(g,'IDENTIDAD / AUTORIZACIÓN',1.84,.28,.116,'quiet',True)
 p.label(g,'Una acción, tres condiciones.',1.84,-.09,.230,'ink',True)
 p.label(g,'Aprobar orden 0248 · Proyecto P-104',1.84,-.38,.126,'muted')
 p.rule(g,1.84,6.72,-.59)
 rows=[('01','Sesión autenticada','MS · cuenta corporativa','Identidad'),('02','Responsable del proyecto','operaciones.approve','Rol'),('03','Recurso dentro del alcance','proyecto / P-104','Alcance')]
 for i,(n,title,sub,kind) in enumerate(rows):
  y=-.96-i*.52
  p.label(g,n,1.85,y,.115,'amber',True)
  p.label(g,title,2.24,y,.150,'ink',True)
  p.label(g,sub,2.24,y-.18,.112,'muted')
  p.rule(g,2.24,6.69,y-.30)
  gg=f'access-check-{i}'
  p.disc(gg,6.35,y+.01,.103,'mint');p.icon(gg,'check',6.29,y-.035,'green',.14)
 p.tag('access-check-2','Puede aprobar',1.84,-2.57,1.57,'mint','green')
 p.label(g,'POLÍTICA / v3',5.52,-2.57,.106,'quiet',True)
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
  p.rounded(g,-3.24,y-.04,.024,2.02,.40,.003,'paper',.035)
  p.label(g,key,-4.13,y+.01,.110,'muted');p.label(g,value,-4.13,y-.16,.130,'ink',True)
  p.rounded(g,-.37,y-.04,.024,2.30,.40,.003,'nav',.035)
  p.icon(f'contract-check-{i}','check',-1.43,y-.10,'green',.11);p.label(g,dest,-1.20,y-.09,.133,'ink')
  p.line(g,[(-2.21,y-.06,.040),(-1.63,y-.06,.040)],'signal',.003)
  p.disc(g,-2.20,y-.06,.018,'signal');p.disc(g,-1.63,y-.06,.018,'signal')
 p.rule(g,-4.27,.97,-2.20)
 p.tag('contract-check-2','202 Aceptada',-4.27,-2.61,1.43,'mint','green')
 p.label(g,'0248-A',-2.56,-2.61,.135,'ink',True)
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
 p.vline(g,1.62,-1.74,-2.43,'registration')
 for i,(title,sub) in enumerate([('Permiso verificado','MS · Responsable · P-104'),('approval.accepted','Orden 0248 · versión 3')]):
  y=-1.86-i*.52;gg=f'data-event-{i}'
  p.disc(gg,1.62,y+.07,.027,'green' if i else 'signal')
  p.label(gg,title,1.83,y,.135,'ink',True)
  p.label(gg,sub,1.83,y-.19,.110,'muted')
 p.label(g,'MISMA SOLICITUD',1.50,-2.76,.092,'quiet',True)
 p.label(g,'0248-A',4.85,-2.76,.130,'green',True)
 for g,b in [('access',(1.60,-2.88,6.96,.64)),('contract',(-4.54,-3.02,1.24,.78)),('data',(1.265,-3.00,6.015,.80))]:
  x1,y1,x2,y2=b
  rect(p,g+'-depth',b,-.36,'registration',.0025)
  for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:
   p.line(g+'-depth',[(x,y,-.36),(x,y,.018)],'registration',.002)
 # Sparse registration ticks, tied to actual boundaries. No decorative grid.
 for x in [-5.43,.91,1.26,7.30]:
  p.line('base',[(x,-5.02,-.012),(x,-5.24,-.012)],'registration',.002)
 return p

def validate():
 p=build();assert 'integration' not in p.points and 'runtime' not in p.points
 assert all(m in COLORS for _,m,_,_ in p.meshes)
 for t in [i/(FRAMES-1) for i in range(FRAMES)]:
  d,target,angles=camera(t);assert d>10 and all(math.isfinite(x) for x in (*target,*angles))
 assert camera(0)==camera(1)
 # At every handover at least one mechanism stays visible. Empty fades fail.
 for i in range(FRAMES):
  t=i/(FRAMES-1)
  assert max(focus(g,t) for g in ['base','access','contract','data'])>=.49
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

 assert all(m not in ALPHA for g,s,x,y,z,size,m,bold in p.texts), 'Glyphs must remain opaque'
 # Each interpolation finishes with zero velocity, including the loop join.
 for t in [.22,.345,.44,.585,.69,.815,.94]:
  a=camera(t-1e-6);b=camera(t+1e-6)
  assert abs(a[0]-b[0])<1e-4 and max(abs(x-y) for x,y in zip(a[2],b[2]))<1e-4
 assert not any(g=='base' and max(v[0] for v in vv)-min(v[0] for v in vv)>15 and max(v[1] for v in vv)-min(v[1] for v in vv)>9 for g,m,vv,ff in p.meshes), 'No continuous enclosing board'
 assert placement('access',.4)[2]-placement('inspector',.4)[2]>1.5
 assert camera(.22)[2][0]*camera(.66)[2][0]<0
 print(json.dumps({'version':'v15','publishable':False,'labels':len(p.texts),'surfaces':len(p.meshes),'perspective':True,'crosses_axis':True}))

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
  tr=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=ALPHA.get(name,1)
  mat.node_tree.links.new(tr.outputs[0],mix.inputs[1]);mat.node_tree.links.new(em.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],out.inputs['Surface'])
  surface_mats[key]=(mat,mix);return mat
 glyph_mats={}
 def glyph_material(group,name,region='content'):
  key=(group,name,region)
  if key in glyph_mats:return glyph_mats[key][0]
  mat=bpy.data.materials.new('/'.join(key));mat.use_nodes=True;mat.surface_render_method='BLENDED';mat.use_transparency_overlap=False
  nodes=mat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(*linear(COLORS[name]),1)
  tr=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=1
  mat.node_tree.links.new(tr.outputs[0],mix.inputs[1]);mat.node_tree.links.new(em.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],out.inputs['Surface'])
  glyph_mats[key]=(mat,mix);return mat
 fonts={b:bpy.data.fonts.load(str(Path(args.font_dir)/f'UMSans-{w}.ttf')) for b,w in [(False,'Regular'),(True,'SemiBold')]}
 p=build();parents={};visibility=[]
 for g in p.points:
  ob=bpy.data.objects.new(g,None);scene.collection.objects.link(ob);parents[g]=ob
 # Separate transparent surfaces, so EEVEE sorts them correctly by depth.
 for index,(g,m,verts,faces) in enumerate(p.meshes):
  mesh=bpy.data.meshes.new(f'{g}/{m}/{index}');mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new(mesh.name,mesh);scene.collection.objects.link(ob);mesh.materials.append(surface_material(g,m));ob.parent=parents[g]
  if m not in ALPHA:visibility.append((ob,g))
 for g,x,y,z,w,d,h,m in p.boxes:
  bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z+h/2));ob=bpy.context.object;ob.scale=(w,d,h);ob.data.materials.append(surface_material(g,m));ob.parent=parents[g]
  if m not in ALPHA:visibility.append((ob,g))
 for g,s,x,y,z,size,m,bold in p.texts:
  c=bpy.data.curves.new(s,'FONT');c.body=s;c.size=size;c.font=fonts[bold];c.extrude=0;c.materials.append(glyph_material(g,m,'properties' if g=='inspector' and -.3<y<2.3 else 'content'));ob=bpy.data.objects.new(s,c);scene.collection.objects.link(ob);ob.location=(x,y,z);ob.parent=parents[g];visibility.append((ob,g))
 def line(name,pts,m,r,parent=None):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2
  sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
  for point,co in zip(sp.points,pts):point.co=(*co,1)
  c.materials.append(glyph_material(parent.name if parent else 'connections',m,'edge'));ob=bpy.data.objects.new(name,c);scene.collection.objects.link(ob);ob.parent=parent;return ob,sp
 for g,pts,m,r in p.lines:
  ob,sp=line('Fine geometry',pts,m,r,parents[g])
  if '-check-' in g or g=='data-commit':visibility.append((ob,g))
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
  if args.composition=='mobile':d*=1.08-.31*E((t-.14)/.08)*(1-E((t-.84)/.08))
  ax,ay,roll=map(math.radians,angles);n=Vector((math.tan(ax),math.tan(ay),1)).normalized();r=Vector((n.z,0,-n.x)).normalized();u=n.cross(r);rr=math.cos(roll)*r+math.sin(roll)*u;uu=-math.sin(roll)*r+math.cos(roll)*u
  cam.location=Vector(target)+n*d;cam.rotation_euler=Matrix((rr,uu,n)).transposed().to_euler()
  for g,ob in parents.items():ob.location=placement(g,t)
  for ob,g in visibility:ob.hide_render=prominence(g,t)<.025
  for (group,name),(mat,mix) in surface_mats.items():
   # Structural glass stays transparent; content islands gain quiet contrast.
   opacity=ALPHA[name]*(.11+.89*focus(group,t)) if name in ALPHA and '-' not in group else ALPHA.get(name,1)*prominence(group,t)
   if family(group)=='access':opacity*=E((t-.10)/.07)
   mix.inputs[0].default_value=opacity
  for (group,name,region),(mat,mix) in glyph_mats.items():
   opacity=prominence(group,t)
   if group.startswith('contract-pulse-'):
    progress=(t-(.428+.038*int(group[-1])))/.027
    opacity=E(progress/.15)*(1-E((progress-.8)/.2))
   elif group=='packet':opacity=E((t-.27)/.06)*(1-E((t-.78)/.05))
   elif group=='connections':opacity=.08+.55*E((t-.28)/.08)*(1-E((t-.80)/.08))
   elif region=='edge':
    opacity=prominence(group,t) if '-check-' in group or group=='data-commit' else .045+.955*focus(group,t) if group.endswith('-depth') else .018+.982*focus(group,t)
   if family(group)=='access':opacity*=E((t-.10)/.07)
   mix.inputs[0].default_value=max(0,opacity)
  for i,sp in enumerate(mapping_signals):
   q=E((t-(.428+.038*i))/.027);x=-2.21+.58*q;y=-.92-i*.48
   sp.points[0].co=(x-.05,y,.065,1);sp.points[1].co=(x+.05,y,.065,1)
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
  (out/'render-info.json').write_text(json.dumps({'version':'v15','publishable':False,'projection':'perspective','composition':args.composition,'engine':'eevee','samples':args.samples,'geometry_sha256':hashlib.sha256(Path(ui.geometry.__file__).read_bytes()).hexdigest(),'ui_sha256':hashlib.sha256(Path(ui.__file__).read_bytes()).hexdigest(),'fps':FPS,'frames':FRAMES,'resolution':[args.width,scene.render.resolution_y],'authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'timings':times}))

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
