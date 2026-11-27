import type { Story } from './isoData';
import { catalogPresentationFor } from "../../data/catalogCasePresentation";
import { casoDestacadoDe } from "../../data/propuesta/casos-destacados";
import { isNamedClient } from "./catalogEditorial";
import { despieceDe, type Despiece } from "./despiece";

const identity = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** A shared anonymous label never establishes a relationship between customers. */
export function samePublicClient(left: string, right: string): boolean {
  return (
    isNamedClient(left) &&
    isNamedClient(right) &&
    identity(left) === identity(right)
  );
}

/** Editorial additions cannot override a changed or anonymized live CMS identity. */
export function publicCaseFor(story: { id: number; client: string }) {
  const detail = casoDestacadoDe(story.id);
  return detail && samePublicClient(detail.client, story.client)
    ? detail
    : undefined;
}

// Copy edits match the complete incoming title so later CMS edits keep precedence.
const archiveHeadings = new Map([
  ['2 Cámaras Web y 2 Lector de barra', 'Dos cámaras web y dos lectores de códigos de barras'],
  ['Reemplazo de 3 · Detectores Fotoeléctricos Notifier Modelo FSP-851R', 'Reemplazo de tres detectores fotoeléctricos Notifier FSP-851R'],
  ['Balun CCTV · Cantidad: 5', 'Cinco balunes para CCTV'],
  ['Tendido de FO', 'Tendido de fibra óptica'],
  ['Telefonía IP WIFI', 'Telefonía IP por Wi-Fi'],
  ['Alquiler Telefonos IP', 'Alquiler de teléfonos IP'],
  ['Obrador Carcel Federal', 'Obrador de la cárcel federal'],
  ['Tablero Banco de capacitores · Sala de Maquina', 'Tablero del banco de capacitores en la sala de máquinas'],
]);

const networkHeading = 'Implementación de Redes de Datos y Fibra Óptica';
const supportHeading = 'Soporte de Infraestructura IT de Alta Disponibilidad';

// Match the existing heading and description as well as the public identity.
// A CMS edit to the scope takes precedence over the editorial heading.
const scopeHeadings: Readonly<Record<number, { client: string; heading: string; summary: string; title: string }>> = {
  3112: {
    client: 'Hospital a Italo Perrupato', heading: 'Soporte técnico de detección de incendios',
    summary: 'Soporte técnico del sistema de detección de incendios del Hospital Perrupato.',
    title: 'Soporte de detección de incendios en el Hospital Perrupato',
  },
  3142: {
    client: 'Cela S.A.', heading: 'Soporte técnico de detección de incendios',
    summary: 'Soporte técnico del sistema de detección de incendios del Hotel Sheraton de Mendoza.',
    title: 'Soporte de detección de incendios en el Sheraton de Mendoza',
  },
  3202: {
    client: 'Hospital Luis Laggomaggiore', heading: networkHeading,
    summary: 'LICITACIÓN PUBLICA CONTRATACION PROYECTO DE CABLEADO RED INFORMÀTICA',
    title: 'Licitación para cablear la red informática del Hospital Laggomaggiore',
  },
  3222: {
    client: 'Marsch S.A.', heading: 'Mantenimiento Crítico de Sistemas de Detección',
    summary: 'Mantenimiento del sistema de detección de incendio.',
    title: 'Mantenimiento del sistema de detección de incendio',
  },
  3223: {
    client: 'Hospital Teodoro Schestakow', heading: 'Soporte técnico de detección de incendios',
    summary: 'Soporte técnico del sistema de detección de incendios para el Hospital Teodoro Schestakow.',
    title: 'Soporte de detección de incendios en el Hospital Schestakow',
  },
  3308: {
    client: 'Natania Coop. de Vivienda Consumo y Crédito Ltda.', heading: 'Sistema de portería',
    summary: 'Sistema de portería para Natania.',
    title: 'Sistema de portería para Natania',
  },
  3350: {
    client: 'Los Silos Club S.A.', heading: 'Gestión y Monitoreo de Seguridad Electrónica',
    summary: 'Soporte técnico mensual para el sistema de CCTV.',
    title: 'Soporte mensual del sistema de CCTV',
  },
  3356: {
    client: 'DG Solutions (Gimenez Daniel Ricardo)', heading: supportHeading,
    summary: 'Soporte para sucursales de banco Galicia Mendoza, San Juan y San Luis.',
    title: 'Soporte para sucursales de Banco Galicia en Cuyo',
  },
  3375: {
    client: 'Procon S.R.L.', heading: 'Desarrollo de Software y Digitalización de Procesos',
    summary: 'Sistema de audio para el SUM del edificio Mitre: seis parlantes y un amplificador.',
    title: 'Sistema de audio para el SUM del edificio Mitre',
  },
  3395: {
    client: 'Obras S.R.L.', heading: supportHeading,
    summary: 'Servicio mensual de soporte de infraestructura IT.',
    title: 'Soporte mensual de infraestructura IT',
  },
  3415: {
    client: 'Aeropuertos Argentina 2000', heading: supportHeading,
    summary: 'Servicio de Mantenimiento del sistema de detección de incendio - Aero',
    title: 'Mantenimiento del sistema de detección de incendios',
  },
  3418: {
    client: 'Procon S.R.L.', heading: networkHeading,
    summary: 'Alquiler de infraestructura de cableado estructurado.',
    title: 'Alquiler de infraestructura de cableado estructurado',
  },
  3429: {
    client: 'Cela S.A.', heading: supportHeading,
    summary: 'vento para 200 personas mas dos puestos fijos con soporte por 4 dias d',
    title: 'Soporte durante cuatro días para dos puestos fijos',
  },
  3460: {
    client: 'La Agrícola S.A.', heading: networkHeading,
    summary: 'Cableado exterior por postes - 3 tendidos nuevos 4 - 1 a recuperar si es posible - switch 16b 150W ubiquiti 1 bandeja fija si no hay switch para contener las fuentes.',
    title: 'Cableado exterior por postes para La Agrícola',
  },
  3468: {
    client: 'Triunfo Cooperativa de Seguros Limitada', heading: 'Sistema de portería',
    summary: 'Sistema de portería para Triunfo Cooperativa de Seguros.',
    title: 'Sistema de portería para Triunfo Cooperativa de Seguros',
  },
  3489: {
    client: 'Procon S.R.L.', heading: supportHeading,
    summary: 'Soporte IT de nivel 1 en las oficinas de Procon.',
    title: 'Soporte IT de nivel 1 en oficinas de Procon',
  },
  3506: {
    client: 'Departamento General de Irrigación', heading: networkHeading,
    summary: 'cableado 380 puestos de trabajo, hay que hacer visita técnica',
    title: 'Relevamiento para cablear 380 puestos de trabajo',
  },
};

type CaseHeading = { id: number; client: string; title: string; summary?: string };

function titleFromScope(story: CaseHeading): string | undefined {
  const scope = scopeHeadings[story.id];
  if (scope && story.summary && samePublicClient(scope.client, story.client) &&
      identity(scope.heading) === identity(story.title) && identity(scope.summary) === identity(story.summary)) {
    return scope.title;
  }
  return undefined;
}

export function publicCaseTitle(story: CaseHeading) {
  if (story.id === 3624 && story.summary !== undefined && catalogPresentationFor({ ...story, summary: story.summary })?.asset === 'radio') {
    return 'Radioenlace entre Nucete y el chalet';
  }
  return (publicCaseFor(story)?.title || titleFromScope(story) || archiveHeadings.get(story.title) || story.title)
    .replace(/\bIngenieria\b/g, 'Ingeniería')
    .replace(/\bdebiles\b/g, 'débiles');
}

/** Legacy exports append the customer and classification to the job description. */
export function caseIntroduction(summary: string, title: string, client: string): string {
  const footer = /(?:^|\s)Cliente:\s*(.+?)\.\s+Sector:\s*([\p{L}\p{N} &/-]+)\.?$/iu.exec(summary);
  const customer = identity(client);
  let body = summary.trim();
  const classification = /^Para\s+(.+?)\.\s*Rubro:\s*[^.]+\.?$/iu.exec(body);
  if (classification?.[1] && customer && identity(classification[1]).replace(/ /g, '') === customer.replace(/ /g, '')) return '';

  if (footer?.[1] && customer && identity(footer[1]) === customer) {
    body = summary.slice(0, footer.index).trim();
  }
  const words = identity(body);
  if (!words || words === identity(title) || words === customer ||
      (customer && identity(body.replace(/\s*\(\d+\)$/, '')) === customer)) return '';
  if (body !== summary.trim() && body.includes(':')) {
    const subject = identity(body.slice(body.indexOf(':') + 1));
    if (subject === identity(title) + ' ' + customer) return '';
  }
  // The live CMS can append the customer twice, after a classification and the job title.
  const job = identity(title);
  const subject = identity(body.includes(':') ? body.slice(body.indexOf(':') + 1) : body);
  if (customer && [`para ${customer}`, `${job} para ${customer}`, `${job} ${customer} para ${customer}`].includes(subject)) return '';
  return body;
}

/** Public archive titles remain searchable under their original CMS wording. */
export function archiveIdentity(story: {
  id: number; client: string; title: string; sector: string; services: string[]; summary: string; documentedScope?: boolean;
}) {
  const detail = publicCaseFor(story);
  const title = publicCaseTitle(story);
  const terms = [`UM-${story.id}`, story.client, story.title, story.sector, ...story.services, story.summary];
  if (title !== story.title) terms.push(title);
  return { title, reviewed: Boolean(detail), documented: Boolean(story.documentedScope || titleFromScope(story)), search: terms.join(' ') };
}

export function archiveRecord(story: Story) {
  return {
    ...archiveIdentity(story), story, id: story.id, href: story.href, sector: story.sectorSlug, services: story.serviceCodes,
    year: String(story.year), client: story.client, status: story.status,
  };
}

/** The reviewed inventory and the editorial case share the same live identity gate. */
export function caseEquipmentFor(story: {
  id: number;
  client: string;
  title: string;
  summary: string;
  serviceCodes: string[];
}): Despiece {
  const detail = publicCaseFor(story);
  if (detail) return { partes: detail.parts, origen: "registro" };
  if (story.id === 3128 && /correo.*carpetas compartidas/i.test(story.title)) {
    return {
      origen: "registro",
      partes: [
        { key: "pantalla", code: "105", label: "Cuenta de correo" },
        { key: "servidor", code: "105", label: "Carpetas y permisos" },
      ],
    };
  }
  // Local preview: “módulo” in this case refers to software; don't render a fire module.
  if (
    story.id === 3529 &&
    /mercado pago/i.test(story.title) &&
    /notas? de pedido/i.test(story.title)
  ) {
    return {
      origen: "registro",
      partes: [
        { key: "pantalla", code: "104", label: "Módulo de notas de pedido" },
        { key: "servidor", code: "104", label: "Integración de pagos por API" },
      ],
    };
  }
  const reviewed = catalogPresentationFor(story);
  if (reviewed) return { origen: "registro", partes: reviewed.parts };
  const derived = despieceDe(story.title, story.summary, story.serviceCodes);
  return derived.origen === "registro"
    ? derived
    : { origen: "registro", partes: [] };
}
