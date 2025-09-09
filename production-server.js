import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4321;

// Servir archivos estáticos del cliente
app.use(express.static(join(__dirname, 'dist/client')));

// Servir todas las rutas con el index.html para SPA
app.get('*', (req, res) => {
    try {
        const indexPath = join(__dirname, 'dist/client/index.html');
        const indexContent = readFileSync(indexPath, 'utf-8');
        res.send(indexContent);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en modo producción ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`📁 Sirviendo archivos desde: ${join(__dirname, 'dist/client')}`);
    console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
});
