export function initResourcePreviews() {
  const root = document.querySelector<HTMLElement>('#um-resources');
  if (!root || root.dataset.previewsReady) return;
  root.dataset.previewsReady = 'true';
  const controller = new AbortController();
  const sections = Array.from(root.querySelectorAll<HTMLElement>('.rl-item'));
  const navigation = Array.from(root.querySelectorAll<HTMLAnchorElement>('.rl-index a'));
  const selectDocument = (id: string) => {
    const selected = sections.find(section => section.id === (id === 'template-economy-title' ? 'oferta-economica' : id)) || sections[0];
    sections.forEach(section => { section.hidden = section !== selected; });
    navigation.forEach(link => {
      if (link.hash === '#' + selected.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };
  navigation.forEach(link => link.addEventListener('click', () => selectDocument(link.hash.slice(1))));
  window.addEventListener('hashchange', () => selectDocument(location.hash.slice(1)), { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => controller.abort(), { once: true });
  selectDocument(location.hash.slice(1));
  const setReadingMode = (button: HTMLButtonElement) => {
      const section = button.closest<HTMLElement>('.rl-item')!;
      const mode = button.dataset.readingChoice!;
      section.querySelectorAll<HTMLElement>('[data-reading-mode]').forEach(body => { body.hidden = body.dataset.readingMode !== mode; });
      section.querySelectorAll<HTMLButtonElement>('[data-reading-choice]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      const preview = section.querySelector<HTMLButtonElement>('[data-resource-preview]')!;
      const path = mode === 'example' ? preview.dataset.examplePreview! : preview.dataset.blankPreview!;
      preview.dataset.resourcePreview = path + '.svg';
      preview.dataset.previewPdf = path + '.pdf';
      section.querySelector<HTMLElement>('[data-reading-label]')!.textContent = mode === 'example' ? 'Ejemplo ficticio' : 'Vista de lectura';
  };
  const restoreReadingMode = () => {
    const mode = new URL(location.href).searchParams.get('vista') === 'plantilla' ? 'blank' : 'example';
    root.querySelectorAll<HTMLButtonElement>('[data-reading-choice="'+mode+'"]').forEach(setReadingMode);
  };
  root.querySelectorAll<HTMLButtonElement>('[data-reading-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const url = new URL(location.href);
      if (button.dataset.readingChoice === 'blank') url.searchParams.set('vista', 'plantilla');
      else url.searchParams.delete('vista');
      history.pushState(null, '', url);
      restoreReadingMode();
    });
  });
  restoreReadingMode();
  window.addEventListener('popstate', () => { selectDocument(location.hash.slice(1)); restoreReadingMode(); }, { signal: controller.signal });
  const dialog = root.querySelector<HTMLDialogElement>('#resource-viewer')!;
  const image = root.querySelector<HTMLImageElement>('#resource-viewer-image')!;
  const title = root.querySelector<HTMLElement>('#resource-viewer-title')!;
  const pdf = root.querySelector<HTMLAnchorElement>('#resource-viewer-pdf')!;
  const zoom = root.querySelector<HTMLButtonElement>('#resource-viewer-zoom')!;
  const paper = root.querySelector<HTMLElement>('.rl-dialog-paper')!;
  const setZoom = (enlarged: boolean) => {
    dialog.dataset.zoom = enlarged ? 'reading' : 'fit';
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? 'Ver hoja entera' : 'Ampliar';
    paper.scrollLeft = 0;
  };
  root.querySelectorAll<HTMLButtonElement>('[data-resource-preview]').forEach(button => {
    button.addEventListener('click', () => {
      title.textContent = button.dataset.previewTitle!;
      image.src = button.dataset.resourcePreview!;
      image.alt = 'Vista ampliada de ' + button.dataset.previewTitle;
      pdf.href = button.dataset.previewPdf!;
      setZoom(false);
      dialog.showModal();
      dialog.scrollTop = 0;
    });
  });
  root.querySelector('#resource-viewer-close')!.addEventListener('click', () => dialog.close());
  zoom.addEventListener('click', () => setZoom(dialog.dataset.zoom !== 'reading'));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}
