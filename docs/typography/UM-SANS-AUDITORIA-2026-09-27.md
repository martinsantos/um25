# UM Sans · auditoría técnica y visual · 27-09-2026

Alcance: la fuente que hoy usa el sitio y que el SGI toma desde `/fonts/um-sans/`
(UM Sans 1.2 Production) y los prototipos `um-sans-2`, `um-sans-2-display` y
`um-sans-2-manual-alpha`. Herramientas: fontTools 4.58, FontBakery 1.1.0
(perfil `universal`), Chrome del sistema vía Playwright a 1x y 2x.

## 1. Decisión

| Versión | Estado | Uso |
|---|---|---|
| **UM Sans 1.2 Production** (`public/fonts/um-sans/`) | Apta, sin errores de FontBakery | **Única fuente oficial**, sitio y SGI |
| UM Sans 2 (`um-sans-2/`) | Falla visual | No usar |
| UM Sans 2 Display (`um-sans-2-display/`) | Bloqueada (`BLOCKED.md`) | No usar |
| UM Sans 2 Manual Alpha 7 | 22 glifos; cae a otra fuente | No usar |

Nombre de release honesto: **UM Sans 1.2** (binarios) y **UM Sans 1.2.1** si se
publica el ajuste de fallback de la sección 5, que sólo toca CSS.
"UM Sans 2.0" es el nombre con que la dirección conoce a la familia, pero los
binarios 2.x son otro diseño y no pasaron la prueba visual. Recomendación:
en la comunicación usar "UM Sans", sin número, y reservar "2.0" para
un redibujo real que pase la puerta visual.

## 2. Auditoría técnica de UM Sans 1.2

Los binarios de producción son idénticos a los del alfa. SHA-256 de
`UMSans-Variable.woff2`: `2a133926…ccd5b4`, igual en www.ultimamilla.com.ar.
Los CSS publicados coinciden con los del ZIP de release. La única diferencia
es la ruta relativa: `./` en lugar de `./WOFF2/`.

| Punto | Resultado |
|---|---|
| Origen / licencia | Derivada de Inter 4.001. SIL OFL 1.1 (name 13/14). `fsType` 0: instalable y embebible |
| Nombres | name1 "UM Sans Variable", name16 "UM Sans", name5 "Version 1.200", PS `UMSans-Variable` |
| Ejes | `opsz` 14–32 (default 14), `wght` 100–900 (default 400); STAT con `opsz`, `wght`, `ital`; `avar` presente |
| Instancias | 9 con nombre, de Thin a Black, y sus 9 itálicas |
| Glifos | 1899 glifos y 1204 caracteres (variable completo) |
| Español | Completo: á é í ó ú ü ñ Ñ Á É Í Ó Ú Ü ¿ ¡ « » — – “ ” ‘ ’ … € $ ° º ª № × · |
| Métricas verticales | UPM 2048. hhea 1984/−494/0 = typo 1984/−494/0; win 2314/660; `USE_TYPO_METRICS` activado. Coherentes |
| Alturas | x-height 1118 (0,546 em); mayúscula 1490 (0,728 em) |
| GSUB | `calt case tnum pnum zero frac sups subs numr dnom ordn locl dlig salt aalt ss01–ss08 cv01–cv14` |
| GPOS | `kern`, `cpsp` |
| Sets estilísticos | ss01 dígitos abiertos · ss02 desambiguación · ss03 comillas redondas · ss04 desambiguación sin cero barrado · ss05/06 caracteres en círculo/cuadrado · ss07/08 puntuación cuadrada |
| Hinting | Estáticos TTF con hinting. Variable sin `fpgm` (igual que Inter); `gasp` 8/10 y 65535/15 |
| FontBakery `universal` (variable + itálica) | **0 FAIL, 0 ERROR**. 4 WARN, 197 PASS. `interpolation_issues`: quiebres menores en `y.sups` y `lambdabar`, glifos que el sitio no usa. `overlapping_path_segments`: habitual en variables |
| FontBakery `googlefonts` | No corrió: incompatibilidad de `glyphsets` con FB 1.1.0 y disco lleno en el equipo. Queda el informe existente `fontbakery-report.md` |

Detalles menores:

- La itálica no trae `cv11` y el subset latin-core no trae `cv14`. Ninguno afecta al español.
- La tabla `name` del variable dice "UM Sans Variable" en name1. Con el
  nombre tipográfico 16 = "UM Sans" las apps de escritorio agrupan bien.

### Peso de archivos (woff2)

| Archivo | Tamaño |
|---|---|
| `UMSans-Variable.woff2` | 224,5 KB |
| `UMSans-VariableItalic.woff2` | 245,9 KB |
| `subset/UMSans-Variable-LatinCore.woff2` | 109,3 KB |
| `subset/UMSans-VariableItalic-LatinCore.woff2` | 120,4 KB |
| Estáticos (c/u) | 110–129 KB |

### Subset latin-core

Está bien armado. Los 323 caracteres del variable que caen dentro del
`unicode-range` declarado están todos en el subset, y el subset no tiene nada
fuera del rango. Conserva `kern`, `tnum`, `case` y los ss/cv. Contiene todo
el español salvo `№` (U+2116), que queda fuera del rango y cae al siguiente
face. `um-sans-latin-core.css` sólo declara el subset, así que un `№` con esa
hoja sale en Arial.

## 3. Prueba visual

Specimen con texto real del home a 13, 14, 16, 19, 24, 36, 48, 64 y 96 px,
pesos 400/500/600/700, fondo `#0a0a0b` y blanco. Incluye kicker en mayúsculas
13 px con tracking .12em (con y sin `case`), cifras `pnum` y `tnum` y signos
del español. Capturas a 1x y 2x (en la carpeta de trabajo de la auditoría,
fuera del repo).

**UM Sans 1.2**: espaciado parejo en todos los pesos. A 13–14 px el 400 y el
500 se leen limpios sobre negro a 1x. El 700 a 13 px empasta un poco sobre
negro; para meta y kicker conviene 500–600. El eje `opsz` trabaja solo:
Chrome aplica opsz = tamaño en px, 14 para texto y 32 desde 32 px. En display
el dibujo se afina y el espaciado se cierra. Por eso los títulos grandes no
necesitan tracking negativo fuerte: −.02/−.03em alcanza. `tnum` iguala el
ancho de las cifras: "518 · 22+ · 24/7 · 109 casos" se ensancha a 48 px/600 y
las columnas alineadas a la derecha quedan parejas. `case` sube paréntesis y barras a
altura de mayúscula en los kickers.

**UM Sans 2 / 2 Display**: no aptas. A todos los tamaños:

- el espaciado es irregular (hay huecos grandes después de punto, coma y `·`);
- la `r` y la `g` están deformadas y los acentos quedan mal ubicados (la `ñ`, la `á`);
- `¿` sale como un gancho y `« »` como comillas altas;
- `º`/`ª` están mal dibujadas y a `—` le falta ancho;
- `tnum` no hace nada: no tienen el rasgo, sólo `liga` y `zero`.

La versión 2 cubre 320 caracteres, con UPM 1000, sin STAT y sin
`USE_TYPO_METRICS`. En name13 dice "Internal evaluation beta… pending legal
review".

**Manual Alpha 7**: 24 glifos. Le falta todo el español acentuado y los signos,
así que el navegador compone con otra fuente dentro de la misma palabra.
Además `fsType` 4 (restringida).

## 4. Hallazgos en el uso actual

1. **Fallback mal calibrado.** v4.css declaraba `size-adjust: 112.33%` y
   `descent-override: 22.38%`, distinto de los CSS publicados (21,47 %).
   Medido en Chrome con el párrafo del home, Arial a 112,33 % queda entre 6 %
   y 11 % más ancho que UM Sans. El valor que mejor empata es **105 %**
   (error de −1,7 % a +3,7 % entre 13 y 24 px). **Corregido en v4.css.**
2. **`font-size-adjust: 0.546` en `html`** (token `--um-font-x-height`). Con
   `opsz` alto la x-height de UM Sans baja, y Chrome agranda el texto para
   compensar. Medido en el home: los H2 de 34 px se renderizan **6,2 % más
   anchos** (420 vs 395 px) y los H3 de 28,8 px, 4,7 %. El H1 del hero no
   hereda la propiedad (un `font:` la reinicia), así que la escala tipográfica
   queda desigual entre bloques. **No se cambió**, porque achicaría todos los
   títulos del sitio. Recomendación: `--um-font-x-height: none;` junto con el
   fallback nuevo, que ya cubre el ajuste durante la carga. Después hay que
   revisar los cortes de línea de H2/H3.
3. **Itálica descargada sin necesidad.** El home carga
   `UMSans-VariableItalic.woff2` (246 KB) por dos `<i>01</i>` usados como
   numeración. Solución: usar `<span>` o `i { font-style: normal }` en ese
   componente.
4. **Producción: CORS y caché** (www.ultimamilla.com.ar, vía Cloudflare, 27-09):
   - `/fonts/um-sans/*.woff2` y `*.css` responden **sin
     `Access-Control-Allow-Origin`**. Un `@font-face` servido a
     `sgi.ultimamilla.com.ar` desde otro origen queda bloqueado por el
     navegador. Si el SGI hoy ve UM Sans es porque tiene copia propia o
     porque el navegador lo resuelve por otro camino; conviene verificarlo en
     el SGI.
   - Los encabezados de caché se contradicen: `cache-control: public, max-age=0`
     y además `no-cache, no-store, must-revalidate`, con `cf-cache-status: BYPASS`.
     Cada página vuelve a bajar 225 KB.

## 5. Cambios aplicados

- `src/styles/v4.css` (sólo el bloque inicial de @font-face y tokens):
  - Se corrigió `@font-face 'UM Sans Fallback'`: `local('Arial'), local('ArialMT'),
    local('Liberation Sans')`, `size-adjust: 105%`, `ascent-override: 92.26%`,
    `descent-override: 22.97%`, `line-gap-override: 0%`.
  - Nuevos tokens: `--um-figures-tabular`, `--um-figures-proportional`,
    `--um-features-caps`. Son aditivos: no cambian nada hasta que un
    componente los use.
- Los binarios y CSS de `public/fonts/um-sans/` no se modificaron. Están
  sellados en `CHECKSUMS.sha256` y en el ZIP de release. La versión 1.2.1 de
  los CSS, con el fallback corregido, quedó preparada fuera del repo para
  publicarla como release versionada.

Verificado después del cambio (home a 1440 y 390): las dos caras de UM Sans
cargan, el fallback reporta `sizeAdjust 105%`, no hay errores de consola ni
overflow horizontal, y ningún texto queda por debajo de 13 px.

## 6. Guía de uso

### Sitio (Astro)

- Familia: `var(--um-font-editorial)`. La fuente se carga en v4.css y se
  precarga en LayoutV4.
- Pesos: 400 cuerpo · 500 meta y UI · 600 títulos y kickers · 700 sólo
  énfasis puntual. Evitar 700 por debajo de 14 px sobre fondo oscuro.
- `font-optical-sizing: auto` (ya activo). No fijar `font-variation-settings: 'opsz'` a mano.
- KPIs, tablas, contadores, horarios: `font-variant-numeric: var(--um-figures-tabular);`
- Kickers en mayúsculas: `text-transform: uppercase; letter-spacing: .12em;
  font-feature-settings: var(--um-features-caps);`
- Títulos: tracking −.02 a −.03em. El eje opsz ya cierra el espaciado en display.
- Evitar `<i>`/`<em>` decorativos: cada uno dispara la descarga de la itálica (246 KB).

### SGI (sgi.ultimamilla.com.ar)

Opción A, recomendada: **copia local** de `UMSans-Variable.woff2` y
`UMSans-VariableItalic.woff2` 1.2 en el propio SGI, con el mismo SHA-256.
No depende de CORS ni de la caché de www.

Opción B, **consumo remoto**, cuando producción tenga CORS:

```html
<link rel="preconnect" href="https://www.ultimamilla.com.ar" crossorigin>
<link rel="stylesheet" href="https://www.ultimamilla.com.ar/fonts/um-sans/um-sans.css">
```

`um-sans.css` y `um-sans-variable.css` son idénticos (variable, 100–900).
`um-sans-latin-core.css` usa el subset de 109 KB: basta para una interfaz en
español, pero `№` cae al fallback. `um-sans-static.css` declara 18 archivos
estáticos para entornos sin soporte de variables.

Para el SGI (tablas y formularios densos):

```css
body { font-family: 'UM Sans', 'UM Sans Fallback', Arial, sans-serif; font-weight: 400; }
table, .num, input[type=number] { font-variant-numeric: tabular-nums lining-nums; }
.badge, th { font-weight: 500; }
/* ss02 desambigua I/l/1 y O/0 en códigos, CUIT, números de serie */
.codigo { font-feature-settings: "ss02" 1, "tnum" 1; }
```

Fallback recomendado (igual al del sitio desde hoy):

```css
@font-face {
  font-family: 'UM Sans Fallback';
  src: local('Arial'), local('ArialMT'), local('Liberation Sans');
  size-adjust: 105%; ascent-override: 92.26%; descent-override: 22.97%; line-gap-override: 0%;
}
```

## 7. Pendientes

1. **Infra (nginx/Cloudflare, vía CI):** en `/fonts/um-sans/` agregar
   `Access-Control-Allow-Origin` (`https://sgi.ultimamilla.com.ar` o `*`; la OFL
   lo permite). Reemplazar los encabezados de caché por
   `Cache-Control: public, max-age=31536000, immutable`: las URLs llevan `?v=`.
2. **Tokens:** decidir `--um-font-x-height: none` (punto 4.2) y revisar H2/H3.
3. **Componente con `<i>01</i>` en el home:** evitar la descarga de la itálica.
4. **Peso inicial (opcional):** pasar el sitio al subset latin-core, que ahorra
   115 KB, con el variable completo como respaldo por `unicode-range`. Requiere
   cambiar a la vez `@font-face` en v4.css y el `<link rel="preload">` de
   LayoutV4. Hoy el preload apunta a
   `/fonts/um-sans/UMSans-Variable.woff2?v=1.2.0-production`; si se cambia uno
   solo, la fuente se descarga dos veces. El snippet ya está preparado.
5. **Release 1.2.1 (sólo CSS):** publicar los CSS con el fallback corregido.
   Hay que regenerar `CHECKSUMS.sha256`, el ZIP y `release-manifest.json`, y
   avisar al equipo del SGI. Las URLs no cambian.
6. **FontBakery `googlefonts`:** volver a correrlo con un `glyphsets` compatible
   cuando haya espacio en disco.
7. **Windows 1x:** el variable no tiene hinting (como Inter). Conviene revisar
   en Windows/ClearType. Si el cuerpo de 13–14 px se ve débil, el SGI puede
   usar los estáticos, que sí tienen hinting (`um-sans-static.css`).
8. **UM Sans 2.x:** los prototipos siguen fuera del sistema. Para volver a
   considerarlos hace falta un redibujo completo, pasar la puerta visual y una
   revisión legal y de similitud.
