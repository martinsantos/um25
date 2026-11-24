import { isNamedClient } from './catalogEditorial';
import { publicCaseFor } from './casePresentation';
import { isShowcaseProject } from './caseSelection';
import { casoDe } from './relato';
import { SECTOR_PHOTO, type Story } from './isoData';

type Link = { label: string; href: string };
export type Project = {
  key: string; sector: string; title: string; client: string; scope: string;
  measure?: [string, string]; image?: string; contextImage?: string; links: Link[]; fact?: string;
};

export function portadaCases(stories: Story[], surface: 'inicio' | 'servicios' | 'sectores' | 'antecedentes' | 'blog') {
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
    { id:10742, page:'/servicios/101', key:'fibra-municipal', sector:'Red metropolitana', title:'Fibra aérea entre el municipio y el centro de congresos', measure:['6,5 km','de fibra óptica aérea'] },
    { id:10768, page:'/sectores/industria', key:'compresoras', sector:'Infraestructura de gas', title:'Voz y datos para las plantas compresoras de Córdoba', measure:['3','plantas compresoras'] },
    { id:10762, page:'/sectores/industria', key:'ferrocarril', sector:'Transporte ferroviario', title:'Equipamiento embarcado en locomotoras', measure:['9','locomotoras con equipamiento embarcado'] },
    { id:10738, page:'/sectores/aeropuertos', key:'torre-cordoba', sector:'Aviación', title:'Sonido, detección de incendios, datos y telefonía en la torre de control de Córdoba' },
    { id:10770, page:'/servicios/103', key:'wifi-mendoza', sector:'Telecomunicaciones', title:'Radioenlaces para la red WiFi Mendoza', measure:['40','puntos de distribución'] },
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
    blog:['wifi-mendoza','conicet','energia','justicia','campo-vuelo','yaguar','distribucion'],
  }[surface];
  return order.flatMap(key => projects.filter(project => project.key === key));
}
