/**
 * Metrics Store Module
 *
 * Purpose: Store and retrieve historical metrics for trending and analysis
 * Storage: JSON files at /var/lib/ultimamilla/metrics/
 *
 * Files:
 * - metrics-YYYY-MM-DD.json: Daily metric snapshots (24 entries per day max)
 * - config.json: Configuration thresholds and webhook URLs
 * - alerts.json: Alert event history
 */

import * as fs from 'fs';
import { join } from 'path';

const METRICS_DIR = '/var/lib/ultimamilla/metrics';
const CONFIG_FILE = join(METRICS_DIR, 'config.json');
const ALERTS_FILE = join(METRICS_DIR, 'alerts.json');
const RETENTION_DAYS = 30;

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(METRICS_DIR)) {
    fs.mkdirSync(METRICS_DIR, { recursive: true, mode: 0o755 });
  }
}

/**
 * Get path for daily metrics file
 */
function getMetricsFile(date: Date = new Date()): string {
  ensureDir();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return join(METRICS_DIR, `metrics-${year}-${month}-${day}.json`);
}

/**
 * Read JSON file safely
 */
function readJSON(filePath: string, defaultValue: any = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

/**
 * Write JSON file safely
 */
function writeJSON(filePath: string, data: any) {
  try {
    ensureDir();
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

/**
 * Store a metric snapshot (max 1440 per day = 1 per minute)
 */
export function storeMetric(data: {
  timestamp: number;
  memory_total_gb: number;
  memory_used_gb: number;
  memory_percent: number;
  services_online: number;
  services_total: number;
  health_status: string;
  api_response_time_ms?: number;
}) {
  const file = getMetricsFile();
  const metrics = readJSON(file, []);

  // Prevent duplicates (same minute)
  const minute = Math.floor(data.timestamp / 60000);
  const existingIndex = metrics.findIndex((m: any) =>
    Math.floor(m.timestamp / 60000) === minute
  );

  if (existingIndex >= 0) {
    metrics[existingIndex] = data;
  } else {
    metrics.push(data);
  }

  // Keep only last 1440 entries (24 hours at 1/minute)
  if (metrics.length > 1440) {
    metrics.shift();
  }

  return writeJSON(file, metrics);
}

/**
 * Store an alert event
 */
export function storeAlert(data: {
  timestamp: number;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  email_sent?: boolean;
  slack_sent?: boolean;
  discord_sent?: boolean;
}) {
  const alerts = readJSON(ALERTS_FILE, []);

  alerts.push({
    ...data,
    created_at: new Date().toISOString()
  });

  // Keep only last 1000 alerts
  if (alerts.length > 1000) {
    alerts.shift();
  }

  return writeJSON(ALERTS_FILE, alerts);
}

/**
 * Get metrics for the last N hours
 */
export function getMetricsHistory(hours: number = 24): any[] {
  ensureDir();
  const metrics: any[] = [];
  const since = Date.now() - (hours * 3600 * 1000);

  // Read files for last N days
  for (let i = 0; i <= Math.ceil(hours / 24); i++) {
    const date = new Date(Date.now() - (i * 24 * 3600 * 1000));
    const file = getMetricsFile(date);

    if (fs.existsSync(file)) {
      const dayMetrics = readJSON(file, []);
      const filtered = dayMetrics.filter((m: any) => m.timestamp >= since);
      metrics.unshift(...filtered);
    }
  }

  return metrics.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get memory trend data for chart
 */
export function getMemoryTrend(hours: number = 24) {
  const metrics = getMetricsHistory(hours);

  return metrics.map((m: any) => ({
    time: new Date(m.timestamp).toLocaleString(),
    timestamp: m.timestamp,
    memory_percent: m.memory_percent,
    memory_used_gb: m.memory_used_gb,
    memory_total_gb: m.memory_total_gb,
    health_status: m.health_status
  }));
}

/**
 * Get alert statistics
 */
export function getAlertStats(hours: number = 24) {
  const since = Date.now() - (hours * 3600 * 1000);
  const alerts = readJSON(ALERTS_FILE, []).filter((a: any) => a.timestamp >= since);

  return {
    critical: alerts.filter((a: any) => a.severity === 'critical').length,
    warnings: alerts.filter((a: any) => a.severity === 'warning').length,
    byType: Object.entries(
      alerts.reduce((acc: any, a: any) => {
        acc[a.alert_type] = (acc[a.alert_type] || 0) + 1;
        return acc;
      }, {})
    ).map(([type, count]) => ({ alert_type: type, count }))
  };
}

/**
 * Get configuration thresholds
 */
export function getConfig() {
  ensureDir();

  const defaults = {
    memory_warning_percent: 70,
    memory_critical_percent: 85,
    cpu_warning_percent: 80,
    cpu_critical_percent: 95,
    check_interval_minutes: 10,
    alert_consolidate_hours: 6,
    slack_webhook_url: '',
    discord_webhook_url: '',
    email_recipients: 'devops@ultimamilla.com.ar',
    retention_days: 30
  };

  if (!fs.existsSync(CONFIG_FILE)) {
    writeJSON(CONFIG_FILE, defaults);
    return defaults;
  }

  return readJSON(CONFIG_FILE, defaults);
}

/**
 * Update configuration thresholds
 */
export function updateConfig(data: Partial<{
  memory_warning_percent: number;
  memory_critical_percent: number;
  cpu_warning_percent: number;
  cpu_critical_percent: number;
  check_interval_minutes: number;
  alert_consolidate_hours: number;
  slack_webhook_url: string;
  discord_webhook_url: string;
  email_recipients: string;
  retention_days: number;
}>) {
  const config = getConfig();
  const updated = { ...config, ...data, updated_at: new Date().toISOString() };
  return writeJSON(CONFIG_FILE, updated);
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(limit: number = 50) {
  const alerts = readJSON(ALERTS_FILE, []);
  return alerts.slice(-limit).reverse();
}

/**
 * Cleanup old metrics (retention policy)
 */
export function cleanupOldMetrics() {
  ensureDir();
  const config = getConfig();
  const retentionDays = config.retention_days || 30;
  const cutoff = Date.now() - (retentionDays * 24 * 3600 * 1000);

  const files = fs.readdirSync(METRICS_DIR).filter(f => f.startsWith('metrics-') && f.endsWith('.json'));
  let deleted = 0;

  files.forEach(file => {
    const path = join(METRICS_DIR, file);
    const stat = fs.statSync(path);
    if (stat.mtime.getTime() < cutoff) {
      fs.unlinkSync(path);
      deleted++;
    }
  });

  // Also cleanup old alerts
  const alerts = readJSON(ALERTS_FILE, []);
  const filtered = alerts.filter((a: any) => a.timestamp >= cutoff);
  if (filtered.length < alerts.length) {
    writeJSON(ALERTS_FILE, filtered);
  }

  return { files_deleted: deleted, alerts_cleaned: alerts.length - filtered.length };
}

export default {
  storeMetric,
  storeAlert,
  getMetricsHistory,
  getMemoryTrend,
  getAlertStats,
  getConfig,
  updateConfig,
  getRecentAlerts,
  cleanupOldMetrics
};
