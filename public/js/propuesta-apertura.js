// Apertura: el corte baja con el scroll y abre la imagen hasta el despiece; las isometrías
// de las aperturas siguientes se traen al acercarse; la película sólo en pantallas anchas.
(() => {
  const lugares = [...document.querySelectorAll('[data-lugar]')];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    fetch(el.dataset.src).then((r) => (r.ok ? r.text() : '')).then((svg) => { if (svg) el.innerHTML = svg; });
  }), { rootMargin: '900px 0px' });
  document.querySelectorAll('.xray__iso[data-src]').forEach((el) => io.observe(el));
  const film = document.querySelector('video[data-film]');
  if (film && matchMedia('(min-width: 900px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const desde = Number(film.dataset.desde || 0);
    film.addEventListener('loadedmetadata', () => { if (desde) film.currentTime = desde; });
    film.addEventListener('ended', () => { film.currentTime = desde; film.play().catch(() => {}); });
    film.src = film.dataset.film; film.play().catch(() => {});
  }
  // Un sistema por vez: el despiece recorre sus servicios de a uno, cada 2,6 s, desde la fase 3.
  const ciclo = (lugar, fase) => {
    const iso = lugar.querySelector('.xray__iso[data-ciclo]'); if (!iso) return;
    if (fase < 3) { clearInterval(iso._t); iso._t = 0; return; }
    if (iso._t) return;
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
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
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
  document.querySelectorAll('[data-dentro]').forEach((root) => {
    const stage = root.querySelector('.dentro__stage');
    const now = root.querySelector('.ahora');
    if (stage && stage.dataset.src) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); fetch(stage.dataset.src).then((r) => (r.ok ? r.text() : '')).then((svg) => { if (svg) stage.insertAdjacentHTML('afterbegin', svg); }); } }, { rootMargin: '900px 0px' }).observe(stage);
    const items = [...root.querySelectorAll('[data-code]')];
    if (!items.length) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const show = (a) => { stage.dataset.svc = a.dataset.code; if (now) now.textContent = a.dataset.name || ''; items.forEach((i) => i.classList.toggle('on', i === a)); };
    let t = 0, quieto = false;
    const paso = () => { const i = items.findIndex((a) => a.dataset.code === stage.dataset.svc); show(items[(i + 1) % items.length]); };
    const andar = () => { if (!t && !quieto) t = setInterval(paso, 2600); };
    const parar = () => { clearInterval(t); t = 0; };
    new IntersectionObserver(([e]) => (e.isIntersecting ? andar() : parar()), { threshold: .25 }).observe(root);
    // Sólo la lista detiene el recorrido: el puntero sobre el dibujo no cambia nada.
    const lista = root.querySelector('.dentro__side') || root;
    lista.addEventListener('pointerenter', () => { quieto = true; parar(); });
    lista.addEventListener('pointerleave', () => { quieto = false; andar(); });
    items.forEach((a) => {
      if (fine) { a.addEventListener('pointerenter', () => show(a)); a.addEventListener('focus', () => show(a)); }
      else a.addEventListener('click', (e) => { if (stage.dataset.svc !== a.dataset.code) { e.preventDefault(); show(a); parar(); quieto = true; } });
    });
  });
})();
