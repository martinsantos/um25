import { srcsetDe, thumbOf, type Story } from './isoData';
import { publicCaseFor, samePublicClient } from './casePresentation';
import { isShowcaseProject } from './caseSelection';
import { flowDetails } from '../../data/informationFlows';

import { serviceWorkExamples, sectorWorkExamples, workScene } from '../../data/propuesta/workScenes';
import radio from '../../assets/signal-routes/nucete.webp?url';
import radioSmall from '../../assets/signal-routes/nucete-640.webp?url';
import detector from '../../assets/signal-routes/la-esmeralda.webp?url';
import detectorSmall from '../../assets/signal-routes/la-esmeralda-640.webp?url';
import radioDetail from '../../assets/catalog-scenes/radio.webp?url';
import detectorDetail from '../../assets/catalog-scenes/detector.webp?url';

interface FeaturedWork {
  pub: Story;
  label: string;
  image: string;
  srcset?: string;
  thumb: string;
  detalle: { title: string; kicker: string; introduction: string; evidence: { value: string; label: string }[] };
  poster: string;
  caption: string;
  posterAlt: string;
}
const signalWorks = {
  3624: {
    example: sectorWorkExamples.industria['103'], client: 'José Nucete e Hijos S.A.',
    image: radio, thumb: radioSmall, poster: radioDetail, posterAlt: 'Equipo de radio direccional.',
    kicker: 'Industria · Telecomunicaciones', title: 'Radioenlace entre Nucete y el chalet',
    introduction: 'Dos extremos unidos por un enlace punto a punto.', caption: 'Antena del radioenlace',
  },
  3168: {
    example: serviceWorkExamples['107']['Detectores según el ambiente'], client: 'Bodega La Esmeralda',
    image: detector, thumb: detectorSmall, poster: detectorDetail, posterAlt: 'Detalle de un detector de humo.',
    kicker: 'Bodegas · Detección', title: 'Detección de humo en Bodega La Esmeralda',
    introduction: 'El adicional de obra incluyó el detector, la canalización y el cableado.', caption: 'Detector de humo',
  },
};
// Each selection starts with a different work. Labels identify it in the compact index.
const labels = {
  3126: 'Balizamiento', 3588: 'DTP Marqués', 3085: 'Hospital Perrupato',
  3119: 'Poder Judicial', 3144: 'Salud de la Mujer', 3640: 'Quilmes',
  3099: 'Yaguar', 3104: 'Campo de vuelo', 3116: 'Sur de los Andes',
  3624: 'Nucete', 3168: 'La Esmeralda', 3102: 'General Las Heras', 3103: 'Hospital Uspallata',
} as const;
type CaseId = keyof typeof labels;
const selections = {
  inicio: [3624, 3126, 3588, 3085],
  servicios: [3588, 3099, 3119, 3126],
  sectores: [3168, 3640, 3102, 3104],
  antecedentes: [3085, 3144, 3119, 3588],
  blog: [3099, 3104, 3103, 3116],
} satisfies Record<string, CaseId[]>;
const posters = import.meta.glob<string>('../../assets/flow-diagrams/caso-{3126,3588,3085,3119,3144,3640,3099,3104,3116,3102,3103}.webp', { eager: true, query: '?url', import: 'default' });

export function portadaCases(stories: Story[], surface: keyof typeof selections) {
  return selections[surface].flatMap<FeaturedWork>(id => {
    const pub = stories.find(story => story.id === id);
    if (!pub || !isShowcaseProject(pub)) return [];
    if (id === 3624 || id === 3168) {
      const item = signalWorks[id];
      if (!samePublicClient(pub.client, item.client) || !workScene(item.example, pub)) return [];
      return [{ pub, label: labels[id], detalle: { ...item, evidence: [] }, image: item.image,
        srcset: `${item.thumb} 640w, ${item.image} 1600w`, thumb: item.thumb,
        poster: item.poster, posterAlt: item.posterAlt, caption: item.caption }];
    }
    const detalle = publicCaseFor(pub);
    if (!detalle || !pub.image || pub.image.includes('/editorial/')) return [];
    const key = `caso-${id}` as const;
    const poster = posters[`../../assets/flow-diagrams/${key}.webp`];
    const flow = flowDetails[key];
    return [{ pub, detalle, label: labels[id], image: pub.image, srcset: srcsetDe(pub.image), thumb: thumbOf(pub.image), poster, caption: flow.title, posterAlt: flow.nodes.map(node => node[0]).join(' → ') }];
  });
}
