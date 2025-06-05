import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

export const Footer = () => {
  return (
    <footer className="bg-ultima-navy text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <RouterLink to="/" className="flex items-center mb-4">
              <span className="text-ultima-red font-bold text-xl">ultima</span>
              <span className="text-white font-bold text-xl">milla</span>
              <span className="text-gray-400 text-xl">.com.ar</span>
            </RouterLink>
            <p className="text-gray-300 mb-4">
              Transformamos tu negocio con tecnología que puedes pagar.
            </p>
            <div className="flex space-x-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                <Icon icon="lucide:linkedin" width={24} height={24} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                <Icon icon="lucide:twitter" width={24} height={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                <Icon icon="lucide:facebook" width={24} height={24} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                <Icon icon="lucide:instagram" width={24} height={24} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2">
              <li><RouterLink to="/servicios" className="text-gray-300 hover:text-white">Ciberseguridad</RouterLink></li>
              <li><RouterLink to="/servicios" className="text-gray-300 hover:text-white">Cloud Computing</RouterLink></li>
              <li><RouterLink to="/servicios" className="text-gray-300 hover:text-white">Análisis de Datos</RouterLink></li>
              <li><RouterLink to="/servicios" className="text-gray-300 hover:text-white">Desarrollo de Software</RouterLink></li>
              <li><RouterLink to="/servicios" className="text-gray-300 hover:text-white">Aplicaciones Móviles</RouterLink></li>
              <li><RouterLink to="/servicios" className="text-gray-300 hover:text-white">Gestión de Bases de Datos</RouterLink></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li><RouterLink to="/nosotros" className="text-gray-300 hover:text-white">Nosotros</RouterLink></li>
              <li><RouterLink to="/antecedentes" className="text-gray-300 hover:text-white">Antecedentes</RouterLink></li>
              <li><RouterLink to="/casos-de-exito" className="text-gray-300 hover:text-white">Casos de Éxito</RouterLink></li>
              <li><RouterLink to="/contacto" className="text-gray-300 hover:text-white">Contacto</RouterLink></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Política de Privacidad</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Icon icon="lucide:map-pin" className="mr-2 mt-1 flex-shrink-0" />
                <span>Av. Corrientes 1234, Buenos Aires, Argentina</span>
              </li>
              <li className="flex items-start">
                <Icon icon="lucide:phone" className="mr-2 mt-1 flex-shrink-0" />
                <span>+54 11 1234-5678</span>
              </li>
              <li className="flex items-start">
                <Icon icon="lucide:mail" className="mr-2 mt-1 flex-shrink-0" />
                <span>info@ultimamilla.com.ar</span>
              </li>
              <li className="flex items-start">
                <Icon icon="lucide:clock" className="mr-2 mt-1 flex-shrink-0" />
                <span>Lun - Vie: 9:00 - 18:00</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} ULTIMA MILLA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};