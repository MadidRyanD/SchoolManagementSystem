export type DepartmentType = '5-days' | '2-days';

export type GradingPeriod = '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th';

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
}

export interface GradingCriteria {
  id: string;
  name: string;
  weight: number;
}

export interface StudentGradeItem {
  id: string;
  StudentID: number;
  ClassID: number;
  SubjectID: number;
  TeacherID: number;
  Period: GradingPeriod;
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
  EditedBy?: string;
  EditedAt?: string;
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

export interface SystemSettings {
  schoolNameEn: string;
  schoolNameAr: string;
  systemName: string;
  gradeLockDays: number;
  gradeEditWindowHours?: number; // Allowed hours set by principal/admin for editing grades after submission
  libraryDriveFolderUrl?: string; // Google Drive Central Library folder URL
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
