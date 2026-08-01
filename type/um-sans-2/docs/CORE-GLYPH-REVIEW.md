# UM Sans 2: revisión de glifos de control

Estado: **ninguna variante está aprobada para integración web o distribución**.

El alfabeto no debe ampliarse desde una letra que todavía no expresa el
sistema. El set inicial controla el resultado de la familia:

`a c e o s n r t`

## Alpha 12

Rechazada. La `e` se resolvía como una forma redonda demasiado cerrada con una
barra añadida. Compilaba, pero no tenía una apertura convincente ni relación
propia con `c` y `o`.

## Alpha 13

Rechazada. Acortó el problema sin resolver la estructura: la apertura y la
barra continuaron siendo ajustes locales sobre el mismo esquema.

## Alpha 14

Rechazada como fuente de producción. La apertura es medible y no presenta
fallback en la lámina de revisión, pero el set aún resulta demasiado genérico:

- la `e` no logra un terminal distintivo ni suficiente tensión respecto de `c`;
- la `a` y `o` no fijan una modulación compartida con la `e`;
- las curvas de `s` requieren revisión junto a las terminales de `c` y `e`;
- el único peso disponible impide juzgar interpolación y color tipográfico.

La lámina de Alpha 14 sirve para diagnosticar, no para aprobar:

`type/um-sans-2/proofs/generated/alpha14/glyph-review.png`

## Alpha 15

Rechazada. El terminal redondeado no corrige el defecto estructural: la `e`
continúa construida como una forma cerrada atravesada por una contraforma. En
texto se lee como símbolo y rompe el ritmo de `c/o`. La lámina A4 de esta
iteración también quedó invalidada por usar tamaños en puntos incompatibles
con una densidad de 300 dpi.

## Alpha 16

En evaluación. Parte de la forma abierta de `c` y añade una barra positiva con
terminal redondeado. Esta estructura debe demostrar una boca clara y un color
coherente junto a `a/c/o/s` antes de ampliar el inventario.

## Brief del próximo dibujo

1. Redibujar `a/c/e/o/s` como un conjunto, no como correcciones aisladas.
2. Mantener una altura x de 540 UPM y un color de trazo consistente; evaluar
   las contraformas antes de añadir detalle decorativo.
3. Definir un único lenguaje de terminal para `c`, `e`, `s`, `r` y `t`.
4. En `e`, abrir la boca por encima y por debajo de la barra con holgura
   visible a 24, 48, 72 y 112 px.
5. Comparar palabras de control: `ece`, `ese`, `referencia`, `operacion` y
   `continuo` antes de dibujar acentos, cifras o pesos adicionales.
6. Sólo tras aprobar el set de control: completar Basic Latin, Latin-1 y Latin
   Extended-A; después, espaciado, kerning, pesos e itálicas.

## Compuertas obligatorias

- `fonts:fontmake:um-sans-2-manual`: binario normalizado por Fontmake.
- `fonts:visual-gate:um-sans-2-manual`: no permite fallbacks en la lámina
  técnica.
- `fonts:glyph-review:um-sans-2-manual`: no permite una cadena con glifos
  ausentes y muestra el set de control en contexto.
- `fonts:release-gate:um-sans-2-manual`: seguirá bloqueado hasta cobertura,
  GPOS, hinting e inventario suficientes.

Ninguna compuerta técnica constituye aprobación estética. La aprobación exige
revisión humana de la lámina por tamaño y por palabra.
