import type { APIRoute } from 'astro';
import { getServicios, getCasosExito, getBlogPosts } from '../../lib/directus';

export const GET: APIRoute = async ({ request }) => {
  try {
    const [servicios, casos_de_exito, blog_posts] = await Promise.all([
      getServicios(50),
      getCasosExito(50),
      getBlogPosts(50)
    ]);

    const payload = {
      timestamp: Date.now(),
      servicios,
      casos_de_exito,
      blog_posts,
      estadisticas: {
        totalServicios: servicios.length,
        totalCasosExito: casos_de_exito.length,
        totalBlogPosts: blog_posts.length,
        ultimaActualizacion: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify({ success: true, data: payload }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // Cache en CDN/navegador por 60s, stale-while-revalidate por 5 minutos
        'cache-control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'unknown_error' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      }
    );
  }
};

