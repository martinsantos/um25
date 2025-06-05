export { renderers } from '../../renderers.mjs';

// src/pages/api/get-articles.js
async function get() {
    const { getItems } = await import('../../chunks/directus_BJK1vXSi.mjs');
    const articles = await getItems('articles');
    
    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
