/**
 * El sitio (2026-10-30, v4): un lugar dibujado como estructura completa, en línea, con el kit
 * de Anatomy y el mismo lenguaje que las partes y el banco. La densidad sale de la repetición
 * real de la obra: grilla de columnas, vigas de borde e interiores, viguetas por tramo, losas
 * en borde, carpintería de fachada con parantes y travesaños, núcleo de escalera, tabiques y
 * mobiliario por planta, cubierta con parapeto y equipos, y el contexto: vereda, calle, autos,
 * árboles, edificios vecinos con sus ventanas, cotas.
 *
 * Mantiene los ganchos que usan el CSS y el JS del sistema:
 *   .sp-scene > .sp-root > .sp-structure            la estructura y los equipos
 *   .sp-route.sp-route--<código> > path             el recorrido de cada servicio
 *   .sp-pin.sp-pin--<código> (data-x, data-y)       el punto de cada servicio
 *   [data-project-device="<código>"]                 los equipos que se encienden
 *   [data-project-focus="<código>"] (data-x…)        la caja en pantalla de cada equipo
 *   text.sp-floor-label                              el nombre de cada planta
 */
import * as k from './anatomy/iso-kit.mjs';
import { PARTES, CAM, renombrar } from './partes.mjs';

const W = 1200, H = 720;
const K = 0.6;                  // las partes del sprite, a 0,6 dentro del edificio
const PLANTA_H = 46;            // altura libre de cada planta
const LOSA = 2.4;               // espesor de losa
const VIGA = 5;                 // altura de viga bajo losa
const BAHIA = 30;               // módulo estructural

const SITIOS = {
  building: {
    titulo: 'Un edificio de oficinas por dentro, planta por planta',
    desc: 'Tres plantas en estructura vista: columnas, vigas, viguetas, losas, fachada, escalera y mobiliario; sala técnica en planta baja y equipos de cada servicio recorriendo el edificio.',
    bahias: [6, 5],             // módulos en x y en y
    plantas: ['Planta baja', 'Primer piso', 'Segundo piso'],
  },
};

const plan = (x, y, w, d, r = 0) => ({ x, y, w, d, r });

export function sitioSvg(site = 'building') {
  const cfg = SITIOS[site];
  if (!cfg) return '';
  const [nx, ny] = cfg.bahias;
  const F = plan(-(nx * BAHIA) / 2, -(ny * BAHIA) / 2, nx * BAHIA, ny * BAHIA);
  const plantas = cfg.plantas;
  const zDe = (f) => f * (PLANTA_H + LOSA);
  const techo = zDe(plantas.length);
  const P = k.fitProjection([...k.boxCorners(plan(F.x - 24, F.y - 24, F.w + 48, F.d + 48), 0, 0), ...k.boxCorners(F, 0, techo + LOSA + 26)], W, H, { pad: 16, ...CAM });
  const PK = { origin: [0, 0], scale: P.scale * K, azimuth: P.azimuth, elevation: P.elevation };
  const at = (p) => k.iso(p, P);
  const depth = (p) => k.depthOf(p, P);
  const sorted = (items) => [...items].sort((a, b) => depth(a.c) - depth(b.c));
  const S = (paths, style = {}) => k.solidSvg(paths, { crease: 'faint', ...style });
  const Sf = (paths, tone = 'lo') => k.solidSvg(paths, { tone, flat: true, crease: 'none' });   // relleno plano + arista: ocluye sin sombra
  const L = (d, style = {}) => k.lineSvg(d, style);
  const seg = (a, b) => k.segment(a, b, P);
  const box = (p, z, h, steps = 1) => k.slabOf(p, z, h, P, steps, 0);

  // ——— Equipos del sprite (con sus ganchos) y muebles (sin código).
  const equipos = [];
  const parte = (key, code, pos, { lit = false } = {}) => {
    const { ext, svg } = PARTES[key](PK);
    const t = at(pos);
    const pts = ext.points.map((q) => k.iso(q, PK)).map(([x, y]) => [x + t[0], y + t[1]]);
    const xs = pts.map(([x]) => x), ys = pts.map(([, y]) => y);
    let body = renombrar(svg);
    if (!lit) body = body.replace(/ data-lit=""/g, '').replace(/data-tone="lit"/g, 'data-tone="hi"');
    const g = `<g${code ? ` data-project-device="${code}"` : ''} transform="translate(${t[0].toFixed(1)} ${t[1].toFixed(1)})">${body}</g>`;
    const e = { code, key, c: pos, svg: g, focus: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }, top: Math.max(...ext.points.map((q) => q[2])) * K };
    if (code) equipos.push(e);
    return e;
  };

  const out = [];

  // ——— Contexto: manzana, vereda, calles, cordones, autos, árboles, vecinos.
  const lote = plan(F.x - 14, F.y - 14, F.w + 28, F.d + 28);
  const vereda = plan(lote.x - 10, lote.y - 10, lote.w + 20, lote.d + 20);
  const calle = plan(vereda.x - 34, vereda.y - 34, vereda.w + 68, vereda.d + 68);
  out.push(S(k.slabOf(calle, -1.2, 1.2, P, 1, 0), { tone: 'lo', crease: 'none', flat: true }));
  out.push(S(k.slabOf(vereda, 0, 1.6, P, 1, 0), { tone: 'lo', crease: 'none', flat: true }));
  out.push(L(k.planOutline(lote, 1.61, P, 1), { tone: 'faint' }));
  const baldosas = [];
  for (let x = vereda.x + 8; x < vereda.x + vereda.w; x += 8) { baldosas.push(seg([x, vereda.y, 1.61], [x, lote.y, 1.61])); baldosas.push(seg([x, lote.y + lote.d, 1.61], [x, vereda.y + vereda.d, 1.61])); }
  for (let y = vereda.y + 8; y < vereda.y + vereda.d; y += 8) { baldosas.push(seg([vereda.x, y, 1.61], [lote.x, y, 1.61])); baldosas.push(seg([lote.x + lote.w, y, 1.61], [vereda.x + vereda.w, y, 1.61])); }
  out.push(L(baldosas.join(''), { tone: 'faint' }));
  const ejes = [];
  const my = calle.y + calle.d - 17, mx = calle.x + calle.w - 17;
  for (let x = calle.x; x < calle.x + calle.w - 6; x += 12) ejes.push(seg([x, my, -1.19], [x + 6, my, -1.19]));
  for (let y = calle.y; y < calle.y + calle.d - 6; y += 12) ejes.push(seg([mx, y, -1.19], [mx, y + 6, -1.19]));
  out.push(L(ejes.join(''), { tone: 'lo' }));
  const senda = [];
  for (let i = 0; i < 8; i++) { senda.push(k.planOutline(plan(F.x + 10 + i * 5, vereda.y + vereda.d + 2, 2.6, 30), -1.19, P, 1)); senda.push(k.planOutline(plan(vereda.x + vereda.w + 2, F.y + 10 + i * 5, 30, 2.6), -1.19, P, 1)); }
  out.push(L(senda.join(''), { tone: 'lo' }));

  const contexto = [];
  const auto = (x, y, alongX) => { const w = alongX ? 16 : 7, d = alongX ? 7 : 16; const cw = alongX ? 8 : 5.2, cd = alongX ? 5.2 : 8; return S(box(plan(x, y, w, d, 1.2), -1.2, 4.2), { tone: 'mid', crease: 'faint' }) + S(box(plan(x + (w - cw) / 2, y + (d - cd) / 2, cw, cd, 1.6), 3, 3.4), { tone: 'mid', crease: 'none' }); };
  [[F.x - 20, my + 5], [F.x + 20, my + 5], [F.x + 60, my - 12], [F.x + 100, my + 5], [F.x + 150, my - 12]].forEach(([x, y]) => contexto.push({ c: [x + 8, y + 3, 0], svg: auto(x, y, true) }));
  [[mx + 5, F.y - 30], [mx - 12, F.y + 10], [mx + 5, F.y + 60], [mx - 12, F.y + 110]].forEach(([x, y]) => contexto.push({ c: [x + 3, y + 8, 0], svg: auto(x, y, false) }));
  // Árboles de vereda: tronco fino y copa como tres anillos de hojas; sólo en los dos frentes que dan a la calle.
  const arbol = (x, y) => L(seg([x, y, 1.6], [x, y, 9]), { tone: 'lo' }) + S(k.cylinder(x, y, 4.2, 8.5, 4.5, P, 14, 2), { tone: 'lo', crease: 'none' }) + S(k.cylinder(x, y, 3, 13, 3.2, P, 12, 1.6), { tone: 'lo', crease: 'none' }) + L(k.planOutline(plan(x - 2.5, y - 2.5, 5, 5), 1.61, P, 1), { tone: 'faint' });
  for (let x = vereda.x + 18; x < vereda.x + vereda.w - 10; x += 44) contexto.push({ c: [x, vereda.y + vereda.d - 4, 0], svg: arbol(x, vereda.y + vereda.d - 4) });
  for (let y = vereda.y + 18; y < vereda.y + vereda.d - 30; y += 44) contexto.push({ c: [vereda.x + vereda.w - 4, y, 0], svg: arbol(vereda.x + vereda.w - 4, y) });
  // Gente en la vereda: cabeza y cuerpo, como escala humana.
  const persona = (x, y) => S(k.cylinder(x, y, 1, 1.6, 5, P, 6), { tone: 'mid', crease: 'none' }) + S(k.cylinder(x, y, 0.9, 6.6, 1.6, P, 6), { tone: 'hi', crease: 'none' });
  [[F.x + 30, vereda.y + vereda.d - 12], [F.x + 36, vereda.y + vereda.d - 15], [F.x + 120, vereda.y + vereda.d - 10], [vereda.x + vereda.w - 12, F.y + 40], [vereda.x + vereda.w - 14, F.y + 46], [F.x + 86, F.y + F.d + 8]].forEach(([x, y]) => contexto.push({ c: [x, y, 0], svg: persona(x, y) }));
  const vecino = (p, h, pisos) => {
    const s = S(box(p, 0, h), { tone: 'lo', crease: 'none' });
    const lines = [];
    const ph = h / pisos;
    for (let i = 1; i < pisos; i++) { const z = i * ph; lines.push(seg([p.x, p.y + p.d + 0.01, z], [p.x + p.w, p.y + p.d + 0.01, z]) + seg([p.x + p.w + 0.01, p.y, z], [p.x + p.w + 0.01, p.y + p.d, z])); }
    for (let x = p.x + 9; x < p.x + p.w; x += 9) lines.push(seg([x, p.y + p.d + 0.01, 2], [x, p.y + p.d + 0.01, h - 2]));
    for (let y = p.y + 9; y < p.y + p.d; y += 9) lines.push(seg([p.x + p.w + 0.01, y, 2], [p.x + p.w + 0.01, y, h - 2]));
    return s + L(lines.join(''), { tone: 'faint' });
  };
  const vecinos = [
    [plan(calle.x - 100, calle.y - 110, 90, 90), 150, 10], [plan(calle.x - 100, calle.y - 10, 90, 120), 110, 7], [plan(calle.x, calle.y - 110, 150, 90), 92, 6],
    [plan(calle.x + 160, calle.y - 110, 110, 90), 170, 11], [plan(calle.x - 100, calle.y + 120, 90, 110), 70, 4], [plan(calle.x + calle.w + 10, calle.y - 40, 90, 120), 120, 8],
  ];
  vecinos.forEach(([p, h, n]) => contexto.push({ c: [p.x + p.w / 2, p.y + p.d / 2, 0], svg: vecino(p, h, n) }));
  const cBuilding = depth([F.x + F.w / 2, F.y + F.d / 2, 0]);
  const atras = sorted(contexto.filter((i) => depth(i.c) < cBuilding)), delante = sorted(contexto.filter((i) => depth(i.c) >= cBuilding));
  atras.forEach((i) => out.push(i.svg));

  // ——— Estructura.
  const gx = Array.from({ length: nx + 1 }, (_, i) => F.x + i * BAHIA);
  const gy = Array.from({ length: ny + 1 }, (_, j) => F.y + j * BAHIA);
  const COL = 3;
  const esc = plan(F.x + F.w - BAHIA + 2, F.y + 2, BAHIA - 4, BAHIA - 4);   // núcleo de escalera
  const plantasSvg = [];
  const sx = esc.x - 4, sy = esc.y + 4;   // montante junto al núcleo de escalera
  const zc = (f) => zDe(f) + LOSA + PLANTA_H - VIGA - 0.8;   // cota del tendido bajo las vigas
  const tramo = (code, pts) => `<g class="sp-route sp-route--${code}" data-project-route="${code}" fill="none" stroke="#dc2626" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${k.pathOf(pts.map(at))}" pathLength="100"/></g>`;
  const CAB = { '101': 'rack', '102': 'nvr', '103': 'central-ip', '104': 'servidor', '105': 'rack', '106': 'servidor', '107': 'central', '108': 'ups' };
  // Los tramos de cada planta: el de los equipos de esa planta hasta el montante, los montantes que bajan de pisos superiores, y en planta baja el tendido hasta la cabecera.
  const tramosDe = (f) => {
    const out = [];
    for (const e of todos) {
      const head = todos.find((h) => h.key === CAB[e.code]);
      if (!head || head === e) continue;
      const fe = Math.min(plantas.length, Math.max(0, Math.floor((e.c[2] + 0.01) / (PLANTA_H + LOSA))));
      const [x, y, z] = e.c;
      if (fe === f) out.push(tramo(e.code, fe >= plantas.length ? [[x, y, z + e.top], [x, y, z + e.top + 4], [sx, y, z + e.top + 4], [sx, sy, z + e.top + 4], [sx, sy, zc(f - 1) + VIGA + LOSA + 0.8]] : [[x, y, z + e.top], [x, y, zc(f)], [sx, y, zc(f)], [sx, sy, zc(f)]]));
      if (fe > f) out.push(tramo(e.code, [[sx, sy, zDe(f + 1) + LOSA], [sx, sy, f === 0 ? zc(0) : zc(f) + VIGA + 0.8]]));
      if (f === 0) out.push(tramo(e.code, [[sx, sy, zc(0)], [head.c[0], head.c[1], zc(0)], [head.c[0], head.c[1], head.c[2] + head.top]]));
    }
    return out.join('');
  };
  // Platea: la losa de planta baja sobre el lote, con las bases de columna marcadas.
  out.push(S(box(F, 0, LOSA), { tone: 'mid', crease: 'none' }));
  out.push(L(gx.flatMap((x) => gy.map((y) => k.planOutline(plan(x - 5, y - 5, 10, 10), LOSA + 0.02, P, 1))).join(''), { tone: 'faint' }));

  // Dos pasadas: la primera registra los equipos (para que los tendidos de planta baja conozcan a todos); la segunda dibuja.
  let todos = [];
  const dibujarEdificio = () => {
    plantas.forEach((nombre, f) => {
      const z0 = zDe(f), z1 = z0 + LOSA, zt = z1 + PLANTA_H, zv = zt + LOSA;
      const items = [];
      gx.forEach((x) => gy.forEach((y) => items.push({ c: [x, y, z1], svg: S(box(plan(x - COL / 2, y - COL / 2, COL, COL), z1, PLANTA_H), { tone: 'mid', crease: 'none' }) })));
      const vigas = [];
      gy.forEach((y) => vigas.push({ c: [F.x + F.w / 2, y, zt], svg: Sf(box(plan(F.x, y - 2, F.w, 4), zt - VIGA, VIGA), 'mid') }));
      gx.forEach((x) => vigas.push({ c: [x, F.y + F.d / 2, zt], svg: Sf(box(plan(x - 2, F.y, 4, F.d), zt - VIGA, VIGA), 'mid') }));
      const viguetas = [];
      for (let i = 0; i < nx; i++) for (let x = gx[i] + 6; x < gx[i + 1]; x += 6) viguetas.push({ c: [x, F.y + F.d / 2, zt], svg: Sf(box(plan(x - 0.8, F.y, 1.6, F.d), zt - VIGA + 1.2, VIGA - 1.2), 'lo') });
      const losa = S(box(F, zt, LOSA), { tone: 'hi', crease: 'none' });
      const fachada = { fondo: [], frente: [] };
      for (let x = F.x + 3; x < F.x + F.w; x += 6) { fachada.fondo.push(seg([x, F.y - 0.6, z1], [x, F.y - 0.6, zt])); fachada.frente.push(seg([x, F.y + F.d + 0.6, z1], [x, F.y + F.d + 0.6, zt])); }
      for (let y = F.y + 3; y < F.y + F.d; y += 6) { fachada.fondo.push(seg([F.x - 0.6, y, z1], [F.x - 0.6, y, zt])); fachada.frente.push(seg([F.x + F.w + 0.6, y, z1], [F.x + F.w + 0.6, y, zt])); }
      const antepecho = z1 + 10, dintel = zt - 4;
      [antepecho, dintel].forEach((z) => { fachada.fondo.push(seg([F.x, F.y - 0.6, z], [F.x + F.w, F.y - 0.6, z]) + seg([F.x - 0.6, F.y, z], [F.x - 0.6, F.y + F.d, z])); fachada.frente.push(seg([F.x, F.y + F.d + 0.6, z], [F.x + F.w, F.y + F.d + 0.6, z]) + seg([F.x + F.w + 0.6, F.y, z], [F.x + F.w + 0.6, F.y + F.d, z])); });
      const peld = [];
      const n = 9, dz = (PLANTA_H + LOSA) / 2 / n;
      for (let i = 0; i <= n; i++) { peld.push(seg([esc.x + 2, esc.y + 2 + i * 1.6, z1 + i * dz], [esc.x + 12, esc.y + 2 + i * 1.6, z1 + i * dz])); peld.push(seg([esc.x + 14, esc.y + 16.4 - i * 1.6, z1 + (n + i) * dz], [esc.x + 24, esc.y + 16.4 - i * 1.6, z1 + (n + i) * dz])); }
      peld.push(k.planOutline(plan(esc.x + 2, esc.y + 16.4, 22, 7), z1 + n * dz, P, 1));
      peld.push(seg([esc.x + 2, esc.y + 2, z1], [esc.x + 2, esc.y + 16.4, z1 + n * dz]) + seg([esc.x + 12, esc.y + 2, z1], [esc.x + 12, esc.y + 16.4, z1 + n * dz]));
      peld.push(seg([esc.x + 14, esc.y + 16.4, z1 + n * dz], [esc.x + 14, esc.y + 2, zv]) + seg([esc.x + 24, esc.y + 16.4, z1 + n * dz], [esc.x + 24, esc.y + 2, zv]));
      items.push({ c: [esc.x + esc.w / 2, esc.y + esc.d / 2, z1], svg: L(peld.join(''), { tone: 'mid' }) + L(k.planOutline(esc, z1 + 0.02, P, 1), { tone: 'lo' }) });
      const tabique = (a, b) => L(seg([a[0], a[1], z1], [b[0], b[1], z1]) + seg([a[0], a[1], zt], [b[0], b[1], zt]) + seg([a[0], a[1], z1], [a[0], a[1], zt]) + seg([b[0], b[1], z1], [b[0], b[1], zt]), { tone: 'lo' });
      const escritorio = (x, y) => S(box(plan(x, y, 14, 7, 0.6), z1 + 6, 1), { tone: 'mid', crease: 'none' }) + L(seg([x + 1, y + 1, z1], [x + 1, y + 1, z1 + 6]) + seg([x + 13, y + 1, z1], [x + 13, y + 1, z1 + 6]) + seg([x + 1, y + 6, z1], [x + 1, y + 6, z1 + 6]) + seg([x + 13, y + 6, z1], [x + 13, y + 6, z1 + 6]), { tone: 'lo' }) + S(box(plan(x + 5, y + 1, 4, 0.5), z1 + 7, 3.4), { tone: 'hi', crease: 'none' }) + S(k.cylinder(x + 7, y + 11, 2.2, z1 + 4, 0.8, P, 10), { tone: 'lo', crease: 'none' });
      const mesa = (x, y, w, d) => S(box(plan(x, y, w, d, 2), z1 + 6, 1), { tone: 'mid', crease: 'none' }) + S(k.cylinder(x + w / 2, y + d / 2, 2, z1, 6, P, 10), { tone: 'lo', crease: 'none' });
      const planta = (x, y) => S(k.cylinder(x, y, 2, z1, 3, P, 8), { tone: 'lo', crease: 'none' }) + S(k.cylinder(x, y, 3.4, z1 + 3, 2.4, P, 10, 1), { tone: 'mid', crease: 'none' });
      const ceil = { camara: 8.5 * K / 0.75, detector: 3.6 * K / 0.75, ap: 3.6 * K / 0.75 };

      if (f === 0) {
        const T = plan(F.x + F.w - 2 * BAHIA + 2, F.y + BAHIA + 2, BAHIA - 4, BAHIA);
        items.push({ c: [T.x, T.y + T.d / 2, z1], svg: tabique([T.x, T.y], [T.x, T.y + T.d]) + tabique([T.x, T.y + T.d], [T.x + T.w, T.y + T.d]) });
        items.push({ c: [T.x + 20, T.y + 8, z1], svg: parte('rack', '101', [T.x + 20, T.y + 8, z1], { lit: true }).svg });
        items.push({ c: [T.x + 8, T.y + 6, z1], svg: parte('servidor', '104', [T.x + 8, T.y + 6, z1]).svg });
        items.push({ c: [T.x + 9, T.y + 18, z1], svg: parte('nvr', '102', [T.x + 9, T.y + 18, z1]).svg });
        items.push({ c: [T.x + 21, T.y + 22, z1], svg: parte('ups', '108', [T.x + 21, T.y + 22, z1]).svg });
        items.push({ c: [T.x + 4, T.y + 26, z1], svg: parte('central-ip', '103', [T.x + 4, T.y + 26, z1]).svg });
        items.push({ c: [T.x + 1, T.y + 12, z1], svg: parte('central', '107', [T.x + 1.2, T.y + 10, z1]).svg });
        items.push({ c: [T.x + 1, T.y + 24, z1], svg: parte('tablero', '108', [T.x + 1.2, T.y + 21, z1]).svg });
        items.push({ c: [F.x + 40, F.y + F.d - 24, z1], svg: mesa(F.x + 30, F.y + F.d - 26, 26, 6) + mesa(F.x + 50, F.y + F.d - 42, 6, 20) });
        items.push({ c: [F.x + 70, F.y + F.d - 10, z1], svg: parte('acceso', '102', [F.x + 68, F.y + F.d - 12, z1]).svg });
        items.push({ c: [F.x + 20, F.y + F.d - 12, z1], svg: planta(F.x + 18, F.y + F.d - 10) + planta(F.x + 8, F.y + F.d - 10) });
        for (let i = 0; i < 3; i++) { const sx = F.x + 6 + i * BAHIA; items.push({ c: [sx + 12, F.y + 14, z1], svg: tabique([sx + BAHIA - 6, F.y], [sx + BAHIA - 6, F.y + BAHIA]) + escritorio(sx + 4, F.y + 8) + escritorio(sx + 4, F.y + 20) }); }
        items.push({ c: [F.x + 10, F.y + 10, z1], svg: parte('telefono', '103', [F.x + 10, F.y + 10, z1 + 7]).svg });
        items.push({ c: [F.x + 20, F.y + 70, z1], svg: parte('camara', '102', [F.x + 20, F.y + 70, zt - VIGA - ceil.camara]).svg });
        items.push({ c: [F.x + 60, F.y + 45, z1], svg: parte('detector', '107', [F.x + 60, F.y + 45, zt - VIGA - ceil.detector]).svg });
        items.push({ c: [F.x + 130, F.y + 100, z1], svg: parte('detector', '107', [F.x + 130, F.y + 100, zt - VIGA - ceil.detector]).svg });
      } else if (f === 1) {
        for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const x = F.x + 10 + i * 24, y = F.y + 40 + j * 30; items.push({ c: [x + 7, y + 4, z1], svg: escritorio(x, y) + escritorio(x, y + 14) }); }
        items.push({ c: [F.x + 20, F.y + 15, z1], svg: tabique([F.x + BAHIA * 2, F.y], [F.x + BAHIA * 2, F.y + BAHIA]) + tabique([F.x, F.y + BAHIA], [F.x + BAHIA * 2, F.y + BAHIA]) + mesa(F.x + 14, F.y + 10, 32, 12) });
        items.push({ c: [F.x + 44, F.y + 4, z1], svg: parte('pantalla', '104', [F.x + 44, F.y + 2, z1 + 3]).svg });
        items.push({ c: [F.x + 130, F.y + 20, z1], svg: parte('maletin', '105', [F.x + 128, F.y + 18, z1]).svg });
        items.push({ c: [F.x + 58, F.y + 55, z1], svg: parte('telefono', '103', [F.x + 60, F.y + 42, z1 + 7]).svg });
        items.push({ c: [F.x + 45, F.y + 75, z1], svg: parte('detector', '107', [F.x + 45, F.y + 75, zt - VIGA - ceil.detector]).svg });
        items.push({ c: [F.x + 120, F.y + 75, z1], svg: parte('detector', '107', [F.x + 120, F.y + 75, zt - VIGA - ceil.detector]).svg });
        items.push({ c: [F.x + 90, F.y + 50, z1], svg: parte('ap', '101', [F.x + 90, F.y + 50, zt - VIGA - ceil.ap]).svg });
        items.push({ c: [F.x + 160, F.y + 120, z1], svg: parte('camara', '102', [F.x + 160, F.y + 120, zt - VIGA - ceil.camara]).svg });
        items.push({ c: [F.x + 1, F.y + 60, z1], svg: parte('pulsador', '107', [F.x + 1.4, F.y + 58, z1 + 6]).svg });
        items.push({ c: [F.x + 100, F.y + 140, z1], svg: planta(F.x + 100, F.y + 142) + planta(F.x + 150, F.y + 142) });
      } else {
        items.push({ c: [F.x + 40, F.y + 30, z1], svg: tabique([F.x + BAHIA * 3, F.y], [F.x + BAHIA * 3, F.y + BAHIA * 2]) + tabique([F.x, F.y + BAHIA * 2], [F.x + BAHIA * 3, F.y + BAHIA * 2]) + mesa(F.x + 20, F.y + 18, 50, 16) });
        items.push({ c: [F.x + 45, F.y + 26, z1], svg: parte('plano', '106', [F.x + 45, F.y + 26, z1 + 7]).svg });
        items.push({ c: [F.x + 20, F.y + 3, z1], svg: parte('pantalla', '104', [F.x + 20, F.y + 2, z1 + 3]).svg });
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = F.x + 100 + i * 24, y = F.y + 12 + j * 30; items.push({ c: [x + 7, y + 4, z1], svg: escritorio(x, y) + escritorio(x, y + 14) }); }
        for (let i = 0; i < 4; i++) { const x = F.x + 10 + i * 24; items.push({ c: [x + 7, F.y + 100, z1], svg: escritorio(x, F.y + 96) + escritorio(x, F.y + 110) }); }
        items.push({ c: [F.x + 60, F.y + 80, z1], svg: parte('detector', '107', [F.x + 60, F.y + 80, zt - VIGA - ceil.detector]).svg });
        items.push({ c: [F.x + 130, F.y + 50, z1], svg: parte('camara', '102', [F.x + 130, F.y + 50, zt - VIGA - ceil.camara]).svg });
        items.push({ c: [F.x + 1, F.y + 100, z1], svg: parte('sirena', '107', [F.x + 1.4, F.y + 98, z1 + 8]).svg });
      }
      out.push(L(fachada.fondo.join(''), { tone: 'faint' }));
      sorted(items).forEach((i) => out.push(i.svg));
      sorted([...viguetas, ...vigas]).forEach((i) => out.push(i.svg));
      out.push(losa);
      if (f === 0) out.push(L(fachada.frente.join(''), { tone: 'lo' }));
      plantasSvg.push({ nombre, z: z1 });
    });
    const zr = techo + LOSA;
    out.push(L(k.planOutline(plan(F.x + 4, F.y + 4, F.w - 8, F.d - 8), zr + 0.02, P, 1), { tone: 'lo' }));
    const parapeto = [];
    [[F.x, F.y + F.d, F.x + F.w, F.y + F.d], [F.x + F.w, F.y, F.x + F.w, F.y + F.d], [F.x, F.y, F.x + F.w, F.y], [F.x, F.y, F.x, F.y + F.d]].forEach(([x0, y0, x1, y1]) => parapeto.push(seg([x0, y0, zr + 4], [x1, y1, zr + 4]) + seg([x0, y0, zr], [x1, y1, zr])));
    out.push(L(parapeto.join(''), { tone: 'mid' }));
    const azotea = [
      { c: [esc.x + esc.w / 2, esc.y + esc.d / 2, zr], svg: S(box(plan(esc.x, esc.y, esc.w, esc.d), zr, 14), { tone: 'mid', crease: 'faint' }) },
      { c: [F.x + 30, F.y + 30, zr], svg: S(box(plan(F.x + 20, F.y + 20, 22, 14, 1), zr, 10), { tone: 'mid' }) + L([0, 1, 2, 3].map((i) => k.planOutline(plan(F.x + 22 + i * 5, F.y + 22, 3, 10), zr + 10.02, P, 1)).join(''), { tone: 'lo' }) },
      { c: [F.x + 60, F.y + 30, zr], svg: S(box(plan(F.x + 50, F.y + 20, 22, 14, 1), zr, 10), { tone: 'mid' }) + L([0, 1, 2, 3].map((i) => k.planOutline(plan(F.x + 52 + i * 5, F.y + 22, 3, 10), zr + 10.02, P, 1)).join(''), { tone: 'lo' }) },
      { c: [F.x + 20, F.y + 100, zr], svg: parte('antena', '103', [F.x + 20, F.y + 100, zr]).svg },
      { c: [F.x + 100, F.y + 110, zr], svg: parte('generador', '108', [F.x + 100, F.y + 110, zr]).svg },
    ];
    sorted(azotea).forEach((i) => out.push(i.svg));
  };
  const marca = out.length;
  dibujarEdificio();
  todos = [...equipos]; equipos.length = 0; out.length = marca; plantasSvg.length = 0;
  dibujarEdificio();

  delante.forEach((i) => out.push(i.svg));
  const cotas = [];
  const cy = vereda.y + vereda.d + 12, cx = vereda.x + vereda.w + 12;
  cotas.push(seg([F.x, cy, 0], [F.x + F.w, cy, 0]) + seg([F.x, cy - 3, 0], [F.x, cy + 3, 0]) + seg([F.x + F.w, cy - 3, 0], [F.x + F.w, cy + 3, 0]));
  gx.forEach((x) => cotas.push(seg([x, cy - 2, 0], [x, cy + 2, 0])));
  cotas.push(seg([cx, F.y, 0], [cx, F.y + F.d, 0]) + seg([cx - 3, F.y, 0], [cx + 3, F.y, 0]) + seg([cx - 3, F.y + F.d, 0], [cx + 3, F.y + F.d, 0]));
  gy.forEach((y) => cotas.push(seg([cx - 2, y, 0], [cx + 2, y, 0])));
  out.push(L(cotas.join(''), { tone: 'mid' }));

  // ——— Pines, cajas de foco y nombres de planta (los recorridos ya están en cada planta).
  // Recorridos por encima de la estructura, de cada equipo al montante por el cielorraso de su planta y de ahí a la cabecera.
  const rutas = {};
  for (const e of equipos) {
    const head = cab[e.code];
    if (!head || head === e) continue;
    const [x, y, z] = e.c;
    const fe = Math.min(plantas.length - 1, Math.max(0, Math.floor((z + 0.01) / (PLANTA_H + LOSA))));
    const enTecho = z >= techo;
    const zl = enTecho ? z + e.top + 4 : zc(fe);
    const pts = [[x, y, z + e.top], [x, y, zl], [sx, y, zl], [sx, sy, zl], [sx, sy, zc(0)], [head.c[0], head.c[1], zc(0)], [head.c[0], head.c[1], head.c[2] + head.top]];
    (rutas[e.code] ||= []).push(`<path d="${k.pathOf(pts.map(at))}" pathLength="100"/>`);
  }
  const rutasSvg = Object.entries(rutas).map(([code, paths]) => `<g class="sp-route sp-route--${code}" data-project-route="${code}" fill="none" stroke="#dc2626" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths.join('')}</g>`).join('');
  const cab = Object.fromEntries(Object.entries(CAB).map(([c, key]) => [c, equipos.find((e) => e.key === key)]));
  const pinDe = {};
  for (const e of equipos) if (!pinDe[e.code] || cab[e.code] === e) pinDe[e.code] = e;
  const pinesSvg = Object.entries(pinDe).map(([code, e]) => { const [x, y] = at([e.c[0], e.c[1], e.c[2] + e.top + 2]); return `<g class="sp-pin sp-pin--${code}" data-project-pin="${code}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2" fill="#dc2626"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="#a2a8af" stroke-opacity=".55" stroke-width=".65"/></g>`; }).join('');
  const focusSvg = Object.entries(pinDe).map(([code, e]) => `<g data-project-focus="${code}" data-x="${e.focus.x.toFixed(1)}" data-y="${e.focus.y.toFixed(1)}" data-width="${e.focus.w.toFixed(1)}" data-height="${e.focus.h.toFixed(1)}"/>`).join('');
  const labels = plantasSvg.map(({ nombre, z }) => { const [x, y] = at([F.x - 6, F.y + F.d + 4, z + 8]); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="#c4c7cc" font-family="UM Sans 2,UM Sans,Arial,sans-serif" font-size="16" text-anchor="end" class="sp-floor-label">${nombre}</text>`; }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="sp-scene pt-svg" data-fit="1" role="img" aria-labelledby="sp-${site}-title sp-${site}-desc"><title id="sp-${site}-title">${cfg.titulo}</title><desc id="sp-${site}-desc">${cfg.desc}</desc><g class="sp-root"><g class="sp-structure">${renombrar(out.join(''))}</g>${rutasSvg}${focusSvg}${pinesSvg}${labels}</g></svg>\n`;
}
