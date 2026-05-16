import type { APIRoute } from 'astro';
import { getAuthorityHubs } from '../../data/geoKnowledge';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ authorityHubs: getAuthorityHubs() }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
};
