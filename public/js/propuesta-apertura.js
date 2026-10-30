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
  if (film && matchMedia('(min-width: 900px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) { film.src = film.dataset.film; film.play().catch(() => {}); }
  let raf = 0;
  const update = () => {
    raf = 0;
    lugares.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      el.style.setProperty('--cut', String(100 - Math.min(1, p / .5) * 100));
      el.style.setProperty('--linea', p < .02 || p > .52 ? '0' : '1');
      const fase = p < .12 ? 0 : p < .5 ? 1 : p < .78 ? 2 : 3;
      if (el.dataset.fase !== String(fase)) el.dataset.fase = String(fase);
    });
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();

  // El lugar por dentro: cada servicio enciende su recorrido en el despiece.
  document.querySelectorAll('[data-dentro]').forEach((root) => {
    const stage = root.querySelector('.dentro__stage');
    const now = root.querySelector('.ahora');
    if (stage && stage.dataset.src) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); fetch(stage.dataset.src).then((r) => (r.ok ? r.text() : '')).then((svg) => { if (svg) stage.insertAdjacentHTML('afterbegin', svg); }); } }, { rootMargin: '900px 0px' }).observe(stage);
    const items = [...root.querySelectorAll('[data-code]')];
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const show = (a) => { stage.dataset.svc = a.dataset.code; if (now) now.textContent = a.dataset.name || ''; items.forEach((i) => i.classList.toggle('on', i === a)); };
    items.forEach((a) => {
      if (fine) { a.addEventListener('pointerenter', () => show(a)); a.addEventListener('focus', () => show(a)); }
      else a.addEventListener('click', (e) => { if (stage.dataset.svc !== a.dataset.code) { e.preventDefault(); show(a); } });
    });
  });
})();
