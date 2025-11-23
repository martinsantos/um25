import React from 'react';
import { Button } from '@heroui/react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center hero-gradient"
        style={{ 
          backgroundImage: `url(https://img.heroui.chat/image/ai?w=1920&h=1080&u=ultima-milla-hero)`,
        }}
      >
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center">
          ULTIMA MILLA<span className="text-ultima-red">@root:~$</span> run test
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-center max-w-3xl">
          Transformamos tu negocio con tecnología que puedes pagar.
        </p>
        <Button 
          as={Link}
          to="/contacto"
          color="primary" 
          size="lg"
          className="font-semibold"
        >
          Contáctanos
        </Button>
      </div>
    </div>
  );
};