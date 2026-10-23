// Los antecedentes traen área, título y descripción pero no código de servicio: una lectura
// por palabras clave asigna el servicio que mejor describe el trabajo. El orden de las reglas
// importa: gana la primera que coincide.
const CASE_RULES: [string, RegExp][] = [
  ['107', /incend|humo|detecci[oó]n de|sistemas? de detecci|detectores?\b|sdi\b|rociador|notifier|pulsador|pusaldor|sirena/i],
  ['102', /cctv|c[aá]mara|videovigil|control de acceso|control de asistencia|seguridad electr|alarma|intrusi/i],
  ['108', /el[eé]ctric|\bups\b|tablero|grupo electr|energ[ií]a|puesta a tierra|iluminaci/i],
  ['103', /tel[eé]fon|telecom|radioenlace|enlace|\bvoz\b|central telef|amplificador|voceo|megafon|llamador|trama sip/i],
  ['106', /consultor|auditor|relevamiento|dise[nñ]o de|transformaci[oó]n digital|ingenier[ií]a de/i],
  ['104', /software|desarrollo de|aplicaci[oó]n (web|m[oó]vil)|\bweb\b|digitaliz/i],
  ['105', /soporte|mantenimiento|mesa de ayuda|servidor|disco|servicio t[eé]cnico/i],
  ['101', /\bred(es)?\b|cablead|fibra|\blan\b|\bwan\b|wi-?fi|switch|\brack\b|corrientes d[eé]biles/i],
];

export function caseService(item: { Area?: unknown; Titulo?: unknown; Descripcion?: unknown }): string | null {
  const text = [item.Area, item.Titulo, item.Descripcion].filter(Boolean).join(' ');
  return CASE_RULES.find(([, re]) => re.test(text))?.[0] ?? null;
}
