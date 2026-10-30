/**
 * Limpieza de títulos y clientes del catálogo (2026-10-30). Reglas, no retoques a mano: el
 * registro trae prefijos de categoría del CMS, el cliente y la fecha repetidos, numeraciones
 * "(2)", títulos cortados con "...", mayúsculas sostenidas, palabras sin tilde y erratas.
 * Nada se inventa: cuando un título está cortado, se completa con el principio de su propia
 * descripción; si no coincide, se deja hasta la última palabra entera.
 */

const SIGLAS = new Set(['CCTV', 'SDI', 'UPS', 'NFPA', 'IRAM', 'AA2000', 'AFIP', 'ARCA', 'ATM', 'UTP', 'IP', 'POE', 'FO', 'LAN', 'WAN', 'ERP', 'API', 'SA', 'SRL', 'UTE', 'SACI', 'NOC', 'ISP', 'GPS', 'VHF', 'UHF', 'PLC', 'DVR', 'NVR', 'TIA', 'EIA', 'OTDR', 'LSZH', 'FTTH', 'WIFI', 'MZA', 'AP', 'PC', 'IT', 'TI', 'NAS', 'SSD', 'CPU', 'TB', 'GB', 'MB', 'RJ', 'FXO', 'FXS', 'SIP', 'SFP', 'TNC', 'RTO', 'PSA', 'DF', 'DG', 'CD', 'CE', 'TS', 'KX', 'NP', 'UFI', 'FRM', 'FS', 'FT', 'IFX', 'ITC', 'LCM', 'LPN', 'MGSM', 'TDS', 'TEL', 'UM', 'BID', 'INTA', 'HSBC', 'COGA', 'DTP', 'PJ', 'RAC', 'FTYC', 'SET', 'FUESMEN', 'COPROSAMEN', 'ARGENINTA', 'H', 'N', 'S', 'R', 'L', 'A', 'D', 'J']);
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u', 'a', 'al', 'en', 'con', 'para', 'por', 'sobre', 'sin', 'un', 'una', 'x']);
const TILDES: Record<string, string> = { area: 'área', camara: 'cámara', camaras: 'cámaras', codigo: 'código', fundacion: 'fundación', credito: 'crédito', cerveceria: 'cervecería', malteria: 'maltería', informatica: 'informática', informaticos: 'informáticos', direccion: 'dirección', inspeccion: 'inspección', union: 'unión', telefonica: 'telefónica', ampliacion: 'ampliación', canalizacion: 'canalización', hermetica: 'hermética', modulo: 'módulo', rele: 'relé', electrico: 'eléctrico', electricos: 'eléctricos', electrica: 'eléctrica', tecnica: 'técnica', tecnico: 'técnico', deteccion: 'detección', instalacion: 'instalación', implementacion: 'implementación', provision: 'provisión', reparacion: 'reparación', adecuacion: 'adecuación', optica: 'óptica', anonima: 'anónima', publico: 'público', numero: 'número', martin: 'martín', maipu: 'maipú', tupungato: 'tupungato', conexion: 'conexión', contratacion: 'contratación', iluminacion: 'iluminación', senalizacion: 'señalización', configuracion: 'configuración', gestion: 'gestión', mantencion: 'mantención', estacion: 'estación', edicion: 'edición', version: 'versión', estadistica: 'estadística', clinica: 'clínica', medica: 'médica', medico: 'médico', basica: 'básica', electronica: 'electrónica', electronico: 'electrónico', logistica: 'logística', automatica: 'automática', fabrica: 'fábrica', deposito: 'depósito', administracion: 'administración', coordinacion: 'coordinación', evaluacion: 'evaluación', migracion: 'migración', integracion: 'integración', digitalizacion: 'digitalización', certificacion: 'certificación', comunicacion: 'comunicación', telecomunicacion: 'telecomunicación', aplicacion: 'aplicación', actualizacion: 'actualización', renovacion: 'renovación', relevamiento: 'relevamiento', segun: 'según', mas: 'más', pañol: 'pañol' };
const ERRATAS: Record<string, string> = { sistena: 'sistema', remplazo: 'reemplazo', pusaldor: 'pulsador', rempazo: 'reemplazo', mantenimineto: 'mantenimiento', univercidad: 'universidad', integrarles: 'integrales', jose: 'José', duplex: 'dúplex' };
const PREFIJOS = ['Detección de Incendios & Seguridad', 'Seguridad Electrónica & SDI', 'Gobierno & Sector Público', 'Video Vigilancia & Seguridad', 'Conectividad & Redes', 'Aeropuertos & Telecomunicaciones', 'Infraestructura Hospitalaria', 'Infraestructura de Data Center', 'Servicios Corporativos', 'Soluciones Tecnológicas', 'Industria & Bodegas', 'Salud & Sector Salud'];
const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre';

const limpiar = (v: unknown) => String(v ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sinTilde = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Una palabra en mayúsculas sostenidas pasa a su forma normal; las siglas se quedan. */
const palabra = (w: string, primera: boolean): string => {
  const core = w.replace(/[^\p{L}\p{N}]/gu, '');
  if (!core || /\d/.test(core) || core.length === 1) return w;
  if (SIGLAS.has(sinTilde(core).toUpperCase()) && core === core.toUpperCase()) return w;
  if (core !== core.toUpperCase()) return w;
  const low = w.toLowerCase();
  const fixed = TILDES[sinTilde(core.toLowerCase())];
  const base = fixed ? low.replace(core.toLowerCase(), fixed) : low;
  if (!primera && MINUSCULAS.has(sinTilde(core.toLowerCase()))) return base;
  return base.replace(/\p{L}/u, (ch) => ch.toUpperCase());
};
/** Corrige erratas y tildes en palabras que vienen en minúsculas. */
const normalizar = (w: string): string => {
  const core = w.replace(/[^\p{L}\p{N}]/gu, '');
  if (!core || /\d/.test(core)) return w;
  const rest = core.slice(1);
  if (rest !== rest.toLowerCase()) return w;
  const k = sinTilde(core.toLowerCase());
  const fix = ERRATAS[k] || TILDES[k];
  if (!fix) return w;
  const cased = core.charAt(0) === core.charAt(0).toUpperCase() ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix;
  return w.replace(core, cased);
};
const caja = (texto: string): string => {
  const words = texto.split(' ');
  return words.map((w, i) => normalizar(palabra(w, i === 0))).join(' ');
};
const mayusculaInicial = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Nombre del cliente tal como se presenta. */
export const nombreCliente = (raw: unknown): string => {
  let c = limpiar(raw);
  if (!c) return '';
  c = c.replace(/\bS\s*\.?\s*R\s*\.?\s*L\.?(?=\s|$)/gi, 'S.R.L.').replace(/\bS\s*\.?\s*A\.?(?=\s|$|\))/gi, 'S.A.').replace(/\bLTDA\.?/gi, 'Ltda.').replace(/\bCOOP\.?(?=\s)/gi, 'Coop.').replace(/\bSOCIEDAD ANONIMA\b/gi, 'S.A.');
  // Nombre propio: las palabras en minúsculas pasan a inicial mayúscula; las mixtas se respetan.
  c = caja(c).split(' ').map((w, i) => { const core = w.replace(/[^\p{L}]/gu, ''); if (!core || /\d/.test(w) || core !== core.toLowerCase()) return w; if (i > 0 && MINUSCULAS.has(sinTilde(core))) return w; return w.replace(/\p{L}/u, (ch) => ch.toUpperCase()); }).join(' ');
  return c.replace(/\s+-\s*/g, ' · ').replace(/\s*\.\s*\./g, '.').replace(/\u00AD/g, '');
};

/** Título del proyecto: sin prefijos del CMS, sin cliente ni fecha repetidos, completo, en su caja. */
export const tituloProyecto = (raw: unknown, clienteRaw: unknown, descripcionRaw: unknown): string => {
  let t = limpiar(raw);
  const clienteOriginal = limpiar(clienteRaw);
  if (t.includes('|')) t = t.split('|')[0].trim() || t;
  for (const p of PREFIJOS) t = t.replace(new RegExp(`^${esc(p)}:\\s*`, 'i'), '');
  t = t.replace(/\s*-\s*Cliente Confidencial(\s*\(\d+\))?/gi, '').replace(/^Cliente Confidencial\s*-\s*/i, '');
  t = t.replace(new RegExp(`\\s*-\\s*(${MESES})\\s+\\d{4}\\s*(\\(\\d+\\))?\\s*$`, 'i'), '');
  t = t.replace(/\s*\(\d+\)\s*$/, '');
  // El título cortado se completa con su descripción cuando ésta empieza igual.
  if (/(\.\.\.|…)\s*$/.test(t)) {
    const corto = t.replace(/\s*(\.\.\.|…)\s*$/, '').trim();
    const d = limpiar(descripcionRaw);
    const pref = corto.slice(0, Math.min(40, corto.length)).toLowerCase();
    if (d && d.toLowerCase().startsWith(pref)) {
      let full = d.length > 120 ? d.slice(0, 120).replace(/\s+\S*$/, '') : d;
      // La descripción del registro también viene cortada (sin cierre, ~70 caracteres): se quita el fragmento final.
      if (!/[.)!?]$/.test(d)) { full = full.replace(/\s*[(,;:-]\s*$/, ''); const last = full.split(' ').pop() || ''; if (last.length <= 4 && !/\d/.test(last)) full = full.replace(/\s+\S*$/, ''); }
      const frase = full.split(/(?<=[a-záéíóúñ0-9)])\.\s(?=[A-ZÁÉÍÓÚÑ])/)[0];
      t = (frase.length >= corto.length ? frase : full).replace(/[.\s]+$/, '');
    } else t = corto.replace(/\s+\S{1,3}$/, '');
  }
  if (clienteOriginal) {
    const c = esc(clienteOriginal);
    t = t.replace(new RegExp(`\\s*-\\s*${c}(?=\\s*-|\\s*$)`, 'i'), '').replace(new RegExp(`^${c}\\s*-\\s*`, 'i'), '');
    const base = clienteOriginal.replace(/\s*\(.*\)\s*$/, '');
    if (base.length > 6) t = t.replace(new RegExp(`\\s*-\\s*${esc(base)}(?=\\s*-|\\s*$)`, 'i'), '');
  }
  t = t.replace(/\s*\.\s*Redes y comunicaciones\.?/gi, '').replace(/IncendiosCorr\w*/g, 'Incendios').replace(/Corrientes Débiles\s*$/i, '').replace(/\s*&\s*/g, ' y ');
  t = t.replace(/\s+-(?=\S)/g, ' · ').replace(/(?<=\S)-\s+/g, ' · ');
  if (t.replace(/[^\p{L}]/gu, '').length < 6) {
    const d = limpiar(descripcionRaw);
    if (d) {
      let f = d.replace(/\s*Cliente:.*$/i, '').replace(/\s*-\s*Cliente Confidencial.*$/i, '');
      for (const p of PREFIJOS) f = f.replace(new RegExp(`^${esc(p)}:\\s*`, 'i'), '');
      f = f.split(/(?<=[a-záéíóúñ0-9)])\.\s(?=[A-ZÁÉÍÓÚÑ])/)[0];
      if (f.length > 110) f = f.slice(0, 110).replace(/\s+\S*$/, '');
      if (f.replace(/[^\p{L}]/gu, '').length > t.replace(/[^\p{L}]/gu, '').length + 3) t = f;
    }
  }
  t = caja(t).replace(/\s+-\s+/g, ' · ').replace(/\s*–\s*/g, ' · ').replace(/[.\s·-]+$/, '').replace(/\s+/g, ' ').trim();
  t = t.replace(/\s*:\s*$/, '');
  return mayusculaInicial(t);
};
