"""A measured fire-detection installation and a purposeful continuous camera.
Render exclusively on the disposable CI runner. Plain Python validates the model.
The depicted layout explains a system; it is not a construction or coverage plan.
"""
import argparse, importlib.util, json, math, sys, time
from pathlib import Path
spec=importlib.util.spec_from_file_location('service_geometry',Path(__file__).with_name('render-service-cinema-v1.py'))
legacy=importlib.util.module_from_spec(spec);spec.loader.exec_module(legacy)
FPS,FRAMES=60,1440
smooth=legacy.smooth

def camera_pose(t):
    # Establish the place, understand one sensor, follow its cable, read the
    # panel's construction, then return to the installation. No disconnected cuts.
    keys=[(0,14.7,-66,(0,.15,1.1)),(.15,13.8,-61,(-.15,.40,1.3)),
          (.32,2.25,-72,(-2.05,.35,2.58)),(.44,4.6,-71,(-1.4,1.3,2.65)),
          (.62,2.85,-67,(2.67,2.16,1.67)),(.77,2.60,-64,(2.65,2.13,1.6)),
          (1,14.7,-66,(0,.15,1.1))]
    if t<=0 or t>=1:return keys[0][1],math.radians(keys[0][2]),keys[0][3]
    a,b=keys[0],keys[-1]
    for left,right in zip(keys,keys[1:]):
        if left[0]<=t<=right[0]:a,b=left,right;break
    k=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*k
    return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3]))

class Installation(legacy.Studio):
    def __init__(self):super().__init__('107')
    def screw(self,x,y,z,front=True):
        self.cylinder(x,y,z,.003,.002,'edge','y' if front else 'z')
        self.line([(x-.0018,y-.002,z),(x+.0018,y-.002,z)],'ink',.0005)
    def desk(self,x,y):
        self.box(x,y,.74,1.36,.72,.024,'wood')
        for dx in [-.59,.59]:
            for dy in [-.27,.27]:self.box(x+dx,y+dy,.07,.026,.026,.67,'edge')
        self.box(x,y+.19,.95,.53,.025,.32,'graphite');self.box(x,y+.175,.968,.497,.003,.283,'screen')
        self.box(x,y+.19,.765,.025,.025,.19,'edge');self.box(x,y+.13,.765,.20,.16,.009,'edge')
        self.text('OPERACION',x-.21,y+.171,1.18,.020,'muted',True)
        for i,label in enumerate(['Puesto 01','Red conectada','Servicio activo']):self.text(label,x-.21,y+.17,1.115-i*.05,.019,'paper',True)
        self.box(x-.1,y-.16,.769,.34,.12,.008,'graphite')
        for j in range(4):
            for k in range(13):self.box(x-.25+k*.025,y-.204+j*.026,.778,.019,.019,.002,'muted')
        self.cylinder(x+.17,y-.16,.77,.022,.012,'graphite')
        # Chair, five actual feet and separate lumbar/back shell.
        self.box(x,y-.86,.46,.46,.43,.05,'fabric');self.box(x,y-1.06,.51,.45,.045,.46,'fabric')
        self.cylinder(x,y-.86,.11,.022,.35,'edge')
        for j in range(5):
            a=j*math.tau/5;xx=x+.29*math.cos(a);yy=y-.86+.29*math.sin(a)
            self.line([(x,y-.86,.12),(xx,yy,.075)],'edge',.012);self.cylinder(xx,yy,.025,.025,.037,'graphite')
    def detector(self,x,y,label):
        # 140mm base: mounting plate, labyrinth, chamber and ventilated shell.
        self.parts.append('addressable-detector-'+label)
        self.cylinder(x,y,2.78,.071,.010,'paper');self.cylinder(x,y,2.746,.061,.034,'paper',top=.065)
        self.cylinder(x,y,2.738,.056,.008,'black')
        self.cylinder(x,y,2.719,.051,.019,'paper',top=.056)
        for j in range(32):
            a=j*math.tau/32
            self.line([(x+.060*math.cos(a),y+.060*math.sin(a),2.75),(x+.060*math.cos(a),y+.060*math.sin(a),2.767)],'ink',.0013)
        for dx in [-.037,.037]:self.screw(x+dx,y,2.791,False)
        self.cylinder(x+.034,y-.033,2.738,.004,.003,'red')
        self.box(x,y+.10,2.775,.16,.034,.005,'paper');self.text(label,x-.065,y+.098,2.783,.017,'ink')
    def central(self,x,y,z):
        self.parts.append('addressable-central')
        w,h=.64,.91
        # Folded metal enclosure, seals, PCB, terminal rails and mains section.
        self.box(x,y+.058,z,w,.024,h,'paper')
        for dx in [-w/2,w/2]:self.box(x+dx,y,z,.018,.15,h,'paper')
        for zz in [z,z+h-.015]:self.box(x,y,zz,w,.15,.015,'paper')
        self.box(x,y+.035,z+.33,.50,.012,.46,'pcb')
        self.box(x-.04,y+.015,z+.50,.12,.014,.12,'ink')
        for k in range(20):
            xx=x-.24+k*.025
            self.box(xx,y+.012,z+.735,.018,.035,.035,'terminal')
            self.screw(xx,y-.008,z+.751)
            self.line([(xx,y+.017,z+.728),(xx,y+.017,z+.685),(x+(k-10)*.006,y+.017,z+.61)],'copper',.001)
        for k in range(8):
            xx=x-.235+k*.063
            self.box(xx,y+.015,z+.36,.044,.03,.048,'terminal');self.screw(xx,y-.002,z+.387)
        for xx in [-.22,.22]:
            for zz in [.35,.77]:self.screw(x+xx,y+.022,z+zz)
        for j in range(5):self.cylinder(x+.18,y+.014,z+.43+j*.055,.012,.021,'graphite','y')
        for xx in [x-.133,x+.133]:
            self.box(xx,y-.006,z+.045,.228,.10,.205,'graphite')
            self.box(xx,y-.006,z+.25,.225,.10,.009,'edge')
            for dx in [-.068,.068]:self.box(xx+dx,y-.006,z+.26,.019,.019,.012,'red' if dx<0 else 'black')
            self.text('12 V / RESERVA',xx-.098,y-.060,z+.17,.019,'paper',True)
        self.line([(x-.20,y-.006,z+.272),(x-.25,y-.006,z+.31),(x-.20,y-.003,z+.36)],'red',.003)
        self.line([(x+.20,y-.006,z+.272),(x+.25,y-.006,z+.31),(x+.20,y-.003,z+.36)],'black',.003)
        self.line([(x-.065,y-.006,z+.272),(x+.065,y-.006,z+.272)],'copper',.003)
        name='central-door';self.doors.append(dict(name=name,pivot=(x-w/2,y-.088,z)))
        self.box(w/2,0,0,w,.014,h,'paper',name)
        self.box(w/2,-.010,.47,.48,.005,.30,'graphite',name)
        self.box(w/2,-.017,.56,.37,.003,.14,'screen',name)
        for j in range(4):self.box(.17+j*.095,-.019,.50,.048,.003,.014,'muted',name)
        for xx in [.20,.26,.32,.38,.44]:self.box(xx,-.011,.35,.035,.008,.035,'graphite',name)
        # Labels live on the fixed enclosure rather than floating during opening.
        self.text('CENTRAL / ZONAS 01–02',x-.26,y-.10,z+h+.022,.028,'paper',True)
        for dy in [-.063,.063]:
            for dz in [.02,h-.02]:self.screw(x+dy*4.3,y-.083,z+dz)

def build():
    s=Installation()
    # 8.0 x 5.4 m representative workplace, on a thin architectural section.
    s.box(0,0,0,8,5.4,.09,'concrete')
    s.box(0,0,.09,7.98,5.38,.016,'flooring')
    for x in range(-7,8):s.line([(x*.5,-2.69,.107),(x*.5,2.69,.107)],'joint',.001)
    for y in range(-5,6):s.line([(-3.99,y*.5,.107),(3.99,y*.5,.107)],'joint',.001)
    # Rear facade: real window reveals, slender frames, sill and wall thickness.
    s.box(0,2.64,.107,8,.12,.82,'paper');s.box(0,2.64,2.56,8,.12,.24,'paper')
    for x in [-3.95,-.6,1.76,3.95]:s.box(x,2.64,.927,.10,.12,1.633,'paper')
    for a,b in [(-3.90,-.65),(-.55,1.71),(1.81,3.90)]:
        mid=(a+b)/2
        for x in [a,b,mid]:s.box(x,2.615,.95,.023,.03,1.59,'edge')
        for z in [.947,1.72,2.54]:s.box(mid,2.615,z,b-a,.03,.022,'edge')
        s.box(mid,2.62,.905,b-a+.05,.23,.022,'paper')
        s.box(mid,2.665,.97,b-a-.025,.008,1.55,'glass')
    # Partition has a doorway. Low cut edge exposes the occupation of the room.
    for y,d in [(-1.6,1.9),(1.74,1.78)]:s.box(.75,y,.107,.12,d,1.14,'paper')
    for y in [-.64,.82]:s.box(.75,y,.107,.13,.035,2.16,'edge')
    s.box(.75,.09,2.267,.13,1.5,.035,'edge')
    for x in [-3.95,3.95]:s.box(x,0,.107,.10,5.3,.32,'paper')
    # Workstations and a meeting area; each object uses metre-scale dimensions.
    s.desk(-2.65,1.65);s.desk(-1.05,1.65)
    s.box(2.33,-.60,.74,1.65,.86,.026,'wood')
    for x in [1.64,3.02]:
        for y in [-.90,-.31]:s.box(x,y,.107,.034,.034,.633,'edge')
    for x in [1.91,2.76]:
        for y in [-1.22,.04]:
            s.box(x,y,.47,.43,.41,.045,'fabric');s.box(x,y+(.20 if y>-.6 else -.2),.515,.43,.035,.40,'fabric')
            for dx in [-.17,.17]:
                for dy in [-.16,.16]:s.box(x+dx,y+dy,.107,.022,.022,.363,'edge')
    # A narrow ceiling slice locates the detector; the rest is a deliberate cutaway.
    for x in [-2.05,2.18]:
        s.box(x-.355,.35,2.798,.35,.52,.013,'paper');s.box(x+.355,.35,2.798,.35,.52,.013,'paper')
        for xx in [x-.54,x+.54]:s.box(xx,.35,2.80,.013,.58,.025,'edge')
        s.detector(x,.35,'D-01' if x<0 else 'D-02')
    # Continuously supported conduit and junctions; the detector links return.
    loop=[(2.68,2.18,2.13),(2.68,2.18,2.80),(2.68,2.40,2.80),(-2.05,2.40,2.80),(-2.05,.35,2.80),(2.18,.35,2.80),(2.18,2.30,2.80),(2.76,2.30,2.80),(2.76,2.18,2.13)]
    s.line(loop,'red',.006)
    s.routes.append(dict(pts=loop[4:]+loop[:5],start=.20,end=.69))
    for x in [-2.05,-.75,.75,2.18,2.68]:
        s.box(x,2.40,2.79,.026,.044,.020,'edge')
        s.line([(x,2.40,2.82),(x,2.40,2.93)],'edge',.002)
    for x in [-2.05,2.18]:
        s.box(x,.47,2.784,.055,.055,.033,'paper');s.screw(x,.47,2.82,False)
    s.central(2.68,2.18,1.22)
    # Manual call point and separate sounder are mounted beside the exit.
    s.box(3.65,-1.7,.107,.085,.085,2.15,'paper')
    s.box(3.65,-1.754,1.20,.09,.036,.09,'red');s.box(3.65,-1.775,1.225,.065,.003,.038,'paper')
    s.box(3.65,-1.754,2.03,.11,.04,.12,'red')
    for j in range(8):s.box(3.65,-1.778,2.05+j*.01,.073,.004,.003,'black')
    s.cylinder(3.65,-1.75,2.15,.037,.035,'paper')
    s.route([(2.98,2.18,1.65),(3.65,2.18,1.65),(3.65,2.18,2.70),(3.65,-1.7,2.70),(3.65,-1.7,2.09)],.69,.94)
    s.parts.extend(['two-zones','mounted-conduit','occupied-workplace','standby-supply','manual-call-point','notification'])
    return s

def validate(s):
    assert {'addressable-central','mounted-conduit','occupied-workplace','notification'}<=set(s.parts)
    assert camera_pose(0)==camera_pose(1)
    for b in s.boxes:assert min(b[k] for k in ['w','d','h'])>0
    for route in s.routes:assert all(math.dist(a,b)>0 for a,b in zip(route['pts'],route['pts'][1:]))
    return dict(service='107',scene='fire-project-v2',boxes=len(s.boxes),parts=s.parts,frames=FRAMES,fps=FPS,duration=24)


def render(args,s):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.render.engine={'cycles':'CYCLES','workbench':'BLENDER_WORKBENCH'}[args.engine]
    if args.engine=='workbench':
        scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.render_aa='16'
        scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH'
        scene.display.shading.curvature_ridge_factor=1.1;scene.display.shading.curvature_valley_factor=.7
        scene.display.shading.show_object_outline=False
    scene.cycles.device='CPU';scene.cycles.samples=args.samples;scene.cycles.use_denoising=True
    scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.012;scene.cycles.adaptive_min_samples=12;scene.cycles.max_bounces=4
    scene.eevee.taa_render_samples=args.samples;scene.eevee.use_raytracing=False
    scene.eevee.shadow_ray_count=3;scene.eevee.shadow_step_count=8
    scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width*9/16);scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
    scene.render.fps=FPS;scene.render.use_persistent_data=True;scene.view_settings.view_transform='AgX'
    scene.world=bpy.data.worlds.new('UM graphite atelier');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.045,.055,.070,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.32
    palette=[('floor','#090A0C',.08,.5),('base','#121A26',.35,.4),('slate','#344252',.28,.45),
             ('graphite','#282B30',.42,.32),('edge','#949A9D',.65,.3),('metal','#71879A',.55,.31),
             ('paper','#E8E8E2',.08,.39),('ink','#16191C',.15,.43),('black','#070C13',.1,.45),
             ('muted','#8A9EB0',.2,.4),('red','#DC2626',.25,.3),('blue','#577F9D',.3,.4),
             ('trace','#4C6175',.5,.32),('screen','#122A36',.22,.3),('signal','#9FCCC2',.2,.3),
             ('copper','#C99A64',.65,.34),('lens','#256487',.65,.14),('packet','#FF5645',.25,.25)]
    palette += [('wood','#A89981',.0,.58),('fabric','#515860',.0,.9),('concrete','#858889',.0,.7),('flooring','#C2C3BE',.0,.7),('joint','#9D9F9A',.0,.7),('glass','#A8B5B8',.05,.30),('pcb','#31554A',.0,.5),('terminal','#72836A',.0,.55)]
    mats={}
    for name,color,metal,rough in palette:
        m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF']
        rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];rgb=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb]
        m.diffuse_color=(*rgb,1);p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
        if name in ('signal','packet'):
            p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=1.5 if name=='packet' else .28
        mats[name]=m
    groups={};bounds=[];parents={}
    for door in s.doors:
        obj=bpy.data.objects.new(door['name'],None);scene.collection.objects.link(obj);obj.location=door['pivot'];parents[door['name']]=obj
    def meshpart(mat,group,vertices,faces):
        vv,ff=groups.setdefault((mat,group),([],[]));offset=len(vv);vv.extend(vertices)
        ff.extend(tuple(offset+i for i in face) for face in faces)
        if not group:bounds.extend(vertices)
    for b in s.boxes:
        x,y,z=b['x']-b['w']/2,b['y']-b['d']/2,b['z'];w,d,h=b['w'],b['d'],b['h']
        meshpart(b['mat'],b['group'],[(x,y,z),(x+w,y,z),(x+w,y+d,z),(x,y+d,z),(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],
                 [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    for c in s.cylinders:
        vv=[];n=48
        for depth,r in [(0,c['r']),(c['h'],c['top'])]:
            for j in range(n):
                a=j*math.tau/n;u,v=r*math.cos(a),r*math.sin(a)
                xyz=(c['x']+u,c['y']+v,c['z']+depth) if c['axis']=='z' else (c['x']+u,c['y']-depth,c['z']+v) if c['axis']=='y' else (c['x']+depth,c['y']+u,c['z']+v)
                vv.append(xyz)
        ff=[tuple(reversed(range(n))),tuple(n+j for j in range(n))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
        meshpart(c['mat'],None,vv,ff)
    for (mat,group),(vv,ff) in groups.items():
        mesh=bpy.data.meshes.new(mat);mesh.from_pydata(vv,[],ff);mesh.update()
        obj=bpy.data.objects.new(mat+' '+(group or 'equipment'),mesh);scene.collection.objects.link(obj);mesh.materials.append(mats[mat])
        if group:obj.parent=parents[group]
        bevel=obj.modifiers.new('Manufactured edges','BEVEL');bevel.width=.0008;bevel.segments=3
        obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    linegroups={}
    for line in s.lines:linegroups.setdefault((line['mat'],line['radius']),[]).append(line['pts'])
    for (mat,radius),paths in linegroups.items():
        curve=bpy.data.curves.new(mat+' conductors','CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=2
        for pts in paths:
            sp=curve.splines.new('POLY');sp.points.add(len(pts)-1)
            for p,xyz in zip(sp.points,pts):p.co=(*xyz,1)
            bounds.extend(pts)
        obj=bpy.data.objects.new(mat+' conductors',curve);scene.collection.objects.link(obj);curve.materials.append(mats[mat])
    for label in s.texts:
        c=bpy.data.curves.new(label['value'],'FONT');c.body=label['value'];c.size=label['size'];c.extrude=.0005
        obj=bpy.data.objects.new(label['value'],c);scene.collection.objects.link(obj);obj.location=label['at']
        if label['front']:obj.rotation_euler[0]=math.pi/2
        c.materials.append(mats[label['mat']])
    packets=[]
    for r in s.routes:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.018)
        obj=bpy.context.object;obj.data.materials.append(mats['packet']);packets.append((obj,r))
        for p in obj.data.polygons:p.use_smooth=True
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.05));bpy.context.object.data.materials.append(mats['floor'])
    def area(name,at,power,size,color):
        d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
        obj=bpy.data.objects.new(name,d);scene.collection.objects.link(obj);obj.location=at
        obj.rotation_euler=(Vector((0,1.2,1.0))-obj.location).to_track_quat('-Z','Y').to_euler()
    area('Warm key',(-4,-7,14),2100,11,(1,.97,.93));area('Cool rim',(4,9,11),1700,9,(.91,.95,1));area('Front fill',(7,-7,7),900,8,(1,1,1))
    camera=bpy.data.cameras.new('Continuous service camera');camera.type='ORTHO';camera.clip_end=200
    cam=bpy.data.objects.new('Continuous service camera',camera);scene.collection.objects.link(cam);scene.camera=cam
    def travel(r,t):
        lengths=[math.dist(a,b) for a,b in zip(r['pts'],r['pts'][1:])];dist=t*sum(lengths)
        for a,b,length in zip(r['pts'],r['pts'][1:],lengths):
            if dist<=length:return Vector(a).lerp(Vector(b),dist/length)
            dist-=length
        return Vector(r['pts'][-1])
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[];extents=[]
    frames=[int(x) for x in args.proof_frames.split(',')] if args.proof_frames else range(args.start,args.end+1)
    for frame in frames:
        t=frame/(FRAMES-1);size,angle,target=camera_pose(t);target=Vector(target)
        cam.location=target+Vector((24*math.cos(angle),24*math.sin(angle),22));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
        camera.ortho_scale=size;camera.shift_x=0;camera.shift_y=0
        for obj,r in packets:
            visible=r['start']<=t<=r['end'];obj.hide_render=not visible
            q=(t-r['start'])/(r['end']-r['start'])
            obj.location=travel(r,smooth(q))
            fade=max(.001,min(smooth(q/.08),smooth((1-q)/.08)))
            obj.scale=(fade,fade,fade)
        for obj in parents.values():obj.rotation_euler[2]=-math.radians(102)*smooth((t-.52)/.10)*(1-smooth((t-.79)/.13))
        bpy.context.view_layer.update()
        allbounds=list(bounds)
        for (mat,group),(vv,_) in groups.items():
            if group:allbounds.extend(tuple(parents[group].matrix_world@Vector(p)) for p in vv)
        projected=[world_to_camera_view(scene,cam,Vector(p)) for p in allbounds]
        extent=[min(p.x for p in projected),min(p.y for p in projected),max(p.x for p in projected),max(p.y for p in projected)]
        # Leftmost 400px are encoded breathing room; mobile preserves every object.
        if frame in (0,FRAMES-1):assert extent[0]>.015 and extent[1]>.015 and extent[2]<.985 and extent[3]<.985,(s.code,frame,extent)
        scene.render.filepath=str(out/f'{frame:04d}.png');start=time.time();bpy.ops.render.render(write_still=True)
        record={'frame':frame,'seconds':round(time.time()-start,2)};timings.append(record)
        extents.append({'frame':frame,'bounds':extent});print(json.dumps(record),flush=True)
    info={**validate(s),'blender':bpy.app.version_string,'engine':scene.render.engine,'samples':args.samples,
          'resolution':[args.width,round(args.width*9/16)],'camera':'workplace to detector to supervised circuit to central; continuous 24 second loop',
          'bounds':extents,'timings':timings}
    (out/'render-info.json').write_text(json.dumps(info))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
    p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','workbench'],default='cycles')
    p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--proof-frames');p.add_argument('--validate-only',action='store_true')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 0<=args.start<=args.end<FRAMES and 16<=args.samples<=128 and args.width in [1920,3840]
    s=build();info=validate(s)
    if args.validate_only:print(json.dumps(info))
    else:render(args,s)
