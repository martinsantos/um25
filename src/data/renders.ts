// Manifiesto de renders UM25 (Blender Cycles, render en la nube).
// Cada entrada describe un activo ya exportado a public/. Para sumar un render
// nuevo del hilo UM25 alcanza con copiar los archivos y agregar una entrada:
// ningún componente conoce rutas de archivos por fuera de este manifiesto.
//
// Convención de archivos (public/cine/media/):
//   <escena>-cycles.webp            still 1600x1000 (poster y fallback sin video)
//   recorrido-<escena>-720.mp4      recorrido H.264 1280x720, muted, < 1 MB
//   recorrido-<escena>-poster.jpg   poster 1920x1080 del recorrido
//   recorrido-<escena>.mp4          master 1080p (solo bajo demanda / 3D)
export type RenderAspect = '16/10' | '16/9' | '4/5' | '1/1';

export interface RenderLabel {
  /** Posición en porcentaje del ancho/alto del cuadro. */
  x: number;
  y: number;
  text: string;
  /** Sistema señalado (código corto que aparece en los renders de servicio). */
  system?: string;
}

export interface RenderAsset {
  id: string;
  title: string;
  alt: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
  aspect: RenderAspect;
  /** Recorrido corto. Se carga sólo cuando el cuadro entra en pantalla. */
  video?: string;
  /** Página con el gemelo digital navegable. */
  twin?: string;
  labels?: RenderLabel[];
  caption?: string;
}

export const RENDERS: Record<string, RenderAsset> = {
  'fachada-sistemas': {
    id: 'fachada-sistemas',
    title: 'Edificio corporativo · esqueleto de sistemas',
    alt: 'Render de un edificio corporativo con el esqueleto de sistemas de datos, CCTV, WiFi y energía señalado por piso',
    poster: '/cine/media/fachada-cycles.webp',
    posterWidth: 1600,
    posterHeight: 1000,
    aspect: '16/10',
    video: '/cine/media/recorrido-fachada-720.mp4',
    twin: '/3d/fachada.html',
    labels: [
      { x: 34, y: 30, text: 'Rack de piso · fibra OM4', system: 'D' },
      { x: 62, y: 46, text: 'Cámara IP · corredor', system: 'V' },
      { x: 48, y: 72, text: 'UPS y tablero IT', system: 'E' },
    ],
    caption: 'Recorrido pre-renderizado. El gemelo digital se abre a pedido.',
  },
  'bodega-trazabilidad': {
    id: 'bodega-trazabilidad',
    title: 'Bodega · trazabilidad vitivinícola',
    alt: 'Render de una bodega conectada con tanques de acero, red de datos y cámaras sobre un viñedo',
    poster: '/cine/media/bodega-cycles.webp',
    posterWidth: 1600,
    posterHeight: 1000,
    aspect: '16/10',
    video: '/cine/media/recorrido-bodega-720.mp4',
    twin: '/3d/bodega.html',
  },
  'aeropuerto-perimetro': {
    id: 'aeropuerto-perimetro',
    title: 'Terminal aeroportuaria · CCTV de perímetro',
    alt: 'Render de una terminal aeroportuaria con cámaras de perímetro y enlaces de datos señalados',
    poster: '/cine/media/aeropuerto-cycles.webp',
    posterWidth: 1600,
    posterHeight: 1000,
    aspect: '16/10',
    video: '/cine/media/recorrido-aeropuerto-720.mp4',
    twin: '/3d/aeropuerto.html',
  },
  'hospital-imagenes': {
    id: 'hospital-imagenes',
    title: 'Hospital · redes para imágenes médicas',
    alt: 'Render de un hospital con la red de datos para imágenes médicas y energía respaldada',
    poster: '/cine/media/hospital-cycles.webp',
    posterWidth: 1600,
    posterHeight: 1000,
    aspect: '16/10',
    video: '/cine/media/recorrido-hospital-720.mp4',
    twin: '/3d/hospital.html',
  },
};

export const getRender = (id: string): RenderAsset => {
  const asset = RENDERS[id];
  if (!asset) throw new Error(`Render UM25 no registrado: ${id}`);
  return asset;
};
