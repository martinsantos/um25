"""Product interface unfolding into software architecture. Remote Blender only."""
import argparse,hashlib,json,math,sys,time
from pathlib import Path
FPS=60
FRAMES=1440

def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)

def reveal(t):
    if t<=0 or t>=1:return 0
    return ease((t-.19)/.11)*(1-ease((t-.90)/.10))

def placement(group,t):
    e=reveal(t)
    positions={
      'shell':(-1.7*e,2.4*e,2.55+1.35*e),
      'navigation':(-1.7*e,2.4*e,2.58+1.35*e),
      'heading':(-1.7*e,2.4*e,2.58+1.35*e),
      'metrics':(-1.7*e,2.4*e,2.58+1.35*e),
      'records':(-1.7*e,2.4*e,2.58+1.35*e),
      'detail':(-1.7*e,2.4*e,2.59+1.48*e),
      'logic':(-4.8*e,-1.8*e,1.55+.08*e),
      'data':(4.5*e,-1.55*e,.62+.74*e),
      'runtime':(8.0*e,4.0*e,.08+.16*e),
    }
    return positions[group]

def camera_pose(t):
    # Each discipline plane gets a readable close pass. The previous wide
    # composition flattened the three lower layers into illegible miniatures.
    # Gentle drift within a pass preserves movement without repeated orbiting.
    keys=[
      (0.00,13.8,-84,(.1,0,2.65),0),
      (0.20,11.2,-80,(1.60,-.22,2.75),0),
      (0.36,12.8,-78,(-4.8,-1.8,1.63),0),
      (0.45,12.4,-76,(-4.65,-1.8,1.63),0),
      (0.57,11.8,-73,(4.5,-1.55,1.36),0),
      (0.65,11.5,-71,(4.65,-1.55,1.36),0),
      (0.76,10.8,-68,(8.0,4.0,.24),0),
      (0.81,10.6,-67,(8.10,4.0,.24),0),
      (0.90,29.0,-70,(1.9,1.0,2.2),0),
      (1.00,13.8,-84,(.1,0,2.65),0),
    ]
    a,b=keys[0],keys[-1]
    for left,right in zip(keys,keys[1:]):
        if left[0]<=t<=right[0]:a,b=left,right;break
    k=ease((t-a[0])/(b[0]-a[0]));blend=lambda x,y:x+(y-x)*k
    return (blend(a[1],b[1]),math.radians(blend(a[2],b[2])),tuple(blend(x,y) for x,y in zip(a[3],b[3])),0)

def scale(group,t):
    return 1-(.18 if group in ['logic','data','runtime'] else .05)*reveal(t)

FOCUS_WINDOWS={'detail':(.16,.20),'logic':(.36,.45),'data':(.57,.65),'runtime':(.76,.81)}
WIDE_TIMES=(0,.90,1)

class Product:
    def __init__(self):self.boxes=[];self.texts=[];self.lines=[];self.points={};self.meshes=[]
    def box(self,g,x,y,z,w,d,h,m='panel'):
        self.boxes.append((g,x,y,z,w,d,h,m))
        self.points.setdefault(g,[]).extend((x+i*w/2,y+j*d/2,z+k*h) for i in [-1,1] for j in [-1,1] for k in [0,1])
    def text(self,g,s,x,y,z,size=.17,m='muted',bold=False):
        self.texts.append((g,s,x,y,z,size,m,bold))
        self.points.setdefault(g,[]).extend([(x,y,z),(x+len(s)*size*.62,y+size,z)])
    def line(self,g,pts,m='trace',radius=.008):
        self.lines.append((g,pts,m,radius));self.points.setdefault(g,[]).extend(pts)
    def rounded(self,g,x,y,z,w,d,h,m='panel',r=.055):
        r=min(r,w/2,d/2);ring=[]
        for cx,cy,start in [(x+w/2-r,y+d/2-r,0),(x-w/2+r,y+d/2-r,90),(x-w/2+r,y-d/2+r,180),(x+w/2-r,y-d/2+r,270)]:
            ring.extend((cx+r*math.cos(math.radians(start+i*90/8)),cy+r*math.sin(math.radians(start+i*90/8))) for i in range(9))
        n=len(ring);vv=[(xx,yy,zz) for zz in [z,z+h] for xx,yy in ring]
        ff=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        self.meshes.append((g,m,vv,ff));self.points.setdefault(g,[]).extend(vv)
    def panel(self,g,x,y,w,d,m='panel',bottom=0):
        self.rounded(g,x,y,bottom,w,d,.014,'edge',.07)
        self.rounded(g,x,y,bottom+.014,w-.012,d-.012,.004,m,.066)
    def pill(self,g,label,x,y,w,m='selection',ink='white',size=.113):
        self.rounded(g,x+w/2,y+.033,.029,w,.25,.003,m,.055)
        self.text(g,label,x+.08,y,.037,size,ink)
    def dot(self,g,x,y,r=.017,m='muted',z=.035):
        self.rounded(g,x,y,z,r*2,r*2,.002,m,r)
    def glyph(self,g,kind,x,y,m='muted',size=.09):
        shapes={
            'grid':[[(0,0),(.75,0),(.75,.75),(0,.75),(0,0)],[(.375,0),(.375,.75)],[(0,.375),(.75,.375)]],
            'list':[[(0,.1),(.8,.1)],[(0,.4),(.8,.4)],[(0,.7),(.8,.7)]],
            'folder':[[(0,0),(.9,0),(.9,.6),(.4,.6),(.3,.8),(0,.8),(0,0)]],
            'node':[[(0,0),(.28,.5),(.65,.6),(.9,.1)]],
            'clock':[[(.4,0),(0,.2),(0,.6),(.4,.8),(.8,.6),(.8,.2),(.4,0)],[(.4,.6),(.4,.3),(.62,.3)]],
            'check':[[(0,.4),(.3,.1),(.9,.8)]],
            'plus':[[(0,.4),(.8,.4)],[(.4,0),(.4,.8)]],
            'search':[[(.45,.08),(.05,.22),(.05,.62),(.45,.76),(.72,.5),(.62,.18),(.45,.08)],[(.65,.18),(.9,-.1)]]}
        circle=[(.4+.36*math.cos(i*math.tau/40),.4+.36*math.sin(i*math.tau/40)) for i in range(41)]
        if kind=='search':shapes[kind]=[circle,[(.66,.14),(.92,-.12)]]
        if kind=='clock':shapes[kind]=[circle,[(.4,.66),(.4,.4),(.60,.4)]]
        for path in shapes[kind]:self.line(g,[(x+a*size,y+b*size,.041) for a,b in path],m,.0035)

def build():
    p=Product()
    # A real product hierarchy: workspace, query, case list, decision, evidence.
    p.panel('shell',0,0,10.7,6.25,'shell')
    p.text('shell','UM / OPERACIONES',-5.04,2.80,.04,.14,'white',True)
    p.text('shell','Espacio de trabajo / Equipo técnico',-3.33,2.80,.04,.116)
    p.text('shell','DEMO / DATOS ILUSTRATIVOS',3.32,2.81,.04,.092)
    p.line('shell',[(-5.1,2.61,.033),(5.1,2.61,.033)],'trace',.0025)
    p.panel('navigation',-4.43,-.13,1.38,5.20,'nav')
    p.text('navigation','Mi espacio',-4.97,2.18,.037,.17,'white',True)
    p.text('navigation','EQUIPO TÉCNICO',-4.97,1.85,.037,.098)
    for i,(label,icon) in enumerate([('Resumen','grid'),('Solicitudes','list'),('Proyectos','folder'),('Equipos','node'),('Actividad','clock')]):
        y=1.28-i*.53
        if i==1:p.rounded('navigation',-4.43,y+.035,.027,1.18,.38,.005,'selection',.045)
        p.glyph('navigation',icon,-4.97,y+.012,'white' if i==1 else 'muted',.12)
        p.text('navigation',label,-4.73,y,.039,.126,'white' if i==1 else 'muted')
    p.line('navigation',[(-4.97,-1.65,.035),(-3.92,-1.65,.035)],'trace',.0025)
    p.text('navigation','PROYECTO ACTIVO',-4.97,-1.91,.037,.094)
    p.dot('navigation',-4.92,-2.14,.026,'red');p.text('navigation','Nueva sede',-4.8,-2.18,.038,.12,'white')
    p.text('navigation','Equipo de redes',-4.8,-2.40,.038,.105)
    p.text('heading','Operaciones / Solicitudes',-3.30,2.29,.038,.116)
    p.text('heading','Todo el equipo, en contexto.',-3.30,1.88,.038,.30,'white',True)
    p.rounded('heading',2.44,2.31,.026,2.23,.34,.004,'nav',.045)
    p.glyph('heading','search',1.43,2.27,'muted',.115)
    p.text('heading','Buscar una solicitud...',1.63,2.27,.038,.113)
    p.pill('heading','Nueva solicitud',3.73,2.28,1.16,'red',size=.109)
    # Evidence summaries use quiet divider lines and actual varied trajectories.
    values=[(.12,.18,.16,.28,.26,.33,.37,.31,.46,.43,.52),(.38,.32,.36,.24,.29,.23,.28,.19,.22,.18,.16),(.10,.15,.14,.21,.29,.28,.36,.41,.45,.49,.56)]
    for i,(number,label,context) in enumerate([('24','Solicitudes activas','Priorizadas por el equipo'),('08','En ejecución','Responsables asignados'),('16','Resueltas','Con evidencia de cierre')]):
        x=-2.12+i*2.86
        p.text('metrics',label,x-1.12,1.34,.038,.123)
        p.text('metrics',number,x-1.12,.88,.038,.37,'white',True)
        p.text('metrics',context,x-.45,.99,.038,.112)
        pts=[(x-.42+j*.132,.64+v*.22,.038) for j,v in enumerate(values[i])]
        p.line('metrics',pts,'red' if i==1 else 'muted',.007)
        p.dot('metrics',pts[-1][0],pts[-1][1],.015,'red' if i==1 else 'white')
        if i<2:p.line('metrics',[(x+1.47,.67,.034),(x+1.47,1.40,.034)],'trace',.0025)
    p.panel('records',-.77,-1.08,5.73,2.91,'panel')
    p.text('records','Solicitudes del equipo',-3.38,.09,.037,.188,'white',True)
    p.pill('records','Todas',.39,.12,.48,'selection',size=.1)
    p.glyph('records','search',1.45,.14,'muted',.12)
    cols=[(-3.36,'SOLICITUD'),(-1.45,'RESPONSABLE'),(.38,'ESTADO')]
    for x,label in cols:p.text('records',label,x,-.35,.037,.10)
    rows=[('0248','Nueva sede','Equipo de redes','En revisión','ER'),('0247','Portal interno','Producto','En ejecución','PR'),('0246','Integración ERP','Datos','Resuelta','DT'),('0245','Alta de activos','Operaciones','Resuelta','OP')]
    for i,(number,name,team,state,initials) in enumerate(rows):
        y=-.79-i*.47
        if i==0:
            p.rounded('records',-.78,y+.035,.025,5.38,.41,.005,'selection',.035)
            p.box('records',-3.48,y+.033,.036,.021,.29,.003,'red')
        p.text('records',number,-3.35,y,.038,.112)
        p.text('records',name,-2.91,y,.038,.121,'white')
        p.rounded('records',-1.34,y+.04,.031,.20,.20,.003,'nav',.10)
        p.text('records',initials,-1.404,y+.01,.04,.086,'white')
        p.text('records',team,-1.13,y,.038,.115)
        p.pill('records',state,.35,y,1.02,'active' if i==0 else 'nav','warm' if i==0 else 'muted',.10)
        for k in range(3):p.dot('records',1.62+k*.047,y+.04,.008)
        if i<3:p.line('records',[(-3.37,y-.215,.032),(1.84,y-.215,.032)],'trace',.002)
    p.text('records','4 de 24 solicitudes',-3.36,-2.48,.039,.103)
    p.text('records','Actualizado ahora',.68,-2.48,.039,.103)
    p.panel('detail',3.59,-1.08,2.62,2.91,'detail')
    p.text('detail','SOLICITUD / 0248',2.48,.10,.038,.107,'warm',True)
    p.text('detail','Conectar una nueva sede',2.48,-.20,.038,.168,'white',True)
    p.line('detail',[(2.47,-.37,.033),(4.71,-.37,.033)],'trace',.0025)
    for i,(label,value) in enumerate([('PROYECTO','Nueva sede'),('RESPONSABLE','Equipo de redes')]):
        y=-.59-i*.32;p.text('detail',label,2.48,y,.038,.086);p.text('detail',value,3.44,y,.038,.12,'white')
    p.line('detail',[(2.55,-1.16,.036),(2.55,-1.50,.036)],'trace',.003)
    for i,label in enumerate(['Alcance definido','Documentación vinculada']):
        y=-1.17-i*.25;p.glyph('detail','check',2.51,y+.01,'warm',.105);p.text('detail',label,2.73,y,.038,.119,'white')
    p.rounded('detail',3.59,-1.89,.029,2.20,.39,.005,'red',.045)
    p.text('detail','Actualizar solicitud',2.87,-1.934,.041,.123,'white',True)
    p.text('detail','Cada acción deja evidencia.',2.48,-2.35,.039,.108)
    # The same transaction continues through the architecture, with real fields
    # and contracts rather than repeated decorative placeholders.
    p.panel('logic',0,0,9.8,5.35,'nav',bottom=-.12)
    p.text('logic','02 / REGLAS E INTEGRACIONES',-4.48,2.18,.038,.195,'white',True)
    p.text('logic','Una acción. Un contrato. Una respuesta.',-4.48,1.82,.038,.14)
    for i,(title,method,fields) in enumerate([('VALIDACIÓN','request.validate',['id: 0248','alcance: definido','campos: completos']),('AUTORIZACIÓN','policy.evaluate',['rol: equipo_redes','recurso: solicitud','permiso: actualizar']),('INTEGRACIÓN','PATCH /solicitudes/0248',['contrato: v1','respuesta: 200 OK','traza: solicitud_0248'])]):
        x=-3.12+i*3.10;p.panel('logic',x,-.10,2.7,2.53,'panel')
        p.text('logic',title,x-1.12,.83,.038,.142,'white',True)
        p.text('logic',method,x-1.12,.44,.038,.124,'warm')
        p.line('logic',[(x-1.12,.20,.033),(x+1.12,.20,.033)],'trace',.0025)
        for j,field in enumerate(fields):p.text('logic',field,x-1.12,-.15-j*.32,.038,.134)
    p.line('logic',[(-3.12,-1.4,.038),(-3.12,-1.76,.038),(3.08,-1.76,.038),(3.08,-1.4,.038)],'red',.008)
    p.text('logic','La regla se verifica antes de modificar el dato.',-4.48,-2.16,.038,.153,'white')
    p.panel('data',0,0,9,4.8,'nav',bottom=-.12)
    p.text('data','03 / DATOS Y TRAZABILIDAD',-4.13,1.97,.038,.195,'white',True)
    for i,(label,fields) in enumerate([('SOLICITUDES',['id / 0248','estado / validada','version / 03']),('PERSONAS Y ROLES',['equipo / redes','permiso / actualizar','origen / producto']),('REGISTRO DE CAMBIOS',['acción / actualización','resultado / confirmado','integridad / verificada'])]):
        x=-2.87+i*2.87;p.panel('data',x,-.09,2.57,2.78,'panel')
        p.text('data',label,x-1.10,.87,.038,.128,'white',True)
        p.line('data',[(x-1.1,.61,.033),(x+1.1,.61,.033)],'trace',.0025)
        for j,field in enumerate(fields):
            p.text('data',field,x-1.10,.28-j*.40,.038,.13,'warm' if j==0 else 'muted')
        p.pill('data','vinculado',x-.99,-1.08,.72,'selection',size=.105)
    p.text('data','El resultado conserva su origen y su historial.',-4.12,-1.99,.038,.145)
    p.panel('runtime',0,0,8.3,4.3,'nav',bottom=-.12)
    p.text('runtime','04 / DESPLIEGUE E INFRAESTRUCTURA',-3.78,1.74,.038,.18,'white',True)
    for i,(label,rows) in enumerate([('VERIFICAR',['pruebas / OK','contrato / válido']),('VERSIONAR',['release / 1.4','cambios / trazados']),('DESPLEGAR',['imagen / verificada','entorno / aislado']),('OBSERVAR',['métrica / activa','evento / registrado'])]):
        x=-2.9+i*1.92;p.panel('runtime',x,-.02,1.66,1.76,'panel')
        p.glyph('runtime','check',x-.67,.51,'warm',.18)
        p.text('runtime',label,x-.67,.16,.038,.131,'white',True)
        for j,row in enumerate(rows):p.text('runtime',row,x-.67,-.17-j*.25,.038,.105)
    p.line('runtime',[(-2.9,-1.16,.034),(2.86,-1.16,.034)],'red',.008)
    for i in range(4):p.dot('runtime',-2.9+i*1.92,-1.16,.021,'red')
    p.text('runtime','Una experiencia respaldada por infraestructura verificable.',-3.78,-1.76,.038,.14)
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
    from types import SimpleNamespace
    focus={}
    for t in WIDE_TIMES:
        b=projected(p,t);assert min(b[:2])>.02 and max(b[2:])<.98,('wide',t,b)
    for group,(start,end) in FOCUS_WINDOWS.items():
        focus[group]=[]
        for i in range(31):
            t=start+(end-start)*i/30
            b=projected(SimpleNamespace(points={group:p.points[group]}),t)
            assert min(b[:2])>.035 and max(b[2:])<.965,(group,t,b)
            focus[group].append(b)
    assert scale('logic',.5)>.8

    print(json.dumps({'scene':'software-system-v6','frames':FRAMES,'bounds':extent,'components':len(p.boxes),'labels':len(p.texts),'focus_windows':FOCUS_WINDOWS,'wide_times':WIDE_TIMES}))

def render(args):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.render.engine={'cycles':'CYCLES','eevee':'BLENDER_EEVEE_NEXT','workbench':'BLENDER_WORKBENCH'}[args.engine];
    if args.engine=='eevee' and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=args.samples
    if args.engine=='workbench':
        scene.display.shading.light='FLAT';scene.display.shading.color_type='MATERIAL'
        scene.display.shading.show_shadows=False
        scene.display.shading.show_cavity=False;scene.display.shading.show_specular_highlight=False
        scene.display.shading.show_object_outline=False;scene.display.shading.background_type='WORLD'
        scene.display.render_aa='8'
    scene.cycles.device='CPU';scene.cycles.samples=args.samples
    scene.cycles.use_denoising=True;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.008
    scene.cycles.max_bounces=4;scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width*9/16);scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.fps=FPS
    scene.render.use_persistent_data=True;scene.view_settings.view_transform='Standard'
    scene.world=bpy.data.worlds.new('Product studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.04,.05,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
    palette={'shell':'#17191C','nav':'#121416','panel':'#1D2024','detail':'#23272B','edge':'#30353A','paper':'#EBEAE7','white':'#EEEFF0','ink':'#1A1B1E','muted':'#A6ACB3','selection':'#2C3036','active':'#3D2728','warm':'#EAA5A5','red':'#DC2626','trace':'#373D44','floor':'#090A0C'}
    mats={}
    for name,hexvalue in palette.items():
        rgb=[int(hexvalue[i:i+2],16)/255 for i in [1,3,5]];rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        mat=bpy.data.materials.new(name);mat.diffuse_color=(*rgb,1);mat.use_nodes=True;n=mat.node_tree.nodes['Principled BSDF']
        n.inputs['Base Color'].default_value=(*rgb,1);n.inputs['Roughness'].default_value=.72;n.inputs['Metallic'].default_value=0
        if name in ['white','muted','red','paper','shell']:n.inputs['Emission Color'].default_value=(*rgb,1);n.inputs['Emission Strength'].default_value=.32 if name in ['paper','shell'] else .08
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
    for g,m,verts,faces in p.meshes:
        vv,ff=meshes.setdefault((g,m),([],[]));offset=len(vv);vv.extend(verts);ff.extend(tuple(offset+i for i in face) for face in faces)
    for (g,m),(vv,ff) in meshes.items():
        mesh=bpy.data.meshes.new(g+' '+m);mesh.from_pydata(vv,[],ff);mesh.update()
        obj=bpy.data.objects.new(g+' '+m,mesh);scene.collection.objects.link(obj);obj.parent=parents[g];mesh.materials.append(mats[m])
        bevel=obj.modifiers.new('Precision corners','BEVEL');bevel.width=.001;bevel.segments=3
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
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.16));bpy.context.object.data.materials.append(mats['floor'])
    for name,xyz,energy,size,color in [('Key',(-4,1,15),1300,12,(1,1,1)),('Edge',(5,9,8),650,10,(1,1,1)),('Fill',(0,-10,12),750,12,(1,1,1))]:
        data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=xyz;obj.rotation_euler=(Vector((0,0,2))-obj.location).to_track_quat('-Z','Y').to_euler()
    camera=bpy.data.cameras.new('Interface into architecture');camera.type='ORTHO';camera.clip_end=200
    cam=bpy.data.objects.new('Interface into architecture',camera);scene.collection.objects.link(cam);scene.camera=cam
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[];bounds=[];focus_bounds=[];handler_errors=[]
    def update_frame(scene):
        frame=scene.frame_current
        t=frame/(FRAMES-1);size,angle,target,shift=camera_pose(t);target=Vector(target)
        cam.location=target+Vector((22*math.cos(angle),22*math.sin(angle),28));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camera.ortho_scale=size;camera.shift_x=-shift
        for name,obj in parents.items():
            obj.location=placement(name,t);obj.scale=(scale(name,t),)*3
            if name in ('logic','data','runtime'):
                for child in obj.children:child.hide_render=reveal(t)<.01
        confirmed=.61<t<.98
        states={'Actualizar solicitud':'Cambios guardados' if confirmed else 'Actualizar solicitud',
                'En revisión':'Confirmada' if confirmed else 'En revisión',
                '24':'23' if confirmed else '24','16':'17' if confirmed else '16',
                'estado / validada':'estado / confirmada' if confirmed else 'estado / validada',
                'version / 03':'version / 04' if confirmed else 'version / 03'}
        for key,value in states.items():
            if labels[key].body!=value:labels[key].body=value
        bpy.context.view_layer.update()
        projected_points=[world_to_camera_view(scene,cam,Vector(point)*scale(g,t)+parents[g].location) for g,coords in p.points.items() for point in coords]
        extent=[min(v.x for v in projected_points),min(v.y for v in projected_points),max(v.x for v in projected_points),max(v.y for v in projected_points)]
        assert all(math.isfinite(v) for v in extent),(frame,extent)
        bounds.append({'frame':frame,'bounds':extent})
        for group,(start,end) in FOCUS_WINDOWS.items():
            if start<=t<=end:
                vv=[world_to_camera_view(scene,cam,Vector(point)*scale(group,t)+parents[group].location) for point in p.points[group]]
                b=[min(v.x for v in vv),min(v.y for v in vv),max(v.x for v in vv),max(v.y for v in vv)]
                assert min(b[:2])>.03 and max(b[2:])<.97,('active plane',frame,group,b)
                focus_bounds.append({'frame':frame,'group':group,'bounds':b})
    original_update=update_frame
    def update_frame(scene):
        try:original_update(scene)
        except Exception as error:
            handler_errors.append(repr(error));raise

    # Keep one render operation alive for the sequence. Re-entering still render
    # for every frame needlessly reinitializes the software GPU and draw engine.
    started=[0.0]
    def begin_frame(scene):started[0]=time.time()
    def finish_frame(scene):
        timings.append({'frame':scene.frame_current,'seconds':round(time.time()-started[0],2)})
        info={'service':'104','scene':'software-system-v6','blender':bpy.app.version_string,'engine':scene.render.engine,
              'samples':args.samples,'frames':FRAMES,'fps':FPS,'resolution':[scene.render.resolution_x,scene.render.resolution_y],
              'camera':'a readable continuous tour from application to validation, traceable data and deployment, then the complete system',
              'render_mode':'one persistent native animation render','antialiasing':scene.display.render_aa if args.engine=='workbench' else args.samples,'lighting':'flat product surfaces' if args.engine=='workbench' else 'area studio','authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'font_sha256':{w:hashlib.sha256((font_dir/('UMSans-'+w+'.ttf')).read_bytes()).hexdigest() for w in ['Regular','SemiBold']},'timings':timings,'bounds':bounds,'focus_bounds':focus_bounds,'focus_windows':FOCUS_WINDOWS,'wide_times':WIDE_TIMES,'handler_errors':handler_errors}
        (out/'render-info.json').write_text(json.dumps(info));print(json.dumps(timings[-1]),flush=True)
    scene.frame_end=args.end;scene.frame_start=args.start;scene.render.filepath=str(out)+'/'
    bpy.app.handlers.frame_change_pre.append(update_frame)
    bpy.app.handlers.render_pre.append(begin_frame);bpy.app.handlers.render_post.append(finish_frame)
    try:
        bpy.ops.render.render(animation=True)
        assert not handler_errors,handler_errors
        assert [row['frame'] for row in timings]==list(range(args.start,args.end+1))
    finally:
        bpy.app.handlers.frame_change_pre.remove(update_frame)
        bpy.app.handlers.render_pre.remove(begin_frame);bpy.app.handlers.render_post.remove(finish_frame)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int,default=FRAMES-1);parser.add_argument('--samples',type=int,default=48);parser.add_argument('--width',type=int,default=1920);parser.add_argument('--engine',choices=['cycles','eevee','workbench'],default='cycles');parser.add_argument('--output',default='frames');parser.add_argument('--validate-only',action='store_true');parser.add_argument('--font-dir')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 0<=args.start<=args.end<FRAMES and 16<=args.samples<=128 and args.width in (1920,2560,3840)
    validate()
    if not args.validate_only:render(args)
