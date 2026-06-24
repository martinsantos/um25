# UMSA World-Class UI Hardening

Fecha: 2026-06-13

## Objetivo

Convertir la UI publica de ULTIMA MILLA en una interfaz premium de proveedor IT internacional: sobria, tecnica, consistente, rapida de leer y libre de lenguaje interno de CMS, fallback o administracion.

La meta no es decorar. La meta es que cada ruta critica comunique en menos de 30 segundos:

- que problema operativo resuelve UMSA;
- con que capacidad tecnica;
- con que evidencia real;
- cual es el siguiente paso comercial.

## Estado de Auditoria - 2026-06-14

### Fixes P0 aplicados

- Se elimino el texto publico interno tipo "FUENTE DOCUMENTAL" y equivalentes; busqueda actual en `src`, `__tests__`, `docs` y `scripts` no encuentra ese copy.
- El contrato CSS comercial quedo limpio: `npm run audit:css` reporta `findings: 0`, `commercialErrors: 0`, `warnings: 0`.
- Se removieron sombras visibles en superficies comerciales criticas y se dejo la separacion basada en borde fino, fondo y espacio.
- Se normalizo texto visible sub-16px en superficies comerciales: modal de contacto, single de antecedente, servicios, CCTV AI y stats.
- Se corrigio H1 mobile en single de antecedente: visual strict mide `34px` en `/antecedentes/3064/...`.
- Se corrigio H1 en antecedentes filtrados por sector: visual strict mide `42px` desktop y `34px` mobile en `/antecedentes?sector=aeropuertos` y `/antecedentes?sector=bodegas`.
- Se elimino el script duplicado `download-images` en `package.json`; queda el flujo canonico de Directus.
- Se declaro explicitamente la coleccion `blog` en `src/content.config.ts`; el build ya no auto-genera esa coleccion.
- Se migro la configuracion runtime de Sentry a `sentry.client.config.ts` y `sentry.server.config.ts`; `npm run build` ya no emite warnings deprecated de Sentry ni warnings de sourcemap/release sin token.
- Se actualizo `caniuse-lite` en `package-lock.json`; `npm run build` ya no emite warning de Browserslist desactualizado.
- Se redujo deuda de lint de 71 a 0 warnings: se eliminaron parametros muertos, imports sin uso, callbacks legacy no consumidos, logs informativos de produccion, fixtures muertos en tests y ruido mecanico en scripts utilitarios.

### Evidencia de QA local

| Gate | Resultado | Evidencia |
|---|---:|---|
| CSS contract | PASS | `npm run audit:css`: 0 findings |
| Typecheck | PASS | `npm run typecheck` |
| Tests | PASS | `npm test -- --runInBand`: 31 suites, 254 tests |
| Lint | PASS limpio | `npm run lint`: 0 errores, 0 warnings |
| Build SSR | PASS limpio | `npm run build` sin warnings Sentry/Browserslist |
| SEO/GEO | PASS | `npm run seo:audit` |
| Visual strict focal | PASS | 16/16 combinaciones desktop/mobile sin failures |
| Visual strict regression | PASS | 4/4 antecedentes filtrados desktop/mobile sin failures |
| Visual strict comercial amplio | PARTIAL | 82 checks previos: 4 failures, todos el H1 filtrado ya corregido; rerun completo post-fix quedo sin output util y se corto manualmente |
| Produccion home | PASS | `curl -sSI https://www.ultimamilla.com.ar/`: HTTP 200 |
| Produccion antecedente 3067 | PASS | HTTP 200 y sin `FUENTE DOCUMENTAL`, `Datos del antecedente`, `Directus` ni textos equivalentes en HTML descargado |
| Directus origin health | PASS condicionado | `curl -k --resolve admin.ultimamilla.com.ar:443:23.105.176.45 .../server/health`: `{"status":"ok"}` |

Visual strict focal cubrio:

- `/`
- `/servicios`
- `/antecedentes`
- `/antecedentes?template=editorial&skin=white`
- `/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza`
- `/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza`
- `/blog`
- `/contacto`

### Hallazgos vivos priorizados

| Severidad | Area | Evidencia | Accion |
|---|---|---|---|
| P1 | Directus DNS/TLS publico | `dig +short admin.ultimamilla.com.ar` sin A record; health del origen responde 200 solo con `--resolve` y `-k` por certificado self-signed | Corregir DNS/Cloudflare de `admin.ultimamilla.com.ar` y certificado publico; no editar servidor manualmente fuera del flujo aprobado. |
| P2 | Visual full matrix | Rerun completo post-fix de la matriz comercial no entrego output util en tiempo razonable | Ejecutar `npm run audit:visual` completo antes de PR/deploy. |
| P2 | Produccion | Cambios validados localmente, no desplegados | Deploy solo via Git Flow/GitHub Actions. |

## Rutas Criticas

| Prioridad | Ruta | Criterio principal |
|---|---|---|
| P0 | `/` | Primer viewport con posicionamiento, imagen premium y CTA claro. |
| P0 | `/servicios` | Ocho frentes escaneables, sin filtros innecesarios ni cards genericas. |
| P0 | `/servicios/[id]/[slug]` | Ficha tecnica, alcance, metodo, evidencia y CTA por intencion. |
| P0 | `/antecedentes` | Evidencia real con jerarquia, imagenes nitidas y filtros sobrios. |
| P0 | `/antecedentes/[id]/[slug]` | Sin codigos internos visibles, sin lenguaje CMS, con ficha tecnica limpia. |
| P0 | `/contacto` | Formulario directo, tolerante, con alternativa de correo visible ante error. |
| P1 | `/nosotros` | Relato institucional serio, imagenes no genericas y prueba operativa. |
| P1 | `/sectores` y verticales | Mapa de riesgo/capacidad, sin tono consumer ni decoracion por color. |
| P1 | `/blog` y notas | Producto editorial tecnico alineado al sistema UMSA. |
| P1 | `/geo/*`, `llms*.txt`, sitemaps | SEO/GEO estable, sin errores publicos con nombres internos de infraestructura. |

## No Negociables

- No puede haber texto visible de fuente interna, datos de carga, registro administrativo, archivo de backend, codigos internos o equivalentes.
- El CMS puede ser fuente de datos, pero nunca parte del lenguaje publico.
- Ninguna imagen principal puede verse pixelada, pobre, estirada o decorativa sin funcion.
- Texto visible minimo: 16px en body, labels, metadata, filtros, botones y tabs.
- Radius maximo habitual: 8px. Sin cards dentro de cards.
- Rojo UMSA exacto: `#DC2626`; no variantes de rojo como acento de marca.
- Sin emojis, gradientes decorativos, overlays rojos repetidos ni estetica SaaS generica.
- Mobile no puede tener overflow horizontal, solapamientos ni CTAs partidos.

## Fases

### Fase 1: Limpieza de Lenguaje Publico

- Buscar y bloquear lenguaje interno en `src/pages`, `src/components`, `src/data`, `src/utils` y docs operativos.
- Sanitizar fallbacks que puedan venir de datos pobres.
- Reemplazar respuestas publicas de error por mensajes de contenido/servicio, sin nombrar infraestructura interna.

### Fase 2: QA Visual por Ruta

- Capturas desktop `1440x900`, laptop `1280x800`, tablet `834x1112`, mobile `390x900`.
- Revisar primer viewport, alineacion, jerarquia, imagen, CTA, filtros, cards y formularios.
- Registrar cada hallazgo con ruta, viewport, componente y fix esperado.

### Fase 3: Sistema UI Compartido

- Consolidar botones, metricas, fichas tecnicas, headers de seccion y cards.
- Eliminar patrones duplicados que generan desalineacion entre home, servicios, antecedentes y sectores.
- Usar tokens UMSA desde `src/styles/v4.css` y respetar `DESIGN.md`.

### Fase 4: Imagenes y Evidencia

- Auditar portada, `/nosotros`, `/sectores`, servicios y antecedentes.
- Reemplazar imagenes pobres por assets nitidos, con aspect ratio estable y funcion editorial.
- Validar `src`, `srcset` o fallbacks para que produccion no degrade a placeholders.

### Fase 5: SEO/GEO y CMS Pleno

- Mantener canonicals, JSON-LD, sitemaps, `llms.txt`, `llms-full.txt` y recursos GEO.
- Verificar que los datos del CMS alimenten la UI sin exponer nombres internos.
- Fallbacks solo como continuidad operativa, nunca como copy publico pobre.

### Fase 6: Gate de Produccion

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run audit:css`
- `npm run audit:visual`
- Smoke local de rutas P0.
- Deploy solo por Git Flow: feature -> develop -> master via GitHub Actions.

## Criterios de Aceptacion

Una ruta queda aprobada solo si cumple todo esto:

- HTTP 200 local y, tras deploy, HTTP 200 en produccion.
- Sin texto interno visible ni en HTML renderizado de rutas P0.
- Sin imagen rota, pixelada o con placeholder visible.
- Un solo H1 real y jerarquia estable.
- CTA primario visible en rutas comerciales.
- Sin overflow horizontal en 390px, 768px y 1440px.
- Contraste AA en texto normal y controles.
- Build y lint sin errores.

## Comandos de Control

```bash
rg -n -i "<patron-de-lenguaje-interno>" src/pages src/components src/data src/utils
npm run lint
npm test
npm run build
npm run audit:css
npm run audit:visual
```

## Primer Sprint Recomendado

Ejecutar un fix pack sobre:

- `/`
- `/antecedentes`
- `/antecedentes/3067/mantenimiento-critico-de-sistemas-de-deteccion-torre-thays`
- `/servicios`
- una single de servicio critica
- `/contacto`
- `/nosotros`
- `/sectores`
- tres verticales de sector con mas valor comercial

Salida esperada: PR unico de hardening visual con capturas, checklist de rutas y pruebas reproducibles.
