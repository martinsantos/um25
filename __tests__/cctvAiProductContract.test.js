const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const productImageId = '019e8d32-06c8-73a1-aa89-5f9d40c31f4b';

describe('CCTV AI product contract', () => {
  test('publishes CCTV AI as a Productos bundle under Seguridad electronica', () => {
    const productosSnapshot = require('../src/data/snapshots/productos.json');
    const productos = productosSnapshot.data || productosSnapshot;
    const product = productos.find((item) => item.titulo === 'CCTV AI Integrado');

    expect(product).toBeTruthy();
    expect(product.servicio_id).toBe(102);
    expect(product.orden).toBe(8);
    expect(product.status).toBe('published');
    expect(product.categoria_comercial).toBe('Productos');
    expect(product.tipo_producto).toBe('Producto paquetizado');
    expect(product.imagen).toBe(productImageId);
    expect(product.features).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Piloto de 30 dias'),
        expect.stringContaining('Alertas accionables'),
        expect.stringContaining('Integracion operativa'),
      ])
    );
  });

  test('maps the generated CCTV AI hero image to a public asset', () => {
    const imageMap = require('../src/data/image-local-map.json');
    const imagePath = imageMap[productImageId];

    expect(imagePath).toBe('/images/services/productos/cctv-ai/cctv-ai-integrado-hero.png');
    expect(fs.existsSync(path.join(root, 'public', imagePath))).toBe(true);
  });

  test('surfaces Productos paquetizados on the services index', () => {
    const source = fs.readFileSync(path.join(root, 'src/pages/servicios/index.astro'), 'utf8');

    expect(source).toContain('Productos paquetizados');
    expect(source).toContain('CCTV AI Integrado');
    expect(source).toContain('#producto-cctv-ai-integrado');
  });
});
