# Format support policy

UM Sans 1.2 uses formats appropriate for current desktop, web, application,
print and document workflows. Shipping every historical font container would
increase ambiguity and support cost without improving a 2026 implementation.

## Supported

| Channel | Format | Status |
|---|---|---|
| Desktop and print | OTF/CFF | Included, 18 static styles |
| Desktop and Office-compatible workflows | TTF/glyf | Included, 18 hinted styles |
| Variable desktop | Variable TTF | Included, Roman and Italic |
| Modern web | WOFF2 | Included, static and variable |
| Performance web kit | Latin Core WOFF2 | Included with `unicode-range` |
| PDF | Embedded OTF/TTF | Verified by the PDF gate |

## Deliberately not shipped

- `EOT`: obsolete Internet Explorer transport.
- `WOFF 1.0`: unnecessary for the declared modern browser baseline; WOFF2 is
  the maintained web format.
- Type 1/PostScript fonts: obsolete and removed from current Adobe workflows.
- TTC/OTC collections: add installation ambiguity without reducing the release
  contract.
- Color-font tables: outside the monochrome editorial scope.
- DRM or activation wrappers: incompatible with the controlling SIL OFL 1.1
  distribution model.

## Policy

New formats are added only when a supported channel requires them and receives
an explicit compatibility test. Deprecated formats are not generated merely to
make the package appear larger.
