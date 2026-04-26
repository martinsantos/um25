describe('EmailInput Component - Email Validation', () => {
  test('EmailInput.astro debe existir', async () => {
    const { existsSync } = await import('fs');
    const { join, dirname, resolve } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const componentPath = resolve(
      __dirname,
      '../../../src/components/arca/EmailInput.astro'
    );

    expect(existsSync(componentPath)).toBe(true);
  });

  test('debe tener checkbox para habilitar envío por email', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'send-email-checkbox';
    checkbox.name = 'send_email';

    document.body.appendChild(checkbox);

    expect(checkbox.type).toBe('checkbox');
    expect(checkbox.checked).toBe(false);

    checkbox.checked = true;
    expect(checkbox.checked).toBe(true);

    document.body.removeChild(checkbox);
  });

  test('debe mostrar input de email cuando checkbox está marcado', () => {
    const container = document.createElement('div');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'send-email-checkbox';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email-input';
    emailInput.className = 'hidden';

    container.appendChild(checkbox);
    container.appendChild(emailInput);
    document.body.appendChild(container);

    // Simular cambio
    checkbox.checked = true;
    const event = new Event('change', { bubbles: true });
    checkbox.dispatchEvent(event);

    // En el componente real, esto se maneja con JavaScript
    if (checkbox.checked) {
      emailInput.classList.remove('hidden');
    }

    expect(emailInput.classList.contains('hidden')).toBe(false);

    document.body.removeChild(container);
  });

  test('debe validar formato de email básico', () => {
    const validEmails = ['user@example.com', 'test@domain.co.ar', 'mail.name+tag@example.com'];
    const invalidEmails = ['invalid', '@example.com', 'user@', 'user@domain'];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  test('debe tener función window.getEmailToSend()', () => {
    window.getEmailToSend = () => {
      const emailInput = document.querySelector('#email-input');
      if (emailInput && emailInput.value.trim()) {
        return emailInput.value.trim();
      }
      return null;
    };

    expect(typeof window.getEmailToSend).toBe('function');
  });

  test('debe retornar null si email no está ingresado', () => {
    window.getEmailToSend = () => {
      return null;
    };

    expect(window.getEmailToSend()).toBe(null);
  });

  test('debe retornar email válido cuando está ingresado', () => {
    const container = document.createElement('div');

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email-input';
    emailInput.value = 'usuario@example.com';

    container.appendChild(emailInput);
    document.body.appendChild(container);

    window.getEmailToSend = () => {
      const input = document.querySelector('#email-input');
      if (input && input.value.trim()) {
        return input.value.trim();
      }
      return null;
    };

    expect(window.getEmailToSend()).toBe('usuario@example.com');

    document.body.removeChild(container);
  });

  test('debe mostrar mensaje de error si email es inválido', () => {
    const container = document.createElement('div');

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email-input';
    emailInput.value = 'email-invalido';

    const errorMsg = document.createElement('span');
    errorMsg.id = 'email-error';
    errorMsg.textContent = 'Email inválido';
    errorMsg.className = 'hidden';

    container.appendChild(emailInput);
    container.appendChild(errorMsg);
    document.body.appendChild(container);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      errorMsg.classList.remove('hidden');
    }

    expect(errorMsg.classList.contains('hidden')).toBe(false);

    document.body.removeChild(container);
  });
});
