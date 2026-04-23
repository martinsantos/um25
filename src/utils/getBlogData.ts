import { createDirectus, rest, readItems } from '@directus/sdk';
import type { EntradaBlog } from '../lib/directus';
import { MOCK_POSTS } from '../data/blog-mock';

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

function getClient() {
  return createDirectus(DIRECTUS_URL).with(rest());
}

export async function fetchBlogListing(
  page = 1,
  limit = 10,
  categoria?: string
): Promise<{ posts: EntradaBlog[]; total: number }> {
  const filter: Record<string, unknown> = { status: { _eq: 'published' } };
  if (categoria) filter.categoria = { _eq: categoria };

  try {
    const client = getClient();
    const posts = await client.request(
      readItems('blog_posts' as any, {
        filter,
        sort: ['-fecha_publicacion'],
        limit,
        offset: (page - 1) * limit,
        fields: ['id', 'slug', 'titulo', 'resumen', 'imagen_portada', 'categoria', 'fecha_publicacion', 'tiempo_lectura']
      })
    );

    const catParam = categoria ? `&filter[categoria][_eq]=${categoria}` : '';
    const countRes = await fetch(
      `${DIRECTUS_URL}/items/blog_posts?aggregate[count]=id&filter[status][_eq]=published${catParam}`,
      { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
    );
    const countData = await countRes.json();
    const total = Number(countData.data?.[0]?.count?.id || 0);

    const result = (posts || []) as EntradaBlog[];
    if (result.length > 0) return { posts: result, total };
    throw new Error('empty');
  } catch {
    const filtered = categoria ? MOCK_POSTS.filter(p => p.categoria === categoria) : MOCK_POSTS;
    return { posts: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
}

export async function fetchBlogPost(slug: string): Promise<EntradaBlog | null> {
  try {
    const client = getClient();
    const result = await client.request(
      readItems('blog_posts' as any, {
        filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
        limit: 1,
        fields: ['*']
      })
    );
    const post = ((result || []) as EntradaBlog[])[0];
    if (post) return post;
    throw new Error('not found');
  } catch {
    return MOCK_POSTS.find(p => p.slug === slug) || null;
  }
}

export async function fetchBlogBand(limit = 3): Promise<EntradaBlog[]> {
  try {
    const client = getClient();
    const result = await client.request(
      readItems('blog_posts' as any, {
        filter: { status: { _eq: 'published' } },
        sort: ['-fecha_publicacion'],
        limit,
        fields: ['id', 'slug', 'titulo', 'imagen_portada', 'categoria', 'fecha_publicacion']
      })
    );
    const posts = (result || []) as EntradaBlog[];
    if (posts.length > 0) return posts;
    throw new Error('empty');
  } catch {
    return MOCK_POSTS.slice(0, limit);
  }
}
