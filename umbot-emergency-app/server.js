const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 8092;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de servicios
const SERVICES = {
    'umbot-directus': { port: 8055 },
    'umbot-nginx-static': { port: 80 },
    'umbot-postgres': { port: 5432 },
    'umbot-grafana': { port: 3000 },
    'umbot-prometheus': { port: 9090 }
};

// Verificar estado del servidor
app.get('/api/status', (req, res) => {
    exec('docker ps', (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }
        res.json({ status: 'healthy' });
    });
});

// Verificar estado de un servicio
app.get('/api/check/:service', (req, res) => {
    const service = req.params.service;
    
    if (!SERVICES[service]) {
        res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
        return;
    }

    exec(`docker inspect ${service}`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }

        try {
            const inspect = JSON.parse(stdout);
            const state = inspect[0].State;
            
            if (state.Running && !state.Restarting) {
                res.json({ status: 'healthy' });
            } else {
                res.json({ status: 'unhealthy', message: state.Status });
            }
        } catch (e) {
            res.status(500).json({ status: 'error', message: 'Error al parsear respuesta' });
        }
    });
});

// Reiniciar un servicio
app.post('/api/restart/:service', (req, res) => {
    const service = req.params.service;
    
    if (service === 'all') {
        exec('docker-compose restart', (error, stdout, stderr) => {
            if (error) {
                res.status(500).json({ status: 'error', message: error.message });
                return;
            }
            res.json({ status: 'success', message: 'Todos los servicios reiniciados' });
        });
        return;
    }
    
    if (!SERVICES[service]) {
        res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
        return;
    }

    exec(`docker restart ${service}`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }
        res.json({ status: 'success', message: `Servicio ${service} reiniciado` });
    });
});

// Ejecutar comando
app.post('/api/execute', (req, res) => {
    const { command } = req.body;
    
    // Lista de comandos permitidos
    const allowedCommands = [
        'docker ps',
        'docker stats --no-stream',
        'df -h',
        'free -h',
        'uptime',
        'netstat -tlpn',
        'docker system prune -f',
        'docker volume prune -f',
        'docker image prune -f',
        'docker-compose restart',
        'docker-compose up -d'
    ];
    
    if (!allowedCommands.includes(command)) {
        res.status(403).json({ status: 'error', message: 'Comando no permitido' });
        return;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }
        res.json({ status: 'success', output: stdout });
    });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor API de UMBot Emergency corriendo en puerto ${port}`);
}); 