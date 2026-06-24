import type { APIRoute } from 'astro';
import {
  addVisibleBlogStatusFilter,
  normalizeBlogStatus,
  normalizePublicationDate,
} from '../../utils/blogPublishing';
import { checkBasicAuth } from '../../utils/serverAuth';

const API_USER = process.env['BLOG_API_USER'] ?? import.meta.env.BLOG_API_USER;
const API_PASS = process.env['BLOG_API_PASS'] ?? import.meta.env.BLOG_API_PASS;
const DIRECTUS_URL = process.env['DIRECTUS_INTERNAL_URL'] ?? import.meta.env.DIRECTUS_INTERNAL_URL ?? 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env['DIRECTUS_ADMIN_TOKEN'] ?? import.meta.env.DIRECTUS_ADMIN_TOKEN ?? '';

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
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
  } = body as Record<string, unknown>;

  if (!titulo || !resumen || !contenido) {
    return new Response(
      JSON.stringify({ error: 'Campos requeridos: titulo, resumen, contenido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const slug = (slugInput as string) || slugify(titulo as string);
  const publishedAt = normalizePublicationDate(fecha_publicacion);
  const status = normalizeBlogStatus(statusInput, publishedAt);

  const post = {
    status,
    slug,
    titulo,
    resumen,
    contenido,
    categoria: (categoria as string) || 'noticias',
    imagen_portada: (imagen_portada as string) || null,
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

  const res = await fetch(`${DIRECTUS_URL}/items/blog_posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(post),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'No se pudo completar la publicacion', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const created = await res.json();
  return new Response(JSON.stringify({ ok: true, slug, id: created.data?.id, status }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async () => {
  const headers: HeadersInit = DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {};
  const params = addVisibleBlogStatusFilter(new URLSearchParams());
  params.set('sort', '-fecha_publicacion');
  params.set('limit', '20');
  params.set('fields', 'slug,titulo,fecha_publicacion,categoria,status');
  const res = await fetch(
    `${DIRECTUS_URL}/items/blog_posts?${params.toString()}`,
    { headers }
  );
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
