import React from 'react';
import { render, screen } from '@testing-library/react';
import Index from '../index';

// Mock components that might be imported
jest.mock('../../components/Layout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>
}));

describe('Index Page', () => {
  it('renders the main heading', () => {
    render(<Index />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /bienvenidos a última milla/i
    );
  });

  it('renders the main sections', () => {
    render(<Index />);
    
    // Check for main sections
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    
    // Check for key sections
    expect(screen.getByRole('heading', { name: /servicios/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /antecedentes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contacto/i })).toBeInTheDocument();
  });

  it('has a link to antecedentes page', () => {
    render(<Index />);
    const link = screen.getByRole('link', { name: /ver más/i });
    expect(link).toHaveAttribute('href', '/antecedentes');
  });

  it('displays the hero section with correct content', () => {
    render(<Index />);
    
    const hero = screen.getByRole('banner');
    expect(hero).toBeInTheDocument();
    
    // Check for CTA button
    const ctaButton = screen.getByRole('link', { name: /contactanos/i });
    expect(ctaButton).toHaveAttribute('href', '#contacto');
  });
});
