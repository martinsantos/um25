# Casos destacados: evidencia y límites

Corte local del 1 de noviembre de 2026. Dataset editorial en `src/data/propuesta/casos-destacados.ts`, integrado en los destacados y las fichas del sitio; la revisión de este documento no modifica registros del CMS.

## Método

Se cotejó la auditoría viva `http://127.0.0.1:4381/propuesta/auditoria.json` (HTTP 200, 520 fichas) con `src/data/snapshots/antecedentes.json`, `src/data/sgi/fechas.json` y `src/data/antecedentes_completos.js`. La auditoría acredita ID de ficha, título, cliente tal como lo sirve Directus y fecha; el registro completo aporta el alcance y las cantidades. En 11 casos el cliente, el alcance y el inicio SGI coinciden con el registro completo. El caso 3104 se sustenta en el texto específico de la ficha web y su fecha de inicio SGI. En ese caso el snapshot tiene `Fecha` 2024-11-15 y SGI `inicio` 2024-10-09; ambos corresponden a 2024 y el sitio prioriza SGI para mostrar el año. La ficha de SGI acredita fechas y estado, no el efecto del servicio.

Solo se incluyeron clientes que la auditoría viva muestra con nombre. Se excluyó el ID 3552, aunque fuentes históricas nombran una entidad pública, porque el catálogo vivo etiqueta su cliente como «Cliente Confidencial». No se recupera esa identidad previa. Tampoco se atribuyen ROI, testimonios ni mejoras operativas que no estén en la evidencia. El campo `outcome` queda omitido: estado SGI «finalizado» no se convierte en una afirmación de impacto.

| ID web | Cliente visible en auditoría | Inicio SGI | Registro completo (si aplica) | Hechos/campo documentado |
|---:|---|---|---:|---|
| 3126 | Aeropuertos Argentina 2000 | 2023-09-08 | 11146 | 3 centrales NFS-320-SP, 3 placas NC-NCM-SF, 3 detectores FSP-951 consignados; instalación en zonas del balizamiento y mantenimiento. |
| 3144 | Ministerio de Desarrollo Social, Salud y Deportes del Gobierno de MZA | 2023-08-29 | 11145 | 43 puestos de datos, 18 de telefonía, 4 racks 9U y tendido de 4 fibras monomodo. |
| 3119 | Poder Judicial Mendoza | 2023-08-23 | 11141 | 8 tableros; gabinetes principales IP65 de 120 bocas y secundarios de 10 bocas. |
| 3588 | Kristich Desarrollos | 2023-12-01 | 11154 | 31 estaciones interiores, 13 cámaras analógicas, 4 switches PoE y DVR de 16 canales. |
| 3102 | FUESMEN · Fundación Escuela Medicina Nuclear | 2024-07-30 | 11173 | 45 puestos simples y 25 dobles; un rack 40U y cuatro racks murales 15U. |
| 3099 | Headcomm S.A. | 2024-10-09 | 11176 | 16 puestos Cat. 6 (6 estándar y 10 para AP), fibra monomodo de 12 hilos, rack mural 12U. |
| 3103 | FUESMEN · Fundación Escuela Medicina Nuclear | 2024-08-19 | 11174 | 33 puestos simples Cat. 6 LSZH y un rack mural 15U. |
| 3085 | FUESMEN · Fundación Escuela Medicina Nuclear | 2024-10-22 | 11179 | 56 puestos simples y 29 dobles Cat. 6 LSZH. |
| 3640 | Cervecería y Maltería Quilmes | 2019-11-25 | 10927 | 5 cámaras; el alcance separa 150 m de UTP Cat. 6 para camarines y 150 m para oficina de elaboración. |
| 3104 | Aeropuertos Argentina 2000 | 2024-10-09 | — | Acceso perimetral a activos de obra en pañol y taller del campo de vuelo; instalación, montaje, testeo, pruebas y control. |
| 3140 | Aeropuertos Argentina 2000 | 2024-01-08 | 11158 | CCTV para mostradores de cobro del parking del aeropuerto de Mendoza; el registro habla de provisión, montaje y puesta en marcha, sin cantidad. |
| 3116 | Luna Maya | 2024-02-06 | 11162 | Cableado de datos y provisión/configuración de un AP para una suite en Bodega Sur de los Andes; sin cantidad consignada. |

En el registro 11179, la frase sobre cantidad de racks es internamente ambigua y se dejó fuera. En 11146 el texto de origen termina truncado después de «Detec»; solo se conservan los nombres y cantidades completos que aparecen antes del corte. En 11145 el destino de las cuatro fibras no está completo y no se infiere. Para Quilmes se conservan los dos tramos de 150 m separados por sector; no se transforman en un total ni se suman jornadas.

## Revisión de sectores y servicios

Se cotejaron las 12 fichas curadas con `/antecedentes/datos.json`, el snapshot y los registros completos. Once reglas acotadas por ID aplican sólo si el cliente vivo sigue coincidiendo con el cliente público del caso y permanece el texto específico de evidencia; 10 cambian el resultado y una mantiene las etiquetas verificadas de 3085. Para registros vinculados al origen, también se requiere cliente y fecha de inicio SGI exactos. No se modifica la identidad, las fechas ni las imágenes.

| ID | Antes | Corrección local | Evidencia que la habilita |
|---:|---|---|---|
| 3588 | Aeropuertos · 103 | Constructoras · 103, 102 | 11154: complejo de departamentos del Marqués, portería IP y CCTV. |
| 3126 | 103, 107 | 107 | 11146: detección de incendios en balizamiento. |
| 3144 | 108 | 101, 103 | 11145: puestos Cat. 6 para datos y telefonía. |
| 3102 | 108 | 101 | 11173: puestos de datos Cat. 6 LSZH. |
| 3103 | 108 | 101 | 11174: 33 puestos de datos Cat. 6 LSZH; cliente y fecha SGI coinciden. |
| 3104 | Constructoras · 103, 102 | Aeropuertos · 102 | Texto propio de la ficha: control de acceso en campo de vuelo de Aeropuertos Argentina 2000. No se vincula a un registro de origen por la diferencia de fecha. |
| 3140 | 103, 102 | 102 | 11158: CCTV para mostradores de cobro del parking del aeropuerto. |
| 3116 | Sin sector · 101 | Bodegas · 101 | 11162: cableado y AP para una suite en Bodega Sur de los Andes; cliente y fecha SGI coinciden. |

Se mantienen sin cambio 3119 (Gobierno · 108) y 3085 (Salud · 101, 108). En 3085 el título público conserva “tableros eléctricos” y el origen confirma el cableado. La revisión final corrige además 3640 de Aeropuertos a Industria: el origen 10927 identifica la Cervecería y Maltería Quilmes y el trabajo en su oficina de elaboración; no existe evidencia de un aeropuerto. En 3099 se retira Constructoras y queda sin sector del filtro: el registro 11176 identifica al Mayorista Yaguar y sus sucursales, mientras la taxonomía actual no incluye comercio. El servicio Redes se conserva. Ninguna de estas correcciones afirma una ubicación física adicional.

Estas son correcciones locales de presentación; no cambian los registros del CMS ni se publican.

## Imágenes y uso editorial

Los doce elementos usan `imageKind: 'illustration'`. La auditoría calcula `sin-foto-propia` según la ruta y no comprueba autenticidad; por eso ninguna imagen existente se etiqueta como fotografía documentada de estos proyectos. `sourceRefs` son referencias de curación para revisión, no citas pensadas para mostrarse como texto de página.

Tres IDs sugeridos para portada: **3588**, **3144** y **3126**. Combinan una instalación de portería/CCTV con cantidades explícitas, cableado de un edificio de salud con puestos y racks cuantificados, y detección de incendios en zonas de un aeropuerto. El resto mantiene profundidad para las fichas correspondientes. El dataset expone `CasoDestacado`, `CASOS_DESTACADOS`, `PORTADA_CASOS_IDS` y `casoDestacadoDe(id)`; incluye `client` para que integración pueda cotejar la identidad viva.
