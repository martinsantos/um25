# UMSA Diaria - Rescate operativo

## Resumen

El estilo particular de UMSA Diaria reside ahora en dos capas:

1. Capa editable por sitio: `/Users/santosma/umsa-codex/config/styles/ultimamilla.md`.
2. Capa legacy/detallada UMSA: `/Users/santosma/umsa-codex/.agents/skills/umsa-diaria/SKILL.md`.

La capa que buscamos reutilizar en N sitios es:

- Skill generica: `/Users/santosma/umsa-codex/.agents/skills/editorial-diaria/SKILL.md`.
- Config operativa por sitio: `/Users/santosma/umsa-codex/config/sites/{SITE_ID}.json`.
- Estilo por sitio: `/Users/santosma/umsa-codex/config/styles/{SITE_ID}.md`.
- Agenda por sitio: `/Users/santosma/umsa-codex/config/agendas/{SITE_ID}.json`.

El sitio Astro no ejecuta la automatizacion diaria: solo expone el API, renderiza el blog, filtra programadas y actualiza sitemap/RSS/feed visible.

## Archivos rescatados

### UMSA especifico

- `/Users/santosma/umsa-codex/.agents/skills/umsa-diaria/SKILL.md`
  - Voz UMSA completa.
  - Matriz anti-repeticion de aperturas.
  - Reglas de titulo.
  - Auditorias: anti-leak, reframe, analogias, apertura, didactica y ortografia.
  - Estructura obligatoria de nota.
  - Contrato de exito de corrida.

- `/Users/santosma/umsa-codex/config/styles/ultimamilla.md`
  - Estilo editable resumido.
  - Espanol argentino amable, tecnico y humano.
  - Prohibicion de nombres propios artificiales en titulos.
  - Politica de fuentes, enlaces, tildes y mencion tardia de UMSA.

- `/Users/santosma/umsa-codex/config/agendas/ultimamilla.json`
  - Cadencia diaria.
  - Mix diario: reactiva, evergreen tecnica, caso/industria.
  - Distribucion semanal objetivo.
  - Politica de fuentes y duplicados.

- `/Users/santosma/umsa-codex/config/sites/ultimamilla.json`
  - Canonical, endpoint, blog publico, timezone, slots, categorias y paths de config.
  - Auth por variables de entorno: `BLOG_API_USER/BLOG_API_PASS`, con fallback legacy `UMSA_BLOG_USER/UMSA_BLOG_PASS`.

### Generico multi-sitio

- `/Users/santosma/umsa-codex/.agents/skills/editorial-diaria/SKILL.md`
  - Skill base para agenda, redaccion, validacion y publicacion periodica.
  - Carga `config/sites/{SITE_ID}.json`.
  - Carga `style_path` y `agenda_path`.
  - Define contrato estable de payload.
  - Permite generador local/remoto mediante `EDITORIAL_AGENT_COMMAND`.

### Runners y validadores

- `/Users/santosma/umsa-codex/scripts/run-umsa-diaria-codex.sh`
  - Runner launchd.
  - Lock anti-duplicado.
  - Preflight obligatorio.
  - Watchdog de 2 horas.
  - Soporta Codex CLI por defecto o `EDITORIAL_AGENT_COMMAND`.

- `/Users/santosma/umsa-codex/scripts/umsa-diaria-preflight.mjs`
  - DNS.
  - Canonical con `www`.
  - Proteccion del POST anonimo.
  - Credenciales presentes y aceptadas sin publicar.
  - Outputs y memoria escribibles.

- `/Users/santosma/umsa-codex/scripts/umsa-orthography.mjs`
  - Corrige y audita tildes/eñes en campos visibles.
  - Protege URLs, inline code y code fences.
  - Emite `.report.json`.

- `scripts/umsa-diaria-preflight.mjs`
  - Preflight equivalente dentro del repo Astro.

- `scripts/umsa-diaria-safe-handoff.mjs`
  - Fallback seguro si hay sandbox/red/DNS bloqueados.
  - Genera paquete pendiente y `replay_post.sh`.

### Prompts y launchd

- `/Users/santosma/umsa-codex/PROMPT_AUTOMATION_UMSA_DIARIA.txt`
  - Prompt diario activo.
  - Invoca `$editorial-diaria` y `$umsa-diaria`.
  - Fija `SITE_ID=ultimamilla` y `PUBLICAR=1`.

- `/Users/santosma/umsa-codex/PROMPT_TEST_DRY_RUN_UMSA.txt`
  - Prompt de prueba sin publicacion.

- `/Users/santosma/umsa-codex/PROMPT_RECOVERY_UMSA_2026_06_04.txt`
  - Prompt de recuperacion usado para backfill.

- `/Users/santosma/Library/LaunchAgents/com.ultimamilla.umsa-diaria.plist`
  - LaunchAgent operativo indicado por la documentacion.
  - Horario documentado: 06:10 America/Argentina/Mendoza.

## Proceso operativo actual

1. LaunchAgent ejecuta `run-umsa-diaria-codex.sh`.
2. El runner toma lock en `outputs/.umsa-diaria.lock`.
3. Ejecuta `npm run umsa:preflight`.
4. Lanza el generador:
   - Codex CLI por defecto.
   - Alternativa local/remota si existe `EDITORIAL_AGENT_COMMAND`.
5. El prompt carga `$editorial-diaria` y `$umsa-diaria`.
6. La skill generica carga site/style/agenda por `SITE_ID`.
7. Se investigan fuentes, se evitan duplicados, se redactan tres notas.
8. Se audita ortografia, fuentes, estilo, didactica, aperturas y links.
9. Se postea a `/api/blog`.
10. Se generan Markdown/DOCX espejo.
11. Se verifican URLs a +60s.
12. Se escriben logs, backlog, fuentes y resumen final.

## Estado persistente

Los archivos de memoria editorial viven en `/Users/santosma/umsa-codex/outputs`:

- `backlog.json`: pipeline de temas.
- `eje_semanal.json`: tema rector de la semana.
- `fuentes.json`: fuentes verificadas.
- `personajes_log.json`: rotacion de protagonistas.
- `log_corridas.jsonl`: bitacora completa.
- `reporte_semana_YYYY-WW.json`: resumen semanal.
- `umsa-diaria-YYYY-MM-DD/`: paquete completo de cada corrida.
- `launchd/run-*.log`: logs del runner.
- `launchd/final-*.md`: ultima respuesta del generador.

## Contrato para N sitios

Para sumar otro sitio sin copiar UMSA:

1. Crear `/Users/santosma/umsa-codex/config/sites/{SITE_ID}.json`.
2. Crear `/Users/santosma/umsa-codex/config/styles/{SITE_ID}.md`.
3. Crear `/Users/santosma/umsa-codex/config/agendas/{SITE_ID}.json`.
4. Usar `$editorial-diaria`.
5. Evitar `$umsa-diaria` salvo para `SITE_ID=ultimamilla`.
6. Mantener el mismo payload minimo:

```json
{
  "titulo": "",
  "resumen": "",
  "contenido": "",
  "categoria": "",
  "imagen_portada": "",
  "tags": [],
  "tiempo_lectura": 3,
  "fecha_publicacion": "",
  "meta_title": "",
  "meta_description": ""
}
```

## Riesgo pendiente

Hay compatibilidad legacy donde algunos documentos/skills aun conservan ejemplos de `Authorization: Basic ...`. El esquema correcto para N sitios es credencial por entorno, no credencial embebida:

- `BLOG_API_USER`
- `BLOG_API_PASS`
- `UMSA_BLOG_USER`
- `UMSA_BLOG_PASS`

Proxima depuracion recomendada: rotar credenciales si alguna quedo expuesta, eliminar tokens embebidos de docs/skills y hacer que preflight falle si no hay variables de entorno explicitas.
