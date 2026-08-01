#!/usr/bin/env python3
"""Compile the editable UM Sans 2 manual UFO into quarantined proof binaries.

This compiler never creates or modifies outlines. It only reads the UFO source,
builds a static TrueType proof and writes a WOFF2 copy for the noindex lab page.
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil

from defcon import Font
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "type" / "um-sans-2" / "sources" / "UMSans2Display-Bold.ufo"
BUILD = ROOT / "type" / "um-sans-2" / "build"
WEB_PROOF = ROOT / "public" / "fonts" / "um-sans-2-manual-alpha"
FAMILY = "UM Sans 2 Manual Alpha 1"
STYLE = "Display Bold"
VERSION = "0.200"
SOURCE_TIMESTAMP = int(datetime(2026, 1, 1, tzinfo=timezone.utc).timestamp()) + 2_082_844_800


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compile_font() -> dict[str, object]:
    if not SOURCE.exists():
        raise SystemExit(f"Missing manual UFO source: {SOURCE}")

    source = Font(SOURCE)
    glyph_order = source.lib.get("public.glyphOrder") or list(source.keys())
    if ".notdef" not in glyph_order:
        glyph_order.insert(0, ".notdef")

    glyph_set = source.layers.defaultLayer
    glyphs = {}
    metrics = {}
    cmap = {}
    for name in glyph_order:
        glyph = glyph_set[name]
        # UFO sources stay as manually editable cubic outlines. The proof TTF
        # receives an explicit cubic-to-quadratic conversion at compile time;
        # no generated points are ever written back into the source UFO.
        tt_pen = TTGlyphPen(glyph_set)
        conversion_pen = Cu2QuPen(tt_pen, max_err=1.0, reverse_direction=True)
        glyph.draw(conversion_pen)
        glyphs[name] = tt_pen.glyph()
        # Preserve the sidebearings authored in the UFO. Using a blanket zero
        # LSB moves every outline onto the origin and destroys word rhythm.
        left_sidebearing = int(glyph.bounds[0]) if glyph.bounds else 0
        metrics[name] = (int(glyph.width), left_sidebearing)
        for codepoint in glyph.unicodes:
            cmap[codepoint] = name

    BUILD.mkdir(parents=True, exist_ok=True)
    WEB_PROOF.mkdir(parents=True, exist_ok=True)
    ttf_path = BUILD / "UMSans2ManualAlpha-DisplayBold.ttf"
    woff2_path = BUILD / "UMSans2ManualAlpha-DisplayBold.woff2"
    web_woff2_path = WEB_PROOF / "UMSans2ManualAlpha-DisplayBold.woff2"

    builder = FontBuilder(1000, isTTF=True)
    builder.setupGlyphOrder(glyph_order)
    builder.setupCharacterMap(cmap)
    builder.setupGlyf(glyphs)
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=780, descent=-220, lineGap=0)
    builder.setupNameTable(
        {
            "familyName": FAMILY,
            "styleName": STYLE,
            "uniqueFontIdentifier": f"UMSA:{FAMILY}:{VERSION}",
            "fullName": f"{FAMILY} {STYLE}",
            "psName": "UMSans2ManualAlpha-DisplayBold",
            "version": f"Version {VERSION}",
            "description": "Hand-authored Alpha 1 redraw proof. Not for production or distribution.",
            "designer": "ULTIMA MILLA S.A. Type Development",
            "designerURL": "https://www.ultimamilla.com.ar",
            "licenseDescription": "Internal evaluation only. No public distribution.",
        }
    )
    builder.setupHead(macStyle=0x01, created=SOURCE_TIMESTAMP, modified=SOURCE_TIMESTAMP)
    builder.setupOS2(
        sTypoAscender=780,
        sTypoDescender=-220,
        sTypoLineGap=0,
        usWinAscent=780,
        usWinDescent=220,
        usWeightClass=700,
        usWidthClass=5,
        sxHeight=540,
        sCapHeight=720,
        fsSelection=0x20,
    )
    builder.setupPost(keepGlyphNames=True)
    builder.setupMaxp()
    font = builder.font
    if source.features.text.strip():
        addOpenTypeFeaturesFromString(font, source.features.text)
    font["head"].fontRevision = 0.2
    font.save(ttf_path, reorderTables=False)

    web_font = TTFont(ttf_path)
    web_font.flavor = "woff2"
    web_font.save(woff2_path, reorderTables=False)
    shutil.copy2(woff2_path, web_woff2_path)

    report = {
        "family": FAMILY,
        "version": VERSION,
        "status": "manual-alpha-1-quarantined",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": str(SOURCE.relative_to(ROOT)),
        "sourceFormat": "UFO 3",
        "outlineOrigin": "hand-authored UMSA coordinates; no imported outlines",
        "glyphCount": len(glyph_order),
        "unicodeCount": len(cmap),
        "approvedUse": "noindex specimen only",
        "productionUse": False,
        "files": [
            {"path": str(ttf_path.relative_to(ROOT)), "sha256": digest(ttf_path)},
            {"path": str(woff2_path.relative_to(ROOT)), "sha256": digest(woff2_path)},
            {"path": str(web_woff2_path.relative_to(ROOT)), "sha256": digest(web_woff2_path)},
        ],
    }
    report_path = BUILD / "build-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.copy2(report_path, WEB_PROOF / "build-report.json")
    (WEB_PROOF / "DO-NOT-SHIP.md").write_text(
        "# UM Sans 2 Manual Alpha 1\n\nInternal noindex proof only. Do not register in global CSS, publish as a font package or deploy to production.\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return report


if __name__ == "__main__":
    compile_font()
