import fs from 'fs';
import path from 'path';

// Configuraciones
const INPUT_FILE = './servicios_limpios.json';
const OUTPUT_FILE = './ANTECEDENTES_NUEVOS.json';

// Función para parsear fecha de manera flexible
function parseFecha(fechaOriginal) {
  if (!fechaOriginal) return null;
  
  // Limpiar la fecha
  const fechaLimpia = String(fechaOriginal).trim();
  
  // Intentar diferentes formatos
  const formatos = [
    // Intentar parsear directamente
    () => new Date(fechaLimpia),
    
    // Formato DD/MM/YYYY
    () => {
      const partes = fechaLimpia.split('/');
      if (partes.length === 3) {
        return new Date(partes[2], partes[1] - 1, partes[0]);
      }
      return null;
    },
    
    // Formato MM/DD/YYYY
    () => {
      const partes = fechaLimpia.split('/');
      if (partes.length === 3) {
        return new Date(partes[2], partes[0] - 1, partes[1]);
      }
      return null;
    }
  ];
  
  // Probar cada formato
  for (let formato of formatos) {
    try {
      const fecha = formato();
      if (fecha && !isNaN(fecha)) {
        return fecha.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignorar errores de conversión
    }
  }
  
  return null;
}

// Función para limpiar y normalizar un antecedente
function limpiarAntecedente(servicio) {
  // Función de limpieza de texto
  const limpiarTexto = (texto) => {
    if (!texto) return '';
    return texto.toString().trim()
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\t/g, ' ');
  };

  // Mapeo y limpieza de campos
  return {
    Título: limpiarTexto(servicio.A),
    Área: limpiarTexto(servicio.B),
    Cliente: limpiarTexto(servicio.C),
    Descripción: limpiarTexto(servicio.D),
    Contenido_completo: limpiarTexto(servicio.E),
    Monto_contratado: servicio.G ? parseFloat(limpiarTexto(servicio.G).replace(/[^0-9.]/g, '')) : null,
    Unidad_de_negocio: limpiarTexto(servicio.I),
    Fecha: parseFecha(servicio.J)
  };
}

// Función principal de procesamiento
function procesarAntecedentes() {
  try {
    // Leer archivo de entrada
    const servicios = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    
    // Limpiar y normalizar
    const antecedentesLimpios = servicios
      .map(limpiarAntecedente)
      // Filtrar registros vacíos o sin información relevante
      .filter(antecedente => 
        antecedente.Título || 
        antecedente.Descripción || 
        antecedente.Contenido_completo
      );

    // Ordenar por fecha (si está presente) o por título
    const antecedentesOrdenados = antecedentesLimpios.sort((a, b) => {
      if (a.Fecha && b.Fecha) {
        return new Date(b.Fecha) - new Date(a.Fecha);
      }
      return a.Título.localeCompare(b.Título);
    });

    // Escribir archivo de salida
    fs.writeFileSync(
      OUTPUT_FILE, 
      JSON.stringify(antecedentesOrdenados, null, 2),
      'utf-8'
    );

    console.log(`Procesamiento completado. 
    - Registros originales: ${servicios.length}
    - Registros limpios: ${antecedentesOrdenados.length}
    - Archivo de salida: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error en el procesamiento:', error);
  }
}

// Ejecutar procesamiento
procesarAntecedentes();