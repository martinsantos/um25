import type { APIRoute } from 'astro';
import { getGeoCases } from '../../data/geoKnowledge';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ cases: getGeoCases() }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
};
