/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$SingleServicioLayout } from '../../chunks/SingleServicioLayout_BuukoDHT.mjs';
export { renderers } from '../../renderers.mjs';

const $$ConsultoriaIt = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SingleServicioLayout", $$SingleServicioLayout, { "title": "Consultor\xEDa IT", "description": "Asesoramiento estrat\xE9gico para la transformaci\xF3n digital de su empresa" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Servicios de Consultoría</h2> <p class="mb-4">
Ofrecemos asesoramiento experto para optimizar sus procesos tecnológicos y potenciar su negocio.
</p> <div class="grid md:grid-cols-2 gap-6 mt-8"> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Transformación Digital</h3> <p>Estrategias para modernizar su empresa.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Optimización de Procesos</h3> <p>Mejora de eficiencia operativa mediante tecnología.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Auditoría Tecnológica</h3> <p>Evaluación y recomendaciones de mejora.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Gestión de Proyectos IT</h3> <p>Dirección y supervisión de proyectos tecnológicos.</p> </div> </div> </section> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/consultoria-it.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/consultoria-it.astro";
const $$url = "/servicios/consultoria-it";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$ConsultoriaIt,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
