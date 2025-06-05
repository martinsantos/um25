import React from 'react';
import { MainNavbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { Card, CardBody, Input, Select, SelectItem, Button, Chip } from '@heroui/react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface ProjectProps {
  id: string;
  title: string;
  client: string;
  description: string;
  date: string;
  category: string;
  serviceType: string;
  image: string;
}

const ProjectCard = ({ id, title, client, description, date, category, serviceType, image }: ProjectProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 w-full">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
        />
      </div>
      <CardBody className="p-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Icon icon="lucide:calendar" className="mr-1" width={16} height={16} />
            {date}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Icon icon="lucide:tag" className="mr-1" width={16} height={16} />
            {serviceType}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Icon icon="lucide:building" className="mr-1" width={16} height={16} />
            {client}
          </div>
        </div>
        
        <Button 
          as={Link}
          to={`/antecedentes/${id}`}
          color="primary"
          variant="flat"
          className="w-full"
        >
          Ver Detalles
        </Button>
      </CardBody>
    </Card>
  );
};

export const AntecedentesPage = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedArea, setSelectedArea] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState("");
  const [selectedBusinessUnit, setSelectedBusinessUnit] = React.useState("");

  const projects = [
    {
      id: "438",
      title: "Municipalidad de Guaymallén - Software a medida",
      client: "Municipalidad de Guaymallén",
      description: "Alojamiento y Mantenimiento de la Página WEB del Municipio de Guaymallén",
      date: "4 abr 2025",
      category: "Software",
      serviceType: "Servicios de Telecomunicaciones",
      image: "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-servers-1"
    },
    {
      id: "439",
      title: "Municipalidad de Guaymallén - Software a medida",
      client: "Municipalidad de Guaymallén",
      description: "Alojamiento y Mantenimiento de la Página WEB del Municipio de Guaymallén",
      date: "4 abr 2025",
      category: "Software",
      serviceType: "Servicios de Telecomunicaciones",
      image: "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-servers-2"
    },
    {
      id: "440",
      title: "Headcomm S.A - Cableado Estructurado",
      client: "Headcomm S.A",
      description: "Headcomm S.A - cableado e instalación de 4 cuatro Access Point para Banco Comafi en las siguientes sucursales Av. Rep. De España 1121 Mendoza 9 de julio 91 San Martín, Mendoza Gral Mariano Acha Sur 364 San Juan Pedernera 212 San Luis",
      date: "17 mar 2025",
      category: "Infraestructura",
      serviceType: "Redes Informáticas",
      image: "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-office"
    },
    {
      id: "441",
      title: "Cela SA - SDI",
      client: "Cela SA",
      description: "Cela SA - Remplazo de placa de lazo - Hotel Sheraton de Mendoza",
      date: "25 feb 2025",
      category: "Hardware",
      serviceType: "Comunicaciones y Telecomunicaciones",
      image: "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-servers-3"
    },
    {
      id: "442",
      title: "Cela SA - SDI",
      client: "Cela SA",
      description: "Cela SA - Remplazo de placa de lazo - Hotel Sheraton de Mendoza",
      date: "25 feb 2025",
      category: "Hardware",
      serviceType: "Comunicaciones y Telecomunicaciones",
      image: "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-servers-4"
    },
    {
      id: "443",
      title: "Cela SA - SDI",
      client: "Cela SA",
      description: "Cela SA - Remplazo de placa de lazo - Hotel Sheraton de Mendoza",
      date: "25 feb 2025",
      category: "Hardware",
      serviceType: "Comunicaciones y Telecomunicaciones",
      image: "https://img.heroui.chat/image/ai?w=800&h=500&u=datacenter-office-2"
    }
  ];

  const areas = ["Todos", "Software", "Hardware", "Infraestructura", "Redes", "Seguridad"];
  const clients = ["Todos", "Municipalidad de Guaymallén", "Headcomm S.A", "Cela SA", "Banco Comafi"];
  const businessUnits = ["Todos", "ITO", "Servicios de Telecomunicaciones", "Redes Informáticas", "Comunicaciones y Telecomunicaciones"];

  const handleSearch = () => {
    // Search functionality would be implemented here
    console.log("Searching with filters:", { searchTerm, selectedArea, selectedClient, selectedBusinessUnit });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <div className="bg-ultima-navy py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Nuestros Antecedentes</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Explora nuestra trayectoria y proyectos realizados para diferentes clientes y sectores.
          </p>
        </div>
      </div>
      
      <main className="flex-grow py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Card className="mb-8">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                  <Select 
                    placeholder="Todos" 
                    className="w-full"
                    selectedKeys={selectedArea ? [selectedArea] : []}
                    onChange={(e) => setSelectedArea(e.target.value)}
                  >
                    {areas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <Select 
                    placeholder="Todos" 
                    className="w-full"
                    selectedKeys={selectedClient ? [selectedClient] : []}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Negocio</label>
                  <Select 
                    placeholder="Todos" 
                    className="w-full"
                    selectedKeys={selectedBusinessUnit ? [selectedBusinessUnit] : []}
                    onChange={(e) => setSelectedBusinessUnit(e.target.value)}
                  >
                    {businessUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Buscar por título..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      color="primary" 
                      onPress={handleSearch}
                    >
                      Aplicar Filtros / Buscar
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id}
                id={project.id}
                title={project.title}
                client={project.client}
                description={project.description}
                date={project.date}
                category={project.category}
                serviceType={project.serviceType}
                image={project.image}
              />
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};