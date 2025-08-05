// Script de prueba para generar logs de ejemplo
// Para usar en el dashboard de UMBot Emergency

// Función para agregar logs de prueba
function generateTestLogs() {
    const testMessages = [
        { type: 'system', message: 'Sistema iniciado correctamente' },
        { type: 'info', message: 'Verificación de servicios completada' },
        { type: 'success', message: 'Conexión a base de datos establecida' },
        { type: 'warning', message: 'Uso de memoria por encima del 80%' },
        { type: 'error', message: 'Fallo en la conexión con servicio externo' },
        { type: 'command', message: 'Ejecutando comando: docker ps' },
        { type: 'service', message: 'Nginx reiniciado correctamente' },
        { type: 'info', message: 'Backup programado ejecutado' },
        { type: 'success', message: 'Certificados SSL renovados' },
        { type: 'warning', message: 'Disco con 85% de uso' },
        { type: 'error', message: 'Timeout en respuesta de API' },
        { type: 'system', message: 'Actualización de configuración aplicada' },
        { type: 'command', message: 'Ejecutando: systemctl status nginx' },
        { type: 'service', message: 'PostgreSQL: health check OK' },
        { type: 'info', message: 'Logs rotados automáticamente' }
    ];

    // Generar logs con timestamps aleatorios de las últimas 24 horas
    testMessages.forEach((log, index) => {
        setTimeout(() => {
            logMessage(log.type, log.message);
        }, index * 500); // Esperar 500ms entre cada log
    });
}

// Función para simular actividad del sistema
function simulateSystemActivity() {
    const activities = [
        { type: 'info', message: 'Verificación automática de servicios' },
        { type: 'success', message: 'Backup de base de datos completado' },
        { type: 'warning', message: 'Conexiones concurrentes: 245/300' },
        { type: 'service', message: 'Grafana: métricas actualizadas' },
        { type: 'system', message: 'Limpieza de logs antiguos ejecutada' }
    ];

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    logMessage(randomActivity.type, randomActivity.message);
}

// Función para probar filtros
function testLogFilters() {
    console.log('Probando sistema de filtros de logs...');
    
    // Generar logs de diferentes tipos
    logMessage('error', 'Log de prueba: Error simulado');
    logMessage('warning', 'Log de prueba: Advertencia simulada');
    logMessage('success', 'Log de prueba: Operación exitosa');
    logMessage('info', 'Log de prueba: Información general');
    logMessage('system', 'Log de prueba: Evento del sistema');
    logMessage('command', 'Log de prueba: Comando ejecutado');
    logMessage('service', 'Log de prueba: Estado del servicio');
}

// Función para probar búsqueda
function testLogSearch() {
    console.log('Probando sistema de búsqueda...');
    
    logMessage('info', 'Búsqueda de ejemplo: archivo configuración');
    logMessage('success', 'Búsqueda de ejemplo: proceso completado');
    logMessage('error', 'Búsqueda de ejemplo: archivo no encontrado');
    logMessage('warning', 'Búsqueda de ejemplo: configuración obsoleta');
}

// Auto-ejecutar al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de prueba de logs cargado');
    
    // Generar logs iniciales después de 2 segundos
    setTimeout(generateTestLogs, 2000);
    
    // Simular actividad cada 10 segundos
    setInterval(simulateSystemActivity, 10000);
});

// Exportar funciones para uso manual
window.testLogs = {
    generate: generateTestLogs,
    simulate: simulateSystemActivity,
    testFilters: testLogFilters,
    testSearch: testLogSearch
}; 