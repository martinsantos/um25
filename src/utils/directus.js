// Configuración de Directus
const DIRECTUS_CONFIG = {
  URL: import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055',
  TOKEN: import.meta.env.DIRECTUS_STATIC_TOKEN || 'ujsboxj0_E5PvWKhFao7yCW6_VDFsOSk',
  PAGE_SIZE: 20,
  DEFAULT_IMAGE: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
};

// Validar configuración
if (!DIRECTUS_CONFIG.URL) {
  console.error('Error: PUBLIC_DIRECTUS_URL no está configurado en las variables de entorno');
}
if (!DIRECTUS_CONFIG.TOKEN) {
  console.error('Error: DIRECTUS_STATIC_TOKEN no está configurado en las variables de entorno');
}

// Cliente de API de Directus
class DirectusClient {
  constructor() {
    if (!DIRECTUS_CONFIG.URL) {
      throw new Error('La URL de Directus no está configurada');
    }
    if (!DIRECTUS_CONFIG.TOKEN) {
      throw new Error('El token de autenticación de Directus no está configurado');
    }

    this.baseUrl = DIRECTUS_CONFIG.URL.replace(/\/+$/, ''); // Eliminar barras diagonales finales
    this.token = DIRECTUS_CONFIG.TOKEN;
    console.log('DirectusClient inicializado con token:', this.token); // Añadido para depuración
  }

  async request(endpoint, options = {}) {
    if (!endpoint.startsWith('/')) {
      endpoint = `/${endpoint}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin'
      });

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
    const defaults = {
      fields: 'id,Titulo,Descripcion,Imagen,Fecha,Cliente,Unidad_de_negocio,Area',
      sort: '-Fecha',
      limit: DIRECTUS_CONFIG.PAGE_SIZE,
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

    return this.request(`/items/Antecedentes?${queryParams.toString()}`);
  }

  async getRandomImages(limit = 9) {
    const response = await this.request(
      `/files?filter[type][_starts_with]=image&limit=${limit}`
    );
    
    return response.data.map(img => ({
      url: `${this.baseUrl}/assets/${img.id}`,
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
        `/items/antecedentes?groupBy[]=${field}`
      );
      return response.data
        .map(item => item[field])
        .filter(Boolean);
    } catch (error) {
      console.error(`Error getting unique values for ${field}:`, error);
      return [];
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
            ? `${this.baseUrl}/assets/${post.Imagen_portada}?access_token=${this.token}`
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
