/* empty css                                 */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CQ6jbdHh.mjs';
export { renderers } from '../renderers.mjs';

const $$About = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Acerca de Nosotros" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8"> <h1 class="text-4xl font-bold text-center mb-12">Acerca de Nosotros</h1> <div class="grid grid-cols-1 md:grid-cols-2 gap-12"> <div> <h2 class="text-2xl font-semibold mb-4">Nuestra Historia</h2> <p class="text-gray-700 mb-6">
Con más de una década de experiencia en el mercado, nos hemos consolidado como 
					líderes en soluciones empresariales innovadoras. Nuestra trayectoria está marcada 
					por el compromiso con la excelencia y la satisfacción del cliente.
</p> <h2 class="text-2xl font-semibold mb-4">Nuestra Visión</h2> <p class="text-gray-700">
Aspiramos a ser reconocidos globalmente como la empresa líder en soluciones 
					empresariales, estableciendo nuevos estándares de calidad e innovación en la industria.
</p> </div> <div> <h2 class="text-2xl font-semibold mb-4">Nuestro Equipo</h2> <p class="text-gray-700 mb-6">
Contamos con un equipo multidisciplinario de profesionales altamente calificados, 
					comprometidos con la excelencia y la innovación continua.
</p> <div class="bg-white p-6 rounded-lg shadow-lg"> <h3 class="text-xl font-semibold mb-4">Nuestros Logros</h3> <ul class="list-disc list-inside text-gray-700"> <li>Más de 1000 proyectos exitosos</li> <li>Presencia en múltiples países</li> <li>Certificaciones internacionales</li> <li>Reconocimientos de la industria</li> </ul> </div> </div> </div> <div class="mt-12 text-center"> <a href="/contact" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
Contáctanos
</a> </div> </main> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/about.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$About,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
