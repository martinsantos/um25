# Sistema "Despiece" — una estética para todo el sitio

Fecha: 2026-10-30 · Rama `feature/portada-despiece-20261030` · Rutas bajo `/propuesta` (no indexables).

## La idea en una frase

ULTIMA MILLA cuenta su historia mostrando los lugares por dentro. Cada página del sitio usa el mismo
gesto: una imagen real del lugar (foto o película de Blender) que se abre y deja ver el despiece
isométrico con los sistemas que sostienen la operación. Cada proyecto es una ficha de trabajo; el
conjunto es un muro que se filtra como infografía.

## Los elementos comunes

| Elemento | Regla |
| --- | --- |
| Fondo | Negro de obra `#0a0b0d`. Un solo fondo en todo el sitio. |
| Tinta | Blanco `#f4f4f5`, gris `#b4b6bb`, gris apagado `#6f737a`. |
| Color | Un solo rojo `#dc2626`: el punto del logo, el recorrido activo, la línea de corte, la llamada activa. |
| Tipografía | Manrope para texto y títulos. JetBrains Mono, mayúsculas, para etiquetas de plano (números de ficha, hojas, cajetines, fases). |
| Hoja | Marco de 1 px, grilla fina de 48 px, cabecera (qué hoja es) y cajetín al pie (datos fijos). |
| Llamada | Círculo con número `01`…`08`, uno por frente de servicio, igual en todo el sitio. |
| Despiece | La isometría del lugar (`/cine/iso/site-*-v2.svg`): trazas apagadas; el servicio activo enciende recorrido, equipos y pin. |
| Rayos X | Foto arriba, despiece debajo. Una línea roja baja con el scroll y abre la foto; la foto queda como fantasma al 14 %. |
| Fases | `Relevamiento · Diseño · Ejecución · Prueba técnica`, en mono, que se encienden con el avance. |
| Movimiento | Transiciones con `cubic-bezier(.22,1,.36,1)`. Sin zoom al pasar, sin sombras. `prefers-reduced-motion` las apaga. |

Todo esto vive en `src/styles/proto-despiece.css` y en `src/components/proto/isoData.ts` (datos: lugares,
isometrías, pósters de película, servicios, catálogo limpio).

## Las páginas

| Página | Ruta | Qué hace |
| --- | --- | --- |
| Portada | `/propuesta` | Apertura: la película del edificio se abre hasta su despiece. Después, los seis lugares (bodega, aeropuerto, salud, minería, industria, edificio), cada uno con su foto, su despiece, sus fases y tres fichas reales. Ocho frentes con llamada. Contacto como hoja. |
| Muro | `/propuesta/antecedentes` | Los proyectos documentados como pared de fichas. Sector, servicio y año como lentes-infografía (barras con cuenta que se recomponen). La cifra se recompone. Entre las fichas, los recorridos de Blender. Filtro en la URL (`?sector=…`). |
| Ficha de trabajo | `/propuesta/antecedentes/[id]/[slug]` | Un proyecto como hoja de plano: foto del trabajo, despiece del lugar con los servicios del proyecto encendidos y llamados, cajetín con cliente, sector, fecha, servicios y referencia `UM-id`. Recorrido de Blender del sector y servicio. Mismo cliente y mismo sector. |
| Sector | `/propuesta/sectores/[slug]` | Apertura con la película del sector que se abre hasta su despiece; los frentes de ese sector encienden su recorrido; el muro filtrado al sector. |
| Servicio | `/propuesta/servicios/[code]` | Apertura con la película del servicio en su escena y sólo ese recorrido encendido; el equipo en despiece junto a lo que cubre (llamadas); alcance como hoja; cuatro pasos; fichas con ese servicio. |
| Variantes previas | `/propuesta/variantes` | Las tres direcciones del 30/10 (La obra, El plano, Rayos X) de las que sale este sistema. |

## Dónde van las películas de Blender y las transparencias

Las películas (`/cine/media/cine-<escena>[-<servicio>].mp4` con sus pósters) y la película de software
(`software-system-v27`, el edificio en rayos X con pantallas) entran en el sistema con el mismo gesto, no
como banners aparte:

| Lugar | Uso |
| --- | --- |
| Portada, apertura | La película del edificio es la "foto" de la apertura: el corte la abre hasta el despiece. En teléfono y con movimiento reducido queda el póster. |
| Muro | Los recorridos (pósters) intercalados entre las fichas, en la escena del sector filtrado. |
| Ficha de trabajo | Miniatura del recorrido del sector y servicio del proyecto, con enlace al sector. |
| Página de sector | La película del sector como apertura, con el mismo corte, y debajo el muro filtrado a ese sector. |
| Página de servicio | La película del servicio en su escena (`<escena>-<servicio>`) y el despiece con sólo ese recorrido encendido. |
| Software (104) | La película de transparencias (`software-system-v27`) reemplaza a la foto en la apertura de ese servicio: ya es rayos X por sí misma. |

Regla: una película por página, siempre dentro del marco de rayos X, nunca en bucle sin propósito.
Los pósters (`.avif`) cubren teléfono, conexiones lentas y `prefers-reduced-motion`.

## Textos

Sólo frases ya existentes en el sitio y datos del catálogo. La ficha limpia descripciones de plantilla
("Ejecución integral de…", "Cliente: X. Sector: Y.") y oculta las que repiten el título.

Pendiente de confirmar: la portada dice "24 años" (pedido del 30/10); el sitio en producción dice "más de
22 años" en portada, FAQs y consultoría.

## Datos

- 518 registros en el catálogo; 515 fichas en el muro (tres títulos duplicados del mismo cliente se muestran una vez).
- Minería no tiene antecedentes asignados en el CMS: el lugar se muestra sin cuenta.

## Para llevarlo a producción

1. Mover `proto-despiece.css` a `src/styles/` definitivo y las piezas (hoja, cajetín, llamada, rayos X,
   despiece) a componentes Astro.
2. Reemplazar la portada, `/antecedentes` y `/antecedentes/[id]/[slug]` por estas tres páginas dentro del
   layout (cabecera y pie reales, SEO, `prerender` según corresponda).
3. Sectores y servicios: ya prototipados bajo `/propuesta/sectores` y `/propuesta/servicios`; llevarlos al layout real.
4. Rendimiento: la portada incrusta sólo la primera isometría (390 KB) y trae las demás al acercarse;
   la ficha incrusta una (170–390 KB). Evaluar servir las isometrías comprimidas (`.svgz`) desde Nginx.
5. Unificar "22" / "24" años en todo el sitio.
