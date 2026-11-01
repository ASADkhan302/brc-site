import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Printer,
  Search,
  Lock,
  ShieldCheck,
  Award,
  UserCheck,
  KeyRound,
  Download,
  CreditCard,
  Building2,
  Eye,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { RoleCode } from '../types/brc';
import { BRC_BASE_PREFIX, BRC_LOGO_URL } from './LayoutShells';
import {
  ADMISSIONS_STORAGE_KEY,
  CMS_UPDATE_EVENT,
  getLiveCmsData,
} from '../utils/cmsStore';
import { getStoredAdminCreds } from './AdminSecuritySettings';

// ============================================================================
// 01. ACTIVE SYSTEM 1 — ONLINE ADMISSION APPLICATION & LIVE TRACKER (/admissions/*)
// ============================================================================
export const OnlineAdmissionPage: React.FC<{
  mode?: 'apply' | 'track';
  initialMode?: 'apply' | 'track';
  siteSettings?: any;
  navigate: (path: string) => void;
  onSubmissionSuccess?: () => void;
  onSubmitted?: () => void;
}> = ({ mode, initialMode, navigate, onSubmissionSuccess, onSubmitted }) => {
  const effectiveMode = mode || initialMode || 'apply';
  const [cmsData, setCmsData] = useState(() => getLiveCmsData());
  const [activeTab, setActiveTab] = useState<'apply' | 'track'>(effectiveMode);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [showChallanModal, setShowChallanModal] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(mode || initialMode || 'apply');
  }, [mode, initialMode]);

  useEffect(() => {
    const refreshCms = () => setCmsData(getLiveCmsData());
    window.addEventListener(CMS_UPDATE_EVENT, refreshCms);
    window.addEventListener('storage', refreshCms);
    return () => {
      window.removeEventListener(CMS_UPDATE_EVENT, refreshCms);
      window.removeEventListener('storage', refreshCms);
    };
  }, []);

  // Form State (5-Step Admission Wizard)
  const [candidateName, setCandidateName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [classApplied, setClassApplied] = useState<
    'Class 8th' | '1st Year Pre-Med' | '1st Year Pre-Eng' | '1st Year ICS'
  >('Class 8th');
  const [dobFigures, setDobFigures] = useState('');
  const [dobWords, setDobWords] = useState('');
  const [cnicOrFormB, setCnicOrFormB] = useState('');
  const [domicileDistrict, setDomicileDistrict] = useState('Zhob');
  const [quotaCategory, setQuotaCategory] = useState('Zhob');
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousClassPercentage, setPreviousClassPercentage] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  // Step 4: Bank Challan & Deposit Slip State
  const [bankBranch, setBankBranch] = useState(
    'National Bank of Pakistan (NBP Zhob Branch, A/C: 0042-3019284756)'
  );
  const [challanNumber, setChallanNumber] = useState(
    () => `NBP-2026-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [depositDate, setDepositDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slipFileName, setSlipFileName] = useState('');
  const [slipMimeType, setSlipMimeType] = useState('image/jpeg');
  const [slipSizeBytes, setSlipSizeBytes] = useState<number>(0);
  const [slipDataUrl, setSlipDataUrl] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<any | null>(null);

  // Tracker State
  const [trackRef, setTrackRef] = useState('');
  const [trackedApp, setTrackedApp] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [rollSlipModalApp, setRollSlipModalApp] = useState<any | null>(null);
  const [storedApps, setStoredApps] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const syncApps = () => {
      try {
        const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        setStoredApps(list);
        if (trackedApp?.application_ref) {
          const updated = list.find(
            (a: any) => a.application_ref?.toUpperCase() === trackedApp.application_ref.toUpperCase()
          );
          if (updated) {
            setTrackedApp((prev: any) => ({ ...prev, ...updated }));
          }
        }
      } catch {
        // Ignore read error
      }
    };
    window.addEventListener('brc_admissions_updated', syncApps);
    window.addEventListener('storage', syncApps);
    return () => {
      window.removeEventListener('brc_admissions_updated', syncApps);
      window.removeEventListener('storage', syncApps);
    };
  }, [trackedApp?.application_ref]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Only JPG, PNG, or PDF deposit slip files are permitted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Deposit slip file size exceeds maximum limit of 2 MB.');
      return;
    }

    setSlipFileName(file.name);
    setSlipMimeType(file.type);
    setSlipSizeBytes(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSlipDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!candidateName.trim() || !fatherName.trim()) {
        setErrorMsg("Please enter both Candidate's Full Name and Father's Full Name.");
        return false;
      }
    } else if (step === 2) {
      if (!dobFigures.trim() || !dobWords.trim()) {
        setErrorMsg('Please provide Date of Birth in both figures and words.');
        return false;
      }
      if (!previousSchool.trim() || !previousClassPercentage.trim()) {
        setErrorMsg('Please enter Previous School Name and Examination Marks Percentage.');
        return false;
      }
      const pct = Number(previousClassPercentage);
      if (Number.isNaN(pct) || pct < 33 || pct > 100) {
        setErrorMsg('Please enter a valid Previous Examination Marks Percentage (33% – 100%).');
        return false;
      }
    } else if (step === 3) {
      if (!quotaCategory.trim() || !permanentAddress.trim()) {
        setErrorMsg('Please select your District / Quota Category and enter your Permanent Postal Address.');
        return false;
      }
    } else if (step === 4) {
      if (!slipDataUrl || !slipFileName) {
        setErrorMsg('Please upload your paid NBP Fee Deposit Slip (JPG, PNG, or PDF max 2MB) before proceeding.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep((prev) => Math.min(5, prev + 1));
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }
    if (!declarationAccepted) {
      setErrorMsg('Please accept the mandatory candidate & guardian undertaking before final submission.');
      return;
    }

    setSubmitting(true);
    try {
      // Compute sequential reference ID BRC-ADM-2026-XXXX
      let existingApps: any[] = [];
      try {
        const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
        existingApps = raw ? JSON.parse(raw) : [];
      } catch {
        existingApps = [];
      }

      const nextSeq = existingApps.length + 1;
      const generatedRef = `BRC-ADM-2026-${String(nextSeq).padStart(4, '0')}`;

      const payload = {
        application_ref: generatedRef,
        candidate_name: candidateName.trim(),
        father_name: fatherName.trim(),
        gender,
        class_applied: classApplied,
        dob_figures: dobFigures,
        dob_words: dobWords.trim(),
        cnic_or_form_b: cnicOrFormB.trim() || '56501-0000000-0',
        domicile_district: quotaCategory.includes('Quota') || quotaCategory.includes('Merit') ? domicileDistrict : quotaCategory,
        quota_category: quotaCategory,
        previous_school: previousSchool.trim(),
        previous_class_percentage: Number(previousClassPercentage),
        permanent_address: permanentAddress.trim(),
        guardian_phone: guardianPhone.trim() || '0300-0000000',
        guardian_email: guardianEmail.trim() || 'applicant@brczhob.edu.pk',
        bank_branch: bankBranch,
        challan_number: challanNumber,
        amount_pkr: 2500,
        deposit_date: depositDate,
        slip_file_name: slipFileName,
        slip_mime_type: slipMimeType,
        slip_size_bytes: slipSizeBytes,
        slip_data_url: slipDataUrl,
      };

      let finalApplication: any | null = null;

      // 1. Primary Persistence: POST api/apply.php (XAMPP/cPanel) & /api/public/admissions/apply
      try {
        const res = await fetch(`${BRC_BASE_PREFIX}/api/apply.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.application || data.tracking_id) {
            const refId = data.tracking_id || data.application?.application_ref || generatedRef;
            finalApplication = {
              id: Date.now(),
              ...(data.application || {}),
              application_ref: refId,
              tracking_id: refId,
              candidate_name: payload.candidate_name,
              father_name: payload.father_name,
              gender: payload.gender,
              class_applied: payload.class_applied,
              quota_category: payload.quota_category,
              domicile_district: payload.domicile_district,
              dob_figures: payload.dob_figures,
              dob_words: payload.dob_words,
              previous_school: payload.previous_school,
              previous_class_percentage: payload.previous_class_percentage,
              permanent_address: payload.permanent_address,
              guardian_phone: payload.guardian_phone,
              status: data.application?.status || 'PENDING_VERIFICATION',
              fee_details: {
                bank_branch: payload.bank_branch,
                challan_number: payload.challan_number,
                amount_pkr: 2500,
                deposit_date: payload.deposit_date,
                slip_file_name: payload.slip_file_name,
                slip_data_url: payload.slip_data_url,
                verification_status: 'PENDING_VERIFICATION',
              },
            };
          }
        }
      } catch {
        // Fallback to local persistence below if PHP/API endpoint is unreachable
      }

      // 2. Fallback / Dual Persistence: localStorage ('brc_admissions_store_v2')
      if (!finalApplication) {
        finalApplication = {
          id: Date.now(),
          application_ref: generatedRef,
          candidate_name: payload.candidate_name,
          father_name: payload.father_name,
          gender: payload.gender,
          class_applied: payload.class_applied,
          dob_figures: payload.dob_figures,
          dob_words: payload.dob_words,
          cnic_or_form_b: payload.cnic_or_form_b,
          domicile_district: payload.domicile_district,
          quota_category: payload.quota_category,
          previous_school: payload.previous_school,
          previous_class_percentage: payload.previous_class_percentage,
          permanent_address: payload.permanent_address,
          guardian_phone: payload.guardian_phone,
          guardian_email: payload.guardian_email,
          status: 'PENDING_VERIFICATION',
          submitted_at: new Date().toISOString().slice(0, 10),
          fee_details: {
            bank_branch: payload.bank_branch,
            challan_number: payload.challan_number,
            amount_pkr: 2500,
            deposit_date: payload.deposit_date,
            slip_file_name: payload.slip_file_name,
            slip_mime_type: payload.slip_mime_type,
            slip_size_bytes: payload.slip_size_bytes,
            slip_data_url: payload.slip_data_url,
            verification_status: 'PENDING_VERIFICATION',
          },
          is_demo: false,
        };
      }

      const filtered = existingApps.filter(
        (item) => item.application_ref !== finalApplication.application_ref
      );
      filtered.unshift(finalApplication);

      try {
        localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(filtered));
      } catch {
        // Safe retry without bulky base64 payload if browser localStorage quota is exceeded
        try {
          const compactRecord = {
            ...finalApplication,
            fee_details: {
              ...finalApplication.fee_details,
              slip_data_url:
                finalApplication.fee_details?.slip_data_url?.length > 150000
                  ? BRC_LOGO_URL
                  : finalApplication.fee_details?.slip_data_url,
            },
          };
          const compactList = [
            compactRecord,
            ...existingApps.filter(
              (item) => item.application_ref !== finalApplication.application_ref
            ),
          ];
          localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(compactList));
        } catch {
          // Server database already holds the record
        }
      }

      setStoredApps(filtered);
      window.dispatchEvent(new Event('brc_admissions_updated'));

      setSubmittedRecord(finalApplication);
      setTrackRef(finalApplication.application_ref);
      if (onSubmissionSuccess) onSubmissionSuccess();
      if (onSubmitted) onSubmitted();
    } catch {
      setErrorMsg('Network error while submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const runTrackLookup = async (rawRefInput: string) => {
    setTrackError(null);
    setTrackedApp(null);

    const cleanRef = rawRefInput.trim().toUpperCase();
    if (!cleanRef) {
      setTrackError('Please enter your Application Reference ID (e.g., BRC-ADM-2026-0001).');
      return;
    }

    setTrackingLoading(true);
    try {
      let foundLocal: any | null = null;
      try {
        const rawLocal = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
        if (rawLocal) {
          const localApps: any[] = JSON.parse(rawLocal);
          foundLocal =
            localApps.find(
              (a) =>
                a.application_ref?.toUpperCase() === cleanRef ||
                a.assigned_roll_no?.toUpperCase() === cleanRef ||
                a.assigned_kit_no?.toUpperCase() === cleanRef ||
                a.candidate_name?.toUpperCase() === cleanRef
            ) || null;
        }
      } catch {
        // Ignore storage read error
      }

      let foundServer: any | null = null;
      try {
        const phpTrackRes = await fetch(
          `${BRC_BASE_PREFIX}/api/track.php?tracking_id=${encodeURIComponent(cleanRef)}`
        );
        const phpType = phpTrackRes.headers.get('content-type') || '';
        if (phpTrackRes.ok && phpType.includes('application/json')) {
          const phpData = await phpTrackRes.json();
          if (phpData.application) {
            foundServer = phpData.application;
          }
        }
      } catch {}

      if (!foundServer) {
        try {
          const res = await fetch(`${BRC_BASE_PREFIX}/api/public/admissions/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationRef: cleanRef }),
          });
          const cType = res.headers.get('content-type') || '';
          if (res.ok && cType.includes('application/json')) {
            const data = await res.json();
            if (data.application) {
              foundServer = data.application;
            }
          }
        } catch {
          // Use local record if server is unreachable
        }
      }

      if (foundServer || foundLocal) {
        const merged = {
          ...(foundServer || {}),
          ...(foundLocal || {}),
          assigned_roll_no:
            foundLocal?.assigned_roll_no || foundServer?.assigned_roll_no || null,
          assigned_kit_no:
            foundLocal?.assigned_kit_no || foundServer?.assigned_kit_no || null,
          status:
            foundLocal?.status === 'APPROVED' || foundServer?.status === 'APPROVED'
              ? 'APPROVED'
              : foundLocal?.status || foundServer?.status || 'PENDING_VERIFICATION',
          fee_details: {
            ...(foundServer?.fee_details || {}),
            ...(foundLocal?.fee_details || {}),
            verification_status:
              foundLocal?.fee_details?.verification_status === 'VERIFIED' ||
              foundServer?.fee_details?.verification_status === 'VERIFIED'
                ? 'VERIFIED'
                : foundLocal?.fee_details?.verification_status ||
                  foundServer?.fee_details?.verification_status ||
                  'PENDING_VERIFICATION',
          },
        };
        setTrackedApp(merged);
      } else {
        setTrackError(
          'No admission application found matching this Reference ID. Please verify your ID (e.g., BRC-ADM-2026-0001).'
        );
      }
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runTrackLookup(trackRef);
  };

  const stepsMeta = [
    { num: 1, title: 'Step 1: Candidate', sub: 'Personal & Class Details' },
    { num: 2, title: 'Step 2: Academic Verification', sub: 'DOB, Marks & Disqualification Notice' },
    { num: 3, title: 'Step 3: Quota Selection', sub: 'District Quota & Postal Address' },
    { num: 4, title: 'Step 4: Bank Challan & Slip', sub: 'NBP Zhob Challan & Upload' },
    { num: 5, title: 'Step 5: Submission & ID', sub: 'Final Review & Tracking ID' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Institutional Banner */}
      <div className="rounded-3xl bg-[#7A1C24] text-white border border-amber-400/30 p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <img
          src={BRC_LOGO_URL}
          alt="BRC Zhob Crest"
          referrerPolicy="no-referrer"
          className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 w-36 h-36 rounded-full opacity-10 pointer-events-none"
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-md bg-amber-400/20 text-[#FBBF24] border border-amber-400/30 text-xs font-bold uppercase tracking-widest">
              ADMISSIONS PORTAL • ENTRY 2026–27
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-white">
              Online Admission Application & Live Verification Tracker
            </h1>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Official 5-Step Digital Admission Portal for Class 8th and 1st Year (Pre-Medical, Pre-Engineering & ICS) under Government of Balochistan & Defense Quota Seats.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('apply');
                navigate('/admissions');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                activeTab === 'apply'
                  ? 'bg-[#FBBF24] text-[#7A1C24] shadow-md'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              5-Step Application Wizard
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('track');
                navigate('/admissions/track');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'track'
                  ? 'bg-[#FBBF24] text-[#7A1C24] shadow-md'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Application Status</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChallanModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#7A1C24] hover:bg-amber-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print 3-Copy NBP Challan</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'track' ? (
        /* ====================================================================
           LIVE APPLICATION TRACKER (/admissions/track)
           ==================================================================== */
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
              REAL-TIME ADMISSION TRACKER
            </span>
            <h2 className="font-editorial text-2xl font-bold text-slate-900 mt-1">
              Verify Application Status & Roll Number Slip
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Enter your official Application Reference ID (e.g., <span className="font-mono font-bold text-[#7A1C24]">BRC-ADM-2026-0001</span>) to inspect fee verification status, quota category, and assigned Entrance Exam Roll Number / Kit Number.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={trackRef}
              onChange={(e) => setTrackRef(e.target.value)}
              placeholder="Enter Reference ID (e.g. BRC-ADM-2026-0001)"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#7A1C24]"
            />
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-6 py-3 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>{trackingLoading ? 'Checking...' : 'Check Live Status'}</span>
            </button>
          </form>

          {storedApps.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Recent Submitted IDs:</span>
              {storedApps.slice(0, 4).map((appItem: any) => (
                <button
                  key={appItem.application_ref}
                  type="button"
                  onClick={() => {
                    setTrackRef(appItem.application_ref);
                    runTrackLookup(appItem.application_ref);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#7A1C24] font-mono font-bold cursor-pointer transition-colors"
                >
                  {appItem.application_ref} ({appItem.candidate_name})
                </button>
              ))}
            </div>
          )}

          {trackError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{trackError}</span>
            </div>
          )}

          {trackedApp && (
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border-2 border-[#7A1C24]/20 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Official Reference ID
                  </div>
                  <div className="font-mono text-xl font-bold text-[#7A1C24]">
                    {trackedApp.application_ref}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      trackedApp.status === 'APPROVED' ||
                      trackedApp.status === 'CONVERTED_TO_CADET' ||
                      (trackedApp as any).assigned_roll_no
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    Application Status: {trackedApp.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      trackedApp.fee_details?.verification_status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Fee Slip: {trackedApp.fee_details?.verification_status || 'PENDING_VERIFICATION'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-slate-400">Candidate Name</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {trackedApp.candidate_name}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    S/O, D/O: {trackedApp.father_name || trackedApp.father_name_as_per_school_record}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-slate-400">Class & Quota Category</div>
                  <div className="font-bold text-[#7A1C24] text-sm mt-0.5">
                    {trackedApp.class_applied || trackedApp.class_studying}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Quota: <strong>{trackedApp.quota_category || trackedApp.domicile_district}</strong>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-slate-400">Entrance Exam Roll & Kit No</div>
                  {(trackedApp as any).assigned_roll_no || trackedApp.converted_cadet_id ? (
                    <div className="mt-0.5 space-y-0.5">
                      <div className="font-mono font-bold text-emerald-700 text-sm">
                        Roll Slip: {(trackedApp as any).assigned_roll_no || `BRC-2026-R101`}
                      </div>
                      <div className="font-mono text-xs text-slate-700">
                        Kit No: {(trackedApp as any).assigned_kit_no || `KIT-2026-101`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-800 font-semibold mt-1">
                      Pending Admin Roll Slip Assignment (Exam: 20 Oct 2026)
                    </div>
                  )}
                </div>
              </div>

              {((trackedApp as any).assigned_roll_no ||
                trackedApp.status === 'APPROVED' ||
                trackedApp.status === 'CONVERTED_TO_CADET') ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">
                        Officially Registered for Entrance Examination — 20 Oct 2026
                      </div>
                      <div>
                        Reporting Time: 08:30 AM PST • Center: BRC Zhob Examination Hall / Designated Quetta Center
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRollSlipModalApp(trackedApp)}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Roll Slip</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#7A1C24] shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-[#7A1C24]">
                        Application Logged — Awaiting Admin Fee Verification &amp; Roll Slip
                      </div>
                      <div>
                        Once verified in the Admin Admissions Queue, your sequential Roll Number (e.g., BRC-2026-R101) will appear here.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRollSlipModalApp(trackedApp)}
                    className="px-4 py-2 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Confirmation Slip</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : submittedRecord ? (
        /* ====================================================================
           STEP 5 COMPLETED CONFIRMATION & OFFICIAL TRACKING ID CARD
           ==================================================================== */
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border-2 border-emerald-600/30 p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                APPLICATION SUBMITTED • STATUS: PENDING_VERIFICATION
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Admission Dossier Logged Successfully
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Please save or print your Official Application Reference ID below to track fee verification and download your Entrance Exam Roll Slip.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-400 uppercase font-bold text-[10px]">
                Official Tracking Reference ID
              </div>
              <div className="font-mono text-2xl font-bold text-[#7A1C24] mt-0.5">
                {submittedRecord.application_ref}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase font-bold text-[10px]">
                Verification Status
              </div>
              <div className="font-mono text-sm font-bold text-amber-800 mt-1">
                {submittedRecord.status || 'PENDING_VERIFICATION'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Candidate Name</div>
              <div className="font-bold text-slate-900 text-sm">
                {submittedRecord.candidate_name}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Father&apos;s Name</div>
              <div className="font-bold text-slate-900 text-sm">
                {submittedRecord.father_name || submittedRecord.father_name_as_per_school_record}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Class Applied</div>
              <div className="font-bold text-[#7A1C24] text-sm">
                {submittedRecord.class_applied || submittedRecord.class_studying}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Registered Quota Category</div>
              <div className="font-bold text-slate-900 text-sm">
                {submittedRecord.quota_category || submittedRecord.domicile_district}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setTrackedApp(submittedRecord);
                setTrackRef(submittedRecord.application_ref);
                setActiveTab('track');
              }}
              className="px-5 py-3 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Track Live Application Status →</span>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRollSlipModalApp(submittedRecord)}
                className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Confirmation Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedRecord(null);
                  setWizardStep(1);
                  setCandidateName('');
                  setFatherName('');
                  setSlipFileName('');
                  setSlipDataUrl('');
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs sm:text-sm cursor-pointer"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
           THE 5-STEP ADMISSION WIZARD (/admissions)
           ==================================================================== */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 5-Step Progress Indicator Bar */}
          <div className="bg-[#FAF8F5] border-b border-slate-200 px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {stepsMeta.map((st) => {
                const isActive = wizardStep === st.num;
                const isDone = wizardStep > st.num;
                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => {
                      if (st.num < wizardStep) setWizardStep(st.num);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#7A1C24] text-white border-[#7A1C24] shadow-sm'
                        : isDone
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span>{st.title}</span>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${
                        isActive ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      {st.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmitApplication} className="p-6 sm:p-10 space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: CANDIDATE INFORMATION */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
                    STEP 1 OF 5 • CANDIDATE PROFILE
                  </span>
                  <h2 className="font-editorial text-2xl font-bold text-slate-900 mt-1">
                    Candidate Personal & Class Selection
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Candidate Full Name (As per Form-B / Matric Certificate) *
                    </label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Enter candidate full name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Father&apos;s / Guardian&apos;s Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Enter father's full name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Gender *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Class Applying For *
                    </label>
                    <select
                      value={classApplied}
                      onChange={(e) => setClassApplied(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    >
                      <option value="Class 8th">Class 8th (Junior Cadet Entry)</option>
                      <option value="1st Year Pre-Med">1st Year F.Sc Pre-Medical</option>
                      <option value="1st Year Pre-Eng">1st Year F.Sc Pre-Engineering</option>
                      <option value="1st Year ICS">1st Year ICS (Computer Science)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NADRA Form-B / CNIC Number
                    </label>
                    <input
                      type="text"
                      value={cnicOrFormB}
                      onChange={(e) => setCnicOrFormB(e.target.value)}
                      placeholder="e.g. 56501-1234567-1"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Parent / Guardian Active Mobile Number
                    </label>
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="e.g. 0300-8381234"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC VERIFICATION */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
                    STEP 2 OF 5 • ACADEMIC VERIFICATION
                  </span>
                  <h2 className="font-editorial text-2xl font-bold text-slate-900 mt-1">
                    Date of Birth & Previous Academic Record
                  </h2>
                </div>

                {/* Mandatory Non-Refundable / Disqualification Warning Banner */}
                <div className="p-4 rounded-2xl bg-amber-50 border-l-4 border-[#7A1C24] text-amber-950 text-xs sm:text-sm space-y-1">
                  <div className="font-bold text-[#7A1C24] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>MANDATORY AGE, ACADEMIC & NON-REFUNDABLE FEE WARNING</span>
                  </div>
                  <p className="leading-relaxed">
                    The Admission Processing Fee of <strong>PKR 2,500/- is strictly non-refundable and non-transferable</strong>. Any discrepancy in Date of Birth, forged domicile certificate, or tampering with previous school marks will result in <strong>immediate disqualification</strong> at any stage of the entrance examination or ISSB/Medical screening.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Birth (In Figures) *
                    </label>
                    <input
                      type="date"
                      required
                      value={dobFigures}
                      onChange={(e) => setDobFigures(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Birth (In Words) *
                    </label>
                    <input
                      type="text"
                      required
                      value={dobWords}
                      onChange={(e) => setDobWords(e.target.value)}
                      placeholder="e.g. Fifteenth March Two Thousand Thirteen"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Previous School / Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={previousSchool}
                      onChange={(e) => setPreviousSchool(e.target.value)}
                      placeholder="Enter current / last attended school name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Previous Examination Marks Percentage (%) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="33"
                      max="100"
                      required
                      value={previousClassPercentage}
                      onChange={(e) => setPreviousClassPercentage(e.target.value)}
                      placeholder="e.g. 88.5"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: QUOTA SELECTION */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
                    STEP 3 OF 5 • QUOTA & DOMICILE SELECTION
                  </span>
                  <h2 className="font-editorial text-2xl font-bold text-slate-900 mt-1">
                    District / Quota Category & Permanent Postal Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      District / Quota Selection *
                    </label>
                    <select
                      value={quotaCategory}
                      onChange={(e) => {
                        setQuotaCategory(e.target.value);
                        setDomicileDistrict(e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    >
                      <option value="Zhob">Zhob District</option>
                      <option value="Sherani">Sherani District</option>
                      <option value="Killa Saifullah">Killa Saifullah District</option>
                      <option value="Musakhail">Musakhail District</option>
                      <option value="Loralai">Loralai District</option>
                      <option value="Balochistan Open Merit">Balochistan Open Merit</option>
                      <option value="Defense Quota">Defense Quota</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Guardian Email Address (Optional for E-Call Letter)
                    </label>
                    <input
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Permanent Postal Address (For Official Call Letter Dispatch) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      placeholder="House / Street / Village, Tehsil, Post Office & District..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: BANK CHALLAN & SLIP UPLOAD */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
                      STEP 4 OF 5 • BANK CHALLAN & DEPOSIT SLIP UPLOAD
                    </span>
                    <h2 className="font-editorial text-2xl font-bold text-slate-900 mt-1">
                      National Bank of Pakistan (NBP) Fee Voucher & Receipt Upload
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChallanModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                  >
                    <Printer className="w-4 h-4 text-[#FBBF24]" />
                    <span>Generate & Print 3-Copy NBP Challan</span>
                  </button>
                </div>

                {/* Official NBP Bank Details Card */}
                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400 uppercase font-bold text-[10px]">
                      Designated Bank & Branch
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      National Bank of Pakistan (NBP Zhob Branch)
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase font-bold text-[10px]">
                      Official Account Number
                    </div>
                    <div className="font-mono font-bold text-[#7A1C24] text-base mt-0.5">
                      0042-3019284756
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase font-bold text-[10px]">
                      Admission Processing Fee
                    </div>
                    <div className="font-mono font-bold text-emerald-800 text-base mt-0.5">
                      PKR 2,500/- (Non-Refundable)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NBP Challan / Deposit Receipt No *
                    </label>
                    <input
                      type="text"
                      required
                      value={challanNumber}
                      onChange={(e) => setChallanNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Fee Deposit Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#7A1C24]"
                    />
                  </div>
                </div>

                {/* Upload Deposit Slip Box */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-[#7A1C24]/30 bg-[#FAF8F5] text-center space-y-3">
                  <Upload className="w-8 h-8 text-[#7A1C24] mx-auto" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900">
                      Upload Paid Bank Deposit Slip (College Copy) *
                    </div>
                    <p className="text-xs text-slate-500">
                      Accepted formats: <strong>JPG, PNG, or PDF (Max 2 MB)</strong>. Clearly show NBP stamp & scroll number.
                    </p>
                  </div>
                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Select Deposit Slip File</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {slipFileName && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 inline-flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Attached: {slipFileName} ({(slipSizeBytes / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: SUBMISSION & TRACKING ID */}
            {wizardStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
                    STEP 5 OF 5 • FINAL VERIFICATION & SUBMISSION
                  </span>
                  <h2 className="font-editorial text-2xl font-bold text-slate-900 mt-1">
                    Review Candidate Dossier & Generate Tracking ID
                  </h2>
                </div>

                <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Candidate Name:</span>{' '}
                    <strong className="text-slate-900">{candidateName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Father&apos;s Name:</span>{' '}
                    <strong className="text-slate-900">{fatherName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Gender & Class:</span>{' '}
                    <strong className="text-[#7A1C24]">
                      {gender} • {classApplied}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Date of Birth:</span>{' '}
                    <strong className="text-slate-900">
                      {dobFigures} ({dobWords})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Previous School & Marks:</span>{' '}
                    <strong className="text-slate-900">
                      {previousSchool} ({previousClassPercentage}%)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">District / Quota Category:</span>{' '}
                    <strong className="text-slate-900">{quotaCategory}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Permanent Postal Address:</span>{' '}
                    <strong className="text-slate-900">{permanentAddress}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">NBP Deposit Slip Attached:</span>{' '}
                    <strong className="text-emerald-700">
                      {slipFileName} (Challan #{challanNumber} • PKR 2,500)
                    </strong>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 accent-[#7A1C24]"
                  />
                  <span>
                    I solemnly declare that the particulars stated in this application are true and correct to the best of my knowledge. I understand that the PKR 2,500/- NBP processing fee is non-refundable and that my application will be committed with status <strong>PENDING_VERIFICATION</strong> for review by the BRC Zhob Admissions Committee.
                  </span>
                </label>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  ← Previous Step
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm"
                >
                  Continue to Step {wizardStep + 1} →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-sm cursor-pointer shadow-md"
                >
                  {submitting
                    ? 'Submitting & Generating Reference ID...'
                    : 'Submit Official Application & Generate Tracking ID →'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {showChallanModal && (
        <PrintableBankChallanModal
          candidateName={candidateName || 'Candidate Name'}
          fatherName={fatherName || 'Father Name'}
          classApplied={classApplied}
          applicationRef={challanNumber}
          cnic={cnicOrFormB || '56501-0000000-0'}
          amount={2500}
          bankName="National Bank of Pakistan (NBP Zhob Branch)"
          accountNo="0042-3019284756"
          onClose={() => setShowChallanModal(false)}
        />
      )}

      {rollSlipModalApp && (
        <PrintableRollSlipModal
          application={rollSlipModalApp}
          onClose={() => setRollSlipModalApp(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// ============================================================================
// OFFICIAL BRC ZHOB HALL TICKET TEMPLATE & HTML GENERATOR
// ============================================================================
export const buildOfficialRollSlipHtml = (app: any, idx = 0): string => {
  const seqNum = 101 + idx;
  const rollNo = app?.assigned_roll_no || `BRC-2026-R${seqNum}`;
  const kitNo = app?.assigned_kit_no || `KIT-2026-${seqNum}`;
  const candidateName = app?.candidate_name || 'Candidate';
  const fatherName =
    app?.father_name || app?.father_name_as_per_school_record || 'Guardian';
  const classApplying = app?.class_applied || app?.class_studying || 'Class 8th';
  const quota = app?.quota_category || app?.domicile_district || 'Zhob';
  const trackingId = app?.application_ref || app?.tracking_id || `BRC-ADM-2026-000${ idx + 1}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Roll Slip ${rollNo} - ${candidateName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FFFDF9;
      color: #0F172A;
      margin: 0;
      padding: 28px;
    }
    .slip-page {
      max-width: 780px;
      margin: 0 auto;
      border: 3px solid #7A1C24;
      border-radius: 16px;
      padding: 28px 32px;
      background: #FFFFFF;
      page-break-after: always;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #7A1C24;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .college-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 22px;
      font-weight: 800;
      color: #7A1C24;
      letter-spacing: 0.04em;
      margin: 0;
    }
    .slip-subtitle {
      font-size: 16px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 6px;
    }
    .session-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      color: #7A1C24;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .meta-box {
      background: #FAF8F5;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .meta-box.highlight-box {
      background: #FEF2F2;
      border-color: #FECACA;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748B;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 4px;
    }
    .meta-mono {
      font-family: "Courier New", Courier, monospace;
      font-size: 16px;
      color: #7A1C24;
    }
    .instructions {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-left: 4px solid #7A1C24;
      border-radius: 10px;
      padding: 14px 16px;
      font-size: 12px;
      line-height: 1.6;
      color: #1E293B;
      margin-bottom: 24px;
    }
    .instructions-title {
      font-weight: 800;
      color: #7A1C24;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .instructions ul {
      margin: 0;
      padding-left: 18px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px dashed #CBD5E1;
      text-align: center;
      font-size: 12px;
    }
    .sig-line {
      margin-top: 36px;
      padding-top: 8px;
      border-top: 1.5px solid #334155;
      font-weight: 700;
      color: #0F172A;
    }
    .seal-box {
      font-size: 10px;
      color: #7A1C24;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    @media print {
      body { padding: 0; background: #FFFFFF; }
      .slip-page { border: 2px solid #7A1C24; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="slip-page">
    <div class="header">
      <h1 class="college-title">BALOCHISTAN RESIDENTIAL COLLEGE ZHOB</h1>
      <div class="slip-subtitle">Official Entrance Test Roll Number Slip</div>
      <div class="session-badge">Session 2026–2027 • Written Entrance Examination</div>
      <div style="font-size:11px;color:#64748B;margin-top:6px;font-family:monospace;">Tracking Reference: ${trackingId}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-box highlight-box">
        <div class="meta-label">Roll Number</div>
        <div class="meta-value meta-mono">${rollNo}</div>
      </div>
      <div class="meta-box highlight-box">
        <div class="meta-label">Kit Number</div>
        <div class="meta-value meta-mono">${kitNo}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Candidate Full Name &amp; Father's Name</div>
        <div class="meta-value">${candidateName} <span style="font-weight:500;color:#475569;">S/D/o ${fatherName}</span></div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Class Applying &amp; Quota Category</div>
        <div class="meta-value">${classApplying} • ${quota}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Test Date &amp; Time</div>
        <div class="meta-value">20 Oct 2026 (09:00 AM)</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Test Center</div>
        <div class="meta-value">BRC Zhob Main Academic Campus / BISE Center</div>
      </div>
    </div>

    <div class="instructions">
      <div class="instructions-title">Mandatory Candidate Instructions</div>
      <ul>
        <li>Bring original slip, CNIC/B-Form, clipboard, and ballpoint pen on examination day.</li>
        <li>Mobile phones, smartwatches, and calculators are strictly prohibited inside the examination hall.</li>
        <li>Report at <strong>08:30 AM</strong> sharp for biometric verification and seating allocation.</li>
      </ul>
    </div>

    <div class="signatures">
      <div>
        <div style="height:24px;"></div>
        <div class="sig-line">Candidate Signature</div>
      </div>
      <div>
        <div class="seal-box">[ Official Seal — Controller of Examinations ]</div>
        <div class="sig-line">Controller of Examinations • BRC Zhob</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const OfficialHallTicketCard: React.FC<{
  app: any;
  index?: number;
}> = ({ app, index = 0 }) => {
  const seqNum = 101 + index;
  const rollNo = app?.assigned_roll_no || `BRC-2026-R${seqNum}`;
  const kitNo = app?.assigned_kit_no || `KIT-2026-${seqNum}`;
  const candidateName = app?.candidate_name || 'Candidate';
  const fatherName =
    app?.father_name || app?.father_name_as_per_school_record || 'Guardian';
  const classApplying = app?.class_applied || app?.class_studying || 'Class 8th';
  const quota = app?.quota_category || app?.domicile_district || 'Zhob';
  const trackingId = app?.application_ref || app?.tracking_id || 'BRC-ADM-2026-0001';

  return (
    <div className="slip-page bg-white border-2 border-[#7A1C24] rounded-2xl p-6 sm:p-8 space-y-5 text-slate-900 shadow-xs mb-6">
      {/* Header */}
      <div className="text-center border-b-2 border-[#7A1C24] pb-4 space-y-1.5">
        <div className="flex items-center justify-center gap-3">
          <img
            src={BRC_LOGO_URL}
            alt="BRC Zhob Crest"
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full border-2 border-[#7A1C24] bg-white p-0.5 shrink-0"
          />
          <div className="text-center">
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#7A1C24] tracking-wide">
              BALOCHISTAN RESIDENTIAL COLLEGE ZHOB
            </h2>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              Official Entrance Test Roll Number Slip
            </div>
          </div>
        </div>
        <div className="inline-block px-3.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-[#7A1C24] text-[11px] font-bold uppercase tracking-wider">
          Session 2026–2027 • Written Entrance Examination
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Tracking ID: <strong>{trackingId}</strong>
        </div>
      </div>

      {/* Meta Grid (2 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Roll Number
          </div>
          <div className="font-mono font-bold text-base text-emerald-950 mt-0.5">
            {rollNo}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
            Kit Number
          </div>
          <div className="font-mono font-bold text-base text-[#7A1C24] mt-0.5">
            {kitNo}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Candidate Full Name &amp; Father&apos;s Name
          </div>
          <div className="font-bold text-sm text-slate-900 mt-0.5">
            {candidateName}{' '}
            <span className="font-normal text-slate-600">S/D/o {fatherName}</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Class Applying &amp; Quota Category
          </div>
          <div className="font-bold text-sm text-[#7A1C24] mt-0.5">
            {classApplying} • <span className="text-slate-900">{quota}</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Test Date &amp; Time
          </div>
          <div className="font-bold text-sm text-slate-900 mt-0.5">
            20 Oct 2026 (09:00 AM)
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Test Center
          </div>
          <div className="font-bold text-sm text-slate-900 mt-0.5">
            BRC Zhob Main Academic Campus / BISE Center
          </div>
        </div>
      </div>

      {/* Candidate Instructions */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 border-l-4 border-l-[#7A1C24] space-y-1.5 text-xs text-slate-800">
        <div className="font-bold text-[#7A1C24] uppercase tracking-wider text-[11px]">
          Mandatory Candidate Instructions
        </div>
        <ul className="list-disc pl-4 space-y-1 leading-relaxed">
          <li>
            Bring original slip, CNIC/B-Form, clipboard, and ballpoint pen.
          </li>
          <li>
            Mobile phones and calculators strictly prohibited inside the examination center.
          </li>
          <li>
            Report at <strong>08:30 AM</strong> for biometric verification.
          </li>
        </ul>
      </div>

      {/* Signatures */}
      <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-6 text-center text-xs">
        <div className="pt-6">
          <div className="border-t border-slate-700 pt-1.5 font-bold text-slate-800">
            Candidate Signature
          </div>
        </div>
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded border border-dashed border-[#7A1C24]/50 text-[10px] font-mono font-bold text-[#7A1C24] uppercase">
            [ Official Seal — Controller of Examinations ]
          </div>
          <div className="border-t border-slate-700 pt-1.5 font-bold text-slate-800">
            Controller of Examinations • BRC Zhob
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// OFFICIAL A4 PDF GENERATOR & IFRAME-SAFE PRINT ENGINE FOR ROLL NUMBER SLIPS
// ============================================================================
export const generateOfficialRollSlipsPdfBlob = (apps: any[]): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const list =
    Array.isArray(apps) && apps.length > 0
      ? apps
      : [
          {
            application_ref: 'BRC-ADM-2026-0001',
            candidate_name: 'Candidate Specimen',
            father_name: 'Father / Guardian',
            class_applied: 'Class 8th',
            quota_category: 'Zhob',
            assigned_roll_no: 'BRC-2026-R101',
            assigned_kit_no: 'KIT-2026-101',
          },
        ];

  list.forEach((app, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'portrait');
    }

    const seqNum = 101 + idx;
    const rollNo = String(app?.assigned_roll_no || `BRC-2026-R${seqNum}`);
    const kitNo = String(app?.assigned_kit_no || `KIT-2026-${seqNum}`);
    const candidateName = String(app?.candidate_name || 'Candidate');
    const fatherName = String(
      app?.father_name || app?.father_name_as_per_school_record || 'Guardian'
    );
    const classApplying = String(app?.class_applied || app?.class_studying || 'Class 8th');
    const quota = String(app?.quota_category || app?.domicile_district || 'Zhob');
    const trackingId = String(
      app?.application_ref || app?.tracking_id || `BRC-ADM-2026-${String(idx + 1).padStart(4, '0')}`
    );

    // Outer Maroon & Gold Border
    doc.setDrawColor(122, 28, 36); // #7A1C24
    doc.setLineWidth(1.2);
    doc.rect(12, 12, 186, 265, 'S');

    doc.setDrawColor(213, 168, 61); // #D5A83D
    doc.setLineWidth(0.5);
    doc.rect(14.5, 14.5, 181, 260, 'S');

    // Header Banner
    doc.setFillColor(122, 28, 36);
    doc.rect(18, 18, 174, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.text('BALOCHISTAN RESIDENTIAL COLLEGE ZHOB', 105, 29, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(251, 191, 36); // #FBBF24
    doc.text('OFFICIAL ENTRANCE TEST ROLL NUMBER SLIP', 105, 37, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Session 2026-2027  |  Written Entrance Examination  |  Tracking ID: ${trackingId}`,
      105,
      45,
      { align: 'center' }
    );

    // 2-Column Metadata Grid
    const drawFieldBox = (
      x: number,
      y: number,
      w: number,
      h: number,
      label: string,
      value: string,
      highlight = false
    ) => {
      if (highlight) {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(213, 168, 61);
      } else {
        doc.setFillColor(250, 248, 245);
        doc.setDrawColor(203, 213, 225);
      }
      doc.setLineWidth(0.35);
      doc.roundedRect(x, y, w, h, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), x + 4, y + 6.5);

      doc.setFont(highlight ? 'courier' : 'helvetica', 'bold');
      doc.setFontSize(highlight ? 12.5 : 10);
      doc.setTextColor(highlight ? 122 : 15, highlight ? 28 : 23, highlight ? 36 : 42);
      const clipped = doc.splitTextToSize(value, w - 8);
      doc.text(clipped[0] || '', x + 4, y + 14.5);
    };

    // Row 1: Roll Number & Kit Number
    drawFieldBox(18, 58, 84, 20, 'Roll Number', rollNo, true);
    drawFieldBox(108, 58, 84, 20, 'Kit Number', kitNo, true);

    // Row 2: Candidate Name & Father's Name
    drawFieldBox(18, 82, 84, 20, 'Candidate Full Name', candidateName);
    drawFieldBox(108, 82, 84, 20, "Father's / Guardian's Name", fatherName);

    // Row 3: Class Applying & Quota Category
    drawFieldBox(18, 106, 84, 20, 'Class Applying For', classApplying);
    drawFieldBox(108, 106, 84, 20, 'District / Quota Category', quota);

    // Row 4: Test Date/Time & Test Center
    drawFieldBox(18, 130, 84, 20, 'Test Date & Time', '20 Oct 2026 (09:00 AM)');
    drawFieldBox(
      108,
      130,
      84,
      20,
      'Examination Center',
      'BRC Zhob Main Academic Campus / BISE Center'
    );

    // Mandatory Candidate Instructions Box
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(122, 28, 36);
    doc.setLineWidth(0.5);
    doc.roundedRect(18, 158, 174, 46, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(122, 28, 36);
    doc.text('MANDATORY CANDIDATE INSTRUCTIONS', 23, 166);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const instructions = [
      '1. Bring original Roll Number Slip, CNIC / NADRA Form-B, clipboard, and blue/black ballpoint pen.',
      '2. Mobile phones, smartwatches, calculators, and electronic devices are strictly prohibited.',
      '3. Report at 08:30 AM sharp on 20 Oct 2026 for biometric verification and hall seating.',
      '4. Any discrepancy in Date of Birth or forged domicile will result in immediate disqualification.',
    ];
    instructions.forEach((line, i) => {
      doc.text(line, 23, 174 + i * 6.5);
    });

    // Signatures & Official Seal Section
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(18, 218, 192, 218);

    // Left: Candidate Signature
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.4);
    doc.line(26, 252, 88, 252);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Candidate Signature', 57, 258, { align: 'center' });

    // Right: Controller of Examinations
    doc.setDrawColor(122, 28, 36);
    doc.setLineWidth(0.35);
    doc.roundedRect(122, 228, 60, 14, 1.5, 1.5, 'S');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(122, 28, 36);
    doc.text('OFFICIAL SEAL VERIFIED', 152, 234.5, { align: 'center' });
    doc.text('CONTROLLER OF EXAMINATIONS', 152, 239, { align: 'center' });

    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.4);
    doc.line(120, 252, 184, 252);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Controller of Examinations - BRC Zhob', 152, 258, { align: 'center' });
  });

  return doc.output('blob');
};

export const triggerBrowserPrintWithIframe = (htmlContent: string) => {
  try {
    const existing = document.getElementById('brc-hidden-print-iframe');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'brc-hidden-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          try {
            window.print();
          } catch {}
        }
      }, 150);
    } else {
      window.print();
    }
  } catch {
    try {
      window.print();
    } catch {}
  }
};

// ============================================================================
// OFFICIAL PRINTABLE & DOWNLOADABLE ROLL NUMBER SLIP MODAL (SINGLE OR BATCH)
// ============================================================================
export const PrintableRollSlipModal: React.FC<{
  application?: any;
  app?: any;
  applications?: any[];
  onClose: () => void;
}> = ({ application, app, applications, onClose }) => {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const slipList =
    Array.isArray(applications) && applications.length > 0
      ? applications
      : [application || app].filter(Boolean);

  const buildConsolidatedHtml = () => {
    if (slipList.length === 0) return '';
    const first = slipList[0];
    if (slipList.length === 1) {
      return buildOfficialRollSlipHtml(first, 0);
    }
    const styleMatch = buildOfficialRollSlipHtml(first, 0).match(/<style>([\s\S]*?)<\/style>/i);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BRC Zhob Consolidated Entrance Test Roll Slips (2026-2027)</title>
  <style>
    ${styleMatch ? styleMatch[1] : ''}
    @media print { .slip-page { page-break-after: always; } }
  </style>
</head>
<body>
${slipList
  .map((item, i) => {
    const single = buildOfficialRollSlipHtml(item, i);
    const bodyMatch = single.match(/<body>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : single;
  })
  .join('\n')}
</body>
</html>`;
  };

  // Button 1 (Selector 3): Download Official PDF Slip(s)
  const handleDownloadSlipPdf = () => {
    if (slipList.length === 0) return;
    try {
      const first = slipList[0];
      const pdfBlob = generateOfficialRollSlipsPdfBlob(slipList);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = String(first?.candidate_name || 'candidate')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const rollNo = first?.assigned_roll_no || 'BRC-2026-R101';
      const fileName =
        slipList.length === 1
          ? `Roll_Slip_${rollNo}_${safeName || 'cadet'}.pdf`
          : `BRC_Zhob_Consolidated_Roll_Slips_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionStatus(`✓ Downloaded official PDF (${fileName})`);
      setTimeout(() => setActionStatus(null), 4500);
    } catch {
      setActionStatus('Failed to generate PDF slip.');
    }
  };

  // Button 2 (Selector 2): Print Slip(s) + Save Print-Ready PDF fallback for sandboxed preview
  const handlePrintSlips = () => {
    if (slipList.length === 0) return;
    const html = buildConsolidatedHtml();
    triggerBrowserPrintWithIframe(html);

    // Also provide direct PDF download so sandboxed preview iframes always deliver the printable slip
    try {
      const first = slipList[0];
      const pdfBlob = generateOfficialRollSlipsPdfBlob(slipList);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = String(first?.candidate_name || 'candidate')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const rollNo = first?.assigned_roll_no || 'BRC-2026-R101';
      a.download =
        slipList.length === 1
          ? `Printable_Roll_Slip_${rollNo}_${safeName || 'cadet'}.pdf`
          : `Printable_BRC_Zhob_All_Roll_Slips_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}

    setActionStatus(
      `✓ Print job dispatched! A print-ready A4 PDF has also been saved to your downloads.`
    );
    setTimeout(() => setActionStatus(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-3xl w-full border-2 border-[#7A1C24] overflow-hidden shadow-2xl my-6 max-h-[92vh] flex flex-col">
        <div className="bg-[#7A1C24] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#FBBF24]" />
            <div>
              <h3 className="font-editorial font-bold text-base sm:text-lg">
                {slipList.length > 1
                  ? `Consolidated Entrance Test Roll Number Slips (${slipList.length} Verified Candidates)`
                  : 'Official Entrance Test Roll Number Slip'}
              </h3>
              <p className="text-[11px] text-amber-200">
                Session 2026–2027 • Written Entrance Examination (20 Oct 2026)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSlipPdf}
              className="px-3.5 py-2 rounded-lg bg-[#FBBF24] hover:bg-[#F59E0B] text-[#7A1C24] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {slipList.length > 1 ? 'Download Consolidated PDF' : 'Download PDF Slip'}
              </span>
            </button>
            <button
              type="button"
              onClick={handlePrintSlips}
              className="px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {slipList.length > 1 ? 'All Slips' : 'Slip'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-2 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {actionStatus && (
          <div className="bg-emerald-700 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shrink-0">
            <span>{actionStatus}</span>
            <button
              type="button"
              onClick={() => setActionStatus(null)}
              className="text-white/80 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto bg-[#FFFDF9] space-y-6">
          {slipList.map((item, idx) => (
            <OfficialHallTicketCard
              key={item?.application_ref || item?.id || idx}
              app={item}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 02. ALUMNI NETWORK DIRECTORY — READ-ONLY PHASE 1 MODE (/alumni)
// ============================================================================
export const AlumniRegistrationPage: React.FC<{
  alumni?: any[];
  publicAlumni?: any[];
  navigate?: (path: string) => void;
  onAlumniSubmitted?: () => void;
  onSubmitted?: () => void;
}> = ({ alumni, publicAlumni }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');

  const sourceAlumni = alumni || publicAlumni || [];
  const approvedAlumni = sourceAlumni.filter((a: any) => !a.status || a.status === 'APPROVED');
  const filteredAlumni = approvedAlumni.filter((a: any) => {
    const batch = a.batch_entry || (a.entry_no ? `Entry ${a.entry_no}` : '');
    const matchesBatch = batchFilter === 'ALL' || batch === batchFilter;
    const profession = a.current_profession || a.profession || '';
    const org = a.organization_or_university || a.organization || '';
    const matchesSearch =
      !searchQuery.trim() ||
      (a.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#7A1C24] text-white p-8 sm:p-10 border border-amber-400/30 shadow-xl">
        <span className="inline-block px-3 py-1 rounded-md bg-amber-400/20 text-[#FBBF24] text-xs font-bold uppercase tracking-widest">
          OLD SULAIMANIANS ASSOCIATION • EST. 2016
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold mt-2">
          BRC Zhob Alumni Network Directory
        </h1>
        <p className="text-xs sm:text-sm text-white/85 max-w-2xl mt-2 leading-relaxed">
          Celebrating graduates of Balochistan Residential College Zhob serving across the Pakistan Armed Forces, Medicine, Engineering, and Civil Services.
        </p>
      </div>

      {/* Phase 1 Read-Only Notice on Registration Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="p-5 rounded-2xl bg-amber-50 border-l-4 border-[#7A1C24] flex items-start gap-3.5">
          <Lock className="w-5 h-5 text-[#7A1C24] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#7A1C24]">
              PHASE 1 ADMISSIONS CYCLE NOTICE
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900">
              Alumni registration for Entry 1–9 will officially open following the entrance admissions cycle. Directory is currently in read-only view.
            </p>
          </div>
        </div>

        <fieldset disabled className="opacity-55 pointer-events-none grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Registration Temporarily Locked"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Entry / Batch</label>
            <input
              type="text"
              placeholder="Entry 1 – Entry 9"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Organization / Service</label>
            <input
              type="text"
              placeholder="Pakistan Army / Medical / Engineering"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100"
            />
          </div>
        </fieldset>
      </div>

      {/* Read-Only Old Sulaimanians Directory */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-slate-900">
              Verified Old Sulaimanians Directory
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredAlumni.length} verified alumni records (Read-Only View)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, service, university..."
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#7A1C24]"
            />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#7A1C24]"
            >
              <option value="ALL">All Entries</option>
              <option value="1st Entry">1st Entry</option>
              <option value="2nd Entry">2nd Entry</option>
              <option value="3rd Entry">3rd Entry</option>
              <option value="4th Entry">4th Entry</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((item: any) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[#7A1C24] font-bold text-[11px]">
                    {item.batch_entry || `Entry ${item.entry_no}`} ({item.passing_year || '2022'})
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {item.house_wing || `${item.wing} Wing`}
                  </span>
                </div>
                <h3 className="font-editorial text-lg font-bold text-slate-900">
                  {(item.full_name || '').replace(/\[DEMO\]/gi, '').trim()}
                </h3>
                <div className="text-xs font-semibold text-[#7A1C24]">
                  {item.current_profession || item.profession} •{' '}
                  {item.organization_or_university || item.organization}
                </div>
                {(item.message_for_juniors || item.post_brc_institution) && (
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    &ldquo;
                    {(item.message_for_juniors || item.post_brc_institution || '')
                      .replace(/\[DEMO\]/gi, '')
                      .trim()}
                    &rdquo;
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>College No: {item.college_number || item.kit_no}</span>
                <span>{item.city_country || item.current_city}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 03. CLEAN ADMIN-ONLY LOGIN PAGE (/login) — STRICT MANUAL ENTRY
// ============================================================================
export const LoginPage: React.FC<{
  onLoginSuccess: (loginPayload: any) => void;
  onDemoSwitch?: (role: RoleCode) => void;
  navigate: (path: string) => void;
}> = ({ onLoginSuccess, navigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const storedCreds = getStoredAdminCreds();

  const completeLocalAdminSignIn = (overrideUsername?: string, overrideEmail?: string) => {
    const active = getStoredAdminCreds();
    onLoginSuccess({
      sessionToken: 'local-admin-session',
      user: {
        id: 1,
        username: overrideUsername || active.username || 'admin',
        role_code: 'SUPER_ADMIN',
        display_name: 'College Administrator',
        email: overrideEmail || active.email || 'admin@brczhob.edu.pk',
        is_demo: false,
      },
      redirectTo: '/admin/dashboard',
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();
    if (!cleanUser || !cleanPass) {
      setError('Please enter your institutional username and password.');
      return;
    }

    const activeCreds = getStoredAdminCreds();
    const isCustomAdminMatch =
      activeCreds.isCustom &&
      (cleanUser.toLowerCase() === activeCreds.username.toLowerCase() ||
        cleanUser.toLowerCase() === activeCreds.email.toLowerCase()) &&
      cleanPass === activeCreds.passwordPlain;

    const isDefaultAdminMatch =
      !activeCreds.isCustom &&
      (cleanUser.toLowerCase() === 'admin' ||
        cleanUser.toLowerCase() === 'admin@brczhob.edu.pk') &&
      (cleanPass === 'Admin@BrcZhob2026!' ||
        cleanPass === 'admin123' ||
        cleanPass === 'Admin#2026' ||
        cleanPass === 'admin');

    setLoading(true);
    try {
      // 1. If custom credentials match locally, sign in immediately and sync
      if (isCustomAdminMatch) {
        completeLocalAdminSignIn(activeCreds.username, activeCreds.email);
        return;
      }

      // 2. Try XAMPP/cPanel PHP endpoint (api/login.php) or Node API (/api/auth/login)
      let authenticatedPayload: any | null = null;
      let explicitAuthError: string | null = null;

      try {
        const phpRes = await fetch(`${BRC_BASE_PREFIX}/api/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPass,
          }),
        });
        const phpType = phpRes.headers.get('content-type') || '';
        if (phpType.includes('application/json')) {
          const phpData = await phpRes.json();
          if (phpRes.ok && (phpData.ok || phpData.sessionToken || phpData.user)) {
            authenticatedPayload = phpData;
          } else if (phpRes.status === 401 || phpRes.status === 429) {
            explicitAuthError = phpData.message || phpData.error || 'Invalid credentials.';
          }
        }
      } catch {}

      if (
        !authenticatedPayload &&
        (!explicitAuthError || isDefaultAdminMatch || isCustomAdminMatch)
      ) {
        try {
          const res = await fetch(`${BRC_BASE_PREFIX}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: cleanUser,
              usernameOrEmail: cleanUser,
              password: cleanPass,
            }),
          });
          const cType = res.headers.get('content-type') || '';
          if (cType.includes('application/json')) {
            const data = await res.json();
            if (res.ok) {
              authenticatedPayload = data;
              explicitAuthError = null;
            } else if (res.status === 401 || res.status === 429) {
              explicitAuthError =
                data.error ||
                data.message ||
                'Invalid credentials. Access restricted to authorized college administrators.';
            }
          }
        } catch {}
      }

      // Guard: if custom credentials are set locally, reject old default credentials unless matched
      if (activeCreds.isCustom && !isCustomAdminMatch) {
        setError(
          explicitAuthError ||
            'Invalid institutional username or password. Custom administrator credentials are active.'
        );
        return;
      }

      if (authenticatedPayload) {
        onLoginSuccess({
          sessionToken:
            authenticatedPayload.sessionToken ||
            authenticatedPayload.token ||
            'local-admin-session',
          user: {
            ...authenticatedPayload.user,
            role_code:
              authenticatedPayload.user?.role_code ||
              authenticatedPayload.user?.role ||
              'SUPER_ADMIN',
          },
          redirectTo: authenticatedPayload.redirectTo || '/admin/dashboard',
        });
        return;
      }

      // Allow default administrator credentials in standalone/XAMPP/preview environments when not customized
      if (isDefaultAdminMatch) {
        completeLocalAdminSignIn();
        return;
      }

      if (explicitAuthError) {
        setError(explicitAuthError);
        return;
      }

      setError('Invalid credentials. Access restricted to authorized college administrators.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[78vh] flex items-center justify-center px-4 py-12 bg-[#FFFDF9]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Institutional Header */}
        <div className="bg-[#7A1C24] text-white p-8 text-center space-y-3 border-b border-amber-400/30">
          <img
            src={BRC_LOGO_URL}
            alt="BRC Zhob Crest"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full border-2 border-amber-400 bg-white p-0.5 mx-auto shadow-md"
          />
          <div className="space-y-1">
            <h1 className="font-editorial text-2xl font-bold tracking-wide text-white">
              College Administration Portal
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FBBF24]">
              Authorized Personnel Sign In
            </p>
          </div>
        </div>

        {/* Manual Sign-In Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Administrator Username or Email
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={storedCreds.username || 'admin'}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Security Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={storedCreds.isCustom ? 'Enter your custom password' : 'Admin@BrcZhob2026!'}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#7A1C24]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-sm cursor-pointer shadow-md transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In to Administration Portal'}
          </button>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-slate-500 hover:text-[#7A1C24] cursor-pointer"
            >
              ← Return to Public Website
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 04. OFFICIAL 3-COPY PRINTABLE BANK CHALLAN MODAL (NBP Zhob Branch)
// ============================================================================
export const PrintableBankChallanModal: React.FC<{
  candidateName: string;
  fatherName: string;
  classApplied: string;
  applicationRef: string;
  cnic: string;
  amount?: number;
  bankName?: string;
  accountNo?: string;
  dueDate?: string;
  onClose: () => void;
}> = ({
  candidateName,
  fatherName,
  classApplied,
  applicationRef,
  cnic,
  amount = 2500,
  bankName = 'National Bank of Pakistan, Zhob Branch (Code: 0142)',
  accountNo = '0042-3019284756',
  dueDate = '20 Oct 2026',
  onClose,
}) => {
  const [challanStatus, setChallanStatus] = useState<string | null>(null);

  const copies = [
    { label: 'BANK COPY', subtitle: 'To be retained by National Bank of Pakistan' },
    { label: 'COLLEGE COPY', subtitle: 'To be submitted with admission dossier / uploaded' },
    { label: 'CANDIDATE COPY', subtitle: 'To be retained by applicant as proof of fee deposit' },
  ];

  const handlePrintAndDownloadChallan = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const colWidths = 88;
      const startX = [10, 104, 198];

      copies.forEach((copy, i) => {
        const x = startX[i];
        doc.setDrawColor(122, 28, 36);
        doc.setLineWidth(0.6);
        doc.rect(x, 12, colWidths, 186, 'S');

        doc.setFillColor(122, 28, 36);
        doc.rect(x + 2, 14, colWidths - 4, 22, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('BRC ZHOB - ADMISSION FEE CHALLAN', x + colWidths / 2, 22, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(251, 191, 36);
        doc.text(copy.label, x + colWidths / 2, 28, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(copy.subtitle, x + colWidths / 2, 33, { align: 'center' });

        // Bank Details
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Bank:', x + 4, 44);
        doc.setFont('helvetica', 'normal');
        doc.text('NBP Zhob Branch (Code: 0142)', x + 22, 44);

        doc.setFont('helvetica', 'bold');
        doc.text('A/C Title:', x + 4, 50);
        doc.setFont('helvetica', 'normal');
        doc.text('BRC Zhob Admission Fund', x + 22, 50);

        doc.setFont('helvetica', 'bold');
        doc.text('A/C No:', x + 4, 56);
        doc.setFont('courier', 'bold');
        doc.setTextColor(122, 28, 36);
        doc.text(accountNo, x + 22, 56);

        doc.setDrawColor(203, 213, 225);
        doc.line(x + 4, 60, x + colWidths - 4, 60);

        // Candidate Info
        const rows = [
          ['Challan No:', applicationRef || 'NBP-2026-DRAFT'],
          ['Issue Date:', new Date().toISOString().slice(0, 10)],
          ['Due Date:', dueDate],
          ['Candidate:', candidateName || '________________'],
          ['Father Name:', fatherName || '________________'],
          ['Class Applied:', classApplied || 'Class 8th'],
          ['CNIC / B-Form:', cnic || '56501-0000000-0'],
        ];

        rows.forEach((r, rIdx) => {
          const y = 68 + rIdx * 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(r[0], x + 4, y);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(String(r[1]).slice(0, 26), x + 30, y);
        });

        doc.line(x + 4, 124, x + colWidths - 4, 124);

        // Fee Breakdown
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Admission Processing Fee', x + 4, 133);
        doc.text('PKR 2,000', x + colWidths - 4, 133, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.text('Entry Test & Verification Fee', x + 4, 141);
        doc.text('PKR 500', x + colWidths - 4, 141, { align: 'right' });

        doc.setFillColor(254, 243, 199);
        doc.rect(x + 4, 146, colWidths - 8, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(122, 28, 36);
        doc.text('TOTAL PAYABLE', x + 6, 152.5);
        doc.text(`PKR ${amount.toLocaleString()}/-`, x + colWidths - 6, 152.5, { align: 'right' });

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('Two Thousand Five Hundred Rupees Only (Non-Refundable)', x + 4, 163);

        // Signatures
        doc.setDrawColor(148, 163, 184);
        doc.line(x + 6, 186, x + 38, 186);
        doc.line(x + 48, 186, x + colWidths - 6, 186);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Candidate Signature', x + 22, 191, { align: 'center' });
        doc.text('Bank Officer & Stamp', x + 66, 191, { align: 'center' });
      });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NBP_3Copy_Challan_${applicationRef || 'BRC_Zhob'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try {
        window.print();
      } catch {}

      setChallanStatus('✓ 3-Copy NBP Bank Challan PDF downloaded & ready to print!');
      setTimeout(() => setChallanStatus(null), 5000);
    } catch {
      try {
        window.print();
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl my-4 overflow-hidden flex flex-col">
        {/* Modal Action Bar (No Print) */}
        <div className="bg-[#7A1C24] text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-editorial font-bold text-base sm:text-lg">
                Official 3-Copy Bank Challan — National Bank of Pakistan
              </h3>
              <p className="text-xs text-amber-200">
                Print on standard A4 paper. Deposit at any online branch of NBP nationwide.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintAndDownloadChallan}
              className="px-3.5 py-1.5 rounded-lg bg-[#FBBF24] hover:bg-[#F59E0B] text-[#7A1C24] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download 3-Copy Challan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white font-bold text-xs cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {challanStatus && (
          <div className="bg-emerald-700 text-white px-6 py-2 text-xs font-bold flex items-center justify-between no-print">
            <span>{challanStatus}</span>
            <button
              type="button"
              onClick={() => setChallanStatus(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Challan 3 Copies Grid */}
        <div className="p-4 sm:p-6 overflow-x-auto bg-[#FFFDF9]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[760px]">
            {copies.map((c, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-300 bg-white space-y-3 text-[11px] text-slate-800 flex flex-col justify-between shadow-xs"
              >
                {/* Header */}
                <div className="text-center space-y-1 pb-2 border-b border-slate-200">
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src={BRC_LOGO_URL}
                      alt="BRC Zhob Crest"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-amber-400 bg-white"
                    />
                    <div className="text-left">
                      <div className="font-editorial font-bold text-xs text-[#7A1C24]">
                        BRC ZHOB
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">EST. 2016</div>
                    </div>
                  </div>
                  <div className="font-bold text-[10px] text-slate-900 tracking-wide">
                    BALOCHISTAN RESIDENTIAL COLLEGE ZHOB
                  </div>
                  <div className="inline-block px-2 py-0.5 rounded bg-amber-100 text-[#7A1C24] font-bold text-[9px] uppercase tracking-wider">
                    {c.label}
                  </div>
                  <div className="text-[9px] text-slate-500">{c.subtitle}</div>
                </div>

                {/* Bank Details */}
                <div className="p-2 rounded bg-[#FAF8F5] border border-slate-200 space-y-0.5 text-[10px]">
                  <div>
                    <strong className="text-slate-900">Bank:</strong> {bankName}
                  </div>
                  <div>
                    <strong className="text-slate-900">Account Title:</strong> BRC Zhob Admission Fund
                  </div>
                  <div>
                    <strong className="text-slate-900">Account No:</strong>{' '}
                    <span className="font-mono font-bold text-[#7A1C24]">{accountNo}</span>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="space-y-1 text-[10px] border-b border-slate-200 pb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Challan / Ref No:</span>
                    <strong className="font-mono text-[#7A1C24]">
                      {applicationRef || 'BRC-ADM-2026-DRAFT'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issue Date:</span>
                    <span className="font-mono">{new Date().toISOString().slice(0, 10)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Due Date:</span>
                    <strong className="font-mono text-rose-700">{dueDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Candidate Name:</span>
                    <strong className="text-slate-900">{candidateName || '________________'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Father Name:</span>
                    <span>{fatherName || '________________'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Class Applied:</span>
                    <strong className="text-slate-900">{classApplied || 'Class 8th'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CNIC / B-Form:</span>
                    <span className="font-mono">{cnic || '56501-0000000-0'}</span>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <table className="w-full text-left text-[10px] border border-slate-200">
                  <thead className="bg-[#FAF8F5]">
                    <tr>
                      <th className="p-1.5 border-b border-slate-200">Fee Head</th>
                      <th className="p-1.5 border-b border-slate-200 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1.5 border-b border-slate-100">Admission Processing Fee</td>
                      <td className="p-1.5 border-b border-slate-100 text-right font-mono">2,000</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-b border-slate-100">
                        Entry Test & Paper Verification
                      </td>
                      <td className="p-1.5 border-b border-slate-100 text-right font-mono">500</td>
                    </tr>
                    <tr className="font-bold bg-amber-50/60 text-[#7A1C24]">
                      <td className="p-1.5">TOTAL DEPOSITED</td>
                      <td className="p-1.5 text-right font-mono">PKR {amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-[9px] text-slate-500 italic">
                  Amount in words: Two Thousand Five Hundred Rupees Only. Non-refundable and non-transferable.
                </div>

                {/* Signatures */}
                <div className="pt-4 grid grid-cols-2 gap-2 text-[9px] text-slate-500 text-center border-t border-slate-200">
                  <div className="pt-4 border-t border-dashed border-slate-300">
                    Candidate / Remitter
                  </div>
                  <div className="pt-4 border-t border-dashed border-slate-300">
                    Cashier & Officer Stamp
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
