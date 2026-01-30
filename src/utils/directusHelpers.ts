/**
 * DIRECTUS HELPERS V4 - Directus-only (sin fallback)
 *
 * Funciones de alto nivel para obtener datos de Directus.
 * Todo el contenido se sirve desde Directus CMS, sin sistema de fallback.
 *
 * Migrado: 2026-01-27
 * - Eliminado sistema de fallback a datos JS
 * - Todos los productos migrados a colección "productos"
 * - Imágenes migradas a Directus assets
 */

import type { ServicioV4, ProductoV4, AntecedenteV4 } from '../types/directus-v4';
import {
  getServiciosV4,
  getServicioConProductos,
  getProductosPorServicio,
  getAntecedenteConServicios,
  getAntecedentesPorServicio,
  buscarServicios
} from '../lib/directus.ts';

const IS_DEV = import.meta.env.DEV;

// ==========================================
// HELPERS DIRECTUS-ONLY
// ==========================================

/**
 * Obtiene todos los servicios desde Directus
 */
export async function getAllServicios(): Promise<ServicioV4[]> {
  try {
    const servicios = await getServiciosV4();

    if (!servicios || servicios.length === 0) {
      console.warn('⚠️ No services found in Directus');
      return [];
    }

    if (IS_DEV) {
      console.log(`✅ Loaded ${servicios.length} servicios from Directus`);
    }

    return servicios;
  } catch (error) {
    console.error('❌ Error fetching servicios from Directus:', error);
    throw error;
  }
}

/**
 * Obtiene un servicio con sus productos desde Directus
 */
export async function getServicioById(id: number | string): Promise<ServicioV4 | null> {
  const numId = typeof id === 'string' ? parseInt(id) : id;

  try {
    const servicio = await getServicioConProductos(numId);

    if (!servicio) {
      console.warn(`⚠️ Servicio ${numId} not found in Directus`);
      return null;
    }

    if (IS_DEV) {
      console.log(`✅ Loaded servicio ${numId} with ${servicio.productos?.length || 0} productos`);
    }

    return servicio;
  } catch (error) {
    console.error(`❌ Error fetching servicio ${numId}:`, error);
    throw error;
  }
}

/**
 * Obtiene productos de un servicio desde Directus
 */
export async function getProductos(servicioId: number): Promise<ProductoV4[]> {
  try {
    const productos = await getProductosPorServicio(servicioId);

    if (IS_DEV) {
      console.log(`✅ Loaded ${productos.length} productos for servicio ${servicioId}`);
    }

    return productos;
  } catch (error) {
    console.error(`❌ Error fetching productos for servicio ${servicioId}:`, error);
    throw error;
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
 * Busca servicios por query y/o área en Directus
 */
export async function searchServicios(query: string, area?: string): Promise<ServicioV4[]> {
  try {
    const servicios = await buscarServicios(query, area);

    if (IS_DEV) {
      console.log(`✅ Found ${servicios.length} servicios matching "${query}"${area ? ` in area "${area}"` : ''}`);
    }

    return servicios;
  } catch (error) {
    console.error('❌ Error searching servicios:', error);
    throw error;
  }
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

// getDirectusImageUrl y getDirectusThumbnail eliminados — usar import { getDirectusImageUrl } from '../lib/directus.ts'
