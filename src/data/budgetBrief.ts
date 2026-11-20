export interface BudgetField {
  key: string;
  suffix: string;
  es: string;
  en: string;
  options: { value: string; es: string; en: string }[];
}

export const budgetFields: BudgetField[] = [
  { key: "budgetSector", suffix: "sector", es: "Sector", en: "Sector / industry", options: [
    { value: "aeropuertos", es: "Aeropuertos", en: "Airports" },
    { value: "bodegas", es: "Bodegas", en: "Wineries" },
    { value: "salud", es: "Salud", en: "Healthcare" },
    { value: "gobierno", es: "Gobierno", en: "Government" },
    { value: "industria", es: "Industria", en: "Industry" },
    { value: "mineria", es: "Minería", en: "Mining" },
    { value: "constructoras", es: "Constructoras", en: "Construction" },
    { value: "software", es: "Software", en: "Software" },
    { value: "seguridad-electronica", es: "Seguridad electrónica", en: "Electronic security" },
    { value: "otro", es: "Otro", en: "Other" },
  ] },
  { key: "budgetScope", suffix: "alcance", es: "Alcance", en: "Scope", options: [
    { value: "diagnostico", es: "Diagnóstico / relevamiento", en: "Initial assessment" },
    { value: "implementacion", es: "Implementación en sitio", en: "Implementation" },
    { value: "soporte", es: "Soporte / abono 24-7", en: "Support / SLA" },
    { value: "licitacion", es: "Licitación / pliego", en: "Tender / RFP" },
  ] },
  { key: "budgetCriticality", suffix: "criticidad", es: "Criticidad", en: "Criticality", options: [
    { value: "alta", es: "Alta — operación no puede detenerse", en: "High — operations cannot stop" },
    { value: "media", es: "Media — ventana planificada", en: "Medium — planned window" },
    { value: "baja", es: "Baja — mejora planificada", en: "Low — improvement project" },
  ] },
  { key: "budgetSites", suffix: "sedes", es: "Sedes", en: "Sites", options: [
    { value: "1", es: "1 sede", en: "1 site" },
    { value: "2-5", es: "2–5 sedes", en: "2–5 sites" },
    { value: "6+", es: "6 o más sedes", en: "6+ sites" },
  ] },
];

export function budgetSelections(params: URLSearchParams, lang: 'es' | 'en') {
  return budgetFields.flatMap(field => {
    const selected = field.options.find(option => option.value === params.get(field.key));
    return selected ? [{ label: field[lang], value: selected[lang] }] : [];
  });
}
