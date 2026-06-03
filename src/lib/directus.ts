import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';
import type {
  ServicioV4,
  ProductoV4,
  AntecedenteV4,
  AntecedenteServicioRelation
} from '../types/directus-v4';
import { getDirectusInternalUrl, getDirectusToken, isLocalProdReplica } from '../config/runtime';

// SSR: misma máquina que Directus (prod :8055, réplica local vía túnel o localhost)
export const DIRECTUS_CONFIG = {
  url: getDirectusInternalUrl(),
  token: getDirectusToken(),
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

if (!DIRECTUS_CONFIG.url) {
  throw new Error('Configuración de Directus incompleta: falta DIRECTUS_INTERNAL_URL o PUBLIC_DIRECTUS_URL');
}

if (!DIRECTUS_CONFIG.token && !isLocalProdReplica()) {
  throw new Error('Configuración de Directus incompleta: falta PUBLIC_DIRECTUS_TOKEN o DIRECTUS_STATIC_TOKEN');
}

// Exportar cliente con tipos para casos específicos
export const getClient = () => {
  const client = createDirectus<Colecciones>(DIRECTUS_CONFIG.url);

  if (DIRECTUS_CONFIG.token) {
    return client.with(staticToken(DIRECTUS_CONFIG.token)).with(rest());
  }

  return client.with(rest());
};

async function loadSnapshotData<T>(fileName: string): Promise<T[]> {
  const snapshot = await import(`../data/snapshots/${fileName}.json`);
  return (snapshot.data || snapshot.default?.data || []) as T[];
}

async function getServicioFromSnapshot(numId: number): Promise<ServicioV4 | null> {
  const allServicios = await loadSnapshotData<ServicioV4>('servicios');
  const servicio = allServicios.find((s) => Number(s.id) === numId);
  if (!servicio) return null;
  const productos = await getProductosPorServicio(numId);
  return { ...servicio, productos } as ServicioV4;
}

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
  status: 'published' | 'draft' | 'scheduled';
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_portada: string | null;
  imagen_portada_alt?: string;
  categoria: 'noticias' | 'proyectos' | 'tecnico' | 'tecnologia' | 'empresa';
  tags: string[];
  fecha_publicacion: string;
  fecha_modificacion?: string;
  tiempo_lectura: number;
  // SEO override fields (optional — filled via Directus admin)
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  // Social overrides
  social_image?: string;
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

    const list = (response || []) as ServicioV4[];
    if (list.length > 0) return list;

    console.warn('[directus] Servicios vacíos desde API, usando snapshot');
    return loadSnapshotData<ServicioV4>('servicios');
  } catch (error) {
    console.error('Error fetching servicios V4, trying snapshot:', error);
    try {
      return loadSnapshotData<ServicioV4>('servicios');
    } catch {
      return [];
    }
  }
}

/**
 * Obtiene un servicio específico con todos sus productos
 * Usado en página de detalle de servicio (/servicios/[id]/[slug])
 * Carga productos desde colección separada con relación M2O
 */
export async function getServicioConProductos(id: number | string): Promise<ServicioV4 | null> {
  const numId = Number(id);
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

    if (!servicio) {
      console.warn(`[directus] Servicio ${id} no encontrado en API, usando snapshot`);
      return getServicioFromSnapshot(numId);
    }

    const productos = await getProductosPorServicio(numId);
    return {
      ...servicio,
      productos,
    } as ServicioV4;
  } catch (error) {
    console.error(`Error fetching servicio ${id}, trying snapshot:`, error);
    try {
      return getServicioFromSnapshot(numId);
    } catch {
      return null;
    }
  }
}

/**
 * Obtiene los productos de un servicio específico.
 * Producción todavía no tiene la colección Directus "productos"; usar snapshot evita
 * 403 recurrentes hasta que se migre el schema CMS.
 * IMPORTANTE: Filtra duplicados basados en título para evitar mostrar productos repetidos
 */
export async function getProductosPorServicio(servicioId: number): Promise<ProductoV4[]> {
  try {
    const allProductos = await loadSnapshotData<ProductoV4>('productos');
    const productos = allProductos.filter((p: any) => p.servicio_id === servicioId);
    const seen = new Set<string>();
    return productos.filter((producto) => {
      const titulo = producto.titulo?.toLowerCase().trim();
      if (!titulo || seen.has(titulo)) return false;
      seen.add(titulo);
      return true;
    });
  } catch {
    return [];
  }
}

/**
 * Obtiene un antecedente con sus servicios relacionados (M2M)
 * Usado en página de detalle de antecedente (/antecedentes/[id]/[slug])
 */
export async function getAntecedenteConServicios(id: number | string): Promise<AntecedenteV4 | null> {
  const numId = Number(id);
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
    console.error(`Error fetching antecedente ${id} with services, trying snapshot:`, error);
    try {
      const allAntecedentes = await loadSnapshotData<AntecedenteV4>('antecedentes');
      const antecedente = allAntecedentes.find((a: any) => Number(a.id) === numId);
      return antecedente || null;
    } catch {
      return null;
    }
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
        sort: ['-Fecha', '-id'],
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
    console.error('Error fetching Hero_Home images, trying snapshot:', error);
    try {
      const snapshot = await import('../data/snapshots/hero.json');
      return (snapshot.data || snapshot.default?.data || []) as Array<{
        id: number;
        titulo: string;
        orden: number;
        imagen: string;
      }>;
    } catch {
      return [];
    }
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
 * Convierte un UUID de imagen de Directus a URL utilizable.
 *
 * Estrategia:
 * 1. Si Directus disponible → /assets/{uuid} (Nginx proxy, 518 imágenes únicas)
 * 2. Si Directus caído → fallback a imagen local mapeada (image-local-map.json)
 *
 * El mapa local se genera con: node scripts/generate-image-map.mjs
 */
const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// Mapa de UUIDs a imágenes locales (servicios, productos, hero)
let imageLocalMap: Record<string, string> = {};
try {
  const mapModule = await import('../data/image-local-map.json');
  imageLocalMap = mapModule.default || mapModule;
  const mapSize = Object.keys(imageLocalMap).length;
  console.log(`[directus] Loaded ${mapSize} image mappings from local map`);
} catch (error) {
  console.error('[directus] Failed to load image-local-map.json:', error);
  // No map available, will use Directus URLs
}

let generatedAntecedenteImageMap: Record<string, string> = {};
try {
  const mapModule = await import('../data/antecedentes-generated-image-map.json');
  generatedAntecedenteImageMap = mapModule.default || mapModule;
  const mapSize = Object.keys(generatedAntecedenteImageMap).length;
  console.log(`[directus] Loaded ${mapSize} generated antecedente image mappings`);
} catch {
  generatedAntecedenteImageMap = {};
}

// IMPORTANT: Directus /assets/ endpoint requires authentication (403 Forbidden)
// We always use local images for service thumbnails instead of Directus assets
// This avoids build-time vs runtime inconsistencies and auth issues
const directusAssetsAvailable = false;
console.log('[directus] Using local images for all service content (Directus assets require auth)');

// Cache-bust version: incrementar cuando se actualizan imágenes en Directus
const IMAGE_CACHE_VERSION = '20260201';

export function getDirectusImageUrl(imageId: string | null | undefined): string {
  if (!imageId) {
    console.warn('[directus] getDirectusImageUrl called with empty imageId');
    return '';
  }
  if (!uuidRegex.test(imageId)) {
    console.warn(`[directus] Invalid UUID format: ${imageId}`);
    return '';
  }

  // Prioridad 1: Directus /assets/ (deshabilitado por 403 auth)
  if (directusAssetsAvailable) {
    return `/assets/${imageId}?v=${IMAGE_CACHE_VERSION}`;
  }

  // Prioridad 2: fallback local si Directus no disponible
  const localPath = imageLocalMap[imageId];
  if (localPath) {
    return localPath;
  }

  // Réplica: convención pública de prod (/uploads/antecedentes/{uuid}.jpg)
  if (isLocalProdReplica()) {
    return `/uploads/antecedentes/${imageId}.jpg`;
  }

  console.warn(`[directus] No local mapping for UUID ${imageId}, using default placeholder`);
  return '/images/default-background.jpg';
}

/**
 * Devuelve la URL de fallback local para una imagen de Directus.
 * Para uso en onerror de <img> tags.
 */
export function getDirectusImageFallback(imageId: string | null | undefined): string {
  if (!imageId) return '/images/default-background.jpg';
  if (!uuidRegex.test(imageId)) return '/images/default-background.jpg';
  const localPath = imageLocalMap[imageId];
  if (localPath) return localPath;
  return '/images/default-background.jpg';
}

export function getGeneratedAntecedenteImageUrl(id: string | number | null | undefined): string {
  if (id === null || id === undefined || id === '') return '';
  return generatedAntecedenteImageMap[String(id)] || '';
}

export function getAntecedenteImageUrl(
  item: { id?: string | number | null; original_id?: string | number | null; Imagen?: string | null } | null | undefined
): string {
  if (!item) return '/images/default-background.jpg';
  const generatedImage = getGeneratedAntecedenteImageUrl(item.id) || getGeneratedAntecedenteImageUrl(item.original_id);
  if (generatedImage) return generatedImage;
  return getDirectusImageUrl(item.Imagen) || '/images/default-background.jpg';
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
    console.error('Error fetching antecedentes V4, trying snapshot:', error);
    try {
      const snapshot = await import('../data/snapshots/antecedentes.json');
      const items = (snapshot.data || snapshot.default?.data || []) as AntecedenteV4[];
      return items.sort((a, b) => {
        return (b.Fecha || '').localeCompare(a.Fecha || '');
      });
    } catch { return []; }
  }
}
