<?php
// Dynamic Servicios Handler - SSR con PHP
// Este script maneja /servicios/{id}/{slug} consultando Directus en tiempo real

header('Content-Type: text/html; charset=utf-8');
header('X-SSR-Dynamic: true');
header('X-Generated-At: ' . date('c'));

// 1. Extraer parámetros de la URL
$path = $_SERVER['REQUEST_URI'];
preg_match('/\/servicios\/(\d+)\/([^\/]+)/', $path, $matches);

if (!$matches) {
    http_response_code(404);
    echo "Servicio no encontrado";
    exit;
}

$servicioId = (int)$matches[1];
$slug = $matches[2];

echo "<!-- DYNAMIC SSR CONTENT - Generated: " . date('c') . " -->\n";

// 2. Consultar Directus dinámicamente
function consultarDirectus($id) {
    $directusUrl = 'http://umbot-directus:8055';
    $url = "$directusUrl/items/servicios?filter[id][_eq]=$id";
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 5,
            'ignore_errors' => true
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        error_log("[SSR-PHP] Error conectando con Directus: $url");
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (!$data || !isset($data['data']) || empty($data['data'])) {
        error_log("[SSR-PHP] No se encontró servicio con ID: $id");
        return null;
    }
    
    return $data['data'][0];
}

// 3. Obtener datos del servicio
$servicio = consultarDirectus($servicioId);

if (!$servicio) {
    // Fallback a datos estáticos si Directus no responde
    $serviciosEstaticos = [
        1 => ['titulo' => 'Servicios IT', 'descripcion' => 'Redes de Datos. Seguridad. Telecomunicaciones.', 'area' => 'Telecomunicaciones'],
        2 => ['titulo' => 'Redes de datos', 'descripcion' => 'Telecomunicaciones de red de datos corporativa con tecnología de avanzada', 'area' => 'Telecomunicaciones'],
        3 => ['titulo' => 'Seguridad Informática', 'descripcion' => 'Protección de sistemas y datos corporativos', 'area' => 'Seguridad'],
    ];
    
    $servicio = $serviciosEstaticos[$servicioId] ?? null;
    $isDynamic = false;
} else {
    $isDynamic = true;
}

if (!$servicio) {
    http_response_code(404);
    echo "Servicio no encontrado";
    exit;
}

// 4. Normalizar campos (compatibilidad)
$titulo = $servicio['titulo'] ?? $servicio['Titulo'] ?? 'Servicio';
$descripcion = $servicio['descripcion'] ?? $servicio['Descripcion'] ?? '';
$area = $servicio['area'] ?? $servicio['Area'] ?? 'General';
$cliente = $servicio['cliente'] ?? $servicio['Cliente'] ?? 'Empresas';
$unidad = $servicio['unidad_de_negocio'] ?? $servicio['Unidad_de_negocio'] ?? $area;

$timestamp = date('Y-m-d H:i:s T');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($titulo) ?> - Ultima Milla</title>
    <meta name="description" content="<?= htmlspecialchars($descripcion) ?>">
    
    <!-- Tailwind CSS CDN para styling rápido -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        .container { max-width: 1200px; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header/Navigation -->
    <nav class="bg-blue-900 text-white p-4">
        <div class="container mx-auto flex justify-between items-center">
            <div class="text-xl font-bold">Ultima Milla</div>
            <div class="space-x-4">
                <a href="/" class="hover:text-blue-300">Inicio</a>
                <a href="/servicios" class="hover:text-blue-300">Servicios</a>
                <a href="/contacto" class="hover:text-blue-300">Contacto</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-800 to-purple-800 text-white py-16">
        <div class="container mx-auto px-4">
            <!-- Breadcrumb -->
            <nav class="text-sm mb-4 opacity-90">
                <a href="/" class="hover:text-blue-300">Inicio</a>
                <span class="mx-2">/</span>
                <a href="/servicios" class="hover:text-blue-300">Servicios</a>
                <span class="mx-2">/</span>
                <span class="text-blue-300"><?= htmlspecialchars($titulo) ?></span>
            </nav>
            
            <div class="inline-block bg-blue-600 text-blue-100 px-3 py-1 rounded-full text-sm mb-4">
                <?= htmlspecialchars($area) ?>
            </div>
            
            <h1 class="text-4xl md:text-5xl font-bold mb-4">
                <?= htmlspecialchars($titulo) ?>
            </h1>
            
            <p class="text-xl opacity-90 max-w-2xl">
                <?= htmlspecialchars($descripcion) ?>
            </p>
        </div>
    </section>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-12">
        <!-- Status dinámico -->
        <?php if ($isDynamic): ?>
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span><strong>✅ CONTENIDO DINÁMICO SSR:</strong> Este contenido se genera en tiempo real desde Directus.</span>
            </div>
            <small class="text-sm opacity-75">Generado: <?= $timestamp ?></small>
        </div>
        <?php else: ?>
        <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span><strong>⚠️ MODO FALLBACK:</strong> Usando datos estáticos (Directus no disponible).</span>
            </div>
            <small class="text-sm opacity-75">Generado: <?= $timestamp ?></small>
        </div>
        <?php endif; ?>
        
        <!-- Información del Servicio -->
        <div class="grid md:grid-cols-2 gap-8 mb-12">
            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Información del Servicio</h2>
                
                <div class="space-y-4">
                    <div>
                        <h3 class="font-semibold text-gray-700">Área de Especialización</h3>
                        <p class="text-gray-600"><?= htmlspecialchars($area) ?></p>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold text-gray-700">Tipo de Cliente</h3>
                        <p class="text-gray-600"><?= htmlspecialchars($cliente) ?></p>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold text-gray-700">Unidad de Negocio</h3>
                        <p class="text-gray-600"><?= htmlspecialchars($unidad) ?></p>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold text-gray-700">ID del Servicio</h3>
                        <p class="text-gray-600">#<?= str_pad($servicioId, 4, '0', STR_PAD_LEFT) ?></p>
                    </div>
                </div>
            </div>

            <!-- Datos técnicos -->
            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Datos Técnicos</h2>
                
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="font-medium">Fuente de datos:</span>
                        <span class="<?= $isDynamic ? 'text-green-600' : 'text-yellow-600' ?>">
                            <?= $isDynamic ? 'Directus API' : 'Datos estáticos' ?>
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Renderizado:</span>
                        <span class="text-blue-600">Server-Side (PHP)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Timestamp:</span>
                        <span class="text-gray-600 text-sm"><?= $timestamp ?></span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Cache:</span>
                        <span class="text-red-600">No cacheado</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Call to Action -->
        <div class="text-center bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">¿Te interesa este servicio?</h2>
            <p class="text-gray-600 mb-6">Contactanos para más información y cotización personalizada</p>
            <a href="/contacto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
                Solicitar Cotización
            </a>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <h3 class="text-lg font-semibold mb-2">Ultima Milla</h3>
            <p class="text-gray-400 mb-4">Servicios de Tecnología</p>
            <div class="text-sm text-gray-500">
                <p>Página generada dinámicamente con SSR</p>
                <p><?= $isDynamic ? 'Conectado a Directus CMS' : 'Modo fallback activado' ?> • <?= $timestamp ?></p>
            </div>
        </div>
    </footer>

    <!-- Debug info (hidden) -->
    <!--
    DEBUG INFO:
    - Servicio ID: <?= $servicioId ?>
    - Slug: <?= htmlspecialchars($slug) ?>
    - Datos dinámicos: <?= $isDynamic ? 'SÍ' : 'NO' ?>
    - Timestamp: <?= $timestamp ?>
    - Request URI: <?= htmlspecialchars($_SERVER['REQUEST_URI']) ?>
    -->
</body>
</html> 