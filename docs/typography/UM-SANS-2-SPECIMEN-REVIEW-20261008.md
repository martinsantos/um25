# UM Sans 2 — revisión del specimen

Estado: implementación local para revisión. No publicada.

## Cambio

`/estilo/fuente` pasa de un catálogo breve a una hoja tipográfica completa: portada editorial, nueve pesos en romana y cursiva, laboratorio variable, cuatro composiciones, cifras, lectura, caracteres, detalles OpenType, escala, plantillas, integración y descargas.

La composición usa blanco, negro y papel con acentos rojos. El cuerpo de lectura es de 22 px en escritorio y 20 px en móvil, con valores intermedios en tablet. La misma corrección de lectura se aplica a las descripciones y secciones de la portada corporativa. Los títulos largos de servicios usan el ancho completo en teléfonos pequeños.

Las muestras usan los archivos publicados de UM Sans 2.0.0. Se verificaron las funciones presentes: `kern`, `ccmp`, `mark`, `pnum` y `tnum`, y el eje variable `wght` de 100 a 900. No se presentan como disponibles las alternancias de la familia histórica que no existen en estos binarios. El respaldo 1.2 está identificado para los caracteres adicionales. No se modificaron los archivos versionados de fuente.

## Verificación

- Build SSR de producción, TypeScript y lint sin errores. Lint conserva 13 advertencias previas.
- 58 suites y 431 pruebas existentes aprobadas.
- Auditoría CSS: cero errores comerciales, 10 advertencias existentes después de la revisión r2.
- Chrome/Playwright: siete anchos, de 320 a 1440 px; lectura, navegación, texto largo y ausencia de desborde horizontal.
- Laboratorio: los nueve pesos en romana y cursiva, tamaño, interlineado, espaciado, fondos y restablecimiento.
- Inspección de la fuente renderizada mediante Chrome: `UM Sans 2 Variable`, fuente web propia.
- Cifras: ocho unos y ocho ochos miden igual en tabulares y distinto en proporcionales.
- Kerning: el cambio altera efectivamente el ancho de los pares.
- Filtros de caracteres y códigos Unicode; los caracteres mostrados pertenecen al repertorio del manifiesto.
- Copiar código funciona y ofrece selección manual si el portapapeles está bloqueado.
- Los 58 enlaces a binarios responden correctamente; los recursos conducen a las plantillas revisadas.
- Build compilado comprobado nuevamente en 1440, 390 y 320 px, incluido el índice activo visible.
- Portada corporativa: 15 combinaciones de ruta/ancho aprobadas; ocho descripciones de servicios legibles y navegación al detalle comprobada.

La comprobación de navegador usó Playwright y Chrome instalados: el plugin Browser no estaba disponible. Capturas y resultados se guardaron en `/private/tmp/um-plantillas-revision-20261008/qa/`; los scripts de prueba manual están en su directorio padre.

## Alcance y pendientes

La validación visual corresponde a Chrome de escritorio con anchos móviles. No sustituye una revisión en Safari/iOS ni en dispositivos físicos. La auditoría estricta general de la portada y servicios conserva observaciones previas sobre metadatos pequeños y miniaturas; no se afirma que toda la web apruebe esa auditoría.

La publicación debe seguir feature → PR develop → PR master → GitHub Actions. Esta revisión no hizo cambios directos en producción.

La revisión visual posterior de las plantillas está documentada en `UM-SANS-2-PLANTILLAS-REVIEW-20261008.md`.
