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

Estado: **prueba visual enviada; todavía no incorporada a la preview**. Este documento no declara terminado el resultado ni autoriza producción.
