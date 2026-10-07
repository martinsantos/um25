"""Authored software architecture film. Render only on an isolated remote runner."""
import argparse, json, math, os, sys, time
from pathlib import Path
FPS, FRAMES = 24, 576

def smooth(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)

def pose(frame):
    t=frame/(FRAMES-1);approach=math.sin(math.pi*t)**2
    return (21.5-2.6*approach, math.radians(-58+7*math.sin(2*math.pi*t)), .38*approach)

def render(args):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU'
    scene.cycles.samples=args.samples;scene.cycles.use_denoising=True
    scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.018
    scene.cycles.max_bounces=4;scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
    scene.render.fps=FPS;scene.render.use_persistent_data=True;scene.view_settings.view_transform='AgX'
    scene.world=bpy.data.worlds.new('Software studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.042,.054,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
    mats={}
    def material(name,hexcolor,metal=0,rough=.4,emission=0):
        m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF']
        srgb=[int(hexcolor[i:i+2],16)/255 for i in (1,3,5)]
        rgb=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in srgb)
        p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
        p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=emission
        mats[name]=m;return m
    for row in [('floor','#0B1019',.08,.5),('graphite','#202B39',.42,.32),('edge','#758A9E',.65,.3),('paper','#E0E7EB',.12,.37),('white','#FAFBFC',.08,.4),('ink','#2B3D52',.12,.4),('muted','#7791AA',.18,.4),('red','#DC2626',.2,.3,.25),('blue','#51799B',.3,.36),('green','#82AFAC',.22,.4),('trace','#596D80',.45,.36),('packet','#FF493F',.12,.25,1.3)]:material(*row)
    groups={};bounds=[]
    def box(x,y,z,w,d,h,mat='graphite'):
        verts,faces=groups.setdefault(mat,([],[]));o=len(verts);x-=w/2;y-=d/2
        points=[(x,y,z),(x+w,y,z),(x+w,y+d,z),(x,y+d,z),(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)]
        verts.extend(points);bounds.extend(points)
        faces.extend(tuple(o+i for i in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    def line(points,mat='trace',radius=.014,name='Circuit'):
        c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=2
        sp=c.splines.new('POLY');sp.points.add(len(points)-1)
        for p,xyz in zip(sp.points,points):p.co=(*xyz,1)
        o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);c.materials.append(mats[mat]);return o
    def cylinder(x,y,z,r,h,mat='edge'):
        bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=h,location=(x,y,z+h/2))
        o=bpy.context.object;o.data.materials.append(mats[mat]);b=o.modifiers.new('Machined edges','BEVEL');b.width=.024;b.segments=3
        for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    def text(value,x,y,z,size=.13,mat='ink'):
        c=bpy.data.curves.new(value,'FONT');c.body=value;c.size=size;c.extrude=.0008;c.space_character=1.15
        o=bpy.data.objects.new(value,c);scene.collection.objects.link(o);o.location=(x,y,z);c.materials.append(mats[mat])
    def plate(x,y,z,w,d,label):
        box(x,y,z,w,d,.10,'edge');box(x,y,z+.1,w-.07,d-.07,.035,'paper')
        text(label,x-w/2+.17,y+d/2-.3,z+.139,.14)
        for dx in [-1,1]:
            for dy in [-1,1]:cylinder(x+dx*(w/2-.11),y+dy*(d/2-.11),z+.14,.023,.006,'edge')
    # 01. A designed product surface, with navigation, records and a selected request.
    ux,uy,uz=-3.15,-2.25,.65
    plate(ux,uy,uz,5.35,3.6,'01  PRODUCTO / UX UI')
    box(ux-2.12,uy-.07,uz+.14,.63,2.6,.025,'ink')
    for i in range(6):box(ux-2.12,uy+.88-i*.37,uz+.17,.38,.025,.012,'paper')
    box(ux+.25,uy+.72,uz+.16,3.55,.55,.025,'white')
    text('SOLICITUD  /  0248',ux-1.3,uy+.78,uz+.20,.15)
    box(ux+1.45,uy+.66,uz+.195,.77,.20,.015,'red')
    for i in range(4):
        yy=uy+.18-i*.39
        box(ux+.25,yy,uz+.155,3.55,.30,.025,'white')
        box(ux-1.36,yy,uz+.19,.075,.075,.015,'green' if i else 'red')
        box(ux-.68,yy,uz+.19,.78,.025,.012,'muted');box(ux+.48,yy,uz+.19,.75,.025,.012,'muted')
        box(ux+1.5,yy,uz+.19,.37,.075,.012,'blue')
    # 02. Business logic: dependency edges and three actual rule blocks.
    lx,ly,lz=-.3,1.18,1.03
    plate(lx,ly,lz,3.5,2.75,'02  REGLAS Y PERMISOS')
    for i,label in enumerate(['VALIDAR','AUTORIZAR','RESOLVER']):
        xx=lx-1.10+i*1.08
        box(xx,ly-.14,lz+.14,.84,.86,.30,'graphite');box(xx,ly-.14,lz+.44,.81,.83,.025,'white')
        text(label,xx-.34,ly-.07,lz+.47,.10)
        for k in range(3):box(xx,ly-.27-k*.085,lz+.47,.51,.018,.006,'muted')
        for k in range(5):box(xx-.30+k*.15,ly-.59,lz+.20,.045,.09,.04,'edge')
    line([(lx-1.1,ly-.62,lz+.16),(lx-1.1,ly-.96,lz+.16),(lx+1.07,ly-.96,lz+.16),(lx+1.07,ly-.62,lz+.16)],'red',.012)
    # 03. Integration adapters, with matching input/output connectors.
    ax,ay,az=3.53,.53,.83
    plate(ax,ay,az,2.8,2.4,'03  INTEGRACIONES')
    for i in range(2):
        yy=ay+.25-i*.86
        box(ax,yy,az+.14,2.16,.57,.26,'graphite');box(ax,yy,az+.40,2.11,.52,.025,'blue')
        text('API  /  CONTRATO' if i==0 else 'SISTEMA EXISTENTE',ax-.91,yy-.03,az+.43,.11,'white')
        for j in range(7):
            box(ax-.87+j*.29,yy-.35,az+.21,.13,.13,.07,'edge')
            box(ax-.87+j*.29,yy+.35,az+.21,.13,.13,.07,'edge')
    # 04. Persistent data: two independent stores, layered volumes, not city buildings.
    dx,dy,dz=3.35,3.92,.48
    plate(dx,dy,dz,3.2,2.8,'04  DATOS')
    for xx,yy in [(dx-.75,dy-.22),(dx+.70,dy+.05)]:
        cylinder(xx,yy,dz+.15,.56,1.02,'graphite')
        for k in range(4):cylinder(xx,yy,dz+.19+k*.27,.578,.037,'edge')
        cylinder(xx,yy,dz+1.18,.55,.035,'paper')
        cylinder(xx,yy,dz+1.22,.41,.009,'blue')
        for k in range(3):box(xx-.23+k*.18,yy-.56,dz+.35,.08,.015,.035,'green')
    # 05. Release lane, distinct from the application request path.
    rx,ry,rz=-1.04,4.55,.42
    plate(rx,ry,rz,3.85,1.85,'05  VERSIONES / DESPLIEGUE')
    for i,label in enumerate(['PRUEBA','VERSION','PUBLICAR']):
        xx=rx-1.22+i*1.22;box(xx,ry-.21,rz+.14,.94,.62,.26,'graphite')
        box(xx,ry-.21,rz+.40,.89,.57,.025,'paper');text(label,xx-.37,ry-.23,rz+.43,.10)
        box(xx,ry-.30,rz+.433,.53,.018,.008,'blue')
    # 06. Runtime and resources, with detailed front ports, drive carriers and rear cooling.
    sx,sy,sz=-4.1,1.7,.24
    plate(sx,sy,sz,2.4,3.2,'06  INFRAESTRUCTURA')
    for k in range(3):
        z=sz+.15+k*.29
        box(sx,sy-.14,z,1.87,1.83,.24,'graphite');box(sx,sy-1.055,z+.02,1.79,.025,.18,'edge')
        for i in range(6):
            box(sx-.73+i*.29,sy-1.078,z+.045,.24,.020,.115,'ink')
            box(sx-.73+i*.29,sy-1.092,z+.075,.15,.009,.025,'paper')
        for j in range(13):box(sx-.8+j*.13,sy+.45,z+.242,.038,.52,.009,'ink')
        box(sx+.80,sy-1.096,z+.10,.027,.012,.027,'green')
    # Application request path. Red is the one live transaction, not ambient decoration.
    request=[(-1.36,-.48,.81),(-1.36,.10,.81),(-1.38,.10,1.19),(-1.38,1.04,1.19),(.80,1.04,1.19),(1.85,1.04,1.19),(1.85,.78,.99),(3.53,.78,.99),(4.92,.78,.99),(4.92,3.7,.64),(3.35,3.7,.64)]
    line(request,'red',.023,'Application request')
    # Support/control dependency branches are graphite and are never in the request animation.
    line([(-4.1,2.93,.40),(-4.1,3.40,.40),(-1.04,3.40,.58),(-1.04,3.68,.58)],'trace',.016,'Release to runtime')
    line([(-4.1,.20,.40),(-4.1,-.30,.40),(-3.15,-.30,.81)],'trace',.016,'Runtime supports product')
    line([(-1.04,3.68,.58),(-1.04,2.85,.58),(-.30,2.85,1.19),(-.30,2.55,1.19)],'trace',.016,'Release to business runtime')
    # Finish static meshes once; hundreds of small details do not require hundreds of draw objects.
    for name,(vertices,faces) in groups.items():
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
        obj=bpy.data.objects.new(name+' surfaces',mesh);scene.collection.objects.link(obj);mesh.materials.append(mats[name])
        bevel=obj.modifiers.new('Precision radii','BEVEL');bevel.width=.014;bevel.segments=2
        bevel.affect='EDGES'
        norm=obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.062)
    packet=bpy.context.object;packet.name='One request and its response';packet.data.materials.append(mats['packet'])
    for p in packet.data.polygons:p.use_smooth=True
    path=[Vector(p) for p in request];lengths=[(b-a).length for a,b in zip(path,path[1:])];total=sum(lengths)
    def travel(t):
        distance=t*total
        for a,b,length in zip(path,path[1:],lengths):
            if distance<=length:return a+(b-a)*(distance/length)
            distance-=length
        return path[-1]
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.035));bpy.context.object.data.materials.append(mats['floor'])
    def light(name,xyz,power,size,color):
        d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
        o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=xyz;o.rotation_euler=(Vector((0,1,0))-o.location).to_track_quat('-Z','Y').to_euler()
    light('Soft daylight',(-3,-6,15),2400,10,(1,.94,.87))
    light('Cool edge',(5,9,12),1900,8,(.70,.83,1))
    light('Front fill',(1,-10,7),900,9,(.92,.96,1))
    camera=bpy.data.cameras.new('Quiet architecture camera');camera.type='ORTHO';camera.clip_end=200
    cam=bpy.data.objects.new('Quiet architecture camera',camera);scene.collection.objects.link(cam);scene.camera=cam
    dest=Path(args.output);dest.mkdir(parents=True,exist_ok=True);timings=[];projected_bounds=[]
    for frame in range(args.start,args.end+1):
        size,angle,lift=pose(frame);target=Vector((-.25,1.0,.65+lift))
        cam.location=target+Vector((22*math.cos(angle),22*math.sin(angle),24))
        cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camera.ortho_scale=size;camera.shift_x=-.14
        # A single round trip over 24 seconds, with a gentle arrival at each end.
        t=frame/(FRAMES-1);progress=smooth(2*t) if t<=.5 else 1-smooth((t-.5)*2)
        packet.location=travel(progress);bpy.context.view_layer.update()
        view=[world_to_camera_view(scene,cam,Vector(p)) for p in bounds]
        extent=[min(p.x for p in view),min(p.y for p in view),max(p.x for p in view),max(p.y for p in view)]
        assert extent[0]>.01 and extent[1]>.01 and extent[2]<.99 and extent[3]<.99,extent
        if frame in [args.start,args.end]:projected_bounds.append({'frame':frame,'bounds':extent})
        scene.render.filepath=str(dest/f'{frame:04d}.png');start=time.time();bpy.ops.render.render(write_still=True)
        elapsed=round(time.time()-start,2);timings.append({'frame':frame,'seconds':elapsed});print(json.dumps(timings[-1]),flush=True)
    (dest/'render-info.json').write_text(json.dumps({'scene':'software-system-v1','blender':bpy.app.version_string,'engine':'CYCLES','frames':FRAMES,'fps':FPS,'samples':args.samples,'resolution':[1920,1080],'start':args.start,'end':args.end,'camera':'continuous 24 second orbit and approach; matching endpoints','bounds':projected_bounds,'geometry':sum(len(f) for _,f in groups.values()),'timings':timings}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=FRAMES-1);p.add_argument('--samples',type=int,default=24);p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 0<=args.start<=args.end<FRAMES;assert 16<=args.samples<=64
    assert all(abs(a-b)<1e-9 for a,b in zip(pose(0),pose(FRAMES-1)))
    if args.validate_only:print(json.dumps({'valid':True,'frames':FRAMES,'fps':FPS,'duration':FRAMES/FPS}))
    else:render(args)
