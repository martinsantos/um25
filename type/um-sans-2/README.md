# UM Sans 2.0 Manual

Independent type-design project for ULTIMA MILLA. This directory is the only
source of truth for the future original family. It must not import, trace,
transform or interpolate third-party outlines.

## Current milestone

`Alpha 7 / Display Bold control set`

Alpha 0 was rejected for structural contour defects. Alpha 1 compiled cleanly
but was visually rejected because its `e`, terminal language and word rhythm
did not meet the brief. Alpha 2 corrected the broken `e`, but was also rejected
because stem weights and lowercase joins still belonged to different systems.
Alpha 3 unified those weights but was visually rejected: its `e` still read as
a constructed `c` plus bar and `f/r` destabilized word spacing. Alpha 4 made
the words legible but still left an over-dark `e` construction and a 140-unit
left sidebearing on `f`, creating a false word break. Alpha 5 rebuilt `e` as
an open contour but its aperture still collapsed in the mobile raster. Alpha 6
widens that aperture and thins the crossbar while preserving the corrected
`f` spacing. The mobile browser review on 2026-07-29 still found that `e`
inadmissible. Alpha 7 redraws its terminal and shortens its crossbar, then
locks the reviewed output with a multi-size raster fingerprint. It remains a
quarantined control master, not a usable family.

- one manually drawn UFO master;
- Spanish-first proof characters, accent and punctuation;
- static proof builds only;
- no production CSS registration;
- no distribution or originality claim.

The current external release check is intentionally red: FontBakery reports
six intrinsic release failures, two warnings and one environment-only version
check failure because the alphabet, NBSP, naming/version records and kerning
are not complete. A green custom alpha audit only means
the proof artifact is loadable and quarantined; it is not market readiness.

The website continues to use UM Sans 1.2 until this project passes human word-
level review, interpolation review, platform testing and independent legal and
similarity review.

## Source layout

- `sources/`: editable UFO masters;
- `UMSans2.designspace`: growth map for future compatible manual masters;
- `proofs/`: proof strings, portable HTML specimen and review records;
- `docs/`: drawing decisions and release gates;
- `build/`: generated local artifacts, never authoritative.

## Non-negotiable gate

A structurally valid font is not an approved font. Every promoted master must
pass the deterministic multi-size raster gate plus desktop, mobile, print and
long-word screenshots reviewed by a human.

## Local workflow

```bash
.venv-fonts/bin/pip install -r scripts/fonts/requirements.txt
npm run fonts:proof:um-sans-2-manual
```

Review the browser proof at `/estilo/um-sans-2-manual` and the portable proof
at `proofs/specimen.html`. The public website must continue using UM Sans 1.2.

The bootstrap script only exists to reproduce the first explicitly authored
control master. It refuses to overwrite the UFO unless `--force` is supplied.
Once drawing continues in a font editor, the UFO remains authoritative and the
bootstrap must not be used to replace those manual edits.
