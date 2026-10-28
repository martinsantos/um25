<?php
// Only for the disposable PHP 7.4 / SQLite CI fixture. No production credentials.
function getChecked($path, $kind) {
    $body = file_get_contents('http://127.0.0.1:8080' . $path, false,
        stream_context_create(['http' => ['ignore_errors' => true]]));
    $headers = implode("\n", $http_response_header);
    if (strpos($headers, '200 OK') === false || $body === false) {
        throw new Exception('Fixture request failed: ' . $kind . ' ' . substr(strip_tags($body), 0, 2500));
    }
    $checks = [
        'scripts' => stripos($headers, 'javascript') !== false && strpos($body, 'mw.loader') !== false,
        'styles' => stripos($headers, 'text/css') !== false && strpos($body, '.mw-body') !== false && strpos($body, '#column-one') !== false,
        'page' => strpos($body, 'RESOURCELOADER_FIXTURE_CONTENT') !== false,
        'login' => strpos($body, 'wpName') !== false && strpos($body, 'wpPassword') !== false,
    ];
    if (!$checks[$kind] || preg_match('/Fatal error|Warning:|Exception caught|Internal Server Error/i', $body)) {
        throw new Exception('Fixture semantic check failed: ' . $kind);
    }
    echo $kind . ' verified, bytes=' . strlen($body) . "\n";
    return $body;
}
if (PHP_MAJOR_VERSION !== 7 || PHP_MINOR_VERSION !== 4) {
    throw new Exception('Fixture must use PHP 7.4');
}
$before = hash_file('sha256', '/tmp/wiki-db/wiki.sqlite');
$js = getChecked('/load.php?debug=false&lang=es&modules=startup&only=scripts&skin=monobook', 'scripts');
$modules = getChecked('/load.php?debug=false&lang=es&modules=jquery%7Cmediawiki&only=scripts&skin=monobook', 'scripts');
$css = getChecked('/load.php?debug=false&lang=es&modules=skins.monobook.styles&only=styles&skin=monobook', 'styles');
if ($js === $css) { throw new Exception('ResourceLoader ignored module type'); }
if (is_dir('/results')) {
    file_put_contents('/results/startup.js', $js);
    file_put_contents('/results/modules.js', $modules);
}
getChecked('/index.php?title=Fixture', 'page');
getChecked('/index.php?title=Especial:Entrar', 'login');
if ($before !== hash_file('sha256', '/tmp/wiki-db/wiki.sqlite')) {
    throw new Exception('Read-only fixture database changed during GET checks');
}
