import { connectionSceneForCase } from '../connectionScenes';
import { catalogPresentationFor, catalogSceneForCase, type CatalogContent } from '../catalogCasePresentation';

type StoryIdentity = Parameters<typeof connectionSceneForCase>[0];
type Points = readonly [readonly [number, number], readonly [number, number], readonly [number, number]];
type EquipmentExample = Pick<CatalogContent, 'asset' | 'kind' | 'title' | 'steps'> & { id: number; anchor: string; points?: Points };
type ProcessExample = {
  id: number; anchor: string; format: 'software' | 'consulting';
  project: string; title: string; steps: readonly (readonly [string, string])[];
};
type ConnectionExample = { id: number; anchor: string; format: 'connection' };
type Example = EquipmentExample | ProcessExample | ConnectionExample;

const rack: ConnectionExample = {id: 3072, anchor: 'rack-y-patch-panel', format: 'connection'};
const fiber: ConnectionExample = {id: 3080, anchor: 'terminacion-de-fibra', format: 'connection'};
const tracking: ProcessExample = {
  id: 3064, anchor: 'trazabilidad-ambiental', format: 'software', project: 'Secretaría de Ambiente de Mendoza',
  title: 'Cómo se sigue el historial de un registro',
  steps: [
    ['Alta', 'El registro identifica aquello que se necesita seguir.'],
    ['Cambio', 'Cada novedad se incorpora al historial del mismo registro.'],
    ['Consulta', 'La secuencia permite reconstruir qué cambió.'],
  ],
};
const engineering: ProcessExample = {
  id: 3477, anchor: 'ingenieria-de-corrientes-debiles', format: 'consulting', project: 'Ingeniería de corrientes débiles del hospital',
  title: 'Cómo se coordina un recorrido en el proyecto',
  steps: [
    ['Puntos', 'Se ubican los extremos de la instalación.'],
    ['Recorrido', 'Se estudia por dónde unirlos y qué espacios atraviesa el tendido.'],
    ['Coordinación', 'Se revisan los cruces con otras instalaciones antes de ejecutar la obra.'],
  ],
};
const hospitalPhone: EquipmentExample = {
  id: 3094, anchor: 'telefonia-del-schestakow', asset: 'phone-ip', kind: 'call',
  title: 'Telefonía IP por Wi-Fi en el Hospital Schestakow',
  steps: [
    ['Interno', 'La llamada se inicia desde un interno.'],
    ['Red', 'La red del establecimiento transporta la voz.'],
    ['Destino', 'El interno llamado recibe la comunicación.'],
  ],
};
const radioLink: EquipmentExample = {
  id: 3624, anchor: 'enlace-de-planta', asset: 'radio', kind: 'coverage',
  title: 'Un enlace punto a punto para Nucete',
  steps: [
    ['Origen', 'Un extremo del enlace se encuentra en Nucete.'],
    ['Enlace', 'Los radios de ambos extremos intercambian la señal.'],
    ['Destino', 'El otro extremo está en el chalet documentado en la obra.'],
  ],
};

const distribution: Example = {
  id: 3119, anchor: 'tableros-de-informatica', asset: 'distribution', kind: 'distribution',
  points: [[45,25], [53,42], [61,78]],
  title: 'Ocho tableros para los circuitos de informática',
  steps: [
    ['Entrada', 'La alimentación de los equipos del Edificio II de San Martín llega al gabinete principal.'],
    ['Protección', 'Cada circuito cuenta con su propia protección.'],
    ['Salidas', 'Los circuitos distribuyen energía hacia los equipos de informática.'],
  ],
};
const paging: Example = {
  id: 3087, anchor: 'voceo-en-terminal', asset: 'amplifier', kind: 'audio',
  title: 'Cómo llega un aviso a los parlantes',
  steps: [
    ['Entrada de audio', 'El amplificador recibe la señal del aviso.'],
    ['Amplificación', 'La etapa de potencia entrega la señal al circuito de parlantes.'],
    ['Difusión', 'Los parlantes reproducen el aviso en la zona que cubren.'],
  ],
};
const productionNetwork: Example = {
  id: 3384, anchor: 'puestos-de-planta', asset: 'network-termination', kind: 'inspection',
  points: [[31,64], [54,56], [78,46]],
  title: 'Cuatro puestos de datos en las selectoras',
  steps: [
    ['Ficha RJ45', 'Conecta el equipo de la selectora al punto de red.'],
    ['Módulo de red', 'Es la unión entre el cable del equipo y el tendido de planta.'],
    ['Frente del puesto', 'La placa sostiene el módulo y deja la conexión accesible.'],
  ],
};

export const serviceWorkExamples: Record<string, Record<string, Example>> = {
  '101': { 'Racks, switches y salas técnicas': rack },
  '103': { 'Sistema de Voceo y PA': paging, 'Telefonía IP': hospitalPhone },
  '104': { 'Aplicaciones a medida': tracking },
  '106': { 'Planificación y arquitectura': engineering },
  '108': { 'Distribución y puesta a tierra': distribution },
};
export const sectorWorkExamples: Record<string, Record<string, Example>> = {
  aeropuertos: { '101': fiber, '103': paging },
  salud: { '101': rack, '103': hospitalPhone, '106': engineering },
  gobiernosectorpublico: { '104': tracking, '108': distribution },
  industria: { '101': productionNetwork, '103': radioLink },
};

export function workScene(example: Example | undefined, story: StoryIdentity | undefined) {
  if (!example || story?.id !== example.id) return;
  if ('format' in example) {
    const reviewed = catalogPresentationFor(story);
    if (example.format === 'connection') {
      if (reviewed?.kind !== 'existing') return;
      const connection = connectionSceneForCase(story);
      return connection ? { format: 'connection' as const, connection } : undefined;
    }
    if (reviewed?.kind !== example.format) return;
    return {format: 'process' as const, process: example};
  }
  const scene = catalogSceneForCase(story);
  if (scene?.asset !== example.asset) return;
  return { ...scene, format: 'equipment' as const, kind: example.kind, title: example.title, steps: example.steps, points: example.points };
}
