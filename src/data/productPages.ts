/**
 * Páginas de producto (104 Software, 105 Soporte 24/7, 106 Consultoría IT).
 * Mismo tono que la landing de comunidades profesionales: superficies claras,
 * una frase por idea, el producto mostrado como producto, datos de ejemplo
 * marcados como tales. Todo el vocabulario normativo es el aprobado en DESIGN.md.
 */
export type RowState = 'ok' | 'warn' | 'run';
export interface Kpi { label: string; value: string }
export interface TableRow { cells: string[]; state?: RowState }
export interface BoardCard { title: string; meta: string; state?: RowState }
export interface Site { name: string; systems: string; state: 'ok' | 'warn' | 'down'; note: string }
export interface Panel {
  key: string;
  name: string;
  what: string;
  kpis?: Kpi[];
  table?: { head: string[]; rows: TableRow[] };
  board?: { title: string; cards: BoardCard[] }[];
  sites?: Site[];
  doc?: { heading: string; paras: string[]; bullets?: string[] };
}
export type Aside =
  | { kind: 'field'; app: string; ref: string; title: string; sub: string; items: { text: string; done?: boolean }[]; photo: string; signed: string; cta: string }
  | { kind: 'alert'; app: string; time: string; title: string; site: string; lines: string[]; cta: string }
  | { kind: 'finding'; ref: string; severity: string; title: string; evidence: string; action: string; cost: string };
export interface ProductPage {
  code: string;
  stage: { kicker: string; title: string; lead: string; product: string; host: string; panels: Panel[]; aside: Aside; caption: string; asideCaption: string; includes: { b: string; text: string }[] };
  close: { kicker: string; title: string; text: string; cta: string };
}

const SOFTWARE: ProductPage = {
  code: '104',
  stage: {
    kicker: 'El producto',
    title: 'Entrá al SGI. Probalo con datos de ejemplo.',
    lead: 'Recorré los módulos que usan nuestros clientes: la obra, el técnico en sitio, la certificación y la cobranza en una sola fuente. Sin cuenta y sin datos reales.',
    product: 'SGI', host: 'sgi.ultimamilla.com.ar',
    panels: [
      { key: 'proyectos', name: 'Proyectos', what: 'Obras y servicios en curso, con avance y certificación',
        kpis: [{ label: 'En curso', value: '14' }, { label: 'Certificados este mes', value: '6' }, { label: 'Con alerta', value: '2' }],
        table: { head: ['Obra', 'Cliente', 'Avance', 'Estado'], rows: [
          { cells: ['SDI terminal · San Juan', 'Aeropuertos Argentina 2000', '82 %', 'En curso'], state: 'run' },
          { cells: ['Red y fibra · Hospital Perrupato', 'Ministerio de Salud', '100 %', 'Certificado'], state: 'ok' },
          { cells: ['Soporte IT alta disponibilidad', 'Bodega La Esmeralda', '45 %', 'En curso'], state: 'run' },
          { cells: ['CCTV de perímetro', 'Aeropuerto de Mendoza', '64 %', 'Con alerta'], state: 'warn' } ] } },
      { key: 'clientes', name: 'Clientes', what: 'Cuentas, contactos y contratos vigentes',
        kpis: [{ label: 'Activos', value: '38' }, { label: 'Contratos vigentes', value: '52' }, { label: 'Sectores', value: '9' }],
        table: { head: ['Cliente', 'Sector', 'Contratos', 'Último contacto'], rows: [
          { cells: ['Aeropuertos Argentina 2000', 'Aeropuertos', '7', 'Hoy'], state: 'ok' },
          { cells: ['Municipalidad de Guaymallén', 'Gobierno', '3', 'Ayer'], state: 'ok' },
          { cells: ['Bodega La Esmeralda', 'Bodegas', '2', 'Hace 3 días'], state: 'ok' },
          { cells: ['Fundación Coprosamen', 'Salud', '1', 'Hace 9 días'], state: 'warn' } ] } },
      { key: 'certificados', name: 'Certificados', what: 'Certificaciones de obra con norma, fecha y PDF',
        kpis: [{ label: 'Emitidos', value: '214' }, { label: 'Este mes', value: '6' }, { label: 'Pendientes de firma', value: '1' }],
        table: { head: ['Obra', 'Norma', 'Fecha', 'Documento'], rows: [
          { cells: ['Cableado estructurado · Torre Thays', 'TIA/EIA-568', '28/09', 'PDF'], state: 'ok' },
          { cells: ['Detección de incendios · Bodega Antigal', 'NFPA 72', '21/09', 'PDF'], state: 'ok' },
          { cells: ['Tableros para data center', 'IRAM', '14/09', 'PDF'], state: 'ok' },
          { cells: ['Fibra óptica · FUESMEN', 'ISO/IEC 11801', '—', 'Pendiente'], state: 'warn' } ] } },
      { key: 'control', name: 'Control', what: 'Técnicos en sitio, partes de trabajo y checklist',
        kpis: [{ label: 'Técnicos en campo', value: '11' }, { label: 'Partes de hoy', value: '19' }, { label: 'Sin cerrar', value: '3' }],
        table: { head: ['Técnico', 'Sitio', 'Entrada', 'Parte'], rows: [
          { cells: ['M. Ruiz', 'Aeropuerto de Mendoza', '07:40', 'Cerrado'], state: 'ok' },
          { cells: ['J. Páez', 'Hospital Central', '08:05', 'En curso'], state: 'run' },
          { cells: ['L. Soria', 'Planta Flexcolor', '08:30', 'En curso'], state: 'run' },
          { cells: ['A. Vega', 'Terminal San Martín', '09:10', 'Sin cerrar'], state: 'warn' } ] } },
      { key: 'cobros', name: 'Cobros', what: 'Cuentas por cobrar y seguimiento de vencimientos',
        kpis: [{ label: 'Al día', value: '91 %' }, { label: 'Vencen esta semana', value: '4' }, { label: 'En mora', value: '2' }],
        table: { head: ['Comprobante', 'Cliente', 'Vence', 'Estado'], rows: [
          { cells: ['FC A 0004-00012871', 'Aeropuertos Argentina 2000', '08/10', 'Al día'], state: 'ok' },
          { cells: ['FC A 0004-00012866', 'Municipalidad de Guaymallén', '05/10', 'Al día'], state: 'ok' },
          { cells: ['FC A 0004-00012850', 'José Nucete e Hijos', '30/09', 'Vencida'], state: 'warn' },
          { cells: ['FC A 0004-00012842', 'Cliente confidencial', '27/09', 'En gestión'], state: 'run' } ] } },
      { key: 'facturas', name: 'Facturas', what: 'Emisión electrónica y conciliación con el ERP',
        kpis: [{ label: 'Emitidas este mes', value: '27' }, { label: 'Conciliadas', value: '25' }, { label: 'Con diferencia', value: '0' }],
        table: { head: ['Número', 'Cliente', 'Concepto', 'Estado'], rows: [
          { cells: ['0004-00012871', 'Aeropuertos Argentina 2000', 'Mantenimiento SDI · septiembre', 'Emitida'], state: 'ok' },
          { cells: ['0004-00012870', 'Bodega La Esmeralda', 'Soporte IT · septiembre', 'Emitida'], state: 'ok' },
          { cells: ['0004-00012869', 'Hospital Perrupato', 'Certificación de red', 'Conciliada'], state: 'ok' },
          { cells: ['0004-00012868', 'Procon SRL', 'Desarrollo · hito 2', 'Borrador'], state: 'run' } ] } },
    ],
    aside: { kind: 'field', app: 'UM Campo', ref: 'Parte de trabajo · 4471', title: 'Aeropuerto de Mendoza', sub: 'SDI terminal · mantenimiento mensual', items: [{ text: 'Prueba de lazo 1 a 4', done: true }, { text: 'Detectores limpiados: 38', done: true }, { text: 'Sirenas y avisadores' }], photo: 'Foto de la central, adjunta', signed: 'Firma del responsable de sitio', cta: 'Cerrar parte y sincronizar' },
    caption: 'Escritorio para la oficina: los módulos que operan nuestros clientes, con filas ilustrativas. Tocá un módulo para recorrerlo.',
    asideCaption: 'Teléfono para la obra: el técnico cierra el parte en sitio y el SGI lo recibe al instante. Datos de ejemplo.',
    includes: [
      { b: 'Módulos por proceso', text: 'Clientes, proyectos, certificados, control, cobros y facturas, configurados sobre el flujo real del cliente.' },
      { b: 'APIs e integraciones', text: 'Conectan el ERP, la app de campo y los tableros con una sola fuente de datos.' },
      { b: 'Tableros operativos', text: 'Indicadores del día para decidir: avance, certificación, cobranza y técnicos en sitio.' },
      { b: 'Web y móvil', text: 'La misma plataforma en escritorio para la oficina y en el teléfono para el técnico, sin instalar nada.' },
    ],
  },
  close: { kicker: 'Demo del SGI', title: 'Veámoslo con tus casos.', text: 'Una hora con la persona que opera. Recorremos el SGI con tus partes, tus certificados y tu cobranza, y te decimos qué se configura y qué hay que construir.', cta: 'Solicitá una demo con tus casos' },
};

const SOPORTE: ProductPage = {
  code: '105',
  stage: {
    kicker: 'El producto',
    title: 'Entrá a la mesa de ayuda. Probala con datos de ejemplo.',
    lead: 'Tickets, monitoreo de sitios e informe mensual: lo que ve nuestro equipo y lo que ve el cliente. Sin cuenta y sin datos reales.',
    product: 'Mesa de ayuda', host: 'soporte.ultimamilla.com.ar',
    panels: [
      { key: 'tickets', name: 'Tickets', what: 'Cada reclamo con responsable, severidad y tiempo pactado',
        kpis: [{ label: 'Abiertos', value: '9' }, { label: 'Dentro del SLA', value: '100 %' }, { label: 'Resueltos esta semana', value: '31' }],
        board: [
          { title: 'Nuevos', cards: [{ title: 'Teléfono sin tono · Recepción', meta: 'Bodega La Esmeralda · sev. 3 · 02:40 h', state: 'run' }, { title: 'Cámara 12 sin imagen', meta: 'Aeropuerto de Mendoza · sev. 2 · 01:10 h', state: 'warn' }] },
          { title: 'En curso', cards: [{ title: 'Enlace caído · Terminal San Martín', meta: 'L. Soria en sitio · sev. 1 · 00:35 h', state: 'warn' }, { title: 'Impresora de guardia', meta: 'Hospital Central · sev. 4 · remoto', state: 'run' }] },
          { title: 'Esperando al cliente', cards: [{ title: 'Alta de usuario VPN', meta: 'Municipalidad de Guaymallén · falta autorización', state: 'run' }] },
          { title: 'Resueltos hoy', cards: [{ title: 'UPS en bypass · sala técnica', meta: 'Planta Flexcolor · 1:50 h · batería cambiada', state: 'ok' }, { title: 'Wi-Fi lento · piso 3', meta: 'Torre Thays · 0:40 h · canal reasignado', state: 'ok' }] },
        ] },
      { key: 'monitoreo', name: 'Monitoreo', what: 'Sitios y sistemas vigilados, con el aviso antes del reclamo',
        kpis: [{ label: 'Sitios vigilados', value: '23' }, { label: 'Equipos', value: '612' }, { label: 'Con alerta', value: '1' }],
        sites: [
          { name: 'Aeropuerto de Mendoza', systems: 'Red · CCTV · SDI · UPS', state: 'ok', note: 'Todo en servicio' },
          { name: 'Terminal San Martín', systems: 'Enlace · telefonía', state: 'down', note: 'Enlace principal caído · técnico en sitio' },
          { name: 'Hospital Central', systems: 'Red · servidores · respaldo', state: 'ok', note: 'Copia nocturna verificada' },
          { name: 'Bodega La Esmeralda', systems: 'Red · CCTV · telefonía', state: 'warn', note: 'Cámara 7 con latencia' },
          { name: 'Planta Flexcolor', systems: 'Red industrial · UPS', state: 'ok', note: 'Autonomía 48 min' },
        ] },
      { key: 'informe', name: 'Informe mensual', what: 'Lo que pasó, cuánto tardó y qué conviene cambiar',
        kpis: [{ label: 'Incidentes', value: '47' }, { label: 'Respuesta media', value: '18 min' }, { label: 'Fuera de SLA', value: '0' }],
        doc: { heading: 'Septiembre · Aeropuertos Argentina 2000', paras: ['47 incidentes atendidos, 44 cerrados en remoto y 3 con visita. Ningún caso fuera del tiempo pactado.', 'El enlace secundario de la terminal operó como principal durante 6 horas el día 14; conviene duplicar el equipo de borde antes de la temporada alta.'], bullets: ['Cambio de 2 baterías de UPS en sala técnica', 'Actualización de firmware en 38 cámaras', 'Recomendación: contrato de repuestos críticos para detección de incendios'] } },
    ],
    aside: { kind: 'alert', app: 'UM Soporte', time: '03:12', title: 'Enlace caído', site: 'Terminal San Martín · severidad 1', lines: ['Detectado por monitoreo, antes del reclamo', 'Ticket 8820 abierto · L. Soria asignado', 'Respuesta pactada: 30 min · en camino'], cta: 'Ver ticket' },
    caption: 'Lo que ve el equipo de soporte: tickets, sitios e informe, con filas ilustrativas. Tocá una pestaña para recorrerla.',
    asideCaption: 'Lo que recibe el cliente a las tres de la mañana: el aviso con responsable y tiempo pactado. Datos de ejemplo.',
    includes: [
      { b: 'Mesa de ayuda', text: 'Un canal para todos los sistemas, con registro de quién atendió, cuándo y qué se hizo.' },
      { b: 'Monitoreo 24/7', text: 'Enlaces, cámaras, servidores y energía vigilados; el aviso llega antes que el reclamo.' },
      { b: 'Mantenimiento', text: 'Preventivo programado y correctivo en sitio, con repuestos acordados.' },
      { b: 'Informe mensual', text: 'Incidentes, tiempos y recomendaciones, en una página que gerencia puede leer.' },
    ],
  },
  close: { kicker: 'Propuesta de soporte', title: 'Empecemos por el inventario.', text: 'Relevamos lo instalado en tus sitios y te proponemos niveles de servicio por sistema. Sin cargo y por escrito.', cta: 'Pedí una propuesta de soporte' },
};

const CONSULTORIA: ProductPage = {
  code: '106',
  stage: {
    kicker: 'El producto',
    title: 'Abrí un informe. Leelo con datos de ejemplo.',
    lead: 'Resumen ejecutivo, hallazgos, roadmap y presupuesto: el documento que entregamos, tal como lo lee gerencia. Sin datos reales de ningún cliente.',
    product: 'Informe de auditoría', host: 'informe-auditoria.pdf',
    panels: [
      { key: 'resumen', name: 'Resumen ejecutivo', what: 'Una página para decidir',
        kpis: [{ label: 'Hallazgos', value: '30' }, { label: 'Críticos', value: '2' }, { label: 'Inversión estimada', value: '12 meses' }],
        doc: { heading: 'Infraestructura IT · planta y oficinas', paras: ['La operación depende de un único enlace y de un servidor sin respaldo verificado. Dos hallazgos críticos se resuelven en el primer trimestre con una inversión acotada.', 'El resto del roadmap ordena la renovación del cableado y la videovigilancia sobre doce meses, priorizando lo que detiene la producción.'], bullets: ['Crítico: respaldo del servidor de gestión no verificado desde hace 14 meses', 'Crítico: enlace único sin contingencia para la planta', 'Alto: cableado sin certificación en dos sectores'] } },
      { key: 'hallazgos', name: 'Hallazgos', what: 'Cada uno con evidencia, severidad y acción',
        kpis: [{ label: 'Críticos', value: '2' }, { label: 'Altos', value: '5' }, { label: 'Medios y bajos', value: '23' }],
        table: { head: ['Hallazgo', 'Sistema', 'Evidencia', 'Severidad'], rows: [
          { cells: ['Respaldo sin verificar', 'Servidores', 'Último restore probado: hace 14 meses', 'Crítico'], state: 'warn' },
          { cells: ['Enlace único a planta', 'Redes', 'Sin contingencia; 3 cortes en 2025', 'Crítico'], state: 'warn' },
          { cells: ['Cableado sin certificar', 'Redes', '2 sectores sin reporte TIA/EIA-568', 'Alto'], state: 'run' },
          { cells: ['Retención de video 7 días', 'CCTV', 'Requisito del seguro: 30 días', 'Alto'], state: 'run' },
          { cells: ['UPS sin prueba de autonomía', 'Energía', 'Baterías de 2019', 'Medio'], state: 'ok' } ] } },
      { key: 'roadmap', name: 'Roadmap', what: 'Doce meses, por prioridad y por trimestre',
        kpis: [{ label: 'Trimestre 1', value: '2 críticos' }, { label: 'Trimestres 2 y 3', value: '5 altos' }, { label: 'Trimestre 4', value: 'mejoras' }],
        board: [
          { title: 'Trimestre 1', cards: [{ title: 'Respaldo verificado y restore mensual', meta: 'Servidores · crítico', state: 'warn' }, { title: 'Enlace de contingencia a planta', meta: 'Redes · crítico', state: 'warn' }] },
          { title: 'Trimestre 2', cards: [{ title: 'Certificación de cableado sectores A y C', meta: 'Redes · alto', state: 'run' }] },
          { title: 'Trimestre 3', cards: [{ title: 'Retención de video a 30 días', meta: 'CCTV · alto', state: 'run' }, { title: 'Baterías de UPS y prueba de autonomía', meta: 'Energía · medio', state: 'run' }] },
          { title: 'Trimestre 4', cards: [{ title: 'Política de accesos y contraseñas', meta: 'Seguridad · medio', state: 'ok' }] },
        ] },
      { key: 'presupuesto', name: 'Presupuesto', what: 'Rangos por ítem, para licitar sin sorpresas',
        kpis: [{ label: 'Ítems', value: '11' }, { label: 'Con pliego listo', value: '7' }, { label: 'Proveedores sugeridos', value: '3 por ítem' }],
        table: { head: ['Ítem', 'Alcance', 'Rango', 'Pliego'], rows: [
          { cells: ['Enlace de contingencia', 'Radioenlace + equipo de borde', 'Rango estimado', 'Listo'], state: 'ok' },
          { cells: ['Respaldo y restore', 'Licencia + procedimiento', 'Rango estimado', 'Listo'], state: 'ok' },
          { cells: ['Certificación de cableado', '184 puntos, Fluke', 'Rango estimado', 'Listo'], state: 'ok' },
          { cells: ['Grabación 30 días', 'Almacenamiento + VMS', 'Rango estimado', 'En redacción'], state: 'run' } ] } },
    ],
    aside: { kind: 'finding', ref: 'Hallazgo 02 · Redes', severity: 'Crítico', title: 'Enlace único a planta', evidence: 'Tres cortes en 2025, el más largo de 6 horas. Sin contingencia ni plan de reversa.', action: 'Radioenlace de contingencia con conmutación automática. Trimestre 1.', cost: 'Costo de no hacer nada: una jornada de planta por corte.' },
    caption: 'El informe que entregamos, con secciones ilustrativas. Tocá una pestaña para recorrerlo.',
    asideCaption: 'Cada hallazgo tiene su ficha: evidencia, acción y el costo de no hacer nada. Datos de ejemplo.',
    includes: [
      { b: 'Auditoría en sitio', text: 'Redes, seguridad electrónica, energía, servidores y software, con mediciones y fotos.' },
      { b: 'Hallazgos por severidad', text: 'De crítico a bajo, cada uno con evidencia, acción recomendada y costo de no hacer nada.' },
      { b: 'Roadmap y presupuesto', text: 'Doce meses por trimestre, con rangos por ítem y pliegos para licitar.' },
      { b: 'Acompañamiento', text: 'Evaluación de ofertas y recepción técnica de lo que compre el cliente, a quien se lo compre.' },
    ],
  },
  close: { kicker: 'Auditoría', title: 'Empecemos por una reunión de una hora.', text: 'Nos contás qué te preocupa y qué tenés instalado. Te decimos qué auditaríamos, en cuánto tiempo y qué vas a recibir, por escrito.', cta: 'Pedí una auditoría' },
};

export const PRODUCT_PAGES: Record<string, ProductPage> = { '104': SOFTWARE, '105': SOPORTE, '106': CONSULTORIA };
export const productPage = (code: string | number): ProductPage | undefined => PRODUCT_PAGES[String(code)];
