"""Sector-specific architectural cinema, v6: path-traced light and physical materials.
Same cameras, timing and geometry as v5, so the page story stays in sync.
Blender runs on remote runners only."""
import argparse, copy, hashlib, json, math, sys, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
FPS,FRAMES,S=60,1080,1/40
# Site background behind the film (pre-view-transform value, tuned in proofs).
BG='#0b1620'
SCENES=['building','clinic','terminal','plant','winery','mine']
NAMES={'building':'Edificio conectado','clinic':'Atención conectada','terminal':'Una terminal en operación','plant':'Producción conectada','winery':'Del tanque al registro','mine':'Enlaces en el terreno'}
# Two different operational subjects per sector; neither defaults to the rack.
FOCUS={'building':[(215,86,36),(300,163,83)],'clinic':[(239,83,26),(217,244,35)],'terminal':[(236,61,36),(390,273,45)],'plant':[(205,110,42),(420,269,44)],'winery':[(194,105,58),(320,283,36)],'mine':[(310,319,94),(264,65,38)]}
COLORS={'101':'#62CDBF','102':'#AE9EDB','107':'#F18478','108':'#E3BA70','103':'#81B9F0'}
LEVELS={'108':95,'101':195,'102':295,'107':395,'103':195}

def smooth(x):
 x=max(0,min(1,x));return x*x*x*(x*(x*6-15)+10)
def mix(a,b,t):return a+(b-a)*t
def envelope(t,a,b,c,d):return smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)))
def camera_pose(frame,scene,wide=28,composition='wide',expanded=None):
 t=frame/(FRAMES-1);a,b=FOCUS[scene];center=(300,170,50);expanded=expanded or wide*1.12
 # The overhead layer view opens a third spatial relationship, then returns.
 keys=[(0,center,wide,1.05),(.13,center,wide,1.05),(.34,a,15 if composition=='wide' else 11.5,.88),(.53,b,17 if composition=='wide' else 13,.92),(.72,(300,170,220),expanded,1.1),(.87,(300,170,220),expanded,1.1),(1,center,wide,1.05)]
 for left,right in zip(keys,keys[1:]):
  if t<=right[0]:
   u=smooth((t-left[0])/(right[0]-left[0]));return tuple(mix(x,y,u)*S for x,y in zip(left[1],right[1])),mix(left[2],right[2],u),mix(left[3],right[3],u)
 return tuple(x*S for x in center),wide,1.05

def author(scene_id):
 data=json.loads((ROOT/'src/assets/cine/isometric/site-projects-v1.json').read_text())
 p=copy.deepcopy(next(x for x in data['scenes'] if x['id']==scene_id))
 # A representative floor, not three opaque slabs obscuring the installation.
 if scene_id=='building':
  p['boxes']=[b for b in p['boxes'] if b['z']<103]
  p['lines']=[l for l in p['lines'] if max(q[2] for q in l['points'])<107]
  p['circles']=[c for c in p['circles'] if c['at'][2]<107]
 p['routes']=[];p['labels']=[];p['cylinders']=p.get('cylinders',[])
 if scene_id not in ['building','clinic']:
  p['boxes']=[b for b in p['boxes'] if not b['id'].startswith('partition-')]
 if scene_id=='mine':
  p['boxes']=[b for b in p['boxes'] if not b['id'].startswith(('column-','tray-','shaft-','wifi-','data-outlet-'))]
  for b in p['boxes']:
   if b['id'].startswith('mast-'):b['service']=None
  for c in p['cylinders']:
   if c['id'].startswith('radio-reflector-'):
    c.update(service='103',axis='x',y=319,x=c['x']+(4 if c['x']<300 else -7))
  p['lines']=[l for l in p['lines'] if l.get('service') or not any(q[2]==94 for q in l['points'])]
 palette={**data['palette'],'body':'#263544','side':'#526579','metal':'#8EA5B7','top':'#BFCED8','edge':'#9EB6C6','slab':'#31495C','screen':'#162B3A','white':'#DDE7EC','glass':'#7698AE','red':'#CF5B52','contact':'#152C3D'}
 palette.update({'route-'+k:v for k,v in COLORS.items()})
 def box(id,x,y,z,w,d,h,mat='metal',service=None):
  p['boxes'].append(dict(id=id,x=x,y=y,z=z,w=w,d=d,h=h,material=mat,service=service))
 def line(points,mat='edge',width=.65,service=None):
  p['lines'].append(dict(points=points,color=mat,width=width,service=service))
 def cyl(id,x,y,z,r,h,mat='metal',axis='z',top=None,service=None):
  p['cylinders'].append(dict(id=id,x=x,y=y,z=z,r=r,h=h,topR=r if top is None else top,material=mat,axis=axis,service=service))
 def route(code,points):
  orth=[list(points[0])]
  for target in points[1:]:
   axes=[2,1,0] if target[2]>orth[-1][2] else [1,0,2]
   for axis in axes:
    if target[axis]!=orth[-1][axis]:
     step=orth[-1].copy();step[axis]=target[axis];orth.append(step)
  p['routes'].append(dict(code=code,points=orth))
 def device(id,x,y,z,code):
  box(id,x,y,z,7,4,6,'white',code);box(id+'-face',x,y+2.1,z+1,5,.4,4,'screen',code)
  for dx in [-1.5,1.5]:box(id+'-port'+str(dx),x+dx,y+2.4,z+2,1,.3,1.8,'route-'+code,code)
 def label(text,at):p['labels'].append(dict(text=text,at=at))
 # Exact mounting: the distribution trunk follows the physical tray.
 for x in ([] if scene_id=='mine' else range(32,555,16)):
  line([[x,158,81],[x,172,81]],'metal',.9)
 for y in ([] if scene_id=='mine' else [158,172]):line([[25,y,81],[558,y,81]],'edge',1.2)
 for x in ([] if scene_id=='mine' else range(45,550,82)):
  line([[x,159,81],[x,159,101]],'side',.65);line([[x,172,81],[x,172,101]],'side',.65)
 for z in ([] if scene_id=='mine' else range(10,101,9)):line([[545,238,z],[565,238,z]],'edge',.7)
 # Articulate the wall construction without an opaque enclosing facade.
 for x in ([164,337] if scene_id in ['building','clinic'] else []):
  for y in range(8,121,18):
   box('wall-stud',x,y,0,1.3,1.3,65,'side')
  for z in [1,65]:line([[x,4,z],[x,123,z]],'edge',.6)
  line([[x,125,0],[x+19,125,0],[x+19,125,58]],'metal',.7)
 # Separate conduits, terminals and loops; never draw software as a cable.
 endpoints=[]
 if scene_id=='building':endpoints=[(72+177*c,49+68*r,39) for r in range(2) for c in range(3)]
 elif scene_id=='clinic':endpoints=[(68+172*c,32+74*r,36) for r in range(2) for c in range(3)]+[(217,257,41),(85,257,41)]
 elif scene_id=='terminal':endpoints=[(52+91*i,61,40) for i in range(5)]+[(390,273,57)]
 elif scene_id=='plant':endpoints=[(93+122*c,97+102*r,32) for r in range(2) for c in range(3)]+[(420,270,58)]
 elif scene_id=='winery':endpoints=[(68+123*c,81+111*r,58) for r in range(2) for c in range(3)]+[(461,55,42),(398,290,72)]
 else:endpoints=[(184+65*i,52,42) for i in range(3)]+[(62,55+93*i,32) for i in range(3)]
 for i,(x,y,z) in enumerate(endpoints):
  yy=160 if y<165 else 170
  route('101',[[540,278,60],[540,146,8],[x,146,8],[x,y,8],[x,y,z]] if scene_id=='mine' else [[540,278,60],[540,165,60],[540,165,85],[x,165,85],[x,y,85],[x,y,z]])
  device('network-terminal-'+str(i),x,y,z,'101')
  route('108',[[481,265,27],[562,265,6],[562,157,6],[x,157,6],[x,y+5,6],[x,y+5,max(14,z-10)]] if scene_id=='mine' else [[481,265,27],[562,265,27],[562,176,27],[562,176,78],[x,176,78],[x,y+5,78],[x,y+5,max(14,z-10)]])
  box('power-socket',x,y+5,max(14,z-10),4,2,5,'white','108')
 # A physically closed, supervised detection loop returns to its panel.
 loop=[[512,306,46],[575,306,94],[575,230,94],[42,230,94],[42,80,94],[575,80,94],[575,296,94],[512,296,46]]
 if scene_id=='mine':loop=[[512,306,46],[512,296,9],[62,296,9],[62,45,9],[72,45,9],[72,296,9],[512,296,46]]
 route('107',loop)
 for x,y in ([(62,y) for y in [51,144,237]] if scene_id=='mine' else [(x,y) for x in [74,248,422] for y in [80,230]]):
  h=45 if scene_id=='mine' else 94
  route('107',[[x,y,9 if scene_id=='mine' else 94],[x,y+4,h]])
  cyl('detector-rim',x,y+4,h,4.5,1,'white',service='107');cyl('detector-core',x,y+4,h+1,3,1,'metal',service='107')
  for a in range(8):
   q=a*math.pi/4;box('detector-slot',x+3.8*math.cos(q),y+4+3.8*math.sin(q),h+.5,.45,.8,.7,'body','107')
 for x in [20,374]:
  route('102',[[540,278,66],[557,278,66],[557,307,91],[x,307,91],[x,321,91],[x,321,82]])
  cyl('camera-lens',x,331,83,2.2,1,'screen','y',service='102');cyl('camera-lens-ring',x,332,83,2.6,.3,'metal','y',service='102')
 # Wireless and wall outlets have their own real branch off the tray.
 for x in ([] if scene_id=='mine' else [74,248,422]):
  route('101',[[540,165,85],[x,165,85],[x,142,85],[x,142,91]])
  route('101',[[540,165,85],[x,165,85],[x,119,85],[x,119,19]])
 # Physical construction details specific to the operation in view.
 if scene_id=='building':
  for i,(x,y,z) in enumerate(endpoints):
   for dx in [-20,20]:
    line([[x+dx,y+15,11],[x+dx,y+20,26]],'edge',.6)
   box('floor-box',x+31,y+18,0,9,8,1.5,'top');line([[x+27,y+18,1.6],[x+35,y+18,1.6]],'side',.8)
  for x in range(48,551,48):line([[x,180,-.1],[x,321,-.1]],'edge',.25)
  for x in [165,338]:
   box('door-leaf',x+12,125,0,24,1.3,58,'metal')
   box('door-vision',x+12,126,24,14,.5,24,'glass')
   line([[x+21,126.6,27],[x+16,126.6,27]],'white',.8)
  for x in [113,158,203]:
   box('meeting-notebook',x,252,29,16,11,.8,'body');box('meeting-notebook-page',x,252,30,14,9,.2,'white')
  label('PUESTOS / NIVEL 01',(205,30,2));label('DISTRIBUCIÓN',(292,181,83))
 elif scene_id=='clinic':
  for c in range(3):
   for r in range(2):
    x,y=68+172*c,44+74*r
    box('headwall',x,y-35,30,44,4,12,'white')
    for j in range(4):box('headwall-module',x-15+j*9,y-32.7,33,5,.5,5,'metal')
    for dx in [-18,18]:
     line([[x+dx,y-20,22],[x+dx,y-20,32],[x+dx,y+20,32],[x+dx,y+20,22]],'metal',1)
     for dy in [-24,24]:cyl('bed-castor',x+dx,y+dy,4,3,2,'body','y')
    box('clinical-monitor',x+30,y,30,16,3,12,'body');box('clinical-screen',x+30,y+1.6,31,14,.3,10,'screen')
    line([[x+24,y+2,36],[x+27,y+2,36],[x+28,y+2,39],[x+29,y+2,33],[x+31,y+2,36],[x+36,y+2,36]],'route-101',.5)
    line([[x-29,y+12,0],[x-29,y+12,64],[x-24,y+12,64]],'metal',1)
  for x in [68,240,412]:
   for y in [44,118]:
    box('bed-footboard',x,y+33,12,44,2,15,'white')
    box('bed-control',x+18,y+32,23,5,.6,2,'route-101')
    for yy in [y-18,y+17]:
     line([[x-14,yy,12],[x+14,yy,5],[x+14,yy,12],[x-14,yy,5]],'metal',.9)
    box('chart-holder',x-9,y+34.2,18,9,.6,6,'metal')
   line([[x-35,7,66],[x+35,7,66],[x+35,143,66]],'metal',.6)
  label('ATENCIÓN',(210,10,2));label('ENFERMERÍA',(217,225,2))
 elif scene_id=='terminal':
  for i in range(5):
   x=52+91*i
   for j in range(10):cyl('conveyor-roller',x+33,23+j*8,13.6,1.6,14,'metal','y')
   box('baggage-case',x+33,40,16,11,19,15,'body')
   line([[x+30,38,31],[x+30,44,31],[x+35,44,31],[x+35,38,31]],'top',.7)
   box('boarding-reader',x+18,69,30,8,12,3,'body');box('reader-window',x+18,70,33,5,6,.3,'route-102')
  for x in [357,410]:
   box('gate-pedestal',x,274,0,8,26,38,'metal','102');box('gate-glass',x+8,274,6,1,22,34,'glass','102')
  for x in range(0,481,40):
   line([[x,0,0],[x,0,102]],'metal',1)
  box('terminal-glazing',240,0,0,480,.3,102,'glass')
  box('flight-board',271,10,72,116,5,31,'body')
  for i in range(5):
   line([[218,13,76+i*5],[320,13,76+i*5]],'edge',.4)
   for xx in [249,282]:line([[xx,13,74],[xx,13,101]],'metal',.4)
  for y in [183,309]:line([[24,y,.2],[445,y,.2]],'route-108',.8)
  label('CHECK-IN',(220,18,2));label('CONTROL DE ACCESO',(373,315,2))
 elif scene_id=='plant':
  for r in range(2):
   for c in range(3):
    x,y=73+122*c,62+102*r
    for dx in [-26,26]:
     for zz in [9,65]:cyl('machine-fastener',x+dx,y+35.8,zz,1,1,'top','y')
    line([[x+32,y+30,10],[x+44,y+30,10],[x+44,y+30,50],[x+32,y+30,50]],'side',1.3)
  for z in [15,31,47,63]:
   box('din-rail',420,285,z,42,1,1.5,'metal','108')
   for x in range(404,438,6):box('breaker',x,286,z+1,4,3,8,'white','108');box('breaker-toggle',x,287.7,z+4,2,.5,3,'body','108')
  line([[446,285,0],[464,309,0],[464,309,78],[446,285,78]],'edge',.8)
  for x in [18,290,582]:
   line([[x,18,102],[x,170,120],[x,322,102]],'metal',1.4)
   for y in range(18,313,24):line([[x,y,102],[x,y+12,112],[x,y+24,102]],'edge',.5)
  for x in [73,195,317]:
   line([[x-40,215,.3],[x-40,320,.3],[x+40,320,.3],[x+40,215,.3]],'route-108',.8)
  label('CELDA PRODUCTIVA',(195,12,2));label('CONTROL / POTENCIA',(408,307,2))
 elif scene_id=='winery':
  for c in [c for c in p['cylinders'] if c['id'].endswith('-vessel')]:
   x,y=c['x'],c['y']
   for z in [29,49,70,88]:line([[x+28.2*math.cos(a*math.pi/32),y+28.2*math.sin(a*math.pi/32),z] for a in range(65)],'edge',.45)
   cyl('gauge-rim',x,y+28,57,3.4,1,'top','y');cyl('gauge-face',x,y+29,57,2.7,.2,'white','y')
   line([[x,y+29.3,57],[x+1.4,y+29.3,58.5]],'body',.5)
   line([[x,y+28,22],[x,y+41,22],[x+14,y+41,22]],'metal',2)
   for yy in [31,37]:cyl('sanitary-flange',x,yy+y,22,3.2,1,'top','y')
   box('actuator',x+14,y+41,23,8,8,6,'body');box('sensor-head',x,y+30,66,5,4,5,'white','101')
  for x in range(100,389,26):box('conveyor-guide',x,271,25,18,1,3,'metal')
  for x in [68,191,314]:
   for y in [51,162]:
    line([[x-12,y-12,100],[x-12,y+12,100],[x+12,y+12,100],[x+12,y-12,100],[x-12,y-12,100]],'metal',.6)
    for dx in [-12,12]:line([[x+dx,y+12,94],[x+dx,y+12,100]],'metal',.6)
  for y in [30,51,72]:line([[410,y,.1],[505,y,.1]],'edge',.25)
  label('INSTRUMENTACIÓN',(192,5,2));label('FRACCIONAMIENTO',(247,312,2))
 else:
  for x in [183,371]:
   for z in range(12,125,13):
    line([[x-6,315,z],[x+6,315,z+13],[x-6,315,z+13]],'metal',.8)
   for radius in [4,8,11]:line([[x+(7 if x<300 else -7),319+radius*math.cos(a*math.pi/32),115+radius*math.sin(a*math.pi/32)] for a in range(65)],'edge',.45,'103')
   line([[x,319,115],[x+(12 if x<300 else -12),319,115]],'body',1,'103')
   route('103',[[x,319,104],[x,319,9],[x,295,9],[540,295,9],[540,278,50]])
  # Radio propagation is a dotted line of sight, visually distinct from conduits.
  for x in range(187,368,8):line([[x,319,115],[x+3,319,115]],'route-103',.55,'103')
  for i in range(3):
   x,y=62,51+i*93
   for j in range(8):line([[x-25,y+34.5,6+j*2],[x-5,y+34.5,6+j*2]],'side',.6)
  for y in [135,146,157]:line([[155,y,.2],[491,y,.2]],'edge',.55)
  for x in range(178,492,36):line([[x,146,.3],[x+17,146,.3]],'route-108',1)
  for i in range(5):
   y=184+i*15;line([[390,y,.2],[424,y-6,.2],[463,y+4,.2],[511,y-1,.2]],'side',.35)
  label('RADIOENLACE',(267,335,2));label('DESPACHO',(268,8,2))
 # Small contact footprints ground equipment without a noisy studio shadow wash.
 for b in list(p['boxes']):
  if b['id'].startswith(('bed-base','process-0','process-1','rack','cabinet')) and b['w']>25 and b['d']>15:
   box('contact-footprint',b['x'],b['y'],.035,b['w']*.94,b['d']*.94,.01,'contact')
 # All surfaces and traces remain authored in the same physical coordinate system.
 return p,palette

def validate(scene_id):
 p,_=author(scene_id)
 for r in p['routes']:
  assert r['code'] in COLORS
  for a,b in zip(r['points'],r['points'][1:]):
   # Cable segments have orthogonal bends, including panel-to-tray risers.
   assert sum(abs(x-y)>1e-6 for x,y in zip(a,b))==1,(scene_id,a,b)
 for frame in range(FRAMES):
  v=camera_pose(frame,scene_id);assert all(math.isfinite(n) for n in (*v[0],v[1],v[2]))
 assert camera_pose(0,scene_id)==camera_pose(FRAMES-1,scene_id)
 assert FOCUS[scene_id][0]!=(518,277,43) and FOCUS[scene_id][1]!=(518,277,43)
 return p

def render(args):
 import bpy
 from mathutils import Vector
 from bpy_extras.object_utils import world_to_camera_view
 p,palette=author(args.scene)
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=args.samples;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.045;scene.cycles.adaptive_min_samples=12
 scene.cycles.max_bounces=4;scene.cycles.diffuse_bounces=1;scene.cycles.glossy_bounces=1;scene.cycles.transmission_bounces=2;scene.cycles.use_fast_gi=True;scene.cycles.ao_bounces_render=1;scene.cycles.transparent_max_bounces=16;scene.cycles.caustics_reflective=False;scene.cycles.caustics_refractive=False;scene.cycles.sample_clamp_indirect=4
 scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.denoising_input_passes='RGB_ALBEDO_NORMAL';scene.cycles.denoising_prefilter='ACCURATE'
 scene.render.film_transparent=True
 scene.render.resolution_x=args.width;scene.render.resolution_y=args.width if args.composition=='mobile' else round(args.width*9/16)
 scene.render.resolution_percentage=100;scene.render.fps=FPS;scene.render.threads_mode='FIXED';scene.render.threads=4
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.use_persistent_data=True
 scene.view_settings.view_transform='AgX'
 try:scene.view_settings.look='AgX - Medium High Contrast'
 except TypeError:pass
 scene.world=bpy.data.worlds.new('Architectural studio');scene.world.use_nodes=True
 scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.07,.105,.16,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
 mats={}
 def lin(color):
  rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
 # name: (metallic, roughness, extra). Colors stay the v5 palette; physics changes.
 SURF={'metal':(1,.3,{}),'edge':(.7,.34,{}),'body':(0,.42,{'Coat Weight':.15}),'side':(0,.62,{}),'top':(0,.48,{}),'white':(0,.38,{'Coat Weight':.25,'Coat Roughness':.2}),
       'slab':(0,.78,{}),'screen':(0,.12,{}),'glass':(0,.03,{'Transmission Weight':1,'IOR':1.45})}
 def mat(name,color,alpha=1,emission=0):
  m=bpy.data.materials.new(name);m.use_nodes=True;nodes=m.node_tree.nodes;nodes.clear();links=m.node_tree.links
  rgb=lin(color);out=nodes.new('ShaderNodeOutputMaterial')
  if name=='contact':
   links.new(nodes.new('ShaderNodeBsdfTransparent').outputs[0],out.inputs['Surface']);mats[name]=m;return m
  if emission or name in ('red','ink') or name.startswith('route-') or name.startswith('outline-') or name=='ghost':
   em=nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(*rgb,1)
   em.inputs[1].default_value=3.2 if name.startswith('route-') else 4 if name=='red' else 1.1 if name=='ink' else max(.6,emission*3)
   shader=em.outputs[0]
   if not name.startswith('route-'):m.cycles.emission_sampling='NONE'
  else:
   b=nodes.new('ShaderNodeBsdfPrincipled');metal,rough,extra=SURF.get(name,(0,.5,{}))
   b.inputs['Base Color'].default_value=(*rgb,1);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough
   for k,v in extra.items():b.inputs[k].default_value=v
   if name=='screen':
    # Live panels: a faint cold glow under a glossy face.
    b.inputs['Emission Color'].default_value=(*lin('#1d4e66'),1);b.inputs['Emission Strength'].default_value=.55;m.cycles.emission_sampling='NONE'
   if name in ('side','slab','top'):
    # Subtle large-scale variation so planes do not read as flat fills.
    tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.4;tex.inputs['Detail'].default_value=3
    ramp=nodes.new('ShaderNodeMapRange');ramp.inputs['To Min'].default_value=rough-.06;ramp.inputs['To Max'].default_value=rough+.06
    links.new(tex.outputs['Fac'],ramp.inputs['Value']);links.new(ramp.outputs['Result'],b.inputs['Roughness'])
   shader=b.outputs[0]
  if alpha<1 and name!='glass':
   m.surface_render_method='BLENDED';m.use_transparency_overlap=False
   tr=nodes.new('ShaderNodeBsdfTransparent');mx=nodes.new('ShaderNodeMixShader');mx.inputs[0].default_value=alpha
   links.new(tr.outputs[0],mx.inputs[1]);links.new(shader,mx.inputs[2]);links.new(mx.outputs[0],out.inputs['Surface'])
  else:links.new(shader,out.inputs['Surface'])
  mats[name]=m;return m
 for name,color in palette.items():mat(name,color)
 mat('ink','#EAF1F5',emission=.6);mat('floor','#142235');mat('ghost','#5B809B',alpha=.15)
 # The floor only catches shadows; the site background is composited underneath.
 roots={}
 for key in ['architecture',*COLORS]:
  obj=bpy.data.objects.new('layer-'+key,None);scene.collection.objects.link(obj);roots[key]=obj
 groups={}
 for b in p['boxes']:
  key=b.get('service') if b.get('service') in COLORS else 'architecture';verts,faces=groups.setdefault((b['material'],key),([],[]));off=len(verts)
  x,y,z=b['x']-b['w']/2,b['y']-b['d']/2,b['z'];w,d,h=b['w'],b['d'],b['h']
  verts.extend(tuple(t*S for t in xyz) for xyz in [(x,y,z),(x+w,y,z),(x+w,y+d,z),(x,y+d,z),(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)])
  faces.extend(tuple(off+i for i in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
 for circle in p['circles']:
  if circle.get('service')=='107':continue # Authored detector replaces the flat symbol.
  x,y,z=circle['at'];p['cylinders'].append(dict(x=x,y=y,z=z,r=circle['r'],h=.18,topR=circle['r'],material=circle['color'],axis='z',service=circle.get('service')))
 smooth_faces={}
 for c in p['cylinders']:
  key=c.get('service') if c.get('service') in COLORS else 'architecture'
  group=(c['material'],key);verts,faces=groups.setdefault(group,([],[]));off=len(verts);n=64
  for rr,t in [(c['r'],0),(c['topR'],c['h'])]:
   for i in range(n):
    a=2*math.pi*i/n;dx,dq=rr*math.cos(a),rr*math.sin(a)
    xyz=(c['x']+t,c['y']+dx,c['z']+dq) if c.get('axis')=='x' else (c['x']+dx,c['y']+t,c['z']+dq) if c.get('axis')=='y' else (c['x']+dx,c['y']+dq,c['z']+t)
    verts.append(tuple(v*S for v in xyz))
  faces.append(tuple(off+i for i in reversed(range(n))));faces.append(tuple(off+n+i for i in range(n)))
  smooth_faces.setdefault(group,[]).extend(range(len(faces),len(faces)+n))
  faces.extend((off+i,off+(i+1)%n,off+n+(i+1)%n,off+n+i) for i in range(n))
 for (name,key),(verts,faces) in groups.items():
  mesh=bpy.data.meshes.new(name+key);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name+key,mesh);scene.collection.objects.link(obj);obj.parent=roots[key];mesh.materials.append(mats[name])
  for idx in smooth_faces.get((name,key),[]):mesh.polygons[idx].use_smooth=True
  if name not in ['glass','contact']:
   bevel=obj.modifiers.new('Fine manufactured edges','BEVEL');bevel.width=.035 if name=='white' else .012;bevel.segments=2
   bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.modifier_apply(modifier=bevel.name);obj.select_set(False)
 lines={}
 for l in p['lines']:
  key=l.get('service') if l.get('service') in COLORS else 'architecture'
  lines.setdefault((l['color'],max(.003,l['width']*.009),key),[]).append(l['points'])
 segments=set()
 for r in p['routes']:
  for a,b in zip(r['points'],r['points'][1:]):
   identity=(r['code'],tuple(sorted((tuple(a),tuple(b)))))
   if identity in segments:continue
   segments.add(identity);lines.setdefault(('route-'+r['code'],.011,r['code']),[]).append([a,b])
 def curves(name,paths,radius,material,parent):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=1
  for points in paths:
   sp=c.splines.new('POLY');sp.points.add(len(points)-1)
   for a,b in zip(sp.points,points):a.co=(*[v*S for v in b],1)
  o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);c.materials.append(material);o.parent=parent;return o
 for (name,radius,key),paths in lines.items():curves(name,paths,radius,mats[name],roots[key])
 # Thin registered footprints make each engineering layer readable as a whole.
 outlines=[]
 for code in ['108','101','102','107']:
  m=mat('outline-'+code,COLORS[code],alpha=.25,emission=.2)
  obj=curves('footprint-'+code,[[[15,5,85],[585,5,85],[585,333,85],[15,333,85],[15,5,85]]],.004,m,roots[code]);outlines.append(obj)
 # Registration lines show which expanded layer belongs to the same building.
 guides=[]
 for code in ['108','101','102','107']:
  o=curves('registration-'+code,[[[20,330,0],[20,330,0.1]],[[580,330,0],[580,330,.1]]],.004,mats['ghost'],None);guides.append((code,o))
 font=bpy.data.fonts.load(str(Path(args.font_dir)/'UMSans-Regular.ttf'))
 def text(body,at,size=.19):
  c=bpy.data.curves.new('label','FONT');c.body=body;c.font=font;c.size=size;c.extrude=0;c.materials.append(mats['ink']);o=bpy.data.objects.new(body,c);scene.collection.objects.link(o);o.location=tuple(v*S for v in at);return o
 for label in p['labels']:
  o=text(label['text'],label['at'],.17);o.rotation_euler=(0,0,math.pi)
 # No unrelated plumbing/HVAC claims: show only the systems UM delivers.
 layer_labels=[]
 for code,name in [('108','01  ENERGÍA'),('101','02  RED / DATOS'),('102','03  SEGURIDAD'),('107','04  DETECCIÓN')]:layer_labels.append((code,text(name,(618,205,85))))
 bpy.ops.mesh.primitive_plane_add(size=200,location=(7.5,4.2,-.3));floor_obj=bpy.context.object;floor_obj.data.materials.append(mats['floor']);floor_obj.is_shadow_catcher=True
 # Soft key from the v5 drafting direction, a broad overhead fill and a cool world.
 import mathutils
 key=bpy.data.lights.new('Key','SUN');key.energy=3.2;key.angle=math.radians(11);key_o=bpy.data.objects.new('Key',key);scene.collection.objects.link(key_o)
 key_o.rotation_euler=mathutils.Vector((-.28,-.45,.85)).normalized().to_track_quat('Z','Y').to_euler()
 fill=bpy.data.lights.new('Fill','AREA');fill.energy=1800;fill.size=24;fill_o=bpy.data.objects.new('Fill',fill);scene.collection.objects.link(fill_o);fill_o.location=(7.5,4.2,22)
 rim=bpy.data.lights.new('Rim','SUN');rim.energy=1.1;rim.angle=math.radians(25);rim.use_shadow=False;rim_o=bpy.data.objects.new('Rim',rim);scene.collection.objects.link(rim_o)
 rim_o.rotation_euler=mathutils.Vector((.5,.6,.45)).normalized().to_track_quat('Z','Y').to_euler()
 scene.world.node_tree.nodes['Background'].inputs[0].default_value=(*lin('#6d8aa3'),1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
 # Compositor: soft glow on emitters, then the exact site background under the alpha.
 scene.use_nodes=True;tree=scene.node_tree;tree.nodes.clear()
 rl=tree.nodes.new('CompositorNodeRLayers');glare=tree.nodes.new('CompositorNodeGlare');glare.glare_type='FOG_GLOW';glare.quality='HIGH'
 # Blender moved glare settings from properties to sockets; support both.
 for prop,sock,val in [('threshold','Highlights Threshold',1.2),('size','Size',7),('mix','Strength',.45)]:
  if sock in glare.inputs:glare.inputs[sock].default_value=val if sock!='Size' else .55
  elif hasattr(glare,prop):setattr(glare,prop,val if prop!='mix' else -.55)
 comp=tree.nodes.new('CompositorNodeComposite');comp.use_alpha=True;setalpha=tree.nodes.new('CompositorNodeSetAlpha');setalpha.mode='REPLACE_ALPHA'
 tree.links.new(rl.outputs['Image'],glare.inputs['Image']);tree.links.new(glare.outputs['Image'],setalpha.inputs['Image']);tree.links.new(rl.outputs['Alpha'],setalpha.inputs['Alpha']);tree.links.new(setalpha.outputs['Image'],comp.inputs['Image'])
 def light(name,at,power,size):
  d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.use_shadow=name=='Key';d.use_shadow_jitter=False;d.shadow_filter_radius=2;d.shadow_maximum_resolution=.01;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=at;o.rotation_euler=(Vector((7.5,4,2))-o.location).to_track_quat('-Z','Y').to_euler()
 # Directional shading is carried by normals; no redundant light/shadow passes.
 camera=bpy.data.cameras.new('Sector director');camera.type='ORTHO';camera.clip_end=300;cam=bpy.data.objects.new('Sector director',camera);scene.collection.objects.link(cam);scene.camera=cam
 expanded_scale=35
 def set_camera(frame,wide):
  target,size,elev=camera_pose(frame,args.scene,wide,args.composition,expanded_scale);target=Vector(target);angle=math.radians({'building':55,'clinic':58,'terminal':68,'plant':34,'winery':42,'mine':30}[args.scene]+6*math.sin(2*math.pi*frame/(FRAMES-1)))
  cam.location=target+Vector((45*math.cos(angle),45*math.sin(angle),32*elev));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camera.ortho_scale=size;camera.shift_x=0
 corners=[Vector((x*S,y*S,z*S)) for b in p['boxes'] for x in [b['x']-b['w']/2,b['x']+b['w']/2] for y in [b['y']-b['d']/2,b['y']+b['d']/2] for z in [b['z'],b['z']+b['h']]]
 wide=24 if args.composition=='mobile' else 31
 for attempt in range(40):
  set_camera(0,wide);bpy.context.view_layer.update();q=[world_to_camera_view(scene,cam,v) for v in corners];bounds=[min(v.x for v in q),min(v.y for v in q),max(v.x for v in q),max(v.y for v in q)]
  if min(bounds[:2])>.045 and max(bounds[2:])<.955:break
  wide*=1.035
 else:raise ValueError(bounds)
 # Fit the complete expanded installation, including footprint corners and
 # vertical drops. Opening bounds alone cannot guarantee a safe exploded view.
 expanded_corners=[]
 for b in p['boxes']:
  dz=LEVELS.get(b.get('service'),0)
  expanded_corners.extend(Vector((x*S,y*S,(z+dz)*S)) for x in [b['x']-b['w']/2,b['x']+b['w']/2] for y in [b['y']-b['d']/2,b['y']+b['d']/2] for z in [b['z'],b['z']+b['h']])
 for code in ['108','101','102','107']:
  expanded_corners.extend(Vector((x*S,y*S,(85+LEVELS[code])*S)) for x in [15,585] for y in [5,333])
 expanded_scale=wide*1.12
 for attempt in range(40):
  expanded_bounds=[]
  for check_frame in [780,840,910]:
   set_camera(check_frame,wide);bpy.context.view_layer.update();q=[world_to_camera_view(scene,cam,v) for v in expanded_corners]
   expanded_bounds.append([min(v.x for v in q),min(v.y for v in q),max(v.x for v in q),max(v.y for v in q)])
  if all(min(b[:2])>.065 and max(b[2:])<.935 for b in expanded_bounds):break
  expanded_scale*=1.04
 else:raise ValueError(expanded_bounds)
 out=Path(args.output);out.mkdir(parents=True,exist_ok=True);timings=[]
 for frame in range(args.start,args.end+1):
  t=frame/(FRAMES-1);spread=envelope(t,.55,.72,.86,1)
  for code in COLORS:roots[code].location.z=LEVELS[code]*S*spread
  for obj in outlines:obj.hide_render=spread<.05;obj.data.bevel_depth=.004*spread
  for code,obj in guides:
   obj.hide_render=spread<.05
   for sp in obj.data.splines:sp.points[1].co.z=(85+LEVELS[code]*spread)*S
  for code,obj in layer_labels:
   obj.location.z=(85+LEVELS[code]*spread)*S;obj.hide_render=spread<.82
  set_camera(frame,wide)
  for code,obj in layer_labels:
   obj.rotation_euler=cam.rotation_euler
   # Align annotations in the screen margin, outside the registered geometry.
   right=cam.rotation_euler.to_matrix() @ Vector((1,0,0));up=cam.rotation_euler.to_matrix() @ Vector((0,1,0))
   target,_,_=camera_pose(frame,args.scene,wide,args.composition,expanded_scale);center=Vector(target)
   layer=Vector((300*S,170*S,(85+LEVELS[code]*spread)*S));vertical=(layer-center).dot(up)
   obj.location=center+right*(camera.ortho_scale*.32)+up*vertical
   obj.data.size=camera.ortho_scale*(.011 if args.composition=='wide' else .014)

  scene.render.filepath=str(out/f'{frame:04d}.png');start=time.time();bpy.ops.render.render(write_still=True);seconds=round(time.time()-start,3);timings.append({'frame':frame,'seconds':seconds});print(json.dumps(timings[-1]),flush=True)
 info={'version':'v6','scene':args.scene,'composition':args.composition,'fps':FPS,'frames':FRAMES,'start':args.start,'end':args.end,'resolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':args.samples,'shading':'pbr-pathtraced','engine':scene.render.engine,'source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'geometry_sha256':hashlib.sha256((ROOT/'src/assets/cine/isometric/site-projects-v1.json').read_bytes()).hexdigest(),'focus':FOCUS[args.scene],'wide_bounds':bounds,'wide_scale':wide,'expanded_scale':expanded_scale,'expanded_bounds':expanded_bounds,'boxes':len(p['boxes']),'circuits':len(p['routes']),'timings':timings}
 (out/'render-info.json').write_text(json.dumps(info))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--scene',choices=SCENES,required=True);p.add_argument('--composition',choices=['wide','mobile'],default='wide');p.add_argument('--width',type=int,default=3840);p.add_argument('--start',type=int,default=0);p.add_argument('--end',type=int,default=FRAMES-1);p.add_argument('--samples',type=int,default=8);p.add_argument('--font-dir',default='/tmp/um-fonts');p.add_argument('--output',default='frames');p.add_argument('--validate-only',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
 assert 0<=a.start<=a.end<FRAMES;assert a.width in [1080,1920,2160,3840];validate(a.scene)
 if a.validate_only:print(json.dumps({'valid':True,'scene':a.scene,'frames':FRAMES}))
 else:render(a)
