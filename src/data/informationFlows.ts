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
