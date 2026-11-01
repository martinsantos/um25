# Cierre local de navegación, contenido y Directus

1 de noviembre de 2026. Rama `feature/integracion-despiece-20261101`, PR 541 en borrador.
Vista de revisión: http://127.0.0.1:4381/ . **No publicar hasta la revisión del usuario.**

## Cierre documentado de descripciones y clasificaciones

Esta pasada revisa las 252 fichas que reunían al menos una señal pendiente: 91 descripciones breves, 68 servicios ausentes y 160 sectores ausentes. Tres agentes económicos contrastaron las descripciones, servicios y sectores; una segunda revisión independiente verificó identidad, fechas SGI y alcance de los cruces históricos. No hubo escrituras en Directus, push, merge ni despliegue.

Se incorporan decisiones para 104 fichas en `src/data/propuesta/catalog-completions.json`: 91 resúmenes (90 de los breves y la cotización web 3648), nueve títulos explícitos, once servicios y cuatro sectores. La desambiguación existente aprovecha los resúmenes corregidos y actualiza 44 títulos visibles en total. Dos resúmenes ya coincidían con la presentación previa; 102 fichas cambian en el índice de búsqueda. Los resúmenes iguales al título no se duplican en pantalla.

Cada campo lleva cita y registro de origen. La aplicación exige coincidencia del cliente, título, descripción y año actuales; una edición posterior de Directus invalida esa corrección. Las 30 fichas anónimas sólo admiten evidencia literal ya presente en su propio registro vivo; no recuperan nombres históricos del snapshot. Los cruces con registros completos conservan la explicación y la prueba SGI. Excepción explícita: 3320 usa cliente y fragmento de alcance único para completar el texto; las fechas no coinciden y no se usan ni modifican.

Resultados del cotejo de las 520 fichas: mismos IDs, clientes, slugs/enlaces, fotografías, años y estados. Sólo cambian textos, las once asignaciones de servicio, cuatro sectores y las ilustraciones derivadas de esas clasificaciones. La cotización 3648 se identifica como cotización estimativa, sin afirmar una implementación. Se corrigió una regresión del normalizador que quitaba Software al cambiar «actualización sistema de ventas» por «actualización del sistema de ventas».

Validación local: build, lint, tipos, contrato CSS (avisos existentes), 47 pruebas focales y smoke de 37 rutas/520 fichas/614 recursos. Chromium: 118 vistas de las 104 fichas revisadas, incluyendo 14 en móvil; 56 capturas en las 28 vistas seleccionadas. Sin respuestas fallidas, imágenes rotas, desbordes, errores JavaScript ni rótulos internos detectados. Se inspeccionaron capturas de los cruces históricos, fichas anónimas y la cotización web. Evidencia temporal: `/private/tmp/umsa-completion-visual/`, `/private/tmp/umsa-completion-parity.json` y `/private/tmp/umsa-completion-smoke.log`.

Límites: quedan 57 fichas sin servicio y 156 sin sector asignable con la evidencia/taxonomía disponibles. El [registro de pendientes](catalog-completion-pending.json) explica 214 campos pendientes en 184 fichas, incluida 9001 sin alcance suficiente. La auditoría de longitud marca ahora 57 descripciones breves: muchas son textos suficientes o se omiten por repetir el título; no se rellenan hasta llegar a 60 caracteres. La auditoría evalúa la introducción visible de los casos destacados, no su resumen interno. Esto no declara editorialmente completos todos los antecedentes.

El JSON `mode: local-only` documenta el estado de entrega; no es un bloqueo técnico de publicación. La restricción se cumple manteniendo los cambios en esta rama y el preview local, pendientes de revisión del usuario.

## Control posterior a la recuperación de Directus

Las ocho imágenes ya se recuperaron por CI/CD en el run [41354989262](https://github.com/martinsantos/um25/actions/runs/41354989262), conservando UUID y referencias. Las notas siguientes sobre archivos todavía ausentes describen el diagnóstico anterior a esa ejecución. No se publicó el rediseño.

Control local posterior: 66 vistas Chromium (1440 y 390 px), con los ocho servicios, nueve destinos sectoriales, doce casos destacados y sus índices. Sin imágenes rotas, desbordes, errores JavaScript ni etiquetas internas visibles en esas vistas. Las miniaturas de los menús conservan 8 y 9 destinos; búsqueda de antecedentes y apertura de ficha comprobadas en ambos anchos. Se corrigió Escape para cerrar también un menú mantenido visible por hover.

Se retiraron únicamente las etiquetas sectoriales no respaldadas de 3628, 3646, 3655, 3471 y 3194, mediante guardas de ID, cliente, texto y etiqueta previa. Se conservan sus servicios, fotos y fichas; no se inventa una vertical alternativa. Comparación del catálogo: mismos 520 IDs y mismas imágenes/servicios; sólo cambian esas cinco clasificaciones y su representación derivada. El smoke posterior valida 37 rutas y 614 recursos. Build, lint, tipos, contrato CSS y 51 pruebas focales aprobados.

Este control no convierte las otras fichas históricas en casos editoriales terminados: quedan descripciones breves y clasificaciones sin evidencia suficiente. Las imágenes ilustrativas continúan identificadas como tales. Evidencia temporal en `/private/tmp/umsa-post-recovery-visual/`; versión servida en el puerto 4381.

## Último cierre: ocho imágenes e inventarios de los casos

La pasada más reciente valida ocho PNG de Servicios por hash, decodificación completa y respuesta HTTP local con MIME correcto. El manifiesto y el verificador offline permiten reproducir un bundle fuera del repositorio. La metadata original dice JPEG: la futura restauración en Directus debe conservar las referencias y corregir MIME/nombres. El volumen del CMS no se ha restaurado y no se ha ensayado una carga API; la resolución local sí está comprobada.

Los doce casos destacados usan ahora inventarios explícitos cotejados con sus fuentes. Se retiran inferencias de software, tableros o kits de incendio que no estaban respaldadas; se separan racks de distinto modelo y se distinguen cantidades, capacidades y longitudes. Los dibujos de puestos de datos representan cableado, no computadoras. La curaduría conserva la comprobación del cliente público actual.

Validación de esta pasada: `npm run check` completo (617 pruebas en 84 suites, lint, tipos, contrato CSS y build); inventarios HTML de 12/12 fichas iguales a los datos revisados; las tres imágenes de portada coinciden con sus fichas; smoke de 37 rutas, 520 fichas indexadas y 614 recursos. El runtime 4381 se recompiló y reinició con este resultado. No hay publicación ni escrituras en producción.

QA independiente: 24/24 vistas de los doce casos a 1440 y 390 px, respuestas 200, consola limpia, sin desbordes ni infracciones de axe WCAG 2.1 A/AA. Este resultado comprueba las pantallas y reglas automatizadas ensayadas; no afirma accesibilidad universal ni completa la curaduría pendiente de los otros antecedentes.

Evidencia temporal: `/private/tmp/umsa-case-recovery-check.log`, `/private/tmp/umsa-case-recovery-http.json`, `/private/tmp/umsa-case-recovery-smoke.log` y `/private/tmp/umsa-cases-equipment-final-20261101/`. Detalle de restauración: [causa raíz y preparación](directus-causa-raiz-20261101.md); inventarios: [evidencia de los doce casos](casos-destacados-evidencia-20261101.md).

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

## Casos documentados y recuperación de contenido

- Doce fichas incorporan título editorial, alcance concreto y cantidades cotejadas con sus registros. La portada destaca Kristich/DTP Marqués, Casa de la Salud de la Mujer y el sistema de detección de incendios del aeropuerto. No se inventan testimonios, ROI ni resultados operativos.
- Cada caso distingue la introducción, el alcance, las cifras y el texto del registro disponible (algunas fuentes históricas están recortadas). La sección de lectura tiene fondo claro; en móvil el texto y las cifras ocupan el ancho disponible. Se evita repetir el mismo cajetín de datos al final de la ficha.
- La identidad pública actual prevalece sobre el archivo histórico. Una ficha anonimizada o reasignada deja de recibir la presentación curada; el rótulo «Cliente Confidencial» no relaciona proyectos de clientes distintos.
- Las imágenes de los casos seleccionados se identifican como ilustrativas. Hacen falta fotografías propias verificadas para presentarlas como registro real de obra.
- El catálogo de productos se lee ahora desde el JSON vivo `Servicios.Productos`: 54 entradas en ocho servicios. No se consulta la colección inexistente `/items/productos`. Una respuesta vacía válida y un 404 confirmado no restauran contenido retirado del snapshot; los logs de estos getters no vuelcan objetos de error del SDK.
- Se completó el mapa de las ocho imágenes de servicios con archivos locales existentes. Coinciden tamaño y dimensiones con la metadata de Directus, y se revisó la correspondencia visual. El almacenamiento activo del CMS sigue sin los ocho originales: su restauración se debe revisar por separado. No se ampliaron permisos ni se alteró producción.
- El copy comercial de los 54 productos contiene SLA, garantías y rangos no corroborados; no se volcó automáticamente como nuevas especificaciones en las páginas integradas.

- El despiece distingue DVR, NVR y VMS; la frase genérica «equipo de ingeniería de Última Milla» no añade consultoría al inventario.

Fuentes y límites: [casos documentados](casos-destacados-evidencia-20261101.md) y [causa raíz de Directus](directus-causa-raiz-20261101.md).

## Validación de esta entrega de casos y CMS

- `npm run check`: **601 pruebas en 83 suites**, lint, tipos, auditoría CSS y build aprobados. Persisten únicamente los avisos de lint y tamaño de bundle ya documentados.
- **66 vistas**: portada, doce fichas documentadas, ocho servicios y nueve sectores en 1440/390 px, más portada y dos fichas en 834/360 px. Sin overflow, imágenes rotas, errores JS ni infracciones detectadas por axe WCAG 2/2.1 A/AA. Se verificaron los tres destacados, las clasificaciones y la exclusión de relaciones por cliente anónimo.
- Revisión visual independiente de cuatro fichas y portada móvil. Detectó tres inconsistencias corregidas: DVR presentado como NVR, consultoría inferida de una frase genérica y el rótulo «Descripción completa» para textos históricos recortados. Tras el último build, **ocho vistas adicionales** volvieron a comprobar esos arreglos, el acordeón y axe sin infracciones.
- Paridad funcional aprobada: desplegables, nueve sectores, menú móvil/Escape/foco, búsqueda, orden, aliases/SSR del catálogo, validación de contacto y anchos 1440/390/360. No se enviaron formularios.
- Smoke: **37 rutas, 520 fichas indexadas y 614 recursos accesibles**, con rutas auxiliares conservadas.
- CCTV AI conserva exactamente el texto de producción en presentación, valor, opciones y límites; su producto editorial no se confunde con los 54 productos embebidos del CMS.
- Lectura viva: 54 productos normalizados y ocho imágenes locales decodificadas a 2816×1536. El registro acotado del preview entre 20:03:58 y 20:08:58 UTC contiene **336 solicitudes, todas HTTP 200**, a Servicios, Antecedentes y blog. No registra credenciales ni consulta la colección inexistente `productos`.

Artefactos de este cierre: `/private/tmp/umsa-evidence-visual-20261101/results.json`, `last-mile.json`, `revision-final.png`; `/private/tmp/umsa-evidence-parity-20261101/`; `/private/tmp/umsa-evidence-release-check.log`; `/private/tmp/umsa-evidence-smoke.log`. La rama queda local para revisión; no se despliega ni se fusiona.

## Validación de las pasadas anteriores

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

La causa de los ocho assets de servicios fallidos quedó comprobada: falta el binario en el almacenamiento activo, mientras cuatro archivos presentes responden 200 con el mismo token. La integración cubre los ocho UUID con imágenes locales y lee los productos vivos de `Servicios.Productos`. La recuperación física de esos originales en el CMS queda pendiente de una restauración revisada; no es un bloqueo de permisos. La lectura autenticada de contenido está comprobada en el preview.

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
