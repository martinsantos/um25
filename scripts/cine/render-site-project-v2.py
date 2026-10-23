"""Render the authored project on a remote CPU runner; never launch Blender on the Mac."""
import argparse, json, math, os, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FPS, FRAMES, SCALE = 24, 432, 1 / 40

def smooth(t):
    t = max(0, min(1, t))
    return t * t * t * (t * (t * 6 - 15) + 10)

CAMERA_KEYS = {
    'building': [(300,172,142),(535,243,148),(518,277,43)],
    'clinic': [(300,170,48),(245,83,24),(518,277,43)],
    'terminal': [(300,170,48),(239,64,37),(518,277,43)],
    'plant': [(300,170,48),(210,110,43),(518,277,43)],
    'winery': [(300,170,52),(192,151,58),(518,277,43)],
    'mine': [(300,170,61),(371,309,104),(518,277,43)],
}

def camera_pose(frame, wide=None, scene_id='building'):
    """Continuous camera from the whole site through its operation to its technical room."""
    wide = wide or 33.5
    # One 18-second approach and return. No stop/start at separate shot keys,
    # no extreme macro zoom, and matching position/velocity at the loop seam.
    poses = CAMERA_KEYS[scene_id]
    u=math.sin(math.pi*frame/(FRAMES-1))**2
    amount=smooth(u)
    target=tuple((x+(y-x)*amount)*SCALE for x,y in zip(poses[0],poses[2]))
    return target,wide+(12.5-wide)*amount,1-.16*amount

def validate(data,scene_id='building'):
    project=next(s for s in data['scenes'] if s['id']==scene_id)
    assert len(project['boxes']) > (400 if scene_id=='building' else 150)
    assert {'101','102','103','107','108'} <= {r['code'] for r in project['routes']}
    for box in project['boxes']:
        assert min(box[k] for k in ('w','d','h')) > 0
        assert all(math.isfinite(box[k]) for k in ('x','y','z','w','d','h'))
    for c in project.get('cylinders',[]):
        assert min(c['r'],c['topR'],c['h'])>0
    for frame in range(FRAMES):
        target,size,elevation=camera_pose(frame,scene_id=scene_id)
        assert size>0 and all(math.isfinite(n) for n in (*target,size,elevation))
    assert camera_pose(0,scene_id=scene_id)==camera_pose(FRAMES-1,scene_id=scene_id)
    return project

def render(args, data, project):
    import bpy
    from mathutils import Vector
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if args.engine=='eevee' else 'CYCLES'
    if args.engine=='eevee':
        scene.eevee.taa_render_samples = args.samples
        scene.eevee.use_raytracing = False
        scene.eevee.shadow_ray_count = 2
        scene.eevee.shadow_step_count = 8
        if hasattr(scene.eevee,'use_gtao'):scene.eevee.use_gtao = True
    scene.cycles.device = 'CPU'
    scene.cycles.samples = args.samples
    scene.cycles.use_denoising = True
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = .025
    scene.cycles.max_bounces = 5
    scene.cycles.transparent_max_bounces = 8
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = max(1, min(4, os.cpu_count() or 2))
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.view_settings.view_transform = 'AgX'
    scene.render.fps = FPS
    scene.render.use_persistent_data = True
    scene.world = bpy.data.worlds.new('Graphite studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.035, .038, .042, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .16
    materials = {}
    def material(name, color, metal=0, rough=.42, emission=0):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        shader = m.node_tree.nodes.get('Principled BSDF')
        # Hex palette is sRGB; Blender materials use linear light.
        rgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
        linear = tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)
        shader.inputs['Base Color'].default_value = (*linear, 1)
        shader.inputs['Metallic'].default_value = metal
        shader.inputs['Roughness'].default_value = rough
        if emission:
            shader.inputs['Emission Color'].default_value = (*linear, 1)
            shader.inputs['Emission Strength'].default_value = emission
        if name == 'glass':
            # Thin matte dividers keep the cutaway readable, with no glowing translucent floors.
            shader.inputs['Alpha'].default_value = .16
        materials[name] = m
        return m
    palette={**data['palette'],'body':'#181D24','side':'#252D37','metal':'#8794A1','top':'#B7C1CB','edge':'#8996A3','slab':'#242A32','screen':'#070B10'}
    for name, hexcode in palette.items():
        material(name, hexcode, .62 if name in ('metal', 'top', 'edge') else .04,
                 .31 if name == 'metal' else .48, .12 if name == 'red' else 0)
    groups = {}
    smooth_faces = {}
    for b in project['boxes']:
        verts, faces = groups.setdefault(b['material'], ([], []))
        x, y, z = b['x'] - b['w']/2, b['y'] - b['d']/2, b['z']
        w, d, h, offset = b['w'], b['d'], b['h'], len(verts)
        verts.extend(tuple(c * SCALE for c in p) for p in [(x,y,z),(x+w,y,z),(x+w,y+d,z),(x,y+d,z),
                  (x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)])
        faces.extend(tuple(offset + i for i in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    for c in project.get('cylinders',[]):
        verts,faces=groups.setdefault(c['material'],([],[]))
        offset=len(verts)
        segments=96
        for radius,t in [(c['r'],0),(c['topR'],c['h'])]:
            for i in range(segments):
                dx,dq=radius*math.cos(i*2*math.pi/segments),radius*math.sin(i*2*math.pi/segments)
                point=(c['x']+dx,c['y']+t,c['z']+dq) if c.get('axis')=='y' else (c['x']+dx,c['y']+dq,c['z']+t)
                verts.append(tuple(n*SCALE for n in point))
        faces.append(tuple(offset+i for i in reversed(range(segments))))
        faces.append(tuple(offset+segments+i for i in range(segments)))
        smooth_faces.setdefault(c['material'],set()).update(range(len(faces),len(faces)+segments))
        faces.extend((offset+i,offset+(i+1)%segments,offset+segments+(i+1)%segments,offset+segments+i) for i in range(segments))
    for name, (verts, faces) in groups.items():
        mesh = bpy.data.meshes.new(name + '-geometry')
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        for face in smooth_faces.get(name,[]):mesh.polygons[face].use_smooth=True
        obj = bpy.data.objects.new(name + '-components', mesh)
        scene.collection.objects.link(obj)
        obj.data.materials.append(materials[name])
        if name != 'glass':
            bevel = obj.modifiers.new('Manufactured edges', 'BEVEL')
            bevel.width, bevel.segments = .006, 2
    linegroups = {}
    for line in project['lines']:
        linegroups.setdefault((line['color'], max(.004, line['width'] * .009)), []).append(line['points'])
    for route in project['routes']:
        if args.scene=='winery':
            # Actual cable topology follows the overhead tray and vertical drops.
            # Software/support are logical relationships, not separate physical wires.
            if route['code']!='101':continue
            endpoint=route['points'][-1]
            ex,ey,ez=endpoint
            route={**route,'points':[[542,294,49],[542,294,88],[542,165,88],[ex,165,88],[ex,ey,88],endpoint]}
        name='route-'+route['code']
        if name not in materials:material(name,'#475460',.3,.42)
        linegroups.setdefault((name,.010),[]).append(route['points'])
    if args.scene=='winery':
        # Jacket seams, sanitary fittings and ladder rails make each vessel readable.
        for c in project.get('cylinders',[]):
            if not c['id'].endswith('-vessel'):continue
            x,y,r=c['x'],c['y'],c['r']
            for z in [29,49,70,88]:
                ring=[[x+(r+.08)*math.cos(i*math.pi/32),y+(r+.08)*math.sin(i*math.pi/32),z] for i in range(65)]
                linegroups.setdefault(('edge',.007),[]).append(ring)
            for dx in [22,28]:
                linegroups.setdefault(('metal',.018),[]).append([[x+dx,y+12,8],[x+dx,y+12,91]])
        # Cable tray hangers and routed patch leads inside the existing rack.
        for x in [55,160,270,380,490]:
            linegroups.setdefault(('side',.016),[]).append([[x,162,85],[x,162,101]])
        for i in range(8):
            x=528+i*2.8
            linegroups.setdefault(('side',.012),[]).append([[x,295.5,64],[x,298,64],[x,298,60],[x+1,295.5,55]])
    for (name, radius), paths in linegroups.items():
        curve = bpy.data.curves.new(name + '-traces', 'CURVE')
        curve.dimensions, curve.bevel_depth, curve.bevel_resolution = '3D', radius, 1
        for points in paths:
            spline = curve.splines.new('POLY')
            spline.points.add(len(points)-1)
            for point, xyz in zip(spline.points, points):
                point.co = (*[n * SCALE for n in xyz], 1)
        obj = bpy.data.objects.new(name + '-traces', curve)
        scene.collection.objects.link(obj)
        curve.materials.append(materials.get(name, materials['edge']))
    for circle in project['circles']:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=circle['r'] * SCALE,
                depth=.025, location=tuple(n * SCALE for n in circle['at']))
        obj = bpy.context.object
        obj.name = 'Indicator' if circle.get('service') != '107' else 'Detector'
        if circle.get('service') != '107':
            obj.rotation_euler[0] = math.pi / 2
        obj.data.materials.append(materials.get(circle['color'], materials['edge']))
    # Building base is grounded, while the technical room remains part of the same site.
    material('studio-floor', '#080B10', .12, .5)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(7.5, 4.2, -.255))
    bpy.context.object.data.materials.append(materials['studio-floor'])
    def light(name, xyz, energy, size):
        lamp = bpy.data.lights.new(name, 'AREA')
        lamp.energy, lamp.shape, lamp.size = energy, 'DISK', size
        obj = bpy.data.objects.new(name, lamp)
        scene.collection.objects.link(obj)
        obj.location = xyz
        obj.rotation_euler = (Vector((7.5,4.2,3.5)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    light('Large softbox', (3, -7, 20), 3400, 12)
    light('Edge separation', (-4, 13, 12), 2200, 8)
    light('Camera fill', (18, 14, 11), 1300, 14)
    camera = bpy.data.cameras.new('Continuous project camera')
    camera.type, camera.clip_start, camera.clip_end = 'ORTHO', .01, 250
    cam = bpy.data.objects.new('Continuous project camera', camera)
    scene.collection.objects.link(cam)
    scene.camera = cam
    from bpy_extras.object_utils import world_to_camera_view
    corners = [Vector((x * SCALE, y * SCALE, z * SCALE))
               for b in project['boxes']
               for x in (b['x']-b['w']/2,b['x']+b['w']/2)
               for y in (b['y']-b['d']/2,b['y']+b['d']/2)
               for z in (b['z'],b['z']+b['h'])]
    wide = 33.5
    for attempt in range(24):
        target, size, elevation = camera_pose(0, wide, args.scene)
        target = Vector(target)
        cam.location = target + Vector((32,32,32*elevation))
        cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
        camera.ortho_scale, camera.shift_x = size, -.12 * (size/25)
        bpy.context.view_layer.update()
        projected = [world_to_camera_view(scene,cam,point) for point in corners]
        bounds = [min(p.x for p in projected),min(p.y for p in projected),max(p.x for p in projected),max(p.y for p in projected)]
        if min(bounds[:2]) >= .025 and max(bounds[2:]) <= .975:
            break
        wide *= 1.035
    else:
        raise RuntimeError(f'Wide framing does not contain the project: {bounds}')
    print(json.dumps({'wideOrtho':wide,'wideBounds':bounds}),flush=True)
    dest = Path(args.output)
    dest.mkdir(parents=True, exist_ok=True)
    timings=[]
    for frame in range(args.start, args.end + 1):
        target, size, elevation = camera_pose(frame, wide, args.scene)
        target = Vector(target)
        cam.location = target + Vector((32, 32, 32 * elevation))
        cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
        camera.ortho_scale = size
        camera.shift_x = -.12 * (size / 25)
        # The network is the subject of this shot; other installed circuits
        # remain physically visible without competing red overlays.
        emphasis=smooth(math.sin(math.pi*frame/(FRAMES-1))**2)
        for name,mat in materials.items():
            if not name.startswith('route-'):continue
            node=mat.node_tree.nodes.get('Principled BSDF')
            strength=emphasis if name=='route-101' else 0
            neutral=(.063,.089,.115);red=(.716,.019,.019)
            color=tuple(a+(b-a)*strength for a,b in zip(neutral,red))
            node.inputs['Base Color'].default_value=(*color,1)
            node.inputs['Emission Color'].default_value=(*color,1)
            node.inputs['Emission Strength'].default_value=.3*strength
        scene.render.filepath = str(dest / f'{frame:04d}.png')
        started = time.time()
        bpy.ops.render.render(write_still=True)
        seconds=round(time.time()-started,2)
        timings.append({'frame':frame,'seconds':seconds})
        print(json.dumps({'frame':frame,'total':FRAMES,'seconds':seconds,'path':scene.render.filepath}), flush=True)
    (dest / 'render-info.json').write_text(json.dumps({'blender':bpy.app.version_string,'scene':args.scene,'frames':FRAMES,'fps':FPS,'engine':scene.render.engine,'samples':args.samples,'resolution':[1920,1080],'start':args.start,'end':args.end,'camera':'single continuous sine-squared approach, selective network emphasis','geometry':len(project['boxes']),'wideOrtho':wide,'wideBounds':bounds,'timings':timings}))

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--scene',choices=list(CAMERA_KEYS),default='building')
    p.add_argument('--start', type=int, default=0)
    p.add_argument('--end', type=int, default=FRAMES-1)
    p.add_argument('--output', default='render')
    p.add_argument('--validate-only', action='store_true')
    p.add_argument('--engine',choices=['cycles','eevee'],default='cycles')
    p.add_argument('--samples',type=int,default=8)
    args = p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    assert 4 <= args.samples <= 128
    assert 0 <= args.start <= args.end < FRAMES
    data = json.loads((ROOT / 'src/assets/cine/isometric/site-projects-v1.json').read_text())
    project = validate(data,args.scene)
    if args.validate_only:
        print(json.dumps({'valid':True,'boxes':len(project['boxes']),'cameraFrames':FRAMES}))
    else:
        render(args, data, project)
