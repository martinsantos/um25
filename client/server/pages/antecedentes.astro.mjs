/* empty css                                 */
import { b as createAstro, c as createComponent, r as renderComponent, d as renderScript, a as renderTemplate, m as maybeRenderHead, e as addAttribute } from '../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CQ6jbdHh.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("http://localhost:4321");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const PAGE_SIZE = 12;
  const DEFAULT_IMAGE = "http://localhost:8055/assets/8cbc28b8-e6ad-46a2-93ec-14db4630091f";
  const FILTER_CONFIG = {
    area: { field: "Area", display: "Área", options: [], validate: (v) => !!v, filterQuery: (v) => ({ _eq: v }) },
    cliente: { field: "Cliente", display: "Cliente", options: [], validate: (v) => !!v, filterQuery: (v) => ({ _eq: v }) },
    unidad_negocio: { field: "Unidad_de_negocio", display: "Unidad de Negocio", options: [], validate: (v) => !!v, filterQuery: (v) => ({ _eq: v }) }
  };
  let servicios = [];
  let error = null;
  let totalItems = 0;
  let totalPages = 1;
  let randomImages = [];
  let activeFilters = {};
  let searchQuery = "";
  let currentPage = 1;
  const authenticate = async () => {
    const baseUrl = "http://23.105.176.45:8055";
    const staticToken = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky";
    try {
      const response = await fetch(`${baseUrl}/users/me`, {
        headers: { "Authorization": `Bearer ${staticToken}` }
      });
      if (!response.ok) {
        console.error("Authentication failed:", response.status, await response.text());
        throw new Error(`Token inválido o expirado (${response.status})`);
      }
      return { token: staticToken };
    } catch (e) {
      console.error("Error en authenticate:", e);
      throw new Error(`Autenticación fallida: ${e.message}`);
    }
  };
  const fetchRandomImages = async (token) => {
    const baseUrl = "http://23.105.176.45:8055";
    const folderId = "82a1f135-7129-4dcf-bef2-432bec7b7b92";
    try {
      const url = `${baseUrl}/files?filter[folder][_eq]=${folderId}&fields=id,type&filter[type][_starts_with]=image&limit=-1`;
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" } });
      if (!response.ok) {
        console.warn(`Failed to fetch random images: ${response.status}`);
        randomImages = [DEFAULT_IMAGE];
        return;
      }
      const data = await response.json();
      if (data.data?.length) {
        randomImages = data.data.filter((f) => f.id && f.type?.startsWith("image/")).map((f) => `${baseUrl}/assets/${f.id}`);
      }
      if (!randomImages.length) {
        console.warn("No valid random images found in folder, using default.");
        randomImages = [DEFAULT_IMAGE];
      }
    } catch (e) {
      console.error("Error fetching random images:", e);
      randomImages = [DEFAULT_IMAGE];
    }
  };
  const cleanClientName = (name) => {
    if (!name) return "";
    return name.trim().replace(/\s+/g, " ").replace(/^[.,\s]+|[.,\s]+$/g, "").replace(/\b(sa|s\.a\.|s\s*a|s\.a\.b|ltda|ltd|spa)\b/gi, "").trim();
  };
  const normalizeClient = (name) => {
    const cleaned = cleanClientName(name);
    if (!cleaned) return "";
    return cleaned.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };
  const fetchFilterOptions = async (token) => {
    const baseUrl = "http://23.105.176.45:8055";
    try {
      const fields = Object.values(FILTER_CONFIG).map((c) => c.field).join(",");
      const url = `${baseUrl}/items/Antecedentes?fields=${fields}&limit=-1`;
      console.log("[DEBUG Directus fetch] URL:", url, "Token:", token ? token.substring(0, 8) + "..." : "undefined");
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" } });
      if (!response.ok) {
        console.warn(`Failed to fetch filter options: ${response.status}`);
        Object.keys(FILTER_CONFIG).forEach((key) => {
          FILTER_CONFIG[key].options = [];
        });
        return;
      }
      const data = await response.json();
      Object.entries(FILTER_CONFIG).forEach(([key, config]) => {
        let values;
        if (key === "cliente") {
          values = [...new Set(
            data.data?.map((item) => normalizeClient(item[config.field])).filter(Boolean) ?? []
          )].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
        } else {
          values = [...new Set(
            data.data?.map((item) => item[config.field]).filter(Boolean) ?? []
          )].sort();
        }
        config.options = values.map((v) => ({ id: v, name: v }));
      });
    } catch (e) {
      console.error("Error fetching filter options:", e);
      Object.keys(FILTER_CONFIG).forEach((key) => {
        FILTER_CONFIG[key].options = [];
      });
    }
  };
  const fetchServices = async (token, currentFilters, currentSearch, pageNum) => {
    const baseUrl = "http://23.105.176.45:8055";
    const path = "/items/Antecedentes";
    const filter = { _and: [] };
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value && FILTER_CONFIG[key]?.validate(value)) {
        filter._and.push({ [FILTER_CONFIG[key].field]: FILTER_CONFIG[key].filterQuery(value) });
      }
    });
    const params = new URLSearchParams({
      fields: "id,Titulo,Descripcion,Imagen,Fecha,Cliente,Unidad_de_negocio,Area",
      limit: PAGE_SIZE.toString(),
      offset: ((pageNum - 1) * PAGE_SIZE).toString(),
      sort: "-Fecha",
      meta: "*"
    });
    if (filter._and.length > 0) params.append("filter", JSON.stringify(filter));
    if (currentSearch) params.append("search", currentSearch);
    const url = `${baseUrl}${path}?${params}`;
    try {
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" } });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Directus API Error Response:", response.status, errorText);
        throw new Error(`API Error (${response.status})`);
      }
      const data = await response.json();
      const responseData = Array.isArray(data.data) ? data.data : [];
      const count = data.meta?.filter_count ?? data.meta?.total_count ?? 0;
      return { data: responseData, meta: { filter_count: count } };
    } catch (e) {
      console.error("Error during fetch in fetchServices:", e);
      throw new Error(`Fetch services failed: ${e.message}`);
    }
  };
  async function fetchData() {
    console.log("[fetchData] Starting...");
    let requestUrl;
    let searchParams;
    try {
      requestUrl = new URL(Astro2.request.url);
      searchParams = requestUrl.searchParams;
    } catch (e) {
      console.warn("Could not parse Astro.request.url, falling back to Astro.url", e);
      requestUrl = Astro2.url;
      searchParams = requestUrl.searchParams;
    }
    console.log(`[fetchData] Processing URL: ${requestUrl.href}`);
    console.log(`[fetchData] searchParams read: ${searchParams.toString()}`);
    const resetFilters = searchParams.get("reset") === "1";
    const localActiveFilters = resetFilters ? Object.keys(FILTER_CONFIG).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {}) : Object.fromEntries(
      Object.keys(FILTER_CONFIG).map((key) => [key, searchParams.get(key) || ""])
    );
    const localSearchQuery = searchParams.get("q") || "";
    const localCurrentPage = Number(searchParams.get("page")) || 1;
    console.log(`[fetchData] LOCAL State Read - currentPage: ${localCurrentPage}, searchQuery: "${localSearchQuery}", activeFilters:`, localActiveFilters);
    activeFilters = localActiveFilters;
    searchQuery = localSearchQuery;
    currentPage = localCurrentPage;
    try {
      const { token } = await authenticate();
      await Promise.all([
        fetchFilterOptions(token),
        fetchRandomImages(token)
      ]);
      console.log("[fetchData] Aux data loaded, calling fetchServices...");
      const result = await fetchServices(token, localActiveFilters, localSearchQuery, localCurrentPage);
      console.log("[fetchData] fetchServices returned, processing...");
      servicios = result.data.map((servicio) => ({
        ...servicio,
        Imagen: servicio.Imagen ? servicio.Imagen : null
      }));
      totalItems = result.meta.filter_count;
      totalPages = Math.ceil(totalItems / PAGE_SIZE);
      console.log(`[fetchData] Finished. totalItems: ${totalItems}, totalPages: ${totalPages}`);
    } catch (e) {
      console.error("[fetchData] Top Level Error:", e);
      error = e.message || "Ocurrió un error inesperado.";
      servicios = [];
      totalItems = 0;
      totalPages = 1;
    }
  }
  const generateSlug = (titulo = "") => {
    if (!titulo) return "item";
    const slug = String(titulo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
    return slug || "item";
  };
  const generatePaginationNumbers = (currentPage2, totalPages2, maxVisible = 7) => {
    if (totalPages2 <= 1) return [];
    if (totalPages2 <= maxVisible) return Array.from({ length: totalPages2 }, (_, i) => i + 1);
    const sideWidth = Math.floor((maxVisible - 3) / 2);
    const leftWidth = sideWidth;
    const rightWidth = maxVisible - 3 - leftWidth;
    const pages = [1];
    if (currentPage2 > leftWidth + 2) pages.push("...");
    const start = Math.max(2, currentPage2 - leftWidth);
    const end = Math.min(totalPages2 - 1, currentPage2 + rightWidth);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage2 < totalPages2 - rightWidth - 1) pages.push("...");
    pages.push(totalPages2);
    return pages;
  };
  const buildPageUrl = (page = 1, removeFilterKey = null) => {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key !== removeFilterKey && value) params.set(key, value);
    });
    if (searchQuery) params.set("q", searchQuery);
    if (page > 1) params.set("page", page.toString());
    const qs = params.toString();
    return `/antecedentes${qs ? `?${qs}` : ""}`;
  };
  const DEBUG = false;
  const debugLog = (...args) => DEBUG;
  const initialState = {
    servicios: [],
    error: null,
    totalItems: 0,
    totalPages: 1,
    randomImages: [DEFAULT_IMAGE],
    activeFilters: {},
    searchQuery: "",
    currentPage: 1
  };
  let pageData = { ...initialState };
  try {
    debugLog("Iniciando carga de datos");
    await fetchData();
    pageData = {
      servicios,
      error,
      totalItems,
      totalPages,
      randomImages,
      activeFilters,
      searchQuery,
      currentPage
    };
    debugLog("Datos cargados:", { totalItems, error: error || "none" });
  } catch (e) {
    console.error("Error crítico en carga de datos:", e);
    pageData.error = "Error al cargar la página. Por favor, intente nuevamente.";
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Antecedentes" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8">  ${false} <nav class="mb-8"><ol class="flex items-center space-x-2 text-gray-600"><li><a href="/" class="hover:text-blue-600">Inicio</a></li><li><span class="mx-2">/</span></li><li class="text-blue-600 font-medium">Antecedentes</li></ol></nav> <h1 class="text-4xl font-bold mb-8">Nuestros Antecedentes</h1> <form method="GET" action="/antecedentes" class="bg-white p-6 rounded-lg shadow-lg mb-8" id="filterForm"> <input type="hidden" name="page" value="1"> <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"> ${Object.entries(FILTER_CONFIG).map(([key, config]) => renderTemplate`<div class="space-y-1"> <label${addAttribute(`filter-${key}`, "for")} class="block text-sm font-medium text-gray-700">${config.display}</label> <select${addAttribute(`filter-${key}`, "id")}${addAttribute(key, "name")} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"> <option value="">Todos</option> ${config.options.map((option) => renderTemplate`<option${addAttribute(option.id, "value")}${addAttribute(pageData.activeFilters[key] === option.id, "selected")}>${option.name}</option>`)} </select> </div>`)} <div class="space-y-1"> <label for="search-input" class="block text-sm font-medium text-gray-700">Buscar</label> <div class="relative"> <input type="search" id="search-input" name="q"${addAttribute(pageData.searchQuery, "value")} placeholder="Buscar por título..." class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm pr-10"> <button type="submit" class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600" aria-label="Buscar"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"></path></svg> </button> </div> </div> </div> <div class="mt-6 text-right"> <button type="submit" class="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
Aplicar Filtros / Buscar
</button> </div> </form> ${(Object.values(pageData.activeFilters).some(Boolean) || pageData.searchQuery) && renderTemplate`<div class="mb-6"> <div class="bg-blue-50 p-4 rounded-lg border border-blue-200"> <div class="flex items-center justify-between mb-2 flex-wrap gap-2"> <div class="flex items-center gap-2"> <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg> <span class="font-medium text-blue-700"> ${pageData.totalItems === 1 ? "1 resultado encontrado" : `${pageData.totalItems} resultados encontrados`} ${pageData.searchQuery ? ` para "${pageData.searchQuery}"` : ""} ${Object.values(pageData.activeFilters).some(Boolean) ? " con los filtros actuales" : ""} </span> </div> <a href="/antecedentes" class="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"> Limpiar todo <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> </a> </div> <div class="flex flex-wrap gap-2"> ${pageData.searchQuery && renderTemplate`<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"> Búsqueda: "${pageData.searchQuery}" <a${addAttribute(buildPageUrl(1), "href")}${addAttribute((e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.set("page", "1");
    window.location.href = url.toString();
  }, "onclick")} class="ml-2 text-red-500 hover:text-red-700 focus:outline-none" title="Eliminar búsqueda"> × </a> </span>`} ${Object.entries(pageData.activeFilters).map(([key, value]) => value && renderTemplate`<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"> ${FILTER_CONFIG[key].display}: ${value} <a${addAttribute(buildPageUrl(1, key), "href")} class="ml-2 text-red-500 hover:text-red-700 focus:outline-none"${addAttribute(`Eliminar filtro ${FILTER_CONFIG[key].display}`, "title")}> × </a> </span>`)} </div> </div> </div>`} ${pageData.error && renderTemplate`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert"> <strong class="font-bold">Error: </strong> <span class="block sm:inline">${pageData.error}</span> </div>`} ${pageData.servicios.length > 0 && renderTemplate`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> ${pageData.servicios.map((servicio) => renderTemplate`<article class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"> <a${addAttribute(`/antecedentes/${servicio.id}/${generateSlug(servicio.Titulo)}`, "href")} class="block group h-full flex flex-col"> <div class="relative h-48 w-full overflow-hidden"> <img${addAttribute(servicio.Imagen ? `/api/asset/${servicio.Imagen}?width=400&height=250&fit=cover&quality=80` : DEFAULT_IMAGE, "src")}${addAttribute(servicio.Titulo || "Antecedente", "alt")} class="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105" loading="lazy" width="400" height="250"> </div> <div class="p-4 flex flex-col flex-grow"> <h2 class="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">${servicio.Titulo}</h2> <p class="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">${servicio.Descripcion}</p> <div class="mt-auto border-t border-gray-100 pt-3 space-y-1 text-xs text-gray-500"> ${servicio.Fecha && renderTemplate`<div class="flex items-center"><svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg><span>${new Date(servicio.Fecha).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}</span></div>`} ${servicio.Area && renderTemplate`<div class="flex items-center truncate"><svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg><span class="truncate">${servicio.Area}</span></div>`} ${servicio.Cliente && renderTemplate`<div class="flex items-center truncate"><svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg><span class="truncate">${servicio.Cliente}</span></div>`} ${servicio.Unidad_de_negocio && renderTemplate`<div class="flex items-center truncate"><svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg><span class="truncate">${servicio.Unidad_de_negocio}</span></div>`} </div> </div> </a> </article>`)} </div>`} ${pageData.totalPages > 1 && !pageData.error && renderTemplate`<nav class="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4" aria-label="Paginación"> <div class="text-sm text-gray-700"> Mostrando <span class="font-medium">${Math.min((pageData.currentPage - 1) * PAGE_SIZE + 1, pageData.totalItems)}</span> a <span class="font-medium">${Math.min(pageData.currentPage * PAGE_SIZE, pageData.totalItems)}</span> de <span class="font-medium">${pageData.totalItems}</span> resultados </div> <ul class="inline-flex items-center -space-x-px text-sm"> <li> <a${addAttribute(pageData.currentPage > 1 ? buildPageUrl(pageData.currentPage - 1) : "#", "href")}${addAttribute(`flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 ${pageData.currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`, "class")}${addAttribute(pageData.currentPage === 1, "aria-disabled")}${addAttribute(pageData.currentPage === 1 ? -1 : void 0, "tabindex")}> <span class="sr-only">Anterior</span> <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"></path></svg> </a> </li> ${generatePaginationNumbers(pageData.currentPage, pageData.totalPages).map((page, index) => renderTemplate`<li${addAttribute(`page-${page}-${index}`, "key")}> ${typeof page === "number" ? renderTemplate`<a${addAttribute(buildPageUrl(page), "href")}${addAttribute(`flex items-center justify-center px-3 h-8 leading-tight border border-gray-300 ${pageData.currentPage === page ? "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 font-medium" : "text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700"}`, "class")}${addAttribute(pageData.currentPage === page ? "page" : void 0, "aria-current")}> ${page} </a>` : renderTemplate`<span class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300">...</span>`} </li>`)} <li> <a${addAttribute(pageData.currentPage < pageData.totalPages ? buildPageUrl(pageData.currentPage + 1) : "#", "href")}${addAttribute(`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 ${pageData.currentPage === pageData.totalPages ? "opacity-50 cursor-not-allowed" : ""}`, "class")}${addAttribute(pageData.currentPage === pageData.totalPages, "aria-disabled")}${addAttribute(pageData.currentPage === pageData.totalPages ? -1 : void 0, "tabindex")}> <span class="sr-only">Siguiente</span> <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"></path></svg> </a> </li> </ul> </nav>`} ${pageData.servicios.length === 0 && !pageData.error && renderTemplate`<div class="text-center py-16"> <div class="text-gray-400 mb-4"> <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM11.995 12h.01"></path> </svg> </div> <h3 class="text-xl font-semibold text-gray-800 mb-2">No se encontraron resultados</h3> <p class="text-gray-500"> ${pageData.searchQuery || Object.values(pageData.activeFilters).some(Boolean) ? "Prueba ajustar los filtros o el término de búsqueda." : "No hay antecedentes disponibles en este momento."} </p> ${(pageData.searchQuery || Object.values(pageData.activeFilters).some(Boolean)) && renderTemplate`<a href="/antecedentes" class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"> Limpiar búsqueda y filtros </a>`} </div>`}  ${false} </main> ` })} ${renderScript($$result, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/antecedentes/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/antecedentes/index.astro", void 0);
const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/antecedentes/index.astro";
const $$url = "/antecedentes";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
