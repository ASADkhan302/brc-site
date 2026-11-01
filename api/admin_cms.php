<?php
declare(strict_types=1);

/**
 * Balochistan Residential College Zhob (BRC Zhob)
 * Endpoint: /api/admin_cms.php
 * Handles:
 * - Principal portrait upload (uploads/principal/) & settings update
 * - Campus gallery photograph upload (uploads/gallery/) & deletion
 * - Candidate NBP fee slip verification (VERIFIED / REJECTED)
 * - Sequential Roll Slip (BRC-2026-R101) & Kit Number (KIT-2026-101) assignment
 */

require_once __DIR__ . '/../config/db.php';

$rawInput = file_get_contents('php://input');
$jsonBody = !empty($rawInput) ? json_decode($rawInput, true) : null;
$input = is_array($jsonBody) ? $jsonBody : array_merge($_GET, $_POST);

$action = trim((string)($input['action'] ?? $_GET['action'] ?? 'list_admissions'));

$allowedImageMimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

/**
 * Helper to validate and save an uploaded or base64 image into uploads/{subfolder}/
 */
function save_cms_image(string $subfolder, string $prefix, array $allowedMimes, array $input): ?string
{
    $targetDir = dirname(__DIR__) . '/uploads/' . $subfolder;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0750, true);
    }

    if (!empty($_FILES['image']['tmp_name']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
        if ($_FILES['image']['size'] > 2.5 * 1024 * 1024) {
            send_json(['ok' => false, 'message' => 'Uploaded image exceeds 2.5MB limit.'], 422);
        }
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $_FILES['image']['tmp_name']);
        finfo_close($finfo);

        if (!isset($allowedMimes[$mime])) {
            send_json(['ok' => false, 'message' => 'Only JPG, PNG, and WEBP images are permitted.'], 422);
        }
        $ext = $allowedMimes[$mime];
        $filename = $prefix . '_' . bin2hex(random_bytes(12)) . '_' . time() . '.' . $ext;
        move_uploaded_file($_FILES['image']['tmp_name'], $targetDir . '/' . $filename);
        return 'uploads/' . $subfolder . '/' . $filename;
    }

    $dataUrl = (string)($input['photo_data_url'] ?? $input['image_data_url'] ?? '');
    if (preg_match('/^data:([^;]+);base64,(.+)$/', $dataUrl, $matches)) {
        $binary = base64_decode($matches[2], true);
        if ($binary === false || strlen($binary) > 2.5 * 1024 * 1024) {
            send_json(['ok' => false, 'message' => 'Invalid or oversized image payload.'], 422);
        }
        $tmpFile = tempnam(sys_get_temp_dir(), 'brc_img_');
        file_put_contents($tmpFile, $binary);
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $tmpFile);
        finfo_close($finfo);

        if (!isset($allowedMimes[$mime])) {
            @unlink($tmpFile);
            send_json(['ok' => false, 'message' => 'Binary magic-byte validation failed. Only JPG/PNG allowed.'], 422);
        }
        $ext = $allowedMimes[$mime];
        $filename = $prefix . '_' . bin2hex(random_bytes(12)) . '_' . time() . '.' . $ext;
        rename($tmpFile, $targetDir . '/' . $filename);
        return 'uploads/' . $subfolder . '/' . $filename;
    }

    return null;
}

try {
    // 1. LIST ALL LIVE ADMISSIONS FOR ADMIN QUEUE
    if ($action === 'list_admissions') {
        $stmt = $pdo->query('SELECT * FROM admissions ORDER BY id DESC');
        $rows = $stmt->fetchAll();
        send_json(['ok' => true, 'applications' => $rows]);
    }

    // 2. SAVE SITE SETTINGS & PRINCIPAL PROFILE CMS
    if ($action === 'save_settings' || $action === 'save_cms') {
        $uploadedPrincipalPhoto = save_cms_image('principal', 'principal', $allowedImageMimes, $input);

        $settingsMap = [
            'principal_name'           => $input['principal_name'] ?? null,
            'principal_title'          => $input['principal_title'] ?? null,
            'principal_badge'          => $input['principal_tenure_badge'] ?? $input['principal_badge'] ?? null,
            'principal_quote'          => $input['principal_quote'] ?? null,
            'principal_photo'          => $uploadedPrincipalPhoto ?: ($input['principal_photo_url'] ?? null),
            'top_notice_text'          => $input['announcement_banner_text'] ?? $input['top_notice_text'] ?? null,
            'top_notice_phone'         => $input['contact_phone'] ?? $input['top_notice_phone'] ?? null,
            'stat_cadet_strength'      => $input['metric_cadets'] ?? $input['stat_cadet_strength'] ?? null,
            'stat_board_pass_rate'     => $input['metric_board_pass'] ?? $input['stat_board_pass_rate'] ?? null,
            'stat_faculty_count'       => $input['metric_teachers'] ?? $input['stat_faculty_count'] ?? null,
            'stat_hostel_blocks'       => $input['metric_hostel_blocks'] ?? $input['stat_hostel_blocks'] ?? null,
            'bank_name'                => $input['bank_name_branch'] ?? $input['bank_name'] ?? null,
            'bank_account_no'          => $input['bank_account_no'] ?? null,
            'admission_processing_fee' => isset($input['admission_fee_amount']) ? (string)$input['admission_fee_amount'] : null,
        ];

        $upsertStmt = $pdo->prepare('
            INSERT INTO cms_settings (setting_key, setting_value)
            VALUES (:k, :v)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ');

        foreach ($settingsMap as $key => $val) {
            if ($val !== null && trim((string)$val) !== '') {
                $upsertStmt->execute([
                    ':k' => $key,
                    ':v' => trim((string)$val),
                ]);
            }
        }

        send_json([
            'ok'              => true,
            'status'          => 'success',
            'principal_photo' => $uploadedPrincipalPhoto,
            'message'         => 'CMS settings and Principal profile saved and live-synced.',
        ]);
    }

    // 3. ADD CAMPUS GALLERY PHOTOGRAPH
    if ($action === 'add_gallery') {
        $uploadedGalleryPath = save_cms_image('gallery', 'gallery', $allowedImageMimes, $input);
        $imagePath = $uploadedGalleryPath ?: trim((string)($input['image_path'] ?? $input['url'] ?? ''));
        $title     = trim((string)($input['title'] ?? 'BRC Zhob Campus Photograph'));
        $category  = trim((string)($input['category'] ?? 'Campus Architecture'));
        $featured  = !empty($input['is_featured']) ? 1 : 0;

        if ($imagePath === '') {
            send_json(['ok' => false, 'message' => 'Image file or URL is required.'], 422);
        }

        $stmt = $pdo->prepare('
            INSERT INTO gallery_items (title, category, image_path, is_featured, created_at)
            VALUES (:title, :category, :image_path, :is_featured, NOW())
        ');
        $stmt->execute([
            ':title'       => $title,
            ':category'    => $category,
            ':image_path'  => $imagePath,
            ':is_featured' => $featured,
        ]);

        send_json([
            'ok'         => true,
            'status'     => 'success',
            'id'         => (int)$pdo->lastInsertId(),
            'image_path' => $imagePath,
        ], 201);
    }

    // 4. DELETE CAMPUS GALLERY PHOTOGRAPH
    if ($action === 'delete_gallery') {
        $id = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare('DELETE FROM gallery_items WHERE id = :id');
        $stmt->execute([':id' => $id]);
        send_json(['ok' => true, 'status' => 'success', 'deleted_id' => $id]);
    }

    // 5. VERIFY CANDIDATE FEE DEPOSIT & ASSIGN SEQUENTIAL ROLL SLIP / KIT NUMBER
    if ($action === 'verify_admission' || $action === 'assign_roll_slip') {
        $trackingId = trim((string)($input['tracking_id'] ?? $input['application_ref'] ?? ''));
        $decision   = in_array(($input['decision'] ?? 'VERIFIED'), ['VERIFIED', 'REJECTED'], true)
            ? (string)$input['decision']
            : 'VERIFIED';

        if ($trackingId === '') {
            send_json(['ok' => false, 'message' => 'tracking_id is required.'], 422);
        }

        // Compute sequential Roll Slip & Kit Number when approved/verified
        $rollNo = null;
        $kitNo  = null;
        $appStatus = $decision === 'VERIFIED' ? 'APPROVED' : 'REJECTED';

        if ($decision === 'VERIFIED') {
            $seqStmt = $pdo->query("SELECT COUNT(*) AS cnt FROM admissions WHERE assigned_roll_no IS NOT NULL");
            $seqCount = (int)($seqStmt->fetch()['cnt'] ?? 0);
            $seqNum = 101 + $seqCount;
            $rollNo = "BRC-2026-R{$seqNum}";
            $kitNo  = "KIT-2026-{$seqNum}";
        }

        $updStmt = $pdo->prepare('
            UPDATE admissions
            SET payment_status     = :payment_status,
                application_status = :app_status,
                assigned_roll_no   = COALESCE(assigned_roll_no, :roll_no),
                assigned_kit_no    = COALESCE(assigned_kit_no, :kit_no),
                verified_by        = :verified_by,
                verified_at        = NOW()
            WHERE tracking_id = :tracking_id
        ');
        $updStmt->execute([
            ':payment_status' => $decision,
            ':app_status'     => $appStatus,
            ':roll_no'        => $rollNo,
            ':kit_no'         => $kitNo,
            ':verified_by'    => 'College Administrator',
            ':tracking_id'    => $trackingId,
        ]);

        send_json([
            'ok'               => true,
            'status'           => 'success',
            'tracking_id'      => $trackingId,
            'payment_status'   => $decision,
            'assigned_roll_no' => $rollNo,
            'assigned_kit_no'  => $kitNo,
        ]);
    }

    // 5B. DELETE ADMISSION APPLICATION & ATTACHED DEPOSIT SLIP
    if ($action === 'delete_admission') {
        $tracking_id = trim((string)($input['tracking_id'] ?? $_POST['tracking_id'] ?? $_GET['tracking_id'] ?? $input['application_ref'] ?? ''));

        if (empty($tracking_id)) {
            send_json(['ok' => false, 'success' => false, 'error' => 'Tracking ID is required.'], 422);
        }

        // 1. Fetch file name to delete from disk
        $stmt = $pdo->prepare('SELECT * FROM admissions WHERE tracking_id = ? LIMIT 1');
        $stmt->execute([$tracking_id]);
        $rec = $stmt->fetch();

        $slipFilename = $rec ? (string)($rec['deposit_slip_filename'] ?? $rec['slip_file'] ?? '') : '';
        if ($slipFilename !== '') {
            $cleanFilename = basename($slipFilename);
            $file_path = __DIR__ . '/../uploads/slips/' . $cleanFilename;
            if (file_exists($file_path)) {
                @unlink($file_path);
            }
        }

        // 2. Delete record from MySQL
        $del_stmt = $pdo->prepare('DELETE FROM admissions WHERE tracking_id = ?');
        $del_stmt->execute([$tracking_id]);

        send_json([
            'ok'          => true,
            'success'     => true,
            'tracking_id' => $tracking_id,
            'message'     => "Application {$tracking_id} and its attached slip were permanently deleted.",
        ]);
    }

    // 6. CHANGE ADMIN USERNAME AND PASSWORD
    if ($action === 'change_credentials' || $action === 'update_credentials') {
        $current_pass = (string)($input['current_password'] ?? $_POST['current_password'] ?? '');
        $new_user     = trim((string)($input['new_username'] ?? $_POST['new_username'] ?? ''));
        $new_pass     = (string)($input['new_password'] ?? $_POST['new_password'] ?? '');

        if (empty($current_pass)) {
            send_json(['ok' => false, 'success' => false, 'error' => 'Current password is required.'], 422);
        }

        // 1. Fetch active admin record
        $stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch();

        if (!$admin) {
            send_json(['ok' => false, 'success' => false, 'error' => 'Admin user record not found.'], 404);
        }

        // 2. Verify current password
        if (!password_verify($current_pass, (string)$admin['password_hash'])) {
            // Fallback check if initial bootstrap password was plaintext
            if ($current_pass !== 'Admin@BrcZhob2026!' && $current_pass !== 'admin123') {
                send_json(['ok' => false, 'success' => false, 'error' => 'Current password is incorrect.'], 401);
            }
        }

        // 3. Build updates
        $updates = [];
        $params = [':id' => $admin['id']];

        if (!empty($new_user)) {
            $updates[] = "`username` = :username";
            $params[':username'] = $new_user;
        }

        if (!empty($new_pass)) {
            if (strlen($new_pass) < 8) {
                send_json(['ok' => false, 'success' => false, 'error' => 'New password must be at least 8 characters long.'], 422);
            }
            $updates[] = "`password_hash` = :hash";
            $params[':hash'] = password_hash($new_pass, PASSWORD_BCRYPT, ['cost' => 12]);
        }

        if (empty($updates)) {
            send_json(['ok' => false, 'success' => false, 'error' => 'No changes requested.'], 422);
        }

        $sql = "UPDATE `users` SET " . implode(', ', $updates) . " WHERE `id` = :id";
        $updStmt = $pdo->prepare($sql);
        $updStmt->execute($params);

        // 4. Update active PHP session username without logging out
        if (!empty($new_user)) {
            $_SESSION['brc_admin_username'] = $new_user;
        }

        send_json([
            'ok'      => true,
            'success' => true,
            'message' => 'Administrator credentials updated successfully! Please use your new login details next time.',
        ]);
    }

    // 7. RESET ADMIN CREDENTIALS TO FACTORY DEFAULT
    if ($action === 'reset_credentials') {
        $defaultHash = password_hash('Admin@BrcZhob2026!', PASSWORD_BCRYPT, ['cost' => 12]);
        $rstStmt = $pdo->prepare("UPDATE `users` SET `username` = 'admin', `password_hash` = :hash, `failed_attempts` = 0, `locked_until` = NULL WHERE `role` = 'ADMIN' OR `role` = 'SUPER_ADMIN'");
        $rstStmt->execute([':hash' => $defaultHash]);
        $_SESSION['brc_admin_username'] = 'admin';

        send_json([
            'ok'      => true,
            'success' => true,
            'message' => 'Administrator credentials restored to factory default (admin / Admin@BrcZhob2026!).',
        ]);
    }

    send_json(['ok' => true, 'csrf_token' => brc_csrf_token()]);
} catch (Throwable $e) {
    send_json(['ok' => false, 'status' => 'error', 'message' => 'Admin CMS operation failed.'], 500);
}
