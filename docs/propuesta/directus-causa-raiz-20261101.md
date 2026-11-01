# Causa raíz: assets y productos de Directus — 1 de noviembre de 2026

## Resultado

La respuesta `403 FORBIDDEN` de `/assets/{uuid}` no indica falta de permiso en el token usado para la lectura. Para las ocho imágenes referenciadas por la colección `Servicios`, Directus conserva la fila `directus_files`, pero no está el binario que indica `filename_disk` en el almacenamiento `local` montado por el contenedor activo. Como control positivo, cuatro archivos originales que sí existen en ese mismo volumen permiten `GET /assets/{uuid}` con el mismo token.

Encontré ocho archivos locales plausibles como fuentes de recuperación bajo `public/images/services/productos/`. Para los ocho, el tamaño en bytes y las dimensiones coinciden exactamente con la metadata viva de Directus. Las cinco fuentes adicionales inspeccionadas visualmente representan sus servicios. `image-local-map.json` ahora enlaza los ocho UUID a estas rutas. Como el binario fuente ausente no está disponible para comparación, son candidatos de alta confianza, pero no afirmo igualdad binaria con el original de Directus.

La colección `productos` no está desplegada en la base que usa el contenedor Directus: no existe una tabla cuyo nombre coincida con `productos` sin distinguir mayúsculas, no hay registro equivalente en `directus_collections` ni permisos asociados. La API contesta `403 FORBIDDEN`; en este estado esa respuesta oculta que falta la colección/esquema.

Los productos actuales sí se pueden leer desde `Servicios.Productos`, un campo JSON vivo de cada servicio. No hace falta crear una colección separada para mostrar ese catálogo.

No se cambiaron el servidor, los permisos, la base, los archivos ni las credenciales.

## Evidencia de sólo lectura

El acceso usó el alias SSH existente `hostinger-umsa`, con verificación estricta del host. Las lecturas autenticadas obtuvieron el token únicamente desde el entorno del proceso web activo y lo mantuvieron en memoria; no se imprimió, pasó como argumento ni guardó en archivo.

| Prueba | Resultado observado | Qué demuestra |
| --- | --- | --- |
| Directus `GET /items/Servicios?fields=Imagen&limit=8` | HTTP 200; ocho filas | El control usa referencias de imágenes vivas de la colección actual. |
| `GET /files/{uuid}?fields=id,filename_disk,storage,type` para esas ocho referencias | HTTP 200; `storage=local`, tipo `image/jpeg` | Los registros de metadata existen en Directus. |
| Coincidencia de `filename_disk` exacto y búsqueda `{uuid}.{jpg,jpeg,png,webp,avif,gif,pdf}` en el volumen activo | 0/8 archivos | Los binarios originales de esas referencias faltan del almacenamiento servido por Directus. |
| `GET /assets/{uuid}` para esas ocho referencias, directo a la IP del contenedor Directus | HTTP 403, código `FORBIDDEN`, 8/8 | El 403 ocurre dentro de Directus; el archivo referenciado no está disponible en el volumen. |
| Control positivo: cuatro UUID elegidos de archivos originales presentes en el mismo volumen; metadata y nombre de disco coincidentes | `/files` 200 y `/assets` 200, 4/4, con el mismo token | El token sí puede leer assets existentes; la causa no es una denegación general de permisos. |
| Contenedor activo y volumen | `/directus/uploads` está montado desde `/srv/umsa-clean-containers/directus-uploads`; 1.556 archivos en el contenedor | La inspección comprobó el storage efectivamente usado por Directus, no sólo un directorio histórico del checkout. |
| `GET /items/productos?limit=0&meta=filter_count` autenticado | HTTP 403, `FORBIDDEN` | La API no revela si la colección existe. |
| Base configurada en Directus: tablas públicas, `directus_collections` y `directus_permissions` | 33 tablas; ninguna tabla relacionada con `productos`; cero registros de colección y cero permisos de lectura para `productos` | Falta el esquema/registro de la colección; el 403 no basta para concluir que sólo falte permiso. |
| `GET /items/Servicios?fields=id,Productos&limit=50` autenticado | HTTP 200; 8 servicios, 54 entradas en total | `Productos` es JSON embebido y legible en la colección existente. |

### Candidatos locales de imagen

Las ocho rutas siguientes están en `public/`. El tamaño en bytes reportado por Directus coincide con el tamaño local; todas son PNG de 2816×1536. Las columnas SHA-256 identifican el archivo local y no se compararon con un hash del binario ausente.

| Servicio / UUID Directus | Ruta pública local | Bytes | SHA-256 local | Estado de mapa |
| --- | --- | ---: | --- | --- |
| 101 / `90813c10-237b-418f-9465-6f583a5c5468` | `/images/services/productos/infraestructura/1.png` | 3.057.902 | `574e7a05ae46fa53c5587078dbd049582539e9003fb6c6000325ffe77a612ab5` | Mapeado |
| 102 / `6af30576-0301-4bae-80e7-37945241f72b` | `/images/services/productos/seguridad/2.png` | 2.252.858 | `0a77ff06e865a17da60ada68eb60886eae7443a63cce2f18a243075c2bc0271c` | Mapeado |
| 103 / `9bb39733-39d4-4417-8502-7f65d6829e76` | `/images/services/productos/telecomunicaciones/3.png` | 1.246.083 | `3f5bd4a8a8987fac038f85d5f2cbad14540a3171b45d5ad2be99d71832356836` | Mapeado |
| 104 / `755b2d22-a6e7-4997-b943-858d37abeee9` | `/images/services/productos/software/4.png` | 1.941.491 | `9e75e2d16db6be32ef95aa7c5206bea5bf78ae360b14d2f1cd01422d76893138` | Mapeado |
| 105 / `3ec5cc77-4edf-41ae-a1fd-e3a887531046` | `/images/services/productos/soporte/5.png` | 3.163.114 | `890180a50157339a5acab10d4859a1de8baee0d0ffc28c98d51ba7578c8213b5` | Mapeado |
| 106 / `cfd4ea67-fec9-4a92-b40b-227a76434a09` | `/images/services/productos/consultoria/6.png` | 2.132.960 | `d7164d263309b5db613d2313eacbebe27cbacb838f60feaaa05918180c5410b3` | Mapeado |
| 107 / `1b8b7cbd-b390-4d91-a3f7-57d1d8e05d20` | `/images/services/productos/incendios/7.png` | 2.459.576 | `0654d335aee6a3aa485067739e2feda7fd59211bc24fe8e304381dc1b51563cf` | Mapeado |
| 108 / `bf6a9e03-4b9d-4052-b860-ffc85240396f` | `/images/services/productos/electricos/8.png` | 2.268.609 | `898e8f2cd7270c61f6a1f82bf87b4b9d59ce39033a59cc81e23b57b69ac74584` | Mapeado |

Revisión visual sin transformar de las cinco fuentes nuevas: software en laptop, soporte técnico con herramientas y equipo de diagnóstico, consultoría con tablero digital, detección de incendios con alarma/pulsador y servicios eléctricos con tablero/UPS. La revisión confirma correspondencia temática, no identidad binaria con el original de Directus.

El manifiesto revisable está en `docs/propuesta/directus-assets-recuperacion-20261101.json`. El verificador `scripts/ops/validate_directus_asset_recovery.mjs` compara los ocho hashes, decodifica los PNG con `sharp`, comprueba las ocho relaciones de `image-local-map.json` y crea un tar.gz fuera del repositorio. No contiene llamadas de red ni código de restauración.

Ejecución local completada: `node scripts/ops/validate_directus_asset_recovery.mjs --bundle /tmp/umsa-directus-assets-recovery-20261101-node.tar.gz`. Validó 8/8 candidatos y los bytes dentro del bundle; el tar.gz quedó en `/tmp` con 18.311.490 bytes. La comprobación no contactó Directus ni probó una restauración API; el bundle conserva PNGs con sus nombres/rutas locales y metadata para revisión.

### Shape agregado de `Servicios.Productos`

| Servicio | Entradas |
| --- | ---: |
| 101 | 8 |
| 102 | 8 |
| 103 | 6 |
| 104 | 6 |
| 105 | 5 |
| 106 | 5 |
| 107 | 8 |
| 108 | 8 |

Los 54 objetos comparten los campos `nombre`, `headline`, `descripcion`, `imagen`, `caracteristicas` y `servicio_asociado`; no tienen `id`, `slug` ni `estado`, y no presentan valores vacíos. `caracteristicas` es un array de tres valores en todos los objetos. Los campos `imagen` tienen cinco rutas locales y 49 valores UUID. Esta auditoría no guardó ni imprimió los textos de catálogo.

## Búsqueda de copias originales

Busqué el nombre exacto de cada `filename_disk` en el volumen activo y en checkout, publicaciones anteriores, directorios de uploads, releases y árboles de migración: no apareció ninguno de los ocho UUID como archivo. En el destino offsite documentado `76.13.234.213:/opt/remote-backups/directus`, listé en streaming y sin extracción `directus-uploads-20260905-020002.tar.gz` y `directus-uploads-20261009-020001.tar.gz`; cada uno contiene 2.144 entradas y ninguno incluye esos ocho `filename_disk`. El checkpoint más reciente, `directus-checkpoint-20261029-020001.txt`, apunta al archivo de uploads del 9 de octubre de 2026.

También se consultaron 34 dumps SQL comprimidos de Directus en ese destino, sin guardar copias locales ni modificar el servidor. En todos aparecen los mismos ocho registros, con los mismos UUID, `filename_disk`, nombres de descarga y tamaños; no se encontró un UUID anterior alternativo que pudiera enlazarse a otra entrada del archivo. Los manifests/checkpoints legibles no enumeran copias con nombres alternativos. Los bundles operacionales cifrados no se descifraron, listaron por dentro ni extrajeron.

La búsqueda del checkout y de objetos Git encontró además `public/images/services/servicio-101-...jpg` a `servicio-108-...jpg`, con nombres de descarga coincidentes, pero sus tamaños y/o dimensiones difieren de metadata Directus; no los trato como los originales ni los propongo para restauración. Los ocho PNG descritos arriba son la mejor fuente local candidata: coinciden en dimensiones y tamaño reportado para cada UUID y tienen representación visual coherente. Sus SHA-256 locales quedan documentados para revisión; no existe hash del original ausente para confirmar igualdad de bytes.

La base consultada fue la indicada por la configuración del contenedor Directus, no la base inicial sugerida por la variable `POSTGRES_DB` del contenedor PostgreSQL. Las consultas fueron `SELECT` a `information_schema` y tablas internas de Directus; no leyeron filas de productos ni credenciales.

## Fix seguro propuesto

### Assets

Para mantener la propuesta local, seguir sirviendo las imágenes editoriales, pósters y fallbacks locales ya validados. No ampliar permisos de Directus: el control positivo confirma que el endpoint responde con el permiso actual cuando el archivo existe.

Para esta integración local, `image-local-map.json` ya enlaza los ocho UUID y el verificador valida las rutas. Mantener los candidatos como PNG locales. La metadata viva registra `image/jpeg` y un `filename_download` que termina en `.jpg`, mientras que el contenido local tiene firma PNG y ruta `.png`. Si se considera restaurarlos en Directus en el futuro, una API/CI revisada debe preservar los UUID y actualizar tipo MIME y nombre coherentes con los bytes: declarar `image/png` y usar `.png`, o convertir a JPEG antes de usar `.jpg`. No afirmar igualdad binaria, no copiar PNG como JPEG, no escribir manualmente al volumen activo ni cambiar permisos en producción.

Para el código local/CI, agregar una comprobación con fixtures: ante metadata existente pero asset no disponible, las rutas integradas deben renderizar la imagen local o el placeholder permitido, nunca depender de un `/assets/{uuid}` sin respaldo. El smoke test puede verificar que `/servicios`, `/antecedentes` y `/blog` no emitan assets de Directus para las imágenes locales validadas.

### Productos

Para la vista local, mapear `Servicios.Productos` directamente y normalizar sus campos; el snapshot puede seguir cubriendo un error de lectura del servicio. Usar una clave derivada del servicio y del nombre porque los objetos no traen `id` ni `slug`. Resolver `imagen` por ruta local cuando sea ruta; tratar UUID como una imagen Directus que puede faltar y mantener un fallback local comprobado. No hacer depender esta vista de `/items/productos`.

Si más adelante se decide mantener una colección normalizada de productos, primero preparar un cambio de esquema revisado que registre la tabla y la colección, cargue/valide sus datos y defina lectura para el rol de aplicación. El gate posterior debe distinguir `colección ausente` de `colección existente sin permiso`, y validar endpoint, conteo y una muestra antes de cambiar el caller. No crear tablas ni permisos en esta fase.

## Alcance y límites

- Se verificaron ocho referencias de imagen vivas de `Servicios` y 54 objetos de `Servicios.Productos`; no se recorrieron las 518 fichas ni todos los archivos de la biblioteca.
- Los cuatro controles positivos demuestran acceso a assets presentes para ese token, pero no prueban que todas las demás filas físicas estén completas.
- Se comprobó ausencia de tabla y registro de colección `productos` en el esquema activo. Se listaron respaldos offsite disponibles y se examinaron metadatos en dumps; no se extrajeron los tar de uploads ni los bundles cifrados, ni se evaluó una migración de datos.
- El resultado es de producción en modo lectura y sirve para decidir el tratamiento local y preparar un cambio revisable; no autoriza una modificación del servidor.

## Integración local completada

La rama completa los cinco enlaces que faltaban en `image-local-map.json`; los ocho UUID de Servicios resuelven a archivos locales existentes. Los 54 objetos vivos se normalizan desde `Servicios.Productos`. Se preserva por separado el producto editorial CCTV AI publicado en el repositorio. No se restauraron ni sobrescribieron binarios del volumen de Directus; no se modificó metadata, esquema, permisos ni servicios. Los hashes de la tabla son de las copias locales, no una comparación contra los originales ausentes.
