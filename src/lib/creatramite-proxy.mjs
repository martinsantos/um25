/* A bounded gateway to an isolated demo; it never accepts a caller-chosen upstream. */
const PREFIX = '/demo/creatramite';
const MAX_BODY = 5 * 1024 * 1024;
const INPUT_HEADERS = ['accept', 'accept-language', 'content-type', 'cookie', 'origin', 'referer', 'x-api-key', 'x-csrf-token'];
const OUTPUT_HEADERS = ['cache-control', 'content-type', 'content-disposition', 'content-security-policy',
  'location', 'vary', 'access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'OPTIONS']);

function error(status, message) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' } });
}

async function readBounded(stream, max) {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        throw new RangeError('Body too large');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return data;
}

export function createDemoGateway({ upstream = 'http://127.0.0.1:18891', now = Date.now } = {}) {
  // This argument is supplied only by the server-side test; the route never reads it from a request.
  const target = new URL(upstream);
  if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1' || !target.port || target.pathname !== '/' || target.search || target.hash)
    throw new Error('Invalid local demo target');
  const attempts = new Map();
  const activeByIp = new Map();
  let active = 0;
  let activeBodies = 0;
  return async function proxyDemo(request) {
    const source = new URL(request.url);
    if (source.pathname === PREFIX) {
      return new Response(null, { status: 308, headers: { Location: PREFIX + '/' + source.search,
        'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    let decoded;
    try { decoded = decodeURIComponent(source.pathname); } catch { return error(400, 'Ruta inválida.'); }
    if (!decoded.startsWith(PREFIX + '/') || decoded.includes('\\') || decoded.includes('\0') ||
        decoded.split('/').some(part => part === '.' || part === '..')) return error(400, 'Ruta inválida.');
    if (decoded === PREFIX + '/api/simulacion/notificaciones/pago') return error(404, 'No encontrado.');
    if (!ALLOWED_METHODS.has(request.method)) return error(405, 'Método no permitido.');
    const hasBody = request.method === 'POST' || request.method === 'PUT';
    let size = 0;
    if (hasBody) {
      const raw = request.headers.get('content-length');
      if (!raw || !/^(0|[1-9][0-9]{0,8})$/.test(raw)) return error(411, 'Se requiere el tamaño del contenido.');
      size = Number(raw);
      if (size > MAX_BODY) return error(413, 'El contenido supera el límite de la demo.');
    }
    // The existing ingress overwrites X-Real-IP after its trusted Cloudflare real-IP rules.
    const ip = (request.headers.get('x-real-ip') || 'desconocida').slice(0, 64);
    const stamp = now();
    if (attempts.size > 10000) for (const [key, value] of attempts) if (stamp - value.start >= 60000) attempts.delete(key);
    if (hasBody && decoded === PREFIX + '/login') {
      let item = attempts.get(ip);
      if (!item || stamp - item.start >= 60000) {
        if (!item && attempts.size >= 10000) return error(429, 'Demasiados intentos. Espere un minuto.');
        item = { start: stamp, count: 0 }; attempts.set(ip, item);
      }
      if (++item.count > 12) return error(429, 'Demasiados intentos. Espere un minuto.');
    }
    const perIp = activeByIp.get(ip) || 0;
    if (active >= 32 || perIp >= 8 || (hasBody && activeBodies >= 2)) return error(503, 'La demo está ocupada. Reintente.');
    active++; if (hasBody) activeBodies++; activeByIp.set(ip, perIp + 1);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const headers = new Headers();
      for (const name of INPUT_HEADERS) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
      }
      headers.set('Host', 'www.ultimamilla.com.ar');
      headers.set('X-Forwarded-Proto', 'https');
      headers.set('X-Forwarded-Host', 'www.ultimamilla.com.ar');
      let body;
      if (hasBody) {
        try { body = await readBounded(request.body, MAX_BODY); }
        catch (cause) { if (cause instanceof RangeError) return error(413, 'El contenido supera el límite de la demo.'); throw cause; }
        if (body.byteLength !== size || body.byteLength > MAX_BODY) return error(400, 'Tamaño de contenido inválido.');
      }
      const destination = new URL(source.pathname + source.search, target);
      if (destination.origin !== target.origin) return error(400, 'Ruta inválida.');
      const response = await fetch(destination, { method: request.method, headers, body,
        redirect: 'manual', signal: controller.signal });
      const result = new Headers();
      for (const name of OUTPUT_HEADERS) {
        const value = response.headers.get(name);
        if (value) result.set(name, value);
      }
      const location = result.get('location');
      if (location && !location.startsWith(PREFIX + '/') && location !== PREFIX)
        return error(502, 'La demo devolvió una dirección inválida.');
      const cookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie() : [response.headers.get('set-cookie')].filter(Boolean);
      for (const value of cookies) result.append('set-cookie', value);
      result.set('Cache-Control', 'no-store');
      result.set('X-Content-Type-Options', 'nosniff');
      result.set('X-Robots-Tag', 'noindex, nofollow');
      // Chrome may send Origin: null for form submissions under no-referrer,
      // which Astro correctly rejects. Keep same-origin CSRF checks functional.
      result.set('Referrer-Policy', 'same-origin');
      // Buffering the response makes the concurrency bound apply until transfer completes.
      let data = null;
      if (request.method !== 'HEAD' && ![204, 205, 304].includes(response.status)) {
        try { data = await readBounded(response.body, MAX_BODY); }
        catch (cause) { if (cause instanceof RangeError) return error(502, 'La respuesta de la demo es demasiado grande.'); throw cause; }
      }
      return new Response(data, { status: response.status, headers: result });
    } catch {
      return error(503, 'La demo no está disponible en este momento.');
    } finally {
      clearTimeout(timer); active--; if (hasBody) activeBodies--;
      const remaining = (activeByIp.get(ip) || 1) - 1;
      if (remaining) activeByIp.set(ip, remaining); else activeByIp.delete(ip);
    }
  };
}

export const proxyDemo = createDemoGateway();
