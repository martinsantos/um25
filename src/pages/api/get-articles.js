// src/pages/api/get-articles.js
export async function get() {
    const { getItems } = await import('../../lib/directus');
    const articles = await getItems('articles');
    
    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }