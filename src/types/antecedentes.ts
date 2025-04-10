export interface FilterConfig {
  field: keyof Antecedente;
  display: string;
  options: Array<{ id: string; name: string }>;
  validate: (value: string | null) => boolean;
  filterQuery: (value: string) => { _eq: string } | { _ilike: string };
}

export interface FilterConfigs {
  [key: string]: FilterConfig;
}

export interface Antecedente {
  id: string;
  Titulo: string;
  Descripcion: string;
  Imagen: string;
  Fecha: string;
  Cliente: string;
  Unidad_de_negocio: string;
  Area: string;
}
