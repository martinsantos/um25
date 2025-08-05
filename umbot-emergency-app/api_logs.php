<?php
/**
 * UMBot Emergency Dashboard - API de Logs
 * Endpoint para gestión de logs del dashboard
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
    
    public function __construct() {
        $this->logsFile = __DIR__ . '/logs/dashboard_logs.json';
        $this->maxLogs = 1000;
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
        if (count($logs) > $this->maxLogs) {
            $logs = array_slice($logs, -$this->maxLogs);
        }
        return file_put_contents($this->logsFile, json_encode($logs, JSON_PRETTY_PRINT));
    }
    
    public function addLog($type, $message, $source = 'dashboard') {
        $logs = $this->loadLogs();
        
        $logEntry = [
            'id' => uniqid('log_', true),
            'timestamp' => time(),
            'datetime' => date('Y-m-d H:i:s'),
            'type' => $type,
            'message' => trim($message),
            'source' => $source,
            'read' => false
        ];
        
        $logs[] = $logEntry;
        $this->saveLogs($logs);
        
        return $logEntry;
    }
    
    public function getLogs($limit = 50) {
        $logs = $this->loadLogs();
        
        // Ordenar por timestamp descendente
        usort($logs, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
        
        return array_slice($logs, 0, $limit);
    }
    
    public function markAsRead($logIds) {
        $logs = $this->loadLogs();
        $updated = 0;
        
        foreach ($logs as &$log) {
            if (in_array($log['id'], $logIds)) {
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
    
    public function clearLogs() {
        $this->saveLogs([]);
        return 0;
    }
}

$logManager = new LogManager();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            echo json_encode([
                'success' => true,
                'data' => $logManager->getLogs($limit)
            ]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($_GET['action']) && $_GET['action'] === 'add') {
                if (empty($input['message'])) {
                    throw new Exception('Message is required');
                }
                
                $log = $logManager->addLog(
                    $input['type'] ?? 'info',
                    $input['message'],
                    $input['source'] ?? 'api'
                );
                
                echo json_encode([
                    'success' => true,
                    'data' => $log
                ]);
            } elseif (isset($_GET['action']) && $_GET['action'] === 'mark-read') {
                $updated = $logManager->markAsRead($input['log_ids'] ?? []);
                
                echo json_encode([
                    'success' => true,
                    'updated' => $updated
                ]);
            } else {
                throw new Exception('Invalid action');
            }
            break;
            
        case 'DELETE':
            if (isset($_GET['action']) && $_GET['action'] === 'clear') {
                $remaining = $logManager->clearLogs();
                
                echo json_encode([
                    'success' => true,
                    'remaining' => $remaining
                ]);
            } else {
                throw new Exception('Invalid action');
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