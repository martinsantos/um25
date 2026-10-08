# Comparación visual · 8 de octubre de 2026

## Estado de aceptación

La evaluación del usuario rechaza el conjunto actual: 12 % respecto de las referencias y 3 % para el banner de Software. Son valoraciones del usuario, no métricas objetivas ni porcentajes de trabajo completado. **No hay aprobación artística ni GO para producción.** La preview sigue sirviendo el producto `9c2f3dee`, con Software v5.

Referencias a contrastar a igual tamaño visible y en movimiento:
- Ryan, precisión y mecanismos isométricos: https://x.com/wheresryan22/status/2106439475551154186
- Solvaix, complejidad coordinada y capas del proyecto: https://x.com/Solvaix/status/2106830508797706560
- David Hill, detalle de interfaz, profundidad y continuidad: https://x.com/iamdavidhill/status/2107616166713655476

Los archivos originales de referencia están en `/private/tmp/um-ryan-reference.mp4`, `/private/tmp/um-solvaix-reference.mp4` y `/private/tmp/um-david-hill-reference-4k.mp4`. No concluir calidad a partir de miniaturas, resolución nominal, cantidad de piezas, número de tests o ausencia de errores.

## Rechazos de esta iteración

- **Software v6:** sólo cambiaba el recorrido por paneles que conservaban la dirección visual rechazada. La primera prueba además tapaba el título de Datos con Reglas. La segunda separó esas placas, pero no resolvió el problema artístico. El render completo `37755185534` fue cancelado; no importar ni continuar esa película.
- **Software v7 / primera prueba:** mayor detalle de interfaz y una ficha ligada a la solicitud, pero todavía demasiado plano, con deformación aparente por la compresión de la cámara y controles demasiado finos. La fila flotante cruzaba la ficha. Rechazada como resultado final. `37756410873` contiene cinco planos; el sexto falló instalando paquetes. No confundir ese fallo de infraestructura con la evaluación visual negativa.
- **Banner:** la columna lateral reducía el área de película al 58 % del ancho. Eso hacía ilegible buena parte del detalle. La composición amplia está preparada exclusivamente para v7 y aún no está integrada.
- **Isometrías:** la óptica 103 recibió un despiece con LC dúplex, PCB, contactos y cubierta; la cámara v3 aumenta el tamaño de los mecanismos. `37742890044` verificó 140 estados y 20 composiciones con movimiento reducido, sin recortes. Esto no demuestra paridad con Ryan. La alimentación eléctrica 108 sigue siendo demasiado esquemática: el control funcional no la aprueba artísticamente.

## Candidata en trabajo

El usuario rechazó explícitamente la dirección de pantalla negra sobre fondo negro y las pantallas inclinadas/deformadas. No recuperar esa dirección. `e71a8dc8` usa una interfaz clara con texto oscuro, acentos UM y una cámara frontal ortográfica sin rotación. Las capas se desplazan sin alterar sus proporciones. La profundidad depende de separación y sombras suaves, no de inclinar el producto.

- Prueba física oscura `37758150480`: descartada; las letras parecían en relieve y las superficies interiores coplanares producían interferencias.
- Seis planos `37758154427`: ayudaron a detectar otra ocultación, el panel superior tapaba el título de Reglas. Se desplazaron y validaron las capas anteriores durante las ventanas de lectura de Reglas, Datos y Operación.
- `782fa860` añade progreso temporal a permisos, escritura y entrega, además de corregir la actualización de rótulos duplicados.
- Prueba oscura `37759726891`: cancelada por el cambio de dirección del usuario.
- Prueba clara `37760112332`: un plano nativo con Eevee. Sin aprobación artística ni integración todavía.
- El importador y el ensamblador se preparan para v7, pero la página sigue sirviendo v5. No confundir código preparado con película entregada.

Antes de avanzar deben poder verificarse visualmente:
1. Interfaz proporcionada, controles reconocibles y detalle legible al tamaño de integración.
2. Profundidad visible sin placas arbitrarias, superficies que se crucen ni tipografía aplastada.
3. Una acción continua: solicitud, reglas, registro y operación; cada cambio tiene una causa visible.
4. Ritmo fluido, con tiempo para entender el plano y sin depender de clics.
5. Película y texto integrados sin ocultación ni reducción a una miniatura lateral.

El siguiente render completo sólo tiene sentido después de que las pruebas de composición y movimiento soporten la comparación. Si la distancia sigue siendo clara, hay que cambiar el diseño y repetir la prueba; no reemplazar el juicio visual por garantías verbales o checks técnicos.


## Dirección clara / verificación del 8 de octubre

- `37760500046`: seis planos claros y frontales. La pantalla ya se separa del fondo y mantiene rectángulos reales. El plano 450 todavía recortaba arriba la ficha al empezar el traslado; no se aceptó ese encuadre.
- `78604e7a` sigue el centro de la ficha durante su apertura. `37761998322` confirma en el plano 450 que caben borde superior, título, contenido y acción. La ventana validada de ficha pasó de 0,48 a 2,64 segundos.
- `37761023184`: 120 cuadros nativos 4K/60 de la versión anterior de cámara, 500,52 segundos de render y cero errores de actualización. Es evidencia de continuidad y costo, no validación del seguimiento de ficha que se cambió después.
- `37760112332` y `37761408471`: acabado Eevee claro comparado con el plano de color directo. La diferencia visible es leve; los dos cuadros consecutivos costaron 151,35 y 149,39 segundos. Se conserva el acabado gráfico de color directo para producir la candidata completa sin bajar resolución ni frecuencia. El resultado todavía necesita la comparación visual de su movimiento completo.
- Reproductor v11: la película amplia espera a que entre su propio escenario en pantalla; no comienza sólo porque el título es visible. Conserva pausa explícita y movimiento reducido. 39 pruebas de ciclo de vida aprobadas; build aprobado.

La dirección clara se mantiene. No recuperar pantalla negra ni cámara inclinada. La película completa siguiente será candidata para revisión integrada, no aprobación de paridad con las referencias.
