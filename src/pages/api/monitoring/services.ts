import type { APIRoute } from 'astro';
import { createConnection } from 'node:net';

/**
 * Services Status Endpoint
 * GET /api/monitoring/services
 *
 * Returns the status of all monitored services
 */
type ServiceConfig = {
  name: string;
  host: string;
  port: number;
  endpoint?: string;
  critical: boolean;
  timeout: number;
  type: 'http' | 'tcp';
};

function elapsedMs(start: number): string {
  return `${Date.now() - start}ms`;
}

async function checkTcpService(service: ServiceConfig): Promise<{ status: 'online' | 'offline'; responseTime: string }> {
  const start = Date.now();

  return new Promise((resolve) => {
    const socket = createConnection({ host: service.host, port: service.port });
    const done = (status: 'online' | 'offline') => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ status, responseTime: elapsedMs(start) });
    };

    socket.setTimeout(service.timeout);
    socket.once('connect', () => done('online'));
    socket.once('timeout', () => done('offline'));
    socket.once('error', () => done('offline'));
  });
}

async function checkHttpService(service: ServiceConfig): Promise<{ status: 'online' | 'offline'; responseTime: string }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), service.timeout);

  try {
    const response = await fetch(`http://${service.host}:${service.port}${service.endpoint || '/'}`, {
      signal: controller.signal
    });
    return {
      status: response.ok || response.status < 500 ? 'online' : 'offline',
      responseTime: elapsedMs(start)
    };
  } catch {
    return { status: 'offline', responseTime: elapsedMs(start) };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const GET: APIRoute = async () => {
  try {
    // Service health check configurations
    const servicesConfig: ServiceConfig[] = [
      {
        name: 'Astro Frontend',
        host: '127.0.0.1',
        port: 4321,
        endpoint: '/',
        critical: true,
        timeout: 5000,
        type: 'http'
      },
      {
        name: 'Directus CMS',
        host: '127.0.0.1',
        port: 8055,
        endpoint: '/server/health',
        critical: true,
        timeout: 5000,
        type: 'http'
      },
      {
        name: 'PostgreSQL Database',
        host: '127.0.0.1',
        port: 5432,
        critical: true,
        timeout: 3000,
        type: 'tcp'
      },
      {
        name: 'Redis Cache',
        host: '127.0.0.1',
        port: 6379,
        critical: false,
        timeout: 3000,
        type: 'tcp'
      },
      {
        name: 'Nginx Reverse Proxy',
        host: '127.0.0.1',
        port: 80,
        endpoint: '/',
        critical: true,
        timeout: 5000,
        type: 'http'
      }
    ];

    // Check each service
    const servicesStatus = await Promise.all(
      servicesConfig.map(async (service) => {
        try {
          const check = service.type === 'tcp'
            ? await checkTcpService(service)
            : await checkHttpService(service);

          return {
            name: service.name,
            status: check.status,
            critical: service.critical,
            responseTime: check.responseTime,
            lastCheck: new Date().toISOString(),
            type: service.type
          };
        } catch (error) {
          return {
            name: service.name,
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
