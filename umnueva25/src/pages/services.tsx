import React from 'react';
import { MainNavbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { Card, CardBody, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ServiceDetailProps {
  title: string;
  description: string;
  features: string[];
  icon: string;
}

const ServiceDetail = ({ title, description, features, icon }: ServiceDetailProps) => {
  return (
    <Card className="mb-8">
      <CardBody className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 flex items-start justify-center md:justify-start">
            <div className="bg-gray-100 p-4 rounded-full">
              <Icon 
                icon={icon} 
                className="text-ultima-red" 
                width={48} 
                height={48} 
              />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-3">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            <h4 className="font-semibold mb-2">Características:</h4>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="text-gray-600">{feature}</li>
              ))}
            </ul>
            <Button color="primary">Solicitar información</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const ServicesPage = () => {
  const services = [
    {
      title: "Ciberseguridad",
      description: "Protegemos tu negocio contra amenazas cibernéticas con soluciones avanzadas de seguridad que garantizan la integridad de tus datos y sistemas.",
      icon: "lucide:shield",
      features: [
        "Evaluación de vulnerabilidades y pruebas de penetración",
        "Implementación de firewalls y sistemas de detección de intrusiones",
        "Protección contra malware y ransomware",
        "Gestión de identidades y accesos",
        "Respuesta a incidentes de seguridad",
        "Capacitación en seguridad para empleados"
      ]
    },
    {
      title: "Cloud Computing",
      description: "Optimiza tus operaciones con nuestras soluciones de nube escalables y flexibles que se adaptan a las necesidades cambiantes de tu negocio.",
      icon: "lucide:cloud",
      features: [
        "Migración a la nube (AWS, Azure, Google Cloud)",
        "Infraestructura como servicio (IaaS)",
        "Plataforma como servicio (PaaS)",
        "Software como servicio (SaaS)",
        "Optimización de costos en la nube",
        "Arquitectura de nube híbrida y multi-nube"
      ]
    },
    {
      title: "Análisis de Datos",
      description: "Obtén insights valiosos de tus datos con nuestras soluciones de análisis avanzado que te permiten tomar decisiones basadas en información precisa.",
      icon: "lucide:bar-chart-3",
      features: [
        "Big Data y procesamiento de datos masivos",
        "Inteligencia de negocios (BI) y dashboards",
        "Análisis predictivo y machine learning",
        "Visualización de datos",
        "Integración de fuentes de datos",
        "Consultoría en estrategia de datos"
      ]
    },
    {
      title: "Desarrollo de Software",
      description: "Creamos soluciones de software personalizadas para impulsar tu negocio, adaptadas a tus necesidades específicas y objetivos estratégicos.",
      icon: "lucide:code",
      features: [
        "Desarrollo web frontend y backend",
        "Aplicaciones empresariales a medida",
        "Integración de sistemas y APIs",
        "Modernización de aplicaciones legadas",
        "Metodologías ágiles de desarrollo",
        "Mantenimiento y soporte continuo"
      ]
    },
    {
      title: "Desarrollo de Aplicaciones Móviles",
      description: "Diseñamos y desarrollamos aplicaciones móviles innovadoras para iOS y Android que conectan con tus clientes y optimizan tus procesos internos.",
      icon: "lucide:smartphone",
      features: [
        "Aplicaciones nativas para iOS y Android",
        "Aplicaciones híbridas multiplataforma",
        "Diseño UX/UI centrado en el usuario",
        "Integración con sistemas backend",
        "Implementación de notificaciones push",
        "Análisis de comportamiento de usuarios"
      ]
    },
    {
      title: "Gestión de Bases de Datos",
      description: "Optimizamos y aseguramos tus bases de datos para un rendimiento óptimo, garantizando la disponibilidad y seguridad de tu información crítica.",
      icon: "lucide:database",
      features: [
        "Diseño y modelado de bases de datos",
        "Optimización de rendimiento",
        "Migración y actualización de bases de datos",
        "Replicación y alta disponibilidad",
        "Backup y recuperación de desastres",
        "Administración de bases SQL y NoSQL"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <div className="bg-ultima-navy py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Nuestros Servicios</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Ofrecemos soluciones tecnológicas integrales para impulsar la transformación digital de tu empresa.
          </p>
        </div>
      </div>
      <main className="flex-grow py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {services.map((service, index) => (
            <ServiceDetail 
              key={index}
              title={service.title}
              description={service.description}
              features={service.features}
              icon={service.icon}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};