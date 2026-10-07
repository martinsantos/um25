# Explicación autónoma de servicios · 7 de octubre de 2026

La composición pública conserva el cine Blender en la apertura y usa debajo una sola explicación isométrica. La información principal se entrega sin abrir una biblioteca ni seleccionar una vista.

- La home muestra `ServicesStory` directamente. `RequestSequence` queda conservado como prototipo, fuera de la home.
- La secuencia predeterminada recorre proyecto, equipo, interior, conexión y resultado. Software incluye aplicación, navegación, contenido y acciones.
- Cada servicio conserva una explicación legible de necesidad, funcionamiento y entrega mientras la ilustración cambia. La leyenda del dibujo describe el detalle que se está viendo, sin repetir el texto de alcance.
- El modelo del sitio se conserva como contexto durante los despieces. La transición usa las mismas geometrías vectoriales y muestra su relación con el componente.
- La selección de servicio queda después del relato. Los controles de vistas permiten volver sobre la explicación; no son la entrada obligatoria al contenido.
- El recorrido inicia al entrar en pantalla, continúa al terminar una exploración y respeta pausa explícita, teclado, pestaña oculta y movimiento reducido.

## Verificación

El primer pase remoto `37604189102` confirmó el recorrido autónomo en home, Bodegas y servicio 107, incluyendo equipos e interiores. Chrome escritorio no reportó fallos. Móvil y WebKit detectaron desborde a 360 px. La inspección de las capturas detectó además una regla de ancho SVG anulada por la cascada: la vista general móvil quedaba pequeña y corrida a la izquierda. Ambos problemas se corrigieron en `135565f6`.

Se revisó también la grabación nativa del recorrido, sin reloj acelerado, para evaluar la transición al interior y el retorno al proyecto. Las capturas con reloj acelerado pueden mostrar una transición intermedia y no se toman como prueba de su posición final.

`npm run check` pasó lint, tipos, auditoría CSS, 66 suites / 525 pruebas y build. La prueba del relato verifica que la explicación completa permanezca visible mientras proyecto, equipo, interior y detalle avanzan sin eventos de entrada.

La verificación completa del código `135565f6` terminó correctamente en [37605771152](https://github.com/martinsantos/um25/actions/runs/37605771152): 20 rutas en Chrome escritorio/móvil y 20 combinaciones de ruta/ancho en WebKit, cero hallazgos y cero errores de ejecución. Todos los servicios previstos fueron visitados sin interacción. A 360 y 390 px el ancho de documento coincide con el viewport. Se inspeccionaron las capturas corregidas y la grabación nativa final; WebKit Linux no equivale a Safari físico.

Los checks del PR sobre el código validado pasaron build, pruebas, lint y comparación de la campaña protegida. La preview local entrega sus 14 referencias de scripts/estilos sin errores HTTP. No se modifican assets bajo `public/cine` que ya existieran en la base `develop`.

Evidencia conservada en `autonomous-explanation-20261007` dentro de las visualizaciones del hilo: informes de ambos perfiles, informe WebKit, grabaciones nativas y capturas de contexto, interior y software.

La preview integrada continúa en `http://127.0.0.1:4326/`. Esta revisión no genera películas nuevas ni cambia la tipografía global. Conserva el piloto Blender de Bodegas y la apertura cinematográfica de la home. Producción no se despliega desde esta iteración.

## Piloto cinematográfico Blender

Se preparó `render-site-project-v2.py` con una aproximación continua de 18 segundos, materiales grafito/acero, iluminación de estudio y énfasis en un circuito. La primera prueba remota de tres fotogramas (`37556053716`) dejó visibles tanques facetados y conexiones diagonales. Se corrigieron en `cad2b59b`: superficies cilíndricas suavizadas, trazado de red por bandeja y bajadas verticales, juntas de depósitos, escaleras y pequeños elementos del gabinete. La segunda prueba `37556554471` terminó correctamente y se inspeccionaron sus fotogramas. El render completo de bodega `37557238682` terminó correctamente: 432 fotogramas, 24 fps, 18 segundos, 1920 × 1080, Cycles con 16 muestras. Se inspeccionaron apertura, acercamiento, máximo detalle, regreso y cierre, junto al recorte móvil. El MP4 horizontal ocupa 4.921.795 bytes; las seis variantes de video/póster, 8.586.112 bytes en total. La diferencia absoluta media entre primer y último fotograma decodificado es 0,327 niveles sobre 255; la cámara vuelve a su posición inicial.

La película está importada como `bodega-proyecto-v4` y seleccionada por el registro de Bodegas y el servicio 107. No se reemplaza ningún asset publicado. La película grande original de la home se conserva. La reproducción web del medio nuevo pasó `37559937756`, commit `4bd057de`: Bodegas y servicio 107 en escritorio y móvil, reproducción automática y cero hallazgos.

