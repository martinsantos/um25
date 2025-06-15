/**
 * Utilidades de autenticación para la comunicación con Directus
 */

/**
 * Obtiene el token estático para autenticación con Directus
 * @returns {string} Token de autenticación
 */
export function getStaticToken() {
  return import.meta.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
}

/**
 * Obtiene los headers de autenticación para las peticiones a Directus
 * @returns {Object} Headers con el token de autenticación
 */
export function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${getStaticToken()}`
  };
}

/**
 * Verifica si el token de autenticación es válido
 * @returns {Promise<boolean>} True si el token es válido
 */
export async function verifyToken() {
  try {
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/users/me`, {
      headers: getAuthHeaders()
    });
    return response.ok;
  } catch (error) {
    console.error('Error verificando token:', error);
    return false;
  }
}

/**
 * Obtiene los datos de un antecedente por su ID
 * @param {string} id ID del antecedente
 * @returns {Promise<Object>} Datos del antecedente
 */
export async function fetchAntecedente(id) {
  try {
    const url = `${import.meta.env.PUBLIC_DIRECTUS_URL}/items/antecedentes/${id}?fields=*.*.*,Galeria.directus_files_id.*,Servicios.Servicios_id.*,Imagen.*,ImagenFondo.*,documentos.*`;
    console.log('Fetching antecedente from:', url);
    
    const response = await fetch(url, { headers: getAuthHeaders() });
    
    if (!response.ok) throw new Error('Antecedente no encontrado');
    const result = await response.json();
    
    // Log the structure of the returned data
    console.log('Antecedente data structure:', {
      hasImagenFondo: !!result.data.ImagenFondo,
      imagenFondoType: typeof result.data.ImagenFondo,
      imagenFondoKeys: result.data.ImagenFondo ? Object.keys(result.data.ImagenFondo) : [],
      isArray: Array.isArray(result.data.ImagenFondo)
    });
    
    if (result.data.ImagenFondo) {
      console.log('ImagenFondo data:', JSON.stringify(result.data.ImagenFondo, null, 2));
    }
    
    return result.data;
  } catch (error) {
    console.error('Error obteniendo antecedente:', error);
    throw error;
  }
}

/**
 * Genera un slug a partir de un título
 * @param {string} title Título para generar el slug
 * @returns {string} Slug generado
 */
export function generateSlug(title) {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
