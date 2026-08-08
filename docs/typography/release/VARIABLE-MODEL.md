# Variable model

UM Sans ships separate Roman and Italic variable fonts.

| Axis | Range | Default | Purpose |
|---|---:|---:|---|
| `wght` | 100–900 | 400 | Continuous typographic mass |
| `opsz` | 14–32 | 14 | Text-to-display optical behavior |

Each variable contains nine named weight instances and the `fvar`, `avar`,
`gvar`, `HVAR`, `MVAR` and `STAT` tables. `variable-model.json` publishes axes,
named instances, STAT ordering and avar mappings directly from the binaries.

Applications that do not expose variable controls should use the static OTF or
TTF family. CSS should leave `font-optical-sizing: auto` enabled unless a proofed
art direction requires an explicit `opsz` value.
