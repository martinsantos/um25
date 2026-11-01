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

## Validación ejecutada

- `npm run check`: lint, tipos, auditoría CSS, 555 pruebas en 74 suites y build correctos.
- El control completo se repitió tras los ajustes finales de movimiento reducido y clientes identificados. Quedan avisos preexistentes de lint sin errores; el build conserva el aviso de tamaño de pdfmake.
- Matriz de servicios y sectores: 19 rutas × cinco anchos (1440, 1280, 834, 390, 360) y dos menús: **97 controles aprobados**, sin overflow, imágenes rotas, textos internos detectados ni errores de JavaScript. Incluye 38 auditorías axe WCAG A/AA en escritorio y móvil.
- Menús con miniaturas a 1440, 1280, 1120, 834, 390 y 360: ocho/nueve imágenes decodificadas, apertura/cierre y ausencia de overflow.
- `scripts/propuesta/parity-control.mjs`: navegación, enlaces de producción, inglés, seis capacidades por servicio, búsqueda/orden/filtros/SSR del catálogo, contacto, películas, despieces y móvil aprobados. Sin enviar formularios.
- QA independiente de escritorio y móvil a 390 px: axe sin infracciones en menús abiertos/cerrados, Escape restaura foco y los enlaces ocultos no reciben Tab. Fichas 9001/9002 en 1440/390 px: leyendas completas, imágenes cargadas y ningún edificio genérico en 9002.
- Tras corregir clientes identificados: nueve vistas de portada, Software y Gobierno a 1440/390/360 px; sin overflow ni infracciones axe, y sin etiquetas anónimas en el ranking de clientes.
- Preview SSR autenticado contra Directus actual: Servicios (8), Antecedentes (518) y blog_posts (440). Registro de consultas sólo con ruta/estado: respuestas 200; fallback HTML público del blog desactivado. No se alteraron datos, permisos ni secretos.

## Límites reales

El diseño está preparado para la revisión local; el catálogo no puede declararse editorialmente completo. El corte vivo tiene 155 fichas sin sector asignable, 68 sin servicio y 91 con resúmenes inferiores a 60 caracteres. Este último umbral es una señal de auditoría, no un juicio automático sobre la calidad. Tres sectores potencialmente identificables en el snapshot no se asignaron porque el texto vivo no contiene esa evidencia. Las fotografías editoriales no acreditan una fotografía real de obra.

Directus deniega `/assets` incluso para un archivo con metadata accesible, y la colección productos conserva su respaldo local. Las rutas integradas comprobadas usan imágenes locales; no se ampliaron permisos de producción para ocultar ese problema. La lectura de contenido autenticado sí quedó comprobada en el preview.

Detalles: [catálogo](catalogo-evidencia-editorial-20261101.md), [Directus](directus-validacion-20261101.md), [paridad](revision-paridad-20261101.md).

## Evidencias y reproducción

Artefactos locales, fuera del repositorio:

- `/private/tmp/umsa-menu-final-20261101/`: menús por ancho.
- `/private/tmp/umsa-final-acceptance-20261101/results.json`: 97 resultados y capturas.
- `/private/tmp/umsa-editorial-detail-review-20261101/`: QA independiente y fichas contextuales.
- `/private/tmp/umsa-parity-editorial-20261101/`: interacción y paridad.
- `/private/tmp/umsa-editorial-audit-final.json`: auditoría del catálogo vivo.
- `/private/tmp/umsa-directus-preview-proof.jsonl`: sólo ruta y estado de respuestas CMS, sin cuerpos ni credenciales.

El runtime temporal vive en `/private/tmp/umsa-despiece-runtime-20261101`; su launcher obtiene la credencial existente únicamente en memoria y limita la escucha a `127.0.0.1:4381`. El token no forma parte de la entrega. Para reproducir controles de navegador, usar `PLAYWRIGHT_MODULE` con el módulo instalado y `BASE_URL=http://127.0.0.1:4381`.

No se publicaron cambios, no se fusionó a develop/master y no se tocó otro servicio. La futura publicación sigue feature → develop → master por CI/CD.
