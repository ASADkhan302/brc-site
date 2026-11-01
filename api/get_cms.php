<?php
declare(strict_types=1);

/**
 * Balochistan Residential College Zhob (BRC Zhob)
 * Endpoint: GET /api/get_cms.php
 * Queries live CMS settings (cms_settings) and Campus Gallery items (gallery_items).
 */

require_once __DIR__ . '/../config/db.php';

try {
    // 1. Fetch key-value settings from cms_settings
    $settingsStmt = $pdo->query('SELECT setting_key, setting_value FROM cms_settings');
    $settingsRows = $settingsStmt->fetchAll();

    $settings = [];
    foreach ($settingsRows as $r) {
        $settings[(string)$r['setting_key']] = (string)$r['setting_value'];
    }

    // 2. Fetch Campus Gallery items from gallery_items
    $galleryStmt = $pdo->query('SELECT id, title, category, image_path, is_featured, created_at FROM gallery_items ORDER BY id DESC');
    $galleryRows = $galleryStmt->fetchAll();

    $gallery = [];
    foreach ($galleryRows as $g) {
        $gallery[] = [
            'id'         => (string)$g['id'],
            'title'      => brc_escape($g['title']),
            'category'   => brc_escape($g['category']),
            'url'        => brc_escape($g['image_path']),
            'image_path' => brc_escape($g['image_path']),
            'isFeatured' => ((int)$g['is_featured']) === 1,
            'created_at' => (string)$g['created_at'],
        ];
    }

    send_json([
        'ok'       => true,
        'status'   => 'success',
        'settings' => $settings,
        'gallery'  => $gallery,
    ]);
} catch (Throwable $e) {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'Failed to load CMS settings and gallery items.',
    ], 500);
}
