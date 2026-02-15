export const GET = () => {
  return new Response('/* Astro-generated CSS */', {
    status: 200,
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
};
