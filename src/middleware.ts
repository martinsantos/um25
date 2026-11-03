import type { MiddlewareHandler } from 'astro';
import { despieceRoute } from './lib/despieceRoutes';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const route = despieceRoute(context.url.pathname, context.request.method);
  // Apply preview indexing protection to legacy pages as well as rewritten ones.
  // Routing remains unchanged when this flag is absent in production.
  const response = !route ? await next()
    : route.redirect ? context.redirect(route.redirect + context.url.search, 301)
    : await next(new URL(route.rewrite! + context.url.search, context.url));
  if (process.env['UMSA_PREVIEW'] === '1') response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
};
