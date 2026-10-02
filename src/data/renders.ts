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
export type RenderAspect = '16/10' | '16/9' | '4/3' | '4/5' | '1/1' | '1200/825' | '1200/858';

export interface RenderLabel {
  /** Posición en porcentaje del ancho/alto del cuadro. Sin posición, la
   *  etiqueta se lista debajo del cuadro como componente del sistema. */
  x?: number;
  y?: number;
  text: string;
  /** Sistema señalado: D datos, V video y accesos, C comunicaciones,
   *  L software y operación, F incendio, E energía. */
  system?: string;
  /** Función del componente (sólo en modo lista). */
  role?: string;
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
  /** Despiece del mismo objeto: se muestra al pasar el puntero, enfocar o
   *  con el botón "Ver despiece" en pantallas táctiles. */
  exploded?: string;
  /** Código de sistema dominante (para el sello del cuadro). */
  system?: string;
  /** Render conceptual: el cuadro lo declara para no presentarlo como foto. */
  illustrative?: boolean;
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
  'planta-altura': {
    id: 'planta-altura',
    title: 'Planta de altura · enlaces y energía',
    alt: 'Render de una planta industrial en altura con enlaces de datos y energía respaldada',
    poster: '/cine/media/planta-cycles.webp',
    posterWidth: 1600,
    posterHeight: 1000,
    aspect: '16/10',
    video: '/cine/media/cine-planta-sq.mp4',
  },

  // Renders de producto por frente de servicio (estudio + despiece). Son los
  // mismos objetos que aparecen en la película de la home.
  'servicio-101': {
    id: 'servicio-101',
    title: 'Switch de acceso · cableado estructurado',
    alt: 'Render de un switch de acceso con puertos RJ45 y uplinks de fibra, conectado con patch cords',
    poster: '/cine/servicios/101.webp',
    posterWidth: 1200,
    posterHeight: 825,
    aspect: '1200/825',
    system: 'D',
    illustrative: true,
    labels: [
      { text: 'Puertos de acceso RJ45', role: 'Cat 6/6A certificados punto por punto', system: 'D' },
      { text: 'Uplinks de fibra', role: 'Troncal OM4 hacia el rack principal', system: 'D' },
      { text: 'Patch cords identificados', role: 'Rotulado y documentación de obra', system: 'D' },
    ],
    caption: 'Render ilustrativo del equipamiento de red.',
  },
  'servicio-102': {
    id: 'servicio-102',
    title: 'Cámara IP bullet · videovigilancia',
    alt: 'Render de una cámara IP tipo bullet, entera y despiezada: óptica, sensor, placa y carcasa',
    poster: '/cine/servicios/102.webp',
    exploded: '/cine/servicios/102-x.webp',
    posterWidth: 1200,
    posterHeight: 858,
    aspect: '1200/858',
    system: 'V',
    illustrative: true,
    labels: [
      { text: 'Óptica y sensor', role: 'Escena, iluminación y distancia definen el lente', system: 'V' },
      { text: 'Placa de procesamiento', role: 'Compresión, analítica y PoE', system: 'V' },
      { text: 'Carcasa y soporte', role: 'Exterior, perímetro y montaje en altura', system: 'V' },
    ],
    caption: 'Render ilustrativo. Pasá el puntero o tocá "Ver despiece".',
  },
  'servicio-103': {
    id: 'servicio-103',
    title: 'Radioenlace · telecomunicaciones',
    alt: 'Render de una antena parabólica de radioenlace con su radio y cable coaxial',
    poster: '/cine/servicios/103.webp',
    exploded: '/cine/servicios/103-x.webp',
    posterWidth: 1200,
    posterHeight: 900,
    aspect: '4/3',
    system: 'C',
    illustrative: true,
    labels: [
      { text: 'Reflector parabólico', role: 'Enlaces punto a punto entre sitios y campamentos', system: 'C' },
      { text: 'Radio outdoor', role: 'Datos, voz y video sobre el mismo enlace', system: 'C' },
      { text: 'Alimentación y protección', role: 'PoE, descargadores y puesta a tierra', system: 'E' },
    ],
    caption: 'Render ilustrativo. Pasá el puntero o tocá "Ver despiece".',
  },
  'servicio-104': {
    id: 'servicio-104',
    title: 'Módulos SGI · software a medida',
    alt: 'Render de seis módulos de un sistema de gestión: clientes, proyectos, certificados, control, cobros y facturas',
    poster: '/cine/servicios/104.webp',
    exploded: '/cine/servicios/104-x.webp',
    posterWidth: 1200,
    posterHeight: 900,
    aspect: '4/3',
    system: 'L',
    illustrative: true,
    labels: [
      { text: 'Módulos por proceso', role: 'Clientes, proyectos, certificados, control, cobros y facturas', system: 'L' },
      { text: 'APIs e integraciones', role: 'Conectan ERP, campo y tableros', system: 'L' },
      { text: 'Tableros operativos', role: 'Indicadores para decidir en el día', system: 'L' },
    ],
    caption: 'Render ilustrativo. Pasá el puntero o tocá "Ver despiece".',
  },
  'servicio-105': {
    id: 'servicio-105',
    title: 'Servidor de operación · soporte 24/7',
    alt: 'Render de un servidor despiezado: placa, memoria, disipador, discos y ventiladores',
    poster: '/cine/servicios/105.webp',
    exploded: '/cine/servicios/105-x.webp',
    posterWidth: 1200,
    posterHeight: 900,
    aspect: '4/3',
    system: 'L',
    illustrative: true,
    labels: [
      { text: 'Placa, CPU y memoria', role: 'Monitoreo y mantenimiento preventivo', system: 'L' },
      { text: 'Discos y respaldo', role: 'Copias verificadas y continuidad', system: 'L' },
      { text: 'Refrigeración y energía', role: 'Sala técnica controlada con UPS', system: 'E' },
    ],
    caption: 'Render ilustrativo. Pasá el puntero o tocá "Ver despiece".',
  },
  'servicio-106': {
    id: 'servicio-106',
    title: 'Instrumento de diagnóstico · consultoría IT',
    alt: 'Render de un instrumento de diagnóstico de campo con pantalla, placa y latiguillo de red',
    poster: '/cine/servicios/106.webp',
    exploded: '/cine/servicios/106-x.webp',
    posterWidth: 1200,
    posterHeight: 900,
    aspect: '4/3',
    system: 'D',
    illustrative: true,
    labels: [
      { text: 'Mapa de pares y enlace', role: 'Relevamiento de lo instalado antes de proponer', system: 'D' },
      { text: 'Reporte de campo', role: 'Auditoría documentada y roadmap', system: 'L' },
      { text: 'Arquitectura objetivo', role: 'Qué cambiar, en qué orden y con qué costo', system: 'L' },
    ],
    caption: 'Render ilustrativo. Pasá el puntero o tocá "Ver despiece".',
  },
  'servicio-107': {
    id: 'servicio-107',
    title: 'Detector óptico · detección de incendios',
    alt: 'Render de un detector de humo óptico, entero y despiezado: cámara óptica, base y tapa',
    poster: '/cine/servicios/107.webp',
    exploded: '/cine/servicios/107-x.webp',
    posterWidth: 1200,
    posterHeight: 900,
    aspect: '4/3',
    system: 'F',
    illustrative: true,
    labels: [
      { text: 'Cámara óptica', role: 'Detección temprana en salas y cielorrasos técnicos', system: 'F' },
      { text: 'Base y lazo supervisado', role: 'Central que supervisa cada lazo', system: 'F' },
      { text: 'Pulsadores y sirenas', role: 'Aviso inmediato según IRAM y NFPA 72', system: 'F' },
    ],
    caption: 'Render ilustrativo. Pasá el puntero o tocá "Ver despiece".',
  },
  'servicio-108': {
    id: 'servicio-108',
    title: 'Gabinete UPS · eléctricos IT',
    alt: 'Render de un gabinete UPS despiezado: panel de estado, baterías selladas y tapa lateral',
    poster: '/cine/servicios/108.webp',
    exploded: '/cine/servicios/108-x.webp',
    posterWidth: 1200,
    posterHeight: 900,
    aspect: '4/3',
    system: 'E',
    illustrative: true,
    labels: [
      { text: 'Panel de estado', role: 'Continuidad y respaldo visibles', system: 'E' },
      { text: 'Baterías selladas', role: 'Autonomía dimensionada por carga crítica', system: 'E' },
      { text: 'Tablero y canalización', role: 'Alimentación limpia para racks y cámaras', system: 'E' },
    ],
    caption: 'Render ilustrativo. Pasá el puntero o tocá "Ver despiece".',
  },
};

export const getRender = (id: string): RenderAsset => {
  const asset = RENDERS[id];
  if (!asset) throw new Error(`Render UM25 no registrado: ${id}`);
  return asset;
};
