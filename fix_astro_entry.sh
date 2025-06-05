#!/bin/bash

# Este script corrige el error de sintaxis en el archivo entry.mjs del servidor Astro

echo "Corrigiendo el error de sintaxis en el archivo entry.mjs..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i astro-app sh -c 'cat > /app/dist/server/entry.mjs << EOL
import { createServer } from \"node:http\";
import { handler as ssrHandler } from \"./entry.mjs\";
import fs from \"node:fs\";
import path from \"node:path\";
import { fileURLToPath } from \"node:url\";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, \"../client\");

const PORT = process.env.PORT || 4321;

const staticFileExtensions = new Set([
  \".css\",
  \".jpg\", \".jpeg\", \".png\", \".gif\", \".svg\", \".ico\", \".webp\", \".avif\",
  \".woff\", \".woff2\", \".ttf\", \".eot\",
  \".js\", \".mjs\"
]);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const pathname = decodeURI(url.pathname);
  
  // Check if the request is for a static file
  const ext = path.extname(pathname);
  if (staticFileExtensions.has(ext)) {
    try {
      const filePath = path.join(clientRoot, pathname);
      const fileContent = fs.readFileSync(filePath);
      
      // Set appropriate content type
      let contentType = \"application/octet-stream\";
      if (ext === \".html\") contentType = \"text/html\";
      else if (ext === \".css\") contentType = \"text/css\";
      else if (ext === \".js\" || ext === \".mjs\") contentType = \"application/javascript\";
      else if (ext === \".jpg\" || ext === \".jpeg\") contentType = \"image/jpeg\";
      else if (ext === \".png\") contentType = \"image/png\";
      else if (ext === \".gif\") contentType = \"image/gif\";
      else if (ext === \".svg\") contentType = \"image/svg+xml\";
      
      res.writeHead(200, { \"Content-Type\": contentType });
      res.end(fileContent);
      return;
    } catch (e) {
      // Fall through to SSR if file not found
      console.error(\`Static file not found: \${pathname}\`);
    }
  }
  
  // Handle SSR for everything else
  try {
    await ssrHandler(req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end(\"Internal Server Error\");
  }
});

server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});
EOL'"

echo "Creando un archivo server.js alternativo..."
ssh root@23.105.176.45 "cd /root/um25 && cat > dist/server.js << EOL
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const clientDir = join(__dirname, 'client');

const PORT = process.env.PORT || 4321;

// Map file extensions to content types
const contentTypeMap = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Directus configuration
const directusUrl = process.env.PUBLIC_DIRECTUS_URL || 'http://23.105.176.45:8055';
const directusToken = process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

// Simple server to serve static files
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, \`http://\${req.headers.host}\`);
    let pathname = decodeURI(url.pathname);
    
    // Handle root path
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    // Handle routes without extensions (assume they need index.html)
    if (!extname(pathname)) {
      // Check if a directory with that name exists
      const dirPath = join(clientDir, pathname);
      if (existsSync(dirPath)) {
        pathname = \`\${pathname}/index.html\`.replace(/\\/\\/+/g, '/');
      } else {
        // For client-side routing, serve the main index.html
        pathname = '/index.html';
      }
    }
    
    // Construct the file path
    const filePath = join(clientDir, pathname);
    
    try {
      // Try to read the file
      const data = readFileSync(filePath);
      const ext = extname(pathname).toLowerCase();
      const contentType = contentTypeMap[ext] || 'application/octet-stream';
      
      // Set headers and send response
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        // If file not found, check if it's a route that needs index.html
        if (!extname(pathname)) {
          const indexPath = join(clientDir, 'index.html');
          if (existsSync(indexPath)) {
            const data = readFileSync(indexPath);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
            return;
          }
        }
        
        // File not found
        res.writeHead(404);
        res.end('Not Found');
      } else {
        // Server error
        console.error(err);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
  console.log(\`Directus URL: \${directusUrl}\`);
  console.log(\`Using token: \${directusToken ? 'Yes' : 'No'}\`);
});
EOL"

echo "Actualizando el docker-compose para usar el nuevo archivo server.js..."
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's|command: node ./dist/server/entry.mjs|command: node ./dist/server.js|g' docker-compose.server.yml"

echo "Reiniciando el contenedor de Astro..."
ssh root@23.105.176.45 "cd /root/um25 && docker restart astro-app"

echo "Verificando el estado del contenedor..."
ssh root@23.105.176.45 "cd /root/um25 && docker ps"

echo "Operación completada. Espere unos minutos y luego verifique http://23.105.176.45:8080/antecedentes"
