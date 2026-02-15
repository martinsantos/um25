#!/usr/bin/env node
import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const DIRECTUS_URL = 'https://ultimamilla.com.ar:8055';
const TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

// Configuración robusta con timeouts extendidos
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Datos de actualización completos
const serviciosData = {
  1: {
    Servicios_incluidos: "Consultoría tecnológica, Implementación de soluciones IT, Soporte técnico especializado, Gestión de infraestructura, Auditoría de sistemas, Optimización de procesos",
    Caracteristicas: "Experiencia multisectorial, Equipo certificado, Soporte 24/7, Metodologías ágiles, Tecnologías actualizadas, ROI comprobado"
  },
  2: {
    Servicios_incluidos: "Diseño de red, Instalación de cableado estructurado, Configuración de switches y routers, Implementación de VLAN, Testing y certificación, Documentación técnica",
    Caracteristicas: "Certificación Cat6/Cat6A, Estándares internacionales, Equipamiento Cisco/HP, Redundancia garantizada, Escalabilidad futura, Garantía extendida"
  },
  3: {
    Servicios_incluidos: "Firewall perimetral, Antivirus corporativo, Monitoreo 24/7, Backup automático, Control de acceso, Políticas de seguridad",
    Caracteristicas: "Certificaciones ISO 27001, Tecnología líder mundial, Respuesta inmediata, Compliance regulatorio, Actualizaciones automáticas, Informes detallados"
  },
  4: {
    Servicios_incluidos: "Mesa de ayuda, Monitoreo proactivo, Mantenimiento preventivo, Gestión de activos, Reportes mensuales, SLA garantizado",
    Caracteristicas: "Disponibilidad 99.9%, Tiempo respuesta <4hrs, Personal certificado, Herramientas especializadas, Escalamiento automático, KPIs transparentes"
  },
  5: {
    Servicios_incluidos: "Diagnóstico tecnológico, Plan estratégico IT, Evaluación de proveedores, Gestión de proyectos, Capacitación de equipos, Seguimiento de implementación",
    Caracteristicas: "Experiencia +15 años, Metodología propia, Enfoque ROI, Neutralidad tecnológica, Resultados medibles, Acompañamiento integral"
  },
  11: {
    Servicios_incluidos: "Desarrollo web responsivo, E-commerce personalizado, Aplicaciones web, SEO técnico, Hosting y dominio, Mantenimiento y soporte",
    Caracteristicas: "Diseño responsive, Tecnologías modernas, SEO optimizado, Carga rápida, Seguridad SSL, Panel administrativo"
  }
};

async function updateServicio(id, data) {
  const url = `${DIRECTUS_URL}/items/Servicios/${id}`;
  
  try {
    console.log(`🔄 Actualizando servicio ${id}...`);
    
    const response = await fetchWithTimeout(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }, 45000); // Timeout de 45 segundos
    
    if (response.ok) {
      console.log(`✅ Servicio ${id} actualizado exitosamente`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Error ${response.status}: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error de conexión para servicio ${id}:`, error.message);
    return false;
  }
}

async function updateAllServicios() {
  console.log('🚀 Iniciando actualización de servicios...\n');
  
  const results = [];
  
  for (const [id, data] of Object.entries(serviciosData)) {
    const success = await updateServicio(id, data);
    results.push({ id, success });
    
    // Pausa entre requests para evitar sobrecarga
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 Resumen de actualización:');
  const exitosos = results.filter(r => r.success).length;
  const fallidos = results.filter(r => !r.success).length;
  
  console.log(`✅ Exitosos: ${exitosos}`);
  console.log(`❌ Fallidos: ${fallidos}`);
  
  if (fallidos === 0) {
    console.log('\n🎉 ¡Todos los servicios actualizados exitosamente!');
  } else {
    console.log('\n⚠️  Algunos servicios requieren actualización manual');
  }
}

// Ejecutar
updateAllServicios().catch(error => {
  console.error('💥 Error crítico:', error);
  process.exit(1);
});
