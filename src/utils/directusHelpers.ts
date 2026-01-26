/**
 * DIRECTUS HELPERS V4 - Con fallback a datos JS
 *
 * Funciones de alto nivel para obtener datos de Directus con fallback automático
 * a los datos hardcodeados en servicios_completos_v4.js si Directus falla.
 *
 * Patrón de uso:
 * 1. Intentar obtener de Directus
 * 2. Si falla, usar datos JS hardcodeados
 * 3. Loguear advertencia en modo dev
 */

import type { ServicioV4, ProductoV4, AntecedenteV4 } from '../types/directus-v4';
import {
  getServiciosV4,
  getServicioConProductos,
  getProductosPorServicio,
  getAntecedenteConServicios,
  getAntecedentesPorServicio,
  buscarServicios
} from '../lib/directus';

// Import datos JS como fallback
import {
  serviciosCompletos,
  getServicioCompleto,
  listarServicios
} from '../data/servicios_completos_v4.js';

const IS_DEV = import.meta.env.DEV;

// ==========================================
// HELPERS CON FALLBACK
// ==========================================

/**
 * Obtiene todos los servicios con fallback a datos JS
 */
export async function getAllServicios(): Promise<ServicioV4[]> {
  try {
    const servicios = await getServiciosV4();

    if (servicios && servicios.length > 0) {
      if (IS_DEV) {
        console.log(`✅ Loaded ${servicios.length} servicios from Directus`);
      }
      return servicios;
    }

    // Fallback a datos JS
    if (IS_DEV) {
      console.warn('⚠️ Directus returned empty, falling back to JS data');
    }
    return convertServiciosJSToDirectus(listarServicios());
  } catch (error) {
    if (IS_DEV) {
      console.error('❌ Error fetching servicios from Directus:', error);
      console.log('🔄 Falling back to JS data');
    }

    // Fallback completo a datos JS
    return convertServiciosJSToDirectus(listarServicios());
  }
}

/**
 * Obtiene un servicio con sus productos, con fallback a datos JS
 */
export async function getServicioById(id: number | string): Promise<ServicioV4 | null> {
  const numId = typeof id === 'string' ? parseInt(id) : id;

  try {
    const servicio = await getServicioConProductos(numId);

    if (servicio) {
      if (IS_DEV) {
        console.log(`✅ Loaded servicio ${numId} from Directus with ${servicio.productos?.length || 0} productos`);
      }
      return servicio;
    }

    // Fallback a datos JS
    if (IS_DEV) {
      console.warn(`⚠️ Servicio ${numId} not found in Directus, falling back to JS data`);
    }
    const servicioJS = getServicioCompleto(numId);
    return servicioJS ? convertServicioJSToDirectus(servicioJS) : null;
  } catch (error) {
    if (IS_DEV) {
      console.error(`❌ Error fetching servicio ${numId} from Directus:`, error);
      console.log('🔄 Falling back to JS data');
    }

    const servicioJS = getServicioCompleto(numId);
    return servicioJS ? convertServicioJSToDirectus(servicioJS) : null;
  }
}

/**
 * Obtiene productos de un servicio con fallback
 */
export async function getProductos(servicioId: number): Promise<ProductoV4[]> {
  try {
    const productos = await getProductosPorServicio(servicioId);

    if (productos && productos.length > 0) {
      if (IS_DEV) {
        console.log(`✅ Loaded ${productos.length} productos for servicio ${servicioId} from Directus`);
      }
      return productos;
    }

    // Fallback a datos JS
    if (IS_DEV) {
      console.warn(`⚠️ No productos found in Directus for servicio ${servicioId}, falling back to JS data`);
    }
    const servicioJS = getServicioCompleto(servicioId);
    return servicioJS?.Productos
      ? servicioJS.Productos.map((p: any, idx: number) => convertProductoJSToDirectus(p, servicioId, idx))
      : [];
  } catch (error) {
    if (IS_DEV) {
      console.error(`❌ Error fetching productos for servicio ${servicioId}:`, error);
      console.log('🔄 Falling back to JS data');
    }

    const servicioJS = getServicioCompleto(servicioId);
    return servicioJS?.Productos
      ? servicioJS.Productos.map((p: any, idx: number) => convertProductoJSToDirectus(p, servicioId, idx))
      : [];
  }
}

/**
 * Obtiene antecedente con servicios relacionados (M2M) con fallback
 */
export async function getAntecedenteWithServices(id: number | string): Promise<AntecedenteV4 | null> {
  const numId = typeof id === 'string' ? parseInt(id) : id;

  try {
    const antecedente = await getAntecedenteConServicios(numId);

    if (antecedente) {
      if (IS_DEV) {
        console.log(`✅ Loaded antecedente ${numId} from Directus with ${antecedente.servicios_relacionados?.length || 0} servicios`);
      }
      return antecedente;
    }

    // Fallback: obtener antecedente sin M2M
    // (Esto requeriría lógica adicional con areaToServiceMap.js)
    if (IS_DEV) {
      console.warn(`⚠️ Antecedente ${numId} not found in Directus or M2M not configured`);
    }
    return null;
  } catch (error) {
    if (IS_DEV) {
      console.error(`❌ Error fetching antecedente ${numId} from Directus:`, error);
    }
    return null;
  }
}

/**
 * Obtiene antecedentes por servicio (reverso M2M)
 */
export async function getProyectosPorServicio(servicioId: number, limit: number = 6): Promise<AntecedenteV4[]> {
  try {
    const antecedentes = await getAntecedentesPorServicio(servicioId, limit);

    if (antecedentes && antecedentes.length > 0) {
      if (IS_DEV) {
        console.log(`✅ Loaded ${antecedentes.length} antecedentes for servicio ${servicioId}`);
      }
      return antecedentes;
    }

    if (IS_DEV) {
      console.warn(`⚠️ No antecedentes found for servicio ${servicioId} (M2M may not be configured)`);
    }
    return [];
  } catch (error) {
    if (IS_DEV) {
      console.error(`❌ Error fetching antecedentes for servicio ${servicioId}:`, error);
    }
    return [];
  }
}

/**
 * Busca servicios por query y/o área
 */
export async function searchServicios(query: string, area?: string): Promise<ServicioV4[]> {
  try {
    const servicios = await buscarServicios(query, area);

    if (servicios && servicios.length > 0) {
      if (IS_DEV) {
        console.log(`✅ Found ${servicios.length} servicios matching "${query}"${area ? ` in area "${area}"` : ''}`);
      }
      return servicios;
    }

    // Fallback: búsqueda manual en datos JS
    if (IS_DEV) {
      console.warn(`⚠️ No results from Directus, searching in JS data`);
    }
    return searchInJSData(query, area);
  } catch (error) {
    if (IS_DEV) {
      console.error('❌ Error searching servicios:', error);
      console.log('🔄 Falling back to JS search');
    }
    return searchInJSData(query, area);
  }
}

// ==========================================
// FUNCIONES DE CONVERSIÓN JS → Directus
// ==========================================

/**
 * Convierte un servicio del formato JS al formato Directus V4
 */
function convertServicioJSToDirectus(servicioJS: any): ServicioV4 {
  return {
    id: servicioJS.id,
    Titulo: servicioJS.Titulo,
    Descripcion: servicioJS.Descripcion,
    Imagen: servicioJS.Imagen,
    subtitulo: servicioJS.Subtitulo,
    stats: servicioJS.Stats,
    marcas: servicioJS.Marcas,
    por_que_elegirnos: servicioJS.PorQueElegirnos,
    area: servicioJS.Area,
    slug: generateSlug(servicioJS.Titulo),
    estado: 'publicado',
    productos: servicioJS.Productos
      ? servicioJS.Productos.map((p: any, idx: number) =>
          convertProductoJSToDirectus(p, servicioJS.id, idx)
        )
      : []
  };
}

/**
 * Convierte array de servicios JS a formato Directus
 */
function convertServiciosJSToDirectus(serviciosJS: any[]): ServicioV4[] {
  return serviciosJS.map(convertServicioJSToDirectus);
}

/**
 * Convierte un producto JS al formato Directus
 */
function convertProductoJSToDirectus(productoJS: any, servicioId: number, orden: number): ProductoV4 {
  return {
    id: orden + 1, // ID temporal para productos de fallback
    servicio_id: servicioId,
    titulo: productoJS.titulo,
    descripcion: productoJS.descripcion,
    imagen: productoJS.imagen,
    features: productoJS.features,
    destacado: productoJS.destacado,
    marcas: productoJS.marcas || [],
    orden: orden,
    estado: 'publicado'
  };
}

/**
 * Genera un slug URL-friendly a partir del título
 */
function generateSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
}

/**
 * Búsqueda manual en datos JS (fallback)
 */
function searchInJSData(query: string, area?: string): ServicioV4[] {
  const allServicios = listarServicios();
  const lowerQuery = query.toLowerCase();

  return allServicios
    .filter((s: any) => {
      // Filtro por área
      if (area && s.Area !== area) {
        return false;
      }

      // Búsqueda por texto
      return (
        s.Titulo.toLowerCase().includes(lowerQuery) ||
        s.Descripcion.toLowerCase().includes(lowerQuery) ||
        s.Subtitulo?.toLowerCase().includes(lowerQuery)
      );
    })
    .map(convertServicioJSToDirectus);
}

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Verifica si Directus está disponible y configurado
 */
export async function checkDirectusHealth(): Promise<boolean> {
  try {
    const servicios = await getServiciosV4();
    return servicios !== null && servicios.length > 0;
  } catch {
    return false;
  }
}

/**
 * Obtiene URL completa de una imagen de Directus
 */
export function getDirectusImageUrl(imageId: string | undefined, fallback: string = '/images/placeholder.jpg'): string {
  if (!imageId) return fallback;

  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

  // Si ya es una URL completa, devolverla tal cual
  if (imageId.startsWith('http')) {
    return imageId;
  }

  // Si es un UUID de Directus, construir la URL
  return `${directusUrl}/assets/${imageId}`;
}

/**
 * Genera thumbnail optimizado de una imagen de Directus
 */
export function getDirectusThumbnail(
  imageId: string | undefined,
  width: number = 400,
  height?: number,
  quality: number = 80
): string {
  if (!imageId) return '/images/placeholder.jpg';

  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

  if (imageId.startsWith('http')) {
    return imageId;
  }

  const params = new URLSearchParams({
    width: width.toString(),
    quality: quality.toString(),
    format: 'webp'
  });

  if (height) {
    params.set('height', height.toString());
    params.set('fit', 'cover');
  }

  return `${directusUrl}/assets/${imageId}?${params.toString()}`;
}
