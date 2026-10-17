// A sector, told in code: the place assembles on the page's paper, the four layers we
// install lift out of it (each one a service), the data runs through them, one moment of
// the operation crosses the stack, and everything settles back. Same grammar as the
// Software film; the place, its layers and its moment come from sectorSpecs.js.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {LAYER_STYLE} from './sectorSpecs.js';

const ROUTE = new Set(['tray', 'fiber', 'link', 'loop', 'pipe']);
const LOOP = 20, GAP = 1.4, W = 14, D = 9, BASE_Y = 1;
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const win = (a, b, t) => ease(clamp((t - a) / (b - a)));
const INK = '#182120', MUTE = '#7d858c', RED = '#DC2626';
const FONT = '"UM Sans", Arial, sans-serif';

// ---------- materials
function materials() {
  const P = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .42, clearcoat: .35, clearcoatRoughness: .3, ...o });
  const S = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
  return {
    white: P(0xf3f4f5), cap: S(0x2b3238, { roughness: .8 }), light: S(0xe2e5e8), grey: S(0xb9c0c6), slate: S(0x4a5560, { roughness: .5 }), dark: P(0x1c2026, { roughness: .35, clearcoat: .7 }),
    metal: S(0xd2d7dc, { metalness: .85, roughness: .3 }), steel: S(0xc9d0d6, { metalness: .92, roughness: .2 }), red: P(0xDC2626), yellow: P(0xE3A72B),
    wood: S(0x9a6a44, { roughness: .75 }), woodDark: S(0x6e4a30, { roughness: .8 }), carton: S(0xcaa57a, { roughness: .85 }), concrete: S(0xd9d7d1, { roughness: .9 }),
    rock: S(0xd2cabd, { roughness: .95 }), rockSide: S(0xb9ae9e, { roughness: .95 }), blanket: S(0xb7c3cc, { roughness: .8 }), fabric: S(0x34404b, { roughness: .85 }),
    bottle: new THREE.MeshPhysicalMaterial({ color: 0x24402e, roughness: .15, clearcoat: 1 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0e1a22, emissive: 0x2d7f8f, emissiveIntensity: .45, roughness: .3 }),
    led: new THREE.MeshStandardMaterial({ color: 0x0c1a12, emissive: 0x2bd48a, emissiveIntensity: 1.4 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dc, emissiveIntensity: 1.2 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe2ea, roughness: .08, metalness: 0, transparent: true, opacity: .32, depthWrite: false }),
    fence: new THREE.MeshStandardMaterial({ color: 0x8f99a2, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }),
  };
}

// ---------- piece builders (local coords, y up from the floor; return optional update(t))
function kit(g, M) {
  const shade = (m) => { m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, r = .025, ry = 0) => { const m = shade(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.max(.002, Math.min(r, w / 2.2, h / 2.2, d / 2.2))), mat)); m.position.set(x, y + h / 2, z); m.rotation.y = ry; return m; };
  const cyl = (r, h, mat, x, y, z, seg = 28, rTop = r) => { const m = shade(new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat)); m.position.set(x, y + h / 2, z); return m; };
  const hcyl = (r, len, mat, x, y, z, axis = 'x', seg = 28) => { const m = shade(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat)); m.position.set(x, y, z); if (axis === 'x') m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2; return m; };
  const bar = (a, b, t, mat) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const m = new THREE.Mesh(new THREE.BoxGeometry(t, t, A.distanceTo(B)), mat); m.position.copy(A).lerp(B, .5); m.lookAt(B); m.castShadow = true; g.add(m); return m; };
  const sub = (x, z, ry = 0) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); return kit(s, M); };
  return { g, box, cyl, hcyl, bar, sub, shade };
}

const BUILD = {
  bed({ box, cyl }, M) {
    for (const x of [-.4, .4]) for (const z of [-.9, .9]) cyl(.03, .28, M.metal, x, 0, z);
    box(.96, .1, 2.06, M.white, 0, .28, 0, .04); box(.88, .14, 1.94, M.light, 0, .38, .03, .06);
    box(.98, .62, .07, M.white, 0, .22, -1.04, .03); box(.98, .4, .06, M.white, 0, .22, 1.04, .03);
    box(.58, .1, .34, M.white, 0, .52, -.74, .05); box(.86, .07, 1.0, M.blanket, 0, .5, .4, .03);
    for (const x of [-.48, .48]) box(.03, .1, .7, M.metal, x, .5, -.3, .01);
    cyl(.018, 1.45, M.metal, .64, 0, -.86); box(.34, .26, .06, M.dark, .64, 1.14, -.86, .02); box(.28, .2, .006, M.screen, .64, 1.17, -.826, .002);
  },
  nurse({ g, box, shade }, M) {
    const arc = (rIn, rOut, h, y, mat) => {
      const s = new THREE.Shape(); s.absarc(0, 0, rOut, -.12 * Math.PI, 1.12 * Math.PI, false); s.absarc(0, 0, rIn, 1.12 * Math.PI, -.12 * Math.PI, true);
      const ge = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 64 }); ge.rotateX(-Math.PI / 2); const m = shade(new THREE.Mesh(ge, mat)); m.position.y = y; return m;
    };
    arc(1.12, 1.4, .92, 0, M.white); arc(1.06, 1.5, .04, .92, M.grey);
    [.3, .5, .7].forEach((a) => { const t = a * Math.PI, x = Math.cos(t) * 1.2, z = -Math.sin(t) * 1.2, ry = Math.atan2(-x, -z);
      box(.44, .28, .04, M.dark, x, .98, z, .02, ry); const f = box(.38, .22, .005, M.screen, x, 1.01, z, .002, ry); f.position.x -= Math.sin(ry) * -.023; f.position.z -= Math.cos(ry) * -.023; });
    for (const x of [-.45, .45]) { box(.42, .06, .42, M.fabric, x, .44, -.35, .03); box(.4, .4, .05, M.fabric, x, .48, -.12, .03); }
    void g;
  },
  desk({ box, cyl }, M) {
    box(1.3, .04, .66, M.white, 0, .72, 0, .015); for (const x of [-.62, .62]) box(.04, .72, .6, M.grey, x, 0, 0, .01);
    cyl(.02, .16, M.metal, 0, .76, -.18); box(.58, .34, .03, M.dark, 0, .88, -.18, .015); box(.52, .28, .004, M.screen, 0, .91, -.163, .002);
    cyl(.03, .4, M.dark, 0, 0, .5); box(.46, .07, .44, M.fabric, 0, .42, .5, .03); box(.44, .46, .06, M.fabric, 0, .5, .72, .03);
  },
  rack({ box }, M) {
    box(.6, 2.0, .9, M.dark, 0, 0, 0, .02);
    for (let i = 0; i < 9; i++) box(.5, .12, .012, i % 3 ? M.slate : M.grey, 0, .2 + i * .19, .455, .004);
    for (let i = 0; i < 6; i++) box(.025, .025, .012, M.led, .19, .26 + i * .28, .462, .004);
  },
  ups({ box }, M) { box(.5, 1.05, .72, M.light, 0, 0, 0, .02); box(.16, .1, .006, M.screen, 0, .82, .362, .002); for (let i = 0; i < 5; i++) box(.36, .015, .006, M.grey, 0, .25 + i * .08, .362, .002); },
  ortable({ cyl, box }, M) { cyl(.18, .7, M.metal, 0, 0, 0); box(.62, .08, 1.9, M.white, 0, .7, 0, .03); box(.54, .06, 1.8, M.light, 0, .78, 0, .03); },
  lamp({ cyl, box }, M) { cyl(.26, .05, M.white, 0, 0, 0); cyl(.035, 1.95, M.metal, 0, .05, 0); box(1.0, .05, .05, M.metal, -.5, 1.95, 0, .015); cyl(.36, .12, M.white, -1, 1.84, 0, 40, .26); cyl(.3, .01, M.lampGlow, -1, 1.832, 0, 40); },
  cart({ box }, M) { box(.5, .82, .42, M.white, 0, 0, 0, .03); box(.42, .3, .04, M.dark, 0, .86, -.1, .02); box(.36, .24, .005, M.screen, 0, .89, -.078, .002); },
  seats({ box, cyl }, M, n = 4) {
    box(n * .56, .05, .1, M.metal, 0, .3, 0, .01); for (const x of [-(n * .56) / 2 + .1, (n * .56) / 2 - .1]) cyl(.025, .3, M.metal, x, 0, 0);
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * .56; box(.5, .06, .46, M.fabric, x, .36, 0, .03); box(.5, .44, .05, M.fabric, x, .4, .24, .03); }
  },
  counter({ box, cyl }, M) {
    box(1.0, 1.0, .6, M.white, 0, 0, 0, .03); box(1.06, .04, .7, M.grey, 0, 1.0, 0, .015);
    box(.36, .26, .03, M.dark, 0, 1.06, -.14, .015); box(.32, .22, .004, M.screen, 0, 1.09, -.157, .002, Math.PI);
    box(.5, .2, .6, M.metal, .78, 0, 0, .02); box(.46, .02, .56, M.dark, .78, .2, 0, .005);
    cyl(.022, 1.9, M.metal, -.42, 0, -.28); box(.52, .26, .04, M.dark, -.42, 1.72, -.28, .02); box(.46, .2, .005, M.screen, -.42, 1.75, -.256, .002);
  },
  belt({ box, g }, M, L = 6) {
    box(L, .32, .62, M.grey, 0, 0, 0, .02); box(L, .02, .56, M.dark, 0, .32, 0, .005);
    const mats = [M.dark, M.red, M.slate, M.fabric, M.grey, M.dark], bags = mats.map((m) => box(.44, .22, .32, m, 0, .34, 0, .06));
    return (t) => bags.forEach((b, i) => { const f = (i / bags.length + t * .045) % 1; b.position.x = (.5 - f) * L * .94; const s = clamp(Math.min(f, 1 - f) * 14); b.scale.set(s, s, s); });
    void g;
  },
  carousel({ g, shade, box }, M) {
    const L = 4.4, Wd = 1.7;
    const stadium = (w, d, r) => { const s = new THREE.Shape(); s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false); s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false); return s; };
    const ring = stadium(L, Wd, Wd / 2); ring.holes.push(stadium(L - .9, Wd - .9, (Wd - .9) / 2));
    const ge = new THREE.ExtrudeGeometry(ring, { depth: .38, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 48 }); ge.rotateX(-Math.PI / 2);
    shade(new THREE.Mesh(ge, M.grey));
    const top = new THREE.ExtrudeGeometry(ring, { depth: .02, bevelEnabled: false, curveSegments: 48 }); top.rotateX(-Math.PI / 2); const tm = shade(new THREE.Mesh(top, M.dark)); tm.position.y = .4;
    box(L - 1.1, .5, Wd - 1.1, M.light, 0, 0, 0, .2);
    const R = (Wd - .45) / 2, S = L - Wd, P = 2 * S + 2 * Math.PI * R;
    const at = (s) => { s = ((s % P) + P) % P; if (s < S) return [S / 2 - s, R, Math.PI]; s -= S; if (s < Math.PI * R) { const a = Math.PI / 2 + s / R; return [-S / 2 + Math.cos(a) * R, Math.sin(a) * R, 0]; } s -= Math.PI * R; if (s < S) return [-S / 2 + s, -R, 0]; s -= S; const a = -Math.PI / 2 + s / R; return [S / 2 + Math.cos(a) * R, Math.sin(a) * R, 0]; };
    const mats = [M.dark, M.red, M.slate, M.fabric, M.grey, M.dark, M.slate, M.fabric, M.red, M.grey];
    const bags = mats.map((m) => box(.34, .2, .26, m, 0, .42, 0, .05));
    return (t) => bags.forEach((b, i) => { const [x, z] = at(i * P / bags.length + t * .22); b.position.x = x; b.position.z = -z; });
    void g;
  },
  arch({ box }, M) {
    for (const x of [-.46, .46]) box(.14, 1.95, .55, M.white, x, 0, 0, .03); box(1.06, .16, .55, M.white, 0, 1.95, 0, .03); box(.24, .03, .02, M.led, 0, 2.0, .28, .005);
    box(1.6, .7, .6, M.grey, 0, 0, .98, .02); box(.9, .85, .78, M.white, 0, .35, .98, .05); box(1.6, .02, .5, M.dark, 0, .7, .98, .005);
  },
  plane({ g, shade, box }, M) {
    const p = new THREE.Group(); g.add(p); const add = (m) => { m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
    const fus = add(new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 4.2, 40), M.white)); fus.rotation.z = Math.PI / 2; fus.position.set(0, .95, 0);
    const nose = add(new THREE.Mesh(new THREE.SphereGeometry(.4, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.white)); nose.rotation.z = -Math.PI / 2; nose.scale.set(1, 1.7, 1); nose.position.set(2.1, .95, 0);
    const tail = add(new THREE.Mesh(new THREE.ConeGeometry(.4, 1.5, 40), M.white)); tail.rotation.z = Math.PI / 2; tail.position.set(-2.85, 1.05, 0); tail.scale.set(1, 1, .9);
    const plan = (pts, depth) => { const s = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b))); return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 1 }); };
    for (const side of [1, -1]) {
      const wg = plan([[.7, 0], [-.7, 0], [-1.55, 2.05], [-1.05, 2.05]], .06); wg.rotateX(-Math.PI / 2); const w = add(new THREE.Mesh(wg, M.white)); w.scale.z = side; w.position.set(.2, .66, side * .2);
      const hg = plan([[-2.5, 0], [-3.1, 0], [-3.45, .95], [-3.15, .95]], .04); hg.rotateX(-Math.PI / 2); const h = add(new THREE.Mesh(hg, M.white)); h.scale.z = side; h.position.set(0, 1.12, side * .1);
      const e = add(new THREE.Mesh(new THREE.CylinderGeometry(.17, .15, .7, 32), M.light)); e.rotation.z = Math.PI / 2; e.position.set(.05, .5, side * 1.0);
      const ei = add(new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .02, 32), M.dark)); ei.rotation.z = Math.PI / 2; ei.position.set(.41, .5, side * 1.0);
      box(3.4, .06, .01, M.dark, .1, .99, side * .396, .004);
      add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .08, 16), M.dark)).position.set(-.3, .07, side * .45);
    }
    const vg = plan([[-2.35, 0], [-3.2, 0], [-3.5, 1.15], [-3.1, 1.15]], .05); const v = add(new THREE.Mesh(vg, M.red)); v.position.set(0, 1.25, -.035);
    box(.3, .1, .5, M.dark, 2.35, 1.02, 0, .04); add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .08, 16), M.dark)).position.set(1.8, .07, 0);
    void shade;
  },
  jetbridge({ box, cyl }, M, len = 1.8) { cyl(.34, 1.25, M.light, 0, 0, 0, 32); box(len, .55, .6, M.light, len / 2, .95, 0, .04); cyl(.06, .95, M.metal, len - .4, 0, 0); box(.5, .62, .78, M.grey, len, .92, 0, .05); },
  fids({ cyl, box }, M) { cyl(.04, 1.7, M.metal, 0, 0, 0); for (const z of [-.04, .04]) box(1.0, .56, .05, M.dark, 0, 1.4, z, .02); box(.92, .48, .005, M.screen, 0, 1.44, .068, .002); },
  cell({ box, g }, M) {
    box(2.4, .04, 2.2, M.light, 0, 0, 0, .01);
    for (const [x, z] of [[-1.2, -1.1], [0, -1.1], [1.2, -1.1], [-1.2, 0], [1.2, 0], [-1.2, .9], [1.2, .9]]) box(.05, 1.3, .05, M.yellow, x, 0, z, .01);
    box(2.42, .05, .05, M.yellow, 0, 1.3, -1.1, .01); for (const x of [-1.2, 1.2]) box(.05, .05, 2.0, M.yellow, x, 1.3, -.1, .01);
    const pane = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.2), M.fence); m.position.set(x, .66, z); m.rotation.y = ry; g.add(m); };
    pane(2.4, 0, -1.1, 0); pane(2.0, -1.2, -.1, Math.PI / 2); pane(2.0, 1.2, -.1, Math.PI / 2);
    const base = new THREE.Group(); base.position.set(0, .04, .1); g.add(base);
    const k = kit(base, M); k.cyl(.26, .2, M.dark, 0, 0, 0, 32);
    const turret = new THREE.Group(); turret.position.y = .2; base.add(turret); const kt = kit(turret, M); kt.cyl(.2, .3, M.red, 0, 0, 0, 32);
    const upper = new THREE.Group(); upper.position.y = .3; turret.add(upper); kit(upper, M).box(.16, .95, .18, M.red, 0, 0, 0, .06);
    const fore = new THREE.Group(); fore.position.y = .95; upper.add(fore); const kf = kit(fore, M); kf.box(.13, .75, .14, M.red, 0, 0, 0, .05); kf.box(.1, .16, .1, M.dark, 0, .75, 0, .03);
    const ph = Math.random() * 6;
    return (t) => { turret.rotation.y = Math.sin(t * .6 + ph) * .7; upper.rotation.x = .55 + Math.sin(t * .8 + ph) * .25; fore.rotation.x = 1.05 + Math.sin(t * .8 + ph + 1.2) * .3; };
  },
  conveyor({ box }, M, L = 10) {
    box(L, .55, .7, M.grey, 0, 0, 0, .02); box(L, .03, .6, M.dark, 0, .55, 0, .005); for (const z of [-.33, .33]) box(L, .07, .04, M.metal, 0, .55, z, .01);
    const items = Array.from({ length: 9 }, () => box(.4, .26, .4, M.carton, 0, .58, 0, .02));
    return (t) => items.forEach((b, i) => { const f = (i / items.length + t * .03) % 1; b.position.x = (f - .5) * L * .96; const s = clamp(Math.min(f, 1 - f) * 16); b.scale.set(s, s, s); });
  },
  cabinet({ box }, M) { box(.8, 1.8, .45, M.light, 0, 0, 0, .02); box(.01, 1.68, .01, M.grey, 0, .06, .228, .003); box(.03, .2, .02, M.dark, .32, .8, .23, .005); box(.2, .12, .005, M.screen, -.18, 1.4, .226, .002); },
  vwall({ box }, M) { box(2.5, 1.3, .08, M.dark, 0, .5, 0, .02); for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) box(.78, .58, .005, M.screen, (c - 1) * .8, .55 + r * .6, .042, .002); },
  shelf({ box }, M) {
    for (const x of [-1.3, 0, 1.3]) for (const z of [-.42, .42]) box(.06, 1.9, .06, M.slate, x, 0, z, .01);
    for (const y of [.12, 1.0]) { for (const z of [-.42, .42]) box(2.66, .07, .05, M.red, 0, y, z, .01); for (const x of [-.65, .65]) { box(1.1, .12, .8, M.wood, x, y + .07, 0, .01); box(1.0, .6, .76, M.carton, x, y + .19, 0, .02); } }
  },
  palletbox({ box }, M) { box(1.1, .14, 1.1, M.wood, 0, 0, 0, .01); box(1.0, .72, 1.0, M.carton, 0, .14, 0, .02); box(1.02, .05, 1.02, M.light, 0, .6, 0, .01); },
  tank({ cyl, hcyl, box }, M) {
    for (let i = 0; i < 3; i++) { const a = i * 2.094; cyl(.04, .32, M.steel, Math.cos(a) * .42, 0, Math.sin(a) * .42); }
    cyl(.55, .12, M.steel, 0, .3, 0, 40, .55); cyl(.55, 1.9, M.steel, 0, .42, 0, 48); cyl(.565, .42, M.metal, 0, 1.55, 0, 48); cyl(.55, .34, M.steel, 0, 2.32, 0, 48, .1);
    hcyl(.17, .05, M.dark, 0, .82, .55, 'z'); box(.03, 1.1, .03, M.glass, .4, .6, .4, .01); cyl(.06, .14, M.metal, 0, 2.66, 0);
  },
  catwalk({ box, cyl }, M, L = 6) {
    box(L, .05, .7, M.metal, 0, 2.15, 0, .01);
    for (const z of [-.34, .34]) { box(L, .03, .03, M.metal, 0, 3.0, z, .01); box(L, .03, .03, M.metal, 0, 2.6, z, .01); for (let x = -L / 2; x <= L / 2 + .01; x += L / 6) cyl(.015, .85, M.metal, x, 2.18, z, 8); }
    for (const x of [-L / 2 + .1, L / 2 - .1]) for (const z of [-.3, .3]) cyl(.035, 2.15, M.metal, x, 0, z, 12);
  },
  barrels({ g, box }, M, n = 7) {
    const prof = [[.2, -.42], [.27, -.3], [.3, 0], [.27, .3], [.2, .42]].map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(prof, 28), hoop = new THREE.TorusGeometry(1, .012, 6, 28);
    for (const x of [-(n * .66) / 2, (n * .66) / 2]) box(.08, .1, .9, M.woodDark, x, 0, 0, .01);
    box(n * .66 + .1, .06, .08, M.woodDark, 0, .1, -.3, .01); box(n * .66 + .1, .06, .08, M.woodDark, 0, .1, .3, .01);
    const put = (x, y) => { const b = new THREE.Mesh(geo, M.wood); b.rotation.x = Math.PI / 2; b.position.set(x, y, 0); b.castShadow = b.receiveShadow = true; g.add(b);
      for (const [z, r] of [[-.36, .225], [-.2, .28], [.2, .28], [.36, .225]]) { const h = new THREE.Mesh(hoop, M.dark); h.scale.set(r, r, 1); h.position.set(x, y, z); g.add(h); } };
    for (let i = 0; i < n; i++) put((i - (n - 1) / 2) * .66, .46);
    for (let i = 0; i < n - 1; i++) put((i - (n - 2) / 2) * .66, 1.0);
  },
  bottling({ box, g }, M, L = 8) {
    box(L, .85, .3, M.grey, 0, 0, 0, .02); box(L, .02, .16, M.metal, 0, .85, 0, .005); for (const z of [-.12, .12]) box(L, .1, .02, M.metal, 0, .87, z, .005);
    const prof = [[0, 0], [.05, 0], [.05, .17], [.02, .23], [.016, .3], [0, .3]].map(([r, y]) => new THREE.Vector2(r, y)), geo = new THREE.LatheGeometry(prof, 16);
    const bots = Array.from({ length: 28 }, () => { const m = new THREE.Mesh(geo, M.bottle); m.position.y = .87; m.castShadow = true; g.add(m); return m; });
    return (t) => bots.forEach((b, i) => { const f = (i / bots.length + t * .04) % 1; b.position.x = (f - .5) * L * .97; const s = clamp(Math.min(f, 1 - f) * 30); b.scale.set(s, s, s); });
  },
  filler({ cyl, g }, M) {
    cyl(.6, .9, M.steel, 0, 0, 0, 48); cyl(.64, .05, M.light, 0, .9, 0, 48); cyl(.08, .5, M.metal, 0, .95, 0); cyl(.3, .2, M.steel, 0, 1.4, 0, 32);
    const rot = new THREE.Group(); rot.position.y = .95; g.add(rot);
    const prof = [[0, 0], [.05, 0], [.05, .17], [.02, .23], [.016, .3], [0, .3]].map(([r, y]) => new THREE.Vector2(r, y)), geo = new THREE.LatheGeometry(prof, 16);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, m = new THREE.Mesh(geo, M.bottle); m.position.set(Math.cos(a) * .5, 0, Math.sin(a) * .5); m.castShadow = true; rot.add(m); }
    return (t) => { rot.rotation.y = t * .35; };
  },
  labeler({ box, hcyl }, M) { box(.8, 1.1, .6, M.white, 0, 0, -.45, .03); box(.8, .06, .02, M.red, 0, .9, -.14, .005); hcyl(.18, .08, M.light, .2, .7, -.12, 'z'); },
  col({ box }, M) { box(.34, 1.05, .34, M.concrete, 0, 0, 0, .01); },
  core({ box }, M) {
    const t = .14, h = 1.05, s = 2.6;
    box(s, h, t, M.concrete, 0, 0, -s / 2, .01); box(t, h, s, M.concrete, -s / 2, 0, 0, .01); box(t, h, s, M.concrete, s / 2, 0, 0, .01);
    box(.9, h, t, M.concrete, -.85, 0, s / 2, .01); box(.5, h, t, M.concrete, 1.05, 0, s / 2, .01);
    box(t, h, 1.2, M.concrete, 0, 0, -.7, .01); box(1.3, h, t, M.concrete, -.65, 0, -.05, .01);
    for (const x of [-.95, -.35]) { box(.5, h * .9, .02, M.metal, x, 0, -.02, .005); box(.42, .02, 1.0, M.dark, x, .02, -.62, .005); }
    for (let i = 0; i < 8; i++) box(1.1, .12 * (i + 1), .2, M.light, .65, 0, 1.15 - i * .2 - .1, .005);
  },
  desks({ sub, box }, M, n = 3) {
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 1.4; BUILD.desk(sub(x, -.42, 0), M); BUILD.desk(sub(x, .42, Math.PI), M); }
    box(n * 1.4, .36, .03, M.light, 0, .74, 0, .01);
  },
  mtable({ box, sub, cyl }, M) {
    box(2.4, .05, 1.0, M.white, 0, .72, 0, .02); for (const x of [-.8, .8]) cyl(.05, .72, M.metal, x, 0, 0);
    for (const x of [-.75, 0, .75]) for (const s of [1, -1]) { const c = sub(x, s * .72, s > 0 ? 0 : Math.PI); c.box(.44, .06, .42, M.fabric, 0, .42, 0, .03); c.box(.42, .42, .05, M.fabric, 0, .46, .2, .03); c.cyl(.025, .42, M.dark, 0, 0, 0); }
  },
  reel({ hcyl }, M) { for (const z of [-.24, .24]) hcyl(.42, .05, M.wood, 0, .42, z, 'z', 36); hcyl(.32, .43, M.red, 0, .42, 0, 'z', 36); },
  crane({ bar, box, g }, M) {
    const H = 3.5, s = .2, Y = M.yellow;
    for (const [x, z] of [[-s, -s], [s, -s], [s, s], [-s, s]]) bar([x, 0, z], [x, H, z], .045, Y);
    for (let y = 0; y < H - .1; y += .42) { const y2 = y + .42; bar([-s, y, -s], [s, y2, -s], .022, Y); bar([s, y, s], [-s, y2, s], .022, Y); bar([-s, y, s], [-s, y2, -s], .022, Y); bar([s, y, -s], [s, y2, s], .022, Y); }
    box(.6, .25, .6, Y, 0, H, 0, .03); box(.34, .34, .38, M.white, .3, H + .25, .32, .04);
    const J = 6.6, C = 2.1, yb = H + .3, yt = H + .66;
    for (const z of [-.15, .15]) bar([C, yb, z], [-J, yb, z], .04, Y); bar([0, yt, 0], [-J + .2, yt, 0], .04, Y);
    for (let x = 0; x > -J + .3; x -= .45) { bar([x, yb, -.15], [x - .225, yt, 0], .02, Y); bar([x, yb, .15], [x - .225, yt, 0], .02, Y); bar([x - .225, yt, 0], [x - .45, yb, -.15], .02, Y); bar([x - .225, yt, 0], [x - .45, yb, .15], .02, Y); }
    bar([0, H + .25, 0], [0, H + 1.5, 0], .07, Y); bar([0, H + 1.5, 0], [-3.4, yt, 0], .015, M.dark); bar([0, H + 1.5, 0], [C, yb, 0], .015, M.dark);
    box(.55, .5, .5, M.concrete, C - .3, yb - .52, 0, .02); box(.24, .1, .3, M.dark, -3.4, yb - .12, 0, .01); bar([-3.4, yb - .12, 0], [-3.4, 1.9, 0], .012, M.dark); box(.18, .18, .14, Y, -3.4, 1.72, 0, .03);
    void g;
  },
  mast({ bar, box, hcyl }, M, H = 3) {
    const rad = (y) => .34 - .2 * (y / H), P = (k, y) => [Math.cos(k * 2.094) * rad(y), y, Math.sin(k * 2.094) * rad(y)];
    box(1.0, .08, 1.0, M.concrete, 0, 0, 0, .01);
    const seg = H / 8;
    for (let i = 0; i < 8; i++) { const y0 = i * seg, y1 = y0 + seg, m = i % 2 ? M.white : M.red; for (let k = 0; k < 3; k++) { bar(P(k, y0), P(k, y1), .04, m); bar(P(k, y0), P(k + 1, y1), .014, M.metal); } }
    for (const [y, a] of [[H * .78, 0], [H * .62, 2.6]]) { const d = hcyl(.25, .16, M.white, Math.cos(a) * .3, y, Math.sin(a) * .3, 'x', 32); d.rotation.set(0, -a, Math.PI / 2); }
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + .5; box(.12, .55, .06, M.white, Math.cos(a) * .22, H - .5, Math.sin(a) * .22, .02, -a); }
  },
  container({ box }, M) {
    box(2.4, .95, .95, M.white, 0, 0, 0, .02); for (let x = -1.1; x <= 1.11; x += .275) box(.03, .9, .97, M.light, x, .02, 0, .005);
    box(.8, .3, .01, M.dark, -.3, .45, .48, .005); box(.4, .3, .25, M.grey, .8, .3, .6, .02);
  },
  building({ box, hcyl }, M) {
    box(2.2, 1.0, 1.6, M.white, 0, 0, 0, .03); box(2.22, .26, 1.62, M.slate, 0, .55, 0, .01); box(2.26, .06, 1.66, M.light, 0, 1.0, 0, .01);
    box(.4, .2, .3, M.grey, -.5, 1.06, -.3, .02); box(.4, .2, .3, M.grey, 0, 1.06, -.3, .02); const d = hcyl(.18, .1, M.white, .65, 1.3, .3, 'x'); d.rotation.set(0, .6, Math.PI / 2);
  },
  pile({ shade }, M, r = 1) { const m = shade(new THREE.Mesh(new THREE.ConeGeometry(r, r * .75, 40, 1), M.rockSide)); m.position.y = r * .375; },
  shovel({ box, bar }, M) {
    for (const z of [-.32, .32]) box(1.2, .22, .26, M.dark, 0, 0, z, .08);
    box(1.0, .5, .8, M.yellow, -.1, .26, 0, .04); box(.36, .36, .34, M.white, .26, .76, .24, .04); box(.3, .3, .7, M.slate, -.5, .3, 0, .03);
    bar([.35, .7, 0], [1.25, 1.45, 0], .14, M.yellow); bar([1.25, 1.45, 0], [1.55, 1.3, 0], .1, M.yellow); box(.42, .38, .5, M.dark, 1.6, 1.0, 0, .05);
  },
  genset({ box, cyl }, M) { box(1.6, .8, .8, M.light, 0, 0, 0, .03); box(.02, .5, .6, M.dark, .8, .12, 0, .005); cyl(.05, .55, M.dark, -.5, .8, .2, 12); },
  truck({ box, hcyl }, M) {
    box(1.3, .18, .6, M.dark, 0, .24, 0, .02);
    for (const [x, z] of [[.5, .38], [.5, -.38], [-.42, .4], [-.42, -.4]]) hcyl(.22, .16, M.dark, x, .22, z, 'z', 24);
    box(1.0, .38, .86, M.yellow, -.18, .42, 0, .04); box(.5, .05, .86, M.yellow, .44, .84, 0, .02); box(.9, .12, .74, M.rock, -.18, .8, 0, .06);
    box(.3, .3, .3, M.white, .5, .42, .26, .03); box(.06, .3, .62, M.dark, .66, .34, 0, .01);
  },
};

// ---------- drawn layers
function canvasTex(ppu, draw) {
  const cv = document.createElement('canvas'); cv.width = W * ppu; cv.height = D * ppu;
  const g = cv.getContext('2d'); g.scale(ppu, ppu); g.translate(W / 2, D / 2); // plan metres, z down
  g.lineJoin = g.lineCap = 'round'; draw(g, ppu);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const text = (g, s, x, z, size, color, weight = 600, align = 'left') => { g.save(); g.font = `${weight} ${size}px ${FONT}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, z); g.restore(); };
// Canvas fonts are in plan metres; scale the context so 1 px font = 1/ppu m.
const label = (g, ppu, s, x, z, px, color, weight, align) => { g.save(); g.translate(x, z); g.scale(1 / ppu, 1 / ppu); if ('letterSpacing' in g) g.letterSpacing = weight >= 700 ? '0px' : '1.5px'; text(g, s, 0, 0, px, color, weight, align); g.restore(); };

const TONES = { a: '#f7f7f4', b: '#e8eae7', c: '#dce2e5', d: '#e4ebf1', e: '#dcdad3' };
function drawPlan(spec, ppu) {
  return canvasTex(ppu, (g) => {
    g.fillStyle = spec.ground ? '#e9e6df' : '#f3f3ef'; g.fillRect(-W / 2, -D / 2, W, D);
    g.strokeStyle = 'rgba(24,33,32,.045)'; g.lineWidth = .012; for (let x = -W / 2; x <= W / 2; x += .5) { g.beginPath(); g.moveTo(x, -D / 2); g.lineTo(x, D / 2); g.stroke(); } for (let z = -D / 2; z <= D / 2; z += .5) { g.beginPath(); g.moveTo(-W / 2, z); g.lineTo(W / 2, z); g.stroke(); }
    (spec.floor || []).forEach(([x1, z1, x2, z2, tone]) => { g.fillStyle = TONES[tone] || TONES.a; g.fillRect(x1, z1, x2 - x1, z2 - z1); g.strokeStyle = 'rgba(24,33,32,.12)'; g.lineWidth = .02; g.strokeRect(x1, z1, x2 - x1, z2 - z1); });
    (spec.marks || []).forEach(([pts, kind]) => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z)));
      if (kind === 2) { g.strokeStyle = '#cfcac0'; g.lineWidth = .7; g.stroke(); g.setLineDash([.25, .25]); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = .03; g.stroke(); }
      else { g.setLineDash([.3, .22]); g.strokeStyle = 'rgba(226,167,43,.9)'; g.lineWidth = .05; g.stroke(); } g.setLineDash([]); });
    (spec.floor || []).forEach(([x1, z1, , , , name]) => name && label(g, ppu, name.toUpperCase(), x1 + .24, z1 + .34, ppu * .2, '#6b737a', 700, 'left'));
    (spec.labels || []).forEach(([x, z, name]) => label(g, ppu, name.toUpperCase(), x, z, ppu * .2, '#6b737a', 700, 'left'));
  });
}

function drawLayer(layer, ppu) {
  const { color } = LAYER_STYLE[layer.svc];
  return canvasTex(ppu, (g) => {
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-W / 2, -D / 2, W, D);
    g.strokeStyle = rgba(color, .5); g.lineWidth = .025; g.strokeRect(-W / 2 + .02, -D / 2 + .02, W - .04, D - .04);
    g.strokeStyle = rgba(color, .07); g.lineWidth = .01; for (let x = -W / 2; x <= W / 2; x += 1) { g.beginPath(); g.moveTo(x, -D / 2); g.lineTo(x, D / 2); g.stroke(); } for (let z = -D / 2; z <= D / 2; z += 1) { g.beginPath(); g.moveTo(-W / 2, z); g.lineTo(W / 2, z); g.stroke(); }
    for (const it of layer.items) {
      const [k] = it;
      if (k === 'zone') { const [, x1, z1, x2, z2, name] = it; g.save(); g.beginPath(); g.rect(x1 + .08, z1 + .08, x2 - x1 - .16, z2 - z1 - .16); g.clip(); g.strokeStyle = rgba(color, .13); g.lineWidth = .025; for (let s = -20; s < 20; s += .28) { g.beginPath(); g.moveTo(x1 + s, z1); g.lineTo(x1 + s + 12, z1 + 12); g.stroke(); } g.restore();
        g.setLineDash([.18, .12]); g.strokeStyle = rgba(color, .6); g.lineWidth = .03; g.strokeRect(x1 + .08, z1 + .08, x2 - x1 - .16, z2 - z1 - .16); g.setLineDash([]); label(g, ppu, name.toUpperCase(), x2 - .25, z2 - .32, ppu * .15, color, 700, 'right'); }
      if (k === 'tray') { const pts = it[1]; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); g.strokeStyle = rgba(color, .2); g.lineWidth = .26; g.stroke(); g.strokeStyle = color; g.lineWidth = .065; g.stroke(); }
      if (k === 'link') { const [, a, b] = it, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        g.save(); g.translate(mx, mz); g.rotate(ang); g.beginPath(); g.ellipse(0, 0, len / 2, Math.min(.55, len * .06), 0, 0, Math.PI * 2); g.fillStyle = rgba(color, .08); g.fill(); g.strokeStyle = rgba(color, .35); g.lineWidth = .02; g.stroke(); g.restore();
        g.setLineDash([.25, .14]); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.strokeStyle = rgba(color, .95); g.lineWidth = .05; g.stroke(); g.setLineDash([]); }
      if (k === 'ap') { const [, x, z, r] = it; g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.fillStyle = rgba(color, .06); g.fill(); g.setLineDash([.12, .1]); g.strokeStyle = rgba(color, .55); g.lineWidth = .025; g.stroke(); g.setLineDash([]);
        for (const rr of [r * .33, r * .66]) { g.beginPath(); g.arc(x, z, rr, 0, Math.PI * 2); g.strokeStyle = rgba(color, .18); g.lineWidth = .015; g.stroke(); } }
      if (k === 'cam') { const [, x, z, a, len] = it, t = a * Math.PI / 180, h = .45; g.beginPath(); g.moveTo(x, z); g.arc(x, z, len, t - h, t + h); g.closePath(); const gr = g.createRadialGradient(x, z, 0, x, z, len); gr.addColorStop(0, rgba(color, .28)); gr.addColorStop(1, rgba(color, .03)); g.fillStyle = gr; g.fill(); g.strokeStyle = rgba(color, .5); g.lineWidth = .02; g.stroke(); }
      if (k === 'det') { const [, x, z] = it; g.beginPath(); g.arc(x, z, .13, 0, Math.PI * 2); g.strokeStyle = rgba(color, .9); g.lineWidth = .035; g.stroke(); g.beginPath(); g.arc(x, z, .045, 0, Math.PI * 2); g.fillStyle = color; g.fill(); }
      if (k === 'dot') { const [, x, z] = it; g.beginPath(); g.arc(x, z, .085, 0, Math.PI * 2); g.fillStyle = color; g.fill(); g.beginPath(); g.arc(x, z, .16, 0, Math.PI * 2); g.strokeStyle = rgba(color, .35); g.lineWidth = .02; g.stroke(); }
      if (k === 'reader') { const [, x, z] = it; g.fillStyle = color; g.fillRect(x - .08, z - .08, .16, .16); g.strokeStyle = rgba(color, .35); g.lineWidth = .02; g.strokeRect(x - .17, z - .17, .34, .34); }
      if (k === 'node') { const [, x, z, name] = it; g.fillStyle = color; g.beginPath(); g.roundRect(x - .2, z - .13, .4, .26, .05); g.fill(); label(g, ppu, name, x + .3, z, ppu * .17, INK, 700, 'left'); }
      if (k === 'fiber') { const pts = it[1]; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); g.strokeStyle = rgba(color, .18); g.lineWidth = .3; g.stroke(); g.strokeStyle = color; g.lineWidth = .085; g.stroke(); g.setLineDash([.14, .1]); g.strokeStyle = '#fff'; g.lineWidth = .03; g.stroke(); g.setLineDash([]); }
      if (k === 'loop') { const pts = it[1]; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); g.closePath(); g.strokeStyle = rgba(color, .85); g.lineWidth = .035; g.stroke(); }
      if (k === 'pipe') { const pts = it[1]; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); g.strokeStyle = rgba(color, .55); g.lineWidth = .1; g.stroke(); for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / .45)); for (let j = 0; j <= n; j++) { g.beginPath(); g.arc(ax + (bx - ax) * j / n, az + (bz - az) * j / n, .035, 0, 7); g.fillStyle = '#fff'; g.fill(); } } }
      if (k === 'cov') { const [, x, z, r] = it; g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.fillStyle = rgba(color, .05); g.fill(); g.setLineDash([.16, .12]); g.strokeStyle = rgba(color, .5); g.lineWidth = .025; g.stroke(); g.setLineDash([]); for (const rr of [r * .5, r * .75]) { g.beginPath(); g.arc(x, z, rr, 0, Math.PI * 2); g.strokeStyle = rgba(color, .14); g.lineWidth = .015; g.stroke(); } }
      if (k === 'heat') { const [, x, z] = it; for (const r of [.14, .07]) { g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.strokeStyle = color; g.lineWidth = .03; g.stroke(); } }
      if (k === 'mcp' || k === 'module') { const [, x, z] = it; g.fillStyle = color; g.fillRect(x - .11, z - .11, .22, .22); g.fillStyle = '#fff'; k === 'mcp' ? g.fillRect(x - .05, z - .05, .1, .1) : g.fillRect(x - .02, z - .08, .04, .16); }
      if (k === 'siren') { const [, x, z] = it; g.beginPath(); g.moveTo(x, z - .14); g.lineTo(x + .13, z + .1); g.lineTo(x - .13, z + .1); g.closePath(); g.fillStyle = color; g.fill(); }
      if (k === 'phone') { const [, x, z] = it; g.fillStyle = color; g.beginPath(); g.roundRect(x - .08, z - .13, .16, .26, .04); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - .045, z - .08, .09, .08); }
      if (k === 'speaker' || k === 'radio') { const [, x, z] = it; g.fillStyle = color; if (k === 'speaker') { g.beginPath(); g.moveTo(x - .1, z - .05); g.lineTo(x - .02, z - .05); g.lineTo(x + .06, z - .12); g.lineTo(x + .06, z + .12); g.lineTo(x - .02, z + .05); g.lineTo(x - .1, z + .05); g.closePath(); g.fill(); } else { g.fillRect(x - .02, z - .12, .04, .24); }
        for (const r of [.16, .26]) { g.beginPath(); g.arc(k === 'speaker' ? x + .04 : x, z, r, -.7, .7); if (k === 'radio') g.arc(x, z, r, Math.PI - .7, Math.PI + .7); g.strokeStyle = rgba(color, .6); g.lineWidth = .02; g.stroke(); } }
      if (k === 'bio') { const [, x, z] = it; g.strokeStyle = color; g.lineWidth = .03; g.strokeRect(x - .13, z - .13, .26, .26); for (const r of [.04, .08]) { g.beginPath(); g.arc(x, z + .03, r, Math.PI, 2 * Math.PI); g.stroke(); } }
      if (k === 'pir') { const [, x, z, a = 45] = it, t = a * Math.PI / 180; g.beginPath(); g.moveTo(x, z); g.arc(x, z, .9, t - .7, t + .7); g.closePath(); g.fillStyle = rgba(color, .1); g.fill(); g.strokeStyle = rgba(color, .45); g.lineWidth = .015; g.stroke(); g.beginPath(); g.arc(x, z, .06, 0, 7); g.fillStyle = color; g.fill(); }
      if (k === 'sensor') { const [, x, z] = it; g.beginPath(); g.moveTo(x, z - .12); g.lineTo(x + .12, z); g.lineTo(x, z + .12); g.lineTo(x - .12, z); g.closePath(); g.fillStyle = color; g.fill(); }
      if (k === 'card') { const [, x, z, title, sub, hot] = it, w = 3.0, h = 1.0; g.save(); g.shadowColor = 'rgba(24,33,32,.12)'; g.shadowBlur = ppu * .12; g.shadowOffsetY = ppu * .03;
        g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(x - w / 2, z - h / 2, w, h, .1); g.fill(); g.restore(); g.strokeStyle = hot ? rgba(RED, .7) : 'rgba(24,33,32,.14)'; g.lineWidth = .02; g.beginPath(); g.roundRect(x - w / 2, z - h / 2, w, h, .1); g.stroke();
        g.fillStyle = hot ? RED : color; g.fillRect(x - w / 2 + .14, z - h / 2 + .18, .05, h - .36);
        label(g, ppu, title, x - w / 2 + .34, z - .17, ppu * .23, INK, 700, 'left'); label(g, ppu, sub, x - w / 2 + .34, z + .2, ppu * .18, MUTE, 500, 'left'); }
    }
  });
}

// Polyline helper with arc-length lookup.
function poly(pts) {
  const v = pts.map((p) => new THREE.Vector3(...p)), acc = [0];
  for (let i = 1; i < v.length; i++) acc.push(acc[i - 1] + v[i].distanceTo(v[i - 1]));
  const len = acc[acc.length - 1] || 1;
  const at = (u, out = new THREE.Vector3()) => { const s = clamp(u) * len; let i = 1; while (i < acc.length - 1 && acc[i] < s) i++; const f = (s - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]); return out.lerpVectors(v[i - 1], v[i], f); };
  const near = (p) => { let best = 0, bd = 1e9; for (let i = 1; i < v.length; i++) { const a = v[i - 1], b = v[i], ab = b.clone().sub(a), f = clamp(p.clone().sub(a).dot(ab) / ab.lengthSq()), q = a.clone().addScaledVector(ab, f), d = q.distanceTo(p); if (d < bd) { bd = d; best = (acc[i - 1] + f * ab.length()) / len; } } return best; };
  return { at, len, near };
}


export async function mountSector(host, spec) {
  const stage = host.querySelector('[data-scode-stage]') || host;
  const freeze = new URLSearchParams(location.search).has('t') ? Number(new URLSearchParams(location.search).get('t')) : null;
  const driven = freeze === null && !!host.querySelector('[data-scode-ch]'), snap = new URLSearchParams(location.search).has('ch');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { await Promise.all([document.fonts.load(`700 20px ${FONT}`), document.fonts.load(`600 20px ${FONT}`), document.fonts.load(`500 20px ${FONT}`)]); } catch { /* fallback font */ }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap; renderer.setClearColor(0x000000, 0);
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const hemi = new THREE.HemisphereLight(0xffffff, 0xdfe2df, .6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.1); sun.position.set(-6, 14, 8); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 10; sun.shadow.blurSamples = 16; sun.shadow.bias = -.0004;
  scene.add(sun);
  const M = materials(), ppu = innerWidth < 800 ? 72 : spec.layers.length > 4 ? 100 : 128;

  // Floor block: the place's plan on top; a terraced pit when the spec has one.
  const rr = (s, cx, cz, w, d, r) => { const x = cx - w / 2, y = -cz - d / 2; r = Math.min(r, w / 2, d / 2); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const pit = spec.pit, depthAll = pit ? pit.steps * pit.step + .3 : .3;
  const slab = (shape, top, mats) => { const ge = new THREE.ExtrudeGeometry(shape, { depth: top + depthAll, bevelEnabled: false, curveSegments: 24 }); ge.rotateX(-Math.PI / 2); ge.translate(0, -depthAll, 0); const m = new THREE.Mesh(ge, mats); m.receiveShadow = true; m.castShadow = true; scene.add(m); return m; };
  const plan = drawPlan(spec, ppu); plan.repeat.set(1 / W, 1 / D); plan.offset.set(.5, .5); plan.wrapS = plan.wrapT = THREE.ClampToEdgeWrapping;
  const planMat = new THREE.MeshStandardMaterial({ map: plan, roughness: .95 }), sideMat = new THREE.MeshStandardMaterial({ color: pit ? 0xc4b9a8 : 0xe6e7e3, roughness: .9 });
  const outer = rr(new THREE.Shape(), 0, 0, W, D, .06);
  if (pit) {
    outer.holes.push(rr(new THREE.Path(), pit.x, pit.z, pit.w, pit.d, 1.4)); slab(outer, 0, [planMat, sideMat]);
    for (let k = 1; k <= pit.steps; k++) { const i0 = (k - 1) * pit.inset, i1 = k * pit.inset, s = rr(new THREE.Shape(), pit.x, pit.z, pit.w - 2 * i0, pit.d - 2 * i0, Math.max(.3, 1.4 - i0));
      if (k < pit.steps) s.holes.push(rr(new THREE.Path(), pit.x, pit.z, pit.w - 2 * i1, pit.d - 2 * i1, Math.max(.3, 1.4 - i1))); slab(s, -k * pit.step, [M.rock, M.rockSide]); }
  } else slab(outer, 0, [planMat, sideMat]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .16 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -depthAll - .002; ground.receiveShadow = true; scene.add(ground);

  // Walls and glass (low, cut-away like an architectural plan).
  const pieces = [], updates = [];
  const wallSeg = ([x1, z1, x2, z2], glass) => {
    const g = new THREE.Group(), len = Math.hypot(x2 - x1, z2 - z1); g.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2); g.rotation.y = -Math.atan2(z2 - z1, x2 - x1); scene.add(g);
    const k = kit(g, M);
    if (glass) { const p = new THREE.Mesh(new THREE.BoxGeometry(len, .9, .02), M.glass); p.position.y = .47; g.add(p); k.box(len, .04, .06, M.slate, 0, 0, 0, .005); k.box(len, .03, .05, M.slate, 0, .92, 0, .005); for (let x = -len / 2; x <= len / 2 + .01; x += len / Math.max(1, Math.round(len / .9))) k.box(.03, .92, .05, M.slate, x, 0, 0, .005); }
    else { k.box(len + .08, .55, .08, M.white, 0, 0, 0, .01); k.box(len + .08, .012, .084, M.cap, 0, .55, 0, .002); }
    pieces.push({ g, at: 0, kind: 'wall', y0: 0 });
  };
  (spec.walls || []).forEach((w) => wallSeg(w, false)); (spec.glass || []).forEach((w) => wallSeg(w, true));
  spec.pieces.forEach(([kind, x, z, r = 0, arg, y], i) => {
    const g = new THREE.Group(); const yArg = (kind === 'truck' || kind === 'shovel') && typeof arg === 'number'; g.position.set(x, yArg ? arg : (y || 0), z); g.rotation.y = r * Math.PI / 180; scene.add(g);
    const up = BUILD[kind](kit(g, M), M, yArg ? undefined : arg); if (up) updates.push(up);
    pieces.push({ g, at: .3 + i * .1, kind, y0: g.position.y });
  });

  // A layer is drawn in from its source (the board, the rack, the central): a front in the
  // layer's colour sweeps out and leaves the drawing behind it.
  const plateMaterial = (tex, col) => new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, opacity: { value: 1 }, fill: { value: 1 }, reveal: { value: 99 }, origin: { value: new THREE.Vector2() }, tint: { value: new THREE.Color(col) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float opacity; uniform float fill; uniform float reveal; uniform vec2 origin; uniform vec3 tint; varying vec2 vUv;
      void main(){ vec4 c = texture2D(map, vUv); vec2 p = vec2((vUv.x - .5) * ${W}.0, (.5 - vUv.y) * ${D}.0); float d = distance(p, origin);
        float m = 1.0 - smoothstep(reveal - .6, reveal, d); float f = (1.0 - smoothstep(0.0, .3, abs(d - reveal))) * step(.05, reveal) * (1.0 - step(40.0, reveal));
        float ink = smoothstep(.04, .2, 1.0 - min(c.r, min(c.g, c.b))); float a = c.a * mix(fill, 1.0, ink);
        gl_FragColor = vec4(mix(c.rgb, tint, f * .7), max(a * m, f * .45) * opacity);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  // Layers: drawn plate + small 3D tokens, each with an HTML label (a link to its service).
  const labels = [...host.querySelectorAll('[data-scode-layer]')];
  const tokenMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .4 });
  const SMALL = new Set(['det', 'heat', 'mcp', 'siren', 'phone', 'speaker', 'reader', 'bio', 'sensor', 'radio']), smallGeo = new THREE.CylinderGeometry(.065, .065, .04, 16);
  const layers = spec.layers.map((layer, k) => {
    const grp = new THREE.Group(); scene.add(grp);
    const tex = drawLayer(layer, ppu);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(W, D), plateMaterial(tex, LAYER_STYLE[layer.svc].color));
    plate.rotation.x = -Math.PI / 2; plate.renderOrder = 10 + k; grp.add(plate);
    const col = new THREE.Color(LAYER_STYLE[layer.svc].color), tm = tokenMat(col), white = M.white;
    const toks = [];
    for (const it of layer.items) {
      if (it[0] === 'ap') { const a = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .06, 28), white); a.position.set(it[1], .03, it[2]); const b = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .065, 20), tm); b.position.copy(a.position); grp.add(a, b); toks.push(a, b); }
      if (it[0] === 'cam') { const a = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), white); a.position.set(it[1], 0, it[2]); grp.add(a); toks.push(a); }
      if (it[0] === 'node') { const tall = it[4] === 'rack' || it[4] === 'genset' || it[4] === 'ups' ? .42 : .22, a = new THREE.Mesh(new RoundedBoxGeometry(.4, tall, .26, 2, .04), it[4] === 'rack' ? M.dark : white); a.position.set(it[1], tall / 2, it[2]); const b = new THREE.Mesh(new THREE.BoxGeometry(.4, .02, .26), tm); b.position.set(it[1], tall + .01, it[2]); grp.add(a, b); toks.push(a, b); }
      if (SMALL.has(it[0])) { const a = new THREE.Mesh(smallGeo, tm); a.position.set(it[1], .02, it[2]); grp.add(a); toks.push(a); }
    }
    const routes = layer.items.filter((it) => ROUTE.has(it[0])).map((it) => poly((it[0] === 'link' ? [it[1], it[2]] : it[0] === 'loop' ? [...it[1], it[1][0]] : it[1]).map(([x, z]) => [x, .06, z])));
    const pulseMat = new THREE.MeshBasicMaterial({ color: col, toneMapped: false });
    const pulses = routes.flatMap((r, ri) => Array.from({ length: Math.max(1, Math.round(r.len / 3.5)) }, (_, j) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 10), pulseMat); grp.add(m); return { m, r, ph: j / Math.max(1, Math.round(r.len / 3.5)) + ri * .17 }; }));
    const src = layer.items.find((it) => it[0] === 'node') || layer.items.find((it) => ROUTE.has(it[0]) && it[0] !== 'link');
    const origin = !src ? [0, 0] : src[0] === 'node' ? [src[1], src[2]] : src[1][0];
    plate.material.uniforms.origin.value.set(origin[0], origin[1]);
    const maxR = Math.max(...[[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]].map(([x, z]) => Math.hypot(x - origin[0], z - origin[1]))) + .8;
    toks.forEach((m) => { m.userData.d = Math.hypot(m.position.x - origin[0], m.position.z - origin[1]); });
    return { grp, plate, toks, pulses, label: labels[k], svc: layer.svc, origin, maxR, items: layer.items, routes };
  });

  // Leaders (dashed verticals) and the moment.
  const NL = spec.layers.length, gap = NL > 4 ? 1.12 : GAP, topY = (k) => spec.lift + k * gap;
  const leaderMat = new THREE.LineDashedMaterial({ color: 0x182120, dashSize: .09, gapSize: .09, transparent: true, opacity: 0 });
  const leaders = spec.leaders.map(([x, z]) => { const ge = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, BASE_Y, z), new THREE.Vector3(x, topY(NL - 1), z)]); const l = new THREE.Line(ge, leaderMat); l.computeLineDistances(); scene.add(l); return l; });
  const lvlY = (p) => (p[1] < 0 ? (p[3] ?? BASE_Y) : topY(p[1]) + .07);
  const momentPath = poly(spec.moment.path.map((p) => [p[0], lvlY(p), p[2]]));
  const redMat = new THREE.MeshBasicMaterial({ color: 0xDC2626, toneMapped: false });
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 14), redMat); scene.add(spark);
  const trailN = 14, trail = Array.from({ length: trailN }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07 * (1 - i / trailN) + .02, 12, 8), new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: .5 * (1 - i / trailN), toneMapped: false })); scene.add(m); return m; });
  const stopsU = (spec.moment.stops || []).map((s) => (Array.isArray(s) ? momentPath.near(new THREE.Vector3(s[0], topY(spec.moment.level ?? 0) + .07, s[1])) : spec.moment.path.length > 1 ? momentPath.near(new THREE.Vector3(spec.moment.path[s][0], lvlY(spec.moment.path[s]), spec.moment.path[s][2])) : 0));
  const stopPts = stopsU.map((u) => momentPath.at(u).clone());
  const rings = stopPts.map((p) => { const m = new THREE.Mesh(new THREE.RingGeometry(.2, .26, 48), new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.copy(p).y += .02; scene.add(m); return m; });

  // Camera: two framings (the place; the open stack), fitted exactly to the stage.
  const cam = new THREE.PerspectiveCamera(22, 1, .1, 200);
  const bb = new THREE.Box3(); pieces.forEach((p) => bb.expandByObject(p.g)); bb.expandByPoint(new THREE.Vector3(-W / 2, -depthAll, -D / 2)).expandByPoint(new THREE.Vector3(W / 2, 0, D / 2));
  const boxOpen = bb.clone().expandByPoint(new THREE.Vector3(W / 2, topY(NL - 1), D / 2));
  let aspect = 1, offset = 0;
  const fit = (box3, az, el) => {
    const c = box3.getCenter(new THREE.Vector3()), dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const fwd = dir.clone().negate(), right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, fwd);
    const tv = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2), th = tv * aspect * (1 - 2 * offset);
    let d = 0; for (let i = 0; i < 8; i++) { const p = new THREE.Vector3(i & 1 ? box3.max.x : box3.min.x, i & 2 ? box3.max.y : box3.min.y, i & 4 ? box3.max.z : box3.min.z).sub(c); const x = p.dot(right), y = p.dot(up), z = p.dot(fwd); d = Math.max(d, Math.abs(x) / th - z, Math.abs(y) / tv - z); }
    return { c, pos: c.clone().addScaledVector(dir, d * (driven ? (stage.clientWidth >= 700 ? 1.18 : 1.04) : 1.1)) };
  };
  let A, B, BK = [], CAM = null;
  const camPos = new THREE.Vector3(), camC = new THREE.Vector3(); let camInit = false;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); aspect = w / h; cam.aspect = aspect;
    offset = driven ? (w >= 700 ? .11 : 0) : aspect > 1.25 ? .17 : 0; cam.fov = aspect < 1.1 ? 28 : 22;
    if (offset) cam.setViewOffset(w, h, -w * offset, 0, w, h); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    A = fit(bb, .62, .62); B = fit(boxOpen, .7, driven ? .36 : .48);
    // Driven pages frame the floor plus the active layer, a little more from above, so its drawing reads.
    BK = spec.layers.map((_, k) => fit(bb.clone().expandByPoint(new THREE.Vector3(W / 2, topY(k) + .4, D / 2)), .68, .5));
    // Each step has its own camera, and scrolling through it moves the camera a little.
    const P = { 108: [.95, .48], 101: [.4, .64], 103: [1.12, .42], 102: [.26, .54], 107: [.84, .62], 104: [.6, .36] };
    const boxM = bb.clone().expandByPoint(new THREE.Vector3(W / 2, topY(Math.max(0, ...spec.moment.path.map((q) => q[1]))) + .4, D / 2));
    CAM = { place: [fit(bb, .42, .64), fit(bb, .78, .58)], audit: [fit(bb, .62, 1.1), fit(bb, .62, 1.22)], moment: [fit(boxM, .58, .46), fit(boxM, .82, .46)],
      support: [fit(boxOpen, .5, .42), fit(boxOpen, .8, .42)], ficha: [fit(boxOpen, .66, .4), fit(boxOpen, .66, .4)],
      layers: spec.layers.map((l, k) => { const bx = bb.clone().expandByPoint(new THREE.Vector3(W / 2, topY(k) + .4, D / 2)), [az, el] = P[l.svc] || [.68, .5]; return [fit(bx, az - .09, el), fit(bx, az + .09, el)]; }) };
    if (ready && !driven && (reduce || freeze !== null)) render(reduce && freeze === null ? 13.4 : freeze, freeze !== null);
  }
  let ready = false;
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const caption = host.querySelector('[data-scode-caption]'), callout = host.querySelector('[data-scode-callout]');
  const momentTop = Math.max(0, ...spec.moment.path.map((p) => p[1]));
  const hot = momentPath.at(1).clone(); hot.y += .2; const desk = host.querySelector('[data-scode-desk]');
  if (freeze !== null) host.classList.add('is-frozen');
  let visible = freeze !== null, clock = 0, elapsed = 0, cycle = 0, lastNow = 0, raf = 0, lastStep = -1;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .02 }); io.observe(host);
  const tmp = new THREE.Vector3(), proj = new THREE.Vector3();

  // Highlight rings: the page points at a kind of piece (a layer's APs, the floor's beds...)
  // and every one of them rings in place.
  const ringGeo = new THREE.RingGeometry(.34, .44, 48);
  const pool = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 30; m.visible = false; scene.add(m); return m; });
  const kindPts = (layer, kind) => layer.items.filter((it) => it[0] === kind || (it[0] === 'node' && it[4] === kind)).flatMap((it) => (ROUTE.has(it[0]) && it[0] !== 'link' ? [it[1][0], it[1][it[1].length - 1]] : it[0] === 'link' ? [it[1], it[2]] : kind === 'zone' ? [[(it[1] + it[3]) / 2, (it[2] + it[4]) / 2]] : [[it[1], it[2]]]));
  let hl = null, hlT = 0;
  function setHighlight(h) {
    hl = h ? { ...h, pts: h.layer >= 0 ? kindPts(spec.layers[h.layer], h.kind) : pieces.filter((p) => p.kind === h.kind).map((p) => [p.g.position.x, p.g.position.z, p.y0]), color: h.layer >= 0 ? LAYER_STYLE[spec.layers[h.layer].svc].color : '#DC2626' } : null;
    hlT = 0; pieces.forEach((p) => { p.hlTarget = hl && hl.layer < 0 && p.kind === hl.kind ? 1 : 0; });
    pool.forEach((m, i) => { m.visible = !!hl && i < hl.pts.length; if (hl) m.material.color.set(hl.color); });
  }

  // Relevamiento (106): a scan crosses the plan and pins every piece of equipment it finds.
  const nodesAll = spec.layers.flatMap((l, k) => l.items.filter((it) => it[0] === 'node').map((it) => ({ k, x: it[1], z: it[2] })));
  const pinGeo = new THREE.ConeGeometry(.1, .28, 16); pinGeo.rotateX(Math.PI);
  const stemMat = new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: .45, toneMapped: false });
  const pins = nodesAll.map(({ x, z }) => { const g = new THREE.Group(); g.position.set(x, 0, z); const c = new THREE.Mesh(pinGeo, redMat); c.position.y = 2.55; const st = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 2.4, 6), stemMat); st.position.y = 1.2; g.add(c, st); g.visible = false; scene.add(g); return g; });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(D, 1.6), new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  scan.rotation.y = Math.PI / 2; scan.position.y = .8; scene.add(scan);
  // Soporte (105): every device reports in; one raises an alert, a ticket goes up to the
  // help desk and the fix comes back down.
  const okMat = new THREE.MeshBasicMaterial({ color: 0x1fae6b, toneMapped: false }), dotGeo = new THREE.SphereGeometry(.065, 12, 8);
  const health = nodesAll.map((n) => { const m = new THREE.Mesh(dotGeo, okMat); m.userData = n; m.visible = false; scene.add(m); return m; });
  const inc = spec.support || [0, 0, 0];
  const incRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); incRing.rotation.x = -Math.PI / 2; scene.add(incRing);
  const sSpark = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 10), redMat); sSpark.visible = false; scene.add(sSpark);
  // Broadcast (e.g. voceo): when the signal arrives, every device of a kind answers.
  const after = spec.moment.after ? kindPts(spec.layers[spec.moment.after[0]], spec.moment.after[1]) : [];
  const echo = after.map(() => { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; scene.add(m); return m; });
  // Each service has its own verb while its chapter is on screen.
  const flat = (geo, color, op = 0) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 25; scene.add(m); return m; };
  const tickGeo = new THREE.RingGeometry(.17, .25, 32), dotFill = new THREE.CircleGeometry(.11, 24);
  const verbs = layers.map((L, k) => {
    const v = { ticks: [], echoes: [], fans: [], dets: [], test: null, rise: [] };
    const pts = (kinds) => L.items.filter((it) => kinds.includes(it[0])).map((it) => [it[1], it[2]]);
    if (L.svc === 101) v.ticks = pts(['dot', 'ap']).map(([x, z]) => ({ x, z, d: Math.hypot(x - L.origin[0], z - L.origin[1]), r: flat(tickGeo, 0x1fae6b), c: flat(dotFill, 0x1fae6b) }));
    if (L.svc === 103) v.echoes = pts(['speaker', 'phone', 'radio']).map(([x, z]) => ({ x, z, r: flat(ringGeo, LAYER_STYLE[103].color) }));
    if (L.svc === 102) v.fans = L.items.filter((it) => it[0] === 'cam').map((it, i) => {
      const a = it[3] * Math.PI / 180, h = .45, g = new THREE.Group(); g.position.set(it[1], 0, it[2]); grpAdd(L, g);
      const m = new THREE.Mesh(new THREE.CircleGeometry(it[4] * .92, 32, -a - h, 2 * h), new THREE.MeshBasicMaterial({ color: LAYER_STYLE[102].color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = .03; m.renderOrder = 24; g.add(m); return { g, m, ph: i * 1.7 };
    });
    if (L.svc === 107) { const loopIt = L.items.find((it) => it[0] === 'loop'); if (loopIt) { const path = poly([...loopIt[1], loopIt[1][0]].map(([x, z]) => [x, .08, z])); v.test = { path, spark: new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 10), new THREE.MeshBasicMaterial({ color: LAYER_STYLE[107].color, toneMapped: false })) }; L.grp.add(v.test.spark);
      v.dets = pts(['det', 'heat']).map(([x, z]) => ({ u: path.near(new THREE.Vector3(x, .08, z)), r: flat(tickGeo, 0x1fae6b), x, z })); } }
    if (L.svc === 104) v.rise = spec.leaders.flatMap(([x, z], i) => [0, 1, 2].map((j) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0x182120, toneMapped: false })); m.visible = false; scene.add(m); return { m, x, z, ph: j / 3 + i * .13 }; }));
    return v;
  });
  function grpAdd(L, g) { L.grp.add(g); }

  // ---------- Each service in its own language. The floating plate is the schematic; the
  // service's value plays out in the building below it.
  const L_ = (svc) => layers.findIndex((l) => l.svc === svc);
  const FX = {};
  // Energía: a power cut; only what is critical stays lit, carried by the UPS.
  if (L_(108) >= 0) FX.energy = { k: L_(108), zones: (spec.critical || []).map(([x1, z1, x2, z2]) => {
    const m = flat(new THREE.PlaneGeometry(x2 - x1, z2 - z1), 0xffc24d); m.position.set((x1 + x2) / 2, .035, (z1 + z2) / 2);
    const l = new THREE.PointLight(0xffd58a, 0, 6, 1.4); l.position.set((x1 + x2) / 2, 1.7, (z1 + z2) / 2); scene.add(l); return { m, l }; }) };
  // Redes: coverage painted on the floor as a heat map; cables grow as tubes in the schematic.
  if (L_(101) >= 0) { const k = L_(101), L = layers[k], ppx = 40, cv = document.createElement('canvas'); cv.width = W * ppx; cv.height = D * ppx;
    const g = cv.getContext('2d'); g.scale(ppx, ppx); g.translate(W / 2, D / 2);
    L.items.filter((it) => it[0] === 'ap').forEach(([, x, z, r]) => { const gr = g.createRadialGradient(x, z, 0, x, z, r * 1.2); gr.addColorStop(0, 'rgba(31,174,107,.62)'); gr.addColorStop(.5, 'rgba(18,152,138,.34)'); gr.addColorStop(1, 'rgba(18,152,138,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, z, r * 1.2, 0, 7); g.fill(); });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const heat = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); heat.rotation.x = -Math.PI / 2; heat.position.y = .04; heat.renderOrder = 5; scene.add(heat);
    const tubeMat = new THREE.MeshStandardMaterial({ color: LAYER_STYLE[101].color, roughness: .35, emissive: LAYER_STYLE[101].color, emissiveIntensity: .25 });
    const tubes = L.items.filter((it) => it[0] === 'tray' || it[0] === 'fiber').map((it) => { const path = new THREE.CurvePath(); for (let i = 1; i < it[1].length; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(it[1][i - 1][0], .08, it[1][i - 1][1]), new THREE.Vector3(it[1][i][0], .08, it[1][i][1])));
      const geo = new THREE.TubeGeometry(path, Math.max(8, it[1].length * 24), it[0] === 'fiber' ? .05 : .035, 8, false); const m = new THREE.Mesh(geo, tubeMat); L.grp.add(m); return { m, n: geo.index.count }; });
    FX.net = { k, heat, tubes }; }
  // Telecomunicaciones: sound travels room to room as waves on the floor.
  if (L_(103) >= 0) { const k = L_(103), L = layers[k], src = L.items.filter((it) => ['speaker', 'phone', 'radio'].includes(it[0])), maxd = Math.max(1, ...src.map((it) => Math.hypot(it[1] - L.origin[0], it[2] - L.origin[1])));
    const wGeo = new THREE.RingGeometry(.9, 1, 72);
    FX.voice = { k, waves: src.flatMap((it) => [0, 1, 2].map((j) => ({ m: flat(wGeo, LAYER_STYLE[103].color), x: it[1], z: it[2], j, t0: Math.hypot(it[1] - L.origin[0], it[2] - L.origin[1]) / maxd }))) }; }
  // Seguridad: each camera's field of view as a volume in the room, and what the operator sees.
  if (L_(102) >= 0) { const k = L_(102), L = layers[k], cams = L.items.filter((it) => it[0] === 'cam');
    const cones = cams.map((it, i) => { const h = it[4] * .9, geo = new THREE.ConeGeometry(Math.tan(.42) * h, h, 32, 1, true); geo.translate(0, -h / 2, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: LAYER_STYLE[102].color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.position.set(it[1], 2.1, it[2]); m.renderOrder = 6; scene.add(m);
      return { m, a: it[3] * Math.PI / 180, len: it[4] * .9, ph: i * 1.7 }; });
    const pov = new THREE.PerspectiveCamera(54, 1.6, .1, 80);
    FX.watch = { k, cones, pov, cam0: cams[0] }; }
  // Incendios: smoke in one room, the detector takes it, the alarm runs the loop, sirens
  // sound and the way out lights up.
  if (L_(107) >= 0 && spec.fire) { const k = L_(107), L = layers[k], [fx, fz] = spec.fire.at;
    const smokeMat = new THREE.MeshStandardMaterial({ color: 0x5f676d, roughness: 1, transparent: true, opacity: 0, depthWrite: false });
    const smoke = Array.from({ length: 26 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.3, 14, 10), smokeMat.clone()); m.userData = { ox: Math.sin(i * 2.3) * .45, oz: Math.cos(i * 1.7) * .45, ph: i / 18 }; scene.add(m); return m; });
    const exit = poly(spec.fire.exit.map(([x, z]) => [x, .05, z]));
    const chev = new THREE.Shape(); chev.moveTo(-.16, -.14); chev.lineTo(.14, 0); chev.lineTo(-.16, .14); chev.lineTo(-.08, 0); chev.closePath();
    const chevGeo = new THREE.ShapeGeometry(chev); chevGeo.rotateX(-Math.PI / 2);
    const arrows = Array.from({ length: 9 }, () => { const m = new THREE.Mesh(chevGeo, new THREE.MeshBasicMaterial({ color: 0x1fae6b, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.renderOrder = 7; scene.add(m); return m; });
    const sirens = L.items.filter((it) => it[0] === 'siren').map((it) => ({ m: flat(ringGeo, 0xDC2626), x: it[1], z: it[2] }));
    const trig = L.items.filter((it) => it[0] === 'det' || it[0] === 'heat').reduce((b, it) => (!b || Math.hypot(it[1] - fx, it[2] - fz) < Math.hypot(b[1] - fx, b[2] - fz) ? it : b), null);
    FX.fire = { k, fx, fz, smoke, exit, arrows, sirens, trig, trigRing: flat(ringGeo, 0xDC2626) }; }
  // Software: the whole building summed up on one board (an HTML panel over the stage).
  const panel = host.querySelector('[data-scode-panel]'), monitor = host.querySelector('[data-scode-cctv]');
  if (L_(104) >= 0) FX.board = { k: L_(104) };
  const fxObjs = () => [...(FX.net ? [FX.net.heat] : []), ...(FX.voice ? FX.voice.waves.map((w) => w.m) : []), ...(FX.watch ? FX.watch.cones.map((c) => c.m) : []), ...(FX.fire ? [...FX.fire.smoke, ...FX.fire.arrows] : [])];
  const aim = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0);

  // Review captures: ?at= starts the chapter's own clock at that second.
  const at0 = Number(new URLSearchParams(location.search).get('at')) || 0;
  let aClock = at0, sClock = at0;

  // One state drives the picture. Autoplay computes it from the clock; the page's
  // chapters set targets and the state eases toward them.
  const arr = (v) => Array.from({ length: NL }, () => v);
  const S = { open: arr(0), dim: arr(1), labels: arr(0), tilt: 0, flow: 0, leaders: 0, look: 0, aud: 0, sup: 0 };
  const T = { open: arr(0), dim: arr(1), labels: arr(0), tilt: 0, flow: 0, leaders: 0, look: 0, aud: 0, sup: 0 };
  let chapter = 'place', mClock = 0, curK = -1, qv = 0, focus = null;
  const qPin = new URLSearchParams(location.search).get('q');
  function setProgress(q) { qv = qPin !== null ? Number(qPin) : clamp(q); }
  function setFocus(f) { focus = f; for (let j = 0; j < NL; j++) T.dim[j] = f === null ? 1 : j === f ? 1 : .12; }
  function setChapter(ch) {
    if (ch === chapter) return; chapter = ch; mClock = at0; aClock = at0; sClock = at0;
    const k = ch.startsWith('layer-') ? Number(ch.slice(6)) : -1, up = ch === 'place' || ch === 'audit' ? 0 : 1;
    // The building is put together as you read: every layer up to the current one stays built.
    const built = up ? (k >= 0 ? k : NL - 1) : -1; curK = k;
    T.aud = ch === 'audit' ? 1 : 0; T.sup = ch === 'support' ? 1 : 0;
    for (let j = 0; j < NL; j++) { T.open[j] = j <= built ? 1 : 0; T.dim[j] = k >= 0 ? (j < k ? .28 : 1) : ch === 'moment' ? .55 : ch === 'support' ? .8 : 1; T.labels[j] = k >= 0 && j === k ? 1 : 0; }
    T.tilt = up; T.flow = up * (ch === 'moment' ? .4 : 1); T.leaders = up * (k < 0 ? (ch === 'ficha' ? .5 : 1) : .3);
    T.look = k < 0 ? 0 : (topY(k) - (B ? B.c.y : 0)) * .3;
    labels.forEach((l, j) => l.classList.toggle('is-on', j === k));
    setHighlight(null);
  }
  function autoState(t) {
    for (let k = 0; k < NL; k++) { S.open[k] = win(4.6 + k * .32, 6.9 + k * .32, t) * (1 - win(16 + (NL - 1 - k) * .24, 18 + (NL - 1 - k) * .24, t)); S.dim[k] = 1; S.labels[k] = win(5.6 + k * .32, 6.8 + k * .32, t) * (1 - win(15.6, 16.4, t)); }
    S.flow = win(8.2, 9, t) * (1 - win(15.8, 16.4, t)); S.tilt = win(4.4, 7.6, t) * (1 - win(15.9, 18.9, t)); S.leaders = win(7, 8.2, t) * (1 - win(15.6, 16.4, t)); S.look = 0; S.aud = 0; S.sup = 0;
  }
  let camK = 1;
  function ease2(dt) {
    camK = reduce || snap ? 1 : 1 - Math.exp(-dt * 2.2);
    const a = reduce || snap ? 1 : 1 - Math.exp(-dt * 2.6), b = reduce || snap ? 1 : 1 - Math.exp(-dt * 6);
    for (let k = 0; k < NL; k++) { S.open[k] += (T.open[k] - S.open[k]) * a; S.dim[k] += (T.dim[k] - S.dim[k]) * b; S.labels[k] += (T.labels[k] - S.labels[k]) * b; }
    S.tilt += (T.tilt - S.tilt) * a; S.flow += (T.flow - S.flow) * b; S.leaders += (T.leaders - S.leaders) * b; S.look += (T.look - S.look) * a; S.aud += (T.aud - S.aud) * b; S.sup += (T.sup - S.sup) * b;
  }

  // mt: seconds into the moment (signal 0.3–3.3 s, callout after it arrives); end: its length.
  function draw(run, riseT, mt, mOn, mEnd) {
    pieces.forEach((p) => { const s = riseT == null ? 1 : Math.max(.001, win(p.at * .55, p.at * .55 + .9, riseT)); p.g.scale.y = s; p.g.visible = s > .002;
      p.hl = (p.hl || 0) + ((p.hlTarget || 0) - (p.hl || 0)) * .18; p.g.position.y = p.y0 + .16 * ease(p.hl); });
    updates.forEach((u) => u(run));
    const w = stage.clientWidth, h = stage.clientHeight;
    layers.forEach((L, k) => {
      const o = S.open[k], d = S.dim[k]; L.grp.position.y = .02 + (topY(k) - .02) * o; L.grp.visible = o > .003;
      const rev = !driven || k !== curK ? 99 : ease(clamp(qv / .55)) * L.maxR; L.plate.material.uniforms.reveal.value = rev;
      L.plate.material.uniforms.opacity.value = Math.min(1, o * 1.4) * (.1 + .9 * d); L.plate.material.uniforms.fill.value = !driven ? 1 : k === curK ? .55 : .1;
      L.toks.forEach((m) => m.scale.setScalar(Math.max(.001, o * (.5 + .5 * d) * clamp((rev - m.userData.d) / .5))));
      L.pulses.forEach((p) => { p.m.visible = S.flow * d > .05 && rev > 30; p.r.at((run * .16 + p.ph) % 1, p.m.position); p.m.scale.setScalar(.4 + S.flow * d * .6); });
      if (L.label && w >= 700) {
        let best = null; for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]]) { proj.set(x, L.grp.position.y, z).project(cam); if (!best || proj.x < best.x) best = proj.clone(); }
        L.label.style.transform = `translate(${((best.x + 1) / 2) * w}px,${((1 - best.y) / 2) * h}px) translate(-100%,-50%)`;
      }
      if (L.label) L.label.style.opacity = String(S.labels[k]);
    });
    leaderMat.opacity = .38 * S.leaders;
    // Verbs: certified points, voices, sweeping cameras, the loop test, data rising.
    const vq = clamp((qv - .3) / .7);
    verbs.forEach((V, k) => {
      const L = layers[k], o = S.open[k], y = L.grp.position.y, live = o > .5, cur = driven && k === curK, rev = cur ? ease(clamp(qv / .55)) * L.maxR : 99;
      V.ticks.forEach((t) => { const on = live && rev > t.d + .3, s = on ? Math.min(1, (rev - t.d - .3) / .6) : 0; t.r.visible = t.c.visible = s > .01; t.r.position.set(t.x, y + .05, t.z); t.c.position.set(t.x, y + .055, t.z); t.r.material.opacity = .9 * s * S.dim[k]; t.c.material.opacity = .85 * s * S.dim[k]; t.r.scale.setScalar(.6 + .4 * s); });
      V.echoes.forEach((e, i) => { const ph = ((vq * 2.4 - i * .09) % 1 + 1) % 1, on = !driven && live; e.r.visible = on; e.r.position.set(e.x, y + .05, e.z); e.r.scale.setScalar(.4 + ph * 1.3); e.r.material.opacity = on ? (cur ? .8 : .25) * (1 - ph) * S.dim[k] : 0; });
      V.fans.forEach((f) => { f.g.rotation.y = Math.sin(elapsed * .55 + f.ph) * .32; f.m.material.opacity = live ? (cur ? .2 + .1 * vq : .1) * S.dim[k] : 0; });
      if (V.test) { const done = !cur || vq >= 1, u = cur ? vq : 1; V.test.spark.visible = live && cur && vq > 0 && vq < 1; V.test.path.at(u, V.test.spark.position);
        V.dets.forEach((dd) => { const on = live && (done || dd.u <= u); dd.r.visible = on; dd.r.position.set(dd.x, y + .05, dd.z); dd.r.material.opacity = on ? .9 * S.dim[k] : 0; }); }
      V.rise.forEach((r) => { r.m.visible = live && S.dim[k] > .5; const f = (elapsed * .35 + r.ph) % 1; r.m.position.set(r.x, BASE_Y + (y - BASE_Y) * f, r.z); r.m.scale.setScalar(Math.sin(f * Math.PI)); });
    });
    // Moment: the red signal crosses the stack, ringing where it starts and arrives.
    const mu = clamp((mt - .3) / 3.0);
    spark.visible = mOn; momentPath.at(ease(mu), spark.position);
    trail.forEach((m, i) => { m.visible = mOn && mu > 0 && mu < 1; momentPath.at(ease(clamp(mu - (i + 1) * .006)), m.position); });
    rings.forEach((r, i) => { const e = mt - (.3 + stopsU[i] * 3.0); const on = mOn && e > 0; r.material.opacity = on ? Math.max(0, .9 - (e % 1.6) * .6) : 0; r.scale.setScalar(on ? 1 + (e % 1.6) * 1.4 : 1); });
    if (callout && hot) { proj.copy(hot); proj.project(cam);
      callout.style.transform = `translate(${((proj.x + 1) / 2) * w}px,${((1 - proj.y) / 2) * h}px) translate(-50%,-100%)`; callout.style.opacity = String(mOn ? win(2.9, 3.4, mt) * (1 - win(mEnd - .4, mEnd, mt)) : 0); }
    // Highlight rings follow their layer as it moves.
    if (hl) { hlT += 1 / 60; hl.pts.forEach(([x, z, y0], i) => { const m = pool[i]; if (!m) return; const y = hl.layer >= 0 ? layers[hl.layer].grp.position.y + .05 : (y0 || 0) + .03, e = (hlT * .9 + i * .07) % 1;
      m.position.set(x, y, z); m.scale.setScalar(1 + e * 1.1); m.material.opacity = Math.min(1, hlT * 4) * (1 - e) * .95; }); }
    echo.forEach((r, i) => { const [x, z] = after[i], e = mt - 3.3 - i * .07, on = mOn && e > 0; r.position.set(x, layers[spec.moment.after[0]].grp.position.y + .05, z); r.material.opacity = on ? Math.max(0, .9 - (e % 1.4) * .7) : 0; r.scale.setScalar(on ? 1 + (e % 1.4) * 1.2 : 1); });
    // Relevamiento
    const sx = -W / 2 + clamp((aClock % 4.4) / 3.6) * W;
    scan.visible = S.aud > .02; scan.position.x = sx; scan.material.opacity = .1 * S.aud;
    pins.forEach((g, i) => { const seen = aClock > 3.6 || sx >= nodesAll[i].x; g.visible = S.aud > .02 && seen; g.scale.setScalar(Math.max(.001, S.aud)); });
    // Soporte
    const sc = sClock % 6.4, incY = layers[inc[0]] ? layers[inc[0]].grp.position.y : 0, topD = topY(NL - 1) + 1.3;
    health.forEach((m) => { const { k, x, z } = m.userData, isInc = k === inc[0] && x === inc[1] && z === inc[2]; m.visible = S.sup > .05 && !(isInc && sc < 4.6); m.position.set(x, layers[k].grp.position.y + .55, z); m.scale.setScalar(Math.max(.001, S.sup)); });
    incRing.visible = S.sup > .05; incRing.position.set(inc[1], incY + .06, inc[2]); incRing.material.color.set(sc < 4.6 ? 0xDC2626 : 0x1fae6b);
    const ep = sc < 4.6 ? sc % 1.2 : (sc - 4.6) % 1.8; incRing.material.opacity = S.sup * Math.max(0, .95 - ep * .6); incRing.scale.setScalar(1 + ep * 1.1);
    const up = clamp((sc - 1.2) / 1.2), down = clamp((sc - 3.4) / 1.2);
    sSpark.visible = S.sup > .5 && sc > 1.2 && sc < 4.6; sSpark.position.set(inc[1], incY + .1 + (topD - incY - .1) * (sc < 3.4 ? ease(up) : 1 - ease(down)), inc[2]);
    if (desk) { proj.set(inc[1], topD, inc[2]).project(cam); desk.style.transform = `translate(${((proj.x + 1) / 2) * w}px,${((1 - proj.y) / 2) * h}px) translate(-50%,-100%)`;
      desk.style.opacity = String(S.sup * win(1.6, 2.2, sc)); const ph = sc < 2.4 ? '0' : sc < 4.6 ? '1' : '2'; if (desk.dataset.phase !== ph) desk.dataset.phase = ph; }
    if (driven) {
      const pair = chapter.startsWith('layer-') ? CAM.layers[Number(chapter.slice(6))] : CAM[chapter] || CAM.ficha, e = ease(qv);
      const f = { pos: tmp.lerpVectors(pair[0].pos, pair[1].pos, e).clone(), c: new THREE.Vector3().lerpVectors(pair[0].c, pair[1].c, e) };
      if (!camInit || snap) { camPos.copy(f.pos); camC.copy(f.c); camInit = true; } else { camPos.lerp(f.pos, camK); camC.lerp(f.c, camK); }
      cam.position.copy(camPos); cam.lookAt(camC);
    } else { cam.position.lerpVectors(A.pos, B.pos, S.tilt); tmp.lerpVectors(A.c, B.c, S.tilt); cam.lookAt(tmp); }
    runFx();
    renderer.render(scene, cam);
    renderInset();
  }
  function curOf(k) { return driven && curK === k ? 1 : 0; }
  function runFx() {
    const q = qv;
    // Energía
    let cut = 0;
    if (FX.energy) { const c = curOf(FX.energy.k); cut = c * win(.2, .34, q) * (1 - win(.84, .97, q)); const gl = cut * win(.34, .48, q);
      FX.energy.zones.forEach((z) => { z.m.material.opacity = .42 * gl; z.m.visible = gl > .01; z.l.intensity = 14 * gl; }); }
    hemi.intensity = .6 * (1 - .85 * cut); sun.intensity = 2.1 * (1 - .9 * cut); scene.environmentIntensity = 1 - .82 * cut; renderer.toneMappingExposure = 1.08 * (1 - .35 * cut);
    // Redes
    if (FX.net) { const c = curOf(FX.net.k), o = S.open[FX.net.k], grow = c ? win(.04, .62, q) : o > .5 ? 1 : 0;
      FX.net.heat.material.opacity = c * .85 * win(.3, .7, q); FX.net.heat.visible = FX.net.heat.material.opacity > .01;
      FX.net.tubes.forEach((t) => { t.m.visible = grow > .01; t.m.geometry.setDrawRange(0, Math.floor(t.n * grow / 3) * 3); t.m.material.opacity = 1; }); }
    // Telecomunicaciones
    if (FX.voice) { const c = curOf(FX.voice.k);
      FX.voice.waves.forEach((w) => { const start = .22 + w.t0 * .35, on = !!c && q > start, ph = ((elapsed * .45 + w.j / 3) % 1);
        w.m.visible = on; if (!on) return; w.m.position.set(w.x, .05, w.z); w.m.scale.setScalar(.2 + ph * 2.3); w.m.material.opacity = .95 * (1 - ph) * win(start, start + .08, q); }); }
    // Seguridad
    if (FX.watch) { const c = curOf(FX.watch.k), o = S.open[FX.watch.k];
      FX.watch.cones.forEach((cn) => { const a = cn.a - Math.sin(elapsed * .55 + cn.ph) * .32; aim.set(cn.m.position.x + Math.cos(a) * cn.len, .02, cn.m.position.z + Math.sin(a) * cn.len).sub(cn.m.position).normalize();
        cn.m.quaternion.setFromUnitVectors(down, aim); cn.m.material.opacity = (c ? .17 * win(.12, .36, q) : o > .5 ? .035 : 0); cn.m.visible = cn.m.material.opacity > .005; }); }
    if (monitor) monitor.style.opacity = String(FX.watch ? curOf(FX.watch.k) * win(.3, .45, q) : 0);
    // Incendios
    if (FX.fire) { const F = FX.fire, c = curOf(F.k), sm = c * win(.1, .4, q), alarm = c * win(.4, .46, q), out = c * win(.6, .72, q), ly = layers[F.k].grp.position.y;
      F.smoke.forEach((m) => { const u = m.userData, f = (elapsed * .18 + u.ph) % 1; m.visible = sm > .01; m.position.set(F.fx + u.ox * (.4 + f * 1.4), .3 + f * 2.2 * sm, F.fz + u.oz * (.4 + f * 1.4)); m.scale.setScalar((.7 + f * 1.8) * sm); m.material.opacity = .5 * sm * Math.sin(f * Math.PI); });
      F.trigRing.visible = alarm > .01 && !!F.trig; if (F.trig) { const e = (elapsed * 1.2) % 1; F.trigRing.position.set(F.trig[1], ly + .06, F.trig[2]); F.trigRing.scale.setScalar(1 + e * 1.4); F.trigRing.material.opacity = alarm * (1 - e); }
      F.sirens.forEach((sr, i) => { const e = (elapsed * 1.6 + i * .3) % 1; sr.m.visible = out > .01; sr.m.position.set(sr.x, ly + .06, sr.z); sr.m.scale.setScalar(.8 + e * 1.6); sr.m.material.opacity = out * (1 - e) * .95; });
      F.arrows.forEach((m, i) => { const u = ((i / F.arrows.length) + elapsed * .12) % 1; m.visible = out > .01; F.exit.at(u, m.position); F.exit.at(Math.min(1, u + .02), tmp); m.rotation.set(0, -Math.atan2(tmp.z - m.position.z, tmp.x - m.position.x), 0); m.scale.setScalar(1.7); m.position.y = .06; m.material.opacity = out * Math.min(1, Math.sin(u * Math.PI) * 1.6); });
      // during the simulation the loop shows the alarm, not the test
      verbs[F.k].dets.forEach((dd) => { if (c && alarm > .01) { dd.r.material.color.set(dd.u <= win(.46, .66, q) * 1 ? 0xDC2626 : 0x1fae6b); } else dd.r.material.color.set(0x1fae6b); }); }
    // Software
    if (panel) { const c = FX.board ? curOf(FX.board.k) : 0; panel.style.opacity = String(c * win(.22, .36, q)); const rows = panel.querySelectorAll('[data-row]'); rows.forEach((r, i) => r.classList.toggle('on', c && q > .3 + i * (.45 / Math.max(1, rows.length)))); }
  }
  // What the camera sees, drawn into the monitor frame over the stage.
  function renderInset() {
    if (!FX.watch || !monitor || !curOf(FX.watch.k) || Number(monitor.style.opacity) < .05) return;
    const er = monitor.getBoundingClientRect(), cr = renderer.domElement.getBoundingClientRect(); if (!er.width) return;
    const x = er.left - cr.left, y = cr.bottom - er.bottom, w = er.width, h = er.height, it = FX.watch.cam0, a = it[3] * Math.PI / 180 - Math.sin(elapsed * .55) * .32;
    const P = FX.watch.pov; P.aspect = w / h; P.updateProjectionMatrix(); P.position.set(it[1], 2.05, it[2]); P.lookAt(it[1] + Math.cos(a) * 4, .35, it[2] + Math.sin(a) * 4);
    const hidden = [...layers.map((l) => l.grp), ...fxObjs(), spark, ...trail, scan, ...pins].filter((o) => o.visible); hidden.forEach((o) => { o.visible = false; });
    renderer.setScissorTest(true); renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.setClearColor(0x1c232a, 1); renderer.clear(); renderer.render(scene, P);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, cr.width, cr.height); renderer.setClearColor(0x000000, 0); hidden.forEach((o) => { o.visible = true; });
  }
  function render(t, first, run = t) {
    autoState(t); draw(run, first ? t : null, t - 12, t > 12.1 && t < 16.2, 4.2);
    const step = t < 4.4 ? 0 : t < 8.2 ? 1 : t < 12.1 ? 2 : t < 16.2 ? 3 : 4;
    if (caption && step !== lastStep) { lastStep = step; caption.dataset.step = String(step); }
  }
  // The ring delay uses the eased path progress: solve once for each stop.
  stopsU.forEach((u, i) => { let lo = 0, hi = 1; for (let n = 0; n < 30; n++) { const m = (lo + hi) / 2; if (ease(m) < u) lo = m; else hi = m; } stopsU[i] = lo; });

  let riseClock = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = lastNow ? Math.min(.1, (now - lastNow) / 1000) : 0; lastNow = now;
    if (freeze !== null) { render(freeze, true); return; }
    if (!visible) return;
    elapsed += reduce ? 0 : dt;
    if (driven) {
      riseClock += dt; ease2(dt);
      // In the moment, the survey and support, scrolling is the timeline.
      mClock = qv * 5.0; aClock = qv * 4.4; sClock = qv * 6.3;
      draw(elapsed, riseClock < 3 && !reduce && !snap ? riseClock : null, chapter === 'moment' ? mClock : 0, chapter === 'moment', 5.4);
      return;
    }
    clock += dt; if (clock >= LOOP) { clock -= LOOP; cycle++; }
    render(clock, cycle === 0, elapsed);
  }
  ready = true;
  if (driven) setChapter(host.querySelector('[data-scode-ch].is-active')?.dataset.scodeCh || 'place'), raf = requestAnimationFrame(frame);
  else if (reduce && freeze === null) render(13.4, false); else raf = requestAnimationFrame(frame);
  const dispose = () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); pm.dispose(); renderer.domElement.remove(); };
  return { dispose, setChapter, setHighlight, setProgress, setFocus };
}
