#!/usr/bin/env python3
"""Prompt de lote para ChatGPT: 4 variantes por ficha y un ZIP por grupo (desde image-briefs-sitio.json)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
data = json.loads((ROOT / 'work/cine/image-briefs-sitio.json').read_text())
style, briefs = data['style'], data['briefs']
groups = []
for b in briefs:
    if b['group'] not in groups:
        groups.append(b['group'])
zipname = {g: f"umsa-{g.split()[0].lower()}.zip" for g in groups}

L = [
    f"Vas a producir un lote de imágenes para el sitio web de ULTIMA MILLA, empresa argentina de servicios IT con sede en Mendoza, al pie de los Andes. Son {len(briefs)} fichas y quiero 4 opciones de cada una ({len(briefs) * 4} imágenes en total).",
    "",
    "CÓMO TRABAJAMOS",
    "1. Avanzá ficha por ficha, en el orden de la lista.",
    "2. Por cada ficha generá 4 imágenes SEPARADAS (no una grilla ni un collage), una por cada encuadre indicado en «Opciones». Las 4 comparten la escena y la estética de la ficha; lo único que cambia es el encuadre.",
    "3. Encabezá cada ficha con su número y nombre, y nombrá las opciones así: <nombre>-v1.png, <nombre>-v2.png, <nombre>-v3.png, <nombre>-v4.png. Sin explicaciones.",
    "4. Al terminar cada ficha seguí con la siguiente sin esperar confirmación. Si te freno o llegás a un límite de uso, al retomar escribo «seguí desde la NN».",
    f"5. Al terminar cada grupo ({', '.join(groups)}) usá Python para armar un ZIP con las imágenes de ese grupo, con los nombres de arriba, y dame el link de descarga:",
] + [f"   • {g} → {zipname[g]}" for g in groups] + [
    "   Al final, un ZIP con todo: umsa-imagenes-lote.zip.",
    "6. Si no podés acceder desde Python a las imágenes que generaste, avisámelo sin inventar el archivo y seguí con las imágenes; yo las descargo a mano.",
    "7. Formato de todas: horizontal 3:2 (1536 × 1024), fotorrealistas.",
    "",
    "DIRECCIÓN DE ARTE GENERAL (vale para todas; la «Estética» de cada ficha la precisa y manda sobre esta)",
    style['always'],
    "",
    "PROHIBIDO EN TODAS",
    style['never'] + ".",
    "Si una imagen muestra pantallas, que tengan paneles abstractos sin texto legible. Las personas, siempre de espaldas, de perfil o sin rostro visible.",
    "",
    "LISTA",
]
group = None
for i, b in enumerate(briefs, 1):
    if b['group'] != group:
        group = b['group']
        L += ["", f"— {group.upper()} —"]
    L += ["", f"{i:02d} · {b['id']} — {b['title']}", f"Escena: {b['prompt']}", f"Estética: {b['look']}", "Opciones:"]
    L += [f"  {b['id']}-v{k} · {v}" for k, v in enumerate(b['variants'], 1)]
L += ["", "Empezá ahora con la 01."]
out = ROOT / 'work/cine/prompts/prompt-lote-4-opciones.txt'
out.write_text("\n".join(L))
print(out)
