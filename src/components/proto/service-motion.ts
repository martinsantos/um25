/** GIFs are loaded only for the diagram the visitor can see. */
export function initFlowMotion(root: Document) {
  if (typeof IntersectionObserver === 'undefined') return;
  const frames = new Map<Element, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-flow-gif]:not([data-flow-ready])').forEach(diagram => {
    const frame = diagram.querySelector('[data-flow-art]');
    if (frame) frames.set(frame, diagram);
  });
  const diagrams = [...frames.values()];
  if (!diagrams.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set<HTMLElement>();
  const attempted = new Set<HTMLElement>();
  let active: { diagram: HTMLElement; image: HTMLImageElement } | undefined;

  const eligible = (diagram: HTMLElement) =>
    visible.has(diagram) && !root.hidden && !reduced.matches &&
    diagram.getClientRects().length > 0 &&
    !diagram.closest('[data-flow-preview]')?.querySelector('.detalle-control:checked');

  function stop() {
    if (!active) return;
    active.diagram.removeAttribute('data-flow-running');
    active.image.remove();
    active = undefined;
  }

  function update() {
    if (active && !eligible(active.diagram)) {
      attempted.delete(active.diagram);
      stop();
    }
    if (active) return;
    const diagram = diagrams.find((element) => !attempted.has(element) && eligible(element));
    const frame = diagram?.querySelector('[data-flow-art]');
    const source = diagram?.getAttribute('data-flow-gif');
    if (!diagram || !frame || !source) return;

    attempted.add(diagram);
    const image = new Image(640, 142);
    const run = { diagram, image };
    active = run;
    image.className = 'flow-gif';
    image.alt = '';
    image.decoding = 'async';
    image.addEventListener('load', () => {
      if (active !== run) return;
      if (eligible(diagram)) diagram.setAttribute('data-flow-running', '');
      else update();
    }, { once: true });
    image.addEventListener('error', () => { if (active === run) stop(); }, { once: true });
    frame.append(image);
    image.src = source;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const diagram = frames.get(entry.target);
      if (!diagram) continue;
      if (entry.isIntersecting && entry.intersectionRatio >= .55) visible.add(diagram);
      else {
        visible.delete(diagram);
        attempted.delete(diagram);
      }
    }
    update();
  }, { threshold: [0, .55] });

  frames.forEach((diagram, frame) => {
    diagram.setAttribute('data-flow-ready', '');
    observer.observe(frame);
  });
  root.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.matches('.selector,.detalle-control')) update();
  });
  root.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  window.addEventListener('pagehide', () => {
    stop();
    visible.clear();
    attempted.clear();
    observer.disconnect();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) frames.forEach((_diagram, frame) => observer.observe(frame));
  });
}
