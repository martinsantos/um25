/* empty css                                       */
import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, F as Fragment, e as addAttribute } from '../../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../../chunks/Layout_CQ6jbdHh.mjs';
export { renderers } from '../../../renderers.mjs';

const generateSlug = (titulo = '') => {
  if (!titulo) return 'item';
  let slug = String(titulo).toLowerCase();
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  slug = slug.replace(/[^\w\s-]/g, '');
  slug = slug.trim();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  slug = slug.slice(0, 50);
  return slug || 'item';
};

const $$Astro = createAstro("http://localhost:4321");
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const DIRECTUS_URL = "http://23.105.176.45:8055";
  const DIRECTUS_STATIC_TOKEN = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky";
  const { id, slug: slugFromUrl } = Astro2.params;
  if (!id || !slugFromUrl) {
    return Astro2.redirect("/404");
  }
  async function fetchServiceById(itemId) {
    const collectionPath = "/items/Servicios";
    const fields = "*,rel_antecedentes.Antecedentes_id.*";
    const apiUrl = `${DIRECTUS_URL}${collectionPath}/${itemId}?fields=${encodeURIComponent(fields)}`;
    console.log(`[SERVICIOS] Fetching: ${apiUrl}`);
    try {
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${DIRECTUS_STATIC_TOKEN}`,
          "Accept": "application/json"
        }
      });
      console.log(`[SERVICIOS] API Status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, error: "NOT_FOUND" };
        }
        const errorBody = await response.text();
        throw new Error(`Error en la API: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      const json = await response.json();
      if (!json?.data) {
        return { data: null, error: "NO_DATA_IN_RESPONSE" };
      }
      if (typeof json.data.Titulo !== "string" || !json.data.Titulo.trim()) {
        console.warn("[SERVICIOS] El servicio recuperado no tiene título o es inválido.");
      }
      console.log("[DEBUG] Servicio completo:", JSON.stringify(json.data, null, 2));
      return { data: json.data, error: null };
    } catch (e) {
      console.error("[SERVICIOS] Excepción durante el fetch:", e);
      return { data: null, error: e.message || "FETCH_EXCEPTION" };
    }
  }
  console.log("[SERVICIOS] Iniciando fetch y validación...");
  const result = await fetchServiceById(id);
  const servicio = result.data;
  if (result.error || !servicio) {
    console.error(`[SERVICIOS] Error al obtener datos: "${result.error}". Redirigiendo a 404.`);
    return Astro2.redirect("/404");
  }
  const expectedSlug = generateSlug(servicio.Titulo || "");
  if (slugFromUrl !== expectedSlug) {
    console.warn(`[SERVICIOS] Discrepancia de slug: URL="${slugFromUrl}", Esperado="${expectedSlug}". Redirigiendo a 404.`);
    return Astro2.redirect("/404");
  }
  console.log("[DEBUG] rel_antecedentes:", JSON.stringify(servicio.rel_antecedentes, null, 2));
  let antecedentesRaw = servicio?.rel_antecedentes;
  if (!Array.isArray(antecedentesRaw)) {
    antecedentesRaw = antecedentesRaw ? [antecedentesRaw] : [];
  }
  const relatedAntecedentes = antecedentesRaw.map((rel) => rel?.Antecedentes_id ?? null).filter((a) => a?.id);
  Astro2.props = { servicio, relatedAntecedentes, antecedentesRaw };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString("es-ES", options);
    } catch (e) {
      console.error(`[SERVICIOS] Error formateando fecha: ${dateString}`, e);
      return "Fecha inválida";
    }
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Servicio: ${Astro2.props.servicio?.Titulo || "Detalle"}` }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-12 md:py-20"> ${Astro2.props.servicio ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <article class="bg-white rounded-xl shadow-xl overflow-hidden mb-16"> <div class="grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-8 lg:gap-12"> <div class="md:col-span-2"> ${Astro2.props.servicio.Imagen ? renderTemplate`<img${addAttribute(`${DIRECTUS_URL}/assets/${Astro2.props.servicio.Imagen}?access_token=${DIRECTUS_STATIC_TOKEN}`, "src")}${addAttribute(`Imagen representativa de ${Astro2.props.servicio.Titulo}`, "alt")} class="w-full h-64 md:h-full object-cover" loading="lazy" width="600" height="600">` : renderTemplate`<div class="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center"> <span class="text-gray-500">Imagen no disponible</span> </div>`} </div> <div class="md:col-span-3 p-6 md:p-8 lg:p-10 flex flex-col"> <h1 class="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">${Astro2.props.servicio.Titulo}</h1> <div class="text-gray-700 mb-8 text-lg leading-relaxed prose lg:prose-lg max-w-none"> ${Astro2.props.servicio.Descripcion} </div> <div class="mb-8 border-t border-gray-200 pt-6"> <h2 class="text-lg font-semibold mb-4 text-gray-800 uppercase tracking-wider">Detalles</h2> <dl class="space-y-3"> <div class="flex flex-col sm:flex-row sm:justify-between"> <dt class="font-medium text-gray-600 w-full sm:w-1/3 mb-1 sm:mb-0">Área:</dt> <dd class="text-gray-800 sm:text-right w-full sm:w-2/3">${Astro2.props.servicio.Area || "-"}</dd> </div> <div class="flex flex-col sm:flex-row sm:justify-between"> <dt class="font-medium text-gray-600 w-full sm:w-1/3 mb-1 sm:mb-0">Cliente:</dt> <dd class="text-gray-800 sm:text-right w-full sm:w-2/3">${Astro2.props.servicio.Cliente || "-"}</dd> </div> <div class="flex flex-col sm:flex-row sm:justify-between"> <dt class="font-medium text-gray-600 w-full sm:w-1/3 mb-1 sm:mb-0">Fecha:</dt> <dd class="text-gray-800 sm:text-right w-full sm:w-2/3">${formatDate(Astro2.props.servicio.Fecha)}</dd> </div> <div class="flex flex-col sm:flex-row sm:justify-between"> <dt class="font-medium text-gray-600 w-full sm:w-1/3 mb-1 sm:mb-0">Presupuesto:</dt> <dd class="text-gray-800 sm:text-right w-full sm:w-2/3">${Astro2.props.servicio.Presupuesto || "-"}</dd> </div> <div class="flex flex-col sm:flex-row sm:justify-between"> <dt class="font-medium text-gray-600 w-full sm:w-1/3 mb-1 sm:mb-0">Unidad Negocio:</dt> <dd class="text-gray-800 sm:text-right w-full sm:w-2/3">${Astro2.props.servicio.Unidad_de_negocio || "-"}</dd> </div> </dl> </div> ${Astro2.props.servicio.Palabras_clave && Astro2.props.servicio.Palabras_clave.split(",").map((k) => k.trim()).filter((k) => k).length > 0 && renderTemplate`<div class="border-t border-gray-200 pt-6 mt-auto"> <h2 class="text-lg font-semibold mb-4 text-gray-800 uppercase tracking-wider">Etiquetas</h2> <div class="flex flex-wrap gap-2"> ${Astro2.props.servicio.Palabras_clave.split(",").map((keyword) => keyword.trim()).filter((k) => k).map((keyword) => renderTemplate`<span class="bg-blue-100 text-blue-800 rounded-md px-2.5 py-0.5 text-sm font-medium border border-blue-200"> ${keyword} </span>`)} </div> </div>`} </div> </div> </article> <section class="mb-16"> <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">Antecedentes Relacionados</h2> ${Astro2.props.relatedAntecedentes && Array.isArray(Astro2.props.relatedAntecedentes) && Astro2.props.relatedAntecedentes.length > 0 ? renderTemplate`${renderComponent($$result3, "AntecedentesCarousel", AntecedentesCarousel, { "antecedentes": Astro2.props.relatedAntecedentes, "unidad": Astro2.props.servicio.Unidad_de_negocio, "client:load": true, "client:component-hydration": "load" })}` : renderTemplate`${renderComponent($$result3, "Fragment", Fragment, {}, { "default": async ($$result4) => renderTemplate` <p class="text-center text-gray-500 py-8">No hay antecedentes vinculados para mostrar.</p> <pre class="bg-gray-100 text-xs text-left p-4 rounded overflow-x-auto">

                ${JSON.stringify(Astro2.props.antecedentesRaw, null, 2)}
              </pre> ` })}`} </section> ` })}` : renderTemplate`<div class="text-center py-20"> <p class="text-2xl text-gray-500">Lo sentimos, servicio no encontrado.</p> <a href="/servicios" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
Volver a Servicios
</a> </div>`} </main> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/[id]/[slug].astro", void 0);
const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/[id]/[slug].astro";
const $$url = "/servicios/[id]/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
