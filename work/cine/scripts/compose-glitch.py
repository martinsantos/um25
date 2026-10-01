#!/usr/bin/env python3
"""Compone el plano v3: pasada cine + pasada esqueleto con cortes "pop" glitch.

Lee out/<escena>/v3/cine/f_####.jpg y out/<escena>/v3/skel/f_####.jpg (misma cámara),
alterna edificio ↔ esqueleto según BEATS y en cada corte mete 5 cuadros de glitch
(bandas desplazadas que mezclan ambas pasadas, separación RGB, líneas de barrido).
Procesa un cuadro por vez (RAM baja). Escribe out/<escena>/v3/comp/ y beats en ar-track.json.
Uso: python3 work/cine/scripts/compose-glitch.py bodega
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
scene = sys.argv[1]
base = ROOT / 'work/cine/out' / scene / 'v3'
cine_dir, skel_dir, out_dir = base / 'cine', base / 'skel', base / 'comp'
out_dir.mkdir(parents=True, exist_ok=True)
frames = len(list(cine_dir.glob('f_*.jpg')))
# Tramos en esqueleto (cuadros, fin exclusivo). El plano termina en esqueleto cenital:
# el corte al siguiente plano (o al inicio del bucle) es otro "pop".
BEATS = [(30, 54), (110, 128), (int(frames * .875), frames)]
EDGES = sorted({b for beat in BEATS for b in beat if 0 < b < frames} | {0})
WIN = 2  # cuadros de glitch a cada lado del corte


def skeleton_at(i):
    return any(a <= i < b for a, b in BEATS)


def glitch(a, b, strength, rng):
    """a, b: arrays HxWx3 uint8. Bandas horizontales tomadas de una u otra pasada y corridas."""
    h, w, _ = a.shape
    out = np.empty_like(a)
    y = 0
    while y < h:
        bh = int(rng.integers(6, 70))
        src = b if rng.random() < .5 else a
        dx = int(rng.normal(0, 38 * strength))
        out[y:y + bh] = np.roll(src[y:y + bh], dx, axis=1)
        y += bh
    k = int(4 + 12 * strength)
    out[..., 0] = np.roll(out[..., 0], k, axis=1)
    out[..., 2] = np.roll(out[..., 2], -k, axis=1)
    out[::3] = (out[::3] * .82).astype(np.uint8)
    return np.clip(out.astype(np.int16) + int(10 * strength), 0, 255).astype(np.uint8)


for i in range(frames):
    dst = out_dir / f'f_{i + 1:04d}.jpg'
    if dst.exists():
        continue
    cine = Image.open(cine_dir / f'f_{i + 1:04d}.jpg').convert('RGB')
    skel = Image.open(skel_dir / f'f_{i + 1:04d}.jpg').convert('RGB').resize(cine.size)
    d = min(abs(i - e) for e in EDGES)
    if i == 0 or d <= WIN:
        rng = np.random.default_rng(1000 + i)
        img = Image.fromarray(glitch(np.asarray(cine), np.asarray(skel), 1 - d / (WIN + 1), rng))
    else:
        img = skel if skeleton_at(i) else cine
    img.save(dst, quality=92)

track_path = base / 'ar-track.json'
track = json.loads(track_path.read_text())
track['order'] = 'linear'
track['beats'] = [[a, b] for a, b in BEATS]
track['glitch'] = [[max(0, e - WIN), min(frames, e + WIN + 1)] for e in EDGES]
track_path.write_text(json.dumps(track, separators=(',', ':')))
print('COMPOSED', scene, frames, 'beats', BEATS)
