---
name: IMAGENANTECEDENTEUM26
description: >
  Generates unique professional images for Ultima Milla antecedentes
  (case studies) using AI image generation pipelines. Use this skill
  when the user wants to generate, regenerate, or manage antecedente
  images for the ultimamilla.com.ar website. Triggered by phrases like
  "generate antecedente images", "fix duplicate images", "create missing
  images for antecedentes", "generar imagenes de antecedentes".
version: "1.0"
---

# IMAGENANTECEDENTEUM26 - Generador de Imágenes para Antecedentes

Generate unique professional images for Ultima Milla antecedentes using
Ollama for prompt engineering and free external services for image generation.

## Pipeline Steps

Execute each step sequentially. Each step has resume support (skips already-processed items).

### Step 1: Identify duplicates

```bash
node scripts/find-duplicate-antecedentes.mjs
```

Output: `scripts/data/antecedentes-need-images.json`

Queries Directus for all antecedentes, cross-references with `directus_files.filename_download`
to find antecedentes sharing the same visual image. Keeps one antecedente per group, marks
the rest as needing new images.

### Step 2: Generate prompts with Ollama

```bash
python scripts/generate-image-prompts.py
```

Output: `scripts/data/image-prompts.json`

Auto-detects the active Ollama model (`ollama list`) and generates professional
image generation prompts based on each antecedente's title and description.
Falls back to keyword-based prompt generation if Ollama is unavailable.

### Step 3: Generate images

```bash
# Automatic (Pollinations.ai - free, no API key)
python scripts/generate-antecedente-images.py --mode pollinations

# Manual mode (exports prompts for web-based generators)
python scripts/generate-antecedente-images.py --mode manual

# Claude API (requires ANTHROPIC_API_KEY)
python scripts/generate-antecedente-images.py --mode claude
```

Output: `serviciosimg/nuevas/*.png` + `scripts/data/generated-images-log.json`

Options:
- `--start N`: Resume from index N
- `--limit N`: Generate max N images
- `--delay N`: Seconds between API calls (default: 3)

### Step 4: Upload and assign to Directus

```bash
node scripts/upload-and-assign-images.mjs
```

Output: `scripts/data/upload-results.json`

Uploads each generated image to Directus via `POST /files`, then updates the
antecedente record with the new image UUID via `PATCH /items/Antecedentes/{id}`.

After upload, copy files to production and fix permissions:
```bash
scp serviciosimg/nuevas/*.png ultimamilla:/root/fumbling-field/uploads/
ssh ultimamilla "chown -R 1000:1000 /root/fumbling-field/uploads/"
```

### Step 5: Verify

```bash
node scripts/verify-unique-images.mjs
```

Output: `scripts/data/verification-report.json`

Checks:
- 518/518 unique UUIDs (no UUID shared by multiple antecedentes)
- No `filename_download` duplicates shared between antecedentes
- HTTP spot check: sample of 20 images returns HTTP 200
- Reports overall uniqueness percentage

## Style Guidelines

- **Aesthetic**: Professional corporate IT/telecom photography
- **Brand palette**: um-primary=#0ea5e9, um-dark=#111827, um-accent=#dc2626
- **Style**: Realistic photography, clean composition, natural lighting
- **Resolution**: 768x768 minimum (displayed at h-48/192px height with object-cover)
- **Forbidden**: Cartoons, anime, text, watermarks, logos, illustrations, people's faces

### Sector-Specific Visual Themes

| Sector | Visual Theme |
|--------|-------------|
| Telecomunicaciones | Antenna towers, fiber optic cables, communication equipment |
| Seguridad Electrónica | CCTV cameras, surveillance systems, security panels |
| Redes | Server racks, network switches, structured cabling |
| Software | Monitors with dashboards, modern workspaces |
| Minería | Mining sites with IT equipment, industrial tech |
| Aeropuertos | Airport terminals with security/communication systems |
| Bodegas | Wineries with climate control and monitoring |
| Salud | Hospital IT infrastructure, medical technology |
| Gobierno | Government buildings with modern IT systems |
| Incendios | Fire detection panels, alarm systems |
| Eléctricos | UPS systems, power distribution panels |

## Configuration

| Setting | Value |
|---------|-------|
| Directus URL | `http://23.105.176.45:8055` (production) |
| API Token | `PUBLIC_DIRECTUS_TOKEN` env var |
| SSH | `ssh ultimamilla` |
| Uploads dir | `/root/fumbling-field/uploads/` |
| Container UID | 1000 (node user inside Directus container) |
| Ollama URL | `http://localhost:11434` |

## File Structure

```
scripts/
├── find-duplicate-antecedentes.mjs    # Step 1: Identify duplicates
├── generate-image-prompts.py          # Step 2: Generate prompts (Ollama)
├── generate-antecedente-images.py     # Step 3: Generate images
├── upload-and-assign-images.mjs       # Step 4: Upload to Directus
├── verify-unique-images.mjs           # Step 5: Verify uniqueness
└── data/
    ├── antecedentes-need-images.json  # Step 1 output
    ├── duplicate-report.json          # Step 1 report
    ├── image-prompts.json             # Step 2 output
    ├── generated-images-log.json      # Step 3 log
    ├── manual-prompts.txt             # Step 3 manual mode output
    ├── upload-results.json            # Step 4 results
    └── verification-report.json       # Step 5 report
```
