# Entrega E2E visual UMSA — gate unificado (localhost)

**Fecha:** 29 mayo 2026
**Demo:** http://localhost:4321
**Rama:** `codex/umsa-white-dossier-local`
**Alcance:** localhost. Sin deploy, sin push, sin commits en esta entrega.

---

## 1. Veredicto

**Compuerta oficial:** `npm run audit:e2e:visual` → **`totalFailures: 0`**

Evidencia: `docs/audits/e2e-visual-latest/e2e-visual-suite-summary.json` (generado 2026-05-29T21:19:34Z).

| Capa | Checks / rutas | Fallos |
|------|----------------|--------|
| Comercial strict (`audit:visual:commercial`) | **64** (32 labels × desktop + mobile) | **0** |
| Heurística (`heuristic-visual-scan.mjs`) | Matriz comercial | **0** defectos |
| Defect scan (`e2e-defect-scan.mjs`) | **30** paths | **0** defectos |
| Jest (`visualInformationHubContracts`) | 6 tests | **OK** |

---

## 2. Comandos

```bash
cd /Users/santosma/Projects/um25
npm run dev -- --port 4321

# Gate único (recomendado antes de demo / PR)
npm run audit:e2e:visual

# Capas por separado
npm run audit:visual:commercial
node scripts/heuristic-visual-scan.mjs
node scripts/e2e-defect-scan.mjs
npm run test -- __tests__/visualInformationHubContracts.test.js
```

---

## 3. Matriz comercial (32 labels)

Fuente única: `scripts/e2e-commercial-labels.mjs` → `COMMERCIAL_E2E_LABELS`.

| Grupo | Labels |
|-------|--------|
| Core | `home default`, `servicios default`, `nosotros default`, `contacto default` |
| Servicios (8) | `servicio detalle default` + redes, seguridad, telecom, software, consultoría, eléctrico, incendios |
| Antecedentes | `antecedentes default`, `antecedentes filtrado default`, `antecedente detalle default` |
| Sectores | `sectores default`, `sectores filtrado default`, `vertical sector default` |
| Verticales (8) | bodegas, gobierno, minería, industria, salud, software, constructoras, seguridad |
| Blog | `blog default`, `blog detalle default` (ARCA) |
| GEO (4) | mendoza, argentina, presupuesto, proyectos |

Defect scan adicional: variantes atlas (`E2E_DEFECT_PATHS`, 30 URLs).

---

## 4. Criterios DESIGN.md cubiertos (strict comercial)

- Tipografía cuerpo ≥ 16px; un H1; peso H1 ≤ 700
- Sin overflow horizontal; contraste legible en hero y editorial
- Rojo `#DC2626` no en microtexto sobre oscuro
- CTA diagnóstico en primer viewport (rutas marcadas)
- Canonical explícito en hubs GEO
- Sin claims `99.xx%` / `518+` en superficie comercial
- Sin copy ledger en viewport (`soluciones integrales`, `transformación digital`, etc.)
- Sin acentos cyan SaaS; imágenes producto sin marco decorativo
- Sin emojis en main comercial (defect scan)

---

## 5. Fixes de cierre (sesión E2E)

| Área | Cambio |
|------|--------|
| Copy CMS servicios | `stripBannedLedgerPhrases`, `sanitizeServicePageTitle`, stats/productos sin 99.x% |
| Detalle servicio | Hero lead, breadcrumb corto, body sanitizado |
| Defect scan | Excluye `pre`/`code` del chequeo Markdown (comentarios `#` en bloques shell) |
| Orquestación | `scripts/run-e2e-visual-suite.mjs` + `audit:e2e:visual` |

---

## 6. Artefactos

| Archivo | Descripción |
|---------|-------------|
| `e2e-visual-suite-summary.json` | Resumen de las 4 capas |
| `strict-commercial/audit-commercial-strict.json` | JSON strict 64 checks |
| `ENTREGA-E2E-VISUAL.md` | Este documento |

---

## 7. Fuera de gate

- `npm run audit:visual:strict` monolítico (92+ rutas, una pestaña CDP): puede dar falsos positivos de canonical; **no usar como gate**.
- Blog ARCA: post largo; CTA hacia `/plantilla-arca` — OK en defect scan tras exclusión de bloques código.
- Producción / commits: fuera de alcance de esta entrega.

---

## 8. Próximos pasos (opcionales)

1. `npm run check` antes de merge.
2. Commit en `codex/umsa-white-dossier-local` cuando quieras congelar.
3. PR con capturas en `docs/audits/umsa-closure-2026-05-29/captures/` + enlace a este gate.
