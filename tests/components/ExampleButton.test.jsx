import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExampleButton from '../../src/components/ExampleButton';

describe('ExampleButton', () => {
  // Prueba para verificar que el botón se renderiza correctamente
  it('debe renderizar el botón con el texto proporcionado', () => {
    // Renderizar el componente con las props necesarias
    render(<ExampleButton text="Haz clic" onClick={() => {}} />);
    
    // Verificar que el botón existe y tiene el texto correcto
    const button = screen.getByTestId('example-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Haz clic');
    expect(button).toHaveClass('example-button');
  });

  // Prueba para verificar que se llama a la función onClick al hacer clic
  it('debe llamar a la función onClick cuando se hace clic', () => {
    // Crear un mock de la función onClick
    const handleClick = jest.fn();
    
    // Renderizar el componente con el mock
    render(<ExampleButton text="Haz clic" onClick={handleClick} />);
    
    // Simular un clic en el botón
    const button = screen.getByTestId('example-button');
    fireEvent.click(button);
    
    // Verificar que la función se llamó una vez
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Prueba para verificar las props requeridas
  it('debe requerir las props text y onClick', () => {
    // Espiar en console.error para evitar que falle la prueba
    const originalError = console.error;
    console.error = jest.fn();
    
    // Verificar que se lanza un error si falta alguna prop requerida
    expect(() => {
      render(<ExampleButton />);
    }).toThrow();
    
    // Restaurar console.error
    console.error = originalError;
  });
});
