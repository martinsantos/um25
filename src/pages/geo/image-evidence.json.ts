import type { APIRoute } from 'astro';
import { buildGeoResourceAsync } from '../../data/geoResources';

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify(await buildGeoResourceAsync('image-evidence'), null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch (error) {
    console.error('[GEO-IMAGE-EVIDENCE] Directus unavailable:', error);
    return new Response(JSON.stringify({ error: 'Directus unavailable for image evidence' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
};
