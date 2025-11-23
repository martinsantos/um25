const http = require('http');
const https = require('https');
const url = require('url');

// Dynamic Servicios Proxy - SSR with Node.js
// Este servidor maneja /servicios/{id}/{slug} consultando Directus en tiempo real

const PORT = 8092;
const DIRECTUS_URL = 'http://umbot-directus:8055';

console.log('🚀 Starting Dynamic Servicios SSR Proxy...');

// Función para consultar Directus
async function consultarDirectus(servicioId) {
    return new Promise((resolve, reject) => {
        const requestUrl = `${DIRECTUS_URL}/items/servicios?filter[id][_eq]=${servicioId}`;
        
        console.log(`[SSR-PROXY] 📡 Consultando Directus: ${requestUrl}`);
        
        const request = http.get(requestUrl, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.length > 0) {
                        console.log(`[SSR-PROXY] ✅ Servicio encontrado: ${json.data[0].titulo || json.data[0].Titulo}`);
                        resolve(json.data[0]);
                    } else {
                        console.log(`[SSR-PROXY] ⚠️ No se encontró servicio con ID: ${servicioId}`);
                        resolve(null);
                    }
                } catch (error) {
                    console.error(`[SSR-PROXY] Error parsing JSON:`, error);
                    resolve(null);
                }
            });
        });
        
        request.on('error', (error) => {
            console.error(`[SSR-PROXY] Error conectando con Directus:`, error.message);
            resolve(null);
        });
        
        request.setTimeout(5000, () => {
            console.error(`[SSR-PROXY] Timeout conectando con Directus`);
            request.destroy();
            resolve(null);
        });
    });
}

// Función para generar HTML dinámico
function generarHTML(servicio, servicioId, slug, isDynamic) {
    const timestamp = new Date().toISOString();
    
    // Normalizar datos
    const titulo = servicio?.titulo || servicio?.Titulo || 'Servicio';
    const descripcion = servicio?.descripcion || servicio?.Descripcion || '';
    const area = servicio?.area || servicio?.Area || 'General';
    const cliente = servicio?.cliente || servicio?.Cliente || 'Empresas';
    const unidad = servicio?.unidad_de_negocio || servicio?.Unidad_de_negocio || area;
    
    const statusBadge = isDynamic 
        ? `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
             <strong>✅ CONTENIDO DINÁMICO SSR:</strong> Este contenido se genera en tiempo real desde Directus.
             <br><small>Generado: ${timestamp}</small>
           </div>`
        : `<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
             <strong>⚠️ MODO FALLBACK:</strong> Usando datos estáticos (Directus no disponible).
             <br><small>Generado: ${timestamp}</small>
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
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- DYNAMIC SSR CONTENT - Generated: ${timestamp} -->
    
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

    <section class="bg-gradient-to-r from-blue-800 to-purple-800 text-white py-16">
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
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Datos Técnicos</h2>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="font-medium">Fuente de datos:</span>
                        <span class="${isDynamic ? 'text-green-600' : 'text-yellow-600'}">
                            ${isDynamic ? 'Directus API' : 'Datos estáticos'}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Renderizado:</span>
                        <span class="text-blue-600">Server-Side (Node.js)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Timestamp:</span>
                        <span class="text-gray-600 text-sm">${timestamp}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Cache:</span>
                        <span class="text-red-600">No cacheado</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="text-center bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">¿Te interesa este servicio?</h2>
            <p class="text-gray-600 mb-6">Contactanos para más información y cotización personalizada</p>
            <a href="/contacto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
                Solicitar Cotización
            </a>
        </div>
    </main>

    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <h3 class="text-lg font-semibold mb-2">Ultima Milla</h3>
            <p class="text-gray-400 mb-4">Servicios de Tecnología</p>
            <div class="text-sm text-gray-500">
                <p>Página generada dinámicamente con SSR</p>
                <p>${isDynamic ? 'Conectado a Directus CMS' : 'Modo fallback activado'} • ${timestamp}</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

// Servidor HTTP
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log(`[SSR-PROXY] 📨 Request: ${req.method} ${pathname}`);
    
    // Verificar si es una ruta de servicios
    const servicioMatch = pathname.match(/^\/servicios\/(\d+)\/([^\/]+)\/?$/);
    
    if (!servicioMatch) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Not Found</h1><p>Esta ruta no es manejada por el proxy SSR</p>');
        return;
    }
    
    const servicioId = parseInt(servicioMatch[1]);
    const slug = servicioMatch[2];
    
    console.log(`[SSR-PROXY] 🎯 Manejando servicio ID: ${servicioId}, slug: ${slug}`);
    
    try {
        // Consultar Directus
        let servicio = await consultarDirectus(servicioId);
        let isDynamic = !!servicio;
        
        // Fallback a datos estáticos si Directus no responde
        if (!servicio) {
            const serviciosEstaticos = {
                1: { titulo: 'Servicios IT', descripcion: 'Redes de Datos. Seguridad. Telecomunicaciones.', area: 'Telecomunicaciones' },
                2: { titulo: 'Redes de datos', descripcion: 'Telecomunicaciones de red de datos corporativa con tecnología de avanzada', area: 'Telecomunicaciones' },
                3: { titulo: 'Seguridad Informática', descripcion: 'Protección de sistemas y datos corporativos', area: 'Seguridad' }
            };
            
            servicio = serviciosEstaticos[servicioId];
            isDynamic = false;
        }
        
        if (!servicio) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Servicio no encontrado</h1>');
            return;
        }
        
        // Generar HTML dinámico
        const html = generarHTML(servicio, servicioId, slug, isDynamic);
        
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'X-SSR-Dynamic': 'true',
            'X-Generated-At': new Date().toISOString(),
            'X-Content-Source': isDynamic ? 'Directus-API' : 'Static-Fallback',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.end(html);
        
        console.log(`[SSR-PROXY] ✅ Respuesta enviada para servicio ${servicioId} (${isDynamic ? 'dinámico' : 'estático'})`);
        
    } catch (error) {
        console.error(`[SSR-PROXY] ❌ Error procesando request:`, error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Error interno del servidor</h1>');
    }
});

server.listen(PORT, () => {
    console.log(`✅ Dynamic Servicios SSR Proxy listening on port ${PORT}`);
    console.log(`🌐 Ready to handle: /servicios/{id}/{slug}`);
    console.log(`📡 Directus backend: ${DIRECTUS_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down SSR Proxy...');
    server.close(() => {
        console.log('✅ SSR Proxy stopped');
        process.exit(0);
    });
}); 