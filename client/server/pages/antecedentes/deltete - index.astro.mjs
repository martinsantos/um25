/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, e as addAttribute } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CQ6jbdHh.mjs';
export { renderers } from '../../renderers.mjs';

const $$DELTETEIndex = createComponent(async ($$result, $$props, $$slots) => {
  const DIRECTUS_URL = "http://23.105.176.45:8055";
  const FALLBACK_IMAGE = "/placeholder.jpg";
  const getImageUrl = (imageId) => {
    if (!imageId) return FALLBACK_IMAGE;
    return {
      primary: `${DIRECTUS_URL}/assets/${imageId}`,
      secondary: `${DIRECTUS_URL}/files/${imageId}`,
      fallback: FALLBACK_IMAGE
    };
  };
  const fetchData = async () => {
    try {
      const response = await fetch(`${DIRECTUS_URL}/items/Antecedentes?fields=*,Imagen.id`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error2) {
      console.error("API Error:", error2);
      return { data: [], error: "Error cargando datos" };
    }
  };
  const { data, error } = await fetchData();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Antecedentes" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8"> ${error && renderTemplate`<div class="bg-red-100 p-4 mb-6">${error}</div>`} <div class="grid grid-cols-1 md:grid-cols-3 gap-6"> ${data.map((item) => {
    const images = getImageUrl(item.Imagen?.id);
    return renderTemplate`<article class="bg-white rounded-lg shadow overflow-hidden"> <div class="h-48 relative"> <img${addAttribute(images.primary, "src")}${addAttribute(item.Titulo, "alt")} class="w-full h-full object-cover" loading="lazy"${addAttribute((e) => {
      e.target.src = e.target.src.includes("/assets/") ? images.secondary : images.fallback;
    }, "onError")}> </div> <div class="p-4"> <h3 class="font-bold text-lg">${item.Titulo}</h3> </div> </article>`;
  })} </div> </main> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/antecedentes/DELTETE - index.astro", void 0);
const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/antecedentes/DELTETE - index.astro";
const $$url = "/antecedentes/DELTETE - index";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DELTETEIndex,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
