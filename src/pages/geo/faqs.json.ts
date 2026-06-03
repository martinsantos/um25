import type { APIRoute } from 'astro';
import { buildGeoResource } from '../../data/geoResources';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(buildGeoResource('faqs'), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
};
