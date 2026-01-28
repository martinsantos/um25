import { createDirectus, rest, readItems, readItem } from '@directus/sdk';
import type {
  ServicioV4,
  ProductoV4,
  AntecedenteV4,
  AntecedenteServicioRelation
} from '../types/directus-v4';

// Export only the configuration, not the client
// PRODUCTION: Use localhost for server-side requests (same machine as Directus)
// Client-side image URLs will use public admin URL
export const DIRECTUS_CONFIG = {
  url: 'http://localhost:8055',
  token: import.meta.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky'
};

// 1. Tipos compatibles con tus colecciones (ACTUALIZADOS V4)
type Colecciones = {
  Servicios: ServicioV4; // Nombre correcto con mayúscula (tabla real en DB)
  servicios: ServicioV4; // Alias por compatibilidad legacy
  productos: ProductoV4; // Colección de productos (migrado de JSON a tabla separada)
  Antecedentes: AntecedenteV4; // Nombre correcto con mayúscula (tabla real en DB)
  antecedentes: AntecedenteV4; // Alias por compatibilidad legacy
  antecedentes_servicios: AntecedenteServicioRelation; // NUEVO M2M V4
  blog_posts: EntradaBlog;
  casos_de_exito: CasoExito;
};

// Validación básica de configuración
if (!DIRECTUS_CONFIG.url || !DIRECTUS_CONFIG.token) {
  throw new Error('Configuración de Directus incompleta en .env');
}

// Exportar cliente con tipos para casos específicos
export const getClient = () => {
    return createDirectus<Colecciones>(DIRECTUS_CONFIG.url).with(rest());
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
 * Obtiene todos los servicios V4
 * Usado en páginas de listado de servicios
 * Nota: Productos se cargan por separado con getProductosPorServicio()
 */
export async function getServiciosV4(): Promise<ServicioV4[]> {
  try {
    const client = getClient();
    const response = await client.request(
      readItems('Servicios', {
        fields: [
          'id',
          'Titulo',
          'Descripcion',
          'Imagen',
          'Subtitulo',
          'Stats',
          'PorQueElegirnos',
          'Area',
          'Cliente',
          'Productos'
        ],
        sort: ['id']
      })
    );

    return (response || []) as ServicioV4[];
  } catch (error) {
    console.error('Error fetching servicios V4:', error);
    return [];
  }
}

/**
 * Obtiene un servicio específico con todos sus productos
 * Usado en página de detalle de servicio (/servicios/[id]/[slug])
 * Carga productos desde colección separada con relación M2O
 */
export async function getServicioConProductos(id: number | string): Promise<ServicioV4 | null> {
  try {
    const client = getClient();

    // Query 1: Obtener servicio
    const servicio = await client.request(
      readItem('Servicios', id, {
        fields: [
          'id',
          'Titulo',
          'Descripcion',
          'Imagen',
          'Subtitulo',
          'Stats',
          'PorQueElegirnos',
          'Area',
          'Cliente',
          'Productos'
        ]
      })
    );

    if (!servicio) return null;

    // Query 2: Obtener productos del servicio
    const productos = await getProductosPorServicio(Number(id));

    return {
      ...servicio,
      productos
    } as ServicioV4;
  } catch (error) {
    console.error(`Error fetching servicio ${id}:`, error);
    return null;
  }
}

/**
 * Obtiene los productos de un servicio específico desde la colección "productos"
 * Migrado de campo JSON a tabla separada con relación M2O
 */
export async function getProductosPorServicio(servicioId: number): Promise<ProductoV4[]> {
  try {
    const client = getClient();
    const response = await client.request(
      readItems('productos', {
        filter: { servicio_id: { _eq: servicioId } },
        sort: ['orden'],
        fields: ['*', 'imagen.*']
      })
    );

    return (response || []) as ProductoV4[];
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
    const response = await client.request(
      readItem('Antecedentes', id, {
        fields: [
          '*',
          'servicios_relacionados.Servicios_id.id',
          'servicios_relacionados.Servicios_id.Titulo',
          'servicios_relacionados.Servicios_id.Descripcion',
          'servicios_relacionados.Servicios_id.Imagen',
          'servicios_relacionados.Servicios_id.Area',
          'servicios_relacionados.orden',
          'servicios_relacionados.destacado'
        ]
      })
    );

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
    const response = await client.request(
      readItems('Antecedentes', {
        filter: {
          'servicios_relacionados.Servicios_id': { _eq: servicioId }
        },
        limit,
        sort: ['-date_created'],
        fields: [
          'id',
          'Titulo',
          'Descripcion',
          'Imagen',
          'slug'
        ]
      })
    );

    return (response || []) as AntecedenteV4[];
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
      _and: []
    };

    // Filtro por área si se especifica
    if (area) {
      filters._and.push({ Area: { _eq: area } });
    }

    // Búsqueda por texto en título o descripción
    if (query) {
      filters._and.push({
        _or: [
          { Titulo: { _icontains: query } },
          { Descripcion: { _icontains: query } },
          { Subtitulo: { _icontains: query } }
        ]
      });
    }

    const response = await client.request(
      readItems('Servicios', {
        filter: filters._and.length > 0 ? filters : undefined,
        fields: [
          'id',
          'Titulo',
          'Descripcion',
          'Imagen',
          'Subtitulo',
          'Area',
          'Cliente',
          'Productos'
        ],
        sort: ['Titulo']
      })
    );

    return (response || []) as ServicioV4[];
  } catch (error) {
    console.error('Error searching servicios:', error);
    return [];
  }
}

/**
 * Obtiene todos los productos de la colección productos
 * Útil para listados generales o análisis
 */
export async function getAllProductos(): Promise<ProductoV4[]> {
  try {
    const client = getClient();
    const response = await client.request(
      readItems('productos', {
        sort: ['servicio_id', 'orden'],
        fields: ['*', 'imagen.*'],
        limit: -1
      })
    );

    return (response || []) as ProductoV4[];
  } catch (error) {
    console.error('Error fetching all productos:', error);
    return [];
  }
}

/**
 * Obtiene las imágenes del Hero de la página principal
 * Ordenadas por el campo 'orden'
 */
export async function getHeroHomeImages() {
  try {
    const client = getClient();
    const response = await client.request(
      readItems('Hero_Home', {
        sort: ['orden'],
        fields: ['id', 'titulo', 'orden', 'imagen'],
        limit: -1
      })
    );

    return (response || []) as Array<{
      id: number;
      titulo: string;
      orden: number;
      imagen: string;
    }>;
  } catch (error) {
    console.error('Error fetching Hero_Home images:', error);
    return [];
  }
}

// ==========================================
// 8. EXPORT TYPES (para usar en páginas)
// ==========================================

export type { ServicioV4, ProductoV4, AntecedenteV4, AntecedenteServicioRelation };

// ==========================================
// 9. HELPER FUNCTION - Directus Image URL
// ==========================================

/**
 * Convierte un UUID de imagen de Directus a URL completa
 * Ahora usa URLs relativas para aprovechar el proxy de Nginx
 */
export function getDirectusImageUrl(imageId: string | null | undefined): string {
  if (!imageId) {
    return '/images/default.jpg';
  }

  // Validar que imageId es un UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!uuidRegex.test(imageId)) {
    console.warn(`Invalid UUID format for image: ${imageId}`);
    return '/images/default.jpg';
  }

  // Usar URL relativa - Nginx hará proxy a Directus
  return `/assets/${imageId}`;
}

/**
 * Obtiene todos los antecedentes V4 desde Directus
 * Usado en página de listado de antecedentes con todas las imágenes únicas
 */
export async function getAllAntecedentes(): Promise<AntecedenteV4[]> {
  try {
    const client = getClient();
    const response = await client.request(
      readItems('Antecedentes', {
        fields: [
          'id',
          'Titulo',
          'Descripcion',
          'Cliente',
          'Imagen',
          'Area',
          'Unidad_de_negocio',
          'Fecha',
          'Presupuesto',
          'original_id'
        ],
        sort: ['-Fecha', '-id'],
        limit: -1
      })
    );

    return (response || []) as AntecedenteV4[];
  } catch (error) {
    console.error('Error fetching antecedentes V4:', error);
    return [];
  }
}