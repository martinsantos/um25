# UM Sans 2 Manual: Taste UI/UX Audit

**Scope:** `src/pages/estilo/um-sans-2-manual.astro` and its generated Alpha 1 font proof.

**Design read:** Redesign-preserve for a technical typography specimen: an independent display-face laboratory for a serious IT provider, with a restrained industrial language, high legibility, and no decorative effects that hide drawing defects.

**Dials:**

- `DESIGN_VARIANCE: 4` — controlled, not expressive chaos. The specimen must expose the glyphs, not decorate them.
- `MOTION_INTENSITY: 1` — static proof. Font evaluation needs stable geometry.
- `VISUAL_DENSITY: 3` — generous spacing around samples; the inventory can be dense only when it improves comparison.

## Findings and decisions

### 1. The font must stay quarantined

The Alpha 1 face has only 24 glyphs and is not a production family. It is loaded only by `.manual-alpha`; headings, explanatory copy, labels, navigation, and metadata remain on the stable editorial system. This prevents missing glyphs or incomplete accents from silently appearing as fallback mixtures.

### 2. The specimen is a test instrument

Every control string is chosen to expose a specific risk:

- `HHOH OHOH`: stem weight, round shoulders, counters, and cap rhythm.
- `nonono oóo`: repeated bowls, joins, accents, and color of word.
- `oficina fibra`: transitions between rounded and straight forms.
- `continuidad certificada`: long-word rhythm and spacing under real content pressure.
- `sostenida`: the `s` curve at a readable display size.

The sample is not considered successful because it looks distinctive. It passes only when it remains coherent at desktop and mobile widths, with no clipping, fallback substitution, collapsed counters, or accidental line collisions.

### 3. Layout rules

- The custom face never controls layout dimensions of the surrounding UI.
- Sample blocks use normal word breaking and stable width constraints.
- Mobile reduces sample scale before it reduces side padding.
- The page uses a single shell width and one vertical rhythm; no local negative margins are allowed in the specimen.
- The specimen is noindex and cannot become a production font by query parameter.

### 4. Visual hierarchy

- One specimen protagonist per section.
- Red is reserved for the diagnostic marker and small labels, never for long explanatory text.
- Dark proof sections use white sample text and muted white body copy with explicit contrast.
- The source ledger is documentary, not a card grid.
- The inventory is evidence of current scope, not a promise of a complete family.

### 5. Taste-derived anti-patterns rejected

- No generic three-card marketing layout.
- No forced `100vh` section.
- No browser default font in the specimen controls.
- No synthetic bold or synthetic italic.
- No negative tracking on the experimental face while its spacing is still being tuned.
- No decorative motion, gradients, shadows, or hover effects that make visual comparison harder.

## Gate before Alpha 2

1. Expand the glyph set before judging the family as original or market-ready: Spanish uppercase/lowercase, digits, punctuation, symbols, and marks.
2. Draw and inspect each glyph at 16px, 24px, 48px, and display size.
3. Add kerning classes and test real operational phrases, not isolated glyphs only.
4. Export OTF, TTF, WOFF2 and a specimen PDF only after outline, metrics, hinting, naming, and Unicode audits pass.
5. Run `npm run audit:taste:um-sans-2-manual` and the browser checks at 390px and 1440px.

## Source

This audit adapts the existing-project sequence and typography/layout checks from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), especially its `redesign-existing-projects` and `design-taste-frontend` guidance. It is an internal UMSA contract, not a copy of that repository.
