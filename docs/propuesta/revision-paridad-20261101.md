# Revisión local frente a producción — 1 de noviembre de 2026

Rama: `feature/integracion-despiece-20261101`. PR de integración: #541 (borrador).
Vista local: http://127.0.0.1:4381/ . Producción no modificada.

## Resultado y alcance

Se compararon las 40 rutas principales, sus encabezados, enlaces, imágenes y contenido con www.ultimamilla.com.ar. El catálogo y el blog se contrastaron además por sus índices completos. Se recorrieron los tipos de página y sus interacciones en escritorio y teléfono, incluyendo servicios, sectores, fichas, blog, contacto, inglés y rutas auxiliares.

- Se conservan los ocho servicios y los nueve sectores de la navegación.
- Los 518 identificadores de antecedentes de producción están entre los 520 locales. Los dos adicionales son los recuperados de SGI (9001 y 9002).
- Coinciden las 449 rutas del sitemap del blog, incluidas categorías y temas. Tres artículos de distintas épocas conservaron exactamente el texto del cuerpo: Node-RED 5.0.8, Mayan EDMS 4.11 y Bienvenidos.
- Se conservan tipografía, plantillas, certificaciones, términos, privacidad, CCTV AI y hubs comerciales. Las rutas antiguas de servicios y sectores redirigen a su destino integrado.
- El alcance del middleware excluye aplicaciones operativas, API, descargas y paneles. No se modificaron Directus, bases, credenciales, infraestructura ni servicios.

## Regresiones corregidas en esta revisión

1. Se recuperaron contacto rápido y navegación inferior móvil usando los componentes de producción. Se verificaron apertura, cierre con Escape, devolución de foco y ocultación de la barra al abrir el menú.
2. Las ocho fichas de servicio vuelven a mostrar sus seis capacidades con las descripciones completas. Las especificaciones adicionales siguen disponibles en un desplegable.
3. Se restituyeron clientes, documentación, capacidades y llamadas a contacto de las páginas inglesas. Se corrigió también el idioma de sus metadatos.
4. Se conserva el lector de artículos de producción: índice, enlaces contextuales, navegación entre notas, normalización editorial y metadatos BlogPosting/FAQ. El índice del blog usa el diseño integrado.
5. La vista previa obtenía sólo 30 páginas del archivo público del blog. Ahora usa su sitemap completo, con paginación de respaldo. Este respaldo es optativo; producción sigue usando Directus.
6. Las cinco categorías del blog permanecen visibles aunque no aparezcan entre las notas recientes.
7. Los enlaces antiguos por cliente siguen funcionando al introducir tildes o normalizar SA/SRL en los nombres.
8. Se redujo el desplazamiento de Blog y Sectores conservando imágenes y contenido: grilla de tres columnas en escritorio, diez notas por página y fotografías de sectores en 16:9.

## Evidencia de validación

- Compilación de producción, lint, tipos, auditoría CSS y **536 pruebas en 70 suites** aprobados.
- Prueba de integración: 37 rutas públicas, redirecciones, 520 fichas indexadas y 600 recursos. Sin envíos de formularios.
- Prueba de interacción: menús de escritorio/móvil, búsqueda, ordenamiento, filtros, URL/SSR, contacto, película de software, servicios físicos/profesionales y anchos 1440/390/360.
- Barrido amplio del commit precedente 16a0f32f: 138 combinaciones de página/ancho con axe. No hubo fallos de accesibilidad, desbordes ni recursos rotos; se detectaron cinco excesos de altura en Blog/Sectores que motivaron el ajuste de grillas.
- Control adicional local: 16 vistas de páginas modificadas y del modal, sin infracciones axe WCAG 2.1 AA; otras 24 combinaciones de Blog, Sectores, inglés, servicios y artículo completo, sin desbordes, imágenes rotas ni infracciones axe.
- Revisión final de las dos grillas en 1440, 1310, 1024 y 390 px: ocho vistas sin infracciones axe, imágenes rotas ni desbordes; Blog ocupa 3,6/4,6/4,9/8 pantallas y Sectores 4,9/6/4,6/7,1.
- El artículo completo conserva su extensión de producción. No se recorta texto para cumplir el antiguo presupuesto de altura del artículo simplificado.

Artefactos de esta sesión: `/private/tmp/umsa-final-parity-20261101/` (comparación HTML, sitemaps, informes JSON, capturas y control descargado de CI). CI del barrido amplio: https://github.com/martinsantos/um25/actions/runs/41312061490 . Su paso visual aparece verde, pero el informe adjunto sí registra los cinco avisos de altura; se revisó el informe y no sólo el estado del job.

## Límites y datos editoriales pendientes

No equivale a una lectura manual de cada una de las 520 fichas y cada nota. Se verificó el índice completo, el acceso a recursos, plantillas de página y muestras de contenido.

La vista local accede al blog público y al respaldo del catálogo cuando la API de Directus devuelve 403 desde esta Mac. La conectividad autenticada y el contenido vivo de Directus requieren el control de despliegue en su entorno; este recorrido local no sustituye ese control.

El catálogo conserva carencias de origen: 155 fichas con señal de sector faltante, 91 con descripción corta, 12 con servicio faltante y dos sin foto propia. No se inventaron textos ni fotografías para ocultarlas. Minería conserva su página y acceso al catálogo, pero no presenta las obras de otros rubros que la versión anterior mezclaba en ese sector.

No se publicó ni se fusionó a master. La siguiente publicación debe hacerse por feature → develop → master y CI/CD, después de la revisión final del usuario.
