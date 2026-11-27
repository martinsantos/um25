// Each browser history entry remembers its own project link, including which
// installation was chosen on cards that link to more than one project.
let salida: HTMLAnchorElement | null = null;

document.addEventListener('click', (event) => {
  if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  salida = event.target instanceof Element ? event.target.closest('a[data-regreso-obra]') : null;
});

window.addEventListener('pagehide', () => {
  const foco = document.activeElement;
  const enlace = salida || (foco instanceof HTMLAnchorElement && foco.hasAttribute('data-regreso-obra') ? foco : null);
  const state = { ...history.state };
  if (enlace) {
    state.regresoObra = { grupo: enlace.dataset.regresoObra, href: enlace.getAttribute('href') };
  } else if (state.regresoObra) {
    delete state.regresoObra;
  } else {
    return;
  }
  history.replaceState(state, '');
  salida = null;
});

window.addEventListener('pageshow', (event) => {
  const guardado = history.state?.regresoObra;
  if (!guardado) return;
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!event.persisted && navigation?.type !== 'back_forward') return;
  const enlace = [...document.querySelectorAll<HTMLAnchorElement>('a[data-regreso-obra]')].find(
    link => link.dataset.regresoObra === guardado.grupo && link.getAttribute('href') === guardado.href
  );
  if (!enlace) return;
  const fold = enlace.closest<HTMLDetailsElement>('details[data-obras-plegadas]');
  if (fold) fold.open = true;
  if (!enlace.getClientRects().length) return;
  enlace.focus({ preventScroll: true });
  // Let the browser restore its scroll position first. A different viewport
  // or loaded image dimensions can put the focused link outside the page.
  requestAnimationFrame(() => {
    if (document.activeElement !== enlace) return;
    const rect = enlace.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const bottom = innerHeight - (document.querySelector<HTMLElement>('.um-tabbar')?.offsetHeight || 0);
    if (rect.top < top || rect.bottom > bottom) {
      enlace.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    }
  });
});
