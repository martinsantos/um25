import { createDirectus, rest, readItems } from '@directus/sdk';

const directus = createDirectus('http://localhost:8055')
  .with(rest());

console.log('=== DIAGNOSTIC: Productos for Service 103 (Telecomunicaciones) ===\n');

try {
  // Query all productos for service 103
  const productos = await directus.request(
    readItems('productos', {
      filter: { servicio_id: { _eq: 103 } },
      sort: ['orden', 'id'],
      fields: ['id', 'titulo', 'servicio_id', 'orden', 'imagen']
    })
  );

  console.log(`Found ${productos.length} products with servicio_id = 103:\n`);
  productos.forEach((p, idx) => {
    console.log(`${idx + 1}. ID: ${p.id}`);
    console.log(`   Titulo: ${p.titulo}`);
    console.log(`   Servicio ID: ${p.servicio_id}`);
    console.log(`   Orden: ${p.orden}`);
    console.log(`   Imagen: ${p.imagen || 'null'}`);
    console.log('');
  });

  // Specifically check products 18 and 19
  console.log('\n=== Checking Products 18 and 19 ===\n');

  const product18 = await directus.request(
    readItems('productos', {
      filter: { id: { _eq: 18 } },
      fields: ['id', 'titulo', 'servicio_id', 'imagen']
    })
  );

  const product19 = await directus.request(
    readItems('productos', {
      filter: { id: { _eq: 19 } },
      fields: ['id', 'titulo', 'servicio_id', 'imagen']
    })
  );

  if (product18.length > 0) {
    console.log('Product 18:');
    console.log(JSON.stringify(product18[0], null, 2));
  } else {
    console.log('Product 18: NOT FOUND');
  }

  console.log('');

  if (product19.length > 0) {
    console.log('Product 19:');
    console.log(JSON.stringify(product19[0], null, 2));
  } else {
    console.log('Product 19: NOT FOUND');
  }

  // Check if there are any productos with titles matching "Videoconferencia" or "Contact Center"
  console.log('\n=== Searching by Title ===\n');

  const videoconf = await directus.request(
    readItems('productos', {
      filter: { titulo: { _contains: 'Videoconferencia' } },
      fields: ['id', 'titulo', 'servicio_id', 'imagen']
    })
  );

  const contactCenter = await directus.request(
    readItems('productos', {
      filter: { titulo: { _contains: 'Contact Center' } },
      fields: ['id', 'titulo', 'servicio_id', 'imagen']
    })
  );

  console.log('Products matching "Videoconferencia":');
  console.log(JSON.stringify(videoconf, null, 2));

  console.log('\nProducts matching "Contact Center":');
  console.log(JSON.stringify(contactCenter, null, 2));

} catch (error) {
  console.error('Error:', error);
}
