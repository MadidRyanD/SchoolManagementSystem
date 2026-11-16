import {
  ClassItem,
  SubjectItem,
  TeacherItem,
  StudentItem,
  SubjectTeacherItem,
  ClassScheduleItem,
  GradingCriteria,
  StudentGradeItem,
  TeacherAttendanceItem,
  StudentAttendanceItem,
  TuitionFeeSetting,
  StudentPaymentLedger,
  TeacherPayrollItem,
  AnnouncementItem,
  FormTemplateItem,
  SystemSettings,
  GradingPeriod,
  SemesterType,
  DepartmentType,
  DawrDeadlineItem,
  StudentEnrollmentRecord,
  EnrollmentStatus,
  FeesItem,
  ExamItem,
  ExpenseItem,
} from './types';
import {
  scheduleClasses,
  scheduleTeachers,
  scheduleSubjects,
  scheduleSubjectTeachers,
  scheduleItems,
} from './scheduleData';

export const initialSettings: SystemSettings = {
  schoolNameEn: 'Jamiatu Monib Alkuzbary Al-Arabia',
  schoolNameAr: 'جامعة منيب الكزبري العربية',
  systemName: 'JMAA-MoritAko',
  gradeLockDays: 7,
  gradeEditWindowHours: 24, // Default allowed editing time given by principal/admin after submission
  activeGradingPeriod: '1st',
  activeAcademicYear: 'SY 2025-2026',
  activeSemester: '1st',
  availableAcademicYears: ['SY 2024-2025', 'SY 2025-2026', 'SY 2026-2027'],
  gradeSubmissionDeadlines: {
    '1st': { period: '1st', deadlineIso: '2026-10-31T23:59', instructions: 'يرجى مراجعة وتدقيق درجات الدور الأول قبل انتهاء الموعد المحدد', enforceLock: true },
    '2nd': { period: '2nd', deadlineIso: '2026-11-30T23:59', instructions: 'الموعد النهائي لتسليم درجات الدور الثاني', enforceLock: true },
    '3rd': { period: '3rd', deadlineIso: '2026-12-31T23:59', instructions: 'الموعد النهائي لتسليم درجات الدور الثالث ونهاية الفصل الأول', enforceLock: true },
    '4th': { period: '4th', deadlineIso: '2027-01-31T23:59', instructions: 'الموعد النهائي لتسليم درجات الدور الرابع وبداية الفصل الثاني', enforceLock: true },
    '5th': { period: '5th', deadlineIso: '2027-02-28T23:59', instructions: 'الموعد النهائي لتسليم درجات الدور الخامس', enforceLock: true },
    '6th': { period: '6th', deadlineIso: '2027-03-31T23:59', instructions: 'الموعد النهائي لتسليم درجات الدور السادس والاختبارات النهائية', enforceLock: true },
  },
  libraryDriveFolderUrl: 'https://drive.google.com/drive/folders/1fCXKezhMzm93fm9S98keWyxLfG-N2NDf?usp=drive_link',
};

// 1. Classes (populated from scheduleData.ts)
export const initialClasses: ClassItem[] = scheduleClasses;

// 2. Faculty & Mudir (populated from scheduleData.ts)
export const initialTeachers: TeacherItem[] = scheduleTeachers;

// 3. Subjects (populated from scheduleData.ts)
export const initialSubjects: SubjectItem[] = scheduleSubjects;

// 4. Subject-Teacher Mappings (populated from scheduleData.ts)
export const initialSubjectTeachers: SubjectTeacherItem[] = scheduleSubjectTeachers;

// 5. Weekly Class Schedules (populated from scheduleData.ts)
export const initialSchedules: ClassScheduleItem[] = scheduleItems;

// 6. Students
export const initialStudents: StudentItem[] = [
  {
    StudentID: 1,
    RollNo: 'R101',
    Name: 'Aarav Al-Husseini',
    NameArabic: 'آراف الحسيني',
    Gender: 'Male',
    Tribe: 'Bani Tamim',
    Nationality: 'Saudi Arabia',
    BirthDate: '2010-04-14',
    BirthPlace: 'Riyadh',
    Address: 'Al-Malaz District, St. 14, Villa 8',
    MobileNumber: '+966 51 111 2233',
    Email: 'aarav@student.jmaa.edu',
    ClassID: 1,
    IdNumber: 'STD-2026-001',
    AdmissionDate: '2024-09-01',
    Remarks: 'Excellence in Quran Recitation (Mumtaz)',
    ProfilePic: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    Awards: ['1st Place Hifdh Competition 2025', 'Academic Star of the Year'],
  },
  {
    StudentID: 2,
    RollNo: 'R102',
    Name: 'Priya Al-Kindi',
    NameArabic: 'بريا الكندي',
    Gender: 'Female',
    Tribe: 'Kindah',
    Nationality: 'Emirati',
    BirthDate: '2010-07-22',
    BirthPlace: 'Abu Dhabi',
    Address: 'Al-Nahda Gardens, Bldg 4',
    MobileNumber: '+966 52 222 3344',
    Email: 'priya@student.jmaa.edu',
    ClassID: 1,
    IdNumber: 'STD-2026-002',
    AdmissionDate: '2024-09-01',
    Remarks: 'Class Representative & Top Reader',
    ProfilePic: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    Awards: ['Best Calligraphy Honor 2025'],
  },
  {
    StudentID: 3,
    RollNo: 'R103',
    Name: 'Rohan Al-Baghdadi',
    NameArabic: 'روهان البغدادي',
    Gender: 'Male',
    Tribe: 'Taiy',
    Nationality: 'Iraqi',
    BirthDate: '2008-01-19',
    BirthPlace: 'Baghdad',
    Address: 'Campus Student Hostel, Room 204',
    MobileNumber: '+966 53 333 4455',
    Email: 'rohan@student.jmaa.edu',
    ClassID: 7,
    IdNumber: 'STD-2026-003',
    AdmissionDate: '2023-09-01',
    Remarks: 'Specialization in Fiqh & Arabic Grammar',
    ProfilePic: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    Awards: ['Dean’s Honor Roll List 2024, 2025'],
  },
  {
    StudentID: 4,
    RollNo: 'R104',
    Name: 'Zainab Al-Ghamdi',
    NameArabic: 'زينب الغامدي',
    Gender: 'Female',
    Tribe: 'Ghamid',
    Nationality: 'Saudi Arabia',
    BirthDate: '2006-05-11',
    BirthPlace: 'Jeddah',
    Address: 'Al-Safa Quarter, House 22',
    MobileNumber: '+966 54 444 5566',
    Email: 'zainab@student.jmaa.edu',
    ClassID: 10,
    IdNumber: 'STD-2026-004',
    AdmissionDate: '2022-09-01',
    Remarks: 'Top Scholar in Hadith Terminology',
    ProfilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    Awards: ['Hadith Memorization Prize (40 Nawawi)'],
  },
  {
    StudentID: 5,
    RollNo: 'R105',
    Name: 'Yusuf Al-Qurtubi',
    NameArabic: 'يوسف القرطبي',
    Gender: 'Male',
    Tribe: 'Qays',
    Nationality: 'Moroccan',
    BirthDate: '2003-09-08',
    BirthPlace: 'Fes',
    Address: 'Graduate Residence, Suite 10',
    MobileNumber: '+966 55 555 6677',
    Email: 'yusuf@student.jmaa.edu',
    ClassID: 13,
    IdNumber: 'STD-2026-005',
    AdmissionDate: '2021-09-01',
    Remarks: 'Kulliyatu Shariah Senior Scholar',
    ProfilePic: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    Awards: ['Valedictorian Candidate 2026'],
  },
  {
    StudentID: 6,
    RollNo: 'R106',
    Name: 'Omar Al-Faruq',
    NameArabic: 'عمر الفاروق',
    Gender: 'Male',
    Tribe: 'Adnan',
    Nationality: 'Saudi Arabia',
    BirthDate: '2010-02-11',
    BirthPlace: 'Mecca',
    Address: 'Al-Aziziyyah District, Villa 12',
    MobileNumber: '+966 50 666 7788',
    Email: 'omar@student.jmaa.edu',
    ClassID: 1,
    IdNumber: 'STD-2026-006',
    AdmissionDate: '2024-09-01',
    Remarks: 'Active in Fiqh Discussions',
  },
  {
    StudentID: 7,
    RollNo: 'R107',
    Name: 'Fatima Al-Zahra',
    NameArabic: 'فاطمة الزهراء',
    Gender: 'Female',
    Tribe: 'Hashim',
    Nationality: 'Saudi Arabia',
    BirthDate: '2010-08-19',
    BirthPlace: 'Medina',
    Address: 'Quba Avenue, House 5',
    MobileNumber: '+966 50 777 8899',
    Email: 'fatima.std@student.jmaa.edu',
    ClassID: 1,
    IdNumber: 'STD-2026-007',
    AdmissionDate: '2024-09-01',
    Remarks: 'Top Scorer in Tajweed',
  },
  {
    StudentID: 8,
    RollNo: 'R108',
    Name: 'Bilal Al-Habashi',
    NameArabic: 'بلال الحبشي',
    Gender: 'Male',
    Tribe: 'Ansari',
    Nationality: 'Yemeni',
    BirthDate: '2010-11-03',
    BirthPlace: 'Sanaa',
    Address: 'Al-Khalidiyah, Flat 3B',
    MobileNumber: '+966 50 888 9900',
    Email: 'bilal.std@student.jmaa.edu',
    ClassID: 1,
    IdNumber: 'STD-2026-008',
    AdmissionDate: '2024-09-01',
    Remarks: 'Diligent and Well Mannered',
  },
  {
    StudentID: 9,
    RollNo: 'R109',
    Name: 'Hamza Al-Baghdadi',
    NameArabic: 'حمزة البغدادي',
    Gender: 'Male',
    Tribe: 'Abbas',
    Nationality: 'Iraqi',
    BirthDate: '2004-05-14',
    BirthPlace: 'Baghdad',
    Address: 'College Quarters, Room 102',
    MobileNumber: '+966 55 112 2334',
    Email: 'hamza@student.jmaa.edu',
    ClassID: 15,
    IdNumber: 'STD-2026-009',
    AdmissionDate: '2023-09-01',
    Remarks: 'Kulliyatu Shariah Year 3 Senior',
  },
  {
    StudentID: 10,
    RollNo: 'R110',
    Name: 'Aisha Al-Basri',
    NameArabic: 'عائشة البصري',
    Gender: 'Female',
    Tribe: 'Tamim',
    Nationality: 'Kuwaiti',
    BirthDate: '2004-09-22',
    BirthPlace: 'Kuwait City',
    Address: 'Hostel Wing C, Suite 4',
    MobileNumber: '+966 55 223 3445',
    Email: 'aisha@student.jmaa.edu',
    ClassID: 15,
    IdNumber: 'STD-2026-010',
    AdmissionDate: '2023-09-01',
    Remarks: 'Excellence in Fiqh Al-Muamalat',
  },
  {
    StudentID: 11,
    RollNo: 'R111',
    Name: 'Tariq Al-Andalusi',
    NameArabic: 'طارق الأندلسي',
    Gender: 'Male',
    Tribe: 'Fihr',
    Nationality: 'Moroccan',
    BirthDate: '2004-01-30',
    BirthPlace: 'Rabat',
    Address: 'College Quarters, Room 104',
    MobileNumber: '+966 55 334 4556',
    Email: 'tariq.std@student.jmaa.edu',
    ClassID: 15,
    IdNumber: 'STD-2026-011',
    AdmissionDate: '2023-09-01',
    Remarks: 'Research Assistant in Usul Al-Fiqh',
  },
  {
    StudentID: 12,
    RollNo: 'SSG101',
    Name: 'Tariq Al-Mansoor (SSG Officer)',
    NameArabic: 'طارق المنصور (رئيس مجلس الطلبة / النشاط)',
    Gender: 'Male',
    Tribe: 'Tamim',
    Nationality: 'Saudi Arabia',
    BirthDate: '2005-03-15',
    BirthPlace: 'Riyadh',
    Address: 'Student Council Headquarters, Wing B',
    MobileNumber: '+966 50 999 0011',
    Email: 'ssg@student.jmaa.edu',
    ClassID: 1,
    IdNumber: 'SSG-2026-001',
    AdmissionDate: '2024-09-01',
    Remarks: 'President of Supreme Student Council (SSG) - Oversees student Nashat and co-curricular grades',
    ProfilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    Awards: ['Student Leadership Excellence 2025', 'Community Service Ribbon'],
    IsSSG: true,
    SSGPosition: 'رئيس مجلس الطلبة ومسؤول النشاط',
  },
];

// 7. Default Grading Criteria
export const initialCriteria: GradingCriteria[] = [
  { id: 'crit-att', name: 'Attendance & Decorum (حضور وسلوك)', weight: 10 },
  { id: 'crit-quiz', name: 'Quizzes & Exercises (اختبارات قصيرة)', weight: 20 },
  { id: 'crit-mid', name: 'Mid-Dawr Examination (اختبار نصفي)', weight: 30 },
  { id: 'crit-final', name: 'Final Dawr Exam (امتحان نهائي)', weight: 40 },
];

// 8. 6-Period Student Grades Seed
export const initialGrades: StudentGradeItem[] = [
  // Student 1 (Aarav Al-Husseini - Class 1)
  // Subject 1: فقه (Fiqh) -> ممتاز
  { id: 'grd-s1-sub1-p1', StudentID: 1, ClassID: 1, SubjectID: 1, TeacherID: 1, Period: '1st', CriteriaScores: { 'crit-att': 98, 'crit-quiz': 95, 'crit-mid': 96, 'crit-final': 97 }, FinalGrade: 96, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub1-p2', StudentID: 1, ClassID: 1, SubjectID: 1, TeacherID: 1, Period: '2nd', CriteriaScores: { 'crit-att': 96, 'crit-quiz': 94, 'crit-mid': 95, 'crit-final': 95 }, FinalGrade: 95, GradedAt: '2026-09-05T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub1-p3', StudentID: 1, ClassID: 1, SubjectID: 1, TeacherID: 1, Period: '3rd', CriteriaScores: { 'crit-att': 100, 'crit-quiz': 98, 'crit-mid': 97, 'crit-final': 98 }, FinalGrade: 98, GradedAt: '2026-09-10T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub1-p4', StudentID: 1, ClassID: 1, SubjectID: 1, TeacherID: 1, Period: '4th', CriteriaScores: { 'crit-att': 95, 'crit-quiz': 92, 'crit-mid': 94, 'crit-final': 93 }, FinalGrade: 93, GradedAt: '2026-09-15T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub1-p5', StudentID: 1, ClassID: 1, SubjectID: 1, TeacherID: 1, Period: '5th', CriteriaScores: { 'crit-att': 96, 'crit-quiz': 95, 'crit-mid': 96, 'crit-final': 96 }, FinalGrade: 96, GradedAt: '2026-09-20T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub1-p6', StudentID: 1, ClassID: 1, SubjectID: 1, TeacherID: 1, Period: '6th', CriteriaScores: { 'crit-att': 98, 'crit-quiz': 97, 'crit-mid': 98, 'crit-final': 97 }, FinalGrade: 97, GradedAt: '2026-09-25T11:00:00Z', IsLocked: false },

  // Subject 2: توحيد (Tawheed) -> جيد جدا
  { id: 'grd-s1-sub2-p1', StudentID: 1, ClassID: 1, SubjectID: 2, TeacherID: 2, Period: '1st', CriteriaScores: { 'crit-att': 90, 'crit-quiz': 88, 'crit-mid': 86, 'crit-final': 88 }, FinalGrade: 88, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub2-p2', StudentID: 1, ClassID: 1, SubjectID: 2, TeacherID: 2, Period: '2nd', CriteriaScores: { 'crit-att': 92, 'crit-quiz': 85, 'crit-mid': 87, 'crit-final': 86 }, FinalGrade: 86, GradedAt: '2026-09-05T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub2-p3', StudentID: 1, ClassID: 1, SubjectID: 2, TeacherID: 2, Period: '3rd', CriteriaScores: { 'crit-att': 90, 'crit-quiz': 89, 'crit-mid': 88, 'crit-final': 89 }, FinalGrade: 89, GradedAt: '2026-09-10T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub2-p4', StudentID: 1, ClassID: 1, SubjectID: 2, TeacherID: 2, Period: '4th', CriteriaScores: { 'crit-att': 88, 'crit-quiz': 86, 'crit-mid': 85, 'crit-final': 87 }, FinalGrade: 86, GradedAt: '2026-09-15T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub2-p5', StudentID: 1, ClassID: 1, SubjectID: 2, TeacherID: 2, Period: '5th', CriteriaScores: { 'crit-att': 90, 'crit-quiz': 88, 'crit-mid': 88, 'crit-final': 88 }, FinalGrade: 88, GradedAt: '2026-09-20T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub2-p6', StudentID: 1, ClassID: 1, SubjectID: 2, TeacherID: 2, Period: '6th', CriteriaScores: { 'crit-att': 92, 'crit-quiz': 90, 'crit-mid': 89, 'crit-final': 89 }, FinalGrade: 89, GradedAt: '2026-09-25T11:00:00Z', IsLocked: false },

  // Subject 3: قرآن (Quran) -> جيد
  { id: 'grd-s1-sub3-p1', StudentID: 1, ClassID: 1, SubjectID: 3, TeacherID: 2, Period: '1st', CriteriaScores: { 'crit-att': 85, 'crit-quiz': 78, 'crit-mid': 76, 'crit-final': 78 }, FinalGrade: 78, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub3-p2', StudentID: 1, ClassID: 1, SubjectID: 3, TeacherID: 2, Period: '2nd', CriteriaScores: { 'crit-att': 82, 'crit-quiz': 75, 'crit-mid': 77, 'crit-final': 76 }, FinalGrade: 76, GradedAt: '2026-09-05T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub3-p3', StudentID: 1, ClassID: 1, SubjectID: 3, TeacherID: 2, Period: '3rd', CriteriaScores: { 'crit-att': 85, 'crit-quiz': 80, 'crit-mid': 78, 'crit-final': 79 }, FinalGrade: 79, GradedAt: '2026-09-10T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub3-p4', StudentID: 1, ClassID: 1, SubjectID: 3, TeacherID: 2, Period: '4th', CriteriaScores: { 'crit-att': 80, 'crit-quiz': 76, 'crit-mid': 78, 'crit-final': 77 }, FinalGrade: 77, GradedAt: '2026-09-15T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub3-p5', StudentID: 1, ClassID: 1, SubjectID: 3, TeacherID: 2, Period: '5th', CriteriaScores: { 'crit-att': 84, 'crit-quiz': 80, 'crit-mid': 81, 'crit-final': 80 }, FinalGrade: 80, GradedAt: '2026-09-20T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub3-p6', StudentID: 1, ClassID: 1, SubjectID: 3, TeacherID: 2, Period: '6th', CriteriaScores: { 'crit-att': 85, 'crit-quiz': 78, 'crit-mid': 79, 'crit-final': 78 }, FinalGrade: 78, GradedAt: '2026-09-25T11:00:00Z', IsLocked: false },

  // Subject 4: تعبير (Tabeer) -> مقبول
  { id: 'grd-s1-sub4-p1', StudentID: 1, ClassID: 1, SubjectID: 4, TeacherID: 4, Period: '1st', CriteriaScores: { 'crit-att': 75, 'crit-quiz': 68, 'crit-mid': 66, 'crit-final': 68 }, FinalGrade: 68, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub4-p2', StudentID: 1, ClassID: 1, SubjectID: 4, TeacherID: 4, Period: '2nd', CriteriaScores: { 'crit-att': 70, 'crit-quiz': 65, 'crit-mid': 64, 'crit-final': 65 }, FinalGrade: 65, GradedAt: '2026-09-05T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub4-p3', StudentID: 1, ClassID: 1, SubjectID: 4, TeacherID: 4, Period: '3rd', CriteriaScores: { 'crit-att': 74, 'crit-quiz': 67, 'crit-mid': 66, 'crit-final': 67 }, FinalGrade: 67, GradedAt: '2026-09-10T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub4-p4', StudentID: 1, ClassID: 1, SubjectID: 4, TeacherID: 4, Period: '4th', CriteriaScores: { 'crit-att': 72, 'crit-quiz': 69, 'crit-mid': 70, 'crit-final': 69 }, FinalGrade: 69, GradedAt: '2026-09-15T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub4-p5', StudentID: 1, ClassID: 1, SubjectID: 4, TeacherID: 4, Period: '5th', CriteriaScores: { 'crit-att': 75, 'crit-quiz': 68, 'crit-mid': 68, 'crit-final': 68 }, FinalGrade: 68, GradedAt: '2026-09-20T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub4-p6', StudentID: 1, ClassID: 1, SubjectID: 4, TeacherID: 4, Period: '6th', CriteriaScores: { 'crit-att': 78, 'crit-quiz': 72, 'crit-mid': 70, 'crit-final': 71 }, FinalGrade: 71, GradedAt: '2026-09-25T11:00:00Z', IsLocked: false },

  // Subject 5: نصوص (Nusoos) -> راسب
  { id: 'grd-s1-sub5-p1', StudentID: 1, ClassID: 1, SubjectID: 5, TeacherID: 4, Period: '1st', CriteriaScores: { 'crit-att': 65, 'crit-quiz': 56, 'crit-mid': 58, 'crit-final': 57 }, FinalGrade: 58, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub5-p2', StudentID: 1, ClassID: 1, SubjectID: 5, TeacherID: 4, Period: '2nd', CriteriaScores: { 'crit-att': 60, 'crit-quiz': 54, 'crit-mid': 55, 'crit-final': 55 }, FinalGrade: 55, GradedAt: '2026-09-05T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub5-p3', StudentID: 1, ClassID: 1, SubjectID: 5, TeacherID: 4, Period: '3rd', CriteriaScores: { 'crit-att': 62, 'crit-quiz': 55, 'crit-mid': 57, 'crit-final': 56 }, FinalGrade: 56, GradedAt: '2026-09-10T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub5-p4', StudentID: 1, ClassID: 1, SubjectID: 5, TeacherID: 4, Period: '4th', CriteriaScores: { 'crit-att': 68, 'crit-quiz': 60, 'crit-mid': 62, 'crit-final': 61 }, FinalGrade: 61, GradedAt: '2026-09-15T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub5-p5', StudentID: 1, ClassID: 1, SubjectID: 5, TeacherID: 4, Period: '5th', CriteriaScores: { 'crit-att': 64, 'crit-quiz': 59, 'crit-mid': 60, 'crit-final': 59 }, FinalGrade: 59, GradedAt: '2026-09-20T11:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub5-p6', StudentID: 1, ClassID: 1, SubjectID: 5, TeacherID: 4, Period: '6th', CriteriaScores: { 'crit-att': 66, 'crit-quiz': 62, 'crit-mid': 63, 'crit-final': 62 }, FinalGrade: 62, GradedAt: '2026-09-25T11:00:00Z', IsLocked: false },

  // Subject 21: نشاط (Nashat - Student Activity / مجلس الطلبة) -> ممتاز
  { id: 'grd-s1-sub21-p1', StudentID: 1, ClassID: 1, SubjectID: 21, TeacherID: 88, Period: '1st', CriteriaScores: { 'crit-att': 98, 'crit-quiz': 95, 'crit-mid': 94, 'crit-final': 96 }, FinalGrade: 96, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s1-sub21-p2', StudentID: 1, ClassID: 1, SubjectID: 21, TeacherID: 88, Period: '2nd', CriteriaScores: { 'crit-att': 96, 'crit-quiz': 94, 'crit-mid': 95, 'crit-final': 95 }, FinalGrade: 95, GradedAt: '2026-09-05T11:00:00Z', IsLocked: false },

  // Student 2 (Priya Al-Kindi - Class 1)
  { id: 'grd-s2-sub1-p1', StudentID: 2, ClassID: 1, SubjectID: 1, TeacherID: 1, Period: '1st', CriteriaScores: { 'crit-att': 100, 'crit-quiz': 97, 'crit-mid': 98, 'crit-final': 99 }, FinalGrade: 98, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s2-sub2-p1', StudentID: 2, ClassID: 1, SubjectID: 2, TeacherID: 2, Period: '1st', CriteriaScores: { 'crit-att': 95, 'crit-quiz': 92, 'crit-mid': 94, 'crit-final': 95 }, FinalGrade: 94, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s2-sub3-p1', StudentID: 2, ClassID: 1, SubjectID: 3, TeacherID: 2, Period: '1st', CriteriaScores: { 'crit-att': 92, 'crit-quiz': 90, 'crit-mid': 91, 'crit-final': 90 }, FinalGrade: 91, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s2-sub4-p1', StudentID: 2, ClassID: 1, SubjectID: 4, TeacherID: 4, Period: '1st', CriteriaScores: { 'crit-att': 88, 'crit-quiz': 85, 'crit-mid': 87, 'crit-final': 86 }, FinalGrade: 86, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s2-sub5-p1', StudentID: 2, ClassID: 1, SubjectID: 5, TeacherID: 4, Period: '1st', CriteriaScores: { 'crit-att': 85, 'crit-quiz': 82, 'crit-mid': 84, 'crit-final': 83 }, FinalGrade: 83, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },
  { id: 'grd-s2-sub21-p1', StudentID: 2, ClassID: 1, SubjectID: 21, TeacherID: 88, Period: '1st', CriteriaScores: { 'crit-att': 95, 'crit-quiz': 98, 'crit-mid': 97, 'crit-final': 98 }, FinalGrade: 97, GradedAt: '2026-09-01T10:00:00Z', IsLocked: false },

  // Student 3 (Rohan Al-Baghdadi - Class 7)
  { id: 'grd-s3-sub7-p1', StudentID: 3, ClassID: 7, SubjectID: 7, TeacherID: 1, Period: '1st', CriteriaScores: { 'crit-att': 92, 'crit-quiz': 90, 'crit-mid': 91, 'crit-final': 90 }, FinalGrade: 90, GradedAt: '2026-09-01T12:00:00Z', IsLocked: true, UnlockRequested: false },
];

// 9. Tuition Fees Setup for 1st to 6th Grading (Dawr)
export const initialFeesSetting: TuitionFeeSetting[] = [
  {
    ClassID: 1,
    DawrAmount: { '1st': 300, '2nd': 300, '3rd': 300, '4th': 300, '5th': 300, '6th': 300 },
  },
  {
    ClassID: 7,
    DawrAmount: { '1st': 400, '2nd': 400, '3rd': 400, '4th': 400, '5th': 400, '6th': 400 },
  },
  {
    ClassID: 10,
    DawrAmount: { '1st': 500, '2nd': 500, '3rd': 500, '4th': 500, '5th': 500, '6th': 500 },
  },
  {
    ClassID: 13,
    DawrAmount: { '1st': 600, '2nd': 600, '3rd': 600, '4th': 600, '5th': 600, '6th': 600 },
  },
];

// 10. Student Payment Matrix (1st to 6th Grading) with Cashier Details & Timestamp
export const initialPayments: StudentPaymentLedger[] = [
  {
    id: 'pay-1',
    StudentID: 1,
    ClassID: 1,
    AcademicYear: 'SY 2025-2026',
    EnrollmentTerm: 'Current Academic Session',
    IsActive: true,
    CreatedAt: '2025-08-15',
    Payments: {
      '1st': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Feb. 3, 2025', dayOfWeek: 'Tuesday' },
      '2nd': { isPaid: true, amount: 200, balance: 100, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Feb. 10, 2025', dayOfWeek: 'Tuesday' },
      '3rd': { isPaid: false, amount: 150, balance: 150, note: 'Umdah', cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Feb. 17, 2025', dayOfWeek: 'Tuesday' },
      '4th': { isPaid: false, amount: 300, cashierName: 'Finance Office', paidAt: 'Feb. 24, 2025', dayOfWeek: 'Tuesday' },
      '5th': { isPaid: false, amount: 300 },
      '6th': { isPaid: false, amount: 300 },
    },
  },
  {
    id: 'pay-1-prev',
    StudentID: 1,
    ClassID: 1,
    AcademicYear: 'SY 2024-2025',
    EnrollmentTerm: 'Previous Enrollment (Completed)',
    IsActive: false,
    CreatedAt: '2024-08-10',
    Payments: {
      '1st': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Feb. 5, 2024', dayOfWeek: 'Monday' },
      '2nd': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Mar. 12, 2024', dayOfWeek: 'Tuesday' },
      '3rd': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Apr. 18, 2024', dayOfWeek: 'Thursday' },
      '4th': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'May. 22, 2024', dayOfWeek: 'Wednesday' },
      '5th': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Jun. 19, 2024', dayOfWeek: 'Wednesday' },
      '6th': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Jul. 25, 2024', dayOfWeek: 'Thursday' },
    },
  },
  {
    id: 'pay-2',
    StudentID: 2,
    ClassID: 1,
    Payments: {
      '1st': { isPaid: true, amount: 300, cashierName: 'Ustadh Kamal (Cashier)', paidAt: 'Feb. 3, 2025', dayOfWeek: 'Tuesday' },
      '2nd': { isPaid: false, amount: 300, cashierName: 'Finance Office', paidAt: 'Feb. 10, 2025', dayOfWeek: 'Tuesday' },
      '3rd': { isPaid: false, amount: 300 },
      '4th': { isPaid: false, amount: 300 },
      '5th': { isPaid: false, amount: 300 },
      '6th': { isPaid: false, amount: 300 },
    },
  },
  {
    id: 'pay-3',
    StudentID: 3,
    ClassID: 7,
    Payments: {
      '1st': { isPaid: true, amount: 400, cashierName: 'Ustadh Kamal (Cashier)', paidAt: '2026-08-22 10:11:05' },
      '2nd': { isPaid: true, amount: 400, cashierName: 'Ustadh Kamal (Cashier)', paidAt: '2026-09-08 16:42:00' },
      '3rd': { isPaid: false, amount: 400 },
      '4th': { isPaid: false, amount: 400 },
      '5th': { isPaid: false, amount: 400 },
      '6th': { isPaid: false, amount: 400 },
    },
  },
];

// 11. Teacher Payroll Allocation
export const initialPayroll: TeacherPayrollItem[] = [
  {
    id: 'pr-1',
    TeacherID: 1,
    Month: 'August 2026',
    BaseSalary: 4500,
    Bonus: 500,
    Deductions: 0,
    NetSalary: 5000,
    Status: 'Paid',
    PaidAt: '2026-08-28 15:00:00',
    CashierName: 'Ustadh Kamal Al-Maliki (Chief Cashier)',
  },
  {
    id: 'pr-2',
    TeacherID: 2,
    Month: 'August 2026',
    BaseSalary: 3200,
    Bonus: 300,
    Deductions: 50,
    NetSalary: 3450,
    Status: 'Paid',
    PaidAt: '2026-08-28 15:10:00',
    CashierName: 'Ustadh Kamal Al-Maliki (Chief Cashier)',
  },
  {
    id: 'pr-3',
    TeacherID: 3,
    Month: 'August 2026',
    BaseSalary: 3400,
    Bonus: 200,
    Deductions: 0,
    NetSalary: 3600,
    Status: 'Paid',
    PaidAt: '2026-08-28 15:15:00',
    CashierName: 'Ustadh Kamal Al-Maliki (Chief Cashier)',
  },
  {
    id: 'pr-4',
    TeacherID: 4,
    Month: 'August 2026',
    BaseSalary: 3100,
    Bonus: 200,
    Deductions: 0,
    NetSalary: 3300,
    Status: 'Paid',
    PaidAt: '2026-08-28 15:20:00',
    CashierName: 'Ustadh Kamal Al-Maliki (Chief Cashier)',
  },
  {
    id: 'pr-5',
    TeacherID: 5,
    Month: 'August 2026',
    BaseSalary: 3800,
    Bonus: 400,
    Deductions: 0,
    NetSalary: 4200,
    Status: 'Paid',
    PaidAt: '2026-08-28 15:25:00',
    CashierName: 'Ustadh Kamal Al-Maliki (Chief Cashier)',
  },
];

// 12. Announcements
export const initialAnnouncements: AnnouncementItem[] = [
  {
    id: 'ann-1',
    title: 'Commencement of 2nd Dawr Academic Examinations',
    content: 'All faculty members and students are notified that the 2nd Grading exams will begin next week across both 5-Days and 2-Days departments.',
    author: 'Dr. Monib Alkuzbary',
    authorRole: 'mudir',
    targetAudience: 'all',
    createdAt: '2026-09-12 08:30',
  },
  {
    id: 'ann-2',
    title: 'Tuition Fee Payment Reminder for 2nd Grading',
    content: 'Students with outstanding dues for the 2nd Dawr are requested to visit the Cashier office before Sunday to finalize their exam hall tickets.',
    author: 'Finance & Accounts Office',
    authorRole: 'cashier',
    targetAudience: 'students',
  createdAt: '2026-09-14 10:00',
  },
];

// 13. Form Templates
export const initialForms: FormTemplateItem[] = [
  {
    id: 'form-1',
    title: 'New Student Madrasah Admission Form',
    description: 'Standard admission questionnaire for prospective students.',
    fields: [
      { label: 'Full Name in English & Arabic', type: 'text', required: true },
      { label: 'Tribe / Clan', type: 'text', required: true },
      { label: 'Target Department (5-Days vs 2-Days)', type: 'select', required: true },
      { label: 'Previous Hifdh Records (Juz Number)', type: 'number', required: false },
    ],
    createdAt: '2026-08-01',
  },
  {
    id: 'form-2',
    title: 'Official Student ID Card Application',
    description: 'Badge issuance form for library and campus access.',
    fields: [
      { label: 'Student Roll No', type: 'text', required: true },
      { label: 'Emergency Contact Mobile', type: 'tel', required: true },
      { label: 'Blood Group', type: 'text', required: false },
    ],
    createdAt: '2026-08-05',
  },
];

// Helper functions for persistent state in localStorage with SSR safety
const KEYS = {
  SETTINGS: 'jmaa_settings',
  CLASSES: 'jmaa_classes',
  TEACHERS: 'jmaa_teachers',
  SUBJECTS: 'jmaa_subjects',
  SUBJECT_TEACHERS: 'jmaa_sub_teachers',
  SCHEDULES: 'jmaa_schedules',
  STUDENTS: 'jmaa_students',
  ENROLLMENTS: 'jmaa_enrollments',
  CRITERIA: 'jmaa_criteria',
  GRADES: 'jmaa_grades',
  FEES: 'jmaa_fees',
  PAYMENTS: 'jmaa_payments',
  PAYROLL: 'jmaa_payroll',
  ANNOUNCEMENTS: 'jmaa_announcements',
  FORMS: 'jmaa_forms',
  TEACHER_ATTENDANCE: 'jmaa_teacher_attendance',
  STUDENT_ATTENDANCE: 'jmaa_student_attendance',
};

const DATA_VERSION_KEY = 'jmaa_data_version';
const CURRENT_DATA_VERSION = 'v2_schedule_reset';

function ensureDataVersion(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(DATA_VERSION_KEY) !== CURRENT_DATA_VERSION) {
      localStorage.removeItem(KEYS.CLASSES);
      localStorage.removeItem(KEYS.TEACHERS);
      localStorage.removeItem(KEYS.SUBJECTS);
      localStorage.removeItem(KEYS.SUBJECT_TEACHERS);
      localStorage.removeItem(KEYS.SCHEDULES);
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    }
  } catch {
    // Ignore storage errors
  }
}

function getItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  ensureDataVersion();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export const DataStore = {
  // Settings
  getSettings(): SystemSettings {
    return getItem<SystemSettings>(KEYS.SETTINGS, initialSettings);
  },
  updateSettings(settings: Partial<SystemSettings>): void {
    const current = this.getSettings();
    setItem(KEYS.SETTINGS, { ...current, ...settings });
  },
  getActiveAcademicYear(): string {
    const s = this.getSettings();
    return s.activeAcademicYear || initialSettings.activeAcademicYear || 'SY 2025-2026';
  },
  setActiveAcademicYear(year: string): void {
    const available = this.getAvailableAcademicYears();
    const updatedYears = available.includes(year) ? available : [...available, year].sort();
    this.updateSettings({ activeAcademicYear: year, availableAcademicYears: updatedYears });
  },
  getActiveSemester(): SemesterType {
    const s = this.getSettings();
    return s.activeSemester || initialSettings.activeSemester || '1st';
  },
  setActiveSemester(semester: SemesterType): void {
    this.updateSettings({ activeSemester: semester });
  },
  getAvailableAcademicYears(): string[] {
    const s = this.getSettings();
    return s.availableAcademicYears && s.availableAcademicYears.length > 0
      ? s.availableAcademicYears
      : initialSettings.availableAcademicYears || ['SY 2024-2025', 'SY 2025-2026', 'SY 2026-2027'];
  },
  addAcademicYear(year: string): string[] {
    const trimmed = year.trim();
    const current = this.getAvailableAcademicYears();
    if (!trimmed || current.includes(trimmed)) return current;
    const next = [...current, trimmed].sort();
    this.updateSettings({ availableAcademicYears: next });
    return next;
  },

  // Classes
  getClasses(): ClassItem[] {
    return getItem<ClassItem[]>(KEYS.CLASSES, initialClasses);
  },
  saveClass(item: Omit<ClassItem, 'ClassID'> & { ClassID?: number }): ClassItem {
    const list = this.getClasses();
    if (item.ClassID && item.ClassID > 0) {
      const idx = list.findIndex(c => c.ClassID === item.ClassID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, ClassID: item.ClassID };
        setItem(KEYS.CLASSES, list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(c => c.ClassID)) + 1 : 1;
    const newItem: ClassItem = {
      ClassID: nextId,
      ClassName: item.ClassName,
      Department: item.Department || '5-days',
      Level: item.Level || 'Ibtidaiyyah',
      YearGrade: item.YearGrade || 1,
      AdviserID: item.AdviserID,
    };
    list.push(newItem);
    setItem(KEYS.CLASSES, list);
    return newItem;
  },
  deleteClass(id: number): void {
    const list = this.getClasses().filter(c => c.ClassID !== id);
    setItem(KEYS.CLASSES, list);
  },

  // Teachers
  getTeachers(): TeacherItem[] {
    return getItem<TeacherItem[]>(KEYS.TEACHERS, initialTeachers);
  },
  saveTeacher(item: Omit<TeacherItem, 'TeacherID'> & { TeacherID?: number }): TeacherItem {
    const list = this.getTeachers();
    if (item.TeacherID && item.TeacherID > 0) {
      const idx = list.findIndex(t => t.TeacherID === item.TeacherID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, TeacherID: item.TeacherID };
        setItem(KEYS.TEACHERS, list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(t => t.TeacherID)) + 1 : 1;
    const newItem: TeacherItem = { ...item, TeacherID: nextId };
    list.push(newItem);
    setItem(KEYS.TEACHERS, list);
    return newItem;
  },
  deleteTeacher(id: number): void {
    const list = this.getTeachers().filter(t => t.TeacherID !== id);
    setItem(KEYS.TEACHERS, list);
  },

  // Subjects
  getSubjects(): SubjectItem[] {
    return getItem<SubjectItem[]>(KEYS.SUBJECTS, initialSubjects);
  },
  saveSubject(item: Omit<SubjectItem, 'SubjectID'> & { SubjectID?: number }): SubjectItem {
    const list = this.getSubjects();
    if (item.SubjectID && item.SubjectID > 0) {
      const idx = list.findIndex(s => s.SubjectID === item.SubjectID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, SubjectID: item.SubjectID };
        setItem(KEYS.SUBJECTS, list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(s => s.SubjectID)) + 1 : 1;
    const newItem: SubjectItem = { ...item, SubjectID: nextId };
    list.push(newItem);
    setItem(KEYS.SUBJECTS, list);
    return newItem;
  },
  deleteSubject(id: number): void {
    const list = this.getSubjects().filter(s => s.SubjectID !== id);
    setItem(KEYS.SUBJECTS, list);
  },

  // Subject Teachers
  getSubjectTeachers(): SubjectTeacherItem[] {
    return getItem<SubjectTeacherItem[]>(KEYS.SUBJECT_TEACHERS, initialSubjectTeachers);
  },
  saveSubjectTeacher(item: Omit<SubjectTeacherItem, 'ID'> & { ID?: number }): SubjectTeacherItem {
    const list = this.getSubjectTeachers();
    if (item.ID && item.ID > 0) {
      const idx = list.findIndex(st => st.ID === item.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, ID: item.ID };
        setItem(KEYS.SUBJECT_TEACHERS, list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(st => st.ID)) + 1 : 1;
    const newItem: SubjectTeacherItem = { ...item, ID: nextId };
    list.push(newItem);
    setItem(KEYS.SUBJECT_TEACHERS, list);
    return newItem;
  },
  deleteSubjectTeacher(id: number): void {
    const list = this.getSubjectTeachers().filter(st => st.ID !== id);
    setItem(KEYS.SUBJECT_TEACHERS, list);
  },

  // Schedules & Conflict Detection
  getSchedules(): ClassScheduleItem[] {
    return getItem<ClassScheduleItem[]>(KEYS.SCHEDULES, initialSchedules);
  },
  saveSchedule(item: Omit<ClassScheduleItem, 'ID'> & { ID?: number }): { success: boolean; conflict?: string; schedule?: ClassScheduleItem } {
    const list = this.getSchedules();

    // Check for Teacher Scheduling Conflicts (same teacher assigned to same day & overlapping time in different class)
    const hasConflict = list.find(s =>
      s.ID !== item.ID &&
      s.TeacherID === item.TeacherID &&
      s.Day === item.Day &&
      s.StartTime === item.StartTime
    );

    if (hasConflict) {
      const classes = this.getClasses();
      const conflictClass = classes.find(c => c.ClassID === hasConflict.ClassID)?.ClassName || `Class #${hasConflict.ClassID}`;
      return {
        success: false,
        conflict: `Schedule Conflict! This teacher is already scheduled for ${conflictClass} on ${item.Day} at ${item.StartTime}.`,
      };
    }

    if (item.ID && item.ID > 0) {
      const idx = list.findIndex(s => s.ID === item.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, ID: item.ID };
        setItem(KEYS.SCHEDULES, list);
        return { success: true, schedule: list[idx] };
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(s => s.ID)) + 1 : 1;
    const newItem: ClassScheduleItem = { ...item, ID: nextId };
    list.push(newItem);
    setItem(KEYS.SCHEDULES, list);
    return { success: true, schedule: newItem };
  },
  deleteSchedule(id: number): void {
    const list = this.getSchedules().filter(s => s.ID !== id);
    setItem(KEYS.SCHEDULES, list);
  },

  // Students
  getStudents(): StudentItem[] {
    return getItem<StudentItem[]>(KEYS.STUDENTS, initialStudents);
  },
  saveStudent(item: Omit<StudentItem, 'StudentID'> & { StudentID?: number }, targetTerm?: { academicYear?: string; semester?: SemesterType; enrollBothSemesters?: boolean }): StudentItem {
    const list = this.getStudents();
    if (item.StudentID && item.StudentID > 0) {
      const idx = list.findIndex(s => s.StudentID === item.StudentID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, StudentID: item.StudentID };
        setItem(KEYS.STUDENTS, list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(s => s.StudentID)) + 1 : 1;
    const newItem: StudentItem = { ...item, StudentID: nextId };
    list.push(newItem);
    setItem(KEYS.STUDENTS, list);

    // Also create enrollment record(s) for the active/target academic year & semester
    const year = targetTerm?.academicYear || this.getActiveAcademicYear();
    const sem = targetTerm?.semester || this.getActiveSemester();
    this.enrollStudentInTerm({
      studentId: newItem.StudentID,
      classId: newItem.ClassID,
      rollNo: newItem.RollNo,
      academicYear: year,
      semester: sem,
      enrollBothSemesters: targetTerm?.enrollBothSemesters ?? true,
      createTuitionLedger: true,
    });

    return newItem;
  },
  saveStudentsBatch(items: Array<Omit<StudentItem, 'StudentID'>>, targetTerm?: { academicYear?: string; semester?: SemesterType }): StudentItem[] {
    const list = this.getStudents();
    let nextId = list.length > 0 ? Math.max(...list.map(s => s.StudentID)) + 1 : 1;
    const added: StudentItem[] = [];
    for (const item of items) {
      const newItem: StudentItem = { ...item, StudentID: nextId++ };
      list.push(newItem);
      added.push(newItem);
    }
    setItem(KEYS.STUDENTS, list);

    const year = targetTerm?.academicYear || this.getActiveAcademicYear();
    const sem = targetTerm?.semester || this.getActiveSemester();
    for (const s of added) {
      this.enrollStudentInTerm({
        studentId: s.StudentID,
        classId: s.ClassID,
        rollNo: s.RollNo,
        academicYear: year,
        semester: sem,
        enrollBothSemesters: true,
        createTuitionLedger: false,
      });
    }

    return added;
  },
  deleteStudent(id: number): void {
    const list = this.getStudents().filter(s => s.StudentID !== id);
    setItem(KEYS.STUDENTS, list);
  },
  deleteStudentsBatch(ids: number[]): void {
    const idSet = new Set(ids);
    const list = this.getStudents().filter(s => !idSet.has(s.StudentID));
    setItem(KEYS.STUDENTS, list);
  },
  updateStudentsBatch(ids: number[], updates: Partial<StudentItem>): void {
    const idSet = new Set(ids);
    const list = this.getStudents().map(s => {
      if (idSet.has(s.StudentID)) {
        return { ...s, ...updates };
      }
      return s;
    });
    setItem(KEYS.STUDENTS, list);
  },

  // Multi-Year & Semester Enrollment Management (Preserves Previous Academic Year Data)
  getEnrollments(): StudentEnrollmentRecord[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.ENROLLMENTS);
    if (!raw) {
      // Backfill existing students into baseline SY 2025-2026 (1st & 2nd semester)
      const students = this.getStudents();
      const seeded: StudentEnrollmentRecord[] = [];
      for (const s of students) {
        seeded.push({
          id: `enr-SY2025-2026-1st-${s.StudentID}`,
          StudentID: s.StudentID,
          AcademicYear: 'SY 2025-2026',
          Semester: '1st',
          ClassID: s.ClassID,
          RollNo: s.RollNo,
          Status: 'Active',
          EnrolledAt: s.AdmissionDate || '2025-09-01',
        });
        seeded.push({
          id: `enr-SY2025-2026-2nd-${s.StudentID}`,
          StudentID: s.StudentID,
          AcademicYear: 'SY 2025-2026',
          Semester: '2nd',
          ClassID: s.ClassID,
          RollNo: s.RollNo,
          Status: 'Active',
          EnrolledAt: s.AdmissionDate || '2026-01-15',
        });
      }
      setItem(KEYS.ENROLLMENTS, seeded);
      return seeded;
    }
    try {
      return JSON.parse(raw) as StudentEnrollmentRecord[];
    } catch {
      return [];
    }
  },
  getEnrollmentsForTerm(academicYear?: string, semester?: SemesterType): StudentEnrollmentRecord[] {
    const yr = academicYear || this.getActiveAcademicYear();
    const sem = semester || this.getActiveSemester();
    return this.getEnrollments().filter(e => e.AcademicYear === yr && e.Semester === sem);
  },
  getStudentEnrollmentHistory(studentId: number): StudentEnrollmentRecord[] {
    return this.getEnrollments()
      .filter(e => e.StudentID === studentId)
      .sort((a, b) => {
        if (a.AcademicYear !== b.AcademicYear) return b.AcademicYear.localeCompare(a.AcademicYear);
        return b.Semester.localeCompare(a.Semester);
      });
  },
  getStudentsForTerm(academicYear?: string, semester?: SemesterType): StudentItem[] {
    const yr = academicYear || this.getActiveAcademicYear();
    const sem = semester || this.getActiveSemester();
    const enrollments = this.getEnrollmentsForTerm(yr, sem);
    const allStudents = this.getStudents();
    const studentMap = new Map(allStudents.map(s => [s.StudentID, s]));
    const result: StudentItem[] = [];
    for (const enr of enrollments) {
      const base = studentMap.get(enr.StudentID);
      if (base) {
        result.push({
          ...base,
          ClassID: enr.ClassID,
          RollNo: enr.RollNo || base.RollNo,
        });
      }
    }
    return result;
  },
  suggestNextClassId(currentClassId: number): number {
    const classes = this.getClasses();
    const current = classes.find(c => c.ClassID === currentClassId);
    if (!current) return currentClassId;
    const nextInSameLevel = classes.find(
      c => c.Department === current.Department && c.Level === current.Level && c.YearGrade === current.YearGrade + 1
    );
    if (nextInSameLevel) return nextInSameLevel.ClassID;
    // Level progression for 5-days: Ibtidaiyyah 6 -> Mutawassit 1 -> Thanawi 1
    if (current.Department === '5-days') {
      if (current.Level === 'Ibtidaiyyah' && current.YearGrade >= 6) {
        const mut1 = classes.find(c => c.Department === '5-days' && c.Level === 'Mutawassit' && c.YearGrade === 1);
        if (mut1) return mut1.ClassID;
      }
      if (current.Level === 'Mutawassit' && current.YearGrade >= 3) {
        const thn1 = classes.find(c => c.Department === '5-days' && c.Level === 'Thanawi' && c.YearGrade === 1);
        if (thn1) return thn1.ClassID;
      }
    }
    return currentClassId;
  },
  enrollStudentInTerm(params: {
    studentId: number;
    classId: number;
    rollNo?: string;
    academicYear: string;
    semester: SemesterType;
    enrollBothSemesters?: boolean;
    previousAcademicYear?: string;
    previousClassId?: number;
    remarks?: string;
    createTuitionLedger?: boolean;
  }): StudentEnrollmentRecord {
    const list = this.getEnrollments();
    const students = this.getStudents();
    const student = students.find(s => s.StudentID === params.studentId);
    const rollNo = params.rollNo || student?.RollNo || '';
    const today = new Date().toISOString().split('T')[0];

    // Preserve previous academic year data — only mark its status as 'Promoted' if transitioning years
    if (params.previousAcademicYear && params.previousAcademicYear !== params.academicYear) {
      list.forEach(e => {
        if (
          e.StudentID === params.studentId &&
          e.AcademicYear === params.previousAcademicYear &&
          e.Status === 'Active'
        ) {
          e.Status = 'Promoted';
        }
      });
    }

    const semestersToEnroll: SemesterType[] = params.enrollBothSemesters
      ? ['1st', '2nd']
      : [params.semester];

    let primaryRecord: StudentEnrollmentRecord | null = null;
    for (const sem of semestersToEnroll) {
      const existingIdx = list.findIndex(
        e => e.StudentID === params.studentId && e.AcademicYear === params.academicYear && e.Semester === sem
      );
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          ClassID: params.classId,
          RollNo: rollNo,
          Status: 'Active',
          Remarks: params.remarks ?? list[existingIdx].Remarks,
        };
        if (sem === params.semester || !primaryRecord) primaryRecord = list[existingIdx];
      } else {
        const rec: StudentEnrollmentRecord = {
          id: `enr-${params.academicYear.replace(/\s+/g, '')}-${sem}-${params.studentId}-${Date.now()}`,
          StudentID: params.studentId,
          AcademicYear: params.academicYear,
          Semester: sem,
          ClassID: params.classId,
          RollNo: rollNo,
          Status: 'Active',
          EnrolledAt: today,
          PreviousAcademicYear: params.previousAcademicYear,
          PreviousClassID: params.previousClassId,
          Remarks: params.remarks,
        };
        list.push(rec);
        if (sem === params.semester || !primaryRecord) primaryRecord = rec;
      }
    }

    setItem(KEYS.ENROLLMENTS, list);
    this.addAcademicYear(params.academicYear);

    // Create fresh tuition ledger for the new academic year if one doesn't exist yet
    if (params.createTuitionLedger !== false) {
      const existingLedgers = this.getStudentPaymentLedgers(params.studentId);
      const hasYearLedger = existingLedgers.some(l => l.AcademicYear === params.academicYear);
      if (!hasYearLedger) {
        this.renewStudentEnrollment(
          params.studentId,
          params.classId,
          params.academicYear,
          `${params.semester === '1st' ? '1st Semester' : '2nd Semester'} Enrollment`
        );
      }
    }

    return primaryRecord!;
  },
  promoteStudentsBatch(params: {
    studentIds: number[];
    fromAcademicYear: string;
    fromSemester: SemesterType;
    toAcademicYear: string;
    toSemester: SemesterType;
    enrollBothSemesters?: boolean;
    targetClassMap?: Record<number, number>;
    autoAdvanceGrade?: boolean;
    createTuitionLedgers?: boolean;
  }): { enrolledCount: number; skippedCount: number; records: StudentEnrollmentRecord[] } {
    const prevEnrollments = this.getEnrollmentsForTerm(params.fromAcademicYear, params.fromSemester);
    const existingTarget = this.getEnrollmentsForTerm(params.toAcademicYear, params.toSemester);
    const alreadyEnrolledSet = new Set(existingTarget.map(e => e.StudentID));
    const allStudents = this.getStudents();
    const records: StudentEnrollmentRecord[] = [];
    let skippedCount = 0;

    for (const sid of params.studentIds) {
      if (alreadyEnrolledSet.has(sid) && !params.targetClassMap?.[sid]) {
        skippedCount++;
        continue;
      }
      const prevEnr = prevEnrollments.find(e => e.StudentID === sid);
      const baseStudent = allStudents.find(s => s.StudentID === sid);
      const prevClassId = prevEnr?.ClassID ?? baseStudent?.ClassID ?? 1;
      const targetClassId =
        params.targetClassMap?.[sid] ??
        (params.autoAdvanceGrade !== false ? this.suggestNextClassId(prevClassId) : prevClassId);

      const rec = this.enrollStudentInTerm({
        studentId: sid,
        classId: targetClassId,
        rollNo: prevEnr?.RollNo || baseStudent?.RollNo,
        academicYear: params.toAcademicYear,
        semester: params.toSemester,
        enrollBothSemesters: params.enrollBothSemesters ?? true,
        previousAcademicYear: params.fromAcademicYear,
        previousClassId: prevClassId,
        remarks: `Promoted from ${params.fromAcademicYear}`,
        createTuitionLedger: params.createTuitionLedgers ?? true,
      });
      records.push(rec);
    }

    return {
      enrolledCount: records.length,
      skippedCount,
      records,
    };
  },
  updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus): void {
    const list = this.getEnrollments();
    const idx = list.findIndex(e => e.id === enrollmentId);
    if (idx >= 0) {
      list[idx].Status = status;
      setItem(KEYS.ENROLLMENTS, list);
    }
  },

  // Grading Criteria
  getCriteria(): GradingCriteria[] {
    return getItem<GradingCriteria[]>(KEYS.CRITERIA, initialCriteria);
  },
  saveCriteria(item: GradingCriteria): void {
    const list = this.getCriteria();
    const idx = list.findIndex(c => c.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    setItem(KEYS.CRITERIA, list);
  },
  deleteCriteria(id: string): void {
    const list = this.getCriteria().filter(c => c.id !== id);
    setItem(KEYS.CRITERIA, list);
  },

  // 6-Period Grades
  getGrades(): StudentGradeItem[] {
    const list = getItem<StudentGradeItem[]>(KEYS.GRADES, initialGrades);
    let updated = false;
    for (const initG of initialGrades) {
      const idx = list.findIndex(g => g.id === initG.id);
      if (idx === -1) {
        list.push({ ...initG, AcademicYear: initG.AcademicYear || 'SY 2025-2026' });
        updated = true;
      }
    }
    if (updated) setItem(KEYS.GRADES, list);
    return list;
  },
  getGradesForTerm(academicYear?: string): StudentGradeItem[] {
    const yr = academicYear || this.getActiveAcademicYear();
    return this.getGrades().filter(g => (g.AcademicYear || 'SY 2025-2026') === yr);
  },
  // Grade Edit Time Window & Lock Controls
  getGradeEditWindowHours(): number {
    const s = this.getSettings();
    return s.gradeEditWindowHours || 24;
  },
  setGradeEditWindowHours(hours: number): void {
    this.updateSettings({ gradeEditWindowHours: hours });
  },

  // Dawr Submission Deadlines & Active Period Management
  getActiveGradingPeriod(): GradingPeriod {
    const s = this.getSettings();
    return s.activeGradingPeriod || '1st';
  },
  setActiveGradingPeriod(period: GradingPeriod): void {
    this.updateSettings({ activeGradingPeriod: period });
  },
  getGradeSubmissionDeadlines(): Partial<Record<GradingPeriod, DawrDeadlineItem>> {
    const s = this.getSettings();
    return s.gradeSubmissionDeadlines || initialSettings.gradeSubmissionDeadlines || {};
  },
  getGradeSubmissionDeadline(period: GradingPeriod): DawrDeadlineItem | undefined {
    const deadlines = this.getGradeSubmissionDeadlines();
    return deadlines[period] || initialSettings.gradeSubmissionDeadlines?.[period];
  },
  setGradeSubmissionDeadline(period: GradingPeriod, item: DawrDeadlineItem): void {
    const current = { ...this.getGradeSubmissionDeadlines(), [period]: item };
    this.updateSettings({ gradeSubmissionDeadlines: current });
  },
  setAllGradeSubmissionDeadlines(deadlines: Partial<Record<GradingPeriod, DawrDeadlineItem>>): void {
    this.updateSettings({ gradeSubmissionDeadlines: deadlines });
  },

  checkGradeLock(grade: StudentGradeItem | undefined | null, period?: GradingPeriod): {
    isLocked: boolean;
    remainingMs: number;
    expiresAt?: string;
    submittedAt?: string;
    allowedHours: number;
    status: 'unsubmitted' | 'editable_grace_period' | 'unlocked_by_admin' | 'expired_locked' | 'manually_locked';
  } {
    const defaultHours = this.getGradeEditWindowHours();
    const dawrPeriod = grade?.Period || period;

    // Check Dawr-level calendar deadline set by Principal
    if (dawrPeriod) {
      const dawrDeadline = this.getGradeSubmissionDeadline(dawrPeriod);
      if (dawrDeadline && dawrDeadline.enforceLock && dawrDeadline.deadlineIso) {
        const deadlineTime = new Date(dawrDeadline.deadlineIso).getTime();
        if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
          // If admin explicitly granted an unlock extension with future expiration, respect it
          if (grade?.UnlockGranted && grade?.LockExpiresAt) {
            const rem = new Date(grade.LockExpiresAt).getTime() - Date.now();
            if (rem > 0) {
              return {
                isLocked: false,
                remainingMs: rem,
                expiresAt: grade.LockExpiresAt,
                submittedAt: grade.SubmittedAt || grade.GradedAt,
                allowedHours: grade.AllowedEditHours || defaultHours,
                status: 'unlocked_by_admin',
              };
            }
          }
          return {
            isLocked: true,
            remainingMs: 0,
            expiresAt: dawrDeadline.deadlineIso,
            submittedAt: grade?.SubmittedAt || grade?.GradedAt,
            allowedHours: grade?.AllowedEditHours || defaultHours,
            status: 'expired_locked',
          };
        }
      }
    }
    if (!grade || grade.FinalGrade === undefined || grade.FinalGrade === null) {
      return {
        isLocked: false,
        remainingMs: 0,
        allowedHours: defaultHours,
        status: 'unsubmitted',
      };
    }

    const allowedHours = grade.AllowedEditHours || defaultHours;

    // Check if Mudir/Admin explicitly granted unlock
    if (grade.UnlockGranted) {
      if (grade.LockExpiresAt) {
        const remaining = new Date(grade.LockExpiresAt).getTime() - Date.now();
        if (remaining > 0) {
          return {
            isLocked: false,
            remainingMs: remaining,
            expiresAt: grade.LockExpiresAt,
            submittedAt: grade.SubmittedAt || grade.GradedAt,
            allowedHours,
            status: 'unlocked_by_admin',
          };
        }
      } else {
        return {
          isLocked: false,
          remainingMs: 86400000,
          allowedHours,
          status: 'unlocked_by_admin',
        };
      }
    }

    // If marked locked manually without a future expiration
    if (grade.IsLocked && !grade.LockExpiresAt) {
      return {
        isLocked: true,
        remainingMs: 0,
        allowedHours,
        status: 'manually_locked',
      };
    }

    // Calculate expiration based on LockExpiresAt, SubmittedAt, or GradedAt
    let expiresAtTime: number | null = null;
    if (grade.LockExpiresAt) {
      expiresAtTime = new Date(grade.LockExpiresAt).getTime();
    } else if (grade.SubmittedAt || grade.GradedAt) {
      const baseTime = new Date(grade.SubmittedAt || grade.GradedAt).getTime();
      if (!isNaN(baseTime)) {
        expiresAtTime = baseTime + allowedHours * 3600 * 1000;
      }
    }

    if (expiresAtTime !== null) {
      const remainingMs = expiresAtTime - Date.now();
      if (remainingMs > 0) {
        return {
          isLocked: false,
          remainingMs,
          expiresAt: new Date(expiresAtTime).toISOString(),
          submittedAt: grade.SubmittedAt || grade.GradedAt,
          allowedHours,
          status: 'editable_grace_period',
        };
      } else {
        return {
          isLocked: true,
          remainingMs: 0,
          expiresAt: new Date(expiresAtTime).toISOString(),
          submittedAt: grade.SubmittedAt || grade.GradedAt,
          allowedHours,
          status: 'expired_locked',
        };
      }
    }

    return {
      isLocked: Boolean(grade.IsLocked),
      remainingMs: 0,
      allowedHours,
      status: grade.IsLocked ? 'manually_locked' : 'unsubmitted',
    };
  },

  saveGrade(item: StudentGradeItem): { success: boolean; error?: string } {
    const list = this.getGrades();
    const defaultHours = this.getGradeEditWindowHours();
    const nowIso = new Date().toISOString();
    const targetYear = item.AcademicYear || this.getActiveAcademicYear();
    const targetSem = item.Semester || this.getActiveSemester();

    const existingIdx = list.findIndex(
      g =>
        g.StudentID === item.StudentID &&
        g.ClassID === item.ClassID &&
        g.SubjectID === item.SubjectID &&
        g.Period === item.Period &&
        (g.AcademicYear || 'SY 2025-2026') === targetYear
    );

    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      const lockCheck = this.checkGradeLock(existing);

      if (lockCheck.isLocked && existing.FinalGrade !== 'INC') {
        return {
          success: false,
          error: 'انتهت مهلة التعديل المحددة من الإدارة! الدرجة مقفلة حالياً. يرجى طلب فتح مهلة جديدة من المدير العام.',
        };
      }

      // Preserve or set submission time and lock expiration
      const allowedHours = existing.AllowedEditHours || defaultHours;
      const lockExpiresAt = existing.LockExpiresAt || new Date(Date.now() + allowedHours * 3600 * 1000).toISOString();

      list[existingIdx] = {
        ...item,
        id: existing.id,
        AcademicYear: targetYear,
        Semester: targetSem,
        SubmittedAt: existing.SubmittedAt || nowIso,
        AllowedEditHours: allowedHours,
        LockExpiresAt: lockExpiresAt,
        IsLocked: false,
        UnlockGranted: existing.UnlockGranted ?? false,
      };
    } else {
      const allowedHours = defaultHours;
      const lockExpiresAt = new Date(Date.now() + allowedHours * 3600 * 1000).toISOString();

      list.push({
        ...item,
        AcademicYear: targetYear,
        Semester: targetSem,
        SubmittedAt: nowIso,
        AllowedEditHours: allowedHours,
        LockExpiresAt: lockExpiresAt,
        IsLocked: false,
        UnlockGranted: false,
      });
    }

    setItem(KEYS.GRADES, list);
    return { success: true };
  },

  saveMultipleGrades(items: StudentGradeItem[]): { success: boolean; savedCount: number; errors?: string[] } {
    const list = this.getGrades();
    const defaultHours = this.getGradeEditWindowHours();
    const nowIso = new Date().toISOString();
    const activeYear = this.getActiveAcademicYear();
    const activeSem = this.getActiveSemester();
    let savedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      const targetYear = item.AcademicYear || activeYear;
      const targetSem = item.Semester || activeSem;
      const existingIdx = list.findIndex(
        g =>
          g.StudentID === item.StudentID &&
          g.ClassID === item.ClassID &&
          g.SubjectID === item.SubjectID &&
          g.Period === item.Period &&
          (g.AcademicYear || 'SY 2025-2026') === targetYear
      );

      if (existingIdx >= 0) {
        const existing = list[existingIdx];
        const lockCheck = this.checkGradeLock(existing);

        if (lockCheck.isLocked && existing.FinalGrade !== 'INC') {
          errors.push(`طالب #${item.StudentID}: انتهت مهلة التعديل والدرجة مقفلة.`);
          continue;
        }

        const allowedHours = existing.AllowedEditHours || defaultHours;
        const lockExpiresAt = existing.LockExpiresAt || new Date(Date.now() + allowedHours * 3600 * 1000).toISOString();

        list[existingIdx] = {
          ...item,
          id: existing.id,
          AcademicYear: targetYear,
          Semester: targetSem,
          SubmittedAt: existing.SubmittedAt || nowIso,
          AllowedEditHours: allowedHours,
          LockExpiresAt: lockExpiresAt,
          IsLocked: false,
          UnlockGranted: existing.UnlockGranted ?? false,
        };
      } else {
        const allowedHours = defaultHours;
        const lockExpiresAt = new Date(Date.now() + allowedHours * 3600 * 1000).toISOString();

        list.push({
          ...item,
          AcademicYear: targetYear,
          Semester: targetSem,
          SubmittedAt: nowIso,
          AllowedEditHours: allowedHours,
          LockExpiresAt: lockExpiresAt,
          IsLocked: false,
          UnlockGranted: false,
        });
      }
      savedCount++;
    }

    setItem(KEYS.GRADES, list);
    return { success: errors.length === 0, savedCount, errors: errors.length > 0 ? errors : undefined };
  },

  requestGradeUnlock(gradeId: string): void {
    const list = this.getGrades();
    const item = list.find(g => g.id === gradeId);
    if (item) {
      item.UnlockRequested = true;
      setItem(KEYS.GRADES, list);
    }
  },

  requestSubjectUnlock(classId: number, subjectId: number, period: GradingPeriod): void {
    const list = this.getGrades();
    let updated = false;
    list.forEach(g => {
      if (g.ClassID === classId && g.SubjectID === subjectId && g.Period === period) {
        g.UnlockRequested = true;
        updated = true;
      }
    });
    if (updated) setItem(KEYS.GRADES, list);
  },

  grantGradeUnlock(gradeId: string, grant: boolean, hours?: number): void {
    const list = this.getGrades();
    const item = list.find(g => g.id === gradeId);
    if (item) {
      item.UnlockRequested = false;
      item.UnlockGranted = grant;
      if (grant) {
        item.IsLocked = false;
        const grantedHours = hours || this.getGradeEditWindowHours();
        item.AllowedEditHours = grantedHours;
        item.LockExpiresAt = new Date(Date.now() + grantedHours * 3600 * 1000).toISOString();
      } else {
        item.IsLocked = true;
        item.LockExpiresAt = new Date().toISOString();
      }
      setItem(KEYS.GRADES, list);
    }
  },

  grantSubjectUnlock(classId: number, subjectId: number, period: GradingPeriod, hours?: number): void {
    const list = this.getGrades();
    const grantedHours = hours || this.getGradeEditWindowHours();
    const lockExpiresAt = new Date(Date.now() + grantedHours * 3600 * 1000).toISOString();
    let updated = false;

    list.forEach(g => {
      if (g.ClassID === classId && g.SubjectID === subjectId && g.Period === period) {
        g.IsLocked = false;
        g.UnlockRequested = false;
        g.UnlockGranted = true;
        g.AllowedEditHours = grantedHours;
        g.LockExpiresAt = lockExpiresAt;
        updated = true;
      }
    });

    if (updated) setItem(KEYS.GRADES, list);
  },

  lockSubjectNow(classId: number, subjectId: number, period: GradingPeriod): void {
    const list = this.getGrades();
    let updated = false;

    list.forEach(g => {
      if (g.ClassID === classId && g.SubjectID === subjectId && g.Period === period) {
        g.IsLocked = true;
        g.UnlockGranted = false;
        g.LockExpiresAt = new Date().toISOString();
        updated = true;
      }
    });

    if (updated) setItem(KEYS.GRADES, list);
  },

  // Tuition Fees per Dawr (1st to 6th)
  getFeesSettings(): TuitionFeeSetting[] {
    return getItem<TuitionFeeSetting[]>(KEYS.FEES, initialFeesSetting);
  },
  saveFeesSetting(item: TuitionFeeSetting): void {
    const list = this.getFeesSettings();
    const idx = list.findIndex(f => f.ClassID === item.ClassID);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    setItem(KEYS.FEES, list);
  },

  // Student Payments Ledger
  getPayments(): StudentPaymentLedger[] {
    return getItem<StudentPaymentLedger[]>(KEYS.PAYMENTS, initialPayments);
  },
  getStudentPaymentLedgers(studentId: number): StudentPaymentLedger[] {
    const list = this.getPayments();
    return list.filter(p => p.StudentID === studentId);
  },
  renewStudentEnrollment(studentId: number, classId: number, newAcademicYear?: string, semesterTerm?: string): StudentPaymentLedger {
    const list = this.getPayments();
    // 1. Mark existing active ledger for this student as previous/archived
    list.forEach(p => {
      if (p.StudentID === studentId && (p.IsActive === undefined || p.IsActive === true)) {
        p.IsActive = false;
      }
    });

    // 2. Create brand-new active ledger with all 6 Quarters renewed back to zero
    const yr = newAcademicYear || 'SY 2026-2027';
    const term = semesterTerm || 'New Enrollment Session';
    const newLedger: StudentPaymentLedger = {
      id: `pay-${Date.now()}-${studentId}`,
      StudentID: studentId,
      ClassID: classId,
      AcademicYear: yr,
      EnrollmentTerm: term,
      IsActive: true,
      CreatedAt: new Date().toISOString().split('T')[0],
      Payments: {
        '1st': { isPaid: false, amount: 300 },
        '2nd': { isPaid: false, amount: 300 },
        '3rd': { isPaid: false, amount: 300 },
        '4th': { isPaid: false, amount: 300 },
        '5th': { isPaid: false, amount: 300 },
        '6th': { isPaid: false, amount: 300 },
      },
    };

    list.unshift(newLedger);
    setItem(KEYS.PAYMENTS, list);
    return newLedger;
  },
  markDawrPayment(studentId: number, classId: number, period: GradingPeriod, isPaid: boolean, cashierName: string, amount: number, academicYear?: string): void {
    const list = this.getPayments();
    let ledger = list.find(p => p.StudentID === studentId && (academicYear ? p.AcademicYear === academicYear : (p.IsActive !== false)));
    if (!ledger) {
      ledger = list.find(p => p.StudentID === studentId);
    }
    if (!ledger) {
      ledger = {
        id: `pay-${Date.now()}-${studentId}`,
        StudentID: studentId,
        ClassID: classId,
        AcademicYear: academicYear || 'SY 2025-2026',
        IsActive: true,
        Payments: {
          '1st': { isPaid: false, amount: 0 },
          '2nd': { isPaid: false, amount: 0 },
          '3rd': { isPaid: false, amount: 0 },
          '4th': { isPaid: false, amount: 0 },
          '5th': { isPaid: false, amount: 0 },
          '6th': { isPaid: false, amount: 0 },
        },
      };
      list.push(ledger);
    }

    ledger.Payments[period] = {
      isPaid,
      amount,
      cashierName: isPaid ? cashierName : undefined,
      paidAt: isPaid ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
      dayOfWeek: isPaid ? new Date().toLocaleDateString('en-US', { weekday: 'long' }) : undefined,
    };

    setItem(KEYS.PAYMENTS, list);
  },

  // Teacher Payroll
  getPayroll(): TeacherPayrollItem[] {
    return getItem<TeacherPayrollItem[]>(KEYS.PAYROLL, initialPayroll);
  },
  releaseSalary(payrollId: string, cashierName: string): void {
    const list = this.getPayroll();
    const item = list.find(p => p.id === payrollId);
    if (item) {
      item.Status = 'Paid';
      item.PaidAt = new Date().toLocaleString();
      item.CashierName = cashierName;
      setItem(KEYS.PAYROLL, list);
    }
  },

  // Announcements
  getAnnouncements(): AnnouncementItem[] {
    return getItem<AnnouncementItem[]>(KEYS.ANNOUNCEMENTS, initialAnnouncements);
  },
  saveAnnouncement(item: Omit<AnnouncementItem, 'id' | 'createdAt'> & { id?: string }): AnnouncementItem {
    const list = this.getAnnouncements();
    if (item.id) {
      const idx = list.findIndex(a => a.id === item.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item };
        setItem(KEYS.ANNOUNCEMENTS, list);
        return list[idx];
      }
    }
    const newItem: AnnouncementItem = {
      ...item,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
    };
    list.unshift(newItem);
    setItem(KEYS.ANNOUNCEMENTS, list);
    return newItem;
  },
  deleteAnnouncement(id: string): void {
    const list = this.getAnnouncements().filter(a => a.id !== id);
    setItem(KEYS.ANNOUNCEMENTS, list);
  },

  // Forms
  getForms(): FormTemplateItem[] {
    return getItem<FormTemplateItem[]>(KEYS.FORMS, initialForms);
  },
  saveForm(item: Omit<FormTemplateItem, 'id' | 'createdAt'> & { id?: string }): FormTemplateItem {
    const list = this.getForms();
    if (item.id) {
      const idx = list.findIndex(f => f.id === item.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item };
        setItem(KEYS.FORMS, list);
        return list[idx];
      }
    }
    const newItem: FormTemplateItem = {
      ...item,
      id: `form-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    list.push(newItem);
    setItem(KEYS.FORMS, list);
    return newItem;
  },
  deleteForm(id: string): void {
    const list = this.getForms().filter(f => f.id !== id);
    setItem(KEYS.FORMS, list);
  },

  // Attendance with Audit Logs
  getTeacherAttendance(): TeacherAttendanceItem[] {
    return getItem<TeacherAttendanceItem[]>(KEYS.TEACHER_ATTENDANCE, [
      { ID: 1, TeacherID: 1, Status: true, Date: new Date().toISOString().split('T')[0] },
      { ID: 2, TeacherID: 2, Status: true, Date: new Date().toISOString().split('T')[0] },
      { ID: 3, TeacherID: 3, Status: true, Date: new Date().toISOString().split('T')[0] },
      { ID: 4, TeacherID: 4, Status: true, Date: new Date().toISOString().split('T')[0] },
      { ID: 5, TeacherID: 5, Status: false, Date: new Date().toISOString().split('T')[0] },
    ]);
  },
  saveTeacherAttendance(records: { TeacherID: number; Status: boolean; Date: string; EditedBy?: string }[]): void {
    const list = this.getTeacherAttendance();
    const timestamp = new Date().toLocaleString();
    for (const rec of records) {
      const idx = list.findIndex(a => a.TeacherID === rec.TeacherID && a.Date === rec.Date);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          Status: rec.Status,
          EditedBy: rec.EditedBy || list[idx].EditedBy,
          EditedAt: rec.EditedBy ? timestamp : list[idx].EditedAt,
        };
      } else {
        const nextId = list.length > 0 ? Math.max(...list.map(a => a.ID)) + 1 : 1;
        list.push({
          ID: nextId,
          TeacherID: rec.TeacherID,
          Status: rec.Status,
          Date: rec.Date,
          EditedBy: rec.EditedBy,
          EditedAt: rec.EditedBy ? timestamp : undefined,
        });
      }
    }
    setItem(KEYS.TEACHER_ATTENDANCE, list);
  },

  getStudentAttendance(): StudentAttendanceItem[] {
    return getItem<StudentAttendanceItem[]>(KEYS.STUDENT_ATTENDANCE, []);
  },
  saveStudentAttendance(records: { ClassID: number; SubjectID: number; RollNo: string; Status: boolean; Date: string; EditedBy?: string }[]): void {
    const list = this.getStudentAttendance();
    const timestamp = new Date().toLocaleString();
    for (const rec of records) {
      const idx = list.findIndex(a => a.ClassID === rec.ClassID && a.SubjectID === rec.SubjectID && a.RollNo === rec.RollNo && a.Date === rec.Date);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          Status: rec.Status,
          EditedBy: rec.EditedBy || list[idx].EditedBy,
          EditedAt: rec.EditedBy ? timestamp : list[idx].EditedAt,
        };
      } else {
        const nextId = list.length > 0 ? Math.max(...list.map(a => a.ID)) + 1 : 1;
        list.push({
          ID: nextId,
          ClassID: rec.ClassID,
          SubjectID: rec.SubjectID,
          RollNo: rec.RollNo,
          Status: rec.Status,
          Date: rec.Date,
          EditedBy: rec.EditedBy,
          EditedAt: rec.EditedBy ? timestamp : undefined,
        });
      }
    }
    setItem(KEYS.STUDENT_ATTENDANCE, list);
  },
  recordStudentAttendance(records: { ClassID: number; SubjectID: number; RollNo: string; Status: boolean; Date: string; EditedBy?: string }[]): void {
    this.saveStudentAttendance(records);
  },
  recordTeacherAttendance(records: { TeacherID: number; Status: boolean; Date: string; EditedBy?: string }[]): void {
    this.saveTeacherAttendance(records);
  },

  // Honors & Top Students Calculation
  getTopStudents(classId?: number): { student: StudentItem; avgGrade: number; rank: number }[] {
    const students = this.getStudents();
    const grades = this.getGrades();

    const targetStudents = classId ? students.filter(s => s.ClassID === classId) : students;

    const scores: { student: StudentItem; avgGrade: number }[] = [];
    for (const s of targetStudents) {
      const sGrades = grades.filter(g => g.StudentID === s.StudentID && typeof g.FinalGrade === 'number');
      if (sGrades.length > 0) {
        const total = sGrades.reduce((acc, curr) => acc + (curr.FinalGrade as number), 0);
        scores.push({ student: s, avgGrade: Math.round(total / sGrades.length) });
      }
    }

    scores.sort((a, b) => b.avgGrade - a.avgGrade);
    return scores.map((item, idx) => ({ ...item, rank: idx + 1 }));
  },

  // Backward compatibility methods
  getFees(): FeesItem[] {
    return getItem<FeesItem[]>('jmaa_legacy_fees', [
      { FeesID: 1, ClassID: 1, FeesAmount: 1800 },
      { FeesID: 2, ClassID: 7, FeesAmount: 2400 },
      { FeesID: 3, ClassID: 10, FeesAmount: 3000 },
    ]);
  },
  saveFees(item: Omit<FeesItem, 'FeesID'> & { FeesID?: number }): FeesItem {
    const list = this.getFees();
    if (item.FeesID && item.FeesID > 0) {
      const idx = list.findIndex(f => f.FeesID === item.FeesID);
      if (idx >= 0) {
        list[idx] = { FeesID: item.FeesID, ClassID: Number(item.ClassID), FeesAmount: Number(item.FeesAmount) };
        setItem('jmaa_legacy_fees', list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(f => f.FeesID)) + 1 : 1;
    const newItem: FeesItem = { FeesID: nextId, ClassID: Number(item.ClassID), FeesAmount: Number(item.FeesAmount) };
    list.push(newItem);
    setItem('jmaa_legacy_fees', list);
    return newItem;
  },
  deleteFees(id: number): void {
    const list = this.getFees().filter(f => f.FeesID !== id);
    setItem('jmaa_legacy_fees', list);
  },

  getExams(): ExamItem[] {
    return getItem<ExamItem[]>('jmaa_legacy_exams', [
      { ExamID: 1, ClassID: 1, SubjectID: 1, RollNo: 'R101', TotalMarks: 95, OutofMarks: 100 },
      { ExamID: 2, ClassID: 1, SubjectID: 1, RollNo: 'R102', TotalMarks: 98, OutofMarks: 100 },
    ]);
  },
  saveExam(item: Omit<ExamItem, 'ExamID'> & { ExamID?: number }): ExamItem {
    const list = this.getExams();
    if (item.ExamID && item.ExamID > 0) {
      const idx = list.findIndex(e => e.ExamID === item.ExamID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, ExamID: item.ExamID };
        setItem('jmaa_legacy_exams', list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(e => e.ExamID)) + 1 : 1;
    const newItem: ExamItem = { ...item, ExamID: nextId };
    list.push(newItem);
    setItem('jmaa_legacy_exams', list);
    return newItem;
  },
  deleteExam(id: number): void {
    const list = this.getExams().filter(e => e.ExamID !== id);
    setItem('jmaa_legacy_exams', list);
  },

  getExpenses(): ExpenseItem[] {
    return getItem<ExpenseItem[]>('jmaa_legacy_expenses', [
      { ExpenseID: 1, ClassID: 1, SubjectID: 1, ChargeAmount: 350, Date: '2026-09-01', Remarks: 'Tajweed Audio System' },
      { ExpenseID: 2, ClassID: 7, SubjectID: 4, ChargeAmount: 500, Date: '2026-09-05', Remarks: 'Fiqh Reference Books' },
    ]);
  },
  saveExpense(item: Omit<ExpenseItem, 'ExpenseID'> & { ExpenseID?: number }): ExpenseItem {
    const list = this.getExpenses();
    if (item.ExpenseID && item.ExpenseID > 0) {
      const idx = list.findIndex(e => e.ExpenseID === item.ExpenseID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, ExpenseID: item.ExpenseID };
        setItem('jmaa_legacy_expenses', list);
        return list[idx];
      }
    }
    const nextId = list.length > 0 ? Math.max(...list.map(e => e.ExpenseID)) + 1 : 1;
    const newItem: ExpenseItem = { ...item, ExpenseID: nextId };
    list.push(newItem);
    setItem('jmaa_legacy_expenses', list);
    return newItem;
  },
  deleteExpense(id: number): void {
    const list = this.getExpenses().filter(e => e.ExpenseID !== id);
    setItem('jmaa_legacy_expenses', list);
  },
};
