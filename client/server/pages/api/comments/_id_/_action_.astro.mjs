import { d as deleteComment, b as approveComment } from '../../../../chunks/comments_DfkUGlT9.mjs';
export { renderers } from '../../../../renderers.mjs';

const POST = async ({ params }) => {
  const { id, action } = params;
  if (!id || !action) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    switch (action) {
      case "approve":
        await approveComment(id);
        break;
      case "delete":
        await deleteComment(id);
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Operation failed" }), {
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
