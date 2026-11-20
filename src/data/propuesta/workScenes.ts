import { catalogSceneForCase, type CatalogContent } from '../catalogCasePresentation';

type StoryIdentity = Parameters<typeof catalogSceneForCase>[0];
type Points = readonly [readonly [number, number], readonly [number, number], readonly [number, number]];
type Example = Pick<CatalogContent, 'asset' | 'kind' | 'title' | 'steps'> & { id: number; anchor: string; points?: Points };

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
  '103': { 'Sistema de Voceo y PA': paging },
  '108': { 'Distribución y puesta a tierra': distribution },
};
export const sectorWorkExamples: Record<string, Record<string, Example>> = {
  aeropuertos: { '103': paging },
  gobiernosectorpublico: { '108': distribution },
  industria: { '101': productionNetwork },
};

export function workScene(example: Example | undefined, story: StoryIdentity | undefined) {
  if (!example || story?.id !== example.id) return;
  const scene = catalogSceneForCase(story);
  if (scene?.asset !== example.asset) return;
  return { ...scene, kind: example.kind, title: example.title, steps: example.steps, points: example.points };
}
