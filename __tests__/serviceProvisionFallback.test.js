import { snapshotProductCatalog, findPublishedEditorialProduct } from '../src/utils/directusProductCatalog';
import source from '../src/data/snapshots/servicios.json';
import archive from '../src/data/snapshots/productos.json';

describe('Service catalog during a CMS outage', () => {
  test('restores the 54 embedded items without mixing the separate CCTV AI landing into security', () => {
    const catalogs = source.data.map(service => snapshotProductCatalog(source.data, archive.data, service.id));
    expect(catalogs.map(items => items.length)).toEqual([8, 8, 6, 6, 5, 5, 8, 8]);
    source.data.forEach((service, index) => {
      expect(catalogs[index].map(p => p.titulo)).toEqual(service.Productos.map(p => p.nombre));
    });
    expect(catalogs[1].map(p => p.titulo)).not.toContain('CCTV AI Integrado');
    expect(findPublishedEditorialProduct('cctv-ai-integrado', archive.data)).toMatchObject({ id: 133, slug_producto: 'cctv-ai-integrado' });
  });

  test('a valid empty service snapshot stays empty; legacy snapshots still have a fallback', () => {
    expect(snapshotProductCatalog([{ id: 102, Productos: [] }], archive.data, 102)).toEqual([]);
    expect(snapshotProductCatalog([{ id: 102 }], archive.data, 102)).toEqual(archive.data.filter(p => p.servicio_id === 102));
  });
});
