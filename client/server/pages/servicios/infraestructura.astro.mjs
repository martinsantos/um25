/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$SingleServicioLayout } from '../../chunks/SingleServicioLayout_BuukoDHT.mjs';
export { renderers } from '../../renderers.mjs';

const $$Infraestructura = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SingleServicioLayout", $$SingleServicioLayout, { "title": "Infraestructura IT", "description": "Soluciones de infraestructura robustas y escalables" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Servicios de Infraestructura</h2> <p class="mb-4">
Diseñamos y gestionamos infraestructuras tecnológicas que garantizan la continuidad y eficiencia de su negocio.
</p> <div class="grid md:grid-cols-2 gap-6 mt-8"> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Redes y Comunicaciones</h3> <p>Diseño e implementación de redes empresariales.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Servidores y Virtualización</h3> <p>Gestión de servidores y entornos virtualizados.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Almacenamiento y Backup</h3> <p>Soluciones de almacenamiento y respaldo de datos.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Monitoreo y Mantenimiento</h3> <p>Supervisión proactiva y mantenimiento preventivo.</p> </div> </div> </section> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/infraestructura.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/infraestructura.astro";
const $$url = "/servicios/infraestructura";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Infraestructura,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
