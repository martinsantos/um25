import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link } from "@heroui/react";
import { Link as RouterLink } from 'react-router-dom';

export const MainNavbar = () => {
  return (
    <Navbar 
      className="bg-ultima-navy"
      maxWidth="xl"
    >
      <NavbarBrand>
        <RouterLink to="/" className="flex items-center">
          <span className="text-ultima-red font-bold text-xl">ultima</span>
          <span className="text-white font-bold text-xl">milla</span>
          <span className="text-gray-400 text-xl">.com.ar</span>
        </RouterLink>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="end">
        <NavbarItem>
          <Link 
            as={RouterLink} 
            to="/nosotros" 
            className="text-white"
            underline="hover"
          >
            Nosotros
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link 
            as={RouterLink} 
            to="/servicios" 
            className="text-white"
            underline="hover"
          >
            Servicios
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link 
            as={RouterLink} 
            to="/antecedentes" 
            className="text-white"
            underline="hover"
          >
            Antecedentes
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link 
            as={RouterLink} 
            to="/casos-de-exito" 
            className="text-white"
            underline="hover"
          >
            Casos de Éxito
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link 
            as={RouterLink} 
            to="/contacto" 
            className="text-white"
            underline="hover"
          >
            Contacto
          </Link>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};