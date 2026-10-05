# DGE · adaptador privado para Astro

Propuesta de interfaz, no sistema oficial ni cumplimiento contractual certificado. Los siete perfiles son vistas simuladas dentro de una cuenta compartida de presentación; no constituyen permisos institucionales.

El bundle revisado vive en reviewed-client, nunca en public. El endpoint SSR sirve cada recurso detrás del mismo handler probado en Licitómetro. Sólo login, CSS, logo y fuentes del login son públicos. Auth y adaptador usan únicamente APIs nativas de Node; no crean servicio, puerto ni dependencia productiva adicional.

Después del build Astro: `node scripts/ops/package-dge-private.mjs` deja el payload en dist/server/dge-private y rechaza una copia pública del HTML/JS. El despliegue scoped debe incluir ese subárbol con el runtime, y el smoke debe recorrer /ofertas/dge/.

Configuración privada: DGE_CREDENTIALS_FILE o /root/fumbling-field/private-config/dge-demo.credentials.json (username, salt y hash scrypt). La clave no se almacena en Git. Origen por defecto https://www.ultimamilla.com.ar. Sin configuración válida el endpoint devuelve 503 sin afectar otras rutas. DGE_LOCAL_TEST sólo habilita HTTP loopback cuando NODE_ENV no es production.

Preparado desde develop en rama aislada: no copiar bocetos, no mergear una release que incluya cambios ajenos. Para publicar, integrar por Git Flow y preparar una release con únicamente el cambio DGE alineado con la versión publicada. No alterar la home, landing/GIF de colegios, Directus, SGI ni Nginx.

Bloqueos: capacidad del host al 95%, revisión del adaptador, configuración de acceso y pruebas de staging/origen. No despachar deploy ni activar la poda del workflow para resolverlos. El código React original, fuente de pliego y QA visual están en /Applications/um/licitometro/demos/dge; esta incorporación incluye su bundle revisado y el adaptador.

El workflow empaqueta y prueba DGE, admite únicamente su namespace en la whitelist y aplica un preflight de capacidad/configuración antes de la poda existente. La primera configuración privada y el smoke completo de staging/origen aún deben integrarse antes de aprobar o activar la release. `work/dge-demo/tests/built-smoke.mjs` ya permite comprobarlos con un password de CI fuera de Git; la prueba temporal de expiración real se cubre en el handler con reloj controlado, no se falsifica una espera de ocho horas en un smoke.
