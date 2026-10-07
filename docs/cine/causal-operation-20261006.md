# Continuidad operativa: un incidente de principio a fin

Esta iteración reemplaza la puesta en marcha de ocho escenas independientes por un único incidente eléctrico ilustrativo de 64 segundos. La historia mantiene el estado de la instalación entre servicios: el corte no desaparece cuando cambia el título.

| Momento | Evidencia visible |
| --- | --- |
| Preparación | Instalación completa y cargas previstas |
| Corte | Entrada interrumpida, puesto sin respaldo atenuado, UPS activa |
| Continuidad | Cámara y recorrido de video disponibles |
| Aviso | Comunicación con la supervisión remota |
| Asignación | Registro 024 y responsable de soporte |
| Intervención | Gabinete abierto; alimentación de respaldo todavía activa |
| Verificación | Entrada restablecida, comprobación independiente de los sistemas |
| Cierre | Alimentación habitual y caso documentado |

Los tres estados de infraestructura y el registro operativo permanecen visibles. La narración explica el dimensionamiento de autonomía y la integración configurada; es una simulación explicativa, no telemetría ni un caso real atribuido a un cliente. Los textos se acortaron para poder leerlos durante cada etapa de ocho segundos.

Implementación: `RequestSequence.astro`, `requestSequence.ts`, controlador público versionado `request-sequence-v4.js`, geometría `request-operation-v3.svg` generada por `build-request-operation-v3.py`. Se conservan las pausas por visibilidad, pestaña, elección explícita y movimiento reducido. Los detalles de equipos siguen disponibles en la biblioteca de servicios.

## Integración en servicios y sectores

Las seis maquetas sectoriales mantienen el proyecto completo y añaden efectos vectoriales situados sobre los equipos: cobertura y mosaico de video, aviso y verificación en la central, indicador de respaldo en la UPS, filas de trabajo que avanzan en la consola y confirmación de los puntos de red. Consultoría señala el perímetro del relevamiento. Telecomunicaciones conserva el transporte por su enlace. Las tres etapas autónomas continúan sin interacción. Los estados se apagan al pasar a otro servicio y respetan movimiento reducido.

## Validación en curso

- `npm run check` pasó lint, tipos, auditoría CSS, 66 suites y 518 pruebas, además del build, en `ef55428e`.
- La auditoría remota `37556051386` comprueba la secuencia en Chrome escritorio/móvil y los anchos del contrato; incluye conservación del corte hasta la intervención y los estados recibido/asignado/intervención/verificado/cerrado. Terminó correctamente en ambos perfiles y en las 20 combinaciones de WebKit. Se inspeccionaron las capturas y la secuencia móvil; esa revisión detectó la cartela superpuesta y motivó su eliminación.
- La composición corregida y los textos breves se verifican en `37557355117`, commit `3e39599c`.
- Las nuevas respuestas sobre dispositivos pasaron `npm run check`: 66 suites / 518 pruebas y build. La matriz de 20 rutas se ejecuta en `37557798673`, commit `355f9648`.
- La matriz anterior de 20 rutas corresponde a la versión previa y está documentada en `continuous-operation-20261006.md`; no se presenta como evidencia de esta nueva narración.

## Piloto cinematográfico Blender

Se preparó `render-site-project-v2.py` con una aproximación continua de 18 segundos, materiales grafito/acero, iluminación de estudio y énfasis en un circuito. La primera prueba remota de tres fotogramas (`37556053716`) dejó visibles tanques facetados y conexiones diagonales. Se corrigieron en `cad2b59b`: superficies cilíndricas suavizadas, trazado de red por bandeja y bajadas verticales, juntas de depósitos, escaleras y pequeños elementos del gabinete. La segunda prueba `37556554471` terminó correctamente y se inspeccionaron sus fotogramas. Se inició un único render completo, bodega, en `37557238682`; no un lote de sectores.

La importación preparada usa nombres nuevos `bodega-proyecto-v4`; no se reemplaza ningún asset publicado. Hasta que se evalúe e integre una película completa, las películas actuales siguen siendo las que reproduce el sitio. La película grande original de la home se conserva.

No hay despliegue a producción en esta iteración. No se modifican la campaña protegida, CMS, infraestructura del servidor ni tipografía global.
