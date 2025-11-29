import axios from 'axios';
import fs from 'fs';
import path from 'path'; // Necesario para construir rutas de archivo de forma segura
import FormData from 'form-data'; // Necesario para subir archivos

// --- Configuraciones ---
const INPUT_FILE = './antev3.json'; // JSON principal de antecedentes
const IMAGE_MAPPING_FILE = './datos_imagenes_para_directus_20250414_134014.json'; // JSON que mapea títulos a imágenes
const IMAGE_BASE_FOLDER = './imagenes-realistas-v4'; // Carpeta donde están las imágenes .png/.jpg etc.
const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'adminpassword';
const PROVIDED_TOKEN = "0NE0iF_Ad830OVYoQCwJjmmnTCuenxBh"; // Puede estar vacío para forzar login
const SIMULATE = false; // Poner en true para probar sin escribir en Directus (tampoco subirá imágenes)
const UPLOAD_IMAGES = true; // Poner en false para desactivar la subida de imágenes
const MAX_RETRIES = 3;
const DEBUG = true;
const MAX_CONSECUTIVE_ERRORS = 5;
const RETRY_DELAY = 2000; // ms
const COLLECTION_NAME = 'Antecedentes';
const REQUIRED_FIELDS = ['Titulo', 'Fecha'];
const MAX_DATE = new Date('2999-12-31');
const MIN_DATE = new Date('1900-01-01');
const ENDPOINTS = {
  items: `/items/${COLLECTION_NAME}`,
  files: '/files' // Endpoint para subir archivos
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
      console.log('🔍 Debug - Verificación de token exitosa:', { status: response.status, userId: response.data.data.id });
    }
    return true;
  } catch (error) {
    if (DEBUG) {
      console.error('🔍 Debug - Error de verificación de token:', { status: error.response?.status, message: error.response?.data?.errors || error.message });
    }
    return false;
  }
}

async function probarAcceso(token) {
  try {
    if (DEBUG) console.log(`🔍 Probando acceso a la colección ${COLLECTION_NAME}...`);
    const response = await axios.get(
      `${DIRECTUS_URL}${ENDPOINTS.items}?limit=1&fields=id`,
      {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
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

// normalizarFecha y normalizarPresupuesto (sin cambios, las incluyo por completitud)
function normalizarFecha(fechaOriginal) {
  const fallbackDate = new Date().toISOString().split('T')[0];
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
  if (!/^\d+$/.test(day) || !/^\d+$/.test(month) || !/^\d+$/.test(year)) {
      console.warn(`⚠️ Partes de la fecha no son numéricas: "${fechaOriginal}". Usando fecha actual.`);
      return fallbackDate;
  }
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const monthStr = String(monthNum).padStart(2, '0');
  const dayStr = String(dayNum).padStart(2, '0');
  const fechaFormateada = `${yearNum}-${monthStr}-${dayStr}`;
  try {
    const fechaObj = new Date(fechaFormateada + 'T00:00:00Z');
    if (isNaN(fechaObj.getTime()) || fechaObj < MIN_DATE || fechaObj > MAX_DATE) {
      console.warn(`⚠️ Fecha inválida o fuera de rango [${MIN_DATE.toISOString().split('T')[0]} - ${MAX_DATE.toISOString().split('T')[0]}]: "${fechaOriginal}". Usando fecha actual.`);
      return fallbackDate;
    }
    return fechaFormateada;
  } catch (e) {
    console.warn(`⚠️ Error procesando fecha "${fechaOriginal}": ${e.message}. Usando fecha actual.`);
    return fallbackDate;
  }
}

function normalizarPresupuesto(presupuestoStr) {
    if (!presupuestoStr || typeof presupuestoStr !== 'string') return null;
    try {
        let limpio = presupuestoStr.replace(/USD/gi, '').trim();
        limpio = limpio.replace(/\./g, '');
        limpio = limpio.replace(/,/g, '.');
        const valor = parseFloat(limpio);
        return isNaN(valor) ? null : valor;
    } catch (error) {
        console.warn(`⚠️ No se pudo convertir el presupuesto "${presupuestoStr}" a número: ${error.message}`);
        return null;
    }
}

/**
 * Transforma el objeto JSON de origen al formato esperado por Directus 'Antecedentes'.
 * Incluye el ID de la imagen si se proporciona.
 * @param {object} antecedente - El objeto leído del archivo JSON principal.
 * @param {number} index - El índice del item actual.
 * @param {string | null} uploadedImageId - El ID del archivo de imagen subido a Directus (o null).
 * @returns {object | null} El payload listo para enviar a Directus, o null si faltan campos requeridos.
 */
function transformPayload(antecedente, index, uploadedImageId = null) {
  for (const field of REQUIRED_FIELDS) {
      if (!antecedente[field]) {
          console.error(`❌ Error en item ${index + 1}: Falta el campo requerido del origen "${field}". Saltando item.`);
          console.error(`   Item problemático: ${JSON.stringify(antecedente)}`);
          return null;
      }
  }

  const payload = {
    status: antecedente.status || 'published',
    Titulo: antecedente.Titulo ? String(antecedente.Titulo).trim() : 'Sin título',
    Descripcion: antecedente.Descripcion ? String(antecedente.Descripcion).trim() : null,
    // --- Campo Imagen MODIFICADO ---
    Imagen: uploadedImageId, // Asigna el ID de la imagen subida (será null si no hubo o falló)
    // -------------------------------
    Archivo: antecedente.Archivo || null, // Asumiendo que 'Archivo' es otro campo file, o null
    Fecha: normalizarFecha(antecedente.Fecha),
    Cliente: antecedente.Cliente ? String(antecedente.Cliente).trim() : null,
    Unidad_de_negocio: antecedente.Unidad_de_negocio ? String(antecedente.Unidad_de_negocio).trim() : null,
    Presupuesto: normalizarPresupuesto(antecedente.Presupuesto),
    Area: antecedente.Area ? String(antecedente.Area).trim() : null,
    // Palabras_clave: (Descomentar y adaptar si tienes un campo tags/keywords en Directus)
    // keywords: antecedente.Palabras_clave || null,
    // tags: antecedente.Palabras_clave ? antecedente.Palabras_clave.split(',').map(tag => tag.trim()).filter(Boolean) : [],
  };

  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  return payload;
}

// --- Funciones de Subida y Creación ---

/**
 * Sube un archivo de imagen a Directus.
 * @param {string} imagePath - Ruta completa al archivo de imagen local.
 * @param {string} token - Token de autenticación de Directus.
 * @param {string} itemTitle - Título del antecedente asociado (para logging).
 * @returns {Promise<string | null>} El ID del archivo subido en Directus, o null si falla.
 */
async function uploadImageToDirectus(imagePath, token, itemTitle) {
    if (!fs.existsSync(imagePath)) {
        console.warn(`🖼️ [Item: "${itemTitle}"] Imagen no encontrada en la ruta: ${imagePath}`);
        return null; // Indica que el archivo no existe localmente
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    // Opcional: Puedes añadir metadatos al archivo en Directus
    form.append('title', `Imagen para ${itemTitle}`);
    // form.append('folder', 'UUID-DE-CARPETA-EN-DIRECTUS'); // Si quieres organizar en carpetas

    try {
        console.log(`⬆️ [Item: "${itemTitle}"] Intentando subir imagen: ${path.basename(imagePath)}`);
        const response = await axios.post(
            `${DIRECTUS_URL}${ENDPOINTS.files}`,
            form,
            {
                headers: {
                    ...form.getHeaders(), // Esencial para multipart/form-data
                    'Authorization': `Bearer ${token}`,
                },
                maxContentLength: Infinity, // Permitir archivos grandes si es necesario
                maxBodyLength: Infinity
            }
        );
        const fileId = response.data?.data?.id;
        if (fileId) {
            console.log(`✅ [Item: "${itemTitle}"] Imagen subida correctamente. ID: ${fileId}`);
            return fileId;
        } else {
            console.warn(`⚠️ [Item: "${itemTitle}"] Imagen subida, pero no se recibió ID en la respuesta.`);
            if (DEBUG) console.log('🔍 Debug - Respuesta subida imagen:', response.data);
            return null;
        }
    } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`❌ [Item: "${itemTitle}"] Error al subir imagen (Path: ${imagePath}, Status: ${status || 'N/A'}): ${errorMsg}`);
        if (DEBUG && error.response?.data) console.error('🔍 Debug - Detalles error subida imagen:', error.response.data);

        // Si el error es de autenticación (401), relanzarlo para que el bucle principal lo maneje
        if (status === 401) {
            throw error;
        }
        // Si el error es 403 (prohibido), probablemente falten permisos de subida
        if (status === 403) {
            console.error(`   -> Verifica que el rol asociado al token tenga permisos para crear en 'directus_files'.`);
        }
        return null; // Indica fallo en la subida
    }
}


// intentarCrearItem (sin cambios significativos, usa el payload ya transformado)
async function intentarCrearItem(payload, token, itemIndex) {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      const response = await axios.post(
        `${DIRECTUS_URL}${ENDPOINTS.items}`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (DEBUG) console.log(`🔍 Debug - Respuesta creación item ${itemIndex + 1}: Status ${response.status}`);
      return response;
    } catch (error) {
      attempts++;
      const status = error.response?.status;
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
      console.warn(`⚠️ Intento ${attempts}/${MAX_RETRIES} fallido para item ${itemIndex + 1} (Status: ${status || 'N/A'}): ${errorMsg}`);
      if (status === 401 || status === 403) {
          console.error(`❌ Error ${status} en item ${itemIndex + 1}. No se reintentará con este token.`);
          throw error;
      }
      if (status === 400) {
          console.error(`❌ Error de validación (400) en item ${itemIndex + 1}. Payload: ${JSON.stringify(payload)}`);
          throw error;
      }
      if (attempts >= MAX_RETRIES) {
        console.error(`❌ Máximos reintentos (${MAX_RETRIES}) alcanzados para item ${itemIndex + 1}.`);
        throw error;
      }
      const delay = RETRY_DELAY * Math.pow(2, attempts -1);
      console.log(`⏱️ Esperando ${delay}ms antes del reintento ${attempts + 1} para item ${itemIndex + 1}...`);
      await wait(delay);
    }
  }
}

// Función wait (sin cambios)
const wait = (delay) => new Promise(resolve => setTimeout(resolve, delay));

// verificarServidor (sin cambios)
async function verificarServidor() {
  try {
    console.log(`🔍 Verificando conexión con Directus en ${DIRECTUS_URL}...`);
    const response = await axios.get(`${DIRECTUS_URL}/server/ping`, { timeout: 5000 });
    if (response.data === 'pong') {
        console.log('✅ Conexión con el servidor Directus establecida.');
        return true;
    } else {
        console.warn('⚠️ El servidor Directus respondió, pero no con "pong".');
         try {
            await axios.get(`${DIRECTUS_URL}/server/info`, { timeout: 5000 });
            console.log('✅ Información del servidor obtenida. Conexión OK.');
            return true;
        } catch (infoError) {
            console.error(`❌ No se pudo obtener información del servidor: ${infoError.message}`);
            return false;
        }
    }
  } catch (error) {
    console.error(`❌ Error fatal al conectar con Directus en ${DIRECTUS_URL}: ${error.message}`);
    if (error.code === 'ECONNREFUSED') console.error(`   Asegúrate de que Directus esté corriendo en ${DIRECTUS_PORT}.`);
    else if (error.code === 'ETIMEDOUT') console.error(`   Timeout. Verifica red o carga del servidor.`);
    return false;
  }
}

// --- Función Principal (MODIFICADA para cargar mapeo y manejar subida de imagen) ---

async function cargarAntecedentesADirectus() {
  console.log('🚀 Iniciando proceso de carga de Antecedentes...');

  if (!await verificarServidor()) {
    console.error('🔥 Proceso detenido. No se puede conectar al servidor Directus.');
    return;
  }

  // --- Obtener Token (sin cambios) ---
  let currentToken;
  if (PROVIDED_TOKEN) {
      console.log('🔑 Usando token proporcionado.');
      currentToken = PROVIDED_TOKEN;
      if (!await verificarToken(currentToken)) {
          console.warn('⚠️ El token proporcionado parece inválido/expirado. Intentando iniciar sesión...');
          try { currentToken = await loginToDirectus(); } catch (loginError) {
              console.error('🔥 Proceso detenido. No se pudo obtener un token válido.'); return;
          }
      } else { console.log('✅ Token proporcionado verificado.'); }
  } else {
      console.log('🔑 No se proporcionó token, intentando iniciar sesión...');
      try { currentToken = await loginToDirectus(); } catch (loginError) {
          console.error('🔥 Proceso detenido. No se pudo obtener un token.'); return;
      }
  }

  // --- Verificar Acceso (sin cambios) ---
  const acceso = await probarAcceso(currentToken);
  if (acceso !== 'authenticated') {
    console.error(`🔥 Proceso detenido. No se pudo verificar el acceso a la colección '${COLLECTION_NAME}'.`);
    return;
  }

  // --- Leer Archivo Principal de Antecedentes (sin cambios) ---
  let antecedentes;
  try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    antecedentes = JSON.parse(rawData);
    if (!Array.isArray(antecedentes)) throw new Error('El archivo JSON principal no contiene un array.');
    console.log(`📄 Leídos ${antecedentes.length} registros del archivo ${INPUT_FILE}`);
  } catch (error) {
    console.error(`❌ Error fatal al leer/parsear "${INPUT_FILE}": ${error.message}`);
    return;
  }

  // --- Leer y Procesar Archivo de Mapeo de Imágenes ---
  let imageMap = new Map(); // Usaremos un Map para búsqueda rápida por título
  if (UPLOAD_IMAGES) { // Solo leer si la subida de imágenes está activa
      try {
          console.log(`🗺️ Leyendo archivo de mapeo de imágenes: ${IMAGE_MAPPING_FILE}...`);
          const mappingData = fs.readFileSync(IMAGE_MAPPING_FILE, 'utf-8');
          const imageMappings = JSON.parse(mappingData);
          if (!Array.isArray(imageMappings)) {
              throw new Error('El archivo de mapeo de imágenes no contiene un array.');
          }
          let count = 0;
          imageMappings.forEach(mapping => {
              // Usar 'titulo_original' como clave. Limpiar espacios extra.
              if (mapping.titulo_original && mapping.nombre_archivo_generado) {
                  const key = String(mapping.titulo_original).trim();
                  // Extraer solo el nombre del archivo si viene con ruta
                  const filename = path.basename(String(mapping.nombre_archivo_generado));
                  if (key && filename) {
                    imageMap.set(key, filename);
                    count++;
                  } else {
                     console.warn(`⚠️ Mapeo inválido omitido: ${JSON.stringify(mapping)}`);
                  }
              }
          });
          console.log(`✅ Mapeo de imágenes procesado. ${count} entradas válidas encontradas.`);
      } catch (error) {
          console.error(`❌ Error al leer/procesar el archivo de mapeo de imágenes "${IMAGE_MAPPING_FILE}": ${error.message}`);
          console.warn("   -> La carga continuará sin intentar subir imágenes.");
          // No detenemos el proceso, simplemente no subirá imágenes si el mapeo falla.
          // Si el mapeo es crítico, podrías poner un 'return;' aquí.
          imageMap.clear(); // Asegurar que el mapa esté vacío si hubo error
      }
  } else {
      console.log("ℹ️ La subida de imágenes está desactivada (UPLOAD_IMAGES = false).");
  }


  // --- Procesar e Intentar Cargar Cada Item ---
  let resultados = {
    total: antecedentes.length, exitosos: 0, fallidos: 0, saltados: 0,
    erroresDetallados: []
  };
  let erroresConsecutivos = 0;
  console.log(`⏳ Comenzando el procesamiento de ${resultados.total} items...`);

  for (let index = 0; index < antecedentes.length; index++) {
    const itemOriginal = antecedentes[index];
    const itemNumero = index + 1;
    const itemTitulo = itemOriginal.Titulo ? String(itemOriginal.Titulo).trim() : '';

    if (DEBUG) console.log(`\n--- Procesando Item ${itemNumero}/${resultados.total} (${itemTitulo || 'Sin Título'}) ---`);

    // --- Lógica de Subida de Imagen ---
    let uploadedImageId = null;
    if (UPLOAD_IMAGES && itemTitulo && imageMap.size > 0) {
        const imageName = imageMap.get(itemTitulo); // Busca la imagen por título en el mapa
        if (imageName) {
            const imagePath = path.join(IMAGE_BASE_FOLDER, imageName); // Construye la ruta completa
            if (DEBUG) console.log(`🖼️ Buscando imagen mapeada: ${imageName} en ${IMAGE_BASE_FOLDER}`);

            if (!SIMULATE) { // Solo intentar subir si no estamos simulando
                 try {
                     uploadedImageId = await uploadImageToDirectus(imagePath, currentToken, itemTitulo);
                     // Si uploadImageToDirectus lanza error 401, será capturado más abajo
                 } catch (uploadError) {
                     if (uploadError.response?.status === 401) {
                         console.warn('⚠️ Error de autenticación (401) durante subida de imagen. Intentando renovar token...');
                         try {
                             currentToken = await loginToDirectus();
                             console.log('✅ Token renovado. Reintentando el item actual (incluyendo subida de imagen)...');
                             index--; // Re-procesar este item
                             erroresConsecutivos = 0;
                             continue; // Saltar al siguiente ciclo del for
                         } catch (loginError) {
                             console.error('🔥 Fallo crítico al renovar token tras error de subida. Deteniendo.');
                             resultados.erroresDetallados.push({ index, itemOriginal, error: 'Fallo renovación token post-upload', status: null });
                             resultados.fallidos++;
                             break; // Salir del bucle for
                         }
                     } else {
                         // Otro error durante la subida (ya logueado dentro de uploadImageToDirectus)
                         console.error(`💥 Error subiendo imagen para item ${itemNumero}, se continuará sin imagen asociada.`);
                         // Guardamos el error específico de la imagen también? Podría ser útil.
                         resultados.erroresDetallados.push({ index, itemOriginal, error: `Fallo subida imagen: ${imageName}`, status: uploadError.response?.status || null });
                         // NO incrementamos fallidos aquí, lo hará el intento de crear item si falla
                     }
                 } // Fin catch uploadError
            } else {
                 console.log(`🔵 [SIMULACIÓN - Item ${itemNumero}] Se intentaría subir la imagen: ${imagePath}`);
                 // En simulación, podríamos asignar un ID falso para probar el payload
                 // uploadedImageId = 'simulated-image-id';
            }

        } else {
             if (DEBUG) console.log(`🤷 [Item ${itemNumero}] No se encontró mapeo de imagen para el título: "${itemTitulo}"`);
        }
    } else if (UPLOAD_IMAGES && !itemTitulo) {
        console.warn(`⚠️ [Item ${itemNumero}] No tiene título, no se puede buscar mapeo de imagen.`);
    }
    // --- Fin Lógica de Subida de Imagen ---


    // Transformar el payload (pasando el ID de imagen obtenido, o null)
    const payload = transformPayload(itemOriginal, index, uploadedImageId);

    if (!payload) {
        resultados.saltados++;
        resultados.fallidos++;
        resultados.erroresDetallados.push({ index, itemOriginal, error: 'Payload inválido (faltan campos req.)', status: null });
        erroresConsecutivos++; // Contar como error consecutivo
        if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) {
            console.error(`🚨 Demasiados errores consecutivos (${erroresConsecutivos}). Deteniendo.`);
            break;
        }
        continue; // Pasar al siguiente item
    }

    if (SIMULATE) {
      console.log(`🔵 [SIMULACIÓN - Item ${itemNumero}] Payload preparado: ${JSON.stringify(payload)}`);
      resultados.exitosos++;
      erroresConsecutivos = 0;
      continue;
    }

    // Intentar crear el item en Directus
    try {
      if (DEBUG) console.log(`📡 Enviando payload para item ${itemNumero}: ${JSON.stringify(payload, null, 2)}`);
      await intentarCrearItem(payload, currentToken, index);
      console.log(`✅ [${itemNumero}/${resultados.total}] Cargado: "${payload.Titulo}" ${uploadedImageId ? '(con imagen ID: ' + uploadedImageId + ')' : '(sin imagen asociada)'}`);
      resultados.exitosos++;
      erroresConsecutivos = 0;

    } catch (error) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
      console.error(`❌ Error al cargar item ${itemNumero}: ${payload.Titulo} (Status: ${status || 'N/A'}) - ${errorMsg}`);
      resultados.fallidos++;
      erroresConsecutivos++;
      resultados.erroresDetallados.push({ index, itemOriginal, payloadEnviado: payload, error: errorMsg, status });

      if (status === 401) { // Error de autenticación creando el item
        console.warn('⚠️ Error de autenticación (401) al crear item. Intentando renovar token...');
        try {
          currentToken = await loginToDirectus();
          console.log('✅ Token renovado. Reintentando el item actual...');
          index--; // Reintentar este item
          erroresConsecutivos = 0;
          continue;
        } catch (loginError) {
          console.error('🔥 Fallo crítico al renovar token. Deteniendo.');
          break;
        }
      }

      if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`🚨 Demasiados errores consecutivos (${erroresConsecutivos}). Deteniendo.`);
        break;
      }
      await wait(1000); // Pausa tras error (adicional al backoff)
    } // Fin catch crear item

    // Pausa breve entre items
    if (!SIMULATE && index < antecedentes.length - 1) {
       await wait(300); // Pausa de 300ms (ajustar si es necesario)
    }

  } // Fin for loop

  // --- Guardar Resultados Fallidos (sin cambios) ---
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

  // --- Mostrar Resumen Final (sin cambios) ---
   console.log(`\n🏁 Proceso Finalizado 🏁`);
   console.log(`
   📊 Resumen General:
   =========================================
   Total de Items en Archivo: ${resultados.total}
   ─────────────────────────────────────────
   ✅ Exitosos (Cargados/Simulados): ${resultados.exitosos}
   ❌ Fallidos (Errores/Saltados):   ${resultados.fallidos}
      (${resultados.saltados} saltados por datos faltantes)
      (${resultados.erroresDetallados.length} errores API/subida registrados)
   =========================================
   `);

  return resultados;
}

// --- Ejecución (sin cambios) ---
cargarAntecedentesADirectus().catch(error => {
  console.error('\n🔥🔥 Error Inesperado Fuera del Bucle Principal 🔥🔥');
  console.error(error.message);
  if (DEBUG) console.error(error);
});