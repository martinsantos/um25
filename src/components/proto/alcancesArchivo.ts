type ArchiveScope = {
  description: string;
  evidence?: readonly { value: string; label: string }[];
};

// Edición de los registros identificados por el mismo ID en antecedentes_completos.js.
export const alcancesArchivo: Readonly<Partial<Record<number, ArchiveScope>>> = {
  10737: {
    description: 'En la etapa IV de la remodelación, instalamos sistemas de detección de incendios en el estacionamiento y los edificios externos del aeropuerto.',
  },
  10740: {
    description: 'Diseñamos, instalamos y pusimos en servicio el cableado estructurado y la telefonía interna. Construimos el centro de datos donde se reunieron los sistemas del estadio y el CCTV de la Policía de Mendoza.',
    evidence: [{ value: '200', label: 'puestos de prensa' }, { value: '60', label: 'puestos de transmisión' }],
  },
  10742: {
    description: 'Tendimos fibra óptica aérea para conectar la sede de la Municipalidad de San Martín con el Centro de Congresos y Exposiciones.',
    evidence: [{ value: '6,5 km', label: 'de fibra óptica aérea' }],
  },
  10762: {
    description: 'Montamos e instalamos los equipos de telecomunicaciones directamente a bordo de las locomotoras de EMEPA.',
    evidence: [{ value: '9', label: 'locomotoras equipadas' }],
  },
  10768: {
    description: 'Desarrollamos la ingeniería de telecomunicaciones para la red de voz y datos de Tío Pujio, Leones y Candelarias, en Córdoba.',
    evidence: [{ value: '3', label: 'plantas compresoras de gas' }],
  },
  10770: {
    description: 'Implementamos los enlaces de radio y la distribución de servicios para los puntos de conexión del proyecto Wi-Fi Mendoza.',
    evidence: [{ value: '40', label: 'puntos de distribución' }],
  },
  10771: {
    description: 'Proyectamos e implementamos el centro de datos en la bodega.',
  },
  10776: {
    description: 'Diseñamos la infraestructura de telecomunicaciones y el centro de datos del Parque PASIP, en Palmira, Mendoza.',
  },
  10778: {
    description: 'Reunimos los sitios de ministerios y servicios, el directorio de contactos, el buscador y la API de trámites en un portal. La entrega incluyó capacitación a usuarios y mantenimiento.',
  },
  10798: {
    description: 'Diseñamos e instalamos en las oficinas la red de datos, la telefonía, el control de acceso y la detección de incendios.',
  },
  10813: {
    description: 'Desarrollamos el software para registrar la trazabilidad de los alimentos y respaldar el proceso de certificación orgánica de la bodega.',
  },
  10817: {
    description: 'El portal validaba usuarios y certificaba documentos con sello de tiempo mediante blockchain. Integramos los servicios web internos con un asistente de consultas.',
  },
};
