type Group = { label?: string; question: string; reference?: { id:number; client:string; title?:string } };
type Service = { name: string; question: string; groups: Record<string, Group> };

export const serviceJourney: Record<string, Service> = {
  '101': { name: 'Redes', question: '¿Qué sectores necesitás conectar y cuántos puntos de red hay que cubrir?', groups: {
    'Fibra óptica': { question: '¿Qué puntos necesitás unir con fibra y a qué distancia están?', reference: { id: 3099, client: "Headcomm S.A." } },
    'Racks, switches y salas técnicas': { question: '¿Qué equipos y conexiones tiene que alojar la sala técnica?', reference: { id: 3072, client: "Hospital a Italo Perrupato" } },
    'Cableado y certificación': { question: '¿Cuántos puestos hay que cablear o certificar y en qué sedes?' },
    'Radioenlaces Punto a Punto': { question: '¿Dónde están los dos extremos del enlace y qué distancia los separa?' },
  }},
  '102': { name: 'Seguridad electrónica', question: '¿Qué zonas necesitás proteger y qué cámaras o controles de acceso tenés instalados?', groups: {
    'Videovigilancia IP': { question: '¿Qué zonas necesitás observar y durante cuánto tiempo necesitás conservar las grabaciones?', reference: { id: 3078, client: "Fundación COPROSAMEN" } },
    'Control de Acceso Biométrico': { label: 'Control de accesos', question: '¿Qué accesos querés controlar y quién debe poder ingresar?', reference: { id: 3104, client: "Aeropuertos Argentina 2000" } },
    'Detección de Intrusos PIR': { question: '¿Qué espacios quedan desocupados y quién debería recibir la alerta?' },
    'Integración con detección de incendios': { question: '¿Qué central está instalada y desde dónde se reciben sus avisos?' },
  }},
  '103': { name: 'Telecomunicaciones', question: '¿Qué sedes necesitás conectar y qué conectividad tienen hoy?', groups: {
    'Telefonía IP': { question: '¿Cuántos internos y sedes deben comunicarse?', reference: { id: 3094, client: "Cooperadora Hospital Schestakow" } },
    'Sistema de Voceo y PA': { question: '¿En qué zonas deben escucharse los avisos?', reference: { id: 3087, client: "Aeropuertos Argentina 2000" } },
    'Radiotroncalizado Digital': { question: '¿Qué equipos de trabajo necesitan comunicarse por radio y en qué área?' },
    'Videocolaboración Profesional': { question: '¿Cuántas salas hay que conectar y qué equipos tienen hoy?' },
  }},
  '104': { name: 'Software a medida', question: '¿Qué proceso querés digitalizar y con qué sistemas tiene que integrarse?', groups: {
    'Aplicaciones a medida': { question: '¿Qué tarea querés digitalizar y quién la realiza hoy?', reference: { id: 3064, client: "Gobierno de Mendoza" } },
    'Sistemas ERP/CRM': { question: '¿Qué áreas necesitan compartir información de clientes u operaciones?' },
    'Integración y automatización': { question: '¿Qué datos pasan hoy de un sistema al otro y cómo se cargan?', reference: { id: 3348, client: "Fundación Santa María" } },
    'Business Intelligence': { question: '¿Qué decisión necesita el tablero y de qué fuentes salen los datos?' },
  }},
  '105': { name: 'Soporte 24/7', question: '¿Qué sedes o equipos necesitan soporte y en qué horarios?', groups: {
    'Atención y gestión de incidentes': { question: '¿Qué servicio necesita atención, en qué sede y en qué horario?', reference: { id: 3079, client: "Municipalidad de Guaymallén" } },
    'Mantenimiento y monitoreo': { question: '¿Qué infraestructura necesitás mantener y qué interrupciones afectan la operación?', reference: { id: 3220, client: "Mendoza Fiduciaria S.A." } },
    'Backup y Recuperación': { question: '¿Qué información necesitás recuperar y en cuánto tiempo?', reference: { id: 3238, client: "José Nucete e Hijos S.A." } },
  }},
  '106': { name: 'Consultoría IT', question: '¿Qué decisión tecnológica necesitás tomar y qué infraestructura tenés hoy?', groups: {
    'Diagnóstico y evaluación': { question: '¿Qué parte de la infraestructura necesitás evaluar y para qué decisión?', reference: { id: 3672, client: "Cliente Confidencial", title:"Diagnóstico de infraestructura IT" } },
    'Planificación y arquitectura': { question: '¿Qué proyecto estás planificando y qué instalaciones deben integrarse?', reference: { id: 3477, client: "Procon S.R.L. · Laugero Construcciones S.A. · Unión Transitoria" } },
    'Cumplimiento Normativo': { question: '¿Qué requisitos o pliego tiene que cumplir el proyecto?' },
  }},
  '107': { name: 'Detección de incendios', question: '¿Qué espacios hay que cubrir y qué detectores o alarmas tenés instalados?', groups: {
    'Central, control y supervisión': { question: '¿Qué central tienen instalada y en qué puesto se reciben los avisos?', reference: { id: 3114, client: "Hospital a Italo Perrupato" } },
    'Detectores según el ambiente': { question: '¿Qué ambientes necesitás cubrir y qué condiciones tienen?', reference: { id: 3168, client: "Bodega La Esmeralda" } },
    'Activación manual y aviso de alarma': { question: '¿En qué sectores se debe activar o percibir el aviso de alarma?', reference: { id: 3660, client: "Cliente Confidencial", title:"Provisión de detectores, sirena y pulsadores" } },
  }},
  '108': { name: 'Eléctricos IT', question: '¿Qué equipos tienen que seguir funcionando ante un corte y por cuánto tiempo?', groups: {
    'Distribución y puesta a tierra': { question: '¿Qué circuitos o tableros alimentan hoy los equipos de informática?', reference: { id: 3119, client: "Poder Judicial Mendoza" } },
    'Respaldo de energía': { question: '¿Qué equipos tienen que seguir funcionando ante un corte y por cuánto tiempo?', reference: { id: 3178, client: "Municipalidad de Gral San Martín" } },
    'Instalaciones Fotovoltaicas': { question: '¿Dónde está el sitio y qué consumo se necesita abastecer?' },
    'Medición y calidad de energía': { question: '¿Qué problemas eléctricos observás y en qué circuitos?' },
  }},
};

export const sectorJourney: Record<string, {name:string; site:string; question:string}> = {
  aeropuertos: {name:'Aeropuertos', site:'la terminal', question:'¿En qué área de la terminal se interviene y qué horarios debe respetar la obra?'},
  bodegas: {name:'Bodegas', site:'la bodega', question:'¿En qué zona de la bodega y en qué etapa de producción necesitás intervenir?'},
  constructoras: {name:'Constructoras', site:'la obra', question:'¿En qué etapa está la obra y qué instalaciones deben coordinarse?'},
  gobiernosectorpublico: {name:'Gobierno y Sector Público', site:'las dependencias', question:'¿Qué dependencias deben conectarse o seguir atendiendo durante la intervención?'},
  industria: {name:'Industria', site:'la planta', question:'¿Qué línea o área de planta necesita la intervención y cuándo puede detenerse?'},
  mineria: {name:'Minería', site:'la operación minera', question:'¿Dónde está la operación y qué conectividad y energía hay disponibles en el sitio?'},
  salud: {name:'Salud', site:'el establecimiento de salud', question:'¿En qué áreas hay que intervenir y qué servicios deben seguir atendiendo?'},
  'seguridad-electronica': {name:'Seguridad electrónica', site:'la instalación', question:'¿Qué ingreso o área necesitás supervisar y desde qué puesto?'},
  software: {name:'Software', site:'la organización', question:'¿Qué tarea hace hoy tu equipo y con qué sistema necesita intercambiar datos?'},
};

export function journeyContext(params: URLSearchParams) {
  if (params.get('budgetSector') === 'Bodegas') {
    const zone = params.get('budgetScope');
    if (zone === 'Ingreso') return {subject:'Bodegas · Ingreso', question:'¿Desde qué puesto necesitás atender el ingreso a la bodega?'};
    if (zone === 'Nave de producción') return {subject:'Bodegas · Nave de producción', question:'¿Qué áreas de la nave necesitás cubrir con detección de incendios?'};
  }
  const code = params.get('sistema') || '';
  const slug = params.get('sector') || '';
  const sector = Object.prototype.hasOwnProperty.call(sectorJourney, slug) ? sectorJourney[slug] : undefined;
  if (!/^10[1-8]$/.test(code)) return sector ? { subject: sector.name, question: sector.question } : undefined;
  const service = serviceJourney[code];
  if (!service?.name) return;
  if (sector?.name) {
    if (slug === 'mineria' && code === '103') {
      return {
        subject: 'Minería · Enlace entre base y campamento',
        question: '¿Qué distancia hay entre la base y el campamento y qué necesitás transmitir entre ambos?',
      };
    }
    const site = sector.site;
    const questions: Record<string,string> = {
      '101': `¿Qué áreas hay que conectar en ${site} y cuántos puestos necesitan red?`,
      '102': `¿Qué accesos necesitás supervisar en ${site} y desde dónde se monitorean?`,
      '103': `¿Qué puntos de ${site} deben comunicarse y qué enlaces existen hoy?`,
      '104': `¿Qué proceso de ${site} querés digitalizar y con qué sistema intercambia datos?`,
      '105': `¿Qué equipos de ${site} necesitan soporte y en qué horarios?`,
      '106': sector.question,
      '107': `¿Qué ambientes necesitás cubrir en ${site} y dónde se reciben las alarmas?`,
      '108': `¿Qué equipos de ${site} necesitan respaldo y durante cuánto tiempo?`,
    };
    return { subject: sector.name + ' · ' + service.name, question: (questions[code] || sector.question).replace('de el ', 'del ') };
  }
  const title = params.get('grupo') || '';
  const group = service.groups[title];
  if (group?.question) return { subject: service.name + ' · ' + (group.label || title), question: group.question };
  return { subject: service.name, question: service.question };
}
