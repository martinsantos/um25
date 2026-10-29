# Rediseño UMSA 2026-10-29 — Análisis de producción y plan de UI

Fecha: 2026-10-29
Base: `origin/develop` (`aca833e`), rama `feature/rediseno-umsa-20261029`.
Fuente de los datos: auditoría real de `https://www.ultimamilla.com.ar` con Chromium
(`scripts/ui-audit/prod-ui-audit.cjs`), 11 rutas × 2 viewports (1440×900 y 390×844),
más lectura del HTML servido y del código en `develop`.

Este documento es el plan. Las fases de ejecución están pensadas para correrlas
con modelos más económicos: cada fase dice qué tocar, qué no tocar y cómo se
verifica.

---

## 1. Resumen

El sitio ya tiene una dirección visual clara (negro, UM Sans, rojo `#DC2626`,
renders 3D) y una estructura comercial correcta. Lo que lo separa del "próximo
nivel" no es más diseño: es **quitar lo que estorba al lector y hacer que cada
página pese y diga lo justo**.

Cinco problemas concentran casi todo el costo para una persona que entra a
evaluar un proveedor:

1. **Cada página comercial pesa 5 a 7 MB** por un video hero de 4,8 a 6,5 MB.
   El LCP medido en escritorio con buena red es de 2,3 a 3,8 s. En móvil real
   es peor. Blog y fichas de antecedente, que no llevan video, pesan 0,4 a 0,6 MB
   y cargan en menos de 1 s.
2. **El mismo pedido se repite 4 o 5 veces por página**: "Contactar" en la nav,
   "Pedir un relevamiento" en el hero, otra vez al cierre, "Contacto" en la barra
   móvil, y un modal "Contacto rápido" oculto en el DOM de todas las rutas.
3. **Lenguaje de sistema visible** en fichas de antecedentes: `UM-3622`,
   "Área registrada", "Tipo de trabajo: Caso operativo", "Coincidencia: 3
   servicios en común · mismo sector", y un lead de plantilla ("Ejecución
   integral de X para Y, asegurando continuidad operativa y cumplimiento de
   estándares técnicos de calidad") que repite el título y no informa nada.
4. **Piezas que confunden más de lo que explican**: la isometría "despiece" de
   la home y de cada sector (392 KB de SVG inline, ilegible en móvil), el panel
   negro vacío del atlas de sectores hasta que se toca "Reproducir recorrido",
   el explorador Sistema/Equipo/Despiece/Conector en fichas de servicio, y una
   sección "Alcance, normas y entregables" que sólo contiene un enlace.
5. **Deuda de estilos que frena cualquier cambio**: `v4.css` tiene 3.690 líneas
   y 582 `!important`; hay 23.957 líneas de CSS más dentro de 105 archivos
   `.astro` con otros 487 `!important`; conviven tres plantillas por página de
   sector y de antecedentes (editorial, atlas, um26) y páginas duplicadas o
   muertas (`_index.astro`, `antecedntes.astro`, `estilo/` y `estilos/`).

La propuesta: **un sitio más liviano, con una sola voz, una sola plantilla por
tipo de página y cero texto que no le sirva al lector.** Nada de lo que sigue
requiere cambiar Directus, rutas, canonicals ni SEO/GEO.

---

## 2. Lo medido

### 2.1 Peso y velocidad por ruta (escritorio 1440×900, red del contenedor)

| Ruta | Transferido | Video | HTML | LCP | Nodos DOM |
|---|---:|---:|---:|---:|---:|
| `/` | 5,5 MB | 4,8 MB | 461 KB | 3,8 s | 2.546 |
| `/servicios` | 6,5 MB | 6,0 MB | 60 KB | 2,3 s | 540 |
| `/servicios/101/…` | 5,4 MB | 5,0 MB | 274 KB | 3,3 s | 2.138 |
| `/antecedentes` | 5,2 MB | 0 | 933 KB | 1,8 s | 7.421 |
| `/antecedentes/3622/…` | 0,6 MB | 0 | — | 1,6 s | 493 |
| `/sectores` | 6,3 MB | 5,8 MB | 62 KB | 3,1 s | 521 |
| `/aeropuertos` | 6,0 MB | 5,3 MB | 263 KB | 3,4 s | 1.541 |
| `/bodegas` | 7,2 MB | 6,5 MB | 457 KB | 3,3 s | 2.324 |
| `/nosotros` | 5,7 MB | 5,3 MB | 55 KB | 1,1 s | 470 |
| `/contacto` | 6,5 MB | 6,0 MB | 64 KB | 1,6 s | 531 |
| `/blog` | 0,4 MB | 0 | 78 KB | 0,9 s | 559 |

En móvil (390×844) el video baja a 2,4 a 3,7 MB pero sigue siendo el 80 a 90 %
del peso. CLS es 0 en todas las rutas: la estabilidad de layout está bien.

### 2.2 De dónde sale el HTML

- Home: 392 KB de los 461 KB son el SVG inline de la isometría (`SiteDespiece`).
  Ese dibujo ocupa 85 % de la página para una pieza que en móvil mide 300 px y
  no se lee.
- `/antecedentes`: 527 `<img>` y 7.421 nodos porque se renderizan los 518
  proyectos en el servidor y se ocultan con JS ("Ver más proyectos (494)").
  Además hay 177 textos visibles por debajo de 14 px y 54 chips de filtro.
- Sectores y fichas de servicio: 209 a 403 KB de SVG inline por el mismo
  despiece.

### 2.3 Fuentes

Se cargan tres familias en paralelo: `UM Sans 2`, `UM Sans 1.2 Compatibility`
y `UM Sans` (240 a 480 KB según ruta). Para un sitio con una sola familia
editorial debería ser un archivo variable, precargado, de 100 a 140 KB.

### 2.4 Repetición de llamados a la acción (por página)

| Página | "Contactar" nav | Hero | Cierre | Barra móvil | Modal oculto |
|---|---|---|---|---|---|
| Home | sí | "Pedir un relevamiento" | "Pedir un relevamiento" + mail | "Contacto" | "Contacto rápido" |
| Sector | sí | sí | sí | sí | sí |
| Ficha servicio | sí | sí | sí + mail | sí | sí |
| Ficha antecedente | sí | sí | sí + "Enviar email" | sí | sí |

El cierre "Contanos qué tiene que seguir funcionando. / Relevamos en el lugar
y te decimos qué hace falta." es idéntico en todas las rutas. En `/contacto`
el hero y el formulario también compiten con el botón "Contactar" de la nav
que abre un segundo formulario encima.

### 2.5 Inconsistencias visibles

- H1: 52 px / 700 en home, servicios y sectores; 64 px / 600 en contacto y blog;
  86 px / 600 en nosotros. Tres sistemas de título para un mismo sitio.
- Contadores por sector en la home: Aeropuertos 109, Constructoras 80, Gobierno
  92, Salud 51, Seguridad 166, Software 126; Bodegas, Industria y Minería sin
  número. En `/antecedentes` los mismos sectores muestran otros números
  (Aeropuertos 78, Software 120). Dos verdades para el mismo dato.
- Filtro "Consultoría IT 391" sobre 518 proyectos: el dato de servicio no
  discrimina y no debería ser un filtro visible hasta que se corrija.
- Hero de `/nosotros` sin video y con otro layout; el resto con video.
  No es malo que sea distinto, pero no está decidido: es un resto de otra
  iteración.
- Página de antecedente: la imagen es un render genérico (escritorio con un
  gabinete abierto) que no es del proyecto. Mejor sin imagen que con una
  que un comprador reconoce como ajena.

### 2.6 Lo que está bien y se conserva

- Primer viewport de home, servicios, sectores y fichas de servicio: título,
  bajada y una acción. Jerarquía correcta.
- `/contacto`: formulario corto, datos directos (mail con "Copiar", oficina,
  horario), promesa clara ("Un técnico te responde por email con el próximo
  paso"). Es la página más humana del sitio. Hay que llevar el resto a ese nivel.
- `/blog`: lista limpia, metadatos mínimos, paginación. Sirve de referencia
  de densidad.
- Footer de una línea con dirección, mail y horario.
- Barra de pestañas móvil (Inicio, Servicios, Proyectos, Contacto): correcta,
  con etiquetas a 16 px.
- Menú móvil accesible (`aria-expanded`, `aria-controls`, 44×44).
- Sin overflow horizontal en ninguna ruta móvil.

---

## 3. Principios del rediseño

Lo que significa "próximo nivel, real, orientado a humanos" para este sitio:

1. **Una página, una pregunta.** Cada ruta responde una sola pregunta del
   comprador y termina. Home: "¿qué hacen y para quién?". Servicio: "¿qué
   incluye y qué me entregan?". Antecedente: "¿qué hicieron, dónde y cuándo?".
   Contacto: "¿cómo sigo?".
2. **Un pedido por página.** Un botón principal en el hero y un cierre breve
   al final. Nada entre medio. El modal de contacto deja de existir en el DOM
   de todas las páginas; `/contacto` es el formulario.
3. **Nada que el lector no pueda usar.** Sin códigos internos, sin etiquetas
   de proceso ("Caso operativo", "Área registrada", "Coincidencia"), sin
   kickers en mayúsculas, sin contadores sin fuente única, sin texto de
   plantilla.
4. **Peso proporcional al valor.** Una página comercial no puede pesar más
   que un artículo técnico de 4 minutos. Objetivo: menos de 1,5 MB en
   escritorio y menos de 1 MB en móvil en el primer viewport, con LCP
   menor a 2,0 s en escritorio y 2,5 s en móvil.
5. **Una plantilla por tipo de página.** Si existe una decisión de diseño,
   existe un solo componente que la implementa.
6. **Imagen sólo cuando es evidencia.** Render o foto cuando muestra algo del
   proyecto o del tipo de instalación. Si no hay imagen real, la ficha va sin
   imagen y la jerarquía la da el texto.
7. **Cuerpo a 16 px o más, siempre.** Metadatos a 16 px en gris, no a 12 px.

---

## 4. Propuesta por ruta

### 4.1 Global (nav, footer, layout)

- **Nav**: Inicio, Servicios, Sectores, Antecedentes, Blog, Contacto. El botón
  "Contactar" pasa a ser un enlace a `/contacto`, no abre un modal. El mega
  menú de servicios se mantiene pero sin los códigos 101–108 y sin imagen por
  ítem (hoy va una imagen por servicio que casi nunca se ve).
- **Modal de contacto**: se retira de `LayoutV4`. Los enlaces `data-contact-open`
  pasan a `href="/contacto"` con un parámetro opcional de origen
  (`?desde=servicio-101`) que el formulario puede leer para prellenar el motivo.
  Se conserva el endpoint `/api/contact` tal cual.
- **Aviso de instalación de app** (`AppInstallHint`): se retira. Un sitio
  corporativo no pide instalarse.
- **Fuentes**: un único `@font-face` variable de UM Sans, precargado. Se
  eliminan las familias `Compatibility` y la duplicada.
- **Cierre de página**: un solo componente, dos líneas y un botón:
  "¿Tu operación necesita algo de esto? Escribinos." + botón "Ir a contacto".
  Sin el segundo enlace de mail (ya está en el footer).
- **Footer**: queda como está.

### 4.2 Hero (home, servicios, sectores, fichas)

- El video pasa a ser **opcional y diferido**: en el primer render se sirve el
  póster AVIF (ya existe, 50 a 120 KB) y el video se carga sólo en escritorio,
  sólo con `prefers-reduced-motion: no-preference`, sólo si la conexión no
  es `saveData` ni 2G/3G, y sólo después de `load`. En móvil, nunca.
- Se retiran el botón de pausa flotante y la etiqueta de escena ("Edificio
  corporativo", "Terminal aeroportuaria"): son metadatos de la producción
  del video, no información para el lector.
- Un solo H1 en tamaño y peso: 52 px / 700 escritorio, 36 px / 700 móvil, en
  todas las rutas, incluidos `/nosotros`, `/blog` y `/contacto`.

### 4.3 Home

Orden propuesto (hoy: hero → despiece → atlas de sectores → 6 proyectos → cierre):

1. Hero: título actual, bajada actual, un botón.
2. **Servicios**: los ocho frentes como lista de dos columnas (nombre + una
   línea). Sin isometría. Esta lista ya existe en el mega menú y en
   `/servicios`; es la misma pieza.
3. **Sectores**: lista de nueve con una línea cada uno. Sin panel de video,
   sin "Reproducir recorrido", sin contador (hasta que haya una sola fuente
   de conteo verificada, ver 5.3). Si se quiere un número, es uno solo arriba:
   "518 proyectos documentados desde 2003".
4. **Proyectos recientes**: los seis actuales, en la misma lista de tres
   columnas (cliente, trabajo, año). Está bien.
5. Cierre único.

Resultado esperado: HTML de 461 KB a menos de 60 KB; transferencia de 5,5 MB a
menos de 1 MB en escritorio; página de 4.451 px a unos 2.800 px.

### 4.4 `/servicios` y ficha de servicio

- Índice: se conserva la lista de ocho con icono isométrico pequeño (ya son
  SVG externos de 2 a 5 KB, correctos). Se eliminan los kickers en mayúsculas
  a 13 px ("TELECOMUNICACIONES", "REDES · WI-FI").
- Ficha (`/servicios/[id]/[slug]`), orden:
  1. Hero con título, bajada y botón.
  2. **Qué cubre** (la tabla actual de seis filas: está bien).
  3. **Qué entregamos**: la ficha técnica que hoy se esconde tras "Ver la
     ficha técnica" se muestra como lista: normas, documentación, pruebas,
     garantía. Si no hay contenido real para un servicio, la sección no se
     renderiza; no queda un título con un enlace.
  4. **Casos comparables**: la lista actual de tres filas. Está bien.
  5. Cierre único.
- Se retira el explorador "Redes, por dentro" (Sistema / Equipo / Despiece /
  Conector). Es una pieza de producto para una demo, no para una decisión de
  compra. Si se quiere conservar, se mueve a una ruta `/servicios/[id]/ficha`
  que ya existe y se enlaza desde la ficha en una línea.

### 4.5 `/antecedentes`

- **Paginación en el servidor**: 24 por página, con `?pagina=2`. El HTML pasa
  de 933 KB y 527 imágenes a unos 80 KB y 24 imágenes. Los filtros siguen
  funcionando con parámetros de URL (ya los maneja el JS actual: `sector`,
  `servicio`, `periodo`, `anio`, `cliente`).
- Filtros: **Sector** y **Año** solamente, como `<select>` en móvil y como
  chips a 16 px en escritorio. Se quita "Servicio" hasta corregir el dato
  (391 de 518 marcados como consultoría), se quita "Período" (duplica Año) y
  se quita "Cliente" (16 chips con nombres de empresa no ayudan a buscar; el
  buscador de texto ya cubre eso).
- Se quitan los contadores dentro de cada chip. El total filtrado se dice una
  vez: "62 proyectos en Aeropuertos".
- Tarjeta: foto (si es real), cliente, trabajo, sector · año a 16 px. Sin el
  mosaico de nueve miniaturas del hero: pasan a ser las tarjetas mismas.
- Orden por defecto: más reciente primero. Se retira "Destacados" como
  concepto público.

### 4.6 Ficha de antecedente

Hoy la ficha dice lo mismo cuatro veces. Propuesta, de arriba abajo:

1. Enlace "← Antecedentes".
2. H1 con el trabajo. Debajo, una sola línea: **Cliente · Sector · mes de año**.
3. Imagen sólo si `image` viene de `/images/antecedentes/` y corresponde al
   proyecto. Sin render genérico de relleno.
4. **Qué se hizo**: el texto real del registro. Si el registro sólo tiene el
   título, la sección se omite; no se genera un párrafo de plantilla.
5. **Servicios involucrados**: la tabla actual de dos columnas, está bien.
6. **Otros proyectos en [sector]**: tres filas (cliente, trabajo, año). Sin
   "Coincidencia: N servicios en común".
7. Cierre único.

Se eliminan: el código `UM-3622`, el chip de sector sobre el título, la
tabla lateral de seis filas (duplica la línea de metadatos), "Alcance técnico"
(repite cliente, área y cierre), "Tipo de trabajo", "Área registrada", y el
botón "Pedir un relevamiento" del hero (queda el cierre).

Regla para el `<title>` y la descripción SEO: sin el código interno. Hoy el
título de pestaña es "Seguridad Electrónica & SDI: Servidor · Obras SRL ·
UM-3622".

### 4.7 `/sectores` y página de sector

- Índice: nueve sectores, cada uno con nombre, una línea y el número de
  proyectos (una sola fuente). Sin icono isométrico por sector si el icono
  no distingue un sector de otro (hoy `site-fachada.svg` y `site-planta.svg`
  se repiten para sectores distintos).
- Página de sector, orden:
  1. Hero: nombre del sector, bajada, botón.
  2. **Qué instalamos en [sector]**: los ocho frentes como lista con una
     línea específica del sector (hoy el texto es el genérico de servicios).
     Sin isometría.
  3. **Proyectos en [sector]**: lista de seis a ocho filas (cliente, trabajo,
     año) + enlace al listado filtrado. Hoy es un carrusel "01 / 04" con
     tarjetas cortadas en móvil; la lista resuelve ambos problemas.
  4. Cierre único.
- Una sola plantilla (`SectorTemplateUM26` o una nueva `SectorPage`). Se
  retiran `SectorTemplateEditorial` y `SectorTemplateAtlas` junto con el
  parámetro `?template=` de desarrollo.

### 4.8 `/nosotros`

- Mismo hero que el resto (52 px / 700, sin el render de oficina de 5,3 MB).
- Contenido en tres bloques cortos: qué hace la empresa (dos párrafos), cómo
  trabaja (lista de cuatro o cinco pasos reales: relevamiento, propuesta,
  instalación, documentación, soporte), dónde (Mendoza, Cuyo, Patagonia, con
  la dirección). Una foto real del equipo o de una obra si existe; si no,
  ninguna.

### 4.9 `/contacto`

- Es la referencia. Cambios mínimos: quitar el botón "Contactar" de la nav
  cuando ya se está en `/contacto`, leer `?desde=` para prellenar "Motivo", y
  llevar las etiquetas "EMAIL / OFICINA / HORARIO" de 13 px a 16 px en caja
  normal.

### 4.10 `/blog`

- Se conserva. Dos ajustes: usar el mismo H1 que el resto (52 px / 700) y
  revisar que los artículos marcados "Caso anonimizado" digan explícitamente
  que son casos reales anonimizados, en una línea al inicio del artículo, no
  en la bajada del listado.

---

## 5. Plan de ejecución (para modelos económicos)

Cada fase es un PR a `develop`. Ninguna fase depende de cambios en Directus.
Antes de cada PR: `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`,
`npm run audit:css`, `npm run build`. Después de cada PR con cambio visual:
correr `scripts/ui-audit/prod-ui-audit.cjs` contra el preview local
(cambiar `BASE`) y comparar con la tabla 2.1.

### Fase 0 — Limpieza de base (sin cambio visual)

Archivos: `src/pages/_index.astro`, `_contacto.astro`, `_nosotros.astro`,
`_sectores.astro`, `antecedntes.astro`, `antecedentes/_*.astro`,
`antecedentes/[id]/_._index.astro`, `casos/_[slug].astro`, `estilos/*`,
`estilo/design,md.ts`, `components/sudoers.py`, `src/.DS_Store` y los demás
`.DS_Store`.

- Borrar las páginas con prefijo `_` y los duplicados listados. Verificar con
  `grep -r` que nada los importe.
- `.DS_Store` ya está en `.gitignore`, pero hay siete archivos versionados: quitarlos del índice con `git rm --cached`.
- Criterio: `npm run build` pasa; el número de rutas generadas no cambia salvo
  las eliminadas.

### Fase 1 — Peso: video diferido, fuentes, modal

Archivos: `src/components/cine/CineBanner.astro`,
`public/cine/cine-banner-accessible-2610.js`, `src/layouts/LayoutV4.astro`,
`src/components/um/ContactModal.astro`, `src/components/v4/AppInstallHint.astro`,
`public/fonts/um-sans/v2.0.0/um-sans.css`, `src/components/v4/NavbarV4.astro`.

- `CineBanner`: renderizar `<img>` con el póster AVIF y `fetchpriority="high"`;
  insertar el `<video>` desde JS sólo en escritorio, tras `load`, con las
  condiciones de 4.2. Retirar el botón de pausa y la etiqueta de escena.
- `LayoutV4`: quitar `<ContactModal />` y `<AppInstallHint />`. Reemplazar
  todo `data-contact-open` por `href="/contacto"` (buscar en `src/`).
- Fuentes: dejar un solo `@font-face` variable; quitar `Compatibility`.
- Criterio: home en escritorio menor a 1,2 MB transferidos, LCP menor a 2,0 s;
  en móvil menor a 0,8 MB; sin "Contacto rápido" en el HTML de ninguna ruta.

### Fase 2 — Una voz: cierre único, CTA único, H1 único

Archivos: nuevo `src/components/um/PageClose.astro`; `src/pages/index.astro`,
`servicios/index.astro`, `servicios/[id]/[slug].astro`, `[sector].astro`,
`sectores.astro`, `nosotros.astro`, `blog/index.astro`, `contacto.astro`,
`antecedentes/index.astro`, `antecedentes/[id]/[slug].astro`; `src/styles/v4.css`.

- Crear `PageClose` con el texto de 4.1 y usarlo en todas las rutas en lugar
  de las secciones de cierre actuales (`um26-contact`, `services-demo-closing`,
  etc.).
- Un solo botón por hero. Quitar el botón del hero de la ficha de antecedente.
- Tokens de H1 en `v4.css`: `--um-h1-desktop: 52px`, `--um-h1-mobile: 36px`,
  peso 700, y eliminar las reglas locales que los pisan en `nosotros`,
  `contacto` y `blog`.
- Criterio: `grep -c "Pedir un relevamiento"` en el HTML de cada ruta da 1;
  H1 computado igual en las 11 rutas.

### Fase 3 — Antecedentes: paginación y ficha limpia

Archivos: `src/pages/antecedentes/index.astro`,
`src/pages/antecedentes/[id]/[slug].astro`, `src/lib/um26-directus.ts`,
`src/utils/antecedenteSectorPresentation.ts`, `src/utils/seoTitleOverrides.ts`.

- Índice: paginar en servidor (24), filtros Sector y Año, sin contadores por
  chip, metadatos a 16 px, orden por fecha.
- Ficha: estructura de 4.6. Quitar código, chips, tabla lateral, "Alcance
  técnico", "Tipo de trabajo", "Área registrada", "Coincidencia". Omitir la
  imagen si no es del proyecto (regla: ruta bajo `/images/antecedentes/`).
  Omitir "Qué se hizo" si el texto es el título o la plantilla.
- Título SEO sin código interno.
- Criterio: `/antecedentes` menor a 100 KB de HTML y menos de 40 imágenes;
  0 textos menores a 14 px; en la ficha no aparece `UM-` ni "Caso operativo".

### Fase 4 — Home y sectores sin isometría, una plantilla

Archivos: `src/pages/index.astro`, `src/components/cine/SiteDespiece.astro`,
`src/components/cine/SectorAtlas.astro`, `src/pages/[sector].astro`,
`src/pages/sectores.astro`, `src/components/templates/Sector*.astro`,
`src/data/sectorCaseCounts.ts`, `src/utils/verifiedProof.ts`.

- Home según 4.3. `SiteDespiece` y `SectorAtlas` dejan de usarse; si se
  conservan los SVG isométricos, quedan en `src/assets/cine/isometric/` sin
  importar.
- Página de sector según 4.7 con una sola plantilla. Borrar las otras dos y
  el parámetro `?template=`.
- Contador de proyectos: una sola función (`getAntecedentesCatalogCount` o
  `sectorCaseLabel`, no ambas) alimentada del mismo catálogo que usa
  `/antecedentes`. Si un sector no tiene número verificable, no se muestra.
- Criterio: HTML de home menor a 60 KB; sector menor a 80 KB; el número por
  sector en home coincide con el filtro en `/antecedentes`.

### Fase 5 — Fichas de servicio y nosotros

Archivos: `src/pages/servicios/[id]/[slug].astro`, `src/pages/servicios/[id]/ficha.astro`,
`src/components/cine/ProductStage.astro`, `ProductMoments.astro`, `ServiceSpecSheet.astro`,
`src/data/serviceSpecs.ts`, `src/pages/nosotros.astro`.

- Ficha de servicio según 4.4: mostrar la ficha técnica en la página; retirar
  el explorador o moverlo a `/servicios/[id]/ficha`.
- `/nosotros` según 4.8.
- Criterio: la ficha de servicio no tiene secciones cuyo único contenido sea
  un enlace; `/nosotros` menor a 1 MB transferido.

### Fase 6 — CSS: consolidar y bajar `!important`

Archivos: `src/styles/v4.css` y los `<style>` de los componentes que sobreviven.

- Mover a `v4.css` sólo los tokens y los componentes compartidos (botón,
  cierre, lista de filas, tabla de dos columnas, hero). Lo específico de cada
  página queda en su `.astro`.
- Borrar las familias de clases de plantillas eliminadas (`sector-editorial`,
  `sector-atlas`, `ante-atlas`, `ante-dossier`, `geo-dossier` si no se usa,
  `services-demo-*`).
- Objetivo: `!important` por debajo de 50 en total; `v4.css` por debajo de
  1.500 líneas. Hacerlo al final, cuando ya no existan los componentes que
  motivaban las excepciones.

---

## 6. Qué no hacer

- No tocar Directus, rutas públicas, canonicals, sitemaps, `/geo/*`,
  `llms.txt` ni redirecciones. El rediseño es de presentación.
- No reemplazar la tipografía ni promover UM Sans 2 Manual: sigue
  `DO-NOT-SHIP` según `docs/HANDOFF-UMSANS-REDESIGN-PARTIAL.md`.
- No agregar animaciones, kickers, badges, contadores animados ni "stats bar".
- No generar imágenes de relleno para fichas sin foto.
- No desplegar fuera de Git Flow (feature → develop → master).

---

## 7. Criterios de aceptación globales

| Métrica | Hoy (escritorio) | Meta |
|---|---:|---:|
| Transferencia home | 5,5 MB | < 1,2 MB |
| Transferencia página comercial | 5 a 7 MB | < 1,5 MB |
| LCP escritorio / móvil | 2,3–3,8 s | < 2,0 s / < 2,5 s |
| HTML home | 461 KB | < 60 KB |
| HTML `/antecedentes` | 933 KB | < 100 KB |
| Textos < 14 px por ruta | hasta 177 | 0 |
| Botones de contacto por página | 4 a 5 | 2 (hero y cierre) |
| Familias de fuente cargadas | 3 | 1 |
| `!important` en CSS | 1.069 | < 50 |
| Plantillas por tipo de página | 3 | 1 |
| Códigos internos visibles | sí | 0 |

---

## 8. Notas de traspaso

- El documento `RETOMA-REDISENO-UMSA-20261029.md` citado en el pedido vive en
  una ruta local del Mac y no está en el repositorio; este plan se hizo sin él.
  Si contiene criterios adicionales, conviene copiarlo a `docs/rediseno-2026-10-29/`.
- Capturas y `results.json` de esta auditoría no se versionan (binarios). El
  script las regenera en unos cinco minutos.
