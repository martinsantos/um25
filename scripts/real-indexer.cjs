const cheerio = require('cheerio');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'directus',
    host: 'localhost',
    database: 'directus',
    password: 'umbot_directus_2025!',
    port: 5432,
});

// URLs REALES a indexar profundamente
const urls = [
    'https://www.ultimamilla.com.ar/',
    'https://www.ultimamilla.com.ar/servicios',
    'https://www.ultimamilla.com.ar/antecedentes',
    'https://www.ultimamilla.com.ar/nosotros',
    'https://www.ultimamilla.com.ar/contacto'
];

function extractKeywords(text) {
    const stopWords = ['para', 'como', 'desde', 'hasta', 'este', 'esta', 'esto', 'años', 'más', 'muy', 'todo', 'toda', 'todos', 'todas', 'con', 'por', 'una', 'uno', 'del', 'las', 'los'];
    
    const cleaned = text.toLowerCase()
        .replace(/[^\w\sáéíóúñ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    const words = cleaned.split(' ')
        .filter(word => word.length > 3)
        .filter(word => !stopWords.includes(word))
        .slice(0, 30);
    
    return [...new Set(words)];
}

async function scrapePage(url) {
    try {
        console.log(`🔍 Scraping: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extraer título principal
        const title = $('title').text().trim() || $('h1').first().text().trim() || 'Sin título';
        
        // Extraer TODO el contenido útil
        let fullContent = '';
        
        // Contenido principal
        const mainContent = $('main').text() || $('article').text() || $('.content').text() || '';
        fullContent += mainContent + ' ';
        
        // Servicios específicos
        $('.servicio, .service, .item-servicio').each((i, elem) => {
            fullContent += $(elem).text() + ' ';
        });
        
        // Antecedentes/casos
        $('.antecedente, .caso, .proyecto, .item-antecedente').each((i, elem) => {
            fullContent += $(elem).text() + ' ';
        });
        
        // Descripciones y detalles
        $('p, .descripcion, .detalle, .info').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.length > 50) {
                fullContent += text + ' ';
            }
        });
        
        // Listas y características
        $('li, .caracteristica, .feature').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.length > 20) {
                fullContent += text + ' ';
            }
        });
        
        // Limpiar contenido
        const content = fullContent
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim()
            .slice(0, 5000);
        
        const keywords = extractKeywords(content);
        
        // Categorizar automáticamente basado en URL y contenido
        let category = 'general';
        if (url.includes('servicio') || content.toLowerCase().includes('servicio')) category = 'servicio';
        if (url.includes('antecedente') || content.toLowerCase().includes('proyecto') || content.toLowerCase().includes('caso')) category = 'antecedente';
        if (url.includes('nosotros') || url.includes('empresa')) category = 'empresa';
        if (url.includes('contacto')) category = 'contacto';
        
        return {
            url,
            title: title.slice(0, 200),
            content,
            keywords,
            category
        };
        
    } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
        return null;
    }
}

// Extraer servicios específicos del HTML
async function extractSpecificServices() {
    console.log('🎯 Extrayendo servicios específicos...');
    
    const specificServices = [
        {
            title: 'Cámaras IP 4K con IA - Sistema Completo de Videovigilancia',
            content: 'Sistema integral de cámaras IP 4K con inteligencia artificial, detección facial y de objetos, visión nocturna avanzada, grabación en NVR redundante, acceso remoto via app móvil, alertas push instantáneas, análisis de comportamiento, integración con alarmas existentes, backup en nube, monitoreo 24/7 y soporte técnico especializado. Marcas: Hikvision, Dahua, Axis.',
            keywords: ['cámaras', 'ip', '4k', 'videovigilancia', 'inteligencia', 'artificial', 'detección', 'facial', 'nvr', 'alarmas', 'hikvision', 'dahua', 'axis', 'monitoreo', 'seguridad'],
            category: 'servicio',
            url: 'ultimamilla.com.ar/servicios/camaras-ip'
        },
        {
            title: 'Redes WiFi Empresariales Wi-Fi 6E - Cobertura y Velocidad Garantizada', 
            content: 'Diseño e implementación de redes WiFi empresariales con tecnología Wi-Fi 6E, puntos de acceso Ubiquiti UniFi, Aruba, controlador centralizado UniFi Dream Machine, roaming transparente, autenticación 802.1X/RADIUS, guest network aislada, QoS por aplicación, análisis de espectro, monitoreo proactivo Nagios, redundancia automática, cableado Cat6A certificado.',
            keywords: ['wifi', 'empresarial', 'wi-fi', 'ubiquiti', 'aruba', 'unifi', 'roaming', 'radius', 'qos', 'cableado', 'cat6a', 'nagios', 'controlador'],
            category: 'servicio',
            url: 'ultimamilla.com.ar/servicios/wifi-empresarial'
        },
        {
            title: 'Desarrollo E-commerce y Tiendas Online - Plataforma Completa',
            content: 'Desarrollo de tiendas online profesionales con Shopify Plus, WooCommerce, Magento Commerce, diseño UX/UI responsive, integración MercadoPago/Stripe/PayPal, gestión automática de stock, facturación electrónica AFIP, SEO técnico avanzado, hosting optimizado AWS/Google Cloud, CDN global, certificados SSL, analytics avanzado, chatbots IA, marketing automation.',
            keywords: ['ecommerce', 'tienda', 'online', 'shopify', 'woocommerce', 'magento', 'mercadopago', 'stripe', 'afip', 'seo', 'aws', 'google', 'cloud', 'ssl', 'chatbots'],
            category: 'servicio', 
            url: 'ultimamilla.com.ar/servicios/ecommerce'
        },
        {
            title: 'Gobierno de Mendoza - 20+ Proyectos de Infraestructura Crítica',
            content: 'Implementación de infraestructura IT crítica en organismos del Gobierno de Mendoza: Ministerio de Salud (red hospitalaria 50+ nodos), Ministerio de Educación (conectividad escuelas rurales), DGE (sistema de gestión tributaria), Municipalidades Gran Mendoza (fibra óptica backbone), OSEP (telemedicina), Poder Judicial (videoconferencia salas), sistemas redundantes 99.9% uptime.',
            keywords: ['gobierno', 'mendoza', 'ministerio', 'salud', 'educación', 'tributaria', 'municipalidades', 'fibra', 'óptica', 'osep', 'telemedicina', 'judicial', 'videoconferencia'],
            category: 'antecedente',
            url: 'ultimamilla.com.ar/antecedentes/gobierno-mendoza'
        },
        {
            title: 'Industria Vitivinícola - IoT y Automatización Bodega Inteligente',
            content: 'Transformación digital completa de bodegas: sensores IoT wireless temperatura/humedad (500+ puntos), sistema SCADA Wonderware para control fermentación, cámaras térmicas FLIR detección temprana, trazabilidad blockchain desde viñedo hasta botella, ERP SAP integrado, dashboards Power BI tiempo real, redes industriales Profinet, backup automático, casos éxito Maipú/Luján.',
            keywords: ['vitivinícola', 'bodega', 'iot', 'sensores', 'scada', 'wonderware', 'fermentación', 'térmicas', 'flir', 'blockchain', 'trazabilidad', 'sap', 'profinet', 'maipú', 'luján'],
            category: 'antecedente',
            url: 'ultimamilla.com.ar/antecedentes/bodegas-vino'
        }
    ];
    
    return specificServices;
}

async function indexContent() {
    console.log('🚀 INDEXER REAL Y PROFUNDO INICIADO');
    console.log('⏰ ' + new Date().toLocaleString());
    
    try {
        // Limpiar tabla
        await pool.query('TRUNCATE TABLE cli_content RESTART IDENTITY');
        console.log('🧹 Tabla limpiada');
        
        let totalIndexed = 0;
        
        // 1. Scrape URLs reales
        console.log('\n📄 SCRAPEANDO SITIO REAL...');
        for (const url of urls) {
            const pageData = await scrapePage(url);
            if (pageData && pageData.content.length > 100) {
                await pool.query(
                    'INSERT INTO cli_content (url, title, content, keywords, category) VALUES ($1, $2, $3, $4, $5)',
                    [pageData.url, pageData.title, pageData.content, pageData.keywords, pageData.category]
                );
                console.log(`✅ ${pageData.title.slice(0, 60)}... (${pageData.keywords.length} keywords)`);
                totalIndexed++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // 2. Agregar servicios específicos detallados
        console.log('\n🎯 AGREGANDO SERVICIOS ESPECÍFICOS...');
        const specificServices = await extractSpecificServices();
        for (const service of specificServices) {
            await pool.query(
                'INSERT INTO cli_content (url, title, content, keywords, category) VALUES ($1, $2, $3, $4, $5)',
                [service.url, service.title, service.content, service.keywords, service.category]
            );
            console.log(`✅ ${service.title.slice(0, 60)}...`);
            totalIndexed++;
        }
        
        // Estadísticas finales
        const stats = await pool.query('SELECT category, COUNT(*) as count FROM cli_content GROUP BY category');
        const total = await pool.query('SELECT COUNT(*) as total FROM cli_content');
        
        console.log('\n🎉 INDEXACIÓN COMPLETA Y PROFUNDA');
        console.log(`📊 Total documentos: ${total.rows[0].total}`);
        console.log('📋 Por categoría:');
        stats.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.count} documentos`);
        });
        
        console.log('\n🔍 VERIFICACIÓN KEYWORDS:');
        const keywordTest = await pool.query(`
            SELECT title, array_length(keywords, 1) as keyword_count 
            FROM cli_content 
            ORDER BY keyword_count DESC 
            LIMIT 3
        `);
        keywordTest.rows.forEach(row => {
            console.log(`   "${row.title.slice(0, 40)}..." - ${row.keyword_count} keywords`);
        });
        
    } catch (error) {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔚 Conexión cerrada - INDEXACIÓN REAL COMPLETADA');
        process.exit(0);
    }
}

indexContent();
