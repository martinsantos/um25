# Propuesta: re-render de las películas de sector (v6)

## Diagnóstico (renderer v5, medido)
- Iluminación falsa: todos los materiales son emisivos, con un sombreado calculado por la normal. Sin sombras, sin reflejos, sin rebotes (`max_bounces=0`), sin denoise, 8 muestras.
- Geometría: cajas y cilindros generados desde `site-projects-v1.json`, con bisel.
- Tiempos reales (registros del lote): 10,2 s/cuadro en 3840×2160 y 5,8 s/cuadro en 2160×2160 → ~29 h de runner para 12.960 cuadros.

## Qué cambia
**Luz**
- Path tracing real en Cycles: luz de estudio suave (key de área grande, fill y contraluz) y un mundo en degradado de la paleta del sitio (#14232f).
- Sombras de contacto y oclusión naturales: rebotes difusos 2, especulares 2, transmisión 4.
- Muestreo adaptativo (64–128) con denoise OpenImageDenoise.
- Brillo sutil (glare) en pantallas, LEDs y en los flujos de cada capa.

**Materiales (PBR)**
- Metal pintado blanco, aluminio cepillado, rack con pintura en polvo y vidrio con transmisión real.
- Vinilo de piso con variación sutil, hormigón y bandeja galvanizada.
- Acero inoxidable con reflejo anisotrópico (tanques de bodega) y tierra y grava con relieve (minería).
- Pantallas y monitores con contenido emisivo (curvas de signos vitales, tableros), no rectángulos planos.

**Detalle (autoría en código, no costo de render)**
- Piezas protagonistas por sector:
  - Salud: cama articulada, monitor y gases.
  - Aeropuertos: mostrador y cinta.
  - Industria: celda con guardas.
  - Bodegas: tanque con válvulas y soldaduras.
  - Minería: mástil reticulado.
  - Constructoras: puesto y caja de piso.
- Zócalos, juntas de piso y rotulado de racks.

**Sin cambios**: cámaras, duración (18 s) y tiempos de capítulo, para que la historia y el scroll sigan sincronizados.

## Costo y tiempo
- La página usa la película a 1920 px y a 30 cuadros/s para el scroll. Por eso se renderiza a 1920×1080 y 1080×1080, a 30 cuadros/s: un cuarto de los píxeles y la mitad de los cuadros que en v5.
- Estimación: 20–30 s/cuadro → ~40–55 h de runner (unos 2.400–3.300 minutos de GitHub Actions). Con 20 jobs en paralelo, 2–3 horas de reloj. El número real sale de la prueba.
- El Mac no renderiza nada: todo corre en GitHub Actions, como en v5.

## Plan
1. **Prueba** (antes de gastar el lote): 3 momentos × 2 sectores (Salud y Bodegas), nuevo junto al actual, con s/cuadro medido.
2. Apruebo yo con crítica a tamaño real; recién después te lo muestro.
3. Lote completo de los 6 sectores (v6 aparte; v5 queda intacto).
4. Ensamble, codificación para scroll y revisión de las películas completas.
5. Reemplazo en las páginas.

## Criterio de aceptación
- Se leen materiales distintos (metal, vidrio, piso) y hay sombras de contacto bajo cada objeto.
- No hay ruido ni parpadeo entre cuadros (el denoise temporal se revisa en movimiento, no en fotogramas).
- La paleta sigue la del sitio y el texto sigue legible a la izquierda.
- Sin pérdida de nitidez a 1920 px.
