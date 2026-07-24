# UM Sans 2.0 Drawing Specification

Status: Alpha 6 control redraw. Alpha 0 was rejected for contour winding,
Alpha 1 for visual form and rhythm defects, Alpha 2 for inconsistent stem
weight and joins, and Alpha 3 for its constructed `e` and unstable `f/r`
spacing. This document governs drawing decisions; it does not approve the
family for use. Alpha 4 was retained only as evidence of a spacing defect: its
`f` began 140 units inside the advance and its closed `e` was over-dark. Alpha
5 corrected that spacing but its 54-unit `e` aperture collapsed on mobile.

## Voice

UM Sans 2 must feel engineered, direct and contemporary without becoming a
novelty display face. Display cuts are round, wide and assertive. Text cuts are
open, neutral and calm. The family must remain recognisable in Spanish words,
technical figures and operational interfaces.

## Metrics

| Metric | Display Bold Alpha 6 |
| --- | ---: |
| Units per em | 1000 |
| Ascender | 780 |
| Cap height | 720 |
| x-height | 540 |
| Descender | -220 |
| Main stem | 148 |
| Round overshoot | 14 |
| Default sidebearing | 52 |

Alpha 6 is evaluated with zero CSS tracking and no kerning pairs. Word rhythm
must first work from the authored advances and sidebearings.

## Drawing principles

1. Curves use deliberate cubic handles; no polygonal ellipse approximation.
2. Counters stay open at 42 px and below.
3. Joins are optically corrected, not formed by overlapping monoline strokes.
4. Lowercase rhythm is tested in words before another glyph is added.
5. `I`, `l`, `1`, `O` and `0` must remain distinguishable without decoration.
6. Acute accents sit optically over the letter, not mathematically centered.
7. Display tracking starts at zero. Negative CSS tracking cannot repair width.

## Control glyph sequence

The family grows from this sequence:

1. `H O n o` establish stem, round, sidebearings and lowercase rhythm.
2. `a e s` establish aperture and terminal language.
3. `i l r t` establish vertical rhythm and joins.
4. `p b d u c f` complete the first Spanish proof phrase.
5. figures and punctuation establish technical use.

No full alphabet is extrapolated until the control words pass review.

## Distinctive decisions under review

- single-storey `a` with a firm right shoulder;
- geometric `e` drawn as one open contour with an integrated crossbar;
- broad `s` with a smaller upper bowl;
- short, direct `r` shoulder;
- compact `t` crossbar with a rounded foot;
- round punctuation dots matching the UMSA node motif without copying the logo.

## Prohibited shortcuts

- importing or tracing another font;
- expanding a centerline alphabet;
- applying one geometric recipe to every letter;
- synthetic italic;
- interpolation before compatible manual masters exist;
- website rollout before raster approval.

Alpha 6 control glyphs are authored as final contours. Stems, crossbars and
bowls do not depend on a compiler-side `Remove Overlap` pass.
