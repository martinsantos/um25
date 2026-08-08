# UM Sans 2 Display

Estado: **BLOQUEADO — structural-pass / visual-fail**. No es una fuente de uso
local, web ni distribución comercial.

## Propósito

UM Sans 2 Display es un experimento de dibujo desde primitivas geométricas
propias. No abre, transforma ni subsetea contornos de terceros, pero esa
independencia técnica no garantiza calidad tipográfica. La revisión de palabras
completas reveló curvas deformes, encuentros rotos, acentos inconsistentes y un
ritmo impropio de una familia comercial.

La web usa UM Sans Text 1.2 en todos los roles, incluidos H1 y cifras. El
prototipo Display se conserva exclusivamente para diagnóstico y redibujo.

## Cortes

| Corte | CSS | Uso |
|---|---:|---|
| SemiBold | 600 | diagnóstico de contornos |
| Bold | 700 | diagnóstico de palabras |
| ExtraBold | 800 | diagnóstico de masa |
| Black | 900 | diagnóstico de interpolación visual |

Los binarios TTF, OTF y WOFF2 son artefactos de laboratorio, no entregables.
No existe binario variable porque los masters no comparten una topología segura.

## Regla web

- no cargar ningún archivo de `public/fonts/um-sans-2-display/`;
- no declarar `UM Sans 2 Display` en CSS, preloads, HTML o documentos;
- el audit visual falla si detecta una referencia residual;
- una futura promoción exige redibujo, pruebas raster en desktop/mobile,
  repertorio español, títulos extensos y revisión independiente.

## Construcción y QA

- builder: `scripts/fonts/build_um_sans_2_display.py`;
- auditor: `scripts/fonts/audit_um_sans_2_display.py`;
- diagnóstico local: `npm run fonts:diagnose:um-sans-2-display`;
- specimen web: `/estilo/um-sans`;
- specimen portátil: `/fonts/um-sans-2-display/specimen.html`;
- reportes: `build-report.json` y `qa-report.json`;
- integridad: `CHECKSUMS.sha256`;
- procedencia: `PROVENANCE.md`.

El gate estructural verifica 12 binarios, nombres, pesos, UPM, repertorio,
métricas e inventario. Ese gate no promociona la familia: ya se comprobó que no
detecta por sí solo errores graves de dibujo visibles en palabras completas.

## Frontera honesta

La construcción es independiente, pero la originalidad comercial no se puede
certificar solo con tooling interno. Antes de una distribución externa se
requieren revisión independiente de similitud, cadena de autoría, marca y
matriz física en Windows, Office, Adobe, Android, iOS e impresión.
