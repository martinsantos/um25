import axios from 'axios';
import fs from 'fs/promises'; // Usar promesas para fs
import path from 'path';
import FormData from 'form-data'; // Necesario para subir archivos

// --- Configuraciones (Ajusta según sea necesario) ---
const INPUT_FILE = './antev3.json'; // Asegúrate que sea el JSON correcto
const IMAGENES_DIR = './imagenes_ultrarealistas'; // Directorio donde están las imágenes generadas
const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com'; // Cambia si es necesario
const DIRECTUS_PASSWORD = 'adminpassword'; // Cambia si es necesario
const PROVIDED_TOKEN = "bqvkfpf7Zl2-oZsCCtSdE8hRTms6YqD_"; // Tu token estático o deja null para login
const COLLECTION_NAME = 'Antecedentes'; // Nombre exacto de tu colección
const IMAGE_FIELD_NAME = 'Imagen'; // Nombre exacto del campo de imagen en tu colección

const SIMULATE = false; // Poner en true para probar sin subir/actualizar nada
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // ms
const DEBUG = true; // Para logs detallados
const MAX_CONSECUTIVE_ERRORS = 5;

// NUEVA CONFIGURACIÓN: ¿Qué hacer con los duplicados?
// 'omitir' (comportamiento anterior) | 'actualizar_todos' (nuevo comportamiento)
const DUPLICATE_HANDLING_MODE = 'actualizar_todos';

const ENDPOINTS = {
    items: `/items/${COLLECTION_NAME}`,
    files: `/files`,
    auth: '/auth/login',
    usersMe: '/users/me',
    serverPing: '/server/ping',
};

// --- Funciones de Autenticación y Verificación (Sin cambios) ---
async function loginToDirectus() { /* ... Mismo código ... */
    try {
        console.log(`🔐 Intentando iniciar sesión como ${DIRECTUS_EMAIL}...`);
        const response = await axios.post(`${DIRECTUS_URL}${ENDPOINTS.auth}`, {
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
async function verificarToken(token) { /* ... Mismo código ... */
    try {
        await axios.get(`${DIRECTUS_URL}${ENDPOINTS.usersMe}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (DEBUG) console.log('🔍 Debug - Verificación de token exitosa.');
        return true;
    } catch (error) {
        if (DEBUG) console.error('🔍 Debug - Error de verificación de token:', error.response?.status, error.response?.data?.errors || error.message);
        return false;
    }
}
async function verificarServidor() { /* ... Mismo código ... */
     try {
        console.log(`🔍 Verificando conexión con Directus en ${DIRECTUS_URL}...`);
        const response = await axios.get(`${DIRECTUS_URL}${ENDPOINTS.serverPing}`, { timeout: 5000 });
        if (response.data === 'pong') {
            console.log('✅ Conexión con el servidor Directus establecida.');
            return true;
        } else {
             console.warn('⚠️ El servidor Directus respondió, pero no con "pong". Verificando estado...');
            return false; // Simplificado
        }
    } catch (error) {
        console.error(`❌ Error fatal al conectar con Directus en ${DIRECTUS_URL}: ${error.message}`);
        return false;
    }
}
const wait = (delay) => new Promise(resolve => setTimeout(resolve, delay));

// --- Funciones Específicas para Imágenes (generarNombreBaseImagen sin cambios) ---
function generarNombreBaseImagen(titulo) { /* ... Mismo código ... */
    if (!titulo) return '';
    let nombreBase = titulo.substring(0, 30);
    nombreBase = nombreBase.replace(/ /g, '_');
    nombreBase = nombreBase.replace(/^_+|_+$/g, '');
    return `${nombreBase}_HD`;
}
async function encontrarArchivoImagen(titulo, baseDir) { /* ... Mismo código ... */
    const nombreBase = generarNombreBaseImagen(titulo);
    if (!nombreBase) return null;
    const nombreArchivoEsperado = `${nombreBase}.png`;
    const rutaCompleta = path.join(baseDir, nombreArchivoEsperado);
    try {
        await fs.access(rutaCompleta, fs.constants.R_OK);
        if (DEBUG) console.log(`🔍 Imagen encontrada localmente: ${rutaCompleta}`);
        return rutaCompleta;
    } catch (error) {
        if (DEBUG) console.log(`🟠 No se encontró imagen local para "${titulo}" en: ${rutaCompleta}`);
        return null;
    }
}

/**
 * Busca items en la colección 'Antecedentes' por su título.
 * @param {string} titulo El título a buscar.
 * @param {string} token El token de autenticación de Directus.
 * @returns {Promise<Array<{id: string, tieneImagen: boolean}> | 'no_encontrado' | 'error'>}
 * Un array de objetos {id, tieneImagen} (incluso si solo hay 1), o strings 'no_encontrado' / 'error'.
 */
async function buscarItemsPorTitulo(titulo, token) { // Nombre cambiado a plural
    if (!titulo) return 'error';
    const encodedTitulo = encodeURIComponent(titulo);
    // No limitamos a 2, pedimos todos los que coincidan (o Directus limite por defecto)
    const url = `${DIRECTUS_URL}${ENDPOINTS.items}?filter[Titulo][_eq]=${encodedTitulo}&fields=id,${IMAGE_FIELD_NAME}`; // Quitamos limit=2

    try {
        if (DEBUG) console.log(`🔍 Buscando items con título: "${titulo}"`);
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const items = response.data.data;

        if (items.length === 0) {
            console.warn(`🟠 No se encontró ningún item en Directus para el título: "${titulo}"`);
            return 'no_encontrado';
        } else {
            // Siempre devolvemos un array, incluso si solo hay un item
            const itemsInfo = items.map(item => ({
                 id: item.id,
                 tieneImagen: !!item[IMAGE_FIELD_NAME]
            }));
             if (items.length === 1) {
                 if (DEBUG) console.log(`✅ Item encontrado para "${titulo}": ID ${itemsInfo[0].id}. ¿Tiene imagen?: ${itemsInfo[0].tieneImagen}`);
             } else {
                 console.warn(`⚠️ DUPLICADOS: Se encontraron ${items.length} items en Directus para el título: "${titulo}". Se intentará actualizar todos si aplica.`);
             }
            return itemsInfo; // Devolvemos el array de items encontrados
        }
    } catch (error) {
        console.error(`❌ Error buscando items por título "${titulo}":`, error.response?.data?.errors || error.message);
        return 'error';
    }
}

// --- Funciones subirImagenADirectus y actualizarItemConImagen (Sin cambios) ---
async function subirImagenADirectus(filePath, token, attempt = 1) { /* ... Mismo código ... */
    const form = new FormData();
    try {
        const fileStream = await fs.readFile(filePath);
        form.append('file', fileStream, path.basename(filePath));
        if (DEBUG) console.log(`☁️ Subiendo imagen: ${filePath}`);
        const response = await axios.post(
            `${DIRECTUS_URL}${ENDPOINTS.files}`,
            form,
            {
                headers: { ...form.getHeaders(), 'Authorization': `Bearer ${token}` },
                maxContentLength: Infinity, maxBodyLength: Infinity
            }
        );
        const fileId = response.data.data.id;
        if (DEBUG) console.log(`✅ Imagen subida exitosamente. File ID: ${fileId}`);
        return fileId;
    } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
        console.warn(`⚠️ Intento ${attempt}/${MAX_RETRIES} fallido al subir imagen ${filePath} (Status: ${status || 'N/A'}): ${errorMsg}`);
        if (status === 401 || status === 403 || status === 400) throw error;
        if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏱️ Esperando ${delay}ms antes de reintentar subida...`);
            await wait(delay);
            return subirImagenADirectus(filePath, token, attempt + 1);
        } else {
            console.error(`❌ Máximos reintentos (${MAX_RETRIES}) alcanzados para subir ${filePath}.`);
            throw error;
        }
    }
}
async function actualizarItemConImagen(itemId, fileId, token, attempt = 1) { /* ... Mismo código ... */
    const url = `${DIRECTUS_URL}${ENDPOINTS.items}/${itemId}`;
    const payload = { [IMAGE_FIELD_NAME]: fileId };
    try {
        if (DEBUG) console.log(`🔄 Actualizando item ID ${itemId} con File ID ${fileId}...`);
        await axios.patch(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (DEBUG) console.log(`✅ Item ID ${itemId} actualizado correctamente.`);
        return true;
    } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
        console.warn(`⚠️ Intento ${attempt}/${MAX_RETRIES} fallido al actualizar item ${itemId} (Status: ${status || 'N/A'}): ${errorMsg}`);
        if (status === 401 || status === 403 || status === 400) throw error;
        if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏱️ Esperando ${delay}ms antes de reintentar actualización...`);
            await wait(delay);
            return actualizarItemConImagen(itemId, fileId, token, attempt + 1);
        } else {
            console.error(`❌ Máximos reintentos (${MAX_RETRIES}) alcanzados para actualizar ${itemId}.`);
            throw error;
        }
    }
}

// --- Función Principal (MODIFICADA) ---

async function asociarImagenes() {
    console.log('🚀 Iniciando proceso de asociación de imágenes...');
    // ... (Verificar servidor, obtener token, leer JSON - sin cambios) ...
    if (!await verificarServidor()) { console.error('...'); return; }
    let currentToken;
    if (PROVIDED_TOKEN) { if (await verificarToken(PROVIDED_TOKEN)) { currentToken = PROVIDED_TOKEN; } else { try { currentToken = await loginToDirectus(); } catch (e) { console.error('...'); return; } } } else { try { currentToken = await loginToDirectus(); } catch (e) { console.error('...'); return; } }
    let antecedentes;
    try { const rawData = await fs.readFile(INPUT_FILE, 'utf-8'); antecedentes = JSON.parse(rawData); if (!Array.isArray(antecedentes)) { throw new Error('...'); } console.log(`📄 Leídos ${antecedentes.length} registros del archivo ${INPUT_FILE}`); } catch (error) { console.error(`❌ Error fatal al leer o parsear JSON "${INPUT_FILE}": ${error.message}`); return; }


    // 4. Procesar cada item
    let resultados = {
        total_json: antecedentes.length,
        items_actualizados: 0, // Cuenta cada operación PATCH exitosa
        items_omitidos_total: 0,
        omitidos_sin_imagen_local: 0,
        omitidos_item_no_encontrado: 0,
        omitidos_item_ya_con_imagen: 0, // Cuenta items individuales que ya tenían imagen
        errores_busqueda: 0,
        errores_subida: 0, // Cuenta fallos al intentar subir (por título)
        errores_actualizacion: 0, // Cuenta fallos al intentar actualizar (por item ID)
        errores_otros: 0,
    };
    let erroresConsecutivos = 0;

    console.log(`⏳ Comenzando asociación para ${resultados.total_json} items del JSON...`);

    for (let index = 0; index < antecedentes.length; index++) {
        const itemOriginal = antecedentes[index];
        const itemNumero = index + 1;
        const titulo = itemOriginal.Titulo;

        if (!titulo) {
            console.warn(`⚠️ [Item ${itemNumero}/${resultados.total_json}] Registro sin título. Omitiendo.`);
            resultados.items_omitidos_total++;
            resultados.errores_otros++;
            continue;
        }

        console.log(`\n--- Procesando Título ${itemNumero}/${resultados.total_json}: "${titulo}" ---`);

        let necesitaSubida = false;
        let itemsParaActualizar = [];
        let imagenLocalPath = null;
        let itemsEncontradosInfo = [];

        try {
            // a) Buscar imagen local (solo una vez por título)
            imagenLocalPath = await encontrarArchivoImagen(titulo, IMAGENES_DIR);
            if (!imagenLocalPath) {
                resultados.omitidos_sin_imagen_local++;
                resultados.items_omitidos_total++;
                continue; // Saltar al siguiente título si no hay imagen local
            }

            // b) Buscar TODOS los items en Directus con ese título
            const resultadoBusqueda = await buscarItemsPorTitulo(titulo, currentToken); // Usa la función plural

            if (resultadoBusqueda === 'no_encontrado') {
                resultados.omitidos_item_no_encontrado++;
                resultados.items_omitidos_total++;
                continue;
            } else if (resultadoBusqueda === 'error') {
                 resultados.errores_busqueda++;
                 resultados.items_omitidos_total++; // Lo contamos como omitido también
                 erroresConsecutivos++;
                 if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) break;
                 continue;
            } else {
                // Tenemos un array de items (resultadoBusqueda)
                itemsEncontradosInfo = resultadoBusqueda;

                // Determinar si necesitamos subir la imagen y qué items actualizar
                itemsEncontradosInfo.forEach(itemInfo => {
                    if (!itemInfo.tieneImagen) {
                        necesitaSubida = true; // Si al menos uno no tiene imagen, hay que subirla
                        itemsParaActualizar.push(itemInfo.id); // Añadir ID a la lista de pendientes
                    } else {
                        console.log(`ℹ️ Item ID ${itemInfo.id} (Título: "${titulo}") ya tiene imagen. Se omitirá su actualización.`);
                        resultados.omitidos_item_ya_con_imagen++;
                        // No incrementamos items_omitidos_total aquí, porque el título sí se procesó parcialmente
                    }
                });
            }

             // Si no hay items que necesiten actualización (todos ya tenían imagen o no se encontraron), saltar
             if (itemsParaActualizar.length === 0 && !necesitaSubida) {
                 console.log(`ℹ️ No hay items válidos para actualizar para el título "${titulo}".`);
                 // No contamos como omitido total aquí si encontramos items pero ya tenían imagen.
                 continue;
             }

             // Si estamos en modo 'omitir' duplicados y encontramos más de 1 item, nos detenemos aquí
             if (DUPLICATE_HANDLING_MODE === 'omitir' && itemsEncontradosInfo.length > 1) {
                 console.warn(`⚠️ DUPLICADO (Modo Omitir): Se encontraron ${itemsEncontradosInfo.length} items. Omitiendo título "${titulo}".`);
                 // Contar cuántos items se omitieron debido a esta regla
                 resultados.items_omitidos_total += itemsEncontradosInfo.length - resultados.omitidos_item_ya_con_imagen; // Sumar los que no tenían imagen
                 continue;
             }

            // ---------- INICIO LÓGICA DE SUBIDA Y ACTUALIZACIÓN ----------

            let fileId = null; // ID del archivo subido para este título

            // c) Subir imagen SI ES NECESARIO (solo una vez por título)
            if (necesitaSubida && !SIMULATE) {
                try {
                    console.log(`... Intentando subir imagen para título "${titulo}" ...`);
                    fileId = await subirImagenADirectus(imagenLocalPath, currentToken);
                } catch (uploadError) {
                     console.error(`❌ Error subiendo imagen para "${titulo}". No se actualizarán items para este título.`);
                     resultados.errores_subida++;
                     resultados.items_omitidos_total += itemsParaActualizar.length; // Los que iban a ser actualizados ahora se omiten
                     erroresConsecutivos++;
                     if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) break;
                     await wait(500);
                     continue; // Saltar al siguiente TÍTULO del JSON
                }
                if (!fileId) {
                     console.error(`❌ Fallo inesperado al obtener File ID para "${titulo}" tras intento de subida. No se actualizarán items.`);
                     resultados.errores_subida++;
                     resultados.items_omitidos_total += itemsParaActualizar.length;
                     erroresConsecutivos++;
                     if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) break;
                     await wait(500);
                     continue; // Saltar al siguiente TÍTULO del JSON
                }
            } else if (necesitaSubida && SIMULATE) {
                console.log(`🔵 [SIMULACIÓN] Se subiría la imagen "${path.basename(imagenLocalPath)}" para el título "${titulo}".`);
                fileId = 'simulated-file-id-' + index; // Simular un ID de archivo
            }


            // d) Actualizar TODOS los items pendientes para este título
            if (fileId && itemsParaActualizar.length > 0) {
                console.log(`... Intentando actualizar ${itemsParaActualizar.length} item(s) para "${titulo}" con File ID: ${fileId} ...`);
                for (const itemIdToUpdate of itemsParaActualizar) {
                    let actualizado = false;
                    try {
                         if (SIMULATE) {
                              console.log(`🔵 [SIMULACIÓN] Se actualizaría el item ID ${itemIdToUpdate} con File ID ${fileId}.`);
                              actualizado = true; // Simular éxito
                         } else {
                              actualizado = await actualizarItemConImagen(itemIdToUpdate, fileId, currentToken);
                         }

                         if (actualizado) {
                              console.log(`✅ Item ID ${itemIdToUpdate} actualizado exitosamente para "${titulo}".`);
                              resultados.items_actualizados++;
                              // Resetear contador de errores consecutivos tras un éxito PARCIAL (actualización de un item)
                              // Podríamos discutir si resetearlo solo si TODOS los items del título se actualizan,
                              // pero resetear aquí es más simple y permite continuar si falla solo uno.
                              erroresConsecutivos = 0;
                         } else {
                              // El error ya se logueó dentro de actualizarItemConImagen si falló tras reintentos
                              resultados.errores_actualizacion++;
                              resultados.items_omitidos_total++; // Este item específico no se pudo actualizar
                              erroresConsecutivos++;
                         }
                    } catch (updateError) {
                        // Error lanzado por actualizarItemConImagen (ej. 401, 403, 400 o tras reintentos)
                        console.error(`❌ Error actualizando item ${itemIdToUpdate} para "${titulo}".`);
                        resultados.errores_actualizacion++;
                        resultados.items_omitidos_total++;
                        erroresConsecutivos++;
                        // Si el error es crítico (ej: auth), podríamos querer parar todo el proceso
                        // if (updateError.response?.status === 401 || updateError.response?.status === 403) break; // Romper bucle interno
                    }
                     // Detener si hay demasiados errores consecutivos INCLUSO DENTRO del bucle de actualización
                    if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) {
                         console.error(`🚨 Demasiados errores consecutivos (${erroresConsecutivos}) durante actualización. Deteniendo.`);
                         break; // Romper bucle interno (de itemsParaActualizar)
                    }
                    // Pausa breve entre actualizaciones del MISMO título si son muchas
                    if (itemsParaActualizar.length > 5) await wait(100);
                } // Fin for interno (itemsParaActualizar)
            } else if (necesitaSubida && !fileId) {
                 // Esto no debería ocurrir si la lógica de subida es correcta, pero por si acaso
                 console.error(` Lógica inconsistente: Se necesitaba subida para "${titulo}" pero no se obtuvo fileId. Items no actualizados: ${itemsParaActualizar.join(', ')}`);
                 resultados.items_omitidos_total += itemsParaActualizar.length;
            }


        } catch (error) {
             // Captura errores inesperados ANTES de la lógica de subida/actualización para este título
             console.error(`🔥🔥 Error inesperado procesando título "${titulo}": ${error.message}`);
             resultados.items_omitidos_total++; // Contar como omitido si falla antes de intentar actualizar
             resultados.errores_otros++;
             erroresConsecutivos++;
             if (DEBUG) console.error(error);
        }

        // Detener bucle principal si hay demasiados errores
        if (erroresConsecutivos >= MAX_CONSECUTIVE_ERRORS) {
             console.error(`🚨 Demasiados errores consecutivos (${erroresConsecutivos}). Deteniendo proceso principal.`);
             break; // Romper bucle externo (principal)
        }

        // Pausa breve entre procesamiento de TÍTULOS diferentes
        if (index < antecedentes.length - 1) {
            await wait(250);
        }
    } // Fin for loop principal

    // 5. Mostrar Resumen Final (Ajustado)
    console.log(`\n🏁 Proceso de Asociación Finalizado 🏁`);

    // Calcular otros errores basado en los omitidos no explicados
    resultados.errores_otros = resultados.items_omitidos_total - (
        resultados.omitidos_sin_imagen_local +
        resultados.omitidos_item_no_encontrado +
        // No sumamos omitidos_item_ya_con_imagen porque no cuentan como omitidos totales
        resultados.errores_busqueda +
        resultados.errores_subida +
        resultados.errores_actualizacion
    );
     // Ajustar si el cálculo anterior dio negativo o si hubo títulos sin nombre
     const titulosSinNombre = antecedentes.filter(item => !item.Titulo).length;
     resultados.errores_otros = Math.max(0, resultados.errores_otros) + titulosSinNombre;


    console.log(`
    📊 Resumen de Asociación:
    =========================================
    Total de Títulos en JSON:    ${resultados.total_json}
    ─────────────────────────────────────────
    ✅ Items Actualizados:           ${resultados.items_actualizados}
    ℹ️ Items Omitidos (Ya Tenían Img):${resultados.omitidos_item_ya_con_imagen}
    ❌ Items Omitidos/Fallidos:     ${resultados.items_omitidos_total}
       • Omitidos (Sin Imagen Local): ${resultados.omitidos_sin_imagen_local}
       • Omitidos (Item No Encontrado):${resultados.omitidos_item_no_encontrado}
       • Errores Buscando Item(s):   ${resultados.errores_busqueda}
       • Errores de Subida (x Título):${resultados.errores_subida}
       • Errores de Actualización (x ID):${resultados.errores_actualizacion}
       • Otros Errores/Sin Título:  ${resultados.errores_otros}
    =========================================
    * Nota: Un título con duplicados puede resultar en múltiples 'Items Actualizados'.
    * 'Items Omitidos/Fallidos' incluye items que no se encontraron, no tenían imagen local, o fallaron durante la búsqueda/subida/actualización.
    `);
}

// --- Ejecución ---
asociarImagenes().catch(error => {
    console.error('\n🔥🔥 Error Inesperado Fuera del Bucle Principal 🔥🔥');
    console.error(error.message);
    if (DEBUG) console.error(error);
});