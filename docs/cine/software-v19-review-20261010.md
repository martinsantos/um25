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

## Cierre pendiente de la secuencia

La candidata no se declara equivalente ni se publica por haber superado pruebas técnicas. Falta completar la revisión temporal de la película ensamblada y comprobar su integración en navegador antes de cerrar esta entrega.
