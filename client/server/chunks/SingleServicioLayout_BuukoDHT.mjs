import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, K as renderSlot } from './astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from './Layout_CQ6jbdHh.mjs';

const $$Astro = createAstro("http://localhost:4321");
const $$SingleServicioLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SingleServicioLayout;
  const { title, description } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8"> ${renderSlot($$result2, $$slots["default"])} </main> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/layouts/SingleServicioLayout.astro", void 0);

export { $$SingleServicioLayout as $ };
