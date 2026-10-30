/**
 * Despiece de un antecedente (2026-10-30): qué equipamiento nombra el registro, con la
 * cantidad cuando la dice, y a qué frente de servicio pertenece cada parte.
 *
 * Fuente de verdad: el título y la descripción del catálogo. Cuando el registro no nombra
 * ningún equipo (la mayoría trae sólo la plantilla), el despiece muestra las partes del
 * alcance publicado de sus servicios (src/data/serviceSpecs.ts), marcado como `origen:
 * 'servicio'`, sin cantidades y sin atribuirle al proyecto nada que no diga.
 */

export type ParteKey =
  | 'rack' | 'switch' | 'patch' | 'fibra' | 'ap' | 'cableado' | 'canalizacion'
  | 'camara' | 'nvr' | 'acceso' | 'alarma'
  | 'central-ip' | 'telefono' | 'antena' | 'parlante'
  | 'pantalla' | 'servidor'
  | 'puesto' | 'maletin' | 'disco'
  | 'plano'
  | 'central' | 'detector' | 'pulsador' | 'sirena' | 'modulo'
  | 'tablero' | 'ups' | 'bateria' | 'tierra' | 'generador';

export type Parte = { key: ParteKey; code: string; label: string; qty?: number };
export type Despiece = { partes: Parte[]; origen: 'registro' | 'servicio' };

type Regla = { key: ParteKey; code: string; re: RegExp; label: string | ((m: string) => string) };

// Orden de prioridad: las reglas más específicas primero (p. ej. "tablero de indicadores" antes que "tablero").
const REGLAS: Regla[] = [
  // Software y datos
  { key: 'pantalla', code: '104', re: /tablero(s)? de (indicadores|control|comando|mando)|\bbi\b|business intelligence/, label: 'Tablero de indicadores' },
  { key: 'pantalla', code: '104', re: /\b(pagina|sitio) web\b|\bweb\b|\bportal\b/, label: 'Sitio web' },
  { key: 'pantalla', code: '104', re: /\berp\b|\bcrm\b/, label: (m) => m.toUpperCase() },
  { key: 'pantalla', code: '104', re: /digitalizaci[oó]n|\bfactura electronica|\bweb ?service\b|\bapi\b/, label: 'Digitalización de procesos' },
  { key: 'pantalla', code: '104', re: /\bsoftware\b|\bsistema(s)? de (gestion|ventas|turnos|stock|control)\b|aplicaci[oó]n(es)?\b|\bapp\b|desarrollo(s)?\b|actualizaci[oó]n sistema/, label: 'Sistema a medida' },
  { key: 'servidor', code: '104', re: /\bservidor(es)?\b|\bserver\b|\bhosting\b|alojamiento|\bnube\b|\bcloud\b|\bgmail\b|\bcorreo\b|\bmail\b/, label: 'Servidor y servicios' },
  // Redes
  { key: 'rack', code: '101', re: /\brack(s)?\b|gabinete(s)? de (red|comunicaciones)/, label: 'Rack' },
  { key: 'switch', code: '101', re: /\bswitch(es|s)?\b|\bvlan(s)?\b/, label: 'Switch' },
  { key: 'patch', code: '101', re: /\bpatch ?panel(s|es)?\b|\bpatchera(s)?\b/, label: 'Patch panel' },
  { key: 'fibra', code: '101', re: /\bfibra(s)? (optica|óptica)?\b|\bodf\b|\bfusion(es)?\b|\bftth\b/, label: 'Fibra óptica' },
  { key: 'ap', code: '101', re: /\baccess ?point(s)?\b|\bap\b|\bwi-?fi\b|inalambric|\brouter(s)?\b/, label: 'Access point' },
  { key: 'cableado', code: '101', re: /\bcableado( estructurado)?\b|\btendido(s)?\b|\bcable(s)?\b|\butp\b|\bcat ?6a?\b|\bpuesto(s)? de (red|datos|trabajo)\b|\bboca(s)? de red\b/, label: 'Cableado estructurado' },
  { key: 'canalizacion', code: '101', re: /canalizaci[oó]n(es)?|\bbandeja(s)?\b|\bca[ñn]o(s)?\b|ca[ñn]er[ií]a|\bducto(s)?\b/, label: 'Canalización' },
  // Seguridad electrónica
  { key: 'modulo', code: '102', re: /\bbalun(s|es)?( cctv)?\b/, label: 'Balun CCTV' },
  { key: 'camara', code: '102', re: /\bc[aá]mara(s)?\b|(?<!balun )\bcctv\b|\bdomo(s)?\b|\bbullet\b|videovigilancia|video vigilancia|seguridad electr[oó]nica/, label: 'Cámara CCTV' },
  { key: 'nvr', code: '102', re: /\bnvr\b|\bdvr\b|grabador(es|a)?\b|\bvms\b/, label: 'Grabador NVR' },
  { key: 'acceso', code: '102', re: /control(es)? de acceso|\blector(es)?\b|\bmolinete(s)?\b|\bbarrera(s)?\b|\bcerradura(s)?\b|\bbiometr/, label: 'Control de acceso' },
  { key: 'alarma', code: '102', re: /\balarma(s)?\b|intrusi[oó]n|sensor(es)? de movimiento|\bpir\b/, label: 'Alarma de intrusión' },
  // Telecomunicaciones
  { key: 'central-ip', code: '103', re: /central(es)? telef[oó]nica(s)?|\bpbx\b|\bvoip\b|telefon[ií]a ip|\bcentral ip\b|\bdenwa\b/, label: 'Central telefónica IP' },
  { key: 'telefono', code: '103', re: /\btel[eé]fono(s)?\b|\binterno(s)? telef|intercomunicador(es)?|\bportero(s)?\b/, label: 'Teléfono IP' },
  { key: 'antena', code: '103', re: /\bantena(s)?\b|radioenlace(s)?|\benlace(s)?\b|\bradio(s)?\b|\btroncal/, label: 'Enlace de radio' },
  { key: 'parlante', code: '103', re: /amplificador(es)?|\bvoceo\b|\bparlante(s)?\b|\bpa\b|megafon[ií]a/, label: 'Voceo y amplificación' },
  // Detección de incendios
  { key: 'central', code: '107', re: /central(es)? de (detecci[oó]n|incendio|alarma)|\bnfs[- ]?\d*|firewarden|panel de incendio|\bcentral de incendios?\b|cambio de central|\bcentral\b(?! telef)/, label: 'Central de detección' },
  { key: 'detector', code: '107', re: /\bdetector(es)?\b|sensor(es)? de humo|\bhumo\b|fotoel[eé]ctric|t[eé]rmico(s)?\b|\bvesda\b|aspiraci[oó]n|\bsensores\b/, label: 'Detector' },
  { key: 'pulsador', code: '107', re: /\bpulsador(es)?\b|\bpusaldor(es)?\b/, label: 'Pulsador manual' },
  { key: 'sirena', code: '107', re: /\bsirena(s)?\b|\bbaliza(s)?\b|\bestrobo(s)?\b/, label: 'Sirena' },
  { key: 'modulo', code: '107', re: /\bm[oó]dulo(s)?\b|\brel[eé](s)?\b|fuente(s)? de alimentaci[oó]n|placa(s)? de (red|lazo)|\binterfaz\b|\bbornera(s)?\b|\bplaca(s)?\b(?! de video)/, label: 'Módulo' },
  // Eléctricos IT
  { key: 'ups', code: '108', re: /\bups\b|estabilizador(es)?/, label: 'UPS' },
  { key: 'bateria', code: '108', re: /\bbater[ií]a(s)?\b/, label: 'Batería' },
  { key: 'tierra', code: '108', re: /puesta a tierra|\bjabalina(s)?\b/, label: 'Puesta a tierra' },
  { key: 'generador', code: '108', re: /grupo(s)? electr[oó]geno(s)?|\bgenerador(es)?\b/, label: 'Grupo electrógeno' },
  { key: 'tablero', code: '108', re: /\btablero(s)?\b|instalaci[oó]n el[eé]ctrica|\bel[eé]ctric[ao]s?\b|\benerg[ií]a\b|\bcircuito(s)?\b/, label: 'Tablero eléctrico' },
  // Soporte
  { key: 'puesto', code: '105', re: /(?<!cableado[^.]{0,30})\bpuesto(s)? de trabajo\b|\bpc\b|computadora(s)?|\bnotebook(s)?\b|\bmonitor(es)?\b|\bescritorio\b|\bimpresora(s)?\b|\bplaca de video\b/, label: 'Puesto de trabajo' },
  { key: 'disco', code: '105', re: /\bbackup\b|\brespaldo\b|\bnas\b|\bdisco(s)?\b|almacenamiento/, label: 'Respaldo' },
  { key: 'maletin', code: '105', re: /\bsoporte\b|mesa de ayuda|\babono\b|servicio t[eé]cnico|asistencia t[eé]cnica|\bmantenimiento\b|\breparaci[oó]n\b|\brevisi[oó]n\b|\bmonitoreo\b/, label: (m) => (/mantenimiento/.test(m) ? 'Mantenimiento' : /reparaci|revisi/.test(m) ? 'Reparación' : /monitoreo/.test(m) ? 'Monitoreo' : 'Soporte técnico') },
  // Consultoría
  { key: 'plano', code: '106', re: /relevamiento|proyecto ejecutivo|\bingenier[ií]a\b|\bplano(s)?\b|auditor[ií]a|consultor[ií]a|\bpliego(s)?\b|licitaci[oó]n|\bpresupuesto\b|\bcotiza/, label: (m) => (/relevamiento/.test(m) ? 'Relevamiento' : /proyecto ejecutivo/.test(m) ? 'Proyecto ejecutivo' : /auditor/.test(m) ? 'Auditoría' : /pliego|licitaci/.test(m) ? 'Pliego técnico' : /presupuesto|cotiza/.test(m) ? 'Presupuesto' : 'Ingeniería') },
];

/** Partes del alcance publicado de cada servicio (src/data/serviceSpecs.ts), sin cantidades. */
export const KIT_DE_SERVICIO: Record<string, [ParteKey, string][]> = {
  '101': [['rack', 'Rack'], ['switch', 'Switch'], ['fibra', 'Fibra óptica'], ['ap', 'Wi-Fi'], ['cableado', 'Cableado estructurado']],
  '102': [['camara', 'Cámara CCTV'], ['nvr', 'Grabación y VMS'], ['acceso', 'Control de acceso'], ['alarma', 'Alarma de intrusión']],
  '103': [['central-ip', 'Central telefónica IP'], ['telefono', 'Teléfono IP'], ['antena', 'Enlace de datos'], ['parlante', 'Voceo y PA']],
  '104': [['pantalla', 'Aplicación a medida'], ['servidor', 'Integración y APIs']],
  '105': [['maletin', 'Mesa de ayuda 24/7'], ['puesto', 'Mantenimiento preventivo'], ['disco', 'Backup y recuperación']],
  '106': [['plano', 'Auditoría de infraestructura'], ['pantalla', 'Roadmap tecnológico']],
  '107': [['central', 'Central de detección'], ['detector', 'Detectores'], ['pulsador', 'Pulsadores'], ['sirena', 'Sirenas y balizas'], ['modulo', 'Módulos de supervisión']],
  '108': [['tablero', 'Tablero eléctrico'], ['ups', 'UPS online'], ['bateria', 'Banco de baterías'], ['tierra', 'Puesta a tierra'], ['generador', 'Grupo electrógeno']],
};

const llano = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const PLANTILLA = /cliente:\s*[^.]+\.?\s*(sector:\s*[^.]+\.?)?/g;

/** Cantidad dicha junto a la parte: "3 – Detectores", "Detector… Cantidad 3 unidades", "Balun CCTV - Cantidad: 5". */
function cantidad(texto: string, inicio: number, fin: number): number | undefined {
  const antes = texto.slice(Math.max(0, inicio - 28), inicio);
  const despues = texto.slice(fin, fin + 70);
  // El número va pegado a la parte ("3 – detectores", "5 x camaras", "2 unidades de ups") o la sigue ("… cantidad: 5").
  const a = antes.match(/(?<![\d(])(\d{1,3})\s*(?:x|–|-|unidades?(?: de)?|un\.?|u\.?)?\s*$/);
  const d = despues.match(/^[^.;|]{0,50}?(?:cantidad:?\s*(\d{1,3})\b|[-–]\s*(\d{1,3})\s*(?:unidades?|u\b)|\((\d{1,3})\s*(?:unidades?|u)\))/);
  const n = Number(a?.[1] ?? d?.[1] ?? d?.[2] ?? d?.[3]);
  return n >= 1 && n <= 999 ? n : undefined;
}

/** El despiece de un registro a partir de su título, su descripción y sus servicios. */
export function despieceDe(titulo: string, descripcion: string, serviceCodes: string[]): Despiece {
  const texto = llano(`${titulo}. ${descripcion}`).replace(PLANTILLA, ' ');
  const vistas = new Map<string, Parte>();
  for (const regla of REGLAS) {
    const re = new RegExp(regla.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto))) {
      const label = typeof regla.label === 'function' ? regla.label(m[0]) : regla.label;
      // Una parte por glifo: la primera regla que la nombra le da el nombre; la cantidad, la primera que la dice.
      const id = regla.key;
      const qty = cantidad(texto, m.index, m.index + m[0].length);
      const previa = vistas.get(id);
      if (!previa) vistas.set(id, { key: regla.key, code: regla.code, label, qty });
      else if (qty && !previa.qty) previa.qty = qty;
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  }
  // Un "SDI" o "sistema de detección" a secas nombra el sistema entero.
  if (/\bsdi\b|sistema(s)? de deteccion/.test(texto) && ![...vistas.values()].some((p) => p.code === '107' && p.key !== 'central')) {
    for (const [key, label] of KIT_DE_SERVICIO['107']) if (!vistas.has(key)) vistas.set(key, { key, code: '107', label });
  }
  // Las partes de los servicios del registro primero; las demás, después.
  const propios = new Set(serviceCodes);
  const partes = [...vistas.values()].sort((a, b) => Number(propios.has(b.code)) - Number(propios.has(a.code)) || (b.qty || 0) - (a.qty || 0));
  if (partes.length) return { partes: partes.slice(0, 8), origen: 'registro' };
  const kit: Parte[] = [];
  for (const code of serviceCodes.slice(0, 2)) for (const [key, label] of KIT_DE_SERVICIO[code] || []) if (!kit.some((p) => p.key === key)) kit.push({ key, code, label });
  return { partes: kit.slice(0, 6), origen: 'servicio' };
}

/** Lo instalado en un conjunto de registros: cuántos proyectos nombran cada parte. */
export function despieceAgregado(registros: { title: string; summary: string; serviceCodes: string[] }[]): { key: ParteKey; code: string; label: string; proyectos: number; unidades: number }[] {
  const acc = new Map<string, { key: ParteKey; code: string; label: string; proyectos: number; unidades: number }>();
  for (const r of registros) {
    const d = despieceDe(r.title, r.summary, r.serviceCodes);
    if (d.origen !== 'registro') continue;
    const vistos = new Set<string>();
    for (const p of d.partes) {
      if (vistos.has(p.key)) continue;
      vistos.add(p.key);
      const e = acc.get(p.key) || { key: p.key, code: p.code, label: p.label, proyectos: 0, unidades: 0 };
      e.proyectos++; e.unidades += p.qty || 0;
      acc.set(p.key, e);
    }
  }
  return [...acc.values()].sort((a, b) => b.proyectos - a.proyectos);
}
