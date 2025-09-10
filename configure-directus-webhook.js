#!/usr/bin/env node
// configure-directus-webhook.js - Configuración automática de webhook Directus
// UM CLI 1.2.0 - Sistema de actualización automática

const axios = require('axios');

// Configuración
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@ultimamilla.local';
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'admin123dev';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4321/api/rebuild';
const WEBHOOK_SECRET = process.env.DIRECTUS_WEBHOOK_SECRET || 'um-cli-2024-secure-webhook';

console.log('🔄 Configurando webhook automático en Directus...');
console.log(`📍 Directus URL: ${DIRECTUS_URL}`);
console.log(`🎯 Webhook URL: ${WEBHOOK_URL}`);

// Función para autenticar en Directus
async function authenticate() {
    try {
        console.log('🔐 Autenticando en Directus...');
        const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: DIRECTUS_EMAIL,
            password: DIRECTUS_PASSWORD
        });
        
        const token = response.data.data.access_token;
        console.log('✅ Autenticación exitosa');
        return token;
    } catch (error) {
        console.error('❌ Error en autenticación:', error.response?.data || error.message);
        throw error;
    }
}

// Función para verificar webhooks existentes
async function getExistingWebhooks(token) {
    try {
        console.log('🔍 Verificando webhooks existentes...');
        const response = await axios.get(`${DIRECTUS_URL}/flows`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: {
                'filter[name][_contains]': 'Auto Rebuild'
            }
        });
        
        return response.data.data;
    } catch (error) {
        console.error('❌ Error verificando webhooks:', error.response?.data || error.message);
        return [];
    }
}

// Función para crear webhook flow
async function createWebhookFlow(token) {
    try {
        console.log('🔨 Creando flow para webhook...');
        
        // Primero crear el flow
        const flowResponse = await axios.post(`${DIRECTUS_URL}/flows`, {
            name: 'UM CLI Auto Rebuild',
            description: 'Trigger automático para rebuild del sitio cuando cambie contenido',
            icon: 'refresh',
            status: 'active',
            trigger: 'event',
            accountability: 'all',
            options: {
                type: 'filter',
                scope: ['items.create', 'items.update', 'items.delete'],
                collections: ['servicios', 'casos_de_exito', 'blog_posts', 'antecedentes']
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const flowId = flowResponse.data.data.id;
        console.log(`✅ Flow creado con ID: ${flowId}`);
        
        // Crear la operación webhook
        const operationResponse = await axios.post(`${DIRECTUS_URL}/operations`, {
            name: 'Send Rebuild Webhook',
            key: 'webhook_rebuild',
            type: 'webhook',
            flow: flowId,
            position_x: 19,
            position_y: 1,
            options: {
                method: 'POST',
                url: WEBHOOK_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': WEBHOOK_SECRET
                },
                body: JSON.stringify({
                    token: WEBHOOK_SECRET,
                    event: '{{$trigger.event}}',
                    collection: '{{$trigger.collection}}',
                    key: '{{$trigger.key}}',
                    payload: '{{$trigger.payload}}',
                    timestamp: '{{$now}}'
                })
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Operación webhook creada');
        
        return { flowId, operationId: operationResponse.data.data.id };
        
    } catch (error) {
        console.error('❌ Error creando webhook:', error.response?.data || error.message);
        throw error;
    }
}

// Función para probar el webhook
async function testWebhook() {
    try {
        console.log('🧪 Probando webhook...');
        
        const response = await axios.post(WEBHOOK_URL, {
            token: WEBHOOK_SECRET,
            event: 'test',
            collection: 'test',
            timestamp: new Date().toISOString()
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 segundos timeout
        });
        
        console.log('✅ Test de webhook exitoso:', response.data);
        return true;
        
    } catch (error) {
        console.log('⚠️ Test de webhook falló:', error.response?.data || error.message);
        return false;
    }
}

// Función principal
async function main() {
    try {
        console.log('🚀 Iniciando configuración de webhook Directus...');
        
        // Autenticar
        const token = await authenticate();
        
        // Verificar webhooks existentes
        const existingWebhooks = await getExistingWebhooks(token);
        if (existingWebhooks.length > 0) {
            console.log(`⚠️ Encontrados ${existingWebhooks.length} webhooks existentes de Auto Rebuild`);
            for (const webhook of existingWebhooks) {
                console.log(`   - ${webhook.name} (ID: ${webhook.id})`);
            }
            
            const shouldContinue = process.argv.includes('--force');
            if (!shouldContinue) {
                console.log('💡 Usa --force para crear webhook adicional');
                return;
            }
        }
        
        // Crear webhook
        const { flowId, operationId } = await createWebhookFlow(token);
        
        // Test webhook
        console.log('\n⏳ Esperando que el sitio esté listo para testing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const testResult = await testWebhook();
        
        console.log('\n🎉 ¡Configuración completada!');
        console.log('📊 Resumen:');
        console.log(`   - Flow ID: ${flowId}`);
        console.log(`   - Operation ID: ${operationId}`);
        console.log(`   - Webhook URL: ${WEBHOOK_URL}`);
        console.log(`   - Test Result: ${testResult ? '✅ Exitoso' : '⚠️ Con advertencias'}`);
        console.log('\n📋 El webhook se activará cuando haya cambios en:');
        console.log('   - servicios');
        console.log('   - casos_de_exito');
        console.log('   - blog_posts');
        console.log('   - antecedentes');
        
        console.log('\n🔧 Para verificar funcionamiento:');
        console.log(`   1. Accede a ${DIRECTUS_URL}/admin`);
        console.log('   2. Ve a Settings > Flows');
        console.log('   3. Busca "UM CLI Auto Rebuild"');
        console.log('   4. Haz cambios en contenido para probar');
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Error en configuración:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { authenticate, createWebhookFlow, testWebhook };
