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

- Corrección Cycles: `7084fce0`, run `37914726826`. Lectura y contraste corregidos, sin sombras tipográficas. Quedó el badge Verificado bajo su superficie (corregido después). 277,75 s/cuadro. No seleccionada como motor de producción para esta prueba.
- Gráfico inicial: `247db515`, run `37914983576`. 21,62 s/cuadro, pero sombras duras de letras y líneas aparentaban duplicaciones. Descartado.
- Gráfico corregido: `b935c43a`, run `37915318158`. 6,54 s/cuadro; sin texto duplicado ni badge oculto. Mejora técnica visible, composición todavía escasa.
- Composición de permiso: `07a1579a`, run `37915700393`. 6,50 s/cuadro. Identidad, rol y alcance con valores concretos, cámara más próxima, profundidad mayor y contornos legibles. Base elegida para una prueba breve de movimiento; no representa aprobación de una película ni paridad con Hill.
- Movimiento causal: `457ec288`, run `37915936623`. Prueba de 60 cuadros consecutivos 4K/60, cuadros 240–299 de la escena de seis segundos. Producida y revisados cuadros inicial/intermedio/final: 60 cuadros, 3840 × 2160, 60 fps, duración 1 s; 288,94 s de render, media 4,82 s/cuadro, sin errores del actualizador. Se verifica el cambio autónomo a Aprobada y el evento en el historial. Esto no valida el recorrido completo ni paridad de fluidez con Hill. Verificaciones a 1,80 / 2,34 / 2,88 s; aprobación a 4,32 s; el registro gana profundidad y el permiso desciende. La prueba sólo cubre 4,00–4,98 s, no la secuencia completa.

Evidencia permanente: `/Volumes/SDTERA/Codex UM25 audits/20261009/software-v9-art-direction/`, cuadros nativos y metadatos, hashes en `SHA256.json`. Incluye la referencia Hill y un plano de v8 para no comparar contra el recuerdo.

## Diferencia que permanece

La claridad y la jerarquía mejoraron. El plano aún no acredita la riqueza de encadenamiento espacial ni el ritmo del video de Hill. El fragmento nativo de movimiento debe decidir si la profundidad y el cambio de estado se perciben con naturalidad. Falta revisar la secuencia completa y su tamaño real dentro del banner, especialmente en móvil. No modificar v8 ni las isometrías a partir de una aprobación técnica de estos scripts.

## Corrección del diagnóstico temporal

La vista reducida del clip sugirió letras incompletas. La revisión de PNG originales y recortes a escala real del PNG y del video descartó esa hipótesis: las palabras están completas en ambos. No atribuirlo a Blender ni al codificador, y no mantener un descarte técnico del clip por esa observación. La repetición `37916880365` se canceló; no se cambiaron parámetros del codificador. Se conserva la actualización idempotente de textos como mejora de implementación, sin adjudicarle una corrección visual que no fue demostrada.

El criterio de revisión incluye desde ahora confirmar a escala real cualquier supuesto defecto de contornos antes de cambiar generación o codificación. Los pares de recortes quedan junto a la evidencia. Los PNG temporales de los 60 cuadros permanecen en `/private/tmp/um-v9-motion-native`: la protección local bloqueó su eliminación y exige borrado manual. Los tres estados revisados, el clip y sus metadatos ya están archivados y verificados.

**Veredicto de esta ronda:** proceso de descarte aplicado y documentado; plano más legible, detallado y causal que v8. No es una película final, no está integrado y no demuestra calidad indistinguible de Hill. No hay GO de producción. Las isometrías no cambiaron en esta ronda.
