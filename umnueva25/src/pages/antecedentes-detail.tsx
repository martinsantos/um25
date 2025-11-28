import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainNavbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { Button, Card, CardBody, Chip, Divider } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ProjectDetailParams {
  id: string;
}

export const AntecedentesDetailPage = () => {
  const { id } = useParams<ProjectDetailParams>();
  
  // This would typically come from an API call based on the ID
  // For now, we'll use static data matching the ID from the URL
  const projects = {
    "438": {
      id: "438",
      title: "Municipalidad de Guaymallén - Software a medida",
      client: "Municipalidad de Guaymallén",
      description: "Alojamiento y Mantenimiento de la Página WEB del Municipio de Guaymallén",
      fullDescription: "Desarrollo e implementación de un sistema de gestión web personalizado para la Municipalidad de Guaymallén. El proyecto incluyó el diseño, desarrollo, implementación y mantenimiento de la página web oficial del municipio, con funcionalidades específicas para la gestión de trámites online, publicación de noticias, eventos y servicios municipales.",
      date: "4 de abril de 2025",
      category: "Software",
      serviceType: "Servicios de Telecomunicaciones",
      projectCode: "OTR-999",
      technologies: ["PHP", "MySQL", "JavaScript", "HTML5", "CSS3", "Bootstrap"],
      features: [
        "Portal de trámites online",
        "Sistema de gestión de contenidos",
        "Integración con sistemas internos municipales",
        "Diseño responsive para dispositivos móviles",
        "Panel de administración personalizado",
        "Módulo de estadísticas y reportes"
      ],
      results: [
        "Reducción del 40% en tiempos de gestión de trámites",
        "Incremento del 65% en la satisfacción ciudadana",
        "Optimización de procesos internos municipales",
        "Mejora en la comunicación con los ciudadanos"
      ],
      image: "https://img.heroui.chat/image/ai?w=1200&h=600&u=datacenter-servers-1",
      additionalImages: [
        "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-servers-2",
        "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-office"
      ]
    }
  };
  
  const project = projects[id as keyof typeof projects];
  
  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavbar />
        <main className="flex-grow py-12 px-4 bg-gray-50 flex items-center justify-center">
          <Card>
            <CardBody className="p-6 text-center">
              <Icon icon="lucide:alert-circle" className="text-warning mx-auto mb-4" width={48} height={48} />
              <h2 className="text-2xl font-bold mb-2">Proyecto no encontrado</h2>
              <p className="text-gray-600 mb-4">
                Lo sentimos, el proyecto que estás buscando no existe o ha sido removido.
              </p>
              <Button 
                as={Link}
                to="/antecedentes"
                color="primary"
              >
                Volver a Antecedentes
              </Button>
            </CardBody>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      
      <div 
        className="relative h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${project.image})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-end">
          <div className="container mx-auto px-4 py-12 max-w-7xl">
            <Chip color="primary" variant="flat" className="mb-3">Caso de Estudio</Chip>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {project.title}
            </h1>
            <Chip 
              variant="flat" 
              className="bg-white/20 text-white border-none"
              startContent={<Icon icon="lucide:building" />}
            >
              {project.client}
            </Chip>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Descripción del Proyecto</h2>
                  <p className="text-gray-700 mb-6">
                    {project.fullDescription}
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3">Características Principales</h3>
                  <ul className="list-disc pl-5 mb-6 space-y-1">
                    {project.features.map((feature, index) => (
                      <li key={index} className="text-gray-700">{feature}</li>
                    ))}
                  </ul>
                  
                  <h3 className="text-xl font-semibold mb-3">Tecnologías Utilizadas</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.technologies.map((tech, index) => (
                      <Chip key={index} color="primary" variant="flat">{tech}</Chip>
                    ))}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">Resultados</h3>
                  <ul className="list-disc pl-5 mb-6 space-y-1">
                    {project.results.map((result, index) => (
                      <li key={index} className="text-gray-700">{result}</li>
                    ))}
                  </ul>
                  
                  <Divider className="my-6" />
                  
                  <h3 className="text-xl font-semibold mb-4">Galería del Proyecto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.additionalImages.map((image, index) => (
                      <img 
                        key={index}
                        src={image}
                        alt={`${project.title} - Imagen ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardBody className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Detalles del Proyecto</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center mb-1">
                        <Icon icon="lucide:calendar" className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500">Fecha</span>
                      </div>
                      <p className="font-medium">{project.date}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <Icon icon="lucide:building" className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500">Cliente</span>
                      </div>
                      <p className="font-medium">{project.client}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <Icon icon="lucide:tag" className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500">Tipo de Servicio</span>
                      </div>
                      <p className="font-medium">{project.serviceType}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <Icon icon="lucide:folder" className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500">Categoría</span>
                      </div>
                      <p className="font-medium">{project.category}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <Icon icon="lucide:hash" className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500">Código de Proyecto</span>
                      </div>
                      <p className="font-medium">{project.projectCode}</p>
                    </div>
                  </div>
                  
                  <Divider className="my-6" />
                  
                  <Button 
                    as={Link}
                    to="/contacto"
                    color="primary"
                    className="w-full mb-3"
                  >
                    Solicitar un proyecto similar
                  </Button>
                  
                  <Button 
                    as={Link}
                    to="/antecedentes"
                    variant="flat"
                    color="default"
                    className="w-full"
                  >
                    Volver a Antecedentes
                  </Button>
                </CardBody>
              </Card>
              
              <Card className="mt-6">
                <CardBody className="p-6">
                  <h3 className="text-xl font-semibold mb-4">¿Necesitas ayuda?</h3>
                  <p className="text-gray-600 mb-4">
                    Contáctanos para discutir cómo podemos ayudarte con tu próximo proyecto.
                  </p>
                  <div className="flex items-center mb-3">
                    <Icon icon="lucide:phone" className="mr-2 text-ultima-red" />
                    <span>+54 11 1234-5678</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="lucide:mail" className="mr-2 text-ultima-red" />
                    <span>info@ultimamilla.com.ar</span>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};