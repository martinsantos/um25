import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { Link } from 'react-router-dom';

interface CaseStudyProps {
  title: string;
  category: string;
  description: string;
  bgColor: string;
  textColor: string;
}

const CaseStudyCard = ({ title, category, description, bgColor, textColor }: CaseStudyProps) => {
  return (
    <Card className={`case-study-card ${bgColor}`}>
      <CardBody className="p-6">
        <h3 className={`text-xl font-bold mb-2 ${textColor}`}>{category}</h3>
        <h4 className={`text-lg font-semibold mb-4 ${textColor}`}>{title}</h4>
        <p className={`mb-4 ${textColor}`}>{description}</p>
        <Button 
          as={Link}
          to="/casos-de-exito"
          color="primary"
          variant="flat"
          className="mt-2"
        >
          Ver Detalles
        </Button>
      </CardBody>
    </Card>
  );
};

export const CaseStudiesSection = () => {
  const caseStudies = [
    {
      category: "FinanzasTech",
      title: "Seguridad Bancaria Reforzada",
      description: "Implementamos un sistema de seguridad avanzado para el Banco XYZ, reduciendo los incidentes de ciberseguridad en un 95%.",
      bgColor: "bg-ultima-navy",
      textColor: "text-white"
    },
    {
      category: "EcommerceTech",
      title: "Escalabilidad en la Nube",
      description: "Nuestra solución de cloud computing permitió a la tienda online ABC escalar sus operaciones durante el Black Friday, manejando un aumento del 500% en el tráfico.",
      bgColor: "bg-ultima-navy",
      textColor: "text-white"
    },
    {
      category: "LogisticaTech",
      title: "Optimización de Rutas con IA",
      description: "El análisis de datos implementado para la empresa de logística DEF optimizó las rutas de entrega, aumentando la eficiencia en un 30%.",
      bgColor: "bg-ultima-navy",
      textColor: "text-white"
    }
  ];

  return (
    <section className="py-16 px-4 bg-ultima-navy">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Casos de Éxito</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {caseStudies.map((caseStudy, index) => (
            <CaseStudyCard 
              key={index}
              category={caseStudy.category}
              title={caseStudy.title}
              description={caseStudy.description}
              bgColor={caseStudy.bgColor}
              textColor={caseStudy.textColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};