import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

// --- Configuraciones ---
const INPUT_FILE = './antev3.json'; // JSON principal (SIN 'numero', SIN 'Servicio')
const IMAGE_MAPPING_FILE = './datos_imagenes_para_directus_20250415_181330.json'; // JSON que mapea numero a imágenes
const IMAGE_BASE_FOLDER = './imagenes_antecedentes_versionproduccion'; // Carpeta donde están las imágenes .png
// --- MODIFICADO --- Apunta al campo 'Imagen' (Single File / M2O)
const IMAGES_FIELD_NAME = 'Imagen';
// -------------------------------------------------------------
const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'adminpassword';
const PROVIDED_TOKEN = "0NE0iF_Ad830OVYoQCwJjmmnTCuenxBh"; // Asegúrate que este token sea válido y tenga permisos
const SIMULATE = false;
const UPLOAD_IMAGES = true;
const MAX_RETRIES = 3;
const DEBUG = true;
const MAX_CONSECUTIVE_ERRORS = 5;
const RETRY_DELAY = 2000; // ms
const COLLECTION_NAME = 'Antecedentes';
const REQUIRED_FIELDS = ['Titulo', 'Fecha', 'Cliente']; // Campos requeridos del JSON de entrada
const MAX_DATE = new Date('2999-12-31');
const MIN_DATE = new Date('1900-01-01');
const ENDPOINTS = {
    items: `/items/${COLLECTION_NAME}`,
    files: '/files'
};

// --- Funciones de Autenticación y Verificación ---
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
            // --- MODIFICADO --- Actualizar mensaje de error potencial
            if (error.response.status === 404) errMsg += ` (Verifica si la colección '${COLLECTION_NAME}' existe y el campo '${IMAGES_FIELD_NAME}' está configurado como relación File/M2O)`;
            // -------------------------------------------------------
        } else {
            errMsg = error.message;
        }
        console.error(`❌ Error al probar acceso a la colección: ${errMsg}`);
        if (DEBUG) console.error('🔍 Debug - Detalles del error de acceso:', error.response?.data || error);
        return 'none';
    }
}


// --- Funciones de Procesamiento de Datos ---

function normalizarFecha(fechaOriginal) {
    const fallbackDate = new Date().toISOString().split('T')[0];
    if (!fechaOriginal || typeof fechaOriginal !== 'string') {
        return fallbackDate;
    }
    const parts = fechaOriginal.trim().split('-');
    if (parts.length !== 3) {
        return fallbackDate;
    }
    const [day, month, year] = parts;
    if (!/^\d+$/.test(day) || !/^\d+$/.test(month) || !/^\d+$/.test(year)) {
        return fallbackDate;
    }
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    if (yearNum < 1900 || yearNum > 2999 || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        return fallbackDate;
    }

    const monthStr = String(monthNum).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const fechaFormateada = `${yearNum}-${monthStr}-${dayStr}`;
    try {
        const fechaObj = new Date(fechaFormateada + 'T00:00:00Z');
        if (isNaN(fechaObj.getTime()) || fechaObj.getUTCFullYear() !== yearNum || fechaObj.getUTCMonth() !== monthNum - 1 || fechaObj.getUTCDate() !== dayNum) {
           return fallbackDate;
        }
        if (fechaObj < MIN_DATE || fechaObj > MAX_DATE) {
          return fallbackDate;
        }
        return fechaFormateada; // Formato YYYY-MM-DD
    } catch (e) {
        return fallbackDate;
    }
}

function normalizarPresupuesto(presupuestoStr) {
    if (!presupuestoStr || typeof presupuestoStr !== 'string') return null;
    try {
        let limpio = presupuestoStr.replace(/[$. ARSUSD]/gi, '').trim();
        limpio = limpio.replace(/\./g, '');
        limpio = limpio.replace(/,/g, '.');
        const valor = parseFloat(limpio);
        return isNaN(valor) ? null : valor;
    } catch (error) {
        return null;
    }
}


/**
 * --- MODIFICADO ---
 * Transforma el objeto JSON de origen al formato esperado por Directus 'Antecedentes'.
 * Asigna el ID de la imagen principal al campo M2O (Single File) especificado.
 * @param {object} antecedente - El objeto leído del archivo JSON principal.
 * @param {number} itemIndexForLog - El índice del item actual (1-based) para logging.
 * @param {string | null} primaryImageId - El ID del archivo de la imagen principal subida (o null).
 * @returns {object | null} El payload listo para enviar a Directus, o null si faltan campos requeridos.
 */
function transformPayload(antecedente, itemIndexForLog, primaryImageId = null) {
  // Verificar campos requeridos del JSON de entrada
  for (const field of REQUIRED_FIELDS) {
      const value = antecedente[field];
      if (value === undefined || value === null || value === '') {
          console.error(`❌ Error en item índice ${itemIndexForLog}: Falta el campo requerido del origen "${field}". Saltando item.`);
          console.error(`   Item problemático: ${JSON.stringify(antecedente)}`);
          return null;
      }
  }

    // ¡ADVERTENCIA! El campo 'Servicio' NO está presente en el payload.
    // Si es requerido por Directus, la creación del item fallará.
    // También el campo 'Palabras_clave' existe en Directus pero no se está enviando.
    const payload = {
      status: antecedente.status || 'published',
      Titulo: antecedente.Titulo ? String(antecedente.Titulo).trim() : 'Sin título',
      Descripcion: antecedente.Descripcion ? String(antecedente.Descripcion).trim() : null,
      // --- CORREGIDO para M2O (Single File) ---
      // Asigna el ID directamente como string, o null si no hay imagen
      [IMAGES_FIELD_NAME]: primaryImageId,
      // ---------------------------------------
      Archivo: antecedente.Archivo || null, // Asumiendo que 'Archivo' es otro campo File o null
      Fecha: normalizarFecha(antecedente.Fecha),
      Cliente: antecedente.Cliente ? String(antecedente.Cliente).trim() : null,
      // Servicio: NO SE INCLUYE
      Unidad_de_negocio: antecedente.Unidad_de_negocio ? String(antecedente.Unidad_de_negocio).trim() : null,
      Presupuesto: normalizarPresupuesto(antecedente.Presupuesto),
      Area: antecedente.Area ? String(antecedente.Area).trim() : null,
      // Palabras_clave: NO SE INCLUYE (pero existe en Directus)
      // Imagenes: NO SE INCLUYE (campo M2M que existe en Directus)
  };

  // Limpiar undefineds
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  return payload;
}



// --- Funciones de Subida y Creación ---

/**
 * Sube un archivo de imagen a Directus.
 * @param {string} imagePath - Ruta completa al archivo de imagen local.
 * @param {string} token - Token de autenticación de Directus.
 * @param {string} itemTitle - Título del antecedente asociado (para logging).
 * @param {number} itemIndexForLog - Índice del antecedente asociado (1-based, para logging).
 * @returns {Promise<string | null>} El ID del archivo subido en Directus, o null si falla.
 */
async function uploadImageToDirectus(imagePath, token, itemTitle, itemIndexForLog) {
    const logPrefix = `[Item Index ${itemIndexForLog} "${itemTitle}"]`;
    if (!fs.existsSync(imagePath)) {
        console.warn(`🖼️ ${logPrefix} Imagen no encontrada en la ruta: ${imagePath}`);
        return null;
    }

    const imageName = path.basename(imagePath);
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('title', `Imagen para Antecedente Índice ${itemIndexForLog} (${itemTitle}) - ${imageName}`);

    try {
        console.log(`⬆️ ${logPrefix} Intentando subir imagen: ${imageName}`);
        const response = await axios.post(
            `${DIRECTUS_URL}${ENDPOINTS.files}`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${token}`,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        const fileId = response.data?.data?.id;
        if (fileId) {
            console.log(`✅ ${logPrefix} Imagen ${imageName} subida correctamente. ID: ${fileId}`);
            return fileId;
        } else {
            console.warn(`⚠️ ${logPrefix} Imagen ${imageName} subida, pero no se recibió ID.`);
            if (DEBUG) console.log('🔍 Debug - Respuesta subida imagen:', response.data);
            return null;
        }
    } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`❌ ${logPrefix} Error al subir imagen (Path: ${imagePath}, Status: ${status || 'N/A'}): ${errorMsg}`);
        if (DEBUG && error.response?.data) console.error('🔍 Debug - Detalles error subida imagen:', error.response.data);

        if (status === 401) {
            throw error; // Relanzar para manejo de token
        }
        if (status === 403) {
            console.error(`   -> Verifica que el rol tenga permisos para crear en 'directus_files'.`);
        }
        return null;
    }
}

// intentarCrearItem
async function intentarCrearItem(payload, token, itemIndexForLog, itemTitle) {
    let attempts = 0;
    const logPrefix = `Item Index ${itemIndexForLog} (${itemTitle})`;

    while (attempts < MAX_RETRIES) {
        try {
            const response = await axios.post(
                `${DIRECTUS_URL}${ENDPOINTS.items}`,
                payload,
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            if (response.status === 200 || response.status === 204) {
                 if (DEBUG) console.log(`🔍 Debug - Respuesta creación ${logPrefix}: Status ${response.status}`);
                 return response;
            } else {
                 console.warn(`⚠️ ${logPrefix} - Respuesta inesperada al crear item. Status: ${response.status}. Data: ${JSON.stringify(response.data)}`);
                 throw new Error(`Respuesta inesperada del servidor: ${response.status}`);
            }

        } catch (error) {
            attempts++;
            const status = error.response?.status;
            let errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
             if (status === 400) {
                 // Añadir más contexto al error 400
                 errorMsg += ` (Verifica que todos los campos requeridos por la colección '${COLLECTION_NAME}' en Directus estén presentes en el payload y sean válidos, y que el formato del campo '${IMAGES_FIELD_NAME}' sea correcto para un campo File/M2O. Payload: ${JSON.stringify(payload)})`;
                 if (JSON.stringify(payload).indexOf('"Servicio":') === -1) {
                    errorMsg += " - Posiblemente falta el campo 'Servicio' requerido por Directus.";
                 }
                 console.error(`❌ Error de validación (400) en ${logPrefix}. ${errorMsg}`);
                 console.error(`   Error Detallado API: ${JSON.stringify(error.response?.data?.errors)}`);
                 throw error; // No reintentar errores de validación
             }

            if (status === 401 || status === 403) {
                console.error(`❌ Error ${status} en ${logPrefix}. No se reintentará con este token.`);
                throw error;
            }

            console.warn(`⚠️ Intento ${attempts}/${MAX_RETRIES} fallido para ${logPrefix} (Status: ${status || 'N/A'}): ${errorMsg}`);

            if (attempts >= MAX_RETRIES) {
                console.error(`❌ Máximos reintentos (${MAX_RETRIES}) alcanzados para ${logPrefix}.`);
                throw error;
            }
            const delay = RETRY_DELAY * Math.pow(2, attempts - 1);
            console.log(`⏱️ Esperando ${delay}ms antes del reintento ${attempts + 1} para ${logPrefix}...`);
            await wait(delay);
        }
    }
}


// Función wait
const wait = (delay) => new Promise(resolve => setTimeout(resolve, delay));

// verificarServidor
async function verificarServidor() {
     try {
        console.log(`🔍 Verificando conexión con Directus en ${DIRECTUS_URL}...`);
        const response = await axios.get(`${DIRECTUS_URL}/server/ping`, { timeout: 5000 });
        if (response.data === 'pong') {
            console.log('✅ Conexión con el servidor Directus establecida.');
            return true;
        } else {
            console.warn('⚠️ El servidor Directus respondió, pero no con "pong". Intentando obtener info...');
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


// --- Función Principal ---

async function cargarAntecedentesADirectus() {
  console.log('🚀 Iniciando proceso de carga de Antecedentes...');
  console.warn("⚠️ ADVERTENCIA: Vinculando UNA imagen por item basado en el ORDEN. Asegúrate que el orden en 'antev3.json' coincide con el orden numérico en el archivo de mapeo.");

  if (!await verificarServidor()) { return; }

    // --- Obtener Token ---
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


    // --- Verificar Acceso ---
    if (await probarAcceso(currentToken) !== 'authenticated') {
        console.error(`🔥 Proceso detenido. No se pudo verificar el acceso a la colección '${COLLECTION_NAME}'.`);
        return;
    }

    // --- Leer Archivo Principal de Antecedentes ---
    let antecedentes;
    try {
        const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
        antecedentes = JSON.parse(rawData);
        if (!Array.isArray(antecedentes)) throw new Error(`El archivo JSON principal (${INPUT_FILE}) no contiene un array.`);
        console.log(`📄 Leídos ${antecedentes.length} registros del archivo ${INPUT_FILE}`);
    } catch (error) {
        console.error(`❌ Error fatal al leer/parsear "${INPUT_FILE}": ${error.message}`);
        return;
    }

    // --- Leer y Procesar Archivo de Mapeo de Imágenes (basado en 'numero') ---
    let imageMapByNumero = new Map();
    if (UPLOAD_IMAGES) {
        try {
            console.log(`🗺️ Leyendo archivo de mapeo de imágenes: ${IMAGE_MAPPING_FILE}...`);
            const mappingData = fs.readFileSync(IMAGE_MAPPING_FILE, 'utf-8');
            const imageMappings = JSON.parse(mappingData);
            if (!Array.isArray(imageMappings)) throw new Error(`El archivo de mapeo (${IMAGE_MAPPING_FILE}) no es un array.`);

            let count = 0;
            let invalidMappings = 0;
            imageMappings.forEach((mapping, mapIndex) => {
                const numero = mapping.numero;
                const fullPath = mapping.nombre_archivo_generado;

                if (numero !== undefined && numero !== null && !isNaN(Number(numero)) && fullPath && typeof fullPath === 'string') {
                    const numeroStr = String(numero);
                    const filename = path.basename(fullPath);

                    if (filename) {
                        if (!imageMapByNumero.has(numeroStr)) {
                            imageMapByNumero.set(numeroStr, []);
                        }
                        if (!imageMapByNumero.get(numeroStr).includes(filename)) {
                            imageMapByNumero.get(numeroStr).push(filename);
                            count++;
                        }
                    } else {
                         console.warn(`⚠️ Mapeo inválido omitido (índice ${mapIndex}): No se pudo extraer nombre de archivo de "${fullPath}".`);
                         invalidMappings++;
                    }
                } else {
                     console.warn(`⚠️ Mapeo inválido omitido (índice ${mapIndex}): Falta 'numero' (${numero}) o 'nombre_archivo_generado' (${fullPath}), o 'numero' no es numérico.`);
                     invalidMappings++;
                }
            });
             console.log(`✅ Mapeo de imágenes procesado. ${imageMapByNumero.size} claves 'numero' únicas encontradas en el archivo de mapeo.`);
             console.log(`   ${count} asociaciones numero-archivo válidas y únicas.`);
             if (invalidMappings > 0) {
                  console.warn(`   Se omitieron ${invalidMappings} entradas de mapeo inválidas.`);
             }
             if (imageMapByNumero.size === 0 && count === 0 && imageMappings.length > 0) {
                  console.error("❌ ¡Error Crítico! No se pudo procesar ninguna entrada válida del archivo de mapeo. Verifica el formato.");
             }
        } catch (error) {
            console.error(`❌ Error al leer/procesar el archivo de mapeo "${IMAGE_MAPPING_FILE}": ${error.message}`);
            console.warn("   -> La carga continuará sin intentar subir imágenes.");
            imageMapByNumero.clear();
        }
    } else {
        console.log("ℹ️ La subida de imágenes está desactivada (UPLOAD_IMAGES = false).");
    }

    // --- Procesar e Intentar Cargar Cada Item ---
    let resultados = { total: antecedentes.length, exitosos: 0, fallidos: 0, saltados: 0, erroresDetallados: [] };
    let erroresConsecutivos = 0;
    const assignedImageFilenames = new Set(); // Para rastrear qué nombres de archivo ya se usaron
    console.log(`⏳ Comenzando el procesamiento de ${resultados.total} items...`);

    for (let index = 0; index < antecedentes.length; index++) {
        const itemOriginal = antecedentes[index];
        const itemIndexForLog = index + 1;
        const itemTitulo = itemOriginal.Titulo ? String(itemOriginal.Titulo).trim() : `Item Índice ${itemIndexForLog}`;
        const logPrefixLoop = `--- Procesando Item ${itemIndexForLog}/${resultados.total} (Titulo: ${itemTitulo}) ---`;

        if (DEBUG) console.log(`\n${logPrefixLoop}`);

       // --- Lógica de Subida de Imagen (Busca UNA imagen por ÍNDICE/ORDEN) ---
       let primaryImageId = null;
       let assignedImageNameForThisItem = null;
       const lookupNumeroStr = String(index + 1); // Asume correspondencia orden -> numero
       let potentialImageNames = [];

       if (UPLOAD_IMAGES && imageMapByNumero.size > 0) {
           potentialImageNames = imageMapByNumero.get(lookupNumeroStr) || [];

           if (potentialImageNames.length > 0) {
                if (DEBUG) console.log(`🖼️ [Item Index ${itemIndexForLog}] Buscando imagen principal mapeada al número ${lookupNumeroStr} (basado en orden). Potenciales: ${potentialImageNames.length} (${potentialImageNames.join(', ')})`);

               for (const imageName of potentialImageNames) {
                    const imagePath = path.join(IMAGE_BASE_FOLDER, imageName);

                    if (assignedImageFilenames.has(imageName)) {
                        console.warn(`🚫 [Item Index ${itemIndexForLog}] La imagen potencial "${imageName}" ya fue asignada a un item anterior. Probando siguiente...`);
                        continue;
                    }

                    if (SIMULATE) {
                        console.log(`🔵 [SIMULACIÓN - Item Index ${itemIndexForLog}] Se intentaría subir y asignar como imagen principal: ${imageName} desde ${imagePath} (mapeada por orden al número ${lookupNumeroStr})`);
                        if (!assignedImageFilenames.has(imageName)) {
                             primaryImageId = `simulated_${imageName}_id`;
                             assignedImageNameForThisItem = imageName;
                             assignedImageFilenames.add(imageName);
                             console.log(`   -> Imagen principal simulada asignada: ${imageName}`);
                             break;
                        }
                        continue;
                    }

                    try {
                        const uploadedId = await uploadImageToDirectus(imagePath, currentToken, itemTitulo, itemIndexForLog);
                        if (uploadedId) {
                            primaryImageId = uploadedId;
                            assignedImageNameForThisItem = imageName;
                            assignedImageFilenames.add(imageName);
                            console.log(`   -> Imagen principal asignada: ${imageName} (ID: ${primaryImageId})`);
                            break;
                        }
                    } catch (uploadError) {
                        if (uploadError.response?.status === 401) {
                            console.warn(`⚠️ [Item Index ${itemIndexForLog}] Error de autenticación (401) durante subida. Intentando renovar token...`);
                            try {
                                currentToken = await loginToDirectus();
                                console.log(`✅ Token renovado. Reintentando el item actual (Index ${itemIndexForLog})...`);
                                index--;
                                erroresConsecutivos = 0;
                                primaryImageId = null;
                                assignedImageNameForThisItem = null;
                                potentialImageNames = []; // Vaciar para forzar salida
                                break;
                            } catch (loginError) {
                                console.error('🔥 Fallo crítico al renovar token tras error de subida. Deteniendo.');
                                resultados.erroresDetallados.push({ index, itemOriginal, error: 'Fallo renovación token post-upload', status: null });
                                resultados.fallidos++;
                                return resultados; // Salir de la función principal
                             }
                        } else {
                            console.error(`💥 [Item Index ${itemIndexForLog}] Error subiendo imagen potencial ${imageName}. Probando siguiente...`);
                        }
                    } // Fin catch uploadError
                } // Fin for...of imageName

                if (potentialImageNames.length === 0 && index > -1) {
                     if (DEBUG) console.log(`🔍 Reintentando item Index ${itemIndexForLog} debido a refresh de token.`);
                     continue;
                }

                if (!primaryImageId && potentialImageNames.length > 0) {
                    console.warn(`⚠️ [Item Index ${itemIndexForLog}] No se pudo subir o asignar ninguna de las imágenes potenciales (${potentialImageNames.join(', ')}). Se continuará sin imagen principal.`);
                    resultados.erroresDetallados.push({ index, itemOriginal, error: `Fallo al subir/asignar imágenes potenciales: ${potentialImageNames.join(', ')}`, status: null });
                }

           } else {
               if (DEBUG) console.log(`🤷 [Item Index ${itemIndexForLog}] No se encontraron imágenes mapeadas al número ${lookupNumeroStr} (basado en orden).`);
           }
       } else if (UPLOAD_IMAGES && imageMapByNumero.size === 0 && index === 0) {
            console.warn("⚠️ El mapa de imágenes está vacío o no se pudo procesar. No se subirán imágenes.");
       }
       // --- Fin Lógica de Subida de Imagen ---


       // Transformar el payload, pasando el ID de la imagen principal (o null)
       const payload = transformPayload(itemOriginal, itemIndexForLog, primaryImageId);

       if (!payload) {
           resultados.saltados++;
           resultados.fallidos++;
           erroresConsecutivos++;
            if (assignedImageNameForThisItem) {
                 console.warn(`   -> Desmarcando imagen "${assignedImageNameForThisItem}" porque el payload del item ${itemIndexForLog} es inválido.`);
                 assignedImageFilenames.delete(assignedImageNameForThisItem);
            }
           if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) {
                console.error(`🚨 Demasiados errores consecutivos (${erroresConsecutivos}). Deteniendo.`);
                break;
           }
           continue;
       }

       if (SIMULATE) {
           console.log(`🔵 [SIMULACIÓN - Item Index ${itemIndexForLog}] Payload preparado: ${JSON.stringify(payload)}`);
           if (primaryImageId) {
                console.log(`   -> Incluiría la imagen principal simulada: ${assignedImageNameForThisItem || primaryImageId}`);
           }
           resultados.exitosos++;
           erroresConsecutivos = 0;
           continue;
       }

       // Intentar crear el item en Directus
       try {
           if (DEBUG) console.log(`📡 Enviando payload para item Index ${itemIndexForLog} (${itemTitulo}): ${JSON.stringify(payload, null, 2)}`);
           const response = await intentarCrearItem(payload, currentToken, itemIndexForLog, itemTitulo);
           const imageSuccessMsg = primaryImageId ? `(con imagen principal ID: ${primaryImageId})` : '(sin imagen principal asociada)';
           console.log(`✅ [${itemIndexForLog}/${resultados.total}] Cargado Item Index ${itemIndexForLog}: "${payload.Titulo}" ${imageSuccessMsg}`);
           resultados.exitosos++;
           erroresConsecutivos = 0;

       } catch (error) {
           const status = error.response?.status;
           const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
           console.error(`❌ Error al cargar item Index ${itemIndexForLog} (${payload.Titulo}) (Status: ${status || 'N/A'}) - ${errorMsg}`);
           // El log extendido para 400 ya está en intentarCrearItem
           resultados.fallidos++;
           erroresConsecutivos++;
           resultados.erroresDetallados.push({ index, itemOriginal, payloadEnviado: payload, error: errorMsg, status });

            if (assignedImageNameForThisItem) {
                console.warn(`   -> Desmarcando imagen "${assignedImageNameForThisItem}" debido a fallo en creación del item Index ${itemIndexForLog}.`);
                assignedImageFilenames.delete(assignedImageNameForThisItem);
            }

           if (status === 401) {
               console.warn(`⚠️ [Item Index ${itemIndexForLog}] Error de autenticación (401). Intentando renovar token...`);
               try {
                   currentToken = await loginToDirectus();
                   console.log('✅ Token renovado. Reintentando el item actual...');
                   index--;
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
           await wait(1000); // Pausa tras error
       } // Fin catch crear item

       // Pausa breve entre items
       if (!SIMULATE && index < antecedentes.length - 1) {
           await wait(300);
       }

   } // Fin for loop

   // --- Guardar Resultados Fallidos y Mostrar Resumen Final ---
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
    console.log(`🖼️ Total de imágenes únicas asignadas como imagen principal: ${assignedImageFilenames.size}`);

   return resultados;
}

// --- Ejecución ---
cargarAntecedentesADirectus().catch(error => {
    console.error('\n🔥🔥 Error Inesperado Fuera del Bucle Principal 🔥🔥');
    console.error(error.message);
    if (DEBUG && error.stack) console.error(error.stack);
     else if(DEBUG) console.error(error);

});
