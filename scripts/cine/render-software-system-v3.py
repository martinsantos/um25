"""Product interface unfolding into software architecture. Remote Blender only."""
import argparse,json,math,sys,time
from pathlib import Path
FPS=60
FRAMES=1440

def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)

def reveal(t):
    if t<=0 or t>=1:return 0
    return ease((t-.28)/.20)*(1-ease((t-.80)/.20))

def placement(group,t):
    e=reveal(t)
    # Interface first; four physical paper-thin planes only separate when their
    # role in the transaction is introduced. The original UI remains the anchor.
    positions={
      'shell':(-1.7*e,2.4*e,2.55+1.35*e),
      'navigation':(-1.7*e,2.4*e,2.58+1.35*e),
      'heading':(-1.7*e,2.4*e,2.58+1.35*e),
      'metrics':(-1.7*e,2.4*e,2.58+1.35*e),
      'records':(-1.7*e,2.4*e,2.58+1.35*e),
      'detail':(-1.7*e,2.4*e,2.59+1.48*e),
      'logic':(-3.9*e,-1.8*e,1.55+.08*e),
      'data':(3.4*e,-1.55*e,.62+.74*e),
      'runtime':(4.1*e,3.8*e,.08+.16*e),
    }
    return positions[group]

def camera_pose(t):
    # Independently composed shots joined with zero-velocity quintic curves.
    # A deliberate close crop in shot two reveals the interface's actual detail.
    keys=[
      (0.00,13.4,-87,(.1,0,2.65),0),
      (0.14,12.5,-83,(.35,0,2.65),0),
      (0.26,9.8,-78,(1.8,-.25,2.75),0),
      (0.51,22.0,-66,(.1,.8,2.5),0),
      (0.69,20.8,-63,(.5,.6,2.35),0),
      (0.80,17.4,-68,(1.5,-.3,2.1),0),
      (1.00,13.4,-87,(.1,0,2.65),0),
    ]
    a,b=keys[0],keys[-1]
    for left,right in zip(keys,keys[1:]):
        if left[0]<=t<=right[0]:a,b=left,right;break
    k=ease((t-a[0])/(b[0]-a[0]))
    blend=lambda x,y:x+(y-x)*k
    return (blend(a[1],b[1]),math.radians(blend(a[2],b[2])),tuple(blend(x,y) for x,y in zip(a[3],b[3])),0)

def scale(group,t):
    return 1-(.32 if group in ['logic','data','runtime'] else .05)*reveal(t)

class Product:
    def __init__(self):self.boxes=[];self.texts=[];self.lines=[];self.points={}
    def box(self,g,x,y,z,w,d,h,m='panel'):
        self.boxes.append((g,x,y,z,w,d,h,m))
        self.points.setdefault(g,[]).extend((x+i*w/2,y+j*d/2,z+k*h) for i in [-1,1] for j in [-1,1] for k in [0,1])
    def text(self,g,s,x,y,z,size=.17,m='muted',bold=False):
        self.texts.append((g,s,x,y,z,size,m,bold))
        self.points.setdefault(g,[]).extend([(x,y,z),(x+len(s)*size*.62,y+size,z)])
    def line(self,g,pts,m='trace',radius=.008):
        self.lines.append((g,pts,m,radius));self.points.setdefault(g,[]).extend(pts)
    def panel(self,g,x,y,w,d,m='panel',bottom=0):
        self.box(g,x,y,bottom,w,d,.018,'edge');self.box(g,x,y,bottom+.018,w-.014,d-.014,.006,m)

def build():
    p=Product()
    p.panel('shell',0,0,10.7,6.25,'shell')
    p.text('shell','ULTIMA MILLA   /   PRODUCTO DIGITAL',-5.05,2.82,.1,.14,'muted',True)
    p.text('shell','DATOS DE EJEMPLO',3.52,2.82,.1,.12)
    # A functioning operations interface, designed as independently authored components.
    p.panel('navigation',-4.43,-.13,1.38,5.45,'nav')
    p.text('navigation','UM',-4.94,2.18,.1,.33,'white',True)
    p.text('navigation','OPERACIONES',-4.96,1.76,.1,.115,'muted',True)
    for i,s in enumerate(['Resumen','Solicitudes','Proyectos','Equipos','Actividad']):
        y=1.18-i*.61
        if i==1:p.box('navigation',-4.43,y+.03,.096,1.19,.43,.012,'selection')
        p.box('navigation',-4.89,y+.07,.117,.09,.09,.008,'red' if i==1 else 'muted')
        p.text('navigation',s,-4.68,y,.118,.132,'white' if i==1 else 'muted')
    p.line('navigation',[(-4.98,-2.02,.1),(-3.88,-2.02,.1)])
    p.text('navigation','Tu equipo conectado',-4.96,-2.34,.1,.105)
    p.panel('heading',.7,2.03,8.5,1.07,'paper')
    p.text('heading','Una operación. Todo conectado.',-3.3,2.13,.108,.35,'white',True)
    p.text('heading','Solicitudes, responsables y resultados en un mismo lugar.',-3.3,1.77,.108,.157)
    for i,(number,label) in enumerate([('24','Solicitudes activas'),('08','En ejecución'),('16','Resueltas')]):
        x=-2.19+i*2.88;p.panel('metrics',x,.86,2.70,.94,'paper')
        p.text('metrics',number,x-1.16,.84,.11,.40,'white',True)
        p.text('metrics',label,x-.42,.9,.11,.142)
        for j in range(9):p.box('metrics',x+.85+j*.038,.6,.108,.022,.04+(j%4)*.027,.015,'red' if i==1 else 'muted')
    p.panel('records',-.78,-1.11,5.70,2.91,'paper')
    p.text('records','Solicitudes del equipo',-3.38,.05,.108,.23,'white',True)
    columns=[(-3.36,'SOLICITUD'),(-1.57,'RESPONSABLE'),(.11,'ESTADO')]
    for x,s in columns:p.text('records',s,x,-.4,.11,.105,'muted',True)
    rows=[('0248  /  Nueva sede','Equipo de redes','En revisión'),('0247  /  Portal interno','Equipo de producto','En ejecución'),('0246  /  Integración ERP','Equipo de datos','Resuelta'),('0245  /  Alta de activos','Operaciones','Resuelta')]
    for i,row in enumerate(rows):
        y=-.85-i*.47
        if i==0:p.box('records',-.78,y+.047,.10,5.34,.40,.013,'selection');p.box('records',-3.47,y+.047,.12,.024,.40,.009,'red')
        for (x,_),s in zip(columns,row):p.text('records',s,x,y,.137,.125,'white' if i==0 else 'muted')
        if i<3:p.line('records',[(-3.38,y-.17,.104),(1.82,y-.17,.104)],radius=.005)
    p.panel('detail',3.6,-1.11,2.59,2.91,'paper')
    p.text('detail','SOLICITUD / 0248',2.48,.07,.107,.12,'ink',True)
    p.text('detail','Conectar una nueva sede',2.48,-.27,.107,.17,'ink',True)
    p.text('detail','Alcance definido',2.48,-.65,.107,.15,'ink')
    p.text('detail','Responsable asignado',2.48,-.96,.107,.15,'ink')
    p.text('detail','Trazabilidad completa',2.48,-1.27,.107,.15,'ink')
    p.box('detail',3.58,-1.78,.11,2.13,.41,.018,'red')
    p.text('detail','Actualizar solicitud',2.67,-1.84,.135,.14,'white',True)
    p.text('detail','Cada acción deja evidencia.',2.49,-2.29,.11,.12,'ink')
    # Navigation glyphs, row actions and datum lines survive the close camera.
    for i in range(5):
        x=-4.89;y=1.25-i*.61
        shapes=[[(x-.045,y-.04,.12),(x+.045,y-.04,.12),(x+.045,y+.04,.12),(x-.045,y+.04,.12),(x-.045,y-.04,.12)],
                [(x-.055,y-.04,.12),(x+.035,y-.04,.12),(x+.035,y+.04,.12),(x-.015,y+.065,.12),(x-.055,y+.025,.12),(x-.055,y-.04,.12)]]
        p.line('navigation',shapes[i%2],'white' if i==1 else 'muted',.003)
    for i in range(4):
        y=-.81-i*.47
        for j in range(3):p.line('records',[(1.58+j*.055,y,.13),(1.584+j*.055,y,.13)],'ink',.012)
    for x,y in [(-5.19,3.12),(5.19,3.12),(-5.19,-3.12),(5.19,-3.12)]:
        p.line('shell',[(x-.13,y,.12),(x+.13,y,.12)],'muted',.004)
        p.line('shell',[(x,y-.13,.12),(x,y+.13,.12)],'muted',.004)
    # Behind that interface: rules, contracts and persistent state. Thin, precise surfaces.
    p.panel('logic',0,0,9.8,5.35,'nav',bottom=-.12)
    p.text('logic','02 / REGLAS E INTEGRACIONES',-4.5,2.21,.108,.20,'white',True)
    for i,(title,body) in enumerate([('VALIDAR','Alcance y campos'),('AUTORIZAR','Roles y permisos'),('INTEGRAR','Contrato de API')]):
        x=-3.12+i*3.1;p.panel('logic',x,.48,2.7,1.6,'panel')
        p.text('logic',title,x-1.13,.89,.11,.18,'white',True)
        p.text('logic',body,x-1.13,.46,.11,.14)
        p.text('logic','Solicitud 0248',x-1.13,.02,.11,.13,'muted')
    p.line('logic',[(-3.12,-.4,.12),(-3.12,-1.18,.12),(3.08,-1.18,.12),(3.08,-.4,.12)],'red',.013)
    p.text('logic','Una acción con reglas, permisos y respuesta.',-4.48,-2.03,.11,.18,'white')
    p.panel('data',0,0,9.0,4.8,'paper',bottom=-.12)
    p.text('data','03 / DATOS Y TRAZABILIDAD',-4.16,1.98,.106,.20,'ink',True)
    for i,(label,fields) in enumerate([('SOLICITUDES',['id / 0248','estado / validada','version / 03']),('PERSONAS Y ROLES',['equipo / redes','permiso / actualizar','origen / producto']),('REGISTRO DE CAMBIOS',['acción / actualización','resultado / confirmado','integridad / verificada'])]):
        x=-2.88+i*2.87;p.panel('data',x,-.10,2.58,2.77,'white')
        p.text('data',label,x-1.10,.86,.108,.126,'ink',True)
        for j,s in enumerate(fields):p.text('data',s,x-1.10,.32-j*.45,.108,.13,'ink')
    p.panel('runtime',0,0,8.3,4.3,'nav',bottom=-.12)
    p.text('runtime','04 / DESPLIEGUE E INFRAESTRUCTURA',-3.78,1.75,.107,.18,'white',True)
    for i,s in enumerate(['VERIFICAR','VERSIONAR','DESPLEGAR','OBSERVAR']):
        x=-2.9+i*1.92;p.panel('runtime',x,-.06,1.66,1.6)
        p.text('runtime',s,x-.7,.30,.11,.145,'white',True)
        for j in range(3):p.box('runtime',x,-.1-j*.14,.11,1.3,.025,.009,'muted')
    p.text('runtime','La infraestructura sostiene la experiencia.',-3.78,-1.60,.11,.18,'white')
    return p

def projected(p,t):
    size,angle,target,shift=camera_pose(t);sn=28/math.hypot(28,22);cs=22/math.hypot(28,22)
    xs=[];ys=[]
    for group,points in p.points.items():
        dx,dy,dz=placement(group,t)
        for x,y,z in points:
            s=scale(group,t);x=x*s+dx-target[0];y=y*s+dy-target[1];z=z*s+dz-target[2]
            xs.append(.5+shift+(-math.sin(angle)*x+math.cos(angle)*y)/size)
            ys.append(.5+(-math.cos(angle)*sn*x-math.sin(angle)*sn*y+cs*z)*16/9/size)
    return [min(xs),min(ys),max(xs),max(ys)]

def validate():
    p=build();bounds=[projected(p,i/(FRAMES-1)) for i in range(FRAMES)]
    extent=[min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)]
    assert all(math.isfinite(v) for v in extent),extent
    assert placement('detail',0)==placement('detail',1)
    print(json.dumps({'scene':'software-system-v3','frames':FRAMES,'bounds':extent,'components':len(p.boxes),'labels':len(p.texts)}))

def render(args):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=args.samples
    scene.cycles.use_denoising=True;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.008
    scene.cycles.max_bounces=4;scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width*9/16);scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.fps=FPS
    scene.render.use_persistent_data=True;scene.view_settings.view_transform='AgX'
    scene.world=bpy.data.worlds.new('Product studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.04,.05,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
    palette={'shell':'#E7E6E2','nav':'#15191F','panel':'#20252C','edge':'#9B9C9F','paper':'#F4F3EF','white':'#FFFFFF','ink':'#1A1B1E','muted':'#A0ABB5','selection':'#382326','softselection':'#E9E5E2','red':'#DC2626','trace':'#566470','floor':'#090A0C'}
    mats={}
    for name,hexvalue in palette.items():
        rgb=[int(hexvalue[i:i+2],16)/255 for i in [1,3,5]];rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        mat=bpy.data.materials.new(name);mat.use_nodes=True;n=mat.node_tree.nodes['Principled BSDF']
        n.inputs['Base Color'].default_value=(*rgb,1);n.inputs['Roughness'].default_value=.72;n.inputs['Metallic'].default_value=0
        if name in ['white','muted','red']:n.inputs['Emission Color'].default_value=(*rgb,1);n.inputs['Emission Strength'].default_value=.08
        mats[name]=mat
    root=Path(__file__).resolve().parents[2]
    font_dir=Path(args.font_dir) if args.font_dir else root/'public/fonts/um-sans'
    fonts={False:bpy.data.fonts.load(str(font_dir/'UMSans-Regular.ttf')),True:bpy.data.fonts.load(str(font_dir/'UMSans-SemiBold.ttf'))}
    p=build();parents={}
    light_groups={'heading','metrics','records','detail','shell','data'}
    p.texts=[(g,s,x,y,.037,size,('ink' if m in {'white','muted'} else m) if g in light_groups and s!='Actualizar solicitud' else m,bold) for g,s,x,y,z,size,m,bold in p.texts]
    p.lines=[(g,[(x,y,.032) for x,y,z in pts],m,r) for g,pts,m,r in p.lines]
    p.boxes=[(g,x,y,.027 if z>.08 else z,w,d,min(h,.004) if z>.08 else h,'softselection' if m=='selection' and g in light_groups else m) for g,x,y,z,w,d,h,m in p.boxes]
    for name in p.points:
        obj=bpy.data.objects.new(name,None);scene.collection.objects.link(obj);parents[name]=obj
    meshes={}
    for g,x,y,z,w,d,h,m in p.boxes:
        vv,ff=meshes.setdefault((g,m),([],[]));o=len(vv)
        vv.extend([(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y+d/2,z),(x-w/2,y+d/2,z),(x-w/2,y-d/2,z+h),(x+w/2,y-d/2,z+h),(x+w/2,y+d/2,z+h),(x-w/2,y+d/2,z+h)])
        ff.extend(tuple(o+i for i in face) for face in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    for (g,m),(vv,ff) in meshes.items():
        mesh=bpy.data.meshes.new(g+' '+m);mesh.from_pydata(vv,[],ff);mesh.update()
        obj=bpy.data.objects.new(g+' '+m,mesh);scene.collection.objects.link(obj);obj.parent=parents[g];mesh.materials.append(mats[m])
        bevel=obj.modifiers.new('Precision corners','BEVEL');bevel.width=.003;bevel.segments=4
        obj.modifiers.new('Surface normals','WEIGHTED_NORMAL')
    labels={}
    for g,s,x,y,z,size,m,bold in p.texts:
        text=bpy.data.curves.new(s,'FONT');text.body=s;text.size=size;text.font=fonts[bold];text.extrude=0
        obj=bpy.data.objects.new(s,text);scene.collection.objects.link(obj);obj.parent=parents[g];obj.location=(x,y,z);text.materials.append(mats[m]);labels[s]=text
    def curve(name,pts,mat,radius):
        data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=2
        spline=data.splines.new('POLY');spline.points.add(len(pts)-1)
        for v,xyz in zip(spline.points,pts):v.co=(*xyz,1)
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);data.materials.append(mats[mat]);return obj,spline
    for g,pts,m,radius in p.lines:obj,_=curve('Interface connector',pts,m,radius);obj.parent=parents[g]
    flow,flowpath=curve('One request through the system',[(0,0,0)]*4,'red',.023)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.027);packet=bpy.context.object;packet.data.materials.append(mats['white'])
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.16));bpy.context.object.data.materials.append(mats['floor'])
    for name,xyz,energy,size,color in [('Key',(-4,1,15),1300,12,(1,1,1)),('Edge',(5,9,8),650,10,(1,1,1)),('Fill',(0,-10,12),750,12,(1,1,1))]:
        data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=xyz;obj.rotation_euler=(Vector((0,0,2))-obj.location).to_track_quat('-Z','Y').to_euler()
    camera=bpy.data.cameras.new('Interface into architecture');camera.type='ORTHO';camera.clip_end=200
    cam=bpy.data.objects.new('Interface into architecture',camera);scene.collection.objects.link(cam);scene.camera=cam
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[];bounds=[]
    for frame in range(args.start,args.end+1):
        t=frame/(FRAMES-1);size,angle,target,shift=camera_pose(t);target=Vector(target)
        cam.location=target+Vector((22*math.cos(angle),22*math.sin(angle),28));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camera.ortho_scale=size;camera.shift_x=-shift
        for name,obj in parents.items():obj.location=placement(name,t);obj.scale=(scale(name,t),)*3
        points=[Vector(placement(g,t))+Vector(local)*scale(g,t) for g,local in [('detail',(3.55,-1.8,.15)),('logic',(3.05,-1.18,.15)),('data',(2.87,0,.13)),('runtime',(2.85,0,.13))]]
        for v,point in zip(flowpath.points,points):v.co=(*point,1)
        strength=ease(reveal(t)*3);flow.hide_render=strength<.001;packet.hide_render=strength<.001
        flow.data.bevel_depth=.010*max(.001,strength);packet.scale=(strength,)*3
        progress=ease((t-.28)/.32) if t<.61 else 1-ease((t-.61)/.22);q=progress*3;i=min(2,int(q));packet.location=points[i].lerp(points[i+1],q-i)
        confirmed=.79<t<.945
        labels['Actualizar solicitud'].body='Cambios guardados' if confirmed else 'Actualizar solicitud'
        labels['En revisión'].body='Confirmada' if confirmed else 'En revisión'
        bpy.context.view_layer.update()
        projected_points=[world_to_camera_view(scene,cam,Vector(point)*scale(g,t)+parents[g].location) for g,coords in p.points.items() for point in coords]
        extent=[min(v.x for v in projected_points),min(v.y for v in projected_points),max(v.x for v in projected_points),max(v.y for v in projected_points)]
        assert all(math.isfinite(v) for v in extent),(frame,extent)
        scene.render.filepath=str(out/f'{frame:04d}.png');start=time.time();bpy.ops.render.render(write_still=True)
        timings.append({'frame':frame,'seconds':round(time.time()-start,2)});bounds.append({'frame':frame,'bounds':extent});print(json.dumps(timings[-1]),flush=True)
    (out/'render-info.json').write_text(json.dumps({'service':'104','scene':'software-system-v3','blender':bpy.app.version_string,'engine':'CYCLES','samples':args.samples,'frames':FRAMES,'fps':FPS,'resolution':[scene.render.resolution_x,scene.render.resolution_y],'camera':'recognizable product interface unfolds into rules, data and runtime; continuous 24 second loop','timings':timings,'bounds':bounds}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int,default=FRAMES-1);parser.add_argument('--samples',type=int,default=48);parser.add_argument('--width',type=int,default=1920);parser.add_argument('--output',default='frames');parser.add_argument('--validate-only',action='store_true');parser.add_argument('--font-dir')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 0<=args.start<=args.end<FRAMES and 16<=args.samples<=128 and args.width in (1920,2560,3840)
    validate()
    if not args.validate_only:render(args)
