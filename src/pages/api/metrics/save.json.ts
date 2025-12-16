/**
 * API Endpoint: /api/metrics/save.json
 *
 * Purpose: Save metric snapshot to historical storage
 * Called by: JavaScript on status page (every minute)
 * Returns: { success: true, stored: true }
 */

import type { APIRoute } from 'astro';
import metricsStore from '@/lib/metrics-store';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.memory_percent || typeof data.memory_percent !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid memory_percent' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store the metric
    metricsStore.storeMetric({
      timestamp: Date.now(),
      memory_total_gb: data.memory_total_gb || 0,
      memory_used_gb: data.memory_used_gb || 0,
      memory_percent: data.memory_percent,
      services_online: data.services_online || 0,
      services_total: data.services_total || 2,
      health_status: data.health_status || 'unknown',
      api_response_time_ms: data.api_response_time_ms
    });

    // Cleanup old metrics if needed (every hour)
    if (Math.random() < 0.01) { // ~1% chance to trigger cleanup
      metricsStore.cleanupOldMetrics();
    }

    return new Response(
      JSON.stringify({ success: true, stored: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error saving metric:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to save metric',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// GET: For health check / validation
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'Use POST to save metrics',
      example: {
        method: 'POST',
        body: {
          memory_percent: 85,
          memory_total_gb: 3.6,
          memory_used_gb: 3.0,
          services_online: 2,
          services_total: 2,
          health_status: 'critical'
        }
      }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
