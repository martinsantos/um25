import { a as addReply } from '../../../../chunks/comments_DfkUGlT9.mjs';
export { renderers } from '../../../../renderers.mjs';

const POST = async ({ request, params }) => {
  try {
    const commentId = params.id;
    if (!commentId) {
      return new Response(JSON.stringify({ error: "Comment ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const body = await request.json();
    if (!body.author || !body.email || !body.content || !body.postSlug) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const reply = await addReply(commentId, {
      author: body.author,
      email: body.email,
      content: body.content,
      postSlug: body.postSlug
    });
    if (!reply) {
      return new Response(JSON.stringify({ error: "Parent comment not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify(reply), {
      status: 201,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to add reply" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
