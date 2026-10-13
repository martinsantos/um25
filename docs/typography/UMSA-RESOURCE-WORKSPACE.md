# Recursos y editor UMSA

La biblioteca `/estilo/fuentes/plantilla` usa un índice con las seis plantillas y su propósito. En celular se eligen con un selector, sin una barra horizontal de navegación. La navegación común permite volver a UM Sans 2, la biblioteca o el editor.

`/estilo/fuentes/editor?documento=<id>` permite cambiar entre las cuatro plantillas de documento sin perder su borrador. La oferta completa tiene variantes vacía y de ejemplo ficticio. Se pueden editar textos y celdas, agregar párrafos, títulos, tablas e imágenes con comentario opcional. El PDF conserva la marca vectorial, UM Sans 2 incrustada, cabeceras grises, numeración con punto final e imágenes centradas sin fondos agregados. Los saltos de sección se adaptan para evitar páginas casi vacías.

Los borradores y PDFs se guardan en IndexedDB de este navegador y este dominio. No se sincronizan entre equipos ni se envían al servidor. Borrar los datos del navegador también los elimina. «Descargar editable» guarda un HTML independiente recuperable desde el mismo editor; «Mis PDFs» permite abrir o descargar cada exportación, y agregar PDFs descargados desde Google.

Las planillas económica y de costos se editan en Google Sheets mediante una copia propia, conservando sus fórmulas. El cotizador PC-2505 tiene las ocho hojas originales y campos financieros vacíos. Los PDFs de Sheets se exportan desde Google y se agregan manualmente a la bandeja local. El editor local no ejecuta fórmulas XLSX.

Los destinos de Google se definen en `src/data/brandTemplates.ts`: seis plantillas y un ejemplo ficticio, dentro de la carpeta «UMSA · Plantillas para la web · r7». Son copias de publicación con acceso de lector mediante vínculo. El enlace `/copy` abre el proceso nativo de copia en la cuenta de Google del visitante. Google puede pedir iniciar sesión. Google utiliza su tipografía disponible; la marca y el formato son independientes de la fuente personalizada incrustada en los PDFs y archivos Word/Excel.

La entrega r7 de archivos se conserva sin cambios. El cambio de navegación y editor se integra primero a develop y se promueve por PR a master con GitHub Actions. No se crea un control periódico: el usuario lo canceló expresamente.

Verificación: lint, TypeScript, contrato CSS, pruebas de sanitización/guardado/paginación y suite del repositorio; vistas de escritorio y móvil; PDF de cada plantilla de documento, imágenes transparentes y comentario seguido por texto; enlaces de Google y sus permisos leídos nuevamente después del cambio.

La entrega local `2026.10.13-r8` amplía el aire después de tablas y listas en Word/ODT/PDF, HTML, lectura web y exportación del editor. El espaciado de continuidad de párrafos permanece menor. Los borradores ya guardados reciben el ajuste mediante CSS. Las copias nativas de Google conservan la revisión r7; el enlace sigue abriendo una copia editable. Los XLSX son idénticos a r7.

Validación r8: TypeScript, lint de los archivos modificados, contrato CSS, 61 suites/455 pruebas, compilación Astro de producción y vista local compilada; 16 páginas Word/PDF inspeccionadas y prueba tabla → párrafo sin contacto con el borde.
