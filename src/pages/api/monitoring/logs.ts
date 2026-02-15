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

    // Mock logs data (in production, fetch from actual log files or database)
    const mockLogs = [
      {
        id: 1,
        datetime: new Date().toLocaleString('es-ES'),
        type: 'success',
        message: 'Sistema de monitoreo inicializado correctamente',
        source: 'system',
        read: true
      },
      {
        id: 2,
        datetime: new Date(Date.now() - 60000).toLocaleString('es-ES'),
        type: 'info',
        message: 'Health check de servicios completado',
        source: 'monitoring',
        read: true
      },
      {
        id: 3,
        datetime: new Date(Date.now() - 120000).toLocaleString('es-ES'),
        type: 'info',
        message: 'Directus API respondiendo correctamente',
        source: 'directus',
        read: false
      },
      {
        id: 4,
        datetime: new Date(Date.now() - 180000).toLocaleString('es-ES'),
        type: 'success',
        message: 'PostgreSQL database connection verified',
        source: 'database',
        read: false
      },
      {
        id: 5,
        datetime: new Date(Date.now() - 240000).toLocaleString('es-ES'),
        type: 'warning',
        message: 'Redis cache connection took 150ms',
        source: 'cache',
        read: true
      },
      {
        id: 6,
        datetime: new Date(Date.now() - 300000).toLocaleString('es-ES'),
        type: 'info',
        message: 'Nginx reverse proxy status: OK',
        source: 'nginx',
        read: true
      }
    ];

    // Filter by type
    let filteredLogs = mockLogs;
    if (type && type !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    filteredLogs = filteredLogs.slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredLogs,
        total: mockLogs.length,
        filtered: filteredLogs.length,
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
