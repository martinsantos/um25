#!/usr/bin/env node

/**
 * SEO Content Optimizer - ULTIMA MILLA
 * Optimiza contenido en Directus para migración a ultimamilla.com.ar
 */

import https from 'https';
import fs from 'fs';

const CONFIG = {
  directusUrl: 'http://23.105.176.45:8055',
  token: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
  outputFile: 'seo-optimization-report.json'
};

// Contenido SEO optimizado para ULTIMA MILLA
const SEO_CONTENT = {
  servicios: [
    {
      id: 1,
      titulo: "Servicios IT Empresariales",
      descripcion: "ULTIMA MILLA ofrece servicios IT integrales para empresas. Consultoría tecnológica, soporte técnico especializado y soluciones de infraestructura IT diseñadas para optimizar la productividad empresarial en Argentina.",
      keywords: "servicios IT, consultoría tecnológica, soporte técnico, infraestructura IT, ULTIMA MILLA Argentina",
      meta_title: "Servicios IT Empresariales | ULTIMA MILLA - Líder en Tecnología Argentina",
      meta_description: "Servicios IT profesionales de ULTIMA MILLA. Consultoría, soporte técnico e infraestructura tecnológica para empresas en Argentina. Más de 15 años de experiencia.",
      slug: "servicios-it-empresariales"
    },
    {
      id: 2,
      titulo: "Redes y Comunicaciones",
      descripcion: "Diseño, implementación y mantenimiento de redes empresariales por ULTIMA MILLA. Soluciones de conectividad, redes LAN/WAN, fibra óptica y comunicaciones unificadas para empresas en Argentina.",
      keywords: "redes empresariales, comunicaciones, LAN WAN, fibra óptica, conectividad empresarial, ULTIMA MILLA",
      meta_title: "Redes y Comunicaciones Empresariales | ULTIMA MILLA Argentina",
      meta_description: "Soluciones de redes y comunicaciones de ULTIMA MILLA. Diseño e implementación de infraestructura de red, fibra óptica y comunicaciones unificadas.",
      slug: "redes-comunicaciones-empresariales"
    },
    {
      id: 3,
      titulo: "Software y Servicios",
      descripcion: "Desarrollo de software a medida y servicios digitales por ULTIMA MILLA. Aplicaciones web, sistemas de gestión, e-commerce y soluciones digitales personalizadas para empresas argentinas.",
      keywords: "desarrollo software, aplicaciones web, sistemas gestión, e-commerce, software a medida, ULTIMA MILLA",
      meta_title: "Desarrollo de Software a Medida | ULTIMA MILLA - Soluciones Digitales",
      meta_description: "Desarrollo de software personalizado por ULTIMA MILLA. Aplicaciones web, sistemas de gestión y soluciones digitales para empresas en Argentina.",
      slug: "desarrollo-software-servicios"
    },
    {
      id: 4,
      titulo: "Seguridad Informática",
      descripcion: "Servicios de ciberseguridad empresarial de ULTIMA MILLA. Auditorías de seguridad, protección de datos, firewall, antivirus corporativo y consultoría en seguridad informática para empresas.",
      keywords: "seguridad informática, ciberseguridad, protección datos, firewall, auditoría seguridad, ULTIMA MILLA",
      meta_title: "Seguridad Informática Empresarial | ULTIMA MILLA - Ciberseguridad",
      meta_description: "Servicios de seguridad informática de ULTIMA MILLA. Ciberseguridad, protección de datos y auditorías de seguridad para empresas argentinas.",
      slug: "seguridad-informatica-empresarial"
    },
    {
      id: 5,
      titulo: "Infraestructura IT",
      descripcion: "Soluciones de infraestructura tecnológica empresarial por ULTIMA MILLA. Servidores, virtualización, cloud computing, backup y recuperación de datos para empresas en Argentina.",
      keywords: "infraestructura IT, servidores, virtualización, cloud computing, backup, recuperación datos, ULTIMA MILLA",
      meta_title: "Infraestructura IT Empresarial | ULTIMA MILLA - Cloud y Servidores",
      meta_description: "Infraestructura IT profesional de ULTIMA MILLA. Servidores, cloud computing, virtualización y soluciones de backup para empresas.",
      slug: "infraestructura-it-empresarial"
    },
    {
      id: 6,
      titulo: "Consultoría Tecnológica",
      descripcion: "Consultoría IT estratégica de ULTIMA MILLA. Asesoramiento tecnológico, planificación IT, transformación digital y optimización de procesos para empresas argentinas.",
      keywords: "consultoría IT, asesoramiento tecnológico, transformación digital, planificación IT, ULTIMA MILLA",
      meta_title: "Consultoría Tecnológica IT | ULTIMA MILLA - Transformación Digital",
      meta_description: "Consultoría tecnológica especializada de ULTIMA MILLA. Transformación digital, planificación IT y asesoramiento estratégico para empresas.",
      slug: "consultoria-tecnologica-it"
    }
  ],
  
  empresa: {
    nombre: "ULTIMA MILLA",
    descripcion: "ULTIMA MILLA es la empresa líder en servicios IT y tecnología en Argentina. Especializada en consultoría tecnológica, desarrollo de software, redes empresariales y seguridad informática con más de 15 años de experiencia.",
    keywords: "ULTIMA MILLA, servicios IT Argentina, empresa tecnología, consultoría IT, desarrollo software Argentina",
    meta_title: "ULTIMA MILLA - Líder en Servicios IT y Tecnología en Argentina",
    meta_description: "ULTIMA MILLA, empresa líder en servicios IT en Argentina. Consultoría tecnológica, desarrollo de software, redes y seguridad informática. Más de 15 años de experiencia.",
    direccion: "Buenos Aires, Argentina",
    telefono: "+54 11 XXXX-XXXX",
    email: "info@ultimamilla.com.ar",
    sitio_web: "https://ultimamilla.com.ar"
  }
};

// Función para hacer requests a Directus
async function makeDirectusRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.directusUrl}${endpoint}`;
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Optimizar servicios en Directus
async function optimizeServices() {
  console.log('🔧 Optimizando servicios para SEO...');
  const results = [];

  for (const servicio of SEO_CONTENT.servicios) {
    try {
      console.log(`📝 Actualizando servicio: ${servicio.titulo}`);
      
      const updateData = {
        Titulo: servicio.titulo,
        Descripcion: servicio.descripcion,
        keywords: servicio.keywords,
        meta_title: servicio.meta_title,
        meta_description: servicio.meta_description,
        slug: servicio.slug,
        empresa: "ULTIMA MILLA",
        pais: "Argentina",
        fecha_actualizacion: new Date().toISOString()
      };

      const response = await makeDirectusRequest(`/items/Servicios/${servicio.id}`, 'PATCH', updateData);
      
      results.push({
        id: servicio.id,
        titulo: servicio.titulo,
        status: response.statusCode === 200 ? 'success' : 'error',
        response: response.data
      });

      console.log(`${response.statusCode === 200 ? '✅' : '❌'} Servicio ${servicio.id}: ${servicio.titulo}`);
      
    } catch (error) {
      console.error(`❌ Error actualizando servicio ${servicio.id}:`, error.message);
      results.push({
        id: servicio.id,
        titulo: servicio.titulo,
        status: 'error',
        error: error.message
      });
    }

    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// Optimizar antecedentes para SEO
async function optimizeAntecedentes() {
  console.log('🔧 Optimizando antecedentes para SEO...');
  
  try {
    // Obtener todos los antecedentes
    const response = await makeDirectusRequest('/items/Antecedentes?limit=50');
    
    if (response.statusCode !== 200) {
      throw new Error(`Error obteniendo antecedentes: ${response.statusCode}`);
    }

    const antecedentes = response.data.data || [];
    const results = [];

    for (const antecedente of antecedentes) {
      try {
        const optimizedData = {
          // Mantener datos originales
          ...antecedente,
          // Agregar optimizaciones SEO
          empresa_proveedora: "ULTIMA MILLA",
          pais: "Argentina",
          keywords: `${antecedente.Titulo}, ${antecedente.Cliente}, ULTIMA MILLA, ${antecedente.Area || 'servicios IT'}`,
          meta_title: `${antecedente.Titulo} - Caso de Éxito | ULTIMA MILLA`,
          meta_description: `Caso de éxito de ULTIMA MILLA: ${antecedente.Titulo} para ${antecedente.Cliente}. ${antecedente.Descripcion?.substring(0, 120)}...`,
          slug: antecedente.Titulo?.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim(),
          fecha_optimizacion: new Date().toISOString()
        };

        const updateResponse = await makeDirectusRequest(
          `/items/Antecedentes/${antecedente.id}`, 
          'PATCH', 
          optimizedData
        );

        results.push({
          id: antecedente.id,
          titulo: antecedente.Titulo,
          cliente: antecedente.Cliente,
          status: updateResponse.statusCode === 200 ? 'success' : 'error'
        });

        console.log(`${updateResponse.statusCode === 200 ? '✅' : '❌'} Antecedente ${antecedente.id}: ${antecedente.Titulo}`);

      } catch (error) {
        console.error(`❌ Error optimizando antecedente ${antecedente.id}:`, error.message);
        results.push({
          id: antecedente.id,
          titulo: antecedente.Titulo,
          status: 'error',
          error: error.message
        });
      }

      // Pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return results;

  } catch (error) {
    console.error('❌ Error general optimizando antecedentes:', error.message);
    return [];
  }
}

// Crear configuración SEO global
async function createGlobalSEOConfig() {
  console.log('🌐 Creando configuración SEO global...');
  
  const seoConfig = {
    sitio_web: {
      nombre: "ULTIMA MILLA",
      url_actual: "https://ultimamilla.com.ar",
      url_final: "https://ultimamilla.com.ar",
      descripcion: SEO_CONTENT.empresa.descripcion,
      keywords: SEO_CONTENT.empresa.keywords,
      meta_title: SEO_CONTENT.empresa.meta_title,
      meta_description: SEO_CONTENT.empresa.meta_description
    },
    estructura_urls: {
      servicios: "/servicios/{id}/{slug}",
      antecedentes: "/antecedentes/{id}/{slug}",
      empresa: "/empresa",
      contacto: "/contacto"
    },
    schema_org: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ULTIMA MILLA",
      "url": "https://ultimamilla.com.ar",
      "logo": "https://ultimamilla.com.ar/images/logo-ultima-milla.png",
      "description": SEO_CONTENT.empresa.descripcion,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "AR",
        "addressLocality": "Buenos Aires"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": SEO_CONTENT.empresa.telefono,
        "contactType": "customer service"
      }
    },
    fecha_creacion: new Date().toISOString()
  };

  // Guardar configuración localmente
  fs.writeFileSync('seo-global-config.json', JSON.stringify(seoConfig, null, 2));
  console.log('✅ Configuración SEO global guardada en seo-global-config.json');

  return seoConfig;
}

// Función principal
async function runSEOOptimization() {
  console.log('🚀 Iniciando optimización SEO para ULTIMA MILLA\n');
  
  const report = {
    inicio: new Date().toISOString(),
    empresa: "ULTIMA MILLA",
    url_actual: "https://ultimamilla.com.ar",
    url_objetivo: "https://ultimamilla.com.ar",
    resultados: {}
  };

  try {
    // 1. Optimizar servicios
    report.resultados.servicios = await optimizeServices();
    
    // 2. Optimizar antecedentes
    report.resultados.antecedentes = await optimizeAntecedentes();
    
    // 3. Crear configuración SEO global
    report.resultados.configuracion_global = await createGlobalSEOConfig();
    
    report.fin = new Date().toISOString();
    report.estado = 'completado';
    
    // Guardar reporte
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2));
    
    // Mostrar resumen
    console.log('\n📊 RESUMEN DE OPTIMIZACIÓN SEO:');
    console.log(`✅ Servicios optimizados: ${report.resultados.servicios.filter(s => s.status === 'success').length}/${report.resultados.servicios.length}`);
    console.log(`✅ Antecedentes optimizados: ${report.resultados.antecedentes.filter(a => a.status === 'success').length}/${report.resultados.antecedentes.length}`);
    console.log(`📄 Reporte guardado en: ${CONFIG.outputFile}`);
    console.log(`🌐 Configuración SEO: seo-global-config.json`);
    
  } catch (error) {
    console.error('❌ Error durante optimización SEO:', error);
    report.estado = 'error';
    report.error = error.message;
    report.fin = new Date().toISOString();
    
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2));
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSEOOptimization().catch(error => {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  });
}
