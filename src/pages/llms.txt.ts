import type { APIRoute } from 'astro';
import { generateLlmsTxt } from '../data/geoKnowledge';

export const GET: APIRoute = async () => {
  return new Response(generateLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
};
