import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de botón de ejemplo para pruebas
 * @param {Object} props - Propiedades del componente
 * @param {string} props.text - Texto a mostrar en el botón
 * @param {Function} props.onClick - Función a ejecutar al hacer clic
 * @returns {JSX.Element} Componente de botón
 */
const ExampleButton = ({ text, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="example-button"
      data-testid="example-button"
    >
      {text}
    </button>
  );
};

ExampleButton.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ExampleButton;
