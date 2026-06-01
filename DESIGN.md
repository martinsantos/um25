# ULTIMA MILLA Website Design System 2026

Documento de direccion visual para el redisenio local de `ultimamilla.com.ar`.

Estado: maqueta local iterada en branch `codex/umsa-white-dossier-local`.
Fuente de marca: Manual UMSA v1.0, `src/assets/estilo/SKILL.md` y skill corporativa `ultima-milla`.
Alcance: sitio publico Astro, sin cambios de rutas, canonical, SEO estructural ni despliegue productivo.

## GOAL Superador UMSA Global Provider 2026

La direccion activa es **Executive Industrial Evidence**: una web de servicios IT con percepcion de proveedor internacional, capaz de explicar problema operativo, capacidad UMSA, evidencia y siguiente paso en menos de 30 segundos por pantalla.

La aceptacion ya no depende solo de pasar auditorias tecnicas. Una pantalla no esta lista si contiene ruido visual, duplicacion, bordes innecesarios, filtros administrativos, imagenes decorativas, titulares desproporcionados, CTAs corridos, contraste dudoso o copy generico sin prueba.

El sistema debe mantener marca, rutas, canonicals, sitemap, robots, JSON-LD, GEO/LLM, Directus y produccion intactos. Todo se prueba primero en localhost.

## GOAL UMSA Next Level 2026

Convertir `ultimamilla.com.ar` en una web editorial-comercial de Servicios IT de nivel proveedor Forbes 500: cada pantalla debe explicar en menos de 30 segundos que problema operativo resuelve UMSA, con que evidencia, con que alcance y cual es el proximo paso.

La meta no es sumar color ni secciones. La meta es precision: jerarquia, frases, prueba visible, imagen pertinente, CTA por intencion, SEO/GEO coherente y control visual verificable en navegador.

### Direccion activa mayo 2026

La direccion vigente ya no es `White Dossier puro`. La referencia activa pasa a ser **hibrido ejecutivo**:

- aperturas tecnicas oscuras para prueba, tension y escala;
- cuerpo editorial claro para lectura, decision y contacto;
- densidad visual controlada, mas cercana a proveedor industrial internacional que a consultora blanca generica;
- benchmark dominante: proveedor Shenzhen de alto nivel, sin perder sobriedad institucional;
- criterio operativo: si un bloque repite evidencia, explica dos veces lo mismo o agrega chrome sin mejorar lectura, debe eliminarse.

### Analisis maestro por ruta

Antes de aceptar una nueva iteracion, cada ruta publica debe registrarse en una matriz con estos campos:

| Campo | Criterio de aceptacion |
|---|---|
| Intencion | El comprador entiende si la pagina informa, compara, decide o contacta. |
| H1 | Es especifico, operativo, sin muletillas, y entra en la escala aprobada. |
| Bajada | Dice alcance y resultado; no repite el H1. |
| Prueba | Hay metricas, antecedente, sector, metodo o documentacion visible temprano. |
| Imagen | La imagen cumple una funcion: contexto, evidencia, servicio, sector o lectura. No puede estar colapsada ni ser decorativa. |
| CTA | La accion corresponde a la intencion: diagnostico, relevamiento, abono, pliego o contacto general. |
| GEO | El contenido visible coincide con `llms-full.txt`, `sitemap-geo.xml`, `/geo/*.json` y JSON-LD. |
| Mobile | H1 real entre 32-38px, cuerpo minimo 16px, sin overflow ni apilamiento confuso. |

### Ledger de frases UMSA

Cada bloque visible debe poder pasar esta prueba: `problema operativo -> mecanismo UMSA -> evidencia -> siguiente accion`.

Se rechazan frases genericas si no explican mecanismo o alcance:

- `transformacion digital` sin arquitectura, herramienta o proceso concreto;
- `soluciones integrales` sin servicios conectados, evidencia o entregable;
- `innovacion tecnologica` sin impacto operativo;
- claims de liderazgo, excelencia o confianza sin prueba.

### Concept board previo

Antes de una pasada visual final se define un concepto por superficie, no solo un hero:

- home;
- servicios;
- detalle de servicio;
- antecedentes;
- detalle de antecedente;
- sectores;
- vertical de sector;
- blog indice;
- blog single;
- contacto;
- hubs GEO.

Cada concepto debe describir primer viewport, ritmo de secciones, rol de imagen, escala tipografica, CTA, prueba y comportamiento mobile. La implementacion debe copiar ese sistema sin reinterpretar colores, jerarquia ni copy.

## Contrato operativo UI/UX Forbes 500

Este documento funciona como compuerta de aceptacion, no como referencia aspiracional. Una pantalla UMSA 2026 solo se considera lista si pasa evidencia tecnica y revision visual real en navegador.

### Escala editorial obligatoria

| Elemento | Desktop | Mobile | Peso |
|---|---:|---:|---:|
| H1 sitio/interior | 42-58px, home maximo 60px | 34-42px | 600 |
| H2 seccion | 28-40px | 24-32px | 600 |
| H3/modulo | 18-24px | 18-22px | 600 |
| Body, metadata, labels, botones | minimo 16px | minimo 16px | 400-700 |
| Numeros, CTA, labels fuertes | minimo 16px | minimo 16px | maximo 700 |

Futura PT queda reservada para logo/marca. Los titulares editoriales usan Poppins con `font-synthesis: none`. No se admiten pesos `800/900`, tracking negativo fuera del logo ni titulares que ganen jerarquia solo por gigantismo.

### Rojo UMSA: contrato canonico

El rojo de marca es exactamente `#DC2626` (`rgb(220, 38, 38)`). Es el rojo de los puntos del logo, separadores, reglas, focos activos, flechas, numeros de sistema y CTAs. No se reemplaza por `#EF4444`, `#FF0000`, `#CC0000`, rosas, salmón ni variantes "mas lindas" por pantalla.

Reglas de uso:

- `#DC2626` es el unico rojo identitario del sitio.
- En fondos negros no se usa rojo como microtexto: no alcanza contraste AA para texto normal. En dark surfaces el rojo funciona como linea, punto, borde, icono grande o CTA con texto blanco.
- Los estados hover no deben hacer que el rojo parezca otro color de marca. Se priorizan borde, subrayado, opacidad, desplazamiento o fondo neutro.
- Ninguna miniatura o listado puede repetir overlays rojos llenos. El rojo no coloniza la interfaz.

### Compuerta automatica obligatoria

Antes de aceptar una iteracion visual se ejecutan:

- `npm run audit:visual` para la compuerta rapida desktop/mobile.
- `npm run audit:visual:strict` para la compuerta exigente en desktop `1440x900`, laptop `1280x800`, tablet `834x1112`, mobile `390x900` y mobile chico `360x740`.
- `npm run audit:screenshots` para generar capturas comparables fuera del repo.

**Corridas masivas sin falsos `navigation mismatch`:** en batch largo usar `VISUAL_AUDIT_LABEL_ONLY=1` (alias de modo aislado: pausa mayor entre rutas y reintento de navegacion hasta 3 veces) o filtrar con `VISUAL_AUDIT_ROUTE_FILTER` / `VISUAL_AUDIT_VIEWPORT_FILTER` y una ruta por proceso. Ejemplo:

```bash
VISUAL_AUDIT_STRICT=1 VISUAL_AUDIT_COMMERCIAL_ONLY=1 \
VISUAL_AUDIT_LABEL_ONLY=1 \
VISUAL_AUDIT_ROUTE_FILTER='^home default$' \
VISUAL_AUDIT_VIEWPORT_FILTER='^(desktop|mobile)$' \
node scripts/visual-contrast-audit.mjs
```

### Navegacion desktop

- Menu horizontal visible desde `min-width: 1024px` (clase `um-desktop-menu` en `NavbarV4`).
- Contenedor editorial principal: `--um-container: 1180px` (no confundir con el breakpoint de nav).
- Entre `1024px` y `1180px` el rail de 8 servicios en home pasa a 4 columnas (`max-width: 1180px` en `index.astro`).

La compuerta estricta falla si detecta:

- texto visible menor a 16px;
- peso visual mayor a 700;
- mas o menos de un H1;
- overflow horizontal;
- contraste bajo en superficies oscuras;
- rojo UMSA como microtexto sobre negro;
- imagen visible rota;
- texto de overlay de error de framework;
- claims de falsa precisión o conteos no aprobados (`99.xx%`, `518+`) en superficies comerciales;
- canonical GEO incorrecto;
- CTA principal ausente del primer viewport en home, servicios, detalles criticos, hubs GEO y contacto;
- area roja dominante en el primer viewport.

### Revision visual manual obligatoria

La auditoria no reemplaza el criterio de diseno. En cada fase se revisa:

- primer viewport con jerarquia clara y accion principal visible;
- un solo bloque protagonista por viewport;
- ritmo mixto: protagonista, secundarios, archivo, ledger;
- servicios sin listas gigantes ni filas clonadas;
- antecedentes sin toolbar administrativa;
- sectores como mapa de riesgo operativo, no galeria;
- blog con imagen destacada y miniatura real por nota, titulos largos controlados y lectura limpia;
- contacto con formulario rapido y antispam invisible;
- labs/utilidades coherentes pero fuera de la experiencia comercial.

## Direccion aprobada

La estetica aprobada es la de las referencias visuales adjuntas de mayo 2026:

- apertura oscura, tecnica, fotografica, con infraestructura real como senal principal;
- composicion de grilla fina, reglas, coordenadas y lineas rojas precisas, sin decoracion gratuita;
- secciones blancas editoriales para antecedentes, paquetes, sectores y decision comercial;
- rojo UMSA `#DC2626` como instrumento de enfasis, no como tema cromatico completo;
- tipografia grande pero proporcional: nada visible por debajo de 16px, cuerpos de lectura 16-20px, titulares con aire y line-height controlado;
- titulares editoriales con `Poppins` 600 como primera opcion y Futura PT reservada para logo/marca;
- marca intacta: logo `ultimamilla.com.ar`, puntos rojos, Futura/Open Sans, negro/blanco/gris y reglas UMSA no se redisenan.

El sitio no debe parecer una landing SaaS ni una pieza AI-looking. Debe parecer una empresa tecnica real que vende continuidad operativa, soporte, redes, seguridad electronica, energia IT, software operativo y ejecucion documentada.

## Correccion de rumbo: skins no son diseno

Las skins son una infraestructura de comparacion cromatica. No son el objetivo final.
El redisenio de nivel mundial exige recomponer la interfaz completa:

- jerarquia tipografica consistente: H1, H2, filas, metadata y botones deben convivir sin gritarse;
- ritmo mixto: protagonista, evidencia secundaria, ledger documental y CTA, no grillas de cards iguales;
- servicios como arquitectura operativa: ocho frentes claros, compactos, escaneables y conectados;
- antecedentes como prueba: caso destacado, metadata verificable, sectores como rail documental, no miniaturas repetidas;
- blog como producto editorial tecnico: imagen destacada, miniaturas reales, lectura limpia, feed amplio, categorias sobrias y titulos proporcionados;
- rojo UMSA como instrumento quirurgico: linea, numero, foco, flecha o CTA; nunca barniz repetido;
- ninguna decision visual puede depender solo de cambiar `black/white/hybrid/steel`.

### Sistema compositivo 2026

| Capa | Regla |
|---|---|
| Apertura | Imagen real o editorial fuerte, copy breve, CTA claro y prueba compacta. |
| Servicios | Ledger horizontal/tecnico con iconos lineales, divisores finos y textos de 1-2 lineas. |
| Evidencia | Un protagonista por viewport; secundarios con menor peso; archivo en filas. |
| Confianza institucional | Panel de prueba + referencias publicadas en ledger editorial; no logos sin autorizacion, no tabla con recuadros repetidos. |
| Contenido largo | Ancho de lectura controlado, metadata visible a 16px, titulos sin competir con H1. |
| Mobile | Una columna clara, sin microtexto, sin tarjetas apiladas con igual peso visual. |

Regla operacional nueva: si una seccion se entiende solo por color, no esta disenada. Debe sostenerse por proporcion, estructura, espacio, prueba y copy operativo.

## White Dossier: variante principal local

White Dossier queda como prototipo principal de mayo 2026 para validar una web de servicios IT con transparencia, evidencia y precision documental.

- No es "fondo blanco": es un sistema editorial con aire, jerarquia, datos verificables, fotos contenidas y navegacion sobria.
- Negro tecnico queda reservado para aperturas criticas, footers, modulos de capacidad o casos protagonistas; no debe ocupar todos los listados.
- Rojo UMSA se usa como separador, numero, foco activo, flecha o CTA. Quedan prohibidos banners rojos repetidos sobre miniaturas.
- Servicios se resuelven como dossier: indice compacto de 8 frentes, modulo de criterio operativo, prueba institucional y paquetes comprables sin precios.
- Antecedentes se resuelven como evidencia: caso protagonista visible temprano, dos secundarios, archivo documental y filtros livianos.
- Sectores se resuelven como mapa de capacidad: fotos + necesidad operativa + servicios aplicados, no cards apretadas ni overlays iguales.
- Blog se resuelve como archivo tecnico premium: cada nota usa su `imagen_portada` como miniatura y como imagen destacada; las categorias son sobrias y la lectura queda subordinada al sistema UMSA.
- Contacto se resuelve como puerta directa: cuatro campos visibles (`nombre`, `email`, `empresa`, `mensaje`), sin selects comerciales ni captcha visible. El antispam corre en segundo plano con honeypot, tiempo minimo, limite de links, validacion de longitud y rate limit.

Checklist adicional de aceptacion:

- La evidencia debe aparecer antes de un scroll excesivo en `/antecedentes?template=editorial&skin=white`.
- `/servicios?skin=white` no puede volver a ser una lista vertical de ocho filas gigantes.
- Los fallbacks del blog existen solo como seguridad local si un mock llega sin imagen; nunca reemplazan la miniatura real de Directus ni pesan mas que el titulo y el resumen.
- Las variantes `black`, `hybrid` y `steel` siguen disponibles para comparacion local, pero no justifican layouts repetitivos.
- Todo modulo negro dentro de `skin=white` debe declararse como panel invertido y conservar texto blanco/alto contraste. La capa cromatica no puede degradar legibilidad.

### Fusion aplicada en esta iteracion

- White Dossier queda como prototipo principal local, fusionando skins, templates, estrategia comercial y sistema V4.
- Servicios deja de ser una lista de filas: queda como dossier compacto con hero medido, proofline, folio operativo, ocho frentes escaneables y paquetes sin precios.
- Sectores editorial adelanta informacion: las fotos son evidencia, no portadas dominantes; el contenido aparece dentro del primer viewport.
- Antecedentes editorial conserva la logica protagonista/secundarios/archivo y evita filtros con peso administrativo.
- Blog usa imagen real por nota, superficie blanca real y jerarquia editorial; no usa bloques negros dominantes ni placeholders como solucion primaria.
- Negro tecnico queda como recurso de capacidad/contraste; blanco documental sostiene lectura, transparencia y confianza.

## UMSA Executive Dossier: hubs GEO comerciales

Los hubs GEO comerciales dejan de tratarse como paginas SEO aisladas. Pasan a ser piezas editoriales de alto valor, pensadas para compradores humanos y para motores GEO/LLM.

Rutas incorporadas al sistema:

- `/servicios-it-empresas-mendoza`
- `/presupuesto-servicios-it-empresas`
- `/proyectos-ingenieria-it-mendoza`
- `/servicios-it-empresas-argentina`

Contrato de diseno:

- apertura tecnica oscura con H1 editorial y CTA claro;
- proofline inmediata con mercado, trayectoria, servicios y soporte;
- bloque de criterio de compra con riesgos operativos;
- ledger de servicios conectados;
- evidencia con antecedentes reales;
- sectores relacionados;
- metodo UMSA;
- consultas GEO visibles como lenguaje natural, sin parecer nube de keywords;
- FAQ breve con JSON-LD;
- CTA final orientado a diagnostico, cotizacion o relevamiento.

Contrato SEO/GEO:

- cada hub tiene ruta fisica propia en Astro, no cae en el catch-all de sectores;
- canonical sin query params y sin `www`;
- title, description, H1 y contenido visibles alineados con `llms-full.txt`, `sitemap-geo.xml` y `/geo/buyer-intents.json`;
- JSON-LD adicional con `WebPage`, `Service`, `ItemList` de evidencia y `FAQPage`;
- enlaces internos visibles a servicios, sectores, antecedentes y contacto;
- no se publican precios fijos; el presupuesto se explica por variables de alcance, criticidad, SLA, materiales, documentacion e integraciones.

Recursos GEO locales incorporados:

- `/llms.txt`: indice compacto para discovery de agentes y LLMs.
- `/llms-full.txt`: indice extendido con posicionamiento, hubs, servicios, sectores y casos priorizados.
- `/sitemap-geo.xml`: sitemap especifico para hubs comerciales, JSON de entidades, servicios, sectores y antecedentes priorizados.
- `/geo/brand-facts.json`: hechos de marca y prueba institucional.
- `/geo/services.json`: ocho frentes de servicios con canonical, resumen y senal operativa.
- `/geo/sectors.json`: verticales con necesidad operativa, prueba, servicios y URL.
- `/geo/cases.json`: antecedentes priorizados, incluyendo casos enlazados por hubs.
- `/geo/faqs.json`: FAQs comerciales normalizadas desde los hubs.
- `/geo/authority.json`: modelo de autoridad y enlaces canonicos.
- `/geo/topics.json`: temas semanticos principales.
- `/geo/buyer-intents.json`: intenciones de compra, queries y CTA por hub.
- `/geo/blog-index.json`: rol editorial del blog dentro de GEO.

Regla operacional: una pagina GEO no puede sentirse como doorway page. Debe ser una pieza de decision comercial con evidencia, metodo, arquitectura interna y diseno de nivel institucional.

## Estrategia comercial aplicada

El documento de venta `umsa2026- deep-research-report.md` define el giro: la web deja de organizar capacidades sueltas y pasa a convertirlas en ofertas comprables.

- Mensaje base: servicios IT integrales para operaciones que no pueden detenerse.
- Prueba base: 8 frentes tecnicos, 469+ antecedentes, 22+ anos, soporte 24/7.
- Oferta publicable sin precios: Soporte Base, Soporte Operativo, Soporte Critico, Red Express, Sala Tecnica, CCTV/SDI y Diagnostico.
- CTAs por intencion:
  - Soporte: `Cotizar abono`.
  - Obra: `Solicitar relevamiento`.
  - Licitaciones: `Enviar pliego`.
  - General: `Hablar con un especialista`.
- SGI, Licitometro y APIs se muestran como prueba institucional y capacidad conectada, sin depender de APIs vivas en la home.

No publicar precios en esta fase. No redireccionar rutas alternativas. No cambiar canonicals.

## Iteracion mayo 2026 aplicada

- Home: hero con tablero operativo, prueba institucional compacta y capa de metodo `Relevar / Disenar / Implementar / Operar`.
- Servicios: hero con imagen tecnica, proof panel y rutas canonicas internas `/servicios/[id]/[slug]`.
- Sectores: hero con imagen editorial, prueba por sector y grilla sin emojis ni gradientes por industria.
- Antecedentes: hero propio de archivo tecnico, filtros sobrios y cards de evidencia con jerarquia mas clara.
- Mobile: se reviso DOM responsive y se reforzo wrapping/box sizing para evitar cortes en hero y CTAs.
- Tipografia: piso minimo de 16px para texto visible; nav, filtros, labels, metadata, botones y blog band no deben usar microtexto. H1/H2 se redujeron para equilibrar titulares, cuerpo y prueba institucional.
- Browser plugin: DOM, titulos y consola sin errores; la captura visual del plugin tuvo timeout, por lo que la inspeccion visual se complemento con capturas headless locales.

## Revision profunda de proporcion tipografica

Aplicada sobre la maqueta local en `localhost:4322`:

- Pase transversal 2026-05-17: titulares editoriales pasan a `Poppins` con peso `600`; Futura PT queda reservada para logo/marca. Numeros, CTAs y labels quedan en `700` como techo.
- Pase transversal 2026-05-19: rojo identitario bloqueado en `#DC2626`; se eliminan `#EF4444`, rojos oscuros y rojos claros como acentos de marca en UI activa. Blog queda image-led: miniatura e imagen destacada desde Directus para cada nota.
- Servicios: `/servicios` y `/servicios/[id]/[slug]` ya no usan labels largos que quiebran la grilla de metricas; las pruebas quedan como `Servicios / Casos / Soporte`.
- Blog: el indice y las filas de feed se integran al sistema UMSA, sin serif externa ni escala ajena; las piezas de contenido dejan de competir con el H1.
- Detalle de antecedente: hero, ficha tecnica, alcance, CTA y relacionados pasan al mismo sistema de evidencia tecnica, sin "consultoria gratis" ni card SaaS blanda.
- Hero: el H1 baja de escala maxima y gana line-height para dejar de aplastar la lectura; en mobile deja de forzarse a una columna estrecha de `9.4ch`.
- Prueba institucional: los numeros dejan de competir con el titular; cada metrica usa una pequena grilla interna `numero / etiqueta / evidencia` con cuerpo minimo 16px.
- Servicios: el H2 y las ocho unidades se compactan. La jerarquia queda `titulo seccion > evidencia visual > frentes`, con titulos de frentes entre 20-24px y cuerpos de 16px.
- Paquetes y metodo: filas menos altas, titulos mas cercanos al cuerpo, sin saltos visuales exagerados.
- Antecedentes: el caso destacado baja altura maxima, el titulo queda proporcionado y las tarjetas secundarias reducen su peso para no competir.
- Rail de sectores: se corrige la flecha que saltaba de linea; cada fila queda en tres columnas estables `numero / sector / accion`.
- Sistema V4: se ajustan los helpers globales `.um-heading-xl`, `.um-heading-lg`, `.um-heading-md` y `.um-lead` para que el resto de vistas no herede titulares sobredimensionados.
- Rutas interiores: `/servicios`, detalles de servicio, `/antecedentes`, `/sectores`, sector detail, `/nosotros`, `/blog` y `/contacto` normalizan heroes con line-height `1.06-1.08`, sin tracking negativo fuera del logo, y titulares maximos mas contenidos.

Regla operacional: ningun texto visible del sitio publico debe quedar debajo de 16px. La jerarquia no se logra achicando metadata, sino con peso, espacio, linea y contraste.

## Prueba local de plantillas: sectores y antecedentes

Se agregan dos variantes comparables, solo para desarrollo local:

- `?template=editorial`: composicion editorial con protagonistas, secundarios y archivo documental.
- `?template=atlas`: indice tecnico mas denso, pensado como mapa industrial de evidencia.

Rutas de prueba:

- `/sectores?template=editorial`
- `/sectores?template=atlas`
- `/aeropuertos?template=editorial`
- `/aeropuertos?template=atlas`
- `/antecedentes?template=editorial`
- `/antecedentes?template=atlas`

Contrato de la prueba:

- En produccion se ignora el query param y se mantiene la vista estable actual.
- No se cambian URLs publicas, canonicals, sitemap, robots ni contratos de Directus.
- Las variantes no aparecen en navegacion publica.
- El rojo lleno queda prohibido como overlay repetido sobre miniaturas; solo se admite como linea, numero, foco activo, flecha o CTA.
- Las miniaturas deben tener aspect-ratio estable, pero no todas el mismo alto, crop y peso visual.
- Las grillas deben mezclar ritmos: protagonista, secundario, fila documental y ledger.
- Ningun texto visible baja de 16px, incluyendo metadata, filtros, fechas, etiquetas y botones.
- No mas de un bloque protagonista por viewport para evitar competencia visual.
- Los filtros y la busqueda deben leerse como herramientas sobrias, no como una barra apretada de chips.

### Ajuste de proporcion aplicado en localhost

Revision final ejecutada sobre `localhost:4322` en desktop `1440x900` y mobile `390x900`:

- Titulares de templates: escala visible normalizada con `Poppins 600` desktop/mobile para evitar acentos con fallback visual y peso desproporcionado.
- Sectores `editorial` y `atlas`: se redujo el espacio superior, se agrego texto de contexto y se quito contenido fallback oculto para evitar H1 duplicados en variantes dev.
- Antecedentes `editorial`: hero mas compacto, filtros mobile sin scroll horizontal, chips convertidos a navegacion textual sobria y evidencia visible antes.
- Blog: deja de ser una columna angosta aislada; pasa a header tecnico oscuro, tabs UMSA, articulos editoriales amplios y titulos proporcionados. En mobile el titulo de articulo baja a ~26px para no competir con el H1.
- Auditoria final: `0` textos visibles bajo 16px, `0` overflow horizontal en las rutas probadas y rojo lleno limitado al CTA de navegacion desktop.

## Sistema de skins cromaticas UMSA

Se agrega una prueba local de skins por query param `?skin=black|white|hybrid|steel`.

Contrato tecnico:

- Solo funciona en desarrollo local mediante `getDevSkinVariant(Astro.url, import.meta.env.DEV)`.
- En produccion se ignora siempre el query param y no se emite `data-skin`.
- No cambia rutas, canonicals, sitemap, robots, Directus, copy, contenido ni jerarquia.
- Se puede combinar con templates de prueba: `/antecedentes?template=editorial&skin=white`.
- El rojo UMSA `#DC2626` sigue siendo acento: CTA, foco activo, regla, punto, numero o flecha. No es un tema cromatico dominante.
- `white` no significa minimalismo vacio; debe sostener transparencia documental, evidencia y precision.
- `black` no significa cyber; debe sostener infraestructura, control operativo y sobriedad industrial.

### Tokens semanticos

| Grupo | Tokens |
|---|---|
| Base | `--skin-page`, `--skin-section`, `--skin-section-alt`, `--skin-panel`, `--skin-panel-strong`, `--skin-text`, `--skin-muted`, `--skin-line` |
| Hero/media | `--skin-hero-bg`, `--skin-hero-text`, `--skin-hero-muted`, `--skin-hero-line`, `--skin-hero-panel`, `--skin-hero-panel-solid`, `--skin-hero-wash`, `--skin-media-filter` |
| Chrome | `--skin-nav-bg`, `--skin-nav-text`, `--skin-nav-text-strong`, `--skin-nav-line`, `--skin-footer-bg`, `--skin-footer-text`, `--skin-footer-heading`, `--skin-footer-line` |

### Matriz de skins

| Skin | Intencion visual | Uso recomendado | Riesgo a controlar | Capturas requeridas |
|---|---|---|---|---|
| `black` | Dominio oscuro tecnico, monitoreo, continuidad 24/7, infraestructura exigente. | Hero, soporte critico, servicios operativos, capacidades conectadas. | Oscuridad excesiva, contraste duro, estetica cyber generica. | Home, servicio detalle, contacto desktop/mobile. |
| `white` | Transparencia, documentacion, claridad comercial, confianza institucional. | Antecedentes, sectores, blog, servicios index, contacto. | Consultora generica, pagina plana, falta de profundidad tecnica. | Antecedentes editorial, sectores editorial, blog desktop/mobile. |
| `hybrid` | Apertura oscura premium + cuerpo blanco editorial. | Candidata preliminar para default futuro. | Cortes bruscos entre secciones o mezcla sin continuidad. | Home completa, servicios, antecedentes, sectores. |
| `steel` | Gris frio industrial, precision documental, ingenieria sobria. | Dossiers, fichas tecnicas, archivos, servicios con fuerte componente documental. | Verse administrativo o apagado si faltan imagenes fuertes. | Servicios, sector vertical, antecedentes atlas. |

Recomendacion preliminar: `hybrid` como candidata principal para el sitio publico futuro; `white` para comparar transparencia y lectura institucional; `black` reservado para apertura/capacidad critica; `steel` para validar si el tono documental industrial mejora fichas y dossiers.

Rutas de QA:

- `/?skin=black|white|hybrid|steel`
- `/servicios?skin=black|white|hybrid|steel`
- `/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it?skin=black|white|hybrid|steel`
- `/antecedentes?template=editorial&skin=black|white|hybrid|steel`
- `/sectores?template=editorial&skin=black|white|hybrid|steel`
- `/nosotros?skin=black|white|hybrid|steel`
- `/blog?skin=black|white|hybrid|steel`
- `/contacto?skin=black|white|hybrid|steel`

Checklist de aceptacion visual:

- Ningun texto visible bajo 16px.
- Misma estructura, contenido y jerarquia entre skins.
- Sin overflow horizontal ni cortes mobile.
- Nav y footer legibles en cada skin.
- Rojo UMSA no coloniza superficies ni overlays repetidos.
- Imagenes reutilizadas con tratamiento por token, sin nuevos assets AI.

---

## 1. Objetivo

El sitio debe dejar de sentirse como un template SaaS generico y pasar a una identidad industrial, sobria y editorial:

- empresa tecnica real, no landing page decorativa;
- servicios IT integrales, no solo infraestructura critica;
- evidencia operativa primero: servicios, antecedentes, sectores, capacidades conectadas;
- lectura clara en desktop y mobile, sin solapamientos, microtexto, emojis, gradientes de fantasia ni cards repetitivas;
- imagen real o editorial neutral, nunca estetica AI-looking como cierre final.

La vara visual es: empresa de tecnologia e infraestructura con presentacion institucional de nivel industrial mundial, pero sin perder austeridad tecnica local.

---

## 2. Pantallas Auditadas

Auditoria local realizada sobre `http://localhost:4322` en desktop `1440x1100` y mobile `390x1200`.

| Pantalla | Ruta | Estado actual | Problema principal | Prioridad |
|---|---|---|---|---|
| Home | `/` | Parcialmente alineada al nuevo lenguaje | hero demasiado alto, servicios y antecedentes ya mejorados pero aun sin sistema global | P0 |
| Servicios | `/servicios` | V4 generico | azul/cyan dominante, cards redondeadas, filtros innecesarios para 8 servicios | P0 |
| Detalle servicio | `/servicios/[id]/[slug]` | correcto funcionalmente | hero y sidebar genericos, poca profundidad tecnica, azul fuera del sistema principal | P0 |
| Antecedentes | `/antecedentes` | funcional con buena data | grilla de cards repetitiva, titulos truncados, filtros con chips blandos | P0 |
| Detalle antecedente | `/antecedentes/[id]/[slug]` | base util | demasiado SaaS, ficha tecnica en card blanda, jerarquia mejorable | P1 |
| Sectores | `/sectores` | fuera de tono | emojis, gradientes, cards grandes, lenguaje playful | P0 |
| Sector vertical | `/aeropuertos` y equivalentes | base aceptable | emoji y stats tipo landing, falta evidencia real por sector | P1 |
| Nosotros | `/nosotros` | inconsistente | imagen AI-looking/data center generico, acentos azules, poco relato institucional real | P0 |
| Blog | `/blog` | editorial limpio pero aislado | tipografia serif y sistema visual distinto al resto del sitio | P1 |
| Contacto | `/contacto` | funcional | proceso generico, cards y radios demasiado blandos, falta cierre institucional | P1 |

Observacion tecnica: no se detecto overflow horizontal en la muestra automatizada. El problema principal no es solo responsive; es jerarquia, sistema y direccion visual.

---

## 3. Marca UMSA Aplicada a Web

La skill UMSA define una identidad documental. Para web se adapta asi:

### Colores Canonicos

| Token | HEX | Uso web |
|---|---:|---|
| `--um-black` | `#000000` | texto fuerte, fondos institucionales, headers tecnicos |
| `--um-red` | `#DC2626` | acento principal, CTAs, separadores, puntos de logo |
| `--um-white` | `#FFFFFF` | fondos principales, texto invertido |
| `--um-gray-900` | `#111111` | texto principal alternativo |
| `--um-gray-700` | `#333333` | cuerpo fuerte |
| `--um-gray-500` | `#666666` | metadata, labels, ayudas |
| `--um-gray-100` | `#F5F5F5` | bandas, fondos alternos |
| `--um-border` | `#DDDDDD` | bordes, reglas, divisores |
| `--um-blue-doc` | `#1A56C0` | solo datos/documental, no como color dominante del sitio |

Reglas:

- El rojo correcto es siempre `#DC2626`.
- `#B91C1C`, `#EF4444`, `#F87171`, `#FF0000` y `#CC0000` no son rojo UMSA para identidad ni acento de UI.
- El rojo no se usa como fondo grande salvo CTA. En grandes superficies cansa y baja el nivel.
- En fondos oscuros, rojo pequeno como texto queda prohibido: usar blanco para texto y `#DC2626` solo como regla, punto, borde o icono.
- Los acentos azules/cyan actuales deben reducirse. Si aparecen, que sea informacion documental o tecnico-operativa.
- Evitar paletas multicolor por sector. Los sectores deben diferenciarse por imagen, texto y estructura, no por gradientes de colores.
- No usar fondos rosas, salmón ni variantes crema.

### Logo

`ultimamilla.com.ar` siempre en minusculas.

Construccion:

- texto negro o blanco;
- dos puntos en rojo `#DC2626`;
- sin sombras, contenedores, gradientes, deformaciones ni mayusculas.

### Tipografia

| Rol | Familia | Peso | Uso |
|---|---|---:|---|
| Logo / marca | `Futura PT`, fallback `Futura`, sans-serif | 600 | logo canonico y puntos rojos |
| Display / H1 / H2 | `Poppins`, fallback `Futura PT`, `Century Gothic`, sans-serif | 600 | titulares editoriales y contenido publico |
| UI / cuerpo | `Open Sans`, fallback `Arial`, system-ui | 400-700 | parrafos, nav, botones, forms |
| Blog largo | `Open Sans` o una serif editorial solo si queda subordinada al sistema | 400-700 | articulos |

Reglas:

- Tracking general en headings: `0`. El tracking negativo queda reservado al logo.
- No bajar de `16px` en texto visible de UI publica; evitar microtexto tambien en labels, fechas, filtros y metadata.
- Line-height: headings `1.0-1.12`, cuerpo `1.5-1.65`.
- Mobile no debe usar escala por viewport sin limite. Usar `clamp()` con minimos legibles.

### Escala Recomendada Web

| Nivel | Desktop | Mobile | Peso | Line-height |
|---|---:|---:|---:|---:|
| Hero H1 | 40-64px | 30-38px | 600 | 1.06-1.12 |
| Page H1 | 38-56px | 30-36px | 600 | 1.08-1.14 |
| Section H2 | 28-42px | 26-32px | 700 | 1.1-1.16 |
| Card/row title | 21-30px | 20-24px | 700 | 1.12-1.2 |
| Body large | 18-21px | 17-18px | 400 | 1.55 |
| Body | 16-18px | 16px | 400 | 1.55-1.65 |
| Label/meta | 16px minimo | 16px minimo | 700 | 1.3-1.45 |

---

## 4. Espaciado, Grilla y Proporcion

### Contenedores

- Container principal: `1180px` maximo.
- Gutter desktop: `32px` minimo.
- Gutter mobile: `24px` ideal, `16px` solo en UI densa.
- No usar contenido full-width salvo hero/media/bandas intencionales.

### Escala de Espaciado

Usar esta escala, no valores arbitrarios:

`4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 120`

Aplicacion:

- Separacion entre secciones: `72-120px` desktop, `56-72px` mobile.
- Separacion heading -> contenido: `32-48px`.
- Padding de paneles: `24-40px`, mobile `20-24px`.
- Gap de grids: `16-28px`.

### Ritmo de Pagina

Una pagina larga debe alternar:

1. apertura fuerte;
2. bloque de decision/servicios;
3. evidencia real;
4. detalle o sector;
5. CTA sobrio.

No repetir grillas de cards con el mismo peso visual en todas las secciones.

---

## 5. Geometria y Superficies

La identidad UMSA debe sentirse precisa, tecnica y sobria.

| Elemento | Regla |
|---|---|
| Radius general | `0-8px`. Evitar `rounded-2xl`, `rounded-full` decorativos |
| Cards repetidas | solo para items reales; no envolver secciones completas en cards |
| Bordes | `1px solid #DDDDDD` o blanco al 14% en fondos oscuros |
| Sombras | muy sutiles; evitar sombras azules/rojas o glow |
| Fondos | blanco, negro, gris `#F5F5F5`, imagen real oscurecida |
| Gradientes | solo overlays de legibilidad sobre imagen; no gradientes coloridos por decoracion |
| Pildoras/badges | uso minimo. No usar badges decorativos en heroes |
| Iconos | lineales, tecnicos, stroke consistente, no emojis |

Regla dura: sectores y servicios no usan emojis. El sitio actual de `/sectores` debe migrar completo.

---

## 6. Imagenes y Assets

### Gate de Assets

Cada frente debe tener una imagen aprobada:

1. Redes
2. Seguridad electronica
3. Telecomunicaciones
4. Software
5. Soporte 24/7
6. Consultoria IT
7. Deteccion de incendios
8. Electricos para IT

Si falta foto UMSA real:

- usar composicion editorial neutral;
- evitar personas/objetos generativos evidentes;
- evitar stock blanco con productos flotando;
- no usar renders AI-looking como cierre final.

### Tratamiento

- Imagenes principales: aspect ratio estable `16:9`, `4:3` o full hero.
- Crops tecnicos: racks, cableado, salas, tableros, campo, oficinas reales.
- Filtro permitido: grayscale leve, contraste leve.
- No lavar imagen con overlay de color no pedido. Usar negro/edge fade para legibilidad.

---

## 7. Componentes Canonicos

### Navbar

Estado actual: base correcta.

Breakpoint operativo (mayo 2026): menú desktop visible desde **1180px** (`NavbarV4.astro`, media `min-width: 1180px`). Por debajo de 1180px se usa hamburguesa full-width. El contenedor editorial sigue en **1180px** (`--um-container`).

Correcciones:

- CTA `Contacto`: radius `4px`, sombra mas contenida.
- Active nav: rojo UMSA o negro con subrayado rojo, no cyan.
- Altura estable: desktop `80px`, mobile `64px`.
- Mobile menu debe ocupar ancho completo con tipografia 16px y separadores, no pills.

### Botones

| Variante | Uso | Estilo |
|---|---|---|
| Primary | accion comercial | fondo `#DC2626`, texto blanco, radius 4px, min-height 48px |
| Secondary dark | sobre hero oscuro | borde blanco 35%, fondo transparente |
| Secondary light | sobre blanco | borde `#111`, texto negro |
| Text link | navegacion secundaria | texto negro o rojo, subrayado/borde inferior rojo |

No usar botones redondeados tipo SaaS ni sombras grandes.

### Hero Corporativo

Debe tener:

- H1 fuerte, una sola idea;
- parrafo maximo 2 lineas desktop / 4 mobile;
- 1-2 CTAs maximo;
- prueba visible, no panel complejo;
- debe dejar ver o insinuar la siguiente seccion en desktop y mobile.

Alturas:

- Home hero desktop: `78-86svh`, no `100svh` si tapa todo lo posterior.
- Page hero: `320-460px` desktop; mobile `260-380px`.

Evitar:

- badges decorativos;
- dashboards falsos;
- metricas con microtexto;
- overlays que oscurezcan tanto que la imagen pierda valor.

### Metricas

Formato UMSA:

- numero grande Futura/Poppins;
- label legible minimo 16px;
- borde simple;
- maximo 4 metricas;
- mobile: 2x2 o lista compacta, no una torre excesiva.

### Modulo de Servicio

Anatomia:

1. imagen real con aspect ratio estable;
2. icono tecnico pequeno;
3. nombre corto;
4. descripcion/proof de 1-2 lineas;
5. link claro.

Reglas:

- desktop home: 2 columnas editoriales o lista alterna, no 4 columnas densas;
- `/servicios`: 8 items completos, sin paginacion ni filtros innecesarios;
- detalle servicio: hero + descripcion + proceso + productos/evidencia + CTA.

### Antecedente / Caso

Anatomia ideal:

1. imagen/crop real;
2. sector;
3. titulo completo o truncado controlado;
4. cliente;
5. servicio relacionado;
6. link.

Reglas:

- listados: maximo 3 columnas desktop para legibilidad; 1 columna mobile.
- No truncar titulos clave si son la prueba principal.
- Filtros por sector en una barra limpia, no chips blandos redondeados.
- Detalle: ficha tecnica debe sentirse documental, con reglas y metadata, no card SaaS.

### Sectores

Anatomia:

- imagen real o editorial por sector;
- problema operativo especifico;
- capacidades aplicadas;
- antecedentes relacionados;
- CTA a contacto/servicios.

Prohibido:

- emojis;
- gradientes multicolor;
- cards juguetonas;
- claims genericos sin prueba.

### Blog

El blog puede ser mas editorial, pero debe integrarse:

- logo/nav/footer compartidos;
- imagen destacada visible para la nota principal y miniatura real en cada fila;
- `imagen_portada` de Directus como fuente primaria de media; folio tipografico solo como fallback tecnico local;
- color rojo UMSA para categoria activa/acento;
- tipografia de articulo clara;
- listado sobrio, no aislado del sistema;
- categorias sin pills azules innecesarias.

### Formularios

Contacto debe ser funcional, sobrio y empresarial:

- labels visibles;
- inputs 48-56px alto;
- border `#DDDDDD`, focus rojo;
- radius 4-8px;
- errores claros;
- no placeholders como unico label;
- columna lateral con contacto directo y horario, sin cards exageradas.

---

## 8. Especificacion por Pantalla

### Home

Rol: puerta principal de posicionamiento.

Orden:

1. Hero: "Servicios IT integrales".
2. Servicios: 8 frentes con imagen y prueba.
3. Antecedentes: evidencia, casos y sectores.
4. Capacidades conectadas: SGI, Licitometro, APIs.
5. Blog band.
6. CTA final.

Correcciones pendientes:

- Reducir altura hero para insinuar siguiente seccion.
- Unificar hero metrics desktop/mobile.
- Revisar peso visual de servicios en mobile: hoy queda demasiado largo antes de antecedentes.
- Mantener antecedentes como bloque claro de evidencia, no volver al mosaico oscuro.

### Servicios Index

Problemas actuales:

- Hero azul/cyan fuera de marca.
- Filtro/paginacion innecesarios para 8 servicios.
- Cards con imagenes de producto flotante/stock.
- Radius y sombras tipo SaaS.

Destino:

- Hero corto editorial.
- Lista de 8 servicios con el mismo `serviceVisualSystem`.
- Layout: 2 columnas desktop, 1 mobile, o lista editorial con imagen lateral.
- CTA al final.

### Detalle de Servicio

Problemas actuales:

- Hero generico con overlay azul.
- Sidebar blando.
- Proceso correcto pero poco diferenciado.

Destino:

- Hero de 360-460px con imagen del servicio.
- Ficha tecnica en formato documental:
  - tiempo;
  - cobertura;
  - garantia;
  - servicios/productos asociados.
- Seccion "Que resuelve" con 3-5 puntos.
- Seccion "Como trabajamos" con pasos sobrios.
- Antecedentes relacionados.

### Antecedentes Index

Problemas actuales:

- Grilla de 4 columnas comprime titulos.
- Chips y cards redondeadas bajan el tono.
- Las imagenes tienen buen potencial pero compiten entre si.

Destino:

- Header de evidencia: total, sectores, filtros.
- Layout desktop: 3 columnas maximo o lista con primer caso destacado.
- Filtros por sector como tabs/rail sobrio.
- Busqueda como herramienta secundaria, no protagonista.

### Detalle Antecedente

Problemas actuales:

- Badge azul y ficha tecnica SaaS.
- Hero demasiado similar a paginas de marketing.

Destino:

- Hero con titulo, cliente, sector, fecha.
- Ficha tecnica documental con lineas y labels.
- Descripcion, alcance, servicios relacionados, imagenes/galeria si existen.
- CTA a servicio o contacto.

### Sectores Index

Problemas actuales:

- Es la pantalla mas fuera de marca.
- Usa emojis y gradientes multicolor.
- El tono parece consumer/playful, no industrial.

Destino:

- Hero sobrio: "Soluciones por sector".
- Grid de sectores con foto real/crop, no emoji.
- Cada card: problema operativo + capacidades + cantidad de casos.
- Stats en banda documental, no counters decorativos.

### Sector Detail

Problemas actuales:

- Mejor que index, pero todavia usa emoji y cards blandas.
- Falta relacion directa con antecedentes reales.

Destino:

- Hero con imagen real del sector.
- Bloque de problemas especificos.
- Servicios aplicados.
- Antecedentes relacionados.
- CTA a diagnostico.

### Nosotros

Problemas actuales:

- Imagen data center generica/AI-looking.
- Acentos azules y cards multicolor.
- Falta relato institucional real.

Destino:

- Historia y capacidad operativa UMSA.
- Fotos reales de equipo, obras, racks, visitas, tableros, soporte.
- Timeline sobrio.
- Valores como practicas, no como slogans.

### Blog

Problemas actuales:

- Limpio, pero visualmente parece otro sitio.
- Serif dominante no conversa con Futura/Open Sans.

Destino:

- Mantener lectura editorial, pero alinear tokens.
- Usar imagen destacada y miniaturas reales de cada nota.
- Categorias en rojo/negro.
- Articulos con max-width 720-760px.
- Blog band en home ya debe ser puente hacia este sistema.

### Contacto

Problemas actuales:

- Proceso generico y muy redondeado.
- Formulario correcto pero blando.

Destino:

- Contacto como "diagnostico inicial".
- Proceso en linea documental.
- Formulario con campos mas sobrios.
- Datos de contacto + cobertura + horario + soporte 24/7.

---

## 9. Rutas y SEO

No cambiar:

- URLs existentes;
- rutas dinamicas `/servicios/[id]/[slug]`;
- rutas dinamicas `/antecedentes/[id]/[slug]`;
- canonical `https://ultimamilla.com.ar`;
- sitemaps, robots, blog, contacto.

Demos:

- `/banners`
- `/pretext-demo`

Deben quedar como laboratorio local/no productivo y `noindex`.

---

## 10. Sistema de Implementacion

### Tokens CSS a centralizar

Crear o consolidar tokens en `src/styles/v4.css`:

```css
:root {
  --um-black: #000000;
  --um-red: #DC2626;
  --um-white: #FFFFFF;
  --um-gray-900: #111111;
  --um-gray-700: #333333;
  --um-gray-500: #666666;
  --um-gray-100: #F5F5F5;
  --um-border: #DDDDDD;
  --um-blue-doc: #1A56C0;

  --um-font-logo: 'Futura PT', 'Futura', sans-serif;
  --um-font-display: 'Poppins', 'Futura PT', 'Century Gothic', sans-serif;
  --um-font-body: 'Open Sans', Arial, system-ui, sans-serif;
  --um-weight-title: 600;
  --um-weight-strong: 700;

  --um-container: 1180px;
  --um-radius: 4px;
  --um-radius-lg: 8px;
}
```

### Componentes a crear/refactorizar

| Componente | Proposito |
|---|---|
| `SectionHeader.astro` | kicker opcional, H2, texto, link; sin badges decorativos |
| `MetricStrip.astro` | metricas consistentes |
| `EditorialServiceModule.astro` | modulo de servicio con imagen, icono, proof |
| `EvidenceCaseRow.astro` | caso destacado/lista documental |
| `SectorIndexCard.astro` | sector con imagen real, no emoji |
| `TechnicalFactSheet.astro` | ficha tecnica documental para servicios/antecedentes |
| `UMButton.astro` | variantes primary/secondary/text |
| `UMLogo.astro` | logo canonico reutilizable |

---

## 11. Checklist de Aprobacion Visual

Antes de cerrar una pantalla:

- [ ] Se ve el logo canonico y el rojo exacto `#DC2626`.
- [ ] No hay emojis ni gradientes multicolor en pantallas corporativas.
- [ ] No hay texto visible menor a 16px, incluyendo metadata, filtros, fechas, nav y botones.
- [ ] No hay cards dentro de cards.
- [ ] Radius maximo 8px salvo casos existentes justificados.
- [ ] La primera pantalla tiene una sola jerarquia dominante.
- [ ] Desktop muestra aire y proporcion; mobile no apila bloques interminables sin decision.
- [ ] Imagenes no parecen generativas ni stock decorativo.
- [ ] CTAs tienen una jerarquia clara: primario, secundario, link.
- [ ] No hay overflow horizontal ni solapamientos.
- [ ] Los filtros no ocupan mas importancia que el contenido.
- [ ] Cada pantalla conserva su rol: servicio, prueba, sector, empresa, blog o contacto.
- [ ] Canonical, metadata y rutas permanecen estables.

---

## 12. Plan de Iteracion Recomendado

### Fase 1: Sistema base

1. Centralizar tokens UMSA en CSS.
2. Crear componentes canonicos compartidos.
3. Unificar navbar/footer y botones.
4. Definir asset gate por servicio/sector.

### Fase 2: Pantallas P0

1. Home: ajustar hero y terminar ritmo.
2. Servicios index: eliminar filtro innecesario, redisenar 8 servicios.
3. Sectores index: reemplazar emojis/gradientes por sistema editorial.
4. Nosotros: eliminar imagen generica y crear narrativa institucional.
5. Antecedentes index: mejorar grilla/lista y filtros.

### Fase 3: Detalles

1. Detalle servicio.
2. Detalle antecedente.
3. Sector detail.
4. Contacto.
5. Blog.

### Fase 4: QA

1. Desktop y mobile por ruta.
2. Contraste WCAG AA.
3. Capturas visuales.
4. `npm run typecheck`.
5. `npm run lint`.
6. `npm test`.
7. `npm run build`.

---

## 13. Decision Actual

La decision vigente es White Dossier como prototipo principal local: blanco editorial para evidencia, compra y lectura; negro tecnico solo donde agrega prueba operativa; rojo UMSA como acento quirurgico.

El salto de calidad no depende de cambiar colores por pantalla. Depende de sostener una grilla editorial UMSA en todas las rutas, retirar elementos generic SaaS, controlar tipografia/contraste y probar cada superficie en navegador.

Este documento queda como contrato visual para esa consolidacion.

---

## 14. Cierre de coherencia en utilidades y labs

Iteracion local agregada sobre el remanente visible:

- `/plantilla-arca`: deja de usar estetica SaaS azul, emojis, gradientes y cards blandas. Queda como utilidad documental UMSA con hero blanco, paneles de trabajo, formulario legible, CTA primario rojo medido y controles secundarios neutros. La logica de generacion se mantiene intacta.
- `/banners`: queda como laboratorio noindex con marco oscuro tecnico, radios de 4px, texto minimo 16px y rojo UMSA como unico color de acento.
- `/pretext-demo`: queda como laboratorio noindex para validar tipografia/movimiento, sin verdes/azules de demo ni tracking negativo.
- `/estilo`: el login restringido abandona Inter/azul y se alinea al acceso institucional blanco con logo UMSA y rojo exacto.

Regla para utilidades publicas: aunque no sean parte del recorrido comercial, nunca deben parecer otro producto ni otra marca. Deben sostener contraste, minimo 16px, pesos hasta 700, radius 0-8px y acento rojo controlado.
