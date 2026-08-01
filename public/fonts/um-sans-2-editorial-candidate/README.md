# UM Sans 2.1 Editorial Candidate

This directory contains a **local, dev-only candidate** of the UM Sans 2 family.
It is not a production release and it must not be redistributed, sold or used
as a public brand font until the open review gates are closed.

## Included

- 14 static styles: Light through Black, Roman and Italic.
- TTF, OTF and WOFF2 exports.
- Latin Extended-A coverage used by the site, including Spanish accents,
  punctuation and figures.
- OpenType tables, hinting tables and a structural QA report.
- `specimen.html` for a portable, noindex visual check.

## Current status

The complete-family builder now uses the controlled manual core for the visible
roman display glyphs and produces a valid structural candidate. The release is
still blocked while these reviews remain open:

1. word, paragraph and responsive review at multiple sizes;
2. italic topology and rhythm review, especially in low weights;
3. independent contour/similarity review;
4. legal chain of title, trademark and platform QA;
5. decision on contour-compatible variable exports.

Passing `qa-report.json` means the files are structurally coherent. It does not
mean that the typeface is approved for production.

## Rebuild and audit

From the repository root:

```sh
UM_SANS_2_OUTPUT=/private/tmp/umsans2-editorial-candidate \
UM_SANS_2_CANDIDATE_QA=1 \
.venv-fonts/bin/python scripts/fonts/build_um_sans_2.py

UM_SANS_2_FONT_DIR=public/fonts/um-sans-2-editorial-candidate \
UM_SANS_2_REQUIRE_ARCHIVE=0 \
.venv-fonts/bin/python scripts/fonts/audit_um_sans_2.py
```

The production release gate remains blocked until the visual and legal review
is signed off independently.
