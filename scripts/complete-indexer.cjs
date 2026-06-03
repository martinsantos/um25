const cheerio = require('cheerio');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'directus',
    host: 'localhost',
    database: 'directus',
    password: 'umbot_directus_2025!',
    port: 5432,
});

const baseUrl = 'https://ultimamilla.com.ar';
const sitemap = [
    '/',
    '/servicios',
    '/antecedentes', 
    '/nosotros',
    '/contacto'
];

// Extraer TODAS las URLs de antecedentes individuales
async function getAllAntecedentesUrls() {
    console.log('🔍 Extrayendo URLs de antecedentes...');
    try {
        const response = await fetch(`${baseUrl}/antecedentes`);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const urls = [];
        $('a[href*="/antecedentes/"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.includes('/antecedentes/') && href.split('/').length >= 4) {
                const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
                urls.push({
                    url: fullUrl,
                    type: 'antecedente_individual'
                });
            }
        });
        
        const uniqueUrls = [...new Set(urls.map(u => u.url))].map(url => ({ url, type: 'antecedente_individual' }));
        console.log(`📋 Encontrados ${uniqueUrls.length} antecedentes individuales`);
        return uniqueUrls;
    } catch (error) {
        console.error('❌ Error extrayendo antecedentes:', error.message);
        return [];
    }
}

// Extraer TODAS las URLs de servicios individuales  
async function getAllServiciosUrls() {
    console.log('🔍 Extrayendo URLs de servicios...');
    try {
        const response = await fetch(`${baseUrl}/servicios`);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const urls = [];
        $('a[href*="/servicios/"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.includes('/servicios/') && href.split('/').length >= 4) {
                const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
                urls.push({
                    url: fullUrl,
                    type: 'servicio_individual'
                });
            }
        });
        
        const uniqueUrls = [...new Set(urls.map(u => u.url))].map(url => ({ url, type: 'servicio_individual' }));
        console.log(`📋 Encontrados ${uniqueUrls.length} servicios individuales`);
        return uniqueUrls;
    } catch (error) {
        console.error('❌ Error extrayendo servicios:', error.message);
        return [];
    }
}

// Extraer contenido COMPLETO con metadatos enriquecidos
async function extractEnrichedContent(url, type) {
    try {
        console.log(`📄 Procesando: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Título principal con múltiples opciones
        let title = $('title').text().trim();
        if (!title || title.length < 10) {
            title = $('h1').first().text().trim();
        }
        if (!title || title.length < 10) {
            title = $('.title, .titulo, .heading').first().text().trim();
        }
        if (!title) {
            title = 'Sin título';
        }
        
        // Imagen principal (para envío por correo)
        let mainImage = null;
        
        // Priorizar meta tags
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            mainImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
        } else {
            // Buscar primera imagen significativa
            const imgs = $('img').not('[src*="logo"], [src*="icon"]');
            if (imgs.length > 0) {
                const firstImg = $(imgs[0]).attr('src');
                if (firstImg) {
                    mainImage = firstImg.startsWith('http') ? firstImg : `${baseUrl}${firstImg}`;
                }
            }
        }
        
        // Contenido completo con múltiples selectores
        let fullContent = '';
        
        // Contenido principal
        const mainSelectors = ['main', 'article', '.content', '.description', '.detail', '.info'];
        mainSelectors.forEach(selector => {
            $(selector).each((i, elem) => {
                const text = $(elem).text().trim();
                if (text.length > 50) {
                    fullContent += text + ' ';
                }
            });
        });
        
        // Características específicas y detalles técnicos
        const detailSelectors = ['.feature', '.caracteristica', '.detalle', '.spec', '.specification', '.tech-detail'];
        detailSelectors.forEach(selector => {
            $(selector).each((i, elem) => {
                fullContent += $(elem).text().trim() + ' ';
            });
        });
        
        // Listas técnicas (muy importantes)
        $('ul li, ol li').each((i, elem) => {
            const listItem = $(elem).text().trim();
            if (listItem.length > 20 && listItem.length < 300) {
                fullContent += listItem + '. ';
            }
        });
        
        // Párrafos informativos
        $('p').each((i, elem) => {
            const paragraph = $(elem).text().trim();
            if (paragraph.length > 30 && paragraph.length < 500) {
                fullContent += paragraph + ' ';
            }
        });
        
        // Cliente/empresa (para antecedentes)
        let cliente = '';
        const clientSelectors = ['.cliente', '.client', '.company', '.empresa'];
        clientSelectors.forEach(selector => {
            if (!cliente) {
                cliente = $(selector).first().text().trim();
            }
        });
        
        // Buscar en títulos H2/H3 por menciones de cliente
        if (!cliente) {
            $('h2, h3').each((i, elem) => {
                const text = $(elem).text().toLowerCase();
                if (text.includes('cliente') || text.includes('empresa') || text.includes('proyecto')) {
                    cliente = $(elem).text().trim();
                    return false; // break
                }
            });
        }
        
        // Extraer cliente del título si es antecedente
        if (!cliente && type.includes('antecedente') && title.includes(' - ')) {
            const parts = title.split(' - ');
            if (parts.length >= 2) {
                cliente = parts[0].trim();
            }
        }
        
        // Limpiar y procesar contenido
        const cleanContent = fullContent
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .replace(/\t+/g, ' ')
            .trim()
            .slice(0, 4000); // Más contenido
        
        // Keywords enriquecidos
        const keywords = extractEnrichedKeywords(cleanContent, title, url);
        
        // Metadatos para email
        const emailData = {
            subject: `Información sobre: ${title}`,
            body: `Hola,\n\nTe envío información sobre ${title}:\n\n${cleanContent.slice(0, 800)}...\n\nPuedes ver más detalles en: ${url}\n\nSaludos,\nEquipo Ultima Milla\nultimamilla.com.ar`,
            url: url,
            image: mainImage,
            client: cliente
        };
        
        return {
            url,
            title: title.slice(0, 250),
            content: cleanContent,
            keywords,
            category: type,
            client: cliente || null,
            main_image: mainImage,
            email_data: JSON.stringify(emailData),
            indexed_at: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`❌ Error procesando ${url}:`, error.message);
        return null;
    }
}

function extractEnrichedKeywords(content, title, url) {
    // Combinar título y contenido
    const fullText = `${title} ${content}`.toLowerCase();
    
    // Keywords técnicos específicos de Ultima Milla
    const technicalTerms = [
        // Redes y comunicaciones
        'firewall', 'vpn', 'wifi', 'lan', 'wan', 'switch', 'router', 'cisco', 'ubiquiti', 'mikrotik',
        'ethernet', 'fibra', 'óptica', 'cableado', 'estructurado', 'cat6', 'cat6a', 'poe',
        
        // Sistemas operativos y virtualización
        'windows', 'linux', 'ubuntu', 'centos', 'vmware', 'hyper-v', 'docker', 'kubernetes',
        'servidor', 'server', 'virtualización', 'virtualization',
        
        // Bases de datos
        'mysql', 'postgresql', 'mongodb', 'redis', 'backup', 'recovery', 'sql',
        
        // Desarrollo web
        'php', 'python', 'javascript', 'react', 'nodejs', 'laravel', 'symfony', 'codeigniter',
        'html', 'css', 'bootstrap', 'jquery', 'vue', 'angular',
        
        // Cloud y hosting
        'aws', 'azure', 'google', 'cloud', 'hosting', 'cdn', 'cloudflare', 'linode',
        
        // Seguridad
        'ssl', 'https', 'security', 'antivirus', 'malware', 'ciberseguridad', 'firewall',
        'cámaras', 'videovigilancia', 'monitoreo', 'alarmas', 'detección',
        
        // E-commerce y CMS
        'ecommerce', 'wordpress', 'shopify', 'woocommerce', 'prestashop', 'magento',
        'drupal', 'joomla', 'cms',
        
        // Hardware y marcas
        'hp', 'dell', 'lenovo', 'asus', 'intel', 'amd', 'nvidia',
        'hikvision', 'dahua', 'axis', 'bosch', 'honeywell',
        
        // Industrias específicas
        'gobierno', 'mendoza', 'ministerio', 'municipalidad', 'hospital', 'clínica',
        'bodega', 'vitivinícola', 'vino', 'agricultura', 'industrial',
        'aeropuerto', 'transporte', 'logística',
        
        // Servicios específicos
        'consultoría', 'soporte', 'mantenimiento', 'instalación', 'configuración',
        'migración', 'actualización', 'optimización'
    ];
    
    // Extraer palabras relevantes del contenido
    const words = fullText
        .replace(/[^\w\sáéíóúñüç]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['para', 'como', 'desde', 'hasta', 'este', 'esta', 'esto', 'estos', 'estas', 'años', 'más', 'muy', 'todo', 'toda', 'todos', 'todas', 'con', 'por', 'una', 'uno', 'del', 'las', 'los', 'que', 'son', 'fue', 'ser', 'estar', 'tiene', 'tienen', 'hace', 'hacen'].includes(word));
    
    // Combinar palabras encontradas + términos técnicos presentes
    const foundTechnical = technicalTerms.filter(term => fullText.includes(term));
    const uniqueWords = [...new Set(words)];
    
    // Priorizar términos técnicos y palabras más relevantes
    const allKeywords = [...foundTechnical, ...uniqueWords.slice(0, 25)];
    
    return [...new Set(allKeywords)].slice(0, 35);
}

async function completeIndexing() {
    console.log('🚀 INDEXER COMPLETO Y ENRIQUECIDO INICIADO');
    console.log('⏰ ' + new Date().toLocaleString());
    
    try {
        // Recrear tabla con campos enriquecidos
        await pool.query(`
            DROP TABLE IF EXISTS cli_content;
            CREATE TABLE cli_content (
                id SERIAL PRIMARY KEY,
                url TEXT UNIQUE,
                title TEXT,
                content TEXT,
                keywords TEXT[],
                category VARCHAR(50),
                client TEXT,
                main_image TEXT,
                email_data JSONB,
                indexed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX idx_keywords ON cli_content USING GIN(keywords);
            CREATE INDEX idx_category ON cli_content(category);
            CREATE INDEX idx_client ON cli_content(client);
            CREATE INDEX idx_title ON cli_content(title);
        `);
        
        console.log('✅ Tabla recreada con campos enriquecidos');
        
        let totalIndexed = 0;
        
        // 1. Páginas principales del sitio
        console.log('\n📄 INDEXANDO PÁGINAS PRINCIPALES...');
        for (const path of sitemap) {
            const url = `${baseUrl}${path}`;
            const content = await extractEnrichedContent(url, 'pagina_principal');
            if (content && content.content.length > 100) {
                await insertContent(content);
                console.log(`✅ ${content.title.slice(0, 60)}... (${content.keywords.length} keywords)`);
                totalIndexed++;
            }
            await sleep(2000); // Ser respetuoso con el servidor
        }
        
        // 2. TODOS los antecedentes individuales
        console.log('\n📊 INDEXANDO ANTECEDENTES INDIVIDUALES...');
        const antecedentesUrls = await getAllAntecedentesUrls();
        
        for (const {url} of antecedentesUrls.slice(0, 30)) { // Procesar hasta 30 antecedentes
            const content = await extractEnrichedContent(url, 'antecedente');
            if (content && content.content.length > 100) {
                await insertContent(content);
                console.log(`✅ ${content.title.slice(0, 60)}... ${content.client ? `(Cliente: ${content.client.slice(0, 20)})` : ''}`);
                totalIndexed++;
            }
            await sleep(3000); // Pausa más larga para antecedentes
        }
        
        // 3. TODOS los servicios individuales
        console.log('\n🛠️ INDEXANDO SERVICIOS INDIVIDUALES...');
        const serviciosUrls = await getAllServiciosUrls();
        
        for (const {url} of serviciosUrls.slice(0, 15)) { // Procesar hasta 15 servicios
            const content = await extractEnrichedContent(url, 'servicio');
            if (content && content.content.length > 100) {
                await insertContent(content);
                console.log(`✅ ${content.title.slice(0, 60)}... (${content.keywords.length} keywords)`);
                totalIndexed++;
            }
            await sleep(3000);
        }
        
        // Estadísticas finales detalladas
        const stats = await pool.query(`
            SELECT 
                category, 
                COUNT(*) as count,
                AVG(array_length(keywords, 1)) as avg_keywords,
                COUNT(CASE WHEN main_image IS NOT NULL THEN 1 END) as with_images,
                COUNT(CASE WHEN client IS NOT NULL THEN 1 END) as with_clients
            FROM cli_content 
            GROUP BY category
            ORDER BY count DESC
        `);
        
        const topKeywords = await pool.query(`
            SELECT keyword, COUNT(*) as frequency
            FROM cli_content, unnest(keywords) AS keyword
            GROUP BY keyword
            ORDER BY frequency DESC
            LIMIT 10
        `);
        
        console.log('\n🎉 INDEXACIÓN COMPLETA Y ENRIQUECIDA FINALIZADA');
        console.log(`📊 Total documentos indexados: ${totalIndexed}`);
        console.log('\n📋 Por categoría:');
        stats.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.count} docs | ${Math.round(row.avg_keywords)} keywords promedio | ${row.with_images} con imágenes | ${row.with_clients} con clientes`);
        });
        
        console.log('\n🔥 Keywords más frecuentes:');
        topKeywords.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ${row.keyword} (${row.frequency} docs)`);
        });
        
        // Verificación final
        const totalCheck = await pool.query('SELECT COUNT(*) as total FROM cli_content');
        console.log(`\n✅ VERIFICACIÓN: ${totalCheck.rows[0].total} documentos en base de datos`);
        
    } catch (error) {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔚 Conexión cerrada - INDEXACIÓN COMPLETADA');
        process.exit(0);
    }
}

async function insertContent(content) {
    try {
        await pool.query(`
            INSERT INTO cli_content (url, title, content, keywords, category, client, main_image, email_data, indexed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (url) DO UPDATE SET
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                keywords = EXCLUDED.keywords,
                client = EXCLUDED.client,
                main_image = EXCLUDED.main_image,
                email_data = EXCLUDED.email_data,
                indexed_at = EXCLUDED.indexed_at
        `, [content.url, content.title, content.content, content.keywords, content.category, 
            content.client, content.main_image, content.email_data, content.indexed_at]);
    } catch (error) {
        console.error(`❌ Error insertando ${content.url}:`, error.message);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar indexación completa
completeIndexing();
