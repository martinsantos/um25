import type { APIRoute } from 'astro';

const API_USER = import.meta.env.BLOG_API_USER;
const API_PASS = import.meta.env.BLOG_API_PASS;
const DIRECTUS_URL = import.meta.env.DIRECTUS_INTERNAL_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_ADMIN_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

function checkAuth(request: Request): boolean {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  const decoded = atob(auth.slice(6));
  const [user, ...rest] = decoded.split(':');
  const pass = rest.join(':');
  return user === API_USER && pass === API_PASS;
}

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="Blog API"',
      },
    });
  }

  const slug = params.slug;

  const searchRes = await fetch(
    `${DIRECTUS_URL}/items/blog_posts?filter[slug][_eq]=${encodeURIComponent(slug!)}&fields=id&limit=1`,
    { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
  );
  const searchData = await searchRes.json();
  const id = searchData.data?.[0]?.id;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await fetch(`${DIRECTUS_URL}/items/blog_posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify({ status: 'draft' }),
  });

  return new Response(JSON.stringify({ ok: true, slug, action: 'unpublished' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
