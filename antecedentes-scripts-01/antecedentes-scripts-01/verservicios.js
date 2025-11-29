import fetch from 'node-fetch'; // Asegúrate de tener node-fetch instalado
import fs from 'fs'; // Importar el módulo fs para manejar el sistema de archivos

async function verServicios() {
  const response = await fetch('http://localhost:8055/items/servicios?fields=*.*', {
    headers: {
      'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1OGZhZTc3LWU0ZmItNDI2MC04MmMxLWFmYzJiYzExMjNmMSIsInJvbGUiOiJhOGI2ZDg0My1kMTU4LTRiMDUtYjg0OS1iZGExMmJlM2M3Y2IiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc0MjE2NDY1MiwiZXhwIjoxNzQyMTY1NTUyLCJpc3MiOiJkaXJlY3R1cyJ9.CGJjH79HEx0UqcNTQyRNTM2LtGuRua0Px5bzuJJ2IvA' // Reemplaza con tu token
    }
  });

  if (!response.ok) {
    console.error('Error al obtener los servicios:', response.statusText);
    return;
  }

  const { data: servicios } = await response.json();

  // Guardar los servicios en un nuevo archivo JSON
  fs.writeFileSync('./nuevo_servicios.json', JSON.stringify(servicios, null, 2), 'utf-8');
  console.log('Servicios guardados en nuevo_servicios.json');
}

verServicios().catch(console.error);