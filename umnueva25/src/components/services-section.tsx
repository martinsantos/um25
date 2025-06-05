import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

interface ServiceProps {
  title: string;
  description: string;
  icon: string;
}

const ServiceCard = ({ title, description, icon }: ServiceProps) => {
  return (
    <Card className="service-card bg-gray-50">
      <CardBody className="flex flex-col items-center text-center p-6">
        <Icon 
          icon={icon} 
          className="service-icon text-4xl text-gray-700 mb-4" 
          width="48" 
          height="48"
        />
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <Button 
          as={Link}
          to="/servicios"
          color="primary"
          variant="light"
          className="mt-auto"
        >
          Ver Detalles
        </Button>
      </CardBody>
    </Card>
  );
};

export const ServicesSection = () => {
  const services = [
    {
      title: "Ciberseguridad",
      description: "Protegemos tu negocio contra amenazas cibernéticas con soluciones avanzadas de seguridad.",
      icon: "lucide:shield"
    },
    {
      title: "Cloud Computing",
      description: "Optimiza tus operaciones con nuestras soluciones de nube escalables y flexibles.",
      icon: "lucide:cloud"
    },
    {
      title: "Análisis de Datos",
      description: "Obtén insights valiosos de tus datos con nuestras soluciones de análisis avanzado.",
      icon: "lucide:bar-chart-3"
    },
    {
      title: "Desarrollo de Software",
      description: "Creamos soluciones de software personalizadas para impulsar tu negocio.",
      icon: "lucide:code"
    },
    {
      title: "Desarrollo de Aplicaciones Móviles",
      description: "Diseñamos y desarrollamos aplicaciones móviles innovadoras para iOS y Android.",
      icon: "lucide:smartphone"
    },
    {
      title: "Gestión de Bases de Datos",
      description: "Optimizamos y aseguramos tus bases de datos para un rendimiento óptimo.",
      icon: "lucide:database"
    }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Nuestros Servicios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};