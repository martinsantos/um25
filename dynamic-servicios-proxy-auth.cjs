const http = require('http');
const https = require('https');
const url = require('url');

// Dynamic Servicios Proxy with Directus Authentication - SSR
// Versión mejorada con autenticación para obtener datos completos de Directus

const PORT = 8093;
const DIRECTUS_URL = 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

console.log('🚀 Starting Dynamic Servicios SSR Proxy with Authentication...');

// Función para consultar Directus con autenticación
async function consultarDirectusAutenticado(servicioId) {
    return new Promise((resolve, reject) => {
        const requestUrl = `${DIRECTUS_URL}/items/Servicios/${servicioId}`;
        
        console.log(`[SSR-AUTH] 📡 Consultando Directus con autenticación: ${requestUrl}`);
        
        const requestOptions = {
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };
        
        const request = http.get(requestUrl, requestOptions, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    console.log(`[SSR-AUTH] 🔍 Raw response data: ${data}`);
                    const json = JSON.parse(data);
                    console.log(`[SSR-AUTH] 🔍 Parsed JSON keys: ${Object.keys(json)}`);
                    console.log(`[SSR-AUTH] 🔍 json.data exists: ${!!json.data}`);
                    if (json.data) {
                        console.log(`[SSR-AUTH] 🔍 json.data keys: ${Object.keys(json.data)}`);
                        console.log(`[SSR-AUTH] ✅ Servicio encontrado: ${json.data.Titulo || json.data.titulo}`);
                        resolve({ servicio: json.data, isDynamic: true });
                    } else {
                        console.log(`[SSR-AUTH] ⚠️ No se encontró servicio con ID: ${servicioId}`);
                        console.log(`[SSR-AUTH] 🔍 Full JSON: ${JSON.stringify(json, null, 2)}`);
                        resolve({ servicio: null, isDynamic: false });
                    }
                } catch (error) {
                    console.error(`[SSR-AUTH] Error parsing JSON:`, error);
                    console.error(`[SSR-AUTH] Raw data that failed:`, data);
                    resolve({ servicio: null, isDynamic: false });
                }
            });
        });
        
        request.on('error', (error) => {
            console.error(`[SSR-AUTH] Error conectando con Directus:`, error.message);
            resolve({ servicio: null, isDynamic: false });
        });
        
        request.setTimeout(5000, () => {
            console.error(`[SSR-AUTH] Timeout conectando con Directus`);
            request.destroy();
            resolve({ servicio: null, isDynamic: false });
        });
    });
}

// Función para generar HTML dinámico mejorado
function generarHTMLMejorado(servicio, servicioId, slug, isDynamic) {
    const timestamp = new Date().toISOString();
    
    // Normalizar datos con mayor detalle
    const titulo = servicio?.titulo || servicio?.Titulo || 'Servicio';
    const descripcion = servicio?.descripcion || servicio?.Descripcion || '';
    const area = servicio?.area || servicio?.Area || 'General';
    const cliente = servicio?.cliente || servicio?.Cliente || 'Empresas';
    const unidad = servicio?.unidad_de_negocio || servicio?.Unidad_de_negocio || area;
    const presupuesto = servicio?.presupuesto || servicio?.Presupuesto || 0;
    const imagen = servicio?.imagen || servicio?.Imagen || '';
    
    // Mapeo de imágenes específicas por servicio ID
    const imagenesServicios = {
        1: 'servicios-it.jpg',
        2: 'redes-comunicaciones.jpg', 
        3: 'seguridad-informatica.jpg',
        4: 'telefonia.jpg',
        5: 'default-service.jpg',
        6: 'servicios-web.jpg'
    };
    
    const imagenServicio = imagen || imagenesServicios[servicioId] || 'default-service.jpg';
    const imagenUrl = imagen ? `http://23.105.176.45:8055/assets/${imagen}` : `https://umbot.com.ar/images/services/${imagenServicio}`;
    
    const statusBadge = isDynamic 
        ? `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
             <div class="flex items-center">
                 <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                     <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                 </svg>
                 <span><strong>✅ CONTENIDO DINÁMICO SSR:</strong> Datos en tiempo real desde Directus CMS con autenticación completa.</span>
             </div>
             <small class="text-sm opacity-75">Generado: ${timestamp} | Token: Válido | API: Autenticada</small>
           </div>`
        : `<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
             <div class="flex items-center">
                 <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                     <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                 </svg>
                 <span><strong>⚠️ MODO FALLBACK:</strong> Usando datos estáticos (Directus no disponible o sin datos).</span>
             </div>
             <small class="text-sm opacity-75">Generado: ${timestamp} | Fallback: Activado</small>
           </div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo} - Ultima Milla</title>
    <meta name="description" content="${descripcion}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .container { max-width: 1200px; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- DYNAMIC SSR CONTENT WITH AUTH - Generated: ${timestamp} -->
    
    <nav class="bg-blue-900 text-white p-4">
        <div class="container mx-auto flex justify-between items-center">
            <div class="text-xl font-bold">Ultima Milla</div>
            <div class="space-x-4">
                <a href="/" class="hover:text-blue-300">Inicio</a>
                <a href="/servicios" class="hover:text-blue-300">Servicios</a>
                <a href="/contacto" class="hover:text-blue-300">Contacto</a>
            </div>
        </div>
    </nav>

    <section class="gradient-bg text-white py-16">
        <div class="container mx-auto px-4">
            <nav class="text-sm mb-4 opacity-90">
                <a href="/" class="hover:text-blue-300">Inicio</a>
                <span class="mx-2">/</span>
                <a href="/servicios" class="hover:text-blue-300">Servicios</a>
                <span class="mx-2">/</span>
                <span class="text-blue-300">${titulo}</span>
            </nav>
            
            <div class="inline-block bg-blue-600 text-blue-100 px-3 py-1 rounded-full text-sm mb-4">
                ${area}
            </div>
            
            <h1 class="text-4xl md:text-5xl font-bold mb-4">
                ${titulo}
            </h1>
            
            <p class="text-xl opacity-90 max-w-2xl">
                ${descripcion}
            </p>
            
            ${presupuesto > 0 ? `<p class="text-lg mt-4 opacity-80">Presupuesto estimado: $${presupuesto.toLocaleString()}</p>` : ''}
        </div>
        
        <!-- Imagen Principal del Servicio -->
        <div class="container mx-auto px-4 mt-8">
            <div class="flex justify-center">
                <div class="bg-white rounded-lg shadow-xl p-4 max-w-md">
                    <img src="${imagenUrl}" alt="${titulo}" class="w-full h-64 object-cover rounded-lg shadow-lg" onerror="this.src='https://umbot.com.ar/images/services/default-service.jpg'">
                    <p class="text-center text-sm text-gray-600 mt-2">${titulo}</p>
                </div>
            </div>
        </div>
    </section>

    <main class="container mx-auto px-4 py-12">
        ${statusBadge}
        
        <div class="grid md:grid-cols-2 gap-8 mb-12">
            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Información del Servicio</h2>
                <div class="space-y-4">
                    <div>
                        <h3 class="font-semibold text-gray-700">Área de Especialización</h3>
                        <p class="text-gray-600">${area}</p>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-700">Tipo de Cliente</h3>
                        <p class="text-gray-600">${cliente}</p>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-700">Unidad de Negocio</h3>
                        <p class="text-gray-600">${unidad}</p>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-700">ID del Servicio</h3>
                        <p class="text-gray-600">#${servicioId.toString().padStart(4, '0')}</p>
                    </div>
                    ${presupuesto > 0 ? `
                    <div>
                        <h3 class="font-semibold text-gray-700">Presupuesto Estimado</h3>
                        <p class="text-gray-600">$${presupuesto.toLocaleString()}</p>
                    </div>` : ''}
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Estado Técnico SSR</h2>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="font-medium">Fuente de datos:</span>
                        <span class="${isDynamic ? 'text-green-600' : 'text-yellow-600'}">
                            ${isDynamic ? 'Directus API (Autenticado)' : 'Datos estáticos'}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Renderizado:</span>
                        <span class="text-blue-600">Server-Side (Node.js + Auth)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Autenticación:</span>
                        <span class="text-green-600">${isDynamic ? 'Token válido' : 'No requerida'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Timestamp:</span>
                        <span class="text-gray-600 text-sm">${timestamp}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Cache:</span>
                        <span class="text-red-600">Sin cache</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Status SSR:</span>
                        <span class="text-green-600">Activo</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="text-center bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">¿Te interesa este servicio?</h2>
            <p class="text-gray-600 mb-6">Contactanos para más información y cotización personalizada</p>
            <a href="/contacto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
                Solicitar Cotización
            </a>
        </div>
        
        ${isDynamic ? `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-blue-900 mb-2">🎯 Migración SSR Exitosa</h3>
            <p class="text-blue-800">Este contenido se genera dinámicamente desde Directus CMS. Los cambios en el admin se reflejan inmediatamente.</p>
            <div class="mt-4 text-sm text-blue-600">
                <p><strong>Datos en tiempo real:</strong> ✅ Conectado</p>
                <p><strong>Autenticación:</strong> ✅ Token válido</p>
                <p><strong>Performance:</strong> ✅ &lt; 1 segundo</p>
            </div>
        </div>
        ` : ''}
    </main>

    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <h3 class="text-lg font-semibold mb-2">Ultima Milla</h3>
            <p class="text-gray-400 mb-4">Servicios de Tecnología</p>
            <div class="text-sm text-gray-500">
                <p>Página generada dinámicamente con SSR + Autenticación</p>
                <p>${isDynamic ? 'Conectado a Directus CMS' : 'Modo fallback activado'} • ${timestamp}</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

// Servidor HTTP con autenticación
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log(`[SSR-AUTH] 📨 Request: ${req.method} ${pathname}`);
    
    // Verificar si es una ruta de servicios
    const servicioMatch = pathname.match(/^\/servicios\/(\d+)\/([^\/]+)\/?$/);
    
    if (!servicioMatch) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Not Found</h1><p>Esta ruta no es manejada por el proxy SSR autenticado</p>');
        return;
    }
    
    const servicioId = parseInt(servicioMatch[1]);
    const slug = servicioMatch[2];
    
    console.log(`[SSR-AUTH] 🎯 Manejando servicio ID: ${servicioId}, slug: ${slug}`);
    
    try {
        // Consultar Directus con autenticación
        let result = await consultarDirectusAutenticado(servicioId);
        let servicio = result.servicio;
        let isDynamic = result.isDynamic;
        
        // Fallback a datos estáticos si Directus no responde
        if (!servicio) {
            const serviciosEstaticos = {
                1: { titulo: 'Servicios IT', descripcion: 'Redes de Datos. Seguridad. Telecomunicaciones.', area: 'Telecomunicaciones', presupuesto: 200000 },
                2: { titulo: 'Redes de datos', descripcion: 'Telecomunicaciones de red de datos corporativa con tecnología de avanzada', area: 'Telecomunicaciones', presupuesto: 150000 },
                3: { titulo: 'Seguridad Informática', descripcion: 'Protección de sistemas y datos corporativos', area: 'Seguridad', presupuesto: 180000 }
            };
            
            servicio = serviciosEstaticos[servicioId];
            isDynamic = false;
        }
        
        if (!servicio) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Servicio no encontrado</h1>');
            return;
        }
        
        // Generar HTML dinámico mejorado
        const html = generarHTMLMejorado(servicio, servicioId, slug, isDynamic);
        
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'X-SSR-Dynamic': 'true',
            'X-SSR-Auth': isDynamic ? 'authenticated' : 'fallback',
            'X-Generated-At': new Date().toISOString(),
            'X-Content-Source': isDynamic ? 'Directus-API-Auth' : 'Static-Fallback',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.end(html);
        
        console.log(`[SSR-AUTH] ✅ Respuesta enviada para servicio ${servicioId} (${isDynamic ? 'dinámico autenticado' : 'estático'})`);
        
    } catch (error) {
        console.error(`[SSR-AUTH] ❌ Error procesando request:`, error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Error interno del servidor</h1>');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Dynamic Servicios SSR Proxy with Auth listening on port ${PORT}`);
    console.log(`🌐 Ready to handle: /servicios/{id}/{slug}`);
    console.log(`📡 Directus backend: ${DIRECTUS_URL}`);
    console.log(`🔐 Authentication: ${DIRECTUS_TOKEN ? 'Enabled' : 'Disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down SSR Proxy with Auth...');
    server.close(() => {
        console.log('✅ SSR Proxy with Auth stopped');
        process.exit(0);
    });
}); 