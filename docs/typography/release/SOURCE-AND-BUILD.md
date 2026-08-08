# Source and reproducibility

UM Sans 1.2 is generated deterministically from two pinned Inter 4.001 variable
fonts in Google Fonts. The definitive build preserves their contours and
metrics; it does not apply automatic glyph transformations, alternates or
custom kerning. SHA-256 checksums and source URLs are in
`Source/source-manifest.json`.

The `Source` directory contains the transformation, build, audit and packaging
scripts. It does not pretend to be an independently drawn UFO/Glyphs source:
the canonical upstream source remains The Inter Project repository. Run the
fetch script to retrieve verified upstream binaries, then run the builder.

```bash
python scripts/fonts/fetch_um_sans_sources.py
python scripts/fonts/build_um_sans.py
python scripts/fonts/audit_um_sans.py
python scripts/fonts/audit_um_sans_optical.py
fontbakery check-universal ...
python scripts/fonts/package_um_sans.py
```

The release manifest and `CHECKSUMS.sha256` provide file-level verification.
