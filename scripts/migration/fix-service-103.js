#!/usr/bin/env node
import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.ultimamilla.com.ar';
const TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

async function checkAndFix() {
  // 1. Get productos for service 103
  console.log('1. Obteniendo productos del servicio 103...\n');
  const response = await fetch(`${DIRECTUS_URL}/items/productos?filter[servicio_id][_eq]=103&sort=orden&fields=*`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  const productos = data.data;

  console.log(`Encontrados ${productos.length} productos:\n`);
  productos.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.titulo}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Orden: ${p.orden}`);
    console.log(`   Imagen UUID: ${p.imagen || 'SIN IMAGEN'}`);
    console.log('');
  });

  // 2. Find Contact Center and Videoconferencia
  const videoconferencia = productos.find(p => p.titulo.includes('Videoconferencia'));
  const contactCenter = productos.find(p => p.titulo.includes('Contact Center'));

  console.log('\n2. Comparando imágenes:\n');
  console.log(`Videoconferencia (${videoconferencia?.id}): ${videoconferencia?.imagen}`);
  console.log(`Contact Center (${contactCenter?.id}): ${contactCenter?.imagen}`);

  if (videoconferencia?.imagen === contactCenter?.imagen) {
    console.log('\n⚠️  PROBLEMA DETECTADO: Ambos usan la misma imagen!');

    // La imagen correcta para Contact Center es 3.4.png
    const correctUUID = '1f06a6b4-09a7-437f-9bfe-67a5b0ac9cfe'; // telecomunicaciones/3.4.png

    console.log(`\n3. Corrigiendo Contact Center (ID ${contactCenter.id})...`);
    console.log(`   Imagen actual: ${contactCenter.imagen}`);
    console.log(`   Imagen correcta: ${correctUUID}`);

    const updateResponse = await fetch(`${DIRECTUS_URL}/items/productos/${contactCenter.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imagen: correctUUID
      })
    });

    if (updateResponse.ok) {
      console.log('\n✅ Contact Center actualizado correctamente!');
      const result = await updateResponse.json();
      console.log('Resultado:', result.data);
    } else {
      const error = await updateResponse.text();
      console.log(`\n❌ Error: ${error}`);
    }
  } else {
    console.log('\n✅ Las imágenes son diferentes, no hay problema.');
  }
}

checkAndFix().catch(err => console.error('Error:', err.message));
