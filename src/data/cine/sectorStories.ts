// One story per sector, told over its Blender film. Each moment says one thing:
// what is at stake, what we do, and a real case that proves it.
// Film clock (seconds) follows the v5 tours: 0 overview, 2.8 close look,
// 6.6 distribution, 10.8 layers open, 15.6 return.
export interface StoryProof { id: string; title: string; what: string; href: string }
export interface StoryMoment {
  t: number; kicker: string; title: string; lead: string;
  proof?: StoryProof; more?: string; layers?: true; go?: true; scrim?: [string, string, string];
}
export interface SectorStory { scene: string; label: string; stats: [string, string][]; moments: StoryMoment[] }

const LAYERS_MOMENT = (title: string, lead: string, proof?: StoryProof): StoryMoment => ({ t: 10.8, kicker: 'Detrás de la pared', title, lead, layers: true, proof });

export const SECTOR_STORIES: Record<string, SectorStory> = {
  salud: {
    scene: 'hospital', label: 'Salud',
    stats: [['51', 'Proyectos en salud'], ['24/7', 'Soporte'], ['22', 'Años']],
    moments: [
      { t: 0, kicker: 'Salud', title: 'En un hospital, la red no puede caerse.', lead: 'Diseñamos, instalamos y sostenemos la infraestructura de edificios sanitarios que funcionan las 24 horas.' },
      { t: 2.8, kicker: 'En cada cabecera', title: 'Cada monitor reporta. Siempre.', lead: 'Llevamos cableado certificado y Wi‑Fi hasta cada cama, para que los equipos clínicos no pierdan la conexión.', more: '101',
        proof: { id: '3072', title: 'Hospital Italo Perrupato', what: 'Rack y patch panel certificados · 2025', href: '/antecedentes/3072/infraestructura-hospitalaria-rack-y-patch-panel-hospital-a-italo-perrupato' } },
      { t: 6.6, kicker: 'En el puesto de enfermería', title: 'Todo el piso, visible desde un solo puesto.', lead: 'Llamadores, comunicaciones y sistemas del área llegan al lugar donde se toman las decisiones.', more: '103', scrim: ['40%', '52%', '66%'],
        proof: { id: '3075', title: 'FUESMEN · Escuela de Medicina Nuclear', what: 'Redes de datos y fibra óptica · 2025', href: '/antecedentes/3075/implementacion-de-redes-de-datos-y-fibra-optica-fuesmen-fundacion-escuela-medicina-nuclear-3' } },
      LAYERS_MOMENT('Cuatro sistemas que nadie ve, y de los que todo depende.', 'Los diseñamos, instalamos y documentamos como uno solo.'),
      { t: 15.6, kicker: 'Después de la obra', title: 'Y a las tres de la mañana, alguien atiende.', lead: 'Mesa de ayuda 24/7, mantenimiento con SLA y la documentación de todo lo instalado.', go: true },
    ],
  },
  constructoras: {
    scene: 'fachada', label: 'Constructoras',
    stats: [['80', 'Proyectos en obra'], ['24/7', 'Soporte'], ['22', 'Años']],
    moments: [
      { t: 0, kicker: 'Constructoras', title: 'Un edificio se entrega con la tecnología funcionando.', lead: 'Diseñamos e instalamos datos, energía, seguridad y detección para que la obra se habilite y se ocupe sin sorpresas.' },
      { t: 2.8, kicker: 'En cada puesto', title: 'Datos y energía llegan al escritorio.', lead: 'Cableado certificado y cajas de piso por puesto: cada lugar de trabajo se conecta sin cables a la vista.', more: '101' },
      { t: 6.6, kicker: 'En la distribución', title: 'Bandejas ordenadas hoy, mantenimiento simple mañana.', lead: 'Canalizaciones identificadas y accesibles: lo que se instala hoy se puede ampliar sin romper.', more: '108', scrim: ['40%', '52%', '66%'] },
      LAYERS_MOMENT('Cuatro sistemas en una misma obra.', 'Coordinados entre sí y con el resto de los gremios desde el proyecto.',
        { id: '3066', title: 'Torre Thays', what: 'Dispositivos de detección · 2025', href: '/antecedentes/3066/torre-thays-dispositivos-de-deteccion' }),
      { t: 15.6, kicker: 'Después de la entrega', title: 'Y el edificio sigue funcionando cuando la obra se va.', lead: 'Documentación conforme a obra, garantía y mantenimiento para consorcios y administraciones.', go: true },
    ],
  },
  aeropuertos: {
    scene: 'aeropuerto', label: 'Aeropuertos',
    stats: [['109', 'Proyectos en aeropuertos'], ['24/7', 'Soporte'], ['22', 'Años']],
    moments: [
      { t: 0, kicker: 'Aeropuertos', title: 'Una terminal no se detiene ni de noche.', lead: 'Redes, seguridad y detección para terminales que conectan personas, equipaje y operación en tiempo real.' },
      { t: 2.8, kicker: 'En cada mostrador', title: 'Cada check‑in, en la misma red.', lead: 'Puestos de atención y sistemas de la terminal sobre una red identificada y certificada.', more: '101',
        proof: { id: '3068', title: 'Aeropuertos Argentina 2000', what: 'Redes de datos y fibra óptica · 2025', href: '/antecedentes/3068/implementacion-de-redes-de-datos-y-fibra-optica-aeropuerto' } },
      { t: 6.6, kicker: 'En accesos y control', title: 'Cada acceso, visto y registrado.', lead: 'Videovigilancia y control de acceso integrados al centro de control de la terminal.', more: '102', scrim: ['40%', '52%', '66%'],
        proof: { id: '3065', title: 'Aeropuerto de Mendoza', what: 'Cámaras de CCTV · 2025', href: '/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza' } },
      LAYERS_MOMENT('Cuatro sistemas para una operación que no espera.', 'Los diseñamos, instalamos y documentamos como uno solo.',
        { id: '3076', title: 'Aeropuerto de San Juan', what: 'Detección de incendios · 2025', href: '/antecedentes/3076/sistena-deteccion-de-incendios-aa2000-san-juan' }),
      { t: 15.6, kicker: 'Después de la obra', title: 'Y cuando sale el último vuelo, seguimos de guardia.', lead: 'Soporte 24/7, mantenimiento con SLA y respuesta en sitio.', go: true },
    ],
  },
  industria: {
    scene: 'planta', label: 'Industria',
    stats: [['24/7', 'Soporte'], ['22', 'Años']],
    moments: [
      { t: 0, kicker: 'Industria', title: 'Una planta parada cuesta cada minuto.', lead: 'Infraestructura técnica que acompaña el proceso productivo: datos, energía, seguridad y detección.' },
      { t: 2.8, kicker: 'En cada celda', title: 'Cada máquina, conectada a la red de planta.', lead: 'Fibra y cableado industrial hasta cada celda de trabajo, con datos de producción en tiempo real.', more: '101',
        proof: { id: '3143', title: 'PREMIX S.A.', what: 'Tendido de fibra óptica · 2023', href: '/antecedentes/3143/provision-y-despliegue-tendido-de-fibra-optica' } },
      { t: 6.6, kicker: 'En el tablero', title: 'Energía y protecciones, ordenadas en un tablero.', lead: 'Alimentación, protecciones y control dimensionados para que una falla no detenga la línea.', more: '108', scrim: ['40%', '52%', '66%'] },
      LAYERS_MOMENT('Cuatro sistemas debajo de la producción.', 'Los diseñamos, instalamos y documentamos como uno solo.'),
      { t: 15.6, kicker: 'Después de la obra', title: 'Y el turno noche también tiene soporte.', lead: 'Mesa de ayuda 24/7, mantenimiento preventivo y correctivo con SLA.', go: true },
    ],
  },
  bodegas: {
    scene: 'bodega', label: 'Bodegas',
    stats: [['24/7', 'Soporte'], ['22', 'Años']],
    moments: [
      { t: 0, kicker: 'Bodegas', title: 'Del tanque a la botella, todo medido.', lead: 'La información acompaña el proceso: instrumentación, red, seguridad y detección en una misma infraestructura.' },
      { t: 2.8, kicker: 'En la elaboración', title: 'Cada tanque, a la vista del enólogo.', lead: 'Instrumentación y red conectan cada etapa de la elaboración.', more: '101' },
      { t: 6.6, kicker: 'En el fraccionamiento', title: 'La línea de envasado, en la misma red.', lead: 'Fraccionamiento, depósito y sistemas de gestión sobre la misma infraestructura.', more: '104', scrim: ['40%', '52%', '66%'],
        proof: { id: '3218', title: 'Bodega La Esmeralda', what: 'Software y digitalización de procesos · 2022', href: '/antecedentes/3218/desarrollo-de-software-y-digitalizacion-de-procesos-bodega-la-esmeralda' } },
      LAYERS_MOMENT('Cuatro sistemas en cada etapa del proceso.', 'Los diseñamos, instalamos y documentamos como uno solo.',
        { id: '3190', title: 'Bodega Antigal', what: 'Detección de incendios · 2023', href: '/antecedentes/3190/sistema-de-deteccion-de-incendios-para-bodega-antigal' }),
      { t: 15.6, kicker: 'Después de la obra', title: 'Y la infraestructura sigue disponible después de la obra.', lead: 'Soporte de infraestructura IT de alta disponibilidad, con mesa de ayuda 24/7 y mantenimiento con SLA.', go: true,
        proof: { id: '3091', title: 'Bodega La Esmeralda', what: 'Soporte de infraestructura IT · 2025', href: '/antecedentes/3091/soporte-de-infraestructura-it-de-alta-disponibilidad-bodega-la-esmeralda' } },
    ],
  },
  mineria: {
    scene: 'mineria', label: 'Minería',
    stats: [['24/7', 'Soporte'], ['22', 'Años']],
    moments: [
      { t: 0, kicker: 'Minería', title: 'En el cerro, comunicarse es seguridad.', lead: 'Conectamos los puntos de una operación distribuida: sitios, campamento y despacho.' },
      { t: 2.8, kicker: 'Entre sitios', title: 'Donde no llega la fibra, llega el radioenlace.', lead: 'Enlaces con línea de vista entre mástiles, dimensionados para el terreno y el clima.', more: '103',
        proof: { id: '3624', title: 'José Nucete e Hijos', what: 'Enlace punto a punto entre sitios · 2021', href: '/antecedentes/3624/enlace-punto-a-punto-entre-nucete-y-chalet' } },
      { t: 6.6, kicker: 'Hasta el despacho', title: 'Cada comunicación llega al puesto de despacho.', lead: 'La red lleva voz, datos y video desde el campo hasta quien coordina la operación.', more: '101', scrim: ['40%', '52%', '66%'] },
      LAYERS_MOMENT('Cuatro sistemas lejos de todo.', 'Energía, datos, seguridad y detección para sitios remotos, como un solo sistema.'),
      { t: 15.6, kicker: 'Después de la obra', title: 'Y el soporte llega aunque el sitio esté lejos.', lead: 'Monitoreo remoto, mantenimiento con SLA y respuesta en campo.', go: true },
    ],
  },
};
