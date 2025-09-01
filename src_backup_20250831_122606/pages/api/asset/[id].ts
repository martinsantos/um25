import type { APIRoute } from 'astro';

export function getStaticPaths() {
  return [];
}

export const GET: APIRoute = async ({ params, request }) => {
  const assetId = params.id;
  if (!assetId) {
    console.error('[API] Asset ID is missing');
    return new Response('Asset ID is required', { status: 400 });
  }

  console.log(`[API] Processing asset request for ID: ${assetId}`);

  // Obtener el token de autenticación de Directus
  const directusToken = import.meta.env.DIRECTUS_STATIC_TOKEN;
  if (!directusToken) {
    console.error('[API] Directus token not configured');
    return new Response('Directus token not configured', { status: 500 });
  }

  // Construir la URL del asset en Directus
  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
  const assetUrl = `${directusUrl}/assets/${assetId}`;

  try {
    // Obtener los parámetros de la URL original
    const url = new URL(request.url);
    const searchParams = new URLSearchParams();
    
    // Copiar todos los parámetros de la URL original excepto 'access_token'
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'access_token') {
        searchParams.append(key, value);
      }
    }
    
    // Construir la URL final con los parámetros
    const finalUrl = `${assetUrl}?${searchParams.toString()}`;
    console.log(`[API] Fetching asset from: ${finalUrl}`);

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
    const contentType = response.headers.get('content-type');
    console.log(`[API] Asset fetched successfully. Content-Type: ${contentType}`);
    
    // Obtener los datos binarios de la imagen
    const data = await response.arrayBuffer();

    // Devolver la imagen con el tipo de contenido adecuado
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 año
      },
    });
  } catch (error) {
    console.error('[API] Error proxying asset:', error);
    return new Response(`Error proxying asset: ${error.message}`, { status: 500 });
  }
};
