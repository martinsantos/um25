# Plantillas y presentación — revisión r4

## Corrección de tabulados y línea izquierda — 10 de octubre

- Todos los números comienzan en la misma línea izquierda que el cuerpo y las tablas, dentro del bloque. Un espacio tipográfico de 0,25 em separa cifra y título. Se conserva numeración automática, tamaños proporcionales y estilos de tres niveles.
- Se descartan los tabulados amplios y la variante con números colgados fuera del cuerpo, siguiendo la indicación final del usuario. HTML y lectura web usan el ancho natural del número y una separación de 0,25 em.
- Ritmo de lectura: 8 pt entre párrafos normales; antes de títulos 24/18/16 pt por nivel, después 6 pt. Entre títulos consecutivos se reduce el espacio previo a 8 pt.
- Se revisan números de dos cifras y 10.12.1, los títulos largos y el paginado completo. Word, DOTX, ODT, PDF, SVG y HTML se actualizan en el paquete nuevo 2026.10.10-r4.
- Los tres XLSX y sus PDF mantienen exactamente sus bytes aprobados de r3. Las fuentes publicadas son inmutables.
- La conversión nativa a Google sustituye UM Sans 2 por Arial y aplica tabulados predeterminados cuando el Word usa un espacio. Las copias de comparación se adaptan para mantener los números dentro del bloque y un espacio corto; requieren revisar los tabulados al cambiar la cantidad de cifras de una numeración. No se declara identidad tipográfica con el PDF original.
- El usuario autorizó publicar con las comprobaciones de LibreOffice y PDF, sin esperar al visor integrado. Microsoft Office nativo sigue sin comprobación directa.
- El primer despliegue de r3 se revirtió correctamente porque el auditor exigía el enlace del ZIP histórico 2.0.0. El auditor verifica ahora el paquete vigente, manifiesto y cada archivo, manteniendo los controles de fuentes y descargas anteriores.

## Historial de revisión r3


Estado: revisión local; no publicada. Ruta: `/estilo/fuentes/plantilla`.

## Corrección del presupuesto tras revisión del usuario

- Se revisaron los XLSX y PDF concretos descargados por el usuario. La composición anterior tenía totales desplazados respecto de la tabla, datos de oferta estrechos, una hoja de Parámetros que desperdiciaba el A3 y tablas partidas en páginas de continuación casi vacías.
- Resultado usa una sola grilla desde el encabezado hasta los totales, con iguales márgenes interiores. Cliente/proyecto y proveedores tienen campos amplios; los títulos de columna se alinean con su contenido y Cantidad permanece completa.
- El libro vacío imprime cuatro páginas: Resultado y Parámetros en A4 apaisada; Costeo y Proveedores en A3 apaisada. Se conserva UM Sans 2 de 12 pt en el cuerpo, 11 pt en encabezados y 20 pt en títulos, sin reducción de escala.
- Costeo y Proveedores conservan 30 filas. El encabezado completo se repite si se amplía la impresión, y se fijan las primeras trece filas y las dos columnas iniciales para trabajar con la grilla. Los textos extensos requieren ajustar el alto de su fila antes de imprimir.
- La revisión con datos ficticios incluye un proyecto de dos líneas, fechas, código `0001`, moneda ARS, porcentajes y selección de proveedor. La entrega restaura todos los campos vacíos salvo la jornada base de 8 horas. Los cálculos originales se conservan.
- Se actualizan XLSX, PDF, SVG de impresión, vista web derivada, manifiesto y ZIP del borrador r3. La publicación sigue pendiente del control del visor del usuario.

## Planillas reales y revisión r3 — 9 de octubre

- Se reformatearon copias privadas de las dos referencias reales con UM Sans 2 de 12 pt, columnas y filas ajustadas, cabeceras y fuentes de datos diferenciadas. Se conservaron constantes, texto exacto de fórmulas, valores almacenados, nombres de rango, validaciones y demás partes de los archivos; cambió el formato y la marca histórica de impresión. Los archivos originales del disco externo no se modificaron ni se incluyen en el sitio.
- La comparación original tiene tres fórmulas con referencias `#REF!`: Parámetros G2 y Cuadro de resultado I21/I22. Se mantienen, porque las hojas o celdas de origen que faltan requieren reconstrucción; no se presenta esa copia como un modelo reparado.
- Se agregó un libro público vacío con Resultado, Costeo, Parámetros y Proveedores. Admite 30 componentes por renglón/código y sector/piso, costos USD/ARS, tarifas DH/HH, márgenes sobre venta, imprevistos, bonificación e IVA sobre el neto. El precio seleccionado en Proveedores se traslada manualmente a Costeo, con su código y moneda.
- Se verificaron cero, datos incompletos, margen faltante, tipos de costo, tarifas automáticas, moneda y selección de proveedor. LibreOffice recalculó la prueba ficticia: total USD 335,41, ARS 335.410,00 y total del proveedor elegido USD 180,00. La entrega restaura los campos vacíos.
- El PDF del libro tiene seis páginas: resultado A4 apaisada y tablas internas A3 apaisada. Cabeceras repetidas, marca vectorial y alineación con la regla dentro de 0,2 pt. La calibración modifica sólo la posición horizontal de cada marca, sin cambiar su proporción ni sus trazos.
- La variante de XLSX con SVG principal funcionó en Artifact Tool y LibreOffice, pero el usuario no vio la marca en su visor. Se descartó. La entrega conserva un PNG principal visible, con suavizado sobre fondo blanco, más el SVG de Office para impresión. La nitidez en el visor del usuario sigue pendiente; no se autoriza su publicación basándose en un render alternativo.
- Paquete nuevo `2026.10.09-r3`, con 43 archivos y manifiesto SHA-256. Las fuentes de `v2.0.0` permanecen intactas. El catálogo incorpora el libro interno y mantiene las plantillas de oferta, resumen, membrete y planilla económica.
- Los ODT incrustaban Arial Unicode y Courier aunque los documentos utilizan UM Sans 2. Se retiraron esos recursos no utilizados de los paquetes generados, conservando las cuatro fuentes UM Sans 2: el ZIP pasa de 46,68 a 2,00 MB. Las exportaciones ODT mantienen exactamente el texto, el paginado 1/3/1 y las fuentes de lectura de los PDF revisados.
- En la base actual de `develop`, `npm run check` pasó: 60 suites, 445 pruebas, TypeScript, auditoría CSS y build SSR; lint conserva 12 advertencias existentes y ningún error. La entrega compatible sigue pendiente de la comprobación en el visor del usuario.

## Nitidez de la marca en XLSX — 9 de octubre

- El PNG de 2527 × 224 px se veía dentado al reducirse en el render de la planilla a 100 %. Subir su resolución no corregía ese resultado. La alternativa de pantalla ahora tiene 408 × 36 px, reducción Lanczos y un ancho de membrete de 204 px con desplazamiento horizontal entero.
- Se importaron los dos XLSX finales y se compararon sus renders a 100 % y a doble resolución con las versiones anteriores: los bordes conservan el suavizado. Datos, fórmulas y formato de todas las celdas de A1:F38 permanecen iguales.
- Los XLSX conservan el mismo SVG oficial. Ambos PDF de LibreOffice siguen teniendo 19 trazos vectoriales y ninguna imagen de mapa de bits, en una página A4. El PNG de Word no cambió.
- Un SVG con alternativa PNG transparente fue descartado: al importar ese XLSX, el render no mostró la marca. Se conserva una alternativa raster visible para esos visores.
- Evidencia: `qa/oferta-economica-despues-1x.png`, `qa/ejemplo-economico-despues-1x.png` y sus versiones `2x`, obtenidas de los archivos guardados. El visor integrado de la aplicación no pudo inspeccionarse directamente; la comprobación visual corresponde al render de Artifact Tool y a los PDF de LibreOffice.

## Lectura completa y ejemplo de licitación — 9 de octubre

- Un documento visible por vez, seleccionado desde un índice que permanece accesible al leer. Las vistas crecen con su contenido: no hay scroll vertical interno ni bloques de texto recortados.
- La planilla económica ocupa el ancho completo. Todas las columnas y los importes se ven desde 1024 px; en móvil la tabla conserva su tamaño legible y permite desplazamiento horizontal dentro de la tabla, sin desbordar la página.
- Controles para alternar entre ejemplo completado y plantilla vacía. La selección se conserva en la URL y funciona al volver atrás; la vista A4 y el enlace al PDF corresponden al modo seleccionado.
- Ejemplo ficticio de licitación con cliente, alcance, arquitectura, entregables, cronograma, tres renglones de inversión y condiciones. Word, HTML y Excel comparten los mismos datos y totales: subtotal USD 5.294,12; impuestos simulados USD 210,00; total USD 5.504,12.
- El ejemplo de Word y el HTML impreso tienen cuatro páginas. Tabla económica y total permanecen juntos en la tercera; las condiciones ocupan la cuarta. Se revisaron visualmente todas las páginas. El Excel del ejemplo imprime en una hoja A4.
- Las plantillas vacías siguen disponibles como descarga principal; los ejemplos se descargan desde «Otros formatos y ejemplo». El ZIP incluye 40 archivos con manifiesto SHA-256 comprobado.
- Comprobación en navegador integrado a 1440, 1024, 768, 390 y 320 px: cuerpo de 20 px, una vista activa, página sin overflow horizontal, selectores, historial, ampliación y PDF correcto. Las cuatro vistas completas conservan altura natural.
- Build, TypeScript y lint pasan; 58 suites y 431 pruebas pasan. Se mantienen las advertencias existentes de lint y CSS.

Evidencia nueva: `qa/r2/complete-reading-browser.json`, `qa/r2/planilla-completa-final.jpg`, `qa/r2/ejemplo-licitacion/`, `qa/r2/excel-print/ejemplo-economico.pdf` y `qa/r2/html-ejemplo-licitacion.pdf`, dentro del directorio temporal de revisión indicado más abajo.

## Corrección visual

- Marca oficial sin alterar sus trazos, recortada al contorno visible. En la carta con membrete se alinea a la izquierda con el asunto y el cuerpo; en las ofertas y Excel, al extremo derecho de la regla. Ancho de 54 mm en Word/HTML; Excel conserva la proporción y la alineación al imprimir.
- Título de documento de 22 pt y cuerpo de 12 pt. Encabezados y numerales de 16, 13 y 12 pt, con tabulaciones colgantes de 12, 17 y 23 mm.
- Cabecera con datos alineados; oferta completa de tres páginas, resumen de una y carta con membrete de una. La carta incorpora saludo, desarrollo, cierre y firma.
- Planilla económica con 15 renglones, campos de cliente/proyecto y totales, en una hoja A4 inicial. Se mantiene la posibilidad de páginas adicionales al extender filas.
- La página de recursos muestra el contenido real de las cuatro plantillas a tamaño de lectura. Los textos se derivan del HTML y del XLSX entregados, con cuerpo de 20 px, tablas de 18 px y numerales del mismo tamaño que su título. En tablet y móvil usa una columna. La composición A4 exacta sigue disponible mediante «Ver hoja A4», con ampliación y acceso al PDF completo.
- Marca web vectorial, alineada por el contorno visible con la regla; 250 px en escritorio y hasta 230 px en móvil. El encabezado más compacto da prioridad a las plantillas. Cabecera exacta `RECURSOS MARCA UMSA`.
- DOCX, DOTX y XLSX incorporan la marca SVG con PNG alternativo. La exportación actual de LibreOffice conserva los trazos vectoriales en los PDF. La extensión utilizada se documenta en [Microsoft SVGBlip](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.office2019.drawing.svg.svgblip?view=openxml-3.0.1).
- En Excel, margen interior en las descripciones y separación entre fecha y moneda, comprobados con datos de ejemplo.

## Comprobaciones

- Inspección de todas las páginas de los documentos finales y sus versiones HTML impresas. Word/HTML: 3, 1 y 1 páginas. Excel: 1 página, tanto vacío como con el ejemplo.
- Todos los textos de los PDF revisados usan UM Sans 2; no hay fuentes serif de sustitución. La marca del membrete coincide con el margen izquierdo de 25 mm dentro de 0,2 pt; las ofertas conservan el margen derecho. En Excel coincide con el extremo de la regla dentro de 0,2 pt.
- Documento de prueba de cinco páginas con títulos largos, numeración de dos cifras y nivel `10.12.1`. Documento adicional de siete páginas con una sección insertada, cambio de nivel y tabla extendida: renumeración automática y cabecera repetida verificadas visualmente.
- Siete casos de fórmulas: decimales, cero, importes grandes, filas inicial/intermedia/final, datos incompletos y restauración vacía. LibreOffice Calc recalcula 5.294,12 de subtotal y 5.504,12 de total en el ejemplo ficticio.
- Chrome: 1440, 768, 390 y 320 px, sin desborde horizontal de página; cuatro previews cargados, diálogo, ampliación/hoja entera, Escape y devolución del foco, también en el build SSR compilado. Los enlaces de formatos responden y el XLSX descargado coincide byte por byte con la entrega.
- Los tres HTML incorporan la fuente, permiten editar/guardar y se imprimen en Chrome sin cortar la marca.
- Build SSR, TypeScript y lint sin errores; se conservan las 13 advertencias previas de lint.
- Control adicional en el navegador integrado: 1440, 768, 390 y 320 px; cuerpo a 20 px, marca alineada a la regla, cuatro vistas A4, ampliación, Escape y devolución de foco. Desplazamiento horizontal de tablas por teclado. Orden semántico de títulos corregido.
- Manifiesto y ZIP comprobados byte por byte; los ocho archivos de Office contienen el mismo SVG de la vista web y conservan la alternativa PNG.
- Membrete revisado de nuevo tras cambiar la alineación: DOCX, DOTX, ODT, PDF, HTML editable e impresión HTML, SVG, miniatura y ZIP actualizados. El cambio de Word/DOTX sólo modifica `word/header1.xml`; fuente, contenido y estilos permanecen intactos. Control visual de página completa en PDF y HTML impreso.

Evidencia y capturas: `/private/tmp/um-plantillas-revision-20261008/qa/r2` y `qa/odt-compact`. Fuentes de generación: `scripts/typography/templates-v2/`. Entrega actual: `public/downloads/plantillas-um-sans/2026.10.09-r3/`, con manifiesto SHA-256 y ZIP.

## Límites

Control final del 10 de octubre: se revisaron las cuatro hojas del XLSX guardado, las cuatro páginas vacías y las cuatro páginas con datos ficticios. Se corrigió el margen numérico que Calc ignoraba en ciertas celdas; importes, subtotales y totales de Resultado comparten el borde dentro de 0,05 pt. El PDF conserva cuerpo de 12 pt, títulos de 20 pt y marca vectorial completa alineada a la regla. Las 233 fórmulas coinciden con el XLSX aportado por el usuario. El control se conserva en `qa/r4/final-control.py` y `qa/r4/control-*.png`, fuera del paquete público.

La impresión y el cálculo de Office se comprobaron mediante LibreOffice; Microsoft Word y Microsoft Excel no están instalados en esta Mac. No se certifica su interacción nativa de teclado. Chrome se probó con anchos móviles, no en Safari/iOS ni dispositivos físicos.

La publicación sigue feature → PR develop → PR master → GitHub Actions. Ninguna operación de esta revisión escribió en producción.
