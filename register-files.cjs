const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const DIRECTUS_URL = 'http://localhost:8055';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkzYmZkZjI4LWU4YjEtNGU3OS1hNzNhLTkyY2Q3Y2ZlMTE5YiIsInJvbGUiOiI3NGUzYjA1ZS0wZjE0LTQyMmUtOWFkMy03NTlkNDI2ZGI2MGEiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc0NjU1NjI2MywiZXhwIjoxNzQ2NTU3MTYzLCJpc3MiOiJkaXJlY3R1cyJ9.SKtZkBgmMcQzwoNRtrYciqb86PTjx2s5DHRESnxZZdc';
const UPLOADS_DIR = './local-uploads';

async function registerFiles() {
    const files = fs.readdirSync(UPLOADS_DIR);

    for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));

            try {
                const response = await axios.post(`${DIRECTUS_URL}/files`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${TOKEN}`
                    }
                });
                console.log(`✅ Archivo subido: ${file} (ID: ${response.data.data.id})`);
            } catch (error) {
                console.error(`❌ Error subiendo ${file}:`, error.response?.data?.errors?.[0]?.message || error.message);
            }
        }
    }
}

// Ejecutar la función
registerFiles().catch(console.error);