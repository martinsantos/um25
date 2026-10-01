const {
  BLOG_COVER_DIVERSITY_CANDIDATES,
  diversifyBlogPostCovers,
  normalizeBlogCoverUrl,
  selectDiverseBlogCover,
} = require('../src/utils/blogCoverDiversity.js');

describe('blog cover diversity', () => {
  const repeatedCover = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=480&fit=crop&q=80';

  test('normalizes internal cover paths to absolute UMSA URLs', () => {
    expect(normalizeBlogCoverUrl('/images/editorial/umsa-service-redes.webp')).toBe(
      'https://www.ultimamilla.com.ar/images/editorial/umsa-service-redes.webp',
    );
  });

  test('keeps first original cover and replaces later duplicates with internal UMSA assets', () => {
    const posts = [
      { slug: 'rabbitmq-4-3-en-pymes-colas-acuses-y-limites', titulo: 'RabbitMQ', categoria: 'tecnico', imagen_portada: repeatedCover, fecha_publicacion: '2026-06-28T10:00:00Z' },
      { slug: 'borgbackup-frente-a-restic-repos-claves-y-prueba', titulo: 'BorgBackup', categoria: 'tecnico', imagen_portada: repeatedCover, fecha_publicacion: '2026-06-27T10:00:00Z' },
      { slug: 'openfga-en-pymes-permisos-por-relacion-y-prueba', titulo: 'OpenFGA', categoria: 'tecnologia', imagen_portada: repeatedCover, fecha_publicacion: '2026-06-26T10:00:00Z' },
    ];

    const diversified = diversifyBlogPostCovers(posts);
    const images = diversified.map((post) => post.imagen_portada);

    expect(images[0]).toBe(repeatedCover);
    expect(new Set(images).size).toBe(posts.length);
    expect(images.slice(1).every((image) => String(image).startsWith('https://www.ultimamilla.com.ar/images/'))).toBe(true);
  });

  test('uses a large internal candidate pool instead of cycling a few generic fallbacks', () => {
    expect(BLOG_COVER_DIVERSITY_CANDIDATES.length).toBeGreaterThanOrEqual(100);
  });

  test('selects a distinct cover before publishing when the incoming image already exists', () => {
    const selected = selectDiverseBlogCover(
      { slug: 'nuevo-post', titulo: 'Nuevo post', categoria: 'noticias', imagen_portada: repeatedCover, fecha_publicacion: '2026-06-29T10:00:00Z' },
      [{ slug: 'post-existente', titulo: 'Post existente', categoria: 'tecnico', imagen_portada: repeatedCover, fecha_publicacion: '2026-06-28T10:00:00Z' }],
    );

    expect(selected).not.toBe(repeatedCover);
    expect(selected).toMatch(/^https:\/\/www\.ultimamilla\.com\.ar\/images\//);
  });

  test('page of topic cards without CMS detail gets twelve distinct covers', () => {
    const posts = Array.from({ length: 12 }, (_, index) => ({
      slug: `nota-tema-${index}`,
      titulo: `Nota ${index}`,
      categoria: 'tecnico',
      imagen_portada: null,
      fecha_publicacion: `2026-09-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
    }));

    const images = diversifyBlogPostCovers(posts).map((post) => post.imagen_portada);
    expect(images.every(Boolean)).toBe(true);
    expect(new Set(images).size).toBe(12);
  });

  test('topic hub pages diversify covers across the whole card grid', () => {
    const source = require('fs').readFileSync(require('path').join(__dirname, '../src/pages/blog/tema/[tema].astro'), 'utf8');
    expect(source).toMatch(/const posts: EntradaBlog\[\] = diversifyBlogPostCovers\(pageItems\.map/);
  });
});
