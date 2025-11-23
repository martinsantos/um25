import React from 'react';
import { MainNavbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { Card, CardBody, Avatar } from '@heroui/react';
import { Icon } from '@iconify/react';

interface TeamMemberProps {
  name: string;
  position: string;
  bio: string;
  image: string;
}

const TeamMember = ({ name, position, bio, image }: TeamMemberProps) => {
  return (
    <Card>
      <CardBody className="p-6 flex flex-col items-center text-center">
        <Avatar
          src={image}
          className="w-24 h-24 mb-4"
        />
        <h3 className="text-xl font-semibold mb-1">{name}</h3>
        <p className="text-ultima-red mb-3">{position}</p>
        <p className="text-gray-600">{bio}</p>
        <div className="flex space-x-3 mt-4">
          <a href="#" className="text-gray-400 hover:text-gray-700">
            <Icon icon="lucide:linkedin" width={20} height={20} />
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-700">
            <Icon icon="lucide:twitter" width={20} height={20} />
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-700">
            <Icon icon="lucide:mail" width={20} height={20} />
          </a>
        </div>
      </CardBody>
    </Card>
  );
};

export const AboutPage = () => {
  const teamMembers = [
    {
      name: "Alejandro Rodríguez",
      position: "CEO & Fundador",
      bio: "Con más de 15 años de experiencia en el sector tecnológico, Alejandro fundó ULTIMA MILLA con la visión de hacer la tecnología accesible para todas las empresas.",
      image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=alejandro"
    },
    {
      name: "María González",
      position: "CTO",
      bio: "Especialista en arquitectura de sistemas y desarrollo de software, María lidera nuestro equipo técnico para crear soluciones innovadoras y eficientes.",
      image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=maria"
    },
    {
      name: "Carlos Méndez",
      position: "Director de Ciberseguridad",
      bio: "Experto en seguridad informática con certificaciones CISSP y CEH, Carlos garantiza que nuestras soluciones cumplan con los más altos estándares de seguridad.",
      image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=carlos"
    },
    {
      name: "Laura Fernández",
      position: "Directora de Operaciones",
      bio: "Con experiencia en gestión de proyectos y optimización de procesos, Laura asegura que nuestros servicios se entreguen con la máxima calidad y eficiencia.",
      image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=laura"
    }
  ];

  const values = [
    {
      title: "Innovación",
      description: "Buscamos constantemente nuevas formas de resolver problemas y mejorar nuestras soluciones.",
      icon: "lucide:lightbulb"
    },
    {
      title: "Excelencia",
      description: "Nos comprometemos a entregar servicios de la más alta calidad que superen las expectativas de nuestros clientes.",
      icon: "lucide:award"
    },
    {
      title: "Integridad",
      description: "Actuamos con honestidad y transparencia en todas nuestras interacciones con clientes y colaboradores.",
      icon: "lucide:shield-check"
    },
    {
      title: "Colaboración",
      description: "Trabajamos en estrecha colaboración con nuestros clientes para entender sus necesidades y desarrollar soluciones personalizadas.",
      icon: "lucide:users"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <div className="bg-ultima-navy py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Nosotros</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Conoce más sobre ULTIMA MILLA, nuestra historia, valores y el equipo detrás de nuestras soluciones tecnológicas.
          </p>
        </div>
      </div>
      
      <main className="flex-grow">
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Nuestra Historia</h2>
                <p className="text-gray-600 mb-4">
                  ULTIMA MILLA nació en 2015 con una misión clara: hacer que la tecnología avanzada sea accesible para empresas de todos los tamaños en Argentina y Latinoamérica.
                </p>
                <p className="text-gray-600 mb-4">
                  Lo que comenzó como un pequeño equipo de consultores tecnológicos ha crecido hasta convertirse en una empresa líder en soluciones IT, con un enfoque en ciberseguridad, cloud computing y análisis de datos.
                </p>
                <p className="text-gray-600">
                  Hoy, con un equipo de más de 50 profesionales altamente calificados, seguimos comprometidos con nuestra visión original: transformar negocios a través de la tecnología que pueden pagar.
                </p>
              </div>
              <div className="relative">
                <img 
                  src="https://img.heroui.chat/image/ai?w=600&h=400&u=tech-team-meeting" 
                  alt="Equipo de ULTIMA MILLA" 
                  className="rounded-lg shadow-lg"
                />
                <div className="absolute -bottom-6 -right-6 bg-ultima-red text-white p-4 rounded-lg shadow-lg">
                  <p className="font-bold">+500</p>
                  <p className="text-sm">Proyectos completados</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Nuestros Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index}>
                  <CardBody className="p-6 flex flex-col items-center text-center">
                    <div className="bg-ultima-red/10 p-4 rounded-full mb-4">
                      <Icon 
                        icon={value.icon} 
                        className="text-ultima-red" 
                        width={32} 
                        height={32} 
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Nuestro Equipo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <TeamMember 
                  key={index}
                  name={member.name}
                  position={member.position}
                  bio={member.bio}
                  image={member.image}
                />
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">¿Por qué elegirnos?</h2>
            <p className="text-gray-600 max-w-3xl mx-auto mb-12">
              En ULTIMA MILLA, combinamos experiencia técnica, enfoque centrado en el cliente y soluciones personalizadas para garantizar el éxito de tu negocio.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="bg-ultima-red/10 p-4 rounded-full mb-4">
                  <Icon 
                    icon="lucide:thumbs-up" 
                    className="text-ultima-red" 
                    width={32} 
                    height={32} 
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Experiencia Comprobada</h3>
                <p className="text-gray-600">
                  Más de 8 años en el mercado con cientos de proyectos exitosos.
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="bg-ultima-red/10 p-4 rounded-full mb-4">
                  <Icon 
                    icon="lucide:users" 
                    className="text-ultima-red" 
                    width={32} 
                    height={32} 
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Equipo Especializado</h3>
                <p className="text-gray-600">
                  Profesionales certificados en las tecnologías más avanzadas del mercado.
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="bg-ultima-red/10 p-4 rounded-full mb-4">
                  <Icon 
                    icon="lucide:heart-handshake" 
                    className="text-ultima-red" 
                    width={32} 
                    height={32} 
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Compromiso Total</h3>
                <p className="text-gray-600">
                  Nos involucramos en tu proyecto como si fuera nuestro propio negocio.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};