/**
 * Las partes del despiece (2026-10-30): 31 equipos dibujados como sólidos isométricos con el
 * núcleo del kit Anatomy (./anatomy, MIT). Cada parte se dibuja con la proyección que recibe;
 * sin proyección devuelve sólo sus extremos (para encuadrarla o para ubicarla en un banco).
 *
 * Misma cámara para todas (azimut 42°, elevación 30°), cuerpo en tono medio, una sola pieza
 * encendida por parte (el punto que la identifica: un LED, una lente, un pulsador).
 */
import * as k from './anatomy/iso-kit.mjs';

export const SIZE = 64;
export const CAM = { azimuth: 42, elevation: 30 };

/** Proyección que encuadra los extremos dados en la caja de 64×64. */
const fitArgs = (points, pad = 5) => ({ points, pad });
/** Proyección que encuadra los extremos dados en la caja de 64×64. */
export const fit = (points, pad = 5) => k.fitProjection(points, SIZE, SIZE, { pad, ...CAM });
const S = (paths, style = {}) => k.solidSvg(paths, { crease: 'faint', ...style });
const L = (d, style = {}) => k.lineSvg(d, style);
const D = (points, style = {}) => k.dotsSvg(points, style);
const plan = (x, y, w, d, r = 0.8) => ({ x, y, w, d, r });
const extremos = (plans, z1, extra = []) => [...plans.flatMap(([p, z0, zt]) => k.boxCorners(p, z0 ?? 0, zt ?? z1)), ...extra];

/** Puntos sobre la cara frontal (+y) de un plan, en una grilla de columnas × filas. */
function frente(P, p, z0, z1, cols, rows, insetX = 2, insetZ = 1.2) {
  const out = [];
  const yF = p.y + p.d + 0.01;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = cols === 1 ? p.x + p.w / 2 : p.x + insetX + (c * (p.w - insetX * 2)) / (cols - 1);
    const z = rows === 1 ? (z0 + z1) / 2 : z0 + insetZ + (r * (z1 - z0 - insetZ * 2)) / (rows - 1);
    out.push(k.iso([x, yF, z], P));
  }
  return out;
}
/** Un rectángulo cerrado sobre la cara frontal (una ranura, una ventana, una bahía). */
const ventana = (P, p, x0, x1, z0, z1) => {
  const yF = p.y + p.d + 0.01;
  return k.pathOf([[x0, yF, z0], [x1, yF, z0], [x1, yF, z1], [x0, yF, z1]].map((q) => k.iso(q, P)), true);
};
/** Lo mismo sobre la cara derecha (+x). */
const ventanaLado = (P, p, y0, y1, z0, z1) => {
  const xF = p.x + p.w + 0.01;
  return k.pathOf([[xF, y0, z0], [xF, y1, z0], [xF, y1, z1], [xF, y0, z1]].map((q) => k.iso(q, P)), true);
};
/** Línea de borde a borde sobre la cara frontal a la altura z. */
const regla = (P, p, z, x0 = p.x, x1 = p.x + p.w) => k.segment([x0, p.y + p.d + 0.01, z], [x1, p.y + p.d + 0.01, z], P);
const byDepth = (P) => (items) => [...items].sort((a, b) => k.depthOf(a.c, P) - k.depthOf(b.c, P)).map((i) => i.svg);

// Un cuerpo de pared para lo que va montado (lectores, pulsadores, sirenas, centrales).
function pared(P, p, h) {
  return S(k.slabOf(p, 0, h, P, 3, 0), { tone: 'lo', crease: 'faint' });
}

export const PARTES = {
  rack(P) {
    const body = plan(-11, -11, 22, 22, 1);
    const ext = fitArgs(extremos([[body, 0, 52]]), 4); if (!P) return { ext };
    const out = [];
    for (const [x, y] of k.corners(body, 3)) out.push({ c: [x, y, 0], svg: S(k.cylinder(x, y, 1.6, 0, 2, P, 16), { tone: 'lo', crease: 'none' }) });
    const feet = byDepth(P)(out);
    const cab = S(k.slabOf(body, 2, 50, P, 3, 0.8), { tone: 'mid' });
    // Equipos montados en el frente: seis unidades, una encendida.
    const units = [];
    [6, 12, 18, 30, 36, 44].forEach((z, i) => {
      const u = plan(body.x + 2, body.y + body.d - 1.5, body.w - 4, 1.8, 0.4);
      units.push(S(k.slabOf(u, z, 3, P, 2, 0), { tone: i === 3 ? 'hi' : 'mid', crease: 'none', lit: i === 3 }));
      units.push(D(frente(P, u, z, z + 3, 4, 1), { size: 0.45, tone: 'hi' }));
    });
    const vents = [10, 22, 34, 46].map((z) => ventanaLado(P, body, body.y + 3, body.y + body.d - 3, z, z + 1.2)).join('');
    return { svg: [...feet, cab, ...units, L(vents, { tone: 'faint' }), L(k.planOutline(k.insetPlan(body, 2), 52, P, 3), { tone: 'faint' })].join(''), ext };
  },
  switch(P) {
    const body = plan(-15, -6, 30, 12, 0.8);
    const ext = fitArgs(extremos([[body, 0, 5]]), 6); if (!P) return { ext };
    const ports = [...frente(P, body, 1, 4.6, 12, 2, 2.5, 1.3)];
    return { svg: [
      S(k.slabOf(body, 0, 4.6, P, 3, 0.5), { tone: 'mid' }),
      D(ports, { size: 0.5, tone: 'hi' }),
      D([k.iso([body.x + body.w - 1.5, body.y + body.d + 0.01, 2.3], P)], { size: 0.5, tone: 'lit' }),
      L(ventanaLado(P, body, body.y + 2, body.y + body.d - 2, 1.2, 3.4), { tone: 'faint' }),
    ].join(''), ext };
  },
  patch(P) {
    const body = plan(-15, -4, 30, 8, 0.6);
    const ext = fitArgs(extremos([[body, 0, 4]]), 6); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(body, 0, 3.6, P, 3, 0.4), { tone: 'mid' }),
      L(regla(P, body, 2.9, body.x + 1.5, body.x + body.w - 1.5), { tone: 'faint' }),
      D(frente(P, body, 0, 2.6, 16, 1, 2.2), { size: 0.5, tone: 'hi' }),
      D([k.iso([body.x + 1.2, body.y + body.d + 0.01, 1.3], P)], { size: 0.45, tone: 'lit' }),
    ].join(''), ext };
  },
  fibra(P) {
    const spool = [-4, 0];
    const odf = plan(8, -7, 10, 14, 0.5);
    const ext = fitArgs([...k.boxCorners(plan(-15, -11, 22, 22), 0, 7), ...k.boxCorners(odf, 0, 4)], 5); if (!P) return { ext };
    return { svg: [
      S(k.cylinder(spool[0], spool[1], 11, 0, 1.4, P, 24), { tone: 'lo' }),
      S(k.cylinder(spool[0], spool[1], 9.5, 1.4, 4.6, P, 24), { tone: 'mid', crease: 'none' }),
      L([2.6, 3.8, 5].map((z) => k.sideArc(spool[0], spool[1], 9.5, z, P, 20)).join(''), { tone: 'faint' }),
      S(k.cylinder(spool[0], spool[1], 11, 6, 1.4, P, 24), { tone: 'lo' }),
      S(k.cylinder(spool[0], spool[1], 3, 7.4, 1, P, 24), { tone: 'hi', lit: true }),
      S(k.slabOf(odf, 0, 4, P, 3, 0.4), { tone: 'mid' }),
      D(frente(P, odf, 0, 4, 6, 1, 1.6), { size: 0.45, tone: 'hi' }),
    ].join(''), ext };
  },
  ap(P) {
    const base = plan(-7, -7, 14, 14, 2);
    const ext = fitArgs([...k.boxCorners(plan(-12, -12, 24, 24), 0, 5)], 6); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(base, 0, 0.8, P, 4, 0), { tone: 'lo', crease: 'none' }),
      S(k.cylinder(0, 0, 11, 0.8, 3.4, P, 28, 0.8), { tone: 'mid' }),
      L(k.ring(0, 0, 8, 4.2, P, 32), { tone: 'faint' }),
      L(k.sideArc(0, 0, 11, 2.2, P, 24), { tone: 'faint' }),
      D([k.iso([0, 0, 4.2], P)], { size: 0.7, tone: 'lit' }),
    ].join(''), ext };
  },
  cableado(P) {
    const tray = plan(-20, -6, 40, 12, 0.4);
    const ext = fitArgs(extremos([[tray, 0, 6]]), 5); if (!P) return { ext };
    const out = [S(k.slabOf(tray, 0, 1, P, 2, 0), { tone: 'lo', crease: 'none' })];
    out.push(S(k.slabOf(plan(tray.x, tray.y, tray.w, 1, 0.2), 1, 4, P, 2, 0), { tone: 'mid', crease: 'none' }));
    // Tres cables tendidos a lo largo: cada uno es una pieza con volumen que termina en los bordes.
    [2, 5.5, 9].forEach((dy, i) => out.push(S(k.slabOf(plan(tray.x, tray.y + dy, tray.w, 1.6, 0.8), 1, 1.6, P, 4, 0), { tone: i === 1 ? 'hi' : 'mid', crease: 'none', lit: i === 1 })));
    out.push(S(k.slabOf(plan(tray.x, tray.y + tray.d - 1, tray.w, 1, 0.2), 1, 4, P, 2, 0), { tone: 'mid', crease: 'none' }));
    out.push(L([-8, 8].map((x) => k.segment([x, tray.y + tray.d + 0.01, 1], [x, tray.y + tray.d + 0.01, 5], P)).join(''), { tone: 'faint' }));
    return { svg: out.join(''), ext };
  },
  canalizacion(P) {
    const duct = plan(-20, -3, 40, 6, 1.5);
    const ext = fitArgs(extremos([[duct, 2, 10]]), 5); if (!P) return { ext };
    const out = [];
    [-12, 8].forEach((x) => out.push(S(k.slabOf(plan(x, -4, 3, 8, 0.4), 0, 2, P, 2, 0), { tone: 'lo', crease: 'none' })));
    out.push(S(k.slabOf(duct, 2, 6, P, 4, 1.2), { tone: 'mid', inner: L(k.sideSeam(duct, 5, P, 4), { tone: 'faint' }) }));
    [-12, 8].forEach((x, i) => out.push(S(k.slabOf(plan(x, -4, 3, 8, 0.6), 8, 1.2, P, 2, 0), { tone: i ? 'hi' : 'mid', crease: 'none', lit: i === 1 })));
    return { svg: out.join(''), ext };
  },
  camara(P) {
    const ext = fitArgs([...k.boxCorners(plan(-11, -11, 22, 22), 0, 11)], 6); if (!P) return { ext };
    return { svg: [
      S(k.cylinder(0, 0, 10.5, 0, 1.8, P, 28), { tone: 'lo' }),
      S(k.cylinder(0, 0, 8.6, 1.8, 3.2, P, 28, 0.8), { tone: 'mid' }),
      L(k.sideArc(0, 0, 8.6, 3.4, P, 20), { tone: 'faint' }),
      S(k.cylinder(0, 0, 6, 5, 2.4, P, 28, 1), { tone: 'hi', crease: 'none' }),
      S(k.cylinder(0, 0, 3, 7.4, 0.8, P, 20), { tone: 'hi', lit: true }),
      D([k.iso([4.4, 4.4, 6.2], P)], { size: 0.9, tone: 'lit' }),
    ].join(''), ext };
  },
  nvr(P) {
    const body = plan(-13, -9, 26, 18, 0.8);
    const ext = fitArgs(extremos([[body, 0, 7]]), 6); if (!P) return { ext };
    const out = [];
    for (const [x, y] of k.corners(body, 2.5)) out.push(S(k.cylinder(x, y, 1, 0, 0.8, P, 12), { tone: 'lo', crease: 'none' }));
    out.push(S(k.slabOf(body, 0.8, 6, P, 3, 0.5), { tone: 'mid' }));
    out.push(L(ventana(P, body, body.x + 2, body.x + 14, 2.2, 5.4), { tone: 'faint' }));
    out.push(L(k.planOutline(plan(body.x + 3, body.y + 3, 14, 10, 0.4), 6.8, P, 2), { tone: 'faint' }));
    out.push(D(frente(P, body, 0.8, 6.8, 2, 1, 4.5).slice(1), { size: 0.5, tone: 'hi' }));
    out.push(D([k.iso([body.x + body.w - 2.5, body.y + body.d + 0.01, 3.8], P)], { size: 0.55, tone: 'lit' }));
    return { svg: out.join(''), ext };
  },
  acceso(P) {
    const wall = plan(-9, -2, 18, 2, 0.2);
    const reader = plan(-3.5, 0, 7, 2.2, 0.6);
    const ext = fitArgs(extremos([[wall, 0, 20]]), 6); if (!P) return { ext };
    return { svg: [
      pared(P, wall, 20),
      S(k.slabOf(reader, 4, 12, P, 2, 0.4), { tone: 'hi' }),
      D(frente(P, reader, 4, 11, 3, 4, 1.5, 1.6), { size: 0.4, tone: 'mid' }),
      L(ventana(P, reader, reader.x + 1, reader.x + reader.w - 1, 12.5, 14.5), { tone: 'faint' }),
      D([k.iso([reader.x + reader.w / 2, reader.y + reader.d + 0.01, 15.2], P)], { size: 0.5, tone: 'lit' }),
    ].join(''), ext };
  },
  alarma(P) {
    const wall = plan(-9, -2, 18, 2, 0.2);
    const body = plan(-3, 0, 6, 3.6, 1);
    const ext = fitArgs(extremos([[wall, 0, 20]]), 6); if (!P) return { ext };
    return { svg: [
      pared(P, wall, 20),
      S(k.slabOf(body, 9, 8, P, 4, 0.8), { tone: 'hi' }),
      L(ventana(P, body, body.x + 1, body.x + body.w - 1, 10, 13.5), { tone: 'faint' }),
      D([k.iso([body.x + body.w / 2, body.y + body.d + 0.01, 15.5], P)], { size: 0.5, tone: 'lit' }),
    ].join(''), ext };
  },
  'central-ip'(P) {
    const body = plan(-12, -8, 24, 16, 0.8);
    const ext = fitArgs(extremos([[body, 0, 6]]), 6); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(body, 0, 5, P, 3, 0.5), { tone: 'mid' }),
      D(frente(P, body, 0.6, 4.4, 8, 1, 2.5), { size: 0.5, tone: 'hi' }),
      L(ventanaLado(P, body, body.y + 2, body.y + body.d - 2, 1.4, 3.6), { tone: 'faint' }),
      L(k.planOutline(k.insetPlan(body, 2.5), 5, P, 3), { tone: 'faint' }),
      D([k.iso([body.x + 2, body.y + 2.5, 5.01], P)], { size: 0.55, tone: 'lit' }),
    ].join(''), ext };
  },
  telefono(P) {
    const base = plan(-8, -7, 16, 14, 1);
    const ext = fitArgs(extremos([[base, 0, 7]]), 6); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(base, 0, 3, P, 4, 0.6), { tone: 'mid' }),
      S(k.slabOf(plan(base.x + 4, base.y + 1, 10, 5, 0.4), 3, 1.4, P, 2, 0), { tone: 'hi', crease: 'none', lit: true }),
      L(k.planOutline(plan(base.x + 5, base.y + 1.8, 8, 3.4, 0.2), 4.41, P, 2), { tone: 'mid' }),
      D(k.dotGrid(base.x + 5.5, base.y + 8, 3, 3, 2.4, 3.01, P), { size: 0.45, tone: 'hi' }),
      S(k.slabOf(plan(base.x - 0.5, base.y + 0.5, 3.6, 13, 1.6), 3, 2.2, P, 4, 0.6), { tone: 'hi' }),
    ].join(''), ext };
  },
  antena(P) {
    const base = plan(-5, -5, 10, 10, 0.6);
    const ext = fitArgs([...k.boxCorners(base, 0, 2), [0, 0, 40], [4, 0, 40], [-4, 0, 30]], 4); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(base, 0, 2, P, 3, 0.4), { tone: 'lo' }),
      S(k.cylinder(0, 0, 1.2, 2, 24, P, 16), { tone: 'mid', crease: 'none' }),
      L([12, 24].map((z) => k.sideArc(0, 0, 1.2, z, P, 10)).join(''), { tone: 'faint' }),
      S(k.slabOf(plan(-2.2, 1.2, 4.4, 1.6, 0.4), 14, 8, P, 2, 0), { tone: 'mid' }),
      S(k.slabOf(plan(-3, 1.2, 6, 2, 0.6), 26, 13, P, 3, 0.5), { tone: 'hi', lit: true }),
      D([k.iso([0, 3.2, 32.5], P)], { size: 0.5, tone: 'lit' }),
    ].join(''), ext };
  },
  parlante(P) {
    const back = plan(-7, -9, 14, 8, 1);
    const ext = fitArgs([...k.boxCorners(plan(-10, -10, 20, 20), 0, 9)], 6); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(back, 0, 8, P, 3, 0.6), { tone: 'lo' }),
      S(k.cylinder(0, 1, 9, 0, 2.2, P, 24), { tone: 'mid' }),
      S(k.cylinder(0, 1, 7.4, 2.2, 1.2, P, 24), { tone: 'hi', crease: 'none' }),
      D(k.dotGrid(-4, -3, 5, 5, 2, 3.41, P).filter(([x, y]) => true), { size: 0.4, tone: 'mid' }),
      D([k.iso([0, 1, 3.41], P)], { size: 0.6, tone: 'lit' }),
    ].join(''), ext };
  },
  pantalla(P) {
    const base = plan(-6, -3, 12, 6, 1);
    const scr = plan(-13, -1, 26, 1.6, 0.4);
    const ext = fitArgs(extremos([[scr, 6, 24], [base, 0, 1]]), 5); if (!P) return { ext };
    const yF = scr.y + scr.d + 0.01;
    const rules = [[20.5, -10, 2], [17.5, -10, 6], [14.5, -10, 0]].map(([z, x0, x1]) => k.segment([x0, yF, z], [x1, yF, z], P)).join('');
    return { svg: [
      S(k.slabOf(base, 0, 1, P, 4, 0.4), { tone: 'lo' }),
      S(k.slabOf(plan(-1.5, -0.5, 3, 1.2, 0.3), 1, 5, P, 2, 0), { tone: 'mid', crease: 'none' }),
      S(k.slabOf(scr, 6, 18, P, 2, 0.4), { tone: 'hi' }),
      L(ventana(P, scr, scr.x + 1.2, scr.x + scr.w - 1.2, 7.2, 22.8), { tone: 'faint' }),
      L(rules, { tone: 'mid', free: true }),
      S(k.slabOf(plan(1, yF - 0.3, 9, 0.3, 0.1), 15.5, 5.5, P, 2, 0), { tone: 'hi', crease: 'none', lit: true }),
    ].join(''), ext };
  },
  servidor(P) {
    const body = plan(-13, -10, 26, 20, 0.6);
    const ext = fitArgs(extremos([[body, 0, 11]]), 6); if (!P) return { ext };
    const out = [];
    [0, 5].forEach((z, i) => {
      out.push(S(k.slabOf(body, z, 4.6, P, 2, 0.3), { tone: 'mid' }));
      [0, 1, 2, 3].forEach((b) => out.push(L(ventana(P, body, body.x + 2 + b * 5.2, body.x + 6.4 + b * 5.2, z + 0.9, z + 3.7), { tone: 'faint' })));
      out.push(D([k.iso([body.x + body.w - 2, body.y + body.d + 0.01, z + 2.3], P)], { size: 0.5, tone: i ? 'lit' : 'hi' }));
    });
    out.push(L(k.planOutline(k.insetPlan(body, 2.5), 9.6, P, 2), { tone: 'faint' }));
    return { svg: out.join(''), ext };
  },
  puesto(P) {
    const desk = plan(-18, -9, 36, 18, 0.8);
    const ext = fitArgs(extremos([[desk, 0, 22]]), 5); if (!P) return { ext };
    const out = [];
    for (const [x, y] of k.corners(desk, 2)) out.push({ c: [x, y, 0], svg: S(k.slabOf(plan(x - 1, y - 1, 2, 2, 0.3), 0, 11, P, 2, 0), { tone: 'lo', crease: 'none' }) });
    const legs = byDepth(P)(out);
    const scr = plan(-8, -6, 16, 1.2, 0.3);
    const yF = scr.y + scr.d + 0.01;
    return { svg: [
      ...legs,
      S(k.slabOf(desk, 11, 1.4, P, 3, 0.4), { tone: 'mid' }),
      S(k.slabOf(plan(-4, -4, 8, 4, 0.8), 12.4, 0.8, P, 3, 0), { tone: 'lo', crease: 'none' }),
      S(k.slabOf(plan(-1, -4, 2, 1, 0.2), 13.2, 2.4, P, 2, 0), { tone: 'mid', crease: 'none' }),
      S(k.slabOf(scr, 15.6, 10, P, 2, 0.3), { tone: 'hi' }),
      L(ventana(P, scr, scr.x + 0.9, scr.x + scr.w - 0.9, 16.4, 24.8), { tone: 'faint' }),
      L([23, 21].map((z, i) => k.segment([-6, yF, z], [i ? -1 : 3, yF, z], P)).join(''), { tone: 'mid', free: true }),
      S(k.slabOf(plan(-6, 1, 12, 4.5, 0.4), 12.4, 0.8, P, 2, 0), { tone: 'hi', crease: 'none', lit: true }),
      D(k.dotGrid(-5, 1.8, 7, 2, 1.6, 13.21, P), { size: 0.3, tone: 'lo' }),
    ].join(''), ext };
  },
  maletin(P) {
    const body = plan(-10, -3.5, 20, 7, 1.2);
    const ext = fitArgs(extremos([[body, 0, 17]]), 5); if (!P) return { ext };
    const yF = body.y + body.d + 0.01;
    return { svg: [
      S(k.slabOf(body, 0, 13, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(body, 9, P, 4), { tone: 'faint' }) }),
      S(k.slabOf(plan(-3.5, -1.2, 7, 2.4, 1), 13, 2.6, P, 4, 0.6), { tone: 'hi' }),
      ...[-6, 5].map((x) => S(k.slabOf(plan(x, yF - 0.4, 2, 0.6, 0.2), 8, 2.2, P, 2, 0), { tone: 'hi', crease: 'none' })),
      L(ventana(P, body, -3, 3, 2.5, 6), { tone: 'faint' }),
      L([5.2, 4.2, 3.2].map((z, i) => k.segment([-2.2, yF, z], [i === 1 ? 1 : 2.2, yF, z], P)).join(''), { tone: 'lo', free: true }),
      D([k.iso([0, yF, 10.5], P)], { size: 0.5, tone: 'lit' }),
    ].join(''), ext };
  },
  disco(P) {
    const body = plan(-5, -8, 10, 16, 0.8);
    const ext = fitArgs(extremos([[body, 0, 13]]), 6); if (!P) return { ext };
    const out = [S(k.slabOf(body, 0, 12, P, 3, 0.6), { tone: 'mid' })];
    [1.5, 4, 6.5, 9].forEach((z, i) => {
      out.push(L(ventana(P, body, body.x + 1.2, body.x + body.w - 1.2, z, z + 1.8), { tone: 'faint' }));
      out.push(D([k.iso([body.x + body.w - 2, body.y + body.d + 0.01, z + 0.9], P)], { size: 0.4, tone: i === 1 ? 'lit' : 'hi' }));
    });
    out.push(L(k.planOutline(k.insetPlan(body, 1.5), 12, P, 3), { tone: 'faint' }));
    return { svg: out.join(''), ext };
  },
  plano(P) {
    const table = plan(-16, -11, 32, 22, 0.6);
    const sheet = plan(-13, -8, 24, 17, 0.3);
    const ext = fitArgs(extremos([[table, 0, 4]]), 5); if (!P) return { ext };
    const z = 1.3;
    const out = [S(k.slabOf(table, 0, 1, P, 3, 0.3), { tone: 'lo', crease: 'none' }), S(k.slabOf(sheet, 1, 0.3, P, 2, 0), { tone: 'hi', crease: 'none' })];
    out.push(L(k.planOutline(k.insetPlan(sheet, 1), z + 0.01, P, 2), { tone: 'faint' }));
    out.push(L(k.planOutline(plan(sheet.x + 14, sheet.y + 12, 9, 4, 0.1), z + 0.01, P, 1), { tone: 'mid' }));
    out.push(L([3, 5, 7].map((dy, i) => k.lineOnTop([sheet.x + 2, sheet.y + dy], [sheet.x + (i === 1 ? 8 : 11), sheet.y + dy], z + 0.01, P)).join(''), { tone: 'lo', free: true }));
    out.push(L(k.planOutline(plan(sheet.x + 13, sheet.y + 2, 9, 7, 0.1), z + 0.01, P, 1), { tone: 'mid' }));
    out.push(S(k.slabOf(plan(sheet.x + 3, sheet.y + 9, 8, 2.4, 0.2), z, 0.6, P, 2, 0), { tone: 'hi', crease: 'none', lit: true }));
    return { svg: out.join(''), ext };
  },
  central(P) {
    const wall = plan(-10, -2.5, 20, 2.5, 0.2);
    const box = plan(-7, 0, 14, 4.5, 0.6);
    const ext = fitArgs(extremos([[wall, 0, 24]]), 5); if (!P) return { ext };
    const yF = box.y + box.d + 0.01;
    return { svg: [
      pared(P, wall, 24),
      S(k.slabOf(box, 3, 18, P, 3, 0.6), { tone: 'mid', inner: L(k.segment([box.x + box.w - 1.2, yF, 3], [box.x + box.w - 1.2, yF, 21], P), { tone: 'faint' }) }),
      L(ventana(P, box, box.x + 1.5, box.x + 9.5, 15, 19), { tone: 'hi' }),
      L([17.5, 16.5].map((z, i) => k.segment([box.x + 2.3, yF, z], [box.x + (i ? 6 : 8.5), yF, z], P)).join(''), { tone: 'mid', free: true }),
      D(frente(P, box, 7, 12, 4, 2, 2, 1.2), { size: 0.45, tone: 'hi' }),
      D([k.iso([box.x + 2, yF, 9.5], P)], { size: 0.6, tone: 'lit' }),
      D([k.iso([box.x + box.w - 2.5, yF, 5], P)], { size: 0.7, tone: 'mid' }),
    ].join(''), ext };
  },
  detector(P) {
    const tile = plan(-11, -11, 22, 22, 0.4);
    const ext = fitArgs(extremos([[tile, 0, 7]]), 6); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(tile, 0, 0.8, P, 2, 0), { tone: 'lo', crease: 'none' }),
      S(k.cylinder(0, 0, 8.5, 0.8, 1.2, P, 24), { tone: 'mid' }),
      S(k.cylinder(0, 0, 7.4, 2, 3, P, 24), { tone: 'hi', crease: 'none' }),
      L([3, 4].map((z) => k.sideArc(0, 0, 7.4, z, P, 20)).join(''), { tone: 'faint' }),
      S(k.cylinder(0, 0, 5, 5, 1, P, 32), { tone: 'hi' }),
      L(k.ring(0, 0, 3.2, 6.01, P, 24), { tone: 'faint' }),
      D([k.iso([3.6, 2.2, 6.02], P)], { size: 0.6, tone: 'lit' }),
    ].join(''), ext };
  },
  pulsador(P) {
    const wall = plan(-8, -2, 16, 2, 0.2);
    const box = plan(-3.6, 0, 7.2, 3, 0.5);
    const ext = fitArgs(extremos([[wall, 0, 18]]), 6); if (!P) return { ext };
    const yF = box.y + box.d + 0.01;
    return { svg: [
      pared(P, wall, 18),
      S(k.slabOf(box, 5, 8, P, 3, 0.5), { tone: 'hi' }),
      L(ventana(P, box, box.x + 1.2, box.x + box.w - 1.2, 6.4, 11.4), { tone: 'mid' }),
      S(k.slabOf(plan(box.x + 2, yF - 0.5, 3.2, 0.7, 0.3), 7.6, 2.6, P, 2, 0), { tone: 'hi', crease: 'none', lit: true }),
      D([k.iso([box.x + 1, yF, 12.3], P), k.iso([box.x + box.w - 1, yF, 12.3], P)], { size: 0.35, tone: 'mid' }),
    ].join(''), ext };
  },
  sirena(P) {
    const wall = plan(-8, -2, 16, 2, 0.2);
    const box = plan(-4, 0, 8, 3, 0.8);
    const ext = fitArgs(extremos([[wall, 0, 18]]), 6); if (!P) return { ext };
    const yF = box.y + box.d + 0.01;
    return { svg: [
      pared(P, wall, 18),
      S(k.slabOf(box, 4, 10, P, 4, 0.7), { tone: 'mid' }),
      L([5.5, 7, 8.5].map((z) => ventana(P, box, box.x + 1.5, box.x + box.w - 1.5, z, z + 0.7)).join(''), { tone: 'faint' }),
      S(k.slabOf(plan(box.x + 2, yF - 0.4, 4, 1.4, 0.5), 10.5, 2.2, P, 3, 0.4), { tone: 'hi', lit: true }),
    ].join(''), ext };
  },
  modulo(P) {
    const body = plan(-6, -4, 12, 8, 0.6);
    const ext = fitArgs(extremos([[body, 0, 5]]), 7); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(plan(-7, -1, 14, 2, 0.2), 0, 0.8, P, 2, 0), { tone: 'lo', crease: 'none' }),
      S(k.slabOf(body, 0.8, 3.4, P, 3, 0.4), { tone: 'mid' }),
      D(frente(P, body, 0.8, 4.2, 6, 1, 1.5), { size: 0.45, tone: 'hi' }),
      D(k.dotGrid(body.x + 1.5, body.y + 1.2, 6, 1, 1.8, 4.21, P), { size: 0.4, tone: 'mid' }),
      L(k.planOutline(plan(body.x + 2, body.y + 4, 8, 2.6, 0.2), 4.21, P, 2), { tone: 'faint' }),
      D([k.iso([body.x + body.w - 1.5, body.y + body.d - 1.3, 4.22], P)], { size: 0.5, tone: 'lit' }),
    ].join(''), ext };
  },
  tablero(P) {
    const wall = plan(-11, -3, 22, 3, 0.2);
    const box = plan(-9, 0, 18, 5, 0.6);
    const ext = fitArgs(extremos([[wall, 0, 26]]), 5); if (!P) return { ext };
    const yF = box.y + box.d + 0.01;
    const out = [pared(P, wall, 26), S(k.slabOf(box, 1, 23, P, 3, 0.6), { tone: 'mid' })];
    out.push(L(ventana(P, box, box.x + 1.5, box.x + box.w - 1.5, 3, 21), { tone: 'faint' }));
    [15, 9].forEach((z, row) => {
      out.push(L(regla(P, box, z - 0.5, box.x + 2.5, box.x + box.w - 2.5), { tone: 'lo' }));
      for (let i = 0; i < 6; i++) {
        const x = box.x + 2.8 + i * 2.1;
        out.push(S(k.slabOf(plan(x, yF - 0.3, 1.5, 0.5, 0.1), z, 3.2, P, 2, 0), { tone: row === 0 && i === 1 ? 'hi' : 'mid', crease: 'none', lit: row === 0 && i === 1 }));
      }
    });
    out.push(D([k.iso([box.x + box.w - 2.5, yF, 2.1], P)], { size: 0.55, tone: 'mid' }));
    return { svg: out.join(''), ext };
  },
  ups(P) {
    const body = plan(-5, -11, 10, 22, 1);
    const ext = fitArgs(extremos([[body, 0, 22]]), 5); if (!P) return { ext };
    const yF = body.y + body.d + 0.01;
    return { svg: [
      S(k.slabOf(body, 0, 21, P, 4, 0.8), { tone: 'mid' }),
      L(ventana(P, body, body.x + 2, body.x + body.w - 2, 14, 18), { tone: 'hi' }),
      L([16.8, 15.6].map((z, i) => k.segment([body.x + 2.8, yF, z], [body.x + (i ? 5.5 : 7), yF, z], P)).join(''), { tone: 'mid', free: true }),
      L([3, 5, 7, 9].map((z) => ventana(P, body, body.x + 2, body.x + body.w - 2, z, z + 0.8)).join(''), { tone: 'faint' }),
      L(ventanaLado(P, body, body.y + 3, body.y + body.d - 3, 4, 9), { tone: 'faint' }),
      D([k.iso([body.x + body.w / 2, yF, 11.5], P)], { size: 0.6, tone: 'lit' }),
    ].join(''), ext };
  },
  bateria(P) {
    const body = plan(-7, -4.5, 14, 9, 0.6);
    const ext = fitArgs(extremos([[body, 0, 12]]), 6); if (!P) return { ext };
    return { svg: [
      S(k.slabOf(body, 0, 9, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(body, 7.6, P, 3), { tone: 'faint' }) }),
      L(ventana(P, body, body.x + 2, body.x + body.w - 2, 2, 5.5), { tone: 'faint' }),
      L([4.5, 3.5].map((z, i) => k.segment([body.x + 3, body.y + body.d + 0.01, z], [body.x + (i ? 7 : 10), body.y + body.d + 0.01, z], P)).join(''), { tone: 'lo', free: true }),
      S(k.cylinder(body.x + 3, body.y + 2.5, 1.1, 9, 1.6, P, 16), { tone: 'hi', lit: true }),
      S(k.cylinder(body.x + body.w - 3, body.y + 2.5, 1.1, 9, 1.6, P, 16), { tone: 'hi' }),
    ].join(''), ext };
  },
  tierra(P) {
    const bar = plan(-12, -1.2, 24, 2.4, 0.3);
    const ext = fitArgs([...k.boxCorners(bar, 0, 7), [14, 6, 26], [14, 6, 0]], 5); if (!P) return { ext };
    const out = [];
    [-8, 8].forEach((x) => out.push(S(k.cylinder(x, 0, 1.6, 0, 3.5, P, 16), { tone: 'lo' })));
    out.push(S(k.slabOf(bar, 3.5, 2.6, P, 2, 0.3), { tone: 'hi', lit: true }));
    out.push(D([-9, -5.4, -1.8, 1.8, 5.4, 9].map((x) => k.iso([x, 0, 6.11], P)), { size: 0.45, tone: 'mid' }));
    out.push(S(k.slabOf(plan(12.5, 4.5, 3, 3, 0.4), 0, 2.4, P, 2, 0), { tone: 'mid' }));
    out.push(S(k.cylinder(14, 6, 0.9, 2.4, 23, P, 14), { tone: 'mid', crease: 'none' }));
    out.push(L(k.sideArc(14, 6, 0.9, 14, P, 8), { tone: 'faint' }));
    return { svg: out.join(''), ext };
  },
  generador(P) {
    const skid = plan(-18, -8, 36, 16, 0.6);
    const ext = fitArgs(extremos([[skid, 0, 18]]), 5); if (!P) return { ext };
    const out = [];
    for (const [x, y] of k.corners(skid, 3)) out.push({ c: [x, y, 0], svg: S(k.cylinder(x, y, 1.4, 0, 1.2, P, 12), { tone: 'lo', crease: 'none' }) });
    const feet = byDepth(P)(out);
    const motor = plan(-16, -6, 15, 12, 0.8);
    const alt = plan(0, -5, 10, 10, 1.5);
    const panel = plan(11, -6, 6, 12, 0.6);
    return { svg: [
      ...feet,
      S(k.slabOf(skid, 1.2, 2, P, 3, 0.4), { tone: 'lo' }),
      S(k.slabOf(motor, 3.2, 11, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(motor, 10, P, 3), { tone: 'faint' }) }),
      L([-12, -9, -6].map((x) => k.segment([x, motor.y + motor.d + 0.01, 3.2], [x, motor.y + motor.d + 0.01, 14.2], P)).join(''), { tone: 'faint' }),
      S(k.cylinder(-8, -1, 1.4, 14.2, 7, P, 16), { tone: 'mid', crease: 'none' }),
      S(k.slabOf(alt, 3.2, 8.5, P, 5, 1.2), { tone: 'mid' }),
      L(k.sideSeam(alt, 7.5, P, 5), { tone: 'faint' }),
      S(k.slabOf(panel, 3.2, 12, P, 2, 0.4), { tone: 'hi' }),
      L(ventanaLado(P, panel, panel.y + 1.5, panel.y + panel.d - 1.5, 10, 13.5), { tone: 'faint' }),
      D([k.iso([panel.x + panel.w + 0.01, panel.y + panel.d / 2, 7.5], P)], { size: 0.55, tone: 'lit' }),
    ].join(''), ext };
  },
};

export const NOMBRES = {
  rack: 'Rack', switch: 'Switch', patch: 'Patch panel', fibra: 'Fibra óptica', ap: 'Access point', cableado: 'Cableado estructurado', canalizacion: 'Canalización',
  camara: 'Cámara CCTV', nvr: 'Grabador NVR', acceso: 'Control de acceso', alarma: 'Alarma de intrusión',
  'central-ip': 'Central telefónica IP', telefono: 'Teléfono IP', antena: 'Enlace de radio', parlante: 'Voceo',
  pantalla: 'Sistema a medida', servidor: 'Servidor', puesto: 'Puesto de trabajo', maletin: 'Soporte técnico', disco: 'Respaldo', plano: 'Ingeniería',
  central: 'Central de detección', detector: 'Detector', pulsador: 'Pulsador manual', sirena: 'Sirena', modulo: 'Módulo',
  tablero: 'Tablero eléctrico', ups: 'UPS', bateria: 'Batería', tierra: 'Puesta a tierra', generador: 'Grupo electrógeno',
};


export const CSS = `

.pt-svg path,.pt-svg circle{vector-effect:non-scaling-stroke}
.pt-fill{fill:var(--p-paper,#111316);stroke:none}
.pt-solid[data-lit]>.pt-fill{fill:var(--p-face,#15181c)}
.pt-shade,.pt-top{stroke:none}
.pt-shade[data-shade="0"]{fill:var(--p-s0,#0b0c0f)}.pt-shade[data-shade="1"]{fill:var(--p-s1,#0e1013)}.pt-shade[data-shade="2"]{fill:var(--p-s2,#121418)}.pt-shade[data-shade="3"]{fill:var(--p-s3,#171a1f)}
.pt-top{fill:var(--p-top,#1c2025)}
.pt-solid[data-lit]>.pt-top{fill:var(--p-lit-top,#2a1416)}.pt-solid[data-lit]>.pt-shade{fill:var(--p-lit-shade,#1d1012)}
.pt-solid[data-lit]>.pt-edge{stroke:var(--p-lit,#dc2626)}
.pt-line{fill:none;stroke:var(--p-lo,#4a4f56);stroke-width:var(--p-weight,.6px);stroke-linecap:round;stroke-linejoin:round}
.pt-line[data-tone="hi"]{stroke:var(--p-hi,#c4c7cc)}.pt-line[data-tone="mid"]{stroke:var(--p-mid,#81878e)}.pt-line[data-tone="lo"]{stroke:var(--p-lo,#4a4f56)}.pt-line[data-tone="faint"]{stroke:var(--p-faint,#2d3137)}.pt-line[data-tone="lit"]{stroke:var(--p-lit,#dc2626)}
.pt-dots circle{fill:var(--p-dot,#e6e8eb);stroke:none;opacity:.35}
.pt-dots[data-tone="hi"] circle{opacity:.85}.pt-dots[data-tone="mid"] circle{opacity:.5}.pt-dots[data-tone="lo"] circle{opacity:.25}.pt-dots[data-tone="lit"] circle{fill:var(--p-lit,#dc2626);opacity:1}
`;

// Clases propias (pt-*) para no chocar con el CSS de producción.
export const renombrar = (svg) => svg.replace(/class="iso-/g, 'class="pt-').replace(/class="(pt-[a-z-]+) iso-/g, 'class="$1 pt-');

/** Una parte encuadrada en 64×64: { svg, ext }. */
export function parte(key) {
  const { ext } = PARTES[key]();
  const P = fit(ext.points, ext.pad);
  return { svg: renombrar(PARTES[key](P).svg), ext };
}

/** El sprite completo, con su CSS adentro (vale para <use> externo). */
export function spriteSvg() {
  const symbols = Object.keys(PARTES).map((key) => `<symbol id="p-${key}" viewBox="0 0 ${SIZE} ${SIZE}">${parte(key).svg}</symbol>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true"><style>${CSS.replace(/\n/g, '')}</style>${symbols.join('')}</svg>\n`;
}
