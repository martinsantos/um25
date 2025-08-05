const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8095;

// Simular respuestas de endpoints PHP
function handlePHPRequest(url, method, body) {
    if (url === '/log/api_logs.php') {
        const params = new URLSearchParams(url.split('?')[1] || '');
        const action = params.get('action');
        const limit = parseInt(params.get('limit')) || 50;
        
        if (method === 'GET') {
            // Simular logs
            const mockLogs = [
                {
                    id: 'log_' + Date.now(),
                    timestamp: Math.floor(Date.now() / 1000),
                    datetime: new Date().toLocaleString('es-ES'),
                    type: 'info',
                    message: 'Dashboard iniciado correctamente',
                    source: 'dashboard',
                    read: false
                },
                {
                    id: 'log_' + (Date.now() - 1000),
                    timestamp: Math.floor((Date.now() - 1000) / 1000),
                    datetime: new Date(Date.now() - 1000).toLocaleString('es-ES'),
                    type: 'system',
                    message: 'Sistema de logs operativo',
                    source: 'system',
                    read: false
                }
            ];
            
            return {
                success: true,
                data: mockLogs.slice(0, limit)
            };
        } else if (method === 'POST' && action === 'add') {
            return {
                success: true,
                data: {
                    id: 'log_' + Date.now(),
                    timestamp: Math.floor(Date.now() / 1000),
                    datetime: new Date().toLocaleString('es-ES'),
                    type: body?.type || 'info',
                    message: body?.message || 'Log añadido',
                    source: body?.source || 'api',
                    read: false
                }
            };
        } else if (method === 'DELETE' && action === 'clear') {
            return {
                success: true,
                remaining: 0
            };
        }
    } else if (url === '/log/generate_uptime.php') {
        const uptimeSeconds = Math.floor(Date.now() / 1000) - 1704067200; // Desde 2024-01-01
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        
        return {
            success: true,
            uptime_formatted: `${days}d ${hours}h ${minutes}m`,
            days: days,
            hours: hours,
            minutes: minutes,
            timestamp: Math.floor(Date.now() / 1000),
            server_time: new Date().toISOString()
        };
    }
    
    return null;
}

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Simular exactamente https://umbot.com.ar/log/
    if (req.url === '/log/' || req.url === '/log') {
        res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Server': 'nginx/1.18.0',
            'X-Powered-By': 'UMBot Emergency Dashboard'
        });
        
        const dashboardPath = path.join(__dirname, 'index.html');
        const content = fs.readFileSync(dashboardPath, 'utf8');
        res.end(content);
        return;
    }
    
    // Manejar endpoints PHP simulados
    if (req.url.startsWith('/log/') && req.url.includes('.php')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            let parsedBody = {};
            if (body && req.headers['content-type']?.includes('application/json')) {
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    // Ignorar errores de parsing
                }
            }
            
            const response = handlePHPRequest(req.url, req.method, parsedBody);
            
            if (response) {
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                res.end(JSON.stringify(response));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
        });
        return;
    }
    
    // Servir archivos estáticos
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
    }
    
    // Servir el archivo
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    const content = fs.readFileSync(filePath);
    res.end(content);
});

server.listen(PORT, () => {
    console.log(`🚀 UMBot Emergency Dashboard iniciado`);
    console.log(`📊 URL: http://localhost:${PORT}/log/`);
    console.log(`🌐 Simula: https://umbot.com.ar/log/`);
    console.log(`⏰ ${new Date().toISOString()}`);
});

server.on('error', (err) => {
    console.error('Error del servidor:', err);
}); 