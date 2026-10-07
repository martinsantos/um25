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

Las seis maquetas sectoriales mantienen el proyecto completo y añaden efectos vectoriales situados sobre los equipos: cobertura y mosaico de video, aviso y verificación en la central, indicador de respaldo en la UPS, filas de trabajo que avanzan en la consola y confirmación de los puntos de red. Consultoría señala el perímetro del relevamiento. Telecomunicaciones conserva el transporte por su enlace. La etapa intermedia se acerca al dispositivo protagonista sin sacarlo de la maqueta; telecomunicaciones conserva los dos extremos del enlace. Las tres etapas autónomas continúan sin interacción. Los estados se apagan al pasar a otro servicio y respetan movimiento reducido.

## Precisión de la isometría

La revisión de los primeros planos reveló que el orden por centroide de las caras ocultaba módulos pequeños detrás de la carcasa del gabinete. El generador ahora compara la profundidad en el área de superposición y ordena las caras antes de dibujarlas. Una regresión sobre las seis maquetas verifica que los puertos queden delante de su carcasa. Los recorridos se descomponen en tramos ortogonales, también verificados por prueba; se eliminan las diagonales arbitrarias. Estas operaciones ocurren al generar el SVG, sin cargar cómputo extra al navegador.

## Validación en curso

- `npm run check` pasó lint, tipos, auditoría CSS, 66 suites y 518 pruebas, además del build, en `ef55428e`.
- La auditoría remota `37556051386` comprueba la secuencia en Chrome escritorio/móvil y los anchos del contrato; incluye conservación del corte hasta la intervención y los estados recibido/asignado/intervención/verificado/cerrado. Terminó correctamente en ambos perfiles y en las 20 combinaciones de WebKit. Se inspeccionaron las capturas y la secuencia móvil; esa revisión detectó la cartela superpuesta y motivó su eliminación.
- La composición corregida y los textos breves se verifican en `37557355117`, commit `3e39599c`.
- La integración completa de dispositivos, profundidad y video pasó `npm run check`: 66 suites / 524 pruebas y build. Las auditorías `37557798673` y `37558397771` se cancelaron al descubrir y corregir los problemas de encuadre y profundidad; no constituyen validaciones finales.
- La matriz anterior de 20 rutas corresponde a la versión previa y está documentada en `continuous-operation-20261006.md`; no se presenta como evidencia de esta nueva narración.

## Piloto cinematográfico Blender

Se preparó `render-site-project-v2.py` con una aproximación continua de 18 segundos, materiales grafito/acero, iluminación de estudio y énfasis en un circuito. La primera prueba remota de tres fotogramas (`37556053716`) dejó visibles tanques facetados y conexiones diagonales. Se corrigieron en `cad2b59b`: superficies cilíndricas suavizadas, trazado de red por bandeja y bajadas verticales, juntas de depósitos, escaleras y pequeños elementos del gabinete. La segunda prueba `37556554471` terminó correctamente y se inspeccionaron sus fotogramas. El render completo de bodega `37557238682` terminó correctamente: 432 fotogramas, 24 fps, 18 segundos, 1920 × 1080, Cycles con 16 muestras. Se inspeccionaron apertura, acercamiento, máximo detalle, regreso y cierre, junto al recorte móvil. El MP4 horizontal ocupa 4.921.795 bytes; las seis variantes de video/póster, 8.586.112 bytes en total. La diferencia absoluta media entre primer y último fotograma decodificado es 0,327 niveles sobre 255; la cámara vuelve a su posición inicial.

La película está importada como `bodega-proyecto-v4` y seleccionada por el registro de Bodegas y el servicio 107. No se reemplaza ningún asset publicado. La película grande original de la home se conserva. La reproducción web del medio nuevo se comprueba por separado de la matriz de isometrías.

No hay despliegue a producción en esta iteración. No se modifican la campaña protegida, CMS, infraestructura del servidor ni tipografía global.
