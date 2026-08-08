# Compatibility matrix

This matrix distinguishes automated evidence from validation that must happen
on physical platforms. A blank claim is not treated as compatibility.

| Surface | Current evidence | Status | Release requirement |
|---|---|---|---|
| Chromium desktop/mobile | Browser specimen, WOFF2 load, PDF embedding | Verified | Repeat on every release |
| Firefox | Standards-compatible WOFF2/OpenType | External | Signed smoke test on current ESR and stable |
| Safari macOS/iOS | Standards-compatible WOFF2/OpenType | External | Physical Apple-device raster and italic test |
| Windows DirectWrite | TTF identities and hinting tables | External | ClearType test at 11, 13, 16 and 24 px |
| Microsoft Office | Legacy style linking is generated | External | Install, style-link and PDF export test |
| Adobe InDesign/Illustrator | OTF binaries and names are generated | External | Install, preflight and outlined/PDF export test |
| Android | WOFF2 and TTF binaries are valid | External | Physical-device rendering and fallback test |
| Print/PDF | Headless Chrome PDF embeds UM Sans | Verified | Offset/digital press proof remains external |
| Astro public web | Variable WOFF2 integrated and visually audited | Verified | Strict visual gate before deployment |

`Verified` means evidence is produced by this repository. `External` means the
release is technically prepared but ULTIMA MILLA must record a dated test on
the named platform before making a compatibility guarantee to third parties.
