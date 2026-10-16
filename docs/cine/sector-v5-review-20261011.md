> Estado actualizado del 16/10/2026: ver [memoria de traspaso](handoff-20261016/MEMORIA-UM25.md). Tres sectores ensamblados, integración visual final pendiente y 28 tramos sin copia local; los artefactos remotos originales ya no se listan.

# Architectural sector films v5 — local review

## Scope
Six authored sector journeys, each with a native landscape and square composition. Blender executes only on standard GitHub-hosted Ubuntu runners. No production promotion; local selection uses `UM_SECTOR_REVIEW=v5` alongside the approved Software candidate `UM_SOFTWARE_REVIEW=v27`.

## Reference and diagnosis
Solvaix: https://x.com/Solvaix/status/2106830508797706560. Compared the original 4 s and 12 s reference frames with all six delivered movies. Five old camera paths converge on the same rack, because the previous renderer interpolates the opening and final camera poses while skipping the sector-specific middle pose. Most systems also share an undifferentiated red line treatment.

The reference's useful qualities are registered layers, clear architectural context, readable systems and restrained transitions. Its hotel program and unrelated plumbing/HVAC services are not reused as UM claims.

## Authored narratives
- Building: a representative office floor, workstations, the distribution tray, then separated systems.
- Clinic: care positions with headwall modules, bed hardware and monitoring; then nursing and technical layers.
- Terminal: check-in, baggage rollers and readers; then gate control and terminal-wide systems.
- Plant: manufacturing equipment and its connections; then the electrical/control panel and system separation.
- Winery: tank instrumentation and sanitary hardware as process context; then the bottling line and technical systems.
- Mine: a distributed site, antenna line of sight, dispatch and connections routed at terrain level; detection remains within modules.

## Iteration evidence
- `38185754152`: rejected before rendering because a reusable-workflow number input arrived as a string. Corrected explicitly; no images produced.
- `38185960569`: 18 native proof views completed. Found annotation collisions, mirrored floor text, overly similar building envelopes and noisy transparency.
- `38186276768`: second proof with isolated labels, contextual construction details and a clean studio backdrop. Includes consecutive frames to benchmark complete production.
- `38187399680`: all 18 proof views completed with registered footprints and camera fitting against the expanded systems. No expanded layer is clipped.
- `38187859426`: Cycles CPU benchmark, 8 samples, directional normal materials, baked bevel geometry. Four consecutive native 4K frames took 12.59, 12.87, 11.88 and 11.97 seconds. Compared with the preceding Eevee proof; geometry, circuit separation and typography preserved.
- `38188171524`: complete 12-film production launched from `f2d8a980`; 108 native segments, 12,960 frames. Delivery pending.

## Integration and verification
Local presentation gives the movie its own complete frame; captions follow its actual media clock. The home keeps its automatic sector playlist. Native square movies have their own camera composition, rather than a crop of the landscape frame.

Before importing delivery, `assemble-sector-v5.py` verifies every source range, source hash, native dimensions, frame count and frame rate; concatenates encoded parts without a generation loss; decodes every delivered frame; and creates posters and SHA-256 records. Existing public assets remain immutable.

Current local checks: typecheck, production build and 78 sector/reproduction tests passed. Complete delivery and browser comparison are still pending and must be recorded here before calling this work complete.
