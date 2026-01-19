import type { APIRoute } from 'astro';

/**
 * DEPRECATED: Use /api/umcli-v2.json instead
 * This endpoint is kept for backward compatibility and redirects to the new API
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Redirect to the working umcli-v2.json endpoint
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Forward all query parameters to umcli-v2.json
    const forwardUrl = new URL('/api/umcli-v2.json', url.origin);
    for (const [key, value] of searchParams) {
      forwardUrl.searchParams.append(key, value);
    }

    const response = await fetch(forwardUrl.toString());
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'unknown_error' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      }
    );
  }
};

