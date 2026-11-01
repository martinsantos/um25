# Recuperación acotada de ocho imágenes de Servicios

Autorización del usuario: recuperar las ocho imágenes mediante CI/CD, sin publicar el rediseño ni intervenir otros servicios. Esta rama parte de develop; no incorpora la PR 541 ni cambia src/, public/, configuraciones del sitio o dependencias.

## Datos y método

Las filas directus_files y referencias Servicios.Imagen existen, pero faltan ocho binarios en el volumen activo. Las copias PNG del repositorio coinciden con el tamaño y dimensiones de la metadata y fueron inspeccionadas visualmente. Sus hashes identifican estas copias: no hay original disponible para afirmar igualdad binaria. La metadata previa dice JPEG; la recuperación declara PNG y conserva cada UUID.

El script `scripts/ops/hostinger-migration/recover-directus-service-assets.py` tiene fijados los ocho IDs, servicios, tamaños y hashes. Su modo `inspect` sólo lee. `pack` valida y reúne sólo los ocho archivos ya versionados. `apply` sólo se ejecuta en Hostinger por el workflow manual de master, con el secreto SSH existente y verificación estricta de host.

La operación exige la misma versión Directus 11.13.4, las ocho referencias originales, ausencia de originales, metadata intacta, permisos existentes suficientes y ausencia de flows activos. Compara la huella revisada, toma el lock compartido con el publicador y verifica el backup de metadata antes de escribir. No instala software en el servidor.

Cada archivo se reemplaza con PATCH multipart `/files/{uuid}`, según el [controller de Directus 11.13.4](https://github.com/directus/directus/blob/v11.13.4/api/src/controllers/files.ts). Los campos preceden al archivo; no se envía filename_disk en el upload. Directus deriva el nombre PNG y regenera las miniaturas del mismo UUID. No se modifican permisos, usuarios, esquema ni campos de Servicios.

Se verifican metadata conservada, originales con hash exacto y miniaturas PNG 160×90 en loopback y en el hostname público, sin token en las lecturas públicas. El agente HTTP se identifica como cliente compatible con la protección de Cloudflare: Python-urllib sin identificación recibe 1010 incluso para archivos existentes.

## Respaldo y fallo acotado

Cada run conserva `/srv/umsa-migration/directus-service-images/<run-attempt>/before.json`, el paquete de candidatos y un informe de resultados. No hay un binario original para respaldar porque las ocho rutas originales están ausentes. Los respaldos anteriores se conservan.

Si falla una carga o validación, se restaura la metadata de contenido de los IDs intentados, conservando las marcas de auditoría nuevas de Directus y el PNG recuperado para revisión. No se promete rollback de timestamps de auditoría. El archivo de disco del rollback sólo puede ser el basename JPEG original fijado para ese UUID. Un fallo de rollback queda identificado en el informe, sin ocultarlo. Directus puede regenerar o reemplazar derivados del mismo UUID durante la carga; eso no afecta otros archivos ni backups.

La comprobación final compara el release/PID web activo, identidades y fechas de inicio de contenedores y hashes de los vhosts. Si una lectura final falla, el informe distingue imágenes recuperadas de estado de runtime no comprobado. No se ejecuta reinicio, reload ni publicación web.

## Validación y Git Flow

Tests offline de integridad, alcance de escritura y fallo; ensayo real en un Directus desechable 11.13.4 en el runner con SQLite y uploads aislados, incluyendo originales, miniaturas, rollback de metadata y retry con una nueva inspección.

Feature → PR develop → PR master. Sólo workflow `hostinger-*`, script/tests en `scripts/ops/hostinger-migration/` y este documento. Esas rutas están excluidas del despliegue web; la recuperación requiere `workflow_dispatch` explícito y la huella vigente. El rediseño permanece local.
