/**
 * Imágenes Open Graph 1200×630 (JPG) derivadas de las imágenes editoriales,
 * sectoriales, de servicios, ilustrativas de antecedentes y pósters del cine.
 * Archivos en /public/og (sharp: fit cover, 1200×630, JPEG q80).
 * Regenerar si cambia alguna imagen de origen.
 */
import { SITE_URL } from '../config/seo';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_PATH = '/og/cine-media-cine-bodega-poster.jpg';

export const OG_IMAGE_VARIANTS: Record<string, string> = {
  "/images/editorial/umsa-about-engineering.webp": "/og/images-editorial-umsa-about-engineering.jpg",
  "/images/editorial/umsa-home-operations.webp": "/og/images-editorial-umsa-home-operations.jpg",
  "/images/editorial/umsa-sector-aeropuertos.webp": "/og/images-editorial-umsa-sector-aeropuertos.jpg",
  "/images/editorial/umsa-sector-bodegas.webp": "/og/images-editorial-umsa-sector-bodegas.jpg",
  "/images/editorial/umsa-sector-constructoras.webp": "/og/images-editorial-umsa-sector-constructoras.jpg",
  "/images/editorial/umsa-sector-gobierno.webp": "/og/images-editorial-umsa-sector-gobierno.jpg",
  "/images/editorial/umsa-sector-industria.webp": "/og/images-editorial-umsa-sector-industria.jpg",
  "/images/editorial/umsa-sector-mineria.webp": "/og/images-editorial-umsa-sector-mineria.jpg",
  "/images/editorial/umsa-sector-salud.webp": "/og/images-editorial-umsa-sector-salud.jpg",
  "/images/editorial/umsa-sector-seguridad-electronica.webp": "/og/images-editorial-umsa-sector-seguridad-electronica.jpg",
  "/images/editorial/umsa-sector-software.webp": "/og/images-editorial-umsa-sector-software.jpg",
  "/images/editorial/umsa-service-consultoria-it.webp": "/og/images-editorial-umsa-service-consultoria-it.jpg",
  "/images/editorial/umsa-service-deteccion-incendios.webp": "/og/images-editorial-umsa-service-deteccion-incendios.jpg",
  "/images/editorial/umsa-service-electricos-it.webp": "/og/images-editorial-umsa-service-electricos-it.jpg",
  "/images/editorial/umsa-service-redes.webp": "/og/images-editorial-umsa-service-redes.jpg",
  "/images/editorial/umsa-service-seguridad-electronica.webp": "/og/images-editorial-umsa-service-seguridad-electronica.jpg",
  "/images/editorial/umsa-service-software-a-medida.webp": "/og/images-editorial-umsa-service-software-a-medida.jpg",
  "/images/editorial/umsa-service-soporte-247.webp": "/og/images-editorial-umsa-service-soporte-247.jpg",
  "/images/editorial/umsa-service-telecomunicaciones.webp": "/og/images-editorial-umsa-service-telecomunicaciones.jpg",
  "/img/antecedentes/3064.webp": "/og/img-antecedentes-3064.jpg",
  "/img/antecedentes/3065.webp": "/og/img-antecedentes-3065.jpg",
  "/img/antecedentes/3067.webp": "/og/img-antecedentes-3067.jpg",
  "/img/antecedentes/3068.webp": "/og/img-antecedentes-3068.jpg",
  "/img/antecedentes/3069.webp": "/og/img-antecedentes-3069.jpg",
  "/img/antecedentes/3071.webp": "/og/img-antecedentes-3071.jpg",
  "/img/antecedentes/3072.webp": "/og/img-antecedentes-3072.jpg",
  "/img/antecedentes/3073.webp": "/og/img-antecedentes-3073.jpg",
  "/img/antecedentes/3074.webp": "/og/img-antecedentes-3074.jpg",
  "/img/antecedentes/3075.webp": "/og/img-antecedentes-3075.jpg",
  "/img/antecedentes/3076.webp": "/og/img-antecedentes-3076.jpg",
  "/img/antecedentes/3078.webp": "/og/img-antecedentes-3078.jpg",
  "/img/antecedentes/3079.webp": "/og/img-antecedentes-3079.jpg",
  "/img/antecedentes/3080.webp": "/og/img-antecedentes-3080.jpg",
  "/img/antecedentes/3081.webp": "/og/img-antecedentes-3081.jpg",
  "/img/antecedentes/3082.webp": "/og/img-antecedentes-3082.jpg",
  "/img/antecedentes/3087.webp": "/og/img-antecedentes-3087.jpg",
  "/img/antecedentes/3088.webp": "/og/img-antecedentes-3088.jpg",
  "/img/sectores/aeropuertos.webp": "/og/img-sectores-aeropuertos.jpg",
  "/img/sectores/bodegas.webp": "/og/img-sectores-bodegas.jpg",
  "/img/sectores/constructoras.webp": "/og/img-sectores-constructoras.jpg",
  "/img/sectores/gobierno.webp": "/og/img-sectores-gobierno.jpg",
  "/img/sectores/industria.webp": "/og/img-sectores-industria.jpg",
  "/img/sectores/mineria.webp": "/og/img-sectores-mineria.jpg",
  "/img/sectores/salud.webp": "/og/img-sectores-salud.jpg",
  "/img/sectores/seguridad-electronica.webp": "/og/img-sectores-seguridad-electronica.jpg",
  "/img/sectores/software.webp": "/og/img-sectores-software.jpg",
  "/img/servicios/consultoria-it.webp": "/og/img-servicios-consultoria-it.jpg",
  "/img/servicios/deteccion-incendios.webp": "/og/img-servicios-deteccion-incendios.jpg",
  "/img/servicios/electricos-it.webp": "/og/img-servicios-electricos-it.jpg",
  "/img/servicios/redes.webp": "/og/img-servicios-redes.jpg",
  "/img/servicios/seguridad-electronica.webp": "/og/img-servicios-seguridad-electronica.jpg",
  "/img/servicios/software-a-medida.webp": "/og/img-servicios-software-a-medida.jpg",
  "/img/servicios/soporte-247.webp": "/og/img-servicios-soporte-247.jpg",
  "/img/servicios/telecomunicaciones.webp": "/og/img-servicios-telecomunicaciones.jpg",
  "/cine/media/cine-aeropuerto-poster.jpg": "/og/cine-media-cine-aeropuerto-poster.jpg",
  "/cine/media/cine-bodega-poster.jpg": "/og/cine-media-cine-bodega-poster.jpg",
  "/cine/media/cine-fachada-poster.jpg": "/og/cine-media-cine-fachada-poster.jpg",
  "/cine/media/cine-hospital-poster.jpg": "/og/cine-media-cine-hospital-poster.jpg",
  "/cine/media/cine-planta-poster.jpg": "/og/cine-media-cine-planta-poster.jpg",
  "/cine/media/empresa-mendoza.jpg": "/og/cine-media-empresa-mendoza.jpg",
  "/cine/media/recorrido-aeropuerto-poster.jpg": "/og/cine-media-recorrido-aeropuerto-poster.jpg",
  "/cine/media/recorrido-bodega-poster.jpg": "/og/cine-media-recorrido-bodega-poster.jpg",
  "/cine/media/recorrido-fachada-poster.jpg": "/og/cine-media-recorrido-fachada-poster.jpg",
  "/cine/media/recorrido-hospital-poster.jpg": "/og/cine-media-recorrido-hospital-poster.jpg",
};

const PUBLIC_HOST_RE = /^https?:\/\/(?:www\.)?ultimamilla\.com\.ar/i;

/** Ruta local de una imagen propia (sin host ni query), o null si es externa. */
export function localImagePath(image: string | null | undefined): string | null {
  if (!image) return null;
  const clean = String(image).trim();
  if (clean.startsWith('/')) return clean.split(/[?#]/)[0] || null;
  if (PUBLIC_HOST_RE.test(clean)) return clean.replace(PUBLIC_HOST_RE, '').split(/[?#]/)[0] || null;
  return null;
}

/** Variante 1200×630 de una imagen propia, si existe. */
export function ogVariantFor(image: string | null | undefined): string | null {
  const path = localImagePath(image);
  return path ? OG_IMAGE_VARIANTS[path] || null : null;
}

export function absoluteOgUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path.replace(PUBLIC_HOST_RE, SITE_URL);
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
