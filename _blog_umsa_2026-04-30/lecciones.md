# Lecciones — corrida 2026-04-30

- Las credenciales fijas en el SKILL son frágiles: si rotan en backend, el bot pierde 24 hs de publicación. **Mejora**: leer la credencial de un secret externo (env var, archivo `~/.umsa/blog_creds`) y caer al modo "borrador" si falla el auth, en lugar de abortar.
- Cloudflare bloquea POST con UA `Python-urllib/x`: siempre setear `User-Agent: UMSA-Blog-Editor/1.0` desde el inicio.
- El endpoint hace 301 www → apex; usar `--post301 --post302 -L` o bien apuntar directo a `https://ultimamilla.com.ar/api/blog`.
- El campo `contenido` acepta Markdown plano con `[texto](url)`, `**bold**` y `## H2`. Sin frontmatter.
