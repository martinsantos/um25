import type { BlogPost, BlogCategory } from "./types";

/**
 * 24 posts de blog editorial (mock) de ULTIMA MILLA S.A.
 * Distribución por categoría: tecnico 8, tecnologia 6, proyectos 4,
 * empresa 3, noticias 3. 4 posts marcados como featured.
 *
 * Fechas 2025-2026. Autores internos plausibles.
 */

export const BLOG_POSTS: BlogPost[] = [
  // ─────────── TÉCNICO (8) ───────────
  {
    slug: "memos-0-29-novedades",
    title: "Memos 0.29: novedades de la app de notas open source",
    excerpt:
      "Llega Memos 0.29 con markdown mejorado, soporte para dibujos y un nuevo panel de administrador. Repasamos qué trae y cómo lo usamos internamente.",
    category: "tecnico",
    author: "Equipo UMSA",
    date: "2026-03-12",
    readingMinutes: 6,
    tags: ["memos", "open-source", "notas", "release"],
    featured: true,
    summary:
      "Memos 0.29 llega con markdown extendido, dibujos a mano alzada y un panel de administrador renovado para equipos.",
  },
  {
    slug: "snipe-it-8-6-gestion-activos",
    title: "Snipe-IT 8.6: gestión de activos IT más simple",
    excerpt:
      "La nueva versión de Snipe-IT trae importación masiva mejorada, dashboards renovados y reglas de depreciación por categoría. Lo probamos en producción.",
    category: "tecnico",
    author: "Mesa de Ayuda",
    date: "2026-02-04",
    readingMinutes: 8,
    tags: ["snipe-it", "activos", "inventario", "release"],
    featured: false,
    summary:
      "Snipe-IT 8.6 simplifica la gestión de activos IT con importación masiva, dashboards renovados y reglas de depreciación.",
  },
  {
    slug: "solidtime-0-14-timetracking",
    title: "solidtime 0.14: timetracking self-hosted que se está poniendo serio",
    excerpt:
      "Repasamos las novedades de solidtime 0.14: reportes por cliente, integración con Jira y exportación contable. Ya es una alternativa real a Toggl.",
    category: "tecnico",
    author: "Consultoría IT",
    date: "2026-01-22",
    readingMinutes: 7,
    tags: ["solidtime", "timetracking", "self-hosted"],
    featured: false,
    summary:
      "solidtime 0.14 consolida su posición como alternativa self-hosted a Toggl con reportes y exportación contable.",
  },
  {
    slug: "koha-25-05-ils-bibliotecas",
    title: "Koha 25.05: el ILS open source que respiran las bibliotecas",
    excerpt:
      "Nueva versión anual de Koha con mejoras en el OPAC, soporte para FIDO2 y reportes renovados. Lo recomendamos para bibliotecas públicas y universitarias.",
    category: "tecnico",
    author: "Equipo UMSA",
    date: "2025-11-18",
    readingMinutes: 9,
    tags: ["koha", "bibliotecas", "ils", "release"],
    featured: false,
    summary:
      "Koha 25.05 renueva el OPAC, añade FIDO2 y mejora los reportes para bibliotecas públicas y universitarias.",
  },
  {
    slug: "gitea-1-26-self-hosted-git",
    title: "Gitea 1.26: git self-hosted con acciones nativas",
    excerpt:
      "Gitea 1.26 estabiliza Actions, mejora los runners y añade soporte para OCI artifacts. Para equipos que quieren salir de GitHub sin perder productividad.",
    category: "tecnico",
    author: "Equipo UMSA",
    date: "2025-10-09",
    readingMinutes: 6,
    tags: ["gitea", "git", "self-hosted", "actions"],
    featured: false,
    summary:
      "Gitea 1.26 estabiliza Actions y añade soporte para OCI artifacts, consolidándose como alternativa self-hosted a GitHub.",
  },
  {
    slug: "openslides-4-3-asambleas",
    title: "OpenSlides 4.3: asambleas digitales con voto secreto",
    excerpt:
      "OpenSlides 4.3 mejora el voto secreto, la gestión de mociones y el live-streaming. Lo usamos para una asamblea de consorcio de 80 votantes sin dramas.",
    category: "tecnico",
    author: "Consultoría IT",
    date: "2025-09-15",
    readingMinutes: 7,
    tags: ["openslides", "asambleas", "voto", "release"],
    featured: false,
    summary:
      "OpenSlides 4.3 mejora el voto secreto y la gestión de mociones para asambleas digitales de gran escala.",
  },
  {
    slug: "actual-budget-finanzas-open-source",
    title: "Actual Budget: finanzas personales open source que no te espían",
    excerpt:
      "Probamos Actual Budget, la alternativa self-hosted a YNAB con sincronización bancaria opcional, presupuestos sobre y mensualidades. Recomendado para PYMES pequeñas.",
    category: "tecnico",
    author: "Equipo UMSA",
    date: "2025-08-21",
    readingMinutes: 8,
    tags: ["actual-budget", "finanzas", "open-source", "self-hosted"],
    featured: false,
    summary:
      "Actual Budget se consolida como alternativa self-hosted a YNAB con sincronización bancaria opcional y presupuestos flexibles.",
  },
  {
    slug: "backups-3-2-1-restic-btrfs",
    title: "Backups 3-2-1 con Restic y Btrfs: guía operativa",
    excerpt:
      "Cómo implementamos la regla 3-2-1 con snapshots de Btrfs + repositorios Restic en S3 y disco local. Incluye rotación, pruebas de restore y monitoreo.",
    category: "tecnico",
    author: "Consultoría IT",
    date: "2025-07-03",
    readingMinutes: 12,
    tags: ["backups", "restic", "btrfs", "guia"],
    featured: false,
    summary:
      "Guía operativa para backups 3-2-1 combinando snapshots Btrfs y repositorios Restic en S3 y disco local.",
  },

  // ─────────── TECNOLOGÍA (6) ───────────
  {
    slug: "zfs-produccion-snapshots",
    title: "ZFS en producción: snapshots y envíos incrementales",
    excerpt:
      "ZFS sigue siendo la opción más sólida para almacenamiento crítico. Repasamos configuración de pools, snapshots automáticos y envíos incrementales a sitio remoto.",
    category: "tecnologia",
    author: "Consultoría IT",
    date: "2026-02-26",
    readingMinutes: 11,
    tags: ["zfs", "storage", "snapshots", "produccion"],
    featured: false,
    summary:
      "ZFS en producción: configuración de pools, snapshots automáticos y envíos incrementales a sitio remoto.",
  },
  {
    slug: "nextcloud-2026-apuesta",
    title: "Por qué seguimos apostando a Nextcloud en 2026",
    excerpt:
      "Nextcloud Hub 9 madura como plataforma colaborativa self-hosted. Para clientes que exigen soberanía de datos sin perder productividad, sigue siendo la opción.",
    category: "tecnologia",
    author: "Equipo UMSA",
    date: "2026-01-30",
    readingMinutes: 8,
    tags: ["nextcloud", "colaboracion", "self-hosted", "soberania"],
    featured: false,
    summary:
      "Nextcloud Hub 9 se consolida como plataforma colaborativa self-hosted para clientes que exigen soberanía de datos.",
  },
  {
    slug: "wifi-7-entornos-criticos",
    title: "Wi-Fi 7 en entornos críticos: aeropuertos y hospitales",
    excerpt:
      "Wi-Fi 7 ya es una realidad para entornos de alta densidad. Casos reales en un aeropuerto y un hospital, con métricas de roaming y throughput.",
    category: "tecnologia",
    author: "Consultoría IT",
    date: "2025-12-11",
    readingMinutes: 9,
    tags: ["wifi-7", "redes", "aeropuertos", "hospitales"],
    featured: true,
    summary:
      "Wi-Fi 7 en producción para aeropuertos y hospitales: métricas de roaming, throughput y alta densidad.",
  },
  {
    slug: "ipv6-redes-industriales",
    title: "Migración de IPv4 a IPv6 en redes industriales",
    excerpt:
      "La transición a IPv6 en plantas industriales tiene sus propias trampas. Cómo lo abordamos: dual-stack, address plan, seguridad y compatibilidad con PLCs legacy.",
    category: "tecnologia",
    author: "Consultoría IT",
    date: "2025-11-02",
    readingMinutes: 10,
    tags: ["ipv6", "redes-industriales", "migracion"],
    featured: false,
    summary:
      "Cómo abordamos la migración IPv4 → IPv6 en redes industriales: dual-stack, address plan y compatibilidad con PLCs legacy.",
  },
  {
    slug: "edge-computing-faena-minera",
    title: "Edge computing en faena minera remota",
    excerpt:
      "Procesar datos en el borde reduce latencia y ancho de banda satelital. Caso de uso: monitoreo de equipos en una faena a 200 km del data center más cercano.",
    category: "tecnologia",
    author: "Equipo UMSA",
    date: "2025-09-29",
    readingMinutes: 8,
    tags: ["edge", "minería", "iot", "latencia"],
    featured: false,
    summary:
      "Edge computing en faena minera remota: procesar en el borde reduce latencia y ancho de banda satelital.",
  },
  {
    slug: "fibra-optica-om5-datacenter",
    title: "Fibra óptica OM5: cuándo conviene en data centers",
    excerpt:
      "OM5 promete multiplexación por longitud de onda en multimodo, pero ¿justifica el costo premium? Lo analizamos para un data center con spine-leaf de 100G.",
    category: "tecnologia",
    author: "Consultoría IT",
    date: "2025-08-14",
    readingMinutes: 7,
    tags: ["fibra-optica", "om5", "datacenter", "100g"],
    featured: false,
    summary:
      "Análisis técnico y económico de OM5 vs OM4 en data centers con spine-leaf de 100G.",
  },

  // ─────────── PROYECTOS (4) ───────────
  {
    slug: "rediseño-intranet-hospital-perrupato",
    title: "Rediseño de la intranet del Hospital Perrupato",
    excerpt:
      "Cómo modernizamos la intranet del Hospital Perrupato con Next.js, autenticación SSO y mejoras de performance del 60%. Proyecto de 6 meses con metodología ágil.",
    category: "proyectos",
    author: "Equipo UMSA",
    date: "2026-03-05",
    readingMinutes: 9,
    tags: ["intranet", "hospital", "nextjs", "caso"],
    featured: false,
    summary:
      "Rediseño de la intranet hospitalaria con Next.js, SSO y mejoras de performance del 60% en 6 meses.",
  },
  {
    slug: "cctv-ip-aeropuerto-el-plumerillo",
    title: "Despliegue de CCTV IP en Aeropuerto El Plumerillo",
    excerpt:
      "48 cámaras IP, centro de monitoreo y analítica de video. Detalles del despliegue en el Aeropuerto de Mendoza, sin interrumpir la operación aeroportuaria.",
    category: "proyectos",
    author: "Equipo UMSA",
    date: "2026-01-18",
    readingMinutes: 8,
    tags: ["cctv", "aeropuerto", "caso", "seguridad"],
    featured: false,
    summary:
      "Despliegue de 48 cámaras IP y centro de monitoreo en el Aeropuerto El Plumerillo, sin corte de operación.",
  },
  {
    slug: "modernizacion-redes-municipalidad-guaymallen",
    title: "Modernización de redes en Municipalidad de Guaymallén",
    excerpt:
      "Cómo renovamos la red de datos de 14 sedes municipales con VPN site-to-site, segmentación por área y soporte 24/7. Reducción del 80% en tickets de red.",
    category: "proyectos",
    author: "Consultoría IT",
    date: "2025-12-19",
    readingMinutes: 10,
    tags: ["redes", "gobierno", "vpn", "caso"],
    featured: false,
    summary:
      "Modernización de redes en 14 sedes municipales con VPN site-to-site y soporte 24/7. -80% en tickets de red.",
  },
  {
    slug: "sdi-bodega-tapiz",
    title: "Implementación de SDI en Bodega Tapiz",
    excerpt:
      "Sistema de detección de incendios aspirante para la cava de barricas. Cumplimiento de normas IRAM, pruebas trimestrales y protocolo de response 24/7.",
    category: "proyectos",
    author: "Equipo UMSA",
    date: "2025-10-30",
    readingMinutes: 7,
    tags: ["sdi", "bodega", "caso", "seguridad"],
    featured: false,
    summary:
      "Sistema SDI aspirante para cava de barricas en Bodega Tapiz, con cumplimiento IRAM y response 24/7.",
  },

  // ─────────── EMPRESA (3) ───────────
  {
    slug: "25-anos-conectando-operaciones",
    title: "25 años conectando operaciones que no pueden detenerse",
    excerpt:
      "Llegamos a los 25 años de operación con 518 antecedentes verificados, 4 hubs geográficos y un compromiso que no cambió: IT para operaciones críticas.",
    category: "empresa",
    author: "Equipo UMSA",
    date: "2026-03-15",
    readingMinutes: 5,
    tags: ["aniversario", "empresa", "historia"],
    featured: true,
    summary:
      "25 años de operación: 518 antecedentes verificados, 4 hubs geográficos y el mismo compromiso con la continuidad operativa.",
  },
  {
    slug: "nuevo-hub-neuquen",
    title: "Sumamos un nuevo hub en Neuquén",
    excerpt:
      "Abrimos el cuarto hub geográfico en Neuquén para reforzar la cobertura en Patagonia y atender la creciente demanda minera de la región.",
    category: "empresa",
    author: "Equipo UMSA",
    date: "2025-11-25",
    readingMinutes: 4,
    tags: ["expansion", "neuquen", "patagonia"],
    featured: false,
    summary:
      "Nuevo hub en Neuquén para reforzar cobertura en Patagonia y la creciente demanda minera.",
  },
  {
    slug: "aportes-software-libre-2026",
    title: "Compromiso con software libre: nuestros aportes 2026",
    excerpt:
      "Repasamos los proyectos open source a los que aportamos en 2026: bugs fixed en Snipe-IT, traducciones en Koha y un runner para Gitea Actions.",
    category: "empresa",
    author: "Equipo UMSA",
    date: "2025-12-30",
    readingMinutes: 6,
    tags: ["open-source", "colaboracion", "comunidad"],
    featured: false,
    summary:
      "Nuestros aportes a proyectos open source en 2026: bugs en Snipe-IT, traducciones en Koha y un runner para Gitea Actions.",
  },

  // ─────────── NOTICIAS (3) ───────────
  {
    slug: "resolucion-igj-6-2026",
    title: "Resolución IGJ 6/2026: impacto en bookkeeping digital",
    excerpt:
      "La nueva resolución del IGJ 6/2026 actualiza los requisitos de libros digitales para asociaciones civiles. Qué cambia y cómo adaptar tu infraestructura.",
    category: "noticias",
    author: "Consultoría IT",
    date: "2026-02-11",
    readingMinutes: 7,
    tags: ["igj", "normativa", "libros-digitales", "asociaciones"],
    featured: true,
    summary:
      "IGJ 6/2026 actualiza requisitos de libros digitales para asociaciones civiles: qué cambia y cómo adaptarse.",
  },
  {
    slug: "disposicion-anmat-3707-2026",
    title: "Disposición ANMAT 3707/2026: trazabilidad de dispositivos médicos",
    excerpt:
      "ANMAT actualiza la trazabilidad de dispositivos médicos implantables. Impacto en hospitales y centros de diagnóstico que deben adaptar sus sistemas.",
    category: "noticias",
    author: "Consultoría IT",
    date: "2026-01-09",
    readingMinutes: 6,
    tags: ["anmat", "normativa", "salud", "trazabilidad"],
    featured: false,
    summary:
      "ANMAT 3707/2026 actualiza trazabilidad de dispositivos médicos: impacto en hospitales y centros de diagnóstico.",
  },
  {
    slug: "resolucion-transporte-34-2026",
    title: "Resolución Transporte 34/2026: conectividad en terminales",
    excerpt:
      "La Resolución 34/2026 del Ministerio de Transporte establece nuevos requisitos de conectividad en terminales de pasajeros. Implicancias para aeropuertos y ómnibus.",
    category: "noticias",
    author: "Consultoría IT",
    date: "2025-12-05",
    readingMinutes: 5,
    tags: ["transporte", "normativa", "conectividad", "terminales"],
    featured: false,
    summary:
      "Resolución Transporte 34/2026: nuevos requisitos de conectividad en terminales de pasajeros.",
  },
];

export const BLOG_CATEGORIES: BlogCategory[] = [
  "tecnico",
  "tecnologia",
  "proyectos",
  "empresa",
  "noticias",
];

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  tecnico: "Técnico",
  tecnologia: "Tecnología",
  proyectos: "Proyectos",
  empresa: "Empresa",
  noticias: "Noticias",
};

// ───────────────────────── HELPERS ─────────────────────────

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getBlogPostsByCategory(category: BlogCategory): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.category === category);
}

export function getFeaturedBlogPosts(): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.featured);
}

export function getRelatedBlogPosts(slug: string, limit = 3): BlogPost[] {
  const current = getBlogPostBySlug(slug);
  if (!current) return [];
  return BLOG_POSTS.filter(
    (p) =>
      p.slug !== slug &&
      (p.category === current.category ||
        p.tags.some((t) => current.tags.includes(t))),
  ).slice(0, limit);
}

/** Búsqueda libre en blog (título, excerpt, summary, tags). */
export function searchBlogPosts(query: string): BlogPost[] {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = normalize(query.trim());
  if (!q) return BLOG_POSTS;
  return BLOG_POSTS.filter((p) =>
    [p.title, p.excerpt, p.summary, p.tags.join(" "), p.author]
      .map(normalize)
      .some((field) => field.includes(q)),
  );
}

export function countBlogPostsByCategory(): Record<BlogCategory, number> {
  return BLOG_POSTS.reduce(
    (acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<BlogCategory, number>,
  );
}

export default BLOG_POSTS;
