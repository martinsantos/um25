const {
  resolveEnglishPath,
  resolvePageLanguage,
  resolveSpanishPath,
} = require('../src/config/i18nRoutes.ts');

describe('i18nRoutes', () => {
  test('detects english paths consistently for layout and SEO metadata', () => {
    expect(resolvePageLanguage('/')).toBe('es');
    expect(resolvePageLanguage('/contacto')).toBe('es');
    expect(resolvePageLanguage('/en')).toBe('en');
    expect(resolvePageLanguage('/en/services')).toBe('en');
  });

  test('keeps alternate path mappings stable', () => {
    expect(resolveSpanishPath('/en/about')).toBe('/nosotros');
    expect(resolveEnglishPath('/contacto')).toBe('/en/contacto');
  });
});
