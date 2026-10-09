"""One six-second art-direction proof. Never import automatically into the site.
Actual UI hierarchy, shallow registered depth, restrained camera and studio shadows.
Blender runs only on a disposable remote worker; --validate-only is pure Python.
"""
import argparse,hashlib,importlib.util,json,math,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('geometry',Path(__file__).with_name('render-software-system-v8.py'))
geometry=importlib.util.module_from_spec(spec);spec.loader.exec_module(geometry)
FPS=60;FRAMES=360
PALETTE={'canvas':'#F3F5F6','nav':'#EBEEF0','paper':'#FFFFFF','edge':'#C9D0D4','ink':'#20282E','muted':'#68757F','quiet':'#929EA7','line':'#DDE3E7','red':'#DC2626','rose':'#FAEBEA','green':'#267B65','mint':'#EAF4EF','slate':'#526C82','bluewash':'#EEF3F6','floor':'#181D22'}
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
  self.line(g,[(x1,y1,.045),(x2,y1,.045),(x2,y2,.045),(x1,y2,.045),(x1,y1,.045)],'red',.003)
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
 g='access';p.surface(g,4.28,-1.03,5.28,.96,'bluewash',.024,.010,.035)
 p.icon(g,'check',1.83,-.94,'green',.19);p.label(g,'Permiso efectivo',2.16,-.88,.15,'ink',True)
 p.label(g,'MS puede aprobar órdenes del proyecto P-104.',2.16,-1.15,.125,'muted')
 p.tag(g,'Verificado',5.75,-.93,.90,'mint','green');p.label(g,'Identidad',1.82,-1.67,.105,'quiet');p.label(g,'Rol / responsable',3.66,-1.67,.105,'quiet');p.label(g,'Alcance / P-104',5.56,-1.67,.105,'quiet')
 g='history';p.rule(g,1.65,6.91,-1.93);p.label(g,'TRAZABILIDAD',1.65,-2.25,.103,'quiet',True)
 p.vline(g,1.85,-2.54,-3.40)
 for i,(title,sub) in enumerate([('Revisión solicitada','MS · hoy, 10:42'),('Alcance actualizado','Equipo de Redes · hoy, 10:31')]):
  yy=-2.65-i*.54;p.disc(g,1.85,yy+.052,.041,'red' if i==0 else 'quiet');p.label(g,title,2.10,yy,.137,'ink',i==0);p.label(g,sub,2.10,yy-.215,.114,'muted')
 g='action';p.rule(g,1.65,6.91,-3.64);p.label(g,'Todo cambio queda registrado.',1.66,-4.06,.118,'muted')
 p.rounded(g,6.00,-4.02,.028,1.82,.44,.005,'red',.035);p.label(g,'Aprobar orden',5.37,-4.065,.148,'paper',True)
 # Fine engineering annotations correspond to actual nested regions.
 for group,bounds in [('selection',(-5.27,1.17,.80,1.68)),('access',(1.60,-1.76,6.96,-.49)),('history',(1.61,-3.49,6.95,-1.95))]:
  p.boundary(group,*bounds)
 p.label('access','<policy scope="P-104">',1.64,-.42,.103,'red',z=.05)
 return p

def pose(group,t):
 # Register controls to their real positions. A single continuous inspection,
 # not a succession of cards thrown toward the viewer.
 opening=E((t-.12)/.55)
 z={'selection':.12,'inspector':.20,'access':.58,'history':.32,'action':.20,'annotation':.62}.get(group,0)*opening
 return (0,0,z)

def camera_pose(t):
 q=E((t-.02)/.74);size=19.4-9.8*q;target=(-.05+4.15*q,.02-1.62*q,.20+.06*q)
 angles=(8-3*q,-12-5*q,-1.8+1.1*q)
 return size,target,angles

def basis(t):
 size,target,angles=camera_pose(t);ax,ay,roll=map(math.radians,angles)
 n=(math.tan(ax),math.tan(ay),1);m=math.sqrt(sum(v*v for v in n));n=tuple(v/m for v in n)
 r=(n[2],0,-n[0]);m=math.sqrt(sum(v*v for v in r));r=tuple(v/m for v in r)
 u=(n[1]*r[2]-n[2]*r[1],n[2]*r[0]-n[0]*r[2],n[0]*r[1]-n[1]*r[0]);c,s=math.cos(roll),math.sin(roll)
 return size,target,tuple(c*x+s*y for x,y in zip(r,u)),tuple(-s*x+c*y for x,y in zip(r,u)),n

def validate():
 p=build();assert all(m in PALETTE for _,m,_,_ in p.meshes)
 assert {'Puesta en marcha','Permiso efectivo','TRAZABILIDAD','Aprobar orden'} <= {t[1] for t in p.texts}
 assert all(math.isfinite(v) for points in p.points.values() for point in points for v in point)
 # Regression from the rejected native frame: an opaque control must never
 # cover the baseline of its own label. This is visibility, not an art score.
 for g,label,x,y,z,size,material,bold in p.texts:
  for group,mat,verts,faces in p.meshes:
   if group!=g:continue
   xs,ys,zs=zip(*verts)
   if min(xs)<=x<=max(xs) and min(ys)<=y<=max(ys):
    assert z>max(zs),(label,'covered by',mat,z,max(zs))
 for frame in range(FRAMES):
  t=frame/(FRAMES-1);size,target,r,u,_=basis(t)
  assert size>0 and all(math.isfinite(v) for v in target)
  # The policy inspection is the focal subject throughout this proof.
  for g in ['access']:
   for point in p.points[g]:
    v=[a+b-c for a,b,c in zip(point,pose(g,t),target)]
    x=.5+sum(a*b for a,b in zip(v,r))/size;y=.5+sum(a*b for a,b in zip(v,u))/(size*9/16)
    assert .04<x<.96 and .04<y<.96,(frame,g,x,y)
 print(json.dumps({'proof':'v9','frames':FRAMES,'labels':len(p.texts),'surfaces':len(p.meshes),'publishable':False}))

def render(args):
 import bpy
 from mathutils import Matrix,Vector
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
 scene.render.engine={'cycles':'CYCLES','eevee':'BLENDER_EEVEE_NEXT','workbench':'BLENDER_WORKBENCH'}[args.engine]
 scene.cycles.samples=args.samples;scene.cycles.use_denoising=True;scene.cycles.max_bounces=4
 scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.use_persistent_data=True
 scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width*9/16);scene.render.resolution_percentage=100
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
  mats[name]=mat
 if args.engine=='workbench':
  scene.display.shading.light='FLAT';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=False;scene.display.render_aa='8';scene.display.shading.shadow_intensity=.12;scene.display.light_direction=(.2,-.25,1)
 font_dir=Path(args.font_dir) if args.font_dir else ROOT/'public/fonts/um-sans';fonts={bold:bpy.data.fonts.load(str(font_dir/f'UMSans-{weight}.ttf')) for bold,weight in [(False,'Regular'),(True,'SemiBold')]}
 product=build();parents={};combined={}
 for g in product.points:
  ob=bpy.data.objects.new(g,None);scene.collection.objects.link(ob);parents[g]=ob
 for g,m,verts,faces in product.meshes:
  vv,ff=combined.setdefault((g,m),([],[]));offset=len(vv);vv.extend(verts);ff.extend(tuple(offset+i for i in f) for f in faces)
 for g,x,y,z,w,d,h,m in product.boxes:
  vv,ff=combined.setdefault((g,m),([],[]));offset=len(vv);vv.extend([(x+a*w/2,y+b*d/2,z+c*h) for c in [0,1] for b in [-1,1] for a in [-1,1]])
  ff.extend(tuple(offset+i for i in f) for f in [(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)])
 for (g,m),(vv,ff) in combined.items():
  mesh=bpy.data.meshes.new(g+' / '+m);mesh.from_pydata(vv,[],ff);mesh.update();ob=bpy.data.objects.new(mesh.name,mesh);scene.collection.objects.link(ob);ob.parent=parents[g];mesh.materials.append(mats[m]);ob.display.show_shadows=m in ('edge','paper','canvas','nav')
  bevel=ob.modifiers.new('Fine edge','BEVEL');bevel.width=.001;bevel.segments=2
 for g,s,x,y,z,size,m,bold in product.texts:
  c=bpy.data.curves.new(s,'FONT');c.body=s;c.size=size;c.font=fonts[bold];c.extrude=0;ob=bpy.data.objects.new(s,c);scene.collection.objects.link(ob);ob.parent=parents[g];ob.location=(x,y,z);ob.visible_shadow=False;ob.display.show_shadows=False;c.materials.append(mats[m])
 def curve(name,pts,material,radius,parent=None):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=2;s=c.splines.new('POLY');s.points.add(len(pts)-1)
  for point,xyz in zip(s.points,pts):point.co=(*xyz,1)
  ob=bpy.data.objects.new(name,c);scene.collection.objects.link(ob);c.materials.append(mats[material]);ob.parent=parent;ob.visible_shadow=False;ob.display.show_shadows=False;return ob,s
 for g,pts,m,r in product.lines:curve('Authored detail',pts,m,r,parents[g])
 registration=[]
 for g,corners in [('selection',[(-5.27,1.17),(.80,1.17),(.80,1.68),(-5.27,1.68)]),('access',[(1.60,-1.76),(6.96,-1.76),(6.96,-.49),(1.60,-.49)])]:
  for x,y in corners:
   ob,s=curve('Registered control',[(x,y,.022),(x,y,.023)],'red',.002);registration.append((g,ob,s))
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.25));bpy.context.object.data.materials.append(mats['floor'])
 for name,pos,power,size in [('Key',(-5,3,14),1000,11),('Fill',(7,-5,10),350,9)]:
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.size=size;ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
 camdata=bpy.data.cameras.new('One deliberate inspection');camdata.type='ORTHO';camdata.sensor_fit='HORIZONTAL';cam=bpy.data.objects.new('One deliberate inspection',camdata);scene.collection.objects.link(cam);scene.camera=cam
 out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[];errors=[];started=[0]
 def update(scene):
  try:
   t=scene.frame_current/(FRAMES-1);size,target,r,u,n=basis(t);camdata.ortho_scale=size;cam.location=Vector(target)+Vector(n)*50;cam.rotation_euler=Matrix((r,u,n)).transposed().to_euler()
   for g,ob in parents.items():ob.location=pose(g,t)
   for g,ob,s in registration:s.points[1].co.z=.024+pose(g,t)[2];ob.hide_render=pose(g,t)[2]<.01
  except Exception as e:errors.append(repr(e));raise
 def begin(scene):started[0]=time.time()
 def finish(scene):
  timings.append({'frame':scene.frame_current,'seconds':round(time.time()-started[0],2)})
  (out/'render-info.json').write_text(json.dumps({'scene':'software-system-v9-art-direction-proof','frames':FRAMES,'fps':FPS,'resolution':[args.width,round(args.width*9/16)],'engine':args.engine,'publishable':False,'authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'timings':timings,'handler_errors':errors}))
 scene.frame_start=args.start;scene.frame_end=args.end;scene.render.filepath=str(out)+'/'
 bpy.app.handlers.frame_change_pre.append(update);bpy.app.handlers.render_pre.append(begin);bpy.app.handlers.render_post.append(finish)
 try:bpy.ops.render.render(animation=True);assert not errors;assert len(timings)==args.end-args.start+1
 finally:bpy.app.handlers.frame_change_pre.remove(update);bpy.app.handlers.render_pre.remove(begin);bpy.app.handlers.render_post.remove(finish)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int,default=359);parser.add_argument('--samples',type=int,default=48);parser.add_argument('--width',type=int,default=3840);parser.add_argument('--engine',choices=['cycles','eevee','workbench'],default='cycles');parser.add_argument('--font-dir');parser.add_argument('--output',default='frames');parser.add_argument('--validate-only',action='store_true')
 args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<FRAMES
 validate()
 if not args.validate_only:render(args)
