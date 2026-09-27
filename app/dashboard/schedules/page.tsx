'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  ClassScheduleItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
  SubjectTeacherItem,
} from '@/lib/types';
import {
  Calendar,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Trash2,
  Phone,
  GraduationCap,
  Building2,
  CheckCircle,
  X,
  BookOpen,
  UserCheck,
  Layers,
  ArrowUpRight,
  Filter,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export default function SchedulesPage() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId');

  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);

  // Current session
  const currentUser = AuthService.getSession();
  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // View mode: 'my-schedule' (teacher's personal schedule) vs 'all-classes'
  const [viewMode, setViewMode] = useState<'my-schedule' | 'all-classes'>(
    isTeacher ? 'my-schedule' : 'all-classes'
  );

  // Selected teacher for Admin/Mudir inspector
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(
    currentUser?.linkedId || 2
  );

  // Active teacher profile
  const activeTeacherId = isTeacher ? currentUser?.linkedId || 2 : selectedTeacherId;
  const currentTeacher = useMemo(() => {
    return (
      teachers.find(t => t.TeacherID === activeTeacherId) ||
      teachers.find(t => t.Email === currentUser?.email) ||
      teachers[1] ||
      teachers[0]
    );
  }, [teachers, activeTeacherId, currentUser]);

  // Display style: 'grid' (weekly columns) vs 'list' (detailed table)
  const [displayLayout, setDisplayLayout] = useState<'grid' | 'list'>('grid');

  // Filter states
  const [filterSubjectId, setFilterSubjectId] = useState<number>(0);
  const [filterClassId, setFilterClassId] = useState<number>(0);
  const [filterDay, setFilterDay] = useState<string>('all');

  const [selectedClassId, setSelectedClassId] = useState<number>(
    initialClassId ? Number(initialClassId) : 0
  );

  // Hover popover state
  const [hoveredTeacher, setHoveredTeacher] = useState<{
    teacher: TeacherItem;
    subject: SubjectItem;
    schedule: ClassScheduleItem;
    x: number;
    y: number;
  } | null>(null);

  // Add schedule modal state
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    ClassID: 1,
    SubjectID: 1,
    TeacherID: 1,
    Day: 'Sunday' as any,
    StartTime: '08:00',
    EndTime: '09:00',
    Room: 'Hall 101',
  });
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    const subs = DataStore.getSubjects();
    const tchs = DataStore.getTeachers();
    const stMap = DataStore.getSubjectTeachers();
    setClasses(cls);
    setSubjects(subs);
    setTeachers(tchs);
    setSubjectTeachers(stMap);
    setSchedules(DataStore.getSchedules());

    if (cls.length > 0 && selectedClassId === 0) {
      setSelectedClassId(cls[0].ClassID);
      setFormData(prev => ({
        ...prev,
        ClassID: cls[0].ClassID,
        SubjectID: subs[0]?.SubjectID || 1,
        TeacherID: tchs[0]?.TeacherID || 1,
      }));
    }
  };

  const daysList: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const daysArabic: Record<string, string> = {
    Sunday: 'الأحد (Sunday)',
    Monday: 'الإثنين (Monday)',
    Tuesday: 'الثلاثاء (Tuesday)',
    Wednesday: 'الأربعاء (Wednesday)',
    Thursday: 'الخميس (Thursday)',
    Friday: 'الجمعة (Friday)',
    Saturday: 'السبت (Saturday)',
  };

  const getClass = (cid: number) => classes.find(c => c.ClassID === cid);
  const getSubject = (sid: number) => subjects.find(s => s.SubjectID === sid);
  const getTeacher = (tid: number) => teachers.find(t => t.TeacherID === tid);

  // TEACHER'S SCHEDULE:
  // All schedules assigned to the current active teacher
  const teacherSchedules = useMemo(() => {
    if (!currentTeacher) return [];
    return schedules.filter(s => s.TeacherID === currentTeacher.TeacherID);
  }, [schedules, currentTeacher]);

  // Unique subjects taught by this teacher from schedules & mappings
  const teacherSubjects = useMemo(() => {
    const subIds = new Set<number>();
    teacherSchedules.forEach(s => subIds.add(s.SubjectID));
    if (currentTeacher) {
      subjectTeachers
        .filter(st => st.TeacherID === currentTeacher.TeacherID)
        .forEach(st => subIds.add(st.SubjectID));
    }
    return subjects.filter(s => subIds.has(s.SubjectID));
  }, [teacherSchedules, subjectTeachers, currentTeacher, subjects]);

  // Unique classes/grade levels taught by this teacher
  const teacherClasses = useMemo(() => {
    const classIds = new Set<number>();
    teacherSchedules.forEach(s => classIds.add(s.ClassID));
    if (currentTeacher) {
      subjectTeachers
        .filter(st => st.TeacherID === currentTeacher.TeacherID)
        .forEach(st => classIds.add(st.ClassID));
    }
    return classes.filter(c => classIds.has(c.ClassID));
  }, [teacherSchedules, subjectTeachers, currentTeacher, classes]);

  // Filtered teacher schedules according to dropdown filters
  const filteredTeacherSchedules = useMemo(() => {
    return teacherSchedules.filter(s => {
      if (filterSubjectId > 0 && s.SubjectID !== filterSubjectId) return false;
      if (filterClassId > 0 && s.ClassID !== filterClassId) return false;
      if (filterDay !== 'all' && s.Day !== filterDay) return false;
      return true;
    });
  }, [teacherSchedules, filterSubjectId, filterClassId, filterDay]);

  // Active schedules for 'all-classes' view
  const displayedClassSchedules = selectedClassId === 0
    ? schedules
    : schedules.filter(s => s.ClassID === selectedClassId);

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const res = DataStore.saveSchedule({
      ClassID: Number(formData.ClassID),
      SubjectID: Number(formData.SubjectID),
      TeacherID: Number(formData.TeacherID),
      Day: formData.Day,
      StartTime: formData.StartTime,
      EndTime: formData.EndTime,
      Room: formData.Room || 'Lecture Room',
    });

    if (!res.success) {
      setConflictError(res.conflict || 'Schedule conflict detected!');
      return;
    }

    setSuccessMsg('Class schedule session created successfully!');
    setIsAdding(false);
    loadData();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this timetable session?')) {
      DataStore.deleteSchedule(id);
      loadData();
    }
  };

  // Conflict detection overview across the entire institution
  const detectInstitutionConflicts = () => {
    const conflicts: { teacher: TeacherItem; day: string; time: string; classes: string[] }[] = [];
    teachers.forEach(teacher => {
      daysList.forEach(day => {
        const teacherSlots = schedules.filter(s => s.TeacherID === teacher.TeacherID && s.Day === day);
        const timeMap: Record<string, number[]> = {};
        teacherSlots.forEach(s => {
          if (!timeMap[s.StartTime]) timeMap[s.StartTime] = [];
          timeMap[s.StartTime].push(s.ClassID);
        });

        Object.entries(timeMap).forEach(([time, cIds]) => {
          if (cIds.length > 1) {
            const classNames = cIds.map(cid => getClass(cid)?.ClassName || `Class #${cid}`);
            conflicts.push({
              teacher,
              day,
              time,
              classes: classNames,
            });
          }
        });
      });
    });
    return conflicts;
  };

  const activeConflicts = detectInstitutionConflicts();

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-800" />
            <span>Class Timetable & Teacher Schedules</span>
          </h1>
          <p className="text-sm text-slate-500">
            View assigned weekly schedules, corresponding teaching subjects, and academic grade levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Link to Grades tab */}
          <Link
            href="/dashboard/grades"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to Grades (رصد الدرجات)</span>
          </Link>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setConflictError(null);
                setIsAdding(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Schedule Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Real-time Conflict Alert Banner */}
      {activeConflicts.length > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Schedule Overlap Conflict Warning ({activeConflicts.length} Detected)</span>
          </div>
          <p className="text-xs text-amber-800">
            The system detected simultaneous teaching assignments for faculty members:
          </p>
          <div className="space-y-1 pl-6 text-xs text-amber-900">
            {activeConflicts.map((c, i) => (
              <div key={i} className="list-disc">
                &bull; <span className="font-bold">{c.teacher.Name}</span> scheduled concurrently on{' '}
                <span className="font-semibold">{c.day} at {c.time}</span> across: {c.classes.join(' and ')}.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Switcher: Teacher's Personal Schedule vs All Classes */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {/* Tab 1: Teacher's Personal Schedule */}
          <button
            type="button"
            onClick={() => setViewMode('my-schedule')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'my-schedule'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-300" />
            <span>
              {isTeacher
                ? 'جدولي الشخصي وموادي (My Schedule & Subjects)'
                : 'جدول الأستاذ المختار (Teacher Schedule)'}
            </span>
          </button>

          {/* Tab 2: All Classes Timetable */}
          <button
            type="button"
            onClick={() => setViewMode('all-classes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'all-classes'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>جدول كافة الصفوف (All Classes Timetable)</span>
          </button>
        </div>

        {/* Admin/Mudir Teacher Selector */}
        {viewMode === 'my-schedule' && canManage && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">View Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(Number(e.target.value))}
              className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              {teachers.map(t => (
                <option key={t.TeacherID} value={t.TeacherID}>
                  {t.NameArabic || t.Name} &bull; {t.Name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Layout toggle (Grid vs List) */}
        {viewMode === 'my-schedule' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setDisplayLayout('grid')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                displayLayout === 'grid'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Grid (أسبوعي)
            </button>
            <button
              type="button"
              onClick={() => setDisplayLayout('list')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                displayLayout === 'list'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed List (جدول مفصل)
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: TEACHER'S PERSONAL SCHEDULE & SUBJECTS & GRADE LEVEL           */}
      {/* ========================================================================= */}
      {viewMode === 'my-schedule' && (
        <div className="space-y-6">
          {/* Teacher Profile & Timetable Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-800 flex items-center justify-center flex-shrink-0">
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
                    Faculty Schedule &bull; الجدول الدراسي
                  </span>
                  <span className="text-xs text-emerald-300 font-medium">
                    JMAA-MoritAko
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                  <span>{currentTeacher?.Name || 'Ryan Madid'}</span>
                  {currentTeacher?.NameArabic && (
                    <span className="text-amber-300 font-serif font-normal text-lg" dir="rtl">
                      ({currentTeacher.NameArabic})
                    </span>
                  )}
                </h1>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  جدول الحصص الأسبوعية والمواد المسندة والمراحل الدراسية الخاصة بالأستاذ
                </p>
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-950/60 border border-emerald-700/50 rounded-2xl px-4 py-2 text-center">
                <span className="text-[11px] text-emerald-300 block font-bold uppercase">الحصص الأسبوعية</span>
                <span className="text-xl font-black text-white font-mono">{teacherSchedules.length}</span>
              </div>
              <div className="bg-slate-950/60 border border-emerald-700/50 rounded-2xl px-4 py-2 text-center">
                <span className="text-[11px] text-amber-300 block font-bold uppercase">المواد المسندة</span>
                <span className="text-xl font-black text-white font-mono">{teacherSubjects.length}</span>
              </div>
              <div className="bg-slate-950/60 border border-emerald-700/50 rounded-2xl px-4 py-2 text-center">
                <span className="text-[11px] text-cyan-300 block font-bold uppercase">المراحل والصفوف</span>
                <span className="text-xl font-black text-white font-mono">{teacherClasses.length}</span>
              </div>
            </div>
          </div>

          {/* Corresponding Teaching Subjects & Grade Levels Overview Bar */}
          <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between" dir="rtl">
              <h3 className="text-base font-black text-slate-950 font-serif flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-900" />
                <span>المواد والمراحل الدراسية المسندة للأستاذ (Assigned Subjects & Grade Levels)</span>
              </h3>
              <span className="text-xs font-bold text-slate-700">
                {teacherSubjects.length} مواد &bull; {teacherClasses.length} مراحل
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {teacherSubjects.map(sub => {
                const cls = getClass(sub.ClassID);
                const subSchedules = teacherSchedules.filter(s => s.SubjectID === sub.SubjectID);

                return (
                  <div
                    key={sub.SubjectID}
                    className="bg-white p-3.5 rounded-2xl border border-[#cfc39f] shadow-xs flex flex-col justify-between space-y-2 text-right"
                    dir="rtl"
                  >
                    <div>
                      {/* Grade Level Tag */}
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif mb-1">
                        مرحلة: {cls?.Level || cls?.ClassName || 'مرحلة دراسية'}
                      </span>

                      {/* Subject Name */}
                      <h4 className="text-base font-bold text-slate-950 font-serif">
                        {sub.SubjectArabic || sub.SubjectClass}
                      </h4>
                      <p className="text-xs text-slate-500 font-sans" dir="ltr">
                        {sub.SubjectClass} {sub.SubjectCode && `(${sub.SubjectCode})`}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-emerald-800 font-bold">
                        {subSchedules.length} حصص/أسبوع
                      </span>
                      <Link
                        href="/dashboard/grades"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                      >
                        <span>الدرجات</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>تصفية (Filter):</span>
              </span>

              {/* Filter by Subject */}
              <select
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(Number(e.target.value))}
                className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={0}>كافة المواد (All Subjects)</option>
                {teacherSubjects.map(s => (
                  <option key={s.SubjectID} value={s.SubjectID}>
                    {s.SubjectArabic || s.SubjectClass} ({s.SubjectClass})
                  </option>
                ))}
              </select>

              {/* Filter by Grade Level / Class */}
              <select
                value={filterClassId}
                onChange={e => setFilterClassId(Number(e.target.value))}
                className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={0}>كافة المراحل والصفوف (All Grade Levels)</option>
                {teacherClasses.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>
                    {c.ClassName} &bull; [{c.Department.toUpperCase()}]
                  </option>
                ))}
              </select>

              {/* Filter by Day */}
              <select
                value={filterDay}
                onChange={e => setFilterDay(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">كافة أيام الأسبوع (All Days)</option>
                {daysList.map(d => (
                  <option key={d} value={d}>
                    {daysArabic[d]}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-500 font-bold font-mono">
              عرض {filteredTeacherSchedules.length} من أصل {teacherSchedules.length} حصة
            </span>
          </div>

          {/* VIEW OPTION 1: WEEKLY GRID VIEW */}
          {displayLayout === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {daysList.map(day => {
                const daySlots = filteredTeacherSchedules.filter(s => s.Day === day);
                daySlots.sort((a, b) => a.StartTime.localeCompare(b.StartTime));

                return (
                  <div
                    key={day}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-xs"
                  >
                    {/* Day Column Header */}
                    <div className="bg-slate-900 text-white p-3 text-center">
                      <span className="font-bold text-xs uppercase tracking-wider block">{day}</span>
                      <span className="text-[10px] text-amber-300 font-serif">{daysArabic[day].split(' ')[0]}</span>
                    </div>

                    <div className="p-2 space-y-2 flex-1 min-h-[180px] bg-slate-50/50">
                      {daySlots.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs italic py-8">
                          لا توجد حصص
                        </div>
                      ) : (
                        daySlots.map(slot => {
                          const sub = getSubject(slot.SubjectID);
                          const cls = getClass(slot.ClassID);

                          return (
                            <div
                              key={slot.ID}
                              className="bg-[#dfd4b8] border-2 border-[#ccbf99] p-3 rounded-2xl shadow-xs hover:shadow-md transition-all text-right group space-y-2"
                              dir="rtl"
                            >
                              {/* Time & Room */}
                              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-950 font-bold pb-1 border-b border-[#c4b68e]">
                                <span className="flex items-center gap-1" dir="ltr">
                                  <Clock className="w-3 h-3 text-emerald-800" />
                                  {slot.StartTime} - {slot.EndTime}
                                </span>
                                <span className="text-slate-700 bg-white/60 px-1.5 py-0.5 rounded text-[10px]">
                                  {slot.Room}
                                </span>
                              </div>

                              {/* Grade Level Tag (Prominently shown as requested!) */}
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-[#b79e55] text-slate-950 font-serif">
                                  مرحلة: {cls?.Level || cls?.ClassName}
                                </span>
                                <span className="block text-[11px] text-slate-700 font-sans font-medium mt-0.5" dir="ltr">
                                  {cls?.ClassName}
                                </span>
                              </div>

                              {/* Corresponding Subject */}
                              <div className="pt-1">
                                <h5 className="text-sm font-black text-slate-950 font-serif">
                                  {sub?.SubjectArabic || sub?.SubjectClass}
                                </h5>
                                <span className="text-[10px] text-slate-600 block font-sans" dir="ltr">
                                  {sub?.SubjectClass} {sub?.SubjectCode && `(${sub.SubjectCode})`}
                                </span>
                              </div>

                              {/* Quick link to grades */}
                              <div className="pt-1.5 border-t border-[#c4b68e]/80 flex items-center justify-between">
                                <Link
                                  href="/dashboard/grades"
                                  className="w-full py-1 text-[11px] font-bold text-center bg-white/80 hover:bg-white text-emerald-900 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1"
                                >
                                  <BookOpen className="w-3 h-3 text-emerald-700" />
                                  <span>رصد درجات الصف</span>
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW OPTION 2: DETAILED TABLE LIST VIEW */}
          {displayLayout === 'list' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm" dir="rtl">
                  <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
                    <tr>
                      <th className="py-3 px-4 text-center">اليوم (Day)</th>
                      <th className="py-3 px-4 text-center">الوقت (Time)</th>
                      <th className="py-3 px-4 text-right">المادة الدراسية (Subject)</th>
                      <th className="py-3 px-4 text-right">المرحلة والصف (Grade Level & Class)</th>
                      <th className="py-3 px-4 text-center">القاعة (Room)</th>
                      <th className="py-3 px-4 text-center">القسم (Dept)</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTeacherSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          لا توجد حصص مسجلة تطابق التصفية الحالية.
                        </td>
                      </tr>
                    ) : (
                      filteredTeacherSchedules.map(slot => {
                        const sub = getSubject(slot.SubjectID);
                        const cls = getClass(slot.ClassID);

                        return (
                          <tr key={slot.ID} className="hover:bg-slate-50 transition-colors">
                            {/* Day */}
                            <td className="py-3 px-4 text-center font-bold text-slate-900">
                              <span className="font-serif">{daysArabic[slot.Day].split(' ')[0]}</span>
                              <span className="text-[11px] text-slate-400 block font-sans" dir="ltr">
                                {slot.Day}
                              </span>
                            </td>

                            {/* Time */}
                            <td className="py-3 px-4 text-center font-mono font-bold text-xs text-emerald-900">
                              <span className="inline-flex items-center gap-1" dir="ltr">
                                <Clock className="w-3 h-3 text-emerald-700" />
                                {slot.StartTime} - {slot.EndTime}
                              </span>
                            </td>

                            {/* Corresponding Subject */}
                            <td className="py-3 px-4 text-right">
                              <span className="font-bold text-slate-950 font-serif text-base block">
                                {sub?.SubjectArabic || sub?.SubjectClass}
                              </span>
                              <span className="text-xs text-slate-500 font-sans" dir="ltr">
                                {sub?.SubjectClass} {sub?.SubjectCode && `(${sub.SubjectCode})`}
                              </span>
                            </td>

                            {/* Grade Level & Class */}
                            <td className="py-3 px-4 text-right">
                              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-black bg-amber-100 text-amber-900 font-serif mb-0.5">
                                مرحلة: {cls?.Level || cls?.ClassName}
                              </span>
                              <span className="text-xs font-bold text-slate-800 block">
                                {cls?.ClassName}
                              </span>
                            </td>

                            {/* Room */}
                            <td className="py-3 px-4 text-center font-mono text-xs text-slate-700">
                              {slot.Room}
                            </td>

                            {/* Department */}
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                                {cls?.Department || '5-days'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-center">
                              <Link
                                href="/dashboard/grades"
                                className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                                <span>رصد الدرجات</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: ALL CLASSES TIMETABLE                                          */}
      {/* ========================================================================= */}
      {viewMode === 'all-classes' && (
        <div className="space-y-6">
          {/* Filter / Selector Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter By Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white max-w-xs"
              >
                <option value={0}>All Classes (All Departments)</option>
                {classes.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>
                    [{c.Department.toUpperCase()}] {c.ClassName}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-500 font-bold font-mono">
              Showing {displayedClassSchedules.length} scheduled periods
            </span>
          </div>

          {/* Weekly Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {daysList.map(day => {
              const daySlots = displayedClassSchedules.filter(s => s.Day === day);
              daySlots.sort((a, b) => a.StartTime.localeCompare(b.StartTime));

              return (
                <div key={day} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-xs">
                  <div className="bg-slate-900 text-white p-3 text-center">
                    <span className="font-bold text-xs uppercase tracking-wider block">{day}</span>
                    <span className="text-[10px] text-amber-300 font-serif">{daysArabic[day].split(' ')[0]}</span>
                  </div>

                  <div className="p-2 space-y-2 flex-1 min-h-[160px] bg-slate-50/50">
                    {daySlots.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs italic py-8">
                        No classes
                      </div>
                    ) : (
                      daySlots.map(slot => {
                        const sub = getSubject(slot.SubjectID);
                        const tch = getTeacher(slot.TeacherID);
                        const cls = getClass(slot.ClassID);

                        return (
                          <div
                            key={slot.ID}
                            onMouseEnter={(e) => {
                              if (tch && sub) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredTeacher({
                                  teacher: tch,
                                  subject: sub,
                                  schedule: slot,
                                  x: rect.right + 10,
                                  y: rect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredTeacher(null)}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer relative group"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-800 font-bold mb-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {slot.StartTime} - {slot.EndTime}
                              </span>
                              <span className="text-slate-400 truncate max-w-[60px]">{slot.Room}</span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 line-clamp-2">
                              {sub ? sub.SubjectArabic || sub.SubjectClass : 'Subject'}
                            </h5>

                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span className="truncate font-medium text-slate-700">
                                {tch ? tch.NameArabic || tch.Name : 'Teacher'}
                              </span>
                              {canManage && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(slot.ID);
                                  }}
                                  className="text-slate-300 hover:text-red-600 transition-colors p-0.5"
                                  title="Delete Slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {cls && (
                              <div className="mt-1 text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded truncate">
                                {cls.ClassName}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Interactive Hover Tooltip for Teacher Details */}
      {hoveredTeacher && (
        <div
          className="fixed z-50 pointer-events-none transition-all"
          style={{
            top: Math.min(hoveredTeacher.y, window.innerHeight - 250),
            left: Math.min(hoveredTeacher.x, window.innerWidth - 320),
          }}
        >
          <div className="w-72 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-800 flex-shrink-0 flex items-center justify-center font-bold text-white text-base">
                {hoveredTeacher.teacher.ProfilePic ? (
                  <img src={hoveredTeacher.teacher.ProfilePic} alt={hoveredTeacher.teacher.Name} className="w-full h-full object-cover" />
                ) : (
                  hoveredTeacher.teacher.Name[0]
                )}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                  Assigned Faculty
                </span>
                <h6 className="font-extrabold text-sm text-white truncate">
                  {hoveredTeacher.teacher.Name}
                </h6>
                {hoveredTeacher.teacher.NameArabic && (
                  <p className="text-xs text-amber-200 font-serif truncate">
                    {hoveredTeacher.teacher.NameArabic}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-t border-slate-800 pt-2.5 text-slate-300">
              <p><span className="text-slate-400 font-semibold">Subject:</span> {hoveredTeacher.subject.SubjectArabic || hoveredTeacher.subject.SubjectClass}</p>
              <p><span className="text-slate-400 font-semibold">Degree:</span> {hoveredTeacher.teacher.Degree}</p>
              <p><span className="text-slate-400 font-semibold">Faculty ID:</span> {hoveredTeacher.teacher.IdNumber}</p>
              {hoveredTeacher.teacher.MobileNumber && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Phone className="w-3 h-3" /> {hoveredTeacher.teacher.MobileNumber}
                </p>
              )}
            </div>

            <div className="text-[10px] text-amber-400/90 italic bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              &bull; {hoveredTeacher.schedule.Day} from {hoveredTeacher.schedule.StartTime} to {hoveredTeacher.schedule.EndTime} ({hoveredTeacher.schedule.Room})
            </div>
          </div>
        </div>
      )}

      {/* Add Timetable Slot Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Add Class Schedule Slot</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Class</label>
                <select
                  value={formData.ClassID}
                  onChange={(e) => setFormData({ ...formData, ClassID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {classes.map(c => (
                    <option key={c.ClassID} value={c.ClassID}>
                      [{c.Department.toUpperCase()}] {c.ClassName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                <select
                  value={formData.SubjectID}
                  onChange={(e) => setFormData({ ...formData, SubjectID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {subjects.map(s => (
                    <option key={s.SubjectID} value={s.SubjectID}>{s.SubjectClass}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Teacher</label>
                <select
                  value={formData.TeacherID}
                  onChange={(e) => setFormData({ ...formData, TeacherID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {teachers.map(t => (
                    <option key={t.TeacherID} value={t.TeacherID}>{t.Name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Day of Week</label>
                  <select
                    value={formData.Day}
                    onChange={(e) => setFormData({ ...formData, Day: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {daysList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={formData.Room}
                    onChange={(e) => setFormData({ ...formData, Room: e.target.value })}
                    placeholder="e.g. Hall 101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.StartTime}
                    onChange={(e) => setFormData({ ...formData, StartTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.EndTime}
                    onChange={(e) => setFormData({ ...formData, EndTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow cursor-pointer"
                >
                  Confirm Slot
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
