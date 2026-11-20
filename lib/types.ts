export type DepartmentType = '5-days' | '2-days';

export type KulliyahDivisionId =
  | 'kulliyah-tarbiyah-2days'
  | 'kulliyah-shariah-5days'
  | 'kulliyah-dawah-5days'
  | 'kulliyah-tarbiyah-5days';

export type ManagementScope =
  | 'all'
  | 'general-2days'
  | 'general-5days'
  | KulliyahDivisionId;

export type GradingPeriod = '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th';

export type SemesterType = '1st' | '2nd';

export type UserRole = 'admin' | 'mudir' | 'cashier' | 'teacher' | 'student' | 'ssg';

export interface UserSession {
  id: string;
  name: string;
  nameArabic?: string;
  role: UserRole;
  email: string;
  linkedId?: number;
  profilePic?: string;
  isSSG?: boolean;
  managementScope?: ManagementScope;
}

export interface ClassItem {
  ClassID: number;
  ClassName: string;
  Department: DepartmentType;
  Level: string; // e.g. "Ibtidaiyyah", "Mutawassit", "Thanawi", "Kulliyatu Shariah", etc.
  YearGrade: number; // 1 to 6
  AdviserID?: number; // TeacherID
}

export interface SubjectItem {
  SubjectID: number;
  ClassID: number;
  SubjectClass: string;
  SubjectCode?: string;
  SubjectArabic?: string;
  Semester?: '1st' | '2nd' | 'Both';
  IsNashat?: boolean; // Managed & graded by SSG Student Council
  BookDriveUrl?: string;
  BookTitle?: string;
  CustomColor?: string;
}

export interface SubjectEBookItem {
  id: string;
  SubjectID: number;
  ClassID: number;
  title: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  driveUrl?: string;
  hasLocalFile?: boolean;
  uploadedBy: string;
  uploadedByRole: UserRole;
  uploadedAt: string;
}

export interface TeacherItem {
  TeacherID: number;
  Name: string;
  NameArabic?: string;
  Gender?: string;
  Tribe?: string;
  Nationality?: string;
  BirthDate?: string;
  DOB?: string;
  BirthPlace?: string;
  Address?: string;
  MobileNumber?: string;
  Email?: string;
  Password?: string;
  IdNumber?: string;
  Degree?: string;
  AdmissionDate?: string;
  Remarks?: string;
  ProfilePic?: string;
  IsMudir?: boolean;
  ManagementScope?: ManagementScope;
  Role?: UserRole;
}

export interface StudentItem {
  StudentID: number;
  RollNo: string;
  Name: string;
  NameArabic?: string;
  Gender?: string;
  Tribe?: string;
  Nationality?: string;
  BirthDate?: string;
  DOB?: string;
  BirthPlace?: string;
  Address?: string;
  MobileNumber?: string;
  Email?: string;
  ClassID: number;
  IdNumber?: string;
  AdmissionDate?: string;
  Remarks?: string;
  ProfilePic?: string;
  Awards?: string[];
  IsSSG?: boolean;
  SSGPosition?: string;
  Password?: string;
  ProfileEditCount?: number;
}

export interface UserAccount {
  AccountID: string;
  Username: string;
  Email: string;
  Password: string;
  Role: UserRole;
  LinkedType: 'admin' | 'mudir' | 'cashier' | 'teacher' | 'student';
  LinkedID?: number;
  DisplayName: string;
  DisplayNameArabic?: string;
  IsActive: boolean;
  CreatedAt: string;
}

export interface SubjectTeacherItem {
  ID: number;
  ClassID: number;
  SubjectID: number;
  TeacherID: number;
}

export interface ClassScheduleItem {
  ID: number;
  ClassID: number;
  SubjectID: number;
  TeacherID: number;
  Day: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  StartTime: string;
  EndTime: string;
  Room: string;
  CustomColor?: string;
  Semester?: '1st' | '2nd' | 'Both';
  AcademicYear?: string;
}

export interface GradingCriteria {
  id: string;
  name: string;
  weight: number;
  isLocked?: boolean; // e.g., Tabulation Score (50%) cannot be removed or resized
}

export interface TaqdirScale {
  mumtazMin: number;       // e.g. 90 (90-100) -> ممتاز
  jayyidJiddanMin: number; // e.g. 80 (80-89) -> جيد جدا
  jayyidMin: number;       // e.g. 76 (76-79) -> جيد
  maqboolMin: number;      // e.g. 75 (75)    -> مقبول
  // below maqboolMin (<= 74) -> راسب
}

export interface StudentGradeItem {
  id: string;
  StudentID: number;
  ClassID: number;
  SubjectID: number;
  TeacherID: number;
  Period: GradingPeriod;
  AcademicYear?: string;
  Semester?: SemesterType;
  CriteriaScores: Record<string, number>;
  FinalGrade: number | 'INC' | 'DRP';
  GradedAt: string;
  IsLocked: boolean;
  UnlockRequested?: boolean;
  UnlockGranted?: boolean;
  SubmittedAt?: string;
  LockExpiresAt?: string;
  AllowedEditHours?: number;
}

export interface TeacherAttendanceItem {
  ID: number;
  TeacherID: number;
  Status: boolean;
  Date: string;
  EditedBy?: string;
  EditedAt?: string;
}

export interface StudentAttendanceItem {
  ID: number;
  ClassID: number;
  SubjectID: number;
  RollNo: string;
  Status: boolean;
  Date: string;
  AcademicYear?: string;
  Semester?: SemesterType;
  EditedBy?: string;
  EditedAt?: string;
}

export type EnrollmentStatus = 'Active' | 'Promoted' | 'Completed' | 'Transferred' | 'Dropped';

export interface StudentEnrollmentRecord {
  id: string;
  StudentID: number;
  AcademicYear: string;
  Semester: SemesterType;
  ClassID: number;
  RollNo: string;
  Status: EnrollmentStatus;
  EnrolledAt: string;
  PreviousAcademicYear?: string;
  PreviousClassID?: number;
  Remarks?: string;
}

export interface TuitionFeeSetting {
  ClassID: number;
  DawrAmount: Record<GradingPeriod, number>;
}

export interface DawrPaymentRecord {
  isPaid: boolean;
  amount: number;
  cashierName?: string;
  paidAt?: string;
  dayOfWeek?: string;
  balance?: number;
  note?: string;
}

export interface StudentPaymentLedger {
  id: string;
  StudentID: number;
  ClassID: number;
  AcademicYear?: string;
  EnrollmentTerm?: string;
  IsActive?: boolean;
  CreatedAt?: string;
  Payments: Record<GradingPeriod, DawrPaymentRecord>;
}

export interface TeacherPayrollItem {
  id: string;
  TeacherID: number;
  Month: string;
  BaseSalary: number;
  Bonus: number;
  Deductions: number;
  NetSalary: number;
  Status: 'Pending' | 'Paid';
  PaidAt?: string;
  CashierName?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: UserRole;
  targetAudience: 'all' | '5-days' | '2-days' | 'teachers' | 'students';
  createdAt: string;
}

export interface FormTemplateItem {
  id: string;
  title: string;
  description: string;
  fields: { label: string; type: string; required: boolean }[];
  createdAt: string;
}

export interface DawrDeadlineItem {
  period: GradingPeriod;
  deadlineIso: string; // e.g. "2026-10-25T23:59:00Z"
  instructions?: string;
  enforceLock?: boolean; // If true, locking is strictly enforced when deadline is reached
}

export interface SubjectUnlockOverride {
  key: string; // `${ClassID}-${SubjectID}-${Period}-${AcademicYear}`
  ClassID: number;
  SubjectID: number;
  Period: GradingPeriod;
  AcademicYear: string;
  TeacherID?: number;
  UnlockRequested?: boolean;
  UnlockGranted?: boolean;
  ManuallyLocked?: boolean;
  LockExpiresAt?: string;
  AllowedEditHours?: number;
  UpdatedAt: string;
}

export interface SystemSettings {
  schoolNameEn: string;
  schoolNameAr: string;
  systemName: string;
  gradeLockDays: number;
  gradeEditWindowHours?: number; // Allowed hours set by principal/admin for editing grades after submission
  activeGradingPeriod?: GradingPeriod; // Current active dawr (e.g. '1st')
  activeAcademicYear?: string; // Current active academic year (e.g. 'SY 2025-2026')
  activeSemester?: SemesterType; // Current active semester ('1st' | '2nd')
  availableAcademicYears?: string[]; // List of configured academic years
  gradeSubmissionDeadlines?: Partial<Record<GradingPeriod, DawrDeadlineItem>>;
  libraryDriveFolderUrl?: string; // Google Drive Central Library folder URL
  scheduleNotice?: string; // Optional notice added by Principal/Admin at the top of the schedule
  subjectColors?: Record<string, string>; // Custom color mapping by subject name or ID
  scheduleClassOrder?: number[]; // Custom default grade column order set by dragging grade headers
  taqdirScale?: TaqdirScale; // Configurable تقدير ratio set by Admin / Principal
}

// Backward-compatible types for legacy secondary routes
export interface FeesItem {
  FeesID: number;
  ClassID: number;
  FeesAmount: number;
}

export interface ExamItem {
  ExamID: number;
  ClassID: number;
  SubjectID: number;
  RollNo: string;
  TotalMarks: number;
  OutofMarks: number;
}

export interface ExpenseItem {
  ExpenseID: number;
  ClassID: number;
  SubjectID: number;
  ChargeAmount: number;
  Date?: string;
  Remarks?: string;
}
