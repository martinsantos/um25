// Apertura: el corte baja con el scroll y abre la imagen hasta el despiece; las isometrías
// de las aperturas siguientes se traen al acercarse; la película sólo en pantallas anchas.
(() => {
  const lugares = [...document.querySelectorAll('[data-lugar]')];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    fetch(el.dataset.src, { priority: 'low' }).then((r) => (r.ok ? r.text() : '')).then((svg) => { if (svg) el.innerHTML = svg; });
  }), { rootMargin: '900px 0px' });
  document.querySelectorAll('.xray__iso[data-src]').forEach((el) => io.observe(el));
  const film = document.querySelector('video[data-film]');
  if (film && matchMedia('(min-width: 900px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const desde = Number(film.dataset.desde || 0);
    film.addEventListener('loadedmetadata', () => { if (desde) film.currentTime = desde; });
    film.addEventListener('ended', () => { film.currentTime = desde; film.play().catch(() => {}); });
    film.addEventListener('playing', () => film.classList.add('andando'), { once: true });
    film.src = film.dataset.film; film.play().catch(() => {});
  }
  // Un sistema por vez: el despiece recorre sus servicios de a uno, cada 2,6 s, desde la fase 3.
  const ciclo = (lugar, fase) => {
    const iso = lugar.querySelector('.xray__iso[data-ciclo]'); if (!iso) return;
    if (fase < 3) { clearInterval(iso._t); iso._t = 0; return; }
    if (iso._t || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nombres = Object.fromEntries((iso.dataset.nombres || '').split('|').filter(Boolean).map((p) => p.split(':')));
    const rotulo = lugar.querySelector('[data-rotulo]');
    const paso = () => {
      const codes = [...iso.querySelectorAll('.sp-route')].map((r) => r.dataset.projectRoute).filter(Boolean); if (!codes.length) return;
      const i = (codes.indexOf(iso.dataset.svc) + 1) % codes.length; iso.dataset.svc = codes[i];
      if (rotulo) { rotulo.classList.remove('on'); rotulo.textContent = nombres[codes[i]] || ''; requestAnimationFrame(() => rotulo.classList.add('on')); }
    };
    paso(); iso._t = setInterval(paso, 2600);
  };
  let raf = 0;
  const update = () => {
    raf = 0;
    lugares.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      // A natural-height mobile hero can be shorter than the viewport. Give
      // its transition a positive scroll distance instead of dividing by zero.
      const recorrido = Math.max(r.height - innerHeight, innerHeight * .25);
      const p = Math.min(1, Math.max(0, -r.top / recorrido));
      const e = Math.min(1, p / .55);
      const k = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
      el.style.setProperty('--cut', String(100 - k * 100));
      const fondo = el.querySelector('.lugar__fondo video');
      if (fondo && fondo.src) { if (k > .62) { if (!fondo.paused) fondo.pause(); } else if (fondo.paused) fondo.play().catch(() => {}); }
      el.style.setProperty('--linea', p < .02 || p > .57 ? '0' : '1');
      const fase = p < .1 ? 0 : p < .55 ? 1 : p < .82 ? 2 : 3;
      if (el.dataset.fase !== String(fase)) { el.dataset.fase = String(fase); ciclo(el, fase); }
    });
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();

  // El lugar por dentro: recorre sus servicios de a uno, cada 2,6 s, mientras está a la vista; el
  // puntero sobre la lista toma el control y, al irse, el recorrido sigue. Nadie tiene que adivinar.
  // Shared sector/project diagrams: selection is separate from navigation.
  document.querySelectorAll('[data-dentro], [data-fiso]').forEach((root) => {
    const stage = root.querySelector('[data-diagram-stage]');
    const items = [...root.querySelectorAll('[data-diagram-code]')];
    if (!stage) return;
    const now = stage.querySelector('.ahora');
    const toggle = root.querySelector('[data-diagram-toggle]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const initialLabel = now?.textContent || '';
    const codes = [...new Set(items.length ? items.map(item => item.dataset.diagramCode).filter(Boolean) : (stage.dataset.svcs || '').split(' ').filter(Boolean))];
    let timer = 0, ready = false, visible = false, paused = false, hovered = false, focused = false;
    const stop = () => { clearInterval(timer); timer = 0; };
    const show = code => {
      stage.dataset.svc = code;
      items.forEach(item => {
        const on = item.dataset.diagramCode === code;
        item.setAttribute('aria-pressed', String(on));
        item.closest('li')?.classList.toggle('on', on && codes.length > 1);
      });
      if (now) now.textContent = items.find(item => item.dataset.diagramCode === code)?.dataset.name || initialLabel;
    };
    const sync = () => {
      stop();
      if (toggle) {
        toggle.hidden = motion.matches || codes.length < 2;
        toggle.textContent = paused ? 'Reproducir recorrido' : 'Pausar recorrido';
      }
      if (!ready || !visible || paused || hovered || focused || motion.matches || document.hidden || codes.length < 2) return;
      timer = setInterval(() => show(codes[(codes.indexOf(stage.dataset.svc) + 1) % codes.length]), 2600);
    };
    const back = document.createElement('button');
    back.type = 'button'; back.hidden = true; back.className = 'diagram-return';
    back.style.cssText = 'min-height:44px;text-align:left;text-decoration:underline;text-underline-offset:4px';
    stage.after(back);
    let selected;
    back.addEventListener('click', () => { if (selected) { selected.focus({ preventScroll: true }); selected.scrollIntoView({ block: 'center', behavior: motion.matches ? 'instant' : 'smooth' }); } back.hidden = true; });
    const select = item => {
      show(item.dataset.diagramCode); paused = true; sync();
      const bounds = stage.getBoundingClientRect();
      if (bounds.bottom < 100 || bounds.top > innerHeight - 100) {
        selected = item; back.textContent = 'Volver a ' + item.dataset.name; back.hidden = false;
        stage.scrollIntoView({ block: 'center', behavior: motion.matches ? 'instant' : 'smooth' });
        back.focus({ preventScroll: true });
      }
    };
    items.forEach(item => {
      item.addEventListener('click', () => select(item));
      item.addEventListener('pointerenter', () => { hovered = true; show(item.dataset.diagramCode); sync(); });
      item.addEventListener('pointerleave', () => { hovered = false; sync(); });
      item.addEventListener('focus', () => { focused = true; show(item.dataset.diagramCode); sync(); });
      item.addEventListener('blur', () => { focused = false; sync(); });
    });
    toggle?.addEventListener('click', () => { paused = !paused; sync(); });
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .25 }).observe(stage);
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      fetch(stage.dataset.src, { priority: 'low' }).then(response => {
        if (!response.ok) throw new Error('Diagram unavailable');
        return response.text();
      }).then(markup => {
        const box = stage.querySelector('.iso__caja');
        if (!box) return;
        box.insertAdjacentHTML('afterbegin', markup);
        const svg = box.querySelector('svg');
        if (svg && root.hasAttribute('data-fiso') && !svg.dataset.fit) {
          try {
            const b = svg.getBBox(), pad = Math.max(b.width, b.height) * .05;
            if (b.width && b.height) svg.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          } catch { /* Keep the original viewBox. */ }
        }
        root.classList.add('on'); ready = true;
        show(stage.dataset.svc || codes[0]); sync();
      }).catch(() => {
        const box = stage.querySelector('.iso__caja');
        if (box) { box.removeAttribute('role'); box.removeAttribute('aria-label'); box.textContent = 'El esquema no está disponible en este momento.'; }
        if (toggle) toggle.hidden = true;
      });
    }, { rootMargin: '600px 0px' }).observe(stage);
    show(codes[0]); sync();
  });

})();
