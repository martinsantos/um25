const {
  normalizeBlogCoverUrl,
  preserveBlogPostCovers,
} = require('../src/utils/blogCoverDiversity.js');

describe('blog cover diversity', () => {
  const repeatedCover = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=480&fit=crop&q=80';

  test('normalizes internal cover paths to absolute UMSA URLs', () => {
    expect(normalizeBlogCoverUrl('/images/editorial/umsa-service-redes.webp')).toBe(
      'https://www.ultimamilla.com.ar/images/editorial/umsa-service-redes.webp',
    );
  });

  test('reading preserves assigned covers in full, filtered and single-note views', () => {
    const posts = [{ slug: 'uno', imagen_portada: repeatedCover }, { slug: 'dos', imagen_portada: repeatedCover }];
    const all = preserveBlogPostCovers(posts);
    expect(all.map((p) => p.imagen_portada)).toEqual([repeatedCover, repeatedCover]);
    expect(preserveBlogPostCovers([posts[1]])[0]).toEqual(all[1]);
    expect(preserveBlogPostCovers([...posts].reverse()).reverse()).toEqual(all);
    expect(posts[1].imagen_portada).toBe(repeatedCover);
  });

});
