// scripts/create-blog-collection.mjs
// Run once: node scripts/create-blog-collection.mjs
// Creates the blog_posts collection in Directus with all required fields.

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

async function post(path, body) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message || '';
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      console.log(`  ↳ Already exists, skipping: ${path}`);
      return data;
    }
    console.error(`  ✗ ${path}:`, msg);
    return null;
  }
  return data;
}

async function run() {
  console.log('Creating blog_posts collection...');

  await post('/collections', {
    collection: 'blog_posts',
    meta: { icon: 'article', note: 'Blog y noticias de ULTIMA MILLA', sort: 10 },
    schema: { name: 'blog_posts' },
  });

  const fields = [
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Publicado', value: 'published' }, { text: 'Borrador', value: 'draft' }, { text: 'Programado', value: 'scheduled' }] }, display: 'labels', width: 'half', required: true }, schema: { default_value: 'draft', max_length: 20 } },
    { field: 'slug', type: 'string', meta: { interface: 'input', note: 'URL del post (sin espacios, sin acentos)', width: 'half', required: true }, schema: { is_unique: true, max_length: 200 } },
    { field: 'titulo', type: 'string', meta: { interface: 'input', width: 'full', required: true }, schema: { max_length: 300 } },
    { field: 'resumen', type: 'text', meta: { interface: 'input-multiline', note: '2-3 líneas para cards y SEO', width: 'full', required: true }, schema: {} },
    { field: 'contenido', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full' }, schema: {} },
    { field: 'imagen_portada', type: 'uuid', meta: { interface: 'file-image', width: 'half' }, schema: {} },
    { field: 'categoria', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Noticias', value: 'noticias' }, { text: 'Proyectos', value: 'proyectos' }, { text: 'Técnico', value: 'tecnico' }, { text: 'Empresa', value: 'empresa' }] }, width: 'half', required: true }, schema: { max_length: 20 } },
    { field: 'tags', type: 'json', meta: { interface: 'tags', width: 'full' }, schema: {} },
    { field: 'fecha_publicacion', type: 'timestamp', meta: { interface: 'datetime', width: 'half' }, schema: {} },
    { field: 'tiempo_lectura', type: 'integer', meta: { interface: 'input', note: 'Minutos estimados de lectura', width: 'half' }, schema: { default_value: 5 } },
  ];

  for (const field of fields) {
    console.log(`  Creating field: ${field.field}`);
    await post(`/fields/blog_posts`, field);
  }

  console.log('\n✓ blog_posts collection ready.');
  console.log('Next: go to http://localhost:8055/admin and publish your first post.');
}

run().catch(console.error);
