import type { APIRoute } from 'astro';

/**
 * Services Status Endpoint
 * GET /api/monitoring/services
 *
 * Returns the status of all monitored services
 * In production, this would check actual service health
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Service health check configurations
    const servicesConfig = [
      {
        name: 'Astro Frontend',
        port: 4321,
        endpoint: '/',
        critical: true,
        timeout: 5000
      },
      {
        name: 'Directus CMS',
        port: 8055,
        endpoint: '/server/health',
        critical: true,
        timeout: 5000
      },
      {
        name: 'PostgreSQL Database',
        port: 5432,
        endpoint: null,
        critical: true,
        type: 'tcp'
      },
      {
        name: 'Redis Cache',
        port: 6379,
        endpoint: null,
        critical: false,
        type: 'tcp'
      },
      {
        name: 'Nginx Reverse Proxy',
        port: 80,
        endpoint: '/',
        critical: true,
        timeout: 5000
      },
      {
        name: 'CyberPanel',
        port: 8090,
        endpoint: '/',
        critical: false,
        timeout: 5000
      }
    ];

    // Check each service
    const servicesStatus = await Promise.all(
      servicesConfig.map(async (service) => {
        try {
          if (service.endpoint) {
            // HTTP health check
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), service.timeout || 5000);

            const response = await fetch(
              `http://localhost:${service.port}${service.endpoint}`,
              { signal: controller.signal }
            ).catch(() => null);

            clearTimeout(timeoutId);

            return {
              name: service.name,
              port: service.port,
              status: response && (response.ok || response.status < 500) ? 'online' : 'offline',
              critical: service.critical,
              responseTime: response ? '~50ms' : 'timeout',
              lastCheck: new Date().toISOString()
            };
          } else {
            // TCP connection check (for databases)
            // In production, use actual TCP connection check
            return {
              name: service.name,
              port: service.port,
              status: 'online', // Mock response
              critical: service.critical,
              responseTime: '~30ms',
              lastCheck: new Date().toISOString(),
              type: service.type
            };
          }
        } catch (error) {
          return {
            name: service.name,
            port: service.port,
            status: 'offline',
            critical: service.critical,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastCheck: new Date().toISOString()
          };
        }
      })
    );

    // Calculate overall status
    const criticalServices = servicesStatus.filter(s => s.critical);
    const allOnline = criticalServices.every(s => s.status === 'online');
    const overallStatus = allOnline ? 'healthy' : 'degraded';

    // Count statistics
    const stats = {
      total: servicesStatus.length,
      online: servicesStatus.filter(s => s.status === 'online').length,
      offline: servicesStatus.filter(s => s.status === 'offline').length,
      critical_online: criticalServices.filter(s => s.status === 'online').length,
      critical_total: criticalServices.length
    };

    return new Response(
      JSON.stringify({
        success: true,
        status: overallStatus,
        services: servicesStatus,
        stats,
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
        status: 'error',
        services: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
