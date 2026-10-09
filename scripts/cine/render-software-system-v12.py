"""Spatial software study: registered translucent planes, crossed perspective.
Native Blender proof on remote workers only. No automatic publication.
"""
import argparse, hashlib, importlib.util, json, math, sys, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('ui',Path(__file__).with_name('render-software-system-v11.py'))
ui=importlib.util.module_from_spec(spec);spec.loader.exec_module(ui)
E=ui.E
FPS=60;FRAMES=960
COLORS={
 'floor':'#0D1A23','ink':'#F0F6F7','muted':'#C0D5DE','quiet':'#85AAB9',
 'line':'#436775','edge':'#517785','slate':'#9EBDD0','red':'#FF796A',
 'green':'#6FE4CB','signal':'#63DCCB','rose':'#512F39','mint':'#214A4C',
 'paper':'#426F83','canvas':'#375D70','nav':'#2D4C5D','bluewash':'#42677E',
 'glass':'#5D94A5','trace':'#60DDC8','registration':'#648D9E','white':'#F4F8F9',
 'amber':'#F5CA83','violet':'#B2AFF6'}
# The background is absent from most of the layout: small translucent regions
# give the communication paths room to be seen, rather than tinting a white slab.
ALPHA={'paper':.42,'canvas':.23,'nav':.25,'bluewash':.29,'glass':.12,'edge':.0}
REGIONS={
 'list':(-5.43,-4.44,.91,3.88,'signal'),
 'inspector':(1.26,-4.37,7.30,4.03,'signal'),
 'access':(1.60,-1.86,6.96,-.49,'amber'),
 'history':(1.61,-3.49,6.95,-1.95,'violet'),
 'action':(1.61,-4.30,6.95,-3.62,'red')}

def exposure(t):return .30+.70*E((t-.025)/.15)*(1-E((t-.82)/.18))
def placement(group,t):
 q=exposure(t)
 return {'list':(-.22*q,.18*q,.64*q), 'selection':(-.22*q,.18*q,.68*q),
 'inspector':(.50*q,.08*q,1.56*q), 'access':(.20*q,-1.45*q,3.26*q),
 'history':(.55*q,-.27*q,2.20*q),'action':(.55*q,-.27*q,2.20*q),
 'contract':(-.8*q,0,-1.10), 'data':(.3*q,0,-1.70)}.get(group,(0,0,0))

def camera(t):
 # True perspective, consistent focal length. The lens crosses the x axis
 # while the viewer follows the *same* order through the transparent layout.
 keys=[(0,35,(1.0,-1.0,1),(22,-32,-9)),
       (.22,23,(1.8,-.6,1.6),(31,-30,-7)),
       (.45,18,(4.1,-1.1,2.2),(24,-39,-4)),
       (.65,23,(.7,-1.0,1.1),(-18,-35,5)),
       (.83,26,(.4,-.3,.8),(-24,-28,8)),
       (1,35,(1.0,-1.0,1),(22,-32,-9))]
 for a,b in zip(keys,keys[1:]):
  if a[0]<=t<=b[0]:
   q=E((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
   return mix(a[1],b[1]),tuple(mix(x,y) for x,y in zip(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3]))
 raise ValueError(t)

def rect(p,g,bounds,z,m='signal',r=.004):
 x1,y1,x2,y2=bounds
 p.line(g,[(x1,y1,z),(x2,y1,z),(x2,y2,z),(x1,y2,z),(x1,y1,z)],m,r)
 for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:
  p.rounded(g,x,y,z,.045,.045,.001,m,.008)

def build():
 source=ui.build();p=ui.UI()
 keep={'base','list','selection','inspector','access','history','action'}
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
 rect(p,'base',(-8.03,-4.86,8.03,4.89),-.012,'registration',.003)
 # The glass envelope is almost empty. Its rear edge is visible *through*
 # the lifted inspector, registering the software's layers in real depth.
 rect(p,'base',(-8.03,-4.86,8.03,4.89),-2.32,'registration',.0022)
 for x in [-8.03,8.03]:
  for y in [-4.86,4.89]:p.line('base',[(x,y,-2.32),(x,y,-.012)],'registration',.0022)
 p.label('base','ÚLTIMA MILLA / INGENIERÍA DE SOFTWARE',-7.95,5.25,.13,'quiet',True)
 p.label('base','Una acción. Todas las capas conectadas.',-7.95,5.60,.23,'ink')
 # A contract and a persistence trace live behind the UI, not beside it as
 # unrelated diagrams. They carry the same request / user / order values.
 g='contract';p.rounded(g,-1.65,-1.12,.0,5.78,2.86,.002,'glass',.025)
 rect(p,g,(-4.54,-2.55,1.24,.31),.017,'red',.003)
 p.label(g,'CONTRATO / 0248-A',-4.30,-.04,.135,'red',True)
 for i,(a,b) in enumerate([('POST','/orders/0248/approval'),('actor','MS / Responsable'),('scope','P-104 / Nueva sede'),('result','202 / Aceptada')]):
  y=-.56-i*.46;p.label(g,a,-4.28,y,.138,'quiet');p.label(g,b,-2.95,y,.156,'ink',i==3)
  p.rule(g,-4.28,.98,y-.18,'line')
 g='data';p.rounded(g,3.64,-1.10,0,4.75,2.88,.002,'glass',.025)
 rect(p,g,(1.265,-2.54,6.015,.34),.017,'violet',.003)
 p.label(g,'REGISTRO / TRANSACCIÓN',1.49,-.02,.132,'violet',True)
 for i,(a,b) in enumerate([('orden.id','0248'),('proyecto.id','P-104'),('estado','Aprobada'),('evento','approval.accepted')]):
  y=-.55-i*.46;p.label(g,a,1.50,y,.132,'quiet');p.label(g,b,3.64,y,.150,'ink',i==2)
  p.rule(g,1.50,5.76,y-.18,'line')
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
 assert all(m not in ALPHA for g,s,x,y,z,size,m,bold in p.texts), 'Glyphs must remain opaque'
 # Each interpolation finishes with zero velocity, including the loop join.
 for t in [.22,.45,.65,.83]:
  a=camera(t-1e-6);b=camera(t+1e-6)
  assert abs(a[0]-b[0])<1e-4 and max(abs(x-y) for x,y in zip(a[2],b[2]))<1e-4
 assert not any(g=='base' and max(v[0] for v in vv)-min(v[0] for v in vv)>15 and max(v[1] for v in vv)-min(v[1] for v in vv)>9 for g,m,vv,ff in p.meshes), 'No continuous enclosing board'
 assert placement('access',.4)[2]-placement('inspector',.4)[2]>1.5
 assert camera(.22)[2][0]*camera(.65)[2][0]<0
 print(json.dumps({'version':'v12','publishable':False,'labels':len(p.texts),'surfaces':len(p.meshes),'perspective':True,'crosses_axis':True}))

def render(args):
 import bpy
 from mathutils import Matrix,Vector
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
 scene.render.engine='BLENDER_EEVEE_NEXT';scene.eevee.taa_render_samples=args.samples
 scene.render.threads_mode='FIXED';scene.render.threads=4
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
 p=build();parents={}
 for g in p.points:
  ob=bpy.data.objects.new(g,None);scene.collection.objects.link(ob);parents[g]=ob
 # Separate transparent surfaces, so EEVEE sorts them correctly by depth.
 for index,(g,m,verts,faces) in enumerate(p.meshes):
  mesh=bpy.data.meshes.new(f'{g}/{m}/{index}');mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new(mesh.name,mesh);scene.collection.objects.link(ob);mesh.materials.append(surface_material(g,m));ob.parent=parents[g]
 for g,x,y,z,w,d,h,m in p.boxes:
  bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z+h/2));ob=bpy.context.object;ob.scale=(w,d,h);ob.data.materials.append(surface_material(g,m));ob.parent=parents[g]
 for g,s,x,y,z,size,m,bold in p.texts:
  c=bpy.data.curves.new(s,'FONT');c.body=s;c.size=size;c.font=fonts[bold];c.extrude=0;c.materials.append(glyph_material(g,m,'properties' if g=='inspector' and -.3<y<2.3 else 'content'));ob=bpy.data.objects.new(s,c);scene.collection.objects.link(ob);ob.location=(x,y,z);ob.parent=parents[g]
 def line(name,pts,m,r,parent=None):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2
  sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
  for point,co in zip(sp.points,pts):point.co=(*co,1)
  c.materials.append(mats[m]);ob=bpy.data.objects.new(name,c);scene.collection.objects.link(ob);ob.parent=parent;return ob,sp
 for g,pts,m,r in p.lines:line('Fine geometry',pts,m,r,parents[g])
 links=[]
 for g,(*b,m) in REGIONS.items():
  x1,y1,x2,y2=b
  for x,y in [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]:
   # Dashed rear registered baseline; solid tie to the elevated surface.
   for i in range(12):
    a=i/12;b2=(i+.44)/12
    line('Rear registered edge',[(x1+(x2-x1)*a,y,-.025),(x1+(x2-x1)*b2,y,-.025)],'registration',.0018)
   ob,sp=line('Layer registration',[(x,y,-.025),(x,y,.061)],m,.0028)
   links.append((g,sp,(x,y)))
 # An actual path from approval to contract to commit. These segments use
 # geometry behind the glass, so occlusion and parallax survive camera moves.
 route,route_sp=line('Approval / contract / commit',[(0,0,0)]*5,'red',.0055)
 packet,packet_sp=line('0248-A / request',[(0,0,0)]*2,'amber',.016)
 packet.data.materials[0]=glyph_material('packet','amber')
 camera_data=bpy.data.cameras.new('Crossed POV');camera_data.type='PERSP';camera_data.lens=48;camera_data.sensor_width=36;camera_data.sensor_fit='HORIZONTAL';camera_data.clip_start=.1;camera_data.clip_end=200
 cam=bpy.data.objects.new('Crossed POV',camera_data);scene.collection.objects.link(cam);scene.camera=cam
 out=Path(args.output);out.mkdir(parents=True,exist_ok=True);times=[]
 for frame in range(args.start,args.end+1):
  t=frame/(FRAMES-1);d,target,angles=camera(t)
  if args.composition=='mobile':
   # Dedicated optical framing, not a crop or non-uniform scale of the desktop.
   focus=E((t-.03)/.16)*(1-E((t-.82)/.18));back=E((t-.49)/.14)*(1-E((t-.80)/.12))
   d=17.5-3.0*focus+5.5*back;target=(4.15-3.7*back,-1.45,1.8-1.4*back)
  ax,ay,roll=map(math.radians,angles);n=Vector((math.tan(ax),math.tan(ay),1)).normalized();r=Vector((n.z,0,-n.x)).normalized();u=n.cross(r);rr=math.cos(roll)*r+math.sin(roll)*u;uu=-math.sin(roll)*r+math.cos(roll)*u
  cam.location=Vector(target)+n*d;cam.rotation_euler=Matrix((rr,uu,n)).transposed().to_euler()
  for g,ob in parents.items():ob.location=placement(g,t)
  inspected=E((t-.08)/.10)*(1-E((t-.50)/.10))
  infrastructure=E((t-.50)/.10)*(1-E((t-.82)/.10))
  for (group,name),(mat,mix) in surface_mats.items():
   strength=1 if group in ('contract','data') else 1-.84*infrastructure
   mix.inputs[0].default_value=ALPHA.get(name,1)*strength
  for (group,name,region),(mat,mix) in glyph_mats.items():
   opacity=1
   if group=='packet':opacity=E(t/.035)*(1-E((t-.93)/.045))
   elif group in ('contract','data'):opacity=.015+.985*infrastructure
   elif group=='inspector' and region=='properties':opacity=1-.84*inspected-.985*infrastructure
   elif group=='history':opacity=1-.985*inspected-.985*infrastructure
   elif group in ('base','list','selection','inspector','action'):opacity=1-.985*infrastructure
   elif group=='access':opacity=1-.985*infrastructure
   mix.inputs[0].default_value=max(0 if group=='packet' else .015,opacity)
  for g,sp,(x,y) in links:
   dx,dy,dz=placement(g,t);sp.points[1].co=(x+dx,y+dy,.061+dz,1)
  ax,ay,az=placement('access',t);cx,cy,cz=placement('contract',t);dx,dy,dz=placement('data',t)
  pts=[(4.3+ax,-1.18+ay,az-.08),(4.3+ax,-1.18+ay,-.7),(-1.65+cx,-1.18,-.7),(-1.65+cx,-1.18,cz+.1),(3.64+dx,-1.18,dz+.1)]
  for point,co in zip(route_sp.points,pts):point.co=(*co,1)
  # A calm, single request. No random activity or reverse transaction.
  phase=(t*.85+.1)%1;lengths=[(Vector(b)-Vector(a)).length for a,b in zip(pts,pts[1:])];travel=phase*sum(lengths)
  for index,length in enumerate(lengths):
   if travel<=length:
    a,b=Vector(pts[index]),Vector(pts[index+1]);v=(b-a).normalized();point=a+v*travel
    packet_sp.points[0].co=(*point,1);packet_sp.points[1].co=(*(point+v*.22),1);break
   travel-=length
  scene.frame_set(frame);scene.render.filepath=str(out/f'{frame:04d}.png');start=time.time();bpy.ops.render.render(write_still=True);times.append({'frame':frame,'seconds':round(time.time()-start,2)})
  (out/'render-info.json').write_text(json.dumps({'version':'v12','publishable':False,'projection':'perspective','composition':args.composition,'engine':'eevee','samples':args.samples,'geometry_sha256':hashlib.sha256(Path(ui.geometry.__file__).read_bytes()).hexdigest(),'ui_sha256':hashlib.sha256(Path(ui.__file__).read_bytes()).hexdigest(),'fps':FPS,'frames':FRAMES,'resolution':[args.width,scene.render.resolution_y],'authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'timings':times}))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int,default=0);parser.add_argument('--samples',type=int,default=32);parser.add_argument('--width',type=int,default=3840);parser.add_argument('--composition',choices=['wide','mobile'],default='wide');parser.add_argument('--font-dir');parser.add_argument('--output',default='frames');parser.add_argument('--validate-only',action='store_true')
 args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None);assert 0<=args.start<=args.end<FRAMES
 validate()
 if not args.validate_only:render(args)
