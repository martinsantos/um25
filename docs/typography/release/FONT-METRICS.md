# Font and fallback metrics

## UM Sans Regular

| Metric | Units |
|---|---:|
| Units per em | 2048 |
| x-height | 1118 |
| Cap height | 1490 |
| Typographic ascender | 1984 |
| Typographic descender | -494 |
| Typographic line gap | 0 |

## Web fallback

The fallback is calibrated against Arial with the UMSA Spanish editorial
corpus. It prioritizes comparable line wrapping while retaining UM Sans line
metrics after scaling:

```css
@font-face {
  font-family: "UM Sans Fallback";
  src: local("Arial");
  size-adjust: 112.33%;
  ascent-override: 86.24%;
  descent-override: 21.47%;
  line-gap-override: 0%;
}
```

These values reduce layout shift; they do not make Arial visually equivalent.
Recalibrate them if UM Sans widths or vertical metrics change.
