import corrections from '../data/blogEditorialCorrections.json';

export const BLOG_REVIEWED_AT = '2026-11-04T20:01:37Z';
type Post = { slug: string; titulo: string; resumen?: string; contenido?: string; meta_title?: string; meta_description?: string; fecha_modificacion?: string };
type Rule = { title?: string; summary?: string; body?: string; paragraphs?: { contains: string; html: string }[]; links?: Record<string, string> };
const rules: Record<string, Rule> = corrections;

/** Reviewed presentation corrections. CMS edits newer than this review take precedence.
 * Never changes the original publication date, identity, assigned cover or image text.
 */
export function correctBlogEditorial<T extends Post>(post: T): T {
  const rule = rules[post.slug];
  if (!rule || (post.fecha_modificacion && Date.parse(post.fecha_modificacion) > Date.parse(BLOG_REVIEWED_AT))) return post;
  const result = { ...post };
  if (rule.title) { result.titulo = rule.title; result.meta_title = rule.title; }
  if (rule.summary) { result.resumen = rule.summary; result.meta_description = rule.summary; }
  if (typeof post.contenido === 'string') {
    let body = rule.body || post.contenido;
    for (const replacement of rule.paragraphs || []) {
      body = body.replace(/<(p|li)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi, (block) => block.includes(replacement.contains) ? replacement.html : block);
      // Directus also stores Markdown. Replace only its affected list item or paragraph.
      if (body.includes(replacement.contains)) {
        if (replacement.html.startsWith('<li>')) {
          body = body.split('\n').map(line => /^\s*(?:[-*+] |\d+[.)] )/.test(line) && line.includes(replacement.contains) ? `${line.match(/^\s*/)?.[0] || ''}- ${replacement.html.replace(/^<li>|<\/li>$/g, '')}` : line).join('\n');
        } else {
          body = body.split(/\n\s*\n/).map(block => !/<(?:p|li)\b/i.test(block) && block.includes(replacement.contains) ? replacement.html : block).join('\n\n');
        }
      }
    }
    for (const [oldUrl, newUrl] of Object.entries(rule.links || {})) body = body.split(oldUrl).join(newUrl);
    result.contenido = body;
  }
  result.fecha_modificacion = BLOG_REVIEWED_AT;
  return result;
}
