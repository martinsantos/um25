/**
 * El sitio (2026-10-30): un lugar dibujado en corte con el kit de Anatomy, con el mismo
 * lenguaje que las partes y el banco. Plantas, muros del fondo, columnas, mobiliario y los
 * equipos reales del sprite a escala, con los ganchos que ya usan el CSS y el JS del sistema:
 *
 *   .sp-scene > .sp-root > .sp-structure            la estructura y los equipos
 *   .sp-route.sp-route--<código> > path             el recorrido de cada servicio (dasharray en CSS)
 *   .sp-pin.sp-pin--<código> (data-x, data-y)       el punto de cada servicio
 *   [data-project-device="<código>"]                 los equipos que se encienden
 *   [data-project-focus="<código>"] (data-x…)        la caja en pantalla de cada equipo
 *   text.sp-floor-label                              el nombre de cada planta
 *
 * sitioSvg('building') → <svg class="sp-scene" viewBox="0 0 1200 720">…</svg>
 */
import * as k from './anatomy/iso-kit.mjs';
import { PARTES, CAM, renombrar } from './partes.mjs';

const W = 1200, H = 720;
const K = 0.75;                // las partes del sprite, a tres cuartos dentro del edificio
const PLANTA_H = 40;           // altura libre de cada planta
const RETIRO = 30;             // cada planta alta se corta 30 unidades por el frente: el interior queda a la vista
const LOSA = 3;                // espesor de losa
const MURO = 2.2;              // espesor de los muros del fondo

/** Programas: qué tiene cada sitio. Por ahora, el edificio de oficinas. */
const SITIOS = {
  building: {
    titulo: 'Un edificio de oficinas por dentro, planta por planta',
    desc: 'Tres plantas en corte: sala técnica en planta baja, oficinas en el primer piso, sala de reuniones y terraza con antenas arriba. Cada servicio recorre su instalación.',
    huella: { x: -85, y: -55, w: 170, d: 110, r: 0 },
    plantas: ['Planta baja', 'Primer piso', 'Segundo piso'],
    // Montante técnico: sube por la esquina del fondo.
    montante: { x: 8, y: -51, w: 9, d: 9 },
    // Sala técnica en planta baja, al fondo, con tabique.
    tecnica: { x: 38, y: -55, w: 47, d: 47 },
  },
};

const S = (paths, style = {}) => k.solidSvg(paths, { crease: 'faint', ...style });
const L = (d, style = {}) => k.lineSvg(d, style);
const plan = (x, y, w, d, r = 0.4) => ({ x, y, w, d, r });

export function sitioSvg(site = 'building') {
  const cfg = SITIOS[site];
  if (!cfg) return '';
  const { huella: F, plantas, montante: M, tecnica: T } = cfg;
  const zDe = (f) => f * (PLANTA_H + LOSA);           // cota de la losa de la planta f
  const techo = zDe(plantas.length);                   // losa de cubierta
  const P = k.fitProjection([...k.boxCorners(plan(F.x - 26, F.y - 20, F.w + 52, F.d + 40), -4, 0), ...k.boxCorners(plan(F.x, F.y, F.w - (plantas.length - 1) * RETIRO, F.d), 0, techo + LOSA + 34)], W, H, { pad: 30, ...CAM });
  const at = (p) => k.iso(p, P);
  const depth = (p) => k.depthOf(p, P);
  const sorted = (items) => [...items].sort((a, b) => depth(a.c) - depth(b.c));
  const PK = { origin: [0, 0], scale: P.scale * K, azimuth: P.azimuth, elevation: P.elevation };

  const equipos = [];   // { code, key, pos:[x,y,z], svg, focus }
  const parte = (key, code, pos, { lit = false } = {}) => {
    const { ext, svg } = PARTES[key](PK);
    const t = at(pos);
    const pts = ext.points.map((q) => k.iso(q, PK)).map(([x, y]) => [x + t[0], y + t[1]]);
    const xs = pts.map(([x]) => x), ys = pts.map(([, y]) => y);
    let body = renombrar(svg);
    if (!lit) body = body.replace(/ data-lit=""/g, '').replace(/data-tone="lit"/g, 'data-tone="hi"');
    const g = `<g data-project-device="${code}" transform="translate(${t[0].toFixed(1)} ${t[1].toFixed(1)})">${body}</g>`;
    const e = { code, key, c: pos, svg: g, focus: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }, top: Math.max(...ext.points.map((q) => q[2])) * K };
    if (code) equipos.push(e);
    return e;
  };

  const out = [];
  // Suelo: una losa baja más amplia que la huella, con la vereda.
  const suelo = plan(F.x - 26, F.y - 20, F.w + 52, F.d + 40, 1);
  out.push(S(k.slabOf(suelo, -4, 4, P, 2, 0.4), { tone: 'lo', crease: 'none' }));
  out.push(L(k.planOutline(plan(F.x - 8, F.y - 8, F.w + 16, F.d + 16), 0.01, P, 1), { tone: 'faint' }));

  const plantasSvg = [];
  const huella = (f) => plan(F.x, F.y, F.w - f * RETIRO, F.d, 0);     // la planta f, cortada por el frente
  const ceil = { camara: 8.5, detector: 3.6, ap: 3.6 };                  // alto de lo que cuelga del cielorraso, a escala K
  plantas.forEach((nombre, f) => {
    const z0 = zDe(f), z1 = z0 + LOSA, zt = z1 + PLANTA_H;
    const Hf = huella(f);
    const items = [];
    // Losa de la planta, con su borde interior.
    out.push(S(k.slabOf(Hf, z0, LOSA, P, 1, 0), { tone: 'mid', crease: 'none' }));
    out.push(L(k.planOutline(plan(Hf.x + 4, Hf.y + 4, Hf.w - 8, Hf.d - 8), z1 + 0.01, P, 1), { tone: 'faint' }));
    // Muros del fondo (los dos que no miran al espectador), con parantes de ventana.
    const muroY = plan(Hf.x, Hf.y, Hf.w, MURO);
    const muroX = plan(Hf.x, Hf.y, MURO, Hf.d);
    out.push(S(k.slabOf(muroX, z1, PLANTA_H, P, 1, 0), { tone: 'lo', crease: 'none' }));
    out.push(S(k.slabOf(muroY, z1, PLANTA_H, P, 1, 0), { tone: 'lo', crease: 'none' }));
    const parantes = [];
    for (let x = Hf.x + 18; x < Hf.x + Hf.w - 6; x += 18) parantes.push(k.segment([x, Hf.y + MURO + 0.01, z1 + 3], [x, Hf.y + MURO + 0.01, zt - 3], P));
    for (let y = Hf.y + 18; y < Hf.y + Hf.d - 6; y += 18) parantes.push(k.segment([Hf.x + MURO + 0.01, y, z1 + 3], [Hf.x + MURO + 0.01, y, zt - 3], P));
    out.push(L(parantes.join(''), { tone: 'faint' }));
    out.push(L(k.segment([Hf.x + MURO + 0.01, Hf.y + MURO, z1 + 3], [Hf.x + MURO + 0.01, Hf.y + Hf.d, z1 + 3], P) + k.segment([Hf.x + MURO, Hf.y + MURO + 0.01, z1 + 3], [Hf.x + Hf.w, Hf.y + MURO + 0.01, z1 + 3], P), { tone: 'faint' }));
    // Montante técnico (tramo de esta planta) y columnas en las esquinas visibles.
    items.push({ c: [M.x + M.w / 2, M.y + M.d / 2, z1], svg: S(k.slabOf(plan(M.x, M.y, M.w, M.d, 0.3), z1, PLANTA_H, P, 1, 0), { tone: 'mid', crease: 'none' }) });
    for (const [cx, cy] of [[Hf.x + Hf.w - 4, Hf.y + 4], [Hf.x + 4, Hf.y + Hf.d - 4], [Hf.x + Hf.w - 4, Hf.y + Hf.d - 4], [Hf.x + Hf.w / 2, Hf.y + Hf.d - 4]]) items.push({ c: [cx, cy, z1], svg: S(k.slabOf(plan(cx - 1.8, cy - 1.8, 3.6, 3.6, 0.3), z1, PLANTA_H, P, 1, 0), { tone: 'mid', crease: 'none' }) });
    const mueble = (key, pos) => items.push({ c: pos, svg: parte(key, '', pos).svg.replace(' data-project-device=""', '') });

    if (f === 0) {
      // Planta baja: sala técnica al fondo (tabiques a media altura con vano) y recepción.
      // Sala técnica en el frente derecho, a la vista: tabique hacia la recepción (eje x) y hacia el fondo (eje y).
      items.push({ c: [T.x, T.y + T.d / 2, z1], svg: S(k.slabOf(plan(T.x, T.y, 1.5, T.d - 14, 0.2), z1, PLANTA_H - 10, P, 1, 0), { tone: 'lo', crease: 'none' }) });
      items.push({ c: [T.x + T.w / 2, T.y + T.d, z1], svg: S(k.slabOf(plan(T.x, T.y + T.d - 1.5, T.w - 16, 1.5, 0.2), z1, PLANTA_H - 10, P, 1, 0), { tone: 'lo', crease: 'none' }) });
      items.push({ c: [72, -42, z1], svg: parte('rack', '101', [72, -42, z1], { lit: true }).svg });
      items.push({ c: [54, -44, z1], svg: parte('servidor', '104', [54, -44, z1]).svg });
      items.push({ c: [58, -26, z1], svg: parte('nvr', '102', [58, -26, z1]).svg });
      items.push({ c: [76, -22, z1], svg: parte('ups', '108', [76, -22, z1]).svg });
      items.push({ c: [46, -30, z1], svg: parte('central-ip', '103', [46, -30, z1]).svg });
      items.push({ c: [T.x + 1.5, -34, z1], svg: parte('central', '107', [T.x + 2, -38, z1]).svg });
      items.push({ c: [T.x + 1.5, -18, z1], svg: parte('tablero', '108', [T.x + 2, -22, z1]).svg });
      mueble('puesto', [-40, 20, z1]);
      mueble('puesto', [-6, -24, z1]);
      items.push({ c: [-6, -24, z1], svg: parte('telefono', '103', [-2, -26, z1 + 11 * K]).svg });
      items.push({ c: [20, 46, z1], svg: parte('acceso', '102', [18, 44, z1]).svg });
      items.push({ c: [-2, 30, z1], svg: parte('camara', '102', [-2, 30, zt - ceil.camara]).svg });
      items.push({ c: [-40, -4, z1], svg: parte('detector', '107', [-40, -4, zt - ceil.detector]).svg });
    } else if (f === 1) {
      // Primer piso: oficina abierta.
      for (const [x, y] of [[-60, -30], [-25, -30], [10, -30], [-60, 15], [-25, 15], [10, 15]]) mueble('puesto', [x, y, z1]);
      items.push({ c: [10, -30, z1], svg: parte('telefono', '103', [14, -32, z1 + 11 * K]).svg });
      items.push({ c: [40, 20, z1], svg: parte('maletin', '105', [40, 22, z1]).svg });
      items.push({ c: [-40, -5, z1], svg: parte('detector', '107', [-40, -5, zt - ceil.detector]).svg });
      items.push({ c: [30, -5, z1], svg: parte('detector', '107', [30, -5, zt - ceil.detector]).svg });
      items.push({ c: [45, 38, z1], svg: parte('camara', '102', [45, 38, zt - ceil.camara]).svg });
      items.push({ c: [Hf.x + MURO, 30, z1], svg: parte('pulsador', '107', [Hf.x + MURO + 1, 26, z1 + 6]).svg });
      items.push({ c: [-10, -40, z1], svg: parte('ap', '101', [-10, -40, zt - ceil.ap]).svg });
    } else {
      // Segundo piso: sala de reuniones.
      items.push({ c: [-40, -50, z1], svg: parte('pantalla', '104', [-40, -50, z1 + 4]).svg });
      items.push({ c: [-40, -5, z1], svg: parte('plano', '106', [-40, -5, z1 + 4]).svg });
      mueble('puesto', [0, -30, z1]); mueble('puesto', [0, 15, z1]);
      items.push({ c: [-20, 25, z1], svg: parte('detector', '107', [-20, 25, zt - ceil.detector]).svg });
      items.push({ c: [Hf.x + MURO, 0, z1], svg: parte('sirena', '107', [Hf.x + MURO + 1, -4, z1 + 8]).svg });
      items.push({ c: [10, -5, z1], svg: parte('camara', '102', [10, -5, zt - ceil.camara]).svg });
    }
    sorted(items).forEach((i) => out.push(i.svg));
    plantasSvg.push({ nombre, z: z1 });
  });
  // Cubierta sobre la última planta: losa, remate del montante, antena y grupo electrógeno.
  const Ht = huella(plantas.length - 1);
  out.push(S(k.slabOf(Ht, techo, LOSA, P, 1, 0), { tone: 'mid', crease: 'none' }));
  out.push(L(k.planOutline(plan(Ht.x + 5, Ht.y + 5, Ht.w - 10, Ht.d - 10), techo + LOSA + 0.01, P, 1), { tone: 'faint' }));
  const azotea = [
    { c: [M.x + M.w / 2, M.y + M.d / 2, techo], svg: S(k.slabOf(plan(M.x, M.y, M.w, M.d, 0.3), techo + LOSA, 9, P, 1, 0), { tone: 'mid', crease: 'none' }) },
    { c: [-60, -35, techo], svg: parte('antena', '103', [-60, -35, techo + LOSA]).svg },
    { c: [-30, 25, techo], svg: parte('generador', '108', [-30, 25, techo + LOSA]).svg },
  ];
  sorted(azotea).forEach((i) => out.push(i.svg));

  // Recorridos: de cada equipo al montante, por el cielorraso de su planta, y del montante a la sala técnica.
  const cab = { '101': equipos.find((e) => e.key === 'rack'), '102': equipos.find((e) => e.key === 'nvr'), '103': equipos.find((e) => e.key === 'central-ip'), '104': equipos.find((e) => e.key === 'servidor'), '105': equipos.find((e) => e.key === 'rack'), '106': equipos.find((e) => e.key === 'servidor'), '107': equipos.find((e) => e.key === 'central'), '108': equipos.find((e) => e.key === 'ups') };
  const mx = M.x + M.w / 2, my = M.y + M.d / 2;
  const rutas = {};
  for (const e of equipos) {
    const head = cab[e.code];
    if (!head || head === e) continue;
    const [x, y, z] = e.c;
    const f = Math.max(0, Math.floor(z / (PLANTA_H + LOSA)));
    const zc = zDe(f) + LOSA + PLANTA_H - 1.5;
    const zh = head.c[2] + head.top;
    const pts = [[x, y, z + e.top], [x, y, zc], [mx + M.w / 2 + 1, y, zc], [mx + M.w / 2 + 1, my, zc], [mx + M.w / 2 + 1, my, zDe(0) + LOSA + PLANTA_H - 1.5], [head.c[0], head.c[1], zDe(0) + LOSA + PLANTA_H - 1.5], [head.c[0], head.c[1], zh]];
    const d = k.pathOf(pts.map(at));
    (rutas[e.code] ||= []).push(`<path d="${d}" pathLength="100"/>`);
  }
  const rutasSvg = Object.entries(rutas).map(([code, paths]) => `<g class="sp-route sp-route--${code}" data-project-route="${code}" fill="none" stroke="#dc2626" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths.join('')}</g>`).join('');
  // Pines: el equipo cabecera de cada servicio (y el primero de los que no tienen cabecera propia).
  const pinDe = {};
  for (const e of equipos) if (!pinDe[e.code] || cab[e.code] === e) pinDe[e.code] = e;
  const pinesSvg = Object.entries(pinDe).map(([code, e]) => { const [x, y] = at([e.c[0], e.c[1], e.c[2] + e.top + 2]); return `<g class="sp-pin sp-pin--${code}" data-project-pin="${code}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2" fill="#dc2626"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="#a2a8af" stroke-opacity=".55" stroke-width=".65"/></g>`; }).join('');
  const focusSvg = Object.entries(pinDe).map(([code, e]) => `<g data-project-focus="${code}" data-x="${e.focus.x.toFixed(1)}" data-y="${e.focus.y.toFixed(1)}" data-width="${e.focus.w.toFixed(1)}" data-height="${e.focus.h.toFixed(1)}"/>`).join('');
  // Nombres de planta, a la izquierda de cada losa.
  const labels = plantasSvg.map(({ nombre, z }) => { const [x, y] = at([F.x - 10, F.y + F.d + 6, z + 6]); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="#c4c7cc" font-family="UM Sans 2,UM Sans,Arial,sans-serif" font-size="18" text-anchor="end" class="sp-floor-label">${nombre}</text>`; }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="sp-scene pt-svg" role="img" aria-labelledby="sp-${site}-title sp-${site}-desc"><title id="sp-${site}-title">${cfg.titulo}</title><desc id="sp-${site}-desc">${cfg.desc}</desc><g class="sp-root"><g class="sp-structure">${renombrar(out.join(''))}</g>${rutasSvg}${focusSvg}${pinesSvg}${labels}</g></svg>\n`;
}
