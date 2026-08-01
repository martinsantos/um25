# UM Sans 2 Manual Visual Audit

Status: active rejection log. A technical PASS never overrides this document.

## Alpha 1

Decision: REJECTED.

- The lowercase `e` read as a damaged `c` with an attached bar.
- `f`, `r` and `i` produced unstable joins in `oficina` and `fibra`.
- Sidebearings were too tight and the word color changed abruptly.
- The build loaded correctly; the defects belonged to the outlines.

## Alpha 2

Decision: REJECTED.

- The `e` became structurally legible, but remained too constructed.
- Lowercase stems varied between 136 and 148 units.
- `a` contained an accidental six-unit lean in its right stem.
- `b`, `d`, `p`, `n` and `u` did not share the weight of `H`, `f`, `i`, `l`
  and `r`.
- No kerning was present, so the base rhythm could be reviewed honestly.

## Alpha 3

Decision: REJECTED.

- The `e` still read as a constructed `c` with an independent horizontal bar.
- `f` and `r` were too wide for the lowercase rhythm.
- The font was structurally valid, but the displayed words did not have a
  coherent commercial-family texture.

## Alpha 4

Decision: SUPERSEDED BY ALPHA 5. RELEASE REJECTED.

Evidence reviewed on 2026-07-19:

1. Browser screenshots at 72, 48, 32, 24, 20 and 16 px.
2. Responsive captures at 1440x900, 390x900 and 360x740.
3. Control strings `eeee cece rere`, `referencia eficiente`, `oficina fibra`,
   `baba dada papa`, `continuidad certificada` and `sostenida`.
4. The reconstructed `e` keeps its counter and reads as `e` at every tested
   size. It no longer renders as a damaged `c` plus an independent bar.
5. The reduced advances of `f` and `r` remove the obvious holes seen in Alpha
   3. No clipping, fallback glyphs, synthetic bold or negative tracking was
   observed.
6. FreeType and OTS checks pass, and the specimen reports no browser errors or
   horizontal overflow.

Remaining blockers:

- only 24 glyphs and one display weight exist;
- uppercase/lowercase counterparts, nonbreaking space and full Spanish
  coverage are incomplete;
- there is no kerning, hinting, Text cut, interpolation or platform matrix;
- FontBakery reports six release failures and two warnings, including the
  incomplete case set, missing NBSP, version/name records and absent kerning;
- an independent originality/similarity review has not been performed.

Alpha 4 identified a viable direction but did not pass the final word-spacing
review: the `f` retained a 140-unit left sidebearing and the `e` remained too
mechanical. Alpha 5 corrected the spacing but failed the subsequent optical
mobile review.

## Alpha 5

Decision: REJECTED AFTER MOBILE VISUAL REVIEW.

Evidence reviewed on 2026-07-19:

1. Direct HarfBuzz renders of the full inventory and the words `eficiente`,
   `referencia`, `oficina` and `fibra`.
2. Browser screenshots at 1440x900 and 390x900 with the compiled Alpha 5 OTF,
   no fallback, synthesis, kerning or negative tracking.
3. Raster rows at 16, 20, 24, 32, 48 and 72 px with no horizontal overflow.
4. The `e` is now one open spiral contour; its eye and aperture remain legible
   at every tested size and no detached bar appears.
5. The `f` left sidebearing was reduced from 140 to 20 units. The false pause
   visible in Alpha 4 before `f` is absent in Alpha 5.
6. The browser loaded the intended family, emitted no console warnings/errors
   and rendered the complete proof phrase without fallback glyphs.

Remaining blockers:

- only 24 glyphs and one display weight exist;
- there is no complete alphabet, figure set, Spanish diacritics, kerning,
  hinting, Text cut, interpolation or platform matrix;
- FontBakery still reports six intrinsic release failures and two warnings;
- originality and similarity have not been independently reviewed.

The previous acceptance as a control master was a false positive. At the
30px mobile proof size, the 54-unit aperture of `e` collapsed into a capsule
and the word `certificada` still looked malformed. Structural and browser-load
checks did not detect that optical failure.

## Alpha 6

Decision: PENDING VISUAL REVIEW. RELEASE REJECTED.

- The `e` aperture is enlarged to 116 units.
- The crossbar is reduced from 110 to 74 units.
- Tracking, kerning and synthetic bold remain disabled.
- Approval requires direct browser review at 16, 20, 24, 30, 32, 48 and 72px
  on 360px and 390px mobile widths plus desktop.

## Approval boundary

The family remains quarantined until its full alphabet, figures, punctuation,
Spanish coverage, spacing, kerning, hinting and platform raster review exist.
Passing OTS, FreeType or FontBakery means the binary is structurally usable; it
does not mean the drawing is aesthetically acceptable.

## Alpha 12

Decision: CONTROL DIRECTION RETAINED. RELEASE REJECTED.

Alpha 6 remains rejected as a browser specimen. Its single notched contour
created a fragile aperture and made the review dependent on a custom compiler.
Alpha 12 separates the rounded open body from the horizontal bar in the source
then uses Fontmake's overlap removal to make a normalized review font.

Required evidence before any further drawing decision:

1. Fontmake build completes from the editable UFO without changing source.
2. The review TTF contains one normalized `e` outline and no source overlap.
3. Multiscale control sheets at 16, 20, 24, 30, 32, 48 and 72px show open
   counters and stable word color at desktop and mobile widths.
4. FontBakery release failures are recorded as blockers, never converted into
   an approval claim.

Remaining blockers are material: one weight, a partial 25-glyph inventory,
no complete Latin Extended-A, figures, punctuation, kerning, interpolation,
hinting, platform matrix or independent similarity review. The custom audit is
only a diagnostic check and cannot approve the typeface.

The generated file `proofs/generated/alpha12/fontmake-control-sheet.png` is a
technical raster control only. It does not approve Alpha 12's drawing: its `e`
construction and unfinished terminal system remain rejected for web use.

The generated file `proofs/generated/alpha12/fontmake-control-sheet.png` is a
technical raster control only. It does not approve Alpha 12's drawing; the
`e` construction and the unfinished terminal system remain rejected for any
web integration.

## Alpha 13 and Alpha 14

Decision: REJECTED FOR DESIGN. RELEASE REJECTED.

Alpha 13 and Alpha 14 were generated as isolated `e` aperture studies. Their
Fontmake outputs normalize overlaps cleanly, and the proof scripts now refuse
to render any string containing an absent glyph. This is an engineering
improvement, not an aesthetic approval.

The desktop, mobile and print sheets from the normalized Alpha 14 TTF were
reviewed. The samples fit their canvases after the mobile proof was corrected,
but the `a/c/e/o/s` group remains too generic and lacks a shared terminal
language. Alpha 14 cannot be loaded by the commercial theme.

See `CORE-GLYPH-REVIEW.md` and `PRODUCTION-MAP.md` for the next required
drawing decisions and deliverables.
