# Despiece: integración para publicación

Entrega de origen: `55c900ff1c2078dbfb87a6438487e60b61184d59`.
Integración: `feature/integracion-despiece-20261101`, mediante PR a develop y luego master.
**No publicar hasta que el usuario revise la vista previa final.**

Revisión final de paridad, correcciones y límites: [revision-paridad-20261101.md](revision-paridad-20261101.md).

## Ejecución y controles

Node 20.19.6, igual al publicador Hostinger. `npm ci && npm run check`.
`UMSA_PREVIEW=1 HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs` sirve una
vista previa no indexable. En producción no se establece `UMSA_PREVIEW`.
`node scripts/propuesta/integration-smoke.mjs http://127.0.0.1:4321` comprueba
rutas canónicas, redirecciones, imágenes y supervivencia de rutas auxiliares.
El workflow Vista previa corre además las pruebas operativas y el control visual con axe.
Las cifras históricas de Lighthouse de la entrega no sustituyen los controles de esta integración.

## Despieces interactivos de equipos

Redes (101), Seguridad (102), Telecomunicaciones (103), Incendios (107) y
Eléctricos (108) reutilizan sus dibujos originales con tres vistas: equipo,
despiece y detalle. El recorrido se pausa al elegir una vista, salir de pantalla
o esconder la pestaña. Con movimiento reducido arranca abierto y sin reproducción.
Software conserva su película; los servicios profesionales no reciben equipos genéricos.

`BASE_URL=http://127.0.0.1:4381 node scripts/propuesta/device-control.mjs`
requiere Playwright (o `PLAYWRIGHT_MODULE` apuntando al módulo instalado).
Comprueba los cinco equipos en 1440, 834, 390 y 360 px, teclado, pausa,
progresión automática y movimiento reducido. Revisión local del 1/11: 20 casos
correctos; axe sin infracciones WCAG A/AA en las cinco páginas a 1440 y 390 px.

## Cierre visual y cotejo de contenido

Revisión del 1/11/2026: ocho servicios, nueve sectores y ambos índices. Cabecera,
desplegables, aperturas y contenido comparten eje lateral también en móvil y en
las páginas especializadas Software/Seguridad. Los códigos del menú llevan
padding propio; título y descripción comparten columna. Los controles de movimiento
son iconos con nombre accesible, sin rótulos de reproducción visibles.

Las cabeceras usan el texto comercial vigente en producción, sin las métricas
antiguas incrustadas en descripciones. El catálogo conserva las 520 fichas; la
clasificación ya no considera consultoría la frase genérica «equipo de ingeniería
de Última Milla», ni software cualquier «sistema» de detección. Cuando un título genérico de
Software contradice el alcance histórico concreto, prevalece este último para
la etiqueta del servicio; se comprobó el caso 3140 y otros diez casos concretos. Las solicitudes
10877 y 10881 siguen en las fuentes, pero no se presentan como obras ejecutadas.
Los contadores ambiguos del desplegable de sectores se retiran; las páginas y el
archivo usan los registros del mismo catálogo. Se conservan las seis capacidades
completas de cada servicio, fichas PDF, productos y enlaces públicos.

Validación: build, lint (sin errores; avisos preexistentes), tipos, auditoría CSS y
548 pruebas; revisión responsive a 1440/1280/834/390/360 px, axe en escritorio y
móvil, navegación y contacto. Evidencias locales fuera del repositorio:
`/private/tmp/umsa-final-acceptance-20261101/`. La revisión sigue siendo local;
no sustituye el control autenticado de Directus en el futuro despliegue.

## Alcance de la publicación

Los componentes permanecen en `src/pages/propuesta`, pero `src/middleware.ts` sirve
el diseño en `/`, `/servicios`, `/sectores`, `/antecedentes`, `/blog`, `/nosotros`,
`/contacto`, `/documentacion`, `/privacidad` y las cuatro páginas de inglés.
El índice del blog usa el diseño integrado; sus artículos conservan el lector completo de producción (índice, enlaces temáticos y metadatos).
La lista exacta está en `src/lib/despieceRoutes.ts`: sólo GET/HEAD y rutas explícitas.
Las URLs antiguas de propuesta, sectores y servicios redirigen 301 a su URL pública.
API, CMS, DGE, ARCA, status, recursos de marca, plantillas, descargas y fichas PDF
no se reescriben. Los parámetros de búsqueda se conservan.

Producción se administra con systemd en Hostinger, mediante
`.github/workflows/hostinger-production.yml`. No usar el antiguo despliegue PM2 ni
el servidor LINEASDNS retirado. El publicador vigente conserva la versión anterior,
valida la nueva antes del cambio y sólo sustituye el proceso web UMSA.
No se modifican bases, secretos, DNS, nginx ni otros servicios con esta integración.
El paquete contiene `dist`, dependencias y manifiestos: las isometrías se leen de
`dist/client` en ejecución, y de `public` únicamente durante desarrollo.

## Contenido pendiente de la entrega

313 fichas sin descripción, 142 sin sector y 93 sin servicio en las fuentes;
fotografías reales que sustituyan imágenes editoriales; renders ortográficos de
Blender para rayos X; decisión sobre el rastreo completo de Sentry.
No se inventan datos para rellenarlos ni se cambia Sentry en esta integración.

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


### Integración local: paridad con producción (1 de noviembre)

La rama `feature/integracion-despiece-20261101` permanece en revisión, sin publicación. Reutiliza la navegación y el formulario de contacto de producción, conserva las nueve secciones y las rutas especializadas, y recupera búsqueda, orden y filtros del catálogo. `scripts/propuesta/parity-control.mjs` comprueba estas interacciones en escritorio y teléfono, incluida la persistencia al recargar URLs antiguas.

La película `cine-software-system-v27` no estaba en el repositorio ni en el runtime público vigente (404). Se recuperaron sus seis archivos de la copia conservada de la migración, verificando sus SHA-256 antes de procesarlos. Los MP4 originales eran 4K; las copias para web conservan los 20 segundos completos en H.264, a 1920 píxeles y 1080 píxeles (cuadrada), CRF 23 y faststart. Las copias originales y los backups del servidor no se modificaron. SHA-256 del original horizontal: `d37a4e0e273d6fe968450e92e8950b27a707f3dec101f714ed0e1d542a36d518`; cuadrado: `5e0750430878ca7cfe969610e55ebec01d948fe6cc2e6f97324d4f5773f0bbb6`.

Las credenciales del CMS permanecen en producción. El acceso autenticado desde el runtime activo respondió 200 para Servicios, Antecedentes y blog_posts; las vistas previas sin credenciales usan el respaldo del catálogo y el contenido público del blog. Esto no sustituye el control del runtime autenticado previo a publicar.

### Tratamiento visual por servicio (1 de noviembre)

Software (104) usa una apertura de película en flujo normal, con reproducción y pausa y respeto por movimiento reducido. No revela un edificio al desplazar la página ni repite monitores o inventarios de hardware. Soporte (105) y Consultoría (106) usan sus fotografías editoriales y el alcance del servicio; las instalaciones físicas conservan sus despieces. La ruta especializada `/software` también deja de insertar el edificio bajo la película. Se conservan los casos, proyectos, cifras, descargas y enlaces.

El control de paridad verifica reproducción, pausa, inicio manual con movimiento reducido, ausencia de diagramas de instalación en los tres servicios profesionales y conservación del despiece en Redes. No se ha publicado esta revisión.

### Integración visual de servicios y sectores (1 de noviembre)

- Los ocho servicios abren con su fotografía editorial propia, excepto Software, que conserva su película. Las cinco instalaciones físicas tienen un único dibujo de su equipo en «Qué cubre». El inventario inferior mantiene nombres y cantidades, sin repetir miniaturas.
- Los siete sectores físicos usan su propia fotografía en la apertura. Debajo se conserva un solo esquema contextual: terminal en Aeropuertos, bodega en Bodegas, edificio en Constructoras, planta en Industria, mina en Minería y clínica en Salud. Gobierno muestra los servicios para organismos públicos sin edificio genérico. Sólo los servicios físicos activan recorridos en los esquemas; Software, Soporte y Consultoría conservan enlaces directos a sus proyectos. Se retiró la miniatura repetida que enlazaba a la misma página.
- Seguridad Electrónica usa la imagen del centro de monitoreo, sin vuelo aeroportuario ni catálogo de ocho sistemas ajenos. Sus casos y los de Software usan las imágenes y enlaces del catálogo compartido con las fichas.
- El fondo horneado del video de Software y de sus pósters se normaliza mediante `SoftwareFilmTone.astro`, con filtros separados para el MP4 y el AVIF. La mezcla se hace contra el fondo real de la página; no se recorta el contenido ni se modifican los originales. La captura de navegador verifica RGB 10/11/13 tanto fuera como dentro del fondo del video y del póster.

Validación local: 19 rutas por cinco anchos (1440, 1280, 834, 390 y 360), 95 combinaciones sin desbordes ni imágenes rotas; compilación, tipos, lint y 534 pruebas; smoke de 37 rutas y 600 recursos. Capturas y resultados detallados fuera del repositorio en `/private/tmp/umsa-service-sector-20261101`. Las imágenes editoriales existentes son ilustraciones generadas, no una afirmación de fotografía documental de cada obra. Sigue pendiente la aprobación de publicación; producción no fue modificada.

## Película de Software sin rótulos de autoría

La fuente v27 y sus dependencias se recuperaron del commit `a334e802` en
`scripts/cine/`. El render limpio es el predeterminado; `--inspection-overlays`
permite volver a mostrar cotas y etiquetas únicamente para inspección. Las
pantallas, su contenido funcional y el movimiento se conservan. Las fuentes
para Blender se preparan con `prepare-blender-fonts.py` en una carpeta temporal,
sin alterar las tipografías web. Blender 5 usa el motor `BLENDER_EEVEE`.

Los archivos `cine-software-system-v27-clean*` conservan 20 segundos a 60 fps,
1920×1080 en escritorio y 1080×1080 en la composición móvil. El nombre nuevo
impide reutilizar los videos anteriores desde la caché. La variante anterior se
conserva. Para regenerar: `render-software-system-v27.py --start 0 --end 1199
--width 1920 --samples 8 --font-dir <fuentes-preparadas> --output <frames>`;
para móvil, agregar `--composition mobile --width 1080`.
