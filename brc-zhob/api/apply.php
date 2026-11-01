<?php
declare(strict_types=1);

/**
 * Balochistan Residential College Zhob (BRC Zhob)
 * Endpoint: POST /api/apply.php
 * Handles 5-Step Online Admission submission, paid NBP deposit slip upload
 * with binary magic-byte inspection (finfo_file), and tracking ID generation (BRC-ADM-2026-XXXX).
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['ok' => false, 'status' => 'error', 'message' => 'Method Not Allowed. Use POST.'], 405);
}

$rawInput = file_get_contents('php://input');
$jsonBody = !empty($rawInput) ? json_decode($rawInput, true) : null;
$input = is_array($jsonBody) ? $jsonBody : $_POST;

$candidateName = trim((string)($input['candidate_name'] ?? ''));
$fatherName    = trim((string)($input['father_name'] ?? ''));
$gender        = in_array(($input['gender'] ?? 'Male'), ['Male', 'Female'], true) ? (string)$input['gender'] : 'Male';
$classApplied  = trim((string)($input['class_applied'] ?? 'Class 8th'));
$dobFigures    = trim((string)($input['dob_figures'] ?? '2012-01-01'));
$dobWords      = trim((string)($input['dob_words'] ?? ''));
$prevMarks     = (float)($input['previous_class_percentage'] ?? $input['previous_marks_percentage'] ?? $input['percentage'] ?? 0);
$prevSchool    = trim((string)($input['previous_school'] ?? ''));
$quotaDistrict = trim((string)($input['quota_category'] ?? $input['quota_district'] ?? $input['domicile_district'] ?? 'Zhob'));
$permAddress   = trim((string)($input['permanent_address'] ?? ''));
$phone         = trim((string)($input['guardian_phone'] ?? $input['phone'] ?? ''));
$challanNo     = trim((string)($input['challan_number'] ?? $input['challan_no'] ?? $input['fee_details']['challan_number'] ?? 'NBP-2026'));

if ($candidateName === '' || $fatherName === '') {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'Candidate Name and Father Name are required fields.',
    ], 422);
}

$allowedMimes = [
    'image/jpeg'      => 'jpg',
    'image/png'       => 'png',
    'application/pdf' => 'pdf',
];

$uploadDir = dirname(__DIR__) . '/uploads/slips';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0750, true);
}

$savedSlipFilename = '';

// 1. Multipart form-data file upload ($_FILES['deposit_slip'])
if (!empty($_FILES['deposit_slip']['tmp_name']) && is_uploaded_file($_FILES['deposit_slip']['tmp_name'])) {
    if ($_FILES['deposit_slip']['size'] > 2 * 1024 * 1024) {
        send_json(['ok' => false, 'status' => 'error', 'message' => 'Deposit slip exceeds maximum allowed size of 2MB.'], 422);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = finfo_file($finfo, $_FILES['deposit_slip']['tmp_name']);
    finfo_close($finfo);

    if (!isset($allowedMimes[$detectedMime])) {
        send_json([
            'ok'      => false,
            'status'  => 'error',
            'message' => 'Invalid file signature. Only JPG, PNG, and PDF bank deposit slips are allowed.',
        ], 422);
    }

    $safeExt = $allowedMimes[$detectedMime];
    $savedSlipFilename = 'slip_' . bin2hex(random_bytes(16)) . '_' . time() . '.' . $safeExt;
    $destination = $uploadDir . '/' . $savedSlipFilename;

    if (!move_uploaded_file($_FILES['deposit_slip']['tmp_name'], $destination)) {
        send_json(['ok' => false, 'status' => 'error', 'message' => 'Failed to save uploaded deposit slip.'], 500);
    }
}
// 2. Base64 data URL slip upload from SPA wizard
elseif (!empty($input['slip_data_url']) || !empty($input['fee_details']['slip_data_url'])) {
    $dataUrl = (string)($input['slip_data_url'] ?? $input['fee_details']['slip_data_url']);
    if (preg_match('/^data:([^;]+);base64,(.+)$/', $dataUrl, $matches)) {
        $binaryData = base64_decode($matches[2], true);
        if ($binaryData === false || strlen($binaryData) > 2 * 1024 * 1024) {
            send_json(['ok' => false, 'status' => 'error', 'message' => 'Invalid or oversized deposit slip file (max 2MB).'], 422);
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'brc_slip_');
        file_put_contents($tmpFile, $binaryData);
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = finfo_file($finfo, $tmpFile);
        finfo_close($finfo);

        if (!isset($allowedMimes[$detectedMime])) {
            @unlink($tmpFile);
            send_json([
                'ok'      => false,
                'status'  => 'error',
                'message' => 'Binary magic bytes rejected. Only genuine JPG, PNG, or PDF slips are permitted.',
            ], 422);
        }

        $safeExt = $allowedMimes[$detectedMime];
        $savedSlipFilename = 'slip_' . bin2hex(random_bytes(16)) . '_' . time() . '.' . $safeExt;
        rename($tmpFile, $uploadDir . '/' . $savedSlipFilename);
    }
}

try {
    // Generate sequential Tracking ID: BRC-ADM-2026-XXXX
    $countStmt = $pdo->prepare('SELECT COUNT(*) AS total FROM admissions');
    $countStmt->execute();
    $row = $countStmt->fetch();
    $nextSeq = ((int)($row['total'] ?? 0)) + 1;

    $trackingId = !empty($input['application_ref'])
        ? preg_replace('/[^A-Z0-9\-]/', '', strtoupper((string)$input['application_ref']))
        : sprintf('BRC-ADM-2026-%04d', $nextSeq);

    $insertStmt = $pdo->prepare('
        INSERT INTO admissions (
            tracking_id,
            candidate_name,
            father_name,
            gender,
            class_applied,
            dob_figures,
            dob_words,
            previous_marks_percentage,
            previous_school,
            quota_district,
            permanent_address,
            phone,
            challan_no,
            bank_name,
            account_no,
            fee_amount,
            slip_file,
            payment_status,
            application_status,
            created_at
        ) VALUES (
            :tracking_id,
            :candidate_name,
            :father_name,
            :gender,
            :class_applied,
            :dob_figures,
            :dob_words,
            :previous_marks_percentage,
            :previous_school,
            :quota_district,
            :permanent_address,
            :phone,
            :challan_no,
            :bank_name,
            :account_no,
            :fee_amount,
            :slip_file,
            :payment_status,
            :application_status,
            NOW()
        )
    ');

    $insertStmt->execute([
        ':tracking_id'               => $trackingId,
        ':candidate_name'            => $candidateName,
        ':father_name'               => $fatherName,
        ':gender'                    => $gender,
        ':class_applied'             => $classApplied,
        ':dob_figures'               => $dobFigures ?: '2012-01-01',
        ':dob_words'                 => $dobWords,
        ':previous_marks_percentage' => $prevMarks,
        ':previous_school'           => $prevSchool,
        ':quota_district'            => $quotaDistrict,
        ':permanent_address'         => $permAddress,
        ':phone'                     => $phone,
        ':challan_no'                => $challanNo,
        ':bank_name'                 => 'National Bank of Pakistan (NBP Zhob Branch)',
        ':account_no'                => '0042-3019284756',
        ':fee_amount'                => 2500.00,
        ':slip_file'                 => $savedSlipFilename ?: null,
        ':payment_status'            => 'PENDING_VERIFICATION',
        ':application_status'        => 'PENDING_VERIFICATION',
    ]);

    send_json([
        'ok'              => true,
        'status'          => 'success',
        'tracking_id'     => brc_escape($trackingId),
        'application_ref' => brc_escape($trackingId),
        'payment_status'  => 'PENDING_VERIFICATION',
        'slip_file'       => $savedSlipFilename ? 'uploads/slips/' . brc_escape($savedSlipFilename) : null,
        'exam_date'       => '2026-10-20',
    ], 201);
} catch (Throwable $e) {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'Failed to save admission application.',
    ], 500);
}
