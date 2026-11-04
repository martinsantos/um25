/** Fechas verificadas: actualizar revisión sólo cuando cambia el contenido público. */
export const FOUNDING_DATE = '2003-06-01';
export const PUBLIC_CONTENT_REVIEWED = '2026-11-04';
export function yearsOfExperience(now = new Date()): number {
  const anniversaryPassed = now.getUTCMonth() > 5 || (now.getUTCMonth() === 5 && now.getUTCDate() >= 1);
  return now.getUTCFullYear() - 2003 - (anniversaryPassed ? 0 : 1);
}
