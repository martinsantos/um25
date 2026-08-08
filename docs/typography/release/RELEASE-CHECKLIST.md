# Release checklist

## Design

- [ ] Weight progression is monotonic in Roman and Italic.
- [ ] Critical glyphs `I l 1 O 0 rn m` remain distinguishable.
- [ ] Spanish accents and punctuation have optical, not mechanical, spacing.
- [ ] Display and text proofs pass at 11, 16, 24, 56 and 96 px.
- [ ] Italic has its own rhythm and does not rely on browser synthesis.

## Engineering

- [ ] All 18 static fonts open in OTF, TTF and WOFF2.
- [ ] Both variable fonts interpolate every axis corner.
- [ ] Naming, style linking, `STAT`, `fvar`, `OS/2` and license records agree.
- [ ] OpenType shaping, kerning and tabular figures pass HarfBuzz proofs.
- [ ] Latin Core subsets preserve Spanish punctuation and retained features.
- [ ] Fallback metrics and CSS paths are verified from the published location.

## Distribution

- [ ] License, authorship, source attribution and trademark files are present.
- [ ] Character, glyph, Unicode, family and web manifests are regenerated.
- [ ] HTML and PDF specimens are included.
- [ ] FontBakery has zero `ERROR`, `FATAL` or `FAIL` results.
- [ ] ZIP timestamps and SHA-256 checksums are deterministic.
- [ ] Compatibility exceptions are recorded instead of inferred.

## Release authority

A release is approved only when the automated gate is green and the visual
specimen has been reviewed in desktop and mobile. A future proprietary 2.0
also requires provenance review of its independent source masters.
