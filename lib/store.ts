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
  DepartmentType,
  FeesItem,
  ExamItem,
  ExpenseItem,
} from './types';

export const initialSettings: SystemSettings = {
  schoolNameEn: 'Jamiatu Monib Alkuzbary Al-Arabia',
  schoolNameAr: 'جامعة منيب الكزبري العربية',
  systemName: 'JMAA-MoritAko',
  gradeLockDays: 7,
  gradeEditWindowHours: 24, // Default allowed editing time given by principal/admin after submission
  libraryDriveFolderUrl: 'https://drive.google.com/drive/folders/1fCXKezhMzm93fm9S98keWyxLfG-N2NDf?usp=drive_link',
};

// 1. Classes across 5-Days and 2-Days departments
export const initialClasses: ClassItem[] = [
  // 5-Days Department
  // Ibtidaiyyah (Grade 1 to 6)
  { ClassID: 1, ClassName: 'Ibtidaiyyah - Grade 1-A', Department: '5-days', Level: 'Ibtidaiyyah', YearGrade: 1, AdviserID: 2 },
  { ClassID: 2, ClassName: 'Ibtidaiyyah - Grade 2-A', Department: '5-days', Level: 'Ibtidaiyyah', YearGrade: 2, AdviserID: 3 },
  { ClassID: 3, ClassName: 'Ibtidaiyyah - Grade 3-A', Department: '5-days', Level: 'Ibtidaiyyah', YearGrade: 3, AdviserID: 4 },
  { ClassID: 4, ClassName: 'Ibtidaiyyah - Grade 4-A', Department: '5-days', Level: 'Ibtidaiyyah', YearGrade: 4, AdviserID: 2 },
  { ClassID: 5, ClassName: 'Ibtidaiyyah - Grade 5-A', Department: '5-days', Level: 'Ibtidaiyyah', YearGrade: 5, AdviserID: 3 },
  { ClassID: 6, ClassName: 'Ibtidaiyyah - Grade 6-A', Department: '5-days', Level: 'Ibtidaiyyah', YearGrade: 6, AdviserID: 4 },
  // Mutawassit (1 to 3)
  { ClassID: 7, ClassName: 'Mutawassit - Year 1-A', Department: '5-days', Level: 'Mutawassit', YearGrade: 1, AdviserID: 2 },
  { ClassID: 8, ClassName: 'Mutawassit - Year 2-A', Department: '5-days', Level: 'Mutawassit', YearGrade: 2, AdviserID: 5 },
  { ClassID: 9, ClassName: 'Mutawassit - Year 3-A', Department: '5-days', Level: 'Mutawassit', YearGrade: 3, AdviserID: 4 },
  // Thanawi (1 to 3)
  { ClassID: 10, ClassName: 'Thanawi - Year 1-A', Department: '5-days', Level: 'Thanawi', YearGrade: 1, AdviserID: 5 },
  { ClassID: 11, ClassName: 'Thanawi - Year 2-A', Department: '5-days', Level: 'Thanawi', YearGrade: 2, AdviserID: 2 },
  { ClassID: 12, ClassName: 'Thanawi - Year 3-A', Department: '5-days', Level: 'Thanawi', YearGrade: 3, AdviserID: 3 },
  // Kulliyatu Shariah (1 to 4)
  { ClassID: 13, ClassName: 'Kulliyatu Shariah - Year 1', Department: '5-days', Level: 'Kulliyatu Shariah', YearGrade: 1, AdviserID: 1 },
  { ClassID: 14, ClassName: 'Kulliyatu Shariah - Year 2', Department: '5-days', Level: 'Kulliyatu Shariah', YearGrade: 2, AdviserID: 1 },
  { ClassID: 15, ClassName: 'Kulliyatu Shariah - Year 3', Department: '5-days', Level: 'Kulliyatu Shariah', YearGrade: 3, AdviserID: 5 },
  { ClassID: 16, ClassName: 'Kulliyatu Shariah - Year 4', Department: '5-days', Level: 'Kulliyatu Shariah', YearGrade: 4, AdviserID: 5 },
  // Kulliyatu Dawa (1 to 4)
  { ClassID: 17, ClassName: 'Kulliyatu Dawa - Year 1', Department: '5-days', Level: 'Kulliyatu Dawa', YearGrade: 1, AdviserID: 2 },
  { ClassID: 18, ClassName: 'Kulliyatu Dawa - Year 2', Department: '5-days', Level: 'Kulliyatu Dawa', YearGrade: 2, AdviserID: 4 },
  { ClassID: 19, ClassName: 'Kulliyatu Dawa - Year 3', Department: '5-days', Level: 'Kulliyatu Dawa', YearGrade: 3, AdviserID: 2 },
  { ClassID: 20, ClassName: 'Kulliyatu Dawa - Year 4', Department: '5-days', Level: 'Kulliyatu Dawa', YearGrade: 4, AdviserID: 4 },
  // Kulliyatu Tarbiya (1 to 4)
  { ClassID: 21, ClassName: 'Kulliyatu Tarbiya - Year 1', Department: '5-days', Level: 'Kulliyatu Tarbiya', YearGrade: 1, AdviserID: 3 },
  { ClassID: 22, ClassName: 'Kulliyatu Tarbiya - Year 2', Department: '5-days', Level: 'Kulliyatu Tarbiya', YearGrade: 2, AdviserID: 3 },
  { ClassID: 23, ClassName: 'Kulliyatu Tarbiya - Year 3', Department: '5-days', Level: 'Kulliyatu Tarbiya', YearGrade: 3, AdviserID: 3 },
  { ClassID: 24, ClassName: 'Kulliyatu Tarbiya - Year 4', Department: '5-days', Level: 'Kulliyatu Tarbiya', YearGrade: 4, AdviserID: 3 },

  // 2-Days Department
  // Ibtidaiyyah (Grade 1 to 6)
  { ClassID: 25, ClassName: '2-Days Ibtidaiyyah - Grade 1', Department: '2-days', Level: 'Ibtidaiyyah', YearGrade: 1, AdviserID: 4 },
  { ClassID: 26, ClassName: '2-Days Ibtidaiyyah - Grade 2', Department: '2-days', Level: 'Ibtidaiyyah', YearGrade: 2, AdviserID: 4 },
  { ClassID: 27, ClassName: '2-Days Ibtidaiyyah - Grade 3', Department: '2-days', Level: 'Ibtidaiyyah', YearGrade: 3, AdviserID: 2 },
  { ClassID: 28, ClassName: '2-Days Ibtidaiyyah - Grade 4', Department: '2-days', Level: 'Ibtidaiyyah', YearGrade: 4, AdviserID: 3 },
  { ClassID: 29, ClassName: '2-Days Ibtidaiyyah - Grade 5', Department: '2-days', Level: 'Ibtidaiyyah', YearGrade: 5, AdviserID: 4 },
  { ClassID: 30, ClassName: '2-Days Ibtidaiyyah - Grade 6', Department: '2-days', Level: 'Ibtidaiyyah', YearGrade: 6, AdviserID: 2 },
  // Mutawassit (1 to 3)
  { ClassID: 31, ClassName: '2-Days Mutawassit - Year 1', Department: '2-days', Level: 'Mutawassit', YearGrade: 1, AdviserID: 5 },
  { ClassID: 32, ClassName: '2-Days Mutawassit - Year 2', Department: '2-days', Level: 'Mutawassit', YearGrade: 2, AdviserID: 5 },
  { ClassID: 33, ClassName: '2-Days Mutawassit - Year 3', Department: '2-days', Level: 'Mutawassit', YearGrade: 3, AdviserID: 2 },
  // Thanawi (1 to 3)
  { ClassID: 34, ClassName: '2-Days Thanawi - Year 1', Department: '2-days', Level: 'Thanawi', YearGrade: 1, AdviserID: 5 },
  { ClassID: 35, ClassName: '2-Days Thanawi - Year 2', Department: '2-days', Level: 'Thanawi', YearGrade: 2, AdviserID: 3 },
  { ClassID: 36, ClassName: '2-Days Thanawi - Year 3', Department: '2-days', Level: 'Thanawi', YearGrade: 3, AdviserID: 1 },
  // Kulliyatu Tarbiyah (1 to 4)
  { ClassID: 37, ClassName: '2-Days Kulliyatu Tarbiyah - Year 1', Department: '2-days', Level: 'Kulliyatu Tarbiyah', YearGrade: 1, AdviserID: 3 },
  { ClassID: 38, ClassName: '2-Days Kulliyatu Tarbiyah - Year 2', Department: '2-days', Level: 'Kulliyatu Tarbiyah', YearGrade: 2, AdviserID: 3 },
  { ClassID: 39, ClassName: '2-Days Kulliyatu Tarbiyah - Year 3', Department: '2-days', Level: 'Kulliyatu Tarbiyah', YearGrade: 3, AdviserID: 2 },
  { ClassID: 40, ClassName: '2-Days Kulliyatu Tarbiyah - Year 4', Department: '2-days', Level: 'Kulliyatu Tarbiyah', YearGrade: 4, AdviserID: 1 },
];

// 2. Faculty & Mudir
export const initialTeachers: TeacherItem[] = [
  {
    TeacherID: 1,
    Name: 'Dr. Monib Alkuzbary',
    NameArabic: 'د. منيب الكزبري',
    Gender: 'Male',
    Tribe: 'Quraysh',
    Nationality: 'Saudi / Arab',
    BirthDate: '1972-03-15',
    BirthPlace: 'Damascus / Riyadh',
    Address: 'Central Academic Quarters, Campus A',
    MobileNumber: '+966 50 123 4567',
    Email: 'mudir@jmaa.edu',
    Password: 'mudir123',
    IdNumber: 'TCH-001-MDR',
    Degree: 'Ph.D. in Islamic Jurisprudence (Fiqh & Usool)',
    AdmissionDate: '2010-09-01',
    Remarks: 'Principal (Mudir Al-Aam) & Senior Professor of Usul Al-Fiqh',
    ProfilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    IsMudir: true,
  },
  {
    TeacherID: 2,
    Name: 'Sheikh Ahmad Al-Farouq',
    NameArabic: 'الشيخ أحمد الفاروق',
    Gender: 'Male',
    Tribe: 'Bani Hashim',
    Nationality: 'Syrian',
    BirthDate: '1984-06-20',
    BirthPlace: 'Aleppo',
    Address: 'Al-Noor District, Faculty Housing 12',
    MobileNumber: '+966 55 234 5678',
    Email: 'teacher@school.edu',
    Password: 'teacher123',
    IdNumber: 'TCH-002-FAR',
    Degree: 'M.A. in Quranic Exegesis (Tafseer & Tajweed)',
    AdmissionDate: '2016-08-15',
    Remarks: 'Head of Quranic Recitation & Department Adviser',
    ProfilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    IsMudir: false,
  },
  {
    TeacherID: 3,
    Name: 'Ustadha Fatima Al-Zahra',
    NameArabic: 'الأستاذة فاطمة الزهراء',
    Gender: 'Female',
    Tribe: 'Tamim',
    Nationality: 'Egyptian',
    BirthDate: '1988-11-04',
    BirthPlace: 'Cairo',
    Address: 'Rawdah District, Villa 4B',
    MobileNumber: '+966 54 345 6789',
    Email: 'fatima@jmaa.edu',
    Password: 'teacher123',
    IdNumber: 'TCH-003-ZAH',
    Degree: 'M.Ed. in Islamic Education (Tarbiya)',
    AdmissionDate: '2018-09-01',
    Remarks: 'Dean of Kulliyatu Tarbiya',
    ProfilePic: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    IsMudir: false,
  },
  {
    TeacherID: 4,
    Name: 'Sheikh Bilal Mansoor',
    NameArabic: 'الشيخ بلال منصور',
    Gender: 'Male',
    Tribe: 'Ansari',
    Nationality: 'Jordanian',
    BirthDate: '1986-02-18',
    BirthPlace: 'Amman',
    Address: 'Faculty Building 3, Apt 101',
    MobileNumber: '+966 56 456 7890',
    Email: 'bilal@jmaa.edu',
    Password: 'teacher123',
    IdNumber: 'TCH-004-MAN',
    Degree: 'M.A. in Arabic Language & Grammar (Nahw & Sarf)',
    AdmissionDate: '2017-09-01',
    Remarks: 'Senior Lecturer in Arabic Linguistics',
    ProfilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    IsMudir: false,
  },
  {
    TeacherID: 5,
    Name: 'Dr. Tariq Al-Hashimi',
    NameArabic: 'د. طارق الهاشمي',
    Gender: 'Male',
    Tribe: 'Hashimi',
    Nationality: 'Iraqi',
    BirthDate: '1979-08-12',
    BirthPlace: 'Baghdad',
    Address: 'Campus Avenue 8, Villa 15',
    MobileNumber: '+966 53 567 8901',
    Email: 'tariq@jmaa.edu',
    Password: 'teacher123',
    IdNumber: 'TCH-005-HAS',
    Degree: 'Ph.D. in Hadith Sciences & Sanad',
    AdmissionDate: '2015-09-01',
    Remarks: 'Professor of Hadith Literature & Vice Dean',
    ProfilePic: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    IsMudir: false,
  },
  {
    TeacherID: 6,
    Name: 'Ustadh Al-Yasa',
    NameArabic: 'اليسع',
    Gender: 'Male',
    Nationality: 'Saudi',
    Email: 'alyasa@jmaa.edu',
    Password: 'teacher123',
    IdNumber: 'TCH-006-YAS',
    Degree: 'B.A. in Islamic Jurisprudence (Fiqh)',
    AdmissionDate: '2019-09-01',
    Remarks: 'Lecturer of Fiqh',
    ProfilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    IsMudir: false,
  },
  {
    TeacherID: 7,
    Name: 'Ustadh Ryan Madid',
    NameArabic: 'ريان',
    Gender: 'Male',
    Nationality: 'Filipino / Arab',
    Email: 'ryan@jmaa.edu',
    Password: 'teacher123',
    IdNumber: 'TCH-007-RYN',
    Degree: 'B.S. in Islamic Theology & Tawheed',
    AdmissionDate: '2020-08-15',
    Remarks: 'Lecturer of Tawheed & Islamic Beliefs',
    ProfilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    IsMudir: false,
  },
];

// 3. Subjects
export const initialSubjects: SubjectItem[] = [
  { SubjectID: 1, ClassID: 1, SubjectClass: 'Fiqh (Jurisprudence)', SubjectCode: 'FIQ-101', SubjectArabic: 'فقه', Semester: 'Both' },
  { SubjectID: 2, ClassID: 1, SubjectClass: 'Tawheed (Monotheism)', SubjectCode: 'TWH-101', SubjectArabic: 'توحيد', Semester: 'Both' },
  { SubjectID: 3, ClassID: 1, SubjectClass: 'Quran & Tajweed', SubjectCode: 'QUR-101', SubjectArabic: 'قرآن', Semester: 'Both' },
  { SubjectID: 4, ClassID: 1, SubjectClass: 'Tabeer (Arabic Expression)', SubjectCode: 'TBR-101', SubjectArabic: 'تعبير', Semester: 'Both' },
  { SubjectID: 5, ClassID: 1, SubjectClass: 'Nusoos (Arabic Literature)', SubjectCode: 'NSS-101', SubjectArabic: 'نصوص', Semester: 'Both' },
  { SubjectID: 6, ClassID: 1, SubjectClass: 'Islamic Morals (Adab & Akhlaq)', SubjectCode: 'ADB-101', SubjectArabic: 'آداب وأخلاق', Semester: 'Both' },
  { SubjectID: 7, ClassID: 7, SubjectClass: 'Fiqh Al-Ibadat (Jurisprudence)', SubjectCode: 'FIQ-201', SubjectArabic: 'فقه العبادات', Semester: 'Both' },
  { SubjectID: 8, ClassID: 7, SubjectClass: 'Nahw & Sarf (Arabic Grammar)', SubjectCode: 'ARB-201', SubjectArabic: 'نحو وصرف', Semester: 'Both' },
  { SubjectID: 9, ClassID: 7, SubjectClass: 'Seerah & Islamic History', SubjectCode: 'SIR-201', SubjectArabic: 'سيرة وتاريخ', Semester: 'Both' },
  { SubjectID: 10, ClassID: 10, SubjectClass: 'Usool Al-Hadith', SubjectCode: 'HAD-301', SubjectArabic: 'أصول الحديث', Semester: 'Both' },
  { SubjectID: 11, ClassID: 10, SubjectClass: 'Aqeedah & Islamic Theology', SubjectCode: 'AQD-301', SubjectArabic: 'عقيدة إسلامية', Semester: 'Both' },
  { SubjectID: 12, ClassID: 13, SubjectClass: 'Advanced Usul Al-Fiqh', SubjectCode: 'SHR-401', SubjectArabic: 'أصول الفقه المتقدم', Semester: 'Both' },
  { SubjectID: 13, ClassID: 13, SubjectClass: 'Comparative Islamic Jurisprudence', SubjectCode: 'SHR-402', SubjectArabic: 'فقه مقارن', Semester: 'Both' },
  { SubjectID: 14, ClassID: 17, SubjectClass: 'Principles of Dawa & Dialogue', SubjectCode: 'DAW-401', SubjectArabic: 'أصول الدعوة والحوار', Semester: 'Both' },
  { SubjectID: 15, ClassID: 21, SubjectClass: 'Educational Psychology & Pedagogy', SubjectCode: 'TRB-401', SubjectArabic: 'علم النفس التربوي', Semester: 'Both' },
  { SubjectID: 16, ClassID: 15, SubjectClass: 'Fiqh Al-Muamalat (Jurisprudence)', SubjectCode: 'FIQ-301', SubjectArabic: 'فقه', Semester: 'Both' },
  // 2-Days Department Subjects (Class 25)
  { SubjectID: 17, ClassID: 25, SubjectClass: 'Fiqh (Jurisprudence)', SubjectCode: 'FIQ-101-W', SubjectArabic: 'فقه', Semester: 'Both' },
  { SubjectID: 18, ClassID: 25, SubjectClass: 'Tawheed (Monotheism)', SubjectCode: 'TWH-101-W', SubjectArabic: 'توحيد', Semester: 'Both' },
  { SubjectID: 19, ClassID: 25, SubjectClass: 'Quran & Tajweed', SubjectCode: 'QUR-101-W', SubjectArabic: 'قرآن', Semester: 'Both' },
  { SubjectID: 20, ClassID: 25, SubjectClass: 'Islamic Morals (Adab & Akhlaq)', SubjectCode: 'ADB-101-W', SubjectArabic: 'آداب وأخلاق', Semester: 'Both' },
  // Nashat (Student Activity) Subjects - Managed exclusively by SSG (مجلس الطلبة)
  { SubjectID: 21, ClassID: 1, SubjectClass: 'Nashat (Student Activity)', SubjectCode: 'NST-101', SubjectArabic: 'نشاط', Semester: 'Both', IsNashat: true },
  { SubjectID: 22, ClassID: 7, SubjectClass: 'Nashat (Student Activity)', SubjectCode: 'NST-201', SubjectArabic: 'نشاط', Semester: 'Both', IsNashat: true },
  { SubjectID: 23, ClassID: 10, SubjectClass: 'Nashat (Student Activity)', SubjectCode: 'NST-301', SubjectArabic: 'نشاط', Semester: 'Both', IsNashat: true },
  { SubjectID: 24, ClassID: 13, SubjectClass: 'Nashat (Student Activity)', SubjectCode: 'NST-401', SubjectArabic: 'نشاط', Semester: 'Both', IsNashat: true },
  { SubjectID: 25, ClassID: 15, SubjectClass: 'Nashat (Student Activity)', SubjectCode: 'NST-501', SubjectArabic: 'نشاط', Semester: 'Both', IsNashat: true },
  { SubjectID: 26, ClassID: 25, SubjectClass: 'Nashat (Student Activity)', SubjectCode: 'NST-101-W', SubjectArabic: 'نشاط', Semester: 'Both', IsNashat: true },
];

// 4. Subject-Teacher Mappings
export const initialSubjectTeachers: SubjectTeacherItem[] = [
  { ID: 1, ClassID: 1, SubjectID: 1, TeacherID: 6 }, // اليسع (Fiqh)
  { ID: 2, ClassID: 1, SubjectID: 2, TeacherID: 7 }, // ريان (Tawheed)
  { ID: 3, ClassID: 1, SubjectID: 3, TeacherID: 2 }, // الشيخ أحمد (Quran)
  { ID: 4, ClassID: 1, SubjectID: 4, TeacherID: 4 }, // الشيخ بلال (Tabeer)
  { ID: 5, ClassID: 1, SubjectID: 5, TeacherID: 6 }, // اليسع (Nusoos)
  { ID: 6, ClassID: 1, SubjectID: 6, TeacherID: 3 }, // Ustadha Fatima (Adab)
  { ID: 7, ClassID: 7, SubjectID: 7, TeacherID: 1 },
  { ID: 8, ClassID: 7, SubjectID: 8, TeacherID: 4 },
  { ID: 9, ClassID: 7, SubjectID: 9, TeacherID: 5 },
  { ID: 10, ClassID: 10, SubjectID: 10, TeacherID: 5 },
  { ID: 11, ClassID: 10, SubjectID: 11, TeacherID: 2 },
  { ID: 12, ClassID: 13, SubjectID: 12, TeacherID: 1 },
  { ID: 13, ClassID: 13, SubjectID: 13, TeacherID: 5 },
  { ID: 14, ClassID: 17, SubjectID: 14, TeacherID: 2 },
  { ID: 15, ClassID: 21, SubjectID: 15, TeacherID: 3 },
  { ID: 16, ClassID: 15, SubjectID: 16, TeacherID: 2 },
  // 2-Days mappings
  { ID: 17, ClassID: 25, SubjectID: 17, TeacherID: 6 }, // اليسع (Fiqh)
  { ID: 18, ClassID: 25, SubjectID: 18, TeacherID: 7 }, // ريان (Tawheed)
  { ID: 19, ClassID: 25, SubjectID: 19, TeacherID: 2 }, // الشيخ أحمد (Quran)
  { ID: 20, ClassID: 25, SubjectID: 20, TeacherID: 3 }, // فاطمة (Adab)
  // SSG Nashat Mappings
  { ID: 21, ClassID: 1, SubjectID: 21, TeacherID: 88 },
  { ID: 22, ClassID: 7, SubjectID: 22, TeacherID: 88 },
  { ID: 23, ClassID: 10, SubjectID: 23, TeacherID: 88 },
  { ID: 24, ClassID: 13, SubjectID: 24, TeacherID: 88 },
  { ID: 25, ClassID: 15, SubjectID: 25, TeacherID: 88 },
  { ID: 26, ClassID: 25, SubjectID: 26, TeacherID: 88 },
];

// 5. Weekly Class Schedules
export const initialSchedules: ClassScheduleItem[] = [
  // Class 1 - Sunday
  { ID: 1, ClassID: 1, SubjectID: 3, TeacherID: 2, Day: 'Sunday', StartTime: '07:00', EndTime: '08:30', Room: 'Hall 101' },
  { ID: 2, ClassID: 1, SubjectID: 1, TeacherID: 6, Day: 'Sunday', StartTime: '08:30', EndTime: '09:30', Room: 'Hall 101' },
  { ID: 3, ClassID: 1, SubjectID: 2, TeacherID: 7, Day: 'Sunday', StartTime: '09:40', EndTime: '10:40', Room: 'Hall 101' },
  { ID: 4, ClassID: 1, SubjectID: 4, TeacherID: 4, Day: 'Sunday', StartTime: '10:40', EndTime: '11:30', Room: 'Hall 101' },
  { ID: 5, ClassID: 1, SubjectID: 5, TeacherID: 6, Day: 'Sunday', StartTime: '11:30', EndTime: '12:30', Room: 'Hall 101' },

  // Class 1 - Monday
  { ID: 6, ClassID: 1, SubjectID: 2, TeacherID: 7, Day: 'Monday', StartTime: '07:00', EndTime: '08:30', Room: 'Hall 101' },
  { ID: 7, ClassID: 1, SubjectID: 3, TeacherID: 2, Day: 'Monday', StartTime: '08:30', EndTime: '09:30', Room: 'Hall 101' },
  { ID: 8, ClassID: 1, SubjectID: 1, TeacherID: 6, Day: 'Monday', StartTime: '09:40', EndTime: '10:40', Room: 'Hall 101' },
  { ID: 9, ClassID: 1, SubjectID: 6, TeacherID: 3, Day: 'Monday', StartTime: '10:40', EndTime: '11:30', Room: 'Hall 101' },
  { ID: 10, ClassID: 1, SubjectID: 4, TeacherID: 4, Day: 'Monday', StartTime: '11:30', EndTime: '12:30', Room: 'Hall 101' },

  // Class 1 - Tuesday
  { ID: 11, ClassID: 1, SubjectID: 1, TeacherID: 6, Day: 'Tuesday', StartTime: '07:00', EndTime: '08:30', Room: 'Hall 101' },
  { ID: 12, ClassID: 1, SubjectID: 5, TeacherID: 6, Day: 'Tuesday', StartTime: '08:30', EndTime: '09:30', Room: 'Hall 101' },
  { ID: 17, ClassID: 1, SubjectID: 3, TeacherID: 2, Day: 'Tuesday', StartTime: '09:40', EndTime: '10:40', Room: 'Hall 101' },
  { ID: 18, ClassID: 1, SubjectID: 2, TeacherID: 7, Day: 'Tuesday', StartTime: '10:40', EndTime: '11:30', Room: 'Hall 101' },
  { ID: 19, ClassID: 1, SubjectID: 6, TeacherID: 3, Day: 'Tuesday', StartTime: '11:30', EndTime: '12:30', Room: 'Hall 101' },

  // Class 1 - Wednesday
  { ID: 20, ClassID: 1, SubjectID: 3, TeacherID: 2, Day: 'Wednesday', StartTime: '07:00', EndTime: '08:30', Room: 'Hall 101' },
  { ID: 21, ClassID: 1, SubjectID: 4, TeacherID: 4, Day: 'Wednesday', StartTime: '08:30', EndTime: '09:30', Room: 'Hall 101' },
  { ID: 24, ClassID: 1, SubjectID: 1, TeacherID: 6, Day: 'Wednesday', StartTime: '09:40', EndTime: '10:40', Room: 'Hall 101' },
  { ID: 25, ClassID: 1, SubjectID: 5, TeacherID: 6, Day: 'Wednesday', StartTime: '10:40', EndTime: '11:30', Room: 'Hall 101' },
  { ID: 26, ClassID: 1, SubjectID: 2, TeacherID: 7, Day: 'Wednesday', StartTime: '11:30', EndTime: '12:30', Room: 'Hall 101' },

  // Class 1 - Thursday (Exact Mockup Match)
  { ID: 22, ClassID: 1, SubjectID: 1, TeacherID: 6, Day: 'Thursday', StartTime: '07:00', EndTime: '08:30', Room: 'Hall 101' },
  { ID: 27, ClassID: 1, SubjectID: 2, TeacherID: 7, Day: 'Thursday', StartTime: '08:30', EndTime: '09:30', Room: 'Hall 101' },
  { ID: 28, ClassID: 1, SubjectID: 2, TeacherID: 7, Day: 'Thursday', StartTime: '09:40', EndTime: '10:40', Room: 'Hall 101' },
  { ID: 29, ClassID: 1, SubjectID: 1, TeacherID: 6, Day: 'Thursday', StartTime: '10:40', EndTime: '11:30', Room: 'Hall 101' },
  { ID: 30, ClassID: 1, SubjectID: 1, TeacherID: 6, Day: 'Thursday', StartTime: '11:30', EndTime: '12:30', Room: 'Hall 101' },

  // Other Classes / Faculty Slots
  { ID: 31, ClassID: 7, SubjectID: 4, TeacherID: 1, Day: 'Sunday', StartTime: '08:00', EndTime: '09:30', Room: 'Lecture Hall B' },
  { ID: 32, ClassID: 7, SubjectID: 5, TeacherID: 4, Day: 'Sunday', StartTime: '10:30', EndTime: '11:30', Room: 'Lecture Hall B' },
  { ID: 33, ClassID: 10, SubjectID: 7, TeacherID: 5, Day: 'Sunday', StartTime: '08:30', EndTime: '10:00', Room: 'Seminar Room 2' },
  { ID: 34, ClassID: 13, SubjectID: 9, TeacherID: 1, Day: 'Sunday', StartTime: '10:00', EndTime: '11:30', Room: 'Auditorium 1' },
  { ID: 16, ClassID: 15, SubjectID: 16, TeacherID: 2, Day: 'Sunday', StartTime: '11:45', EndTime: '13:00', Room: 'Kulliyah Wing 3' },
  
  { ID: 35, ClassID: 7, SubjectID: 6, TeacherID: 5, Day: 'Monday', StartTime: '08:00', EndTime: '09:30', Room: 'Lecture Hall B' },
  { ID: 36, ClassID: 10, SubjectID: 8, TeacherID: 2, Day: 'Monday', StartTime: '10:30', EndTime: '12:00', Room: 'Seminar Room 2' },
  { ID: 37, ClassID: 17, SubjectID: 11, TeacherID: 2, Day: 'Monday', StartTime: '13:00', EndTime: '14:30', Room: 'Dawa Hall' },
  { ID: 38, ClassID: 21, SubjectID: 12, TeacherID: 3, Day: 'Monday', StartTime: '10:00', EndTime: '11:30', Room: 'Tarbiya Lab' },

  { ID: 39, ClassID: 15, SubjectID: 16, TeacherID: 2, Day: 'Tuesday', StartTime: '09:30', EndTime: '11:00', Room: 'Kulliyah Wing 3' },
  { ID: 40, ClassID: 10, SubjectID: 11, TeacherID: 2, Day: 'Tuesday', StartTime: '11:15', EndTime: '12:30', Room: 'Seminar Room 2' },

  { ID: 41, ClassID: 15, SubjectID: 16, TeacherID: 2, Day: 'Wednesday', StartTime: '10:00', EndTime: '11:30', Room: 'Kulliyah Wing 3' },
  { ID: 23, ClassID: 17, SubjectID: 14, TeacherID: 2, Day: 'Thursday', StartTime: '10:00', EndTime: '11:30', Room: 'Dawa Hall' },

  // 2-Days Department Schedule (Class 25 - Friday & Saturday)
  { ID: 13, ClassID: 25, SubjectID: 17, TeacherID: 6, Day: 'Friday', StartTime: '07:00', EndTime: '08:30', Room: 'Weekend Wing 1' },
  { ID: 42, ClassID: 25, SubjectID: 18, TeacherID: 7, Day: 'Friday', StartTime: '08:30', EndTime: '09:30', Room: 'Weekend Wing 1' },
  { ID: 43, ClassID: 25, SubjectID: 19, TeacherID: 2, Day: 'Friday', StartTime: '09:40', EndTime: '10:40', Room: 'Weekend Wing 1' },
  { ID: 44, ClassID: 25, SubjectID: 20, TeacherID: 3, Day: 'Friday', StartTime: '10:40', EndTime: '11:30', Room: 'Weekend Wing 1' },
  { ID: 45, ClassID: 25, SubjectID: 17, TeacherID: 6, Day: 'Friday', StartTime: '11:30', EndTime: '12:30', Room: 'Weekend Wing 1' },

  { ID: 46, ClassID: 25, SubjectID: 19, TeacherID: 2, Day: 'Saturday', StartTime: '07:00', EndTime: '08:30', Room: 'Weekend Wing 1' },
  { ID: 47, ClassID: 25, SubjectID: 17, TeacherID: 6, Day: 'Saturday', StartTime: '08:30', EndTime: '09:30', Room: 'Weekend Wing 1' },
  { ID: 48, ClassID: 25, SubjectID: 18, TeacherID: 7, Day: 'Saturday', StartTime: '09:40', EndTime: '10:40', Room: 'Weekend Wing 1' },
  { ID: 49, ClassID: 25, SubjectID: 17, TeacherID: 6, Day: 'Saturday', StartTime: '10:40', EndTime: '11:30', Room: 'Weekend Wing 1' },
  { ID: 50, ClassID: 25, SubjectID: 18, TeacherID: 7, Day: 'Saturday', StartTime: '11:30', EndTime: '12:30', Room: 'Weekend Wing 1' },

  { ID: 14, ClassID: 31, SubjectID: 4, TeacherID: 5, Day: 'Friday', StartTime: '09:45', EndTime: '11:15', Room: 'Weekend Wing 2' },
  { ID: 15, ClassID: 37, SubjectID: 12, TeacherID: 3, Day: 'Saturday', StartTime: '08:30', EndTime: '10:30', Room: 'Weekend Wing 3' },
];

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

function getItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
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
    const list = getItem<SubjectItem[]>(KEYS.SUBJECTS, initialSubjects);
    let updated = false;
    for (const initSub of initialSubjects) {
      const idx = list.findIndex(s => s.SubjectID === initSub.SubjectID);
      if (idx === -1) {
        list.push(initSub);
        updated = true;
      } else if (!list[idx].SubjectArabic && initSub.SubjectArabic) {
        list[idx] = { ...list[idx], SubjectArabic: initSub.SubjectArabic, SubjectClass: initSub.SubjectClass };
        updated = true;
      }
    }
    if (updated) setItem(KEYS.SUBJECTS, list);
    return list;
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
    const list = getItem<SubjectTeacherItem[]>(KEYS.SUBJECT_TEACHERS, initialSubjectTeachers);
    let updated = false;
    for (const initST of initialSubjectTeachers) {
      const idx = list.findIndex(st => st.ID === initST.ID || (st.ClassID === initST.ClassID && st.SubjectID === initST.SubjectID && st.TeacherID === initST.TeacherID));
      if (idx === -1) {
        list.push(initST);
        updated = true;
      }
    }
    if (updated) setItem(KEYS.SUBJECT_TEACHERS, list);
    return list;
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
    const list = getItem<ClassScheduleItem[]>(KEYS.SCHEDULES, initialSchedules);
    let updated = false;
    for (const initSch of initialSchedules) {
      const idx = list.findIndex(s => s.ID === initSch.ID);
      if (idx === -1) {
        list.push(initSch);
        updated = true;
      } else if (
        list[idx].StartTime !== initSch.StartTime ||
        list[idx].EndTime !== initSch.EndTime ||
        list[idx].TeacherID !== initSch.TeacherID ||
        list[idx].SubjectID !== initSch.SubjectID
      ) {
        list[idx] = { ...initSch };
        updated = true;
      }
    }
    if (updated) setItem(KEYS.SCHEDULES, list);
    return list;
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
    const list = getItem<StudentItem[]>(KEYS.STUDENTS, initialStudents);
    let updated = false;
    for (const initStd of initialStudents) {
      const idx = list.findIndex(s => s.StudentID === initStd.StudentID);
      if (idx === -1) {
        list.push(initStd);
        updated = true;
      }
    }
    if (updated) setItem(KEYS.STUDENTS, list);
    return list;
  },
  saveStudent(item: Omit<StudentItem, 'StudentID'> & { StudentID?: number }): StudentItem {
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
    return newItem;
  },
  deleteStudent(id: number): void {
    const list = this.getStudents().filter(s => s.StudentID !== id);
    setItem(KEYS.STUDENTS, list);
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
        list.push(initG);
        updated = true;
      }
    }
    if (updated) setItem(KEYS.GRADES, list);
    return list;
  },
  // Grade Edit Time Window & Lock Controls
  getGradeEditWindowHours(): number {
    const s = this.getSettings();
    return s.gradeEditWindowHours || 24;
  },
  setGradeEditWindowHours(hours: number): void {
    this.updateSettings({ gradeEditWindowHours: hours });
  },
  checkGradeLock(grade: StudentGradeItem | undefined | null): {
    isLocked: boolean;
    remainingMs: number;
    expiresAt?: string;
    submittedAt?: string;
    allowedHours: number;
    status: 'unsubmitted' | 'editable_grace_period' | 'unlocked_by_admin' | 'expired_locked' | 'manually_locked';
  } {
    const defaultHours = this.getGradeEditWindowHours();
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

    const existingIdx = list.findIndex(
      g =>
        g.StudentID === item.StudentID &&
        g.ClassID === item.ClassID &&
        g.SubjectID === item.SubjectID &&
        g.Period === item.Period
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
    let savedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      const existingIdx = list.findIndex(
        g =>
          g.StudentID === item.StudentID &&
          g.ClassID === item.ClassID &&
          g.SubjectID === item.SubjectID &&
          g.Period === item.Period
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
