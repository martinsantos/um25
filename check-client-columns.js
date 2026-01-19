const pool = require('./src/config/database');

async function checkColumns() {
  try {
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'persona_terceros'
    `);
    console.log('Columns in persona_terceros:', columns.map(c => c.COLUMN_NAME).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkColumns();
