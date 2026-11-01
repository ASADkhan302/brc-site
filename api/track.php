<?php
declare(strict_types=1);

/**
 * Balochistan Residential College Zhob (BRC Zhob)
 * Endpoint: GET/POST /api/track.php
 * Real-Time Application Tracker by Reference ID (e.g. BRC-ADM-2026-0001)
 */

require_once __DIR__ . '/../config/db.php';

$rawInput = file_get_contents('php://input');
$jsonBody = !empty($rawInput) ? json_decode($rawInput, true) : null;
$input = is_array($jsonBody) ? $jsonBody : array_merge($_GET, $_POST);

$trackingId = strtoupper(trim((string)($input['tracking_id'] ?? $input['ref'] ?? $input['application_ref'] ?? '')));

if ($trackingId === '') {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'Please provide a valid Tracking ID (e.g., BRC-ADM-2026-0001).',
    ], 422);
}

try {
    $stmt = $pdo->prepare('
        SELECT
            id,
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
            assigned_roll_no,
            assigned_kit_no,
            exam_date,
            verified_at,
            created_at
        FROM admissions
        WHERE tracking_id = :tracking_id
        LIMIT 1
    ');
    $stmt->execute([':tracking_id' => $trackingId]);
    $row = $stmt->fetch();

    if (!$row) {
        send_json([
            'ok'      => false,
            'status'  => 'not_found',
            'message' => 'No admission record found matching reference ID: ' . brc_escape($trackingId),
        ], 404);
    }

    send_json([
        'ok'          => true,
        'status'      => 'success',
        'application' => [
            'id'                        => (int)$row['id'],
            'tracking_id'               => brc_escape($row['tracking_id']),
            'application_ref'           => brc_escape($row['tracking_id']),
            'candidate_name'            => brc_escape($row['candidate_name']),
            'father_name'               => brc_escape($row['father_name']),
            'gender'                    => brc_escape($row['gender']),
            'class_applied'             => brc_escape($row['class_applied']),
            'dob_figures'               => brc_escape($row['dob_figures']),
            'dob_words'                 => brc_escape($row['dob_words']),
            'previous_class_percentage' => (float)$row['previous_marks_percentage'],
            'previous_school'           => brc_escape($row['previous_school']),
            'quota_category'            => brc_escape($row['quota_district']),
            'domicile_district'         => brc_escape($row['quota_district']),
            'permanent_address'         => brc_escape($row['permanent_address']),
            'guardian_phone'            => brc_escape($row['phone']),
            'status'                    => brc_escape($row['application_status']),
            'assigned_roll_no'          => $row['assigned_roll_no'] ? brc_escape($row['assigned_roll_no']) : null,
            'assigned_kit_no'           => $row['assigned_kit_no'] ? brc_escape($row['assigned_kit_no']) : null,
            'exam_date'                 => '20 Oct 2026 (09:00 AM PST)',
            'submitted_at'              => brc_escape($row['created_at']),
            'fee_details'               => [
                'bank_branch'         => brc_escape($row['bank_name']) . ' (A/C: ' . brc_escape($row['account_no']) . ')',
                'challan_number'      => brc_escape($row['challan_no']),
                'amount_pkr'          => (float)$row['fee_amount'],
                'slip_file_name'      => $row['slip_file'] ? brc_escape($row['slip_file']) : null,
                'verification_status' => brc_escape($row['payment_status']),
                'verified_at'         => $row['verified_at'] ? brc_escape($row['verified_at']) : null,
            ],
        ],
    ]);
} catch (Throwable $e) {
    send_json([
        'ok'      => false,
        'status'  => 'error',
        'message' => 'Unable to query application tracking status.',
    ], 500);
}
