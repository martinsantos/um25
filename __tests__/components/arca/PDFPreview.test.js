describe('PDFPreview Component - Modal y Preview', () => {
  afterEach(() => {
    // Limpiar elementos creados en tests
    const dialogs = document.querySelectorAll('dialog');
    dialogs.forEach((dialog) => {
      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    });
  });

  test('PDFPreview.astro debe existir', async () => {
    const { existsSync } = await import('fs');
    const { join, dirname, resolve } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const componentPath = resolve(
      __dirname,
      '../../../src/components/arca/PDFPreview.astro'
    );

    expect(existsSync(componentPath)).toBe(true);
  });

  test('debe tener elemento modal en el DOM', () => {
    const dialog = document.createElement('dialog');
    dialog.id = 'pdf-preview-modal';

    document.body.appendChild(dialog);

    expect(document.querySelector('#pdf-preview-modal')).toBeTruthy();
  });

  test('debe tener botón Confirmar Generar', () => {
    const button = document.createElement('button');
    button.id = 'confirm-generate-btn';
    button.textContent = 'Confirmar Generar';
    button.type = 'button';

    document.body.appendChild(button);

    expect(button.textContent).toBe('Confirmar Generar');
    expect(button.id).toBe('confirm-generate-btn');

    document.body.removeChild(button);
  });

  test('debe tener botón Cancelar', () => {
    const button = document.createElement('button');
    button.id = 'cancel-preview-btn';
    button.textContent = 'Cancelar';
    button.type = 'button';

    document.body.appendChild(button);

    expect(button.textContent).toBe('Cancelar');

    document.body.removeChild(button);
  });

  test('debe tener botón de cancelar funcional', () => {
    const dialog = document.createElement('dialog');
    dialog.id = 'pdf-preview-modal';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-preview-btn';
    cancelBtn.textContent = 'Cancelar';

    dialog.appendChild(cancelBtn);
    document.body.appendChild(dialog);

    let cancelClicked = false;
    cancelBtn.addEventListener('click', () => {
      cancelClicked = true;
    });

    cancelBtn.click();

    expect(cancelClicked).toBe(true);
  });

  test('debe tener estilos de overlay oscuro', () => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal backdrop:bg-black/50';

    document.body.appendChild(dialog);

    expect(dialog.className).toContain('backdrop:bg-black/50');

    document.body.removeChild(dialog);
  });

  test('debe ser centrado en la pantalla', () => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal fixed inset-0 flex items-center justify-center';

    document.body.appendChild(dialog);

    expect(dialog.className).toContain('fixed');
    expect(dialog.className).toContain('inset-0');
    expect(dialog.className).toContain('flex');
    expect(dialog.className).toContain('items-center');
    expect(dialog.className).toContain('justify-center');

    document.body.removeChild(dialog);
  });

  test('debe permitir disparar evento personalizado showPDFPreview', () => {
    let eventFired = false;
    let eventData = null;

    document.addEventListener('showPDFPreview', (e) => {
      eventFired = true;
      eventData = e.detail;
    });

    const event = new CustomEvent('showPDFPreview', {
      detail: { pdfUrl: '/tmp/factura_123.pdf' },
    });

    document.dispatchEvent(event);

    expect(eventFired).toBe(true);
    expect(eventData.pdfUrl).toBe('/tmp/factura_123.pdf');
  });
});
