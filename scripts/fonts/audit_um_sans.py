#!/usr/bin/env python3
"""Release gate for the complete UM Sans 1.2 Production family.

The audit is intentionally stricter than a file-presence check. It verifies the
18 named cuts, both variable fonts, Spanish/editorial coverage, OpenType
behavior, interpolation, spacing, rasterization, desktop identity and the
deterministic release archive.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Optional

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from package_um_sans import package_release


ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = ROOT / "public" / "fonts" / "um-sans"
QA_REPORT = FONT_DIR / "qa-report.json"
BUILD_REPORT = FONT_DIR / "build-report.json"
ARCHIVE = FONT_DIR / "UMSans-1.2-Production.zip"
PACKAGE_ROOT = "UMSans-1.2-Production"
EXPECTED_VERSION = "Version 1.200"
VERSION_LABEL = "1.2 Production"
ZIP_TIMESTAMP = (2026, 7, 13, 0, 0, 0)

WEIGHTS = (
    ("Thin", 100),
    ("ExtraLight", 200),
    ("Light", 300),
    ("Regular", 400),
    ("Medium", 500),
    ("SemiBold", 600),
    ("Bold", 700),
    ("ExtraBold", 800),
    ("Black", 900),
)
STATIC_STYLES = tuple(
    {
        "style": name,
        "fileStyle": name,
        "weight": weight,
        "italic": False,
    }
    for name, weight in WEIGHTS
) + tuple(
    {
        "style": "Italic" if weight == 400 else f"{name} Italic",
        "fileStyle": "Italic" if weight == 400 else f"{name}Italic",
        "weight": weight,
        "italic": True,
    }
    for name, weight in WEIGHTS
)
VARIABLE_STYLES = (
    {"fileStyle": "Variable", "italic": False},
    {"fileStyle": "VariableItalic", "italic": True},
)
FORMATS = ("ttf", "otf", "woff2")

REQUIRED_TEXT = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "ÁÉÍÓÚÜÑáéíóúüñ¿¡0123456789"
    ".,:;!?@#%&/()[]{}+-=_€$£¥°±×©®™«»“”‘’–—"
)
SPANISH_PROOF = (
    "¿Qué operación continúa? ÁÉÍÓÚÜÑ áéíóúüñ. "
    "«Fibra, energía y precisión»: $ 1.234.567,89; € 10.000; £ 250; ¥ 800. "
    "SLA 99,9% ± 0,1% a 24° durante 24/7 — UMSA™ © 2026."
)
ITALIC_PROOF = (
    "Alcance verificado, documentación entregada y continuidad operativa. "
    "Mendoza, Cuyo y Patagonia — revisión técnica Nº 24/7."
)
REQUIRED_GSUB_FEATURES = {
    "aalt", "calt", "case", "dlig", "dnom", "frac", "locl",
    "numr", "ordn", "pnum", "salt", "sinf", "ss01", "ss02", "ss03",
    "ss04", "ss05", "ss06", "ss07", "ss08", "subs", "sups", "tnum",
    "zero",
}
REQUIRED_GPOS_FEATURES = {"cpsp", "kern"}
SIDEBEARING_GLYPHS = (
    "abcdeghiklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789&@%$€£¥¿¡"
)
MIN_SIDEBEARING = {
    100: 34, 200: 32, 300: 30, 400: 28, 500: 25,
    600: 22, 700: 20, 800: 18, 900: 16,
}
CRITICAL_KERN_PAIRS = ("Té", "Vá", "AV", "YA", "r,", "¿A")
RASTER_PROOFS = (
    (11, "Mendoza 24/7 · precisión y señal."),
    (16, SPANISH_PROOF),
    (56, "Fibra certificada, operación continua. 518 / 99,9%"),
)


def name_value(font: TTFont, name_id: int) -> str:
    values = []
    for record in font["name"].names:
        if record.nameID != name_id:
            continue
        try:
            values.append(record.toUnicode())
        except UnicodeDecodeError:
            continue
    return values[0] if values else ""


def legacy_names(spec: dict[str, object]) -> tuple[str, str]:
    weight = int(spec["weight"])
    italic = bool(spec["italic"])
    weight_name = str(spec["style"]).replace(" Italic", "")
    if weight in {400, 700}:
        family = "UM Sans"
        if weight == 700 and italic:
            subfamily = "Bold Italic"
        elif weight == 700:
            subfamily = "Bold"
        elif italic:
            subfamily = "Italic"
        else:
            subfamily = "Regular"
    else:
        family = f"UM Sans {weight_name}"
        subfamily = "Italic" if italic else "Regular"
    return family, subfamily


def average_width(font: TTFont) -> int:
    widths = [advance for advance, _ in font["hmtx"].metrics.values() if advance > 0]
    return round(sum(widths) / len(widths))


def case_mapping_is_closed(font: TTFont) -> bool:
    cmap = font.getBestCmap()
    exceptions = {0x039C, 0x03BC, 0x03A9, 0x03C9}
    for codepoint in cmap:
        if codepoint in exceptions:
            continue
        character = chr(codepoint)
        if not character.isalpha():
            continue
        counterpart = character.swapcase()
        if len(counterpart) == 1 and counterpart != character and ord(counterpart) not in cmap:
            return False
    return True


def stat_axis_tags(font: TTFont) -> set[str]:
    if "STAT" not in font or not font["STAT"].table.DesignAxisRecord:
        return set()
    return {
        axis.AxisTag
        for axis in font["STAT"].table.DesignAxisRecord.Axis
    }


def stat_values(font: TTFont, tag: str) -> set[float]:
    stat = font["STAT"].table
    axes = stat.DesignAxisRecord.Axis
    axis_index = next(
        (index for index, axis in enumerate(axes) if axis.AxisTag == tag),
        None,
    )
    if axis_index is None or not stat.AxisValueArray:
        return set()
    values = set()
    for record in stat.AxisValueArray.AxisValue:
        if getattr(record, "AxisIndex", None) != axis_index:
            continue
        value = getattr(record, "Value", None)
        if value is None:
            value = getattr(record, "NominalValue", None)
        if value is not None:
            values.add(float(value))
    return values


def feature_tags(font: TTFont, table: str) -> set[str]:
    if table not in font or not font[table].table.FeatureList:
        return set()
    return {
        record.FeatureTag
        for record in font[table].table.FeatureList.FeatureRecord
    }


def glyph_bounds(
    font: TTFont,
    glyph_name: str,
) -> Optional[tuple[float, float, float, float]]:
    glyph_set = font.getGlyphSet()
    pen = BoundsPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return pen.bounds


def instructed_glyph_count(font: TTFont) -> int:
    if "glyf" not in font:
        return 0
    glyf = font["glyf"]
    instructed = 0
    for glyph in glyf.glyphs.values():
        glyph.expand(glyf)
        if hasattr(glyph, "program") and glyph.program.getBytecode():
            instructed += 1
    return instructed


def minimum_guarded_sidebearing(font: TTFont) -> int:
    cmap = font.getBestCmap()
    minimum = 1_000_000
    for character in SIDEBEARING_GLYPHS:
        glyph_name = cmap.get(ord(character))
        if not glyph_name:
            continue
        bounds = glyph_bounds(font, glyph_name)
        if not bounds:
            continue
        width = bounds[2] - bounds[0]
        advance, left_bearing = font["hmtx"].metrics[glyph_name]
        right_bearing = round(advance - left_bearing - width)
        minimum = min(minimum, round(left_bearing), right_bearing)
    return minimum


def run_harfbuzz(font_path: Path, text: str, features: str) -> str:
    completed = subprocess.run(
        [
            "hb-shape",
            str(font_path),
            text,
            "--language=es",
            "--script=latn",
            "--shapers=ot",
            f"--features={features}",
            "--verify",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def shaped_advances(shaped: str) -> list[int]:
    return [int(value) for value in re.findall(r"\+(-?\d+)", shaped)]


def shape_total(font_path: Path, text: str, features: str) -> int:
    return sum(shaped_advances(run_harfbuzz(font_path, text, features)))


def write_deterministic_zip_entry(
    archive: zipfile.ZipFile,
    name: str,
    payload: bytes,
) -> None:
    entry = zipfile.ZipInfo(name, ZIP_TIMESTAMP)
    entry.compress_type = zipfile.ZIP_DEFLATED
    entry.external_attr = 0o644 << 16
    archive.writestr(entry, payload)


def static_file_checks(
    path: Path,
    spec: dict[str, object],
    reference_metrics: tuple[int, ...],
) -> tuple[dict[str, object], list[str]]:
    font = TTFont(path)
    cmap = font.getBestCmap()
    os2 = font["OS/2"]
    file_format = path.suffix.removeprefix(".")
    italic = bool(spec["italic"])
    weight = int(spec["weight"])
    vertical_metrics = (
        os2.sxHeight,
        os2.sCapHeight,
        os2.sTypoAscender,
        os2.sTypoDescender,
        os2.sTypoLineGap,
        font["hhea"].lineGap,
    )
    missing = [character for character in REQUIRED_TEXT if ord(character) not in cmap]
    gsub = feature_tags(font, "GSUB")
    gpos = feature_tags(font, "GPOS")
    instructed = instructed_glyph_count(font)
    minimum_sidebearing = minimum_guarded_sidebearing(font)
    lower_l = cmap.get(ord("l"))
    upper_i = cmap.get(ord("I"))
    lower_l_bounds = glyph_bounds(font, lower_l) if lower_l else None
    upper_i_bounds = glyph_bounds(font, upper_i) if upper_i else None
    legacy_family, legacy_subfamily = legacy_names(spec)
    names = [
        record.toUnicode()
        for record in font["name"].names
        if record.platformID == 3
    ]

    checks = {
        "legacyFamily": name_value(font, 1) == legacy_family,
        "legacySubfamily": name_value(font, 2) == legacy_subfamily,
        "typographicFamily": name_value(font, 16) == "UM Sans",
        "typographicStyle": name_value(font, 17) == spec["style"],
        "version": EXPECTED_VERSION in name_value(font, 5),
        "weight": os2.usWeightClass == weight,
        "italic": bool(os2.fsSelection & 1) == italic,
        "italicAngle": font["post"].italicAngle == (-9 if italic else 0),
        "coverage": not missing and len(cmap) >= 1_100,
        "caseMappingClosed": case_mapping_is_closed(font),
        "glyphCount": len(font.getGlyphOrder()) >= (1_750 if italic else 1_790),
        "verticalMetrics": vertical_metrics[2:] == reference_metrics[2:]
        and vertical_metrics[1] == reference_metrics[1]
        and 1_040 <= vertical_metrics[0] <= 1_130,
        "layoutTables": all(table in font for table in ("GDEF", "GPOS", "GSUB")),
        "gsubFeatures": REQUIRED_GSUB_FEATURES.issubset(gsub),
        "gposFeatures": REQUIRED_GPOS_FEATURES.issubset(gpos),
        "outlineTable": (file_format == "otf" and "CFF " in font)
        or (file_format != "otf" and "glyf" in font),
        "installableEmbedding": os2.fsType == 0,
        "useTypoMetrics": os2.version >= 4 and bool(os2.fsSelection & (1 << 7)),
        "wwsSelection": os2.version >= 4 and bool(os2.fsSelection & (1 << 8)),
        "zeroLineGap": os2.sTypoLineGap == 0 and font["hhea"].lineGap == 0,
        "rasterTable": "gasp" in font,
        "wwsNames": name_value(font, 21) == legacy_family
        and name_value(font, 22) == legacy_subfamily,
        "legalMetadata": (
            "The Inter Project Authors" in name_value(font, 0)
            and "ULTIMA MILLA S.A." in name_value(font, 0)
            and "UM Sans is a trademark" in name_value(font, 7)
            and "SIL Open Font License" in name_value(font, 13)
        ),
        "noBlindUpstreamRename": not any(
            "The UM Sans Project Authors" in value or "UM Sans UI" in value
            for value in names
        ),
        "noMacNames": not any(record.platformID == 1 for record in font["name"].names),
        "statAxes": stat_axis_tags(font) == {"opsz", "wght", "ital"},
        "averageWidth": os2.xAvgCharWidth == average_width(font),
        "caretSlope": font["hhea"].caretSlopeRun == (
            round(2048 * 0.1583844403) if italic else 0
        ),
        "guardedSidebearings": minimum_sidebearing >= MIN_SIDEBEARING[weight],
        "distinctLowercaseL": bool(
            lower_l_bounds
            and upper_i_bounds
            and lower_l_bounds[1] <= -8
            and abs(
                (lower_l_bounds[2] - lower_l_bounds[0])
                - (upper_i_bounds[2] - upper_i_bounds[0])
            ) >= 16
        ),
        "truetypeHinting": file_format == "otf"
        or (
            all(table in font for table in ("cvt ", "fpgm", "prep"))
            and instructed >= 1_000
            and bool(font["head"].flags & (1 << 3))
            and b"\xb8\x01\xff\x85\xb0\x04\x8d"
            in font["prep"].program.getBytecode()
        ),
    }
    failed = [name for name, passed in checks.items() if not passed]
    record = {
        "file": path.name,
        "bytes": path.stat().st_size,
        "style": spec["style"],
        "weight": weight,
        "italic": italic,
        "characters": len(cmap),
        "glyphs": len(font.getGlyphOrder()),
        "minimumGuardedSidebearing": minimum_sidebearing,
        "instructedGlyphs": instructed,
        "gsubFeatures": sorted(gsub),
        "gposFeatures": sorted(gpos),
        "checks": checks,
    }
    return record, failed


def variable_file_checks(
    path: Path,
    expected_italic: bool,
) -> tuple[dict[str, object], list[str]]:
    font = TTFont(path)
    cmap = font.getBestCmap()
    os2 = font["OS/2"]
    axes = {
        axis.axisTag: (axis.minValue, axis.defaultValue, axis.maxValue)
        for axis in font["fvar"].axes
    }
    gsub = feature_tags(font, "GSUB")
    gpos = feature_tags(font, "GPOS")
    default_instances = [
        instance
        for instance in font["fvar"].instances
        if instance.coordinates == {"opsz": 14.0, "wght": 400.0}
    ]
    default_postscript = ""
    if default_instances:
        default_postscript = name_value(font, default_instances[0].postscriptNameID)
    expected_postscript = "UMSans-VariableItalic" if expected_italic else "UMSans-Variable"
    corner_checks = []
    for optical_size in (14, 32):
        for weight in (100, 400, 700, 900):
            instance = instantiateVariableFont(
                TTFont(path, recalcBBoxes=False, recalcTimestamp=False),
                {"opsz": optical_size, "wght": weight},
                inplace=False,
                optimize=True,
            )
            corner_checks.append(
                {
                    "opsz": optical_size,
                    "weight": weight,
                    "minimumSidebearing": minimum_guarded_sidebearing(instance),
                    "glyphs": len(instance.getGlyphOrder()),
                    "passes": len(instance.getBestCmap()) >= 1_100
                    and len(instance.getGlyphOrder()) >= 1_750,
                }
            )

    checks = {
        "legacyFamily": name_value(font, 1) == "UM Sans Variable",
        "typographicFamily": name_value(font, 16) == "UM Sans",
        "version": EXPECTED_VERSION in name_value(font, 5),
        "italic": bool(os2.fsSelection & 1) == expected_italic,
        "italicAngle": font["post"].italicAngle == (-9 if expected_italic else 0),
        "coverage": all(ord(character) in cmap for character in REQUIRED_TEXT),
        "caseMappingClosed": case_mapping_is_closed(font),
        "axes": axes == {"opsz": (14.0, 14.0, 32.0), "wght": (100.0, 400.0, 900.0)},
        "namedInstances": len(font["fvar"].instances) == 9,
        "defaultInstanceName": len(default_instances) == 1
        and default_postscript == expected_postscript,
        "variationTables": all(table in font for table in ("avar", "fvar", "gvar", "HVAR")),
        "statAxes": stat_axis_tags(font) == {"opsz", "wght", "ital"},
        "statOpticalValues": {14.0, 18.0, 24.0, 32.0}.issubset(
            stat_values(font, "opsz")
        ),
        "statWeightValues": {100.0, 200.0, 300.0, 400.0, 500.0, 600.0, 700.0, 800.0, 900.0}.issubset(
            stat_values(font, "wght")
        ),
        "gsubFeatures": REQUIRED_GSUB_FEATURES.issubset(gsub),
        "gposFeatures": REQUIRED_GPOS_FEATURES.issubset(gpos),
        "installableEmbedding": os2.fsType == 0,
        "legalMetadata": (
            "The Inter Project Authors" in name_value(font, 0)
            and "ULTIMA MILLA S.A." in name_value(font, 0)
            and "UM Sans is a trademark" in name_value(font, 7)
        ),
        "noMacNames": not any(record.platformID == 1 for record in font["name"].names),
        "averageWidth": os2.xAvgCharWidth == average_width(font),
        "smartDropout": "prep" in font
        and b"\xb8\x01\xff\x85\xb0\x04\x8d"
        in font["prep"].program.getBytecode(),
        "corners": all(check["passes"] for check in corner_checks),
    }
    failed = [name for name, passed in checks.items() if not passed]
    return {
        "file": path.name,
        "bytes": path.stat().st_size,
        "italic": expected_italic,
        "characters": len(cmap),
        "glyphs": len(font.getGlyphOrder()),
        "axes": {tag: list(values) for tag, values in axes.items()},
        "cornerChecks": corner_checks,
        "checks": checks,
    }, failed


def audit_shaping(failures: list[str]) -> dict[str, object]:
    result: dict[str, object] = {"available": bool(shutil.which("hb-shape"))}
    if not result["available"]:
        failures.append("HarfBuzz is required for the editorial shaping gate")
        return result

    styles = {}
    for spec in STATIC_STYLES:
        path = FONT_DIR / f"UMSans-{spec['fileStyle']}.ttf"
        proof = ITALIC_PROOF if spec["italic"] else SPANISH_PROOF
        shaped = run_harfbuzz(path, proof, "kern,calt,locl")
        tabular = shaped_advances(run_harfbuzz(path, "0123456789", "tnum"))
        pair_deltas = {
            pair: shape_total(path, pair, "kern") - shape_total(path, pair, "-kern")
            for pair in CRITICAL_KERN_PAIRS
        }
        feature_differences = {
            "frac": run_harfbuzz(path, "1/2 3/4", "frac")
            != run_harfbuzz(path, "1/2 3/4", "-frac"),
            "zero": run_harfbuzz(path, "0 100 2026", "zero")
            != run_harfbuzz(path, "0 100 2026", "-zero"),
            "sups": run_harfbuzz(path, "H2O 24", "sups")
            != run_harfbuzz(path, "H2O 24", "-sups"),
        }
        passes = (
            ".notdef" not in shaped
            and len(set(tabular)) == 1
            and all(delta < 0 for delta in pair_deltas.values())
            and all(feature_differences.values())
        )
        styles[str(spec["fileStyle"])] = {
            "tabularAdvances": tabular,
            "tabularUniform": len(set(tabular)) == 1,
            "criticalPairDeltas": pair_deltas,
            "featureDifferences": feature_differences,
            "notdef": ".notdef" in shaped,
            "passes": passes,
        }
        if not passes:
            failures.append(f"HarfBuzz shaping gate failed: {spec['fileStyle']}")
    result["styles"] = styles
    result["passes"] = all(style["passes"] for style in styles.values())
    return result


def audit_rasterization(failures: list[str]) -> dict[str, object]:
    result: dict[str, object] = {"available": bool(shutil.which("magick"))}
    if not result["available"]:
        failures.append("ImageMagick is required for the raster gate")
        return result
    checks = []
    for spec in STATIC_STYLES:
        path = FONT_DIR / f"UMSans-{spec['fileStyle']}.ttf"
        for point_size, proof in RASTER_PROOFS:
            completed = subprocess.run(
                [
                    "magick", "-background", "white", "-fill", "black",
                    "-font", str(path), "-pointsize", str(point_size),
                    f"label:{proof}", "png:-",
                ],
                check=False,
                capture_output=True,
            )
            passed = completed.returncode == 0 and len(completed.stdout) > 1_000
            checks.append(
                {
                    "style": spec["fileStyle"],
                    "pointSize": point_size,
                    "bytes": len(completed.stdout),
                    "passes": passed,
                }
            )
            if not passed:
                failures.append(
                    f"Raster gate failed: {spec['fileStyle']} at {point_size}px"
                )
    result["checks"] = checks
    result["passes"] = all(check["passes"] for check in checks)
    return result


def audit_desktop_install(failures: list[str]) -> dict[str, object]:
    result: dict[str, object] = {"available": bool(shutil.which("fc-scan"))}
    if not result["available"]:
        failures.append("fontconfig fc-scan is required for the install gate")
        return result
    checks = []
    for spec in STATIC_STYLES:
        for file_format in ("ttf", "otf"):
            path = FONT_DIR / f"UMSans-{spec['fileStyle']}.{file_format}"
            completed = subprocess.run(
                [
                    "fc-scan", "--format",
                    "%{family[0]}|%{style[0]}|%{fontversion}",
                    str(path),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            identity = completed.stdout.strip()
            expected_family, expected_style = legacy_names(spec)
            expected_prefix = f"{expected_family}|{expected_style}|"
            passed = completed.returncode == 0 and identity.startswith(expected_prefix)
            checks.append({"file": path.name, "identity": identity, "passes": passed})
            if not passed:
                failures.append(f"Desktop install gate failed: {path.name} ({identity})")
    result["checks"] = checks
    result["passes"] = all(check["passes"] for check in checks)
    return result


def audit_archive(expected_files: set[str], failures: list[str]) -> dict[str, object]:
    if not ARCHIVE.exists():
        failures.append(f"Missing release archive: {ARCHIVE.name}")
        return {"exists": False, "passes": False}
    with zipfile.ZipFile(ARCHIVE, "r") as archive:
        names = set(archive.namelist())
    required = {
        f"{PACKAGE_ROOT}/Desktop/OTF/{name}"
        for name in expected_files
        if name.endswith(".otf")
    } | {
        f"{PACKAGE_ROOT}/Desktop/TTF/{name}"
        for name in expected_files
        if name.endswith(".ttf") and "Variable" not in name
    } | {
        f"{PACKAGE_ROOT}/Variable/{name}"
        for name in expected_files
        if "Variable" in name
    } | {
        f"{PACKAGE_ROOT}/Web/WOFF2/{name}"
        for name in expected_files
        if name.endswith(".woff2")
    } | {
        f"{PACKAGE_ROOT}/README.md",
        f"{PACKAGE_ROOT}/CHECKSUMS.sha256",
        f"{PACKAGE_ROOT}/release-manifest.json",
        f"{PACKAGE_ROOT}/Web/um-sans.css",
        f"{PACKAGE_ROOT}/Web/um-sans-variable.css",
        f"{PACKAGE_ROOT}/Web/um-sans-static.css",
        f"{PACKAGE_ROOT}/Web/um-sans-latin-core.css",
        f"{PACKAGE_ROOT}/Web/um-sans-fallback.css",
        f"{PACKAGE_ROOT}/Web/package.json",
        f"{PACKAGE_ROOT}/Web/webfont-manifest.json",
        f"{PACKAGE_ROOT}/Web/Subset/UMSans-Variable-LatinCore.woff2",
        f"{PACKAGE_ROOT}/Web/Subset/UMSans-VariableItalic-LatinCore.woff2",
        f"{PACKAGE_ROOT}/Metadata/family-metadata.json",
        f"{PACKAGE_ROOT}/Metadata/unicode-coverage.json",
        f"{PACKAGE_ROOT}/Metadata/character-set.txt",
        f"{PACKAGE_ROOT}/Metadata/glyph-order.txt",
        f"{PACKAGE_ROOT}/Metadata/binary-inventory.json",
        f"{PACKAGE_ROOT}/Metadata/variable-model.json",
        f"{PACKAGE_ROOT}/Metadata/embedding-rights.json",
        f"{PACKAGE_ROOT}/Metadata/name-table.json",
        f"{PACKAGE_ROOT}/Metadata/release-provenance.json",
        f"{PACKAGE_ROOT}/Metadata/sbom.spdx.json",
        f"{PACKAGE_ROOT}/Documentation/OFL-1.1.txt",
        f"{PACKAGE_ROOT}/Documentation/LICENSE-GUIDE.md",
        f"{PACKAGE_ROOT}/Documentation/EULA-NOTICE.md",
        f"{PACKAGE_ROOT}/Documentation/INSTALL.md",
        f"{PACKAGE_ROOT}/Documentation/FONTLOG.txt",
        f"{PACKAGE_ROOT}/Documentation/OPENTYPE-FEATURES.md",
        f"{PACKAGE_ROOT}/Documentation/SOURCE-AND-BUILD.md",
        f"{PACKAGE_ROOT}/Documentation/MARKET-DELIVERABLES.md",
        f"{PACKAGE_ROOT}/Documentation/ORIGINALITY-ROADMAP.md",
        f"{PACKAGE_ROOT}/Documentation/QA-NOTES.md",
        f"{PACKAGE_ROOT}/Documentation/COMPATIBILITY-MATRIX.md",
        f"{PACKAGE_ROOT}/Documentation/RELEASE-CHECKLIST.md",
        f"{PACKAGE_ROOT}/Documentation/FAMILY-NAMING.md",
        f"{PACKAGE_ROOT}/Documentation/DESIGN-QA-PROTOCOL.md",
        f"{PACKAGE_ROOT}/Documentation/FONT-METRICS.md",
        f"{PACKAGE_ROOT}/Documentation/VERSIONING.md",
        f"{PACKAGE_ROOT}/Documentation/UM-SANS-2.0-ORIGINAL-BRIEF.md",
        f"{PACKAGE_ROOT}/Documentation/ACCESSIBILITY-READABILITY.md",
        f"{PACKAGE_ROOT}/Documentation/EMBEDDING-AND-CHANNELS.md",
        f"{PACKAGE_ROOT}/Documentation/PROCUREMENT-DATASHEET.md",
        f"{PACKAGE_ROOT}/Documentation/MIGRATION-GUIDE.md",
        f"{PACKAGE_ROOT}/Documentation/KNOWN-ISSUES.md",
        f"{PACKAGE_ROOT}/Documentation/PRINT-PDF-GUIDE.md",
        f"{PACKAGE_ROOT}/Documentation/VARIABLE-MODEL.md",
        f"{PACKAGE_ROOT}/Documentation/SUPPLY-CHAIN-PROVENANCE.md",
        f"{PACKAGE_ROOT}/Documentation/FORMAT-SUPPORT-POLICY.md",
        f"{PACKAGE_ROOT}/Specimen/SPECIMEN.html",
        f"{PACKAGE_ROOT}/Source/source-manifest.json",
        f"{PACKAGE_ROOT}/Source/build_um_sans.py",
        f"{PACKAGE_ROOT}/Source/audit_um_sans.py",
        f"{PACKAGE_ROOT}/Source/audit_um_sans_fontbakery.py",
        f"{PACKAGE_ROOT}/Source/audit_um_sans_pdf.sh",
        f"{PACKAGE_ROOT}/Source/package_um_sans.py",
        f"{PACKAGE_ROOT}/Source/run_font_python.sh",
        f"{PACKAGE_ROOT}/Source/requirements.txt",
        f"{PACKAGE_ROOT}/QA/build-report.json",
    }
    if (FONT_DIR / "qa-report.json").exists():
        required.add(f"{PACKAGE_ROOT}/QA/qa-report.json")
    if (FONT_DIR / "fontbakery-report.json").exists():
        required.add(f"{PACKAGE_ROOT}/QA/fontbakery-report.json")
        required.add(f"{PACKAGE_ROOT}/QA/fontbakery-report.md")
    if (FONT_DIR / "specimen-audit.pdf").exists():
        required.add(f"{PACKAGE_ROOT}/QA/specimen-audit.pdf")
    missing = sorted(required - names)
    passes = not missing and ARCHIVE.stat().st_size > 2_000_000
    if not passes:
        failures.append(f"Release archive contract failed: missing={missing}")
    return {
        "exists": True,
        "file": ARCHIVE.name,
        "entries": len(names),
        "missing": missing,
        "passes": passes,
    }


def audit_market_delivery(failures: list[str]) -> dict[str, object]:
    required_assets = (
        "um-sans.css",
        "um-sans-variable.css",
        "um-sans-static.css",
        "um-sans-latin-core.css",
        "um-sans-fallback.css",
        "family-metadata.json",
        "unicode-coverage.json",
        "character-set.txt",
        "glyph-order.txt",
        "binary-inventory.json",
        "variable-model.json",
        "embedding-rights.json",
        "name-table.json",
        "release-provenance.json",
        "sbom.spdx.json",
        "webfont-manifest.json",
        "subset/UMSans-Variable-LatinCore.woff2",
        "subset/UMSans-VariableItalic-LatinCore.woff2",
    )
    checks: dict[str, bool] = {
        f"asset:{name}": (FONT_DIR / name).exists()
        for name in required_assets
    }

    metadata_path = FONT_DIR / "family-metadata.json"
    coverage_path = FONT_DIR / "unicode-coverage.json"
    binary_inventory_path = FONT_DIR / "binary-inventory.json"
    variable_model_path = FONT_DIR / "variable-model.json"
    embedding_path = FONT_DIR / "embedding-rights.json"
    name_table_path = FONT_DIR / "name-table.json"
    provenance_path = FONT_DIR / "release-provenance.json"
    sbom_path = FONT_DIR / "sbom.spdx.json"
    if (
        metadata_path.exists()
        and coverage_path.exists()
        and binary_inventory_path.exists()
        and variable_model_path.exists()
        and embedding_path.exists()
        and name_table_path.exists()
        and provenance_path.exists()
        and sbom_path.exists()
    ):
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        coverage = json.loads(coverage_path.read_text(encoding="utf-8"))
        binary_inventory = json.loads(binary_inventory_path.read_text(encoding="utf-8"))
        variable_models = json.loads(variable_model_path.read_text(encoding="utf-8"))
        embedding = json.loads(embedding_path.read_text(encoding="utf-8"))
        names = json.loads(name_table_path.read_text(encoding="utf-8"))
        provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
        sbom = json.loads(sbom_path.read_text(encoding="utf-8"))
        checks.update(
            {
                "metadata:family": metadata.get("family") == "UM Sans",
                "metadata:version": metadata.get("version") == VERSION_LABEL,
                "metadata:honestProvenance": metadata.get("provenance", {}).get(
                    "independentOutlineCopyright"
                ) is False,
                "metadata:fallbackCalibrated": metadata.get("web", {})
                .get("fallbackMetrics", {})
                .get("sizeAdjustPercent")
                == 112.33,
                "coverage:characters": coverage.get("characters") == 1204,
                "coverage:codepoints": len(coverage.get("codepoints", [])) == 1204,
                "inventory:binaries": len(binary_inventory.get("files", [])) == 58,
                "variable:models": len(variable_models.get("models", [])) == 2,
                "variable:instances": all(
                    len(model.get("namedInstances", [])) == 9
                    for model in variable_models.get("models", [])
                ),
                "embedding:installable": embedding.get("allBinariesInstallable") is True,
                "names:profiles": len(names.get("profiles", [])) == 20,
                "provenance:subjects": len(provenance.get("subjects", [])) == 58,
                "provenance:sourcePinned": len(
                    provenance.get("source", {}).get("googleFontsCommit", "")
                ) == 40,
                "provenance:unsignedHonest": provenance.get("attestation", {}).get(
                    "signed"
                ) is False,
                "sbom:spdx23": sbom.get("spdxVersion") == "SPDX-2.3",
                "sbom:packages": len(sbom.get("packages", [])) == 2,
                "sbom:generatedFrom": any(
                    relationship.get("relationshipType") == "GENERATED_FROM"
                    for relationship in sbom.get("relationships", [])
                ),
            }
        )

    for style in ("Variable", "VariableItalic"):
        subset_path = FONT_DIR / "subset" / f"UMSans-{style}-LatinCore.woff2"
        if not subset_path.exists():
            continue
        font = TTFont(subset_path)
        cmap = font.getBestCmap()
        checks[f"subset:{style}:spanish"] = all(
            ord(character) in cmap
            for character in "ÁÉÍÓÚÜÑáéíóúüñ¿¡"
        )
        checks[f"subset:{style}:variable"] = "fvar" in font
        checks[f"subset:{style}:size"] = subset_path.stat().st_size > 80_000

    variable_css = FONT_DIR / "um-sans-variable.css"
    latin_css = FONT_DIR / "um-sans-latin-core.css"
    if variable_css.exists() and latin_css.exists():
        variable_text = variable_css.read_text(encoding="utf-8")
        latin_text = latin_css.read_text(encoding="utf-8")
        checks["css:publicPaths"] = (
            "url('./UMSans-Variable.woff2')" in variable_text
            and "./WOFF2/" not in variable_text
        )
        checks["css:fallbackMetrics"] = (
            "size-adjust: 112.33%" in variable_text
            and "ascent-override: 86.24%" in variable_text
        )
        checks["css:latinUnicodeRange"] = "unicode-range:" in latin_text

    failed = sorted(name for name, passed in checks.items() if not passed)
    if failed:
        failures.append(f"Market delivery contract failed: {', '.join(failed)}")
    return {
        "passes": not failed,
        "checks": checks,
        "failed": failed,
    }


def audit() -> dict[str, object]:
    failures: list[str] = []
    build_report = json.loads(BUILD_REPORT.read_text(encoding="utf-8"))
    expected_files = {
        f"UMSans-{spec['fileStyle']}.{file_format}"
        for spec in STATIC_STYLES
        for file_format in FORMATS
    } | {
        f"UMSans-{spec['fileStyle']}.{file_format}"
        for spec in VARIABLE_STYLES
        for file_format in ("ttf", "woff2")
    }

    build_contract = {
        "family": build_report.get("family") == "UM Sans",
        "version": build_report.get("versionLabel") == VERSION_LABEL,
        "staticStyles": build_report.get("staticStyles") == 18,
        "variableStyles": build_report.get("variableStyles") == 2,
        "generatedFiles": len(build_report.get("files", [])) == 58,
        "sourcePinned": len(build_report.get("source", {}).get("googleFontsCommit", "")) == 40,
        "sourceLicensePinned": any(
            file.get("file") == "OFL.txt" and len(file.get("sha256", "")) == 64
            for file in build_report.get("source", {}).get("files", [])
        ),
        "honestProvenance": build_report.get("provenance", {}).get("classification")
        == "Modified OFL derivative"
        and build_report.get("provenance", {}).get("independentOutlineCopyright") is False,
        "genuineItalics": sum(
            1 for profile in build_report.get("profiles", []) if profile.get("italic")
        ) == 9,
        "weightMatrix": sorted(
            profile["cssWeight"]
            for profile in build_report.get("profiles", [])
            if not profile.get("italic")
        ) == [weight for _, weight in WEIGHTS],
        "hintedStatics": all(
            profile["hinting"]["instructedGlyphs"] >= 1_000
            for profile in build_report.get("profiles", [])
        ),
        "sidebearingGuard": all(
            profile["sidebearingGuard"]["minimumAfterUnits"]
            >= profile["sidebearingGuard"]["minimumTargetUnits"]
            for profile in build_report.get("profiles", [])
        ),
        "signatureDefaults": all(
            variable.get("defaultAlternates") == 2
            for variable in build_report.get("variables", [])
        ),
    }
    for italic in (False, True):
        ink = [
            file["criticalInkAreaEm2"]
            for file in build_report["files"]
            if file["file"].endswith(".ttf")
            and not file.get("axes")
            and file["italic"] == italic
        ]
        build_contract[f"progressiveInk{'Italic' if italic else 'Roman'}"] = (
            ink == sorted(ink) and len(ink) == 9 and len(set(ink)) == 9
        )
    if not all(build_contract.values()):
        failures.append("Build/profile contract failed")

    reference_font = TTFont(FONT_DIR / "UMSans-Regular.ttf")
    reference_os2 = reference_font["OS/2"]
    reference_metrics = (
        reference_os2.sxHeight,
        reference_os2.sCapHeight,
        reference_os2.sTypoAscender,
        reference_os2.sTypoDescender,
        reference_os2.sTypoLineGap,
        reference_font["hhea"].lineGap,
    )

    files = []
    for spec in STATIC_STYLES:
        for file_format in FORMATS:
            path = FONT_DIR / f"UMSans-{spec['fileStyle']}.{file_format}"
            if not path.exists():
                failures.append(f"Missing {path.name}")
                continue
            record, failed = static_file_checks(path, spec, reference_metrics)
            files.append(record)
            if failed:
                failures.append(f"{path.name}: {', '.join(failed)}")

    variable_files = []
    for spec in VARIABLE_STYLES:
        for file_format in ("ttf", "woff2"):
            path = FONT_DIR / f"UMSans-{spec['fileStyle']}.{file_format}"
            if not path.exists():
                failures.append(f"Missing {path.name}")
                continue
            record, failed = variable_file_checks(path, bool(spec["italic"]))
            variable_files.append(record)
            if failed:
                failures.append(f"{path.name}: {', '.join(failed)}")

    shaping = audit_shaping(failures)
    rasterization = audit_rasterization(failures)
    desktop_install = audit_desktop_install(failures)
    market_delivery = audit_market_delivery(failures)
    archive = audit_archive(expected_files, failures)

    result = {
        "family": "UM Sans",
        "version": VERSION_LABEL,
        "status": "pass" if not failures else "fail",
        "checkedFiles": len(files) + len(variable_files),
        "staticFiles": len(files),
        "variableFiles": len(variable_files),
        "failures": failures,
        "buildContract": build_contract,
        "files": files,
        "variables": variable_files,
        "shaping": shaping,
        "rasterization": rasterization,
        "desktopInstall": desktop_install,
        "marketDelivery": market_delivery,
        "archive": archive,
        "externalValidation": [
            "Browser PDF export with embedded UM Sans",
            "Windows DirectWrite and ClearType",
            "Microsoft Office embedding",
            "Adobe Illustrator/InDesign and prepress PDF",
            "Android and iOS physical-device rasterization",
        ],
    }
    QA_REPORT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    package_release()
    return result


def main() -> None:
    result = audit()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if result["failures"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
