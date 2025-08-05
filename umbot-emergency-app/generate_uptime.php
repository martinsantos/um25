<?php
/**
 * UMBot Emergency Dashboard - Generador de Uptime
 * Endpoint para obtener información de uptime del sistema
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function getSystemUptime() {
    // En sistemas Unix/Linux
    if (function_exists('shell_exec')) {
        $uptime = shell_exec('uptime -p 2>/dev/null');
        if ($uptime) {
            return trim($uptime);
        }
    }
    
    // Fallback: calcular desde el tiempo de inicio del script
    $startTime = filemtime(__FILE__);
    $uptimeSeconds = time() - $startTime;
    
    $days = floor($uptimeSeconds / 86400);
    $hours = floor(($uptimeSeconds % 86400) / 3600);
    $minutes = floor(($uptimeSeconds % 3600) / 60);
    $seconds = $uptimeSeconds % 60;
    
    $parts = [];
    if ($days > 0) $parts[] = $days . 'd';
    if ($hours > 0) $parts[] = $hours . 'h';
    if ($minutes > 0) $parts[] = $minutes . 'm';
    if ($seconds > 0) $parts[] = $seconds . 's';
    
    return implode(' ', $parts);
}

function formatUptime($uptimeString) {
    // Convertir "up 2 days, 3 hours, 45 minutes" a formato legible
    $uptimeString = str_replace(['up ', ' days', ' day', ' hours', ' hour', ' minutes', ' minute'], 
                               ['', 'd', 'd', 'h', 'h', 'm', 'm'], $uptimeString);
    return $uptimeString;
}

try {
    $uptime = getSystemUptime();
    $uptimeFormatted = formatUptime($uptime);
    
    // Calcular días, horas, minutos para estadísticas
    $uptimeParts = explode(' ', $uptimeFormatted);
    $days = 0;
    $hours = 0;
    $minutes = 0;
    
    foreach ($uptimeParts as $part) {
        if (strpos($part, 'd') !== false) {
            $days = intval($part);
        } elseif (strpos($part, 'h') !== false) {
            $hours = intval($part);
        } elseif (strpos($part, 'm') !== false) {
            $minutes = intval($part);
        }
    }
    
    echo json_encode([
        'success' => true,
        'uptime' => $uptime,
        'uptime_formatted' => $uptimeFormatted,
        'days' => $days,
        'hours' => $hours,
        'minutes' => $minutes,
        'timestamp' => time(),
        'server_time' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'uptime_formatted' => 'Error al obtener uptime',
        'days' => 0,
        'hours' => 0,
        'minutes' => 0
    ]);
}
?> 