import { canonicalizeBlogSlug } from '../src/utils/blogCanonicalLinks';

describe('canonicalizeBlogSlug', () => {
  test('respeta slugs limpios de más de 100 caracteres (posts largos de Directus)', () => {
    const slug = 'el-cto-que-no-existe-como-las-pymes-argentinas-corren-tecnologia-de-primer-mundo-con-presupuesto-de-kiosco';
    expect(slug.length).toBeGreaterThan(100);
    expect(canonicalizeBlogSlug(slug)).toBe(slug);
  });

  test('sigue normalizando slugs con mayúsculas, acentos o espacios', () => {
    expect(canonicalizeBlogSlug('Redes%20de%20Fibra%20Óptica')).toBe('redes-de-fibra-optica');
  });
});
