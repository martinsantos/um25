#!/usr/bin/env python3
"""Optical integrity gate for the definitive UM Sans build.

The gate does not attempt to score taste. It enforces the stronger invariant
needed for a stable corporate font: every published outline must be the
verified upstream outline, every published character must shape without
notdef/fallback, and every release sample must be reproducible.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = ROOT / "public" / "fonts" / "um-sans"
SOURCE_DIR = ROOT / ".font-sources" / "um-sans"
REPORT_PATH = FONT_DIR / "optical-audit.json"
REQUIRED_TEXT = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "ÁÉÍÓÚÜÑáéíóúüñ¿¡0123456789"
    ".,:;!?@#%&/()[]{}+-=_€$£¥°±×©®™«»“”‘’–—"
)
PROOF_TEXT = (
    "Fibra certificada, operación continua. ¿Qué operación necesita continuidad? "
    "ÁÉÍÓÚÜÑ áéíóúüñ · 24/7 · $ 1.234.567,89"
)


def serial(value):
    if isinstance(value, (bytes, bytearray)):
        return list(value)
    if value.__class__.__name__ == "GlyphCoordinates":
        return [serial(item) for item in value]
    if isinstance(value, (list, tuple)):
        return [serial(item) for item in value]
    if isinstance(value, float):
        return round(value, 8)
    return value


def glyph_signature(font: TTFont, glyph_name: str) -> str:
    glyph = font["glyf"][glyph_name]
    glyph.expand(font["glyf"])
    if glyph.isComposite():
        payload = {
            "kind": "composite",
            "components": [
                {
                    "name": component.glyphName,
                    "x": getattr(component, "x", 0),
                    "y": getattr(component, "y", 0),
                    "transform": serial(getattr(component, "transform", (1, 0, 0, 1, 0, 0))),
                }
                for component in glyph.components
            ],
        }
    else:
        payload = {
            "kind": "contour",
            "ends": serial(getattr(glyph, "endPtsOfContours", None) or []),
            "flags": serial(getattr(glyph, "flags", None) or []),
            "coordinates": serial(getattr(glyph, "coordinates", None) or []),
        }
    return hashlib.sha256(json.dumps(payload, separators=(",", ":")).encode()).hexdigest()


def assert_cmap(source: TTFont, built: TTFont) -> list[str]:
    failures: list[str] = []
    source_cmap = source.getBestCmap()
    built_cmap = built.getBestCmap()
    required_missing = [char for char in REQUIRED_TEXT if ord(char) not in built_cmap]
    if required_missing:
        failures.append(f"missing-required:{''.join(required_missing)}")
    for codepoint, glyph_name in built_cmap.items():
        category = unicodedata.category(chr(codepoint))
        if category in {"Co", "Cs"}:
            failures.append(f"inadmissible-unicode:{codepoint:04X}")
        if source_cmap.get(codepoint) != glyph_name:
            failures.append(f"cmap-drift:{codepoint:04X}:{source_cmap.get(codepoint)}!={glyph_name}")
    return failures


def compare_outlines(source: TTFont, built: TTFont) -> list[str]:
    failures: list[str] = []
    source_glyphs = set(source.getGlyphOrder())
    built_glyphs = set(built.getGlyphOrder())
    for glyph_name in sorted(built_glyphs & source_glyphs):
        if glyph_signature(source, glyph_name) != glyph_signature(built, glyph_name):
            failures.append(f"outline-drift:{glyph_name}")
    return failures


def shape(font_path: Path) -> str:
    executable = shutil.which("hb-shape") or "/opt/homebrew/bin/hb-shape"
    result = subprocess.run(
        [executable, str(font_path), "--variations=wght=400,opsz=14"],
        input=PROOF_TEXT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return f"hb-shape-error:{result.stderr.strip()}"
    if ".notdef" in result.stdout or "gid0" in result.stdout:
        return "fallback-or-notdef-detected"
    return "pass"


def main() -> int:
    source_paths = {
        "roman": SOURCE_DIR / "Inter[opsz,wght].ttf",
        "italic": SOURCE_DIR / "Inter-Italic[opsz,wght].ttf",
    }
    built_paths = {
        "roman": FONT_DIR / "UMSans-Variable.ttf",
        "italic": FONT_DIR / "UMSans-VariableItalic.ttf",
    }
    failures: list[str] = []
    details = {}
    for slant in ("roman", "italic"):
        source = TTFont(source_paths[slant], recalcBBoxes=False, recalcTimestamp=False)
        built = TTFont(built_paths[slant], recalcBBoxes=False, recalcTimestamp=False)
        cmap_failures = assert_cmap(source, built)
        outline_failures = compare_outlines(source, built)
        shape_result = shape(built_paths[slant])
        failures.extend(f"{slant}:{failure}" for failure in cmap_failures + outline_failures)
        if shape_result != "pass":
            failures.append(f"{slant}:{shape_result}")
        details[slant] = {
            "source": str(source_paths[slant].relative_to(ROOT)),
            "built": str(built_paths[slant].relative_to(ROOT)),
            "sourceCharacters": len(source.getBestCmap()),
            "builtCharacters": len(built.getBestCmap()),
            "outlineComparisons": len(set(built.getGlyphOrder()) & set(source.getGlyphOrder())),
            "shape": shape_result,
        }
    report = {
        "status": "pass" if not failures else "fail",
        "policy": "upstream-contour-equivalent",
        "proofText": PROOF_TEXT,
        "failures": failures,
        "details": details,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
