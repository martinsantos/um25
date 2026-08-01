# Embedding and distribution channels

The controlling license is SIL Open Font License 1.1. Every binary also uses
`OS/2.fsType = 0`, the OpenType setting for installable embedding.

| Channel | Permitted package | Operational requirement |
|---|---|---|
| Desktop | OTF or TTF | Install only one build/version at a time |
| Web | WOFF2 | Serve with the OFL notice and correct cache headers |
| Application | TTF/OTF/WOFF2 | Bundle the OFL and preserve attribution |
| Ebook | Embedded OTF/TTF | Confirm the reader supports embedded fonts |
| PDF | Embedded subset or full font | Inspect the exported PDF font list |
| Server | Package binaries | Keep the license and do not expose unrelated secrets |
| Print | Embedded PDF or outlined final art | Keep an editable source with live text |

OFL permits commercial use and redistribution; it does not transfer exclusive
ownership of the upstream Inter skeleton. `embedding-rights.json` records the
technical flag for every shipped binary.
