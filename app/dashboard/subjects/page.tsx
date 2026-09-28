'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  ClassItem,
  SubjectItem,
  TeacherItem,
  SubjectTeacherItem,
  ClassScheduleItem,
  DepartmentType,
} from '@/lib/types';
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  Crown,
  Sparkles,
  X,
  Building2,
  Layers,
  GraduationCap,
  MapPin,
  ClipboardList,
  ArrowUpRight,
} from 'lucide-react';

export default function SubjectsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);

  // Permissions & Current User
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<'all' | '5-days' | '2-days'>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal Form State
  const [selectedDept, setSelectedDept] = useState<DepartmentType>('5-days');
  const [selectedLevel, setSelectedLevel] = useState<string>('Ibtidaiyyah');
  const [selectedClassId, setSelectedClassId] = useState<number>(1);
  const [subjectName, setSubjectName] = useState('');
  const [subjectArabic, setSubjectArabic] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  // Optional instant assignment in modal
  const [assignNow, setAssignNow] = useState(false);
  const [modalTeacherId, setModalTeacherId] = useState<number>(0);
  const [modalDay, setModalDay] = useState<
    'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  >('Sunday');
  const [modalStartTime, setModalStartTime] = useState('08:00');
  const [modalEndTime, setModalEndTime] = useState('09:30');
  const [modalRoom, setModalRoom] = useState('Hall 101');

  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick subject presets for easy 1-click filling
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
    setTeachers(DataStore.getTeachers());
    setSubjectTeachers(DataStore.getSubjectTeachers());
    setSchedules(DataStore.getSchedules());

    if (clsList.length > 0 && selectedClassId === 1) {
      setSelectedClassId(clsList[0].ClassID);
    }
  };

  // KPI metrics
  const stats = useMemo(() => {
    const total = subjects.length;
    const fiveDaysSubs = subjects.filter((s) => {
      const c = classes.find((cl) => cl.ClassID === s.ClassID);
      return c?.Department === '5-days';
    }).length;
    const twoDaysSubs = subjects.filter((s) => {
      const c = classes.find((cl) => cl.ClassID === s.ClassID);
      return c?.Department === '2-days';
    }).length;
    const allocatedSubs = subjectTeachers.length;
    return { total, fiveDaysSubs, twoDaysSubs, allocatedSubs };
  }, [subjects, classes, subjectTeachers]);

  // Classes filtered by selected department and level in Modal
  const modalAvailableClasses = useMemo(() => {
    return classes.filter(
      (c) => c.Department === selectedDept && (selectedLevel ? c.Level.includes(selectedLevel) : true)
    );
  }, [classes, selectedDept, selectedLevel]);

  // Keep modalClassId in sync when department or level changes
  useEffect(() => {
    if (modalAvailableClasses.length > 0) {
      const exists = modalAvailableClasses.some((c) => c.ClassID === selectedClassId);
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
    setAssignNow(false);
    setSelectedDept('5-days');
    setSelectedLevel('Ibtidaiyyah');
    if (classes.length > 0) setSelectedClassId(classes[0].ClassID);
    if (teachers.length > 0) setModalTeacherId(teachers[0].TeacherID);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SubjectItem) => {
    setEditingId(s.SubjectID);
    setSubjectName(s.SubjectClass);
    setSubjectArabic(s.SubjectArabic || '');
    setSubjectCode(s.SubjectCode || '');
    setSelectedClassId(s.ClassID);
    const targetClass = classes.find((c) => c.ClassID === s.ClassID);
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
  };

  const applyPreset = (preset: { name: string; arabic: string; code: string }) => {
    setSubjectName(preset.name);
    setSubjectArabic(preset.arabic);
    const targetClass = classes.find((c) => c.ClassID === selectedClassId);
    const yearGrade = targetClass?.YearGrade || 1;
    setSubjectCode(`${preset.code}-${yearGrade}01`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can manage subjects.', type: 'error' });
      return;
    }
    if (!subjectName.trim() || !selectedClassId) {
      setMsg({ text: 'Subject name and target class are required.', type: 'error' });
      return;
    }

    let savedSubject: SubjectItem;

    if (editingId) {
      savedSubject = DataStore.saveSubject({
        SubjectID: editingId,
        ClassID: selectedClassId,
        SubjectClass: subjectName.trim(),
        SubjectArabic: subjectArabic.trim() || undefined,
        SubjectCode: subjectCode.trim() || undefined,
      });
      setMsg({ text: `Subject "${subjectName}" updated successfully!`, type: 'success' });
    } else {
      savedSubject = DataStore.saveSubject({
        ClassID: selectedClassId,
        SubjectClass: subjectName.trim(),
        SubjectArabic: subjectArabic.trim() || undefined,
        SubjectCode: subjectCode.trim() || undefined,
      });
      setMsg({ text: `New subject "${subjectName}" added successfully!`, type: 'success' });
    }

    // Optional Instant Teacher Assignment
    if (assignNow && modalTeacherId) {
      DataStore.saveSubjectTeacher({
        ClassID: selectedClassId,
        SubjectID: savedSubject.SubjectID,
        TeacherID: modalTeacherId,
      });

      // Save schedule
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
    const target = subjects.find((s) => s.SubjectID === id);
    if (confirm(`Are you sure you want to delete "${target?.SubjectClass}"? All related grades and timetable allocations will be removed.`)) {
      DataStore.deleteSubject(id);
      setMsg({ text: `Subject "${target?.SubjectClass}" deleted successfully.`, type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const getClassName = (cid: number) => {
    return classes.find((c) => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  };

  const getClassDept = (cid: number): DepartmentType => {
    return classes.find((c) => c.ClassID === cid)?.Department || '5-days';
  };

  // Filtered subjects list
  const filteredSubjects = subjects.filter((s) => {
    const cls = classes.find((c) => c.ClassID === s.ClassID);
    const matchesSearch =
      s.SubjectClass.toLowerCase().includes(search.toLowerCase()) ||
      (s.SubjectArabic || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.SubjectCode || '').toLowerCase().includes(search.toLowerCase()) ||
      getClassName(s.ClassID).toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDepartment === 'all' || cls?.Department === filterDepartment;
    const matchesLevel = filterLevel === 'all' || cls?.Level.toLowerCase().includes(filterLevel.toLowerCase());
    const matchesClass = filterClass === 0 || s.ClassID === filterClass;
    return matchesSearch && matchesDept && matchesLevel && matchesClass;
  });

  // -------------------------------------------------------------
  // TEACHER SPECIFIC CURRICULUM VIEW (MOVED FROM SCHEDULES)
  // -------------------------------------------------------------
  const isTeacher = currentUser?.role === 'teacher';
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

  const filteredTeacherSubjects = useMemo(() => {
    return teacherSubjects.filter(s => {
      const cls = classes.find(c => c.ClassID === s.ClassID);
      const matchesSearch =
        s.SubjectClass.toLowerCase().includes(search.toLowerCase()) ||
        (s.SubjectArabic || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.SubjectCode || '').toLowerCase().includes(search.toLowerCase()) ||
        (cls?.ClassName || '').toLowerCase().includes(search.toLowerCase());
      const matchesDept = filterDepartment === 'all' || cls?.Department === filterDepartment;
      const matchesLevel = filterLevel === 'all' || (cls?.Level || '').toLowerCase().includes(filterLevel.toLowerCase());
      return matchesSearch && matchesDept && matchesLevel;
    });
  }, [teacherSubjects, classes, search, filterDepartment, filterLevel]);

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
                  Teacher Curriculum &bull; المناهج المسندة
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
                المواد والمناهج الدراسية المسندة لتدريسها مع إمكانية الوصول السريع لرصد وتعديل الدرجات
              </p>
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-amber-300 block font-bold font-serif">المواد المسندة</span>
              <span className="text-xl font-black text-white font-mono">{teacherSubjects.length}</span>
            </div>
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-cyan-300 block font-bold font-serif">المراحل والصفوف</span>
              <span className="text-xl font-black text-white font-mono">{teacherClasses.length}</span>
            </div>
            <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-emerald-300 block font-bold font-serif">الحصص الأسبوعية</span>
              <span className="text-xl font-black text-white font-mono">{teacherSchedules.length}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subject by name or code (بحث في المواد)..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>

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
              <option value="Kulliyatu Shariah">كلية الشريعة (Shariah)</option>
              <option value="Kulliyatu Dawa">كلية الدعوة (Dawa)</option>
              <option value="Kulliyatu Tarbiya">كلية التربية (Tarbiya)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/grades"
              className="px-4 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-200" />
              <span>Full Grade Matrix (Excel)</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">(رصد الدرجات)</span>
            </Link>
          </div>
        </div>

        {/* Assigned Subjects & Grade Levels Grid (Exact Container matching user's screenshot) */}
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c4b68e] pb-3" dir="rtl">
            <h3 className="text-base sm:text-lg font-black text-slate-950 font-serif flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-900" />
              <span>المواد والمراحل الدراسية المسندة للأستاذ (Assigned Subjects & Grade Levels)</span>
            </h3>
            <span className="text-xs font-bold text-slate-800 font-serif">
              {filteredTeacherSubjects.length} مواد &bull; {teacherClasses.length} مراحل
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredTeacherSubjects.map(sub => {
              const cls = classes.find(c => c.ClassID === sub.ClassID);
              const subSchedules = teacherSchedules.filter(s => s.SubjectID === sub.SubjectID);

              return (
                <div
                  key={sub.SubjectID}
                  className="bg-white p-4 rounded-2xl border border-[#cfc39f] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3 text-right"
                  dir="rtl"
                >
                  <div className="space-y-2">
                    {/* Grade Level Tag (Centered / right styled as in screenshot) */}
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif">
                        مرحلة: {cls?.Level || cls?.ClassName || 'مرحلة دراسية'}
                      </span>
                      <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {cls?.Department || '5-days'}
                      </span>
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

                    <div className="text-[11px] text-slate-500 font-sans text-center">
                      <span>Class: <strong className="text-slate-800">{cls?.ClassName}</strong></span>
                    </div>
                  </div>

                  {/* Actions & Schedule counts matching screenshot */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={`/dashboard/grades?subjectId=${sub.SubjectID}&classId=${sub.ClassID}`}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 font-serif"
                      >
                        <span>الدرجات</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="font-mono text-emerald-900 font-bold text-xs">
                        {subSchedules.length} حصص/أسبوع
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/grades?subjectId=${sub.SubjectID}&classId=${sub.ClassID}`}
                      className="w-full py-2 px-3 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-98"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Edit Grades (Excel)</span>
                      <span className="font-serif text-[11px] opacity-80" dir="rtl">(تعديل ورصد الدرجات)</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTeacherSubjects.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 font-serif text-sm">
              لا توجد مواد مسندة تطابق البحث والتصفية المحددة.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Mudir Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Crown className="w-3.5 h-3.5" />
              <span>Academic Curriculum Governance (المناهج والمقررات الدراسية)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Curriculum & Subjects
            </h1>
            <p className="text-sm text-emerald-200/90 max-w-2xl">
              Configure course offerings for the 5-Days and 2-Days departments, utilize 1-click Islamic course presets, and link instructors directly to timetable periods.
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
              5-Days Curriculum
            </span>
            <span className="text-2xl font-black text-cyan-300">{stats.fiveDaysSubs}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
              2-Days Curriculum
            </span>
            <span className="text-2xl font-black text-amber-300">{stats.twoDaysSubs}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Active Allocations
            </span>
            <span className="text-2xl font-black text-emerald-400">{stats.allocatedSubs}</span>
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

      {/* Control Bar: Filters & Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects by name, Arabic title, code, or class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterDepartment('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                filterDepartment === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Depts ({subjects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterDepartment('5-days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                filterDepartment === '5-days'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              5-Days Dept ({stats.fiveDaysSubs})
            </button>
            <button
              type="button"
              onClick={() => setFilterDepartment('2-days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                filterDepartment === '2-days'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2-Days Dept ({stats.twoDaysSubs})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">All Academic Levels</option>
            <option value="Ibtidaiyyah">Ibtidaiyyah (Primary)</option>
            <option value="Mutawassit">Mutawassit (Intermediate)</option>
            <option value="Thanawi">Thanawi (Secondary)</option>
            <option value="Shariah">Kulliyatu Shariah</option>
            <option value="Dawa">Kulliyatu Dawa</option>
            <option value="Tarbiya">Kulliyatu Tarbiya</option>
          </select>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value={0}>All Classes</option>
            {classes.map((c) => (
              <option key={c.ClassID} value={c.ClassID}>
                {c.ClassName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Subjects Table View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Subject</th>
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
                    <p className="text-xs">Adjust your search query or click "+ Add New Subject" above.</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((s) => {
                  const alloc = subjectTeachers.find(
                    (st) => st.SubjectID === s.SubjectID && st.ClassID === s.ClassID
                  );
                  const teacher = alloc
                    ? teachers.find((t) => t.TeacherID === alloc.TeacherID)
                    : null;
                  const subjectSchedules = schedules.filter(
                    (sch) => sch.SubjectID === s.SubjectID && sch.ClassID === s.ClassID
                  );
                  const dept = getClassDept(s.ClassID);

                  return (
                    <tr key={s.SubjectID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{s.SubjectClass}</span>
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
                            {subjectSchedules.map((slot) => (
                              <div
                                key={slot.ID}
                                className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-mono"
                              >
                                <Calendar className="w-3 h-3 text-emerald-600" />
                                <span className="font-bold">{slot.Day}</span>
                                <span className="text-slate-500">
                                  {slot.StartTime} - {slot.EndTime}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  ({slot.Room})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No schedule set</span>
                        )}
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <Link
                            href={`/dashboard/teachers/assignments?subjectId=${s.SubjectID}&classId=${s.ClassID}`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg inline-block transition-colors"
                            title="Assign Teacher & Schedule"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Link>
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

      {/* ========================================================================= */}
      {/* INTUITIVE, SPACIOUS MODAL DIALOG: ADD / EDIT SUBJECT */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingId ? 'Edit Subject Offering' : 'Add New Curriculum Subject'}
                  </h2>
                  <p className="text-xs text-amber-200/90">
                    {editingId ? `Editing subject #${editingId}` : 'Create a course and map it to a class'}
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

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* STEP 1: DEPARTMENT & CLASS SELECTION */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  Step 1: Choose Department & Class
                </span>

                {/* Department switcher pills */}
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
                    <span className="block font-extrabold text-sm text-slate-900">5-Days Department</span>
                    <span className="text-xs text-slate-500">Ibtidaiyyah, Mutawassit, Thanawi, & 3 Colleges</span>
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
                    <span className="block font-extrabold text-sm text-slate-900">2-Days Department</span>
                    <span className="text-xs text-slate-500">Weekend / 2-days Islamic studies program</span>
                  </button>
                </div>

                {/* Academic Level Chips */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Academic Level</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Ibtidaiyyah', 'Mutawassit', 'Thanawi', 'Kulliyatu'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedLevel(lvl)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          selectedLevel === lvl
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {lvl === 'Ibtidaiyyah' && 'Ibtidaiyyah (Primary 1-6)'}
                        {lvl === 'Mutawassit' && 'Mutawassit (1-3)'}
                        {lvl === 'Thanawi' && 'Thanawi (Secondary 1-3)'}
                        {lvl === 'Kulliyatu' && 'Colleges / Kulliyat'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Class Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Target Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                  >
                    {modalAvailableClasses.map((c) => (
                      <option key={c.ClassID} value={c.ClassID}>
                        {c.ClassName} ({c.Department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 2: SUBJECT DETAILS & PRESETS */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Step 2: Subject Details & 1-Click Presets
                  </span>
                </div>

                {/* Presets chips */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Click any standard subject to auto-fill details:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {subjectPresets.map((pr) => (
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
                      onChange={(e) => setSubjectName(e.target.value)}
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
                      onChange={(e) => setSubjectArabic(e.target.value)}
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
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="e.g. FQH-101"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* STEP 3: OPTIONAL INSTANT TEACHER & TIMETABLE ALLOCATION */}
              {!editingId && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-emerald-950">
                      <input
                        type="checkbox"
                        checked={assignNow}
                        onChange={(e) => setAssignNow(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span>Assign Teacher & Timetable Slot right now (Optional)</span>
                    </label>

                    {assignNow && (
                      <div className="mt-3.5 pt-3 border-t border-emerald-200/60 space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Assigned Teacher</label>
                          <select
                            value={modalTeacherId}
                            onChange={(e) => setModalTeacherId(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                          >
                            {teachers.map((t) => (
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
                              onChange={(e) => setModalDay(e.target.value as any)}
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
                            <label className="block text-slate-600 font-semibold mb-1">Time Slot</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                value={modalStartTime}
                                onChange={(e) => setModalStartTime(e.target.value)}
                                className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                              />
                              <span>-</span>
                              <input
                                type="time"
                                value={modalEndTime}
                                onChange={(e) => setModalEndTime(e.target.value)}
                                className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Room</label>
                            <input
                              type="text"
                              value={modalRoom}
                              onChange={(e) => setModalRoom(e.target.value)}
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

              {/* Modal Footer Controls */}
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
    </div>
  );
}
