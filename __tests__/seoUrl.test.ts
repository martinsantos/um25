import {
  canonicalUrl,
  clampText,
  escapeXml,
  formatSitemapDate,
  publicImageUrl,
  stripWww,
} from '../src/utils/seoUrl';

describe('seoUrl helpers', () => {
  test('normalizes canonicals to the www production domain', () => {
    expect(stripWww('https://ultimamilla.com.ar/servicios')).toBe('https://www.ultimamilla.com.ar/servicios');
    expect(canonicalUrl('/servicios/')).toBe('https://www.ultimamilla.com.ar/servicios');
    expect(canonicalUrl('https://ultimamilla.com.ar/blog/nota/')).toBe('https://www.ultimamilla.com.ar/blog/nota');
  });

  test('escapes XML sitemap values', () => {
    expect(escapeXml('A & B < C "D"')).toBe('A &amp; B &lt; C &quot;D&quot;');
  });

  test('formats invalid sitemap dates as a safe yyyy-mm-dd value', () => {
    expect(formatSitemapDate('2026-05-01T12:30:00-03:00')).toBe('2026-05-01');
    expect(formatSitemapDate('invalid')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('builds public image URLs for local paths and Directus UUIDs', () => {
    expect(publicImageUrl('/images/og.jpg')).toBe('https://www.ultimamilla.com.ar/images/og.jpg');
    expect(publicImageUrl('371dc1b5-48d4-4b19-b60d-d884ad178c77')).toBe(
      'https://www.ultimamilla.com.ar/assets/371dc1b5-48d4-4b19-b60d-d884ad178c77'
    );
  });

  test('clamps SEO text without splitting too aggressively', () => {
    const text = 'Servicios tecnológicos empresariales para Mendoza, Cuyo y Patagonia con soporte experto';
    expect(clampText(text, 45)).toBe('Servicios tecnológicos empresariales para…');
    expect(clampText(text, 120)).toBe(text);
  });
});
