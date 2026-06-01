# Auditorías visuales UMSA (localhost)

Solo uso local en `http://localhost:4321`. Sin deploy ni push desde estas carpetas.

## Comandos

```bash
npm run dev

# Heurística rápida (28 rutas comerciales, desktop)
node scripts/heuristic-visual-scan.mjs

# Strict — preferir una ruta o modo aislado
VISUAL_AUDIT_STRICT=1 VISUAL_AUDIT_COMMERCIAL_ONLY=1 \
VISUAL_AUDIT_LABEL_ONLY=1 \
VISUAL_AUDIT_ROUTE_FILTER='^home default$' \
VISUAL_AUDIT_VIEWPORT_FILTER='^(desktop|mobile)$' \
node scripts/visual-contrast-audit.mjs

# Capturas
VISUAL_SNAPSHOT_DIR=docs/audits/e2e-visual-2026-05-29/iter1 \
VISUAL_SNAPSHOT_ROUTE_FILTER='default$' \
VISUAL_SNAPSHOT_VIEWPORT_FILTER='^(desktop|mobile)$' \
node scripts/capture-visual-snapshots.mjs
```

## Variables útiles

| Variable | Efecto |
|----------|--------|
| `VISUAL_AUDIT_LABEL_ONLY=1` | Modo aislado: más pausa entre rutas y reintento de navegación (evita `navigation mismatch` en batch). |
| `VISUAL_AUDIT_ROUTE_FILTER` | Regex sobre `label` o `path` de ruta. |
| `VISUAL_AUDIT_VIEWPORT_FILTER` | Regex sobre nombre de viewport. |
| `VISUAL_AUDIT_COMMERCIAL_ONLY=1` | Solo matriz comercial (sin labs/skins white). |

## Entregas

- `world-class-2026-05-29/ENTREGA-MUNDIAL.md`
- `e2e-visual-2026-05-29/ENTREGA-E2E-VISUAL.md`
- `e2e-visual-2026-05-29/PLAN-CERRADO.md`
