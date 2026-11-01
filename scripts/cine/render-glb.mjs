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
 * Uso: node scripts/cine/render-glb.mjs public/3d/models/facade.glb public/cine/iso/site-building-v3.svg [--res 2.5] [--angle 32] [--solido]
 *
 * Objetos (un equipo o un recinto, solos): --objeto dibuja todo como estructura, sin rutas ni pines;
 * --bbox x0,y0,x1,y1 y --zmin/--zmax recortan el modelo a una caja del mundo (un puesto, una sala, un
 * piso); --nombre "puesto de trabajo" da el nombre accesible. Así salen los equipos de los servicios
 * que no son un aparato (software, soporte, consultoría) de los mismos modelos reales:
 *   hospital-workstations.glb service-104.svg         --objeto --bbox -0.7,1.9,0.5,3.5 --solido --autonomo --ancho 720 --min 1.5 --nombre "puesto de trabajo"
 *   hospital-workstations.glb service-104-detalle.svg --objeto --bbox -0.5,2.85,0.45,3.5 --zmin 0.75 --solido --autonomo --ancho 720 --min 1.5 --nombre "pantalla del puesto de trabajo"
 *   hospital-walkthrough.glb  service-105.svg         --objeto --bbox 15,-0.5,19.6,2.8 --zmin -0.6 --zmax 3.7 --yaw 180 --skip Architecture,Power --solido --autonomo --ancho 720 --min 1.5 --nombre "sala de servidores"
 *   hospital-walkthrough.glb  service-105-detalle.svg --objeto --bbox 16.65,1.2,17.45,2.1 --zmin -0.6 --zmax 3.7 --yaw 180 --skip Architecture,Power --solido --autonomo --ancho 720 --min 1.5 --nombre "rack de la sala de servidores"
 *   facade.glb site-building-v3-corte.svg  --az 35 --el 18 --yaw 90 --zmax 7.2 --solido --nombre "las dos primeras plantas del edificio"
 *   facade.glb site-building-v3-planta.svg --az 35 --el 18 --yaw 90 --zmin -0.3 --zmax 3.6 --solido --nombre "la planta baja del edificio"
 *   facade.glb service-106.svg (consultoría: la planta baja con todos sus sistemas, autónoma para el índice y los pósters)
 *              --az 35 --el 18 --yaw 90 --zmin -0.3 --zmax 3.6 --solido --autonomo --nombre "la planta baja del edificio"
 * --vista x,y,ancho,alto (fracciones del dibujo) recorta el viewBox a un detalle del mismo dibujo (el raster
 *   de sólidos no gana resolución: para un detalle nítido conviene recortar el modelo con --bbox).
 * --autonomo: el SVG se basta solo (color y grosor de cada trazo como atributos, hoja de estilo y sólidos
 *   incrustados) para ir en un <img> o rasterizarse con librsvg, como los equipos de los servicios en el
 *   índice y en los pósters. Los dibujos de sitio, que van en línea en la página y comparten hoja, no lo
 *   necesitan.
 *
 * Los tres sitios v3 se generan con:
 *   facade.glb            site-building-v3.svg  --az 35 --el 18 --yaw 90 --solido
 *   airport-connected.glb site-terminal-v3.svg  --solido
 *   winery-connected.glb  site-winery-v3.svg    --yaw 90 --solido
 * --solido escribe además site-<sitio>-v3-solido.webp (el z-buffer sombreado) y lo enlaza bajo las líneas.
 */
import { writeFileSync } from 'node:fs';
import { leerGlb } from './glb.mjs';

const args = process.argv.slice(2);
const CON_VALOR = new Set(['--res', '--angle', '--yaw', '--az', '--el', '--zmax', '--zmin', '--bbox', '--skip', '--nombre', '--vista', '--ancho', '--min']);
const opt = (name, def) => { const i = args.indexOf(name); return i > 0 ? Number(args[i + 1]) : def; };
const optTexto = (name, def) => { const i = args.indexOf(name); return i > 0 ? args[i + 1] : def; };
const [entrada, salida] = args.filter((a, i) => !a.startsWith('--') && !CON_VALOR.has(args[i - 1]));
const RES = opt('--res', 2.5);          // píxeles del z-buffer por unidad del viewBox
const ANGULO = opt('--angle', 40);      // umbral de pliegue, en grados
const YAW = (opt('--yaw', 0) * Math.PI) / 180;   // giro del modelo sobre z, para elegir qué frente mira al espectador
const TRANSPARENTES = new Set(['glass']);          // materiales que no tapan (sí se dibujan sus aristas)
const skipIdx = args.indexOf('--skip');
const OMITIR = new Set(skipIdx > 0 ? args[skipIdx + 1].split(',') : []);   // materiales o sistemas que no se dibujan (corte)
const W = opt('--ancho', 1200), H = Math.round(W * 0.6), PAD = Math.round(W / 43); // --ancho: el lienzo; los objetos solos (equipos, salas) salen bien a 720 y pesan un tercio
const AZ = (opt('--az', 42) * Math.PI) / 180, EL = (opt('--el', 30) * Math.PI) / 180;
const ZMAX = opt('--zmax', Infinity);   // corte horizontal: lo que queda por encima no se dibuja ni tapa
const ZMIN = opt('--zmin', -Infinity);  // y por debajo
const BBOX = optTexto('--bbox', '').split(',').map(Number); // recorte en planta: x0,y0,x1,y1 del mundo
const OBJETO = args.includes('--objeto'); // un objeto solo: todo es estructura, sin rutas ni pines
const MIN_TRAMO = opt('--min', 0.35);     // aristas más cortas que esto (px del lienzo) no se dibujan; los equipos con muchas ranuras salen limpios y livianos con 1.5
const AUTONOMO = args.includes('--autonomo'); // el SVG vale como imagen suelta (<img>): lleva su hoja de estilo y los sólidos incrustados
const NOMBRE = optTexto('--nombre', '');
const VISTA = optTexto('--vista', '').split(',').map(Number); // detalle: el viewBox se recorta a esa fracción del dibujo (x,y,ancho,alto en 0..1)
const SOLIDO = args.includes('--solido'); // capa de sólidos: el z-buffer sombreado por normal, como imagen bajo las líneas (los volúmenes ocluyen y se leen)

/** Servicios del sitio por sistema del modelo. */
const SERVICIO = OBJETO ? {} : { Data: '101', Fiber: '101', WiFi: '101', CCTV: '102', Security: '102', Telecom: '103', Intercom: '103', Software: '104', 'Fire-detection': '107', Power: '108' };
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
if (ZMAX !== Infinity || ZMIN !== -Infinity || BBOX.length === 4) for (const m of nodos) {
  // Se descartan los triángulos con algún vértice fuera de la caja (corte horizontal o recorte en planta).
  const [bx0, by0, bx1, by1] = BBOX.length === 4 ? BBOX : [-Infinity, -Infinity, Infinity, Infinity];
  const dentro = (i) => { const x = m.positions[i * 3], y = m.positions[i * 3 + 1], z = m.positions[i * 3 + 2]; return z <= ZMAX && z >= ZMIN && x >= bx0 && x <= bx1 && y >= by0 && y <= by1; };
  const I = m.indices, keep = [];
  for (let t = 0; t < I.length; t += 3) if (dentro(I[t]) && dentro(I[t + 1]) && dentro(I[t + 2])) keep.push(I[t], I[t + 1], I[t + 2]);
  m.indices = Uint32Array.from(keep);
}
for (const m of [...nodos]) if (m.indices.length === 0) nodos.splice(nodos.indexOf(m), 1);
if (YAW) for (const m of nodos) { const P = m.positions, c = Math.cos(YAW), sn = Math.sin(YAW); for (let i = 0; i < P.length; i += 3) { const x = P[i], y = P[i + 1]; P[i] = x * c - y * sn; P[i + 1] = x * sn + y * c; } }
// Encuadre.
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
// Sólo los vértices que quedan en uso: con un recorte (--bbox, --zmin, --zmax) el objeto llena el cuadro y el raster de sólidos sale nítido.
for (const m of nodos) for (let t = 0; t < m.indices.length; t++) { const i = m.indices[t] * 3; const [sx, sy] = proyectar(m.positions[i], m.positions[i + 1], m.positions[i + 2]); if (sx < minX) minX = sx; if (sx > maxX) maxX = sx; if (sy < minY) minY = sy; if (sy > maxY) maxY = sy; }
const escala = Math.min((W - 2 * PAD) / (maxX - minX), (H - 2 * PAD) / (maxY - minY));
const ox = W / 2 - ((minX + maxX) / 2) * escala, oy = H / 2 - ((minY + maxY) / 2) * escala;
const aPantalla = (x, y, z) => { const [sx, sy, d] = proyectar(x, y, z); return [ox + sx * escala, oy + sy * escala, d]; };

// ——— Triángulos proyectados y z-buffer.
const BW = Math.ceil(W * RES), BH = Math.ceil(H * RES);
const zbuf = new Float32Array(BW * BH).fill(-Infinity);
const idbuf = new Int32Array(BW * BH).fill(-1);
const zserv = new Float32Array(BW * BH).fill(-Infinity);
const idserv = new Int32Array(BW * BH).fill(-1);
const tris = [];   // { n: nodo, a,b,c: índices, p: [[x,y,d]×3], frente: bool, nrm }
let id = 0;
for (const m of nodos) {
  const P = m.positions, I = m.indices;
  const esServicio = Boolean(SERVICIO[m.system]);
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
          if (esServicio && d > zserv[k]) { zserv[k] = d; idserv[k] = id; }
        }
      }
    }
    id++;
  }
}
console.error(`triángulos ${tris.length}, z-buffer ${BW}×${BH}`);

// ——— Sólidos: cada píxel del z-buffer toma el tono de la cara que lo cubre (cenital, iluminada o en sombra),
// sobre la paleta oscura del sistema, con las caras lejanas apenas más apagadas. Va como imagen bajo las líneas.
let solidoHref = '', solidoRgba = null;
if (SOLIDO) {
  const luz = [-0.45, -0.35, 0.82]; const ll = Math.hypot(...luz); luz[0] /= ll; luz[1] /= ll; luz[2] /= ll;
  const TONOS = { top: [0x26, 0x2b, 0x31], lit: [0x1c, 0x20, 0x25], face: [0x15, 0x17, 0x1b], shade: [0x0f, 0x11, 0x14] };
  let lo = Infinity, hi = -Infinity; for (const v of zbuf) if (v !== -Infinity) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const rgba = Buffer.alloc(BW * BH * 4);
  for (let k = 0; k < zbuf.length; k++) {
    const t = idbuf[k] >= 0 ? tris[idbuf[k]] : null; if (!t) continue;
    const n = t.nrm; const lam = n[0] * luz[0] + n[1] * luz[1] + n[2] * luz[2];
    const tono = Math.abs(n[2]) > 0.8 ? TONOS.top : lam > 0.45 ? TONOS.lit : lam > 0.05 ? TONOS.face : TONOS.shade;
    const prof = (zbuf[k] - lo) / (hi - lo || 1);         // 0 lejos … 1 cerca
    const a = Math.round(255 * (0.82 + 0.18 * prof));     // lo lejano, apenas más apagado
    const o = k * 4; rgba[o] = tono[0]; rgba[o + 1] = tono[1]; rgba[o + 2] = tono[2]; rgba[o + 3] = a;
  }
  solidoRgba = rgba;
}
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
const visEn = (zb, ib) => (x, y, d, tA, tB) => {
  if (process.env.NOHLR) return true;
  const px = Math.floor(x * RES), py = Math.floor(y * RES);
  if (px < 0 || py < 0 || px >= BW || py >= BH) return false;
  const k = py * BW + px;
  if (ib[k] === tA || ib[k] === tB) return true;
  return d >= zb[k] - 0.06;   // tolerancia en unidades de profundidad del mundo
};
const vis = visEn(zbuf, idbuf), visServ = visEn(zserv, idserv);
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
    if (len < MIN_TRAMO) continue;
    const segAntes = seg.length;
    const n = Math.max(2, Math.ceil(len * RES * 0.8));
    const recorrer = (test, dest) => {
      let run = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, d = d0 + (d1 - d0) * t;
        const v = test(x, y, d, ts[0], ts[1] ?? -1); muestras++; if (v) visibles++;
        if (v && !run) run = [x, y];
        if ((!v || i === n) && run) { const ex = v ? x : x0 + (x1 - x0) * ((i - 1) / n), ey = v ? y : y0 + (y1 - y0) * ((i - 1) / n); if (Math.hypot(ex - run[0], ey - run[1]) >= 1.2) dest.push([run[0], run[1], ex, ey]); run = null; }
      }
    };
    recorrer(vis, seg);
    // ¿Es contorno? A ambos lados de la arista, en pantalla, ¿hay fondo o algo bastante más lejos?
    if (seg.length > segAntes) {
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, md = (d0 + d1) / 2;
      const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
      let contorno = false;
      for (const sgn of [1, -1]) {
        const px = Math.floor((mx + nx * sgn * 1.6) * RES), py = Math.floor((my + ny * sgn * 1.6) * RES);
        if (px < 0 || py < 0 || px >= BW || py >= BH) { contorno = true; break; }
        const zb = zbuf[py * BW + px];
        if (zb === -Infinity || zb < md - 0.9) { contorno = true; break; }
      }
      if (contorno) for (let i = segAntes; i < seg.length; i++) seg[i].c = true;
    }
    for (let i = segAntes; i < seg.length; i++) seg[i].d = (d0 + d1) / 2;
    if (SERVICIO[m.system]) recorrer(visServ, enteras.get(m.system) || enteras.set(m.system, []).get(m.system));
  }
  const sys = m.system;
  if (process.env.DEBUG) console.error(m.name, 'aristas', aristas.size, 'candidatas', cand, 'muestras', muestras, 'visibles', visibles, 'tramos', seg.length);
  const lst = lineas.get(sys) || lineas.set(sys, []).get(sys); for (const sg of seg) lst.push(sg);
}

// ——— Enlace de tramos consecutivos en polilíneas y salida.
const f1 = (v) => (Math.round(v * 2) / 2).toString();
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
// Estructura por sistema y por jerarquía: contornos en tono alto y trazo más grueso; detalle en tono medio; mobiliario en tono bajo.
// Profundidad: lo que queda atrás se atenúa (tres bandas), para que el frente se lea primero.
const todosD = [...lineas].filter(([sys]) => !SERVICIO[sys]).flatMap(([, segs]) => segs.map((g) => g.d)).sort((a, b) => a - b);
const dLejos = todosD[Math.floor(todosD.length * 0.33)] ?? 0, dMedio = todosD[Math.floor(todosD.length * 0.66)] ?? 0;
const banda = (g) => (g.d < dLejos ? 'lejos' : g.d < dMedio ? 'medio' : 'cerca');
// Autónomo: color y grosor como atributos (la paleta de la propuesta), porque librsvg (pósters) y <img> no resuelven variables CSS.
const PALETA = { hi: '#e6e8eb', mid: '#a0a6ad', lo: '#5c636b', faint: '#3a4048' };
const atributos = (tono, banda, contorno) => (AUTONOMO ? ` stroke="${PALETA[tono] || PALETA.lo}" stroke-width="${contorno ? 1.8 : banda === 'lejos' ? 0.8 : 1.1}" vector-effect="non-scaling-stroke"` : '');
const porSistema = [...lineas].filter(([sys]) => !SERVICIO[sys]).map(([sys, segs]) => {
  const mueble = sys === 'Furniture-context';
  const out = [];
  for (const b of ['lejos', 'medio', 'cerca']) {
    const en = segs.filter((g) => banda(g) === b);
    const cont = en.filter((g) => g.c), det = en.filter((g) => !g.c);
    const tono = { lejos: ['lo', 'faint'], medio: ['mid', 'lo'], cerca: ['hi', 'mid'] }[b];
    if (cont.length) out.push(`<path class="pt-line pt-contorno" data-tone="${mueble ? tono[1] : tono[0]}" data-system="${sys}" data-banda="${b}"${atributos(mueble ? tono[1] : tono[0], b, true)} d="${polilineas(cont)}"/>`);
    if (det.length && !mueble) out.push(`<path class="pt-line" data-tone="${tono[1]}" data-system="${sys}" data-banda="${b}"${atributos(tono[1], b, false)} d="${polilineas(det)}"/>`);
  }
  return out.join('');
}).join('');
grupos.push(`<g class="sp-structure" fill="none" stroke-linecap="round" stroke-linejoin="round"${AUTONOMO ? ' stroke="#5c636b"' : ''}>${porSistema}</g>`);
const pines = [];
for (const [code, segs] of Object.entries(rutas)) {
  const d = polilineas(segs);
  grupos.push(`<g class="sp-route sp-route--${code}" data-project-route="${code}" fill="none" stroke="#dc2626" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" pathLength="100"/></g>`);
  // El pin, sobre el equipo visible más alto del sistema (o el centro de la ruta si nada se ve desde fuera).
  const vistos = equipos[code] || [];
  let mx = 0, my = 0; const base = vistos.length ? vistos : segs; for (const s of base) { mx += s[0] + s[2]; my += s[1] + s[3]; }
  const n = base.length * 2; pines.push({ code, cx: mx / n, cy: my / n, d: polilineas(vistos) });
}
// Equipos a la vista desde fuera (cámaras, antenas, balizas): en gris, se encienden con su servicio.
const dispositivos = pines.filter((p) => p.d).map((p) => `<g data-project-device="${p.code}"><path class="pt-line" data-tone="hi" d="${p.d}"/></g>`).join('');
const pinesSvg = pines.map((p) => `<g class="sp-pin sp-pin--${p.code}" data-project-pin="${p.code}" data-x="${f1(p.cx)}" data-y="${f1(p.cy)}"><circle cx="${f1(p.cx)}" cy="${f1(p.cy)}" r="5.2" fill="#dc2626"/><circle cx="${f1(p.cx)}" cy="${f1(p.cy)}" r="9" fill="none" stroke="#a2a8af" stroke-opacity=".55" stroke-width=".65"/></g>`).join('');
const focus = pines.map((p) => `<g data-project-focus="${p.code}" data-x="${f1(p.cx - 30)}" data-y="${f1(p.cy - 30)}" data-width="60" data-height="60"/>`).join('');
const NOMBRES_SITIO = { facade: 'edificio', 'airport-connected': 'aeropuerto', 'winery-connected': 'bodega', 'hospital-services': 'centro de salud' };
const modelo = entrada.split('/').pop().replace(/\.glb$/, '');
const nombre = NOMBRE || NOMBRES_SITIO[modelo] || modelo;
let vx0 = Infinity, vy0 = Infinity, vx1 = -Infinity, vy1 = -Infinity;
for (const segs of lineas.values()) for (const g of segs) { vx0 = Math.min(vx0, g[0], g[2]); vx1 = Math.max(vx1, g[0], g[2]); vy0 = Math.min(vy0, g[1], g[3]); vy1 = Math.max(vy1, g[1], g[3]); }
const aire = Math.max(vx1 - vx0, vy1 - vy0) * 0.02;
let VB = `${f1(vx0 - aire)} ${f1(vy0 - aire)} ${f1(vx1 - vx0 + 2 * aire)} ${f1(vy1 - vy0 + 2 * aire)}`;
// Sólidos: el raster se recorta al encuadre del dibujo (no al lienzo entero), así el <image> coincide con el viewBox,
// no desborda el SVG (un raster transparente que sobresale intercepta el puntero) y pesa lo justo.
let solidoRect = '';
if (solidoRgba) {
  const sharp = (await import('sharp')).default;
  const rx = Math.max(0, vx0 - aire), ry = Math.max(0, vy0 - aire), rw = Math.min(W, vx1 + aire) - rx, rh = Math.min(H, vy1 + aire) - ry;
  const left = Math.floor(rx * RES), top = Math.floor(ry * RES), width = Math.min(BW - left, Math.ceil(rw * RES)), height = Math.min(BH - top, Math.ceil(rh * RES));
  const archivo = salida.replace(/\.svg$/, '-solido.webp');
  await sharp(solidoRgba, { raw: { width: BW, height: BH, channels: 4 } }).extract({ left, top, width, height }).resize({ width: Math.round(rw * 1.25) }).webp({ quality: 78, alphaQuality: 85 }).toFile(archivo);
  solidoRect = `x="${f1(left / RES)}" y="${f1(top / RES)}" width="${f1(width / RES)}" height="${f1(height / RES)}"`;
  // Ruta absoluta: el SVG se incrusta en línea en la página, y una ruta relativa resolvería contra la página, no contra el archivo.
  solidoHref = archivo.includes('/public/') || archivo.startsWith('public/') ? '/' + archivo.replace(/^.*?public\//, '') : archivo.split('/').pop();
  // Autónomo: incrustado, porque un SVG cargado como imagen no puede traer archivos externos.
  if (AUTONOMO) { const fs = await import('node:fs'); solidoHref = `data:image/webp;base64,${fs.readFileSync(archivo).toString('base64')}`; fs.unlinkSync(archivo); }
  console.error(`sólidos: ${archivo} (${width}×${height} px del z-buffer)`);
}
if (VISTA.length === 4) { const ancho = vx1 - vx0 + 2 * aire, alto = vy1 - vy0 + 2 * aire; VB = `${f1(vx0 - aire + ancho * VISTA[0])} ${f1(vy0 - aire + alto * VISTA[1])} ${f1(ancho * VISTA[2])} ${f1(alto * VISTA[3])}`; }
// La misma paleta y los mismos trazos que la hoja de la propuesta (.sp-scene.pt-svg), para cuando el dibujo va solo.
const ESTILO = AUTONOMO ? `<style>.sp-scene{--p-hi:#e6e8eb;--p-mid:#a0a6ad;--p-lo:#5c636b;--p-faint:#3a4048;--p-weight:1.1px}.pt-line{fill:none;stroke:var(--p-lo);stroke-width:var(--p-weight);stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.pt-line[data-tone=hi]{stroke:var(--p-hi)}.pt-line[data-tone=mid]{stroke:var(--p-mid)}.pt-line[data-tone=faint]{stroke:var(--p-faint)}.pt-contorno{stroke-width:1.8px}.pt-line[data-banda=lejos]{stroke-width:.8px}.sp-route path{stroke-width:1.5px;vector-effect:non-scaling-stroke}.sp-pin,.sp-leader,.sp-effect,.sp-floor-label{display:none}</style>` : '';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" preserveAspectRatio="xMidYMid meet" class="sp-scene pt-svg" data-fit="1" role="img" aria-label="${OBJETO ? `Isometría de ${nombre}` : `Isometría de ${nombre}, con sus sistemas`}">${ESTILO}<g class="sp-root">${solidoHref ? `<image class="sp-solido" href="${solidoHref}" ${solidoRect} preserveAspectRatio="none" pointer-events="none"/>` : ''}${grupos[0]}${dispositivos}${grupos.slice(1).join('')}${focus}${pinesSvg}</g></svg>\n`;
writeFileSync(salida, svg);
console.error(`${salida}: ${svg.length} bytes`);
