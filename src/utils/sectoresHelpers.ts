/**
 * HELPERS PARA SECTORES DESDE DIRECTUS
 * =====================================
 *
 * Funciones para obtener datos de sectores desde Directus
 * Reemplaza el contenido hardcodeado en las páginas de sectores
 */

import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

function getAuthenticatedClient() {
  return createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());
}

export interface SectorValueProp {
  icono: string;
  titulo: string;
  descripcion: string;
  orden: number;
}

export interface SectorServicio {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  descripcion_custom?: string;
}

export interface SectorStat {
  label: string;
  value: string;
}

export interface Sector {
  id: number;
  slug: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  hero_image: string;
  keywords: string[];
  color_theme: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  stats: SectorStat[];
  activo: boolean;
  orden: number;
  value_props?: SectorValueProp[];
  servicios?: SectorServicio[];
}

/**
 * Obtiene un sector por slug desde Directus
 */
export async function getSectorBySlug(slug: string): Promise<Sector | null> {
  try {
    const client = getAuthenticatedClient();

    const sectores = await client.request(
      readItems('sectores', {
        filter: {
          slug: { _eq: slug },
          activo: { _eq: true },
        },
        fields: [
          'id',
          'slug',
          'nombre',
          'emoji',
          'descripcion',
          'hero_image',
          'keywords',
          'color_theme',
          'seo_title',
          'seo_description',
          'seo_keywords',
          'stats',
          'activo',
          'orden',
          {
            value_props: [
              { sector_value_props: ['icono', 'titulo', 'descripcion', 'orden'] }
            ],
          },
          {
            servicios: [
              {
                sectores_servicios: [
                  'orden',
                  'descripcion_custom',
                  { servicios_id: ['id', 'Titulo', 'Descripcion'] }
                ]
              }
            ],
          },
        ],
        limit: 1,
      })
    );

    if (!sectores || sectores.length === 0) {
      console.warn(`[sectoresHelpers] Sector "${slug}" no encontrado en Directus`);
      return null;
    }

    const sector = sectores[0] as any;

    // Transformar value_props
    const value_props = (sector.value_props || [])
      .map((vp: any) => vp.sector_value_props)
      .filter(Boolean)
      .sort((a: any, b: any) => a.orden - b.orden);

    // Transformar servicios
    const servicios = (sector.servicios || [])
      .map((rel: any) => {
        const junction = rel.sectores_servicios;
        if (!junction || !junction.servicios_id) return null;

        return {
          id: junction.servicios_id.id,
          nombre: junction.servicios_id.Titulo,
          descripcion: junction.descripcion_custom || junction.servicios_id.Descripcion,
          orden: junction.orden,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.orden - b.orden);

    return {
      ...sector,
      value_props,
      servicios,
    };

  } catch (error) {
    console.error(`[sectoresHelpers] Error obteniendo sector "${slug}":`, error);
    return null;
  }
}

/**
 * Obtiene todos los sectores activos desde Directus
 */
export async function getAllSectores(): Promise<Sector[]> {
  try {
    const client = getAuthenticatedClient();

    const sectores = await client.request(
      readItems('sectores', {
        filter: {
          activo: { _eq: true },
        },
        fields: [
          'id',
          'slug',
          'nombre',
          'emoji',
          'descripcion',
          'hero_image',
          'color_theme',
          'orden',
        ],
        sort: ['orden'],
      })
    );

    return sectores as Sector[];

  } catch (error) {
    console.error('[sectoresHelpers] Error obteniendo sectores:', error);
    return [];
  }
}

/**
 * Helper para obtener iconos SVG basados en nombre
 */
export function getIconSVGPath(iconName: string): string {
  const icons: Record<string, string> = {
    'plane': 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    'shield': 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    'zap': 'M7 2v11h3v9l7-12h-4l4-8z',
    'wine': 'M6 3v6h4v9h4V9h4V3H6z',
    'users': 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    'hard-hat': 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    'file-check': 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-3 17l-4-4 1.41-1.41L11 16.17l5.59-5.59L18 12l-7 7z',
    'wrench': 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    'landmark': 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    'lock': 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z',
    'factory': 'M22 22H2V10l7-3v2l5-2v3h8v12z',
    'activity': 'M22 12h-4l-3 9L9 3l-3 9H2',
    'mountain': 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z',
    'radio': 'M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15z',
    'shield-check': 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    'heart-pulse': 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    'shield-plus': 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    'video': 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
    'eye': 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    'smartphone': 'M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z',
    'code': 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  };

  return icons[iconName] || icons['shield'];
}
