export { renderers } from '../../../renderers.mjs';

const GET = async ({ params, request }) => {
  const assetId = params.id;
  if (!assetId) {
    console.error("[API] Asset ID is missing");
    return new Response("Asset ID is required", { status: 400 });
  }
  console.log(`[API] Processing asset request for ID: ${assetId}`);
  const directusToken = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky";
  const directusUrl = "http://23.105.176.45:8055";
  const assetUrl = `${directusUrl}/assets/${assetId}`;
  try {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "access_token") {
        searchParams.append(key, value);
      }
    }
    const finalUrl = `${assetUrl}?${searchParams.toString()}`;
    console.log(`[API] Fetching asset from: ${finalUrl}`);
    const response = await fetch(finalUrl, {
      headers: {
        "Authorization": `Bearer ${directusToken}`
      }
    });
    if (!response.ok) {
      console.error(`[API] Error fetching asset: ${response.status} ${response.statusText}`);
      return new Response(`Error fetching asset: ${response.status}`, { status: response.status });
    }
    const contentType = response.headers.get("content-type");
    console.log(`[API] Asset fetched successfully. Content-Type: ${contentType}`);
    const data = await response.arrayBuffer();
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000"
        // Cache por 1 año
      }
    });
  } catch (error) {
    console.error("[API] Error proxying asset:", error);
    return new Response(`Error proxying asset: ${error.message}`, { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
