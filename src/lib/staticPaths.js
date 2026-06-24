import { directus } from './directus';

const generateSlug = (titulo = '') => {
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

export async function generateStaticPaths() {
  try {
    const response = await directus.get('/items/Servicios', {
      params: {
        fields: 'id,Titulo',
        limit: -1
      }
    });
    const services = response.data?.data;

    if (!Array.isArray(services)) {
      console.error('generateStaticPaths: Failed to fetch services or received invalid data:', services);
      return [];
    }

    const paths = services.map(servicio => {
      const slug = generateSlug(servicio.Titulo);
      return {
        params: { id: String(servicio.id), slug }
      };
    });
    return paths;

  } catch (error) {
    console.error('Error in generateStaticPaths:', error);
    return [];
  }
}
