import { blogImageUrl, blogPostImageUrl, DEFAULT_BLOG_COVER } from '../src/utils/blogHelpers';
import imageMap from '../src/data/antecedentes-generated-image-map.json';

describe('blog image helpers', () => {
  test('normalizes public ULTIMA MILLA image URLs to local paths', () => {
    expect(blogImageUrl('https://ultimamilla.com.ar/uploads/hero/redes.jpg')).toBe('/uploads/hero/redes.jpg');
    expect(blogImageUrl('https://www.ultimamilla.com.ar/images/editorial/umsa-home-operations.webp')).toBe('/images/editorial/umsa-home-operations.webp');
  });

  test('preserves each assigned article cover instead of substituting a service diagram', () => {
    const cover = 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=1200&h=480&fit=crop&q=80';
    expect(blogPostImageUrl({ imagen_portada: cover, slug: 'meilisearch-frente-a-postgresql', categoria: 'tecnico' } as any)).toBe(cover);
    expect(blogPostImageUrl({ imagen_portada: '/images/editorial/umsa-sector-gobierno.webp', slug: 'openproject-en-cooperativas', categoria: 'proyectos' } as any)).toBe('/images/editorial/umsa-sector-gobierno.webp');
  });

  test('resolves a renamed cover to the packaged image of the same record', () => {
    const image = blogPostImageUrl({ imagen_portada: 'https://www.ultimamilla.com.ar/images/antecedentes/generated/lote_039/3448-implementacion-de-redes-de-datos-y-fibra-optica-cliente-confidencial-5-principal.webp', slug: 'influxdb-3-en-cooperativas', categoria: 'empresa' } as any);
    expect(image).toBe(imageMap['3448']);
    expect(require('fs').existsSync(require('path').join(process.cwd(), 'public', image))).toBe(true);
  });

  test.each([null, '', '/cine/iso/service-104.svg', '/cine/iso/site-bodega.svg', 'javascript:alert(1)', 'https://untrusted.example/cover.jpg'])('uses a packaged editorial cover when the assigned cover is absent or invalid: %s', imagen_portada => {
    const image = blogPostImageUrl({ imagen_portada, slug: 'nota-sin-portada', categoria: 'noticias' } as any);
    expect(image).toBe(DEFAULT_BLOG_COVER);
    expect(image).not.toContain('/cine/iso/');
    expect(require('fs').existsSync(require('path').join(process.cwd(), 'public', image))).toBe(true);
  });
});
