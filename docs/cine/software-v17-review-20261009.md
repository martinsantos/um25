# Software v17 · capas legibles durante el recorrido

## Resultado buscado

Una misma operación recorre identidad, rol, alcance, contrato y registro. El POV cruzado permite ver cómo se relacionan las capas. El detalle debe seguir siendo legible durante el giro, con una jerarquía clara entre protagonista, conexiones y contexto. La isometría existente se conserva.

## Corrección de composición

Se separaron los permisos en tres superficies con profundidad y conexiones continuas; se acercó la cámara a los mecanismos; los campos de origen se elevaron respecto del destino y el registro recibió espesor posterior. Se despejaron el título y la columna izquierda del registro. Los campos legibles tienen fondos estables; la estructura amplia conserva transparencia.

## Descarte y corrección de render

La v16 no se integró. Aunque sus planos de lectura resultaban legibles, al reproducir la secuencia se detectó pérdida de campos durante el giro, en el fotograma 492. La revisión nativa confirmó que no era una carga incompleta del navegador.

Las superficies tenían su origen en el sistema global del panel, fuera de su centro geométrico. Se centraron sus mallas y sus contornos conservando las coordenadas de la escena. La tipografía y las conexiones se dibujan con cobertura que respeta la profundidad. Los contornos inactivos se retiran para no introducir ruido; los campos de lectura usan bases opacas, mientras la estructura utiliza transparencia.

El orden de superficies transparentes por origen de objeto está documentado en el [manual de EEVEE](https://docs.blender.org/UATEST/manual/en/dev/render/eevee/material_settings.html). Esta limitación técnica explica un defecto concreto de la implementación; no sustituye la comparación estética con las referencias.

## Evidencia de iteración

- `37995575770`: centrar mallas recuperó parte de los textos, pero no todo el contenido.
- `37995944551` y movimiento `37995999741`: recuperada la tipografía; detectado granulado de contornos inactivos.
- `37996297212`: contornos limpios, pero una conexión se interrumpía al atravesar el plano transparente. Se descartó esa combinación.
- `37997068790`: prueba de permisos, giro, contrato y registro con tipografía y conexiones que respetan profundidad, contornos inactivos retirados y fondos estables en campos de lectura.

## Comprobaciones

- 72 pruebas relevantes de Software, recorrido autónomo e integración: correctas.
- Typecheck: correcto.
- Auditoría del autor: 1200 posiciones de cámara y secuencia causal.
- Auditoría de encuadre con avances reales de UM Sans: 96 combinaciones de texto/composición permanecen dentro del cuadro cuando alcanzan su visibilidad completa. Esta prueba no evalúa oclusión ni acabado visual.
- Prueba final `37997068790`: ocho fotogramas nativos revisados en escritorio y móvil. Los tres campos y sus conexiones permanecen visibles; los contornos inactivos ya no ensucian la lectura.
- Secuencia completa `37997571485`, autor congelado `f4ae8b90`: 80 fragmentos ensamblados con dos recuperaciones aisladas. 1.200 cuadros nativos por composición, 60 fps, decodificación completa y hashes verificados.
- Importación inmutable y build con `UM_SOFTWARE_REVIEW=v17`: correctos.
- `/software` y servicio 104: HTTP 200 y selección v17; películas y posters responden HTTP 206 a peticiones Range.
- Chrome, escritorio y 390 × 844: reproducción automática, avance y reinicio del bucle, captions sincronizados, pausa/reanudación y selección del vídeo cuadrado comprobados. Sin overflow horizontal ni errores de consola observados.

## Recuperación de fragmentos

La generación completa tuvo dos fallos de preparación del runner (timeout de instalación de dependencias, antes de ejecutar Blender). Se recuperaron de forma aislada con la misma revisión `f4ae8b90`: móvil 930–959 mediante `38000377528` y escritorio 1140–1169 mediante `38000820660`. El ensamblador valida hashes de autor, geometría y UI para impedir mezclar iteraciones.

## Comparación y alcance

La referencia de Hill sigue siendo el criterio para densidad funcional, diversidad de componentes, POV y fluidez. Se comparan los resultados renderizados, no sólo la resolución o la cantidad de geometría. Las referencias de Ryan y Solvaix orientan el detalle del sistema general, pero esta entrega modifica únicamente el render de Software.

La bandera local `UM_SOFTWARE_REVIEW=v17` selecciona la candidata en `/software` y el servicio 104. El registro de producción permanece intacto. No se declara equivalencia estética con todas las referencias ni autorización de publicación por el solo hecho de superar las pruebas técnicas.

## Comparación de planos nativos

El plano de contrato de la candidata (fotograma 630) se comparó con el plano de interfaz de Hill (`07.png`, extraído del original 4K). Ambos conservan POV oblicuo, contornos finos y una superficie protagonista legible. La candidata permite seguir tres correspondencias de datos sin cruzar los campos. Hill sigue teniendo mayor densidad de interfaz y variedad de componentes: tablas, controles, indicadores y niveles de lectura. La candidata es más esquemática; no se presenta como indistinguible.

En móvil se revisaron contrato y registro a 2160 × 2160. Los campos permanecen completos dentro del encuadre. La profundidad posterior ya no atraviesa la columna izquierda del historial. En la prueba integrada a 390 × 844, los microdetalles son principalmente visuales: la explicación legible la proporciona el caption del banner. No se afirma que todos los campos de la interfaz puedan leerse cómodamente a esa escala.

## Entrega integrada y límite de calidad

Película escritorio: 41.916.859 bytes; móvil: 22.329.732 bytes. Se conservan resolución nativa y 60 fps. Se verificaron carga por tramos y arranque en local; esto no mide rendimiento bajo conexiones móviles reales.

La reproducción completa se contrastó con el original de Hill en un visor local, además de los planos nativos. La candidata mejora continuidad de conexiones y lectura de las capas. Persiste una diferencia de densidad y variedad de interfaz; algunas transiciones de transparencia muestran tramado fino. Esta entrega no alcanza una calidad indistinguible de la referencia y no constituye GO a producción.

Evidencia de integración: [escritorio](software-v17-evidence/desktop.png), [móvil](software-v17-evidence/mobile.png). La preview queda en `http://127.0.0.1:4326/software`, con la reproducción reanudada y el viewport de escritorio restaurado. El PR #266 sigue draft hacia develop.
