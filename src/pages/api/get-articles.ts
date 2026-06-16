import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const { getBlogPosts } = await import('../../lib/directus');
    const articles = await getBlogPosts(20);

    return new Response(JSON.stringify({ success: true, data: articles }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'articles_unavailable' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
};
