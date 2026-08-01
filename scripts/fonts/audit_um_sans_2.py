#!/usr/bin/env python3
"""Structural release gate for the UM Sans 2 static evaluation family."""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys

from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = Path(
    os.environ.get("UM_SANS_2_FONT_DIR", ROOT / "public" / "fonts" / "um-sans-2")
).expanduser().resolve()
REQUIRE_ARCHIVE = os.environ.get("UM_SANS_2_REQUIRE_ARCHIVE", "1") == "1"

STYLES = [
    ("Light", 300, False),
    ("LightItalic", 300, True),
    ("Regular", 400, False),
    ("Italic", 400, True),
    ("Medium", 500, False),
    ("MediumItalic", 500, True),
    ("SemiBold", 600, False),
    ("SemiBoldItalic", 600, True),
    ("Bold", 700, False),
    ("BoldItalic", 700, True),
    ("ExtraBold", 800, False),
    ("ExtraBoldItalic", 800, True),
    ("Black", 900, False),
    ("BlackItalic", 900, True),
]


def name_value(font: TTFont, name_id: int) -> str:
    for record in font["name"].names:
        if record.nameID == name_id:
            try:
                return record.toUnicode()
            except UnicodeDecodeError:
                continue
    return ""


def audit_font(path: Path, expected_weight: int, expected_italic: bool) -> dict:
    font = TTFont(path, lazy=False)
    cmap = font.getBestCmap() or {}
    glyph_order = font.getGlyphOrder()
    checks = {
        "family": name_value(font, 1) == "UM Sans 2",
        "upm": font["head"].unitsPerEm == 1000,
        "weight": font["OS/2"].usWeightClass == expected_weight,
        "italic": bool(font["head"].macStyle & 0b10) == expected_italic,
        "characters": len(cmap) == 320,
        "glyphs": len(glyph_order) == (328 if "glyf" in font else 327),
        "spanish": all(codepoint in cmap for codepoint in map(ord, "ÁÉÍÓÚÜÑáéíóúüñ¿¡")),
        "notdef": ".notdef" in glyph_order,
        "metrics": all(
            font["hmtx"].metrics[cmap[ord(character)]][0] > 0
            for character in "AaÑñ019¿¡"
        ),
    }
    if "glyf" in font:
        glyf = font["glyf"]
        representative = "Aabdefghilmnoprstuy019"
        checks["hinting"] = (
            all(table in font for table in ("cvt ", "fpgm", "prep"))
            and all(
                hasattr(glyf[cmap[ord(character)]], "program")
                and bool(glyf[cmap[ord(character)]].program.getBytecode())
                for character in representative
            )
        )
        checks["gpos"] = (
            "GPOS" in font
            and bool(font["GPOS"].table.LookupList)
            and len(font["GPOS"].table.LookupList.Lookup) > 0
        )
        # The editorial manual core uses a two-contour double-storey `a`.
        # Lower-weight italics still inherit the builder's tested italic `a`,
        # which has an additional counter contour. Both are intentional and
        # structurally valid; the rejected procedural prototype was the old
        # source of the previous one-size-fits-all expectation.
        expected_topology = {
            "a": {2, 3} if expected_italic and expected_weight < 600 else {2},
            "b": {2},
            "n": {1},
            "p": {2},
            "t": {1},
        }
        checks["topology"] = all(
            glyf[cmap[ord(character)]].numberOfContours in expected
            for character, expected in expected_topology.items()
        )
    font.close()
    return {"path": str(path.relative_to(ROOT)), "checks": checks}


def main() -> int:
    failures: list[str] = []
    files: list[dict] = []

    for style, weight, italic in STYLES:
        for extension in ("ttf", "otf", "woff2"):
            path = FONT_DIR / f"UMSans2-{style}.{extension}"
            if not path.exists():
                failures.append(f"missing:{path.name}")
                continue
            result = audit_font(path, weight, italic)
            files.append(result)
            for check, passed in result["checks"].items():
                if not passed:
                    failures.append(f"{path.name}:{check}")

    variable_binaries = sorted(
        path.name
        for path in FONT_DIR.glob("UMSans2-Variable*")
        if path.suffix.lower() in {".ttf", ".otf", ".woff2"}
    )
    if variable_binaries:
        failures.extend(f"blocked-variable-present:{name}" for name in variable_binaries)

    build_report_path = FONT_DIR / "build-report.json"
    provenance_path = FONT_DIR / "provenance.json"
    specimen_path = FONT_DIR / "specimen.html"
    required_files = [
        build_report_path,
        provenance_path,
        specimen_path,
        FONT_DIR / "CHECKSUMS.sha256",
    ]
    if REQUIRE_ARCHIVE:
        required_files.append(FONT_DIR / "UMSans2-2.0-Original-Beta.zip")
    for required in required_files:
        if not required.exists():
            failures.append(f"missing:{required.name}")

    build_report = json.loads(build_report_path.read_text()) if build_report_path.exists() else {}
    provenance = json.loads(provenance_path.read_text()) if provenance_path.exists() else {}
    if len(build_report.get("statics", [])) != 14:
        failures.append("build-report:static-count")
    if build_report.get("variables") != []:
        failures.append("build-report:variables-must-be-empty")
    if not str(build_report.get("variableStatus", "")).startswith("blocked:"):
        failures.append("build-report:variable-status")

    report = {
        "family": "UM Sans 2",
        "version": build_report.get("version") or provenance.get("version", "2.0 Original Beta"),
        "status": "pass" if not failures else "fail",
        "checkedFiles": len(files),
        "staticStyles": len(STYLES),
        "variableBinaries": variable_binaries,
        "files": files,
        "failures": failures,
    }
    (FONT_DIR / "qa-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    )

    print(json.dumps({
        "status": report["status"],
        "checkedFiles": report["checkedFiles"],
        "failures": failures,
    }, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
