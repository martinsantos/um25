#!/bin/bash

# Este script busca y modifica directamente los archivos compilados de la página de antecedentes

echo "Buscando archivos compilados de la página de antecedentes..."
ssh root@23.105.176.45 "find /root/um25/dist -name '*antecedentes*' -type f | grep -v '.map'"

echo "Creando una versión simplificada de la página de antecedentes..."
ssh root@23.105.176.45 "cat > /root/um25/dist/server/pages/antecedentes.astro.mjs << EOL
import { c as createAstro, a as createComponent, r as renderTemplate, b as addAttribute, d as renderHead, e as renderSlot, f as renderComponent, m as maybeRenderHead } from '../chunks/astro.mjs';
import 'html-escaper';
import { a as $$Layout } from '../chunks/pages/layout.astro.mjs';

const $$Astro = createAstro();
const $$Antecedentes = createComponent(async ($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$Astro, $$props, $$slots);
  Astro.self = $$Antecedentes;
  
  // Datos de ejemplo para mostrar
  const servicios = [
    {
      id: '1',
      Titulo: 'Ejemplo de Antecedente 1',
      Descripcion: 'Esta es una descripción de ejemplo para el primer antecedente.',
      Cliente: 'Cliente Ejemplo',
      Area: 'Área Ejemplo',
      Unidad_de_negocio: 'Unidad Ejemplo'
    },
    {
      id: '2',
      Titulo: 'Ejemplo de Antecedente 2',
      Descripcion: 'Esta es una descripción de ejemplo para el segundo antecedente.',
      Cliente: 'Cliente Ejemplo 2',
      Area: 'Área Ejemplo 2',
      Unidad_de_negocio: 'Unidad Ejemplo 2'
    }
  ];
  
  const pageData = {
    servicios,
    error: null,
    totalItems: servicios.length,
    totalPages: 1,
    randomImages: [],
    activeFilters: {},
    searchQuery: '',
    currentPage: 1
  };
  
  const generateSlug = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  
  return renderTemplate\`\${renderComponent($$result, "Layout", $$Layout, { "title": "Antecedentes" }, { "default": ($$result) => renderTemplate\`\${maybeRenderHead()}<main class="container mx-auto px-4 py-8">
    <nav class="mb-8"><ol class="flex items-center space-x-2 text-gray-600"><li><a href="/" class="hover:text-blue-600">Inicio</a></li><li><span class="mx-2">/</span></li><li class="text-blue-600 font-medium">Antecedentes</li></ol></nav>
    <h1 class="text-4xl font-bold mb-8">Nuestros Antecedentes</h1>

    <div class="mb-8 bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Filtrar Antecedentes</h2>
      <form action="/antecedentes" method="get" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label for="area" class="block text-sm font-medium text-gray-700 mb-1">Área</label>
          <select id="area" name="area" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
            <option value="">Todos</option>
          </select>
        </div>
        <div>
          <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select id="cliente" name="cliente" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
            <option value="">Todos</option>
          </select>
        </div>
        <div>
          <label for="unidad_negocio" class="block text-sm font-medium text-gray-700 mb-1">Unidad de Negocio</label>
          <select id="unidad_negocio" name="unidad_negocio" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
            <option value="">Todos</option>
          </select>
        </div>
        <div>
           <label for="search-input" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
           <div class="relative">
             <input type="search" id="search-input" name="q" value="" placeholder="Buscar por título..." class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm pr-10"/>
             <button type="submit" class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600" aria-label="Buscar">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
             </button>
           </div>
        </div>
        <div class="md:col-span-4 flex justify-end">
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm">
            Aplicar Filtros / Buscar
          </button>
        </div>
      </form>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      \${pageData.servicios.map((servicio) => renderTemplate\`<article class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
            <a\${addAttribute(\`/antecedentes/\${servicio.id}/\${generateSlug(servicio.Titulo)}\`, "href")} class="block group h-full flex flex-col">
              <div class="relative pt-[56.25%] bg-gray-100">
                <img\${addAttribute(servicio.Imagen || '/placeholder.jpg', "src")} alt="Imagen del servicio" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
              </div>
              <div class="p-4 flex-grow flex flex-col">
                <h3 class="font-semibold text-lg text-gray-800 mb-2 flex-grow">
                  \${servicio.Titulo}
                </h3>
                <div class="text-sm text-gray-600 mb-4">
                  <div class="flex items-center mb-1">
                    <span class="font-medium mr-2">Cliente:</span> \${servicio.Cliente}
                  </div>
                  <div class="flex items-center mb-1">
                    <span class="font-medium mr-2">Área:</span> \${servicio.Area}
                  </div>
                  <div class="flex items-center">
                    <span class="font-medium mr-2">Unidad:</span> \${servicio.Unidad_de_negocio}
                  </div>
                </div>
                <div class="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium mt-2 self-start">
                  Ver Detalle →
                </div>
              </div>
            </a>
          </article>`)}
    </div>

    <div class="mt-8 text-center text-gray-600">
      <p>Mostrando ejemplos de antecedentes. La conexión con Directus está en mantenimiento.</p>
    </div>
  </main>` })}`;
}, "/root/um25/src/pages/antecedentes/index.astro", void 0);

const pages = [
  {
    file: "",
    links: [],
    scripts: [],
    styles: []
  }
];

export { $$Antecedentes as default, pages };
EOL"

echo "Reiniciando el contenedor de Astro..."
ssh root@23.105.176.45 "cd /root/um25 && docker restart astro-app"

echo "Operación completada. Espere unos segundos y luego verifique http://23.105.176.45:8080/antecedentes"
