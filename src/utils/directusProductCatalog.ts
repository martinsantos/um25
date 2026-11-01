import type { ProductoV4 } from '../types/directus-v4';

type EmbeddedProduct = {
  nombre: string;
  headline: string;
  descripcion: string;
  imagen: string;
  caracteristicas: string[];
  servicio_asociado: string;
};

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function isValidEmbeddedProductCatalog(value: unknown): value is EmbeddedProduct[] {
  return Array.isArray(value) && value.every((product) =>
    Boolean(product) &&
    typeof product === 'object' &&
    text((product as EmbeddedProduct).nombre) &&
    text((product as EmbeddedProduct).headline) &&
    text((product as EmbeddedProduct).descripcion) &&
    text((product as EmbeddedProduct).imagen) &&
    text((product as EmbeddedProduct).servicio_asociado) &&
    Array.isArray((product as EmbeddedProduct).caracteristicas) &&
    (product as EmbeddedProduct).caracteristicas.every(text)
  );
}

function normalizeTitle(value: unknown): string {
  return typeof value === 'string'
    ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es')
    : '';
}

export function normalizeEmbeddedProductCatalog(
  catalog: EmbeddedProduct[],
  serviceId: number,
  snapshotProducts: ProductoV4[] = [],
): ProductoV4[] {
  const snapshotByTitle = new Map(
    snapshotProducts
      .filter((product) => Number(product.servicio_id) === serviceId)
      .map((product) => [normalizeTitle(product.titulo), product]),
  );
  const seen = new Set<string>();

  return catalog.flatMap((product, index) => {
    const titulo = product.nombre.trim();
    const key = normalizeTitle(titulo);
    if (!key || seen.has(key)) return [];
    seen.add(key);

    const existing = snapshotByTitle.get(key);
    return [{
      ...(existing || {}),
      ...(existing?.id !== undefined ? { id: existing.id } : {}),
      servicio_id: serviceId,
      titulo,
      descripcion: product.descripcion.trim(),
      imagen: product.imagen.trim(),
      features: product.caracteristicas.map((feature) => feature.trim()),
      destacado: product.headline.trim(),
      orden: existing?.orden ?? index,
      estado: 'publicado',
      servicio_asociado: product.servicio_asociado.trim(),
    }];
  });
}

/** Published editorial template that intentionally lives outside Servicios.Productos. */
export function findPublishedEditorialProduct(slug: string, products: ProductoV4[]): ProductoV4 | null {
  const product = products.find((candidate) =>
    candidate.id === 133 &&
    candidate.slug_producto === slug &&
    candidate.status === 'published' &&
    Boolean(candidate.template_producto) &&
    Boolean(candidate.contenido_producto && typeof candidate.contenido_producto === 'object') &&
    Array.isArray(candidate.opciones_comerciales) &&
    candidate.opciones_comerciales.length > 0
  );
  return product || null;
}

