import axios from 'axios';
import fs from 'fs';

const servicios = JSON.parse(fs.readFileSync('./servicios_limpios.json', 'utf-8'));
const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1OGZhZTc3LWU0ZmItNDI2MC04MmMxLWFmYzJiYzExMjNmMSIsInJvbGUiOiJhOGI2ZDg0My1kMTU4LTRiMDUtYjg0OS1iZGExMmJlM2M3Y2IiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc0MjE2NDY1MiwiZXhwIjoxNzQyMTY1NTUyLCJpc3MiOiJkaXJlY3R1cyJ9.CGJjH79HEx0UqcNTQyRNTM2LtGuRua0Px5bzuJJ2IvA'

const mapeoCampos = {
  "A": "Titulo",
  "B": "Area",
  "C": "Cliente",
  "D": "Descripcion",
  "E": "Contenido_completo",
  "G": "Monto_contratado",
  "I": "Unidad_de_negocio",
  "J": "Fecha"
};

async function cargarServicios() {
  for (const servicio of servicios) {
    try {
      const payload = Object.entries(servicio).reduce((acc, [key, value]) => {
        if (mapeoCampos[key]) {
          acc[mapeoCampos[key]] = value?.trim() || null;
        }
        return acc;
      }, {});

      // Validación mínima
      if (!payload.Titulo || !payload.Descripcion) {
        console.warn(`Servicio incompleto omitido: ${JSON.stringify(payload)}`);
        continue;
      }

      await axios.post(`${DIRECTUS_URL}/items/servicios`, {
        ...payload,
        status: 'published'
      }, {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error(`Error en servicio ${servicio.A}:`, error.response?.data || error.message);
    }
  }
}

cargarServicios();