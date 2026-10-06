# Revisión integrada de la experiencia · 6 de octubre de 2026

## Criterio de esta iteración

Explicar una operación sin exigir clics; mostrar el equipo dentro del proyecto; conservar el cine de apertura; sostener legibilidad y continuidad en móvil. La revisión visual tiene prioridad sobre un resultado verde de pruebas.

## Cambios integrados

- La home sigue una orden de mantenimiento durante 48 segundos: puesto, patch panel y switch dentro de un gabinete detallado, aplicación, responsable, evidencia y respuesta. La puerta se abre durante el recorrido. El ejemplo está identificado como ilustrativo.
- Los ocho servicios aparecen abiertos desde el inicio. Cada servicio pasa automáticamente del contexto al equipo y vuelve al resultado; conserva el proyecto y su conexión durante el primer plano. Las páginas de servicio y sector comparten el comportamiento.
- Un cursor estacionado sobre un sector ya no detiene el recorrido. La pausa explícita y la exploración con teclado siguen disponibles.
- La geometría de detalle del gabinete se monta al llegar al primer plano. No se redujo la resolución ni se sustituyeron sus piezas por imágenes.
- Empresa explica la coordinación técnica; capacidad relaciona cada etapa con su entregable. Se eliminaron repeticiones y una promesa de relevamiento/propuesta en el día que no estaba respaldada.
- Las cifras de sectores indican que son proyectos. Textos secundarios de la home, cobertura y publicaciones tienen mayor contraste y un mínimo de 16 px.
- Se corrigieron dos defectos detectados en capturas: superposición entre la UPS y la miniatura del proyecto en móvil, y etiquetas cortadas durante el paneo.

## Validación

`npm run check`: lint, tipos, auditoría CSS, 66 suites / 517 pruebas y build correctos. Los avisos de revisión estética del auditor CSS no equivalen a fallos de compilación.

La auditoría aislada de Chrome `37546983506` verificó ocho servicios y ocho etapas de la orden en escritorio y móvil, con pausa, movimiento reducido y navegación. Cuarenta capturas de secciones cubren los anchos 1440, 1280, 834, 390 y 360. No registró errores funcionales ni desbordamiento; la revisión humana de las capturas sí motivó las correcciones de encuadre posteriores.

La cantidad inicial de nodos de la home pasó de 10.215 a 7.238 en esos builds. Es una reducción del árbol visual, no una medición de velocidad en una conexión real.

La auditoría completa `37547083216`, sobre `946d01bd`, verificó las 20 rutas en escritorio y móvil: cero hallazgos funcionales, películas reproduciéndose en las 20 rutas y secuencias automáticas completas. La revisión de capturas incluyó los ocho servicios y contextos sectoriales de Constructoras, Salud, Industria y Gobierno.

El run `37547646212`, sobre `0a93cb05`, pasó Chrome y 20 combinaciones de WebKit (home, Constructoras, redes y software, en los cinco anchos). El run final `37547988816`, sobre `614c1213`, terminó correctamente en Chrome y WebKit: cero hallazgos funcionales. Sus capturas confirman la separación entre miniatura y UPS y la eliminación de etiquetas recortadas. WebKit verificó otras 20 combinaciones de ruta y ancho.

Después de `614c1213` se corrigió por inspección de la captura WebKit la herencia de color del panel oscuro dentro de la página clara de Software, fijando los tokens de texto en la raíz del componente. También se afinó contenido: una narración específica del distribuidor óptico evita explicar radioenlaces cuando el dibujo representa fibra. Prueba específica de sector y build correctos. WebKit sobre Linux comprueba compatibilidad del motor; no sustituye una prueba en un dispositivo Safari físico.

## Alcance conservado

Se mantienen la película grande de Blender de la home y las películas de sector existentes. Esta iteración no produjo nuevos renders Blender. No se modificaron la tipografía global del hilo paralelo, la campaña protegida, Directus ni producción. La rama sigue en el PR de integración; este documento no autoriza un release ni declara perfección visual.
