/* empty css                                    */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CQ6jbdHh.mjs';
export { renderers } from '../../renderers.mjs';

const $$Finanzastech = createComponent(($$result, $$props, $$slots) => {
  const caso = {
    titulo: "FinanzasTech: Transformaci\xF3n Digital en el Sector Financiero",
    descripcion: "C\xF3mo ayudamos a una empresa financiera a modernizar su infraestructura tecnol\xF3gica",
    cliente: "FinanzasTech",
    industria: "Servicios Financieros",
    duracion: "8 meses",
    resultados: [
      "Reducci\xF3n del 40% en costos operativos",
      "Mejora del 60% en tiempo de respuesta",
      "Implementaci\xF3n exitosa de sistema cloud",
      "Aumento del 30% en satisfacci\xF3n del cliente"
    ]
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": caso.titulo, "description": caso.descripcion }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8"> <article class="max-w-4xl mx-auto"> <header class="mb-8"> <h1 class="text-4xl font-bold mb-4">${caso.titulo}</h1> <p class="text-xl text-gray-600">${caso.descripcion}</p> </header> <div class="grid md:grid-cols-2 gap-6 mb-8"> <div class="p-6 bg-gray-50 rounded-lg"> <h2 class="text-xl font-semibold mb-3">Detalles del Proyecto</h2> <ul class="space-y-2"> <li><strong>Cliente:</strong> ${caso.cliente}</li> <li><strong>Industria:</strong> ${caso.industria}</li> <li><strong>Duración:</strong> ${caso.duracion}</li> </ul> </div> </div> <section class="mb-8"> <h2 class="text-2xl font-semibold mb-4">Resultados Clave</h2> <ul class="list-disc pl-6 space-y-2"> ${caso.resultados.map((resultado) => renderTemplate`<li>${resultado}</li>`)} </ul> </section> <section class="prose max-w-none"> <h2>El Desafío</h2> <p>FinanzasTech enfrentaba el reto de modernizar su infraestructura tecnológica obsoleta mientras mantenía la continuidad operativa de sus servicios financieros críticos.</p> <h2>Nuestra Solución</h2> <p>Implementamos una estrategia de transformación digital por fases que incluía:</p> <ul> <li>Migración gradual a la nube</li> <li>Modernización de aplicaciones legacy</li> <li>Implementación de sistemas de seguridad avanzados</li> <li>Capacitación del personal en nuevas tecnologías</li> </ul> </section> </article> </main> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/casos-de-exito/finanzastech.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/casos-de-exito/finanzastech.astro";
const $$url = "/casos-de-exito/finanzastech";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Finanzastech,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
