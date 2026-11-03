import { findPublishedEditorialProduct, isValidEmbeddedProductCatalog, normalizeEmbeddedProductCatalog } from '../src/utils/directusProductCatalog';

const product = (overrides = {}) => ({
  nombre: 'Cámaras IP',
  headline: 'Video seguro',
  descripcion: 'Instalación y configuración de cámaras IP.',
  imagen: 'local/camera.webp',
  caracteristicas: ['Alta resolución', 'Visión nocturna', 'Grabación local'],
  servicio_asociado: 'Instalación de videovigilancia',
  ...overrides,
});

describe('Directus embedded product catalog normalization', () => {
  test('accepts a valid empty catalog and rejects malformed objects', () => {
    expect(isValidEmbeddedProductCatalog([])).toBe(true);
    expect(isValidEmbeddedProductCatalog([product()])).toBe(true);
    expect(isValidEmbeddedProductCatalog([{ nombre: 'Sin datos' }])).toBe(false);
  });

  test('normalizes fields, reuses snapshot identity by service and title, and deduplicates', () => {
    const snapshot = [{ id: 42, servicio_id: 101, titulo: 'Camaras IP', slug_producto: 'camaras-ip' }];
    const results = normalizeEmbeddedProductCatalog(
      [product(), product({ nombre: 'CAMARAS IP' }), product({ nombre: 'Control de acceso' })],
      101,
      snapshot,
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: 42,
      servicio_id: 101,
      titulo: 'Cámaras IP',
      destacado: 'Video seguro',
      features: ['Alta resolución', 'Visión nocturna', 'Grabación local'],
      estado: 'publicado',
      slug_producto: 'camaras-ip',
    });
    expect(results[1]).not.toHaveProperty('id');
    expect(results[1]).not.toHaveProperty('slug_producto');
  });

  test('preserves published CCTV AI editorial content separately from the embedded service catalog', () => {
    const editorialProduct = require('../src/data/snapshots/productos.json').data.find((item) => item.id === 133);
    const resolved = findPublishedEditorialProduct('cctv-ai-integrado', [editorialProduct]);

    expect(resolved).toBe(editorialProduct);
    expect(resolved).toMatchObject({
      id: 133,
      status: 'published',
      slug_producto: 'cctv-ai-integrado',
      template_producto: 'cctv-ai-operational-single',
    });
    expect(resolved.contenido_producto).toEqual(editorialProduct.contenido_producto);
    expect(resolved.opciones_comerciales).toEqual(editorialProduct.opciones_comerciales);
    expect(normalizeEmbeddedProductCatalog([], 102, [editorialProduct])).toEqual([]);
    expect(findPublishedEditorialProduct('cctv-ai-integrado', [{ ...editorialProduct, status: 'draft' }])).toBeNull();
  });
});

