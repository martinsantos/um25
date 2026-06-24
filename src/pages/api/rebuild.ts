// /api/rebuild.ts - Webhook endpoint para Directus
// UM CLI 1.2.0 - Sistema de actualización automática
import type { APIRoute } from 'astro';
import { execSync } from 'child_process';
import fs from 'fs';
import { requestHasSecret, secretMatches } from '../../utils/serverAuth';

// Token de seguridad para validar webhook
const LEGACY_DEFAULT_WEBHOOK_SECRET = ['um', 'cli', '2024', 'secure', 'webhook'].join('-');
const REBUILD_SCRIPT_PATH = '/root/fumbling-field/scripts/auto-rebuild.sh';

function getWebhookSecret(): string {
  return process.env['DIRECTUS_WEBHOOK_SECRET'] ?? import.meta.env.DIRECTUS_WEBHOOK_SECRET ?? '';
}

function isWebhookSecretConfigured(secret: string): boolean {
  return Boolean(secret) && secret !== LEGACY_DEFAULT_WEBHOOK_SECRET;
}

function redactWebhookPayload(payload: Record<string, unknown>): string {
  const redacted = { ...payload };
  if ('token' in redacted) redacted.token = '[redacted]';
  return JSON.stringify(redacted).substring(0, 200);
}

// Log helper
const logWebhook = (message: string, level: 'info' | 'error' | 'success' = 'info') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [WEBHOOK-${level.toUpperCase()}] ${message}`;
  console.warn(logMessage);
  
  // También log a archivo si estamos en producción
  if (process.env.NODE_ENV === 'production') {
    try {
      fs.appendFileSync('/root/fumbling-field/webhook.log', logMessage + '\n');
    } catch (err) {
      console.error('Error writing to webhook log:', err);
    }
  }
};

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  try {
    logWebhook('🔄 Webhook received from Directus');
    
    // Verificar Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      logWebhook('❌ Invalid Content-Type received', 'error');
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Content-Type'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Leer payload
    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      logWebhook('❌ Invalid JSON received', 'error');
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logWebhook(`📦 Webhook payload received: ${redactWebhookPayload(payload)}...`);

    const webhookSecret = getWebhookSecret();
    if (!isWebhookSecretConfigured(webhookSecret)) {
      logWebhook('🔒 Webhook secret not configured', 'error');
      return new Response(JSON.stringify({
        success: false,
        error: 'Webhook secret not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validar token de seguridad
    const authorized =
      secretMatches(payload.token, webhookSecret) ||
      requestHasSecret(request, webhookSecret, ['x-webhook-secret']);

    if (!authorized) {
      logWebhook('🔒 Unauthorized webhook attempt - invalid token', 'error');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Información del evento
    const eventType = payload.event || 'unknown';
    const collection = payload.collection || 'unknown';
    
    logWebhook(`✅ Authorized webhook for event: ${eventType} on collection: ${collection}`);
    
    // Verificar si el script de rebuild existe
    if (!fs.existsSync(REBUILD_SCRIPT_PATH)) {
      logWebhook('❌ Rebuild script not found', 'error');
      return new Response(JSON.stringify({
        success: false,
        error: 'Rebuild script not found'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ejecutar rebuild de forma asíncrona
    logWebhook('🚀 Starting automatic rebuild process...');
    
    try {
      // Ejecutar script de rebuild
      const rebuildOutput = execSync(`bash ${REBUILD_SCRIPT_PATH}`, {
        encoding: 'utf8',
        timeout: 300000, // 5 minutos timeout
        cwd: '/root/fumbling-field'
      });
      
      const duration = Date.now() - startTime;
      logWebhook(`✅ Rebuild completed successfully in ${duration}ms`, 'success');
      logWebhook(`📋 Rebuild output: ${rebuildOutput.substring(0, 500)}...`);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Rebuild completed successfully',
        duration: duration,
        event: eventType,
        collection: collection,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (rebuildError: any) {
      const duration = Date.now() - startTime;
      logWebhook(`❌ Rebuild failed after ${duration}ms: ${rebuildError.message}`, 'error');
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Rebuild failed',
        message: 'Rebuild failed. Check server logs.',
        duration: duration,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logWebhook(`💥 Webhook processing failed after ${duration}ms: ${error.message}`, 'error');
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: 'Webhook processing failed. Check server logs.',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  // Health check endpoint
  logWebhook('🏥 Health check requested');
  
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'Directus Webhook Handler',
    version: 'UM CLI 1.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
