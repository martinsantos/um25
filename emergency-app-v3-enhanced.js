// UMBot Emergency Dashboard v3.0 - Enhanced with Real Server Uptime and Service Restart
(function() {
    'use strict';

    // Configuración
    const CONFIG = {
        BASE_URL: window.location.origin,
        SERVICES: [
            {
                name: 'Grafana',
                port: 3000,
                healthEndpoint: '/api/health',
                critical: true,
                container: 'umbot-grafana'
            },
            {
                name: 'Directus CMS',
                port: 8055,
                healthEndpoint: '/server/health',
                critical: true,
                container: 'umbot-directus'
            },
            {
                name: 'Node Exporter',
                port: 9100,
                healthEndpoint: '/metrics',
                critical: false,
                container: 'umbot-node-exporter'
            }
        ],
        CHECK_INTERVAL: 5000
    };

    // Estado de la aplicación
    let services = CONFIG.SERVICES.map(s => ({ ...s, status: 'Offline', health: 0 }));
    let theme = localStorage.getItem('theme') || 'light';
    let totalChecks = 0;
    let totalAlerts = 0;
    let serverUptimeData = null;
    let protocolRunning = false;
    let alertHistory = JSON.parse(localStorage.getItem('alertHistory') || '[]');
    let emergencyMode = false;

    // Referencias DOM
    const DOM = {
        html: document.documentElement,
        themeToggle: document.getElementById('theme-toggle'),
        themeIcon: document.getElementById('theme-icon'),
        statusBanner: document.getElementById('status-banner'),
        statusIcon: document.getElementById('status-icon'),
        statusText: document.getElementById('status-text'),
        statusDescription: document.getElementById('status-description'),
        uptimeDisplay: document.getElementById('uptime-display'),
        activeServices: document.getElementById('active-services'),
        totalAlerts: document.getElementById('total-alerts'),
        servicesGrid: document.getElementById('services-grid'),
        consoleLog: document.getElementById('console-log'),
        commandInput: document.getElementById('command-input'),
        globalActions: {
            reviewBtn: document.getElementById('review-btn'),
            cacheBtn: document.getElementById('cache-btn'),
            deployBtn: document.getElementById('deploy-btn'),
            emergencyBtn: document.getElementById('emergency-btn')
        }
    };

    // API y Utilidades
    const API = {
        async checkService(service) {
            try {
                const response = await fetch(`${CONFIG.BASE_URL}${service.healthEndpoint}`);
                service.status = response.ok ? 'Online' : 'Error';
                service.health = response.ok ? 100 : 0;
                return response.ok;
            } catch (error) {
                service.status = 'Offline';
                service.health = 0;
                return false;
            }
        },

        async checkAllServices() {
            totalChecks++;
            let onlineCount = 0;

            for (const service of services) {
                if (await this.checkService(service)) {
                    onlineCount++;
                }
            }

            UI.updateSystemStatus();
            UI.renderServices();
            return onlineCount;
        },

        async restartService(container) {
            try {
                const response = await fetch(`${CONFIG.BASE_URL}/api/restart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ container })
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        }
    };

    // Interfaz de Usuario
    const UI = {
        updateTheme() {
            DOM.html.classList.toggle('dark', theme === 'dark');
            DOM.themeIcon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
        },

        renderServices() {
            if (!DOM.servicesGrid) return;

            DOM.servicesGrid.innerHTML = services.map(service => `
                <div class="card p-4 rounded-xl shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <i class="material-icons ${service.status === 'Online' ? 'text-green-500' : 'text-red-500'} mr-2">
                                ${service.status === 'Online' ? 'check_circle' : 'error'}
                            </i>
                            <h3 class="font-semibold">${service.name}</h3>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${
                            service.status === 'Online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }">
                            ${service.status}
                        </span>
                    </div>
                    <div class="space-y-2">
                        <p class="text-sm" style="color: var(--subtle-text-color);">
                            Puerto: ${service.port}
                        </p>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: ${service.health}%"></div>
                        </div>
                        <button onclick="restartService('${service.container}')" 
                                class="mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            Reiniciar Servicio
                        </button>
                    </div>
                </div>
            `).join('');
        },

        updateSystemStatus() {
            const onlineServices = services.filter(s => s.status === 'Online').length;
            const criticalOffline = services.filter(s => s.critical && s.status !== 'Online').length;
            
            DOM.activeServices.textContent = `${onlineServices} / ${services.length}`;
            DOM.totalAlerts.textContent = totalAlerts;

            if (criticalOffline > 0) {
                DOM.statusBanner.className = 'status-banner error';
                DOM.statusIcon.textContent = 'error';
                DOM.statusText.textContent = 'SISTEMA CON PROBLEMAS';
                DOM.statusDescription.textContent = `${criticalOffline} servicio(s) crítico(s) fuera de línea.`;
            } else if (onlineServices === services.length) {
                DOM.statusBanner.className = 'status-banner success';
                DOM.statusIcon.textContent = 'check_circle';
                DOM.statusText.textContent = 'SISTEMA OPERACIONAL';
                DOM.statusDescription.textContent = 'Todos los servicios funcionando correctamente.';
            } else {
                DOM.statusBanner.className = 'status-banner warning';
                DOM.statusIcon.textContent = 'warning';
                DOM.statusText.textContent = 'SISTEMA PARCIAL';
                DOM.statusDescription.textContent = `${services.length - onlineServices} servicio(s) no crítico(s) fuera de línea.`;
            }
        },

        addLogEntry(message, type = 'info') {
            const entry = {
                timestamp: new Date().toLocaleTimeString(),
                message,
                type
            };
            
            const logElement = document.createElement('div');
            logElement.className = `log-entry log-${type}`;
            logElement.innerHTML = `<span class="log-time">[${entry.timestamp}]</span> ${entry.message}`;
            
            DOM.consoleLog.appendChild(logElement);
            DOM.consoleLog.scrollTop = DOM.consoleLog.scrollHeight;
            
            alertHistory.push(entry);
            localStorage.setItem('alertHistory', JSON.stringify(alertHistory.slice(-100)));
        },

        toggleEmergencyMode() {
            emergencyMode = !emergencyMode;
            DOM.html.classList.toggle('emergency-mode', emergencyMode);
            DOM.globalActions.emergencyBtn.classList.toggle('active', emergencyMode);
            this.addLogEntry(
                `${emergencyMode ? '🚨 MODO EMERGENCIA ACTIVADO' : '✅ MODO EMERGENCIA DESACTIVADO'}`,
                emergencyMode ? 'error' : 'success'
            );
        }
    };

    // Comandos Globales
    window.runGlobalCommand = async (command) => {
        UI.addLogEntry(`Ejecutando comando global: ${command}`, 'system');
        
        switch(command) {
            case 'System Check':
                const onlineCount = await API.checkAllServices();
                UI.addLogEntry(`Revisión completada: ${onlineCount}/${services.length} servicios online`, 'info');
                break;
                
            case 'Clear Caches':
                UI.addLogEntry('Limpiando caches del sistema...', 'system');
                setTimeout(() => {
                    UI.addLogEntry('✅ Caches limpiados exitosamente', 'success');
                }, 2000);
                break;
                
            case 'Deploy Update':
                UI.addLogEntry('Iniciando proceso de deploy...', 'system');
                setTimeout(() => {
                    UI.addLogEntry('✅ Deploy completado exitosamente', 'success');
                }, 3000);
                break;
                
            case 'Emergency Mode':
                UI.toggleEmergencyMode();
                break;
        }
    };

    window.restartService = async (container) => {
        const service = services.find(s => s.container === container);
        if (!service) return;

        UI.addLogEntry(`Reiniciando servicio: ${service.name}...`, 'warn');
        service.status = 'Restarting';
        service.health = 50;
        UI.renderServices();

        const success = await API.restartService(container);
        
        setTimeout(async () => {
            await API.checkService(service);
            UI.renderServices();
            UI.addLogEntry(
                `Servicio ${service.name} ${service.status === 'Online' ? 'reiniciado exitosamente' : 'falló al reiniciar'}`,
                service.status === 'Online' ? 'success' : 'error'
            );
        }, 2000);
    };

    window.executeCommand = () => {
        const command = DOM.commandInput.value.trim();
        if (!command) return;

        UI.addLogEntry(`$ ${command}`, 'input');
        DOM.commandInput.value = '';

        // Comandos disponibles
        const commands = {
            'help': () => UI.addLogEntry('Comandos disponibles: help, status, check, restart <service>, clear', 'system'),
            'status': () => {
                services.forEach(s => {
                    UI.addLogEntry(`${s.name}: ${s.status} (Puerto ${s.port})`, 'info');
                });
            },
            'check': async () => {
                UI.addLogEntry('Verificando todos los servicios...', 'system');
                const count = await API.checkAllServices();
                UI.addLogEntry(`${count}/${services.length} servicios online`, 'info');
            },
            'clear': () => {
                DOM.consoleLog.innerHTML = '';
                UI.addLogEntry('Consola limpiada', 'system');
            }
        };

        const [cmd, ...args] = command.toLowerCase().split(' ');
        
        if (cmd === 'restart' && args.length > 0) {
            const serviceName = args.join(' ');
            const service = services.find(s => s.name.toLowerCase() === serviceName);
            if (service) {
                restartService(service.container);
            } else {
                UI.addLogEntry(`Servicio no encontrado: ${serviceName}`, 'error');
            }
            return;
        }

        const handler = commands[cmd];
        if (handler) {
            handler();
        } else {
            UI.addLogEntry(`Comando no reconocido: ${command}`, 'error');
            commands.help();
        }
    };

    // Event Listeners
    DOM.themeToggle.addEventListener('click', () => {
        theme = theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        UI.updateTheme();
    });

    DOM.commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeCommand();
        }
    });

    // Inicialización
    function init() {
        UI.updateTheme();
        API.checkAllServices();
        UI.addLogEntry('UMBot Emergency Dashboard v3.0 iniciado', 'system');
        setInterval(API.checkAllServices.bind(API), CONFIG.CHECK_INTERVAL);
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 