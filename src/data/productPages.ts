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
export type MomentUi =
  | { kind: 'phone'; app: string; title: string; items: { text: string; done?: boolean }[]; photo: string; signed: string }
  | { kind: 'doc'; title: string; ref: string; foot: string; stamp: string }
  | { kind: 'board'; tiles: { label: string; value: string; alert?: boolean }[] }
  | { kind: 'timeline'; rows: { label: string; q: boolean[] }[] };
export interface Moment { n: string; where: string; title: string; text: string; flow: string[]; ui: MomentUi }
export interface MapNode { name: string; what: string }
export type StepKind = 'acta' | 'proto' | 'notas' | 'sla';
export interface Step { n: string; title: string; text: string; doc: string; kind: StepKind }
export interface ProductPage {
  code: string;
  intro: { title: string; lead: string; benefits: string[]; cta: string; explore: string; note: { strong: string; rest: string }; questions: string[] };
  stage: { kicker: string; title: string; lead: string; product: string; host: string; panels: Panel[]; aside: Aside; caption: string; asideCaption: string; includes: { b: string; text: string }[] };
  moments: { head: string; right: string; items: Moment[]; note: string };
  map: { kicker: string; title: string; lead: string; core: string; coreSub: string; nodes: MapNode[] };
  build: { kicker: string; title: string; lead: string; steps: Step[]; guarantees: { dt: string; dd: string }[] };
  close: { kicker: string; title: string; text: string; cta: string };
}

const SOFTWARE: ProductPage = {
  code: '104',
  intro: {
    title: 'Un sistema hecho sobre cómo trabaja tu empresa.',
    lead: 'La obra, el técnico en sitio, la certificación y la cobranza en un solo lugar. Código propio, en pesos, con soporte desde Mendoza.',
    benefits: ['Partes de trabajo desde el teléfono, con foto y firma', 'Certificados con la norma aplicable y el PDF al instante', 'Cobranza y facturas conciliadas con el ERP', 'Tableros del día para decidir sin pedir informes'],
    cta: 'Solicitá una demo con tus casos',
    explore: 'Explorar el SGI',
    note: { strong: 'Relevamiento sin cargo.', rest: 'Repositorio, documentación y pruebas se entregan con el sistema.' },
    questions: ['¿Cuánto tarda un parte de obra en llegar a la factura?', '¿Quién sabe hoy qué certificados vencen este mes?', '¿Qué pasa cuando el técnico no tiene señal en el sitio?'],
  },
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
  moments: {
    head: 'Así se vive, en tres momentos', right: 'Interfaces conceptuales · sin datos reales',
    items: [
      { n: '01', where: 'Obra', title: 'El parte se cierra en el sitio.', text: 'El técnico marca la checklist, adjunta la foto y firma el responsable. Sin señal también: se sincroniza al volver.', flow: ['Checklist', 'Foto', 'Firma'],
        ui: { kind: 'phone', app: 'UM Campo', title: 'Parte 4471 · Aeropuerto de Mendoza', items: [{ text: 'Prueba de lazo 1 a 4', done: true }, { text: 'Detectores limpiados', done: true }, { text: 'Sirenas y avisadores' }], photo: 'Foto adjunta', signed: 'Firmado · Responsable de sitio' } },
      { n: '02', where: 'Oficina', title: 'La certificación sale con la norma.', text: 'Al cerrar el parte, el certificado queda armado con la norma aplicable y el PDF listo para el cliente.', flow: ['Parte', 'Norma', 'PDF'],
        ui: { kind: 'doc', title: 'Certificado de obra', ref: 'N.º 214 · NFPA 72', foot: 'Mantenimiento SDI · septiembre', stamp: 'PDF listo' } },
      { n: '03', where: 'Gerencia', title: 'El día, en un tablero.', text: 'Avance, cobranza y técnicos en sitio sin pedir informes. Lo que importa, a primera hora.', flow: ['Avance', 'Cobranza', 'Alertas'],
        ui: { kind: 'board', tiles: [{ label: 'Avance de obras', value: '82 %' }, { label: 'Al día en cobranza', value: '91 %' }, { label: 'Con alerta', value: '2', alert: true }, { label: 'Técnicos en sitio', value: '11' }] } },
    ],
    note: 'Las pantallas son representaciones conceptuales. Módulos, integraciones, medios de pago y alcance se especifican en la propuesta técnica y económica de cada proyecto.',
  },
  map: {
    kicker: 'Lo que no puede ofrecer un estudio de software', title: 'Software que toca el mundo físico.',
    lead: 'El SGI habla con las cámaras, los accesos, la detección de incendios y la telefonía que la misma empresa instala y mantiene. Un evento en campo termina en el parte, en la factura y en el tablero sin que nadie lo cargue dos veces.',
    core: 'SGI', coreSub: 'una sola fuente de datos',
    nodes: [
      { name: 'CCTV y VMS', what: 'Eventos de cámara en el parte' }, { name: 'Control de accesos', what: 'Quién entró, cuándo y a qué zona' }, { name: 'Detección de incendios', what: 'Alarmas y mantenimiento NFPA 72' },
      { name: 'Telefonía IP', what: 'Llamadas de mesa de ayuda y tickets' }, { name: 'ERP y facturación', what: 'Cobros, facturas y conciliación' }, { name: 'Tableros', what: 'Indicadores del día para gerencia' },
    ],
  },
  build: {
    kicker: 'Cómo se construye', title: 'Cada etapa deja un documento que se puede revisar.',
    lead: 'Sin sorpresas al final: lo que se acordó, lo que se probó y lo que se entregó quedan por escrito en cada paso.',
    steps: [
      { n: '01', title: 'Relevamiento en sitio', text: 'Entrevistas con quienes operan, inventario de sistemas existentes y el proceso dibujado tal como ocurre hoy.', doc: 'Acta de alcance firmada', kind: 'acta' },
      { n: '02', title: 'Prototipo navegable', text: 'Antes de programar, una maqueta que se recorre en el teléfono y en la oficina. Se corrige ahí, cuando cambiar es barato.', doc: 'Prototipo clicable', kind: 'proto' },
      { n: '03', title: 'Iteraciones quincenales', text: 'Cada dos semanas una versión en producción de prueba, con lo que entró y lo que falta por escrito.', doc: 'Notas de versión', kind: 'notas' },
      { n: '04', title: 'Soporte con SLA', text: 'Mesa de ayuda, monitoreo y mantenimiento del sistema entregado, con tiempos de respuesta pactados.', doc: 'Acuerdo de nivel de servicio', kind: 'sla' },
    ],
    guarantees: [
      { dt: 'Código propio', dd: 'Repositorio entregado al cliente, sin cajas negras ni licencias ocultas.' },
      { dt: 'Documentación', dd: 'Manual de operación, diagrama de integraciones y guía de despliegue.' },
      { dt: 'Pruebas', dd: 'Casos de prueba por módulo y validación con los usuarios reales antes de cada versión.' },
      { dt: 'Sin dependencia', dd: 'Otro equipo puede continuar el sistema con lo entregado. Elegirnos es una decisión, no una obligación.' },
    ],
  },
  close: { kicker: 'Demo del SGI', title: 'Veámoslo con tus casos.', text: 'Una hora con la persona que opera. Recorremos el SGI con tus partes, tus certificados y tu cobranza, y te decimos qué se configura y qué hay que construir.', cta: 'Solicitá una demo con tus casos' },
};

const SOPORTE: ProductPage = {
  code: '105',
  intro: {
    title: 'Soporte que sabe qué hay instalado.',
    lead: 'Mesa de ayuda, monitoreo y mantenimiento sobre los sistemas que instalamos o relevamos. Tiempos de respuesta pactados por escrito, en pesos, desde Mendoza.',
    benefits: ['Un número y un correo para todo: red, cámaras, telefonía, servidores', 'Monitoreo las 24 horas, con aviso antes de que el usuario lo note', 'Tiempos de respuesta y resolución por severidad, por escrito', 'Informe mensual con lo que pasó y lo que conviene cambiar'],
    cta: 'Pedí una propuesta de soporte',
    explore: 'Ver la mesa de ayuda',
    note: { strong: 'Relevamiento inicial sin cargo.', rest: 'Inventario y documentación de lo instalado quedan con vos.' },
    questions: ['¿Quién atiende a las tres de la mañana cuando se cae el enlace?', '¿Cuánto tarda hoy un reclamo en tener un responsable con nombre?', '¿Hay inventario de lo que está instalado en cada sitio?'],
  },
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
  moments: {
    head: 'Así se vive, en tres momentos', right: 'Interfaces conceptuales · sin datos reales',
    items: [
      { n: '01', where: 'Noche', title: 'El aviso llega antes que el reclamo.', text: 'El monitoreo detecta la caída, abre el ticket y asigna al técnico de guardia. El cliente recibe el aviso con nombre y hora.', flow: ['Alerta', 'Ticket', 'Técnico'],
        ui: { kind: 'board', tiles: [{ label: 'Detectado', value: '03:12' }, { label: 'Ticket abierto', value: '03:13' }, { label: 'Técnico asignado', value: '03:15' }, { label: 'Severidad', value: '1', alert: true }] } },
      { n: '02', where: 'Sitio', title: 'El técnico llega sabiendo qué hay.', text: 'Inventario del sitio en el teléfono: equipos, planos y el historial de ese enlace. Cierra el ticket con foto y firma.', flow: ['Inventario', 'Ruta', 'Cierre'],
        ui: { kind: 'phone', app: 'UM Soporte', title: 'Ticket 8820 · Terminal San Martín', items: [{ text: 'Enlace principal: equipo de borde', done: true }, { text: 'Repuesto en stock: sí', done: true }, { text: 'Prueba de servicio con el cliente' }], photo: 'Foto del equipo repuesto', signed: 'Cerrado · 04:38 · Responsable de sitio' } },
      { n: '03', where: 'Mes', title: 'Un informe, no una factura sorpresa.', text: 'Qué pasó, cuánto tardó cada caso y qué conviene cambiar antes de que vuelva a pasar. Una página para gerencia.', flow: ['Incidentes', 'Tiempos', 'Recomendaciones'],
        ui: { kind: 'doc', title: 'Informe de soporte', ref: 'Septiembre · 47 casos', foot: 'Fuera de SLA: 0', stamp: 'Enviado' } },
    ],
    note: 'Las pantallas son representaciones conceptuales. Severidades, tiempos de respuesta y alcance del monitoreo se pactan en el acuerdo de nivel de servicio de cada cliente.',
  },
  map: {
    kicker: 'Lo que no puede ofrecer una mesa de ayuda genérica', title: 'Soporte que conoce la instalación.',
    lead: 'El mismo equipo que tiende la red, monta las cámaras y arma los tableros atiende el ticket. Cada caso queda en el historial del sitio, con el inventario de lo instalado al lado.',
    core: 'Mesa de ayuda', coreSub: 'un canal, todos los sistemas',
    nodes: [
      { name: 'Redes y enlaces', what: 'Caídas, saturación y radioenlaces' }, { name: 'CCTV y accesos', what: 'Cámaras sin señal, lectores, grabación' }, { name: 'Detección de incendios', what: 'Fallas de lazo y mantenimiento NFPA 72' },
      { name: 'Telefonía IP', what: 'Centrales, troncales y anexos' }, { name: 'Servidores y respaldo', what: 'Copias, actualizaciones y continuidad' }, { name: 'Energía y UPS', what: 'Autonomía, baterías y tableros' },
    ],
  },
  build: {
    kicker: 'Cómo arranca', title: 'Primero el inventario, después el acuerdo.',
    lead: 'No se puede sostener lo que no se conoce. Por eso el soporte empieza por relevar y documentar lo que hay, y recién ahí se pactan tiempos.',
    steps: [
      { n: '01', title: 'Relevamiento e inventario', text: 'Visita a cada sitio: equipos, versiones, planos y contactos. Lo que no estaba documentado, queda documentado.', doc: 'Inventario de lo instalado', kind: 'acta' },
      { n: '02', title: 'Alta de monitoreo', text: 'Enlaces, servidores, cámaras y energía entran al tablero. Se definen umbrales y a quién avisar.', doc: 'Tablero de sitios', kind: 'proto' },
      { n: '03', title: 'Operación con SLA', text: 'Mesa de ayuda, guardia y mantenimiento preventivo con tiempos por severidad, por escrito.', doc: 'Acuerdo de nivel de servicio', kind: 'sla' },
      { n: '04', title: 'Informe mensual', text: 'Incidentes, tiempos y recomendaciones. Lo que conviene cambiar se decide con datos, no con sustos.', doc: 'Informe de incidentes', kind: 'notas' },
    ],
    guarantees: [
      { dt: 'Tiempos por escrito', dd: 'Respuesta y resolución pactadas por severidad, de 1 a 4, en el acuerdo.' },
      { dt: 'Historial completo', dd: 'Cada ticket con quién atendió, cuándo y qué se hizo, consultable por el cliente.' },
      { dt: 'Repuestos acordados', dd: 'Stock crítico definido por sistema, para que la pieza no sea la excusa.' },
      { dt: 'Sin permanencia', dd: 'Contrato mensual. El inventario y la documentación quedan con el cliente.' },
    ],
  },
  close: { kicker: 'Propuesta de soporte', title: 'Empecemos por el inventario.', text: 'Relevamos lo instalado en tus sitios y te proponemos niveles de servicio por sistema. Sin cargo y por escrito.', cta: 'Pedí una propuesta de soporte' },
};

const CONSULTORIA: ProductPage = {
  code: '106',
  intro: {
    title: 'Decidí con un informe, no con un presupuesto.',
    lead: 'Auditoría de infraestructura, seguridad y proveedores, con hallazgos por severidad y un roadmap que se puede licitar. Independiente de marcas.',
    benefits: ['Relevamiento en sitio de redes, seguridad, energía y software', 'Hallazgos por severidad, con evidencia y el costo de no hacer nada', 'Roadmap a doce meses con prioridades y presupuesto estimado', 'Pliegos y evaluación de proveedores cuando toca comprar'],
    cta: 'Pedí una auditoría',
    explore: 'Ver un informe de ejemplo',
    note: { strong: 'Primera reunión sin cargo.', rest: 'El informe es del cliente, se lo lleve a quien se lo lleve.' },
    questions: ['¿Qué pasa si mañana se va la persona que sabe cómo está armada la red?', '¿Cuánto cuesta de verdad el sistema que te ofrecieron?', '¿Qué hay que cambiar antes de la próxima auditoría externa?'],
  },
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
  moments: {
    head: 'Así se vive, en tres momentos', right: 'Interfaces conceptuales · sin datos reales',
    items: [
      { n: '01', where: 'Sitio', title: 'Lo que hay, dibujado.', text: 'Relevamos cada sala técnica, cada rack y cada tablero. El inventario y los diagramas quedan aunque no sigamos.', flow: ['Visita', 'Inventario', 'Diagrama'],
        ui: { kind: 'doc', title: 'Inventario y diagramas', ref: 'Planta y oficinas · 3 sitios', foot: '612 equipos relevados', stamp: 'Editable' } },
      { n: '02', where: 'Informe', title: 'Cada hallazgo con su severidad.', text: 'Nada de listas interminables: lo crítico primero, con evidencia y con lo que cuesta no resolverlo.', flow: ['Evidencia', 'Severidad', 'Acción'],
        ui: { kind: 'board', tiles: [{ label: 'Críticos', value: '2', alert: true }, { label: 'Altos', value: '5' }, { label: 'Medios', value: '9' }, { label: 'Bajos', value: '14' }] } },
      { n: '03', where: 'Decisión', title: 'Un roadmap que se puede licitar.', text: 'Doce meses por trimestre, con rangos de inversión y pliegos. Gerencia decide con el informe en la mano.', flow: ['Prioridad', 'Trimestre', 'Pliego'],
        ui: { kind: 'timeline', rows: [{ label: 'Respaldo verificado', q: [true, false, false, false] }, { label: 'Enlace de contingencia', q: [true, true, false, false] }, { label: 'Certificar cableado', q: [false, true, true, false] }, { label: 'Retención de video', q: [false, false, true, true] }] } },
    ],
    note: 'Las pantallas son representaciones conceptuales. El alcance de la auditoría, las normas de referencia y el formato de entrega se definen en la propuesta de cada proyecto.',
  },
  map: {
    kicker: 'Lo que no puede ofrecer un vendedor de equipos', title: 'Consultoría que no vende lo que recomienda.',
    lead: 'Auditamos redes, seguridad, energía, servidores y proveedores con un solo criterio: que la operación no se detenga. Si después querés que lo hagamos nosotros, es otra conversación.',
    core: 'Informe', coreSub: 'una decisión por hallazgo',
    nodes: [
      { name: 'Redes y cableado', what: 'Certificación TIA/EIA-568 y capacidad' }, { name: 'Seguridad electrónica', what: 'Cobertura, retención y accesos' }, { name: 'Energía', what: 'UPS, puesta a tierra y tableros' },
      { name: 'Servidores y nube', what: 'Respaldo, restore y continuidad' }, { name: 'Proveedores', what: 'Contratos, dependencias y costos' }, { name: 'Normas', what: 'ISO 27001, NFPA 72, ISO/IEC 11801' },
    ],
  },
  build: {
    kicker: 'Cómo se hace', title: 'Cuatro semanas, cuatro documentos.',
    lead: 'Una auditoría típica de tres sitios lleva un mes. Cada semana termina con un entregable que el cliente puede leer y discutir.',
    steps: [
      { n: '01', title: 'Relevamiento', text: 'Visitas a sitio, entrevistas con quienes operan y lectura de contratos vigentes. Inventario y diagramas de lo que hay.', doc: 'Inventario y diagramas', kind: 'acta' },
      { n: '02', title: 'Auditoría', text: 'Mediciones, pruebas de respaldo y de autonomía, revisión de accesos. Cada hallazgo con evidencia y severidad.', doc: 'Hallazgos por severidad', kind: 'notas' },
      { n: '03', title: 'Roadmap', text: 'Prioridades por trimestre con rangos de inversión. Lo crítico primero; lo demás, cuando conviene.', doc: 'Roadmap a 12 meses', kind: 'proto' },
      { n: '04', title: 'Acompañamiento', text: 'Pliegos, evaluación de ofertas y recepción técnica. El cliente compra a quien quiera, con criterio propio.', doc: 'Pliegos y evaluación', kind: 'sla' },
    ],
    guarantees: [
      { dt: 'Independencia', dd: 'No vendemos lo que recomendamos, salvo que el cliente lo pida después, por separado.' },
      { dt: 'Evidencia', dd: 'Cada hallazgo con foto, medición o documento. Nada se afirma sin mostrarlo.' },
      { dt: 'Lenguaje de gerencia', dd: 'Resumen ejecutivo de una página y presupuesto en rangos. Sin jerga.' },
      { dt: 'Es tuyo', dd: 'Informe, inventario y diagramas entregados en formatos editables.' },
    ],
  },
  close: { kicker: 'Auditoría', title: 'Empecemos por una reunión de una hora.', text: 'Nos contás qué te preocupa y qué tenés instalado. Te decimos qué auditaríamos, en cuánto tiempo y qué vas a recibir, por escrito.', cta: 'Pedí una auditoría' },
};

export const PRODUCT_PAGES: Record<string, ProductPage> = { '104': SOFTWARE, '105': SOPORTE, '106': CONSULTORIA };
export const productPage = (code: string | number): ProductPage | undefined => PRODUCT_PAGES[String(code)];
