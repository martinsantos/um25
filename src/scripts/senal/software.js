// Software, told in code: the product screen assembles itself from real UI panels,
// opens into its layers (interface, rules, integrations, data) and closes again.
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const LOOP = 18, BG = 0x0b1219;
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const win = (a, b, t) => ease(clamp((t - a) / (b - a)));
const C = { ink: '#0f1923', panel: '#16222d', line: 'rgba(255,255,255,.08)', text: '#e8eef2', mute: '#7f909e', red: '#DC2626', teal: '#3FC7B8', violet: '#8B7CF6', gold: '#E2B04A' };

// ---------- UI textures drawn in code (crisp at 2x)
function canvasPanel(w, h, draw) {
  const k = 2, cv = document.createElement('canvas'); cv.width = w * k; cv.height = h * k;
  const g = cv.getContext('2d'); g.scale(k, k);
  g.fillStyle = C.panel; g.fillRect(0, 0, w, h);
  g.font = '600 13px "UM Sans", Arial'; g.textBaseline = 'middle';
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const bar = (g, x, y, w, h, c, r = 3) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
const txt = (g, s, x, y, c = C.text, f) => { if (f) g.font = f; g.fillStyle = c; g.fillText(s, x, y); };

const PANELS = {
  nav: canvasPanel(140, 420, (g, w, h) => {
    txt(g, 'ultimamilla', 18, 30, C.text, '700 15px "UM Sans", Arial');
    ['Órdenes', 'Proyectos', 'Equipo', 'Integraciones', 'Historial', 'Ajustes'].forEach((s, i) => {
      if (i === 0) bar(g, 10, 62 + i * 38, w - 20, 30, 'rgba(220,38,38,.16)');
      txt(g, s, 22, 77 + i * 38, i === 0 ? C.text : C.mute, '500 13px "UM Sans", Arial');
    });
  }),
  list: canvasPanel(420, 260, (g, w) => {
    txt(g, 'Órdenes de trabajo', 18, 26, C.text, '700 15px "UM Sans", Arial');
    bar(g, w - 96, 14, 80, 24, C.red); txt(g, 'Nueva orden', w - 88, 26, '#fff', '600 11px "UM Sans", Arial');
    const rows = [['OT-2481', 'Relevamiento sala técnica', 'Aprobada', C.teal], ['OT-2482', 'Ampliación red piso 3', 'En revisión', C.gold], ['OT-2483', 'Integración ERP compras', 'Asignada', C.violet], ['OT-2484', 'Mantenimiento CCTV', 'Aprobada', C.teal], ['OT-2485', 'Migración base de datos', 'Borrador', C.mute]];
    rows.forEach(([id, d, st, c], i) => {
      const y = 62 + i * 38; g.fillStyle = C.line; g.fillRect(14, y - 18, w - 28, 1);
      txt(g, id, 18, y, C.mute, '500 12px "UM Sans", Arial'); txt(g, d, 90, y, C.text, '500 13px "UM Sans", Arial');
      bar(g, w - 104, y - 10, 88, 20, 'rgba(255,255,255,.05)', 10); g.fillStyle = c; g.beginPath(); g.arc(w - 92, y, 3.5, 0, 7); g.fill(); txt(g, st, w - 82, y, C.text, '500 11px "UM Sans", Arial');
    });
  }),
  form: canvasPanel(260, 260, (g, w) => {
    txt(g, 'OT-2482', 18, 26, C.mute, '500 12px "UM Sans", Arial');
    txt(g, 'Ampliación red piso 3', 18, 48, C.text, '700 15px "UM Sans", Arial');
    [['Responsable', 'M. Santos'], ['Proyecto', 'Torre Norte'], ['Presupuesto', '$ 4.820.000'], ['Vence', '24/10']].forEach(([k, v], i) => {
      const y = 86 + i * 40; txt(g, k, 18, y, C.mute, '500 11px "UM Sans", Arial'); bar(g, 18, y + 8, w - 36, 22, 'rgba(255,255,255,.05)'); txt(g, v, 26, y + 19, C.text, '500 12px "UM Sans", Arial');
    });
  }),
  perm: canvasPanel(260, 150, (g, w) => {
    txt(g, 'Permisos del rol', 18, 24, C.text, '700 14px "UM Sans", Arial');
    [['Ver órdenes', 1], ['Aprobar', 1], ['Editar presupuesto', 0]].forEach(([s, on], i) => {
      const y = 58 + i * 30; txt(g, s, 18, y, C.text, '500 12px "UM Sans", Arial');
      bar(g, w - 54, y - 9, 34, 18, on ? C.violet : 'rgba(255,255,255,.12)', 9); g.fillStyle = '#fff'; g.beginPath(); g.arc(on ? w - 29 : w - 45, y, 6, 0, 7); g.fill();
    });
  }),
  chart: canvasPanel(260, 150, (g, w, h) => {
    txt(g, 'Órdenes por semana', 18, 24, C.text, '700 14px "UM Sans", Arial');
    [38, 52, 44, 66, 58, 80, 72].forEach((v, i) => bar(g, 22 + i * 32, h - 18 - v, 18, v, i === 5 ? C.red : 'rgba(255,255,255,.18)', 3));
  }),
  integ: canvasPanel(260, 150, (g) => {
    txt(g, 'Integraciones', 18, 24, C.text, '700 14px "UM Sans", Arial');
    [['ERP', C.teal], ['Facturación', C.teal], ['Directorio', C.gold]].forEach(([s, c], i) => {
      const y = 58 + i * 30; g.fillStyle = c; g.beginPath(); g.arc(24, y, 4, 0, 7); g.fill(); txt(g, s, 36, y, C.text, '500 12px "UM Sans", Arial'); txt(g, i < 2 ? 'Sincronizado' : 'Validando', 150, y, C.mute, '500 11px "UM Sans", Arial');
    });
  }),
};

export function mountSoftware(host) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(BG, 1);
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 200);
  scene.add(new THREE.AmbientLight(0xffffff, .55));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(6, 10, 8); scene.add(key);

  // Units: 1 = 100 px of the screen layout. Screen 10 x 6.
  const S = .01, root = new THREE.Group(); scene.add(root);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(10.6, 6.6, .18, 4, .14), new THREE.MeshStandardMaterial({ color: 0x0a0f14, roughness: .35, metalness: .4 }));
  frame.position.z = -.12; root.add(frame);
  const screenBg = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 6.2), new THREE.MeshBasicMaterial({ color: C.ink }));
  screenBg.position.z = -.02; root.add(screenBg);

  // Panels with their place in the assembled screen (x, y in layout px from top-left; layer for the exploded view).
  const layout = [
    { id: 'nav', x: 0, y: 0, w: 140, h: 420, layer: 0 },
    { id: 'list', x: 160, y: 20, w: 420, h: 260, layer: 0 },
    { id: 'form', x: 600, y: 20, w: 260, h: 260, layer: 0 },
    { id: 'perm', x: 600, y: 300, w: 260, h: 150, layer: 1 },
    { id: 'integ', x: 160, y: 300, w: 260, h: 150, layer: 2 },
    { id: 'chart', x: 430, y: 300, w: 150, h: 150, layer: 3 },
  ];
  const ox = -5 + .1, oy = 3 - .1;
  const panels = layout.map((p, i) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(p.w * S, p.h * S, .04, 3, .05), [
      ...Array(4).fill(new THREE.MeshStandardMaterial({ color: 0x1b2833, roughness: .5 })),
      new THREE.MeshBasicMaterial({ map: PANELS[p.id] }), new THREE.MeshStandardMaterial({ color: 0x1b2833 })]);
    const home = new THREE.Vector3(ox + (p.x + p.w / 2) * S, oy - (p.y + p.h / 2) * S, .02);
    const a = i * 1.7 + 1;
    const from = new THREE.Vector3(Math.cos(a) * 9, Math.sin(a) * 6, 6 + i);
    root.add(m); return { ...p, m, home, from, rot: new THREE.Euler(Math.sin(a) * .9, Math.cos(a) * .9, Math.sin(a * 2) * .4) };
  });
  // Layer plates + labels for the exploded view.
  const LAYERS = [['Interfaz', '#DC2626'], ['Reglas y permisos', '#8B7CF6'], ['Integraciones', '#3FC7B8'], ['Datos', '#E2B04A']];
  const plates = LAYERS.map(([name, col], k) => {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 6.4), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    pl.position.z = -.06; root.add(pl);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(10.4, 6.4)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0 }));
    pl.add(edge);
    const cv = document.createElement('canvas'); cv.width = 900; cv.height = 96; const g = cv.getContext('2d');
    g.font = '700 44px "UM Sans", Arial'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(`0${k + 1}  ${name.toUpperCase()}`, 8, 48);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .45), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
    label.position.set(-3.0, 3.55, 0); pl.add(label);
    return { pl, edge, label };
  });
  // Data pulses between layers.
  const pulses = Array.from({ length: 14 }, (_, i) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), new THREE.MeshBasicMaterial({ color: [0xff4040, 0x9b8cff, 0x45d7c9, 0xffc35a][i % 4] }));
    s.userData = { x: -3.6 + (i % 7) * 1.2, y: -1.8 + Math.floor(i / 7) * 3.2, phase: i * .37 }; root.add(s); return s;
  });

  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .55, .5, .6); composer.addPass(bloom); composer.addPass(new OutputPass());
  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; root.position.set(0, w / h > 1.2 ? .3 : 1.4, 0); renderer.setSize(w, h, false); composer.setSize(w, h); cam.aspect = w / h; cam.fov = w / h < 1 ? 52 : 30;
    // Keep the product right of the caption on wide screens.
    if (w / h > 1.2) cam.setViewOffset(w, h, -w * .17, 0, w, h); else cam.clearViewOffset();
    cam.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const caption = host.querySelector('[data-senal-caption]'); let last = -1, raf = 0;
  const q = new URLSearchParams(location.search), t0 = performance.now();
  if (q.has('t')) host.classList.add('is-frozen');
  const camA = new THREE.Vector3(1.6, .4, 17), camB = new THREE.Vector3(15, 8, 16), look = new THREE.Vector3(1.2, 0, 0);
  function frameFn(now) {
    raf = requestAnimationFrame(frameFn);
    const t = reduce ? 16 : q.has('t') ? Number(q.get('t')) : ((now - t0) / 1000) % LOOP;
    // 0–4.5 assemble · 5–11 explode into layers · 11.5–15 data flows · 15–17.5 close
    const assemble = win(.2, 4.5, t), open = win(5, 7.4, t) * (1 - win(15, 17.4, t));
    panels.forEach((p, i) => {
      const k = clamp(assemble * 1.6 - i * .12);
      p.m.position.lerpVectors(p.from, p.home, ease(k));
      p.m.rotation.set(p.rot.x * (1 - ease(k)), p.rot.y * (1 - ease(k)), p.rot.z * (1 - ease(k)));
      p.m.position.z += p.layer * -1.6 * open;
    });
    plates.forEach(({ pl, edge, label }, k) => {
      pl.position.z = -.06 - k * 1.6 * open; pl.material.opacity = .05 * open; edge.material.opacity = .55 * open; label.material.opacity = win(6.6 + k * .35, 7.4 + k * .35, t) * (1 - win(15, 16, t));
    });
    frame.material.opacity = 1; frame.position.z = -.12 - 4.8 * open; screenBg.position.z = -.02 - 4.8 * open;
    const flow = win(9, 10, t) * (1 - win(15, 15.8, t));
    pulses.forEach((s) => { const u = (t * .45 + s.userData.phase) % 1; s.position.set(s.userData.x, s.userData.y, -(1 - u) * 4.8 * open); s.visible = flow > .02; s.scale.set(.8 + flow * .4, .8 + flow * .4, 5 + flow * 3); });
    // camera: front, then three-quarter for the layers, back to front
    const tilt = win(4.8, 7.6, t) * (1 - win(14.8, 17.2, t));
    cam.position.lerpVectors(camA, camB, tilt); cam.position.x += Math.sin(t * .3) * .3;
    cam.lookAt(root.position.x + look.x * tilt, root.position.y * .6, -2.4 * open);
    const k = t < 4.6 ? 0 : t < 8.6 ? 1 : t < 12.6 ? 2 : t < 15.2 ? 3 : 4;
    if (caption && k !== last) { last = k; caption.dataset.step = String(k); }
    composer.render();
  }
  raf = requestAnimationFrame(frameFn);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); };
}
