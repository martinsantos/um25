import type { ProductoV4 } from '../types/directus-v4';

type ProductOption = {
  model: string;
  name: string;
  price: string;
  scope: string;
  fit: string;
};

type TemplateContent = {
  hero?: {
    kicker?: string;
    title?: string;
    lead?: string;
    image?: string;
    imageAlt?: string;
    modeLabel?: string;
    modeValue?: string;
  };
  proof?: Array<{ label: string; value: string }>;
  value?: {
    kicker?: string;
    title?: string;
    text?: string;
    cards?: Array<{ title: string; text: string }>;
  };
  integrations?: Array<{ title: string; text: string }>;
  options?: ProductOption[];
  pilotSteps?: Array<{ label: string; title: string; text: string }>;
  demoEvents?: Array<Record<string, string>>;
  limits?: Array<{ title: string; text: string }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

export const cctvAiProductDefaults = {
  productUrl: 'https://www.ultimamilla.com.ar/cctvai',
  heroImage: '/images/services/productos/cctv-ai/cctv-ai-integrado-hero.webp',
  smokingImage: '/images/services/productos/cctv-ai/cctv-ai-forense-fumador.webp',
  phoneImage: '/images/services/productos/cctv-ai/cctv-ai-forense-telefono.webp',
};

const defaultContent: Required<TemplateContent> = {
  hero: {
    kicker: 'Producto UMSA · CCTV + IA + evidencia operativa',
    title: 'UMSA CCTV AI para convertir cámaras existentes en evidencia accionable.',
    lead:
      'Un producto para operaciones que no necesitan más video crudo: necesitan alertas útiles, clips revisables, dashboard, trazabilidad e informes forenses sobre cámaras que ya están instaladas.',
    image: cctvAiProductDefaults.heroImage,
    imageAlt: 'Dashboard CCTV AI integrado sobre entorno industrial',
    modeLabel: 'Modo demo',
    modeValue: 'UMSA CCTV AI + Forense',
  },
  proof: [
    { label: 'Piloto', value: '30 días' },
    { label: 'Cámaras', value: '6 críticas' },
    { label: 'Entrega', value: 'dashboard + forense' },
  ],
  value: {
    kicker: 'Producto UMSA',
    title: 'Menos búsqueda manual. Más eventos útiles y evidencia defendible.',
    text:
      'La diferencia está en operar sobre cámaras reales, ajustar reglas útiles, separar falsos positivos y entregar evidencia revisable. UMSA CCTV AI se compra por resultado operativo, no por promesa de algoritmo.',
    cards: [
      {
        title: 'Detecta',
        text: 'Cruces de línea, intrusión, permanencia, conteo, EPP o eventos validados por sitio.',
      },
      {
        title: 'Ordena',
        text: 'Clasifica eventos, clips, severidad, estado y responsables para reducir búsqueda manual.',
      },
      {
        title: 'Documenta',
        text: 'Genera reportes operativos o forenses con evidencia visual y recomendaciones revisables.',
      },
    ],
  },
  integrations: [
    {
      title: 'Cámaras existentes',
      text: 'Se parte de la infraestructura instalada cuando imagen, ángulo y horario permiten detectar eventos útiles.',
    },
    {
      title: 'NVR / VMS',
      text: 'Los eventos quedan vinculados con clips, cuadros clave y búsqueda posterior sobre la base de video disponible.',
    },
    {
      title: 'Control de acceso',
      text: 'Entradas, salidas o zonas restringidas pueden cruzarse con evidencia visual y hora exacta.',
    },
    {
      title: 'Alarmas y monitoreo',
      text: 'Un evento visual se transforma en alerta accionable, escalable a responsables o mesa de ayuda.',
    },
    {
      title: 'Reportes UMSA',
      text: 'La operación recibe informes periódicos o forenses con severidad, estado y recomendación revisable.',
    },
    {
      title: 'Sistemas internos',
      text: 'Puede conectarse con tableros, mantenimiento, RRHH, ERP u órdenes internas cuando el proceso lo justifica.',
    },
  ],
  options: [
    {
      model: 'Referencia de mercado',
      name: 'Analítica cerrada de fabricante',
      price: 'USD 72k+',
      scope: 'Servidor, licencias y reglas estándar limitadas al ecosistema del fabricante.',
      fit: 'Más inversión inicial, menos integración operativa, sin reporte forense UMSA.',
    },
    {
      model: 'Producto publicado',
      name: 'Forense UMSA',
      price: 'desde USD 24k',
      scope: 'Piloto de 30 días, IA sobre 6 cámaras críticas, alertas, clips, ajuste de reglas, dashboard e informe forense.',
      fit: 'Menor inversión inicial, más funciones útiles y escalamiento por evidencia real.',
    },
  ],
  pilotSteps: [
    {
      label: '01',
      title: 'Relevamiento',
      text: 'Compatibilidad, ángulos, iluminación, grabadores, zonas críticas y restricciones operativas.',
    },
    {
      label: '02',
      title: 'Selección',
      text: 'Se eligen 6 cámaras críticas, eventos a medir y criterios de falso positivo aceptables.',
    },
    {
      label: '03',
      title: 'Configuración',
      text: 'Reglas iniciales, severidades, responsables, clips y forma de reporte.',
    },
    {
      label: '04',
      title: 'Ajuste semanal',
      text: 'Revisión de eventos útiles, detecciones débiles, falsos positivos y mejoras de reglas.',
    },
    {
      label: '05',
      title: 'Cierre',
      text: 'Recomendación técnica y comercial para escalar por sitio, cámara o caso de uso.',
    },
  ],
  demoEvents: [
    {
      id: 'baseline',
      time: '08:50',
      camera: 'CAM 03 / Acceso playa',
      title: 'Operación normal',
      type: 'Sin evento',
      confidence: '---',
      severity: 'Normal',
      status: 'Monitoreo',
      image: cctvAiProductDefaults.heroImage,
      box: 'demo-box--idle',
      summary: 'La cámara queda conectada al tablero y lista para clasificar eventos útiles.',
      recommendation: 'Mantener como línea base para comparar horarios, tránsito y zonas de interés.',
      evidence: 'Vista general + estado de cámara',
      duration: '00:00',
    },
    {
      id: 'line-cross',
      time: '09:04',
      camera: 'CAM 07 / Perímetro oeste',
      title: 'Cruce de línea en zona restringida',
      type: 'Intrusión',
      confidence: '86%',
      severity: 'Media',
      status: 'Para revisar',
      image: cctvAiProductDefaults.heroImage,
      box: 'demo-box--line',
      summary: 'El sistema marca un cruce de línea virtual y separa el clip para revisión.',
      recommendation: 'Validar si el tránsito corresponde a personal autorizado o a desvío de protocolo.',
      evidence: 'Cuadro clave + clip de 18 segundos',
      duration: '00:18',
    },
    {
      id: 'smoking',
      time: '10:17',
      camera: 'CAM 12 / Zona operativa',
      title: 'Empleado fumando',
      type: 'Fumador',
      confidence: '91%',
      severity: 'Alta',
      status: 'Para revisión',
      image: cctvAiProductDefaults.smokingImage,
      box: 'demo-box--smoking',
      summary: 'Se detecta una persona fumando dentro de una zona operativa no habilitada.',
      recommendation: 'Revisar con supervisor, validar protocolo interno y registrar evidencia del hallazgo.',
      evidence: 'Cuadro clave + fragmento de video',
      duration: '00:24',
    },
    {
      id: 'phone',
      time: '11:42',
      camera: 'CAM 18 / Puesto de control',
      title: 'Uso de teléfono en puesto',
      type: 'Distracción',
      confidence: '88%',
      severity: 'Media',
      status: 'Para revisión',
      image: cctvAiProductDefaults.phoneImage,
      box: 'demo-box--phone',
      summary: 'Se detecta uso de teléfono dentro de una zona de control y se registra duración estimada.',
      recommendation: 'Validar protocolo interno, reincidencia y contexto del puesto antes de decidir.',
      evidence: 'Cuadro clave + duración estimada',
      duration: '01:12',
    },
    {
      id: 'report',
      time: '12:05',
      camera: 'UMSA / Reporte',
      title: 'Informe forense armado',
      type: 'Reporte',
      confidence: '2 hallazgos',
      severity: 'Cierre',
      status: 'Listo',
      image: cctvAiProductDefaults.phoneImage,
      box: 'demo-box--report',
      summary: 'UMSA ordena los eventos, adjunta evidencia visual y deja recomendaciones revisables.',
      recommendation: 'Usar el reporte como soporte técnico; la decisión final queda en revisión humana.',
      evidence: 'Resumen ejecutivo + fichas de incidente',
      duration: 'PDF demo',
    },
  ],
  limits: [
    {
      title: 'Alta viabilidad',
      text: 'Cruce de línea, intrusión, permanencia, conteo vehicular y ocupación de espacios.',
    },
    {
      title: 'Viabilidad condicionada',
      text: 'Humo visual, EPP, uso de teléfono o fumar cuando cámara, zoom y ángulo lo permiten.',
    },
    {
      title: 'No prometer sin validación',
      text: 'Reconocimiento facial, patentes sin cámara dedicada o video oscuro, lejano o de baja resolución.',
    },
  ],
  seo: {
    title: 'UMSA CCTV AI | Inteligencia artificial para cámaras de seguridad',
    description:
      'UMSA CCTV AI convierte cámaras existentes en alertas, clips, dashboard e informes forenses. Producto para seguridad industrial, control operativo y evidencia verificable.',
    keywords:
      'UMSA CCTV AI, inteligencia artificial para cámaras de seguridad, CCTV industrial, analítica de video, informes forenses CCTV, seguridad electrónica Mendoza',
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeObject<T extends Record<string, unknown>>(fallback: T, value: unknown): T {
  return isPlainObject(value) ? ({ ...fallback, ...value } as T) : fallback;
}

function mergeArray<T>(fallback: T[], value: unknown): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function priceToNumber(price: string): number | null {
  const match = price.match(/(\d+),?(\d+)?k/i);
  if (!match) return null;
  const whole = Number(match[1]);
  const decimal = Number(match[2] || 0) / 10;
  return Math.round((whole + decimal) * 1000);
}

export function buildCctvAiProductTemplate(product?: ProductoV4 | null) {
  const content = (isPlainObject(product?.contenido_producto) ? product?.contenido_producto : {}) as TemplateContent;
  const hero = mergeObject(defaultContent.hero, content.hero);
  const value = mergeObject(defaultContent.value, content.value);
  const proof = mergeArray(defaultContent.proof, content.proof);
  const integrations = mergeArray(defaultContent.integrations, content.integrations);
  const options = mergeArray(defaultContent.options, content.options);
  const pilotSteps = mergeArray(defaultContent.pilotSteps, content.pilotSteps);
  const demoEvents = mergeArray(defaultContent.demoEvents, content.demoEvents);
  const limits = mergeArray(defaultContent.limits, content.limits);
  const seo = mergeObject(defaultContent.seo, content.seo);
  const productUrl = product?.url_producto
    ? `https://www.ultimamilla.com.ar${String(product.url_producto).replace(/\/$/, '')}`
    : cctvAiProductDefaults.productUrl;
  const heroImage = product?.imagen_publica || hero.image || cctvAiProductDefaults.heroImage;
  const publishedOptions = options.filter((option) => option.model === 'Producto publicado');
  const productOffers = publishedOptions.length > 0 ? publishedOptions : options;
  const lowPrices = productOffers
    .map((option) => priceToNumber(option.price))
    .filter((value): value is number => value !== null);

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product?.titulo || 'CCTV AI Integrado',
      alternateName: 'CCTV inteligente con alertas, evidencia e integraciones UMSA',
      description:
        product?.destacado ||
        'Producto de inteligencia artificial para cámaras de seguridad existentes: alertas operativas, clips, evidencia forense, reportes e integraciones UMSA.',
      image: `https://www.ultimamilla.com.ar${heroImage}`,
      brand: {
        '@type': 'Brand',
        name: 'ULTIMA MILLA',
      },
      category: product?.categoria_informacion || product?.categoria_comercial || 'PRODUCTO',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: Math.min(...lowPrices, 24000).toString(),
        highPrice: Math.max(...lowPrices, 24000).toString(),
        offerCount: productOffers.length,
        availability: 'https://schema.org/InStock',
        url: productUrl,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'CCTV AI Integrado UMSA',
      serviceType: 'CCTV AI, analítica de video, seguridad electrónica, informes forenses',
      description:
        'Implementación de CCTV AI sobre cámaras existentes con piloto de 30 días, reglas de IA, alertas, clips, reportes e integración con sistemas del cliente.',
      provider: {
        '@type': 'Organization',
        name: 'ULTIMA MILLA',
        url: 'https://www.ultimamilla.com.ar',
      },
      areaServed: [
        { '@type': 'City', name: 'Mendoza' },
        { '@type': 'AdministrativeArea', name: 'Cuyo' },
        { '@type': 'AdministrativeArea', name: 'Patagonia' },
        { '@type': 'Country', name: 'Argentina' },
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Producto UMSA CCTV AI',
        itemListElement: productOffers.map((option) => ({
          '@type': 'Offer',
          name: option.name,
          category: option.model,
          description: `${option.scope} ${option.fit}`,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿CCTV AI Integrado reemplaza operadores o revisión humana?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Ordena video, marca eventos y documenta evidencia. La decisión final queda en revisión humana del cliente.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Puede usarse con cámaras existentes?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí, cuando calidad de imagen, ángulo, iluminación y compatibilidad del NVR/VMS sirven para el caso de uso.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuál es el primer paso recomendado?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Un piloto de 30 días sobre 6 cámaras críticas para validar eventos útiles, falsos positivos, alertas y formato de reporte.',
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${productUrl}#webpage`,
      url: productUrl,
      name: product?.titulo || 'CCTV AI Integrado',
      description:
        'Producto UMSA CCTV AI de ULTIMA MILLA, con piloto, dashboard demo, alertas, clips e informe forense verificable.',
      significantLink: [
        'https://www.ultimamilla.com.ar/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi',
        'https://www.ultimamilla.com.ar/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp',
        'https://www.ultimamilla.com.ar/contacto',
      ],
    },
  ];

  return {
    product,
    productUrl,
    heroImage,
    hero,
    proof,
    value,
    integrations,
    options,
    pilotSteps,
    demoEvents,
    limits,
    seo,
    structuredData,
  };
}
