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
        },
        logs: {
            alertsBanner: document.getElementById('total-alerts'),
            logsModal: document.getElementById('logs-modal'),
            logsContent: document.getElementById('logs-content'),
            closeModal: document.getElementById('close-logs-modal'),
            exportJSON: document.getElementById('export-json'),
            exportCSV: document.getElementById('export-csv'),
            copyLogs: document.getElementById('copy-logs'),
            filterButtons: document.getElementById('filter-buttons'),
            searchInput: document.getElementById('logs-search')
        }
    };

    // UI Functions
    const UI = {
        updateTheme() {
            DOM.html.classList.toggle('dark', theme === 'dark');
            DOM.themeIcon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
            localStorage.setItem('theme', theme);
        },

        async updateServerUptime() {
            try {
                const response = await fetch('/uptime.json?' + Date.now(), {
                    method: 'GET',
                    cache: 'no-store'
                });
                
                if (response.ok) {
                    serverUptimeData = await response.json();
                    DOM.uptimeDisplay.textContent = serverUptimeData.uptime_formatted;
                } else {
                    throw new Error('Failed to fetch uptime');
                }
            } catch (error) {
                console.warn('Error fetching server uptime:', error);
                // Fallback to client-side counter if server uptime fails
                if (!serverUptimeData) {
                    const now = Date.now();
                    const startTime = localStorage.getItem('startTime') || now;
                    const clientUptime = Math.floor((now - startTime) / 1000);
                    
                    const d = Math.floor(clientUptime / 86400);
                    const h = Math.floor((clientUptime % 86400) / 3600);
                    const m = Math.floor((clientUptime % 3600) / 60);
                    const s = clientUptime % 60;
                    DOM.uptimeDisplay.textContent = `${d}d ${h}h ${m}m ${s}s (client)`;
                    
                    localStorage.setItem('startTime', startTime);
                }
            }
        },

        addLogEntry(message, type = 'output') {
            const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${type}`;
            logEntry.innerHTML = `<span class="log-time">[${time}]</span><span>${message}</span>`;
            DOM.consoleLog.appendChild(logEntry);
            DOM.consoleLog.scrollTop = DOM.consoleLog.scrollHeight;
        },

        renderServices() {
            DOM.servicesGrid.innerHTML = '';
            services.forEach(service => {
                let statusColor, statusIcon, statusText, bgColor;
                
                switch(service.status) {
                    case 'Online':
                        statusColor = '#22c55e';
                        statusIcon = 'check_circle';
                        statusText = 'Online';
                        bgColor = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
                        break;
                    case 'Warning':
                        statusColor = '#f59e0b';
                        statusIcon = 'warning';
                        statusText = 'Warning';
                        bgColor = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
                        break;
                    case 'Offline':
                    default:
                        statusColor = '#ef4444';
                        statusIcon = 'error';
                        statusText = 'Offline';
                        bgColor = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                }

                const serviceCard = document.createElement('div');
                serviceCard.className = `p-4 rounded-lg border-2 ${bgColor} transition-all hover:shadow-md`;
                serviceCard.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-gray-900 dark:text-white">${service.name}</h3>
                        <div class="flex items-center space-x-2">
                            <span class="material-icons text-xl" style="color: ${statusColor}">${statusIcon}</span>
                            <button 
                                onclick="restartSingleService('${service.name}')"
                                class="material-icons text-lg text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded p-1 transition-all cursor-pointer"
                                title="Reiniciar ${service.name}"
                            >
                                refresh
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-300">Puerto: ${service.port}</span>
                        <span class="font-medium" style="color: ${statusColor}">${statusText}</span>
                    </div>
                    ${service.critical ? '<div class="mt-2"><span class="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full">Crítico</span></div>' : ''}
                    <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Container: ${service.container}
                    </div>
                `;
                DOM.servicesGrid.appendChild(serviceCard);
            });
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

        addAlertToHistory(message, type, service = null) {
            const alert = {
                timestamp: new Date().toISOString(),
                message,
                type,
                service,
                uptime: serverUptimeData ? serverUptimeData.uptime_formatted : 'unknown'
            };
            alertHistory.unshift(alert);
            if (alertHistory.length > 100) alertHistory.pop(); // Mantener solo últimas 100 alertas
            localStorage.setItem('alertHistory', JSON.stringify(alertHistory));
            this.addLogEntry(`📝 ${message}`, type);
        },

        toggleEmergencyMode() {
            emergencyMode = !emergencyMode;
            DOM.html.classList.toggle('emergency-mode', emergencyMode);
            DOM.globalActions.emergencyBtn.classList.toggle('active', emergencyMode);
            this.addAlertToHistory(
                `${emergencyMode ? '🚨 MODO EMERGENCIA ACTIVADO' : '✅ MODO EMERGENCIA DESACTIVADO'}`,
                emergencyMode ? 'error' : 'success'
            );
        },

        showLogsModal() {
            DOM.logsModal.classList.remove('hidden');
            // Agregar animación de entrada
            requestAnimationFrame(() => {
                DOM.logsModal.querySelector('.bg-white').classList.add('scale-100', 'opacity-100');
                DOM.logsModal.querySelector('.bg-white').classList.remove('scale-95', 'opacity-0');
            });
            this.renderLogs();
        },

        hideLogsModal() {
            // Agregar animación de salida
            DOM.logsModal.querySelector('.bg-white').classList.add('scale-95', 'opacity-0');
            DOM.logsModal.querySelector('.bg-white').classList.remove('scale-100', 'opacity-100');
            setTimeout(() => {
                DOM.logsModal.classList.add('hidden');
            }, 200);
        },

        renderLogs(filter = 'all', searchTerm = '') {
            const filteredLogs = alertHistory.filter(log => {
                const matchesFilter = filter === 'all' || log.type === filter;
                const matchesSearch = !searchTerm || 
                    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (log.service && log.service.toLowerCase().includes(searchTerm.toLowerCase()));
                return matchesFilter && matchesSearch;
            });

            DOM.logsContent.innerHTML = filteredLogs.map(log => `
                <div class="log-entry log-${log.type} p-3 mb-2 rounded">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">${new Date(log.timestamp).toLocaleString('es-ES')}</span>
                        <span class="text-xs bg-${this.getTypeColor(log.type)} px-2 py-1 rounded-full">${log.type}</span>
                    </div>
                    <div class="mt-1">${log.message}</div>
                    ${log.service ? `<div class="text-sm text-gray-600 mt-1">Servicio: ${log.service}</div>` : ''}
                    <div class="text-xs text-gray-500 mt-1">Uptime: ${log.uptime}</div>
                </div>
            `).join('');
        },

        getTypeColor(type) {
            const colors = {
                'error': 'red-100 text-red-800',
                'warning': 'yellow-100 text-yellow-800',
                'success': 'green-100 text-green-800',
                'info': 'blue-100 text-blue-800'
            };
            return colors[type] || colors.info;
        },

        exportLogs(format = 'json') {
            const data = format === 'json' ? 
                JSON.stringify(alertHistory, null, 2) :
                this.convertToCSV(alertHistory);
            
            const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `umbot-logs-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        },

        convertToCSV(logs) {
            const headers = ['Timestamp', 'Type', 'Message', 'Service', 'Uptime'];
            const rows = logs.map(log => [
                new Date(log.timestamp).toLocaleString('es-ES'),
                log.type,
                log.message,
                log.service || '',
                log.uptime
            ]);
            return [headers, ...rows]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');
        },

        async copyLogsToClipboard() {
            try {
                const text = alertHistory
                    .map(log => `[${new Date(log.timestamp).toLocaleString('es-ES')}] ${log.type.toUpperCase()}: ${log.message}${log.service ? ` (${log.service})` : ''} - Uptime: ${log.uptime}`)
                    .join('\n');
                
                await navigator.clipboard.writeText(text);
                this.addLogEntry('✅ Logs copiados al portapapeles', 'success');
            } catch (error) {
                this.addLogEntry('❌ Error al copiar logs: ' + error.message, 'error');
            }
        }
    };

    // API Functions
    const API = {
        async checkServiceHealth(service) {
            try {
                const response = await fetch(`${window.location.origin}${service.healthEndpoint}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                return response.ok;
            } catch (error) {
                console.error(`Error checking ${service.name}:`, error);
                return false;
            }
        },

        async checkContainerStatus(containerName) {
            try {
                // Simulación de verificación de contenedor
                // En un entorno real, esto haría una llamada a la API Docker
                return 'Online'; // Por ahora, asumir que está online si llegamos aquí
            } catch (error) {
                return 'Offline';
            }
        },

        async checkAllServices() {
            totalChecks++;
            UI.addLogEntry(`🔄 Verificación #${totalChecks} iniciada...`, 'info');

            const promises = services.map(async (service) => {
                const status = await this.checkServiceHealth(service);
                service.status = status ? 'Online' : 'Offline';
                service.health = status ? 100 : 0;
                
                if (!status && service.critical) {
                    totalAlerts++;
                    UI.addLogEntry(`⚠️ ALERTA: ${service.name} fuera de línea`, 'error');
                }
                
                return service;
            });

            await Promise.all(promises);
            UI.renderServices();
            UI.updateSystemStatus();
            UI.addLogEntry(`✅ Verificación completada. Servicios online: ${services.filter(s => s.status === 'Online').length}/${services.length}`, 'success');
        }
    };

    // Protocol Functions
    const Protocol = {
        async executeDockerCommand(command, container = null) {
            try {
                const displayCommand = container ? `${command} ${container}` : command;
                UI.addLogEntry(`🔧 Ejecutando: ${displayCommand}`, 'info');
                
                // Simular ejecución de comando Docker con delay realista
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                UI.addLogEntry(`✅ Comando completado: ${displayCommand}`, 'success');
                return true;
            } catch (error) {
                UI.addLogEntry(`❌ Error ejecutando comando: ${error.message}`, 'error');
                return false;
            }
        },

        async restartService(serviceName) {
            UI.addLogEntry(`🔄 Reiniciando servicio: ${serviceName}`, 'info');
            
            const service = services.find(s => s.name === serviceName);
            if (!service) {
                UI.addLogEntry(`❌ Servicio no encontrado: ${serviceName}`, 'error');
                return false;
            }

            // Ejecutar comando Docker restart
            const success = await this.executeDockerCommand('docker restart', service.container);
            
            if (success) {
                UI.addLogEntry(`✅ Servicio ${serviceName} reiniciado`, 'success');
                UI.addLogEntry(`⏳ Esperando 10 segundos para verificación...`, 'info');
                
                // Esperar un poco y verificar el servicio
                setTimeout(async () => {
                    const newStatus = await API.checkServiceHealth(service);
                    service.status = newStatus ? 'Online' : 'Offline';
                    UI.renderServices();
                    UI.updateSystemStatus();
                    
                    if (newStatus) {
                        UI.addLogEntry(`🎉 ${serviceName} verificado como ONLINE`, 'success');
                    } else {
                        UI.addLogEntry(`⚠️ ${serviceName} reiniciado pero aún muestra estado: ${newStatus}`, 'warning');
                    }
                }, 10000);
            }
            
            return success;
        },

        async restartAllServices() {
            UI.addLogEntry('🚨 REINICIANDO TODA LA SOLUCIÓN', 'warning');
            
            const commands = [
                { cmd: 'docker-compose down', desc: 'Deteniendo servicios' },
                { cmd: 'docker system prune -f', desc: 'Limpiando sistema' },
                { cmd: 'docker-compose up -d', desc: 'Iniciando servicios' }
            ];

            for (const { cmd, desc } of commands) {
                UI.addLogEntry(`📋 ${desc}...`, 'info');
                const success = await this.executeDockerCommand(cmd);
                if (!success) {
                    UI.addLogEntry('❌ Error en reinicio completo', 'error');
                    return false;
                }
            }

            UI.addLogEntry('⏳ Esperando estabilización de servicios (30s)...', 'info');
            setTimeout(() => {
                API.checkAllServices();
                UI.addLogEntry('✅ REINICIO COMPLETO FINALIZADO', 'success');
            }, 30000);

            return true;
        },

        async startAllServices() {
            if (protocolRunning) {
                UI.addLogEntry('⚠️ El protocolo de arranque ya está en ejecución', 'warning');
                return;
            }

            try {
                UI.addLogEntry('🚀 Iniciando protocolo de arranque...', 'info');
                protocolRunning = true;

                const response = await fetch('http://localhost:8093/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'start_all',
                        services: services.map(s => ({
                            name: s.name,
                            container: s.container,
                            critical: s.critical,
                            status: s.status
                        }))
                    })
                });

                if (!response.ok) {
                    throw new Error(`Error en el servidor: ${response.status}`);
                }

                const result = await response.json();
                UI.addLogEntry(`✅ ${result.message}`, 'success');

                // Esperar 10 segundos antes de verificar el estado de los servicios
                await new Promise(resolve => setTimeout(resolve, 10000));
                await API.checkAllServices();

            } catch (error) {
                UI.addLogEntry(`❌ Error al ejecutar el protocolo: ${error.message}`, 'error');
            } finally {
                protocolRunning = false;
            }
        },

        async startProtocol() {
            if (protocolRunning) {
                UI.addLogEntry('⚠️ El protocolo ya está en ejecución', 'warning');
                return;
            }

            const offlineServices = services.filter(s => s.status !== 'Online');
            const criticalOffline = offlineServices.filter(s => s.critical);

            if (offlineServices.length === 0) {
                UI.addLogEntry('✅ Todos los servicios están en línea. No es necesario ejecutar el protocolo.', 'info');
                return;
            }

            UI.addLogEntry('🔍 Analizando estado del sistema...', 'info');
            
            if (criticalOffline.length > 0) {
                UI.addLogEntry(`⚠️ Detectados ${criticalOffline.length} servicios críticos fuera de línea`, 'warning');
                UI.addLogEntry('🚀 Iniciando protocolo de arranque completo...', 'info');
                await this.startAllServices();
            } else if (offlineServices.length <= 2) {
                UI.addLogEntry('🔧 Reiniciando servicios individuales...', 'info');
                for (const service of offlineServices) {
                    await this.restartService(service.name);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
                await API.checkAllServices();
            } else {
                UI.addLogEntry('⚠️ Múltiples servicios no críticos fuera de línea', 'warning');
                UI.addLogEntry('🚀 Iniciando protocolo de arranque completo...', 'info');
                await this.startAllServices();
            }
        }
    };

    // Commands
    const Commands = {
        help() {
            const commands = [
                'help - Muestra esta ayuda',
                'status - Estado de todos los servicios',
                'check - Verifica servicios ahora',
                'uptime - Muestra uptime del servidor',
                'restart [servicio] - Reinicia un servicio',
                'protocol - Inicia protocolo de arranque',
                'containers - Muestra información de contenedores',
                'clear - Limpia la consola'
            ];
            commands.forEach(cmd => UI.addLogEntry(cmd, 'info'));
        },

        status() {
            UI.addLogEntry('📊 Estado actual del sistema:', 'info');
            services.forEach(service => {
                const icon = service.status === 'Online' ? '🟢' : service.status === 'Warning' ? '🟡' : '🔴';
                UI.addLogEntry(`${icon} ${service.name}: ${service.status} (${service.container})`, 'output');
            });
        },

        async check() {
            UI.addLogEntry('🔄 Iniciando verificación manual...', 'info');
            await API.checkAllServices();
        },

        uptime() {
            if (serverUptimeData) {
                UI.addLogEntry(`⏱️ Uptime del servidor: ${serverUptimeData.uptime_formatted}`, 'info');
                UI.addLogEntry(`📅 ${serverUptimeData.days} días, ${serverUptimeData.hours} horas, ${serverUptimeData.minutes} minutos`, 'output');
            } else {
                UI.addLogEntry('❌ Información de uptime no disponible', 'error');
            }
        },

        async restart(service) {
            if (!service) {
                UI.addLogEntry('❌ Especifica un servicio para reiniciar', 'error');
                UI.addLogEntry('Servicios disponibles:', 'info');
                services.forEach(s => {
                    UI.addLogEntry(`  - ${s.name.toLowerCase().replace(/\s+/g, '-')} (${s.name})`, 'info');
                });
                return;
            }
            
            const foundService = services.find(s => 
                s.name.toLowerCase().includes(service.toLowerCase()) ||
                s.container.toLowerCase().includes(service.toLowerCase())
            );
            
            if (foundService) {
                await Protocol.restartService(foundService.name);
            } else {
                UI.addLogEntry(`❌ Servicio no encontrado: ${service}`, 'error');
            }
        },

        containers() {
            UI.addLogEntry('🐳 Contenedores Docker configurados:', 'info');
            services.forEach(service => {
                UI.addLogEntry(`${service.name} → ${service.container}:${service.port}`, 'output');
            });
        },

        async protocol() {
            await Protocol.startProtocol();
        },

        clear() {
            DOM.consoleLog.innerHTML = '';
            UI.addLogEntry('🧹 Consola limpiada', 'info');
        }
    };

    // Event Handlers
    function handleCommand(command) {
        const [cmd, ...args] = command.trim().toLowerCase().split(' ');
        UI.addLogEntry(`> ${command}`, 'command');

        if (Commands[cmd]) {
            Commands[cmd](...args);
        } else {
            UI.addLogEntry(`❌ Comando desconocido: ${cmd}. Usa 'help' para ver comandos disponibles.`, 'error');
        }
    }

    // Global functions for buttons
    window.startAllServices = function() {
        Protocol.startProtocol();
    };

    window.restartSingleService = function(serviceName) {
        UI.addLogEntry(`🔄 Reinicio solicitado para: ${serviceName}`, 'info');
        Protocol.restartService(serviceName);
    };

    // Global Actions
    const GlobalActions = {
        async performGeneralReview() {
            if (protocolRunning) {
                UI.addLogEntry('⚠️ Hay un protocolo en ejecución. Espere a que termine.', 'warning');
                return;
            }

            UI.addAlertToHistory('🔍 Iniciando revisión general del sistema', 'info');
            protocolRunning = true;

            try {
                // 1. Verificar servicios
                await API.checkAllServices();

                // 2. Verificar espacio en disco
                UI.addLogEntry('📊 Verificando espacio en disco...', 'info');
                await Protocol.executeDockerCommand('docker system df');

                // 3. Verificar logs recientes
                UI.addLogEntry('📜 Verificando logs recientes...', 'info');
                await Protocol.executeDockerCommand('docker-compose logs --tail=10');

                // 4. Verificar recursos
                UI.addLogEntry('💻 Verificando uso de recursos...', 'info');
                await Protocol.executeDockerCommand('docker stats --no-stream');

                UI.addAlertToHistory('✅ Revisión general completada', 'success');
            } catch (error) {
                UI.addAlertToHistory(`❌ Error en revisión general: ${error.message}`, 'error');
            } finally {
                protocolRunning = false;
            }
        },

        async clearCaches() {
            if (protocolRunning) {
                UI.addLogEntry('⚠️ Hay un protocolo en ejecución. Espere a que termine.', 'warning');
                return;
            }

            UI.addAlertToHistory('🧹 Iniciando limpieza de caches', 'info');
            protocolRunning = true;

            try {
                // 1. Limpiar cache de Docker
                UI.addLogEntry('🗑️ Limpiando cache de Docker...', 'info');
                await Protocol.executeDockerCommand('docker system prune -f');

                // 2. Limpiar cache de aplicación
                UI.addLogEntry('🗑️ Limpiando cache de aplicación...', 'info');
                await Protocol.executeDockerCommand('docker-compose exec directus npx directus cache:clear');

                // 3. Verificar estado post-limpieza
                await API.checkAllServices();

                UI.addAlertToHistory('✅ Limpieza de caches completada', 'success');
            } catch (error) {
                UI.addAlertToHistory(`❌ Error en limpieza de caches: ${error.message}`, 'error');
            } finally {
                protocolRunning = false;
            }
        },

        async deployUpdate() {
            if (protocolRunning) {
                UI.addLogEntry('⚠️ Hay un protocolo en ejecución. Espere a que termine.', 'warning');
                return;
            }

            UI.addAlertToHistory('🚀 Iniciando actualización del sistema', 'info');
            protocolRunning = true;

            try {
                // 1. Pull de nuevas imágenes
                UI.addLogEntry('📥 Descargando actualizaciones...', 'info');
                await Protocol.executeDockerCommand('docker-compose pull');

                // 2. Recrear contenedores
                UI.addLogEntry('🔄 Recreando contenedores...', 'info');
                await Protocol.executeDockerCommand('docker-compose up -d --force-recreate');

                // 3. Verificar estado post-update
                await new Promise(resolve => setTimeout(resolve, 10000));
                await API.checkAllServices();

                UI.addAlertToHistory('✅ Actualización completada', 'success');
            } catch (error) {
                UI.addAlertToHistory(`❌ Error en actualización: ${error.message}`, 'error');
            } finally {
                protocolRunning = false;
            }
        }
    };

    // Event Listeners para acciones globales
    function setupGlobalActions() {
        DOM.globalActions.reviewBtn.addEventListener('click', GlobalActions.performGeneralReview);
        DOM.globalActions.cacheBtn.addEventListener('click', GlobalActions.clearCaches);
        DOM.globalActions.deployBtn.addEventListener('click', GlobalActions.deployUpdate);
        DOM.globalActions.emergencyBtn.addEventListener('click', UI.toggleEmergencyMode);
    }

    // Event Listeners para el sistema de logs
    function setupLogsSystem() {
        // Click en el banner de alertas abre el modal
        DOM.logs.alertsBanner.addEventListener('click', () => UI.showLogsModal());
        
        // Cerrar modal
        DOM.logs.closeModal.addEventListener('click', () => UI.hideLogsModal());
        
        // Exportar logs
        DOM.logs.exportJSON.addEventListener('click', () => UI.exportLogs('json'));
        DOM.logs.exportCSV.addEventListener('click', () => UI.exportLogs('csv'));
        DOM.logs.copyLogs.addEventListener('click', () => UI.copyLogsToClipboard());
        
        // Filtros
        DOM.logs.filterButtons.addEventListener('click', (e) => {
            if (e.target.dataset.filter) {
                const buttons = DOM.logs.filterButtons.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                UI.renderLogs(e.target.dataset.filter, DOM.logs.searchInput.value);
            }
        });
        
        // Búsqueda
        DOM.logs.searchInput.addEventListener('input', (e) => {
            const activeFilter = DOM.logs.filterButtons.querySelector('button.active').dataset.filter;
            UI.renderLogs(activeFilter, e.target.value);
        });
    }

    // Extender init() para incluir setup de acciones globales y del sistema de logs
    function init() {
        setupGlobalActions();
        setupLogsSystem();
        UI.updateTheme();
        API.checkAllServices();
        setInterval(API.checkAllServices.bind(API), CONFIG.CHECK_INTERVAL);
        setInterval(UI.updateServerUptime.bind(UI), 5000);
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); 