"""Native renderer with exact spline batching; derived from the v23 studio."""
import hashlib,json,math,time
from pathlib import Path

def render(args,model):
 build,camera,mobile_scale=model.build,model.camera,model.mobile_scale
 focus,prominence,placement=model.focus,model.prominence,model.placement
 family,annotation_progress=model.family,model.annotation_progress
 logo_contours=model.logo_contours
 COLORS,ALPHA,ROOT,ui=model.COLORS,model.ALPHA,model.ROOT,model.ui
 FPS,FRAMES,E=model.FPS,model.FRAMES,model.E
 REGIONS=model.REGIONS
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
 # A batch keeps independent splines, exact coordinates and material/reveal.
 # This reduces draw-call overhead without changing resolution or frame count.
 line_batches={}
 def line(name,pts,m,r,parent=None):
  g=parent.name if parent else 'connections'
  dimension=family(g) in ('access','contract','data') and m in ('signal','typeline') and (r in (.0037,.0045) or (len(pts)==5 and pts[0]==pts[-1]))
  key=(g,m,r,dimension) if name=='Fine geometry' else None
  if key is not None and key in line_batches:
   ob=line_batches[key];c=ob.data
  else:
   c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2
   c.materials.append(glyph_material(g,m,'edge'));ob=bpy.data.objects.new(name,c);scene.collection.objects.link(ob);ob.parent=parent
   stroke_visibility.append((ob,g))
   if key is not None:line_batches[key]=ob
  sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
  for point,co in zip(sp.points,pts):point.co=(*co,1)
  return ob,sp
 for g,pts,m,r in p.lines:
  ob,sp=line('Fine geometry',pts,m,r,parents[g])
  if '-check-' in g or g=='data-commit':visibility.append((ob,g))
  if family(g) in ('access','contract','data') and m in ('signal','typeline') and (r in (.0037,.0045) or (len(pts)==5 and pts[0]==pts[-1])):
   if (ob.data,g) not in dimension_lines:dimension_lines.append((ob.data,g))
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
  if args.composition=='mobile':d*=mobile_scale(t)
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
  pts=model.route_points(t)
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
  (out/'render-info.json').write_text(json.dumps({'version':'v23','publishable':False,'projection':'perspective','composition':args.composition,'engine':'eevee','samples':args.samples,'geometry_sha256':hashlib.sha256(Path(ui.geometry.__file__).read_bytes()).hexdigest(),'ui_sha256':hashlib.sha256(Path(ui.__file__).read_bytes()).hexdigest(),'fps':FPS,'frames':FRAMES,'resolution':[args.width,scene.render.resolution_y],'asset_sha256':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['public/images/logo-dark.svg','public/cine/media/empresa-mendoza.jpg']},'authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'timings':times,'objects':len(scene.objects),'curve_batches':len(line_batches)}))

 scene.frame_start=args.start;scene.frame_end=args.end;scene.render.filepath=str(out)+'/'
 bpy.app.handlers.frame_change_pre.append(update);bpy.app.handlers.render_pre.append(begin);bpy.app.handlers.render_post.append(finish)
 try:
  bpy.ops.render.render(animation=True)
  assert [x['frame'] for x in times]==list(range(args.start,args.end+1))
 finally:
  bpy.app.handlers.frame_change_pre.remove(update);bpy.app.handlers.render_pre.remove(begin);bpy.app.handlers.render_post.remove(finish)
