import React from 'react';
import { Card, CardBody, Input, Textarea, Button, Select, SelectItem } from '@heroui/react';
import { Icon } from '@iconify/react';

export const ContactForm = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, service: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: '',
        message: ''
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    }, 1500);
  };

  return (
    <section className="py-16 px-4 bg-white" id="contacto">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Contáctanos</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-4">¿Listo para transformar tu negocio?</h3>
            <p className="text-gray-600 mb-6">
              Completa el formulario y un especialista de ULTIMA MILLA se pondrá en contacto contigo para discutir cómo podemos ayudarte a alcanzar tus objetivos tecnológicos.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-4 mt-1 text-ultima-red">
                  <Icon icon="lucide:map-pin" width={24} height={24} />
                </div>
                <div>
                  <h4 className="font-semibold">Dirección</h4>
                  <p className="text-gray-600">Av. Corrientes 1234, Buenos Aires, Argentina</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1 text-ultima-red">
                  <Icon icon="lucide:phone" width={24} height={24} />
                </div>
                <div>
                  <h4 className="font-semibold">Teléfono</h4>
                  <p className="text-gray-600">+54 11 1234-5678</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1 text-ultima-red">
                  <Icon icon="lucide:mail" width={24} height={24} />
                </div>
                <div>
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-gray-600">info@ultimamilla.com.ar</p>
                </div>
              </div>
            </div>
          </div>
          
          <Card>
            <CardBody className="p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <Icon 
                    icon="lucide:check-circle" 
                    className="text-green-500 mx-auto mb-4" 
                    width={64} 
                    height={64} 
                  />
                  <h3 className="text-xl font-semibold mb-2">¡Mensaje enviado!</h3>
                  <p className="text-gray-600">
                    Gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Nombre"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    isRequired
                  />
                  
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    isRequired
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Teléfono"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+54 11 1234-5678"
                    />
                    
                    <Input
                      label="Empresa"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                  
                  <Select
                    label="Servicio de interés"
                    placeholder="Selecciona un servicio"
                    selectedKeys={formData.service ? [formData.service] : []}
                    onChange={(e) => handleSelectChange(e.target.value)}
                    className="w-full"
                  >
                    <SelectItem key="ciberseguridad" value="Ciberseguridad">Ciberseguridad</SelectItem>
                    <SelectItem key="cloud" value="Cloud Computing">Cloud Computing</SelectItem>
                    <SelectItem key="datos" value="Análisis de Datos">Análisis de Datos</SelectItem>
                    <SelectItem key="software" value="Desarrollo de Software">Desarrollo de Software</SelectItem>
                    <SelectItem key="movil" value="Desarrollo Móvil">Desarrollo Móvil</SelectItem>
                    <SelectItem key="bd" value="Gestión de Bases de Datos">Gestión de Bases de Datos</SelectItem>
                    <SelectItem key="otro" value="Otro">Otro</SelectItem>
                  </Select>
                  
                  <Textarea
                    label="Mensaje"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="¿Cómo podemos ayudarte?"
                    minRows={4}
                    isRequired
                  />
                  
                  <Button 
                    type="submit" 
                    color="primary" 
                    className="w-full"
                    isLoading={isSubmitting}
                  >
                    Enviar mensaje
                  </Button>
                </form>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
};