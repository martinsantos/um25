"""Product interface unfolding into software architecture. Remote Blender only."""
import argparse,hashlib,json,math,sys,time
from pathlib import Path
FPS=60
FRAMES=1440

def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)

def reveal(t):
    if t<=0 or t>=1:return 0
    return ease((t-.17)/.15)*(1-ease((t-.77)/.23))

def placement(group,t):
    e=reveal(t)
    z=2.60
    if group=='selection':return (-.70*e,6.30*e,z+.075+.43*ease((t-.12)/.10)*(1-ease((t-.35)/.10)))
    if group=='detail':
        lift=0 if t<=0 or t>=1 else ease((t-.13)/.12)*(1-ease((t-.79)/.21))
        return (-.70*e+1.7*lift,6.30*e-.7*lift,z+.055+1.7*e+.95*lift)
    if group in ('shell','navigation','heading','metrics','records'):return (-.70*e,6.30*e,z+(.028 if group=='shell' else .049)+1.7*e)
    return {'logic':(0,.0,1.63),'data':(0,-4.50*e,.76),'runtime':(0,-8.80*e,.12)}[group]

def camera_pose(t):
    keys=[(0,17.4,-90,(0,0,2.65)),(.16,9.8,-94,(1.3,0,2.8)),
          (.28,12.8,-90,(4.5,3.4,4.9)),(.43,13.8,-86,(0,0,1.63)),
          (.49,13.6,-86,(.10,0,1.63)),(.58,13.6,-92,(0,-4.5,.76)),
          (.64,13.4,-92,(.1,-4.5,.76)),(.72,13.6,-96,(0,-8.8,.12)),
          (.79,13.6,-96,(.1,-8.8,.12)),(.90,25,-96,(0,0,2.2)),
          (1,17.4,-90,(0,0,2.65))]
    a,b=keys[0],keys[-1]
    for left,right in zip(keys,keys[1:]):
        if left[0]<=t<=right[0]:a,b=left,right;break
    q=ease((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
    size=mix(a[1],b[1]);target=tuple(mix(x,y) for x,y in zip(a[3],b[3]))
    # Follow the inspector while it opens. A static aim cropped its title as
    # the application unfolded behind it, despite correct screen proportions.
    follow=ease((t-.17)/.06)*(1-ease((t-.32)/.07))
    dx,dy,dz=placement('detail',t)
    detail=(3.5+dx-1.20,-1.14+dy,dz+.04)
    target=tuple(value+(focus-value)*follow for value,focus in zip(target,detail))
    return size,-math.pi/2,target,0

def scale(group,t):return 1

def operation(t):
    # One event crosses the authored layers while the camera is looking at them.
    # Reset inside the closing shot, never between two active layers.
    active=.14<t<.97
    rules=[ease((t-(.363+i*.029))/.027) if active else 0 for i in range(4)]
    writes=[ease((t-(.536+i*.026))/.020) if active else 0 for i in range(3)]
    release=[ease((t-(.670+i*.027))/.023) if active else 0 for i in range(4)]
    return dict(rules=rules,writes=writes,release=release,confirmed=active and t>.592)

FOCUS_WINDOWS={'detail':(.23,.34),'logic':(.43,.49),'data':(.58,.64),'runtime':(.72,.79)}
WIDE_TIMES=(0,1)

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
            'close':[[(0,0),(.8,.8)],[(0,.8),(.8,0)]],
            'search':[[(.45,.08),(.05,.22),(.05,.62),(.45,.76),(.72,.5),(.62,.18),(.45,.08)],[(.65,.18),(.9,-.1)]]}
        circle=[(.4+.36*math.cos(i*math.tau/40),.4+.36*math.sin(i*math.tau/40)) for i in range(41)]
        if kind=='search':shapes[kind]=[circle,[(.66,.14),(.92,-.12)]]
        if kind=='clock':shapes[kind]=[circle,[(.4,.66),(.4,.4),(.60,.4)]]
        for path in shapes[kind]:self.line(g,[(x+a*size,y+b*size,.041) for a,b in path],m,.0035)

def build():
    p=Product()
    # One authored working application. Every moving surface belongs to it.
    p.panel('shell',0,0,12.8,7.8,'shell')
    p.text('shell','UM',-6.05,3.48,.04,.20,'white',True)
    p.text('shell','Operaciones',-5.53,3.48,.04,.165,'white',True)
    p.text('shell','/  Nueva sede',-4.35,3.48,.04,.145)
    p.line('shell',[(-6.1,3.18,.035),(6.1,3.18,.035)],'trace',.003)
    p.pill('shell','Espacio de trabajo',3.92,3.49,1.57,'nav',size=.118)
    p.rounded('shell',5.78,3.53,.03,.29,.29,.006,'avatar',.145)
    p.text('shell','ER',5.692,3.49,.04,.10,'white',True)
    p.text('shell','DEMO · DATOS ILUSTRATIVOS',-6.03,-3.64,.04,.091)
    p.text('shell','Todos los cambios guardados',4.13,-3.63,.04,.107)
    p.line('shell',[(-4.02,3.17,.035),(-4.02,-3.38,.035)],'trace',.0025)
    # Navigation: a product structure, with recognizable fine-stroke glyphs.
    p.text('navigation','ESPACIO DE TRABAJO',-6.02,2.79,.04,.108)
    for i,(label,icon,count) in enumerate([('Resumen','grid',''),('Solicitudes','list','24'),('Proyectos','folder','08'),('Activos','node','136'),('Actividad','clock','')]):
        y=2.28-i*.48
        if i==1:p.rounded('navigation',-5.21,y+.049,.025,1.82,.37,.003,'selection',.045)
        p.glyph('navigation',icon,-5.96,y+.012,'white' if i==1 else 'muted',.14)
        p.text('navigation',label,-5.68,y,.040,.14,'white' if i==1 else 'muted')
        p.text('navigation',count,-4.60,y,.040,.104)
    p.text('navigation','PROYECTOS',-6.02,-.58,.04,.107)
    for i,(label,mat) in enumerate([('Nueva sede','red'),('Portal de clientes','sage'),('Integración ERP','bluegrey')]):
        y=-1.03-i*.44;p.rounded('navigation',-5.93,y+.041,.03,.115,.115,.002,mat,.026);p.text('navigation',label,-5.69,y,.04,.13,'white' if i==0 else 'muted')
    p.panel('navigation',-5.20,-2.83,1.77,.68,'nav')
    p.dot('navigation',-5.86,-2.70,.021,'sage');p.text('navigation','Sistemas operativos',-5.72,-2.744,.04,.116,'white')
    p.text('navigation','Última revisión · hace 2 min',-5.87,-2.982,.04,.089)
    p.text('heading','Proyectos  /  Nueva sede',-3.64,2.78,.04,.12)
    p.text('heading','Cada equipo, en contexto.',-3.64,2.31,.04,.32,'white',True)
    p.text('heading','Personas, decisiones y entregas conectadas.',-3.63,1.98,.04,.135)
    p.rounded('heading',5.11,2.445,.027,1.76,.40,.010,'red',.06)
    p.text('heading','Nueva solicitud',4.43,2.398,.047,.135,'buttonink',True)
    # Quiet, deliberate metrics rather than oversized dashboard tiles.
    for i,(value,label,delta) in enumerate([('24','Solicitudes activas','06 requieren revisión'),('08','En ejecución','03 equipos trabajando'),('16','Entregas verificadas','Historial actualizado')]):
        x=-3.63+i*3.23
        p.text('metrics',label,x,1.45,.04,.113)
        p.text('metrics',value,x,.96,.04,.365,'white',True)
        p.text('metrics',delta,x+.70,1.06,.04,.108)
        if i<2:p.line('metrics',[(x+2.95,.98,.034),(x+2.95,1.58,.034)],'trace',.002)
    p.panel('records',1.13,-1.34,9.58,3.79,'nav')
    p.text('records','Trabajo en curso',-3.45,.17,.04,.172,'white',True)
    for x,label in [(-.94,'Todas'),(.04,'Mi equipo'),(1.37,'Prioridad')]:p.pill('records',label,x,.20,.86 if label!='Mi equipo' else 1.17,'selection' if label=='Todas' else 'nav',size=.103)
    p.rounded('records',4.64,.24,.025,2.10,.30,.003,'shell',.034)
    p.glyph('records','search',3.72,.19,'muted',.12);p.text('records','Buscar una solicitud',3.94,.20,.04,.104)
    for x,label in [(-3.44,'SOLICITUD'),(.39,'EQUIPO'),(2.27,'ESTADO'),(4.28,'ENTREGA')]:p.text('records',label,x,-.29,.04,.093)
    rows=[('0248','Conectar la nueva sede','Redes','En revisión','Hoy','ER'),('0247','Portal de clientes','Producto','En ejecución','12 oct','PR'),('0246','Sincronizar el inventario','Integraciones','Verificada','10 oct','IN'),('0245','Altas y permisos de acceso','Plataforma','Verificada','09 oct','PL'),('0244','Revisar la trazabilidad','Datos','En ejecución','13 oct','DT'),('0243','Publicar la nueva versión','Producto','Programada','14 oct','PR')]
    for i,(number,name,team,state,date,initials) in enumerate(rows):
        g='selection' if i==0 else 'records';y=-.71-i*.41
        if i==0:p.rounded(g,1.14,y+.046,.033,9.18,.36,.005,'selection',.028);p.box(g,-3.43,y+.04,.039,.018,.26,.002,'red')
        p.text(g,number,-3.25,y,.047,.102)
        p.text(g,name,-2.68,y,.047,.131,'white')
        p.rounded(g,.48,y+.04,.037,.20,.20,.003,'avatar' if i==0 else 'shell',.10)
        p.text(g,initials,.417,y+.010,.048,.080,'white');p.text(g,team,.66,y,.047,.107)
        p.dot(g,2.40,y+.043,.018,'warm' if i==0 else 'sage' if state=='Verificada' else 'muted')
        p.text(g,state,2.52,y,.047,.11,'warm' if i==0 else 'muted');p.text(g,date,4.32,y,.047,.105)
        for j in range(3):p.dot(g,5.44+j*.046,y+.041,.007)
        if i<5:p.line('records',[(-3.44,y-.178,.033),(5.67,y-.178,.033)],'trace',.0018)
    p.text('records','6 de 24 solicitudes',-3.44,-3.045,.04,.095)
    p.text('records','1 — 6    /    24',4.87,-3.045,.04,.095)
    # The selected record opens into a floating, spatially related inspector.
    p.panel('detail',3.5,-1.14,3.8,4.75,'detail')
    p.text('detail','SOLICITUD / 0248',1.87,.94,.04,.107,'warm',True)
    p.glyph('detail','close',4.95,.90,'muted',.10)
    p.text('detail','Conectar la nueva sede',1.87,.58,.04,.215,'white',True)
    p.text('detail','El alcance se transforma en una entrega.',1.88,.28,.04,.108)
    p.line('detail',[(1.87,.04,.032),(5.12,.04,.032)],'trace',.002)
    for i,(label,value) in enumerate([('Estado','En revisión'),('Responsable','Equipo de redes'),('Proyecto','Nueva sede'),('Prioridad','Alta / continuidad')]):
        y=-.25-i*.31;p.text('detail',label,1.88,y,.04,.11);p.text('detail',value,3.15,y,.04,.12,'white')
    p.text('detail','ALCANCE Y EVIDENCIA',1.88,-1.65,.04,.098)
    for i,label in enumerate(['Puestos y enlaces identificados','Dependencias verificadas','Plan de entrega documentado']):
        y=-1.97-i*.28;p.glyph('detail','check',1.90,y+.004,'sage',.11);p.text('detail',label,2.12,y,.04,.11,'white')
    p.rounded('detail',4.12,-3.002,.027,1.98,.42,.010,'red',.06)
    p.text('detail','Actualizar solicitud',3.30,-3.055,.047,.132,'buttonink',True)
    p.text('detail','Borrador guardado',1.89,-3.053,.04,.103)
    # Rules are an actual execution trace, with a contract and run results.
    p.panel('logic',0,0,10.8,3.36,'nav')
    p.text('logic','02 / REGLAS E INTEGRACIONES',-5.04,1.29,.04,.17,'white',True)
    p.pill('logic','PATCH',2.21,1.31,.62,'selection',size=.098)
    p.text('logic','/solicitudes/0248',2.97,1.31,.04,.124,'warm')
    p.line('logic',[(-5.02,.99,.035),(5.04,.99,.035)],'trace',.002)
    for i,(name,sub,ms) in enumerate([('Validar entrada','Campos y alcance','12 ms'),('Evaluar permisos','Rol · equipo_redes','08 ms'),('Aplicar contrato','Solicitud · versión 04','21 ms'),('Registrar evento','Traza · 0248.04','04 ms')]):
        x=-4.96+i*2.55
        p.rounded('logic',x+.11,.44,.04,.23,.23,.002,'selection',.115)
        p.text('logic',name,x+.32,.40,.04,.133,'white',True)
        p.text('logic',sub,x+.32,.09,.04,.111)
        p.text('logic',ms,x+.32,-.25,.04,.106,'muted')
        p.line('logic',[(x+.12,-.54,.04),(x+2.47,-.54,.04)],'trace',.004)
        p.dot('logic',x+.12,-.54,.024,'red')
    p.text('logic','EVENTO 0248.04',-5.02,-1.22,.04,.095)
    p.text('logic','Entrada validada → autorización → persistencia → respuesta',-3.20,-1.22,.04,.11)
    # Data is a relational record with columns, types and an immutable trace.
    p.panel('data',0,0,10.8,3.26,'nav')
    p.text('data','03 / DATOS Y TRAZABILIDAD',-5.04,1.25,.04,.17,'white',True)
    p.text('data','Solicitud 0248 · versión 04',2.95,1.27,.04,.108,'warm')
    for x,label in [(-5.04,'CAMPO'),(-2.43,'VALOR'),(.14,'TIPO'),(1.7,'REGISTRO DEL CAMBIO')]:p.text('data',label,x,.71,.04,.093)
    for i,(key,val,kind) in enumerate([('solicitud.id','0248','string'),('solicitud.estado','confirmada','enum'),('responsable.equipo','redes','relation'),('solicitud.version','04','integer')]):
        y=.29-i*.33;p.text('data',key,-5.04,y,.04,.119,'white');p.text('data',val,-2.43,y,.04,.118,'warm' if i==1 else 'muted');p.text('data',kind,.14,y,.04,.098);p.line('data',[(-5.04,y-.12,.033),(1.20,y-.12,.033)],'trace',.0018)
    p.line('data',[(1.40,.79,.033),(1.40,-1.19,.033)],'trace',.002)
    for i,(time,label) in enumerate([('10:42:01','Solicitud recibida'),('10:42:01','Permisos verificados'),('10:42:02','Cambio confirmado')]):
        y=.28-i*.49;p.dot('data',1.83,y+.04,.022,'red' if i==2 else 'muted');p.text('data',time,2.01,y,.04,.092);p.text('data',label,2.99,y,.04,.113,'white')
        if i<2:p.line('data',[(1.83,y-.06,.034),(1.83,y-.35,.034)],'trace',.002)
    # Runtime reads like a compact deployment monitor, not four title cards.
    p.panel('runtime',0,0,10.8,2.46,'nav')
    p.text('runtime','04 / ENTREGA Y OPERACIÓN',-5.04,.83,.04,.17,'white',True)
    p.pill('runtime','v1.4.0',3.11,.87,.69,'selection',size=.105);p.dot('runtime',4.13,.90,.025,'sage');p.text('runtime','Operativa',4.27,.861,.04,.11,'white')
    for i,(name,sub) in enumerate([('Verificar','Pruebas completas'),('Versionar','Cambio identificado'),('Publicar','Entorno aislado'),('Observar','Señales en contexto')]):
        x=-4.97+i*2.59;p.dot('runtime',x+.065,.038,.027,'trace');p.text('runtime',name,x+.29,-.02,.04,.145,'white',True);p.text('runtime',sub,x+.29,-.33,.04,.108)
        if i<3:p.line('runtime',[(x+1.72,-.026,.04),(x+2.37,-.026,.04)],'trace',.005)
    p.line('runtime',[(-4.99,-.72,.04),(5.05,-.72,.04)],'trace',.002)
    # Optical-thin inspection guides tie the product to its internal structure.
    for g,w,d in [('logic',10.8,3.36),('data',10.8,3.26),('runtime',10.8,2.46)]:
        x=w/2;y=d/2
        for sx,sy in [(-1,-1),(-1,1),(1,-1),(1,1)]:
            p.line(g,[(sx*(x-.20),sy*y,.043),(sx*x,sy*y,.043),(sx*x,sy*(y-.20),.043)],'warm',.003)
    return p

def projected(p,t):
    size,angle,target,shift=camera_pose(t)
    xs=[];ys=[]
    for group,points in p.points.items():
        dx,dy,dz=placement(group,t)
        for x,y,z in points:
            xs.append(.5+(x+dx-target[0])/size)
            ys.append(.5+(y+dy-target[1])*16/9/size)
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
    # During each explanatory hold the preceding surface must clear the title.
    # Camera bounds alone cannot catch a foreground plane covering that layer.
    for active,previous in [('logic','shell'),('data','logic'),('runtime','data')]:
        start,end=FOCUS_WINDOWS[active]
        for i in range(31):
            t=start+(end-start)*i/30
            b=projected(SimpleNamespace(points={active:p.points[active]}),t)
            c=projected(SimpleNamespace(points={previous:p.points[previous]}),t)
            assert c[1]>b[3]+.008,('foreground occlusion',active,previous,t,b,c)
    assert operation(0)==operation(1)
    assert all(a<=b for a,b in zip(operation(.415)['rules'][1:],operation(.415)['rules'][:-1]))
    assert all(v==1 for v in operation(.50)['rules'])
    assert not operation(.58)['confirmed'] and operation(.61)['confirmed']
    assert all(v==1 for v in operation(.79)['release'])

    print(json.dumps({'scene':'software-system-v7','frames':FRAMES,'bounds':extent,'components':len(p.boxes),'labels':len(p.texts),'focus_windows':FOCUS_WINDOWS,'wide_times':WIDE_TIMES}))

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
    palette={'avatar':'#D0DFE8','sage':'#387C64','bluegrey':'#426E8C','shell':'#F5F4F0','nav':'#ECEFEF','panel':'#FFFFFF','detail':'#FFFFFF','edge':'#C4CCD0','paper':'#F4F3EF','white':'#222A32','ink':'#1A1B1E','muted':'#606E79','selection':'#DCE8EF','active':'#F6E5E0','warm':'#AC3934','red':'#DC2626','trace':'#C4CDD1','floor':'#11151C','buttonink':'#FFFFFF'}
    mats={}
    for name,hexvalue in palette.items():
        rgb=[int(hexvalue[i:i+2],16)/255 for i in [1,3,5]];rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        mat=bpy.data.materials.new(name);mat.diffuse_color=(*rgb,1);mat.use_nodes=True;n=mat.node_tree.nodes['Principled BSDF']
        # A display emits its authored colour. Only the broad substrates receive
        # a restrained diffuse term; glyphs never become embossed metal letters.
        graphic=name in ('white','muted','warm','red','sage','bluegrey','trace','avatar','selection','active','floor','buttonink')
        n.inputs['Base Color'].default_value=(*(0 if graphic else v*.18 for v in rgb),1)
        n.inputs['Roughness'].default_value=1;n.inputs['Metallic'].default_value=0
        n.inputs['Specular IOR Level'].default_value=0
        n.inputs['Emission Color'].default_value=(*rgb,1)
        n.inputs['Emission Strength'].default_value=1 if graphic else .82
        if graphic:
            light=mat.node_tree.nodes.new('ShaderNodeLightPath')
            transparent=mat.node_tree.nodes.new('ShaderNodeBsdfTransparent')
            mix=mat.node_tree.nodes.new('ShaderNodeMixShader')
            mat.node_tree.links.new(light.outputs['Is Shadow Ray'],mix.inputs[0])
            mat.node_tree.links.new(n.outputs[0],mix.inputs[1]);mat.node_tree.links.new(transparent.outputs[0],mix.inputs[2])
            mat.node_tree.links.new(mix.outputs[0],mat.node_tree.nodes['Material Output'].inputs['Surface'])
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
        obj=bpy.data.objects.new(s,text);scene.collection.objects.link(obj);obj.parent=parents[g];obj.location=(x,y,z);text.materials.append(mats[m]);labels.setdefault((g,s),[]).append(text)
    def curve(name,pts,mat,radius):
        data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=2
        spline=data.splines.new('POLY');spline.points.add(len(pts)-1)
        for v,xyz in zip(spline.points,pts):v.co=(*xyz,1)
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);data.materials.append(mats[mat]);return obj,spline
    for g,pts,m,radius in p.lines:obj,_=curve('Interface connector',pts,m,radius);obj.parent=parents[g]
    # Geometry stays attached to its product layer. Progress has a visible cause,
    # small enough to read as interface behaviour instead of decorative light.
    pulses=[];completion_marks=[]
    for kind,group,count in [('rules','logic',4),('writes','data',3),('release','runtime',4)]:
        for i in range(count):
            if kind=='rules':
                x=-4.96+i*2.55;pts=[(x+.12,-.54,.052),(min(5.04,x+2.67),-.54,.052)]
                at=(x+.035,.394,.052);ink='warm'
            elif kind=='writes':
                pts=[(1.83,.32-i*.49,.052),(1.83,.32-(i+1)*.49,.052)]
                at=(1.787,.28-i*.49,.052);ink='sage'
            else:
                x=-4.97+i*2.59;pts=[(x,-.72,.052),(min(5.05,x+2.59),-.72,.052)]
                at=(x,-.02,.052);ink='sage'
            obj,_=curve('Progress / '+kind+' / '+str(i),pts,ink,.006)
            obj.parent=parents[group];pulses.append((kind,i,obj))
            xx,yy,zz=at
            mark,_=curve('Completed / '+kind+' / '+str(i),[(xx,yy+.044,zz),(xx+.033,yy+.011,zz),(xx+.099,yy+.088,zz)],ink,.005)
            mark.parent=parents[group];completion_marks.append((kind,i,mark))
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.16));bpy.context.object.data.materials.append(mats['floor'])
    for name,xyz,energy,size,color in [('Key',(-4,1,15),1300,12,(1,1,1)),('Edge',(5,9,8),650,10,(1,1,1)),('Fill',(0,-10,12),750,12,(1,1,1))]:
        data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=xyz;obj.rotation_euler=(Vector((0,0,2))-obj.location).to_track_quat('-Z','Y').to_euler()
    camera=bpy.data.cameras.new('Interface into architecture');camera.type='ORTHO';camera.sensor_fit='HORIZONTAL';camera.clip_end=200
    cam=bpy.data.objects.new('Interface into architecture',camera);scene.collection.objects.link(cam);scene.camera=cam
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[];bounds=[];focus_bounds=[];handler_errors=[]
    def update_frame(scene):
        frame=scene.frame_current
        t=frame/(FRAMES-1);size,angle,target,shift=camera_pose(t);target=Vector(target)
        camera.ortho_scale=size
        cam.location=target+Vector((0,0,50));cam.rotation_euler=(0,0,0);camera.shift_x=0
        for name,obj in parents.items():
            obj.location=placement(name,t);obj.scale=(scale(name,t),)*3
            if name in ('logic','data','runtime'):
                for child in obj.children:child.hide_render=reveal(t)<.01
        for child in parents['detail'].children:child.hide_render=not (.14<t<.97)
        event=operation(t);confirmed=event['confirmed']
        states={('detail','Actualizar solicitud'):'Cambios guardados' if confirmed else 'Actualizar solicitud',
                ('detail','En revisión'):'Confirmada' if confirmed else 'En revisión',
                ('selection','En revisión'):'Confirmada' if confirmed else 'En revisión',
                ('metrics','24'):'23' if confirmed else '24',('metrics','16'):'17' if confirmed else '16',
                ('data','confirmada'):'confirmada' if confirmed else 'en revisión',
                ('data','04'):'04' if confirmed else '03',
                ('data','Solicitud 0248 · versión 04'):'Solicitud 0248 · versión 04' if confirmed else 'Solicitud 0248 · versión 03'}
        for key,value in states.items():
            for label in labels.get(key,[]):label.body=value
        for kind,i,obj in pulses:
            progress=event[kind][i];obj.data.bevel_factor_end=max(.0001,progress)
            obj.hide_render=progress<.001 or reveal(t)<.01
        for kind,i,obj in completion_marks:
            obj.hide_render=event[kind][i]<.98 or reveal(t)<.01
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
        info={'service':'104','scene':'software-system-v7','blender':bpy.app.version_string,'engine':scene.render.engine,
              'samples':args.samples,'frames':FRAMES,'fps':FPS,'resolution':[scene.render.resolution_x,scene.render.resolution_y],
              'camera':'front-facing rectilinear product: selected record, inspector, execution trace, relational history and release operation',
              'render_mode':'one persistent native animation render','antialiasing':scene.display.render_aa if args.engine=='workbench' else args.samples,'lighting':'flat product surfaces' if args.engine=='workbench' else 'emissive interface with soft substrate shadows','authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'font_sha256':{w:hashlib.sha256((font_dir/('UMSans-'+w+'.ttf')).read_bytes()).hexdigest() for w in ['Regular','SemiBold']},'timings':timings,'bounds':bounds,'focus_bounds':focus_bounds,'focus_windows':FOCUS_WINDOWS,'wide_times':WIDE_TIMES,'handler_errors':handler_errors}
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
