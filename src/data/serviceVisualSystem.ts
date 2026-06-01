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
    image: '/uploads/antecedentes/0021d14f-3f8a-4e39-9a03-dad7c8681c0d.jpg',
    imageAlt: 'Sala técnica con racks de comunicaciones y cableado estructurado',
    icon: 'network',
    signal: 'traza de paquetes'
  },
  102: {
    serviceId: 102,
    shortName: 'Seguridad electrónica',
    eyebrow: 'CCTV + control de acceso',
    proof: 'Videovigilancia IP, accesos, intrusión y monitoreo.',
    motif: 'scanline',
    accent: '#DC2626',
    image: '/uploads/antecedentes/00ef116b-3455-4de2-aa10-22ad8803318f.jpg',
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
    image: '/uploads/antecedentes/029b4855-4aa7-4a3b-98a2-a0152777fb4e.jpg',
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
    image: '/uploads/antecedentes/05859017-7f0f-4eb8-867c-2fe2d0170b48.jpg',
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
    image: '/uploads/antecedentes/05b811c2-937e-4830-b3eb-e578444b9bdd.jpg',
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
    image: '/uploads/antecedentes/05bf45b8-637c-4231-9334-9e851c735c5f.jpg',
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
    image: '/uploads/antecedentes/065f2393-2bf3-4913-b93e-64e528a9c432.jpg',
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
    image: '/uploads/antecedentes/06b069ad-dab6-4d04-84b7-150465976a4a.jpg',
    imageAlt: 'Sistemas eléctricos, UPS y tableros para infraestructura IT',
    icon: 'bolt',
    signal: 'energía continua'
  }
};

export function getServiceVisualSpec(serviceId: number | string): ServiceVisualSpec | undefined {
  return serviceVisualSystem[Number(serviceId)];
}

export const serviceVisualOrder = [101, 102, 103, 104, 105, 106, 107, 108];
