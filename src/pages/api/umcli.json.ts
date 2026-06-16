import type { APIRoute } from 'astro';
import { getServicios, getAllAntecedentes, getBlogPosts } from '../../lib/directus';

function normalizeServicioForUmCli(servicio: any) {
  return {
    ...servicio,
    titulo: servicio?.titulo || servicio?.Titulo || servicio?.nombre || '',
    nombre: servicio?.nombre || servicio?.Titulo || servicio?.titulo || '',
    descripcion: servicio?.descripcion || servicio?.Descripcion || '',
    area: servicio?.area || servicio?.Area || '',
  };
}

function normalizeAntecedenteForUmCli(antecedente: any) {
  const titulo = antecedente?.titulo || antecedente?.Titulo || antecedente?.Nombre || '';
  const resumen = antecedente?.resumen || antecedente?.Descripcion || antecedente?.descripcion || '';
  const fechaPublicacion = antecedente?.fecha_publicacion || antecedente?.Fecha || null;

  return {
    ...antecedente,
    titulo,
    nombre: antecedente?.nombre || antecedente?.Nombre || titulo,
    resumen,
    fecha_publicacion: fechaPublicacion,
    cliente: antecedente?.cliente || antecedente?.Cliente || null,
    area: antecedente?.area || antecedente?.Area || antecedente?.Unidad_de_negocio || null,
  };
}

export const GET: APIRoute = async () => {
  try {
    const [serviciosRaw, antecedentesRaw, blog_posts] = await Promise.all([
      getServicios(50),
      getAllAntecedentes(),
      getBlogPosts(50)
    ]);
    const servicios = serviciosRaw.map(normalizeServicioForUmCli);
    const antecedentes = antecedentesRaw.map(normalizeAntecedenteForUmCli);

    const payload = {
      timestamp: Date.now(),
      servicios,
      antecedentes,
      casos_de_exito: antecedentes, // Alias para compatibilidad
      blog_posts,
      estadisticas: {
        totalServicios: servicios.length,
        totalAntecedentes: antecedentes.length,
        totalCasosExito: antecedentes.length, // Alias
        totalBlogPosts: blog_posts.length,
        ultimaActualizacion: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify({ success: true, data: payload }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // Cache en CDN/navegador por 60s, stale-while-revalidate por 5 minutos
        'cache-control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'unknown_error' }),
      {
        status: 502,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      }
    );
  }
};
