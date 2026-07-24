---
name: ultima-milla
description: "Sistema de identidad visual completo de ULTIMA MILLA S.A. Usar para CUALQUIER salida visual de la empresa: documentos Word/DOCX, PDFs, dashboards HTML, componentes React, gráficos, presentaciones PPTX, planillas Excel. Activar cuando Martín pida: 'nota UMSA', 'formato ULTIMA MILLA', 'en nuestro estilo', 'dashboard UMSA', 'gráfico de datos', 'presentación', 'reporte', 'tabla de análisis', o cualquier contenido corporativo visual. SIEMPRE leer este SKILL antes de generar cualquier output visual de la empresa."
---

# ULTIMA MILLA S.A. — Sistema de Identidad Visual para Documentos
## Basado en Manual de Marca v1.0 — Enero 2026

> **Actualizacion tipografica julio 2026:** para web y nuevas piezas editoriales,
> usar UM Sans 1.2 Production (`public/fonts/um-sans`) en pesos publicos 400-700. Futura PT se reserva
> para el wordmark. Las recetas historicas con Poppins/Arial siguen documentadas
> solo para reproducir archivos antiguos y no deben iniciar trabajos nuevos.

---

## 1. Identidad de empresa

| Campo | Valor |
|-------|-------|
| Razón social | ULTIMA MILLA S.A. |
| Nombre comercial | UMSA |
| CUIT | 30-71008591-5 |
| Web | ultimamilla.com.ar |
| Ciudad | Mendoza, Argentina |
| Sector | Tecnología e Infraestructura Digital |
| Signatario | Martín Santos — Presidente |
| Firma PNG | `/sessions/nice-trusting-bardeen/notas_docx/firma_transparente.png` |
| Generador base DOCX | `/sessions/nice-trusting-bardeen/notas_docx/generar_nota_adicional_v5.js` |
| Carpeta designs | `/sessions/nice-trusting-bardeen/mnt/psicole/skills/ultima-milla/designs/` |

---

## 2. Paleta de colores oficial

> **FUENTE**: Manual de Marca UMSA v1.0, sección 4. Paleta de Colores.

### Colores primarios

| Nombre | HEX | RGB | Uso |
|--------|-----|-----|-----|
| Negro | `#000000` | 0, 0, 0 | Texto principal, logo base |
| **Rojo UMSA** | `#DC2626` | 220, 38, 38 | **Puntos del logo, acentos, separadores** |
| Blanco | `#FFFFFF` | 255, 255, 255 | Fondos, texto invertido |

### Colores secundarios

| Nombre | HEX | RGB | Uso |
|--------|-----|-----|-----|
| Gris oscuro | `#333333` | 51, 51, 51 | Texto secundario, body text |
| Gris medio | `#666666` | 102, 102, 102 | Subtítulos, labels, metadata |
| Gris claro | `#F5F5F5` | 245, 245, 245 | Fondos de cards, filas alternas |

### Color de acento documental (no en Manual, aplicación interna)

| Nombre | HEX | Uso |
|--------|-----|-----|
| Azul sección | `#1A56C0` | Badge numérico de sección, énfasis tablas |

### ⚠️ Errores comunes a evitar

- ❌ `#CC0000` — NO es el rojo UMSA (demasiado oscuro)
- ❌ `#0D1B2A` — NO es un color de marca UMSA
- ❌ `#1a3a6b` — NO pertenece a la paleta
- ✅ El rojo correcto es siempre `#DC2626`

---

## 3. Tipografía oficial

> **FUENTE**: Manual de Marca UMSA v1.0, sección 5. Tipografía Corporativa.

### Tipografía de marca: Futura PT

Futura PT queda reservada para el logotipo y reproducciones históricas de marca.
Los títulos corporativos y el cuerpo de piezas nuevas usan UM Sans 1.2
Production. Esta regla editorial vigente supera la cita histórica del manual.

| Peso | CSS value | Uso |
|------|-----------|-----|
| **Demi (principal)** | **600** | **Logotipo** |

- Tracking: `-0.02em` (letter-spacing negativo, el logo siempre en lowercase)
- Web: `https://fonts.cdnfonts.com/css/futura-pt`

### Tipografía editorial: UM Sans 1.2 Production

UM Sans se usa en títulos, cuerpo, interfaz, cifras, documentos y PDF: 400 para
lectura, 500 para interfaz, 600 para títulos y 700 para énfasis breve. Arial y
system-ui son fallbacks. La familia completa, su licencia OFL, kits web,
inventarios, specimen y QA están en `public/fonts/um-sans` y
`docs/typography/release`.

### DOCX — estrategia de fuentes

Para documentos nuevos:
- **Opción A (recomendada)**: instalar los TTF de UM Sans 1.2 y usarlos en título y cuerpo.
- **Opción B (legacy)**: Poppins para reproducir documentos anteriores que ya dependían de esa métrica.
- **Opción C (fallback Windows)**: Arial cuando no se controla la instalación de fuentes.

En generadores nuevos usar `font: "UM Sans"`; comprobar el embedding al exportar PDF.

**Referencia de pesos en DOCX**:
- `bold: false, font: "UM Sans"` → UM Sans Regular (400)
- `bold: true, font: "UM Sans"` → UM Sans Bold (700) en flujos DOCX binarios

---

## 4. El Logotipo

> **FUENTE**: Manual de Marca UMSA v1.0, secciones 2, 3, 8 y 9.

### Construcción

```
ultimamilla  .  com  .  ar
───────────  ─  ───  ─  ──
   negro    RED negro RED negro
```

- Texto: `#000000` (negro puro)
- Los **dos puntos**: `#DC2626` (Rojo UMSA) — representan nodos de conexión, la validación, el punto final de la última milla
- Fuente: Futura PT Demi 600
- Tracking: `-0.02em`
- **Siempre en minúsculas** — NUNCA en mayúsculas

### Versiones

| Versión | Sobre qué fondo | Texto | Puntos |
|---------|----------------|-------|--------|
| Principal | Blanco / claro | `#000000` | `#DC2626` |
| Invertida | Negro / oscuro | `#FFFFFF` | `#DC2626` |
| Monocromática | Impresión una tinta | igual que texto | igual que texto |

### En DOCX (Node.js docx library)

```javascript
// Logo en header / cover — versión principal (fondo claro)
[
  new TextRun({ text: 'ultimamilla', font: 'Poppins', size: SIZE, bold: true, color: '000000' }),
  new TextRun({ text: '.', font: 'Poppins', size: SIZE, bold: true, color: 'DC2626' }),
  new TextRun({ text: 'com', font: 'Poppins', size: SIZE, bold: true, color: '000000' }),
  new TextRun({ text: '.', font: 'Poppins', size: SIZE, bold: true, color: 'DC2626' }),
  new TextRun({ text: 'ar', font: 'Poppins', size: SIZE, bold: true, color: '000000' }),
]

// Tamaños sugeridos (en half-points, DOCX):
// Cover principal:  size: 72 (= 36pt)
// Header de página: size: 22 (= 11pt)
// Footer:           size: 18 (= 9pt)
```

### Usos incorrectos (según Manual)

- ❌ Cambiar la tipografía
- ❌ Cambiar el color de los puntos (siempre `#DC2626`)
- ❌ Usar en mayúsculas (ULTIMAMILLA.COM.AR)
- ❌ Separar en múltiples líneas
- ❌ Rotar, inclinar o distorsionar
- ❌ Aplicar sombras, degradados, brillos
- ❌ Encerrar en formas (círculos, rectángulos)
- ❌ Modificar el espaciado entre letras

---

## 5. Estructura de página de documento

### Márgenes A4

```javascript
margin: { top: 1200, right: 1134, bottom: 1400, left: 1701 }
// Equivale: ~2.1cm top, ~2cm right, ~2.5cm bottom, ~3cm left
// Ancho útil: W = 9026 DXA
```

### Page Header (se repite en todas las páginas)

```javascript
new Header({ children: [
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'DC2626', space: 4 } },
    spacing: { before: 0, after: 80 },
    children: [
      // Logo pequeño
      new TextRun({ text: 'ultimamilla', font: 'Poppins', size: 18, bold: true, color: '000000' }),
      new TextRun({ text: '.', font: 'Poppins', size: 18, bold: true, color: 'DC2626' }),
      new TextRun({ text: 'com', font: 'Poppins', size: 18, bold: true, color: '000000' }),
      new TextRun({ text: '.', font: 'Poppins', size: 18, bold: true, color: 'DC2626' }),
      new TextRun({ text: 'ar', font: 'Poppins', size: 18, bold: true, color: '000000' }),
      // Tab + referencia derecha
      new TextRun({ text: '\t', font: 'Arial' }),
      new TextRun({ text: 'NOTA N.º XX/YYYY  —  Referencia', font: 'Arial', size: 16, color: '666666' })
    ]
  })
]})
// NOTA: La línea roja debajo del header es el separador brand. NO usar gris aquí — siempre DC2626
```

### Page Footer

```javascript
new Footer({ children: [
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD', space: 4 } },
    spacing: { before: 80, after: 0 },
    children: [
      new TextRun({ text: 'ultimamilla.com.ar', font: 'Poppins', size: 16, bold: true, color: 'DC2626' }),
      new TextRun({ text: '\t', font: 'Arial' }),
      new TextRun({ text: 'Referencia expediente  —  Pág. ', font: 'Arial', size: 15, color: '666666' }),
      new TextRun({ font: 'Arial', size: 15, color: '666666', children: [PageNumber.CURRENT] })
    ]
  })
]})
```

---

## 6. Cabecera de nota (Cover)

```
[espacio]

ultimamilla.com.ar                           NOTA N.º XX/2026
─────  [línea roja DC2626 gruesa, 8pt]  ─────────────────────

[grilla de metadatos 2 columnas]
```

El logo en el cover es:
- Tamaño: 36pt (size 72 en DOCX)
- Alineado a la izquierda
- Número de nota alineado a la derecha con tabstop

### Grilla de metadatos (gridMeta)

2 columnas, celdas con borde gris `#DDDDDD`:
- Label: Arial 8pt `#666666` (gris medio)
- Valor: Arial 10pt bold `#000000` o `#333333`

```javascript
// items = [[label1, valor1], [label2, valor2], ...]
// Agrupados en pares de 2 por fila
function gridMeta(items) { /* ver código base */ }
```

---

## 7. Cabecera de sección

```
┌─────┬────────────────────────────────────────────────────┐
│  N  │  TÍTULO DE SECCIÓN EN MAYÚSCULAS                   │
│azul │  fondo gris claro F5F5F5, borde inferior rojo      │
└─────┴────────────────────────────────────────────────────┘
```

- Badge izquierdo: fondo `#1A56C0`, número en blanco, Poppins Bold
- Título: Poppins Bold 700, ALL CAPS, color `#000000`
- Borde inferior: `#DC2626`, 6pt — **este borde rojo es el sello brand**
- Separación antes: 280 DXA / después: 80 DXA

```javascript
function sec(num, titulo) {
  return [
    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [440, 8586],
      rows: [new TableRow({ children: [
        // Badge azul
        new TableCell({
          shading: { fill: '1A56C0', type: ShadingType.CLEAR },
          borders: { top: sb(), bottom: sb(), left: sb(), right: sb() },
          margins: { top: 70, bottom: 70, left: 80, right: 80 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(num), font: 'Poppins', size: 22, bold: true, color: 'FFFFFF' })]
          })]
        }),
        // Título
        new TableCell({
          shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
          borders: {
            top: sb(), left: sb(), right: sb(),
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'DC2626' }  // ← ROJO DC2626
          },
          margins: { top: 70, bottom: 70, left: 200, right: 80 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            children: [new TextRun({ text: titulo, font: 'Poppins', size: 24, bold: true, color: '000000' })]
          })]
        })
      ] })]
    }),
    emptyParagraph(80)  // espacio después
  ];
}
// Uso en children: ...sec(1, 'OBJETO')
```

---

## 8. Tablas de datos

### Cabecera de tabla

```javascript
// Fondo: #000000 (negro, no navy)
// Texto: #FFFFFF bold
// Font: Poppins Bold para labels de header
filaCab(['Columna 1', 'Columna 2'], widths)
```

### Filas alternas

- Impar: fondo blanco `#FFFFFF`
- Par: fondo gris claro `#F5F5F5`
- Borde: `#DDDDDD` 4pt

### Categorías (span completo en tabla)

```javascript
// Categoría A (adicionales puros): bg='FFF5F5', borde/texto='DC2626'
// Categoría B (mejoras): bg='EFF4FF', borde/texto='1A56C0'
// Total / cierre: bg='000000', texto='FFFFFF'
```

### Callout / bloque destacado

```javascript
// Callout verde (ok/verificado):  bg='EEF7EE', borde='2D8A2D'
// Callout azul (info):            bg='EFF4FF', borde='1A56C0'
// Callout rojo (alerta):          bg='FFF5F5', borde='DC2626'
// Borde izquierdo ancho (16pt) + bordes finos restantes
```

---

## 9. Firma

```javascript
// PNG transparente firma_transparente.png
// Ancho: 130px, alto proporcional (716:678)
const FIRMA_W = 130;
const FIRMA_H = Math.round(130 * 716 / 678);
// Espacio antes: 800 DXA
// Línea: top border 6pt #333333
// Nombre: Poppins Bold 11pt (size 22)
// Cargo: Arial 10pt gris (size 20, color 444444)
// Empresa: Arial 10pt italic gris (ULTIMA MILLA S.A.)
```

---

## 10. Tokens de diseño (constantes JS para el generador)

```javascript
// ── PALETA OFFICIAL ULTIMA MILLA ──────────────────────────────────────────
const NEGRO  = '000000';   // texto principal, logo base
const ROJO   = 'DC2626';   // ← ROJO UMSA CORRECTO. Puntos logo, separadores brand
const BLANC  = 'FFFFFF';   // fondos, texto invertido
const GRIS_O = '333333';   // texto secundario / body
const GRIS_M = '666666';   // labels, subtítulos, metadata
const GRIS_C = 'F5F5F5';   // fondos cards, filas alternas
const GRIS_B = 'DDDDDD';   // bordes de tabla
const AZUL_S = '1A56C0';   // badge de sección (uso documental, no en Manual)

// ── TIPOGRAFÍA ────────────────────────────────────────────────────────────
const F_HEAD = 'Poppins';  // headings (sustituye Futura PT en DOCX)
const F_BODY = 'Arial';    // body text

// ── PÁGINA ────────────────────────────────────────────────────────────────
const W = 9026;            // ancho útil A4
```

---

## 11. Flujo de generación recomendado

```bash
# 1. Generar DOCX
cd /sessions/nice-trusting-bardeen/notas_docx
node generar_nota_adicional_v5.js

# 2. Convertir a PDF con LibreOffice (embed fonts correcto)
libreoffice --headless --convert-to pdf \
  /sessions/nice-trusting-bardeen/mnt/psicole/Nota_Solicitud_Adicionales_SITREP.docx \
  --outdir /sessions/nice-trusting-bardeen/mnt/psicole/

# 3. Validar DOCX
python3 /sessions/nice-trusting-bardeen/mnt/.claude/skills/docx/scripts/office/validate.py \
  /sessions/nice-trusting-bardeen/mnt/psicole/Nota_Solicitud_Adicionales_SITREP.docx
```

---

## 12. 5 Reglas de composición de documentos UMSA

> Estas reglas surgieron de revisión visual sobre documentos impresos/PDF. Son obligatorias en todo documento UMSA.

### REGLA 1 — Sin números cortados en tablas
Ningún número (monto, fecha, cantidad) puede quebrarse entre dos líneas dentro de una celda de tabla. Si el texto puede exceder el ancho, se deben tomar **dos medidas simultáneas**:
- Ampliar la columna que contiene números (mínimo 1700 DXA para importes en ARS)
- Si el campo contiene días + monto, usar **dos Paragraphs separados** dentro de la celda (no `|` en el mismo TextRun)

```javascript
// ✅ Correcto: dos líneas, sin corte
children: [
  new Paragraph({ children: [run('35 días', { bold: true })] }),
  new Paragraph({ children: [run('$ 5.328.000', { bold: true })] })
]
// ❌ Incorrecto: puede cortarse
children: [new Paragraph({ children: [run('35 días  |  $ 5.328.000')] })]
```

### REGLA 2 — Sin fondos rosas ni colores fuera de paleta
La paleta UMSA no incluye rosa, salmón ni ningún rojo-claro. El fondo alternativo oficial es **Gris Claro `#F5F5F5`**. Para filas o banners de categoría con acento ROJO, usar `#F5F5F5` de fondo y texto/borde en `#DC2626`.

```javascript
// ✅ Correcto: fondo gris oficial
shading: { fill: 'F5F5F5', type: ShadingType.CLEAR }
// ❌ Incorrecto: rosa, no es paleta UMSA
shading: { fill: 'FFF3F3', type: ShadingType.CLEAR }
```

### REGLA 3 — Aire antes de nuevas secciones
Todo encabezado de sección debe tener un espacio previo de al menos 400 twips (`spacingBefore: 400`). Implementar añadiendo un párrafo vacío antes del componente de sección:

```javascript
function sec(num, titulo, pb = false) {
  const items = [];
  if (!pb) {
    items.push(new Paragraph({ spacing: { before: 400, after: 0 }, children: [] }));
  }
  // ... resto del componente
}
```

### REGLA 4 — Cortes de página para títulos importantes
Las secciones principales (≥3) deben comenzar en página propia. Se acepta dejar hasta 1/4 de página en blanco para que el título quede bien posicionado. Usar `new PageBreak()` en un Paragraph antes del header de sección:

```javascript
if (pb) {
  items.push(new Paragraph({ spacing: { before: 0, after: 0 }, children: [new PageBreak()] }));
}
```

En el documento, sections 1 y 2 fluyen normalmente; sections 3, 4, 5 llevan `pb = true`.

### REGLA 5 — Tipografía mínima de cuerpo: 12pt (24 half-points)
El body text nunca puede ser menor a 12pt. En la librería `docx`, el tamaño se expresa en **half-points** (24 = 12pt). Esto aplica a:
- Defaults del documento: `size: 24`
- Función `run()`: `o.size || 24`
- Función `p()`: `o.size || 24`
- Contenido de celdas `tcMulti`: `size: 20` mínimo
- Cabeceras de tabla `filaCab`: `size: 20` mínimo

```javascript
// ✅ Correcto
styles: { default: { document: { run: { size: 24 } } } }
function run(text, o = {}) { return new TextRun({ size: o.size || 24, ... }) }
```

### REGLA 6 — NUNCA usar ROJO como fill de celda de tabla
El pipeline DOCX→PDF (LibreOffice, y con frecuencia Word) no garantiza que el texto de color BLANC sea visible sobre celdas con `fill: ROJO`. El renderer puede ignorar el color del TextRun y aplicar el color del documento (negro), resultando en texto negro sobre fondo rojo — ilegible.

**Regla**: el rojo solo aparece como **borde, línea separadora, texto o acento** — nunca como fondo de celda.

```javascript
// ✅ Correcto: NEGRO como fondo — siempre renderiza BLANC correctamente
shading: { fill: NEGRO, type: ShadingType.CLEAR }
borders: { top: { style: BorderStyle.SINGLE, size: 14, color: ROJO } }  // acento en borde

// ❌ Incorrecto: fondo ROJO → texto BLANC puede no renderizarse
shading: { fill: ROJO, type: ShadingType.CLEAR }
children: [run('texto', { color: BLANC })]  // puede ser invisible en el PDF
```

### REGLA 7 — Los encabezados de sección van como Paragraph, NO como tabla
Usar tablas para secciones genera que LibreOffice herede el tema de color del documento en celdas con `ShadingType.CLEAR`, produciendo un tinte cálido (rosa/amarillo) aunque el valor hex sea neutro como `#F5F5F5`.

**Solución**: construir el encabezado con un único `Paragraph` que usa `TextRun.shading` para el badge:

```javascript
new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ROJO, space: 4 } },
  children: [
    // Badge azul: shading en el TextRun, no en una celda
    new TextRun({
      text: '\u00A0' + num + '\u00A0',
      font: F_HEAD, size: 22, bold: true, color: BLANC,
      shading: { type: ShadingType.CLEAR, fill: AZUL }
    }),
    // Título a continuación, mismo párrafo
    new TextRun({ text: '\u2002\u2002' + titulo, font: F_HEAD, size: 24, bold: true, color: NEGRO })
  ]
})
```

Esto requiere docx ≥ 7.x (verificado con 9.6.1 ✓).

### REGLA 8 — Separadores visibles entre columnas de cabecera
`filaCab` tiene fondo NEGRO. Los bordes entre celdas con `color: NEGRO` son invisibles sobre fondo NEGRO. Usar borde gris `#555555` en el lado izquierdo de las celdas 2..N:

```javascript
borders: {
  top: bl(NEGRO), bottom: bl(NEGRO),
  left: i === 0 ? bl(NEGRO) : { style: BorderStyle.SINGLE, size: 4, color: '555555' },
  right: bl(NEGRO)
}
```

### REGLA 9 — Los `\n` en TextRun NO generan salto de línea en DOCX
En el XML de DOCX, el salto de línea dentro de un párrafo se representa con `<w:br/>`, no con el carácter `\n`. Si se pasa `'A1\nBlockchain'` como string a un TextRun, el `\n` puede ser ignorado o tratado como espacio, causando que "Blockchain" se parta mid-word al llegar al borde de celda.

**Solución**: hacer `split('\n')` y crear un `Paragraph` por línea en `tcMulti`:

```javascript
const lineas = String(txt).split('\n');
lineas.forEach((linea, idx) => {
  children.push(new Paragraph({
    spacing: sp(0, idx < lineas.length - 1 ? 8 : 40),
    children: [run(linea, { bold, size: 20 })]
  }));
});
```

---

## 13. Escala tipográfica formal UMSA
> Adaptado del sistema GOV.UK Design System (type scale con alturas de línea en múltiplos de 5).  
> En DOCX, las medidas son en **half-points** (hp). 1pt = 2hp. Alturas de línea en DXA (line spacing).

| Nivel | Uso | Tamaño | Peso | Espacio después | Font |
|-------|-----|--------|------|-----------------|------|
| **Display** | Portada, cover de nota | 72 hp (36pt) | Bold | 400 DXA | Poppins |
| **H1** | Título principal del documento | 48 hp (24pt) | Bold | 280 DXA | Poppins |
| **H2 / Sección** | Cabecera de sección (`sec()`) | 28 hp (14pt) | Bold | 160 DXA | Poppins |
| **H3 / Subsección** | Subtítulo dentro de sección | 24 hp (12pt) | Bold | 120 DXA | Poppins |
| **Body large** | Intro, texto destacado | 24 hp (12pt) | Regular | 160 DXA | Arial |
| **Body** | Texto principal (mínimo Regla 5) | 24 hp (12pt) | Regular | 120 DXA | Arial |
| **Body small** | Contenido de tabla, notas | 20 hp (10pt) | Regular | 80 DXA | Arial |
| **Caption / Meta** | Labels, metadata, footer | 18 hp (9pt) | Regular | 60 DXA | Arial |

### Principios de jerarquía (GOV.UK)
- Usar niveles **en orden** — nunca saltar de H1 a H3
- El espaciado va **después** del heading, nunca antes (el aire antes lo provee el contenido previo o `sec()`)
- Alturas de línea siempre en **múltiplos de 100 DXA** para mantener ritmo vertical consistente

### Constantes JS para el generador
```javascript
// Tamaños — half-points
const SZ = {
  display: 72,   // 36pt — portada
  h1:      48,   // 24pt — título doc
  h2:      28,   // 14pt — sección (sec())
  h3:      24,   // 12pt — subsección
  bodyLg:  24,   // 12pt — intro/destacado
  body:    24,   // 12pt — cuerpo (mínimo REGLA 5)
  sm:      20,   // 10pt — tablas
  caption: 18,   //  9pt — meta/labels/footer
};
```

---

## 14. Escala de espaciado formal UMSA
> Adaptado de la escala GOV.UK (0-9 unidades, base 5px). En DOCX: 1pt = 20 DXA; ~1px ≈ 15 DXA.  
> Usar **siempre estas unidades**. Prohibido usar valores arbitrarios como 80, 130, 175, etc.

| Unidad | DXA | ~pt | Uso típico |
|--------|-----|-----|------------|
| `SP1` | 100 | 5pt | Espacio mínimo entre elementos internos |
| `SP2` | 200 | 10pt | Padding interno de celdas compactas |
| `SP3` | 280 | 14pt | Gap entre párrafos inline, badge margins |
| `SP4` | 400 | 20pt | **Espacio estándar entre párrafos** — Regla 3 |
| `SP5` | 500 | 25pt | Aire antes de subsecciones |
| `SP6` | 600 | 30pt | Espacio entre componentes mayores |
| `SP7` | 800 | 40pt | Antes de secciones H2 sin page break |
| `SP8` | 1000 | 50pt | Espacio generoso pre-firma |
| `SP9` | 1200 | 60pt | Firma (spacingBefore de imagen) |

```javascript
// Escala de espaciado — usar sp() con estos valores
const SP = [0, 100, 200, 280, 400, 500, 600, 800, 1000, 1200];
// Acceso: SP[4] = 400 (estándar), SP[9] = 1200 (firma)
// sp() helper: sp(before, after) → { before, after }
const sp = (b = 0, a = SP[2]) => ({ before: b, after: a });
```

### Regla de ritmo vertical
Todo `spacing.after` en párrafos de cuerpo debe ser `SP[2]` (200 DXA) como mínimo. Los párrafos vacíos de separación usan `spacing.before = SP[4]` (400 DXA). Nunca usar valores como `80` o `120` — usar `SP[1]` = 100 o `SP[2]` = 200.

---

## 15. Roles semánticos de color y accesibilidad WCAG 2.2

### 15.1 Paleta con roles funcionales
> Inspirado en el sistema de color funcional de GOV.UK: nombrar por rol, no por apariencia.

| Token semántico | Color UMSA | HEX | Rol |
|-----------------|-----------|-----|-----|
| `color-text` | NEGRO | `#000000` | Texto principal |
| `color-text-body` | GRIS_O | `#333333` | Cuerpo de texto, párrafos |
| `color-text-muted` | GRIS_M | `#666666` | Labels, captions, metadata |
| `color-brand` | ROJO | `#DC2626` | Acento primario de marca |
| `color-brand-secondary` | AZUL_S | `#1A56C0` | Badge sección, énfasis tablas |
| `color-surface` | GRIS_F | `#F5F5F5` | Fondos alternos, cards |
| `color-border` | GRIS_B | `#DDDDDD` | Bordes de tabla y separadores |
| `color-bg` | BLANC | `#FFFFFF` | Fondo de página y celdas |
| `color-success` | — | `#2D8A2D` | Callout verde (ok/verificado) |
| `color-info` | AZUL_S | `#1A56C0` | Callout informativo |
| `color-error` | ROJO | `#DC2626` | Callout alerta / error |
| `color-header` | NEGRO | `#000000` | Fondo de cabecera de tabla |

### 15.2 Contrastes WCAG 2.2 AA — combinaciones auditadas

WCAG 2.2 AA exige: **4.5:1** para texto normal, **3.0:1** para texto grande (≥18pt o ≥14pt bold).

| Texto | Fondo | Ratio | AA normal | AA grande |
|-------|-------|-------|-----------|-----------|
| BLANC `#FFF` | NEGRO `#000` | 21.0:1 | ✅ | ✅ |
| BLANC `#FFF` | AZUL_S `#1A56C0` | 6.9:1 | ✅ | ✅ |
| BLANC `#FFF` | ROJO `#DC2626` | 4.9:1 | ✅ | ✅ |
| NEGRO `#000` | GRIS_F `#F5F5F5` | 19.0:1 | ✅ | ✅ |
| NEGRO `#000` | BLANC `#FFF` | 21.0:1 | ✅ | ✅ |
| GRIS_O `#333` | BLANC `#FFF` | 12.6:1 | ✅ | ✅ |
| GRIS_M `#666` | BLANC `#FFF` | 5.7:1 | ✅ | ✅ |
| GRIS_M `#666` | GRIS_F `#F5F5F5` | 5.3:1 | ✅ | ✅ |
| **NEGRO `#000`** | **ROJO `#DC2626`** | **4.3:1** | **❌ FALLA** | ✅ solo ≥14pt bold |

### ⚠️ Regla de accesibilidad crítica
**Nunca usar texto NEGRO sobre fondo ROJO para texto de cuerpo** (< 14pt). El ratio 4.3:1 falla WCAG AA.  
Sobre ROJO usar siempre **BLANC** (ratio 4.9:1 ✅). Sobre GRIS_F cualquier color de texto es válido.

```javascript
// ✅ Correcto
shading: { fill: ROJO }, children: [run('texto', { color: BLANC })]

// ❌ Incorrecto (falla contraste AA para body text)
shading: { fill: ROJO }, children: [run('texto', { color: NEGRO })]
```

---

## 16. Legibilidad y ancho de columna

> Basado en la recomendación GOV.UK de usar columnas de 2/3 del ancho para prosa, con máximo ~75 caracteres por línea.

### Para documentos UMSA (A4, W = 9026 DXA)

| Tipo de contenido | Ancho recomendado | DXA | % de W |
|-------------------|-------------------|-----|--------|
| Prosa larga (propuestas, informes) | 2/3 del ancho | 6020 | 67% |
| Notas y memos cortos | Ancho completo | 9026 | 100% |
| Tablas de datos | Ancho completo | 9026 | 100% |
| Callouts / destacados | Ancho completo | 9026 | 100% |

### Proporciones de columnas de tabla técnica
La tabla de análisis técnico usa 4 columnas. Proporciones recomendadas sobre W=9026:

| Columna | Rol | DXA | % |
|---------|-----|-----|---|
| Col 1 — ID/Módulo | Identificador corto | 1500 | 17% |
| Col 2 — Descripción técnica | Contenido principal (más ancha) | 3526 | 39% |
| Col 3 — Justificación | Contenido secundario | 2300 | 25% |
| Col 4 — Métrica/Número | Valor numérico (nunca < 1700) | 1700 | 19% |

**Regla de columna numérica**: la columna que contiene importes en ARS nunca puede ser menor a 1700 DXA. "$ 12.939.000" en Arial 10pt necesita ~1450 DXA de texto + 280 DXA de márgenes = 1730 DXA mínimo.

---

## 17. Checklist de conformidad brand antes de entregar

**Marca e identidad**
- [ ] Rojo es **exactamente** `#DC2626` — no `#CC0000`, no `#FF0000`
- [ ] Logo: `ultimamilla` negro + `.` rojo + `com` negro + `.` rojo + `ar` negro — siempre minúsculas
- [ ] Separador de header de página: línea `#DC2626` (nunca gris)
- [ ] Badge de sección: `#1A56C0` (nunca otro azul)

**Tipografía (Sección 13)**
- [ ] Display/cover: Poppins Bold 36pt (72 hp)
- [ ] Secciones H2: Poppins Bold 14pt (28 hp)
- [ ] Body text: Arial mínimo 12pt (24 hp) — Regla 5
- [ ] Labels/metadata: Arial 9pt (18 hp), color `#666666`
- [ ] Jerarquía en orden: Display → H1 → H2 → H3 — sin saltos de nivel

**Espaciado (Sección 14)**
- [ ] Todo `spacing.after` de párrafo de cuerpo ≥ SP[2] = 200 DXA
- [ ] Aire antes de sección sin page break: SP[4] = 400 DXA mínimo — Regla 3
- [ ] Sin valores ad-hoc (80, 130, 175 DXA) — usar escala SP[]

**Color y accesibilidad (Sección 15)**
- [ ] Sin fondos rosas (`FFF3F3` prohibido) — usar `F5F5F5`
- [ ] ROJO nunca como `fill` de celda — solo borde/texto/acento — Regla 6
- [ ] Texto sobre ROJO: siempre BLANC, nunca NEGRO (ratio 4.3:1 ❌ WCAG fail)
- [ ] Toda combinación color nueva auditada con ratio WCAG 2.2 AA (≥4.5:1 texto normal)

**Tablas (Sección 16 + Reglas)**
- [ ] Encabezados de sección: Paragraph + TextRun.shading, NO tabla — Regla 7
- [ ] Columna numérica ≥ 1700 DXA — Regla 1
- [ ] Separadores `#555555` entre columnas de cabecera — Regla 8
- [ ] Textos multilínea: `split('\n')` → Paragraphs separados, nunca `\n` en TextRun — Regla 9
- [ ] Secciones ≥3: page break con `pb = true` — Regla 4

**Generación**
- [ ] Validado con `validate.py` — 0 errores
- [ ] PDF exportado con LibreOffice (fonts Poppins/Arial embebidos)
- [ ] PDF revisado visualmente (Adobe o Preview) — no solo en LibreOffice

---

## 18. Archivos de referencia visual

```
skills/ultima-milla/
├── SKILL.md                       ← este archivo (instrucciones)
├── SISTEMA-ESTILO-UMSA.md         ← reglas maestras de estilo (todos los formatos)
├── MARCAUM26/                     ← activos originales de marca
│   ├── ULTIMA-MILLA-Manual-de-Marca.docx
│   ├── ultimamilla-FINAL.html     ← logo en tamaños
│   ├── ultimamilla-COMPONENTE.html← componente logo escalable
│   ├── ultimamilla-VECTOR.svg     ← logo SVG vectorial
│   └── favicon-*.svg              ← isotipo para iconos
└── designs/
    ├── sistema-estilo-umsa.html   ← ★ GUÍA UI COMPLETA — abrir en navegador (sidebar GOV.UK style)
    ├── document-components.html   ← todos los componentes de documento renderizados
    └── brand-tokens.css           ← CSS variables del sistema de diseño
```

---

## 19. Selección de formato de salida

> Regla: elegir el formato ANTES de generar. El formato determina el pipeline técnico.

| Solicitud | Formato óptimo | Pipeline |
|-----------|---------------|----------|
| Nota, memo, carta, informe formal | DOCX → PDF | Node.js `docx` → LibreOffice |
| Dashboard, reporte interactivo | HTML / React | CSS brand-tokens + Tailwind |
| Presentación ejecutiva | PPTX | python-pptx (ver SKILL pptx) |
| Tabla de datos / presupuesto | XLSX | openpyxl (ver SKILL xlsx) |
| Gráfico standalone | HTML o PNG | matplotlib / Chart.js / Recharts |
| PDF directo (sin Word) | HTML → PDF | Puppeteer headless → PDF |
| Visualización en conversación | React artifact | Componentes inline con tokens CSS |

### Árbol de decisión rápido

```
¿Necesita firma holográfica o expediente formal?
  → SÍ → DOCX (Node.js generar_nota_adicional_v5.js)
  → NO  → ¿Necesita ser interactivo / con filtros?
            → SÍ → HTML / React artifact
            → NO  → ¿Es presentación de slides?
                     → SÍ → PPTX
                     → NO  → ¿Es tabla de datos numéricos?
                              → SÍ → XLSX
                              → NO  → HTML simple o Markdown
```

---

## 20. HTML / React — guía de implementación de marca UMSA

> Usar cuando Claude genera dashboards, reportes web, artefactos React o páginas HTML con identidad UMSA.

### 20.1 Cargar design tokens

```html
<!-- Opción A: inline en <style> -->
<style>
  :root {
    --um-negro: #000000;
    --um-rojo:  #DC2626;
    --um-azul:  #1A56C0;
    --um-blanco:#FFFFFF;
    --um-gris-f:#F5F5F5;
    --um-gris-b:#DDDDDD;
    --um-gris-t:#666666;
    --um-font-head: 'Poppins', 'Century Gothic', sans-serif;
    --um-font-body: 'Arial', 'Inter', system-ui, sans-serif;
  }
</style>

<!-- Opción B: Google Fonts para Poppins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
```

### 20.2 Logo HTML canónico

```html
<!-- Logo principal (fondo claro) -->
<span class="um-logo" style="font-family:var(--um-font-head);font-weight:700;letter-spacing:-0.02em;color:#000">
  ultimamilla<span style="color:#DC2626">.</span>com<span style="color:#DC2626">.</span>ar
</span>
```

### 20.3 Componentes HTML/CSS de documento UMSA

```html
<!-- Cabecera de página -->
<header style="border-bottom:3px solid #DC2626;padding-bottom:8px;margin-bottom:24px;
  display:flex;justify-content:space-between;align-items:baseline;">
  <span style="font-family:var(--um-font-head);font-weight:700;font-size:22px">
    ultimamilla<span style="color:#DC2626">.</span>com<span style="color:#DC2626">.</span>ar
  </span>
  <span style="font-family:var(--um-font-head);font-weight:700;font-size:13px">NOTA N.º 03/2026</span>
</header>

<!-- Sección numerada -->
<div style="border-bottom:3px solid #DC2626;padding-bottom:6px;margin:32px 0 12px;display:flex;align-items:center;gap:10px;">
  <span style="background:#1A56C0;color:#fff;font-family:var(--um-font-head);font-weight:700;
    padding:2px 8px;font-size:12px;">1</span>
  <span style="font-family:var(--um-font-head);font-weight:700;font-size:14px;text-transform:uppercase">
    TÍTULO DE SECCIÓN
  </span>
</div>

<!-- Tabla de datos -->
<table style="width:100%;border-collapse:collapse;font-family:var(--um-font-body)">
  <thead>
    <tr style="background:#000;color:#fff">
      <th style="padding:10px 12px;text-align:left;font-family:var(--um-font-head);font-size:11px">Columna</th>
      <th style="padding:10px 12px;text-align:right;font-family:var(--um-font-head);font-size:11px">Valor</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#fff"><td style="padding:9px 12px;border-bottom:1px solid #DDD">Fila 1</td></tr>
    <tr style="background:#F5F5F5"><td style="padding:9px 12px;border-bottom:1px solid #DDD">Fila 2</td></tr>
    <!-- Fila total -->
    <tr style="background:#000;border-top:3px solid #DC2626">
      <td style="padding:10px 12px;color:#fff;font-weight:700">TOTAL</td>
      <td style="padding:10px 12px;color:#fff;font-weight:700;text-align:right">$ 12.939.000</td>
    </tr>
  </tbody>
</table>

<!-- Callout info (azul) -->
<div style="border-left:4px solid #1A56C0;background:#EFF4FF;padding:12px 16px;margin:16px 0;font-size:13px">
  Texto informativo destacado.
</div>

<!-- Callout alerta (rojo) -->
<div style="border-left:4px solid #DC2626;background:#FFF5F5;padding:12px 16px;margin:16px 0;font-size:13px">
  Texto de alerta o advertencia.
</div>

<!-- Callout ok (verde) -->
<div style="border-left:4px solid #2D8A2D;background:#EEF7EE;padding:12px 16px;margin:16px 0;font-size:13px">
  Confirmación o estado verificado.
</div>
```

### 20.4 Grilla de metadata HTML

```html
<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <tr>
    <td style="background:#F5F5F5;padding:8px 10px;font-size:9px;color:#666;text-transform:uppercase;width:18%">Expediente</td>
    <td style="padding:8px 10px;font-size:11px;font-weight:700;border:1px solid #DDD;width:32%">PLIEG-2025-07544314</td>
    <td style="background:#F5F5F5;padding:8px 10px;font-size:9px;color:#666;text-transform:uppercase;width:18%">Destinatario</td>
    <td style="padding:8px 10px;font-size:11px;font-weight:700;border:1px solid #DDD;width:32%">Lic. Leonardo Fernandez</td>
  </tr>
</table>
```

### 20.5 React — template de componente UMSA

```jsx
// Componente base — importar en artefactos React
const UMSA = {
  colors: {
    negro: '#000000', rojo: '#DC2626', azul: '#1A56C0',
    blanco: '#FFFFFF', grisF: '#F5F5F5', grisB: '#DDDDDD', grisT: '#666666',
    verde: '#2D8A2D'
  },
  fonts: {
    head: "'Poppins', 'Century Gothic', sans-serif",
    body: "'Arial', 'Inter', system-ui, sans-serif"
  }
};

// Logo
const Logo = ({ size = 22 }) => (
  <span style={{ fontFamily: UMSA.fonts.head, fontWeight: 700, fontSize: size,
    letterSpacing: '-0.02em', color: UMSA.colors.negro }}>
    ultimamilla<span style={{ color: UMSA.colors.rojo }}>.</span>
    com<span style={{ color: UMSA.colors.rojo }}>.</span>ar
  </span>
);

// Badge de sección
const SecBadge = ({ num, title }) => (
  <div style={{ borderBottom: `3px solid ${UMSA.colors.rojo}`, paddingBottom: 6,
    marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ background: UMSA.colors.azul, color: '#fff', padding: '2px 8px',
      fontFamily: UMSA.fonts.head, fontWeight: 700, fontSize: 12 }}>{num}</span>
    <span style={{ fontFamily: UMSA.fonts.head, fontWeight: 700, fontSize: 14,
      textTransform: 'uppercase' }}>{title}</span>
  </div>
);

// Fila de tabla (alterna)
const TRow = ({ data, alt = false }) => (
  <tr style={{ background: alt ? UMSA.colors.grisF : UMSA.colors.blanco }}>
    {data.map((cell, i) => (
      <td key={i} style={{ padding: '9px 12px', borderBottom: `1px solid ${UMSA.colors.grisB}`,
        fontSize: 13, fontFamily: UMSA.fonts.body }}>{cell}</td>
    ))}
  </tr>
);
```

---

## 21. Visualizaciones y gráficos — paleta y convenciones

> Aplicar cuando Claude genera charts con Chart.js, Recharts, matplotlib, d3 o cualquier librería.

### 21.1 Paleta de series de datos

Usar en orden estricto. No inventar colores fuera de esta secuencia:

| Serie | Color | HEX | Uso |
|-------|-------|-----|-----|
| Serie 1 — Principal | Negro UMSA | `#000000` | Línea/barra principal |
| Serie 2 — Secundaria | Rojo UMSA | `#DC2626` | Línea/barra de contraste |
| Serie 3 — Terciaria | Azul sección | `#1A56C0` | Datos adicionales |
| Serie 4 | Gris oscuro | `#333333` | Cuarta serie |
| Serie 5 | Gris medio | `#666666` | Quinta serie |
| Positivo / OK | Verde | `#2D8A2D` | Valores positivos, metas cumplidas |
| Negativo / Alerta | Rojo | `#DC2626` | Valores negativos, desvíos |
| Fondo de área | Gris claro | `#F5F5F5` | Área de relleno bajo curva |

```javascript
// Constantes para Chart.js / Recharts
const UMSA_CHART_COLORS = {
  primary:   '#000000',
  secondary: '#DC2626',
  tertiary:  '#1A56C0',
  gray1:     '#333333',
  gray2:     '#666666',
  success:   '#2D8A2D',
  alert:     '#DC2626',
  gridLine:  '#DDDDDD',
  background:'#F5F5F5',
};
```

### 21.2 Estilo de ejes y grilla

```javascript
// Chart.js — opciones globales UMSA
const umsaChartDefaults = {
  plugins: {
    legend: {
      labels: { font: { family: 'Poppins', size: 11 }, color: '#333333' }
    }
  },
  scales: {
    x: {
      grid: { color: '#DDDDDD', lineWidth: 1 },
      ticks: { font: { family: 'Arial', size: 11 }, color: '#666666' }
    },
    y: {
      grid: { color: '#DDDDDD', lineWidth: 1 },
      ticks: { font: { family: 'Arial', size: 11 }, color: '#666666' }
    }
  }
};
```

### 21.3 Formateo de números UMSA

```javascript
// Siempre usar estos formatos en textos, tooltips y ejes
const fmt = {
  ars:  (n) => `$ ${n.toLocaleString('es-AR')}`,          // $ 12.939.000
  dias: (n) => `${n} días`,                                // 85 días
  pct:  (n) => `${n.toFixed(1)} %`,                       // 47,2 %
  int:  (n) => n.toLocaleString('es-AR'),                  // 1.234.567
};
```

### 21.4 Tipos de gráfico recomendados por dato

| Dato | Gráfico | Notas |
|------|---------|-------|
| Evolución temporal | Línea | Grid DDDDDD, área F5F5F5 |
| Comparación de módulos | Barras horizontales | NEGRO fill, label en Arial |
| Distribución porcentual | Torta / Donut | Paleta en orden desde Serie 1 |
| Metas vs real | Barras agrupadas | Meta=gris, Real=negro o rojo si falta |
| Avance acumulado | Área apilada | Colores en transparencia 80% |

### 21.5 Matplotlib (Python) — configuración UMSA

```python
import matplotlib.pyplot as plt
import matplotlib as mpl

# Tema UMSA
mpl.rcParams.update({
    'font.family':       'Arial',
    'axes.titlesize':    13,
    'axes.titleweight':  'bold',
    'axes.labelsize':    11,
    'axes.spines.top':   False,
    'axes.spines.right': False,
    'axes.edgecolor':    '#DDDDDD',
    'axes.grid':         True,
    'grid.color':        '#DDDDDD',
    'grid.linewidth':    0.8,
    'xtick.color':       '#666666',
    'ytick.color':       '#666666',
    'figure.facecolor':  '#FFFFFF',
    'axes.facecolor':    '#FFFFFF',
})

UMSA_COLORS = ['#000000', '#DC2626', '#1A56C0', '#333333', '#666666', '#2D8A2D']

# Línea de marca en título
def umsa_title(ax, title, subtitle=None):
    ax.set_title(title, fontfamily='Arial', fontweight='bold',
                 fontsize=13, color='#000000', loc='left')
    if subtitle:
        ax.text(0, 1.02, subtitle, transform=ax.transAxes,
                fontsize=10, color='#666666', fontfamily='Arial')
    # Línea roja bajo el título
    ax.axhline(y=ax.get_ylim()[1], color='#DC2626', linewidth=2, xmin=0, xmax=0.3)
```

---

## 22. PDF directo (sin DOCX) — pipeline HTML → PDF

> Usar cuando se necesita un PDF más rápido sin necesidad de firma holográfica o cuando el documento es primariamente visual (gráficos, dashboards).

### Pipeline recomendado

```bash
# 1. Generar HTML con brand-tokens.css
# 2. Convertir a PDF con LibreOffice (más confiable para texto+tablas)
libreoffice --headless --convert-to pdf archivo.html --outdir ./

# O con wkhtmltopdf (mejor para CSS moderno)
wkhtmltopdf --page-size A4 \
  --margin-top 20mm --margin-right 20mm \
  --margin-bottom 25mm --margin-left 30mm \
  archivo.html output.pdf

# O con Puppeteer (mejor para React/charts)
# Ver script: notas_docx/html_to_pdf.js
```

### Configuración de página A4 en HTML para PDF

```css
@page {
  size: A4;
  margin: 21mm 20mm 25mm 30mm; /* top right bottom left — mismo que DOCX */
}
@media print {
  body { font-family: Arial, sans-serif; font-size: 12pt; }
  .no-break { page-break-inside: avoid; } /* equivale a cantSplit */
  .page-break { page-break-before: always; }
}
```

---

## 23. PPTX y XLSX — referencias cruzadas

### PPTX (presentaciones)
- Usar la **SKILL `pptx`** para generación. Antes de aplicar colores, consultar esta SKILL para la paleta.
- Fondo de diapositiva: `#FFFFFF` (blanco), nunca negro — el negro es para texto y headers de tabla.
- Título de slide: Poppins Bold, `#000000`, línea roja inferior `#DC2626` de 3pt.
- Texto de bullet: Arial 18pt, `#333333`.
- Acento: `#DC2626` para datos clave, nunca para fondo completo de slide.

### XLSX (planillas)
- Usar la **SKILL `xlsx`** para generación.
- Cabecera de columna: fondo `#000000`, texto `#FFFFFF`, Calibri Bold 11pt.
- Fila de total: fondo `#000000` + borde top `#DC2626` 2pt.
- Filas alternas: `#F5F5F5` / `#FFFFFF`.
- Números: formato `$ #.##0` (ARS sin decimales) o `#.##0,00`.

---

## 24. Regla 10 — cantSplit: siempre en filas de tabla de datos

Las filas de tablas con contenido de más de 1 línea deben declarar `cantSplit: true` para que no se corten entre páginas. Una fila que se parte a mitad de contenido es ilegible y antiestetica.

```javascript
// ✅ Correcto — fila completa siempre en la misma página
new TableRow({
  cantSplit: true,
  children: [ /* celdas */ ]
})

// ❌ Incorrecto — puede cortarse, "A1\nBlockchain" queda en dos páginas
new TableRow({
  children: [ /* celdas */ ]
})
```

**Excepción**: filas que superan 2/3 del alto de página pueden omitir `cantSplit` (no hay forma de que quepan enteras). En ese caso, dividir el contenido en dos filas separadas.

---

## 25. Regla 11 — Ancho mínimo de columna label en gridMeta

La columna de labels en la grilla de metadata debe ser de al menos **1600 DXA**. Labels como "DESTINATARIO" (12 caracteres en 9pt) necesitan ese espacio mínimo para no quebrarse. El par (label + valor) ocupa `1600 + 2913 = 4513 DXA` por mitad de página.

```javascript
// ✅ Correcto
const W1 = 1600;  // label — mínimo para "DESTINATARIO"
const W2 = 2913;  // valor
// columnWidths: [W1, W2, W1, W2] = 9026 DXA total

// ❌ Incorrecto — "DESTINATARIO" se quiebra en dos líneas
const W1 = 1200;
```
