#!/usr/bin/env node

import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import {
  BLOG_COVER_DIVERSITY_LIMIT,
  diversifyBlogPostCovers,
  normalizeBlogCoverUrl,
} from '../src/utils/blogCoverDiversity.js';

const DIRECTUS_URL = (
  process.env.DIRECTUS_INTERNAL_URL ||
  process.env.PUBLIC_DIRECTUS_URL ||
  'http://localhost:8055'
).replace(/\/$/, '');
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN || '';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
  };
}

async function fetchBlogPosts(limit) {
  const params = new URLSearchParams();
  params.set('sort', '-fecha_publicacion');
  params.set('limit', String(limit));
  params.set('fields', 'id,slug,titulo,categoria,imagen_portada,fecha_publicacion,status');
  params.set('filter[status][_neq]', 'draft');

  const res = await fetch(`${DIRECTUS_URL}/items/blog_posts?${params.toString()}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Directus returned ${res.status}: ${body.slice(0, 280)}`);
  }

  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
}

async function patchBlogPost(id, imagen_portada) {
  const res = await fetch(`${DIRECTUS_URL}/items/blog_posts/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ imagen_portada }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PATCH blog_posts/${id} returned ${res.status}: ${body.slice(0, 280)}`);
  }
}

async function run() {
  if (!DIRECTUS_TOKEN) {
    throw new Error('Missing DIRECTUS_ADMIN_TOKEN or DIRECTUS_TOKEN');
  }

  const apply = hasFlag('--apply');
  const limit = Number(argValue('--limit', String(BLOG_COVER_DIVERSITY_LIMIT))) || BLOG_COVER_DIVERSITY_LIMIT;
  const posts = await fetchBlogPosts(limit);
  const diversified = diversifyBlogPostCovers(posts);
  const changes = diversified
    .map((post, index) => {
      const before = normalizeBlogCoverUrl(posts[index]?.imagen_portada);
      const after = normalizeBlogCoverUrl(post.imagen_portada);
      return {
        id: post.id,
        slug: post.slug,
        before,
        after,
      };
    })
    .filter((change) => change.id && change.after && change.before !== change.after);

  const result = {
    mode: apply ? 'apply' : 'dry-run',
    directusUrl: DIRECTUS_URL,
    checked: posts.length,
    changes: changes.length,
    changedPosts: changes,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!apply) return;

  for (const change of changes) {
    await patchBlogPost(change.id, change.after);
  }

  console.log(JSON.stringify({ ok: true, applied: changes.length }, null, 2));
}

export { run };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
}

