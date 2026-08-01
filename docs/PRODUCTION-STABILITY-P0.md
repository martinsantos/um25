# ULTIMA MILLA · Estabilidad de producción P0

Fecha de diagnóstico: 2026-08-01
Alcance: Astro SSR, Directus, PM2, Nginx y capacidad del VPS.

## Veredicto

La caída no se explica por una página lenta en régimen normal. La cadena observada es:

```text
PHP-FPM y servicios compartidos consumen RAM
  -> el memory monitor reinicia Astro
  -> PM2 deja el upstream 127.0.0.1:4321 sin escuchar
  -> Nginx devuelve connection refused o espera hasta timeout
  -> la web queda intermitente o caída
```

En la ventana del 31/07 se observó el evento de memoria crítica a las 16:17:43, `connection refused` en Nginx a las 16:17:48 y Astro escuchando nuevamente a las 16:17:50. La misma secuencia apareció tras el reinicio del 01/08.

## Correcciones incorporadas en este repositorio

- Todas las lecturas Directus tienen timeout configurable (`DIRECTUS_TIMEOUT_MS`, 5 s por defecto) y el cliente SDK hereda el mismo límite.
- `/health` comprueba Directus con un timeout corto (`DIRECTUS_HEALTH_TIMEOUT_MS`, 1,5 s por defecto), identifica el servicio real y expone la versión del proceso.
- Las API internas del blog usan el mismo límite para no retener workers cuando Directus se bloquea.
- Las consultas de `Servicios` ya no piden `slug`, campo que en producción estaba devolviendo 403; el slug se deriva del título cuando no existe en el snapshot.
- El pipeline deja de ignorar fallos de lint y tests.
- El deploy hace un único `pm2 startOrRestart`, espera el health del origen en `127.0.0.1:4321` y recién después prueba el edge público.
- Antes del arranque, el deploy elimina únicamente el alias huérfano observado `astro-app`; el script manual legado quedó bloqueado para impedir que vuelva a reiniciarlo.
- Las credenciales de publicación del blog dejaron de estar versionadas en `ecosystem.config.cjs`; deben existir como secretos `BLOG_API_USER` y `BLOG_API_PASS` del entorno de producción.

## Correcciones operativas pendientes

### Última lectura operativa (01/08/2026 13:33 UTC)

- `astro-ultimamilla` escucha en `0.0.0.0:4321` y su `/health` local respondió `200` con Directus saludable en 4 ms.
- El proceso huérfano `astro-app` seguía `online` con uptime `0s`, `31.813` reinicios y error repetido `astro: command not found` desde `/root`.
- El VPS tenía 683 MB disponibles de 3.655 MB totales; el disco estaba al 76% de uso.
- Nginx seguía declarando `worker_connections 2048` mientras el límite de archivos del proceso era 1024.

Esta lectura no constituye una intervención ni una garantía de recuperación pública: confirma que el proceso correcto está vivo y que el proceso huérfano y los límites de capacidad siguen pendientes de una ventana operativa.

Estas acciones no se ejecutan desde el checkout porque modifican un servidor compartido y deben pasar por una ventana aprobada, backup y rollback.

### 1. Eliminar el PM2 huérfano

`astro-app` no atiende el tráfico público, arranca `npm start -- --port 8093` desde `/root` y entra en un loop porque no encuentra el comando `astro`. Además, el cron de `ensure-pm2-processes.sh` persiste el dump cada cinco minutos por un `|| true` que hace que la rama de guardado siempre se ejecute.

Acción: ejecutar el próximo deploy por GitHub Actions para retirar el proceso huérfano del dump PM2, corregir el cron remoto para guardar solo cuando cambia el conjunto esperado y comprobar que el contador de reinicios permanece estable durante 30 minutos. No usar `scripts/deploy-server.sh`: ahora falla cerrado y remite al flujo protegido.

### 2. Recuperar un presupuesto de memoria real

El VPS tiene aproximadamente 3,6 GiB y dos pools PHP-FPM permiten hasta 50 workers cada uno. Durante el incidente había 17 workers ocupando aproximadamente 1,3 GiB, además de Directus, MariaDB, Nginx, Streamlit y otros servicios.

Acción: medir RSS por pool bajo carga, limitar `pm.max_children` a un presupuesto compatible con el VPS, añadir `pm.max_requests` para reciclar workers con crecimiento sostenido y mantener swap como red de seguridad, no como solución. El monitor no debe reiniciar Astro como primera respuesta: debe alertar, identificar el consumidor y reservar el restart para una condición de recuperación explícita.

### 3. Corregir la política de caché global

La configuración activa de Nginx agrega `no-cache, no-store` fuera del bloque `server`, por lo que alcanza HTML e imágenes. El edge aparece como `DYNAMIC/BYPASS` y las imágenes pasan repetidamente por Astro.

Acción: quitar esa regla global y aplicar `no-store` solo a health, autenticación, administración, contacto y APIs sensibles. Aplicar caché público versionado a `_astro`, fuentes e imágenes inmutables; para HTML SSR usar una política corta y explícita cuando el contenido lo permita.

### 4. Cerrar el riesgo de disco y logs

Hubo evidencia histórica de `No space left on device` en `sitrep-cron.log`. El disco actual no está lleno, pero el crecimiento de logs PM2 y Nginx debe tener rotación, retención y alerta.

## Objetivos medibles de aceptación

Se considera estabilizada la plataforma cuando, durante una ventana de observación de al menos 30 minutos y luego durante 24 horas:

| Objetivo | Umbral |
|---|---:|
| `/`, `/health`, `/robots.txt` y `/servicios` desde el origen | 100% HTTP 2xx |
| Errores Nginx `connection refused` / upstream timeout | 0 |
| Reinicios críticos del memory monitor | 0 |
| Reinicios del proceso público Astro | 0 no planificados |
| PM2 `astro-app` huérfano | ausente |
| Memoria disponible | >20% sostenida; alerta antes de 15% |
| Health del origen | <1 s y Directus <1,5 s |
| Render SSR estable de rutas core | p95 <500 ms en origen |
| Errores Directus por `Servicios.slug` | 0 |
| Lint, typecheck, tests y build | todos verdes |

La comprobación pública no sustituye la del origen: un CDN puede responder aunque Astro esté caído. El deploy debe validar ambas capas.
