const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 8092;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de servicios con nombres reales
const SERVICES = {
    'umbot-directus': { 
        displayName: 'Directus',
        port: 8055,
        healthCheck: 'curl -f http://localhost:8055/server/health || exit 1'
    },
    'umbot-nginx-static': { 
        displayName: 'Nginx',
        port: 80,
        healthCheck: 'curl -f http://localhost/ || exit 1'
    },
    'umbot-postgres': { 
        displayName: 'PostgreSQL',
        port: 5432,
        healthCheck: null
    },
    'umbot-grafana': { 
        displayName: 'Grafana',
        port: 3000,
        healthCheck: 'curl -f http://localhost:3000/api/health || exit 1'
    },
    'umbot-prometheus': { 
        displayName: 'Prometheus',
        port: 9090,
        healthCheck: 'curl -f http://localhost:9090/-/healthy || exit 1'
    }
};

// Estado global para métricas
let systemMetrics = {
    totalChecks: 0,
    totalErrors: 0,
    totalRestarts: 0,
    lastCheck: new Date(),
    serviceStatus: {},
    responseTime: []
};

// Verificar estado del servidor
app.get('/api/status', (req, res) => {
    exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }
        res.json({ 
            status: 'healthy',
            containers: stdout,
            metrics: systemMetrics
        });
    });
});

// Obtener lista de todos los servicios con su estado
app.get('/api/services', async (req, res) => {
    const startTime = Date.now();
    systemMetrics.totalChecks++;
    
    exec('docker ps -a --format "{{.Names}}|{{.Status}}|{{.State}}"', (error, stdout, stderr) => {
        if (error) {
            systemMetrics.totalErrors++;
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }

        const services = [];
        const lines = stdout.trim().split('\n');
        
        lines.forEach(line => {
            const [name, status, state] = line.split('|');
            if (SERVICES[name]) {
                services.push({
                    name: name,
                    displayName: SERVICES[name].displayName,
                    port: SERVICES[name].port,
                    status: state.toLowerCase() === 'running' ? 'healthy' : 'unhealthy',
                    uptime: status,
                    state: state
                });
                systemMetrics.serviceStatus[name] = state;
            }
        });

        const responseTime = Date.now() - startTime;
        systemMetrics.responseTime.push(responseTime);
        if (systemMetrics.responseTime.length > 100) {
            systemMetrics.responseTime.shift();
        }
        systemMetrics.lastCheck = new Date();

        res.json({ 
            status: 'success', 
            services: services,
            metrics: {
                totalChecks: systemMetrics.totalChecks,
                totalErrors: systemMetrics.totalErrors,
                totalRestarts: systemMetrics.totalRestarts,
                avgResponseTime: Math.round(systemMetrics.responseTime.reduce((a, b) => a + b, 0) / systemMetrics.responseTime.length)
            }
        });
    });
});

// Verificar estado de un servicio específico
app.get('/api/check/:service', (req, res) => {
    const service = req.params.service;
    
    if (!SERVICES[service]) {
        res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
        return;
    }

    exec(`docker inspect ${service} --format '{{.State.Status}}|{{.State.StartedAt}}'`, (error, stdout, stderr) => {
        if (error) {
            res.json({ status: 'unhealthy', message: 'Contenedor no encontrado' });
            return;
        }

        const [status, startedAt] = stdout.trim().split('|');
        const isHealthy = status === 'running';
        
        res.json({ 
            status: isHealthy ? 'healthy' : 'unhealthy',
            containerStatus: status,
            startedAt: startedAt,
            port: SERVICES[service].port
        });
    });
});

// Reiniciar un servicio
app.post('/api/restart/:service', (req, res) => {
    const service = req.params.service;
    
    if (service === 'all') {
        systemMetrics.totalRestarts++;
        exec('docker restart umbot-directus umbot-nginx-static umbot-postgres umbot-grafana umbot-prometheus', (error, stdout, stderr) => {
            if (error) {
                res.status(500).json({ status: 'error', message: error.message });
                return;
            }
            res.json({ status: 'success', message: 'Todos los servicios reiniciados', output: stdout });
        });
        return;
    }
    
    if (!SERVICES[service]) {
        res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
        return;
    }

    systemMetrics.totalRestarts++;
    exec(`docker restart ${service}`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }
        res.json({ status: 'success', message: `Servicio ${service} reiniciado`, output: stdout });
    });
});

// Ejecutar comando
app.post('/api/execute', (req, res) => {
    const { command } = req.body;
    
    // Lista ampliada de comandos permitidos
    const allowedCommands = [
        'docker ps',
        'docker ps -a',
        'docker stats --no-stream',
        'df -h',
        'free -h',
        'uptime',
        'netstat -tlpn',
        'docker system prune -f',
        'docker volume prune -f',
        'docker image prune -f',
        'docker-compose restart',
        'docker-compose up -d',
        'docker logs --tail 50 umbot-directus',
        'docker logs --tail 50 umbot-nginx-static',
        'docker logs --tail 50 umbot-postgres',
        'docker logs --tail 50 umbot-grafana',
        'docker logs --tail 50 umbot-prometheus',
        'systemctl status docker',
        'docker version',
        'docker info',
        'docker network ls',
        'docker volume ls',
        'ps aux | grep docker',
        'ls -la /var/lib/docker/containers',
        'journalctl -u docker --no-pager -n 50'
    ];
    
    // Permitir comandos que empiecen con estos prefijos
    const allowedPrefixes = ['docker logs', 'docker inspect', 'docker exec'];
    const isAllowed = allowedCommands.includes(command) || 
                     allowedPrefixes.some(prefix => command.startsWith(prefix));
    
    if (!isAllowed) {
        res.status(403).json({ status: 'error', message: 'Comando no permitido' });
        return;
    }

    // Usar docker restart para servicios específicos si es docker-compose restart
    const finalCommand = command === 'docker-compose restart' 
        ? 'docker restart umbot-directus umbot-nginx-static umbot-postgres umbot-grafana umbot-prometheus'
        : command;

    exec(finalCommand, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ 
                status: 'error', 
                message: error.message,
                stderr: stderr 
            });
            return;
        }
        res.json({ 
            status: 'success', 
            output: stdout,
            stderr: stderr 
        });
    });
});

// Obtener métricas del sistema
app.get('/api/metrics', (req, res) => {
    exec('df -h | grep "^/dev" && echo "---" && free -h && echo "---" && uptime', (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }

        const parts = stdout.split('---');
        const disk = parts[0] || '';
        const memory = parts[1] || '';
        const uptime = parts[2] || '';

        res.json({
            status: 'success',
            disk: disk.trim(),
            memory: memory.trim(),
            uptime: uptime.trim(),
            systemMetrics: systemMetrics
        });
    });
});

// Obtener logs de un servicio
app.get('/api/logs/:service', (req, res) => {
    const service = req.params.service;
    const lines = req.query.lines || 50;
    
    if (!SERVICES[service]) {
        res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
        return;
    }

    exec(`docker logs --tail ${lines} ${service}`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ status: 'error', message: error.message });
            return;
        }
        res.json({ 
            status: 'success', 
            logs: stdout || stderr,
            service: service,
            lines: lines
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor API de UMBot Emergency Enhanced corriendo en puerto ${port}`);
    console.log(`Métricas inicializadas:`, systemMetrics);
}); 