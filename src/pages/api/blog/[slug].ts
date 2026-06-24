import type { APIRoute } from 'astro';
import { normalizeBlogStatus, normalizePublicationDate } from '../../../utils/blogPublishing';
import { checkBasicAuth } from '../../../utils/serverAuth';

const API_USER = process.env['BLOG_API_USER'] ?? import.meta.env.BLOG_API_USER;
const API_PASS = process.env['BLOG_API_PASS'] ?? import.meta.env.BLOG_API_PASS;
const DIRECTUS_URL = process.env['DIRECTUS_INTERNAL_URL'] ?? import.meta.env.DIRECTUS_INTERNAL_URL ?? 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env['DIRECTUS_ADMIN_TOKEN'] ?? import.meta.env.DIRECTUS_ADMIN_TOKEN ?? '';

type ExistingPost = {
  id: number;
  fecha_publicacion?: string;
};

async function findPost(slug: string): Promise<ExistingPost | null> {
  const res = await fetch(
    `${DIRECTUS_URL}/items/blog_posts?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id,fecha_publicacion&limit=1`,
    { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
  );
  const data = await res.json();
  return data.data?.[0] ?? null;
}

export const PUT: APIRoute = async ({ request, params }) => {
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

  const slug = params['slug']!;
  const existingPost = await findPost(slug);

  if (!existingPost) {
    return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
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

  if (!body['titulo'] || !body['resumen'] || !body['contenido']) {
    return new Response(
      JSON.stringify({ error: 'Campos requeridos: titulo, resumen, contenido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const publishedAt = body['fecha_publicacion']
    ? normalizePublicationDate(body['fecha_publicacion'])
    : existingPost.fecha_publicacion || normalizePublicationDate(undefined);

  const update: Record<string, unknown> = {
    status: normalizeBlogStatus(body['status'], publishedAt),
    titulo: body['titulo'],
    resumen: body['resumen'],
    contenido: body['contenido'],
    categoria: (body['categoria'] as string) || 'noticias',
    imagen_portada: (body['imagen_portada'] as string) ?? null,
    tags: Array.isArray(body['tags'])
      ? body['tags']
      : body['tags']
        ? String(body['tags']).split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
    tiempo_lectura: Number(body['tiempo_lectura']) || 3,
    meta_title: (body['meta_title'] as string) ?? null,
    meta_description: (body['meta_description'] as string) ?? null,
  };
  if (body['fecha_publicacion']) update['fecha_publicacion'] = publishedAt;

  const res = await fetch(`${DIRECTUS_URL}/items/blog_posts/${existingPost.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'No se pudo completar la actualizacion', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, slug, action: 'updated', status: update['status'] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
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

  const slug = params['slug']!;
  const existingPost = await findPost(slug);

  if (!existingPost) {
    return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Hard-delete from Directus so the slug can be reused
  const res = await fetch(`${DIRECTUS_URL}/items/blog_posts/${existingPost.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'No se pudo completar la eliminacion', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, slug, action: 'deleted' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
