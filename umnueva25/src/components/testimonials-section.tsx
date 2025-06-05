import React from 'react';
import { Card, CardBody, Avatar } from '@heroui/react';

interface TestimonialProps {
  quote: string;
  name: string;
  position: string;
  company: string;
}

const TestimonialCard = ({ quote, name, position, company }: TestimonialProps) => {
  return (
    <Card className="bg-white">
      <CardBody className="p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar
            src={`https://img.heroui.chat/image/avatar?w=100&h=100&u=${name.replace(/\s+/g, '-')}`}
            className="w-16 h-16 mb-4"
          />
          <p className="text-gray-700 italic mb-4">"{quote}"</p>
          <div>
            <h4 className="font-semibold">{name}</h4>
            <p className="text-sm text-gray-500">{position}, {company}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "ULTIMA MILLA transformó completamente nuestra infraestructura de TI. Su equipo profesional entregó resultados excepcionales.",
      name: "Carlos Rodríguez",
      position: "CTO",
      company: "Fintech Solutions"
    },
    {
      quote: "La implementación de seguridad que realizaron superó nuestras expectativas. Ahora podemos operar con total tranquilidad.",
      name: "María González",
      position: "Directora de Operaciones",
      company: "Retail Express"
    },
    {
      quote: "Su solución de análisis de datos nos permitió tomar decisiones más inteligentes y aumentar nuestros ingresos en un 25%.",
      name: "Alejandro Méndez",
      position: "CEO",
      company: "LogisTech SA"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Lo que dicen nuestros clientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              position={testimonial.position}
              company={testimonial.company}
            />
          ))}
        </div>
      </div>
    </section>
  );
};