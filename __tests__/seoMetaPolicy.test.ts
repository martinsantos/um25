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

  test('keeps real client context visible for repeated case titles', () => {
    const hospital = buildCaseSeoMeta({
      title: 'Asistencia técnica SDI',
      client: 'Hospital A Italo Perrupato',
      identifier: 3216,
    });
    const cela = buildCaseSeoMeta({
      title: 'Asistencia técnica SDI',
      client: 'Cela SA',
      identifier: 3303,
    });

    expect(hospital.title).toContain('Hospital A Italo');
    expect(cela.title).toContain('Cela SA');
    expect(hospital.title).not.toBe(cela.title);
    expect(hospital.title).toContain('UM-3216');
    expect(cela.title).toContain('UM-3303');
    expect(hospital.title.length).toBeLessThanOrEqual(SEO_META_LIMITS.title);
  });

  test('preserves differentiating context when the base case title is long', () => {
    const meta = buildCaseSeoMeta({
      title: 'Reparación de Central de detección de incendio Firewarden 100X.',
      client: 'Allex S.A',
      identifier: 3134,
    });

    expect(meta.title).toContain('Allex S.A');
    expect(meta.title).toContain('UM-3134');
    expect(meta.title.length).toBeLessThanOrEqual(SEO_META_LIMITS.title);
  });

  test('uses the public case code when the client already repeats the title', () => {
    const meta = buildCaseSeoMeta({
      title: 'Conectividad & Redes: Insumo de red - Municipalidad de Gral San Martín',
      client: 'Municipalidad de Gral San Martín',
      identifier: 3159,
    });

    expect(meta.title).toContain('UM-3159');
    expect(meta.title.length).toBeLessThanOrEqual(SEO_META_LIMITS.title);
  });

  test('expands short case descriptions with useful operational context', () => {
    const meta = buildCaseSeoMeta({
      title: "alojamietno y ss's para guaymallén",
      description: 'Ejecución integral de alojamietno y ss',
    });

    expect(meta.description.length).toBeGreaterThanOrEqual(SEO_META_LIMITS.minimumDescription);
    expect(meta.description).toContain('ULTIMA MILLA');
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
