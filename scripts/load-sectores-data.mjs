#!/usr/bin/env node
/**
 * CARGAR DATOS DE SECTORES A DIRECTUS
 * ====================================
 *
 * Script simplificado que solo carga los datos de sectores
 * (asume que las colecciones ya están creadas)
 */

import { createDirectus, rest, staticToken, createItem } from '@directus/sdk';

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

const sectoresData = [
  {
    slug: 'aeropuertos',
    nombre: 'Aeropuertos',
    emoji: '✈️',
    descripcion: 'Infraestructura tecnológica de misión crítica para operaciones aeroportuarias 24/7.',
    hero_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80',
    keywords: ['aeropuerto', 'aviacion', 'terminal', 'aerolinea', 'pista', 'torre control'],
    color_theme: 'sky',
    seo_title: 'Tecnología para Aeropuertos | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para aeropuertos. Redes de alta disponibilidad, seguridad aeroportuaria y telecomunicaciones críticas.',
    seo_keywords: 'tecnologia aeropuertos, redes aeroportuarias, seguridad aeropuertos',
    stats: [
      { label: 'Uptime', value: '99.9%' },
      { label: 'Soporte', value: '24/7' },
    ],
    activo: true,
    orden: 1,
    valueProps: [
      { icono: 'plane', titulo: 'Alta Disponibilidad 24/7', descripcion: 'Sistemas de misión crítica que garantizan operación continua sin interrupciones, cumpliendo normativas aeroportuarias internacionales.', orden: 1 },
      { icono: 'shield', titulo: 'Seguridad Multinivel', descripcion: 'Integración de CCTV, control de accesos biométrico, detección de intrusión y análisis de video inteligente para protección total.', orden: 2 },
      { icono: 'zap', titulo: 'Escalabilidad Certificada', descripcion: 'Infraestructura preparada para crecimiento de tráfico aéreo, con certificaciones aeroportuarias y redundancia N+1.', orden: 3 },
    ],
    serviciosIds: [101, 102, 103, 107, 108, 106],
  },
  {
    slug: 'bodegas',
    nombre: 'Bodegas',
    emoji: '🍷',
    descripcion: 'Soluciones tecnológicas especializadas para la industria vitivinícola argentina.',
    hero_image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1920&q=80',
    keywords: ['bodega', 'vino', 'viñedo', 'enología', 'vitivinicola', 'catena', 'trapiche', 'norton'],
    color_theme: 'purple',
    seo_title: 'Tecnología para Bodegas | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para bodegas argentinas. Redes, seguridad, control de accesos y soluciones IT para la industria vitivinícola.',
    seo_keywords: 'tecnologia bodegas mendoza, sistemas vitivinicolas, redes bodegas cuyo',
    stats: [
      { label: 'Proyectos', value: '6+' },
      { label: 'Años', value: '22+' },
    ],
    activo: true,
    orden: 2,
    valueProps: [
      { icono: 'wine', titulo: 'Protección de Activos Premium', descripcion: 'Monitoreo 24/7 de salas de guarda, control de temperatura/humedad y alertas tempranas para proteger vinos de alto valor.', orden: 1 },
      { icono: 'users', titulo: 'Experiencia del Visitante', descripcion: 'WiFi de alta velocidad para enoturismo, sistemas de audio/video para tours y control de accesos personalizado.', orden: 2 },
      { icono: 'shield', titulo: 'Certificación y Seguridad', descripcion: 'Cumplimiento de normativas de la industria vitivinícola, con sistemas contra incendios y backup eléctrico para conservación.', orden: 3 },
    ],
    serviciosIds: [101, 102, 103, 107, 108, 106],
  },
  {
    slug: 'constructoras',
    nombre: 'Constructoras',
    emoji: '🏗️',
    descripcion: 'Tecnología robusta y escalable para empresas constructoras y proyectos de obras civiles.',
    hero_image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
    keywords: ['construccion', 'constructora', 'obra', 'edificacion', 'infraestructura', 'civil'],
    color_theme: 'amber',
    seo_title: 'Tecnología para Constructoras | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para constructoras. Redes temporales en obra, seguridad de equipos, comunicaciones y gestión de proyectos.',
    seo_keywords: 'tecnologia construccion mendoza, redes obra, sistemas constructoras',
    stats: [
      { label: 'Años', value: '22+' },
      { label: 'Soporte', value: '24/7' },
    ],
    activo: true,
    orden: 3,
    valueProps: [
      { icono: 'hard-hat', titulo: 'Instalación en Obra', descripcion: 'Despliegue rápido de redes temporales y sistemas de comunicación para coordinación de equipos en terreno.', orden: 1 },
      { icono: 'file-check', titulo: 'Normativa y Certificación', descripcion: 'Cumplimiento de regulaciones de seguridad en obra, certificaciones ISO y documentación completa de instalaciones.', orden: 2 },
      { icono: 'wrench', titulo: 'Post-Venta Garantizado', descripcion: 'Soporte técnico durante toda la vida del proyecto, mantenimiento preventivo y respuesta inmediata ante incidencias.', orden: 3 },
    ],
    serviciosIds: [101, 102, 107, 108, 103, 106],
  },
  {
    slug: 'gobiernosectorpublico',
    nombre: 'Gobierno y Sector Público',
    emoji: '🏛️',
    descripcion: 'Soluciones tecnológicas para la modernización del estado: digitalización, redes gubernamentales, telecomunicaciones para municipios y portales ciudadanos.',
    hero_image: 'https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=1920&q=80',
    keywords: ['gobierno', 'municipalidad', 'intendencia', 'municipio', 'ministerio', 'publico'],
    color_theme: 'blue',
    seo_title: 'Tecnología para Gobierno y Sector Público | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para gobiernos y sector público. Digitalización, redes gubernamentales, telecomunicaciones para municipios.',
    seo_keywords: 'tecnologia gobierno mendoza, sistemas municipales, redes publicas',
    stats: [
      { label: 'Municipios', value: '5+' },
      { label: 'Años', value: '22+' },
    ],
    activo: true,
    orden: 4,
    valueProps: [
      { icono: 'landmark', titulo: 'Digitalización Gubernamental', descripcion: 'Plataformas de gestión municipal, portales ciudadanos y sistemas de trámites online que modernizan la atención al público.', orden: 1 },
      { icono: 'lock', titulo: 'Seguridad y Compliance', descripcion: 'Cumplimiento de normativas estatales, protección de datos ciudadanos y sistemas con alta disponibilidad para servicios críticos.', orden: 2 },
      { icono: 'users', titulo: 'Acceso Universal', descripcion: 'Redes WiFi públicas, conectividad en zonas rurales y telefonía IP para comunicación interna entre áreas municipales.', orden: 3 },
    ],
    serviciosIds: [101, 102, 103, 104, 106, 107],
  },
  {
    slug: 'industria',
    nombre: 'Industria',
    emoji: '🏭',
    descripcion: 'Infraestructura tecnológica robusta para ambientes industriales exigentes.',
    hero_image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
    keywords: ['industria', 'fabrica', 'manufactura', 'produccion', 'planta', 'industrial'],
    color_theme: 'indigo',
    seo_title: 'Tecnología para Industria | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para industrias. Redes industriales, automatización, sistemas de gestión y monitoreo de producción.',
    seo_keywords: 'tecnologia industrial mendoza, redes fabrica, sistemas produccion',
    stats: [
      { label: 'Plantas', value: '8+' },
      { label: 'Años', value: '22+' },
    ],
    activo: true,
    orden: 5,
    valueProps: [
      { icono: 'factory', titulo: 'Ambientes Extremos', descripcion: 'Equipamiento certificado para temperatura, humedad y vibración. Cableado industrial con protección IP67 y equipos grado industrial.', orden: 1 },
      { icono: 'activity', titulo: 'Monitoreo 24/7', descripcion: 'Supervisión en tiempo real de maquinaria, sensores IoT para predictive maintenance y alertas tempranas de fallas.', orden: 2 },
      { icono: 'shield', titulo: 'Seguridad Industrial', descripcion: 'Sistemas anti-intrusión perimetral, CCTV con visión nocturna y control de accesos para áreas restringidas de producción.', orden: 3 },
    ],
    serviciosIds: [101, 102, 103, 107, 108, 106],
  },
  {
    slug: 'mineria',
    nombre: 'Minería',
    emoji: '⛏️',
    descripcion: 'Soluciones tecnológicas de misión crítica para la industria minera en condiciones extremas.',
    hero_image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1920&q=80',
    keywords: ['mineria', 'mina', 'yacimiento', 'minerales', 'extraccion', 'minera'],
    color_theme: 'orange',
    seo_title: 'Tecnología para Minería | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para minería. Redes en altura, comunicaciones en condiciones extremas, seguridad de operaciones.',
    seo_keywords: 'tecnologia minera mendoza, redes mina, sistemas mineria',
    stats: [
      { label: 'Altitud', value: '4000m+' },
      { label: 'Uptime', value: '99.9%' },
    ],
    activo: true,
    orden: 6,
    valueProps: [
      { icono: 'mountain', titulo: 'Condiciones Extremas', descripcion: 'Equipamiento certificado para gran altura, temperaturas bajo cero y ambientes polvorientos. Cableado especial para rayos UV y vientos fuertes.', orden: 1 },
      { icono: 'radio', titulo: 'Comunicación Crítica', descripcion: 'Radio enlaces de larga distancia, telefonía satelital de respaldo y sistemas de comunicación de emergencia para operaciones en zonas remotas.', orden: 2 },
      { icono: 'shield-check', titulo: 'Seguridad Total', descripcion: 'Monitoreo perimetral con sensores sísmicos, CCTV térmico para visibilidad 24/7 y sistemas de detección de intrusión para protección de activos.', orden: 3 },
    ],
    serviciosIds: [101, 102, 103, 107, 108, 106],
  },
  {
    slug: 'salud',
    nombre: 'Salud',
    emoji: '🏥',
    descripcion: 'Tecnología hospitalaria certificada para instituciones de salud públicas y privadas.',
    hero_image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=80',
    keywords: ['salud', 'hospital', 'clinica', 'sanatorio', 'medico', 'healthcare'],
    color_theme: 'emerald',
    seo_title: 'Tecnología para Salud | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para el sector salud. Redes hospitalarias, sistemas críticos, historia clínica electrónica.',
    seo_keywords: 'tecnologia salud mendoza, redes hospitales, sistemas clinicas',
    stats: [
      { label: 'Centros', value: '12+' },
      { label: 'Años', value: '22+' },
    ],
    activo: true,
    orden: 7,
    valueProps: [
      { icono: 'heart-pulse', titulo: 'Redes Redundantes', descripcion: 'Infraestructura de red con failover automático, backup de energía UPS y enlaces redundantes para garantizar disponibilidad de sistemas críticos.', orden: 1 },
      { icono: 'shield-plus', titulo: 'Certificación Sanitaria', descripcion: 'Cumplimiento de normativas hospitalarias, protección de datos de pacientes según ley de salud y auditorías de seguridad periódicas.', orden: 2 },
      { icono: 'video', titulo: 'Telemedicina', descripcion: 'Videoconferencia HD para interconsultas médicas, WiFi de alta capacidad para pacientes y sistemas de comunicación interna entre áreas.', orden: 3 },
    ],
    serviciosIds: [101, 102, 103, 104, 105, 107],
  },
  {
    slug: 'seguridad-electronica',
    nombre: 'Seguridad Electrónica',
    emoji: '🔒',
    descripcion: 'Sistemas integrados de seguridad electrónica para protección total de instalaciones.',
    hero_image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1920&q=80',
    keywords: ['seguridad', 'cctv', 'alarma', 'acceso', 'vigilancia', 'monitoreo'],
    color_theme: 'red',
    seo_title: 'Seguridad Electrónica | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios de seguridad electrónica. CCTV, control de accesos, alarmas, monitoreo 24/7 y sistemas integrados.',
    seo_keywords: 'seguridad electronica mendoza, cctv cuyo, control accesos',
    stats: [
      { label: 'Cámaras', value: '500+' },
      { label: 'Monitoreo', value: '24/7' },
    ],
    activo: true,
    orden: 8,
    valueProps: [
      { icono: 'eye', titulo: 'Videovigilancia Inteligente', descripcion: 'CCTV con analítica de video, detección de movimiento, reconocimiento facial y almacenamiento en la nube con acceso remoto.', orden: 1 },
      { icono: 'smartphone', titulo: 'Control de Accesos', descripcion: 'Sistemas biométricos, tarjetas de proximidad, reconocimiento facial y control desde app móvil con registros de eventos.', orden: 2 },
      { icono: 'shield', titulo: 'Monitoreo Centralizado', descripcion: 'Centro de monitoreo 24/7, alertas en tiempo real, integración con alarmas y respuesta inmediata ante eventos de seguridad.', orden: 3 },
    ],
    serviciosIds: [102, 107, 101, 103, 108, 106],
  },
  {
    slug: 'software',
    nombre: 'Software',
    emoji: '💻',
    descripcion: 'Desarrollo de software a medida, aplicaciones web y móviles para digitalizar procesos de negocio.',
    hero_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80',
    keywords: ['software', 'desarrollo', 'aplicacion', 'web', 'programacion', 'sistema'],
    color_theme: 'cyan',
    seo_title: 'Desarrollo de Software a Medida | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Desarrollo de software personalizado. Aplicaciones web, móviles, gestión empresarial y automatización de procesos.',
    seo_keywords: 'desarrollo software mendoza, aplicaciones web cuyo, sistemas gestion',
    stats: [
      { label: 'Apps', value: '20+' },
      { label: 'Años', value: '22+' },
    ],
    activo: true,
    orden: 9,
    valueProps: [
      { icono: 'code', titulo: 'Desarrollo a Medida', descripcion: 'Soluciones personalizadas que se adaptan exactamente a los procesos de tu empresa, sin limitaciones de software enlatado.', orden: 1 },
      { icono: 'shield-check', titulo: 'Seguridad y Escalabilidad', descripcion: 'Arquitectura robusta con prácticas de código seguro, testing automatizado y capacidad de crecimiento según tus necesidades.', orden: 2 },
      { icono: 'users', titulo: 'Soporte Continuo', descripcion: 'Mesa de ayuda técnica 24/7, actualizaciones programadas y capacitación constante para tu equipo.', orden: 3 },
    ],
    serviciosIds: [104, 105, 106, 101, 102, 103],
  },
];

async function cargarSectores() {
  console.log('📥 Cargando sectores a Directus...\n');

  for (const sectorData of sectoresData) {
    try {
      const { valueProps, serviciosIds, ...sectorBase } = sectorData;

      // 1. Crear sector
      const sector = await client.request(
        createItem('sectores', sectorBase)
      );

      console.log(`  ✅ Sector "${sector.nombre}" creado (ID: ${sector.id})`);

      // 2. Crear value props
      for (const vp of valueProps) {
        await client.request(
          createItem('sector_value_props', {
            sector_id: sector.id,
            ...vp,
          })
        );
      }
      console.log(`     → ${valueProps.length} value props agregados`);

      // 3. Asociar servicios
      for (let i = 0; i < serviciosIds.length; i++) {
        await client.request(
          createItem('sectores_servicios', {
            sectores_id: sector.id,
            servicios_id: serviciosIds[i],
            orden: i + 1,
          })
        );
      }
      console.log(`     → ${serviciosIds.length} servicios relacionados\n`);

    } catch (error) {
      console.error(`  ❌ Error cargando sector ${sectorData.nombre}:`);
      if (error.errors) {
        error.errors.forEach(err => console.error(`     - ${err.message}`));
      } else {
        console.error(`     - ${error.message || JSON.stringify(error)}`);
      }
      console.log('');
    }
  }

  console.log('✅ Carga completada\n');
}

cargarSectores().then(() => {
  console.log('🎉 MIGRACIÓN DE DATOS COMPLETADA\n');
  console.log('📊 Resumen:');
  console.log(`   • ${sectoresData.length} sectores`);
  console.log(`   • ${sectoresData.reduce((acc, s) => acc + s.valueProps.length, 0)} value props`);
  console.log(`   • ${sectoresData.reduce((acc, s) => acc + s.serviciosIds.length, 0)} relaciones sector-servicio`);
  console.log('\n✅ Directus ahora tiene CONTROL TOTAL del contenido');
}).catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
