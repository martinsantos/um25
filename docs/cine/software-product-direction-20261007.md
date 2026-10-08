# Software · de la interfaz a la arquitectura

Referencia aportada por Martín: [David Hill · 6 de octubre de 2026](https://x.com/iamdavidhill/status/2107616166713655476). Se abrió el post y se observaron el inicio con estructura de interfaz, los componentes de producto en perspectiva y el cierre tipográfico. La referencia orienta profundidad, composición y relación entre interfaz y estructura. No se importan su marca, sus pantallas ni su video.

## Relato propio

Una aplicación de operaciones muestra una solicitud concreta. Navegación, métricas, registros y detalle tienen contenido reconocible, tipografía UM Sans y datos de ejemplo. Al abrirse el conjunto aparecen reglas y permisos, contratos de integración, datos y trazabilidad, despliegue e infraestructura. Una señal recorre estas dependencias y vuelve a la aplicación; el registro pasa a Confirmada. La interfaz vuelve a componerse.

La película es un recorrido autónomo de 24 segundos, sin audio obligatorio ni interacción necesaria. Las isometrías inferiores continúan explicando las seis capas con mayor detalle. Las páginas de sector y la gran película de la home conservan su función.

## Implementación y control

- Fuente nueva: `scripts/cine/render-software-system-v2.py`; conserva v1 como material anterior.
- La escena usa componentes de interfaz con superficies delgadas, panel de detalle claro, estructura oscura y rojo UM para el flujo activo.
- Tipografía del repositorio; no modifica archivos del trabajo paralelo UM Sans.
- La proyección se comprueba en los 576 cuadros antes de renderizar y nuevamente dentro de Blender. Mantiene todo el producto dentro de la edición móvil.
- Cinco encuadres nativos preceden al render completo. La revisión debe evaluar lectura, separación de capas, jerarquía, sombras, suavidad del movimiento y regreso al producto.
- El render se ejecuta en GitHub Actions, con Blender oficial verificado, Cycles y 24 muestras. No ejecuta Blender en el Mac.

Estado: **película v2 integrada en `/software` y el servicio 104**, commit `165a1b2b`. El [ensamblado 37690371762](https://github.com/martinsantos/um25/actions/runs/37690371762) reutiliza los fragmentos renderizados y verifica la película completa. Son 576 cuadros a 24 fps, ancho Full HD, edición cuadrada y cuatro pósters: 11.097.580 bytes en seis archivos. El importador comprobó hashes, formato, duración y límites de composición en todos los cuadros antes de escribir el registro. La versión anterior se conserva como asset inmutable.

La segunda prueba permitió ver recortes en las letras al convertir la tipografía a curvas Blender. El runner prepara copias temporales con los contornos superpuestos unidos mediante [FontTools](https://fonttools.readthedocs.io/en/latest/ttLib/removeOverlaps.html); comprueba que los avances y los archivos originales no cambien. La web conserva sus binarios UM Sans. La corrección se inspeccionó en los encuadres nativos y está aplicada en la película completa. Se revisaron el producto cerrado, la apertura, la arquitectura desplegada, el regreso de la señal y el cierre del ciclo sobre el archivo entregado.


## Validación de la integración

`npm run check`: 67 suites / 573 pruebas, lint, tipos, contrato CSS y build aprobados. Las nueve rutas (ocho servicios y `/software`) responden 200 en la preview y seleccionan su película propia. Software conserva su composición específica al cambiar de versión; en tablet se equilibró el tamaño del título con el espacio de la película.

La revisión final de navegador de este commit se ejecuta en [encuadre 37690846436](https://github.com/martinsantos/um25/actions/runs/37690846436) y [experiencia 37690850289](https://github.com/martinsantos/um25/actions/runs/37690850289). Ambas revisiones concluyeron sin hallazgos: 90 composiciones Chrome/WebKit, ocho películas completas y repetidas en WebKit móvil, ambas rutas Software en Chrome escritorio/móvil y diez composiciones e inspecciones WebKit. Se revisaron capturas reales del banner y las capas automáticas en móvil, escritorio y tablet. No hay despliegue a producción.


## Control móvil refinado tras leer las capturas

La inspección visual del control de encuadre detectó que la pausa podía quedar junto a la barra fija inferior. El commit `62f5952e` la ubica en el área superior de la película, con un blanco táctil de 44 × 44 px. La [revisión 37693270159](https://github.com/martinsantos/um25/actions/runs/37693270159) verifica 54 composiciones Chrome/WebKit a 820, 390 y 360 px, incluyendo hit testing real: sin hallazgos. Las películas y su lógica de reproducción no cambiaron desde la revisión completa; no se repitió el render. `npm run check` aprobó otra vez 67 suites / 573 pruebas, lint, tipos, contrato CSS y build.
