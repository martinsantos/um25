import { createDirectus, rest, readItems } from '@directus/sdk';

// Export only the configuration, not the client
export const DIRECTUS_CONFIG = {
  url: import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055',
  token: import.meta.env.PUBLIC_DIRECTUS_TOKEN // Optional - collections are public
};

// 1. Tipos compatibles con tus colecciones
type Colecciones = {
  servicios: Servicio;
  blog_posts: EntradaBlog;
  antecedentes: CasoExito; // Nombre real de la colección en Directus
};

// Validación básica de configuración (solo para server-side)
if (typeof import.meta !== 'undefined' && import.meta.env && !DIRECTUS_CONFIG.url) {
  console.warn('Configuración de Directus incompleta - URL requerida');
}

// Exportar cliente sin autenticación para casos específicos
export const getClient = () => {
    return createDirectus(DIRECTUS_CONFIG.url).with(rest());
};

// 5. Tipos según tu estructura actual
export interface Servicio {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  imagen_destacada: ArchivoDirectus | null;
  contenido: string;
  estado: 'publicado' | 'borrador';
  fecha_publicacion?: string;
}

export interface CasoExito {
  id: string;
  titulo: string;
  slug: string;
  resumen: string;
  imagen_portada: ArchivoDirectus | null;
  contenido: string;
  estado: 'publicado' | 'borrador';
  fecha_publicacion: string;
}

export interface EntradaBlog {
  id: string;
  titulo: string;
  slug: string;
  descripcion_corta: string;
  imagen_principal: ArchivoDirectus | null;
  contenido: string;
  estado: 'publicado' | 'borrador';
  fecha_publicacion: string;
}

type ArchivoDirectus = {
  id: string;
  nombre_descarga: string;
  tipo: string;
  ancho?: number;
  alto?: number;
};

// 6. Función genérica para obtener contenido (sin filtro de estado)
const obtenerContenidoPublicado = async (coleccion: string, opciones: { limite?: number } = {}) => {
  try {
    const client = getClient();
    const { limite = 10 } = opciones;

    const items = await client.request(
      readItems(coleccion, {
        limit: limite,
        // No filtrar por estado por ahora
        // sort: ['-fecha_publicacion']
      })
    );
    
    return items;
  } catch (error) {
    console.error(`Error al obtener ${coleccion}:`, error);
    return [];
  }
};

// 7. Funciones específicas para cada colección (nombres actualizados)
export const getServicios = async (limite: number = 10) => 
  obtenerContenidoPublicado('servicios', { limite });

export const getBlogPosts = async (limite: number = 10) => 
  obtenerContenidoPublicado('blog_posts', { limite });

export const getCasosExito = async (limite: number = 10) => 
  obtenerContenidoPublicado('antecedentes', { limite });

// 8. Función especial para el UM CLI - Carga dinámica con cache y fallback
export const getUMCliData = async () => {
  const cache = {
    timestamp: Date.now(),
    servicios: [],
    antecedentes: [],
    casos_de_exito: [], // Alias para compatibilidad
    blog_posts: [],
    estadisticas: null
  };

  try {
    // Cargar en paralelo todos los datos necesarios
    const [servicios, casosExito, blogPosts] = await Promise.all([
      getServicios(20),
      getCasosExito(15), 
      getBlogPosts(10)
    ]);

    cache.servicios = servicios;
    cache.antecedentes = casosExito;
    cache.casos_de_exito = casosExito; // Alias para compatibilidad
    cache.blog_posts = blogPosts;

    // Calcular estadísticas dinámicas
    cache.estadisticas = {
      totalServicios: servicios.length,
      totalCasosExito: casosExito.length,
      totalBlogPosts: blogPosts.length,
      ultimaActualizacion: new Date().toISOString()
    };

    return {
      success: true,
      data: cache
    };
  } catch (error) {
    console.error('Error cargando datos para UM CLI:', error);
    
    // Fallback con datos básicos hardcoded
    return {
      success: false,
      data: {
        servicios: [
          { id: '1', titulo: 'Redes y Comunicaciones', descripcion: 'Diseño e implementación de infraestructura de red' },
          { id: '2', titulo: 'Desarrollo de Software', descripcion: 'Aplicaciones web y sistemas a medida' },
          { id: '3', titulo: 'Seguridad Informática', descripcion: 'Auditorías y consultoría en ciberseguridad' }
        ],
        antecedentes: [
          { id: '1', titulo: 'Gobierno de Mendoza', resumen: 'Modernización completa de la infraestructura IT' },
          { id: '2', titulo: 'Hospital Central', resumen: 'Sistema integrado de gestión hospitalaria' }
        ],
        casos_de_exito: [
          { id: '1', titulo: 'Gobierno de Mendoza', resumen: 'Modernización completa de la infraestructura IT' },
          { id: '2', titulo: 'Hospital Central', resumen: 'Sistema integrado de gestión hospitalaria' }
        ],
        blog_posts: [
          { id: '1', titulo: 'Tendencias IT 2024', descripcion_corta: 'Las tecnologías que marcarán el futuro' }
        ],
        estadisticas: {
          totalServicios: 3,
          totalCasosExito: 2,
          totalBlogPosts: 1,
          ultimaActualizacion: new Date().toISOString(),
          modo: 'fallback'
        }
      },
      error: error.message
    };
  }
};
