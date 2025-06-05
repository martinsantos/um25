import { Directus } from '@directus/sdk';

// Export only the configuration, not the client
export const DIRECTUS_CONFIG = {
  url: import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055',
  token: import.meta.env.PUBLIC_DIRECTUS_TOKEN
};

// 1. Tipos compatibles con tus colecciones
type Colecciones = {
  servicios: Servicio;
  blog_posts: EntradaBlog;
  casos_de_exito: CasoExito; // Coincide con nombre en Directus
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

// 6. Funciones específicas para cada colección (NUEVO)
export const getServicios = async (limite: number = 10) => 
  obtenerContenidoPublicado('servicios', { limite });

export const getBlogPosts = async (limite: number = 10) => 
  obtenerContenidoPublicado('blog_posts', { limite });

export const getCasosExito = async (limite: number = 10) => 
  obtenerContenidoPublicado('casos_de_exito', { limite });