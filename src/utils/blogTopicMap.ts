/**
 * Mapa temático del blog en runtime.
 *
 * Fuente principal: src/data/blogTopicMap.generated.json (scripts/build-blog-topic-map.mjs).
 * Un artículo publicado después de la última generación se clasifica en el
 * momento con la misma taxonomía, a partir de su propio texto.
 */
import topicMapData from '../data/blogTopicMap.generated.json';
import {
  TOPIC_SECTORS,
  TOPIC_SERVICES,
  classifyTopicDocument,
  getTopicCluster,
  normalizeTopicText,
  type TopicCluster,
  type TopicKind,
} from '../data/blogTopicTaxonomy';

export interface TopicRef {
  key: string;
  relevance: number;
  evidence: string[];
}

export interface BlogTopicEntry {
  slug: string;
  title: string;
  category: string;
  published: string;
  modified: string;
  services: TopicRef[];
  sectors: TopicRef[];
}

interface TopicMapFile {
  generatedAt: string;
  posts: BlogTopicEntry[];
}

const topicMap = topicMapData as unknown as TopicMapFile;
const entries: BlogTopicEntry[] = topicMap.posts || [];
const entryBySlug = new Map(entries.map((entry) => [entry.slug, entry]));

export const blogTopicMapGeneratedAt = topicMap.generatedAt;
export const getBlogTopicEntries = (): BlogTopicEntry[] => entries;
export const getBlogTopicEntry = (slug: string): BlogTopicEntry | undefined => entryBySlug.get(slug);

export interface ClassifiablePost {
  slug: string;
  titulo?: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  tags?: string[];
  fecha_publicacion?: string;
  fecha_modificacion?: string;
}

export const toRefs = (scores: Array<{ key: string; relevance: number; evidence: string[] }>): TopicRef[] =>
  scores.map(({ key, relevance, evidence }) => ({ key, relevance, evidence: evidence.slice(0, 3) }));

/** Quita del texto los enlaces a otras notas: sus títulos no describen esta nota. */
const bodyWithoutBlogLinks = (html = ''): string =>
  html.replace(/<a\b[^>]*href=["'][^"']*\/blog\/[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, ' ');

/** Entrada del mapa, o clasificación en el momento si la nota es posterior al mapa. */
export function resolveBlogTopics(post: ClassifiablePost): BlogTopicEntry {
  const known = entryBySlug.get(post.slug);
  if (known) return known;
  const topics = classifyTopicDocument({
    title: post.titulo,
    summary: post.resumen,
    tags: post.tags,
    body: bodyWithoutBlogLinks(post.contenido),
  });
  return {
    slug: post.slug,
    title: post.titulo || post.slug,
    category: post.categoria || 'noticias',
    published: post.fecha_publicacion || '',
    modified: post.fecha_modificacion || post.fecha_publicacion || '',
    services: toRefs(topics.services),
    sectors: toRefs(topics.sectors),
  };
}

// ---------------------------------------------------------------------------
// Artículos relacionados por cluster
// ---------------------------------------------------------------------------

const TITLE_STOPWORDS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'como', 'que', 'por', 'del', 'de', 'en', 'y', 'o']);
/** Primera palabra significativa del título: en este blog suele ser la herramienta o el organismo. */
const firstToken = (title: string): string =>
  normalizeTopicText(title).split(' ').find((word) => word && !TITLE_STOPWORDS.has(word)) || '';

const topicAffinity = (a: BlogTopicEntry, b: BlogTopicEntry): number => {
  let score = 0;
  a.services.forEach((service, index) => {
    const match = b.services.find((candidate) => candidate.key === service.key);
    if (!match) return;
    const primaryBoost = index === 0 && b.services[0]?.key === service.key ? 1.6 : 1;
    score += (Math.min(service.relevance, match.relevance) / 100) * 3 * primaryBoost;
  });
  a.sectors.forEach((sector) => {
    const match = b.sectors.find((candidate) => candidate.key === sector.key);
    if (match) score += (Math.min(sector.relevance, match.relevance) / 100) * 2;
  });
  const sharedEvidence = a.services.concat(a.sectors)
    .flatMap((ref) => ref.evidence)
    .filter((term) => b.services.concat(b.sectors).some((ref) => ref.evidence.includes(term)));
  score += Math.min(3, new Set(sharedEvidence).size) * 0.35;
  if (a.category === b.category) score += 0.25;
  return score;
};

const timeOf = (value: string): number => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
};

/** Afinidad mínima para considerar dos notas relacionadas. */
const RELATED_MIN_AFFINITY = 1.2;
/** Penalización por enlace entrante ya asignado: reparte enlaces sin romper la afinidad mínima. */
const RELATED_INBOUND_PENALTY = 0.35;

function pickRelated(current: BlogTopicEntry, limit: number, inbound?: Map<string, number>): BlogTopicEntry[] {
  if (current.services.length === 0 && current.sectors.length === 0) return [];
  const currentTitle = normalizeTopicText(current.title);
  const currentTool = firstToken(current.title);

  const ranked = entries
    .filter((entry) => entry.slug !== current.slug && normalizeTopicText(entry.title) !== currentTitle)
    .map((entry) => {
      const score = topicAffinity(current, entry);
      return { entry, score, adjusted: score - RELATED_INBOUND_PENALTY * (inbound?.get(entry.slug) || 0) };
    })
    .filter(({ score }) => score >= RELATED_MIN_AFFINITY)
    .sort((a, b) => b.adjusted - a.adjusted || b.score - a.score || timeOf(b.entry.published) - timeOf(a.entry.published));

  const picked: BlogTopicEntry[] = [];
  // Una sola nota por herramienta u organismo (la primera palabra significativa del título).
  const toolsUsed = new Set<string>();
  const titlesUsed = new Set<string>();
  for (const { entry } of ranked) {
    const tool = firstToken(entry.title);
    const title = normalizeTopicText(entry.title);
    if (titlesUsed.has(title) || toolsUsed.has(tool)) continue;
    picked.push(entry);
    toolsUsed.add(tool);
    titlesUsed.add(title);
    if (picked.length >= limit) return picked;
  }
  // Si la diversidad dejó huecos, completar con los siguientes por afinidad.
  for (const { entry } of ranked) {
    if (picked.length >= limit) break;
    const title = normalizeTopicText(entry.title);
    if (!picked.includes(entry) && !titlesUsed.has(title)) {
      picked.push(entry);
      titlesUsed.add(title);
    }
  }
  // currentTool sólo se usa para no repetir herramientas: una nota hermana de la misma herramienta es válida.
  void currentTool;
  return picked;
}

let relatedIndex: Map<string, string[]> | null = null;
const RELATED_PER_POST = 3;

/**
 * Relacionados de todo el corpus, calculados una vez: cada nota toma sus 3 más
 * afines y, entre candidatas comparables, prefiere las que todavía reciben menos
 * enlaces. Así ninguna nota del mapa queda sin enlaces entrantes si tiene afinidad.
 */
function getRelatedIndex(): Map<string, string[]> {
  if (relatedIndex) return relatedIndex;
  const inbound = new Map<string, number>();
  relatedIndex = new Map();
  for (const entry of entries) {
    const picked = pickRelated(entry, RELATED_PER_POST, inbound);
    picked.forEach((item) => inbound.set(item.slug, (inbound.get(item.slug) || 0) + 1));
    relatedIndex.set(entry.slug, picked.map((item) => item.slug));
  }
  return relatedIndex;
}

/**
 * Notas del mismo cluster, ordenadas por afinidad temática (no por fecha).
 * Evita repetir la misma herramienta del título y excluye títulos idénticos.
 */
export function relatedBlogSlugsByTopic(current: BlogTopicEntry, limit = 3): string[] {
  if (limit <= RELATED_PER_POST && entryBySlug.get(current.slug) === current) {
    return (getRelatedIndex().get(current.slug) || []).slice(0, limit);
  }
  return pickRelated(current, limit).map((entry) => entry.slug);
}

// ---------------------------------------------------------------------------
// Notas por cluster (fichas de servicio, portadas de sector, listados temáticos)
// ---------------------------------------------------------------------------

const refsFor = (entry: BlogTopicEntry, kind: TopicKind): TopicRef[] =>
  kind === 'service' ? entry.services : entry.sectors;

export interface ClusterPost {
  entry: BlogTopicEntry;
  relevance: number;
  primary: boolean;
  evidence: string[];
}

export function postsForCluster(kind: TopicKind, key: string): ClusterPost[] {
  return entries
    .map((entry) => {
      const refs = refsFor(entry, kind);
      const index = refs.findIndex((ref) => ref.key === key);
      const ref = refs[index];
      if (!ref) return null;
      return { entry, relevance: ref.relevance, primary: index === 0, evidence: ref.evidence };
    })
    .filter((item): item is ClusterPost => Boolean(item))
    .sort((a, b) =>
      Number(b.primary) - Number(a.primary)
      || b.relevance - a.relevance
      || timeOf(b.entry.published) - timeOf(a.entry.published));
}

export const isTruncatedTitle = (title: string): boolean => /(\.\.\.|…)\s*$/.test(title || '');

/** Las N notas más relevantes de un cluster, sin títulos repetidos ni la misma herramienta dos veces. */
export function topPostsForCluster(kind: TopicKind, key: string, limit = 3): ClusterPost[] {
  const picked: ClusterPost[] = [];
  const tools = new Set<string>();
  const titles = new Set<string>();
  const candidates = postsForCluster(kind, key);
  for (const candidate of candidates) {
    const tool = firstToken(candidate.entry.title);
    const title = normalizeTopicText(candidate.entry.title);
    // Un título cortado en el CMS ("…") no se destaca; sigue disponible en listados y relacionados.
    if (tools.has(tool) || titles.has(title) || isTruncatedTitle(candidate.entry.title)) continue;
    picked.push(candidate);
    tools.add(tool);
    titles.add(title);
    if (picked.length >= limit) return picked;
  }
  for (const candidate of candidates) {
    if (picked.length >= limit) break;
    const title = normalizeTopicText(candidate.entry.title);
    if (!picked.includes(candidate) && !titles.has(title)) {
      picked.push(candidate);
      titles.add(title);
    }
  }
  return picked;
}

export const serviceClusters = (): TopicCluster[] => TOPIC_SERVICES;
export const sectorClusters = (): TopicCluster[] => TOPIC_SECTORS;

export const serviceClusterForId = (id: string | number): TopicCluster | undefined =>
  getTopicCluster('service', String(id));

export const sectorClusterForSlug = (slug: string): TopicCluster | undefined => {
  const alias: Record<string, string> = { gobierno: 'gobiernosectorpublico' };
  return getTopicCluster('sector', alias[slug] || slug);
};

/** Clusters de servicio con listado temático publicable (mínimo de notas para no crear páginas finas). */
export const TOPIC_HUB_MIN_POSTS = 3;
export const publishableServiceHubs = (): Array<{ cluster: TopicCluster; count: number }> =>
  TOPIC_SERVICES
    .map((cluster) => ({ cluster, count: postsForCluster('service', cluster.key).length }))
    .filter(({ cluster, count }) => Boolean(cluster.hubSlug) && count >= TOPIC_HUB_MIN_POSTS);

export const topicHubHref = (cluster: TopicCluster): string | null =>
  cluster.hubSlug && postsForCluster('service', cluster.key).length >= TOPIC_HUB_MIN_POSTS
    ? `/blog/tema/${cluster.hubSlug}`
    : null;

// ---------------------------------------------------------------------------
// Servicios relacionados de una nota
// ---------------------------------------------------------------------------

export function servicesForTopics(topics: Pick<BlogTopicEntry, 'services'>, limit = 2): Array<{ cluster: TopicCluster; ref: TopicRef }> {
  return topics.services
    .map((ref) => ({ cluster: getTopicCluster('service', ref.key), ref }))
    .filter((item): item is { cluster: TopicCluster; ref: TopicRef } => Boolean(item.cluster))
    .slice(0, limit);
}

export function sectorsForTopics(topics: Pick<BlogTopicEntry, 'sectors'>, limit = 2): Array<{ cluster: TopicCluster; ref: TopicRef }> {
  return topics.sectors
    .map((ref) => ({ cluster: getTopicCluster('sector', ref.key), ref }))
    .filter((item): item is { cluster: TopicCluster; ref: TopicRef } => Boolean(item.cluster))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Enlaces contextuales dentro del cuerpo
// ---------------------------------------------------------------------------

const SKIP_TAGS = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'script', 'style', 'button', 'figcaption', 'blockquote', 'summary', 'label']);
const TEXT_CONTAINERS = new Set(['p', 'li']);

const accentInsensitivePattern = (phrase: string): RegExp => {
  const map: Record<string, string> = { a: '[aá]', e: '[eé]', i: '[ií]', o: '[oó]', u: '[uúü]', n: '[nñ]' };
  const body = phrase
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split('')
    .map((char) => map[char] || char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('')
    .replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${body})(?=$|[^\\p{L}\\p{N}])`, 'iu');
};

export interface ContextualLink {
  href: string;
  anchor: string;
}

/**
 * Enlaza la primera aparición de una frase clara del cluster (máx. `max` enlaces),
 * sólo en párrafos o ítems de lista, nunca dentro de enlaces, títulos o código,
 * y sólo si la nota todavía no enlaza esa página.
 */
export function addContextualTopicLinks(
  html: string,
  topics: Pick<BlogTopicEntry, 'services'>,
  max = 2,
): { html: string; links: ContextualLink[] } {
  const links: ContextualLink[] = [];
  if (!html || max <= 0) return { html, links };

  const candidates = topics.services
    .map((ref) => getTopicCluster('service', ref.key))
    .filter((cluster): cluster is TopicCluster => Boolean(cluster))
    .filter((cluster) => !html.includes(cluster.href));
  if (candidates.length === 0) return { html, links };

  const tokens = html.split(/(<[^>]+>)/g);
  const skipStack: string[] = [];
  let containerDepth = 0;
  const linkedHrefs = new Set<string>();

  for (let index = 0; index < tokens.length && links.length < max; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (token.startsWith('<')) {
      const match = token.match(/^<\s*(\/)?\s*([a-z0-9]+)/i);
      if (!match) continue;
      const closing = Boolean(match[1]);
      const tag = (match[2] || '').toLowerCase();
      const selfClosing = /\/>$/.test(token);
      if (SKIP_TAGS.has(tag) && !selfClosing) {
        if (closing) {
          const at = skipStack.lastIndexOf(tag);
          if (at >= 0) skipStack.splice(at, 1);
        } else {
          skipStack.push(tag);
        }
      }
      if (TEXT_CONTAINERS.has(tag) && !selfClosing) containerDepth = Math.max(0, containerDepth + (closing ? -1 : 1));
      continue;
    }
    if (skipStack.length > 0 || containerDepth === 0) continue;

    // Como máximo un enlace por nodo de texto: evita anidar enlaces en el mismo tramo.
    tokenLoop: for (const cluster of candidates) {
      if (linkedHrefs.has(cluster.href) || links.length >= max) continue;
      for (const anchor of cluster.anchors) {
        const pattern = accentInsensitivePattern(anchor);
        const current = token;
        const found = current.match(pattern);
        if (!found || found.index === undefined || !found[2]) continue;
        const start = found.index + (found[1] || '').length;
        const text = found[2];
        tokens[index] = `${current.slice(0, start)}<a href="${cluster.href}" class="bp-topic-link">${text}</a>${current.slice(start + text.length)}`;
        links.push({ href: cluster.href, anchor: text });
        linkedHrefs.add(cluster.href);
        break tokenLoop;
      }
    }
  }

  return { html: tokens.join(''), links };
}

/** Fecha de la nota más reciente del mapa (ISO), para señales de frescura. */
export const latestBlogTopicDate = (): string =>
  entries.map((entry) => entry.modified || entry.published).filter(Boolean).sort().at(-1) || '';
