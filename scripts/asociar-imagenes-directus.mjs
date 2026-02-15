#!/usr/bin/env node
/**
 * Script para asociar imágenes de antecedentes con registros en Directus
 * 
 * Este script:
 * 1. Lee todos los antecedentes de Directus
 * 2. Busca imágenes correspondientes en el directorio local
 * 3. Las sube a Directus Files
 * 4. Asocia las imágenes con los antecedentes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const IMAGENES_DIR = process.env.IMAGENES_DIR || '/root/fumbling-field/imagenes_antecedentes_versionproduccion';
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 10;

// Importar el mapeo de imágenes
const mapeoPath = path.join(__dirname, '../src/data/mapeo_imagenes_completo.js');
let mapeoImagenes = [];

try {
  const mapeoModule = await import(mapeoPath);
  mapeoImagenes = mapeoModule.mapeoImagenes || [];
  console.log(`✅ Mapeo de imágenes cargado: ${mapeoImagenes.length} registros`);
} catch (error) {
  console.error('❌ Error cargando mapeo de imágenes:', error.message);
  process.exit(1);
}

// Función para normalizar texto (quitar acentos, convertir a minúsculas)
function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Función para buscar imagen por cliente y título
function buscarImagen(cliente, titulo) {
  const clienteNorm = normalizar(cliente);
  const tituloNorm = normalizar(titulo);
  
  // Buscar en el mapeo
  const match = mapeoImagenes.find(item => {
    const clienteMapNorm = normalizar(item.cliente);
    const tituloMapNorm = normalizar(item.titulo_original);
    
    return clienteMapNorm.includes(clienteNorm.substring(0, 10)) ||
           clienteNorm.includes(clienteMapNorm.substring(0, 10)) ||
           tituloMapNorm.includes(tituloNorm.substring(0, 15)) ||
           tituloNorm.includes(tituloMapNorm.substring(0, 15));
  });
  
  return match ? match.nombre_archivo_generado : null;
}

// Función para obtener antecedentes de Directus
async function obtenerAntecedentes() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=id,Titulo,Cliente,Imagen`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo antecedentes:', error.message);
    return [];
  }
}

// Función principal
async function main() {
  console.log('\n🚀 Iniciando asociación de imágenes...\n');
  console.log(`📍 Directus URL: ${DIRECTUS_URL}`);
  console.log(`📁 Directorio imágenes: ${IMAGENES_DIR}`);
  console.log(`🔄 Modo: ${DRY_RUN ? 'DRY RUN (sin cambios)' : 'PRODUCCIÓN'}\n`);
  
  // Obtener antecedentes
  console.log('📥 Obteniendo antecedentes de Directus...');
  const antecedentes = await obtenerAntecedentes();
  console.log(`✅ ${antecedentes.length} antecedentes obtenidos\n`);
  
  // Filtrar antecedentes sin imagen
  const sinImagen = antecedentes.filter(a => !a.Imagen || a.Imagen === '');
  console.log(`🔍 Antecedentes sin imagen: ${sinImagen.length}\n`);
  
  // Estadísticas
  let encontradas = 0;
  let noEncontradas = 0;
  const resultados = [];
  
  // Procesar cada antecedente
  console.log('🔄 Procesando antecedentes...\n');
  
  // Función para esperar (delay)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < sinImagen.length; i++) {
    const antecedente = sinImagen[i];
    const imagenArchivo = buscarImagen(antecedente.Cliente, antecedente.Titulo);
    
    if (imagenArchivo) {
      encontradas++;
      
      if (!DRY_RUN) {
        // Construir la ruta completa de la imagen
        const rutaImagen = `/imagenes_antecedentes_versionproduccion/${imagenArchivo}`;
        
        try {
          // Actualizar el antecedente con la ruta de la imagen
          const updateResponse = await fetch(`${DIRECTUS_URL}/items/Antecedentes/${antecedente.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              Imagen: rutaImagen
            })
          });
          
          if (updateResponse.ok) {
            resultados.push({
              id: antecedente.id,
              titulo: antecedente.Titulo,
              cliente: antecedente.Cliente,
              imagen: imagenArchivo,
              status: 'ACTUALIZADO'
            });
            
            if ((i + 1) % 10 === 0) {
              console.log(`✅ Procesados ${i + 1}/${sinImagen.length} antecedentes`);
            }
            
            // Delay para evitar rate limiting (1 segundo cada 10 requests)
            if ((i + 1) % 10 === 0) {
              console.log('⏳ Esperando 2 segundos para evitar rate limiting...');
              await sleep(2000);
            }
          } else if (updateResponse.status === 429) {
            // Rate limit alcanzado
            console.log('⚠️  Rate limit alcanzado, esperando 5 segundos...');
            await sleep(5000);
            // Reintentar
            i--;
            continue;
          } else {
            resultados.push({
              id: antecedente.id,
              titulo: antecedente.Titulo,
              cliente: antecedente.Cliente,
              imagen: imagenArchivo,
              status: 'ERROR AL ACTUALIZAR'
            });
          }
        } catch (error) {
          console.error(`❌ Error actualizando antecedente ${antecedente.id}:`, error.message);
          resultados.push({
            id: antecedente.id,
            titulo: antecedente.Titulo,
            cliente: antecedente.Cliente,
            imagen: imagenArchivo,
            status: 'ERROR'
          });
        }
      } else {
        resultados.push({
          id: antecedente.id,
          titulo: antecedente.Titulo,
          cliente: antecedente.Cliente,
          imagen: imagenArchivo,
          status: 'ENCONTRADA (DRY RUN)'
        });
      }
    } else {
      noEncontradas++;
      resultados.push({
        id: antecedente.id,
        titulo: antecedente.Titulo,
        cliente: antecedente.Cliente,
        imagen: null,
        status: 'NO ENCONTRADA'
      });
    }
  }
  
  // Mostrar resultados
  console.log('\n📊 RESULTADOS:\n');
  console.log(`✅ Imágenes encontradas: ${encontradas}`);
  console.log(`❌ Imágenes no encontradas: ${noEncontradas}\n`);
  
  // Mostrar muestra de resultados
  console.log('📋 MUESTRA DE RESULTADOS (primeros 10):\n');
  resultados.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ID: ${r.id}`);
    console.log(`   Cliente: ${r.cliente}`);
    console.log(`   Título: ${r.titulo.substring(0, 50)}...`);
    console.log(`   Imagen: ${r.imagen ? '✅ ' + r.imagen.substring(0, 50) + '...' : '❌ No encontrada'}`);
    console.log('');
  });
  
  if (!DRY_RUN) {
    console.log('\n⚠️  Para aplicar los cambios, ejecuta el script con DRY_RUN=false');
  }
}

// Ejecutar
main().catch(console.error);
