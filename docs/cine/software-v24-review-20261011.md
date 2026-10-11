# Software v24 · continuidad del cierre

La v23 completa mostró un vacío visual durante el retorno del registro a la interfaz, especialmente en móvil. V24 mantiene el registro visible hasta que el producto recupera presencia. El cambio actúa sólo desde el fotograma 960; la geometría, fuentes, colores y los primeros 960 fotogramas por composición se conservan exactamente.

El autor verifica el SHA-256 de la fuente v23 antes de delegar. El ensamblador conserva la procedencia real de los 64 fragmentos reutilizados y exige la fuente v24 y su base para los 16 fragmentos nuevos. El manifiesto documenta cada rango. No se renombra la procedencia de fotogramas antiguos ni se mezclan fuentes desconocidas.

La auditoría de encuadre y superposición de texto pasó en ambas composiciones a lo largo de los 1.200 fotogramas. Falta la prueba nativa del relevo, el cálculo del cierre y la revisión de las películas completas integradas. La preview continúa en v23 mientras se completa esa validación.
