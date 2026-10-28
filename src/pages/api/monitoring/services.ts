import type { APIRoute } from 'astro';
import { createConnection } from 'node:net';
import { STATUS_SERVICES, type StatusProbe, type StatusService } from '@/lib/monitoring/statusCatalog';

type ProbeStatus = 'online' | 'offline';
type ServiceResult = {
  id: string;
  name: string;
  group: StatusService['group'];
  status: ProbeStatus;
  critical: boolean;
  type: 'http' | 'tcp';
  responseTimeMs: number;
  lastCheck: string;
};

type StatusSnapshot = {
  success: true;
  status: 'healthy' | 'degraded' | 'offline';
  services: ServiceResult[];
  stats: { total: number; online: number; offline: number; unknown: number; critical_online: number; critical_total: number };
  timestamp: string;
};

const CACHE_MS = 10_000;
const MAX_CONCURRENT_PROBES = 4;
const MAX_BODY_BYTES = 8 * 1024;
let cachedSnapshot: StatusSnapshot | undefined;
let cachedAt = 0;
let cachedPort = '';
let inFlight: Promise<StatusSnapshot> | undefined;

function astroProbeForRuntime(service: StatusService): StatusProbe {
  if (service.id !== 'astro' || service.probe.kind !== 'http') return service.probe;

  const rawPort = process.env['PORT'] || '';
  const port = /^\d+$/.test(rawPort) ? Number(rawPort) : 0;
  const runtimePort = port > 0 && port <= 65535 ? port : 4321;
  return { ...service.probe, url: `http://127.0.0.1:${runtimePort}/` };
}

function readBodyPrefix(response: Response): Promise<string> {
  return (async () => {
    if (!response.body) return '';
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;

    try {
      while (bytes < MAX_BODY_BYTES) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        const take = value.subarray(0, MAX_BODY_BYTES - bytes);
        chunks.push(take);
        bytes += take.byteLength;
        if (take.byteLength < value.byteLength) break;
      }
    } finally {
      void reader.cancel().catch(() => undefined);
    }

    return new TextDecoder().decode(Buffer.concat(chunks));
  })();
}

async function checkHttp(probe: Extract<StatusProbe, { kind: 'http' }>): Promise<ProbeStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), probe.timeoutMs);

  try {
    const response = await fetch(probe.url, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: probe.expected === 'json' ? 'application/json' : 'text/html' },
    });

    // Only the expected successful resource response is healthy. This rejects
    // redirects, auth errors, missing routes, and server errors alike.
    if (response.status !== 200) {
      void response.body?.cancel().catch(() => undefined);
      return 'offline';
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    const body = await readBodyPrefix(response);
    if (!body.trim()) return 'offline';

    if (probe.expected === 'html') {
      const isHtml = contentType.includes('text/html');
      const hasDocument = /<!doctype\s+html|<html\b/i.test(body);
      const hasPageContent = /<title\b|<main\b|<body\b/i.test(body);
      if (!isHtml || !hasDocument || !hasPageContent) return 'offline';
      if (probe.verifyHtmlAssets && !(await verifyHtmlAssets(probe, body, controller.signal))) return 'offline';
      return 'online';
    }

    if (!/^application\/(?:[a-z0-9!#$&^_.+-]+\+)?json(?:\s*;|$)/i.test(contentType)) return 'offline';
    try {
      const json = JSON.parse(body) as Record<string, unknown>;
      if (!json || typeof json !== 'object' || Array.isArray(json)) return 'offline';
      const healthStatus = String(json['status'] || '').toLowerCase();
      if (json['success'] === false || json['ok'] === false) return 'offline';
      const positiveHealthStatuses = ['ok', 'healthy', 'online', 'up'];
      if (typeof json['status'] === 'string' && !positiveHealthStatuses.includes(healthStatus)) return 'offline';
      if (typeof json['status'] !== 'string' && json['success'] !== true && json['ok'] !== true) return 'offline';
      return 'online';
    } catch {
      return 'offline';
    }
  } catch {
    return 'offline';
  } finally {
    clearTimeout(timeout);
  }
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2];
}

function requiredAssetUrls(probe: Extract<StatusProbe, { kind: 'http' }>, html: string): URL[] | null {
  const assetPolicy = probe.verifyHtmlAssets;
  if (!assetPolicy) return [];

  const scriptTag = html.match(/<script\b[^>]*\bsrc\s*=\s*(["'][^"']+["'])[^>]*>/i)?.[0];
  const stylesheetTag = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]).find((tag) =>
    (attribute(tag, 'rel') || '').toLowerCase().split(/\s+/).includes('stylesheet') && attribute(tag, 'href'),
  );
  const scriptSrc = scriptTag && attribute(scriptTag, 'src');
  const styleHref = stylesheetTag && attribute(stylesheetTag, 'href');
  if (!scriptSrc || !styleHref) return null;

  try {
    const urls = [new URL(scriptSrc, probe.url), new URL(styleHref, probe.url)];
    if (urls.some((url) => url.origin !== assetPolicy.origin || !url.pathname.startsWith(assetPolicy.assetPathPrefix))) return null;
    return urls;
  } catch {
    return null;
  }
}

async function verifyHtmlAssets(
  probe: Extract<StatusProbe, { kind: 'http' }>,
  html: string,
  signal: AbortSignal,
): Promise<boolean> {
  const urls = requiredAssetUrls(probe, html);
  if (!urls) return false;

  const results = await Promise.all(urls.map(async (url, index) => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        cache: 'no-store',
        signal,
        headers: { Accept: index === 0 ? 'application/javascript' : 'text/css' },
      });
      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      return response.status === 200 && (index === 0 ? /javascript|ecmascript/.test(contentType) : contentType.includes('text/css'));
    } catch {
      return false;
    }
  }));
  return results.every(Boolean);
}

function checkTcp(probe: Extract<StatusProbe, { kind: 'tcp' }>): Promise<ProbeStatus> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: probe.host, port: probe.port });
    let settled = false;
    const finish = (status: ProbeStatus) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(probe.timeoutMs);
    socket.once('connect', () => finish('online'));
    socket.once('timeout', () => finish('offline'));
    socket.once('error', () => finish('offline'));
  });
}

async function runProbe(service: StatusService): Promise<ServiceResult> {
  const startedAt = Date.now();
  const lastCheck = new Date().toISOString();

  try {
    const probe = astroProbeForRuntime(service);
    const status = probe.kind === 'http' ? await checkHttp(probe) : await checkTcp(probe);
    return {
      id: service.id,
      name: service.name,
      group: service.group,
      status,
      critical: service.critical,
      type: probe.kind,
      responseTimeMs: Date.now() - startedAt,
      lastCheck,
    };
  } catch {
    return {
      id: service.id,
      name: service.name,
      group: service.group,
      status: 'offline',
      critical: service.critical,
      type: service.probe.kind,
      responseTimeMs: Date.now() - startedAt,
      lastCheck,
    };
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, callback: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await callback(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function buildSnapshot(): Promise<StatusSnapshot> {
  // Each of the ceil(services / concurrency) waves is bounded by the largest
  // per-probe timeout (currently 5s), keeping the full snapshot under 30s.
  const services = await mapWithConcurrency(STATUS_SERVICES, MAX_CONCURRENT_PROBES, runProbe);
  const criticalServices = services.filter((service) => service.critical);
  const online = services.filter((service) => service.status === 'online').length;
  const criticalOnline = criticalServices.filter((service) => service.status === 'online').length;

  return {
    success: true,
    status: online === services.length ? 'healthy' : online === 0 ? 'offline' : 'degraded',
    services,
    stats: {
      total: services.length,
      online,
      offline: services.length - online,
      unknown: 0,
      critical_online: criticalOnline,
      critical_total: criticalServices.length,
    },
    timestamp: new Date().toISOString(),
  };
}

async function getSnapshot(): Promise<StatusSnapshot> {
  const currentPort = process.env['PORT'] || '';
  if (cachedSnapshot && currentPort === cachedPort && Date.now() - cachedAt < CACHE_MS) return cachedSnapshot;
  if (inFlight) return inFlight;

  inFlight = buildSnapshot().then((snapshot) => {
    cachedSnapshot = snapshot;
    cachedAt = Date.now();
    cachedPort = currentPort;
    return snapshot;
  }).finally(() => {
    inFlight = undefined;
  });

  return inFlight;
}

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify(await getSnapshot()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch {
    return new Response(JSON.stringify({
      success: false,
      status: 'error',
      services: [],
      error: 'No se pudo completar la comprobación de servicios.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
};
