# Isometric v6 — service integration

## Accepted direction

Full-project cinema belongs to Blender; authored isometrics explain service systems
and their precise components. One projection, one neutral material palette and one
UM red accent throughout. No product raster generation, WebGL service iframe or
local Blender rendering is part of this integration. The accepted MIT Hairline
software interface is retained in service 104.

## Delivered scope

Eight service pages (101–108), the home service atlas and service index share the
same illustrations. Each detail has four manual views: project system, object,
opened mechanism/layers and a precise component. SVG covers lift once on selection;
reduced motion is respected. Keyboard arrows/Home/End, pressed states, live captions
and Astro-navigation cleanup are supported. Software mounts Hairline only while
visible and unmounts when hidden. The home atlas uses one decoded image and guards
against stale loading; there is no permanent render loop.

24 SVG assets total 1,111,093 bytes before compression. Equipment is generic
explanatory geometry, not a manufacturer SKU, engineering drawing or an installed
client project. Source parameters and model geometry are in
`scripts/cine/build-isometric-v6.mjs` and `scripts/cine/isometric-models-v6.mjs`.
Regenerate using `node scripts/cine/build-isometric-v6.mjs`. The manifest records
projection, technical source references and individual asset sizes.

Distinct details include 24 switch ports, four optical cages, eight RJ45 contacts,
camera optics/IR elements, antenna reflector/feed/mast clamps, the software layers,
a monitoring console, architectural decision sheets, fire-panel battery/terminals
and an UPS/three-contact IEC connection. Service pages keep their existing content,
case evidence and enquiry links. The active campaign landing/demo/GIF/sw.js remain
untouched.

## Release

Vite hashes the SVG URLs. New service runtimes are versioned v6 because the scoped
production overlay preserves already published public files. Superseded product
movie experiments remain in Git for provenance but are excluded from deployment
artifacts and rsync staging. The full-project Blender v4 movies remain unchanged;
they are not presented as newly rendered or approved v5 cinema.

The production disk is still 96% after the separately authorized inactive dependency
cleanup. See `storage-maintenance-20261004.md`. Merge and production publication must
respect feature → develop → master, CI checks and the server storage rule.

## Validation

Six new tests verify all 24 SVG files, component geometry contracts, manual view
changes, keyboard focus, listener cleanup and the home decoder race. Full lint,
TypeScript, CSS audit and build passed; all 59 suites / 442 tests passed. Native
production-build QA exercised all four views on every service at 390 px, 360 px
overflow and Hairline visibility cleanup. Desktop/tablet QA also covered 1280/1440/834 px, the full-width mega-menu and
Escape closure. Mobile home selectors precede the figure and long names stay
inside their targets. The feature PR records publication status.

La revisión final detectó y corrigió el cierre visual del mega-menú con Escape
cuando el puntero permanece encima. Hover, teclado y clic comparten ahora el mismo
estado; se añade un test de interacción real sobre el bloque de navegación.
La reproducción H.264 y la pausa manual del hero se verificaron en el navegador
nativo del Mac, con preview visible.
