import type { APIRoute } from 'astro';
import skillContent from '../../assets/estilo/SKILL.md?raw';

export const GET: APIRoute = async () => {
  return new Response(skillContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': 'inline; filename="SKILL.md"',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });
};
