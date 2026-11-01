-- ============================================================================
-- BALOCHISTAN RESIDENTIAL COLLEGE ZHOB (BRC ZHOB)
-- Official Zero-State Production Database Schema (MySQL 8.0+ / MariaDB 10.4+)
-- Database: brc_zhob_db | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Zero [DEMO] clutter — Admissions queue initialized at 0 records
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `brc_zhob_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `brc_zhob_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. TABLE: admissions (Zero-State Live Candidate Queue)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `admissions`;
CREATE TABLE `admissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tracking_id` VARCHAR(32) NOT NULL,
  `candidate_name` VARCHAR(120) NOT NULL,
  `father_name` VARCHAR(120) NOT NULL,
  `gender` ENUM('Male', 'Female') NOT NULL DEFAULT 'Male',
  `class_applied` VARCHAR(60) NOT NULL,
  `dob_figures` DATE NOT NULL,
  `dob_words` VARCHAR(180) NOT NULL,
  `previous_marks_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `previous_school` VARCHAR(180) NOT NULL,
  `quota_district` VARCHAR(80) NOT NULL,
  `permanent_address` TEXT NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `challan_no` VARCHAR(50) NOT NULL,
  `bank_name` VARCHAR(120) NOT NULL DEFAULT 'National Bank of Pakistan (NBP Zhob Branch)',
  `account_no` VARCHAR(40) NOT NULL DEFAULT '0042-3019284756',
  `fee_amount` DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
  `slip_file` VARCHAR(255) DEFAULT NULL,
  `payment_status` ENUM('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `application_status` ENUM('PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `assigned_roll_no` VARCHAR(32) DEFAULT NULL,
  `assigned_kit_no` VARCHAR(32) DEFAULT NULL,
  `exam_date` DATE NOT NULL DEFAULT '2026-10-20',
  `verified_by` VARCHAR(80) DEFAULT NULL,
  `verified_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admissions_tracking_id` (`tracking_id`),
  KEY `idx_admissions_payment_status` (`payment_status`),
  KEY `idx_admissions_quota_district` (`quota_district`),
  KEY `idx_admissions_assigned_roll_no` (`assigned_roll_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABLE: cms_settings (Site-Wide Live Content & Principal Profile CMS)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `cms_settings`;
CREATE TABLE `cms_settings` (
  `setting_key` VARCHAR(80) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cms_settings` (`setting_key`, `setting_value`) VALUES
('principal_name', 'Dr. Muhammad Hassan'),
('principal_title', 'Principal & Controller of Examinations'),
('principal_badge', '18+ Years Leadership in Cadet Education'),
('principal_quote', 'Discipline Today Leads to Success Tomorrow — Shaping character, discipline, and academic brilliance to serve Pakistan with knowledge, integrity, and devotion.'),
('principal_photo', 'uploads/principal/default_principal.jpg'),
('top_notice_text', 'Admissions Open for Class 8th & 1st Year (Session 2026–2027) — Entry Test on 20 Oct 2026'),
('top_notice_phone', '+92 824 912345'),
('stat_cadet_strength', '850+'),
('stat_board_pass_rate', '98.4%'),
('stat_faculty_count', '42'),
('stat_hostel_blocks', '03'),
('bank_name', 'National Bank of Pakistan (NBP Zhob Branch)'),
('bank_account_no', '0042-3019284756'),
('bank_account_title', 'BRC Zhob Admission Fund'),
('admission_processing_fee', '2500');

-- ----------------------------------------------------------------------------
-- 3. TABLE: gallery_items (Curated Campus Architecture & Lab Photographs)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `gallery_items`;
CREATE TABLE `gallery_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(160) NOT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT 'Campus Architecture',
  `image_path` VARCHAR(500) NOT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gallery_category` (`category`),
  KEY `idx_gallery_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `gallery_items` (`title`, `category`, `image_path`, `is_featured`) VALUES
('Main Academic Block & Ceremonial Courtyard', 'Campus Architecture', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=85', 1),
('Advanced Physics & Chemistry Practical Laboratory', 'Laboratories', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85', 1),
('Residential Cadet Wing & Boarding Lawns', 'Hostel Life', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=85', 1),
('Morning Parade Ground & Athletics Complex', 'Sports & Drill', 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=85', 1);

-- ----------------------------------------------------------------------------
-- 4. TABLE: users (Admin-Only Authentication & Brute-Force Protection)
-- Default Admin Credentials: admin / Admin@BrcZhob2026!
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL DEFAULT 'College Administrator',
  `role` ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'SUPER_ADMIN',
  `failed_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME DEFAULT NULL,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`username`, `password_hash`, `full_name`, `role`) VALUES
('admin', '$2y$12$K8Y9z2X5v7N1m4P6q8R0s.Oe4oKoEa3Ro9llC/.og/at2.uheWG/i', 'College Administrator (BRC Zhob)', 'ADMIN');

-- ----------------------------------------------------------------------------
-- 5. TABLE: contact_inquiries (Public Contact Secretariat Submissions)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `contact_inquiries`;
CREATE TABLE `contact_inquiries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) DEFAULT NULL,
  `phone` VARCHAR(40) NOT NULL,
  `subject` VARCHAR(180) NOT NULL,
  `message` TEXT NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
