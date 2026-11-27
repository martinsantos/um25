import type { Caso } from './relato';
import { tituloProyecto } from './titulos';

export const titulosArchivo = {
  10737: 'Detección de incendios en la remodelación de El Plumerillo',
  10740: 'Red y telefonía para prensa y transmisión en el Estadio Malvinas Argentinas',
  10742: 'Fibra aérea entre el municipio y el centro de congresos',
  10762: 'Equipamiento embarcado en locomotoras',
  10768: 'Voz y datos para las plantas compresoras de Córdoba',
  10770: 'Radioenlaces para la red Wi-Fi Mendoza',
  10771: 'Centro de datos para Domaine Bousquet',
  10776: 'Ingeniería del centro de datos y telecomunicaciones del Parque PASIP',
  10778: 'Servicios digitales del Gobierno de Mendoza',
  10798: 'Datos, telefonía y seguridad en oficinas de Domaine Bousquet',
  10813: 'Trazabilidad de alimentos en Domaine Bousquet',
  10817: 'Portal de la Suprema Corte de Mendoza',
};

export function tituloObraArchivo(caso: Caso) {
  const porId: Readonly<Record<number, string>> = titulosArchivo;
  return porId[caso.id] || tituloProyecto(caso.titulo, caso.cliente, caso.texto) || caso.titulo;
}

export function anioObraArchivo(caso: Caso) {
  // En el registro del estadio, el año del título y el campo Fecha difieren.
  return caso.id === 10740 || caso.year <= 0 ? undefined : caso.year;
}
