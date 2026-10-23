# Software v22 · producto, profundidad y continuidad

## Cambios a partir de Hill

La revisión de la v21 mostraba poca variedad de controles en relación con la referencia de [David Hill](https://x.com/iamdavidhill/status/2107616166713655476). V22 incorpora perfiles en la lista de trabajo, estados y filtros reconocibles, un indicador de alcance, controles de mapa, valores de destino en el contrato y una recepción de transacción con proyecto, orden y versión. Las superficies de controles tienen una variación tonal acotada y bordes precisos. Los planos de contexto mantienen transparencia selectiva.

La película ahora empieza con la orden en revisión y vuelve a la interfaz con la aprobación registrada, después de permiso → contrato → transacción. Se conserva el identificador 0248-A durante el recorrido y la cámara continua de 20 segundos a 60 fps.

## Revisión y corrección

La primera prueba nativa (run 38138202287, fuente d8f98336) mostró sombras demasiado duras bajo controles y una línea atravesando el título Solicitud en la perspectiva cruzada. Se redujeron las sombras, se excluyeron los avatares de ese tratamiento y se eliminó el divisor que cruzaba el título. La corrección incluye la evolución temporal de los estados inicial/final (fuente 538a3aef).

Segunda prueba: run 38138462366. Ocho fotogramas, dos composiciones. Se verificaron el inicio en revisión, el título de solicitud sin línea superpuesta, la profundidad de los campos y las sombras reducidas. El recorrido proyectado detectó un rótulo redundante debajo de `<transaction>`; se eliminó en la fuente `3c84d2ce`. El primer render completo 38138828578 se canceló y se sustituyó por [38139065527](https://github.com/martinsantos/um25/actions/runs/38139065527), íntegramente con esa fuente.

## Validación técnica

- 77 pruebas relevantes correctas en tres suites.
- Typecheck correcto. Lint: cero errores y diez advertencias preexistentes.
- 176 combinaciones de texto y composición dentro del encuadre durante 1.200 posiciones.
- Blender se ejecuta sólo en GitHub Actions. Los fotogramas y fragmentos de revisión quedan en SDTERA.
- La selección `UM_SOFTWARE_REVIEW=v22` afecta únicamente a Software y servicio 104. No cambia el registro de publicación.

- Auditoría de intersecciones de límites de texto, los 1.200 fotogramas en dos composiciones, con textos desde el 65 % de visibilidad: sin intersecciones después de la corrección. Incluye las etiquetas iniciales y finales. Este control geométrico complementa la inspección de los renders.

## Entrega

Las dos películas completas se integraron en `/software` y en el servicio 104 con `UM_SOFTWARE_REVIEW=v22`. Son 1.200 fotogramas por composición: 20 segundos a 60 fps, 3840 × 2160 y 2160 × 2160. Los seis activos ocupan 59.906.974 bytes. El ensamblador comprobó los 80 rangos, hashes de fuentes y activos, decodificación completa, color, dimensiones y cadencia. El build final terminó correctamente.

En Chrome se comprobó la reproducción automática, el avance por capítulos y el bucle de la película completa, la pausa/reanudación manual y la suspensión fuera de pantalla. En viewport de 390 × 844 se verificó la selección de la película cuadrada nativa, reproducción y ausencia de desborde horizontal. Las dos rutas respondieron 200 y ambas películas aceptaron Range con 206. No se registraron errores de consola durante la revisión de escritorio.

La revisión de integración detectó dos defectos corregidos: v22 faltaba en la clasificación de película de producto, por lo que recibía una máscara y un degradado; además, al reducir el ancho de una ventana ya abierta, `cover` recortaba la película horizontal cargada. V22 conserva ahora sus bordes sin máscaras, y `contain` preserva el cuadro completo al cambiar de ancho. La carga inicial móvil usa su composición cuadrada específica.

## Comparación temporal con Hill

Se reprodujeron los archivos completos en paralelo a velocidad real y media velocidad; se inspeccionaron los relevos de interfaz, permisos, contrato, registro y retorno. La comparación de producto usa Hill en 7,5 s y v22 en 19,2 s, evitando el cierre negro de la referencia. El retorno de v22 muestra la misma orden aprobada; al repetir el ciclo vuelve a revisión para reiniciar la explicación.

La v22 aporta controles más variados que v21, contexto propio reconocible, menos ruido en bordes, separación entre campos y una operación cuyo estado cambia. No aparecieron las superposiciones corregidas en las muestras revisadas. La auditoría geométrica recorre todos los fotogramas; la inspección visual por instantes y reproducción en navegador no equivale a certificar perceptualmente cada uno.

**No se considera indistinguible de Hill.** La referencia conserva mayor densidad de controles y marcas en cada encuadre; los módulos de permiso, contrato y registro de v22 son más sintéticos. El producto completo, el mapa y la imagen aportan variedad, pero esa diferencia de acabado sigue siendo visible. No se asigna un porcentaje ni se declara GO a producción. Esta entrega completa e integra la película; no modifica las isometrías ni certifica equivalencia con Ryan o Solvaix.

Evidencia:

- [Banner integrado en escritorio](evidence/software-v22/integrated-desktop.png).
- [Composición móvil integrada](evidence/software-v22/integrated-mobile.png).
- [Comparación de producto con Hill](evidence/software-v22/hill-product-comparison.png).
- [Manifiesto y hashes de los seis activos](evidence/software-v22/delivery.json).

PR #266 continúa como draft hacia develop. No hubo merge ni despliegue de producción.
