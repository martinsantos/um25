# Automatizacion de blog

## Fuente de verdad

La automatizacion diaria activa vive fuera del sitio Astro, en:

```text
/Users/santosma/umsa-codex
```

El sitio Astro renderiza y publica via Directus, pero no ejecuta la corrida diaria.

## Skills

- Skill generica multi-sitio: `/Users/santosma/umsa-codex/.agents/skills/editorial-diaria/SKILL.md`
- Skill editorial UMSA: `/Users/santosma/umsa-codex/.agents/skills/umsa-diaria/SKILL.md`
- Config del sitio: `/Users/santosma/umsa-codex/config/sites/ultimamilla.json`
- Estilo editable: `/Users/santosma/umsa-codex/config/styles/ultimamilla.md`
- Agenda editable: `/Users/santosma/umsa-codex/config/agendas/ultimamilla.json`

Para crear otro sitio, agregar `config/sites/{SITE_ID}.json`, su archivo de estilo y su agenda. La skill base no debe depender de un proveedor de IA especifico.

## Runner diario

- Script: `/Users/santosma/umsa-codex/scripts/run-umsa-diaria-codex.sh`
- Prompt: `/Users/santosma/umsa-codex/PROMPT_AUTOMATION_UMSA_DIARIA.txt`
- LaunchAgent: `/Users/santosma/Library/LaunchAgents/com.ultimamilla.umsa-diaria.plist`
- Horario: 06:10, `America/Argentina/Mendoza`

Por defecto el runner usa Codex CLI. Para enchufar un generador local o proveedor propio, definir:

```bash
export EDITORIAL_AGENT_COMMAND="comando-local-que-lee-el-prompt-por-stdin"
```

El comando debe respetar el mismo contrato: generar payloads, publicar por API si corresponde, escribir logs y emitir resumen final.

## Publicacion

Endpoint canonico:

```text
https://www.ultimamilla.com.ar/api/blog
```

Politica:

- Sin fecha futura: `published` inmediato.
- Fecha futura: `scheduled`.
- El sitio, RSS y sitemap muestran `published` y `scheduled` vencidas.
- Las programadas futuras no aparecen en `/blog`, RSS ni sitemap.

## Salidas

- Corridas: `/Users/santosma/umsa-codex/outputs/umsa-diaria-YYYY-MM-DD/`
- Logs launchd: `/Users/santosma/umsa-codex/outputs/launchd/run-*.log`
- Resumen final: `/Users/santosma/umsa-codex/outputs/launchd/final-*.md`
- Preflight ultimo: `/Users/santosma/umsa-codex/outputs/preflight-ultimo.json`
- Estado editorial: `backlog.json`, `eje_semanal.json`, `fuentes.json`, `log_corridas.jsonl`
