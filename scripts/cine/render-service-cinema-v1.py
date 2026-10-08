"""Seven authored service films. Blender runs on CI only; validate needs plain Python."""
import argparse
import json
import math
import sys
import time
from pathlib import Path

FPS, FRAMES = 24, 576
SERVICES = {'101': 'network', '102': 'security', '103': 'telecom',
            '105': 'support', '106': 'consulting', '107': 'fire', '108': 'power'}


def smooth(t):
    t = max(0, min(1, t))
    return t*t*t*(t*(t*6-15)+10)


def pose(frame):
    t = frame/(FRAMES-1)
    return (23.5-1.3*math.sin(math.pi*t)**2,
            math.radians(-65+7*math.sin(2*math.pi*t)),
            .22*math.sin(2*math.pi*t), .2*math.sin(math.pi*t)**2)


class Studio:
    """Geometry in metres; local details are built into recognizable equipment."""
    def __init__(self, code):
        self.code = code
        self.boxes, self.cylinders, self.lines, self.texts = [], [], [], []
        self.routes, self.lamps, self.doors = [], [], []
        self.parts = []

    def box(self, x, y, z, w, d, h, mat='metal', group=None):
        self.boxes.append(dict(x=x, y=y, z=z, w=w, d=d, h=h, mat=mat, group=group))

    def cylinder(self, x, y, z, r, h, mat='metal', axis='z', top=None):
        self.cylinders.append(dict(x=x, y=y, z=z, r=r, h=h, mat=mat, axis=axis, top=top or r))

    def line(self, pts, mat='trace', radius=.016):
        self.lines.append(dict(pts=pts, mat=mat, radius=radius))

    def text(self, value, x, y, z, size=.14, mat='ink', front=False):
        self.texts.append(dict(value=value, at=(x, y, z), size=size, mat=mat, front=front))

    def route(self, pts, start=0, end=1):
        self.line(pts, 'red', .022)
        self.routes.append(dict(pts=pts, start=start, end=end))

    def lamp(self, x, y, z, phase=.2):
        self.cylinder(x, y, z, .026, .015, 'signal', 'y')
        self.lamps.append((x, y-.012, z, phase))

    def base(self, x, y, w, d, title):
        self.box(x, y, 0, w, d, .16, 'base')
        self.box(x, y, .16, w-.07, d-.07, .055, 'slate')
        self.text(title, x-w/2+.24, y-d/2+.22, .219, .16, 'paper')

    def screw(self, x, y, z, front=True):
        self.cylinder(x, y, z, .026, .013, 'edge', 'y' if front else 'z')
        if front:
            self.line([(x-.014,y-.008,z),(x+.014,y-.008,z)], 'ink', .003)

    def unit(self, x, y, z, kind='switch', w=2.25):
        self.parts.append(kind)
        h = .28 if kind in ('switch','patch','router') else .48
        self.box(x,y,z,w,1.36,h,'graphite')
        self.box(x,y-.69,z+.025,w-.05,.055,h-.05,'edge')
        self.box(x,y-.723,z+.05,w-.24,.012,h-.1,'ink')
        for xx in (x-w/2+.06,x+w/2-.06): self.screw(xx,y-.729,z+h/2)
        n = 12 if kind in ('switch','patch') else 6
        for i in range(n):
            xx=x-w/2+.22+i*(w-.51)/n
            if kind in ('switch','patch','router'):
                self.box(xx,y-.738,z+.071,.113,.022,.107,'edge')
                self.box(xx,y-.754,z+.09,.080,.009,.065,'black')
                for j in range(4):self.box(xx-.027+j*.018,y-.760,z+.093,.006,.007,.038,'copper')
                if kind!='patch': self.lamp(xx,y-.762,z+.218,i/n)
            else:
                self.box(xx,y-.75,z+.06,.24,.022,h-.14,'graphite')
                self.box(xx,y-.765,z+.12,.14,.008,.027,'edge')
                self.lamp(xx-.08,y-.777,z+h-.09,i/n)
        for i in range(18):self.box(x-w/2+.14+i*(w-.3)/18,y+.2,z+h+.002,.03,.64,.008,'black')
        self.text(kind.upper(),x-w/2+.15,y+.57,z+h+.01,.09,'muted')
        return h

    def rack(self,x,y,z=.22,units=5,door=True):
        self.parts.append('cabinet')
        w,d,h=2.65,1.85,3.9
        self.box(x,y,z,w,d,.12,'edge');self.box(x,y,z+h-.12,w,d,.12,'edge')
        self.box(x,y+d/2-.04,z+.12,.085,.08,h-.24,'edge')
        for dx in (-1,1):
            self.box(x+dx*(w/2-.07),y,z+.12,.10,d,h-.24,'graphite')
            self.box(x+dx*1.17,y-.73,z,.05,.045,h,'edge')
            for k in range(29):self.box(x+dx*1.17,y-.76,z+.15+k*.125,.027,.009,.046,'black')
        for k in range(units): self.unit(x,y,z+.23+k*.56,'patch' if k==units-1 else 'switch' if k==units-2 else 'server')
        self.text('UM / INFRAESTRUCTURA',x-1.01,y-.963,z+h-.09,.092,'paper',True)
        # Routed patch leads, with slack bends and one cable comb.
        for j in range(8):
            xx=x-.88+j*.235
            self.line([(xx,y-.77,z+.23+(units-1)*.56+.12),(xx,y-1.01,z+.23+(units-1)*.56+.12),
                       (xx+.05,y-1.04,z+.23+(units-2)*.56+.09),(xx,y-.78,z+.23+(units-2)*.56+.09)],'blue' if j%2 else 'muted',.018)
        if door:
            name='cabinet-door-'+str(len(self.doors));pivot=(x-w/2,y-d/2-.08,z)
            self.doors.append(dict(name=name,pivot=pivot))
            for xx in (.03,w-.03):self.box(xx,0,0,.055,.05,h,'edge',name)
            for zz in (0,h-.07):self.box(w/2,0,zz,w,.05,.07,'edge',name)
            for i in range(23):self.box(.15+i*(w-.3)/22,0,.12,.014,.02,h-.24,'graphite',name)
            self.box(w-.19,-.065,h*.48,.04,.04,.43,'paper',name)

    def screen(self,x,y,z,w=2.2,h=1.34,kind='network'):
        self.parts.append('display-'+kind)
        self.box(x,y,z,w,.12,h,'graphite');self.box(x,y-.07,z+.065,w-.13,.014,h-.13,'screen')
        self.box(x,y-.082,z+h-.14,w-.27,.008,.035,'blue')
        if kind=='cameras':
            for ix in range(2):
                for iz in range(2):
                    xx=x-w*.23+ix*w*.46;zz=z+.13+iz*h*.44
                    self.box(xx,y-.084,zz,w*.41,.005,h*.37,'slate')
                    for j in range(3):self.box(xx-w*.14+j*w*.13,y-.09,zz+.04,.1,.003,h*.19,'muted')
                    self.box(xx-w*.14,y-.095,zz+h*.29,.08,.003,.028,'signal')
        else:
            for i in range(4):
                zz=z+h-.29-i*(h-.36)/4
                self.box(x-w*.29,y-.084,zz,w*.22,.005,.035,'muted')
                self.box(x+w*.13,y-.084,zz,w*.42,.005,.035,'paper' if i else 'red')
        self.box(x,y,z-.40,.085,.1,.4,'edge');self.box(x,y-.05,z-.44,w*.43,.46,.045,'graphite')

    def desk(self,x,y,z=.9,w=2.8,kind='network'):
        self.parts.append('workstation')
        self.box(x,y,z,w,1.35,.07,'paper')
        for dx in (-1,1):self.box(x+dx*(w/2-.16),y-.06,.24,.06,.88,z-.24,'edge')
        self.screen(x,y+.26,z+.52,w*.74,1.18,kind)
        self.box(x-.15,y-.31,z+.075,1.26,.37,.035,'graphite')
        for row in range(4):
            for k in range(14):self.box(x-.71+k*.086,y-.45+row*.086,z+.113,.07,.063,.008,'muted')
        self.cylinder(x+.87,y-.31,z+.07,.12,.07,'graphite')

    def tray(self, x1,x2,y,z):
        for yy in (y-.13,y+.13):self.line([(x1,yy,z),(x2,yy,z)],'edge',.027)
        for i in range(int((x2-x1)*4)+1):
            x=x1+i*.25;self.line([(x,y-.13,z),(x,y+.13,z)],'edge',.012)
        for j in range(4):self.line([(x1,y-.08+j*.052,z+.017),(x2,y-.08+j*.052,z+.017)],'blue',.016)

    def panel(self,x,y,z=.3,fire=False):
        self.parts.append('fire-panel' if fire else 'distribution-board')
        w,h=1.95,2.50
        self.box(x,y,z,w,.6,h,'paper');self.box(x,y-.32,z+.12,w-.20,.06,h-.24,'graphite')
        self.box(x,y-.37,z+h-1.02,1.14,.025,.57,'screen')
        for i in range(3):self.box(x-.15,y-.388,z+h-.90+i*.14,.58,.01,.037,'signal' if i==0 else 'muted')
        for i in range(4):self.lamp(x-.57+i*.37,y-.4,z+.82,i/4)
        if fire:
            self.text('DETECCION',x-.68,y-.4,z+h-.30,.11,'paper',True)
            for k in range(6):self.box(x-.56+k*.22,y-.38,z+.25,.13,.05,.13,'edge')
        else:
            for k in range(6):
                self.box(x-.65+k*.26,y-.38,z+.22,.21,.08,.53,'paper')
                self.box(x-.65+k*.26,y-.44,z+.43,.1,.035,.10,'red' if k==0 else 'graphite')
        for xx in (x-.86,x+.86):
            for zz in (z+.09,z+h-.09):self.screw(xx,y-.323,zz)

    def dome(self,x,y,z):
        self.parts.append('smoke-detector')
        self.cylinder(x,y,z,.25,.055,'paper');self.cylinder(x,y,z+.055,.21,.12,'paper',top=.14)
        for j in range(20):
            a=j*math.tau/20
            self.box(x+.185*math.cos(a),y+.185*math.sin(a),z+.065,.035,.026,.035,'ink')
        self.cylinder(x+.05,y-.07,z+.178,.018,.007,'red')


def networks(s):
    s.base(0,1.1,11.7,7.9,'REDES / DEL PUESTO AL NUCLEO')
    s.rack(2.9,2.7)
    s.desk(-3.5,-.35,kind='network')
    s.desk(-3.5,3.0,kind='network')
    s.tray(-4.8,3.0,4.25,2.75)
    for x,y in [(-3.5,-.35),(-3.5,3.)]:
        s.box(x+1.65,y+.55,.23,.13,.20,.66,'paper')
        for k in range(2):s.box(x+1.65,y+.441,.54+k*.19,.075,.008,.11,'ink')
        s.line([(x+1.65,y+.55,.90),(x+1.65,y+.55,2.75),(x+1.65,4.25,2.75)],'blue',.025)
    # A recognizable ceiling access point, shown on a slim cutaway mast.
    s.box(.15,1.1,.22,.08,.08,2.65,'edge')
    s.cylinder(.15,1.1,2.82,.55,.15,'paper');s.cylinder(.15,1.1,2.98,.31,.012,'muted')
    s.line([(.15,1.1,2.90),(.15,4.25,2.90),(2.9,4.25,2.90),(2.9,3.4,2.90)],'blue',.025)
    s.route([(-1.85,.20,.90),(-1.85,.20,2.75),(-1.85,4.25,2.75),(2.9,4.25,2.75),(2.9,3.45,2.75),(2.9,1.85,3.15)],0,.62)
    s.route([(2.9,1.85,2.6),(2.9,4.25,2.9),(.15,4.25,2.9),(.15,1.1,2.9)],.60,.96)
    # Certification instrument and a labelled patch lead beside the cabinet.
    s.box(3.2,-.6,.22,1.0,1.7,.15,'red');s.box(3.2,-.34,.38,.71,.63,.02,'screen')
    for j in range(3):s.box(3.2,-.18-j*.17,.404,.43,.03,.008,'signal')
    for j in range(6):s.box(3.01+j%3*.19,-.95+j//3*.19,.378,.12,.12,.02,'paper')
    s.line([(3.2,.23,.31),(4.2,.23,.31),(4.2,1.9,.31),(3.5,1.9,.31)],'red',.027)
    s.text('MEDIR / IDENTIFICAR / ENTREGAR',1.8,-1.9,.23,.13,'paper')


def security(s):
    s.base(.0,1.0,11.8,7.9,'SEGURIDAD / VER, VERIFICAR, ACTUAR')
    # One controlled entrance, with strike, reader and two visible optical devices.
    for x in (-4.75,-1.95):s.box(x,2.7,.22,.12,.18,3.53,'paper')
    s.box(-3.35,2.7,3.75,2.93,.18,.12,'paper')
    s.box(-3.6,2.75,.24,2.20,.055,3.45,'muted')
    for x in (-4.65,-2.55):s.box(x,2.70,.24,.035,.06,3.45,'edge')
    s.box(-2.68,2.67,1.45,.04,.035,.6,'paper')
    s.box(-1.62,2.62,1.50,.35,.14,.59,'graphite');s.box(-1.62,2.54,1.72,.23,.012,.26,'screen')
    s.box(-1.62,2.529,1.60,.16,.008,.023,'signal')
    for x,y in [(-4.6,.0),(-.9,3.7)]:
        s.box(x,y,.22,.07,.07,3.33,'edge');s.box(x,y-.18,3.40,.31,.64,.25,'paper')
        s.cylinder(x,y-.52,3.525,.115,.05,'graphite','y');s.cylinder(x,y-.56,3.525,.064,.014,'lens','y')
        s.box(x,y-.1,3.67,.36,.60,.027,'paper')
        s.parts.append('camera-lens')
    # Coverage edges remain quiet physical guides, not flashing cones.
    for x in (-4.6,-.9):
        s.line([(x-.85,-1.4,.228),(x,-.2,.228),(x+.9,-1.4,.228)],'trace',.010)
    s.desk(2.80,.05,kind='cameras',w=3.2)
    s.screen(2.8,3.30,1.5,3.5,1.80,'cameras')
    s.unit(2.9,3.6,.25,'recorder',2.65)
    s.unit(2.9,3.6,.82,'switch',2.65)
    s.route([(-4.6,0,3.45),(-4.6,4.42,3.45),(.0,4.42,3.45),(.0,4.42,.43),(2.9,4.42,.43),(2.9,2.85,.43)],0,.50)
    s.route([(2.9,2.85,.43),(4.8,2.85,.43),(4.8,.05,.43),(2.8,.05,1.6)],.48,.95)
    s.line([(-1.62,2.62,1.6),(-1.62,4.42,1.6),(4.8,4.42,1.6),(4.8,.05,.43)],'trace',.02)
    s.text('CONTROL DE ACCESO',-4.70,1.98,.23,.13,'paper')
    s.text('REGISTRO / SUPERVISION',1.18,2.30,.23,.13,'paper')


def telecom(s):
    s.base(0,1.0,12.5,7.5,'TELECOMUNICACIONES / UNIR LA OPERACION')
    # Two sites across a deliberately open corridor; one active radio transport.
    for x in (-4.1,3.9):
        s.box(x,2.5,.22,2.30,2.05,.18,'paper')
        for dx in (-.36,.36):
            for dy in (-.36,.36):s.line([(x+dx,2.5+dy,.4),(x+dx*.43,2.5+dy*.43,4.35)],'edge',.036)
        for k in range(6):
            z=.55+k*.59;f=1-(z-.4)/4.3*.57
            for dy in (-1,1):
                s.line([(x-.36*f,2.5+dy*.36*f,z),(x+.36*f,2.5+dy*.36*f,z+.49)],'edge',.018)
                s.line([(x+.36*f,2.5+dy*.36*f,z),(x-.36*f,2.5+dy*.36*f,z+.49)],'edge',.018)
        # Parabolic ring, concave mesh and feed are true geometry, aimed at the peer.
        direction=1 if x<0 else -1
        s.cylinders.append(dict(x=x+direction*.22,y=2.5,z=3.50,r=.56,h=.13,top=.46,mat='paper',axis='x'))
        s.cylinders.append(dict(x=x+direction*.31,y=2.5,z=3.50,r=.44,h=.03,top=.44,mat='edge',axis='x'))
        s.line([(x,2.5,3.5),(x+direction*.81,2.5,3.5)],'graphite',.032)
        for dy,dz in [(-.4,0),(.4,0),(0,.4)]:s.line([(x+direction*.32,2.5+dy,3.5+dz),(x+direction*.77,2.5,3.5)],'edge',.017)
        s.unit(x,.25,.28,'router',2.05)
        s.box(x,.25,.65,1.94,1.3,.12,'paper')
        for j in range(8):s.box(x-.68+j*.19,-.43,.68,.10,.04,.04,'blue')
        s.line([(x,2.5,3.5),(x,2.5,.48),(x,.25,.48)],'blue',.027)
        s.text('SITIO A' if x<0 else 'SITIO B',x-.61,1.52,.43,.19,'ink')
        s.parts.extend(['radio-dish','lattice-mast','fiber-termination'])
    # The fiber option is separate and muted; not a series stage after radio.
    s.line([(-4.1,.0,.24),(-4.1,-1.02,.24),(3.9,-1.02,.24),(3.9,.0,.24)],'blue',.024)
    for j in range(7):s.box(-3.0+j,-1.02,.25,.13,.11,.035,'edge')
    s.text('FIBRA / ALTERNATIVA DE TRANSPORTE',-2.85,-1.49,.23,.13,'paper')
    s.line([(-3.30,2.5,3.5),(3.10,2.5,3.5)],'trace',.01)
    s.route([(-4.1,.25,.48),(-4.1,2.5,.48),(-4.1,2.5,3.5),(-3.30,2.5,3.5),(3.10,2.5,3.5),(3.9,2.5,3.5),(3.9,2.5,.48),(3.9,.25,.48)],.04,.93)


def support(s):
    s.base(0,1.0,11.6,7.5,'SOPORTE / DEL EVENTO A LA RECUPERACION')
    s.rack(-3.65,3.0,units=4,door=False)
    s.desk(2.3,.0,w=3.45,kind='incident')
    # A continuous operations wall rather than six floating generic cards.
    s.screen(2.0,3.8,1.60,4.5,2.25,'incident')
    s.box(2.0,3.91,.23,4.8,.25,1.0,'graphite')
    for j in range(3):
        xx=.52+j*1.43
        s.box(xx,3.58,.56,1.21,.025,.42,'slate')
        s.text(['DETECTAR','DIAGNOSTICAR','VERIFICAR'][j],xx-.54,3.56,.76,.075,'paper',True)
        s.box(xx,3.55,.64,.75,.008,.022,'red' if j==0 else 'signal')
    # Field kit: tablet, cable tester, connected notebook, closed intervention case.
    s.box(-2.65,-.90,.23,2.4,1.40,.17,'edge')
    s.box(-3.23,-.85,.40,.79,1.05,.045,'graphite');s.box(-3.23,-.85,.448,.66,.88,.008,'screen')
    for i in range(4):s.box(-3.23,-1.12+i*.18,.458,.45,.025,.005,'signal' if i==3 else 'muted')
    s.box(-2.15,-.88,.40,.50,1.0,.12,'red');s.box(-2.15,-.62,.529,.35,.30,.01,'screen')
    s.line([(-2.15,-.31,.47),(-1.3,-.31,.47),(-1.3,.73,.47),(-3.65,.73,.47),(-3.65,2.1,.67)],'trace',.026)
    s.route([(-3.65,2.15,2.1),(-1.6,2.15,2.1),(-1.6,3.7,2.1),(2,3.7,2.1),(2,3.7,1.05),(2,.2,1.05)],0,.51)
    s.route([(2,.2,1.05),(.1,.2,1.05),(.1,-.31,.47),(-1.3,-.31,.47),(-3.65,-.31,.47),(-3.65,2.1,.67)],.49,.95)
    s.parts.extend(['incident-console','field-kit'])


def consulting(s):
    s.base(0,1.0,11.6,7.5,'CONSULTORIA / EVIDENCIA ANTES DE DECIDIR')
    # A survey model on an architectural worktable, with actual routes and riser.
    s.box(-2.8,2.1,.35,4.8,4.05,.11,'paper')
    for yy in (.7,2.2,3.7):
        for left,right in [(-4.88,-3.6),(-3.6,-.71)]:s.box((left+right)/2,yy,.46,right-left-.055,.06,.55,'muted')
    for xx in (-4.88,-3.6,-.71):s.box(xx,2.2,.46,.055,3.05,.55,'muted')
    for xx,yy in [(-4.3,1.4),(-2.4,1.4),(-2.4,3.0),(-1.2,3.0)]:
        s.box(xx,yy,.47,.63,.39,.20,'edge');s.box(xx,yy,.68,.6,.36,.015,'blue')
    s.line([(-4.7,.95,.53),(-4.7,3.1,.53),(-1.0,3.1,.53),(-1.0,1.3,.53),(-2.8,1.3,.53)],'red',.019)
    s.box(-.9,2.25,.46,.33,.6,1.20,'graphite')
    for i in range(6):s.box(-.9,1.94,.56+i*.15,.22,.012,.065,'edge')
    s.text('RELEVAMIENTO',-4.75,.32,.466,.17,'ink')
    # Survey markings are part of the drawing: rooms, dimensions, endpoints.
    for j in range(20):
        s.box(-4.72+j*.20,3.92,.467,.01,.11 if j%5==0 else .06,.003,'ink')
    for j in range(14):
        s.box(-5.04,1.0+j*.20,.467,.09 if j%5==0 else .05,.009,.003,'ink')
    for xx,yy in [(-4.3,1.4),(-2.4,1.4),(-2.4,3.0),(-1.2,3.0)]:
        s.line([(xx,yy,.71),(xx,yy+.31,.71),(xx+.2,yy+.31,.71)],'red',.012)
        s.cylinder(xx+.2,yy+.31,.71,.025,.01,'red')
    for j in range(3):
        s.text(['01 / ACCESO','02 / OPERACION','03 / NUCLEO'][j],-4.64+j*1.37,3.35,1.02,.085,'ink')
    # Evidence portfolio with legible hierarchy and distinct diagrams.
    for j in range(3):
        x=1.0+j*1.58;y=2.80
        s.box(x,y,.38+j*.018,1.34,2.20,.022,'paper')
        s.text(['DEPENDENCIAS','RIESGOS','ALTERNATIVAS'][j],x-.58,y+.77,.425+j*.018,.10,'ink')
        zz=.423+j*.018
        if j==0:
            for dx,dy in [(-.3,.3),(.3,.3),(0,-.25)]:
                s.box(x+dx,y+dy,zz,.26,.23,.015,'slate')
            s.line([(x-.3,y+.16,zz+.012),(x-.3,y-.11,zz+.012),(x+.3,y-.11,zz+.012),(x+.3,y+.16,zz+.012)],'blue',.009)
            s.line([(x,y-.11,zz+.012),(x,y-.25,zz+.012)],'red',.01)
        elif j==1:
            for a in range(3):
                for b in range(3):s.box(x-.30+a*.3,y-.3+b*.3,zz,.25,.25,.012,'red' if (a,b)==(2,2) else 'blue' if a+b>1 else 'muted')
        else:
            for k in range(3):
                s.box(x-.10,y+.32-k*.31,zz,.75,.19,.013,'slate')
                s.box(x+.45,y+.32-k*.31,zz,.10,.10,.015,'red' if k==1 else 'muted')
        s.box(x-.44,y-.79,.422+j*.018,.10,.10,.006,'red')
        for k in range(4):
            s.box(x+.20,y-.80+k*.15,.423+j*.018,.36,.012,.003,'ink')
    # A plan is a visible dependency path, not an invented quantitative score.
    s.box(1.3,-.9,.27,6.30,2.10,.045,'paper')
    s.text('PLAN DE IMPLEMENTACION',-1.52,-.32,.321,.17,'ink')
    for j in range(4):
        x=-.95+j*1.45
        s.box(x,-1.06,.32,1.20,.75,.055,'slate')
        s.text(['ORDENAR','PRIORIZAR','IMPLEMENTAR','VERIFICAR'][j],x-.53,-1.04,.38,.085,'paper')
        if j<3:s.line([(x+.6,-1.10,.33),(x+.85,-1.10,.33)],'red',.017)
    s.route([(-2.8,1.3,.55),(-2.8,-.04,.55),(-.95,-.04,.55),(-.95,-1.1,.40),(3.4,-1.1,.40)],0,.95)
    s.parts.extend(['survey-model','evidence-portfolio','dependency-roadmap'])


def fire(s):
    s.base(0,1.0,11.8,7.9,'INCENDIO / DETECTAR, IDENTIFICAR, NOTIFICAR')
    # A cutaway wing: coverage lives in spaces, not a stack of anonymous red boxes.
    for x in (-4.95,-2.58,-.2):
        s.box(x,2.8575,.22,.07,3.615,2.50,'paper')
    s.box(-2.58,4.7,.22,4.80,.07,2.50,'paper')
    for x in (-3.76,-1.4):
        s.box(x,2.8,2.69,2.28,.075,.07,'edge')
        s.dome(x,2.8,2.77)
        s.box(x,1.03,.23,1.60,.025,.012,'muted')
    s.panel(3.25,2.8,.35,True)
    # Separate standby batteries with visible terminals, adjacent to the panel.
    for x in (2.73,3.76):
        s.box(x,.65,.23,.86,.90,.66,'graphite')
        s.box(x,.65,.89,.82,.86,.035,'edge')
        for dx in (-.25,.25):s.box(x+dx,.57,.93,.085,.085,.07,'red' if dx<0 else 'black')
    s.line([(2.48,.57,1.00),(2.48,1.9,1.00),(3.25,1.9,1.0),(3.25,2.45,1.0)],'trace',.023)
    # Manual call point and separate sounder/beacon on the corridor side.
    s.box(-.08,.2,.22,.075,.075,2.35,'edge')
    s.box(-.08,.12,1.18,.42,.18,.45,'red');s.box(-.08,.018,1.29,.29,.014,.17,'paper')
    s.box(-.08,.12,2.05,.43,.21,.45,'red')
    for k in range(5):s.box(-.08,.008,2.1+k*.048,.3,.01,.018,'ink')
    s.cylinder(-.08,.1,2.51,.15,.13,'paper')
    # A supervised detection loop returns to the panel. Notification is a branch.
    loop=[(3.25,2.8,2.98),(3.25,4.97,2.98),(-4.95,4.97,2.98),(-4.95,2.8,2.98),(-3.76,2.8,2.98),(-1.4,2.8,2.98),(-.08,2.8,2.98),(-.08,.2,2.98),(1.25,.2,2.98),(1.25,3.9,2.98),(3.25,3.9,2.98),(3.25,2.8,2.98)]
    s.line(loop,'red',.026)
    s.routes.append(dict(pts=loop[4:]+loop[1:5],start=0,end=.77))
    s.route([(3.25,2.47,2.10),(1.65,2.47,2.10),(1.65,.1,2.10),(-.08,.1,2.28)],.77,1)
    s.text('LAZO SUPERVISADO',-4.68,-.8,.23,.14,'paper')
    s.text('RESPALDO INDEPENDIENTE',1.98,-.40,.23,.12,'paper')
    s.parts.extend(['supervised-loop','manual-call-point','notification','standby-battery'])


def power(s):
    s.base(0,1.0,12.2,7.8,'ENERGIA IT / CONTINUIDAD EN CADA CAPA')
    s.panel(-4.1,2.7,.3)
    # UPS shown as a manufactured chassis, with power module and battery strings.
    x,y=-.35,2.6
    s.box(x,y,.25,2.12,1.83,3.26,'graphite')
    s.box(x,y-.94,.34,1.91,.045,3.04,'edge')
    s.box(x,y-.975,2.70,1.62,.02,.50,'graphite')
    s.box(x-.23,y-.994,2.80,.73,.014,.28,'screen')
    for k in range(3):s.box(x-.23,y-1.005,2.845+k*.07,.53,.009,.024,'signal')
    s.lamp(x+.6,y-1.012,2.94)
    for k in range(3):
        zz=.55+k*.64
        s.box(x,y-.979,zz,1.64,.03,.49,'graphite')
        for j in range(15):s.box(x-.68+j*.094,y-1.001,zz+.09,.027,.008,.30,'ink')
        for xx in (x-.75,x+.75):s.box(xx,y-1.03,zz+.12,.035,.04,.26,'paper')
    # Battery drawer pulled out enough to show modules and busbars.
    s.box(-.35,-.0,.26,2.05,1.93,.07,'edge')
    for ix in range(3):
        for iy in range(2):
            xx=-1.04+ix*.68;yy=-.47+iy*.92
            s.box(xx,yy,.34,.58,.74,.58,'graphite')
            s.box(xx,yy,.92,.57,.72,.033,'paper')
            for dx in (-.15,.15):s.box(xx+dx,yy,.96,.055,.1,.046,'copper')
            # Series straps join adjacent modules, never a battery's own terminals.
            if ix<2:s.line([(xx+.15,yy,1.01),(xx+.53,yy,1.01)],'copper',.025)
    for iy in range(2):
        yy=-.47+iy*.92
        s.line([(-1.19,yy,1.01),(-1.60,yy,1.01),(-1.60,1.2,.55),(-.74,1.70,.55)],'black',.026)
        s.line([(.47,yy,1.01),(.96,yy,1.01),(.96,1.2,.55),(.04,1.70,.55)],'red',.026)
    s.rack(3.82,2.85,units=5,door=False)
    # Distribution strip is a separate parallel branch to the protected loads.
    s.box(2.04,2.90,.40,.23,.35,3.00,'paper')
    for j in range(7):
        s.box(2.04,2.712,.60+j*.36,.15,.014,.22,'ink')
        for dx in (-.034,.034):s.box(2.04+dx,2.702,.66+j*.36,.013,.005,.055,'black')
    s.route([(-4.1,2.36,.86),(-4.1,4.4,.86),(-.35,4.4,.86),(-.35,2.6,.86)],0,.44)
    s.route([(-.35,2.6,2.85),(-.35,4.4,2.85),(2.04,4.4,2.85),(2.04,2.9,2.85),(3.82,2.0,2.85)],.43,.98)
    s.line([(-.35,1.7,.54),(-.35,1.1,.54),(-.35,.89,.54)],'trace',.04)
    s.text('PROTECCION',-4.92,1.82,.23,.13,'paper')
    s.text('RESERVA DE ENERGIA',-1.5,-1.55,.23,.13,'paper')
    s.text('CARGAS IT',2.8,1.47,.23,.13,'paper')
    s.parts.extend(['ups','battery-drawer','power-distribution'])


BUILDERS = {'101':networks,'102':security,'103':telecom,'105':support,'106':consulting,'107':fire,'108':power}


def validate(s):
    assert len(s.boxes)>50
    assert len(s.parts)>=3 and s.routes
    for b in s.boxes:
        assert min(b[k] for k in ('w','d','h'))>0
        assert all(math.isfinite(b[k]) for k in ('x','y','z','w','d','h'))
    for r in s.routes:
        assert 0<=r['start']<r['end']<=1
        assert all(math.dist(a,b)>0 for a,b in zip(r['pts'],r['pts'][1:]))
    assert all(abs(a-b)<1e-8 for a,b in zip(pose(0),pose(FRAMES-1)))
    return {'service':s.code,'scene':SERVICES[s.code]+'-system-v1','boxes':len(s.boxes),
            'cylinders':len(s.cylinders),'parts':sorted(set(s.parts)),
            'frames':FRAMES,'fps':FPS,'duration':FRAMES/FPS}


def render(args,s):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.render.engine='CYCLES' if args.engine=='cycles' else 'BLENDER_EEVEE_NEXT'
    scene.cycles.device='CPU';scene.cycles.samples=args.samples;scene.cycles.use_denoising=True
    scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.035;scene.cycles.adaptive_min_samples=4;scene.cycles.max_bounces=4
    scene.eevee.taa_render_samples=args.samples;scene.eevee.use_raytracing=False
    scene.eevee.shadow_ray_count=3;scene.eevee.shadow_step_count=8
    scene.render.threads_mode='FIXED';scene.render.threads=4
    scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
    scene.render.fps=FPS;scene.render.use_persistent_data=True;scene.view_settings.view_transform='AgX'
    scene.world=bpy.data.worlds.new('UM graphite atelier');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.045,.055,.070,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.32
    palette=[('floor','#0B1019',.08,.5),('base','#121A26',.35,.4),('slate','#344252',.28,.45),
             ('graphite','#263344',.42,.32),('edge','#8DA1B2',.65,.3),('metal','#71879A',.55,.31),
             ('paper','#E4EBED',.08,.39),('ink','#26374C',.15,.43),('black','#070C13',.1,.45),
             ('muted','#8A9EB0',.2,.4),('red','#DC2626',.25,.3),('blue','#577F9D',.3,.4),
             ('trace','#4C6175',.5,.32),('screen','#122A36',.22,.3),('signal','#9FCCC2',.2,.3),
             ('copper','#C99A64',.65,.34),('lens','#256487',.65,.14),('packet','#FF5645',.25,.25)]
    mats={}
    for name,color,metal,rough in palette:
        m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF']
        rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];rgb=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb]
        p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
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
        bevel=obj.modifiers.new('Manufactured edges','BEVEL');bevel.width=.008;bevel.segments=2
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
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.065)
        obj=bpy.context.object;obj.data.materials.append(mats['packet']);packets.append((obj,r))
        for p in obj.data.polygons:p.use_smooth=True
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.05));bpy.context.object.data.materials.append(mats['floor'])
    def area(name,at,power,size,color):
        d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
        obj=bpy.data.objects.new(name,d);scene.collection.objects.link(obj);obj.location=at
        obj.rotation_euler=(Vector((0,1.2,1.0))-obj.location).to_track_quat('-Z','Y').to_euler()
    area('Warm key',(-4,-7,14),2600,9,(1,.94,.86));area('Cool rim',(4,9,11),2300,7,(.73,.85,1));area('Front fill',(7,-7,7),1100,8,(.94,.98,1))
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
        t=frame/(FRAMES-1);size,angle,pan,lift=pose(frame);target=Vector((pan,1.30,1.05+lift))
        cam.location=target+Vector((24*math.cos(angle),24*math.sin(angle),22));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
        camera.ortho_scale=size*1.025;camera.shift_x=-.10;camera.shift_y=.004
        for obj,r in packets:
            visible=r['start']<=t<=r['end'];obj.hide_render=not visible
            q=(t-r['start'])/(r['end']-r['start'])
            obj.location=travel(r,smooth(q))
            fade=max(.001,min(smooth(q/.08),smooth((1-q)/.08)))
            obj.scale=(fade,fade,fade)
        for obj in parents.values():obj.rotation_euler[2]=-math.radians(68)*math.sin(math.pi*t)**2
        bpy.context.view_layer.update()
        allbounds=list(bounds)
        for (mat,group),(vv,_) in groups.items():
            if group:allbounds.extend(tuple(parents[group].matrix_world@Vector(p)) for p in vv)
        projected=[world_to_camera_view(scene,cam,Vector(p)) for p in allbounds]
        extent=[min(p.x for p in projected),min(p.y for p in projected),max(p.x for p in projected),max(p.y for p in projected)]
        # Leftmost 400px are encoded breathing room; mobile preserves every object.
        assert extent[0]>.215 and extent[1]>.07 and extent[2]<.98 and extent[3]<.93,(s.code,frame,extent)
        scene.render.filepath=str(out/f'{frame:04d}.png');start=time.time();bpy.ops.render.render(write_still=True)
        record={'frame':frame,'seconds':round(time.time()-start,2)};timings.append(record)
        extents.append({'frame':frame,'bounds':extent});print(json.dumps(record),flush=True)
    info={**validate(s),'blender':bpy.app.version_string,'engine':scene.render.engine,'samples':args.samples,
          'resolution':[1920,1080],'camera':'one continuous 24 second orbit; matching loop endpoints',
          'bounds':extents,'timings':timings}
    (out/'render-info.json').write_text(json.dumps(info))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--service',choices=list(SERVICES),required=True)
    p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=FRAMES-1)
    p.add_argument('--samples',type=int,default=48);p.add_argument('--engine',choices=['eevee','cycles'],default='eevee')
    p.add_argument('--output',default='frames');p.add_argument('--proof-frames');p.add_argument('--validate-only',action='store_true')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 0<=args.start<=args.end<FRAMES and 16<=args.samples<=96
    s=Studio(args.service);BUILDERS[args.service](s);info=validate(s)
    if args.validate_only:print(json.dumps(info))
    else:render(args,s)
