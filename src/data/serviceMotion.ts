/** Stable technical illustrations and an explicitly schematic operating sequence. */
export const SERVICE_MOTION: Record<string, { title: string; viewBox?: string; sequence: [string, string, string] }> = {
  '101': { title: 'Switch de acceso', viewBox: '65,100,850,570', sequence: ['Conectar', 'Transportar', 'Certificar'] },
  '102': { title: 'Cámara IP de exterior', viewBox: '251,10,478,462', sequence: ['Captar', 'Grabar', 'Consultar'] },
  '103': { title: 'Antena de radioenlace', viewBox: '280,-38,427,463', sequence: ['Emitir', 'Enlazar', 'Recibir'] },
  '104': { title: 'Aplicaciones e integración', sequence: ['Entrada', 'Proceso', 'Salida'] },
  '105': { title: 'Infraestructura y soporte', sequence: ['Detectar', 'Resolver', 'Verificar'] },
  '106': { title: 'Arquitectura de sistemas', sequence: ['Relevar', 'Diseñar', 'Planificar'] },
  '107': { title: 'Central de detección', viewBox: '309,-22,390,565', sequence: ['Detectar', 'Supervisar', 'Avisar'] },
  '108': { title: 'UPS de rack', viewBox: '-25,-14,1028,747', sequence: ['Red', 'Respaldo', 'Carga'] },
};
