#!/usr/bin/env python3
"""Assemble the deterministic UM Sans commercial-style release package."""

from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import unicodedata
import zipfile
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = ROOT / "public" / "fonts" / "um-sans"
RELEASE_DOCS = ROOT / "docs" / "typography" / "release"
SOURCE_DIR = ROOT / ".font-sources" / "um-sans"
ZIP_TIMESTAMP = (2026, 7, 13, 0, 0, 0)

STATIC_STYLES = (
    ("Thin", 100, "normal"),
    ("ThinItalic", 100, "italic"),
    ("ExtraLight", 200, "normal"),
    ("ExtraLightItalic", 200, "italic"),
    ("Light", 300, "normal"),
    ("LightItalic", 300, "italic"),
    ("Regular", 400, "normal"),
    ("Italic", 400, "italic"),
    ("Medium", 500, "normal"),
    ("MediumItalic", 500, "italic"),
    ("SemiBold", 600, "normal"),
    ("SemiBoldItalic", 600, "italic"),
    ("Bold", 700, "normal"),
    ("BoldItalic", 700, "italic"),
    ("ExtraBold", 800, "normal"),
    ("ExtraBoldItalic", 800, "italic"),
    ("Black", 900, "normal"),
    ("BlackItalic", 900, "italic"),
)

# Spanish-first web subset. Full WOFF2 files remain part of the release for
# extended Latin, Vietnamese, IPA and technical publishing.
LATIN_CORE_RANGES = (
    (0x0000, 0x00FF),
    (0x2000, 0x206F),
    (0x20AC, 0x20AC),
    (0x2113, 0x2113),
    (0x2122, 0x2122),
    (0x2190, 0x21FF),
    (0x2212, 0x2212),
    (0x25A0, 0x25FF),
    (0xFB00, 0xFB06),
)
LATIN_CORE_CSS_RANGE = (
    "U+0000-00FF,U+2000-206F,U+20AC,U+2113,U+2122,"
    "U+2190-21FF,U+2212,U+25A0-25FF,U+FB00-FB06"
)

# Calibrated against macOS Arial with the UMSA editorial corpus. The size
# adjustment prioritizes line wrapping; vertical overrides preserve UM Sans'
# typo metrics after scaling. Values are also published in family metadata.
FALLBACK_METRICS = {
    "family": "Arial",
    "sizeAdjustPercent": 112.33,
    "ascentOverridePercent": 86.24,
    "descentOverridePercent": 21.47,
    "lineGapOverridePercent": 0.0,
    "calibration": "UMSA Spanish editorial corpus",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def fallback_face() -> str:
    return f"""@font-face {{
  font-family: 'UM Sans Fallback';
  src: local('{FALLBACK_METRICS['family']}');
  size-adjust: {FALLBACK_METRICS['sizeAdjustPercent']:.2f}%;
  ascent-override: {FALLBACK_METRICS['ascentOverridePercent']:.2f}%;
  descent-override: {FALLBACK_METRICS['descentOverridePercent']:.2f}%;
  line-gap-override: {FALLBACK_METRICS['lineGapOverridePercent']:.2f}%;
}}"""


def css_tokens() -> str:
    return """:root {
  --um-font-editorial: 'UM Sans', 'UM Sans Fallback', Arial, system-ui, sans-serif;
  --um-font-display-weight: 700;
  --um-font-title-weight: 600;
  --um-font-body-weight: 400;
}

html {
  font-family: var(--um-font-editorial);
  font-optical-sizing: auto;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}"""


def variable_css(version: str, font_prefix: str, latin_core: bool = False) -> str:
    suffix = "-LatinCore" if latin_core else ""
    unicode_range = f"\n  unicode-range: {LATIN_CORE_CSS_RANGE};" if latin_core else ""
    definitions = [
        f"""@font-face {{
  font-family: 'UM Sans';
  src: url('{font_prefix}UMSans-Variable{suffix}.woff2') format('woff2');
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;{unicode_range}
}}""",
        f"""@font-face {{
  font-family: 'UM Sans';
  src: url('{font_prefix}UMSans-VariableItalic{suffix}.woff2') format('woff2');
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;{unicode_range}
}}""",
        fallback_face(),
        css_tokens(),
    ]
    return (
        f"/* UM Sans {version} · SIL OFL 1.1 · ULTIMA MILLA S.A. */\n\n"
        + "\n\n".join(definitions)
        + "\n"
    )


def static_css(version: str, font_prefix: str) -> str:
    definitions = []
    for style_name, weight, font_style in STATIC_STYLES:
        definitions.append(
            f"""@font-face {{
  font-family: 'UM Sans';
  src: url('{font_prefix}UMSans-{style_name}.woff2') format('woff2');
  font-style: {font_style};
  font-weight: {weight};
  font-display: swap;
}}"""
        )
    definitions.extend((fallback_face(), css_tokens()))
    return (
        f"/* UM Sans {version} static web kit · SIL OFL 1.1 */\n\n"
        + "\n\n".join(definitions)
        + "\n"
    )


def fallback_css(version: str) -> str:
    return (
        f"/* UM Sans {version} metric-compatible fallback · SIL OFL 1.1 */\n\n"
        + fallback_face()
        + "\n\n"
        + css_tokens()
        + "\n"
    )


def latin_core_codepoints() -> set[int]:
    return {
        codepoint
        for start, end in LATIN_CORE_RANGES
        for codepoint in range(start, end + 1)
    }


def build_latin_core_subset(source: Path, destination: Path) -> None:
    font = TTFont(source, recalcTimestamp=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    options.glyph_names = True
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=latin_core_codepoints())
    subsetter.subset(font)
    font.flavor = "woff2"
    font.recalcTimestamp = False
    destination.parent.mkdir(parents=True, exist_ok=True)
    font.save(destination, reorderTables=False)


def feature_tags(font: TTFont, table_name: str) -> list[str]:
    if table_name not in font or not font[table_name].table.FeatureList:
        return []
    return sorted(
        {record.FeatureTag for record in font[table_name].table.FeatureList.FeatureRecord}
    )


NAME_IDS = {
    0: "copyright",
    1: "legacyFamily",
    2: "legacySubfamily",
    3: "uniqueIdentifier",
    4: "fullName",
    5: "version",
    6: "postScriptName",
    16: "typographicFamily",
    17: "typographicSubfamily",
    25: "variationsPostScriptPrefix",
}


PANOSE_FIELDS = (
    "bFamilyType",
    "bSerifStyle",
    "bWeight",
    "bProportion",
    "bContrast",
    "bStrokeVariation",
    "bArmStyle",
    "bLetterForm",
    "bMidline",
    "bXHeight",
)


def debug_name(font: TTFont, name_id: int) -> str | None:
    value = font["name"].getDebugName(name_id)
    return value if value else None


def embedding_label(fs_type: int) -> str:
    if fs_type == 0:
        return "Installable embedding"
    labels = []
    for bit, label in (
        (0x0002, "Restricted license embedding"),
        (0x0004, "Preview and print embedding"),
        (0x0008, "Editable embedding"),
        (0x0100, "No subsetting"),
        (0x0200, "Bitmap embedding only"),
    ):
        if fs_type & bit:
            labels.append(label)
    return "; ".join(labels) if labels else f"Unclassified fsType {fs_type}"


def panose_record(font: TTFont) -> dict[str, int]:
    panose = font["OS/2"].panose
    return {field: int(getattr(panose, field)) for field in PANOSE_FIELDS}


def axis_record(font: TTFont) -> list[dict[str, object]]:
    if "fvar" not in font:
        return []
    return [
        {
            "tag": axis.axisTag,
            "name": debug_name(font, axis.axisNameID),
            "minimum": axis.minValue,
            "default": axis.defaultValue,
            "maximum": axis.maxValue,
        }
        for axis in font["fvar"].axes
    ]


def variable_model(font: TTFont, file_name: str) -> dict[str, object]:
    stat_axes = []
    if "STAT" in font and font["STAT"].table.DesignAxisRecord:
        stat_axes = [
            {
                "tag": axis.AxisTag,
                "name": debug_name(font, axis.AxisNameID),
                "ordering": axis.AxisOrdering,
            }
            for axis in font["STAT"].table.DesignAxisRecord.Axis
        ]
    avar_segments = {}
    if "avar" in font:
        avar_segments = {
            tag: {str(source): target for source, target in sorted(mapping.items())}
            for tag, mapping in font["avar"].segments.items()
        }
    instances = []
    for instance in font["fvar"].instances:
        instances.append(
            {
                "name": debug_name(font, instance.subfamilyNameID),
                "postScriptName": (
                    debug_name(font, instance.postscriptNameID)
                    if instance.postscriptNameID != 0xFFFF
                    else None
                ),
                "coordinates": instance.coordinates,
            }
        )
    return {
        "file": file_name,
        "axes": axis_record(font),
        "namedInstances": instances,
        "STAT": stat_axes,
        "avar": avar_segments,
        "variationTables": [
            tag for tag in ("fvar", "avar", "gvar", "HVAR", "MVAR", "STAT")
            if tag in font
        ],
    }


def font_binary_paths() -> list[Path]:
    return sorted(
        path
        for path in FONT_DIR.glob("UMSans-*.*")
        if path.suffix.lower() in {".otf", ".ttf", ".woff2"}
    )


def compact_codepoint_ranges(codepoints: list[int]) -> list[str]:
    if not codepoints:
        return []
    ranges = []
    start = previous = codepoints[0]
    for codepoint in codepoints[1:]:
        if codepoint == previous + 1:
            previous = codepoint
            continue
        ranges.append(
            f"U+{start:04X}" if start == previous else f"U+{start:04X}-{previous:04X}"
        )
        start = previous = codepoint
    ranges.append(
        f"U+{start:04X}" if start == previous else f"U+{start:04X}-{previous:04X}"
    )
    return ranges


def unicode_block_counts(codepoints: list[int]) -> dict[str, int]:
    blocks = (
        ("Basic Latin", 0x0000, 0x007F),
        ("Latin-1 Supplement", 0x0080, 0x00FF),
        ("Latin Extended-A", 0x0100, 0x017F),
        ("Latin Extended-B", 0x0180, 0x024F),
        ("IPA Extensions", 0x0250, 0x02AF),
        ("Latin Extended Additional", 0x1E00, 0x1EFF),
        ("General Punctuation", 0x2000, 0x206F),
        ("Currency Symbols", 0x20A0, 0x20CF),
        ("Letterlike Symbols", 0x2100, 0x214F),
        ("Arrows", 0x2190, 0x21FF),
        ("Mathematical Operators", 0x2200, 0x22FF),
    )
    counts = {
        name: sum(start <= codepoint <= end for codepoint in codepoints)
        for name, start, end in blocks
    }
    covered = sum(counts.values())
    counts["Other retained Unicode"] = len(codepoints) - covered
    return counts


def write_metadata(package_root: Path, report: dict[str, object]) -> None:
    metadata_dir = package_root / "Metadata"
    metadata_dir.mkdir(parents=True, exist_ok=True)
    regular = TTFont(FONT_DIR / "UMSans-Regular.ttf", recalcTimestamp=False)
    variable = TTFont(FONT_DIR / "UMSans-Variable.ttf", recalcTimestamp=False)
    cmap = regular.getBestCmap()
    codepoints = sorted(cmap)
    glyph_order = regular.getGlyphOrder()
    os2 = regular["OS/2"]
    upm = regular["head"].unitsPerEm

    family_metadata = {
        "schemaVersion": 1,
        "family": report["family"],
        "version": str(report["versionLabel"]),
        "releaseDate": "2026-07-13",
        "releaseStatus": report["releaseStatus"],
        "classification": "Modified OFL derivative of Inter 4.001",
        "license": "SIL Open Font License 1.1",
        "trademark": "UM Sans is a trademark of ULTIMA MILLA S.A.",
        "vendor": "ULTIMA MILLA S.A.",
        "provenance": report["provenance"],
        "familyMatrix": {
            "staticStyles": report["staticStyles"],
            "variableStyles": report["variableStyles"],
            "weights": list(range(100, 1000, 100)),
            "styles": ["normal", "italic"],
            "axes": {"wght": [100, 900], "opsz": [14, 32]},
        },
        "metrics": {
            "unitsPerEm": upm,
            "xHeight": os2.sxHeight,
            "capHeight": os2.sCapHeight,
            "typoAscender": os2.sTypoAscender,
            "typoDescender": os2.sTypoDescender,
            "typoLineGap": os2.sTypoLineGap,
        },
        "coverage": {
            "characters": len(codepoints),
            "romanGlyphs": len(glyph_order),
            "italicGlyphs": len(
                TTFont(FONT_DIR / "UMSans-Italic.ttf", recalcTimestamp=False).getGlyphOrder()
            ),
            "scriptsClaimed": ["Latin"],
            "scriptsNotClaimed": ["Arabic", "CJK", "Cyrillic", "Greek", "Hebrew", "Emoji"],
        },
        "openType": {
            "GSUB": feature_tags(variable, "GSUB"),
            "GPOS": feature_tags(variable, "GPOS"),
        },
        "web": {
            "fullVariableRoman": "Web/WOFF2/UMSans-Variable.woff2",
            "fullVariableItalic": "Web/WOFF2/UMSans-VariableItalic.woff2",
            "latinCoreRoman": "Web/Subset/UMSans-Variable-LatinCore.woff2",
            "latinCoreItalic": "Web/Subset/UMSans-VariableItalic-LatinCore.woff2",
            "recommendedStylesheet": "Web/um-sans-variable.css",
            "fallbackMetrics": FALLBACK_METRICS,
        },
        "source": report["source"],
    }
    write_text(
        metadata_dir / "family-metadata.json",
        json.dumps(family_metadata, indent=2, ensure_ascii=False),
    )

    coverage = {
        "schemaVersion": 1,
        "family": report["family"],
        "version": report["versionLabel"],
        "characters": len(codepoints),
        "ranges": compact_codepoint_ranges(codepoints),
        "blockCounts": unicode_block_counts(codepoints),
        "codepoints": [f"U+{codepoint:04X}" for codepoint in codepoints],
    }
    write_text(
        metadata_dir / "unicode-coverage.json",
        json.dumps(coverage, indent=2, ensure_ascii=False),
    )

    character_lines = [
        f"U+{codepoint:04X}\t{chr(codepoint) if chr(codepoint).isprintable() else ''}\t"
        f"{unicodedata.name(chr(codepoint), 'UNNAMED')}"
        for codepoint in codepoints
    ]
    write_text(metadata_dir / "character-set.txt", "\n".join(character_lines))
    write_text(
        metadata_dir / "glyph-order.txt",
        "\n".join(f"{index:04d}\t{name}" for index, name in enumerate(glyph_order)),
    )

    binary_inventory = []
    embedding_files = []
    for path in font_binary_paths():
        font = TTFont(path, recalcTimestamp=False)
        binary_os2 = font["OS/2"]
        binary_post = font["post"]
        fs_type = int(binary_os2.fsType)
        gasp = (
            {str(limit): behavior for limit, behavior in font["gasp"].gaspRange.items()}
            if "gasp" in font
            else {}
        )
        record = {
            "file": path.name,
            "format": path.suffix.removeprefix(".").upper(),
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
            "family": debug_name(font, 16) or debug_name(font, 1),
            "style": debug_name(font, 17) or debug_name(font, 2),
            "fullName": debug_name(font, 4),
            "postScriptName": debug_name(font, 6),
            "version": debug_name(font, 5),
            "glyphs": len(font.getGlyphOrder()),
            "outline": "CFF2" if "CFF2" in font else "CFF" if "CFF " in font else "glyf",
            "tables": sorted(tag for tag in font.keys() if tag != "GlyphOrder"),
            "weightClass": int(binary_os2.usWeightClass),
            "widthClass": int(binary_os2.usWidthClass),
            "italicAngle": binary_post.italicAngle,
            "vendorId": binary_os2.achVendID,
            "fsType": fs_type,
            "embedding": embedding_label(fs_type),
            "panose": panose_record(font),
            "hintingTables": [
                tag for tag in ("cvt ", "fpgm", "prep", "gasp") if tag in font
            ],
            "gasp": gasp,
            "openType": {
                "GSUB": feature_tags(font, "GSUB"),
                "GPOS": feature_tags(font, "GPOS"),
            },
            "axes": axis_record(font),
        }
        binary_inventory.append(record)
        embedding_files.append(
            {
                "file": path.name,
                "fsType": fs_type,
                "technicalPermission": embedding_label(fs_type),
            }
        )

    write_text(
        metadata_dir / "binary-inventory.json",
        json.dumps(
            {
                "schemaVersion": 1,
                "family": report["family"],
                "version": report["versionLabel"],
                "files": binary_inventory,
            },
            indent=2,
            ensure_ascii=False,
        ),
    )

    variable_models = []
    for path in (
        FONT_DIR / "UMSans-Variable.ttf",
        FONT_DIR / "UMSans-VariableItalic.ttf",
    ):
        variable_models.append(variable_model(TTFont(path, recalcTimestamp=False), path.name))
    write_text(
        metadata_dir / "variable-model.json",
        json.dumps(
            {
                "schemaVersion": 1,
                "family": report["family"],
                "version": report["versionLabel"],
                "models": variable_models,
            },
            indent=2,
            ensure_ascii=False,
        ),
    )

    write_text(
        metadata_dir / "embedding-rights.json",
        json.dumps(
            {
                "schemaVersion": 1,
                "family": report["family"],
                "version": report["versionLabel"],
                "license": "SIL Open Font License 1.1",
                "allBinariesInstallable": all(item["fsType"] == 0 for item in embedding_files),
                "technicalSetting": "fsType 0 — Installable embedding",
                "note": (
                    "OS/2 fsType records the binary embedding setting; SIL OFL 1.1 "
                    "remains the controlling license for use and redistribution."
                ),
                "files": embedding_files,
            },
            indent=2,
            ensure_ascii=False,
        ),
    )

    name_profiles = []
    for path in sorted(FONT_DIR.glob("UMSans-*.ttf")):
        font = TTFont(path, recalcTimestamp=False)
        name_profiles.append(
            {
                "file": path.name,
                "records": {
                    label: debug_name(font, name_id)
                    for name_id, label in NAME_IDS.items()
                },
            }
        )
    write_text(
        metadata_dir / "name-table.json",
        json.dumps(
            {
                "schemaVersion": 1,
                "family": report["family"],
                "version": report["versionLabel"],
                "nameIds": {str(key): value for key, value in NAME_IDS.items()},
                "profiles": name_profiles,
            },
            indent=2,
            ensure_ascii=False,
        ),
    )

    source_manifest = json.loads(
        (SOURCE_DIR / "source-manifest.json").read_text(encoding="utf-8")
    )
    build_script_names = (
        "build_um_sans.py",
        "fetch_um_sans_sources.py",
        "audit_um_sans.py",
        "audit_um_sans_fontbakery.py",
        "audit_um_sans_pdf.sh",
        "package_um_sans.py",
        "run_font_python.sh",
        "requirements.txt",
    )
    build_materials = [
        {
            "path": f"Source/{name}",
            "sha256": sha256(ROOT / "scripts" / "fonts" / name),
        }
        for name in build_script_names
    ]
    release_provenance = {
        "schemaVersion": 1,
        "family": report["family"],
        "version": report["versionLabel"],
        "recordType": "Reproducible build provenance",
        "attestation": {
            "signed": False,
            "status": "Unsigned local build record",
            "requiredForSignedRelease": (
                "ULTIMA MILLA organizational signing identity and external verifier"
            ),
        },
        "builder": {
            "name": "UM Sans deterministic Python pipeline",
            "entrypoint": "Source/build_um_sans.py",
            "packager": "Source/package_um_sans.py",
        },
        "source": source_manifest,
        "materials": build_materials,
        "subjects": [
            {
                "file": path.name,
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
            for path in font_binary_paths()
        ],
        "reproducibility": {
            "deterministicZipTimestamp": "2026-07-13T00:00:00Z",
            "archiveTimestampsNormalized": True,
            "upstreamPinnedByCommitAndSha256": True,
        },
        "ownershipBoundary": {
            "classification": "Modified OFL derivative",
            "upstream": "Inter 4.001",
            "independentOutlineCopyright": False,
        },
    }
    write_text(
        metadata_dir / "release-provenance.json",
        json.dumps(release_provenance, indent=2, ensure_ascii=False),
    )

    sbom = {
        "spdxVersion": "SPDX-2.3",
        "dataLicense": "CC0-1.0",
        "SPDXID": "SPDXRef-DOCUMENT",
        "name": "UM Sans 1.2 Production SBOM",
        "documentNamespace": "https://ultimamilla.com.ar/sbom/um-sans/1.2",
        "creationInfo": {
            "created": "2026-07-13T00:00:00Z",
            "creators": ["Organization: ULTIMA MILLA S.A."],
            "licenseListVersion": "3.26",
        },
        "documentDescribes": ["SPDXRef-Package-UMSans"],
        "packages": [
            {
                "name": "UM Sans",
                "SPDXID": "SPDXRef-Package-UMSans",
                "versionInfo": "1.2.0",
                "supplier": "Organization: ULTIMA MILLA S.A.",
                "downloadLocation": "NOASSERTION",
                "filesAnalyzed": False,
                "licenseConcluded": "OFL-1.1",
                "licenseDeclared": "OFL-1.1",
                "copyrightText": (
                    "UMSA modifications and release engineering; upstream outlines "
                    "remain governed by the SIL Open Font License 1.1"
                ),
                "summary": "Corporate editorial font release derived from Inter 4.001.",
            },
            {
                "name": "Inter",
                "SPDXID": "SPDXRef-Package-Inter",
                "versionInfo": source_manifest["upstreamVersion"],
                "supplier": "Organization: The Inter Project Authors",
                "downloadLocation": (
                    "https://github.com/google/fonts/tree/"
                    f"{source_manifest['googleFontsCommit']}/ofl/inter"
                ),
                "filesAnalyzed": False,
                "licenseConcluded": "OFL-1.1",
                "licenseDeclared": "OFL-1.1",
                "copyrightText": "Copyright The Inter Project Authors",
            },
        ],
        "relationships": [
            {
                "spdxElementId": "SPDXRef-DOCUMENT",
                "relationshipType": "DESCRIBES",
                "relatedSpdxElement": "SPDXRef-Package-UMSans",
            },
            {
                "spdxElementId": "SPDXRef-Package-UMSans",
                "relationshipType": "GENERATED_FROM",
                "relatedSpdxElement": "SPDXRef-Package-Inter",
            },
        ],
    }
    write_text(
        metadata_dir / "sbom.spdx.json",
        json.dumps(sbom, indent=2, ensure_ascii=False),
    )


def write_web_manifest(package_root: Path, report: dict[str, object]) -> None:
    web_dir = package_root / "Web"
    files = []
    for path in sorted(web_dir.rglob("*")):
        if not path.is_file() or path.name == "webfont-manifest.json":
            continue
        files.append(
            {
                "path": path.relative_to(web_dir).as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
        )
    manifest = {
        "schemaVersion": 1,
        "family": report["family"],
        "version": report["versionLabel"],
        "recommended": {
            "stylesheet": "um-sans-variable.css",
            "preload": "WOFF2/UMSans-Variable.woff2",
            "fallback": "UM Sans Fallback",
        },
        "kits": {
            "fullVariable": "um-sans-variable.css",
            "static": "um-sans-static.css",
            "latinCoreVariable": "um-sans-latin-core.css",
            "metricFallback": "um-sans-fallback.css",
        },
        "files": files,
    }
    write_text(
        web_dir / "webfont-manifest.json",
        json.dumps(manifest, indent=2, ensure_ascii=False),
    )


def write_web_package_descriptor(package_root: Path, report: dict[str, object]) -> None:
    descriptor = {
        "name": "@ultimamilla/um-sans",
        "version": "1.2.0",
        "description": "UM Sans corporate editorial webfont kit",
        "license": "OFL-1.1",
        "private": True,
        "style": "um-sans-variable.css",
        "files": ["WOFF2", "Subset", "*.css", "webfont-manifest.json"],
        "keywords": ["font", "webfont", "variable-font", "ultima-milla"],
    }
    write_text(
        package_root / "Web" / "package.json",
        json.dumps(descriptor, indent=2, ensure_ascii=False),
    )


def copy_files(paths: list[Path], destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for path in sorted(paths):
        shutil.copy2(path, destination / path.name)


def build_package_tree(package_root: Path, report: dict[str, object]) -> None:
    version = str(report["versionLabel"])
    static_ttfs = [
        path
        for path in FONT_DIR.glob("UMSans-*.ttf")
        if "Variable" not in path.name
    ]
    static_otfs = list(FONT_DIR.glob("UMSans-*.otf"))
    webfonts = list(FONT_DIR.glob("UMSans-*.woff2"))
    variable_fonts = list(FONT_DIR.glob("UMSans-Variable*.*"))

    copy_files(static_otfs, package_root / "Desktop" / "OTF")
    copy_files(static_ttfs, package_root / "Desktop" / "TTF")
    copy_files(variable_fonts, package_root / "Variable")
    web_dir = package_root / "Web"
    copy_files(webfonts, web_dir / "WOFF2")
    build_latin_core_subset(
        FONT_DIR / "UMSans-Variable.ttf",
        web_dir / "Subset" / "UMSans-Variable-LatinCore.woff2",
    )
    build_latin_core_subset(
        FONT_DIR / "UMSans-VariableItalic.ttf",
        web_dir / "Subset" / "UMSans-VariableItalic-LatinCore.woff2",
    )
    write_text(web_dir / "um-sans.css", variable_css(version, "./WOFF2/"))
    write_text(web_dir / "um-sans-variable.css", variable_css(version, "./WOFF2/"))
    write_text(web_dir / "um-sans-static.css", static_css(version, "./WOFF2/"))
    write_text(web_dir / "um-sans-fallback.css", fallback_css(version))
    write_text(
        web_dir / "um-sans-latin-core.css",
        variable_css(version, "./Subset/", latin_core=True),
    )
    write_web_package_descriptor(package_root, report)
    write_web_manifest(package_root, report)
    write_metadata(package_root, report)

    for path in sorted(RELEASE_DOCS.glob("*")):
        if path.is_file():
            target_dir = (
                package_root / "Specimen"
                if path.name.startswith("SPECIMEN")
                else package_root / "Documentation"
            )
            target_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target_dir / path.name)

    (package_root / "Documentation").mkdir(parents=True, exist_ok=True)
    (package_root / "QA").mkdir(parents=True, exist_ok=True)
    shutil.copy2(FONT_DIR / "OFL-1.1.txt", package_root / "Documentation" / "OFL-1.1.txt")
    shutil.copy2(FONT_DIR / "build-report.json", package_root / "QA" / "build-report.json")
    for report_name in (
        "qa-report.json",
        "fontbakery-report.json",
        "fontbakery-report.md",
        "specimen-audit.pdf",
    ):
        source = FONT_DIR / report_name
        if source.exists():
            shutil.copy2(source, package_root / "QA" / report_name)

    source_target = package_root / "Source"
    source_target.mkdir(parents=True, exist_ok=True)
    for script_name in (
        "build_um_sans.py",
        "fetch_um_sans_sources.py",
        "audit_um_sans.py",
        "audit_um_sans_fontbakery.py",
        "audit_um_sans_pdf.sh",
        "package_um_sans.py",
        "run_font_python.sh",
        "requirements.txt",
    ):
        shutil.copy2(ROOT / "scripts" / "fonts" / script_name, source_target / script_name)
    shutil.copy2(SOURCE_DIR / "source-manifest.json", source_target / "source-manifest.json")

    readme = package_root / "Documentation" / "README.md"
    if readme.exists():
        shutil.copy2(readme, package_root / "README.md")

    files = []
    for path in sorted(package_root.rglob("*")):
        if path.is_file():
            files.append(
                {
                    "path": path.relative_to(package_root).as_posix(),
                    "bytes": path.stat().st_size,
                    "sha256": sha256(path),
                }
            )
    manifest = {
        "family": report["family"],
        "version": version,
        "license": "SIL Open Font License 1.1",
        "classification": "Modified OFL derivative of Inter 4.001",
        "formats": [
            "OTF",
            "TTF",
            "WOFF2",
            "Variable TTF",
            "Variable WOFF2",
            "Latin Core Variable WOFF2",
        ],
        "webKits": [
            "variable",
            "static",
            "latin-core-variable",
            "metric-fallback",
        ],
        "metadata": [
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
        ],
        "staticStyles": report["staticStyles"],
        "variableStyles": report["variableStyles"],
        "files": files,
    }
    write_text(
        package_root / "release-manifest.json",
        json.dumps(manifest, indent=2, ensure_ascii=False),
    )
    checksums = [
        f"{sha256(path)}  {path.relative_to(package_root).as_posix()}"
        for path in sorted(package_root.rglob("*"))
        if path.is_file() and path.name != "CHECKSUMS.sha256"
    ]
    write_text(package_root / "CHECKSUMS.sha256", "\n".join(checksums))


def write_zip(archive_path: Path, package_root: Path) -> None:
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(package_root.rglob("*")):
            if not path.is_file():
                continue
            arcname = f"{package_root.name}/{path.relative_to(package_root).as_posix()}"
            info = zipfile.ZipInfo(arcname, ZIP_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes())


def package_release() -> Path:
    report_path = FONT_DIR / "build-report.json"
    if not report_path.exists():
        raise RuntimeError("Build UM Sans before packaging it")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    archive_path = FONT_DIR / str(report["archiveName"])
    with tempfile.TemporaryDirectory(prefix="um-sans-release-") as temporary:
        package_root = Path(temporary) / f"UMSans-{report['versionSlug']}"
        package_root.mkdir(parents=True)
        build_package_tree(package_root, report)
        public_subset = FONT_DIR / "subset"
        if public_subset.exists():
            shutil.rmtree(public_subset)
        shutil.copytree(package_root / "Web" / "Subset", public_subset)
        write_text(FONT_DIR / "um-sans.css", variable_css(str(report["versionLabel"]), "./"))
        write_text(
            FONT_DIR / "um-sans-variable.css",
            variable_css(str(report["versionLabel"]), "./"),
        )
        write_text(
            FONT_DIR / "um-sans-static.css",
            static_css(str(report["versionLabel"]), "./"),
        )
        write_text(
            FONT_DIR / "um-sans-fallback.css",
            fallback_css(str(report["versionLabel"])),
        )
        write_text(
            FONT_DIR / "um-sans-latin-core.css",
            variable_css(str(report["versionLabel"]), "./subset/", latin_core=True),
        )
        for metadata_name in (
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
        ):
            shutil.copy2(
                package_root / "Metadata" / metadata_name,
                FONT_DIR / metadata_name,
            )
        shutil.copy2(
            package_root / "Web" / "webfont-manifest.json",
            FONT_DIR / "webfont-manifest.json",
        )
        shutil.copy2(package_root / "release-manifest.json", FONT_DIR / "release-manifest.json")
        shutil.copy2(package_root / "CHECKSUMS.sha256", FONT_DIR / "CHECKSUMS.sha256")
        write_zip(archive_path, package_root)
    return archive_path


if __name__ == "__main__":
    print(package_release())
