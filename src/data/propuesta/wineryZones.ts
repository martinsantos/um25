export const wineryZones = [
  {
    key: 'ingreso', service: '102', label: 'Ingreso',
    alt: 'Portero IP junto al portón de entrada de una bodega.',
    title: 'Atender el portón a distancia', steps: ['Llamada', 'Recepción', 'Respuesta'],
    description: 'La visita llama desde el portón. El puesto de recepción atiende por la red IP y habla con quien llegó.',
    id: 3138, client: 'Luna Maya', work: 'Portería IP para Bodega Sur de los Andes',
    cta: 'Consultar por el ingreso', question: '¿Desde qué puesto necesitás atender el ingreso a la bodega?',
  },
  {
    key: 'nave', service: '107', label: 'Nave de producción',
    alt: 'Detector en una viga y canalización sobre los tanques de una nave de producción.',
    title: 'Recibir un aviso de humo', steps: ['Detector', 'Cableado', 'Central'],
    description: 'Sobre la línea de tanques, el detector se conecta por cable a la central. Si detecta humo, la señal llega al puesto que supervisa la nave.',
    id: 3168, client: 'Bodega La Esmeralda', work: 'Detector de humo con canalización y cableado',
    cta: 'Consultar por la nave', question: '¿Qué áreas de la nave necesitás cubrir con detección de incendios?',
  },
] as const;

type WineryZone = typeof wineryZones[number];

export function wineryZoneForCase(id: number, key: string | null) {
  return wineryZones.find(zone => zone.id === id && zone.key === key);
}

export function wineryContactParams(zone: WineryZone) {
  return new URLSearchParams({ sector: 'bodegas', budgetSector: 'Bodegas', budgetScope: zone.label, sistema: zone.service });
}
