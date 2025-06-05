import { b as createAstro, c as createComponent, m as maybeRenderHead, r as renderComponent, d as renderScript, a as renderTemplate, J as renderHead, e as addAttribute, K as renderSlot } from './astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Image } from './_astro_assets_Buv-e0eA.mjs';
/* empty css                                  */

const logoImage = new Proxy({"src":"/_astro/um-logo.DueBykIf.png","width":2743,"height":1172,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/assets/images/um-logo.png";
							}
							
							return target[name];
						}
					});

const $$Astro$1 = createAstro("http://localhost:4321");
const $$Navigation = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Navigation;
  Astro2.url.pathname;
  return renderTemplate`${maybeRenderHead()}<nav class="navigation"> <div class="logo"> <a href="/"> ${renderComponent($$result, "Image", $$Image, { "src": logoImage, "alt": "Logo Ultima Milla", "width": 200, "height": 70, "quality": 100, "class": "logo-image" })} </a> </div> <div class="hamburger-menu"> <span></span> <span></span> <span></span> </div> <ul> <li><a href="/">Inicio</a></li> <li><a href="/servicios">Servicios</a></li> <li><a href="/antecedentes">Antecedentes</a></li> <li><a href="/casos-de-exito">Casos de Éxito</a></li> <li><a href="/blog">Blog</a></li> <li><a href="/nosotros">Nosotros</a></li> <li><a href="/contacto">Contacto</a></li> </ul> </nav> ${renderScript($$result, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/components/Navigation.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/components/Navigation.astro", void 0);

const $$Astro = createAstro("http://localhost:4321");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, image, services } = Astro2.props;
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><title>${title}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/global.css">${renderHead()}</head> <body> <header${addAttribute(image ? `background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${image}); background-size: cover; background-position: center; background-repeat: no-repeat; height: 300px;` : "", "style")}>  </header> ${renderComponent($$result, "Navigation", $$Navigation, {})} ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
