#!/usr/bin/env node
/**
 * Genera src/data/blogTopicMap.generated.json: clasificación temática de cada
 * artículo del blog (servicio 101–108 y sector) a partir de su propio texto.
 *
 * Uso:
 *   node --experimental-strip-types scripts/build-blog-topic-map.mjs \
 *     [--base-url https://www.ultimamilla.com.ar] [--corpus-cache ruta.json] [--offline]
 *
 * Fuente del corpus, en orden:
 *   1. Directus (DIRECTUS_INTERNAL_URL / PUBLIC_DIRECTUS_URL + DIRECTUS_STATIC_TOKEN) si responde.
 *   2. HTML público: sitemap-blog.xml de --base-url y cada artículo.
 * `--corpus-cache` guarda/reutiliza el corpus crudo; `--offline` exige usarlo.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TOPIC_SERVICES,
  TOPIC_SECTORS,
  TOPIC_THRESHOLDS,
  classifyTopicDocument,
} from '../src/data/blogTopicTaxonomy.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(root, 'src/data/blogTopicMap.generated.json');

const args = process.argv.slice(2);
const argValue = (name, fallback = '') => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || fallback : fallback;
};
const baseUrl = argValue('--base-url', 'https://www.ultimamilla.com.ar').replace(/\/$/, '');
const corpusCache = argValue('--corpus-cache', '');
const offline = args.includes('--offline');

const decodeHtml = (value = '') => value
  .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

const stripTags = (value = '') => decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const metaContent = (html, key) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const byProperty = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i');
  return decodeHtml(html.match(byProperty)?.[1] || '');
};

const CATEGORY_KEYS = [
  ['proyecto', 'proyectos'], ['técnico', 'tecnico'], ['tecnico', 'tecnico'],
  ['tecnolog', 'tecnologia'], ['empresa', 'empresa'], ['noticia', 'noticias'],
];
const categoryKey = (label = '') => {
  const clean = label.toLowerCase();
  return CATEGORY_KEYS.find(([needle]) => clean.includes(needle))?.[1] || 'noticias';
};

/** Slugs internos /blog/<slug> enlazados desde un fragmento HTML. */
const internalBlogLinks = (html = '') => {
  const slugs = new Set();
  for (const match of html.matchAll(/href=["'](?:https?:\/\/(?:www\.)?ultimamilla\.com\.ar)?\/blog\/(?!categoria\/|tema\/|og\/)([a-z0-9-]+)\/?["'#?]/gi)) {
    slugs.add(match[1].toLowerCase());
  }
  return [...slugs];
};

/** Texto del cuerpo para clasificar: sin enlaces a otros artículos (sus títulos no son tema de esta nota). */
const bodyForClassification = (html = '') => stripTags(
  html.replace(/<a\b[^>]*href=["'][^"']*\/blog\/[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, ' '),
);

async function fetchText(url, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'UMSA-topic-map/1.0' } });
      if (res.ok) return await res.text();
      if (res.status === 404) return '';
    } catch {
      // reintentar
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  return '';
}

async function fromDirectus() {
  const base = process.env.DIRECTUS_INTERNAL_URL || process.env.PUBLIC_DIRECTUS_URL || '';
  const token = process.env.DIRECTUS_STATIC_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';
  if (!base || !token) return null;
  try {
    const params = new URLSearchParams({
      limit: '1000',
      sort: '-fecha_publicacion',
      fields: 'slug,titulo,resumen,contenido,categoria,tags,fecha_publicacion,fecha_modificacion,status',
      'filter[status][_eq]': 'published',
    });
    const res = await fetch(`${base}/items/blog_posts?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const { data = [] } = await res.json();
    if (data.length === 0) return null;
    return data.map((post) => ({
      slug: post.slug,
      title: post.titulo,
      summary: post.resumen || '',
      category: post.categoria || 'noticias',
      tags: Array.isArray(post.tags) ? post.tags : [],
      published: post.fecha_publicacion || '',
      modified: post.fecha_modificacion || post.fecha_publicacion || '',
      html: post.contenido || '',
    }));
  } catch {
    return null;
  }
}

async function fromPublicSite() {
  const sitemap = await fetchText(`${baseUrl}/sitemap-blog.xml`);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter((url) => /\/blog\/[^/]+$/.test(new URL(url).pathname))
    .filter((url) => !/\/blog\/(categoria|tema)\//.test(url));

  const posts = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const html = await fetchText(url);
      if (!html) continue;
      const slug = new URL(url).pathname.split('/').pop();
      const title = stripTags(html.match(/<h1[^>]*class=["'][^"']*article-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
      if (!title) continue;
      const proseStart = html.search(/<div class=["']prose["'][^>]*>/i);
      const afterProse = proseStart >= 0 ? html.slice(proseStart) : '';
      const proseEnd = afterProse.search(/<ul class=["']bp-tags|<section class=["']bp-author|<nav class=["']bp-pn|<\/article>/i);
      const prose = proseEnd > 0 ? afterProse.slice(0, proseEnd) : afterProse;
      posts.push({
        slug,
        title,
        summary: stripTags(html.match(/<p[^>]*class=["'][^"']*article-lead[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || '') || metaContent(html, 'description'),
        category: categoryKey(metaContent(html, 'article:section')),
        tags: [...html.matchAll(/<meta[^>]+property=["']article:tag["'][^>]+content=["']([^"']+)["']/gi)].map((m) => decodeHtml(m[1])),
        published: metaContent(html, 'article:published_time'),
        modified: metaContent(html, 'article:modified_time') || metaContent(html, 'article:published_time'),
        html: prose,
      });
      if (posts.length % 50 === 0) console.log(`  ${posts.length}/${urls.length} artículos leídos`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return posts;
}

async function loadCorpus() {
  if (corpusCache) {
    try {
      const cached = JSON.parse(await fs.readFile(corpusCache, 'utf8'));
      if (Array.isArray(cached) && cached.length > 0) {
        console.log(`Corpus desde caché: ${cached.length} artículos (${corpusCache})`);
        return { corpus: cached, source: 'cache' };
      }
    } catch {
      if (offline) throw new Error(`--offline sin caché legible en ${corpusCache}`);
    }
  }
  if (offline) throw new Error('--offline requiere --corpus-cache');

  const directus = await fromDirectus();
  const corpus = directus || await fromPublicSite();
  const source = directus ? 'directus' : baseUrl;
  if (corpusCache) await fs.writeFile(corpusCache, JSON.stringify(corpus));
  return { corpus, source };
}

const dateOnly = (value) => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? new Date(time).toISOString() : '';
};

const compact = (scores) => scores.map((entry) => ({
  key: entry.key,
  relevance: entry.relevance,
  evidence: entry.evidence.slice(0, 3),
}));

async function main() {
  const { corpus, source } = await loadCorpus();
  const unique = new Map();
  for (const post of corpus) if (post?.slug && !unique.has(post.slug)) unique.set(post.slug, post);

  const posts = [...unique.values()]
    .map((post) => {
      const topics = classifyTopicDocument({
        title: post.title,
        summary: post.summary,
        tags: post.tags,
        body: bodyForClassification(post.html),
      });
      return {
        slug: post.slug,
        title: post.title,
        category: post.category,
        published: dateOnly(post.published),
        modified: dateOnly(post.modified) || dateOnly(post.published),
        services: compact(topics.services),
        sectors: compact(topics.sectors),
        _links: internalBlogLinks(post.html),
      };
    })
    .sort((a, b) => (b.published || '').localeCompare(a.published || '') || a.slug.localeCompare(b.slug));

  // Métricas de enlazado previo (cuerpo de las notas): cuántas notas no reciben ningún enlace de otra nota.
  const known = new Set(posts.map((post) => post.slug));
  const inbound = new Map(posts.map((post) => [post.slug, 0]));
  for (const post of posts) {
    for (const target of post._links) {
      if (target !== post.slug && known.has(target)) inbound.set(target, inbound.get(target) + 1);
    }
  }
  const orphansInBody = [...inbound.values()].filter((count) => count === 0).length;

  const coverage = (list, kind) => Object.fromEntries(list.map((cluster) => [
    cluster.key,
    posts.filter((post) => post[kind].some((entry) => entry.key === cluster.key)).length,
  ]));
  const primaryCoverage = Object.fromEntries(TOPIC_SERVICES.map((cluster) => [
    cluster.key,
    posts.filter((post) => post.services[0]?.key === cluster.key).length,
  ]));

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source,
    thresholds: TOPIC_THRESHOLDS,
    stats: {
      posts: posts.length,
      withService: posts.filter((post) => post.services.length > 0).length,
      withSector: posts.filter((post) => post.sectors.length > 0).length,
      unclassified: posts.filter((post) => post.services.length === 0 && post.sectors.length === 0).length,
      servicePosts: coverage(TOPIC_SERVICES, 'services'),
      primaryServicePosts: primaryCoverage,
      sectorPosts: coverage(TOPIC_SECTORS, 'sectors'),
      postsWithoutInboundBodyLinks: orphansInBody,
    },
    posts: posts.map(({ _links, ...post }) => post),
  };

  // Un artículo por línea: diffs legibles sin inflar el bundle.
  const { posts: postList, ...head } = output;
  const headJson = JSON.stringify(head, null, 1).replace(/\n}$/, '');
  const body = postList.map((post) => `  ${JSON.stringify(post)}`).join(',\n');
  await fs.writeFile(OUTPUT, `${headJson},\n "posts": [\n${body}\n ]\n}\n`);
  console.log(`Fuente: ${source}`);
  console.log(JSON.stringify(output.stats, null, 2));
  console.log(`Escrito: ${path.relative(root, OUTPUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
