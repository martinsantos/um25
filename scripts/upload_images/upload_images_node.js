const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuración
const CONFIG = {
  directusUrl: 'http://localhost:8055',
  token: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
  uploadsDir: '/directus/uploads/local',
  tempDir: '/tmp/directus_uploads'
};

// Configurar axios
const api = axios.create({
  baseURL: CONFIG.directusUrl,
  headers: {
    'Authorization': `Bearer ${CONFIG.token}`,
    'Content-Type': 'application/json'
  }
});

// Función para obtener el ID del usuario administrador
async function getAdminId() {
  try {
    const response = await api.get('/users', {
      params: {
        'filter[email][_eq]': 'admin@example.com'
      }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].id;
    }
    throw new Error('No se encontró el usuario administrador');
  } catch (error) {
    console.error('Error al obtener el ID del administrador:', error.message);
    throw error;
  }
}

// Función para subir un archivo a Directus
async function uploadFile(filePath, adminId) {
  const fileName = path.basename(filePath);
  
  try {
    // Verificar si el archivo ya existe
    const existingFile = await api.get('/files', {
      params: {
        'filter[filename_download][_eq]': fileName
      }
    });
    
    if (existingFile.data.data && existingFile.data.data.length > 0) {
      console.log(`El archivo ${fileName} ya existe en Directus, omitiendo...`);
      return existingFile.data.data[0].id;
    }
    
    // Crear FormData para la carga del archivo
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    // Agregar metadatos
    form.append('data', JSON.stringify({
      title: fileName,
      filename_download: fileName,
      storage: 'local',
      uploaded_by: adminId
    }));
    
    // Configurar headers para FormData
    const headers = {
      ...form.getHeaders(),
      'Authorization': `Bearer ${CONFIG.token}`,
      'Content-Length': form.getLengthSync()
    };
    
    // Subir el archivo
    const response = await axios.post(
      `${CONFIG.directusUrl}/files/import`,
      form,
      { headers }
    );
    
    console.log(`Archivo ${fileName} subido correctamente con ID: ${response.data.data.id}`);
    return response.data.data.id;
    
  } catch (error) {
    console.error(`Error al subir el archivo ${fileName}:`, error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    return null;
  }
}

// Función para vincular una imagen a un post
async function linkImageToPost(collection, postId, fileId) {
  try {
    // Verificar si el post existe
    const postResponse = await api.get(`/items/${collection}/${postId}`);
    
    if (!postResponse.data.data) {
      console.log(`El post con ID ${postId} no existe en la colección ${collection}`);
      return false;
    }
    
    // Actualizar el campo de imagen
    const updateResponse = await api.patch(
      `/items/${collection}/${postId}`,
      { Imagen: fileId }
    );
    
    console.log(`Imagen ${fileId} vinculada correctamente a ${collection} ID ${postId}`);
    return true;
    
  } catch (error) {
    console.error(`Error al vincular imagen a ${collection} ID ${postId}:`, error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    return false;
  }
}

// Función principal
async function main() {
  try {
    // Verificar si el directorio de subidas existe
    if (!fs.existsSync(CONFIG.uploadsDir) || !fs.statSync(CONFIG.uploadsDir).isDirectory()) {
      console.error(`El directorio de subidas no existe: ${CONFIG.uploadsDir}`);
      return;
    }
    
    // Obtener ID del administrador
    console.log('Obteniendo ID del administrador...');
    const adminId = await getAdminId();
    console.log(`ID del administrador: ${adminId}`);
    
    // Leer archivos del directorio de subidas
    const files = fs.readdirSync(CONFIG.uploadsDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png'].includes(ext);
      });
    
    console.log(`\nEncontrados ${files.length} archivos para procesar`);
    
    // Procesar cada archivo
    for (const file of files) {
      const filePath = path.join(CONFIG.uploadsDir, file);
      console.log(`\nProcesando: ${file}`);
      
      // Subir el archivo
      const fileId = await uploadFile(filePath, adminId);
      if (!fileId) continue;
      
      // Extraer información del nombre del archivo
      const fileName = path.basename(file, path.extname(file));
      const parts = fileName.split('_');
      
      // Verificar si el primer segmento es un ID numérico
      if (parts.length > 0 && /^\d+$/.test(parts[0])) {
        const postId = parts[0];
        let collection;
        
        // Determinar la colección basada en el nombre del archivo
        if (fileName.includes('ant_') || fileName.startsWith(`${postId}_ant_`)) {
          collection = 'Antecedentes';
        } else {
          collection = 'Servicios';
        }
        
        // Vincular la imagen al post
        await linkImageToPost(collection, postId, fileId);
      } else {
        console.log(`No se pudo extraer un ID de post válido de: ${fileName}`);
      }
    }
    
    console.log('\nProceso completado.');
    
  } catch (error) {
    console.error('Error en el proceso principal:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
