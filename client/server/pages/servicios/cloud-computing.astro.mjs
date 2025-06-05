/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$SingleServicioLayout } from '../../chunks/SingleServicioLayout_BuukoDHT.mjs';
export { renderers } from '../../renderers.mjs';

const $$CloudComputing = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SingleServicioLayout", $$SingleServicioLayout, { "title": "Cloud Computing", "description": "Soluciones en la nube para optimizar y escalar su negocio" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Nuestros Servicios de Cloud Computing</h2> <p class="mb-4">
Transforme su negocio con nuestras soluciones de cloud computing, diseñadas para 
            maximizar la eficiencia y reducir costos operativos.
</p> <div class="grid md:grid-cols-2 gap-6 mt-8"> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Migración a la Nube</h3> <p>Transición segura y eficiente de sus sistemas a la nube.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Infraestructura como Servicio (IaaS)</h3> <p>Recursos de computación flexibles y escalables según demanda.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Plataforma como Servicio (PaaS)</h3> <p>Entornos de desarrollo y despliegue completamente gestionados.</p> </div> <div class="p-6 border rounded-lg shadow-sm"> <h3 class="text-xl font-semibold mb-3">Software como Servicio (SaaS)</h3> <p>Aplicaciones empresariales accesibles desde cualquier lugar.</p> </div> </div> </section> <section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Beneficios del Cloud Computing</h2> <ul class="list-disc pl-6 space-y-2"> <li>Reducción significativa de costos de infraestructura</li> <li>Escalabilidad inmediata según las necesidades</li> <li>Alta disponibilidad y redundancia</li> <li>Acceso seguro desde cualquier ubicación</li> <li>Respaldo y recuperación de datos automatizados</li> </ul> </section> <section class="mb-12"> <h2 class="text-2xl font-semibold mb-4">Nuestro Enfoque</h2> <p class="mb-4">
Trabajamos con las principales plataformas cloud del mercado:
</p> <ul class="list-disc pl-6 space-y-2"> <li>Amazon Web Services (AWS)</li> <li>Microsoft Azure</li> <li>Google Cloud Platform</li> <li>IBM Cloud</li> </ul> </section> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/cloud-computing.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/servicios/cloud-computing.astro";
const $$url = "/servicios/cloud-computing";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$CloudComputing,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
