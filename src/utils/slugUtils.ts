/**
 * Generates a URL-friendly slug from a given text
 * This function ensures consistency across all components
 */
export function generateSlug(text: string = ''): string {
  if (!text || text === null || typeof text === 'undefined') {
    return 'item';
  }
  
  const slug = String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50); // Limit to 50 chars
  
  return slug || 'item';
}
