# Hospital público — candidato a publicación

Ruta Astro: `/3dgemelohospital`. Visor estático aislado: `/hospital-3d/hospital.html`.

Reconstruir: `cd work/um-territorio && npm ci && node scripts/build-public-hospital.mjs`.
El build selecciona exclusivamente cuatro GLB del hospital, Draco y UM Sans. No publica ni incorpora el catálogo del prototipo ni datos del SGI. Los archivos en `public/hospital-3d` son el artefacto de distribución; fuente y modelos se conservan aquí para reproducibilidad.

La escena carga por decisión del visitante. Modelo conceptual, equipamiento clínico ilustrativo y métricas sintéticas explícitas. No es un gemelo conectado a un hospital real.

Verificado localmente: build dedicado, 17 pruebas hospital, carga del visor en la ruta Astro y captura de la escena con AR. Pendientes: QA en teléfono físico, validación CI del sitio completo y revisión antes de merge. No desplegar la rama de integración atrasada sobre master. Seguir PR a develop y PR a master, sin acceso directo al servidor.
