<?php

declare(strict_types=1);

$htmlFile = __DIR__ . '/index.html';
if (! is_file($htmlFile)) {
    http_response_code(500);
    exit('Falta index.html');
}

$html = (string) file_get_contents($htmlFile);
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (preg_match('#/c/([a-z0-9-]+)(?:/p/(\d+))?#', $path, $match) === 1) {
    $api = getenv('BELLY_API_URL') ?: 'http://belly-api.test';
    $url = rtrim($api, '/') . '/v1/publico/catalogo/' . rawurlencode($match[1]) . '/seo';
    if (! empty($match[2])) {
        $url .= '?producto=' . $match[2];
    }
    $contexto = stream_context_create([
        'http' => [
            'timeout' => 3,
            'ignore_errors' => true,
            'header' => "Accept: application/json\r\n",
        ],
    ]);
    $crudo = @file_get_contents($url, false, $contexto);
    $json = is_string($crudo) ? json_decode($crudo, true) : null;
    $data = is_array($json['data'] ?? null) ? $json['data'] : null;
    if (is_array($data) && ($data['titulo'] ?? '') !== '') {
        $html = inyectarSeoTienda($html, $data);
    }
}

header('Content-Type: text/html; charset=UTF-8');
echo $html;

/** @param array<string, mixed> $tarjeta */
function inyectarSeoTienda(string $html, array $tarjeta): string
{
    $e = static fn (mixed $valor): string => htmlspecialchars((string) $valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $titulo = $e($tarjeta['titulo'] ?? '');
    $descripcion = $e($tarjeta['descripcion'] ?? '');
    $imagen = $e($tarjeta['imagen_url'] ?? '');
    $logo = $e($tarjeta['logo_url'] ?? '');
    $url = $e($tarjeta['url'] ?? '');
    $color = $e($tarjeta['color'] ?? '#0B1026');
    $metas = '<title>' . $titulo . '</title>'
        . '<meta name="description" content="' . $descripcion . '">'
        . '<meta name="theme-color" content="' . $color . '">'
        . ($logo !== '' ? '<link rel="icon" href="' . $logo . '"><link rel="apple-touch-icon" href="' . $logo . '">' : '')
        . '<meta property="og:type" content="website">'
        . '<meta property="og:title" content="' . $titulo . '">'
        . '<meta property="og:description" content="' . $descripcion . '">'
        . ($imagen !== '' ? '<meta property="og:image" content="' . $imagen . '">' : '')
        . ($url !== '' ? '<meta property="og:url" content="' . $url . '">' : '')
        . '<meta name="twitter:card" content="summary_large_image">'
        . '<meta name="twitter:title" content="' . $titulo . '">'
        . '<meta name="twitter:description" content="' . $descripcion . '">'
        . ($imagen !== '' ? '<meta name="twitter:image" content="' . $imagen . '">' : '');

    $html = preg_replace('/<title>[\s\S]*?<\/title>/', '', $html) ?? $html;
    $html = preg_replace('/<link rel="icon"[^>]*>/', '', $html) ?? $html;
    $html = preg_replace('/<link rel="apple-touch-icon"[^>]*>/', '', $html) ?? $html;

    return str_replace('</head>', $metas . '</head>', $html);
}
