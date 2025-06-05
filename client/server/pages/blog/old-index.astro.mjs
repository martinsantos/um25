/* empty css                                    */
import { c as createComponent, m as maybeRenderHead, e as addAttribute, a as renderTemplate, b as createAstro, r as renderComponent } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CQ6jbdHh.mjs';
import 'clsx';
import { g as getAllPosts, a as getCategories, b as getPostsByFilters } from '../../chunks/blog-posts_DFWCG7LJ.mjs';
/* empty css                                        */
import { $ as $$OptimizedImage } from '../../chunks/OptimizedImage_BF33ghwr.mjs';
import { f as formatDate } from '../../chunks/date_uXc2bZN-.mjs';
export { renderers } from '../../renderers.mjs';

const $$BlogSearch = createComponent(($$result, $$props, $$slots) => {
  getAllPosts();
  const categories = getCategories();
  return renderTemplate`${maybeRenderHead()}<div x-data="{
        searchQuery: '',
        posts: [] as BlogPost[],
        categories: categories,
        selectedCategory: '',
        showResults: false,
        init() {
            this.$watch('searchQuery', (value) => {
                if (value.length < 2) {
                    this.posts = [];
                    this.showResults = false;
                    return;
                }
                
                const filters = {
                    searchQuery: value,
                    category: this.selectedCategory,
                    limit: 5
                };
                
                const results = getPostsByFilters(filters);
                this.posts = results.posts;
                this.showResults = true;
            });
        }
    }" class="relative max-w-2xl mx-auto" data-astro-cid-ezfxcgpt> <!-- Barra de búsqueda --> <div class="relative" data-astro-cid-ezfxcgpt> <input type="text" x-model="searchQuery" placeholder="Buscar artículos..." class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" @focus="showResults = searchQuery.length >= 2" @blur="setTimeout(() => showResults = false, 200)" data-astro-cid-ezfxcgpt> <svg class="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-ezfxcgpt> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-astro-cid-ezfxcgpt></path> </svg> </div> <!-- Filtros de categorías --> <div class="flex flex-wrap gap-2 mt-4" data-astro-cid-ezfxcgpt> <button @click="selectedCategory = ''; searchQuery.length >= 2 && $dispatch('input', searchQuery)" :class="{'bg-primary-100 text-primary-700': !selectedCategory}" class="px-3 py-1 text-sm rounded-full border border-gray-300 hover:border-primary-500 transition-colors" data-astro-cid-ezfxcgpt>
Todos
</button> ${categories.map((category) => renderTemplate`<button${addAttribute(`selectedCategory = '${category.name}'; searchQuery.length >= 2 && $dispatch('input', searchQuery)`, "@click")}${addAttribute(`{'bg-primary-100 text-primary-700': selectedCategory === '${category.name}'}`, "x-bind:class")} class="px-3 py-1 text-sm rounded-full border border-gray-300 hover:border-primary-500 transition-colors" data-astro-cid-ezfxcgpt> ${category.name} (${category.count})
</button>`)} </div> <!-- Resultados de búsqueda --> <div x-show="showResults" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-1" x-transition:enter-end="opacity-100 translate-y-0" x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0" x-transition:leave-end="opacity-0 translate-y-1" class="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto" data-astro-cid-ezfxcgpt> <template x-if="posts.length > 0" data-astro-cid-ezfxcgpt> <div class="py-2" data-astro-cid-ezfxcgpt> <template x-for="post in posts" :key="post.slug" data-astro-cid-ezfxcgpt> <a :href="'/blog/' + post.slug" class="block px-4 py-3 hover:bg-gray-50 transition-colors" data-astro-cid-ezfxcgpt> <div class="flex items-start gap-4" data-astro-cid-ezfxcgpt> <img :src="post.image" :alt="post.title" class="w-16 h-16 object-cover rounded" data-astro-cid-ezfxcgpt> <div class="flex-1 min-w-0" data-astro-cid-ezfxcgpt> <h3 x-text="post.title" class="font-semibold text-gray-900 mb-1 truncate" data-astro-cid-ezfxcgpt></h3> <p x-text="post.excerpt" class="text-sm text-gray-600 line-clamp-2" data-astro-cid-ezfxcgpt></p> <div class="flex gap-2 mt-2" data-astro-cid-ezfxcgpt> <template x-for="category in post.categories" :key="category" data-astro-cid-ezfxcgpt> <span x-text="category" class="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full" data-astro-cid-ezfxcgpt></span> </template> </div> </div> </div> </a> </template> </div> </template> <template x-if="searchQuery.length >= 2 && posts.length === 0" data-astro-cid-ezfxcgpt> <div class="px-4 py-6 text-center text-gray-500" data-astro-cid-ezfxcgpt>
No se encontraron resultados para "<span x-text="searchQuery" data-astro-cid-ezfxcgpt></span>"
</div> </template> </div> </div> `;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/components/BlogSearch.astro", void 0);

const $$Astro = createAstro("http://localhost:4321");
const $$OldIndex = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$OldIndex;
  const { searchParams } = Astro2.url;
  const currentPage = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const searchQuery = searchParams.get("q") || "";
  const filters = {
    category,
    tag,
    searchQuery,
    page: currentPage,
    limit: 9
  };
  const { posts, totalPages } = getPostsByFilters(filters);
  getCategories();
  const title = category ? `${category} - Blog | \xDAltima Milla` : tag ? `${tag} - Blog | \xDAltima Milla` : "Blog | \xDAltima Milla";
  const description = category ? `Art\xEDculos sobre ${category.toLowerCase()} en el blog de \xDAltima Milla` : tag ? `Art\xEDculos etiquetados con ${tag.toLowerCase()} en el blog de \xDAltima Milla` : "Explora nuestros art\xEDculos sobre tecnolog\xEDa, servicios IT, cloud computing, ciberseguridad y m\xE1s.";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "data-astro-cid-ia3n2xv2": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-12" data-astro-cid-ia3n2xv2> <div class="max-w-4xl mx-auto mb-12" data-astro-cid-ia3n2xv2> <h1 class="text-4xl font-bold text-center mb-8" data-astro-cid-ia3n2xv2>Blog</h1> ${renderComponent($$result2, "BlogSearch", $$BlogSearch, { "data-astro-cid-ia3n2xv2": true })} </div> <!-- Filtros activos --> ${(category || tag || searchQuery) && renderTemplate`<div class="flex flex-wrap gap-2 mb-8 justify-center" data-astro-cid-ia3n2xv2> ${category && renderTemplate`<span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700" data-astro-cid-ia3n2xv2>
Categoría: ${category} <a href="/blog" class="ml-2 hover:text-primary-900" data-astro-cid-ia3n2xv2> <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-ia3n2xv2> <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" data-astro-cid-ia3n2xv2></path> </svg> </a> </span>`} ${tag && renderTemplate`<span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700" data-astro-cid-ia3n2xv2>
Tag: ${tag} <a href="/blog" class="ml-2 hover:text-primary-900" data-astro-cid-ia3n2xv2> <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-ia3n2xv2> <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" data-astro-cid-ia3n2xv2></path> </svg> </a> </span>`} ${searchQuery && renderTemplate`<span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700" data-astro-cid-ia3n2xv2>
Búsqueda: ${searchQuery} <a href="/blog" class="ml-2 hover:text-primary-900" data-astro-cid-ia3n2xv2> <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-ia3n2xv2> <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" data-astro-cid-ia3n2xv2></path> </svg> </a> </span>`} </div>`} <!-- Grid de posts --> ${posts.length > 0 ? renderTemplate`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-astro-cid-ia3n2xv2> ${posts.map((post, index) => renderTemplate`<article${addAttribute(`bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105
                            ${index === 0 && currentPage === 1 ? "md:col-span-2 lg:col-span-3" : ""}`, "class")} data-astro-cid-ia3n2xv2> <a${addAttribute(`/blog/${post.slug}`, "href")} class="block" data-astro-cid-ia3n2xv2> <div class="relative" data-astro-cid-ia3n2xv2> ${renderComponent($$result2, "OptimizedImage", $$OptimizedImage, { "src": post.image, "alt": post.title, "class": "w-full h-48 object-cover", "data-astro-cid-ia3n2xv2": true })} ${post.category && renderTemplate`<span class="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm" data-astro-cid-ia3n2xv2> ${post.category} </span>`} </div> <div class="p-6" data-astro-cid-ia3n2xv2> <div class="flex items-center text-sm text-gray-500 mb-2" data-astro-cid-ia3n2xv2> <time${addAttribute(post.date, "datetime")} data-astro-cid-ia3n2xv2>${formatDate(post.date)}</time> <span class="mx-2" data-astro-cid-ia3n2xv2>•</span> <span data-astro-cid-ia3n2xv2>${post.readTime} min lectura</span> </div> <h2 class="text-xl font-semibold mb-2 hover:text-primary-500 transition-colors" data-astro-cid-ia3n2xv2> ${post.title} </h2> <p class="text-gray-600 mb-4 line-clamp-2" data-astro-cid-ia3n2xv2> ${post.excerpt} </p> <div class="flex items-center justify-between" data-astro-cid-ia3n2xv2> <div class="flex items-center space-x-3" data-astro-cid-ia3n2xv2> <img${addAttribute(post.authorImage, "src")}${addAttribute(post.author, "alt")} class="w-8 h-8 rounded-full object-cover" data-astro-cid-ia3n2xv2> <div class="text-sm" data-astro-cid-ia3n2xv2> <p class="font-semibold" data-astro-cid-ia3n2xv2>${post.author}</p> <p class="text-gray-500" data-astro-cid-ia3n2xv2>${post.authorRole}</p> </div> </div> </div> </div> </a> </article>`)} </div>` : renderTemplate`<div class="text-center py-12" data-astro-cid-ia3n2xv2> <h2 class="text-2xl font-semibold text-gray-900 mb-4" data-astro-cid-ia3n2xv2>No se encontraron artículos</h2> <p class="text-gray-600 mb-8" data-astro-cid-ia3n2xv2> ${searchQuery ? `No hay resultados para "${searchQuery}"` : category ? `No hay art\xEDculos en la categor\xEDa "${category}"` : tag ? `No hay art\xEDculos con la etiqueta "${tag}"` : "No hay art\xEDculos disponibles en este momento"} </p> <a href="/blog" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700" data-astro-cid-ia3n2xv2>
Ver todos los artículos
</a> </div>`} <!-- Paginación --> ${totalPages > 1 && renderTemplate`<div class="flex justify-center gap-2 mt-12" data-astro-cid-ia3n2xv2> ${currentPage > 1 && renderTemplate`<a${addAttribute(`/blog?page=${currentPage - 1}${category ? `&category=${category}` : ""}${tag ? `&tag=${tag}` : ""}${searchQuery ? `&q=${searchQuery}` : ""}`, "href")} class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" data-astro-cid-ia3n2xv2>
Anterior
</a>`} ${Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => renderTemplate`<a${addAttribute(`/blog?page=${page}${category ? `&category=${category}` : ""}${tag ? `&tag=${tag}` : ""}${searchQuery ? `&q=${searchQuery}` : ""}`, "href")}${addAttribute(`px-4 py-2 text-sm font-medium rounded-md ${currentPage === page ? "bg-primary-600 text-white" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"}`, "class")} data-astro-cid-ia3n2xv2> ${page} </a>`)} ${currentPage < totalPages && renderTemplate`<a${addAttribute(`/blog?page=${currentPage + 1}${category ? `&category=${category}` : ""}${tag ? `&tag=${tag}` : ""}${searchQuery ? `&q=${searchQuery}` : ""}`, "href")} class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" data-astro-cid-ia3n2xv2>
Siguiente
</a>`} </div>`} </main> ` })} `;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/blog/old-index.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/blog/old-index.astro";
const $$url = "/blog/old-index";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$OldIndex,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
