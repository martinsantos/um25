export function initFontSpecimen() {
  const root = document.querySelector<HTMLElement>('#um-specimen');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const input = (id: string) => root.querySelector<HTMLInputElement>('#' + id)!;
  const node = (id: string) => root.querySelector<HTMLElement>('#' + id)!;
  const text = input('font-text'), weight = input('font-weight'), size = input('font-size');
  const leading = input('font-leading'), spacing = input('font-spacing'), italic = input('font-italic');
  const sample = node('font-live');
  const pressed = (selector: string, selected: HTMLElement) => root.querySelectorAll<HTMLElement>(selector).forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
  const update = () => {
    sample.textContent = text.value || 'Conectamos tecnología y personas.';
    sample.style.fontWeight = weight.value;
    sample.style.fontSize = Number(size.value) / 16 + 'rem';
    sample.style.lineHeight = leading.value;
    sample.style.letterSpacing = spacing.value + 'em';
    sample.style.fontStyle = italic.checked ? 'italic' : 'normal';
    node('font-weight-value').textContent = weight.value;
    node('font-size-value').textContent = Math.round(parseFloat(getComputedStyle(sample).fontSize)) + ' px';
    node('font-leading-value').textContent = leading.value.replace('.', ',');
    node('font-spacing-value').textContent = spacing.value.replace('.', ',') + ' em';
  };
  [text, weight, size, leading, spacing, italic].forEach(control => control.addEventListener('input', update));
  const setTheme = (button: HTMLElement) => {
    node('probar').dataset.theme = button.dataset.sampleTheme;
    pressed('[data-sample-theme]', button);
  };
  root.querySelectorAll<HTMLElement>('[data-sample-theme]').forEach(button => button.addEventListener('click', () => setTheme(button)));
  node('font-reset').addEventListener('click', () => {
    text.value = 'Conectamos tecnología y personas.'; weight.value = '600'; size.value = '64';
    leading.value = '1.2'; spacing.value = '0'; italic.checked = false;
    setTheme(root.querySelector<HTMLElement>('[data-sample-theme="dark"]')!); update();
  });
  root.querySelectorAll<HTMLElement>('[data-figures]').forEach(button => button.addEventListener('click', () => {
    node('number-proof').style.fontVariantNumeric = button.dataset.figures!;
    pressed('[data-figures]', button);
  }));
  root.querySelectorAll<HTMLElement>('[data-reading-size]').forEach(button => button.addEventListener('click', () => {
    node('reading-sample').style.fontSize = Number(button.dataset.readingSize) / 16 + 'rem';
    node('reading-size-note').textContent = 'Muestra de lectura: ' + button.dataset.readingSize + ' px.';
    pressed('[data-reading-size]', button);
  }));
  // The initial selected size matches the responsive body; user choices stay explicit.
  const readingSize = Math.round(parseFloat(getComputedStyle(node('reading-sample')).fontSize));
  root.querySelectorAll<HTMLElement>('[data-reading-size]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.readingSize) === readingSize)));
  const selectGlyph = (button: HTMLElement) => {
    const glyph = button.dataset.glyph!;
    node('glyph-large').textContent = glyph;
    node('glyph-code').textContent = 'U+' + glyph.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
    const category = root.querySelector<HTMLElement>('[data-glyph-filter="' + button.dataset.group + '"]')?.textContent;
    node('glyph-character').textContent = glyph + ' · ' + category;
    pressed('[data-glyph]', button);
  };
  root.querySelectorAll<HTMLElement>('[data-glyph]').forEach(button => button.addEventListener('click', () => selectGlyph(button)));
  root.querySelectorAll<HTMLElement>('[data-glyph-filter]').forEach(button => button.addEventListener('click', () => {
    const group = button.dataset.glyphFilter;
    const glyphs = [...root.querySelectorAll<HTMLElement>('[data-glyph]')];
    glyphs.forEach(glyph => { glyph.hidden = group !== 'all' && glyph.dataset.group !== group; });
    const selected = glyphs.find(glyph => glyph.getAttribute('aria-pressed') === 'true');
    if (selected?.hidden) selectGlyph(glyphs.find(glyph => !glyph.hidden)!);
    pressed('[data-glyph-filter]', button);
  }));
  input('kerning-enabled').addEventListener('change', event => {
    const enabled = (event.currentTarget as HTMLInputElement).checked;
    node('kerning-sample').style.fontKerning = enabled ? 'normal' : 'none';
    node('kerning-sample').style.fontFeatureSettings = '"kern" ' + (enabled ? '1' : '0');
  });
  root.querySelectorAll<HTMLElement>('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const source = node(button.dataset.copy!);
    try {
      await navigator.clipboard.writeText(source.textContent || '');
      node('copy-status').textContent = 'Código copiado.';
    } catch {
      const selection = window.getSelection(), range = document.createRange();
      range.selectNodeContents(source); selection?.removeAllRanges(); selection?.addRange(range);
      node('copy-status').textContent = 'Código seleccionado. Usá Copiar en tu navegador.';
    }
  }));
  const indexLinks = [...root.querySelectorAll<HTMLAnchorElement>('.sp-index a')];
  const sections = [...root.querySelectorAll<HTMLElement>('section[id]')];
  let currentSection = '';
  const observer = new IntersectionObserver(() => {
    const visible = sections.filter(section => section.getBoundingClientRect().top <= Math.min(innerHeight * .5, 360)).at(-1);
    if (!visible || visible.id === currentSection) return;
    currentSection = visible.id;
    indexLinks.forEach(link => {
      if (link.hash === '#' + visible.id) {
        link.setAttribute('aria-current', 'location');
        const rail = link.parentElement!;
        const bounds = rail.getBoundingClientRect(), item = link.getBoundingClientRect();
        if (item.left < bounds.left || item.right > bounds.right) {
          rail.scrollTo({ left: rail.scrollLeft + item.left - bounds.left - 16, behavior: 'instant' });
        }
      } else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-130px 0px -55% 0px' });
  sections.forEach(section => observer.observe(section));
  document.addEventListener('astro:before-swap', () => observer.disconnect(), { once: true });
  update();
}
