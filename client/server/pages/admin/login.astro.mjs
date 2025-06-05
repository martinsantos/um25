/* empty css                                    */
import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B7qweUek.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CQ6jbdHh.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("http://localhost:4321");
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  if (Astro2.request.method === "POST") {
    try {
      const data = await Astro2.request.formData();
      const password = data.get("password");
      if (password === process.env.ADMIN_SECRET) {
        Astro2.cookies.set("adminAuth", process.env.ADMIN_SECRET, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 60 * 60 * 24
          // 24 horas
        });
        return Astro2.redirect("/admin/comments");
      }
    } catch (error) {
      console.error("Error en el login:", error);
    }
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Admin Login" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen flex items-center justify-center bg-gray-100"> <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md"> <h1 class="text-2xl font-bold text-center mb-6">Acceso Administrativo</h1> <form method="POST" class="space-y-6"> <div> <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
Contraseña
</label> <input type="password" id="password" name="password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"> </div> <button type="submit" class="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
Iniciar Sesión
</button> </form> </div> </main> ` })}`;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/admin/login.astro", void 0);

const $$file = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/pages/admin/login.astro";
const $$url = "/admin/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Login,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
