import type { APIRoute } from 'astro';
import designContent from '../../assets/estilo/DESIGN.md?raw';

export const GET: APIRoute = async () => {
  return new Response(designContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': 'inline; filename="DESIGN.md"',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });
};
