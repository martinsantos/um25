import type { APIRoute } from 'astro';

/**
 * System Logs Endpoint
 * GET /api/monitoring/logs?limit=50&type=all&search=term
 *
 * Returns system logs with filtering and search capabilities
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type') || 'all';
    const search = url.searchParams.get('search') || '';

    // No log backend is wired here. Return an explicit empty state instead of
    // mocked operational events that can be mistaken for real health evidence.
    const filteredLogs: unknown[] = [];

    return new Response(
      JSON.stringify({
        success: true,
        configured: false,
        data: filteredLogs,
        total: 0,
        filtered: filteredLogs.length,
        filters: { limit, type, search },
        message: 'No production log source is configured for this endpoint',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
