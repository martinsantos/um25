/**
 * FAQ structured data per sector for SEO (FAQPage schema)
 * Used by sector pages to generate JSON-LD FAQ rich snippets
 */

interface FAQ {
  question: string;
  answer: string;
}

export const sectorFAQs: Record<string, FAQ[]> = {
  mineria: [
    { question: '¿Qué servicios tecnológicos ofrece ULTIMA MILLA para el sector minero?', answer: 'Ofrecemos telecomunicaciones en sitios remotos, cableado estructurado industrial, sistemas de detección de incendio, seguridad electrónica (CCTV), y redes de datos para operaciones mineras en toda la región de Cuyo y Patagonia.' },
    { question: '¿Tienen experiencia en proyectos mineros de gran escala?', answer: 'Sí, contamos con más de 22 años de experiencia y hemos ejecutado proyectos para las principales operaciones mineras de Mendoza, San Juan y Patagonia, incluyendo telecomunicaciones en mina y campamentos.' },
    { question: '¿Pueden implementar soluciones en ubicaciones remotas?', answer: 'Sí, nos especializamos en despliegues en zonas de difícil acceso. Contamos con equipamiento y logística para instalaciones en alta montaña y sitios aislados típicos del sector minero.' },
  ],
  industria: [
    { question: '¿Qué soluciones tecnológicas ofrece ULTIMA MILLA para la industria?', answer: 'Proveemos infraestructura de redes industriales, telecomunicaciones, sistemas de seguridad electrónica, detección de incendio, cableado estructurado y desarrollo de software a medida para plantas industriales.' },
    { question: '¿Trabajan con protocolos industriales y automatización?', answer: 'Sí, integramos redes industriales con protocolos estándar y ofrecemos soluciones de conectividad para entornos de automatización y control de procesos.' },
    { question: '¿Ofrecen soporte técnico para plantas industriales?', answer: 'Sí, brindamos soporte técnico especializado con tiempos de respuesta acordes a las necesidades de operación continua de plantas industriales en Mendoza, Cuyo y Patagonia.' },
  ],
  bodegas: [
    { question: '¿Qué tecnología instala ULTIMA MILLA en bodegas?', answer: 'Instalamos sistemas de seguridad electrónica (CCTV), control de acceso, redes de datos, telecomunicaciones, monitoreo ambiental y sistemas de detección de incendio especializados para bodegas y establecimientos vitivinícolas.' },
    { question: '¿Tienen experiencia en bodegas de Mendoza?', answer: 'Sí, hemos trabajado con numerosas bodegas de la región vitivinícola de Mendoza, implementando soluciones de seguridad, conectividad y monitoreo adaptadas a las necesidades específicas del sector.' },
    { question: '¿Pueden integrar sistemas de monitoreo con la operación de la bodega?', answer: 'Sí, integramos sistemas de monitoreo ambiental, CCTV y control de acceso con las plataformas de gestión de la bodega para una operación unificada.' },
  ],
  aeropuertos: [
    { question: '¿Qué servicios tecnológicos provee ULTIMA MILLA para aeropuertos?', answer: 'Proveemos sistemas de seguridad electrónica, CCTV, control de acceso, telecomunicaciones, cableado estructurado, detección de incendio y redes de datos para terminales aeroportuarias y zonas operativas.' },
    { question: '¿Cumplen con normativas aeroportuarias de seguridad?', answer: 'Sí, nuestras instalaciones cumplen con las normativas y estándares de seguridad requeridos por la autoridad aeronáutica y los organismos de seguridad aeroportuaria.' },
    { question: '¿Han trabajado en aeropuertos de la región?', answer: 'Sí, contamos con experiencia en aeropuertos de Mendoza y la región, incluyendo sistemas de comunicaciones, seguridad perimetral y redes de datos.' },
  ],
  salud: [
    { question: '¿Qué soluciones tecnológicas ofrece ULTIMA MILLA para hospitales y clínicas?', answer: 'Implementamos infraestructura de redes, cableado estructurado hospitalario, sistemas de llamada enfermera, CCTV, control de acceso, detección de incendio y telecomunicaciones para instituciones de salud.' },
    { question: '¿Las instalaciones cumplen con normativas de salud?', answer: 'Sí, trabajamos con estándares específicos del sector salud, incluyendo cableado con características especiales para entornos hospitalarios y cumplimiento de normativas de seguridad eléctrica.' },
    { question: '¿Ofrecen mantenimiento para infraestructura hospitalaria?', answer: 'Sí, brindamos contratos de mantenimiento preventivo y correctivo para asegurar la continuidad operativa de los sistemas tecnológicos en instituciones de salud.' },
  ],
  constructoras: [
    { question: '¿Qué servicios ofrece ULTIMA MILLA para obras de construcción?', answer: 'Proveemos diseño e instalación de cableado estructurado, corrientes débiles, sistemas de detección de incendio, CCTV, control de acceso y telecomunicaciones para obras nuevas y remodelaciones.' },
    { question: '¿Trabajan desde la etapa de proyecto?', answer: 'Sí, nos integramos desde la etapa de diseño con constructoras y arquitectos para planificar la infraestructura tecnológica desde los planos, optimizando costos y tiempos.' },
    { question: '¿Pueden certificar las instalaciones de cableado?', answer: 'Sí, realizamos certificación de cableado estructurado con equipamiento profesional, entregando documentación y garantía de las instalaciones.' },
  ],
  gobiernosectorpublico: [
    { question: '¿Qué servicios tecnológicos provee ULTIMA MILLA al sector público?', answer: 'Brindamos telecomunicaciones, redes de datos, seguridad electrónica, cableado estructurado, detección de incendio y desarrollo de software a medida para organismos gubernamentales y municipales.' },
    { question: '¿Tienen experiencia con licitaciones públicas?', answer: 'Sí, participamos regularmente en procesos licitatorios del sector público y contamos con la documentación y experiencia requerida para contratar con el Estado.' },
    { question: '¿Trabajan con gobiernos provinciales y municipales?', answer: 'Sí, hemos ejecutado proyectos para gobiernos provinciales, municipalidades y organismos descentralizados en Mendoza y otras provincias de la región.' },
  ],
  software: [
    { question: '¿Qué tipo de software desarrolla ULTIMA MILLA?', answer: 'Desarrollamos software a medida para gestión empresarial, aplicaciones web, sistemas de monitoreo, dashboards de control y soluciones de integración de datos adaptadas a cada organización.' },
    { question: '¿Integran el software con la infraestructura existente?', answer: 'Sí, una de nuestras fortalezas es integrar el desarrollo de software con la infraestructura de redes, telecomunicaciones y sistemas que instalamos, ofreciendo una solución integral.' },
    { question: '¿Ofrecen soporte post-implementación del software?', answer: 'Sí, brindamos soporte técnico, mantenimiento evolutivo y actualización continua del software desarrollado para garantizar su correcto funcionamiento.' },
  ],
  'seguridad-electronica': [
    { question: '¿Qué sistemas de seguridad electrónica instala ULTIMA MILLA?', answer: 'Instalamos CCTV con cámaras IP y analógicas, control de acceso biométrico y por tarjeta, sistemas de alarma perimetral, videoporteros y centros de monitoreo para empresas y organizaciones.' },
    { question: '¿Pueden monitorear los sistemas de forma remota?', answer: 'Sí, implementamos plataformas de monitoreo remoto que permiten visualizar cámaras, controlar accesos y recibir alertas desde cualquier ubicación a través de dispositivos móviles o computadoras.' },
    { question: '¿Trabajan con marcas reconocidas de seguridad?', answer: 'Sí, trabajamos con las principales marcas del mercado como Hikvision, Dahua, Axis, ZKTeco, entre otras, garantizando calidad y disponibilidad de repuestos.' },
  ],
};

/**
 * Generate FAQPage JSON-LD structured data for a sector
 */
export function getFAQSchema(sectorSlug: string): Record<string, unknown> | null {
  const faqs = sectorFAQs[sectorSlug];
  if (!faqs || faqs.length === 0) return null;

  return {
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
