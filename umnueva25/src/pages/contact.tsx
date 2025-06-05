import React from 'react';
import { MainNavbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { ContactForm } from '../components/contact-form';
import { Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';

export const ContactPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <div className="bg-ultima-navy py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Contacto</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Estamos aquí para ayudarte. Contáctanos para discutir cómo podemos impulsar tu negocio con nuestras soluciones tecnológicas.
          </p>
        </div>
      </div>
      
      <main className="flex-grow">
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardBody className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-ultima-red/10 p-4 rounded-full">
                    <Icon 
                      icon="lucide:map-pin" 
                      className="text-ultima-red" 
                      width={32} 
                      height={32} 
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Visítanos</h3>
                <p className="text-gray-600">
                  Av. Corrientes 1234<br />
                  Buenos Aires, Argentina<br />
                  CP 1043
                </p>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-ultima-red/10 p-4 rounded-full">
                    <Icon 
                      icon="lucide:phone" 
                      className="text-ultima-red" 
                      width={32} 
                      height={32} 
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Llámanos</h3>
                <p className="text-gray-600">
                  +54 11 1234-5678<br />
                  Lun - Vie: 9:00 - 18:00
                </p>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-ultima-red/10 p-4 rounded-full">
                    <Icon 
                      icon="lucide:mail" 
                      className="text-ultima-red" 
                      width={32} 
                      height={32} 
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Escríbenos</h3>
                <p className="text-gray-600">
                  info@ultimamilla.com.ar<br />
                  soporte@ultimamilla.com.ar
                </p>
              </CardBody>
            </Card>
          </div>
        </section>
        
        <ContactForm />
        
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardBody className="p-0">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.0168878895484!2d-58.38414532346177!3d-34.60373445749048!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4aa9f0a6da5edb%3A0x11bead4e234e558b!2sAv.%20Corrientes%2C%20Buenos%20Aires!5e0!3m2!1sen!2sar!4v1699887814159!5m2!1sen!2sar" 
                  width="100%" 
                  height="450" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ULTIMA MILLA ubicación"
                ></iframe>
              </CardBody>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};