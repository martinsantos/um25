// getRoles.js
import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'adminpassword';

async function getRoles() {
  try {
    // 1. Obtener token
    const login = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    const token = login.data.data.access_token;

    // 2. Obtener todos los roles
    const roles = await axios.get(`${DIRECTUS_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Roles disponibles:');
    console.log(roles.data.data);
    
    return roles.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getRoles();