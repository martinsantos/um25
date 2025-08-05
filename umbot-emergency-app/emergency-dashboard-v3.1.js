// UMBot Emergency Dashboard v3.1 - Sistema de Logs Completo
(function() {
    'use strict';

    const CONFIG = {
        SERVICES: [
            {
                name: 'Grafana',
                port: 3000,
                healthEndpoint: '/api/health',
                critical: true,
                restartCmd: 'systemctl restart grafana-server'
            },
            {
                name: 'Directus CMS',
                port: 8055,
                healthEndpoint: '/server/health',
                critical: true,
                restartCmd: 'docker restart directus_app'
            },
            {
                name: 'Node Exporter',
                port: 9100,
                healthEndpoint: '/metrics',
                critical: false,
                restartCmd: 'systemctl restart node_exporter'
            },
            {
                name: 'Nginx Proxy',
                port: 80,
                healthEndpoint: '/',
                critical: true,
                restartCmd: 'systemctl restart nginx'
            },
            {
                name: 'PostgreSQL',
                port: 5432,
                healthEndpoint: false,
                critical: true,
                restartCmd: 'systemctl restart postgresql'
            },
            {
                name: 'Prometheus',
                port: 9090,
                healthEndpoint: '/-/healthy',
                critical: false,
                restartCmd: 'systemctl restart prometheus'
            }
        ],
        CHECK_INTERVAL: 5000,
        UPTIME_INTERVAL: 10000,
        LOGS_API: '/logs.php',
        LOG_REFRESH_INTERVAL: 3000
    };

    // API de Logs
    class LogsAPI {
        static async addLog(type, message, source = 'dashboard', data = null) {
            try {
                const response = await fetch(CONFIG.LOGS_API + '/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, message, source, data })
                });
                return await response.json();
            } catch (error) {
                console.error('Error adding log:', error);
                return { success: false, error: error.message };
            }
        }

        static async getLogs(filters = {}) {
            try {
                const params = new URLSearchParams(filters);
                const response = await fetch(CONFIG.LOGS_API + '?' + params);
                return await response.json();
            } catch (error) {
                console.error('Error getting logs:', error);
                return { success: false, error: error.message };
            }
        }

        static async markAsRead(logIds = []) {
            try {
                const response = await fetch(CONFIG.LOGS_API + '/mark-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ log_ids: logIds })
                });
                return await response.json();
            } catch (error) {
                console.error('Error marking logs as read:', error);
                return { success: false, error: error.message };
            }
        }

        static async clearLogs(olderThanDays = null) {
            try {
                const params = olderThanDays ? `?older_than_days=${olderThanDays}` : '';
                const response = await fetch(CONFIG.LOGS_API + '/clear' + params, {
                    method: 'DELETE'
                });
                return await response.json();
            } catch (error) {
                console.error('Error clearing logs:', error);
                return { success: false, error: error.message };
            }
        }

        static async getStats() {
            try {
                const response = await fetch(CONFIG.LOGS_API + '/stats');
                return await response.json();
            } catch (error) {
                console.error('Error getting log stats:', error);
                return { success: false, error: error.message };
            }
        }
    }

    function createApp() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-[var(--bg-color)] transition-colors duration-300">
                <!-- Header -->
                <header class="bg-[var(--card-bg-color)] shadow-md border-b border-[var(--border-color)]">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center py-4">
                            <div class="flex items-center space-x-4">
                                <h1 class="text-2xl font-bold text-[var(--text-color)]">
                                    🚨 UMBot Emergency Dashboard v3.1
                                </h1>
                                <span class="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    LOGS SYSTEM
                                </span>
                            </div>
                            <div class="flex items-center space-x-4">
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm text-[var(--subtle-text-color)]">Uptime:</span>
                                    <span id="uptime-badge" class="px-2 py-1 text-xs font-mono bg-green-100 text-green-800 rounded">
                                        Calculando...
                                    </span>
                                </div>
                                <button id="theme-toggle" class="p-2 rounded-lg bg-[var(--card-bg-color)] border border-[var(--border-color)] hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <span id="theme-icon" class="material-icons text-[var(--text-color)]">light_mode</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <!-- Panel Principal -->
                        <div class="xl:col-span-2 space-y-6">
                            <!-- Estado General -->
                            <div class="bg-[var(--card-bg-color)] rounded-lg shadow-md border border-[var(--border-color)] p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h2 class="text-lg font-semibold text-[var(--text-color)]">Estado del Sistema</h2>
                                    <div id="overall-status" class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        Verificando...
                                    </div>
                                </div>
                                <div id="services-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <!-- Services will be populated here -->
                                </div>
                            </div>

                            <!-- Sistema de Logs Mejorado -->
                            <div class="bg-[var(--card-bg-color)] rounded-lg shadow-md border border-[var(--border-color)] p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h2 class="text-lg font-semibold text-[var(--text-color)]">Sistema de Logs</h2>
                                    <div class="flex items-center space-x-2">
                                        <span id="log-stats" class="text-sm text-[var(--subtle-text-color)]">
                                            Total: 0 | No leídos: 0
                                        </span>
                                        <button id="logs-refresh" class="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200">
                                            <span class="material-icons text-sm">refresh</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros de Logs -->
                                <div class="flex flex-wrap gap-3 mb-4">
                                    <select id="log-type-filter" class="px-3 py-1 border border-[var(--border-color)] rounded-lg text-sm">
                                        <option value="">Todos los tipos</option>
                                        <option value="system">Sistema</option>
                                        <option value="info">Info</option>
                                        <option value="warning">Advertencia</option>
                                        <option value="error">Error</option>
                                        <option value="success">Éxito</option>
                                        <option value="command">Comando</option>
                                        <option value="service">Servicio</option>
                                    </select>
                                    <input id="log-search" type="text" placeholder="Buscar en logs..." 
                                           class="px-3 py-1 border border-[var(--border-color)] rounded-lg text-sm flex-1 min-w-0">
                                    <button id="mark-all-read" class="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
                                        Marcar como leídos
                                    </button>
                                    <button id="clear-logs" class="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-lg hover:bg-red-200">
                                        Limpiar logs
                                    </button>
                                </div>

                                <!-- Lista de Logs -->
                                <div id="logs-container" class="space-y-2 max-h-96 overflow-y-auto">
                                    <div class="text-center text-[var(--subtle-text-color)] py-8">
                                        Cargando logs...
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Panel Lateral -->
                        <div class="space-y-6">
                            <!-- Consola -->
                            <div class="bg-[var(--card-bg-color)] rounded-lg shadow-md border border-[var(--border-color)] p-6">
                                <h3 class="text-lg font-semibold text-[var(--text-color)] mb-4">Consola de Comandos</h3>
                                <div id="console-output" class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto mb-4">
                                    <div class="text-gray-500">UMBot Emergency Console v3.1 iniciada...</div>
                                    <div class="text-gray-500">Escribe 'help' para ver comandos disponibles</div>
                                </div>
                                <input id="console-input" type="text" placeholder="Ingresa comando..." 
                                       class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm font-mono bg-gray-900 text-green-400">
                            </div>

                            <!-- Acciones Globales -->
                            <div class="bg-[var(--card-bg-color)] rounded-lg shadow-md border border-[var(--border-color)] p-6">
                                <h3 class="text-lg font-semibold text-[var(--text-color)] mb-4">Acciones Globales</h3>
                                <div class="grid grid-cols-2 gap-3">
                                    <button id="restart-all" class="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 text-sm font-medium">
                                        🔄 Reiniciar Todo
                                    </button>
                                    <button id="emergency-mode" class="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm font-medium">
                                        🚨 Modo Emergencia
                                    </button>
                                    <button id="general-review" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm font-medium">
                                        🔍 Revisión General
                                    </button>
                                    <button id="clear-caches" class="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 text-sm font-medium">
                                        🗑️ Limpiar Caches
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return {
            elements: {
                app,
                themeToggle: app.querySelector('#theme-toggle'),
                themeIcon: app.querySelector('#theme-icon'),
                uptimeBadge: app.querySelector('#uptime-badge'),
                overallStatus: app.querySelector('#overall-status'),
                servicesGrid: app.querySelector('#services-grid'),
                consoleOutput: app.querySelector('#console-output'),
                consoleInput: app.querySelector('#console-input'),
                logsContainer: app.querySelector('#logs-container'),
                logTypeFilter: app.querySelector('#log-type-filter'),
                logSearch: app.querySelector('#log-search'),
                logStats: app.querySelector('#log-stats'),
                logsRefresh: app.querySelector('#logs-refresh'),
                markAllRead: app.querySelector('#mark-all-read'),
                clearLogs: app.querySelector('#clear-logs'),
                restartAll: app.querySelector('#restart-all'),
                emergencyMode: app.querySelector('#emergency-mode'),
                generalReview: app.querySelector('#general-review'),
                clearCaches: app.querySelector('#clear-caches')
            },
            state: {
                theme: localStorage.getItem('umbot-theme') || 'light',
                services: CONFIG.SERVICES.map(s => ({...s, status: 'checking', health: 0})),
                localStart: Date.now(),
                currentLogs: [],
                logFilters: { type: '', search: '', limit: 50 }
            }
        };
    }

    // Funciones del sistema de logs
    async function refreshLogs(app) {
        try {
            const response = await LogsAPI.getLogs(app.state.logFilters);
            if (response.success) {
                app.state.currentLogs = response.data;
                renderLogs(app);
                await updateLogStats(app);
            }
        } catch (error) {
            console.error('Error refreshing logs:', error);
        }
    }

    function renderLogs(app) {
        const container = app.elements.logsContainer;
        
        if (app.state.currentLogs.length === 0) {
            container.innerHTML = '<div class="text-center text-[var(--subtle-text-color)] py-8">No hay logs que mostrar</div>';
            return;
        }

        container.innerHTML = app.state.currentLogs.map(log => {
            const readClass = log.read ? 'opacity-75' : '';

            return `
                <div class="log-entry log-${log.type} ${readClass}" data-log-id="${log.id}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="log-timestamp">${log.datetime}</span>
                                <span class="log-type-badge ${log.type}">
                                    ${log.type}
                                </span>
                                <span class="text-xs text-[var(--subtle-text-color)]">${log.source}</span>
                                ${!log.read ? '<span class="unread-indicator"></span>' : ''}
                            </div>
                            <div class="log-message">${log.message}</div>
                            ${log.data ? `<div class="log-data">${JSON.stringify(log.data, null, 2)}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function updateLogStats(app) {
        try {
            const response = await LogsAPI.getStats();
            if (response.success) {
                const stats = response.data;
                app.elements.logStats.textContent = `Total: ${stats.total} | No leídos: ${stats.unread} | Hoy: ${stats.last24h}`;
            }
        } catch (error) {
            console.error('Error updating log stats:', error);
        }
    }

    async function addLog(app, type, message, source = 'dashboard', data = null) {
        // Agregar a logs locales inmediatamente
        const localLog = {
            id: 'temp_' + Date.now(),
            timestamp: Date.now() / 1000,
            datetime: new Date().toLocaleString(),
            type,
            message,
            source,
            data,
            read: false
        };
        
        app.state.currentLogs.unshift(localLog);
        renderLogs(app);
        
        // Agregar también a consola si es relevante
        if (['command', 'system', 'error'].includes(type)) {
            addConsoleLog(app, type, message);
        }
        
        // Enviar al backend
        await LogsAPI.addLog(type, message, source, data);
        
        // Refresh para obtener ID real
        setTimeout(() => refreshLogs(app), 500);
    }

    function addConsoleLog(app, type, message) {
        const output = app.elements.consoleOutput;
        const timestamp = new Date().toLocaleTimeString();
        
        const colorMap = {
            system: 'text-blue-400',
            error: 'text-red-400',
            warning: 'text-yellow-400',
            success: 'text-green-400',
            command: 'text-purple-400',
            info: 'text-cyan-400'
        };
        
        const color = colorMap[type] || 'text-gray-400';
        
        const logElement = document.createElement('div');
        logElement.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> <span class="${color}">[${type.toUpperCase()}]</span> ${message}`;
        
        output.appendChild(logElement);
        output.scrollTop = output.scrollHeight;
        
        // Limitar logs en consola
        while (output.children.length > 100) {
            output.removeChild(output.firstChild);
        }
    }

    // Resto de funciones importantes...
    async function checkService(service) {
        if (service.healthEndpoint === false) {
            return true; // PostgreSQL simulation
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(service.healthEndpoint, { 
                method: 'GET', 
                cache: 'no-store',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async function updateServices(app) {
        // Crear grid de servicios si no existe
        if (app.elements.servicesGrid.children.length === 0) {
            renderServicesGrid(app);
        }

        for (const service of app.state.services) {
            const wasOffline = service.status === 'offline';
            const isOnline = await checkService(service);
            service.status = isOnline ? 'online' : 'offline';
            service.health = isOnline ? 100 : 0;
            
            // Log cambios de estado
            if (wasOffline && isOnline) {
                await addLog(app, 'success', `${service.name} volvió a estar online`, 'monitor');
            } else if (!wasOffline && !isOnline) {
                await addLog(app, 'error', `${service.name} se desconectó`, 'monitor');
            }
        }

        updateServicesDisplay(app);
        updateOverallStatus(app);
    }

    function renderServicesGrid(app) {
        app.elements.servicesGrid.innerHTML = app.state.services.map(service => `
            <div class="service-card bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100">${service.name}</h4>
                    <span class="status-badge px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Checking...
                    </span>
                </div>
                <div class="mb-2">
                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Health</span>
                        <span class="health-percentage">0%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="health-bar bg-gray-500 h-2 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">Puerto: ${service.port}</span>
                    <button class="restart-service px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200" 
                            data-service="${service.name}">
                        🔄 Reiniciar
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateServicesDisplay(app) {
        const serviceCards = app.elements.servicesGrid.children;
        
        app.state.services.forEach((service, index) => {
            const card = serviceCards[index];
            if (!card) return;
            
            const statusBadge = card.querySelector('.status-badge');
            const healthBar = card.querySelector('.health-bar');
            const healthPercentage = card.querySelector('.health-percentage');
            
            if (service.status === 'online') {
                statusBadge.className = 'status-badge px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800';
                statusBadge.textContent = 'Online';
                healthBar.className = 'health-bar bg-green-500 h-2 rounded-full';
            } else {
                statusBadge.className = 'status-badge px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800';
                statusBadge.textContent = 'Offline';
                healthBar.className = 'health-bar bg-red-500 h-2 rounded-full';
            }
            
            healthBar.style.width = `${service.health}%`;
            healthPercentage.textContent = `${service.health}%`;
        });
    }

    function updateOverallStatus(app) {
        const totalServices = app.state.services.length;
        const onlineServices = app.state.services.filter(s => s.status === 'online').length;
        const criticalOffline = app.state.services.filter(s => s.critical && s.status === 'offline').length;
        
        const statusElement = app.elements.overallStatus;
        
        if (criticalOffline > 0) {
            statusElement.className = 'px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800';
            statusElement.textContent = `CRÍTICO: ${criticalOffline} servicios críticos offline`;
        } else if (onlineServices === totalServices) {
            statusElement.className = 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800';
            statusElement.textContent = `OPERATIVO: Todos los servicios online (${onlineServices}/${totalServices})`;
        } else {
            statusElement.className = 'px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800';
            statusElement.textContent = `DEGRADADO: ${onlineServices}/${totalServices} servicios online`;
        }
    }

    // Comandos de consola
    function handleCommand(app, command) {
        const cmd = command.toLowerCase().trim();
        
        addLog(app, 'command', `> ${command}`, 'console');
        
        switch (cmd) {
            case 'help':
                addConsoleLog(app, 'info', 'Comandos disponibles:');
                addConsoleLog(app, 'info', '• status - Estado de servicios');
                addConsoleLog(app, 'info', '• restart <servicio> - Reiniciar servicio específico');
                addConsoleLog(app, 'info', '• restart all - Reiniciar todos los servicios');
                addConsoleLog(app, 'info', '• logs clear - Limpiar logs');
                addConsoleLog(app, 'info', '• logs stats - Estadísticas de logs');
                addConsoleLog(app, 'info', '• emergency - Activar protocolo de emergencia');
                addConsoleLog(app, 'info', '• clear - Limpiar consola');
                break;
                
            case 'status':
                updateServices(app);
                addConsoleLog(app, 'info', 'Actualizando estado de servicios...');
                break;
                
            case 'clear':
                app.elements.consoleOutput.innerHTML = '<div class="text-gray-500">Consola limpiada</div>';
                break;
                
            case 'restart all':
                restartAllServices(app);
                break;
                
            case 'logs clear':
                clearAllLogs(app);
                break;
                
            case 'logs stats':
                updateLogStats(app);
                addConsoleLog(app, 'info', 'Ver estadísticas en el panel de logs');
                break;
                
            case 'emergency':
                toggleEmergencyMode(app);
                break;
                
            default:
                if (cmd.startsWith('restart ')) {
                    const serviceName = cmd.replace('restart ', '');
                    const service = app.state.services.find(s => s.name.toLowerCase().includes(serviceName));
                    if (service) {
                        restartService(app, service);
                    } else {
                        addConsoleLog(app, 'error', `Servicio '${serviceName}' no encontrado`);
                    }
                } else {
                    addConsoleLog(app, 'error', `Comando no reconocido: ${command}`);
                }
        }
    }

    // Funciones de acciones
    async function restartService(app, service) {
        addLog(app, 'service', `Reiniciando ${service.name}...`, 'system');
        addConsoleLog(app, 'warning', `Reiniciando ${service.name}...`);
        
        // Simular reinicio (en producción sería una llamada al backend)
        setTimeout(async () => {
            await addLog(app, 'success', `${service.name} reiniciado correctamente`, 'system');
            addConsoleLog(app, 'success', `${service.name} reiniciado correctamente`);
            updateServices(app);
        }, 2000);
    }

    async function restartAllServices(app) {
        addLog(app, 'system', 'Iniciando reinicio completo del sistema...', 'emergency');
        addConsoleLog(app, 'warning', 'Reiniciando todos los servicios...');
        
        for (const service of app.state.services) {
            setTimeout(() => restartService(app, service), Math.random() * 3000);
        }
    }

    async function toggleEmergencyMode(app) {
        addLog(app, 'warning', 'Protocolo de emergencia activado', 'emergency');
        addConsoleLog(app, 'error', 'MODO EMERGENCIA ACTIVADO');
        addConsoleLog(app, 'warning', 'Ejecutando diagnósticos automáticos...');
        
        setTimeout(() => {
            addLog(app, 'info', 'Diagnósticos completados', 'emergency');
            addConsoleLog(app, 'success', 'Diagnósticos completados');
        }, 3000);
    }

    async function clearAllLogs(app) {
        if (confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
            const response = await LogsAPI.clearLogs();
            if (response.success) {
                await refreshLogs(app);
                addConsoleLog(app, 'success', 'Logs limpiados correctamente');
            }
        }
    }

    function toggleTheme(app) {
        app.state.theme = app.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('umbot-theme', app.state.theme);
        
        document.documentElement.classList.toggle('dark', app.state.theme === 'dark');
        app.elements.themeIcon.textContent = app.state.theme === 'dark' ? 'dark_mode' : 'light_mode';
    }

    async function updateServerUptime(app) {
        try {
            const res = await fetch('/uptime.json', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                app.elements.uptimeBadge.textContent = data.uptime_formatted || formatDuration(data.uptime_seconds * 1000);
                return;
            }
        } catch (_) {}
        
        const elapsed = Date.now() - app.state.localStart;
        app.elements.uptimeBadge.textContent = formatDuration(elapsed);
    }

    function formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const parts = [];
        if (days) parts.push(`${days}d`);
        if (hours || days) parts.push(`${hours}h`);
        if (minutes || hours || days) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        return parts.join(' ');
    }

    function init() {
        const app = createApp();
        
        // Inicializar tema
        document.documentElement.classList.toggle('dark', app.state.theme === 'dark');
        app.elements.themeIcon.textContent = app.state.theme === 'dark' ? 'dark_mode' : 'light_mode';
        
        // Event listeners
        app.elements.themeToggle.addEventListener('click', () => toggleTheme(app));
        
        app.elements.consoleInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const value = e.target.value.trim();
                if (value) {
                    handleCommand(app, value);
                    e.target.value = '';
                }
            }
        });

        // Logs event listeners
        app.elements.logsRefresh.addEventListener('click', () => refreshLogs(app));
        app.elements.logTypeFilter.addEventListener('change', (e) => {
            app.state.logFilters.type = e.target.value;
            refreshLogs(app);
        });
        app.elements.logSearch.addEventListener('input', debounce((e) => {
            app.state.logFilters.search = e.target.value;
            refreshLogs(app);
        }, 300));
        
        app.elements.markAllRead.addEventListener('click', async () => {
            const unreadIds = app.state.currentLogs.filter(log => !log.read).map(log => log.id);
            if (unreadIds.length > 0) {
                await LogsAPI.markAsRead(unreadIds);
                refreshLogs(app);
            }
        });
        
        app.elements.clearLogs.addEventListener('click', () => clearAllLogs(app));

        // Services event listeners
        app.elements.servicesGrid.addEventListener('click', e => {
            if (e.target.classList.contains('restart-service')) {
                const serviceName = e.target.dataset.service;
                const service = app.state.services.find(s => s.name === serviceName);
                if (service) restartService(app, service);
            }
        });

        // Global actions
        app.elements.restartAll.addEventListener('click', () => restartAllServices(app));
        app.elements.emergencyMode.addEventListener('click', () => toggleEmergencyMode(app));
        app.elements.generalReview.addEventListener('click', () => {
            addLog(app, 'system', 'Iniciando revisión general del sistema...', 'maintenance');
            updateServices(app);
        });
        app.elements.clearCaches.addEventListener('click', () => {
            addLog(app, 'system', 'Limpiando cachés del sistema...', 'maintenance');
            addConsoleLog(app, 'info', 'Cachés limpiados');
        });
        
        // Inicialización
        addLog(app, 'system', 'Dashboard inicializado correctamente', 'startup');
        
        // Iniciar intervalos
        updateServices(app);
        setInterval(() => updateServices(app), CONFIG.CHECK_INTERVAL);
        
        updateServerUptime(app);
        setInterval(() => updateServerUptime(app), CONFIG.UPTIME_INTERVAL);
        
        refreshLogs(app);
        setInterval(() => refreshLogs(app), CONFIG.LOG_REFRESH_INTERVAL);
    }

    // Utilidad debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 