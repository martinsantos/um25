import React from 'react';
import { MainNavbar } from './components/navbar';
import { HeroSection } from './components/hero-section';
import { ServicesSection } from './components/services-section';
import { CaseStudiesSection } from './components/case-studies-section';
import { TestimonialsSection } from './components/testimonials-section';
import { ContactForm } from './components/contact-form';
import { Footer } from './components/footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <main className="flex-grow">
        <HeroSection />
        <ServicesSection />
        <CaseStudiesSection />
        <TestimonialsSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}

export default App;