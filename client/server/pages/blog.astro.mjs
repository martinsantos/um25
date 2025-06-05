/* empty css                                 */
import { c as createComponent, r as renderComponent, d as renderScript, a as renderTemplate, m as maybeRenderHead, e as addAttribute } from '../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CQ6jbdHh.mjs';
import { g as getAllPosts, a as getCategories } from '../chunks/blog-posts_DFWCG7LJ.mjs';
export { renderers } from '../renderers.mjs';

const $$Blog = createComponent(($$result, $$props, $$slots) => {
  const posts = getAllPosts();
  const categories = getCategories();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Blog - ULTIMA MILLA" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-6xl mx-auto px-4 py-12"> <h1 class="text-4xl font-bold mb-8 text-center">Blog</h1> <!-- Filtros de Categorías --> <div class="mb-12"> <div class="flex flex-wrap justify-center gap-4" id="categoryFilters"> ${categories.map((category) => renderTemplate`<button class="px-4 py-2 rounded-full border border-gray-300 hover:border-red-500 hover:text-red-500 transition-colors duration-300 category-filter"${addAttribute(category, "data-category")}> ${category} </button>`)} </div> </div> <!-- Barra de Búsqueda --> <div class="mb-12"> <div class="max-w-xl mx-auto"> <div class="relative"> <input type="text" id="searchInput" placeholder="Buscar artículos..." class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 pl-12"> <svg class="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> </div> </div> </div> <!-- Grid de Posts --> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="postsGrid"> ${posts.map((post) => renderTemplate`<article class="bg-white rounded-lg shadow-lg overflow-hidden post-card"${addAttribute(post.category, "data-category")}> <div class="relative"> <img${addAttribute(post.image, "src")}${addAttribute(post.title, "alt")} class="w-full h-48 object-cover"> <div class="absolute top-4 right-4"> <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm"> ${post.category} </span> </div> </div> <div class="p-6"> <div class="flex items-center text-sm text-gray-500 mb-2"> <span>${post.date}</span> <span class="mx-2">•</span> <span>${post.readTime} min lectura</span> </div> <h2 class="text-xl font-semibold mb-2 hover:text-red-500 transition-colors duration-300"> <a${addAttribute(`/blog/${post.slug}`, "href")}>${post.title}</a> </h2> <p class="text-gray-600 mb-4"> ${post.excerpt} </p> <div class="flex items-center justify-between"> <div class="flex items-center space-x-3"> <img${addAttribute(post.authorImage, "src")}${addAttribute(post.author, "alt")} class="w-8 h-8 rounded-full object-cover"> <div class="text-sm"> <p class="font-semibold">${post.author}</p> <p class="text-gray-500">${post.authorRole}</p> </div> </div> <a${addAttribute(`/blog/${post.slug}`, "href")} class="inline-flex items-center text-red-500 hover:text-red-600">
Leer más
<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> </a> </div> </div> </article>`)} </div> <!-- Servicios --> <div class="services mt-12"> ${services.map((service) => renderTemplate`<div class="service-card"> <img${addAttribute(service.Imagen_servicio, "src")}${addAttribute(service.Title, "alt")} class="service-image"> <h2> <a${addAttribute(`/blog/${service.Slug}`, "href")}>${service.Title}</a> </h2> <p>${service.Descripcion}</p> </div>`)} </div> <!-- Paginación --> <div class="mt-12 flex justify-center"> <nav class="flex space-x-2"> <a href="#" class="px-4 py-2 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors duration-300">
Anterior
</a> <a href="#" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300">
1
</a> <a href="#" class="px-4 py-2 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors duration-300">
2
</a> <a href="#" class="px-4 py-2 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors duration-300">
3
</a> <a href="#" class="px-4 py-2 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors duration-300">
Siguiente
</a> </nav> </div> </div> ` })} ${renderScript($$result, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/blog.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/blog.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/blog.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Blog,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
