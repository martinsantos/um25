# Diagnóstico Forbes 500 / Shenzhen 2026 — UMSA localhost

**Fecha:** 30 mayo 2026
**Rama:** `codex/umsa-white-dossier-local`
**Entorno auditado:** réplica local en `http://localhost:4321` (`npm run dev:replica`, skin híbrido, datos Directus reales)
**Rol del auditor:** revisión externa, escéptica, orientada a "¿esto convence a un comprador corporativo internacional?"
**Alcance:** diagnóstico + propuesta. No se modificó código, no se commiteó nada.

**Actualización 30/05/2026:** pasada de honestidad de contenido aplicada en código — ver [`HONESTIDAD-CONTENIDO.md`](./HONESTIDAD-CONTENIDO.md) (ISO inventadas retiradas, conteo 469+ corregido a snapshot 518, TrustStrip sin logos falsos).

---

## 0. Aclaración crítica sobre el "9,1/10" interno

El informe interno `docs/audits/world-class-2026-05-29/INFORME-MUNDIAL.md` reporta **9,1/10**. Ese número **no describe lo que el cliente está viendo hoy**, y por eso percibe una brecha. Razón concreta y verificable:

- El gate visual (`audit:e2e:visual`) y las capturas "iter2/iter3" se corrieron sobre las **plantillas editoriales mockeadas** (copy "white dossier": *"Servicios IT para operaciones que no pueden detenerse"*, *"Evidencia operativa documentada"*, etc.).
- La **réplica que el cliente abre** (`dev:replica`) activa `UMSA_LOCAL_REPLICA=1`, que enciende `isReplicaIdenticalCopy()` (default ON en `src/utils/replicaProdCopy.ts`). Esto **fuerza el copy legado de producción** desde `src/data/replica-prod-copy.json`.

Resultado: el cliente ve el **layout nuevo con el copy viejo y genérico**. Verificado en vivo vía CDP/HTTP:

| Ruta | H1 que ve el cliente (réplica) | H1 del mock editorial (lo que se "auditó" con 9,1) |
|------|-------------------------------|----------------------------------------------------|
| `/` | **"Conectamos la tecnología con el éxito de su empresa"** | "Servicios IT para operaciones que no pueden detenerse." |
| `/servicios` | **"Excelencia en Servicios Tecnológicos"** | "Servicios IT integrales para continuidad operativa" |
| `/antecedentes` | **"Nuestra Experiencia"** | "Evidencia operativa documentada." |
| `/sectores` | **"Soluciones por Industria"** | "Infraestructura IT por sector, con evidencia operativa." |
| `/nosotros` | **"Infraestructura y Tecnología que Impulsa"** (frase incompleta) | narrativa institucional |

**El copy legado viola el propio contrato de `DESIGN.md`** (ledger UMSA): "Conectamos la tecnología con el éxito", "Excelencia en Servicios Tecnológicos" y "Soluciones por Industria" son exactamente los claims genéricos sin mecanismo/prueba que el documento prohíbe.

**Conclusión honesta:** la maqueta editorial (sin réplica) está cerca de **8/10**. La **réplica real que se evalúa está en ~6,5/10**. La brecha más grande y más barata de cerrar es de **copy/proof**, no de layout.

---

## 1. Resumen ejecutivo

El sitio ya tiene un **sistema base sólido**: tokens UMSA en `v4.css`, navbar/footer coherentes, formulario de contacto sobrio con antispam invisible, JSON-LD + hreflang + sitemap, rutas dinámicas estables, componentes reutilizables (`EvidenceCaseRow`, `ProductCard`, plantillas editoriales). El detalle de antecedente ya usa imagen real de Directus (fix aplicado, no se re-reporta) y el detalle de servicio 105/107 está saneado.

Sin embargo, **para el nivel "proveedor industrial/tech internacional" (Siemens, Schneider, Hikvision, Dahua), faltan tres cosas que esas marcas tienen y UMSA no muestra hoy**:

1. **Copy de nivel (en la réplica) y prueba dura.** Hoy la réplica muestra slogans genéricos y métricas redondas sin respaldo verificable ("469+", "22+", "99,xx%" en algunos lados). No hay un solo número con fuente o caso medible al frente.
2. **Señales de confianza de tier corporativo.** Cero certificaciones visibles (ISO 9001 / ISO 27001 / NFPA), cero logos de clientes, cero datasheets/PDF descargables, sin página de seguridad/compliance, sin versión en inglés real.
3. **Pulido visual fino y consistencia entre plantilla y datos reales.** Heroes oscuros con contraste al límite (p. ej. sectores editorial), tipografía de héroe que en mock se ve sobre-pesada (≈800) vs. el 600 contractual, y el GEO landing con H1 sin tildes ("tecnologicos", "informaticos") que lee como error.

La buena noticia: **el 80% del salto percibido se logra con trabajo de contenido + 4–5 componentes nuevos maquetables localmente**, sin reescritura. El layout ya soporta el nivel; le falta la capa de evidencia y rigor editorial.

---

## 2. Matriz de brechas (estado actual vs. objetivo ~90%)

Escala: % actual percibido en la **réplica** / objetivo 90%. Impacto: **Alto/Medio/Bajo**. Tipo: **V**isual / **F**uncional.

| # | Dimensión | Actual | Obj. | Gap | Impacto | Tipo | Defecto concreto observado |
|---|-----------|-------:|-----:|----:|---------|------|----------------------------|
| 1 | **Copy / ledger editorial (réplica)** | 55% | 90% | 35 | **Alto** | F+V | H1 genéricos ("Conectamos…", "Excelencia…", "Nuestra Experiencia") forzados por `replica-prod-copy.json`. Violan el ledger de `DESIGN.md`. |
| 2 | **Prueba / credibilidad dura** | 50% | 90% | 40 | **Alto** | F | "469+/22+/24-7" sin fuente; ningún caso con métrica de resultado (uptime, tiempo de respuesta, ahorro). |
| 3 | **Señales de confianza tier** | 30% | 90% | 60 | **Alto** | V+F | Sin ISO/NFPA, sin logos de clientes, sin datasheets PDF, sin página seguridad/compliance. |
| 4 | **Sistema visual / consistencia** | 75% | 90% | 15 | Medio | V | Hero sectores editorial con contraste bajo (H1 gris sobre negro); peso de héroe mock ≈800 vs. 600 contractual. |
| 5 | **Jerarquía / ritmo editorial** | 78% | 90% | 12 | Medio | V | Antecedentes index (mock) muy bueno; home réplica con hero alto + grilla 8 servicios densa antes de la prueba. |
| 6 | **Imágenes / dirección de arte** | 70% | 90% | 20 | Medio | V | Mezcla de fotos reales buenas (antecedentes) con stock data-center genérico; falta gate de 1 imagen aprobada por familia. |
| 7 | **Internacionalización (i18n)** | 25% | 90% | 65 | **Alto** | F | `hreflang` solo `es/es-AR/x-default`; **no existe versión EN**. Inviable como "proveedor internacional" sin inglés. |
| 8 | **SEO / GEO técnico** | 80% | 90% | 10 | Bajo | F | Base buena (JSON-LD, sitemap, hubs GEO). Defecto: H1/title GEO sin tildes ("tecnologicos/informaticos"); canonical OK. |
| 9 | **Formularios / conversión** | 78% | 90% | 12 | Medio | F | Contacto sobrio con honeypot+timing OK. Falta: presupuesto por variables, adjuntar pliego, confirmación/estado de envío visible, CTA por intención coherente en toda ruta. |
| 10 | **Performance (LCP/CLS)** | 70% | 90% | 20 | Medio | F | Heroes con imagen pesada + fuentes; no medido formalmente. Falta `loading`/`fetchpriority`, `width/height` para CLS, presupuesto de performance. |
| 11 | **Accesibilidad (WCAG AA)** | 65% | 90% | 25 | Medio | F+V | Contraste de héroe oscuro al límite; falta auditoría axe sistemática, foco visible, skip-link, labels en todos los controles. |
| 12 | **Navegación / búsqueda / filtros** | 80% | 90% | 10 | Bajo | F | Filtros de antecedentes sobrios. Falta búsqueda real con resultados (hoy es input decorativo) y estado de "sin resultados". |
| 13 | **Salud técnica / resiliencia CMS** | 70% | 90% | 20 | Medio | F | Dependencia Directus; fallbacks existen pero el strict monolítico da OOM/falsos canonical; copy legado mezclado en datos crudos de servicios. |
| 14 | **Blog editorial** | 80% | 90% | 10 | Bajo | V | Tokens UMSA OK, imagen real por nota. Falta autor/fecha/lectura consistentes y módulo de relacionados fuerte. |

**Promedio ponderado réplica ≈ 65%.** Para llegar a ~90% el bloque crítico es **1, 2, 3, 7** (copy, prueba, confianza, inglés): ahí está el 70% de la brecha percibida.

---

## 3. Roadmap priorizado, realista y maquetable

Esfuerzo: **S** (≤0,5 día) / **M** (1–2 días) / **L** (3–5 días). Todo reutiliza la arquitectura Astro + `v4.css` + componentes `um/*` existentes. Se marca lo que es **maquetable local** vs. lo que necesita **CMS/backend**.

### Fase A — Quick wins de mayor salto/$ (1–3 días, casi todo maquetable)

| # | Qué | Dónde | Esfuerzo | Impacto | Maquetable |
|---|-----|-------|---------:|---------|-----------|
| A1 | **Promover copy editorial a la réplica.** Reemplazar los H1/títulos legados de `replica-prod-copy.json` por el ledger editorial aprobado en `DESIGN.md` (o poner `UMSA_REPLICA_IDENTICAL=0` y aprobar el copy del mock como nuevo prod). Es **el cambio de mayor impacto y menor costo**. | `src/data/replica-prod-copy.json`, `src/utils/replicaProdCopy.ts` | **S** | **Alto** | Local |
| A2 | **Corregir tildes en hubs GEO.** "tecnologicos→tecnológicos", "informaticos→informáticos" en H1/title visibles (mantener variante sin tilde solo como keyword interna si se quiere). | `replica-prod-copy.json` + páginas `/servicios-it-empresas-*` | S | Medio | Local |
| A3 | **Banda de confianza** (logos clientes + certificaciones) bajo el hero de home y servicios. Maqueta con placeholders monocromáticos (Gobierno de Mendoza, Aeropuertos Arg. 2000, etc., ya son clientes reales citados en antecedentes). | nuevo `src/components/um/TrustStrip.astro`; usar en `index.astro`, `servicios.astro` | **M** | **Alto** | Local (logos reales = activos) |
| A4 | **Fix de contraste de heroes oscuros.** Subir color de H1/lead a blanco real (`--skin-hero-text`) y reforzar wash; el H1 de sectores editorial hoy queda gris sobre negro. | `v4.css`, `SectorTemplateEditorial.astro` | S | Medio | Local |
| A5 | **Normalizar peso de héroe a 600.** Eliminar el peso visual ≈800 que aparece en mocks de home/servicios para cumplir el contrato tipográfico. | `v4.css` (`.um-heading-xl`) | S | Bajo/Medio | Local |
| A6 | **Métricas con respaldo.** Cambiar "469+/22+" sueltos por bloque `número / etiqueta / evidencia` enlazada (469 → /antecedentes; 22 años → /nosotros). Quitar cualquier "99,xx%". | `MetricStrip` / heroes | S | Medio | Local |

### Fase B — Estructural de credibilidad (3–6 días)

| # | Qué | Dónde | Esfuerzo | Impacto | Maquetable |
|---|-----|-------|---------:|---------|-----------|
| B1 | **Componente `CaseMetric` / caso con resultado.** Cada antecedente protagonista muestra 2–3 KPIs (ej.: "CCTV 24/7 en 3 terminales", "respuesta < 2h"). Hoy hay alcance pero no resultado. | `EvidenceCaseRow.astro`, plantilla antecedente detalle | **M** | **Alto** | Mock local; ideal CMS (campo `resultado`) |
| B2 | **Página de Certificaciones / Compliance** (`/certificaciones` o sección en `/nosotros`): ISO, NFPA, normas eléctricas, política de calidad/seguridad. | nueva página + nav/footer | **M** | **Alto** | Mock local; activos reales = legal/cliente |
| B3 | **Datasheets / fichas PDF descargables** por servicio (`TechnicalFactSheet` con botón "Descargar ficha PDF"). | `servicios/[id]/[slug].astro`, `public/datasheets/` | **M** | Medio | Mock con PDF placeholder; final = contenido real |
| B4 | **Presupuesto por variables** (no precio): formulario `/contacto`/hub presupuesto con alcance, criticidad, SLA, adjuntar pliego. | `contacto.astro`, hub `presupuesto-*` | **M** | Medio | Local (adjunto = backend) |
| B5 | **Búsqueda real de antecedentes** (filtro client-side sobre el dataset ya cargado + estado "sin resultados"). Hoy el input no busca. | `AntecedentesTemplateEditorial.astro` | **M** | Medio | Local |

### Fase C — Internacional + performance + a11y (5–8 días)

| # | Qué | Dónde | Esfuerzo | Impacto | Maquetable |
|---|-----|-------|---------:|---------|-----------|
| C1 | **Versión EN mínima** de home/servicios/contacto con `hreflang` real y `/en/` routing. Requisito duro para "proveedor internacional". | nuevo árbol `/en/`, layout i18n | **L** | **Alto** | Local (traducción = contenido) |
| C2 | **Pase de performance:** `width/height` + `fetchpriority="high"` en hero LCP, `loading="lazy"` en el resto, optimizar peso de imágenes hero, presupuesto LCP < 2,5s. | `EnhancedImage`/`OptimizedImage`, heroes | **M** | Medio | Local |
| C3 | **Pase WCAG AA con axe:** skip-link, foco visible, contraste de microtexto, labels, `alt` reales en imágenes de evidencia. | global (`LayoutV4`, componentes) | **M** | Medio | Local |
| C4 | **Resiliencia CMS:** documentar y testear fallback cuando Directus no responde; sanear copy genérico en títulos crudos de servicios (ej. "Transformación Digital" en consultoría 106). | `lib/directus.ts`, `editorialContent.ts` | **M** | Bajo/Medio | Local |

---

## 4. El camino más barato al mayor salto de calidad percibida

Si hay que elegir **una semana**, hacer en este orden:

1. **A1 (promover copy editorial a la réplica)** — convierte instantáneamente la web "genérica" que ve el cliente en la web "editorial" que ya está construida y auditada. Costo: horas.
2. **A3 + B2 (banda de confianza + certificaciones)** — es lo que distingue visualmente a un proveedor tier-1: logos de clientes reales + ISO/NFPA. Maquetable hoy con placeholders mientras se consiguen los activos.
3. **A6 + B1 (métricas con respaldo + caso con resultado)** — pasa de "afirmamos" a "probamos".
4. **A2 + A4 (tildes GEO + contraste hero)** — defectos chicos pero visibles que delatan amateurismo.

Con A1+A2+A3+A4+A5+A6 la réplica salta de ~65% a **~80%** en días. Sumando B1+B2 (confianza dura) y C1 (inglés) se alcanza el **~90%** objetivo.

---

## 5. Lo que NO hay que tocar / ya está bien

- Detalle de antecedente (imagen real de Directus, dossier) — **fix ya aplicado**.
- Detalle de servicio 105/107 (copy ledger saneado).
- Navbar/footer, tokens `v4.css`, formulario de contacto con antispam invisible.
- Base SEO técnica (JSON-LD, sitemap 200, robots 200, canonical GEO self-referencing).
- Plantilla editorial de antecedentes index — es el mejor ejemplo del nivel objetivo; usarla como vara para el resto.

---

## 6. Método y evidencia

- Lectura: `DESIGN.md`, `docs/ENTREGA-UMSA-WHITE-DOSSIER.md`, `docs/audits/world-class-2026-05-29/INFORME-MUNDIAL.md`, `CLAUDE.md`, `src/utils/replicaProdCopy.ts`, `src/data/replica-prod-copy.json`, `src/pages/index.astro`.
- Navegador (CDP): snapshots de `/` y `/sectores`, lectura de `computed style` de H1 (font Poppins 600 40px, confirmado).
- HTTP: matriz de H1/title en 10 rutas; scan de señales de confianza (ISO/NFPA/logos/datasheet), hreflang, sitemap/robots, campos del form de contacto, imagen de hero de antecedente, tildes en hub GEO.
- Capturas existentes revisadas: `docs/audits/forbes-500-2026-05-29-iter2/*.png` (home, servicios, sectores, antecedentes desktop).
- Nota: la captura headless del plugin dio timeout (problema conocido y documentado en `DESIGN.md`); la inspección visual se sostuvo con snapshots de accesibilidad, computed styles y las PNG ya generadas.
