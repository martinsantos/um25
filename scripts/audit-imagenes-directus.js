/**
 * Script para auditar imágenes en Directus
 * Verifica que:
 * 1. Todos los servicios tienen imagen
 * 2. Todas las imágenes son únicas (no repetidas)
 * 3. Todos los antecedentes tienen imagen
 *
 * Uso: node scripts/audit-imagenes-directus.js
 */

import { createDirectus, rest, readItems } from '@directus/sdk';

/**
 * Audita imágenes de servicios y antecedentes
 */
async function auditImagenes() {
  console.log('🔍 Auditando imágenes en Directus...\n');

  try {
    // Crear cliente Directus
    const client = createDirectus('http://localhost:8055').with(rest());

    // === SERVICIOS ===
    console.log('📦 SERVICIOS\n');

    const servicios = await client.request(
      readItems('Servicios', {
        fields: ['id', 'Titulo', 'Imagen'],
        sort: ['id'],
        limit: -1
      })
    );

    console.log(`Total servicios: ${servicios.length}\n`);

    // Verificar que todos tienen imagen
    const serviciosSinImagen = servicios.filter(s => !s.Imagen);
    if (serviciosSinImagen.length > 0) {
      console.log('❌ Servicios SIN imagen:');
      serviciosSinImagen.forEach(s => {
        console.log(`   - [${s.id}] ${s.Titulo}`);
      });
      console.log('');
    } else {
      console.log('✅ Todos los servicios tienen imagen\n');
    }

    // Detectar imágenes duplicadas
    const imagenesServicios = {};
    servicios.forEach(s => {
      if (s.Imagen) {
        if (!imagenesServicios[s.Imagen]) {
          imagenesServicios[s.Imagen] = [];
        }
        imagenesServicios[s.Imagen].push({ id: s.id, titulo: s.Titulo });
      }
    });

    const duplicadosServicios = Object.entries(imagenesServicios).filter(([uuid, items]) => items.length > 1);

    if (duplicadosServicios.length > 0) {
      console.log('⚠️  IMÁGENES DUPLICADAS en Servicios:\n');
      duplicadosServicios.forEach(([uuid, items]) => {
        console.log(`   UUID: ${uuid}`);
        items.forEach(item => {
          console.log(`      - [${item.id}] ${item.titulo}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ Todas las imágenes de servicios son ÚNICAS\n');
    }

    // Resumen servicios
    console.log('📊 Resumen Servicios:');
    console.log(`   Total: ${servicios.length}`);
    console.log(`   Con imagen: ${servicios.length - serviciosSinImagen.length}`);
    console.log(`   Sin imagen: ${serviciosSinImagen.length}`);
    console.log(`   Imágenes únicas: ${Object.keys(imagenesServicios).length}`);
    console.log(`   Imágenes duplicadas: ${duplicadosServicios.length}`);
    console.log('');

    // === ANTECEDENTES ===
    console.log('\n📋 ANTECEDENTES\n');

    const antecedentes = await client.request(
      readItems('Antecedentes', {
        fields: ['id', 'Titulo', 'Imagen'],
        limit: -1
      })
    );

    console.log(`Total antecedentes: ${antecedentes.length}\n`);

    // Verificar que todos tienen imagen
    const antecedentesSinImagen = antecedentes.filter(a => !a.Imagen);

    if (antecedentesSinImagen.length > 0) {
      console.log(`⚠️  Antecedentes SIN imagen: ${antecedentesSinImagen.length}`);
      console.log('   (Primeros 10):');
      antecedentesSinImagen.slice(0, 10).forEach(a => {
        console.log(`   - [${a.id}] ${a.Titulo}`);
      });
      console.log('');
    } else {
      console.log('✅ Todos los antecedentes tienen imagen\n');
    }

    // Detectar imágenes duplicadas en antecedentes
    const imagenesAntecedentes = {};
    antecedentes.forEach(a => {
      if (a.Imagen) {
        if (!imagenesAntecedentes[a.Imagen]) {
          imagenesAntecedentes[a.Imagen] = [];
        }
        imagenesAntecedentes[a.Imagen].push({ id: a.id, titulo: a.Titulo });
      }
    });

    const duplicadosAntecedentes = Object.entries(imagenesAntecedentes).filter(([uuid, items]) => items.length > 1);

    if (duplicadosAntecedentes.length > 0) {
      console.log(`⚠️  IMÁGENES DUPLICADAS en Antecedentes: ${duplicadosAntecedentes.length}\n`);
      console.log('   (Primeras 5 duplicadas):');
      duplicadosAntecedentes.slice(0, 5).forEach(([uuid, items]) => {
        console.log(`   UUID: ${uuid.substring(0, 8)}...`);
        items.forEach(item => {
          console.log(`      - [${item.id}] ${item.titulo}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ Todas las imágenes de antecedentes son ÚNICAS\n');
    }

    // Resumen antecedentes
    console.log('📊 Resumen Antecedentes:');
    console.log(`   Total: ${antecedentes.length}`);
    console.log(`   Con imagen: ${antecedentes.length - antecedentesSinImagen.length}`);
    console.log(`   Sin imagen: ${antecedentesSinImagen.length}`);
    console.log(`   Imágenes únicas: ${Object.keys(imagenesAntecedentes).length}`);
    console.log(`   Imágenes duplicadas: ${duplicadosAntecedentes.length}`);
    console.log('');

    // === RESUMEN GENERAL ===
    console.log('\n\n✅ AUDITORÍA COMPLETADA\n');

    const totalProblemas = serviciosSinImagen.length + duplicadosServicios.length + antecedentesSinImagen.length + duplicadosAntecedentes.length;

    if (totalProblemas === 0) {
      console.log('🎉 ¡PERFECTO! No se encontraron problemas:');
      console.log('   ✅ Todos los servicios tienen imagen');
      console.log('   ✅ Todas las imágenes de servicios son únicas');
      console.log('   ✅ Todos los antecedentes tienen imagen');
      console.log('   ✅ Todas las imágenes de antecedentes son únicas');
    } else {
      console.log(`⚠️  Se encontraron ${totalProblemas} problemas:`);
      if (serviciosSinImagen.length > 0) console.log(`   - ${serviciosSinImagen.length} servicios sin imagen`);
      if (duplicadosServicios.length > 0) console.log(`   - ${duplicadosServicios.length} imágenes duplicadas en servicios`);
      if (antecedentesSinImagen.length > 0) console.log(`   - ${antecedentesSinImagen.length} antecedentes sin imagen`);
      if (duplicadosAntecedentes.length > 0) console.log(`   - ${duplicadosAntecedentes.length} imágenes duplicadas en antecedentes`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error en auditoría:', error.message);
    process.exit(1);
  }
}

// Ejecutar
auditImagenes();
