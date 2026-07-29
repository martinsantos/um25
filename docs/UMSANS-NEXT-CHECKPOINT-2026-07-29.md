# UMSANS next checkpoint — 2026-07-29

Base local: `UMSANS-2.0-alpha6-redesign-partial-2026-07-24` (`998cb9d`).
Rama de continuidad: `codex/umsans-next-2026-07-29`.

## Estado recuperado

- El worktree inicial estaba limpio y exactamente en el tag, con `HEAD` desacoplado.
- UM Sans 1.2 continúa como familia pública estable.
- UM Sans 2 Manual Alpha 7 continúa aislada y marcada `DO-NOT-SHIP`.
- No hubo despliegue ni cambios de infraestructura.

## Ciclo 1 — compuerta estática

- `npm ci --no-audit --no-fund`: aprobado.
- `npm run typecheck`: aprobado.
- `npm run lint -- --quiet`: aprobado.
- Contratos focalizados UMSANS, responsive e information hubs: 75/75 aprobados.
- `npm run audit:css`: 0 errores comerciales; detectó una advertencia de peso 900 en el specimen estable.

## Ciclo 2 — corrección focalizada

- El numeral display de `.ums2-composition--data strong` se limita a peso 800.
- Se agrega un contrato de regresión para impedir el retorno a peso 900 en esa composición.

Verificación:

- `npm run audit:css`: 0 hallazgos.
- `npm test -- --runInBand __tests__/umSansFontContract.test.js`: 10/10 aprobados.
- `git diff --check`: aprobado.

## Ciclo 3 — home desktop

- Auditoría estricta focalizada: `home default`, `1440x900`, 1/1 aprobada y sin fallas.
- H1: 58px/700, UM Sans 1.2, sin overflow ni texto cortado.
- Navegación: visible, 66px de alto y sin colisiones.
- CTA principal: `#DC2626` con texto blanco; dos acciones visibles en el primer viewport.
- Captura estable: `/Users/santosma/.codex/visualizations/2026/07/29/019fad63-e766-7eb0-8e30-e4636b579702/umsa-home-1440x900-stable.png`.

Nota de QA: una captura CLI inicial se tomó durante la animación de entrada y produjo un falso positivo de contraste. La comprobación estable esperó la animación, confirmó los estilos calculados y fijó `scrollY=0`.

## Ciclo 4 — home mobile

- Auditoría estricta focalizada: `home default`, `390x900`, 1/1 aprobada y sin fallas.
- H1: 38px/700; dos CTA completos antes de 645px.
- Sin overflow horizontal, imágenes rotas, texto cortado ni colisiones de navegación.
- Botón de menú: área `44x44`, `aria-label="Abrir menú"`, `aria-expanded="false"` y `aria-controls="mobileMenu"`.
- Captura estable: `/Users/santosma/.codex/visualizations/2026/07/29/019fad63-e766-7eb0-8e30-e4636b579702/umsa-home-390x900-stable.png`.

Pendiente inmediato: continuar con `/servicios` en desktop y mobile, manteniendo una captura por revisión.

## Ciclo 5 — servicios desktop

- La captura focalizada confirmó composición y CTA correctos, pero el H1 calculaba peso 800 mediante `--um-display-weight`.
- Se fija el H1 de `/servicios` en peso 700 para respetar el contrato editorial activo y mantener coherencia con home.
- Se agrega un contrato de regresión en `visualInformationHubContracts.test.js`.
- La primera revalidación siguió leyendo peso 800 aunque el HTML compilado ya contenía 700: el perfil temporal del runner conservaba caché/service worker entre corridas.
- El runner ahora desactiva la caché de red y limpia únicamente `service_workers,cache_storage` de su origen de auditoría antes de navegar.
- Se agrega contrato de regresión para que la compuerta no vuelva a auditar CSS obsoleto.
- El rastreo de cascada identificó la causa real restante: el token global `--um-hero-weight: 800` se aplicaba con `!important` sobre la regla local.
- El token público se corrige a 700, consistente con `DESIGN.md`; el runner conserva 800 sólo como excepción gobernada, no como valor por defecto.

Verificación final de `/servicios`:

- Desktop `1440x900`: auditoría estricta 1/1, H1 52px/700, CTA visible y 0 fallas.
- Mobile `390x900`: auditoría estricta 1/1, H1 36px/700, CTA visible a 350px y 0 fallas.
- Mobile sin overflow, imágenes rotas, colisiones, texto cortado ni pesos sobre 700.
- Captura mobile estable: `/Users/santosma/.codex/visualizations/2026/07/29/019fad63-e766-7eb0-8e30-e4636b579702/umsa-servicios-390x900-stable.png`.

Pendiente inmediato: ejecutar la compuerta integral de tests/build antes de abrir la siguiente familia (`/antecedentes`).

## Ciclo 6 — rechazo de Alpha 6 y redibujo Alpha 7

- La revisión directa a 432 px rechazó Alpha 6: la `e` de
  `Fibra certificada, operación continua.` seguía leyendo como un carácter
  defectuoso.
- Se preserva el binario Alpha 6 como evidencia rechazada y se crea Alpha 7
  (`UMSans2ManualAlpha7-DisplayBold.otf`, versión interna `0.800`) para evitar
  caché o promoción accidental del artefacto anterior.
- La `e` se redibuja desde el master manual: ojo único, barra integrada,
  apertura inferior convencional y sidebearing derecho de 48 unidades.
- No se agrega tracking, kerning, síntesis de peso ni sustitución CSS.
- El runtime público continúa en UM Sans 1.2.

Control automático nuevo:

- render real de `eeee cece rere`, `referencia eficiente` y la frase hero;
- tamaños 16, 20, 24, 30, 32, 48 y 72 px;
- falla por glifo faltante, masa de tinta separada, ojo colapsado o apertura
  cerrada;
- huella raster bloqueante por tamaño, modificable solo después de una nueva
  revisión humana.

Evidencia humana, revisada de a una captura:

- desktop 1280×720;
- mobile 432×661, 390×900 y 360×740;
- Alpha 7 cargada realmente, `e` legible en `certificada` y 0 overflow;
- archivos en `type/um-sans-2/proofs/reviews/`.

Verificación focalizada:

- `npm run fonts:proof:um-sans-2-manual`: PASS.
- gate raster: 7/7 tamaños, huellas coincidentes y 0 fallas.
- `npm run audit:taste:um-sans-2-manual`: PASS.
- contrato UMSANS manual: 7/7 tests.

## Compuerta integral del checkpoint

- `npm run typecheck`: aprobado.
- `npm run lint -- --quiet`: aprobado.
- `npm run audit:css`: 228 archivos, 0 hallazgos.
- `npm test -- --runInBand`: 54 suites, 394 tests, todos aprobados.
- `npm run build`: aprobado; build SSR completo en `dist/`.

## Próximo ciclo

Mantener Alpha 7 en cuarentena y ampliar el control tipográfico antes de
dibujar otro glifo: auditoría de la palabra completa a 16/20 px en Chromium,
Safari y Firefox, más prueba impresa. En paralelo, el siguiente ciclo visual
del sitio puede abrir `/antecedentes` en 1440×900 y 390×900, una captura por
vez.
