import type { APIRoute } from 'astro';
import { buildGeoResource } from '../../data/geoResources';

export const GET: APIRoute = async ({ params }) => {
  const resource = params.resource || '';
  const payload = buildGeoResource(resource);

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
