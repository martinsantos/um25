import { titulosArchivo } from './titulosArchivo';
import { isNamedClient } from './catalogEditorial';
import { publicCaseFor } from './casePresentation';
import { isShowcaseProject } from './caseSelection';
import { casoDe } from './relato';
import { SECTOR_PHOTO, type Story } from './isoData';
import { publicDespiecePath } from '../../lib/despieceRoutes';

type Link = { label: string; href: string };
type Evidence = readonly [value: string, label: string];
export type Project = {
  key: string; sector: string; title: string; client: string; scope: string;
  measure?: [string, string]; image?: string; contextImage?: string; links: Link[]; fact?: string; editorialScope?: string; editorialEvidence?: readonly Evidence[];
};

// Cada titular se apoya en el alcance documentado por las fichas enlazadas.
const editorialCopy: Record<string, { title: string; scope: string; evidence?: readonly Evidence[]; links: string[] }> = {
  yaguar: {
    title: 'Red de datos para los puestos y el Wi-Fi de Yaguar',
    scope: 'En dos sucursales, una en Mendoza y otra en San Juan, conectamos los racks con fibra monomodo de 12 hilos y dejamos puntos de red para los equipos Wi-Fi.',
    evidence: [['16', 'puestos Cat. 6 en total'], ['10', 'destinados a equipos Wi-Fi']],
    links: ['Ver la red instalada'],
  },
  hospitales: {
    title: 'Puestos de trabajo conectados en tres hospitales',
    scope: 'Conectamos los puestos a racks en General Las Heras y Uspallata. En Perrupato integramos el cableado de datos con el armado de tableros eléctricos.',
    evidence: [['56', 'puestos simples en Perrupato'], ['29', 'puestos dobles en Perrupato']],
    links: ['Perrupato', 'General Las Heras', 'Uspallata'],
  },
  bodega: {
    title: 'Del centro de datos a la trazabilidad de alimentos',
    scope: 'Pusimos en marcha el centro de datos, integramos telefonía, accesos y detección en oficinas, y desarrollamos software de trazabilidad para respaldar la certificación orgánica.',
    links: ['Centro de datos', 'Trazabilidad', 'Sistemas de oficinas'],
  },
  compresoras: {
    title: 'Ingeniería de voz y datos para las compresoras de gas',
    scope: 'Diseñamos la red de telecomunicaciones de Tío Pujio, Leones y Candelarias, en Córdoba.',
    evidence: [['3', 'plantas en el proyecto de ingeniería']],
    links: ['Ver ingeniería de red'],
  },
  ferrocarril: {
    title: 'Telecomunicaciones a bordo de locomotoras',
    scope: 'Para EMEPA, montamos e instalamos el equipamiento de comunicaciones directamente en las unidades.',
    evidence: [['9', 'locomotoras equipadas']],
    links: ['Ver montaje a bordo'],
  },
  'fibra-municipal': {
    title: 'Fibra entre el municipio y el centro de congresos',
    scope: 'Tendimos la red entre la sede municipal y el Centro de Congresos y Exposiciones de San Martín.',
    evidence: [['6,5 km', 'de fibra óptica aérea']],
    links: ['Ver el tendido'],
  },
  aeropuerto: {
    title: 'Detección de incendios para zonas operativas de El Plumerillo',
    scope: 'En la remodelación instalamos detección en el estacionamiento y los edificios externos. Otra intervención cubrió balizamiento y Mantenimiento Central.',
    evidence: [['3', 'centrales de detección en la obra de balizamiento']],
    links: ['Remodelación del aeropuerto', 'Detección en balizamiento'],
  },
  justicia: {
    title: 'Validación de usuarios y documentos en el portal judicial',
    scope: 'Integramos la validación de usuarios, la certificación de documentos con sello de tiempo y un asistente de consultas conectado a los servicios internos del Poder Judicial.',
    links: ['Ver el desarrollo del portal'],
  },
  'wifi-mendoza': {
    title: 'Radioenlaces para distribuir Wi-Fi Mendoza',
    scope: 'Implementamos los enlaces de radio y la distribución de los servicios hasta los puntos de conexión del proyecto.',
    evidence: [['40', 'puntos de distribución']],
    links: ['Ver la red de radioenlaces'],
  },
  marques: {
    title: 'Portería IP y videovigilancia para DTP Marqués',
    scope: 'Conectamos el frente de portería con las estaciones interiores del complejo e instalamos videovigilancia con grabación.',
    evidence: [['31', 'estaciones interiores'], ['13', 'cámaras analógicas']],
    links: ['Ver portería y cámaras'],
  },
  estadio: {
    title: 'Red y telefonía para prensa y transmisión en el Malvinas',
    scope: 'Pusimos en servicio los puestos de prensa y transmisión. En el centro de datos reunimos los sistemas del estadio y el CCTV de la Policía de Mendoza.',
    evidence: [['200', 'puestos de prensa'], ['60', 'puestos de transmisión']],
    links: ['Prensa y transmisión', 'Adecuación de la red'],
  },
  pasip: {
    title: 'Ingeniería de infraestructura IT para el Parque PASIP',
    scope: 'Diseñamos el centro de datos y las telecomunicaciones para el parque industrial de Palmira.',
    links: ['Ver alcance de ingeniería'],
  },
  gobierno: {
    title: 'Ministerios y trámites en un portal provincial',
    scope: 'Reunimos los sitios de los ministerios de Mendoza, un buscador, un directorio de contactos y una API de trámites. La entrega incluyó capacitación y mantenimiento.',
    links: ['Ver el proyecto del Gobierno'],
  },
  'campo-vuelo': {
    title: 'Acceso controlado al pañol y al taller del campo de vuelo',
    scope: 'Montamos y probamos el control de acceso perimetral para los espacios donde se guardan los activos de obra.',
    links: ['Ver control de acceso'],
  },
  'torre-cordoba': {
    title: 'Sistemas integrados en la torre de control de Córdoba',
    scope: 'Integramos sonido, detección de incendios, datos y telefonía en la nueva torre de control del aeropuerto.',
    links: ['Ver los sistemas de la torre'],
  },
  quilmes: {
    title: 'Videovigilancia en camarines y elaboración',
    scope: 'Instalamos las cámaras provistas por Quilmes y el cableado Cat. 6 en camarines y oficina de elaboración.',
    evidence: [['5', 'cámaras de seguridad']],
    links: ['Ver la instalación'],
  },
  civit: {
    title: 'Ingeniería de datos y seguridad para Emilio Civit 75',
    scope: 'Documentamos cómo integrar el cableado, la portería, el control de acceso y el CCTV en la vivienda multifamiliar.',
    links: ['Ver alcance de ingeniería'],
  },
  'salud-mujer': {
    title: 'Redes de datos y telefonía para la Casa de la Salud de la Mujer',
    scope: 'El cableado Cat. 6 LSZH distingue los puestos para datos y telefonía, con racks murales y tendido de fibra monomodo.',
    evidence: [['43', 'puestos de datos'], ['18', 'puestos de telefonía']],
    links: ['Ver cableado y distribución'],
  },
  conicet: {
    title: 'Turnos para usar activos científicos del CONICET',
    scope: 'Desarrollamos el software que gestiona los turnos de uso de los activos científicos.',
    links: ['Ver el alcance del software'],
  },
  distribucion: {
    title: 'Gestión de ventas para una red de distribuidores',
    scope: 'Desarrollamos y mantuvimos el sistema de ventas de Sandra Marzzan, con una API de datos para el sitio web.',
    links: ['Ver el alcance del sistema'],
  },
  energia: {
    title: 'Nuevos tableros para los circuitos de informática del Poder Judicial',
    scope: 'Remodelamos los tableros del Edificio II en San Martín con gabinetes principales IP65 y unidades auxiliares.',
    evidence: [['8', 'tableros eléctricos'], ['120', 'bocas por gabinete principal']],
    links: ['Ver los tableros'],
  },
};

export function portadaCases(stories: Story[], surface: 'inicio' | 'servicios' | 'sectores' | 'antecedentes' | 'blog' | 'nosotros') {
  const current = (id: number) => stories.find(s => s.id === id && publicCaseFor(s) && isShowcaseProject(s));
  // Unmapped historical records already appear in the public archive of their sector or service.
  // If an identity is subsequently mapped to the CMS, require a fresh editorial review.
  const archived = (id: number) => {
    const record = casoDe(id);
    return record && !record.publicado ? record : undefined;
  };
  const projects: Project[] = [];
  const stadium = archived(10740);
  const stadiumNetwork = stories.find(s => s.id === 3436 && isNamedClient(s.client) && /estadio malvinas/i.test(s.title) && isShowcaseProject(s));
  if (stadium && stadium.texto.includes('200 puestos') && stadium.texto.includes('60 puestos')) {
    projects.push({ key:'estadio', measure:['200', 'puestos de prensa'], sector:'Eventos deportivos', title:'La red que conecta prensa, transmisión y control',
      client:'Estadio Malvinas Argentinas', fact:'200 puestos de prensa · 60 de transmisión', image:stadiumNetwork?.image, scope:'Cableado estructurado y telefonía interna para periodistas y transmisión. El trabajo incluyó el armado del data center que reunió los sistemas del estadio y el CCTV de la Policía de Mendoza.',
      links:[{ label:'Prensa y transmisión', href:'/sectores/constructoras#archivo-10740' }, ...(stadiumNetwork ? [{label:'Adecuación de la red',href:stadiumNetwork.href}] : [])] });
  }
  const hospitals = [current(3085), current(3102), current(3103)];
  if (hospitals.every(Boolean)) {
    const names = ['Hospital Perrupato', 'General Las Heras', 'Hospital de Uspallata'];
    projects.push({ key:'hospitales', measure:['3','hospitales'], sector:'Salud', title:'Infraestructura de red para tres hospitales',
      client:hospitals[0]!.client, scope:'En Perrupato, la obra combinó red de datos y tableros. En General Las Heras y Uspallata, los puestos de trabajo se conectaron a racks dimensionados para cada edificio.',
      fact:'Perrupato · 56 puestos simples y 29 dobles', contextImage:SECTOR_PHOTO.salud, image:hospitals[0]!.image, links:hospitals.map((s,i) => ({ label:names[i], href:s!.href })) });
  }
  if (archived(10817)) projects.push({key:'justicia', sector:'Software · Justicia', title:'Un portal judicial que valida usuarios y documentos',
    client:'Suprema Corte de Justicia de Mendoza', scope:'El desarrollo integró validación de usuarios, certificación de documentos con sello de tiempo y un chatbot conectado a los servicios web internos.',
    image:SECTOR_PHOTO.software, links:[{ label:'Ver el desarrollo del portal', href:'/servicios/104#archivo-10817' }] });
  if (archived(10798) && archived(10771) && archived(10813)) projects.push({key:'bodega',sector:'Industria vitivinícola',
    title:'Del data center a la trazabilidad de alimentos',client:'Bodega Domaine Bousquet',
    scope:'Proyectamos e implementamos el data center de la bodega. En las oficinas integramos datos, telefonía, accesos y detección de incendios. Para la producción desarrollamos el sistema de trazabilidad de alimentos.',
    image:SECTOR_PHOTO.bodegas, links:[{label:'Data center',href:'/sectores/bodegas#archivo-10771'},{label:'Trazabilidad',href:'/servicios/104#archivo-10813'},{label:'Oficinas',href:'/sectores/bodegas#archivo-10798'}]});
  const runway=current(3126);
  if (archived(10737) && runway) projects.push({ key:'aeropuerto',measure:['3','centrales de detección'],sector:'Infraestructura aeroportuaria',title:'Detección de incendios en El Plumerillo',
    client:runway.client,scope:'En la etapa IV de El Plumerillo, el alcance incluyó el estacionamiento y las edificaciones externas. Otra ficha documenta la instalación en balizamiento y Mantenimiento Central.',
    fact:'Balizamiento · 3 centrales de detección', contextImage:SECTOR_PHOTO.aeropuertos, image:runway.image,links:[{label:'Remodelación de El Plumerillo',href:'/sectores/aeropuertos#archivo-10737'},{label:'Balizamiento',href:runway.href}]});
  if (archived(10778)) projects.push({ key:'gobierno',sector:'Servicios digitales',title:'Un portal para los trámites y servicios de Mendoza',
    client:'Gobierno de Mendoza', scope:'El trabajo sobre mendoza.gov.ar reunió sitios de ministerios, buscador, directorio y API de trámites. También incluyó capacitación a usuarios y mantenimiento.',
    image:SECTOR_PHOTO.gobierno, links:[{label:'Ver el proyecto del Gobierno',href:'/servicios/104#archivo-10778'}]});
  const power=current(3119);
  if (power) projects.push({key:'energia',sector:'Energía IT',title:'Ocho tableros para los circuitos de informática',client:power.client,
    scope:'En el Edificio II de San Martín, la remodelación incluyó gabinetes IP65 y unidades auxiliares. El gabinete principal tiene capacidad para 120 bocas.',
    fact:'8 tableros eléctricos', image:power.image,links:[{label:'Ver la ficha eléctrica',href:power.href}]});
  for (const [id, key, sector] of [
    [3588, 'marques', 'Edificios residenciales'],
    [3099, 'yaguar', 'Comercio mayorista'],
    [3144, 'salud-mujer', 'Salud pública'],
    [3640, 'quilmes', 'Industria cervecera'],
    [3104, 'campo-vuelo', 'Operación aeroportuaria'],
  ] as const) {
    const story = current(id);
    const detail = story && publicCaseFor(story);
    if (!story || !detail) continue;
    const evidence = detail.evidence[0];
    projects.push({ key, sector, title: detail.title, client: story.client, scope: detail.introduction,
      fact: evidence && [evidence.value, evidence.label].join(' '), image: story.image,
      links: [{ label: 'Ver obra', href: story.href }] });
  }
  if (archived(10776)) projects.push({ key:'pasip', sector:'Parques industriales', client:'Inversora PASIP',
    title:'Ingeniería del data center y las telecomunicaciones del Parque PASIP', scope:'Proyecto de ingeniería para el parque industrial de Palmira, Mendoza.',
    links:[{ label:'Ver alcance de ingeniería',href:'/servicios/106#archivo-10776' }] });
  if (archived(11152)) projects.push({ key:'civit', sector:'Construcción', client:'PISPER S. A.',
    title:'Ingeniería de las corrientes débiles de Emilio Civit 75', scope:'Documentación de ingeniería del cableado estructurado, portería, control de acceso y CCTV de la vivienda multifamiliar.',
    links:[{label:'Ver el alcance de ingeniería',href:'/sectores/constructoras#archivo-11152'}] });
  if (archived(10779)) projects.push({ key:'distribucion', sector:'Software de gestión', client:'Sandra Marzzan',
    title:'Un sistema de ventas para la red de distribuidores', scope:'Desarrollo y mantenimiento del sistema de ventas y de la API de datos para la web.',
    links:[{label:'Ver el alcance del sistema',href:'/servicios/104#archivo-10779'}] });
  // These works have a historical scope in the public service or sector archive.
  const history: Array<{ id: number; page: string; key: string; sector: string; title: string; measure?: [string, string] }> = [
    { id:10742, page:'/servicios/101', key:'fibra-municipal', sector:'Red metropolitana', title:titulosArchivo[10742], measure:['6,5 km','de fibra óptica aérea'] },
    { id:10768, page:'/sectores/industria', key:'compresoras', sector:'Infraestructura de gas', title:titulosArchivo[10768], measure:['3','plantas compresoras'] },
    { id:10762, page:'/sectores/industria', key:'ferrocarril', sector:'Transporte ferroviario', title:titulosArchivo[10762], measure:['9','locomotoras con equipamiento embarcado'] },
    { id:10738, page:'/sectores/aeropuertos', key:'torre-cordoba', sector:'Aviación', title:'Sonido, detección de incendios, datos y telefonía en la torre de control de Córdoba' },
    { id:10770, page:'/servicios/103', key:'wifi-mendoza', sector:'Telecomunicaciones', title:titulosArchivo[10770], measure:['40','puntos de distribución'] },
    { id:10783, page:'/servicios/104', key:'conicet', sector:'Software para investigación', title:'Gestión de turnos para activos científicos del CONICET' },
  ];
  for (const {id, page, ...project} of history) {
    const record = archived(id);
    if (!record || !isNamedClient(record.cliente)) continue;
    projects.push({...project, client: record.cliente, scope: record.texto,
      links:[{label:'Ver alcance',href:page+'#archivo-'+id}]});
  }
  const order = {
    inicio:['yaguar','hospitales','bodega','compresoras','ferrocarril','fibra-municipal','aeropuerto','justicia','wifi-mendoza','marques','estadio','pasip','gobierno','energia'],
    servicios:['estadio','fibra-municipal','wifi-mendoza','energia','justicia','compresoras','campo-vuelo','aeropuerto','yaguar','pasip','marques'],
    sectores:['aeropuerto','hospitales','compresoras','bodega','ferrocarril','torre-cordoba','quilmes','yaguar','marques','civit'],
    antecedentes:['hospitales','estadio','bodega','fibra-municipal','ferrocarril','torre-cordoba','energia','salud-mujer','marques'],
    nosotros:['aeropuerto','energia','justicia'],
    blog:['wifi-mendoza','conicet','energia','justicia','campo-vuelo','yaguar','distribucion'],
  }[surface];
  const selected = order.flatMap(key => projects.filter(project => project.key === key));
  return selected.map(project => {
    const copy = editorialCopy[project.key];
    if (!copy) return project;
    return {
      ...project,
      title: copy.title,
      client: project.key === 'hospitales' ? 'FUESMEN' : project.client,
      editorialScope: copy.scope,
      editorialEvidence: copy.evidence,
      links: project.links.map((link, index) => ({
        ...link,
        label: copy.links[index] || link.label,
      })),
    };
  });
}

export const homeReferenceKeys = ['estadio', 'fibra-municipal', 'ferrocarril'] as const;
type HomeWorkSource = 'portada-inicio' | 'obras-inicio';

export function homeWorkLink(href: string, key: string, source: HomeWorkSource, position = 0) {
  const target = new URL(href, 'https://example.invalid');
  target.searchParams.set('desde', source);
  target.searchParams.set('obra', key);
  return {
    href: target.pathname + target.search + target.hash,
    id: homeWorkAnchor(key, source, position),
  };
}

function homeWorkAnchor(key: string, source: HomeWorkSource, position: number) {
  return source === 'portada-inicio' ? 'referencia-portada-' + key : 'obra-' + key + '-enlace-' + (position + 1);
}

export function homeWorkContext(params: URLSearchParams): { desde: HomeWorkSource; obra: string } | undefined {
  const desde = params.get('desde');
  const obra = params.get('obra');
  if ((desde === 'portada-inicio' || desde === 'obras-inicio') && obra && /^[a-z-]{1,32}$/.test(obra)) {
    return { desde, obra };
  }
}

/** Resolve only destinations actually linked from the current public homepage. */
export function homeWorkReturn(url: URL, stories: Story[], archiveId?: number) {
  const context = homeWorkContext(url.searchParams);
  if (!context) return;
  const target = publicDespiecePath(url.pathname) + (archiveId ? '#archivo-' + archiveId : '');
  const project = portadaCases(stories, 'inicio').find(obra => obra.key === context.obra);
  if (!project) return;

  const position = project.links.findIndex(link => link.href === target);
  if (position < 0) return;
  if (context.desde === 'portada-inicio' && (!project.measure || position !== 0 || !homeReferenceKeys.some(key => key === project.key))) return;
  return '/#' + homeWorkAnchor(project.key, context.desde, position);
}

/** Keep the verified home entry available while browsing related projects. */
export function homeProjectJourney(current: Story, input: URLSearchParams, stories: Story[]) {
  const context = homeWorkContext(input);
  if (!context) return;
  const featuredId = input.get('destacada');
  if (featuredId !== null && !/^\d{1,8}$/.test(featuredId)) return;
  const featured = featuredId === null || featuredId === String(current.id)
    ? current
    : stories.find(story => String(story.id) === featuredId);
  if (!featured) return;

  const params = new URLSearchParams(context);
  const original = new URL(featured.href, 'https://example.invalid');
  original.search = params.toString();
  const home = homeWorkReturn(original, stories);
  if (!home) return;

  const onFeatured = featured.id === current.id;
  const relatedParams = new URLSearchParams(params);
  relatedParams.set('destacada', String(featured.id));
  return {
    href: onFeatured ? home : original.pathname + original.search + '#obras-relacionadas',
    label: onFeatured ? 'Volver a obras de Inicio' : 'Volver a la obra destacada',
    contact: onFeatured ? params : relatedParams,
    relatedQuery: '?' + relatedParams.toString(),
  };
}
