import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CPU-neay.mjs';
import { manifest } from './manifest_rxN5iJ_6.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/admin/comments.astro.mjs');
const _page3 = () => import('./pages/admin/login.astro.mjs');
const _page4 = () => import('./pages/antecedentes/deltete - index.astro.mjs');
const _page5 = () => import('./pages/antecedentes/_id_/_slug_.astro.mjs');
const _page6 = () => import('./pages/antecedentes.astro.mjs');
const _page7 = () => import('./pages/api/asset/_id_.astro.mjs');
const _page8 = () => import('./pages/api/comments/_id_/reply.astro.mjs');
const _page9 = () => import('./pages/api/comments/_id_/_action_.astro.mjs');
const _page10 = () => import('./pages/api/comments.astro.mjs');
const _page11 = () => import('./pages/api/contact.astro.mjs');
const _page12 = () => import('./pages/api/get-articles.astro.mjs');
const _page13 = () => import('./pages/blog/ciberseguridad-2024.astro.mjs');
const _page14 = () => import('./pages/blog/cloud-computing-recursos.astro.mjs');
const _page15 = () => import('./pages/blog/old-index.astro.mjs');
const _page16 = () => import('./pages/blog/_slug_.astro.mjs');
const _page17 = () => import('./pages/blog.astro.mjs');
const _page18 = () => import('./pages/casos/_slug_.astro.mjs');
const _page19 = () => import('./pages/casos-de-exito/finanzastech.astro.mjs');
const _page20 = () => import('./pages/casos-de-exito.astro.mjs');
const _page21 = () => import('./pages/contact.astro.mjs');
const _page22 = () => import('./pages/contacto.astro.mjs');
const _page23 = () => import('./pages/items/antecedentes.json.astro.mjs');
const _page24 = () => import('./pages/nosotros.astro.mjs');
const _page25 = () => import('./pages/oldservicios.astro.mjs');
const _page26 = () => import('./pages/robots.txt.astro.mjs');
const _page27 = () => import('./pages/rss.xml.astro.mjs');
const _page28 = () => import('./pages/servicios/ciberseguridad.astro.mjs');
const _page29 = () => import('./pages/servicios/cloud-computing.astro.mjs');
const _page30 = () => import('./pages/servicios/consultoria-it.astro.mjs');
const _page31 = () => import('./pages/servicios/desarrollo-software.astro.mjs');
const _page32 = () => import('./pages/servicios/infraestructura.astro.mjs');
const _page33 = () => import('./pages/servicios/soporte-tecnico.astro.mjs');
const _page34 = () => import('./pages/servicios/_id_/_slug_.astro.mjs');
const _page35 = () => import('./pages/servicios.astro.mjs');
const _page36 = () => import('./pages/sitemap.xml.astro.mjs');
const _page37 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/admin/comments.astro", _page2],
    ["src/pages/admin/login.astro", _page3],
    ["src/pages/antecedentes/DELTETE - index.astro", _page4],
    ["src/pages/antecedentes/[id]/[slug].astro", _page5],
    ["src/pages/antecedentes/index.astro", _page6],
    ["src/pages/api/asset/[id].ts", _page7],
    ["src/pages/api/comments/[id]/reply.ts", _page8],
    ["src/pages/api/comments/[id]/[action].ts", _page9],
    ["src/pages/api/comments.ts", _page10],
    ["src/pages/api/contact.ts", _page11],
    ["src/pages/api/get-articles.js", _page12],
    ["src/pages/blog/ciberseguridad-2024.astro", _page13],
    ["src/pages/blog/cloud-computing-recursos.astro", _page14],
    ["src/pages/blog/old-index.astro", _page15],
    ["src/pages/blog/[slug].astro", _page16],
    ["src/pages/blog.astro", _page17],
    ["src/pages/casos/[slug].astro", _page18],
    ["src/pages/casos-de-exito/finanzastech.astro", _page19],
    ["src/pages/casos-de-exito.astro", _page20],
    ["src/pages/contact.astro", _page21],
    ["src/pages/contacto.astro", _page22],
    ["src/pages/items/antecedentes.json.ts", _page23],
    ["src/pages/nosotros.astro", _page24],
    ["src/pages/oldservicios.astro", _page25],
    ["src/pages/robots.txt.ts", _page26],
    ["src/pages/rss.xml.js", _page27],
    ["src/pages/servicios/ciberseguridad.astro", _page28],
    ["src/pages/servicios/cloud-computing.astro", _page29],
    ["src/pages/servicios/consultoria-it.astro", _page30],
    ["src/pages/servicios/desarrollo-software.astro", _page31],
    ["src/pages/servicios/infraestructura.astro", _page32],
    ["src/pages/servicios/soporte-tecnico.astro", _page33],
    ["src/pages/servicios/[id]/[slug].astro", _page34],
    ["src/pages/servicios/index.astro", _page35],
    ["src/pages/sitemap.xml.ts", _page36],
    ["src/pages/index.astro", _page37]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/Shared/Files%20From%20d.localized/D/ultima%20milla/2024/MKT%202024/umw141024/umw46-main/fumbling-field/dist/client/",
    "server": "file:///Users/Shared/Files%20From%20d.localized/D/ultima%20milla/2024/MKT%202024/umw141024/umw46-main/fumbling-field/dist/server/",
    "host": true,
    "port": 4321,
    "assets": "_astro"
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
