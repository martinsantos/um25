import { g as getCommentsByPostSlug, c as addComment } from '../../chunks/comments_DfkUGlT9.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  const url = new URL(request.url);
  const postSlug = url.searchParams.get("postSlug");
  if (!postSlug) {
    return new Response(JSON.stringify({ error: "Post slug is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const comments = await getCommentsByPostSlug(postSlug);
    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch comments" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.author || !body.email || !body.content || !body.postSlug) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const comment = await addComment({
      author: body.author,
      email: body.email,
      content: body.content,
      postSlug: body.postSlug
    });
    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to add comment" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
