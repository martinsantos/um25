# Comparación visual · 8 de octubre de 2026

## Estado de aceptación

La evaluación del usuario rechaza el conjunto actual: 12 % respecto de las referencias y 3 % para el banner de Software. Son valoraciones del usuario, no métricas objetivas ni porcentajes de trabajo completado. **No hay aprobación artística ni GO para producción.** La preview sirve Software v8: importación `2ed18c45`, película clara de componentes funcionales y escenario móvil 4:3. La revisión reemplaza v7, también rechazada; no demuestra paridad con las referencias.

Referencias a contrastar a igual tamaño visible y en movimiento:
- Ryan, precisión y mecanismos isométricos: https://x.com/wheresryan22/status/2106439475551154186
- Solvaix, complejidad coordinada y capas del proyecto: https://x.com/Solvaix/status/2106830508797706560
- David Hill, detalle de interfaz, profundidad y continuidad: https://x.com/iamdavidhill/status/2107616166713655476

Los archivos originales de referencia están en `/private/tmp/um-ryan-reference.mp4`, `/private/tmp/um-solvaix-reference.mp4` y `/private/tmp/um-david-hill-reference-4k.mp4`. No concluir calidad a partir de miniaturas, resolución nominal, cantidad de piezas, número de tests o ausencia de errores.

## Nueva revisión en curso

El usuario también rechazó la entrega clara v7: «mejor pero inaceptable, no se ve, ni se compara al efecto de referencia». No está artísticamente aceptada. La revisión v8 construye una aplicación de integraciones con cuatro componentes funcionales, inspección volumétrica y acercamientos mayores. Se revisaron planos nativos y un tramo corto remoto, se completó el render y se integró como candidata. La sustitución de la preview no implica aprobación artística; consultar la entrega v8 al final de este documento.

## Antecedentes de la iteración · conservados como historial

- **Software v6:** sólo cambiaba el recorrido por paneles que conservaban la dirección visual rechazada. La primera prueba además tapaba el título de Datos con Reglas. La segunda separó esas placas, pero no resolvió el problema artístico. El render completo `37755185534` fue cancelado; no importar ni continuar esa película.
- **Software v7 / primera prueba:** mayor detalle de interfaz y una ficha ligada a la solicitud, pero todavía demasiado plano, con deformación aparente por la compresión de la cámara y controles demasiado finos. La fila flotante cruzaba la ficha. Rechazada como resultado final. `37756410873` contiene cinco planos; el sexto falló instalando paquetes. No confundir ese fallo de infraestructura con la evaluación visual negativa.
- **Banner:** la columna lateral reducía el área de película al 58 % del ancho. Eso hacía ilegible buena parte del detalle. La composición amplia se integró con v7; el dato anterior describe el problema que motivó el cambio.
- **Isometrías:** la óptica 103 recibió un despiece con LC dúplex, PCB, contactos y cubierta; la cámara v3 aumenta el tamaño de los mecanismos. `37742890044` verificó 140 estados y 20 composiciones con movimiento reducido, sin recortes. Esto no demuestra paridad con Ryan. La alimentación eléctrica 108 recibió después el tablero detallado descrito en la entrega actual; el control funcional no la aprueba artísticamente.

## Desarrollo y pruebas previas

El usuario rechazó explícitamente la dirección de pantalla negra sobre fondo negro y las pantallas inclinadas/deformadas. No recuperar esa dirección. `e71a8dc8` usa una interfaz clara con texto oscuro, acentos UM y una cámara frontal ortográfica sin rotación. Las capas se desplazan sin alterar sus proporciones. La profundidad depende de separación y sombras suaves, no de inclinar el producto.

- Prueba física oscura `37758150480`: descartada; las letras parecían en relieve y las superficies interiores coplanares producían interferencias.
- Seis planos `37758154427`: ayudaron a detectar otra ocultación, el panel superior tapaba el título de Reglas. Se desplazaron y validaron las capas anteriores durante las ventanas de lectura de Reglas, Datos y Operación.
- `782fa860` añade progreso temporal a permisos, escritura y entrega, además de corregir la actualización de rótulos duplicados.
- Prueba oscura `37759726891`: cancelada por el cambio de dirección del usuario.
- Prueba clara `37760112332`: un plano nativo con Eevee. Sin aprobación artística ni integración todavía.
- El importador y el ensamblador se prepararon para v7. La entrega completa posterior se registra abajo; las pruebas iniciales por sí solas no eran una entrega.

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

## Entrega clara integrada

- Render completo `37762384241`, fuente `c3dabff81561663372c61021a47de291592b8c12`: 24 s, 1.440 cuadros nativos distintos, 3840 × 2160 / 60 fps. Seis assets, 36.569.445 bytes, fuente, secuencia, color y SHA256 validados. Importación `23aeb972`.
- Cámara frontal ortográfica sin giro ni inclinación. Fondo de escena oscuro e interfaz clara, textos oscuros y acentos UM. La apertura de ficha conserva su título, cuerpo y acción completos. Cuadros finales 300/400/450/690/900/1100/1370 inspeccionados; la capa activa de reglas, datos y operación está completa. El recorte del contexto alrededor de los acercamientos es intencional.
- Banner ancho bajo la introducción y narración debajo del fotograma. `3c4a2ba7` elimina una reserva móvil heredada que añadía espacio vacío antes del título; `99a42adf` comprueba ambos accesos a Software y su recorrido automático.
- Comparación actual con David Hill: mejoró el contraste, se eliminó la deformación y los controles son reconocibles. Continúa una diferencia visible en riqueza de estados y acabado: los paneles de reglas/datos/operación son más esquemáticos, la separación es mayormente gráfica y falta sutileza de profundidad. No se declara calidad indistinguible.
- Tablero eléctrico `98ca6e86`: gabinete con puerta, diez aparatos DIN / veinte polos, bornes, fijaciones, conductores, barras y canaletas. SVG individual de 28.490 bytes gzip. Auditoría `37763343190`: Chrome y WebKit, escritorio/móvil, 28 estados y cuatro vistas reducidas, cero hallazgos o errores. Se revisaron capturas de apertura y conjunto. El detalle añadido no certifica paridad con Ryan.
- `npm run check` en `98ca6e86`: 71 suites / 593 pruebas, lint, tipos, CSS y build aprobados; diez advertencias previas. Build posterior a importación y corrección móvil aprobado. Guarda de alcance: 495 rutas contra `origin/master`, cine publicado, campaña y fuentes sin modificaciones.
- Servicio `37764129920`: diez composiciones, dos recorridos autónomos completos y seis frases sincronizadas, cero hallazgos. Chrome descartó 3/1.375 cuadros; WebKit móvil 0/1.375. Ambos accesos `37764705011`, tras corregir el espacio móvil: veinte composiciones y recorrido automático de `/software`, cero hallazgos; Chrome 3/1.376, WebKit móvil 0/1.374. Las capturas iniciales confirmaron el espacio vacío heredado y las siguientes su eliminación. `37764133187` fue cancelada y superada; no es un fallo de película.
- Pósters `a9cc73ee`: la extracción JPEG anterior interpretaba mal la matriz YUV y cambiaba el rojo a RGB 205/19/42. Se derivaron nuevos archivos sRGB desde la película verificada; JPG y AVIF nuevos decodifican el rojo a 218/35/37, igual que la película. Revisión `srgb-v1`, sin cambiar archivos anteriores ni volver a renderizar. Los seis assets activos de Software suman ahora 36.834.436 bytes. `npm run check` nuevamente aprobado: 71 suites / 593 pruebas. Auditoría final de color y ambos accesos `37765683012`: el intento 1 agotó 25 minutos instalando dependencias WebKit desde el mirror Ubuntu, antes de abrir la web; intento 2 aprobado sobre el mismo commit `a9cc73ee`: veinte composiciones, dos ciclos autónomos y seis frases sincronizadas, cero hallazgos. Rojo del póster 218/35/37; película Chrome 221/38/41 y WebKit 218/35/38, dentro de la tolerancia de compresión. Chrome descartó 28/1.375 cuadros; WebKit móvil 0/1.373; sin corrupción. Es evidencia del runner, no garantía de rendimiento universal. No atribuir ese timeout al producto.
- Límite móvil observado: el fotograma panorámico completo se conserva y la narración externa es legible; los microtextos internos de la aplicación son pequeños en 390 px. Esto no equivale a lectura completa de la UI al tamaño móvil y queda pendiente de una composición móvil diseñada para ese uso.

Archivo verificado: `/Volumes/SDTERA/Codex UM25 audits/20261008/`. Manifiesto `software-v7-native-and-power-review-SHA256.json`: 59 archivos y 46.266.306 bytes de entrega, cuadros y gabinete. Blender sólo se ejecutó en GitHub Actions. Producción no modificada.

Cierre de esta corrección: preview reconstruida y confirmada por HTTP, producto `a9cc73ee`, PID propio 44653. Ambos accesos usan Software v7 y pósters `srgb-v1`. Auditoría final `37765683012` intento 2 aprobada; capturas de escritorio y móvil inspeccionadas. Archivo final verificado mediante `software-v7-final-browser-review-SHA256.json`. Sin trabajos de render o auditoría de esta corrección pendientes. Continúa pendiente la igualdad artística con las referencias; no desplegar por inferencia de los controles técnicos.

## Software v8 · revisión sobre componentes reales

El rechazo posterior de v7 continúa vigente. v8 reemplaza el recorrido entre placas por una aplicación de integraciones: conexión ERP, contrato de campos, registros sincronizados y actividad. El campo de API, un contrato y un registro se separan de su posición original, conservando las relaciones y las proporciones. El dato cambia durante la explicación.

- Primera prueba `37781803057`, fuente `c52aef4e`: seis planos 4K inspeccionados. Se rechazó el exceso de sombra, se detectó un recorte del plano general y un enlace cruzando la tabla.
- Segunda prueba `37782369402` y tramo `37782374040`: fallaron por usar un atributo inexistente de `Curve` en Blender. Corregido en `e9ae2ac5`; no se los cuenta como evidencia visual.
- Prueba corregida `37782767946`: seis planos completos. Se inspeccionaron apertura, conexión y registro. Superficies más finas, controles de propósito reconocible, lectura mayor, profundidad ligada a elementos del mismo producto. Los planos no certifican la continuidad de toda la película ni igualdad con Hill.
- Integración preparada `01c55867`: entrega móvil 4:3 con acercamiento continuo al componente, sin deformación ni interpolación de cuadros, y plano general completo en apertura/cierre. Seis frases siguen el reloj nativo. Validación geométrica incluye los controles que se elevan y reserva márgenes para el encuadre móvil.
- `npm run check`: 71 suites y 593 pruebas aprobadas, build, tipos, CSS y lint aprobados; diez advertencias previas. Registro y preview aún conservan v7 hasta revisar/importar la entrega completa.

Criterio pendiente: comparar fluidez, jerarquía, detalle visible y profundidad contra Hill al mismo tamaño, además de revisar ambos accesos de Software en Chrome y WebKit. No traducir el recuento de pruebas a un porcentaje de calidad.

La secuencia nativa `37782772383` finalizó: 120 cuadros 3840 × 2160 / 60 fps, 2 segundos, 787,82 segundos de render remoto, sin errores de controlador; seis instantes inspeccionados. Render completo `37784593927`: diez tramos terminados. Los tramos 4 y 10 fallaron antes de Blender, al agotar 600 segundos instalando `libegl1` y `ffmpeg`; recuperación selectiva `37786880247`, sin repetir los otros diez. La unión ahora conserva y verifica la evidencia de encuadre de cada subtramo, además de fuente, fuentes tipográficas y tratamiento.

El banner también se corrige: botones y estadísticas pasan después de la película y su narración. El escenario de escritorio se ajusta al alto de ventana, y en móvil conserva la composición 4:3. Esto responde al espacio que ocultaba el recorrido bajo los controles en el primer viewport.

## Entrega v8 / recuperación de continuidad

- Ensamblado `37787831278` aprobado, render fuente `01c55867`, recuperación de tramos `37786880247`. Importación `2ed18c45`: 1.440 cuadros 4K/60, 24 s, 403 registros de encuadre, cero errores de controlador. La igualdad de geometría inicial/final no garantiza identidad de todos los rótulos: el estado de conexión se reinicia al comenzar el ciclo.
- Seis assets activos, 70.226.044 bytes, hashes verificados; escritorio 52.486.760 bytes, móvil 16.700.118 bytes. No presentar estas cifras como garantía de carga rápida en cualquier conexión.
- La película precede a las acciones y estadísticas. Narración externa de seis etapas; móvil 4:3 con acercamiento continuo. Ambos accesos responden con v8, PID propio 15122.
- `npm run check` final: 71 suites / 593 pruebas, lint/tipos/CSS/build aprobados, diez advertencias previas.
- Navegadores `37789286659`: veinte composiciones, dos ciclos autónomos de 24 s, seis frases, sin errores JS ni corrupción. Última muestra Chrome 8/1.378 cuadros descartados, WebKit móvil 0/1.370. Un hallazgo: no había rojo en el fotograma tomado después del acercamiento. `1b9d138c` fija la comparación de color a un fotograma decodificado de 0,75 s, guarda evidencia de esa medición y mantiene independiente la prueba sin intervención. Revisión `37792551419` pendiente.
- Capturas inspeccionadas: home de Software en escritorio/móvil, conexión y mapeo. Persiste menor variedad de jerarquías y detalle funcional que Hill. En móvil las capturas del navegador muestran dentado que no aparece igual al extraer/reducir el archivo nativo; aislar la presentación del video antes de atribuirlo al render. La cabecera de contexto y su botón se recortan en algunos acercamientos; no confundir con el componente activo completo ni ignorarlo en la revisión de acabado.
- Recuperación del fork: el hilo **UMSA HOME PRODU (3)** reportó dos errores de compactación remota con desconexión de stream. No hay causa de transporte detallada ni evidencia de pérdida del código/assets. Estado recuperado desde Git y HTTP, sin reiniciar el render. Mantener el PR draft y producción intacta.

Archivo v8 verificado: `/Volumes/SDTERA/Codex UM25 audits/20261008/software-v8/SHA256.json`, 74 archivos / 80.979.295 bytes de entrega y primera auditoría. No se borraron originales.
