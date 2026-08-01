# Design QA protocol

Automated font checks cannot decide whether a curve, accent or paragraph feels
finished. UM Sans therefore uses a repeatable visual protocol.

## Required proofs

1. `I l 1`, `O 0`, `rn m`, `vv w`, `cl d` at 11, 16, 32 and 72 px.
2. `ÁÉÍÓÚÜÑ áéíóúüñ ¿? ¡!` in all weights and both styles.
3. Spanish headlines between 20 and 70 characters with natural line breaks.
4. Dense technical copy with dates, CUIT, currency, SLA and coordinates.
5. Tabular and proportional figures in tables and running text.
6. Roman/Italic transitions inside a paragraph and PDF export.
7. Black-on-white, white-on-black and low-ink office-print proofs.

## Acceptance criteria

- no collision, clipped accent or ambiguous technical glyph;
- no isolated weight that changes width or color abruptly;
- no forced negative tracking to make the family usable;
- stable line boxes and no synthetic styles;
- readable body copy at 16 px and clear display rhythm at 700–900;
- the same hierarchy survives browser, screenshot and exported PDF.

The portfolio at `/estilo/um-sans` is the canonical visual proof. Its PDF is
stored as `QA/specimen-audit.pdf` in the release package.
