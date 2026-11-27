(() => {
  // Shared sector/project diagrams: selection is separate from navigation.
  document.querySelectorAll('[data-dentro], [data-fiso]').forEach((root) => {
    const stage = root.querySelector('[data-diagram-stage]');
    const items = [...root.querySelectorAll('[data-diagram-code]')];
    if (!stage) return;
    const now = stage.querySelector('.ahora');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const initialLabel = now?.textContent || '';
    const codes = [...new Set(items.length ? items.map(item => item.dataset.diagramCode).filter(Boolean) : (stage.dataset.svcs || '').split(' ').filter(Boolean))];
    const show = code => {
      stage.dataset.svc = code;
      items.forEach(item => {
        const on = item.dataset.diagramCode === code;
        item.setAttribute('aria-pressed', String(on));
        item.closest('li')?.classList.toggle('on', on && codes.length > 1);
      });
      if (now) now.textContent = items.find(item => item.dataset.diagramCode === code)?.dataset.name || initialLabel;
    };
    const back = document.createElement('button');
    back.type = 'button'; back.hidden = true; back.className = 'diagram-return';
    back.style.cssText = 'min-height:44px;text-align:left;text-decoration:underline;text-underline-offset:4px';
    stage.after(back);
    let selected;
    back.addEventListener('click', () => { if (selected) { selected.focus({ preventScroll: true }); selected.scrollIntoView({ block: 'center', behavior: motion.matches ? 'instant' : 'smooth' }); } back.hidden = true; });
    const select = item => {
      show(item.dataset.diagramCode);
      const bounds = stage.getBoundingClientRect();
      if (bounds.bottom < 100 || bounds.top > innerHeight - 100) {
        selected = item; back.textContent = 'Volver a ' + item.dataset.name; back.hidden = false;
        stage.scrollIntoView({ block: 'center', behavior: motion.matches ? 'instant' : 'smooth' });
        back.focus({ preventScroll: true });
      }
    };
    items.forEach(item => {
      item.addEventListener('click', () => select(item));
      item.addEventListener('pointerenter', () => show(item.dataset.diagramCode));
      item.addEventListener('focus', () => show(item.dataset.diagramCode));
    });
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
        root.classList.add('on');
        if (stage.dataset.svc || codes[0]) show(stage.dataset.svc || codes[0]);
      }).catch(() => {
        const box = stage.querySelector('.iso__caja');
        if (box) { box.removeAttribute('role'); box.removeAttribute('aria-label'); box.textContent = 'El esquema no está disponible en este momento.'; }
      });
    }, { rootMargin: '600px 0px' }).observe(stage);
    if (codes[0]) show(codes[0]);
  });

})();
