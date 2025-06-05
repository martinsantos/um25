/* empty css                                       */
import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, e as addAttribute, u as unescapeHTML } from '../../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../../chunks/Layout_CQ6jbdHh.mjs';
/* empty css                                        */
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro("http://localhost:4321");
const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const DIRECTUS_URL = "http://23.105.176.45:8055";
  const DEFAULT_IMAGE_URL = `${DIRECTUS_URL}/assets/2a42dfbc-8d55-4fd7-baa0-c31223a3ace8`;
  const DIRECTUS_STATIC_TOKEN = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky";
  const { id, slug: slugFromUrl } = Astro2.params;
  console.log(`[SLUG PAGE] Received Params -> ID: ${id}, SlugFromURL: ${slugFromUrl}`);
  if (!id || !slugFromUrl) {
    console.error("[SLUG PAGE] Error: Falta ID o Slug en la URL. Redirigiendo a 404.");
    return Astro2.redirect("/404");
  }
  let antecedente = null;
  let fetchError = null;
  const getAssetUrl = (assetId) => {
    if (!assetId) return DEFAULT_IMAGE_URL;
    if (String(assetId).startsWith("http://") || String(assetId).startsWith("https://")) {
      return assetId;
    }
    return `/api/asset/${assetId}`;
  };
  const generateSlug = (text = "") => {
    if (text === null || typeof text === "undefined") {
      console.warn('[generateSlug] Input is null/undefined, returning "item".');
      return "item";
    }
    const slug = String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
    return slug || "item";
  };
  function parseCommaSeparatedString(input) {
    if (typeof input !== "string" || !input.trim()) {
      return [];
    }
    try {
      return input.split(",").map((item) => item.trim()).filter(Boolean);
    } catch (e) {
      console.error("[parseCommaSeparatedString] Error parsing string:", input, e);
      return [];
    }
  }
  async function fetchAntecedenteById(itemId) {
    const collectionPath = "/items/Antecedentes";
    const fields = "*.*";
    const apiUrl = `${DIRECTUS_URL}${collectionPath}/${itemId}?fields=${fields}`;
    console.log(`[SLUG PAGE] Fetching: ${apiUrl}`);
    try {
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${DIRECTUS_STATIC_TOKEN}`,
          "Accept": "application/json"
        }
      });
      console.log(`[SLUG PAGE] API Status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[SLUG PAGE] API 404: Antecedente con ID ${itemId} no encontrado.`);
          return { data: null, error: "NOT_FOUND" };
        }
        const errorBody = await response.text();
        console.error(`[SLUG PAGE] API Error (${response.status}):`, errorBody);
        throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
      }
      const responseData = await response.json();
      if (!responseData?.data) {
        console.warn(`[SLUG PAGE] Respuesta de API OK, pero no contiene 'data' para ID ${itemId}. Respuesta:`, JSON.stringify(responseData));
        return { data: null, error: "NO_DATA_IN_RESPONSE" };
      }
      console.log(`[SLUG PAGE] Datos recibidos OK. Título: "${responseData.data?.Titulo}"`);
      if (typeof responseData.data.Titulo !== "string" || !responseData.data.Titulo.trim()) {
        console.error("[SLUG PAGE] FATAL: El campo 'Titulo' está ausente o vacío en los datos recibidos.");
        return { data: null, error: "MISSING_OR_EMPTY_TITLE" };
      }
      return { data: responseData.data, error: null };
    } catch (e) {
      console.error("[SLUG PAGE] Excepción durante el fetch:", e);
      return { data: null, error: e.message || "FETCH_EXCEPTION" };
    }
  }
  console.log("[SLUG PAGE] Iniciando fetch y validación...");
  const result = await fetchAntecedenteById(id);
  antecedente = result.data;
  fetchError = result.error;
  if (fetchError) {
    console.error(`[SLUG PAGE] Error al obtener datos: "${fetchError}". Redirigiendo a 404.`);
    return Astro2.redirect("/404");
  }
  if (!antecedente) {
    console.warn(`[SLUG PAGE] Antecedente con ID ${id} no encontrado o datos inválidos. Redirigiendo a 404.`);
    return Astro2.redirect("/404");
  }
  const tituloRealDelAntecedente = antecedente.Titulo;
  const expectedSlug = generateSlug(tituloRealDelAntecedente);
  console.log(`[SLUG PAGE] Comparando Slugs: URL="${slugFromUrl}", Esperado="${expectedSlug}" (Generado de título: "${tituloRealDelAntecedente}")`);
  if (slugFromUrl !== expectedSlug) {
    console.warn(`[SLUG PAGE] DISCREPANCIA DE SLUG! URL="${slugFromUrl}", Esperado="${expectedSlug}". Redirigiendo a 404.`);
    return Astro2.redirect("/404");
  }
  console.log("[SLUG PAGE] Slug OK. Preparando datos para renderizar...");
  const tecnologias = parseCommaSeparatedString(antecedente?.Tecnologias);
  console.log(`[SLUG PAGE] Tecnologías procesadas (array):`, tecnologias);
  const tags = parseCommaSeparatedString(antecedente?.tags);
  console.log(`[SLUG PAGE] Tags procesados (array):`, tags);
  let imagenesGaleria = [];
  if (Array.isArray(antecedente?.Imagenes)) {
    imagenesGaleria = antecedente.Imagenes.filter((imgId) => imgId != null);
    console.log(`[SLUG PAGE] Imágenes de galería procesadas (IDs):`, imagenesGaleria);
  } else if (antecedente?.Imagenes) {
    console.warn(`[SLUG PAGE] El campo 'Imagenes' existe pero no es un array. Valor:`, antecedente.Imagenes);
  } else {
    console.log(`[SLUG PAGE] No hay campo 'Imagenes' o está vacío.`);
  }
  const fichaTecnicaFields = [
    // Iconos de Heroicons v2 (Outline) - Asegúrate de tenerlos disponibles o usa los que prefieras
    { key: "Fecha", label: "Fecha", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" },
    { key: "Cliente", label: "Cliente", icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
    { key: "Area", label: "Área", icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375M9 12h6.375M9 17.25h6.375" },
    { key: "Unidad_de_negocio", label: "U. Negocio", icon: "M2.25 21h19.5m-18-18h16.5a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-15a1.5 1.5 0 0 1 1.5-1.5Zm1.5 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 3.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 3.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" },
    { key: "Estado", label: "Estado", icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1-18 0Z" }
  ];
  function formatFichaValue(key, value) {
    if (value === null || value === void 0 || value === "") return null;
    if (key === "Fecha") {
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          console.warn(`[formatFichaValue] Valor de fecha inválido: ${value}`);
          return String(value);
        }
        return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
      } catch (e) {
        console.error(`[formatFichaValue] Error formateando fecha: ${value}`, e);
        return String(value);
      }
    }
    if (key === "Estado") {
      const lowerCaseValue = String(value).toLowerCase();
      let statusClass = "bg-gray-100 text-gray-700 ring-gray-500/10";
      if (lowerCaseValue.includes("completado") || lowerCaseValue.includes("finalizado")) {
        statusClass = "bg-green-100 text-green-800 ring-green-600/20";
      } else if (lowerCaseValue.includes("proceso") || lowerCaseValue.includes("desarrollo")) {
        statusClass = "bg-yellow-100 text-yellow-800 ring-yellow-600/20";
      } else if (lowerCaseValue.includes("pendiente") || lowerCaseValue.includes("pausado")) {
        statusClass = "bg-orange-100 text-orange-800 ring-orange-600/20";
      } else if (lowerCaseValue.includes("cancelado")) {
        statusClass = "bg-red-100 text-red-800 ring-red-600/20";
      }
      return { html: `<span class="inline-block px-2.5 py-0.5 rounded-full text-sm font-medium ring-1 ring-inset ${statusClass}">${value}</span>` };
    }
    return String(value);
  }
  const pageTitle = antecedente?.Titulo ? `Caso de Estudio: ${antecedente.Titulo}` : "Detalle del Antecedente";
  const heroImage = antecedente?.Imagen ? getAssetUrl(antecedente.Imagen.id || antecedente.Imagen) : DEFAULT_IMAGE_URL;
  console.log(`[SLUG PAGE] Hero Image URL: ${heroImage}`);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": pageTitle }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="relative min-h-screen bg-white">  <div class="relative h-[60vh] min-h-[450px] max-h-[600px] overflow-hidden"> <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent z-10"></div> <img${addAttribute(heroImage, "src")} Asegura que se use la imagen correcta${addAttribute(antecedente?.Titulo || "Imagen del proyecto", "alt")} class="absolute w-full h-full object-cover object-center scale-105 animate-subtle-zoom" loading="eager"${addAttribute(`this.onerror=null; this.src='${DEFAULT_IMAGE_URL}';`, "onerror")} Fallback a la imagen por defecto si ocurre un error> <div class="absolute inset-0 z-20"> <div class="container h-full flex items-end pb-20"> <div class="max-w-3xl"> <div class="space-y-6"> <span class="inline-flex items-center px-4 py-1.5 rounded-full text-base font-medium bg-blue-600 text-white"> <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path> </svg>
Caso de Estudio
</span> <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"> ${antecedente?.Titulo} </h1> ${antecedente?.Cliente && renderTemplate`<div class="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-5 py-2.5 w-fit"> <svg class="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path> </svg> <span class="text-lg font-medium text-gray-800">${antecedente.Cliente}</span> </div>`} </div> </div> </div> </div> </div>  <div class="container relative z-10 -mt-20 pb-20"> <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">  <aside class="lg:col-span-3 lg:order-2 space-y-6"> <div class="sticky top-8">  <section class="bg-white rounded-2xl p-6 text-gray-800 shadow-xl border border-gray-200"> <h2 class="text-xl font-bold mb-6 pb-4 border-b border-gray-200">Detalles del Proyecto</h2> <dl class="space-y-4"> ${fichaTecnicaFields.map(({ key, label, icon }) => {
    const value = antecedente?.[key];
    const formattedValue = formatFichaValue(key, value);
    if (formattedValue === null) return null;
    return renderTemplate`<div class="flex items-start gap-x-3"${addAttribute(key, "key")}> <dt class="flex-shrink-0 text-gray-500 pt-0.5">  <svg class="w-5 h-5" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(icon, "d")}></path> </svg> <span class="sr-only">${label}</span>  </dt> <dd class="flex-1 text-gray-800">  ${typeof formattedValue === "object" && formattedValue.html ? (
      // Si es HTML (ej: badge de estado), usar set:html
      renderTemplate`<div>${unescapeHTML(formattedValue.html)}</div>`
    ) : (
      // Si es texto plano
      renderTemplate`<span class="text-base">${formattedValue}</span>`
    )} </dd> </div>`;
  }).filter(Boolean)}  </dl> </section>  ${(tecnologias.length > 0 || tags.length > 0) && renderTemplate`<section class="mt-6 bg-white rounded-2xl p-6 text-gray-800 shadow-xl border border-gray-200"> ${tecnologias.length > 0 && renderTemplate`<div class="mb-6"> <h3 class="text-lg font-semibold mb-4">Tecnologías</h3> <div class="flex flex-wrap gap-2"> ${tecnologias.map((tech) => renderTemplate`<span class="px-3 py-1 rounded-full text-base font-medium bg-blue-50 text-blue-700"> ${tech} </span>`)} </div> </div>`} ${tags.length > 0 && renderTemplate`<div> <h3 class="text-lg font-semibold mb-4">Etiquetas</h3> <div class="flex flex-wrap gap-2"> ${tags.map((tag) => renderTemplate`<span class="px-3 py-1 rounded-full text-base font-medium bg-gray-50 text-gray-600">
#${tag} </span>`)} </div> </div>`} </section>`}  <div class="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl"> <h3 class="text-xl font-bold mb-3">¿Te interesa este proyecto?</h3> <p class="text-blue-100 mb-6">Descubre cómo podemos ayudarte</p> <a href="/contacto" class="block w-full bg-white text-blue-600 font-medium py-3 px-6 rounded-lg text-base text-center hover:bg-gray-50 transition-colors">
Hablar con un experto
</a> </div> </div> </aside>  <div class="lg:col-span-9 lg:order-1">  ${antecedente?.Descripcion && renderTemplate`<article class="bg-white rounded-2xl p-8 text-gray-800 shadow-xl border border-gray-200"> <div class="prose max-w-none">${unescapeHTML(antecedente.Descripcion)}</div> </article>`}  ${(antecedente?.Objetivos || antecedente?.Resultados) && renderTemplate`<div class="grid md:grid-cols-2 gap-8">  ${antecedente?.Objetivos && renderTemplate`<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-xl ring-1 ring-gray-900/5 relative overflow-hidden"> <div class="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-50 via-blue-100 to-transparent rounded-bl-full opacity-60"></div> <div class="relative z-10"> <h3 class="flex items-center gap-x-2 text-2xl font-bold text-gray-900 mb-4"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-blue-600"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z"></path> </svg>
Objetivos
</h3> <div class="prose prose-base max-w-none text-gray-600">${unescapeHTML(antecedente.Objetivos)}</div> </div> </div>`}  ${antecedente?.Resultados && renderTemplate`<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-xl ring-1 ring-gray-900/5 relative overflow-hidden"> <div class="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-50 via-green-100 to-transparent rounded-bl-full opacity-60"></div> <div class="relative z-10"> <h3 class="flex items-center gap-x-2 text-2xl font-bold text-gray-900 mb-4"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-green-600"> <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1-18 0Z"></path> </svg>
Resultados
</h3> <div class="prose prose-base max-w-none text-gray-600">${unescapeHTML(antecedente.Resultados)}</div> </div> </div>`} </div>`}  ${imagenesGaleria.length > 0 && renderTemplate`<section class="mt-8 bg-white rounded-2xl p-8 shadow-xl"> <h2 class="text-2xl font-bold text-gray-900 mb-6">Galería del Proyecto</h2> <div class="grid grid-cols-2 md:grid-cols-3 gap-6"> ${imagenesGaleria.map((imagenId, index) => renderTemplate`<a${addAttribute(getAssetUrl(imagenId), "href")} class="group relative aspect-video sm:aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 block" data-fslightbox="gallery"${addAttribute(`Ver imagen ${index + 1} de la galería`, "aria-label")}> <img${addAttribute(getAssetUrl(imagenId) + "?width=400&height=400&fit=cover", "src")} Pide tamaño optimizado a Directus${addAttribute(`${antecedente.Titulo || "Imagen del proyecto"} - ${index + 1}`, "alt")} class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105" loading="lazy" width="400" height="400"${addAttribute(`this.onerror=null; this.src='${DEFAULT_IMAGE_URL}?width=400&height=400&fit=cover'; this.alt='Imagen ${index + 1} por defecto';`, "onerror")}>  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-3"> <span class="text-white text-sm font-medium flex items-center gap-1"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"> <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"></path> </svg>
Ampliar
</span> </div> </a>`)} </div> </section>`} </div> </div>  <div class="mt-16 text-center"> <a href="/antecedentes" class="inline-flex items-center px-6 py-3 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-md"> <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"></path> </svg>
Volver a Antecedentes
</a> </div> </div> </main> ` })} `;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/antecedentes/[id]/[slug].astro", void 0);
const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/antecedentes/[id]/[slug].astro";
const $$url = "/antecedentes/[id]/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
