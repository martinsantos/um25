import { trimAtWordBoundary, buildCaseSeoMeta, SEO_META_LIMITS } from '../src/utils/seoMetaPolicy';

describe('guardas de longitud SEO (auditoría de producción 2026-09-27)', () => {
  test('un resumen largo con una primera oración corta no queda bajo 120 caracteres', () => {
    const text = 'El día después de un incendio, la pregunta más cara no es qué se quemó: es qué había adentro. '
      + 'Inventario técnico, registros de mantenimiento y respaldo fuera de sitio para reconstruir la operación sin adivinar.';
    const out = trimAtWordBoundary(text, SEO_META_LIMITS.description);
    expect(out.length).toBeGreaterThanOrEqual(SEO_META_LIMITS.minimumDescription);
    expect(out.length).toBeLessThanOrEqual(SEO_META_LIMITS.description);
  });

  test('antecedentes con el mismo título y cliente conservan su código público', () => {
    const titles = ['3170', '3186', '3294'].map((id) => buildCaseSeoMeta({
      title: 'Implementación de Redes de Datos y Fibra Óptica - Kamet SACI',
      client: 'Kamet SACI',
      area: 'Conectividad & Redes',
      date: '2019-05-01',
      identifier: id,
    }).title);
    expect(new Set(titles).size).toBe(3);
    titles.forEach((title, i) => {
      expect(title).toContain(`UM-${['3170', '3186', '3294'][i]}`);
      expect(title.length).toBeLessThanOrEqual(SEO_META_LIMITS.title);
    });
  });

  test('la plantilla de descripción no deja ". para"', () => {
    const meta = buildCaseSeoMeta({
      title: 'Cableado estructurado',
      description: 'cableado estructurado para oficinas en calle Alberdi. Cliente: Kamet SACI. Sector: Conectividad & Redes.',
      client: 'Kamet SACI',
      identifier: '3170',
    });
    expect(meta.description).not.toMatch(/\.\s+para /);
  });
});
