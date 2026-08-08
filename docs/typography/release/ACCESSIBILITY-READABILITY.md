# Accessibility and readability

UM Sans is a type system, not an accessibility certification. Accessibility
depends on size, contrast, spacing, language, content structure and the user
agent as well as on the outlines.

## Production rules

- public body text starts at 16 px; 18 px is preferred for sustained reading;
- body line height stays between 1.55 and 1.72, with 45–78 characters per line;
- text is never compressed with negative tracking to make a container fit;
- `font-synthesis: none` prevents artificial bold and italic styles;
- the calibrated fallback is loaded before UM Sans to reduce reflow;
- `I`, `l`, `1`, `O` and `0` remain distinguishable in technical strings;
- tabular figures are used for ledgers, dates, SLA and monetary values;
- color contrast is tested separately from the font package.

No claim is made that UM Sans treats dyslexia or replaces user-selected fonts.
Interfaces must continue to respect browser zoom, text scaling and operating
system accessibility settings.
