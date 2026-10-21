# UM25 · Traspaso: sectores como composición de código (21/10/2026)

Para otra IA que retoma el trabajo. Leer entero antes de tocar nada. Este es un estado de desarrollo **no aprobado**: nada está publicado y el dueño todavía no dio el visto bueno final.

## 1. Dónde estamos

- Repo / checkout: `/Users/santosma/Documents/Codex/um25-cine-integracion` (remoto `martinsantos/um25`).
- Rama: `feature/isometric-redes-review` → PR #266 (draft) a `develop`. Último commit al escribir esto: `becbd5a0`.
- Estado del PR: `MERGEABLE`. CI: `Lint & Format` **falla** (causa NO investigada: no sé si es de estos archivos o previa); `Rebuild and compare demo` y `PR Summary Comment` pasan. Tests locales: `npx jest` → 638/638.
- Producción: **no se publicó nada** y no se debe publicar sin OK explícito del dueño y una exhibición local previa. Flujo: Git Flow + GitHub Actions; nunca tocar el servidor ni el `.env` de producción.
- Tres PNG sin trackear en `docs/cine/` (`escenario-aeropuertos.png`, `escenario-antecedente-3069.png`, `infografia-salud.png`): capturas viejas, no las borres sin avisar.

### Lo pedido por el dueño (en sus palabras, resumido)
Sitio corporativo de Última Milla (Mendoza, Argentina; IT: redes, seguridad, telecom, software, soporte, consultoría, incendios, energía) de **nivel mundial**: estética Apple/años 90, papel blanco, isométrico, tipografía mínima, animaciones que se integran con la página sin distinguir "fondo" de "animación". Todo vinculado: sector ↔ servicio ↔ antecedente. Reglas de proceso: **no comprar nada**, ser prudente con tokens, no pedir permiso a cada paso, mostrar sólo lo que pasó autocrítica, **todos los sectores al mismo nivel** (nunca "Salud primero").

## 2. Qué se construyó (la pieza actual)

Cada página de sector (`/salud`, `/aeropuertos`, `/industria`, `/bodegas`, `/constructoras`, `/mineria`) tiene, debajo de la película Blender oscura, una **composición única en código** (three.js) sobre el papel:

1. Desde el primer cuadro se ve el edificio con **todas sus capas** (una por servicio) encendidas, más un **riel de tres paneles** (cámara IP en vivo, tablero, eventos).
2. A la izquierda, un **menú de servicios**. Al pasar el mouse / tocar un servicio, su capa se separa y hace **su propio gesto**; sin interacción, recorre los servicios sola (ciclo 6,5 s) tras 4 s de reposo.
3. Debajo del menú, el **detalle** del servicio activo: titular de valor, línea, equipos con cantidades, norma y entrega reales, último antecedente y link a la página del servicio.
4. En celular: título, composición cuadrada, riel como franja (cámara + eventos), menú como pestañas horizontales y detalle debajo.

### Un lenguaje visual por servicio (esto vino de la crítica "las capas sólo cambian de color")
| Servicio | Gesto en el modelo |
|---|---|
| 108 Energía | Corte de luz: se apaga el edificio y sólo las zonas críticas (`critical`) quedan encendidas por la UPS |
| 101 Redes | Mapa de calor de cobertura Wi-Fi en el piso, cables como tubos que crecen, puntos que se "certifican" con tilde |
| 103 Telecom | Ondas de voz de sala en sala; en cada sector un "momento" real (central IP, voceo, radio troncalizado) |
| 102 Seguridad | Conos de visión en volumen que barren + el monitor muestra la vista real de una cámara del modelo |
| 107 Incendios | Humo → detector → alarma por el lazo → sirenas → ruta de salida |
| 104 Software | Tablero que cuenta los equipos reales del modelo |
| 105 Soporte | Incidente: sube a la mesa de ayuda y vuelve resuelto |
| 106 Consultoría | Barrido sobre el plano que marca cada equipo relevado (sólo donde aplica) |

### Rigor de datos (decisión consciente, mantenerla)
- Qué servicios muestra cada sector sale **sólo** de `sectorSlugs` en `src/data/serviceSpecs.ts` (Software no va en Aeropuertos ni Minería; Consultoría sólo donde figura). Constructoras: 4 capas. Salud e Industria: los 8.
- Cada equipo dibujado es equipamiento que la ficha del servicio lista. Normas y entregables salen de `keyStandard` / `keyDeliverable`.
- **Nada de cifras operativas inventadas** (se sacaron "14,2 °C", "212 pasajeros", etc.). Los números visibles los cuenta el propio modelo.
- Antecedentes (`src/data/cine/sectorCases.ts`): se asignan a un servicio **sólo por el título del caso** (`caseService` en `stageMap.ts`); la etiqueta de área del archivo se ignora porque contamina textos (un servidor de Nucete aparecía como "aeropuertos"). **Minería no tiene antecedentes legítimos** (el único era un enlace de una empresa olivícola), por eso su sección de casos no se muestra.

## 3. Mapa de archivos

| Archivo | Rol |
|---|---|
| `src/scripts/senal/sectorSpecs.js` | **Datos** de los 6 sectores: plano (`floor`, `walls`, `glass`, `pieces`), `layers` (por servicio: `svc`, `line`, `parts`, `items`), `moment` (señal roja), `support`, `critical`, `fire`, `feed` (qué cámara muestra el monitor), `verbs` (titulares a medida), `captions`. Sin three.js. Comentario de rigor al inicio. |
| `src/scripts/senal/sector.js` | **Motor** (`mountSector(host, spec)`, ~780 líneas): modelos 3D de piezas (`BUILD`), láminas dibujadas en canvas (`drawPlan`/`drawLayer`), shader de revelado, efectos por servicio (`FX.*`, `runFx`), cámara, inset de la cámara IP (`renderInset`), modo `compo` (composición) vs. modo película autónoma (`?t=`) |
| `src/components/cine/SectorCode.astro` | Componente de página: menú, detalle, riel, estilos, script de interacción. Lee specs, `SERVICE_SPECS`, `NAV_SERVICES`, `sectorCases` |
| `src/data/cine/sectorCases.ts` | Casos reales por sector, con filtros de exclusión y servicio por título |
| `src/data/cine/stageMap.ts` | `CASE_RULES` (regex título→servicio). **Se retocaron**: también afectan páginas de servicio y de antecedentes |
| `src/components/templates/SectorTemplateUM26.astro` | Monta `SectorFilm` + `SectorCode` + `SectorAfter` para los 6 sectores |
| `src/components/cine/SectorAfter.astro` | Lista de antecedentes + cierre (usa `sectorCases`) |
| `src/pages/lab/sectores-codigo.astro` | Página de revisión (`?s=salud|…|all`), sin link desde el sitio |
| `docs/cine/*.png`, `*.mp4` | Capturas y videos de revisión (`salud-composicion.mp4`, `sectores-composicion.png`, etc.) |

### Parámetros de revisión por URL (sirven para capturar sin mouse)
`?skipfilm` oculta la película Blender · `?item=idle|audit|layer-0..N|support` fija el servicio activo · `?q=0..1` fija el progreso del gesto · `?t=<seg>` congela la película autónoma (modo exportable a video) · `?rec` + `window.__scode` (ganchos de grabación) · `?at=` arranca el reloj del capítulo.

## 4. Cómo correr y verificar

```bash
cd /Users/santosma/Documents/Codex/um25-cine-integracion
env -u UM_SOFTWARE_REVIEW -u UM_SECTOR_REVIEW NODE_OPTIONS=--max-old-space-size=1024 npm run build
HOST=127.0.0.1 PORT=4326 node dist/server/entry.mjs          # servidor local (SSR, no `astro dev`)
npx jest                                                      # 638 tests
```
- Páginas: `http://127.0.0.1:4326/salud?skipfilm` (idem los otros cinco).
- El servidor imprime `fetch failed ... Directus` al arrancar: es ruido esperado (CMS no disponible en local), no un error.
- Capturas headless: **usar el chrome-headless-shell de Playwright** (`~/Library/Caches/ms-playwright/chromium_headless_shell-1217/.../chrome-headless-shell`) con `--enable-unsafe-swiftshader --use-angle=swiftshader`. **NUNCA** lanzar `/Applications/Google Chrome.app` desde scripts (regla global del dueño: llena el disco con clones). Cerrar siempre el navegador y borrar el `--user-data-dir`.
- Cada cuadro 3D por software tarda ~1-2 s: para videos se graba cuadro a cuadro y se codifica a 6-8 fps (ver `?rec`). Los videos NO muestran las transiciones suaves del navegador real.

### Trampas que ya costaron tiempo
- Un `ReferenceError` en el frontmatter de un `.astro` no da 500 limpio: el stream queda **cortado** y el navegador headless se cuelga sin captura. Si una captura da `TIMEOUT`, mirar primero el log del servidor y `curl | tail`.
- Selectores `:global([data-active=…])` dentro de `:not()` no compilan bien en Astro; usar `:not([data-active="…"])`.
- `.astro` con estilos globales del sitio pisa tamaños: se usa `.scode.scode …` y `!important` en tipografías del riel/tablero.
- Disco: la Mac del dueño llegó a 100 % lleno (capturas fallan con `ENOSPC`). Ver §6.

## 5. Película Blender (v6) — estado y pendiente

- Hay un render **v6** (PBR, OIDN, 6 sectores × 2 composiciones × 9 tramos = 108 partes de 60 cuadros). **Las 108 partes están descargadas** en `/Volumes/SDTERA/Codex UM25 audits/20261016/sectors-v6/parts` (la de clínica móvil `-840` se repitió y se bajó).
- **Falta** (no se hizo): ensamblar y decidir si se integra.
  ```bash
  python3 scripts/cine/assemble-sector-v6.py "/Volumes/SDTERA/Codex UM25 audits/20261016/sectors-v6/parts" \
    --output <carpeta de entrega> --scrub public/cine/scrub
  ```
  Después: `SectorFilm.astro` hoy pide `${film}-1920.mp4` y el póster `cine-${scene}-proyecto-v5-poster`; hay que cambiarlo a `-1600.mp4` / `-sq-720.mp4` y a los pósters v6, **revisar cada película entera** (no por cuadros sueltos) e integrarla. El dueño pidió explícitamente que los renders Blender queden **arriba** (banner) y la isometría/código **abajo**.
- Reglas de GitHub Actions: repo público (minutos gratis); el límite es el **almacenamiento de artefactos (0,5 GB)**. Bajar y borrar artefactos enseguida, retención de 1 día. Workflows: `.github/workflows/cine-project-render.yml` (`renderer=v6`), `cine-sector-v6.yml`, `cine-sector-v6-proof.yml`. Reparar un tramo: `gh workflow run cine-project-render.yml --ref feature/isometric-redes-review -f mode=full -f projects=<clinic|…> -f renderer=v6 -f repair_run=<nombre del tramo>`.
- **No renderizar Blender en la Mac.**

## 6. Restricciones y avisos del dueño (vigentes)
- No comprar nada, ni recursos ni suscripciones. No publicar a producción sin su OK y exhibición local.
- No escribir en `node_modules` de otros proyectos (aquí hay un `npm ci` propio; el symlink compartido se renombró `node_modules.shared-link`).
- No matar procesos `chrome-headless-shell` de HyperFrames ni de otras sesiones.
- Disco interno de la Mac casi lleno (26 GB libres hoy, llegó a 1,5 GB). Hay `/private/tmp/claude-501/-Users-santosma-Downloads-psicole/ba5ae847-…` con ~4 GB de **otra sesión**: no tocarlo sin preguntar. El disco externo `/Volumes/SDTERA` también está al ~99 %.
- Toda salida visual con la marca: negro / blanco / gris, rojo `#DC2626`, papel `#fcfcf9`, pizarra `#14232f`, fuentes UM Sans (`/fonts/um-sans/`). Skill disponible: `ultima-milla`.
- Idioma: castellano rioplatense, claro, sin jerga ni relleno.

## 7. Qué dijo el dueño sobre el resultado (criterio de calidad)
Rechazó, en orden: integraciones "pastiche", capas planas de distinto color, relato "de menos a más" con un "menos" pobre, paneles sueltos flotando sobre el modelo. Aprobó la dirección actual (composición única + riel + menú) con la frase "Sí, así va". Aún **no** vio el recorrido en movimiento real ni en un celular real. Criterio de oro: *tiene que verse desde el primer momento que esto es lo que hacemos*; cada capa con valor propio, no sólo otro color.

## 8. Próximos pasos sugeridos (en orden)
1. Revisar el CI `Lint & Format` del PR y corregirlo (correr `npm run lint`; `prettier --check` marca `sector.js`, `sectorSpecs.js`, `sectorCases.ts`, pero verificar si el repo usa Prettier realmente antes de reformatear).
2. Recorrer **en un navegador real** las seis páginas con mouse y scroll (desktop 1440 y móvil 390): ritmo del ciclo automático, transiciones, el inset de cámara, el reposo.
3. Pulir lo que falle por sector (no se revisó con la misma profundidad Aeropuertos, Industria, Bodegas, Constructoras y Minería que Salud; las capturas fijas se ven bien, el movimiento no se comprobó).
4. Probar en un celular real (hoy sólo hay emulación por capturas).
5. Ensamblar el render v6 (§5), integrarlo en `SectorFilm` y revisar las películas completas.
6. Opcional que el dueño ya vio con buenos ojos: la propuesta de portada (`src/pages/lab/propuesta.astro`) con `CineBanner` de producción → `SectorRail` → composición → servicios → casos. Adoptarla como home **sólo con su aprobación**.
7. Idea propuesta, no pedida: llevar el mismo despiece a las ocho páginas de servicio.
8. Recién entonces, con OK del dueño: pasar PR #266 de draft a listo → `develop` → release a `master` por Git Flow.

## 9. Pendiente de otra sesión (no es de este proyecto)
El hook de arranque marca un agente abierto del proyecto PSICOLE ("Correos de cursos: env + receta", agente `a058304f200277391`, sesión `7538a3a1`, 21/10 12:20 UTC). **No pertenece a UM25 y no se verificó desde esta sesión**; retomarlo desde el libro `project-agentes-en-curso.md` si corresponde.
