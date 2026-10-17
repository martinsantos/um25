# Software v21 · controles y profundidad legible

## Referencia y decisiones

Comparación con el original de [David Hill](https://x.com/iamdavidhill/status/2107616166713655476) y la v20 integrada: Hill diferencia controles, identidad y contenido con mayor variedad local. El problema de v20 no era la cantidad de polígonos: los campos repetían una misma superficie y algunas capas competían con sus rótulos.

V21 incorpora símbolos específicos de carpeta, persona y orden; perfiles de permisos, seis celdas MFA, selector de enumeración, documento plegado, estados anterior/confirmado separados y marcas temporales por evento. El contrato separa físicamente origen y destino, con líneas que conservan esa profundidad. Reduce la opacidad acumulada y agrega un borde superior fino para distinguir planos.

El regreso retrasa la cabecera general hasta que sus planos vuelven a alinearse. Conserva marca, fotografía de proyecto y mapa, la cámara continua y las cotas ligadas a cada elemento. El recorrido sigue explicando una orden: interfaz → permiso → contrato → registro → interfaz.

## Pruebas nativas y correcciones

- Primera prueba: [38096124496](https://github.com/martinsantos/um25/actions/runs/38096124496), fuente `60046828`. Ocho imágenes nativas en dos composiciones. Reveló la cabecera SOLICITUD tapada por su campo elevado y una arista posterior cruzando el identificador del registro.
- Corrección: cabecera en el plano elevado y fondo opaco acotado detrás del identificador. Fuente `22291fe17040d0a52f11459a6fdbe2577e646122`.
- Segunda prueba: [38096346214](https://github.com/martinsantos/um25/actions/runs/38096346214), cuatro imágenes nativas (630/930, ancho/cuadrado). Las dos superposiciones quedan resueltas visualmente.
- Se descartó un acercamiento móvil que recortaba la etiqueta inferior: la composición cuadrada conserva su margen de encuadre.
- Secuencia completa: [38096542895](https://github.com/martinsantos/um25/actions/runs/38096542895). Blender remoto, 80 fragmentos de 30 fotogramas. Completada y ensamblada: 1.200 fotogramas nativos por composición, 20 segundos a 60 fps, H.264. Escritorio 3840 × 2160 (38.115.145 bytes); cuadrado 2160 × 2160 (20.207.553 bytes). Los seis activos, incluidos cuatro posters, suman 59.327.840 bytes.

## Validaciones de entrega · 11 de octubre de 2026

76 pruebas relevantes correctas; typecheck correcto; lint sin errores y diez advertencias preexistentes. Auditoría: 164 combinaciones de texto/composición dentro del encuadre en 1.200 posiciones. El ensamblador verificó los hashes de autor, adaptadores y activos originales, los 80 rangos de fotogramas, dimensiones, frecuencia, formato y decodificación completa de ambas secuencias. La importación agregó seis archivos nuevos con nombres v21.

El build de producción con `UM_SOFTWARE_REVIEW=v21` finalizó correctamente en 25,98 segundos. Las dos rutas responden HTTP 200 y seleccionan v21; ambos MP4 responden Range 206 para los primeros 1.024 bytes. La preview se reinició con esa bandera.

En Chrome, el escritorio de 1594 × 722 reproduce automáticamente la composición 3840 × 2160, sin error de video, errores de consola ni desborde horizontal. Se comprobó pausa y reanudación desde el control visible. En la emulación de 390 × 844, el video seleccionado fue el cuadrado 2160 × 2160, con reproducción autónoma y sin desborde horizontal en el DOM. Algunas capturas del emulador salieron deformadas y se descartaron: no constituyen prueba visual del móvil ni de un dispositivo físico.

## Alcance y criterio de aceptación

Esta iteración modifica el render de Software mediante `UM_SOFTWARE_REVIEW=v21` en `/software` y servicio 104. No modifica las isometrías ni certifica de nuevo los casos Ryan/Solvaix. El PR 266 sigue draft y producción no se despliega.

Los fotogramas prueban legibilidad en los instantes inspeccionados. La continuidad matemática, los checks y el número de píxeles no certifican equivalencia artística ni fluidez perceptual por sí solos. Se revisaron ambas secuencias ensambladas, fotogramas nativos de apertura, permisos, contrato, registro y retorno, además de la integración de escritorio y una comparación de reproducción a igual tamaño con Hill. Se observa mejor separación de planos y controles y desaparecen las dos superposiciones detectadas. Hill conserva mayor variedad y densidad de controles reconocibles dentro de cada pantalla; v21 todavía no alcanza equivalencia visual. La vista general y el cuadrado aún dependen de microtexto pequeño. No se declara GO a producción ni se presenta el cierre técnico como cierre artístico.

## Evidencia

- [Comparación a igual tamaño](evidence/software-v21/hill-comparison.png): Hill a 7,5 s y v21 a 5,5 s; mecanismos distintos, ambos legibles dentro del mismo contenedor.
- [Integración real de escritorio](evidence/software-v21/integrated-desktop.png): página y navegación; captura del contrato, con la parte inferior del banner fuera del viewport.
- [Composición cuadrada nativa a 4,5 s](evidence/software-v21/native-square-4.5s.png): imagen extraída del MP4 final; no es captura de navegador móvil.
