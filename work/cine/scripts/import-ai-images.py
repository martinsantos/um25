#!/usr/bin/env python3
"""Coloca en el alfa las imágenes generadas con GPT Image (ChatGPT o API).

Busca en work/cine/ai/entrantes/ (ChatGPT, guardadas con el nombre de la ficha, p. ej.
sector-bodegas.png) y en work/cine/ai/ (salida de openai-images.mjs). Para cada ficha de
work/cine/image-briefs-sitio.json recorta al formato del destino (el de la imagen que
reemplaza), guarda WebP y respalda la anterior en work/cine/ai/backup/<fecha>/.
Lotes con 4 opciones (<id>-v1.png … <id>-v4.png, también dentro de subcarpetas o de un ZIP
ya descomprimido): se importa la opción elegida con --elegir id=N,id=N. Sin elección, la
ficha queda pendiente (no se toma una al azar).
Uso: python3 work/cine/scripts/import-ai-images.py [--dry] [--elegir sector-bodegas=3,servicio-redes=1]
"""
import re
import json
import shutil
import sys
import time
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[3]
ALFA = (ROOT / '../umsa-sitio-alfa').resolve()
BRIEFS = json.loads((ROOT / 'work/cine/image-briefs-sitio.json').read_text())['briefs']
INBOX = [ROOT / 'work/cine/ai/entrantes', ROOT / 'work/cine/ai']
BACKUP = ROOT / 'work/cine/ai/backup' / time.strftime('%Y%m%d-%H%M%S')
dry = '--dry' in sys.argv
PICK = {}
if '--elegir' in sys.argv:
    for pair in sys.argv[sys.argv.index('--elegir') + 1].split(','):
        k, _, v = pair.partition('=')
        PICK[k.strip()] = int(v)
EXT = {'.png', '.jpg', '.jpeg', '.webp'}


PENDING = {}


def find(brief_id):
    """<id>.png directo; si hay opciones <id>-vN, sólo la elegida con --elegir."""
    for folder in INBOX:
        if not folder.exists():
            continue
        files = [p for p in folder.rglob('*') if p.suffix.lower() in EXT and 'backup' not in p.parts]
        exact = sorted((p for p in files if p.stem.lower() == brief_id), key=lambda p: p.stat().st_mtime, reverse=True)
        if exact:
            return exact[0]
        variants = {int(m.group(1)): p for p in files if (m := re.fullmatch(re.escape(brief_id) + r'-v(\d+)', p.stem.lower()))}
        if variants:
            if brief_id in PICK and PICK[brief_id] in variants:
                return variants[PICK[brief_id]]
            PENDING[brief_id] = sorted(variants)
    return None


done = 0
for brief in BRIEFS:
    src = find(brief['id'])
    if not src:
        continue
    img = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    for rel in brief['targets']:
        dst = ALFA / rel
        size = Image.open(dst).size if dst.exists() else (1672, 941)
        out = ImageOps.fit(img, size, Image.LANCZOS, centering=(0.5, 0.5))
        print(f'{brief["id"]:32s} {src.name} → {rel} {size[0]}×{size[1]}')
        if dry:
            continue
        if dst.exists():
            (BACKUP / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dst, BACKUP / rel)
        dst.parent.mkdir(parents=True, exist_ok=True)
        out.save(dst, 'WEBP', quality=84, method=6)
    done += 1
missing = [b['id'] for b in BRIEFS if not find(b['id']) and b['id'] not in PENDING]
if PENDING:
    print('Con opciones sin elegir:', ', '.join(f"{k} (v{'/v'.join(map(str, v))})" for k, v in PENDING.items()))
print(f'\n{done} de {len(BRIEFS)} fichas con imagen.' + (f' Respaldo: {BACKUP}' if done and not dry else ''))
if missing:
    print('Faltan:', ', '.join(missing))
