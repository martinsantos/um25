#!/usr/bin/env python3
"""Structural diagnostics for the blocked UM Sans 2 Display experiment.

A structural pass never promotes this drawing. Raster and human review remain
mandatory because OpenType validity cannot judge glyph quality.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = ROOT / "public" / "fonts" / "um-sans-2-display"
FAMILY = "UM Sans 2 Display"
STYLES = (
    ("SemiBold", 600),
    ("Bold", 700),
    ("ExtraBold", 800),
    ("Black", 900),
)
FORMATS = ("ttf", "otf", "woff2")
SPANISH = "ÁÉÍÓÚÜÑáéíóúüñ¿¡"
PROOF = "Fibra certificada, operación continua. 24/7 · 99,98%"


def name_value(font: TTFont, name_id: int) -> str:
    for record in font["name"].names:
        if record.nameID != name_id:
            continue
        try:
            return record.toUnicode()
        except UnicodeDecodeError:
            continue
    return ""


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def outline_bounds(font: TTFont, glyph_name: str):
    glyph_set = font.getGlyphSet()
    pen = BoundsPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return pen.bounds


def audit_font(path: Path, weight: int) -> dict[str, object]:
    font = TTFont(path, lazy=False)
    cmap = font.getBestCmap() or {}
    glyph_order = font.getGlyphOrder()
    bounds_ok = True
    nonempty_ok = True
    advances_ok = True
    for character in PROOF:
        if character.isspace() or ord(character) not in cmap:
            continue
        glyph_name = cmap[ord(character)]
        bounds = outline_bounds(font, glyph_name)
        nonempty_ok = nonempty_ok and bounds is not None
        advances_ok = advances_ok and font["hmtx"].metrics[glyph_name][0] > 0
        if bounds is not None:
            x_min, y_min, x_max, y_max = bounds
            bounds_ok = bounds_ok and -350 <= x_min <= 1100 and -350 <= y_min <= 1100 and -350 <= x_max <= 1300 and -350 <= y_max <= 1200

    checks: dict[str, bool] = {
        "family": name_value(font, 1) == FAMILY,
        "upm": font["head"].unitsPerEm == 1000,
        "weight": font["OS/2"].usWeightClass == weight,
        "roman": not bool(font["head"].macStyle & 0b10),
        "characters": len(cmap) == 320,
        "glyphs": len(glyph_order) == (328 if "glyf" in font else 327),
        "spanish": all(ord(character) in cmap for character in SPANISH),
        "proof": all(character.isspace() or ord(character) in cmap for character in PROOF),
        "nonempty": nonempty_ok,
        "advances": advances_ok,
        "bounds": bounds_ok,
        "verticalMetrics": (
            font["hhea"].ascent == 820
            and font["hhea"].descent == -220
            and font["hhea"].lineGap == 0
        ),
    }
    if "glyf" in font:
        glyf = font["glyf"]
        checks["hinting"] = (
            all(table in font for table in ("cvt ", "fpgm", "prep"))
            and all(
                hasattr(glyf[cmap[ord(character)]], "program")
                and bool(glyf[cmap[ord(character)]].program.getBytecode())
                for character in "Aaefilnoprstuy019"
            )
        )
    font.close()
    return {
        "path": str(path.relative_to(ROOT)),
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "checks": checks,
    }


def main() -> int:
    failures: list[str] = []
    files: list[dict[str, object]] = []
    for style, weight in STYLES:
        for extension in FORMATS:
            path = FONT_DIR / f"UMSans2Display-{style}.{extension}"
            if not path.exists():
                failures.append(f"missing:{path.name}")
                continue
            result = audit_font(path, weight)
            files.append(result)
            for check, passed in result["checks"].items():
                if not passed:
                    failures.append(f"{path.name}:{check}")

    required = (
        "build-report.json",
        "PROVENANCE.md",
        "README.md",
        "CHECKSUMS.sha256",
        "specimen.html",
    )
    for name in required:
        if not (FONT_DIR / name).exists():
            failures.append(f"missing:{name}")

    unexpected = sorted(
        path.name
        for path in FONT_DIR.iterdir()
        if path.suffix.lower() in {".ttf", ".otf", ".woff2"}
        and ("Italic" in path.name or "Variable" in path.name)
    ) if FONT_DIR.exists() else []
    failures.extend(f"prohibited-binary:{name}" for name in unexpected)

    report_path = FONT_DIR / "build-report.json"
    build_report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}
    if build_report.get("family") != FAMILY:
        failures.append("build-report:family")
    if build_report.get("weights") != [600, 700, 800, 900]:
        failures.append("build-report:weights")
    if build_report.get("variable") is not False:
        failures.append("build-report:variable")
    if build_report.get("upstreamOutlineDependencies") != []:
        failures.append("build-report:upstream-outlines")

    report = {
        "family": FAMILY,
        "version": "2.0 Display Alpha",
        "status": "pass" if not failures else "fail",
        "checkedFiles": len(files),
        "styles": len(STYLES),
        "formats": list(FORMATS),
        "prohibitedBinaries": unexpected,
        "files": files,
        "failures": failures,
    }
    (FONT_DIR / "qa-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": report["status"], "checkedFiles": len(files), "failures": failures}, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
