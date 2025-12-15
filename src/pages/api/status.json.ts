/**
 * API Endpoint: /api/status.json
 *
 * Returns real-time server status including:
 * - Memory usage
 * - Service status (Astro, SGI, Directus)
 * - Nginx validation
 * - Recent logs
 *
 * Used by: /status page for monitoring dashboard
 */

import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Type definitions
interface MemoryInfo {
  total: string;
  used: string;
  available: string;
  usagePercent: number;
  swapUsed: string;
  swapTotal: string;
  status: 'ok' | 'warning' | 'critical';
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  port?: number;
  memory?: string;
  uptime?: string;
}

interface NginxPort {
  service: string;
  expected: number;
  listening: boolean;
  status: 'ok' | 'error';
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'ERROR';
  message: string;
  source: string;
}

interface StatusResponse {
  timestamp: string;
  server: {
    memory: MemoryInfo;
    services: ServiceStatus[];
    nginxPorts: NginxPort[];
  };
  recentLogs: LogEntry[];
  issues: string[];
  health: 'healthy' | 'degraded' | 'critical';
}

// Helper: Parse memory output
function parseMemory(freeOutput: string): MemoryInfo {
  const lines = freeOutput.split('\n');
  const memLine = lines[1]?.split(/\s+/);
  const swapLine = lines[2]?.split(/\s+/);

  if (!memLine || !swapLine) {
    return {
      total: 'Unknown',
      used: 'Unknown',
      available: 'Unknown',
      usagePercent: 0,
      swapUsed: 'Unknown',
      swapTotal: 'Unknown',
      status: 'error'
    };
  }

  const total = parseInt(memLine[1]) / 1024 / 1024;
  const used = parseInt(memLine[2]) / 1024 / 1024;
  const available = parseInt(memLine[6]) / 1024 / 1024;
  const usagePercent = Math.round((used / total) * 100);

  const swapUsed = parseInt(swapLine[2]) / 1024 / 1024;
  const swapTotal = parseInt(swapLine[1]) / 1024 / 1024;

  let status: 'ok' | 'warning' | 'critical' = 'ok';
  if (usagePercent > 85) status = 'critical';
  else if (usagePercent > 70) status = 'warning';

  return {
    total: `${total.toFixed(1)}GB`,
    used: `${used.toFixed(1)}GB`,
    available: `${available.toFixed(1)}GB`,
    usagePercent,
    swapUsed: `${swapUsed.toFixed(1)}GB`,
    swapTotal: `${swapTotal.toFixed(1)}GB`,
    status
  };
}

// Helper: Get PM2 services status
async function getPM2Status(): Promise<ServiceStatus[]> {
  try {
    const { stdout } = await execAsync('pm2 list --format json', {
      timeout: 5000,
      maxBuffer: 1024 * 1024
    });

    const processes = JSON.parse(stdout);
    return processes.map((proc: any) => ({
      name: proc.name,
      status: proc.pm2_env?.status === 'online' ? 'online' : 'offline',
      memory: proc.monit?.memory ? `${(proc.monit.memory / 1024 / 1024).toFixed(1)}MB` : undefined,
      uptime: proc.pm2_env?.created_at
        ? `${Math.round((Date.now() - proc.pm2_env.created_at) / 1000 / 60)} min`
        : undefined
    }));
  } catch (error) {
    return [
      { name: 'astro-ultimamilla', status: 'error' },
      { name: 'sgi', status: 'error' }
    ];
  }
}

// Helper: Check Nginx ports
async function checkNginxPorts(): Promise<NginxPort[]> {
  const ports = [
    { service: 'Astro (ultimamilla.com.ar)', expected: 4321 },
    { service: 'SGI (sgi.ultimamilla.com.ar)', expected: 3000 },
    { service: 'Directus (admin.ultimamilla.com.ar)', expected: 8055 }
  ];

  const results: NginxPort[] = [];

  for (const port of ports) {
    try {
      const { stdout } = await execAsync(`lsof -i :${port.expected} 2>/dev/null || ss -tlnp | grep :${port.expected}`, {
        timeout: 2000
      });

      results.push({
        service: port.service,
        expected: port.expected,
        listening: !!stdout,
        status: !!stdout ? 'ok' : 'error'
      });
    } catch {
      results.push({
        service: port.service,
        expected: port.expected,
        listening: false,
        status: 'error'
      });
    }
  }

  return results;
}

// Helper: Read recent logs
async function getRecentLogs(): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];

  // Memory alert logs
  try {
    const { stdout } = await execAsync('tail -10 /var/log/memory-alert.log 2>/dev/null || echo ""', {
      timeout: 2000
    });

    if (stdout) {
      stdout
        .split('\n')
        .filter((line) => line.trim())
        .forEach((line) => {
          const match = line.match(/\[(.*?)\] \[(.*?)\] (.*)/);
          if (match) {
            logs.push({
              timestamp: match[1],
              level: (match[2] as any) || 'INFO',
              message: match[3],
              source: 'memory-monitor'
            });
          }
        });
    }
  } catch {
    // Ignore errors
  }

  // Backup logs
  try {
    const { stdout } = await execAsync('tail -5 /var/log/ecosystem-backup.log 2>/dev/null || echo ""', {
      timeout: 2000
    });

    if (stdout) {
      stdout
        .split('\n')
        .filter((line) => line.trim())
        .forEach((line) => {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: line,
            source: 'backup'
          });
        });
    }
  } catch {
    // Ignore errors
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
}

// Main API Handler
export const GET: APIRoute = async ({ request }) => {
  try {
    // Get memory info
    const { stdout: freeOutput } = await execAsync('free -h', { timeout: 2000 });
    const memory = parseMemory(freeOutput);

    // Get services status
    const services = await getPM2Status();

    // Check Nginx ports
    const nginxPorts = await checkNginxPorts();

    // Get recent logs
    const recentLogs = await getRecentLogs();

    // Detect issues
    const issues: string[] = [];

    if (memory.status === 'critical') {
      issues.push(`⚠️  Memory CRITICAL: ${memory.usagePercent}% in use`);
    } else if (memory.status === 'warning') {
      issues.push(`⚡ Memory WARNING: ${memory.usagePercent}% in use`);
    }

    for (const service of services) {
      if (service.status === 'offline') {
        issues.push(`🔴 Service offline: ${service.name}`);
      }
    }

    for (const port of nginxPorts) {
      if (!port.listening) {
        issues.push(`⚠️  Port ${port.expected} not listening: ${port.service}`);
      }
    }

    // Determine overall health
    let health: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (issues.length > 0) health = 'degraded';
    if (memory.status === 'critical' || services.some((s) => s.status === 'offline')) health = 'critical';

    const response: StatusResponse = {
      timestamp: new Date().toISOString(),
      server: {
        memory,
        services,
        nginxPorts
      },
      recentLogs,
      issues,
      health
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=5'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch status',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
