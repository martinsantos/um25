const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const productImageId = '019e8d32-06c8-73a1-aa89-5f9d40c31f4b';

describe('CCTV AI product contract', () => {
  test('publishes CCTV AI as a Producto under Seguridad electronica', () => {
    const productosSnapshot = require('../src/data/snapshots/productos.json');
    const productos = productosSnapshot.data || productosSnapshot;
    const product = productos.find((item) => item.titulo === 'CCTV AI Integrado');

    expect(product).toBeTruthy();
    expect(product.servicio_id).toBe(102);
    expect(product.orden).toBe(8);
    expect(product.status).toBe('published');
    expect(product.categoria_comercial).toBe('Producto');
    expect(product.tipo_producto).toBe('Producto');
    expect(product.paquetes).toBeUndefined();
    expect(product.opciones_comerciales).toHaveLength(7);
    expect(product.imagen).toBe(productImageId);
    expect(product.features).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Piloto controlado'),
        expect.stringContaining('Relevamiento de cámaras existentes'),
        expect.stringContaining('Reglas de IA operativas'),
        expect.stringContaining('Integración UMSA'),
      ])
    );
  });

  test('maps the generated CCTV AI product image to a public asset', () => {
    const imageMap = require('../src/data/image-local-map.json');
    const imagePath = imageMap[productImageId];

    expect(imagePath).toBe('/images/services/productos/cctv-ai/cctv-ai-forense-telefono.png');
    expect(fs.existsSync(path.join(root, 'public', imagePath))).toBe(true);
  });

  test('surfaces Producto on the services index', () => {
    const source = fs.readFileSync(path.join(root, 'src/pages/servicios/index.astro'), 'utf8');

    expect(source).toContain("eyebrow: 'Producto'");
    expect(source).toContain('CCTV AI Integrado');
    expect(source).toContain('#producto-cctv-ai-integrado');
  });
});
