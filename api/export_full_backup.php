<?php
declare(strict_types=1);

/**
 * Balochistan Residential College Zhob (BRC Zhob)
 * Endpoint: GET /api/export_full_backup.php
 * Generates and streams a complete backup ZIP archive (brc_zhob_complete_backup_[DATE].zip)
 * containing:
 *   1. database/schema.sql (Clean Zero-State MySQL Schema)
 *   2. database/live_snapshot.sql (Live SQL dump of admissions, cms_settings, gallery_items)
 *   3. admissions_database.json
 *   4. admissions_report.csv
 *   5. uploaded_bank_slips/ folder with candidate paid deposit slips renamed by tracking ID
 */

require_once __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query('SELECT * FROM admissions ORDER BY id DESC');
    $admissions = $stmt->fetchAll();
} catch (Throwable $e) {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'Failed to query admissions table for backup.',
    ], 500);
}

if (!class_exists('ZipArchive')) {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'PHP ZipArchive extension is not enabled in php.ini.',
    ], 500);
}

$dateStamp = date('Y-m-d');
$zipFilename = "brc_zhob_complete_backup_{$dateStamp}.zip";
$tempZipPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . uniqid('brc_backup_', true) . '.zip';

$zip = new ZipArchive();
if ($zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'Unable to create temporary ZIP archive.',
    ], 500);
}

// 1. Add zero-state database/schema.sql and live_snapshot.sql
$schemaFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql';
$baseSchemaSql = is_file($schemaFile) ? (string)file_get_contents($schemaFile) : '';
if ($baseSchemaSql !== '') {
    $zip->addFromString('database/schema.sql', $baseSchemaSql);
}

$liveSqlLines = [
    $baseSchemaSql,
    '',
    '-- ============================================================================',
    '-- LIVE SNAPSHOT DATA EXPORT (Generated: ' . date('c') . ')',
    '-- ============================================================================',
];
foreach ($admissions as $a) {
    $vals = array_map(static function ($v) use ($pdo): string {
        return $v === null ? 'NULL' : $pdo->quote((string)$v);
    }, $a);
    $cols = array_map(static fn($k) => "`{$k}`", array_keys($a));
    $liveSqlLines[] = 'INSERT INTO `admissions` (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $vals) . ');';
}
$zip->addFromString('database/live_snapshot.sql', implode("\n", $liveSqlLines));

// 2. Add admissions_database.json
$zip->addFromString(
    'admissions_database.json',
    json_encode($admissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

// 3. Build admissions_report.csv
$csvHandle = fopen('php://temp', 'r+');
fputcsv($csvHandle, [
    'Tracking ID',
    'Candidate Name',
    'Father Name',
    'Gender',
    'Class',
    'Quota',
    'Phone',
    'Percentage',
    'Challan No',
    'Payment Status',
    'Kit No',
]);

$uploadsDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'slips';
$zip->addEmptyDir('uploaded_bank_slips');

foreach ($admissions as $row) {
    $trackingId    = (string)($row['tracking_id'] ?? ('BRC-ADM-2026-' . ($row['id'] ?? '0001')));
    $candidateName = (string)($row['candidate_name'] ?? '');
    $fatherName    = (string)($row['father_name'] ?? '');
    $gender        = (string)($row['gender'] ?? 'Male');
    $classApplying = (string)($row['class_applied'] ?? '');
    $quota         = (string)($row['quota_district'] ?? '');
    $phone         = (string)($row['phone'] ?? '');
    $percentage    = (string)($row['previous_marks_percentage'] ?? '');
    $challanNo     = (string)($row['challan_no'] ?? 'NBP-2026');
    $paymentStatus = (string)($row['payment_status'] ?? 'PENDING_VERIFICATION');
    $kitNo         = (string)($row['assigned_kit_no'] ?? 'UNASSIGNED');

    fputcsv($csvHandle, [
        $trackingId,
        $candidateName,
        $fatherName,
        $gender,
        $classApplying,
        $quota,
        $phone,
        $percentage,
        $challanNo,
        $paymentStatus,
        $kitNo,
    ]);

    // 4. Add candidate deposit slip file from uploads/slips/
    $slipFile = (string)($row['slip_file'] ?? '');
    if ($slipFile !== '') {
        $candidateSlipPath = $uploadsDir . DIRECTORY_SEPARATOR . basename($slipFile);
        if (is_file($candidateSlipPath) && is_readable($candidateSlipPath)) {
            $ext = pathinfo($candidateSlipPath, PATHINFO_EXTENSION) ?: 'jpg';
            $safeTrack = preg_replace('/[^A-Za-z0-9_-]/', '_', $trackingId);
            $zip->addFile($candidateSlipPath, "uploaded_bank_slips/slip_{$safeTrack}.{$ext}");
        }
    }
}

rewind($csvHandle);
$csvContents = stream_get_contents($csvHandle) ?: '';
fclose($csvHandle);

$zip->addFromString('admissions_report.csv', $csvContents);
$zip->close();

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $zipFilename . '"');
header('Content-Length: ' . filesize($tempZipPath));
header('Pragma: no-cache');
header('Expires: 0');

readfile($tempZipPath);
@unlink($tempZipPath);
exit;
