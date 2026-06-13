import type { APIRoute } from 'astro';
import { buildGeoResourceAsync } from '../../data/geoResources';

export const GET: APIRoute = async ({ params }) => {
  const resource = params.resource || '';
  let payload = null;

  try {
    payload = await buildGeoResourceAsync(resource);
  } catch (error) {
    console.error(`[GEO-${resource}] Content source unavailable:`, error);
    return new Response(JSON.stringify({ error: 'Recurso GEO temporalmente no disponible' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (!payload) {
    return new Response(JSON.stringify({ error: 'GEO resource not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
