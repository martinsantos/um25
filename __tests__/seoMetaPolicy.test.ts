import { blogSeoTitleOverrides } from '../src/data/seoTitleOverrides';
import { isCanonicalBlogSlug, resolveCanonicalBlogSlug } from '../src/data/seoRedirects';
import {
  SEO_META_LIMITS,
  buildBlogSeoMeta,
  buildCaseSeoMeta,
  buildHumanSeoTitle,
} from '../src/utils/seoMetaPolicy';

describe('human SEO metatag policy', () => {
  test('keeps titles concise and appends only the real brand suffix', () => {
    const title = buildHumanSeoTitle(
      'Implementación de redes de datos y fibra óptica para operaciones empresariales críticas',
    );

    expect(title).toContain('ULTIMA MILLA');
    expect(title.length).toBeLessThanOrEqual(SEO_META_LIMITS.title);
    expect(title).not.toContain('Cliente');
    expect(title).not.toContain('Caso de Éxito');
  });

  test('builds case meta without inventing client or brand names', () => {
    const meta = buildCaseSeoMeta({
      title: 'Redes y fibra óptica para operación industrial',
      description: '',
      area: 'Infraestructura IT',
      date: '2025-04-12',
    });

    expect(meta.title).toBe('Redes y fibra óptica para operación industrial | ULTIMA MILLA');
    expect(meta.description).toContain('Infraestructura IT');
    expect(meta.description).toContain('2025');
    expect(meta.description).not.toContain('S.A.');
    expect(meta.description.length).toBeLessThanOrEqual(SEO_META_LIMITS.description);
  });

  test('humanizes CMS case-card descriptions without changing the real title', () => {
    const meta = buildCaseSeoMeta({
      title: 'Diagnóstico de Infraestructura IT',
      description: 'Diagnóstico de Infraestructura IT Cliente: Jose Nucete e Hijos SA. Sector: Soluciones Tecnológicas.',
    });

    expect(meta.title).toBe('Diagnóstico de Infraestructura IT | ULTIMA MILLA');
    expect(meta.description).toBe('Antecedente de Diagnóstico de Infraestructura IT para Jose Nucete e Hijos SA, dentro de Soluciones Tecnológicas.');
  });

  test('blog meta uses editorial titles for repeated topics without redirects', () => {
    const slug = 'ia-local-llm-pymes-argentina-2026';
    const meta = buildBlogSeoMeta({
      title: blogSeoTitleOverrides[slug],
      summary: 'Criterios para evaluar modelos de lenguaje locales en pymes argentinas.',
      category: 'Tecnología',
    });

    expect(isCanonicalBlogSlug(slug)).toBe(true);
    expect(meta.title).toBe('LLM local para pymes argentinas: criterios y alcance | ULTIMA MILLA');
  });

  test('known duplicate blog slugs resolve to canonical human pages', () => {
    expect(resolveCanonicalBlogSlug('test-full-content-1777817727'))
      .toBe('restic-y-postgresql-el-backup-que-si-vuelve');
    expect(isCanonicalBlogSlug('test-full-content-1777817727')).toBe(false);
  });
});
