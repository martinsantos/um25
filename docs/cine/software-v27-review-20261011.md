# Software v27 · variedad, densidad y profundidad

La escena conserva una sola operación: aprobar la orden 0248 del proyecto P-104. El recorrido abre el producto, comprueba identidad y permisos, muestra el contrato de integración, registra el cambio y devuelve el resultado al equipo.

## Cambios visuales

- Directorio con tres personas, alcance, roles, estados y selección de fila.
- Selector contextual de proyecto en un plano posterior independiente.
- Navegador de seis conectores con símbolos propios, descripciones, interruptores y capacidades.
- Barra de búsqueda y vinculación sobre el contrato; payload tipado en otro plano y respuesta con la misma identidad 0248-A.
- Historial de versiones, índice de registros relacionados y comprobante con mayor separación física, perforación y código visual.
- Sombras discretas bajo los planos nuevos y bordes de menor contraste. Las superficies de lectura conservan contraste; la transparencia permite seguir las conexiones.
- Cámara próxima durante la lectura, con apertura y cierre completos. La composición cuadrada omite paneles laterales secundarios y conserva los mecanismos principales.

La imagen y el mapa pertenecen a una vista demostrativa. No se presentan como datos de un cliente ni como una topología real.

## Comprobación antes de la secuencia

Prueba nativa: https://github.com/martinsantos/um25/actions/runs/38178182249, fuente `0137d4b8`. Se revisaron apertura, permisos, contrato y registro en 3840 × 2160 y 2160 × 2160. La prueba reveló recorte en la etiqueta superior del registro: corregido aumentando sólo el margen de ese plano. La apertura recupera el encuadre completo.

La fuente corregida `a15ad213` se procesó en https://github.com/martinsantos/um25/actions/runs/38178416437. La secuencia completa se divide en 80 segmentos de 30 fotogramas, con fuentes comprobadas antes del ensamblado. Blender se ejecuta únicamente en GitHub Actions. Los intermedios se guardan en SDTERA.

La proyección comprueba 321 combinaciones de composición y rótulo a lo largo de 1.200 fotogramas por composición, incluyendo las medidas creadas durante el render. No hay rótulos activos fuera del cuadro. La revisión de intersecciones no detecta cruces de texto activo en ambas composiciones. La ruta de tránsito se revisó contra los textos de la composición horizontal; su segundo tramo aparece después de validar el contrato, evitando atravesar el equipo.

Pruebas de reproducción y selección de medios: 75. Pruebas específicas de Software: 7. Typecheck correcto. Lint: cero errores y diez advertencias preexistentes. Estas comprobaciones funcionales no sustituyen la comparación visual.

## Segunda corrección: escala del mecanismo y revelación del contexto

La primera comparación temporal con Hill mostró que el conjunto tenía más variedad, pero el mecanismo principal seguía ocupando poco cuadro. v27 conserva los componentes y acerca la cámara en permisos, contrato y registro. El contexto secundario se revela durante la retirada de cámara: primero se lee el mecanismo, después su relación con el equipo, las integraciones o el historial.

Prueba nativa v27: https://github.com/martinsantos/um25/actions/runs/38180035472. Se inspeccionaron los fotogramas 240, 330, 540 y 870 a 3840 × 2160. La proyección recorre 322 combinaciones de rótulo y composición durante los 1.200 fotogramas, sin rótulos activos fuera del cuadro ni cruces entre textos. La ruta horizontal conserva el paso libre.

Secuencia horizontal completa: https://github.com/martinsantos/um25/actions/runs/38180440150, fuente `a334e802`. Son 20 segmentos de 60 fotogramas nativos, ensamblados sin reescalado ni interpolación. El texto del payload se corrigió a «Esquema tipado», porque la aparición del panel precede a la validación.

La revisión de la película móvil completa de v26 detectó que, aunque ningún rótulo se cortaba, el mecanismo de permisos quedaba demasiado pequeño. Se descartó conservar esa cámara. `render-software-v27-mobile.py` lleva el acercamiento y la revelación gradual del contexto a la composición cuadrada nativa. El relevo hacia el contrato empieza más tarde para no cortar la placa saliente de permisos. No se recorta ni se amplía el vídeo anterior.

Prueba móvil nativa: https://github.com/martinsantos/um25/actions/runs/38181861156, fuente `6034acae`. La prueba mostró un margen demasiado estrecho en el contrato; se alejó ligeramente sólo ese acercamiento. La fuente final `b4bf1337` se renderizó en https://github.com/martinsantos/um25/actions/runs/38182065770. Encuadre, intersección entre textos y tránsito de las conexiones volvieron a comprobarse antes de enviar la secuencia.

## Comparación de la secuencia horizontal completa

Se ensamblaron y decodificaron los 1.200 fotogramas: 3840 × 2160, 60 fps, 20 segundos. El contenedor conserva H.264, BT.709, transferencia sRGB y comienzo rápido. Se revisó la reproducción junto al original de [David Hill](https://x.com/iamdavidhill/status/2107616166713655476), con ambos vídeos a la misma anchura y velocidad real. Se inspeccionaron también escenas equivalentes por separado; la duración distinta de ambos vídeos no se utilizó para comparar una escena con la placa final de la referencia.

| Criterio | Resultado comprobado en v27 |
| --- | --- |
| Variedad | Marca propia, fotografía del proyecto, mapa, directorio, permisos, seis conectores, contrato tipado, respuesta, historial e índice. Los componentes tienen funciones y siluetas distintas. |
| Jerarquía | La cámara se acerca al mecanismo principal antes de mostrar el contexto lateral. Rótulos, controles y conexiones conservan pesos diferentes. |
| Profundidad | Las placas, campos y comprobantes están separados en el espacio. Las conexiones conservan su recorrido detrás de superficies selectivamente transparentes. |
| Movimiento | La medición de cajas, las etiquetas y los estados acompañan a una sola aprobación. La cámara cambia de perspectiva con continuidad y termina regresando a la interfaz. |
| Relato | La misma orden 0248 y el proyecto P-104 atraviesan identidad, alcance, contrato, registro y respuesta. Las explicaciones se sincronizan con el tiempo del vídeo. |

La comparación provocó dos correcciones concretas: mayor proximidad del mecanismo en escritorio y un nuevo encuadre móvil tras descartar la cámara anterior. Ninguna puntuación porcentual se presenta como medida de calidad. Las capturas comparativas con el material de Hill se conservan sólo en la revisión local; el repositorio no redistribuye su vídeo.

## Integración final

Ambas películas están completas y verificadas: 1.200 fotogramas nativos por composición, 20 segundos a 60 fps. La horizontal mide 3840 × 2160; la cuadrada, 2160 × 2160, con cámara propia. El importador comprobó fuentes, segmentos, decodificación completa y hashes antes de incorporar los seis medios inmutables. Total: 60.208.549 bytes; los vídeos ocupan 38.123.900 y 21.056.683 bytes.

El build final pasó en 17,23 segundos. Pasaron 82 pruebas, typecheck y lint (cero errores, diez advertencias preexistentes). `/software` y la ficha 104 responden 200 y seleccionan v27; ambos vídeos responden 206 a solicitudes de rango. La preview local se reinició con `UM_SOFTWARE_REVIEW=v27`.

En Chrome se observó la reproducción completa integrada, el avance automático, la sincronización de capítulos, la pausa voluntaria, la reanudación y el regreso al comienzo. A 390 × 844 ambas rutas seleccionaron el vídeo cuadrado, avanzaron automáticamente y no presentaron desborde horizontal. Los fotogramas nativos móviles se revisaron por separado. La herramienta de captura móvil devolvió dimensiones inconsistentes, por lo que esas capturas no se aceptan como prueba visual del encuadre integrado. Al cerrar la revisión, la extensión de Chrome exigió actualizarse; la preview del navegador integrado se recargó por su control independiente.

La captura de escritorio y las verificaciones reproducibles están en `software-v27-evidence/`. Los fotogramas de Hill permanecen fuera del repositorio público. La comparación sirve para corregir jerarquía, escala, detalle y movimiento; no acredita una equivalencia objetiva ni una calidad «indistinguible».

El registro de producción permanece intacto. No hubo despliegue ni merge.
