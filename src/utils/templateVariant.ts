export type DevTemplateVariant = 'editorial' | 'atlas';

const allowedTemplateVariants = new Set<DevTemplateVariant>(['editorial', 'atlas']);

export function getDevTemplateVariant(url: URL, isDev: boolean): DevTemplateVariant | null {
  if (!isDev) return null;

  const value = url.searchParams.get('template');
  if (!value) return null;

  return allowedTemplateVariants.has(value as DevTemplateVariant)
    ? (value as DevTemplateVariant)
    : null;
}
