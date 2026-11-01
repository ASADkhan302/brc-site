export type RoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'CADET' | 'PARENT' | 'ALUMNI';

export interface UserRecord {
  id: number;
  role_code: RoleCode;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED' | 'LOCKED';
  must_change_password: boolean;
  is_demo: boolean;
  last_login_at: string | null;
  avatar_url?: string;
}

export interface DepartmentRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  head_name: string;
  staff_count: number;
}

export interface StaffProfileRecord {
  id: number;
  user_id: number;
  employee_code: string;
  slug: string;
  full_name: string;
  department_id: number;
  department_name: string;
  designation: string;
  staff_type: 'TEACHING' | 'ADMINISTRATIVE' | 'SUPPORT';
  qualification: string;
  experience_years: string;
  email: string;
  phone: string;
  photo_path: string;
  bio: string;
  assigned_classes: string[];
  is_public: boolean;
  is_demo: boolean;
}

export interface CadetRecord {
  id: number;
  user_id: number | null;
  admission_no: string;
  roll_no: string;
  kit_no: string;
  full_name: string;
  father_name: string;
  gender: 'BOY' | 'GIRL';
  date_of_birth: string;
  class_name: string;
  section_name: string;
  program_group: string;
  academic_year: string;
  house_wing: 'Jinnah' | 'Iqbal' | 'Liaquat' | 'Fatima';
  hostel_block: string;
  room_no: string;
  attendance_percent: number;
  cgpa: number;
  conduct_grade: string;
  fee_status: 'PAID' | 'UNPAID' | 'PENDING_VERIFICATION' | 'OVERDUE';
  status: 'ACTIVE' | 'ALUMNI' | 'WITHDRAWN' | 'SUSPENDED';
  guardian_ids: number[];
  is_demo: boolean;
}

export interface GuardianRecord {
  id: number;
  user_id: number;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  cnic: string;
  address: string;
  linked_cadet_ids: number[];
  verified: boolean;
}

export interface TimetableEntryRecord {
  id: number;
  class_name: string;
  section_name: string;
  subject_name: string;
  subject_code: string;
  teacher_id: number;
  teacher_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_label: string;
  topic: string;
  status: 'ONGOING' | 'UPCOMING' | 'COMPLETED';
}

export interface AttendanceSessionRecord {
  id: number;
  class_name: string;
  section_name: string;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  attendance_date: string;
  session_label: string;
  status: 'DRAFT' | 'SUBMITTED' | 'LOCKED';
  records: {
    cadet_id: number;
    cadet_name: string;
    roll_no: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
    remark: string;
  }[];
}

export interface AssignmentRecord {
  id: number;
  teacher_id: number;
  teacher_name: string;
  class_name: string;
  section_name: string;
  subject_name: string;
  title: string;
  description: string;
  due_at: string;
  max_marks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  submissions: {
    id: number;
    cadet_id: number;
    cadet_name: string;
    roll_no: string;
    submission_text: string;
    file_name: string | null;
    submitted_at: string;
    marks_awarded: number | null;
    feedback: string | null;
    status: 'SUBMITTED' | 'GRADED' | 'PENDING_REVIEW';
  }[];
}

export interface ExamDutyRecord {
  id: number;
  exam_id: number;
  exam_name: string;
  staff_id: number;
  staff_name: string;
  subject_name: string;
  hall_name: string;
  duty_date: string;
  duty_time: string;
  capacity: number;
  status: 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED';
}

export interface SubjectMarkItem {
  subject_code: string;
  subject_name: string;
  max_marks: number;
  passing_marks: number;
  marks_obtained: number;
  grade: string;
  teacher_remark: string;
}

export interface ExamResultSummaryRecord {
  id: number;
  public_token: string;
  exam_id: number;
  exam_name: string;
  exam_type: 'MATRIC' | 'INTERMEDIATE' | 'ANNUAL' | 'SUPPLEMENTARY' | 'SEMESTER';
  exam_date: string;
  academic_year: string;
  cadet_id: number;
  cadet_name: string;
  father_name: string;
  roll_no: string;
  admission_no: string;
  class_name: string;
  program_group: string;
  subject_marks: SubjectMarkItem[];
  total_max_marks: number;
  total_obtained_marks: number;
  percentage: number;
  grade_letter: string;
  gpa: number;
  result_status: 'PASS' | 'PROMOTED' | 'FAIL';
  is_published: boolean;
  published_at: string | null;
}

export interface HostelBlockRecord {
  id: number;
  name: string;
  gender_policy: 'BOYS' | 'GIRLS';
  warden_name: string;
  warden_phone: string;
  total_rooms: number;
  total_capacity: number;
  occupied_beds: number;
  facilities: string[];
  description: string;
  rooms: {
    id: number;
    room_no: string;
    floor: string;
    capacity: number;
    occupied: number;
    occupant_names: string[];
    status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  }[];
}

export interface WardenRemarkRecord {
  id: number;
  cadet_id: number;
  cadet_name: string;
  staff_id: number;
  warden_name: string;
  conduct_rating: string;
  remark: string;
  visibility: 'ADMIN_ONLY' | 'PARENT_AND_ADMIN' | 'CADET_PARENT_ADMIN';
  created_at: string;
}

export interface FeeInvoiceRecord {
  id: number;
  invoice_no: string;
  cadet_id: number;
  cadet_name: string;
  roll_no: string;
  class_name: string;
  billing_title: string;
  issue_date: string;
  due_date: string;
  items: { label: string; amount: number }[];
  total_amount: number;
  status: 'PAID' | 'UNPAID' | 'PENDING_VERIFICATION' | 'OVERDUE';
  payment?: {
    id: number;
    method: 'BANK_DEPOSIT' | 'CASH';
    reference_no: string;
    bank_name_branch: string;
    deposit_date: string;
    amount: number;
    slip_filename: string;
    status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
    verified_by_name: string | null;
    verified_at: string | null;
    verification_note: string | null;
  };
}

export interface AdmissionApplicationRecord {
  id: number;
  application_ref: string;
  tracking_token: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  // Step 1: Personal Info (Configurable)
  candidate_name: string;
  cnic_or_bform: string;
  gender: 'BOY' | 'GIRL';
  date_of_birth: string;
  domicile_district: string;
  // Step 2: Academic Info (Exact Source Screenshot Fields)
  name_as_per_school_record: string;
  father_name_as_per_school_record: string;
  class_studying: string;
  medium_of_instruction: string;
  dob_school_figures: string;
  dob_words: string;
  previous_exam_percentage: number;
  expected_exam_class: string;
  expected_exam_min_percent: number;
  current_school_name: string;
  // Step 3: Contact / Guardian Info (Configurable)
  guardian_name: string;
  guardian_relationship: string;
  guardian_cnic: string;
  guardian_phone: string;
  guardian_email: string;
  postal_address: string;
  // Step 4: Fee Payment Details (Exact Source Screenshot Fields)
  fee_details: {
    deposit_slip_no: string;
    deposit_date: string;
    bank_name_branch: string;
    account_no: string;
    amount_pkr: number;
    slip_filename: string;
    slip_mime_type: string;
    slip_size_bytes: number;
    verification_status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
    verified_by_name: string | null;
    verified_at: string | null;
    verification_note: string | null;
  };
  converted_cadet_id: number | null;
  submitted_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  status_history: {
    status: string;
    actor: string;
    note: string;
    timestamp: string;
  }[];
  is_demo: boolean;
}

export interface AlumniProfileRecord {
  id: number;
  full_name: string;
  kit_no: string;
  entry_no: number;
  wing: 'Jinnah' | 'Iqbal' | 'Liaquat' | 'Fatima';
  passing_year: number;
  date_of_birth: string;
  cnic: string;
  phone: string;
  email: string;
  current_city: string;
  current_designation: string;
  organization: string;
  address: string;
  profession: 'Doctor' | 'Engineer' | 'Teacher' | 'Army' | 'Police' | 'Business' | 'Other';
  organization_name: string;
  linkedin_url: string;
  post_brc_institution: string;
  about_me: string;
  photo_path: string;
  contributions: string[];
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  public_directory_opt_in: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface NoticeRecord {
  id: number;
  title: string;
  slug: string;
  body: string;
  category: 'Academic' | 'Admissions' | 'Examinations' | 'Hostel' | 'Holiday' | 'General';
  audience: 'PUBLIC' | 'STAFF' | 'CADETS' | 'PARENTS' | 'ALL_AUTHENTICATED';
  is_urgent: boolean;
  publish_at: string;
  expires_at: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  attachment_name: string | null;
}

export interface GalleryAlbumRecord {
  id: number;
  title: string;
  slug: string;
  category: 'Campus' | 'Classrooms' | 'Laboratories' | 'Hostels' | 'Sports' | 'Events' | string;
  description: string;
  cover_image_path: string;
  photo_count: number;
  is_published: boolean;
  published_at: string;
  images: {
    id: number;
    image_path: string;
    caption: string;
    alt_text: string;
    category?: string;
    featured_on_home?: boolean;
  }[];
}

export interface LeaveApplicationRecord {
  id: number;
  cadet_id: number;
  cadet_name: string;
  roll_no: string;
  submitted_by_name: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by_name: string | null;
  review_note: string | null;
  created_at: string;
}

export interface MessageRecord {
  id: number;
  sender_user_id: number;
  sender_name: string;
  sender_role: string;
  recipient_user_id: number;
  recipient_name: string;
  cadet_id: number | null;
  cadet_name: string | null;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ContactMessageRecord {
  id: number;
  sender_name: string;
  sender_email: string;
  sender_phone: string;
  subject: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  created_at: string;
}

export interface AuditLogRecord {
  id: number;
  actor_user_id: number | null;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  timestamp: string;
}

export interface BackupRecord {
  id: number;
  filename: string;
  size_kb: number;
  checksum: string;
  created_by_name: string;
  status: 'COMPLETED' | 'RESTORE_VERIFIED';
  created_at: string;
}

export interface PillarRecord {
  number: string;
  title: string;
  desc: string;
}

export interface CadetWingConfig {
  id: string;
  name: string;
  color_code: string;
  badge_color: string;
  warden: string;
  capacity: number;
  motto: string;
  description: string;
}

export interface GalleryPhotoItem {
  id: number;
  image_path: string;
  caption: string;
  alt_text: string;
  category?: string;
  featured_on_home?: boolean;
}

export interface SiteSettingsRecord {
  college_name: string;
  short_name: string;
  established_year: string;
  motto: string;
  tagline: string;

  // Principal Profile & Leadership
  principal_name: string;
  principal_title: string;
  principal_qualification: string;
  principal_experience: string;
  principal_email: string;
  principal_photo_url: string;
  principal_tenure_badge: string;
  principal_message_short: string;
  principal_message_full: string;
  principal_vision_quote: string;
  principal_pillars: PillarRecord[];

  // Top Notice Ribbon & Hero Section
  notice_ribbon_text: string;
  notice_ribbon_date: string;
  notice_ribbon_urgent: boolean;
  notice_ribbon_link: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_next_exam_text: string;
  stat_cadets: string;
  stat_pass_rate: string;
  stat_faculty: string;
  stat_hostel_blocks: string;

  // Four Cadet Wings
  wings: CadetWingConfig[];

  // Fee & Bank Challan
  bank_account_title: string;
  admission_bank_name: string;
  admission_branch_code: string;
  admission_account_no: string;
  admission_fee_pkr: number;
  bank_name_branch?: string;
  bank_account_no?: string;
  admission_fee_amount?: number;
  principal_quote?: string;
  principal_message?: string;
  announcement_banner_text?: string;
  hero_headline?: string;
  hero_subheadline?: string;
  metric_cadets?: string;
  metric_teachers?: string;
  metric_board_pass?: string;
  metric_hostel_blocks?: string;
  admission_deadline: string;
  dob_warning_text: string;
  fee_warning_text: string;

  // Contact Info
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  contact_timing: string;

  configurable_personal_fields: { key: string; label: string; required: boolean; confirmed_by_brc: boolean }[];
  configurable_contact_fields: { key: string; label: string; required: boolean; confirmed_by_brc: boolean }[];
  is_demo_notice_visible: boolean;
}

export interface DatabaseState {
  users: UserRecord[];
  departments: DepartmentRecord[];
  staff_profiles: StaffProfileRecord[];
  cadets: CadetRecord[];
  guardians: GuardianRecord[];
  timetable_entries: TimetableEntryRecord[];
  attendance_sessions: AttendanceSessionRecord[];
  assignments: AssignmentRecord[];
  exam_duties: ExamDutyRecord[];
  exam_results: ExamResultSummaryRecord[];
  hostel_blocks: HostelBlockRecord[];
  warden_remarks: WardenRemarkRecord[];
  fee_invoices: FeeInvoiceRecord[];
  admission_applications: AdmissionApplicationRecord[];
  alumni_profiles: AlumniProfileRecord[];
  notices: NoticeRecord[];
  gallery_albums: GalleryAlbumRecord[];
  leave_applications: LeaveApplicationRecord[];
  messages: MessageRecord[];
  contact_messages: ContactMessageRecord[];
  audit_logs: AuditLogRecord[];
  backups: BackupRecord[];
  site_settings: SiteSettingsRecord;
}
