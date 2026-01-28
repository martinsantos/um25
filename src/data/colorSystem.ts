/**
 * Sistema de Colores Unificado - Ultima Milla
 * Define paleta cromática consistente para sectores, badges, iconos
 *
 * Uso:
 * import { getSectorColors } from '@/data/colorSystem';
 * const colors = getSectorColors('aeropuertos');
 * // colors.badge.bg → 'bg-sky-100'
 * // colors.icon → 'bg-sky-600/90'
 */

export interface SectorColors {
  primary: string;
  gradient: string;
  badge: { bg: string; text: string };
  icon: string;
  hover: string;
}

export const sectorColorSystem: Record<string, SectorColors> = {
  aeropuertos: {
    primary: 'sky',
    gradient: 'from-sky-400 to-sky-600',
    badge: { bg: 'bg-sky-100', text: 'text-sky-800' },
    icon: 'bg-sky-600/90',
    hover: 'hover:text-sky-600'
  },
  bodegas: {
    primary: 'purple',
    gradient: 'from-purple-400 to-purple-600',
    badge: { bg: 'bg-purple-100', text: 'text-purple-800' },
    icon: 'bg-purple-600/90',
    hover: 'hover:text-purple-600'
  },
  gobierno: {
    primary: 'blue',
    gradient: 'from-blue-400 to-blue-600',
    badge: { bg: 'bg-blue-100', text: 'text-blue-800' },
    icon: 'bg-blue-600/90',
    hover: 'hover:text-blue-600'
  },
  salud: {
    primary: 'green',
    gradient: 'from-green-400 to-green-600',
    badge: { bg: 'bg-green-100', text: 'text-green-800' },
    icon: 'bg-green-600/90',
    hover: 'hover:text-green-600'
  },
  construccion: {
    primary: 'amber',
    gradient: 'from-amber-400 to-amber-600',
    badge: { bg: 'bg-amber-100', text: 'text-amber-800' },
    icon: 'bg-amber-600/90',
    hover: 'hover:text-amber-600'
  },
  industria: {
    primary: 'indigo',
    gradient: 'from-indigo-400 to-indigo-600',
    badge: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    icon: 'bg-indigo-600/90',
    hover: 'hover:text-indigo-600'
  },
  software: {
    primary: 'cyan',
    gradient: 'from-cyan-400 to-cyan-600',
    badge: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    icon: 'bg-cyan-600/90',
    hover: 'hover:text-cyan-600'
  },
  mineria: {
    primary: 'orange',
    gradient: 'from-orange-400 to-orange-600',
    badge: { bg: 'bg-orange-100', text: 'text-orange-800' },
    icon: 'bg-orange-600/90',
    hover: 'hover:text-orange-600'
  },
  seguridad: {
    primary: 'red',
    gradient: 'from-red-400 to-red-600',
    badge: { bg: 'bg-red-100', text: 'text-red-800' },
    icon: 'bg-red-600/90',
    hover: 'hover:text-red-600'
  },
  telecomunicaciones: {
    primary: 'teal',
    gradient: 'from-teal-400 to-teal-600',
    badge: { bg: 'bg-teal-100', text: 'text-teal-800' },
    icon: 'bg-teal-600/90',
    hover: 'hover:text-teal-600'
  },
  // Nuevos sectores (se activarán según auditoría de datos)
  datacenter: {
    primary: 'violet',
    gradient: 'from-violet-400 to-violet-600',
    badge: { bg: 'bg-violet-100', text: 'text-violet-800' },
    icon: 'bg-violet-600/90',
    hover: 'hover:text-violet-600'
  },
  hoteleria: {
    primary: 'pink',
    gradient: 'from-pink-400 to-pink-600',
    badge: { bg: 'bg-pink-100', text: 'text-pink-800' },
    icon: 'bg-pink-600/90',
    hover: 'hover:text-pink-600'
  },
  retail: {
    primary: 'lime',
    gradient: 'from-lime-400 to-lime-600',
    badge: { bg: 'bg-lime-100', text: 'text-lime-800' },
    icon: 'bg-lime-600/90',
    hover: 'hover:text-lime-600'
  },
  energia: {
    primary: 'yellow',
    gradient: 'from-yellow-400 to-yellow-600',
    badge: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    icon: 'bg-yellow-600/90',
    hover: 'hover:text-yellow-600'
  },
  educacion: {
    primary: 'emerald',
    gradient: 'from-emerald-400 to-emerald-600',
    badge: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    icon: 'bg-emerald-600/90',
    hover: 'hover:text-emerald-600'
  },
  // Fallback genérico
  tecnologia: {
    primary: 'gray',
    gradient: 'from-gray-400 to-gray-600',
    badge: { bg: 'bg-gray-100', text: 'text-gray-800' },
    icon: 'bg-gray-600/90',
    hover: 'hover:text-gray-600'
  }
};

/**
 * Obtiene los colores de un sector específico
 * @param sectorKey - Clave del sector (ej: 'aeropuertos', 'salud')
 * @returns Objeto con todos los colores del sector
 */
export function getSectorColors(sectorKey: string): SectorColors {
  return sectorColorSystem[sectorKey] || sectorColorSystem['tecnologia'];
}

/**
 * Lista de todos los sectores disponibles (excepto fallback)
 */
export const availableSectors = Object.keys(sectorColorSystem).filter(k => k !== 'tecnologia');
