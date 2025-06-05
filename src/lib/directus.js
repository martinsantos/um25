import axios from 'axios';

const baseURL = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

export const directus = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
