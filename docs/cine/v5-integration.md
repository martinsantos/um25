# Historical v5 experiments — superseded by isometric v6

The product tours, WebGL service iframe and former home story described below are
superseded. They are retained as source provenance; the production candidate uses
`isometric-v6.md` for all eight service explanations. The deployment artifact and
upload exclude unused v5 product media and the replaced service runtimes. Existing
whole-project Blender v4 cinema and the v5 banner performance fixes remain active.

# Cine v5 — integration and provenance

Blender 4.5.3 LTS, official headless bpy / Cycles CPU, four threads. No Blender MCP
was available. No Blender process or heavy render ran on the Mac. Own generic
models, not manufacturer CAD or actual client installations.

Five compact H.264 product tours, 18 s / 432 frames / 24 fps / 1600×1000.
They compose registered stills with 2–3.5% image drift and 0.6 s dissolves;
they do not claim real 3D parallax or 432 independently rendered Cycles frames.
Redes: rack → patch/switch connections → empty RJ45 macro, eight contacts.
Other services: product → mechanism → native macro, all in the same camera registry.
UPS and antenna macro refinements are pending the final Cloud revision.

Durable source packages are saved in the original Mac checkout under
work/cine/entregas/blender-v3-cloud-20261004 (sources, .blend, PNG/WebP, layers,
manifests and hashed ZIPs), and in the UM Cloud Library. Only compact web files
are committed. Cloud chat: https://chatgpt.com/c/6ac2ac5b-c684-83e8-9b68-e4ffe60f2744.

Software retains the accepted MIT Hairline isometric app-window language. Only
the exploded figure is bundled (14.7 kB). The source adds activeLayer/expansion
options for equivalent keyboard controls. Rebuild with:
node scripts/cine/build-hairline-v5.mjs.

UI: still fallbacks, keyboard views, explicit video/tour pause, live reduced-motion
preferences, offscreen/hidden-page suspension, stale-load protection and observer
cleanup. Home uses one decoded product movie; the WebGL iframe requires a click
and is removed on close. Published v4 assets remain immutable; v5 uses new names.
Campaign landing/demo/GIF/sw.js remain unchanged.

Local validation: lint and TypeScript passed; CSS has zero commercial errors.
58 test suites / 435 tests passed. Production build completed. Real WebKit browser
QA continues on desktop and mobile before the release is merged.

Deployment: feature → develop → master through GitHub Actions. Production disk
96% blocked the release. Owner separately authorized the audited dependency-only
maintenance and deployment after tests. See storage-maintenance-20261004.md.


## 2026-10-05 — Piloto con cámaras Blender animadas

Se retomó el executor de Cloud del mismo chat Blender. El nuevo piloto Bodega /
Redes usa tres planos de ocho segundos, 1920 × 1080 y 24 fps. Arquitectura →
recorrido de red y fibra → gabinete/conexión. La cámara se anima en Blender,
con paralaje real; no es una composición de tres stills. No hay proceso Blender
en el Mac, MCP disponible ni proveedor de render pago.

El checkpoint privado contiene PNG nativos 96/288/576, contacto, fuentes,
modelo editable dividido en dos ZIP y manifiesto con hashes:
https://chatgpt.com/space/page_be8191ded5bc8191b84cecad534a9f59.
El controlador local recuperó y revisó contacto y PNG 576 mediante referencias
del Page. La arquitectura y la aproximación son legibles; el macro está demasiado
suavizado con cuatro samples y requiere más nitidez y validación temporal.

Cycles CPU con cuatro hilos y denoise HIGH/FAST midió 16,3 / 20,1 / 24,9 s por
cuadro y unos 2,11 GiB de RSS máximo en Cloud. La estimación de 3 h 16 min para
576 cuadros corresponde a esa configuración; puede aumentar al corregir calidad.
El lote se detuvo conservando cuadros y fuentes. Se ejecutó una prueba animada
480–503 y se solicitó compararla con 16 samples antes de continuar. El MP4 final
y su estabilidad temporal siguen pendientes: no se presentan como terminados
ni se integran en el sitio hasta revisarlos. No se abre otra tarea ni ventana.

La entrega web actual usa banner v6, Hairline v7, dibujos SSR completos y
controles que responden durante el streaming SSR. Véase `isometric-v6.md`.
Las películas v4 publicadas se conservan. La publicación sigue el flujo feature
→ develop → master por Actions y requiere resolver la situación de disco del
servidor documentada en el inventario anterior.
