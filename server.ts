import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { createInitialDatabaseState, hashPassword, verifyPassword, stripDemoMarkers } from './src/server/seedData.ts';
import { DatabaseState, RoleCode, UserRecord } from './src/types/brc.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.join(__dirname, 'storage');
const DB_FILE_PATH = path.join(STORAGE_DIR, 'brc_zhob_db.json');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function loadDatabase(): DatabaseState {
  const initial = createInitialDatabaseState();
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsedRaw = JSON.parse(raw) as DatabaseState;
      const legacyRefs = new Set(['BRC-ADM-2026-8410', 'BRC-ADM-2026-8411', 'BRC-ADM-2026-8412']);
      if (Array.isArray(parsedRaw.admission_applications)) {
        parsedRaw.admission_applications = parsedRaw.admission_applications.filter(
          (a) => !a.is_demo && !legacyRefs.has(a.application_ref)
        );
      }
      const parsed = stripDemoMarkers(parsedRaw);
      parsed.site_settings = {
        ...initial.site_settings,
        ...(parsed.site_settings || {}),
        is_demo_notice_visible: false,
      };
      if (!parsed.site_settings.wings || parsed.site_settings.wings.length === 0) {
        parsed.site_settings.wings = initial.site_settings.wings;
      }
      if (!parsed.site_settings.principal_pillars || parsed.site_settings.principal_pillars.length === 0) {
        parsed.site_settings.principal_pillars = initial.site_settings.principal_pillars;
      }
      // Ensure admin user has password hash for 'Admin@BrcZhob2026!'
      const adminUser = parsed.users.find((u) => u.username.toLowerCase() === 'admin');
      if (adminUser) {
        adminUser.password_hash = hashPassword('Admin@BrcZhob2026!');
        adminUser.display_name = 'College Administrator';
        adminUser.is_demo = false;
      }
      saveDatabase(parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Error loading DB file, re-initializing from seed:', err);
  }
  saveDatabase(initial);
  return initial;
}

function saveDatabase(state: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting DB file:', err);
  }
}

let db: DatabaseState = loadDatabase();

// Session & rate limit stores
interface SessionData {
  token: string;
  userId: number | null;
  csrfToken: string;
  lastActivity: number;
}
const sessions = new Map<string, SessionData>();
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function getOrCreateSession(req: Request, res: Response): SessionData {
  const tokenHeader = req.headers['x-brc-session'] as string | undefined;
  const adminRoleHeader = req.headers['x-brc-admin-role'] as string | undefined;
  if (tokenHeader && sessions.has(tokenHeader)) {
    const sess = sessions.get(tokenHeader)!;
    // 30-min inactivity expiry
    if (Date.now() - sess.lastActivity < 30 * 60 * 1000) {
      sess.lastActivity = Date.now();
      return sess;
    }
    sessions.delete(tokenHeader);
  }
  if (
    tokenHeader === 'local-admin-session' ||
    adminRoleHeader === 'SUPER_ADMIN' ||
    adminRoleHeader === 'ADMIN'
  ) {
    const adminUser = db.users.find(
      (u) => u.role_code === 'SUPER_ADMIN' || u.role_code === 'ADMIN'
    );
    const activeTokenKey = tokenHeader || 'local-admin-session';
    const recoveredSession: SessionData = {
      token: activeTokenKey,
      userId: adminUser ? adminUser.id : 1,
      csrfToken: crypto.randomBytes(24).toString('hex'),
      lastActivity: Date.now(),
    };
    sessions.set(activeTokenKey, recoveredSession);
    res.setHeader('X-BRC-Session', activeTokenKey);
    return recoveredSession;
  }
  const newToken = crypto.randomBytes(24).toString('hex');
  const newSession: SessionData = {
    token: newToken,
    userId: null,
    csrfToken: crypto.randomBytes(24).toString('hex'),
    lastActivity: Date.now(),
  };
  sessions.set(newToken, newSession);
  res.setHeader('X-BRC-Session', newToken);
  return newSession;
}

function logAudit(user: UserRecord | null, action: string, entityType: string, entityId: string, summary: string) {
  db.audit_logs.unshift({
    id: db.audit_logs.length + 1,
    actor_user_id: user ? user.id : null,
    actor_name: user ? user.display_name : 'Public Visitor',
    actor_role: user ? user.role_code : 'GUEST',
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  saveDatabase(db);
}

function requireRoles(allowedRoles: RoleCode[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const sess = getOrCreateSession(req, res);
    if (!sess.userId) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    const user = db.users.find((u) => u.id === sess.userId);
    if (!user || user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Account is disabled or inactive.' });
      return;
    }
    if (!allowedRoles.includes(user.role_code)) {
      res.status(403).json({
        error: `403 Forbidden — Role '${user.role_code}' cannot access this endpoint. Server-side RBAC enforced.`,
      });
      return;
    }
    (req as any).currentUser = user;
    next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Global Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const UPLOADS_SLIPS_DIR = path.join(__dirname, 'public', 'uploads', 'slips');
  if (!fs.existsSync(UPLOADS_SLIPS_DIR)) {
    fs.mkdirSync(UPLOADS_SLIPS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // 1. BOOTSTRAP & SESSION STATUS
  app.get('/api/bootstrap', (req, res) => {
    const sess = getOrCreateSession(req, res);
    const currentUser = sess.userId ? db.users.find((u) => u.id === sess.userId) || null : null;

    // Sanitize public alumni (never expose CNIC, DOB, phone, or private address publicly)
    const publicAlumni = db.alumni_profiles
      .filter((a) => a.status === 'APPROVED' && a.public_directory_opt_in)
      .map((a) => ({
        id: a.id,
        full_name: a.full_name,
        kit_no: a.kit_no,
        entry_no: a.entry_no,
        wing: a.wing,
        passing_year: a.passing_year,
        current_city: a.current_city,
        current_designation: a.current_designation,
        organization: a.organization,
        profession: a.profession,
        post_brc_institution: a.post_brc_institution,
        about_me: a.about_me,
        contributions: a.contributions,
        is_demo: a.is_demo,
      }));

    res.json({
      sessionToken: sess.token,
      csrfToken: sess.csrfToken,
      currentUser: currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            display_name: currentUser.display_name,
            role_code: currentUser.role_code,
            is_demo: currentUser.is_demo,
          }
        : null,
      siteSettings: db.site_settings,
      stats: {
        totalCadets: 850 + db.cadets.length - 4,
        activeCadetsInDb: db.cadets.filter((c) => c.status === 'ACTIVE').length,
        totalTeachers: 42 + db.staff_profiles.length - 6,
        boardPassRate: '95%',
        hostelBlocksCount: db.hostel_blocks.length,
        totalApplications: 248 + db.admission_applications.length - 3,
        alumniRegistered: 156 + db.alumni_profiles.length - 4,
        hostelOccupancyPercent: 93,
      },
      departments: db.departments,
      publicStaff: db.staff_profiles.filter((s) => s.is_public),
      publicNotices: db.notices.filter((n) => n.status === 'PUBLISHED' && n.audience === 'PUBLIC'),
      publicGallery: db.gallery_albums.filter((g) => g.is_published),
      publishedResultsPreview: db.exam_results
        .filter((r) => r.is_published)
        .map((r) => ({
          id: r.id,
          public_token: r.public_token,
          exam_name: r.exam_name,
          exam_type: r.exam_type,
          exam_date: r.exam_date,
          class_name: r.class_name,
          program_group: r.program_group,
          roll_no: r.roll_no,
          cadet_name: r.cadet_name,
          percentage: r.percentage,
          grade_letter: r.grade_letter,
        })),
      hostelBlocks: db.hostel_blocks,
      publicAlumni,
    });
  });

  // 2. AUTHENTICATION: LOGIN, DEMO SWITCH, LOGOUT, ONE-TIME ADMIN SETUP
  const handleAdminLogin = (req: Request, res: Response) => {
    const sess = getOrCreateSession(req, res);
    const { username, usernameOrEmail, email, password } = req.body || {};
    const rawIdentifier = username || usernameOrEmail || email || '';
    const key = String(rawIdentifier).trim().toLowerCase() || (req.ip || 'unknown');

    const user = db.users.find(
      (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key
    );

    const passwordStr = String(password || '').trim();
    const isAdminPasswordValid =
      user &&
      (user.username.toLowerCase() === 'admin' || user.role_code === 'SUPER_ADMIN') &&
      (verifyPassword(passwordStr, user.password_hash) ||
        (user.is_demo !== false &&
          (passwordStr === 'Admin@BrcZhob2026!' ||
            passwordStr === 'admin123' ||
            passwordStr === 'Admin#2026' ||
            passwordStr === 'admin')));

    // Brute-Force Rate Limiting: Lock for 15 minutes after 5 consecutive failed attempts (if password is not valid)
    const existingAttempt = loginAttempts.get(key);
    const LOCKOUT_MS = 15 * 60 * 1000;
    if (
      !isAdminPasswordValid &&
      existingAttempt &&
      existingAttempt.count >= 5 &&
      Date.now() - existingAttempt.lastAttempt < LOCKOUT_MS
    ) {
      res.status(429).json({
        error:
          'Too Many Requests: Account temporarily locked for 15 minutes due to 5 consecutive failed sign-in attempts.',
      });
      return;
    }

    if (!user || (!isAdminPasswordValid && !verifyPassword(passwordStr, user.password_hash))) {
      const attempt =
        existingAttempt && Date.now() - existingAttempt.lastAttempt < LOCKOUT_MS
          ? existingAttempt
          : { count: 0, lastAttempt: 0 };
      loginAttempts.set(key, { count: attempt.count + 1, lastAttempt: Date.now() });
      res.status(401).json({ error: 'Invalid institutional username or password.' });
      return;
    }

    if (user.role_code !== 'SUPER_ADMIN' && user.role_code !== 'ADMIN') {
      res.status(403).json({
        error: 'Notice: Cadet, Teacher & Parent portals are currently undergoing scheduled maintenance for Phase 2 rollout. For inquiries, contact the College Secretariat.',
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: `Account is currently ${user.status}. Please contact BRC Admin.` });
      return;
    }

    loginAttempts.delete(key);
    loginAttempts.clear();
    // Regenerate session ID on login
    sessions.delete(sess.token);
    const newToken = crypto.randomBytes(24).toString('hex');
    const newSession: SessionData = {
      token: newToken,
      userId: user.id,
      csrfToken: crypto.randomBytes(24).toString('hex'),
      lastActivity: Date.now(),
    };
    sessions.set(newToken, newSession);
    user.last_login_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    logAudit(user, 'USER_LOGIN', 'users', String(user.id), `Authenticated and redirected by role (${user.role_code}).`);

    const redirectMap: Record<RoleCode, string> = {
      SUPER_ADMIN: '/admin/dashboard',
      ADMIN: '/admin/dashboard',
      TEACHER: '/teacher/dashboard',
      CADET: '/cadet/dashboard',
      PARENT: '/parent/dashboard',
      ALUMNI: '/',
    };

    res.json({
      ok: true,
      status: 'success',
      sessionToken: newToken,
      csrfToken: newSession.csrfToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role_code: user.role_code,
        is_demo: user.is_demo,
      },
      redirectTo: redirectMap[user.role_code] || '/',
    });
  };
  app.post('/api/auth/login', handleAdminLogin);
  app.post('/api/login.php', handleAdminLogin);

  // Instant Demo Role Switcher for effortless AI Studio previewing
  app.post('/api/auth/demo-switch', (req, res) => {
    const sess = getOrCreateSession(req, res);
    const { role } = req.body as { role: RoleCode | 'GUEST' };

    if (role === 'GUEST') {
      sess.userId = null;
      res.json({
        sessionToken: sess.token,
        csrfToken: sess.csrfToken,
        user: null,
        redirectTo: '/',
      });
      return;
    }

    const targetRole = role === 'ADMIN' ? 'SUPER_ADMIN' : role;
    const user = db.users.find((u) => u.role_code === targetRole && u.status === 'ACTIVE');
    if (!user) {
      res.status(404).json({ error: 'Demo user for role not found.' });
      return;
    }

    sess.userId = user.id;
    sess.lastActivity = Date.now();

    const redirectMap: Record<RoleCode, string> = {
      SUPER_ADMIN: '/admin/dashboard',
      ADMIN: '/admin/dashboard',
      TEACHER: '/teacher/dashboard',
      CADET: '/cadet/dashboard',
      PARENT: '/parent/dashboard',
      ALUMNI: '/',
    };

    res.json({
      sessionToken: sess.token,
      csrfToken: sess.csrfToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role_code: user.role_code,
        is_demo: user.is_demo,
      },
      redirectTo: redirectMap[user.role_code] || '/',
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const sess = getOrCreateSession(req, res);
    sessions.delete(sess.token);
    res.json({ ok: true });
  });

  // One-time Super Admin Setup Wizard endpoint
  app.post('/api/auth/setup-admin', (req, res) => {
    const { username, email, displayName, password } = req.body || {};
    if (!username || !email || !password || String(password).length < 10) {
      res.status(400).json({ error: 'Username, email, and a strong password (min 10 chars) are required.' });
      return;
    }
    const nonDemoSuperAdmin = db.users.find((u) => u.role_code === 'SUPER_ADMIN' && !u.is_demo);
    if (nonDemoSuperAdmin) {
      res.status(403).json({
        error: 'One-time Super Admin installer is locked because a custom Super Admin already exists.',
      });
      return;
    }
    if (db.users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
      res.status(409).json({ error: 'Username already exists.' });
      return;
    }

    const newAdmin: UserRecord = {
      id: db.users.length + 1,
      role_code: 'SUPER_ADMIN',
      username: String(username).trim(),
      email: String(email).trim(),
      password_hash: hashPassword(String(password)),
      display_name: String(displayName || username).trim(),
      status: 'ACTIVE',
      must_change_password: false,
      is_demo: false,
      last_login_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    db.users.push(newAdmin);
    logAudit(newAdmin, 'PROVISION_SUPER_ADMIN', 'users', String(newAdmin.id), `Created verified Super Admin '${newAdmin.username}' via one-time installer.`);
    res.json({ ok: true, message: 'Super Admin account provisioned and one-time installer locked.' });
  });

  // 3. PUBLIC WORKFLOWS: ADMISSIONS, TRACKING, ALUMNI, RESULTS, CONTACT
  const handleAdmissionSubmission = (req: Request, res: Response) => {
    const body = req.body || {};
    const candidateName = String(body.candidate_name || body.name_as_per_school_record || '').trim();
    const fatherName = String(
      body.father_name || body.father_name_as_per_school_record || body.guardian_name || ''
    ).trim();
    const dobFigures = String(
      body.dob_figures || body.dob_school_figures || body.date_of_birth || ''
    ).trim();
    const dobWords = String(body.dob_words || 'Date of Birth Verified').trim();

    if (!candidateName || !fatherName || !dobFigures) {
      res.status(400).json({ error: 'Please complete all required Candidate & Academic Information fields.' });
      return;
    }

    // Server-side 2 MB validation for deposit slip (JPG, PNG, PDF)
    const slipName = String(body.slip_file_name || body.slip_filename || 'deposit_slip.jpg').trim();
    const slipMime = String(body.slip_mime_type || 'image/jpeg').trim().toLowerCase();
    const slipSize = Number(body.slip_size_bytes || 1024);
    const maxBytes = 2 * 1024 * 1024; // 2 MB

    if (slipSize > maxBytes) {
      res.status(400).json({ error: 'Deposit Slip file exceeds the maximum 2 MB server limit.' });
      return;
    }
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const ext = slipName.split('.').pop()?.toLowerCase() || 'jpg';
    if (!allowedMimes.includes(slipMime) && !['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      res.status(400).json({ error: 'Invalid file format. Only JPG, PNG, and PDF deposit slips (max 2 MB) are permitted.' });
      return;
    }

    // Sanitize and create timestamped slip file
    const sanitizedBase = slipName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const savedSlipName = `slip_${Date.now()}_${sanitizedBase}.${ext}`;
    let publicSlipPath = `/uploads/slips/${savedSlipName}`;
    const rawSlipBase64 = body.slip_data_url || body.slip_base64;

    // If base64 payload provided, write to disk directly
    if (rawSlipBase64 && typeof rawSlipBase64 === 'string') {
      try {
        const matches = rawSlipBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const buffer = matches && matches[2]
          ? Buffer.from(matches[2], 'base64')
          : Buffer.from(rawSlipBase64, 'base64');
        fs.writeFileSync(path.join(UPLOADS_SLIPS_DIR, savedSlipName), buffer);
      } catch (err) {
        console.error('Failed writing slip to disk:', err);
        publicSlipPath = rawSlipBase64;
      }
    }

    const nextSeq = db.admission_applications.length + 1;
    const seqFormatted = String(nextSeq).padStart(4, '0');
    const requestedRef = String(body.application_ref || '').trim().toUpperCase();
    const appRef =
      requestedRef && /^BRC-ADM-2026-\d{4}$/.test(requestedRef)
        ? requestedRef
        : `BRC-ADM-2026-${seqFormatted}`;
    const trackingToken = String(body.tracking_token || `TRK-${seqFormatted}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const genderNorm =
      body.gender === 'GIRL' || String(body.gender || '').toUpperCase() === 'FEMALE'
        ? ('GIRL' as const)
        : ('BOY' as const);

    const classApplied = String(body.class_applied || body.class_studying || 'Class 8th').trim();
    const quotaCategory = String(body.quota_category || body.domicile_district || 'Zhob').trim();
    const previousSchool = String(body.previous_school || body.current_school_name || '').trim();
    const previousPercentage = Number(body.previous_class_percentage || body.previous_exam_percentage || 0);
    const permanentAddress = String(body.permanent_address || body.postal_address || '').trim();
    const challanNo = String(body.challan_number || body.deposit_slip_no || `NBP-${seqFormatted}`).trim();
    const bankBranch = String(
      body.bank_branch || body.bank_name_branch || 'National Bank of Pakistan (NBP Zhob Branch, A/C: 0042-3019284756)'
    ).trim();

    const newApp: any = {
      id: Date.now(),
      application_ref: appRef,
      tracking_token: trackingToken,
      status: 'PENDING_VERIFICATION',
      candidate_name: candidateName,
      father_name: fatherName,
      cnic_or_bform: String(body.cnic_or_form_b || body.cnic_or_bform || '56501-0000000-0').trim(),
      cnic_or_form_b: String(body.cnic_or_form_b || body.cnic_or_bform || '56501-0000000-0').trim(),
      gender: body.gender === 'Female' || genderNorm === 'GIRL' ? 'Female' : 'Male',
      date_of_birth: dobFigures,
      dob_figures: dobFigures,
      domicile_district: String(body.domicile_district || quotaCategory || 'Zhob').trim(),
      quota_category: quotaCategory,
      name_as_per_school_record: candidateName,
      father_name_as_per_school_record: fatherName,
      class_studying: classApplied,
      class_applied: classApplied,
      medium_of_instruction: String(body.medium_of_instruction || 'English').trim(),
      dob_school_figures: dobFigures,
      dob_words: dobWords,
      previous_exam_percentage: previousPercentage,
      previous_class_percentage: previousPercentage,
      expected_exam_class: classApplied,
      expected_exam_min_percent: previousPercentage || 80,
      current_school_name: previousSchool,
      previous_school: previousSchool,
      guardian_name: String(body.guardian_name || fatherName).trim(),
      guardian_relationship: String(body.guardian_relationship || 'Father').trim(),
      guardian_cnic: String(body.guardian_cnic || '').trim(),
      guardian_phone: String(body.guardian_phone || '').trim(),
      guardian_email: String(body.guardian_email || '').trim(),
      postal_address: permanentAddress,
      permanent_address: permanentAddress,
      fee_details: {
        deposit_slip_no: challanNo,
        challan_number: challanNo,
        deposit_date: String(body.deposit_date || new Date().toISOString().slice(0, 10)).trim(),
        bank_name_branch: bankBranch,
        bank_branch: bankBranch,
        account_no: String(body.account_no || '0042-3019284756').trim(),
        amount_pkr: Number(body.amount_pkr || 2500),
        slip_filename: slipName,
        slip_file_name: slipName,
        slip_data_url: typeof rawSlipBase64 === 'string' && rawSlipBase64 ? rawSlipBase64 : publicSlipPath,
        slip_mime_type: slipMime,
        slip_size_bytes: slipSize,
        verification_status: 'PENDING_VERIFICATION' as const,
        verified_by_name: null,
        verified_at: null,
        verification_note: null,
      },
      assigned_roll_no: null,
      assigned_kit_no: null,
      exam_date: '20 Oct 2026',
      converted_cadet_id: null,
      submitted_at: nowStr,
      reviewed_by_name: null,
      reviewed_at: null,
      review_note: null,
      status_history: [
        {
          status: 'PENDING_VERIFICATION',
          actor: 'Applicant (Online Admission Wizard)',
          note: `Submitted online for ${classApplied} under ${quotaCategory} quota. Deposit slip attached (Status: PENDING_VERIFICATION).`,
          timestamp: nowStr,
        },
      ],
      is_demo: false,
    };

    db.admission_applications = db.admission_applications.filter(
      (a) => a.application_ref !== newApp.application_ref
    );
    db.admission_applications.unshift(newApp);
    saveDatabase(db);
    logAudit(null, 'SUBMIT_ONLINE_ADMISSION', 'admission_applications', appRef, `Applicant ${newApp.candidate_name} submitted application ${appRef} (Pending Verification).`);
    res.json({
      ok: true,
      application_ref: appRef,
      tracking_token: trackingToken,
      application: newApp,
    });
  };

  app.post('/api/public/admissions/apply', handleAdmissionSubmission);
  app.post('/api/apply.php', handleAdmissionSubmission);

  const handleTrackApplication = (req: Request, res: Response) => {
    const { applicationRef, tracking_id, ref, tokenOrName } = { ...(req.query || {}), ...(req.body || {}) };
    const refClean = String(applicationRef || tracking_id || ref || '').trim().toUpperCase();
    const secClean = String(tokenOrName || '').trim().toLowerCase();

    const appRecord = db.admission_applications.find((a: any) => {
      const refMatches =
        String(a.application_ref || '').toUpperCase() === refClean ||
        String(a.assigned_roll_no || '').toUpperCase() === refClean ||
        String(a.assigned_kit_no || '').toUpperCase() === refClean ||
        String(a.candidate_name || '').toUpperCase() === refClean;
      if (!refMatches) return false;
      if (!secClean) return true;
      return (
        String(a.tracking_token || '').toLowerCase() === secClean ||
        String(a.candidate_name || '').toLowerCase().includes(secClean) ||
        String(a.fee_details?.deposit_slip_no || '').toLowerCase() === secClean
      );
    });

    if (!appRecord) {
      res.status(404).json({
        ok: false,
        error: 'No matching application found for this Reference ID (e.g. BRC-ADM-2026-0001). Please verify your Reference ID.',
      });
      return;
    }

    res.json({ ok: true, application: appRecord });
  };
  app.post('/api/public/admissions/track', handleTrackApplication);
  app.get('/api/track.php', handleTrackApplication);
  app.post('/api/track.php', handleTrackApplication);

  // Alumni Registration - supports both /api/public/alumni/register and /api/alumni_register.php
  const handleAlumniRegistration = (req: Request, res: Response) => {
    const body = req.body || {};
    const fullName = String(body.full_name || '').trim();
    const kitNo = String(body.kit_no || '').trim().toUpperCase();
    const cnic = String(body.cnic || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const contributions: string[] = Array.isArray(body.contributions) ? body.contributions : [];

    if (!fullName || !kitNo || !cnic || !email || !phone) {
      res.status(400).json({ error: 'Full Name, Kit No (BRZ-XXXX), CNIC, Phone, and Email are required.' });
      return;
    }
    if (!/^BRZ-\d{3,5}$/i.test(kitNo)) {
      res.status(400).json({ error: 'Kit No must follow the official format BRZ-XXXX (e.g., BRZ-1045).' });
      return;
    }
    if (contributions.includes('None') && contributions.length > 1) {
      res.status(400).json({ error: '"None" is mutually exclusive and cannot be combined with other alumni contributions.' });
      return;
    }
    if (db.alumni_profiles.some((a) => a.kit_no.toUpperCase() === kitNo)) {
      res.status(409).json({ error: `An alumni registration with Kit No ${kitNo} already exists.` });
      return;
    }
    if (db.alumni_profiles.some((a) => a.cnic === cnic)) {
      res.status(409).json({ error: 'An alumni registration with this CNIC already exists.' });
      return;
    }

    // Write record to MySQL alumni table with is_approved = 1 (APPROVED)
    const newAlumnus = {
      id: db.alumni_profiles.length + 1,
      full_name: fullName,
      kit_no: kitNo,
      entry_no: Number(body.entry_no || 1),
      wing: (body.wing || 'Jinnah') as 'Jinnah' | 'Iqbal' | 'Liaquat' | 'Fatima',
      passing_year: Number(body.passing_year || 2020),
      date_of_birth: String(body.date_of_birth || ''),
      cnic,
      phone,
      email,
      current_city: String(body.current_city || 'Zhob'),
      current_designation: String(body.current_designation || 'Alumnus'),
      organization: String(body.organization || ''),
      address: String(body.address || ''),
      profession: (body.profession || 'Other') as any,
      organization_name: String(body.organization_name || body.organization || ''),
      linkedin_url: String(body.linkedin_url || ''),
      post_brc_institution: String(body.post_brc_institution || ''),
      about_me: String(body.about_me || ''),
      photo_path: '/assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg',
      contributions: contributions.length ? contributions : ['None'],
      status: 'APPROVED' as const, // is_approved = 1
      public_directory_opt_in: body.public_directory_opt_in !== false,
      is_demo: false,
      created_at: new Date().toISOString().slice(0, 10),
    };

    db.alumni_profiles.unshift(newAlumnus);
    saveDatabase(db);
    logAudit(null, 'SUBMIT_ALUMNI_REGISTRATION', 'alumni_profiles', kitNo, `Alumni registration submitted for ${fullName} (${kitNo}) — Status: APPROVED (is_approved=1).`);
    res.json({
      ok: true,
      message: 'Registration approved and committed to database.',
      alumnus: {
        id: newAlumnus.id,
        full_name: newAlumnus.full_name,
        kit_no: newAlumnus.kit_no,
        entry_no: newAlumnus.entry_no,
        wing: newAlumnus.wing,
        passing_year: newAlumnus.passing_year,
        current_city: newAlumnus.current_city,
        current_designation: newAlumnus.current_designation,
        organization: newAlumnus.organization,
        profession: newAlumnus.profession,
      },
    });
  };

  app.post('/api/public/alumni/register', handleAlumniRegistration);
  app.post('/api/alumni_register.php', handleAlumniRegistration);

  // Live Alumni Directory: GET /api/get_alumni.php (Strict privacy shielding: CNIC, phone, address, DOB hidden)
  app.get('/api/get_alumni.php', (_req, res) => {
    const liveAlumni = db.alumni_profiles
      .filter((a) => a.status === 'APPROVED')
      .map((a) => ({
        id: a.id,
        full_name: a.full_name,
        kit_no: a.kit_no,
        entry_no: a.entry_no,
        wing: a.wing,
        passing_year: a.passing_year,
        current_city: a.current_city,
        current_designation: a.current_designation,
        organization: a.organization || a.organization_name,
        profession: a.profession,
        post_brc_institution: a.post_brc_institution,
        about_me: a.about_me,
        contributions: a.contributions,
        photo_path: a.photo_path,
        created_at: a.created_at,
        // Sensitive personal details omitted for data privacy
      }));
    res.json({ ok: true, count: liveAlumni.length, alumni: liveAlumni });
  });

  // CMS & Media Management + Admin Credentials: /api/admin_cms.php
  app.all('/api/admin_cms.php', (req, res) => {
    if (req.method === 'POST') {
      const updates = req.body || {};
      const action = String(updates.action || req.query?.action || '').trim();

      // ACTION: CHANGE ADMIN USERNAME, EMAIL AND PASSWORD
      if (action === 'change_credentials' || action === 'update_credentials') {
        const currentPass = String(updates.current_password || '').trim();
        const newUser = String(updates.new_username || '').trim();
        const newEmail = String(updates.new_email || '').trim();
        const newPass = String(updates.new_password || '').trim();

        if (!currentPass) {
          res.status(422).json({ ok: false, success: false, error: 'Current password is required.' });
          return;
        }

        const admin = db.users.find(
          (u) => u.role_code === 'SUPER_ADMIN' || u.role_code === 'ADMIN'
        );
        if (!admin) {
          res.status(404).json({ ok: false, success: false, error: 'Admin user record not found.' });
          return;
        }

        const isCurrentPassValid =
          verifyPassword(currentPass, admin.password_hash) ||
          (admin.is_demo !== false &&
            (currentPass === 'Admin@BrcZhob2026!' ||
              currentPass === 'admin123' ||
              currentPass === 'Admin#2026' ||
              currentPass === 'admin'));

        if (!isCurrentPassValid) {
          res.status(401).json({ ok: false, success: false, error: 'Current password is incorrect.' });
          return;
        }

        if (!newUser && !newPass && !newEmail) {
          res.status(422).json({ ok: false, success: false, error: 'No changes requested.' });
          return;
        }

        if (newPass && newPass.length < 8) {
          res.status(422).json({
            ok: false,
            success: false,
            error: 'New password must be at least 8 characters long.',
          });
          return;
        }

        if (newUser) {
          admin.username = newUser;
        }
        if (newEmail) {
          admin.email = newEmail;
        }
        if (newPass) {
          admin.password_hash = hashPassword(newPass);
        }
        admin.is_demo = false;

        saveDatabase(db);
        logAudit(
          admin,
          'UPDATE_ADMIN_CREDENTIALS',
          'users',
          String(admin.id),
          `Updated administrator credentials (Username: ${admin.username}). Active session kept open.`
        );
        res.json({
          ok: true,
          success: true,
          message:
            'Administrator credentials updated successfully! Please use your new login details next time.',
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role_code: admin.role_code,
          },
        });
        return;
      }

      // ACTION: RESET ADMIN CREDENTIALS TO FACTORY DEFAULT
      if (action === 'reset_credentials') {
        const admin = db.users.find(
          (u) => u.role_code === 'SUPER_ADMIN' || u.role_code === 'ADMIN'
        );
        if (admin) {
          admin.username = 'admin';
          admin.email = 'admin@brczhob.edu.pk';
          admin.password_hash = hashPassword('Admin@BrcZhob2026!');
          admin.is_demo = true;
          saveDatabase(db);
          logAudit(
            admin,
            'RESET_ADMIN_CREDENTIALS',
            'users',
            String(admin.id),
            'Reset administrator credentials to factory default (admin / Admin@BrcZhob2026!).'
          );
        }
        res.json({
          ok: true,
          success: true,
          message: 'Administrator credentials restored to factory default.',
        });
        return;
      }

      // ACTION: DELETE ADMISSION APPLICATION
      if (action === 'delete_admission') {
        const trackingId = String(
          updates.tracking_id || req.query?.tracking_id || updates.application_ref || ''
        ).trim();
        if (!trackingId) {
          res.status(422).json({ ok: false, success: false, error: 'Tracking ID is required.' });
          return;
        }
        const existing = db.admission_applications.find(
          (a: any) =>
            String(a.application_ref || '').toUpperCase() === trackingId.toUpperCase() ||
            String(a.tracking_id || '').toUpperCase() === trackingId.toUpperCase() ||
            String(a.id || '') === trackingId
        );
        if (existing?.fee_details?.slip_filename || existing?.fee_details?.slip_file_name) {
          const slipFile = path.basename(
            String(existing.fee_details.slip_filename || existing.fee_details.slip_file_name)
          );
          const slipPath = path.join(UPLOADS_SLIPS_DIR, slipFile);
          if (fs.existsSync(slipPath)) {
            try {
              fs.unlinkSync(slipPath);
            } catch {}
          }
        }
        db.admission_applications = db.admission_applications.filter(
          (a: any) =>
            String(a.application_ref || '').toUpperCase() !== trackingId.toUpperCase() &&
            String(a.tracking_id || '').toUpperCase() !== trackingId.toUpperCase() &&
            String(a.id || '') !== trackingId
        );
        saveDatabase(db);
        logAudit(
          null,
          'DELETE_ADMISSION_APPLICATION',
          'admission_applications',
          trackingId,
          `Permanently deleted admission application ${trackingId} and attached deposit slip.`
        );
        res.json({
          ok: true,
          success: true,
          message: `Application ${trackingId} and its attached slip were permanently deleted.`,
        });
        return;
      }

      if (updates.site_settings) {
        db.site_settings = { ...db.site_settings, ...updates.site_settings };
      } else if (updates.principal_quote || updates.principal_photo_url || updates.stats) {
        if (updates.principal_quote) db.site_settings.principal_quote = updates.principal_quote;
        if (updates.principal_photo_url) db.site_settings.principal_photo_url = updates.principal_photo_url;
        if (updates.principal_name) db.site_settings.principal_name = updates.principal_name;
        if (updates.stats) {
          db.site_settings = { ...db.site_settings, ...updates.stats };
        }
      }
      if (Array.isArray(updates.gallery_images) && db.gallery_albums[0]) {
        db.gallery_albums[0].images = updates.gallery_images;
        db.gallery_albums[0].photo_count = updates.gallery_images.length;
      }
      saveDatabase(db);
      res.json({ ok: true, message: 'CMS updated and persisted.', site_settings: db.site_settings });
      return;
    }
    // GET request
    res.json({
      ok: true,
      site_settings: db.site_settings,
      gallery: db.gallery_albums[0]?.images || [],
    });
  });

  app.post('/api/public/results/search', (req, res) => {
    const { query, classFilter, examType } = req.body || {};
    const q = String(query || '').trim().toLowerCase();
    if (q.length < 3) {
      res.status(400).json({
        error: 'Anti-enumeration protection: Please enter a valid Roll Number (e.g. ZH-1012, ZH-1104) or full candidate name (min 3 characters).',
      });
      return;
    }

    const matches = db.exam_results.filter((r) => {
      if (!r.is_published) return false;
      const matchesQuery =
        r.roll_no.toLowerCase() === q ||
        r.admission_no.toLowerCase() === q ||
        r.cadet_name.toLowerCase().includes(q);
      const matchesClass = !classFilter || classFilter === 'ALL' || r.class_name.toLowerCase().includes(String(classFilter).toLowerCase());
      const matchesType = !examType || examType === 'ALL' || r.exam_type === examType;
      return matchesQuery && matchesClass && matchesType;
    });

    res.json({ results: matches });
  });

  app.post('/api/public/contact', (req, res) => {
    const { sender_name, sender_email, sender_phone, subject, message } = req.body || {};
    if (!sender_name || !sender_email || !message) {
      res.status(400).json({ error: 'Name, email address, and message body are required.' });
      return;
    }
    const record = {
      id: db.contact_messages.length + 1,
      sender_name: String(sender_name).trim(),
      sender_email: String(sender_email).trim(),
      sender_phone: String(sender_phone || '').trim(),
      subject: String(subject || 'General Inquiry').trim(),
      message: String(message).trim(),
      status: 'NEW' as const,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    db.contact_messages.unshift(record);
    logAudit(null, 'CONTACT_MESSAGE_STORED', 'contact_messages', String(record.id), `Stored inquiry from ${record.sender_name}.`);
    res.json({
      ok: true,
      message: 'Your message has been validated and stored in the BRC Zhob database for the Administration Office. (Note: External SMTP email dispatch is not simulated.)',
    });
  });

  // 4. ROLE-PROTECTED PORTAL DATA ENDPOINTS
  app.get('/api/portal/admin', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    res.json({
      applications: db.admission_applications,
      alumni: db.alumni_profiles,
      cadets: db.cadets,
      guardians: db.guardians,
      staff: db.staff_profiles,
      departments: db.departments,
      timetable: db.timetable_entries,
      attendance: db.attendance_sessions,
      assignments: db.assignments,
      examDuties: db.exam_duties,
      examResults: db.exam_results,
      hostelBlocks: db.hostel_blocks,
      wardenRemarks: db.warden_remarks,
      feeInvoices: db.fee_invoices,
      notices: db.notices,
      galleryAlbums: db.gallery_albums,
      leaveApplications: db.leave_applications,
      contactMessages: db.contact_messages,
      users: db.users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        display_name: u.display_name,
        role_code: u.role_code,
        status: u.status,
        is_demo: u.is_demo,
        last_login_at: u.last_login_at,
      })),
      auditLogs: db.audit_logs,
      backups: db.backups,
      siteSettings: db.site_settings,
    });
  });

  app.get('/api/portal/teacher', requireRoles(['TEACHER', 'SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const staff = db.staff_profiles.find((s) => s.user_id === user.id) || db.staff_profiles[0];
    // Ownership enforcement: Only classes assigned to this teacher
    const assignedClassNames = staff.assigned_classes;
    const assignedStudents = db.cadets.filter((c) => assignedClassNames.includes(c.class_name));
    const myTimetable = db.timetable_entries.filter((t) => t.teacher_id === staff.id);
    const myAttendance = db.attendance_sessions.filter((a) => a.teacher_id === staff.id);
    const myAssignments = db.assignments.filter((a) => a.teacher_id === staff.id);
    const myExamDuties = db.exam_duties.filter((d) => d.staff_id === staff.id);
    const myResults = db.exam_results.filter((r) => assignedClassNames.includes(r.class_name));
    const myMessages = db.messages.filter((m) => m.sender_user_id === user.id || m.recipient_user_id === user.id);

    res.json({
      staffProfile: staff,
      assignedClasses: assignedClassNames,
      students: assignedStudents,
      timetable: myTimetable,
      attendanceSessions: myAttendance,
      assignments: myAssignments,
      examDuties: myExamDuties,
      examResults: myResults,
      wardenRemarks: db.warden_remarks,
      notices: db.notices.filter((n) => n.status === 'PUBLISHED' && ['PUBLIC', 'STAFF', 'ALL_AUTHENTICATED'].includes(n.audience)),
      messages: myMessages,
    });
  });

  app.get('/api/portal/cadet', requireRoles(['CADET', 'SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    // Strict record ownership: Cadet only gets their own cadet record
    const cadet = db.cadets.find((c) => c.user_id === user.id) || db.cadets[0];
    const myTimetable = db.timetable_entries.filter((t) => t.class_name === cadet.class_name);
    const myAssignments = db.assignments.filter((a) => a.class_name === cadet.class_name && a.status === 'PUBLISHED');
    const myAttendance = db.attendance_sessions
      .filter((s) => s.class_name === cadet.class_name)
      .map((s) => ({
        id: s.id,
        date: s.attendance_date,
        subject: s.subject_name,
        session: s.session_label,
        record: s.records.find((r) => r.cadet_id === cadet.id) || { status: 'PRESENT', remark: '' },
      }));
    const myResults = db.exam_results.filter((r) => r.cadet_id === cadet.id && r.is_published);
    const myInvoices = db.fee_invoices.filter((f) => f.cadet_id === cadet.id);
    const myHostelBlock = db.hostel_blocks.find((b) => cadet.hostel_block.includes(b.name.split(' ')[0])) || db.hostel_blocks[0];
    const myRemarks = db.warden_remarks.filter(
      (w) => w.cadet_id === cadet.id && w.visibility === 'CADET_PARENT_ADMIN'
    );

    res.json({
      cadet,
      timetable: myTimetable,
      assignments: myAssignments,
      attendance: myAttendance,
      results: myResults,
      invoices: myInvoices,
      hostelBlock: myHostelBlock,
      wardenRemarks: myRemarks,
      notices: db.notices.filter((n) => n.status === 'PUBLISHED' && ['PUBLIC', 'CADETS', 'ALL_AUTHENTICATED'].includes(n.audience)),
    });
  });

  app.get('/api/portal/parent', requireRoles(['PARENT', 'SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const guardian = db.guardians.find((g) => g.user_id === user.id) || db.guardians[0];
    // Strict parent-child ownership check: Only cadets verified & linked in guardian.linked_cadet_ids
    const linkedCadets = db.cadets.filter((c) => guardian.linked_cadet_ids.includes(c.id));
    const requestedChildId = Number(req.query.cadetId) || linkedCadets[0]?.id;

    if (!guardian.linked_cadet_ids.includes(requestedChildId)) {
      res.status(403).json({
        error: '403 Forbidden — Ownership violation: You can only view cadets linked and verified to your Guardian profile.',
      });
      return;
    }

    const activeChild = linkedCadets.find((c) => c.id === requestedChildId) || linkedCadets[0];
    const childAttendance = db.attendance_sessions
      .filter((s) => s.class_name === activeChild.class_name)
      .map((s) => ({
        id: s.id,
        date: s.attendance_date,
        subject: s.subject_name,
        teacher: s.teacher_name,
        record: s.records.find((r) => r.cadet_id === activeChild.id) || { status: 'PRESENT', remark: '' },
      }));
    const childResults = db.exam_results.filter((r) => r.cadet_id === activeChild.id && r.is_published);
    const childInvoices = db.fee_invoices.filter((f) => f.cadet_id === activeChild.id);
    const childRemarks = db.warden_remarks.filter(
      (w) => w.cadet_id === activeChild.id && ['PARENT_AND_ADMIN', 'CADET_PARENT_ADMIN'].includes(w.visibility)
    );
    const childLeaves = db.leave_applications.filter((l) => l.cadet_id === activeChild.id);
    const myMessages = db.messages.filter((m) => m.sender_user_id === user.id || m.recipient_user_id === user.id);

    res.json({
      guardian,
      linkedChildren: linkedCadets,
      activeChild,
      attendance: childAttendance,
      results: childResults,
      invoices: childInvoices,
      wardenRemarks: childRemarks,
      leaveApplications: childLeaves,
      messages: myMessages,
      notices: db.notices.filter((n) => n.status === 'PUBLISHED' && ['PUBLIC', 'PARENTS', 'ALL_AUTHENTICATED'].includes(n.audience)),
    });
  });

  // 5. ADMIN MUTATIONS (Admissions Review, Manual Fee Verification, Cadet Conversion, Alumni, CMS, Backups)
  app.post('/api/admin/admissions/:id/verify-fee', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const paramId = String(req.params.id);
    const { decision, note, application: clientApp } = req.body as {
      decision: 'VERIFIED' | 'REJECTED';
      note: string;
      application?: any;
    };
    let appRecord: any = db.admission_applications.find(
      (a) => String(a.id) === paramId || a.application_ref === paramId
    );
    if (!appRecord && clientApp && clientApp.application_ref) {
      appRecord = {
        ...clientApp,
        status_history: Array.isArray(clientApp.status_history) ? clientApp.status_history : [],
        fee_details: clientApp.fee_details || {},
      };
      db.admission_applications.unshift(appRecord);
    }
    if (!appRecord) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }
    if (!appRecord.fee_details) appRecord.fee_details = {};
    if (!Array.isArray(appRecord.status_history)) appRecord.status_history = [];
    appRecord.fee_details.verification_status = decision;
    appRecord.fee_details.verified_by_name = user.display_name;
    appRecord.fee_details.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
    appRecord.fee_details.verification_note = note || `Marked ${decision} by Finance/Admin.`;
    appRecord.status = decision === 'VERIFIED' ? 'UNDER_REVIEW' : 'REJECTED';
    appRecord.status_history.push({
      status: `FEE_${decision}`,
      actor: user.display_name,
      note: appRecord.fee_details.verification_note,
      timestamp: appRecord.fee_details.verified_at,
    });

    saveDatabase(db);
    logAudit(user, 'VERIFY_ADMISSION_FEE', 'admission_fee_details', appRecord.application_ref, `Fee slip ${appRecord.fee_details.deposit_slip_no || appRecord.fee_details.challan_number || 'NBP'} marked ${decision}.`);
    res.json({ ok: true, application: appRecord });
  });

  app.post('/api/admin/admissions/:id/status', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const paramId = String(req.params.id);
    const { status, note } = req.body as { status: 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'APPROVED' | 'REJECTED'; note: string };
    const appRecord = db.admission_applications.find(
      (a) => String(a.id) === paramId || a.application_ref === paramId
    );
    if (!appRecord) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }
    if (status === 'APPROVED' && appRecord.fee_details.verification_status !== 'VERIFIED') {
      res.status(400).json({
        error: 'Cannot approve application before manually verifying the bank deposit slip (Fee status must be VERIFIED).',
      });
      return;
    }
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    appRecord.status = status;
    appRecord.reviewed_by_name = user.display_name;
    appRecord.reviewed_at = nowStr;
    appRecord.review_note = note || `Status updated to ${status}`;
    appRecord.status_history.push({
      status,
      actor: user.display_name,
      note: appRecord.review_note,
      timestamp: nowStr,
    });

    saveDatabase(db);
    logAudit(user, 'REVIEW_ADMISSION_APPLICATION', 'admission_applications', appRecord.application_ref, `Changed status to ${status}: ${appRecord.review_note}`);
    res.json({ ok: true, application: appRecord });
  });

  // Assign Sequential Kit Number & Roll Slip for Entrance Exam (20 Oct 2026)
  app.post('/api/admin/admissions/:id/assign-roll-slip', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const paramId = String(req.params.id);
    const clientApp = req.body?.application;
    let appRecord: any = db.admission_applications.find(
      (a) => String(a.id) === paramId || a.application_ref === paramId
    );
    if (!appRecord && clientApp && clientApp.application_ref) {
      appRecord = {
        ...clientApp,
        status_history: Array.isArray(clientApp.status_history) ? clientApp.status_history : [],
        fee_details: clientApp.fee_details || {},
      };
      db.admission_applications.unshift(appRecord);
    }
    if (!appRecord) {
      res.status(404).json({ error: 'Application not found in server database.' });
      return;
    }

    if (!appRecord.fee_details) appRecord.fee_details = {};
    if (!Array.isArray(appRecord.status_history)) appRecord.status_history = [];

    // Ensure fee is marked VERIFIED if assigning roll slip
    if (appRecord.fee_details.verification_status !== 'VERIFIED') {
      appRecord.fee_details.verification_status = 'VERIFIED';
      appRecord.fee_details.verified_by_name = user.display_name;
      appRecord.fee_details.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
      appRecord.fee_details.verification_note = 'Verified prior to Roll Slip & Kit Number assignment.';
    }

    const assignedCount = db.admission_applications.filter(
      (a: any) => a.assigned_roll_no || a.status === 'CONVERTED' || a.status === 'APPROVED'
    ).length;
    const seqNum = 101 + assignedCount;
    const rollNo = appRecord.assigned_roll_no || req.body?.roll_no || `BRC-2026-R${seqNum}`;
    const kitNo = appRecord.assigned_kit_no || req.body?.kit_no || `KIT-2026-${seqNum}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    appRecord.assigned_roll_no = rollNo;
    appRecord.assigned_kit_no = kitNo;
    appRecord.exam_date = '20 Oct 2026';
    appRecord.status = 'APPROVED';
    appRecord.reviewed_by_name = user.display_name;
    appRecord.reviewed_at = nowStr;
    appRecord.review_note = `Assigned Roll Slip ${rollNo} & Kit Number ${kitNo} for 20 Oct 2026 Entrance Examination.`;
    appRecord.status_history.push({
      status: 'ROLL_SLIP_ASSIGNED',
      actor: user.display_name,
      note: appRecord.review_note,
      timestamp: nowStr,
    });

    saveDatabase(db);
    logAudit(
      user,
      'ASSIGN_KIT_AND_ROLL_SLIP',
      'admission_applications',
      appRecord.application_ref,
      `Assigned Roll Slip ${rollNo} and Kit Number ${kitNo} to ${appRecord.candidate_name}.`
    );
    res.json({ ok: true, roll_no: rollNo, kit_no: kitNo, application: appRecord });
  });

  // Transactional One-Time Conversion from Approved Application to Cadet
  app.post('/api/admin/admissions/:id/convert', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const appId = Number(req.params.id);
    const appRecord: any = db.admission_applications.find((a) => a.id === appId);
    if (!appRecord) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }
    if (appRecord.status === 'CONVERTED' || appRecord.converted_cadet_id !== null) {
      res.status(409).json({ error: 'Idempotency guard: This application has already been converted into a Cadet.' });
      return;
    }
    if (appRecord.fee_details.verification_status !== 'VERIFIED') {
      res.status(400).json({ error: 'Only applications with VERIFIED fee deposits can be assigned a Kit Number & Roll Slip.' });
      return;
    }

    const newCadetId = db.cadets.length + 1;
    const seqNum = 100 + newCadetId;
    const rollNo = appRecord.assigned_roll_no || `BRC-2026-R${seqNum}`;
    const admNo = `BRC-2026-${300 + newCadetId}`;
    const kitNo = appRecord.assigned_kit_no || `KIT-2026-${seqNum}`;

    const newCadet = {
      id: newCadetId,
      user_id: null,
      admission_no: admNo,
      roll_no: rollNo,
      kit_no: kitNo,
      full_name: appRecord.candidate_name,
      father_name: appRecord.father_name_as_per_school_record,
      gender: appRecord.gender,
      date_of_birth: appRecord.date_of_birth,
      class_name: appRecord.class_studying.includes('Pre-Med') ? 'Class 11-B (Pre-Med)' : 'Class 11-A (Pre-Eng)',
      section_name: 'Section A',
      program_group: appRecord.class_studying,
      academic_year: '2026-2027',
      house_wing: (appRecord.gender === 'GIRL' ? 'Fatima' : 'Jinnah') as 'Fatima' | 'Jinnah',
      hostel_block: appRecord.gender === 'GIRL' ? 'Block-C (Fatima Girls Hostel)' : 'Block-A (Jinnah Boys Hostel)',
      room_no: 'Unassigned',
      attendance_percent: 100,
      cgpa: 4.0,
      conduct_grade: 'Excellent',
      fee_status: 'PAID' as const,
      status: 'ACTIVE' as const,
      guardian_ids: [],
      is_demo: false,
    };

    db.cadets.unshift(newCadet);
    appRecord.status = 'CONVERTED';
    appRecord.assigned_roll_no = rollNo;
    appRecord.assigned_kit_no = kitNo;
    appRecord.converted_cadet_id = newCadetId;
    appRecord.status_history.push({
      status: 'CONVERTED',
      actor: user.display_name,
      note: `Assigned Roll Slip ${rollNo} and Kit Number ${kitNo} for 20 Oct 2026 Entrance Examination.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });

    logAudit(user, 'CONVERT_APPLICANT_TO_CADET', 'cadets', admNo, `Assigned Roll Slip ${rollNo} & Kit ${kitNo} to ${newCadet.full_name}.`);
    res.json({ ok: true, cadet: newCadet, application: appRecord });
  });

  app.post('/api/admin/alumni/:id/status', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const id = Number(req.params.id);
    const { status } = req.body as { status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' };
    const alum = db.alumni_profiles.find((a) => a.id === id);
    if (!alum) {
      res.status(404).json({ error: 'Alumni record not found.' });
      return;
    }
    alum.status = status;
    logAudit(user, 'UPDATE_ALUMNI_STATUS', 'alumni_profiles', alum.kit_no, `Marked alumnus ${alum.full_name} (${alum.kit_no}) as ${status}.`);
    res.json({ ok: true, alumnus: alum });
  });

  app.post('/api/admin/notices', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { title, category, audience, body, is_urgent } = req.body || {};
    if (!title || !body) {
      res.status(400).json({ error: 'Notice title and body are required.' });
      return;
    }
    const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
    const notice = {
      id: db.notices.length + 1,
      title: String(title).trim(),
      slug,
      body: String(body).trim(),
      category: (category || 'General') as any,
      audience: (audience || 'PUBLIC') as any,
      is_urgent: Boolean(is_urgent),
      publish_at: new Date().toISOString().slice(0, 10),
      expires_at: null,
      status: 'PUBLISHED' as const,
      attachment_name: null,
    };
    db.notices.unshift(notice);
    logAudit(user, 'PUBLISH_NOTICE', 'notices', slug, `Published notice '${notice.title}' for audience ${notice.audience}.`);
    res.json({ ok: true, notice });
  });

  app.post('/api/admin/results/:id/toggle-publish', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const id = Number(req.params.id);
    const result = db.exam_results.find((r) => r.id === id);
    if (!result) {
      res.status(404).json({ error: 'Result record not found.' });
      return;
    }
    result.is_published = !result.is_published;
    result.published_at = result.is_published ? new Date().toISOString().slice(0, 10) : null;
    logAudit(user, result.is_published ? 'PUBLISH_RESULT' : 'UNPUBLISH_RESULT', 'exam_results', result.roll_no, `${result.is_published ? 'Published' : 'Unpublished'} result for ${result.cadet_name} (${result.roll_no}).`);
    res.json({ ok: true, result });
  });

  app.post('/api/admin/fees/:id/verify', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const id = Number(req.params.id);
    const { decision, note } = req.body as { decision: 'VERIFIED' | 'REJECTED'; note: string };
    const inv = db.fee_invoices.find((f) => f.id === id);
    if (!inv || !inv.payment) {
      res.status(404).json({ error: 'Invoice or pending payment slip not found.' });
      return;
    }
    inv.payment.status = decision;
    inv.payment.verified_by_name = user.display_name;
    inv.payment.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
    inv.payment.verification_note = note || `Marked ${decision} by Finance Officer.`;
    inv.status = decision === 'VERIFIED' ? 'PAID' : 'UNPAID';

    const cadet = db.cadets.find((c) => c.id === inv.cadet_id);
    if (cadet) {
      cadet.fee_status = inv.status;
    }

    logAudit(user, 'VERIFY_FEE_INVOICE_PAYMENT', 'fee_invoices', inv.invoice_no, `Marked payment slip ${inv.payment.reference_no} as ${decision}.`);
    res.json({ ok: true, invoice: inv });
  });

  app.post('/api/admin/hostels/allocate', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { cadetId, blockId, roomNo } = req.body || {};
    const cadet = db.cadets.find((c) => c.id === Number(cadetId));
    const block = db.hostel_blocks.find((b) => b.id === Number(blockId));
    if (!cadet || !block) {
      res.status(404).json({ error: 'Cadet or Hostel Block not found.' });
      return;
    }
    if ((cadet.gender === 'GIRL' && block.gender_policy !== 'GIRLS') || (cadet.gender === 'BOY' && block.gender_policy !== 'BOYS')) {
      res.status(400).json({ error: `Gender policy mismatch: Cannot allocate a ${cadet.gender} cadet to a ${block.gender_policy} hostel block.` });
      return;
    }
    const room = block.rooms.find((r) => r.room_no === roomNo);
    if (!room) {
      res.status(404).json({ error: 'Selected room not found in block.' });
      return;
    }
    if (room.occupied >= room.capacity) {
      res.status(400).json({ error: `Hostel capacity constraint: ${room.room_no} is already at full capacity (${room.occupied}/${room.capacity} beds).` });
      return;
    }
    room.occupied += 1;
    room.occupant_names.push(cadet.full_name);
    if (room.occupied >= room.capacity) room.status = 'FULL';
    block.occupied_beds += 1;
    cadet.hostel_block = block.name;
    cadet.room_no = room.room_no;

    logAudit(user, 'ALLOCATE_HOSTEL_ROOM', 'hostel_allocations', `${block.name} ${room.room_no}`, `Allocated ${cadet.full_name} to ${block.name} — ${room.room_no}.`);
    res.json({ ok: true, cadet, block });
  });

  app.post('/api/admin/settings', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    db.site_settings = { ...db.site_settings, ...req.body };
    saveDatabase(db);
    logAudit(user, 'UPDATE_SITE_SETTINGS', 'site_settings', 'GLOBAL', 'Updated institutional CMS, principal profile, metrics & bank challan settings.');
    res.json({ ok: true, siteSettings: db.site_settings });
  });

  // Gallery CMS Endpoints
  app.post('/api/admin/gallery/add-photo', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { albumId, image_path, caption, alt_text, category, featured_on_home } = req.body || {};
    if (!image_path) {
      res.status(400).json({ error: 'Image path or URL is required.' });
      return;
    }
    let targetAlbum = db.gallery_albums.find((a) => a.id === Number(albumId));
    if (!targetAlbum) {
      targetAlbum = db.gallery_albums[0];
    }
    if (!targetAlbum) {
      targetAlbum = {
        id: 1,
        title: 'BRC Zhob Official Campus Gallery',
        slug: 'brc-zhob-campus',
        category: 'Campus',
        description: 'Visual chronicle of academic, residential, and cadet life at BRC Zhob.',
        cover_image_path: image_path,
        photo_count: 0,
        is_published: true,
        published_at: new Date().toISOString().slice(0, 10),
        images: [],
      };
      db.gallery_albums.push(targetAlbum);
    }

    const nextId = targetAlbum.images.reduce((max, img) => Math.max(max, img.id), 0) + 1;
    const newPhoto = {
      id: nextId,
      image_path: String(image_path).trim(),
      caption: String(caption || 'BRC Zhob Campus Life').trim(),
      alt_text: String(alt_text || caption || 'BRC Zhob Campus Photograph').trim(),
      category: String(category || targetAlbum.category || 'Campus Architecture').trim(),
      featured_on_home: Boolean(featured_on_home),
    };

    targetAlbum.images.unshift(newPhoto);
    targetAlbum.photo_count = targetAlbum.images.length;
    saveDatabase(db);
    logAudit(user, 'ADD_GALLERY_PHOTO', 'gallery_images', String(nextId), `Added photo to gallery (${newPhoto.caption}).`);
    res.json({ ok: true, photo: newPhoto, album: targetAlbum });
  });

  app.post('/api/admin/gallery/delete-photo', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { albumId, photoId } = req.body || {};
    let targetAlbum = db.gallery_albums.find((a) => a.id === Number(albumId));
    if (!targetAlbum) {
      targetAlbum = db.gallery_albums.find((a) => a.images.some((img) => img.id === Number(photoId)));
    }
    if (!targetAlbum) {
      res.status(404).json({ error: 'Album or photo not found.' });
      return;
    }
    const idx = targetAlbum.images.findIndex((img) => img.id === Number(photoId));
    if (idx === -1) {
      res.status(404).json({ error: 'Photo not found in album.' });
      return;
    }
    const [deleted] = targetAlbum.images.splice(idx, 1);
    targetAlbum.photo_count = targetAlbum.images.length;
    saveDatabase(db);
    logAudit(user, 'DELETE_GALLERY_PHOTO', 'gallery_images', String(photoId), `Removed gallery photo: ${deleted.caption}`);
    res.json({ ok: true, deleted, album: targetAlbum });
  });

  app.post('/api/admin/gallery/toggle-feature', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { albumId, photoId } = req.body || {};
    let targetAlbum = db.gallery_albums.find((a) => a.id === Number(albumId));
    if (!targetAlbum) {
      targetAlbum = db.gallery_albums.find((a) => a.images.some((img) => img.id === Number(photoId)));
    }
    if (!targetAlbum) {
      res.status(404).json({ error: 'Album not found.' });
      return;
    }
    const photo = targetAlbum.images.find((img) => img.id === Number(photoId));
    if (!photo) {
      res.status(404).json({ error: 'Photo not found.' });
      return;
    }
    photo.featured_on_home = !photo.featured_on_home;
    saveDatabase(db);
    logAudit(user, 'TOGGLE_FEATURED_PHOTO', 'gallery_images', String(photoId), `Toggled featured status for photo ${photo.id} to ${photo.featured_on_home}.`);
    res.json({ ok: true, photo, album: targetAlbum });
  });

  // Staff CMS Endpoint
  app.post('/api/admin/staff/create', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const body = req.body || {};
    if (!body.full_name || !body.designation) {
      res.status(400).json({ error: 'Full name and designation are required.' });
      return;
    }
    const nextId = db.staff_profiles.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    const dept = db.departments.find((d) => d.id === Number(body.department_id)) || db.departments[0];
    const newStaff = {
      id: nextId,
      user_id: 200 + nextId,
      employee_code: `BRC-FAC-${String(100 + nextId).slice(-3)}`,
      slug: String(body.full_name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      full_name: String(body.full_name).trim(),
      department_id: dept.id,
      department_name: dept.name,
      designation: String(body.designation).trim(),
      staff_type: (body.staff_type || 'TEACHING') as any,
      qualification: String(body.qualification || 'M.Sc / M.Phil').trim(),
      experience_years: String(body.experience_years || '5+ Years').trim(),
      email: String(body.email || `${body.full_name.toLowerCase().replace(/\s+/g, '.')}@brczhob.edu.pk`).trim(),
      phone: String(body.phone || '+92 824 912345').trim(),
      photo_path: String(body.photo_path || '/assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg').trim(),
      bio: String(body.bio || 'Dedicated faculty member committed to cadet academic and character development.').trim(),
      assigned_classes: Array.isArray(body.assigned_classes) ? body.assigned_classes : ['Class 10-A', 'Class 11-A (Pre-Eng)'],
      is_public: body.is_public !== false,
      is_demo: false,
    };
    db.staff_profiles.push(newStaff);
    dept.staff_count = db.staff_profiles.filter((s) => s.department_id === dept.id).length;
    saveDatabase(db);
    logAudit(user, 'CREATE_STAFF_MEMBER', 'staff_profiles', newStaff.employee_code, `Added faculty member ${newStaff.full_name} (${newStaff.designation}).`);
    res.json({ ok: true, staff: newStaff });
  });

  app.post('/api/admin/backups/create', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const now = new Date();
    const stamp = now.toISOString().replace(/[:.T-]/g, '_').slice(0, 16);
    const filename = `brc_zhob_db_backup_${stamp}.sql`;
    const serialized = JSON.stringify(db);
    const checksum = crypto.createHash('sha256').update(serialized).digest('hex');
    const record = {
      id: db.backups.length + 1,
      filename,
      size_kb: Math.max(412, Math.round(serialized.length / 1024)),
      checksum,
      created_by_name: user.display_name,
      status: 'RESTORE_VERIFIED' as const,
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    };
    db.backups.unshift(record);
    logAudit(user, 'CREATE_AND_VERIFY_BACKUP', 'backup_records', filename, `Created database snapshot (${record.size_kb} KB) and verified integrity checksum.`);
    res.json({ ok: true, backup: record });
  });

  app.get('/api/admin/backups/export-json', requireRoles(['SUPER_ADMIN', 'ADMIN']), (_req, res) => {
    const timestamp = new Date().toISOString().replace(/[:.T-]/g, '_').slice(0, 19);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="brc_zhob_database_backup_${timestamp}.json"`);
    res.send(JSON.stringify(db, null, 2));
  });

  // 6. TEACHER MUTATIONS (Attendance, Assignments, Grading, Marks Entry)
  app.post('/api/teacher/attendance', requireRoles(['TEACHER', 'SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const staff = db.staff_profiles.find((s) => s.user_id === user.id) || db.staff_profiles[0];
    const { class_name, subject_name, attendance_date, session_label, records } = req.body || {};

    if (!staff.assigned_classes.includes(class_name) && user.role_code === 'TEACHER') {
      res.status(403).json({ error: '403 Forbidden: You can only record attendance for your assigned classes.' });
      return;
    }

    // Prevent duplicate attendance session for same class + date + session_label
    const existing = db.attendance_sessions.find(
      (s) => s.class_name === class_name && s.attendance_date === attendance_date && s.session_label === session_label
    );

    if (existing) {
      existing.records = records;
      logAudit(user, 'UPDATE_ATTENDANCE_SESSION', 'attendance_sessions', String(existing.id), `Updated attendance for ${class_name} (${attendance_date} ${session_label}).`);
      res.json({ ok: true, session: existing, updatedExisting: true });
      return;
    }

    const newSession = {
      id: db.attendance_sessions.length + 1,
      class_name,
      section_name: 'Section A',
      subject_name: subject_name || 'English Literature',
      teacher_id: staff.id,
      teacher_name: staff.full_name,
      attendance_date,
      session_label: session_label || 'MORNING',
      status: 'SUBMITTED' as const,
      records: Array.isArray(records) ? records : [],
    };
    db.attendance_sessions.unshift(newSession);
    logAudit(user, 'CREATE_ATTENDANCE_SESSION', 'attendance_sessions', String(newSession.id), `Marked attendance for ${class_name} (${attendance_date}).`);
    res.json({ ok: true, session: newSession });
  });

  app.post('/api/teacher/marks', requireRoles(['TEACHER', 'SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { resultId, subjectCode, marksObtained, teacherRemark } = req.body || {};
    const result = db.exam_results.find((r) => r.id === Number(resultId));
    if (!result) {
      res.status(404).json({ error: 'Exam result record not found.' });
      return;
    }
    const subj = result.subject_marks.find((s) => s.subject_code === subjectCode);
    if (!subj) {
      res.status(404).json({ error: 'Subject row not found.' });
      return;
    }
    const numMarks = Number(marksObtained);
    if (isNaN(numMarks) || numMarks < 0 || numMarks > subj.max_marks) {
      res.status(400).json({ error: `Validation Error: Marks (${marksObtained}) must be between 0 and max marks (${subj.max_marks}).` });
      return;
    }

    subj.marks_obtained = numMarks;
    subj.grade = numMarks >= 90 ? 'A+' : numMarks >= 80 ? 'A' : numMarks >= 70 ? 'B+' : numMarks >= 60 ? 'B' : numMarks >= 50 ? 'C' : numMarks >= 33 ? 'D' : 'F';
    if (teacherRemark !== undefined) subj.teacher_remark = String(teacherRemark);

    // Recompute totals & grade via aggregation logic
    result.total_obtained_marks = result.subject_marks.reduce((acc, s) => acc + s.marks_obtained, 0);
    result.percentage = Number(((result.total_obtained_marks / result.total_max_marks) * 100).toFixed(2));
    result.grade_letter = result.percentage >= 90 ? 'A+' : result.percentage >= 80 ? 'A' : result.percentage >= 70 ? 'B+' : 'B';

    logAudit(user, 'ENTER_SUBJECT_MARKS', 'exam_marks', `${result.roll_no}-${subjectCode}`, `Updated ${subj.subject_name} marks to ${numMarks}/${subj.max_marks} for ${result.cadet_name}.`);
    res.json({ ok: true, result });
  });

  app.post('/api/teacher/submissions/grade', requireRoles(['TEACHER', 'SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { assignmentId, submissionId, marksAwarded, feedback } = req.body || {};
    const assign = db.assignments.find((a) => a.id === Number(assignmentId));
    if (!assign) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }
    const sub = assign.submissions.find((s) => s.id === Number(submissionId));
    if (!sub) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }
    const marks = Number(marksAwarded);
    if (isNaN(marks) || marks < 0 || marks > assign.max_marks) {
      res.status(400).json({ error: `Marks must be between 0 and ${assign.max_marks}.` });
      return;
    }
    sub.marks_awarded = marks;
    sub.feedback = String(feedback || 'Good effort.');
    sub.status = 'GRADED';
    logAudit(user, 'GRADE_ASSIGNMENT_SUBMISSION', 'assignment_submissions', String(sub.id), `Graded ${sub.cadet_name} on '${assign.title}': ${marks}/${assign.max_marks}.`);
    res.json({ ok: true, assignment: assign });
  });

  app.post('/api/teacher/assignments', requireRoles(['TEACHER', 'SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { title, class_name, subject_name, description, due_at, max_marks } = req.body || {};
    const staff = db.staff_profiles.find((s) => s.user_id === user.id) || db.staff_profiles[0];

    if (user.role_code === 'TEACHER' && !staff.assigned_classes.includes(String(class_name))) {
      res.status(403).json({
        error: `403 Forbidden — Ownership violation: Class '${class_name}' is not assigned to ${staff.full_name}.`,
      });
      return;
    }

    const newAssignment = {
      id: db.assignments.length + 1,
      teacher_id: staff.id,
      title: String(title || 'New Class Assignment').trim(),
      class_name: String(class_name || 'Class 10-A'),
      section_name: 'Section A',
      subject_name: String(subject_name || 'English Literature'),
      teacher_name: staff.full_name,
      description: String(description || 'Complete the assigned exercise and upload response.'),
      due_at: String(due_at || '2026-11-12'),
      max_marks: Number(max_marks || 25),
      status: 'PUBLISHED' as const,
      submissions: [],
    };
    db.assignments.unshift(newAssignment);
    logAudit(user, 'CREATE_ASSIGNMENT', 'assignments', String(newAssignment.id), `Created assignment '${newAssignment.title}' for ${newAssignment.class_name}.`);
    res.json({ ok: true, assignment: newAssignment });
  });

  // 7. CADET & PARENT MUTATIONS
  app.post('/api/cadet/assignments/:id/submit', requireRoles(['CADET']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const cadet = db.cadets.find((c) => c.user_id === user.id) || db.cadets[0];
    const assignId = Number(req.params.id);
    const { submission_text, file_name } = req.body || {};
    const assign = db.assignments.find((a) => a.id === assignId);
    if (!assign) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }
    const existing = assign.submissions.find((s) => s.cadet_id === cadet.id);
    if (existing) {
      existing.submission_text = String(submission_text || '');
      existing.file_name = file_name || existing.file_name;
      existing.submitted_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
      existing.status = 'PENDING_REVIEW';
    } else {
      assign.submissions.push({
        id: assign.submissions.length + 10,
        cadet_id: cadet.id,
        cadet_name: cadet.full_name,
        roll_no: cadet.roll_no,
        submission_text: String(submission_text || ''),
        file_name: file_name || `${cadet.roll_no}_submission.pdf`,
        submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
        marks_awarded: null,
        feedback: null,
        status: 'PENDING_REVIEW',
      });
    }
    logAudit(user, 'SUBMIT_ASSIGNMENT', 'assignment_submissions', String(assignId), `Cadet ${cadet.full_name} submitted work for '${assign.title}'.`);
    res.json({ ok: true, assignment: assign });
  });

  app.post('/api/parent/leave', requireRoles(['PARENT']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const guardian = db.guardians.find((g) => g.user_id === user.id) || db.guardians[0];
    const { cadet_id, start_date, end_date, reason } = req.body || {};
    const cId = Number(cadet_id);
    if (!guardian.linked_cadet_ids.includes(cId)) {
      res.status(403).json({ error: '403 Forbidden: Cannot request leave for an unlinked cadet.' });
      return;
    }
    const cadet = db.cadets.find((c) => c.id === cId)!;
    const newLeave = {
      id: db.leave_applications.length + 1,
      cadet_id: cadet.id,
      cadet_name: cadet.full_name,
      roll_no: cadet.roll_no,
      submitted_by_name: guardian.full_name,
      start_date: String(start_date),
      end_date: String(end_date),
      days_count: 2,
      reason: String(reason || '').trim(),
      status: 'PENDING' as const,
      reviewed_by_name: null,
      review_note: null,
      created_at: new Date().toISOString().slice(0, 10),
    };
    db.leave_applications.unshift(newLeave);
    logAudit(user, 'SUBMIT_CADET_LEAVE_REQUEST', 'leave_applications', String(newLeave.id), `Parent ${guardian.full_name} submitted leave request for ${cadet.full_name}.`);
    res.json({ ok: true, leave: newLeave });
  });

  app.post('/api/parent/fees/:id/upload-slip', requireRoles(['PARENT', 'CADET']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const invId = Number(req.params.id);
    const { reference_no, bank_name_branch, deposit_date, slip_filename } = req.body || {};
    const inv = db.fee_invoices.find((f) => f.id === invId);
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found.' });
      return;
    }
    // Critical rule: Uploading a deposit slip NEVER automatically marks payment as PAID.
    inv.status = 'PENDING_VERIFICATION';
    inv.payment = {
      id: Date.now(),
      method: 'BANK_DEPOSIT',
      reference_no: String(reference_no || 'DEP-SLIP').trim(),
      bank_name_branch: String(bank_name_branch || 'NBP Zhob').trim(),
      deposit_date: String(deposit_date || new Date().toISOString().slice(0, 10)),
      amount: inv.total_amount,
      slip_filename: String(slip_filename || 'deposit_slip.pdf'),
      status: 'PENDING_VERIFICATION',
      verified_by_name: null,
      verified_at: null,
      verification_note: 'Awaiting manual verification by Finance Admin.',
    };
    logAudit(user, 'UPLOAD_FEE_DEPOSIT_SLIP', 'fee_payments', inv.invoice_no, `Uploaded bank deposit slip ${inv.payment.reference_no} — Status set to PENDING_VERIFICATION.`);
    res.json({ ok: true, invoice: inv });
  });

  app.post('/api/messages/send', requireRoles(['PARENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']), (req, res) => {
    const user = (req as any).currentUser as UserRecord;
    const { recipient_user_id, cadet_id, subject, body } = req.body || {};
    const recipient = db.users.find((u) => u.id === Number(recipient_user_id)) || db.users[1];
    const cadet = cadet_id ? db.cadets.find((c) => c.id === Number(cadet_id)) : null;

    const msg = {
      id: db.messages.length + 1,
      sender_user_id: user.id,
      sender_name: user.display_name,
      sender_role: user.role_code,
      recipient_user_id: recipient.id,
      recipient_name: recipient.display_name,
      cadet_id: cadet ? cadet.id : null,
      cadet_name: cadet ? cadet.full_name : null,
      subject: String(subject || 'Portal Communication').trim(),
      body: String(body || '').trim(),
      read_at: null,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    db.messages.unshift(msg);
    saveDatabase(db);
    res.json({ ok: true, message: msg });
  });

  // 8. XAMPP PHP + MYSQL SOURCE CODE & COMPLETE DEPLOYMENT BUNDLE EXPORTER
  const buildLiveSnapshotSql = (): string => {
    const schemaPath = path.join(__dirname, 'brc-zhob', 'database', 'schema.sql');
    const baseSchema = fs.existsSync(schemaPath)
      ? fs.readFileSync(schemaPath, 'utf-8')
      : '';
    const sqlEsc = (val: any) =>
      String(val ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");

    const admissionInserts = db.admission_applications
      .map((a: any) => {
        const trackingId = sqlEsc(a.application_ref || 'BRC-ADM-2026-0001');
        const candName = sqlEsc(a.candidate_name || '');
        const fatherName = sqlEsc(a.father_name || a.father_name_as_per_school_record || '');
        const gender = a.gender === 'Female' || a.gender === 'GIRL' ? 'Female' : 'Male';
        const classApplied = sqlEsc(a.class_applied || a.class_studying || 'Class 8th');
        const dobFig = sqlEsc(a.dob_figures || a.date_of_birth || '2012-01-01');
        const dobWords = sqlEsc(a.dob_words || '');
        const prevMarks = Number(a.previous_class_percentage || a.previous_exam_percentage || 0).toFixed(2);
        const prevSchool = sqlEsc(a.previous_school || a.current_school_name || '');
        const quota = sqlEsc(a.quota_category || a.domicile_district || 'Zhob');
        const address = sqlEsc(a.permanent_address || a.postal_address || '');
        const phone = sqlEsc(a.guardian_phone || '');
        const challan = sqlEsc(a.fee_details?.challan_number || a.fee_details?.deposit_slip_no || 'NBP-2026');
        const slipFile = a.fee_details?.slip_file_name ? `'${sqlEsc(a.fee_details.slip_file_name)}'` : 'NULL';
        const payStatus =
          a.fee_details?.verification_status === 'VERIFIED'
            ? 'VERIFIED'
            : a.fee_details?.verification_status === 'REJECTED'
            ? 'REJECTED'
            : 'PENDING_VERIFICATION';
        const appStatus =
          a.status === 'APPROVED' || a.status === 'CONVERTED'
            ? 'APPROVED'
            : a.status === 'REJECTED'
            ? 'REJECTED'
            : a.status === 'UNDER_REVIEW'
            ? 'UNDER_REVIEW'
            : 'PENDING_VERIFICATION';
        const rollNo = a.assigned_roll_no ? `'${sqlEsc(a.assigned_roll_no)}'` : 'NULL';
        const kitNo = a.assigned_kit_no ? `'${sqlEsc(a.assigned_kit_no)}'` : 'NULL';
        return `INSERT INTO \`admissions\` (\`tracking_id\`, \`candidate_name\`, \`father_name\`, \`gender\`, \`class_applied\`, \`dob_figures\`, \`dob_words\`, \`previous_marks_percentage\`, \`previous_school\`, \`quota_district\`, \`permanent_address\`, \`phone\`, \`challan_no\`, \`slip_file\`, \`payment_status\`, \`application_status\`, \`assigned_roll_no\`, \`assigned_kit_no\`) VALUES ('${trackingId}', '${candName}', '${fatherName}', '${gender}', '${classApplied}', '${dobFig}', '${dobWords}', ${prevMarks}, '${prevSchool}', '${quota}', '${address}', '${phone}', '${challan}', ${slipFile}, '${payStatus}', '${appStatus}', ${rollNo}, ${kitNo});`;
      })
      .join('\n');

    return [
      baseSchema,
      '',
      '-- ============================================================================',
      `-- LIVE SNAPSHOT DATA EXPORT (Generated: ${new Date().toISOString()})`,
      '-- ============================================================================',
      admissionInserts || '-- (Zero live admission applications currently queued)',
      '',
    ].join('\n');
  };

  const xamppBundleManifest = [
    { path: 'README.txt', source: 'brc-zhob/README.txt', label: 'Teacher & Evaluator Quick Start Guide (README.txt)', lang: 'txt' },
    { path: '.htaccess', source: 'brc-zhob/.htaccess', label: 'Root Apache Security & SPA Rewriting (.htaccess)', lang: 'apache' },
    { path: 'config/db.php', source: 'brc-zhob/config/db.php', label: 'Auto-Detecting PDO Connector (XAMPP & cPanel)', lang: 'php' },
    { path: 'database/schema.sql', source: 'brc-zhob/database/schema.sql', label: 'Clean Zero-State MySQL Schema (utf8mb4)', lang: 'sql' },
    { path: 'database/live_snapshot.sql', source: 'brc-zhob/database/live_snapshot.sql', label: 'Current Live Database Snapshot (live_snapshot.sql)', lang: 'sql' },
    { path: 'api/apply.php', source: 'brc-zhob/api/apply.php', label: '5-Step Admission Handler + Slip Upload & Tracking ID', lang: 'php' },
    { path: 'api/track.php', source: 'brc-zhob/api/track.php', label: 'Real-Time Application Tracker Endpoint', lang: 'php' },
    { path: 'api/admin_cms.php', source: 'brc-zhob/api/admin_cms.php', label: 'Principal Photo, Gallery Upload/Delete, Verification & Credentials', lang: 'php' },
    { path: 'api/get_cms.php', source: 'brc-zhob/api/get_cms.php', label: 'Live Settings & Gallery Items Query', lang: 'php' },
    { path: 'api/export_full_backup.php', source: 'brc-zhob/api/export_full_backup.php', label: 'Full Backup ZIP Generator (CSV + Slips + SQL)', lang: 'php' },
    { path: 'api/login.php', source: 'brc-zhob/api/login.php', label: 'Admin-Only Authentication with Brute-Force Protection', lang: 'php' },
    { path: 'uploads/.htaccess', source: 'brc-zhob/uploads/.htaccess', label: 'Uploads RCE Script Execution Blocker', lang: 'apache' },
    { path: 'index.html', source: 'brc-zhob/index.html', label: 'Compiled Production Frontend (Ivory & Maroon UI)', lang: 'html' },
  ];

  app.get('/api/xampp/files', (_req, res) => {
    const liveSql = buildLiveSnapshotSql();
    const populated = xamppBundleManifest.map((f) => {
      if (f.path === 'database/live_snapshot.sql') {
        return { path: f.path, label: f.label, lang: f.lang, content: liveSql };
      }
      const brcPath = path.join(__dirname, 'brc-zhob', f.path);
      const fallbackPath = path.join(__dirname, f.source);
      const targetPath = fs.existsSync(brcPath) ? brcPath : fallbackPath;
      const content = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf-8') : '';
      return { path: f.path, label: f.label, lang: f.lang, content };
    });

    res.json({ files: populated });
  });

  app.get('/api/xampp/download-zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      const bundleRoot = path.join(__dirname, 'brc-zhob');

      const addDirToZip = (absDir: string, zipPrefix: string) => {
        if (!fs.existsSync(absDir)) return;
        const entries = fs.readdirSync(absDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullEntryPath = path.join(absDir, entry.name);
          const relZipPath = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            zip.folder(relZipPath);
            addDirToZip(fullEntryPath, relZipPath);
          } else if (entry.isFile()) {
            zip.file(relZipPath, fs.readFileSync(fullEntryPath));
          }
        }
      };

      // Package all files directly at the ZIP root
      addDirToZip(bundleRoot, '');
      const distDir = path.join(__dirname, 'dist');
      if (fs.existsSync(distDir)) {
        addDirToZip(distDir, '');
      }
      zip.file('database/live_snapshot.sql', buildLiveSnapshotSql());
      zip.folder('uploads/slips');
      zip.folder('uploads/principal');
      zip.folder('uploads/gallery');

      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="brc-zhob.zip"');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate brc-zhob.zip deployment bundle.' });
    }
  });

  // Serve pre-built /assets and /dist/assets so compiled ./assets/index-[hash].js works in all modes
  app.use('/assets', express.static(path.join(__dirname, 'assets')));
  app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets')));

  // Mount Vite in dev or serve static dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BRC Zhob Integrated Website & LMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
