<?php
declare(strict_types=1);

/**
 * Balochistan Residential College Zhob (BRC Zhob)
 * Auto-Detecting PDO Database Connector (XAMPP Localhost & Live cPanel)
 */

// 1. Suppress raw PHP errors from leaking system paths in responses
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// 2. Harden PHP Session Cookies
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Strict');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_strict_mode', '1');
    session_start();
}

// 3. Global HTTP Security Headers
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

// 4. Auto-detect local XAMPP vs Live cPanel environment
$server_addr = $_SERVER['SERVER_ADDR'] ?? '';
$server_name = strtolower((string)($_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? 'localhost'));
$is_localhost = in_array($server_addr, ['127.0.0.1', '::1'], true)
    || in_array($server_name, ['localhost', '127.0.0.1'], true)
    || str_starts_with($server_name, 'localhost:');

if ($is_localhost) {
    // LOCAL XAMPP DEFAULTS
    $db_host = getenv('DB_HOST') ?: '127.0.0.1';
    $db_name = getenv('DB_NAME') ?: 'brc_zhob_db';
    $db_user = getenv('DB_USER') ?: 'root';
    $db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
} else {
    // LIVE CPANEL HOSTING CREDENTIALS (Update when uploading to domain)
    $db_host = getenv('DB_HOST') ?: 'localhost';
    $db_name = getenv('DB_NAME') ?: 'cpanel_prefix_brc_zhob_db';
    $db_user = getenv('DB_USER') ?: 'cpanel_prefix_db_user';
    $db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : 'YOUR_STRONG_CPANEL_DB_PASSWORD';
}

$dsn = "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok'      => false,
        'success' => false,
        'status'  => 'error',
        'error'   => 'Database connection failed. Please ensure MySQL is running in XAMPP and "brc_zhob_db" is imported.',
        'message' => 'Database connection failed. Please ensure MySQL is running in XAMPP and "brc_zhob_db" is imported.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Helper to return clean JSON responses
 */
function send_json(array $data, int $status_code = 200): void
{
    http_response_code($status_code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * XSS Output Sanitizer
 */
function brc_escape(mixed $data): string
{
    return htmlspecialchars((string)$data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Generate or Retrieve Active Session CSRF Token
 */
function brc_csrf_token(): string
{
    if (empty($_SESSION['brc_csrf_token'])) {
        $_SESSION['brc_csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['brc_csrf_token'];
}

/**
 * Verify CSRF Token
 */
function brc_verify_csrf(?string $providedToken): bool
{
    if (empty($_SESSION['brc_csrf_token']) || empty($providedToken)) {
        return false;
    }
    return hash_equals($_SESSION['brc_csrf_token'], $providedToken);
}
