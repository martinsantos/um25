// Configuración de Directus
import 'dotenv/config';
import { antecedentesReales } from '../data/antecedentes_completos.js';
import { getFixedImage } from './imageFixer.js';
import fallbackData from '../data/directus_fallback_offline.json';
import { REPAIR_MAP } from '../data/repair_mapping.js';

const DIRECTUS_CONFIG = {
  // URL pública corregida para usar el proxy Nginx
  PUBLIC_URL: 'https://ultimamilla.com.ar',
  // URL interna para peticiones del servidor
  API_URL: process.env.DIRECTUS_URL || 'http://localhost:8055',
  EMAIL: process.env.DIRECTUS_EMAIL || 'admin@umbot.com.ar',
  PASSWORD: process.env.DIRECTUS_PASSWORD || 'UmbotAdmin2025!',
  TOKEN: process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
  DEFAULT_IMAGE: '/images/antecedentes-hero-bg.jpg', // Professional dark blue gradient - NOT green ALF
  PAGE_SIZE: 12
};

// Mapeo de categorías a imágenes generadas únicas
const CATEGORY_IMAGES = {
  // CCTV / Seguridad
  'CCTV': '/images/generated/cctv_control_room_1768353676992.png',
  'Seguridad': '/images/generated/cctv_control_room_1768353676992.png',
  'Control de Acceso': '/images/generated/access_control_biometric_1768353716905.png',
  'Biométrico': '/images/generated/access_control_biometric_1768353716905.png',
  
  // Detección de Incendio
  'SDI': '/images/generated/fire_detection_system_1768353731995.png',
  'Detección de Incendio': '/images/generated/fire_detection_system_1768353731995.png',
  'Sistema de Alarma': '/images/generated/fire_detection_system_1768353731995.png',
  
  // Redes / Cableado
  'Cableado Estructurado': '/images/generated/structured_cabling_patch_1768353747209.png',
  'Redes de Datos': '/images/generated/structured_cabling_patch_1768353747209.png',
  'Networking': '/images/generated/structured_cabling_patch_1768353747209.png',
  
  // Fibra Óptica
  'Fibra Óptica': '/images/generated/fiber_optic_installation_1768353661641.png',
  'Fibra': '/images/generated/fiber_optic_installation_1768353661641.png',
  
  // Datacenter / Servidores
  'Datacenter': '/images/generated/networking_datacenter_racks_1768353647752.png',
  'Servidores': '/images/generated/networking_datacenter_racks_1768353647752.png',
  'Infraestructura IT': '/images/generated/networking_datacenter_racks_1768353647752.png',
  'Soluciones Tecnológicas': '/images/generated/networking_datacenter_racks_1768353647752.png',
  
  // Telecomunicaciones
  'Telecomunicaciones': '/images/generated/telecom_radio_tower_1768353762111.png',
  'Radioenlaces': '/images/generated/telecom_radio_tower_1768353762111.png',
  'Radio': '/images/generated/telecom_radio_tower_1768353762111.png',
  
  // Bodegas
  'Bodega': '/images/generated/bodega_tech_overlay_1768237851113.png',
  'Vitivinícola': '/images/generated/bodega_tech_overlay_1768237851113.png',
  
  // Gobierno
  'Gobierno': '/images/generated/gobierno_digital_overlay_1768237887931.png',
  'Sector Público': '/images/generated/gobierno_digital_overlay_1768237887931.png',
  'Gobierno & Sector Público': '/images/generated/gobierno_digital_overlay_1768237887931.png',
  
  // Salud
  'Salud & Sector Salud': '/images/generated/hospital_medical_tech_1768237918477.png',
  'Salud': '/images/generated/hospital_medical_tech_1768237918477.png',
  'Infraestructura Hospitalaria': '/images/generated/hospital_medical_tech_1768237918477.png',
  
  // Fallbacks genéricos
  'default': '/images/generated/server_room_maintenance_tech_1768237985687.png'
};

// Array de todas las imágenes generadas para distribución por hash de ID (30 total)
const ALL_GENERATED_IMAGES = [
  // CCTV/Vigilancia (4)
  '/images/generated/cctv_control_room_1768353676992.png',
  '/images/generated/cctv_outdoor_dome_1768387262497.png',
  '/images/generated/cctv_ptz_camera_1768387278707.png',
  '/images/generated/cctv_video_wall_1768387292977.png',
  // Control de Acceso (4)
  '/images/generated/access_control_biometric_1768353716905.png',
  '/images/generated/access_facial_scan_1768387321512.png',
  '/images/generated/access_smart_lock_1768387335317.png',
  '/images/generated/access_turnstile_1768387308294.png',
  // Detección de Incendio (5)
  '/images/generated/fire_detection_system_1768353731995.png',
  '/images/generated/fire_control_panel_1768387370236.png',
  '/images/generated/fire_smoke_detector_1768387384551.png',
  '/images/generated/fire_sprinkler_system_1768387402715.png',
  '/images/generated/fire_safety_industrial_sensors_1768237918477.png',
  // Datacenter/Redes (4)
  '/images/generated/datacenter_corridor_1768387417712.png',
  '/images/generated/datacenter_technician_1768387433623.png',
  '/images/generated/networking_datacenter_racks_1768353647752.png',
  '/images/generated/network_rack_cabling_1768387461455.png',
  // Cableado Estructurado (1)
  '/images/generated/structured_cabling_patch_1768353747209.png',
  // Fibra Óptica (4)
  '/images/generated/fiber_optic_installation_1768353661641.png',
  '/images/generated/fiber_splicing_1768387509213.png',
  '/images/generated/fiber_cable_tray_1768387523814.png',
  '/images/generated/fiber_outdoor_cabinet_1768387538667.png',
  // Telecomunicaciones (4)
  '/images/generated/telecom_radio_tower_1768353762111.png',
  '/images/generated/telecom_antenna_array_1768387553993.png',
  '/images/generated/telecom_microwave_dish_1768387570110.png',
  '/images/generated/telecom_equipment_room_1768387584754.png',
  // Otros (4)
  '/images/generated/bodega_tech_overlay_1768237851113.png',
  '/images/generated/gobierno_digital_overlay_1768237887931.png',
  '/images/generated/server_room_maintenance_tech_1768237985687.png',
  '/images/generated/security_camera_analytics_overlay_1768237955796.png'
];

// Función para obtener imagen única basada en ID del proyecto
// Usa siempre el ID para garantizar que cada proyecto tenga una imagen diferente
function getCategoryImage(item) {
  // Extraer ID numérico del proyecto
  let numericId = 0;
  
  if (item.id) {
    if (typeof item.id === 'number') {
      numericId = item.id;
    } else if (typeof item.id === 'string') {
      // Para UUIDs, usar suma de caracteres como hash
      if (item.id.includes('-')) {
        numericId = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      } else {
        numericId = parseInt(item.id, 10) || 0;
      }
    }
  }
  
  // Usar el ID para seleccionar una imagen del array (distribución uniforme)
  const index = Math.abs(numericId) % ALL_GENERATED_IMAGES.length;
  return ALL_GENERATED_IMAGES[index];
}

// Validar configuración
if (!DIRECTUS_CONFIG.PUBLIC_URL) {
  console.warn('Warning: PUBLIC_DIRECTUS_URL no está configurado, usando fallback:', DIRECTUS_CONFIG.PUBLIC_URL);
}
if (!DIRECTUS_CONFIG.TOKEN) {
  console.warn('Warning: DIRECTUS_STATIC_TOKEN no está configurado');
}

// Cliente de API de Directus
class DirectusClient {
  constructor() {
    if (!DIRECTUS_CONFIG.PUBLIC_URL) {
      throw new Error('La URL de Directus no está configurada');
    }
    if (!DIRECTUS_CONFIG.TOKEN) {
      throw new Error('El token de autenticación de Directus no está configurado');
    }

    // Usamos API_URL para las peticiones fetch
    this.apiUrl = DIRECTUS_CONFIG.API_URL.replace(/\/+$/, '');
    // Usamos PUBLIC_URL para generar links de assets
    this.publicUrl = DIRECTUS_CONFIG.PUBLIC_URL.replace(/\/+$/, '');
    this.token = DIRECTUS_CONFIG.TOKEN;
    console.log('DirectusClient inicializado. API:', this.apiUrl, 'Public:', this.publicUrl);
  }

  async request(endpoint, options = {}) {
    if (!endpoint.startsWith('/')) {
      endpoint = `/${endpoint}`;
    }

    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'same-origin'
      });
      clearTimeout(timeout);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.errors?.[0]?.message || errorMessage;
        } catch {
          // No se pudo analizar la respuesta JSON
        }
        throw new Error(errorMessage);
      }

      // Para respuestas sin contenido (204 No Content)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error en la petición a Directus:', {
        url,
        method: options.method || 'GET',
        error: error.message
      });
      throw error;
    }
  }

  // Métodos específicos de la API
  async getAntecedentes(params = {}) {
    try {
      const defaults = {
        fields: 'id,Titulo,Descripcion,Imagen,Fecha,Cliente,Unidad_de_negocio,Area',
        limit: DIRECTUS_CONFIG.PAGE_SIZE,
        filter: {},
        meta: '*'
      };

      const queryParams = new URLSearchParams();
      const finalParams = { ...defaults, ...params };

      // Construir parámetros de consulta
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'filter' && typeof value === 'object') {
            queryParams.set('filter', JSON.stringify(value));
          } else if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.set(key, value);
          }
        }
      });

      const url = `/items/Antecedentes?${queryParams.toString()}`;
      const response = await this.request(url);
      
      console.log(`[DirectusClient.getAntecedentes] API Response:`, { 
        hasData: !!response?.data, 
        count: response?.data?.length,
        url: url
      });

       if (response && response.data) {
        response.data = response.data.map(item => {
          // Use local generated images as fallback (distributed by ID hash)
          let imageUrl = getCategoryImage(item);
          
          // If Directus has a UUID, use public Directus proxy
          if (item.Imagen && item.Imagen.match(/^[a-f0-9-]{36}$/)) {
            imageUrl = `${this.publicUrl}/directus-assets/${item.Imagen}`;
          }
          return { ...item, Imagen: imageUrl };
        });
      }
      return response;

    } catch (error) {
      console.warn(`[Directus] Fallback activado para getAntecedentes debido a: ${error.message}`);
      
      // FALLBACK EMERGENCIA: Usar datos sincronizados
      const items = fallbackData.antecedentes || [];
      
      return { 
        data: items.map(item => ({
          ...item,
          Imagen: item.LocalFallbackImage || getCategoryImage(item)
        })),
        meta: { total_count: items.length } 
      };
    }
  }

  async getRandomImages(limit = 9) {
    const response = await this.request(
      `/files?filter[type][_starts_with]=image&limit=${limit}`
    );

    return response.data.map(img => ({
      url: `${this.publicUrl}/assets/${img.id}`,
      id: img.id,
      filename: img.filename_download || 'sin-nombre.jpg',
      width: img.width,
      height: img.height
    }));
  }

  async getFilterOptions() {
    const [areas, clientes, unidades] = await Promise.all([
      this.getUniqueValues('Area'),
      this.getUniqueValues('Cliente'),
      this.getUniqueValues('Unidad_de_negocio')
    ]);

    return { areas, clientes, unidades };
  }

  async getUniqueValues(field) {
    try {
      const response = await this.request(
        `/items/Antecedentes?groupBy[]=${field}`
      );
      return response.data
        .map(item => item[field])
        .filter(Boolean);
    } catch (error) {
      console.error(`Error getting unique values for ${field}:`, error);
      return [];
    }
  }

  /**
   * Get single antecedente by ID for slug redirect
   */
  async getAntecedenteById(id) {
    try {
      const response = await this.request(`/items/Antecedentes/${id}?fields=*`);
      
      if (!response || !response.data) {
        console.warn(`[ANTECEDENTE] No encontrado: ${id}`);
        return null;
      }
      
      const data = response.data;
      
      // Generate slug
      const slug = (data.Titulo || 'antecedente')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 100);
      
      return {
        ...data,
        slug
      };
    } catch (error) {
      console.error(`[ANTECEDENTE] Error obteniendo antecedente ${id}:`, error);
      return null;
    }
  }

  // Métodos para servicios
  async getServicios(params = {}) {
    try {
      const defaults = {
        fields: 'id,Titulo,Descripcion,Imagen,status,Area,Cliente,Unidad_de_negocio,Servicios_Detalle,Caracteristicas',
        sort: 'id',
        limit: -1,
        filter: { status: { _eq: 'published' } },
        meta: '*'
      };

      const queryParams = new URLSearchParams();
      const finalParams = { ...defaults, ...params };

      // Construir parámetros de consulta
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'filter' && typeof value === 'object') {
            queryParams.set('filter', JSON.stringify(value));
          } else if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.set(key, value);
          }
        }
      });

      const response = await this.request(`/items/Servicios?${queryParams.toString()}`);

      // Procesar la respuesta para incluir la URL completa de la imagen
      if (response && response.data) {
        return {
          ...response,
          data: response.data.map(servicio => {
            let imageUrl = DIRECTUS_CONFIG.DEFAULT_IMAGE;
            if (servicio.Imagen) {
              if (servicio.Imagen.match(/^[a-f0-9-]{36}$/)) {
                // UUID detected - use public Directus proxy
                imageUrl = `${this.publicUrl}/directus-assets/${servicio.Imagen}`;
              } else {
                imageUrl = servicio.Imagen;
              }
            }
            return {
              ...servicio,
              Imagen: imageUrl
            };
          })
        };
      }

      return response;
    } catch (error) {
      console.warn(`[Directus] Fallback activado para getServicios debido a: ${error.message}`);
      const items = fallbackData.servicios || [];
      return { 
        data: items.map(item => ({
          ...item,
          Imagen: item.LocalFallbackImage || getCategoryImage(item)
        })),
        meta: { total_count: items.length }
      };
    }
  }

  async getServicioById(id) {
    try {
      const response = await this.request(`/items/Servicios/${id}`);
      if (response && response.data) {
        let imageUrl = DIRECTUS_CONFIG.DEFAULT_IMAGE;
        if (response.data.Imagen) {
          if (response.data.Imagen.match(/^[a-f0-9-]{36}$/)) {
            imageUrl = `${this.publicUrl}/directus-assets/${response.data.Imagen}`;
          } else {
            imageUrl = response.data.Imagen;
          }
        }
        return {
          ...response.data,
          Imagen: imageUrl
        };
      }
      return null;
    } catch (error) {
      console.error(`Error al obtener servicio ${id}:`, error);
      return null;
    }
  }

  // Blog Methods
  async getBlogPosts(params = {}) {
    try {
      const defaults = {
        fields: 'id,slug,Titulo,Resumen,Imagen_portada,Fecha_publicacion,Autor,Categorias.Nombre',
        sort: '-Fecha_publicacion',
        limit: DIRECTUS_CONFIG.PAGE_SIZE,
        meta: '*',
        filter: {
          Estado: { _eq: 'publicado' }
        }
      };

      // Construir parámetros de consulta
      const queryParams = new URLSearchParams();
      const finalParams = { ...defaults, ...params };

      // Agregar parámetros a la consulta
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            queryParams.set(`filter`, JSON.stringify(value));
          } else {
            queryParams.set(key, JSON.stringify(value));
          }
        }
      });

      const response = await this.request(`/items/Entradas_Blog?${queryParams.toString()}`);

      // Procesar la respuesta
      if (!response || !response.data) {
        console.warn('Respuesta inesperada de la API de blog:', response);
        return { data: [], meta: {} };
      }

      // Mapear la respuesta para incluir la URL completa de la imagen
      return {
        ...response,
        data: response.data.map(post => ({
          ...post,
          Imagen_portada: post.Imagen_portada
            ? `${this.publicUrl}/assets/${post.Imagen_portada}?access_token=${this.token}`
            : DIRECTUS_CONFIG.DEFAULT_IMAGE,
          // Asegurarse de que siempre haya un array de categorías
          Categorias: Array.isArray(post.Categorias) ? post.Categorias : []
        }))
      };
    } catch (error) {
      console.error('Error en getBlogPosts:', error);
      return { data: [], meta: {} };
    }
  }

  async getBlogPostBySlug(slug) {
    if (!slug) {
      console.error('Se requiere un slug para buscar el post');
      return null;
    }

    try {
      const response = await this.getBlogPosts({
        filter: {
          slug: { _eq: slug },
          Estado: { _eq: 'publicado' }
        },
        limit: 1
      });

      const post = response.data?.[0];
      if (!post) {
        console.warn(`No se encontró el post con slug: ${slug}`);
        return null;
      }

      // Formatear la respuesta para que coincida con lo que espera el frontend
      return {
        ...post,
        title: post.Titulo,
        content: post.Contenido,
        date: post.Fecha_publicacion,
        author: post.Autor,
        image: post.Imagen_portada,
        categories: post.Categorias?.map(cat => cat.Nombre) || [],
        slug: post.slug
      };
    } catch (error) {
      console.error(`Error al obtener el post con slug ${slug}:`, error);
      return null;
    }
  }

  async getBlogCategories() {
    try {
      const response = await this.request('/items/Categorias_Blog', {
        params: {
          fields: 'id,Nombre,slug',
          sort: 'Nombre',
          limit: -1 // Obtener todas las categorías
        }
      });

      if (!response || !response.data) {
        console.warn('Respuesta inesperada al obtener categorías de blog');
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error('Error al obtener categorías del blog:', error);
      return [];
    }
  }
}

export const directus = new DirectusClient();
export const { DEFAULT_IMAGE, PAGE_SIZE } = DIRECTUS_CONFIG;

// Funciones auxiliares para antecedentes
export async function fetchAntecedente(id, token) {
  try {
    const response = await directus.request(`/items/antecedentes/${id}?fields=*,Galeria.directus_files_id.*,Servicios.Servicios_id.*,ImagenFondo.*`);
    return response.data;
  } catch (error) {
    console.error('Error fetching antecedente:', error);
    throw error;
  }
}

export function generateSlug(title) {
  if (!title) return '';

  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Eliminar guiones duplicados
    .trim('-');
}

/**
 * FASE 3: Función Centralizada para Resolución de URLs de Imágenes
 *
 * Consolida la lógica de 3 capas en un solo lugar:
 * 1. Detecta UUIDs de Directus
 * 2. Resuelve filenames locales con correcciones
 * 3. Busca en mapeo de imágenes
 * 4. Retorna fallback profesional
 */
export async function getAntecedenteImageUrl(item) {
  if (!item) {
    console.warn('[IMAGE] Item vacío, usando fallback');
    return DIRECTUS_CONFIG.DEFAULT_IMAGE;
  }

  try {
    // 0. Priority: Definitive Repair Map (Hard-coded restoration)
    if (item.id && REPAIR_MAP[item.id]) {
        const repairFilename = REPAIR_MAP[item.id];
        return `/img/sync-offline/${repairFilename}`;
    }

    // 0b. Priority: LocalFallbackImage (If item came from the offline sync)
    if (item.LocalFallbackImage) {
        return item.LocalFallbackImage;
    }

    // 1. Si ya tiene imageUrl procesado
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http')) {
      return item.imageUrl;
    }

    // 2. Si tiene Imagen válida (UUID o filename)
    if (item.Imagen) {
      // 2a. Support already-processed Directus asset URLs (from getAntecedentes processing)
      if (item.Imagen.startsWith('http://') || item.Imagen.startsWith('https://')) {
        console.log('[IMAGE] ✅ URL http ya procesada:', { id: item.id, url: item.Imagen.substring(0, 60) + '...' });
        return item.Imagen;
      }

      // 2c. Support generated images (already absolute paths)
      if (item.Imagen.startsWith('/images/')) {
         return item.Imagen;
      }

      // 2d. Support already-absolute paths (from sync)
      if (item.Imagen.startsWith('/imagenes_antecedentes_versionproduccion/') || 
          item.Imagen.startsWith('/img/sync-offline/')) {
         return item.Imagen;
      }

      // 2b. Filename local con correcciones (prioridad sobre UUID)
      if (item.Imagen.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        const cleanPath = item.Imagen.startsWith('/') ? item.Imagen.substring(1) : item.Imagen;
        const fixedFilename = getFixedImage(cleanPath);
        const localUrl = `/imagenes_antecedentes_versionproduccion/${fixedFilename}`;
        console.log('[IMAGE] ✅ Filename local:', { id: item.id, filename: fixedFilename });
        return localUrl;
      }

      // 2a. UUID de Directus - usar proxy HTTPS (nginx maps /directus-assets/ to /assets/)
      if (/^[a-f0-9-]{36}$/.test(item.Imagen)) {
        const directusAssetUrl = `${DIRECTUS_CONFIG.PUBLIC_URL}/directus-assets/${item.Imagen}`;
        console.log('[IMAGE] ✅ UUID detectado, usando Directus proxy:', { id: item.id, url: directusAssetUrl });
        return directusAssetUrl;
      }
    }

    // 3. Búsqueda global en mapeo (si no hay Imagen)
    try {
      const { buscarImagenPorDatos } = await import('../data/mapeo_imagenes_completo.js');
      const mappedFilename = buscarImagenPorDatos(
        item.Cliente,
        item.Area || item.Unidad_de_negocio,
        item.Titulo,
        item.id
      );

      if (mappedFilename) {
        const mappedUrl = `/imagenes_antecedentes_versionproduccion/${mappedFilename}`;
        console.log('[IMAGE] ✅ Encontrada en mapeo (sin Imagen field):', { id: item.id, filename: mappedFilename });
        return mappedUrl;
      }
    } catch (error) {
      console.warn('[IMAGE] ⚠️ Error buscando en mapeo global:', error.message);
    }

    // 4. Fallback profesional (gradient azul oscuro, NO ALF verde)
    console.warn('[IMAGE] ⚠️ Usando fallback para:', { id: item.id, titulo: item.Titulo });
    return DIRECTUS_CONFIG.DEFAULT_IMAGE;

  } catch (error) {
    console.error('[IMAGE] ❌ Error procesando imagen:', {
      id: item.id,
      titulo: item.Titulo,
      error: error.message
    });
    return DIRECTUS_CONFIG.DEFAULT_IMAGE;
  }
}

/**
 * Versión síncrona simplificada para componentes que necesitan
 * procesar imágenes sin await (menos recomendado pero más simple)
 */
export function getAntecedenteImageUrlSync(item) {
  if (!item) {
    return DIRECTUS_CONFIG.DEFAULT_IMAGE;
  }

  try {
    // 0. Priority: Definitive Repair Map (Hard-coded restoration)
    if (item.id && REPAIR_MAP[item.id]) {
        const repairFilename = REPAIR_MAP[item.id];
        return `/img/sync-offline/${repairFilename}`;
    }

    // 0b. Priority: LocalFallbackImage
    if (item.LocalFallbackImage) {
        return item.LocalFallbackImage;
    }
    // 0. Rutas absolutas generadas
    if (item.Imagen && item.Imagen.startsWith('/images/')) {
        return item.Imagen;
    }

    if (item.Imagen && item.Imagen.startsWith('/imagenes_antecedentes_versionproduccion/')) {
        return item.Imagen;
    }

    // 1. Filename local con extensión
    if (item.Imagen && item.Imagen.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      const cleanPath = item.Imagen.startsWith('/') ? item.Imagen.substring(1) : item.Imagen;
      const fixedFilename = getFixedImage(cleanPath);
      return `/imagenes_antecedentes_versionproduccion/${fixedFilename}`;
    }

    // 2. UUID - retorna fallback (mapeo se busca en función async)
    if (item.Imagen && /^[a-f0-9-]{36}$/.test(item.Imagen)) {
      // UUID sin mapeo en versión sync: usar DEFAULT_IMAGE
      // La versión async getAntecedenteImageUrl() maneja búsqueda de mapeo
      return DIRECTUS_CONFIG.DEFAULT_IMAGE;
    }
  } catch (error) {
    console.warn('[IMAGE] Sync error:', error.message);
  }

  return DIRECTUS_CONFIG.DEFAULT_IMAGE;
}
