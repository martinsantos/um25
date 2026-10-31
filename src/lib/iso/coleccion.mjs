/**
 * La colección (2026-10-31): las partes de un servicio, de un sector o de un proyecto como un
 * esquema de sistema, no como un estante de iconos. Misma escala en todas las páginas, una base
 * fina, tres filas por rol (el núcleo atrás, la distribución en medio, los terminales adelante)
 * y recorridos sobre la base que unen cada terminal con su distribución y ésta con el núcleo.
 * Una sola pieza encendida: el núcleo. Cada pieza y cada recorrido llevan el código de su
 * servicio, para que una lista al lado pueda encender uno y atenuar el resto.
 *
 * coleccionSvg([{ key: 'rack', code: '101' }, { key: 'ap', code: '101', qty: 12 }]) → <svg …>
 */
import * as k from './anatomy/iso-kit.mjs';
import { PARTES, NOMBRES, CAM, renombrar } from './partes.mjs';

const ROL = {
  rack: 0, servidor: 0, central: 0, 'central-ip': 0, nvr: 0, tablero: 0, generador: 0, pantalla: 0,
  switch: 1, patch: 1, fibra: 1, cableado: 1, canalizacion: 1, antena: 1, ups: 1, bateria: 1, modulo: 1, disco: 1, plano: 1, maletin: 1, tierra: 1,
  ap: 2, camara: 2, acceso: 2, alarma: 2, telefono: 2, parlante: 2, puesto: 2, detector: 2, pulsador: 2, sirena: 2,
};
const GAP = 8;            // entre piezas de una fila
const ENTRE_FILAS = 10;   // entre filas, además de la profundidad de la fila
const MARGEN = 8;         // de la pieza al borde de la base
const ALTO_BASE = 2.2;
const MAX_COPIAS = 3;     // un terminal con cantidad se repite hasta tres veces
const MAX_PIEZAS = 12;
const ESCALA = 5.2;       // la misma del banco: un detector mide lo mismo en cualquier página
const PX_POR_UNIDAD = .8; // píxeles de pantalla por unidad de la caja, a lo ancho: fija el tamaño máximo en pantalla

const bbox = (pts) => ({ x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])), z1: Math.max(...pts.map((p) => p[2])) });

function instancias(items) {
  const base = items.filter((it) => PARTES[it.key]).map((it) => { const b = bbox(PARTES[it.key]().ext.points); return { key: it.key, code: it.code || '', rol: ROL[it.key] ?? 1, b, w: b.x1 - b.x0, d: b.y1 - b.y0, h: b.z1, qty: it.qty || 1 }; });
  // Primero una instancia de cada parte, de todos los roles; después, mientras haya lugar, las copias de los terminales con cantidad.
  const out = base.slice(0, MAX_PIEZAS).map((i) => ({ ...i }));
  for (let ronda = 1; ronda < MAX_COPIAS && out.length < MAX_PIEZAS; ronda++) {
    for (const i of base) { if (i.rol === 2 && i.qty > ronda && out.length < MAX_PIEZAS) out.push({ ...i }); }
  }
  return out;
}

/** Tres filas por rol; dentro de cada fila, de mayor a menor altura hacia el centro. */
const POR_FILA = 5;       // más que esto, el rol se parte en dos filas
function disponer(list) {
  const filas = [];
  for (const r of [0, 1, 2]) {
    const f = [...list.filter((i) => i.rol === r)].sort((a, b) => b.h - a.h);
    if (!f.length) continue;
    const n = Math.ceil(f.length / POR_FILA), por = Math.ceil(f.length / n);
    for (let g = 0; g < n; g++) filas.push(f.slice(g * por, (g + 1) * por));
  }
  const anchos = filas.map((f) => f.reduce((s, i) => s + i.w + GAP, -GAP));
  const total = Math.max(...anchos);
  const placed = [];
  let y = 0;
  filas.forEach((f, idx) => {
    // El más alto al centro de su fila, los demás a los lados.
    const centro = []; f.forEach((i, n) => (n % 2 ? centro.push(i) : centro.unshift(i)));
    const prof = Math.max(...centro.map((i) => i.d));
    let x = -anchos[idx] / 2;
    for (const i of centro) {
      const cx = x + i.w / 2, cy = y + prof / 2;
      placed.push({ ...i, cx, cy, ox: cx - (i.b.x0 + i.b.x1) / 2, oy: cy - (i.b.y0 + i.b.y1) / 2, fila: idx });
      x += i.w + GAP;
    }
    y += prof + ENTRE_FILAS;
  });
  const plan = { x: -total / 2 - MARGEN, y: -MARGEN, w: total + MARGEN * 2, d: y - ENTRE_FILAS + MARGEN * 2, r: 2.5 };
  return { placed, plan };
}

/** Recorridos: cada pieza se une a la más cercana de la fila anterior, bajando en y y cruzando en x. */
function recorridos(placed) {
  const out = [];
  const filas = Math.max(...placed.map((p) => p.fila)) + 1;
  for (let f = 1; f < filas; f++) {
    const arriba = placed.filter((p) => p.fila === f - 1);
    for (const p of placed.filter((q) => q.fila === f)) {
      const dest = arriba.reduce((m, a) => (Math.abs(a.cx - p.cx) < Math.abs(m.cx - p.cx) ? a : m), arriba[0]);
      const ym = (p.cy - p.d / 2 + dest.cy + dest.d / 2) / 2;
      out.push({ code: p.code, pts: [[p.cx, p.cy, 0], [p.cx, ym, 0], [dest.cx, ym, 0], [dest.cx, dest.cy, 0]] });
    }
  }
  return out;
}

const apagar = (svg) => svg.replace(/ data-lit=""/g, '').replace(/data-tone="lit"/g, 'data-tone="hi"');

export function coleccionSvg(items, { width = 1200, escala = ESCALA, label = '' } = {}) {
  const list = instancias(items);
  if (!list.length) return '';
  const { placed, plan } = disponer(list);
  // Extremos reales: la base y las cuatro aristas superiores de cada pieza, para que ninguna quede cortada.
  const puntos = [...k.boxCorners(plan, 0, ALTO_BASE), ...placed.flatMap((i) => k.boxCorners({ x: i.cx - i.w / 2, y: i.cy - i.d / 2, w: i.w, d: i.d }, ALTO_BASE, ALTO_BASE + i.h))];
  const P = k.fitProjection(puntos, width, width, { pad: 20, ...CAM });
  const scale = Math.min(escala, P.scale);
  const unit = { origin: [0, 0], scale, azimuth: P.azimuth, elevation: P.elevation };
  const flat0 = puntos.map((p) => k.iso(p, unit));
  const xs0 = flat0.map(([x]) => x), ys0 = flat0.map(([, y]) => y);
  P.scale = scale;
  P.origin = [width / 2 - (Math.min(...xs0) + Math.max(...xs0)) / 2, -Math.min(...ys0) + 16];
  const S = (paths, style = {}) => k.solidSvg(paths, { crease: 'faint', ...style });
  const L = (d, style = {}) => k.lineSvg(d, style);
  const z1 = ALTO_BASE;
  const out = [];
  out.push(S(k.slabOf(plan, 0, ALTO_BASE, P, 6, 0.6), { tone: 'lo' }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3.5), z1, P, 6), { tone: 'faint' }));
  // Recorridos sobre la base, antes de las piezas: pasan por debajo de ellas.
  for (const r of recorridos(placed)) {
    const d = k.pathOf(r.pts.map(([x, y]) => k.iso([x, y, z1 + 0.05], P)));
    out.push(`<g class="co-ruta" data-code="${r.code}">${L(d, { tone: 'lit' })}</g>`);
  }
  // Piezas, de atrás hacia adelante; sólo el núcleo (o la mayor, si no hay núcleo) conserva su acento.
  const orden = [...placed].sort((a, b) => k.depthOf([a.cx, a.cy, 0], P) - k.depthOf([b.cx, b.cy, 0], P));
  const nucleo = placed.find((i) => i.rol === 0) || [...placed].sort((a, b) => b.h - a.h)[0];
  const o = k.iso([0, 0, 0], P);
  for (const i of orden) {
    const t = k.iso([i.ox, i.oy, z1], P);
    const svg = PARTES[i.key](P).svg;
    out.push(`<g class="co-pieza" data-code="${i.code}" data-key="${i.key}" transform="translate(${(t[0] - o[0]).toFixed(1)} ${(t[1] - o[1]).toFixed(1)})">${i === nucleo ? svg : apagar(svg)}</g>`);
  }
  const nombre = label || items.map((it) => (it.qty ? `${it.qty} × ` : '') + (NOMBRES[it.key] || it.key)).join(', ');
  // La caja se ciñe a lo dibujado y el ancho máximo en pantalla sale de la misma escala para
  // todas las páginas: una colección de dos piezas se ve chica, una de doce ocupa la columna.
  const flat = puntos.map((p) => k.iso(p, P));
  const x0 = Math.min(...flat.map(([x]) => x)) - 10, x1 = Math.max(...flat.map(([x]) => x)) + 10;
  const y0 = Math.min(...flat.map(([, y]) => y)) - 14, y1 = Math.max(...flat.map(([, y]) => y)) + 8;
  const maxW = Math.round((x1 - x0) * PX_POR_UNIDAD);
  return `<svg class="coleccion pt-svg" viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${(x1 - x0).toFixed(1)} ${(y1 - y0).toFixed(1)}" style="max-width:${maxW}px" role="img" aria-label="${nombre.replace(/"/g, '&quot;')}">${renombrar(out.join(''))}</svg>`;
}
