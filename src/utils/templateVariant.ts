export type DevTemplateVariant = 'editorial' | 'atlas';

const allowedTemplateVariants = new Set<DevTemplateVariant>(['editorial', 'atlas']);

export function getDevTemplateVariant(url: URL, isDev: boolean): DevTemplateVariant | null {
  if (!isDev) return null;

  const value = url.searchParams.get('template');
  if (allowedTemplateVariants.has(value as DevTemplateVariant)) return value as DevTemplateVariant;
  return 'editorial';
}
