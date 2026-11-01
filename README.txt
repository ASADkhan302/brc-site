================================================================================
BALOCHISTAN RESIDENTIAL COLLEGE ZHOB (BRC ZHOB)
Official Web Portal & Online Admission Management System
================================================================================

1. LOCAL TESTING ON XAMPP:
   - Extract this ZIP into your XAMPP web root folder:
     C:\xampp\htdocs\brc-zhob\
   - Start Apache and MySQL in the XAMPP Control Panel.
   - Open phpMyAdmin: http://localhost/phpmyadmin/
   - Create database: "brc_zhob_db" (Collation: utf8mb4_unicode_ci).
   - Click "Import", select "database/schema.sql" (for a clean zero-state setup)
     or "database/live_snapshot.sql" (for current live data), and click "Go".
   - Open the application in your browser:
     http://localhost/brc-zhob/

2. LIVE DOMAIN / CPANEL DEPLOYMENT:
   - Upload and extract this ZIP file directly into your hosting "public_html" directory.
   - Create a MySQL Database & User in cPanel, grant All Privileges.
   - Open phpMyAdmin in cPanel and import "database/schema.sql".
   - Open "config/db.php" and enter your cPanel database name, user, and password.

3. DEFAULT ADMINISTRATOR CREDENTIALS:
   - Access URL: http://localhost/brc-zhob/ (Click "STAFF PORTAL" in navbar)
   - Username: admin
   - Password: Admin@BrcZhob2026!

4. CORE FUNCTIONALITIES TO TEST:
   - Online Admission: 5-step wizard, auto-generated NBP 3-copy Bank Challan (PKR 2,500), paid deposit slip upload, and reference ID generation (BRC-ADM-2026-XXXX).
   - Live Tracker: Look up reference ID to view verification status.
   - Admin CMS: Upload new Principal photo, manage campus gallery, edit site counters, and update Administrator credentials.
   - Roll Slip Dispatch: Print individual candidate hall tickets or batch master PDF for the 20 Oct 2026 entrance examination.
   - Full Backup: Export candidate database and uploaded bank slip photos in 1 click.
================================================================================
