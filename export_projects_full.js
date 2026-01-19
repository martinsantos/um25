const pool = require('./src/config/database');
const fs = require('fs');

async function exportProjects() {
  try {
    const query = `
      SELECT 
        p.id, 
        p.descripcion, 
        p.created as fecha,
        c.nombre as cliente_nombre, 
        c.apellido as cliente_apellido,
        c.rubro_categoria_id
      FROM proyectos p
      LEFT JOIN persona_terceros c ON p.personal_id = c.id
      ORDER BY p.created DESC
    `;

    const [rows] = await pool.query(query);
    console.log(`Found ${rows.length} projects.`);

    fs.writeFileSync('projects_export_sgi.json', JSON.stringify(rows, null, 2));
    console.log('Exported to projects_export_sgi.json');

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

exportProjects();
