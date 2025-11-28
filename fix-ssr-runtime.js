#!/usr/bin/env node

// Runtime SSR Fix: Patch compiled server to use dynamic Directus queries
// Este script modifica el servidor compilado para hacer consultas dinámicas

console.log('🔧 Aplicando parche SSR dinámico en runtime...');

const fs = require('fs');
const path = require('path');

// 1. Buscar archivo server compilado que maneja servicios
const serverPath = '/app/dist/server';
const targetFile = path.join(serverPath, 'pages/servicios/_id_/_slug_.astro.mjs');

// 2. Función de consulta dinámica a Directus
const dynamicDirectusCode = `
// DYNAMIC DIRECTUS QUERY - SSR PATCH
async function getServicioFromDirectus(servicioId) {
  try {
    console.log('[SSR-PATCH] Consultando Directus para servicio ID:', servicioId);
    
    const directusUrl = 'http://umbot-directus:8055';
    const response = await fetch(\`\${directusUrl}/items/servicios?filter[id][_eq]=\${servicioId}\`);
    
    if (!response.ok) {
      console.log('[SSR-PATCH] Error HTTP:', response.status);
      throw new Error(\`HTTP \${response.status}\`);
    }
    
    const data = await response.json();
    const servicio = data.data && data.data.length > 0 ? data.data[0] : null;
    
    if (servicio) {
      console.log('[SSR-PATCH] ✅ Servicio encontrado:', servicio.titulo || servicio.Titulo);
    } else {
      console.log('[SSR-PATCH] ⚠️ No se encontró servicio con ID:', servicioId);
    }
    
    return servicio;
  } catch (error) {
    console.error('[SSR-PATCH] Error consultando Directus:', error.message);
    return null;
  }
}
`;

// 3. Crear un middleware que intercepte las peticiones de servicios
const middlewareCode = `
// SSR MIDDLEWARE PATCH - Intercept /servicios requests
const originalHandlers = new Map();

function patchServiceHandler() {
  console.log('[SSR-PATCH] 🔄 Aplicando parche dinámico...');
  
  // Override del handler de servicios
  global.dynamicServiceHandler = async function(request, params) {
    try {
      const { id, slug } = params;
      console.log('[SSR-PATCH] 📡 Consulta dinámica para:', id, slug);
      
      ${dynamicDirectusCode}
      
      const servicio = await getServicioFromDirectus(parseInt(id));
      
      if (!servicio) {
        console.log('[SSR-PATCH] 🔍 Servicio no encontrado, fallback a estático');
        return null; // Fallback to static
      }
      
      // Generate dynamic HTML with timestamp
      const timestamp = new Date().toISOString();
      const dynamicHtml = \`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>\${servicio.titulo || servicio.Titulo} - Ultima Milla</title>
  <meta name="description" content="\${servicio.descripcion || servicio.Descripcion}">
  <link rel="stylesheet" href="/css/tailwind.css">
</head>
<body>
  <main class="container mx-auto px-4 py-8">
    <!-- DYNAMIC SSR CONTENT - Generated: \${timestamp} -->
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-blue-900 mb-4">
        \${servicio.titulo || servicio.Titulo}
      </h1>
      <p class="text-xl text-gray-700">
        \${servicio.descripcion || servicio.Descripcion}
      </p>
    </header>
    
    <section class="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 class="text-2xl font-bold mb-4">Información del Servicio</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <strong>Área:</strong> \${servicio.area || servicio.Area || 'N/A'}
        </div>
        <div>
          <strong>Cliente:</strong> \${servicio.cliente || servicio.Cliente || 'N/A'}
        </div>
        <div>
          <strong>Unidad de Negocio:</strong> \${servicio.unidad_de_negocio || servicio.Unidad_de_negocio || 'N/A'}
        </div>
        <div>
          <strong>ID del Servicio:</strong> #\${id.padStart(4, '0')}
        </div>
      </div>
    </section>
    
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <strong>✅ CONTENIDO DINÁMICO SSR:</strong> Este contenido se genera en tiempo real desde Directus.
      <br><small>Generado: \${timestamp}</small>
    </div>
    
    <footer class="text-center text-gray-500 text-sm mt-8">
      <p>Ultima Milla - Servicios de Tecnología</p>
      <p>Página generada dinámicamente con SSR + Directus</p>
    </footer>
  </main>
</body>
</html>
\`;
      
      return new Response(dynamicHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-SSR-Dynamic': 'true',
          'X-Generated-At': timestamp
        }
      });
      
    } catch (error) {
      console.error('[SSR-PATCH] Error en handler dinámico:', error);
      return null; // Fallback to static
    }
  };
  
  console.log('[SSR-PATCH] ✅ Parche aplicado correctamente');
}

// Aplicar parche al inicializar
patchServiceHandler();
`;

// 4. Escribir el middleware en el servidor
try {
  fs.writeFileSync('/app/ssr-dynamic-patch.js', middlewareCode);
  console.log('✅ Archivo de parche creado: /app/ssr-dynamic-patch.js');
  
  // 5. Modificar el entry point para cargar el parche
  const entryFile = '/app/dist/server/entry.mjs';
  if (fs.existsSync(entryFile)) {
    let entryContent = fs.readFileSync(entryFile, 'utf8');
    
    // Agregar import del parche al inicio
    if (!entryContent.includes('ssr-dynamic-patch')) {
      entryContent = `
// DYNAMIC SSR PATCH - Load runtime fix
import './../../ssr-dynamic-patch.js';
console.log('[SSR-PATCH] 🚀 Parche dinámico cargado');

${entryContent}
`;
      fs.writeFileSync(entryFile, entryContent);
      console.log('✅ Entry point modificado para cargar parche SSR');
    }
  }
  
  console.log('🎯 Parche SSR dinámico aplicado correctamente');
  console.log('🔄 Reinicia el contenedor para aplicar cambios:');
  console.log('   docker restart umbot-astro-static');
  
} catch (error) {
  console.error('❌ Error aplicando parche:', error.message);
  process.exit(1);
} 