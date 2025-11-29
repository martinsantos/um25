import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

// ─── CONFIGURACIONES ─────────────────────────────────────────────
const INPUT_FILE = './antev3.json';
const IMAGENES_DIR = './imagenes_ultrarealistas';
const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'adminpassword';
const PROVIDED_TOKEN = "bqvkfpf7Zl2-oZsCCtSdE8hRTms6YqD_";
const COLLECTION_NAME = 'Antecedentes';
const IMAGE_FIELD_NAME = 'Imagen';

const SIMULATE = false;  // true = simulación
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const DEBUG = true;
const MAX_CONSECUTIVE_ERRORS = 5;

// ─── ENDPOINTS ──────────────────────────────────────────────────
const ENDPOINTS = {
  items: `/items/${COLLECTION_NAME}`,
  files: `/files`,
  auth: '/auth/login',
  usersMe: '/users/me',
  serverPing: '/server/ping'
};

// ─── UTILIDADES ───────────────────────────────────────────────────
const esperar = ms => new Promise(r => setTimeout(r, ms));

let cacheImagenes = null;
async function cargarCacheImagenes() {
  if (!cacheImagenes) {
    try {
      const archivos = await fs.readdir(IMAGENES_DIR);
      cacheImagenes = archivos.filter(a => a.toLowerCase().endsWith('.png'));
      if (DEBUG) console.log(`Cache de imágenes: ${cacheImagenes.length} archivos en "${IMAGENES_DIR}"`);
    } catch (e) {
      console.error(`Error leyendo carpeta de imágenes: ${e.message}`);
      cacheImagenes = [];
    }
  }
  return cacheImagenes;
}

/**
 * Normaliza un string quitando acentos, espacios, guiones y otros caracteres para comparar.
 */
function normalizarCadena(cadena) {
  return cadena
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w\d_]/g, '');
}

/**
 * Busca imágenes LOCALES que "coincidan" con el título completo.
 * Esto permite, por ejemplo, que un segundo antecedente con el mismo título use
 * la segunda imagen local que coincida con ese título.
 */
async function buscarImagenesPorTituloCompleto(titulo) {
  await cargarCacheImagenes();
  const clave = normalizarCadena(titulo);
  // Filtra las imágenes que contengan toda o parte de la "clave" en su nombre.
  return cacheImagenes.filter(nombre => normalizarCadena(nombre).includes(clave));
}

async function eliminarArchivoDirectus(fileId, token) {
  try {
    await axios.delete(`${DIRECTUS_URL}${ENDPOINTS.files}/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (DEBUG) console.log(`Archivo ${fileId} eliminado en Directus.`);
  } catch (error) {
    console.error(`Error eliminando archivo ${fileId}: ${error.message}`);
  }
}

async function verificarServidor() {
  try {
    const resp = await axios.get(`${DIRECTUS_URL}${ENDPOINTS.serverPing}`, { timeout: 5000 });
    return resp.data === 'pong';
  } catch {
    return false;
  }
}

async function loginDirectus() {
  const resp = await axios.post(`${DIRECTUS_URL}${ENDPOINTS.auth}`, {
    email: DIRECTUS_EMAIL,
    password: DIRECTUS_PASSWORD
  }, { headers: { 'Content-Type': 'application/json' } });
  return resp.data.data.access_token;
}

async function verificarToken(token) {
  try {
    await axios.get(`${DIRECTUS_URL}${ENDPOINTS.usersMe}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Busca los items en Directus para un título dado.
 */
async function buscarItemsPorTitulo(titulo, token) {
  const url = `${DIRECTUS_URL}${ENDPOINTS.items}?filter[Titulo][_eq]=${encodeURIComponent(titulo)}&fields=id,${IMAGE_FIELD_NAME}`;
  try {
    const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const items = resp.data.data;
    if (!items || items.length === 0) return 'no_encontrado';
    return items.map(i => ({
      id: i.id,
      fileId: i[IMAGE_FIELD_NAME] || null,
    }));
  } catch (e) {
    console.error(`Error buscando items "${titulo}":`, e.response?.data || e.message);
    return 'error';
  }
}

/**
 * Sube una imagen a Directus, devolviendo su fileId.
 */
async function subirImagenADirectus(ruta, token, intento = 1) {
  const form = new FormData();
  try {
    const file = await fs.readFile(ruta);
    form.append('file', file, path.basename(ruta));
    const resp = await axios.post(`${DIRECTUS_URL}${ENDPOINTS.files}`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    if (DEBUG) console.log(`Subida OK: ${ruta} -> File ID: ${resp.data.data.id}`);
    return resp.data.data.id;
  } catch (e) {
    const st = e.response?.status;
    if ([400, 401, 403].includes(st)) throw e;
    if (intento < MAX_RETRIES) {
      await esperar(RETRY_DELAY * 2 ** (intento - 1));
      return subirImagenADirectus(ruta, token, intento + 1);
    } else {
      throw e;
    }
  }
}

/**
 * Asigna un fileId a un item en Directus.
 */
async function actualizarItemConImagen(itemId, fileId, token, intento = 1) {
  const url = `${DIRECTUS_URL}${ENDPOINTS.items}/${itemId}`;
  const payload = { [IMAGE_FIELD_NAME]: fileId };
  try {
    await axios.patch(url, payload, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (DEBUG) console.log(`Item ${itemId} asignado a File ID ${fileId}`);
    return true;
  } catch (e) {
    const st = e.response?.status;
    if ([400, 401, 403].includes(st)) throw e;
    if (intento < MAX_RETRIES) {
      await esperar(RETRY_DELAY * 2 ** (intento - 1));
      return actualizarItemConImagen(itemId, fileId, token, intento + 1);
    } else {
      throw e;
    }
  }
}

/**
 * Función principal:
 * - Para cada Título del JSON, busca los items en Directus.
 * - Busca las imágenes locales que "coincidan" con el título completo.
 * - Si hay varios items con el mismo título (duplicados), se asigna la imagen 2 al segundo, la imagen 3 al tercero, etc.
 *   Si no hay suficientes imágenes, se reutiliza la última.
 * - Si un item ya tenía imagen, se registra su fileId para intentar eliminarlo posteriormente.
 */
async function asignarSegundaImagenParaDuplicados() {
  if (!await verificarServidor()) {
    console.error('Directus no responde al ping.');
    return;
  }
  let token;
  if (PROVIDED_TOKEN && await verificarToken(PROVIDED_TOKEN)) {
    token = PROVIDED_TOKEN;
  } else {
    try {
      token = await loginDirectus();
    } catch (err) {
      console.error(`Error en login: ${err.message}`);
      return;
    }
  }

  let data;
  try {
    const raw = await fs.readFile(INPUT_FILE, 'utf8');
    data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('JSON inválido: no es un array');
  } catch (e) {
    console.error(`Error leyendo archivo JSON: ${e.message}`);
    return;
  }

  await cargarCacheImagenes();

  // Agrupamos por título exacto
  const mapaPorTitulo = {};
  for (const reg of data) {
    const titulo = reg.Titulo || '';
    if (!titulo) continue;
    if (!mapaPorTitulo[titulo]) {
      mapaPorTitulo[titulo] = [];
    }
    mapaPorTitulo[titulo].push(reg);
  }

  let archivosAEliminar = new Set();
  let resultados = {
    totalRegistros: data.length,
    actualizados: 0,
    omitidos: 0,
    errBusqueda: 0,
    errSubida: 0,
    errActualizar: 0,
    duplicadosDetectados: 0,
    duplicadosReemplazados: 0
  };
  let erroresConsec = 0;

  // Iterar cada Título distinto
  for (const titulo of Object.keys(mapaPorTitulo)) {
    // Buscar items en Directus
    const items = await buscarItemsPorTitulo(titulo, token);
    if (items === 'no_encontrado') {
      resultados.omitidos += mapaPorTitulo[titulo].length;
      continue;
    }
    if (items === 'error') {
      resultados.errBusqueda += mapaPorTitulo[titulo].length;
      resultados.omitidos += mapaPorTitulo[titulo].length;
      erroresConsec++;
      if (erroresConsec >= MAX_CONSECUTIVE_ERRORS) break;
      continue;
    }
    if (items.length > 1) {
      resultados.duplicadosDetectados++;
    }

    // Buscar imágenes locales coincidentes para este título completo
    const imagenesTitulo = await buscarImagenesPorTituloCompleto(titulo);
    if (!imagenesTitulo || imagenesTitulo.length === 0) {
      console.warn(`No se encontraron imágenes para "${titulo}". Se omiten ${items.length} item(s).`);
      resultados.omitidos += items.length;
      continue;
    }
    // Ordenar las imágenes encontradas
    imagenesTitulo.sort();

    // Asignar una imagen diferente a cada item. 
    // i=0 => imagenTitulo[0], i=1 => imagenTitulo[1], ... 
    // Si se acaban, se reutiliza la última.
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const indiceImagen = i < imagenesTitulo.length ? i : imagenesTitulo.length - 1;
      const ruta = path.join(IMAGENES_DIR, imagenesTitulo[indiceImagen]);

      try {
        if (!SIMULATE) {
          // Subir la imagen nueva
          const fileIdNuevo = await subirImagenADirectus(ruta, token);
          // Si tenía imagen previa, la marcamos para eliminar
          if (item.fileId) archivosAEliminar.add(item.fileId);
          // Actualizamos el item
          await actualizarItemConImagen(item.id, fileIdNuevo, token);

          resultados.actualizados++;
          if (items.length > 1) resultados.duplicadosReemplazados++;
          console.log(`"${titulo}": item ${item.id} asignado a "${path.basename(ruta)}".`);
        } else {
          console.log(`[SIMULACIÓN] Asignando "${path.basename(ruta)}" al item ${item.id}.`);
        }
        erroresConsec = 0;
      } catch (e) {
        console.error(`Error subiendo/actualizando item ${item.id} ("${titulo}"): ${e.message}`);
        resultados.errSubida++;
        erroresConsec++;
        if (erroresConsec >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`Se detiene por superar ${MAX_CONSECUTIVE_ERRORS} errores consecutivos.`);
          break;
        }
      }
      if (erroresConsec >= MAX_CONSECUTIVE_ERRORS) break;
      await esperar(250);
    }
    if (erroresConsec >= MAX_CONSECUTIVE_ERRORS) break;
  }

  // Eliminar archivos en Directus que fueron sustituidos (si no están en uso)
  // OJO: Esto elimina a ciegas, asumiendo que no se referencian en otro lado. 
  // Ajustar si se desea chequear "si sigue en uso" en la colección.
  for (const fileId of archivosAEliminar) {
    if (!SIMULATE) {
      try {
        await eliminarArchivoDirectus(fileId, token);
      } catch (e) {
        console.error(`No se pudo eliminar archivo ${fileId}: ${e.message}`);
      }
    } else {
      console.log(`[SIMULACIÓN] Se eliminaría el archivo ${fileId}.`);
    }
  }

  console.log(`
Proceso finalizado.
Resumen:
  Total de registros JSON:       ${resultados.totalRegistros}
  Items actualizados:            ${resultados.actualizados}
  Items omitidos:                ${resultados.omitidos}
  Errores de Búsqueda Items:     ${resultados.errBusqueda}
  Errores de Subida/Actualizar:  ${resultados.errSubida}
  Duplicados detectados:         ${resultados.duplicadosDetectados}
  Duplicados reemplazados:       ${resultados.duplicadosReemplazados}
`);
}

asignarSegundaImagenParaDuplicados().catch(e => {
  console.error('Error en ejecución principal:', e.message);
  if (DEBUG) console.error(e);
});
