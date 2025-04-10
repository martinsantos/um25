export interface Caso {
    id: string;
    titulo: string;
    slug: string;
    cliente: string;
    industria: string;
    descripcionCorta: string;
    descripcionLarga: string;
    desafio: string;
    solucion: string;
    resultados: string[];
    imagen: string;
    tecnologiasUsadas: string[];
    testimonial?: {
        texto: string;
        autor: string;
        cargo: string;
    };
}

export const casos: Caso[] = [
    {
        id: "transformacion-digital-retail",
        titulo: "Transformación Digital en Retail",
        slug: "transformacion-digital-retail",
        cliente: "MegaTiendas SA",
        industria: "Retail",
        descripcionCorta: "Implementación de una solución omnicanal para una cadena líder de retail",
        descripcionLarga: "Desarrollamos e implementamos una solución integral de comercio omnicanal que permitió a MegaTiendas SA unificar sus operaciones online y offline, mejorando significativamente la experiencia del cliente y la eficiencia operativa.",
        desafio: "La empresa necesitaba integrar sus canales de venta físicos y digitales, mientras modernizaba su infraestructura tecnológica para mantener su competitividad en el mercado.",
        solucion: "Implementamos una plataforma de comercio unificada que integra el inventario en tiempo real, gestión de pedidos multicanal y análisis de datos del cliente.",
        resultados: [
            "Aumento del 150% en ventas online",
            "Reducción del 30% en costos operativos",
            "Mejora del 45% en satisfacción del cliente",
            "Tiempo de entrega reducido en un 60%"
        ],
        imagen: "/images/casos/retail-transformation.jpg",
        tecnologiasUsadas: ["React", "Node.js", "AWS", "Elasticsearch", "Redis"],
        testimonial: {
            texto: "La transformación digital ha revolucionado nuestra forma de hacer negocios. Ahora podemos ofrecer una experiencia verdaderamente omnicanal a nuestros clientes.",
            autor: "María González",
            cargo: "CTO de MegaTiendas SA"
        }
    },
    {
        id: "seguridad-financiera",
        titulo: "Seguridad para Institución Financiera",
        slug: "seguridad-financiera",
        cliente: "Banco Seguro",
        industria: "Finanzas",
        descripcionCorta: "Implementación de sistema de seguridad avanzado para banco líder",
        descripcionLarga: "Diseñamos e implementamos un sistema de seguridad integral que protege las operaciones digitales del banco y cumple con todas las regulaciones financieras internacionales.",
        desafio: "El banco necesitaba fortalecer su seguridad digital mientras mantenía la facilidad de uso para sus clientes y cumplía con regulaciones estrictas.",
        solucion: "Desarrollamos una arquitectura de seguridad multicapa con autenticación biométrica, detección de fraudes en tiempo real y sistema de respuesta a incidentes.",
        resultados: [
            "Reducción del 95% en intentos de fraude",
            "Cumplimiento del 100% con regulaciones",
            "Mejora del 40% en tiempo de respuesta",
            "Cero incidentes de seguridad críticos"
        ],
        imagen: "/images/casos/bank-security.jpg",
        tecnologiasUsadas: ["Azure Security", "Blockchain", "AI/ML", "Biometrics", "SIEM"],
        testimonial: {
            texto: "La solución implementada nos ha permitido dormir tranquilos sabiendo que nuestros sistemas están protegidos contra las amenazas más sofisticadas.",
            autor: "Carlos Ruiz",
            cargo: "CISO de Banco Seguro"
        }
    },
    {
        id: "cloud-manufacturing",
        titulo: "Migración a la Nube para Manufactura",
        slug: "cloud-manufacturing",
        cliente: "IndustriasTech",
        industria: "Manufactura",
        descripcionCorta: "Migración exitosa a la nube de sistemas de producción críticos",
        descripcionLarga: "Realizamos la migración completa de los sistemas de producción y gestión de IndustriasTech a la nube, permitiendo mayor escalabilidad y eficiencia operativa.",
        desafio: "La empresa necesitaba modernizar su infraestructura sin interrumpir las operaciones de producción continua y manteniendo altos estándares de calidad.",
        solucion: "Implementamos una estrategia de migración por fases utilizando contenedores y microservicios, con un plan de contingencia robusto.",
        resultados: [
            "Reducción del 40% en costos de IT",
            "Tiempo de inactividad reducido en 80%",
            "Aumento del 60% en velocidad de procesamiento",
            "ROI positivo en 8 meses"
        ],
        imagen: "/images/casos/cloud-manufacturing.jpg",
        tecnologiasUsadas: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD"],
        testimonial: {
            texto: "La migración a la nube ha transformado nuestra capacidad de respuesta y nos ha dado una ventaja competitiva significativa.",
            autor: "Ana Martínez",
            cargo: "COO de IndustriasTech"
        }
    }
];

export function getCasoBySlug(slug: string): Caso | undefined {
    return casos.find(caso => caso.slug === slug);
}

export function getAllCasos(): Caso[] {
    return casos;
}

export function getCasosRelacionados(currentSlug: string, limit: number = 3): Caso[] {
    return casos
        .filter(caso => caso.slug !== currentSlug)
        .slice(0, limit);
}
