#!/bin/bash

# Este script crea un servidor Node.js simple para servir archivos estáticos

echo "Creando un servidor Node.js simple..."
ssh root@23.105.176.45 "cd /root/um25 && cat > dist/simple-server.js << 'EOL'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4321;
const CLIENT_DIR = path.join(__dirname, 'client');

// Map file extensions to content types
const contentTypeMap = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Parse URL
  let url = req.url;
  
  // Handle root path
  if (url === '/') {
    url = '/index.html';
  }
  
  // Handle paths without file extension (SPA routes)
  if (!path.extname(url)) {
    url = '/index.html';
  }
  
  // Build file path
  const filePath = path.join(CLIENT_DIR, url);
  
  // Get file extension
  const ext = path.extname(filePath).toLowerCase();
  
  // Get content type
  const contentType = contentTypeMap[ext] || 'application/octet-stream';
  
  // Read file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, try index.html
        fs.readFile(path.join(CLIENT_DIR, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${CLIENT_DIR}`);
});
EOL"

echo "Actualizando el docker-compose para usar el nuevo servidor..."
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's|command: node ./dist/server/entry.mjs|command: node ./dist/simple-server.js|g' docker-compose.server.yml"

echo "Reiniciando el contenedor de Astro..."
ssh root@23.105.176.45 "cd /root/um25 && docker restart astro-app"

echo "Verificando el estado del contenedor después de 5 segundos..."
ssh root@23.105.176.45 "sleep 5 && cd /root/um25 && docker ps"

echo "Verificando los logs del contenedor..."
ssh root@23.105.176.45 "cd /root/um25 && docker logs astro-app"

echo "Operación completada. Espere unos minutos y luego verifique http://23.105.176.45:8080/antecedentes"
