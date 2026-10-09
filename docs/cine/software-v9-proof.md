# Software v9 · prueba de dirección visual

Experimento aislado. El sitio conserva banner v8 e isometría v4. No hay aceptación visual ni autorización de publicación derivada de esta prueba.

## Qué cambia en la producción

1. Autorizar una sola composición concreta: una orden de trabajo con responsables, alcance, permiso y registro. Una interfaz utilizable, no cuatro tarjetas que representan conceptos.
2. Renderizar un fotograma nativo, compararlo con Hill y rechazar problemas visibles antes de generar movimiento. El número de polígonos, etiquetas o tests no cuenta como acabado artístico.
3. Verificar una prueba corta en movimiento: continuidad, legibilidad durante el recorrido y correspondencia entre la superficie y sus regiones elevadas.
4. Diseñar los siguientes planos solamente cuando el primero soporte esa comparación. Revisar la secuencia en la integración, en escritorio y móvil, antes de reemplazar la película.

El workflow impide `full`, `repair` y `assemble` para v9. Todas las pruebas Blender se ejecutan en runners desechables de GitHub Actions; no hay render Blender local.

## Criterios observables de descarte

- La jerarquía desaparece al verla al tamaño del banner: cambiar encuadre y composición, no resolverlo agregando resolución.
- La profundidad parece un montón de cartones o despega texto de su control: rehacer separación y relación entre superficies.
- El contraste o la iluminación borran contornos, empastan tipografía o vuelven plástico el papel: corregir materiales antes de animar.
- La cámara sólo se mueve sobre un mockup sin mostrar una función: falta narración, aunque la imagen fija sea agradable.
- El recorrido necesita clics para mostrar lo esencial: no cumple la autonomía solicitada.
- Una mejora frente a v8 no basta: hay que confrontar detalle, composición y continuidad con el original de Hill.

## Referencias y alcance

Hill: https://x.com/iamdavidhill/status/2107616166713655476

El plano de interfaz no acredita paridad de las isometrías con Ryan ni de la integración de sistemas con Solvaix. Esas piezas requieren pruebas visuales propias; no extender el veredicto de una a todas.

## Pruebas

- Primera composición: `a382de79`, run `37913629621`, fotograma 180, Cycles, 3840 × 2160, 48 muestras. Descartado visualmente: texto oculto por controles, superficies claras sobreexpuestas y texto con sombras de relieve. 403,48 segundos por cuadro: no escalar este render a una película. La segunda prueba corrige el orden de superficies, separa tinta gráfica de materiales físicos y se acerca a permiso/registro. Conserva 4K; 16 muestras con denoising para esta evaluación puntual.
