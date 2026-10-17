// One object per service, assembled and put to work on a transparent canvas, so it
// floats on the page's own paper with only a soft contact shadow — no frame, no backdrop.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const LOOP = 12;
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const win = (a, b, t) => ease(clamp((t - a) / (b - a)));
const RED = 0xDC2626, GREEN = 0x2bd48a;

function kit(scene) {
  const M = {
    white: new THREE.MeshPhysicalMaterial({ color: 0xf3f4f5, roughness: .38, clearcoat: .6, clearcoatRoughness: .25 }),
    grey: new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: .5 }),
    dark: new THREE.MeshPhysicalMaterial({ color: 0x16191d, roughness: .3, clearcoat: .8 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: .25, metalness: .9 }),
    red: new THREE.MeshPhysicalMaterial({ color: RED, roughness: .35, clearcoat: .7 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transmission: .9, thickness: .2, transparent: true }),
  };
  const glow = (c, i = 2.4) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: i });
  const parts = []; // { obj, home, from, at } — assembly targets
  function add(obj, at = 0, from = [0, 3, 0]) {
    obj.castShadow = obj.receiveShadow = true; scene.add(obj);
    parts.push({ obj, home: obj.position.clone(), from: new THREE.Vector3(...from), at });
    return obj;
  }
  const box = (w, h, d, mat, x, y, z, at, from, r = .04) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), mat); m.position.set(x, y + h / 2, z); return add(m, at, from); };
  const cyl = (r, h, mat, x, y, z, at, from, axis = 'y', seg = 40, r2 = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, seg), mat); m.position.set(x, y + (axis === 'y' ? h / 2 : 0), z); if (axis === 'x') m.rotation.z = Math.PI / 2; if (axis === 'z') m.rotation.x = Math.PI / 2; return add(m, at, from); };
  const tube = (pts, r, mat, at) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', .2); const g = new THREE.TubeGeometry(c, 64, r, 10, false); g.setDrawRange(0, 0); const m = new THREE.Mesh(g, mat); m.castShadow = true; scene.add(m); m.userData.grow = { at, total: g.index.count }; return m; };
  return { M, glow, box, cyl, tube, parts };
}

// Each scene builds its object and returns update(t) for its working moment (t in seconds, 0..LOOP).
const SCENES = {
  // Redes: a rack; patch cords run in one by one, link lights turn green.
  '101'(k) {
    const { M, glow, box, cyl, tube } = k;
    box(1.6, .18, 1.2, M.dark, 0, 0, 0, 0, [0, -1, 0]);
    for (const x of [-.72, .72]) for (const z of [-.5, .5]) box(.08, 2.6, .08, M.dark, x, .18, z, .1, [0, 3, 0], .02);
    box(1.6, .12, 1.2, M.dark, 0, 2.78, 0, .2, [0, 2, 0]);
    const leds = [];
    [.5, 1.0, 1.5, 2.0].forEach((y, i) => {
      box(1.38, .28, .9, i === 1 ? M.white : M.grey, 0, y, 0, .4 + i * .12, [-3, 0, 0]);
      for (let p = 0; p < 8; p++) { const l = box(.06, .04, .02, glow(0x333333, 0), -.5 + p * .14, y + .2, .46, .9 + i * .1, [0, 0, 1]); leds.push(l); }
    });
    const cords = [0, 2, 4, 6].map((p, i) => tube([[-.5 + p * .14, 1.12, .47], [-.5 + p * .14, 1.0, .7], [-.5 + p * .14 + .2, .6, .75], [-.5 + p * .14, .58, .47]], .022, [M.red, M.dark, M.red, M.white][i], 2.4 + i * .5));
    return (t) => leds.forEach((l, i) => { const on = t > 2.6 + (i % 8) * .3 && t < 10.5; l.material.emissive.setHex(on ? GREEN : 0x333333); l.material.emissiveIntensity = on ? 2.2 + Math.sin(t * 9 + i) * .6 : 0; });
  },
  // Seguridad: a camera on a bracket sweeps; its field of view lights the floor; an access reader turns green.
  '102'(k, scene) {
    const { M, glow, box, cyl } = k;
    box(.5, 2.6, .5, M.white, -1.2, 0, -.6, 0, [0, -2, 0]);
    box(1.1, .12, .16, M.dark, -.7, 2.3, -.6, .3, [-2, 0, 0]);
    const head = new THREE.Group(); head.position.set(-.2, 2.2, -.6); scene.add(head);
    const body = new THREE.Mesh(new RoundedBoxGeometry(.9, .36, .4, 3, .12), M.white); body.castShadow = true; body.position.x = .25; head.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .08, 32), M.dark); lens.rotation.z = Math.PI / 2; lens.position.x = .72; head.add(lens);
    const glassL = new THREE.Mesh(new THREE.CircleGeometry(.1, 32), glow(0x3a6cff, 1.2)); glassL.rotation.y = Math.PI / 2; glassL.position.x = .765; head.add(glassL);
    const coneG = new THREE.ConeGeometry(1.1, 3.2, 48, 1, true); coneG.translate(0, -1.6, 0); coneG.rotateZ(Math.PI / 2); coneG.rotateY(0);
    const cone = new THREE.Mesh(coneG, new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: .08, side: THREE.DoubleSide, depthWrite: false }));
    cone.position.x = .8; head.add(cone);
    box(.26, .42, .06, M.dark, -1.2, 1.1, -.32, .6, [0, 0, 2], .04);
    const reader = box(.14, .05, .02, glow(0x333333, 0), -1.2, 1.42, -.28, .9, [0, 0, 1]);
    head.userData.k = true; k.parts.push({ obj: head, home: head.position.clone(), from: new THREE.Vector3(0, 2, 0), at: .5 });
    return (t) => {
      const sweep = win(2, 3, t) * (1 - win(10.4, 11.4, t));
      head.rotation.y = -.5 + Math.sin((t - 2) * .6) * .45 * sweep; head.rotation.z = -.35 * sweep;
      cone.material.opacity = .1 * sweep;
      const ok = t > 6 && t < 10.5; reader.material.emissive.setHex(ok ? GREEN : RED); reader.material.emissiveIntensity = t > 2 && t < 10.5 ? 2.5 : 0;
    };
  },
  // Telecomunicaciones: two masts, dishes align, a link beam carries packets.
  '103'(k, scene) {
    const { M, glow, box, cyl } = k;
    const masts = [[-1.6, -.2], [1.6, .2]];
    masts.forEach(([x, z], i) => {
      box(.8, .16, .8, M.white, x, 0, z, i * .2, [0, -1, 0]);
      for (const dx of [-.12, .12]) box(.04, 3, .04, M.metal, x + dx, .12, z, .2 + i * .2, [0, 3, 0], .01);
      for (let y = .4; y < 3; y += .4) box(.28, .03, .03, M.metal, x, y, z, .4 + i * .2, [0, 0, 0], .01);
    });
    const dishes = masts.map(([x, z], i) => { const d = cyl(.52, .16, M.white, x + (i ? -.34 : .34), 2.6, z, 1 + i * .2, [0, 2, 0], 'x', 64, .3); d.rotation.y = i ? .4 : -.4; return d; });
    const beamG = new THREE.CylinderGeometry(.025, .025, 1, 12); beamG.rotateZ(Math.PI / 2);
    const beam = new THREE.Mesh(beamG, new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0 }));
    beam.position.set(0, 2.66, 0); beam.scale.x = 2.6; scene.add(beam);
    const pk = Array.from({ length: 5 }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), glow(RED, 3)); scene.add(s); return s; });
    return (t) => {
      const al = win(2, 3.2, t) * (1 - win(10.5, 11.5, t));
      dishes.forEach((d, i) => { d.rotation.y = (i ? .4 : -.4) * (1 - al); });
      beam.material.opacity = .55 * win(3.2, 3.8, t) * (1 - win(10.2, 10.8, t));
      pk.forEach((s, i) => { const u = ((t - 3.6) * .45 + i / 5) % 1; s.visible = t > 3.8 && t < 10.3; s.position.set(-1.3 + u * 2.6, 2.66, -.16 + u * .32); });
    };
  },
  // Software: light UI panels assemble into a screen on a stand.
  '104'(k) {
    const { M, glow, box } = k;
    box(.8, .06, .5, M.metal, 0, 0, 0, 0, [0, -1, 0]); box(.1, 1.1, .1, M.metal, 0, .06, -.1, .1, [0, -2, 0], .03);
    box(3.6, 2.2, .1, M.dark, 0, 1.1, -.1, .2, [0, 2, -2], .06);
    const tiles = [[-1.38, 2.2, .55, 1.86, 0xe9ecef], [-.2, 2.7, 1.62, .9, 0xffffff], [1.12, 2.7, .82, .9, 0xffffff], [-.2, 1.6, .8, .66, 0xffffff], [.62, 1.6, .64, .66, 0xffffff], [1.12, 1.6, .82, .66, 0xffffff]];
    const ui = (w, h, kind) => { const cv = document.createElement('canvas'); cv.width = Math.round(w * 300); cv.height = Math.round(h * 300); const g = cv.getContext('2d'); g.fillStyle = kind === 0 ? '#eef0f2' : '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
      const L = (x, y, ww, hh, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, ww, hh, 6); g.fill(); };
      if (kind === 0) { L(20, 24, 70, 14, '#16191d'); for (let r = 0; r < 6; r++) L(20, 80 + r * 52, 110, 12, r === 0 ? '#DC2626' : '#c9ced3'); }
      else if (kind === 1) { L(24, 22, 160, 16, '#16191d'); for (let r = 0; r < 4; r++) { L(24, 66 + r * 46, 200, 10, '#c9ced3'); L(cv.width - 120, 62 + r * 46, 90, 18, ['#2bd48a', '#E2B04A', '#8B7CF6', '#2bd48a'][r]); } }
      else { L(22, 20, 110, 14, '#16191d'); for (let r = 0; r < 3; r++) L(22, 56 + r * 40, cv.width - 44, 22, '#eef0f2'); }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    const panels = tiles.map(([x, y, w, h, c], i) => box(w, h, .03, [k.M.grey, k.M.grey, k.M.grey, k.M.grey, new THREE.MeshStandardMaterial({ map: ui(w, h, i === 0 ? 0 : i === 1 ? 1 : 2), roughness: .6 }), k.M.grey], x, y - h / 2, -.03, .8 + i * .25, [(i % 2 ? 2 : -2), (i % 3) - 1, 3], .03));
    const accent = box(.3, .08, .02, M.red, .38, 2.6, .0, 2.6, [0, 0, 2], .02);
    const bars = [0, 1, 2, 3, 4].map((i) => box(.06, .1, .02, i === 3 ? M.red : M.grey, .38 + i * .1, 1.33, .0, 2.8, [0, 0, 1], .01));
    return (t) => bars.forEach((b, i) => { const h = .1 + (Math.sin(t * 1.4 + i) * .5 + .5) * .3 * win(3, 4, t); b.scale.y = h / .1; b.position.y = 1.33 + h / 2; });
  },
  // Soporte 24/7: a laptop; ticket cards move across columns to "resolved".
  '105'(k, scene) {
    const { M, glow, box } = k;
    box(2.4, .08, 1.6, M.metal, 0, 0, .3, 0, [0, -1, 0], .05);
    const lid = new THREE.Group(); lid.position.set(0, .08, -.5); scene.add(lid);
    const scr = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.6, .06, 3, .05), M.metal); scr.position.set(0, .8, 0); scr.castShadow = true; lid.add(scr);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xf5f6f7, roughness: .7 })); face.position.set(0, .8, .035); lid.add(face);
    for (let c = 0; c < 3; c++) { const col = new THREE.Mesh(new THREE.PlaneGeometry(.62, 1.15), new THREE.MeshStandardMaterial({ color: 0xe6e9ec })); col.position.set(-.72 + c * .72, .74, .04); lid.add(col); }
    k.parts.push({ obj: lid, home: lid.position.clone(), from: new THREE.Vector3(0, 0, 0), at: .2 });
    lid.userData.open = true;
    const done = new THREE.MeshPhysicalMaterial({ color: GREEN, roughness: .35, clearcoat: .7 });
    const cards = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new RoundedBoxGeometry(.54, .2, .02, 2, .03), i === 0 ? M.red : M.white); m.castShadow = true; lid.add(m); return m; });
    return (t) => {
      const op = win(.6, 2, t) * (1 - win(10.8, 11.6, t)); lid.rotation.x = Math.PI / 2 * (1 - op) - .18 * op;
      cards.forEach((c, i) => {
        const p = clamp((t - 2.4 - i * 1.4) / 2.6), col = Math.min(2, Math.floor(p * 3 + .0001));
        const x = -.72 + (p < 1 ? p * 1.44 : 1.44);
        c.position.set(x, 1.14 - i * .26, .06); c.visible = t > 2 + i * .4 && t < 10.8;
        c.material = p >= 1 ? done : i === 0 ? k.M.red : k.M.white;
      });
    };
  },
  // Consultoría: floor plans stack into a building model, with a red route through it.
  '106'(k) {
    const { M, glow, box, tube } = k;
    const floors = [0, 1, 2, 3].map((i) => {
      const g = box(2.6, .05, 1.8, M.white, 0, i * .55, 0, .3 + i * .5, [0, 2 + i, 0], .02);
      for (const [x, z, w, d] of [[-.9, -.5, .05, .8], [.2, .3, 1.2, .05], [.6, -.4, .05, 1]]) box(w, .3, d, M.grey, x, i * .55 + .05, z, .5 + i * .5, [0, 2 + i, 0], .01);
      return g;
    });
    for (const x of [-1.25, 1.25]) for (const z of [-.85, .85]) box(.05, 1.7, .05, M.grey, x, 0, z, 2.6, [0, 3, 0], .02);
    tube([[-1.1, .1, .7], [-1.1, .1, -.6], [.9, .1, -.6], [.9, .7, -.6], [.9, 1.2, .6], [-.4, 1.75, .6], [-.4, 1.75, -.4]], .03, M.red, 3.4);
    return () => {};
  },
  // Detección de incendios: ceiling detectors, a wisp of smoke, detector and panel turn red.
  '107'(k, scene) {
    const { M, glow, box, cyl } = k;
    box(3, 2.8, .1, M.white, 0, 0, -1.05, 0, [0, -3, 0], .02);
    box(.1, 2.8, 2.1, M.white, -1.55, 0, 0, .15, [0, -3, 0], .02);
    box(3, .06, 2.1, M.grey, 0, 0, 0, 0, [0, -1, 0], .02);
    const dets = [[-.6, 2.35], [.8, 2.35]].map(([x, y], i) => { cyl(.32, .12, M.white, x, y, -.98, .5 + i * .2, [0, 0, 2], 'z'); return box(.12, .12, .02, glow(0x333333, 0), x, y - .035, -.92, .7 + i * .2, [0, 0, 2], .01); });
    box(.6, .8, .12, M.white, 1, .7, -.98, .8, [0, 0, 2], .05);
    const pled = box(.36, .06, .02, glow(0x333333, 0), 1, 1.3, -.91, 1, [0, 0, 1], .01);
    box(.5, .5, .5, M.dark, -.6, .06, .2, .9, [0, 2, 0], .05);
    const smoke = Array.from({ length: 18 }, (_, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(.12 + (i % 4) * .03, 16, 12), new THREE.MeshStandardMaterial({ color: 0x8d959d, transparent: true, opacity: 0, roughness: 1 })); scene.add(s); return s; });
    return (t) => {
      smoke.forEach((s, i) => { const u = ((t - 2.2) * .35 + i / 18) % 1; const on = t > 2.2 && t < 10.4; s.position.set(-.6 + Math.sin(i * 1.7 + u * 3) * .25 * u, .6 + u * 1.7, .2 - u * .9); s.material.opacity = on ? .6 * (1 - u) * win(2.2, 3, t) : 0; s.scale.setScalar(.6 + u * 1.4); });
      const alarm = t > 4.6 && t < 10.6, blink = Math.sin(t * 10) > 0;
      dets[0].material.emissive.setHex(RED); dets[0].material.emissiveIntensity = alarm && blink ? 3 : 0;
      pled.material.emissive.setHex(alarm ? RED : GREEN); pled.material.emissiveIntensity = t > 1.4 && t < 10.6 ? 2.4 : 0;
    };
  },
  // Eléctricos: a panel with breakers switching on in sequence and a UPS charging.
  '108'(k) {
    const { M, glow, box } = k;
    box(1.6, 2.4, .5, M.white, -.6, 0, 0, 0, [0, -2, 0], .05);
    const toggles = [], leds = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      box(.18, .34, .12, M.grey, -1.15 + c * .22, .5 + r * .6, .3, .4 + (r * 6 + c) * .03, [0, 0, 1.5], .02);
      toggles.push(box(.08, .12, .06, M.dark, -1.15 + c * .22, .58 + r * .6, .38, .6 + (r * 6 + c) * .03, [0, 0, 1], .015));
    }
    box(.8, 1.4, .8, M.dark, 1.1, 0, .1, .5, [2, 0, 0], .06);
    for (let i = 0; i < 5; i++) leds.push(box(.1, .14, .02, glow(0x333333, 0), .86 + i * .12, 1.1, .51, .8, [0, 0, 1], .01));
    return (t) => {
      toggles.forEach((g, i) => { const on = t > 2.2 + i * .14 && t < 10.6; g.position.y = (on ? .66 : .58) + Math.floor(i / 6) * .6; g.material = on ? k.M.red : k.M.dark; });
      leds.forEach((l, i) => { const on = t > 4.8 + i * .45 && t < 10.6; l.material.emissive.setHex(GREEN); l.material.emissiveIntensity = on ? 2.4 : 0; });
    };
  },
};

export function mountObject(host, code) {
  const build = SCENES[code]; if (!build) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap; renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe3e6, .9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-4, 9, 6); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 14; sun.shadow.blurSamples = 20; sun.shadow.bias = -.0005;
  scene.add(sun);
  // Soft contact shadow only; the page paper shows through everywhere else.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .14 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const k = kit(scene);
  const update = build(k, scene);
  // grown tubes
  const grows = []; scene.traverse((o) => o.userData?.grow && grows.push(o));

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
  update(7); const box3 = new THREE.Box3(); k.parts.forEach((p) => box3.expandByObject(p.obj));
  const center = box3.getCenter(new THREE.Vector3()), size = box3.getSize(new THREE.Vector3());
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false);
    const a = w / h, fit = (Math.max(size.y * .8, Math.max(size.x, size.z) * .66 / a) + .3) * ({ '105': 1.45, '107': 1.25 }[code] || 1.14);
    Object.assign(cam, { left: -fit * a, right: fit * a, top: fit, bottom: -fit }); cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  let visible = false; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .1 }); io.observe(host);
  const q = new URLSearchParams(location.search), freeze = q.has('t') ? Number(q.get('t')) : null, t0 = performance.now(); let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!visible && freeze === null) return;
    const t = reduce ? 7 : freeze ?? ((now - t0) / 1000) % LOOP;
    // assemble 0–2.4 s, work, then lift apart 11–12 s so the loop restarts cleanly
    const out = win(11, 12, t);
    k.parts.forEach((p) => { const a = win(p.at, p.at + 1.2, t) * (1 - out); p.obj.position.lerpVectors(p.home.clone().add(p.from), p.home, a); p.obj.visible = a > .001; });
    grows.forEach((g) => { const u = win(g.userData.grow.at, g.userData.grow.at + 1.2, t) * (1 - out); g.geometry.setDrawRange(0, Math.floor(g.userData.grow.total * u / 3) * 3); });
    update(t);
    const yaw = Math.PI / 4 + Math.sin(t * .35) * .1, r = 20;
    cam.position.set(center.x + Math.sin(yaw) * r * .78, center.y + r * .62, center.z + Math.cos(yaw) * r * .78);
    cam.lookAt(center.x, center.y * .85, center.z);
    renderer.render(scene, cam);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); pm.dispose(); renderer.domElement.remove(); };
}
