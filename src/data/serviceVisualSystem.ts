import { editorialImages } from './editorialImageSystem';

export interface ServiceVisualSpec {
  serviceId: number;
  shortName: string;
  eyebrow: string;
  proof: string;
  motif: string;
  accent: string;
  image: string;
  imageAlt: string;
  icon: string;
  signal: string;
}

export const serviceVisualSystem: Record<number, ServiceVisualSpec> = {
  101: {
    serviceId: 101,
    shortName: 'Redes',
    eyebrow: 'Infraestructura de red',
    proof: 'Fibra, cableado, switching y radioenlaces certificados.',
    motif: 'packet-path',
    accent: '#0f766e',
    image: editorialImages.services[101],
    imageAlt: 'Sala técnica con racks de comunicaciones y cableado estructurado',
    icon: 'network',
    signal: 'traza de red'
  },
  102: {
    serviceId: 102,
    shortName: 'Seguridad electrónica',
    eyebrow: 'CCTV + control de acceso',
    proof: 'Videovigilancia IP, accesos, intrusión y monitoreo.',
    motif: 'scanline',
    accent: '#DC2626',
    image: editorialImages.services[102],
    imageAlt: 'Infraestructura de seguridad electrónica y monitoreo',
    icon: 'shield',
    signal: 'perímetro activo'
  },
  103: {
    serviceId: 103,
    shortName: 'Telecomunicaciones',
    eyebrow: 'Datos, voz y video',
    proof: 'Convergencia de comunicaciones para operaciones distribuidas.',
    motif: 'frequency',
    accent: '#2563eb',
    image: editorialImages.services[103],
    imageAlt: 'Equipamiento de telecomunicaciones para redes empresariales',
    icon: 'radio',
    signal: 'señal estable'
  },
  104: {
    serviceId: 104,
    shortName: 'Software a medida',
    eyebrow: 'Web, mobile, ERP y APIs',
    proof: 'Sistemas propios, integraciones y automatización de procesos.',
    motif: 'api-link',
    accent: '#334155',
    image: editorialImages.services[104],
    imageAlt: 'Puesto de trabajo con software empresarial e integraciones',
    icon: 'code',
    signal: 'flujo integrado'
  },
  105: {
    serviceId: 105,
    shortName: 'Soporte 24/7',
    eyebrow: 'Mesa de ayuda + mantenimiento',
    proof: 'Atención de incidentes, monitoreo y continuidad operativa.',
    motif: 'sla-line',
    accent: '#16a34a',
    image: editorialImages.services[105],
    imageAlt: 'Mesa de soporte técnico para infraestructura IT',
    icon: 'headset',
    signal: 'SLA visible'
  },
  106: {
    serviceId: 106,
    shortName: 'Consultoría IT',
    eyebrow: 'Arquitectura, auditoría y roadmap',
    proof: 'Diagnóstico, planificación y transferencia técnica.',
    motif: 'blueprint',
    accent: '#475569',
    image: editorialImages.services[106],
    imageAlt: 'Documentación y arquitectura para consultoría tecnológica',
    icon: 'briefcase',
    signal: 'decisión trazable'
  },
  107: {
    serviceId: 107,
    shortName: 'Detección de incendios',
    eyebrow: 'SDI + normativa',
    proof: 'Ingeniería, paneles, sensores y alarmas para activos críticos.',
    motif: 'alarm-zone',
    accent: '#DC2626',
    image: editorialImages.services[107],
    imageAlt: 'Sistema de detección y alarma de incendios',
    icon: 'flame',
    signal: 'zona protegida'
  },
  108: {
    serviceId: 108,
    shortName: 'Eléctricos para IT',
    eyebrow: 'UPS, tableros y energía',
    proof: 'Energía dedicada, puesta a tierra, racks y continuidad eléctrica.',
    motif: 'power-route',
    accent: '#ca8a04',
    image: editorialImages.services[108],
    imageAlt: 'Sistemas eléctricos, UPS y tableros para infraestructura IT',
    icon: 'bolt',
    signal: 'energía continua'
  }
};

export function getServiceVisualSpec(serviceId: number | string): ServiceVisualSpec | undefined {
  return serviceVisualSystem[Number(serviceId)];
}

export const serviceVisualOrder = [101, 102, 103, 104, 105, 106, 107, 108];
