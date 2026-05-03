import type { APIRoute } from 'astro';

const API_USER = process.env['BLOG_API_USER'] ?? import.meta.env['BLOG_API_USER'];
const API_PASS = process.env['BLOG_API_PASS'] ?? import.meta.env['BLOG_API_PASS'];
const DIRECTUS_URL = process.env['DIRECTUS_INTERNAL_URL'] ?? import.meta.env['DIRECTUS_INTERNAL_URL'] ?? 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env['DIRECTUS_ADMIN_TOKEN'] ?? import.meta.env['DIRECTUS_ADMIN_TOKEN'] ?? '';

function checkAuth(request: Request): boolean {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  const decoded = atob(auth.slice(6));
  const [user, ...rest] = decoded.split(':');
  const pass = rest.join(':');
  return user === API_USER && pass === API_PASS;
}

async function findPostId(slug: string): Promise<number | null> {
  const res = await fetch(
    `${DIRECTUS_URL}/items/blog_posts?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id&limit=1`,
    { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
  );
  const data = await res.json();
  return data.data?.[0]?.id ?? null;
}

export const PUT: APIRoute = async ({ request, params }) => {
  if (!DIRECTUS_TOKEN) {
    return new Response(JSON.stringify({ error: 'Directus token not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="Blog API"',
      },
    });
  }

  const slug = params['slug']!;
  const id = await findPostId(slug);

  if (!id) {
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

  const update: Record<string, unknown> = {
    status: 'published',
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
  if (body['fecha_publicacion']) update.fecha_publicacion = body['fecha_publicacion'];

  const res = await fetch(`${DIRECTUS_URL}/items/blog_posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'Directus error', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, slug, action: 'updated' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!DIRECTUS_TOKEN) {
    return new Response(JSON.stringify({ error: 'Directus token not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="Blog API"',
      },
    });
  }

  const slug = params['slug']!;
  const id = await findPostId(slug);

  if (!id) {
    return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Hard-delete from Directus so the slug can be reused
  const res = await fetch(`${DIRECTUS_URL}/items/blog_posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'Directus error', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, slug, action: 'deleted' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
