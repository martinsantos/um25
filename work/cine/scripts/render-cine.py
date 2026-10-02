"""UM Cine: planos cinematográficos (Cycles + Metal) de las cuatro escenas UMSA.

Mañana mendocina: sol bajo del este detrás de cámara, cordillera con nieve al
oeste, álamos, viñedo, acequia. Materiales procedurales (hormigón pulido, acero
cepillado, roble, vidrio, pantallas) sobre las mismas mallas del laboratorio.
Los .blend fuente NUNCA se guardan: los objetos se cargan por biblioteca y todo
lo demás vive en memoria. Visualización conceptual; sistemas y lecturas DEMO.

Desde la raíz del repo, un proceso por vez:
  Blender -b --factory-startup --python work/cine/scripts/render-cine.py -- bodega --still
  Blender -b --factory-startup --python work/cine/scripts/render-cine.py -- bodega --frames 144
Salida: work/cine/out/<escena>/  (still.jpg | frames/f_0001.jpg… + ar-track.json)
"""
import argparse
import resource
import json
import os
import math
import sys
import time
from pathlib import Path

import bpy  # bpy primero: como módulo de PyPI, bmesh sólo existe después de importar bpy
import bmesh
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
SOURCES = ROOT / 'work/um-territorio/work/blender/sectors'
OUT = ROOT / 'work/cine/out'
ASSETS = json.loads((ROOT / 'work/cine/ar-assets.json').read_text())
SCENES = {
    'hospital': ['UM-hospital-walkthrough.blend', 'UM-hospital-services.blend', 'UM-hospital-terminals.blend', 'UM-hospital-workstations.blend'],
    'aeropuerto': ['UM-airport-connected-finished.blend'],
    'bodega': ['UM-winery-connected-finished.blend'],
    'fachada': ['UM-facade.blend'],
    # Industria y minería: la misma nave de proceso, en un campamento de altura (sin viñedo).
    'planta': ['UM-winery-connected-finished.blend'],
}
# Cámaras v4 elegidas por el explorador (--scout) para servicios en otras escenas: '<escena>-<servicio>'.
CAMARAS_PATH = Path(os.environ.get('CINE_CAMARAS', ROOT / 'work/cine/camaras-v4.json'))
PASILLOS_PATH = ROOT / 'work/cine/camaras-pasillos.json'
CAMARAS = json.loads(CAMARAS_PATH.read_text()) if CAMARAS_PATH.exists() else {}
ASSETS['planta'] = [dict(a, name=a['name'].replace('bodega', 'planta').replace('Bodega', 'Planta'))
                    for a in ASSETS['bodega'] if 'BARREL' not in a['id'] and 'Tonel' not in a['name']]
SYSTEMS = {
    'Data': '168daa', 'Fire-detection': 'd64032', 'Telecom': '8056be',
    'Security': '268369', 'CCTV': 'cf528a', 'Power': 'b88122',
    'Software': '467aca', 'HVAC': '6b8aab', 'Plumbing': '5d7a8a',
    'WiFi': '4aa7b8', 'Fiber': 'b5762e', 'Intercom': 'b0609a',
}
# Plano por escena: azimut (0 = cámara al sur mirando al norte/cordillera), elevación,
# distancia en múltiplos del tamaño, lente y corrimiento del objetivo. Inicio → fin.
SHOTS = {
    # a/b = inicio/fin: azimut°, elevación°, distancia (× tamaño), objetivo (m desde el centro)
    'bodega': dict(lens=35, a=(-32, 30, .92, (0, 1, -1.5)), b=(-12, 7, 1.32, (0, 10, 4.5))),
    'planta': dict(lens=35, a=(28, 30, .92, (0, 1, -1.5)), b=(10, 8, 1.3, (0, 10, 5))),
    'aeropuerto': dict(lens=35, a=(30, 30, .92, (0, 0, -1.5)), b=(14, 9, 1.05, (0, 5, 3))),
    'fachada': dict(lens=30, a=(-26, 4, 1.25, (0, 0, -3)), b=(-10, 9, 1.5, (0, 3, 1.5))),
    'hospital': dict(lens=32, a=(30, 42, .88, (0, .5, -1.4)), b=(12, 7, 1.22, (0, 9, 5.5))),
}

# v3 · Recorridos imposibles (8 s): toma aérea con cordillera → atraviesa el muro → vuela
# entre equipos → sube por el corte → cenital. (t 0..1, posición, objetivo, lente mm)
PATHS = {
    'bodega': [(0, (-30, -40, 16), (-8, 12, 3), 32), (.22, (-22, 11.5, 4.0), (-8, 11.5, 2.6), 28),
               (.45, (-10, 11.5, 3.1), (2, 11.2, 2.2), 24), (.65, (4, 12, 3.4), (12, 17, 1.8), 24),
               (.82, (8, 9, 14), (6, 10.5, 0), 26), (1, (4, 9.5, 40), (4, 10.2, 0), 30)],
    'planta': [(0, (40, -34, 16), (8, 12, 3), 32), (.22, (-22, 11.5, 4.0), (-8, 11.5, 2.6), 28),
               (.45, (-10, 11.5, 3.1), (2, 11.2, 2.2), 24), (.65, (4, 12, 3.4), (12, 17, 1.8), 24),
               (.82, (8, 9, 14), (6, 10.5, 0), 26), (1, (4, 9.5, 40), (4, 10.2, 0), 30)],
    'aeropuerto': [(0, (-20, -46, 18), (2, 6, 2), 32), (.25, (-2, -8, 3.2), (-2, 4, 1.8), 26),
                   (.48, (-4, 3.5, 2.6), (4, 8, 1.4), 24), (.68, (6, 9, 2.8), (18, 12.5, 2), 24),
                   (.84, (10, 8, 14), (8, 7, 0), 26), (1, (8, 6, 32), (6, 6, 0), 30)],
    'fachada': [(0, (-26, -38, 3), (0, 2, 9), 26), (.24, (-6, -10, 4.5), (0, 3, 6.5), 24),
                (.44, (-3, -1.5, 7.5), (4, 3, 7.2), 22), (.6, (3, 2.4, 7.6), (9, 3, 7.0), 22),
                (.72, (5, 2.4, 10.6), (10, 3, 10.2), 22), (.86, (2, -8, 16), (0, 2.5, 10), 26),
                (1, (-6, -26, 24), (0, 2.5, 9), 30)],
    'hospital': [(0, (-30, -32, 16), (0, 6, 0), 32), (.24, (-4, -6, 3.0), (-2, 4, 1.2), 26),
                 (.46, (-2, 3.0, 1.7), (4, 7.5, 1.3), 22), (.66, (2, 7.5, 1.7), (12, 7.5, 1.4), 22),
                 (.84, (5, 9.5, 6.0), (7, 13, .4), 24), (1, (3, 7.5, 28), (3, 8.2, 0), 30)],
}


# v4 · Un recorrido propio por servicio: la cámara se calcula desde los equipos reales del
# sistema (ASSETS). az = azimut de ataque; style cambia el tipo de movimiento.
VARIANTS = {
    'redes':       dict(scene='fachada',    systems=['Data', 'Fiber', 'WiFi', 'Telecom'], az=-62,  style='ground'),
    'seguridad':   dict(scene='aeropuerto', systems=['CCTV', 'Security', 'Intercom'],     az=148,  style='orbit'),
    'telecom':     dict(scene='planta',     systems=['Telecom', 'Data'],                  az=205,  style='aerial'),
    'software':    dict(scene='hospital',   systems=['Software', 'Data'],                 az=96,   style='ground'),
    'soporte':     dict(scene='aeropuerto', systems=[],                                    az=-118, style='orbit'),
    'consultoria': dict(scene='fachada',    systems=[],                                    az=58,   style='overhead'),
    'incendios':   dict(scene='bodega',     systems=['Fire-detection'],                    az=28,   style='ground'),
    'electricos':  dict(scene='hospital',   systems=['Power'],                             az=-150, style='aerial'),
}


def variant_path(name, scene=None, az=None, style=None, zoom=None):
    """Keys (t, pos, target, lens) para un servicio, a partir de sus equipos reales.

    scene: el mismo servicio en otra escena (por omisión, la suya). az/style: fuerzan el
    ataque y zoom aleja todo el recorrido; si no, se usa la cámara elegida por el explorador
    (CAMARAS) o la de VARIANTS."""
    v = VARIANTS[name]
    scene = scene or v['scene']
    elegida = CAMARAS.get(f'{scene}-{name}', {})
    if elegida.get('keys') and az is None and style is None and zoom is None:  # recorrido del planificador
        return [(k[0], tuple(k[1]), tuple(k[2]), k[3]) for k in elegida['keys']]
    items = [a for a in ASSETS[scene] if not v['systems'] or a['system'] in v['systems']] or ASSETS[scene]
    pts = [Vector(a['p']) for a in items]
    c = sum(pts, Vector((0, 0, 0))) / len(pts)
    zoom = zoom or elegida.get('zoom', 1.0)
    r = max(4.0, max((p - c).length for p in pts)) * zoom
    far = max(3.2 * r, 30.0 * zoom)

    def at(az, el, dist, dz=0.0):
        az, el = math.radians(az), math.radians(el)
        return c + Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))) * dist + Vector((0, 0, dz))

    # equipo más lejano al centro y su opuesto: la pasada cruza el cluster entre ambos
    a1 = max(pts, key=lambda p: (p - c).length)
    a2 = min(pts, key=lambda p: (p - a1).length * -1 if p is not a1 else 0)
    az = az if az is not None else elegida.get('az', v['az'])
    st = style or elegida.get('style', v['style'])
    if st == 'ground':      # a ras del piso, entra entre equipos y sube a cenital
        keys = [(0, at(az, 4, far * .8, 1.2), c, 30), (.28, at(az + 18, 6, 1.5 * r, .8), c, 24),
                (.52, a1 + (c - a1) * .35 + Vector((0, 0, 1.2)), a2, 20), (.74, at(az + 120, 12, 1.1 * r), c, 22),
                (1, c + Vector((1.5, -1.5, far * .9)), c, 28)]
    elif st == 'orbit':     # órbita amplia que se cierra en espiral sobre el sistema
        keys = [(0, at(az, 26, far), c, 32), (.3, at(az + 70, 18, 1.8 * r), c, 26),
                (.55, at(az + 150, 10, 1.2 * r), c, 22), (.8, at(az + 230, 16, 1.1 * r), a1, 22),
                (1, at(az + 300, 38, 1.6 * r), c, 26)]
    elif st == 'aerial':    # vuelo alto que desciende en picada hasta el equipo
        keys = [(0, at(az, 48, far * 1.1), c, 34), (.3, at(az + 30, 34, 2.2 * r), c, 28),
                (.58, at(az + 55, 16, 1.2 * r), a1, 22), (.8, a1 + (a1 - c).normalized() * 3 + Vector((0, 0, 1.5)), c, 20),
                (1, at(az + 80, 6, 1.6 * r, .5), c, 26)]
    else:                   # overhead: planta cenital que baja y se inclina a la fachada
        keys = [(0, c + Vector((0.5, -0.5, far * 1.2)), c, 30), (.3, at(az, 62, 1.9 * r), c, 26),
                (.58, at(az + 40, 30, 1.3 * r), c, 22), (.82, at(az + 80, 10, 1.4 * r), a1, 22),
                (1, at(az + 110, 4, far * .7, 1.0), c, 28)]
    return [(t, tuple(p), tuple(q), lens) for t, p, q, lens in keys]


def lin(hexcode, a=1):
    v = [int(hexcode[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in v) + (a,)


# ---------------------------------------------------------------- materiales
class M:
    """Pequeño constructor de árboles de nodos."""

    def __init__(self, name):
        self.mat = bpy.data.materials.new('Cine__' + name)
        self.mat.use_nodes = True
        self.nt = self.mat.node_tree
        self.bsdf = self.nt.nodes['Principled BSDF']
        self.out = self.nt.nodes['Material Output']
        self._pos = None

    def n(self, kind, **inputs):
        node = self.nt.nodes.new(kind)
        for key, value in inputs.items():
            if key not in node.inputs and hasattr(node, key):
                setattr(node, key, value)  # propiedades del nodo (operation, blend_type…)
            elif hasattr(value, 'is_output'):
                self.nt.links.new(value, node.inputs[key])
            else:
                node.inputs[key].default_value = value
        return node

    def link(self, a, b):
        self.nt.links.new(a, b)

    def set(self, **inputs):
        for key, value in inputs.items():
            key = key.replace('_', ' ')
            if hasattr(value, 'is_output'):
                self.link(value, self.bsdf.inputs[key])
            else:
                self.bsdf.inputs[key].default_value = value
        return self

    @property
    def pos(self):
        if self._pos is None:
            self._pos = self.nt.nodes.new('ShaderNodeNewGeometry').outputs['Position']
        return self._pos

    def scaled(self, sx, sy, sz):
        m = self.n('ShaderNodeMapping', Vector=self.pos)
        m.inputs['Scale'].default_value = (sx, sy, sz)
        return m.outputs['Vector']

    def noise(self, scale, vec=None, detail=4, rough=.55, distortion=0):
        return self.n('ShaderNodeTexNoise', Vector=vec or self.pos, Scale=scale, Detail=detail,
                      Roughness=rough, Distortion=distortion).outputs['Fac']

    def ramp(self, fac, stops):
        r = self.n('ShaderNodeValToRGB', Fac=fac)
        els = r.color_ramp.elements
        els[0].position, els[0].color = stops[0]
        els[1].position, els[1].color = stops[-1]
        for p, c in stops[1:-1]:
            e = els.new(p)
            e.color = c
        return r.outputs['Color']

    def rng(self, value, a, b, c, d):
        return self.n('ShaderNodeMapRange', Value=value, **{'From Min': a, 'From Max': b, 'To Min': c, 'To Max': d}).outputs['Result']

    def bump(self, height, strength, dist=.01):
        return self.n('ShaderNodeBump', Height=height, Strength=strength, Distance=dist).outputs['Normal']

    def done(self):
        self.mat.diffuse_color = tuple(self.bsdf.inputs['Base Color'].default_value)
        return self.mat


def hazed(m, color, near=250, far=4200, lo=0, hi=.62, tint='a9b8cc'):
    """Perspectiva aérea: acerca el color al del aire según la distancia a cámara."""
    cam = m.n('ShaderNodeCameraData')
    f = m.rng(cam.outputs['View Distance'], near, far, lo, hi)
    mix = m.n('ShaderNodeMixRGB', Fac=f, Color1=color, Color2=lin(tint))
    return mix.outputs['Color']


def mat_plaster(tint='e8e3d9', tint2='d9d2c6', floor=None, cut_z=None):
    """Revoque; opcional: piso distinto en caras horizontales bajas y poché oscuro en el plano de corte."""
    m = M('plaster')
    wall = m.ramp(m.noise(2.2), [(.3, lin(tint)), (.7, lin(tint2))])
    color, rough = wall, .84
    if floor or cut_z is not None:
        geo = m.nt.nodes.new('ShaderNodeNewGeometry')
        nz = m.n('ShaderNodeSeparateXYZ', Vector=geo.outputs['Normal']).outputs['Z']
        pz = m.n('ShaderNodeSeparateXYZ', Vector=m.pos).outputs['Z']
        up = m.rng(nz, .85, .95, 0, 1)
    if floor:
        low = m.rng(pz, .35, .15, 0, 1)
        f = m.n('ShaderNodeMath', operation='MULTIPLY', Value=up)
        m.link(up, f.inputs[0])
        m.link(low, f.inputs[1])
        fl = m.ramp(m.noise(1.2, detail=5), [(.3, lin(floor[0])), (.7, lin(floor[1]))])
        c = m.n('ShaderNodeMixRGB', Fac=f.outputs['Value'], Color1=color, Color2=fl)
        color = c.outputs['Color']
        rough = m.rng(f.outputs['Value'], 0, 1, .84, .3)
    if cut_z is not None:
        top = m.rng(pz, cut_z - .04, cut_z - .01, 0, 1)
        f2 = m.n('ShaderNodeMath', operation='MULTIPLY')
        m.link(up, f2.inputs[0])
        m.link(top, f2.inputs[1])
        c2 = m.n('ShaderNodeMixRGB', Fac=f2.outputs['Value'], Color1=color, Color2=lin('2a2d31'))
        color = c2.outputs['Color']
    m.set(Base_Color=color, Roughness=rough, Normal=m.bump(m.noise(70, detail=3), .05, .002))
    return m.done()


def mat_vinyl(a, b, rough=(.26, .42)):
    """Piso vinílico / resina hospitalaria: satinado, con leve moteado."""
    m = M('vinyl_' + a)
    col = m.ramp(m.noise(1.4, detail=5), [(.3, lin(a)), (.7, lin(b))])
    speck = m.n('ShaderNodeTexVoronoi', Vector=m.pos, Scale=220).outputs['Distance']
    mix = m.n('ShaderNodeMixRGB', Fac=m.rng(speck, 0, .07, .25, 0), Color1=col, Color2=lin('5c5a55'))
    m.set(Base_Color=mix.outputs['Color'], Roughness=m.rng(m.noise(.7), .3, .7, *rough),
          Normal=m.bump(m.noise(60, detail=2), .02, .002))
    return m.done()


def mat_neighbour():
    """Medianeras vecinas con grilla de ventanas (para leer la cuadra)."""
    m = M('neighbour')
    brick = m.n('ShaderNodeTexBrick', Vector=m.scaled(1, 1, 1.25), Scale=.42,
                Color1=lin('1b2229'), Color2=lin('27313a'), Mortar=lin('bdb5a8'))
    brick.inputs['Mortar Size'].default_value = .22
    brick.inputs['Bias'].default_value = 0
    brick.offset = 0
    m.set(Base_Color=brick.outputs['Color'], Roughness=m.rng(brick.outputs['Fac'], 0, 1, .15, .8),
          Normal=m.bump(m.noise(40, detail=3), .05, .002))
    return m.done()


def mat_lawn():
    m = M('lawn')
    col = m.ramp(m.noise(.06, detail=6), [(.15, lin('55562e')), (.5, lin('6b6a3c')), (.8, lin('7f7650')), (.95, lin('8a7d5c'))])
    m.set(Base_Color=hazed(m, col, 120, 3600, 0, .55), Roughness=.9,
          Normal=m.bump(m.noise(30, detail=6, rough=.7), .4, .02))
    return m.done()


def mat_concrete(polished=True):
    m = M('concrete' if polished else 'paving')
    big = m.noise(.35, detail=6)
    speck = m.n('ShaderNodeTexVoronoi', Vector=m.pos, Scale=160).outputs['Distance']
    col = m.ramp(big, [(.25, lin('7b7872')), (.75, lin('9a978f'))])
    mix = m.n('ShaderNodeMixRGB', Fac=m.rng(speck, 0, .08, .35, 0), Color1=col, Color2=lin('3d3b38'))
    m.set(Base_Color=mix.outputs['Color'],
          Roughness=m.rng(m.noise(.9, detail=5), .3, .7, .18 if polished else .62, .48 if polished else .86),
          Normal=m.bump(m.noise(40, detail=3), .04 if polished else .15, .003))
    return m.done()


def mat_steel():
    m = M('steel')
    brushed = m.noise(1, vec=m.scaled(90, 90, 1.2), detail=2)
    m.set(Base_Color=lin('c8cbce'), Metallic=1,
          Roughness=m.rng(brushed, .3, .7, .16, .34),
          Normal=m.bump(brushed, .03, .001))
    return m.done()


def mat_graphite():
    m = M('graphite')
    m.set(Base_Color=m.ramp(m.noise(6), [(.3, lin('1d2024')), (.7, lin('2a2e33'))]),
          Roughness=m.rng(m.noise(3), .3, .7, .36, .52), Specular_IOR_Level=.45,
          Normal=m.bump(m.noise(260, detail=1), .06, .001))
    return m.done()


def mat_oak():
    m = M('oak')
    wave = m.n('ShaderNodeTexWave', Vector=m.scaled(1, 1, .25), Scale=9, Distortion=6, Detail=4)
    wave.wave_type = 'BANDS'
    col = m.ramp(wave.outputs['Fac'], [(.2, lin('5b3622')), (.55, lin('7d4f33')), (.9, lin('946343'))])
    m.set(Base_Color=col, Roughness=.62, Normal=m.bump(wave.outputs['Fac'], .08, .002))
    return m.done()


def mat_fabric(color='3a4652'):
    m = M('fabric')
    weave = m.noise(420, detail=1)
    m.set(Base_Color=m.ramp(m.noise(8), [(.3, lin(color)), (.7, tuple(min(1, v * 1.25) for v in lin(color)[:3]) + (1,))]),
          Roughness=.92, Sheen_Weight=.6, Sheen_Roughness=.4, Normal=m.bump(weave, .12, .001))
    return m.done()


def mat_paint(hexcode, emission=0.0, rough=.34):
    m = M('paint_' + hexcode)
    m.set(Base_Color=lin(hexcode), Roughness=rough, Coat_Weight=.25, Coat_Roughness=.12,
          Emission_Color=lin(hexcode), Emission_Strength=emission)
    return m.done()


def mat_screen():
    m = M('screen')
    brick = m.n('ShaderNodeTexBrick', Vector=m.scaled(1, 1, 3.2), Scale=14, Color1=(1, 1, 1, 1),
                Color2=(.35, .6, .7, 1), Mortar=(0.01, 0.02, 0.03, 1))
    brick.inputs['Mortar Size'].default_value = .035
    col = m.n('ShaderNodeMixRGB', Fac=.6, Color1=lin('0e2530'), Color2=brick.outputs['Color'])
    col.blend_type = 'MULTIPLY'
    m.set(Base_Color=lin('050607'), Roughness=.12, Emission_Color=col.outputs['Color'], Emission_Strength=3.2)
    return m.done()


def mat_glass():
    m = M('glass')
    m.set(Base_Color=lin('eef6f5'), Roughness=.02, IOR=1.45, Transmission_Weight=1)
    try:
        m.bsdf.inputs['Thin Wall'].default_value = True
    except (KeyError, TypeError):
        pass
    transparent = m.n('ShaderNodeBsdfTransparent')
    path = m.n('ShaderNodeLightPath')
    mix = m.n('ShaderNodeMixShader')
    m.link(path.outputs['Is Shadow Ray'], mix.inputs['Fac'])
    m.link(m.bsdf.outputs['BSDF'], mix.inputs[1])
    m.link(transparent.outputs['BSDF'], mix.inputs[2])
    m.link(mix.outputs['Shader'], m.out.inputs['Surface'])
    return m.done()


def mat_light(strength=10):
    m = M('light')
    m.set(Base_Color=lin('fff3e2'), Emission_Color=lin('ffe2bf'), Emission_Strength=strength, Roughness=.5)
    return m.done()


def mat_leaf(a='253a17', b='5d6e2b', c='7f8a3a'):
    m = M('leaf')
    clumps = m.noise(9, detail=6, rough=.7)
    col = m.ramp(m.noise(2.2, detail=5), [(.2, lin(a)), (.6, lin(b)), (.95, lin(c))])
    shade = m.n('ShaderNodeMixRGB', Fac=m.rng(clumps, .35, .7, .55, 0), Color1=col, Color2=lin('141d0c'))
    m.set(Base_Color=hazed(m, shade.outputs['Color']), Roughness=.7,
          Normal=m.bump(clumps, .8, .08))
    return m.done()


def mat_poplar():
    return mat_leaf('223416', '4e6226', '8b9442')


def mat_soil():
    m = M('soil')
    big = m.noise(.04, detail=5)
    col = m.ramp(big, [(.2, lin('6f5a46')), (.55, lin('8a7560')), (.85, lin('626140'))])
    wave = m.n('ShaderNodeTexWave', Vector=m.pos, Scale=.1257, Distortion=.6, Detail=2)
    wave.bands_direction = 'X'
    furrow = m.n('ShaderNodeMixRGB', Fac=m.rng(wave.outputs['Fac'], .55, 1, 0, .35), Color1=col, Color2=lin('4a4a2c'))
    m.set(Base_Color=hazed(m, furrow.outputs['Color'], 120, 3600, 0, .55), Roughness=.93, Normal=m.bump(m.noise(9, detail=6, rough=.65), .35, .05))
    return m.done()


def mat_scree():
    """Suelo de altura: ripio ocre y gris, piedras sueltas."""
    m = M('scree')
    stones = m.n('ShaderNodeTexVoronoi', Vector=m.pos, Scale=2.2).outputs['Distance']
    col = m.ramp(m.noise(.03, detail=6), [(.2, lin('8a7760')), (.55, lin('a08a6d')), (.85, lin('75706a'))])
    mix = m.n('ShaderNodeMixRGB', Fac=m.rng(stones, 0, .25, .4, 0), Color1=col, Color2=lin('5b554f'))
    m.set(Base_Color=hazed(m, mix.outputs['Color'], 150, 4000, 0, .5), Roughness=.95,
          Normal=m.bump(m.noise(6, detail=8, rough=.7), .6, .08))
    return m.done()


def lattice_tower(x, y, h=32):
    """Torre reticulada de telecomunicaciones pintada rojo/blanco, con parábolas de microondas."""
    red, white, steel = mat_paint('c62828', rough=.5), mat_paint('e8e6e1', rough=.5), mat_steel()
    seg = 3.0
    n = int(h / seg)
    for k in range(n):
        z0, z1 = k * seg, (k + 1) * seg
        w0, w1 = 3.2 - 2.2 * z0 / h, 3.2 - 2.2 * z1 / h
        paint = red if (k // 2) % 2 == 0 else white
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            a = Vector((x + sx * w0 / 2, y + sy * w0 / 2, z0)); b = Vector((x + sx * w1 / 2, y + sy * w1 / 2, z1))
            strut(a, b, .07, paint)
        for (ax, ay), (bx, by) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            strut(Vector((x + ax * w0 / 2, y + ay * w0 / 2, z0)), Vector((x + bx * w1 / 2, y + by * w1 / 2, z1)), .03, steel)
    for k, (ang, z) in enumerate(((0.3, h - 3), (2.2, h - 5), (4.1, h - 7))):
        d = Vector((math.cos(ang), math.sin(ang), 0))
        c = Vector((x, y, z)) + d * 1.1
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.62, depth=.35, location=c,
                                            rotation=(math.pi / 2, 0, ang + math.pi / 2))
        bpy.context.object.data.materials.append(white)
    for k in range(3):
        ang = k * 2.1
        c = Vector((x, y, h - 1.2)) + Vector((math.cos(ang), math.sin(ang), 0)) * .7
        box(f'Cine__Panel {k}', c, (.12, .3, 1.6), white).rotation_euler = (0, 0, ang)


def strut(a, b, r, mat):
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    o.data.materials.append(mat)


def camp(center, lo, hi):
    """Campamento modular: módulos habitacionales, playa de camionetas y cerco."""
    white, dark = mat_plaster('e9e6df', 'dcd8cf'), mat_graphite()
    glass = mat_screen()
    for k in range(8):
        x = lo.x + 4 + (k % 4) * 8.5
        y = hi.y + 16 + (k // 4) * 5.5
        box(f'Cine__Module {k}', (x, y, 1.35), (7.2, 2.6, 2.7), white)
        for w in (-2.2, 0, 2.2):
            box(f'Cine__Window {k} {w}', (x + w, y - 1.31, 1.6), (1.1, .02, .7), dark)
    for k in range(5):
        box(f'Cine__Pickup {k}', (hi.x - 16 + k * 3.2, hi.y + 14, .9), (2.0, 5.2, 1.8), mat_paint('e2e0da', rough=.4))
    box('Cine__Gravel road', (center.x, hi.y + 8, 0), (600, 8, .03), mat_concrete(False))


def mat_asphalt():
    m = M('asphalt')
    m.set(Base_Color=m.ramp(m.noise(.2, detail=6), [(.3, lin('2c2d2f')), (.7, lin('3a3b3c'))]),
          Roughness=m.rng(m.noise(1.5), .3, .7, .62, .9), Normal=m.bump(m.noise(90, detail=2), .25, .004))
    return m.done()


def mat_water():
    m = M('water')
    m.set(Base_Color=lin('20302c'), Roughness=.04, IOR=1.33, Normal=m.bump(m.noise(6, detail=3), .08, .02))
    return m.done()


def mat_mountain(max_h, near=False):
    """Roca de precordillera, nieve en cumbres y perspectiva aérea por distancia."""
    m = M('andes')
    z = m.n('ShaderNodeSeparateXYZ', Vector=m.pos).outputs['Z']
    normal = m.n('ShaderNodeSeparateXYZ', Vector=m.nt.nodes.new('ShaderNodeNewGeometry').outputs['Normal']).outputs['Z']
    rock = m.ramp(m.noise(.004, detail=6), [(.2, lin('5e4a3c')), (.55, lin('86684f')), (.85, lin('6b5a52'))])
    jitter = m.rng(m.noise(.004, detail=5), 0, 1, -.12 * max_h, .12 * max_h)
    zz = m.n('ShaderNodeMath', operation='ADD')
    m.link(z, zz.inputs[0])
    m.link(jitter, zz.inputs[1])
    by_height = m.rng(zz.outputs['Value'], .4 * max_h, .5 * max_h, 0, 1)
    by_slope = m.rng(normal, .45, .75, 0, 1)
    snow = m.n('ShaderNodeMath', operation='MULTIPLY')
    m.link(by_height, snow.inputs[0])
    m.link(by_slope, snow.inputs[1])
    col = m.n('ShaderNodeMixRGB', Color1=rock, Color2=lin('f2f0ee'))
    m.link(snow.outputs['Value'], col.inputs['Fac'])
    cam = m.n('ShaderNodeCameraData')
    haze_f = m.rng(cam.outputs['View Distance'], 1200, 9000, .2, .5) if near else m.rng(cam.outputs['View Distance'], 2000, 11000, .12, .5)
    hazed = m.n('ShaderNodeMixRGB', Color1=col.outputs['Color'], Color2=lin('9fb3cf'))
    m.link(haze_f, hazed.inputs['Fac'])
    m.set(Base_Color=hazed.outputs['Color'], Roughness=.9,
          Normal=m.bump(m.noise(.05, detail=8, rough=.6), .5, 3))
    return m.done()


def build_palette(scene):
    p = {
        'chalk': mat_plaster(floor=('b7c1bd', 'a9b4b0'), cut_z=2.08) if scene == 'hospital' else mat_plaster(), 'stone': mat_concrete(scene != 'fachada'), 'metal': mat_steel(),
        'dark': mat_graphite(), 'wood': mat_oak(), 'upholstery': mat_fabric('39434e'),
        'red': mat_paint('b3261e'), 'screen': mat_screen(), 'glass': mat_glass(),
        'light': mat_light(14 if scene == 'hospital' else 9), 'resin': mat_fabric('9fbdb8'),
        'green': mat_leaf(), 'leaf': mat_leaf(),
    }
    if scene == 'bodega':
        p['upholstery'] = mat_fabric('b08c62')  # cajas de cartón en rack
    for key, color in SYSTEMS.items():
        p[key] = mat_paint(color, emission=.9)
    return p


OVERRIDES = {
    'hospital': {('Architecture', 'stone'): ('vinyl', '8e9a96', '7f8b87'),
                 ('Architecture', 'resin'): ('vinyl', 'b39a7c', 'a38a6c'),
                 ('Architecture', 'Architecture__service-floor'): ('vinyl', '8e9a96', '7f8b87')},
}
ALIASES = (('floor', 'stone'), ('ivory', 'chalk'), ('white', 'chalk'), ('metal', 'metal'),
           ('black', 'dark'), ('graphite', 'dark'), ('glass', 'glass'), ('screen', 'screen'))


def restyle(scene, palette):
    theme_cache = {}
    override_cache = {}
    for obj in bpy.context.scene.objects:
        if obj.type not in {'MESH', 'CURVE', 'FONT'}:
            continue
        system = obj.name.split('__')[0]
        for slot in obj.material_slots:
            original = slot.material.name.split('.')[0] if slot.material else 'chalk'
            ov = OVERRIDES.get(scene, {}).get((system, original))
            if ov:
                if ov not in override_cache:
                    override_cache[ov] = mat_vinyl(ov[1], ov[2])
                slot.material = override_cache[ov]
                continue
            if original not in palette and original not in SYSTEMS and not original.startswith(('leaf', 'theme')):
                original = next((k for word, k in ALIASES if word in original.lower()), original)
            if original in SYSTEMS:
                key = original
            elif original in ('red', 'metal') and system in SYSTEMS:
                key = system
            elif original == 'glass' and scene == 'hospital':
                obj.hide_render = True
                continue
            elif original.startswith('leaf'):
                key = 'leaf'
            elif original.startswith('theme'):
                if original not in theme_cache:
                    c = slot.material.diffuse_color
                    hexcode = ''.join(f'{int(max(0, min(1, v)) ** (1 / 2.2) * 255):02x}' for v in c[:3])
                    theme_cache[original] = mat_paint(hexcode, rough=.7)
                slot.material = theme_cache[original]
                continue
            else:
                key = original if original in palette else 'chalk'
            slot.material = palette[key]


# ---------------------------------------------------------------- modelo
def load_model(files):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for filename in files:
        with bpy.data.libraries.load(str(SOURCES / filename), link=False) as (source, target):
            target.objects = source.objects
        for obj in target.objects:
            if obj and obj.type in {'MESH', 'CURVE', 'FONT'}:
                bpy.context.scene.collection.objects.link(obj)
                obj.hide_render = obj.name.startswith('Ceiling')
    bpy.context.view_layer.update()


def cut_hospital():
    for obj in list(bpy.context.scene.objects):
        if not obj.name.startswith('Architecture__') or obj.type != 'MESH':
            continue
        mesh = obj.data.copy()
        obj.data = mesh
        bm = bmesh.new()
        bm.from_mesh(mesh)
        plane = obj.matrix_world.inverted() @ Vector((0, 0, 2.08))
        normal = obj.matrix_world.to_3x3().transposed() @ Vector((0, 0, 1))
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
                               plane_co=plane, plane_no=normal, clear_outer=True, dist=.0001)
        rim = [e for e in bm.edges if e.is_boundary and all(abs(v.co.z - plane.z) < .002 for v in e.verts)]
        if rim:
            try:
                bmesh.ops.holes_fill(bm, edges=rim, sides=0)
            except Exception as exc:  # el corte se ve igual, sin poché
                print('CINE_POCHE_SKIPPED', obj.name, exc, flush=True)
        bm.to_mesh(mesh)
        bm.free()


def cut_fachada(y_cut=.6):
    """Corte de sección "casa de muñecas": saca la piel del frente sur (muros, vidrio, carpinterías,
    balcones) por encima de la vereda, para que la cámara vea los pisos y sus sistemas. Las losas y
    los muros laterales, que cruzan toda la profundidad, quedan enteros."""
    for obj in list(bpy.context.scene.objects):
        if not obj.name.startswith('Architecture__') or obj.type != 'MESH':
            continue
        mesh = obj.data.copy()
        obj.data = mesh
        bm = bmesh.new()
        bm.from_mesh(mesh)
        mw = obj.matrix_world
        front = [f for f in bm.faces
                 if all((mw @ v.co).y < y_cut and (mw @ v.co).z > .05 and abs((mw @ v.co).x) < 9.8 for v in f.verts)]
        bmesh.ops.delete(bm, geom=front, context='FACES')
        bm.to_mesh(mesh)
        bm.free()


def bounds():
    pts = [o.matrix_world @ v.co for o in bpy.context.scene.objects
           if o.type == 'MESH' and not o.hide_render for v in o.data.vertices]
    arr = np.array([tuple(p) for p in pts])
    return Vector(arr.min(0)), Vector(arr.max(0))


# ---------------------------------------------------------------- entorno
def mesh_obj(name, verts, faces, mat):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def box(name, center, size, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    ob.data.materials.append(mat)
    return ob


def value_noise(nx, ny, cx, cy, rng):
    g = rng.random((cy + 2, cx + 2))
    xs = np.linspace(0, cx, nx, endpoint=False)
    ys = np.linspace(0, cy, ny, endpoint=False)
    xi, yi = xs.astype(int), ys.astype(int)
    xf, yf = xs - xi, ys - yi
    sx, sy = xf * xf * (3 - 2 * xf), yf * yf * (3 - 2 * yf)
    a, b = g[np.ix_(yi, xi)], g[np.ix_(yi, xi + 1)]
    c, d = g[np.ix_(yi + 1, xi)], g[np.ix_(yi + 1, xi + 1)]
    top, bot = a + (b - a) * sx[None, :], c + (d - c) * sx[None, :]
    return top + (bot - top) * sy[:, None]


def fbm(nx, ny, cx, cy, octaves, rng, ridge=False):
    h, amp, tot = np.zeros((ny, nx)), 1.0, 0.0
    for _ in range(octaves):
        n = value_noise(nx, ny, cx, cy, rng)
        if ridge:
            n = (1 - np.abs(n * 2 - 1)) ** 1.6
        h += n * amp
        tot += amp
        amp *= .48
        cx, cy = cx * 2, cy * 2
    return h / tot


def andes(center, seed=7, near=False):
    """Cordillera al fondo: precordillera parda y cordón principal con nieve (visto desde Mendoza)."""
    rng = np.random.default_rng(seed)
    nx, ny = 900, 230
    x0, x1 = center.x - 9000, center.x + 9000
    y0, y1 = (center.y + 1500, center.y + 7500) if near else (center.y + 2400, center.y + 9000)
    X = np.linspace(x0, x1, nx)
    Y = np.linspace(y0, y1, ny)
    u = (Y - y0) / (y1 - y0)
    smooth = fbm(nx, ny, 9, 3, 7, rng)
    ridges = fbm(nx, ny, 14, 4, 6, rng, ridge=True)
    main = (.45 * smooth + .55 * ridges) ** 1.7
    front = fbm(nx, ny, 26, 4, 6, rng) ** 1.3
    env_main = np.clip((u - .3) / .28, 0, 1) ** 1.3 * np.clip((1.02 - u) / .2, 0, 1)
    env_front = np.exp(-((u - .1) / .09) ** 2)
    H = (2000 if near else 1500) * main * env_main[:, None] + (300 if near else 380) * front * env_front[:, None]
    # Un macizo dominante, como el Aconcagua visto desde el llano.
    H += 700 * np.exp(-(((X[None, :] - (center.x - 1600)) / 1100) ** 2 + ((Y[:, None] - (y0 + .66 * (y1 - y0))) / 900) ** 2))
    H -= 40
    verts = [(float(X[i]), float(Y[j]), float(H[j, i])) for j in range(ny) for i in range(nx)]
    faces = [(j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i)
             for j in range(ny - 1) for i in range(nx - 1)]
    ob = mesh_obj('Cine__Andes', verts, faces, mat_mountain(float(H.max()), near=near))
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def ground(center, extent, mat):
    s = 6000
    return mesh_obj('Cine__Ground', [(center.x - s, center.y - s, -.02), (center.x + s, center.y - s, -.02),
                                     (center.x + s, center.y + s, -.02), (center.x - s, center.y + s, -.02)],
                    [(0, 1, 2, 3)], mat)


def poplar_row(x0, x1, y, step, leaf, trunk, rng, h=(13, 18)):
    """Cortina de álamos (el rompevientos de las fincas mendocinas): 4 plantillas instanciadas."""
    tex = bpy.data.textures.get('Cine__poplar') or bpy.data.textures.new('Cine__poplar', 'CLOUDS')
    tex.noise_scale = .22
    tex.noise_depth = 3
    templates = []
    for k in range(4):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1, location=(0, 0, 0))
        crown = bpy.context.object
        crown.name = f'Cine__Poplar {k}'
        crown.scale = (1.0 + .12 * k, 1.0 + .08 * (3 - k), 1.0)
        bpy.ops.object.transform_apply(scale=True)
        for v in crown.data.vertices:  # columnar: más ancho abajo, afinado arriba
            z = v.co.z
            v.co.x *= 1.25 * (1 - .45 * max(0, z)) if z > 0 else 1.1
            v.co.y *= 1.25 * (1 - .45 * max(0, z)) if z > 0 else 1.1
            v.co.z = z * 7.2 + 8.2
        d = crown.modifiers.new('leaves', 'DISPLACE')
        d.texture, d.strength, d.texture_coords = tex, .7, 'LOCAL'
        bpy.ops.object.modifier_apply(modifier='leaves')
        bpy.ops.object.shade_smooth()
        crown.data.materials.append(leaf)
        bpy.ops.mesh.primitive_cylinder_add(vertices=7, radius=.17, depth=3.2, location=(0, 0, 1.6))
        t = bpy.context.object
        t.data.materials.append(trunk)
        bpy.ops.object.select_all(action='DESELECT')
        crown.select_set(True)
        t.select_set(True)
        bpy.context.view_layer.objects.active = crown
        bpy.ops.object.join()
        crown.hide_render = True
        crown.location = (0, 0, -1000)
        templates.append(crown)
    x = x0
    while x <= x1:
        inst = templates[int(rng.integers(0, 4))].copy()
        inst.hide_render = False
        s_ = float(rng.uniform(*h)) / 15.4
        inst.scale = (s_ * float(rng.uniform(.85, 1.1)), s_, s_)
        inst.rotation_euler = (0, 0, float(rng.uniform(0, 6.28)))
        inst.location = (x, y + float(rng.uniform(-.8, .8)), 0)
        bpy.context.scene.collection.objects.link(inst)
        x += step * float(rng.uniform(.6, 1.5))


def vineyard(xs, y0, y1, leaf, post, soil_row):
    """Espalderas: una hilera modelo instanciada (instancias = poca memoria)."""
    length = y1 - y0
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    canopy = bpy.context.object
    canopy.name = 'Cine__VineCanopy'
    canopy.scale = (.62, length, .9)
    bpy.ops.object.transform_apply(scale=True)
    bev = canopy.modifiers.new('round', 'BEVEL')
    bev.width, bev.segments = .26, 3
    bpy.ops.object.modifier_apply(modifier='round')
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.subdivide(number_cuts=6)
    bpy.ops.object.mode_set(mode='OBJECT')
    bm = bmesh.new()
    bm.from_mesh(canopy.data)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs((e.verts[0].co - e.verts[1].co).y) > .5],
                              cuts=int(length / .5), use_grid_fill=True)
    bm.to_mesh(canopy.data)
    bm.free()
    tex = bpy.data.textures.new('Cine__vine', 'CLOUDS')
    tex.noise_scale = .28
    d = canopy.modifiers.new('leaves', 'DISPLACE')
    d.texture, d.strength, d.texture_coords = tex, .34, 'LOCAL'
    bpy.ops.object.modifier_apply(modifier='leaves')
    bpy.ops.object.shade_smooth()
    canopy.data.materials.append(leaf)
    parts = [canopy]
    k = 0
    while k * 6 <= length:
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=.05, depth=1.9, location=(0, -length / 2 + k * 6, -.55))
        p = bpy.context.object
        p.data.materials.append(post)
        parts.append(p)
        k += 1
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = canopy
    bpy.ops.object.join()
    row = bpy.context.object
    row.location = (xs[0], (y0 + y1) / 2, 1.25)
    for x in xs[1:]:
        inst = row.copy()
        inst.location = (x, (y0 + y1) / 2 + ((x * 7.3) % 1.7 - .8), 1.25 + ((x * 3.1) % .2 - .1))
        bpy.context.scene.collection.objects.link(inst)
    return row


def plane_tree(x, y, leaf, trunk, rng, h=9.0):
    """Plátano de acequia: tronco claro y copa amplia en racimos."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.2, depth=h * .55, location=(x, y, h * .27))
    bpy.context.object.data.materials.append(trunk)
    tex = bpy.data.textures.get('Cine__crown') or bpy.data.textures.new('Cine__crown', 'CLOUDS')
    tex.noise_scale = .6
    tex.noise_scale = .16
    tex.noise_depth = 3
    for _ in range(18):
        r = float(rng.uniform(.9, 1.6))
        loc = (x + rng.uniform(-2.4, 2.4), y + rng.uniform(-2.2, 2.2), h * .6 + rng.uniform(-1.2, 2.4))
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=r, location=loc)
        c = bpy.context.object
        c.data.materials.append(leaf)
        d = c.modifiers.new('leaves', 'DISPLACE')
        d.texture, d.strength = tex, .55
        bpy.ops.object.shade_smooth()


def context_for(scene, lo, hi, center, extent):
    rng = np.random.default_rng(11)
    soil = mat_soil()
    leaf, poplar, trunk = mat_leaf(), mat_poplar(), mat_paint('7a6a58', rough=.85)
    if scene == 'fachada':
        ground(center, extent, mat_asphalt())
        concrete = mat_concrete(False)
        box('Cine__Acequia wall s', (0, -4.42, -.2), (40, .12, .44), concrete)
        box('Cine__Acequia wall n', (0, -5.10, -.2), (40, .12, .44), concrete)
        box('Cine__Acequia bed', (0, -4.76, -.38), (40, .6, .06), concrete)
        box('Cine__Acequia water', (0, -4.76, -.28), (40, .56, .01), mat_water())
        box('Cine__Street mark', (0, -9.2, .002), (40, .14, .004), mat_paint('d8d2c0', rough=.6))
        box('Cine__Sidewalk far', (0, 9.8 + 3.5, .03), (60, 7, .06), concrete)
        for side in (-1, 1):
            box(f'Cine__Neighbour {side}', (side * 20.5, 5.2, 9 + side * 1.5), (11, 10, 18 + side * 3), mat_neighbour())
        for x in (-16.5, -24, 16.5, 24):
            plane_tree(x, -4.76, leaf, mat_paint('a39a86', rough=.8), rng)
        poplar_row(center.x - 400, center.x + 400, center.y + 520, 9, poplar, trunk, rng, h=(16, 22))
    elif scene == 'planta':
        ground(center, extent, mat_scree())
        camp(center, lo, hi)
        lattice_tower(hi.x - 6, hi.y + 22)
        andes(center, near=True)
        return
    else:
        ground(center, extent, mat_lawn() if scene == 'hospital' else soil)
        if scene == 'hospital':
            concrete = mat_concrete(False)
            box('Cine__Path', (center.x, lo.y - 6, .0), (70, 4, .04), concrete)
            box('Cine__Parking', (center.x + 8, lo.y - 22, .0), (60, 22, .04), mat_asphalt())
            for k in range(-9, 10):
                box(f'Cine__Bay {k}', (center.x + 8 + k * 3, lo.y - 22, .025), (.1, 5, .01), mat_paint('e8e4d8', rough=.6))
        if scene == 'bodega':
            xs = [center.x - 70 + 2.5 * k for k in range(58)]
            vineyard(xs, lo.y - 90, lo.y - 7, leaf, mat_oak(), soil)
            vineyard([hi.x + 6 + 2.5 * k for k in range(22)], lo.y - 7, hi.y + 30, leaf, mat_oak(), soil)
            vineyard([center.x - 110 + 2.5 * k for k in range(90)], hi.y + 12, hi.y + 138, leaf, mat_oak(), soil)
        if scene == 'aeropuerto':
            box('Cine__Apron', (center.x, hi.y + 40, -.01), (220, 64, .02), mat_concrete(False))
            for k in range(-4, 5):
                box(f'Cine__Stand line {k}', (center.x + k * 24, hi.y + 40, .003), (.18, 50, .004), mat_paint('e0b43a', rough=.5))
            box('Cine__Taxiway', (center.x, hi.y + 110, -.01), (1600, 46, .02), mat_asphalt())
            box('Cine__Runway', (center.x, hi.y + 260, -.01), (3000, 45, .02), mat_asphalt())
            for k in range(-60, 61):
                box(f'Cine__Runway dash {k}', (center.x + k * 25, hi.y + 260, .003), (12, .5, .004), mat_paint('e8e4d8', rough=.6))
            box('Cine__Taxi line', (center.x, hi.y + 110, .003), (1600, .25, .004), mat_paint('e0b43a', rough=.5))
        poplar_row(center.x - 320, center.x + 320, hi.y + (150 if scene != 'aeropuerto' else 190), 5.5, poplar, trunk, rng, h=(13, 23))
        poplar_row(center.x - 900, center.x + 900, hi.y + 520, 9, poplar, trunk, rng, h=(16, 22))
    andes(center)


def sky_and_sun(scene, cam_dir):
    world = bpy.data.worlds.new('Cine__World')
    world.use_nodes = True
    nt = world.node_tree
    sky = nt.nodes.new('ShaderNodeTexSky')
    sky.sky_type = 'MULTIPLE_SCATTERING'
    sky.sun_disc = False
    # Sol del este, bajo, detrás de cámara: ilumina de frente la cordillera (mañana en Mendoza).
    elevation = math.radians(12)
    flat = Vector((cam_dir.x, cam_dir.y, 0)).normalized()
    side = Vector((-flat.y, flat.x, 0))
    to_sun = (-flat * .8 + side * .6).normalized()
    to_sun = Vector((to_sun.x * math.cos(elevation), to_sun.y * math.cos(elevation), math.sin(elevation)))
    sky.sun_elevation = elevation
    sky.sun_rotation = math.atan2(to_sun.x, to_sun.y)
    sky.altitude = 3200 if scene == 'planta' else 750
    bg = nt.nodes['Background']
    bg.inputs['Strength'].default_value = .2
    nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
    bpy.context.scene.world = world
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 50))
    sun = bpy.context.object
    sun.name = 'Cine__Sun'
    sun.data.energy = 7.5
    sun.data.angle = math.radians(.8)
    sun.data.color = (1.0, .74, .5)
    sun.rotation_euler = (-to_sun).to_track_quat('-Z', 'Y').to_euler()
    return to_sun


def interior_fill(scene, lo, hi):
    if scene != 'hospital':
        return
    # Techo cortado: luz cenital cálida por sala para leer el interior.
    x = lo.x + 3
    while x < hi.x - 2:
        for y in (4.0, 12.5):
            bpy.ops.object.light_add(type='AREA', location=(x, y, 3.2))
            light = bpy.context.object
            light.data.shape, light.data.size, light.data.size_y = 'RECTANGLE', 3.2, 2.4
            light.data.energy, light.data.color = 180, (1.0, .9, .8)
        x += 5.5


# ---------------------------------------------------------------- cámara y AR
def ease(t):
    return t * t * (3 - 2 * t)


def camera_path(scene, center, extent, frames):
    shot = SHOTS[scene]
    A, B = shot['a'], shot['b']
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.name = 'Cine__Camera'
    cam.data.lens = shot['lens']
    cam.data.sensor_width = 36
    cam.data.clip_start, cam.data.clip_end = .3, 20000
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 5.6
    bpy.context.scene.camera = cam
    for f in range(frames):
        t = ease(f / max(1, frames - 1))
        mix = lambda i: A[i] + (B[i] - A[i]) * t
        az, el, dist = math.radians(mix(0)), math.radians(mix(1)), extent * mix(2)
        target = center + Vector(A[3]).lerp(Vector(B[3]), t)
        off = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))) * dist
        cam.location = target + off
        cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam.data.dof.focus_distance = (target - cam.location).length
        cam.keyframe_insert('location', frame=f + 1)
        cam.keyframe_insert('rotation_euler', frame=f + 1)
        cam.data.dof.keyframe_insert('focus_distance', frame=f + 1)
    for fc in (cam.animation_data.action.fcurves if hasattr(cam.animation_data.action, 'fcurves') else []):
        for k in fc.keyframe_points:
            k.interpolation = 'LINEAR'
    return cam, (target - (target + off)).normalized()


def _cr(p0, p1, p2, p3, u):
    """Catmull-Rom uniforme."""
    u2, u3 = u * u, u * u * u
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3)


# ---------------------------------------------------------------- planificador de pasillos
_BVH, _GRIDS = None, {}


def scene_bvh():
    """Árbol de búsqueda con toda la geometría visible de la escena, en coordenadas de mundo."""
    from mathutils.bvhtree import BVHTree
    deps = bpy.context.evaluated_depsgraph_get()
    verts, polys = [], []
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH' or obj.hide_render:
            continue
        ev = obj.evaluated_get(deps)
        me = ev.to_mesh()
        mw = obj.matrix_world
        base = len(verts)
        verts.extend(mw @ v.co for v in me.vertices)
        polys.extend([base + i for i in p.vertices] for p in me.polygons)
        ev.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys, epsilon=0.0)


def corridor_path(name, scene, entry_az, res=.75, cmin=1.3, cap=6.0):
    """Recorrido por pasillos libres: entra desde afuera a ras (az de ataque), pasa por el punto
    libre con mejor vista a los equipos del servicio y sale en altura. Devuelve keys densas."""
    import heapq
    global _BVH
    if _BVH is None:
        _BVH = scene_bvh()
    bvh = _BVH
    pts = system_points(name, scene)
    c = sum(pts, Vector()) / len(pts)
    lo, hi = bounds()
    # caja acotada alrededor de los equipos (el entorno de contexto llega a kilómetros)
    span = max(max(abs(p.x - c.x), abs(p.y - c.y)) for p in pts)
    R = min(40.0, max(22.0, span + 14))
    ext = R * .8
    gl = Vector((c.x - R, c.y - R, max(lo.z, c.z - 6) + .6))
    gh = Vector((c.x + R, c.y + R, c.z + 16))
    hi = Vector((hi.x, hi.y, min(hi.z, c.z + 9)))
    nx, ny, nz = (int((gh[i] - gl[i]) / res) + 1 for i in range(3))
    clave = (round(gl.x, 2), round(gl.y, 2), round(gl.z, 2), nx, ny, nz, res)
    if clave not in _GRIDS:
        clear = np.zeros((nx, ny, nz), dtype=np.float32)
        for i in range(nx):
            for j in range(ny):
                for k in range(nz):
                    p = Vector((gl.x + i * res, gl.y + j * res, gl.z + k * res))
                    hit = bvh.find_nearest(p, cap)
                    if hit[0] is None:
                        clear[i, j, k] = cap
                    else:
                        loc, nrm, _, d = hit
                        clear[i, j, k] = -1 if nrm is not None and (p - loc).dot(nrm) < 0 else d
        _GRIDS[clave] = clear
    clear = _GRIDS[clave]
    free = clear >= cmin
    cell = lambda p: tuple(int(round((p[a] - gl[a]) / res)) for a in range(3))
    center = lambda q: Vector((gl.x + q[0] * res, gl.y + q[1] * res, gl.z + q[2] * res))

    def nearest_free(p, rad=8):
        q0 = cell(p)
        best = None
        for di in range(-rad, rad + 1):
            for dj in range(-rad, rad + 1):
                for dk in range(-rad, rad + 1):
                    q = (q0[0] + di, q0[1] + dj, q0[2] + dk)
                    if all(0 <= q[a] < (nx, ny, nz)[a] for a in range(3)) and free[q]:
                        dd = di * di + dj * dj + dk * dk
                        if best is None or dd < best[0]:
                            best = (dd, q)
        return best and best[1]

    nbrs = [(a, b, d) for a in (-1, 0, 1) for b in (-1, 0, 1) for d in (-1, 0, 1) if (a, b, d) != (0, 0, 0)]

    def astar(s, g):
        openh = [(0.0, s)]
        cost, prev = {s: 0.0}, {}
        while openh:
            _, q = heapq.heappop(openh)
            if q == g:
                path = [q]
                while q in prev:
                    q = prev[q]
                    path.append(q)
                return path[::-1]
            for d in nbrs:
                r = (q[0] + d[0], q[1] + d[1], q[2] + d[2])
                if not all(0 <= r[a] < (nx, ny, nz)[a] for a in range(3)) or not free[r]:
                    continue
                step = math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2) * (1 + 2.5 / float(clear[r]))
                nc = cost[q] + step
                if nc < cost.get(r, 1e18):
                    cost[r], prev[r] = nc, q
                    h = math.sqrt(sum((r[a] - g[a]) ** 2 for a in range(3)))
                    heapq.heappush(openh, (nc + h, r))
        return None

    sc, deps = bpy.context.scene, bpy.context.evaluated_depsgraph_get()
    # punto de visita: celda libre a 3–9 m de los equipos con más equipos a la vista
    goal, best = None, -1
    q0 = cell(c)
    for di in range(-12, 13, 2):
        for dj in range(-12, 13, 2):
            for dk in range(-4, 7, 2):
                q = (q0[0] + di, q0[1] + dj, q0[2] + dk)
                if not all(0 <= q[a] < (nx, ny, nz)[a] for a in range(3)) or not free[q]:
                    continue
                p = center(q)
                if not 3 < (p - c).length < 9:
                    continue
                seen = sum(1 for t in pts if not ray_opaque(sc, deps, p, (t - p).normalized(), (t - p).length - .5)[0])
                score = seen + .15 * min(float(clear[q]), 4)
                if score > best:
                    goal, best = q, score
    if goal is None:
        print('CINE_PASILLO_DEBUG sin meta', name, 'libres', int(free.sum()), 'de', free.size, flush=True)
        return None
    a = math.radians(entry_az)
    # entrada a ras: primera celda libre de la columna (sobre el terreno), ~2 m más arriba
    sx = c + Vector((math.sin(a), -math.cos(a), 0)) * ext * .85
    q = cell(Vector((sx.x, sx.y, gl.z)))
    q = (min(nx - 1, max(0, q[0])), min(ny - 1, max(0, q[1])), 0)
    k0 = next((k for k in range(nz) if free[q[0], q[1], k]), None)
    start = None if k0 is None else nearest_free(center((q[0], q[1], min(nz - 1, k0 + 2))))
    exit_ = nearest_free(c + Vector((-math.sin(a) * 4, math.cos(a) * 4, hi.z - c.z + 7)))
    if start is None or exit_ is None:
        print('CINE_PASILLO_DEBUG sin entrada/salida', name, entry_az, start, exit_, flush=True)
        return None
    p1, p2 = astar(start, goal), astar(goal, exit_)
    if not p1 or not p2:
        print('CINE_PASILLO_DEBUG sin camino', name, entry_az, bool(p1), bool(p2), flush=True)
        return None
    raw = [center(q) for q in p1 + p2[1:]]
    # suavizado gaussiano y re-muestreo por longitud de arco
    sm = []
    for i in range(len(raw)):
        w = [(math.exp(-(k / 3) ** 2), raw[min(len(raw) - 1, max(0, i + k))]) for k in range(-6, 7)]
        sm.append(sum((p * x for x, p in w), Vector()) / sum(x for x, _ in w))
    acc = [0.0]
    for i in range(1, len(sm)):
        acc.append(acc[-1] + (sm[i] - sm[i - 1]).length)
    n = 64
    keys = []
    for m in range(n):
        s_ = acc[-1] * m / (n - 1)
        i = next((j for j in range(1, len(acc)) if acc[j] >= s_), len(acc) - 1)
        u = (s_ - acc[i - 1]) / max(1e-6, acc[i] - acc[i - 1])
        pos = sm[i - 1].lerp(sm[i], u)
        ahead = sm[min(len(sm) - 1, i + 8)]
        w = math.exp(-((pos - c).length / 10) ** 2)
        tgt = ahead.lerp(c, min(.85, .25 + w))
        q = cell(pos)
        cl = float(clear[q]) if all(0 <= q[a] < (nx, ny, nz)[a] for a in range(3)) else cap
        x = m / (n - 1)
        # keys en el mismo reparto temporal que flight_path (t ≈ ease del cuadro)
        keys.append((.45 * x + .55 * (.5 - .5 * math.cos(math.pi * x)), tuple(pos), tuple(tgt), 20 + 2 * min(cl, 5)))
    return keys


def plan_corridors(scene, names):
    """Prueba 8 entradas por servicio y guarda el mejor recorrido de pasillos en camaras-pasillos.json."""
    for name in names:
        pts = system_points(name, scene)
        best = None
        for az in range(-180, 180, 45):
            keys = corridor_path(name, scene, az)
            if not keys:
                continue
            m = camera_score(keys, pts, detail=True)
            score = 4 * m['bad'] + m['empty'] - .5 * m['vis']
            print('CINE_PASILLO_PRUEBA', scene, name, az, json.dumps({k: v for k, v in m.items() if k != 'malos'}), flush=True)
            if best is None or score < best[0]:
                best = (score, az, keys, m)
        if best is None:
            print('CINE_PASILLO', scene, name, 'sin recorrido', flush=True)
            continue
        _, az, keys, m = best
        disco = json.loads(PASILLOS_PATH.read_text()) if PASILLOS_PATH.exists() else {}
        disco[f'{scene}-{name}'] = dict(style='pasillo', az=az, **m, actual=CAMARAS.get(f'{scene}-{name}', {}),
                                        keys=[[k[0], list(k[1]), list(k[2]), k[3]] for k in keys])
        PASILLOS_PATH.write_text(json.dumps(disco, indent=1, sort_keys=True) + '\n')
        print('CINE_PASILLO', scene, name, az, json.dumps({k: v for k, v in m.items() if k != 'malos'}), flush=True)


def flight_at(keys, t):
    ts = [k[0] for k in keys]
    i = max(0, min(len(keys) - 2, next((j for j in range(len(ts) - 1) if t <= ts[j + 1]), len(ts) - 2)))
    u = (t - ts[i]) / max(1e-6, ts[i + 1] - ts[i])
    pick = lambda j, n: Vector(keys[max(0, min(len(keys) - 1, j))][n])
    pos = _cr(pick(i - 1, 1), pick(i, 1), pick(i + 1, 1), pick(i + 2, 1), u)
    tgt = _cr(pick(i - 1, 2), pick(i, 2), pick(i + 1, 2), pick(i + 2, 2), u)
    lens = keys[i][3] + (keys[i + 1][3] - keys[i][3]) * u
    return pos, tgt, lens


def system_points(name, scene):
    v = VARIANTS[name]
    items = [a for a in ASSETS[scene] if not v['systems'] or a['system'] in v['systems']] or ASSETS[scene]
    return [Vector(a['p']) for a in items]


def _is_glass(obj):
    mats = [s.material.name for s in obj.material_slots if s.material]
    return bool(mats) and all('glass' in m for m in mats)


def ray_opaque(sc, deps, origin, direction, distance):
    """ray_cast que atraviesa el vidrio: devuelve (hit, loc) del primer objeto opaco."""
    o = origin
    for _ in range(8):
        hit, loc, _, _, obj, _ = sc.ray_cast(deps, o, direction, distance=distance - (o - origin).length)
        if not hit:
            return False, None
        if not _is_glass(obj):
            return True, loc
        o = loc + direction * 1e-3
    return True, o


def camera_score(keys, pts, frames=192, step=2, near=4.0, skin=1.0, detail=False):
    """Mide un recorrido sin renderizar: rayos contra la geometría real de la escena.

    bad: fracción de cuadros con la lente tapada (2 de 15 rayos chocan a menos de `near`)
    o con la cámara dentro de un volumen, a menos de `skin` de algo en cualquier dirección, o que
    atraviesa geometría entre un cuadro y el siguiente (se revisan todos); vis: fracción media de equipos del sistema en cuadro y
    sin obstrucción; empty: fracción de cuadros sin ningún equipo visible."""
    sc = bpy.context.scene
    deps = bpy.context.evaluated_depsgraph_get()
    axes = [Vector(d) for d in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))]
    grid = [(u, w) for u in (-.8, -.4, 0, .4, .8) for w in (-.7, 0, .7)]
    def at_frame(f):
        x = f / max(1, frames - 1)
        return flight_at(keys, .45 * x + .55 * (.5 - .5 * math.cos(math.pi * x)))

    crossed = set()
    prev = at_frame(0)[0]
    for f in range(1, frames):
        pos = at_frame(f)[0]
        seg = pos - prev
        if seg.length > 1e-4 and sc.ray_cast(deps, prev, seg.normalized(), distance=seg.length)[0]:
            crossed.add(f // step)
        prev = pos
    bad = empty = n = 0
    vis_sum = 0.0
    malos = []
    for f in range(0, frames, step):
        pos, tgt, lens = at_frame(f)
        d = tgt - pos
        if abs(d.normalized().z) > .995:
            d = tgt + Vector((0, .05, 0)) - pos
        q = d.to_track_quat('-Z', 'Y')
        right, up, fwd = q @ Vector((1, 0, 0)), q @ Vector((0, 1, 0)), q @ Vector((0, 0, -1))
        hw = 18 / lens
        hh = hw * 9 / 16
        # L: algo pegado a la lente; F: un primer plano tapa el centro del cuadro (fila media)
        # en el primer 30 % del camino al objetivo, donde el desenfoque lo vuelve una mancha
        half = .3 * (tgt - pos).length
        blocked = front = 0
        for u, w in grid:
            hit, loc = ray_opaque(sc, deps, pos, (fwd + right * u * hw + up * w * hh).normalized(), max(near, half))
            if hit:
                dist = (loc - pos).length
                blocked += dist < near
                front += dist < half and w == 0 and abs(u) < .5
        inside = brush = 0
        for ax in axes:
            hit, loc, nrm, *_ = sc.ray_cast(deps, pos, ax, distance=60)
            inside += 1 if hit and nrm.dot(ax) > 0 else 0
            brush += 1 if hit and (loc - pos).length < skin else 0
        seen = 0
        for p in pts:
            rel = p - pos
            z = rel.dot(fwd)
            if z <= .3 or abs(rel.dot(right) / (z * hw)) > .92 or abs(rel.dot(up) / (z * hh)) > .88:
                continue
            hit, loc = ray_opaque(sc, deps, pos, rel.normalized(), rel.length)
            seen += 1 if (not hit or (loc - pos).length > rel.length - .7) else 0
        n += 1
        why = ''.join(k for k, on in (('L', blocked >= 2), ('F', front >= 2), ('D', inside >= 4), ('R', brush),
                                      ('X', (f // step) in crossed)) if on)
        if why:
            bad += 1
            malos.append(f'{f + 1}{why}')
        empty += 1 if seen == 0 else 0
        vis_sum += seen / len(pts)
    m = dict(bad=round(bad / n, 3), vis=round(vis_sum / n, 3), empty=round(empty / n, 3))
    return dict(m, malos=malos) if detail else m


def scout(scene, names):
    """Explorador: por servicio prueba 18 azimuts × 4 estilos × 5 distancias y guarda la mejor cámara."""
    styles = ('ground', 'orbit', 'aerial', 'overhead')
    for name in names:
        v, pts = VARIANTS[name], system_points(name, scene)
        base = camera_score(variant_path(name, scene, v['az'], v['style'], 1.0), pts)
        best = None
        for zoom in (1.0, 1.35, 1.7, 2.2, 2.8):
            for st in (v['style'],) + tuple(s for s in styles if s != v['style']):
                for k in range(18):
                    az = (v['az'] + 20 * k + 180) % 360 - 180
                    m = camera_score(variant_path(name, scene, az, st, zoom), pts)
                    # el estilo pedido y la distancia original pesan: el explorador sólo los cambia
                    # si no hay un azimut limpio; la visibilidad desempata.
                    score = (4 * m['bad'] + m['empty'] - .5 * m['vis'] + (.3 if st != v['style'] else 0)
                             + .1 * (zoom != 1.0) + .1 * (zoom > 1.5) + .1 * (zoom > 2) + .0005 * min(k, 18 - k))
                    if best is None or score < best[0]:
                        best = (score, az, st, zoom, m)
        _, az, st, zoom, m = best
        m = camera_score(variant_path(name, scene, az, st, zoom), pts, detail=True)
        CAMARAS[f'{scene}-{name}'] = dict(az=az, style=st, zoom=zoom, **m, base=base)
        # releer antes de escribir: puede haber otros exploradores (otras escenas) en paralelo
        disco = json.loads(CAMARAS_PATH.read_text()) if CAMARAS_PATH.exists() else {}
        disco[f'{scene}-{name}'] = CAMARAS[f'{scene}-{name}']
        CAMARAS_PATH.write_text(json.dumps(disco, indent=1, sort_keys=True) + '\n')
        print('CINE_SCOUT', scene, name, 'base', json.dumps(base), '→', az, st, zoom, json.dumps({k: v for k, v in m.items() if k != 'malos'}), flush=True)


def flight_path(scene, frames, keys=None):
    """Cámara imposible: sigue PATHS (o las keys de una variante) con Catmull-Rom."""
    keys = keys or PATHS[scene]
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.name = 'Cine__Camera'
    cam.data.sensor_width = 36
    cam.data.clip_start, cam.data.clip_end = .1, 20000
    bpy.context.scene.camera = cam
    first_dir = None
    for f in range(frames):
        x = f / max(1, frames - 1)
        t = .45 * x + .55 * (.5 - .5 * math.cos(math.pi * x))
        pos, tgt, lens = flight_at(keys, t)
        d = tgt - pos
        if abs(d.normalized().z) > .995:  # vista cenital pura: evitar giro indefinido
            tgt = tgt + Vector((0, .05, 0))
            d = tgt - pos
        cam.location = pos
        cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        cam.data.lens = lens
        cam.keyframe_insert('location', frame=f + 1)
        cam.keyframe_insert('rotation_euler', frame=f + 1)
        cam.data.keyframe_insert('lens', frame=f + 1)
        if first_dir is None:
            first_dir = d.normalized()
    return cam, first_dir


SKELETON = {'Architecture': (.035, .055, .08), 'Ceiling': (.035, .055, .08), 'Furniture-context': (.09, .11, .15),
            'Exterior-context': (.07, .09, .12), 'Lighting': (.3, .3, .26)}


def setup_skeleton(width, height):
    """Esqueleto: arquitectura translúcida con contornos y sistemas encendidos, sobre grilla oscura."""
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = width, height, 100
    sh = sc.display.shading
    sh.light = 'FLAT'
    sh.color_type = 'OBJECT'
    sh.show_xray = True
    sh.xray_alpha = .55
    sh.show_object_outline = True
    sh.background_type = "WORLD"
    sh.object_outline_color = (.32, .72, 1.0)
    sh.show_cavity = True
    sh.cavity_type = 'WORLD'
    sh.show_shadows = False
    sc.display.render_aa = '8'
    world = bpy.data.worlds.new('Cine__Void')
    world.color = (.006, .008, .012)
    sc.world = world
    for o in sc.objects:
        if o.type != 'MESH':
            continue
        system = o.name.split('__')[0]
        if system in SYSTEMS:
            c = lin(SYSTEMS[system])
            o.color = (min(1, c[0] * 3 + .08), min(1, c[1] * 3 + .08), min(1, c[2] * 3 + .08), 1)
        else:
            o.color = SKELETON.get(system, (.07, .1, .14)) + (1,)
    # Grilla de piso (geometría real: Workbench no dibuja la grilla del visor en render).
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=120, size=240, location=(0, 0, -.03))
    g = bpy.context.object
    g.name = 'Cine__Grid'
    w = g.modifiers.new('wire', 'WIREFRAME')
    w.thickness = .025
    g.color = (.05, .2, .28, 1)
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 93
    sc.view_settings.view_transform = 'Standard'


def setup_preview(width, height):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = width, height, 100
    sc.display.shading.light = 'STUDIO'
    sc.display.shading.color_type = 'MATERIAL'
    sc.display.render_aa = 'FXAA'
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 80


def ar_track(scene, cam, frames, width, height, min_ratio=.55, max_assets=16, per_system=3):
    sc = bpy.context.scene
    deps = bpy.context.evaluated_depsgraph_get()
    items = ASSETS[scene]
    track = {a['id']: [] for a in items}
    for f in range(1, frames + 1):
        sc.frame_set(f)
        deps = bpy.context.evaluated_depsgraph_get()
        origin = cam.matrix_world.translation
        for a in items:
            p = Vector(a['p'])
            v = world_to_camera_view(sc, cam, p)
            vis = 0
            if v.z > 0 and .04 < v.x < .96 and .06 < v.y < .94:
                d = p - origin
                hit, loc, *_ = sc.ray_cast(deps, origin, d.normalized(), distance=d.length)
                vis = 1 if (not hit or (loc - origin).length > d.length - .7) else 0
            track[a['id']].append([round(v.x, 4), round(1 - v.y, 4), vis])
    keep = []
    for a in items:
        seen = sum(s[2] for s in track[a['id']])
        if seen >= frames * min_ratio:
            keep.append((seen, a))
    keep.sort(key=lambda x: -x[0])
    by_system, chosen = {}, []
    for seen, a in keep:
        if by_system.get(a['system'], 0) >= per_system:
            continue
        by_system[a['system']] = by_system.get(a['system'], 0) + 1
        chosen.append(a)
        if len(chosen) >= max_assets:
            break
    return {'scene': scene, 'fps': sc.render.fps, 'frames': frames, 'width': width, 'height': height,
            'note': 'Visualización conceptual · lecturas DEMO',
            'assets': [{k: a[k] for k in ('id', 'system', 'name', 'metric')} for a in chosen],
            'track': {a['id']: track[a['id']] for a in chosen}}


# ---------------------------------------------------------------- render
def compositor():
    sc = bpy.context.scene
    try:
        tree = bpy.data.node_groups.new('Cine__Comp', 'CompositorNodeTree')
        tree.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
        rl = tree.nodes.new('CompositorNodeRLayers')
        glare = tree.nodes.new('CompositorNodeGlare')
        glare.inputs['Type'].default_value = 'Bloom'
        glare.inputs['Threshold'].default_value = 1.2
        glare.inputs['Strength'].default_value = .35
        glare.inputs['Size'].default_value = .6
        lens = tree.nodes.new('CompositorNodeLensdist')
        lens.inputs['Dispersion'].default_value = .012
        out = tree.nodes.new('NodeGroupOutput')
        tree.links.new(rl.outputs['Image'], glare.inputs['Image'])
        tree.links.new(glare.outputs['Image'], lens.inputs['Image'])
        tree.links.new(lens.outputs['Image'], out.inputs[0])
        sc.compositing_node_group = tree
        sc.render.use_compositing = True
        return True
    except Exception as exc:  # el compositor cambió mucho en 5.x: nunca bloquear el render
        print('CINE_COMPOSITOR_SKIPPED', exc, flush=True)
        return False


def setup_render(width, height, samples):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = width, height, 100
    sc.render.fps = 24
    c = sc.cycles
    c.samples = samples
    c.use_adaptive_sampling = True
    c.adaptive_threshold = .025
    c.use_denoising = True
    try:
        c.denoising_use_gpu = True
    except AttributeError:
        pass
    c.max_bounces, c.diffuse_bounces, c.glossy_bounces, c.transmission_bounces = 8, 3, 4, 6
    c.transparent_max_bounces = 8
    c.sample_clamp_indirect = 8
    c.caustics_reflective = c.caustics_refractive = False
    sc.render.use_persistent_data = True
    device = 'CPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type == 'METAL'
        if any(d.use for d in prefs.devices):
            c.device, device = 'GPU', 'METAL'
    except (TypeError, RuntimeError):
        c.device = 'CPU'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Punchy'
    sc.view_settings.exposure = 0
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 93
    sc.render.image_settings.color_mode = 'RGB'
    return device


def mem(tag):
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e9  # macOS: bytes
    print(f'CINE_MEM {tag} {rss:.2f} GB', flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('scene', choices=SCENES)
    ap.add_argument('--frames', type=int, default=144)
    ap.add_argument('--still', action='store_true', help='un solo cuadro (el del medio del plano)')
    ap.add_argument('--at', type=float, default=.5, help='posición del cuadro fijo en el plano 0..1')
    ap.add_argument('--width', type=int, default=1920)
    ap.add_argument('--samples', type=int, default=96)
    ap.add_argument('--out', type=Path)
    ap.add_argument('--bare', action='store_true', help='sin entorno (diagnóstico)')
    ap.add_argument('--setup-only', action='store_true')
    ap.add_argument('--limit', type=int, default=0, help='renderizar sólo los primeros N cuadros (medición)')
    ap.add_argument('--track-only', action='store_true', help='sólo recalcular ar-track.json')
    ap.add_argument('--flight', action='store_true', help='v3: recorrido imposible (PATHS) en lugar del plano grúa')
    ap.add_argument('--pass', dest='pass_', choices=('cine', 'skeleton', 'preview'), default='cine')
    ap.add_argument('--variant', choices=sorted(VARIANTS), help='v4: recorrido propio de un servicio (implica --flight)')
    ap.add_argument('--en', choices=SCENES, help='v4: el recorrido del servicio en otra escena')
    ap.add_argument('--pasillo', help='v4: servicios (coma) para planificar recorridos por pasillos; escribe camaras-pasillos.json')
    ap.add_argument('--scout', help='v4: servicios (coma) para elegir cámara en esta escena; escribe camaras-v4.json')
    a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:])
    if a.variant:
        a.flight = True
        a.scene = a.en or VARIANTS[a.variant]['scene']
    t0 = time.monotonic()
    width, height = a.width, round(a.width * 9 / 16)
    out = (a.out or (OUT / f'{a.scene}-{a.variant}' / 'v3' if a.variant else OUT / a.scene / 'v3' if a.flight else OUT / a.scene)).resolve()
    out.mkdir(parents=True, exist_ok=True)

    load_model(SCENES[a.scene])
    if a.scene == 'hospital':
        cut_hospital()
    elif a.scene == 'fachada':
        cut_fachada()
    palette = build_palette(a.scene)
    restyle(a.scene, palette)
    bpy.context.view_layer.update()
    mem('model')
    lo, hi = bounds()
    mem('bounds')
    center = (lo + hi) / 2
    extent = max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z)
    frames = a.frames
    if a.pasillo:
        context_for(a.scene, lo, hi, center, extent)
        interior_fill(a.scene, lo, hi)
        plan_corridors(a.scene, a.pasillo.split(','))
        return
    if a.scout:
        context_for(a.scene, lo, hi, center, extent)
        interior_fill(a.scene, lo, hi)
        scout(a.scene, a.scout.split(','))
        return
    cam, cam_dir = (flight_path(a.scene, frames, variant_path(a.variant, a.scene) if a.variant else None) if a.flight
                    else camera_path(a.scene, center, extent, frames))
    device, comp = 'WORKBENCH', False
    if a.track_only:
        bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y = width, height
        track = ar_track(a.scene, cam, frames, width, height, *((.1, 28, 5) if a.flight else ()))
        if a.flight:
            track['order'] = 'linear'
        (out / 'ar-track.json').write_text(json.dumps(track, separators=(',', ':')))
        print('CINE_TRACK', a.scene, len(track['assets']), 'assets', flush=True)
        return
    if a.pass_ == 'skeleton':
        setup_skeleton(width, height)
    elif a.pass_ == 'preview':
        sky_and_sun(a.scene, cam_dir)
        if not a.bare:
            context_for(a.scene, lo, hi, center, extent)
        setup_preview(width, height)
    else:
        sky_and_sun(a.scene, cam_dir)
        if not a.bare:
            context_for(a.scene, lo, hi, center, extent)
        interior_fill(a.scene, lo, hi)
        device = setup_render(width, height, a.samples)
        comp = compositor()
        if a.flight:  # movimiento rápido: desenfoque de cámara
            bpy.context.scene.render.use_motion_blur = True
            bpy.context.scene.render.motion_blur_shutter = .45
    mem('context')
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, (a.limit or frames)
    print('CINE_SETUP', a.scene, device, 'comp' if comp else 'nocomp', round(time.monotonic() - t0, 1), 's', flush=True)
    if a.setup_only:
        return
    if a.still:
        f = max(1, min(frames, round(1 + a.at * (frames - 1))))
        sc.frame_set(f)
        sc.render.filepath = str(out / f'still-{width}.jpg')
        bpy.ops.render.render(write_still=True)
    else:
        if a.pass_ == 'cine':
            track = ar_track(a.scene, cam, frames, width, height, *((.1, 28, 5) if a.flight else ()))
            if a.flight:
                track['order'] = 'linear'
            (out / 'ar-track.json').write_text(json.dumps(track, separators=(',', ':')))
        sc.render.filepath = str(out / ('frames' if not a.flight else {'skeleton': 'skel'}.get(a.pass_, a.pass_)) / 'f_####')
        sc.render.use_overwrite = False  # reanudable: saltea cuadros ya escritos
        sc.render.use_placeholder = False
        bpy.ops.render.render(animation=True)
    print('CINE_DONE', json.dumps({'scene': a.scene, 'device': device, 'frames': 1 if a.still else frames,
                                   'seconds': round(time.monotonic() - t0, 1), 'out': str(out)}), flush=True)


if __name__ == '__main__':
    main()
