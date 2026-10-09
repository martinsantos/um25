# Software: jerarquía, transparencia y continuidad

## Hallazgo y criterio

La revisión de v12 frente a Hill, Ryan y Solvaix encontró profundidad geométrica pero poca jerarquía: contornos y textos posteriores competían con la capa protagonista. El contrato y el registro eran pequeños; la isometría acercaba piezas sin acompañar suficientemente sus conexiones. Las pruebas técnicas anteriores no acreditaban calidad visual equivalente.

Esta iteración se concentra en Software. No certifica la riqueza mecánica de Ryan ni la densidad de instalaciones de Solvaix en los demás sectores.

## Cambios implementados

- Isometría v7: contornos de estructura separados del detalle interior; vidrio menos saturado; contraste local en el formulario de aprobación. Los trazos completados pierden énfasis y el activo conserva su recorrido.
- Se retiró la segunda trama que atravesaba los campos de la API. Los campos muestran Proyecto, Responsable y Sede con mayor tamaño.
- La cámara sigue el traspaso hacia permisos, contrato y datos. La interfaz muestra su contexto antes de acercar el formulario; la persistencia acerca primero la orden y después el registro confirmado, sin clics.
- Las tablas reducen rótulos redundantes y aumentan el tamaño de valores. Se conserva una única proyección isométrica.
- Movie v13: planos de lectura para permiso, contrato y registro; cruce de perspectiva durante la transición. Se elimina la caja posterior completa y sus líneas duplicadas. El camino de la solicitud pasa por los márgenes de los paneles.
- El texto posterior se atenúa por separado de superficies y contornos. La escena no depende de acumular planos azules semitransparentes para señalar profundidad.
- Apertura y cierre comparten encuadre completo. Las dos composiciones conservan 60 fps y resolución nativa.

## Pruebas visuales y descartes

- Run 37972895465: rechazado. Persistían textos superpuestos detrás del contrato y del registro.
- Run 37973414756: la lectura del protagonista mejora; todavía se detecta recorte de la apertura.
- Run 37973840399: apertura corregida en escritorio y móvil. Se revisaron los PNG nativos y se mantuvo el margen exterior.
- Run 37974132318: 62 de 64 fragmentos completos. Dos fallos de preparación del entorno, anteriores a Blender. Recuperaciones puntuales: 37975575389 (mobile 270–299, completado) y 37977149467 (wide 780–809, completado). Entrega ensamblada e importada íntegra; registro de producción sin cambios.

## Comprobaciones

Pruebas dirigidas de mecanismo, carga diferida, recorrido autónomo y ciclo de vida aprobadas. Build Astro integrado con las seis piezas de v13 aprobado (13,24 s). Revisión en Chrome de escritorio y a 390 px: avance automático por etapas, contexto y acercamiento progresivo de datos; sin desborde horizontal. No hubo despliegue de producción.

## Dictamen

Los encuadres corregidos permiten distinguir el mecanismo principal y leer sus valores sin superponer textos de otras capas. Es una mejora verificable respecto de v12, no una declaración de equivalencia con las referencias. La secuencia completa está integrada y reproduce automáticamente en escritorio y móvil. El empalme vuelve al encuadre inicial. La revisión del movimiento detecta todavía superposición durante las transiciones entre planos y el regreso del registro a la interfaz: no se aprueba para producción con el estándar acordado. La riqueza de los demás servicios y sectores sigue fuera de esta corrección.

## Distancia restante frente a las referencias

- Hill: la jerarquía y la lectura de los planos principales mejoran. La interfaz ilustrada todavía ofrece menos variedad de controles, microdetalles y estados propios; no debe confundirse claridad con riqueza equivalente.
- Ryan: las capas de Software siguen siendo paneles de información. No acreditan el nivel de encuentros, espesores y componentes mecánicos de sus objetos.
- Solvaix: esta entrega no modifica la arquitectura ni las instalaciones de los sectores; esa comparación continúa abierta.

## Entrega y evidencia

- Preview: http://127.0.0.1:4326/software, con `UM_SOFTWARE_REVIEW=v13`.
- 960 fotogramas por composición, 16 s a 60 fps. Escritorio 3840 × 2160; móvil 2160 × 2160.
- 64 fragmentos verificados: autor, interfaz y geometría coincidentes; cobertura completa; concatenación sin recodificación; decodificación completa de ambas películas sin errores.
- Seis assets nuevos, 40.588.664 bytes. Ningún asset público existente reemplazado.
- 46 pruebas dirigidas finales aprobadas; controles previos de carga diferida y autonomía también aprobados.
- Evidencia nativa y manifiestos: `/Volumes/SDTERA/Codex UM25 audits/20261009/software-v13/delivery`.
- Capturas integradas: `/private/tmp/um-software-v13-isometry-desktop.png`, `/private/tmp/um-software-v13-isometry-mobile.png`, `/private/tmp/um-software-v13-banner-desktop.png`, `/private/tmp/um-software-v13-banner-mobile.png`.

## Corrección siguiente identificada

La envolvente de prominencia usa el máximo de dos capítulos durante el relevo; cuando ambos están a medio fundido, deja reaparecer la interfaz de fondo. La corrección deberá mantener su atenuación durante todo el tramo de lectura y escalonar la desaparición del registro antes de recuperar el inspector. Debe verificarse el movimiento completo, no solamente fotogramas de los intervalos estables.
