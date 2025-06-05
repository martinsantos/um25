/* empty css                                 */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, e as addAttribute } from '../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CQ6jbdHh.mjs';
export { renderers } from '../renderers.mjs';

const $$CasosDeExito = createComponent(async ($$result, $$props, $$slots) => {
  const response = await fetch("http://localhost:8055/items/casos_de_exito");
  const { data: casosExito } = await response.json();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Casos de \xC9xito" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8"> <h1 class="text-4xl font-bold text-center mb-12">Nuestros Casos de Éxito</h1> <div class="grid grid-cols-1 md:grid-cols-3 gap-8"> ${casosExito.map((caso) => renderTemplate`<div class="bg-white p-6 rounded-lg shadow-lg"> <h2 class="text-2xl font-semibold mb-4">${caso.T\u00EDtulo}</h2> <!-- Usar 'Título' en lugar de 'titulo' --> ${caso.Imagen && renderTemplate`<img${addAttribute(`http://localhost:8055/assets/${caso.Imagen}`, "src")}${addAttribute(caso.T\u00EDtulo, "alt")} class="w-full h-48 object-cover mb-4 rounded">`} <!-- Usar 'Imagen' en lugar de 'imagen' --> <p class="text-gray-700 mb-4">${caso.Descripci\u00F3n}</p> <!-- Usar 'Descripción' en lugar de 'descripcion' --> ${caso["Links-qhkc-b"] && renderTemplate`<a${addAttribute(caso["Links-qhkc-b"], "href")} class="text-blue-600 hover:text-blue-800">Más información →</a>`} </div>`)} </div> <div class="mt-12 text-center"> <a href="/contact" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
Solicitar Información
</a> </div> </main> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/casos-de-exito.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/casos-de-exito.astro";
const $$url = "/casos-de-exito";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$CasosDeExito,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
