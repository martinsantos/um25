import axios from 'axios';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configuraciones
const INPUT_FILE = './antecedentes_mistrall_v1.json';
const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'adminpassword';
const PROVIDED_TOKEN = "bqvkfpf7Zl2-oZsCCtSdE8hRTms6YqD_";
const SIMULATE = false; // set to false to affect Directus installation
const MAX_RETRIES = 3;
const DEBUG = true; // Nuevo modo debug
const MAX_CONSECUTIVE_ERRORS = 5; // Nuevo límite de errores consecutivos
const RETRY_DELAY = 2000; // Delay base en ms
const COLLECTION_NAME = 'Antecedentes';
const REQUIRED_FIELDS = ['Titulo', 'Fecha', 'status'];
const MAX_DATE = new Date('2999-12-31').getTime();
const MIN_DATE = new Date('1900-01-01').getTime();
const ENDPOINTS = {
  items: `/items/${COLLECTION_NAME}`
};

// Función mejorada para loguearse y obtener token
async function loginToDirectus() {
  try {
    const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data.data.access_token;
  } catch (error) {
    console.error('❌ Error al iniciar sesión en Directus:', error.response?.data?.errors || error.message);
    throw error;
  }
}

// Función simplificada para verificar token
async function verificarToken(token) {
  try {
    const response = await axios.get(`${DIRECTUS_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (DEBUG) {
      console.log('🔍 Debug - Respuesta de verificación:', {
        status: response.status,
        userId: response.data.data.id,
        headers: response.headers
      });
    }
    return true;
  } catch (error) {
    if (DEBUG) {
      console.error('🔍 Debug - Error de verificación:', {
        status: error.response?.status,
        message: error.response?.data?.errors || error.message,
        headers: error.response?.headers
      });
    }
    return false;
  }
}

// Función mejorada para corregir fechas inválidas
function normalizarFecha(fechaOriginal) {
  if (!fechaOriginal || typeof fechaOriginal !== 'string') {
    return new Date().toISOString().split('T')[0];
  }
  
  // Limpiar la fecha
  const fechaLimpia = fechaOriginal.replace(/[^0-9\-T:.]/g, '');
  
  try {
    const fecha = new Date(fechaLimpia);
    const timestamp = fecha.getTime();
    
    // Verificar si la fecha está en un rango válido
    if (isNaN(timestamp) || timestamp > MAX_DATE || timestamp < MIN_DATE) {
      return new Date().toISOString().split('T')[0];
    }
    
    return fecha.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Función de transformación actualizada para manejar los nuevos campos
function transformPayload(antecedente) {
  return {
    status: 'published',
    sort: 0,
    user_created: null,
    date_created: new Date().toISOString(),
    
    // Campos principales
    Titulo: antecedente["Título"] ? antecedente["Título"].trim() : 'Sin título',
    Descripcion: antecedente["Descripción"] ? antecedente["Descripción"].trim() : null,
    Descripcion_ampliada: antecedente["Descripción_Ampliada"] ? antecedente["Descripción_Ampliada"].trim() : null,
    Contenido_completo: antecedente["Contenido_completo"] ? antecedente["Contenido_completo"].trim() : null,
    
    // Campos de metadatos
    Imagen: null,
    Archivo: null,
    Fecha: normalizarFecha(antecedente["Fecha"]),
    Cliente: antecedente["Cliente"] ? antecedente["Cliente"].trim() : null,
    Unidad_de_negocio: antecedente["Unidad_de_negocio"] ? antecedente["Unidad_de_negocio"].trim() : null,
    Presupuesto: typeof antecedente["Monto_contratado"] === 'number' ? antecedente["Monto_contratado"] : null,
    Area: antecedente["Área"] ? antecedente["Área"].trim() : null,
    
    // Campos adicionales para tracking
    id_original: uuidv4(), // Generar un ID único para referencia
    procesado_en: new Date().toISOString()
  };
}

// Función para probar acceso con token
async function probarAcceso(token) {
  try {
    if (DEBUG) console.log('🔍 Probando acceso a la colección...');
    
    const response = await axios.get(
      `${DIRECTUS_URL}${ENDPOINTS.items}?limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (DEBUG) console.log('✅ Acceso confirmado a la colección');
    return 'authenticated';
  } catch (error) {
    if (DEBUG) {
      console.error('❌ Error al probar acceso:', {
        status: error.response?.status,
        message: error.response?.data?.errors?.[0]?.message
      });
    }
    return 'none';
  }
}

// Función para crear items con reintentos
async function intentarCrearItem(payload, token) {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      const response = await axios.post(
        `${DIRECTUS_URL}/items/${COLLECTION_NAME}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response;
    } catch (error) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        throw error;
      }
      await wait(attempts);
    }
  }
}

// Función para esperar con backoff exponencial
const wait = (attemptNumber) => new Promise(resolve => 
  setTimeout(resolve, RETRY_DELAY * Math.pow(2, attemptNumber))
);

// Función para verificar el servidor Directus
async function verificarServidor() {
  try {
    console.log(`🔍 Verificando servidor Directus en puerto ${DIRECTUS_PORT}...`);
    const response = await axios.get(`${DIRECTUS_URL}/server/info`);
    console.log('✅ Servidor Directus accesible');
    return true;
  } catch (error) {
    console.error(`❌ Error al acceder al servidor: ${error.message}`);
    console.error(`⚠️ Verifique que Directus esté corriendo en el puerto correcto (${DIRECTUS_PORT})`);
    return false;
  }
}

// Función principal para cargar antecedentes
async function cargarAntecedentesADirectus() {
  try {
    console.log('🔄 Iniciando proceso...');
    
    // Verificar servidor antes de continuar
    if (!await verificarServidor()) {
      throw new Error(`No se puede acceder al servidor Directus en puerto ${DIRECTUS_PORT}`);
    }

    let currentToken = PROVIDED_TOKEN || await loginToDirectus();
    console.log('✅ Token obtenido, comenzando carga...');

    // Verificar acceso
    const acceso = await probarAcceso(currentToken);
    if (acceso !== 'authenticated') {
      throw new Error('No se pudo autenticar con el servidor Directus');
    }

    const antecedentes = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    console.log(`📦 Cargados ${antecedentes.length} antecedentes del archivo`);

    let resultados = {
      total: antecedentes.length,
      exitosos: 0,
      fallidos: 0,
      errores: []
    };

    for (let index = 0; index < antecedentes.length; index++) {
      const antecedente = antecedentes[index];
      const payload = transformPayload(antecedente);

      try {
        if (!SIMULATE) {
          if (DEBUG) console.log(`🔍 Intentando cargar: ${JSON.stringify(payload, null, 2)}`);
          await intentarCrearItem(payload, currentToken);
          console.log(`✅ [${index + 1}/${resultados.total}] Cargado: ${payload.Titulo}`);
          resultados.exitosos++;
        } else {
          console.log(`🔹 [SIMULACIÓN] ${payload.Titulo}`);
          resultados.exitosos++;
        }
      } catch (error) {
        const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`❌ Error en item ${index + 1}:`, errorMsg);
        
        if (error.response?.status === 401) {
          console.log('🔄 Renovando token...');
          currentToken = await loginToDirectus();
          index--; // Reintentar
          continue;
        }

        resultados.fallidos++;
        resultados.errores.push({
          item: payload,
          error: errorMsg,
          status: error.response?.status
        });

        // Si hay muchos errores consecutivos, detener el proceso
        if (resultados.errores.length >= MAX_CONSECUTIVE_ERRORS) {
          const ultimosErrores = resultados.errores.slice(-MAX_CONSECUTIVE_ERRORS);
          const mismosErrores = ultimosErrores.every(e => e.status === resultados.errores[0].status);
          
          if (mismosErrores) {
            console.error('🚨 Demasiados errores consecutivos con el mismo código. Deteniendo proceso...');
            break;
          }
        }
      }

      // Pausa breve entre items para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Guardar resultados
    if (resultados.errores.length > 0) {
      fs.writeFileSync('./resultados_fallidos.json', JSON.stringify(resultados.errores, null, 2));
      console.log('📄 Resultados fallidos guardados en resultados_fallidos.json');
    }

    console.log(`
    📊 Resumen Final:
    ==================================
    Total procesados:    ${resultados.total}
    ──────────────────────────────────
    Exitosos:           ${resultados.exitosos}
    Fallidos:           ${resultados.fallidos}
    ==================================
    `);

    return resultados;
  } catch (error) {
    console.error('🔥 Error crítico en el proceso:', error.message);
    throw error;
  }
}

// Ejecutar el proceso principal
cargarAntecedentesADirectus().catch(console.error);