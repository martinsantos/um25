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

## Validación terminada

- `npm run check` pasó lint, tipos, auditoría CSS, 66 suites y 518 pruebas, además del build, en `ef55428e`.
- La auditoría remota `37556051386` comprueba la secuencia en Chrome escritorio/móvil y los anchos del contrato; incluye conservación del corte hasta la intervención y los estados recibido/asignado/intervención/verificado/cerrado. Terminó correctamente en ambos perfiles y en las 20 combinaciones de WebKit. Se inspeccionaron las capturas y la secuencia móvil; esa revisión detectó la cartela superpuesta y motivó su eliminación.
- La composición corregida y los textos breves pasaron `37557355117`, commit `3e39599c`, en Chrome escritorio/móvil y 20 combinaciones de WebKit.
- La integración completa de dispositivos, profundidad y video pasó `npm run check`: 66 suites / 524 pruebas y build. Las auditorías `37557798673` y `37558397771` se cancelaron al descubrir y corregir los problemas de encuadre y profundidad; no constituyen validaciones finales.
- `37559290210`, commit `7d168d94`: 20 rutas en Chrome escritorio y móvil, 20 películas reproduciéndose por perfil, servicios previstos visitados sin clics, cero errores de ejecución y cero hallazgos funcionales. Se inspeccionaron capturas de las veinte rutas.
- La revisión del piloto detectó después un gabinete recortado en móvil y rótulos que crecían con el zoom. El encuadre ahora usa límites geométricos del dispositivo; los rótulos conservan 16 px de lectura y los marcadores no tapan sus pantallas. La auditoría incluye una medición que rechaza equipos fuera de cuadro. Pase de encuadres `37560835964`, commit `40d119dd`; pase final de marcadores `37561106925`, commit `623f5852`. Ambos terminaron correctamente, con cero hallazgos. El primero incluye los ocho servicios de la home, Bodegas, servicio 107 y 20 combinaciones de WebKit; el segundo confirma el último ajuste de marcadores y reproducción del video en escritorio/móvil. Se inspeccionaron las capturas finales del gabinete completo y de la central, con rótulos de tamaño constante. WebKit Linux no sustituye una prueba en Safari físico.
- La matriz anterior de 20 rutas corresponde a la versión previa y está documentada en `continuous-operation-20261006.md`; no se presenta como evidencia de esta nueva narración.

## Piloto cinematográfico Blender

Se preparó `render-site-project-v2.py` con una aproximación continua de 18 segundos, materiales grafito/acero, iluminación de estudio y énfasis en un circuito. La primera prueba remota de tres fotogramas (`37556053716`) dejó visibles tanques facetados y conexiones diagonales. Se corrigieron en `cad2b59b`: superficies cilíndricas suavizadas, trazado de red por bandeja y bajadas verticales, juntas de depósitos, escaleras y pequeños elementos del gabinete. La segunda prueba `37556554471` terminó correctamente y se inspeccionaron sus fotogramas. El render completo de bodega `37557238682` terminó correctamente: 432 fotogramas, 24 fps, 18 segundos, 1920 × 1080, Cycles con 16 muestras. Se inspeccionaron apertura, acercamiento, máximo detalle, regreso y cierre, junto al recorte móvil. El MP4 horizontal ocupa 4.921.795 bytes; las seis variantes de video/póster, 8.586.112 bytes en total. La diferencia absoluta media entre primer y último fotograma decodificado es 0,327 niveles sobre 255; la cámara vuelve a su posición inicial.

La película está importada como `bodega-proyecto-v4` y seleccionada por el registro de Bodegas y el servicio 107. No se reemplaza ningún asset publicado. La película grande original de la home se conserva. La reproducción web del medio nuevo pasó `37559937756`, commit `4bd057de`: Bodegas y servicio 107 en escritorio y móvil, reproducción automática y cero hallazgos.

No hay despliegue a producción en esta iteración. No se modifican la campaña protegida, CMS, infraestructura del servidor ni tipografía global.


## Entrega de la revisión

Preview integrada: `http://127.0.0.1:4326/` y `/bodegas`. Evidencia conservada en el directorio `causal-operation-20261006` de las visualizaciones del hilo: informes de veinte rutas, cierre de encuadres, WebKit, capturas y grabaciones. El código final pasó los checks del PR: build, pruebas, lint y comparación de la campaña protegida. El guard de rutas scoped se evaluó contra los archivos del PR y no detectó rutas fuera de alcance ni assets públicos modificados respecto de la base.

Esta entrega renueva la película de Bodegas; las películas de los otros proyectos se conservan. La validación documentada cubre funcionamiento, geometría, legibilidad y revisión visual de esta versión. No acredita superioridad frente a todos los sitios del mundo ni reemplaza la verificación de infraestructura necesaria para publicar.
