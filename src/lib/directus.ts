import { Directus } from '@directus/sdk';
import type {
  ServicioV4,
  ProductoV4,
  AntecedenteV4,
  AntecedenteServicioRelation
} from '../types/directus-v4';

// Export only the configuration, not the client
export const DIRECTUS_CONFIG = {
  url: import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055',
  token: import.meta.env.PUBLIC_DIRECTUS_TOKEN
};

// 1. Tipos compatibles con tus colecciones (ACTUALIZADOS V4)
type Colecciones = {
  Servicios: ServicioV4; // Nombre correcto con mayúscula
  servicios: ServicioV4; // Alias por compatibilidad
  productos: ProductoV4; // NUEVO V4
  antecedentes: AntecedenteV4; // EXTENDIDO V4
  antecedentes_servicios: AntecedenteServicioRelation; // NUEVO M2M V4
  blog_posts: EntradaBlog;
  casos_de_exito: CasoExito;
};

// Validación básica de configuración
if (!DIRECTUS_CONFIG.url || !DIRECTUS_CONFIG.token) {
  throw new Error('Configuración de Directus incompleta en .env');
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

// 6. Funciones específicas para cada colección (LEGACY - mantener por compatibilidad)
export const getServicios = async (limite: number = 10) =>
  obtenerContenidoPublicado('servicios', { limite });

export const getBlogPosts = async (limite: number = 10) =>
  obtenerContenidoPublicado('blog_posts', { limite });

export const getCasosExito = async (limite: number = 10) =>
  obtenerContenidoPublicado('casos_de_exito', { limite });

// ==========================================
// 7. FUNCIONES V4 - Sistema de Diseño V4
// ==========================================

/**
 * Obtiene todos los servicios V4 con sus productos
 * Usado en páginas de listado de servicios
 */
export async function getServiciosV4(): Promise<ServicioV4[]> {
  try {
    const client = getClient();
    const response = await client.items('Servicios').readByQuery({
      filter: {
        estado: { _eq: 'publicado' }
      },
      fields: [
        'id',
        'Titulo',
        'Descripcion',
        'Imagen',
        'subtitulo',
        'stats',
        'marcas',
        'por_que_elegirnos',
        'area',
        'slug',
        'productos.*' // Incluir todos los productos relacionados
      ],
      sort: ['id']
    });

    return (response.data || []) as ServicioV4[];
  } catch (error) {
    console.error('Error fetching servicios V4:', error);
    return [];
  }
}

/**
 * Obtiene un servicio específico con todos sus productos
 * Usado en página de detalle de servicio (/servicios/[id]/[slug])
 */
export async function getServicioConProductos(id: number | string): Promise<ServicioV4 | null> {
  try {
    const client = getClient();
    const response = await client.items('Servicios').readOne(id, {
      fields: [
        'id',
        'Titulo',
        'Descripcion',
        'Imagen',
        'subtitulo',
        'stats',
        'marcas',
        'por_que_elegirnos',
        'area',
        'slug',
        'productos.*' // Incluir todos los productos con todos sus campos
      ]
    });

    return response as ServicioV4;
  } catch (error) {
    console.error(`Error fetching servicio ${id}:`, error);
    return null;
  }
}

/**
 * Obtiene los productos de un servicio específico
 * Útil para cargar productos de forma lazy
 */
export async function getProductosPorServicio(servicioId: number): Promise<ProductoV4[]> {
  try {
    const client = getClient();
    const response = await client.items('productos').readByQuery({
      filter: {
        servicio_id: { _eq: servicioId },
        estado: { _eq: 'publicado' }
      },
      sort: ['orden', 'id'],
      fields: ['*']
    });

    return (response.data || []) as ProductoV4[];
  } catch (error) {
    console.error(`Error fetching productos for servicio ${servicioId}:`, error);
    return [];
  }
}

/**
 * Obtiene un antecedente con sus servicios relacionados (M2M)
 * Usado en página de detalle de antecedente (/antecedentes/[id]/[slug])
 */
export async function getAntecedenteConServicios(id: number | string): Promise<AntecedenteV4 | null> {
  try {
    const client = getClient();
    const response = await client.items('antecedentes').readOne(id, {
      fields: [
        '*',
        'servicios_relacionados.Servicios_id.id',
        'servicios_relacionados.Servicios_id.Titulo',
        'servicios_relacionados.Servicios_id.Descripcion',
        'servicios_relacionados.Servicios_id.Imagen',
        'servicios_relacionados.Servicios_id.area',
        'servicios_relacionados.Servicios_id.slug',
        'servicios_relacionados.orden',
        'servicios_relacionados.destacado'
      ]
    });

    return response as AntecedenteV4;
  } catch (error) {
    console.error(`Error fetching antecedente ${id} with services:`, error);
    return null;
  }
}

/**
 * Obtiene antecedentes relacionados con un servicio específico (reverso M2M)
 * Útil para mostrar proyectos en la página de un servicio
 */
export async function getAntecedentesPorServicio(servicioId: number, limit: number = 6): Promise<AntecedenteV4[]> {
  try {
    const client = getClient();
    const response = await client.items('antecedentes').readByQuery({
      filter: {
        'servicios_relacionados.Servicios_id': { _eq: servicioId }
      },
      limit,
      sort: ['-date_created'],
      fields: [
        'id',
        'Nombre',
        'Descripcion',
        'Imagen',
        'slug'
      ]
    });

    return (response.data || []) as AntecedenteV4[];
  } catch (error) {
    console.error(`Error fetching antecedentes for servicio ${servicioId}:`, error);
    return [];
  }
}

/**
 * Búsqueda de servicios por área o palabra clave
 * Útil para filtros y búsqueda
 */
export async function buscarServicios(query: string, area?: string): Promise<ServicioV4[]> {
  try {
    const client = getClient();
    const filters: any = {
      _and: [
        { estado: { _eq: 'publicado' } }
      ]
    };

    // Filtro por área si se especifica
    if (area) {
      filters._and.push({ area: { _eq: area } });
    }

    // Búsqueda por texto en título o descripción
    if (query) {
      filters._and.push({
        _or: [
          { Titulo: { _icontains: query } },
          { Descripcion: { _icontains: query } },
          { subtitulo: { _icontains: query } }
        ]
      });
    }

    const response = await client.items('Servicios').readByQuery({
      filter: filters,
      fields: [
        'id',
        'Titulo',
        'Descripcion',
        'Imagen',
        'subtitulo',
        'area',
        'slug'
      ],
      sort: ['Titulo']
    });

    return (response.data || []) as ServicioV4[];
  } catch (error) {
    console.error('Error searching servicios:', error);
    return [];
  }
}

// ==========================================
// 8. EXPORT TYPES (para usar en páginas)
// ==========================================

export type { ServicioV4, ProductoV4, AntecedenteV4, AntecedenteServicioRelation };