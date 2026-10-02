# Integración mínima · Demo de comunidades Última Milla

## Entrega

Variante 3.1 portable derivada de la v3 probada. No está publicada en producción. Incluye fuente, dependencias fijadas y `dist/` listo para servir en la subruta propuesta. No incluye repositorio Git, credenciales, configuración de Sites ni servidor nuevo.

Ruta propuesta: `/software/gestion-de-comunidades-profesionales/demo/`

CTA de la landing: **Probalo**. Texto de apoyo: “Explorá la vista del matriculado y la administración con datos de prueba”. Abrir la ruta como página independiente, en la misma pestaña. Si se decide nueva pestaña, usar `rel="noopener noreferrer"`. No agregar parámetros con nombres, correos, matrículas, documentos ni IDs de sesión.

## Build reproducible

Node 20 o posterior, `npm ci` y:

```
UM_BASE_PATH=/software/gestion-de-comunidades-profesionales/demo/ npm run build
npm test
```

`UM_BASE_PATH` acepta `/` o subrutas absolutas terminadas en `/`; rechaza consultas, fragmentos y puntos. Todos los recursos, workers, plantilla, manifest e iconos usan esa base. La navegación del sistema es interna en React: no requiere fallback SPA global.

Opciones:
- `UM_RETURN_URL=/software/gestion-de-comunidades-profesionales` para el regreso a la landing
- `UM_STORAGE_MODE=session` por defecto, recomendado para la demo de marketing
- `UM_STORAGE_MODE=local` sólo si se desea persistencia entre pestañas del mismo navegador; no usar para datos reales
- `UM_ENABLE_SW=false` por defecto. Sólo `true` lo incorpora; el build rechaza un SW en `/`

## Montaje y control de cambios

1. Servir únicamente el contenido de `dist/` dentro de la subruta. Conservar la barra final mediante redirección exacta de la ruta sin `/`
2. Servir JS y `.mjs` como JavaScript, CSS como `text/css`, SVG como `image/svg+xml`, WOFF2 como `font/woff2`, manifest como `application/manifest+json`
3. No incorporar scripts globales, analytics, pixels, tag managers, chat, formularios comerciales ni bundles de la landing dentro de la demo
4. Agregar CTA a la landing existente. No reemplazar su layout ni rutas vecinas
5. Usar el deploy protegido habitual, con respaldo y rollback de esa ruta y del CTA
6. Verificar en staging: carga completa, worker Excel, preview PDF, descarga plantilla, sesión nueva, reset, móvil 320/390 y navegación de regreso

Los nombres de assets no llevan hash: usar `Cache-Control: no-cache` con revalidación, al menos para HTML, JS, CSS, manifest y workers; evitar `immutable` para estos nombres. El WOFF2/PNG/SVG puede usar una política independiente si el despliegue asegura invalidación.

## CSP orientativa, sólo para la subruta

Probada en Chromium con los flujos de pago, planes, Excel, PDF y firma demo:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'
```

No aplicar esta política a toda la web sin revisar sus requisitos. `unsafe-inline` queda limitado a estilos por compatibilidad con el render local; no se requiere `unsafe-eval` ni scripts inline. Añadir `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`. HTTPS en producción. No configurar `Service-Worker-Allowed: /`.

## PWA y service worker

Manifest con `id`, `start_url` y `scope` exactos de la subruta. PNG 192/512 rasterizados fielmente desde los SVG oficiales; no icono inventado. El paquete normal no contiene `sw.js` ni registra workers. El manifest permite modo standalone según el navegador; no se promete instalación u offline universal.

Si se habilita explícitamente el SW, el archivo reside dentro de la subruta y se registra con ese scope. No tiene fetch handler, Cache API, caché de páginas, datos ni control de la raíz. No tocar ni desregistrar workers existentes de UMSA. Antes de publicar comprobar si un worker global de la web ya controla la ruta: si existe, el responsable UMSA debe excluir la demo de su caché/captura dentro del despliegue protegido.

## Datos, sesiones y alcance

No hay backend, autenticación, pagos, firma digital ni certificación real. Cambiar de Matriculado a Administración es un control de demostración. Se conservan todos los flujos v3 y sus avisos de simulación.

La variante utiliza sessionStorage y namespace por base. Cada pestaña independiente tiene datos de prueba propios; las vistas dentro de la pestaña están sincronizadas. Recargar conserva metadatos, pero los adjuntos PDF/imagen temporales deben volver a seleccionarse. Reiniciar elimina únicamente el namespace de la demo. El modo memoria funciona si el navegador bloquea almacenamiento.

SessionStorage no es una frontera de seguridad respecto de otros scripts del mismo origen. El navegador puede restaurar sesiones o copiar el estado inicial al duplicar pestañas. Usar sólo datos ficticios/anonimizados y reiniciar en dispositivos compartidos. No importar bases reales de clientes. Los límites de Excel y documentación siguen vigentes. No se suben archivos, no hay telemetría añadida ni datos personales en QR o URL.

## Identidad

Wordmark íntegro oficial de `https://www.ultimamilla.com.ar/`, trazados conservados; variantes con letras blancas y #111111, puntos rojos #DC2626. Fuente UM Sans pública del propio sitio con fallback Arial/system-ui. Favicon/isotipo e iconos proceden de `/favicon.svg`, `/favicon-192.svg` y `/favicon-512.svg`. Recursos incluidos para este proyecto autorizado de Última Milla, sin afirmación de licencia general de redistribución.

## Verificación

20 pruebas unitarias aprobadas. 38 recorridos de regresión Chromium aprobados bajo la subruta y CSP: pagos/doble clic/cancelación; QR decodificado en móvil; planes y centavos; promociones; ficha; abono/avisos; adjuntos PDF/PNG y errores; aprobación y versiones; Excel/CSV, persistencia de sesión, aislamiento, reset y almacenamiento bloqueado. Capturas desktop 1440 y móviles 390/320. Sin errores JS ni tráfico externo/subidas en los flujos probados.

Queda al responsable UMSA verificar el hosting real y sus headers, cookies, inyección de scripts y service workers. No se probó Safari/iOS ni publicación en tiendas. La campaña y sus canales se manejan por separado; este paquete no incorpora trackers.
