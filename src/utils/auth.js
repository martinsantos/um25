/**
 * Utilidades de autenticación para la comunicación con Directus
 */

/**
 * Obtiene el token estático para autenticación con Directus
 * @returns {string} Token de autenticación
 */
export function getStaticToken() {
  return import.meta.env.DIRECTUS_STATIC_TOKEN || import.meta.env.PUBLIC_DIRECTUS_TOKEN || '';
}

/**
 * Obtiene los headers de autenticación para las peticiones a Directus
 * @returns {Object} Headers con el token de autenticación
 */
export function getAuthHeaders() {
  const token = getStaticToken();
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Verifica si el token de autenticación es válido
 * @returns {Promise<boolean>} True si el token es válido
 */
export async function verifyToken() {
  const isDevelopment = import.meta.env.MODE === 'development';
  const useDirectus = import.meta.env.USE_DIRECTUS === 'true';
  
  // In development or when Directus is disabled, skip verification
  if (isDevelopment || !useDirectus) {
    return true;
  }
  
  try {
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/users/me`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Token verification failed, continuing with static data:', error.message);
    return false; // Fail gracefully
  }
}

/**
 * Obtiene los datos de un antecedente por su ID
 * @param {string} id ID del antecedente
 * @returns {Promise<Object>} Antecedente obtenido
 */
export async function fetchAntecedente(id) {
  try {
    const url = `${import.meta.env.PUBLIC_DIRECTUS_URL}/items/antecedentes/${id}?fields=*.*.*,Galeria.directus_files_id.*,Servicios.Servicios_id.*,Imagen.*,ImagenFondo.*,documentos.*`;
    
    const response = await fetch(url, { headers: getAuthHeaders() });
    
    if (!response.ok) throw new Error('Antecedente no encontrado');
    const result = await response.json();
    
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
