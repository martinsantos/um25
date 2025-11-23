const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8094;

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Redirigir /log/ al dashboard
    if (req.url === '/log/' || req.url === '/log') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const dashboardPath = path.join(__dirname, 'index.html');
        const content = fs.readFileSync(dashboardPath, 'utf8');
        res.end(content);
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
        '.ico': 'image/x-icon'
    }[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    const content = fs.readFileSync(filePath);
    res.end(content);
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor proxy iniciado en puerto ${PORT}`);
    console.log(`📊 Dashboard disponible en: http://localhost:${PORT}/log/`);
    console.log(`🌐 Simulando: https://umbot.com.ar/log/`);
});

server.on('error', (err) => {
    console.error('Error del servidor:', err);
}); 