import { blogImageUrl, blogPostImageUrl } from '../src/utils/blogHelpers';

describe('blog image helpers', () => {
  test('normalizes public ULTIMA MILLA image URLs to local paths', () => {
    expect(blogImageUrl('https://ultimamilla.com.ar/uploads/hero/redes.jpg')).toBe('/uploads/hero/redes.jpg');
    expect(blogImageUrl('https://www.ultimamilla.com.ar/images/editorial/umsa-home-operations.webp')).toBe(
      '/images/editorial/umsa-home-operations.webp'
    );
  });

  test('blog covers are own isometrics chosen by topic, never the stored cover', () => {
    const cover = 'https://images.unsplash.com/photo-1586281380349-6325315f36a2?w=1200&h=480&fit=crop&q=80';
    expect(blogImageUrl(cover)).toBe(cover);
    expect(
      blogPostImageUrl({ imagen_portada: cover, slug: 'nota-con-imagen-automatizada', categoria: 'noticias' } as any)
    ).toMatch(/^\/cine\/iso\/service-\d{3}\.svg$/);
    expect(
      blogPostImageUrl({ imagen_portada: null, slug: 'deteccion-incendio-bodegas-vitivinicolas', titulo: 'Detección de incendio en bodegas', categoria: 'tecnico' } as any)
    ).toBe('/cine/iso/service-107.svg');
    expect(
      blogPostImageUrl({ imagen_portada: null, slug: 'hospital-regional-neuquen-cableado-estructurado', titulo: 'Cableado estructurado en el hospital', categoria: 'proyectos' } as any)
    ).toBe('/cine/iso/service-101.svg');
    expect(
      blogPostImageUrl({ imagen_portada: null, slug: 'aeropuerto-mendoza-cctv', titulo: 'CCTV en el aeropuerto', categoria: 'proyectos' } as any)
    ).toBe('/cine/iso/service-102.svg');
  });

  test('every topic poster exists and the same note always gets the same cover', () => {
    const fs = require('fs');
    const path = require('path');
    for (const slug of ['odoo-18-postgresql', 'starlink-campamento-minero', 'ups-online-data-center', 'mesa-de-ayuda-sla', 'nota-sin-tema']) {
      const image = blogPostImageUrl({ imagen_portada: null, slug, categoria: 'noticias' } as any);
      expect(fs.existsSync(path.join(process.cwd(), 'public', image))).toBe(true);
      expect(blogPostImageUrl({ imagen_portada: null, slug, categoria: 'noticias' } as any)).toBe(image);
    }
  });
});
