import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  Users,
  UserCheck,
  Search,
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  FileCode,
  Home,
  BookOpen,
  Building2,
  Award,
  Image as ImageIcon,
  Bell,
  FileText,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { RoleCode, SiteSettingsRecord } from '../types/brc';
import { CmsData, CMS_UPDATE_EVENT, getLiveCmsData } from '../utils/cmsStore';

export const BRC_BASE_PREFIX = '.';

export const BRC_LOGO_URL = `${BRC_BASE_PREFIX}/assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg`;

interface PreviewBarProps {
  currentPath: string;
  navigate: (path: string) => void;
  currentUser: {
    id: number;
    username: string;
    display_name: string;
    role_code: RoleCode;
    is_demo: boolean;
  } | null;
  onDemoSwitch: (role: RoleCode | 'GUEST') => void;
  onOpenXamppModal: () => void;
}

/**
 * Floating Collapsible Role Switcher & XAMPP Code Inspector
 * Positioned in bottom-right corner so header remains 100% clean and true to approved client design.
 */
export const PreviewRoleSwitcherBar: React.FC<PreviewBarProps> = () => {
  return null;
};

interface PublicHeaderProps {
  currentPath: string;
  navigate: (path: string) => void;
  currentUser: {
    id: number;
    username: string;
    display_name: string;
    role_code: RoleCode;
  } | null;
  onLogout: () => void;
  siteSettings?: SiteSettingsRecord;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentPath,
  navigate,
  currentUser,
  onLogout,
  siteSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmsData, setCmsData] = useState<CmsData>(() => getLiveCmsData());

  React.useEffect(() => {
    const handleUpdate = () => setCmsData(getLiveCmsData());
    window.addEventListener(CMS_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(CMS_UPDATE_EVENT, handleUpdate);
  }, []);

  const noticeText =
    cmsData?.siteMetrics?.topNotice ||
    siteSettings?.notice_ribbon_text ||
    'Admissions Open for Class 8th & 1st Year (Session 2026–2027) — Entry Test on 20 Oct 2026';
  const noticeLink = siteSettings?.notice_ribbon_link || '/admissions';
  const contactPhone =
    cmsData?.siteMetrics?.topNoticePhone || siteSettings?.contact_phone || '+92 824 912345';

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Academics & Wings', path: '/academics' },
    { label: 'Hostel Life', path: '/hostel-life' },
    { label: 'Notices', path: '/notices' },
    { label: 'Admissions', path: '/admissions' },
    { label: 'Results', path: '/results' },
    { label: 'Alumni', path: '/alumni' },
    { label: 'Contact', path: '/contact' },
  ];

  const getPortalDashboardPath = () => {
    if (!currentUser) return '/login';
    if (currentUser.role_code === 'SUPER_ADMIN' || currentUser.role_code === 'ADMIN')
      return '/admin/dashboard';
    if (currentUser.role_code === 'TEACHER') return '/teacher/dashboard';
    if (currentUser.role_code === 'CADET') return '/cadet/dashboard';
    if (currentUser.role_code === 'PARENT') return '/parent/dashboard';
    return '/';
  };

  return (
    <header className="sticky top-0 z-40 shadow-xs no-print">
      {/* 1. TOP ANNOUNCEMENT RIBBON: Solid maroon bar */}
      <div className="bg-[#7A1C24] text-white py-1.5 px-4 text-xs font-sans">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left: Amber pill NOTICE + Dynamic announcement text */}
          <div className="flex items-center gap-2.5 truncate max-w-full">
            <span className="bg-[#FBBF24] text-[#7A1C24] font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
              NOTICE
            </span>
            <button
              onClick={() => navigate(noticeLink)}
              className="text-white hover:text-amber-200 transition-colors truncate text-left cursor-pointer font-medium"
            >
              {noticeText}
            </button>
          </div>

          {/* Right: Examination Rosters & Phone */}
          <div className="flex items-center gap-4 shrink-0 text-white/90 text-[11px]">
            <button
              onClick={() => navigate('/results')}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Examination Rosters</span>
            </button>
            <span className="text-white/30 hidden sm:inline">•</span>
            <a
              href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>{contactPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. CRISP WHITE NAVBAR */}
      <div className="bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left group shrink-0 cursor-pointer"
          >
            <img
              src={BRC_LOGO_URL}
              alt="Balochistan Residential College Zhob Official Crest"
              referrerPolicy="no-referrer"
              className="w-13 h-13 rounded-full object-cover border-2 border-[#7A1C24] bg-white shadow-xs shrink-0 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#7A1C24]">
                BRC ZHOB
              </div>
              <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                EST. 2016 • CADET COLLEGE
              </div>
            </div>
          </button>

          {/* Primary Nav Links */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-700">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath === item.path || currentPath.startsWith(item.path + '/');
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`py-2 transition-all whitespace-nowrap shrink-0 cursor-pointer border-b-2 font-semibold ${
                    isActive
                      ? 'text-[#7A1C24] border-[#7A1C24]'
                      : 'border-transparent text-slate-600 hover:text-[#7A1C24] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/results')}
              title="Search Results & Roll Numbers"
              className="p-2 rounded-lg text-slate-500 hover:text-[#7A1C24] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* APPLY ONLINE Button: Amber badge style */}
            <button
              onClick={() => navigate('/admissions')}
              className="border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold px-3.5 sm:px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              APPLY ONLINE
            </button>

            {/* STAFF PORTAL / DASHBOARD Button: Solid Crimson Maroon */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate(getPortalDashboardPath())}
                  className="bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold px-3.5 sm:px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                  <span>Admin Portal</span>
                </button>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold px-3.5 sm:px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>STAFF PORTAL</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-left font-semibold transition-colors cursor-pointer ${
                  currentPath === item.path
                    ? 'bg-[#7A1C24] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

interface HeroBannerProps {
  title: string;
  highlightedWord?: string;
  subtitle: string;
  breadcrumbs: { label: string; path?: string }[];
  navigate: (path: string) => void;
  quoteText?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  highlightedWord,
  subtitle,
  breadcrumbs,
  navigate,
  quoteText = '“Discipline Today Leads to Success Tomorrow”',
}) => {
  return (
    <section className="relative bg-[#FAF8F5] text-slate-900 overflow-hidden border-b border-slate-200 py-10 sm:py-12">
      {/* Subtle Crest Watermark */}
      <img
        src={BRC_LOGO_URL}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="hidden md:block absolute right-12 top-1/2 -translate-y-1/2 w-52 h-52 rounded-full object-cover opacity-[0.04] pointer-events-none select-none"
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#7A1C24] font-semibold mb-3">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                {crumb.path ? (
                  <button
                    onClick={() => navigate(crumb.path!)}
                    className="hover:underline cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-slate-500 font-normal">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            {title}{' '}
            {highlightedWord && <span className="text-[#7A1C24]">{highlightedWord}</span>}
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="md:text-right shrink-0">
          <p className="font-editorial italic text-sm text-[#7A1C24] max-w-xs font-semibold">
            {quoteText}
          </p>
          <div className="mt-2 h-0.5 w-16 bg-amber-400 md:ml-auto" />
        </div>
      </div>
    </section>
  );
};

interface PublicSidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
  quote?: string;
}

export const PublicSidebar: React.FC<PublicSidebarProps> = ({
  currentPath,
  navigate,
  quote = '“Education is the most powerful weapon which you can use to change the world.”',
}) => {
  const links = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'About Us', path: '/about', icon: Building2 },
    { label: "Principal's Profile", path: '/about/principal', icon: UserCheck },
    { label: 'Vision & Mission', path: '/about/vision-mission', icon: Sparkles },
    { label: 'History', path: '/about/history', icon: BookOpen },
    { label: 'Achievements', path: '/about/achievements', icon: Award },
    { label: 'Academics & Wings', path: '/academics', icon: GraduationCap },
    { label: 'Faculty & Staff', path: '/faculty', icon: Users },
    { label: 'Hostel Life', path: '/hostel-life', icon: Building2 },
    { label: 'Results', path: '/results', icon: FileText },
    { label: 'Gallery', path: '/gallery', icon: ImageIcon },
    { label: 'Notices', path: '/notices', icon: Bell },
    { label: 'Contact Us', path: '/contact', icon: Phone },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white text-slate-800 rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="px-3 py-2 border-b border-slate-100 mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A1C24]">
            Institutional Directory
          </span>
        </div>
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                  active
                    ? 'bg-[#7A1C24] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#7A1C24]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 pt-5 border-t border-slate-100 px-3 pb-2 text-center">
          <p className="font-editorial italic text-xs text-slate-600 leading-relaxed">
            {quote}
          </p>
          <div className="mt-3 w-10 h-0.5 bg-amber-400 mx-auto" />
        </div>
      </div>
    </aside>
  );
};

interface PublicFooterProps {
  siteSettings: SiteSettingsRecord;
  navigate: (path: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ siteSettings, navigate }) => {
  return (
    <footer className="bg-[#4A0E17] text-white border-t-4 border-[#FBBF24] mt-16 no-print">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          {/* Column 1: Brand & Mission */}
          <div className="flex items-start gap-4">
            <img
              src={BRC_LOGO_URL}
              alt="BRC Zhob Official Logo"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 bg-white shrink-0 shadow-md"
            />
            <div>
              <h3 className="font-editorial text-lg font-bold text-white">
                {siteSettings?.college_name || 'Balochistan Residential College Zhob'}
              </h3>
              <p className="mt-2 text-xs text-white/80 leading-relaxed">
                BRC Zhob is a premier residential cadet institution under the Government of Balochistan,
                committed to providing quality education, character building, and leadership training
                to the youth of Balochistan since {siteSettings?.established_year || '2016'}.
              </p>
            </div>
          </div>

          {/* Column 2: Contact Us */}
          <div>
            <h4 className="font-editorial text-base font-semibold text-amber-300 mb-3">
              Contact Us
            </h4>
            <ul className="space-y-2.5 text-xs text-white/85">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{siteSettings?.contact_address || 'College Road, Zhob, Balochistan, Pakistan'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono">{siteSettings?.contact_phone || '+92 824 912345'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{siteSettings?.contact_email || 'info@brczhob.edu.pk'}</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="font-editorial text-base font-semibold text-amber-300 mb-3">
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Online Admissions', path: '/admissions/apply' },
                { label: 'Track Application', path: '/admissions/track' },
                { label: 'Academic Programs', path: '/academics' },
                { label: 'Faculty & Staff', path: '/faculty' },
                { label: 'Exam Results', path: '/results' },
                { label: 'Campus Gallery', path: '/gallery' },
                { label: 'Notices & Circulars', path: '/notices' },
                { label: 'Alumni Registration', path: '/alumni/register' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms & Conduct', path: '/terms' },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-1.5 text-left text-white/85 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div>
            © 2026 {siteSettings?.college_name || 'Balochistan Residential College Zhob'}. All Rights Reserved. • Discipline • Knowledge • Character
          </div>
          <div className="flex items-center gap-4">
            <span className="text-amber-300/90 font-medium">
              Official Digital Web Portal of Balochistan Residential College Zhob • Government of Balochistan.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
