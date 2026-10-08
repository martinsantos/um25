"""Software as a constructed product: native components and inspection volumes.
Render only on disposable GitHub Actions workers. No local Blender required.
"""
import argparse,hashlib,json,math,sys,time
from pathlib import Path
FPS=60
FRAMES=1440

def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)

def reveal(t):return ease((t-.07)/.12)*(1-ease((t-.86)/.14))

CENTERS={'connection':(-2.25,1.10),'mapping':(3.68,1.10),'data':(-2.25,-2.48),'runtime':(3.68,-2.48)}
FOCUS_WINDOWS={'connection':(.17,.26),'mapping':(.39,.46),'data':(.58,.64),'runtime':(.74,.80)}
WIDE_TIMES=(0,1)

def placement(group,t):
    e=reveal(t)
    if group in CENTERS:
        x,y=CENTERS[group]
        # Components remain registered to the same application. Only genuine
        # depth separates them; no non-uniform scaling or synthetic skew.
        depths={'connection':1.30,'mapping':1.0,'data':.85,'runtime':1.15}
        return (x,y,.065+depths[group]*e)
    return (0,0,0)

def scale(group,t):return 1

def camera_pose(t):
    # scale, aim, x/y camera inclination, optical roll (degrees).
    keys=[(0,17.8,(0,-.1,.1),(5,-11,-1.5)),
          (.13,9.55,(-2.25,1.22,1.30),(9,-17,-3.0)),
          (.27,8.75,(-2.22,1.04,1.30),(6,-18,-2.2)),
          (.37,9.60,(3.65,1.23,1.10),(-7,-16,2.0)),
          (.47,8.9,(3.70,1.03,1.10),(-5,-18,2.8)),
          (.56,9.6,(-2.30,-2.42,.95),(8,-16,-2)),
          (.65,8.8,(-2.17,-2.52,.95),(5,-18,-2.5)),
          (.72,9.65,(3.65,-2.38,1.25),(-7,-16,2)),
          (.81,8.9,(3.69,-2.57,1.25),(-4,-18,2.5)),
          (.92,17.9,(0,-.1,.35),(7,-14,-2)),
          (1,17.8,(0,-.1,.1),(5,-11,-1.5))]
    a,b=keys[0],keys[-1]
    for left,right in zip(keys,keys[1:]):
        if left[0]<=t<=right[0]:a,b=left,right;break
    q=ease((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*q
    return mix(a[1],b[1]),tuple(mix(x,y) for x,y in zip(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3]))

def camera_basis(t):
    size,target,angles=camera_pose(t)
    # Basis matches Blender's track -Z/Y plus a roll about local Z.
    ax,ay,roll=[math.radians(a) for a in angles]
    normal=(math.tan(ax),math.tan(ay),1)
    n=math.sqrt(sum(v*v for v in normal));normal=tuple(v/n for v in normal)
    right=(normal[2],0,-normal[0]);n=math.sqrt(sum(v*v for v in right));right=tuple(v/n for v in right)
    up=(normal[1]*right[2]-normal[2]*right[1],normal[2]*right[0]-normal[0]*right[2],normal[0]*right[1]-normal[1]*right[0])
    c,s=math.cos(roll),math.sin(roll)
    return size,target,tuple(c*r+s*u for r,u in zip(right,up)),tuple(-s*r+c*u for r,u in zip(right,up)),normal

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


class Interface(Product):
    def label(self,g,s,x,y,size=.19,ink='ink',bold=False):self.text(g,s,x,y,.071,size,ink,bold)
    def divider(self,g,x1,x2,y):self.line(g,[(x1,y,.040),(x2,y,.040)],'trace',.0022)
    def card(self,g,w=5.42,h=3.20):
        # A broad, graded penumbra below the entire surface, not glyph bevels.
        for i in range(24,0,-1):
            spread=i*.011
            self.rounded(g,.045,-.073,-.030+(24-i)*.0001,w+spread*2,h+spread*2,.00005,'shadow%02d'%i,.14+spread)
        self.rounded(g,0,0,-.016,w,h,.016,'edge',.12)
        self.rounded(g,0,0,.000,w-.020,h-.020,.018,'panel',.11)
    def field(self,g,label,value,x,y,w,icon=None):
        self.label(g,label,x,y,.15,'muted')
        self.rounded(g,x+w/2,y-.33,.026,w,.43,.004,'inputedge',.064)
        self.rounded(g,x+w/2,y-.322,.032,w-.014,.41,.003,'input',.058)
        self.label(g,value,x+.14,y-.384,.185)
        if icon:self.glyph(g,icon,x+w-.28,y-.36,'muted',.14)
    def badge(self,g,label,x,y,w,fill='mint',ink='green'):
        self.rounded(g,x+w/2,y+.043,.038,w,.29,.003,fill,.145)
        self.label(g,label,x+.115,y,.135,ink,True)
    def toggle(self,g,x,y,on=True):
        self.rounded(g,x,y,.036,.39,.22,.004,'green' if on else 'trace',.11)
        self.dot(g,x+(.085 if on else -.085),y,.082,'panel',.043)
    def mark(self,g,kind,x,y,size=.42,fill='blue'):
        self.rounded(g,x,y,.027,size,size,.009,fill,.11)
        ink='buttonink';r=size*.55
        if kind=='erp':
            for dx,dy in [(-.26,-.26),(.07,-.26),(-.26,.07),(.07,.07)]:self.rounded(g,x+dx*r,y+dy*r,.052,r*.24,r*.24,.002,ink,.012)
        elif kind=='api':
            for sign in [-1,1]:self.line(g,[(x+sign*r*.20,y+r*.24,.056),(x+sign*r*.42,y,.056),(x+sign*r*.20,y-r*.24,.056)],ink,.010)
            self.line(g,[(x-.05,y-.10,.056),(x+.05,y+.10,.056)],ink,.009)
        elif kind=='db':
            for yy in [-.13,.00,.13]:
                pts=[(x+math.cos(i*math.tau/40)*size*.28,y+yy+math.sin(i*math.tau/40)*size*.09,.056) for i in range(41)]
                self.line(g,pts,ink,.008)
            for xx in [-size*.28,size*.28]:self.line(g,[(x+xx,y-.13,.056),(x+xx,y+.13,.056)],ink,.007)
        elif kind=='wave':
            self.line(g,[(x-r*.4,y,.056),(x-r*.2,y,.056),(x-r*.04,y+r*.29,.056),(x+r*.1,y-r*.25,.056),(x+r*.24,y,.056),(x+r*.43,y,.056)],ink,.010)
    def inspection(self,g,w=5.42,h=3.20):
        x=w/2+.055;y=h/2+.055
        self.line(g,[(-x,-y,.024),(x,-y,.024),(x,y,.024),(-x,y,.024),(-x,-y,.024)],'guide',.0045)
        for xx,yy in [(-x,-y),(x,-y),(x,y),(-x,y)]:self.dot(g,xx,yy,.022,'guide',.030)
        # Optical sizing ticks around actual UI controls, restrained and exact.
        for xx in [-2.43,2.43]:
            self.line(g,[(xx,1.32,.082),(xx,1.44,.082)],'guidefine',.0025)
        self.line(g,[(-2.43,1.40,.080),(2.43,1.40,.080)],'guidefine',.002)


def build():
    p=Interface()
    p.rounded('shell',0,0,-.10,16,10.0,.028,'shell',.16)
    p.rounded('shell',0,4.55,-.025,15.95,.88,.01,'nav',.14)
    p.label('shell','UM',-7.48,4.44,.24,'red',True)
    p.label('shell','Workspace',-6.86,4.45,.195,'ink',True)
    p.label('shell','/  Operaciones',-5.39,4.46,.17,'muted')
    p.rounded('shell',1.1,4.52,.02,4.0,.42,.002,'inputedge',.09)
    p.glyph('shell','search',-.70,4.466,'muted',.18);p.label('shell','Buscar en tu espacio',-.37,4.46,.16,'muted')
    p.badge('shell','Producción',5.02,4.45,1.16)
    p.dot('shell',7.03,4.52,.19,'avatar');p.label('shell','UM',6.914,4.47,.12,'blue',True)
    p.divider('shell',-7.98,7.98,4.08)
    p.rounded('shell',-6.62,-.4,-.02,2.65,8.92,.01,'nav',.01)
    p.label('navigation','ORGANIZACIÓN',-7.54,3.58,.125,'muted',True)
    for i,(label,icon) in enumerate([('Resumen','grid'),('Proyectos','folder'),('Integraciones','node'),('Actividad','clock'),('Configuración','list')]):
        y=2.98-i*.61
        if i==2:p.rounded('navigation',-6.61,y+.073,.029,2.27,.47,.008,'selected',.07)
        p.glyph('navigation',icon,-7.49,y+.014,'blue' if i==2 else 'muted',.22)
        p.label('navigation',label,-7.12,y,.185,'blue' if i==2 else 'ink',i==2)
    p.label('navigation','ENTORNOS',-7.54,-.71,.125,'muted',True)
    for i,(label,ink) in enumerate([('Producción','green'),('Preproducción','amber'),('Desarrollo','blue')]):
        y=-1.23-i*.47;p.dot('navigation',-7.40,y+.055,.039,ink);p.label('navigation',label,-7.12,y,.17,'muted')
    p.divider('navigation',-7.51,-5.68,-3.43)
    p.mark('navigation','wave',-7.28,-3.88,.38,'green');p.label('navigation','Todo en línea',-6.93,-3.84,.17,'ink',True);p.label('navigation','4 servicios conectados',-6.93,-4.09,.125,'muted')
    p.label('heading','PLATAFORMA / INTEGRACIONES',-4.92,3.65,.12,'muted',True)
    p.label('heading','Tu operación, conectada.',-4.92,3.13,.39,'ink',True)
    p.label('heading','Un mismo dato. Todos tus equipos sincronizados.',-4.91,2.82,.165,'muted')
    p.rounded('heading',5.30,3.39,.025,2.17,.48,.010,'red',.07)
    p.glyph('heading','plus',4.39,3.338,'buttonink',.15);p.label('heading','Nueva conexión',4.66,3.323,.175,'buttonink',True)
    # 01 — The connection component is a complete settings form.
    g='connection';p.card(g);p.mark(g,'erp',-2.18,1.19,.49,'blue')
    p.label(g,'Inventario / ERP',-1.79,1.17,.25,'ink',True);p.label(g,'Conexión segura con tus sistemas',-1.79,.89,.15,'muted');p.badge(g,'Conectado',1.24,1.20,1.19)
    p.divider(g,-2.43,2.43,.64)
    p.field(g,'Entorno','Producción',-2.42,.32,2.30,'list');p.field(g,'Autenticación','Token de servicio',.12,.32,2.30,'check')
    p.field(g,'Endpoint de la API','api.empresa.com / v1 / stock',-2.42,-.57,4.84,'close')
    p.dot(g,-2.36,-1.32,.031,'green');p.label(g,'TLS activo',-2.23,-1.38,.15,'green');p.label(g,'Última sincronización · ahora',-.66,-1.38,.15,'muted');p.toggle(g,2.18,-1.32)
    # 02 — Field mapping uses nested editable rows and ports, not four title cards.
    g='mapping';p.card(g);p.mark(g,'api',-2.18,1.19,.49,'violet')
    p.label(g,'Mapeo de campos',-1.79,1.17,.25,'ink',True);p.label(g,'El mismo significado en cada sistema',-1.79,.89,.15,'muted');p.badge(g,'4 reglas',1.47,1.20,.94,'lavender','violet')
    p.label(g,'ORIGEN / ERP',-2.39,.42,.12,'muted',True);p.label(g,'DESTINO / PLATAFORMA',.46,.42,.12,'muted',True)
    for i,(source,target,typ) in enumerate([('item.code','producto.sku','string'),('item.name','producto.nombre','text'),('warehouse.qty','stock.disponible','integer'),('updated_at','evento.fecha','date')]):
        y=.015-i*.367
        for x,w in [(-1.38,2.10),(1.34,2.18)]:p.rounded(g,x,y+.035,.030,w,.296,.005,'input',.045)
        p.label(g,source,-2.27,y-.014,.16,'ink');p.label(g,target,.39,y-.014,.16,'ink')
        p.dot(g,-.31,y+.039,.030,'violet');p.dot(g,.21,y+.039,.030,'violet')
        p.line(g,[(-.28,y+.039,.05),(.18,y+.039,.05)],'guidefine',.0035)
        p.line(g,[(.10,y+.10,.052),(.19,y+.039,.052),(.10,y-.022,.052)],'violet',.0045)
    p.label(g,'Validación de tipos',-2.39,-1.38,.15,'muted');p.glyph(g,'check',1.07,-1.352,'green',.16);p.label(g,'Compatible',1.32,-1.38,.15,'green',True)
    # 03 — A relational record, visible types, row selection and a real payload.
    g='data';p.card(g);p.mark(g,'db',-2.18,1.19,.49,'teal')
    p.label(g,'Datos sincronizados',-1.79,1.17,.25,'ink',True);p.label(g,'Una fuente de verdad, con trazabilidad',-1.79,.89,.15,'muted');p.badge(g,'En vivo',1.49,1.20,.95)
    p.rounded(g,0,.40,.029,4.85,.35,.003,'nav',.03)
    for x,label in [(-2.29,'SKU'),(-1.13,'PRODUCTO'),(1.32,'STOCK')]:p.label(g,label,x,.36,.115,'muted',True)
    rows=[('SW-024','Switch administrable','128'),('AP-006','Punto de acceso','64'),('FO-012','Módulo de fibra','256')]
    for i,(code,name,stock) in enumerate(rows):
        y=-.09-i*.40
        if i==0:p.rounded(g,0,y+.05,.032,4.85,.38,.003,'selected',.027);p.box(g,-2.419,y+.05,.039,.018,.37,.003,'blue')
        p.label(g,code,-2.29,y,.16,'blue' if i==0 else 'muted');p.label(g,name,-1.13,y,.175,'ink',i==0);p.label(g,stock,1.54,y,.18,'ink',True)
        p.glyph(g,'check',2.17,y+.015,'green',.14)
        if i<2:p.divider(g,-2.40,2.40,y-.155)
    p.dot(g,-2.36,-1.33,.031,'green');p.label(g,'3 registros verificados',-2.23,-1.39,.15,'green');p.label(g,'Evento #0248',1.05,-1.39,.15,'muted')
    # 04 — Runtime includes a fine chart, task states and operational evidence.
    g='runtime';p.card(g);p.mark(g,'wave',-2.18,1.19,.49,'green')
    p.label(g,'Actividad y control',-1.79,1.17,.25,'ink',True);p.label(g,'Lo que ocurre, visible y verificable',-1.79,.89,.15,'muted');p.badge(g,'Estable',1.46,1.20,.98)
    for i,(value,label) in enumerate([('42 ms','Respuesta'),('99,9 %','Disponibilidad'),('0','Errores')]):
        x=-2.40+i*1.69;p.label(g,value,x,.33,.29,'ink',True);p.label(g,label,x,.04,.135,'muted')
    for j in range(3):p.line(g,[(-2.40,-.27-j*.20,.039),(2.42,-.27-j*.20,.039)],'trace',.0018)
    chart=[]
    for i in range(100):
        x=-2.4+4.8*i/99;y=-.57+.064*math.sin(i*.34)+.031*math.sin(i*.89)+(.21*math.exp(-((i-64)/5)**2));chart.append((x,y,.061))
    p.line(g,chart,'green',.007)
    p.dot(g,chart[-1][0],chart[-1][1],.027,'green',.065)
    for i,(stamp,label) in enumerate([('10:42:01','Entrada validada'),('10:42:02','Inventario actualizado')]):
        y=-1.015-i*.32;p.glyph(g,'check',-2.37,y+.015,'green',.14);p.label(g,stamp,-2.08,y,.137,'muted');p.label(g,label,-.91,y,.17,'ink')
    for g in CENTERS:p.inspection(g)
    p.label('footer','DISEÑO DE INTERFAZ  /  LÓGICA  /  DATOS  /  OPERACIÓN',-4.92,-4.56,.12,'muted')
    p.label('footer','Concepto UM · datos de demostración',3.16,-4.56,.115,'muted')
    return p

def projected(p,t):
    size,target,right,up,normal=camera_basis(t);xs=[];ys=[]
    for group,points in p.points.items():
        dx,dy,dz=placement(group,t)
        for x,y,z in points:
            v=(x+dx-target[0],y+dy-target[1],z+dz-target[2])
            xs.append(.5+sum(a*b for a,b in zip(v,right))/size)
            ys.append(.5+sum(a*b for a,b in zip(v,up))*16/9/size)
    return [min(xs),min(ys),max(xs),max(ys)]

def validate():
    from types import SimpleNamespace
    p=build()
    for g,pts in p.points.items():
        low=[min(v[i] for v in pts) for i in range(3)];high=[max(v[i] for v in pts) for i in range(3)]
        p.points[g]=[(x,y,z) for x in [low[0],high[0]] for y in [low[1],high[1]] for z in [low[2],high[2]]]
    bounds=[projected(p,i/(FRAMES-1)) for i in range(FRAMES)]
    extent=[min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)]
    assert all(math.isfinite(v) for v in extent)
    for g in p.points:assert placement(g,0)==placement(g,1)
    assert camera_pose(0)==camera_pose(1)
    for group,(start,end) in FOCUS_WINDOWS.items():
        for i in range(61):
            t=start+(end-start)*i/60;b=projected(SimpleNamespace(points={group:p.points[group]}),t)
            assert min(b[:2])>.035 and max(b[2:])<.965,(group,t,b)
    print(json.dumps({'scene':'software-system-v8','frames':FRAMES,'bounds':extent,'labels':len(p.texts),'surfaces':len(p.meshes),'focus_windows':FOCUS_WINDOWS,'wide_times':WIDE_TIMES}))

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
    palette={'avatar':'#DCE7F0','sage':'#217761','bluegrey':'#476577','shell':'#F3F5F7','nav':'#EAEFF3','panel':'#FFFFFF','detail':'#FFFFFF','edge':'#C0CDD8','paper':'#FFFFFF','white':'#172B3D','ink':'#172B3D','muted':'#62768A','selection':'#E5EFFB','selected':'#E6F0FC','active':'#F9E7E2','warm':'#AE3C30','red':'#DC2626','trace':'#D2DDE6','floor':'#D9E1E9','buttonink':'#FFFFFF','input':'#F5F8FB','inputedge':'#CAD6E1','blue':'#315ED0','violet':'#7860B5','teal':'#237F91','green':'#267C65','amber':'#B37C29','mint':'#E3F3EB','lavender':'#F0EAF9','guide':'#477AC0','guidefine':'#A3BDE0'}
    for i in range(1,25):
        # Layered opaque penumbra against the known canvas, clean in Workbench.
        q=i/24;rgb=tuple(round(a+(b-a)*q*q) for a,b in [(191,243),(205,245),(216,247)])
        palette['shadow%02d'%i]='#%02x%02x%02x'%rgb
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
    volumes=[];routes=[]
    for g in CENTERS:
        x=5.42/2+.055;y=3.20/2+.055
        for xx,yy in [(-x,-y),(x,-y),(x,y),(-x,y)]:
            obj,spline=curve('Inspection / '+g,[(xx,yy,0),(xx,yy,-1)],'guidefine',.003)
            obj.parent=parents[g];volumes.append((g,obj,spline))
        obj,spline=curve('Registration / '+g,[(-x,-y,-1),(x,-y,-1),(x,y,-1),(-x,y,-1),(-x,-y,-1)],'guidefine',.003)
        obj.parent=parents[g];volumes.append((g,obj,spline))
    for a,b in [('connection','mapping'),('mapping','runtime'),('runtime','data')]:
        obj,spline=curve('System relationship / '+a+' / '+b,[(0,0,0)]*4,'guide',.007)
        routes.append((a,b,obj,spline))
    # A slim inspection handle follows the mapped field. It is attached to the
    # actual control, not a separate decorative pane or a full-screen overlay.
    tracked=[]
    for i in range(4):
        y=.015-i*.367
        obj,spline=curve('Type validation / '+str(i),[(-.28,y+.039,.063),(.18,y+.039,.063)],'violet',.010)
        obj.parent=parents['mapping'];tracked.append((i,obj))
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.16));bpy.context.object.data.materials.append(mats['floor'])
    for name,xyz,energy,size,color in [('Key',(-4,1,15),1300,12,(1,1,1)),('Edge',(5,9,8),650,10,(1,1,1)),('Fill',(0,-10,12),750,12,(1,1,1))]:
        data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=xyz;obj.rotation_euler=(Vector((0,0,2))-obj.location).to_track_quat('-Z','Y').to_euler()
    camera=bpy.data.cameras.new('Interface into architecture');camera.type='ORTHO';camera.sensor_fit='HORIZONTAL';camera.clip_end=200
    cam=bpy.data.objects.new('Interface into architecture',camera);scene.collection.objects.link(cam);scene.camera=cam
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[];bounds=[];focus_bounds=[];handler_errors=[]
    def update_frame(scene):
        frame=scene.frame_current
        t=frame/(FRAMES-1);size,target,angles=camera_pose(t);target=Vector(target)
        camera.ortho_scale=size
        _,_,right,up,normal=camera_basis(t)
        from mathutils import Matrix
        cam.location=target+Vector(normal)*50
        cam.rotation_euler=Matrix((right,up,normal)).transposed().to_euler();camera.shift_x=0
        for name,obj in parents.items():obj.location=placement(name,t);obj.scale=(1,1,1)
        for g,obj,spline in volumes:
            dz=placement(g,t)[2]
            for vertex in spline.points:
                if vertex.co.z<0:vertex.co.z=.02-dz
            obj.hide_render=reveal(t)<.015
        for a,b,obj,spline in routes:
            ax,ay,az=placement(a,t);bx,by,bz=placement(b,t)
            if abs(ay-by)<.5:
                pts=[(ax+2.76,ay,az),(ax+2.90,ay,az),(bx-2.90,by,bz),(bx-2.76,by,bz)]
            elif abs(ax-bx)<.5:
                pts=[(ax,ay-1.66,az),(ax,ay-1.85,az),(bx,by+1.85,bz),(bx,by+1.66,bz)]
            else:
                pts=[(ax-2.76,ay,az),(ax-2.90,ay,az),(bx+2.90,by,bz),(bx+2.76,by,bz)]
            for vertex,point in zip(spline.points,pts):vertex.co=(*point,1)
            obj.hide_render=reveal(t)<.025
        for i,obj in tracked:
            start=.345+i*.027;progress=ease((t-start)/.07)*(1-ease((t-.86)/.12))
            obj.data.bevel_factor_end=max(.0001,progress);obj.hide_render=progress<.001
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
        info={'service':'104','scene':'software-system-v8','blender':bpy.app.version_string,'engine':scene.render.engine,
              'samples':args.samples,'frames':FRAMES,'fps':FPS,'resolution':[scene.render.resolution_x,scene.render.resolution_y],
              'camera':'orthographic optical inspection: application components remain correctly proportioned; native depth and subpixel registration guides',
              'render_mode':'one persistent native animation render','antialiasing':scene.display.render_aa if args.engine=='workbench' else args.samples,'lighting':'authored interface colours with graded substrate penumbra' if args.engine=='workbench' else 'emissive interface with soft substrate shadows','authoring_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'font_sha256':{w:hashlib.sha256((font_dir/('UMSans-'+w+'.ttf')).read_bytes()).hexdigest() for w in ['Regular','SemiBold']},'timings':timings,'bounds':bounds,'focus_bounds':focus_bounds,'focus_windows':FOCUS_WINDOWS,'wide_times':WIDE_TIMES,'handler_errors':handler_errors}
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
