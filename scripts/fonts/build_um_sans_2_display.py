#!/usr/bin/env python3
"""Build the blocked UM Sans 2 Display drawing experiment.

The generated binaries are retained for contour diagnosis only. Word-level and
responsive raster review rejected their current drawing, so no website or
document may load them. Body and heading roles remain on verified UM Sans Text
1.2 until a complete redraw passes visual review.
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil

from build_um_sans_2 import (
    Design,
    ROOT,
    VERSION,
    autohint_ttf,
    make_font,
    weight_name,
    write_otf,
    write_woff2,
)


OUTPUT = ROOT / "public" / "fonts" / "um-sans-2-display"
FAMILY = "UM Sans 2 Display"
VERSION_LABEL = "2.0 Display Rejected Prototype"

# Optical sizes intentionally stay in the 24–48 range. The 72 master is useful
# for posters, but its compressed joins become too mannered in web headings.
DISPLAY_WEIGHTS = (
    (600, 24),
    (700, 24),
    (800, 48),
    (900, 48),
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_specimen() -> None:
    """Write a portable diagnostic proof for every rejected cut."""
    faces = "\n".join(
        (
            "@font-face{font-family:'UM Sans 2 Display';"
            f"src:url('./UMSans2Display-{weight_name(weight).replace(' ', '')}.woff2') format('woff2');"
            f"font-weight:{weight};font-style:normal;font-display:swap}}"
        )
        for weight, _ in DISPLAY_WEIGHTS
    )
    rows = "\n".join(
        f"<article><small>{weight_name(weight)} · {weight}</small>"
        f"<p style=\"font-weight:{weight}\">Fibra certificada, operación continua.</p>"
        f"<span>ÁÉÍÓÚÜÑ · 24/7 · 99,98% · ¿Alcance?</span></article>"
        for weight, _ in DISPLAY_WEIGHTS
    )
    html = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UM Sans 2 Display · Prototipo bloqueado</title><style>{faces}
:root{{--red:#dc2626;--ink:#111113;--muted:#676a70;--line:#d8d9dc;--paper:#f5f5f3}}
*{{box-sizing:border-box}}body{{margin:0;color:var(--ink);font-family:Arial,sans-serif;background:#fff}}
main{{width:min(1120px,calc(100% - 48px));margin:auto}}header{{padding:88px 0 64px;border-bottom:1px solid var(--line)}}
header small,article small{{color:var(--red);font-size:16px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}}
h1,p{{margin:0}}h1{{max-width:950px;margin-top:24px;font-family:'UM Sans 2 Display',Arial,sans-serif;font-size:clamp(52px,8vw,96px);font-weight:700;line-height:.98}}
header>p{{max-width:720px;margin-top:30px;color:var(--muted);font-size:20px;line-height:1.6}}
section{{padding:72px 0}}article{{display:grid;grid-template-columns:170px minmax(0,1fr);gap:26px;padding:34px 0;border-bottom:1px solid var(--line)}}
article p{{font-family:'UM Sans 2 Display',Arial,sans-serif;font-size:clamp(38px,5.5vw,68px);line-height:1}}
article span{{grid-column:2;color:var(--muted);font-size:18px;line-height:1.5}}
.proof{{padding:56px;background:#0a0a0b;color:#fff}}.proof h2{{max-width:850px;margin:0;font-family:'UM Sans 2 Display',Arial,sans-serif;font-size:clamp(44px,7vw,82px);font-weight:700;line-height:.98}}
.proof p{{max-width:680px;margin-top:28px;color:rgba(255,255,255,.76);font-size:19px;line-height:1.6}}
footer{{padding:36px 0 64px;color:var(--muted);font-size:16px;line-height:1.55}}
@media(max-width:620px){{main{{width:calc(100% - 32px)}}header{{padding:56px 0 44px}}h1{{font-size:48px}}section{{padding:48px 0}}article{{grid-template-columns:1fr;gap:16px}}article p{{font-size:40px}}article span{{grid-column:1}}.proof{{padding:34px 24px}}.proof h2{{font-size:46px}}}}
</style></head><body><main><header><small>UM Sans 2 Display · bloqueado</small><h1>Prototipo rechazado por revisión visual.</h1><p>Estos contornos se conservan solo para diagnosticar y redibujar. No usar en web, interfaz, documento ni distribución.</p></header><section>{rows}</section><section class="proof"><h2>Structural pass. Visual fail.</h2><p>Un archivo válido no equivale a una tipografía válida. La promoción exige revisión raster de palabras completas.</p></section><footer>Uso prohibido · Sin release · Redibujo profesional requerido.</footer></main></body></html>
"""
    (OUTPUT / "specimen.html").write_text(html, encoding="utf-8")


def build() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    statics: list[dict[str, object]] = []
    for weight, optical_size in DISPLAY_WEIGHTS:
        design = Design(weight, optical_size, False)
        style = weight_name(weight)
        stem = f"UMSans2Display-{style.replace(' ', '')}"
        ttf_path = OUTPUT / f"{stem}.ttf"
        statics.append(
            make_font(
                design,
                ttf_path,
                family_name=FAMILY,
                style_name=style,
                cleanup_overlaps=True,
            )
        )
        write_otf(ttf_path, OUTPUT / f"{stem}.otf", design, family_name=FAMILY)
        autohint_ttf(ttf_path)
        write_woff2(ttf_path, OUTPUT / f"{stem}.woff2")

    font_files = sorted(
        path for path in OUTPUT.iterdir() if path.suffix in {".otf", ".ttf", ".woff2"}
    )
    inventory = [
        {
            "path": path.name,
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
        }
        for path in font_files
    ]
    report = {
        "family": FAMILY,
        "version": VERSION_LABEL,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "blocked after visual review",
        "visualStatus": "failed: malformed glyph construction in words and responsive headings",
        "approvedUse": "none",
        "prohibitedUse": "all website, interface, document and distribution use",
        "weights": [weight for weight, _ in DISPLAY_WEIGHTS],
        "styles": ["normal"],
        "variable": False,
        "outlineOrigin": "UMSA-authored geometric primitives in scripts/fonts/build_um_sans_2.py",
        "upstreamOutlineDependencies": [],
        "companionTextFamily": "UM Sans 1.2",
        "releaseGate": [
            "desktop and mobile screenshot review",
            "Spanish accents and punctuation review",
            "long-title wrapping review",
            "contrast and fallback review",
            "independent legal and similarity review before external distribution",
        ],
        "inventory": inventory,
        "build": statics,
    }
    (OUTPUT / "build-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUTPUT / "PROVENANCE.md").write_text(
        """# UM Sans 2 Display

Experimental geometric outlines generated by ULTIMA MILLA S.A. The build does
not open, subset or transform a third-party font. Word-level raster review
rejected the current drawing. These files are diagnostic artifacts only and
must not be loaded by the website or distributed.
""",
        encoding="utf-8",
    )
    (OUTPUT / "README.md").write_text(
        """# UM Sans 2 Display

Prototipo geométrico rechazado de ULTIMA MILLA. El paquete contiene cuatro pesos
romanos solo para diagnóstico de contornos. No usar en ningún rol web, interfaz,
documento, impresión o distribución.

- `specimen.html`: prueba portátil sin dependencias.
- `build-report.json`: inventario y estado de promoción.
- `qa-report.json`: se genera con `npm run fonts:audit:um-sans-2-display`.
- `PROVENANCE.md`: procedencia y límites de distribución.
- `CHECKSUMS.sha256`: integridad de los binarios.

El reingreso exige redibujo completo, revisión raster desktop/mobile y revisión
independiente de calidad, autoría, similitud, marca y plataformas.
""",
        encoding="utf-8",
    )
    (OUTPUT / "BLOCKED.md").write_text(
        """# BLOQUEADO\n\nEstado: structural-pass / visual-fail.\n\nNo cargar, instalar, publicar ni distribuir estos binarios. La revisión de palabras completas detectó contornos deformes, acentos inconsistentes y ritmo tipográfico inaceptable.\n""",
        encoding="utf-8",
    )
    write_specimen()
    checksums = "\n".join(f"{sha256(path)}  {path.name}" for path in font_files) + "\n"
    (OUTPUT / "CHECKSUMS.sha256").write_text(checksums, encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    build()
