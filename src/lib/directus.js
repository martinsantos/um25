import axios from 'axios';

// Environment configuration for Directus
const isDevelopment = import.meta.env.MODE === 'development';
const useDirectus = import.meta.env.USE_DIRECTUS === 'true';
const baseURL = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

// Create Directus client with timeout and error handling
export const directus = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
});

// Helper to check if Directus should be used
export const shouldUseDirectus = () => {
  return useDirectus && !isDevelopment;
};

directus.interceptors.request.use(config => {
  console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
  console.log('Request params:', config.params);
  return config;
});

directus.interceptors.response.use(
  response => {
    console.log('Response received:', {
      status: response.status,
      dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A'
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Helper functions for API endpoints
export async function getServicios(limit = 50) {
  try {
    const response = await directus.get('/items/Servicios', {
      params: { limit, sort: '-id' }
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching servicios:', error);
    return [];
  }
}

export async function getCasosExito(limit = 50) {
  try {
    const response = await directus.get('/items/antecedentes', {
      params: { limit, sort: '-id' }
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching antecedentes:', error);
    return [];
  }
}

export async function getBlogPosts(limit = 50) {
  try {
    const response = await directus.get('/items/blog_posts', {
      params: { limit, sort: '-date_created' }
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}
