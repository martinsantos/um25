// Global variables
const API_URL = 'http://23.105.176.45:8092/api';
let startTime = Date.now();
let logs = [];
let services = [];
let systemMetrics = {
    totalChecks: 0,
    totalErrors: 0,
    totalRestarts: 0,
    avgResponseTime: 0
};

// Tab functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-400');
        btn.classList.add('border-transparent');
    });
    
    // Highlight active tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('border-transparent');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('border-blue-500', 'text-blue-400');
    
    // Load specific tab data
    if (tabName === 'services') {
        loadServices();
    } else if (tabName === 'stats') {
        updateStats();
    }
}

// Update datetime
function updateDateTime() {
    const now = new Date();
    document.getElementById('datetime').textContent = now.toLocaleString('es-ES');
}

// Update uptime
function updateUptime() {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('uptime').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Add log entry
function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString('es-ES');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const typeClass = `log-${type}`;
    const typeText = type.toUpperCase();
    
    logEntry.innerHTML = `<span class="log-time">[${time}]</span><span class="${typeClass}">[${typeText}]</span> ${message}`;
    
    const console = document.getElementById('console');
    console.appendChild(logEntry);
    console.scrollTop = console.scrollHeight;
    
    // Keep only last 100 logs
    if (console.children.length > 100) {
        console.removeChild(console.firstChild);
    }
    
    // Store log
    logs.push({ time, type, message });
}

// Clear logs
function clearLogs() {
    document.getElementById('console').innerHTML = '';
    logs = [];
    addLog('Logs limpiados', 'info');
}

// Export logs
function exportLogs() {
    const logText = logs.map(log => `[${log.time}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umbot-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Logs exportados', 'success');
}

// Execute command
async function executeCommand(command) {
    addLog(`Ejecutando comando: ${command}`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            addLog(`Comando ejecutado exitosamente`, 'success');
            // Mostrar solo las primeras líneas del output para no saturar
            const lines = data.output.split('\n').slice(0, 20);
            lines.forEach(line => {
                if (line.trim()) addLog(line, 'info');
            });
            if (data.output.split('\n').length > 20) {
                addLog('... (output truncado)', 'info');
            }
        } else {
            addLog(`Error: ${data.message}`, 'critical');
            if (data.stderr) {
                addLog(`Stderr: ${data.stderr}`, 'warning');
            }
        }
    } catch (error) {
        addLog(`Error de conexión: ${error.message}`, 'critical');
    }
}

// Emergency recovery
async function emergencyRecovery() {
    if (!confirm('¿Está seguro de ejecutar la recuperación de emergencia?')) return;
    
    addLog('Iniciando recuperación de emergencia...', 'warning');
    
    try {
        await executeCommand('docker-compose restart');
        addLog('Esperando 10 segundos para que los servicios se reinicien...', 'info');
        setTimeout(() => {
            loadServices();
            addLog('Recuperación de emergencia completada', 'success');
        }, 10000);
    } catch (error) {
        addLog(`Error en recuperación: ${error.message}`, 'critical');
    }
}

// Run diagnostics
async function runDiagnostics() {
    addLog('Iniciando diagnóstico completo...', 'info');
    
    const commands = [
        'docker ps -a',
        'docker stats --no-stream',
        'df -h',
        'free -h',
        'uptime',
        'docker network ls',
        'docker volume ls'
    ];
    
    for (const cmd of commands) {
        await executeCommand(cmd);
        // Pequeña pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    addLog('Diagnóstico completo finalizado', 'success');
}

// Clean Docker
async function cleanDocker() {
    if (!confirm('¿Está seguro de limpiar Docker? Esto eliminará imágenes y contenedores no utilizados.')) return;
    
    addLog('Iniciando limpieza de Docker...', 'warning');
    
    try {
        await executeCommand('docker system prune -f');
        await executeCommand('docker volume prune -f');
        await executeCommand('docker image prune -f');
        addLog('Limpieza de Docker completada', 'success');
    } catch (error) {
        addLog(`Error en limpieza: ${error.message}`, 'critical');
    }
}

// Load services from API
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/services`);
        const data = await response.json();
        
        if (data.status === 'success') {
            services = data.services;
            systemMetrics = data.metrics;
            updateServicesDisplay();
            updateStats();
        } else {
            addLog('Error al cargar servicios', 'critical');
        }
    } catch (error) {
        addLog(`Error de conexión: ${error.message}`, 'critical');
    }
}

// Update services display
function updateServicesDisplay() {
    const grid = document.getElementById('services-grid');
    grid.innerHTML = '';
    
    services.forEach(service => {
        const statusIcon = service.status === 'healthy' ? 'check_circle' : 'cancel';
        const statusColor = service.status === 'healthy' ? 'text-green-400' : 'text-red-400';
        
        const serviceCard = document.createElement('div');
        serviceCard.className = 'bg-gray-700 rounded-lg p-4 border border-gray-600';
        serviceCard.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold flex items-center">
                    <span class="material-icons mr-2 ${statusColor}">${statusIcon}</span>
                    ${service.displayName}
                </h3>
                <span class="text-sm text-gray-400">Puerto: ${service.port}</span>
            </div>
            <div class="text-sm text-gray-400 mb-3">Estado: ${service.uptime}</div>
            <button onclick="restartService('${service.name}')" class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center">
                <span class="material-icons mr-2">refresh</span>
                Reiniciar
            </button>
        `;
        grid.appendChild(serviceCard);
    });
}

// Restart service
async function restartService(serviceName) {
    if (!confirm(`¿Está seguro de reiniciar ${serviceName}?`)) return;
    
    addLog(`Reiniciando servicio: ${serviceName}`, 'warning');
    
    try {
        const response = await fetch(`${API_URL}/restart/${serviceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            addLog(`${serviceName} reiniciado exitosamente`, 'success');
            // Recargar servicios después de 5 segundos
            setTimeout(loadServices, 5000);
        } else {
            addLog(`Error al reiniciar ${serviceName}: ${data.message}`, 'critical');
        }
    } catch (error) {
        addLog(`Error de conexión: ${error.message}`, 'critical');
    }
}

// Restart all services
async function restartAll() {
    if (!confirm('¿Está seguro de reiniciar TODOS los servicios?')) return;
    
    addLog('Reiniciando todos los servicios...', 'warning');
    
    try {
        const response = await fetch(`${API_URL}/restart/all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            addLog('Todos los servicios reiniciados exitosamente', 'success');
            addLog('Esperando 15 segundos para que los servicios se reinicien...', 'info');
            setTimeout(loadServices, 15000);
        } else {
            addLog(`Error al reiniciar servicios: ${data.message}`, 'critical');
        }
    } catch (error) {
        addLog(`Error de conexión: ${error.message}`, 'critical');
    }
}

// Update statistics
function updateStats() {
    if (systemMetrics) {
        document.getElementById('avg-response').textContent = `${systemMetrics.avgResponseTime || 1} ms`;
        document.getElementById('total-errors').textContent = systemMetrics.totalErrors || 0;
        document.getElementById('total-restarts').textContent = systemMetrics.totalRestarts || 0;
        
        // Calcular disponibilidad
        const availability = systemMetrics.totalChecks > 0 
            ? ((systemMetrics.totalChecks - systemMetrics.totalErrors) / systemMetrics.totalChecks * 100).toFixed(1)
            : 100;
        document.getElementById('availability').textContent = `${availability}%`;
    }
}

// Load system metrics
async function loadMetrics() {
    try {
        const response = await fetch(`${API_URL}/metrics`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // Actualizar gráficos con datos reales
            updateResourcesChart(data);
        }
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

// Update resources chart with real data
function updateResourcesChart(data) {
    if (!window.resourcesChart) return;
    
    // Parsear datos de disco y memoria
    const diskLine = data.disk.split('\n')[0];
    const diskUsage = parseInt(diskLine.match(/(\d+)%/)?.[1] || 0);
    
    const memLine = data.memory.split('\n')[1]; // Segunda línea tiene los datos de memoria
    const memMatch = memLine.match(/(\d+\.?\d*)Gi\s+(\d+\.?\d*)Gi/);
    const memUsed = parseFloat(memMatch?.[1] || 0);
    const memTotal = parseFloat(memMatch?.[1] || 0) + parseFloat(memMatch?.[2] || 0);
    const memUsage = Math.round((memUsed / memTotal) * 100);
    
    // Obtener CPU del uptime (load average)
    const loadMatch = data.uptime.match(/load average: ([\d.]+)/);
    const cpuUsage = Math.min(Math.round(parseFloat(loadMatch?.[1] || 0) * 100), 100);
    
    // Actualizar gráfico
    window.resourcesChart.data.datasets[0].data = [cpuUsage, memUsage, diskUsage];
    window.resourcesChart.update();
}

// Initialize charts
function initCharts() {
    // Availability Chart
    const availCtx = document.getElementById('availabilityChart').getContext('2d');
    window.availabilityChart = new Chart(availCtx, {
        type: 'doughnut',
        data: {
            labels: ['Disponible', 'No Disponible'],
            datasets: [{
                data: [100, 0],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 10,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // Resources Chart
    const resCtx = document.getElementById('resourcesChart').getContext('2d');
    window.resourcesChart = new Chart(resCtx, {
        type: 'bar',
        data: {
            labels: ['CPU', 'Memoria', 'Disco'],
            datasets: [{
                label: 'Uso %',
                data: [0, 0, 0],
                backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Response Time Chart
    const respCtx = document.getElementById('responseTimeChart').getContext('2d');
    window.responseTimeChart = new Chart(respCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tiempo de Respuesta (ms)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { 
                    labels: { color: '#fff' }
                }
            }
        }
    });

    // Incidents Chart
    const incCtx = document.getElementById('incidentsChart').getContext('2d');
    window.incidentsChart = new Chart(incCtx, {
        type: 'bar',
        data: {
            labels: ['Día -6', 'Día -5', 'Día -4', 'Día -3', 'Día -2', 'Ayer', 'Hoy'],
            datasets: [
                {
                    label: 'Errores Críticos',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Advertencias',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#f59e0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    stacked: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: { 
                    stacked: true, 
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 10,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Check system status
async function checkSystemStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            // Sistema funcionando
            const statusElement = document.querySelector('.flex.items-center.text-white');
            if (statusElement) {
                statusElement.innerHTML = `
                    <span class="material-icons text-green-400 mr-1">check_circle</span>
                    <span>Sitio web funcionando</span>
                `;
            }
        }
    } catch (error) {
        // Error de conexión
        const statusElement = document.querySelector('.flex.items-center.text-white');
        if (statusElement) {
            statusElement.innerHTML = `
                <span class="material-icons text-red-400 mr-1">error</span>
                <span>Error de conexión</span>
            `;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    updateUptime();
    initCharts();
    
    // Update every second
    setInterval(updateDateTime, 1000);
    setInterval(updateUptime, 1000);
    
    // Check services every 30 seconds
    setInterval(loadServices, 30000);
    setInterval(loadMetrics, 30000);
    setInterval(checkSystemStatus, 10000);
    
    // Initial logs
    addLog('Sistema iniciado correctamente', 'success');
    addLog('Conectando a servicios de monitoreo...', 'info');
    addLog('UMBot Emergency Dashboard v2.0.1 cargado', 'info');
    
    // Initial loads
    loadServices();
    loadMetrics();
    checkSystemStatus();
}); 