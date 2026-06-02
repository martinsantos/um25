const cheerio = require('cheerio');
const { Pool } = require('pg');

// Configuración PostgreSQL (Docker container)
const pool = new Pool({
    user: 'directus',
    host: 'localhost',
    database: 'directus',
    password: 'umbot_directus_2025!',
    port: 5432,
});

const urls = [
    { url: 'https://www.ultimamilla.com.ar/servicios', category: 'servicio' },
    { url: 'https://www.ultimamilla.com.ar/antecedentes', category: 'antecedente' },
    { url: 'https://www.ultimamilla.com.ar/nosotros', category: 'empresa' },
    { url: 'https://www.ultimamilla.com.ar/', category: 'inicio' }
];

function extractKeywords(text) {
    const stopWords = ['para', 'como', 'desde', 'hasta', 'este', 'esta', 'esto', 'años', 'más', 'muy', 'todo', 'toda', 'todos', 'todas'];
    const cleaned = text.toLowerCase()
        .replace(/[^\w\sáéíóúñ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    const words = cleaned.split(' ')
        .filter(word => word.length > 3)
        .filter(word => !stopWords.includes(word))
        .slice(0, 25);
    
    return [...new Set(words)];
}

async function indexContent() {
    console.log('🔄 Iniciando indexación UM CLI...');
    console.log('⏰ ' + new Date().toLocaleString());
    
    try {
        await pool.query('DELETE FROM cli_content');
        console.log('🧹 Tabla limpiada');
        
        for (const item of urls) {
            try {
                console.log('📄 Procesando: ' + item.url);
                
                const response = await fetch(item.url);
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                
                const html = await response.text();
                const $ = cheerio.load(html);
                
                const title = $('title').text().trim().slice(0, 200) || 'Sin título';
                
                let content = '';
                const selectors = ['main', '.content', 'article', '.main-content'];
                for (const sel of selectors) {
                    const found = $(sel).first().text();
                    if (found && found.length > content.length) {
                        content = found;
                    }
                }
                
                if (!content || content.length < 100) {
                    content = $('body').text();
                }
                
                content = content.replace(/\s+/g, ' ').trim().slice(0, 3000);
                const keywords = extractKeywords(content);
                
                if (content.length < 50) {
                    console.log('⚠️ Contenido muy corto, saltando...');
                    continue;
                }
                
                const result = await pool.query(
                    'INSERT INTO cli_content (url, title, content, keywords, category) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [item.url, title, content, keywords, item.category]
                );
                
                console.log('✅ ID ' + result.rows[0].id + ': ' + title.slice(0, 40) + '... (' + keywords.length + ' keywords)');
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error('❌ Error ' + item.url + ':', error.message);
            }
        }
        
        const total = await pool.query('SELECT COUNT(*) as total FROM cli_content');
        const stats = await pool.query('SELECT category, COUNT(*) as count FROM cli_content GROUP BY category');
        
        console.log('🎉 INDEXACIÓN COMPLETADA');
        console.log('📊 Total: ' + total.rows[0].total + ' documentos');
        console.log('📋 Por categoría:');
        stats.rows.forEach(row => {
            console.log('   ' + row.category + ': ' + row.count + ' docs');
        });
        
    } catch (error) {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔚 Conexión cerrada');
        process.exit(0);
    }
}

indexContent();
