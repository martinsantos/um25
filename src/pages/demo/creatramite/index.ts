import type { APIRoute } from 'astro';
import { proxyDemo } from '../../../lib/creatramite-proxy.mjs';

export const prerender = false;
const handle: APIRoute = ({ request }) => proxyDemo(request);
export { handle as GET, handle as HEAD, handle as POST, handle as PUT, handle as OPTIONS };
