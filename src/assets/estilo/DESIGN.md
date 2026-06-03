# DESIGN.md — Sistema de Estilo ULTIMA MILLA S.A.

Fuente visual: https://www.ultimamilla.com.ar/estilo
Fuente corporativa: https://www.ultimamilla.com.ar/estilo/skill.md
Fuente editorial blog: https://www.ultimamilla.com.ar/estilo/blog/blogskill.md
Version: 1.0  
Fecha: Enero 2026  
Aplicacion: DOCX, PDF, HTML, React, PPTX, XLSX, graficos y dashboards

---

## 1. Identidad De Marca

### Logotipo

El logo es siempre texto tipografico:

```text
ultimamilla.com.ar
```

Reglas obligatorias:

- Siempre en minusculas.
- Fuente: Futura PT Demi 600.
- Fallback web/documentos: Poppins, Century Gothic, Arial.
- Letter-spacing: `-0.02em`.
- Texto base: `#000000` sobre fondos claros o `#FFFFFF` sobre fondos oscuros.
- Los dos puntos del dominio son siempre `#DC2626`.

Los puntos rojos representan nodos de conexion, validacion y punto final de la ultima milla.

### Versiones

| Version | Fondo | Texto | Puntos |
| --- | --- | --- | --- |
| Principal | Blanco o claro | `#000000` | `#DC2626` |
| Invertida | Negro u oscuro | `#FFFFFF` | `#DC2626` |
| Display | Gris claro o cover | `#000000` | `#DC2626` |

### Usos Prohibidos

- No usar `ULTIMAMILLA.COM.AR` en mayusculas.
- No cambiar el color de los puntos.
- No separar el logo en multiples lineas.
- No aplicar sombras, degradados, brillos, rotacion o inclinacion.
- No encerrar el logo en formas geometricas.
- No modificar el espaciado entre letras.

---

## 2. Sistema De Color

### Paleta Oficial

| Token | HEX | RGB | Uso |
| --- | --- | --- | --- |
| Negro | `#000000` | 0, 0, 0 | Texto principal, logo base, fondos de tabla |
| Rojo UMSA | `#DC2626` | 220, 38, 38 | Puntos del logo, separadores, acentos |
| Azul seccion | `#1A56C0` | 26, 86, 192 | Badge numerico, callout informativo |
| Blanco | `#FFFFFF` | 255, 255, 255 | Fondos, texto invertido |
| Gris oscuro | `#333333` | 51, 51, 51 | Texto secundario |
| Gris medio | `#666666` | 102, 102, 102 | Labels, captions, metadata |
| Gris claro | `#F5F5F5` | 245, 245, 245 | Filas alternas, fondos de cards |
| Borde gris | `#DDDDDD` | 221, 221, 221 | Bordes, separadores secundarios |
| Verde ok | `#2D8A2D` | 45, 138, 45 | Estado verificado |

### Fondos Semanticos

| Token | HEX | Uso |
| --- | --- | --- |
| Azul background | `#EFF4FF` | Callout informativo |
| Verde background | `#EEF7EE` | Callout verificado |
| Rojo background | `#FFF5F5` | Callout alerta |

### Contraste WCAG 2.2 AA

| Texto | Fondo | Ratio | Texto normal | Texto grande |
| --- | --- | ---: | --- | --- |
| Blanco | Negro | 21.0:1 | Pasa | Pasa |
| Blanco | Azul seccion | 6.9:1 | Pasa | Pasa |
| Blanco | Rojo UMSA | 4.9:1 | Pasa | Pasa |
| Negro | Gris claro | 19.0:1 | Pasa | Pasa |
| Gris medio | Blanco | 5.7:1 | Pasa | Pasa |
| Negro | Rojo UMSA | 4.3:1 | Falla | Pasa solo en grande |

Regla critica: sobre fondo rojo, usar siempre texto blanco. Negro sobre rojo falla WCAG AA para texto normal.

### Colores Prohibidos

- `#CC0000`: no es Rojo UMSA.
- `#0D1B2A`: no pertenece a la marca.
- `#1a3a6b`: no pertenece a la marca.
- `#FFF3F3`: no usar como fondo rosa alterno.
- `#f0f4fb`: no usar como azul claro alterno.

---

## 3. Sistema Tipografico

### Familias

| Rol | Principal | Fallbacks | Pesos |
| --- | --- | --- | --- |
| Headings / Logo | Futura PT | Poppins, Century Gothic | 600, 700, 800 |
| Cuerpo / Datos | Arial | Inter, system-ui | 400, 700 |
| Codigo | Fira Code | Consolas, Courier New | 400 |

### Escala Formal

| Token | Tamaño | DOCX half-points | Peso | Uso |
| --- | ---: | ---: | ---: | --- |
| Display | 36pt | 72 | 800 | Cover, marca principal |
| H1 | 24pt | 48 | 700 | Titulo principal |
| H2 Seccion | 14pt | 28 | 700 | Encabezado de seccion en mayusculas |
| H3 | 12pt | 24 | 600 | Subseccion |
| Body | 12pt | 24 | 400 | Cuerpo de texto |
| Small | 10pt | 20 | 400 | Tablas, notas tecnicas |
| Caption | 9pt | 18 | 400 | Labels, metadata |

Regla critica: el cuerpo de texto nunca debe ser menor a 12pt. En tablas se permite 10pt como excepcion controlada.

---

## 4. Sistema De Espaciado

Escala unica de 10 unidades, base 5px. No usar valores arbitrarios fuera de esta escala.

| Token | CSS | DOCX DXA | Uso |
| --- | ---: | ---: | --- |
| SP0 | 0px | 0 | Sin espaciado |
| SP1 | 5px | 100 | Parrafos en celdas de tabla |
| SP2 | 10px | 200 | Espacio minimo post-run |
| SP3 | 15px | 280 | Separacion entre runs |
| SP4 | 20px | 400 | Estandar entre parrafos |
| SP5 | 25px | 500 | Antes de cuerpo post-cabecera |
| SP6 | 30px | 600 | Antes de seccion H2 |
| SP7 | 40px | 800 | Pre-seccion con page break |
| SP8 | 50px | 1000 | Entre bloques mayores |
| SP9 | 60px | 1200 | Post-encabezado, pre-firma |

```javascript
const SP = [0, 100, 200, 280, 400, 500, 600, 800, 1000, 1200];
const sp = (before = 0, after = SP[2]) => ({ before, after });
```

---

## 5. Componentes De Documento

### Header De Pagina

Estructura:

- Logo a la izquierda.
- Referencia del documento a la derecha.
- Separador inferior siempre rojo `#DC2626`.
- Grosor recomendado: 3px en HTML, `size: 6` en DOCX.

```text
ultimamilla.com.ar                           NOTA N.º 03/2026
─────────────────────────────────────────────────────────────
```

### Badge De Seccion

Estructura:

- Badge numerico: fondo `#1A56C0`, texto `#FFFFFF`, Poppins Bold.
- Titulo: Poppins Bold 700, mayusculas, `#000000`.
- Borde inferior: `#DC2626`.

En DOCX, el badge se debe construir con `TextRun.shading` dentro de un `Paragraph`, no como tabla.

### Tablas

Reglas:

- Cabecera: fondo `#000000`, texto `#FFFFFF`, Poppins Bold 11pt.
- Separadores de cabecera: `#555555` para que sean visibles sobre negro.
- Filas alternas: `#FFFFFF` y `#F5F5F5`.
- Total: fondo `#000000`, texto blanco, borde superior rojo.
- Filas de datos largas: `cantSplit: true`.
- Columnas numericas ARS: minimo 1700 DXA, recomendado 2000 DXA.

### Callouts

| Variante | Fondo | Borde | Uso |
| --- | --- | --- | --- |
| Informativo | `#EFF4FF` | `#1A56C0` | Informacion tecnica complementaria |
| Verificado | `#EEF7EE` | `#2D8A2D` | Estado confirmado o aprobado |
| Alerta | `#FFF5F5` | `#DC2626` | Riesgo o desviacion que requiere atencion |

### Grid De Metadata

Reglas:

- Dos columnas de pares label/valor.
- Label: Arial 9pt, `#666666`, uppercase.
- Valor: Arial 10pt bold, `#000000` o `#333333`.
- Borde: `#DDDDDD`.
- Columna label: minimo 1600 DXA.
- Par label+valor por mitad de pagina: `1600 + 2913 = 4513 DXA`.

---

## 6. DOCX — Node.js

Pipeline recomendado:

```text
Node.js + docx v9.6.1 -> .docx -> LibreOffice headless -> .pdf
```

### Constantes Canonicas

```javascript
const NEGRO = '000000';
const ROJO = 'DC2626';
const BLANC = 'FFFFFF';
const AZUL = '1A56C0';
const GRIS_F = 'F5F5F5';
const GRIS_B = 'DDDDDD';
const GRIS_T = '666666';
const VERDE = '2D8A2D';

const F_HEAD = 'Poppins';
const F_BODY = 'Arial';

const W = 9026;
const SZ = {
  display: 72,
  h1: 48,
  h2: 28,
  h3: 24,
  body: 24,
  sm: 20,
  caption: 18,
};
const SP = [0, 100, 200, 280, 400, 500, 600, 800, 1000, 1200];
const sp = (before = 0, after = SP[2]) => ({ before, after });
const WT = [400, 2400, 4226, 2000];
```

### Seccion Numerada

```javascript
function sec(num, titulo, pb = false) {
  const items = [];
  if (!pb) {
    items.push(new Paragraph({ spacing: { before: SP[4], after: 0 }, children: [] }));
  } else {
    items.push(new Paragraph({ spacing: sp(0, 0), children: [new PageBreak()] }));
  }

  items.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ROJO, space: 4 } },
    spacing: sp(0, SP[3]),
    children: [
      new TextRun({
        text: '\u00A0' + num + '\u00A0',
        font: F_HEAD,
        size: SZ.h2,
        bold: true,
        color: BLANC,
        shading: { type: ShadingType.CLEAR, fill: AZUL },
      }),
      new TextRun({
        text: '\u2002\u2002' + titulo.toUpperCase(),
        font: F_HEAD,
        size: SZ.h2,
        bold: true,
        color: NEGRO,
      }),
    ],
  }));

  return items;
}
```

### Fila De Tabla

```javascript
const filaE = (d, par) => new TableRow({
  cantSplit: true,
  children: [
    tc(d[0], WT[0], { center: true, bg: par ? GRIS_F : BLANC }),
    tcMulti([[d[1], true]], WT[1], { bg: par ? GRIS_F : BLANC }),
    tcMulti([[d[2], false]], WT[2], { bg: par ? GRIS_F : BLANC }),
    tc(d[3], WT[3], {
      center: true,
      bold: true,
      color: VERDE,
      bg: par ? GRIS_F : BLANC,
    }),
  ],
});
```

---

## 7. HTML / React

### Design Tokens CSS

```css
:root {
  --um-negro: #000000;
  --um-rojo: #DC2626;
  --um-azul: #1A56C0;
  --um-verde: #2D8A2D;
  --um-blanco: #FFFFFF;
  --um-gris-f: #F5F5F5;
  --um-gris-b: #DDDDDD;
  --um-gris-t: #666666;
  --um-azul-bg: #EFF4FF;
  --um-verde-bg: #EEF7EE;
  --um-rojo-bg: #FFF5F5;

  --um-font-head: 'Futura PT', 'Poppins', 'Century Gothic', sans-serif;
  --um-font-body: 'Arial', 'Inter', system-ui, sans-serif;

  --um-sz-display: 36pt;
  --um-sz-h1: 24pt;
  --um-sz-h2: 14pt;
  --um-sz-body: 12pt;
  --um-sz-small: 10pt;
  --um-sz-caption: 9pt;

  --um-sp-4: 20px;
  --um-sp-6: 30px;
  --um-sp-8: 50px;
}
```

### React Canonico

```jsx
const UMSA = {
  c: {
    negro: '#000000',
    rojo: '#DC2626',
    azul: '#1A56C0',
    grisF: '#F5F5F5',
    grisB: '#DDDDDD',
    grisT: '#666666',
    verde: '#2D8A2D',
    blanco: '#FFFFFF',
  },
  f: {
    head: "'Poppins','Century Gothic',sans-serif",
    body: "'Arial','Inter',system-ui,sans-serif",
  },
};

const UMLogo = ({ size = 22 }) => (
  <span style={{
    fontFamily: UMSA.f.head,
    fontWeight: 700,
    fontSize: size,
    letterSpacing: '-0.02em',
    color: UMSA.c.negro,
    whiteSpace: 'nowrap',
  }}>
    ultimamilla<span style={{ color: UMSA.c.rojo }}>.</span>
    com<span style={{ color: UMSA.c.rojo }}>.</span>ar
  </span>
);

const UMSection = ({ num, title }) => (
  <div style={{
    borderBottom: `3px solid ${UMSA.c.rojo}`,
    paddingBottom: 8,
    margin: '28px 0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }}>
    <span style={{
      background: UMSA.c.azul,
      color: '#fff',
      padding: '3px 10px',
      fontFamily: UMSA.f.head,
      fontWeight: 700,
      fontSize: 12,
    }}>{num}</span>
    <span style={{
      fontFamily: UMSA.f.head,
      fontWeight: 700,
      fontSize: 14,
      textTransform: 'uppercase',
    }}>{title}</span>
  </div>
);
```

---

## 8. Graficos Y Visualizaciones

### Paleta De Series

Orden estricto:

```javascript
const UMSA_CHART_COLORS = [
  '#000000',
  '#DC2626',
  '#1A56C0',
  '#333333',
  '#666666',
  '#2D8A2D',
];
```

### Defaults Chart.js

```javascript
const umsaChartDefaults = {
  plugins: {
    legend: {
      labels: {
        font: { family: 'Poppins', size: 11 },
        color: '#333333',
      },
    },
  },
  scales: {
    x: {
      grid: { color: '#DDDDDD', lineWidth: 1 },
      ticks: { font: { family: 'Arial', size: 11 }, color: '#666666' },
    },
    y: {
      grid: { color: '#DDDDDD', lineWidth: 1 },
      ticks: { font: { family: 'Arial', size: 11 }, color: '#666666' },
    },
  },
};
```

### Formato De Numeros

```javascript
const fmt = {
  ars: n => `$ ${n.toLocaleString('es-AR')}`,
  dias: n => `${n} dias`,
  pct: n => `${n.toFixed(1).replace('.', ',')} %`,
};
```

---

## 9. PPTX — Presentaciones

| Elemento | Fuente | Tamaño | Color |
| --- | --- | ---: | --- |
| Titulo de slide | Poppins Bold | 28-32pt | `#000000` |
| Subtitulo | Poppins SemiBold | 20-24pt | `#333333` |
| Bullets / cuerpo | Arial | 18pt | `#333333` |
| Dato destacado | Poppins Bold | 36-48pt | `#000000` o `#DC2626` |
| Nota al pie | Arial | 11pt | `#666666` |
| Cabecera tabla | Poppins Bold | 11pt | `#FFFFFF` sobre `#000000` |

Reglas:

- Usar linea horizontal `#DC2626`, 3pt, debajo del titulo.
- Alternativa: banda roja de 6px en la parte superior.
- Fondo de slide siempre `#FFFFFF`; no usar slide completo negro.

---

## 10. XLSX — Planillas

Estructura estandar:

- Primera fila: cabecera negra con texto blanco.
- Cabeceras de columna: negro, Poppins Bold, 11pt.
- Filas de datos alternas: blanco y `#F5F5F5`.
- Totales: negro, blanco, borde superior rojo.
- Importes ARS alineados a la derecha.

Ejemplo:

| Concepto | Importe ARS |
| --- | ---: |
| Modulo A1 — Blockchain | `$ 4.328.000` |
| Modulo A2 — Actores | `$ 3.782.000` |
| **TOTAL** | **`$ 8.110.000`** |

---

## 11. PDF Directo

### CSS A4

```css
@page {
  size: A4;
  margin: 21mm 20mm 25mm 30mm;
}

@media print {
  body {
    font-family: Arial, sans-serif;
    font-size: 12pt;
  }

  .no-break {
    page-break-inside: avoid;
  }

  .page-break {
    page-break-before: always;
  }

  thead {
    display: table-header-group;
  }
}
```

### Pipelines

```bash
libreoffice --headless --convert-to pdf documento.html --outdir ./

wkhtmltopdf --page-size A4 \
  --margin-top 21mm --margin-right 20mm \
  --margin-bottom 25mm --margin-left 30mm \
  documento.html salida.pdf

# Puppeteer:
# await page.pdf({
#   format: 'A4',
#   printBackground: true,
#   margin: { top: '21mm', right: '20mm', bottom: '25mm', left: '30mm' },
# })
```

---

## 12. Reglas Criticas

1. Columna numerica ARS: minimo 1700 DXA; recomendado `W_MONTO = 2000`.
2. Sin colores fuera de paleta.
3. Encabezados de seccion: `spacing.before = SP[4] = 400 DXA` minimo.
4. Secciones 3, 4, 5 y siguientes: comenzar en pagina propia cuando el documento sea largo.
5. Body minimo: 12pt / 24 half-points.
6. Rojo nunca como fill de celda en DOCX.
7. Secciones DOCX como `Paragraph + TextRun.shading`, no tabla.
8. Cabeceras negras: separadores `#555555`, no negro sobre negro.
9. En DOCX, `\n` no genera salto visual; crear parrafos o breaks reales.
10. Filas de tabla largas: `cantSplit: true`.
11. `gridMeta` label minimo 1600 DXA.
12. Texto sobre rojo: siempre blanco.

---

## 13. Checklist De Conformidad

### Identidad Y Marca

- [ ] Rojo exacto `#DC2626`.
- [ ] Logo `ultimamilla.com.ar` en minusculas.
- [ ] Puntos del logo en rojo UMSA.
- [ ] Separador de header en rojo UMSA.
- [ ] Badge de seccion en `#1A56C0`.

### Tipografia

- [ ] Display/cover: Poppins Bold 36pt / 72hp.
- [ ] Secciones H2: Poppins Bold 14pt / 28hp.
- [ ] Body: Arial minimo 12pt / 24hp.
- [ ] Labels/metadata: Arial 9pt, `#666666`.
- [ ] Jerarquia ordenada: Display -> H1 -> H2 -> H3.

### Espaciado

- [ ] Todo `spacing.after` es mayor o igual a `SP[2] = 200 DXA`.
- [ ] Aire antes de seccion: `SP[4] = 400 DXA`.
- [ ] Sin valores ad hoc fuera de la escala.

### Color Y Accesibilidad

- [ ] Sin colores prohibidos.
- [ ] Rojo no se usa como fill de celda DOCX.
- [ ] Texto sobre rojo siempre blanco.
- [ ] Negro sobre rojo solo para texto grande y bold si no hay alternativa.

### Tablas DOCX

- [ ] Secciones como `Paragraph + TextRun.shading`, no tabla.
- [ ] Columna numerica mayor o igual a 1700 DXA.
- [ ] Separadores `#555555` en cabeceras negras.
- [ ] `split('\n')` convertido a parrafos o breaks reales.
- [ ] `cantSplit: true` en filas de datos.
- [ ] Label `gridMeta` mayor o igual a 1600 DXA.
- [ ] Secciones largas con page break cuando corresponda.

### Generacion Y Entrega

- [ ] Generado DOCX o HTML con tokens UMSA.
- [ ] Exportado a PDF cuando corresponda.
- [ ] PDF revisado visualmente.
- [ ] Fuentes Poppins/Arial disponibles o embebidas.

---

## 14. Fuente De Verdad

Este documento Markdown es la version operativa del Sistema de Estilo publicado en https://www.ultimamilla.com.ar/estilo.

La fuente visual sigue siendo el manual interactivo de `/estilo`; este archivo se usa como referencia portable para agentes, automatizaciones y revisiones tecnicas.

---

## 15. Fuentes Operativas

Este `DESIGN.md` integra tres superficies publicadas bajo `/estilo`. Cada una cumple un rol distinto y no se reemplazan entre si.

| Fuente | Rol | Uso correcto |
| --- | --- | --- |
| `https://www.ultimamilla.com.ar/estilo` | Manual visual interactivo | Consultar identidad, paleta, componentes, previews y reglas de QA visual. |
| `https://www.ultimamilla.com.ar/estilo/skill.md` | Skill corporativa UMSA | Generar documentos, DOCX, PDFs, dashboards, presentaciones, planillas y salidas visuales con identidad UMSA. |
| `https://www.ultimamilla.com.ar/estilo/blog/blogskill.md` | Skill editorial del blog | Redactar, auditar y publicar notas del blog con voz UMSA, estructura didactica, investigacion y control anti-vicios. |

### Precedencia

1. Para piezas visuales o documentales, manda `/estilo` junto con `/estilo/skill.md`.
2. Para notas del blog, manda `/estilo/blog/blogskill.md` en voz, estructura, investigacion, SEO y publicacion.
3. Para notas del blog que tambien generen DOCX o PDF espejo, aplicar primero `/estilo/blog/blogskill.md` al contenido y despues `/estilo/skill.md` al formato visual.
4. Si hay conflicto, priorizar precision, claridad y reglas de produccion por encima de ornamentacion visual.

### Reglas incorporadas desde `/estilo/skill.md`

- Rojo UMSA exacto: `#DC2626`.
- Logo siempre `ultimamilla.com.ar`, en minusculas y con puntos rojos.
- Poppins como reemplazo operativo de Futura PT en DOCX y PDF.
- Arial para cuerpo de texto y datos.
- Header, footer, separadores, tablas, callouts, firmas y grillas de metadata deben usar los tokens definidos en este documento.
- Toda entrega documental debe revisarse visualmente despues de exportar a PDF.

### Reglas incorporadas desde `/estilo/blog/blogskill.md`

- La voz editorial prioriza precision, claridad, didactica tecnica, especificidad y voz humana.
- Cada nota debe explicar como funciona la solucion, no solo nombrar el problema.
- Las notas tecnicas deben incluir flujo operativo, datos, permisos, prueba de backup/auditoria/salida y costo cuando corresponda.
- Titulos, aperturas y subtitulos deben rotar patrones para evitar formula repetida.
- Fuentes: minimo cuatro fuentes primarias verificadas por nota.
- Prohibido inventar datos sobre UMSA, clientes o miembros.
- No publicar nombres de clientes reales sin permiso escrito; usar perfiles anonimizados.
- Para imagenes de portada, usar licencia verificada.

### Uso por agentes

Cuando una automatizacion necesite una unica referencia portable:

1. Leer este `DESIGN.md`.
2. Si el output es visual, abrir tambien `https://www.ultimamilla.com.ar/estilo/skill.md`.
3. Si el output es blog, abrir tambien `https://www.ultimamilla.com.ar/estilo/blog/blogskill.md`.
4. Validar el resultado contra el checklist de conformidad antes de entregar.
