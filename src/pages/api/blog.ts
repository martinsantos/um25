import type { APIRoute } from 'astro';

const API_USER = process.env.BLOG_API_USER ?? import.meta.env.BLOG_API_USER;
const API_PASS = process.env.BLOG_API_PASS ?? import.meta.env.BLOG_API_PASS;
const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL ?? import.meta.env.DIRECTUS_INTERNAL_URL ?? 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? import.meta.env.DIRECTUS_ADMIN_TOKEN ?? '1d70b2841dd6365c676ab42e879c5fdfc044ec1adfc146552a99b2d7e23baa5e';

function checkAuth(request: Request): boolean {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  const decoded = atob(auth.slice(6));
  const [user, ...rest] = decoded.split(':');
  const pass = rest.join(':');
  return user === API_USER && pass === API_PASS;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
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
    slug: slugInput,
  } = body as Record<string, unknown>;

  if (!titulo || !resumen || !contenido) {
    return new Response(
      JSON.stringify({ error: 'Campos requeridos: titulo, resumen, contenido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const slug = (slugInput as string) || slugify(titulo as string);

  const post = {
    status: 'published',
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
    fecha_publicacion:
      (fecha_publicacion as string) || new Date().toISOString().split('T')[0],
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
    return new Response(JSON.stringify({ error: 'Directus error', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const created = await res.json();
  return new Response(JSON.stringify({ ok: true, slug, id: created.data?.id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async () => {
  const res = await fetch(
    `${DIRECTUS_URL}/items/blog_posts?filter[status][_eq]=published&sort=-fecha_publicacion&limit=20&fields=slug,titulo,fecha_publicacion,categoria`,
    { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
  );
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
