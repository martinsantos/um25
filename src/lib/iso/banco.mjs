/**
 * El banco (2026-10-30): las partes de un despiece dispuestas a escala sobre una base con
 * patas, ranura, tornillos y regla, como una mesa de taller. Es la referencia compositiva de
 * Anatomy (una base en tono bajo, las piezas apoyadas, una sola pieza encendida) aplicada al
 * equipamiento real de un proyecto, un sector o un servicio: las partes no flotan como
 * iconos, están apoyadas juntas y en proporción.
 *
 * bancoSvg([{ key: 'detector', qty: 3 }, { key: 'central' }], { label }) → <svg …>
 */
import * as k from './anatomy/iso-kit.mjs';
import { PARTES, NOMBRES, CAM, CSS, renombrar } from './partes.mjs';

const GAP = 9;          // separación entre piezas, en unidades
const MARGEN = 13;      // de la pieza al borde de la base
const MAX_COPIAS = 4;   // cuántas veces se repite una pieza con cantidad
const ALTO_BASE = 3.2;
const ALTO_PATA = 3;

const bbox = (points) => ({ x0: Math.min(...points.map((p) => p[0])), x1: Math.max(...points.map((p) => p[0])), y0: Math.min(...points.map((p) => p[1])), y1: Math.max(...points.map((p) => p[1])), z1: Math.max(...points.map((p) => p[2])) });

/** Las instancias que irán sobre el banco, con su huella. */
function instancias(items) {
  const out = [];
  for (const it of items) {
    if (!PARTES[it.key]) continue;
    const { ext } = PARTES[it.key]();
    const b = bbox(ext.points);
    const copias = Math.max(1, Math.min(MAX_COPIAS, it.qty || 1));
    for (let i = 0; i < copias; i++) out.push({ key: it.key, b, w: b.x1 - b.x0, d: b.y1 - b.y0, h: b.z1 });
  }
  return out;
}

/** Filas: las piezas altas atrás, las bajas adelante; cada fila corre a lo largo de x. */
function disponer(list) {
  const porAlto = [...list].sort((a, b) => b.h - a.h || b.d - a.d);
  // Hasta tres piezas en una fila; después, dos filas (las altas atrás); más de ocho, tres.
  const filas = porAlto.length <= 3 ? 1 : porAlto.length <= 8 ? 2 : 3;
  const porFila = Math.ceil(porAlto.length / filas);
  const grupos = Array.from({ length: filas }, (_, r) => porAlto.slice(r * porFila, (r + 1) * porFila)).filter((g) => g.length);
  const anchos = grupos.map((g) => g.reduce((s, i) => s + i.w + GAP, -GAP));
  const total = Math.max(...anchos);
  let y = 0;
  const placed = [];
  grupos.forEach((g, row) => {
    const prof = Math.max(...g.map((i) => i.d));
    let x = -anchos[row] / 2 + (row ? 0 : 0);
    for (const i of g) {
      // centro de la pieza en el mundo: su huella local se traslada a (cx, cy)
      const cx = x + i.w / 2, cy = y + prof / 2;
      placed.push({ ...i, cx, cy, ox: cx - (i.b.x0 + i.b.x1) / 2, oy: cy - (i.b.y0 + i.b.y1) / 2 });
      x += i.w + GAP;
    }
    y += prof + GAP + 2;
  });
  const b = { x0: -total / 2 - MARGEN, x1: total / 2 + MARGEN, y0: -MARGEN, y1: y - GAP - 2 + MARGEN };
  return { placed, plan: { x: b.x0, y: b.y0, w: b.x1 - b.x0, d: b.y1 - b.y0, r: 2.5 } };
}

/** Una sola pieza encendida por banco: las demás pierden su acento. */
const apagar = (svg) => svg.replace(/ data-lit=""/g, '').replace(/data-tone="lit"/g, 'data-tone="hi"');

export function bancoSvg(items, { width = 1200, height = 540, maxScale = 6.4, minScale = 2.6, label = '' } = {}) {
  const list = instancias(items);
  if (!list.length) return '';
  const { placed, plan } = disponer(list);
  const zTop = Math.max(...placed.map((i) => i.h)) + ALTO_BASE + ALTO_PATA;
  const puntos = [...k.boxCorners(plan, 0, ALTO_BASE + ALTO_PATA), [plan.x + plan.w / 2, plan.y + plan.d / 2, zTop]];
  const P = k.fitProjection(puntos, width, height, { pad: 22, ...CAM });
  if (P.scale > maxScale || P.scale < minScale) {
    const scale = Math.max(minScale, Math.min(maxScale, P.scale));
    const unit = { origin: [0, 0], scale, azimuth: P.azimuth, elevation: P.elevation };
    const flat = puntos.map((p) => k.iso(p, unit));
    const xs = flat.map(([x]) => x), ys = flat.map(([, y]) => y);
    P.scale = scale;
    P.origin = [width / 2 - (Math.min(...xs) + Math.max(...xs)) / 2, height / 2 - (Math.min(...ys) + Math.max(...ys)) / 2];
  }
  const S = (paths, style = {}) => k.solidSvg(paths, { crease: 'faint', ...style });
  const L = (d, style = {}) => k.lineSvg(d, style);
  const D = (pts, style = {}) => k.dotsSvg(pts, style);
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  const z0 = ALTO_PATA, z1 = ALTO_PATA + ALTO_BASE;
  const out = [];
  // Base: patas, losa, ranura, tornillos y regla a lo largo del frente.
  for (const [x, y] of byDepth(k.corners(plan, 7))) out.push(S(k.cylinder(x, y, 2.4, 0, ALTO_PATA, P, 20), { tone: 'lo', crease: 'none' }));
  out.push(S(k.slabOf(plan, z0, ALTO_BASE, P, 6, 0.8), { tone: 'lo' }));
  out.push(L(k.planOutline(k.insetPlan(plan, 4), z1, P, 6), { tone: 'faint' }));
  const screws = k.corners(plan, 3.2);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1, z1 + 0.01, P, 12)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => k.iso([x, y, z1 + 0.01], P)), { size: 0.45, tone: 'mid' }));
  const strip = { x: plan.x + 6, y: plan.y + plan.d - 6.5, w: plan.w - 12, d: 3.2, r: 0.4 };
  out.push(S(k.slabOf(strip, z1, 0.4, P, 2), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(strip.x + 2, strip.x + strip.w - 2, 4, 5, strip.y + 0.4, z1 + 0.4, [1.1, 2], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  // Piezas, de atrás hacia adelante; la primera (la mayor) conserva su acento.
  const orden = [...placed].sort((a, b) => k.depthOf([a.cx, a.cy, 0], P) - k.depthOf([b.cx, b.cy, 0], P));
  const mayor = placed[0];
  const o = k.iso([0, 0, 0], P);
  for (const i of orden) {
    const t = k.iso([i.ox, i.oy, z1], P);
    const svg = PARTES[i.key](P).svg;
    out.push(`<g transform="translate(${(t[0] - o[0]).toFixed(1)} ${(t[1] - o[1]).toFixed(1)})">${i === mayor ? svg : apagar(svg)}</g>`);
  }
  const nombre = label || items.map((it) => (it.qty ? `${it.qty} × ` : '') + (NOMBRES[it.key] || it.key)).join(', ');
  // La caja se ciñe a lo dibujado: así el banco no deja aire de más ni arriba ni abajo.
  const flat = puntos.map((p) => k.iso(p, P));
  const y0 = Math.min(...flat.map(([, y]) => y)) - 18, y1 = Math.max(...flat.map(([, y]) => y)) + 10;
  return `<svg class="banco pt-svg" viewBox="0 ${y0.toFixed(1)} ${width} ${(y1 - y0).toFixed(1)}" role="img" aria-label="${nombre.replace(/"/g, '&quot;')}">${renombrar(out.join(''))}</svg>`;
}

const TOKENS = {
  papel: '--p-paper:#fbfbfa;--p-face:#ffffff;--p-top:#ffffff;--p-s0:#d9d9d6;--p-s1:#e3e3e0;--p-s2:#ececea;--p-s3:#f3f3f1;--p-lit-top:#ffffff;--p-lit-shade:#f4e4e4;--p-hi:#26262a;--p-mid:#7d7d82;--p-lo:#b0b0b4;--p-faint:#d6d6d8;--p-lit:#dc2626;--p-dot:#3a3a3e;--p-weight:1px',
  oscuro: '--p-paper:#0a0b0d;--p-face:#15181c;--p-top:#1a1d22;--p-s0:#0a0b0d;--p-s1:#0e1013;--p-s2:#121418;--p-s3:#171a1f;--p-lit-top:#2a1416;--p-lit-shade:#1d1012;--p-hi:#e6e8eb;--p-mid:#a0a6ad;--p-lo:#5c636b;--p-faint:#2f343a;--p-lit:#dc2626;--p-dot:#e6e8eb;--p-weight:1px',
};

/** El banco como archivo SVG independiente (para <img>): lleva su CSS y sus colores adentro. */
export function bancoArchivo(items, { theme = 'oscuro', ...opts } = {}) {
  const svg = bancoSvg(items, opts);
  if (!svg) return '';
  return svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('">', `"><style>svg{${TOKENS[theme] || TOKENS.papel}}${CSS.replace(/\n/g, '')}</style>`) + '\n';
}
