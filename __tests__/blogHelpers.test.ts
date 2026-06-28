import { editorialImages } from '../src/data/editorialImageSystem';
import { blogImageUrl, blogPostImageUrl } from '../src/utils/blogHelpers';

describe('blog image helpers', () => {
  test('normalizes public ULTIMA MILLA image URLs to local paths', () => {
    expect(blogImageUrl('https://ultimamilla.com.ar/uploads/hero/redes.jpg')).toBe('/uploads/hero/redes.jpg');
    expect(blogImageUrl('https://www.ultimamilla.com.ar/images/editorial/umsa-home-operations.webp')).toBe(
      '/images/editorial/umsa-home-operations.webp'
    );
  });

  test('preserves automation cover images from the configured external host', () => {
    const cover = 'https://images.unsplash.com/photo-1586281380349-6325315f36a2?w=1200&h=480&fit=crop&q=80';
    expect(blogImageUrl(cover)).toBe(cover);
    expect(
      blogPostImageUrl({
        imagen_portada: cover,
        slug: 'nota-con-imagen-automatizada',
        categoria: 'noticias',
      } as any)
    ).toBe(cover);
  });

  test('rejects unknown external images and falls back to local editorial assets', () => {
    expect(blogImageUrl('https://example.com/photo-1586281380349-6325315f36a2.jpg')).toBe('');
    expect(
      blogPostImageUrl({
        imagen_portada: 'https://example.com/photo-1586281380349-6325315f36a2.jpg',
        slug: 'nota-sin-imagen-valida',
        categoria: 'noticias',
      } as any)
    ).toBe(editorialImages.defaultOg);
  });

  test('rejects truncated local upload paths before falling back', () => {
    expect(blogImageUrl('/uploads/hero/a')).toBe('');
    expect(blogImageUrl('/uploads/hero/4f9aa0c4-4aeb-40')).toBe('');
    expect(blogImageUrl('/uploads/hero/f83400c')).toBe('');
    expect(
      blogPostImageUrl({
        imagen_portada: '/uploads/hero/f83400c',
        slug: 'nota-con-path-trunco',
        categoria: 'tecnico',
      } as any)
    ).toBe('/uploads/hero/4f9aa0c4-4aeb-4027-a7a0-8a6cfbb14705.jpg');
  });
});
