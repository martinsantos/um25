#!/usr/bin/env node

/**
 * Simple Directus Proxy SSR for Astro
 * Based on successful implementation documented in solucionfinal.md
 * Serves as fallback when Directus authentication is problematic
 */

const express = require('express');
const app = express();
const PORT = 8093;

// Simple service data - fallback when Directus unavailable
const FALLBACK_SERVICES = {
  1: {
    id: 1,
    titulo: "Servicios IT",
    descripcion: "Soluciones integrales de tecnología de la información para empresas.",
    slug: "servicios-it"
  },
  2: {
    id: 2,
    titulo: "Redes de Datos",
    descripcion: "Diseño, implementación y mantenimiento de infraestructura de red.",
    slug: "redes-de-datos"
  },
  3: {
    id: 3,
    titulo: "Seguridad Informática",
    descripcion: "Protección integral de datos y sistemas corporativos.",
    slug: "seguridad-informatica"
  }
};

// Helper function to render basic HTML
function renderServicePage(service) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${service.titulo} - ULTIMA MILLA</title>
  <meta name="description" content="${service.descripcion}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8fafc; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 40px; }
    .title { color: #1a202c; font-size: 2.5rem; margin-bottom: 10px; }
    .description { color: #4a5568; font-size: 1.2rem; margin-bottom: 30px; }
    .status { background: #e6fffa; border: 1px solid #81e6d9; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 40px; color: #718096; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${service.titulo}</h1>
      <p class="description">${service.descripcion}</p>
    </div>
    
    <div class="status">
      <strong>Estado del Servicio:</strong> Funcionando via Proxy SSR<br>
      <strong>ID:</strong> ${service.id}<br>
      <strong>Slug:</strong> ${service.slug}<br>
      <strong>Timestamp:</strong> ${new Date().toISOString()}
    </div>
    
    <div class="content">
      <h2>Detalles del Servicio</h2>
      <p>Este servicio está siendo servido via proxy SSR como solución temporal mientras se resuelven los problemas de autenticación con Directus CMS.</p>
      
      <p>Para más información sobre nuestros servicios, contacte con nuestro equipo técnico.</p>
    </div>
    
    <div class="footer">
      <p>ULTIMA MILLA - Soluciones Tecnológicas</p>
      <p>Servido via Proxy SSR (Puerto ${PORT})</p>
    </div>
  </div>
</body>
</html>`;
}

// Route for individual services
app.get('/servicios/:id/:slug', (req, res) => {
  const { id, slug } = req.params;
  const serviceId = parseInt(id);
  
  console.log(`[PROXY SSR] Request: GET /servicios/${id}/${slug}`);
  
  // Check if service exists in fallback data
  const service = FALLBACK_SERVICES[serviceId];
  
  if (!service) {
    console.log(`[PROXY SSR] Service not found: ${serviceId}`);
    return res.status(404).send('<h1>Servicio no encontrado</h1>');
  }
  
  console.log(`[PROXY SSR] Serving service: ${service.titulo}`);
  
  // Set headers for SSR
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Proxy-SSR': 'true',
    'X-Service-ID': serviceId,
    'X-Generated-At': new Date().toISOString()
  });
  
  res.send(renderServicePage(service));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Simple Directus Proxy SSR',
    port: PORT,
    timestamp: new Date().toISOString(),
    services_available: Object.keys(FALLBACK_SERVICES).length
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PROXY SSR] Simple Directus Proxy running on http://0.0.0.0:${PORT}`);
  console.log(`[PROXY SSR] Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`[PROXY SSR] Services available: ${Object.keys(FALLBACK_SERVICES).length}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[PROXY SSR] Shutting down gracefully...');
  process.exit(0);
});
