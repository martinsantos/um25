import {
  TOPIC_SECTORS,
  TOPIC_SERVICES,
  classifyTopicDocument,
  countTerm,
  normalizeTopicText,
} from '../src/data/blogTopicTaxonomy';
import {
  addContextualTopicLinks,
  getBlogTopicEntries,
  postsForCluster,
  publishableServiceHubs,
  relatedBlogSlugsByTopic,
  resolveBlogTopics,
  servicesForTopics,
  topPostsForCluster,
} from '../src/utils/blogTopicMap';
import { casesForTopics, getTopicCaseIndex } from '../src/utils/blogTopicCases';
import topicMapFile from '../src/data/blogTopicMap.generated.json';

describe('taxonomía temática', () => {
  it('cubre los ocho servicios 101–108 con páginas canónicas', () => {
    expect(TOPIC_SERVICES.map((cluster) => cluster.key)).toEqual(['101', '102', '103', '104', '105', '106', '107', '108']);
    TOPIC_SERVICES.forEach((cluster) => {
      expect(cluster.href).toMatch(new RegExp(`^/servicios/${cluster.key}/[a-z0-9-]+$`));
      expect(cluster.hubSlug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it('cubre los nueve sectores públicos', () => {
    expect(TOPIC_SECTORS.map((cluster) => cluster.key).sort()).toEqual([
      'aeropuertos', 'bodegas', 'constructoras', 'gobiernosectorpublico', 'industria',
      'mineria', 'salud', 'seguridad-electronica', 'software',
    ]);
  });

  it('normaliza tildes y compara por palabra completa', () => {
    const text = normalizeTopicText('Fibra Óptica en la bodega; bodegas y UPS.');
    expect(countTerm(text, 'fibra optica')).toBe(1);
    expect(countTerm(text, 'bodega')).toBe(1);
    expect(countTerm(text, 'bodegas')).toBe(1);
    expect(countTerm(normalizeTopicText('grupos de trabajo'), 'ups')).toBe(0);
  });

  it('clasifica por el texto: servicio y sector con evidencia', () => {
    const result = classifyTopicDocument({
      title: 'Fibra óptica industrial en bodegas',
      summary: 'Backbone de fibra para la planta de una bodega vitivinícola.',
      body: 'Medición con OTDR, switches gestionables y VLAN por sector de la bodega durante la vendimia.',
    });
    expect(result.primaryService).toBe('101');
    expect(result.services[0].evidence).toEqual(expect.arrayContaining(['fibra optica']));
    expect(result.primarySector).toBe('bodegas');
  });

  it('no asigna sector por una mención al pasar en el cuerpo', () => {
    const result = classifyTopicDocument({
      title: 'Zammad para mesa de ayuda',
      summary: 'Tickets, roles y respaldo probado.',
      body: 'Un equipo de soporte, como el de una clínica, necesita tickets con responsables.',
    });
    expect(result.primaryService).toBe('105');
    expect(result.sectors).toEqual([]);
  });

  it('no confunde cámaras empresarias con videovigilancia', () => {
    const result = classifyTopicDocument({
      title: 'listmonk en cámaras: listas y bajas',
      summary: 'Boletines para socios de cámaras empresarias.',
      body: 'La cámara envía listas con doble confirmación y API.',
    });
    expect(result.services.map((entry) => entry.key)).not.toContain('102');
  });
});

describe('mapa temático generado', () => {
  const entries = getBlogTopicEntries();

  it('tiene el corpus del blog completo y sin slugs repetidos', () => {
    expect(entries.length).toBeGreaterThan(300);
    expect(new Set(entries.map((entry) => entry.slug)).size).toBe(entries.length);
    expect((topicMapFile as any).stats.posts).toBe(entries.length);
  });

  it('sólo referencia clusters existentes, con evidencia y relevancia 0–100', () => {
    const serviceKeys = new Set(TOPIC_SERVICES.map((cluster) => cluster.key));
    const sectorKeys = new Set(TOPIC_SECTORS.map((cluster) => cluster.key));
    entries.forEach((entry) => {
      entry.services.forEach((ref) => {
        expect(serviceKeys.has(ref.key)).toBe(true);
        expect(ref.evidence.length).toBeGreaterThan(0);
        expect(ref.relevance).toBeGreaterThanOrEqual(0);
        expect(ref.relevance).toBeLessThanOrEqual(100);
      });
      entry.sectors.forEach((ref) => expect(sectorKeys.has(ref.key)).toBe(true));
    });
  });

  it('clasifica al menos el 95 % de las notas en algún servicio', () => {
    const classified = entries.filter((entry) => entry.services.length > 0).length;
    expect(classified / entries.length).toBeGreaterThanOrEqual(0.95);
  });

  it('fechas ISO válidas y modificación nunca anterior a la publicación', () => {
    entries.forEach((entry) => {
      expect(Number.isFinite(Date.parse(entry.published))).toBe(true);
      expect(Date.parse(entry.modified)).toBeGreaterThanOrEqual(Date.parse(entry.published));
    });
  });
});

describe('enlazado por cluster', () => {
  const entries = getBlogTopicEntries();

  it('artículos relacionados comparten cluster, no se repiten y excluyen la nota actual', () => {
    entries.slice(0, 60).forEach((entry) => {
      const related = relatedBlogSlugsByTopic(entry, 3);
      expect(related).not.toContain(entry.slug);
      expect(new Set(related).size).toBe(related.length);
      related.forEach((slug) => {
        const other = entries.find((candidate) => candidate.slug === slug)!;
        const shares = other.services.some((ref) => entry.services.some((mine) => mine.key === ref.key))
          || other.sectors.some((ref) => entry.sectors.some((mine) => mine.key === ref.key));
        expect(shares).toBe(true);
      });
    });
  });

  it('reduce las notas sin enlaces entrantes desde otras notas', () => {
    const inbound = new Map(entries.map((entry) => [entry.slug, 0]));
    entries.forEach((entry) => {
      relatedBlogSlugsByTopic(entry, 3).forEach((slug) => inbound.set(slug, (inbound.get(slug) || 0) + 1));
    });
    const orphans = [...inbound.values()].filter((count) => count === 0).length;
    // Los bloques de fichas, sectores y listados temáticos cubren el resto.
    expect(orphans / entries.length).toBeLessThan(0.5);
  });

  it('las guías de cada servicio son notas del cluster ordenadas por relevancia', () => {
    const top = topPostsForCluster('service', '104', 3);
    expect(top).toHaveLength(3);
    top.forEach((item) => expect(item.entry.services.some((ref) => ref.key === '104')).toBe(true));
    const all = postsForCluster('service', '104');
    expect(all[0].primary).toBe(true);
  });

  it('un cluster sin notas devuelve vacío (no se inventa relación)', () => {
    const empty = TOPIC_SECTORS.find((cluster) => postsForCluster('sector', cluster.key).length === 0);
    if (empty) expect(topPostsForCluster('sector', empty.key, 3)).toEqual([]);
  });

  it('los listados temáticos publicables tienen al menos 3 notas', () => {
    publishableServiceHubs().forEach(({ count }) => expect(count).toBeGreaterThanOrEqual(3));
  });

  it('servicios relacionados salen de la clasificación de la nota', () => {
    const entry = entries.find((candidate) => candidate.services.length >= 2)!;
    const services = servicesForTopics(entry, 2);
    expect(services.map((item) => item.ref.key)).toEqual(entry.services.slice(0, 2).map((ref) => ref.key));
  });
});

describe('antecedentes del mismo tipo', () => {
  it('sólo usa antecedentes promovibles del snapshot con URL canónica', () => {
    const index = getTopicCaseIndex();
    expect(index.length).toBeGreaterThan(50);
    index.forEach((item) => expect(item.href).toMatch(/^\/antecedentes\/\d+\/[a-z0-9-]+$/));
  });

  it('exige servicio compartido y no repite cliente', () => {
    const cases = casesForTopics({ services: [{ key: '101', relevance: 90, evidence: ['fibra optica'] }], sectors: [] }, 3);
    expect(cases.length).toBeGreaterThan(0);
    cases.forEach((item) => expect(item.services.some((ref) => ref.key === '101')).toBe(true));
    expect(new Set(cases.map((item) => item.client)).size).toBe(cases.length);
    expect(casesForTopics({ services: [], sectors: [] }, 3)).toEqual([]);
  });
});

describe('enlaces contextuales en el cuerpo', () => {
  const topics = { services: [{ key: '101', relevance: 90, evidence: [] }, { key: '105', relevance: 70, evidence: [] }] };

  it('enlaza la primera aparición en párrafos, máximo dos', () => {
    const html = '<h2>Cableado estructurado</h2><p>El cableado estructurado define la red. Otra vez cableado estructurado.</p><p>La mesa de ayuda registra el corte.</p><p>Fibra óptica al final.</p>';
    const { html: out, links } = addContextualTopicLinks(html, topics, 2);
    expect(links).toHaveLength(2);
    expect(out).toContain('<h2>Cableado estructurado</h2>');
    expect(out.match(/servicios\/101\//g)).toHaveLength(1);
    expect(out).toContain('El <a href="/servicios/101/');
    expect(out).toContain('La <a href="/servicios/105/');
    expect(links.map((link) => link.anchor)).toEqual(['cableado estructurado', 'mesa de ayuda']);
  });

  it('no enlaza dentro de enlaces, código ni si la nota ya enlaza el servicio', () => {
    const inside = '<p><a href="/x">cableado estructurado</a> y <code>fibra óptica</code></p>';
    expect(addContextualTopicLinks(inside, { services: [topics.services[0]] }).links).toEqual([]);
    const already = '<p>Ver <a href="/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces">redes</a>. Cableado estructurado.</p>';
    expect(addContextualTopicLinks(already, { services: [topics.services[0]] }).links).toEqual([]);
  });

  it('respeta tildes del texto original en el ancla', () => {
    const { html, links } = addContextualTopicLinks('<p>Un tendido de fibra óptica monomodo.</p>', { services: [topics.services[0]] });
    expect(links[0].anchor).toBe('fibra óptica');
    expect(html).toContain('>fibra óptica</a> monomodo');
  });

  it('clasifica en el momento una nota nueva que no está en el mapa', () => {
    const entry = resolveBlogTopics({
      slug: 'nota-nueva-inexistente',
      titulo: 'Central telefónica con Asterisk y telefonía IP',
      resumen: 'Troncal SIP, internos y grabación.',
      contenido: '<p>La central telefónica con FreePBX y VoIP.</p>',
    });
    expect(entry.services[0].key).toBe('103');
  });
});
