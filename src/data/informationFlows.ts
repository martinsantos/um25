import flows from './information-flows.json';
import type { Despiece } from '../components/proto/despiece';

export type FlowKey = keyof typeof flows;

export const SERVICE_FLOW = {
  '101': 'redes',
  '102': 'cctv',
  '103': 'telecom',
  '104': 'software',
  '105': 'soporte',
  '106': 'ingenieria',
  '107': 'incendios',
  '108': 'energia',
} as const satisfies Record<string, FlowKey>;

type ServiceCode = keyof typeof SERVICE_FLOW;
type FlowHint = { service: ServiceCode; key: FlowKey; match: RegExp };
type CaseInput = {
  id?: number;
  title: string;
  summary: string;
  serviceCodes: readonly string[];
};

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const variants: readonly FlowHint[] = [
  { service: '103', key: 'porteria', match: /\b(?:porteria|porteros?|intercomunicadores?)\s+ip\b/ },
  { service: '102', key: 'acceso', match: /\b(?:control(?:es)? de accesos?|molinete|biometria|lector de tarjetas)\b/ },
  { service: '102', key: 'intrusion', match: /\b(?:intrusion|sensor(?:es)? de movimiento|alarma antirrobo)\b/ },
  { service: '103', key: 'telefonia', match: /\b(?:telefonia|central telefonica|voip|pbx|denwa)\b/ },
  { service: '108', key: 'ups', match: /\b(?:ups|banco de baterias|respaldo electrico)\b/ },
];

const titleHints: readonly FlowHint[] = [
  ...variants,
  { service: '101', key: 'redes', match: /\b(?:redes?|fibra optica|cableado|switching|wifi|wi-fi)\b(?! electrica)/ },
  { service: '102', key: 'cctv', match: /\b(?:cctv|videovigilancia|seguridad electronica|camaras?|grabador)\b/ },
  { service: '103', key: 'telecom', match: /\b(?:telecomunicaciones|radioenlace|enlace de datos|voceo)\b/ },
  { service: '104', key: 'software', match: /\b(?:software|digitalizacion|sistema de gestion|portal|aplicacion)\b/ },
  { service: '105', key: 'soporte', match: /\b(?:soporte|mantenimiento|reparacion|asistencia tecnica|mesa de ayuda)\b/ },
  { service: '106', key: 'ingenieria', match: /\b(?:relevamiento|ingenieria|auditoria|consultoria|proyecto ejecutivo)\b/ },
  { service: '107', key: 'incendios', match: /\b(?:incendios?|detectores?|sdi|deteccion de humo)\b/ },
  { service: '108', key: 'energia', match: /\b(?:tableros? electricos?|alimentacion|puesta a tierra|instalacion electrica)\b/ },
];

function firstHint(hints: readonly FlowHint[], linked: readonly ServiceCode[], text: string): FlowKey | undefined {
  let key: FlowKey | undefined;
  let index = Infinity;
  for (const hint of hints) {
    if (!linked.includes(hint.service)) continue;
    const match = hint.match.exec(text);
    if (match && match.index < index) {
      key = hint.key;
      index = match.index;
    }
  }
  return key;
}

const reviewedCaseFlows: Partial<Record<number, FlowKey>> = {
  3318: 'caso-3318-revision-e',
  3375: 'caso-3375-revision-e',
  3238: 'caso-3238-revision-e',
  3591: 'caso-3591-revision-e',
  3529: 'caso-3529-revision-e',
  3117: 'caso-3117',
  3205: 'caso-3205',
  3259: 'caso-3259',
  3336: 'caso-3336',
  3410: 'caso-3410',
  3085: 'caso-3085',
  3116: 'caso-3116',
  3103: 'caso-3103',
  3104: 'caso-3104',
  3140: 'caso-3140',
  3640: 'caso-3640',
  3065: 'caso-3065',
  3066: 'caso-3066',
  3069: 'caso-3069',
  3072: 'caso-3072',
  3144: 'caso-3144',
  3126: 'caso-3126',
  3099: 'caso-3099',
  3588: 'caso-3588',
  3102: 'caso-3102',
  3119: 'caso-3119',
};

export const flowDetails = flows;

export function flowForService(code: string): FlowKey {
  if (code === '103') return 'servicio-103';
  if (code === '101') return 'servicio-101';
  if (code === '105') return 'servicio-105';
  if (code === '106') return 'servicio-106';
  return SERVICE_FLOW[code as ServiceCode] ?? 'registro';
}

const withheldCaseFlows = new Map<number, string>([
  [3077, normalize("Asistencia técnica para desactivar sensores de humo · Hotel Sheraton")],
  [3132, normalize("Alojamiento y mantenimiento de la página web del municipio · febrero 2024")],
  [3138, normalize("Sistema de portería IP")],
  [3145, normalize("Desarrollo de Software y Digitalización de Procesos · 31 de octubre de 2023")],
  [3150, normalize("Desarrollo de Software y Digitalización de Procesos · 5 de octubre de 2023")],
  [3161, normalize("PC de escritorio")],
  [3168, normalize("Adicional · Detector de humo, incluye canalización y cableado")],
  [3176, normalize("Disco duro NAS 12TB")],
  [3211, normalize("Puesta en servicios de control de asistencia en planta")],
  [3229, normalize("Búsqueda y reparación pérdida red incendio · Aeropuerto de Tucuman")],
  [3267, normalize("Adquisición de un sistema contra incendios y CCTV")],
  [3308, normalize("Sistema de portería")],
  [3343, normalize("Alojamiento y mantenimiento de la página web del municipio · diciembre 2020")],
  [3349, normalize("Servicio de Internet dedicado en área institucional de Pasip")],
  [3374, normalize("Ampliación del sistema de portería del edificio Mitre con pulsadores")],
  [3376, normalize("PC + Monitor")],
  [3401, normalize("Llamadores para enfermería · Hospital Schestakow")],
  [3402, normalize("Central de incendio a revisar (presupuesto para activar proyecto)")],
  [3417, normalize("Mantenimiento de la sala de extinción de incendios")],
  [3418, normalize("Implementación de Redes de Datos y Fibra Óptica")],
  [3429, normalize("Soporte de Infraestructura IT de Alta Disponibilidad")],
  [3430, normalize("Provisión e instalación de relojes biométricos")],
  [3431, normalize("Licitación para cableado de datos y energía eléctrica")],
  [3448, normalize("Presupuesto de dos fusiones de fibra óptica multimodo de 4 pelos")],
  [3468, normalize("Sistema de portería")],
  [3497, normalize("Desarrollo de Software y Digitalización de Procesos")],
  [3520, normalize("Servicio de diagnóstico de red IP")],
  [3553, normalize("Alarma de instrucción · 20 de abril de 2017")],
  [3555, normalize("Alarma de instrucción · 28 de abril de 2017")],
  [3572, normalize("Control de humo en AA2000, estación Francisco Gabrielli · Mendoza")],
  [3577, normalize("Mantenimiento de tableros de bancos de capacitores")],
  [3590, normalize("Fuente de alimentacion")],
  [3595, normalize("CPU + Disco externo")],
  [3603, normalize("Proyecto Red de Incendio para la Sede Administrativa del 4º Distrito")],
  [3604, normalize("2 Cámaras Web y 2 Lector de barra")],
  [3608, normalize("Computadora completa")],
  [3609, normalize("Reubicacion de puesto de datos")],
  [3614, normalize("Computadora de escritorio")],
  [3621, normalize("PC de oficina + disco SSD")],
  [3622, normalize("Servidor")],
  [3631, normalize("Computadora para visualizar cámaras de CCTV")],
  [3636, normalize("Cotizar una central de incendio con 11 sensores 2 sirenas 1 pulsador")],
  [3654, normalize("Cotizar 5 días de mano de obra para sdi hotel sheraton")],
  [3657, normalize("Evento 50 personas viernes 2 de noviembre 1 ap 1 dia de soporte de 14")],
  [9002, normalize("Alojamiento, mantenimiento y desarrollo del sitio web de la Municipalidad de Guaymallén")],
  [3151, normalize("Servicio de conectividad para Evento Empretón")],
  [3153, normalize("Provisión de Módulo de Relé")],
  [3596, normalize("Insumo de informática")],
  [3642, normalize("Presupuesto de trabajo en sistema de detección de incendios")],
  [3644, normalize("Cotización tendido FO · aeropuerto de Mendoza")],
  [3646, normalize("Cotización de cámaras y cableado")],
  [3651, normalize("Presupuesto para revisión de cámaras")],
  [3653, normalize("Presupuesto para trabajos en sistema de detección de incendios")],
  [3659, normalize("Presupuesto por adicionales para un edificio")],
]);

export function flowForCase(story: CaseInput, scope: Despiece, documentedNotes: readonly string[] = []): FlowKey | undefined {
  // These reviewed records distinguish web hosting from support, and provision from installation.
  if (story.id === 3365 && normalize(story.title) === normalize("Reemplazo de grabador DVR")) return 'caso-3365-revision-f';
  if (story.id === 3228 && normalize(story.title) === normalize("Traslado de rack")) return 'caso-3228-revision-f';
  if (story.id === 3128 && normalize(story.title) === normalize('Configuración de correo y carpetas compartidas')) return 'caso-3128-revision-f';
  if (story.id === 3384 && normalize(story.title) === normalize('Cableado para puestos de datos en selectoras de aceitunas')) return 'caso-3384-revision-f';
  if (story.id === 3088 && normalize(story.title) === normalize("Cableado de cinco cámaras CCTV y provisión de balun")) return 'caso-3088-revision-f';
  if (story.id === 3358 && normalize(story.title) === normalize("Reemplazo de cableado de dos cámaras CCTV")) return 'caso-3358-revision-f';
  if (story.id === 3300) return undefined;
  if (story.id !== undefined && withheldCaseFlows.get(story.id) === normalize(story.title)) return undefined;
  if (story.id === 3083) return 'software';
  const reviewed = story.id === undefined ? undefined : reviewedCaseFlows[story.id];
  if (reviewed) return reviewed;
  const linked = story.serviceCodes.filter((code): code is ServiceCode => Object.prototype.hasOwnProperty.call(SERVICE_FLOW, code));
  if (!linked.length) return 'registro';

  const titleFlow = firstHint(titleHints, linked, normalize(story.title));
  if (titleFlow) return titleFlow;
  const specificFlow = firstHint(variants, linked, normalize([story.summary, ...documentedNotes].join(' ')));
  if (specificFlow) return specificFlow;

  // Only recorded equipment can break a tie. A generic catalog kit is not project evidence.
  let primary = linked[0]!;
  let bestScore = 0;
  if (scope.origen === 'registro') {
    for (const code of linked) {
      const score = scope.partes.filter((part) => part.code === code).length;
      if (score > bestScore) {
        primary = code;
        bestScore = score;
      }
    }
  }
  return SERVICE_FLOW[primary];
}
