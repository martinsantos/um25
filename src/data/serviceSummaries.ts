/**
 * Nombre corto y resumen editado de cada servicio (código SGI 101–108).
 * Reemplaza en la UI los títulos y descripciones crudos de Directus, que traen
 * separadores "|" y textos largos pensados para la ficha completa.
 */
export const SERVICE_SUMMARIES: Record<string, { name: string; summary: string }> = {
  '101': { name: 'Redes', summary: 'Cableado estructurado Cat 6/6A/7, fibra óptica, radioenlaces, LAN/WAN y data centers en Mendoza, San Juan, San Luis y todo Cuyo.' },
  '102': { name: 'Seguridad electrónica', summary: 'Videovigilancia CCTV IP, control de acceso biométrico y RFID, alarmas y monitoreo centralizado en Mendoza, Cuyo y Patagonia.' },
  '103': { name: 'Telecomunicaciones', summary: 'Convergencia de datos, voz y video, con enlaces para sitios remotos y operadores integrados en una misma red.' },
  '104': { name: 'Software a medida', summary: 'Sistemas, APIs y tableros para procesos críticos: aplicaciones web, mobile y ERP con código propio.' },
  '105': { name: 'Soporte 24/7', summary: 'Mesa de ayuda, mantenimiento preventivo y correctivo, monitoreo y respuesta a incidentes con SLA, las 24 horas.' },
  '106': { name: 'Consultoría IT', summary: 'Arquitectura, auditorías de seguridad, evaluación de proveedores y roadmap tecnológico para decidir con información.' },
  '107': { name: 'Detección de incendios', summary: 'Detección temprana direccionable, diseñada según NFPA 72, con habilitación de bomberos y mantenimiento periódico.' },
  '108': { name: 'Eléctricos IT', summary: 'Tableros dedicados, UPS online, bancos de baterías y puesta a tierra técnica para racks y equipos críticos.' },
};

export const serviceSummary = (code: unknown) => SERVICE_SUMMARIES[String(code)];

/** Texto de Directus apto para una card: sin etiquetas de ficha ni separadores. */
export function cleanCmsText(value: unknown): string {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b(Rubro|Cliente|Sector|Área|Area|Descripción|Descripcion)\s*:\s*/gi, '')
    .replace(/\s*\|\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
}
