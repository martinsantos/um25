#!/usr/bin/env python3
"""
Generate Image Prompts for Antecedentes using Ollama

Reads antecedentes-need-images.json and generates professional image
prompts using the active Ollama model for each antecedente.

Usage: python scripts/generate-image-prompts.py
Output: scripts/data/image-prompts.json

Requires: Ollama running locally (any model)
"""

import json
import os
import subprocess
import sys
import requests
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
INPUT_FILE = DATA_DIR / "antecedentes-need-images.json"
OUTPUT_FILE = DATA_DIR / "image-prompts.json"

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

SYSTEM_PROMPT = """You are an expert at writing image generation prompts for professional corporate photography.
You will receive the title and description of a corporate IT/telecom project (antecedente) from Ultima Milla,
an Argentine company specializing in telecommunications, network infrastructure, electronic security,
and IT services for mining, airports, wineries, healthcare, government, and industry sectors.

Generate a single concise image prompt (max 150 words) that describes a professional, realistic photograph
related to the project. The image should look like a high-quality corporate portfolio photo.

Rules:
- Describe a realistic scene, not abstract art
- Focus on technology, infrastructure, equipment, or professional settings
- Include lighting and composition details
- NO text, watermarks, logos, or people's faces
- NO cartoon, anime, or illustration styles
- The result should be suitable for a corporate website portfolio card (landscape orientation)
- Output ONLY the prompt text, nothing else"""


def get_active_model():
    """Auto-detect the active/available Ollama model."""
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        resp.raise_for_status()
        models = resp.json().get("models", [])
        if not models:
            print("ERROR: No models found in Ollama. Run 'ollama pull <model>' first.")
            sys.exit(1)
        model_name = models[0]["name"]
        print(f"Using Ollama model: {model_name}")
        return model_name
    except requests.ConnectionError:
        print(f"ERROR: Cannot connect to Ollama at {OLLAMA_URL}")
        print("Make sure Ollama is running: 'ollama serve'")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR detecting Ollama model: {e}")
        sys.exit(1)


def generate_prompt(model, titulo, descripcion):
    """Generate an image prompt using Ollama."""
    user_message = f"Title: {titulo}"
    if descripcion and len(descripcion.strip()) > 10:
        # Truncate description to avoid overwhelming the model
        desc = descripcion.strip()[:500]
        user_message += f"\nDescription: {desc}"

    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "system": SYSTEM_PROMPT,
                "prompt": user_message,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 200,
                },
            },
            timeout=120,
        )
        resp.raise_for_status()
        result = resp.json()
        return result.get("response", "").strip()
    except Exception as e:
        print(f"  WARNING: Ollama error for '{titulo[:50]}': {e}")
        # Fallback: generate a generic prompt from the title
        return generate_fallback_prompt(titulo)


def generate_fallback_prompt(titulo):
    """Generate a basic prompt from the title when Ollama fails."""
    titulo_lower = titulo.lower()

    # Detect sector from title keywords
    if any(kw in titulo_lower for kw in ["cctv", "cámara", "vigilancia", "seguridad"]):
        scene = "modern CCTV security camera system installed on a corporate building, professional surveillance equipment"
    elif any(kw in titulo_lower for kw in ["red", "fibra", "cable", "networking"]):
        scene = "professional network infrastructure with fiber optic cables and server rack equipment"
    elif any(kw in titulo_lower for kw in ["telecom", "antena", "radio", "comunicacion"]):
        scene = "telecommunications tower with antennas against a clear sky, professional telecom infrastructure"
    elif any(kw in titulo_lower for kw in ["incendio", "alarma", "detección"]):
        scene = "fire detection and alarm system panel in a modern building, professional safety equipment"
    elif any(kw in titulo_lower for kw in ["software", "sistema", "aplicacion"]):
        scene = "modern software development workspace with multiple monitors showing code and dashboards"
    elif any(kw in titulo_lower for kw in ["miner", "cantera"]):
        scene = "mining site with modern IT infrastructure equipment, industrial technology installation"
    elif any(kw in titulo_lower for kw in ["aeropuerto", "aviación"]):
        scene = "airport terminal with modern security and communication systems, aviation technology"
    elif any(kw in titulo_lower for kw in ["bodega", "vino", "viñedo"]):
        scene = "winery with modern climate control and IT monitoring systems, vineyard technology"
    elif any(kw in titulo_lower for kw in ["hospital", "salud", "clínica"]):
        scene = "modern hospital with healthcare IT infrastructure, medical technology systems"
    elif any(kw in titulo_lower for kw in ["gobierno", "municipal", "público"]):
        scene = "government building with modern IT infrastructure and security systems"
    elif any(kw in titulo_lower for kw in ["eléctric", "energia", "ups"]):
        scene = "professional electrical installation with UPS systems and power distribution panels"
    else:
        scene = "modern corporate IT infrastructure installation, professional technology equipment"

    return f"Professional corporate photography of {scene}, clean composition, natural lighting, high resolution, sharp focus, corporate portfolio style"


def main():
    print("=== Generate Image Prompts for Antecedentes ===\n")

    # Load input
    if not INPUT_FILE.exists():
        print(f"ERROR: Input file not found: {INPUT_FILE}")
        print("Run 'node scripts/find-duplicate-antecedentes.mjs' first")
        sys.exit(1)

    with open(INPUT_FILE, "r") as f:
        antecedentes = json.load(f)

    print(f"Loaded {len(antecedentes)} antecedentes needing new images\n")

    if not antecedentes:
        print("No antecedentes need new images. Done.")
        return

    # Detect Ollama model
    model = get_active_model()

    # Generate prompts
    results = []
    for i, ant in enumerate(antecedentes):
        titulo = ant.get("titulo", "IT Infrastructure Project")
        descripcion = ant.get("descripcion", "")
        ant_id = ant.get("id", "unknown")

        print(f"[{i+1}/{len(antecedentes)}] ID {ant_id}: {titulo[:60]}...")

        prompt = generate_prompt(model, titulo, descripcion)

        results.append({
            "id": ant_id,
            "titulo": titulo,
            "prompt": prompt,
            "negative_prompt": "cartoon, anime, text, watermark, low quality, blurry, deformed, disfigured, bad anatomy, extra limbs, signature, logo, banner, oversaturated, underexposed, illustration, drawing, painting, sketch",
        })

    # Save output
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nGenerated {len(results)} prompts")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
