# UM Sans 2: mapa de producción

Este documento impide llamar “familia terminada” a un control parcial. No es un
cronograma de marketing: cada fase requiere artefactos verificables.

## 0. Set de control

Artefactos: UFOs manuales separados, láminas desktop/mobile/print y decisión de
diseño por `a c e o s n r t`.

Bloqueo actual: **activo**. Alpha 12–14 rechazadas.

## 1. Roman Display Bold

Artefactos:

- Basic Latin (95), Latin-1 Supplement (96) y Latin Extended-A (128);
- cifras proporcionales y tabulares; puntuación, moneda, flechas y signos;
- anclas y compuestos para español, portugués y francés;
- diseño de `.notdef`, space, non-breaking space y control marks;
- reporte de cobertura y archivo de pruebas por script/lengua.

Salida mínima: OTF, TTF, WOFF2 y UFO editables, todos con nombre y versión
coherentes.

## 2. Text Regular y Text Semibold

Artefactos:

- masters separados, no “falsa negrita” desde Bold;
- altura x, color y espaciado recalibrados para 14–22 px;
- pruebas de párrafo, UI, formularios, tablas y PDF;
- revisión de contraste de rasterización a 1x, 2x y 3x.

## 3. Espaciado, kerning y OpenType

Artefactos:

- sidebearings revisados por clases;
- GPOS con pares latinos, acentos y cifras;
- GSUB al menos para `liga`, `case`, `tnum`, `pnum`, `onum`, `zero` y
  localizaciones justificadas;
- pruebas `HHOH`, `AVATAR`, `To`, `Ta`, `rn/m`, `Il1`, `0O`, `¿?` y palabras
  españolas extensas.

## 4. Itálica y variable

Artefactos:

- itálica dibujada, no oblicua automática;
- compatibilidad de contornos entre masters;
- variable `wght` sólo cuando las instancias estáticas hayan sido aprobadas;
- STAT, fvar, avar y nombres de instancia inspeccionados.

## 5. Ingeniería y entrega comercial

Artefactos:

- FontBakery sin fallos internos atribuibles a la fuente;
- validación de fuentes en Chrome, Safari, Firefox, Android e impresión PDF;
- licencia, copyright, EULA interna, changelog, specimen PDF/HTML y guía CSS;
- pruebas de originalidad y revisión legal independiente;
- paquete de distribución con hashes y notas de versión.

## Salida a la web

La integración global requiere que fases 0–3 estén completas y que la compuerta
de release deje de devolver `BLOCKED`. Antes de eso, cualquier font-face sólo
puede existir en un specimen `noindex` y nunca en el theme comercial.
