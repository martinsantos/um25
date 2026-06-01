# UMSA Theme 2026 - Checklist de migracion a produccion

## Estado actual de la demo

- La demo local en `localhost:4322` usa el sistema visual UMSA 2026.
- El blog local puede completar el archivo desde la web publica vigente cuando Directus local no esta disponible.
- El fallback publico del blog queda limitado a desarrollo o a la variable explicita `UMSA_USE_PUBLIC_BLOG_FALLBACK=true`.
- Produccion no debe depender de scrapeo de la web publica: debe leer Directus como fuente primaria.

## Contenido verificado

- Blog publico vigente: 114 notas detectadas desde el indice paginado.
- Primera pagina local: slugs vigentes como `dolibarr-23-en-camaras-cuotas-caja-y-salida`, `sops-3-13-en-pymes-secretos-age-y-auditoria` y `cnv-1141-2026-cheques-trazabilidad-y-corte-diario`.
- Segunda pagina local: slugs vigentes como `rclone-1-74-en-pymes-s3-checksum-y-restauracion`, `rimi-5849-2026-sgi-mipyme-y-evidencia-de-obra` y `paperless-ngx-en-escuelas-tecnicas-legajos-ocr-y-permisos`.
- Categoria `empresa`: renderiza notas reales del archivo publico.

## Requisitos antes de PR a produccion

- Confirmar variables del entorno productivo:
  - `DIRECTUS_INTERNAL_URL` o equivalente server-side apuntando al Directus accesible desde el servidor.
  - `PUBLIC_DIRECTUS_URL` para assets publicos.
  - token valido si la coleccion `blog_posts` no es publica.
- Confirmar que `UMSA_USE_PUBLIC_BLOG_FALLBACK` no quede activo en produccion.
- Confirmar que las colecciones de Directus tienen permisos correctos para:
  - `blog_posts`;
  - `Servicios`;
  - `Antecedentes`;
  - assets de imagen.
- Revisar visualmente en `npm run preview`:
  - `/`;
  - `/servicios`;
  - `/antecedentes`;
  - `/sectores`;
  - `/blog`;
  - tres singles reales de blog;
  - `/contacto`;
  - los cuatro hubs GEO.
- Validar que canonicals siguen sin query params y con dominio `https://ultimamilla.com.ar`.

## Compuertas tecnicas

Ejecutar antes de abrir PR:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run audit:visual:strict
npm run build
```

## Deploy seguro

- No desplegar manualmente.
- Crear branch desde `develop`.
- Abrir PR a `develop`.
- Dejar correr CI.
- Recien despues abrir PR de `develop` a `master`.
- Monitorear health checks despues del deploy.

## Riesgos pendientes

- Las advertencias de lint existentes son historicas; no bloquean, pero conviene limpiarlas en una rama separada.
- El build muestra warnings de Sentry sin token y Browserslist desactualizado; no bloquean, pero deben registrarse.
- El fallback publico de blog es solo una herramienta de demo/local QA. Si Directus productivo falla, produccion debe resolverlo desde infraestructura, no desde scrapeo.
