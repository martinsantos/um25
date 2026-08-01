# Language and character coverage

UM Sans 1.2 targets professional Latin-script publishing and interface use.
The production subset includes:

- Basic Latin and Latin-1;
- Latin Extended A, B and additional case-closed Latin ranges;
- Spanish, Portuguese, French, Italian, German and Vietnamese diacritics;
- IPA counterparts needed to keep supported case mappings complete;
- currency, mathematical, technical, arrow and common enclosed symbols;
- typographic punctuation, fractions, superiors and inferiors.

The authoritative codepoint and glyph counts are in `QA/build-report.json`.
Greek, Cyrillic, Arabic, Hebrew, CJK and emoji are not claimed by this release;
use an explicit fallback stack for those scripts.
