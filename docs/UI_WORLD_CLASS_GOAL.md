# UMSA World-Class UI Hardening

Fecha: 2026-06-13

## Objetivo

Convertir la UI publica de ULTIMA MILLA en una interfaz premium de proveedor IT internacional: sobria, tecnica, consistente, rapida de leer y libre de lenguaje interno de CMS, fallback o administracion.

La meta no es decorar. La meta es que cada ruta critica comunique en menos de 30 segundos:

- que problema operativo resuelve UMSA;
- con que capacidad tecnica;
- con que evidencia real;
- cual es el siguiente paso comercial.

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
