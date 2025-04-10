import axios from 'axios';
import fs from 'fs';
// Ya no necesitamos uuid si no enviamos id_original a Directus
// import { v4 as uuidv4 } from 'uuid';

// Configuraciones (sin cambios, asegúrate que son correctas)
const INPUT_FILE = './antecedentes2025_gemma_v3_20250409.json'; // Asegúrate que la ruta es correcta
const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com'; // Cambia si es necesario
const DIRECTUS_PASSWORD = 'adminpassword'; // Cambia si es necesario
// Considera usar login en vez de token fijo si el token puede expirar
const PROVIDED_TOKEN = "bqvkfpf7Zl2-oZsCCtSdE8hRTms6YqD_";
const SIMULATE = false; // Poner en true para probar sin escribir en Directus
const MAX_RETRIES = 3;
const DEBUG = true; // Útil para ver más detalles
const MAX_CONSECUTIVE_ERRORS = 5;
const RETRY_DELAY = 2000; // ms
const COLLECTION_NAME = 'Antecedentes'; // Asegúrate que coincide con tu colección
// Campos requeridos en el origen para intentar procesar el item
const REQUIRED_FIELDS = ['Titulo', 'Fecha']; // 'status' viene en el origen, pero lo fijamos a 'published'
const MAX_DATE = new Date('2999-12-31');
const MIN_DATE = new Date('1900-01-01');
const ENDPOINTS = {
  items: `/items/${COLLECTION_NAME}`
};

// --- Funciones de Autenticación y Verificación (sin cambios) ---

async function loginToDirectus() {
  try {
    console.log(`🔐 Intentando iniciar sesión como ${DIRECTUS_EMAIL}...`);
    const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Sesión iniciada correctamente.');
    return response.data.data.access_token;
  } catch (error) {
    console.error('❌ Error al iniciar sesión en Directus:', error.response?.data?.errors || error.message);
    throw new Error('Fallo al iniciar sesión en Directus');
  }
}

async function verificarToken(token) {
  try {
    const response = await axios.get(`${DIRECTUS_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (DEBUG) {
      console.log('🔍 Debug - Verificación de token exitosa:', {
        status: response.status,
        userId: response.data.data.id,
      });
    }
    return true;
  } catch (error) {
    if (DEBUG) {
      console.error('🔍 Debug - Error de verificación de token:', {
        status: error.response?.status,
        message: error.response?.data?.errors || error.message,
      });
    }
    return false;
  }
}

async function probarAcceso(token) {
  try {
    if (DEBUG) console.log(`🔍 Probando acceso a la colección ${COLLECTION_NAME}...`);
    const response = await axios.get(
      `${DIRECTUS_URL}${ENDPOINTS.items}?limit=1&fields=id`, // Pedimos solo id para minimizar datos
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (DEBUG) console.log(`✅ Acceso confirmado a la colección ${COLLECTION_NAME}. Status: ${response.status}`);
    return 'authenticated';
  } catch (error) {
    let errMsg = 'Error desconocido al probar acceso';
    if (error.response) {
       errMsg = `Status ${error.response.status}: ${error.response.data?.errors?.[0]?.message || error.message}`;
       if (error.response.status === 403) errMsg += ' (Verifica permisos del token/rol)';
       if (error.response.status === 404) errMsg += ` (Verifica si la colección '${COLLECTION_NAME}' existe)`;
    } else {
       errMsg = error.message;
    }
    console.error(`❌ Error al probar acceso a la colección: ${errMsg}`);
    if (DEBUG) console.error('🔍 Debug - Detalles del error de acceso:', error.response?.data || error);
    return 'none';
  }
}


// --- Funciones de Procesamiento de Datos (MODIFICADAS) ---

/**
 * Normaliza una fecha en formato DD-MM-YYYY a YYYY-MM-DD.
 * Si la fecha es inválida o está fuera de rango, devuelve la fecha actual.
 * @param {string} fechaOriginal - La fecha en formato DD-MM-YYYY.
 * @returns {string} La fecha en formato YYYY-MM-DD.
 */
function normalizarFecha(fechaOriginal) {
  const fallbackDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (!fechaOriginal || typeof fechaOriginal !== 'string') {
    console.warn('⚠️ Fecha original ausente o no es string, usando fecha actual.');
    return fallbackDate;
  }

  const parts = fechaOriginal.trim().split('-');
  if (parts.length !== 3) {
    console.warn(`⚠️ Formato de fecha inesperado: "${fechaOriginal}". Se esperaba DD-MM-YYYY. Usando fecha actual.`);
    return fallbackDate;
  }

  const [day, month, year] = parts;
  // Validar que sean números básicos
  if (!/^\d+$/.test(day) || !/^\d+$/.test(month) || !/^\d+$/.test(year)) {
      console.warn(`⚠️ Partes de la fecha no son numéricas: "${fechaOriginal}". Usando fecha actual.`);
      return fallbackDate;
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10); // Mes es 1-12 en la entrada
  const dayNum = parseInt(day, 10);

  // Crear la fecha en formato YYYY-MM-DD para validación más robusta
  // Asegurarse de que mes y día tengan dos dígitos con ceros a la izquierda
  const monthStr = String(monthNum).padStart(2, '0');
  const dayStr = String(dayNum).padStart(2, '0');
  const fechaFormateada = `${yearNum}-${monthStr}-${dayStr}`;

  try {
    // Validar si la fecha construida es realmente una fecha válida
    const fechaObj = new Date(fechaFormateada + 'T00:00:00Z'); // Usar UTC para evitar problemas de zona horaria

    // getTime() devolverá NaN si la fecha es inválida (e.g., 31-02-2024)
    // También validamos contra MIN_DATE y MAX_DATE
    if (isNaN(fechaObj.getTime()) || fechaObj < MIN_DATE || fechaObj > MAX_DATE) {
      console.warn(`⚠️ Fecha inválida o fuera de rango [${MIN_DATE.toISOString().split('T')[0]} - ${MAX_DATE.toISOString().split('T')[0]}]: "${fechaOriginal}". Usando fecha actual.`);
      return fallbackDate;
    }

    // Si la fecha es válida, devolver en formato YYYY-MM-DD
    return fechaFormateada;

  } catch (e) {
    console.warn(`⚠️ Error procesando fecha "${fechaOriginal}": ${e.message}. Usando fecha actual.`);
    return fallbackDate;
  }
}

/**
 * Limpia y convierte un string de presupuesto (ej: "10.506,00 USD") a número.
 * @param {string} presupuestoStr - El string del presupuesto.
 * @returns {number | null} El valor numérico o null si no se puede convertir.
 */
function normalizarPresupuesto(presupuestoStr) {
    if (!presupuestoStr || typeof presupuestoStr !== 'string') {
        return null;
    }
    try {
        // 1. Quitar 'USD' y espacios extra
        let limpio = presupuestoStr.replace(/USD/gi, '').trim();
        // 2. Quitar puntos de miles (asumiendo '.' como separador de miles)
        limpio = limpio.replace(/\./g, '');
        // 3. Reemplazar coma decimal por punto (asumiendo ',' como separador decimal)
        limpio = limpio.replace(/,/g, '.');
        // 4. Convertir a número flotante
        const valor = parseFloat(limpio);
        // 5. Verificar si el resultado es un número válido
        return isNaN(valor) ? null : valor;
    } catch (error) {
        console.warn(`⚠️ No se pudo convertir el presupuesto "${presupuestoStr}" a número: ${error.message}`);
        return null;
    }
}


/**
 * Transforma el objeto JSON de origen al formato esperado por la colección Directus 'Antecedentes'.
 * @param {object} antecedente - El objeto leído del archivo JSON.
 * @returns {object | null} El payload listo para enviar a Directus, o null si faltan campos requeridos.
 */
function transformPayload(antecedente, index) {
  // Validación básica de campos requeridos del origen
  for (const field of REQUIRED_FIELDS) {
      if (!antecedente[field]) {
          console.error(`❌ Error en item ${index + 1}: Falta el campo requerido del origen "${field}". Saltando item.`);
          console.error(`   Item problemático: ${JSON.stringify(antecedente)}`);
          return null; // Indicar que este item no se puede procesar
      }
  }

  const payload = {
    // --- Campos de Sistema Directus ---
    // 'id' lo genera Directus automáticamente
    status: antecedente.status || 'published', // Usa el status del JSON si existe, si no 'published'
    // 'sort', 'user_created', 'date_created' los gestiona Directus, no es necesario enviarlos usualmente
    // Si necesitas controlarlos específicamente, puedes añadirlos:
    // sort: null, // o un valor numérico si gestionas el orden
    // user_created: 'UUID-DEL-USUARIO-SI-LO-CONOCES', // Si quieres asignarlo a un usuario específico
    // date_created: new Date().toISOString(), // Si quieres fijar la fecha de creación

    // --- Campos del Modelo 'Antecedentes' ---
    Titulo: antecedente.Titulo ? String(antecedente.Titulo).trim() : 'Sin título', // Usa el nombre correcto del JSON
    Descripcion: antecedente.Descripcion ? String(antecedente.Descripcion).trim() : null, // Usa el nombre correcto del JSON
    // Imagen y Archivo: Asumiendo que son IDs de archivos en Directus o null si no hay
    Imagen: antecedente.Imagen || null, // Mantenlo simple por ahora
    Archivo: antecedente.Archivo || null, // Mantenlo simple por ahora
    Fecha: normalizarFecha(antecedente.Fecha), // Usa la función corregida
    Cliente: antecedente.Cliente ? String(antecedente.Cliente).trim() : null,
    Unidad_de_negocio: antecedente.Unidad_de_negocio ? String(antecedente.Unidad_de_negocio).trim() : null,
    Presupuesto: normalizarPresupuesto(antecedente.Presupuesto), // Usa la función de normalización
    Area: antecedente.Area ? String(antecedente.Area).trim() : null, // Usa el nombre correcto del JSON

    // --- Campos Opcionales / No estándar ---
    // Palabras_clave: Si tienes un campo 'tags' (tipo Tags) o 'keywords' (tipo String/Text) en Directus:
    // keywords: antecedente.Palabras_clave || null,
    // O si es un campo Tags:
    // tags: antecedente.Palabras_clave ? antecedente.Palabras_clave.split(',').map(tag => tag.trim()).filter(Boolean) : [],

    // ELIMINADOS: id_original, procesado_en
    // Si los necesitas en Directus, asegúrate de que los campos existan en tu colección 'Antecedentes'
    // id_original: uuidv4(),
    // procesado_en: new Date().toISOString()
  };

  // Limpieza final: eliminar claves con valor undefined si alguna lógica las produce
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  return payload;
}

// --- Funciones de Creación y Control (sin cambios significativos) ---

async function intentarCrearItem(payload, token, itemIndex) {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      const response = await axios.post(
        `${DIRECTUS_URL}${ENDPOINTS.items}`, // Usa la constante ENDPOINTS
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Loguear éxito con más detalle
      if (DEBUG) console.log(`🔍 Debug - Respuesta de creación item ${itemIndex + 1}: Status ${response.status}`);
      return response; // Éxito
    } catch (error) {
      attempts++;
      const status = error.response?.status;
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
      console.warn(`⚠️ Intento ${attempts}/${MAX_RETRIES} fallido para item ${itemIndex + 1} (Status: ${status || 'N/A'}): ${errorMsg}`);

      // Si es error de autenticación (401) o prohibido (403), no reintentar con el mismo token
      if (status === 401 || status === 403) {
          console.error(`❌ Error ${status} en item ${itemIndex + 1}. No se reintentará con este token.`);
          throw error; // Lanzar el error para que el bucle principal lo maneje (posible refresco de token)
      }
      // Si es error de validación (400), probablemente no se arregle reintentando
      if (status === 400) {
          console.error(`❌ Error de validación (400) en item ${itemIndex + 1}. Payload podría ser inválido. No se reintentará.`);
          if (DEBUG) console.error(`🔍 Debug - Payload rechazado: ${JSON.stringify(payload, null, 2)}`);
          throw error; // Lanzar el error para registrarlo
      }

      if (attempts >= MAX_RETRIES) {
        console.error(`❌ Máximos reintentos (${MAX_RETRIES}) alcanzados para item ${itemIndex + 1}.`);
        throw error; // Lanzar el error final
      }

      // Esperar antes del siguiente intento
      const delay = RETRY_DELAY * Math.pow(2, attempts -1); // Backoff exponencial
      console.log(`⏱️ Esperando ${delay}ms antes del reintento ${attempts + 1} para item ${itemIndex + 1}...`);
      await wait(delay); // Esperar antes de reintentar
    }
  }
}

// Función wait modificada para aceptar delay directamente
const wait = (delay) => new Promise(resolve => setTimeout(resolve, delay));

async function verificarServidor() {
  try {
    console.log(`🔍 Verificando conexión con Directus en ${DIRECTUS_URL}...`);
    // Usamos un endpoint público que no requiere auth para verificar conectividad básica
    const response = await axios.get(`${DIRECTUS_URL}/server/ping`, { timeout: 5000 }); // Timeout de 5s
    if (response.data === 'pong') {
        console.log('✅ Conexión con el servidor Directus establecida.');
        return true;
    } else {
        console.warn('⚠️ El servidor Directus respondió, pero no con "pong". Verificando estado...');
        // Podríamos intentar otro endpoint como /server/info si ping no es fiable
        try {
            const infoResponse = await axios.get(`${DIRECTUS_URL}/server/info`, { timeout: 5000 });
            console.log('✅ Información del servidor obtenida. Conexión OK.');
            return true;
        } catch (infoError) {
            console.error(`❌ No se pudo obtener información del servidor: ${infoError.message}`);
            return false;
        }
    }
  } catch (error) {
    console.error(`❌ Error fatal al conectar con Directus en ${DIRECTUS_URL}: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
        console.error(`   Asegúrate de que Directus esté corriendo en el puerto ${DIRECTUS_PORT} y sea accesible desde donde ejecutas el script.`);
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        console.error(`   La conexión excedió el tiempo de espera. Verifica la red o si el servidor está sobrecargado.`);
    }
    return false;
  }
}

// --- Función Principal (MODIFICADA LIGERAMENTE para manejo de token y errores) ---

async function cargarAntecedentesADirectus() {
  console.log('🚀 Iniciando proceso de carga de Antecedentes...');

  // 1. Verificar conexión con el servidor Directus
  if (!await verificarServidor()) {
    console.error('🔥 Proceso detenido. No se puede conectar al servidor Directus.');
    return; // Salir si no hay conexión
  }

  // 2. Obtener Token
  let currentToken;
  if (PROVIDED_TOKEN) {
      console.log('🔑 Usando token proporcionado.');
      currentToken = PROVIDED_TOKEN;
      // Verificar si el token proporcionado es válido antes de empezar
      if (!await verificarToken(currentToken)) {
          console.warn('⚠️ El token proporcionado parece inválido o expirado. Intentando iniciar sesión...');
          try {
              currentToken = await loginToDirectus();
          } catch (loginError) {
              console.error('🔥 Proceso detenido. No se pudo obtener un token válido.');
              return;
          }
      } else {
          console.log('✅ Token proporcionado verificado correctamente.');
      }
  } else {
      console.log('🔑 No se proporcionó token, intentando iniciar sesión...');
      try {
          currentToken = await loginToDirectus();
      } catch (loginError) {
          console.error('🔥 Proceso detenido. No se pudo obtener un token válido.');
          return;
      }
  }

  // 3. Verificar Permisos de Acceso a la Colección
  const acceso = await probarAcceso(currentToken);
  if (acceso !== 'authenticated') {
    console.error(`🔥 Proceso detenido. No se pudo verificar el acceso a la colección '${COLLECTION_NAME}'. Verifica el token y los permisos.`);
    return;
  }

  // 4. Leer y Parsear el Archivo JSON
  let antecedentes;
  try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    antecedentes = JSON.parse(rawData);
    // Asegurarse de que sea un array
    if (!Array.isArray(antecedentes)) {
        throw new Error('El archivo JSON no contiene un array de objetos.');
    }
    console.log(`📄 Leídos ${antecedentes.length} registros del archivo ${INPUT_FILE}`);
  } catch (error) {
    console.error(`❌ Error fatal al leer o parsear el archivo JSON "${INPUT_FILE}": ${error.message}`);
    return;
  }

  // 5. Procesar e Intentar Cargar Cada Item
  let resultados = {
    total: antecedentes.length,
    exitosos: 0,
    fallidos: 0,
    saltados: 0, // Items que no pasaron la validación inicial
    erroresDetallados: [] // Guardar detalles de errores
  };
  let erroresConsecutivos = 0;

  console.log(`⏳ Comenzando el procesamiento de ${resultados.total} items...`);

  for (let index = 0; index < antecedentes.length; index++) {
    const itemOriginal = antecedentes[index];
    const itemNumero = index + 1;

    if (DEBUG) console.log(`\n--- Procesando Item ${itemNumero}/${resultados.total} ---`);

    // Transformar el payload
    const payload = transformPayload(itemOriginal, index);

    // Si transformPayload devuelve null, significa que faltan campos requeridos
    if (!payload) {
        resultados.saltados++;
        resultados.fallidos++; // Contarlo como fallido general
        // El error específico ya se logueó dentro de transformPayload
        continue; // Pasar al siguiente item
    }

    if (SIMULATE) {
      console.log(`🔵 [SIMULACIÓN - Item ${itemNumero}] Payload preparado: ${JSON.stringify(payload)}`);
      resultados.exitosos++; // En simulación, contamos como éxito si la transformación fue ok
      erroresConsecutivos = 0; // Resetear contador en simulación exitosa
      continue; // Pasar al siguiente item en modo simulación
    }

    // Intentar crear el item en Directus
    try {
      if (DEBUG) console.log(`📡 Enviando payload para item ${itemNumero}: ${JSON.stringify(payload, null, 2)}`);
      await intentarCrearItem(payload, currentToken, index);
      console.log(`✅ [${itemNumero}/${resultados.total}] Cargado exitosamente: "${payload.Titulo}"`);
      resultados.exitosos++;
      erroresConsecutivos = 0; // Resetear contador en éxito

    } catch (error) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
      console.error(`❌ Error al cargar item ${itemNumero}: ${payload.Titulo} (Status: ${status || 'N/A'}) - ${errorMsg}`);
      resultados.fallidos++;
      erroresConsecutivos++;
      resultados.erroresDetallados.push({
        index: index,
        itemOriginal: itemOriginal, // Guardar el item original para referencia
        payloadEnviado: payload,
        error: errorMsg,
        status: status
      });

      // Manejo especial para errores de autenticación (401) durante el bucle
      if (status === 401) {
        console.warn('⚠️ Error de autenticación (401) detectado. Intentando renovar token...');
        try {
          currentToken = await loginToDirectus();
          console.log('✅ Token renovado. Reintentando el item actual...');
          index--; // Decrementar el índice para reintentar el mismo item con el nuevo token
          erroresConsecutivos = 0; // Resetear contador después de renovar token
          continue; // Saltar al siguiente ciclo para reintentar
        } catch (loginError) {
          console.error('🔥 Fallo crítico al intentar renovar el token. Deteniendo proceso.');
          break; // Salir del bucle si no se puede renovar el token
        }
      }

      // Detener si hay demasiados errores consecutivos (que no sean 401 manejado arriba)
      if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`🚨 Demasiados errores consecutivos (${erroresConsecutivos}). Deteniendo el proceso para evitar problemas.`);
        break; // Salir del bucle
      }

      // Pausa breve después de un error (adicional al backoff de reintento)
      await wait(1000);

    } // Fin catch

    // Pausa breve entre items para no saturar (incluso si hubo error y no se reintentó)
    if (index < antecedentes.length - 1) { // No esperar después del último item
       await wait(500); // Pausa de 500ms entre requests
    }

  } // Fin for loop

  // 6. Guardar Resultados Fallidos (si hubo)
  if (resultados.erroresDetallados.length > 0) {
    const errorFilePath = './resultados_fallidos.json';
    try {
        fs.writeFileSync(errorFilePath, JSON.stringify(resultados.erroresDetallados, null, 2));
        console.log(`📄 ${resultados.erroresDetallados.length} errores detallados guardados en: ${errorFilePath}`);
    } catch (writeError) {
        console.error(`❌ No se pudo guardar el archivo de errores: ${writeError.message}`);
    }
  } else {
      console.log('👍 No se registraron errores detallados.');
  }

  // 7. Mostrar Resumen Final
  console.log(`\n🏁 Proceso Finalizado 🏁`);
  console.log(`
  📊 Resumen General:
  =========================================
  Total de Items en Archivo: ${resultados.total}
  ─────────────────────────────────────────
  ✅ Exitosos (Cargados/Simulados): ${resultados.exitosos}
  ❌ Fallidos (Errores/Saltados):   ${resultados.fallidos}
     (${resultados.saltados} saltados por datos faltantes)
     (${resultados.erroresDetallados.length} errores de API registrados)
  =========================================
  `);

  // Devolver los resultados por si se usa programáticamente
  return resultados;
}

// --- Ejecución ---
cargarAntecedentesADirectus().catch(error => {
  // Captura errores no manejados en la función principal (ej. fallo inicial de conexión, lectura de archivo)
  console.error('\n🔥🔥 Error Inesperado Fuera del Bucle Principal 🔥🔥');
  console.error(error.message);
  // Opcional: loguear el stack trace completo si DEBUG está activo
  if (DEBUG) console.error(error);
});