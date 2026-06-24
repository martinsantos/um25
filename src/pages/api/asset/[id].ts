import type { APIRoute } from 'astro';

const DIRECTUS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMAGE_CONTENT_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const FIT_VALUES = new Set(['cover', 'contain', 'inside', 'outside']);
const FORMAT_VALUES = new Set(['avif', 'jpg', 'jpeg', 'png', 'webp']);

function appendIntegerParam(target: URLSearchParams, key: string, value: string, min: number, max: number): boolean {
  if (!/^\d+$/.test(value)) return false;
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) return false;
  target.set(key, String(numberValue));
  return true;
}

function buildSafeAssetParams(url: URL): URLSearchParams | null {
  const safeParams = new URLSearchParams();

  for (const [key, value] of url.searchParams.entries()) {
    switch (key) {
      case 'width':
      case 'height':
        if (!appendIntegerParam(safeParams, key, value, 1, 4096)) return null;
        break;
      case 'quality':
        if (!appendIntegerParam(safeParams, key, value, 1, 100)) return null;
        break;
      case 'fit':
        if (!FIT_VALUES.has(value)) return null;
        safeParams.set(key, value);
        break;
      case 'format':
        if (!FORMAT_VALUES.has(value)) return null;
        safeParams.set(key, value);
        break;
      case 'key':
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(value)) return null;
        safeParams.set(key, value);
        break;
      default:
        return null;
    }
  }

  return safeParams;
}

export const GET: APIRoute = async ({ params, request }) => {
  const assetId = params.id;
  if (!assetId) {
    console.error('[API] Asset ID is missing');
    return new Response('Asset ID is required', { status: 400 });
  }

  if (!DIRECTUS_UUID_RE.test(assetId)) {
    return new Response('Invalid asset ID', { status: 400 });
  }

  // Obtener el token de autenticación de Directus
  const directusToken = import.meta.env.DIRECTUS_STATIC_TOKEN;
  if (!directusToken) {
    console.error('[API] Asset token not configured');
    return new Response('Servicio de assets no configurado', { status: 500 });
  }

  // Construir la URL del asset en Directus
  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
  const assetUrl = `${directusUrl}/assets/${assetId}`;

  try {
    // Obtener los parámetros de la URL original
    const url = new URL(request.url);
    const searchParams = buildSafeAssetParams(url);

    if (!searchParams) {
      return new Response('Invalid asset parameters', { status: 400 });
    }
    
    // Construir la URL final con los parámetros
    const finalUrl = `${assetUrl}?${searchParams.toString()}`;

    // Realizar la solicitud a Directus con el token de autenticación
    const response = await fetch(finalUrl, {
      headers: {
        'Authorization': `Bearer ${directusToken}`,
      },
    });

    if (!response.ok) {
      console.error(`[API] Error fetching asset: ${response.status} ${response.statusText}`);
      return new Response(`Error fetching asset: ${response.status}`, { status: response.status });
    }

    // Obtener el tipo de contenido de la respuesta
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || '';
    if (!IMAGE_CONTENT_TYPES.has(contentType)) {
      return new Response('Unsupported asset type', { status: 415 });
    }
    
    // Obtener los datos binarios de la imagen
    const data = await response.arrayBuffer();

    // Devolver la imagen con el tipo de contenido adecuado
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 año
      },
    });
  } catch (error) {
    console.error('[API] Error proxying asset:', error);
    return new Response('Error proxying asset', { status: 500 });
  }
};
