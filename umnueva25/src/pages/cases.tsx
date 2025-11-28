import React from 'react';
import { MainNavbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { Card, CardBody, Chip } from '@heroui/react';

interface CaseStudyDetailProps {
  title: string;
  category: string;
  client: string;
  challenge: string;
  solution: string;
  results: string[];
  image: string;
}

const CaseStudyDetail = ({ 
  title, 
  category, 
  client, 
  challenge, 
  solution, 
  results,
  image
}: CaseStudyDetailProps) => {
  return (
    <Card className="mb-12 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div 
          className="h-64 lg:h-auto bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        ></div>
        <CardBody className="p-6">
          <Chip color="primary" variant="flat" className="mb-3">{category}</Chip>
          <h3 className="text-2xl font-semibold mb-3">{title}</h3>
          <p className="text-gray-500 mb-4">Cliente: {client}</p>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">El Desafío:</h4>
            <p className="text-gray-600">{challenge}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Nuestra Solución:</h4>
            <p className="text-gray-600">{solution}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Resultados:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {results.map((result, index) => (
                <li key={index} className="text-gray-600">{result}</li>
              ))}
            </ul>
          </div>
        </CardBody>
      </div>
    </Card>
  );
};

export const CasesPage = () => {
  const caseStudies = [
    {
      title: "Seguridad Bancaria Reforzada",
      category: "FinanzasTech",
      client: "Banco XYZ",
      challenge: "El banco enfrentaba crecientes amenazas de ciberseguridad que ponían en riesgo datos sensibles de clientes y operaciones financieras. Necesitaban una solución robusta que cumpliera con las regulaciones del sector financiero.",
      solution: "Implementamos un sistema de seguridad avanzado para el Banco XYZ, incluyendo autenticación multifactor, encriptación de datos y monitoreo en tiempo real.",
      results: [
        "Reducción de incidentes de ciberseguridad en un 95%",
        "Aumento de la confianza de los clientes",
        "Cumplimiento total de regulaciones financieras",
        "Detección temprana de intentos de intrusión"
      ],
      image: "https://img.heroui.chat/image/finance?w=800&h=600&u=bank-security"
    },
    {
      title: "Escalabilidad en la Nube",
      category: "EcommerceTech",
      client: "Tienda Online ABC",
      challenge: "La tienda online experimentaba caídas frecuentes durante períodos de alto tráfico, especialmente en eventos como Black Friday, lo que resultaba en pérdidas significativas de ventas y clientes insatisfechos.",
      solution: "Nuestra solución de cloud computing permitió a la tienda online ABC escalar sus operaciones durante el Black Friday, implementando auto-scaling y balanceo de carga.",
      results: [
        "Manejo de un aumento del 500% en el tráfico sin tiempo de inactividad",
        "Mejora en la velocidad de carga del sitio en un 60%",
        "Reducción de costos operativos en un 30%",
        "Aumento de las conversiones en un 25%"
      ],
      image: "https://img.heroui.chat/image/ai?w=800&h=600&u=ecommerce-cloud"
    },
    {
      title: "Optimización de Rutas con IA",
      category: "LogisticaTech",
      client: "Empresa de Logística DEF",
      challenge: "La empresa de logística enfrentaba altos costos operativos debido a rutas ineficientes, lo que resultaba en mayores gastos de combustible y tiempos de entrega prolongados.",
      solution: "Desarrollamos un sistema de análisis de datos basado en IA para la empresa de logística DEF, optimizando las rutas de entrega y la gestión de inventario.",
      results: [
        "Aumento de la eficiencia en un 30%",
        "Reducción de costos de combustible en un 25%",
        "Mejora en los tiempos de entrega en un 20%",
        "Optimización del uso de la flota de vehículos"
      ],
      image: "https://img.heroui.chat/image/ai?w=800&h=600&u=logistics-routes"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <div className="bg-ultima-navy py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Casos de Éxito</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Descubre cómo hemos ayudado a empresas de diversos sectores a transformar sus operaciones y alcanzar sus objetivos de negocio.
          </p>
        </div>
      </div>
      <main className="flex-grow py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {caseStudies.map((caseStudy, index) => (
            <CaseStudyDetail 
              key={index}
              title={caseStudy.title}
              category={caseStudy.category}
              client={caseStudy.client}
              challenge={caseStudy.challenge}
              solution={caseStudy.solution}
              results={caseStudy.results}
              image={caseStudy.image}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};