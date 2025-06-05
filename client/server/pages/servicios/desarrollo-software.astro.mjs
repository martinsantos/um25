/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$SingleServicioLayout } from '../../chunks/SingleServicioLayout_BuukoDHT.mjs';
export { renderers } from '../../renderers.mjs';

const $$DesarrolloSoftware = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SingleServicioLayout", $$SingleServicioLayout, { "title": "Desarrollo de Software", "description": "Soluciones de software personalizadas para impulsar su negocio" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Nuestros Servicios de Desarrollo</h2> <p class="mb-4">
Desarrollamos soluciones de software a medida que se adaptan perfectamente a sus necesidades empresariales.
</p> <div class="grid md:grid-cols-2 gap-6 mt-8"> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Desarrollo Web</h3> <p>Sitios y aplicaciones web modernas y responsivas.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Aplicaciones Móviles</h3> <p>Apps nativas y multiplataforma para iOS y Android.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Software Empresarial</h3> <p>Sistemas de gestión y automatización de procesos.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">APIs y Microservicios</h3> <p>Integración y desarrollo de servicios escalables.</p> </div> </div> </section> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/desarrollo-software.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/desarrollo-software.astro";
const $$url = "/servicios/desarrollo-software";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$DesarrolloSoftware,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
