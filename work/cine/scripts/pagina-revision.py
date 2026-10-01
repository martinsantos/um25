#!/usr/bin/env python3
"""Arma la página de revisión de cámaras v4: matriz escena × servicio con las vistas previas.

Lee work/cine/nube/<tanda>/<escena>-<servicio>/ (recorrido.mp4, cine-2/5/85.jpg),
work/cine/camaras-v4.json (métricas del explorador) y work/cine/nube/notas-<tanda>.json
(revisión visual: {"<escena>-<servicio>": {"nota": 1..5, "texto": "..."}}).
Escribe la página y sus medios en <salida>/ (index.html + m/).
Uso: python3 work/cine/scripts/pagina-revision.py <tanda> <salida> [tandas anteriores, de la más nueva a la más vieja]
"""
import html
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
tanda, salida = sys.argv[1], Path(sys.argv[2])
anteriores = sys.argv[3:]
NUBE = ROOT / 'work/cine/nube'
ESCENAS = ['bodega', 'planta', 'aeropuerto', 'hospital', 'fachada']
NOMBRE_ESCENA = {'bodega': 'Bodega', 'planta': 'Planta industrial', 'aeropuerto': 'Aeropuerto',
                 'hospital': 'Hospital', 'fachada': 'Edificio corporativo'}
SERVICIOS = ['redes', 'telecom', 'software', 'seguridad', 'incendios', 'electricos', 'soporte', 'consultoria']
NOMBRE_SERVICIO = {'redes': 'Redes', 'telecom': 'Telecomunicaciones', 'software': 'Software',
                   'seguridad': 'Seguridad', 'incendios': 'Incendios', 'electricos': 'Eléctricos',
                   'soporte': 'Soporte IT', 'consultoria': 'Consultoría'}
PROPIA = {'redes': 'fachada', 'seguridad': 'aeropuerto', 'telecom': 'planta', 'software': 'hospital',
          'soporte': 'aeropuerto', 'consultoria': 'fachada', 'incendios': 'bodega', 'electricos': 'hospital'}

camaras = json.loads((ROOT / 'work/cine/camaras-v4.json').read_text())
notas = {}
for t in [tanda] + anteriores:
    notas[t] = {}
    for f in sorted(NUBE.glob(f'notas-{t}*.json')):
        notas[t].update(json.loads(f.read_text()))
if salida.exists():
    shutil.rmtree(salida)
(salida / 'm').mkdir(parents=True)


def reducir(src, dst, ancho):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(src),
                    '-vf', f'scale={ancho}:-2', '-q:v', '4', str(dst)], check=True)


celdas = {}
for e in ESCENAS:
    for s in SERVICIOS:
        k = f'{e}-{s}'
        # sin cámara nueva, la toma sigue siendo la de la tanda anterior
        d = next((NUBE / t / k for t in [tanda] + anteriores if (NUBE / t / k / 'recorrido.mp4').exists()), None)
        if d is None:
            continue
        (salida / 'm' / k).mkdir()
        shutil.copy(d / 'recorrido.mp4', salida / 'm' / k / 'recorrido.mp4')
        for f in ('cine-2', 'cine-5', 'cine-85'):
            if (d / f'{f}.jpg').exists():
                reducir(d / f'{f}.jpg', salida / 'm' / k / f'{f}.jpg', 960)
        c = camaras.get(k, {})
        celdas[k] = dict(escena=e, servicio=s, propia=PROPIA[s] == e, cam=c, nota=notas[d.parent.name].get(k, {}),
                         origen=d.parent.name)

datos = json.dumps(dict(escenas=ESCENAS, servicios=SERVICIOS, nombreEscena=NOMBRE_ESCENA,
                        nombreServicio=NOMBRE_SERVICIO, celdas=celdas), ensure_ascii=False)
plantilla = (ROOT / 'work/cine/scripts/pagina-revision.html').read_text()
(salida / 'index.html').write_text(plantilla.replace('/*DATOS*/null', datos))
print('PAGINA', salida, len(celdas), 'combinaciones')
