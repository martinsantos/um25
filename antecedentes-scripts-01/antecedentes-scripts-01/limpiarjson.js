import fs from 'fs';

// Leer el archivo JSON original
const servicios = JSON.parse(fs.readFileSync('./servicios.json', 'utf-8'));

// Función para limpiar y ordenar los campos
function limpiarYOrdenarServicios(servicios) {
    return servicios.map(servicio => {
        const servicioLimpio = {};

        // Definir el orden de los campos
        const camposOrdenados = [
            "A", "B", "C", "D", "E", "F", "G", "I", "J"
        ];

        // Recorrer los campos en el orden deseado
        camposOrdenados.forEach(campo => {
            if (servicio[campo] !== null && servicio[campo] !== "") { // Eliminar campos NULL o vacíos
                servicioLimpio[campo] = servicio[campo];
            }
        });

        return servicioLimpio;
    });
}

// Limpiar y ordenar los servicios
const serviciosLimpios = limpiarYOrdenarServicios(servicios);

// Guardar el nuevo archivo JSON
fs.writeFileSync('./servicios_limpios.json', JSON.stringify(serviciosLimpios, null, 2), 'utf-8');

console.log('Archivo servicios_limpios.json creado con éxito.');