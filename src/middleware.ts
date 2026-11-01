import type { MiddlewareHandler } from 'astro';
import { despieceRoute } from './lib/despieceRoutes';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const route = despieceRoute(context.url.pathname, context.request.method);
  if (!route) return next();
  if (route.redirect) return context.redirect(route.redirect + context.url.search, 301);
  // next(URL) rewrites once without recursively re-entering middleware.
  const target = new URL(route.rewrite! + context.url.search, context.url);
  const response = await next(target);
  if (process.env['UMSA_PREVIEW'] === '1') response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
};
