jest.mock('../src/lib/directus', () => ({ getServiciosV4: jest.fn(), getAllAntecedentes: jest.fn() }));
import { getServiciosV4 } from '../src/lib/directus';
import { getServicios } from '../src/lib/um26-directus';
import { serviceProvisionItems } from '../src/utils/serviceProvision';
import { normalizeEmbeddedProductCatalog } from '../src/utils/directusProductCatalog';
import reviewed from '../src/data/propuesta/service-provision-copy.json';
import { readFileSync } from 'node:fs';

describe('Service provision survives the redesigned service adapter', () => {
  const current = reviewed.items.map(item => ({ servicio_id: item.serviceCode, titulo: item.title, servicio_asociado: item.sourceText, estado: 'publicado' }));
  const catalog = Array.from({ length: 8 }, (_, i) => ({ id: 101 + i, productos: current.filter(p => p.servicio_id === 101 + i) }));

  test('keeps all 54 current products in their service and preserves the order', async () => {
    getServiciosV4.mockResolvedValue(catalog);
    const services = await getServicios();
    expect(services.map(s => s.products.length)).toEqual([8, 8, 6, 6, 5, 5, 8, 8]);
    for (const service of services) {
      const rows = serviceProvisionItems(service.products, service.code);
      expect(rows.map(row => row.title)).toEqual(catalog.find(c => c.id === service.code).productos.map(p => p.titulo));
      expect(rows.every(row => row.summary.length > 20)).toBe(true);
    }
  });

  test('does not restore removed products from reviewed copy or another service', async () => {
    getServiciosV4.mockResolvedValue([{ id: 101, productos: [] }]);
    const services = await getServicios();
    expect(services.find(s => s.code === 101).products).toEqual([]);
    expect(serviceProvisionItems([], 101)).toEqual([]);
    expect(serviceProvisionItems(current.filter(p => p.servicio_id === 102), 101)).toEqual([]);
  });

  test('an edit in Directus invalidates the old editorial summary; new products remain visible', () => {
    const edited = { ...current[0], servicio_asociado: 'Instalación de fibra en un nuevo alcance.' };
    const added = { servicio_id: 101, titulo: 'Nueva prestación', descripcion: '<p>Alcance actualizado del catálogo.</p>' };
    const result = serviceProvisionItems([edited, added], 101);
    expect(result.map(({ title, summary }) => ({ title, summary }))).toEqual([{ title: edited.titulo, summary: edited.servicio_asociado }, { title: added.titulo, summary: 'Alcance actualizado del catálogo.' }]);
    expect(result[1].parts).toEqual([]);
  });

  test('does not publish draft entries and reads the technical scope from a legacy snapshot', () => {
    const legacy = { servicio_id: 101, titulo: 'Rack', descripcion: 'Presentación comercial.\n\n🔧 **Instalamos racks** con patch panels.', status: 'published' };
    expect(serviceProvisionItems([legacy, { ...legacy, titulo: 'Borrador', estado: 'borrador' }, { ...legacy, titulo: 'Draft', status: 'draft' }], 101))
      .toEqual([{ title: 'Rack', summary: 'Instalamos racks con patch panels.', parts: [] }]);
  });

  test('the embedded CMS format reaches a concrete scope, without model guarantees becoming universal', () => {
    const entry = reviewed.items[0];
    const products = normalizeEmbeddedProductCatalog([{ nombre: entry.title, headline: 'Promesa comercial', descripcion: 'Descripción', imagen: '/existing.webp', caracteristicas: ['Hasta 100 Gbps'], servicio_asociado: entry.sourceText }], 101);
    const result = serviceProvisionItems(products, 101);
    expect(result).toEqual([expect.objectContaining({ title: entry.title, summary: entry.summary })]);
    expect(result[0].summary).not.toMatch(/25 años|100 Gbps/);
  });

  test('every published product has labeled isometries backed by actual SVG symbols', () => {
    const sprite = readFileSync('public/cine/iso/partes.svg', 'utf8');
    for (const service of catalog) {
      for (const row of serviceProvisionItems(service.productos, service.id)) {
        expect(row.parts.length).toBeGreaterThan(0);
        for (const part of row.parts) {
          expect(part.label.trim()).not.toBe('');
          expect(sprite).toContain(`id="p-${part.key}"`);
        }
      }
    }
    const cctv = serviceProvisionItems(current, 102).find(row => row.title === 'Videovigilancia IP Profesional');
    expect(cctv.parts.map(part => part.key)).toEqual(['camara', 'nvr', 'servidor']);
    const energy = serviceProvisionItems(current, 108);
    expect(energy.find(row => row.title === 'Instalaciones Fotovoltaicas').parts[0].key).toBe('solar');
    expect(energy.find(row => row.title.startsWith('Termografía')).parts[0].key).toBe('termografia');
  });
});
