import { editorialImages } from '../src/data/editorialImageSystem';
import { blogImageUrl, blogPostImageUrl } from '../src/utils/blogHelpers';

describe('blog image helpers', () => {
  test('normalizes public ULTIMA MILLA image URLs to local paths', () => {
    expect(blogImageUrl('https://ultimamilla.com.ar/uploads/hero/redes.jpg')).toBe('/uploads/hero/redes.jpg');
    expect(blogImageUrl('https://www.ultimamilla.com.ar/images/editorial/umsa-home-operations.webp')).toBe(
      '/images/editorial/umsa-home-operations.webp'
    );
  });

  test('rejects external stock images and falls back to local editorial assets', () => {
    expect(blogImageUrl('https://images.unsplash.com/photo-1586281380349-6325315f36a2?w=1200')).toBe('');
    expect(
      blogPostImageUrl({
        imagen_portada: 'https://images.unsplash.com/photo-1586281380349-6325315f36a2?w=1200',
        slug: 'nota-sin-imagen-local',
        categoria: 'noticias',
      } as any)
    ).toBe(editorialImages.defaultOg);
  });
});
