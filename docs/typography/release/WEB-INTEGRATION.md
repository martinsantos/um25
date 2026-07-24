# Web integration

Choose one kit rather than loading all of them:

- `um-sans-variable.css`: recommended full family;
- `um-sans-latin-core.css`: smaller Spanish-first variable kit;
- `um-sans-static.css`: 18 fixed WOFF2 cuts for non-variable workflows;
- `um-sans-fallback.css`: fallback metrics and role tokens only.

`um-sans.css` is a compatibility alias of the full variable kit. The
recommended stack is:

```css
html {
  font-family: "UM Sans", "UM Sans Fallback", Arial, system-ui, sans-serif;
  font-optical-sizing: auto;
  font-synthesis: none;
}
```

Preload only `UMSans-Variable.woff2` for the full kit or the Roman Latin Core
file for the subset kit. Keep `font-display: swap` and test layout shift on
slow 4G. The included Arial fallback is calibrated with `size-adjust: 112.33%`
and metric overrides; details live in `FONT-METRICS.md`. Use weight 400 for
body, 500 for interface, 600 for headings and 700 for short display emphasis.

Do not apply negative letter-spacing globally. Optical size already tightens
large text. Body text should remain at 16 px or larger on the ULTIMA MILLA site.

`webfont-manifest.json` contains file sizes and SHA-256 hashes. `package.json`
is a local package descriptor; it does not claim publication in a registry.
