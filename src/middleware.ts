import type { MiddlewareHandler } from 'astro';
import { despieceRoute } from './lib/despieceRoutes';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const draft = context.request.method === 'POST' && context.url.pathname === '/contacto' &&
    context.request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded');
  const route = despieceRoute(context.url.pathname, draft ? 'GET' : context.request.method);
  // Apply preview indexing protection to legacy pages as well as rewritten ones.
  // Routing remains unchanged when this flag is absent in production.
  const response = !route ? await next()
    : route.redirect ? context.redirect(route.redirect + context.url.search, 301)
    : await next(new URL(route.rewrite! + context.url.search, context.url));
  if (['/contacto', '/en/contact'].includes(context.url.pathname.replace(/\/$/, ''))) {
    response.headers.set('Cache-Control', 'private, no-store');
  }
  if (process.env['UMSA_PREVIEW'] === '1') response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
};
