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
    expect(product.categoria_informacion).toBe('PRODUCTO');
    expect(product.template_producto).toBe('cctv-ai-operational-single');
    expect(product.url_producto).toBe('/cctvai/');
    expect(product.paquetes).toBeUndefined();
    expect(product.opciones_comerciales).toHaveLength(1);
    expect(product.opciones_comerciales[0].modelo).toBe('UMSA');
    expect(product.contenido_producto).toBeTruthy();
    expect(product.contenido_producto.integrations).toHaveLength(6);
    expect(product.contenido_producto.options).toHaveLength(2);
    expect(product.contenido_producto.options[0].model).toBe('Referencia de mercado');
    expect(product.contenido_producto.options[1].model).toBe('Producto publicado');
    expect(product.contenido_producto.options[0].price).toBe('USD 72k+');
    expect(product.contenido_producto.options[1].price).toBe('desde USD 24k');
    expect(product.contenido_producto.options[0].fit).toContain('menos integración');
    expect(product.contenido_producto.options[1].scope).toContain('dashboard e informe forense');
    expect(product.contenido_producto.demoEvents).toHaveLength(5);
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

    expect(imagePath).toBe('/images/services/productos/cctv-ai/cctv-ai-forense-telefono.webp');
    expect(fs.existsSync(path.join(root, 'public', imagePath))).toBe(true);
  });

  test('directus image resolver prefers mapped public product assets before private /assets URLs', () => {
    const directusSource = fs.readFileSync(path.join(root, 'src/lib/directus.ts'), 'utf8');
    const mapLookupIndex = directusSource.indexOf('const localPath = imageLocalMap[imageId]');
    const assetsFallbackIndex = directusSource.indexOf('return `/assets/${imageId}?v=${IMAGE_CACHE_VERSION}`');
    const imageMap = require('../src/data/image-local-map.json');

    expect(mapLookupIndex).toBeGreaterThan(-1);
    expect(assetsFallbackIndex).toBeGreaterThan(-1);
    expect(mapLookupIndex).toBeLessThan(assetsFallbackIndex);
    expect(imageMap['07007b33-b8bd-4647-be53-ad7c97ef3ca6']).toBe('/images/services/productos/seguridad/2.1.png');
    expect(fs.existsSync(path.join(root, 'public', imageMap['07007b33-b8bd-4647-be53-ad7c97ef3ca6']))).toBe(true);
  });

  test('keeps security electronic reachable from the services index', () => {
    const source = fs.readFileSync(path.join(root, 'src/pages/servicios/index.astro'), 'utf8');

    expect(source).toContain("code: '102'");
    expect(source).toContain("name: 'Seguridad electronica'");
    expect(source).toContain("slug: 'sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi'");
    expect(source).toContain('CCTV IP y VMS');
    expect(source).toContain('href={`/servicios/${service.code}/${service.slug}`}');
  });

  test('renders CCTV AI through the commercial product template route', () => {
    const page = fs.readFileSync(path.join(root, 'src/pages/cctvai/index.astro'), 'utf8');
    const helper = fs.readFileSync(path.join(root, 'src/utils/commercialProductTemplate.ts'), 'utf8');
    const sitemap = fs.readFileSync(path.join(root, 'src/pages/sitemap.xml.ts'), 'utf8');

    expect(page).toContain("getProductoComercialBySlug('cctv-ai-integrado')");
    expect(page).toContain('buildCctvAiProductTemplate');
    expect(page).toContain('Referencia de mercado vs. producto UMSA CCTV AI');
    expect(page).toContain('cctvai-options-row--recommended');
    expect(page).toContain('data-cctvai-demo');
    expect(helper).toContain('contenido_producto');
    expect(helper).toContain('Producto publicado');
    expect(helper).toContain('buildCctvAiProductTemplate');
    expect(sitemap).toContain("{ loc: '/cctvai'");
  });

  test('guards the CCTV AI dashboard against dark-mode CSS scrubs', () => {
    const page = fs.readFileSync(path.join(root, 'src/pages/cctvai/index.astro'), 'utf8');

    expect(page).toContain('--cctvai-dark-muted: rgba(255, 255, 255, 0.8)');
    expect(page).toContain('--cctvai-dark-meta: rgba(255, 255, 255, 0.72)');
    expect(page).toContain('scroll-margin-top: 150px');
    expect(page).toContain(".cctvai-scrub input[type='range']:focus-visible");
    expect(page).toContain('outline: 3px solid rgba(220, 38, 38, 0.48)');
    expect(page).toContain('min-height: 36px');
    expect(page).toContain('.cctvai-scrub__event:focus-visible');
    expect(page).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
  });
});
