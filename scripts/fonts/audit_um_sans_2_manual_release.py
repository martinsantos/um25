#!/usr/bin/env python3
"""Hard release gate for the UM Sans 2 manual project.

This is deliberately stricter than the diagnostic compiler audit. A valid TTF
with a few attractive letters is not a usable typeface. The script records the
exact reasons that prevent a release and exits non-zero while any one remains.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys

from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
FONT_PATH = Path(
    os.environ.get(
        "UMSANS_RELEASE_FONT",
        ROOT / "type/um-sans-2/build/fontmake/UMSans2ManualAlpha12-DisplayBold.ttf",
    )
).resolve()
REPORT_PATH = Path(
    os.environ.get(
        "UMSANS_RELEASE_REPORT",
        ROOT / "type/um-sans-2/build/fontmake/release-gate.json",
    )
).resolve()


def relative_font_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)

# Commercial web minimum for this project. The full release will add symbols
# and language-specific extensions, but a Latin Extended-A family cannot ship
# until every character in this baseline maps to a real authored glyph.
REQUIRED_RANGES = {
    "basic_latin": range(0x20, 0x7F),
    "latin_1_supplement": range(0xA0, 0x100),
    "latin_extended_a": range(0x100, 0x180),
}


def glyph_contour_count(font: TTFont, glyph_name: str) -> int:
    if "glyf" not in font:
        return -1
    glyph = font["glyf"][glyph_name]
    if glyph.isComposite():
        return 0
    return len(glyph.endPtsOfContours or [])


def font_family_name(font: TTFont) -> str:
    for platform, encoding, language in ((3, 1, 0x0409), (3, 1, 0), (1, 0, 0)):
        name = font["name"].getName(1, platform, encoding, language)
        if name:
            return str(name)
    return "Unknown family"


def main() -> int:
    failures: list[str] = []
    if not FONT_PATH.exists():
        failures.append("missing_fontmake_review_binary")
        report = {"status": "BLOCKED", "failures": failures, "productionApproved": False}
        REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 1

    font = TTFont(FONT_PATH)
    cmap = font.getBestCmap() or {}
    coverage = {
        name: {
            "required": len(codepoints),
            "present": sum(codepoint in cmap for codepoint in codepoints),
            "missing": [f"U+{codepoint:04X}" for codepoint in codepoints if codepoint not in cmap],
        }
        for name, codepoints in REQUIRED_RANGES.items()
    }
    for name, result in coverage.items():
        if result["present"] != result["required"]:
            failures.append(f"incomplete_{name}:{result['present']}/{result['required']}")

    e_name = cmap.get(ord("e"))
    if not e_name:
        failures.append("missing_e")
    elif glyph_contour_count(font, e_name) != 1:
        failures.append(f"e_not_normalized:{glyph_contour_count(font, e_name)}_contours")

    if "GPOS" not in font:
        failures.append("missing_gpos_kerning")
    if not all(table in font for table in ("cvt ", "fpgm", "prep")):
        failures.append("missing_ttf_instruction_programs")
    if len(font.getGlyphOrder()) < 320:
        failures.append(f"insufficient_glyph_inventory:{len(font.getGlyphOrder())}/320")

    report = {
        "family": font_family_name(font),
        "status": "PASS" if not failures else "BLOCKED",
        "productionApproved": False,
        "font": relative_font_path(FONT_PATH),
        "glyphCount": len(font.getGlyphOrder()),
        "cmapCount": len(cmap),
        "coverage": coverage,
        "normalizedContours": {"e": glyph_contour_count(font, e_name) if e_name else None},
        "failures": failures,
        "nextRequiredWork": [
            "Draw and review the complete Latin Extended-A character set.",
            "Build weight masters and interpolate tested instances.",
            "Author spacing classes and GPOS kerning.",
            "Add hinting only after outlines and spacing are approved.",
            "Run FontBakery and visual proofs again before changing this gate.",
        ],
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if os.environ.get("UMSANS_RELEASE_VERBOSE") == "true":
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        summary = {
            "family": report["family"],
            "status": report["status"],
            "productionApproved": report["productionApproved"],
            "font": report["font"],
            "glyphCount": report["glyphCount"],
            "coverage": {
                name: {
                    "present": result["present"],
                    "required": result["required"],
                    "missingCount": len(result["missing"]),
                }
                for name, result in coverage.items()
            },
            "failures": report["failures"],
            "detailReport": relative_font_path(REPORT_PATH),
        }
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
