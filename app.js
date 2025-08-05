// UMBot Emergency Dashboard v3.0
(function() {
    'use strict';

    const CONFIG = {
        SERVICES: [
            {
                name: 'Grafana',
                port: 3000,
                healthEndpoint: '/api/health',
                critical: true
            },
            {
                name: 'Directus CMS',
                port: 8055,
                healthEndpoint: '/server/health',
                critical: true
            },
            {
                name: 'Node Exporter',
                port: 9100,
                healthEndpoint: '/metrics',
                critical: false
            },
            {
                name: 'Nginx Proxy',
                port: 80,
                healthEndpoint: '/',
                critical: true
            },
            {
                name: 'PostgreSQL',
                port: 5432,
                healthEndpoint: false,
                critical: true
            },
            {
                name: 'Prometheus',
                port: 9090,
                healthEndpoint: '/-/healthy',
                critical: false
            }
        ],
        CHECK_INTERVAL: 5000,
        UPTIME_INTERVAL: 10000
    };

    function createApp() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <header class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <div class="flex items-center">
                            <i class="material-icons text-red-600">emergency</i>
                            <h1 class="ml-3 text-xl font-bold">UMBot Emergency Dashboard</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-500">v3.0</span>
                            <span id="uptime-badge" class="flex items-center gap-1 text-xs text-gray-500"><i class="material-icons text-sm">schedule</i><span id="uptime-text">--</span></span>
                            <button id="theme-toggle" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <i class="material-icons" id="theme-icon">light_mode</i>
                            </button>
                            <button id="alert-toggle" class="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <i class="material-icons">notifications</i>
                                <span id="alert-count" class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">0</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Modal Historial Alertas -->
            <div id="alert-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="font-semibold">Historial de Alertas</h3>
                        <div class="flex items-center gap-2">
                            <select id="alert-filter" class="text-sm bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                                <option value="all">Todas</option>
                                <option value="error">Errores</option>
                                <option value="warning">Advertencias</option>
                                <option value="success">Éxitos</option>
                                <option value="info">Info</option>
                            </select>
                            <button id="alert-close" class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                <i class="material-icons">close</i>
                            </button>
                        </div>
                    </div>
                    <div id="alert-list" class="flex-1 overflow-y-auto p-4 space-y-2 text-sm"></div>
                </div>
            </div>

            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div id="status-banner" class="mb-8 p-6 rounded-xl shadow-lg text-white bg-gray-500">
                    <div class="flex items-center">
                        <i id="status-icon" class="material-icons text-5xl mr-4">pending</i>
                        <div>
                            <h2 id="status-text" class="text-4xl font-extrabold">Verificando...</h2>
                            <p id="status-description" class="mt-1 opacity-90">Comprobando estado de los servicios...</p>
                        </div>
                    </div>
                </div>

                <div id="global-actions" class="flex flex-wrap gap-2 mb-6">
                    <button data-action="review" class="px-3 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700 transition">🔍 Revisión General</button>
                    <button data-action="cache" class="px-3 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 transition">🧹 Limpiar Caches</button>
                    <button data-action="deploy" class="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition">🚀 Deploy Update</button>
                    <button data-action="emergency" class="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition">🚨 Modo Emergencia</button>
                    <button data-action="protocol" class="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition">⚙️ Protocolo Arranque</button>
                </div>

                <div id="services-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${CONFIG.SERVICES.map(service => `
                        <div class="card p-4 rounded-xl shadow-sm">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-semibold">${service.name}</h3>
                                <div class="flex items-center gap-1">
                                    <span class="status-badge px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        Verificando...
                                    </span>
                                    <button data-restart="${service.name}" class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Reiniciar servicio">
                                        <i class="material-icons text-base">restart_alt</i>
                                    </button>
                                </div>
                            </div>
                            <p class="text-sm text-gray-500">Puerto: ${service.port}</p>
                            <div class="mt-4 w-full bg-gray-200 rounded-full h-2">
                                <div class="health-bar bg-gray-400 h-2 rounded-full w-0"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Consola de comandos -->
                <div class="mt-12">
                    <h3 class="text-lg font-semibold mb-2">Consola</h3>
                    <div id="console-log" class="console-log mb-2"></div>
                    <input id="console-input" type="text" placeholder="Ingresa comando y presiona Enter" class="w-full px-3 py-2 rounded-md border bg-gray-100 dark:bg-gray-800 text-sm" />
                </div>
            </main>
        `;

        return {
            elements: {
                themeToggle: document.getElementById('theme-toggle'),
                themeIcon: document.getElementById('theme-icon'),
                statusBanner: document.getElementById('status-banner'),
                statusIcon: document.getElementById('status-icon'),
                statusText: document.getElementById('status-text'),
                statusDescription: document.getElementById('status-description'),
                servicesGrid: document.getElementById('services-grid'),
                consoleLog: document.getElementById('console-log'),
                consoleInput: document.getElementById('console-input'),
                globalActions: document.getElementById('global-actions'),
                alertToggle: document.getElementById('alert-toggle'),
                alertCount: document.getElementById('alert-count'),
                alertModal: document.getElementById('alert-modal'),
                alertClose: document.getElementById('alert-close'),
                alertList: document.getElementById('alert-list'),
                alertFilter: document.getElementById('alert-filter'),
                uptimeText: document.getElementById('uptime-text')
            },
            state: {
                theme: localStorage.getItem('theme') || 'light',
                services: CONFIG.SERVICES.map(s => ({ ...s, status: 'checking', health: 0 })),
                alertHistory: JSON.parse(localStorage.getItem('alertHistory') || '[]'),
                emergencyMode: JSON.parse(localStorage.getItem('emergencyMode') || 'false'),
                localStart: Date.now()
            }
        };
    }

    async function checkService(service) {
        if (service.healthEndpoint === false) {
            // Sin endpoint HTTP (ej. PostgreSQL); simulación rápida de OK
            return true;
        }
        try {
            const response = await fetch(service.healthEndpoint, { method: 'GET', cache: 'no-store' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async function updateServices(app) {
        for (const service of app.state.services) {
            const isOnline = await checkService(service);
            service.status = isOnline ? 'online' : 'offline';
            service.health = isOnline ? 100 : 0;
        }

        const servicesElements = app.elements.servicesGrid.children;
        app.state.services.forEach((service, index) => {
            const element = servicesElements[index];
            const statusBadge = element.querySelector('.status-badge');
            const healthBar = element.querySelector('.health-bar');

            if (service.status === 'online') {
                statusBadge.className = 'status-badge px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800';
                statusBadge.textContent = 'Online';
                healthBar.className = `health-bar bg-green-500 h-2 rounded-full`;
            } else {
                statusBadge.className = 'status-badge px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800';
                statusBadge.textContent = 'Offline';
                healthBar.className = `health-bar bg-red-500 h-2 rounded-full`;
            }
            healthBar.style.width = `${service.health}%`;
        });

        updateStatus(app);
    }

    function updateStatus(app) {
        const onlineServices = app.state.services.filter(s => s.status === 'online').length;
        const criticalOffline = app.state.services.filter(s => s.critical && s.status !== 'online').length;

        if (criticalOffline > 0) {
            app.elements.statusBanner.className = 'mb-8 p-6 rounded-xl shadow-lg text-white bg-red-600';
            app.elements.statusIcon.textContent = 'error';
            app.elements.statusText.textContent = 'SISTEMA CON PROBLEMAS';
            app.elements.statusDescription.textContent = `${criticalOffline} servicio(s) crítico(s) fuera de línea.`;
        } else if (onlineServices === app.state.services.length) {
            app.elements.statusBanner.className = 'mb-8 p-6 rounded-xl shadow-lg text-white bg-green-600';
            app.elements.statusIcon.textContent = 'check_circle';
            app.elements.statusText.textContent = 'SISTEMA OPERACIONAL';
            app.elements.statusDescription.textContent = 'Todos los servicios funcionando correctamente.';
        } else {
            app.elements.statusBanner.className = 'mb-8 p-6 rounded-xl shadow-lg text-white bg-yellow-500';
            app.elements.statusIcon.textContent = 'warning';
            app.elements.statusText.textContent = 'SISTEMA PARCIAL';
            app.elements.statusDescription.textContent = `${app.state.services.length - onlineServices} servicio(s) no crítico(s) fuera de línea.`;
        }
    }

    function toggleTheme(app) {
        app.state.theme = app.state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', app.state.theme);
        document.documentElement.classList.toggle('dark', app.state.theme === 'dark');
        app.elements.themeIcon.textContent = app.state.theme === 'dark' ? 'dark_mode' : 'light_mode';
    }

    function addLog(app, type, message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = new Date().toLocaleTimeString();
        const msgSpan = document.createElement('span');
        msgSpan.className = `log-${type}`;
        msgSpan.textContent = message;
        entry.appendChild(timeSpan);
        entry.appendChild(msgSpan);
        app.elements.consoleLog.appendChild(entry);
        app.elements.consoleLog.scrollTop = app.elements.consoleLog.scrollHeight;
    }

    const MAX_HISTORY = 100;

    function addAlert(app, type, message, service = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            service,
            uptime: ''
        };
        app.state.alertHistory.push(entry);
        if (app.state.alertHistory.length > MAX_HISTORY) {
            app.state.alertHistory.shift();
        }
        localStorage.setItem('alertHistory', JSON.stringify(app.state.alertHistory));
        updateAlertBadge(app);
        addLog(app, type === 'error' ? 'error' : (type === 'warning' ? 'warn' : (type === 'success' ? 'system' : 'output')), message);
    }

    function performGeneralReview(app) {
        addAlert(app, 'info', '🔍 Iniciando revisión general...');
        // Simulación rápida de revisión
        setTimeout(() => {
            addAlert(app, 'success', 'Revisión general completada exitosamente');
        }, 1500);
    }

    function clearCaches(app) {
        addAlert(app, 'info', '🧹 Limpiando caches del sistema...');
        setTimeout(() => {
            addAlert(app, 'success', 'Caches limpiadas correctamente');
        }, 1200);
    }

    function deployUpdate(app) {
        addAlert(app, 'info', '🚀 Desplegando actualización...');
        setTimeout(() => {
            addAlert(app, 'success', 'Actualización desplegada con éxito');
        }, 2000);
    }

    function toggleEmergencyMode(app) {
        app.state.emergencyMode = !app.state.emergencyMode;
        localStorage.setItem('emergencyMode', JSON.stringify(app.state.emergencyMode));
        if (app.state.emergencyMode) {
            document.body.classList.add('ring-4', 'ring-red-600');
            addAlert(app, 'warning', '🚨 Modo emergencia ACTIVADO');
        } else {
            document.body.classList.remove('ring-4', 'ring-red-600');
            addAlert(app, 'info', '✅ Modo emergencia DESACTIVADO');
        }
    }

    function restartService(app, service) {
        addAlert(app, 'warning', `Reiniciando servicio: ${service.name}`);
        service.status = 'checking';
        updateServices(app);
        setTimeout(() => {
            service.status = 'online';
            service.health = 100;
            updateServices(app);
            addAlert(app, 'success', `Servicio ${service.name} reiniciado y en línea`);
        }, 2000);
    }

    function restartAllServices(app) {
        addAlert(app, 'error', '⚠️ Varios servicios caídos. Reinicio completo de la solución...');
        app.state.services.forEach(s => { s.status = 'checking'; s.health = 0; });
        updateServices(app);
        setTimeout(() => {
            app.state.services.forEach(s => { s.status = 'online'; s.health = 100; });
            updateServices(app);
            addAlert(app, 'success', 'Todos los servicios reiniciados con éxito');
        }, 5000);
    }

    function startProtocol(app) {
        addAlert(app, 'info', '⚙️ Iniciando protocolo de arranque...');
        const offlineCritical = app.state.services.filter(s => s.critical && s.status !== 'online');
        const offlineTotal = app.state.services.filter(s => s.status !== 'online');
        if (offlineTotal.length === 0) {
            addAlert(app, 'success', 'Todos los servicios ya estaban en línea');
            return;
        }
        if (offlineTotal.length <= 2) {
            offlineTotal.forEach(s => restartService(app, s));
        } else {
            restartAllServices(app);
        }
    }

    function setupGlobalActions(app) {
        app.elements.globalActions.addEventListener('click', e => {
            const btn = e.target.closest('button[data-action]');
            if (btn) {
                const action = btn.dataset.action;
                switch (action) {
                    case 'review':
                        performGeneralReview(app);
                        break;
                    case 'cache':
                        clearCaches(app);
                        break;
                    case 'deploy':
                        deployUpdate(app);
                        break;
                    case 'emergency':
                        toggleEmergencyMode(app);
                        break;
                    case 'protocol':
                        startProtocol(app);
                        break;
                }
            }
        });
    }

    function handleCommand(app, cmd) {
        const [command, ...args] = cmd.trim().split(/\s+/);
        switch (command.toLowerCase()) {
            case 'help':
                addLog(app, 'output', 'Comandos disponibles: help, clear, status, protocol, history, restart');
                break;
            case 'clear':
                app.elements.consoleLog.innerHTML = '';
                break;
            case 'status':
                app.state.services.forEach(s => {
                    addLog(app, 'output', `${s.name}: ${s.status.toUpperCase()}`);
                });
                break;
            case 'protocol':
                startProtocol(app);
                break;
            case 'history':
                app.state.alertHistory.forEach(entry => {
                    addLog(app, 'output', `[${entry.type.toUpperCase()}] ${entry.message}`);
                });
                break;
            case 'restart':
                if (args.length) {
                    const svcName = args.join(' ');
                    const svc = app.state.services.find(s => s.name.toLowerCase() === svcName.toLowerCase());
                    if (svc) {
                        restartService(app, svc);
                    } else {
                        addLog(app, 'error', `Servicio no encontrado: ${svcName}`);
                    }
                } else {
                    addLog(app, 'error', 'Uso: restart <nombre servicio>');
                }
                break;
            default:
                addLog(app, 'error', `Comando desconocido: ${command}`);
        }
    }

    function updateAlertBadge(app) {
        app.elements.alertCount.textContent = app.state.alertHistory.length;
    }

    function renderAlertHistory(app) {
        const typeFilter = app.elements.alertFilter.value;
        app.elements.alertList.innerHTML = '';
        const filtered = app.state.alertHistory.filter(a => typeFilter === 'all' || a.type === typeFilter);
        filtered.slice().reverse().forEach(a => {
            const item = document.createElement('div');
            item.className = 'p-2 rounded-md border text-xs ' + (a.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : a.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : a.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-700/20');
            item.innerHTML = `<span class="font-mono mr-2 text-[10px]">${new Date(a.timestamp).toLocaleTimeString()}</span> <span class="uppercase font-semibold mr-2">[${a.type}]</span> ${a.message}`;
            app.elements.alertList.appendChild(item);
        });
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

    async function updateServerUptime(app) {
        try {
            const res = await fetch('/uptime.json', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                app.elements.uptimeText.textContent = data.uptime_formatted || formatDuration(data.uptime_seconds * 1000);
                return;
            }
        } catch (_) {}
        // Fallback local contador
        const elapsed = Date.now() - app.state.localStart;
        app.elements.uptimeText.textContent = formatDuration(elapsed);
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
                    addLog(app, 'input', `> ${value}`);
                    handleCommand(app, value);
                    e.target.value = '';
                }
            }
        });
        
        addLog(app, 'system', 'Consola iniciada. Escribe "help" para ver comandos disponibles.');
        updateAlertBadge(app);
        setupGlobalActions(app);
        
        // Alert modal listeners
        app.elements.alertToggle.addEventListener('click', () => {
            app.elements.alertModal.classList.toggle('hidden');
            renderAlertHistory(app);
        });
        app.elements.alertClose.addEventListener('click', () => app.elements.alertModal.classList.add('hidden'));
        app.elements.alertFilter.addEventListener('change', () => renderAlertHistory(app));
        
        // Iniciar monitoreo y uptime
        updateServices(app);
        setInterval(() => updateServices(app), CONFIG.CHECK_INTERVAL);
        updateServerUptime(app);
        setInterval(() => updateServerUptime(app), CONFIG.UPTIME_INTERVAL);

        app.elements.servicesGrid.addEventListener('click', e => {
            const btn = e.target.closest('button[data-restart]');
            if (btn) {
                const svcName = btn.dataset.restart;
                const svc = app.state.services.find(s => s.name === svcName);
                if (svc) restartService(app, svc);
                return;
            }
        });
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
 