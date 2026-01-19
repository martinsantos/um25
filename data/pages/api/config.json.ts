/**
 * API Endpoint: /api/config.json
 *
 * Purpose: Get and update system configuration
 *
 * GET: Return current configuration
 * POST: Update configuration (requires basic validation)
 */

import type { APIRoute } from 'astro';
import metricsStore from '@/lib/metrics-store';

// Validation helper
function validateConfig(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if ('memory_warning_percent' in data) {
    if (typeof data.memory_warning_percent !== 'number' || data.memory_warning_percent < 0 || data.memory_warning_percent > 100) {
      errors.push('memory_warning_percent must be 0-100');
    }
  }

  if ('memory_critical_percent' in data) {
    if (typeof data.memory_critical_percent !== 'number' || data.memory_critical_percent < 0 || data.memory_critical_percent > 100) {
      errors.push('memory_critical_percent must be 0-100');
    }
  }

  if ('check_interval_minutes' in data) {
    if (typeof data.check_interval_minutes !== 'number' || data.check_interval_minutes < 1 || data.check_interval_minutes > 60) {
      errors.push('check_interval_minutes must be 1-60');
    }
  }

  if ('alert_consolidate_hours' in data) {
    if (typeof data.alert_consolidate_hours !== 'number' || data.alert_consolidate_hours < 1 || data.alert_consolidate_hours > 24) {
      errors.push('alert_consolidate_hours must be 1-24');
    }
  }

  if ('slack_webhook_url' in data) {
    if (typeof data.slack_webhook_url !== 'string') {
      errors.push('slack_webhook_url must be a string');
    }
  }

  if ('discord_webhook_url' in data) {
    if (typeof data.discord_webhook_url !== 'string') {
      errors.push('discord_webhook_url must be a string');
    }
  }

  if ('email_recipients' in data) {
    if (typeof data.email_recipients !== 'string') {
      errors.push('email_recipients must be a string');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export const GET: APIRoute = async () => {
  try {
    const config = metricsStore.getConfig();

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=0'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch config',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Only allow POST from localhost or same origin (basic security)
    const origin = request.headers.get('origin') || request.headers.get('referer');
    if (origin && !origin.includes('ultimamilla.com.ar') && !origin.includes('localhost')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();

    // Validate
    const validation = validateConfig(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update config
    metricsStore.updateConfig(data);

    // Return updated config
    const config = metricsStore.getConfig();
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update config',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
