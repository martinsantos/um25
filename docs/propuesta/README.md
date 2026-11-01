# La propuesta (/propuesta): cómo se opera

Sistema "Despiece", octubre de 2026. Vive en `src/pages/propuesta`, `src/components/proto`,
`src/styles/proto-despiece.css` y `public/js/propuesta-apertura.js`. No se indexa (robots noindex en
cada página) hasta que reemplace al sitio.

## Entrega (1 de noviembre de 2026)

Estado de cierre en la rama `feature/portada-despiece-20261030`. Para migrar o desplegar desde otro
entorno alcanza con esta rama: no depende de nada fuera del repositorio salvo lo que ya usa el
sitio (Directus en producción, con copia en `src/data/snapshots/antecedentes.json` si no responde).

- **Compilar y servir:** `npm ci && npm run build && node dist/server/entry.mjs` (Node 18 o más,
  puerto `PORT`, 4321 por defecto). La propuesta vive bajo `/propuesta`; el sitio actual no cambia
  de rutas. PM2 en producción: `ecosystem.config.js`.
- **Verificar antes de publicar:** `npm test`, y el control visual (abajo) contra el sitio
  levantado. En CI corre solo en cada push a `feature/portada-*`.
- **Publicar la propuesta como sitio:** quitar el `noindex` de `src/components/proto/Head.astro`
  y redirigir las rutas actuales a las de `/propuesta` (o mover `src/pages/propuesta` a la raíz).
  No hace falta tocar datos.
- **Regenerar dibujos:** comandos en la cabecera de `scripts/cine/render-glb.mjs`; variantes de
  fotos con `scripts/propuesta/imagenes-960.mjs`; datos de SGI con `scripts/propuesta/sgi-exportar.mjs`.
- **Medido al cierre** (Lighthouse móvil, compilación de producción): portada 90, servicio 88,
  sector 88, muro 91, ficha 91, nosotros 92; accesibilidad y buenas prácticas 100; CLS 0; axe sin
  violaciones en 124 páginas y anchos.
- **Pendiente que no es código:** 313 fichas sin descripción, 142 sin sector y 93 sin servicio
  (Directus o SGI); fotos de obra reales en lugar de las editoriales; renders ortográficos de
  Blender (azimut 42°, elevación 30°) para superponer película y dibujo; decidir si el guion de
  Sentry lleva rastreo completo (44 KB en cada página).

## Reglas del sistema

- **Un medio por pantalla.** La apertura muestra el lugar real a pantalla completa (película de
  Blender en sectores, foto en portada, servicios y nosotros) y, con el scroll, se retira; recién
  entonces se dibuja la isometría, sola. Nunca los dos a la vez: salen de cámaras distintas.
- **Una pieza por miniatura.** Las partes isométricas van de a una, al lado de su fila del
  inventario. Nunca varias piezas en una misma escena.
- **Nada inventado.** Todo texto sale del catálogo, de SGI o de `relato.ts`. Lo que falta se dice
  ("el registro no detalla el alcance", "obra en curso").
- **Un rojo.** El de marca (`--red`) para marcas, puntos y subrayados; el de texto (`--red-text`)
  cuando el rojo es texto, porque el de marca no llega a 4,5:1 sobre el fondo.

## Dibujos

Todas las isometrías salen de los modelos 3D de `public/3d/models` con `scripts/cine/render-glb.mjs`
(líneas ocultas por z-buffer, sólidos sombreados debajo, un grupo por sistema). Nada dibujado a mano.

| Dibujo | Modelo | Dónde se usa |
|---|---|---|
| `site-building-v3.svg`, `site-terminal-v3.svg`, `site-winery-v3.svg` | edificio, aeropuerto, bodega | apertura, sector por dentro, ficha, muro, sistema de cada servicio del sitio actual |
| `site-building-v3-corte.svg`, `site-building-v3-planta.svg` | edificio cortado a dos plantas; la planta baja sola | consultoría, en el sitio actual |
| `service-104.svg`, `service-105.svg` y sus `-detalle` | un puesto de trabajo; la sala de servidores (modelos del hospital) | equipo de software y de soporte, en la propuesta y en el sitio actual; índice de servicios; pósters |
| `service-101/102/103/107/108.svg` | switch, cámara, radioenlace, central, UPS | ídem (generación anterior, con despiece en el sitio actual) |

Los equipos van autónomos (`--autonomo`: hoja de estilo y sólidos incrustados) porque también se
cargan como imagen; los sitios comparten la hoja de la propuesta. Los comandos exactos están en la
cabecera del generador. Las láminas dibujadas a mano de consultoría, software y soporte se retiraron.

## Datos

| Fuente | Qué aporta | Dónde |
|---|---|---|
| Catálogo web (Directus; copia en `src/data/snapshots/antecedentes.json`) | Título, cliente, descripción, foto, área, id de SGI | `loadStories()` en `src/components/proto/isoData.ts` |
| SGI | Fecha de inicio, cierre y estado de cada proyecto | `src/data/sgi/fechas.json`, por id web, sin datos internos |
| El muro como datos | Las 520 fichas en lo que muestra cada tarjeta, para filtrar y pedir más sin recargar | `/propuesta/antecedentes/datos.json` (`src/pages/propuesta/antecedentes/datos.json.ts`) |
| Obras en curso de SGI sin ficha en el catálogo | Título, cliente, fechas, sector y servicios leídos del título | `src/data/propuesta/antecedentes-extra.json` (se retiran cuando entran al catálogo) |
| Relato de la empresa, principios, casos destacados | Portada, nosotros, sectores | `src/components/proto/relato.ts` |

Reglas aplicadas al servir, en `titulos.ts`, `sectorReal.ts` e `isoData.ts`: limpieza de títulos y
clientes, títulos repetidos distinguidos por descripción, mes o día, siglas solas escritas completas,
descripciones que repiten el título recortadas a lo que agregan. El sector de una ficha sin lugar se
toma del cliente sólo cuando la evidencia pesa (tres fichas o más con ese sector, un tercio o más de
todas las del cliente); el
servicio sale del área del catálogo cuando el área es un servicio, o del texto; el área comodín
("Soluciones Tecnológicas") no cuenta como software, y sin evidencia la ficha queda sin servicio.

## El muro

El filtro vive en la URL (`?sector=…&service=…&year=…&cliente=…`) y el servidor ya lo aplica: la
página llega con las primeras 48 fichas que cumplen, las cuentas de cada lente y la cifra, así que
nada cambia después de pintar y la página filtrada vale sin JavaScript. Al tocar una lente o
"Mostrar más", el guion trae los datos una sola vez (al primer gesto sobre el panel, o cuando la
página queda quieta) y recompone el muro en orden, creando las fichas que faltan con el mismo molde
que las servidas. Los lugares por dentro van delante de la ficha de su índice (0, 18, 60, 120); con
año o cliente, o con menos de doce resultados, no van. El sistema de cada ficha al pasar el puntero
vale también para las creadas: los eventos están delegados en el documento.

## Traer datos de SGI

```bash
SGI_USER=… SGI_PASS=… node scripts/propuesta/sgi-exportar.mjs
```

Deja el volcado completo en `.sgi/` (fuera de git: es información interna y el repositorio es
público) y actualiza `src/data/sgi/fechas.json`. La credencial no se escribe en ningún archivo.

## Control visual

```bash
npm run dev
node scripts/propuesta/control.mjs --base http://127.0.0.1:4321 --out control-propuesta
```

Recorre diecisiete páginas (el muro, también filtrado) a cuatro anchos (1440, 1310, 1024, 390),
los ocho servicios y los siete sectores a dos anchos, una muestra de ocho fichas, y rastrea
enlaces, imágenes y medios. Falla ante:
`<title>` dentro de un SVG (tooltip), desborde horizontal, figura fuera de pantalla, más pantallas
que el presupuesto, cambio de alto al recorrer la página (contenido que salta), error de consola o de
página, fondo que no cubre al inicio o no desaparece al final de la apertura, película que no
arranca, lugar por dentro que no recorre sus sistemas solo, ficha del muro que no muestra su
sistema al pasar, más de 1,8 MB de recursos en teléfono, cualquier enlace o imagen que devuelva error.

Con `AXE_MODULE` apuntando a `@axe-core/playwright`, cada página y ancho pasa además por axe (WCAG
2.1 AA y buenas prácticas) y cualquier violación es un defecto. El runner lo hace siempre.

Deja las capturas y `informe.md` en la carpeta de salida. El informe incluye la auditoría de
contenido de las fichas (`/propuesta/auditoria.json`) y el cruce con SGI en cantidades.

Corre solo en cada push a `feature/portada-*` (`.github/workflows/preview.yml`): construye, corre
el control, adjunta las capturas como artefacto `control-propuesta`, abre un túnel temporal y deja
el veredicto y el link en el estado del commit. Cada push cancela la vista previa anterior; el link
nuevo tarda unos veinte minutos.

## Auditorías manuales que ya pasaron

Además del control, sobre la compilación de producción:
- html-validate (reglas recomendadas) en diez páginas: sin errores.
- Lighthouse móvil (4G lento simulado, sin compresión del servidor): portada 90, servicio 87,
  muro 90 (filtrado, 100), ficha 91, sector 88, nosotros 91; accesibilidad 100 y buenas prácticas
  100 en todas; CLS 0 en todas. SEO queda en 58 sólo por el noindex deliberado de la propuesta. El
  muro servía las 520 fichas en 400 KB de HTML y daba 66: ahora sirve 48 (55 KB) y el resto como
  datos (197 KB, 25 KB con gzip) que se piden recién al filtrar o pedir más. Lo que queda por
  encima en todas las páginas es el guion de Sentry (127 KB, 44 KB con gzip, prioridad alta)
  compitiendo con la imagen de apertura en 4G lento; incluye el rastreo de rendimiento
  (`tracesSampleRate` 1.0): sólo errores pesaría un tercio menos. Es monitoreo de producción y se
  deja; decisión del equipo.
- Las fotos editoriales (`scripts/propuesta/imagenes-960.mjs`): variante de 480 px para cuando
  hacen de miniatura de ficha (20 KB en lugar de 340), y AVIF a 960 y 1672 px para la apertura,
  donde son el elemento LCP (la mitad del peso del WebP a tamaño completo, que es lo que eligen los
  teléfonos de alta densidad). Quien no lee AVIF ignora la precarga por su `type` y recibe el WebP
  del `<picture>`.
- Las miniaturas de ficha llevan `srcset` 480/960 con el tamaño real del hueco: nítidas en
  pantallas de alta densidad sin que el teléfono pase de la de 480.
- Las isometrías se piden con prioridad baja (`fetch(…, { priority: 'low' })`): nunca antes que la
  foto de apertura. Un `<i>` vacío del botón de filtros hacía descargar la fuente itálica (22 KB)
  en teléfono: ya no.
- Elemento LCP medido con aceleración propia (4G lento, CPU ×4): portada 1,3 s, sector 1,6 s, ficha
  1,6 s. Antes de precargar la imagen de apertura y servir variantes de 960 px: 2,1 / 1,6 / 3,3 s.
- Comparación píxel a píxel contra capturas de referencia tras cambios de base: once páginas del sitio
  actual y doce de la propuesta, idénticas.

La hoja base global de Tailwind ya no se inyecta: los layouts V4 traen `@tailwind` en `v4.css`, la
propuesta sólo el preflight en su hoja, y las cuatro páginas sueltas que lo necesitan lo importan.
Cualquier página nueva sin layout debe importar `@astrojs/tailwind/base.css` o traer su propio reset.
El script de Sentry (130 KB) se carga en todas las páginas por la integración y es monitoreo de
producción: se deja.

## Lo que no se resuelve por regla

- Descripciones vacías o mínimas: contenido, en Directus. SGI no tiene descripciones.
- Clientes sin sector: asignar en Directus.
- Fotos de obra reales: hoy son imágenes editoriales generadas.
- Un túnel con nombre fijo para la vista previa: requiere cuenta de Cloudflare.
