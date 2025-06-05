/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$SingleServicioLayout } from '../../chunks/SingleServicioLayout_BuukoDHT.mjs';
export { renderers } from '../../renderers.mjs';

const $$Ciberseguridad = createComponent(($$result, $$props, $$slots) => {
  const servicio = {
    titulo: "Servicios de Ciberseguridad",
    descripcionCorta: "Protege tu empresa con nuestras soluciones integrales de ciberseguridad"};
  return renderTemplate`${renderComponent($$result, "SingleServicioLayout", $$SingleServicioLayout, { "title": servicio.titulo, "description": servicio.descripcionCorta }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Nuestros Servicios de Ciberseguridad</h2> <p class="mb-4">
Ofrecemos una gama completa de servicios de ciberseguridad diseñados para proteger 
            su empresa contra las amenazas digitales modernas.
</p> <div class="grid md:grid-cols-2 gap-6 mt-8"> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Auditoría de Seguridad</h3> <p>Evaluación completa de la infraestructura de seguridad de su empresa.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Protección contra Malware</h3> <p>Soluciones avanzadas de detección y prevención de malware.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Seguridad en la Nube</h3> <p>Protección integral para sus datos y aplicaciones en la nube.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Respuesta a Incidentes</h3> <p>Equipo especializado en respuesta rápida ante incidentes de seguridad.</p> </div> </div> </section> <section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">¿Por qué elegirnos?</h2> <ul class="list-disc pl-6 space-y-2"> <li>Experiencia comprobada en ciberseguridad</li> <li>Soluciones personalizadas según sus necesidades</li> <li>Monitoreo 24/7</li> <li>Equipo certificado de expertos</li> </ul> </section> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/ciberseguridad.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/ciberseguridad.astro";
const $$url = "/servicios/ciberseguridad";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Ciberseguridad,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
