// src/utils/cmsStore.ts
export const CMS_STORAGE_KEY = 'brc_zhob_master_cms_v2';
export const ADMISSIONS_STORAGE_KEY = 'brc_admissions_store_v2';
export const ALUMNI_STORAGE_KEY = 'brc_alumni_store_v2';
export const CMS_UPDATE_EVENT = 'brc_cms_data_updated';

export interface GalleryPhoto {
  id: string;
  url: string;
  title: string;
  category: string;
  isFeatured: boolean;
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  qualification: string;
  classes: string;
  photoUrl?: string;
}

export interface CmsData {
  principal: {
    photoUrl: string;
    name: string;
    title: string;
    badge: string;
    quote: string;
    welcomeMessage: string;
    pillars: Array<{ id: string; title: string; desc: string }>;
  };
  siteMetrics: {
    topNotice: string;
    topNoticePhone: string;
    heroHeadline: string;
    heroSubheadline: string;
    cadetCount: string;
    passRate: string;
    facultyCount: string;
    hostelBlocks: string;
  };
  banking: {
    bankName: string;
    accountNumber: string;
    accountTitle: string;
    feePkr: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
  };
  gallery: GalleryPhoto[];
  faculty: FacultyMember[];
}

const CMS_BASE_PREFIX = '.';

export const DEFAULT_CMS_DATA: CmsData = {
  principal: {
    photoUrl: `${CMS_BASE_PREFIX}/assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg`,
    name: 'Dr. Muhammad Hassan',
    title: 'Principal & Controller of Examinations',
    badge: '18+ Years Leadership',
    quote: 'It is an honour to lead Balochistan Residential College Zhob, an institution founded in 2016 committed to shaping character, discipline, and academic brilliance. Our cadets are trained to become future leaders who serve Pakistan with knowledge, integrity, and devotion.',
    welcomeMessage: 'Here in Zhob, beneath the rugged Sulaiman mountain ranges, we provide an intellectually vibrant and morally upright residential environment. With disciplined daily routines, physical drill, high-standard science laboratories, and individual mentorship, we bridge opportunity gaps for the talented youth of northern Balochistan.',
    pillars: [
      { id: '01', title: 'Moral Character', desc: 'Instilling unwavering integrity, truthfulness, and patriotic devotion in every cadet.' },
      { id: '02', title: 'Academic Rigor', desc: 'Daily supervised preps, modern laboratories, and FBISE gold-medalist instruction.' },
      { id: '03', title: 'Physical Stamina', desc: 'Rigorous morning PT, obstacle courses, sports leagues, and military prep.' }
    ]
  },
  siteMetrics: {
    topNotice: 'Admissions Open for Class 8th & 1st Year (Session 2026–2027) — Entry Test on 20 Oct 2026',
    topNoticePhone: '+92 824 912345',
    heroHeadline: "Nurturing Tomorrow's Leaders with Discipline & Academic Brilliance",
    heroSubheadline: 'Balochistan Residential College Zhob prepares young cadets for military commissioning, higher civil services, and distinguished careers through rigorous academics, physical training, and character formation.',
    cadetCount: '850+',
    passRate: '98.4%',
    facultyCount: '42',
    hostelBlocks: '03'
  },
  banking: {
    bankName: 'National Bank of Pakistan, Zhob Branch',
    accountNumber: '0042-3019284756',
    accountTitle: 'BRC Zhob Admission Fund',
    feePkr: '2500'
  },
  contact: {
    address: 'College Road, Balochistan Residential College Zhob, Balochistan, Pakistan',
    phone: '+92 824 912345',
    email: 'info@brczhob.edu.pk'
  },
  gallery: [
    {
      id: 'gal-curated-1',
      url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
      title: 'Main Academic Block & Central Campus Quadrangle',
      category: 'Campus Architecture',
      isFeatured: true,
    },
    {
      id: 'gal-curated-2',
      url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
      title: 'Senior Science Wing — Physics & Chemistry Laboratories',
      category: 'Laboratories',
      isFeatured: true,
    },
    {
      id: 'gal-curated-3',
      url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
      title: 'Jinnah & Iqbal Residential Cadet Boarding Wings',
      category: 'Hostel Life',
      isFeatured: true,
    },
    {
      id: 'gal-curated-4',
      url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1200&q=80',
      title: 'Morning Physical Training & Athletics Ground',
      category: 'Sports & Drill',
      isFeatured: true,
    }
  ],
  faculty: [
    {
      id: 'f-1',
      name: 'Prof. Najaf Hussain',
      designation: 'Senior Professor of English',
      department: 'Languages & Humanities',
      qualification: 'M.Phil English Literature, B.Ed',
      classes: 'Class 10-A, Class 11-A (Pre-Eng)'
    },
    {
      id: 'f-2',
      name: 'Dr. Muhammad Asif',
      designation: 'Professor & Head of Mathematics',
      department: 'Mathematics',
      qualification: 'PhD Mathematics, Gold Medalist',
      classes: 'Class 11-A (Pre-Eng), Class 12-A'
    },
    {
      id: 'f-3',
      name: 'Prof. Zahid Khan',
      designation: 'Associate Professor of Physics',
      department: 'Natural Sciences',
      qualification: 'M.Sc Applied Physics, B.Ed',
      classes: 'Class 9-A, Class 10-B'
    },
    {
      id: 'f-4',
      name: 'Dr. Samina Kakar',
      designation: 'Assistant Professor of Chemistry',
      department: 'Natural Sciences',
      qualification: 'PhD Chemistry (Bio-Inorganic)',
      classes: 'Class 11-B (Pre-Med), Class 12-B'
    }
  ]
};

export function isRemovedMockupUrl(url?: string): boolean {
  if (!url) return true;
  const removedNames = [
    'BRC_Zhob__Excellence_Since_2016',
    'BRC_Zhob_Apply_Now_Portal',
    'BRC_Zhob_Maroon_Gold_Dashboard',
    'BRC_Approved_Designs',
    'BRC_Portal_Source_References',
    'BRC_Form_Source_References',
    'BRC_Zhob_Online_Admission_Form',
  ];
  return removedNames.some((name) => url.includes(name));
}

export function getLiveCmsData(): CmsData {
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleanedGallery = Array.isArray(parsed.gallery)
        ? parsed.gallery.filter((g: any) => !isRemovedMockupUrl(g?.url))
        : DEFAULT_CMS_DATA.gallery;
      const finalGallery =
        cleanedGallery.length === 0 && !parsed.galleryCustomized
          ? DEFAULT_CMS_DATA.gallery
          : cleanedGallery;
      if (Array.isArray(parsed.gallery) && finalGallery.length !== parsed.gallery.length) {
        parsed.gallery = finalGallery;
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(parsed));
        localStorage.setItem('brc_gallery_data', JSON.stringify(finalGallery));
        localStorage.setItem('brc_gallery_data_v1', JSON.stringify(finalGallery));
      }
      const mergedPrincipal = { ...DEFAULT_CMS_DATA.principal, ...(parsed.principal || {}) };
      if (mergedPrincipal.photoUrl && mergedPrincipal.photoUrl.startsWith('/assets/')) {
        mergedPrincipal.photoUrl = `.${mergedPrincipal.photoUrl}`;
      }
      return {
        ...DEFAULT_CMS_DATA,
        ...parsed,
        principal: mergedPrincipal,
        siteMetrics: { ...DEFAULT_CMS_DATA.siteMetrics, ...(parsed.siteMetrics || {}) },
        banking: { ...DEFAULT_CMS_DATA.banking, ...(parsed.banking || {}) },
        contact: { ...DEFAULT_CMS_DATA.contact, ...(parsed.contact || {}) },
        gallery: finalGallery,
        faculty: Array.isArray(parsed.faculty) && parsed.faculty.length > 0 ? parsed.faculty : DEFAULT_CMS_DATA.faculty,
      };
    }

    // Check v1 legacy fallback if v2 does not exist yet
    const legacyCms = localStorage.getItem('brc_cms_settings_v1');
    const legacyGallery = localStorage.getItem('brc_gallery_data');
    if (legacyCms || legacyGallery) {
      const merged: CmsData = { ...DEFAULT_CMS_DATA };
      if (legacyCms) {
        try {
          const leg = JSON.parse(legacyCms);
          if (leg.principal_photo_url && !isRemovedMockupUrl(leg.principal_photo_url)) {
            merged.principal.photoUrl = leg.principal_photo_url.startsWith('/assets/')
              ? `.${leg.principal_photo_url}`
              : leg.principal_photo_url;
          }
          if (leg.principal_name) merged.principal.name = leg.principal_name;
          if (leg.principal_vision_quote) merged.principal.quote = leg.principal_vision_quote;
          if (leg.notice_ribbon_text) merged.siteMetrics.topNotice = leg.notice_ribbon_text;
          if (leg.contact_phone) merged.siteMetrics.topNoticePhone = leg.contact_phone;
          if (leg.stat_cadets) merged.siteMetrics.cadetCount = leg.stat_cadets;
          if (leg.stat_pass_rate) merged.siteMetrics.passRate = leg.stat_pass_rate;
          if (leg.stat_faculty) merged.siteMetrics.facultyCount = leg.stat_faculty;
          if (leg.stat_hostel_blocks) merged.siteMetrics.hostelBlocks = leg.stat_hostel_blocks;
        } catch {}
      }
      if (legacyGallery) {
        try {
          const legG = JSON.parse(legacyGallery);
          if (Array.isArray(legG)) {
            const validG = legG
              .filter((item: any) => !isRemovedMockupUrl(item?.image_path || item?.url))
              .map((item: any) => ({
                id: item.id || `photo-${Date.now()}`,
                url: item.image_path || item.url,
                title: item.title || 'BRC Campus',
                category: item.category || 'Campus Architecture',
                isFeatured: !!item.is_featured,
              }));
            if (validG.length > 0) {
              merged.gallery = validG;
            }
          }
        } catch {}
      }
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }

    return DEFAULT_CMS_DATA;
  } catch {
    return DEFAULT_CMS_DATA;
  }
}

export function saveLiveCmsData(newData: CmsData): void {
  try {
    const payloadToStore = { ...newData, galleryCustomized: true };
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(payloadToStore));

    // Also sync to legacy keys for maximum backward compatibility
    localStorage.setItem('brc_cms_settings_v1', JSON.stringify({
      principal_photo_url: newData.principal.photoUrl,
      principal_name: newData.principal.name,
      principal_vision_quote: newData.principal.quote,
      notice_ribbon_text: newData.siteMetrics.topNotice,
      contact_phone: newData.siteMetrics.topNoticePhone,
      stat_cadets: newData.siteMetrics.cadetCount,
      stat_pass_rate: newData.siteMetrics.passRate,
      stat_faculty: newData.siteMetrics.facultyCount,
      stat_hostel_blocks: newData.siteMetrics.hostelBlocks,
    }));

    localStorage.setItem('brc_gallery_data', JSON.stringify(
      newData.gallery.map(g => ({
        id: g.id,
        image_path: g.url,
        title: g.title,
        caption: g.title,
        category: g.category,
        is_featured: g.isFeatured,
      }))
    ));

    // Dispatch both v2 and legacy custom events
    window.dispatchEvent(new Event(CMS_UPDATE_EVENT));
    window.dispatchEvent(new Event('brc_gallery_updated'));

    // Optional background sync to API
    fetch('./api/admin_cms.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save CMS data', e);
  }
}
