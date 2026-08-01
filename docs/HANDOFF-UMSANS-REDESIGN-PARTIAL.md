# Handoff parcial: UMSANS + rediseño ULTIMA MILLA

Fecha de cierre: 2026-07-24

Este documento fija un checkpoint reproducible del rediseño local de
`ultimamilla.com.ar` y del trabajo tipográfico UM Sans. No representa una
aprobación para producción.

## Referencia Git

- Repositorio: `https://github.com/martinsantos/um25`
- Rama: `codex/umsa-global-provider-ui`
- Tag: `UMSANS-2.0-alpha6-redesign-partial-2026-07-24`
- Base de integración: `develop`

## Alcance preservado

- rediseño híbrido ejecutivo de home, servicios, antecedentes, sectores, blog,
  contacto y componentes V4;
- contratos visuales, tipográficos, de contraste, interacción y responsive;
- auditorías CSS, hover, contraste y captura visual;
- documentación y artefactos del sistema UM Sans estable;
- proyecto independiente `type/um-sans-2`;
- prototipo manual `UM Sans 2 Manual Alpha 6`;
- pruebas de contratos editoriales, SEO, responsive y tipografía.

## Estado tipográfico honesto

La web conserva UM Sans 1.2 como familia estable. `UM Sans 2 Manual Alpha 6`
está deliberadamente aislada y marcada como `DO-NOT-SHIP`.

Alpha 6 es un control parcial para revisar dibujo y rasterización. No es una
familia completa ni debe registrarse en el CSS público. Continúan pendientes:

- alfabeto completo, cifras, puntuación, símbolos y cobertura de idiomas;
- corrección manual de curvas, compensaciones ópticas y espaciado;
- kerning por clases y pruebas de palabras extensas;
- masters compatibles, interpolación y cursivas originales;
- hinting y pruebas en Windows, macOS, Android, iOS, impresión y PDF;
- FontBakery sin fallas de release;
- revisión legal independiente de procedencia y similitud.

La página de evaluación local es:

`http://localhost:4322/estilo/um-sans-2-manual?v=alpha-6-review`

## Estado del rediseño

El checkpoint integra la dirección `Industrial Evidence System` / híbrido
ejecutivo y conserva rutas, Directus, canonicals, SEO y GEO. No se desplegó a
producción.

Antes de promoverlo deben revisarse visualmente al menos:

- `/`
- `/servicios` y un detalle real
- `/antecedentes` y un detalle real
- `/sectores` y dos verticales
- `/blog` y una nota extensa
- `/contacto`
- los cuatro hubs GEO comerciales

Viewports mínimos: `1440x900`, `1280x800`, `834x1112`, `390x900` y `360x740`.

## Validación del checkpoint

Comandos de control:

```bash
npm ci
npm run fonts:proof:um-sans-2-manual
npm run typecheck
npm run lint
npm test -- --runInBand
npm run audit:visual:strict
npm run build
```

En este cierre:

- compilación y auditoría específica de Alpha 6: aprobadas como prototipo
  aislado;
- typecheck y lint: aprobados;
- build alternativo con `astro build --outDir dist-alpha6`: aprobado;
- el build estándar encontró falta de espacio local al copiar el árbol de
  imágenes, no un error de compilación. `dist-alpha6/` queda ignorado.

## Cómo retomar

```bash
git fetch origin --tags
git switch codex/umsa-global-provider-ui
git pull --ff-only
npm ci
npm run dev -- --port 4322
```

Para inspeccionar exactamente este cierre sin mover la rama:

```bash
git switch --detach UMSANS-2.0-alpha6-redesign-partial-2026-07-24
```

Para continuar, crear una nueva rama desde el tag:

```bash
git switch -c codex/umsans-next \
  UMSANS-2.0-alpha6-redesign-partial-2026-07-24
```

## Regla de continuidad

No declarar una versión tipográfica como correcta solo porque compila. Cada
promoción requiere capturas reales, comparación de glifos a múltiples tamaños
y aprobación humana de palabras completas. No desplegar a producción desde
este tag; integrar por PR a `develop` y luego seguir el flujo protegido.
