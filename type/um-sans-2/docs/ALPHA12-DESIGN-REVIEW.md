# UM Sans 2 Manual: revisión de diseño Alpha 12

Estado: **rechazado para producto y para integración web**.

Alpha 12 es el primer control técnico que produce una `e` normalizada por
Fontmake. Eso evita la deformación de contornos que afectó a los binarios de
las iteraciones previas, pero no convierte el dibujo en una solución editorial
aprobada.

## Hallazgos visuales

- La `e` tiene una apertura demasiado contenida y un travesaño demasiado largo;
  a gran tamaño se lee como una construcción geométrica, no como una forma con
  ritmo propio.
- Los terminales de `e`, `c` y `s` no comparten aún un criterio de corte y
  tensión; no deben exportarse como una voz de display.
- El contraste de masa entre ascendentes, bowls y barras no ha sido evaluado
  sobre alfabeto completo. Veinticinco glifos no permiten juzgar color de texto.
- No existen clases de espaciado, pares GPOS, masters de peso ni pruebas de
  interpolación. Cualquier resultado tipográfico aparentemente correcto puede
  romperse en palabras no cubiertas.

## Brief obligatorio para la nueva `e`

La siguiente alternativa debe crearse en una fuente nueva, sin editar Alpha 12:

1. Mantener altura x de 540 y una abertura mínima de 118 unidades.
2. Separar el final del travesaño de la terminal exterior: no usar una barra que
   cierre visualmente el ojo.
3. Resolver terminales de `c/e/s` como una familia, con el mismo ángulo,
   overshoot y corrección óptica.
4. Revisar la forma en 24, 48, 72 y 112 px antes de añadir glifos derivados.
5. Sólo tras aprobar `a c e o s` se autorizan componentes acentuados y el
   resto del alfabeto Latin Extended-A.

## Evidencia reproducible

```bash
UMSANS_FONTMAKE=/ruta/a/fontmake npm run fonts:fontmake:um-sans-2-manual
npm run fonts:visual-gate:um-sans-2-manual
UMSANS_FONT_PYTHON=/ruta/a/python npm run fonts:gate:um-sans-2-manual
```

La primera orden genera la fuente de revisión. La segunda produce la lámina
raster desde esa fuente exacta. La tercera debe devolver `BLOCKED` hasta que
exista una familia completa y aprobada.
