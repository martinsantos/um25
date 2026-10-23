// "La última milla": a procedural night city, its fibre network and the one red line
// that reaches a single building. Pure code, deterministic loop, no media files.
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

const LOOP = 14;
const BG = 0x0a1118, RED = new THREE.Color(0xff2a2a), CYAN = new THREE.Color(0x45d7c9);
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));

function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), ((s ^= s >>> 16) >>> 0) / 4294967296); }

export function mountSenal(host, { onReady } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(BG, 1);
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.0125);
  const cam = new THREE.PerspectiveCamera(32, 1, 1, 600);

  // ---------- city grid: blocks separated by streets; trunks follow the avenues
  const R = rng(20261016), N = 34, CELL = 4.2, half = (N * CELL) / 2;
  const heights = [], cells = [];
  const target = { i: 22, j: 14 };            // the building the last mile reaches
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i % 6 === 0 || j % 6 === 0) continue; // avenues
    if (Math.abs(i - target.i) <= 1 && Math.abs(j - target.j) <= 1 && !(i === target.i && j === target.j)) continue; // plaza around the target
    const x = i * CELL - half, z = j * CELL - half;
    const d = Math.hypot(x, z) / half;
    const tall = Math.pow(R(), 2.4) * 22 * (1.2 - d) + 1.2 + R() * 2.5;
    const h = i === target.i && j === target.j ? 16 : Math.max(1, tall);
    cells.push({ i, j, x, z, h, w: CELL * (0.62 + R() * 0.22), d: CELL * (0.62 + R() * 0.22) });
    heights.push(h);
  }

  // Buildings: one instanced box with a shader that draws lit windows and a reveal mask.
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, .5, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uFocus: { value: new THREE.Vector3() }, uHot: { value: 0 }, uDim: { value: 1 }, fogColor: { value: new THREE.Color(BG) }, fogDensity: { value: .0125 } },
    vertexShader: `
      attribute float aSeed; attribute float aHeight; attribute float aTarget;
      varying vec3 vPos; varying vec3 vN; varying float vSeed; varying float vH; varying float vT; varying vec3 vWorld; varying float vFogDepth;
      void main(){
        vec4 w = instanceMatrix * vec4(position,1.); vWorld = (modelMatrix*w).xyz;
        vPos = position; vN = normal; vSeed = aSeed; vH = aHeight; vT = aTarget;
        vec4 mv = viewMatrix * vec4(vWorld,1.); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform float uTime, uReveal, uHot, uDim, fogDensity; uniform vec3 uFocus, fogColor;
      varying vec3 vPos; varying vec3 vN; varying float vSeed; varying float vH; varying float vT; varying vec3 vWorld; varying float vFogDepth;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1)))*43758.5); }
      void main(){
        // wavefront from the network core reveals the city
        float dist = length(vWorld.xz);
        float rv = smoothstep(uReveal-6., uReveal, -dist+uReveal*2.);
        vec3 base = mix(vec3(.035,.055,.075), vec3(.07,.1,.13), clamp(vWorld.y/30.,0.,1.));
        float side = 1.-abs(vN.y);
        // windows on vertical faces
        vec2 uv = (abs(vN.x)>.5 ? vPos.zy : vPos.xy) * vec2(6., vH*2.2);
        vec2 cell = floor(uv); vec2 f = fract(uv);
        float win = step(.26,f.x)*step(f.x,.74)*step(.32,f.y)*step(f.y,.68);
        float on = step(.62, h(cell + vSeed*13.1));
        float flick = .75 + .25*sin(uTime*1.3 + h(cell)*30.);
        vec3 warm = mix(vec3(1.,.78,.5), vec3(.6,.85,1.), h(cell+3.7));
        vec3 col = base + side*win*on*warm*.3*flick*rv;
        // roof edge glow
        col += (1.-side)*vec3(.025,.04,.05);
        // the target building: lit red when the last mile arrives
        if (vT > .5){ col = mix(col, vec3(1.,.12,.12)*(.55+side*win*2.2), uHot); }
        col *= vT > .5 ? 1. : uDim;
        col *= .35 + .65*rv;
        float fog = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
        gl_FragColor = vec4(mix(col, fogColor, fog), 1.);
      }`,
  });
  const city = new THREE.InstancedMesh(geo, mat, cells.length);
  const seeds = new Float32Array(cells.length), hs = new Float32Array(cells.length), tg = new Float32Array(cells.length);
  const m4 = new THREE.Matrix4();
  let targetPos = new THREE.Vector3();
  cells.forEach((c, k) => {
    m4.compose(new THREE.Vector3(c.x, 0, c.z), new THREE.Quaternion(), new THREE.Vector3(c.w, c.h, c.d));
    city.setMatrixAt(k, m4); seeds[k] = R(); hs[k] = c.h;
    const isT = c.i === target.i && c.j === target.j; tg[k] = isT ? 1 : 0;
    if (isT) targetPos.set(c.x, c.h, c.z);
  });
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geo.setAttribute('aHeight', new THREE.InstancedBufferAttribute(hs, 1));
  geo.setAttribute('aTarget', new THREE.InstancedBufferAttribute(tg, 1));
  scene.add(city);

  // Ground: subtle street grid.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShaderMaterial({
    uniforms: { fogColor: { value: new THREE.Color(BG) } },
    vertexShader: 'varying vec2 vP; varying float vD; void main(){ vec4 w=modelMatrix*vec4(position,1.); vP=w.xz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader: `uniform vec3 fogColor; varying vec2 vP; varying float vD;
      void main(){ vec2 g=abs(fract(vP/${(CELL * 6).toFixed(1)}+.5)-.5); float l=1.-smoothstep(.0,.012,min(g.x,g.y));
        vec3 c=vec3(.025,.04,.055)+l*vec3(.06,.09,.11); float fog=1.-exp(-.000156*vD*vD); gl_FragColor=vec4(mix(c,fogColor,fog),1.); }`,
  }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  // ---------- network: trunks along avenues, branches to blocks, packets flowing
  const avenues = [];
  for (let k = 0; k <= N; k += 6) avenues.push(k * CELL - half);
  const lines = [];
  const coreX = avenues[Math.floor(avenues.length / 2)], coreZ = avenues[Math.floor(avenues.length / 2)];
  for (const a of avenues) { lines.push([[a, .15, -half], [a, .15, half]]); lines.push([[-half, .15, a], [half, .15, a]]); }
  // The last mile: from the core, along avenues, then into the target block.
  const tx = targetPos.x, tz = targetPos.z;
  const nearAveX = avenues.reduce((p, a) => (Math.abs(a - tx) < Math.abs(p - tx) ? a : p));
  const lastMile = [[coreX, .2, coreZ], [nearAveX, .2, coreZ], [nearAveX, .2, tz], [tx, .2, tz], [tx, targetPos.y + .3, tz]];

  const trunkMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uDim: { value: 1 }, uColor: { value: CYAN } },
    vertexShader: 'attribute float aS; attribute float aD; varying float vS; varying float vD; void main(){ vS=aS; vD=aD; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uTime,uReveal,uDim; uniform vec3 uColor; varying float vS; varying float vD;
      void main(){ float on=smoothstep(uReveal-4.,uReveal,-vD+uReveal*2.);
        float pk=pow(max(0.,sin(vS*.35-uTime*5.)),24.);
        gl_FragColor=vec4(uColor*(.38+pk*2.2)*on*uDim, (.45+pk)*on*uDim); }`,
  });
  function lineGeometry(pathList) {
    const pos = [], s = [], d = [];
    for (const path of pathList) {
      let acc = 0;
      for (let k = 1; k < path.length; k++) {
        const a = new THREE.Vector3(...path[k - 1]), b = new THREE.Vector3(...path[k]), len = a.distanceTo(b);
        const steps = Math.max(1, Math.round(len / .8));
        for (let q = 0; q < steps; q++) {
          const p0 = a.clone().lerp(b, q / steps), p1 = a.clone().lerp(b, (q + 1) / steps);
          pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
          s.push(acc + len * q / steps, acc + len * (q + 1) / steps);
          d.push(Math.hypot(p0.x - coreX, p0.z - coreZ), Math.hypot(p1.x - coreX, p1.z - coreZ));
        }
        acc += len;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(s, 1));
    g.setAttribute('aD', new THREE.Float32BufferAttribute(d, 1));
    return g;
  }
  const trunks = new THREE.LineSegments(lineGeometry(lines), trunkMat); scene.add(trunks);

  // Last mile: a thick tube that draws itself, plus a bright head.
  // The last mile rises from the core, crosses above the skyline and lands on the roof.
  const mid = new THREE.Vector3((coreX + tx) / 2, 38, (coreZ + tz) / 2);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(coreX, .2, coreZ), new THREE.Vector3(coreX, 18, coreZ), mid,
    new THREE.Vector3(tx, targetPos.y + 16, tz), new THREE.Vector3(tx, targetPos.y + .3, tz),
  ], false, 'catmullrom', .35);
  // Core node: a small beacon where every line starts.
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 3, 32), new THREE.MeshBasicMaterial({ color: 0x45d7c9 }));
  core.position.set(coreX, 1.5, coreZ); scene.add(core);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 600, .2, 12, false), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uP: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uP,uTime; varying vec2 vUv;
      void main(){ float drawn=step(vUv.x,uP); float head=smoothstep(uP-.06,uP,vUv.x)*drawn;
        // a comet trail: only the stretch behind the head stays lit, the rest fades out
        float trail=smoothstep(uP-.4,uP,vUv.x)*drawn;
        float pulse=.6+.4*sin(vUv.x*80.-uTime*14.);
        gl_FragColor=vec4(vec3(1.,.16,.16)*(1.4*pulse*trail+head*5.), trail); }`,
  }));
  scene.add(tube);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd0d0 }));
  scene.add(head);
  // Arrival ring.
  const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 96), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(tx, targetPos.y + .4, tz); scene.add(ring);

  // ---------- post
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .7, .5, .42); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
    cam.aspect = w / h; cam.fov = w / h < 1 ? 46 : 32; cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  // ---------- timeline
  const camWide = new THREE.Vector3(-58, 62, 78), camClose = new THREE.Vector3(tx - 22, targetPos.y + 20, tz + 30);
  const lookWide = new THREE.Vector3(4, 0, 0), lookClose = targetPos.clone().setY(targetPos.y * .6).add(new THREE.Vector3(-4, 0, 0));
  const v = new THREE.Vector3(), l = new THREE.Vector3();
  const caption = host.querySelector('[data-senal-caption]');
  let last = -1, visible = true, raf = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(host);
  const t0 = performance.now(), freeze = Number(new URLSearchParams(location.search).get('t'));

  function frame(now) {
    raf = requestAnimationFrame(frame); if (!visible || document.hidden) return;
    const t = reduce ? 11.5 : Number.isFinite(freeze) && new URLSearchParams(location.search).has('t') ? freeze : ((now - t0) / 1000) % LOOP;
    const reveal = smooth(0, 3.2, t) * 160;
    mat.uniforms.uTime.value = t; mat.uniforms.uReveal.value = reveal;
    trunkMat.uniforms.uTime.value = t; trunkMat.uniforms.uReveal.value = reveal;
    const mile = smooth(4.2, 8.2, t);
    tube.material.uniforms.uP.value = mile; tube.material.uniforms.uTime.value = t;
    head.position.copy(curve.getPointAt(Math.max(.0001, mile))); head.visible = mile > 0 && mile < 1;
    const arrive = smooth(8.1, 8.9, t);
    mat.uniforms.uHot.value = arrive * (1 - smooth(13.2, 14, t));
    trunkMat.uniforms.uDim.value = 1 - .6 * smooth(7.4, 9.4, t) + .6 * smooth(12.6, 14, t);
    mat.uniforms.uDim.value = 1 - .55 * smooth(8.6, 10.2, t) + .55 * smooth(13, 14, t);
    const rt = clamp((t - 8.2) / 1.6);
    ring.scale.setScalar(1 + rt * 9); ring.material.opacity = rt > 0 && rt < 1 ? (1 - rt) * .9 : 0;
    // camera: wide orbit, then push in along the last mile, then release
    const push = smooth(5.2, 9.6, t) * (1 - smooth(12.4, 14, t));
    const orbit = t * .035;
    v.copy(camWide).applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit).lerp(camClose, push);
    l.copy(lookWide).lerp(lookClose, push);
    cam.position.copy(v); cam.lookAt(l);
    // captions
    const k = t < 4 ? 0 : t < 8.2 ? 1 : t < 12.4 ? 2 : 3;
    if (caption && k !== last) { last = k; caption.dataset.step = String(k); }
    composer.render();
  }
  raf = requestAnimationFrame(frame);
  onReady?.();
  return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); renderer.domElement.remove(); };
}
