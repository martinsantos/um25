/**
 * Antecedentes reales por cluster temático (snapshot del CMS) y resumen por
 * cluster para GEO. Separado de blogTopicMap.ts para que las rutas que sólo
 * necesitan notas (sitemaps) no carguen el catálogo de antecedentes.
 */
import antecedentesSnapshot from '../data/snapshots/antecedentes.json';
import {
  TOPIC_SECTORS,
  TOPIC_SERVICES,
  classifyTopicDocument,
  normalizeTopicText,
  type TopicCluster,
  type TopicKind,
} from '../data/blogTopicTaxonomy';
import { curateAntecedente } from './antecedentesCuration';
import {
  postsForCluster,
  toRefs,
  topPostsForCluster,
  topicHubHref,
  type BlogTopicEntry,
  type TopicRef,
} from './blogTopicMap';

// ---------------------------------------------------------------------------
// Antecedentes del mismo tipo (snapshot del CMS, 518 registros)
// ---------------------------------------------------------------------------

type SnapshotCase = {
  id: number | string;
  Titulo?: string;
  Descripcion?: string;
  Cliente?: string;
  Area?: string;
  Fecha?: string;
};

export interface TopicCase {
  id: string;
  href: string;
  title: string;
  client: string;
  area: string;
  year: string;
  services: TopicRef[];
  sectors: TopicRef[];
}

let caseIndex: TopicCase[] | null = null;

export function getTopicCaseIndex(): TopicCase[] {
  if (caseIndex) return caseIndex;
  const raw = antecedentesSnapshot as unknown as { data?: SnapshotCase[] } | SnapshotCase[];
  const records = Array.isArray(raw) ? raw : raw.data || [];
  caseIndex = records
    .map((record) => {
      const curated = curateAntecedente(record as Record<string, any>);
      if (!curated.curation.isPromotable) return null;
      // El título y la descripción definen el tipo de trabajo; el área del CMS sólo acompaña.
      const topics = classifyTopicDocument({
        title: record.Titulo || '',
        summary: record.Descripcion || '',
        body: `${record.Area || ''} ${record.Cliente || ''}`,
      });
      return {
        id: String(record.id),
        href: curated.canonicalPath,
        title: curated.displayTitle,
        client: String(record.Cliente || '').trim(),
        area: String(record.Area || '').trim(),
        year: curated.displayYear,
        services: toRefs(topics.services),
        sectors: toRefs(topics.sectors),
      };
    })
    .filter((item): item is TopicCase => Boolean(item))
    .sort((a, b) => Number(b.year) - Number(a.year) || Number(b.id) - Number(a.id));
  return caseIndex;
}

/** Relevancia mínima del servicio en el antecedente para considerarlo "del mismo tipo". */
const CASE_MIN_RELEVANCE = 60;

/**
 * Antecedentes reales afines a los clusters de una nota: el servicio principal del
 * antecedente tiene que ser uno de los servicios de la nota; el sector compartido suma.
 * Un cliente por tarjeta. Si no hay coincidencias claras, devuelve menos (o ninguno).
 */
export function casesForTopics(topics: Pick<BlogTopicEntry, 'services' | 'sectors'>, limit = 3): TopicCase[] {
  if (topics.services.length === 0) return [];
  const scored = getTopicCaseIndex()
    .map((item) => {
      const casePrimary = item.services[0];
      if (!casePrimary || casePrimary.relevance < CASE_MIN_RELEVANCE) return null;
      const serviceIndex = topics.services.findIndex((service) => service.key === casePrimary.key);
      const service = topics.services[serviceIndex];
      if (!service) return null;
      let score = (serviceIndex === 0 ? 3 : 1.5) * (casePrimary.relevance / 100) * (service.relevance / 100);
      topics.sectors.forEach((sector) => {
        if (item.sectors.some((ref) => ref.key === sector.key)) score += 1.5;
      });
      return { item, score };
    })
    .filter((entry): entry is { item: TopicCase; score: number } => Boolean(entry) && (entry as { score: number }).score >= 0.35)
    .sort((a, b) => b.score - a.score || Number(b.item.year) - Number(a.item.year));

  const clients = new Set<string>();
  const picked: TopicCase[] = [];
  for (const { item } of scored) {
    const client = normalizeTopicText(item.client);
    if (client && clients.has(client)) continue;
    clients.add(client);
    picked.push(item);
    if (picked.length >= limit) break;
  }
  return picked;
}

// ---------------------------------------------------------------------------
// Resumen por cluster para GEO (llms.txt, llms-full.txt, /geo/*.json)
// ---------------------------------------------------------------------------

const SITE = 'https://www.ultimamilla.com.ar';

export interface TopicClusterDigest {
  kind: TopicKind;
  key: string;
  name: string;
  page: string;
  blogHub: string | null;
  posts: number;
  keyArticles: Array<{ title: string; url: string }>;
  keyCases: Array<{ client: string; title: string; url: string }>;
}

/** Servicio/sector → notas y casos clave. Sólo clusters con al menos una nota o un caso. */
export function buildTopicClusterDigest(articles = 3, cases = 3): TopicClusterDigest[] {
  const digest = (cluster: TopicCluster): TopicClusterDigest => {
    const hub = cluster.kind === 'service' ? topicHubHref(cluster) : null;
    const clusterCases = cluster.kind === 'service'
      ? casesForTopics({ services: [{ key: cluster.key, relevance: 100, evidence: [] }], sectors: [] }, cases)
      : getTopicCaseIndex().filter((item) => item.sectors[0]?.key === cluster.key).slice(0, cases);
    return {
      kind: cluster.kind,
      key: cluster.key,
      name: cluster.label,
      page: `${SITE}${cluster.href}`,
      blogHub: hub ? `${SITE}${hub}` : null,
      posts: postsForCluster(cluster.kind, cluster.key).length,
      keyArticles: topPostsForCluster(cluster.kind, cluster.key, articles)
        .map((item) => ({ title: item.entry.title, url: `${SITE}/blog/${item.entry.slug}` })),
      keyCases: clusterCases.map((item) => ({ client: item.client, title: item.title, url: `${SITE}${item.href}` })),
    };
  };
  return [...TOPIC_SERVICES, ...TOPIC_SECTORS]
    .map(digest)
    .filter((item) => item.posts > 0 || item.keyCases.length > 0);
}

