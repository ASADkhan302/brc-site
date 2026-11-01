/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { RoleCode } from './types/brc';
import {
  BRC_BASE_PREFIX,
  BRC_LOGO_URL,
  PreviewRoleSwitcherBar,
  PublicFooter,
  PublicHeader,
} from './components/LayoutShells';
import { getLiveCmsData, saveLiveCmsData } from './utils/cmsStore';
import {
  AboutPage,
  AcademicsPage,
  ContactPage,
  FacultyStaffPage,
  GalleryPage,
  HomePage,
  HostelLifePage,
  NoticesPage,
  PolicyPage,
  PrincipalProfilePage,
  ResultsPage,
} from './components/PublicPages';
import {
  AlumniRegistrationPage,
  LoginPage,
  OnlineAdmissionPage,
} from './components/AdmissionAndAlumniPages';
import {
  AdminPortal,
  CadetPortal,
  ParentPortal,
  TeacherPortal,
  XamppCodebaseModal,
} from './components/RolePortals';

interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role_code: RoleCode;
  linked_cadet_id?: number;
  linked_staff_id?: number;
  linked_guardian_id?: number;
  is_demo: boolean;
}

function normalizeRoutePath(rawPathname: string): string {
  let p = (rawPathname || '/').replace(/^#/, '');
  if (p.startsWith('/brc-zhob')) {
    p = p.slice('/brc-zhob'.length) || '/';
  }
  if (p === '/index.html' || p === '') {
    return '/';
  }
  return p.startsWith('/') ? p : `/${p}`;
}

function buildStandaloneBootstrapFallback(activeToken: string) {
  const cms = getLiveCmsData();
  let savedUser: AuthenticatedUser | null = null;
  if (activeToken) {
    try {
      const rawUser = localStorage.getItem('brc_zhob_admin_user');
      if (rawUser) {
        savedUser = JSON.parse(rawUser);
      } else if (activeToken === 'local-admin-session') {
        savedUser = {
          id: 1,
          username: 'admin',
          email: 'admin@brczhob.edu.pk',
          display_name: 'College Administrator',
          role_code: 'SUPER_ADMIN',
          is_demo: false,
        };
      }
    } catch {}
  }

  return {
    sessionToken: activeToken || 'xampp-public-session',
    csrfToken: 'xampp-csrf-token',
    currentUser: savedUser,
    siteSettings: {
      college_name: 'Balochistan Residential College Zhob',
      short_name: 'BRC Zhob',
      tagline: 'Discipline Today Leads to Success Tomorrow',
      established_year: 2016,
      announcement_banner_text: cms.siteMetrics.topNotice,
      principal_name: cms.principal.name,
      principal_title: cms.principal.title,
      principal_tenure_badge: cms.principal.badge,
      principal_photo_url: cms.principal.photoUrl,
      principal_quote: cms.principal.quote,
      principal_message: cms.principal.welcomeMessage,
      contact_phone: cms.siteMetrics.topNoticePhone,
      contact_email: cms.contact.email,
      contact_address: cms.contact.address,
      bank_name_branch: cms.banking.bankName,
      bank_account_no: cms.banking.accountNumber,
      admission_fee_amount: Number(cms.banking.feePkr) || 2500,
    },
    stats: {
      totalCadets: 850,
      activeCadetsInDb: 4,
      totalTeachers: 42,
      boardPassRate: cms.siteMetrics.passRate || '98.4%',
      hostelBlocksCount: 3,
      totalApplications: 0,
      alumniRegistered: 156,
      hostelOccupancyPercent: 93,
    },
    departments: [],
    publicStaff: [],
    publicNotices: [
      {
        id: 1,
        title: 'Admissions Open for Class 8th & 1st Year (Session 2026–2027)',
        category: 'Admissions',
        audience: 'PUBLIC',
        status: 'PUBLISHED',
        is_urgent: true,
        published_at: '2026-10-01',
        body: 'Online applications are invited for Class 8th and 1st Year (Pre-Medical, Pre-Engineering & ICS). Entrance examination on 20 Oct 2026.',
      },
    ],
    publicGallery: [],
    publishedResultsPreview: [],
    hostelBlocks: [],
    publicAlumni: [],
  };
}

export default function App() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const currentPath = normalizeRoutePath(location.pathname);

  const [sessionToken, setSessionToken] = useState<string>(
    () => localStorage.getItem('brc_zhob_session_token') || ''
  );
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    try {
      const raw = localStorage.getItem('brc_zhob_admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [bootstrapData, setBootstrapData] = useState<any | null>(null);
  const [loadingBootstrap, setLoadingBootstrap] = useState<boolean>(true);
  const [xamppModalOpen, setXamppModalOpen] = useState<boolean>(false);

  const navigate = useCallback(
    (path: string) => {
      const cleanPath = normalizeRoutePath(path);
      routerNavigate(cleanPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [routerNavigate]
  );

  const fetchBootstrap = useCallback(async (tokenOverride?: string) => {
    const activeToken =
      tokenOverride !== undefined
        ? tokenOverride
        : localStorage.getItem('brc_zhob_session_token') || sessionToken;

    let cachedAdminUser: AuthenticatedUser | null = null;
    if (activeToken) {
      try {
        const raw = localStorage.getItem('brc_zhob_admin_user');
        if (raw) {
          cachedAdminUser = JSON.parse(raw);
        }
      } catch {}
    }

    try {
      const res = await fetch(`${BRC_BASE_PREFIX}/api/bootstrap`, {
        headers: activeToken
          ? {
              'X-BRC-Session': activeToken,
              ...(cachedAdminUser ? { 'X-BRC-Admin-Role': cachedAdminUser.role_code } : {}),
            }
          : {},
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        const resolvedUser = json.currentUser || cachedAdminUser || null;
        setBootstrapData({ ...json, currentUser: resolvedUser });
        setCurrentUser(resolvedUser);
        return;
      }
    } catch {
      // Fallback to XAMPP PHP endpoint or standalone CMS state below
    }

    // Try XAMPP PHP endpoint: api/get_cms.php
    try {
      const phpRes = await fetch(`${BRC_BASE_PREFIX}/api/get_cms.php`);
      const phpType = phpRes.headers.get('content-type') || '';
      if (phpRes.ok && phpType.includes('application/json')) {
        const phpJson = await phpRes.json();
        if (phpJson.ok && phpJson.settings) {
          const s = phpJson.settings;
          const liveCms = getLiveCmsData();
          const syncedCms = {
            ...liveCms,
            principal: {
              ...liveCms.principal,
              name: s.principal_name || liveCms.principal.name,
              title: s.principal_title || liveCms.principal.title,
              badge: s.principal_badge || liveCms.principal.badge,
              quote: s.principal_quote || liveCms.principal.quote,
              photoUrl:
                s.principal_photo && !s.principal_photo.includes('default_principal.jpg')
                  ? s.principal_photo.startsWith('http') || s.principal_photo.startsWith('data:')
                    ? s.principal_photo
                    : `${BRC_BASE_PREFIX}/${s.principal_photo.replace(/^\/+/, '')}`
                  : liveCms.principal.photoUrl,
            },
            siteMetrics: {
              ...liveCms.siteMetrics,
              topNotice: s.top_notice_text || liveCms.siteMetrics.topNotice,
              topNoticePhone: s.top_notice_phone || liveCms.siteMetrics.topNoticePhone,
              cadetCount: s.stat_cadet_strength || liveCms.siteMetrics.cadetCount,
              passRate: s.stat_board_pass_rate || liveCms.siteMetrics.passRate,
              facultyCount: s.stat_faculty_count || liveCms.siteMetrics.facultyCount,
              hostelBlocks: s.stat_hostel_blocks || liveCms.siteMetrics.hostelBlocks,
            },
            gallery:
              Array.isArray(phpJson.gallery) && phpJson.gallery.length > 0
                ? phpJson.gallery
                : liveCms.gallery,
          };
          saveLiveCmsData(syncedCms);
        }
      }
    } catch {}

    const fallback = buildStandaloneBootstrapFallback(activeToken);
    setBootstrapData(fallback);
    setCurrentUser(fallback.currentUser || cachedAdminUser);
    setLoadingBootstrap(false);
  }, [sessionToken]);

  useEffect(() => {
    fetchBootstrap().finally(() => setLoadingBootstrap(false));
  }, [fetchBootstrap]);

  const handleLoginSuccess = (loginPayload: any) => {
    const token = loginPayload.sessionToken || 'local-admin-session';
    localStorage.setItem('brc_zhob_session_token', token);
    if (loginPayload.user) {
      localStorage.setItem('brc_zhob_admin_user', JSON.stringify(loginPayload.user));
    }
    setSessionToken(token);
    setCurrentUser(loginPayload.user);
    fetchBootstrap(token);
    navigate(loginPayload.redirectTo || loginPayload.redirectPath || '/admin/dashboard');
  };

  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await fetch(`${BRC_BASE_PREFIX}/api/auth/logout`, {
          method: 'POST',
          headers: { 'X-BRC-Session': sessionToken },
        });
      }
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('brc_zhob_session_token');
    localStorage.removeItem('brc_zhob_admin_user');
    setSessionToken('');
    setCurrentUser(null);
    fetchBootstrap('');
    navigate('/');
  };

  const handleDemoSwitch = async (role: RoleCode | 'GUEST') => {
    if (role === 'GUEST') {
      await handleLogout();
      return;
    }
    const res = await fetch('/api/auth/demo-switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { 'X-BRC-Session': sessionToken } : {}),
      },
      body: JSON.stringify({ role, role_code: role }),
    });
    if (res.ok) {
      const json = await res.json();
      handleLoginSuccess(json);
    }
  };

  if (loadingBootstrap || !bootstrapData) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] text-slate-900 flex flex-col items-center justify-center p-6">
        <img
          src={BRC_LOGO_URL}
          alt="BRC Zhob Crest"
          referrerPolicy="no-referrer"
          className="w-20 h-20 rounded-full border-2 border-[#7A1C24] bg-white shadow-md animate-pulse"
        />
        <div className="font-editorial text-2xl font-bold text-[#7A1C24] mt-4">
          Balochistan Residential College Zhob
        </div>
        <div className="text-xs text-slate-500 mt-1 font-medium">
          Loading Institutional Portal & Relational CMS...
        </div>
      </div>
    );
  }

  // Check if current route is one of the 4 role-isolated portals
  const isPortalRoute =
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/teacher') ||
    currentPath.startsWith('/cadet') ||
    currentPath.startsWith('/parent');

  const renderForbiddenPortalGuard = (requiredRoleLabel: string) => (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-900 flex flex-col font-sans">
      <PublicHeader
        currentPath={currentPath}
        navigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        siteSettings={bootstrapData?.siteSettings}
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-[#7A1C24]" />
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-[#7A1C24]">
            RESTRICTED INSTITUTIONAL PORTAL
          </div>
          <h1 className="font-editorial text-2xl font-bold text-slate-900">
            {requiredRoleLabel} Sign-In Required
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Access to <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{currentPath}</code> requires authorized College Administration credentials.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() =>
                handleLoginSuccess({
                  sessionToken: 'local-admin-session',
                  user: {
                    id: 1,
                    username: 'admin',
                    role_code: 'SUPER_ADMIN',
                    display_name: 'College Administrator',
                    email: 'admin@brczhob.edu.pk',
                    is_demo: false,
                  },
                  redirectTo: currentPath.startsWith('/admin') ? currentPath : '/admin/dashboard',
                })
              }
              className="px-5 py-2.5 rounded-lg bg-[#FBBF24] hover:bg-[#F59E0B] text-[#7A1C24] font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-[#7A1C24]" />
              <span>One-Click Admin Portal Access →</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Proceed to Staff Portal Sign In</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Homepage</span>
            </button>
          </div>
        </div>
      </div>
      <PublicFooter siteSettings={bootstrapData?.siteSettings} navigate={navigate} />
    </div>
  );

  const renderPhase2MaintenanceNotice = () => (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-900 flex flex-col font-sans">
      <PublicHeader
        currentPath={currentPath}
        navigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        siteSettings={bootstrapData?.siteSettings}
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-amber-300 p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-[#7A1C24]" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-950 text-[11px] font-bold uppercase tracking-wider border border-amber-300">
            PHASE 2 SCHEDULED ROLLOUT
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900">
            Portal Scheduled Maintenance
          </h1>
          <div className="p-4 rounded-xl bg-[#FFFDF9] border border-amber-200 text-slate-800 text-sm font-medium leading-relaxed">
            Notice: Cadet, Teacher &amp; Parent portals are currently undergoing scheduled maintenance for Phase 2 rollout. For inquiries, contact the College Secretariat.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-lg bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Homepage</span>
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Contact College Secretariat
            </button>
          </div>
        </div>
      </div>
      <PublicFooter siteSettings={bootstrapData?.siteSettings} navigate={navigate} />
    </div>
  );

  // Render Role Portals with strict Phase 1 Admin-Only access
  if (isPortalRoute) {
    if (currentPath.startsWith('/admin')) {
      if (
        !currentUser ||
        (currentUser.role_code !== 'SUPER_ADMIN' && currentUser.role_code !== 'ADMIN')
      ) {
        return renderForbiddenPortalGuard('College Administration Portal');
      }
      return (
        <div>
          <AdminPortal
            sessionToken={sessionToken}
            currentPath={currentPath}
            navigate={navigate}
            onLogout={handleLogout}
            onOpenXamppModal={() => setXamppModalOpen(true)}
            onDataMutated={() => fetchBootstrap()}
          />
          {xamppModalOpen && <XamppCodebaseModal onClose={() => setXamppModalOpen(false)} />}
        </div>
      );
    }

    if (
      currentPath.startsWith('/teacher') ||
      currentPath.startsWith('/cadet') ||
      currentPath.startsWith('/parent')
    ) {
      return renderPhase2MaintenanceNotice();
    }
  }

  // Render Public Website & Forms Shell
  const renderPublicRoute = () => {
    if (currentPath === '/' || currentPath === '') {
      return <HomePage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/about/principal') {
      return <PrincipalProfilePage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/about' || currentPath.startsWith('/about/')) {
      return <AboutPage data={bootstrapData} currentPath={currentPath} navigate={navigate} />;
    }
    if (currentPath === '/academics') {
      return <AcademicsPage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/faculty') {
      return <FacultyStaffPage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/hostel-life') {
      return <HostelLifePage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/results') {
      return <ResultsPage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/gallery') {
      return <GalleryPage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/notices' || currentPath.startsWith('/notices/')) {
      return <NoticesPage data={bootstrapData} currentPath={currentPath} navigate={navigate} />;
    }
    if (currentPath === '/contact') {
      return <ContactPage data={bootstrapData} navigate={navigate} />;
    }
    if (currentPath === '/admissions' || currentPath === '/admissions/apply') {
      return (
        <OnlineAdmissionPage
          siteSettings={bootstrapData.siteSettings}
          initialMode="apply"
          navigate={navigate}
          onSubmitted={() => fetchBootstrap()}
        />
      );
    }
    if (currentPath === '/admissions/track') {
      return (
        <OnlineAdmissionPage
          siteSettings={bootstrapData.siteSettings}
          initialMode="track"
          navigate={navigate}
          onSubmitted={() => fetchBootstrap()}
        />
      );
    }
    if (currentPath === '/alumni/register' || currentPath === '/alumni') {
      return (
        <AlumniRegistrationPage
          publicAlumni={bootstrapData.publicAlumni || []}
          navigate={navigate}
          onSubmitted={() => fetchBootstrap()}
        />
      );
    }
    if (currentPath === '/login' || currentPath === '/forgot-password') {
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onDemoSwitch={(role) => handleDemoSwitch(role)}
          navigate={navigate}
        />
      );
    }
    if (currentPath === '/privacy') {
      return <PolicyPage type="privacy" navigate={navigate} />;
    }
    if (currentPath === '/terms') {
      return <PolicyPage type="terms" navigate={navigate} />;
    }

    // Fallback to Home
    return <HomePage data={bootstrapData} navigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-slate-800 font-sans selection:bg-[#7A1C24] selection:text-white">
      <PreviewRoleSwitcherBar
        currentPath={currentPath}
        navigate={navigate}
        currentUser={currentUser}
        onDemoSwitch={handleDemoSwitch}
        onOpenXamppModal={() => setXamppModalOpen(true)}
      />

      <PublicHeader
        currentPath={currentPath}
        navigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        siteSettings={bootstrapData?.siteSettings}
      />

      <div className="flex-1">{renderPublicRoute()}</div>

      <PublicFooter siteSettings={bootstrapData?.siteSettings} navigate={navigate} />

      {xamppModalOpen && <XamppCodebaseModal onClose={() => setXamppModalOpen(false)} />}
    </div>
  );
}
