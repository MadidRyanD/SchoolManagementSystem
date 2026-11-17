'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DataStore,
  saveEBookBlob,
  isSubjectSpecificUrl,
} from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  ClassItem,
  SubjectItem,
  SubjectEBookItem,
  TeacherItem,
  SubjectTeacherItem,
  ClassScheduleItem,
  DepartmentType,
  StudentItem,
} from '@/lib/types';
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit,
  Plus,
  Search,
  UserCheck,
  Calendar,
  Clock,
  Crown,
  Sparkles,
  X,
  Building2,
  GraduationCap,
  MapPin,
  ClipboardList,
  ArrowUpRight,
  Upload,
  FileText,
  Layers,
} from 'lucide-react';
import EBookReaderModal from './EBookReaderModal';

type DayOfWeekKey =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Unscheduled';

const DAYS_META: Array<{
  key: DayOfWeekKey;
  labelEn: string;
  labelAr: string;
}> = [
  { key: 'Sunday', labelEn: 'Sunday', labelAr: 'يوم الأحد' },
  { key: 'Monday', labelEn: 'Monday', labelAr: 'يوم الإثنين' },
  { key: 'Tuesday', labelEn: 'Tuesday', labelAr: 'يوم الثلاثاء' },
  { key: 'Wednesday', labelEn: 'Wednesday', labelAr: 'يوم الأربعاء' },
  { key: 'Thursday', labelEn: 'Thursday', labelAr: 'يوم الخميس' },
  { key: 'Friday', labelEn: 'Friday', labelAr: 'يوم الجمعة' },
  { key: 'Saturday', labelEn: 'Saturday', labelAr: 'يوم السبت' },
  { key: 'Unscheduled', labelEn: 'Unscheduled', labelAr: 'بدون موعد محدد' },
];

interface ScheduledSubjectEntry {
  entryKey: string;
  subject: SubjectItem;
  schedule: ClassScheduleItem | null;
  cls?: ClassItem;
  teacher?: TeacherItem | null;
  dayKey: DayOfWeekKey;
  startTime: string;
  endTime: string;
  room: string;
  occurrenceIndex: number;
  totalOccurrences: number;
}

export default function SubjectsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subjectEBooks, setSubjectEBooks] = useState<SubjectEBookItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  // Permissions & Current User
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student' || currentUser?.role === 'ssg';
  const canManage = isAdmin || isMudir;
  // Requirement 2: Students can't upload books, but Ustadh (teacher) / Admin / Principal (mudir) can
  const canUploadBooks = isTeacher || isAdmin || isMudir;

  // E-Book Reader / Upload Modal State (Strictly scoped to a single SubjectItem)
  const [readerModal, setReaderModal] = useState<{
    isOpen: boolean;
    subject: SubjectItem | null;
    classNameStr?: string;
    initialShowUpload?: boolean;
  }>({
    isOpen: false,
    subject: null,
    classNameStr: '',
    initialShowUpload: false,
  });

  const openSubjectBook = (sub: SubjectItem, initialShowUpload = false) => {
    const clsName = classes.find(c => c.ClassID === sub.ClassID)?.ClassName || '';
    setReaderModal({
      isOpen: true,
      subject: sub,
      classNameStr: clsName,
      initialShowUpload,
    });
  };

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<'all' | '5-days' | '2-days'>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<number>(0);
  const [filterDay, setFilterDay] = useState<string>('all');
  const [adminViewMode, setAdminViewMode] = useState<'grouped-by-day' | 'catalog'>('grouped-by-day');

  // Add / Edit Subject Modal State (Admin / Mudir)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal Form State
  const [selectedDept, setSelectedDept] = useState<DepartmentType>('5-days');
  const [selectedLevel, setSelectedLevel] = useState<string>('Ibtidaiyyah');
  const [selectedClassId, setSelectedClassId] = useState<number>(1);
  const [subjectName, setSubjectName] = useState('');
  const [subjectArabic, setSubjectArabic] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookDriveUrl, setBookDriveUrl] = useState('');
  const [modalBookFile, setModalBookFile] = useState<File | null>(null);

  // Optional instant assignment in modal
  const [assignNow, setAssignNow] = useState(false);
  const [modalTeacherId, setModalTeacherId] = useState<number>(0);
  const [modalDay, setModalDay] = useState<
    'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  >('Friday');
  const [modalStartTime, setModalStartTime] = useState('08:00');
  const [modalEndTime, setModalEndTime] = useState('09:00');
  const [modalRoom, setModalRoom] = useState('Hall 101');

  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick subject presets for easy 1-click filling (without shared Drive folder link)
  const subjectPresets = [
    { name: 'Quran & Tajweed', arabic: 'القرآن الكريم والتجويد', code: 'QRN' },
    { name: 'Tafseer al-Quran', arabic: 'تفسير القرآن الكريم', code: 'TFS' },
    { name: 'Hadith & Sunnah', arabic: 'الحديث النبوي الشريف', code: 'HDT' },
    { name: 'Fiqh al-Ibadat', arabic: 'فقه العبادات والمعاملات', code: 'FQH' },
    { name: 'Aqeedah & Tawheed', arabic: 'العقيدة الإسلامية والتوحيد', code: 'AQD' },
    { name: 'Arabic Grammar (Nahw & Sarf)', arabic: 'النحو والصرف', code: 'ARB' },
    { name: 'Sirah & Islamic History', arabic: 'السيرة النبوية والتاريخ الإسلامي', code: 'SRH' },
    { name: 'Mathematics', arabic: 'الرياضيات', code: 'MTH' },
    { name: 'English Language', arabic: 'اللغة الإنجليزية', code: 'ENG' },
    { name: 'General Science', arabic: 'العلوم العامة', code: 'SCI' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const clsList = DataStore.getClasses();
    setClasses(clsList);
    setSubjects(DataStore.getSubjects());
    setSubjectEBooks(DataStore.getSubjectEBooks());
    setTeachers(DataStore.getTeachers());
    setSubjectTeachers(DataStore.getSubjectTeachers());
    setSchedules(DataStore.getSchedules());
    setStudents(DataStore.getStudents());

    if (clsList.length > 0 && selectedClassId === 1) {
      setSelectedClassId(clsList[0].ClassID);
    }
  };

  // Count how many subject-specific E-Books exist for a given SubjectItem
  const getSubjectBookCount = (sub: SubjectItem): number => {
    const uploaded = subjectEBooks.filter(b => b.SubjectID === sub.SubjectID);
    const hasCustomUrl =
      isSubjectSpecificUrl(sub.BookDriveUrl) &&
      !uploaded.some(b => b.driveUrl === sub.BookDriveUrl);
    return uploaded.length + (hasCustomUrl ? 1 : 0);
  };

  // KPI metrics
  const stats = useMemo(() => {
    const total = subjects.length;
    const fiveDaysSubs = subjects.filter(s => {
      const c = classes.find(cl => cl.ClassID === s.ClassID);
      return c?.Department === '5-days';
    }).length;
    const twoDaysSubs = subjects.filter(s => {
      const c = classes.find(cl => cl.ClassID === s.ClassID);
      return c?.Department === '2-days';
    }).length;
    const allocatedSubs = subjectTeachers.length;
    return { total, fiveDaysSubs, twoDaysSubs, allocatedSubs };
  }, [subjects, classes, subjectTeachers]);

  // Classes filtered by selected department and level in Modal
  const modalAvailableClasses = useMemo(() => {
    return classes.filter(
      c => c.Department === selectedDept && (selectedLevel ? c.Level.includes(selectedLevel) : true)
    );
  }, [classes, selectedDept, selectedLevel]);

  useEffect(() => {
    if (modalAvailableClasses.length > 0) {
      const exists = modalAvailableClasses.some(c => c.ClassID === selectedClassId);
      if (!exists) {
        setSelectedClassId(modalAvailableClasses[0].ClassID);
      }
    }
  }, [modalAvailableClasses, selectedClassId]);

  const openAddModal = () => {
    setEditingId(null);
    setSubjectName('');
    setSubjectArabic('');
    setSubjectCode('');
    setBookTitle('');
    setBookDriveUrl('');
    setModalBookFile(null);
    setAssignNow(false);
    setSelectedDept('2-days');
    setSelectedLevel('Thanawi');
    if (classes.length > 0) setSelectedClassId(classes[0].ClassID);
    if (teachers.length > 0) setModalTeacherId(teachers[0].TeacherID);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SubjectItem) => {
    setEditingId(s.SubjectID);
    setSubjectName(s.SubjectClass);
    setSubjectArabic(s.SubjectArabic || '');
    setSubjectCode(s.SubjectCode || '');
    setBookTitle(s.BookTitle || '');
    setBookDriveUrl(isSubjectSpecificUrl(s.BookDriveUrl) ? s.BookDriveUrl || '' : '');
    setModalBookFile(null);
    setSelectedClassId(s.ClassID);
    const targetClass = classes.find(c => c.ClassID === s.ClassID);
    if (targetClass) {
      setSelectedDept(targetClass.Department);
      setSelectedLevel(targetClass.Level);
    }
    setAssignNow(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setModalBookFile(null);
  };

  const applyPreset = (preset: { name: string; arabic: string; code: string }) => {
    setSubjectName(preset.name);
    setSubjectArabic(preset.arabic);
    setBookTitle(preset.arabic ? `كتاب مقرر ${preset.arabic}` : `${preset.name} Course Textbook`);
    const targetClass = classes.find(c => c.ClassID === selectedClassId);
    const yearGrade = targetClass?.YearGrade || 1;
    setSubjectCode(`${preset.code}-${yearGrade}01`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can manage subjects.', type: 'error' });
      return;
    }
    if (!subjectName.trim() || !selectedClassId) {
      setMsg({ text: 'Subject name and target class are required.', type: 'error' });
      return;
    }

    const cleanUrl = isSubjectSpecificUrl(bookDriveUrl.trim()) ? bookDriveUrl.trim() : undefined;

    let savedSubject: SubjectItem;

    if (editingId) {
      savedSubject = DataStore.saveSubject({
        SubjectID: editingId,
        ClassID: selectedClassId,
        SubjectClass: subjectName.trim(),
        SubjectArabic: subjectArabic.trim() || undefined,
        SubjectCode: subjectCode.trim() || undefined,
        BookTitle: bookTitle.trim() || undefined,
        BookDriveUrl: cleanUrl,
      });
      setMsg({ text: `Subject "${subjectName}" updated successfully!`, type: 'success' });
    } else {
      savedSubject = DataStore.saveSubject({
        ClassID: selectedClassId,
        SubjectClass: subjectName.trim(),
        SubjectArabic: subjectArabic.trim() || undefined,
        SubjectCode: subjectCode.trim() || undefined,
        BookTitle: bookTitle.trim() || undefined,
        BookDriveUrl: cleanUrl,
      });
      setMsg({ text: `New subject "${subjectName}" added successfully!`, type: 'success' });
    }

    // If Admin/Principal selected a PDF/book file in the modal, save it specifically for this subject
    if (modalBookFile && currentUser) {
      const cleanFileName = modalBookFile.name.replace(/\.[^/.]+$/, '');
      const savedBook = DataStore.saveSubjectEBook({
        SubjectID: savedSubject.SubjectID,
        ClassID: savedSubject.ClassID,
        title:
          bookTitle.trim() ||
          cleanFileName ||
          `كتاب مقرر ${savedSubject.SubjectArabic || savedSubject.SubjectClass}`,
        fileName: modalBookFile.name,
        fileSize: modalBookFile.size,
        mimeType: modalBookFile.type || 'application/pdf',
        hasLocalFile: true,
        uploadedBy: currentUser.nameArabic || currentUser.name,
        uploadedByRole: currentUser.role,
      });
      await saveEBookBlob(savedBook.id, modalBookFile);
    }

    // Optional Instant Teacher Assignment
    if (assignNow && modalTeacherId) {
      DataStore.saveSubjectTeacher({
        ClassID: selectedClassId,
        SubjectID: savedSubject.SubjectID,
        TeacherID: modalTeacherId,
      });

      DataStore.saveSchedule({
        ClassID: selectedClassId,
        SubjectID: savedSubject.SubjectID,
        TeacherID: modalTeacherId,
        Day: modalDay,
        StartTime: modalStartTime,
        EndTime: modalEndTime,
        Room: modalRoom,
      });
    }

    closeModal();
    loadData();
    setTimeout(() => setMsg(null), 3500);
  };

  const handleDelete = (id: number) => {
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can delete subjects.', type: 'error' });
      return;
    }
    const target = subjects.find(s => s.SubjectID === id);
    if (
      confirm(
        `Are you sure you want to delete "${target?.SubjectClass}"? All related grades, e-books, and timetable allocations will be removed.`
      )
    ) {
      DataStore.deleteSubject(id);
      setMsg({ text: `Subject "${target?.SubjectClass}" deleted successfully.`, type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const getClassName = (cid: number) => {
    return classes.find(c => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  };

  const getClassDept = (cid: number): DepartmentType => {
    return classes.find(c => c.ClassID === cid)?.Department || '5-days';
  };

  // Helper: Group and sort ScheduledSubjectEntry[] by Day and StartTime
  const groupEntriesByDay = (entries: ScheduledSubjectEntry[]) => {
    return DAYS_META.map(dayMeta => {
      const dayItems = entries
        .filter(e => e.dayKey === dayMeta.key)
        .sort(
          (a, b) =>
            a.startTime.localeCompare(b.startTime) ||
            a.endTime.localeCompare(b.endTime) ||
            a.subject.SubjectID - b.subject.SubjectID
        );
      return {
        ...dayMeta,
        items: dayItems,
      };
    }).filter(group => group.items.length > 0);
  };

  // =====================================================================
  // 1. STUDENT SPECIFIC SUBJECTS VIEW
  // =====================================================================
  const currentStudent = useMemo(() => {
    return (
      students.find(s => s.StudentID === currentUser?.linkedId) ||
      students.find(s => s.Email === currentUser?.email) ||
      students[0]
    );
  }, [students, currentUser]);

  const studentClass = useMemo(() => {
    if (!currentStudent) return null;
    return classes.find(c => c.ClassID === currentStudent.ClassID);
  }, [classes, currentStudent]);

  const studentSubjects = useMemo(() => {
    if (!currentStudent) return [];
    return subjects.filter(s => s.ClassID === currentStudent.ClassID);
  }, [subjects, currentStudent]);

  // Build every scheduled subject slot for the student's class (including duplicate subjects!)
  const studentScheduledEntries = useMemo(() => {
    if (!currentStudent) return [];
    const classSchedules = schedules.filter(sch => sch.ClassID === currentStudent.ClassID);

    // Count occurrences per SubjectID so duplicate scheduled subjects are clearly indexed
    const countsBySub = new Map<number, number>();
    classSchedules.forEach(sch => {
      countsBySub.set(sch.SubjectID, (countsBySub.get(sch.SubjectID) || 0) + 1);
    });
    const seenBySub = new Map<number, number>();

    const entries: ScheduledSubjectEntry[] = [];

    // Sort raw schedules by day & time first so occurrenceIndex is chronological
    const sortedSchedules = [...classSchedules].sort(
      (a, b) =>
        DAYS_META.findIndex(d => d.key === a.Day) -
          DAYS_META.findIndex(d => d.key === b.Day) ||
        a.StartTime.localeCompare(b.StartTime) ||
        a.EndTime.localeCompare(b.EndTime)
    );

    sortedSchedules.forEach(sch => {
      const sub = subjects.find(s => s.SubjectID === sch.SubjectID);
      if (!sub) return;
      const occ = (seenBySub.get(sub.SubjectID) || 0) + 1;
      seenBySub.set(sub.SubjectID, occ);
      const teacher = teachers.find(t => t.TeacherID === sch.TeacherID) || null;

      entries.push({
        entryKey: `std-sch-${sch.ID}`,
        subject: sub,
        schedule: sch,
        cls: studentClass || undefined,
        teacher,
        dayKey: sch.Day,
        startTime: sch.StartTime,
        endTime: sch.EndTime,
        room: sch.Room,
        occurrenceIndex: occ,
        totalOccurrences: countsBySub.get(sub.SubjectID) || 1,
      });
    });

    // Also include any class subjects that don't have a schedule slot yet
    const scheduledSubIds = new Set(classSchedules.map(s => s.SubjectID));
    studentSubjects.forEach(sub => {
      if (!scheduledSubIds.has(sub.SubjectID)) {
        const alloc = subjectTeachers.find(
          st => st.SubjectID === sub.SubjectID && st.ClassID === sub.ClassID
        );
        const teacher = alloc ? teachers.find(t => t.TeacherID === alloc.TeacherID) || null : null;
        entries.push({
          entryKey: `std-unscheduled-${sub.SubjectID}`,
          subject: sub,
          schedule: null,
          cls: studentClass || undefined,
          teacher,
          dayKey: 'Unscheduled',
          startTime: '99:99',
          endTime: '99:99',
          room: '',
          occurrenceIndex: 1,
          totalOccurrences: 1,
        });
      }
    });

    return entries;
  }, [currentStudent, schedules, subjects, teachers, studentClass, studentSubjects, subjectTeachers]);

  const filteredStudentEntries = useMemo(() => {
    return studentScheduledEntries.filter(entry => {
      const s = entry.subject;
      const matchesSearch =
        s.SubjectClass.toLowerCase().includes(search.toLowerCase()) ||
        (s.SubjectArabic || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.SubjectCode || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.teacher?.Name || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.teacher?.NameArabic || '').toLowerCase().includes(search.toLowerCase());
      const matchesDay = filterDay === 'all' || entry.dayKey === filterDay;
      return matchesSearch && matchesDay;
    });
  }, [studentScheduledEntries, search, filterDay]);

  const studentDayGroups = useMemo(
    () => groupEntriesByDay(filteredStudentEntries),
    [filteredStudentEntries]
  );

  const studentAvailableDays = useMemo(() => {
    const present = new Set(studentScheduledEntries.map(e => e.dayKey));
    return DAYS_META.filter(d => present.has(d.key));
  }, [studentScheduledEntries]);

  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Top Student Header Banner — Requirement 4: "Subjects" */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-800 shadow-md flex items-center justify-center shrink-0">
              {currentStudent?.ProfilePic ? (
                <img
                  src={currentStudent.ProfilePic}
                  alt={currentStudent.Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <GraduationCap className="w-8 h-8 text-amber-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                  Subjects &bull; المواد الدراسية
                </span>
                {currentStudent?.IdNumber && (
                  <span className="text-xs text-emerald-300 font-mono">
                    {currentStudent.IdNumber}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <span>{currentStudent?.NameArabic || currentStudent?.Name}</span>
                <span className="text-emerald-200 text-sm font-normal">
                  ({currentStudent?.Name})
                </span>
              </h1>
              <p className="text-xs text-emerald-200/90 mt-0.5 font-serif" dir="rtl">
                {studentClass?.ClassName} &bull;{' '}
                {studentClass?.Department === '2-days'
                  ? 'قسم يومين (Weekend)'
                  : 'قسم ٥ أيام (5-Days)'}{' '}
                &bull; المواد الدراسية مرتبة حسب الجدول ومصنفة حسب الأيام
              </p>
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-amber-300 block font-bold font-serif">
                الحصص المجدولة
              </span>
              <span className="text-xl font-black text-white font-mono">
                {studentScheduledEntries.length}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-emerald-300 block font-bold font-serif">
                المواد المسجلة
              </span>
              <span className="text-xl font-black text-white font-mono">
                {studentSubjects.length}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-cyan-300 block font-bold font-serif">المرحلة</span>
              <span className="text-xs font-bold text-white font-serif">
                {studentClass?.Level || 'مرحلة'}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Day Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subject by name, code, or teacher (بحث في المواد)..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          {/* Day Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5" dir="rtl">
            <button
              type="button"
              onClick={() => setFilterDay('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                filterDay === 'all'
                  ? 'bg-[#126b38] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              كافة الأيام (All Days)
            </button>
            {studentAvailableDays.map(d => (
              <button
                key={d.key}
                type="button"
                onClick={() => setFilterDay(d.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors font-serif ${
                  filterDay === d.key
                    ? 'bg-[#126b38] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {d.labelAr} ({d.labelEn})
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-600 font-serif" dir="rtl">
            {filteredStudentEntries.length} من أصل {studentScheduledEntries.length} حصة مجدولة
          </span>
        </div>

        {/* Student Subjects Grouped by Day & Sorted by Scheduled Time */}
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c4b68e] pb-3"
            dir="rtl"
          >
            <h3 className="text-base sm:text-lg font-black text-slate-950 font-serif flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-900" />
              <span>المواد الدراسية حسب الجدول اليومي (My Scheduled Subjects)</span>
            </h3>
            <span className="text-xs font-bold text-slate-800 font-serif">
              الصف: {studentClass?.ClassName || 'فصل الطالب'}
            </span>
          </div>

          {studentDayGroups.map(dayGroup => (
            <div key={dayGroup.key} className="space-y-3.5">
              {/* Day Group Header */}
              <div
                className="bg-[#126b38] text-white px-4 py-2.5 rounded-2xl shadow-xs flex items-center justify-between"
                dir="rtl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-amber-400 text-slate-950">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black font-serif">
                      {dayGroup.labelAr}{' '}
                      <span className="font-sans text-xs font-bold text-amber-200">
                        ({dayGroup.labelEn})
                      </span>
                    </h4>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-black font-mono">
                  {dayGroup.items.length} حصص مجدولة
                </span>
              </div>

              {/* Sorted Subject Cards for this Day (including duplicate subjects at different times) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dayGroup.items.map((entry, idx) => {
                  const sub = entry.subject;
                  const teacher = entry.teacher;
                  const bookCount = getSubjectBookCount(sub);

                  return (
                    <div
                      key={entry.entryKey}
                      className="bg-white p-4 rounded-2xl border border-[#cfc39f] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3 text-right"
                      dir="rtl"
                    >
                      <div className="space-y-2">
                        {/* Period / Level / Code Header */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif">
                            {studentClass?.Level || 'مرحلة دراسية'}
                          </span>
                          <div className="flex items-center gap-1">
                            {entry.totalOccurrences > 1 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-serif">
                                فترة {entry.occurrenceIndex}/{entry.totalOccurrences}
                              </span>
                            )}
                            {sub.SubjectCode && (
                              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {sub.SubjectCode}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subject Names */}
                        <div className="text-center pt-1">
                          <h4 className="text-lg font-black text-slate-950 font-serif">
                            {sub.SubjectArabic || sub.SubjectClass}
                          </h4>
                          <p className="text-xs text-slate-500 font-sans mt-0.5" dir="ltr">
                            {sub.SubjectClass}
                          </p>
                        </div>

                        {/* Teacher & Scheduled Time Slot Info */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                          {teacher && (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-bold text-slate-800">
                                الأستاذ: {teacher.NameArabic || teacher.Name}
                              </span>
                            </div>
                          )}
                          {entry.schedule ? (
                            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-700 font-mono bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/70">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span className="font-bold">
                                  {entry.dayKey} ({entry.startTime}-{entry.endTime})
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-900 font-serif font-bold">
                                الحصة #{idx + 1}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-serif">
                              بدون موعد محدد
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subject E-Book Button (View Only for Students — No Upload!) */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-serif">
                          <span className="text-slate-500">الكتاب المقرر:</span>
                          {bookCount > 0 ? (
                            <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              متوفر ({bookCount})
                            </span>
                          ) : (
                            <span className="text-slate-400">غير مرفوع بعد</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openSubjectBook(sub, false)}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-98"
                        >
                          <BookOpen className="w-4 h-4 text-slate-950" />
                          <span>Read Course Book</span>
                          <span className="font-serif text-[11px] font-bold" dir="rtl">
                            (قراءة المقرر الدراسي)
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {studentDayGroups.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 font-serif text-sm">
              لا توجد مواد دراسية مسجلة مطابقة للبحث.
            </div>
          )}
        </div>

        {/* Subject-Specific E-Book Modal (canUpload={false} for Students) */}
        <EBookReaderModal
          isOpen={readerModal.isOpen}
          onClose={() => setReaderModal(prev => ({ ...prev, isOpen: false }))}
          subject={readerModal.subject}
          classNameStr={readerModal.classNameStr}
          canUpload={false}
          currentUser={currentUser}
          onBooksChanged={loadData}
        />
      </div>
    );
  }

  // =====================================================================
  // 2. TEACHER (USTADH) SPECIFIC SUBJECTS VIEW
  // =====================================================================
  const currentTeacher = useMemo(() => {
    return (
      teachers.find(t => t.TeacherID === currentUser?.linkedId) ||
      teachers.find(t => t.Email === currentUser?.email) ||
      teachers[1] ||
      teachers[0]
    );
  }, [teachers, currentUser]);

  const teacherAllocs = useMemo(() => {
    if (!currentTeacher) return [];
    return subjectTeachers.filter(st => st.TeacherID === currentTeacher.TeacherID);
  }, [subjectTeachers, currentTeacher]);

  const teacherSchedules = useMemo(() => {
    if (!currentTeacher) return [];
    return schedules.filter(s => s.TeacherID === currentTeacher.TeacherID);
  }, [schedules, currentTeacher]);

  const teacherAssignedSubjectIds = useMemo(() => {
    const ids = new Set<number>();
    teacherAllocs.forEach(a => ids.add(a.SubjectID));
    teacherSchedules.forEach(s => ids.add(s.SubjectID));
    if (ids.size === 0) {
      [1, 2, 3, 8, 11, 14, 16, 19].forEach(id => ids.add(id));
    }
    return ids;
  }, [teacherAllocs, teacherSchedules]);

  const teacherSubjects = useMemo(() => {
    return subjects.filter(s => teacherAssignedSubjectIds.has(s.SubjectID));
  }, [subjects, teacherAssignedSubjectIds]);

  const teacherClasses = useMemo(() => {
    const classIds = new Set(teacherSubjects.map(s => s.ClassID));
    return classes.filter(c => classIds.has(c.ClassID));
  }, [teacherSubjects, classes]);

  // Build every scheduled subject slot for the teacher, grouped by Day & sorted by StartTime (including duplicates!)
  const teacherScheduledEntries = useMemo(() => {
    const countsBySub = new Map<number, number>();
    teacherSchedules.forEach(sch => {
      countsBySub.set(sch.SubjectID, (countsBySub.get(sch.SubjectID) || 0) + 1);
    });
    const seenBySub = new Map<number, number>();

    const sortedSchedules = [...teacherSchedules].sort(
      (a, b) =>
        DAYS_META.findIndex(d => d.key === a.Day) -
          DAYS_META.findIndex(d => d.key === b.Day) ||
        a.StartTime.localeCompare(b.StartTime) ||
        a.EndTime.localeCompare(b.EndTime)
    );

    const entries: ScheduledSubjectEntry[] = [];

    sortedSchedules.forEach(sch => {
      const sub = subjects.find(s => s.SubjectID === sch.SubjectID);
      if (!sub) return;
      const cls = classes.find(c => c.ClassID === sch.ClassID);
      const occ = (seenBySub.get(sub.SubjectID) || 0) + 1;
      seenBySub.set(sub.SubjectID, occ);

      entries.push({
        entryKey: `tch-sch-${sch.ID}`,
        subject: sub,
        schedule: sch,
        cls,
        teacher: currentTeacher,
        dayKey: sch.Day,
        startTime: sch.StartTime,
        endTime: sch.EndTime,
        room: sch.Room,
        occurrenceIndex: occ,
        totalOccurrences: countsBySub.get(sub.SubjectID) || 1,
      });
    });

    // Also include any assigned subjects for this teacher that have no schedule rows yet
    const scheduledSubIds = new Set(teacherSchedules.map(s => s.SubjectID));
    teacherSubjects.forEach(sub => {
      if (!scheduledSubIds.has(sub.SubjectID)) {
        const subAllSchedules = schedules.filter(
          s => s.SubjectID === sub.SubjectID && s.ClassID === sub.ClassID
        );
        const cls = classes.find(c => c.ClassID === sub.ClassID);
        if (subAllSchedules.length > 0) {
          subAllSchedules.forEach((sch, idx) => {
            entries.push({
              entryKey: `tch-fallback-sch-${sch.ID}`,
              subject: sub,
              schedule: sch,
              cls,
              teacher: currentTeacher,
              dayKey: sch.Day,
              startTime: sch.StartTime,
              endTime: sch.EndTime,
              room: sch.Room,
              occurrenceIndex: idx + 1,
              totalOccurrences: subAllSchedules.length,
            });
          });
        } else {
          entries.push({
            entryKey: `tch-unscheduled-${sub.SubjectID}`,
            subject: sub,
            schedule: null,
            cls,
            teacher: currentTeacher,
            dayKey: 'Unscheduled',
            startTime: '99:99',
            endTime: '99:99',
            room: '',
            occurrenceIndex: 1,
            totalOccurrences: 1,
          });
        }
      }
    });

    return entries;
  }, [teacherSchedules, subjects, classes, currentTeacher, teacherSubjects, schedules]);

  const filteredTeacherEntries = useMemo(() => {
    return teacherScheduledEntries.filter(entry => {
      const s = entry.subject;
      const cls = entry.cls;
      const matchesSearch =
        s.SubjectClass.toLowerCase().includes(search.toLowerCase()) ||
        (s.SubjectArabic || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.SubjectCode || '').toLowerCase().includes(search.toLowerCase()) ||
        (cls?.ClassName || '').toLowerCase().includes(search.toLowerCase());
      const matchesDept = filterDepartment === 'all' || cls?.Department === filterDepartment;
      const matchesLevel =
        filterLevel === 'all' ||
        (cls?.Level || '').toLowerCase().includes(filterLevel.toLowerCase());
      const matchesDay = filterDay === 'all' || entry.dayKey === filterDay;
      return matchesSearch && matchesDept && matchesLevel && matchesDay;
    });
  }, [teacherScheduledEntries, search, filterDepartment, filterLevel, filterDay]);

  const teacherDayGroups = useMemo(
    () => groupEntriesByDay(filteredTeacherEntries),
    [filteredTeacherEntries]
  );

  const teacherAvailableDays = useMemo(() => {
    const present = new Set(teacherScheduledEntries.map(e => e.dayKey));
    return DAYS_META.filter(d => present.has(d.key));
  }, [teacherScheduledEntries]);

  if (isTeacher) {
    return (
      <div className="space-y-6">
        {/* Top Teacher Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-800 shadow-md flex items-center justify-center shrink-0">
              {currentTeacher?.ProfilePic ? (
                <img
                  src={currentTeacher.ProfilePic}
                  alt={currentTeacher.Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCheck className="w-8 h-8 text-amber-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                  Teacher Subjects &bull; المواد المسندة للأستاذ
                </span>
                {currentTeacher?.IdNumber && (
                  <span className="text-xs text-emerald-300 font-mono">
                    {currentTeacher.IdNumber}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <span>{currentTeacher?.NameArabic || currentTeacher?.Name}</span>
                <span className="text-emerald-200 text-sm font-normal">
                  ({currentTeacher?.Name})
                </span>
              </h1>
              <p className="text-xs text-emerald-200/90 mt-0.5 font-serif" dir="rtl">
                المواد الدراسية المسندة مرتبة حسب الجدول الزمني ومصنفة حسب الأيام، مع صلاحية رفع الكتب المقررة ورصد الدرجات
              </p>
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-amber-300 block font-bold font-serif">
                المواد المسندة
              </span>
              <span className="text-xl font-black text-white font-mono">
                {teacherSubjects.length}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-cyan-300 block font-bold font-serif">
                المراحل والصفوف
              </span>
              <span className="text-xl font-black text-white font-mono">
                {teacherClasses.length}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-emerald-300 block font-bold font-serif">
                الحصص الأسبوعية
              </span>
              <span className="text-xl font-black text-white font-mono">
                {teacherScheduledEntries.length}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subject by name, code, or class (بحث في المواد)..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>

            <select
              value={filterDay}
              onChange={e => setFilterDay(e.target.value)}
              className="text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الأيام (All Days)</option>
              {teacherAvailableDays.map(d => (
                <option key={d.key} value={d.key}>
                  {d.labelAr} ({d.labelEn})
                </option>
              ))}
            </select>

            <select
              value={filterDepartment}
              onChange={e => setFilterDepartment(e.target.value as any)}
              className="text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الأقسام (All Depts)</option>
              <option value="5-days">قسم ٥ أيام (5-Days)</option>
              <option value="2-days">قسم يومين (2-Days)</option>
            </select>

            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">كافة المراحل (All Levels)</option>
              <option value="Ibtidaiyyah">الابتدائية (Ibtidaiyyah)</option>
              <option value="Mutawassit">المتوسطة (Mutawassit)</option>
              <option value="Thanawi">الثانوية (Thanawi)</option>
              <option value="Kulliyatu">الكليات (Colleges)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/grades"
              className="px-4 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-200" />
              <span>Full Grade Matrix (Excel)</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">
                (رصد الدرجات)
              </span>
            </Link>
          </div>
        </div>

        {/* Teacher Scheduled Subjects Grouped by Day (including duplicates!) */}
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c4b68e] pb-3"
            dir="rtl"
          >
            <h3 className="text-base sm:text-lg font-black text-slate-950 font-serif flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-900" />
              <span>
                المواد والحصص الدراسية المسندة للأستاذ مرتبة حسب الأيام والجدول (Assigned Subjects Grouped by Day)
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-800 font-serif">
              {filteredTeacherEntries.length} حصة مجدولة &bull; {teacherSubjects.length} مواد &bull;{' '}
              {teacherClasses.length} مراحل
            </span>
          </div>

          {teacherDayGroups.map(dayGroup => (
            <div key={dayGroup.key} className="space-y-3.5">
              {/* Day Header */}
              <div
                className="bg-[#126b38] text-white px-4 py-2.5 rounded-2xl shadow-xs flex items-center justify-between"
                dir="rtl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-amber-400 text-slate-950">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm sm:text-base font-black font-serif">
                    {dayGroup.labelAr}{' '}
                    <span className="font-sans text-xs font-bold text-amber-200">
                      ({dayGroup.labelEn})
                    </span>
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-black font-mono">
                  {dayGroup.items.length} حصص مجدولة
                </span>
              </div>

              {/* Sorted Subject Cards for this Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {dayGroup.items.map((entry, idx) => {
                  const sub = entry.subject;
                  const cls = entry.cls;
                  const bookCount = getSubjectBookCount(sub);

                  return (
                    <div
                      key={entry.entryKey}
                      className="bg-white p-4 rounded-2xl border border-[#cfc39f] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3 text-right"
                      dir="rtl"
                    >
                      <div className="space-y-2">
                        {/* Grade Level Tag & Duplicate Indicator */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif">
                            مرحلة: {cls?.Level || cls?.ClassName || 'مرحلة دراسية'}
                          </span>
                          <div className="flex items-center gap-1">
                            {entry.totalOccurrences > 1 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-serif">
                                حصة {entry.occurrenceIndex}/{entry.totalOccurrences}
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {cls?.Department || '2-days'}
                            </span>
                          </div>
                        </div>

                        {/* Subject Names */}
                        <div className="text-center pt-1">
                          <h4 className="text-lg font-black text-slate-950 font-serif">
                            {sub.SubjectArabic || sub.SubjectClass}
                          </h4>
                          <p className="text-xs text-slate-500 font-sans mt-0.5" dir="ltr">
                            {sub.SubjectClass} {sub.SubjectCode && `(${sub.SubjectCode})`}
                          </p>
                        </div>

                        {/* Class & Scheduled Time Info */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-serif">الفصل:</span>
                            <strong className="text-slate-900 font-serif">
                              {cls?.ClassName || `Class #${sub.ClassID}`}
                            </strong>
                          </div>

                          {entry.schedule ? (
                            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-800 font-mono bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/70">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span className="font-bold">
                                  {entry.startTime} - {entry.endTime}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-600 font-serif">
                                {entry.room || `حصة #${idx + 1}`}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-serif text-center">
                              بدون موعد محدد في الجدول
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions: Read E-Book + Upload E-Book (Ustadh Permission) + Edit Grades */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <Link
                            href={`/dashboard/grades?subjectId=${sub.SubjectID}&classId=${sub.ClassID}`}
                            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 font-serif"
                          >
                            <span>الدرجات</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                          <span
                            className={`text-[11px] font-bold font-serif px-2 py-0.5 rounded-full ${
                              bookCount > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {bookCount > 0 ? `الكتب المرفوعة: ${bookCount}` : 'لا يوجد كتاب مرفوع'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => openSubjectBook(sub, false)}
                            className="py-2 px-2.5 bg-[#dfd4b8] hover:bg-[#d5c7a0] text-slate-900 border border-[#bfae83] font-black text-[11px] rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-98"
                            title="قراءة وتصفح كتاب المقرر"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                            <span className="font-serif">كتاب المقرر</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openSubjectBook(sub, true)}
                            className="py-2 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-98"
                            title="رفع كتاب مخصص لهذه المادة"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                            <span className="font-serif">رفع كتاب</span>
                          </button>
                        </div>

                        <Link
                          href={`/dashboard/grades?subjectId=${sub.SubjectID}&classId=${sub.ClassID}`}
                          className="w-full py-2 px-3 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-98"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Edit Grades (Excel)</span>
                          <span className="font-serif text-[11px] opacity-80" dir="rtl">
                            (تعديل ورصد الدرجات)
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {teacherDayGroups.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 font-serif text-sm">
              لا توجد مواد مسندة تطابق البحث والتصفية المحددة.
            </div>
          )}
        </div>

        {/* Subject-Specific E-Book Modal (canUpload={true} for Ustadh) */}
        <EBookReaderModal
          isOpen={readerModal.isOpen}
          onClose={() => setReaderModal(prev => ({ ...prev, isOpen: false }))}
          subject={readerModal.subject}
          classNameStr={readerModal.classNameStr}
          canUpload={true}
          currentUser={currentUser}
          initialShowUpload={readerModal.initialShowUpload}
          onBooksChanged={loadData}
        />
      </div>
    );
  }

  // =====================================================================
  // 3. ADMIN / PRINCIPAL (MUDIR) VIEW
  // =====================================================================
  const filteredSubjects = subjects.filter(s => {
    const cls = classes.find(c => c.ClassID === s.ClassID);
    const matchesSearch =
      s.SubjectClass.toLowerCase().includes(search.toLowerCase()) ||
      (s.SubjectArabic || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.SubjectCode || '').toLowerCase().includes(search.toLowerCase()) ||
      getClassName(s.ClassID).toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDepartment === 'all' || cls?.Department === filterDepartment;
    const matchesLevel =
      filterLevel === 'all' || cls?.Level.toLowerCase().includes(filterLevel.toLowerCase());
    const matchesClass = filterClass === 0 || s.ClassID === filterClass;
    return matchesSearch && matchesDept && matchesLevel && matchesClass;
  });

  // Build day-grouped scheduled entries for Admin/Mudir view as well (including duplicate subjects!)
  const adminScheduledEntries = useMemo(() => {
    const filteredSubSet = new Set(filteredSubjects.map(s => s.SubjectID));
    const relevantSchedules = schedules.filter(sch => filteredSubSet.has(sch.SubjectID));

    const countsBySub = new Map<number, number>();
    relevantSchedules.forEach(sch => {
      countsBySub.set(sch.SubjectID, (countsBySub.get(sch.SubjectID) || 0) + 1);
    });
    const seenBySub = new Map<number, number>();

    const sortedSchedules = [...relevantSchedules].sort(
      (a, b) =>
        DAYS_META.findIndex(d => d.key === a.Day) -
          DAYS_META.findIndex(d => d.key === b.Day) ||
        a.StartTime.localeCompare(b.StartTime) ||
        a.EndTime.localeCompare(b.EndTime)
    );

    const entries: ScheduledSubjectEntry[] = [];

    sortedSchedules.forEach(sch => {
      const sub = subjects.find(s => s.SubjectID === sch.SubjectID);
      if (!sub) return;
      const cls = classes.find(c => c.ClassID === sub.ClassID);
      const teacher = teachers.find(t => t.TeacherID === sch.TeacherID) || null;
      const occ = (seenBySub.get(sub.SubjectID) || 0) + 1;
      seenBySub.set(sub.SubjectID, occ);

      entries.push({
        entryKey: `adm-sch-${sch.ID}`,
        subject: sub,
        schedule: sch,
        cls,
        teacher,
        dayKey: sch.Day,
        startTime: sch.StartTime,
        endTime: sch.EndTime,
        room: sch.Room,
        occurrenceIndex: occ,
        totalOccurrences: countsBySub.get(sub.SubjectID) || 1,
      });
    });

    const scheduledSubIds = new Set(relevantSchedules.map(s => s.SubjectID));
    filteredSubjects.forEach(sub => {
      if (!scheduledSubIds.has(sub.SubjectID)) {
        const cls = classes.find(c => c.ClassID === sub.ClassID);
        const alloc = subjectTeachers.find(
          st => st.SubjectID === sub.SubjectID && st.ClassID === sub.ClassID
        );
        const teacher = alloc ? teachers.find(t => t.TeacherID === alloc.TeacherID) || null : null;
        entries.push({
          entryKey: `adm-unscheduled-${sub.SubjectID}`,
          subject: sub,
          schedule: null,
          cls,
          teacher,
          dayKey: 'Unscheduled',
          startTime: '99:99',
          endTime: '99:99',
          room: '',
          occurrenceIndex: 1,
          totalOccurrences: 1,
        });
      }
    });

    return entries.filter(e => filterDay === 'all' || e.dayKey === filterDay);
  }, [filteredSubjects, schedules, subjects, classes, teachers, subjectTeachers, filterDay]);

  const adminDayGroups = useMemo(
    () => groupEntriesByDay(adminScheduledEntries),
    [adminScheduledEntries]
  );

  return (
    <div className="space-y-6">
      {/* Top Mudir / Admin Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Crown className="w-3.5 h-3.5" />
              <span>Academic Subjects & E-Book Governance (المواد والكتب الدراسية)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Subjects & Course E-Books
            </h1>
            <p className="text-sm text-emerald-200/90 max-w-2xl">
              View scheduled subjects grouped by day, upload course e-books specifically for each subject, and manage faculty allocations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canManage && (
              <button
                type="button"
                onClick={openAddModal}
                className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Subject</span>
              </button>
            )}

            <Link
              href="/dashboard/teachers/assignments"
              className="px-4 py-3 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold border border-emerald-600/60 shadow transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Teacher Allocation</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-emerald-800/60">
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Total Subjects
            </span>
            <span className="text-2xl font-black text-white">{stats.total}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider block">
              5-Days Subjects
            </span>
            <span className="text-2xl font-black text-cyan-300">{stats.fiveDaysSubs}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
              2-Days Subjects
            </span>
            <span className="text-2xl font-black text-amber-300">{stats.twoDaysSubs}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Uploaded E-Books
            </span>
            <span className="text-2xl font-black text-emerald-400">{subjectEBooks.length}</span>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border shadow-xs animate-in fade-in duration-200 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {/* Control Bar: Filters & View Mode */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects by name, Arabic title, code, or class..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <select
            value={filterDay}
            onChange={e => setFilterDay(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">All Days (كافة الأيام)</option>
            {DAYS_META.map(d => (
              <option key={d.key} value={d.key}>
                {d.labelEn} ({d.labelAr})
              </option>
            ))}
          </select>

          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">All Academic Levels</option>
            <option value="Ibtidaiyyah">Ibtidaiyyah (Primary)</option>
            <option value="Mutawassit">Mutawassit (Intermediate)</option>
            <option value="Thanawi">Thanawi (Secondary)</option>
            <option value="Kulliyatu">Colleges / Kulliyat</option>
          </select>

          <select
            value={filterClass}
            onChange={e => setFilterClass(Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value={0}>All Classes</option>
            {classes.map(c => (
              <option key={c.ClassID} value={c.ClassID}>
                {c.ClassName}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle: Grouped by Day vs Catalog Table */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-end lg:self-auto">
          <button
            type="button"
            onClick={() => setAdminViewMode('grouped-by-day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              adminViewMode === 'grouped-by-day'
                ? 'bg-[#126b38] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grouped by Day (حسب الأيام والجدول)
          </button>
          <button
            type="button"
            onClick={() => setAdminViewMode('catalog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              adminViewMode === 'catalog'
                ? 'bg-[#126b38] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Catalog Table (جدول المواد)
          </button>
        </div>
      </div>

      {adminViewMode === 'grouped-by-day' ? (
        /* Admin / Principal Day-Grouped & Schedule-Sorted View */
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c4b68e] pb-3"
            dir="rtl"
          >
            <h3 className="text-base sm:text-lg font-black text-slate-950 font-serif flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-900" />
              <span>المواد الدراسية مرتبة حسب الجدول ومصنفة حسب الأيام (Scheduled Subjects by Day)</span>
            </h3>
            <span className="text-xs font-bold text-slate-800 font-serif">
              {adminScheduledEntries.length} حصة مجدولة
            </span>
          </div>

          {adminDayGroups.map(dayGroup => (
            <div key={dayGroup.key} className="space-y-3.5">
              <div
                className="bg-[#126b38] text-white px-4 py-2.5 rounded-2xl shadow-xs flex items-center justify-between"
                dir="rtl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-amber-400 text-slate-950">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm sm:text-base font-black font-serif">
                    {dayGroup.labelAr}{' '}
                    <span className="font-sans text-xs font-bold text-amber-200">
                      ({dayGroup.labelEn})
                    </span>
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-black font-mono">
                  {dayGroup.items.length} حصص
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {dayGroup.items.map(entry => {
                  const sub = entry.subject;
                  const cls = entry.cls;
                  const bookCount = getSubjectBookCount(sub);

                  return (
                    <div
                      key={entry.entryKey}
                      className="bg-white p-4 rounded-2xl border border-[#cfc39f] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3 text-right"
                      dir="rtl"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif">
                            {cls?.ClassName || `Class #${sub.ClassID}`}
                          </span>
                          <div className="flex items-center gap-1">
                            {entry.totalOccurrences > 1 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-serif">
                                حصة {entry.occurrenceIndex}/{entry.totalOccurrences}
                              </span>
                            )}
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => openEditModal(sub)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="Edit Subject"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-center pt-1">
                          <h4 className="text-lg font-black text-slate-950 font-serif">
                            {sub.SubjectArabic || sub.SubjectClass}
                          </h4>
                          <p className="text-xs text-slate-500 font-sans mt-0.5" dir="ltr">
                            {sub.SubjectClass} {sub.SubjectCode && `(${sub.SubjectCode})`}
                          </p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                          {entry.teacher && (
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-bold text-slate-800">
                                الأستاذ: {entry.teacher.NameArabic || entry.teacher.Name}
                              </span>
                            </div>
                          )}
                          {entry.schedule ? (
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/70">
                              <span className="font-bold">
                                {entry.startTime} - {entry.endTime}
                              </span>
                              <span className="font-serif text-[10px]">{entry.room}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-serif">
                              بدون موعد محدد
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-serif">
                          <span className="text-slate-500">كتب المادة:</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full ${
                              bookCount > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {bookCount > 0 ? `${bookCount} كتاب مرفوع` : 'لا يوجد كتاب'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => openSubjectBook(sub, false)}
                            className="py-2 px-2.5 bg-[#dfd4b8] hover:bg-[#d5c7a0] text-slate-900 border border-[#bfae83] font-black text-[11px] rounded-xl cursor-pointer flex items-center justify-center gap-1"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
                            <span className="font-serif">كتاب المقرر</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openSubjectBook(sub, true)}
                            className="py-2 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-950" />
                            <span className="font-serif">رفع كتاب</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Main Subjects Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Subject & Subject E-Book</th>
                  <th className="py-3.5 px-4">Class & Department</th>
                  <th className="py-3.5 px-4">Assigned Teacher</th>
                  <th className="py-3.5 px-4">Timetable Schedule</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No subjects found</p>
                      <p className="text-xs">
                        Adjust your search query or click "+ Add New Subject" above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map(s => {
                    const alloc = subjectTeachers.find(
                      st => st.SubjectID === s.SubjectID && st.ClassID === s.ClassID
                    );
                    const teacher = alloc
                      ? teachers.find(t => t.TeacherID === alloc.TeacherID)
                      : null;
                    const subjectSchedules = schedules.filter(
                      sch => sch.SubjectID === s.SubjectID && sch.ClassID === s.ClassID
                    );
                    const dept = getClassDept(s.ClassID);
                    const bookCount = getSubjectBookCount(s);

                    return (
                      <tr key={s.SubjectID} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {s.SubjectClass}
                            </span>
                            {s.SubjectCode && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                {s.SubjectCode}
                              </span>
                            )}
                          </div>
                          {s.SubjectArabic && (
                            <span className="text-xs text-amber-700 font-serif block mt-0.5" dir="rtl">
                              {s.SubjectArabic}
                            </span>
                          )}
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openSubjectBook(s, false)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3 text-amber-700" />
                              <span>
                                {bookCount > 0 ? `Read Book (${bookCount})` : 'Course Book (0)'}
                              </span>
                            </button>
                            {canUploadBooks && (
                              <button
                                type="button"
                                onClick={() => openSubjectBook(s, true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <Upload className="w-3 h-3 text-emerald-700" />
                                <span>Upload Book (رفع كتاب)</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="font-bold text-xs text-slate-800 block">
                              {getClassName(s.ClassID)}
                            </span>
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                dept === '5-days'
                                  ? 'bg-cyan-50 text-cyan-900 border border-cyan-200'
                                  : 'bg-amber-50 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {dept === '5-days' ? '5-Days Dept' : '2-Days Dept'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {teacher ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                {teacher.Name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900">{teacher.Name}</p>
                                {teacher.NameArabic && (
                                  <p className="text-[10px] text-slate-500 font-serif" dir="rtl">
                                    {teacher.NameArabic}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Link
                              href={`/dashboard/teachers/assignments?subjectId=${s.SubjectID}&classId=${s.ClassID}`}
                              className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2 py-1 rounded"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Assign Teacher</span>
                            </Link>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {subjectSchedules.length > 0 ? (
                            <div className="space-y-1">
                              {subjectSchedules.map(slot => (
                                <div
                                  key={slot.ID}
                                  className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-mono mr-1"
                                >
                                  <Calendar className="w-3 h-3 text-emerald-600" />
                                  <span className="font-bold">{slot.Day}</span>
                                  <span className="text-slate-500">
                                    {slot.StartTime} - {slot.EndTime}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">({slot.Room})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No schedule set</span>
                          )}
                        </td>

                        {canManage && (
                          <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openSubjectBook(s, true)}
                              className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors inline-block"
                              title="Upload / Manage Subject E-Book"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                              title="Edit Subject"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.SubjectID)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DIALOG: ADD / EDIT SUBJECT (ADMIN / PRINCIPAL) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingId ? 'Edit Subject Offering' : 'Add New Subject'}
                  </h2>
                  <p className="text-xs text-amber-200/90">
                    {editingId ? `Editing subject #${editingId}` : 'Create a course and upload its dedicated E-Book'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* STEP 1: DEPARTMENT & CLASS SELECTION */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  Step 1: Choose Department & Class
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDept('5-days')}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                      selectedDept === '5-days'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="block font-extrabold text-sm text-slate-900">
                      5-Days Department
                    </span>
                    <span className="text-xs text-slate-500">Sun - Thu program</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDept('2-days')}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                      selectedDept === '2-days'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="block font-extrabold text-sm text-slate-900">
                      2-Days Department
                    </span>
                    <span className="text-xs text-slate-500">Weekend Fri - Sat program</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Target Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                  >
                    {classes.map(c => (
                      <option key={c.ClassID} value={c.ClassID}>
                        {c.ClassName} ({c.Department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 2: SUBJECT DETAILS */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Step 2: Subject Details & Presets
                </span>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {subjectPresets.map(pr => (
                    <button
                      key={pr.name}
                      type="button"
                      onClick={() => applyPreset(pr)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 cursor-pointer shadow-2xs transition-colors"
                    >
                      {pr.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject Name (English) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subjectName}
                      onChange={e => setSubjectName(e.target.value)}
                      placeholder="e.g. Fiqh al-Ibadat"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject Name (Arabic - اسم المادة)
                    </label>
                    <input
                      type="text"
                      value={subjectArabic}
                      onChange={e => setSubjectArabic(e.target.value)}
                      placeholder="e.g. فقه العبادات"
                      dir="rtl"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-serif focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={e => setSubjectCode(e.target.value)}
                    placeholder="e.g. FQH-101"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* STEP 3: SUBJECT-SPECIFIC E-BOOK UPLOAD OR LINK */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  Step 3: Dedicated Subject E-Book Upload (خاص بهذه المادة فقط)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Textbook Title (عنوان الكتاب المقرر)
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={e => setBookTitle(e.target.value)}
                      placeholder="e.g. كتاب الفقه الميسر"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Upload PDF / Book File (رفع ملف كتاب للمادة)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      onChange={e => setModalBookFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Or Specific Subject Book URL (رابط ملف كتاب خاص بهذه المادة فقط)
                  </label>
                  <input
                    type="url"
                    value={bookDriveUrl}
                    onChange={e => setBookDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* STEP 4: OPTIONAL INSTANT TEACHER & TIMETABLE ALLOCATION */}
              {!editingId && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-emerald-950">
                      <input
                        type="checkbox"
                        checked={assignNow}
                        onChange={e => setAssignNow(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span>Assign Teacher & Timetable Slot right now (Optional)</span>
                    </label>

                    {assignNow && (
                      <div className="mt-3.5 pt-3 border-t border-emerald-200/60 space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Assigned Teacher
                          </label>
                          <select
                            value={modalTeacherId}
                            onChange={e => setModalTeacherId(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                          >
                            {teachers.map(t => (
                              <option key={t.TeacherID} value={t.TeacherID}>
                                {t.Name} {t.NameArabic ? `(${t.NameArabic})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Day</label>
                            <select
                              value={modalDay}
                              onChange={e => setModalDay(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                            >
                              <option value="Sunday">Sunday (الأحد)</option>
                              <option value="Monday">Monday (الإثنين)</option>
                              <option value="Tuesday">Tuesday (الثلاثاء)</option>
                              <option value="Wednesday">Wednesday (الأربعاء)</option>
                              <option value="Thursday">Thursday (الخميس)</option>
                              <option value="Friday">Friday (الجمعة)</option>
                              <option value="Saturday">Saturday (السبت)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">
                              Time Slot
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                value={modalStartTime}
                                onChange={e => setModalStartTime(e.target.value)}
                                className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                              />
                              <span>-</span>
                              <input
                                type="time"
                                value={modalEndTime}
                                onChange={e => setModalEndTime(e.target.value)}
                                className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Room</label>
                            <input
                              type="text"
                              value={modalRoom}
                              onChange={e => setModalRoom(e.target.value)}
                              placeholder="Hall 101"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : 'Confirm Subject Offering'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject-Specific E-Book Modal in Mudir / Admin View (canUpload={true}) */}
      <EBookReaderModal
        isOpen={readerModal.isOpen}
        onClose={() => setReaderModal(prev => ({ ...prev, isOpen: false }))}
        subject={readerModal.subject}
        classNameStr={readerModal.classNameStr}
        canUpload={canUploadBooks}
        currentUser={currentUser}
        initialShowUpload={readerModal.initialShowUpload}
        onBooksChanged={loadData}
      />
    </div>
  );
}
