import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const manifest = {
    name: "ULTIMA MILLA - Especialistas en Comunicaciones",
    short_name: "ULTIMA MILLA",
    description: "Especialistas en comunicaciones, sistemas e integración desde los 2000. +400 proyectos con Gobierno de Mendoza, AFIP, Banco Credicoop.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#DC2626",
    orientation: "portrait-primary",
    categories: ["business", "technology", "communications"],
    lang: "es-AR",
    icons: [
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400'
    }
  });
};
