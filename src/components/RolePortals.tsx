import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Bell,
  Image as ImageIcon,
  Settings,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Plus,
  Search,
  Printer,
  Shield,
  Calendar,
  Award,
  CreditCard,
  MessageSquare,
  Send,
  Database,
  FileCode,
  Download,
  AlertTriangle,
  Home,
  UserCheck,
  ClipboardCheck,
  TrendingUp,
  Sparkles,
  Trash2,
  Edit3,
  Upload,
  Archive,
  FileSpreadsheet,
} from 'lucide-react';
import JSZip from 'jszip';
import { ExamResultSummaryRecord, RoleCode } from '../types/brc';
import { BRC_BASE_PREFIX, BRC_LOGO_URL } from './LayoutShells';
import { PrintableReportCardModal } from './PublicPages';
import {
  PrintableRollSlipModal,
  OfficialHallTicketCard,
  buildOfficialRollSlipHtml,
  generateOfficialRollSlipsPdfBlob,
  triggerBrowserPrintWithIframe,
} from './AdmissionAndAlumniPages';
import {
  CmsData,
  CMS_UPDATE_EVENT,
  ADMISSIONS_STORAGE_KEY,
  getLiveCmsData,
  saveLiveCmsData,
  GalleryPhoto,
  FacultyMember,
} from '../utils/cmsStore';
import { AdminSecuritySettings } from './AdminSecuritySettings';

// ============================================================================
// 05. APPROVED ADMIN PORTAL (/admin/*) — PHASE 1 ADMISSIONS & MASTER CMS ENGINE
// ============================================================================
export const AdminPortal: React.FC<{
  sessionToken: string;
  currentPath: string;
  navigate: (path: string) => void;
  onLogout: () => void;
  onOpenXamppModal: () => void;
  onDataMutated: () => void;
}> = ({
  sessionToken,
  currentPath,
  navigate,
  onLogout,
  onOpenXamppModal,
  onDataMutated,
}) => {
  const [adminData, setAdminData] = useState<any | null>(null);
  const [localAdmissions, setLocalAdmissions] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [toast, setToast] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [previewSlipApp, setPreviewSlipApp] = useState<any | null>(null);
  const [previewRollSlipApp, setPreviewRollSlipApp] = useState<any | null>(null);
  const [batchPreviewApps, setBatchPreviewApps] = useState<any[] | null>(null);
  const [printQueueApps, setPrintQueueApps] = useState<any[]>([]);
  const importFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedReportCard, setSelectedReportCard] = useState<ExamResultSummaryRecord | null>(
    null
  );

  // Master CMS State & Sub-tabs
  const [cmsTab, setCmsTab] = useState<'principal' | 'gallery' | 'content' | 'faculty'>('principal');
  const [cms, setCms] = useState<CmsData>(() => getLiveCmsData());

  // Principal Profile CMS
  const [principalName, setPrincipalName] = useState(
    () => getLiveCmsData().principal.name || 'Dr. Muhammad Hassan'
  );
  const [principalTitle, setPrincipalTitle] = useState(
    () => getLiveCmsData().principal.title || 'Principal & Controller of Examinations'
  );
  const [principalTenure, setPrincipalTenure] = useState(
    () => getLiveCmsData().principal.badge || '18+ Years Leadership'
  );
  const [principalPhotoUrl, setPrincipalPhotoUrl] = useState(
    () =>
      getLiveCmsData().principal.photoUrl ||
      '/assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg'
  );
  const [principalQuote, setPrincipalQuote] = useState(
    () => getLiveCmsData().principal.quote || 'Discipline Today Leads to Success Tomorrow'
  );
  const [principalMessage, setPrincipalMessage] = useState(
    () =>
      getLiveCmsData().principal.welcomeMessage ||
      'It is an honour to lead Balochistan Residential College Zhob, an institution committed to shaping character, discipline, and academic excellence since 2016. Our cadets are trained to become future leaders who serve Pakistan with knowledge, integrity, and dedication.'
  );
  const [pillar1Title, setPillar1Title] = useState(
    () => getLiveCmsData().principal.pillars?.[0]?.title || 'Moral Character'
  );
  const [pillar1Desc, setPillar1Desc] = useState(
    () =>
      getLiveCmsData().principal.pillars?.[0]?.desc ||
      'Fostering integrity, discipline, and ethical leadership.'
  );
  const [pillar2Title, setPillar2Title] = useState(
    () => getLiveCmsData().principal.pillars?.[1]?.title || 'Academic Rigor'
  );
  const [pillar2Desc, setPillar2Desc] = useState(
    () =>
      getLiveCmsData().principal.pillars?.[1]?.desc ||
      'Excellence in science, analytical thinking & board distinction.'
  );
  const [pillar3Title, setPillar3Title] = useState(
    () => getLiveCmsData().principal.pillars?.[2]?.title || 'Physical Stamina'
  );
  const [pillar3Desc, setPillar3Desc] = useState(
    () =>
      getLiveCmsData().principal.pillars?.[2]?.desc ||
      'Drill, sports, physical endurance & cadet discipline.'
  );

  // Campus Gallery Manager
  const [galleryPhotoUrl, setGalleryPhotoUrl] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('Campus Architecture');
  const [galleryFeatured, setGalleryFeatured] = useState(true);

  // Site-Wide Content & Metric Editor
  const [topNoticeText, setTopNoticeText] = useState(() => getLiveCmsData().siteMetrics.topNotice);
  const [contactPhone, setContactPhone] = useState(
    () => getLiveCmsData().siteMetrics.topNoticePhone
  );
  const [contactEmail, setContactEmail] = useState(() => getLiveCmsData().contact.email);
  const [contactAddress, setContactAddress] = useState(() => getLiveCmsData().contact.address);
  const [heroTitle, setHeroTitle] = useState(() => getLiveCmsData().siteMetrics.heroHeadline);
  const [heroSubtitle, setHeroSubtitle] = useState(
    () => getLiveCmsData().siteMetrics.heroSubheadline
  );
  const [statCadets, setStatCadets] = useState(() => getLiveCmsData().siteMetrics.cadetCount);
  const [statTeachers, setStatTeachers] = useState(() => getLiveCmsData().siteMetrics.facultyCount);
  const [statBoardPass, setStatBoardPass] = useState(() => getLiveCmsData().siteMetrics.passRate);
  const [statHostelBlocks, setStatHostelBlocks] = useState(
    () => getLiveCmsData().siteMetrics.hostelBlocks
  );
  const [bankName, setBankName] = useState(() => getLiveCmsData().banking.bankName);
  const [bankAccountNo, setBankAccountNo] = useState(() => getLiveCmsData().banking.accountNumber);
  const [admissionFee, setAdmissionFee] = useState(() => getLiveCmsData().banking.feePkr);

  // Faculty Directory CMS
  const [staffName, setStaffName] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [staffDesignation, setStaffDesignation] = useState('');
  const [staffDept, setStaffDept] = useState('Physics');
  const [staffQual, setStaffQual] = useState('');
  const [staffClasses, setStaffClasses] = useState('Class 9th, Class 10th');
  const [staffPhotoUrl, setStaffPhotoUrl] = useState('');
  const [staffBio, setStaffBio] = useState('');

  // Notice creation form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Academic');
  const [noticeAudience, setNoticeAudience] = useState('PUBLIC');
  const [noticeBody, setNoticeBody] = useState('');

  const syncLocalAdmissions = () => {
    try {
      const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
      setLocalAdmissions(raw ? JSON.parse(raw) : []);
    } catch {
      setLocalAdmissions([]);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    syncLocalAdmissions();
    try {
      const res = await fetch(`${BRC_BASE_PREFIX}/api/portal/admin`, {
        headers: {
          'X-BRC-Session': sessionToken || 'local-admin-session',
          'X-BRC-Admin-Role': 'SUPER_ADMIN',
        },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        setAdminData({
          applications: Array.isArray(json.applications) ? json.applications : [],
          notices: Array.isArray(json.notices) ? json.notices : [],
          alumni: Array.isArray(json.alumni) ? json.alumni : [],
          backups: Array.isArray(json.backups) ? json.backups : [],
          auditLogs: Array.isArray(json.auditLogs) ? json.auditLogs : [],
          ...json,
        });
        setLoading(false);
        return;
      }
    } catch {}

    // Fallback for XAMPP Apache / PHP deployment (api/admin_cms.php)
    let phpApps: any[] = [];
    try {
      const phpRes = await fetch(`${BRC_BASE_PREFIX}/api/admin_cms.php?action=list_admissions`);
      const phpType = phpRes.headers.get('content-type') || '';
      if (phpRes.ok && phpType.includes('application/json')) {
        const phpJson = await phpRes.json();
        if (Array.isArray(phpJson.applications)) {
          phpApps = phpJson.applications.map((r: any) => ({
            ...r,
            application_ref: r.tracking_id || r.application_ref,
            quota_category: r.quota_district || r.quota_category,
            previous_class_percentage: r.previous_marks_percentage ?? r.previous_class_percentage,
            guardian_phone: r.phone || r.guardian_phone,
            status: r.application_status || r.status || 'PENDING_VERIFICATION',
            fee_details: {
              bank_branch: `${r.bank_name || 'NBP Zhob Branch'} (A/C: ${r.account_no || '0042-3019284756'})`,
              challan_number: r.challan_no || 'NBP-2026',
              amount_pkr: Number(r.fee_amount) || 2500,
              slip_file_name: r.slip_file || 'nbp_deposit_slip.jpg',
              slip_data_url: r.slip_file ? `${BRC_BASE_PREFIX}/uploads/slips/${r.slip_file}` : '',
              verification_status: r.payment_status || 'PENDING_VERIFICATION',
            },
          }));
        }
      }
    } catch {}

    setAdminData({
      applications: phpApps,
      notices: [
        {
          id: 1,
          title: 'Admissions Open for Class 8th & 1st Year (Session 2026–2027)',
          category: 'Admissions',
          audience: 'PUBLIC',
          status: 'PUBLISHED',
          published_at: '2026-10-01',
        },
      ],
      alumni: [],
      backups: [
        {
          id: 1,
          filename: `brc_zhob_db_zero_state_${new Date().toISOString().slice(0, 10)}.sql`,
          size_kb: 48,
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          status: 'VERIFIED',
          created_at: new Date().toISOString().slice(0, 10),
        },
      ],
      auditLogs: [
        {
          id: 1,
          action: 'ADMIN_PORTAL_READY',
          actor_name: 'College Administrator',
          actor_role: 'SUPER_ADMIN',
          summary: 'Zero-state Phase 1 Admissions & CMS Engine active.',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
      ],
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
    window.addEventListener('brc_admissions_updated', syncLocalAdmissions);
    window.addEventListener('storage', syncLocalAdmissions);
    return () => {
      window.removeEventListener('brc_admissions_updated', syncLocalAdmissions);
      window.removeEventListener('storage', syncLocalAdmissions);
    };
  }, [sessionToken]);

  useEffect(() => {
    if (currentPath.includes('/admissions')) setActiveSection('admissions');
    else if (currentPath.includes('/alumni')) setActiveSection('alumni');
    else if (currentPath.includes('/cadets') || currentPath.includes('/parents'))
      setActiveSection('students');
    else if (currentPath.includes('/academics') || currentPath.includes('/attendance'))
      setActiveSection('academics');
    else if (currentPath.includes('/staff') || currentPath.includes('/departments'))
      setActiveSection('staff');
    else if (currentPath.includes('/hostels')) setActiveSection('hostels');
    else if (currentPath.includes('/fees')) setActiveSection('fees');
    else if (currentPath.includes('/results') || currentPath.includes('/exams'))
      setActiveSection('results');
    else if (currentPath.includes('/notices')) setActiveSection('notices');
    else if (currentPath.includes('/gallery')) {
      setActiveSection('cms');
      setCmsTab('gallery');
    } else if (currentPath.includes('/backups') || currentPath.includes('/audit'))
      setActiveSection('backups');
    else if (currentPath.includes('/cms') || currentPath.includes('/settings'))
      setActiveSection('cms');
    else setActiveSection('dashboard');
  }, [currentPath]);

  const showNoticeToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Merge server applications (non-demo) with localStorage ('brc_admissions_store_v2')
  const liveApplications = React.useMemo(() => {
    const serverApps = Array.isArray(adminData?.applications)
      ? adminData.applications.filter((a: any) => !a.is_demo)
      : [];
    const mergedMap = new Map<string, any>();
    for (const app of serverApps) {
      mergedMap.set(app.application_ref, app);
    }
    for (const localApp of localAdmissions) {
      if (localApp && localApp.application_ref && !localApp.is_demo) {
        const existing = mergedMap.get(localApp.application_ref);
        mergedMap.set(localApp.application_ref, { ...existing, ...localApp });
      }
    }
    return Array.from(mergedMap.values());
  }, [adminData, localAdmissions]);

  // Search & Status Filter state for Admissions Verification Queue
  const [admissionSearchTerm, setAdmissionSearchTerm] = useState('');
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState<
    'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  >('ALL');

  const getApplicationFilterBucket = (app: any): 'PENDING' | 'VERIFIED' | 'REJECTED' => {
    const feeStatus = String(
      app.fee_details?.verification_status || app.payment_status || ''
    ).toUpperCase();
    const appStatus = String(app.application_status || app.status || '').toUpperCase();
    if (feeStatus === 'REJECTED' || appStatus === 'REJECTED') {
      return 'REJECTED';
    }
    if (
      feeStatus === 'VERIFIED' ||
      appStatus === 'VERIFIED' ||
      appStatus === 'APPROVED' ||
      appStatus === 'CONVERTED_TO_CADET' ||
      Boolean(app.assigned_roll_no)
    ) {
      return 'VERIFIED';
    }
    return 'PENDING';
  };

  // Filtered candidates list for Admissions Queue Search & Filter Toolbar
  const filteredApplications = React.useMemo(() => {
    const q = admissionSearchTerm.trim().toLowerCase();
    return liveApplications.filter((app: any) => {
      const nameStr = String(app.candidate_name || '').toLowerCase();
      const refStr = String(app.application_ref || app.tracking_id || '').toLowerCase();
      const phoneStr = String(app.guardian_phone || app.phone || '').toLowerCase();
      const matchesSearch =
        !q || nameStr.includes(q) || refStr.includes(q) || phoneStr.includes(q);

      const bucket = getApplicationFilterBucket(app);
      const matchesStatus = admissionStatusFilter === 'ALL' || bucket === admissionStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [liveApplications, admissionSearchTerm, admissionStatusFilter]);

  // Verified candidates list for Roll Slip Dispatch & Batch Printing
  const verifiedApplications = React.useMemo(() => {
    return liveApplications.filter(
      (app: any) =>
        app.fee_details?.verification_status === 'VERIFIED' ||
        Boolean(app.assigned_roll_no) ||
        app.status === 'APPROVED' ||
        app.status === 'CONVERTED_TO_CADET'
    );
  }, [liveApplications]);

  // Helper: Format CSV rows for student records
  const buildAdmissionsCsvString = (apps: any[]): string => {
    const headers = [
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
    ];
    const escapeCsv = (val: any) => {
      const str = String(val ?? '').replace(/\r?\n/g, ' ').trim();
      if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = apps.map((app: any) => [
      app.application_ref || app.tracking_id || '',
      app.candidate_name || '',
      app.father_name || app.father_name_as_per_school_record || '',
      app.gender || 'Male',
      app.class_applied || app.class_studying || 'Class 8th',
      app.quota_category || app.domicile_district || 'Zhob',
      app.guardian_phone || app.phone || '',
      app.previous_class_percentage ?? app.previous_exam_percentage ?? '',
      app.fee_details?.challan_number || app.challan_number || 'NBP-2026',
      app.fee_details?.verification_status || app.status || 'PENDING_VERIFICATION',
      app.assigned_kit_no || app.kit_no || 'UNASSIGNED',
    ]);
    return [
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => r.map(escapeCsv).join(',')),
    ].join('\n');
  };

  // MODULE 1.1: Export Full ZIP (.zip) with JSON, CSV, and uploaded_bank_slips/
  const handleExportFullZip = async () => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const zip = new JSZip();

      // 1. Complete raw JSON dump of all applicant objects
      zip.file('admissions_database.json', JSON.stringify(liveApplications, null, 2));

      // 2. Clean tabular CSV report
      const csvContent = buildAdmissionsCsvString(liveApplications);
      zip.file('admissions_report.csv', csvContent);

      // 3. uploaded_bank_slips/ folder with candidate deposit slip files renamed by tracking ID
      const slipsFolder = zip.folder('uploaded_bank_slips');
      let slipCount = 0;

      if (slipsFolder) {
        liveApplications.forEach((app: any, idx: number) => {
          const trackingId = (
            app.application_ref ||
            app.tracking_id ||
            `BRC-ADM-2026-${String(idx + 1).padStart(4, '0')}`
          ).replace(/[^A-Za-z0-9_-]/g, '_');

          const slipDataUrl: string | undefined =
            app.fee_details?.slip_data_url || app.slip_data_url;

          if (slipDataUrl && slipDataUrl.startsWith('data:')) {
            const matches = slipDataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const mime = matches[1];
              const base64Data = matches[2];
              let ext = 'jpg';
              if (mime.includes('png')) ext = 'png';
              else if (mime.includes('pdf')) ext = 'pdf';
              slipsFolder.file(`slip_${trackingId}.${ext}`, base64Data, { base64: true });
              slipCount++;
            }
          }
        });
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brc_zhob_complete_backup_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNoticeToast(
        `Backup complete! ZIP contains ${liveApplications.length} student records and slip attachments.`
      );
    } catch {
      showNoticeToast('Failed to generate ZIP backup archive.');
    }
  };

  // MODULE 1.2: Export CSV (brc_zhob_students_[DATE].csv)
  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const csvContent = buildAdmissionsCsvString(liveApplications);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brc_zhob_students_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNoticeToast(
      `Exported ${liveApplications.length} student records to brc_zhob_students_${dateStr}.csv`
    );
  };

  // Parse CSV line respecting double quotes
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  // MODULE 1.3: Import Student Data (.json or .csv)
  const handleImportStudentData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result || '').trim();
        if (!text) {
          showNoticeToast('Selected file is empty.');
          return;
        }

        let rawRecords: any[] = [];
        if (file.name.toLowerCase().endsWith('.json') || text.startsWith('[') || text.startsWith('{')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            rawRecords = parsed;
          } else if (Array.isArray(parsed.admissions_queue)) {
            rawRecords = parsed.admissions_queue;
          } else if (Array.isArray(parsed.applications)) {
            rawRecords = parsed.applications;
          } else if (Array.isArray(parsed.data)) {
            rawRecords = parsed.data;
          }
        } else {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
            for (let i = 1; i < lines.length; i++) {
              const cols = parseCsvLine(lines[i]);
              const rowObj: Record<string, string> = {};
              headers.forEach((h, idx) => {
                rowObj[h] = cols[idx] ?? '';
              });
              rawRecords.push({
                application_ref:
                  rowObj['tracking id'] ||
                  rowObj['tracking_id'] ||
                  rowObj['application_ref'] ||
                  `BRC-ADM-2026-${String(liveApplications.length + i).padStart(4, '0')}`,
                candidate_name: rowObj['candidate name'] || rowObj['candidate_name'] || 'Candidate',
                father_name: rowObj['father name'] || rowObj['father_name'] || 'Guardian',
                gender: rowObj['gender'] || 'Male',
                class_applied: rowObj['class'] || rowObj['class_applied'] || 'Class 8th',
                quota_category: rowObj['quota'] || rowObj['quota_category'] || 'Zhob',
                guardian_phone: rowObj['phone'] || rowObj['guardian_phone'] || '0300-0000000',
                previous_class_percentage: Number(rowObj['percentage'] || 80) || 80,
                assigned_kit_no:
                  rowObj['kit no'] && rowObj['kit no'] !== 'UNASSIGNED'
                    ? rowObj['kit no']
                    : null,
                assigned_roll_no:
                  rowObj['kit no'] && rowObj['kit no'].startsWith('KIT-2026-')
                    ? rowObj['kit no'].replace('KIT-2026-', 'BRC-2026-R')
                    : null,
                status:
                  rowObj['payment status'] === 'VERIFIED' || rowObj['payment status'] === 'APPROVED'
                    ? 'APPROVED'
                    : 'PENDING_VERIFICATION',
                fee_details: {
                  bank_branch: 'National Bank of Pakistan (NBP Zhob Branch, A/C: 0042-3019284756)',
                  challan_number: rowObj['challan no'] || 'NBP-2026-IMPORT',
                  amount_pkr: 2500,
                  deposit_date: new Date().toISOString().slice(0, 10),
                  slip_file_name: 'imported_record.jpg',
                  verification_status:
                    rowObj['payment status'] === 'VERIFIED' ||
                    rowObj['payment status'] === 'APPROVED'
                      ? 'VERIFIED'
                      : 'PENDING_VERIFICATION',
                },
              });
            }
          }
        }

        // Deduplicate by tracking_id / application_ref
        const existingRefs = new Set(
          liveApplications.map((a: any) =>
            String(a.application_ref || a.tracking_id || '').toUpperCase()
          )
        );

        const newValidRecords: any[] = [];
        rawRecords.forEach((rec: any, idx: number) => {
          const ref = String(
            rec.application_ref ||
              rec.tracking_id ||
              `BRC-ADM-2026-${String(liveApplications.length + idx + 1).padStart(4, '0')}`
          ).trim();
          if (!ref || existingRefs.has(ref.toUpperCase())) return;
          existingRefs.add(ref.toUpperCase());

          const normalized = {
            id: rec.id || Date.now() + idx,
            application_ref: ref,
            tracking_id: ref,
            candidate_name: rec.candidate_name || 'Candidate',
            father_name: rec.father_name || rec.father_name_as_per_school_record || 'Guardian',
            gender: rec.gender || 'Male',
            class_applied: rec.class_applied || rec.class_studying || 'Class 8th',
            dob_figures: rec.dob_figures || rec.dob_school_figures || '2012-03-15',
            dob_words: rec.dob_words || 'Fifteenth March Two Thousand Twelve',
            domicile_district: rec.domicile_district || rec.quota_category || 'Zhob',
            quota_category: rec.quota_category || rec.domicile_district || 'Zhob',
            previous_school: rec.previous_school || 'Government High School',
            previous_class_percentage:
              Number(rec.previous_class_percentage ?? rec.previous_exam_percentage ?? 80) || 80,
            permanent_address: rec.permanent_address || 'District Zhob, Balochistan',
            guardian_phone: rec.guardian_phone || rec.phone || '0300-0000000',
            status: rec.status || 'PENDING_VERIFICATION',
            assigned_roll_no: rec.assigned_roll_no || null,
            assigned_kit_no: rec.assigned_kit_no || null,
            submitted_at: rec.submitted_at || new Date().toISOString().slice(0, 10),
            is_demo: false,
            fee_details: {
              bank_branch:
                rec.fee_details?.bank_branch ||
                'National Bank of Pakistan (NBP Zhob Branch, A/C: 0042-3019284756)',
              challan_number:
                rec.fee_details?.challan_number || rec.challan_number || 'NBP-2026-IMPORT',
              amount_pkr: rec.fee_details?.amount_pkr || 2500,
              deposit_date:
                rec.fee_details?.deposit_date || new Date().toISOString().slice(0, 10),
              slip_file_name:
                rec.fee_details?.slip_file_name || 'nbp_deposit_slip.jpg',
              slip_data_url: rec.fee_details?.slip_data_url || rec.slip_data_url || '',
              verification_status:
                rec.fee_details?.verification_status ||
                (rec.status === 'APPROVED' ? 'VERIFIED' : 'PENDING_VERIFICATION'),
            },
          };
          newValidRecords.push(normalized);
        });

        if (newValidRecords.length === 0) {
          showNoticeToast(
            'No new unique student records found (all tracking IDs already exist in queue).'
          );
          return;
        }

        const merged = [...newValidRecords, ...liveApplications];
        try {
          localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          const compact = merged.map((item: any) => ({
            ...item,
            fee_details: item.fee_details
              ? { ...item.fee_details, slip_data_url: '' }
              : undefined,
          }));
          try {
            localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(compact));
          } catch {}
        }
        setLocalAdmissions(merged);
        window.dispatchEvent(new Event('brc_admissions_updated'));

        // Sync imported records to backend API
        for (const rec of newValidRecords) {
          try {
            await fetch(`/api/admin/admissions/${encodeURIComponent(rec.application_ref)}/verify-fee`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
              body: JSON.stringify({
                decision:
                  rec.fee_details?.verification_status === 'VERIFIED' ? 'VERIFIED' : 'VERIFIED',
                note: 'Imported via Admin Data Restore Engine',
                application: rec,
              }),
            });
          } catch {}
        }
        fetchAdminData();
        onDataMutated();

        showNoticeToast(`Successfully imported ${newValidRecords.length} student records!`);
      } catch {
        showNoticeToast('Invalid file format. Please select a valid .json or .csv student data file.');
      } finally {
        if (importFileInputRef.current) {
          importFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // MODULE 2: Prepare verified candidates with sequential Roll/Kit numbers if missing
  const ensureVerifiedRollNumbers = (): any[] => {
    const targetPool =
      verifiedApplications.length > 0 ? verifiedApplications : liveApplications;

    if (targetPool.length === 0) {
      // Provide an official specimen candidate if the queue is currently empty so Admin can test PDF/ZIP generation
      return [
        {
          id: 'SPECIMEN-BRC-2026-0001',
          application_ref: 'BRC-ADM-2026-0001',
          tracking_id: 'BRC-ADM-2026-0001',
          candidate_name: 'Muhammad Haseeb Khan (Specimen)',
          father_name: 'Haji Abdul Karim Khan',
          gender: 'Male',
          applying_class: 'Class 8th (Cadet Entry)',
          domicile_district: 'Zhob',
          quota_category: 'Zhob District Merit Quota',
          guardian_phone: '0333-7891234',
          previous_marks_percentage: 89.5,
          assigned_roll_no: 'BRC-2026-R101',
          assigned_kit_no: 'KIT-2026-101',
          status: 'APPROVED',
          fee_details: {
            challan_no: 'NBP-BRC-2026-1001',
            verification_status: 'VERIFIED',
          },
        },
      ];
    }

    let nextIndex = 0;
    const updatedAll = liveApplications.map((item: any) => {
      const isTarget = targetPool.some(
        (t: any) => (t.application_ref || t.id) === (item.application_ref || item.id)
      );
      if (!isTarget) return item;
      const seqNum = 101 + nextIndex++;
      return {
        ...item,
        status: 'APPROVED',
        assigned_roll_no: item.assigned_roll_no || `BRC-2026-R${seqNum}`,
        assigned_kit_no: item.assigned_kit_no || `KIT-2026-${seqNum}`,
        fee_details: {
          ...item.fee_details,
          verification_status: 'VERIFIED',
        },
      };
    });

    try {
      localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(updatedAll));
      setLocalAdmissions(updatedAll);
      window.dispatchEvent(new Event('brc_admissions_updated'));
    } catch {}

    return updatedAll.filter(
      (app: any) =>
        app.fee_details?.verification_status === 'VERIFIED' || Boolean(app.assigned_roll_no)
    );
  };

  // Option A: Print All Slips (Single Consolidated PDF)
  const handlePrintAllVerifiedSlips = () => {
    const prepared = ensureVerifiedRollNumbers();
    setPrintQueueApps(prepared);
    setBatchPreviewApps(prepared);

    try {
      const pdfBlob = generateOfficialRollSlipsPdfBlob(prepared);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BRC_Zhob_Consolidated_Roll_Slips_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      const consolidatedHtml = prepared
        .map((app: any, idx: number) => buildOfficialRollSlipHtml(app, idx))
        .join('<div style="page-break-after:always;"></div>');
      triggerBrowserPrintWithIframe(consolidatedHtml);

      showNoticeToast(
        liveApplications.length === 0
          ? 'Generated Specimen Consolidated Roll Slip PDF (Queue has 0 live records).'
          : `Generated Consolidated PDF for ${prepared.length} verified candidate(s)!`
      );
    } catch {
      showNoticeToast('Opened Consolidated Roll Slip Preview.');
    }
  };

  // Option B: Download All Slips (.ZIP Archive)
  const handleDownloadAllSlipsZip = async () => {
    try {
      const prepared = ensureVerifiedRollNumbers();
      const zip = new JSZip();

      prepared.forEach((app: any, idx: number) => {
        const seqNum = 101 + idx;
        const rollNo = app.assigned_roll_no || `BRC-2026-R${seqNum}`;
        const safeName = String(app.candidate_name || 'candidate')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        const baseFileName = `Roll_Slip_${rollNo}_${safeName || 'cadet'}`;

        // Include both printable PDF and standalone HTML in the ZIP
        const singlePdfBlob = generateOfficialRollSlipsPdfBlob([app]);
        zip.file(`${baseFileName}.pdf`, singlePdfBlob);

        const html = buildOfficialRollSlipHtml(app, idx);
        zip.file(`${baseFileName}.html`, html);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BRC_Zhob_Entrance_Roll_Slips_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      showNoticeToast(
        liveApplications.length === 0
          ? 'Downloaded .ZIP archive with Specimen Roll Slip (.PDF + .HTML)!'
          : `Downloaded .ZIP archive containing ${prepared.length} individual Roll Number Slips (.PDF + .HTML)!`
      );
    } catch {
      showNoticeToast('Failed to build Roll Slips ZIP archive.');
    }
  };

  // Individual Candidate Slip Printing
  const handlePrintSingleCandidateSlip = (app: any, idx: number) => {
    const seqNum = 101 + idx;
    const preparedApp = {
      ...app,
      assigned_roll_no: app.assigned_roll_no || `BRC-2026-R${seqNum}`,
      assigned_kit_no: app.assigned_kit_no || `KIT-2026-${seqNum}`,
    };
    setPrintQueueApps([preparedApp]);
    setPreviewRollSlipApp(preparedApp);

    try {
      const pdfBlob = generateOfficialRollSlipsPdfBlob([preparedApp]);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      const safeName = String(preparedApp.candidate_name || 'candidate')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      a.href = url;
      a.download = `Roll_Slip_${preparedApp.assigned_roll_no}_${safeName || 'cadet'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      const singleHtml = buildOfficialRollSlipHtml(preparedApp, idx);
      triggerBrowserPrintWithIframe(singleHtml);
    } catch {}
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'principal' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        showNoticeToast('File exceeds 2.5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'principal') {
          setPrincipalPhotoUrl(base64);
          setCms((prev) => {
            const next = { ...prev, principal: { ...prev.principal, photoUrl: base64 } };
            saveLiveCmsData(next);
            return next;
          });
          showNoticeToast('Principal portrait loaded and live-synced!');
        } else {
          setGalleryPhotoUrl(base64);
          if (!galleryCaption) {
            const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            setGalleryCaption(`BRC Zhob — ${clean.charAt(0).toUpperCase() + clean.slice(1)}`);
          }
          showNoticeToast('Gallery photograph loaded from computer!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGalleryPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryPhotoUrl) return;

    const newPhoto: GalleryPhoto = {
      id: 'photo-' + Date.now(),
      url: galleryPhotoUrl,
      title: galleryCaption || 'BRC Zhob Campus Photograph',
      category: galleryCategory,
      isFeatured: galleryFeatured,
    };

    setCms((prev) => {
      const next = { ...prev, gallery: [newPhoto, ...prev.gallery] };
      saveLiveCmsData(next);
      return next;
    });

    setGalleryPhotoUrl('');
    setGalleryCaption('');
    showNoticeToast('New photograph added to Campus Gallery and live-synced!');
    onDataMutated();
  };

  const handleDeleteGalleryPhoto = (id: string) => {
    setCms((prev) => {
      const next = { ...prev, gallery: prev.gallery.filter((p) => p.id !== id) };
      saveLiveCmsData(next);
      return next;
    });
    showNoticeToast('Photograph permanently deleted from Campus Gallery!');
    onDataMutated();
  };

  const handleDeleteFaculty = (id: string) => {
    setCms((prev) => {
      const next = { ...prev, faculty: prev.faculty.filter((f) => f.id !== id) };
      saveLiveCmsData(next);
      return next;
    });
    showNoticeToast('Faculty member removed from directory!');
    onDataMutated();
  };

  const handleGlobalSaveCms = async () => {
    const updatedCms: CmsData = {
      ...cms,
      principal: {
        ...cms.principal,
        name: principalName,
        title: principalTitle,
        photoUrl: principalPhotoUrl,
        badge: principalTenure,
        quote: principalQuote,
        welcomeMessage: principalMessage,
        pillars: [
          { id: '01', title: pillar1Title, desc: pillar1Desc },
          { id: '02', title: pillar2Title, desc: pillar2Desc },
          { id: '03', title: pillar3Title, desc: pillar3Desc },
        ],
      },
      siteMetrics: {
        ...cms.siteMetrics,
        topNotice: topNoticeText,
        topNoticePhone: contactPhone,
        heroHeadline: heroTitle,
        heroSubheadline: heroSubtitle,
        cadetCount: statCadets,
        passRate: statBoardPass,
        facultyCount: statTeachers,
        hostelBlocks: statHostelBlocks,
      },
      banking: {
        ...cms.banking,
        bankName: bankName,
        accountNumber: bankAccountNo,
        accountTitle: 'BRC Zhob Admission Fund',
        feePkr: admissionFee,
      },
      contact: {
        ...cms.contact,
        phone: contactPhone,
        email: contactEmail,
        address: contactAddress,
      },
    };
    setCms(updatedCms);
    saveLiveCmsData(updatedCms);

    try {
      await fetch(`${BRC_BASE_PREFIX}/api/admin_cms.php?action=save_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_settings',
          principal_name: principalName,
          principal_title: principalTitle,
          principal_tenure_badge: principalTenure,
          principal_photo_url: principalPhotoUrl,
          photo_data_url: principalPhotoUrl.startsWith('data:') ? principalPhotoUrl : undefined,
          principal_quote: principalQuote,
          announcement_banner_text: topNoticeText,
          contact_phone: contactPhone,
          metric_cadets: statCadets,
          metric_teachers: statTeachers,
          metric_board_pass: statBoardPass,
          metric_hostel_blocks: statHostelBlocks,
          bank_name_branch: bankName,
          bank_account_no: bankAccountNo,
          admission_fee_amount: Number(admissionFee) || 2500,
        }),
      });
    } catch {}

    try {
      await fetch(`${BRC_BASE_PREFIX}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
        body: JSON.stringify({
          principal_name: principalName,
          principal_title: principalTitle,
          principal_tenure_badge: principalTenure,
          principal_photo_url: principalPhotoUrl,
          principal_quote: principalQuote,
          principal_message: principalMessage,
          announcement_banner_text: topNoticeText,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          contact_address: contactAddress,
          hero_headline: heroTitle,
          hero_subheadline: heroSubtitle,
          metric_cadets: statCadets,
          metric_teachers: statTeachers,
          metric_board_pass: statBoardPass,
          metric_hostel_blocks: statHostelBlocks,
          bank_name_branch: bankName,
          bank_account_no: bankAccountNo,
          admission_fee_amount: Number(admissionFee) || 2500,
        }),
      });
    } catch {
      // Local CMS storage is already updated and broadcasted
    }

    showNoticeToast('Save & Sync Successful: All changes published live to public website!');
    onDataMutated();
  };

  const handleSaveSiteContentCms = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleGlobalSaveCms();
  };

  const handleCreateStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFaculty: FacultyMember = {
      id: 'f-' + Date.now(),
      name: staffName,
      designation: staffDesignation || 'Lecturer',
      department: staffDept,
      qualification: staffQual || 'M.Phil / Master Degree',
      classes: staffClasses || 'Class 9th, Class 10th',
      photoUrl: staffPhotoUrl || '/assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg',
    };
    setCms((prev) => {
      const next = { ...prev, faculty: [newFaculty, ...(prev.faculty || [])] };
      saveLiveCmsData(next);
      return next;
    });

    try {
      await fetch('/api/admin/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
        body: JSON.stringify({
          full_name: staffName,
          employee_code: staffCode || `BRC-EMP-${Math.floor(100 + Math.random() * 900)}`,
          designation: staffDesignation,
          department_name: staffDept,
          qualification: staffQual,
          assigned_classes: staffClasses
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          photo_url: staffPhotoUrl,
          bio: staffBio,
        }),
      });
      fetchAdminData();
    } catch {}

    showNoticeToast('Faculty member registered and added to directory!');
    setStaffName('');
    setStaffCode('');
    setStaffDesignation('');
    setStaffQual('');
    setStaffClasses('');
    setStaffPhotoUrl('');
    setStaffBio('');
    onDataMutated();
  };

  // Action Button 1: Verify Fee Deposit
  const handleVerifyAdmissionFee = async (
    app: any,
    decision: 'VERIFIED' | 'REJECTED'
  ) => {
    const verifiedAt = new Date().toISOString().slice(0, 10);

    // 1. Update local storage ('brc_admissions_store_v2')
    try {
      const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
      const list: any[] = raw ? JSON.parse(raw) : [];
      const existsInLocal = list.some(
        (i) => i.application_ref === app.application_ref || i.id === app.id
      );
      const baseList = existsInLocal ? list : [app, ...list];
      const updatedList = baseList.map((item) => {
        if (item.application_ref === app.application_ref || item.id === app.id) {
          return {
            ...item,
            status: decision === 'VERIFIED' ? 'UNDER_REVIEW' : 'REJECTED',
            fee_details: {
              ...item.fee_details,
              verification_status: decision,
              verified_by_name: 'College Administrator',
              verified_at: verifiedAt,
            },
          };
        }
        return item;
      });
      try {
        localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(updatedList));
      } catch {}
      setLocalAdmissions(updatedList);
      window.dispatchEvent(new Event('brc_admissions_updated'));
    } catch {}

    // 2. Update XAMPP PHP & Node server API
    try {
      const targetId = app.application_ref || app.tracking_id || app.id;
      await fetch(`${BRC_BASE_PREFIX}/api/admin_cms.php?action=verify_admission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_admission',
          tracking_id: targetId,
          decision,
        }),
      });
    } catch {}

    try {
      const targetId = app.application_ref || app.id;
      const res = await fetch(`${BRC_BASE_PREFIX}/api/admin/admissions/${encodeURIComponent(targetId)}/verify-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
        body: JSON.stringify({
          decision,
          note: `Deposit slip verified (${decision}) by College Administrator.`,
          application: app,
        }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {}

    showNoticeToast(
      decision === 'VERIFIED'
        ? `Fee deposit for ${app.application_ref} marked VERIFIED.`
        : `Fee deposit for ${app.application_ref} marked REJECTED.`
    );
    onDataMutated();
  };

  // Action Button 2: Assign Kit Number & Roll Slip (Sequential Auto-Generation)
  const handleAssignRollSlipAndKit = async (app: any) => {
    const verifiedAt = new Date().toISOString().slice(0, 10);

    // Compute sequential number (starting at 101)
    const assignedCount = liveApplications.filter(
      (a: any) =>
        (a.assigned_roll_no || a.status === 'CONVERTED_TO_CADET') &&
        a.application_ref !== app.application_ref
    ).length;
    const seqNum = 101 + assignedCount;
    let rollNo = app.assigned_roll_no || `BRC-2026-R${seqNum}`;
    let kitNo = app.assigned_kit_no || `KIT-2026-${seqNum}`;

    // 1. Try server endpoint first
    try {
      const targetId = app.application_ref || app.id;
      const res = await fetch(
        `/api/admin/admissions/${encodeURIComponent(targetId)}/assign-roll-slip`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
          body: JSON.stringify({
            application: app,
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.roll_no) rollNo = json.roll_no;
        if (json.kit_no) kitNo = json.kit_no;
        fetchAdminData();
      }
    } catch {}

    // 2. Persist in localStorage ('brc_admissions_store_v2')
    try {
      const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
      const list: any[] = raw ? JSON.parse(raw) : [];
      const existsInLocal = list.some(
        (i) => i.application_ref === app.application_ref || i.id === app.id
      );
      const baseList = existsInLocal ? list : [app, ...list];
      const updatedList = baseList.map((item) => {
        if (item.application_ref === app.application_ref || item.id === app.id) {
          return {
            ...item,
            status: 'APPROVED',
            assigned_roll_no: rollNo,
            assigned_kit_no: kitNo,
            fee_details: {
              ...item.fee_details,
              verification_status: 'VERIFIED',
              verified_by_name: 'College Administrator',
              verified_at: item.fee_details?.verified_at || verifiedAt,
            },
            admin_remarks: `Assigned Roll Slip ${rollNo} & Kit ${kitNo} for Entrance Exam (20 Oct 2026).`,
          };
        }
        return item;
      });
      try {
        localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(updatedList));
      } catch {}
      setLocalAdmissions(updatedList);
      window.dispatchEvent(new Event('brc_admissions_updated'));
    } catch {}

    showNoticeToast(
      `Assigned Roll Slip ${rollNo} & Kit ${kitNo} to ${app.candidate_name} for 20 Oct 2026 Entrance Exam!`
    );
    onDataMutated();
  };

  // Action Button 3: Permanently Delete Candidate Application (Dual Persistence: MySQL + localStorage)
  const handleDeleteApplication = async (app: any) => {
    const trackingId = String(app.application_ref || app.tracking_id || app.id || '').trim();
    const trackingIdUpper = trackingId.toUpperCase();
    const appIdStr = String(app.id || '').trim();
    const candidateName = String(app.candidate_name || 'Candidate').trim();
    if (!trackingId) return;

    const isMatchingApp = (item: any) => {
      if (!item) return false;
      const itemRef = String(item.application_ref || item.tracking_id || '').trim().toUpperCase();
      const itemId = String(item.id || '').trim();
      return (
        (trackingIdUpper && itemRef === trackingIdUpper) ||
        (appIdStr && itemId === appIdStr) ||
        itemId === trackingId
      );
    };

    // 1. Optimistically remove from localStorage ('brc_admissions_store_v2') & local state immediately
    try {
      const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
      const list: any[] = raw ? JSON.parse(raw) : [];
      const updatedLocal = list.filter((item: any) => !isMatchingApp(item));
      localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(updatedLocal));
      setLocalAdmissions(updatedLocal);
    } catch {
      setLocalAdmissions((prev) => prev.filter((item: any) => !isMatchingApp(item)));
    }

    // 2. Immediately remove from adminData.applications state so card and queue badge update instantly
    setAdminData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        applications: Array.isArray(prev.applications)
          ? prev.applications.filter((item: any) => !isMatchingApp(item))
          : [],
      };
    });

    window.dispatchEvent(new Event('brc_admissions_updated'));
    showNoticeToast(`Application ${trackingId} for ${candidateName} permanently deleted.`);

    // 3. Dispatch delete_admission to backend API (MySQL + Express)
    try {
      await fetch(
        `${BRC_BASE_PREFIX}/api/admin_cms.php?action=delete_admission&tracking_id=${encodeURIComponent(
          trackingId
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_admission',
            tracking_id: trackingId,
            application_ref: trackingId,
          }),
        }
      );
    } catch {
      // Fallback to localStorage removal already applied above
    }

    onDataMutated();
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        title: noticeTitle,
        category: noticeCategory,
        audience: noticeAudience,
        body: noticeBody,
        is_urgent: true,
      }),
    });
    if (res.ok) {
      showNoticeToast('Notice published to database and live on public website.');
      setNoticeTitle('');
      setNoticeBody('');
      fetchAdminData();
      onDataMutated();
    }
  };

  const handleCreateBackup = async () => {
    const res = await fetch('/api/admin/backups/create', {
      method: 'POST',
      headers: { 'X-BRC-Session': sessionToken },
    });
    if (res.ok) {
      showNoticeToast('Database backup snapshot created & restore checksum verified.');
      fetchAdminData();
    }
  };

  if (loading || !adminData) {
    return (
      <div className="p-12 text-center text-sm text-[#540B12] font-semibold">
        Loading BRC Zhob Administration Control Panel...
      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    {
      id: 'admissions',
      label: 'Admissions Queue',
      path: '/admin/admissions',
      icon: FileText,
      count: liveApplications.length,
    },
    { id: 'cms', label: 'Master CMS & Site Settings', path: '/admin/cms', icon: Settings },
    {
      id: 'alumni',
      label: 'Alumni (Read-Only)',
      path: '/admin/alumni',
      icon: Users,
      count: adminData.alumni.length,
    },
    { id: 'students', label: 'Cadets (Read-Only)', path: '/admin/cadets', icon: GraduationCap },
    {
      id: 'academics',
      label: 'Attendance (Read-Only)',
      path: '/admin/academics/classes',
      icon: BookOpen,
    },
    { id: 'staff', label: 'Staff & Faculty', path: '/admin/staff', icon: UserCheck },
    { id: 'hostels', label: 'Hostels (Read-Only)', path: '/admin/hostels', icon: Building2 },
    { id: 'results', label: 'Results (Read-Only)', path: '/admin/results', icon: Award },
    { id: 'notices', label: 'Notices & Circulars', path: '/admin/notices', icon: Bell },
    { id: 'backups', label: 'Audit Log & Backups', path: '/admin/backups', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-[#7A1C24] text-white border-b border-[#D5A83D]/40 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <img
            src={BRC_LOGO_URL}
            alt="BRC Zhob Official Logo"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full border-2 border-[#D5A83D] bg-white"
          />
          <div>
            <div className="font-editorial font-bold text-base sm:text-lg text-white tracking-wide">
              BALOCHISTAN RESIDENTIAL COLLEGE ZHOB
            </div>
            <div className="text-[11px] text-[#FBBF24]">
              College Administration Portal • Phase 1 Admissions & CMS Engine
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded-lg bg-[#60141B] hover:bg-[#4C0E14] text-[#FBBF24] border border-[#D5A83D]/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </button>
          <button
            onClick={onOpenXamppModal}
            className="px-3 py-1.5 rounded-lg bg-[#FBBF24] hover:bg-[#F59E0B] text-[#7A1C24] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">XAMPP PHP + SQL</span>
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-[#60141B] hover:bg-[#4C0E14] text-white border border-[#D5A83D]/30 cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#247A50] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/20 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row no-print">
        {/* Left Maroon/Gold Sidebar */}
        <aside className="w-full lg:w-64 bg-gradient-to-b from-[#540B12] to-[#3E080D] text-[#FFFDF8] border-r border-[#D5A83D]/30 p-3 flex flex-col justify-between shrink-0 no-print">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    navigate(item.path);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#D5A83D] to-[#F0D18A] text-[#23191A] font-bold shadow-sm'
                      : 'text-[#FFFDF8]/85 hover:bg-[#720F19]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#23191A]' : 'text-[#D5A83D]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono-tabular font-bold ${
                        active ? 'bg-[#540B12] text-[#FFFDF8]' : 'bg-[#720F19] text-[#F0D18A]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 p-4 rounded-xl bg-[#3E080D]/80 border border-[#D5A83D]/25 text-center">
            <p className="font-editorial italic text-xs text-[#F0D18A]">
              “Discipline Today Leads to Success Tomorrow”
            </p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* Scenic Campus Admin Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-[#3E080D] text-[#FFFDF8] border border-[#D5A83D]/40 p-6 sm:p-8 shadow-md">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=85')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#3E080D]/95 via-[#540B12]/85 to-[#3E080D]/75" />
            <img
              src={BRC_LOGO_URL}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 w-36 h-36 rounded-full opacity-10 pointer-events-none"
            />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#FFFDF8]">
                  College Administration Portal
                </h1>
                <div className="text-xs text-[#F0D18A] mt-0.5">
                  BRC ZHOB • System Control Panel — Authorized Administrator
                </div>
              </div>
              <div className="font-editorial italic text-xs sm:text-sm text-[#F0D18A]">
                “Discipline Today Leads to Success Tomorrow”
              </div>
            </div>
          </div>

          {/* 5 Live Database KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              {
                label: 'Active Applications',
                val: liveApplications.length,
                sub: `${liveApplications.length} in active review queue`,
                target: 'admissions',
              },
              {
                label: 'Site CMS & Gallery',
                val: `${cms.gallery?.length || 4} Photos`,
                sub: 'Principal & Metrics Live',
                target: 'cms',
              },
              {
                label: 'Total Cadets',
                val: statCadets || '850+',
                sub: 'Current Session 2026–27',
                target: 'students',
              },
              {
                label: 'Faculty & Staff',
                val: statTeachers || '42',
                sub: 'Active Teaching & Admin',
                target: 'staff',
              },
              {
                label: 'Hostel Blocks',
                val: statHostelBlocks || '03',
                sub: 'Jinnah, Iqbal, Liaquat & Fatima',
                target: 'hostels',
              },
            ].map((kpi, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSection(kpi.target)}
                className="bg-gradient-to-br from-[#540B12] to-[#3E080D] hover:from-[#720F19] hover:to-[#540B12] text-[#FFFDF8] rounded-2xl p-4 border border-[#D5A83D]/40 text-left shadow-md transition-all cursor-pointer"
              >
                <div className="text-xs text-[#F0D18A] font-medium">{kpi.label}</div>
                <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#FFFDF8] mt-1">
                  {kpi.val}
                </div>
                <div className="text-[11px] text-[#FFFDF8]/70 mt-1.5 flex items-center justify-between">
                  <span>{kpi.sub}</span>
                  <span>→</span>
                </div>
              </button>
            ))}
          </div>

          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {activeSection === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Live Admissions Queue Table (7 cols) */}
                <div className="xl:col-span-7 bg-white rounded-2xl border border-[#E6D6B8] overflow-hidden shadow-sm">
                  <div className="bg-[#540B12] text-[#FFFDF8] px-5 py-3.5 flex items-center justify-between">
                    <span className="font-editorial font-bold text-base">
                      Live Admissions Verification Queue ({liveApplications.length})
                    </span>
                    <button
                      onClick={() => setActiveSection('admissions')}
                      className="text-xs text-[#F0D18A] hover:underline cursor-pointer"
                    >
                      Open Verification Queue →
                    </button>
                  </div>

                  {liveApplications.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Shield className="w-8 h-8 text-[#7A1C24] mx-auto" />
                      <div className="font-editorial text-base font-bold text-slate-800">
                        Admissions Queue is Clean &amp; Ready
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                        Zero pending applications. Candidate submissions from the live domain will appear here with uploaded fee slips in real time.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F7F0E5] text-[#540B12] border-b border-[#E6D6B8]">
                          <tr>
                            <th className="py-2.5 px-3">Ref ID</th>
                            <th className="py-2.5 px-3">Candidate</th>
                            <th className="py-2.5 px-3">Quota</th>
                            <th className="py-2.5 px-3">Fee Slip</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6D6B8]">
                          {liveApplications.map((app: any) => (
                            <tr key={app.application_ref || app.id} className="hover:bg-[#FFFDF8]">
                              <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#720F19]">
                                {app.application_ref}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-[#23191A]">
                                {app.candidate_name} ({app.gender})
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {app.quota_category || app.domicile_district}
                              </td>
                              <td className="py-2.5 px-3 font-mono-tabular">
                                {app.fee_details?.verification_status || 'PENDING_VERIFICATION'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setActiveSection('admissions');
                                  }}
                                  className="px-2.5 py-1 rounded bg-[#720F19] text-[#FFFDF8] font-semibold cursor-pointer"
                                >
                                  Inspect & Verify
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick Actions (5 cols) */}
                <div className="xl:col-span-5 bg-gradient-to-b from-[#540B12] to-[#3E080D] text-[#FFFDF8] rounded-2xl border border-[#D5A83D]/40 p-5 space-y-3 shadow-md">
                  <h3 className="font-editorial font-bold text-base text-[#F0D18A] pb-2 border-b border-[#D5A83D]/25">
                    Phase 1 Administration Controls
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    {[
                      { label: 'Admissions Queue', sec: 'admissions' },
                      { label: 'Master Site CMS', sec: 'cms' },
                      { label: 'Principal Profile', sec: 'cms' },
                      { label: 'Campus Gallery', sec: 'gallery' },
                      { label: 'Publish Notice', sec: 'notices' },
                      { label: 'Backup & SQL', sec: 'backups' },
                    ].map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (qa.sec === 'gallery') {
                            setActiveSection('cms');
                            setCmsTab('gallery');
                          } else {
                            setActiveSection(qa.sec);
                          }
                        }}
                        className="p-3 rounded-xl bg-[#3E080D]/90 hover:bg-[#720F19] border border-[#D5A83D]/35 text-left font-semibold text-[#FFFDF8] transition-colors cursor-pointer"
                      >
                        {qa.label} →
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom 3-Column Row: Latest Notices, Alumni Preview, Campus Gallery */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-[#E6D6B8] overflow-hidden shadow-sm">
                  <div className="bg-[#540B12] text-[#FFFDF8] px-5 py-3 flex items-center justify-between">
                    <span className="font-editorial font-bold text-sm">Latest Notices</span>
                    <button
                      onClick={() => setActiveSection('notices')}
                      className="text-xs text-[#F0D18A] hover:underline cursor-pointer"
                    >
                      Manage →
                    </button>
                  </div>
                  <div className="p-4 space-y-2.5 text-xs">
                    {adminData.notices.slice(0, 4).map((n: any) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-lg bg-[#F7F0E5] flex items-center justify-between gap-2"
                      >
                        <div className="truncate font-semibold text-[#23191A]">{n.title}</div>
                        <span className="font-mono-tabular text-[11px] text-[#720F19] shrink-0">
                          {n.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E6D6B8] overflow-hidden shadow-sm">
                  <div className="bg-[#540B12] text-[#FFFDF8] px-5 py-3 flex items-center justify-between">
                    <span className="font-editorial font-bold text-sm">
                      Old Sulaimanians (Read-Only)
                    </span>
                    <button
                      onClick={() => setActiveSection('alumni')}
                      className="text-xs text-[#F0D18A] hover:underline cursor-pointer"
                    >
                      View →
                    </button>
                  </div>
                  <div className="p-4 space-y-2.5 text-xs">
                    {adminData.alumni.slice(0, 4).map((a: any) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-lg bg-[#F7F0E5] flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-[#23191A]">{a.full_name}</div>
                          <div className="text-[11px] text-[#71676A]">
                            {a.college_number || a.kit_no} • {a.current_profession || a.profession}
                          </div>
                        </div>
                        <span className="font-mono-tabular font-bold text-[#247A50]">
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E6D6B8] overflow-hidden shadow-sm">
                  <div className="bg-[#540B12] text-[#FFFDF8] px-5 py-3 flex items-center justify-between">
                    <span className="font-editorial font-bold text-sm">Campus Gallery</span>
                    <button
                      onClick={() => {
                        setActiveSection('cms');
                        setCmsTab('gallery');
                      }}
                      className="text-xs text-[#F0D18A] hover:underline cursor-pointer"
                    >
                      Manage Photos →
                    </button>
                  </div>
                  <div className="p-4">
                    <img
                      src={
                        cms.gallery?.[0]?.url ||
                        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=85'
                      }
                      alt="BRC Campus"
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-cover rounded-xl border border-[#E6D6B8]"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION 2: ACTIVE SYSTEM 1 — ADMIN ADMISSIONS VERIFICATION QUEUE */}
          {activeSection === 'admissions' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6D6B8] pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
                    ACTIVE SYSTEM 1 • PHASE 1 LIVE ADMISSIONS QUEUE
                  </span>
                  <h2 className="font-editorial text-2xl font-bold text-[#23191A] mt-0.5">
                    Admissions Verification Queue & Roll Slip Assignment
                  </h2>
                  <p className="text-xs text-[#71676A] mt-1">
                    Inspect uploaded NBP deposit slips, click <strong>Verify Fee Deposit</strong> to mark payment as <code>VERIFIED</code>, then click <strong>Assign Kit Number &amp; Roll Slip</strong> to auto-generate sequential Roll/Kit numbers for the 20 Oct 2026 Entrance Examination.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admissions')}
                  className="px-4 py-2 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  Open Public Admission Form →
                </button>
              </div>

              {/* BULK PRINTING TOOLBAR (TOP OF QUEUE) */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6D6B8] flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-[#7A1C24]" />
                    <h3 className="font-editorial font-bold text-base sm:text-lg text-[#23191A]">
                      Roll Slip Dispatch &amp; Printing Options
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold">
                      {verifiedApplications.length} Verified Candidate
                      {verifiedApplications.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Generate consolidated A4 entrance examination hall tickets with automatic page breaks or download individual HTML slips in a single <code>.ZIP</code> archive.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrintAllVerifiedSlips}
                    className="px-4 py-2.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4 text-[#FBBF24]" />
                    <span>Print All Slips (Single Consolidated PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadAllSlipsZip}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Archive className="w-4 h-4 text-[#7A1C24]" />
                    <span>Download All Slips (.ZIP Archive)</span>
                  </button>
                </div>
              </div>

              {/* SEARCH & STATUS FILTER TOOLBAR ABOVE QUEUE */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E6D6B8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={admissionSearchTerm}
                    onChange={(e) => setAdmissionSearchTerm(e.target.value)}
                    placeholder="Search by Candidate Name, Tracking ID (BRC-ADM-...), or Phone..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-[#E6D6B8] focus:outline-none focus:ring-2 focus:ring-[#7A1C24]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'ALL', label: 'All', count: liveApplications.length },
                      {
                        id: 'PENDING',
                        label: 'Pending Verification',
                        count: liveApplications.filter(
                          (a: any) => getApplicationFilterBucket(a) === 'PENDING'
                        ).length,
                      },
                      {
                        id: 'VERIFIED',
                        label: 'Verified',
                        count: liveApplications.filter(
                          (a: any) => getApplicationFilterBucket(a) === 'VERIFIED'
                        ).length,
                      },
                      {
                        id: 'REJECTED',
                        label: 'Rejected',
                        count: liveApplications.filter(
                          (a: any) => getApplicationFilterBucket(a) === 'REJECTED'
                        ).length,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAdmissionStatusFilter(tab.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        admissionStatusFilter === tab.id
                          ? 'bg-[#7A1C24] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-[#E6D6B8] hover:bg-slate-100'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#FAF8F5] border-2 border-dashed border-[#E6D6B8] text-center space-y-3">
                  <Shield className="w-10 h-10 text-[#7A1C24] mx-auto" />
                  <div className="font-editorial text-lg font-bold text-slate-800">
                    {liveApplications.length === 0
                      ? 'Admissions Queue is Clean & Ready'
                      : 'No Matching Candidate Applications'}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                    {liveApplications.length === 0
                      ? 'Zero pending applications. Candidate submissions from the live domain will appear here with uploaded fee slips in real time.'
                      : 'No applications match your current search query or status filter. Try clearing the search box or switching to the "All" tab.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((app: any, appIdx: number) => {
                    const feeVerified = app.fee_details?.verification_status === 'VERIFIED';
                    const assignedRoll = app.assigned_roll_no;
                    const assignedKit = app.assigned_kit_no;
                    const slipUrl = app.fee_details?.slip_data_url;
                    const slipName =
                      app.fee_details?.slip_file_name ||
                      app.fee_details?.slip_filename ||
                      'nbp_deposit_slip.jpg';

                    return (
                      <div
                        key={app.application_ref || app.id}
                        className="p-5 rounded-2xl bg-[#F7F0E5] border border-[#E6D6B8] space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6D6B8] pb-3">
                          <div>
                            <div className="font-editorial font-bold text-lg text-[#23191A]">
                              {app.candidate_name} ({app.gender}) —{' '}
                              <span className="font-mono-tabular text-sm text-[#720F19]">
                                {app.application_ref}
                              </span>
                            </div>
                            <div className="text-xs text-[#71676A] mt-0.5">
                              Father: <strong>{app.father_name || app.father_name_as_per_school_record}</strong> • Class:{' '}
                              <strong>{app.class_applied || app.class_studying}</strong> • Quota:{' '}
                              <strong>{app.quota_category || app.domicile_district}</strong> • Marks:{' '}
                              <strong>
                                {app.previous_class_percentage || app.previous_exam_percentage}%
                              </strong>
                            </div>
                            <div className="text-xs text-[#71676A] mt-0.5">
                              DOB: {app.dob_figures || app.dob_school_figures} ({app.dob_words}) • School:{' '}
                              {app.previous_school}
                              {(app.guardian_phone || app.phone) && (
                                <>
                                  {' '}• Phone: <strong>{app.guardian_phone || app.phone}</strong>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right text-xs font-mono-tabular space-y-1">
                              <div>
                                <span
                                  className={`px-2.5 py-1 rounded-full font-bold ${
                                    app.status === 'APPROVED' || assignedRoll
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : app.status === 'REJECTED' ||
                                          app.fee_details?.verification_status === 'REJECTED'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  Status: {app.status}
                                </span>
                              </div>
                              <div className="font-bold text-[#7A1C24]">
                                Fee Slip: {app.fee_details?.verification_status || 'PENDING_VERIFICATION'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteApplication(app)}
                              title={`Permanently delete application ${app.application_ref}`}
                              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Step 1: Deposit Slip Inspection & Verification */}
                          <div className="p-4 rounded-xl bg-white border border-[#E6D6B8] space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-[#540B12]">
                                1. NBP Fee Deposit Slip Inspection
                              </div>
                              {slipUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewSlipApp(app)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#7A1C24] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Inspect Uploaded Slip</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-1 text-slate-600">
                              <div>
                                Challan / Slip No:{' '}
                                <strong className="font-mono text-slate-900">
                                  {app.fee_details?.challan_number ||
                                    app.fee_details?.deposit_slip_no ||
                                    'NBP-2026'}
                                </strong>{' '}
                                • Amount: <strong>PKR {app.fee_details?.amount_pkr || 2500}</strong>
                              </div>
                              <div>
                                Bank:{' '}
                                {app.fee_details?.bank_branch ||
                                  app.fee_details?.bank_name_branch ||
                                  'NBP Zhob Branch (A/C: 0042-3019284756)'}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500">
                                Attached File: {slipName}
                              </div>
                            </div>

                            {slipUrl && slipUrl.startsWith('data:image') && (
                              <div className="pt-1">
                                <img
                                  src={slipUrl}
                                  alt="Uploaded Deposit Slip"
                                  onClick={() => setPreviewSlipApp(app)}
                                  className="h-20 w-auto rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-90"
                                />
                              </div>
                            )}

                            <div className="pt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleVerifyAdmissionFee(app, 'VERIFIED')}
                                className="px-3.5 py-2 rounded-lg bg-[#247A50] hover:bg-[#1d6340] text-white font-bold cursor-pointer shadow-xs"
                              >
                                ✓ Verify Fee Deposit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVerifyAdmissionFee(app, 'REJECTED')}
                                className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer"
                              >
                                Reject Slip
                              </button>
                            </div>
                          </div>

                          {/* Step 2: Assign Sequential Kit Number & Roll Slip */}
                          <div className="p-4 rounded-xl bg-white border border-[#E6D6B8] flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <div className="font-bold text-[#540B12]">
                                2. Entrance Exam Roll Slip &amp; Kit Number Assignment
                              </div>
                              <p className="text-slate-600 leading-relaxed">
                                Once the NBP deposit slip is marked <code>VERIFIED</code>, click below to auto-generate a sequential Roll Slip &amp; Kit Number (e.g., <code>BRC-2026-R101</code>) for the entrance examination on <strong>20 Oct 2026</strong>.
                              </p>

                              {assignedRoll && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-0.5 mt-2">
                                  <div className="font-bold text-emerald-800">
                                    ✓ Officially Registered for 20 Oct 2026 Entrance Exam
                                  </div>
                                  <div className="font-mono text-xs">
                                    Roll Number: <strong>{assignedRoll}</strong> • Kit Number:{' '}
                                    <strong>{assignedKit}</strong>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleAssignRollSlipAndKit(app)}
                                className={`px-4 py-2 rounded-lg font-bold cursor-pointer shadow-xs ${
                                  assignedRoll
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-[#7A1C24] hover:bg-[#60141B] text-[#FBBF24]'
                                }`}
                              >
                                {assignedRoll
                                  ? `Assigned: ${assignedRoll} (${assignedKit})`
                                  : 'Assign Kit Number & Roll Slip'}
                              </button>
                              {(feeVerified || assignedRoll) && (
                                <button
                                  type="button"
                                  onClick={() => handlePrintSingleCandidateSlip(app, appIdx)}
                                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Roll Slip</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ALUMNI DIRECTORY — PHASE 1 READ-ONLY MODE */}
          {activeSection === 'alumni' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-4 shadow-sm">
              <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-[#7A1C24] text-xs text-slate-800">
                <strong>Phase 1 Read-Only Mode:</strong> Alumni registration for Entry 1–9 will officially open following the entrance admissions cycle. Directory is currently in read-only view.
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                Old Sulaimanians Alumni Directory (Read-Only View)
              </h2>
              <div className="space-y-3">
                {adminData.alumni.map((alum: any) => (
                  <div
                    key={alum.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#23191A]">
                        {alum.full_name} •{' '}
                        <span className="font-mono-tabular text-[#720F19]">
                          {alum.college_number || alum.kit_no}
                        </span>{' '}
                        • {alum.batch_entry || `Entry ${alum.entry_no}`} ({alum.house_wing || alum.wing})
                      </div>
                      <div className="text-[#71676A] mt-0.5">
                        Profession: {alum.current_profession || alum.profession} (
                        {alum.organization_or_university || alum.organization})
                      </div>
                    </div>
                    <span className="font-mono-tabular font-bold px-2.5 py-1 rounded bg-white border border-[#E6D6B8] text-emerald-700">
                      {alum.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STUDENTS / CADETS — PHASE 1 READ-ONLY PREVIEW */}
          {activeSection === 'students' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-5 shadow-sm">
              <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-[#7A1C24] text-xs text-slate-800">
                <strong>Phase 1 Read-Only Preview:</strong> Enrolled Cadet rosters and Parent portal links are in view-only mode during the Phase 1 admissions cycle.
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                Enrolled Cadets Roster (View-Only Preview)
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[#E6D6B8]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#540B12] text-[#FFFDF8]">
                    <tr>
                      <th className="py-3 px-4">Roll No / Adm No</th>
                      <th className="py-3 px-4">Cadet Name & Gender</th>
                      <th className="py-3 px-4">Class & Program</th>
                      <th className="py-3 px-4">Wing & Hostel Room</th>
                      <th className="py-3 px-4">Attendance / CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6D6B8]">
                    {adminData.cadets.map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-3 px-4 font-mono-tabular font-bold text-[#720F19]">
                          {c.roll_no} / {c.admission_no}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {c.full_name} ({c.gender})
                        </td>
                        <td className="py-3 px-4">
                          {c.class_name} • {c.program_group}
                        </td>
                        <td className="py-3 px-4">
                          {c.house_wing} • {c.hostel_block} ({c.room_no})
                        </td>
                        <td className="py-3 px-4 font-mono-tabular">
                          {c.attendance_percent}% • CGPA {c.cgpa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACADEMICS, TIMETABLE & ATTENDANCE — PHASE 1 VIEW-ONLY PREVIEW */}
          {activeSection === 'academics' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-5 shadow-sm">
              <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-[#7A1C24] text-xs text-slate-800">
                <strong>Phase 1 Read-Only Preview:</strong> Cadet Assignments and Teacher Attendance submissions are disabled until Phase 2 portal rollout.
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                Academic Timetable, Assignments &amp; Teacher Attendance (View-Only)
              </h2>
              <div className="space-y-3">
                {adminData.timetable.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-mono-tabular font-bold text-[#720F19]">
                        {t.day_of_week} {t.start_time}–{t.end_time}
                      </span>{' '}
                      • <strong>{t.subject_name}</strong> ({t.class_name})
                      <div className="text-[#71676A] mt-0.5">
                        Instructor: {t.teacher_name} • {t.room_label} • Topic: {t.topic}
                      </div>
                    </div>
                    <span className="font-mono-tabular font-bold text-[#540B12]">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF & FACULTY */}
          {activeSection === 'staff' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-4 shadow-sm">
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                Faculty &amp; Staff Directory ({cms.faculty?.length || adminData.staff.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(cms.faculty || []).map((s: FacultyMember) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] text-xs space-y-1"
                  >
                    <div className="font-bold text-sm text-[#23191A]">{s.name}</div>
                    <div className="text-[#720F19] font-semibold">
                      {s.designation} • {s.department}
                    </div>
                    <div className="text-[#71676A]">
                      Qualification: {s.qualification} • Classes: {s.classes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HOSTELS — PHASE 1 VIEW-ONLY PREVIEW */}
          {activeSection === 'hostels' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-5 shadow-sm">
              <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-[#7A1C24] text-xs text-slate-800">
                <strong>Phase 1 Read-Only Preview:</strong> Hostel bed allocations are displayed in view-only mode during the entrance admissions cycle.
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                Hostel Blocks &amp; Room Capacity Overview (Read-Only)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {adminData.hostelBlocks.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] text-xs space-y-2"
                  >
                    <div className="font-bold text-sm text-[#540B12]">{b.name}</div>
                    <div className="font-mono-tabular">
                      Policy: {b.gender_policy} • Occupied: {b.occupied_beds}/{b.total_capacity} Beds
                    </div>
                    <div className="space-y-1.5 pt-2">
                      {b.rooms.map((r: any) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded bg-white border border-[#E6D6B8] flex justify-between"
                        >
                          <span className="font-bold">{r.room_no}</span>
                          <span className="font-mono-tabular">
                            {r.occupied}/{r.capacity} Beds ({r.status})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS & REPORT CARDS — PHASE 1 READ-ONLY MODE */}
          {activeSection === 'results' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-4 shadow-sm">
              <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-[#7A1C24] text-xs text-slate-800">
                <strong>Phase 1 Read-Only Mode:</strong> Roll Number lookup (<code>ZH-1012</code>) is active as a read-only demonstration of the printable BISE Quetta-styled transcript. New grade entry is disabled until Phase 2.
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                Examination Results &amp; Printable BISE Quetta Transcripts (Read-Only)
              </h2>
              <div className="space-y-3">
                {adminData.examResults.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#23191A]">
                        {r.cadet_name} ({r.roll_no}) — {r.class_name}
                      </div>
                      <div className="font-mono-tabular text-[#71676A]">
                        {r.exam_name} • {r.total_obtained_marks}/{r.total_max_marks} ({r.percentage}% • Grade {r.grade_letter})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReportCard(r)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#7A1C24] text-white font-bold cursor-pointer"
                      >
                        Preview Printable Transcript
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTICES & CIRCULARS CMS */}
          {activeSection === 'notices' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-6 shadow-sm">
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                Publish Official Notice / Circular
              </h2>
              <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="Notice Title *"
                    className="px-3.5 py-2 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8]"
                  />
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className="px-3.5 py-2 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8]"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Examinations">Examinations</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                  <select
                    value={noticeAudience}
                    onChange={(e) => setNoticeAudience(e.target.value)}
                    className="px-3.5 py-2 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8]"
                  >
                    <option value="PUBLIC">PUBLIC (Website + Portals)</option>
                    <option value="STAFF">STAFF ONLY</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  required
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Official notice body text..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#720F19] text-[#FFFDF8] font-bold cursor-pointer"
                >
                  Publish Notice Now
                </button>
              </form>
            </div>
          )}

          {/* AUDIT LOG & DATABASE BACKUPS */}
          {activeSection === 'backups' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E6D6B8] pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
                    MODULE 1 • COMPLETE DATABASE BACKUP, SLIP ARCHIVE &amp; DATA RESTORE ENGINE
                  </span>
                  <h2 className="font-editorial text-2xl font-bold text-[#23191A] mt-0.5">
                    Database Backups, Slip Archive &amp; Security Audit Log
                  </h2>
                  <p className="text-xs text-[#71676A] mt-1">
                    Export complete ZIP archives with student records and uploaded bank deposit slips, download offline CSV rosters, or import student data into the Admissions Queue.
                  </p>
                </div>

                {/* 3 Operational Backup & Restore Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportFullZip}
                    className="px-4 py-2.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white text-xs font-bold cursor-pointer flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Archive className="w-4 h-4 text-[#FBBF24]" />
                    <span>Export Full ZIP (.zip)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => importFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border-2 border-[#FBBF24] text-xs font-bold cursor-pointer flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Upload className="w-4 h-4 text-[#7A1C24]" />
                    <span>Import Student Data</span>
                  </button>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleImportStudentData}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Archive Contents & Live Server Endpoint Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6D6B8] space-y-1">
                  <div className="font-bold text-[#7A1C24] flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5" />
                    <span>ZIP Archive Contents</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Includes <code>admissions_database.json</code>, <code>admissions_report.csv</code>, and <code>uploaded_bank_slips/</code> with deposit slips renamed by tracking ID.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6D6B8] space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Offline HOD &amp; Board Roster</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    <code>brc_zhob_students_[DATE].csv</code> formatted with Tracking ID, Candidate, Father, Gender, Class, Quota, Phone, Percentage, Challan, Status &amp; Kit No.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6D6B8] space-y-1 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-[#540B12] flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Live PHP 8.2 ZIP Endpoint</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed mt-1">
                      <code>api/export_full_backup.php</code> uses <code>ZipArchive</code> to stream MySQL records and <code>/uploads/slips/</code>.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateBackup}
                      className="px-3 py-1.5 rounded-lg bg-[#247A50] hover:bg-[#1b5e3d] text-white text-[11px] font-bold cursor-pointer"
                    >
                      + Create DB Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={onOpenXamppModal}
                      className="px-3 py-1.5 rounded-lg bg-[#540B12] hover:bg-[#3d080e] text-[#F0D18A] text-[11px] font-bold cursor-pointer"
                    >
                      Inspect PHP + SQL
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-[#540B12] uppercase">Verified Backups</div>
                {adminData.backups.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8] flex flex-wrap items-center justify-between gap-2 font-mono-tabular"
                  >
                    <span>
                      <strong>{b.filename}</strong> ({b.size_kb} KB) • SHA-256:{' '}
                      {b.checksum.slice(0, 18)}...
                    </span>
                    <span className="text-[#247A50] font-bold">
                      {b.status} ({b.created_at})
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-[#540B12] uppercase">Security Audit Log</div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {adminData.auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8] flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono-tabular font-bold text-[#720F19]">
                          [{log.action}]
                        </span>{' '}
                        <strong>{log.actor_name}</strong> ({log.actor_role}) — {log.summary}
                      </div>
                      <span className="font-mono-tabular text-[11px] text-[#71676A]">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE SYSTEM 2: ADMIN MASTER CMS & SITE SETTINGS */}
          {(activeSection === 'cms' || activeSection === 'settings') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-[#7A1C24] text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Active System 2 • Admin Master CMS &amp; Site Settings</span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900">
                    Institutional CMS &amp; Live Website Editor
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Live editor for Principal profile &amp; portrait, Campus Gallery photographs, Top Notice Ribbon, Helpline Phone, and the 4 Homepage Counters.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGlobalSaveCms}
                    className="px-4 py-2.5 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Save &amp; Sync to Public Website</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-4 py-2.5 rounded-lg bg-[#FAF8F5] hover:bg-slate-100 border border-slate-200 text-[#7A1C24] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Public Website</span>
                  </button>
                </div>
              </div>

              {/* 4 Tabs Navigation */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-[#FAF8F5] rounded-xl border border-slate-200">
                {[
                  { id: 'principal', label: '1. Principal Profile & Picture CMS' },
                  { id: 'gallery', label: `2. Campus Gallery Manager (${cms.gallery?.length || 0})` },
                  { id: 'content', label: '3. Site-Wide Content & Metric Editor' },
                  { id: 'faculty', label: `4. Staff & Faculty Directory (${cms.faculty?.length || 0})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCmsTab(t.id as any)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      cmsTab === t.id
                        ? 'bg-[#7A1C24] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PRINCIPAL PROFILE & PICTURE CMS */}
              {cmsTab === 'principal' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGlobalSaveCms();
                    }}
                    className="lg:col-span-7 space-y-5 text-xs"
                  >
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-slate-800 text-xs">
                      <strong>Principal Profile &amp; Picture CMS:</strong> Upload a new Principal portrait from your computer or paste an image URL, edit the Full Name, Official Title, Leadership Tenure, and Welcome Quote, and click <strong>Save &amp; Sync to Public Website</strong>.
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Principal Photograph (Local File Upload or Image URL) *
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#7A1C24] font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-amber-700" />
                            <span>Upload from Computer</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'principal')}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            required
                            value={principalPhotoUrl}
                            onChange={(e) => setPrincipalPhotoUrl(e.target.value)}
                            placeholder="Paste Image URL or data URL..."
                            className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-xs focus:border-[#7A1C24] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-800 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={principalName}
                            onChange={(e) => setPrincipalName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold focus:border-[#7A1C24] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-800 mb-1">
                            Official Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={principalTitle}
                            onChange={(e) => setPrincipalTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-[#7A1C24] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-800 mb-1">
                            Leadership Tenure Badge *
                          </label>
                          <input
                            type="text"
                            required
                            value={principalTenure}
                            onChange={(e) => setPrincipalTenure(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-xs focus:border-[#7A1C24] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-800 mb-1">
                            Welcome Quote *
                          </label>
                          <input
                            type="text"
                            required
                            value={principalQuote}
                            onChange={(e) => setPrincipalQuote(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-[#7A1C24] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Official Principal&apos;s Welcome Message *
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={principalMessage}
                          onChange={(e) => setPrincipalMessage(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-[#7A1C24] focus:outline-none leading-relaxed"
                        />
                      </div>

                      {/* 3 Numbered Core Pillars */}
                      <div className="pt-2 border-t border-slate-200 space-y-3">
                        <div className="font-bold text-sm text-[#7A1C24] uppercase tracking-wide">
                          Three Numbered Core Pillars (Homepage Display)
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-slate-200 space-y-2">
                            <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#7A1C24]">
                              <span>PILLAR 01</span>
                              <input
                                type="text"
                                required
                                value={pillar1Title}
                                onChange={(e) => setPillar1Title(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded bg-white border border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <input
                              type="text"
                              required
                              value={pillar1Desc}
                              onChange={(e) => setPillar1Desc(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 text-xs"
                            />
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-slate-200 space-y-2">
                            <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#7A1C24]">
                              <span>PILLAR 02</span>
                              <input
                                type="text"
                                required
                                value={pillar2Title}
                                onChange={(e) => setPillar2Title(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded bg-white border border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <input
                              type="text"
                              required
                              value={pillar2Desc}
                              onChange={(e) => setPillar2Desc(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 text-xs"
                            />
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-slate-200 space-y-2">
                            <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#7A1C24]">
                              <span>PILLAR 03</span>
                              <input
                                type="text"
                                required
                                value={pillar3Title}
                                onChange={(e) => setPillar3Title(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded bg-white border border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <input
                              type="text"
                              required
                              value={pillar3Desc}
                              onChange={(e) => setPillar3Desc(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                        <span>Save &amp; Sync to Public Website</span>
                      </button>
                    </div>
                  </form>

                  {/* Live Preview Panel */}
                  <div className="lg:col-span-5 bg-[#FAF8F5] rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-xs text-[#7A1C24] uppercase tracking-wider">
                        Live Portrait &amp; Profile Preview
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Live Bound
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            principalPhotoUrl ||
                            BRC_LOGO_URL
                          }
                          alt={principalName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shrink-0"
                        />
                        <div>
                          <div className="font-editorial text-base font-bold text-slate-900 leading-tight">
                            {principalName}
                          </div>
                          <div className="text-xs text-[#7A1C24] font-semibold">
                            {principalTitle}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-[10px] text-amber-900 font-mono font-bold">
                            {principalTenure}
                          </span>
                        </div>
                      </div>

                      <blockquote className="italic text-xs text-slate-600 border-l-2 border-amber-400 pl-3">
                        &ldquo;{principalQuote}&rdquo;
                      </blockquote>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {principalMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CAMPUS GALLERY MANAGER */}
              {cmsTab === 'gallery' && (
                <div className="space-y-6 text-xs">
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-slate-800">
                    <strong>Campus Gallery Manager:</strong> Add new photographs from your local device or URL, assign a category (<code>Campus Architecture</code>, <code>Laboratories</code>, <code>Hostel Life</code>, <code>Sports &amp; Drill</code>), toggle &ldquo;Feature on Homepage&rdquo;, or click the Trash icon (<code>🗑</code>) to permanently delete any photograph.
                  </div>

                  {/* Add Photo Form */}
                  <form
                    onSubmit={handleAddGalleryPhoto}
                    className="p-5 rounded-xl bg-[#FAF8F5] border border-slate-200 space-y-3"
                  >
                    <div className="font-bold text-sm text-[#7A1C24] flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Add Photograph to Campus Gallery</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Upload from Device or Image URL *
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#7A1C24] font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-amber-700" />
                            <span>Browse Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'gallery')}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            required
                            value={galleryPhotoUrl}
                            onChange={(e) => setGalleryPhotoUrl(e.target.value)}
                            placeholder="Paste Image URL or data URL..."
                            className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono text-xs focus:border-[#7A1C24] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Photograph Title / Caption *
                        </label>
                        <input
                          type="text"
                          required
                          value={galleryCaption}
                          onChange={(e) => setGalleryCaption(e.target.value)}
                          placeholder="e.g. Academic Block & Clock Tower"
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-[#7A1C24] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">Category *</label>
                        <select
                          value={galleryCategory}
                          onChange={(e) => setGalleryCategory(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200"
                        >
                          <option value="Campus Architecture">Campus Architecture</option>
                          <option value="Laboratories">Laboratories</option>
                          <option value="Hostel Life">Hostel Life</option>
                          <option value="Sports & Drill">Sports &amp; Drill</option>
                        </select>
                      </div>

                      <div className="pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={galleryFeatured}
                            onChange={(e) => setGalleryFeatured(e.target.checked)}
                            className="accent-[#7A1C24] w-4 h-4"
                          />
                          <span className="font-semibold text-slate-800">
                            Feature on Homepage
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Photograph to Gallery</span>
                    </button>
                  </form>

                  {/* Existing Photos Grid */}
                  <div className="space-y-3">
                    <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                      <span>Current Gallery Photographs</span>
                      <span className="text-slate-500 font-normal">
                        {cms.gallery?.length || 0} Photographs Stored
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(cms.gallery || []).map((img: GalleryPhoto) => (
                        <div
                          key={img.id}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-2 flex flex-col justify-between"
                        >
                          <div className="relative h-36 bg-slate-100 overflow-hidden">
                            <img
                              src={img.url}
                              alt={img.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {img.isFeatured && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FBBF24] text-[#7A1C24] text-[10px] font-bold shadow-xs">
                                ★ Featured on Homepage
                              </span>
                            )}
                          </div>
                          <div className="p-3 pt-0 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="font-bold text-slate-800 text-xs line-clamp-1">
                                {img.title}
                              </div>
                              <div className="text-[11px] text-slate-500">{img.category}</div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setCms((prev) => {
                                    const next = {
                                      ...prev,
                                      gallery: prev.gallery.map((p) =>
                                        p.id === img.id ? { ...p, isFeatured: !p.isFeatured } : p
                                      ),
                                    };
                                    saveLiveCmsData(next);
                                    return next;
                                  });
                                  showNoticeToast(
                                    `Photograph ${
                                      img.isFeatured ? 'unpinned from' : 'featured on'
                                    } Homepage!`
                                  );
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                                  img.isFeatured
                                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {img.isFeatured ? 'Featured ✓' : 'Feature on Home'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryPhoto(img.id)}
                                className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                                title="Delete Photograph Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SITE-WIDE CONTENT & METRIC EDITOR */}
              {cmsTab === 'content' && (
                <form onSubmit={handleSaveSiteContentCms} className="space-y-6 text-xs">
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-slate-800">
                    <strong>Site-Wide Content &amp; Metric Editor:</strong> Live editing of the Top Announcement Ribbon text, Helpline phone number, and the 4 Homepage Counters (Cadet Strength, Board Pass %, Faculty Count, Hostel Blocks).
                  </div>

                  {/* Top Announcement Ribbon & Helpline */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-sm text-[#7A1C24] mb-1">
                        Top Announcement Ribbon Text *
                      </label>
                      <input
                        type="text"
                        required
                        value={topNoticeText}
                        onChange={(e) => setTopNoticeText(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-[#7A1C24] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-sm text-[#7A1C24] mb-1">
                        Helpline Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 font-mono text-slate-900 focus:border-[#7A1C24] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Hero Headline & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Hero Main Headline *
                      </label>
                      <input
                        type="text"
                        required
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:border-[#7A1C24] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Hero Subheadline *
                      </label>
                      <input
                        type="text"
                        required
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-[#7A1C24] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 4 Live Institutional Metrics */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-200 space-y-3">
                    <div className="font-bold text-sm text-[#7A1C24] uppercase tracking-wide">
                      4 Homepage Counters (Floating Hero Metric Card)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Cadet Strength
                        </label>
                        <input
                          type="text"
                          required
                          value={statCadets}
                          onChange={(e) => setStatCadets(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-[#7A1C24]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Board Pass %
                        </label>
                        <input
                          type="text"
                          required
                          value={statBoardPass}
                          onChange={(e) => setStatBoardPass(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-[#7A1C24]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Faculty Count
                        </label>
                        <input
                          type="text"
                          required
                          value={statTeachers}
                          onChange={(e) => setStatTeachers(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-[#7A1C24]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Hostel Blocks
                        </label>
                        <input
                          type="text"
                          required
                          value={statHostelBlocks}
                          onChange={(e) => setStatHostelBlocks(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-[#7A1C24]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Official Fee & Bank Challan Configuration */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-200 space-y-3">
                    <div className="font-bold text-sm text-[#7A1C24] uppercase tracking-wide">
                      Official Bank Challan &amp; Contact Settings
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Bank Name &amp; Branch *
                        </label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={bankAccountNo}
                          onChange={(e) => setBankAccountNo(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono text-xs font-bold text-[#7A1C24]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Admission Fee (PKR) *
                        </label>
                        <input
                          type="number"
                          required
                          value={admissionFee}
                          onChange={(e) => setAdmissionFee(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono text-xs font-bold text-[#7A1C24]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                    <span>Save &amp; Sync to Public Website</span>
                  </button>
                </form>
              )}

              {/* TAB 4: FACULTY & STAFF DIRECTORY CMS */}
              {cmsTab === 'faculty' && (
                <div className="space-y-6 text-xs">
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-slate-800">
                    <strong>Faculty &amp; Staff Directory CMS:</strong> Register new teachers, manage qualifications, departments, and assigned class loads.
                  </div>

                  {/* Add Faculty Form */}
                  <form
                    onSubmit={handleCreateStaffMember}
                    className="p-5 rounded-xl bg-[#FAF8F5] border border-slate-200 space-y-3"
                  >
                    <div className="font-bold text-sm text-[#7A1C24] flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Register New Faculty Member</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="e.g. Prof. Tariq Mehmood"
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-[#7A1C24] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Employee Code
                        </label>
                        <input
                          type="text"
                          value={staffCode}
                          onChange={(e) => setStaffCode(e.target.value)}
                          placeholder="Auto-generated if blank"
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 font-mono text-xs focus:border-[#7A1C24] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Designation *
                        </label>
                        <input
                          type="text"
                          required
                          value={staffDesignation}
                          onChange={(e) => setStaffDesignation(e.target.value)}
                          placeholder="e.g. Senior Lecturer / Head of Dept"
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-[#7A1C24] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">Department *</label>
                        <select
                          value={staffDept}
                          onChange={(e) => setStaffDept(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200"
                        >
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Biology">Biology</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="English">English</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Pakistan Studies & Islamiat">
                            Pakistan Studies &amp; Islamiat
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Qualification *
                        </label>
                        <input
                          type="text"
                          required
                          value={staffQual}
                          onChange={(e) => setStaffQual(e.target.value)}
                          placeholder="e.g. M.Phil in Physics, QAU"
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-[#7A1C24] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Assigned Classes *
                        </label>
                        <input
                          type="text"
                          required
                          value={staffClasses}
                          onChange={(e) => setStaffClasses(e.target.value)}
                          placeholder="e.g. Class 9th, Class 10th"
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-[#7A1C24] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Faculty Member to Directory</span>
                    </button>
                  </form>

                  {/* Faculty Directory Grid */}
                  <div className="space-y-3">
                    <div className="font-bold text-sm text-slate-900">
                      Current Faculty Directory ({cms.faculty?.length || 0} Staff Members)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(cms.faculty || []).map((s: FacultyMember) => (
                        <div
                          key={s.id}
                          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 relative group hover:border-[#7A1C24]/30 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={
                                  s.photoUrl ||
                                  '/assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg'
                                }
                                alt={s.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 object-cover shrink-0"
                              />
                              <div className="min-w-0 truncate">
                                <div className="font-bold text-slate-900 truncate">{s.name}</div>
                                <div className="text-[11px] text-[#7A1C24] font-semibold truncate">
                                  {s.designation}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteFaculty(s.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer shrink-0 transition-colors"
                              title="Delete faculty member from directory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-600 space-y-0.5 pt-1.5 border-t border-slate-100">
                            <div>
                              <strong className="text-slate-800">Dept:</strong> {s.department}
                            </div>
                            <div>
                              <strong className="text-slate-800">Qualification:</strong>{' '}
                              {s.qualification}
                            </div>
                            {s.classes && (
                              <div>
                                <strong className="text-slate-800">Classes:</strong> {s.classes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMINISTRATOR ACCOUNT & SECURITY SETTINGS (INSIDE MASTER CMS & SITE SETTINGS) */}
              <AdminSecuritySettings onNotify={showNoticeToast} />
            </div>
          )}
        </main>
      </div>

      {/* Deposit Slip Inspection Modal */}
      {previewSlipApp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 overflow-hidden shadow-2xl">
            <div className="bg-[#7A1C24] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-editorial font-bold text-base">
                  NBP Fee Deposit Slip Inspection — {previewSlipApp.application_ref}
                </h3>
                <p className="text-xs text-amber-200">
                  Candidate: {previewSlipApp.candidate_name} • Challan:{' '}
                  {previewSlipApp.fee_details?.challan_number || 'NBP-2026'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSlipApp(null)}
                className="px-3 py-1 rounded bg-black/30 hover:bg-black/50 text-white text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {previewSlipApp.fee_details?.slip_data_url?.startsWith('data:application/pdf') ? (
                <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <FileText className="w-10 h-10 text-[#7A1C24] mx-auto" />
                  <div className="font-bold text-sm text-slate-900">
                    PDF Deposit Slip Attached ({previewSlipApp.fee_details?.slip_file_name})
                  </div>
                  <a
                    href={previewSlipApp.fee_details.slip_data_url}
                    download={previewSlipApp.fee_details?.slip_file_name || 'nbp_deposit_slip.pdf'}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1C24] text-white font-bold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Deposit Slip</span>
                  </a>
                </div>
              ) : previewSlipApp.fee_details?.slip_data_url ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                  <img
                    src={previewSlipApp.fee_details.slip_data_url}
                    alt="Uploaded NBP Deposit Slip"
                    className="max-h-[60vh] w-auto mx-auto object-contain rounded"
                  />
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  Deposit slip metadata recorded ({previewSlipApp.fee_details?.slip_file_name}).
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyAdmissionFee(previewSlipApp, 'VERIFIED');
                    setPreviewSlipApp(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#247A50] text-white font-bold cursor-pointer"
                >
                  ✓ Verify Fee Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSlipApp(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReportCard && (
        <PrintableReportCardModal
          result={selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
        />
      )}

      {previewRollSlipApp && (
        <PrintableRollSlipModal
          app={previewRollSlipApp}
          onClose={() => setPreviewRollSlipApp(null)}
        />
      )}

      {batchPreviewApps && (
        <PrintableRollSlipModal
          applications={batchPreviewApps}
          onClose={() => setBatchPreviewApps(null)}
        />
      )}

      {/* DEDICATED PRINT-ONLY HALL TICKET CONTAINER (#printArea) */}
      <div id="printArea">
        {(printQueueApps.length > 0 ? printQueueApps : verifiedApplications).map(
          (item: any, idx: number) => (
            <OfficialHallTicketCard
              key={item?.application_ref || item?.id || idx}
              app={item}
              index={idx}
            />
          )
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TEACHER PORTAL (/teacher/*) — Matches Page 27 Original Teacher Portal Reference
// ============================================================================
export const TeacherPortal: React.FC<{
  sessionToken: string;
  navigate: (path: string) => void;
  onLogout: () => void;
}> = ({ sessionToken, navigate, onLogout }) => {
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'attendance' | 'assignments' | 'marks' | 'duties'
  >('dashboard');
  const [toast, setToast] = useState<string | null>(null);
  const [tamperError, setTamperError] = useState<string | null>(null);

  // Quick Attendance state
  const [selectedClassSection, setSelectedClassSection] = useState<string>('Class 10-A');
  const [attendanceDate, setAttendanceDate] = useState<string>('2026-10-30');
  const [sessionSlot, setSessionSlot] = useState<string>('MORNING');
  const [quickAttendance, setQuickAttendance] = useState<Record<number, 'PRESENT' | 'ABSENT'>>({
    1: 'PRESENT',
    2: 'PRESENT',
    3: 'PRESENT',
    4: 'ABSENT',
  });

  // New Assignment form state
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignClass, setNewAssignClass] = useState('Class 10-A');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignDue, setNewAssignDue] = useState('2026-11-15');
  const [newAssignMaxMarks, setNewAssignMaxMarks] = useState('25');

  // Grading state
  const [gradeMarks, setGradeMarks] = useState<Record<number, string>>({});
  const [gradeFeedback, setGradeFeedback] = useState<Record<number, string>>({});

  // Marks entry state
  const [selectedResultId, setSelectedResultId] = useState<number>(1);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('ENG-101');
  const [marksValue, setMarksValue] = useState<string>('88');
  const [marksRemark, setMarksRemark] = useState<string>('Excellent literary analysis');

  const fetchTeacherData = async () => {
    const res = await fetch('/api/portal/teacher', {
      headers: { 'X-BRC-Session': sessionToken },
    });
    if (res.ok) {
      setData(await res.json());
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [sessionToken]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveAttendance = async (targetClassOverride?: string) => {
    if (!data) return;
    setTamperError(null);
    const targetClass = targetClassOverride || selectedClassSection;
    const records = data.students
      .filter((s: any) => s.class_name === targetClass)
      .map((s: any) => ({
        cadet_id: s.id,
        cadet_name: s.full_name,
        roll_no: s.roll_no,
        status: quickAttendance[s.id] || 'PRESENT',
        remark: quickAttendance[s.id] === 'ABSENT' ? 'Marked absent in session' : 'Present',
      }));

    const res = await fetch('/api/teacher/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        class_name: targetClass,
        subject_name: 'English Literature & Composition',
        attendance_date: attendanceDate,
        session_label: sessionSlot,
        records,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      notify(`${targetClass} (${sessionSlot}) Attendance saved & audited.`);
      fetchTeacherData();
    } else {
      setTamperError(json.error || 'Failed to save attendance.');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setTamperError(null);
    const res = await fetch('/api/teacher/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        title: newAssignTitle,
        class_name: newAssignClass,
        subject_name: 'English Compulsory',
        description: newAssignDesc,
        due_at: newAssignDue,
        max_marks: Number(newAssignMaxMarks),
      }),
    });
    const json = await res.json();
    if (res.ok) {
      notify(`Assignment "${newAssignTitle}" published to ${newAssignClass}.`);
      setNewAssignTitle('');
      setNewAssignDesc('');
      fetchTeacherData();
    } else {
      setTamperError(json.error || 'Could not create assignment.');
    }
  };

  const handleGradeSubmission = async (assignmentId: number, submissionId: number, maxM: number) => {
    const awarded = gradeMarks[submissionId] ?? String(maxM - 2);
    const fb = gradeFeedback[submissionId] ?? 'Well-structured response and strong grammar.';
    const res = await fetch('/api/teacher/submissions/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        assignmentId,
        submissionId,
        marksAwarded: Number(awarded),
        feedback: fb,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      notify('Cadet submission graded and recorded in Audit Log.');
      fetchTeacherData();
    } else {
      notify(json.error || 'Error grading submission.');
    }
  };

  const handleEnterMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/teacher/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        resultId: selectedResultId,
        subjectCode: selectedSubjectCode,
        marksObtained: Number(marksValue),
        teacherRemark: marksRemark,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      notify('Subject marks validated against max marks and saved for Admin review.');
      fetchTeacherData();
    } else {
      notify(json.error || 'Marks validation error.');
    }
  };

  if (!data) {
    return <div className="p-12 text-center text-sm">Loading Teacher Portal...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F0E5] flex flex-col">
      {/* Top Bar matching Page 27 */}
      <header className="bg-gradient-to-r from-[#540B12] to-[#720F19] text-[#FFFDF8] px-6 h-16 flex items-center justify-between border-b border-[#D5A83D]/40">
        <div className="flex items-center gap-3">
          <img
            src={BRC_LOGO_URL}
            alt="BRC Zhob Crest"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full border border-[#D5A83D] bg-white"
          />
          <div>
            <div className="font-editorial font-bold text-lg sm:text-xl">
              BRC Zhob LMS — Teacher Portal
            </div>
            <div className="text-[11px] text-[#F0D18A]">
              Assigned Classes: {data.assignedClasses.join(' • ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded bg-[#3E080D] text-[#F0D18A] border border-[#D5A83D]/30 font-semibold cursor-pointer"
          >
            Public Website
          </button>
          <span className="font-mono-tabular hidden sm:inline">Session 2025–2026</span>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded bg-[#3E080D] hover:bg-[#8D1722] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#247A50] text-white px-5 py-3 rounded-xl shadow-xl text-xs font-bold">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar matching Page 27 */}
        <aside className="w-full lg:w-64 bg-gradient-to-b from-[#540B12] to-[#3E080D] text-[#FFFDF8] p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="text-center pb-5 border-b border-[#D5A83D]/25 mb-4">
              <img
                src={BRC_LOGO_URL}
                alt="BRC Zhob Crest"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full mx-auto border-2 border-[#D5A83D] bg-white"
              />
              <div className="font-editorial font-bold text-base mt-2">BRC Zhob LMS</div>
              <div className="text-xs text-[#F0D18A]">Teacher Portal</div>
            </div>

            <nav className="space-y-1.5 text-xs sm:text-sm">
              {[
                { id: 'dashboard', label: 'Dashboard Overview' },
                { id: 'attendance', label: 'Attendance Marking' },
                { id: 'assignments', label: 'Assignments & Grading' },
                { id: 'duties', label: 'Exam & Hostel Duties' },
                { id: 'marks', label: 'Results / Marks Entry' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-[#D5A83D] to-[#F0D18A] text-[#23191A]'
                      : 'text-[#FFFDF8]/85 hover:bg-[#720F19]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-5 pt-4 border-t border-[#D5A83D]/25">
              <button
                onClick={() => handleSaveAttendance('Class 12-A (Unassigned)')}
                className="w-full text-left p-2.5 rounded-xl bg-[#3E080D] hover:bg-[#B4232C] text-[#F0D18A] border border-[#D5A83D]/30 text-[11px] cursor-pointer"
              >
                🔒 Test RBAC Guard (Try Unassigned Class 12-A)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5A83D]/25 flex items-center gap-3 text-xs">
            <div className="w-9 h-9 rounded-full bg-[#D5A83D] text-[#23191A] font-bold flex items-center justify-center">
              NH
            </div>
            <div>
              <div className="font-bold">{data.staffProfile.full_name}</div>
              <div className="text-[#F0D18A] text-[11px]">{data.staffProfile.department_name}</div>
            </div>
          </div>
        </aside>

        {/* Main Content matching Page 27 */}
        <main className="flex-1 p-6 space-y-6">
          {tamperError && (
            <div className="p-4 rounded-xl bg-[#B4232C]/15 border-2 border-[#B4232C] text-[#B4232C] text-xs font-bold flex items-center justify-between">
              <span>{tamperError}</span>
              <button
                onClick={() => setTamperError(null)}
                className="underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <h1 className="font-editorial text-2xl font-bold text-[#23191A]">
                Welcome back, {data.staffProfile.full_name}!
              </h1>
              <div className="text-xs text-[#71676A] mt-0.5">
                Department: {data.staffProfile.department_name} • {data.assignedClasses.length}{' '}
                classes assigned ({data.assignedClasses.join(', ')})
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('attendance')}
                className="px-3.5 py-2 rounded-lg bg-[#540B12] text-[#F0D18A] font-bold text-xs cursor-pointer"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className="px-4 py-2 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs cursor-pointer"
              >
                Enter Subject Marks →
              </button>
            </div>
          </div>

          {/* 4 KPI Cards matching Page 27 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Classes Today', val: '4', sub: '2 ongoing • 2 upcoming', tab: 'dashboard' },
              {
                title: 'Assigned Students',
                val: `${data.students.length} Active`,
                sub: 'In assigned sections only',
                tab: 'attendance',
              },
              {
                title: 'Assignments Active',
                val: `${data.assignments.length}`,
                sub: 'From Class 10 & 11',
                tab: 'assignments',
              },
              {
                title: 'Exam Duties',
                val: `${data.examDuties.length}`,
                sub: 'Invigilation & Hostel Roster',
                tab: 'duties',
              },
            ].map((k, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(k.tab as any)}
                className="bg-white hover:border-[#D5A83D] rounded-2xl border border-[#E6D6B8] p-5 text-center shadow-sm transition-all cursor-pointer"
              >
                <div className="text-xs text-[#71676A] font-medium">{k.title}</div>
                <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#23191A] my-1">
                  {k.val}
                </div>
                <div className="text-[11px] text-[#720F19] font-semibold">{k.sub}</div>
              </button>
            ))}
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left/Center Column (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Today's Schedule */}
                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#E6D6B8] pb-3">
                    <h2 className="font-editorial font-bold text-lg text-[#23191A]">
                      Today's Schedule (Assigned Classes Only)
                    </h2>
                    <span className="text-xs text-[#71676A] font-mono-tabular">
                      Academic Session 2025–2026
                    </span>
                  </div>
                  {data.timetable.map((slot: any) => (
                    <div
                      key={slot.id}
                      className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <span className="font-mono-tabular font-bold text-[#720F19]">
                          {slot.start_time} – {slot.end_time}
                        </span>{' '}
                        · <strong>{slot.subject_name}</strong> ({slot.class_name})
                        <div className="text-[#71676A] mt-0.5">
                          {slot.room_label} • Topic: {slot.topic}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full font-bold ${
                          slot.status === 'ONGOING'
                            ? 'bg-[#247A50] text-white'
                            : 'bg-[#D5A83D] text-[#23191A]'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Attendance & Marks Entry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm">
                    <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                      Student Attendance Quick Mark ({selectedClassSection})
                    </h3>
                    <div className="space-y-2 text-xs">
                      {data.students
                        .filter((s: any) => s.class_name === selectedClassSection)
                        .map((stu: any) => {
                          const st = quickAttendance[stu.id] || 'PRESENT';
                          return (
                            <div
                              key={stu.id}
                              className="p-2.5 rounded-lg bg-[#F7F0E5] flex items-center justify-between"
                            >
                              <span className="font-semibold text-[#23191A]">
                                {stu.full_name} ({stu.roll_no})
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuickAttendance({
                                    ...quickAttendance,
                                    [stu.id]: st === 'PRESENT' ? 'ABSENT' : 'PRESENT',
                                  })
                                }
                                className={`px-3 py-1 rounded font-bold cursor-pointer ${
                                  st === 'PRESENT'
                                    ? 'bg-[#247A50] text-white'
                                    : 'bg-[#B4232C] text-white'
                                }`}
                              >
                                {st}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    <button
                      onClick={() => handleSaveAttendance()}
                      className="w-full py-2.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs cursor-pointer"
                    >
                      Mark Full Attendance
                    </button>
                  </div>

                  {/* Authorized Subject Marks Entry */}
                  <form
                    onSubmit={handleEnterMarks}
                    className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs"
                  >
                    <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                      Authorized Subject Marks Entry
                    </h3>
                    <div>
                      <label className="block font-semibold mb-1">Select Cadet Result Sheet</label>
                      <select
                        value={selectedResultId}
                        onChange={(e) => setSelectedResultId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                      >
                        {data.examResults.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.cadet_name} ({r.roll_no})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold mb-1">Subject Code</label>
                        <select
                          value={selectedSubjectCode}
                          onChange={(e) => setSelectedSubjectCode(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                        >
                          <option value="ENG-101">ENG-101 (Max 100)</option>
                          <option value="ENG-201">ENG-201 (Max 100)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Marks (0–100)</label>
                        <input
                          type="number"
                          value={marksValue}
                          onChange={(e) => setMarksValue(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8] font-mono-tabular"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-[#720F19] text-[#FFFDF8] font-bold cursor-pointer"
                    >
                      Validate & Submit Marks
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column (4 cols): Exam Duty & Hostel Duty Roster matching Page 27 */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs">
                  <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                    Assigned Exam Invigilation Duty
                  </h3>
                  {data.examDuties.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#D5A83D] space-y-1"
                    >
                      <div className="font-bold text-[#540B12]">{d.hall_name}</div>
                      <div>{d.subject_name}</div>
                      <div className="font-mono-tabular text-[#71676A]">
                        {d.duty_date} · {d.duty_time}
                      </div>
                      <div className="pt-1 text-[#247A50] font-bold">✓ {d.status}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-2 shadow-sm text-xs">
                  <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                    Hostel Duty Roster
                  </h3>
                  <div className="font-semibold text-[#540B12]">
                    Assigned: {data.staffProfile.full_name} — Block B (Floor 2)
                  </div>
                  <div className="text-[#71676A]">Duty: Evening Prep & Roll Call (8:00 PM)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE MARKING */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-5 shadow-sm text-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6D6B8] pb-4">
                <div>
                  <h2 className="font-editorial text-xl font-bold text-[#23191A]">
                    Class Attendance Register & Session History
                  </h2>
                  <p className="text-[#71676A] mt-0.5">
                    Server enforces teacher-class ownership and prevents duplicate attendance for the
                    same class, subject, date, and slot.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedClassSection}
                    onChange={(e) => setSelectedClassSection(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8] font-semibold"
                  >
                    {data.assignedClasses.map((cls: string) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8] font-mono-tabular"
                  />
                  <select
                    value={sessionSlot}
                    onChange={(e) => setSessionSlot(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8]"
                  >
                    <option value="MORNING">MORNING LECTURE</option>
                    <option value="LAB">AFTERNOON LAB</option>
                    <option value="EVENING_PREP">EVENING PREP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {data.students
                  .filter((s: any) => s.class_name === selectedClassSection)
                  .map((stu: any) => {
                    const st = quickAttendance[stu.id] || 'PRESENT';
                    return (
                      <div
                        key={stu.id}
                        className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#23191A]">
                            {stu.full_name}{' '}
                            <span className="font-mono-tabular text-xs text-[#720F19]">
                              ({stu.roll_no})
                            </span>
                          </div>
                          <div className="text-[#71676A]">
                            {stu.class_name} · Wing: {stu.house_wing} · Overall Attendance:{' '}
                            {stu.attendance_percent}%
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setQuickAttendance({
                              ...quickAttendance,
                              [stu.id]: st === 'PRESENT' ? 'ABSENT' : 'PRESENT',
                            })
                          }
                          className={`px-4 py-1.5 rounded-lg font-bold cursor-pointer ${
                            st === 'PRESENT'
                              ? 'bg-[#247A50] text-white'
                              : 'bg-[#B4232C] text-white'
                          }`}
                        >
                          {st}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                onClick={() => handleSaveAttendance()}
                className="px-6 py-2.5 rounded-lg bg-[#720F19] text-[#FFFDF8] font-bold cursor-pointer"
              >
                Save Attendance Session to Database
              </button>

              <div className="pt-4 border-t border-[#E6D6B8] space-y-2">
                <h3 className="font-bold text-[#540B12] uppercase">Recorded Attendance Sessions</h3>
                {data.attendanceSessions.map((sess: any) => (
                  <div
                    key={sess.id}
                    className="p-3 rounded-lg bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between"
                  >
                    <span>
                      <strong>{sess.class_name}</strong> — {sess.subject_name} ({sess.session_label})
                    </span>
                    <span className="font-mono-tabular text-[#71676A]">
                      {sess.attendance_date} · {sess.records.length} Cadets Marked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNMENTS & GRADING */}
          {activeTab === 'assignments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
              <form
                onSubmit={handleCreateAssignment}
                className="lg:col-span-5 bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm"
              >
                <h2 className="font-editorial text-lg font-bold text-[#23191A] border-b border-[#E6D6B8] pb-2">
                  Post New Assignment
                </h2>
                <div>
                  <label className="block font-semibold mb-1">Assignment Title *</label>
                  <input
                    type="text"
                    required
                    value={newAssignTitle}
                    onChange={(e) => setNewAssignTitle(e.target.value)}
                    placeholder="e.g. Iqbal's Concept of Khudi Essay"
                    className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Assigned Class</label>
                    <select
                      value={newAssignClass}
                      onChange={(e) => setNewAssignClass(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                    >
                      {data.assignedClasses.map((cls: string) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Max Marks</label>
                    <input
                      type="number"
                      value={newAssignMaxMarks}
                      onChange={(e) => setNewAssignMaxMarks(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8] font-mono-tabular"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newAssignDue}
                    onChange={(e) => setNewAssignDue(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8] font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Instructions *</label>
                  <textarea
                    rows={3}
                    required
                    value={newAssignDesc}
                    onChange={(e) => setNewAssignDesc(e.target.value)}
                    placeholder="Describe assignment instructions..."
                    className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#720F19] text-[#FFFDF8] font-bold cursor-pointer"
                >
                  Publish Assignment
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-4 shadow-sm">
                <h2 className="font-editorial text-lg font-bold text-[#23191A] border-b border-[#E6D6B8] pb-2">
                  Cadet Submissions & Grading Queue
                </h2>
                {data.assignments.map((assign: any) => (
                  <div
                    key={assign.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#540B12]">{assign.title}</div>
                        <div className="text-[#71676A]">
                          {assign.class_name} · Due: {assign.due_at} · Max Marks: {assign.max_marks}
                        </div>
                      </div>
                      <span className="font-mono-tabular font-bold px-2.5 py-1 rounded bg-white border border-[#E6D6B8]">
                        {assign.submissions.length} Submissions
                      </span>
                    </div>

                    {assign.submissions.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-lg bg-white border border-[#E6D6B8] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#23191A]">
                            {sub.cadet_name} ({sub.roll_no})
                          </span>
                          <span className="font-mono-tabular font-bold text-[#247A50]">
                            {sub.status}{' '}
                            {sub.marks_awarded !== null
                              ? `(${sub.marks_awarded}/${assign.max_marks})`
                              : ''}
                          </span>
                        </div>
                        <p className="text-[#71676A]">{sub.submission_text}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <input
                            type="number"
                            placeholder={`Marks / ${assign.max_marks}`}
                            value={gradeMarks[sub.id] ?? (sub.marks_awarded ?? '')}
                            onChange={(e) =>
                              setGradeMarks({ ...gradeMarks, [sub.id]: e.target.value })
                            }
                            className="w-24 px-2.5 py-1.5 rounded bg-[#F7F0E5] border border-[#E6D6B8] font-mono-tabular"
                          />
                          <input
                            type="text"
                            placeholder="Instructor feedback..."
                            value={gradeFeedback[sub.id] ?? (sub.feedback || '')}
                            onChange={(e) =>
                              setGradeFeedback({ ...gradeFeedback, [sub.id]: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1.5 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleGradeSubmission(assign.id, sub.id, assign.max_marks)
                            }
                            className="px-3 py-1.5 rounded bg-[#247A50] text-white font-bold cursor-pointer"
                          >
                            Save Grade
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXAM & HOSTEL DUTIES */}
          {activeTab === 'duties' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-4 shadow-sm text-xs">
              <h2 className="font-editorial text-xl font-bold text-[#23191A]">
                Assigned Examination Invigilation & Evening Prep Duties
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.examDuties.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#D5A83D] space-y-1.5"
                  >
                    <div className="font-bold text-sm text-[#540B12]">{d.hall_name}</div>
                    <div className="font-semibold text-[#23191A]">{d.subject_name}</div>
                    <div className="font-mono-tabular text-[#71676A]">
                      Date: {d.duty_date} · Time: {d.duty_time}
                    </div>
                    <div className="text-[#247A50] font-bold">Status: {d.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: RESULTS / MARKS ENTRY */}
          {activeTab === 'marks' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-6 shadow-sm text-xs">
              <h2 className="font-editorial text-xl font-bold text-[#23191A]">
                Subject Marks Entry & Validation (0 to Max Marks)
              </h2>
              <form onSubmit={handleEnterMarks} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block font-semibold mb-1">Cadet Result Sheet</label>
                  <select
                    value={selectedResultId}
                    onChange={(e) => setSelectedResultId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                  >
                    {data.examResults.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.cadet_name} ({r.roll_no})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subject Code</label>
                  <select
                    value={selectedSubjectCode}
                    onChange={(e) => setSelectedSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                  >
                    <option value="ENG-101">ENG-101 (Max 100)</option>
                    <option value="ENG-201">ENG-201 (Max 100)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Marks Obtained (0–100)</label>
                  <input
                    type="number"
                    value={marksValue}
                    onChange={(e) => setMarksValue(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8] font-mono-tabular"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 rounded bg-[#720F19] text-[#FFFDF8] font-bold cursor-pointer"
                >
                  Save & Recompute Grade
                </button>
              </form>

              <div className="space-y-3 pt-4 border-t border-[#E6D6B8]">
                {data.examResults.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#23191A]">
                        {r.cadet_name} ({r.roll_no}) — {r.class_name}
                      </div>
                      <div className="font-mono-tabular text-[#71676A]">
                        Aggregate: {r.total_obtained_marks}/{r.total_max_marks} ({r.percentage}% ·
                        Grade {r.grade_letter})
                      </div>
                    </div>
                    <span className="font-mono-tabular font-bold text-[#247A50]">
                      {r.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// ============================================================================
// PRINTABLE OFFICIAL FEE VOUCHER / RECEIPT MODAL
// ============================================================================
export const PrintableFeeVoucherModal: React.FC<{
  invoice: any;
  onClose: () => void;
}> = ({ invoice, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border-2 border-[#540B12] overflow-hidden shadow-2xl my-8">
        <div className="bg-[#540B12] text-[#FFFDF8] px-6 py-4 flex items-center justify-between no-print">
          <span className="font-editorial font-bold text-base">
            Official BRC Zhob Fee Voucher / Payment Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded bg-[#720F19] text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs text-[#23191A]">
          <div className="flex items-center justify-between border-b-2 border-[#540B12] pb-4">
            <div className="flex items-center gap-3">
              <img
                src={BRC_LOGO_URL}
                alt="BRC Zhob Crest"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border-2 border-[#D5A83D]"
              />
              <div>
                <h2 className="font-editorial text-lg font-bold text-[#540B12]">
                  BALOCHISTAN RESIDENTIAL COLLEGE ZHOB
                </h2>
                <div className="text-[#71676A]">OFFICIAL FEE VOUCHER & PAYMENT STATEMENT</div>
              </div>
            </div>
            <div className="text-right font-mono-tabular">
              <div className="font-bold text-[#720F19]">{invoice.invoice_no}</div>
              <div>Status: {invoice.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
            <div>
              <span className="text-[#71676A] block">Cadet Name & Roll No:</span>
              <strong className="text-[#23191A]">
                {invoice.cadet_name} ({invoice.roll_no})
              </strong>
            </div>
            <div>
              <span className="text-[#71676A] block">Class & Billing Period:</span>
              <strong className="text-[#23191A]">{invoice.class_name}</strong>
            </div>
            <div>
              <span className="text-[#71676A] block">Issue Date:</span>
              <span className="font-mono-tabular">{invoice.issue_date}</span>
            </div>
            <div>
              <span className="text-[#71676A] block">Due Date:</span>
              <span className="font-mono-tabular font-bold text-[#720F19]">{invoice.due_date}</span>
            </div>
          </div>

          <table className="w-full text-left border border-[#E6D6B8]">
            <thead className="bg-[#540B12] text-[#FFFDF8]">
              <tr>
                <th className="py-2 px-3">Fee Head Description</th>
                <th className="py-2 px-3 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6D6B8]">
              {invoice.items.map((it: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 px-3">{it.label}</td>
                  <td className="py-2 px-3 text-right font-mono-tabular">
                    {it.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F7F0E5] font-bold border-t-2 border-[#540B12]">
              <tr>
                <td className="py-2.5 px-3">TOTAL PAYABLE / PAID</td>
                <td className="py-2.5 px-3 text-right font-mono-tabular text-[#720F19]">
                  PKR {invoice.total_amount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          {invoice.payment && (
            <div className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] space-y-1">
              <div className="font-bold text-[#540B12]">Bank Deposit Slip Record</div>
              <div>
                Slip Ref: <strong className="font-mono-tabular">{invoice.payment.reference_no}</strong> ·
                Bank: {invoice.payment.bank_name_branch}
              </div>
              <div>
                Verification Status: <strong>{invoice.payment.status}</strong> (
                {invoice.payment.verification_note})
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CADET PORTAL (/cadet/*) — Matches Page 28 Original Cadet Portal Reference
// ============================================================================
export const CadetPortal: React.FC<{
  sessionToken: string;
  navigate: (path: string) => void;
  onLogout: () => void;
}> = ({ sessionToken, navigate, onLogout }) => {
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'timetable' | 'assignments' | 'results' | 'fees'
  >('dashboard');
  const [selectedReportCard, setSelectedReportCard] = useState<ExamResultSummaryRecord | null>(
    null
  );
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [slipRefNo, setSlipRefNo] = useState('NBP-ZH-774120');
  const [toast, setToast] = useState<string | null>(null);

  const fetchCadetData = async () => {
    const res = await fetch('/api/portal/cadet', {
      headers: { 'X-BRC-Session': sessionToken },
    });
    if (res.ok) {
      setData(await res.json());
    }
  };

  useEffect(() => {
    fetchCadetData();
  }, [sessionToken]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmitAssignment = async (assignId: number) => {
    const res = await fetch(`/api/cadet/assignments/${assignId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        submission_text: submissionText || 'Submitted completed exercise.',
      }),
    });
    if (res.ok) {
      notify('Assignment submitted successfully!');
      setSubmissionText('');
      fetchCadetData();
    }
  };

  const handleUploadFeeSlip = async (invoiceId: number) => {
    const res = await fetch(`/api/parent/fees/${invoiceId}/upload-slip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        reference_no: slipRefNo,
        bank_name_branch: 'National Bank of Pakistan — Zhob Branch',
        deposit_date: '2026-10-30',
        slip_filename: 'cadet_fee_deposit_slip.pdf',
      }),
    });
    if (res.ok) {
      notify('Deposit slip uploaded — Status set to PENDING_VERIFICATION (Manual Admin check required).');
      fetchCadetData();
    }
  };

  if (!data) {
    return <div className="p-12 text-center text-sm">Loading Cadet Portal...</div>;
  }

  const c = data.cadet;

  return (
    <div className="min-h-screen bg-[#F7F0E5] flex flex-col">
      <header className="bg-gradient-to-r from-[#540B12] to-[#720F19] text-[#FFFDF8] px-6 h-16 flex items-center justify-between border-b border-[#D5A83D]/40">
        <div className="flex items-center gap-3">
          <img
            src={BRC_LOGO_URL}
            alt="BRC Zhob Crest"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full border border-[#D5A83D] bg-white"
          />
          <div>
            <div className="font-editorial font-bold text-lg sm:text-xl">
              BRC Zhob LMS — Cadet Portal
            </div>
            <div className="text-[11px] text-[#F0D18A]">
              {c.full_name} ({c.roll_no}) • Strict Own-Record Isolation
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded bg-[#3E080D] text-[#F0D18A] border border-[#D5A83D]/30 font-semibold cursor-pointer"
          >
            Public Website
          </button>
          <span className="font-semibold hidden sm:inline">{c.full_name}</span>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded bg-[#3E080D] hover:bg-[#8D1722] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#247A50] text-white px-5 py-3 rounded-xl shadow-xl text-xs font-bold">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar matching Page 28 */}
        <aside className="w-full lg:w-64 bg-gradient-to-b from-[#540B12] to-[#3E080D] text-[#FFFDF8] p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="text-center pb-5 border-b border-[#D5A83D]/25 mb-4">
              <img
                src={BRC_LOGO_URL}
                alt="BRC Zhob Crest"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full mx-auto border-2 border-[#D5A83D] bg-white"
              />
              <div className="font-editorial font-bold text-base mt-2">BRC ZHOB</div>
              <div className="text-xs text-[#F0D18A]">
                {c.roll_no} • Kit {c.kit_no}
              </div>
            </div>

            <nav className="space-y-1.5 text-xs sm:text-sm mb-5">
              {[
                { id: 'dashboard', label: 'Dashboard Overview' },
                { id: 'timetable', label: 'Timetable & Attendance' },
                { id: 'assignments', label: 'Assignments & Work' },
                { id: 'results', label: 'Published Report Cards' },
                { id: 'fees', label: 'Fee Vouchers & Slips' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-[#D5A83D] to-[#F0D18A] text-[#23191A]'
                      : 'text-[#FFFDF8]/85 hover:bg-[#720F19]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="space-y-2 text-xs text-[#FFFDF8]/85 px-2 pt-3 border-t border-[#D5A83D]/25">
              <div>
                <span className="text-[#F0D18A] block">Class & Program:</span>
                <strong>{c.class_name}</strong>
              </div>
              <div>
                <span className="text-[#F0D18A] block">Wing & Room:</span>
                <strong>
                  {c.house_wing} • {c.room_no}
                </strong>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content matching Page 28 */}
        <main className="flex-1 p-6 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <h1 className="font-editorial text-2xl font-bold text-[#23191A]">
                Welcome back, {c.full_name}
              </h1>
              <div className="text-xs text-[#71676A] mt-0.5">
                {c.class_name} • Academic Year {c.academic_year} • Admission No: {c.admission_no}
              </div>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-[#D5A83D]/30 border border-[#D5A83D] text-[#540B12] font-bold text-xs">
              Active Cadet • Hostel: {c.hostel_block} ({c.room_no})
            </span>
          </div>

          {/* 3 KPI Cards matching Page 28 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('timetable')}
              className="bg-white hover:border-[#D5A83D] rounded-2xl border border-[#E6D6B8] p-5 text-left shadow-sm cursor-pointer"
            >
              <div className="text-xs text-[#71676A]">Attendance</div>
              <div className="font-mono-tabular text-3xl font-bold text-[#23191A] mt-1">
                {c.attendance_percent}%
              </div>
              <div className="text-xs text-[#247A50] font-semibold mt-1">
                ↑ +3% from last month
              </div>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className="bg-white hover:border-[#D5A83D] rounded-2xl border border-[#E6D6B8] p-5 text-left shadow-sm cursor-pointer"
            >
              <div className="text-xs text-[#71676A]">CGPA</div>
              <div className="font-mono-tabular text-3xl font-bold text-[#23191A] mt-1">
                {c.cgpa}
              </div>
              <div className="text-xs text-[#71676A] mt-1">Semester 1 • {c.academic_year}</div>
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className="bg-white hover:border-[#D5A83D] rounded-2xl border border-[#E6D6B8] p-5 text-left shadow-sm cursor-pointer"
            >
              <div className="text-xs text-[#71676A]">Pending Assignments</div>
              <div className="font-mono-tabular text-3xl font-bold text-[#23191A] mt-1">
                {data.assignments.length}
              </div>
              <div className="text-xs text-[#A36A13] font-semibold mt-1">Due this week</div>
            </button>
          </div>

          {(activeTab === 'dashboard' || activeTab === 'timetable' || activeTab === 'assignments') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Today's Classes & Assignments (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm">
                  <h2 className="font-editorial font-bold text-lg text-[#23191A] border-b border-[#E6D6B8] pb-2">
                    Today's Classes & Attendance Log
                  </h2>
                  {data.timetable.map((slot: any) => (
                    <div
                      key={slot.id}
                      className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono-tabular text-[#71676A]">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <div className="font-bold text-sm text-[#23191A] mt-0.5">
                          {slot.subject_name}
                        </div>
                        <div className="text-[#71676A]">
                          {slot.room_label} • {slot.teacher_name}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#D5A83D] text-[#23191A] font-bold">
                        {slot.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Assignment Submission Box */}
                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs">
                  <h2 className="font-editorial font-bold text-lg text-[#23191A] border-b border-[#E6D6B8] pb-2">
                    Assignments & Submissions
                  </h2>
                  {data.assignments.map((a: any) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] space-y-2"
                    >
                      <div className="font-bold text-sm text-[#540B12]">{a.title}</div>
                      <p className="text-[#71676A]">{a.description}</p>
                      <div className="font-mono-tabular text-[#720F19]">
                        Due: {a.due_at} · Max Marks: {a.max_marks}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          placeholder="Write response or submission note..."
                          className="flex-1 px-3 py-1.5 rounded bg-white border border-[#E6D6B8]"
                        />
                        <button
                          onClick={() => handleSubmitAssignment(a.id)}
                          className="px-4 py-1.5 rounded bg-[#720F19] text-[#FFFDF8] font-bold cursor-pointer"
                        >
                          Submit Work
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Published Results, Fee Status & Warden Remarks (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs">
                  <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                    Published Report Card
                  </h3>
                  {data.results.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#23191A]">{r.exam_name}</div>
                        <div className="font-mono-tabular text-[#247A50] font-bold mt-0.5">
                          {r.percentage}% (Grade {r.grade_letter})
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedReportCard(r)}
                        className="px-3 py-1.5 rounded bg-[#720F19] text-[#FFFDF8] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Card</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs">
                  <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                    Fee Vouchers & Deposit Slip Upload
                  </h3>
                  {data.invoices.map((inv: any) => (
                    <div key={inv.id} className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#247A50]">{inv.status}</span>
                        <span className="font-mono-tabular font-bold text-sm">
                          PKR {inv.total_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[#71676A]">{inv.billing_title}</div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => setSelectedVoucher(inv)}
                          className="px-3 py-1.5 rounded bg-[#540B12] text-[#F0D18A] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Voucher</span>
                        </button>
                        <button
                          onClick={() => handleUploadFeeSlip(inv.id)}
                          className="px-3 py-1.5 rounded bg-[#D5A83D] text-[#23191A] font-bold cursor-pointer"
                        >
                          Upload Deposit Slip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-2 shadow-sm text-xs">
                  <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                    Hostel Warden Conduct Remarks
                  </h3>
                  {data.wardenRemarks.map((w: any) => (
                    <div key={w.id} className="space-y-1">
                      <p className="italic text-[#23191A]">“{w.remark}”</p>
                      <div className="text-[#71676A] font-semibold">
                        — {w.warden_name} ({w.created_at})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-4 shadow-sm text-xs">
              <h2 className="font-editorial text-xl font-bold text-[#23191A]">
                Published Examination Report Cards
              </h2>
              {data.results.map((r: any) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-[#23191A]">{r.exam_name}</div>
                    <div className="font-mono-tabular text-[#71676A]">
                      Obtained: {r.total_obtained_marks}/{r.total_max_marks} ({r.percentage}% ·
                      Grade {r.grade_letter})
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReportCard(r)}
                    className="px-4 py-2 rounded-lg bg-[#720F19] text-[#FFFDF8] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Open Printable Report Card</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-6 space-y-4 shadow-sm text-xs">
              <h2 className="font-editorial text-xl font-bold text-[#23191A]">
                Fee Invoices, Bank Deposit Slip Upload & Printable Receipts
              </h2>
              <p className="text-[#71676A]">
                Uploading a bank deposit slip sets the status to <code>PENDING_VERIFICATION</code>{' '}
                until manually verified by the Finance Administrator.
              </p>
              {data.invoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-bold text-sm text-[#23191A]">
                      {inv.invoice_no} — {inv.billing_title}
                    </div>
                    <div className="font-mono-tabular text-[#720F19] font-bold mt-0.5">
                      PKR {inv.total_amount.toLocaleString()} · Status: {inv.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slipRefNo}
                      onChange={(e) => setSlipRefNo(e.target.value)}
                      placeholder="Deposit Slip No"
                      className="px-3 py-1.5 rounded bg-white border border-[#E6D6B8] font-mono-tabular"
                    />
                    <button
                      onClick={() => handleUploadFeeSlip(inv.id)}
                      className="px-3.5 py-1.5 rounded bg-[#D5A83D] text-[#23191A] font-bold cursor-pointer"
                    >
                      Submit Slip (Pending Verification)
                    </button>
                    <button
                      onClick={() => setSelectedVoucher(inv)}
                      className="px-3.5 py-1.5 rounded bg-[#720F19] text-[#FFFDF8] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Voucher</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedReportCard && (
        <PrintableReportCardModal
          result={selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
        />
      )}
      {selectedVoucher && (
        <PrintableFeeVoucherModal
          invoice={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// PARENT PORTAL (/parent/*) — Matches Page 29 Original Parents Portal Reference
// ============================================================================
export const ParentPortal: React.FC<{
  sessionToken: string;
  navigate: (path: string) => void;
  onLogout: () => void;
}> = ({ sessionToken, navigate, onLogout }) => {
  const [data, setData] = useState<any | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number>(2); // Default Cadet Bilal Ahmed (Roll ZH-1012)
  const [tamperError, setTamperError] = useState<string | null>(null);
  const [selectedReportCard, setSelectedReportCard] = useState<ExamResultSummaryRecord | null>(
    null
  );
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchParentData = async (childId: number) => {
    setTamperError(null);
    const res = await fetch(`/api/portal/parent?cadetId=${childId}`, {
      headers: { 'X-BRC-Session': sessionToken },
    });
    const json = await res.json();
    if (!res.ok) {
      setTamperError(json.error || '403 Forbidden: Unlinked child record blocked.');
    } else {
      setData(json);
    }
  };

  useEffect(() => {
    fetchParentData(selectedChildId);
  }, [sessionToken, selectedChildId]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const res = await fetch('/api/parent/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        cadet_id: data.activeChild.id,
        start_date: '2026-11-10',
        end_date: '2026-11-11',
        reason: leaveReason,
      }),
    });
    if (res.ok) {
      setToast('Leave application submitted for Principal/Warden approval.');
      setLeaveReason('');
      fetchParentData(selectedChildId);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !messageText) return;
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BRC-Session': sessionToken },
      body: JSON.stringify({
        recipient_user_id: 2, // Prof. Najaf Hussain
        cadet_id: data.activeChild.id,
        subject: `Parent Inquiry regarding ${data.activeChild.full_name}`,
        body: messageText,
      }),
    });
    if (res.ok) {
      setToast('Message sent to Prof. Najaf Hussain.');
      setMessageText('');
      fetchParentData(selectedChildId);
      setTimeout(() => setToast(null), 3500);
    }
  };

  if (!data) {
    return <div className="p-12 text-center text-sm">Loading Parent Portal...</div>;
  }

  const child = data.activeChild;
  const latestResult: ExamResultSummaryRecord | undefined = data.results[0];
  const latestInvoice = data.invoices[0];

  return (
    <div className="min-h-screen bg-[#F7F0E5] flex flex-col">
      <header className="bg-gradient-to-r from-[#540B12] to-[#720F19] text-[#FFFDF8] px-6 h-16 flex items-center justify-between border-b border-[#D5A83D]/40">
        <div className="flex items-center gap-3">
          <img
            src={BRC_LOGO_URL}
            alt="BRC Zhob Crest"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full border border-[#D5A83D] bg-white"
          />
          <div>
            <div className="font-editorial font-bold text-lg sm:text-xl">
              BRC Zhob LMS — Parents Portal
            </div>
            <div className="text-[11px] text-[#F0D18A]">
              Guardian: {data.guardian.full_name} • Active Child: {child.full_name} ({child.roll_no})
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded bg-[#3E080D] text-[#F0D18A] border border-[#D5A83D]/30 font-semibold cursor-pointer"
          >
            Public Website
          </button>
          <span className="font-semibold hidden sm:inline">{data.guardian.full_name}</span>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded bg-[#3E080D] hover:bg-[#8D1722] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#247A50] text-white px-5 py-3 rounded-xl shadow-xl text-xs font-bold">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar matching Page 29 */}
        <aside className="w-full lg:w-64 bg-gradient-to-b from-[#540B12] to-[#3E080D] text-[#FFFDF8] p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="text-center pb-5 border-b border-[#D5A83D]/25 mb-4">
              <img
                src={BRC_LOGO_URL}
                alt="BRC Zhob Crest"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full mx-auto border-2 border-[#D5A83D] bg-white"
              />
              <div className="font-editorial font-bold text-base mt-2">BRC • 2016</div>
              <div className="text-xs text-[#F0D18A]">Verified Parent Portal</div>
            </div>

            <div className="space-y-2 text-xs px-2">
              <div className="text-[#F0D18A] font-bold uppercase">Switch Linked Child:</div>
              {data.linkedChildren.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildId(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    child.id === c.id
                      ? 'bg-[#D5A83D] text-[#23191A]'
                      : 'bg-[#3E080D] text-[#FFFDF8] hover:bg-[#720F19]'
                  }`}
                >
                  <div>{c.full_name}</div>
                  <div className="text-[11px] opacity-80">
                    {c.class_name} • {c.roll_no}
                  </div>
                </button>
              ))}

              {/* Ownership Security Verification Button */}
              <button
                onClick={() => fetchParentData(3)} // Cadet #3 (Ayesha Khan) is NOT linked to Mr. Abdullah Khan
                className="w-full text-left p-2.5 rounded-xl bg-[#3E080D] hover:bg-[#B4232C] text-[#F0D18A] border border-[#D5A83D]/30 text-[11px] cursor-pointer mt-3"
              >
                🔒 Test RBAC Ownership Guard (Try Unlinked Cadet #3)
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#FFFDF8]/60 text-center pt-4 border-t border-[#D5A83D]/25">
            v2.1 • Server Ownership Enforced
          </div>
        </aside>

        {/* Main Content matching Page 29 */}
        <main className="flex-1 p-6 space-y-6">
          {tamperError && (
            <div className="p-4 rounded-xl bg-[#B4232C]/15 border-2 border-[#B4232C] text-[#B4232C] text-xs font-bold flex items-center justify-between">
              <span>{tamperError}</span>
              <button
                onClick={() => setTamperError(null)}
                className="underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Welcome Banner matching Page 29 */}
          <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <h1 className="font-editorial text-2xl font-bold text-[#23191A]">
                Welcome, {data.guardian.full_name}
              </h1>
              <div className="text-xs text-[#71676A] mt-0.5">
                Parent of <strong>{child.full_name}</strong> • {child.class_name} • Roll No{' '}
                {child.roll_no} • Hostel {child.hostel_block} • {child.room_no}
              </div>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-[#247A50]/15 border border-[#247A50] text-[#247A50] font-bold text-xs">
              • Active Parent • Verified Link
            </span>
          </div>

          {/* 4 KPI Cards matching Page 29 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-4 shadow-sm">
              <div className="text-xs text-[#71676A]">Overall Attendance</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#23191A] mt-1">
                {child.attendance_percent}%
              </div>
              <div className="text-[11px] text-[#247A50] font-semibold mt-1">
                ↑ +2% from last month
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-4 shadow-sm">
              <div className="text-xs text-[#71676A]">Current CGPA</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#23191A] mt-1">
                {child.cgpa}
              </div>
              <div className="text-[11px] text-[#71676A] mt-1">Out of 4.0 • Grade: A</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-4 shadow-sm">
              <div className="text-xs text-[#71676A]">Fee Status</div>
              <div className="font-editorial text-xl sm:text-2xl font-bold text-[#247A50] mt-1">
                Paid till Oct 2026
              </div>
              <div className="text-[11px] text-[#71676A] mt-1">No dues pending</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E6D6B8] p-4 shadow-sm">
              <div className="text-xs text-[#71676A]">Conduct</div>
              <div className="font-editorial text-xl sm:text-2xl font-bold text-[#23191A] mt-1">
                {child.conduct_grade}
              </div>
              <div className="text-[11px] text-[#71676A] mt-1">
                No disciplinary issues • Good behavior
              </div>
            </div>
          </div>

          {/* 3-Column Grid matching Page 29 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Recent Results & Hostel Safety (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b border-[#E6D6B8] pb-2">
                  <div>
                    <h2 className="font-editorial font-bold text-base text-[#23191A]">
                      Recent Results
                    </h2>
                    <div className="text-[11px] text-[#71676A]">
                      {latestResult?.exam_name || 'Semester Term Exam'}
                    </div>
                  </div>
                  {latestResult && (
                    <button
                      onClick={() => setSelectedReportCard(latestResult)}
                      className="px-3 py-1.5 rounded bg-[#720F19] text-[#FFFDF8] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Report Card</span>
                    </button>
                  )}
                </div>

                {latestResult?.subject_marks.map((sm, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>{sm.subject_name}</span>
                      <span className="font-mono-tabular">
                        {sm.marks_obtained}% · Grade: {sm.grade}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F7F0E5] overflow-hidden">
                      <div
                        className="h-full bg-[#247A50]"
                        style={{ width: `${sm.marks_obtained}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b border-[#E6D6B8] pb-2">
                  <h3 className="font-editorial font-bold text-base text-[#23191A]">
                    Hostel Block Status & Fee Voucher
                  </h3>
                  {latestInvoice && (
                    <button
                      onClick={() => setSelectedVoucher(latestInvoice)}
                      className="px-2.5 py-1 rounded bg-[#540B12] text-[#F0D18A] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Fee Receipt</span>
                    </button>
                  )}
                </div>
                <div className="font-bold text-[#247A50]">
                  {child.hostel_block} ({child.room_no}) — Safe
                </div>
                <div className="text-[#71676A]">
                  Status: Safe • Morning Roll Call & Evening Prep Verified
                </div>
              </div>
            </div>

            {/* Column 2: Classes Attended, Hostel Warden Remarks & Leave Balance (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-2 shadow-sm text-xs">
                <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                  Today's Classes Attended
                </h3>
                <div className="font-bold text-sm text-[#247A50]">5 of 5 Classes Attended</div>
                <div className="text-[#71676A]">
                  ✓ English • ✓ Maths • ✓ Physics • ✓ Chemistry • ✓ Urdu
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-2 shadow-sm text-xs">
                <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                  Hostel Warden Remarks
                </h3>
                {data.wardenRemarks.map((w: any) => (
                  <div key={w.id} className="space-y-1">
                    <p className="italic text-[#23191A]">“{w.remark}”</p>
                    <div className="text-[#71676A] font-semibold">
                      — {w.warden_name} • {w.created_at}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleLeaveSubmit}
                className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs"
              >
                <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                  Leave Balance: 3 Days Remaining
                </h3>
                <div className="text-[#71676A]">
                  Used: 2 days • Total annual leave quota: 5 days
                </div>
                <input
                  type="text"
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Enter reason for new leave request..."
                  className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded bg-[#720F19] text-[#FFFDF8] font-bold cursor-pointer"
                >
                  Submit Leave Application
                </button>
              </form>
            </div>

            {/* Column 3: Communication with Teachers (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              <form
                onSubmit={handleSendMessage}
                className="bg-white rounded-2xl border border-[#E6D6B8] p-5 space-y-3 shadow-sm text-xs"
              >
                <h3 className="font-editorial font-bold text-base text-[#23191A] border-b border-[#E6D6B8] pb-2">
                  Communication with Teachers
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.messages.map((m: any) => (
                    <div key={m.id} className="p-2.5 rounded bg-[#F7F0E5] border border-[#E6D6B8]">
                      <div className="font-bold text-[#540B12]">{m.sender_name}</div>
                      <p className="text-[#23191A] mt-0.5">{m.body}</p>
                    </div>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write message to Prof. Najaf Hussain..."
                  className="w-full px-3 py-2 rounded bg-[#F7F0E5] border border-[#E6D6B8]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold cursor-pointer"
                >
                  Message Prof. Najaf
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {selectedReportCard && (
        <PrintableReportCardModal
          result={selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
        />
      )}
      {selectedVoucher && (
        <PrintableFeeVoucherModal
          invoice={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// XAMPP PHP + MYSQL SOURCE CODE & COMPLETE DEPLOYMENT ZIP BUNDLE MODAL
// ============================================================================
export const XamppCodebaseModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [files, setFiles] = useState<
    { path: string; label: string; lang: string; content: string }[]
  >([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [buildingZip, setBuildingZip] = useState(false);

  useEffect(() => {
    fetch(`${BRC_BASE_PREFIX}/api/xampp/files`)
      .then((r) => r.json())
      .then((json) => setFiles(json.files || []))
      .catch(() => {});
  }, []);

  const filteredFiles = files.filter(
    (f) =>
      !searchFilter ||
      f.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.path.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const currentFile = filteredFiles[selectedIdx] || files[0];

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.split('/').pop() || 'brc_zhob_file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCompleteZipBundle = async () => {
    setBuildingZip(true);
    try {
      // 1. Try server-side pre-packaged brc-zhob.zip endpoint first
      try {
        const res = await fetch(`${BRC_BASE_PREFIX}/api/xampp/download-zip`);
        const cType = res.headers.get('content-type') || '';
        if (res.ok && (cType.includes('application/zip') || cType.includes('application/octet-stream'))) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'brc-zhob.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        }
      } catch {}

      // 2. Client-side JSZip packager with files directly at the ZIP root
      const zip = new JSZip();
      files.forEach((f) => {
        const cleanRelPath = f.path.replace(/^brc-zhob\//, '');
        zip.file(cleanRelPath, f.content);
      });
      zip.folder('uploads/slips');
      zip.folder('uploads/principal');
      zip.folder('uploads/gallery');

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brc-zhob.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBuildingZip(false);
    }
  };

  const handleCopyCode = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#FFFDF8] rounded-2xl max-w-6xl w-full h-[88vh] border-2 border-[#D5A83D] overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-[#3E080D] via-[#540B12] to-[#3E080D] text-[#FFFDF8] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-[#D5A83D]/50">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-[#D5A83D]" />
            <div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold">
                BRC Zhob — Plug-and-Play XAMPP &amp; cPanel Deployment Bundle (`brc-zhob/`)
              </h3>
              <p className="text-xs text-[#F0D18A]">
                Compiled Ivory &amp; Maroon Frontend • Zero-State `brc_zhob_db` Schema • 6 PDO PHP 8.2 Endpoints • `.htaccess` RCE Protection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCompleteZipBundle}
              disabled={buildingZip}
              className="px-4 py-2 rounded-lg bg-[#D5A83D] hover:bg-[#F0D18A] text-[#23191A] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Archive className="w-4 h-4" />
              <span>
                {buildingZip ? 'Packaging brc-zhob.zip...' : 'Download Plug-and-Play ZIP (brc-zhob.zip)'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-[#720F19] hover:bg-[#8D1722] text-xs font-bold cursor-pointer"
            >
              Close ✕
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <aside className="w-full md:w-80 bg-[#F7F0E5] border-r border-[#E6D6B8] p-3 flex flex-col gap-2 overflow-y-auto shrink-0">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setSelectedIdx(0);
              }}
              placeholder="Filter bundle files..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E6D6B8] text-xs"
            />
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {filteredFiles.map((f, idx) => (
                <button
                  key={f.path}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentFile?.path === f.path
                      ? 'bg-[#720F19] text-[#FFFDF8] font-bold shadow-sm'
                      : 'text-[#23191A] hover:bg-[#E6D6B8]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{f.label}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-black/20 font-mono-tabular">
                      {f.lang}
                    </span>
                  </div>
                  <div className="font-mono-tabular text-[10px] opacity-80 truncate mt-0.5">
                    {f.path}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden bg-[#1E191A] text-[#FFFDF8]">
            {currentFile && (
              <>
                <div className="px-4 py-2.5 bg-[#2D2425] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tabular text-[#F0D18A] font-semibold">
                      {currentFile.path}
                    </span>
                    <span className="font-mono-tabular text-[11px] text-[#FFFDF8]/60">
                      {currentFile.content.split('\n').length} lines
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 rounded bg-[#540B12] hover:bg-[#720F19] text-[#F0D18A] border border-[#D5A83D]/40 font-semibold cursor-pointer"
                    >
                      {copied ? '✓ Copied to Clipboard' : 'Copy Code'}
                    </button>
                    <button
                      onClick={() => handleDownloadFile(currentFile.path, currentFile.content)}
                      className="px-3 py-1 rounded bg-[#D5A83D] text-[#23191A] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
                <pre className="flex-1 p-4 overflow-auto text-xs font-mono-tabular leading-relaxed">
                  {currentFile.content}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


