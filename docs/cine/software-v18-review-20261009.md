# Software v18 · contenido reconocible e inspección animada

## Dirección

La referencia de [David Hill](https://x.com/iamdavidhill/status/2107616166713655476) combina un producto reconocible con una inspección de su construcción: marca, contenido, tipografía, límites de componentes, medidas y capas que se separan. El atractivo depende de esa relación. Añadir rectángulos y desplazar la cámara no reproduce el resultado.

Se revisaron siete fotogramas del vídeo original y se reprodujo la referencia junto a una muestra nativa del candidato. Las referencias de [Ryan](https://x.com/wheresryan22/status/2106439475551154186) y [Solvaix](https://x.com/Solvaix/status/2106830508797706560) siguen orientando precisión de objetos y sistemas; esta iteración modifica exclusivamente la película de Software.

## Cambios

- Marca original a partir de los contornos del SVG del sitio. No se sustituye por letras UM ni por una fuente aproximada.
- Vista arquitectónica existente a color dentro de la interfaz, con proporción preservada. El proyecto y el mapa son demostrativos; no se presentan como fotografía o ubicación de un cliente real.
- Mapa con parcelas, parque, vías, agua, recorrido y marcador, asociado al alcance del proyecto P-104.
- Cotas y límites que se dibujan; etiquetas que se revelan progresivamente; cifras vinculadas a las dimensiones de los componentes en el sistema de coordenadas de la interfaz.
- Anotación tipográfica unida a la línea base del título. Contornos, cotas, conexiones y portadores de etiquetas tienen pesos distintos.
- Identidad, permisos y alcance con formas y profundidades diferenciadas. Una sola operación continúa hacia el contrato y el registro.
- Texto y trazos finos opacos, con variación continua de intensidad. El vidrio estructural conserva transparencia. Los trazos inactivos desaparecen para evitar ruido y siluetas oscuras.
- La cámara abre el encuadre durante los desplazamientos laterales y conserva el contexto antes de acercarse al siguiente mecanismo.

## Descartes a partir de pruebas nativas

La primera etiqueta ocupaba demasiado espacio y competía con el contenido; se ajustó su portador al texto. La primera imagen añadida repetía un dibujo de líneas; se sustituyó por una vista a color. El agua del mapa se había modelado como curva biselada y parecía un cable elevado; se convirtió en geometría plana. La etiqueta tipográfica rozaba el borde superior del encuadre ancho; se recolocó antes de iniciar la secuencia completa.

La revisión de la secuencia completa detectó contornos de la interfaz que cruzaban el texto del registro durante el regreso. Se elevó el plano activo junto con su cámara para conservar su encuadre, y se retrasó la reaparición de las cotas de la interfaz hasta que el registro deja de ser legible. La corrección está limitada a los fragmentos 930–1139 de ambas composiciones; se conservan los otros 66 fragmentos. Un adaptador con hash propio mantiene inmutable el autor original. Una segunda prueba descartó un intervalo demasiado oscuro al retrasar en exceso el regreso de los contornos. El cruce definitivo conserva estructura visible durante toda la transición; se verifica también esa condición en las 1.200 posiciones de la secuencia.

## Evidencia

- Autor congelado de la secuencia: `7074aa95`.
- Pruebas de contenido: `38004444702`; movimiento 60 fps: `38004447057`.
- Pruebas de composición, imagen a color y tipografía: `38004803083`.
- Corrección final del mapa y encuadre tipográfico: `38005096639`.
- Secuencia completa: `38005444600`.
- Prueba de profundidad del regreso: `38008836720`.
- Corrección de profundidad del regreso: `df258297`, renders `38009083447` y `38009085724`.
- Recuperación de un worker con timeout de descarga de paquetes: `38009665073`.
- Cruce continuo definitivo: `35d575c9`, render `38009780304`.
- Validación del autor: 1.200 posiciones de cámara, continuidad y orden causal correctos.
- Auditoría de encuadre: 144 combinaciones texto/composición dentro del cuadro a partir del 65 % de prominencia. No evalúa oclusión ni calidad estética por sí sola.
- 73 pruebas de integración, recorrido y ciclo de reproducción correctas.

## Comparación del resultado

Se comprueban rasgos concretos de la referencia, no una puntuación estética:

| Rasgo | Implementación v18 |
| --- | --- |
| Contenido reconocible | Wordmark original, vista a color, mapa y tabla de trabajo. |
| Inspección del diseño | Límites que se dibujan, cotas progresivas, anotación de familia/tamaño/peso sobre el título. |
| Perspectiva | Cámara cruzada, planos separados y apertura del encuadre entre mecanismos. |
| Transparencia selectiva | Contexto estructural detrás; texto del mecanismo activo libre de contornos que lo atraviesen. |
| Movimiento con significado | Una operación pasa por permisos, contrato y registro; cada etiqueta pertenece a la pieza que explica. |

La referencia tiene una densidad y variedad mayores de contenido e iconos de producto. v18 incorpora los elementos pedidos y mejora la lectura, pero esta revisión no acredita que el acabado sea indistinguible. La película narra una operación demostrativa de software de Última Milla, sin presentar esa interfaz como un producto comercial existente.

## Entrega

Candidata integrada en `http://127.0.0.1:4326/software` y en el servicio 104 con `UM_SOFTWARE_REVIEW=v18`. Compilación final correcta. Los seis archivos suman 53.397.470 bytes: películas ancha y cuadrada más sus posters JPEG/AVIF. Producción y las isometrías no se modifican.

La importación verifica la revisión exacta del autor, UI, geometría, activos visuales y ambos adaptadores del regreso; rechaza fragmentos mezclados y sobreescritura de archivos públicos existentes. Ambas salidas contienen 1.200 fotogramas y 20 segundos a 60 fps nativos, 3.840 × 2.160 y 2.160 × 2.160. Decodificación completa correcta. Blender se ejecutó exclusivamente en workers remotos.

### Revisión integrada

- Chrome, escritorio habitual y 1440 × 1000: reproducción automática; avance de las leyendas; pausa manual estable y reanudación; paso por el final y reinicio autónomo de la película.
- Chrome, 390 × 844: carga únicamente la composición 2160 × 2160, comienza sin clic, sin desbordamiento horizontal. El segundo vídeo permanece sin fuente hasta ser necesario.
- Sin errores ni advertencias de consola durante la comprobación. El tamaño de viewport temporal se restablece al terminar.
- HTTP 200 para `/software` y servicio 104; selección de v18 en ambos. HTTP 206 y rangos correctos para las dos películas y el poster AVIF.
- `npm run build`, `npm run typecheck`, 73 pruebas relevantes y auditoría de encuadre final: correctos.
- Capturas: [escritorio](software-v18-evidence/desktop.png) y [móvil](software-v18-evidence/mobile.png).

La comparación detectó y corrigió superposiciones y un cruce demasiado oscuro antes de importar. No se midió rendimiento en redes móviles reales ni se declara equivalencia artística indistinguible con las referencias. El PR continúa como candidato de revisión.
