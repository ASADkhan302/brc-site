## Application Overview
A complete, plug-and-play production deployment and packaging system for Balochistan Residential College Zhob (BRC Zhob) engineered to run seamlessly on both local XAMPP subfolder environments and live cPanel domains without blank pages, broken asset references, or missing backend endpoints.

## Core Features
- **Relative Asset Compilation**: Production frontend build configured with strictly relative asset paths so the compiled interface, styles, and official college emblem load reliably whether hosted at a domain root or inside a local XAMPP subfolder.
- **Root-Level Deployment Bundle & One-Click Export**: Downloadable archive structured with all production files directly at the archive root, ready for immediate extraction into a web root or subfolder, alongside a mirrored local distribution folder.
- **Auto-Detecting Database Connector**: Environment-aware PHP PDO connection handler that automatically switches between local XAMPP defaults and live cPanel credentials while providing standardized JSON response helpers and security session utilities.
- **Dual Database SQL Packaging**: Includes both a clean zero-state UTF-8 database schema (pre-configured with default administrator access, institutional counters, and campus gallery defaults with zero demo clutter) and a live snapshot of current records and candidate data.
- **Complete PHP Backend Suite**: Full, production-ready PHP endpoints for the 5-step admission submission and slip upload, real-time tracking lookup, administrator authentication with brute-force protection, CMS management (principal profile, gallery, candidate verification, and credential updates), live settings retrieval, and full backup ZIP generation.
- **Apache Routing & Upload Hardening**: Root Apache rewrite configuration for single-page routing and sensitive file protection, paired with dedicated upload directory execution blockers for candidate slips, principal portraits, and gallery images, plus a comprehensive quick-start evaluator guide.

## Design Specifications
- **Visual Direction**: Institutional academic authority combining warm ivory surfaces, deep maroon structural accents, and regal gold highlights.
- **Color Palette**: Primary Deep Maroon (`#5A1818`), Secondary Warm Ivory (`#FAF6F0`), Accent Regal Gold (`#C59B27`), Charcoal Slate text (`#1E1E1E`), and semantic status badges in Emerald Green (`#15803D`), Amber (`#B45309`), and Crimson (`#B91C1C`).
- **Typography**: Authoritative serif headings (`Playfair Display` / `Merriweather`) paired with clean geometric sans-serif controls (`Inter`) and monospace identifiers (`JetBrains Mono`) for tracking numbers, challan codes, and technical status indicators.
- **Layout & Structure**: Responsive institutional portal with print-optimized 3-copy National Bank of Pakistan fee challans, printable candidate entrance exam roll slips, and a streamlined Master CMS & Site Settings workspace with direct 1-click deployment bundle export.

## System Architecture
```
+-------------------------------------------------------------------+
|                   Compiled Production Frontend                    |
|     (Relative Asset Paths + SPA Router + Print Layouts)           |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               Apache Web Server & Security Layer                  |
|   (Root SPA Rewrite Rules + Header Hardening + Upload Blocker)    |
+---------------------------------+---------------------------------+
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
+-------------------------------+   +-------------------------------+
|    Public & Admin PHP APIs    |   |   Deployment & Backup Engine  |
| - Admission & Slip Upload     |   | - Root-Level ZIP Packaging    |
| - Live Application Tracker    |   | - Zero-State Schema & Live DB |
| - Auth & Brute-Force Guard    |   | - Uploaded Media Archiver     |
| - Master CMS & Credentials    |   | - Quick-Start Evaluator Guide |
+---------------+---------------+   +---------------+---------------+
                |                                   |
                +-----------------+-----------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|            Auto-Detecting PDO Database Layer (MySQL)              |
|        (Localhost XAMPP Mode  <--->  Live cPanel Hosting)         |
+-------------------------------------------------------------------+
```
