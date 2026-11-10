import type { EntradaBlog } from '../../lib/directus';
import { blogPostImageUrl } from '../../utils/blogHelpers';
import { correctBlogEditorial } from '../../utils/blogEditorialCorrections';
import { nonCanonicalBlogSlugs } from '../../data/seoRedirects';
import type { APIRoute } from 'astro';
import {
  addVisibleBlogStatusFilter,
  hasBlogContent,
  normalizeBlogStatus,
  normalizePublicationDate,
} from '../../utils/blogPublishing';
import {
  preserveBlogPostCovers,
  normalizeBlogCoverUrl,
} from '../../utils/blogCoverDiversity.js';
import { checkBasicAuth } from '../../utils/serverAuth';
import { fetchWithTimeout, getFetchTimeoutMs } from '../../utils/fetchWithTimeout';
import { readJsonObject } from '../../utils/readJsonObject';

const API_USER = process.env['BLOG_API_USER'] ?? import.meta.env.BLOG_API_USER;
const API_PASS = process.env['BLOG_API_PASS'] ?? import.meta.env.BLOG_API_PASS;
const DIRECTUS_URL = process.env['DIRECTUS_INTERNAL_URL'] ?? import.meta.env.DIRECTUS_INTERNAL_URL ?? 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env['DIRECTUS_ADMIN_TOKEN'] ?? import.meta.env.DIRECTUS_ADMIN_TOKEN ?? '';

const DIRECTUS_TIMEOUT_MS = getFetchTimeoutMs(process.env['DIRECTUS_TIMEOUT_MS']);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const POST: APIRoute = async ({ request }) => {
  if (!DIRECTUS_TOKEN) {
    return new Response(JSON.stringify({ error: 'Servicio de publicacion no configurado' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!checkBasicAuth(request, API_USER, API_PASS)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="Blog API"',
      },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonObject(request);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!hasBlogContent(body)) {
    return new Response(
      JSON.stringify({ error: 'Campos requeridos: titulo, resumen, contenido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    titulo,
    resumen,
    contenido,
    categoria,
    imagen_portada,
    tags,
    tiempo_lectura,
    fecha_publicacion,
    meta_title,
    meta_description,
    status: statusInput,
    slug: slugInput,
  } = body;

  const slug = typeof slugInput === 'string' && slugInput ? slugInput : slugify(titulo);
  if ((slugInput != null && typeof slugInput !== 'string') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
    return new Response(JSON.stringify({ error: 'Slug inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const publishedAt = normalizePublicationDate(fecha_publicacion);
  const status = normalizeBlogStatus(statusInput, publishedAt);

  const post = {
    status,
    slug,
    titulo,
    resumen,
    contenido,
    categoria: (categoria as string) || 'noticias',
    imagen_portada: normalizeBlogCoverUrl(imagen_portada) || null,
    tags: Array.isArray(tags)
      ? tags
      : tags
        ? String(tags).split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
    tiempo_lectura: Number(tiempo_lectura) || 3,
    fecha_publicacion: publishedAt,
    meta_title: (meta_title as string) || null,
    meta_description: (meta_description as string) || null,
  };

  const res = await fetchWithTimeout(`${DIRECTUS_URL}/items/blog_posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(post),
  }, DIRECTUS_TIMEOUT_MS);

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'No se pudo completar la publicacion', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const created = await res.json();
  return new Response(JSON.stringify({ ok: true, slug, id: created.data?.id, status, imagen_portada: post.imagen_portada }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async () => {
  const headers: HeadersInit = DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {};
  const params = addVisibleBlogStatusFilter(new URLSearchParams());
  params.set('sort', '-fecha_publicacion');
  params.set('limit', '20');
  params.set('fields', 'slug,titulo,fecha_publicacion,fecha_modificacion,categoria,status,imagen_portada');
  params.set('filter[slug][_nin]', [...nonCanonicalBlogSlugs].join(','));
  try {
    const res = await fetchWithTimeout(
      `${DIRECTUS_URL}/items/blog_posts?${params.toString()}`,
      { headers },
      DIRECTUS_TIMEOUT_MS,
    );
    if (!res.ok) throw new Error('Directus blog request failed');
    const data = await res.json();
    if (!Array.isArray(data?.data)) throw new Error('Invalid Directus blog response');
    data.data = preserveBlogPostCovers(data.data).map(correctBlogEditorial).map(post => ({
      ...post, imagen_portada: normalizeBlogCoverUrl(blogPostImageUrl(post as EntradaBlog)),
    }));
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo consultar el blog' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
