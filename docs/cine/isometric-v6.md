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


## 2026-10-05 — Redes: gabinete y biblioteca v8

La revisión de Redes reemplaza el piloto de un solo switch por un gabinete negro
de 18U con puerta articulada, cuatro postes, rieles perforados, techo ventilado,
panel lateral, niveladores, fijaciones, frentes ciegos y cinco cordones de patch.
El rojo conserva una conexión concreta: panel 09 → switch 06. La interacción de
extraer módulos sobre rieles recupera la dirección del gabinete de Hairline; los
equipos detallados son geometría SVG propia, con una proyección y una paleta.

Nueve equipos comparten sus geometrías entre gabinete y vistas aisladas: switch,
patch panel, organizador, bandeja óptica, router, servidor, UPS, distribución IEC y
punto Wi-Fi. Cada selección conserva equipo, despiece y conexión. La bandeja de
fibra y el cassette de baterías se extraen; las otras cubiertas se apartan de sus
electrónicas. El macro conserva ocho contactos RJ45; otros detalles incluyen IDC,
LC, SFP, bandeja SSD, peine de cables y alojamiento IEC. Son modelos explicativos
genéricos, sin SKU ni atribución a un proyecto instalado.

Se integra en servicio 101 y la home. En la página de servicio, los controles
preceden al dibujo para evitar que elegir una pieza deje la animación fuera de
pantalla. En la home, la ilustración aparece primero y los controles son compactos.
El gabinete se puede abrir, explorar con el puntero y seleccionar al tocar sus
módulos. Los botones ofrecen el recorrido equivalente con teclado, flechas,
Home/End, estados seleccionados y descripciones que siguen la pieza actual.

El recorrido automático hace una sola pasada cuando el componente está visible.
Se detiene al seleccionar, cancela sus temporizadores fuera de pantalla y elimina
observadores y eventos al navegar en Astro. Respeta movimiento reducido. El SVG
completo pesa 391.756 bytes antes de compresión; el runtime, 7.837 bytes. Usa
referencias compartidas para las geometrías y transiciones de transformaciones.

Fuentes: `scripts/cine/build-network-rack-v8.mjs`,
`src/data/cine/networkAssembly.ts`, `src/components/cine/NetworkJourney.astro`.
Regenerar: `node scripts/cine/build-network-rack-v8.mjs .` desde la raíz del repo.
Los assets son `src/assets/cine/isometric/network-rack-v8.{svg,json}`; el runtime
nuevo es `public/cine/network-rack-v8.js`. La whitelist scoped admite estos paths
sin modificar assets ya publicados. Las movies Blender requieren su revisión
visual pendiente; esta entrega no las presenta como renovadas.

Validación: 60 suites / 453 tests; lint y TypeScript sin errores, con 12 warnings
de lint preexistentes. Auditoría CSS: cero errores comerciales, diez warnings
preexistentes. Revisión nativa: nueve despieces en escritorio; nueve piezas,
despieces y conexiones en móvil de 360 px; tablet 834 y escritorio 1280/1440.
Se corrigieron los recortes de fibra y servidor. La home mantiene la selección,
el título y el enlace al cambiar entre Redes y Software. El build se verifica por
CI en el PR de esta rama. La preview local sigue en el puerto 4326.

## 2026-10-05 — Acabado y precisión isométrica

El gabinete y los nueve equipos incorporan un acabado común de metal iluminado,
planos neutros y contornos jerarquizados sobre negro. Se reconstruyó el switch
sin importar geometría de otra proyección: 24 puertos en dos filas, cuatro SFP,
bancos de conexiones, placa, ASIC, disipación y alimentación. Todas las matrices
usan el coseno de 30° sin redondearlo a 0,87; los tres ejes conservan igual escala.

Las tapas se elevan por Z; organizador, fibra y baterías se extraen por Y. Las
guías de despiece salen de esas mismas coordenadas. En el servidor se alinearon
ocho unidades con sus bahías, separando almacenamiento, ventilación y memoria.
El macro RJ45 usa un blindaje abierto, ocho contactos, un plug y su traba en la
cara opuesta. La conexión se anima una vez; la señal hacia Wi-Fi hace tres pasadas.
El punto Wi-Fi conserva la escala del gabinete. El cordón sale por el frente y
queda oculto al pasar detrás del chasis; conecta el puerto 18 con el punto Wi-Fi.

En móvil los cuatro estados ocupan una fila y el selector nativo ofrece los nueve
equipos. Al cambiar entre equipos, la geometría entra con su escala correcta y
un fundido de 180 ms; se evita interpolar el zoom y la apertura del modelo previo.
Las transiciones de vistas conservan el recorrido. Animaciones y temporizadores
se cancelan al salir de pantalla, ocultar la página o navegar; movimiento reducido
mantiene la exploración disponible.

Los modelos siguen siendo explicativos y genéricos, sin SKU ni atribución a una
instalación real. Este acabado se integra en Redes y en la home; la revisión de
las movies Blender conserva su alcance separado.

Validación técnica: 60 suites / 457 pruebas; lint y TypeScript sin errores. Se
añadieron contratos de proyección, escala compartida, coordenadas de conexión,
selección móvil, visibilidad y cancelación al cambiar de equipo. La validación
visual y el build de la revisión quedan registrados junto con la entrega.
