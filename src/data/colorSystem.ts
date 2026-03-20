/**
 * Sistema de Colores Unificado - Ultima Milla
 * V6 Dark Premium: All sectors use neutral gray badges
 * No rainbow colors — clean, consistent appearance
 */

export interface SectorColors {
  primary: string;
  gradient: string;
  badge: { bg: string; text: string };
  icon: string;
  hover: string;
}

// Neutral palette for all sectors
const neutralColors: SectorColors = {
  primary: 'gray',
  gradient: 'from-gray-400 to-gray-600',
  badge: { bg: 'bg-gray-100', text: 'text-gray-600' },
  icon: 'bg-gray-600/90',
  hover: 'hover:text-gray-600'
};

export const sectorColorSystem: Record<string, SectorColors> = {
  aeropuertos: { ...neutralColors },
  bodegas: { ...neutralColors },
  gobierno: { ...neutralColors },
  salud: { ...neutralColors },
  construccion: { ...neutralColors },
  industria: { ...neutralColors },
  software: { ...neutralColors },
  mineria: { ...neutralColors },
  seguridad: { ...neutralColors },
  telecomunicaciones: { ...neutralColors },
  datacenter: { ...neutralColors },
  hoteleria: { ...neutralColors },
  retail: { ...neutralColors },
  energia: { ...neutralColors },
  educacion: { ...neutralColors },
  tecnologia: { ...neutralColors },
};

/**
 * Obtiene los colores de un sector específico
 */
export function getSectorColors(sectorKey: string): SectorColors {
  return sectorColorSystem[sectorKey] || sectorColorSystem['tecnologia'];
}

/**
 * Lista de todos los sectores disponibles (excepto fallback)
 */
export const availableSectors = Object.keys(sectorColorSystem).filter(k => k !== 'tecnologia');
