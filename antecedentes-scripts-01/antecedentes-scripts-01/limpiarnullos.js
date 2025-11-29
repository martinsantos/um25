import fetch from 'node-fetch'; // Asegúrate de tener node-fetch instalado

async function eliminarCamposNulos() {
  // Obtener los servicios
  const response = await fetch('http://localhost:8055/items/servicios', {
    headers: {
      'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1OGZhZTc3LWU0ZmItNDI2MC04MmMxLWFmYzJiYzExMjNmMSIsInJvbGUiOiJhOGI2ZDg0My1kMTU4LTRiMDUtYjg0OS1iZGExMmJlM2M3Y2IiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc0MjE2MzQxMSwiZXhwIjoxNzQyMTY0MzExLCJpc3MiOiJkaXJlY3R1cyJ9.M_pFwo06hwxlqgbRBFTWdJNhrlHKSFT1_p4CBIVMXjg' // Reemplaza con tu token
    }
  });

  const { data: servicios } = await response.json();

  // Filtrar los IDs de los servicios con campos nulos
  const idsToDelete = servicios
    .filter(servicio => servicio.Titulo === null || servicio.Descripcion === null || servicio.Imagen === null)
    .map(servicio => servicio.id);

  // Eliminar los registros en lote
  for (const id of idsToDelete) {
    await fetch(`http://localhost:8055/items/servicios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN' // Asegúrate de incluir tu token de acceso
      }
    });
  }

  console.log('Registros con campos nulos eliminados');
}

eliminarCamposNulos().catch(console.error);