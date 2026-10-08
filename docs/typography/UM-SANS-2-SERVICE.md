# UM Sans 2.0.0: servicio y documentos

La entrega promueve la candidata revisada 0.950 a una distribución operativa
con nombres finales y versión OpenType 2.000. No vuelve a dibujar glifos:
el script compara contornos, avances, cmap, GPOS, GSUB y tablas de variación
antes y después del cambio de metadatos. Los prototipos rechazados de Display
siguen en cuarentena. El logotipo oficial sigue siendo un vector separado.

## Alcance y comparación

La comparación con el binario público 1.2, a los mismos tamaños y pesos,
muestra una dirección sobria compatible con la marca. No demuestra que 2.0
sea universalmente más legible. La mejora entregada es una familia propia,
un catálogo operativo, integración versionada y documentos consistentes.

| Propiedad | 1.2 | 2.0.0 |
| --- | --- | --- |
| Estilos estáticos | 18 | 18 |
| Variables | Romana y cursiva | Romana y cursiva |
| Pesos | 100–900 | 100–900 |
| Ejes | wght, opsz | wght |
| Glifos / caracteres Unicode | 1899 / 1204 | 150 / 143 |
| Procedencia | Derivada de Inter, SIL OFL | Dibujo propio de la candidata 0.950 |
| Incrustación declarada | Installable | Preview & Print, fsType 4 |

La cobertura 2.0 comprende el repertorio español revisado, cifras y signos
del contrato; no equivale a la cobertura de 1.2. Por ejemplo, `º ª ≤ ≥ ½ ¼ ¾ →`
usan el respaldo en web. La familia CSS **UM Sans 1.2 Compatibility** conserva
sus archivos y licencia separados. Estos caracteres no se atribuyen al dibujo
original 2.0. Otras escrituras pueden recurrir al fallback del sistema.

La solicitud del propietario de publicar la nueva fuente autoriza esta
entrega operativa para los sistemas y documentos de Última Milla. LICENSE.txt
expresa ese alcance; no declara una revisión jurídica ni cambia la licencia
histórica de la candidata. Para editar Word/Excel se instalan los TTF;
los DOCX no incluyen fuentes incrustadas editables. Para entregar, exportar PDF.

## Integración

Catálogo: `/estilo/fuente`. Plantillas: `/estilo/fuentes/plantilla`.
Alias: `/estilo/fuente/plantillas` y `/estilo/fuente/planillas` redirigen al catálogo
de plantillas, que incluye la planilla económica Excel.

```html
<link rel="stylesheet" href="https://www.ultimamilla.com.ar/fonts/um-sans/v2.0.0/um-sans.css">
```

```css
body {
  font-family: var(--um-font-family);
  font-kerning: normal;
  font-synthesis: none;
}
.amount { font-variant-numeric: tabular-nums; }
```

El CSS declara familias y tokens; no cambia automáticamente el cuerpo de una
aplicación. La web principal adopta la familia en LayoutV4 y sus variables de
roles, incluido el cine. Los especímenes históricos y documentos estáticos
anteriores conservan su contexto. Las URL 1.2 siguen disponibles, sin cambios.

Las URL 2.0.0 se fijan a los archivos publicados. El despliegue rechaza modificar,
renombrar o borrar esos archivos en una entrega posterior: una corrección debe
usar una versión nueva. `manifest.json` registra hashes de los 58 binarios y
su relación con la candidata. Para aplicaciones críticas que prefieren servir
localmente, copiar el directorio completo con sus licencias, verificar hashes
y mantener la versión en la ruta. No sustituir archivos bajo una URL antigua.

La configuración Nginx existente se aplica por CI: CORS `*`, caché de 30 días
y `nosniff`, solamente en `/fonts/um-sans/` del host www. No envía credenciales,
no cambia el host SGI y verifica su estado antes y después. No se promete una
cabecera `immutable`. El chequeo público compara los 87 archivos entregados,
CORS/caché de fuentes/CSS, rutas del catálogo y el binario legado intacto.

## Plantillas

Tres bases: oferta completa (dos páginas A4), resumen comercial y membrete
(una página cada una). Cada base incluye HTML editable sin conexión, PDF,
DOCX, DOTX y ODT. Excel contiene la planilla económica con fórmulas, validación
de entradas y A4 vertical. Las bases son nuevas: no se presentan como una
modificación de plantillas vigentes de SGI que aún no se pudieron inspeccionar.

No se fijan precios, moneda, impuestos ni condiciones contractuales. Completar
los campos indicados antes de emitir. En Excel los totales quedan vacíos hasta
cargar cantidades, precios e impuestos; ingresar cero si corresponde exención.
Las fórmulas se verificaron con cantidad 2, precio 100 e impuestos 42: total 242.

Pantalla: título 48/36 px, subtítulo 28, bajada 22, cuerpo 20/1.65, interfaz 16.
Documento: título 28 pt, entrada 14, encabezado 18, cuerpo 12/1.45, tabla 11.
La escala impresa responde al soporte; no es una reducción arbitraria del cuerpo
web. El catálogo admite preferencias de tamaño y espaciado, sin ocultar overflow.

Estas proporciones son decisiones de composición, informadas por
[USWDS Typography](https://designsystem.digital.gov/components/typography/),
[USWDS line height](https://designsystem.digital.gov/design-tokens/typesetting/line-height/),
[Butterick: line length](https://practicaltypography.com/line-length.html) y
[W3C: text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).
No existe una razón áurea que certifique legibilidad perfecta. La columna inicial
31 em dio una media de 63 caracteres en ocho líneas completas a 1440 px;
unas 65 letras es un objetivo del proyecto, no una constante universal.
No se atribuyen estos valores al CSS actual de Medium.

## Comprobaciones y límites

- 58 binarios: 1362 comprobaciones de OpenType/perfil del proyecto, incluyendo
  OTS, sin fallos. Informe: `um-sans-2.0.0-standards.json`. No es una certificación
  completa de OpenType ni una puntuación estética.
- Chromium/Linux: catálogo, plantillas, inicio, privacidad y servicio de software,
  escritorio y móvil; fuente efectiva comprobada por CDP. Probador con nueve
  pesos, ambas voces, teclado y edición. Compatibilidad de caracteres comprobada
  como fallback explícito, no como glifos propios.
- LibreOffice/Linux: exportación de los tres documentos, fuentes reales UM Sans 2
  en los PDF, A4, membrete y jerarquía inspeccionados. Excel recalculado e impreso.
- HTML: edición, descarga del archivo editado y exportación PDF comprobadas.
- Revisión visual: comparación 1.2/2.0; capturas reales de pantalla y PDF abiertas.
  Las evidencias de trabajo quedan fuera del código en `scratch/um-central-fonts`.
- No se evaluó velocidad de lectura con personas, ni se ejecutó Microsoft Office,
  Adobe, iOS o Windows nativos. WebKit/Linux pertenece al expediente anterior de
  la candidata conservada, no prueba esas plataformas.

## Consumidores pendientes de acceso

`martinsantos/sgi` fue identificado por el propietario. Esta conexión GitHub
responde 403 en Git y 404 en la API: hace falta habilitar el repo para migrar
`sistema-vistas`, sus estilos y sus plantillas reales. Su login público aún
sirve 1.2 desde su propio host; publicar el servicio central no lo actualiza.

`martinsantos/cotiza` muestra una aplicación de marca Licitómetro. No se reemplaza
su identidad sin confirmar que ese es el producto de Última Milla que se desea
migrar. El módulo cotizador de SGI se revisará junto con `sistema-vistas`.

## Regeneración

```sh
# Requiere el checkout de la candidata congelada y fontTools con Brotli.
python scripts/fonts/release_um_sans_2.py --candidate /ruta/a/candidate --output /ruta/nueva
# Requiere python-docx, PyMuPDF, openpyxl, Pillow y LibreOffice.
python scripts/typography/build_offer_templates.py --work /ruta/temporal --output /ruta/nueva/plantillas
node scripts/fonts/audit_um_sans_2_service.mjs http://127.0.0.1:4350 --local
```

Los generadores se niegan a sobrescribir una entrega. Las versiones posteriores
deben cambiar VERSION/rutas y regenerar sus propios manifiestos. El generador de
plantillas usa los TTF de la distribución fijada; no instala fuentes globalmente.
