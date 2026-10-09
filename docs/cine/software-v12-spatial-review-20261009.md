# Software · profundidad, transparencia y punto de vista

## Decisión visual

La observación del usuario corrige la dirección de producción: la referencia se sostiene en sus contornos, perspectiva, transparencia y punto de vista cruzado. La v11 hacía grandes superficies blancas con elevaciones cortas; más resolución o texto no corregían ese problema. Se descartó su promoción y se canceló la recuperación remota pendiente.

La v12 conserva una aplicación original de ejemplo, pero elimina el tablero continuo. Sus regiones se separan en profundidad, mantienen anclajes a su posición de origen y permiten ver el contrato y el registro detrás. La cámara perspectiva de 48 mm cruza el eje; las proporciones de los componentes se conservan. La solicitud 0248-A conecta las mismas capas durante el recorrido. Los textos secundarios pierden énfasis al inspeccionar otra capa, mientras siguen visibles sus contornos y conexiones.

## Revisión de cuadros y descartes

- `37960051509`: primera prueba espacial. Se rechazó la doble lectura de textos superpuestos, aunque la profundidad y el cruce de cámara eran visibles.
- `37960578541`: se recolocó el permiso elevado y se redujo el énfasis de textos posteriores. Se detectó que el plano inicial todavía recortaba extremos.
- `37961009785`: plano inicial completo, con margen y el mismo encuadre al cerrar el bucle.
- `37961159316`: se limpió la lectura de contrato y registro conservando los caminos detrás de las láminas.
- `37961687052`: seis pruebas nativas: planos general, permiso y reverso; 3840 × 2160 y 2160 × 2160. El móvil tiene encuadre propio.
- `37960973464`: ensayo inicial, ocho cuadros a 24 muestras: ~53 s/cuadro después del primero.
- `37961852844`: ocho cuadros nativos a ocho muestras, manteniendo la escena durante la animación: ~18,4 s/cuadro después del primero. Comparación del mismo cuadro 624 a 24 y ocho muestras: SSIM 0,999709. Esta comparación sólo controla el cambio de antialiasing; no mide equivalencia estética con una referencia.
- Secuencia candidata: `37963354136`, 960 cuadros por composición, 60 fps, sin interpolación de movimiento ni escalado de salida. Revisión completa pendiente al escribir este apartado.

## Isometría

Se unificaron los materiales de los seis mecanismos de Software: interfaz, permisos, contrato, datos, publicación y operación. Las superficies conservan líneas finas de construcción; el detalle de una orden se eleva sobre su aplicación y mantiene anclajes. Los permisos muestran el recorrido debajo de las láminas. Sus contenidos se separan al abrirse, evitando que se mezclen cuando están cerradas. Los campos del formulario tienen contraste local y la aplicación posterior pierde énfasis durante la inspección.

La representación sigue siendo vectorial. No se redujo resolución ni se agregaron bibliotecas 3D al navegador. El recorrido sigue automáticamente al entrar en pantalla y conserva pausa, reanudación y movimiento reducido.

## Límites de esta revisión

Referencias: [Hill](https://x.com/iamdavidhill/status/2107616166713655476), [Ryan](https://x.com/wheresryan22/status/2106439475551154186), [Solvaix](https://x.com/Solvaix/status/2106830508797706560). La comparación de este trabajo se concentra en Software y, para el banner, en Hill. No acredita que el resto de los sectores alcance a Solvaix, ni que todas las isometrías alcancen la riqueza mecánica de Ryan.

El registro de medios de producción no se modifica. `UM_SOFTWARE_REVIEW=v12` sólo debe usarse después de importar los dos encuadres completos verificados. Las pruebas parciales son de revisión interna y no se presentan como la película terminada.


## Integración y autonomía verificadas

Se revisó la isometría dentro de `/software`, además de los planos aislados. La versión conserva seis mecanismos propios y sus conexiones; el rótulo de publicación ya no es atravesado por la pieza de release. El recorrido progresa sin clics y acompaña cada mecanismo con su explicación.

En un viewport de 390 × 844 se encontró un problema real: el umbral anterior iniciaba el reloj con apenas parte del escenario a la vista, mientras todavía se leía la introducción. `service-atlas-v22.js` exige que el 60 % del escenario de Software esté visible, descontando las barras fijas superior e inferior. Se verificó en navegador que conserva el estado inicial al leer la introducción y comienza automáticamente al bajar hasta el dibujo. Fuera de pantalla conserva el tiempo pendiente. El cambio sólo afecta al escenario de Software.

Validación: 58 pruebas de relato/autonomía/sectores y 13 pruebas de mecanismos/geometría/ciclo de vida aprobadas; build Astro correcto. El archivo público nuevo evita sustituir el controlador v21 en el deploy scoped.
