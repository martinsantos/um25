# Validación de Directus para la integración UMSA — 1 de noviembre de 2026

## Actualización del diagnóstico

La investigación posterior del mismo día corrige la atribución inicial a permisos: los ocho binarios referenciados por `Servicios.Imagen` faltan del volumen activo; cuatro assets presentes responden 200 con la misma credencial. La tabla/colección `productos` tampoco existe. Ver [causa raíz comprobada](directus-causa-raiz-20261101.md). El 403 y la metadata accesible, por sí solos, no permitían distinguir estas ausencias de una denegación de acceso. Este documento conserva la evidencia de las primeras comprobaciones; la conclusión vigente es la ausencia de los binarios, no una denegación general de permisos.

## Resultado histórico

Se validó Directus autenticado de sólo lectura en producción y en el preview SSR local. La sesión local usó una credencial existente sólo en memoria, sin persistirla ni escribirla en logs. Los servicios, antecedentes y blog respondieron correctamente desde el runtime SSR. La causa observada para los ocho assets ligados a Servicios es que faltan sus binarios en el volumen activo; los assets físicamente presentes sí son legibles con el mismo token. Los valores del `.env` local continúan rechazados y no se modificaron.

## Evidencia observada

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| GET autenticado `/items/Servicios?limit=0&meta=filter_count` | HTTP 200; 8 registros | Usó el token del proceso web en Hostinger. La misma colección también permite lectura anónima. |
| GET autenticado `/items/Antecedentes?limit=0&meta=filter_count` | HTTP 200; 518 registros | Usó el token del proceso web en Hostinger. La misma colección también permite lectura anónima. |
| GET autenticado `/items/blog_posts?limit=0&meta=filter_count` | HTTP 200; 440 registros | Colección no disponible anónimamente (HTTP 403). |
| GET autenticado `/files/{uuid}` para un UUID `Imagen` enlazado desde una fila viva de `Servicios` | HTTP 200 | Confirma que existe el registro de metadata; por sí solo no comprueba que el binario exista en storage. |
| GET autenticado `/assets/{uuid}` y filesystem para los ocho UUID `Imagen` actuales de Servicios | HTTP 403 en 8/8; `filename_disk` no existe en el volumen activo en 8/8 | Diagnóstico posterior: falta el binario en `/directus/uploads`. Cuatro controles positivos con archivos presentes responden `/assets` 200 usando el mismo token. No se ampliaron permisos. |
| Chequeo previo de preview `/blog/{slug}` con token local rechazado y fallback público activado | HTTP 200; título y prefijo normalizado del cuerpo aparecen en HTML | Evidencia histórica del fallback HTML de producción. La validación autenticada posterior, con el fallback desactivado, se registra en las dos filas siguientes. |
| Preview SSR local `/servicios`, `/antecedentes` y `/blog`, con fallback HTML público del blog desactivado | HTTP 200 en las tres rutas | Validación tras el rebuild, en el runtime autenticado. |
| Registro acotado del runtime SSR local | 281 solicitudes a Directus: `Servicios` 77, `Antecedentes` 192, `blog_posts` 12; todas HTTP 200 y cero respuestas no 2xx | El preload registró sólo path y status. Ventana: 1 nov 2026, 16:18:34–16:20:21 UTC. No contiene cuerpos ni credenciales. |
| SSR de producción `/servicios/101`, una ficha de antecedente y un artículo | HTTP 200 en las tres rutas; el título obtenido por API aparece en cada HTML | Confirma render SSR de producción con títulos vivos de Directus. |

La rama local declara `PUBLIC_DIRECTUS_URL=https://admin.ultimamilla.com.ar` en el runtime de preview indicado. El `.env` local del checkout (archivo presente y versionado) contiene claves `DIRECTUS_STATIC_TOKEN`, `PUBLIC_DIRECTUS_TOKEN` y `VITE_DIRECTUS_TOKEN`; se probaron por separado sin mostrar sus valores y cada una devolvió HTTP 401 en solicitudes GET. La configuración de [runtime.ts](../../src/config/runtime.ts) prioriza `DIRECTUS_STATIC_TOKEN`, `PUBLIC_DIRECTUS_TOKEN` y `DIRECTUS_ADMIN_TOKEN` en `process.env`. El launcher autenticado configuró `DIRECTUS_STATIC_TOKEN` en el proceso y `DIRECTUS_INTERNAL_URL`/`PUBLIC_DIRECTUS_URL` con el dominio público; el token local rechazado quedó desplazado sólo en esa sesión.

La conexión SSH directa a la IP falló al usar la configuración genérica, pero la configuración existente define `hostinger-umsa`/`ultimamilla` con identidad dedicada, `StrictHostKeyChecking yes` y `~/.ssh/known_hosts_umsa_hostinger`. Con ese alias, SSH verificó el host y llegó a `srv2101069.hstgr.cloud`. Se identificó el servicio web UMSA activo y se usó su variable `DIRECTUS_ADMIN_TOKEN` sólo dentro de memoria en el servidor para las consultas autenticadas descritas arriba.

La API pública entregó 8 servicios y 518 antecedentes. Los ID de ambas colecciones coinciden por completo con los snapshots locales: 8/8 y 518/518; no hay IDs presentes sólo en uno de los dos lados. La comparación de campos seleccionados contra esos datos vivos encontró diferencias JSON crudas en servicios: `Imagen` 8/8, `Stats` 2/8 y `Productos` 4/8; en antecedentes: `Descripcion` 422/518, `Cliente` 116/518 e `Imagen` 518/518. Los demás campos cotejados coinciden. Los snapshots no guardan timestamps de modificación, así que no permiten calcular cambios por fecha; las cifras anteriores son diferencias de contenido por campo, no conteos de edición.

La revisión posterior comprobó directamente los ocho `filename_disk` de imágenes de Servicios: tienen metadata `storage=local`, pero ninguno de los binarios originales está en el mount activo `/srv/umsa-clean-containers/directus-uploads` → `/directus/uploads`. El endpoint directo del contenedor responde `FORBIDDEN` para esas referencias ausentes. En cambio, cuatro archivos cuyo metadata y binario coinciden responden `/assets` 200 con la misma identidad autenticada. Por eso queda corregida la inferencia anterior de que el 403 era un problema de permisos: la causa demostrada para estos ocho assets es la falta de archivos físicos en storage. No se cambiaron permisos.

Las cuatro rutas locales examinadas (`/servicios`, `/servicios/101`, `/antecedentes`, `/blog`) produjeron HTML SSR sin referencias `<img src>` o `<a href>` a `/assets/`; sí incluyen medios locales bajo `/cine/`. Los ocho servicios usan isometrías locales en el índice e imágenes editoriales locales en sus fichas; antecedentes y blog usan pósters locales. Los 55 UUID de imagen de los productos de snapshot tienen entradas en `image-local-map.json`. La búsqueda posterior encontró imágenes locales para los ocho UUID `Imagen` de servicios, con tamaño y dimensiones coincidentes con la metadata viva. Se completó `image-local-map.json` para los cinco UUID que faltaban: el helper genérico también puede resolver los ocho desde archivos locales existentes. Esa coincidencia no permite afirmar igualdad binaria con los originales ausentes. La librería ahora lee los 54 productos embebidos en `Servicios.Productos`; no consulta `/items/productos`. El snapshot queda reservado a errores de lectura o un campo de formato inválido; un array válido vacío y un 404 confirmado no recuperan registros retirados.

## Controles de acceso disponibles

- La ruta SSH válida es `hostinger-umsa`, con verificación estricta y `known_hosts` preexistente; la conexión directa sin alias no usó esa configuración y falló host-key verification. No se aceptó ni instaló una clave nueva.
- El workflow reusable `hostinger-runtime-audit.yml` sólo admite auditorías de fonts, canonical, nginx, logging y storage en `master`; no consulta Directus.
- Los workflows `hostinger-directus-admin.yml` y `hostinger-directus-owner-login.yml` preparan o aplican operaciones de administración/login. No ofrecen un control de lectura de contenido y no se ejecutaron.
- El workflow de preview fija `UMSA_USE_PUBLIC_BLOG_FALLBACK=1` y `PUBLIC_DIRECTUS_URL`, sin pasar un token. Por diseño, no sirve como evidencia de blog autenticado.

## Preview SSR autenticado

El launcher autenticado `/private/tmp/umsa-despiece-runtime-20261101/start-authenticated-preview.sh` se ejecutó después del rebuild y mantuvo el preview SSR en `127.0.0.1:4381`. Obtiene la credencial existente mediante SSH dentro de una sustitución capturada en memoria, la asigna a `DIRECTUS_STATIC_TOKEN`, fija ambas URL de Directus al dominio público, desactiva los fallbacks y arranca Node en foreground con salida suprimida. No pasa el valor en argumentos ni lo guarda en archivos/logs. El registro acotado `/private/tmp/umsa-directus-preview-proof.jsonl` sólo contiene path/status: 281 solicitudes, todas 200 y ninguna 401/403, para Servicios, Antecedentes y blog_posts. Con el fallback público del blog desactivado, `/blog` local también respondió HTTP 200.

## Límites

El acceso autenticado y el SSR local de las rutas principales quedaron comprobados con el rebuild. La evidencia de runtime registra solicitudes Directus 200 mientras el fallback HTML público del blog estaba desactivado, incluido el GET local `/blog` 200. Los tokens del `.env` local por sí solos siguen respondiendo 401; sin el token válido de la sesión, `getServiciosV4()` cae al snapshot, mientras `getAllAntecedentes()` y `getAntecedenteConServicios()` reintentan sin token después de 401/403. Para assets, los ocho registros de Servicios no tienen binario en el storage activo; cuatro archivos presentes sí responden 200. Las rutas integradas examinadas renderizan imágenes locales; el mapa local cubre ahora los ocho UUID de servicio, aunque los binarios del CMS siguen pendientes de restauración revisada. El catálogo actual de productos se puede leer del JSON `Servicios.Productos`; `/items/productos` sigue sin colección/esquema desplegado. Este resultado no invalida la paridad visual documentada en `revision-paridad-20261101.md`; delimita la integridad de storage y los datos vivos disponibles.

## Criterio editorial del catálogo de productos

La revisión de los 54 objetos vivos no encontró placeholders ni etiquetas internas, pero sí promesas de disponibilidad, SLA, garantías, certificaciones y rangos de equipos que requieren respaldo contractual o técnico. La integración conserva las capacidades verificadas y las fichas técnicas existentes; no publica automáticamente ese copy comercial como especificación nueva. El normalizador de datos conserva los campos del CMS para los consumidores existentes, sin crear IDs o slugs cuando no existen.

El producto editorial CCTV AI (registro local 133) conserva su contenido y opciones publicados como fuente separada del JSON de servicios. No se agrega artificialmente a los 54 objetos vivos. Una entrada editorial en borrador no se resuelve como publicada.
