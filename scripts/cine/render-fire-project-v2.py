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
          (.32,.92,-72,(-2.05,.35,2.68)),(.44,4.6,-71,(-1.4,1.3,2.65)),
          (.62,1.75,-73,(2.64,2.13,1.55)),(.77,1.65,-70,(2.62,2.13,1.56)),
          (1,14.7,-66,(0,.15,1.1))]
    if t<=0 or t>=1:return keys[0][1],math.radians(keys[0][2]),keys[0][3]
    a,b=keys[0],keys[-1]
    for left,right in zip(keys,keys[1:]):
        if left[0]<=t<=right[0]:a,b=left,right;break
    k=smooth((t-a[0])/(b[0]-a[0]));mix=lambda x,y:x+(y-x)*k
    return mix(a[1],b[1]),math.radians(mix(a[2],b[2])),tuple(mix(x,y) for x,y in zip(a[3],b[3]))

class Installation(legacy.Studio):
    def __init__(self):
        super().__init__('107');self.meshes=[]
    def mesh(self,vertices,faces,mat,group=None):
        self.meshes.append(dict(vertices=vertices,faces=faces,mat=mat,group=group))
    def cylinder(self,*args,group=None,**kwargs):
        super().cylinder(*args,**kwargs);self.cylinders[-1]['group']=group
    def line(self,pts,mat='trace',radius=.001,group=None):
        super().line(pts,mat,radius);self.lines[-1]['group']=group
    def text(self,*args,group=None,**kwargs):
        super().text(*args,**kwargs);self.texts[-1]['group']=group
    def rounded_path(self,pts,radius=.04):
        result=[pts[0]]
        for a,b,c in zip(pts,pts[1:],pts[2:]):
            ab,bc=math.dist(a,b),math.dist(b,c)
            if not ab or not bc:continue
            r=min(radius,ab*.24,bc*.24)
            start=tuple(b[i]+(a[i]-b[i])*r/ab for i in range(3))
            end=tuple(b[i]+(c[i]-b[i])*r/bc for i in range(3))
            for j in range(7):
                q=j/6;result.append(tuple((1-q)**2*start[i]+2*q*(1-q)*b[i]+q*q*end[i] for i in range(3)))
        return result+[pts[-1]]
    def route(self,pts,start=0,end=1):
        pts=self.rounded_path(pts);self.line(pts,'red',.006)
        self.routes.append(dict(pts=pts,start=start,end=end))
    def seat(self,x,y,front=1):
        # Curved seat perimeter and a shaped back replace the block furniture.
        vertices=[];outline=[]
        for cx,cy,a in [(.175,.155,0),(-.175,.155,90),(-.175,-.155,180),(.175,-.155,270)]:
            for j in range(7):
                q=math.radians(a+j*15);outline.append((x+cx+.04*math.cos(q),y+cy+.04*math.sin(q)))
        for z in [.46,.495]:vertices.extend((xx,yy,z) for xx,yy in outline)
        n=len(outline);self.mesh(vertices,[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)],'fabric')
        vv=[]
        for z in [.53,.87]:
            for i in range(17):
                xx=-.21+i*.42/16;yy=y-front*(.19+.05*(1-(xx/.21)**2))
                vv.extend([(x+xx,yy,z),(x+xx,yy-front*.018,z)])
        faces=[]
        for i in range(16):
            k=i*2;faces.extend([(k,k+2,k+36,k+34),(k+1,k+35,k+37,k+3),(k+34,k+36,k+37,k+35)])
        faces.extend([(0,34,35,1),(32,33,67,66)])
        self.mesh(vv,faces,'fabric')
        for dx in [-.18,.18]:
            self.line([(x+dx,y-front*.18,.47),(x+dx,y-front*.25,.56),(x+dx,y-front*.25,.74)],'edge',.009)
    def chip(self,x,y,z,w=.028,h=.028,group=None):
        self.box(x,y,z,w,.003,h,'ink',group)
        count=12
        for j in range(count):
            dx=-w*.43+j*w*.86/(count-1);dz=h*.07+j*h*.86/(count-1)
            for sign in [-1,1]:
                self.box(x+sign*(w/2+.0016),y+.001,z+dz,.0032,.0012,.00065,'edge',group)
                self.box(x+dx,y+.001,z+(h+.0016 if sign>0 else -.0016),.00065,.0012,.0032,'edge',group)
        self.box(x-w*.31,y-.0018,z+h*.79,.0013,.0004,.0013,'muted',group)
    def terminal(self,x,y,z,count=8,pitch=.009):
        for j in range(count):
            xx=x+j*pitch
            self.box(xx,y,z,.008,.014,.012,'terminal')
            self.cylinder(xx,y-.008,z+.007,.0022,.001,'edge','y')
            self.line([(xx-.0014,y-.0095,z+.007),(xx+.0014,y-.0095,z+.007)],'ink',.00038)
            self.box(xx,y-.0075,z+.0005,.004,.001,.0035,'black')
    def ceiling_section(self,x,y):
        # A continuous annular cutaway retains the detector's mounting support.
        # The open inspection aperture makes the optical assembly visible above.
        n=64;vv=[]
        for z in [2.797,2.814]:
            for radius in [.083,.23]:
                for j in range(n):
                    a=j*math.tau/n;vv.append((x+radius*math.cos(a),y+radius*math.sin(a),z))
        ff=[]
        for j in range(n):
            k=(j+1)%n;ff.extend([(j,k,n+k,n+j),(2*n+j,3*n+j,3*n+k,2*n+k),(n+j,n+k,3*n+k,3*n+j),(j,2*n+j,2*n+k,k)])
        self.mesh(vv,ff,'paper')
        for dx in [-.20,.20]:
            self.box(x+dx,y,2.817,.012,.50,.025,'edge')
            self.line([(x+dx,y-.18,2.84),(x+dx,y-.18,3.08)],'edge',.0016)
            self.line([(x+dx,y+.18,2.84),(x+dx,y+.18,3.08)],'edge',.0016)

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
        self.seat(x,y-.86)
        self.cylinder(x,y-.86,.11,.022,.35,'edge')
        for j in range(5):
            a=j*math.tau/5;xx=x+.29*math.cos(a);yy=y-.86+.29*math.sin(a)
            self.line([(x,y-.86,.12),(xx,yy,.075)],'edge',.012);self.cylinder(xx,yy,.025,.025,.037,'graphite')
    def detector(self,x,y,label):
        self.parts.append('addressable-detector-'+label)
        self.cylinder(x,y,2.787,.071,.010,'paper')
        self.cylinder(x,y,2.777,.058,.009,'pcb')
        self.cylinder(x,y,2.736,.030,.040,'black')
        for j in range(24):
            a=j*math.tau/24
            self.line([(x+.032*math.cos(a),y+.032*math.sin(a),2.742),(x+.035*math.cos(a),y+.035*math.sin(a),2.771)],'graphite',.0015)
        for dx in [-.027,.027]:
            self.cylinder(x+dx,y,2.777,.003,.003,'edge')
            self.box(x+dx,y+.027,2.787,.010,.005,.003,'ink')
        for j in range(12):
            a=j*math.tau/12
            self.box(x+.045*math.cos(a),y+.045*math.sin(a),2.788,.003,.006,.0015,'copper')
        name='detector-shell-'+label
        self.doors.append(dict(name=name,pivot=(0,0,0),kind='detector'))
        self.cylinder(x,y,2.697,.051,.019,'paper',top=.056,group=name)
        self.cylinder(x,y,2.716,.056,.024,'paper',top=.061,group=name)
        for j in range(40):
            a=j*math.tau/40
            self.line([(x+.058*math.cos(a),y+.058*math.sin(a),2.722),(x+.060*math.cos(a),y+.060*math.sin(a),2.737)],'ink',.0009,group=name)
        self.cylinder(x+.034,y-.033,2.715,.003,.002,'red',group=name)
        self.box(x,y+.145,2.816,.145,.024,.002,'paper')
        self.text(label,x-.06,y+.141,2.819,.013,'ink')
    def central(self,x,y,z):
        self.parts.append('addressable-central')
        w,h=.52,.66
        # Folded sheet, stiffened backplate and compressed door gasket.
        self.box(x,y+.058,z,w,.002,h,'paper')
        self.box(x,y+.046,z+.016,w-.030,.002,h-.032,'edge')
        for dx in [-w/2,w/2]:
            self.box(x+dx,y,z,.002,.12,h,'paper')
            self.box(x+dx+(-.007 if dx>0 else .007),y-.060,z+.003,.014,.002,h-.006,'paper')
        for zz in [z,z+h-.002]:self.box(x,y,zz,w,.12,.002,'paper')
        self.line([(x-w/2+.007,y-.063,z+.009),(x-w/2+.007,y-.063,z+h-.009),(x+w/2-.007,y-.063,z+h-.009),(x+w/2-.007,y-.063,z+.009)],'black',.0025)
        # Main loop board and separate PSU daughterboard, each on standoffs.
        for xx,ww in [(x-.064,.31),(x+.171,.116)]:
            for dx in [-ww/2+.009,ww/2-.009]:
                for dz in [.205,.591]:
                    self.cylinder(xx+dx,y+.043,z+dz,.003,.022,'copper','y')
                    self.screw(xx+dx,y+.014,z+dz)
            self.box(xx,y+.021,z+.197,ww,.0016,.40,'pcb')
        self.chip(x-.075,y+.017,z+.383)
        self.chip(x-.150,y+.017,z+.30,.018,.04)
        self.chip(x+.005,y+.017,z+.454,.020,.024)
        # Short orthogonal PCB buses rather than a decorative starburst.
        for j in range(12):
            xx=x-.170+j*.009
            zz=z+.49+j*.003
            self.line([(xx,y+.019,z+.575),(xx,y+.019,zz),(x-.11+j*.003,y+.019,zz),(x-.11+j*.003,y+.019,z+.427)],'copper',.00028)
        for row in range(7):
            for col in range(9):
                xx=x-.198+col*.026;zz=z+.235+row*.046
                if -.11 < xx-x < -.025 and .36 < zz-z < .45:continue
                self.box(xx,y+.018,zz,.006,.0016,.003,'ink' if (row+col)%3 else 'copper')
                for dx in [-.0036,.0036]:self.box(xx+dx,y+.018,zz,.0012,.0016,.003,'edge')
        # Relay bank, optoisolators, current filtering and service header.
        for j in range(4):
            xx=x-.182+j*.053
            self.box(xx,y+.008,z+.513,.038,.020,.027,'graphite')
            self.text('R'+str(j+1),xx-.012,y-.003,z+.530,.005,'paper',True)
        for j in range(5):
            self.box(x-.195+j*.048,y+.013,z+.461,.018,.012,.011,'black')
            self.cylinder(x-.195+j*.048,y+.016,z+.428,.004,.009,'graphite','y')
        self.terminal(x-.195,y+.009,z+.567,26,.0088)
        self.terminal(x-.19,y+.007,z+.210,20,.011)
        for j in range(12):self.box(x-.086+j*.006,y+.006,z+.341,.002,.008,.005,'copper')
        self.box(x-.052,y+.012,z+.337,.078,.015,.018,'black')
        for xx in [x+.155,x+.198]:
            self.cylinder(xx,y+.018,z+.36,.012,.026,'graphite','y')
            self.cylinder(xx,y-.009,z+.36,.011,.001,'edge','y')
        self.box(x+.174,y+.005,z+.454,.075,.030,.068,'graphite')
        self.box(x+.174,y-.012,z+.464,.052,.004,.047,'copper')
        for j in range(9):self.box(x+.137+j*.008,y+.006,z+.255,.003,.03,.062,'edge')
        self.terminal(x+.130,y+.010,z+.56,10,.0088)
        self.text('LOOP / CONTROL',x-.19,y+.018,z+.552,.006,'paper',True)
        self.text('24 V / PSU',x+.12,y+.018,z+.540,.006,'paper',True)
        # Two compact standby cells with recessed lids, spades and return cable.
        for xx in [x-.115,x+.068]:
            self.box(xx,y+.006,z+.024,.151,.065,.094,'graphite')
            self.box(xx,y+.006,z+.119,.151,.065,.004,'black')
            for dx in [-.052,.052]:
                self.box(xx+dx,y-.014,z+.123,.010,.008,.007,'red' if dx<0 else 'black')
                self.box(xx+dx,y-.014,z+.129,.005,.0008,.008,'edge')
            self.text('12 V',xx-.058,y-.027,z+.083,.010,'paper',True)
            self.text('STANDBY',xx-.058,y-.027,z+.061,.006,'muted',True)
        for side,xx,mat in [(-1,x-.167,'red'),(1,x+.120,'black')]:
            self.line(self.rounded_path([(xx,y-.014,z+.133),(xx+side*.029,y-.014,z+.153),(xx+side*.029,y+.001,z+.177),(xx,y+.001,z+.210)],.009),mat,.0015)
        self.line(self.rounded_path([(x-.063,y-.014,z+.133),(x-.048,y-.025,z+.153),(x+.002,y-.025,z+.153),(x+.016,y-.014,z+.133)],.008),'black',.0015)
        # Hinged fascia: seal, LCD, tactile controls, lock and its actual rear PCB.
        name='central-door';self.doors.append(dict(name=name,pivot=(x-w/2,y-.064,z),kind='door'))
        self.box(w/2,0,0,w,.002,h,'paper',name)
        for xx in [.007,w-.007]:self.box(xx,.007,.01,.014,.014,h-.02,'paper',name)
        self.box(w/2,-.003,.320,.356,.002,.225,'graphite',name)
        self.box(w/2,-.006,.389,.277,.002,.123,'screen',name)
        self.text('SISTEMA NORMAL',.140,-.0075,.482,.010,'paper',True,group=name)
        self.text('02 zonas / supervisadas',.140,-.0075,.458,.007,'muted',True,group=name)
        for j,label in enumerate(['Estado','Eventos','Prueba','Silenciar']):
            self.box(.142+j*.078,-.008,.345,.048,.003,.020,'black',name)
            self.text(label,.121+j*.078,-.010,.351,.005,'paper',True,group=name)
        for j in range(4):self.cylinder(.148+j*.074,-.004,.291,.003,.003,'signal','y',group=name)
        self.cylinder(.48,-.004,.245,.009,.005,'edge','y',group=name)
        self.box(.48,-.010,.241,.001,.001,.009,'ink',name)
        self.box(w/2,.013,.344,.316,.0016,.180,'pcb',name)
        self.chip(w/2,.016,.405,.028,.028,group=name)
        for j in range(12):
            self.box(.135+j*.022,.016,.487,.005,.003,.008,'edge',name)
            self.box(.135+j*.022,.016,.366,.009,.003,.004,'ink',name)
        for dz in [.035,.59]:
            self.cylinder(x-w/2,y-.064,z+dz,.0045,.027,'edge')
            self.box(x-w/2+.01,y-.059,z+dz,.02,.009,.02,'edge')
        # Fine identification on a high-contrast fixed plate.
        self.box(x,y-.061,z+h-.040,.41,.001,.025,'paper')
        self.text('DETECCION / CENTRAL 01',x-.195,y-.063,z+h-.032,.009,'ink',True)

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
            s.seat(x,y,front=-1 if y>-.6 else 1)
            for dx in [-.17,.17]:
                for dy in [-.16,.16]:s.box(x+dx,y+dy,.107,.022,.022,.363,'edge')
    # Architectural inspection sections retain the mount and hanging structure.
    for x in [-2.05,2.18]:
        s.ceiling_section(x,.35)
        s.detector(x,.35,'D-01' if x<0 else 'D-02')
    # Continuously supported conduit and junctions; the detector links return.
    loop=[(2.68,2.18,1.88),(2.68,2.18,2.80),(2.68,2.40,2.80),(-2.05,2.40,2.80),(-2.05,.35,2.80),(2.18,.35,2.80),(2.18,2.30,2.80),(2.76,2.30,2.80),(2.76,2.18,1.88)]
    loop=s.rounded_path(loop);s.line(loop,'red',.006)
    s.routes.append(dict(pts=loop,start=.20,end=.69))
    for x in [-2.05,-.75,.75,2.18,2.68]:
        s.box(x,2.40,2.79,.026,.044,.020,'edge')
        s.line([(x,2.40,2.82),(x,2.40,2.93)],'edge',.002)
    for x in [-2.05,2.18]:
        s.box(x,.47,2.784,.055,.055,.033,'paper');s.screw(x,.47,2.82,False)
    s.central(2.68,2.18,1.22)
    s.box(2.68,2.40,.107,.84,.35,2.30,'paper')
    # Manual call point and separate sounder are mounted beside the exit.
    s.box(3.65,-1.7,.107,.085,.085,2.15,'paper')
    s.box(3.65,-1.754,1.20,.09,.036,.09,'red');s.box(3.65,-1.775,1.225,.065,.003,.038,'paper')
    s.box(3.65,-1.754,2.03,.11,.04,.12,'red')
    for j in range(8):s.box(3.65,-1.778,2.05+j*.01,.073,.004,.003,'black')
    s.cylinder(3.65,-1.75,2.15,.037,.035,'paper')
    s.route([(2.88,2.18,1.84),(2.88,2.30,2.76),(3.65,2.30,2.76),(3.65,-1.7,2.76),(3.65,-1.7,2.09)],.69,.94)
    s.parts.extend(['two-zones','mounted-conduit','occupied-workplace','standby-supply','manual-call-point','notification'])
    return s

def validate(s):
    assert {'addressable-central','mounted-conduit','occupied-workplace','notification'}<=set(s.parts)
    assert camera_pose(0)==camera_pose(1)
    for b in s.boxes:assert min(b[k] for k in ['w','d','h'])>0
    for route in s.routes:assert all(math.dist(a,b)>0 for a,b in zip(route['pts'],route['pts'][1:]))
    return dict(service='107',scene='fire-project-v2',boxes=len(s.boxes),meshes=len(s.meshes),parts=s.parts,frames=FRAMES,fps=FPS,duration=24)


def render(args,s):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.render.engine={'cycles':'CYCLES','workbench':'BLENDER_WORKBENCH','baked':'CYCLES'}[args.engine]
    if args.engine in ('workbench','baked'):
        scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.render_aa='16'
        scene.display.shading.show_shadows=False;scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH'
        scene.display.shading.curvature_ridge_factor=.55;scene.display.shading.curvature_valley_factor=.8
        scene.display.shading.cavity_ridge_factor=.35;scene.display.shading.cavity_valley_factor=.8
        scene.display.shading.studiolight_rotate_z=.5
        scene.display.shading.background_type='WORLD'
        scene.display.shading.show_object_outline=False
    scene.cycles.device='CPU';scene.cycles.samples=args.samples;scene.cycles.use_denoising=True
    scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.012;scene.cycles.adaptive_min_samples=12;scene.cycles.max_bounces=4
    scene.eevee.taa_render_samples=args.samples;scene.eevee.use_raytracing=False
    scene.eevee.shadow_ray_count=3;scene.eevee.shadow_step_count=8
    scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width*9/16);scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
    scene.render.fps=FPS;scene.render.use_persistent_data=True
    scene.view_settings.view_transform='Standard' if args.engine=='workbench' else 'AgX'
    scene.view_settings.exposure=.35 if args.engine=='workbench' else 0
    scene.world=bpy.data.worlds.new('UM graphite atelier');scene.world.use_nodes=True;scene.world.color=(.006,.006,.007)
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
        meshpart(c['mat'],c.get('group'),vv,ff)
    for m in s.meshes:meshpart(m['mat'],m.get('group'),m['vertices'],m['faces'])
    for (mat,group),(vv,ff) in groups.items():
        mesh=bpy.data.meshes.new(mat);mesh.from_pydata(vv,[],ff);mesh.update()
        obj=bpy.data.objects.new(mat+' '+(group or 'equipment'),mesh);scene.collection.objects.link(obj);mesh.materials.append(mats[mat])
        if group:obj.parent=parents[group]
        bevel=obj.modifiers.new('Manufactured edges','BEVEL');bevel.width=.0008;bevel.segments=3
        obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    linegroups={}
    for line in s.lines:linegroups.setdefault((line['mat'],line['radius'],line.get('group')),[]).append(line['pts'])
    for (mat,radius,group),paths in linegroups.items():
        curve=bpy.data.curves.new(mat+' conductors','CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=2
        for pts in paths:
            sp=curve.splines.new('POLY');sp.points.add(len(pts)-1)
            for p,xyz in zip(sp.points,pts):p.co=(*xyz,1)
            if not group:bounds.extend(pts)
        obj=bpy.data.objects.new(mat+' conductors',curve);scene.collection.objects.link(obj);curve.materials.append(mats[mat])
        if group:obj.parent=parents[group]
    for label in s.texts:
        c=bpy.data.curves.new(label['value'],'FONT');c.body=label['value'];c.size=label['size'];c.extrude=.0005
        obj=bpy.data.objects.new(label['value'],c);scene.collection.objects.link(obj);obj.location=label['at']
        if label['front']:obj.rotation_euler[0]=math.pi/2
        if label.get('group'):obj.parent=parents[label['group']]
        c.materials.append(mats[label['mat']])
    # A flexible eight-conductor loom remains attached to the moving fascia.
    ribbon=[]
    for i in range(8):
        c=bpy.data.curves.new('Fascia ribbon '+str(i),'CURVE');c.dimensions='3D';c.bevel_depth=.0006;c.bevel_resolution=2
        sp=c.splines.new('POLY');sp.points.add(23)
        obj=bpy.data.objects.new('Fascia ribbon '+str(i),c);scene.collection.objects.link(obj);c.materials.append(mats['red' if i==0 else 'muted'])
        ribbon.append(sp)
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
    # One native animation render keeps mesh compilation and the draw engine alive.
    started=[0.0];bake_info=None
    def update_frame(scene):
        frame=scene.frame_current
        t=frame/(FRAMES-1);size,angle,target=camera_pose(t);target=Vector(target)
        inspection=smooth((t-.19)/.11)*(1-smooth((t-.36)/.11))
        distance=24-20*inspection;elevation=22-22.9*inspection
        cam.location=target+Vector((distance*math.cos(angle),distance*math.sin(angle),elevation));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
        camera.ortho_scale=size;camera.shift_x=0;camera.shift_y=0
        for obj,r in packets:
            visible=r['start']<=t<=r['end'];obj.hide_render=not visible
            q=(t-r['start'])/(r['end']-r['start'])
            obj.location=travel(r,smooth(q))
            fade=max(.001,min(smooth(q/.08),smooth((1-q)/.08)))
            obj.scale=(fade,fade,fade)
        for part in s.doors:
            obj=parents[part['name']]
            if part.get('kind')=='detector':obj.location.z=-.14*smooth((t-.23)/.06)*(1-smooth((t-.40)/.07))
            else:obj.rotation_euler[2]=-math.radians(102)*smooth((t-.52)/.10)*(1-smooth((t-.79)/.13))
        bpy.context.view_layer.update()
        for i,sp in enumerate(ribbon):
            a=Vector((2.628+i*.0015,2.18+.001,1.22+.346))
            d=parents['central-door'].matrix_world@Vector((.17+i*.0015,.018,.380))
            b=a+Vector((-.045,-.09,-.06));c=d+Vector((-.05,.065,-.06))
            for j,v in enumerate(sp.points):
                q=j/(len(sp.points)-1);v.co=(*((1-q)**3*a+3*(1-q)**2*q*b+3*(1-q)*q*q*c+q**3*d),1)
        # Full model extent is checked only on establishing endpoints. Each shot's
        # framing proof is inspected separately rather than clipping the closeups.
        if frame in (0,FRAMES-1):
            allbounds=list(bounds)
            for (mat,group),(vv,_) in groups.items():
                if group:allbounds.extend(tuple(parents[group].matrix_world@Vector(p)) for p in vv)
            projected=[world_to_camera_view(scene,cam,Vector(p)) for p in allbounds]
            extent=[min(p.x for p in projected),min(p.y for p in projected),max(p.x for p in projected),max(p.y for p in projected)]
            assert extent[0]>.015 and extent[1]>.015 and extent[2]<.985 and extent[3]<.985,(s.code,frame,extent)
            extents.append({'frame':frame,'bounds':extent})
    def begin_frame(scene):started[0]=time.time()
    def finish_frame(scene):
        record={'frame':scene.frame_current,'seconds':round(time.time()-started[0],2)};timings.append(record);print(json.dumps(record),flush=True)
        info={**validate(s),'blender':bpy.app.version_string,'engine':scene.render.engine,'samples':args.samples,
              'resolution':[args.width,round(args.width*9/16)],'camera':'workplace to detector to supervised circuit to central; continuous 24 second loop',
              'render_mode':'persistent native animation','baked_lighting':bake_info,'bounds':extents,'timings':timings}
        (out/'render-info.json').write_text(json.dumps(info))
    if args.engine=='baked':
        # The lights and installation stay fixed while the camera moves. Bake
        # their diffuse response once, at mesh precision, then keep native 4K
        # animation without recalculating screen-space illumination per frame.
        # Moving covers do not cast an immobile shadow onto the fixed assembly.
        start=time.time();scene.frame_set(960);update_frame(scene)
        for obj in scene.objects:
            if obj.parent in parents.values() or obj in [item[0] for item in packets]:obj.visible_shadow=False
        bake_objects=[]
        for obj in list(scene.objects):
            if obj.type!='MESH' or obj.hide_render:continue
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
            for modifier in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
            attr=obj.data.color_attributes.new(name='UM area-light response',type='FLOAT_COLOR',domain='CORNER')
            obj.data.color_attributes.active_color_index=obj.data.color_attributes.find(attr.name)
            obj.data.color_attributes.render_color_index=obj.data.color_attributes.find(attr.name)
            bake_objects.append(obj)
        # A diffuse technical finish keeps colors readable; no metallic lookup
        # gets mistaken for a dark unlit material during the static bake.
        for mat in mats.values():mat.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value=0
        bpy.ops.object.select_all(action='DESELECT')
        for obj in bake_objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=bake_objects[0]
        scene.render.engine='CYCLES';scene.cycles.samples=32
        bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR','DIRECT','INDIRECT'},target='VERTEX_COLORS',use_clear=True,use_selected_to_active=False)
        bake_info={'seconds':round(time.time()-start,2),'objects':len(bake_objects),'corners':sum(len(o.data.loops) for o in bake_objects),'source':'Cycles diffuse direct and indirect light'}
        print(json.dumps({'lighting_bake':bake_info}),flush=True)
        scene.render.engine='BLENDER_WORKBENCH'
        scene.display.shading.light='FLAT';scene.display.shading.color_type='VERTEX'
        scene.display.shading.show_shadows=False;scene.display.shading.show_cavity=False;scene.display.shading.show_specular_highlight=False
        scene.display.render_aa='16'
    scene.render.filepath=str(out)+'/'
    bpy.app.handlers.frame_change_pre.append(update_frame)
    bpy.app.handlers.render_pre.append(begin_frame);bpy.app.handlers.render_post.append(finish_frame)
    try:
        segments=[(int(x),int(x)) for x in args.proof_frames.split(',')] if args.proof_frames else [(args.start,args.end)]
        for start,end in segments:
            scene.frame_start=start;scene.frame_end=end;bpy.ops.render.render(animation=True)
    finally:
        bpy.app.handlers.frame_change_pre.remove(update_frame)
        bpy.app.handlers.render_pre.remove(begin_frame);bpy.app.handlers.render_post.remove(finish_frame)


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=0)
    p.add_argument('--samples',type=int,default=32);p.add_argument('--engine',choices=['cycles','workbench','baked'],default='cycles')
    p.add_argument('--width',type=int,default=3840);p.add_argument('--output',default='frames');p.add_argument('--proof-frames');p.add_argument('--validate-only',action='store_true')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 0<=args.start<=args.end<FRAMES and 16<=args.samples<=128 and args.width in [1920,3840]
    s=build();info=validate(s)
    if args.validate_only:print(json.dumps(info))
    else:render(args,s)
