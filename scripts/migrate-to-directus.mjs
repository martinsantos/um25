#!/usr/bin/env node
/**
 * MIGRACIÓN COMPLETA A DIRECTUS
 * ==============================
 *
 * Este script migra TODO el contenido hardcodeado a Directus:
 * 1. Crea colecciones necesarias
 * 2. Carga datos de sectores, value props, stats
 * 3. Configura relaciones sector-servicios
 *
 * USO: node scripts/migrate-to-directus.mjs
 */

import { createDirectus, rest, createCollection, createField, createItem, updateItem, readItems } from '@directus/sdk';

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || '';

const client = createDirectus(DIRECTUS_URL).with(rest());

console.log('🚀 Iniciando migración completa a Directus...\n');

// ============================================================================
// PASO 1: Crear Colección "sectores"
// ============================================================================

async function crearColeccionSectores() {
  console.log('📦 Creando colección "sectores"...');

  try {
    await client.request(
      createCollection({
        collection: 'sectores',
        meta: {
          icon: 'grid_view',
          note: 'Sectores verticales del negocio',
        },
        schema: {
          name: 'sectores',
        },
        fields: [
          {
            field: 'id',
            type: 'integer',
            schema: { is_primary_key: true, has_auto_increment: true },
            meta: { hidden: true },
          },
        ],
      })
    );

    // Campos de la colección sectores
    const campos = [
      { field: 'slug', type: 'string', meta: { required: true, interface: 'input', note: 'URL-friendly identifier' }, schema: { is_unique: true } },
      { field: 'nombre', type: 'string', meta: { required: true, interface: 'input' } },
      { field: 'emoji', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'descripcion', type: 'text', meta: { interface: 'textarea' } },
      { field: 'hero_image', type: 'string', meta: { interface: 'input', note: 'URL de Unsplash' } },
      { field: 'keywords', type: 'json', meta: { interface: 'list', note: 'Array de palabras clave para filtrado' } },
      { field: 'color_theme', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Sky', value: 'sky' },
        { text: 'Purple', value: 'purple' },
        { text: 'Blue', value: 'blue' },
        { text: 'Emerald', value: 'emerald' },
        { text: 'Amber', value: 'amber' },
        { text: 'Indigo', value: 'indigo' },
        { text: 'Cyan', value: 'cyan' },
        { text: 'Orange', value: 'orange' },
        { text: 'Red', value: 'red' },
      ] } } },
      { field: 'seo_title', type: 'string', meta: { interface: 'input' } },
      { field: 'seo_description', type: 'text', meta: { interface: 'textarea' } },
      { field: 'seo_keywords', type: 'string', meta: { interface: 'input' } },
      { field: 'stats', type: 'json', meta: { interface: 'list', note: 'Array de {label, value}' } },
      { field: 'activo', type: 'boolean', meta: { interface: 'boolean', default: true } },
      { field: 'orden', type: 'integer', meta: { interface: 'input', width: 'half' } },
    ];

    for (const campo of campos) {
      await client.request(createField('sectores', campo));
    }

    console.log('✅ Colección "sectores" creada\n');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Colección "sectores" ya existe\n');
    } else {
      console.error('❌ Error creando colección sectores:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// PASO 2: Crear Colección "sector_value_props"
// ============================================================================

async function crearColeccionValueProps() {
  console.log('📦 Creando colección "sector_value_props"...');

  try {
    await client.request(
      createCollection({
        collection: 'sector_value_props',
        meta: {
          icon: 'star',
          note: 'Propuestas de valor por sector',
        },
        schema: {
          name: 'sector_value_props',
        },
        fields: [
          {
            field: 'id',
            type: 'integer',
            schema: { is_primary_key: true, has_auto_increment: true },
            meta: { hidden: true },
          },
        ],
      })
    );

    const campos = [
      { field: 'sector_id', type: 'integer', meta: { interface: 'select-dropdown-m2o', display: 'related-values' }, schema: { foreign_key_table: 'sectores', foreign_key_column: 'id' } },
      { field: 'icono', type: 'string', meta: { interface: 'input', note: 'Nombre del icono (ej: hard-hat, shield-check)' } },
      { field: 'titulo', type: 'string', meta: { required: true, interface: 'input' } },
      { field: 'descripcion', type: 'text', meta: { interface: 'textarea' } },
      { field: 'orden', type: 'integer', meta: { interface: 'input', width: 'half', default: 1 } },
    ];

    for (const campo of campos) {
      await client.request(createField('sector_value_props', campo));
    }

    console.log('✅ Colección "sector_value_props" creada\n');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Colección "sector_value_props" ya existe\n');
    } else {
      console.error('❌ Error creando colección value_props:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// PASO 3: Crear Colección Junction "sectores_servicios"
// ============================================================================

async function crearRelacionSectoresServicios() {
  console.log('📦 Creando tabla de relación "sectores_servicios"...');

  try {
    await client.request(
      createCollection({
        collection: 'sectores_servicios',
        meta: {
          icon: 'link',
          note: 'Relación Many-to-Many entre sectores y servicios',
          hidden: true,
        },
        schema: {
          name: 'sectores_servicios',
        },
        fields: [
          {
            field: 'id',
            type: 'integer',
            schema: { is_primary_key: true, has_auto_increment: true },
            meta: { hidden: true },
          },
        ],
      })
    );

    const campos = [
      { field: 'sectores_id', type: 'integer', meta: { interface: 'select-dropdown-m2o' }, schema: { foreign_key_table: 'sectores', foreign_key_column: 'id' } },
      { field: 'servicios_id', type: 'integer', meta: { interface: 'select-dropdown-m2o' }, schema: { foreign_key_table: 'Servicios', foreign_key_column: 'id' } },
      { field: 'orden', type: 'integer', meta: { interface: 'input', default: 1 } },
      { field: 'descripcion_custom', type: 'string', meta: { interface: 'input', note: 'Descripción personalizada para este sector (opcional)' } },
    ];

    for (const campo of campos) {
      await client.request(createField('sectores_servicios', campo));
    }

    // Añadir campo de relación en sectores
    await client.request(createField('sectores', {
      field: 'servicios',
      type: 'alias',
      meta: {
        interface: 'm2m',
        special: ['m2m'],
        options: {
          junction_collection: 'sectores_servicios',
          junction_field_many: 'sectores_id',
          junction_field_one: 'servicios_id',
        },
      },
    }));

    console.log('✅ Relación sectores-servicios creada\n');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Relación sectores-servicios ya existe\n');
    } else {
      console.error('❌ Error creando relación:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// PASO 4: Datos a Migrar
// ============================================================================

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
    seo_keywords: 'servicios tecnologicos gobierno, infraestructura sector publico mendoza',
    stats: [
      { label: 'Municipios', value: '20+' },
      { label: 'Cumplimiento', value: '100%' },
    ],
    activo: true,
    orden: 4,
    valueProps: [
      { icono: 'landmark', titulo: 'Cumplimiento Normativo', descripcion: 'Proyectos ejecutados bajo normativas de contratación pública, con documentación completa y trazabilidad total de procesos.', orden: 1 },
      { icono: 'users', titulo: 'Servicio a la Comunidad', descripcion: 'Infraestructura tecnológica que mejora la atención ciudadana, reduce tiempos de espera y digitaliza trámites.', orden: 2 },
      { icono: 'lock', titulo: 'Seguridad de Datos', descripcion: 'Protección de información sensible con backups automáticos, encriptación y cumplimiento de Ley de Protección de Datos.', orden: 3 },
    ],
    serviciosIds: [101, 102, 104, 107, 103, 106],
  },
  {
    slug: 'industria',
    nombre: 'Industria',
    emoji: '🏭',
    descripcion: 'Impulsamos la eficiencia operativa mediante automatización, IoT industrial y conectividad avanzada para plantas manufactureras.',
    hero_image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80',
    keywords: ['industria', 'industrial', 'fabrica', 'planta', 'manufactura', 'produccion'],
    color_theme: 'indigo',
    seo_title: 'Industria 4.0 y Automatización Industrial | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para industrias. IoT industrial, automatización, redes industriales, seguridad OT.',
    seo_keywords: 'industria 4.0 mendoza, automatizacion industrial cuyo',
    stats: [
      { label: 'Proyectos', value: '6+' },
      { label: 'Plantas', value: '50+' },
      { label: 'Soporte', value: '24/7' },
    ],
    activo: true,
    orden: 5,
    valueProps: [
      { icono: 'factory', titulo: 'Automatización Industrial', descripcion: 'Integración de redes OT/IT, protocolos industriales y sistemas SCADA para control en tiempo real de procesos productivos.', orden: 1 },
      { icono: 'activity', titulo: 'Monitoreo Continuo', descripcion: 'Telemetría de equipos, sensores IoT y dashboards para optimizar eficiencia y detectar fallas preventivamente.', orden: 2 },
      { icono: 'zap', titulo: 'Energía Estabilizada', descripcion: 'Soluciones de respaldo eléctrico, UPS industriales y sistemas de tierra para proteger maquinaria de alta inversión.', orden: 3 },
    ],
    serviciosIds: [101, 103, 108, 102, 107, 106],
  },
  {
    slug: 'mineria',
    nombre: 'Minería',
    emoji: '⛏️',
    descripcion: 'Infraestructura tecnológica extrema para operaciones mineras en entornos de alta exigencia.',
    hero_image: 'https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=1920&q=80',
    keywords: ['mineria', 'minera', 'yacimiento', 'extraccion', 'mina'],
    color_theme: 'orange',
    seo_title: 'Tecnología para Minería | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para minería. Redes de larga distancia, comunicaciones satelitales, sistemas resistentes.',
    seo_keywords: 'tecnologia mineria mendoza, redes mineras, sistemas remotos',
    stats: [
      { label: 'Uptime', value: '99.9%' },
      { label: 'Soporte', value: '24/7' },
    ],
    activo: true,
    orden: 6,
    valueProps: [
      { icono: 'mountain', titulo: 'Operación en Altura', descripcion: 'Equipamiento certificado para alturas extremas (+4000msnm), con protección contra rayos UV, baja presión y temperaturas extremas.', orden: 1 },
      { icono: 'radio', titulo: 'Conectividad Remota', descripcion: 'Enlaces de microondas, fibra óptica de larga distancia y respaldo satelital para zonas sin infraestructura urbana.', orden: 2 },
      { icono: 'shield-check', titulo: 'Normativa Minera', descripcion: 'Cumplimiento de estándares internacionales de seguridad minera (IEC 60079, ATEX) con certificaciones para zonas clasificadas.', orden: 3 },
    ],
    serviciosIds: [101, 103, 102, 107, 108, 106],
  },
  {
    slug: 'salud',
    nombre: 'Salud',
    emoji: '🏥',
    descripcion: 'Soluciones tecnológicas especializadas para el sector salud: hospitales, clínicas, centros médicos y sistemas de telemedicina.',
    hero_image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=80',
    keywords: ['salud', 'hospital', 'clinica', 'sanatorio', 'medico', 'sanitario'],
    color_theme: 'emerald',
    seo_title: 'Tecnología para Salud | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Servicios tecnológicos para el sector salud. Redes hospitalarias, seguridad de datos médicos, telemedicina.',
    seo_keywords: 'tecnologia salud mendoza, redes hospitalarias, sistemas clinicas',
    stats: [
      { label: 'Uptime', value: '99.9%' },
      { label: 'Soporte', value: '24/7' },
    ],
    activo: true,
    orden: 7,
    valueProps: [
      { icono: 'heart-pulse', titulo: 'Alta Disponibilidad Médica', descripcion: 'Infraestructura redundante N+1 que garantiza conectividad 24/7 para sistemas críticos como historias clínicas electrónicas y equipamiento médico conectado.', orden: 1 },
      { icono: 'shield-plus', titulo: 'Seguridad HIPAA/PDPA', descripcion: 'Protección de datos sensibles de pacientes con encriptación end-to-end, backups automáticos y cumplimiento de normativas de protección de datos médicos.', orden: 2 },
      { icono: 'video', titulo: 'Telemedicina Integrada', descripcion: 'Plataformas de videoconferencia médica, integración con equipamiento de diagnóstico remoto y consultas virtuales seguras.', orden: 3 },
    ],
    serviciosIds: [101, 102, 104, 107, 108, 103],
  },
  {
    slug: 'seguridad-electronica',
    nombre: 'Seguridad Electrónica',
    emoji: '🔒',
    descripcion: 'Sistemas integrados de seguridad electrónica y vigilancia.',
    hero_image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1920&q=80',
    keywords: ['seguridad', 'vigilancia', 'cctv', 'alarma', 'control acceso', 'biometrico', 'monitoreo'],
    color_theme: 'red',
    seo_title: 'Seguridad Electrónica | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Sistemas de seguridad electrónica. CCTV, control de accesos, alarmas, videovigilancia y monitoreo 24/7.',
    seo_keywords: 'seguridad electronica mendoza, cctv cuyo, alarmas patagonia',
    stats: [
      { label: 'Proyectos', value: '6+' },
      { label: 'Uptime', value: '99.9%' },
      { label: 'Soporte', value: '24/7' },
    ],
    activo: true,
    orden: 8,
    valueProps: [
      { icono: 'shield-check', titulo: 'Protección Integral 360°', descripcion: 'Integración de CCTV, alarmas, control de accesos biométrico y detección de intrusión en una plataforma unificada.', orden: 1 },
      { icono: 'eye', titulo: 'Monitoreo Inteligente', descripcion: 'Análisis de video con IA, reconocimiento facial, detección de objetos abandonados y alertas automáticas en tiempo real.', orden: 2 },
      { icono: 'smartphone', titulo: 'Control Remoto Total', descripcion: 'Acceso desde app móvil, notificaciones push, visualización de cámaras en vivo y gestión de permisos desde cualquier lugar.', orden: 3 },
    ],
    serviciosIds: [102, 103, 107, 108, 101, 106],
  },
  {
    slug: 'software',
    nombre: 'Software',
    emoji: '💻',
    descripcion: 'Desarrollo de software a medida, aplicaciones web y móviles, y soluciones de gestión empresarial.',
    hero_image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1920&q=80',
    keywords: ['software', 'desarrollo', 'aplicacion', 'web', 'app', 'sistema', 'programacion'],
    color_theme: 'cyan',
    seo_title: 'Desarrollo de Software | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seo_description: 'Desarrollo de software a medida. Aplicaciones web, móviles, sistemas de gestión y soluciones IT personalizadas.',
    seo_keywords: 'desarrollo software mendoza, aplicaciones web cuyo, sistemas a medida',
    stats: [
      { label: 'Años', value: '10+' },
      { label: 'Entrega', value: '100%' },
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

// ============================================================================
// PASO 5: Cargar Datos
// ============================================================================

async function cargarSectores() {
  console.log('📥 Cargando sectores a Directus...');

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
      console.log(`     → ${serviciosIds.length} servicios relacionados`);

    } catch (error) {
      console.error(`  ❌ Error cargando sector ${sectorData.nombre}:`, error.message);
    }
  }

  console.log('\n✅ Todos los sectores cargados\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    await crearColeccionSectores();
    await crearColeccionValueProps();
    await crearRelacionSectoresServicios();
    await cargarSectores();

    console.log('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    console.log('📊 Resumen:');
    console.log(`   • ${sectoresData.length} sectores migrados`);
    console.log(`   • ${sectoresData.reduce((acc, s) => acc + s.valueProps.length, 0)} value props creados`);
    console.log(`   • ${sectoresData.reduce((acc, s) => acc + s.serviciosIds.length, 0)} relaciones sector-servicio establecidas`);
    console.log('\n✅ Directus ahora tiene CONTROL TOTAL del contenido');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    process.exit(1);
  }
}

main();
