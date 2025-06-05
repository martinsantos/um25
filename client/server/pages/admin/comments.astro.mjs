/* empty css                                    */
import { b as createAstro, c as createComponent, r as renderComponent, d as renderScript, a as renderTemplate, m as maybeRenderHead, e as addAttribute } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CQ6jbdHh.mjs';
import { l as loadComments } from '../../chunks/comments_DfkUGlT9.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("http://localhost:4321");
const $$Comments = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Comments;
  const isAuthenticated = Astro2.cookies.get("adminAuth")?.value === process.env.ADMIN_SECRET;
  if (!isAuthenticated) {
    return Astro2.redirect("/admin/login");
  }
  const comments = await loadComments();
  const pendingComments = comments.filter((c) => !c.isApproved);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Administraci\xF3n de Comentarios" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8"> <h1 class="text-3xl font-bold mb-8">Administración de Comentarios</h1> <div class="bg-white rounded-lg shadow-md p-6"> <h2 class="text-xl font-semibold mb-6">Comentarios Pendientes de Aprobación</h2> <div class="space-y-6"> ${pendingComments.map((comment) => renderTemplate`<div class="border-b border-gray-200 pb-6 last:border-0"> <div class="flex justify-between items-start mb-4"> <div> <h3 class="font-semibold">${comment.author}</h3> <p class="text-sm text-gray-600">${comment.email}</p> <p class="text-sm text-gray-600"> ${new Date(comment.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })} </p> </div> <div class="flex space-x-4"> <button class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors" data-action="approve"${addAttribute(comment.id, "data-comment-id")}>
Aprobar
</button> <button class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors" data-action="delete"${addAttribute(comment.id, "data-comment-id")}>
Eliminar
</button> </div> </div> <p class="text-gray-700">${comment.content}</p> <p class="text-sm text-gray-600 mt-2">Post: ${comment.postSlug}</p> </div>`)} ${pendingComments.length === 0 && renderTemplate`<p class="text-gray-600 text-center py-4">No hay comentarios pendientes de aprobación</p>`} </div> </div> </main> ` })} ${renderScript($$result, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/admin/comments.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/admin/comments.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/admin/comments.astro";
const $$url = "/admin/comments";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Comments,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
