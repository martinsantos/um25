import { publicCaseFor } from './casePresentation';
import { isShowcaseProject } from './caseSelection';
import { casoDe } from './relato';
import { SECTOR_PHOTO, type Story } from './isoData';

type Link = { label: string; href: string };
type Project = {
  key: string; sector: string; title: string; client: string; scope: string;
  image?: string; links: Link[];
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
  if (stadium && stadium.texto.includes('200 puestos') && stadium.texto.includes('60 puestos')) {
    projects.push({ key:'estadio', sector:'Eventos deportivos', title:'La red de prensa del Estadio Malvinas Argentinas',
      client:'Mendoza', scope:'Cableado estructurado y telefonía interna para periodistas y transmisión. El trabajo incluyó el armado del data center que reunió los sistemas del estadio y el CCTV de la Policía de Mendoza.',
      links:[{ label:'Ver el alcance de la obra', href:'/sectores/constructoras#archivo-10740' }] });
  }
  const hospitals = [current(3085), current(3102), current(3103)];
  if (hospitals.every(Boolean)) {
    const names = ['Hospital Perrupato', 'General Las Heras', 'Hospital de Uspallata'];
    projects.push({ key:'hospitales', sector:'Salud', title:'Infraestructura de red para tres hospitales',
      client:hospitals[0]!.client, scope:'En Perrupato, la obra combinó red de datos y tableros. En General Las Heras y Uspallata, los puestos de trabajo se conectaron a racks dimensionados para cada edificio.',
      image:SECTOR_PHOTO.salud, links:hospitals.map((s,i) => ({ label:names[i], href:s!.href })) });
  }
  if (archived(10817)) projects.push({key:'justicia', sector:'Software · Justicia', title:'Un portal judicial que valida usuarios y documentos',
    client:'Suprema Corte de Justicia de Mendoza', scope:'El desarrollo integró validación de usuarios, certificación de documentos con sello de tiempo y un chatbot conectado a los servicios web internos.',
    image:SECTOR_PHOTO.software, links:[{ label:'Ver el desarrollo del portal', href:'/servicios/104#archivo-10817' }] });
  if (archived(10798) && archived(10771) && archived(10813)) projects.push({key:'bodega',sector:'Industria vitivinícola',
    title:'Del data center a la trazabilidad de alimentos',client:'Bodega Domaine Bousquet',
    scope:'Tres trabajos en la misma bodega: proyecto e implementación del data center, software de trazabilidad para alimentos y sistemas de datos, telefonía, accesos e incendios para oficinas.',
    image:SECTOR_PHOTO.bodegas, links:[{label:'Data center',href:'/sectores/bodegas#archivo-10771'},{label:'Trazabilidad',href:'/servicios/104#archivo-10813'},{label:'Oficinas',href:'/sectores/bodegas#archivo-10798'}]});
  const runway=current(3126);
  if (archived(10737) && runway) projects.push({ key:'aeropuerto',sector:'Infraestructura aeroportuaria',title:'Detección de incendios en infraestructura aeroportuaria',
    client:runway.client,scope:'En la etapa IV de El Plumerillo, el alcance incluyó el estacionamiento y las edificaciones externas. Otra ficha documenta la instalación en balizamiento y Mantenimiento Central.',
    image:SECTOR_PHOTO.aeropuertos,links:[{label:'Remodelación de El Plumerillo',href:'/sectores/aeropuertos#archivo-10737'},{label:'Balizamiento',href:runway.href}]});
  if (archived(10778)) projects.push({ key:'gobierno',sector:'Servicios digitales',title:'Un portal para los trámites y servicios de Mendoza',
    client:'Gobierno de Mendoza', scope:'El trabajo sobre mendoza.gov.ar reunió sitios de ministerios, buscador, directorio y API de trámites. También incluyó capacitación a usuarios y mantenimiento.',
    image:SECTOR_PHOTO.gobierno, links:[{label:'Ver el proyecto del Gobierno',href:'/servicios/104#archivo-10778'}]});
  const power=current(3119);
  if (power) projects.push({key:'energia',sector:'Energía IT',title:'Ocho tableros para los circuitos de informática',client:power.client,
    scope:'En el Edificio II de San Martín, la remodelación incluyó gabinetes IP65 y unidades auxiliares. El gabinete principal tiene capacidad para 120 bocas.',
    image:power.image,links:[{label:'Ver la ficha eléctrica',href:power.href}]});
  const order = {
    inicio:['estadio','hospitales','justicia','bodega','aeropuerto','gobierno','energia'],
    servicios:['justicia','energia','estadio'], sectores:['hospitales','bodega','aeropuerto'],
    antecedentes:['estadio','hospitales','gobierno'], blog:['bodega','justicia'],
  }[surface];
  return order.flatMap(key => projects.filter(project => project.key === key));
}
