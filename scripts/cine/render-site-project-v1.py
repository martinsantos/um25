"""Render the authored project on a remote CPU runner; never launch Blender on the Mac."""
import argparse, json, math, os, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FPS, FRAMES, SCALE = 24, 432, 1 / 40

def smooth(t):
    t = max(0, min(1, t))
    return t * t * t * (t * (t * 6 - 15) + 10)

def camera_pose(frame):
    """One continuous dolly: building → riser → technical room → building. No cuts or object reveals."""
    keys = [(0, (300, 172, 142), 25.0, 1.0), (144, (535, 243, 148), 12.0, .92),
            (288, (518, 277, 43), 4.9, .66), (431, (300, 172, 142), 25.0, 1.0)]
    for a, b in zip(keys, keys[1:]):
        if frame <= b[0]:
            u = smooth((frame - a[0]) / (b[0] - a[0]))
            mix = lambda x, y: x + (y - x) * u
            return tuple(mix(x, y) * SCALE for x, y in zip(a[1], b[1])), mix(a[2], b[2]), mix(a[3], b[3])
    raise ValueError(frame)

def validate(data):
    project = next(s for s in data['scenes'] if s['id'] == 'building')
    assert len(project['boxes']) > 400
    assert {'101', '102', '103', '107', '108'} <= {r['code'] for r in project['routes']}
    for box in project['boxes']:
        assert min(box[k] for k in ('w', 'd', 'h')) > 0
        assert all(math.isfinite(box[k]) for k in ('x', 'y', 'z', 'w', 'd', 'h'))
    for frame in range(FRAMES):
        target, size, elevation = camera_pose(frame)
        assert size > 0 and all(math.isfinite(n) for n in (*target, size, elevation))
    assert camera_pose(0) == camera_pose(FRAMES - 1)
    return project

def render(args, data, project):
    import bpy
    from mathutils import Vector
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
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
    scene.world = bpy.data.worlds.new('Graphite studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.035, .038, .042, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35
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
    for name, hexcode in data['palette'].items():
        material(name, hexcode, .28 if name in ('metal', 'top', 'edge') else .04,
                 .38 if name == 'metal' else .48, .12 if name == 'red' else 0)
    groups = {}
    for b in project['boxes']:
        verts, faces = groups.setdefault(b['material'], ([], []))
        x, y, z = b['x'] - b['w']/2, b['y'] - b['d']/2, b['z']
        w, d, h, offset = b['w'], b['d'], b['h'], len(verts)
        verts.extend(tuple(c * SCALE for c in p) for p in [(x,y,z),(x+w,y,z),(x+w,y+d,z),(x,y+d,z),
                  (x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)])
        faces.extend(tuple(offset + i for i in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    for name, (verts, faces) in groups.items():
        mesh = bpy.data.meshes.new(name + '-geometry')
        mesh.from_pydata(verts, [], faces)
        mesh.update()
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
        linegroups.setdefault(('red', .012), []).append(route['points'])
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
    material('studio-floor', '#171a1e', .05, .65)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(7.5, 4.2, -.255))
    bpy.context.object.data.materials.append(materials['studio-floor'])
    def light(name, xyz, energy, size):
        lamp = bpy.data.lights.new(name, 'AREA')
        lamp.energy, lamp.shape, lamp.size = energy, 'DISK', size
        obj = bpy.data.objects.new(name, lamp)
        scene.collection.objects.link(obj)
        obj.location = xyz
        obj.rotation_euler = (Vector((7.5,4.2,3.5)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    light('Large softbox', (4, -5, 24), 4800, 17)
    light('Edge separation', (-8, 11, 15), 3500, 14)
    light('Camera fill', (18, 17, 12), 3000, 12)
    camera = bpy.data.cameras.new('Continuous project camera')
    camera.type, camera.clip_start, camera.clip_end = 'ORTHO', .01, 250
    cam = bpy.data.objects.new('Continuous project camera', camera)
    scene.collection.objects.link(cam)
    scene.camera = cam
    dest = Path(args.output)
    dest.mkdir(parents=True, exist_ok=True)
    for frame in range(args.start, args.end + 1):
        target, size, elevation = camera_pose(frame)
        target = Vector(target)
        cam.location = target + Vector((32, 32, 32 * elevation))
        cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
        camera.ortho_scale = size
        camera.shift_x = -.12 * (size / 25)
        scene.render.filepath = str(dest / f'{frame:04d}.png')
        started = time.time()
        bpy.ops.render.render(write_still=True)
        print(json.dumps({'frame':frame,'total':FRAMES,'seconds':round(time.time()-started,2),'path':scene.render.filepath}), flush=True)
    (dest / 'render-info.json').write_text(json.dumps({'blender':bpy.app.version_string,'scene':'building','frames':FRAMES,'fps':FPS,'samples':32,'resolution':[1920,1080],'start':args.start,'end':args.end,'camera':'continuous quintic dolly','geometry':len(project['boxes'])}))

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--start', type=int, default=0)
    p.add_argument('--end', type=int, default=FRAMES-1)
    p.add_argument('--output', default='render')
    p.add_argument('--validate-only', action='store_true')
    args = p.parse_args()
    assert 0 <= args.start <= args.end < FRAMES
    data = json.loads((ROOT / 'src/assets/cine/isometric/site-projects-v1.json').read_text())
    project = validate(data)
    if args.validate_only:
        print(json.dumps({'valid':True,'boxes':len(project['boxes']),'cameraFrames':FRAMES}))
    else:
        render(args, data, project)
