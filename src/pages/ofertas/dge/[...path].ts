import type { APIRoute } from 'astro';
import { dgeDemoResponse } from '../../../lib/dge-demo/endpoint.mjs';

export const prerender = false;
export const ALL: APIRoute = ({ request, clientAddress }) => dgeDemoResponse(request, clientAddress);
