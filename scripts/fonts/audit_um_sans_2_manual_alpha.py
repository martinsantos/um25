#!/usr/bin/env python3
"""Validate the quarantined UM Sans 2 manual control-set proof."""

from __future__ import annotations

import json
from pathlib import Path

from defcon import Font as UFOFont
from fontTools.designspaceLib import DesignSpaceDocument
from fontTools.pens.areaPen import AreaPen
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "type" / "um-sans-2" / "sources" / "UMSans2Display-Bold.ufo"
DESIGNSPACE = ROOT / "type" / "um-sans-2" / "UMSans2.designspace"
PORTABLE_SPECIMEN = ROOT / "type" / "um-sans-2" / "proofs" / "specimen.html"
TTF = ROOT / "type" / "um-sans-2" / "build" / "UMSans2ManualAlpha-DisplayBold.ttf"
BUILD_WOFF2 = ROOT / "type" / "um-sans-2" / "build" / "UMSans2ManualAlpha-DisplayBold.woff2"
WOFF2 = ROOT / "public" / "fonts" / "um-sans-2-manual-alpha" / "UMSans2ManualAlpha-DisplayBold.woff2"
ROUTE = ROOT / "src" / "pages" / "estilo" / "um-sans-2-manual.astro"
REPORT = ROOT / "type" / "um-sans-2" / "build" / "audit-report.json"

REQUIRED = {
    ".notdef", "space", "H", "F", "O", "a", "b", "c", "d", "e", "f",
    "i", "l", "n", "o", "p", "r", "s", "t", "u", "period", "comma",
    "acutecomb", "oacute",
}

# Counter-bearing glyphs keep outer + counter; joined constructions collapse
# to one contour after the editor-style overlap cleanup.
EXPECTED_SOURCE_CONTOURS = {
    "H": 1,
    "F": 1,
    "O": 2,
    "o": 2,
    "a": 2,
    "b": 2,
    "d": 2,
    "p": 2,
    "t": 1,
    "f": 1,
}

COUNTER_GLYPHS = {"O", "o", "a", "b", "d", "p"}
MIN_SIDE_BEARINGS = {
    "a": (30, 30),
    "f": (40, 40),
    "o": (30, 30),
    "r": (40, 40),
    "s": (24, 24),
}


def check(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> None:
    failures: list[str] = []
    check(SOURCE.exists(), "Editable UFO source is missing", failures)
    check(DESIGNSPACE.exists(), "Designspace growth map is missing", failures)
    check(PORTABLE_SPECIMEN.exists(), "Portable HTML specimen is missing", failures)
    check(TTF.exists(), "Compiled TTF proof is missing", failures)
    check(BUILD_WOFF2.exists(), "Portable WOFF2 proof is missing", failures)
    check(WOFF2.exists(), "Compiled WOFF2 proof is missing", failures)
    check(ROUTE.exists(), "Noindex manual specimen route is missing", failures)

    glyph_order: list[str] = []
    family_names: list[str] = []
    source_contours: dict[str, int] = {}
    contour_directions: dict[str, list[float]] = {}
    source_sidebearings: dict[str, list[int]] = {}
    if SOURCE.exists():
        source_font = UFOFont(SOURCE)
        source_contours = {
            name: len(source_font[name])
            for name in EXPECTED_SOURCE_CONTOURS
            if name in source_font
        }
        check(
            source_contours == EXPECTED_SOURCE_CONTOURS,
            f"Source contours are not overlap-clean: {source_contours}",
            failures,
        )
        for name in COUNTER_GLYPHS:
            glyph = source_font[name]
            areas: list[float] = []
            for contour in glyph:
                area_pen = AreaPen()
                contour.draw(area_pen)
                areas.append(round(area_pen.value, 2))
            contour_directions[name] = areas
            check(
                len(areas) == 2 and areas[0] * areas[1] < 0,
                f"{name} outer and counter contours must have opposite winding: {areas}",
                failures,
            )
        for name, (minimum_left, minimum_right) in MIN_SIDE_BEARINGS.items():
            glyph = source_font[name]
            x_min, _, x_max, _ = glyph.bounds
            left = int(x_min)
            right = int(glyph.width - x_max)
            source_sidebearings[name] = [left, right]
            check(
                left >= minimum_left and right >= minimum_right,
                f"{name} sidebearings are too tight: left={left}, right={right}",
                failures,
            )

    if TTF.exists():
        font = TTFont(TTF)
        glyph_order = font.getGlyphOrder()
        family_names = [
            record.toUnicode()
            for record in font["name"].names
            if record.nameID in {1, 4, 6}
        ]
        check(REQUIRED.issubset(set(glyph_order)), "Control glyph set is incomplete", failures)
        check(font["OS/2"].usWeightClass == 700, "Weight class must remain 700", failures)
        check(bool(font["OS/2"].fsSelection & 0x20), "OS/2 bold bit is missing", failures)
        check(bool(font["head"].macStyle & 0x01), "head bold bit is missing", failures)
        check(all("Inter" not in value for value in family_names), "Upstream family leaked into names", failures)
        hmtx = font["hmtx"].metrics
        check(hmtx["f"][1] >= 40, f"Compiled f LSB collapsed: {hmtx['f'][1]}", failures)
        check(hmtx["r"][1] >= 40, f"Compiled r LSB collapsed: {hmtx['r'][1]}", failures)
        check("kern" not in font and "GPOS" not in font, "Alpha 1 must validate spacing without kerning", failures)

    route_text = ROUTE.read_text(encoding="utf-8") if ROUTE.exists() else ""
    check("noindex={true}" in route_text, "Manual specimen must remain noindex", failures)
    check("UMSans2ManualAlpha-DisplayBold.woff2" in route_text, "Specimen does not load the proof", failures)
    check("letter-spacing: -" not in route_text, "Specimen must not hide spacing with negative tracking", failures)
    check("text-rendering: geometricPrecision" not in route_text, "Specimen must use browser-default rasterization", failures)

    if DESIGNSPACE.exists():
        designspace = DesignSpaceDocument.fromfile(DESIGNSPACE)
        check(len(designspace.sources) == 1, "Alpha designspace must expose exactly one manual master", failures)
        check(len(designspace.instances) == 1, "Alpha designspace must expose exactly one proof instance", failures)

    portable_text = PORTABLE_SPECIMEN.read_text(encoding="utf-8") if PORTABLE_SPECIMEN.exists() else ""
    check('content="noindex,nofollow"' in portable_text, "Portable specimen must remain noindex", failures)
    check("../build/UMSans2ManualAlpha-DisplayBold.woff2" in portable_text, "Portable specimen does not use the build proof", failures)

    global_files = list((ROOT / "src" / "styles").glob("*.css")) + list((ROOT / "src" / "layouts").glob("*.astro"))
    leaked = [
        str(path.relative_to(ROOT))
        for path in global_files
        if "um-sans-2-manual-alpha" in path.read_text(encoding="utf-8").lower()
        or "UM Sans 2 Manual Alpha" in path.read_text(encoding="utf-8")
    ]
    check(not leaked, f"Manual alpha leaked into global runtime: {', '.join(leaked)}", failures)

    result = {
        "status": "PASS" if not failures else "FAIL",
        "source": str(SOURCE.relative_to(ROOT)),
        "glyphCount": len(glyph_order),
        "requiredGlyphCount": len(REQUIRED),
        "familyNames": sorted(set(family_names)),
        "sourceContours": source_contours,
        "contourAreas": contour_directions,
        "sourceSidebearings": source_sidebearings,
        "productionUse": False,
        "failures": failures,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
