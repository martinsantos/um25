#!/usr/bin/env node
/**
 * Isometría vectorial con líneas ocultas a partir de un .glb (los modelos de public/3d/models).
 *
 * 1. Proyecta todos los triángulos con la cámara del sistema (azimut 42°, elevación 30°).
 * 2. Rasteriza un z-buffer de alta resolución (id de triángulo + profundidad).
 * 3. Toma las aristas que valen la pena dibujar: pliegues (ángulo diedro > umbral), bordes de
 *    malla y siluetas (una cara mira al espectador y la otra no).
 * 4. Muestrea cada arista y conserva sólo los tramos que el z-buffer deja ver.
 * 5. Escribe un SVG con un grupo por sistema, con los ganchos del sistema de despiece:
 *    .sp-structure (arquitectura y mobiliario) y .sp-route.sp-route--<código> para los
 *    sistemas que son servicios; pines por sistema; cajas de foco.
 *
 * Uso: node scripts/cine/render-glb.mjs public/3d/models/facade.glb public/cine/iso/site-building-v3.svg [--res 2.5] [--angle 32]
 */
import { writeFileSync } from 'node:fs';
import { leerGlb } from './glb.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i > 0 ? Number(args[i + 1]) : def; };
const [entrada, salida] = args.filter((a) => !a.startsWith('--') && !/^[\d.]+$/.test(a));
const RES = opt('--res', 2.5);          // píxeles del z-buffer por unidad del viewBox
const ANGULO = opt('--angle', 32);      // umbral de pliegue, en grados
const YAW = (opt('--yaw', 0) * Math.PI) / 180;   // giro del modelo sobre z, para elegir qué frente mira al espectador
const TRANSPARENTES = new Set(['glass']);          // materiales que no tapan (sí se dibujan sus aristas)
const skipIdx = args.indexOf('--skip');
const OMITIR = new Set(skipIdx > 0 ? args[skipIdx + 1].split(',') : []);   // materiales o sistemas que no se dibujan (corte)
const W = 1200, H = 720, PAD = 28;
const AZ = (42 * Math.PI) / 180, EL = (30 * Math.PI) / 180;

/** Servicios del sitio por sistema del modelo. */
const SERVICIO = { Data: '101', Fiber: '101', WiFi: '101', CCTV: '102', Security: '102', Telecom: '103', Intercom: '103', Software: '104', 'Fire-detection': '107', Power: '108' };
const ESTRUCTURA = new Set(['Architecture', 'Furniture-context', 'HVAC', 'Plumbing']);

// ——— Cámara: la del kit (iso-kit: x·cos(az) − y·sin(az) en pantalla, profundidad hacia el espectador).
const cosA = Math.cos(AZ), sinA = Math.sin(AZ), cosE = Math.cos(EL), sinE = Math.sin(EL);
const proyectar = (x, y, z) => {
  const sx = x * sinA - y * cosA;
  const sy = (x * cosA + y * sinA) * sinE - z * cosE;
  const d = (x * cosA + y * sinA) * cosE + z * sinE;   // mayor = más cerca (depthOf del kit)
  return [sx, sy, d];
};

const nodos = (await leerGlb(entrada)).filter((m) => !OMITIR.has(m.material) && !OMITIR.has(m.system));
if (YAW) for (const m of nodos) { const P = m.positions, c = Math.cos(YAW), sn = Math.sin(YAW); for (let i = 0; i < P.length; i += 3) { const x = P[i], y = P[i + 1]; P[i] = x * c - y * sn; P[i + 1] = x * sn + y * c; } }
// Encuadre.
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
for (const m of nodos) for (let i = 0; i < m.positions.length; i += 3) { const [sx, sy] = proyectar(m.positions[i], m.positions[i + 1], m.positions[i + 2]); if (sx < minX) minX = sx; if (sx > maxX) maxX = sx; if (sy < minY) minY = sy; if (sy > maxY) maxY = sy; }
const escala = Math.min((W - 2 * PAD) / (maxX - minX), (H - 2 * PAD) / (maxY - minY));
const ox = W / 2 - ((minX + maxX) / 2) * escala, oy = H / 2 - ((minY + maxY) / 2) * escala;
const aPantalla = (x, y, z) => { const [sx, sy, d] = proyectar(x, y, z); return [ox + sx * escala, oy + sy * escala, d]; };

// ——— Triángulos proyectados y z-buffer.
const BW = Math.ceil(W * RES), BH = Math.ceil(H * RES);
const zbuf = new Float32Array(BW * BH).fill(-Infinity);
const idbuf = new Int32Array(BW * BW > 0 ? BW * BH : 0).fill(-1);
const tris = [];   // { n: nodo, a,b,c: índices, p: [[x,y,d]×3], frente: bool, nrm }
let id = 0;
for (const m of nodos) {
  const P = m.positions, I = m.indices;
  m.proj = new Float32Array((P.length / 3) * 3);
  for (let i = 0; i < P.length; i += 3) { const [x, y, d] = aPantalla(P[i], P[i + 1], P[i + 2]); m.proj[i] = x; m.proj[i + 1] = y; m.proj[i + 2] = d; }
  m.triIds = new Int32Array(I.length / 3);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    const ax = m.proj[a * 3], ay = m.proj[a * 3 + 1], ad = m.proj[a * 3 + 2];
    const bx = m.proj[b * 3], by = m.proj[b * 3 + 1], bd = m.proj[b * 3 + 2];
    const cx = m.proj[c * 3], cy = m.proj[c * 3 + 1], cd = m.proj[c * 3 + 2];
    // Normal en el mundo, para pliegues y siluetas.
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    // Mira al espectador si su normal apunta hacia la cámara (dirección de "más cerca").
    const frente = (nx * cosA * cosE + ny * sinA * cosE + nz * sinE) > 0;
    tris.push({ m, a, b, c, nrm: [nx, ny, nz], frente });
    m.triIds[t / 3] = id;
    // Rasterizado del triángulo en el z-buffer.
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx) * RES)), x1 = Math.min(BW - 1, Math.ceil(Math.max(ax, bx, cx) * RES));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy) * RES)), y1 = Math.min(BH - 1, Math.ceil(Math.max(ay, by, cy) * RES));
    const det = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (!TRANSPARENTES.has(m.material) && Math.abs(det) > 1e-9 && x1 >= x0 && y1 >= y0) {
      for (let py = y0; py <= y1; py++) {
        const yy = (py + 0.5) / RES;
        for (let px = x0; px <= x1; px++) {
          const xx = (px + 0.5) / RES;
          const l1 = ((bx - xx) * (cy - yy) - (cx - xx) * (by - yy)) / det;
          const l2 = ((cx - xx) * (ay - yy) - (ax - xx) * (cy - yy)) / det;
          const l3 = 1 - l1 - l2;
          if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
          const d = l1 * ad + l2 * bd + l3 * cd;
          const k = py * BW + px;
          if (d > zbuf[k]) { zbuf[k] = d; idbuf[k] = id; }
        }
      }
    }
    id++;
  }
}
console.error(`triángulos ${tris.length}, z-buffer ${BW}×${BH}`);
if (process.env.ZBUF) {
  const sharp = (await import('sharp')).default;
  let lo = Infinity, hi = -Infinity; for (const v of zbuf) if (v !== -Infinity) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const img = Buffer.alloc(BW * BH); for (let i = 0; i < zbuf.length; i++) img[i] = zbuf[i] === -Infinity ? 0 : Math.round(30 + 225 * (zbuf[i] - lo) / (hi - lo));
  await sharp(img, { raw: { width: BW, height: BH, channels: 1 } }).png().toFile(process.env.ZBUF);
  console.error('z-buffer escrito', lo, hi);
}

// ——— Aristas a dibujar, por nodo.
const cosUmbral = Math.cos((ANGULO * Math.PI) / 180);
const lineas = new Map();   // sistema → [[x0,y0,x1,y1], …] (con líneas ocultas quitadas)
const enteras = new Map();  // sistema de servicio → todas sus aristas, sin ocultar (la ruta que el rayos X revela)
const vis = (x, y, d, tA, tB) => {
  if (process.env.NOHLR) return true;
  const px = Math.floor(x * RES), py = Math.floor(y * RES);
  if (px < 0 || py < 0 || px >= BW || py >= BH) return false;
  const k = py * BW + px;
  const buf = zbuf[k];
  if (idbuf[k] === tA || idbuf[k] === tB) return true;
  return d >= buf - 0.06;   // tolerancia en unidades de profundidad del mundo
};
for (const m of nodos) {
  const I = m.indices, pr = m.proj, P = m.positions;
  const aristas = new Map();  // clave "a_b" → [tri, tri]
  for (let t = 0; t < I.length; t += 3) {
    const tid = m.triIds[t / 3];
    for (let e = 0; e < 3; e++) {
      const a = I[t + e], b = I[t + ((e + 1) % 3)];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const l = aristas.get(key); if (l) l.push(tid); else aristas.set(key, [tid]);
    }
  }
  const seg = []; let cand = 0, muestras = 0, visibles = 0;
  for (const [key, ts] of aristas) {
    const [a, b] = key.split('_').map(Number);
    let dibujar = false;
    if (ts.length === 1) dibujar = true;                       // borde de malla
    else {
      const t1 = tris[ts[0]], t2 = tris[ts[1]];
      const dot = t1.nrm[0] * t2.nrm[0] + t1.nrm[1] * t2.nrm[1] + t1.nrm[2] * t2.nrm[2];
      if (dot < cosUmbral) dibujar = true;                     // pliegue
      else if (t1.frente !== t2.frente) dibujar = true;        // silueta
    }
    if (!dibujar) continue;
    cand++;
    // Muestreo de visibilidad a lo largo de la arista.
    const x0 = pr[a * 3], y0 = pr[a * 3 + 1], d0 = pr[a * 3 + 2], x1 = pr[b * 3], y1 = pr[b * 3 + 1], d1 = pr[b * 3 + 2];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 0.35) continue;
    if (SERVICIO[m.system]) (enteras.get(m.system) || enteras.set(m.system, []).get(m.system)).push([x0, y0, x1, y1]);
    const n = Math.max(2, Math.ceil(len * RES * 0.8));
    let run = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, d = d0 + (d1 - d0) * t;
      const v = vis(x, y, d, ts[0], ts[1] ?? -1); muestras++; if (v) visibles++;
      if (v && !run) run = [x, y];
      if ((!v || i === n) && run) { const ex = v ? x : x0 + (x1 - x0) * ((i - 1) / n), ey = v ? y : y0 + (y1 - y0) * ((i - 1) / n); if (Math.hypot(ex - run[0], ey - run[1]) >= 0.6) seg.push([run[0], run[1], ex, ey]); run = null; }
    }
  }
  const sys = m.system;
  if (process.env.DEBUG) console.error(m.name, 'aristas', aristas.size, 'candidatas', cand, 'muestras', muestras, 'visibles', visibles, 'tramos', seg.length);
  const lst = lineas.get(sys) || lineas.set(sys, []).get(sys); for (const sg of seg) lst.push(sg);
}

// ——— Enlace de tramos consecutivos en polilíneas y salida.
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const polilineas = (segs) => {
  // Encadena tramos cuyo final coincide con el inicio del siguiente (tolerancia 0,15 px).
  const porInicio = new Map();
  const clave = (x, y) => `${Math.round(x * 6)}_${Math.round(y * 6)}`;
  segs.forEach((s, i) => { const k = clave(s[0], s[1]); (porInicio.get(k) || porInicio.set(k, []).get(k)).push(i); });
  const usado = new Uint8Array(segs.length);
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    if (usado[i]) continue;
    usado[i] = 1;
    const pts = [[segs[i][0], segs[i][1]], [segs[i][2], segs[i][3]]];
    let fin = pts[1];
    for (;;) {
      const cand = (porInicio.get(clave(fin[0], fin[1])) || []).find((j) => !usado[j]);
      if (cand === undefined) break;
      usado[cand] = 1; fin = [segs[cand][2], segs[cand][3]]; pts.push(fin);
    }
    out.push(pts);
  }
  return out.map((pts) => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')).join('');
};

const grupos = [];
const rutas = {}, equipos = {};
let total = 0;
for (const [sys, segs] of lineas) {
  total += segs.length;
  const code = SERVICIO[sys];
  if (code) { const e = equipos[code] ||= []; for (const sg of segs) e.push(sg); }
}
for (const [sys, segs] of enteras) { const code = SERVICIO[sys]; const r = rutas[code] ||= []; for (const sg of segs) r.push(sg); }
console.error(`tramos visibles ${total}`);
const tonoDe = (sys) => (sys === 'Furniture-context' ? 'lo' : 'mid');
// Estructura por sistema, para poder atenuar el mobiliario.
const porSistema = [...lineas].filter(([sys]) => !SERVICIO[sys]).map(([sys, segs]) => `<path class="pt-line" data-tone="${tonoDe(sys)}" data-system="${sys}" d="${polilineas(segs)}"/>`).join('');
grupos.push(`<g class="sp-structure" fill="none" stroke-linecap="round" stroke-linejoin="round">${porSistema}</g>`);
const pines = [];
for (const [code, segs] of Object.entries(rutas)) {
  const d = polilineas(segs);
  grupos.push(`<g class="sp-route sp-route--${code}" data-project-route="${code}" fill="none" stroke="#dc2626" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" pathLength="100"/></g>`);
  // El pin, sobre el equipo visible más alto del sistema (o el centro de la ruta si nada se ve desde fuera).
  const vistos = equipos[code] || [];
  let mx = 0, my = 0; const base = vistos.length ? vistos : segs; for (const s of base) { mx += s[0] + s[2]; my += s[1] + s[3]; }
  const n = base.length * 2; pines.push({ code, cx: mx / n, cy: my / n, d: polilineas(vistos) });
}
// Equipos a la vista desde fuera (cámaras, antenas, balizas): en gris, se encienden con su servicio.
const dispositivos = pines.filter((p) => p.d).map((p) => `<g data-project-device="${p.code}"><path class="pt-line" data-tone="hi" d="${p.d}"/></g>`).join('');
const pinesSvg = pines.map((p) => `<g class="sp-pin sp-pin--${p.code}" data-project-pin="${p.code}" data-x="${f1(p.cx)}" data-y="${f1(p.cy)}"><circle cx="${f1(p.cx)}" cy="${f1(p.cy)}" r="5.2" fill="#dc2626"/><circle cx="${f1(p.cx)}" cy="${f1(p.cy)}" r="9" fill="none" stroke="#a2a8af" stroke-opacity=".55" stroke-width=".65"/></g>`).join('');
const focus = pines.map((p) => `<g data-project-focus="${p.code}" data-x="${f1(p.cx - 30)}" data-y="${f1(p.cy - 30)}" data-width="60" data-height="60"/>`).join('');
const nombre = entrada.split('/').pop().replace(/\.glb$/, '');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="sp-scene pt-svg" data-fit="1" role="img" aria-labelledby="sp-${nombre}-title sp-${nombre}-desc"><title id="sp-${nombre}-title">${nombre}</title><desc id="sp-${nombre}-desc">Isometría del modelo ${nombre}, con sus sistemas.</desc><g class="sp-root">${grupos[0]}${dispositivos}${grupos.slice(1).join('')}${focus}${pinesSvg}</g></svg>\n`;
writeFileSync(salida, svg);
console.error(`${salida}: ${svg.length} bytes`);
