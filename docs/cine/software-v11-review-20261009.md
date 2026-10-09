# Software v11 · revisión visual y de integración

## Estado: dirección descartada

La comparación final y la corrección del usuario rechazan v11 como banner final: la continuidad de los fondos blancos absorbe las líneas posteriores; las elevaciones son demasiado cortas; la cámara describe pantallas inclinadas sin atravesar una arquitectura. La resolución nativa y los detalles de UI no resuelven esa deficiencia. No se importa ni se promueve. Se canceló la recuperación remota restante 37958620725. Se conserva la secuencia de escritorio únicamente como evidencia.

La siguiente prueba v12 elimina el lienzo continuo, separa regiones reales en profundidad, registra sus extremos con líneas finas, sitúa contrato y datos detrás de planos transparentes y utiliza una cámara perspectiva que cruza el eje. La prueba no acredita aceptación artística ni autoriza publicación.

## Alcance

La película candidata recorre una misma orden: interfaz y permisos → contrato de integración → relaciones y transacción → infraestructura y publicación → resultado en el producto. Las dos composiciones tienen 960 cuadros / 16 segundos / 60 fps; escritorio 3840 × 2160, móvil 2160 × 2160. El registro de producción permanece sin promoción. La selección de preview requiere `UM_SOFTWARE_REVIEW=v11` y una importación validada.

La isometría v6 representa la misma orden 0248 con seis mecanismos diferentes. Un contrato muestra los campos de origen y destino; los datos muestran claves y relaciones; la publicación tiene pruebas, artefacto y despliegue; la operación separa solicitudes de versiones. En móvil, los permisos reciben acercamientos automáticos individuales. El texto contiguo explica el efecto de cada capa.

## Descartes internos

1. Run 37952227697: descartado. Encabezados ocultos por superficies mal ubicadas y aspecto de diagramas aislados.
2. Run 37953029924: descartado. Las láminas seguían pareciendo diapositivas inclinadas; se incorporó el contexto de una aplicación coherente.
3. Run 37953578762: corregido. Marco recortado y tabla elevada sobre el subtítulo. Se amplió el encuadre, se recolocó la tabla y se extendió la transparencia a integración, datos y procesos.
4. Run 37954478968: prueba de cuadros aprobada para producir la secuencia, no como aceptación artística final. Texto opaco sobre superficies translúcidas, comunicación visible bajo las láminas y encuadre corregido.
5. Isometría integrada: las hojas de permisos quedaban abiertas e invadían otros capítulos. Ahora se recogen al pasar al contrato; una prueba verifica esa regresión. Los extremos de sus anclajes siguen la pieza y conservan la base.
6. Isometría integrada: transición demasiado oscura mientras la cámara viajaba. El énfasis visual ahora acompaña el movimiento; los acercamientos internos de permisos conservan su contraste.
7. Móvil: explicación demasiado extensa separaba texto e imagen. Se redujo la narración y se ajustó el alto del lienzo al espacio disponible, conservando el SVG vectorial.

## Evidencia

- Secuencia completa: run 37954872583, fuente d2a385be. Ensamblado, importación y reproducción integrada pendientes al escribir esta sección.
- Autoría del render validada: 255 textos y 154 superficies; se rechaza texto cubierto por geometría de su propio grupo. Esta prueba no detecta por sí sola todas las oclusiones entre grupos: se revisaron los cuadros.
- 60 pruebas de software, carga diferida, cámara y reproducción pasaron. Las dos regresiones añadidas verifican anclajes móviles y cierre de permisos.
- ESLint de los componentes y datos modificados, typecheck y build pasaron.
- Referencias contrastadas: [Hill](https://x.com/iamdavidhill/status/2107616166713655476), [Ryan](https://x.com/wheresryan22/status/2106439475551154186), [Solvaix](https://x.com/Solvaix/status/2106830508797706560).
- Archivo de pruebas propias: `/Volumes/SDTERA/Codex UM25 audits/20261009/software-v11/`.

## Criterio de aceptación

No se confunde resolución con riqueza visual ni 60 fps con fluidez demostrada. La aceptación de la secuencia requiere verla completa, revisar los cortes y el bucle, confirmar narración sincronizada y probar los dos encuadres. Esta revisión de Software no acredita paridad de otros sectores con Solvaix ni una calidad indistinguible de Ryan para todas las isometrías. No se ha desplegado a producción.
