"""Product interface unfolding into software architecture. Remote Blender only."""
import argparse,json,math,sys,time
from pathlib import Path
FPS=24
FRAMES=576

def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)

def reveal(t):
    return ease((t-.12)/.28)*(1-ease((t-.76)/.20))

def placement(group,t):
    e=reveal(t)
    positions={
      'shell':(-2.4*e,1.8*e,2.55+1.2*e),
      'navigation':(-2.4*e-.15*e,1.8*e,2.68+1.32*e),
      'heading':(-2.4*e,1.8*e+.16*e,2.68+1.45*e),
      'metrics':(-2.4*e,1.8*e,2.68+1.65*e),
      'records':(-2.4*e-.12*e,1.8*e-.16*e,2.68+1.3*e),
      'detail':(-2.4*e+.2*e,1.8*e-.16*e,2.68+1.75*e),
      'logic':(-2.8*e,-2.2*e,1.55+.2*e),
      'data':(3.8*e,-.6*e,.62+.9*e),
      'runtime':(3.6*e,3.7*e,.08+.1*e),
    }
    return positions[group]

def camera_pose(t):
    e=reveal(t)
    return (18.8+7.7*e,math.radians(-83+18*e+3*math.sin(2*math.pi*t)),(0,.2*e,2.65),.12)

def scale(group,t):
    return 1-(.25 if group in ['logic','data','runtime'] else .18)*reveal(t)

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
        self.box(g,x,y,bottom,w,d,.065,'edge');self.box(g,x,y,bottom+.065,w-.025,d-.025,.024,m)

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
    p.panel('heading',.7,2.03,8.5,1.07)
    p.text('heading','Una operación. Todo conectado.',-3.3,2.13,.108,.35,'white',True)
    p.text('heading','Solicitudes, responsables y resultados en un mismo lugar.',-3.3,1.77,.108,.157)
    for i,(number,label) in enumerate([('24','Solicitudes activas'),('08','En ejecución'),('16','Resueltas')]):
        x=-2.19+i*2.88;p.panel('metrics',x,.86,2.70,.94)
        p.text('metrics',number,x-1.16,.84,.11,.40,'white',True)
        p.text('metrics',label,x-.42,.9,.11,.142)
        for j in range(9):p.box('metrics',x+.85+j*.038,.6,.108,.022,.04+(j%4)*.027,.015,'red' if i==1 else 'muted')
    p.panel('records',-.78,-1.11,5.70,2.91)
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
    assert extent[0]>.215 and extent[1]>.07 and extent[2]<.98 and extent[3]<.93,extent
    assert placement('detail',0)==placement('detail',1)
    print(json.dumps({'scene':'software-system-v2','frames':FRAMES,'bounds':extent,'components':len(p.boxes),'labels':len(p.texts)}))

def render(args):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=args.samples
    scene.cycles.use_denoising=True;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.018
    scene.cycles.max_bounces=4;scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.fps=FPS
    scene.render.use_persistent_data=True;scene.view_settings.view_transform='AgX'
    scene.world=bpy.data.worlds.new('Product studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.04,.05,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
    palette={'shell':'#0B0D11','nav':'#15191F','panel':'#20252C','edge':'#424C56','paper':'#E7ECEF','white':'#FFFFFF','ink':'#24303A','muted':'#A0ABB5','selection':'#382326','red':'#DC2626','trace':'#566470','floor':'#0B1019'}
    mats={}
    for name,hexvalue in palette.items():
        rgb=[int(hexvalue[i:i+2],16)/255 for i in [1,3,5]];rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        mat=bpy.data.materials.new(name);mat.use_nodes=True;n=mat.node_tree.nodes['Principled BSDF']
        n.inputs['Base Color'].default_value=(*rgb,1);n.inputs['Roughness'].default_value=.38;n.inputs['Metallic'].default_value=.16
        if name in ['white','muted','red']:n.inputs['Emission Color'].default_value=(*rgb,1);n.inputs['Emission Strength'].default_value=.24
        mats[name]=mat
    root=Path(__file__).resolve().parents[2]
    font_dir=Path(args.font_dir) if args.font_dir else root/'public/fonts/um-sans'
    fonts={False:bpy.data.fonts.load(str(font_dir/'UMSans-Regular.ttf')),True:bpy.data.fonts.load(str(font_dir/'UMSans-SemiBold.ttf'))}
    p=build();parents={}
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
        bevel=obj.modifiers.new('Precision corners','BEVEL');bevel.width=.009;bevel.segments=3
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
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.062);packet=bpy.context.object;packet.data.materials.append(mats['white'])
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.16));bpy.context.object.data.materials.append(mats['floor'])
    for name,xyz,energy,size,color in [('Softbox',(-4,-6,16),2400,10,(1,.96,.92)),('Edge',(5,7,12),2100,8,(.80,.9,1)),('Fill',(7,-9,8),1000,9,(.96,.98,1))]:
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
        flow.data.bevel_depth=.023*max(.001,strength);packet.scale=(strength,)*3
        progress=ease((t-.28)/.32) if t<.61 else 1-ease((t-.61)/.22);q=progress*3;i=min(2,int(q));packet.location=points[i].lerp(points[i+1],q-i)
        confirmed=.79<t<.945
        labels['Actualizar solicitud'].body='Cambios guardados' if confirmed else 'Actualizar solicitud'
        labels['En revisión'].body='Confirmada' if confirmed else 'En revisión'
        bpy.context.view_layer.update()
        projected_points=[world_to_camera_view(scene,cam,Vector(point)*scale(g,t)+parents[g].location) for g,coords in p.points.items() for point in coords]
        extent=[min(v.x for v in projected_points),min(v.y for v in projected_points),max(v.x for v in projected_points),max(v.y for v in projected_points)]
        assert extent[0]>.215 and extent[1]>.07 and extent[2]<.98 and extent[3]<.93,(frame,extent)
        scene.render.filepath=str(out/f'{frame:04d}.png');start=time.time();bpy.ops.render.render(write_still=True)
        timings.append({'frame':frame,'seconds':round(time.time()-start,2)});bounds.append({'frame':frame,'bounds':extent});print(json.dumps(timings[-1]),flush=True)
    (out/'render-info.json').write_text(json.dumps({'service':'104','scene':'software-system-v2','blender':bpy.app.version_string,'engine':'CYCLES','samples':args.samples,'frames':FRAMES,'fps':FPS,'resolution':[1920,1080],'camera':'recognizable product interface unfolds into rules, data and runtime; continuous 24 second loop','timings':timings,'bounds':bounds}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int,default=FRAMES-1);parser.add_argument('--samples',type=int,default=24);parser.add_argument('--output',default='frames');parser.add_argument('--validate-only',action='store_true');parser.add_argument('--font-dir')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 0<=args.start<=args.end<FRAMES and 16<=args.samples<=64
    validate()
    if not args.validate_only:render(args)
