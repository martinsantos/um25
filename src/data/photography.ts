/** Real photographic sources, separate from the explanatory drawings and films. */
import manifest from './photography-manifest.json';
export type Photograph = {
  src: string; source: string; title: string; author: string; license: string;
  licenseUrl: string; sha1: string; sha256: string; width: number; height: number;
  uploaded: string; context: string;
};
const photos = manifest.photos as Record<string, Photograph>;
const cases = manifest.cases as Record<string, string>;
const services = manifest.services as Record<string, string>;
export const PHOTOGRAPHS = photos;
export const photographForCase = (id: number | string) => {
  const key = cases[String(id)];
  return key ? photos[key] : undefined;
};
export const casePhotograph = (id: number | string) => photographForCase(id)?.src || '';
export const servicePhotograph = (id: number | string) => {
  const key = services[String(id)];
  return key ? photos[key]?.src || '' : '';
};
