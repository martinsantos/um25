#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

const DEFAULT_BASE_URL = 'https://www.ultimamilla.com.ar';
const DEFAULT_CANONICAL_BASE_URL = 'https://www.ultimamilla.com.ar';
const FETCH_TIMEOUT_MS = Number(process.env.UM_BLOG_SCORE_TIMEOUT_MS || 20000);
const BLOG_SCORE_REFERENCE = 'UMSA editorial GEO scoring: freshness, cover integrity, cover diversity, metadata and publishing governance.';

const BLOG_SCORE_WEIGHTS = {
  freshnessAlignment: 25,
  coverIntegrity: 25,
  coverDiversity: 20,
  metadataStructuredData: 20,
  editorialGovernance: 10,
};

const DETAIL_AUDIT_LIMIT = 5;
const RECENT_WINDOW = 10;
const COVER_WINDOW = 20;

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function normalizeBase(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function makeUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function postSlug(post) {
  return typeof post?.slug === 'string' ? post.slug.trim() : '';
}

function postImage(post) {
  return typeof post?.imagen_portada === 'string' ? post.imagen_portada.trim() : '';
}

function postDate(post) {
  const time = Date.parse(post?.fecha_publicacion || '');
  return Number.isFinite(time) ? time : 0;
}

function umcliBlogPosts(snapshot) {
  const posts = snapshot.umcli.json?.data?.blog_posts || snapshot.umcli.json?.data?.blogPosts || [];
  return Array.isArray(posts) ? posts : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function duplicateGroups(values) {
  const groups = new Map();
  for (const value of values.filter(Boolean)) {
    groups.set(value, [...(groups.get(value) || []), value]);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
}

function imageDuplicateEvidence(posts, limit = posts.length) {
  const groups = new Map();
  for (const post of posts.slice(0, limit)) {
    const image = postImage(post);
    if (!image) continue;
    groups.set(image, [...(groups.get(image) || []), postSlug(post)]);
  }

  const duplicates = [...groups.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  return {
    totalPosts: posts.slice(0, limit).length,
    imageCount: [...groups.values()].reduce((sum, slugs) => sum + slugs.length, 0),
    uniqueImages: groups.size,
    duplicateGroups: duplicates.length,
    duplicatePosts: duplicates.reduce((sum, [, slugs]) => sum + slugs.length, 0),
    maxReuse: duplicates[0]?.[1]?.length || 1,
    topDuplicates: duplicates.slice(0, 5).map(([image, slugs]) => ({ image, count: slugs.length, slugs })),
  };
}

function getAttr(tag, attr) {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return tag.match(new RegExp(`\\s${escaped}=(["'])([\\s\\S]*?)\\1`, 'i'))?.[2]?.trim() || '';
}

function metaContent(html, key, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = html.match(new RegExp(`<meta[^>]+${key}=(["'])${escaped}\\1[^>]*>`, 'i'))?.[0] || '';
  return getAttr(tag, 'content');
}

function linkHref(html, rel) {
  const tag = html.match(new RegExp(`<link[^>]+rel=(["'])${rel}\\1[^>]*>`, 'i'))?.[0] || '';
  return getAttr(tag, 'href');
}

function textBetween(html, regex) {
  return html.match(regex)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]+type=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[2].trim())
    .filter(Boolean);
}

function collectTypes(value, out = []) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, out);
    return out;
  }
  if (value['@type']) out.push(value['@type']);
  if (value['@graph']) collectTypes(value['@graph'], out);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') collectTypes(nested, out);
  }
  return out.flat().filter(Boolean);
}

function collectImages(value, out = []) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    for (const item of value) collectImages(item, out);
    return out;
  }
  if (typeof value.image === 'string') out.push(value.image);
  if (value.image && typeof value.image === 'object') collectImages(value.image, out);
  if (typeof value.url === 'string' && /\/uploads\/|images\.unsplash\.com|\/img\//.test(value.url)) out.push(value.url);
  if (value['@graph']) collectImages(value['@graph'], out);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') collectImages(nested, out);
  }
  return unique(out);
}

function inspectBlogDetail(path, resource) {
  const html = resource.text || '';
  const parsedJsonLd = [];
  const jsonLdErrors = [];

  for (const raw of jsonLdBlocks(html)) {
    try {
      parsedJsonLd.push(JSON.parse(raw));
    } catch (error) {
      jsonLdErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    path,
    ...resource,
    title: textBetween(html, /<title>([\s\S]*?)<\/title>/i),
    h1: textBetween(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
    description: metaContent(html, 'name', 'description'),
    canonical: linkHref(html, 'canonical'),
    ogImage: metaContent(html, 'property', 'og:image'),
    twitterImage: metaContent(html, 'name', 'twitter:image'),
    publishedTime: metaContent(html, 'property', 'article:published_time'),
    jsonLdErrors,
    jsonLdTypes: collectTypes(parsedJsonLd),
    jsonLdImages: collectImages(parsedJsonLd),
  };
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(baseUrl, path) {
  const url = makeUrl(baseUrl, path);
  try {
    const response = await fetchWithTimeout(url);
    const text = await response.text().catch(() => '');
    return { path, url, ok: response.ok, status: response.status, text, contentType: response.headers.get('content-type') || '' };
  } catch (error) {
    return { path, url, ok: false, status: 0, text: '', contentType: '', error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchJson(baseUrl, path) {
  const resource = await fetchText(baseUrl, path);
  if (!resource.text) return { ...resource, json: null, parseError: 'empty response' };
  try {
    return { ...resource, json: JSON.parse(resource.text), parseError: null };
  } catch (error) {
    return { ...resource, json: null, parseError: error instanceof Error ? error.message : String(error) };
  }
}

function addCheck(checks, points, ok, label, details = {}) {
  checks.push({
    label,
    points,
    earned: ok ? points : 0,
    ok: Boolean(ok),
    ...details,
  });
}

function buildCategory(name, checks) {
  const max = BLOG_SCORE_WEIGHTS[name];
  const raw = checks.reduce((sum, check) => sum + check.earned, 0);
  const score = Number(clamp(raw, 0, max).toFixed(2));
  return {
    score,
    max,
    percent: Number(((score / max) * 100).toFixed(1)),
    checks,
  };
}

async function buildBlogSnapshot(baseUrl) {
  const [blogApi, umcli, geoBlog, sitemapBlog, rss] = await Promise.all([
    fetchJson(baseUrl, '/api/blog'),
    fetchJson(baseUrl, '/api/umcli.json'),
    fetchJson(baseUrl, '/geo/blog-index.json'),
    fetchText(baseUrl, '/sitemap-blog.xml'),
    fetchText(baseUrl, '/rss.xml'),
  ]);

  const posts = Array.isArray(blogApi.json?.data) ? blogApi.json.data : [];
  const detailPaths = posts.slice(0, DETAIL_AUDIT_LIMIT).map((post) => `/blog/${postSlug(post)}`);
  const details = await Promise.all(detailPaths.map(async (path) => inspectBlogDetail(path, await fetchText(baseUrl, path))));

  return {
    blogApi,
    umcli,
    geoBlog,
    sitemapBlog,
    rss,
    posts,
    details,
  };
}

function scoreFreshnessAlignment(snapshot) {
  const checks = [];
  const posts = snapshot.posts;
  const umPosts = snapshot.umcli.json?.data?.blog_posts || snapshot.umcli.json?.data?.blogPosts || [];
  const blogSlugs = posts.map(postSlug).filter(Boolean);
  const umSlugs = Array.isArray(umPosts) ? umPosts.map(postSlug).filter(Boolean) : [];
  const latest = posts[0];
  const latestSlug = blogSlugs[0] || '';
  const latestAgeDays = latest ? (Date.now() - postDate(latest)) / 86400000 : Infinity;
  const sitemapText = snapshot.sitemapBlog.text || '';
  const rssText = snapshot.rss.text || '';

  addCheck(checks, 6, snapshot.blogApi.ok && posts.length >= 10, '/api/blog returns at least 10 visible posts', { posts: posts.length });
  addCheck(checks, 6, latestAgeDays <= 7, 'Latest visible blog post is recent enough for daily editorial cadence', { latestSlug, latestAgeDays: Number(latestAgeDays.toFixed(2)) });
  addCheck(checks, 5, latestSlug && umSlugs[0] === latestSlug, 'UMCLI latest blog post matches /api/blog latest post', { latestSlug, umcliLatest: umSlugs[0] || '' });
  addCheck(checks, 4, blogSlugs.slice(0, RECENT_WINDOW).every((slug) => umSlugs.includes(slug)), 'UMCLI includes every current /api/blog top 10 slug');
  addCheck(checks, 2, latestSlug && rssText.includes(`/blog/${latestSlug}`), 'RSS exposes the latest visible blog post');
  addCheck(checks, 2, blogSlugs.slice(0, RECENT_WINDOW).every((slug) => sitemapText.includes(`/blog/${slug}`)), 'Blog sitemap exposes current top 10 slugs');

  return buildCategory('freshnessAlignment', checks);
}

function scoreCoverIntegrity(snapshot) {
  const checks = [];
  const posts = snapshot.posts;
  const windowPosts = posts.slice(0, COVER_WINDOW);
  const images = windowPosts.map(postImage);
  const absoluteImages = images.filter((image) => /^https?:\/\//i.test(image));
  const badFallbacks = images.filter((image) => /(?:blog-default|default|placeholder|um-logo)/i.test(image));
  const sitemapText = snapshot.sitemapBlog.text || '';
  const details = snapshot.details;
  const detailsWithImages = details.filter((detail) => detail.ok && detail.ogImage && detail.twitterImage);
  const jsonLdImagesOk = details.every((detail) => {
    const expected = postImage(posts.find((post) => `/blog/${postSlug(post)}` === detail.path) || {});
    return detail.ok && detail.jsonLdErrors.length === 0 && detail.jsonLdTypes.some((type) => ['Article', 'BlogPosting', 'NewsArticle'].includes(type)) &&
      (!expected || detail.jsonLdImages.includes(expected) || detail.ogImage === expected);
  });

  addCheck(checks, 8, windowPosts.length >= COVER_WINDOW && absoluteImages.length === windowPosts.length, 'Top 20 posts expose absolute cover image URLs', { checked: windowPosts.length, absoluteImages: absoluteImages.length });
  addCheck(checks, 5, badFallbacks.length === 0, 'Top 20 posts avoid generic fallback cover assets', { badFallbacks });
  addCheck(
    checks,
    5,
    windowPosts.every((post) => {
      const image = postImage(post);
      return sitemapText.includes(image) || sitemapText.includes(image.replace(/&/g, '&amp;'));
    }),
    'Blog sitemap exposes image:loc for every top 20 cover',
  );
  addCheck(checks, 4, detailsWithImages.length === details.length, 'Audited detail pages expose OG and Twitter cover images', { audited: details.length, withImages: detailsWithImages.length });
  addCheck(checks, 3, jsonLdImagesOk, 'Audited detail pages expose Article/BlogPosting JSON-LD images without parse errors');

  return buildCategory('coverIntegrity', checks);
}

function scoreCoverDiversity(snapshot) {
  const checks = [];
  const posts = snapshot.posts;
  const corpusPosts = umcliBlogPosts(snapshot).length > posts.length ? umcliBlogPosts(snapshot) : posts;
  const top10Evidence = imageDuplicateEvidence(posts, RECENT_WINDOW);
  const top20Evidence = imageDuplicateEvidence(posts, COVER_WINDOW);
  const allEvidence = imageDuplicateEvidence(corpusPosts, corpusPosts.length);
  const top20Ratio = top20Evidence.imageCount ? top20Evidence.uniqueImages / top20Evidence.imageCount : 0;

  addCheck(checks, 8, top10Evidence.duplicateGroups === 0, 'Top 10 posts do not repeat cover images', { duplicateGroups: top10Evidence.duplicateGroups, topDuplicates: top10Evidence.topDuplicates });
  addCheck(checks, 5, top20Ratio >= 0.75, 'Top 20 cover uniqueness ratio is at least 75%', { uniqueImages: top20Evidence.uniqueImages, imageCount: top20Evidence.imageCount, uniqueRatio: Number(top20Ratio.toFixed(2)) });
  addCheck(checks, 4, allEvidence.maxReuse <= 3, 'No cover image is reused more than 3 times in the UMCLI 50-post corpus', { corpusPosts: corpusPosts.length, maxReuse: allEvidence.maxReuse });
  addCheck(checks, 3, allEvidence.duplicateGroups <= 5, 'The UMCLI 50-post corpus has at most 5 duplicate cover groups', { corpusPosts: corpusPosts.length, duplicateGroups: allEvidence.duplicateGroups });

  return buildCategory('coverDiversity', checks);
}

function scoreMetadataStructuredData(snapshot, canonicalBaseUrl) {
  const checks = [];
  const details = snapshot.details;
  const canonicalOk = details.every((detail) => detail.canonical === `${canonicalBaseUrl}${detail.path}`);
  const metaOk = details.every((detail) => detail.title.length >= 18 && detail.title.length <= 75 && detail.description.length >= 70 && detail.description.length <= 170);
  const h1Ok = details.every((detail) => detail.h1.length >= 18 && detail.h1.length <= 90);
  const jsonLdOk = details.every((detail) => detail.jsonLdErrors.length === 0 && detail.jsonLdTypes.some((type) => ['Article', 'BlogPosting', 'NewsArticle'].includes(type)));
  const datesOk = details.every((detail) => Date.parse(detail.publishedTime || '') > 0);

  addCheck(checks, 5, details.length === DETAIL_AUDIT_LIMIT && details.every((detail) => detail.ok), 'Top detail pages return HTTP 2xx', { audited: details.length });
  addCheck(checks, 4, canonicalOk, 'Top detail pages expose exact canonical URLs');
  addCheck(checks, 4, metaOk, 'Top detail pages expose readable title and meta description lengths');
  addCheck(checks, 4, jsonLdOk, 'Top detail pages expose parseable Article/BlogPosting JSON-LD');
  addCheck(checks, 2, h1Ok, 'Top detail pages expose one usable H1-level article title');
  addCheck(checks, 1, datesOk, 'Top detail pages expose article:published_time');

  return buildCategory('metadataStructuredData', checks);
}

function scoreEditorialGovernance(snapshot) {
  const checks = [];
  const posts = snapshot.posts;
  const slugs = posts.map(postSlug).filter(Boolean);
  const categories = unique(posts.map((post) => String(post?.categoria || '').trim()).filter(Boolean));
  const dates = posts.map(postDate);
  const sortedDesc = dates.every((date, index) => index === 0 || dates[index - 1] >= date);
  const uniqueSlugs = unique(slugs);
  const geoBlog = snapshot.geoBlog.json?.blog || {};

  addCheck(checks, 3, String(geoBlog.role || '').length >= 80 && (geoBlog.recommendedTopics || []).length >= 5, 'GEO blog-index defines editorial role and recommended topics');
  addCheck(checks, 3, categories.length >= 3, 'Recent blog corpus covers at least 3 editorial categories', { categories });
  addCheck(checks, 2, sortedDesc, 'Blog API posts are sorted newest-first by fecha_publicacion');
  addCheck(checks, 2, uniqueSlugs.length === slugs.length && slugs.every((slug) => !/^test-|bienvenidos-al-blog/i.test(slug)), 'Blog API slugs are unique and avoid legacy/test slugs');

  return buildCategory('editorialGovernance', checks);
}

function scoreBlogSnapshot(snapshot, options = {}) {
  const canonicalBaseUrl = normalizeBase(options.canonicalBaseUrl || DEFAULT_CANONICAL_BASE_URL);
  const categories = {
    freshnessAlignment: scoreFreshnessAlignment(snapshot),
    coverIntegrity: scoreCoverIntegrity(snapshot),
    coverDiversity: scoreCoverDiversity(snapshot),
    metadataStructuredData: scoreMetadataStructuredData(snapshot, canonicalBaseUrl),
    editorialGovernance: scoreEditorialGovernance(snapshot),
  };
  const score = Number(Object.values(categories).reduce((sum, category) => sum + category.score, 0).toFixed(2));
  const failedChecks = Object.entries(categories)
    .flatMap(([category, result]) => result.checks
      .filter((check) => !check.ok)
      .map((check) => ({
        category,
        points: check.points,
        label: check.label,
        details: Object.fromEntries(Object.entries(check).filter(([key]) => !['label', 'points', 'earned', 'ok'].includes(key))),
      })))
    .sort((a, b) => b.points - a.points);
  const corpusPosts = umcliBlogPosts(snapshot).length > snapshot.posts.length ? umcliBlogPosts(snapshot) : snapshot.posts;
  const diversity = imageDuplicateEvidence(corpusPosts, corpusPosts.length);
  const top20Diversity = imageDuplicateEvidence(snapshot.posts, COVER_WINDOW);

  return {
    score,
    grade: score >= 95 ? 'A' : score >= 88 ? 'B' : score >= 78 ? 'C' : score >= 65 ? 'D' : 'F',
    weights: BLOG_SCORE_WEIGHTS,
    categories,
    failedChecks,
    stats: {
      visiblePosts: snapshot.posts.length,
      auditedDetails: snapshot.details.length,
      top20UniqueImages: top20Diversity.uniqueImages,
      top20Images: top20Diversity.imageCount,
      duplicateImageGroups: diversity.duplicateGroups,
      duplicatePosts: diversity.duplicatePosts,
      maxImageReuse: diversity.maxReuse,
    },
    diversity,
  };
}

async function runBlogEditorialScore(options = {}) {
  const baseUrl = normalizeBase(options.baseUrl || DEFAULT_BASE_URL);
  const canonicalBaseUrl = normalizeBase(options.canonicalBaseUrl || DEFAULT_CANONICAL_BASE_URL);
  const snapshot = await buildBlogSnapshot(baseUrl);
  const result = scoreBlogSnapshot(snapshot, { canonicalBaseUrl });

  return {
    baseUrl,
    canonicalBaseUrl,
    methodology: {
      adaptedFrom: BLOG_SCORE_REFERENCE,
      note: 'Local UMSA implementation. No external runtime dependency.',
    },
    ...result,
  };
}

async function main() {
  const baseUrl = normalizeBase(argValue('--base-url', DEFAULT_BASE_URL));
  const canonicalBaseUrl = normalizeBase(argValue('--canonical-base-url', DEFAULT_CANONICAL_BASE_URL));
  const minScoreRaw = argValue('--min-score', '');
  const minScore = minScoreRaw === '' ? null : Number(minScoreRaw);
  const strictDiversity = hasFlag('--strict-diversity');
  const jsonOnly = hasFlag('--json');
  const result = await runBlogEditorialScore({ baseUrl, canonicalBaseUrl });
  const diversityFailed = result.categories.coverDiversity.checks.some((check) => !check.ok);
  const ok = (minScore === null || result.score >= minScore) && (!strictDiversity || !diversityFailed);
  const payload = {
    ok,
    minScore,
    strictDiversity,
    ...result,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }

  if (!ok) process.exit(1);
}

export {
  BLOG_SCORE_REFERENCE,
  BLOG_SCORE_WEIGHTS,
  buildBlogSnapshot,
  imageDuplicateEvidence,
  runBlogEditorialScore,
  scoreBlogSnapshot,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
}
