<?php
/**
 * UMBot Emergency Dashboard - Sistema de Logs API v3.1
 * Backend PHP para gestión completa de logs con persistencia
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class LogManager {
    private $logsFile;
    private $maxLogs;
    private $logTypes = ['system', 'info', 'warning', 'error', 'success', 'command', 'service'];
    
    public function __construct() {
        $this->logsFile = '/var/www/emergency/logs/dashboard_logs.json';
        $this->maxLogs = 1000; // Máximo 1000 logs
        $this->ensureLogDirectory();
    }
    
    private function ensureLogDirectory() {
        $dir = dirname($this->logsFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        if (!file_exists($this->logsFile)) {
            file_put_contents($this->logsFile, json_encode([]));
        }
    }
    
    private function loadLogs() {
        $content = file_get_contents($this->logsFile);
        return json_decode($content, true) ?: [];
    }
    
    private function saveLogs($logs) {
        // Limitar cantidad de logs
        if (count($logs) > $this->maxLogs) {
            $logs = array_slice($logs, -$this->maxLogs);
        }
        
        return file_put_contents($this->logsFile, json_encode($logs, JSON_PRETTY_PRINT));
    }
    
    public function addLog($type, $message, $source = 'dashboard', $data = null) {
        $logs = $this->loadLogs();
        
        $logEntry = [
            'id' => uniqid('log_', true),
            'timestamp' => time(),
            'datetime' => date('Y-m-d H:i:s'),
            'type' => in_array($type, $this->logTypes) ? $type : 'info',
            'message' => trim($message),
            'source' => $source,
            'data' => $data,
            'read' => false
        ];
        
        $logs[] = $logEntry;
        $this->saveLogs($logs);
        
        return $logEntry;
    }
    
    public function getLogs($filters = []) {
        $logs = $this->loadLogs();
        
        // Filtros disponibles
        if (!empty($filters['type']) && in_array($filters['type'], $this->logTypes)) {
            $logs = array_filter($logs, function($log) use ($filters) {
                return $log['type'] === $filters['type'];
            });
        }
        
        if (!empty($filters['search'])) {
            $search = strtolower($filters['search']);
            $logs = array_filter($logs, function($log) use ($search) {
                return strpos(strtolower($log['message']), $search) !== false;
            });
        }
        
        if (!empty($filters['since'])) {
            $since = strtotime($filters['since']);
            $logs = array_filter($logs, function($log) use ($since) {
                return $log['timestamp'] >= $since;
            });
        }
        
        if (!empty($filters['limit'])) {
            $logs = array_slice($logs, -intval($filters['limit']));
        }
        
        // Ordenar por timestamp descendente (más recientes primero)
        usort($logs, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
        
        return $logs;
    }
    
    public function markAsRead($logIds = []) {
        $logs = $this->loadLogs();
        $updated = 0;
        
        foreach ($logs as &$log) {
            if (empty($logIds) || in_array($log['id'], $logIds)) {
                if (!$log['read']) {
                    $log['read'] = true;
                    $updated++;
                }
            }
        }
        
        if ($updated > 0) {
            $this->saveLogs($logs);
        }
        
        return $updated;
    }
    
    public function clearLogs($olderThanDays = null) {
        if ($olderThanDays !== null) {
            $cutoff = time() - ($olderThanDays * 24 * 60 * 60);
            $logs = $this->loadLogs();
            $logs = array_filter($logs, function($log) use ($cutoff) {
                return $log['timestamp'] >= $cutoff;
            });
            $this->saveLogs($logs);
            return count($this->loadLogs());
        } else {
            $this->saveLogs([]);
            return 0;
        }
    }
    
    public function getStats() {
        $logs = $this->loadLogs();
        $stats = [
            'total' => count($logs),
            'unread' => 0,
            'types' => [],
            'last24h' => 0,
            'lastWeek' => 0
        ];
        
        $now = time();
        $day = 24 * 60 * 60;
        $week = 7 * $day;
        
        foreach ($logs as $log) {
            if (!$log['read']) {
                $stats['unread']++;
            }
            
            $stats['types'][$log['type']] = ($stats['types'][$log['type']] ?? 0) + 1;
            
            if ($log['timestamp'] >= ($now - $day)) {
                $stats['last24h']++;
            }
            
            if ($log['timestamp'] >= ($now - $week)) {
                $stats['lastWeek']++;
            }
        }
        
        return $stats;
    }
}

// Manejo de peticiones
$logManager = new LogManager();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($path === '/stats') {
                echo json_encode([
                    'success' => true,
                    'data' => $logManager->getStats()
                ]);
            } else {
                $filters = [
                    'type' => $_GET['type'] ?? null,
                    'search' => $_GET['search'] ?? null,
                    'since' => $_GET['since'] ?? null,
                    'limit' => $_GET['limit'] ?? 100
                ];
                
                echo json_encode([
                    'success' => true,
                    'data' => $logManager->getLogs($filters),
                    'filters' => $filters
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if ($path === '/add') {
                if (empty($input['message'])) {
                    throw new Exception('Message is required');
                }
                
                $log = $logManager->addLog(
                    $input['type'] ?? 'info',
                    $input['message'],
                    $input['source'] ?? 'api',
                    $input['data'] ?? null
                );
                
                echo json_encode([
                    'success' => true,
                    'data' => $log
                ]);
            } elseif ($path === '/mark-read') {
                $updated = $logManager->markAsRead($input['log_ids'] ?? []);
                
                echo json_encode([
                    'success' => true,
                    'updated' => $updated
                ]);
            } else {
                throw new Exception('Invalid endpoint');
            }
            break;
            
        case 'DELETE':
            if ($path === '/clear') {
                $olderThanDays = $_GET['older_than_days'] ?? null;
                $remaining = $logManager->clearLogs($olderThanDays);
                
                echo json_encode([
                    'success' => true,
                    'remaining' => $remaining
                ]);
            } else {
                throw new Exception('Invalid endpoint');
            }
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 