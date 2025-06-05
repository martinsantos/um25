export const generateSlug = (titulo = '') => {
  if (!titulo) return 'item';
  let slug = String(titulo).toLowerCase();
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  slug = slug.replace(/[^\w\s-]/g, '');
  slug = slug.trim();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  slug = slug.slice(0, 50);
  return slug || 'item';
};
