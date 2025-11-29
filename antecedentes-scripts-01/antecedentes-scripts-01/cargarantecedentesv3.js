import axios from 'axios';
import fs from 'fs';
import path from 'path'; // Necesario para manejar rutas de archivos
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data'; // Necesario para subir archivos

// --- Configuraciones ---
const INPUT_FILE = './antev3.json'; // Archivo de antecedentes
const LINKING_FILE = './datos_imagenes_para_directus_20250413_134014.json'; // Archivo de vinculación
const IMAGE_FOLDER = './imagenes-realistas-v4'; // Carpeta con imágenes
const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com'; // Reemplaza si es necesario
const DIRECTUS_PASSWORD = 'adminpassword'; // Reemplaza si es necesario
const PROVIDED_TOKEN = "bqvkfpf7Zl2-oZsCCtSdE8hRTms6YqD_"; // Opcional: token estático
const SIMULATE = false; // Poner en false para afectar la instalación de Directus
const MAX_RETRIES = 3;
const DEBUG = true; // Modo debug
const MAX_CONSECUTIVE_ERRORS = 10; // Aumentado por si hay errores de imagen
const RETRY_DELAY = 2000; // Delay base en ms
const COLLECTION_NAME = 'Antecedentes'; // Nombre de tu colección en Directus
const IMAGE_M2M_FIELD_NAME = 'Imagenes_Relacionadas'; // *** IMPORTANTE: Nombre del campo M2M para imágenes en Directus ***
const CLIENTE_FIELD_NAME = 'Cliente'; // Nombre del campo Cliente en antev3.json
const SERVICIO_FIELD_NAME = 'Servicio'; // *** IMPORTANTE: Nombre del campo Servicio en antev3.json ***
const REQUIRED_FIELDS = ['Titulo', 'Fecha', 'status', CLIENTE_FIELD_NAME, SERVICIO_FIELD_NAME]; // Campos requeridos en el payload final
const MAX_DATE = new Date('2999-12-31').getTime();
const MIN_DATE = new Date('1900-01-01').getTime();
const ENDPOINTS = {
    items: `/items/${COLLECTION_NAME}`,
    files: `/files` // Endpoint para subir archivos
};

// --- Cache y Estado ---
// Mapa para rastrear imágenes ya subidas y evitar duplicados
// Clave: nombre de archivo, Valor: ID del archivo en Directus
const uploadedImageMap = new Map();

// --- Funciones Auxiliares (login, verificarToken, normalizarFecha, wait, verificarServidor, probarAcceso - sin cambios significativos) ---

async function loginToDirectus() {
    try {
        const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: DIRECTUS_EMAIL,
            password: DIRECTUS_PASSWORD
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Sesión iniciada en Directus');
        return response.data.data.access_token;
    } catch (error) {
        console.error('❌ Error al iniciar sesión en Directus:', error.response?.data?.errors || error.message);
        throw error;
    }
}

async function verificarToken(token) {
    try {
        await axios.get(`${DIRECTUS_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (DEBUG) console.log('🔍 Token verificado correctamente.');
        return true;
    } catch (error) {
        if (DEBUG) console.error('🔍 Debug - Error de verificación de token:', error.response?.status, error.response?.data?.errors);
        return false;
    }
}

function normalizarFecha(fechaOriginal) {
    if (!fechaOriginal || typeof fechaOriginal !== 'string') {
        return new Date().toISOString().split('T')[0];
    }
    const fechaLimpia = fechaOriginal.replace(/[^0-9\-T:.]/g, '');
    try {
        const fecha = new Date(fechaLimpia);
        const timestamp = fecha.getTime();
        if (isNaN(timestamp) || timestamp > MAX_DATE || timestamp < MIN_DATE) {
            return new Date().toISOString().split('T')[0];
        }
        return fecha.toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

const wait = (attemptNumber) => new Promise(resolve =>
    setTimeout(resolve, RETRY_DELAY * Math.pow(2, attemptNumber))
);

async function verificarServidor() {
    try {
        console.log(`🔍 Verificando servidor Directus en puerto ${DIRECTUS_PORT}...`);
        await axios.get(`${DIRECTUS_URL}/server/info`);
        console.log('✅ Servidor Directus accesible');
        return true;
    } catch (error) {
        console.error(`❌ Error al acceder al servidor: ${error.message}`);
        console.error(`⚠️ Verifique que Directus esté corriendo en el puerto correcto (${DIRECTUS_PORT})`);
        return false;
    }
}

async function probarAcceso(token) {
     try {
         if (DEBUG) console.log('🔍 Probando acceso a la colección...');
         await axios.get(`${DIRECTUS_URL}${ENDPOINTS.items}?limit=1`, {
             headers: { 'Authorization': `Bearer ${token}` }
         });
         if (DEBUG) console.log('✅ Acceso confirmado a la colección');
         return 'authenticated';
     } catch (error) {
         if (DEBUG) console.error('❌ Error al probar acceso:', error.response?.status, error.response?.data?.errors?.[0]?.message);
         return 'none';
     }
}

// --- Funciones Modificadas y Nuevas ---

/**
 * Transforma el objeto antecedente del JSON al formato esperado por Directus.
 * NO incluye las imágenes aquí, se añadirán después.
 */
function transformPayload(antecedente) {
    const payload = {
        status: 'published',
        // sort: 0, // Directus suele manejar esto
        // user_created: null, // Directus maneja esto
        // date_created: new Date().toISOString(), // Directus maneja esto

        // --- Campos principales ---
        // Ajusta los nombres de campo ("Título", "Descripción", etc.) si son diferentes en antev3.json
        Titulo: antecedente["Título"]?.trim() || antecedente["Titulo"]?.trim() || 'Sin título',
        Descripcion: antecedente["Descripción"]?.trim() || antecedente["Descripcion"]?.trim() || null,
        Descripcion_ampliada: antecedente["Descripción_Ampliada"]?.trim() || antecedente["Descripcion_ampliada"]?.trim() || null,
        Contenido_completo: antecedente["Contenido_completo"]?.trim() || null,

        // --- Campos de metadatos ---
        Fecha: normalizarFecha(antecedente["Fecha"]),
        Cliente: antecedente[CLIENTE_FIELD_NAME]?.trim() || null,
        Unidad_de_negocio: antecedente["Unidad_de_negocio"]?.trim() || null,
        Presupuesto: typeof antecedente["Monto_contratado"] === 'number' ? antecedente["Monto_contratado"] : null,
        Area: antecedente["Área"]?.trim() || antecedente["Area"]?.trim() || null,
        // Incluye el campo de servicio para referencia, aunque Directus no lo necesite directamente
        [SERVICIO_FIELD_NAME]: antecedente[SERVICIO_FIELD_NAME]?.trim() || null,

        // --- Campos adicionales para tracking interno del script ---
        id_original_script: uuidv4(), // ID único para referencia interna del script
        procesado_en_script: new Date().toISOString()
    };

     // Limpiar campos nulos o indefinidos si es necesario (Directus puede preferir esto)
     Object.keys(payload).forEach(key => (payload[key] === undefined || payload[key] === null) && delete payload[key]);

     payload.status = 'published'; // Asegurarse de que el status esté presente

    return payload;
}

/**
 * Sube una imagen a Directus si no ha sido subida antes.
 * Maneja reintentos.
 * @param {string} imageFilename Nombre del archivo de imagen (ej. "imagen.png")
 * @param {string} token Token de autenticación de Directus
 * @returns {Promise<string|null>} El ID del archivo en Directus o null si falla.
 */
async function uploadImageIfNotExists(imageFilename, token) {
    // 1. Verificar si ya se subió esta imagen (por nombre de archivo)
    if (uploadedImageMap.has(imageFilename)) {
        if (DEBUG) console.log(`⏭️ Imagen ${imageFilename} ya subida (ID: ${uploadedImageMap.get(imageFilename)}). Saltando subida.`);
        return uploadedImageMap.get(imageFilename);
    }

    // 2. Construir la ruta completa y verificar si existe
    const imagePath = path.join(IMAGE_FOLDER, imageFilename);
    if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️ Imagen no encontrada en la carpeta: ${imagePath}. No se puede subir.`);
        return null;
    }

    // 3. Preparar FormData para la subida
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    // Puedes añadir otros campos si son necesarios para tu configuración de archivos de Directus
    // formData.append('title', `Imagen para antecedente ${imageFilename}`);
    // formData.append('folder', 'TU_UUID_DE_CARPETA_SI_APLICA');

    if (DEBUG) console.log(`☁️ Intentando subir imagen: ${imageFilename}`);

    // 4. Intentar subir con reintentos
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            const response = await axios.post(
                `${DIRECTUS_URL}${ENDPOINTS.files}`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(), // Importante para multipart/form-data
                        'Authorization': `Bearer ${token}`
                    },
                    maxContentLength: Infinity, // Permitir archivos grandes
                    maxBodyLength: Infinity
                }
            );
            const fileId = response.data.data.id;
            if (DEBUG) console.log(`✅ Imagen ${imageFilename} subida con éxito. ID: ${fileId}`);
            // Registrar la imagen subida en el mapa
            uploadedImageMap.set(imageFilename, fileId);
            return fileId;
        } catch (error) {
            attempts++;
            const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
            console.error(`❌ Error al subir imagen ${imageFilename} (Intento ${attempts}/${MAX_RETRIES}): ${errorMsg}`);
            if (error.response?.status === 401) { // Error de autenticación
                 throw new Error('Token expired during image upload'); // Lanzar error para refrescar token
            }
            if (attempts >= MAX_RETRIES) {
                console.error(`💀 Fallo definitivo al subir imagen ${imageFilename} después de ${MAX_RETRIES} intentos.`);
                return null; // Falló la subida
            }
            await wait(attempts); // Esperar antes de reintentar
        }
    }
    return null; // No debería llegar aquí, pero por si acaso
}

/**
 * Crea un item (antecedente) en Directus.
 * Maneja reintentos.
 * @param {object} payload Objeto del item a crear.
 * @param {string} token Token de autenticación.
 * @returns {Promise<object>} La respuesta de la API de Directus.
 */
async function intentarCrearItem(payload, token) {
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            const response = await axios.post(
                `${DIRECTUS_URL}${ENDPOINTS.items}`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response; // Éxito
        } catch (error) {
            attempts++;
            const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
            const status = error.response?.status;
            console.error(`❌ Error al crear item "${payload.Titulo || 'Desconocido'}" (Intento ${attempts}/${MAX_RETRIES}): [${status}] ${errorMsg}`);

             // Si es error de validación, mostrar detalles si existen
             if (status === 400 && error.response?.data?.errors?.[0]?.extensions?.field) {
                 console.error(`    -> Error de validación en campo: ${error.response.data.errors[0].extensions.field}`);
             }

            if (status === 401) { // Token expirado o inválido
                 throw new Error('Token expired during item creation'); // Lanzar para refrescar
            }

            if (attempts >= MAX_RETRIES) {
                console.error(`💀 Fallo definitivo al crear item "${payload.Titulo || 'Desconocido'}" después de ${MAX_RETRIES} intentos.`);
                throw error; // Lanzar el último error
            }
            await wait(attempts); // Esperar antes de reintentar
        }
    }
}

/**
 * Función principal para cargar antecedentes e imágenes.
 */
async function cargarAntecedentesConImagenes() {
    try {
        console.log('🔄 Iniciando proceso de carga de antecedentes con imágenes...');

        // 1. Verificar servidor
        if (!await verificarServidor()) {
            throw new Error(`No se puede acceder al servidor Directus en puerto ${DIRECTUS_PORT}`);
        }

        // 2. Obtener token (proveído o por login)
        let currentToken = PROVIDED_TOKEN;
        if (!currentToken) {
             console.log('🔑 No se proporcionó token, intentando iniciar sesión...');
             currentToken = await loginToDirectus();
        } else {
            console.log('🧪 Usando token proporcionado. Verificando...');
            if (!await verificarToken(currentToken)) {
                console.warn('⚠️ Token proporcionado inválido o expirado. Intentando iniciar sesión...');
                currentToken = await loginToDirectus();
            } else {
                console.log('✅ Token proporcionado válido.');
            }
        }

        // 3. Verificar acceso a la colección
        const acceso = await probarAcceso(currentToken);
        if (acceso !== 'authenticated') {
            throw new Error('No se pudo autenticar o acceder a la colección con el token actual.');
        }

        // 4. Cargar datos de archivos JSON
        console.log(`📄 Cargando antecedentes desde: ${INPUT_FILE}`);
        const antecedentes = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
        console.log(`📄 Cargando datos de vinculación de imágenes desde: ${LINKING_FILE}`);
        const linkingData = JSON.parse(fs.readFileSync(LINKING_FILE, 'utf-8'));
        console.log(`📦 ${antecedentes.length} antecedentes cargados.`);
        console.log(`🔗 ${linkingData.length} registros de vinculación cargados.`);

        // 5. Pre-procesar datos de vinculación para búsqueda rápida (opcional pero recomendado)
        // Crear un mapa: Cliente -> Servicio -> [lista de nombres de archivo]
        const linkingMap = new Map();
        linkingData.forEach(link => {
            const cliente = link.cliente?.trim();
            const servicio = link.servicio?.trim(); // Asegúrate que el nombre 'servicio' sea correcto en tu JSON
            const filename = link.nombre_archivo_imagen?.trim();

            if (cliente && servicio && filename) {
                if (!linkingMap.has(cliente)) {
                    linkingMap.set(cliente, new Map());
                }
                const serviceMap = linkingMap.get(cliente);
                if (!serviceMap.has(servicio)) {
                    serviceMap.set(servicio, []);
                }
                serviceMap.get(servicio).push(filename);
            } else {
                 console.warn(`⚠️ Registro de vinculación incompleto omitido:`, link);
            }
        });
        console.log(`🗺️ Mapa de vinculación creado para búsqueda rápida.`);

        // 6. Inicializar resultados y control de errores
        let resultados = {
            total: antecedentes.length,
            exitosos: 0,
            fallidos: 0,
            imagenesSubidas: 0,
            imagenesReutilizadas: 0,
            errores: []
        };
        let consecutiveErrors = 0;

        // 7. Procesar cada antecedente
        console.log(`🚀 Comenzando procesamiento de ${antecedentes.length} antecedentes...`);
        for (let index = 0; index < antecedentes.length; index++) {
            const antecedente = antecedentes[index];
            const clienteActual = antecedente[CLIENTE_FIELD_NAME]?.trim();
            const servicioActual = antecedente[SERVICIO_FIELD_NAME]?.trim(); // Usa el nombre correcto del campo

            console.log(`\n--- Procesando [${index + 1}/${resultados.total}]: ${antecedente["Título"] || antecedente["Titulo"] || 'Sin Título'} (Cliente: ${clienteActual}, Servicio: ${servicioActual}) ---`);

            // 7.a. Preparar payload base del antecedente
            let payload = transformPayload(antecedente);

             // Validar campos requeridos básicos antes de continuar
             let missingFields = REQUIRED_FIELDS.filter(field => !(field in payload) || payload[field] === null || payload[field] === undefined || payload[field] === '');
             if (missingFields.length > 0) {
                 console.error(`❌ Error: Faltan campos requeridos en el antecedente ${index + 1} (${payload.Titulo}): ${missingFields.join(', ')}. Saltando item.`);
                 resultados.fallidos++;
                 resultados.errores.push({ item: payload, error: `Faltan campos requeridos: ${missingFields.join(', ')}`, status: 'VALIDATION_ERROR' });
                 consecutiveErrors++;
                 // Detener si hay demasiados errores seguidos
                 if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                     console.error(`🚨 Demasiados errores consecutivos (${consecutiveErrors}). Deteniendo proceso...`);
                     break;
                 }
                 continue; // Pasar al siguiente antecedente
             }


            // 7.b. Buscar imágenes correspondientes en el mapa de vinculación
            const imageFilenamesToLink = linkingMap.get(clienteActual)?.get(servicioActual) || [];
            if (DEBUG) console.log(`🔗 Imágenes encontradas para vincular: ${imageFilenamesToLink.length > 0 ? imageFilenamesToLink.join(', ') : 'Ninguna'}`);

            // 7.c. Subir imágenes (si no existen) y obtener sus IDs
            const imageIdsToAssociate = [];
            if (imageFilenamesToLink.length > 0) {
                console.log(`⬆️  Procesando ${imageFilenamesToLink.length} imágenes para este antecedente...`);
                for (const filename of imageFilenamesToLink) {
                     if (SIMULATE) {
                        console.log(`🔹 [SIMULACIÓN] Se buscaría/subiría la imagen: ${filename}`);
                        // En simulación, podríamos asignar IDs falsos para probar la estructura
                        if (!uploadedImageMap.has(filename)) {
                             uploadedImageMap.set(filename, `sim_${uuidv4()}`);
                             resultados.imagenesSubidas++;
                        } else {
                             resultados.imagenesReutilizadas++;
                        }
                        imageIdsToAssociate.push(uploadedImageMap.get(filename));
                        continue; // Saltar subida real en simulación
                     }

                    try {
                        const fileId = await uploadImageIfNotExists(filename, currentToken);
                        if (fileId) {
                             // Contar si es nueva o reutilizada (uploadImageIfNotExists ya lo logea)
                             if (!imageIdsToAssociate.includes(fileId)) { // Evitar duplicados en la misma M2M
                                 imageIdsToAssociate.push(fileId);
                             }
                        } else {
                             console.warn(`⚠️ No se pudo obtener ID para la imagen ${filename}. No se asociará.`);
                             // Podrías decidir si fallar todo el item o solo omitir la imagen
                        }
                    } catch (error) {
                        // Si el error es por token expirado, intentar refrescar y reintentar el item completo
                        if (error.message.includes('Token expired')) {
                             console.warn('🔄 Token expirado durante subida de imagen. Renovando token...');
                             currentToken = await loginToDirectus();
                             console.log('✅ Token renovado. Reintentando el antecedente actual...');
                             index--; // Reintentar el mismo antecedente con el nuevo token
                             // Romper el bucle de imágenes para que el bucle principal reintente
                             imageIdsToAssociate.length = 0; // Limpiar IDs parciales
                             break; // Salir del for de imágenes
                        } else {
                             console.error(`❌ Error no manejado durante la subida de imagen ${filename}: ${error.message}`);
                             // Decide cómo manejar esto: ¿fallar el item? ¿continuar sin la imagen?
                             // Por ahora, continuamos sin esta imagen específica.
                        }
                    }
                }

                // Si se rompió el bucle de imágenes para refrescar token, continuar al siguiente ciclo del bucle principal
                 if (imageFilenamesToLink.length > 0 && imageIdsToAssociate.length === 0 && !SIMULATE) {
                     // Esto puede pasar si fallaron todas las subidas o si se reintentó el item
                     if (index >= 0) { // Asegurarse que no sea la primera iteración después de reintento
                          console.log('Reintentando el antecedente debido a fallo en subida de imagen / refresco de token.');
                          continue; // Saltar al siguiente ciclo del bucle principal para reintentar
                     }
                 }

            } // Fin if imageFilenamesToLink.length > 0

            // 7.d. Añadir los IDs de las imágenes al payload (formato M2M)
            if (imageIdsToAssociate.length > 0) {
                // Formato M2M para Directus: array de objetos con la clave del item relacionado
                payload[IMAGE_M2M_FIELD_NAME] = imageIdsToAssociate.map(id => ({
                    // El nombre de la clave aquí es crucial: {collection_name}_{field_name}_id o directus_files_id
                    // Usualmente para la relación M2M estándar con directus_files es solo directus_files_id
                     "directus_files_id": id
                    // Si tu relación tiene un nombre específico o es M2O, el formato cambia.
                    // Consulta la documentación de Directus API para "Relational Data"
                }));
                 if (DEBUG) console.log(`📦 Payload final con ${imageIdsToAssociate.length} imágenes referenciadas:`, JSON.stringify(payload[IMAGE_M2M_FIELD_NAME]));
            } else {
                 payload[IMAGE_M2M_FIELD_NAME] = []; // Asegurarse que el campo exista, vacío si no hay imágenes
                 if (DEBUG) console.log(`📦 Payload final sin imágenes asociadas.`);
            }


            // 7.e. Intentar crear el item en Directus
            try {
                if (!SIMULATE) {
                    if (DEBUG) console.log(`📨 Enviando payload a Directus: ${JSON.stringify(payload, null, 2)}`);
                    await intentarCrearItem(payload, currentToken);
                    console.log(`✅ [${index + 1}/${resultados.total}] ANTECEDENTE CREADO: ${payload.Titulo} (con ${imageIdsToAssociate.length} imágenes asociadas)`);
                    resultados.exitosos++;
                    consecutiveErrors = 0; // Resetear contador de errores consecutivos
                } else {
                    console.log(`🔹 [SIMULACIÓN] Se crearía antecedente: ${payload.Titulo} con ${imageIdsToAssociate.length} imágenes simuladas.`);
                    resultados.exitosos++;
                     // Actualizar contadores de imágenes en simulación (ya hecho en el bucle de imágenes)
                     consecutiveErrors = 0;
                }
            } catch (error) {
                // El error ya se loguea dentro de intentarCrearItem
                const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
                const status = error.response?.status;

                 // Manejo de token expirado al crear item
                 if (error.message.includes('Token expired') || status === 401) {
                     console.warn('🔄 Token expirado durante creación de item. Renovando token...');
                     currentToken = await loginToDirectus();
                     console.log('✅ Token renovado. Reintentando el antecedente actual...');
                     index--; // Reintentar el mismo antecedente
                     continue; // Saltar al siguiente ciclo
                 }

                // Error al crear el item
                resultados.fallidos++;
                resultados.errores.push({
                    itemIndex: index + 1,
                    itemTitulo: payload.Titulo,
                    payloadEnviado: payload, // Guardar el payload que falló
                    error: errorMsg,
                    status: status
                });
                consecutiveErrors++;

                // Detener si hay demasiados errores consecutivos
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    console.error(`🚨 Demasiados errores consecutivos (${consecutiveErrors}). Deteniendo proceso...`);
                    break; // Salir del bucle principal
                }
            }

            // Pausa breve entre items para no saturar el servidor (opcional)
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms de pausa

        } // Fin del bucle for de antecedentes

        // 8. Mostrar resumen y guardar errores
        console.log('\n🏁 Proceso finalizado.');

         // Contar imágenes subidas vs reutilizadas desde el mapa global
         let finalImagenesSubidas = 0;
         let finalImagenesReutilizadas = 0;
         // Necesitamos saber cuántas veces se llamó a uploadImage y devolvió un ID vs cuántas veces se encontró en el mapa
         // El conteo actual en `resultados` puede ser impreciso si hay reintentos. Mejor usar el tamaño del mapa final.
         finalImagenesSubidas = uploadedImageMap.size;
         // El conteo de reutilizadas es más complejo de rastrear sin un contador dedicado en el momento.
         // El conteo actual en resultados es una aproximación.

        if (resultados.errores.length > 0) {
            const errorFilename = `./resultados_fallidos_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            fs.writeFileSync(errorFilename, JSON.stringify(resultados.errores, null, 2));
            console.log(`📄 ${resultados.fallidos} errores guardados en: ${errorFilename}`);
        }

        console.log(`
        📊 Resumen Final:
        ==================================
        Total de antecedentes procesados: ${index} / ${resultados.total}
        ──────────────────────────────────
        ✅ Exitosos:               ${resultados.exitosos}
        ❌ Fallidos:               ${resultados.fallidos}
        ==================================
        🖼️  Imágenes únicas subidas: ${finalImagenesSubidas}
        (Nota: El conteo de imágenes reutilizadas requiere lógica adicional para ser preciso)
        ==================================
        `);

        return resultados;

    } catch (error) {
        console.error('🔥 Error crítico en el proceso principal:', error.message);
        if (error.stack && DEBUG) {
             console.error(error.stack);
        }
        // Asegurarse de guardar errores parciales si el proceso falla catastróficamente
        if (typeof resultados !== 'undefined' && resultados.errores.length > 0) {
             const errorFilename = `./resultados_fallidos_CRITICO_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
             try {
                 fs.writeFileSync(errorFilename, JSON.stringify(resultados.errores, null, 2));
                 console.log(`📄 Errores parciales guardados en: ${errorFilename}`);
             } catch (saveError) {
                 console.error(`❌ No se pudieron guardar los errores parciales: ${saveError.message}`);
             }
         }
        // process.exit(1); // Terminar con código de error
    }
}

// --- Ejecutar el proceso principal ---
cargarAntecedentesConImagenes();