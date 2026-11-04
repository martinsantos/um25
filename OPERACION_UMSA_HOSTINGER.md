# Operación vigente de ULTIMA MILLA

Revisado el 4 de noviembre de 2026. Este documento reemplaza las instrucciones operativas del origen anterior. El tag `v0.0.1-production-baseline` permanece intacto como referencia histórica; no es un destino de rollback del servidor vigente.

## Destino y publicación

- Sitio: https://www.ultimamilla.com.ar
- Origen vigente: Hostinger, `179.198.115.115`, hostname `srv2101069.hstgr.cloud`.
- Repositorio: `martinsantos/um25`. Flujo obligatorio: `feature/*` → PR a `develop` → PR a `master`.
- Publicación: workflow **Hostinger UMSA production**, archivo `.github/workflows/hostinger-production.yml`; sólo se ejecuta con `UMSA_PRODUCTION_TARGET=hostinger`.
- Runtime: unidad systemd y releases versionados administrados por el publicador de CI. No utilizar las instrucciones históricas de PM2, Docker o Node 18 para este sitio.
- La identidad y el estado efectivos se verifican en el recibo del release y la unidad, no se deducen de un documento antiguo.

## Antes de fusionar

Revisar el diff completo, el SHA y el árbol del PR. Deben aprobar lint, tipos, contrato CSS, tests, build y `seo:ci`. Verificar que no se incorporan cambios ajenos y que la variable de destino sigue en Hostinger. Fusionar mediante PR con coincidencia del head; sin admin, bypass ni push directo.

## Verificación de sólo lectura

La conexión SSH debe validar estrictamente la clave contra `scripts/ops/hostinger-migration/known_hosts`. No usar el alias histórico `ultimamilla` ni el origen retirado `23.105.176.45`. Consultar unidad, recibo del release, reinicios y logs. No modificar archivos, paquetes, variables, certificados, DNS, almacenamiento ni backups desde una sesión manual.

Después de publicar, comparar SHA y árbol con el release revisado, comprobar URLs, formularios sin envío real y navegación móvil/escritorio, y observar la salud durante 30 minutos. Conservar fallos y huecos de observación; no reiniciar un monitoreo para ocultarlos.

## Incidentes

Conservar evidencia y consultar primero logs y estado. Preparar una reversión del cambio concreto mediante GitFlow y el mismo CI/CD; si hace falta otro mecanismo operativo, debe estar documentado y autorizado para Hostinger. No ejecutar los antiguos ejemplos de `git checkout`, `git pull`, `pm2 restart` o instalación manual en producción.

## SEO y contenido

`npm run seo:ci` arranca temporalmente el build SSR en localhost, sin credenciales CMS, y verifica páginas principales, recursos GEO, canonicals, robots, JSON-LD y semántica HTTP. `npm run seo:audit -- --base-url URL` verifica un despliegue real. Este control complementa la revisión editorial y de navegador; no certifica posicionamiento ni entrega de correo.

Las correcciones editoriales del blog se versionan en `src/data/blogEditorialCorrections.json` y respetan futuras revisiones CMS. Los antecedentes recuperados conservan comprobaciones de identidad, fecha y texto de origen; los datos no documentados no se convierten en entregables afirmados.
