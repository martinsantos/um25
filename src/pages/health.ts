// src/pages/health.ts
// Endpoint de health check para monitoreo y zero-downtime deployment

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  // Health check básico
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'astro-app',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3000',
  };

  // Verificaciones adicionales en producción
  if (process.env.NODE_ENV === 'production') {
    try {
      // Verificar conexión a Directus
      const directusUrl = process.env.PUBLIC_DIRECTUS_URL || 'http://directus-app:8055';
      const directusHealthUrl = `${directusUrl}/server/health`;
      
      const directusResponse = await fetch(directusHealthUrl, {
        method: 'GET',
        timeout: 5000, // 5 segundos timeout
      });
      
      healthData.directus = {
        status: directusResponse.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
      };
      
    } catch (error) {
      healthData.directus = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Verificar memoria
  const memUsage = process.memoryUsage();
  healthData.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
  };

  // Calcular tiempo total de respuesta
  healthData.responseTime = `${Date.now() - startTime}ms`;

  // Determinar estado general
  const isHealthy = healthData.directus?.status !== 'unhealthy';
  const statusCode = isHealthy ? 200 : 503;
  
  if (!isHealthy) {
    healthData.status = 'unhealthy';
  }

  // Headers para health check
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Health-Check': 'astro-app',
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: statusCode,
    headers,
  });
};
