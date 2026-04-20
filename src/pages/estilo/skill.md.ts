import type { APIRoute } from 'astro';
import { authenticate } from '../../lib/estilo-auth';
import skillContent from '../../assets/estilo/SKILL.md?raw';

export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticate(request);

  if (!auth.ok) {
    const isService = !request.headers.get('Accept')?.includes('text/html');
    return new Response(
      isService
        ? JSON.stringify({ error: 'Unauthorized', hint: 'Authorization: Bearer <directus_token>' })
        : '401 Unauthorized',
      {
        status: 401,
        headers: {
          'Content-Type': isService ? 'application/json' : 'text/plain',
        },
      }
    );
  }

  return new Response(skillContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline; filename="SKILL.md"',
    },
  });
};
