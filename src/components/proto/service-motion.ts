/** Animate the operating path once. Equipment, lighting and background never change frames. */
export function initServiceMotion(root: HTMLElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const figures = [...root.querySelectorAll<HTMLElement>('[data-motion-figure]')];
  const visible = new Set<HTMLElement>();
  const pending = new Set<HTMLElement>();
  const selected = (figure: HTMLElement) => root.querySelector<HTMLInputElement>(`#frente-${figure.dataset.service}`)?.checked;
  let current: { figure: HTMLElement; animation: Animation } | undefined;

  function stop() {
    current?.animation.cancel();
    current?.figure.removeAttribute('data-moving');
    current = undefined;
  }
  function start(figure: HTMLElement) {
    if (!pending.has(figure) || !visible.has(figure) || !selected(figure) || reduced.matches || document.hidden
      || figure.querySelector<HTMLInputElement>('.detalle-control')?.checked) return;
    const signal = figure.querySelector<HTMLElement>('[data-signal]');
    if (!signal || typeof signal.animate !== 'function') return;
    stop();
    pending.delete(figure);
    const animation = signal.animate([{ transform: 'translateX(-100%)' }, { transform: 'translateX(900%)' }], { duration: 2200, easing: 'linear', iterations: 1 });
    current = { figure, animation };
    figure.setAttribute('data-moving', '');
    void animation.finished.then(() => { if (current?.animation === animation) stop(); }).catch(() => { /* Cancellation on leaving the view is expected. */ });
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const figure = entry.target as HTMLElement;
      if (entry.isIntersecting && entry.intersectionRatio >= .5) {
        visible.add(figure);
        start(figure);
      } else {
        visible.delete(figure);
        if (current?.figure === figure) stop();
      }
    }
  }, { threshold: [0, .5] });
  for (const figure of figures) {
    if (selected(figure)) pending.add(figure);
    observer.observe(figure);
  }
  root.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (event.target.matches('.selector')) {
      stop();
      pending.clear();
      const figure = figures.find(selected);
      if (figure) { pending.add(figure); start(figure); }
    } else if (event.target.matches('.detalle-control')) { pending.clear(); stop(); }
  });
  // Selecting an already active service is also an explicit request to inspect it again.
  root.addEventListener('click', event => {
    const label = event.target instanceof Element ? event.target.closest<HTMLLabelElement>('label.fila') : null;
    if (!label || !root.querySelector<HTMLInputElement>(`#${label.htmlFor}`)?.checked) return;
    const figure = figures.find(selected);
    if (figure) { pending.add(figure); start(figure); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pending.clear(); stop(); } });
  reduced.addEventListener('change', () => { if (reduced.matches) { pending.clear(); stop(); } });
  window.addEventListener('pagehide', () => { stop(); pending.clear(); visible.clear(); observer.disconnect(); });
  window.addEventListener('pageshow', event => { if (event.persisted) figures.forEach(figure => observer.observe(figure)); });
}
