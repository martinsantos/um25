# UMSA diaria: fallback por sandbox

Cuando Codex no puede publicar por falta de red, DNS o permisos de escritura, la corrida no debe cerrarse como perdida. Usar:

```bash
npm run umsa:handoff -- --date 2026-05-01
```

El comando crea un paquete pendiente en `outputs/umsa-diaria-YYYY-MM-DD` o, si esa ruta no es escribible, en una ruta alternativa. Incluye:

- `nota_a.md`, `nota_b.md`, `nota_c.md`
- `payloads_pendientes.json`
- `replay_post.sh`
- `HANDOFF.md`
- `reporte_semana_YYYY-MM.json`
- `memory.pending.md` si no se puede escribir en `$CODEX_HOME/automations/umsa-diaria/memory.md`

Para reintentar la publicacion:

```bash
cd outputs/umsa-diaria-2026-05-01
export UMSA_BLOG_USER="editor@ultimamilla.com.ar"
export UMSA_BLOG_PASS="<password>"
./replay_post.sh
```

Si la corrida ya produjo un manifest con contenido completo, pasarlo con:

```bash
npm run umsa:handoff -- --date 2026-05-01 --manifest ./ruta/manifest.json
```

El manifest puede ser un array de notas o un objeto `{ "notes": [...] }`. Campos minimos por nota: `slot`, `titulo`, `categoria`. Si trae `contenido`, `slug`, `resumen`, `tags` o `fecha_publicacion`, se preservan.
