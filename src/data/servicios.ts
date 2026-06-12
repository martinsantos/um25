import { editorialImages } from './editorialImageSystem';

export interface Servicio {
    titulo: string;
    slug: string;
    descripcionCorta: string;
    imagen: string;
    caracteristicas: string[];
}

const servicios: Servicio[] = [
    {
        titulo: 'Ciberseguridad',
        slug: 'ciberseguridad',
        descripcionCorta: 'Protege tu empresa con nuestras soluciones integrales de ciberseguridad',
        imagen: editorialImages.sectors['seguridad-electronica'],
        caracteristicas: [
            'Auditoría de seguridad',
            'Protección contra malware',
            'Seguridad en la nube',
            'Respuesta a incidentes'
        ]
    },
    {
        titulo: 'Cloud Computing',
        slug: 'cloud-computing',
        descripcionCorta: 'Soluciones en la nube para optimizar y escalar su negocio',
        imagen: editorialImages.homeHero,
        caracteristicas: [
            'Migración a la nube',
            'IaaS, PaaS, SaaS',
            'Respaldos automáticos',
            'Escalabilidad inmediata'
        ]
    },
    {
        titulo: 'Desarrollo de Software',
        slug: 'desarrollo-software',
        descripcionCorta: 'Soluciones de software personalizadas para impulsar su negocio',
        imagen: editorialImages.sectors.software,
        caracteristicas: [
            'Desarrollo web',
            'Aplicaciones móviles',
            'Software empresarial',
            'APIs y microservicios'
        ]
    },
    {
        titulo: 'Consultoría IT',
        slug: 'consultoria-it',
        descripcionCorta: 'Asesoramiento estratégico para la transformación digital',
        imagen: editorialImages.aboutHero,
        caracteristicas: [
            'Transformación digital',
            'Optimización de procesos',
            'Auditoría tecnológica',
            'Gestión de proyectos'
        ]
    },
    {
        titulo: 'Infraestructura',
        slug: 'infraestructura',
        descripcionCorta: 'Soluciones de infraestructura robustas y escalables',
        imagen: editorialImages.services[101],
        caracteristicas: [
            'Redes y comunicaciones',
            'Servidores y virtualización',
            'Almacenamiento y backup',
            'Monitoreo y mantenimiento'
        ]
    },
    {
        titulo: 'Soporte Técnico',
        slug: 'soporte-tecnico',
        descripcionCorta: 'Asistencia técnica especializada 24/7',
        imagen: editorialImages.services[105],
        caracteristicas: [
            'Help desk',
            'Soporte remoto',
            'Mantenimiento preventivo',
            'Soporte on-site'
        ]
    }
];

export function getAllServicios(): Servicio[] {
    return servicios;
}

export function getServicioBySlug(slug: string): Servicio | undefined {
    return servicios.find(servicio => servicio.slug === slug);
}
