# Curación editorial con evidencia local · 1 de noviembre de 2026

Este corte usa la auditoría real de `/propuesta/auditoria.json` con Directus autenticado (520 fichas) y la contrasta con `src/data/snapshots/antecedentes.json`, `src/data/sgi/fechas.json`, `src/data/antecedentes_completos.js` y `src/data/propuesta/antecedentes-extra.json`. El runtime aplica el helper de servicios a los datos vivos. La evidencia de tres posibles sectores existe en el snapshot, pero no en los resúmenes que Directus entrega al helper; esos sectores no se aplican.

## Conteos

| Señal | Corte de referencia | Auditoría real integrada | Alcance |
|---|---:|---:|---|
| Sin servicio | 100 | 68 | 32 asignaciones efectivas basadas en texto de origen o cruce con registro completo |
| Sin sector | 155 | 155 | 3 sectores potenciales del snapshot no se aplican: el resumen vivo no contiene esa evidencia |
| Resumen menor de 60 caracteres | 91 | 91 | Umbral de longitud del endpoint, no evaluación editorial manual |
| Sin foto propia | 2 | 2 | Señal calculada por la ruta del recurso; no inspecciona la imagen ni acredita si representa la obra |
| Sin equipos en registro | 18 | 18 | Señal de origen del despiece, no lectura manual de cada ficha |

Las 23 señales de servicio con términos explícitos del snapshot se ampliaron a 26. Se sumaron seis cruces a registros completos por coincidencia de proyecto; el cruce de 3163 se dejó fuera porque la fecha de SGI y la del registro completo no coinciden. Las 32 asignaciones efectivas estaban marcadas `sin-servicio` en el corte de referencia. En la auditoría real el total baja de 100 a 68.

## Servicios recuperables

La evidencia individual queda registrada en `src/components/proto/catalogEditorial.ts` (`CATALOG_SERVICE_EVIDENCE` y `CATALOG_RELATED_SERVICE_EVIDENCE`). Los códigos siguen el catálogo de navegación: 101 Redes, 102 Seguridad electrónica, 103 Telecomunicaciones, 104 Software a medida, 106 Consultoría IT, 107 Detección de incendios y 108 Eléctricos IT.

| Código | Fichas | Evidencia |
|---|---|---|
| 101 | 3127, 3116, 3586, 3159, 3210, 3233, 3236, 3251, 3261, 3362, 3400, 3668, 3606, 3401 | Tendido de FO, AP, cable Cat. 6, insumos/puestos de datos, SFP, FTTH y etiqueta de origen “Redes de Cableado Estructurado” |
| 102 | 3573 | La descripción del registro nombra instalación de sistemas de seguridad para móviles policiales |
| 103 | 3260, 3671, 3165, 3538, 3300 | Centrales Denwa, internet compartido/en Pasip; para 3300, “Enlace” y área de telecomunicaciones en el registro completo |
| 104 | 3265, 3348, 3451, 3449, 3547 | Web/hosting, web service, e-commerce, módulo web y sistema de gestión de riego |
| 106 | 3320 | El título describe asesoramiento e integración de datos de gestión |
| 107 | 3582, 3214, 3209 | Las fichas de Cela/Gani/Allex quedan vinculadas a registros completos que identifican SDI; el cruce de Allex también coincide en cliente normalizado y fecha de inicio SGI: 2022-08-11 |
| 108 | 3382, 3674, 3669 | Luminarias e iluminación |

El cruce de 3209 es particularmente verificable: el snapshot dice “Cambio de central” para Allex S.A.; SGI registra inicio 2022-08-11, igual a la fecha del registro completo 11082 (“Allex SA - SDI”, “Allex SA - Cambio de central”). El cruce de 3214 usa el mismo patrón para Gani: inicio SGI y registro 11088 coinciden el 2022-09-09. El registro completo 11190 y SGI también coinciden el 2025-02-25 para la placa de lazo LCM320 de Cela.

## Sectores recuperables

El snapshot contiene tres fichas cuyo texto de descripción nombra una municipalidad, pero el resumen vivo de Directus las sirve con el marcador `Cliente Confidencial` y una plantilla genérica. El helper no recibe el campo Cliente ni usa la evidencia obsoleta del snapshot para reemplazar texto vivo; por eso no aplica esas asignaciones y la auditoría real conserva 155 fichas sin sector.

| Ficha | Evidencia presente en snapshot | Resultado con Directus vivo |
|---:|---|---|
| 3633 | Mención de municipalidad en la descripción | Sin sector; el resumen vivo no conserva la mención |
| 3669 | Mención de municipalidad en la descripción | Sin sector; el resumen vivo no conserva la mención |
| 3541 | Mención de municipalidad en la descripción | Sin sector; el resumen vivo no conserva la mención |

No se aplicó sector a ninguna de estas tres fichas en runtime. El corte real mantiene la distribución observada: 88 fichas tienen `Cliente Confidencial`, seguidas por Cela S.A. (23), Procon S.R.L. (9), Eqalq S.R.L. (3), Flexcolor S.R.L. (3), Fuente Mayor S.A. (3), Luna Maya (2), Allex S.A. (2), Gani S.A. (2) y Marsch S.A. (2). No se asignó sector en bloque por cliente.

## Pendientes sin evidencia suficiente

- **Descripción:** la bandera actual cubre 91 resúmenes de menos de 60 caracteres; es un filtro de longitud, no una evaluación manual de si el texto resulta suficiente. El registro SGI 9001 no trae alcance; para la mayoría, snapshot y ficha repetida no aportan una ejecución más detallada. `relato.ts` ya consume los cruces de descripción completos documentados. No se expandieron títulos ni plantillas para aparentar más alcance.
- **Sector:** la auditoría real mantiene 155 sin sector. Las tres menciones en snapshot no llegan en el resumen vivo. La ficha 3582 (Cela), por ejemplo, nombra una placa LCM320 pero el texto no ubica el sitio; los trabajos de Cela en el Sheraton no prueban que esta placa pertenezca a ese lugar. Tampoco se toma “corrientes débiles” como categoría sectorial.
- **Servicio:** el top 20 del corte deja sin resolución 9001, 3587, 3147, 3215, 3163, 3241 y 3242. En 3587, “configuración de llaveros” no especifica control de acceso; 3147/3163/3241 solo dicen corrientes débiles; 3215 no identifica qué tipo de central es; 3242 solo nombra insumos informáticos. El 3163 no se asignó a SDI porque el snapshot/SGI y el registro completo 11084 no comparten fecha de inicio.
- **Fotografía de obra:** la bandera `sin-foto-propia` se determina por la ruta del recurso (`/images/antecedentes/`), no por inspección visual ni verificación de autenticidad. 9001 no tiene foto de obra, detalle de alcance ni servicio en la fuente local. SGI solo aporta título, cliente, sector y fechas 2026-07-01 a 2026-12-31. 9002 sí tiene un alcance de alojamiento/mantenimiento/desarrollo web y códigos 104/105. Las imágenes editoriales que acompañan estas obras en curso deben llevar rótulo de contexto y no presentarse como registro fotográfico del proyecto.

Prueba específica: `npm test -- --runInBand __tests__/catalogEditorial.test.js` (5 pruebas). La prueba verifica evidencia contra los snapshots de origen, los registros completos vinculados y la fecha exacta de SGI para Allex.
