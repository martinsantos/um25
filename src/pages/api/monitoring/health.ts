import type { APIRoute } from 'astro';

/**
 * Health Check Endpoint
 * GET /api/monitoring/health
 *
 * Returns overall system health and uptime information
 */
export const GET: APIRoute = async () => {
  try {
    // Get current timestamp
    const now = new Date();

    // Format uptime
    const uptimeSeconds = process.uptime?.() || 0;
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Service status is reported by /api/monitoring/services. Do not claim
    // downstream services are online from this process-only health check.
    const services = {
      astro: 'online',
      directus: 'unknown',
      postgres: 'unknown',
      redis: 'unknown',
      nginx: 'unknown'
    };

    return new Response(
      JSON.stringify({
        success: true,
        status: 'online',
        timestamp: now.toISOString(),
        uptime_seconds: uptimeSeconds,
        uptime_formatted: uptimeFormatted,
        services,
        checks: {
          process: 'ok'
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
