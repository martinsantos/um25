import type { APIRoute } from 'astro';

/**
 * Health Check Endpoint
 * GET /api/monitoring/health
 *
 * Returns overall system health and uptime information
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Get current timestamp
    const now = new Date();
    const startTime = new Date(process.uptime ? now.getTime() - (process.uptime() * 1000) : now);

    // Format uptime
    const uptimeSeconds = process.uptime?.() || 0;
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Mock services status (will be enhanced with actual checks)
    const services = {
      astro: 'online',
      directus: 'online',
      postgres: 'online',
      redis: 'online',
      nginx: 'online'
    };

    // Calculate uptime percentage (mock)
    const uptimePercentage = 99.5;

    return new Response(
      JSON.stringify({
        success: true,
        status: 'healthy',
        timestamp: now.toISOString(),
        uptime_seconds: uptimeSeconds,
        uptime_formatted: uptimeFormatted,
        uptime_percentage: uptimePercentage,
        services,
        checks: {
          memory: 'ok',
          cpu: 'ok',
          disk: 'ok'
        }
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
        status: 'unhealthy'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
