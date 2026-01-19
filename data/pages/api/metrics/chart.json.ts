/**
 * API Endpoint: /api/metrics/chart.json
 *
 * Purpose: Return historical metrics for charting (Chart.js)
 * Query params:
 *   - hours: Number of hours to retrieve (default: 24)
 *   - type: 'memory' | 'services' | 'health' (default: 'memory')
 *
 * Returns: { labels, datasets }  format compatible with Chart.js
 */

import type { APIRoute } from 'astro';
import metricsStore from '@/lib/metrics-store';

export const GET: APIRoute = async ({ url }) => {
  try {
    const hours = parseInt(url.searchParams.get('hours') || '24');
    const type = url.searchParams.get('type') || 'memory';

    if (![1, 6, 24, 168, 720].includes(hours)) {
      return new Response(
        JSON.stringify({ error: 'Invalid hours parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trend = metricsStore.getMemoryTrend(hours);

    let response: any = {
      labels: trend.map(m => m.time),
      datasets: [],
      summary: {
        current: trend.length > 0 ? trend[trend.length - 1] : null,
        min: Math.min(...trend.map(m => m.memory_percent)),
        max: Math.max(...trend.map(m => m.memory_percent)),
        avg: Math.round(
          trend.reduce((sum, m) => sum + m.memory_percent, 0) / (trend.length || 1)
        )
      }
    };

    // Memory percent dataset
    if (type === 'memory' || type === 'all') {
      response.datasets.push({
        label: 'Memory Usage %',
        data: trend.map(m => m.memory_percent),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 6
      });

      // Warning threshold
      response.datasets.push({
        label: 'Warning (70%)',
        data: Array(trend.length).fill(70),
        borderColor: 'rgba(251, 191, 36, 0.5)',
        borderDash: [5, 5],
        borderWidth: 1,
        fill: false,
        pointRadius: 0
      });

      // Critical threshold
      response.datasets.push({
        label: 'Critical (85%)',
        data: Array(trend.length).fill(85),
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderDash: [5, 5],
        borderWidth: 1,
        fill: false,
        pointRadius: 0
      });
    }

    // Memory GB dataset
    if (type === 'memory_gb' || type === 'all') {
      response.datasets.push({
        label: 'Memory Used (GB)',
        data: trend.map(m => parseFloat(m.memory_used_gb?.toFixed(2)) || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        yAxisID: 'y1'
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=60'
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch chart data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
