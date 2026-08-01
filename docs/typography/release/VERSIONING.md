# Versioning policy

UM Sans uses semantic product versions plus OpenType fixed versions.

- Patch: metadata, packaging, documentation or QA change without reflow.
- Minor: glyph, spacing, kerning or feature change that can affect text color.
- Major: new source masters, incompatible metrics, repertoire strategy or
  licensing model.

`1.2 Production` is a modified OFL derivative and uses `Version 1.200` in the
fonts. A truly independent redraw must ship as `2.0`, preserve a migration
guide and be tested for document reflow before replacing 1.x.
