/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$SingleServicioLayout } from '../../chunks/SingleServicioLayout_BuukoDHT.mjs';
export { renderers } from '../../renderers.mjs';

const $$SoporteTecnico = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SingleServicioLayout", $$SingleServicioLayout, { "title": "Soporte T\xE9cnico", "description": "Asistencia t\xE9cnica especializada 24/7" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Servicios de Soporte</h2> <p class="mb-4">
Brindamos soporte técnico integral para mantener sus sistemas funcionando de manera óptima.
</p> <div class="grid md:grid-cols-2 gap-6 mt-8"> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Help Desk</h3> <p>Atención de incidencias y resolución de problemas.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Soporte Remoto</h3> <p>Asistencia técnica a distancia inmediata.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Mantenimiento Preventivo</h3> <p>Revisiones periódicas y actualizaciones.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Soporte On-Site</h3> <p>Asistencia técnica presencial cuando se requiera.</p> </div> </div> </section> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/soporte-tecnico.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/soporte-tecnico.astro";
const $$url = "/servicios/soporte-tecnico";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$SoporteTecnico,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
