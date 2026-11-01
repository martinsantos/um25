# Cierre local de navegación, contenido y Directus

1 de noviembre de 2026. Rama `feature/integracion-despiece-20261101`, PR 541 en borrador.
Vista de revisión: http://127.0.0.1:4381/ . **No publicar hasta la revisión del usuario.**

## Cambios para revisar

- Desplegables con miniaturas relacionadas con cada uno de los ocho servicios y nueve sectores. Encabezado común, ejes alineados, códigos junto al título y subtítulos legibles. Se conservan todos los destinos originales.
- Menú móvil con acceso directo a esos destinos mediante dos grupos desplegables, conservando también los enlaces a los índices. Foco limitado a controles visibles; Escape cierra y devuelve el foco. La preferencia de movimiento reducido se respeta.
- Cierres de contacto específicos para los ocho servicios. Las seis capacidades de cada servicio, sus PDF y enlaces existentes permanecen.
- Las cifras y los listados de clientes excluyen la etiqueta genérica «Cliente Confidencial»; las obras se conservan y los indicadores aclaran «clientes identificados».
- Treinta y dos asignaciones de servicio respaldadas por texto de origen. Se conservan los 518 IDs de Directus y las dos obras en curso de SGI: 520 fichas.
- Fichas 9001/9002 con imágenes contextuales identificadas como tales y leyendas legibles en móvil. Se omiten secciones de alcance vacías y se distingue el alcance documentado de capacidades generales relacionadas.
- Las ilustraciones de edificios sólo aparecen cuando hay sistemas físicos y un sector conocido. Software, soporte y consultoría no reciben un edificio por defecto. Las películas y despieces específicos de los servicios se conservan.

## Segunda pasada de integración

- Contacto presenta el formulario antes de los datos secundarios en móvil y elimina la llamada a contacto duplicada. «Contactar» enfoca el formulario existente y respeta movimiento reducido.
- Documentación ofrece un acceso directo a las ocho fichas PDF. Las anclas dejan espacio bajo la cabecera fija.
- El lector completo del blog conserva el texto de producción y añade un índice desplegable en móvil. Sus enlaces temáticos usan su texto visible como nombre accesible.
- Paginación del blog con `page`, redirección de `p`, canonical propio por página/categoría y 404 para categorías o páginas inexistentes. Una respuesta vacía válida de Directus ya no dispara una copia alternativa obsoleta.
- Los errores de fichas, servicios, sectores y artículos muestran una página 404 navegable. Toda la vista previa, incluidas las páginas heredadas, queda marcada como no indexable; producción conserva su política de indexación.
- Se cierran extractos truncados antes de las palabras incompletas y cuatro casos enlazan directamente a su ficha verificada por cliente, fecha y alcance. El archivo de origen se conserva íntegro.
- Cabeceras secundarias más proporcionadas, metadatos de 16 px y métricas de la página en inglés alineadas sin una columna huérfana.

## Validación ejecutada

- `npm run check`: lint, tipos, auditoría CSS, 582 pruebas en 78 suites y build correctos.
- El control completo se repitió tras los ajustes finales de movimiento reducido y clientes identificados. Quedan avisos preexistentes de lint sin errores; el build conserva el aviso de tamaño de pdfmake.
- Matriz de servicios y sectores: 19 rutas × cinco anchos (1440, 1280, 834, 390, 360) y dos menús: **97 controles aprobados**, sin overflow, imágenes rotas, textos internos detectados ni errores de JavaScript. Incluye 38 auditorías axe WCAG A/AA en escritorio y móvil.
- Menús con miniaturas a 1440, 1280, 1120, 834, 390 y 360: ocho/nueve imágenes decodificadas, apertura/cierre y ausencia de overflow.
- `scripts/propuesta/parity-control.mjs`: navegación, enlaces de producción, inglés, seis capacidades por servicio, búsqueda/orden/filtros/SSR del catálogo, contacto, películas, despieces y móvil aprobados. Sin enviar formularios.
- QA independiente de escritorio y móvil a 390 px: axe sin infracciones en menús abiertos/cerrados, Escape restaura foco y los enlaces ocultos no reciben Tab. Fichas 9001/9002 en 1440/390 px: leyendas completas, imágenes cargadas y ningún edificio genérico en 9002.
- Tras corregir clientes identificados: nueve vistas de portada, Software y Gobierno a 1440/390/360 px; sin overflow ni infracciones axe, y sin etiquetas anónimas en el ranking de clientes.
- Preview SSR autenticado contra Directus actual: Servicios (8), Antecedentes (518) y blog_posts (440). Registro de consultas sólo con ruta/estado: respuestas 200; fallback HTML público del blog desactivado. No se alteraron datos, permisos ni secretos.

### Controles de la segunda pasada

- Barrido final `scripts/propuesta/control.mjs` con axe WCAG 2/2.1 A/AA y buenas prácticas: **138 comprobaciones aprobadas, cero fallos**. Incluye todas las páginas principales en cuatro anchos, ocho servicios y nueve sectores en escritorio/móvil, muestra de ocho fichas en tres anchos, 169 enlaces internos y 168 imágenes/medios. Quedaron 231 capturas. El listado del blog mide 7,8 pantallas en móvil (presupuesto 8); el artículo conserva sus 817 palabras y los cinco destinos de su índice. La longitud íntegra del artículo se informa como advertencia en escritorio/tablet, sin recortar su texto.

- 24 vistas de contacto, documentación, inglés, paginación, artículo y 404 a 1440/834/390/360 px: sin infracciones axe WCAG 2 A/AA y 2.1 A/AA, desbordes ni errores JS. Se probaron foco del formulario, descargas, anclas e índice móvil, más siete casos de redirección/404.
- `integration-smoke.mjs`: 37 rutas, 520 fichas indexadas y 615 recursos accesibles. `parity-control.mjs` volvió a pasar navegación, menús, filtros, orden, búsqueda y contacto sin envíos.
- Cotejo del artículo «InfluxDB 3 en cooperativas»: los 28 bloques y 5.146 caracteres de texto visible coinciden exactamente con producción (SHA-256 iguales), sin bloques perdidos ni añadidos.
- El control remoto del commit anterior detectó nombres accesibles inconsistentes en enlaces del lector y exceso de altura en el listado móvil; ambos se corrigieron. También exigía edificios donde deliberadamente no corresponden y medía el artículo íntegro con el presupuesto de una versión recortada. Se corrigieron esas dos expectativas: sólo se exige un SVG cuando hay un escenario previsto; la altura del artículo se informa y se controla que mantenga cuerpo, portada e índice completo. El resto de presupuestos y controles axe se mantienen.

## Límites reales

El diseño está preparado para la revisión local; el catálogo no puede declararse editorialmente completo. El corte vivo tiene 155 fichas sin sector asignable, 68 sin servicio y 91 con resúmenes inferiores a 60 caracteres. Este último umbral es una señal de auditoría, no un juicio automático sobre la calidad. Tres sectores potencialmente identificables en el snapshot no se asignaron porque el texto vivo no contiene esa evidencia. Las fotografías editoriales no acreditan una fotografía real de obra.

Directus deniega `/assets` incluso para un archivo con metadata accesible, y la colección productos conserva su respaldo local. Las rutas integradas comprobadas usan imágenes locales; no se ampliaron permisos de producción para ocultar ese problema. La lectura de contenido autenticado sí quedó comprobada en el preview.

Detalles: [catálogo](catalogo-evidencia-editorial-20261101.md), [Directus](directus-validacion-20261101.md), [paridad](revision-paridad-20261101.md).

## Evidencias y reproducción

Artefactos locales, fuera del repositorio:

- `/private/tmp/umsa-integration-full-control-20261101/informe.md`: 138 comprobaciones finales y 231 capturas.
- `/private/tmp/umsa-second-integration-20261101/results.json`: 24 vistas, capturas y controles de interacción.
- `/private/tmp/umsa-second-parity-20261101/`: nueva pasada de paridad funcional.
- `/private/tmp/umsa-article-parity-final.json`: cotejo íntegro del artículo con producción.
- `/private/tmp/umsa-menu-final-20261101/`: menús por ancho.
- `/private/tmp/umsa-final-acceptance-20261101/results.json`: 97 resultados y capturas.
- `/private/tmp/umsa-editorial-detail-review-20261101/`: QA independiente y fichas contextuales.
- `/private/tmp/umsa-parity-editorial-20261101/`: interacción y paridad.
- `/private/tmp/umsa-editorial-audit-final.json`: auditoría del catálogo vivo.
- `/private/tmp/umsa-directus-preview-proof.jsonl`: sólo ruta y estado de respuestas CMS, sin cuerpos ni credenciales.

El runtime temporal vive en `/private/tmp/umsa-despiece-runtime-20261101`; su launcher obtiene la credencial existente únicamente en memoria y limita la escucha a `127.0.0.1:4381`. El token no forma parte de la entrega. Para reproducir controles de navegador, usar `PLAYWRIGHT_MODULE` con el módulo instalado y `BASE_URL=http://127.0.0.1:4381`.

No se publicaron cambios, no se fusionó a develop/master y no se tocó otro servicio. La futura publicación sigue feature → develop → master por CI/CD.
