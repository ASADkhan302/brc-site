import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  GraduationCap,
  Users,
  TrendingUp,
  Building2,
  Shield,
  BookOpen,
  Home as HomeIcon,
  Target,
  Bell,
  ChevronRight,
  ChevronLeft,
  Play,
  FileText,
  Award,
  Phone,
  Mail,
  MapPin,
  Search,
  CheckCircle2,
  Calendar,
  Download,
  Printer,
  X,
  Eye,
  Clock,
  Sparkles,
  UserCheck,
  Utensils,
  Wifi,
  Lock,
} from 'lucide-react';
import {
  DepartmentRecord,
  ExamResultSummaryRecord,
  GalleryAlbumRecord,
  HostelBlockRecord,
  NoticeRecord,
  SiteSettingsRecord,
  StaffProfileRecord,
} from '../types/brc';
import { BRC_LOGO_URL, HeroBanner, PublicSidebar } from './LayoutShells';
import { CmsData, CMS_UPDATE_EVENT, getLiveCmsData, isRemovedMockupUrl } from '../utils/cmsStore';

interface PublicBootstrapData {
  siteSettings: SiteSettingsRecord;
  stats: {
    totalCadets: number;
    activeCadetsInDb: number;
    totalTeachers: number;
    boardPassRate: string;
    hostelBlocksCount: number;
    totalApplications: number;
    alumniRegistered: number;
    hostelOccupancyPercent: number;
  };
  departments: DepartmentRecord[];
  publicStaff: StaffProfileRecord[];
  publicNotices: NoticeRecord[];
  publicGallery: GalleryAlbumRecord[];
  publishedResultsPreview: {
    id: number;
    public_token: string;
    exam_name: string;
    exam_type: string;
    exam_date: string;
    class_name: string;
    program_group: string;
    roll_no: string;
    cadet_name: string;
    percentage: number;
    grade_letter: string;
  }[];
  hostelBlocks: HostelBlockRecord[];
}

// ============================================================================
// 01. APPROVED HOMEPAGE (/) — Matches Page 15 Reference
// ============================================================================
// 01. APPROVED HOMEPAGE (/) — Matches Approved Institutional Identity
// ============================================================================
export const HomePage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ data, navigate }) => {
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [activeNoticeIdx, setActiveNoticeIdx] = useState(0);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);

  // Live CMS Store subscription
  const [cmsData, setCmsData] = useState<CmsData>(() => getLiveCmsData());

  React.useEffect(() => {
    const handleUpdate = () => setCmsData(getLiveCmsData());
    window.addEventListener(CMS_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(CMS_UPDATE_EVENT, handleUpdate);
  }, []);

  const notices = data.publicNotices.length > 0 ? data.publicNotices : [];
  const currentNotice = notices[activeNoticeIdx % Math.max(1, notices.length)];

  // Dynamic Gallery Synchronization with localStorage & cross-component event
  const [gallerySlides, setGallerySlides] = useState<string[]>(() => {
    try {
      const live = getLiveCmsData();
      if (live?.gallery) {
        return live.gallery.map((g) => g.url).filter((u) => !isRemovedMockupUrl(u));
      }
    } catch {}
    return [];
  });

  React.useEffect(() => {
    const handleGalleryUpdate = () => {
      try {
        const live = getLiveCmsData();
        setGallerySlides(
          live?.gallery ? live.gallery.map((g) => g.url).filter((u) => !isRemovedMockupUrl(u)) : []
        );
      } catch {}
    };
    window.addEventListener('brc_gallery_updated', handleGalleryUpdate);
    window.addEventListener(CMS_UPDATE_EVENT, handleGalleryUpdate);
    return () => {
      window.removeEventListener('brc_gallery_updated', handleGalleryUpdate);
      window.removeEventListener(CMS_UPDATE_EVENT, handleGalleryUpdate);
    };
  }, []);

  return (
    <div>
      {/* 1. APPROVED LIGHT HERO SECTION */}
      <section className="relative bg-[#FFFDF9] text-slate-900 overflow-hidden border-b border-slate-200">
        {/* Subtle circular BRC Crest Watermark (4% opacity) */}
        <img
          src={BRC_LOGO_URL}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full object-cover opacity-[0.04] pointer-events-none select-none"
        />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Hero Text & CTAs (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>PREMIER RESIDENTIAL CADET COLLEGE</span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-[#0F172A]">
                {cmsData.siteMetrics.heroHeadline || "Nurturing Tomorrow's Leaders with Discipline & Academic Brilliance"}
              </h1>

              <p className="font-editorial text-xl sm:text-2xl text-[#7A1C24] font-semibold italic">
                Balochistan Residential College Zhob • Excellence Since 2016
              </p>

              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-600 uppercase">
                <span>Discipline</span>
                <span className="text-amber-500">•</span>
                <span>Knowledge</span>
                <span className="text-amber-500">•</span>
                <span>Character</span>
              </div>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                {cmsData.siteMetrics.heroSubheadline}
              </p>

              {/* Dual Action CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate('/admissions')}
                  className="px-6 py-3.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Start Online Admission →</span>
                </button>
                <button
                  onClick={() => setTourModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-[#7A1C24] fill-[#7A1C24]" />
                  <span>Explore Campus Tour</span>
                </button>
              </div>

              {/* 3 Approved Emerald Trust Checkmarks */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Govt. of Balochistan Affiliated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>BISE Quetta Top Positions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>ISSB & Armed Forces Grooming</span>
                </div>
              </div>
            </div>

            {/* Right Column: Floating Cadet Metric Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-100 overflow-hidden space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={BRC_LOGO_URL}
                      alt="BRC Zhob Crest"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-[#7A1C24] object-cover"
                    />
                    <div>
                      <div className="font-editorial text-base font-bold text-[#0F172A]">
                        Institutional At-a-Glance
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Official Session 2026–2027 Statistics
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Active</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-[#7A1C24] flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-[#7A1C24]">
                        {cmsData.siteMetrics.cadetCount}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Cadet Strength</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-[#059669]">
                        {cmsData.siteMetrics.passRate}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Board Pass Rate</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-slate-800">
                        {cmsData.siteMetrics.facultyCount}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Faculty Specialists</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-slate-800">
                        {cmsData.siteMetrics.hostelBlocks}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Hostel Blocks</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Callout */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#7A1C24] font-semibold">
                  <span>Next Entry Test: 20 Oct 2026</span>
                  <button
                    onClick={() => navigate('/admissions')}
                    className="hover:underline flex items-center gap-1 font-bold shrink-0 cursor-pointer text-amber-700"
                  >
                    <span>Details →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRINCIPAL'S DESK & CORE PILLARS SECTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Portrait Card with Dynamic Photo (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center justify-between">
            <div className="w-full flex flex-col items-center">
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-[#7A1C24] overflow-hidden shadow-md bg-slate-50 mb-4">
                <img
                  src={cmsData.principal.photoUrl || BRC_LOGO_URL}
                  alt={cmsData.principal.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-bold text-xs uppercase tracking-wider mb-2">
                {cmsData.principal.badge || '18+ Years Leadership in Cadet Education'}
              </span>

              <h3 className="font-editorial text-2xl font-bold text-[#0F172A]">
                {cmsData.principal.name}
              </h3>
              <p className="text-xs font-semibold text-[#7A1C24] uppercase tracking-wider mt-0.5">
                {cmsData.principal.title}
              </p>
            </div>

            <div className="w-full pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Cadet Educationist</span>
              <button
                onClick={() => navigate('/about/principal')}
                className="font-bold text-[#7A1C24] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Read Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Message & 3 Numbered Pillars (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-[#7A1C24] mb-1">
                FROM THE PRINCIPAL'S DESK
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0F172A]">
                Shaping the Future of Balochistan with Character and Discipline
              </h2>

              <blockquote className="my-4 pl-4 border-l-4 border-[#7A1C24] italic font-editorial text-base sm:text-lg text-slate-700 leading-relaxed">
                “{cmsData.principal.quote}”
              </blockquote>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {cmsData.principal.welcomeMessage}
              </p>
            </div>

            {/* 3 Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {cmsData.principal.pillars.map((pillar, idx) => (
                <div
                  key={pillar.id || idx}
                  className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <span className="font-mono text-xl font-black text-[#7A1C24] block mb-1">
                      {pillar.id}
                    </span>
                    <h4 className="font-editorial text-base font-bold text-[#0F172A]">
                      {pillar.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR CADET WINGS SECTION (Jinnah, Iqbal, Liaquat, Fatima) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-[#7A1C24]">
            TRADITION OF EXCELLENCE
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#0F172A] mt-1">
            The Four Cadet Wings of BRC Zhob
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Every cadet belongs to one of four historic residential wings, competing in academics, sports, and drills for the prestigious College Championship Banner.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(data.siteSettings.wings && data.siteSettings.wings.length === 4
            ? data.siteSettings.wings
            : [
                {
                  id: 'jinnah',
                  name: 'Jinnah Wing',
                  color_code: '#15803D',
                  badge_color: 'bg-emerald-700',
                  warden: 'Prof. Najaf Hussain',
                  capacity: 220,
                  motto: 'Unity, Faith and Discipline',
                  description: 'Named after Quaid-e-Azam. Fosters patriotism, leadership, and exemplary conduct.',
                },
                {
                  id: 'iqbal',
                  name: 'Iqbal Wing',
                  color_code: '#1D4ED8',
                  badge_color: 'bg-blue-700',
                  warden: 'Dr. Muhammad Asif',
                  capacity: 220,
                  motto: 'Khudi Ko Kar Buland Itna',
                  description: 'Named after Allama Iqbal. Inspires visionary thought, philosophical depth, and stamina.',
                },
                {
                  id: 'liaquat',
                  name: 'Liaquat Wing',
                  color_code: '#7A1C24',
                  badge_color: 'bg-[#7A1C24]',
                  warden: 'Prof. Zahid Khan',
                  capacity: 220,
                  motto: 'Devotion and Sacrifice',
                  description: 'Named after Quaid-e-Millat. Champions selflessness, service, and institutional pride.',
                },
                {
                  id: 'fatima',
                  name: 'Fatima Wing',
                  color_code: '#B45309',
                  badge_color: 'bg-amber-600',
                  warden: 'Dr. Samina Kakar',
                  capacity: 190,
                  motto: 'Courage and Grace',
                  description: 'Named after Madar-e-Millat. Exemplifies perseverance, academic mastery, and noble demeanor.',
                },
              ]
          ).map((wing) => (
            <div
              key={wing.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div
                  className="p-4 text-white flex items-center justify-between"
                  style={{ backgroundColor: wing.color_code }}
                >
                  <h3 className="font-editorial text-lg font-bold">{wing.name}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/20">
                    Cap: {wing.capacity}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="italic font-editorial text-xs font-semibold text-slate-800">
                    “{wing.motto}”
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {wing.description}
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 block">House Warden:</span>
                    <span className="font-semibold text-slate-800">{wing.warden}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-0">
                <button
                  onClick={() => navigate('/hostel-life')}
                  className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  View Wing Facilities →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LATEST NOTICES & NEWS SECTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Latest News & Circulars (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-editorial text-2xl font-bold text-[#0F172A]">
                    Official Notices & Circulars
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time announcements from the Principal and Academic Controller
                  </p>
                </div>
                <button
                  onClick={() => navigate('/notices')}
                  className="text-xs font-bold text-[#7A1C24] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Notices</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {data.publicNotices.slice(0, 4).map((notice) => (
                  <button
                    key={notice.id}
                    onClick={() => navigate(`/notices/${notice.slug}`)}
                    className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-[#FAF8F5] hover:bg-slate-100 border border-slate-100 text-left transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-[#7A1C24]">
                          {notice.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {notice.publish_at}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-[#7A1C24] truncate">
                        {notice.title}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#7A1C24] shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Audience-verified circulars published live from Admin CMS.</span>
              <button
                onClick={() => navigate('/results')}
                className="font-bold text-[#7A1C24] hover:underline cursor-pointer"
              >
                Search Results by Roll No →
              </button>
            </div>
          </div>

          {/* Campus Gallery (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-editorial text-2xl font-bold text-[#0F172A]">
                    Campus Gallery
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Glimpses of academic, sports, and cadet life
                  </p>
                </div>
                <button
                  onClick={() => navigate('/gallery')}
                  className="text-xs font-bold text-[#7A1C24] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>All Albums</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {gallerySlides.length > 0 ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 h-64 bg-slate-900 shadow-inner">
                  <img
                    src={gallerySlides[activeGalleryIdx % gallerySlides.length]}
                    alt="BRC Zhob Campus View"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {gallerySlides.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveGalleryIdx((p) => (p - 1 + gallerySlides.length) % gallerySlides.length)
                        }
                        aria-label="Previous Slide"
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-[#7A1C24] cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveGalleryIdx((p) => (p + 1) % gallerySlides.length)}
                        aria-label="Next Slide"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-[#7A1C24] cursor-pointer transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-[#FAF8F5] h-64 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="text-xs font-bold text-[#7A1C24] uppercase tracking-wider">
                    Campus Photo Archive
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    No gallery thumbnails stored. Upload official campus photographs directly from your computer in the Admin CMS.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => navigate('/gallery')}
                className="text-xs font-bold text-[#7A1C24] hover:underline cursor-pointer"
              >
                Browse Categorized Photo Archives (Architecture, Labs, Sports) →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SIX QUICK ACTION CARDS */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: BookOpen, label: 'Academic Programs', path: '/academics' },
            { icon: FileText, label: 'Admission Guide', path: '/admissions/apply' },
            { icon: Users, label: 'Faculty & Staff', path: '/faculty' },
            { icon: HomeIcon, label: 'Hostel Facilities', path: '/hostel-life' },
            { icon: Award, label: 'Exam Results', path: '/results' },
            { icon: Phone, label: 'Contact Us', path: '/contact' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:border-[#7A1C24] hover:shadow-md transition-all flex flex-col items-center justify-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#7A1C24] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#7A1C24]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* VIRTUAL TOUR MODAL */}
      {tourModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] rounded-2xl max-w-3xl w-full border-2 border-[#D5A83D] overflow-hidden shadow-2xl">
            <div className="bg-[#540B12] text-[#FFFDF8] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={BRC_LOGO_URL}
                  alt="BRC Logo"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full bg-white"
                />
                <h3 className="font-editorial text-lg font-bold">
                  BRC Zhob — Interactive Campus Virtual Tour
                </h3>
              </div>
              <button
                onClick={() => setTourModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#720F19] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
                alt="BRC Zhob Campus Panorama"
                referrerPolicy="no-referrer"
                className="w-full h-64 object-cover rounded-xl border border-[#E6D6B8]"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
                  <div className="font-bold text-[#540B12]">1. Academic & Science Block</div>
                  <p className="mt-1 text-[#71676A]">
                    Lecture theatres, Physics, Chemistry, Biology, and ICS Computer Labs.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
                  <div className="font-bold text-[#540B12]">2. Residential Hostels</div>
                  <p className="mt-1 text-[#71676A]">
                    Separate supervised Boys (Jinnah & Iqbal) and Girls (Fatima) residential blocks.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
                  <div className="font-bold text-[#540B12]">3. Sports & Auditorium</div>
                  <p className="mt-1 text-[#71676A]">
                    Main Auditorium, athletic tracks, cricket/football grounds, and cadet mess.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setTourModalOpen(false);
                    navigate('/gallery');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#720F19] text-[#FFFDF8] text-xs font-semibold cursor-pointer"
                >
                  Explore Full Photo Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 06. APPROVED ABOUT US (/about, /about/vision-mission, /about/history, /about/achievements)
// ============================================================================
export const AboutPage: React.FC<{
  data: PublicBootstrapData;
  currentPath: string;
  navigate: (path: string) => void;
}> = ({ data, currentPath, navigate }) => {
  const sectionTitle =
    currentPath === '/about/vision-mission'
      ? 'Vision & Mission'
      : currentPath === '/about/history'
      ? 'History & Milestones'
      : currentPath === '/about/achievements'
      ? 'Institutional Achievements'
      : 'About Us';

  return (
    <div>
      <HeroBanner
        title={sectionTitle}
        subtitle="Shaping character  |  Building futures  |  Serving the nation"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'About Us', path: '/about' },
          ...(currentPath !== '/about' ? [{ label: sectionTitle }] : []),
        ]}
        navigate={navigate}
      />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar currentPath={currentPath} navigate={navigate} />

        {/* Center Main Content */}
        <main className="flex-1 brc-glass-cream rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Our Legacy */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7">
              <div className="flex items-center gap-2.5 text-[#720F19] font-bold text-sm uppercase tracking-wider">
                <Building2 className="w-5 h-5 text-[#D5A83D]" />
                <span>Our Legacy</span>
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#23191A] mt-1">
                Balochistan Residential College Zhob
              </h2>
              <p className="mt-3 text-sm text-[#23191A]/90 leading-relaxed">
                Balochistan Residential College Zhob (BRC Zhob) is a premier residential institution
                established in 2016 under the vision of the Government of Balochistan. The college
                was founded with the aim of providing quality education, character building, and
                leadership training to the talented youth of Balochistan, especially from remote and
                underprivileged areas.
              </p>
              <p className="mt-3 text-sm text-[#23191A]/90 leading-relaxed">
                BRC Zhob stands as a symbol of discipline, excellence, and service. Our mission is
                to develop well-rounded individuals who are not only academically strong but also
                physically fit, morally upright, and socially responsible.
              </p>
            </div>
            <div className="md:col-span-5">
              <div className="rounded-xl overflow-hidden border-2 border-[#D5A83D]/50 shadow-md bg-[#3E080D]">
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
                  alt="BRC Zhob Main Academic Building"
                  referrerPolicy="no-referrer"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-[#540B12] text-[#FFFDF8] text-xs">
                  <div className="font-semibold text-[#F0D18A]">Our Campus</div>
                  <div className="text-[#FFFDF8]/80">A place where dreams take shape</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vision, Mission, Values 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E6D6B8]">
            <div className="p-5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
              <Target className="w-6 h-6 text-[#720F19] mb-2" />
              <h3 className="font-editorial text-lg font-bold text-[#23191A]">Our Vision</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#71676A] leading-relaxed">
                To be a center of excellence in education, character building, and leadership,
                producing responsible citizens for a progressive Pakistan.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
              <Sparkles className="w-6 h-6 text-[#720F19] mb-2" />
              <h3 className="font-editorial text-lg font-bold text-[#23191A]">Our Mission</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#71676A] leading-relaxed">
                To provide high quality education, instill discipline and values, and nurture future
                leaders through holistic residential development.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
              <Award className="w-6 h-6 text-[#720F19] mb-2" />
              <h3 className="font-editorial text-lg font-bold text-[#23191A]">Our Values</h3>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm text-[#71676A]">
                <li>· Discipline & Punctuality</li>
                <li>· Academic Integrity</li>
                <li>· Excellence & Merit</li>
                <li>· Public Service & Respect</li>
              </ul>
            </div>
          </div>

          {/* Our Commitment */}
          <div className="p-6 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex flex-col sm:flex-row gap-6 items-center">
            <img
              src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80"
              alt="BRC Zhob Science Laboratories"
              referrerPolicy="no-referrer"
              className="w-full sm:w-52 h-36 rounded-lg object-cover border border-[#D5A83D]/40 shrink-0"
            />
            <div>
              <h3 className="font-editorial text-xl font-bold text-[#23191A]">Our Commitment</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#71676A] leading-relaxed">
                At BRC Zhob, we are committed to providing a safe, disciplined, and supportive
                learning environment for both boys and girls. Our graduates go on to serve the
                nation across civil services, armed forces, medicine, engineering, and academia.
              </p>
              <div className="mt-3 text-xs font-bold text-[#720F19]">
                BRC Zhob — A Legacy of Excellence
              </div>
            </div>
          </div>
        </main>

        {/* Right Quick Facts Panel */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="brc-glass-cream rounded-2xl p-5 shadow-sm">
            <h3 className="font-editorial text-lg font-bold text-[#23191A] pb-3 border-b border-[#E6D6B8]">
              Quick Facts
            </h3>
            <dl className="mt-4 space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#E6D6B8]/60">
                <dt className="text-[#71676A]">Established</dt>
                <dd className="font-semibold text-[#23191A] font-mono-tabular">2016</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E6D6B8]/60">
                <dt className="text-[#71676A]">Location</dt>
                <dd className="font-semibold text-[#23191A]">Zhob, Balochistan</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E6D6B8]/60">
                <dt className="text-[#71676A]">Institution Type</dt>
                <dd className="font-semibold text-[#23191A]">Residential College</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E6D6B8]/60">
                <dt className="text-[#71676A]">Admissions</dt>
                <dd className="font-semibold text-[#247A50]">Boys & Girls</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-[#71676A]">Enrolled Cadets</dt>
                <dd className="font-semibold text-[#23191A] font-mono-tabular">
                  {data.stats.totalCadets}+
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-gradient-to-br from-[#720F19] to-[#3E080D] text-[#FFFDF8] rounded-2xl p-6 border border-[#D5A83D]/50 text-center shadow-md">
            <p className="font-editorial italic text-base text-[#F0D18A]">
              “Educating the youth for a stronger Balochistan.”
            </p>
            <button
              onClick={() => navigate('/admissions')}
              className="mt-4 w-full py-2.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs cursor-pointer"
            >
              Apply for Admission
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ============================================================================
// 07. APPROVED PRINCIPAL'S PROFILE (/about/principal) — Live CMS Synced
// ============================================================================
export const PrincipalProfilePage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ data, navigate }) => {
  const s = data.siteSettings;
  const [cmsData, setCmsData] = useState<CmsData>(() => getLiveCmsData());

  React.useEffect(() => {
    const handleUpdate = () => setCmsData(getLiveCmsData());
    window.addEventListener(CMS_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(CMS_UPDATE_EVENT, handleUpdate);
  }, []);

  const principalName = cmsData.principal.name || s.principal_name;
  const principalTitle = cmsData.principal.title || s.principal_title;
  const principalBadge = cmsData.principal.badge || s.principal_tenure_badge || '18+ Years Leadership';
  const principalPhoto = cmsData.principal.photoUrl || s.principal_photo_url || BRC_LOGO_URL;
  const principalQuote = cmsData.principal.quote || s.principal_vision_quote;

  return (
    <div className="bg-[#FFFDF9] min-h-screen">
      <HeroBanner
        title="Principal's Profile"
        subtitle="Visionary Leadership  •  Dedicated Service  •  A Brighter Future"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'About Us', path: '/about' },
          { label: "Principal's Profile" },
        ]}
        navigate={navigate}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start pb-16">
        <PublicSidebar currentPath="/about/principal" navigate={navigate} />

        <main className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-slate-100">
            <div className="w-36 h-48 rounded-xl border-2 border-[#7A1C24] overflow-hidden shadow-md bg-slate-50 p-1 shrink-0 flex flex-col items-center justify-center text-center">
              <img
                src={principalPhoto}
                alt={principalName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A1C24]">
                  Principal's Profile
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[11px] font-bold">
                  {principalBadge}
                </span>
              </div>

              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0F172A]">
                {principalName}
              </h2>
              <div className="text-sm font-semibold text-[#7A1C24]">{principalTitle}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-slate-100">
                  <span className="text-slate-500 block">Qualification:</span>
                  <span className="font-semibold text-slate-800">{s.principal_qualification}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-slate-100">
                  <span className="text-slate-500 block">Experience:</span>
                  <span className="font-semibold text-slate-800">{principalBadge}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-slate-100 sm:col-span-2">
                  <span className="text-slate-500 block">Official Contact:</span>
                  <span className="font-semibold text-[#7A1C24] font-mono">{s.principal_email}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-editorial text-xl font-bold text-[#0F172A] mb-3">
              Message from the Principal
            </h3>
            <blockquote className="mb-4 pl-4 border-l-4 border-[#7A1C24] italic font-editorial text-base text-slate-700 leading-relaxed">
              “{principalQuote}”
            </blockquote>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {cmsData.principal.welcomeMessage || s.principal_message_full}
            </div>

            {/* Core Pillars */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="font-editorial text-lg font-bold text-[#0F172A] mb-4">
                Three Pillars of Institutional Excellence
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cmsData.principal.pillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-100 space-y-1"
                  >
                    <span className="font-mono text-xl font-bold text-[#7A1C24]">{pillar.id}</span>
                    <div className="font-editorial font-bold text-base text-slate-900">
                      {pillar.title}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="font-editorial font-bold text-base text-[#7A1C24]">
                {principalName}
              </div>
              <div className="text-xs text-slate-500">{principalTitle}</div>
            </div>
          </div>
        </main>

        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-editorial text-base font-bold text-[#7A1C24] pb-2 border-b border-slate-100">
              Principal's Vision
            </h3>
            <p className="mt-3 font-editorial italic text-sm text-slate-700 leading-relaxed">
              “{principalQuote}”
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-editorial text-base font-bold text-[#7A1C24] pb-2 border-b border-slate-100">
              Key Focus Areas
            </h3>
            <ul className="mt-3 space-y-2 text-xs font-medium text-slate-700">
              {[
                'Quality Board & Entry Test Education',
                'Character & Leadership Development',
                'Discipline & Residential Mentorship',
                'Modern Science & Computing Facilities',
                'Community & National Service',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ============================================================================
// 08. APPROVED ACADEMICS (/academics) — Matches Page 22 Reference
// ============================================================================
export const AcademicsPage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ navigate }) => {
  const [selectedProgramTab, setSelectedProgramTab] = useState<
    'pre-eng' | 'pre-med' | 'ics' | 'arts'
  >('pre-eng');

  const programDetails = {
    'pre-eng': {
      title: 'FSc (Pre-Engineering)',
      group: 'Science Group (Pre-Engineering)',
      compulsory: ['English', 'Urdu', 'Pakistan Studies', 'Islamic Studies', 'Mathematics'],
      elective: [
        'Physics (Theory & Practical Lab)',
        'Chemistry (Organic & Inorganic Lab)',
        'Calculus & Analytical Geometry',
        'ECAT / Engineering Entry Test Coaching',
      ],
    },
    'pre-med': {
      title: 'FSc (Pre-Medical)',
      group: 'Science Group (Pre-Medical)',
      compulsory: ['English', 'Urdu', 'Pakistan Studies', 'Islamic Studies'],
      elective: [
        'Biology (Botany & Zoology Labs)',
        'Physics (Theory & Practical Lab)',
        'Chemistry (Organic & Inorganic Lab)',
        'MDCAT Medical Entry Test Coaching',
      ],
    },
    ics: {
      title: 'FSc (Computer Science / ICS)',
      group: 'Computer Science Group (ICS)',
      compulsory: ['English', 'Urdu', 'Pakistan Studies', 'Islamic Studies', 'Mathematics'],
      elective: [
        'Computer Science (C++, Databases, Networking)',
        'Physics / Statistics',
        'Software & Hardware Practical Lab',
      ],
    },
    arts: {
      title: 'FA / FSc (Humanities & Arts)',
      group: 'Arts & Social Sciences Group',
      compulsory: ['English', 'Urdu', 'Pakistan Studies', 'Islamic Studies'],
      elective: [
        'Economics & Civics',
        'History & Geography of Pakistan',
        'English Literature / Advanced Urdu',
      ],
    },
  };

  const activeProg = programDetails[selectedProgramTab];

  return (
    <div>
      <HeroBanner
        title="Academics"
        subtitle="Quality Education  |  Character Building  |  Future Leaders"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Academics' }]}
        navigate={navigate}
      />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar currentPath="/academics" navigate={navigate} />

        <main className="flex-1 brc-glass-cream rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[#23191A]">Academic Programs</h2>
            <p className="mt-2 text-xs sm:text-sm text-[#71676A] leading-relaxed">
              BRC Zhob offers a comprehensive academic curriculum approved by the Balochistan Board
              of Intermediate and Secondary Education (BBISE), combining interactive classroom
              instruction, laboratory practicals, and evening supervised prep.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
              {(
                [
                  { id: 'pre-eng', name: 'FSc (Pre-Engineering)', sub: 'Science Group' },
                  { id: 'pre-med', name: 'FSc (Pre-Medical)', sub: 'Science Group' },
                  { id: 'ics', name: 'FSc (Computer Science)', sub: 'ICS Group' },
                  { id: 'arts', name: 'FA / FSc (Arts)', sub: 'Humanities Group' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProgramTab(p.id)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedProgramTab === p.id
                      ? 'bg-[#540B12] text-[#FFFDF8] border-[#D5A83D] shadow-md'
                      : 'bg-[#F7F0E5] text-[#23191A] border-[#E6D6B8] hover:border-[#720F19]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#720F19] text-[#F0D18A] flex items-center justify-center mx-auto mb-2.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="font-editorial font-bold text-sm">{p.name}</div>
                  <div
                    className={`text-xs mt-1 ${
                      selectedProgramTab === p.id ? 'text-[#F0D18A]' : 'text-[#71676A]'
                    }`}
                  >
                    {p.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Offered Interactive Section */}
          <div className="pt-6 border-t border-[#E6D6B8]">
            <h3 className="font-editorial text-xl font-bold text-[#23191A]">
              Subjects Offered — {activeProg.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="p-5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
                <h4 className="font-bold text-sm text-[#540B12] pb-2 border-b border-[#E6D6B8]">
                  Compulsory Subjects
                </h4>
                <ul className="mt-3 space-y-2 text-xs sm:text-sm text-[#23191A]">
                  {activeProg.compulsory.map((sub, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#247A50]" />
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8]">
                <h4 className="font-bold text-sm text-[#540B12] pb-2 border-b border-[#E6D6B8]">
                  Elective / Specialized Subjects
                </h4>
                <ul className="mt-3 space-y-2 text-xs sm:text-sm text-[#23191A]">
                  {activeProg.elective.map((sub, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#720F19]" />
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Callout Banner */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-[#540B12] to-[#3E080D] text-[#FFFDF8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-editorial text-lg font-bold text-[#F0D18A]">
                Excellence in Education & Board Examinations
              </h4>
              <p className="text-xs text-[#FFFDF8]/85 mt-1">
                Apply online for the upcoming academic session or view published examination results.
              </p>
            </div>
            <button
              onClick={() => navigate('/admissions/apply')}
              className="px-5 py-2.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs shrink-0 cursor-pointer"
            >
              Apply for Admission →
            </button>
          </div>
        </main>

        {/* Right Column: Highlights & Yearly Academic Calendar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="brc-glass-cream rounded-2xl p-5 shadow-sm">
            <h3 className="font-editorial text-base font-bold text-[#23191A] pb-2 border-b border-[#E6D6B8]">
              Academic Highlights
            </h3>
            <div className="mt-3 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F7F0E5] flex items-center justify-between">
                <span className="text-[#71676A]">Academic Streams</span>
                <span className="font-bold font-mono-tabular text-[#540B12]">4 Programs</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F0E5] flex items-center justify-between">
                <span className="text-[#71676A]">Science & IT Labs</span>
                <span className="font-bold text-[#540B12]">Modern Equipped</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F0E5] flex items-center justify-between">
                <span className="text-[#71676A]">Evening Prep</span>
                <span className="font-bold text-[#247A50]">Daily Supervised</span>
              </div>
            </div>
          </div>

          <div className="brc-glass-cream rounded-2xl p-5 shadow-sm">
            <h3 className="font-editorial text-base font-bold text-[#23191A] pb-2 border-b border-[#E6D6B8]">
              Yearly Academic Calendar
            </h3>
            <ul className="mt-3 space-y-3 text-xs">
              {[
                { label: 'Classes Begin', date: '01 August 2026' },
                { label: 'Mid-Term Examinations', date: '02–15 November 2026' },
                { label: 'Winter Vacation', date: '22 Dec – 15 Feb' },
                { label: 'Annual Board Exams', date: 'March / April 2027' },
              ].map((ev, i) => (
                <li key={i} className="flex items-start gap-2.5 pb-2 border-b border-[#E6D6B8]/60">
                  <Calendar className="w-4 h-4 text-[#720F19] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#23191A]">{ev.label}</div>
                    <div className="text-[#71676A] font-mono-tabular">{ev.date}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ============================================================================
// 09. APPROVED FACULTY & STAFF (/faculty) — Matches Page 23 Reference
// ============================================================================
export const FacultyStaffPage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ data, navigate }) => {
  const [categoryTab, setCategoryTab] = useState<'ALL' | 'TEACHING' | 'ADMINISTRATIVE' | 'SUPPORT'>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffProfileRecord | null>(null);

  const filteredStaff = data.publicStaff.filter((s) => {
    const matchesCat = categoryTab === 'ALL' || s.staff_type === categoryTab;
    const matchesDept = deptFilter === 'ALL' || s.department_name === deptFilter;
    const matchesQ =
      !searchQuery ||
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDept && matchesQ;
  });

  return (
    <div>
      <HeroBanner
        title="Faculty & Staff"
        subtitle="Our Dedicated Team • Experienced Faculty • Supportive Staff"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Faculty & Staff' }]}
        navigate={navigate}
      />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar
          currentPath="/faculty"
          navigate={navigate}
          quote="“Great institutions are built by great people.”"
        />

        <main className="flex-1 brc-glass-cream rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
              Our Faculty & Staff
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#71676A]">
              BRC Zhob takes pride in its highly qualified, experienced, and dedicated faculty and
              staff who mentor cadets in classrooms, laboratories, and residential wings.
            </p>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { count: '50+', label: 'Teaching Faculty', sub: 'Qualified & Experienced' },
              { count: '20+', label: 'Administrative Staff', sub: 'Support & Management' },
              { count: '10+', label: 'Support Staff', sub: 'Hostel, Mess & Security' },
              { count: '100%', label: 'Committed to', sub: 'Academic Excellence' },
            ].map((st, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] text-center"
              >
                <div className="font-mono-tabular text-2xl font-bold text-[#720F19]">
                  {st.count}
                </div>
                <div className="text-xs font-semibold text-[#23191A] mt-1">{st.label}</div>
                <div className="text-[11px] text-[#71676A]">{st.sub}</div>
              </div>
            ))}
          </div>

          {/* Interactive Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {(
              [
                { id: 'ALL', label: 'All Staff' },
                { id: 'TEACHING', label: 'Teaching Faculty' },
                { id: 'ADMINISTRATIVE', label: 'Administrative Staff' },
                { id: 'SUPPORT', label: 'Support Staff' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  categoryTab === tab.id
                    ? 'bg-[#720F19] text-[#FFFDF8]'
                    : 'bg-[#F7F0E5] text-[#23191A] hover:bg-[#E6D6B8]/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Department Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#71676A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, department or designation..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm focus:outline-none focus:border-[#720F19]"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm focus:outline-none focus:border-[#720F19]"
            >
              <option value="ALL">All Departments</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Profile Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex flex-col justify-between hover:border-[#D5A83D] transition-all"
              >
                <div>
                  <div className="flex items-center gap-3.5">
                    <img
                      src={BRC_LOGO_URL}
                      alt={staff.full_name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#D5A83D] bg-white shrink-0"
                    />
                    <div>
                      <h3 className="font-editorial font-bold text-base text-[#23191A]">
                        {staff.full_name}
                      </h3>
                      <div className="text-xs font-medium text-[#720F19]">{staff.designation}</div>
                      <div className="text-[11px] text-[#71676A]">{staff.department_name}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[#71676A] line-clamp-2">{staff.bio}</p>
                </div>

                <button
                  onClick={() => setSelectedStaff(staff)}
                  className="mt-4 w-full py-2 rounded-lg bg-white hover:bg-[#540B12] text-[#540B12] hover:text-[#FFFDF8] border border-[#E6D6B8] text-xs font-semibold transition-colors cursor-pointer"
                >
                  View Profile →
                </button>
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar: Departments & Careers */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="brc-glass-cream rounded-2xl p-5 shadow-sm">
            <h3 className="font-editorial text-base font-bold text-[#23191A] pb-2 border-b border-[#E6D6B8]">
              Our Departments
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              {data.departments.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setDeptFilter(d.name)}
                    className="w-full flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[#F7F0E5] text-left cursor-pointer"
                  >
                    <span className="font-medium text-[#23191A]">{d.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#720F19]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-b from-[#540B12] to-[#3E080D] text-[#FFFDF8] rounded-2xl p-5 border border-[#D5A83D]/40">
            <h4 className="font-editorial text-lg font-bold text-[#F0D18A]">Join Our Team</h4>
            <p className="mt-2 text-xs text-[#FFFDF8]/85 leading-relaxed">
              BRC Zhob welcomes inquiries from qualified subject specialists and residential staff.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="mt-4 w-full py-2.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs cursor-pointer"
            >
              Contact HR / Administration
            </button>
          </div>
        </aside>
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] rounded-2xl max-w-lg w-full border-2 border-[#D5A83D] overflow-hidden shadow-2xl">
            <div className="bg-[#540B12] text-[#FFFDF8] px-6 py-4 flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold">{selectedStaff.full_name}</h3>
              <button
                onClick={() => setSelectedStaff(null)}
                className="p-1 rounded-lg hover:bg-[#720F19] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-4">
                <img
                  src={BRC_LOGO_URL}
                  alt={selectedStaff.full_name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full border-2 border-[#D5A83D]"
                />
                <div>
                  <div className="font-bold text-[#720F19]">{selectedStaff.designation}</div>
                  <div className="text-[#71676A]">{selectedStaff.department_name}</div>
                  <div className="font-mono-tabular text-xs text-[#71676A] mt-0.5">
                    Employee Code: {selectedStaff.employee_code}
                  </div>
                </div>
              </div>
              <p className="text-[#23191A] leading-relaxed">{selectedStaff.bio}</p>
              <div className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] space-y-2 text-xs">
                <div>
                  <span className="text-[#71676A]">Qualifications: </span>
                  <span className="font-semibold text-[#23191A]">{selectedStaff.qualification}</span>
                </div>
                <div>
                  <span className="text-[#71676A]">Experience: </span>
                  <span className="font-semibold text-[#23191A]">
                    {selectedStaff.experience_years}
                  </span>
                </div>
                <div>
                  <span className="text-[#71676A]">Assigned Classes: </span>
                  <span className="font-semibold text-[#23191A]">
                    {selectedStaff.assigned_classes.join(', ') || 'Residential & General Duty'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 10. APPROVED HOSTEL LIFE (/hostel-life) — Matches Page 24 Reference
// ============================================================================
export const HostelLifePage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ data, navigate }) => {
  const [selectedBlock, setSelectedBlock] = useState<HostelBlockRecord | null>(null);

  return (
    <div>
      <HeroBanner
        title="Hostel Life"
        subtitle="Safe Residence  |  Comfortable Living  |  A Home Away From Home"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Hostel Life' }]}
        navigate={navigate}
      />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar
          currentPath="/hostel-life"
          navigate={navigate}
          quote="“A safe and supportive hostel environment builds a stronger tomorrow.”"
        />

        <main className="flex-1 brc-glass-cream rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[#23191A]">Hostel Overview</h2>
            <p className="mt-2 text-xs sm:text-sm text-[#71676A] leading-relaxed">
              BRC Zhob provides well-maintained and secure residential hostels for both boys and
              girls, designed to offer a disciplined, comfortable, and homely academic environment
              with nutritious dining, supervised study hours, and 24/7 warden oversight.
            </p>

            {/* 5 Icon Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
              {[
                { icon: Shield, title: 'Safe & Secure', sub: 'Gated Enclaves' },
                { icon: HomeIcon, title: 'Clean & Spacious', sub: '3–4 Bed Rooms' },
                { icon: Utensils, title: 'Nutritious', sub: 'Mess Dining Facility' },
                { icon: Lock, title: '24/7 Security', sub: 'CCTV & Guards' },
                { icon: UserCheck, title: 'Supportive', sub: 'Resident Wardens' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] text-center"
                  >
                    <Icon className="w-6 h-6 text-[#720F19] mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-[#23191A]">{item.title}</div>
                    <div className="text-[11px] text-[#71676A]">{item.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Boys Hostel & Girls Hostel Sections */}
          <div className="pt-6 border-t border-[#E6D6B8]">
            <h3 className="font-editorial text-xl font-bold text-[#23191A] mb-4">
              Hostel Blocks (Separate Boys & Girls Enclaves)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.hostelBlocks.map((block) => (
                <div
                  key={block.id}
                  className="rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-[#540B12] text-[#FFFDF8] px-5 py-3 flex items-center justify-between">
                      <span className="font-editorial font-bold text-base">{block.name}</span>
                      <span className="text-xs text-[#F0D18A] font-mono-tabular">
                        {block.gender_policy} WING
                      </span>
                    </div>
                    <div className="p-5 space-y-3">
                      <p className="text-xs text-[#71676A] leading-relaxed">{block.description}</p>
                      <ul className="space-y-1.5 text-xs text-[#23191A]">
                        {block.facilities.slice(0, 5).map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#247A50] shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <button
                      onClick={() => setSelectedBlock(block)}
                      className="w-full py-2 rounded-lg bg-[#720F19] hover:bg-[#8D1722] text-[#FFFDF8] text-xs font-semibold cursor-pointer"
                    >
                      View Block Capacity & Warden Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Quick Facts */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="brc-glass-cream rounded-2xl p-5 shadow-sm">
            <h3 className="font-editorial text-base font-bold text-[#23191A] pb-2 border-b border-[#E6D6B8]">
              Hostel Quick Facts
            </h3>
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#E6D6B8]/60">
                <span className="text-[#71676A]">Active Blocks</span>
                <span className="font-semibold text-[#23191A]">2 Boys + 1 Girls</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E6D6B8]/60">
                <span className="text-[#71676A]">Room Sharing</span>
                <span className="font-semibold text-[#23191A]">3 to 4 Cadets</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E6D6B8]/60">
                <span className="text-[#71676A]">Warden Supervision</span>
                <span className="font-semibold text-[#247A50]">24/7 On-Site</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#71676A]">Security</span>
                <span className="font-semibold text-[#23191A]">CCTV & Perimeter Guards</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#540B12] to-[#3E080D] text-[#FFFDF8] rounded-2xl p-5 border border-[#D5A83D]/40">
            <h4 className="font-editorial text-base font-bold text-[#F0D18A]">
              Have Any Questions?
            </h4>
            <p className="mt-1.5 text-xs text-[#FFFDF8]/85">
              For hostel allocation policy, mess menu, or visiting hours, contact the Chief Warden
              Office.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="mt-4 w-full py-2.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs cursor-pointer"
            >
              Contact Hostel Office →
            </button>
          </div>
        </aside>
      </div>

      {selectedBlock && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] rounded-2xl max-w-lg w-full border-2 border-[#D5A83D] overflow-hidden shadow-2xl">
            <div className="bg-[#540B12] text-[#FFFDF8] px-6 py-4 flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold">{selectedBlock.name}</h3>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1 rounded-lg hover:bg-[#720F19] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <p className="text-[#23191A]">{selectedBlock.description}</p>
              <div className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#71676A]">Gender Policy:</span>
                  <span className="font-bold text-[#720F19]">{selectedBlock.gender_policy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71676A]">Resident Warden:</span>
                  <span className="font-semibold text-[#23191A]">{selectedBlock.warden_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71676A]">Total Rooms / Capacity:</span>
                  <span className="font-mono-tabular font-semibold text-[#23191A]">
                    {selectedBlock.total_rooms} Rooms ({selectedBlock.occupied_beds}/
                    {selectedBlock.total_capacity} Beds Occupied)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 11. APPROVED RESULTS (/results) + PRINTABLE REPORT CARD — Matches Page 25
// ============================================================================
export const ResultsPage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ data, navigate }) => {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchResults, setSearchResults] = useState<ExamResultSummaryRecord[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedReportCard, setSelectedReportCard] = useState<ExamResultSummaryRecord | null>(
    null
  );

  const handleSearch = async (e?: React.FormEvent, presetRoll?: string) => {
    if (e) e.preventDefault();
    const targetQ = presetRoll ?? query;
    setSearchError(null);
    setSearching(true);
    try {
      const res = await fetch('/api/public/results/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQ, classFilter }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSearchError(json.error || 'Could not search results.');
        setSearchResults(null);
      } else {
        setSearchResults(json.results || []);
      }
    } catch {
      setSearchError('Network error while searching published results.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <HeroBanner
        title="Results"
        subtitle="Exams  |  Marks  |  Grades  |  Your Success, Our Priority"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Results' }]}
        navigate={navigate}
        quoteText="“Knowledge Today Builds a Better Tomorrow”"
      />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar
          currentPath="/results"
          navigate={navigate}
          quote="“Hard work today creates a brighter tomorrow.”"
        />

        <main className="flex-1 brc-glass-cream rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Check Your Results Search Box */}
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
              Check Your Results
            </h2>
            <p className="text-xs sm:text-sm text-[#71676A] mt-1">
              Search by Roll Number (e.g., <code className="font-mono-tabular font-bold text-[#720F19]">ZH-1012</code>,{' '}
              <code className="font-mono-tabular font-bold text-[#720F19]">ZH-1104</code>,{' '}
              <code className="font-mono-tabular font-bold text-[#720F19]">ZH-1109</code>) or
              Candidate Name to view official published report cards.
            </p>

            <form
              onSubmit={(e) => handleSearch(e)}
              className="mt-4 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setSearchQueryOrRoll(e.target.value)}
                placeholder="Enter Roll Number (e.g. ZH-1012) or Candidate Name"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm focus:outline-none focus:border-[#720F19]"
              />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm"
              >
                <option value="ALL">All Classes</option>
                <option value="Class 10">Class 10 (Matric)</option>
                <option value="Class 11">Class 11 (FSc Part-I)</option>
                <option value="Class 12">Class 12 (FSc Part-II)</option>
              </select>
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-2.5 rounded-lg bg-[#720F19] hover:bg-[#8D1722] text-[#FFFDF8] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{searching ? 'Searching...' : 'Search'}</span>
              </button>
            </form>

            {searchError && (
              <div className="mt-3 p-3 rounded-lg bg-[#B4232C]/10 border border-[#B4232C]/30 text-[#B4232C] text-xs font-medium">
                {searchError}
              </div>
            )}

            {/* Search Results Output */}
            {searchResults !== null && (
              <div className="mt-5 p-4 rounded-xl bg-[#F7F0E5] border border-[#D5A83D]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#540B12]">
                    Matching Published Result Records ({searchResults.length})
                  </span>
                  <button
                    onClick={() => setSearchResults(null)}
                    className="text-xs text-[#71676A] hover:underline cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-[#71676A]">
                    No published result matched your query. Try Roll No{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('ZH-1012');
                        handleSearch(undefined, 'ZH-1012');
                      }}
                      className="text-[#720F19] font-bold underline cursor-pointer"
                    >
                      ZH-1012
                    </button>{' '}
                    or{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('ZH-1104');
                        handleSearch(undefined, 'ZH-1104');
                      }}
                      className="text-[#720F19] font-bold underline cursor-pointer"
                    >
                      ZH-1104
                    </button>
                    .
                  </p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((resItem) => (
                      <div
                        key={resItem.id}
                        className="p-4 rounded-lg bg-white border border-[#E6D6B8] flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#23191A]">
                            {resItem.cadet_name}{' '}
                            <span className="font-mono-tabular text-xs text-[#720F19]">
                              ({resItem.roll_no})
                            </span>
                          </div>
                          <div className="text-xs text-[#71676A]">
                            {resItem.exam_name} · {resItem.class_name} · {resItem.program_group}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono-tabular">
                            <div className="text-sm font-bold text-[#247A50]">
                              {resItem.percentage}% (Grade {resItem.grade_letter})
                            </div>
                            <div className="text-[11px] text-[#71676A]">
                              {resItem.total_obtained_marks} / {resItem.total_max_marks} Marks
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedReportCard(resItem)}
                            className="px-4 py-2 rounded-lg bg-[#720F19] text-[#FFFDF8] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Official Report Card</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5 Category Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
              {[
                { label: 'Matric Result', q: 'ZH-1012' },
                { label: 'Intermediate Result', q: 'ZH-1104' },
                { label: 'Girls Wing Merit', q: 'ZH-1109' },
                { label: 'Annual Exams', q: 'ZH-1104' },
                { label: 'Result Cards (Print)', q: 'ZH-1012' },
              ].map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(cat.q);
                    handleSearch(undefined, cat.q);
                  }}
                  className="p-3.5 rounded-xl bg-[#F7F0E5] hover:bg-[#540B12] text-[#23191A] hover:text-[#FFFDF8] border border-[#E6D6B8] text-center transition-colors cursor-pointer group"
                >
                  <FileText className="w-5 h-5 text-[#720F19] group-hover:text-[#F0D18A] mx-auto mb-1.5" />
                  <div className="text-xs font-semibold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Admission Application Tracker Banner on /results */}
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A1C24]">
                2026–2027 ENTRANCE ADMISSIONS TRACKER
              </div>
              <div className="font-editorial text-lg font-bold text-slate-900 mt-0.5">
                Track Your Online Admission Application &amp; Roll Slip
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Have an Admission Reference ID (e.g. <code className="font-mono font-bold text-[#7A1C24]">BRC-ADM-2026-0001</code>)? Check your fee verification status, quota category, and assigned Roll Slip.
              </p>
            </div>
            <button
              onClick={() => navigate('/admissions/track')}
              className="px-4 py-2.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-all"
            >
              Open Live Application Tracker →
            </button>
          </div>

          {/* Latest Published Results Table */}
          <div className="pt-6 border-t border-[#E6D6B8]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-editorial text-xl font-bold text-[#23191A]">
                Published Examination Transcripts (BISE Quetta Format)
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                Read-Only Transcript Archive
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#E6D6B8]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F0E5] text-[#540B12] border-b border-[#E6D6B8]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Examination</th>
                    <th className="py-3 px-4 font-semibold">Roll No & Cadet</th>
                    <th className="py-3 px-4 font-semibold">Program</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6D6B8] bg-white">
                  {data.publishedResultsPreview.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FFFDF8]">
                      <td className="py-3 px-4 font-mono-tabular text-xs text-[#71676A]">
                        {row.exam_date}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#23191A]">{row.exam_name}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono-tabular font-bold text-[#720F19]">
                          {row.roll_no}
                        </span>{' '}
                        · {row.cadet_name}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#71676A]">{row.program_group}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setQuery(row.roll_no);
                            handleSearch(undefined, row.roll_no);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#720F19] hover:bg-[#8D1722] text-[#FFFDF8] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Result</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Printable Official Report Card Modal */}
      {selectedReportCard && (
        <PrintableReportCardModal
          result={selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
        />
      )}
    </div>
  );

  function setSearchQueryOrRoll(val: string) {
    setQuery(val);
  }
};

export const PrintableReportCardModal: React.FC<{
  result: ExamResultSummaryRecord;
  onClose: () => void;
}> = ({ result, onClose }) => {
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const handlePrintOrSaveTranscriptPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setDrawColor(84, 11, 18);
      doc.setLineWidth(1.2);
      doc.rect(10, 10, 190, 277);

      doc.setFillColor(84, 11, 18);
      doc.rect(12, 12, 186, 22, 'F');
      doc.setTextColor(255, 253, 248);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('BALOCHISTAN RESIDENTIAL COLLEGE ZHOB', 105, 21, { align: 'center' });
      doc.setFontSize(9.5);
      doc.text(`OFFICIAL EXAMINATION REPORT CARD — ${String(result.exam_name || '').toUpperCase()}`, 105, 28, {
        align: 'center',
      });

      doc.setTextColor(35, 25, 26);
      doc.setFontSize(9);
      doc.text(`Cadet Name: ${result.cadet_name}`, 16, 44);
      doc.text(`Father's Name: ${result.father_name}`, 110, 44);
      doc.text(`Roll No / Adm No: ${result.roll_no} / ${result.admission_no}`, 16, 51);
      doc.text(`Class & Program: ${result.class_name} (${result.program_group})`, 110, 51);
      doc.text(
        `Result Status: ${result.result_status} — ${result.percentage}% (Grade ${result.grade_letter})`,
        16,
        58
      );
      doc.text(`Ref Token: ${result.public_token}`, 110, 58);

      let y = 68;
      doc.setFillColor(84, 11, 18);
      doc.rect(16, y, 178, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text('Code', 19, y + 5.5);
      doc.text('Subject', 42, y + 5.5);
      doc.text('Max', 125, y + 5.5);
      doc.text('Obtained', 148, y + 5.5);
      doc.text('Grade', 175, y + 5.5);

      y += 8;
      doc.setTextColor(35, 25, 26);
      doc.setFont('helvetica', 'normal');
      (result.subject_marks || []).forEach((sub) => {
        doc.rect(16, y, 178, 7.5);
        doc.text(String(sub.subject_code || '-'), 19, y + 5);
        doc.text(String(sub.subject_name || '-'), 42, y + 5);
        doc.text(String(sub.max_marks ?? 100), 125, y + 5);
        doc.text(String(sub.marks_obtained ?? 0), 148, y + 5);
        doc.text(String(sub.grade || 'A'), 175, y + 5);
        y += 7.5;
      });

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Total Marks: ${result.total_obtained_marks} / ${result.total_max_marks} (${result.percentage}%)`,
        16,
        y
      );

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BRC_Zhob_Transcript_${result.roll_no || 'Cadet'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDownloadStatus(`Downloaded BRC_Zhob_Transcript_${result.roll_no || 'Cadet'}.pdf`);
      setTimeout(() => setDownloadStatus(null), 5000);
    } catch {
      try {
        window.print();
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border-2 border-[#540B12] overflow-hidden shadow-2xl my-8">
        <div className="bg-[#540B12] text-[#FFFDF8] px-6 py-4 flex items-center justify-between no-print">
          <span className="font-editorial font-bold text-base">
            Official BRC Zhob Transcript / Report Card
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrSaveTranscriptPdf}
              className="px-3 py-1.5 rounded-lg bg-[#D5A83D] text-[#23191A] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#720F19] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {downloadStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-emerald-900 text-xs font-bold flex items-center justify-between no-print">
            <span>{downloadStatus}</span>
            <button
              type="button"
              onClick={() => setDownloadStatus(null)}
              className="text-emerald-700 hover:underline text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6 text-[#23191A]">
          {/* Official Header */}
          <div className="flex items-center justify-between border-b-2 border-[#540B12] pb-4">
            <div className="flex items-center gap-4">
              <img
                src={BRC_LOGO_URL}
                alt="BRC Zhob Crest"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full border-2 border-[#D5A83D]"
              />
              <div>
                <h2 className="font-editorial text-xl font-bold text-[#540B12]">
                  BALOCHISTAN RESIDENTIAL COLLEGE ZHOB
                </h2>
                <div className="text-xs font-semibold text-[#71676A]">
                  OFFICIAL EXAMINATION REPORT CARD — {result.exam_name.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="text-right font-mono-tabular text-xs">
              <div className="font-bold text-[#720F19]">Ref: {result.public_token}</div>
              <div className="text-[#71676A]">Session: {result.academic_year}</div>
            </div>
          </div>

          {/* Candidate Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] text-xs">
            <div>
              <span className="text-[#71676A] block">Cadet Name:</span>
              <span className="font-bold text-[#23191A]">{result.cadet_name}</span>
            </div>
            <div>
              <span className="text-[#71676A] block">Father's Name:</span>
              <span className="font-semibold text-[#23191A]">{result.father_name}</span>
            </div>
            <div>
              <span className="text-[#71676A] block">Roll No / Admission No:</span>
              <span className="font-mono-tabular font-bold text-[#720F19]">
                {result.roll_no} / {result.admission_no}
              </span>
            </div>
            <div>
              <span className="text-[#71676A] block">Class & Section:</span>
              <span className="font-semibold text-[#23191A]">{result.class_name}</span>
            </div>
            <div>
              <span className="text-[#71676A] block">Program Group:</span>
              <span className="font-semibold text-[#23191A]">{result.program_group}</span>
            </div>
            <div>
              <span className="text-[#71676A] block">Overall Status:</span>
              <span className="font-bold text-[#247A50]">
                {result.result_status} (Grade {result.grade_letter})
              </span>
            </div>
          </div>

          {/* Subject Marks Breakdown */}
          <table className="w-full text-left text-xs border border-[#E6D6B8]">
            <thead className="bg-[#540B12] text-[#FFFDF8]">
              <tr>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-right">Max Marks</th>
                <th className="py-2.5 px-3 text-right">Obtained</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3">Instructor Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6D6B8]">
              {result.subject_marks.map((sm, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 font-mono-tabular">{sm.subject_code}</td>
                  <td className="py-2.5 px-3 font-semibold">{sm.subject_name}</td>
                  <td className="py-2.5 px-3 text-right font-mono-tabular">{sm.max_marks}</td>
                  <td className="py-2.5 px-3 text-right font-mono-tabular font-bold">
                    {sm.marks_obtained}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-[#720F19]">{sm.grade}</td>
                  <td className="py-2.5 px-3 text-[#71676A]">{sm.teacher_remark}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F7F0E5] font-bold border-t-2 border-[#540B12]">
              <tr>
                <td colSpan={2} className="py-3 px-3">
                  AGGREGATE TOTAL & PERCENTAGE
                </td>
                <td className="py-3 px-3 text-right font-mono-tabular">{result.total_max_marks}</td>
                <td className="py-3 px-3 text-right font-mono-tabular text-[#720F19]">
                  {result.total_obtained_marks}
                </td>
                <td className="py-3 px-3 text-center font-mono-tabular">
                  {result.percentage}% ({result.grade_letter})
                </td>
                <td className="py-3 px-3 font-mono-tabular">GPA: {result.gpa} / 4.0</td>
              </tr>
            </tfoot>
          </table>

          <div className="pt-4 flex items-center justify-between text-xs text-[#71676A] border-t border-[#E6D6B8]">
            <div>Published Date: {result.published_at || result.exam_date}</div>
            <div>Controller of Examinations — BRC Zhob</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 12. APPROVED GALLERY (/gallery) — High-Contrast Dual-Layer Sync
// ============================================================================
interface GalleryDisplayItem {
  id: string;
  image_path: string;
  title: string;
  caption?: string;
  category: string;
  is_featured?: boolean;
}

export const GalleryPage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ data, navigate }) => {
  const [catFilter, setCatFilter] = useState('All');
  const [searchQ, setSearchQ] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryDisplayItem | null>(null);

  // Safe Hydration & Rule of Non-Destruction: check live CMS store first
  const [photos, setPhotos] = useState<GalleryDisplayItem[]>(() => {
    try {
      const live = getLiveCmsData();
      if (live?.gallery) {
        return live.gallery
          .filter((g) => !isRemovedMockupUrl(g.url))
          .map((g) => ({
            id: g.id,
            image_path: g.url,
            title: g.title,
            caption: g.title,
            category: g.category,
            is_featured: g.isFeatured,
          }));
      }
    } catch {}
    return [];
  });

  // Zero-latency cross-component synchronization on CMS_UPDATE_EVENT and brc_gallery_updated
  React.useEffect(() => {
    const handleGalleryUpdate = () => {
      try {
        const live = getLiveCmsData();
        setPhotos(
          live?.gallery
            ? live.gallery
                .filter((g) => !isRemovedMockupUrl(g.url))
                .map((g) => ({
                  id: g.id,
                  image_path: g.url,
                  title: g.title,
                  caption: g.title,
                  category: g.category,
                  is_featured: g.isFeatured,
                }))
            : []
        );
      } catch {}
    };
    window.addEventListener('brc_gallery_updated', handleGalleryUpdate);
    window.addEventListener(CMS_UPDATE_EVENT, handleGalleryUpdate);
    return () => {
      window.removeEventListener('brc_gallery_updated', handleGalleryUpdate);
      window.removeEventListener(CMS_UPDATE_EVENT, handleGalleryUpdate);
    };
  }, []);

  const categories = ['All', 'Campus Architecture', 'Laboratories', 'Hostel Life', 'Sports & Drill'];
  const filtered = photos.filter((photo) => {
    const matchesCat = catFilter === 'All' || photo.category === catFilter;
    const matchesQ =
      !searchQ ||
      photo.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      (photo.caption && photo.caption.toLowerCase().includes(searchQ.toLowerCase()));
    return matchesCat && matchesQ;
  });

  return (
    <div className="bg-[#FFFDF9] min-h-screen">
      <HeroBanner
        title="Campus Gallery"
        subtitle="Our Campus  |  Our Cadets  |  Our Moments"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Gallery' }]}
        navigate={navigate}
        quoteText="“Capturing Moments, Inspiring Discipline & Excellence”"
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar
          currentPath="/gallery"
          navigate={navigate}
          quote="“A picture is worth a thousand words — our campus reflects our high standards.”"
        />

        <main className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#7A1C24]">
                ARCHIVES & LIFE AT BRC ZHOB
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0F172A] mt-0.5">
                Institutional Photo Gallery
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Explore campus architecture, rigorous military drill, science laboratories, and cadet achievements.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search photo titles or keywords..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#7A1C24] transition-all"
              />
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  catFilter === cat
                    ? 'bg-[#7A1C24] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Photos Grid */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No photos found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg hover:border-[#7A1C24] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    <img
                      src={photo.image_path}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#7A1C24]/90 text-white backdrop-blur-xs">
                        {photo.category}
                      </span>
                    </div>
                    {photo.is_featured && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-amber-950 shadow-xs">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <h4 className="font-editorial font-bold text-base text-[#0F172A] group-hover:text-[#7A1C24] transition-colors line-clamp-1">
                        {photo.title}
                      </h4>
                      {photo.caption && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#7A1C24] font-semibold">
                      <span>Click to enlarge</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="font-editorial text-base font-bold text-[#0F172A] pb-2 border-b border-slate-100">
              Gallery Overview
            </h3>
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Live Active Photos</span>
                <span className="font-mono font-bold text-[#7A1C24]">{photos.length} Photos</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Categories</span>
                <span className="font-mono font-bold text-slate-700">6 Sections</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Sync Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Live Sync
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#7A1C24] to-[#4A0E17] text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="font-editorial text-base font-bold text-amber-300">
              Campus Media Department
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Official photos and archives of cadet activities, academic symposiums, and sports championships are curated by the Public Relations & Media Office.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Contact Media Office
            </button>
          </div>
        </aside>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#7A1C24] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-amber-950">
                  {lightboxPhoto.category}
                </span>
                <h3 className="font-editorial text-lg font-bold">{lightboxPhoto.title}</h3>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-[60vh]">
                <img
                  src={lightboxPhoto.image_path}
                  alt={lightboxPhoto.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>
              {lightboxPhoto.caption && (
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {lightboxPhoto.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// NOTICES & CIRCULARS (/notices & /notices/:slug) + CONTACT US (/contact)
// ============================================================================
export const NoticesPage: React.FC<{
  data: PublicBootstrapData;
  currentPath: string;
  navigate: (path: string) => void;
}> = ({ data, currentPath, navigate }) => {
  const [catFilter, setCatFilter] = useState('ALL');
  const slug = currentPath.startsWith('/notices/') ? currentPath.replace('/notices/', '') : null;
  const activeNotice = slug ? data.publicNotices.find((n) => n.slug === slug) : null;

  const filtered = data.publicNotices.filter(
    (n) => catFilter === 'ALL' || n.category === catFilter
  );

  return (
    <div>
      <HeroBanner
        title="Notices & Announcements"
        subtitle="Official Circulars  |  Examination Schedules  |  Admissions Updates"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Notices', path: '/notices' },
          ...(activeNotice ? [{ label: activeNotice.title }] : []),
        ]}
        navigate={navigate}
      />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar currentPath="/notices" navigate={navigate} />

        <main className="flex-1 brc-glass-cream rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {activeNotice ? (
            <div className="space-y-4">
              <button
                onClick={() => navigate('/notices')}
                className="text-xs font-semibold text-[#720F19] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to All Notices</span>
              </button>
              <div className="text-xs text-[#71676A] font-mono-tabular">
                Published: {activeNotice.publish_at} · Category: {activeNotice.category}
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                {activeNotice.title}
              </h2>
              <p className="text-sm text-[#23191A] leading-relaxed whitespace-pre-line">
                {activeNotice.body}
              </p>
              {activeNotice.attachment_name && (
                <div className="p-4 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#23191A]">
                    Attachment: {activeNotice.attachment_name}
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-[#720F19] text-[#FFFDF8] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print / Save Circular</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
                  Official Notices & Circulars
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {['ALL', 'Examinations', 'Admissions', 'Academic', 'Holiday'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCatFilter(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        catFilter === c
                          ? 'bg-[#720F19] text-[#FFFDF8]'
                          : 'bg-[#F7F0E5] text-[#23191A]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className="p-5 rounded-xl bg-[#F7F0E5] border border-[#E6D6B8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs text-[#71676A] font-mono-tabular">
                        {n.publish_at} · {n.category}
                        {n.is_urgent ? ' · URGENT' : ''}
                      </div>
                      <h3 className="font-editorial text-lg font-bold text-[#23191A] mt-1">
                        {n.title}
                      </h3>
                      <p className="text-xs text-[#71676A] mt-1 line-clamp-2">{n.body}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/notices/${n.slug}`)}
                      className="px-4 py-2 rounded-lg bg-[#720F19] text-[#FFFDF8] text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      Read Notice →
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export const ContactPage: React.FC<{
  data: PublicBootstrapData;
  navigate: (path: string) => void;
}> = ({ data, navigate }) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch('/api/public/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_name: senderName,
        sender_email: senderEmail,
        sender_phone: senderPhone,
        subject,
        message,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: json.error || 'Failed to submit inquiry.' });
    } else {
      setFeedback({ type: 'ok', text: json.message });
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div>
      <HeroBanner
        title="Contact Us"
        subtitle="Admissions Office  |  Administration  |  Hostel Inquiries"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Contact Us' }]}
        navigate={navigate}
      />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-6 items-start">
        <PublicSidebar currentPath="/contact" navigate={navigate} />

        <main className="flex-1 brc-glass-cream rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-editorial text-2xl font-bold text-[#23191A]">
            Send an Official Inquiry
          </h2>
          <p className="text-xs sm:text-sm text-[#71676A] mt-1">
            Messages submitted here are validated and saved directly to the BRC Zhob Administration
            database for review.
          </p>

          {feedback && (
            <div
              className={`mt-4 p-4 rounded-xl text-xs font-medium border ${
                feedback.type === 'ok'
                  ? 'bg-[#247A50]/10 border-[#247A50] text-[#247A50]'
                  : 'bg-[#B4232C]/10 border-[#B4232C] text-[#B4232C]'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#23191A] mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#23191A] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#23191A] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#23191A] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Admissions / Fee Verification / Academic Query"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#23191A] mb-1">Message *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your detailed inquiry..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E6D6B8] text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-[#720F19] hover:bg-[#8D1722] text-[#FFFDF8] font-bold text-xs sm:text-sm cursor-pointer"
            >
              Submit Inquiry to Administration
            </button>
          </form>
        </main>

        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="brc-glass-cream rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-editorial text-base font-bold text-[#23191A] pb-2 border-b border-[#E6D6B8]">
              Campus Contact Details
            </h3>
            <div>
              <span className="text-[#71676A] block">Address:</span>
              <span className="font-semibold text-[#23191A]">
                {data.siteSettings.contact_address}
              </span>
            </div>
            <div>
              <span className="text-[#71676A] block">Telephone:</span>
              <span className="font-mono-tabular font-semibold text-[#23191A]">
                {data.siteSettings.contact_phone}
              </span>
            </div>
            <div>
              <span className="text-[#71676A] block">Official Email:</span>
              <span className="font-semibold text-[#720F19]">
                {data.siteSettings.contact_email}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export const PolicyPage: React.FC<{
  type: 'privacy' | 'terms';
  navigate: (path: string) => void;
}> = ({ type, navigate }) => {
  return (
    <div>
      <HeroBanner
        title={type === 'privacy' ? 'Privacy & Data Protection Policy' : 'Terms of Use & Code of Conduct'}
        subtitle="Institutional Data Minimization  |  Role-Based Access Control"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: type === 'privacy' ? 'Privacy Policy' : 'Terms & Conduct' },
        ]}
        navigate={navigate}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="brc-glass-cream rounded-2xl p-6 sm:p-8 space-y-4 text-sm text-[#23191A] leading-relaxed">
          <h2 className="font-editorial text-2xl font-bold text-[#540B12]">
            {type === 'privacy'
              ? 'BRC Zhob Student, Applicant & Alumni Data Privacy'
              : 'BRC Zhob Portal Terms & Alumni Code of Conduct'}
          </h2>
          <p>
            1. <strong>Private Record Protection:</strong> All candidate CNIC numbers, Dates of
            Birth, residential addresses, guardian contact numbers, bank deposit slips, hostel
            allocations, and unpublished academic marks are strictly confidential and never exposed
            in public directories.
          </p>
          <p>
            2. <strong>Server-Side Authorization:</strong> Every private portal request verifies
            authenticated session status, database role, granular permissions, and parent-child or
            teacher-class ownership constraints.
          </p>
          <p>
            3. <strong>Manual Financial Verification:</strong> Uploading a bank deposit slip sets
            the payment status to <code>PENDING_VERIFICATION</code>. Only an authorized Finance
            Administrator can verify payment against official bank records.
          </p>
        </div>
      </div>
    </div>
  );
};
