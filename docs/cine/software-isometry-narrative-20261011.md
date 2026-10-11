# Software · narración isométrica integrada

La película Blender v27 se conserva. Debajo, la isometría explica la misma orden 0248 y después cómo se entrega y sostiene la aplicación.

## Cambio de ritmo y sentido

- Contexto inicial: de 5.500 a 900 ms. El primer mecanismo ya no espera otros 1.100 ms para empezar.
- Secuencia completa: de 60 a 37,8 segundos. Cada capa tiene su tiempo de lectura; permisos recibe más tiempo que la interfaz.
- Seis capítulos visibles y tres frases sincronizadas por capa: entrada, mecanismo y resultado.
- Interfaz → identidad/rol/alcance → contrato → registro/confirmación. Entrega de versiones e infraestructura se explican después como responsabilidades del producto, sin representar una solicitud HTTP atravesando un pipeline de publicación.
- La orden sólo cambia a aprobada después de completar la respuesta de datos.
- El reloj deja de descartar tiempo cuando un frame tarda más de 80 ms. Cámara, mecanismos y texto mantienen el ritmo real.
- La pausa y la salida de pantalla congelan el mecanismo. Se conserva el estado estático completo para movimiento reducido.
- El cierre se acorta para dejar espacio a la ilustración en móvil.

## Integración

Runtimes nuevos e inmutables: `software-system-v8.js` y `discipline-runtime-v9.js`. Los SVG y películas anteriores no se sobrescriben. Se integra en `/software`, la ficha 104 y los recorridos que incluyen esa disciplina. El resto de las disciplinas conserva sus tiempos.

Revisión en Chrome: recorrido autónomo con capítulos y explicaciones cambiantes, confirmación de la misma orden, pausa sostenida y reanudación sin saltos. La pausa mantuvo el mismo texto y el tiempo 5646 ms hasta reanudar. Sin errores de consola. A 390 × 844, el recorrido continúa solo y no desborda horizontalmente. La captura móvil requiere coordenadas de página, incluyendo el desplazamiento; usar y=0 captura la apertura de la página, no la región isométrica visible.

Validación final: 77 pruebas en cuatro suites, typecheck y build correctos. Lint: cero errores y diez advertencias preexistentes. Home, Software, ficha 104 y los seis sectores revisados responden 200; ambos runtimes nuevos se sirven correctamente. Evidencia en `software-isometry-narrative-20261011/`.

## Obras · revisión de la referencia pendiente de nueva producción

Se revisaron los seis vídeos nativos existentes en sus planos de contexto (4 s) y aproximación (12 s), junto a la referencia de [Solvaix](https://x.com/Solvaix/status/2106830508797706560). Son piezas de 18 s, 1920 × 1080 y 24 fps. Esto documenta los materiales actuales, no una nueva entrega de películas de obras.

| Escena | Hallazgo | Dirección de la siguiente producción |
| --- | --- | --- |
| Constructoras | Los pisos se reconocen, pero las conexiones rojas atraviesan el espacio sin montantes o bandejas distinguibles. El primer plano termina en el rack. | Edificio como referencia fija; montante, bandeja, derivación y terminal legibles. Separar capas conservando sus anclajes. |
| Salud | Las camas sitúan el sector, pero la aproximación abandona la atención para repetir el rack. | Seguir el puesto de atención, su conexión, distribución y respaldo, manteniendo el contexto de cada sala. |
| Aeropuertos | Mostradores y asientos cambian la escenografía; el primer plano es el mismo cuarto técnico. | Seguir un acceso o mostrador hasta sus sistemas de red, seguridad y operación. |
| Industria | Maquinaria simplificada y líneas de un solo color; poco detalle en la instalación que la conecta. | Mostrar gabinete, canalización, paso protegido y punto de conexión en una línea concreta. |
| Minería | Antenas y terreno tienen poco protagonismo en la aproximación. | Extremos del enlace, línea de vista, terminación y operación local como recorrido específico. |
| Bodega | Tanques y línea de fraccionamiento conservan mejor el contexto, pero faltan capas técnicas distinguibles. | Mantener esa composición y detallar campo, transporte, registro y respaldo dentro del mismo proceso. |

En el autor `render-site-project-v2.py`, `camera_pose` interpola entre `poses[0]` y `poses[2]`; ignora `poses[1]`, el punto de operación específico de cada sector. Esto explica la repetición observada del acercamiento al cuarto técnico. Corregir sólo la cámara no resolverá la riqueza de la referencia: faltan rutas físicamente coherentes, jerarquía de sistemas, detalle en encuentros y una separación de capas que conserve el edificio como referencia.

Los nuevos renders de obras todavía no están producidos. La preview local combina la película v27 y la nueva narración isométrica de Software con las películas de obras existentes para revisar el conjunto. No se desplegó producción.
