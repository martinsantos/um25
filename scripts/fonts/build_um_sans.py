#!/usr/bin/env python3
"""Build the complete UM Sans 1.2 Production family.

UM Sans is an OFL derivative of Inter. The definitive build preserves the
upstream outlines and changes only release metadata, packaging and the
OpenType tables required for a governed web family. It must never invent or
silently deform a glyph.
"""

from __future__ import annotations

from copy import deepcopy
import json
import math
import os
import shutil
import unicodedata
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.otlLib.builder import (
    buildLookup,
    buildPairPosGlyphs,
    buildStatTable,
    buildValue,
)
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.qu2cuPen import Qu2CuPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables._f_v_a_r import NamedInstance
from fontTools.ttLib.tables.ttProgram import Program
from fontTools.varLib.instancer import instantiateVariableFont
from ttfautohint import ttfautohint

from fetch_um_sans_sources import SOURCE_DIR, fetch_sources
from package_um_sans import package_release


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public" / "fonts" / "um-sans"
SOURCE_LICENSE = SOURCE_DIR / "OFL.txt"
ROMAN_SOURCE = SOURCE_DIR / "Inter[opsz,wght].ttf"
ITALIC_SOURCE = SOURCE_DIR / "Inter-Italic[opsz,wght].ttf"

FAMILY = "UM Sans"
VERSION_LABEL = "1.2 Production"
VERSION = "Version 1.200"
VERSION_SLUG = "1.2-Production"
ARCHIVE_NAME = f"UMSans-{VERSION_SLUG}.zip"
CLEAN_OUTLINES = os.environ.get("UMSANS_CLEAN_OUTLINES", "1") == "1"
VENDOR = "UMSA"
FONT_TIMESTAMP = 3_866_745_600
ZIP_TIMESTAMP = (2026, 7, 13, 0, 0, 0)
TTFAUTOHINT_VERSION = "1.8.4.16-eb64"

COPYRIGHT = (
    "Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter). "
    "Modifications copyright 2026 ULTIMA MILLA S.A."
)
TRADEMARK = (
    "UM Sans is a trademark of ULTIMA MILLA S.A. Inter and Inter UI remain "
    "trademarks of their respective owner."
)
UPSTREAM_CREDIT = (
    "UMSA Design Engineering; derived from Inter 4.001 by The Inter Project "
    "Authors under SIL Open Font License 1.1."
)
DESCRIPTION = (
    "UM Sans 1.2 Production is the editorial and interface family of ULTIMA "
    "MILLA. It is a modified OFL derivative of Inter 4.001 with governed "
    "optical cuts, proportions, technical disambiguation defaults, spacing, "
    "kerning and release engineering by UMSA."
)
LICENSE_DESCRIPTION = "Licensed under the SIL Open Font License, Version 1.1."
LICENSE_URL = "https://openfontlicense.org/open-font-license-official-text/"
VENDOR_URL = "https://www.ultimamilla.com.ar"
DESIGNER_URL = "https://www.ultimamilla.com.ar/estilo/um-sans"
SAMPLE_TEXT = "¿Qué operación necesita continuidad? Fibra, energía y precisión 24/7."

STYLE_SPECS = (
    {"weight": 100, "name": "Thin", "role": "display-light", "opsz": 14},
    {"weight": 200, "name": "ExtraLight", "role": "display-light", "opsz": 14},
    {"weight": 300, "name": "Light", "role": "editorial-light", "opsz": 14},
    {"weight": 400, "name": "Regular", "role": "reading", "opsz": 14},
    {"weight": 500, "name": "Medium", "role": "interface", "opsz": 14},
    {"weight": 600, "name": "SemiBold", "role": "editorial", "opsz": 18},
    {"weight": 700, "name": "Bold", "role": "display", "opsz": 24},
    {"weight": 800, "name": "ExtraBold", "role": "display-emphasis", "opsz": 32},
    {"weight": 900, "name": "Black", "role": "poster", "opsz": 32},
)

SLANT_SPECS = (
    {"italic": False, "source": ROMAN_SOURCE, "label": "Roman"},
    {"italic": True, "source": ITALIC_SOURCE, "label": "Italic"},
)

HINTING_POLICY = {
    "no_info": True,
    "hint_composites": True,
    "default_script": "latn",
    "fallback_script": "latn",
    "windows_compatibility": False,
    "increase_x_height": 14,
    "hinting_range_min": 8,
    "hinting_range_max": 50,
    "hinting_limit": 200,
}

# The editorial package deliberately keeps Latin, Vietnamese, punctuation,
# technical symbols and the glyphs reached by retained OpenType features.
EDITORIAL_UNICODE_RANGES = (
    (0x0000, 0x02AF),
    (0x1D00, 0x1D7F),
    (0x1E00, 0x1EFF),
    (0x2000, 0x209F),
    (0x20A0, 0x20CF),
    (0x2100, 0x214F),
    (0x2190, 0x23FF),
    (0x2460, 0x26FF),
    (0x27F0, 0x27FF),
    (0x2C60, 0x2C7F),
    (0xA720, 0xA7FF),
    (0xAB30, 0xAB6F),
    (0xFB00, 0xFB06),
    (0x1F100, 0x1F1FF),
)

REQUIRED_TEXT = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "ÁÉÍÓÚÜÑáéíóúüñ¿¡0123456789"
    ".,:;!?@#%&/()[]{}+-=_€$£¥°±×©®™«»“”‘’–—"
)
REQUIRED_CASE_CLOSURE = "ΜμΩω"

REQUIRED_EDITORIAL_FEATURES = {
    "aalt", "calt", "case", "dlig", "dnom", "frac", "locl",
    "numr", "ordn", "pnum", "salt", "sinf", "ss01", "ss02", "ss03",
    "ss04", "ss05", "ss06", "ss07", "ss08", "subs", "sups", "tnum",
    "zero",
}

DEFAULT_GLYPH_ALTERNATES = {
    "I": "I.1",
    "l": "l.ss02",
}
VARIABLE_GUARD_UNITS = 18
LOWERCASE_L_TERMINAL_DROP = 14
STATIC_HINTING_GUARD_UNITS = 2
MIN_SIDEBEARING_BY_WEIGHT = {
    100: 34,
    200: 32,
    300: 30,
    400: 28,
    500: 25,
    600: 22,
    700: 20,
    800: 18,
    900: 16,
}
MAX_INK_ADVANCE_RATIO = {
    100: 0.84,
    200: 0.85,
    300: 0.87,
    400: 0.885,
    500: 0.905,
    600: 0.925,
    700: 0.94,
    800: 0.95,
    900: 0.958,
}

SIDEBEARING_GLYPHS = (
    "abcdeghiklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789&@%$€£¥¿¡"
)

ROUND_LOWER = frozenset("abcdegopqs")
OPEN_LOWER = frozenset("ehknu")
COMPACT_LOWER = frozenset("fijlt")
WIDE_LOWER = frozenset("mw")
ROUND_UPPER = frozenset("CGOQS")
DIAGONAL_UPPER = frozenset("AVWXY")

CUSTOM_KERN_GROUPS = {
    ("T", "a"): -18, ("T", "e"): -16, ("T", "i"): -10,
    ("T", "o"): -16, ("T", "u"): -12, ("V", "a"): -22,
    ("V", "e"): -18, ("V", "i"): -12, ("V", "o"): -18,
    ("W", "a"): -16, ("Y", "a"): -24, ("Y", "e"): -18,
    ("Y", "o"): -20, ("L", "a"): -8, ("L", "e"): -6,
    ("L", "o"): -6, ("Q", "u"): -6, ("A", "V"): -12,
    ("A", "W"): -10, ("A", "Y"): -14, ("V", "A"): -18,
    ("W", "A"): -16, ("Y", "A"): -18, ("F", "a"): -14,
    ("F", "e"): -12, ("F", "o"): -12, ("P", "a"): -16,
    ("P", "e"): -10, ("P", "o"): -10, ("T", "r"): -10,
    ("T", "y"): -8, ("V", "u"): -10, ("W", "e"): -10,
    ("Y", "u"): -12, ("F", "r"): -8, ("P", "r"): -6,
    ("L", "T"): -8, ("L", "V"): -12, ("L", "Y"): -14,
    ("K", "o"): -8, ("X", "o"): -8, ("r", "a"): -4,
    ("r", "e"): -4, ("r", "o"): -4, ("v", "a"): -8,
    ("v", "o"): -6, ("w", "a"): -6, ("w", "o"): -4,
    ("y", "a"): -8, ("y", "o"): -6, ("T", "."): -34,
    ("T", ","): -34, ("V", "."): -30, ("V", ","): -30,
    ("W", "."): -24, ("Y", "."): -32, ("P", "."): -24,
    ("A", "”"): -14, ("A", "’"): -12, ("L", "”"): -8,
    ("L", "’"): -8, ("T", "—"): -12, ("V", "—"): -10,
    ("¿", "A"): -8, ("¿", "Q"): -6, ("¡", "A"): -6,
    ("¡", "T"): -6, ("r", "."): -12, ("r", ","): -12,
}


def style_names(spec: dict[str, object], italic: bool) -> tuple[str, str]:
    name = str(spec["name"])
    if italic and spec["weight"] == 400:
        return "Italic", "Italic"
    if italic:
        return f"{name} Italic", f"{name}Italic"
    return name, name


def editorial_unicodes(font: TTFont) -> set[int]:
    cmap = font.getBestCmap()
    selected = {
        codepoint
        for codepoint in cmap
        if any(start <= codepoint <= end for start, end in EDITORIAL_UNICODE_RANGES)
    }
    selected.update(ord(character) for character in REQUIRED_TEXT)
    selected.update(ord(character) for character in REQUIRED_CASE_CLOSURE)

    # A commercial subset must never expose only one side of a case pair. Some
    # extended-Latin capitals in the upstream font intentionally omit their IPA
    # lowercase counterpart (and vice versa). Keep the repertoire case-closed
    # instead of publishing characters that turn into tofu after case changes.
    case_closed = set(selected)
    for codepoint in selected:
        character = chr(codepoint)
        if not unicodedata.category(character).startswith("L"):
            continue
        counterpart = character.swapcase()
        if len(counterpart) == 1 and counterpart != character:
            counterpart_codepoint = ord(counterpart)
            if counterpart_codepoint in cmap:
                case_closed.add(counterpart_codepoint)
            elif character not in REQUIRED_TEXT:
                case_closed.discard(codepoint)
    return case_closed


def subset_editorial(font: TTFont) -> None:
    options = Options()
    options.layout_features = ["*"]
    options.layout_scripts = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    options.glyph_names = True
    options.legacy_cmap = True
    options.symbol_cmap = True
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.recalc_average_width = True
    options.recalc_max_context = True
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=editorial_unicodes(font))
    subsetter.subset(font)


def decomposed_base(character: str) -> str:
    normalized = unicodedata.normalize("NFD", character)
    return normalized[0] if normalized else character


def brand_glyph_scale(character: str) -> float:
    base = decomposed_base(character)
    category = unicodedata.category(character)
    if category == "Ll":
        if base == "p":
            return 1.026
        if base in ROUND_LOWER:
            return 1.020
        if base in OPEN_LOWER:
            return 1.015
        if base in WIDE_LOWER:
            return 1.009
        if base in COMPACT_LOWER:
            return 1.003
        return 1.012
    if category == "Lu":
        if base in ROUND_UPPER:
            return 1.014
        if base in DIAGONAL_UPPER:
            return 1.005
        return 1.010
    if category == "Nd":
        return 1.026
    return 1.0


def apply_variable_default_alternates(font: TTFont) -> int:
    glyf = font["glyf"]
    metrics = font["hmtx"].metrics
    variations = font["gvar"].variations
    width_map = font["HVAR"].table.AdvWidthMap.mapping if "HVAR" in font else None
    applied = 0

    for target, source in DEFAULT_GLYPH_ALTERNATES.items():
        if target not in glyf or source not in glyf:
            continue
        glyf[target] = deepcopy(glyf[source])
        metrics[target] = metrics[source]
        variations[target] = deepcopy(variations[source])
        if width_map is not None and source in width_map:
            width_map[target] = width_map[source]
        applied += 1
    return applied


def strengthen_lowercase_l_terminal(font: TTFont) -> dict[str, object]:
    """Keep the footed lowercase l unmistakable at every axis corner.

    Inter's ss02 alternate has the right editorial skeleton, but its terminal
    reaches the baseline at the Display/Black corner. Moving only the baseline
    points in the default outline gives every interpolated master the same
    modest optical drop without changing contour compatibility.
    """
    glyph = font["glyf"]["l"]
    glyph.expand(font["glyf"])
    adjusted = []
    if glyph.numberOfContours > 0:
        for index, (x_value, y_value) in enumerate(glyph.coordinates):
            if y_value <= 0:
                glyph.coordinates[index] = (
                    x_value,
                    y_value - LOWERCASE_L_TERMINAL_DROP,
                )
                adjusted.append(index)
        glyph.recalcBounds(font["glyf"])
    return {
        "glyph": "l",
        "sourceAlternate": DEFAULT_GLYPH_ALTERNATES["l"],
        "terminalDropUnits": LOWERCASE_L_TERMINAL_DROP,
        "adjustedPoints": adjusted,
    }


def apply_variable_geometry(font: TTFont) -> dict[str, object]:
    glyf = font["glyf"]
    metrics = font["hmtx"].metrics
    variations = font["gvar"].variations
    profiles: dict[str, float] = {}

    for codepoint, glyph_name in font.getBestCmap().items():
        character = chr(codepoint)
        scale = brand_glyph_scale(character)
        profiles[glyph_name] = max(scale, profiles.get(glyph_name, 1.0))

    transformed = 0
    for glyph_name, scale in profiles.items():
        if glyph_name not in glyf or glyph_name not in metrics:
            continue
        glyph = glyf[glyph_name]
        glyph.expand(glyf)
        advance, left_bearing = metrics[glyph_name]
        if advance <= 0:
            continue
        center = advance / 2

        if glyph.isComposite():
            for component in glyph.components:
                if hasattr(component, "x"):
                    component.x = round(center + (component.x - center) * scale)
        elif glyph.numberOfContours > 0:
            for index, (x_value, y_value) in enumerate(glyph.coordinates):
                glyph.coordinates[index] = (
                    round(center + (x_value - center) * scale),
                    y_value,
                )

        for variation in variations.get(glyph_name, []):
            variation.coordinates = [
                None if point is None else (round(point[0] * scale), point[1])
                for point in variation.coordinates
            ]

        new_advance = round(
            advance * (1.0 + (scale - 1.0) * 0.72) + 2 * VARIABLE_GUARD_UNITS
        )
        metrics[glyph_name] = (
            new_advance,
            round(
                left_bearing * scale
                + (new_advance - advance * scale) / 2
            ),
        )
        glyph.recalcBounds(glyf)
        transformed += 1

    glyf.removeHinting()
    for table in ("prep", "fpgm", "cvt "):
        if table in font:
            del font[table]
    return {
        "transformedGlyphs": transformed,
        "profiledGlyphs": len(profiles),
        "variableSidebearingGuardUnits": VARIABLE_GUARD_UNITS,
    }


def glyphs_for_base(font: TTFont, base: str) -> set[str]:
    matches: set[str] = set()
    if len(base) == 1 and unicodedata.category(base) not in {"Lu", "Ll"}:
        glyph_name = font.getBestCmap().get(ord(base))
        return {glyph_name} if glyph_name else set()
    for codepoint, glyph_name in font.getBestCmap().items():
        character = chr(codepoint)
        if unicodedata.category(character) in {"Lu", "Ll"} and decomposed_base(character) == base:
            matches.add(glyph_name)
    return matches


def add_custom_kerning(font: TTFont, scale: float = 1.0) -> int:
    if "GPOS" not in font:
        return 0
    pair_values = {}
    for (left_base, right_base), adjustment in CUSTOM_KERN_GROUPS.items():
        scaled_adjustment = round(adjustment * scale)
        for left in glyphs_for_base(font, left_base):
            for right in glyphs_for_base(font, right_base):
                pair_values[(left, right)] = (
                    buildValue({"XAdvance": scaled_adjustment}),
                    buildValue({}),
                )

    subtables = buildPairPosGlyphs(pair_values, font.getReverseGlyphMap())
    lookup = buildLookup(subtables, table="GPOS")
    if lookup is None:
        return 0

    gpos = font["GPOS"].table
    lookup_index = len(gpos.LookupList.Lookup)
    gpos.LookupList.Lookup.append(lookup)
    gpos.LookupList.LookupCount = len(gpos.LookupList.Lookup)
    for record in gpos.FeatureList.FeatureRecord:
        if record.FeatureTag == "kern":
            record.Feature.LookupListIndex.append(lookup_index)
            record.Feature.LookupCount = len(record.Feature.LookupListIndex)
    return len(pair_values)


def set_name(font: TTFont, name_id: int, value: str) -> None:
    """Write one canonical Windows Unicode name record.

    Modern macOS reads platform 3 records correctly. Keeping only one canonical
    encoding avoids duplicate family identities in Font Book, Adobe and Office.
    """
    font["name"].setName(value, name_id, 3, 1, 0x409)


def reset_public_names(font: TTFont) -> None:
    """Remove upstream public names while retaining feature/axis labels."""
    font["name"].names = [
        record
        for record in font["name"].names
        if record.nameID > 25 and record.platformID != 1
    ]


def set_public_legal_names(font: TTFont) -> None:
    for name_id, value in {
        0: COPYRIGHT,
        7: TRADEMARK,
        8: "ULTIMA MILLA S.A.",
        9: UPSTREAM_CREDIT,
        10: DESCRIPTION,
        11: VENDOR_URL,
        12: DESIGNER_URL,
        13: LICENSE_DESCRIPTION,
        14: LICENSE_URL,
        19: SAMPLE_TEXT,
    }.items():
        set_name(font, name_id, value)


def legacy_static_names(
    spec: dict[str, object],
    italic: bool,
) -> tuple[str, str]:
    """Return a four-style-linking-safe legacy family and subfamily."""
    weight = int(spec["weight"])
    weight_name = str(spec["name"])
    if weight in {400, 700}:
        legacy_family = FAMILY
        if weight == 700 and italic:
            legacy_subfamily = "Bold Italic"
        elif weight == 700:
            legacy_subfamily = "Bold"
        elif italic:
            legacy_subfamily = "Italic"
        else:
            legacy_subfamily = "Regular"
    else:
        legacy_family = f"{FAMILY} {weight_name}"
        legacy_subfamily = "Italic" if italic else "Regular"
    return legacy_family, legacy_subfamily


def typographic_style(spec: dict[str, object], italic: bool) -> str:
    weight_name = str(spec["name"])
    if int(spec["weight"]) == 400:
        return "Italic" if italic else "Regular"
    return f"{weight_name} Italic" if italic else weight_name


def strip_mac_names(font: TTFont) -> None:
    font["name"].names = [
        record for record in font["name"].names if record.platformID != 1
    ]


def recalculate_average_width(font: TTFont) -> int:
    widths = [
        advance
        for advance, _ in font["hmtx"].metrics.values()
        if advance > 0
    ]
    average = round(sum(widths) / len(widths))
    font["OS/2"].xAvgCharWidth = average
    return average


def recalculate_horizontal_metrics(font: TTFont) -> None:
    font["hhea"].recalc(font)


def set_caret_metrics(font: TTFont, italic: bool) -> None:
    font["hhea"].caretSlopeRise = font["head"].unitsPerEm
    font["hhea"].caretSlopeRun = (
        round(math.tan(math.radians(9)) * font["head"].unitsPerEm)
        if italic
        else 0
    )
    font["hhea"].caretOffset = 0


def stat_axes(
    italic: bool,
    spec: dict[str, object] | None = None,
) -> list[dict[str, object]]:
    if spec is None:
        optical_values = [
            {
                "nominalValue": 14,
                "rangeMinValue": 14,
                "rangeMaxValue": 16.99,
                "name": "Text",
                "flags": 0x2,
            },
            {
                "nominalValue": 18,
                "rangeMinValue": 17,
                "rangeMaxValue": 21.99,
                "name": "Editorial",
            },
            {
                "nominalValue": 24,
                "rangeMinValue": 22,
                "rangeMaxValue": 27.99,
                "name": "Display",
            },
            {
                "nominalValue": 32,
                "rangeMinValue": 28,
                "rangeMaxValue": 32,
                "name": "Poster",
            },
        ]
        weight_values = [
            {
                "value": int(item["weight"]),
                "name": str(item["name"]),
                **(
                    {"flags": 0x2, "linkedValue": 700}
                    if int(item["weight"]) == 400
                    else {}
                ),
            }
            for item in STYLE_SPECS
        ]
    else:
        optical_values = [
            {
                "value": int(spec["opsz"]),
                "name": {
                    14: "Text",
                    18: "Editorial",
                    24: "Display",
                    32: "Poster",
                }[int(spec["opsz"])],
                **({"flags": 0x2} if int(spec["opsz"]) == 14 else {}),
            }
        ]
        weight_values = [
            {
                "value": int(spec["weight"]),
                "name": str(spec["name"]),
                **({"flags": 0x2} if int(spec["weight"]) == 400 else {}),
            }
        ]
    return [
        {
            "tag": "opsz",
            "name": "Optical Size",
            "ordering": 0,
            "values": optical_values,
        },
        {
            "tag": "wght",
            "name": "Weight",
            "ordering": 1,
            "values": weight_values,
        },
        {
            "tag": "ital",
            "name": "Italic",
            "ordering": 2,
            "values": [
                {
                    "value": 1 if italic else 0,
                    "name": "Italic" if italic else "Roman",
                    **({} if italic else {"flags": 0x2, "linkedValue": 1}),
                }
            ],
        },
    ]


def rebuild_stat(font: TTFont, italic: bool, spec: dict[str, object] | None = None) -> None:
    buildStatTable(
        font,
        stat_axes(italic, spec),
        elidedFallbackName="Regular",
        windowsNames=True,
        macNames=False,
    )
    strip_mac_names(font)


def set_weight_axis_profile(font: TTFont) -> None:
    # UM Sans accelerates weight through the upper half of the axis so 700 has
    # display authority while 400 remains calm enough for long-form reading.
    font["avar"].segments["wght"] = {
        -1.0: -1.0,
        0.0: 0.0,
        0.20001220703125: 0.260009765625,
        0.4000244140625: 0.52001953125,
        0.5999755859375: 0.760009765625,
        0.79998779296875: 0.9200439453125,
        1.0: 1.0,
    }


def normalize_timestamps(font: TTFont) -> None:
    font["head"].created = FONT_TIMESTAMP
    font["head"].modified = FONT_TIMESTAMP
    font.recalcTimestamp = False


def configure_rasterization(font: TTFont) -> None:
    os2 = font["OS/2"]
    os2.version = max(os2.version, 4)
    os2.fsType = 0
    os2.sTypoLineGap = 0
    os2.usWinAscent = max(os2.usWinAscent, 2314)
    os2.fsSelection |= 1 << 7
    os2.fsSelection |= 1 << 8
    font["hhea"].lineGap = 0
    font["post"].underlinePosition = -200
    font["post"].underlineThickness = 100
    gasp = newTable("gasp")
    gasp.version = 1
    gasp.gaspRange = {8: 0x000A, 65535: 0x000F}
    font["gasp"] = gasp


SMART_DROPOUT_PROGRAM = b"\xb8\x01\xff\x85\xb0\x04\x8d"


def enable_smart_dropout(font: TTFont) -> None:
    if "prep" not in font:
        font["prep"] = newTable("prep")
        font["prep"].program = Program()
        existing = b""
    else:
        existing = font["prep"].program.getBytecode()
    if SMART_DROPOUT_PROGRAM not in existing:
        font["prep"].program.fromBytecode(SMART_DROPOUT_PROGRAM + existing)
    font["head"].flags |= 1 << 3


def rebuild_named_instances(font: TTFont, italic: bool) -> None:
    name = font["name"]
    instances = []
    for spec in STYLE_SPECS:
        style, file_style = style_names(spec, italic)
        instance = NamedInstance()
        instance.subfamilyNameID = name.addName(
            style,
            platforms=((3, 1, 0x409),),
        )
        is_default = int(spec["weight"]) == 400 and int(spec["opsz"]) == 14
        if is_default:
            postscript_name = "UMSans-VariableItalic" if italic else "UMSans-Variable"
        else:
            postscript_name = f"UMSans-Variable-{file_style}"
        instance.postscriptNameID = name.addName(
            postscript_name,
            platforms=((3, 1, 0x409),),
        )
        instance.coordinates = {
            "opsz": float(spec["opsz"]),
            "wght": float(spec["weight"]),
        }
        instance.flags = 0
        instances.append(instance)
    font["fvar"].instances = instances


def set_variable_metadata(font: TTFont, italic: bool) -> None:
    reset_public_names(font)
    style = "Italic" if italic else "Regular"
    ps_name = "UMSans-VariableItalic" if italic else "UMSans-Variable"
    full_name = "UM Sans Variable Italic" if italic else "UM Sans Variable"
    for name_id, value in {
        1: "UM Sans Variable",
        2: style,
        3: f"{VERSION}; UMSA; {ps_name}",
        4: full_name,
        5: VERSION,
        6: ps_name,
        16: FAMILY,
        17: style,
        21: "UM Sans Variable",
        22: style,
        25: "UMSans",
    }.items():
        set_name(font, name_id, value)
    set_public_legal_names(font)

    os2 = font["OS/2"]
    os2.usWeightClass = 400
    os2.usWidthClass = 5
    os2.achVendID = VENDOR
    os2.fsSelection &= ~(1 << 0 | 1 << 5 | 1 << 6)
    if italic:
        os2.fsSelection |= 1 << 0
    else:
        os2.fsSelection |= 1 << 6
    font["head"].fontRevision = 1.2
    font["head"].macStyle = 2 if italic else 0
    font["post"].italicAngle = -9 if italic else 0
    set_caret_metrics(font, italic)
    rebuild_named_instances(font, italic)
    rebuild_stat(font, italic)
    recalculate_average_width(font)
    recalculate_horizontal_metrics(font)
    configure_rasterization(font)
    enable_smart_dropout(font)
    strip_mac_names(font)
    normalize_timestamps(font)


def prepare_variable(source: Path, italic: bool) -> tuple[TTFont, dict[str, object]]:
    font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
    subset_editorial(font)
    if CLEAN_OUTLINES:
        default_alternates = 0
        lowercase_l = {
            "glyph": "l",
            "policy": "upstream contour preserved",
            "adjustedPoints": [],
        }
        geometry = {
            "transformedGlyphs": 0,
            "profiledGlyphs": 0,
            "policy": "upstream contours and variation data preserved",
        }
        custom_pairs = 0
    else:
        default_alternates = apply_variable_default_alternates(font)
        lowercase_l = strengthen_lowercase_l_terminal(font)
        geometry = apply_variable_geometry(font)
        set_weight_axis_profile(font)
        custom_pairs = add_custom_kerning(font)
    set_variable_metadata(font, italic)
    font.recalcBBoxes = True
    font.recalcTimestamp = False
    return font, {
        "slant": "italic" if italic else "roman",
        "defaultAlternates": default_alternates,
        "lowercaseL": lowercase_l,
        "customKerningPairs": custom_pairs,
        "geometry": geometry,
        "axes": {"opsz": [14, 32], "wght": [100, 900]},
    }


def enforce_optical_sidebearings(font: TTFont, css_weight: int) -> dict[str, object]:
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    metrics = font["hmtx"].metrics
    max_ratio = MAX_INK_ADVANCE_RATIO[css_weight]
    minimum_target = MIN_SIDEBEARING_BY_WEIGHT[css_weight]
    minimum = minimum_target + STATIC_HINTING_GUARD_UNITS
    adjusted = 0
    before_minimum = math.inf
    after_minimum = math.inf

    for character in SIDEBEARING_GLYPHS:
        glyph_name = cmap.get(ord(character))
        if not glyph_name or glyph_name not in metrics:
            continue
        pen = BoundsPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        if not pen.bounds:
            continue
        x_min, _, x_max, _ = pen.bounds
        width = x_max - x_min
        advance, left_bearing = metrics[glyph_name]
        if advance <= 0:
            continue
        right_bearing = advance - left_bearing - width
        before_minimum = min(before_minimum, left_bearing, right_bearing)
        new_left_bearing = max(left_bearing, minimum)
        left_correction = new_left_bearing - left_bearing
        required_advance = max(
            advance + left_correction,
            math.ceil(width / max_ratio),
            math.ceil(new_left_bearing + width + minimum),
        )
        if new_left_bearing != left_bearing or required_advance != advance:
            metrics[glyph_name] = (required_advance, new_left_bearing)
            adjusted += 1
        after_minimum = min(
            after_minimum,
            new_left_bearing,
            required_advance - new_left_bearing - width,
        )

    return {
        "adjustments": adjusted,
        "guardedGlyphs": len(SIDEBEARING_GLYPHS),
        "minimumTargetUnits": minimum_target,
        "productionGuardUnits": minimum,
        "minimumBeforeUnits": round(before_minimum) if before_minimum != math.inf else None,
        "minimumAfterUnits": round(after_minimum) if after_minimum != math.inf else None,
    }


def set_static_metadata(font: TTFont, spec: dict[str, object], italic: bool) -> None:
    css_weight = int(spec["weight"])
    style, file_style = style_names(spec, italic)
    legacy_family, legacy_subfamily = legacy_static_names(spec, italic)
    type_style = typographic_style(spec, italic)
    ps_name = f"UMSans-{file_style}"
    reset_public_names(font)
    for name_id, value in {
        1: legacy_family,
        2: legacy_subfamily,
        3: f"{VERSION}; UMSA; {ps_name}",
        4: f"{FAMILY} {style}",
        5: VERSION,
        6: ps_name,
        16: FAMILY,
        17: type_style,
        21: legacy_family,
        22: legacy_subfamily,
    }.items():
        set_name(font, name_id, value)
    set_public_legal_names(font)

    os2 = font["OS/2"]
    os2.usWeightClass = css_weight
    os2.usWidthClass = 5
    os2.achVendID = VENDOR
    os2.fsSelection &= ~(1 << 0 | 1 << 5 | 1 << 6)
    if italic:
        os2.fsSelection |= 1 << 0
    if css_weight == 700:
        os2.fsSelection |= 1 << 5
    if not italic and css_weight != 700:
        os2.fsSelection |= 1 << 6
    font["head"].fontRevision = 1.2
    font["head"].macStyle = (1 if css_weight == 700 else 0) | (2 if italic else 0)
    font["post"].italicAngle = -9 if italic else 0
    set_caret_metrics(font, italic)
    rebuild_stat(font, italic, spec)
    recalculate_average_width(font)
    recalculate_horizontal_metrics(font)
    configure_rasterization(font)
    strip_mac_names(font)
    normalize_timestamps(font)


def autohint_ttf(path: Path) -> dict[str, object]:
    hinted = ttfautohint(in_buffer=path.read_bytes(), **HINTING_POLICY)
    path.write_bytes(hinted)
    font = TTFont(path, recalcBBoxes=False, recalcTimestamp=False)
    configure_rasterization(font)
    enable_smart_dropout(font)
    recalculate_average_width(font)
    recalculate_horizontal_metrics(font)
    strip_mac_names(font)
    normalize_timestamps(font)
    font.save(path)

    verified = TTFont(path)
    glyf = verified["glyf"]
    instructed = 0
    for glyph in glyf.glyphs.values():
        glyph.expand(glyf)
        if hasattr(glyph, "program") and glyph.program.getBytecode():
            instructed += 1
    if not all(table in verified for table in ("cvt ", "fpgm", "prep")) or instructed < 1_000:
        raise RuntimeError(f"TrueType hinting failed for {path.name}")
    return {
        "engine": f"ttfautohint {TTFAUTOHINT_VERSION}",
        "instructedGlyphs": instructed,
        "tables": ["cvt ", "fpgm", "prep"],
        "policy": HINTING_POLICY,
    }


def build_cff_otf(
    source_font: TTFont,
    destination: Path,
    spec: dict[str, object],
    italic: bool,
) -> None:
    units_per_em = source_font["head"].unitsPerEm
    glyph_order = source_font.getGlyphOrder()
    source_glyphs = source_font.getGlyphSet()
    metrics = source_font["hmtx"].metrics
    charstrings = {}
    for glyph_name in glyph_order:
        width = metrics[glyph_name][0]
        type2_pen = T2CharStringPen(width, source_glyphs)
        cubic_pen = Qu2CuPen(type2_pen, max_err=1.0, all_cubic=True)
        source_glyphs[glyph_name].draw(cubic_pen)
        charstrings[glyph_name] = type2_pen.getCharString(private=None, globalSubrs=None)

    style, file_style = style_names(spec, italic)
    legacy_family, legacy_subfamily = legacy_static_names(spec, italic)
    ps_name = f"UMSans-{file_style}"
    builder = FontBuilder(units_per_em, isTTF=False)
    builder.setupGlyphOrder(glyph_order)
    builder.setupCharacterMap(source_font.getBestCmap())
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(
        ascent=source_font["hhea"].ascent,
        descent=source_font["hhea"].descent,
        lineGap=0,
    )
    builder.setupCFF(
        ps_name,
        {
            "version": "1.200",
            "FullName": f"{FAMILY} {style}",
            "FamilyName": legacy_family,
            "Weight": style,
            "ItalicAngle": -9 if italic else 0,
            "Notice": f"{COPYRIGHT} {LICENSE_DESCRIPTION}",
        },
        charstrings,
        {},
    )
    builder.setupNameTable(
        {
            "familyName": legacy_family,
            "styleName": legacy_subfamily,
            "uniqueFontIdentifier": f"{VERSION}; UMSA; {ps_name}",
            "fullName": f"{FAMILY} {style}",
            "psName": ps_name,
            "version": VERSION,
            "manufacturer": "ULTIMA MILLA S.A.",
            "designer": UPSTREAM_CREDIT,
            "description": DESCRIPTION,
            "licenseDescription": LICENSE_DESCRIPTION,
            "licenseInfoURL": LICENSE_URL,
        }
    )
    os2 = source_font["OS/2"]
    builder.setupOS2(
        sTypoAscender=os2.sTypoAscender,
        sTypoDescender=os2.sTypoDescender,
        sTypoLineGap=0,
        usWinAscent=os2.usWinAscent,
        usWinDescent=os2.usWinDescent,
        usWeightClass=int(spec["weight"]),
        usWidthClass=5,
        sxHeight=os2.sxHeight,
        sCapHeight=os2.sCapHeight,
        achVendID=VENDOR,
    )
    builder.setupPost(
        italicAngle=-9 if italic else 0,
        underlinePosition=-200,
        underlineThickness=100,
    )
    builder.setupMaxp()
    for table in ("GDEF", "GPOS", "GSUB"):
        if table in source_font:
            builder.font[table] = deepcopy(source_font[table])
    set_static_metadata(builder.font, spec, italic)
    builder.font.save(destination)


def feature_tags(font: TTFont, table: str) -> list[str]:
    if table not in font or not font[table].table.FeatureList:
        return []
    return sorted(
        {record.FeatureTag for record in font[table].table.FeatureList.FeatureRecord}
    )


def validate(font_path: Path) -> dict[str, object]:
    font = TTFont(font_path)
    cmap = font.getBestCmap()
    missing = sorted({character for character in REQUIRED_TEXT if ord(character) not in cmap})
    if missing:
        raise RuntimeError(f"{font_path.name} is missing required glyphs: {''.join(missing)}")
    glyph_set = font.getGlyphSet()
    os2 = font["OS/2"]

    def ratio(character: str) -> float:
        glyph_name = cmap[ord(character)]
        pen = BoundsPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        if not pen.bounds:
            return 0
        width = pen.bounds[2] - pen.bounds[0]
        advance = font["hmtx"].metrics[glyph_name][0]
        return round(width / advance, 4) if advance else 0

    def ink_area(character: str) -> float:
        pen = AreaPen(glyph_set)
        glyph_set[cmap[ord(character)]].draw(pen)
        return abs(pen.value) / (font["head"].unitsPerEm**2)

    axes = []
    if "fvar" in font:
        axes = [
            {
                "tag": axis.axisTag,
                "minimum": axis.minValue,
                "default": axis.defaultValue,
                "maximum": axis.maxValue,
            }
            for axis in font["fvar"].axes
        ]
    return {
        "file": font_path.name,
        "bytes": font_path.stat().st_size,
        "glyphs": len(font.getGlyphOrder()),
        "characters": len(cmap),
        "weight": os2.usWeightClass,
        "italic": bool(os2.fsSelection & 1),
        "unitsPerEm": font["head"].unitsPerEm,
        "xHeight": os2.sxHeight,
        "capHeight": os2.sCapHeight,
        "ascender": os2.sTypoAscender,
        "descender": os2.sTypoDescender,
        "criticalWidthRatios": {character: ratio(character) for character in "aceglnoprsuCGMORS"},
        "criticalInkAreaEm2": round(sum(ink_area(character) for character in "aceglnoprsuCGMORS0247"), 5),
        "gsubFeatures": feature_tags(font, "GSUB"),
        "gposFeatures": feature_tags(font, "GPOS"),
        "axes": axes,
    }


def clean_previous_outputs() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    removable = (
        "UMSans-*",
        "build-report.json",
        "qa-report.json",
        "fontbakery-report.json",
        "fontbakery-report.md",
        "release-manifest.json",
        "CHECKSUMS.sha256",
        "um-sans.css",
    )
    for pattern in removable:
        for path in OUTPUT.glob(pattern):
            if path.is_file():
                path.unlink()


def main() -> None:
    source_manifest = fetch_sources()
    clean_previous_outputs()
    files: list[dict[str, object]] = []
    profiles: list[dict[str, object]] = []
    variables: list[dict[str, object]] = []

    for slant in SLANT_SPECS:
        italic = bool(slant["italic"])
        variable, variable_profile = prepare_variable(Path(slant["source"]), italic)
        variable_stem = "UMSans-VariableItalic" if italic else "UMSans-Variable"
        variable_ttf = OUTPUT / f"{variable_stem}.ttf"
        variable_woff2 = OUTPUT / f"{variable_stem}.woff2"
        variable.flavor = None
        variable.save(variable_ttf)
        variable_web = TTFont(variable_ttf, recalcBBoxes=False, recalcTimestamp=False)
        variable_web.flavor = "woff2"
        normalize_timestamps(variable_web)
        variable_web.save(variable_woff2)
        files.extend(validate(path) for path in (variable_ttf, variable_woff2))
        variables.append(
            {
                **variable_profile,
                "files": [variable_ttf.name, variable_woff2.name],
                "namedInstances": len(STYLE_SPECS),
                "editorialFeatures": sorted(REQUIRED_EDITORIAL_FEATURES),
            }
        )

        for spec in STYLE_SPECS:
            static_font = instantiateVariableFont(
                TTFont(variable_ttf, recalcBBoxes=False, recalcTimestamp=False),
                {"wght": float(spec["weight"]), "opsz": float(spec["opsz"])},
                inplace=False,
                optimize=True,
            )
            if CLEAN_OUTLINES:
                sidebearing_report = {
                    "adjustments": 0,
                    "policy": "upstream metrics preserved",
                }
            else:
                sidebearing_report = enforce_optical_sidebearings(static_font, int(spec["weight"]))
            set_static_metadata(static_font, spec, italic)
            _, file_style = style_names(spec, italic)
            stem = f"UMSans-{file_style}"
            ttf_path = OUTPUT / f"{stem}.ttf"
            otf_path = OUTPUT / f"{stem}.otf"
            woff2_path = OUTPUT / f"{stem}.woff2"
            static_font.flavor = None
            static_font.save(ttf_path)
            build_cff_otf(static_font, otf_path, spec, italic)
            hinting_report = autohint_ttf(ttf_path)
            webfont = TTFont(ttf_path, recalcBBoxes=False, recalcTimestamp=False)
            webfont.flavor = "woff2"
            normalize_timestamps(webfont)
            webfont.save(woff2_path)
            files.extend(validate(path) for path in (ttf_path, otf_path, woff2_path))
            profiles.append(
                {
                    "style": style_names(spec, italic)[0],
                    "fileStyle": file_style,
                    "cssWeight": int(spec["weight"]),
                    "italic": italic,
                    "role": spec["role"],
                    "opticalSize": int(spec["opsz"]),
                    "sidebearingGuard": sidebearing_report,
                    "hinting": hinting_report,
                    "rasterPolicy": "latin-truetype-hinting-grayscale-symmetric-use-typo-metrics",
                    "editorialFeatures": sorted(REQUIRED_EDITORIAL_FEATURES),
                }
            )

    shutil.copyfile(SOURCE_LICENSE, OUTPUT / "OFL-1.1.txt")
    build_report = {
        "family": FAMILY,
        "version": VERSION,
        "versionLabel": VERSION_LABEL,
        "versionSlug": VERSION_SLUG,
        "archiveName": ARCHIVE_NAME,
        "releaseStatus": "production",
        "source": source_manifest,
        "provenance": {
            "classification": "Modified OFL derivative",
            "upstream": "Inter 4.001",
            "license": "SIL Open Font License 1.1",
            "independentOutlineCopyright": False,
            "umsaContributions": (
                [
                    "commercial naming, metadata, packaging and QA",
                    "reproducible source pinning and release engineering",
                ]
                if CLEAN_OUTLINES
                else [
                    "technical I/l disambiguation defaults",
                    "governed optical proportions and width profiles",
                    "weight-axis response curve",
                    "editorial sidebearing guards",
                    "Spanish and technical kerning additions",
                    "commercial naming, metadata, packaging and QA",
                ]
            ),
        },
        "outlinePolicy": "upstream-contour-equivalent" if CLEAN_OUTLINES else "modified-contours",
        "cleanOutlines": CLEAN_OUTLINES,
        "staticStyles": len(profiles),
        "variableStyles": len(variables),
        "profiles": profiles,
        "variables": variables,
        "files": files,
    }
    (OUTPUT / "build-report.json").write_text(
        json.dumps(build_report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    archive_path = package_release()

    print(
        json.dumps(
            {
                "output": str(OUTPUT),
                "version": VERSION_LABEL,
                "staticStyles": len(profiles),
                "variableStyles": len(variables),
                "generatedFiles": len(files),
                "archive": archive_path.name,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
