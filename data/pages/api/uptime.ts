import type { APIRoute } from 'astro';

/**
 * Calculate uptime from server start
 * Returns uptime in format: Xd Xh Xm Xs
 */
function calculateUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export const GET: APIRoute = async () => {
  try {
    // Get server uptime from process
    const uptimeSeconds = process.uptime();
    const formattedUptime = calculateUptime(uptimeSeconds);

    return new Response(JSON.stringify({
      success: true,
      uptime: formattedUptime,
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      processInfo: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      }
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-API-Version': '1.0.0'
      }
    });
  } catch (error) {
    console.error('[Uptime API] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to retrieve uptime',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
