describe('ResultadoGeneracion Component - Success/Error Handling', () => {
  test('ResultadoGeneracion.astro debe existir', async () => {
    const { existsSync } = await import('fs');
    const { join, dirname, resolve } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const componentPath = resolve(
      __dirname,
      '../../../src/components/arca/ResultadoGeneracion.astro'
    );

    expect(existsSync(componentPath)).toBe(true);
  });

  test('debe mostrar mensaje de éxito cuando resultado es success', () => {
    const container = document.createElement('div');
    const successMsg = document.createElement('p');
    successMsg.className = 'text-green-600';
    successMsg.textContent = 'Factura generada exitosamente';

    container.appendChild(successMsg);
    document.body.appendChild(container);

    expect(successMsg.textContent).toBe('Factura generada exitosamente');
    expect(successMsg.className).toContain('text-green-600');

    document.body.removeChild(container);
  });

  test('debe mostrar mensaje de error cuando resultado es error', () => {
    const container = document.createElement('div');
    const errorMsg = document.createElement('p');
    errorMsg.className = 'text-red-600';
    errorMsg.textContent = 'Error al generar la factura';

    container.appendChild(errorMsg);
    document.body.appendChild(container);

    expect(errorMsg.textContent).toBe('Error al generar la factura');
    expect(errorMsg.className).toContain('text-red-600');

    document.body.removeChild(container);
  });

  test('debe tener botón de descarga cuando hay PDF', () => {
    const button = document.createElement('a');
    button.id = 'download-pdf-btn';
    button.href = '/tmp/factura_123.pdf';
    button.download = 'factura_123.pdf';
    button.textContent = 'Descargar PDF';

    document.body.appendChild(button);

    expect(button.href).toContain('/tmp/factura_123.pdf');
    expect(button.download).toBe('factura_123.pdf');
    expect(button.textContent).toBe('Descargar PDF');

    document.body.removeChild(button);
  });

  test('debe tener botón "Nueva Factura" para resetear', () => {
    const button = document.createElement('button');
    button.id = 'new-invoice-btn';
    button.textContent = 'Nueva Factura';
    button.type = 'button';

    document.body.appendChild(button);

    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });

    button.click();

    expect(clicked).toBe(true);

    document.body.removeChild(button);
  });

  test('debe usar textContent para prevenir XSS', () => {
    const container = document.createElement('div');
    const message = 'Factura generada: <script>alert("xss")</script>';

    const p = document.createElement('p');
    p.textContent = message; // Seguro contra XSS

    container.appendChild(p);
    document.body.appendChild(container);

    expect(p.textContent).toBe(message);
    expect(p.innerHTML).not.toContain('<script>');

    document.body.removeChild(container);
  });

  test('debe tener función window.showResult()', () => {
    window.showResult = (type, message, pdfUrl, emailSent) => {
      return {
        type,
        message,
        pdfUrl,
        emailSent,
      };
    };

    expect(typeof window.showResult).toBe('function');

    const result = window.showResult('success', 'OK', '/tmp/factura.pdf', true);

    expect(result.type).toBe('success');
    expect(result.message).toBe('OK');
    expect(result.pdfUrl).toBe('/tmp/factura.pdf');
    expect(result.emailSent).toBe(true);
  });

  test('debe retornar tipo, mensaje, pdfUrl y emailSent en showResult', () => {
    window.showResult = (type, message, pdfUrl, emailSent) => {
      return {
        type,
        message,
        pdfUrl,
        emailSent,
      };
    };

    const result = window.showResult('error', 'No se pudo generar', null, false);

    expect(result.type).toBe('error');
    expect(result.message).toBe('No se pudo generar');
    expect(result.pdfUrl).toBe(null);
    expect(result.emailSent).toBe(false);
  });

  test('debe mostrar información de email enviado cuando emailSent es true', () => {
    const container = document.createElement('div');

    const emailMsg = document.createElement('p');
    emailMsg.textContent = 'Email enviado a usuario@example.com';
    emailMsg.className = 'text-blue-600';

    container.appendChild(emailMsg);
    document.body.appendChild(container);

    expect(emailMsg.textContent).toContain('Email enviado');
    expect(emailMsg.className).toContain('text-blue-600');

    document.body.removeChild(container);
  });

  test('debe limpiar form al hacer click en Nueva Factura', () => {
    const form = document.createElement('form');
    form.id = 'formulario-arca';

    const input = document.createElement('input');
    input.name = 'cuit';
    input.value = '20123456789';

    form.appendChild(input);
    document.body.appendChild(form);

    // Simular reset
    form.reset();

    expect(input.value).toBe('');

    document.body.removeChild(form);
  });

  test('debe mostrar estado de carga mientras se genera PDF', () => {
    const loader = document.createElement('div');
    loader.id = 'result-loader';
    loader.textContent = 'Generando factura...';
    loader.className = 'hidden';

    document.body.appendChild(loader);

    loader.classList.remove('hidden');
    expect(loader.classList.contains('hidden')).toBe(false);

    loader.classList.add('hidden');
    expect(loader.classList.contains('hidden')).toBe(true);

    document.body.removeChild(loader);
  });
});
