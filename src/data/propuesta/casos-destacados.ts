/** Curaduría local respaldada por el catálogo vivo, SGI y registros existentes. */
import type { Parte } from '../../components/proto/despiece';

export interface CasoDestacado {
  id: number;
  client: string;
  kicker: string;
  title: string;
  introduction: string;
  scope: string[];
  evidence: Array<{ value: string; label: string }>;
  parts: Parte[];
  sourceRefs: string[];
  imageKind: 'illustration' | 'documented-photo';
  outcome?: string;
}

export const CASOS_DESTACADOS: readonly CasoDestacado[] = [
  {
    id: 3126,
    client: 'Aeropuertos Argentina 2000',
    kicker: 'Aeropuertos · detección de incendios',
    title: 'Detección de incendios en el balizamiento del aeropuerto',
    introduction: 'La detección de incendios se instaló y montó en el balizamiento principal, los sectores norte y sur y el área de Mantenimiento Central del aeropuerto.',
    scope: [
      'Instalación y montaje de sistemas de detección de incendios.',
      'Cobertura en balizamiento principal, norte, sur y Mantenimiento Central.',
    ],
    evidence: [
      { value: '3', label: 'centrales Notifier NFS-320-SP' },
      { value: '3', label: 'placas de red Notifier NC-NCM-SF' },
      { value: '3', label: 'detectores Notifier FSP-951 base B501' },
    ],
    parts: [
      { key: 'central', code: '107', label: 'Central Notifier NFS-320-SP', qty: 3 },
      { key: 'modulo', code: '107', label: 'Placa de red Notifier NC-NCM-SF', qty: 3 },
      { key: 'detector', code: '107', label: 'Detector Notifier FSP-951 base B501', qty: 3 },
    ],
    sourceRefs: ['auditoría viva: ficha 3126', 'src/data/sgi/fechas.json#3126', 'src/data/snapshots/antecedentes.json#3126', 'src/data/antecedentes_completos.js#11146'],
    imageKind: 'illustration',
  },
  {
    id: 3144,
    client: 'Ministerio de Desarrollo Social, Salud y Deportes del Gobierno de MZA',
    kicker: 'Salud · cableado estructurado',
    title: 'Cableado estructurado para la Casa de la Salud de la Mujer',
    introduction: 'El nuevo edificio de la Casa de la Salud de la Mujer contempla cableado Cat. 6 LSZH para datos y telefonía, racks murales y fibra monomodo.',
    scope: [
      'Cableado estructurado para el nuevo edificio.',
      'Puestos diferenciados para datos y telefonía.',
      'Racks murales y tendido de fibra monomodo.',
    ],
    evidence: [
      { value: '43', label: 'puestos de datos Cat. 6 LSZH' },
      { value: '18', label: 'puestos de telefonía Cat. 6 LSZH' },
      { value: '4 × 9U', label: 'racks murales' },
      { value: '4', label: 'fibras monomodo tendidas' },
    ],
    parts: [
      { key: 'cableado', code: '101', label: 'Puestos de datos Cat. 6 LSZH', qty: 43 },
      { key: 'cableado', code: '103', label: 'Puestos de telefonía Cat. 6 LSZH', qty: 18 },
      { key: 'rack', code: '101', label: 'Racks murales de 9U', qty: 4 },
      { key: 'fibra', code: '101', label: 'Fibras monomodo tendidas', qty: 4 },
    ],
    sourceRefs: ['auditoría viva: ficha 3144', 'src/data/sgi/fechas.json#3144', 'src/data/snapshots/antecedentes.json#3144', 'src/data/antecedentes_completos.js#11145'],
    imageKind: 'illustration',
  },
  {
    id: 3119,
    client: 'Poder Judicial Mendoza',
    kicker: 'Gobierno · infraestructura eléctrica IT',
    title: 'Tableros eléctricos para circuitos de informática',
    introduction: 'La remodelación de tableros eléctricos para informática en el Edificio II del Poder Judicial en San Martín incluye gabinetes IP65 y unidades auxiliares.',
    scope: [
      'Armado de tableros eléctricos para circuitos de informática.',
      'Gabinetes secundarios destinados a funciones auxiliares.',
    ],
    evidence: [
      { value: '8', label: 'tableros eléctricos' },
      { value: '120', label: 'bocas de capacidad · gabinete principal IP65' },
      { value: '10', label: 'bocas de capacidad · gabinete secundario' },
    ],
    parts: [
      { key: 'tablero', code: '108', label: 'Tablero eléctrico', qty: 8 },
      { key: 'tablero', code: '108', label: 'Gabinete principal IP65 · capacidad: 120 bocas' },
      { key: 'tablero', code: '108', label: 'Gabinete secundario · capacidad: 10 bocas' },
    ],
    sourceRefs: ['auditoría viva: ficha 3119', 'src/data/sgi/fechas.json#3119', 'src/data/snapshots/antecedentes.json#3119', 'src/data/antecedentes_completos.js#11141'],
    imageKind: 'illustration',
  },
  {
    id: 3588,
    client: 'Kristich Desarrollos',
    kicker: 'Construcción · portería IP y CCTV',
    title: 'Portería IP y CCTV para el complejo DTP Marqués',
    introduction: 'El complejo de departamentos DTP Marqués combina portería IP y CCTV con estaciones interiores, cámaras analógicas, switches PoE, grabación y UPS.',
    scope: [
      'Sistema de portería IP para el complejo de departamentos.',
      'CCTV con switches PoE, DVR y cámaras analógicas.',
      'Rack mural con canal de tensión y UPS.',
    ],
    evidence: [
      { value: '31', label: 'estaciones interiores' },
      { value: '13', label: 'cámaras analógicas' },
      { value: '4', label: 'switches PoE' },
      { value: '1', label: 'DVR de 16 canales' },
    ],
    parts: [
      { key: 'telefono', code: '103', label: 'Frente de portero IP', qty: 1 },
      { key: 'telefono', code: '103', label: 'Estaciones interiores', qty: 31 },
      { key: 'camara', code: '102', label: 'Cámaras analógicas', qty: 13 },
      { key: 'switch', code: '101', label: 'Switches PoE', qty: 4 },
      { key: 'nvr', code: '102', label: 'DVR de 16 canales', qty: 1 },
      { key: 'rack', code: '101', label: 'Rack mural con canal de tensión', qty: 1 },
      { key: 'ups', code: '108', label: 'UPS' },
    ],
    sourceRefs: ['auditoría viva: ficha 3588', 'src/data/sgi/fechas.json#3588', 'src/data/snapshots/antecedentes.json#3588', 'src/data/antecedentes_completos.js#11154'],
    imageKind: 'illustration',
  },
  {
    id: 3102,
    client: 'FUESMEN · Fundación Escuela Medicina Nuclear',
    kicker: 'Salud · red de datos',
    title: 'Cableado estructurado para el Hospital General Las Heras',
    introduction: 'En el Hospital General Las Heras, en Tupungato, el alcance de cableado de datos especifica Cat. 6 LSZH, puestos simples y dobles y racks de piso y murales.',
    scope: [
      'Cableado estructurado para el hospital.',
      'Puestos de datos Categoría 6 LSZH.',
      'Racks de piso y racks murales.',
    ],
    evidence: [
      { value: '45', label: 'puestos simples de datos Cat. 6 LSZH' },
      { value: '25', label: 'puestos dobles de datos Cat. 6 LSZH' },
      { value: '1 × 40U', label: 'rack de piso · 1000 mm' },
      { value: '4 × 15U', label: 'racks murales · 500 mm' },
    ],
    parts: [
      { key: 'cableado', code: '101', label: 'Puestos simples de datos Cat. 6 LSZH', qty: 45 },
      { key: 'cableado', code: '101', label: 'Puestos dobles de datos Cat. 6 LSZH', qty: 25 },
      { key: 'rack', code: '101', label: 'Rack de piso · 40U · 1000 mm', qty: 1 },
      { key: 'rack', code: '101', label: 'Racks murales · 15U · 500 mm', qty: 4 },
    ],
    sourceRefs: ['auditoría viva: ficha 3102', 'src/data/sgi/fechas.json#3102', 'src/data/snapshots/antecedentes.json#3102', 'src/data/antecedentes_completos.js#11173'],
    imageKind: 'illustration',
  },
  {
    id: 3099,
    client: 'Headcomm S.A.',
    kicker: 'Comercio mayorista · datos y fibra óptica',
    title: 'Red de datos y fibra óptica para sucursales de Yaguar',
    introduction: 'El alcance de las sucursales de Yaguar en Mendoza y San Juan combina 16 puestos de datos Cat. 6, fibra monomodo de 12 hilos entre racks y equipamiento de distribución.',
    scope: [
      'Cableado Cat. 6 para 16 puestos de datos: 6 estándar y 10 destinados a AP.',
      'Tendido de fibra monomodo entre racks.',
      'Instalación de rack mural, ODF y fusionado de fibra.',
    ],
    evidence: [
      { value: '16', label: 'puestos de datos Cat. 6' },
      { value: '6', label: 'puestos estándar' },
      { value: '10', label: 'puestos de datos destinados a AP' },
      { value: '12 hilos', label: 'fibra monomodo entre racks' },
      { value: '12U', label: 'rack mural' },
    ],
    parts: [
      { key: 'cableado', code: '101', label: 'Puestos de datos Cat. 6', qty: 16 },
      { key: 'fibra', code: '101', label: 'Fibra monomodo entre racks · 12 hilos' },
      { key: 'rack', code: '101', label: 'Rack mural de 12U' },
      { key: 'canalizacion', code: '101', label: 'Cañería secundaria' },
      { key: 'fibra', code: '101', label: 'ODF y fusionado de fibra' },
    ],
    sourceRefs: ['auditoría viva: ficha 3099', 'src/data/sgi/fechas.json#3099', 'src/data/snapshots/antecedentes.json#3099', 'src/data/antecedentes_completos.js#11176'],
    imageKind: 'illustration',
  },
  {
    id: 3103,
    client: 'FUESMEN · Fundación Escuela Medicina Nuclear',
    kicker: 'Salud · Hospital Uspallata',
    title: 'Cableado y puestos de datos para el Hospital Uspallata',
    introduction: 'La red del Hospital Uspallata incluye puestos de datos Cat. 6 LSZH, canalización, cableado hacia los puestos de trabajo y un rack mural.',
    scope: [
      'Puestos simples de datos Categoría 6 LSZH.',
      'Canalización y cableado para puestos de trabajo.',
      'Rack mural de 15U.',
    ],
    evidence: [
      { value: '33', label: 'puestos de datos Cat. 6 LSZH' },
      { value: '1 × 15U', label: 'rack mural' },
    ],
    parts: [
      { key: 'cableado', code: '101', label: 'Puestos simples de datos Cat. 6 LSZH', qty: 33 },
      { key: 'canalizacion', code: '101', label: 'Canalización y cableado a puestos de trabajo' },
      { key: 'rack', code: '101', label: 'Rack mural de 15U', qty: 1 },
    ],
    sourceRefs: ['auditoría viva: ficha 3103', 'src/data/sgi/fechas.json#3103', 'src/data/snapshots/antecedentes.json#3103', 'src/data/antecedentes_completos.js#11174'],
    imageKind: 'illustration',
  },
  {
    id: 3085,
    client: 'FUESMEN · Fundación Escuela Medicina Nuclear',
    kicker: 'Salud · Hospital Perrupato',
    title: 'Redes de datos y tableros para el Hospital Perrupato',
    introduction: 'El proyecto del Hospital Perrupato reúne redes de datos y tableros eléctricos. El alcance de datos documenta puestos Cat. 6 LSZH simples y dobles.',
    scope: [
      'Cableado estructurado y redes de datos para el Hospital Perrupato.',
      'Tableros eléctricos.',
    ],
    evidence: [
      { value: '56', label: 'puestos simples Cat. 6 LSZH' },
      { value: '29', label: 'puestos dobles Cat. 6 LSZH' },
    ],
    parts: [
      { key: 'cableado', code: '101', label: 'Puestos simples de datos Cat. 6 LSZH', qty: 56 },
      { key: 'cableado', code: '101', label: 'Puestos dobles de datos Cat. 6 LSZH', qty: 29 },
      { key: 'rack', code: '101', label: 'Racks murales de 15U' },
      { key: 'tablero', code: '108', label: 'Tableros eléctricos' },
    ],
    sourceRefs: ['auditoría viva: ficha 3085', 'src/data/sgi/fechas.json#3085', 'src/data/snapshots/antecedentes.json#3085', 'src/data/antecedentes_completos.js#11179'],
    imageKind: 'illustration',
  },
  {
    id: 3640,
    client: 'Cervecería y Maltería Quilmes',
    kicker: 'Industria · CCTV',
    title: 'Cámaras de seguridad para camarines y oficina de elaboración',
    introduction: 'En camarines y oficina de elaboración se colocaron cámaras de seguridad con UTP Cat. 6 interior y accesorios; las cámaras fueron provistas por Quilmes.',
    scope: [
      'Colocación de cámaras en distintos sectores.',
      'Camarines y oficina de elaboración.',
      'Cableado UTP Cat. 6 interior y accesorios de conexión.',
    ],
    evidence: [
      { value: '5', label: 'cámaras de seguridad' },
      { value: '150 m', label: 'UTP Cat. 6 interior · camarines' },
      { value: '150 m', label: 'UTP Cat. 6 interior · oficina de elaboración' },
    ],
    parts: [
      { key: 'camara', code: '102', label: 'Cámaras de seguridad', qty: 5 },
      { key: 'cableado', code: '101', label: '150 m UTP Cat. 6 interior · camarines' },
      { key: 'cableado', code: '101', label: '150 m UTP Cat. 6 interior · oficina de elaboración' },
    ],
    sourceRefs: ['auditoría viva: ficha 3640', 'src/data/sgi/fechas.json#3640', 'src/data/snapshots/antecedentes.json#3640', 'src/data/antecedentes_completos.js#10927'],
    imageKind: 'illustration',
  },
  {
    id: 3104,
    client: 'Aeropuertos Argentina 2000',
    kicker: 'Aeropuertos · control de acceso',
    title: 'Control de acceso para pañol y taller en el campo de vuelo',
    introduction: 'El acceso perimetral a los activos de obra en el campo de vuelo incluye pañol y taller; la intervención contempla instalación, montaje, testeo, pruebas y control.',
    scope: [
      'Control de acceso perimetral para activos de obra.',
      'Intervención en pañol y taller de trabajo del campo de vuelo.',
      'Instalación, montaje, testeo, pruebas y control.',
    ],
    evidence: [],
    parts: [
      { key: 'acceso', code: '102', label: 'Control de acceso perimetral a activos de obra' },
    ],
    sourceRefs: ['auditoría viva: ficha 3104', 'src/data/sgi/fechas.json#3104', 'src/data/snapshots/antecedentes.json#3104'],
    imageKind: 'illustration',
  },
  {
    id: 3140,
    client: 'Aeropuertos Argentina 2000',
    kicker: 'Aeropuertos · CCTV',
    title: 'CCTV para los mostradores de cobro del parking del aeropuerto',
    introduction: 'En los mostradores de cobro del parking del aeropuerto de Mendoza se instaló y puso en marcha un sistema CCTV para Aeropuertos Argentina 2000.',
    scope: [
      'Provisión y montaje de un sistema CCTV.',
      'Puesta en marcha en los mostradores de cobro del parking.',
    ],
    evidence: [],
    parts: [
      { key: 'camara', code: '102', label: 'Sistema CCTV · mostradores de cobro del parking' },
    ],
    sourceRefs: ['auditoría viva: ficha 3140', 'src/data/sgi/fechas.json#3140', 'src/data/snapshots/antecedentes.json#3140', 'src/data/antecedentes_completos.js#11158'],
    imageKind: 'illustration',
  },
  {
    id: 3116,
    client: 'Luna Maya',
    kicker: 'Bodega · conectividad',
    title: 'Cableado de datos y punto de acceso para Bodega Sur de los Andes',
    introduction: 'En una suite de Bodega Sur de los Andes, el alcance une cableado de datos con provisión y configuración de un punto de acceso para Luna Maya.',
    scope: [
      'Cableado de datos para una suite.',
      'Provisión y configuración de un punto de acceso.',
    ],
    evidence: [],
    parts: [
      { key: 'cableado', code: '101', label: 'Cableado de datos para una suite' },
      { key: 'ap', code: '101', label: 'Punto de acceso configurado' },
    ],
    sourceRefs: ['auditoría viva: ficha 3116', 'src/data/sgi/fechas.json#3116', 'src/data/snapshots/antecedentes.json#3116', 'src/data/antecedentes_completos.js#11162'],
    imageKind: 'illustration',
  },
];

export const PORTADA_CASOS_IDS: readonly number[] = [3588, 3144, 3126];

export const casoDestacadoDe = (id: number): CasoDestacado | undefined =>
  CASOS_DESTACADOS.find((caso) => caso.id === id);
