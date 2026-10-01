#!/usr/bin/env python3
"""Genera el prompt maestro para ChatGPT (un hilo, 22 imágenes) desde image-briefs-sitio.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
data = json.loads((ROOT / 'work/cine/image-briefs-sitio.json').read_text())
style, briefs = data['style'], data['briefs']

lines = [
    f"Vas a generar {len(briefs)} imágenes para el sitio web de ULTIMA MILLA, empresa argentina de servicios IT (redes, seguridad electrónica, telecomunicaciones, software, soporte 24/7, detección de incendios y energía IT) con sede en Mendoza, al pie de los Andes.",
    "",
    "CÓMO TRABAJAMOS EN ESTE HILO",
    "1. Generá UNA sola imagen por respuesta, siguiendo el orden de la lista.",
    "2. Encabezá cada respuesta sólo con el número y el nombre de archivo, por ejemplo: «01 · sector-aeropuertos.png». Sin explicaciones.",
    "3. Después de cada imagen esperá mi respuesta:",
    "   • «siguiente» → pasá a la próxima de la lista.",
    "   • «otra» → rehacé la misma imagen con el próximo encuadre de sus «Opciones».",
    "   • cualquier otro comentario → corregí esa misma imagen según lo que te pida.",
    "4. Todas las imágenes: formato horizontal 3:2 (1536 × 1024), fotorrealistas.",
    "",
    "DIRECCIÓN DE ARTE GENERAL (vale para las 22; la «Estética» de cada ficha la precisa y manda sobre esta)",
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
        lines += ["", f"— {group.upper()} —"]
    lines += ["", f"{i:02d} · {b['id']}.png — {b['title']}", f"Escena: {b['prompt']}", f"Estética: {b['look']}",
              "Opciones (la primera es la inicial; «otra» pasa a la siguiente):"]
    lines += [f"  {k}. {v}" for k, v in enumerate(b['variants'], 1)]
lines += ["", "Empezá ahora con la 01."]
text = "\n".join(lines)
out = ROOT / 'work/cine/prompts/prompt-maestro-chatgpt.txt'
out.write_text(text)
print(text)
