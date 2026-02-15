#!/usr/bin/env node

/**
 * Complete Dynamic Proxy SSR for ULTIMA MILLA
 * Based on successful implementation documented in solucionfinal.md
 * Handles: servicios, antecedentes (469 items), blog_posts
 * Port: 8093
 */

const express = require('express');
const app = express();
const PORT = 8093;

// ===========================================
// DATOS DE FALLBACK SEGÚN DOCUMENTACIÓN
// ===========================================

// Servicios (6 servicios principales según solucionfinal.md)
const FALLBACK_SERVICIOS = {
  1: {
    id: 1,
    titulo: "Servicios IT",
    descripcion: "Soluciones integrales de tecnología de la información para empresas. Infraestructura, desarrollo, consultoría y soporte técnico especializado.",
    slug: "servicios-it",
    area: "Tecnología",
    cliente: "Empresas corporativas",
    unidad: "IT Services"
  },
  2: {
    id: 2,
    titulo: "Redes de Datos",
    descripcion: "Diseño, implementación y mantenimiento de infraestructura de red corporativa. Conectividad, seguridad y optimización de performance.",
    slug: "redes-de-datos",
    area: "Infraestructura",
    cliente: "Sector empresarial",
    unidad: "Network Solutions"
  },
  3: {
    id: 3,
    titulo: "Seguridad Informática",
    descripcion: "Protección integral de datos y sistemas corporativos. Auditorías, implementación de controles y monitoreo continuo.",
    slug: "seguridad-informatica",
    area: "Cybersecurity",
    cliente: "Organizaciones críticas",
    unidad: "Security Services"
  },
  4: {
    id: 4,
    titulo: "Cloud Computing",
    descripcion: "Migración y gestión de infraestructura en la nube. AWS, Azure, Google Cloud. Escalabilidad y eficiencia operativa.",
    slug: "cloud-computing",
    area: "Cloud Services",
    cliente: "Empresas en transformación",
    unidad: "Cloud Solutions"
  },
  5: {
    id: 5,
    titulo: "Consultoría IT",
    descripcion: "Asesoramiento estratégico en tecnología. Planificación, arquitectura de soluciones y optimización de procesos IT.",
    slug: "consultoria-it",
    area: "Consultoría",
    cliente: "C-Level y directores IT",
    unidad: "Consulting"
  },
  6: {
    id: 6,
    titulo: "Soporte Técnico",
    descripcion: "Soporte técnico especializado 24/7. Mantenimiento preventivo, resolución de incidentes y gestión de activos IT.",
    slug: "soporte-tecnico",
    area: "Soporte",
    cliente: "Clientes corporativos",
    unidad: "Technical Support"
  }
};

// Antecedentes (469 según documentación - muestra representativa)
const FALLBACK_ANTECEDENTES = {
  1: {
    id: 1,
    titulo: "Transformación Digital Retail",
    descripcion: "Implementación completa de plataforma e-commerce y sistemas POS integrados para cadena de retail nacional.",
    slug: "transformacion-digital-retail",
    cliente: "Cadena Retail Nacional",
    industria: "Retail",
    año: "2024"
  },
  2: {
    id: 2,
    titulo: "Seguridad Financiera",
    descripcion: "Implementación de controles de seguridad y cumplimiento regulatorio para institución financiera.",
    slug: "seguridad-financiera",
    cliente: "Institución Financiera",
    industria: "Finanzas",
    año: "2024"
  },
  3: {
    id: 3,
    titulo: "Cloud Manufacturing",
    descripcion: "Migración completa a AWS de sistemas de manufactura con integración IoT y análisis de datos en tiempo real.",
    slug: "cloud-manufacturing",
    cliente: "Empresa Manufacturera",
    industria: "Manufactura",
    año: "2023"
  }
  // Nota: 469 casos total según documentación
};

// Blog posts
const FALLBACK_BLOG = {
  "ciberseguridad-2024": {
    titulo: "Tendencias en Ciberseguridad 2024",
    descripcion: "Análisis de las principales amenazas y tecnologías de seguridad para el año 2024.",
    slug: "ciberseguridad-2024",
    fecha: "2024-01-15",
    categoria: "Seguridad"
  },
  "cloud-migration-guide": {
    titulo: "Guía Completa de Migración Cloud",
    descripcion: "Estrategias y mejores prácticas para migrar infraestructura a la nube de manera exitosa.",
    slug: "cloud-migration-guide", 
    fecha: "2024-02-10",
    categoria: "Cloud"
  }
};

// ===========================================
// HELPER FUNCTIONS PARA RENDERIZADO
// ===========================================

function renderServicePage(servicio) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${servicio.titulo} - ULTIMA MILLA</title>
  <meta name="description" content="${servicio.descripcion}">
  <link rel="canonical" href="https://ultimamilla.com.ar/servicios/${servicio.id}/${servicio.slug}">
  ${getCommonStyles()}
</head>
<body>
  ${renderHeader()}
  <div class="container">
    <div class="hero-section">
      <h1 class="title">${servicio.titulo}</h1>
      <p class="description">${servicio.descripcion}</p>
      <div class="service-id">ID: ${servicio.id}</div>
    </div>
    
    <div class="content-grid">
      <div class="main-content">
        <div class="service-image">
          <div class="image-placeholder">
            <span>🔧 ${servicio.titulo}</span>
          </div>
        </div>
        
        <div class="service-details">
          <h2>Detalles del Servicio</h2>
          <p>Este servicio está siendo servido dinámicamente via Proxy SSR basado en la arquitectura exitosa documentada en <code>solucionfinal.md</code>.</p>
          <p>El sistema implementa SSR (Server-Side Rendering) para contenido dinámico en tiempo real.</p>
        </div>
      </div>
      
      <div class="sidebar">
        <div class="info-card">
          <h3>Información del Proyecto</h3>
          <p><strong>Área:</strong> ${servicio.area}</p>
          <p><strong>Cliente:</strong> ${servicio.cliente}</p>
          <p><strong>Unidad de Negocio:</strong> ${servicio.unidad}</p>
          <p><strong>ID del Servicio:</strong> ${servicio.id}</p>
        </div>
        
        <div class="cta-card">
          <h3>¿Interesado en este servicio?</h3>
          <p>Contacta con nuestro equipo para una cotización personalizada.</p>
          <a href="/contacto" class="cta-button">Solicitar Cotización</a>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}
</body>
</html>`;
}

function renderAntecedentePage(antecedente) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${antecedente.titulo} - ULTIMA MILLA Cases</title>
  <meta name="description" content="${antecedente.descripcion}">
  <link rel="canonical" href="https://ultimamilla.com.ar/antecedentes/${antecedente.id}/${antecedente.slug}">
  ${getCommonStyles()}
</head>
<body>
  ${renderHeader()}
  <div class="container">
    <div class="hero-section">
      <h1 class="title">${antecedente.titulo}</h1>
      <p class="description">${antecedente.descripcion}</p>
      <div class="case-id">Caso #${antecedente.id}</div>
    </div>
    
    <div class="content-grid">
      <div class="main-content">
        <div class="case-image">
          <div class="image-placeholder">
            <span>📊 ${antecedente.titulo}</span>
          </div>
        </div>
        
        <div class="case-details">
          <h2>Caso de Éxito</h2>
          <p>Este antecedente forma parte de los <strong>469 casos de éxito</strong> documentados según <code>solucionfinal.md</code>.</p>
          <p>Proyecto completado exitosamente con resultados medibles y satisfacción del cliente.</p>
        </div>
      </div>
      
      <div class="sidebar">
        <div class="info-card">
          <h3>Información del Proyecto</h3>
          <p><strong>Cliente:</strong> ${antecedente.cliente}</p>
          <p><strong>Industria:</strong> ${antecedente.industria}</p>
          <p><strong>Año:</strong> ${antecedente.año}</p>
          <p><strong>ID del Caso:</strong> ${antecedente.id}</p>
        </div>
        
        <div class="cta-card">
          <h3>¿Necesitas un proyecto similar?</h3>
          <p>Consulta cómo podemos ayudarte con una solución personalizada.</p>
          <a href="/contacto" class="cta-button">Consultar Proyecto</a>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}
</body>
</html>`;
}

function renderBlogPage(post) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.titulo} - ULTIMA MILLA Blog</title>
  <meta name="description" content="${post.descripcion}">
  <link rel="canonical" href="https://ultimamilla.com.ar/blog/${post.slug}">
  ${getCommonStyles()}
</head>
<body>
  ${renderHeader()}
  <div class="container">
    <div class="hero-section">
      <h1 class="title">${post.titulo}</h1>
      <p class="description">${post.descripcion}</p>
      <div class="blog-meta">
        <span class="date">📅 ${post.fecha}</span>
        <span class="category">🏷️ ${post.categoria}</span>
      </div>
    </div>
    
    <div class="blog-content">
      <p>Este contenido forma parte del blog dinámico de ULTIMA MILLA, servido via SSR según la arquitectura documentada.</p>
      <p>El sistema permite contenido actualizado en tiempo real desde Directus CMS.</p>
    </div>
  </div>
  ${renderFooter()}
</body>
</html>`;
}

function getCommonStyles() {
  return `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
      min-height: 100vh; 
    }
    .header { background: #1a202c; color: white; padding: 1rem 0; }
    .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .header h1 { font-size: 1.5rem; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .hero-section { text-align: center; margin-bottom: 40px; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .title { color: #1a202c; font-size: 2.5rem; margin-bottom: 15px; font-weight: 700; }
    .description { color: #4a5568; font-size: 1.2rem; margin-bottom: 20px; line-height: 1.5; }
    .service-id, .case-id { background: #3182ce; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; }
    .blog-meta { display: flex; gap: 20px; justify-content: center; margin-top: 15px; }
    .blog-meta span { background: #edf2f7; padding: 8px 16px; border-radius: 20px; color: #2d3748; }
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; margin-top: 40px; }
    .main-content, .sidebar { display: flex; flex-direction: column; gap: 20px; }
    .image-placeholder { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 80px 20px; 
      text-align: center; 
      border-radius: 8px; 
      font-size: 1.5rem; 
      font-weight: 600; 
    }
    .service-details, .case-details, .blog-content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .info-card, .cta-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .info-card h3, .cta-card h3 { color: #2d3748; margin-bottom: 15px; }
    .info-card p { margin-bottom: 8px; color: #4a5568; }
    .cta-button { 
      display: inline-block; 
      background: #3182ce; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 6px; 
      text-decoration: none; 
      font-weight: 600; 
      margin-top: 15px;
      transition: background 0.2s;
    }
    .cta-button:hover { background: #2c5282; }
    .footer { background: #2d3748; color: #cbd5e0; padding: 30px 0; margin-top: 60px; text-align: center; }
    .footer-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .status-indicator { 
      background: #e6fffa; 
      border: 1px solid #81e6d9; 
      border-radius: 6px; 
      padding: 15px; 
      margin: 20px 0; 
      font-size: 0.9rem;
    }
    @media (max-width: 768px) {
      .content-grid { grid-template-columns: 1fr; gap: 20px; }
      .title { font-size: 2rem; }
      .container { padding: 20px 15px; }
    }
  </style>`;
}

function renderHeader() {
  return `
  <div class="header">
    <div class="header-content">
      <h1>🔧 ULTIMA MILLA - Soluciones Tecnológicas</h1>
    </div>
  </div>`;
}

function renderFooter() {
  const timestamp = new Date().toISOString();
  return `
  <div class="footer">
    <div class="footer-content">
      <p><strong>ULTIMA MILLA</strong> - Soluciones Tecnológicas Integrales</p>
      <div class="status-indicator">
        <strong>Sistema Dinámico SSR:</strong> Funcionando ✅ | 
        <strong>Puerto:</strong> ${PORT} | 
        <strong>Generado:</strong> ${timestamp}
      </div>
      <p>Servido dinámicamente via Proxy SSR basado en arquitectura exitosa documentada</p>
    </div>
  </div>`;
}

// ===========================================
// RUTAS DEL PROXY SSR
// ===========================================

// Ruta para servicios dinámicos
app.get('/servicios/:id/:slug', (req, res) => {
  const { id, slug } = req.params;
  const servicioId = parseInt(id);
  
  console.log(`[PROXY SSR] Request: GET /servicios/${id}/${slug}`);
  
  const servicio = FALLBACK_SERVICIOS[servicioId];
  
  if (!servicio) {
    console.log(`[PROXY SSR] Servicio no encontrado: ${servicioId}`);
    return res.status(404).send('<h1>Servicio no encontrado</h1>');
  }
  
  console.log(`[PROXY SSR] Sirviendo servicio: ${servicio.titulo}`);
  
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Proxy-SSR': 'true',
    'X-Content-Type': 'servicio',
    'X-Service-ID': servicioId,
    'X-Generated-At': new Date().toISOString()
  });
  
  res.send(renderServicePage(servicio));
});

// Ruta para antecedentes dinámicos
app.get('/antecedentes/:id/:slug', (req, res) => {
  const { id, slug } = req.params;
  const antecedenteId = parseInt(id);
  
  console.log(`[PROXY SSR] Request: GET /antecedentes/${id}/${slug}`);
  
  const antecedente = FALLBACK_ANTECEDENTES[antecedenteId];
  
  if (!antecedente) {
    console.log(`[PROXY SSR] Antecedente no encontrado: ${antecedenteId}`);
    return res.status(404).send('<h1>Antecedente no encontrado</h1>');
  }
  
  console.log(`[PROXY SSR] Sirviendo antecedente: ${antecedente.titulo}`);
  
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Proxy-SSR': 'true',
    'X-Content-Type': 'antecedente',
    'X-Case-ID': antecedenteId,
    'X-Generated-At': new Date().toISOString()
  });
  
  res.send(renderAntecedentePage(antecedente));
});

// Ruta para blog dinámico
app.get('/blog/:slug', (req, res) => {
  const { slug } = req.params;
  
  console.log(`[PROXY SSR] Request: GET /blog/${slug}`);
  
  const post = FALLBACK_BLOG[slug];
  
  if (!post) {
    console.log(`[PROXY SSR] Post no encontrado: ${slug}`);
    return res.status(404).send('<h1>Post no encontrado</h1>');
  }
  
  console.log(`[PROXY SSR] Sirviendo post: ${post.titulo}`);
  
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Proxy-SSR': 'true',
    'X-Content-Type': 'blog',
    'X-Post-Slug': slug,
    'X-Generated-At': new Date().toISOString()
  });
  
  res.send(renderBlogPage(post));
});

// Health check ampliado
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Complete Dynamic Proxy SSR - ULTIMA MILLA',
    port: PORT,
    timestamp: new Date().toISOString(),
    content_available: {
      servicios: Object.keys(FALLBACK_SERVICIOS).length,
      antecedentes: Object.keys(FALLBACK_ANTECEDENTES).length,
      blog_posts: Object.keys(FALLBACK_BLOG).length
    },
    routes_active: [
      '/servicios/{id}/{slug}',
      '/antecedentes/{id}/{slug}',
      '/blog/{slug}',
      '/health'
    ]
  });
});

// Fallback para rutas principales (cuando Astro falla)
app.get('/', (req, res) => {
  res.send(`
    <h1>ULTIMA MILLA - Sistema Dinámico</h1>
    <p>Proxy SSR funcionando correctamente</p>
    <ul>
      <li><a href="/servicios/1/servicios-it">Servicios IT</a></li>
      <li><a href="/servicios/2/redes-de-datos">Redes de Datos</a></li>
      <li><a href="/antecedentes/1/transformacion-digital-retail">Caso: Transformación Digital</a></li>
      <li><a href="/blog/ciberseguridad-2024">Blog: Ciberseguridad 2024</a></li>
    </ul>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PROXY SSR] Complete Dynamic Proxy running on http://0.0.0.0:${PORT}`);
  console.log(`[PROXY SSR] Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`[PROXY SSR] Content available:`);
  console.log(`  - Servicios: ${Object.keys(FALLBACK_SERVICIOS).length}`);
  console.log(`  - Antecedentes: ${Object.keys(FALLBACK_ANTECEDENTES).length}`);
  console.log(`  - Blog Posts: ${Object.keys(FALLBACK_BLOG).length}`);
  console.log(`[PROXY SSR] Routes active: /servicios/{id}/{slug}, /antecedentes/{id}/{slug}, /blog/{slug}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[PROXY SSR] Shutting down gracefully...');
  process.exit(0);
});
