// Banner cine: un plano pre-renderizado por escena (vuelo por la instalación con cortes
// entre edificio y esqueleto de sistemas), etiquetas que siguen a cada equipo con la
// pista exportada desde Blender, y el 3D interactivo sólo si se pide.
const SERVICES = {
  Data: ['Redes', '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', '#2bb3d6'],
  Fiber: ['Redes · fibra óptica', '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', '#d9934a'],
  WiFi: ['Redes · Wi-Fi', '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces', '#5cc7d9'],
  Telecom: ['Telecomunicaciones', '/servicios/103/telecomunicaciones-datos-voz-video', '#a07ae0'],
  CCTV: ['Seguridad electrónica', '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', '#e0679f'],
  Security: ['Control de accesos', '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', '#3fb07e'],
  Intercom: ['Seguridad electrónica', '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi', '#cf7dbb'],
  'Fire-detection': ['Detección de incendios', '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios', '#ef5a44'],
  Power: ['Eléctricos IT', '/servicios/108/servicios-electricos-para-it', '#d9a23a'],
  Software: ['Software a medida', '/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp', '#6f9be6'],
};
const TITLES = { bodega: 'Bodega', fachada: 'Edificio corporativo', aeropuerto: 'Terminal aeroportuaria', hospital: 'Hospital', planta: 'Planta de altura' };
const ENGINE = { planta: 'bodega' }; // el motor 3D usa la nave de la bodega para la planta
const clean = (s) => String(s || '').replace(/\s*\/\s*DEMO\b/gi, '').replace(/\bDEMO\b\s*[·-]?\s*/gi, '').trim();
const motionLimited = () => matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(navigator.connection?.saveData);
const compact = () => innerWidth <= 820 || matchMedia('(pointer: coarse)').matches;
// Un plano es una escena ("bodega", movie general) o una escena con un servicio
// ("bodega-redes", movies v4 en /cine/v4/).
const base = (id) => (id.includes('-') ? `/cine/v4/cine-${id}` : `/cine/media/cine-${id}`);
const sceneOf = (id) => String(id || '').split('-')[0];
const tracks = new Map();
const loadTrack = (id) => {
  if (!tracks.has(id)) tracks.set(id, fetch(`${base(id)}-ar.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return tracks.get(id);
};

function banner(el) {
  const scenes = el.dataset.scenes.split(',');
  const captions = (el.dataset.captions || '').split('|');
  const only = (el.dataset.systems || '').split(',').filter(Boolean);
  const [va, vb] = el.querySelectorAll('.umc-video');
  const poster = el.querySelector('.umc-poster');
  const stage = el.querySelector('.umc-stage');
  const layer = el.querySelector('.umc-ar');
  const rail = [...el.querySelectorAll('[data-umc-scene]')];
  const motion = el.querySelector('[data-umc-motion]');
  const caption = el.querySelector('[data-umc-caption]');
  const multi = scenes.length > 1;
  // Escenario angosto (teléfono vertical): recorte cuadrado 1080×1080 de la zona que
  // encuadra el escenario, píxel a píxel. Más ancho (tablet, desktop): 1080p completo.
  const SQ = { x: 487, w: 1080, h: 1080 };
  const narrow = () => stage.clientWidth <= stage.clientHeight * 1.05;
  const src = (id) => `${base(id)}${narrow() ? '-sq' : ''}.mp4`;
  let index = 0, active = va, idle = vb, track = null, visible = true, userPaused = motionLimited();
  // El video no compite con el póster (LCP): arranca con la página ya cargada.
  let started = false;
  let shown = [], lastPick = 0, cutting = false, preloaded = -1, posNow = .5;

  const pool = Array.from({ length: 4 }, () => {
    const t = document.createElement('a');
    t.className = 'umc-tag';
    t.tabIndex = -1;
    t.innerHTML = '<i class="umc-tag__ret"></i><i class="umc-tag__lead"></i><span class="umc-tag__card"><small></small><strong></strong></span>';
    layer.appendChild(t);
    return { el: t, id: null, small: t.querySelector('small'), name: t.querySelector('strong') };
  });

  const useTrack = (scene) => { track = null; loadTrack(scene).then((t) => { if (el.dataset.scene === scene) track = t; }); };
  const clearTags = () => { shown = []; pool.forEach((p) => { p.id = null; p.el.classList.remove('is-on'); }); };
  const mark = (i) => {
    el.dataset.scene = scenes[i];
    rail.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    if (caption) caption.textContent = captions[i] || TITLES[sceneOf(scenes[i])] || '';
    if (poster && multi) poster.src = `${base(scenes[i])}-poster.jpg`;
  };

  function play() {
    if (!started) return;
    if (userPaused || !visible || document.hidden) { active.pause(); return; }
    if (!active.getAttribute('src')) { active.loop = !multi; active.src = src(scenes[index]); }
    active.play().then(() => { active.classList.add('is-on'); poster.classList.add('is-hidden'); }).catch((e) => {
      if (e?.name === 'NotAllowedError') { userPaused = true; label(); }
    });
  }
  function label() {
    const paused = userPaused || active.paused;
    el.classList.toggle('is-paused', paused);
    motion?.setAttribute('aria-label', paused ? 'Reanudar el recorrido' : 'Pausar el recorrido');
  }
  // Corte seco al plano siguiente: el glitch del final y del comienzo disimulan el empalme.
  function cutTo(i) {
    if (cutting) return;
    cutting = true;
    index = (i + scenes.length) % scenes.length;
    const scene = scenes[index];
    if (preloaded !== index) { idle.src = src(scene); preloaded = index; }
    idle.currentTime = 0;
    idle.loop = !multi;
    idle.play().then(() => {
      idle.classList.add('is-on');
      active.classList.remove('is-on');
      active.pause();
      [active, idle] = [idle, active];
      mark(index);
      useTrack(scene);
      clearTags();
      preloaded = -1;
      cutting = false;
    }).catch(() => { cutting = false; });
  }

  // Pista: 'linear' (v3, un cuadro de video = un cuadro de render) o ida y vuelta con pausa (v2).
  const frameAt = (f) => {
    const n = track.frames;
    if (track.order === 'linear') return Math.max(0, Math.min(n - 1, Math.floor(f)));
    const hold = track.hold || 0, len = hold + 2 * n - 2;
    const k = ((Math.floor(f) % len) + len) % len - hold;
    return k < 0 ? n - 1 : k < n ? n - 1 - k : k - n + 1;
  };
  const inRanges = (ranges, f) => (ranges || []).some(([a, b]) => f >= a && f < b);
  const sample = (id, time) => {
    const f = time * (track.fps || 24);
    const a = track.track[id][frameAt(f)], b = track.track[id][frameAt(f + 1)];
    const u = f - Math.floor(f);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] && b[2]];
  };
  // Del cuadro original (1920×1080, coordenadas normalizadas) al escenario, con la
  // misma cuenta que object-fit: cover + object-position del video visible.
  function project(nx, ny) {
    const w = stage.clientWidth, h = stage.clientHeight;
    const sq = (active.currentSrc || active.src || '').includes('-sq.mp4');
    const vw = sq ? SQ.w : 1920, vh = sq ? SQ.h : 1080;
    const px = nx * 1920 - (sq ? SQ.x : 0), py = ny * 1080;
    const pos = posNow;
    const s = Math.max(w / vw, h / vh);
    return [(w - vw * s) * pos + px * s, (h - vh * s) / 2 + py * s, w, h];
  }
  // Zona libre en coordenadas de la sección (el escenario puede estar corrido a la derecha).
  const free = (x, y, w, h) => {
    const sx = x + stage.offsetLeft, W = el.clientWidth;
    return compact()
      ? y > h * .38 && y < h * .74 && x > w * .12 && x < w * .88
      : !(sx < W * .5 && y > h * .2) && y > Math.max(h * .1, 120) && y < h * .8 && sx > W * .05 && sx < W * .95;
  };
  // Ancho real de la etiqueta (desplazamiento 28–34 px + tarjeta) para decidir el lado.
  const cardW = () => (compact() ? 236 : 310);
  const flips = (x) => x + stage.offsetLeft > el.clientWidth - cardW() - 16;
  const box = (x, y, w) => (flips(x, w) ? [x - cardW(), y - 90, x + 12, y + 12] : [x - 12, y - 90, x + cardW(), y + 12]);
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const ahead = (id, time) => { let n = 0; for (let k = 0; k < 30; k += 3) if (sample(id, time + k / 24)[2]) n++; return n; };
  const eligible = (a) => SERVICES[a.system] && (!only.length || only.includes(a.system));

  function pick(time, skeleton) {
    const limit = compact() ? 1 : skeleton ? 4 : 2;
    const keep = shown.filter((id) => { const [nx, ny, v] = sample(id, time); const [x, y, w, h] = project(nx, ny); return v && free(x, y, w, h); }).slice(0, limit);
    const boxes = keep.map((id) => { const [nx, ny] = sample(id, time); const [x, y, w] = project(nx, ny); return box(x, y, w); });
    const systems = new Set(keep.map((id) => track.assets.find((a) => a.id === id)?.system));
    const candidates = track.assets.filter((a) => eligible(a) && !keep.includes(a.id)).map((a) => {
      const [nx, ny, v] = sample(a.id, time);
      const [x, y, w, h] = project(nx, ny);
      return { a, x, y, w, ok: v && free(x, y, w, h), score: ahead(a.id, time) };
    }).filter((c) => c.ok && c.score >= 6).sort((p, q) => q.score - p.score);
    for (const c of candidates) {
      if (keep.length >= limit) break;
      if (systems.has(c.a.system) && candidates.some((o) => o !== c && !systems.has(o.a.system))) continue;
      const b = box(c.x, c.y, c.w);
      if (boxes.some((o) => hit(o, b))) continue;
      keep.push(c.a.id); boxes.push(b); systems.add(c.a.system);
    }
    shown = keep;
    pool.forEach((p) => { if (p.id && !shown.includes(p.id)) { p.id = null; p.el.classList.remove('is-on'); } });
    for (const id of shown) {
      if (pool.some((p) => p.id === id)) continue;
      const slot = pool.find((p) => !p.id);
      if (!slot) break;
      const a = track.assets.find((x) => x.id === id);
      const [service, href, color] = SERVICES[a.system];
      slot.id = id;
      slot.el.style.setProperty('--c', color);
      slot.el.href = href;
      slot.small.textContent = service;
      slot.name.textContent = clean(a.name);
      slot.el.classList.add('is-on');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!track || active.paused || !active.classList.contains('is-on')) return;
    posNow = parseFloat(getComputedStyle(active).objectPosition) / 100 || .5;
    const time = active.currentTime;
    const f = time * (track.fps || 24);
    const skeleton = inRanges(track.beats, f);
    el.classList.toggle('is-glitch', inRanges(track.glitch, f));
    if (now - lastPick > 450) { lastPick = now; pick(time, skeleton); }
    for (const p of pool) {
      if (!p.id) continue;
      const [nx, ny] = sample(p.id, time);
      const [x, y, w] = project(nx, ny);
      const flip = flips(x, w);
      p.el.classList.toggle('is-flip', flip);
      p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      // La tarjeta nunca sale de la sección: se corre lo justo para quedar dentro.
      const card = p.card || (p.card = p.el.querySelector('.umc-tag__card'));
      if (card) {
        const cw = card.offsetWidth, off = compact() ? 28 : 34, sx = x + stage.offsetLeft, W = el.clientWidth;
        const left = flip ? sx - off - cw : sx + off;
        const dx = left < 8 ? 8 - left : left + cw > W - 8 ? W - 8 - (left + cw) : 0;
        card.style.translate = dx ? `${dx.toFixed(1)}px 0` : '';
      }
    }
    const bar = rail[index]?.querySelector('b');
    if (bar && active.duration) bar.style.transform = `scaleX(${Math.min(1, time / active.duration).toFixed(4)})`;
    if (multi && active.duration) {
      const next = (index + 1) % scenes.length;
      if (time > active.duration - 3 && preloaded !== next) { idle.src = src(scenes[next]); idle.preload = 'auto'; idle.load(); preloaded = next; }
      if (time >= active.duration - .05) cutTo(next);
    }
  }

  rail.forEach((b, k) => b.addEventListener('click', () => {
    if (k === index) return;
    started = true;
    userPaused = false;
    cutTo(k);
    label();
  }));
  motion?.addEventListener('click', () => {
    started = true;
    userPaused = !(userPaused || active.paused);
    if (userPaused) active.pause(); else play();
    label();
  });
  for (const v of [va, vb]) {
    v.addEventListener('play', label);
    v.addEventListener('pause', label);
    v.addEventListener('ended', () => { if (v === active && multi) cutTo(index + 1); });
    v.addEventListener('error', () => { if (v === active) { v.classList.remove('is-on'); poster.classList.remove('is-hidden'); } });
  }
  new IntersectionObserver(([e]) => { visible = e.intersectionRatio > .15; play(); label(); }, { threshold: [0, .15, .5] }).observe(el);
  document.addEventListener('visibilitychange', () => { play(); label(); });
  el.querySelector('[data-umc-3d]')?.addEventListener('click', () => explore(sceneOf(el.dataset.scene)));
  useTrack(scenes[0]);
  active.loop = !multi;
  const start = () => {
    if (started) return;
    started = true;
    if (!userPaused) { active.preload = 'auto'; play(); }
  };
  const whenIdle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 600));
  if (document.readyState === 'complete') whenIdle(); else addEventListener('load', whenIdle, { once: true });
  label();
  requestAnimationFrame(frame);
}

// Motor 3D en un diálogo: se monta al abrir y se desmonta al cerrar (libera GPU y memoria).
function explore(scene) {
  let dlg = document.querySelector('.umc-dialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.className = 'umc-dialog';
    dlg.innerHTML = '<div class="umc-dialog__bar"><p><b data-umc-dialog-title>Gemelo digital</b><span>Arrastrá para orbitar · rueda para acercar</span></p><button type="button" aria-label="Cerrar el gemelo digital">Cerrar</button></div><div class="umc-dialog__view"></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('button').addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => { dlg.querySelector('.umc-dialog__view').replaceChildren(); document.documentElement.classList.remove('umc-lock'); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }
  const name = TITLES[scene] || '';
  dlg.querySelector('[data-umc-dialog-title]').textContent = name ? `Gemelo digital · ${name}` : 'Gemelo digital';
  dlg.setAttribute('aria-label', name ? `Gemelo digital · ${name}` : 'Gemelo digital');
  const frame = document.createElement('iframe');
  frame.title = name ? `Gemelo digital interactivo · ${name}` : 'Gemelo digital interactivo';
  frame.src = `/3d/cinema.html?scene=${ENGINE[scene] || scene}&mode=building&embed=1&ar=clean&center=1`;
  frame.allow = 'fullscreen';
  dlg.querySelector('.umc-dialog__view').replaceChildren(frame);
  document.documentElement.classList.add('umc-lock');
  dlg.showModal();
  const send = (action, value) => frame.contentWindow?.postMessage({ type: 'um-cinema-command', action, value }, location.origin);
  let armed = false;
  const onState = (e) => {
    if (e.source !== frame.contentWindow) return;
    if (e.data?.type === 'um-cinema-exit') { dlg.close(); return; }
    if (e.data?.type !== 'um-cinema-state' || !e.data.ready || armed) return;
    armed = true;
    send('mode', 'systems');
    send('focus', ['Data', 'Telecom', 'CCTV', 'Security', 'Fire-detection', 'Power', 'Software']);
    send('play');
    setTimeout(() => { send('explore', true); frame.focus(); }, 2400);
  };
  addEventListener('message', onState);
  dlg.addEventListener('close', () => removeEventListener('message', onState), { once: true });
}

document.querySelectorAll('[data-umc]').forEach(banner);
