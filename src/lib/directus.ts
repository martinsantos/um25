import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

// 1. Tipos compatibles con tus colecciones
type Colecciones = {
  servicios: Servicio;
  blog_posts: EntradaBlog;
  casos_de_exito: CasoExito; // Coincide con nombre en Directus
};

// 2. Configuración basada en tu .env
const DIRECTUS_CONFIG = {
  url: import.meta.env.PUBLIC_DIRECTUS_URL,
  token: import.meta.env.PUBLIC_DIRECTUS_TOKEN
};

// Validación básica de configuración
if (!DIRECTUS_CONFIG.url || !DIRECTUS_CONFIG.token) {
  throw new Error('Configuración de Directus incompleta en .env');
}

// 3. Cliente Directus con autenticación
export const directus = createDirectus(DIRECTUS_CONFIG.url)
  .with(rest())
  .with(staticToken(DIRECTUS_CONFIG.token));

// 4. Función de consulta genérica
export async function obtenerContenidoPublicado<T extends keyof Colecciones>(
  coleccion: T,
  opciones: { limite?: number; orden?: string[] } = {}
): Promise<Colecciones[T][]> {
  try {
    return await directus.request(
      readItems(coleccion, {
        filter: { estado: { _eq: 'publicado' } }, // Asumiendo campo 'estado'
        sort: opciones.orden || ['-fecha_publicacion'],
        limit: opciones.limite || 10,
        fields: ['*', 'imagen_destacada.*'] // Incluir relación de imagen
      })
    );
  } catch (error) {
    console.error(`Error obteniendo ${coleccion}:`, error);
    return []; // Mantenemos retorno de array vacío para consistencia frontal
  }
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

import { createDirectus, rest } from '@directus/sdk';

const directus = createDirectus(import.meta.env.PUBLIC_DIRECTUS_URL)
    .with(rest());

export const getClient = () => {
    return directus;
};

export const staticClient = directus.with(
    rest({
        token: import.meta.env.PUBLIC_DIRECTUS_TOKEN,
    })
);