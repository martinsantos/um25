# Software v19 · jerarquía, profundidad y recorrido continuo

## Comparación que dispara esta iteración

Se vuelven a revisar los fotogramas originales y el vídeo de [David Hill](https://x.com/iamdavidhill/status/2107616166713655476), frente a v18 y pruebas nativas de v19. El criterio es el resultado visible: siluetas y planos legibles, información reconocible, contraste localizado, detalle funcional y continuidad entre mecanismos. Ryan y Solvaix siguen siendo referencias del conjunto; esta entrega se limita a la película de software.

v18 no supera esa comparación. Conserva demasiado tinte azul uniforme, sus controles secundarios tienen poco peso, la cámara frena en cada clave y se aleja demasiado entre mecanismos. La corrección no consiste en añadir más rectángulos.

## Correcciones implementadas

- Trayectoria cúbica que conserva velocidad entre claves, con un relevo espacial más cercano entre permisos, contrato y registro. El principio y el final coinciden para cerrar el bucle.
- Fondo carbón y superficies con contraste diferenciado. El vidrio inactivo baja de intensidad para no formar bandas sobre el contenido protagonista.
- Cotas, portadores de etiquetas y nodos de selección más claros, con jerarquía entre contenido, medición y conexiones.
- Contrato con destinos ERP, API y CRM diferenciados; registro con eventos, horarios, huella y confirmación de integridad progresivos.
- Identidad y permisos conservan la marca vectorial original, el mapa y la imagen del proyecto. Se elimina un escudo redundante que se superponía al wordmark y se colocan los avatares dentro de la cabecera de permisos.
- El tilde y la leyenda de integridad aparecen con el evento de confirmación, no antes. No se utiliza un glifo de check ausente en la fuente.
- La transparencia queda en las superficies: los glifos conservan contornos opacos y disminuyen su intensidad de forma continua durante los relevos.
- Composición nativa cuadrada para móvil; selección aislada mediante `UM_SOFTWARE_REVIEW=v19`.

## Producción y pruebas

Blender se ejecuta exclusivamente en workers remotos. No se inicia Blender ni se renderizan fotogramas en el Mac.

- Autor final: `c1372cd3`.
- Pruebas iniciales: `38019784623`.
- Prueba de movimiento nativo: `38019786445`.
- Revisión de permisos: `38019881772`.
- Pruebas de contraste y limpieza: `38020166636`. Siete fotogramas completados; un worker falló al cerrar Blender después de guardar el PNG. Se corrige la recuperación: sólo se admite ese código de cierre si los metadatos cubren todos los fotogramas y cada PNG se decodifica con sus dimensiones nativas.
- Secuencia final: `38020361877`, 40 fragmentos de 60 fotogramas. 3.840 × 2.160 y 2.160 × 2.160; 1.200 fotogramas y 20 segundos por composición, a 60 fps.
- Auditoría geométrica: 168 combinaciones texto/composición visibles se mantienen dentro del cuadro en las 1.200 posiciones. No certifica oclusión ni acabado artístico por sí sola.
- 74 pruebas relevantes correctas, typecheck correcto. Lint completo: cero errores y diez advertencias preexistentes.

## Revisión temporal y correcciones acotadas

La primera mitad ensamblada descubrió un intervalo de estructura vacía al entrar en permisos. La primera corrección recuperó el texto del listado, pero se rechazó porque el inspector posterior seguía demasiado visible. La corrección definitiva conserva el listado y retira antes superficies y contornos del inspector.

En el regreso, la revisión encontró planos que aparecían antes que sus textos. Ahora el listado mantiene el hilo y los demás paneles regresan junto con su contenido. La procedencia de estas correcciones queda separada del autor base inmutable: adaptador `render-software-system-v19-handover.py`, revisión visual `df71e30e`, rangos 120–299 y 1020–1139. Fuera de esos intervalos no cambia la trayectoria ni el contenido.

Pruebas nativas de los relevos: `38021623571`, `38021824008`, `38021898110`; selección final de ambos cruces en escritorio y móvil: `38022049936`. La validación verifica que el relevo conserve contenido legible y que el inspector deje de competir con los permisos. Una prueba con un umbral de contraste fallido se canceló antes de aceptar su resultado.

Los renders definitivos de los relevos son `38022470651` y `38022472297`. Usan fragmentos de 30 fotogramas para reducir la espera aprovechando los workers disponibles, sin bajar resolución ni interpolar imágenes. Las primeras tandas de corrección, `38022333196` y `38022335946`, se cancelaron al iniciar el cálculo para sustituirlas por esta distribución. El ensamblador requiere el hash exacto del adaptador y su rango en cada fragmento afectado; rechaza fuentes mezcladas.

La inspección del registro completo a 15,9 s detectó bordes posteriores atravesando la leyenda de integridad. El adaptador `render-software-system-v19-legend.py` incorpora un portador opaco delante de esos bordes y detrás de los glifos; pertenece al mismo evento de confirmación. Se verifica que esté ausente antes del evento y fuera del tramo corregido. Prueba nativa: `38023284369`. Renders: `38023483528`, rangos 900–1079. El portador deja visibles las capas alrededor sin imprimir sus bordes a través del texto.

## Entrega integrada y comprobación final

La secuencia final se ensambla con 54 fragmentos de procedencia verificada. Los seis activos nuevos suman 54.781.083 bytes; ambas películas tienen 1.200 fotogramas, 20 segundos y 60 fps nativos. La decodificación completa, las dimensiones y los hashes pasan. Los fotogramas primero y último tienen SSIM 0,993832; este dato sólo comprueba continuidad de imagen, no calidad artística.

Build de producción local con `UM_SOFTWARE_REVIEW=v19` correcto. `/software` y el servicio 104 responden 200 y seleccionan v19; ambas películas admiten peticiones Range 206. La previsualización integrada se reinicia con esa versión en el puerto 4326.

Chrome, 1.440 × 1.000 y 390 × 844: reproducción sin clic, pausa/reanudación y selección del vídeo nativo correspondiente verificadas. En móvil, después de la reanudación el reloj vuelve de 12,54 s a 2,56 s y la leyenda regresa al capítulo 01 sin intervención. No hay desbordamiento horizontal ni errores de consola capturados. Se revisan los relevos de 3 s y 17,8 s y el registro corregido a 15,9 s en el archivo ensamblado, junto al original de Hill. La inspección por capturas y estados temporales no equivale a una evaluación perceptual continua de todos los fotogramas ni a medir rendimiento en dispositivos físicos y redes móviles.

Evidencia integrada: [escritorio](software-v19-evidence/desktop.png) y [móvil](software-v19-evidence/mobile.png).

## Dictamen visual

Hay una mejora verificable en la continuidad del contenido, la separación de planos, la legibilidad de las leyendas y la función de cada mecanismo. Los defectos detectados durante esta revisión se corrigieron y los tramos resultantes se incorporaron a la película completa; no quedan como propuestas.

No se declara calidad indistinguible respecto de Hill. La referencia todavía presenta más variedad de controles y acentos, un protagonista mayor en algunos cruces y más luminosidad localizada. La v19 conserva intervalos de transición con un conjunto más pequeño y oscuro. La comparación de esta entrega corresponde al render de Software, no certifica equivalencia del resto de las isometrías con Ryan ni de los sectores con Solvaix. El PR continúa draft y no se despliega a producción.
