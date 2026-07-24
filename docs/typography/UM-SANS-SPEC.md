# UM Sans 1.2 Production

Estado: familia editorial completa, reproducible y empaquetada para distribución.

Portfolio local: `http://localhost:4322/estilo/um-sans`
Índice de gobierno: `docs/typography/README.md`

## Propósito

UM Sans es la voz editorial de ULTIMA MILLA para web, interfaz, presupuestos,
informes y PDF. Combina una construcción geométrica directa con la legibilidad
necesaria para información técnica extensa. No reemplaza el logotipo:
`ultimamilla.com.ar` conserva Futura PT.

## Origen, licencia y reproducibilidad

UM Sans deriva de Inter 4.001 bajo SIL Open Font License 1.1. No contiene
contornos de Futura PT ni Helvetica. La fuente upstream se descarga desde un
commit fijo de Google Fonts, se verifica por SHA-256 y se guarda únicamente en
`.font-sources/`, excluido de Git.

- Licencia: `public/fonts/um-sans/OFL-1.1.txt`
- Fetch reproducible: `scripts/fonts/fetch_um_sans_sources.py`
- Generador: `scripts/fonts/build_um_sans.py`
- Auditor: `scripts/fonts/audit_um_sans.py`
- Reportes: `build-report.json` y `qa-report.json`

```bash
npm run fonts:build:um-sans
npm run fonts:audit:um-sans
```

Los timestamps OpenType y ZIP son fijos. El archivo de distribución es
`public/fonts/um-sans/UMSans-1.2-Production.zip`.

## Familia

La familia contiene nueve pesos en romano y cursiva genuina: 18 estilos
estáticos, más dos fuentes variables.

| Peso | CSS | Uso editorial rector |
|---|---:|---|
| Thin | 100 | Display de gran escala y baja densidad |
| ExtraLight | 200 | Aperturas editoriales amplias |
| Light | 300 | Destacados y citas extensas |
| Regular | 400 | Lectura, tablas y documentación |
| Medium | 500 | Interfaz, metadata y navegación |
| SemiBold | 600 | Titulares editoriales y jerarquía principal |
| Bold | 700 | Heroes, acciones y cifras destacadas |
| ExtraBold | 800 | Campaña y display breve controlado |
| Black | 900 | Póster y palabra de impacto, nunca cuerpo |

Cada peso se entrega en TTF, OTF y WOFF2. Las variables se entregan en TTF y
WOFF2. Los 800/900 forman parte de la familia completa, pero el sitio público
mantiene títulos en 600 y énfasis máximo en 700 salvo una aprobación editorial
específica.

## Ejes variables y ópticos

| Eje | Rango | Default | Función |
|---|---:|---:|---|
| `wght` | 100–900 | 400 | Masa tipográfica continua |
| `opsz` | 14–32 | 14 | Ajuste de proporción y detalle por escala |

La curva `avar` conserva un 400 calmo y acelera la masa en el tramo superior.
Los cortes estáticos se fijan en `opsz 14` para 100–500, `18` para 600, `24`
para 700 y `32` para 800–900. En web se usa `font-optical-sizing: auto`.

## Construcción

| Métrica | Valor / comportamiento |
|---|---|
| Unidades por em | 2048 |
| Altura x | 1056–1118 según tamaño óptico |
| Altura de mayúsculas | 1490 |
| Ascendente / descendente | 1984 / -494 |
| Caracteres | 1130 por corte |
| Glifos | 1823 romano / 1785 cursiva |
| Inclinación cursiva | -9° |
| Line gap interno | 0 |
| Embedding | Instalable (`fsType 0`) |

Decisiones distintivas:

- `l` usa el alternativo con pie y conserva un descenso óptico de terminal en
  todos los pesos, tamaños ópticos y cursivas para no confundirse con `I` o `1`.
- `p` y las minúsculas redondas ganan apertura y presencia sin invadir el avance.
- las cifras reciben mayor anchura óptica; `tnum` conserva avance uniforme;
- una guarda física por peso evita márgenes accidentales después del hinting;
- la cursiva es un dibujo real, no una oblicua sintetizada.

## OpenType editorial

La familia conserva, entre otras, estas funciones:

`aalt`, `calt`, `case`, `dlig`, `frac`, `locl`, `ordn`, `pnum`, `salt`,
`sinf`, `ss01–ss08`, `subs`, `sups`, `tnum` y `zero`.

GPOS incluye kerning y espaciado de mayúsculas. El pipeline añade 8.882 pares
para combinaciones de español, vocales acentuadas, signos de apertura,
puntuación, guiones y alternativos. HarfBuzz verifica cada uno de los 18 cortes.

## Uso web

La integración productiva usa las dos variables WOFF2:

```css
@font-face {
  font-family: "UM Sans";
  src: url("/fonts/um-sans/UMSans-Variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

html {
  font-family: "UM Sans", Arial, system-ui, sans-serif;
  font-optical-sizing: auto;
  font-synthesis: none;
}
```

La romana variable es el único preload tipográfico. La cursiva se descarga bajo
demanda. Futura PT queda fuera de este bloque y sigue reservada al wordmark.

## Escala editorial recomendada

- Hero: 600–700, 42–58 px desktop, 34–42 px mobile, interlínea 0,98–1,06.
- H2: 600, 28–40 px, interlínea 1,08–1,14.
- H3: 600, 19–24 px, interlínea 1,14–1,22.
- Lead: 400, 18–21 px, interlínea 1,5–1,65.
- Cuerpo web: 400, mínimo 16 px, interlínea 1,58–1,72.
- Interfaz: 500, mínimo 16 px.
- Cita: Italic 400, 18–24 px, interlínea 1,45–1,6.
- Tablas: Regular 400 para datos; Medium 500 para cabeceras.

No justificar párrafos. Mantener 55–78 caracteres por línea. No usar tracking
negativo. Las mayúsculas técnicas pueden usar entre `0` y `0.08em`.

## Pruebas obligatorias

```text
ÁÉÍÓÚÜÑ áéíóúüñ ¿Qué operación necesita continuidad?
Mendoza · Cuyo · Patagonia — Fibra óptica 24/7
CUIT 30-71008591-5 · $ 1.234.567,89 · SLA 99,9%
La precisión también se lee. · l I 1 · p q g y
```

La compuerta local abre 58 archivos y verifica nombres, estilos, cobertura,
ejes, nueve instancias, interpolación en esquinas, itálicas, márgenes, hinting,
OpenType, shaping, cifras tabulares, rasterización a 11/16/56 px e identidad de
instalación desktop.

La exportación web a PDF se reproduce con `npm run fonts:audit:um-sans:pdf`.
Chrome imprime el portfolio completo y Poppler comprueba que
`UMSans-Variable` y `UMSans-VariableItalic` estén embebidas, que no aparezcan
fallbacks editoriales y que el documento conserve todas sus páginas.

FontBakery valida los veinte TTF distribuibles con `1533 PASS`, cero `ERROR`,
cero `FATAL` y cero `FAIL`. Las advertencias restantes corresponden a contornos
e interpolación heredados del upstream y están conservadas en el reporte, no
silenciadas.

## Estado de publicación

`1.2 Production` supera el gate estructural, de shaping, raster, instalación,
paquete y FontBakery, y está integrada en localhost. “Production” significa que
el release digital es coherente y reproducible; no significa certificación de
terceros. Para declarar compatibilidad física certificada aún se requieren:

1. Windows DirectWrite/ClearType;
2. Microsoft Office con embedding y exportación PDF;
3. Adobe Illustrator/InDesign y PDF de preprensa;
4. Android e iOS en dispositivos reales;
5. impresión láser y offset de una prueba editorial corta.

Una impresión subjetiva aislada no habilita modificar contornos. Toda revisión
debe reproducirse en el portfolio, registrar el par o glifo afectado y volver a
ejecutar la compuerta completa.

## Originalidad y propiedad

UM Sans 1.2 no se comercializa como dibujo propietario creado desde cero. Es
una modificación OFL de Inter 4.001. ULTIMA MILLA aporta sus transformaciones,
alternativos por defecto, perfil óptico, espaciado, kerning, metadata, tooling,
documentación y marca `UM Sans`; los contornos upstream conservan la licencia
OFL. Esta frontera está detallada en `release/ORIGINALITY-ROADMAP.md`.
