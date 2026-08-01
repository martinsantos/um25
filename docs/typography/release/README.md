# UM Sans 1.2 Production

UM Sans is the editorial and interface family of ULTIMA MILLA. This package
contains 18 static styles, two optical variable fonts, webfonts, licensing,
source/build material, a specimen and QA evidence.

## What this release is

UM Sans 1.2 is a **modified SIL OFL 1.1 derivative of Inter 4.001**. UMSA owns
its original modifications, release engineering, documentation and UM Sans
trademark. The upstream outlines remain governed by the OFL. This is a
commercial-quality package, not a claim that the underlying skeleton was drawn
independently from zero.

## Contents

- `Desktop/OTF`: 18 static OpenType/CFF styles.
- `Desktop/TTF`: 18 hinted TrueType styles.
- `Variable`: Roman and Italic variable fonts (`opsz 14–32`, `wght 100–900`).
- `Web/WOFF2`: full static and variable WOFF2 files.
- `Web/Subset`: Spanish-first Latin Core variable WOFF2 files.
- `Web/*.css`: variable, static, Latin Core and metric-fallback kits.
- `Metadata`: family, Unicode, character, glyph, binary, variable-model,
  name-table, embedding-rights, SPDX SBOM and build-provenance inventories.
- `Documentation`: installation, license, features, language and governance.
- `Specimen`: offline browser specimen.
- `QA`: build, structural and FontBakery reports when the release gate ran.
- `Source`: deterministic transformation and audit pipeline plus source manifest.

Read `LICENSE-GUIDE.md` before redistribution and `INSTALL.md` before desktop
installation. Use the variable WOFF2 files for the public web.

`MARKET-DELIVERABLES.md` lists the distribution matrix,
`ORIGINALITY-ROADMAP.md` records the legal/design boundary against a fully
redrawn proprietary typeface, and `QA-NOTES.md` explains every warning retained
by the release gate.

`COMPATIBILITY-MATRIX.md` separates automated evidence from physical platform
tests. `RELEASE-CHECKLIST.md` and `DESIGN-QA-PROTOCOL.md` define approval. The
independent-redraw requirements are specified in
`UM-SANS-2.0-ORIGINAL-BRIEF.md`.

Procurement, migration, accessibility, channel embedding, print/PDF and known
issues are separate documents so operational limits travel with the binaries.
Supply-chain provenance and format policy make procurement assumptions explicit;
the release remains unsigned until an organizational certificate is available.
