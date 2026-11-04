import { yearsOfExperience } from '../src/config/publicFacts';
import { getAntecedentesCatalogCount } from '../src/utils/verifiedProof';
import { publicStructuredData } from '../src/utils/publicStructuredData';
import { correctBlogEditorial, BLOG_REVIEWED_AT } from '../src/utils/blogEditorialCorrections';
import { resolveCanonicalBlogSlug, isCanonicalBlogSlug } from '../src/data/seoRedirects';
import { verifiedCaseCorrection } from '../src/utils/verifiedCaseCorrection';
import { despieceDe } from '../src/components/proto/despiece';
import corrections from '../src/data/propuesta/same-record-corrections.json';
import { matchesCatalog } from '../src/components/proto/catalogFilters';

describe('Public audit repairs', () => {
  test('experience changes on the actual anniversary and the complete catalog counts extras once', () => {
    expect(yearsOfExperience(new Date('2026-05-31T23:59:59Z'))).toBe(22);
    expect(yearsOfExperience(new Date('2026-06-01T00:00:00Z'))).toBe(23);
    expect(getAntecedentesCatalogCount()).toBe(520);
  });
  test('service entity, publisher and breadcrumb URLs refer to canonical public pages', () => {
    const graph = publicStructuredData('/servicios/101', 'Redes', 'Infraestructura de redes')['@graph'];
    const service = graph.find(item => item['@type'] === 'Service');
    expect(service?.url).toBe('https://www.ultimamilla.com.ar/servicios/101');
    expect(service?.provider).toEqual({ '@id': 'https://www.ultimamilla.com.ar/#organization' });
    expect(graph.find(item => item['@type'] === 'BreadcrumbList')?.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.ultimamilla.com.ar/' },
      { '@type': 'ListItem', position: 2, name: 'Servicios', item: 'https://www.ultimamilla.com.ar/servicios' },
      { '@type': 'ListItem', position: 3, name: 'Redes', item: 'https://www.ultimamilla.com.ar/servicios/101' },
    ]);
  });
  test('blog corrections preserve identity, assigned cover, publication date and future CMS revisions', () => {
    const post = { id: '123', slug: 'erp-opensource-pymes-argentina-2026', titulo: 'Original', contenido: '<p>USD 148000</p>', fecha_publicacion: '2026-05-01', imagen_portada: 'original-cover-id' };
    const result = correctBlogEditorial(post);
    expect(result.contenido).toContain('USD 40.320');
    expect(result.imagen_portada).toBe(post.imagen_portada);
    expect(result.fecha_publicacion).toBe(post.fecha_publicacion);
    expect(correctBlogEditorial(result)).toEqual(result);
    const updated = { ...post, fecha_modificacion: '2026-11-05T12:00:00Z' };
    expect(correctBlogEditorial(updated)).toBe(updated);
    expect(Date.parse(BLOG_REVIEWED_AT)).toBeLessThan(Date.parse(updated.fecha_modificacion));
  });
  test('a source correction removes the unsupported claim, preserving unrelated paragraphs', () => {
    const result = correctBlogEditorial({ slug: 'facturacion-electronica-afip-el-costo-real-de-no-mirar-el-padron', titulo: 'Padrón', contenido: '<p>Introducción.</p><ul><li>Descarga delta <a href="https://www.afip.gob.ar/ws/documentacion/ws_sr_padron_a13.asp">fuente</a></li><li>Otro requisito.</li></ul>' });
    expect(result.contenido).not.toContain('Descarga delta');
    expect(result.contenido).toContain('consultas autorizadas');
    expect(result.contenido).toContain('<li>Otro requisito.</li>');
  });
  test('Markdown source corrections preserve unrelated list items', () => {
    const post = { slug: 'facturacion-electronica-afip-el-costo-real-de-no-mirar-el-padron', titulo: 'Padrón', contenido: 'Introducción.\n\n- Descarga delta [manual](https://www.afip.gob.ar/ws/documentacion/ws_sr_padron_a13.asp)\n- Otro requisito.' };
    const corrected = correctBlogEditorial(post);
    expect(corrected.contenido).not.toContain('Descarga delta');
    expect(corrected.contenido).toContain('consultas autorizadas');
    expect(corrected.contenido).toContain('- Otro requisito.');
  });
  test('ERP archive and links have one canonical destination', () => {
    const old = 'del-sap-al-open-source-como-una-pyme-argentina-libero-usd-120-000-en-licencias';
    expect(isCanonicalBlogSlug(old)).toBe(false);
    expect(resolveCanonicalBlogSlug(old)).toBe('erp-opensource-pymes-argentina-2026');
  });
  test('UM-3479 describes UPS, never software, and does not override changed CMS identity', () => {
    const source = { id: 3479, ...corrections['3479'].match };
    const fixed = verifiedCaseCorrection(source)!;
    expect(fixed.services).toEqual([108]);
    expect(despieceDe(fixed.title, fixed.summary, ['108']).partes.some(p => p.key === 'ups')).toBe(true);
    expect(despieceDe(fixed.title, fixed.summary, ['108']).partes.some(p => p.code === '104')).toBe(false);
    expect(verifiedCaseCorrection({ ...source, client: 'Otro cliente' })).toBeUndefined();
  });
  test('unclassified records can be found without assigning an unsupported service or sector', () => {
    const item = { sector: '', services: [], year: '2018', client: 'Cliente confidencial', search: 'Provisión', status: 'verificado' };
    expect(matchesCatalog(item, { service: 'sin-clasificar', sector: 'sin-clasificar' })).toBe(true);
    expect(matchesCatalog(item, { service: '104' })).toBe(false);
  });
});
