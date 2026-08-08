# OpenType features

UM Sans retains the upstream OpenType system and adds UMSA spacing and kerning.
Supported features include:

- standard and discretionary ligatures: `liga`, `dlig`;
- contextual alternates: `calt`;
- fractions, numerators and denominators: `frac`, `numr`, `dnom`;
- superscript, subscript, ordinals and scientific inferiors;
- proportional and tabular figures: `pnum`, `tnum`;
- slashed zero: `zero`;
- stylistic sets `ss01` through `ss08` and `salt`;
- localized forms: `locl`;
- case-sensitive punctuation: `case`;
- kerning and capital spacing: `kern`, `cpsp`.

The default `I` and `l` forms are deliberately disambiguated for technical
interfaces, serials, SLAs and infrastructure identifiers. Remaining alternates
are available to editorial applications through the feature menu.
