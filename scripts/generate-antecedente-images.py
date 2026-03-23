#!/usr/bin/env python3
"""
Generate Antecedente Images using Free External Services

Reads image-prompts.json and generates images using free APIs.
Supports multiple modes:
  --mode pollinations  (default) - Uses Pollinations.ai free API
  --mode manual        - Exports prompts as ready-to-use text file
  --mode claude        - Uses Anthropic API (requires ANTHROPIC_API_KEY)

Usage:
  python scripts/generate-antecedente-images.py
  python scripts/generate-antecedente-images.py --mode manual
  python scripts/generate-antecedente-images.py --mode claude

Output: serviciosimg/nuevas/*.png
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
INPUT_FILE = DATA_DIR / "image-prompts.json"
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "serviciosimg" / "nuevas"
LOG_FILE = DATA_DIR / "generated-images-log.json"


def sanitize_filename(title):
    """Create a safe filename from a title."""
    s = title.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '_', s)
    return s[:80]


def generate_pollinations(prompt, output_path, width=768, height=768):
    """Generate image using Pollinations.ai free API (no key needed)."""
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"

    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; UltimaMilla/1.0)'
        })
        with urllib.request.urlopen(req, timeout=120) as response:
            data = response.read()
            if len(data) < 1000:
                return False, "Response too small, likely an error"
            with open(output_path, 'wb') as f:
                f.write(data)
            return True, f"OK ({len(data)} bytes)"
    except Exception as e:
        return False, str(e)


def generate_claude(prompt, output_path):
    """Generate image using Anthropic Claude API."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return False, "ANTHROPIC_API_KEY not set"

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"Generate a professional corporate photography image for: {prompt}. The image should be realistic, high quality, suitable for a corporate IT/telecom portfolio website."
            }]
        )

        # Extract image from response if available
        for block in message.content:
            if hasattr(block, 'type') and block.type == 'image':
                import base64
                img_data = base64.b64decode(block.source.data)
                with open(output_path, 'wb') as f:
                    f.write(img_data)
                return True, f"OK ({len(img_data)} bytes)"

        return False, "No image in Claude response"
    except ImportError:
        return False, "anthropic package not installed (pip install anthropic)"
    except Exception as e:
        return False, str(e)


def generate_manual_prompts(prompts_data):
    """Export prompts as a text file for manual generation."""
    manual_file = DATA_DIR / "manual-prompts.txt"
    with open(manual_file, 'w') as f:
        f.write("=" * 80 + "\n")
        f.write("MANUAL IMAGE GENERATION PROMPTS\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"Total: {len(prompts_data)} images needed\n")
        f.write("=" * 80 + "\n\n")
        f.write("Use these prompts in free image generators:\n")
        f.write("  - Leonardo.ai (150 free credits/day)\n")
        f.write("  - Playground AI (free)\n")
        f.write("  - Bing Image Creator (free with Microsoft account)\n")
        f.write("  - Pollinations.ai (free, no account)\n")
        f.write("\nSettings: 768x768, Landscape, Photographic style\n")
        f.write("=" * 80 + "\n\n")

        for i, item in enumerate(prompts_data):
            filename = f"ultimamilla_{sanitize_filename(item['titulo'])}_{item['id']}.png"
            f.write(f"--- Image {i+1}/{len(prompts_data)} ---\n")
            f.write(f"Antecedente ID: {item['id']}\n")
            f.write(f"Title: {item['titulo']}\n")
            f.write(f"Save as: {filename}\n\n")
            f.write(f"PROMPT:\n{item['prompt']}\n\n")
            f.write(f"NEGATIVE PROMPT:\n{item['negative_prompt']}\n\n")
            f.write("-" * 80 + "\n\n")

    print(f"Manual prompts saved to: {manual_file}")
    print(f"Generate {len(prompts_data)} images manually and save them to: {OUTPUT_DIR}/")
    print(f"Use filename format: ultimamilla_<title>_<id>.png")


def main():
    parser = argparse.ArgumentParser(description="Generate antecedente images")
    parser.add_argument("--mode", choices=["pollinations", "manual", "claude"],
                        default="pollinations",
                        help="Generation mode (default: pollinations)")
    parser.add_argument("--start", type=int, default=0,
                        help="Start from this index (for resuming)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Max images to generate (0 = all)")
    parser.add_argument("--delay", type=float, default=3.0,
                        help="Delay between API calls in seconds")
    args = parser.parse_args()

    print(f"=== Generate Antecedente Images (mode: {args.mode}) ===\n")

    # Load prompts
    if not INPUT_FILE.exists():
        print(f"ERROR: {INPUT_FILE} not found")
        print("Run 'python scripts/generate-image-prompts.py' first")
        sys.exit(1)

    with open(INPUT_FILE, 'r') as f:
        prompts_data = json.load(f)

    print(f"Loaded {len(prompts_data)} prompts\n")

    if not prompts_data:
        print("No prompts to process.")
        return

    # Manual mode: just export
    if args.mode == "manual":
        generate_manual_prompts(prompts_data)
        return

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing log for resume support
    log = []
    if LOG_FILE.exists():
        with open(LOG_FILE, 'r') as f:
            log = json.load(f)
    existing_ids = {entry["id"] for entry in log if entry.get("success")}

    # Generate images
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ok_count = 0
    fail_count = 0
    skip_count = 0

    items = prompts_data[args.start:]
    if args.limit > 0:
        items = items[:args.limit]

    for i, item in enumerate(items):
        ant_id = item["id"]

        # Skip already generated
        if ant_id in existing_ids:
            print(f"[{i+1}/{len(items)}] ID {ant_id}: SKIP (already generated)")
            skip_count += 1
            continue

        titulo = item["titulo"]
        prompt = item["prompt"]
        filename = f"ultimamilla_{sanitize_filename(titulo)}_{timestamp}_id{ant_id}.png"
        output_path = OUTPUT_DIR / filename

        print(f"[{i+1}/{len(items)}] ID {ant_id}: {titulo[:50]}...")

        if args.mode == "pollinations":
            success, msg = generate_pollinations(prompt, output_path)
        elif args.mode == "claude":
            success, msg = generate_claude(prompt, output_path)
        else:
            success, msg = False, f"Unknown mode: {args.mode}"

        if success:
            ok_count += 1
            print(f"  OK: {filename} - {msg}")
        else:
            fail_count += 1
            print(f"  FAIL: {msg}")

        log.append({
            "id": ant_id,
            "titulo": titulo,
            "filename": filename if success else None,
            "prompt": prompt,
            "success": success,
            "message": msg,
            "mode": args.mode,
            "timestamp": datetime.now().isoformat(),
        })

        # Save log incrementally
        with open(LOG_FILE, 'w') as f:
            json.dump(log, f, indent=2, ensure_ascii=False)

        # Rate limiting
        if i < len(items) - 1:
            time.sleep(args.delay)

    print(f"\n=== Results ===")
    print(f"Generated: {ok_count}")
    print(f"Failed: {fail_count}")
    print(f"Skipped: {skip_count}")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Log: {LOG_FILE}")


if __name__ == "__main__":
    main()
